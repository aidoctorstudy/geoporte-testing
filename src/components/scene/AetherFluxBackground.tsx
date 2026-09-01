"use client";

// 📖 Docs: obsidian/architecture/tech-stack.md → "3D — Aether Flux rod field"

import { usePathname } from "next/navigation";
import { HeroScene } from "./HeroScene";
import { SceneFallbackGradient } from "./SceneFallbackGradient";
import { createAetherFluxHeroScene } from "./build-aether-flux-scene";

// The Design & Drafting service page's own fixed full-page background —
// same shape as `SolarisBackground.tsx` for Geotechnical. Two heavy fixed
// WebGL backgrounds on one page reads as a mistake, not a choice, so Aether
// Flux takes the globe's (and Solaris's) place here rather than joining them
// — see `glass-background-routes.ts`, which every other exclusive component
// on this route reads from.
const AETHER_FLUX_BACKGROUND_ROUTE = "/services/design-and-drafting";

/**
 * Mounted once at the app root, alongside `PlanetBackground`/
 * `AmbientBackground`/`SolarisBackground` — but only actually renders on
 * the Design & Drafting service page. Reuses `HeroScene`/
 * `createAetherFluxHeroScene` completely unchanged; `fixed inset-0` so the
 * rod field persists behind the whole page as you scroll. See ADR-0039
 * (the Solaris equivalent) and the ADR for this scene in decisions-log.md.
 */
export const AetherFluxBackground = () => {
  const pathname = usePathname();
  if (pathname !== AETHER_FLUX_BACKGROUND_ROUTE) return null;

  return (
    <HeroScene
      createScene={createAetherFluxHeroScene}
      className="pointer-events-none fixed inset-0 z-0"
      fallback={
        <SceneFallbackGradient
          gradient="var(--raw-gradient-fallback-aether-flux)"
          className="h-full w-full"
        />
      }
    />
  );
};
