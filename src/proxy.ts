import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Site-wide maintenance mode: redirects every request to `/maintenance`
 * except the maintenance page itself and the paths a working page — and
 * search engines/crawlers hitting `robots.txt`/`sitemap.xml` — still need
 * to load while the rest of the site is down. See ADR-0109.
 *
 * Lives at `src/proxy.ts`, not the repo root — `app/` lives under `src/`,
 * and Next.js requires `proxy.ts` at the same level as `app/`/`pages/`.
 * Also named `proxy.ts`, not `middleware.ts`: that file convention was
 * renamed in Next.js 16 (same export shape, new name) — see AGENTS.md.
 */
const EXEMPT_PREFIXES = ["/maintenance", "/_next/", "/api/", "/assets/"];

// The rest of `public/`'s root-level meta/PWA/SEO assets (favicon set,
// manifest, OG image, robots/sitemap) — not covered by the prefixes above,
// but still needed by the browser tab, crawlers, and social scrapers even
// while the rest of the site redirects. Missing any of these here would
// just reproduce the app/favicon.ico shadow-file bug (ADR-0108) one level
// up: a broken icon/meta file on the one page visitors can still reach.
const EXEMPT_PATHS = new Set([
  "/favicon.ico",
  "/favicon.png",
  "/favicon-16x16.png",
  "/favicon-32x32.png",
  "/apple-icon-180x180.png",
  "/android-icon-36x36.png",
  "/android-icon-48x48.png",
  "/android-icon-72x72.png",
  "/android-icon-96x96.png",
  "/android-icon-144x144.png",
  "/android-icon-192x192.png",
  "/manifest.json",
  "/browserconfig.xml",
  "/open-graph.png",
  "/robots.txt",
  "/sitemap.xml",
]);

const isExempt = (pathname: string): boolean =>
  EXEMPT_PATHS.has(pathname) ||
  EXEMPT_PREFIXES.some((prefix) => pathname.startsWith(prefix));

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (isExempt(pathname)) return NextResponse.next();

  return NextResponse.redirect(new URL("/maintenance", request.url));
}

// Excludes _next/static and _next/image at the matcher level (the
// documented/recommended way to keep Proxy off those — see the Next.js
// proxy.js file-convention reference) — `isExempt` above still re-checks
// `_next/` as a belt-and-suspenders in case this matcher pattern is ever
// loosened.
export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
