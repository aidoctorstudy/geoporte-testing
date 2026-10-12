"use client";

// 📖 Docs: obsidian/architecture/tech-stack.md → "3D — Geoporte hero + service scenes"

import { HeroScene } from "./HeroScene";
import { createGeotechnicalPlexusScene } from "./build-geotechnical-plexus-scene";
import { useDynamicInView } from "@/hooks/animation/use-dynamic-in-view";
import { getCardSceneRootMargin } from "@/lib/scene/device-tier";

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
 *
 * Unlike the other homepage mini-scenes (`GeologicalCrossSection`/
 * `ContactTerrain`/`StatsGlobe`, which share one lightweight GL context via
 * `shared-viewport-renderer.ts`) this is a *dedicated* `HeroScene` instance —
 * its own `WebGLRenderer`, same category as `ServiceCard.tsx`'s 7
 * `DEDICATED_CARD_SCENES`. Without the same near-viewport mount/unmount gate
 * those use, this scene's renderer/geometries/textures would stay allocated
 * for the rest of the session the instant a user scrolls past it — exactly
 * the gap ADR-0084/85/87 closed for the card scenes, just never applied here
 * since this is a single section, not a repeated card. Reuses the identical
 * `getCardSceneRootMargin()` hysteresis (800px desktop/Android, 400px iOS) so
 * ordinary scrolling never thrashes mount/unmount. The homepage hero's own
 * `HeroScene` is deliberately NOT given this treatment — it stays resident by
 * design (see `shared-viewport-renderer.ts`'s header comment: full-bleed,
 * uncontested context, the page's entry point).
 */
export const GeotechnicalPlexusScene = ({ className }: GeotechnicalPlexusSceneProps) => {
  const [setNode, nearView] = useDynamicInView({ rootMargin: getCardSceneRootMargin() });

  return (
    <div ref={setNode} className={className}>
      {nearView ? (
        <HeroScene
          className="h-full w-full"
          createScene={createGeotechnicalPlexusScene}
          fallback={<PlexusFallback />}
        />
      ) : (
        <PlexusFallback />
      )}
    </div>
  );
};

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
