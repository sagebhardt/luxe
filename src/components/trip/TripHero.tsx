import Link from "next/link";
import {
  formatAmountShort,
  formatDateRange,
  formatMoney,
  pct,
} from "@/lib/format";
import type { trips, clients, tripShareTokens } from "@/lib/db/schema";
import { ShareTripButton } from "./ShareTripButton";
import { GenerateNarrativeButton } from "./GenerateNarrativeButton";
import { ProposalDownloadButton } from "./ProposalDownloadButton";

type Trip = typeof trips.$inferSelect;
type Client = typeof clients.$inferSelect;
type Token = typeof tripShareTokens.$inferSelect;

type Financials = {
  baseCurrency: string;
  sellInBase: number;
  costInBase: number;
  margin: number;
  marginPct: number | null;
  itdShare: number;
  odylicShare: number;
  itdSharePct: number;
  unlockedCount: number;
  hasAnyData: boolean;
};

type ViewerCtx = { role: "itd" | "admin" };

export function TripHero({
  trip,
  client,
  shareTokens,
  financials,
  viewer,
}: {
  trip: Trip;
  client: Client;
  shareTokens: Token[];
  financials: Financials;
  viewer: ViewerCtx;
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
          {financials.hasAnyData ? (
            <div className="trip-margin-line">
              <span className="tm-label">Sell</span>{" "}
              <em>
                {formatAmountShort(
                  financials.sellInBase,
                  financials.baseCurrency,
                )}
              </em>
              &nbsp;·&nbsp;<span className="tm-label">Cost</span>{" "}
              <em>
                {formatAmountShort(
                  financials.costInBase,
                  financials.baseCurrency,
                )}
              </em>
              {financials.marginPct != null ? (
                <>
                  &nbsp;·&nbsp;
                  <em
                    className={`tm-margin${financials.unlockedCount === 0 ? " locked" : ""}`}
                  >
                    {financials.marginPct.toFixed(0)}% margin
                  </em>
                  {financials.unlockedCount > 0 ? (
                    <span className="tm-unlocked">
                      &nbsp;estimated · {financials.unlockedCount} unlocked
                    </span>
                  ) : null}
                </>
              ) : null}
            </div>
          ) : null}
          {financials.hasAnyData && financials.margin > 0 ? (
            <div className="trip-margin-split">
              <span className="tm-label">ITD</span>{" "}
              <em>
                {formatAmountShort(
                  financials.itdShare,
                  financials.baseCurrency,
                )}
              </em>
              &nbsp;·&nbsp;<span className="tm-label">Odylic</span>{" "}
              <em>
                {formatAmountShort(
                  financials.odylicShare,
                  financials.baseCurrency,
                )}
              </em>
              <span className="tm-split-pct">
                &nbsp;{Math.round(financials.itdSharePct * 100)}/
                {Math.round((1 - financials.itdSharePct) * 100)}
                {viewer.role === "admin" ? " · admin view" : ""}
              </span>
            </div>
          ) : null}
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
