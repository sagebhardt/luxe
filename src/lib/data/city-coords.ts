/**
 * City → lat/lng for hotel search via Duffel Stays.
 * Tiny static lookup; production should hit a geocoding API.
 */

const COORDS: Record<string, { lat: number; lng: number }> = {
  tokyo: { lat: 35.6762, lng: 139.6503 },
  kyoto: { lat: 35.0116, lng: 135.7681 },
  lisbon: { lat: 38.7223, lng: -9.1393 },
  alentejo: { lat: 38.5664, lng: -7.9135 },
  marrakech: { lat: 31.6295, lng: -7.9811 },
  "new york": { lat: 40.7128, lng: -74.006 },
  nyc: { lat: 40.7128, lng: -74.006 },
  patagonia: { lat: -50.3, lng: -72.6 },
  santiago: { lat: -33.4489, lng: -70.6693 },
  maldives: { lat: 4.1755, lng: 73.5093 },
  bali: { lat: -8.4095, lng: 115.1889 },
  tuscany: { lat: 43.7711, lng: 11.2486 },
};

function normalize(s: string) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

export function resolveCoords(query: string) {
  const n = normalize(query);
  if (COORDS[n]) return COORDS[n];
  for (const [city, coords] of Object.entries(COORDS)) {
    if (n.includes(city)) return coords;
  }
  return null;
}
