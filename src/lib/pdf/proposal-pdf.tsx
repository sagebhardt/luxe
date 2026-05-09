/* eslint-disable react/no-unknown-property */
import {
  Document,
  Font,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import type { trips, clients, bookings } from "@/lib/db/schema";
import type { TripNarrative } from "@/lib/types/narrative";

/**
 * Trip Proposal PDF — operator-facing branded document for the client.
 * One page per: cover, opening, anchors, day-by-day. Style mirrors the
 * editorial share page: Playfair-italic display + Jost body.
 *
 * Fonts: react-pdf only embeds fonts you explicitly register. We
 * register Playfair Display + Jost from Google Fonts so the PDF
 * matches the on-screen aesthetic.
 */

Font.register({
  family: "Playfair Display",
  fonts: [
    {
      src: "https://fonts.gstatic.com/s/playfairdisplay/v37/nuFvD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWBN2PKdFvUDQ.ttf",
      fontStyle: "italic",
      fontWeight: 400,
    },
  ],
});

Font.register({
  family: "Jost",
  fonts: [
    {
      src: "https://fonts.gstatic.com/s/jost/v15/92zPtBhPNqw79Ij1E865zBUv7myjJQVGPokMmuHL.ttf",
      fontWeight: 400,
    },
    {
      src: "https://fonts.gstatic.com/s/jost/v15/92zPtBhPNqw79Ij1E865zBUv7mGjJQVGPokMmuHL.ttf",
      fontWeight: 500,
    },
  ],
});

const COLORS = {
  cream: "#f7f2ea",
  ivory: "#fdfaf5",
  warmWhite: "#fffef9",
  bark: "#c4a882",
  forest: "#2d4038",
  forestMid: "#3d5248",
  ink: "#1e1a14",
  charcoal: "#3a342a",
  stone: "#8a8076",
  stoneLt: "#b5aea4",
  borderLt: "rgba(45, 64, 56, 0.07)",
};

const styles = StyleSheet.create({
  page: {
    backgroundColor: COLORS.cream,
    padding: 56,
    fontFamily: "Jost",
    fontSize: 11,
    color: COLORS.ink,
    lineHeight: 1.55,
  },
  cover: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    textAlign: "center",
  },
  eyebrow: {
    fontSize: 9,
    letterSpacing: 4,
    color: COLORS.bark,
    textTransform: "uppercase",
    marginBottom: 18,
    fontWeight: 500,
  },
  title: {
    fontFamily: "Playfair Display",
    fontStyle: "italic",
    fontSize: 56,
    color: COLORS.forest,
    lineHeight: 1.05,
    marginBottom: 18,
  },
  rule: {
    width: 36,
    height: 1,
    backgroundColor: COLORS.bark,
    marginBottom: 18,
    opacity: 0.7,
  },
  meta: {
    fontSize: 11,
    color: COLORS.stone,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  sectionEyebrow: {
    fontSize: 9,
    letterSpacing: 3,
    color: COLORS.bark,
    textTransform: "uppercase",
    marginBottom: 4,
    textAlign: "center",
    fontWeight: 500,
  },
  sectionTitle: {
    fontFamily: "Playfair Display",
    fontStyle: "italic",
    fontSize: 26,
    color: COLORS.forest,
    textAlign: "center",
    marginBottom: 24,
  },
  opening: {
    fontFamily: "Playfair Display",
    fontStyle: "italic",
    fontSize: 14,
    color: COLORS.charcoal,
    lineHeight: 1.65,
    textAlign: "center",
    paddingHorizontal: 40,
  },
  anchorCard: {
    backgroundColor: COLORS.warmWhite,
    border: `1pt solid ${COLORS.borderLt}`,
    borderRadius: 6,
    padding: 14,
    marginBottom: 10,
  },
  anchorTag: {
    fontSize: 8,
    letterSpacing: 2,
    color: COLORS.stoneLt,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  anchorName: {
    fontFamily: "Playfair Display",
    fontStyle: "italic",
    fontSize: 16,
    color: COLORS.forest,
    marginBottom: 4,
  },
  anchorDetail: {
    fontSize: 10,
    color: COLORS.stone,
    lineHeight: 1.55,
  },
  anchorPrice: {
    fontFamily: "Playfair Display",
    fontStyle: "italic",
    fontSize: 11,
    color: COLORS.bark,
    marginTop: 6,
  },
  dayBlock: {
    marginBottom: 18,
    flexDirection: "row",
  },
  dayLabel: {
    width: 60,
    textAlign: "right",
    paddingRight: 14,
  },
  dayNum: {
    fontFamily: "Playfair Display",
    fontStyle: "italic",
    fontSize: 28,
    color: COLORS.forest,
  },
  dayDow: {
    fontSize: 8,
    letterSpacing: 1.6,
    color: COLORS.stoneLt,
    textTransform: "uppercase",
    marginTop: 2,
  },
  dayBody: {
    flex: 1,
    borderLeft: `1pt solid ${COLORS.borderLt}`,
    paddingLeft: 14,
  },
  dayTheme: {
    fontFamily: "Playfair Display",
    fontStyle: "italic",
    fontSize: 14,
    color: COLORS.forest,
    marginBottom: 4,
  },
  dayBlurb: {
    fontSize: 10,
    color: COLORS.charcoal,
    lineHeight: 1.55,
    marginBottom: 8,
  },
  evt: {
    flexDirection: "row",
    paddingVertical: 5,
  },
  evtTime: {
    width: 36,
    fontSize: 9,
    color: COLORS.stoneLt,
  },
  evtBody: {
    flex: 1,
  },
  evtName: {
    fontSize: 10,
    color: COLORS.ink,
  },
  evtDetail: {
    fontSize: 9,
    color: COLORS.stone,
  },
  footer: {
    position: "absolute",
    bottom: 28,
    left: 56,
    right: 56,
    fontSize: 8,
    letterSpacing: 1.5,
    color: COLORS.stoneLt,
    textTransform: "uppercase",
    textAlign: "center",
  },
});

type Trip = typeof trips.$inferSelect;
type Client = typeof clients.$inferSelect;
type Booking = typeof bookings.$inferSelect;

export type ProposalPdfProps = {
  trip: Trip;
  client: Client;
  bookings: Booking[];
  narrative: TripNarrative | null;
};

export function ProposalPdf({
  trip,
  client,
  bookings: bks,
  narrative,
}: ProposalPdfProps) {
  const featured = bks.filter((b) => {
    const meta = (b.metadata ?? {}) as Record<string, unknown>;
    if (meta.featured === true) return true;
    if (meta.time != null) return false;
    return b.status === "confirmed" || b.status === "pending";
  });

  const timeline = bks.filter(
    (b) => (b.metadata as Record<string, unknown> | null)?.time != null,
  );

  const days = new Map<string, typeof timeline>();
  for (const b of timeline) {
    if (!b.occursOn) continue;
    const list = days.get(b.occursOn) ?? [];
    list.push(b);
    days.set(b.occursOn, list);
  }

  return (
    <Document title={`${trip.name} — Proposal`} author="Luxe">
      {/* COVER */}
      <Page size="LETTER" style={styles.page}>
        <View style={styles.cover}>
          <Text style={styles.eyebrow}>{narrative?.heroEyebrow ?? "Trip proposal"}</Text>
          <Text style={styles.title}>{trip.name}</Text>
          <View style={styles.rule} />
          <Text style={styles.meta}>
            {formatDates(trip.startDate, trip.endDate)} · {trip.travelerCount} traveler
            {trip.travelerCount === 1 ? "" : "s"} · {trip.destination}
          </Text>
          <Text style={[styles.meta, { marginTop: 12 }]}>
            Prepared for {client.name}
          </Text>
        </View>
        <Text style={styles.footer}>Luxe · private travel, elevated by agents</Text>
      </Page>

      {/* OPENING + ANCHORS */}
      <Page size="LETTER" style={styles.page}>
        {narrative?.heroOpening ? (
          <>
            <Text style={styles.opening}>{narrative.heroOpening}</Text>
            <View style={[styles.rule, { marginTop: 28, marginBottom: 28, alignSelf: "center" }]} />
          </>
        ) : null}
        <Text style={styles.sectionEyebrow}>What's secured</Text>
        <Text style={styles.sectionTitle}>Your anchors</Text>
        {featured.length === 0 ? (
          <Text style={[styles.opening, { fontSize: 12 }]}>
            Your concierge is finalizing reservations.
          </Text>
        ) : (
          featured.map((b) => {
            const meta = (b.metadata ?? {}) as Record<string, unknown>;
            const subtitle = (meta.subtitle as string | undefined) ?? defaultSubtitle(b.kind);
            return (
              <View key={b.id} style={styles.anchorCard}>
                <Text style={styles.anchorTag}>{subtitle}</Text>
                <Text style={styles.anchorName}>{b.title}</Text>
                {b.detail ? (
                  <Text style={styles.anchorDetail}>{b.detail}</Text>
                ) : null}
                {b.priceCents != null ? (
                  <Text style={styles.anchorPrice}>
                    ${(b.priceCents / 100).toLocaleString("en-US")}
                  </Text>
                ) : null}
              </View>
            );
          })
        )}
        <Text style={styles.footer}>Luxe · private travel, elevated by agents</Text>
      </Page>

      {/* ITINERARY */}
      <Page size="LETTER" style={styles.page} wrap>
        <Text style={styles.sectionEyebrow}>The rhythm</Text>
        <Text style={styles.sectionTitle}>Your days unfold</Text>
        {[...days.entries()].map(([date, items]) => {
          const summary = narrative?.daySummaries?.[date];
          const d = new Date(date + "T00:00:00");
          return (
            <View key={date} style={styles.dayBlock} wrap={false}>
              <View style={styles.dayLabel}>
                <Text style={styles.dayNum}>{String(d.getDate()).padStart(2, "0")}</Text>
                <Text style={styles.dayDow}>{
                  ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][d.getDay()]
                }</Text>
              </View>
              <View style={styles.dayBody}>
                {summary?.theme ? (
                  <Text style={styles.dayTheme}>{summary.theme}</Text>
                ) : null}
                {summary?.blurb ? (
                  <Text style={styles.dayBlurb}>{summary.blurb}</Text>
                ) : null}
                {items.map((b) => {
                  const meta = (b.metadata ?? {}) as Record<string, unknown>;
                  const time = meta.time as string | undefined;
                  const name = (meta.timelineName as string | undefined) ?? b.title;
                  const detail =
                    (meta.timelineDetail as string | undefined) ?? b.detail ?? "";
                  return (
                    <View key={b.id} style={styles.evt}>
                      <Text style={styles.evtTime}>{time ?? "—"}</Text>
                      <View style={styles.evtBody}>
                        <Text style={styles.evtName}>{name}</Text>
                        {detail ? <Text style={styles.evtDetail}>{detail}</Text> : null}
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          );
        })}
        <Text style={styles.footer}>Luxe · private travel, elevated by agents</Text>
      </Page>
    </Document>
  );
}

function defaultSubtitle(kind: string): string {
  switch (kind) {
    case "hotel": return "Hotel";
    case "flight": return "Flight";
    case "dining": return "Dining";
    case "experience": return "Experience";
    case "transfer": return "Transfer";
    default: return "Booking";
  }
}

function formatDates(start: string | null, end: string | null) {
  if (!start || !end) return "—";
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const s = new Date(start + "T00:00:00");
  const e = new Date(end + "T00:00:00");
  const sameMonth = s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear();
  return sameMonth
    ? `${months[s.getMonth()]} ${s.getDate()}–${e.getDate()}, ${e.getFullYear()}`
    : `${months[s.getMonth()]} ${s.getDate()}–${months[e.getMonth()]} ${e.getDate()}, ${e.getFullYear()}`;
}
