import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  numeric,
  jsonb,
  pgEnum,
  date,
  index,
  boolean,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

/* -----------------------------------------------------------------
 * Enums
 * ----------------------------------------------------------------- */

export const clientTag = pgEnum("client_tag", [
  "vip",
  "active",
  "prospect",
  "dormant",
]);

export const lifecycleStage = pgEnum("lifecycle_stage", [
  "lead",
  "discovery",
  "proposing",
  "booked",
  "traveling",
  "returning",
  "dormant",
]);

export const tripStatus = pgEnum("trip_status", [
  "draft",
  "active",
  "pending",
  "completed",
  "archived",
]);

export const agentType = pgEnum("agent_type", [
  /* Trip-scoped agents */
  "flight",
  "hotel",
  "itinerary",
  "dining",
  /* Client/CRM-scoped agents */
  "client_insights",
  "client_briefing",
  "outreach_composer",
  "crm_query",
]);

/** Subset of agent_type values that operate on a trip. Trip components
 *  type-narrow against this. */
export type TripAgentKind = "flight" | "hotel" | "itinerary" | "dining";

export const TRIP_AGENT_KINDS: TripAgentKind[] = [
  "flight",
  "hotel",
  "itinerary",
  "dining",
];

export type CrmAgentKind =
  | "client_insights"
  | "client_briefing"
  | "outreach_composer"
  | "crm_query";

export const agentRunStatus = pgEnum("agent_run_status", [
  "waiting",
  "running",
  "done",
  "failed",
]);

export const decisionStatus = pgEnum("decision_status", [
  "pending_approval",
  "approved",
  "rejected",
  "booked",
]);

export const bookingStatus = pgEnum("booking_status", [
  "research",
  "pending",
  "confirmed",
  "cancelled",
]);

export const bookingKind = pgEnum("booking_kind", [
  "flight",
  "hotel",
  "dining",
  "experience",
  "transfer",
  "other",
]);

export const activityType = pgEnum("activity_type", [
  "call",
  "email",
  "booking",
  "agent_action",
  "review",
  "note",
  "trip_event",
]);

export const logAvatar = pgEnum("log_avatar", [
  "orchestrator",
  "sub_agent",
  "client",
]);

export const insightKind = pgEnum("insight_kind", [
  "next_trip_signal",
  "spend_pattern",
  "risk_flag",
]);

export const alertKind = pgEnum("alert_kind", ["warn", "info"]);

export const proactiveAlertKind = pgEnum("proactive_alert_kind", [
  "anniversary",
  "trip_imminent",
  "dormancy",
  "nps_attention",
  "high_value_inactive",
]);

export const proactiveAlertSeverity = pgEnum("proactive_alert_severity", [
  "info",
  "warn",
  "urgent",
]);

export const providerKind = pgEnum("provider_kind", [
  "google_vertex",
  "google_ai",
  "openai",
  "anthropic",
]);

/* -----------------------------------------------------------------
 * Clients (CRM)
 * ----------------------------------------------------------------- */

