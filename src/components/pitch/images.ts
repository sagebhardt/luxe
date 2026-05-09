/**
 * Curated Unsplash photo IDs for the Odylic pitch. Each is verified to
 * return 200 from images.unsplash.com. We hotlink (no rehosting) per
 * Unsplash's TOS for editorial use.
 */

export const PITCH_IMAGES = {
  hero1: "1492571350019-22de08371fd3", // urban / Tokyo
  hero2: "1469854523086-cc02fe5d8800", // safari / desert
  hero3: "1503917988258-f87a78e3c995", // alpine
  desert: "1473496169904-658ba7c44d8a", // Sahara dunes
  tropical: "1493780474015-ba834fd0ce2f", // tropical
  mountains: "1528127269322-539801943592", // mountains
  blossoms: "1522383225653-ed111181a951", // cherry blossoms
  ocean: "1538485399081-7191377e8241", // ocean
  marrakech: "1531168556467-80aace0d0144", // marrakech / morocco
  hotel: "1539020140153-e479b8c22e70", // luxury hotel
  safari: "1512100356356-de1b84283e18", // safari sunset
  nature: "1559827260-dc66d52bef19", // nature
} as const;

export function unsplashUrl(
  id: string,
  opts: { w?: number; h?: number; fit?: "crop" | "max" } = {},
) {
  const w = opts.w ?? 1400;
  const fit = opts.fit ?? "crop";
  const h = opts.h ? `&h=${opts.h}` : "";
  return `https://images.unsplash.com/photo-${id}?w=${w}${h}&q=80&auto=format&fit=${fit}`;
}
