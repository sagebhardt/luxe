/**
 * Tiny static airport-code lookup for v1 demo. Production should use
 * Duffel's Places API or a maintained dataset. Keys are lowercased,
 * accent-stripped substrings of cities/regions in the seed data.
 */

const CITY_TO_IATA: Record<string, string> = {
  // Origins (where Luxe clients live)
  santiago: "SCL",
  lima: "LIM",
  "buenos aires": "EZE",

  // Destinations (Marcela's trips + others)
  tokyo: "NRT",
  kyoto: "ITM",
  patagonia: "PUQ",
  lisbon: "LIS",
  alentejo: "LIS",
  marrakech: "RAK",
  "new york": "JFK",
  nyc: "JFK",
  maldives: "MLE",
  bali: "DPS",
  tuscany: "FLR",
};

function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

export function resolveIata(query: string): string | null {
  const n = normalize(query);
  if (CITY_TO_IATA[n]) return CITY_TO_IATA[n];
  // Substring match — picks the first hit (good enough for seed data)
  for (const [city, code] of Object.entries(CITY_TO_IATA)) {
    if (n.includes(city)) return code;
  }
  return null;
}

export function ALL_AIRPORTS() {
  return CITY_TO_IATA;
}
