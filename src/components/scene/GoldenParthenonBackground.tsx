"use client";

// 📖 Docs: obsidian/architecture/tech-stack.md → "3D — Golden Parthenon sunset temple"

import { usePathname } from "next/navigation";
import { HeroScene } from "./HeroScene";
import { SceneFallbackGradient } from "./SceneFallbackGradient";
import { createGoldenParthenonHeroScene } from "./build-golden-parthenon-scene";

// The Civil Engineering service page's own fixed full-page background —
// same shape as `SolarisBackground.tsx`/`AetherFluxBackground.tsx`/
// `EinsteinRosenLatticeBackground.tsx`. Replaces `HalcyonNightBackground`
// (retired — see ADR-0047) on this exact route; every other exclusive
// component on this route still reads from `glass-background-routes.ts`.
const GOLDEN_PARTHENON_BACKGROUND_ROUTE = "/services/civil-engineering";

/**
 * Mounted once at the app root, alongside `PlanetBackground`/
 * `AmbientBackground`/`SolarisBackground`/`AetherFluxBackground`/
 * `EinsteinRosenLatticeBackground` — but only actually renders on the
 * Civil Engineering service page. Reuses `HeroScene`/
 * `createGoldenParthenonHeroScene` completely unchanged; `fixed inset-0`
 * so the temple persists behind the whole page as you scroll. See
 * ADR-0039/ADR-0042/ADR-0044/ADR-0047.
 */
export const GoldenParthenonBackground = () => {
  const pathname = usePathname();
  if (pathname !== GOLDEN_PARTHENON_BACKGROUND_ROUTE) return null;

  return (
    <HeroScene
      createScene={createGoldenParthenonHeroScene}
      className="pointer-events-none fixed inset-0 z-0"
      fallback={
        <SceneFallbackGradient
          gradient="var(--raw-gradient-fallback-golden-parthenon)"
          className="h-full w-full"
        />
      }
    />
  );
};
