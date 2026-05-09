import "server-only";

/**
 * Lightweight Unsplash fetch — just enough to grab a hero image for a
 * destination. Requires UNSPLASH_ACCESS_KEY in env. If the key is
 * absent, returns null and the share page renders a fallback layout.
 *
 * Honors Unsplash's API guidelines:
 *  - We hotlink images.unsplash.com URLs directly (no rehosting).
 *  - When a photo is "selected for use" (i.e. we pick it and persist
 *    it to a trip narrative), we trigger the download_location endpoint
 *    so the photographer gets credit in Unsplash's analytics.
 *  - The share page attributes the photographer with a link.
 */

export type UnsplashHero = {
  id: string;
  imageUrl: string;
  thumbUrl: string;
  authorName: string;
  authorUrl: string;
  /** URL we hit to register the photo as "used"; required by the TOS. */
  downloadLocation: string;
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
        id: string;
        urls: { regular: string; thumb: string };
        links: { download_location: string };
        user: { name: string; links: { html: string } };
      }>;
    };
    const pick = json.results?.[0];
    if (!pick) return null;
    /* Required by Unsplash TOS: ping the download endpoint when the
     * photo is "used". We do this once on selection (narrative
     * generation), not per page render. Fire-and-forget; failures
     * shouldn't break narrative generation. */
    void triggerDownload(pick.links.download_location, key);
    return {
      id: pick.id,
      imageUrl: pick.urls.regular,
      thumbUrl: pick.urls.thumb,
      authorName: pick.user.name,
      authorUrl: pick.user.links.html,
      downloadLocation: pick.links.download_location,
    };
  } catch {
    return null;
  }
}

async function triggerDownload(downloadLocation: string, key: string) {
  try {
    await fetch(downloadLocation, {
      headers: { Authorization: `Client-ID ${key}` },
    });
  } catch {
    /* Silent — analytics ping, not load-bearing. */
  }
}
