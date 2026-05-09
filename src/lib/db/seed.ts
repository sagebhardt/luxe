/**
 * Luxe — Seed Script
 * Fixtures sourced from design/voya-odylic.html (the visual prototype).
 * Idempotent: clears existing rows before inserting.
 *
 * Run: pnpm tsx src/lib/db/seed.ts
 */

import { sql } from "drizzle-orm";
import { db } from "./index";
import {
  clients,
  travelerPreferences,
  trips,
  agentRuns,
  agentDecisions,
  bookings,
  agentLogMessages,
  activityLog,
  aiInsights,
  tripAlerts,
} from "./schema";

const dollars = (n: number) => Math.round(n * 100);

async function clear() {
  await db.execute(sql`
    truncate
      ${tripAlerts},
      ${aiInsights},
      ${activityLog},
      ${agentLogMessages},
      ${bookings},
      ${agentDecisions},
      ${agentRuns},
      ${travelerPreferences},
      ${trips},
      ${clients}
    restart identity cascade
  `);
}

async function main() {
  console.log("→ clearing existing data...");
  await clear();

  /* ─── Clients ────────────────────────────────────────── */
  console.log("→ inserting clients...");
  const [marcela, ricardo, sofia, andres, camila, lorenzo] = await db
    .insert(clients)
    .values([
      {
        name: "Marcela Fuentes",
        email: "marcela@fuentescapital.cl",
        phone: "+56 9 8812 4401",
        tag: "vip",
        avatarColor: "av-1",
        npsScore: 94,
        lifetimeValueCents: dollars(48_200),
        notes: "Santiago, Chile · Client since Jan 2022 · 7 trips completed",
      },
      {
        name: "Ricardo Holt",
        email: "ricardo.holt@example.pe",
        phone: "+51 1 555 0142",
        tag: "active",
        avatarColor: "av-2",
        npsScore: 78,
        lifetimeValueCents: dollars(22_100),
        notes: "Lima · Active client",
      },
      {
        name: "Sofía del Río",
        email: "sofia@delrio.com",
        tag: "vip",
        avatarColor: "av-3",
        npsScore: 92,
        lifetimeValueCents: dollars(61_400),
        notes: "Last trip: Maldives · January 2026",
      },
      {
        name: "Andrés Kwan",
        email: "andres@kwanfamily.ar",
        tag: "prospect",
        avatarColor: "av-4",
        lifetimeValueCents: 0,
        notes: "Buenos Aires · Prospect, hasn't booked yet",
      },
      {
        name: "Camila Reyes",
        tag: "dormant",
        avatarColor: "av-5",
        lifetimeValueCents: dollars(14_800),
        notes: "Last trip: NYC · March 2025. Outreach pending.",
      },
      {
        name: "Lorenzo Mena",
        tag: "active",
        avatarColor: "av-2",
        lifetimeValueCents: dollars(38_900),
        notes: "Last trip: Tuscany · October",
      },
    ])
    .returning();

  /* ─── Traveler preferences ───────────────────────────── */
  console.log("→ inserting traveler preferences...");
  await db.insert(travelerPreferences).values([
    {
      clientId: marcela.id,
      hotelStyle: "boutique",
      seatPreference: "aisle",
      flightClass: "business",
      diningStyle: "no chain restaurants",
      pacePreference: "morning arrivals preferred",
      preferredDestinations: ["Japan", "Portugal", "Morocco"],
      extras: { budgetTypical: 12_400 },
    },
    {
      clientId: ricardo.id,
      hotelStyle: "mixed",
      seatPreference: "window",
      flightClass: "business",
      pacePreference: "balanced",
      preferredDestinations: ["Patagonia", "Andes"],
    },
  ]);

  /* ─── Trips ──────────────────────────────────────────── */
  console.log("→ inserting trips...");
  const [tokyo, patagonia, lisbon, marrakech, nyc] = await db
    .insert(trips)
    .values([
      {
        clientId: marcela.id,
        name: "Tokyo & Kyoto",
        destination: "Tokyo & Kyoto, Japan",
        startDate: "2026-05-14",
        endDate: "2026-05-22",
        travelerCount: 2,
        budgetCents: dollars(12_400),
        committedCents: dollars(8_928), // 72% of 12,400
        status: "active",
        summary: "8-night curated Japan trip. Golden Week routing.",
      },
      {
        clientId: ricardo.id,
        name: "Patagonia Traverse",
        destination: "Patagonia, Chile/Argentina",
        startDate: "2026-11-03",
        endDate: "2026-11-14",
        travelerCount: 2,
        budgetCents: dollars(18_500),
        committedCents: 0,
        status: "pending",
        summary: "Multi-day overland traverse — early planning.",
      },
      {
        clientId: marcela.id,
        name: "Lisbon & Alentejo",
        destination: "Portugal",
        startDate: "2026-01-08",
        endDate: "2026-01-16",
        travelerCount: 2,
        budgetCents: dollars(9_200),
        committedCents: dollars(9_200),
        status: "completed",
      },
      {
        clientId: marcela.id,
        name: "Marrakech",
        destination: "Marrakech, Morocco",
        startDate: "2025-09-02",
        endDate: "2025-09-09",
        travelerCount: 4,
        budgetCents: dollars(14_800),
        committedCents: dollars(14_800),
        status: "completed",
      },
      {
        clientId: marcela.id,
        name: "NYC Business",
        destination: "New York City, USA",
        startDate: "2025-03-10",
        endDate: "2025-03-14",
        travelerCount: 1,
        budgetCents: dollars(6_100),
        committedCents: dollars(6_100),
        status: "completed",
      },
    ])
    .returning();

  void patagonia;

  /* ─── Agent runs (Tokyo trip only) ───────────────────── */
  console.log("→ inserting agent runs...");
  const agentRunRows = await db
    .insert(agentRuns)
    .values([
      {
        tripId: tokyo.id,
        agent: "flight",
        status: "done",
        headline: "14 routes searched",
        detail: "JAL 61 selected as best match.",
        startedAt: new Date("2026-05-08T09:14:00Z"),
        completedAt: new Date("2026-05-08T09:31:00Z"),
      },
      {
        tripId: tokyo.id,
        agent: "hotel",
        status: "done",
        headline: "31 properties ranked",
        detail: "2 boutique picks confirmed.",
        startedAt: new Date("2026-05-08T09:34:00Z"),
        completedAt: new Date("2026-05-08T09:44:00Z"),
      },
      {
        tripId: tokyo.id,
        agent: "itinerary",
        status: "done",
        headline: "Building day-by-day plan",
        detail: "Crowd calendar scan complete.",
        startedAt: new Date("2026-05-08T10:18:00Z"),
        completedAt: new Date("2026-05-08T10:21:00Z"),
      },
      {
        tripId: tokyo.id,
        agent: "dining",
        status: "waiting",
        headline: "Holds at Narisawa, Den, Florilège",
        detail: "Awaiting itinerary.",
      },
    ])
    .returning();
  const flightRun = agentRunRows.find((r) => r.agent === "flight")!;

  /* ─── Pending decision ───────────────────────────────── */
  console.log("→ inserting agent decisions...");
  await db.insert(agentDecisions).values([
    {
      tripId: tokyo.id,
      agentRunId: flightRun.id,
      agent: "flight",
      headline: "JAL 61 (SCL→NRT, Business)",
      rationale:
        "Saves $420 vs ANA. Only 3 aisle seats remaining. Confirmation needed today.",
      recommendation: {
        carrier: "JAL",
        flightNumber: "61",
        from: "SCL",
        to: "NRT",
        departureLocal: "2026-05-14T23:45-04:00",
        arrivalLocal: "2026-05-16T19:30+09:00",
        cabin: "Business",
        seat: "aisle",
        priceCentsPerPerson: dollars(4_240),
      },
      status: "pending_approval",
    },
  ]);

  /* ─── Bookings ───────────────────────────────────────── *
   * metadata.featured = true  → renders in Committed Decisions grid
   * metadata.time             → renders in Draft Itinerary timeline
   * subtitle                  → small tag above the title (e.g. "Hotel · Tokyo")
   */
  console.log("→ inserting bookings...");
  await db.insert(bookings).values([
    {
      tripId: tokyo.id,
      kind: "hotel",
      title: "Hoshino OMO5",
      provider: "Hoshino",
      detail: "May 14–19 · Gotanda · 5 nights\n$380/night · breakfast included",
      priceCents: dollars(1_900),
      status: "confirmed",
      occursOn: "2026-05-14",
      metadata: {
        featured: true,
        subtitle: "Hotel · Tokyo",
        nights: 5,
      },
      confirmedAt: new Date("2026-05-05T09:11:00Z"),
    },
    {
      tripId: tokyo.id,
      kind: "hotel",
      title: "Noku Kyoto",
      provider: "Noku",
      detail: "May 19–22 · Nakagyo · 3 nights\n$290/night · machiya style",
      priceCents: dollars(870),
      status: "confirmed",
      occursOn: "2026-05-19",
      metadata: {
        featured: true,
        subtitle: "Hotel · Kyoto",
        nights: 3,
      },
    },
    {
      tripId: tokyo.id,
      kind: "flight",
      title: "JAL 61 → NRT",
      provider: "Japan Airlines",
      detail: "May 14 · SCL 23:45 → NRT+2 19:30\nBusiness · $4,240 pp",
      priceCents: dollars(4_240),
      status: "pending",
      occursOn: "2026-05-14",
      metadata: {
        featured: true,
        subtitle: "Flight",
        time: "23:45",
        icon: "✈️",
        timelineName: "Departure SCL → NRT",
        timelineDetail: "JAL 61 · Business · Pending approval",
        timelineCost: 4240,
      },
    },
    {
      tripId: tokyo.id,
      kind: "dining",
      title: "Narisawa",
      provider: "Narisawa",
      detail:
        "May 15 · 7pm · Innovative Satoyama\nWaitlist active — confirmation pending",
      priceCents: dollars(380),
      status: "research",
      occursOn: "2026-05-15",
      metadata: {
        featured: true,
        subtitle: "Dining · Night 1",
        time: "—",
        icon: "🍱",
        timelineName: "Dinner · Narisawa",
        timelineDetail: "Waitlist active · Agent monitoring",
        timelineCost: 380,
        approxCost: true,
      },
    },
    /* Itinerary-only events (no `featured: true`) */
    {
      tripId: tokyo.id,
      kind: "transfer",
      title: "Arrive Narita · Private transfer",
      detail: "70 min to hotel · ¥18,000",
      priceCents: dollars(115),
      status: "confirmed",
      occursOn: "2026-05-15",
      metadata: {
        time: "19:30",
        icon: "🛬",
        timelineName: "Arrive Narita · Private transfer",
        timelineDetail: "70 min to hotel · ¥18,000",
        timelineCost: 115,
      },
    },
    {
      tripId: tokyo.id,
      kind: "experience",
      title: "teamLab Planets — early access",
      detail: "Pre-open slot, fewer crowds",
      priceCents: dollars(32),
      status: "confirmed",
      occursOn: "2026-05-16",
      metadata: {
        time: "08:00",
        icon: "🏯",
        timelineName: "teamLab Planets — early access",
        timelineDetail: "Pre-open slot, fewer crowds",
        timelineCost: 32,
      },
    },
    {
      tripId: tokyo.id,
      kind: "dining",
      title: "Lunch · Fuunji Tsukemen",
      detail: "Shinjuku · Walk-in",
      priceCents: dollars(18),
      status: "confirmed",
      occursOn: "2026-05-16",
      metadata: {
        time: "13:00",
        icon: "🍜",
        timelineName: "Lunch · Fuunji Tsukemen",
        timelineDetail: "Shinjuku · Walk-in",
        timelineCost: 18,
      },
    },
  ]);

  /* Historical agent runs — used by the CRM trip-history table to render
   * the "Agents Used" pills. Past trips show all four / three / two as
   * the prototype does. */
  await db.insert(agentRuns).values([
    // Lisbon: flight + hotel + dining
    { tripId: lisbon.id, agent: "flight", status: "done" },
    { tripId: lisbon.id, agent: "hotel", status: "done" },
    { tripId: lisbon.id, agent: "dining", status: "done" },
    // Marrakech: all four
    { tripId: marrakech.id, agent: "flight", status: "done" },
    { tripId: marrakech.id, agent: "hotel", status: "done" },
    { tripId: marrakech.id, agent: "itinerary", status: "done" },
    { tripId: marrakech.id, agent: "dining", status: "done" },
    // NYC: flight + hotel
    { tripId: nyc.id, agent: "flight", status: "done" },
    { tripId: nyc.id, agent: "hotel", status: "done" },
  ]);

  /* ─── Agent log messages ─────────────────────────────── */
  console.log("→ inserting agent log messages...");
  await db.insert(agentLogMessages).values([
    {
      tripId: tokyo.id,
      avatar: "orchestrator",
      body: "Trip initialized for <em>Tokyo & Kyoto, May 14–22</em>. Searching flights from SCL with morning-arrival preference active.",
      occurredAt: new Date("2026-05-08T09:14:00Z"),
    },
    {
      tripId: tokyo.id,
      avatar: "sub_agent",
      body: "Flight agent: found <em>JAL 61</em> as optimal. Business class, aisle seat available, $420 under alternative routing. Awaiting your approval.",
      occurredAt: new Date("2026-05-08T09:31:00Z"),
    },
    {
      tripId: tokyo.id,
      avatar: "orchestrator",
      body: "Hotel agent selected <em>Hoshino OMO5</em> over Park Hyatt based on boutique preference. Confirmed at ¥58k/night.",
      occurredAt: new Date("2026-05-08T09:44:00Z"),
    },
    {
      tripId: tokyo.id,
      avatar: "sub_agent",
      body: "Dining agent: <em>Narisawa waitlist</em> joined. Holds at Den and Florilège as fallbacks. Confirmation expected within 24h.",
      occurredAt: new Date("2026-05-08T10:02:00Z"),
    },
    {
      tripId: tokyo.id,
      avatar: "orchestrator",
      body: "Itinerary agent live — <em>Golden Week crowds</em> detected May 15–17. Routing adjusted to quieter shrines in morning windows.",
      occurredAt: new Date("2026-05-08T10:18:00Z"),
    },
  ]);

  /* ─── Trip alerts ────────────────────────────────────── */
  console.log("→ inserting trip alerts...");
  await db.insert(tripAlerts).values([
    {
      tripId: tokyo.id,
      kind: "warn",
      icon: "⚠",
      body: "JAL 61 aisle seats down to 3. Approval needed today before inventory closes.",
      sortOrder: 0,
    },
    {
      tripId: tokyo.id,
      kind: "info",
      icon: "🌸",
      body: "Gion Matsuri pre-events May 17 in Kyoto. Itinerary agent adjusted day plan.",
      sortOrder: 1,
    },
  ]);

  /* ─── AI insights for Marcela ────────────────────────── */
  console.log("→ inserting AI insights...");
  await db.insert(aiInsights).values([
    {
      clientId: marcela.id,
      kind: "next_trip_signal",
      sortOrder: 0,
      body: "<strong>High likelihood of Maldives or Bali trip</strong> in Q4 2026. Annual warm-weather pattern Oct–Dec. Last trip was Sep 2025. <em>Outreach recommended by July.</em>",
    },
    {
      clientId: marcela.id,
      kind: "spend_pattern",
      sortOrder: 1,
      body: "Average trip value grew <em>+31%</em> over 3 years. Consistently upgrades to first class when offered. Hotel ceiling ~$500/night. Dining spend above profile average.",
    },
    {
      clientId: marcela.id,
      kind: "risk_flag",
      sortOrder: 2,
      body: "Zero referrals despite <em>NPS 94</em>. Consider referral program or co-traveler upsell — she's traveled with same partner on 6/7 trips.",
    },
  ]);

  /* ─── Activity log for Marcela ───────────────────────── */
  console.log("→ inserting activity log...");
  await db.insert(activityLog).values([
    {
      clientId: marcela.id,
      tripId: tokyo.id,
      type: "agent_action",
      actor: "agent:flight",
      summary:
        "Flight agent found JAL 61 for Tokyo — <span>awaiting client approval</span>",
      detail: { icon: "✈️" },
      occurredAt: new Date("2026-05-08T10:18:00Z"),
    },
    {
      clientId: marcela.id,
      tripId: tokyo.id,
      type: "call",
      actor: "operator:andrea",
      summary:
        "Call with Marcela — <span>confirmed Kyoto extension, added 1 night</span>",
      detail: { icon: "📞" },
      occurredAt: new Date("2026-05-07T14:30:00Z"),
    },
    {
      clientId: marcela.id,
      tripId: tokyo.id,
      type: "booking",
      actor: "system",
      summary: "Hoshino OMO5 confirmed — <span>$1,900 deposit charged</span>",
      detail: { icon: "🏨" },
      occurredAt: new Date("2026-05-05T09:11:00Z"),
    },
    {
      clientId: marcela.id,
      type: "review",
      actor: "client:marcela",
      summary: "Lisbon trip review — <span>NPS 9, praised dining curation</span>",
      detail: { icon: "⭐" },
      occurredAt: new Date("2026-01-18T16:02:00Z"),
    },
    {
      clientId: marcela.id,
      tripId: tokyo.id,
      type: "email",
      actor: "operator:andrea",
      summary: "Tokyo brief sent — <span>opened, no reply yet</span>",
      detail: { icon: "✉️" },
      occurredAt: new Date("2026-05-03T11:44:00Z"),
    },
  ]);

  console.log("✓ seed complete");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("seed failed", err);
    process.exit(1);
  });
