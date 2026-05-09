/**
 * Curated boutique-luxury hotel catalog used by the Hotel Agent and
 * the Client Chat Agent. Why static: Duffel Stays requires a paid
 * tier; other free hotel APIs gate on partner approval.
 *
 * Structured amenity flags (gym/pool/spa/etc) are the most-asked
 * questions in chat, so we keep them as booleans for definitive
 * answers. The free-form `amenities` array carries the rest.
 */

export type HotelAmenityFlags = {
  gym: boolean;
  pool: boolean;
  spa: boolean;
  restaurantOnsite: boolean;
  breakfastIncluded: boolean;
  airportTransfer: boolean; // private transfer included or arrangeable
  petFriendly: boolean;
};

export type HotelOption = {
  id: string;
  name: string;
  neighborhood: string;
  style: "boutique" | "design" | "ryokan" | "riad" | "lodge" | "resort";
  starsApprox: number; // 4–5
  pricePerNightUsd: number;
  vibe: string;
  /** Structured amenity flags — definitive yes/no for the chat agent. */
  flags: HotelAmenityFlags;
  /** Free-form notable amenities (concierge service style). */
  amenities: string[];
};

const TOKYO: HotelOption[] = [
  {
    id: "tokyo-hoshino-omo5",
    name: "Hoshino OMO5 Otsuka",
    neighborhood: "Otsuka",
    style: "boutique",
    starsApprox: 4,
    pricePerNightUsd: 380,
    vibe: "Neighborhood-immersive boutique with curated city walks at dawn.",
    flags: {
      gym: false,
      pool: false,
      spa: false,
      restaurantOnsite: true,
      breakfastIncluded: true,
      airportTransfer: false,
      petFriendly: false,
    },
    amenities: [
      "concierge city walks",
      "breakfast included",
      "design-forward rooms",
      "rooftop terrace",
    ],
  },
  {
    id: "tokyo-hotel-k5",
    name: "Hotel K5",
    neighborhood: "Kabutocho (Nihonbashi)",
    style: "design",
    starsApprox: 5,
    pricePerNightUsd: 510,
    vibe: "Quiet, art-led, with adjoining wine bar and natural-wine restaurant.",
    flags: {
      gym: false,
      pool: false,
      spa: false,
      restaurantOnsite: true,
      breakfastIncluded: false,
      airportTransfer: false,
      petFriendly: false,
    },
    amenities: ["library lounge", "in-house bar", "sento partnership"],
  },
  {
    id: "tokyo-trunk",
    name: "Trunk(Hotel) CAT STREET",
    neighborhood: "Shibuya / Cat Street",
    style: "boutique",
    starsApprox: 4,
    pricePerNightUsd: 420,
    vibe: "Sustainable design hotel embedded in Tokyo's creative quarter.",
    flags: {
      gym: false,
      pool: false,
      spa: false,
      restaurantOnsite: true,
      breakfastIncluded: false,
      airportTransfer: false,
      petFriendly: true,
    },
    amenities: ["rooftop terrace", "curated minibar", "bike fleet"],
  },
  {
    id: "tokyo-hotel-niwa",
    name: "Hotel Niwa Tokyo",
    neighborhood: "Kanda",
    style: "ryokan",
    starsApprox: 4,
    pricePerNightUsd: 290,
    vibe: "Modern ryokan within a stone garden — quiet despite central Tokyo.",
    flags: {
      gym: false,
      pool: false,
      spa: true, // onsen-style bath
      restaurantOnsite: true,
      breakfastIncluded: false,
      airportTransfer: false,
      petFriendly: false,
    },
    amenities: ["onsen-style bath", "tea ceremony available", "kaiseki breakfast"],
  },
];

