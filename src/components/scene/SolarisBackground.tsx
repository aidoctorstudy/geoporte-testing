"use client";

// 📖 Docs: obsidian/architecture/tech-stack.md → "3D — Solaris particle sun"

import { usePathname } from "next/navigation";
import { HeroScene } from "./HeroScene";
import { SceneFallbackGradient } from "./SceneFallbackGradient";
import { createSolarisHeroScene } from "./build-solaris-scene";

// The Geotechnical service page's own fixed full-page background — the
// mirror image of `PlanetBackground.tsx`'s exclusion of this same route.
// Two heavy fixed WebGL backgrounds on one page reads as a mistake, not a
// choice, so Solaris takes the globe's place here rather than joining it.
//
// Re-instated by ADR-0061 after a brief retirement earlier in the same
// turn — the user explicitly wants Solaris kept as this page's full-page
// background, with the new bounded PLAXIS-inspired FEA scene
// (`GeotechnicalAnalysisHero.tsx`/`GeotechnicalFeaScene.tsx`) rendering on
// top of it inside the hero section only, not replacing it.
const SOLARIS_BACKGROUND_ROUTE = "/services/geotechnical-engineering";

/**
 * Mounted once at the app root, alongside `PlanetBackground`/
 * `AmbientBackground` — but only actually renders on the Geotechnical
 * service page. Reuses `HeroScene`/`createSolarisHeroScene` completely
 * unchanged; the only difference from the (removed) in-hero-section canvas
 * is the container being `fixed inset-0` instead of scoped to the ~70vh
 * hero `<section>`, so the sun persists behind the whole page as you
 * scroll instead of scrolling away with the hero. See ADR-0037.
 */
export const SolarisBackground = () => {
  const pathname = usePathname();
  if (pathname !== SOLARIS_BACKGROUND_ROUTE) return null;

  return (
    <HeroScene
      createScene={createSolarisHeroScene}
      className="pointer-events-none fixed inset-0 z-0"
      fallback={
        <SceneFallbackGradient
          gradient="var(--raw-gradient-fallback-solaris)"
          className="h-full w-full"
        />
      }
    />
  );
};