export const clients = pgTable(
  "clients",
  {
    id: uuid().primaryKey().defaultRandom(),
    name: text().notNull(),
    email: text(),
    phone: text(),
    tag: clientTag().notNull().default("prospect"),
    stage: lifecycleStage().notNull().default("lead"),
    avatarColor: text(),
    npsScore: integer(),
    lifetimeValueCents: integer().notNull().default(0),
    notes: text(),
    /** When this person became a client. Drives anniversary alerts. */
    clientSince: date(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("clients_tag_idx").on(t.tag)],
);

export const travelerPreferences = pgTable("traveler_preferences", {
  clientId: uuid()
    .primaryKey()
    .references(() => clients.id, { onDelete: "cascade" }),
  hotelStyle: text(), // 'boutique' | 'chain' | 'mixed'
  seatPreference: text(), // 'window' | 'aisle' | 'any'
  flightClass: text(), // 'economy' | 'business' | 'first'
  diningStyle: text(),
  dietaryRestrictions: text().array(),
  loyaltyPrograms: jsonb().$type<Record<string, string>>(),
  preferredDestinations: text().array(),
  pacePreference: text(), // 'relaxed' | 'balanced' | 'packed'
  extras: jsonb().$type<Record<string, unknown>>(),
  updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

/* -----------------------------------------------------------------
 * Trips
 * ----------------------------------------------------------------- */

export const trips = pgTable(
  "trips",
  {
    id: uuid().primaryKey().defaultRandom(),
    clientId: uuid()
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    name: text().notNull(),
    destination: text().notNull(),
    startDate: date(),
    endDate: date(),
    travelerCount: integer().notNull().default(1),
    budgetCents: integer(),
    committedCents: integer().notNull().default(0),
    status: tripStatus().notNull().default("draft"),
    summary: text(),
    /* Client-facing editorial narrative used by the public share page.
     * Shape lives in src/lib/types/narrative.ts. Null until the
     * operator clicks Generate narrative. */
    clientNarrative: jsonb(),
    clientNarrativeGeneratedAt: timestamp({ withTimezone: true }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("trips_client_idx").on(t.clientId),
    index("trips_status_idx").on(t.status),
  ],
);

/* -----------------------------------------------------------------
 * Agent runs / decisions / bookings
 * ----------------------------------------------------------------- */

export const agentRuns = pgTable(
  "agent_runs",
  {
    id: uuid().primaryKey().defaultRandom(),
    tripId: uuid()
      .notNull()
      .references(() => trips.id, { onDelete: "cascade" }),
    agent: agentType().notNull(),
    status: agentRunStatus().notNull().default("waiting"),
    headline: text(),
    detail: text(),
    startedAt: timestamp({ withTimezone: true }),
    completedAt: timestamp({ withTimezone: true }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("agent_runs_trip_idx").on(t.tripId)],
);

export const agentDecisions = pgTable(
  "agent_decisions",
  {
    id: uuid().primaryKey().defaultRandom(),
    tripId: uuid()
      .notNull()
      .references(() => trips.id, { onDelete: "cascade" }),
    agentRunId: uuid().references(() => agentRuns.id, { onDelete: "set null" }),
    agent: agentType().notNull(),
    headline: text().notNull(),
    rationale: text(),
    recommendation: jsonb().$type<Record<string, unknown>>().notNull(),
    alternatives: jsonb().$type<Record<string, unknown>[]>(),
    status: decisionStatus().notNull().default("pending_approval"),
    reviewedAt: timestamp({ withTimezone: true }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("agent_decisions_trip_idx").on(t.tripId),
    index("agent_decisions_status_idx").on(t.status),
  ],
);

export const bookings = pgTable(
  "bookings",
  {
    id: uuid().primaryKey().defaultRandom(),
    tripId: uuid()
      .notNull()
      .references(() => trips.id, { onDelete: "cascade" }),
    decisionId: uuid().references(() => agentDecisions.id, {
      onDelete: "set null",
    }),
    kind: bookingKind().notNull(),
    title: text().notNull(),
    provider: text(),
    detail: text(),
    priceCents: integer(),
    status: bookingStatus().notNull().default("research"),
    occursOn: date(),
    metadata: jsonb().$type<Record<string, unknown>>(),
    confirmedAt: timestamp({ withTimezone: true }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("bookings_trip_idx").on(t.tripId),
    index("bookings_status_idx").on(t.status),
  ],
);

/* -----------------------------------------------------------------
 * Proactive alerts — surfaced by the daily monitoring agent
 * ----------------------------------------------------------------- */

export const proactiveAlerts = pgTable(
  "proactive_alerts",
  {
    id: uuid().primaryKey().defaultRandom(),
    clientId: uuid()
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    kind: proactiveAlertKind().notNull(),
    severity: proactiveAlertSeverity().notNull().default("info"),
    title: text().notNull(),
    body: text().notNull(),
    suggestedAction: text(),
    /** Dedupe key like "anniversary:2026-05-14" — prevents the same
     * alert being inserted twice in a single run or across days. */
    dedupeKey: text().notNull(),
    detail: jsonb().$type<Record<string, unknown>>(),
    triggeredAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    dismissedAt: timestamp({ withTimezone: true }),
    resolvedAt: timestamp({ withTimezone: true }),
  },
  (t) => [
    index("proactive_alerts_client_idx").on(t.clientId, t.triggeredAt),
    index("proactive_alerts_dedupe_idx").on(t.clientId, t.kind, t.dedupeKey),
  ],
);

/* -----------------------------------------------------------------
 * AI insights and trip alerts (CRM right panel + Trip right panel)
 * ----------------------------------------------------------------- */

export const aiInsights = pgTable(
  "ai_insights",
  {
    id: uuid().primaryKey().defaultRandom(),
    clientId: uuid()
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    kind: insightKind().notNull(),
    body: text().notNull(),
    sortOrder: integer().notNull().default(0),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("ai_insights_client_idx").on(t.clientId, t.sortOrder)],
);

export const outreachStatus = pgEnum("outreach_status", [
  "draft",
  "sent",
  "scheduled",
  "discarded",
]);

export const outreachDrafts = pgTable(
  "outreach_drafts",
  {
    id: uuid().primaryKey().defaultRandom(),
    clientId: uuid()
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    insightId: uuid().references(() => aiInsights.id, {
      onDelete: "set null",
    }),
    channel: text().notNull().default("email"),
    subject: text(),
    body: text().notNull(),
    tone: text(),
    status: outreachStatus().notNull().default("draft"),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    sentAt: timestamp({ withTimezone: true }),
  },
  (t) => [index("outreach_drafts_client_idx").on(t.clientId, t.createdAt)],
);

export const tripShareTokens = pgTable(
  "trip_share_tokens",
  {
    id: uuid().primaryKey().defaultRandom(),
    tripId: uuid()
      .notNull()
      .references(() => trips.id, { onDelete: "cascade" }),
    token: text().notNull().unique(),
    label: text(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    revokedAt: timestamp({ withTimezone: true }),
    lastVisitedAt: timestamp({ withTimezone: true }),
  },
  (t) => [index("trip_share_tokens_trip_idx").on(t.tripId)],
);

export const tripAlerts = pgTable(
  "trip_alerts",
  {
    id: uuid().primaryKey().defaultRandom(),
    tripId: uuid()
      .notNull()
      .references(() => trips.id, { onDelete: "cascade" }),
    kind: alertKind().notNull(),
    icon: text(),
    body: text().notNull(),
    sortOrder: integer().notNull().default(0),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("trip_alerts_trip_idx").on(t.tripId, t.sortOrder)],
);

/* -----------------------------------------------------------------
 * Model providers + per-agent model config (admin)
 * ----------------------------------------------------------------- */

export const modelProviders = pgTable("model_providers", {
  id: uuid().primaryKey().defaultRandom(),
  slug: text().notNull().unique(),
  displayName: text().notNull(),
  kind: providerKind().notNull(),
  /* Provider-specific non-secret config: project, location, baseURL, etc. */
  config: jsonb().$type<Record<string, unknown>>(),
  /* Name of the Vercel env var holding the secret (API key or
   * serialized service-account JSON). The value lives in env, not DB. */
  credentialsEnvVar: text(),
  enabled: boolean().notNull().default(true),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export const agentConfigs = pgTable("agent_configs", {
  agentType: agentType().primaryKey(),
  providerId: uuid()
    .notNull()
    .references(() => modelProviders.id, { onDelete: "restrict" }),
  modelName: text().notNull(),
  systemPrompt: text(),
  settings: jsonb().$type<{
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    topK?: number;
  }>(),
  updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

/* -----------------------------------------------------------------
 * Logs / activity
 * ----------------------------------------------------------------- */

export const agentLogMessages = pgTable(
  "agent_log_messages",
  {
    id: uuid().primaryKey().defaultRandom(),
    tripId: uuid()
      .notNull()
      .references(() => trips.id, { onDelete: "cascade" }),
    avatar: logAvatar().notNull().default("sub_agent"),
    body: text().notNull(),
    occurredAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("agent_log_trip_idx").on(t.tripId, t.occurredAt)],
);

export const activityLog = pgTable(
  "activity_log",
  {
    id: uuid().primaryKey().defaultRandom(),
    clientId: uuid()
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    tripId: uuid().references(() => trips.id, { onDelete: "set null" }),
    type: activityType().notNull(),
    actor: text(), // 'system' | 'agent:flight' | 'operator:{name}' etc.
    summary: text().notNull(),
    detail: jsonb().$type<Record<string, unknown>>(),
    occurredAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("activity_client_idx").on(t.clientId, t.occurredAt),
    index("activity_trip_idx").on(t.tripId),
  ],
);

/* -----------------------------------------------------------------
 * Relations
 * ----------------------------------------------------------------- */

export const clientsRelations = relations(clients, ({ one, many }) => ({
  preferences: one(travelerPreferences, {
    fields: [clients.id],
    references: [travelerPreferences.clientId],
  }),
  trips: many(trips),
  activity: many(activityLog),
  insights: many(aiInsights),
}));

export const aiInsightsRelations = relations(aiInsights, ({ one, many }) => ({
  client: one(clients, {
    fields: [aiInsights.clientId],
    references: [clients.id],
  }),
  drafts: many(outreachDrafts),
}));

export const proactiveAlertsRelations = relations(
  proactiveAlerts,
  ({ one }) => ({
    client: one(clients, {
      fields: [proactiveAlerts.clientId],
      references: [clients.id],
    }),
  }),
);

export const outreachDraftsRelations = relations(
  outreachDrafts,
  ({ one }) => ({
    client: one(clients, {
      fields: [outreachDrafts.clientId],
      references: [clients.id],
    }),
    insight: one(aiInsights, {
      fields: [outreachDrafts.insightId],
      references: [aiInsights.id],
    }),
  }),
);

export const tripAlertsRelations = relations(tripAlerts, ({ one }) => ({
  trip: one(trips, { fields: [tripAlerts.tripId], references: [trips.id] }),
}));

export const tripShareTokensRelations = relations(
  tripShareTokens,
  ({ one }) => ({
    trip: one(trips, {
      fields: [tripShareTokens.tripId],
      references: [trips.id],
    }),
  }),
);

export const modelProvidersRelations = relations(
  modelProviders,
  ({ many }) => ({
    agentConfigs: many(agentConfigs),
  }),
);

export const agentConfigsRelations = relations(agentConfigs, ({ one }) => ({
  provider: one(modelProviders, {
    fields: [agentConfigs.providerId],
    references: [modelProviders.id],
  }),
}));

export const agentLogMessagesRelations = relations(
  agentLogMessages,
  ({ one }) => ({
    trip: one(trips, {
      fields: [agentLogMessages.tripId],
      references: [trips.id],
    }),
  }),
);

export const activityLogRelations = relations(activityLog, ({ one }) => ({
  client: one(clients, {
    fields: [activityLog.clientId],
    references: [clients.id],
  }),
  trip: one(trips, {
    fields: [activityLog.tripId],
    references: [trips.id],
  }),
}));

export const tripsRelations = relations(trips, ({ one, many }) => ({
  client: one(clients, {
    fields: [trips.clientId],
    references: [clients.id],
  }),
  agentRuns: many(agentRuns),
  decisions: many(agentDecisions),
  bookings: many(bookings),
  log: many(agentLogMessages),
  alerts: many(tripAlerts),
}));

export const agentRunsRelations = relations(agentRuns, ({ one, many }) => ({
  trip: one(trips, { fields: [agentRuns.tripId], references: [trips.id] }),
  decisions: many(agentDecisions),
}));

export const agentDecisionsRelations = relations(
  agentDecisions,
  ({ one, many }) => ({
    trip: one(trips, {
      fields: [agentDecisions.tripId],
      references: [trips.id],
    }),
    run: one(agentRuns, {
      fields: [agentDecisions.agentRunId],
      references: [agentRuns.id],
    }),
    bookings: many(bookings),
  }),
);

export const bookingsRelations = relations(bookings, ({ one }) => ({
  trip: one(trips, { fields: [bookings.tripId], references: [trips.id] }),
  decision: one(agentDecisions, {
    fields: [bookings.decisionId],
    references: [agentDecisions.id],
  }),
}));
