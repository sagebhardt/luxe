import "server-only";
import { and, asc, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  agentDecisions,
  agentLogMessages,
  bookings,
  clients,
  npsResponses,
  trips,
  tripAlerts,
  tripShareTokens,
} from "@/lib/db/schema";
import {
  fetchDailyWeather,
  seasonalForDate,
  toChip,
  type WeatherChip,
} from "@/lib/data/weather";
import { resolveCoords } from "@/lib/data/city-coords";

export async function findValidToken(token: string) {
  const row = await db.query.tripShareTokens.findFirst({
    where: and(
      eq(tripShareTokens.token, token),
      isNull(tripShareTokens.revokedAt),
    ),
  });
  return row ?? null;
}

export async function listTripTokens(tripId: string) {
  return db
    .select()
    .from(tripShareTokens)
    .where(eq(tripShareTokens.tripId, tripId))
    .orderBy(asc(tripShareTokens.createdAt));
}

export async function getSharedTripDetail(tripId: string) {
  return db.query.trips.findFirst({
    where: eq(trips.id, tripId),
    with: {
      client: true,
      bookings: { orderBy: [asc(bookings.occursOn), asc(bookings.createdAt)] },
      log: { orderBy: [asc(agentLogMessages.occurredAt)] },
      decisions: {
        where: eq(agentDecisions.status, "pending_approval"),
      },
      /* Only client-visible alerts surface on the share page —
       * operator-only alerts stay inside /trip. */
      alerts: {
        where: eq(tripAlerts.clientVisible, true),
        orderBy: [asc(tripAlerts.sortOrder), asc(tripAlerts.createdAt)],
      },
    },
  });
}

export async function getTripNpsResponse(tripId: string) {
  const [row] = await db
    .select()
    .from(npsResponses)
    .where(eq(npsResponses.tripId, tripId))
    .limit(1);
  return row ?? null;
}

export async function getTripWeatherChips(
  destination: string,
  startDate: string | null,
  endDate: string | null,
): Promise<Record<string, WeatherChip>> {
  if (!startDate || !endDate) return {};
  const coords = resolveCoords(destination);
  const out: Record<string, WeatherChip> = {};

  if (coords) {
    const forecast = await fetchDailyWeather({
      lat: coords.lat,
      lng: coords.lng,
      startDate,
      endDate,
    });
    for (const d of forecast) out[d.date] = toChip(d);
  }

  /* Fill any dates not covered by forecast with seasonal averages. */
  const cursor = new Date(startDate + "T00:00:00");
  const end = new Date(endDate + "T00:00:00");
  while (cursor <= end) {
    const iso = cursor.toISOString().slice(0, 10);
    if (!out[iso]) {
      const seasonal = seasonalForDate(destination, iso);
      if (seasonal) out[iso] = seasonal;
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return out;
}

/* Type unused but referenced for relations init */
void clients;
