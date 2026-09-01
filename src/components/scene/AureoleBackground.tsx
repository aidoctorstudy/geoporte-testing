"use client";

// 📖 Docs: obsidian/architecture/tech-stack.md → "3D — Aureole golden corona"

import { usePathname } from "next/navigation";
import { HeroScene } from "./HeroScene";
import { SceneFallbackGradient } from "./SceneFallbackGradient";
import { createAureoleHeroScene } from "./build-aureole-scene";

// The Advisory Services service page's own fixed full-page background —
// same shape as `SolarisBackground.tsx`/`AetherFluxBackground.tsx`/etc.
// Two heavy fixed full-page backgrounds on one page reads as a mistake,
// not a choice, so this takes the globe's (and the other scenes') place
// here rather than joining them — see `glass-background-routes.ts`, which
// every other exclusive component on this route reads from.
const AUREOLE_BACKGROUND_ROUTE = "/services/advisory-services";

/**
 * Mounted once at the app root, alongside every other route-scoped fixed
 * background — but only actually renders on the Advisory Services service
 * page. Reuses `HeroScene`/`createAureoleHeroScene` completely unchanged;
 * `fixed inset-0` so the corona persists behind the whole page as you
 * scroll. See ADR-0039/ADR-0042/ADR-0044/ADR-0045/ADR-0047/ADR-0048/
 * ADR-0050 (the prior six routes' equivalents) and the ADR for this scene
 * in decisions-log.md.
 */
export const AureoleBackground = () => {
  const pathname = usePathname();
  if (pathname !== AUREOLE_BACKGROUND_ROUTE) return null;

  return (
    <HeroScene
      createScene={createAureoleHeroScene}
      className="pointer-events-none fixed inset-0 z-0"
      fallback={
        <SceneFallbackGradient
          gradient="var(--raw-gradient-fallback-aureole)"
          className="h-full w-full"
        />
      }
    />
  );
};
