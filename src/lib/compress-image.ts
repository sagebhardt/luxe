/**
 * Client-side image compression. iPhone photos are ~3-5 MB each;
 * we resize to a max edge and re-encode JPEG at moderate quality so
 * the bytea row in Postgres stays small (~150-300 KB typical).
 *
 * Returns the original File when:
 *  - it isn't an image
 *  - it's already small (< 400 KB)
 *  - HEIC files (browsers can't decode HEIC into a canvas reliably)
 */
export async function compressIfImage(
  file: File,
  opts: { maxEdge?: number; quality?: number } = {},
): Promise<{ file: File; originalSize: number }> {
  const originalSize = file.size;
  if (!file.type.startsWith("image/")) return { file, originalSize };
  if (file.size < 400 * 1024) return { file, originalSize };
  /* Browsers can't decode HEIC into a canvas. Pass through and let
   * the server treat it as the original. The Vision extractor still
   * accepts the bytes via Gemini's image part. */
  if (
    file.type === "image/heic" ||
    file.type === "image/heif" ||
    /\.(heic|heif)$/i.test(file.name)
  ) {
    return { file, originalSize };
  }

  const maxEdge = opts.maxEdge ?? 1800;
  const quality = opts.quality ?? 0.82;

  const dataUrl = await readAsDataURL(file);
  const img = await loadImage(dataUrl);
  const ratio = Math.min(1, maxEdge / Math.max(img.width, img.height));
  const w = Math.round(img.width * ratio);
  const h = Math.round(img.height * ratio);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return { file, originalSize };
  ctx.drawImage(img, 0, 0, w, h);

  const blob: Blob | null = await new Promise((resolve) =>
    canvas.toBlob((b) => resolve(b), "image/jpeg", quality),
  );
  if (!blob || blob.size >= file.size) return { file, originalSize };

  const compressed = new File([blob], replaceExt(file.name, ".jpg"), {
    type: "image/jpeg",
    lastModified: file.lastModified,
  });
  return { file: compressed, originalSize };
}

function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("image load failed"));
    img.src = src;
  });
}

function replaceExt(name: string, ext: string): string {
  return name.replace(/\.[^/.]+$/, "") + ext;
}
