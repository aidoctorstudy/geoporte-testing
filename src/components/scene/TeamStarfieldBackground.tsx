"use client";

// 📖 Docs: obsidian/frontend/components/about-team.md

import { usePathname } from "next/navigation";
import { HeroScene } from "./HeroScene";
import { SceneFallbackGradient } from "./SceneFallbackGradient";
import { createTeamStarfieldScene } from "./build-team-starfield-scene";

/** Retired as of ADR-0074, still retired under ADR-0076: `/about/team` is
 * now `TeamCascade` (`about-team/TeamCascade.tsx`, a CSS-3D Cards Cascade,
 * superseding ADR-0074's WebGL "Mirror Hall"), which owns its own full
 * dark-navy stage directly in its own markup (`bg-background` on its
 * pseudo-sticky stage) — a separate fixed background behind it would never
 * be visible (fully covered by that opaque stage) and would cost a second,
 * wasted render loop. Left as an empty route set rather than deleting the
 * component/mount in `layout.tsx` outright — this file's only job was this
 * one page, so it's harmless dead weight now, not a live bug, and neither
 * Mirror Hall's nor the Cascade's own task was scoped to touch the root
 * layout wherever avoidable. `/about` itself still uses the unrelated
 * Pinwheel Galaxy, unaffected either way. See ADR-0072 (original) /
 * ADR-0074 (Mirror Hall retirement) / ADR-0076 (Cascade replacement). */
const TEAM_STARFIELD_ROUTES: ReadonlySet<string> = new Set<string>([]);

/**
 * Mounted once at the app root, alongside every other route-scoped fixed
 * background — renders only on `/about/team`. Same shape as
 * `PinwheelGalaxyBackground.tsx`/`PurplePlanetBackground.tsx`/etc.
 */
export const TeamStarfieldBackground = () => {
  const pathname = usePathname();
  if (pathname === null || !TEAM_STARFIELD_ROUTES.has(pathname)) return null;

  return (
    <HeroScene
      createScene={createTeamStarfieldScene}
      className="pointer-events-none fixed inset-0 z-0"
      fallback={
        <SceneFallbackGradient
          gradient="var(--raw-gradient-fallback-team-starfield)"
          className="h-full w-full"
        />
      }
    />
  );
};
