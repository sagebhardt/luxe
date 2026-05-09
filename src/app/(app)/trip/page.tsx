import { notFound } from "next/navigation";
import { TripSidebar } from "@/components/trip/TripSidebar";
import { TripHero } from "@/components/trip/TripHero";
import { AgentPipeline } from "@/components/trip/AgentPipeline";
import { ApprovalBanner } from "@/components/trip/ApprovalBanner";
import { CommittedDecisions } from "@/components/trip/CommittedDecisions";
import { ItineraryTimeline } from "@/components/trip/ItineraryTimeline";
import { AgentLog } from "@/components/trip/AgentLog";
import { AgentInput } from "@/components/trip/AgentInput";
import { BudgetTracker } from "@/components/trip/BudgetTracker";
import { TripAlerts } from "@/components/trip/TripAlerts";
import {
  getDefaultTripId,
  getTripBudget,
  getTripDetail,
  getTripFinancials,
  listActiveShareTokens,
  listSidebarTrips,
} from "@/lib/queries/trips";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ id?: string }>;

export default async function TripPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { id: idParam } = await searchParams;
  const tripId = idParam ?? (await getDefaultTripId());
  if (!tripId) notFound();

  const [trip, sidebar, budget, shareTokens, financials] = await Promise.all([
    getTripDetail(tripId),
    listSidebarTrips(),
    getTripBudget(tripId),
    listActiveShareTokens(tripId),
    getTripFinancials(tripId),
  ]);
  if (!trip) notFound();

  const featuredBookings = trip.bookings.filter(
    (b) => (b.metadata as Record<string, unknown> | null)?.featured === true,
  );
  const timelineBookings = trip.bookings.filter(
    (b) => (b.metadata as Record<string, unknown> | null)?.time != null,
  );
  const pendingDecision = trip.decisions[0] ?? null;

  return (
    <div className="view">
      <div className="trip-layout">
        <TripSidebar
          activeTrips={sidebar.active}
          completedTrips={sidebar.completed}
          selectedTripId={tripId}
          preferences={trip.client.preferences}
          client={trip.client}
        />

        <main className="trip-main">
          <TripHero
            trip={trip}
            client={trip.client}
            shareTokens={shareTokens}
            financials={financials}
          />
          <div className="section-divider" />

          <div className="sec-lbl">Agent Pipeline</div>
          <AgentPipeline runs={trip.agentRuns} tripId={tripId} />

          {pendingDecision ? (
            <ApprovalBanner decision={pendingDecision} />
          ) : null}

          <div className="sec-lbl">Committed Decisions</div>
          <CommittedDecisions
            bookings={featuredBookings}
            baseCurrency={trip.baseCurrency}
          />

          <div className="sec-lbl">Draft Itinerary</div>
          <ItineraryTimeline bookings={timelineBookings} />
        </main>

        <aside className="trip-right">
          <div className="rp-sec flush-bottom">
            <div className="rp-lbl">Agent Log</div>
          </div>
          <AgentLog messages={trip.log} />
          <AgentInput />
          <div className="rp-sec">
            <div className="rp-lbl">Budget</div>
            <BudgetTracker budget={budget} />
          </div>
          <div className="rp-sec">
            <div className="rp-lbl">Alerts</div>
            <TripAlerts alerts={trip.alerts} />
          </div>
        </aside>
      </div>
    </div>
  );
}
