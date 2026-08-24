/**
 * Site-wide configuration — the single source of truth for SEO.
 *
 * Consumed by the metadata generator, `robots.ts`, `sitemap.ts`, and the
 * JSON-LD structured-data helper. Update the placeholder values per project.
 */
import { publicEnv } from "@/env";

export const siteConfig = {
  name: "Geoporte",
  description:
    "Design Engineering Advisory — risk-based design and management of complex engineering projects across geotechnical, civil, structural and infrastructure disciplines.",
  /**
   * Public origin, no trailing slash. Drives canonical URLs, OG tags, the
   * sitemap, and JSON-LD. Set `NEXT_PUBLIC_SITE_URL` in production.
   */
  url: publicEnv.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  /** Default Open Graph / Twitter share image (path under `public/`). */
  ogImage: "/open-graph.png",
  twitterHandle: "@geoporte",
  author: "Geoporte",
  /** Browser theme-color (address bar / PWA) — matches the committed Style's gl-bg. */
  themeColor: "#01040e",
} as const;
