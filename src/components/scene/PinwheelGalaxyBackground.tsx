"use client";

// 📖 Docs: obsidian/architecture/tech-stack.md → "3D — Pinwheel Galaxy"

import { usePathname } from "next/navigation";
import { HeroScene } from "./HeroScene";
import { SceneFallbackGradient } from "./SceneFallbackGradient";
import { createPinwheelGalaxyHeroScene } from "./build-pinwheel-galaxy-scene";

// The About page's own fixed full-page background — same shape as
// `AurumPeakBackground.tsx`/`PurplePlanetBackground.tsx`/etc. `/about/team`
// used to reuse this unchanged; as of ADR-0072 it has its own, much calmer
// `TeamStarfieldBackground` instead — a spinning galaxy (differential
// rotation, a pulsing bulge, rising sparks) read as busy/explosive
// regardless of palette, which that page needed to stop doing.
const PINWHEEL_GALAXY_BACKGROUND_ROUTES: ReadonlySet<string> = new Set(["/about"]);

/**
 * Mounted once at the app root, alongside every other route-scoped fixed
 * background — but only actually renders on the About page. Reuses
 * `HeroScene`/`createPinwheelGalaxyHeroScene` completely unchanged; `fixed
 * inset-0` so the galaxy persists behind the whole page as you scroll (the
 * scroll-driven camera dive reads the shared
 * `getScrollSignalSnapshot().progress` instead of a raw listener — see the
 * scene builder's own header). See ADR-0039/0042/0044/0045/0047/0048/0050/
 * 0051/0052/0053/0054 (the prior routes' equivalents) and the ADR for this
 * scene in decisions-log.md.
 */
export const PinwheelGalaxyBackground = () => {
  const pathname = usePathname();
  if (pathname === null || !PINWHEEL_GALAXY_BACKGROUND_ROUTES.has(pathname)) return null;

  return (
    <HeroScene
      createScene={createPinwheelGalaxyHeroScene}
      className="pointer-events-none fixed inset-0 z-0"
      fallback={
        <SceneFallbackGradient
          gradient="var(--raw-gradient-fallback-pinwheel-galaxy)"
          className="h-full w-full"
        />
      }
    />
  );
};
