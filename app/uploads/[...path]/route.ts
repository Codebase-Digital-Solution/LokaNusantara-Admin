// Serves uploaded images (location photos) from the API so the admin panel
// can show them same-origin. Goes through the server to add the header that
// skips ngrok's browser warning page, which a plain rewrite cannot add.

const API_UPSTREAM = process.env.API_UPSTREAM_URL ?? "https://composed-light-crayfish.ngrok-free.app";

export async function GET(_req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  if (path.some((p) => p === ".." || p.includes("/"))) {
    return new Response("Not found", { status: 404 });
  }
  const upstream = await fetch(`${API_UPSTREAM}/uploads/${path.map(encodeURIComponent).join("/")}`, {
    headers: { "ngrok-skip-browser-warning": "true" },
    cache: "no-store",
  });
  if (!upstream.ok || !upstream.body) {
    return new Response("Not found", { status: upstream.status === 404 ? 404 : 502 });
  }
  return new Response(upstream.body, {
    headers: {
      "Content-Type": upstream.headers.get("Content-Type") ?? "application/octet-stream",
      // File names are random and never reused, so they can be cached long.
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
