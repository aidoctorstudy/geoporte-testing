"use client";

// 📖 Docs: obsidian/architecture/tech-stack.md → "3D — Negentropy particle field"

import { usePathname } from "next/navigation";
import { HeroScene } from "./HeroScene";
import { SceneFallbackGradient } from "./SceneFallbackGradient";
import { createNegentropyHeroScene } from "./build-negentropy-scene";

// The Stormwater & Flood Modelling service page's own fixed full-page
// background — same shape as `SolarisBackground.tsx`/`AetherFluxBackground.tsx`/
// `EinsteinRosenLatticeBackground.tsx`/`GoldenParthenonBackground.tsx`. Two
// heavy fixed WebGL backgrounds on one page reads as a mistake, not a
// choice, so Negentropy takes the globe's (and the other four scenes')
// place here rather than joining them — see `glass-background-routes.ts`,
// which every other exclusive component on this route reads from.
const NEGENTROPY_BACKGROUND_ROUTE = "/services/stormwater-and-flood-modelling";

/**
 * Mounted once at the app root, alongside `PlanetBackground`/
 * `AmbientBackground`/`SolarisBackground`/`AetherFluxBackground`/
 * `EinsteinRosenLatticeBackground`/`GoldenParthenonBackground` — but only
 * actually renders on the Stormwater & Flood Modelling service page. Reuses
 * `HeroScene`/`createNegentropyHeroScene` completely unchanged; `fixed
 * inset-0` so the particle field persists behind the whole page as you
 * scroll (the field's own camera flight and per-field opacity are driven by
 * that same page scroll). See ADR-0039/ADR-0042/ADR-0044/ADR-0045/ADR-0048.
 */
export const NegentropyBackground = () => {
  const pathname = usePathname();
  if (pathname !== NEGENTROPY_BACKGROUND_ROUTE) return null;

  return (
    <HeroScene
      createScene={createNegentropyHeroScene}
      className="pointer-events-none fixed inset-0 z-0"
      fallback={
        <SceneFallbackGradient
          gradient="var(--raw-gradient-fallback-negentropy)"
          className="h-full w-full"
        />
      }
    />
  );
};
