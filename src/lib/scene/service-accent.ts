/**
 * Per-service accent tint — maps a service `slug` to an inline-style object
 * overriding the Tier-2 `--accent`/`--glow` custom properties (not new Tier-2
 * role names; not a Tier-3 `@theme` binding). `service-detail.tsx` spreads
 * this onto a wrapper element around the whole page, so every existing
 * component that already resolves colour through `bg-accent`, `text-glow`,
 * etc. picks up the per-service tint automatically, with zero component
 * changes — the same mechanism `prefers-color-scheme` theming would use if
 * this project had a light mode (see design-system.md token rule 3: "Tier 2
 * is the themeable layer"). Falls back to the site-wide default azure/glow
 * (i.e. no override) for an unrecognised slug.
 *
 * The raw hex pairs live in globals.css as Tier-1 `--raw-color-service-*`
 * primitives; this module only knows the mapping from slug to those
 * variable names, never a literal colour itself.
 */
import type { CSSProperties } from "react";

const KNOWN_SLUGS = [
  "civil-engineering",
  "design-and-drafting",
  "geotechnical-engineering",
  "structural-engineering",
  "stormwater-and-flood-modelling",
  "project-control-services",
  "advisory-services",
  "telecom-services",
] as const;

export const getServiceAccentStyle = (slug: string): CSSProperties => {
  if (!(KNOWN_SLUGS as readonly string[]).includes(slug)) return {};

  return {
    "--accent": `var(--raw-color-service-${slug}-accent)`,
    "--glow": `var(--raw-color-service-${slug}-glow)`,
  } as CSSProperties;
};
