import "server-only";
import { and, desc, eq, isNull, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  activityLog,
  clients,
  proactiveAlerts,
  trips,
} from "@/lib/db/schema";

/**
 * Proactive Monitor
 *
 * Daily scan over the client book. For each client, runs a set of rule
 * checks and persists `proactive_alerts` rows. Idempotent via dedupe
 * keys — running twice in a day won't duplicate alerts.
 *
 * Rules:
 *  - anniversary       — clientSince anniversary within next 14 days
 *  - trip_imminent     — active/pending trip starting within 7 days
 *  - dormancy          — tag=dormant OR no activity > 90 days
 *  - nps_attention     — npsScore < 70
 *  - high_value_inactive — LTV > $30k AND no activity > 60 days
 */

export type MonitorRunResult = {
  clientsScanned: number;
  alertsCreated: number;
  alertsByKind: Record<string, number>;
};

const TODAY_OFFSET_MS = 24 * 60 * 60 * 1000;

export async function runProactiveMonitor(): Promise<MonitorRunResult> {
  const allClients = await db.select().from(clients);
  const now = new Date();

  /* Pull last activity per client in one query for cheap lookup. */
  const lastActivity = await db
    .select({
      clientId: activityLog.clientId,
      latest: sql<Date>`max(${activityLog.occurredAt})`,
    })
    .from(activityLog)
    .groupBy(activityLog.clientId);
  const lastActMap = new Map(
    lastActivity.map((r) => [r.clientId, new Date(r.latest)]),
  );

  /* Active/pending trips for trip_imminent rule. */
  const upcomingTrips = await db
    .select()
    .from(trips)
    .where(or(eq(trips.status, "active"), eq(trips.status, "pending")));
  const tripsByClient = new Map<string, typeof upcomingTrips>();
  for (const t of upcomingTrips) {
    const arr = tripsByClient.get(t.clientId) ?? [];
    arr.push(t);
    tripsByClient.set(t.clientId, arr);
  }

  let alertsCreated = 0;
  const byKind: Record<string, number> = {};

  for (const c of allClients) {
    const proposed = composeAlerts({
      client: c,
      now,
      lastActivityAt: lastActMap.get(c.id) ?? null,
      upcoming: tripsByClient.get(c.id) ?? [],
    });

    for (const a of proposed) {
      /* Skip if a non-resolved/non-dismissed alert with same dedupeKey
       * already exists for this client. */
      const existing = await db.query.proactiveAlerts.findFirst({
        where: and(
          eq(proactiveAlerts.clientId, c.id),
          eq(proactiveAlerts.kind, a.kind),
          eq(proactiveAlerts.dedupeKey, a.dedupeKey),
          isNull(proactiveAlerts.dismissedAt),
        ),
      });
      if (existing) continue;
      await db.insert(proactiveAlerts).values({
        clientId: c.id,
        kind: a.kind,
        severity: a.severity,
        title: a.title,
        body: a.body,
        suggestedAction: a.suggestedAction,
        dedupeKey: a.dedupeKey,
        detail: a.detail,
      });
      alertsCreated++;
      byKind[a.kind] = (byKind[a.kind] ?? 0) + 1;
    }
  }

  return {
    clientsScanned: allClients.length,
    alertsCreated,
    alertsByKind: byKind,
  };
}

type Composed = {
  kind: typeof proactiveAlerts.$inferInsert.kind;
  severity: NonNullable<typeof proactiveAlerts.$inferInsert.severity>;
  title: string;
  body: string;
  suggestedAction: string;
  dedupeKey: string;
  detail: Record<string, unknown>;
};

