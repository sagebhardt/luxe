import "server-only";

/**
 * Daily weather lookup. Hits Open-Meteo's free forecast API for dates
 * within the forecast window (~16 days out); falls back to a small
 * seasonal-climate lookup for further-future dates so editorial views
 * always have something to render.
 *
 * No API key required. https://open-meteo.com/
 */

export type DailyWeather = {
  date: string; // yyyy-mm-dd
  highC: number;
  lowC: number;
  weatherCode: number; // WMO code
  precipitationMm?: number;
  source: "forecast" | "climate";
};

export type WeatherChip = {
  date: string;
  highC: number;
  lowC: number;
  glyph: string;
  label: string;
  source: "forecast" | "climate";
};

const FORECAST_BASE = "https://api.open-meteo.com/v1/forecast";

export async function fetchDailyWeather(opts: {
  lat: number;
  lng: number;
  startDate: string;
  endDate: string;
}): Promise<DailyWeather[]> {
  const today = new Date();
  const target = new Date(opts.startDate);
  const daysOut = Math.round(
    (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );

  // Forecast covers ~16 days; if start is further than that, skip the call.
  if (daysOut > 14) {
    return [];
  }

  const params = new URLSearchParams({
    latitude: String(opts.lat),
    longitude: String(opts.lng),
    daily:
      "temperature_2m_max,temperature_2m_min,weather_code,precipitation_sum",
    timezone: "auto",
    start_date: opts.startDate,
    end_date: opts.endDate,
  });
  const res = await fetch(`${FORECAST_BASE}?${params}`, {
    next: { revalidate: 60 * 60 * 6 },
  });
  if (!res.ok) return [];
  const json = (await res.json()) as {
    daily?: {
      time: string[];
      temperature_2m_max: number[];
      temperature_2m_min: number[];
      weather_code: number[];
      precipitation_sum: number[];
    };
  };
  const d = json.daily;
  if (!d) return [];
  return d.time.map((iso, i) => ({
    date: iso,
    highC: d.temperature_2m_max[i],
    lowC: d.temperature_2m_min[i],
    weatherCode: d.weather_code[i],
    precipitationMm: d.precipitation_sum[i],
    source: "forecast",
  }));
}

/* WMO code → glyph + label
 * https://open-meteo.com/en/docs#api-documentation */
export function describeWeatherCode(code: number): { glyph: string; label: string } {
  if (code === 0) return { glyph: "☀️", label: "Clear" };
  if (code === 1) return { glyph: "🌤", label: "Mostly clear" };
  if (code === 2) return { glyph: "⛅", label: "Partly cloudy" };
  if (code === 3) return { glyph: "☁️", label: "Overcast" };
  if (code === 45 || code === 48) return { glyph: "🌫", label: "Fog" };
  if (code >= 51 && code <= 57) return { glyph: "🌦", label: "Drizzle" };
  if (code >= 61 && code <= 67) return { glyph: "🌧", label: "Rain" };
  if (code >= 71 && code <= 77) return { glyph: "❄️", label: "Snow" };
  if (code >= 80 && code <= 82) return { glyph: "🌧", label: "Rain showers" };
  if (code >= 85 && code <= 86) return { glyph: "🌨", label: "Snow showers" };
  if (code === 95) return { glyph: "⛈", label: "Thunder" };
  if (code === 96 || code === 99) return { glyph: "⛈", label: "Hail" };
  return { glyph: "•", label: "—" };
}

/* Static seasonal averages for when the trip is too far out for the
 * forecast API. Approximate, per destination, per month index (0-11). */
const SEASONAL: Record<string, { high: number; low: number; glyph: string; label: string }[]> = {
  tokyo: [
    { high: 9, low: 1, glyph: "❄️", label: "Crisp winter" },
    { high: 10, low: 2, glyph: "☀️", label: "Cool, dry" },
    { high: 14, low: 5, glyph: "🌸", label: "Sakura, mild" },
    { high: 19, low: 10, glyph: "🌸", label: "Bright spring" },
    { high: 23, low: 15, glyph: "🌤", label: "Warming" },
    { high: 26, low: 19, glyph: "🌧", label: "Tsuyu rains" },
    { high: 30, low: 23, glyph: "☀️", label: "Hot summer" },
    { high: 31, low: 25, glyph: "☀️", label: "Hot summer" },
    { high: 27, low: 21, glyph: "⛅", label: "Warm, typhoons" },
    { high: 22, low: 15, glyph: "🌤", label: "Crisp autumn" },
    { high: 17, low: 8, glyph: "🍁", label: "Foliage" },
    { high: 12, low: 3, glyph: "❄️", label: "Cold, dry" },
  ],
  kyoto: [
    { high: 8, low: 0, glyph: "❄️", label: "Cold" },
    { high: 9, low: 0, glyph: "☀️", label: "Cool, dry" },
    { high: 13, low: 3, glyph: "🌸", label: "Sakura" },
    { high: 19, low: 8, glyph: "🌸", label: "Bright spring" },
    { high: 24, low: 14, glyph: "🌤", label: "Warming" },
    { high: 27, low: 19, glyph: "🌧", label: "Tsuyu rains" },
    { high: 32, low: 23, glyph: "☀️", label: "Hot summer" },
    { high: 33, low: 24, glyph: "☀️", label: "Hot summer" },
    { high: 28, low: 20, glyph: "⛅", label: "Warm" },
    { high: 22, low: 13, glyph: "🍁", label: "Foliage" },
    { high: 16, low: 6, glyph: "🍁", label: "Late foliage" },
    { high: 10, low: 2, glyph: "❄️", label: "Cold, dry" },
  ],
  lisbon: [
    { high: 15, low: 8, glyph: "🌤", label: "Mild winter" },
    { high: 16, low: 9, glyph: "🌤", label: "Mild winter" },
    { high: 18, low: 10, glyph: "🌤", label: "Mild" },
    { high: 20, low: 12, glyph: "☀️", label: "Bright spring" },
    { high: 22, low: 13, glyph: "☀️", label: "Spring sun" },
    { high: 26, low: 16, glyph: "☀️", label: "Warming" },
    { high: 28, low: 18, glyph: "☀️", label: "Hot summer" },
    { high: 29, low: 18, glyph: "☀️", label: "Hot summer" },
    { high: 27, low: 17, glyph: "☀️", label: "Warm" },
    { high: 22, low: 14, glyph: "🌤", label: "Mild autumn" },
    { high: 17, low: 11, glyph: "🌧", label: "Wet autumn" },
    { high: 15, low: 9, glyph: "🌧", label: "Cool, wet" },
  ],
  marrakech: [
    { high: 19, low: 6, glyph: "☀️", label: "Mild winter" },
    { high: 20, low: 8, glyph: "☀️", label: "Mild winter" },
    { high: 24, low: 11, glyph: "☀️", label: "Spring" },
    { high: 27, low: 13, glyph: "☀️", label: "Warm spring" },
    { high: 30, low: 16, glyph: "☀️", label: "Hot" },
    { high: 35, low: 19, glyph: "☀️", label: "Hot" },
    { high: 38, low: 22, glyph: "☀️", label: "Very hot" },
    { high: 38, low: 22, glyph: "☀️", label: "Very hot" },
    { high: 33, low: 19, glyph: "☀️", label: "Hot" },
    { high: 29, low: 15, glyph: "☀️", label: "Warm autumn" },
    { high: 23, low: 10, glyph: "☀️", label: "Mild autumn" },
    { high: 19, low: 7, glyph: "☀️", label: "Mild winter" },
  ],
  patagonia: [
    { high: 19, low: 7, glyph: "🌤", label: "Austral summer" },
    { high: 19, low: 7, glyph: "🌤", label: "Late summer" },
    { high: 16, low: 5, glyph: "🌤", label: "Cool autumn" },
    { high: 11, low: 2, glyph: "🍁", label: "Autumn" },
    { high: 6, low: -1, glyph: "❄️", label: "Cold" },
    { high: 3, low: -3, glyph: "❄️", label: "Snowy" },
    { high: 3, low: -4, glyph: "❄️", label: "Winter" },
    { high: 5, low: -3, glyph: "❄️", label: "Late winter" },
    { high: 9, low: 0, glyph: "🌤", label: "Spring" },
    { high: 13, low: 3, glyph: "🌤", label: "Spring" },
    { high: 16, low: 5, glyph: "🌤", label: "Late spring" },
    { high: 18, low: 6, glyph: "🌤", label: "Early summer" },
  ],
  "new york": [
    { high: 4, low: -3, glyph: "❄️", label: "Cold" },
    { high: 6, low: -2, glyph: "❄️", label: "Cold" },
    { high: 11, low: 2, glyph: "🌤", label: "Cool spring" },
    { high: 17, low: 7, glyph: "🌤", label: "Spring" },
    { high: 22, low: 13, glyph: "☀️", label: "Warm spring" },
    { high: 27, low: 18, glyph: "☀️", label: "Warm" },
    { high: 30, low: 21, glyph: "☀️", label: "Hot summer" },
    { high: 29, low: 21, glyph: "☀️", label: "Hot summer" },
    { high: 25, low: 17, glyph: "🌤", label: "Mild autumn" },
    { high: 19, low: 11, glyph: "🍁", label: "Foliage" },
    { high: 12, low: 5, glyph: "🌤", label: "Late autumn" },
    { high: 6, low: -1, glyph: "❄️", label: "Cold" },
  ],
};

function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

export function seasonalForDate(
  destination: string,
  iso: string,
): WeatherChip | null {
  const n = normalize(destination);
  let key: string | null = null;
  if (SEASONAL[n]) key = n;
  else {
    for (const k of Object.keys(SEASONAL)) {
      if (n.includes(k)) {
        key = k;
        break;
      }
    }
  }
  if (!key) return null;
  const month = new Date(iso + "T00:00:00").getMonth();
  const m = SEASONAL[key][month];
  return {
    date: iso,
    highC: m.high,
    lowC: m.low,
    glyph: m.glyph,
    label: m.label,
    source: "climate",
  };
}

export function toChip(d: DailyWeather): WeatherChip {
  const { glyph, label } = describeWeatherCode(d.weatherCode);
  return {
    date: d.date,
    highC: d.highC,
    lowC: d.lowC,
    glyph,
    label,
    source: d.source,
  };
}
