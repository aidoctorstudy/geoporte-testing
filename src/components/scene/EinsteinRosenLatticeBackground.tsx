"use client";

// 📖 Docs: obsidian/architecture/tech-stack.md → "3D — Einstein–Rosen Lattice wormhole"

import { usePathname } from "next/navigation";
import { HeroScene } from "./HeroScene";
import { SceneFallbackGradient } from "./SceneFallbackGradient";
import { createEinsteinRosenLatticeHeroScene } from "./build-einstein-rosen-lattice-scene";

// The Structural Engineering service page's own fixed full-page background —
// same shape as `SolarisBackground.tsx`/`AetherFluxBackground.tsx`. Two
// heavy fixed WebGL backgrounds on one page reads as a mistake, not a
// choice, so the wormhole takes the globe's (and Solaris's/Aether Flux's)
// place here rather than joining them — see `glass-background-routes.ts`,
// which every other exclusive component on this route reads from.
const EINSTEIN_ROSEN_LATTICE_BACKGROUND_ROUTE = "/services/structural-engineering";

/**
 * Mounted once at the app root, alongside `PlanetBackground`/
 * `AmbientBackground`/`SolarisBackground`/`AetherFluxBackground` — but only
 * actually renders on the Structural Engineering service page. Reuses
 * `HeroScene`/`createEinsteinRosenLatticeHeroScene` completely unchanged;
 * `fixed inset-0` so the wormhole persists behind the whole page as you
 * scroll. See ADR-0039/ADR-0042 (the Solaris/Aether Flux equivalents) and
 * the ADR for this scene in decisions-log.md.
 */
export const EinsteinRosenLatticeBackground = () => {
  const pathname = usePathname();
  if (pathname !== EINSTEIN_ROSEN_LATTICE_BACKGROUND_ROUTE) return null;

  return (
    <HeroScene
      createScene={createEinsteinRosenLatticeHeroScene}
      className="pointer-events-none fixed inset-0 z-0"
      fallback={
        <SceneFallbackGradient
          gradient="var(--raw-gradient-fallback-wormhole)"
          className="h-full w-full"
        />
      }
    />
  );
};
