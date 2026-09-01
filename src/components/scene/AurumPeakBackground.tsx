"use client";

// 📖 Docs: obsidian/architecture/tech-stack.md → "3D — Aurum Peak golden summit"

import { usePathname } from "next/navigation";
import { HeroScene } from "./HeroScene";
import { SceneFallbackGradient } from "./SceneFallbackGradient";
import { createAurumPeakHeroScene } from "./build-aurum-peak-scene";

// The Publications page's own fixed full-page background — same shape as
// `AureoleBackground.tsx`/`GoldenParthenonBackground.tsx`/etc.
const AURUM_PEAK_BACKGROUND_ROUTE = "/publications";

/**
 * Mounted once at the app root, alongside every other route-scoped fixed
 * background — but only actually renders on the Publications page. Reuses
 * `HeroScene`/`createAurumPeakHeroScene` completely unchanged; `fixed
 * inset-0` so the summit persists behind the whole page as you scroll.
 * See ADR-0039/0042/0044/0045/0047/0048/0050/0052 (the prior routes'
 * equivalents) and the ADR for this scene in decisions-log.md.
 */
export const AurumPeakBackground = () => {
  const pathname = usePathname();
  if (pathname !== AURUM_PEAK_BACKGROUND_ROUTE) return null;

  return (
    <HeroScene
      createScene={createAurumPeakHeroScene}
      className="pointer-events-none fixed inset-0 z-0"
      fallback={
        <SceneFallbackGradient
          gradient="var(--raw-gradient-fallback-aurum-peak)"
          className="h-full w-full"
        />
      }
    />
  );
};
