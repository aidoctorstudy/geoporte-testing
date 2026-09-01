"use client";

// 📖 Docs: obsidian/architecture/tech-stack.md → "3D — Spiral Galaxy"

import { usePathname } from "next/navigation";
import { HeroScene } from "./HeroScene";
import { SceneFallbackGradient } from "./SceneFallbackGradient";
import { createSpiralGalaxyHeroScene } from "./build-spiral-galaxy-scene";

// The Telecom Services service page's own fixed full-page background —
// same shape as `AureoleBackground.tsx`/`GoldenParthenonBackground.tsx`/etc.
const SPIRAL_GALAXY_BACKGROUND_ROUTE = "/services/telecom-services";

/**
 * Mounted once at the app root, alongside every other route-scoped fixed
 * background — but only actually renders on the Telecom Services service
 * page. Reuses `HeroScene`/`createSpiralGalaxyHeroScene` completely
 * unchanged; `fixed inset-0` so the galaxy persists behind the whole page
 * as you scroll (the scroll-driven dive/tilt reads the shared
 * `getScrollSignalSnapshot().progress` instead of a raw listener — see the
 * scene builder's own header). See ADR-0039/0042/0044/0045/0047/0048/0050/
 * 0051/0052/0053 (the prior routes' equivalents) and the ADR for this scene
 * in decisions-log.md.
 */
export const SpiralGalaxyBackground = () => {
  const pathname = usePathname();
  if (pathname !== SPIRAL_GALAXY_BACKGROUND_ROUTE) return null;

  return (
    <HeroScene
      createScene={createSpiralGalaxyHeroScene}
      className="pointer-events-none fixed inset-0 z-0"
      fallback={
        <SceneFallbackGradient
          gradient="var(--raw-gradient-fallback-spiral-galaxy)"
          className="h-full w-full"
        />
      }
    />
  );
};
