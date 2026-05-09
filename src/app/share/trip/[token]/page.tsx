import { notFound } from "next/navigation";
import {
  findValidToken,
  getSharedTripDetail,
  getTripWeatherChips,
} from "@/lib/queries/share";
import { touchTokenVisit } from "@/lib/share/tokens";
import { ShareTripView } from "@/components/share/ShareTripView";

export const dynamic = "force-dynamic";

type Params = Promise<{ token: string }>;

export default async function SharedTripPage({ params }: { params: Params }) {
  const { token } = await params;
  const tokenRow = await findValidToken(token);
  if (!tokenRow) notFound();

  const trip = await getSharedTripDetail(tokenRow.tripId);
  if (!trip) notFound();

  /* Best-effort visit tracking; failures are silent. */
  void touchTokenVisit(token).catch(() => {});

  const weather = await getTripWeatherChips(
    trip.destination,
    trip.startDate,
    trip.endDate,
  );

  return <ShareTripView trip={trip} token={token} weather={weather} />;
}
