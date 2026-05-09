import Link from "next/link";
import { formatDateRange, formatMoney, pct } from "@/lib/format";
import type { trips, clients, tripShareTokens } from "@/lib/db/schema";
import { ShareTripButton } from "./ShareTripButton";
import { GenerateNarrativeButton } from "./GenerateNarrativeButton";
import { ProposalDownloadButton } from "./ProposalDownloadButton";

type Trip = typeof trips.$inferSelect;
type Client = typeof clients.$inferSelect;
type Token = typeof tripShareTokens.$inferSelect;

export function TripHero({
  trip,
  client,
  shareTokens,
}: {
  trip: Trip;
  client: Client;
  shareTokens: Token[];
}) {
  const committedPct = pct(trip.committedCents, trip.budgetCents ?? 0);
  return (
    <div className="trip-hero">
      <div className="trip-hero-row">
        <div>
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
        <div className="trip-hero-actions">
          <GenerateNarrativeButton
            tripId={trip.id}
            generatedAt={trip.clientNarrativeGeneratedAt}
          />
          <div className="trip-hero-share-row">
            <ProposalDownloadButton tripId={trip.id} />
            <ShareTripButton tripId={trip.id} existingTokens={shareTokens} />
          </div>
        </div>
      </div>
    </div>
  );
}
