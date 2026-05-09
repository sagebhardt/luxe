import "server-only";
import { generateObject } from "ai";
import { z } from "zod";
import {
  and,
  asc,
  desc,
  eq,
  gt,
  gte,
  ilike,
  inArray,
  lt,
  lte,
  ne,
  type SQL,
} from "drizzle-orm";
import { db } from "@/lib/db";
import {
  clients,
  trips,
  type clients as clientsTable,
  type trips as tripsTable,
} from "@/lib/db/schema";
import { resolveAgent } from "@/lib/ai/registry";

/**
 * Conversational CRM Query
 *
 * Operator types natural language; Gemini emits a CONSTRAINED
 * structured query plan; we translate and execute via Drizzle. The
 * model never writes SQL. Each field/op combination is allowlisted
 * server-side so a hostile (or hallucinating) model can't reach
 * tables it shouldn't.
 */

const FilterSchema = z.object({
  field: z.string(),
  op: z.enum(["eq", "ne", "gt", "gte", "lt", "lte", "ilike", "in"]),
  /* Values are strings/numbers/string-arrays. Dates are passed as
   * ISO yyyy-mm-dd strings. */
  value: z.union([z.string(), z.number(), z.array(z.string())]),
});

export const QueryPlanSchema = z.object({
  intent: z.string().describe("1-sentence restatement of the operator's question"),
  table: z.enum(["clients", "trips"]),
  filters: z.array(FilterSchema).max(8),
  orderBy: z
    .object({
      field: z.string(),
      direction: z.enum(["asc", "desc"]),
    })
    .nullable(),
  limit: z.number().int().min(1).max(50),
  reasoning: z.string(),
});

export type QueryPlan = z.infer<typeof QueryPlanSchema>;

/* Field allowlist per table. Only these can appear in filters/order. */
const ALLOWED: Record<
  "clients" | "trips",
  Record<string, "string" | "number" | "enum" | "date">
> = {
  clients: {
    name: "string",
    tag: "enum",
    lifetimeValueCents: "number",
    npsScore: "number",
  },
  trips: {
    name: "string",
    destination: "string",
    status: "enum",
    startDate: "date",
    endDate: "date",
    travelerCount: "number",
    budgetCents: "number",
  },
};

const ENUM_VALUES: Record<string, string[]> = {
  "clients.tag": ["vip", "active", "prospect", "dormant"],
  "trips.status": ["draft", "active", "pending", "completed", "archived"],
};

const QUERY_SYSTEM_PROMPT = `You translate operator questions into a constrained CRM query plan. Output JSON only — never SQL.

Allowed tables and fields:
  clients: name (string), tag (enum: vip|active|prospect|dormant), lifetimeValueCents (number, USD cents — e.g. $50,000 → 5000000), npsScore (number 0–100)
  trips: name (string), destination (string), status (enum: draft|active|pending|completed|archived), startDate (date 'YYYY-MM-DD'), endDate (date), travelerCount (number), budgetCents (number — same convention)

Operators: eq, ne, gt, gte, lt, lte, ilike (substring match for strings — wrap value yourself with %s, e.g. "%Tokyo%"), in (value is an array of strings).

Translate dollar values into cents. Translate "VIP", "VIPs", "vip" all to tag='vip'. Translate "dormant", "lapsed" → tag='dormant'. Translate "high-NPS" → npsScore >= 9 (or 90 if reasoning at percentage scale — use 9 since values are 0-10 OR 0-100 depending on context; for Luxe NPS is 0-100, so use >= 80 for 'high').

If the question is ambiguous, pick the closest reasonable interpretation and explain it in 'reasoning'. Never refuse — produce your best plan.`;

export class CrmQueryError extends Error {}

export async function runCrmQuery(question: string) {
  if (!question.trim()) {
    throw new CrmQueryError("Empty question");
  }

  const resolved = await resolveAgent("crm_query");

  const { object: plan } = await generateObject({
    model: resolved.model,
    schema: QueryPlanSchema,
    system: QUERY_SYSTEM_PROMPT,
    prompt: question,
    temperature: resolved.settings?.temperature ?? 0.2,
  });

  validatePlan(plan);
  const rows = await executePlan(plan);
  return { plan, rows };
}

function validatePlan(plan: QueryPlan) {
  const fields = ALLOWED[plan.table];
  for (const f of plan.filters) {
    if (!(f.field in fields)) {
      throw new CrmQueryError(
        `Field "${f.field}" not allowed on table "${plan.table}". Allowed: ${Object.keys(fields).join(", ")}.`,
      );
    }
    const kind = fields[f.field];
    if (kind === "enum") {
      const enumKey = `${plan.table}.${f.field}`;
      const values = Array.isArray(f.value) ? f.value : [f.value];
      for (const v of values) {
        if (!ENUM_VALUES[enumKey]?.includes(String(v))) {
          throw new CrmQueryError(
            `Value "${v}" not allowed for ${enumKey}. Allowed: ${ENUM_VALUES[enumKey]?.join(", ")}.`,
          );
        }
      }
    }
  }
  if (plan.orderBy && !(plan.orderBy.field in fields)) {
    throw new CrmQueryError(
      `Cannot order by "${plan.orderBy.field}" on "${plan.table}".`,
    );
  }
}

type ClientRow = typeof clientsTable.$inferSelect;
type TripRow = typeof tripsTable.$inferSelect;

async function executePlan(plan: QueryPlan): Promise<ClientRow[] | TripRow[]> {
  const conditions: SQL[] = [];

  for (const f of plan.filters) {
    const col =
      plan.table === "clients"
        ? // @ts-expect-error — already validated against allowlist
          clients[f.field]
        : // @ts-expect-error — already validated against allowlist
          trips[f.field];
    if (!col) continue;
    const v = f.value;
    switch (f.op) {
      case "eq":
        conditions.push(eq(col, Array.isArray(v) ? v[0] : v));
        break;
      case "ne":
        conditions.push(ne(col, Array.isArray(v) ? v[0] : v));
        break;
      case "gt":
        conditions.push(gt(col, Array.isArray(v) ? v[0] : v));
        break;
      case "gte":
        conditions.push(gte(col, Array.isArray(v) ? v[0] : v));
        break;
      case "lt":
        conditions.push(lt(col, Array.isArray(v) ? v[0] : v));
        break;
      case "lte":
        conditions.push(lte(col, Array.isArray(v) ? v[0] : v));
        break;
      case "ilike":
        conditions.push(ilike(col, String(Array.isArray(v) ? v[0] : v)));
        break;
      case "in": {
        const arr = Array.isArray(v) ? v : [String(v)];
        conditions.push(inArray(col, arr));
        break;
      }
    }
  }

  const where = conditions.length ? and(...conditions) : undefined;

  let order;
  if (plan.orderBy) {
    const col =
      plan.table === "clients"
        ? // @ts-expect-error — validated
          clients[plan.orderBy.field]
        : // @ts-expect-error — validated
          trips[plan.orderBy.field];
    if (col) order = plan.orderBy.direction === "asc" ? asc(col) : desc(col);
  }

  if (plan.table === "clients") {
    let q = db.select().from(clients).$dynamic();
    if (where) q = q.where(where);
    if (order) q = q.orderBy(order);
    return await q.limit(plan.limit);
  } else {
    let q = db.select().from(trips).$dynamic();
    if (where) q = q.where(where);
    if (order) q = q.orderBy(order);
    return await q.limit(plan.limit);
  }
}