function composeAlerts(input: {
  client: typeof clients.$inferSelect;
  now: Date;
  lastActivityAt: Date | null;
  upcoming: (typeof trips.$inferSelect)[];
}): Composed[] {
  const { client, now, lastActivityAt, upcoming } = input;
  const out: Composed[] = [];
  const todayIso = now.toISOString().slice(0, 10);

  /* Anniversary */
  if (client.clientSince) {
    const since = new Date(client.clientSince + "T00:00:00");
    const thisYear = new Date(now.getFullYear(), since.getMonth(), since.getDate());
    if (thisYear < now) thisYear.setFullYear(now.getFullYear() + 1);
    const days = Math.round(
      (thisYear.getTime() - now.getTime()) / TODAY_OFFSET_MS,
    );
    if (days >= 0 && days <= 14) {
      const years = thisYear.getFullYear() - since.getFullYear();
      out.push({
        kind: "anniversary",
        severity: "info",
        title: `${years}-year client anniversary in ${days === 0 ? "0 days (today)" : `${days} day${days === 1 ? "" : "s"}`}`,
        body: `${client.name} has been a client since ${monthYear(since)}. A small acknowledgement goes a long way at this milestone.`,
        suggestedAction:
          "Send a hand-written note or a curated gift tied to their preferred destinations.",
        dedupeKey: `anniversary:${thisYear.toISOString().slice(0, 10)}`,
        detail: { years, anniversaryDate: thisYear.toISOString().slice(0, 10) },
      });
    }
  }

  /* Trip imminent */
  for (const t of upcoming) {
    if (!t.startDate) continue;
    const start = new Date(t.startDate + "T00:00:00");
    const days = Math.round((start.getTime() - now.getTime()) / TODAY_OFFSET_MS);
    if (days >= 0 && days <= 7) {
      out.push({
        kind: "trip_imminent",
        severity: days <= 2 ? "urgent" : "warn",
        title: `${t.name} starts in ${days === 0 ? "today" : `${days} day${days === 1 ? "" : "s"}`}`,
        body: `${client.name}'s ${t.destination} trip departs ${t.startDate}. Confirm pending decisions and send the final brief.`,
        suggestedAction:
          "Run /trip, resolve any pending agent decisions, then share the trip page with the client.",
        dedupeKey: `trip_imminent:${t.id}:${t.startDate}`,
        detail: { tripId: t.id, startDate: t.startDate },
      });
    }
  }

  /* Dormancy */
  const daysInactive = lastActivityAt
    ? Math.round((now.getTime() - lastActivityAt.getTime()) / TODAY_OFFSET_MS)
    : null;
  if (
    client.tag === "dormant" ||
    (daysInactive != null && daysInactive >= 90)
  ) {
    out.push({
      kind: "dormancy",
      severity: "warn",
      title: `Quiet for ${daysInactive ?? "90+"} day${daysInactive === 1 ? "" : "s"}`,
      body: `${client.name} hasn't had logged activity recently. Worth a short, no-ask check-in.`,
      suggestedAction: "Draft outreach from the AI insight panel.",
      dedupeKey: `dormancy:${todayIso.slice(0, 7)}`,
      detail: { daysInactive },
    });
  }

  /* NPS attention */
  if (client.npsScore != null && client.npsScore < 70) {
    out.push({
      kind: "nps_attention",
      severity: "warn",
      title: `NPS ${client.npsScore} — below threshold`,
      body: `${client.name}'s last NPS score is ${client.npsScore}. Surface what went wrong on the last trip and what would change the read.`,
      suggestedAction:
        "Open the client briefing and look at the last trip review or call notes.",
      dedupeKey: `nps_attention:${client.npsScore}`,
      detail: { nps: client.npsScore },
    });
  }

  /* High-value inactive */
  if (
    client.lifetimeValueCents >= 30_000 * 100 &&
    daysInactive != null &&
    daysInactive >= 60
  ) {
    out.push({
      kind: "high_value_inactive",
      severity: "urgent",
      title: `High LTV — quiet ${daysInactive} days`,
      body: `${client.name} (LTV $${(client.lifetimeValueCents / 100).toLocaleString("en-US")}) has gone quiet. They're worth proactive attention before the relationship cools.`,
      suggestedAction:
        "Prepare briefing → draft outreach with a Next Trip Signal angle.",
      dedupeKey: `high_value_inactive:${todayIso.slice(0, 7)}`,
      detail: { daysInactive, ltv: client.lifetimeValueCents },
    });
  }

  return out;
}

function monthYear(d: Date): string {
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  return `${months[d.getMonth()]} ${d.getFullYear()}`;
}

void desc;
