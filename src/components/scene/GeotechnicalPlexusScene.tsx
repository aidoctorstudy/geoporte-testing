"use client";

// 📖 Docs: obsidian/architecture/tech-stack.md → "3D — Geoporte hero + service scenes"

import { HeroScene } from "./HeroScene";
import { createGeotechnicalPlexusScene } from "./build-geotechnical-plexus-scene";

export interface GeotechnicalPlexusSceneProps {
  className?: string;
}

/**
 * Thin client leaf wrapping `<HeroScene>` with the Plexus scene factory —
 * mirrors `ServiceHeroScene.tsx`'s own role. `build-geotechnical-plexus-scene.ts`
 * imports `three` at module scope with no "use client" of its own, so its
 * `createGeotechnicalPlexusScene` export must be referenced from inside a
 * client boundary, not passed as a prop from the Server Component section
 * that composes this — RSC can't serialize a plain function reference
 * across that boundary (build fails at "Collecting page data" otherwise).
 */
export const GeotechnicalPlexusScene = ({ className }: GeotechnicalPlexusSceneProps) => (
  <HeroScene className={className} createScene={createGeotechnicalPlexusScene} fallback={<PlexusFallback />} />
);

/** Static (no motion needed) light-themed substitute for the mobile/
 * reduced-motion tier — `HeroFallback` hardcodes the sitewide dark
 * `bg-background`, which would paint a dark box on this section's light
 * `--surface-engineering` background, so this scene gets its own. */
const PlexusFallback = () => (
  <div
    aria-hidden="true"
    className="bg-surface-engineering-alt relative h-full w-full"
    style={{
      backgroundImage:
        "radial-gradient(circle at 30% 35%, var(--glow-engineering) 0%, transparent 55%), radial-gradient(circle at 75% 70%, var(--accent-engineering) 0%, transparent 45%)",
      backgroundBlendMode: "multiply",
      opacity: 0.35,
    }}
  />
);
