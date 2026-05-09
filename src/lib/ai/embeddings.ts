import "server-only";
import { embedMany, embed } from "ai";
import { resolveAgent } from "./registry";

/**
 * Vertex text-multilingual-embedding-002 — 768-dim, handles Spanish
 * cleanly (Odylic content is mostly Spanish). Reuses the same Vertex
 * provider configuration as the chat agents.
 */

const EMBEDDING_MODEL_ID = "text-multilingual-embedding-002";

async function getEmbeddingModel() {
  /* Borrow the Vertex provider from any chat agent — embeddings hit
   * the same project/location/auth. We use crm_query because it
   * always exists in the seed config. */
  const resolved = await resolveAgent("crm_query");
  if (!resolved._vertex) {
    throw new Error(
      "Vertex provider not available — embeddings need google_vertex.",
    );
  }
  return resolved._vertex.textEmbeddingModel(EMBEDDING_MODEL_ID);
}

export async function embedText(text: string): Promise<number[]> {
  const model = await getEmbeddingModel();
  const { embedding } = await embed({
    model,
    value: text.slice(0, 4000),
  });
  return embedding;
}

export async function embedTexts(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  const model = await getEmbeddingModel();
  const { embeddings } = await embedMany({
    model,
    values: texts.map((t) => t.slice(0, 4000)),
  });
  return embeddings;
}

/**
 * Build the canonical text representation of a supplier for embedding.
 * Stable formula so re-embedding produces the same vector when the
 * underlying fields haven't changed.
 */
export function supplierEmbeddingText(s: {
  name: string;
  kind: string;
  city: string | null;
  country: string | null;
  region: string | null;
  amenities: string[];
  notes: string | null;
}): string {
  return [
    s.name,
    s.kind,
    [s.city, s.country, s.region].filter(Boolean).join(", "),
    s.amenities.length ? `Amenities: ${s.amenities.join(", ")}` : null,
    s.notes,
  ]
    .filter(Boolean)
    .join("\n");
}