const KYOTO: HotelOption[] = [
  {
    id: "kyoto-noku",
    name: "Noku Kyoto",
    neighborhood: "Nakagyo",
    style: "boutique",
    starsApprox: 4,
    pricePerNightUsd: 290,
    vibe: "Machiya-inspired interiors steps from Nishiki Market.",
    flags: {
      gym: true,
      pool: false,
      spa: false,
      restaurantOnsite: true,
      breakfastIncluded: true,
      airportTransfer: false,
      petFriendly: false,
    },
    amenities: ["library", "in-house cafe", "machiya-style suites", "fitness room"],
  },
  {
    id: "kyoto-tawaraya",
    name: "Tawaraya Ryokan",
    neighborhood: "Nakagyo (Fuyacho)",
    style: "ryokan",
    starsApprox: 5,
    pricePerNightUsd: 1200,
    vibe: "Three-century-old ryokan; arguably Japan's most refined ryokan stay.",
    flags: {
      gym: false,
      pool: false,
      spa: true,
      restaurantOnsite: true,
      breakfastIncluded: true,
      airportTransfer: true,
      petFriendly: false,
    },
    amenities: [
      "private cypress baths",
      "kaiseki dinner included",
      "tea ceremony",
    ],
  },
  {
    id: "kyoto-aman",
    name: "Aman Kyoto",
    neighborhood: "Takagamine (Northern Hills)",
    style: "resort",
    starsApprox: 5,
    pricePerNightUsd: 1800,
    vibe: "Forested retreat just north of the city. Onsen and Pavilion suites.",
    flags: {
      gym: true,
      pool: true,
      spa: true,
      restaurantOnsite: true,
      breakfastIncluded: true,
      airportTransfer: true,
      petFriendly: false,
    },
    amenities: ["onsen", "spa", "private dining", "indoor pool", "fitness center"],
  },
  {
    id: "kyoto-sowaka",
    name: "Sowaka",
    neighborhood: "Gion",
    style: "ryokan",
    starsApprox: 5,
    pricePerNightUsd: 720,
    vibe: "Restored 100-year machiya in the heart of the geisha district.",
    flags: {
      gym: false,
      pool: false,
      spa: true,
      restaurantOnsite: true,
      breakfastIncluded: true,
      airportTransfer: true,
      petFriendly: false,
    },
    amenities: ["la patisserie spa", "garden suites", "kaiseki"],
  },
];

const LISBON: HotelOption[] = [
  {
    id: "lisbon-memmo-alfama",
    name: "Memmo Alfama",
    neighborhood: "Alfama",
    style: "boutique",
    starsApprox: 4,
    pricePerNightUsd: 320,
    vibe: "Cliffside boutique above the Tagus; rooftop pool overlooks the river.",
    flags: {
      gym: false,
      pool: true,
      spa: false,
      restaurantOnsite: true,
      breakfastIncluded: true,
      airportTransfer: false,
      petFriendly: false,
    },
    amenities: ["rooftop pool", "wine bar", "city-view rooms"],
  },
  {
    id: "lisbon-bairro-alto",
    name: "Bairro Alto Hotel",
    neighborhood: "Bairro Alto",
    style: "design",
    starsApprox: 5,
    pricePerNightUsd: 480,
    vibe: "Refined Portuguese landmark facing Praça Luís de Camões.",
    flags: {
      gym: true,
      pool: false,
      spa: true,
      restaurantOnsite: true,
      breakfastIncluded: true,
      airportTransfer: true,
      petFriendly: false,
    },
    amenities: ["rooftop bar", "spa", "michelin-star dining", "fitness center"],
  },
  {
    id: "lisbon-santiago-alfama",
    name: "Santiago de Alfama",
    neighborhood: "Alfama",
    style: "boutique",
    starsApprox: 5,
    pricePerNightUsd: 410,
    vibe: "15th-century palace turned 19-room boutique.",
    flags: {
      gym: false,
      pool: false,
      spa: true,
      restaurantOnsite: true,
      breakfastIncluded: true,
      airportTransfer: false,
      petFriendly: true,
    },
    amenities: ["honesty bar", "portuguese chef", "private terrace suites"],
  },
];

const MARRAKECH: HotelOption[] = [
  {
    id: "marrakech-mamounia",
    name: "La Mamounia",
    neighborhood: "Hivernage / Old City",
    style: "resort",
    starsApprox: 5,
    pricePerNightUsd: 1100,
    vibe: "Legendary 1920s palace, vast gardens, four restaurants on site.",
    flags: {
      gym: true,
      pool: true,
      spa: true,
      restaurantOnsite: true,
      breakfastIncluded: true,
      airportTransfer: true,
      petFriendly: false,
    },
    amenities: ["spa", "michelin-star dining", "two pools", "fitness center", "tennis"],
  },
  {
    id: "marrakech-royal-mansour",
    name: "Royal Mansour",
    neighborhood: "Medina",
    style: "riad",
    starsApprox: 5,
    pricePerNightUsd: 2400,
    vibe: "Private riads (no rooms) with rooftop plunge pools and butler.",
    flags: {
      gym: true,
      pool: true,
      spa: true,
      restaurantOnsite: true,
      breakfastIncluded: true,
      airportTransfer: true,
      petFriendly: false,
    },
    amenities: ["private riad", "underground tunnel network", "spa", "fitness center"],
  },
  {
    id: "marrakech-riad-yasmine",
    name: "Riad Yasmine",
    neighborhood: "Medina",
    style: "riad",
    starsApprox: 4,
    pricePerNightUsd: 240,
    vibe: "8-room riad with the most photographed pool in the medina.",
    flags: {
      gym: false,
      pool: true,
      spa: false,
      restaurantOnsite: true,
      breakfastIncluded: true,
      airportTransfer: false,
      petFriendly: false,
    },
    amenities: ["plunge pool", "rooftop dining", "intimate riad"],
  },
];

