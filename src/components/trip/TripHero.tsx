import Link from "next/link";
import { formatDateRange, formatMoney, pct } from "@/lib/format";
import type { trips, clients } from "@/lib/db/schema";

type Trip = typeof trips.$inferSelect;
type Client = typeof clients.$inferSelect;

export function TripHero({
  trip,
  client,
}: {
  trip: Trip;
  client: Client;
}) {
  const committedPct = pct(trip.committedCents, trip.budgetCents ?? 0);
  return (
    <div className="trip-hero">
      <Link
        href={`/clients?id=${client.id}`}
        className="trip-client-link"
      >
        For <em>{client.name}</em> →
      </Link>
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
