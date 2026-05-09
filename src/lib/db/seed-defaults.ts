/**
 * Idempotent defaults — model_providers + agent_configs for the four
 * agents. Safe to run against any environment, including production:
 * upserts on natural keys, never truncates.
 *
 * Run: pnpm db:seed-defaults  (uses .env.local)
 *      DATABASE_URL=... pnpm db:seed-defaults  (against any branch)
 */

import { db } from "./index";
import { agentConfigs, modelProviders } from "./schema";

const DEFAULT_SYSTEM_PROMPT = `You are a senior travel concierge embedded in a private travel agency. You evaluate options against a traveler's stated preferences and propose a top pick plus alternatives. You never guess fares, dates, or seat counts — you score what's given. Your tone is precise, warm, and operator-friendly.`;

async function main() {
  console.log("→ upserting default model providers...");

  await db
    .insert(modelProviders)
    .values({
      slug: "gemini-vertex",
      displayName: "Google Gemini (Vertex AI)",
      kind: "google_vertex",
      config: {
        project: null,
        location: "us-central1",
      },
      credentialsEnvVar: "GOOGLE_VERTEX_CREDENTIALS_JSON",
      enabled: true,
    })
    .onConflictDoUpdate({
      target: modelProviders.slug,
      set: {
        displayName: "Google Gemini (Vertex AI)",
        kind: "google_vertex",
        credentialsEnvVar: "GOOGLE_VERTEX_CREDENTIALS_JSON",
        updatedAt: new Date(),
      },
    });

  const provider = await db.query.modelProviders.findFirst({
    where: (t, { eq }) => eq(t.slug, "gemini-vertex"),
  });
  if (!provider) throw new Error("provider upsert did not return row");

  console.log(`→ upserting agent_configs against provider ${provider.slug}...`);

  for (const agent of [
    "flight",
    "hotel",
    "itinerary",
    "dining",
    "client_insights",
    "client_briefing",
    "outreach_composer",
    "crm_query",
  ] as const) {
    await db
      .insert(agentConfigs)
      .values({
        agentType: agent,
        providerId: provider.id,
        modelName: "gemini-2.5-flash",
        systemPrompt: DEFAULT_SYSTEM_PROMPT,
        settings: {
          temperature: 0.4,
          maxTokens: 2048,
        },
      })
      .onConflictDoUpdate({
        target: agentConfigs.agentType,
        set: {
          providerId: provider.id,
          modelName: "gemini-2.5-flash",
          systemPrompt: DEFAULT_SYSTEM_PROMPT,
          updatedAt: new Date(),
        },
      });
  }

  console.log("✓ defaults applied");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("seed-defaults failed", err);
    process.exit(1);
  });
