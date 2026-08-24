"use client";

import { useRef, useState } from "react";
import { SpringTrigger } from "@/components/animation/springs/spring-trigger";
import { Spring } from "@/components/animation/springs/spring";
import { SceneViewport, SceneViewportHandle } from "@/components/scene/SceneViewport";
import { buildGeologicalCrossSection } from "@/components/scene/geological-cross-section";
import { STRATA_LAYERS } from "@/components/scene/strata-scene-colors";

const LAYER_COUNT = STRATA_LAYERS.length;

/**
 * Illustrative geological cross-section for the About section — layers reveal
 * as the panel scrolls into view, the camera pushes toward the strata, and a
 * borehole drill descends continuously (see `geological-cross-section.ts`).
 * Registers with the shared viewport renderer (`SceneViewport`); on mobile /
 * reduced-motion it falls back to a static gradient of the same four strata
 * tokens.
 *
 * Layer labels fly in from the right as the camera reaches each layer (item
 * 20) — driven by the same scroll progress as the scene itself, quantised to
 * "how many layers reached" so the label list only re-renders on an actual
 * threshold crossing, not on every sub-percent scroll tick.
 */
export const GeologicalCrossSection = () => {
  const sceneRef = useRef<SceneViewportHandle>(null);
  const [revealedCount, setRevealedCount] = useState(0);

  return (
    <SpringTrigger
      tag="figure"
      mode="scrub"
      start="top bottom"
      end="bottom center"
      onChange={({ interpolatedProgress }) => {
        sceneRef.current?.setControl(interpolatedProgress);
        const next = Math.min(
          LAYER_COUNT,
          Math.max(0, Math.floor(interpolatedProgress * LAYER_COUNT)),
        );
        setRevealedCount(next);
      }}
      className="border-line bg-surface relative overflow-hidden rounded-2xl border"
    >
      <SceneViewport
        ref={sceneRef}
        builder={buildGeologicalCrossSection}
        className="h-64 w-full"
        fallback={
          <div className="from-strata-clay via-strata-rock to-strata-bedrock h-64 w-full bg-gradient-to-b opacity-70" />
        }
      />
      <figcaption className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col gap-1.5 p-4">
        {STRATA_LAYERS.map((layer, i) => (
          <Spring
            key={layer.key}
            tag="span"
            enabled={i < revealedCount}
            from={{ opacity: 0, x: 24 }}
            to={{ opacity: 1, x: 0 }}
            config={{ tension: 260, friction: 26 }}
            className="text-foreground-muted text-xs tracking-[0.1em] uppercase"
          >
            {layer.label}
          </Spring>
        ))}
      </figcaption>
    </SpringTrigger>
  );
};
