import "server-only";

/**
 * Minimal Duffel API client — just enough for Flight Offers Search.
 * Docs: https://duffel.com/docs/api/v2/overview
 *
 * Uses the test environment by default (token starts with `duffel_test_`).
 */

const DUFFEL_BASE = "https://api.duffel.com";
const DUFFEL_API_VERSION = "v2";

export class DuffelError extends Error {
  status: number;
  body: unknown;
  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = "DuffelError";
    this.status = status;
    this.body = body;
  }
}

export type DuffelSlice = {
  origin: string; // IATA code
  destination: string; // IATA code
  departure_date: string; // YYYY-MM-DD
};

export type DuffelOfferRequestInput = {
  slices: DuffelSlice[];
  passengers: { type: "adult" | "child" | "infant_without_seat" }[];
  cabin_class?: "economy" | "premium_economy" | "business" | "first";
};

export type DuffelSegment = {
  origin: { iata_code: string; name?: string };
  destination: { iata_code: string; name?: string };
  departing_at: string;
  arriving_at: string;
  marketing_carrier: { iata_code: string; name?: string };
  marketing_carrier_flight_number?: string;
  operating_carrier?: { iata_code: string; name?: string };
  duration?: string;
  aircraft?: { name?: string };
};

export type DuffelOffer = {
  id: string;
  total_amount: string; // decimal string
  total_currency: string;
  slices: {
    segments: DuffelSegment[];
    duration?: string;
  }[];
  owner: { iata_code: string; name?: string };
  passengers: { type: string }[];
  cabin_class?: string;
};

export type DuffelOfferRequest = {
  data: {
    id: string;
    offers: DuffelOffer[];
  };
};

export async function searchOffers(
  input: DuffelOfferRequestInput,
  options?: { limit?: number },
): Promise<DuffelOffer[]> {
  const token = process.env.DUFFEL_ACCESS_TOKEN;
  if (!token) {
    throw new DuffelError(
      "DUFFEL_ACCESS_TOKEN not set in environment.",
      500,
      null,
    );
  }
  const limit = options?.limit ?? 8;

  const url = `${DUFFEL_BASE}/air/offer_requests?return_offers=true&supplier_timeout=20000`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Duffel-Version": DUFFEL_API_VERSION,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ data: input }),
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text();
    throw new DuffelError(
      `Duffel offer search failed: ${res.status}`,
      res.status,
      body,
    );
  }
  const json = (await res.json()) as DuffelOfferRequest;
  const sorted = [...json.data.offers].sort(
    (a, b) => Number(a.total_amount) - Number(b.total_amount),
  );
  return sorted.slice(0, limit);
}
