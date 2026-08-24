"use client";

import { useRef } from "react";
import { SpringTrigger } from "@/components/animation/springs/spring-trigger";
import { Inview } from "@/components/animation/springs/in-view";
import { SceneViewport, SceneViewportHandle } from "@/components/scene/SceneViewport";
import { buildGeologicalCrossSection } from "@/components/scene/geological-cross-section";
import { STRATA_LAYERS } from "@/components/scene/strata-scene-colors";

/**
 * Illustrative geological cross-section for the About section — layers reveal
 * as the panel scrolls into view. Registers with the shared viewport renderer
 * (`SceneViewport`); on mobile / reduced-motion it falls back to a static
 * gradient of the same four strata tokens.
 */
export const GeologicalCrossSection = () => {
  const sceneRef = useRef<SceneViewportHandle>(null);

  return (
    <SpringTrigger
      tag="figure"
      mode="scrub"
      start="top bottom"
      end="bottom center"
      onChange={({ interpolatedProgress }) =>
        sceneRef.current?.setControl(interpolatedProgress)
      }
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
          <Inview
            key={layer.key}
            tag="span"
            mode="once"
            from={{ opacity: 0, x: -8 }}
            to={{ opacity: 1, x: 0 }}
            delayIn={i * 150}
            className="text-foreground-muted text-xs tracking-[0.1em] uppercase"
          >
            {layer.label}
          </Inview>
        ))}
      </figcaption>
    </SpringTrigger>
  );
};
