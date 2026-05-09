import "server-only";
import { and, asc, desc, eq, ilike, isNotNull, sql, type SQL } from "drizzle-orm";
import { db } from "@/lib/db";
import { suppliers, type supplierKind, type priceTier } from "@/lib/db/schema";
import { embedText } from "@/lib/ai/embeddings";

export type SupplierKind = (typeof supplierKind.enumValues)[number];
export type PriceTier = (typeof priceTier.enumValues)[number];

/**
 * Hybrid filter on the supplier directory. ~90% of agent and admin
 * queries are covered by structured fields (kind, city, amenities);
 * we lean on Postgres GIN + B-tree indexes rather than vector search
 * for v1.
 */
export type SupplierFilter = {
  kind?: SupplierKind;
  city?: string;
  country?: string;
  amenities?: string[];
  preferredOnly?: boolean;
  virtuosoOnly?: boolean;
  priceTier?: PriceTier;
  /** Case-insensitive substring match on name. */
  search?: string;
};

export async function listSuppliers(filter: SupplierFilter = {}) {
  const conditions: SQL[] = [];
  if (filter.kind) conditions.push(eq(suppliers.kind, filter.kind));
  if (filter.city) conditions.push(ilike(suppliers.city, `%${filter.city}%`));
  if (filter.country) conditions.push(ilike(suppliers.country, `%${filter.country}%`));
  if (filter.priceTier) conditions.push(eq(suppliers.priceTier, filter.priceTier));
  if (filter.preferredOnly) conditions.push(eq(suppliers.preferred, true));
  if (filter.virtuosoOnly) conditions.push(eq(suppliers.virtuoso, true));
  if (filter.amenities && filter.amenities.length > 0) {
    /* Postgres array containment via raw SQL — Drizzle doesn't have a
     * first-class @> operator helper for text[]. */
    conditions.push(
      sql`${suppliers.amenities} @> ${filter.amenities}::text[]`,
    );
  }
  if (filter.search?.trim()) {
    conditions.push(ilike(suppliers.name, `%${filter.search.trim()}%`));
  }

  return db
    .select()
    .from(suppliers)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(suppliers.preferred), asc(suppliers.name));
}

export async function getSupplier(id: string) {
  const [row] = await db
    .select()
    .from(suppliers)
    .where(eq(suppliers.id, id))
    .limit(1);
  return row ?? null;
}

/**
 * Curated short list for an agent prompt: top N suppliers matching
 * the destination/kind. Hybrid: structured destination filter, then
 * preferred → virtuoso → name. Used by hotel/dining/itinerary agents
 * to ground proposals in Odylic's actual supplier relationships.
 */
export async function suggestSuppliersForAgent(opts: {
  kind: SupplierKind;
  destination?: string;
  limit?: number;
}) {
  const conditions: SQL[] = [eq(suppliers.kind, opts.kind)];
  if (opts.destination?.trim()) {
    /* Match by city OR country OR region — destinations come from
     * trip.destination as free-form ("Tokyo & Kyoto", "Marruecos"). */
    const term = `%${opts.destination.trim()}%`;
    conditions.push(
      sql`(${suppliers.city} ILIKE ${term} OR ${suppliers.country} ILIKE ${term} OR ${suppliers.region} ILIKE ${term})`,
    );
  }
  return db
    .select()
    .from(suppliers)
    .where(and(...conditions))
    .orderBy(
      desc(suppliers.preferred),
      desc(suppliers.virtuoso),
      asc(suppliers.name),
    )
    .limit(opts.limit ?? 5);
}

/**
 * Semantic search via pgvector cosine distance. Used for fuzzy
 * intent ("wellness retreat with kaiseki dining") that doesn't
 * line up cleanly with structured filters. Falls back to no
 * results if no suppliers have embeddings yet — caller should
 * use suggestSuppliersForAgent or listSuppliers as a structured
 * fallback.
 */
export async function searchSuppliersByQuery(opts: {
  query: string;
  kind?: SupplierKind;
  preferredOnly?: boolean;
  limit?: number;
}): Promise<Array<SupplierRow & { distance: number }>> {
  if (!opts.query.trim()) return [];
  const queryEmbedding = await embedText(opts.query);
  /* Format pgvector literal: "[0.1,0.2,...]" */
  const queryVec = `[${queryEmbedding.join(",")}]`;

  const conditions: SQL[] = [isNotNull(suppliers.embedding)];
  if (opts.kind) conditions.push(eq(suppliers.kind, opts.kind));
  if (opts.preferredOnly) conditions.push(eq(suppliers.preferred, true));

  /* Cosine distance via the <=> operator (vector_cosine_ops). Lower =
   * more similar. We return distance so callers can threshold or
   * blend with other ranking signals. */
  const rows = await db
    .select({
      id: suppliers.id,
      name: suppliers.name,
      kind: suppliers.kind,
      city: suppliers.city,
      country: suppliers.country,
      region: suppliers.region,
      priceTier: suppliers.priceTier,
      amenities: suppliers.amenities,
      notes: suppliers.notes,
      preferred: suppliers.preferred,
      virtuoso: suppliers.virtuoso,
      commissionPct: suppliers.commissionPct,
      contact: suppliers.contact,
      website: suppliers.website,
      embedding: suppliers.embedding,
      embeddingUpdatedAt: suppliers.embeddingUpdatedAt,
      createdAt: suppliers.createdAt,
      updatedAt: suppliers.updatedAt,
      distance: sql<number>`${suppliers.embedding} <=> ${queryVec}::vector`,
    })
    .from(suppliers)
    .where(and(...conditions))
    .orderBy(sql`${suppliers.embedding} <=> ${queryVec}::vector`)
    .limit(opts.limit ?? 8);
  return rows;
}

export type SupplierRow = typeof suppliers.$inferSelect;
