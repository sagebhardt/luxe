import "server-only";
import { eq } from "drizzle-orm";
import {
  createVertex,
  type GoogleVertexProvider,
} from "@ai-sdk/google-vertex";
import { ExternalAccountClient } from "google-auth-library";
import { getVercelOidcToken } from "@vercel/oidc";
import { db } from "@/lib/db";
import {
  agentConfigs,
  modelProviders,
  type agentType,
} from "@/lib/db/schema";

/**
 * Resolve the configured AI provider + model for a given agent type.
 * Reads provider config from `model_providers` and per-agent settings
 * from `agent_configs`. Credentials live in Vercel env vars (the DB
 * stores only the *name* of the env var to read).
 */

type AgentKind = (typeof agentType.enumValues)[number];

export type ResolvedAgent = {
  agent: AgentKind;
  modelName: string;
  systemPrompt: string | null;
  settings: {
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    topK?: number;
  } | null;
  provider: ReturnType<GoogleVertexProvider> | ReturnType<GoogleVertexProvider>;
  /* Each provider returns a callable language model. We expose it
   * normalized as `model` so the agent code is provider-agnostic. */
  model: ReturnType<GoogleVertexProvider>;
};

export class ProviderConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProviderConfigError";
  }
}

export async function resolveAgent(agent: AgentKind): Promise<ResolvedAgent> {
  const row = await db.query.agentConfigs.findFirst({
    where: eq(agentConfigs.agentType, agent),
    with: { provider: true },
  });

  if (!row) {
    throw new ProviderConfigError(
      `No agent_config row for ${agent}. Seed defaults or set one in /admin/models.`,
    );
  }
  if (!row.provider) {
    throw new ProviderConfigError(
      `agent_config(${agent}) references a missing provider.`,
    );
  }
  if (!row.provider.enabled) {
    throw new ProviderConfigError(
      `Provider "${row.provider.slug}" is disabled.`,
    );
  }

  const model = buildModel(row.provider, row.modelName);

  return {
    agent,
    modelName: row.modelName,
    systemPrompt: row.systemPrompt,
    settings: row.settings,
    provider: model,
    model,
  };
}

function buildModel(
  provider: typeof modelProviders.$inferSelect,
  modelName: string,
) {
  switch (provider.kind) {
    case "google_vertex": {
      const config = (provider.config ?? {}) as {
        project?: string;
        location?: string;
      };
      const project =
        config.project ?? process.env.GOOGLE_VERTEX_PROJECT ?? null;
      const location =
        config.location ?? process.env.GOOGLE_VERTEX_LOCATION ?? "us-central1";

      if (!project) {
        throw new ProviderConfigError(
          "Vertex AI: GOOGLE_VERTEX_PROJECT (or provider.config.project) is not set.",
        );
      }

      const authClient = buildVertexAuthClient();

      const vertex = createVertex({
        project,
        location,
        googleAuthOptions: { authClient },
      });
      return vertex(modelName);
    }
    case "google_ai":
    case "openai":
    case "anthropic":
      throw new ProviderConfigError(
        `Provider kind "${provider.kind}" not yet implemented. Only google_vertex is wired up.`,
      );
  }
}

/**
 * Build a Google auth client that authenticates via Vercel OIDC →
 * Workload Identity Federation. No long-lived service-account keys —
 * Vercel signs an OIDC JWT, GCP STS exchanges it for a short-lived
 * access token impersonating our Vertex service account.
 *
 * Required env vars (Vercel + local):
 *   GOOGLE_VERTEX_AUDIENCE                 — full audience URL of the WIF provider
 *   GOOGLE_VERTEX_SERVICE_ACCOUNT_EMAIL    — the SA being impersonated
 *
 * Locally (no VERCEL_OIDC_TOKEN), falls back to Application Default
 * Credentials so `gcloud auth application-default login` works.
 */
function buildVertexAuthClient() {
  const audience = process.env.GOOGLE_VERTEX_AUDIENCE;
  const serviceAccount = process.env.GOOGLE_VERTEX_SERVICE_ACCOUNT_EMAIL;

  // VERCEL=1 in Vercel runtimes (build, prod, preview, dev). OIDC token
  // is delivered per-request — env var or header — so we resolve it
  // lazily inside subject_token_supplier rather than gating on it here.
  // Locally without VERCEL=1, fall back to ADC (gcloud auth application-default login).
  if (!process.env.VERCEL) {
    return undefined;
  }
  if (!audience || !serviceAccount) {
    throw new ProviderConfigError(
      "Vertex AI on Vercel needs GOOGLE_VERTEX_AUDIENCE and GOOGLE_VERTEX_SERVICE_ACCOUNT_EMAIL.",
    );
  }

  const client = ExternalAccountClient.fromJSON({
    type: "external_account",
    audience,
    subject_token_type: "urn:ietf:params:oauth:token-type:jwt",
    token_url: "https://sts.googleapis.com/v1/token",
    service_account_impersonation_url: `https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${serviceAccount}:generateAccessToken`,
    subject_token_supplier: {
      getSubjectToken: () => getVercelOidcToken(),
    },
  });
  if (!client) {
    throw new ProviderConfigError(
      "Vertex AI: failed to build ExternalAccountClient. Check GOOGLE_VERTEX_AUDIENCE and SA email.",
    );
  }
  return client;
}
