/* eslint-disable react/no-unknown-property */
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { getItdStatement } from "@/lib/queries/itd-statement";

/**
 * Monthly ITD commission statement. Single page (multi-page if many
 * line items) with: header, period summary, payouts table, earnings
 * table, net balance footer.
 *
 * Fonts are registered globally by registerProposalFonts() — this
 * statement reuses them.
 */

type StatementData = NonNullable<Awaited<ReturnType<typeof getItdStatement>>>;

const COLORS = {
  cream: "#f7f2ea",
  ivory: "#fdfaf5",
  warmWhite: "#fffef9",
  bark: "#c4a882",
  forest: "#2d4038",
  ink: "#1e1a14",
  charcoal: "#3a342a",
  stone: "#8a8076",
  stoneLt: "#b5aea4",
  borderLt: "#e5dccb",
  border: "#cabea6",
};

const styles = StyleSheet.create({
  page: {
    backgroundColor: COLORS.cream,
    padding: 48,
    fontFamily: "Jost",
    fontSize: 10,
    color: COLORS.ink,
    lineHeight: 1.5,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 30,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.bark,
  },
  brand: {
    fontFamily: "Playfair Display",
    fontStyle: "italic",
    fontSize: 32,
    color: COLORS.forest,
    lineHeight: 1,
  },
  brandSub: {
    fontSize: 9,
    color: COLORS.bark,
    letterSpacing: 3,
    textTransform: "uppercase",
    marginTop: 6,
  },
  meta: {
    textAlign: "right",
    fontSize: 10,
  },
  metaLabel: {
    fontSize: 8,
    color: COLORS.stoneLt,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  metaVal: {
    fontFamily: "Playfair Display",
    fontStyle: "italic",
    fontSize: 14,
    color: COLORS.ink,
    marginTop: 2,
  },
  h1: {
    fontFamily: "Playfair Display",
    fontStyle: "italic",
    fontSize: 28,
    color: COLORS.ink,
    marginBottom: 6,
  },
  greeting: {
    fontSize: 11,
    color: COLORS.charcoal,
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 9,
    fontWeight: 500,
    letterSpacing: 3,
    color: COLORS.stoneLt,
    textTransform: "uppercase",
    marginBottom: 10,
    marginTop: 18,
  },
  table: {
    marginBottom: 14,
    backgroundColor: COLORS.warmWhite,
    borderWidth: 1,
    borderColor: COLORS.borderLt,
    borderRadius: 4,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: COLORS.ivory,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLt,
    padding: 10,
    fontSize: 8,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: COLORS.stoneLt,
    fontWeight: 500,
  },
  tableRow: {
    flexDirection: "row",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLt,
    fontSize: 10,
    color: COLORS.charcoal,
  },
  tableRowLast: {
    borderBottomWidth: 0,
  },
  cellWide: { flex: 2.5 },
  cellMid: { flex: 1.5 },
  cellNum: { flex: 1, textAlign: "right" },
  cellNarrow: { flex: 0.8 },
  italic: {
    fontFamily: "Playfair Display",
    fontStyle: "italic",
  },
  emptyState: {
    padding: 18,
    textAlign: "center",
    color: COLORS.stone,
    fontStyle: "italic",
    fontSize: 10,
  },
  netBox: {
    marginTop: 30,
    padding: 18,
    backgroundColor: COLORS.forest,
    color: COLORS.ivory,
    borderRadius: 4,
  },
  netLabel: {
    fontSize: 8,
    letterSpacing: 3,
    color: COLORS.bark,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  netRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  netCcy: {
    fontSize: 9,
    color: COLORS.stoneLt,
    letterSpacing: 2,
  },
  netAmount: {
    fontFamily: "Playfair Display",
    fontStyle: "italic",
    fontSize: 16,
    color: COLORS.ivory,
  },
  footer: {
    marginTop: 30,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLt,
    fontSize: 8,
    color: COLORS.stoneLt,
    textAlign: "center",
  },
});

function fmt(amount: string | number, currency: string) {
  const n = typeof amount === "string" ? Number(amount) : amount;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(n);
}

const KIND_LABEL: Record<string, string> = {
  itd_payout: "Payout",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Pendiente",
  completed: "Completado",
  cancelled: "Cancelado",
};

export function ItdStatementPdf({
  data,
  periodLabel,
  generatedOn,
}: {
  data: StatementData;
  periodLabel: string;
  generatedOn: string;
}) {
  /* Bucket payouts by currency for the net-due summary. */
  const pending: Record<string, number> = {};
  const paid: Record<string, number> = {};
  for (const p of data.payouts) {
    const amt = Number(p.amount);
    if (p.status === "pending") pending[p.currency] = (pending[p.currency] ?? 0) + amt;
    if (p.status === "completed") paid[p.currency] = (paid[p.currency] ?? 0) + amt;
  }

  /* Earnings (computed from bookings) bucketed by margin currency. */
  const earnedByCcy: Record<string, number> = {};
  for (const e of data.earnings) {
    earnedByCcy[e.marginCurrency] = (earnedByCcy[e.marginCurrency] ?? 0) + e.itdShare;
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>Odylic</Text>
            <Text style={styles.brandSub}>Statement of commissions</Text>
          </View>
          <View style={styles.meta}>
            <Text style={styles.metaLabel}>Period</Text>
            <Text style={styles.metaVal}>{periodLabel}</Text>
            <Text style={[styles.metaLabel, { marginTop: 8 }]}>
              Generated
            </Text>
            <Text style={{ fontSize: 10, marginTop: 2 }}>{generatedOn}</Text>
          </View>
        </View>

        <Text style={styles.h1}>{data.itd.name || data.itd.email || "ITD"}</Text>
        <Text style={styles.greeting}>
          Tier de comisión actual:{" "}
          <Text style={styles.italic}>
            {Math.round(data.itd.commissionPctBase * 100)}%
          </Text>{" "}
          ({Math.round(data.itd.commissionPctBase * 100)}/
          {Math.round((1 - data.itd.commissionPctBase) * 100)} ITD/Odylic)
        </Text>

        <Text style={styles.sectionLabel}>Comisión generada en el período</Text>
        {data.earnings.length === 0 ? (
          <View style={[styles.table, styles.emptyState]}>
            <Text>Sin reservas confirmadas en este período.</Text>
          </View>
        ) : (
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.cellWide}>Trip / cliente</Text>
              <Text style={styles.cellMid}>Línea</Text>
              <Text style={styles.cellNum}>Margen</Text>
              <Text style={styles.cellNum}>Tu comisión</Text>
            </View>
            {data.earnings.map((e, i) => (
              <View
                key={i}
                style={[
                  styles.tableRow,
                  i === data.earnings.length - 1 ? styles.tableRowLast : {},
                ]}
              >
                <View style={styles.cellWide}>
                  <Text>{e.tripName}</Text>
                  <Text style={{ fontSize: 9, color: COLORS.stone }}>
                    {e.clientName} · {e.destination}
                  </Text>
                </View>
                <Text style={styles.cellMid}>{e.bookingTitle}</Text>
                <Text style={styles.cellNum}>
                  {fmt(e.margin, e.marginCurrency)}
                </Text>
                <Text style={[styles.cellNum, styles.italic]}>
                  {fmt(e.itdShare, e.marginCurrency)}
                </Text>
              </View>
            ))}
          </View>
        )}

        <Text style={styles.sectionLabel}>Payouts en el período</Text>
        {data.payouts.length === 0 ? (
          <View style={[styles.table, styles.emptyState]}>
            <Text>Sin payouts registrados en este período.</Text>
          </View>
        ) : (
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.cellNarrow}>Fecha</Text>
              <Text style={styles.cellWide}>Trip</Text>
              <Text style={styles.cellMid}>Ref</Text>
              <Text style={styles.cellNarrow}>Estado</Text>
              <Text style={styles.cellNum}>Monto</Text>
            </View>
            {data.payouts.map((p, i) => (
              <View
                key={p.id}
                style={[
                  styles.tableRow,
                  i === data.payouts.length - 1 ? styles.tableRowLast : {},
                ]}
              >
                <Text style={styles.cellNarrow}>{p.occurredOn}</Text>
                <View style={styles.cellWide}>
                  <Text>{p.tripName ?? "—"}</Text>
                  {p.clientName ? (
                    <Text style={{ fontSize: 9, color: COLORS.stone }}>
                      {p.clientName}
                    </Text>
                  ) : null}
                </View>
                <Text style={styles.cellMid}>{p.reference ?? "—"}</Text>
                <Text style={styles.cellNarrow}>
                  {STATUS_LABEL[p.status] ?? p.status}
                </Text>
                <Text style={styles.cellNum}>
                  {fmt(p.amount, p.currency)}
                </Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.netBox}>
          <Text style={styles.netLabel}>Resumen del período</Text>
          {Object.keys(earnedByCcy).length > 0 ? (
            <>
              <Text style={styles.netLabel}>Comisión generada</Text>
              {Object.entries(earnedByCcy).map(([c, v]) => (
                <View key={`earned-${c}`} style={styles.netRow}>
                  <Text style={styles.netCcy}>{c}</Text>
                  <Text style={styles.netAmount}>{fmt(v, c)}</Text>
                </View>
              ))}
            </>
          ) : null}
          {Object.keys(pending).length > 0 ? (
            <>
              <Text style={[styles.netLabel, { marginTop: 12 }]}>
                Pendiente de pago
              </Text>
              {Object.entries(pending).map(([c, v]) => (
                <View key={`pend-${c}`} style={styles.netRow}>
                  <Text style={styles.netCcy}>{c}</Text>
                  <Text style={styles.netAmount}>{fmt(v, c)}</Text>
                </View>
              ))}
            </>
          ) : null}
          {Object.keys(paid).length > 0 ? (
            <>
              <Text style={[styles.netLabel, { marginTop: 12 }]}>
                Pagado en el período
              </Text>
              {Object.entries(paid).map(([c, v]) => (
                <View key={`paid-${c}`} style={styles.netRow}>
                  <Text style={styles.netCcy}>{c}</Text>
                  <Text style={styles.netAmount}>{fmt(v, c)}</Text>
                </View>
              ))}
            </>
          ) : null}
        </View>

        <Text style={styles.footer}>
          Statement generated by Odylic operations · sgr@ynk.cl
        </Text>
      </Page>
    </Document>
  );
}

KIND_LABEL.toString;
