"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { agentConfigs, modelProviders } from "@/lib/db/schema";

type ProviderKind =
  (typeof modelProviders.$inferInsert)["kind"];

const ALLOWED_KINDS: ProviderKind[] = [
  "google_vertex",
  "google_ai",
  "openai",
  "anthropic",
];

const ALLOWED_AGENTS = [
  "flight",
  "hotel",
  "itinerary",
  "dining",
  "client_insights",
  "client_briefing",
  "outreach_composer",
  "crm_query",
] as const;

function parseJsonOrNull(v: string | null): Record<string, unknown> | null {
  if (!v || !v.trim()) return null;
  try {
    return JSON.parse(v);
  } catch {
    return null;
  }
}

export type FormResult = { ok: true } | { ok: false; error: string };

export async function createProvider(formData: FormData): Promise<FormResult> {
  const slug = String(formData.get("slug") ?? "").trim();
  const displayName = String(formData.get("displayName") ?? "").trim();
  const kind = String(formData.get("kind") ?? "") as ProviderKind;
  const credentialsEnvVar =
    String(formData.get("credentialsEnvVar") ?? "").trim() || null;
  const configRaw = String(formData.get("config") ?? "").trim();
  const enabled = formData.get("enabled") === "on";

  if (!slug) return { ok: false, error: "slug is required" };
  if (!displayName) return { ok: false, error: "displayName is required" };
  if (!ALLOWED_KINDS.includes(kind))
    return { ok: false, error: `unknown kind: ${kind}` };

  const config = configRaw ? parseJsonOrNull(configRaw) : null;
  if (configRaw && !config)
    return { ok: false, error: "config is not valid JSON" };

  try {
    await db.insert(modelProviders).values({
      slug,
      displayName,
      kind,
      config,
      credentialsEnvVar,
      enabled,
    });
    revalidatePath("/admin/models");
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "insert failed",
    };
  }
}

export async function updateProvider(
  id: string,
  formData: FormData,
): Promise<FormResult> {
  const displayName = String(formData.get("displayName") ?? "").trim();
  const kind = String(formData.get("kind") ?? "") as ProviderKind;
  const credentialsEnvVar =
    String(formData.get("credentialsEnvVar") ?? "").trim() || null;
  const configRaw = String(formData.get("config") ?? "").trim();
  const enabled = formData.get("enabled") === "on";

  if (!displayName) return { ok: false, error: "displayName is required" };
  if (!ALLOWED_KINDS.includes(kind))
    return { ok: false, error: `unknown kind: ${kind}` };

  const config = configRaw ? parseJsonOrNull(configRaw) : null;
  if (configRaw && !config)
    return { ok: false, error: "config is not valid JSON" };

  try {
    await db
      .update(modelProviders)
      .set({
        displayName,
        kind,
        config,
        credentialsEnvVar,
        enabled,
        updatedAt: new Date(),
      })
      .where(eq(modelProviders.id, id));
    revalidatePath("/admin/models");
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "update failed",
    };
  }
}

export async function deleteProvider(id: string): Promise<FormResult> {
  try {
    await db.delete(modelProviders).where(eq(modelProviders.id, id));
    revalidatePath("/admin/models");
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "delete failed",
    };
  }
}

export async function updateAgentConfig(
  formData: FormData,
): Promise<FormResult> {
  const agentRaw = String(formData.get("agentType") ?? "");
  const providerId = String(formData.get("providerId") ?? "").trim();
  const modelName = String(formData.get("modelName") ?? "").trim();
  const temperatureRaw = String(formData.get("temperature") ?? "").trim();
  const maxTokensRaw = String(formData.get("maxTokens") ?? "").trim();
  const systemPrompt = String(formData.get("systemPrompt") ?? "").trim() || null;

  if (!ALLOWED_AGENTS.includes(agentRaw as (typeof ALLOWED_AGENTS)[number]))
    return { ok: false, error: `unknown agent: ${agentRaw}` };
  const agent = agentRaw as (typeof ALLOWED_AGENTS)[number];

  if (!providerId) return { ok: false, error: "providerId is required" };
  if (!modelName) return { ok: false, error: "modelName is required" };

  const settings = {
    temperature: temperatureRaw ? Number(temperatureRaw) : undefined,
    maxTokens: maxTokensRaw ? Number(maxTokensRaw) : undefined,
  };
  if (settings.temperature != null && Number.isNaN(settings.temperature))
    return { ok: false, error: "temperature is not a number" };
  if (settings.maxTokens != null && Number.isNaN(settings.maxTokens))
    return { ok: false, error: "maxTokens is not a number" };

  try {
    await db
      .update(agentConfigs)
      .set({
        providerId,
        modelName,
        systemPrompt,
        settings,
        updatedAt: new Date(),
      })
      .where(eq(agentConfigs.agentType, agent));
    revalidatePath("/admin/models");
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "update failed",
    };
  }
}
