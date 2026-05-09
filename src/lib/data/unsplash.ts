import "server-only";

/**
 * Lightweight Unsplash fetch — just enough to grab a hero image for a
 * destination. Requires UNSPLASH_ACCESS_KEY in env. If the key is
 * absent, returns null and the share page renders an SVG ornament
 * instead. Editorial-grade fallback either way.
 *
 * Sign up free at https://unsplash.com/developers
 */

export type UnsplashHero = {
  imageUrl: string;
  thumbUrl: string;
  authorName: string;
  authorUrl: string;
};

const SEARCH_URL = "https://api.unsplash.com/search/photos";

export async function findDestinationHero(
  destination: string,
): Promise<UnsplashHero | null> {
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key) return null;
  const params = new URLSearchParams({
    query: destination,
    orientation: "landscape",
    content_filter: "high",
    per_page: "5",
  });
  try {
    const res = await fetch(`${SEARCH_URL}?${params}`, {
      headers: { Authorization: `Client-ID ${key}` },
      next: { revalidate: 60 * 60 * 24 },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      results: Array<{
        urls: { regular: string; thumb: string };
        blur_hash?: string;
        user: { name: string; links: { html: string } };
      }>;
    };
    const pick = json.results?.[0];
    if (!pick) return null;
    return {
      imageUrl: pick.urls.regular,
      thumbUrl: pick.urls.thumb,
      authorName: pick.user.name,
      authorUrl: pick.user.links.html,
    };
  } catch {
    return null;
  }
}
