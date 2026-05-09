import { formatDateRange, formatMoney, pct } from "@/lib/format";
import type { trips } from "@/lib/db/schema";

type Trip = typeof trips.$inferSelect;

export function TripHero({ trip }: { trip: Trip }) {
  const committedPct = pct(trip.committedCents, trip.budgetCents ?? 0);
  return (
    <div className="trip-hero">
      <div className="trip-heading">{trip.name}</div>
      <div className="trip-meta-line">
        {formatDateRange(trip.startDate, trip.endDate)} &nbsp;·&nbsp;{" "}
        {trip.travelerCount} traveler
        {trip.travelerCount === 1 ? "" : "s"} &nbsp;·&nbsp; Budget{" "}
        <em>{formatMoney(trip.budgetCents)}</em> &nbsp;·&nbsp;{" "}
        <em>{committedPct}%</em> committed
      </div>
    </div>
  );
}