const NYC: HotelOption[] = [
  {
    id: "nyc-the-mark",
    name: "The Mark",
    neighborhood: "Upper East Side",
    style: "design",
    starsApprox: 5,
    pricePerNightUsd: 950,
    vibe: "Jacques Grange interiors; Jean-Georges Vongerichten dining.",
    flags: {
      gym: true,
      pool: false,
      spa: true,
      restaurantOnsite: true,
      breakfastIncluded: false,
      airportTransfer: true,
      petFriendly: true,
    },
    amenities: ["spa", "private boat", "concierge", "fitness center"],
  },
  {
    id: "nyc-crosby-street",
    name: "Crosby Street Hotel",
    neighborhood: "SoHo",
    style: "boutique",
    starsApprox: 5,
    pricePerNightUsd: 1050,
    vibe: "Kit Kemp design, sculpture garden, art-forward rooms.",
    flags: {
      gym: true,
      pool: false,
      spa: false,
      restaurantOnsite: true,
      breakfastIncluded: false,
      airportTransfer: false,
      petFriendly: true,
    },
    amenities: ["screening room", "rooftop garden", "afternoon tea", "fitness center"],
  },
  {
    id: "nyc-bowery",
    name: "The Bowery Hotel",
    neighborhood: "East Village",
    style: "boutique",
    starsApprox: 4,
    pricePerNightUsd: 720,
    vibe: "Vintage NYC ambiance, fireplaces in lobby, Italian restaurant on site.",
    flags: {
      gym: true,
      pool: false,
      spa: false,
      restaurantOnsite: true,
      breakfastIncluded: false,
      airportTransfer: false,
      petFriendly: true,
    },
    amenities: ["wood-burning fireplace lobby", "private terraces", "dining", "fitness room"],
  },
];

const PATAGONIA: HotelOption[] = [
  {
    id: "patagonia-tierra",
    name: "Tierra Patagonia",
    neighborhood: "Torres del Paine (lakeside)",
    style: "lodge",
    starsApprox: 5,
    pricePerNightUsd: 1400,
    vibe: "All-inclusive lodge with daily guided excursions in the park.",
    flags: {
      gym: true,
      pool: true,
      spa: true,
      restaurantOnsite: true,
      breakfastIncluded: true,
      airportTransfer: true,
      petFriendly: false,
    },
    amenities: ["all-inclusive", "guided treks", "spa", "indoor pool"],
  },
  {
    id: "patagonia-explora",
    name: "Explora Patagonia",
    neighborhood: "Torres del Paine (Salto Chico)",
    style: "lodge",
    starsApprox: 5,
    pricePerNightUsd: 1700,
    vibe: "Inside the park, 50+ guided exploration options.",
    flags: {
      gym: true,
      pool: true,
      spa: true,
      restaurantOnsite: true,
      breakfastIncluded: true,
      airportTransfer: true,
      petFriendly: false,
    },
    amenities: ["all-inclusive", "horseback excursions", "indoor pool", "spa"],
  },
  {
    id: "patagonia-awasi",
    name: "Awasi Patagonia",
    neighborhood: "Torres del Paine (private estate)",
    style: "lodge",
    starsApprox: 5,
    pricePerNightUsd: 2100,
    vibe: "14 villas, private guide and 4×4 per villa, tailored excursions.",
    flags: {
      gym: false,
      pool: false,
      spa: true,
      restaurantOnsite: true,
      breakfastIncluded: true,
      airportTransfer: true,
      petFriendly: false,
    },
    amenities: ["private guide", "private 4x4", "wood-fired hot tub", "spa"],
  },
];

const CATALOG: Record<string, HotelOption[]> = {
  tokyo: TOKYO,
  kyoto: KYOTO,
  lisbon: LISBON,
  alentejo: LISBON,
  marrakech: MARRAKECH,
  "new york": NYC,
  nyc: NYC,
  patagonia: PATAGONIA,
};

function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

export function findHotelsForCity(query: string): HotelOption[] {
  const n = normalize(query);
  if (CATALOG[n]) return CATALOG[n];
  for (const [key, hotels] of Object.entries(CATALOG)) {
    if (n.includes(key)) return hotels;
  }
  return [];
}
