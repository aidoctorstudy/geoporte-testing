/**
 * Lightweight content-override layer backing `/admin`'s simple content
 * editor. `src/data/content.json` holds the client-editable text fields —
 * hero heading, service descriptions, project titles/descriptions, team
 * names/bios — keyed by a stable id derived from each item's *original*
 * title/name, so renaming something through `/admin` can never orphan its
 * own override (see `slugify` below).
 *
 * Imported as a plain JSON module (not read via `fs`) so it is safe to
 * bundle into both server and client code — every mock-data file that
 * exports its array keeps doing so unconditionally, just merged with these
 * overrides first. No existing consumer of `services`/`projects`/
 * `teamMembers` needs to change.
 *
 * Production note: a static JSON import is baked in at build time. While
 * `next dev` is running, editing `content.json` on disk (including via
 * `/admin`'s save route) triggers Fast Refresh — the dev server watches
 * every file in the module graph, JSON included — so edits appear without a
 * restart. Once deployed, Vercel's filesystem is read-only at runtime and
 * nothing re-reads this file there, so `/admin` needs a rebuild+redeploy to
 * take effect in production. Flagged, not solved here — "no database" was
 * explicit in the brief that added this; swap for a real backing store
 * (Payload/Supabase) when the client needs to edit content live in prod.
 */
import rawContent from "@/data/content.json";

export interface ServiceContentOverride {
  shortDescription?: string;
  overview?: string;
}

export interface ProjectContentOverride {
  title?: string;
  description?: string;
}

export interface TeamContentOverride {
  name?: string;
  bio?: string;
}

export interface SiteContent {
  hero?: { heading?: string };
  services?: Record<string, ServiceContentOverride>;
  projects?: Record<string, ProjectContentOverride>;
  team?: Record<string, TeamContentOverride>;
}

export const siteContent: SiteContent = rawContent as SiteContent;

/** Stable key for a project/team override — always computed from the
 * original hardcoded title/name (the caller passes the *base*, pre-override
 * value), never from an already-overridden one. */
export const slugify = (value: string): string =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/** The homepage hero's original copy — the single source of truth for both
 * `HeroSection.tsx`'s fallback and `/admin`'s pre-filled field, so the two
 * can never drift apart. */
export const DEFAULT_HERO_HEADING = "Design. Engineering. Advisory.";

export const getHeroHeading = (): string => siteContent.hero?.heading || DEFAULT_HERO_HEADING;
