/**
 * Turns a stored image reference into something an <img> can load.
 * Uploaded files are stored as "/uploads/..." relative to the API: when the
 * panel talks to the API through the same-origin proxy (the default) that
 * path works as is; with NEXT_PUBLIC_API_URL set it is resolved against that
 * API's origin.
 */
export function imageSrc(url: string | null | undefined): string | null {
  if (!url) return null;
  if (!url.startsWith("/")) return url;
  const api = process.env.NEXT_PUBLIC_API_URL;
  if (!api) return url;
  try {
    return new URL(url, api).toString();
  } catch {
    return url;
  }
}
