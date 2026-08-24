"use client";

import { SceneViewport } from "@/components/scene/SceneViewport";
import { buildWorldGlobe } from "@/components/scene/world-globe";

/**
 * Background globe for the Stats section, showing a glowing pin at each
 * country the project list covers. Registers with the shared viewport
 * renderer; on mobile / reduced-motion it falls back to a plain radial glow.
 */
export const StatsGlobe = () => (
  <SceneViewport
    builder={buildWorldGlobe}
    className="pointer-events-none absolute inset-0"
    fallback={
      <div className="from-glow/10 absolute inset-0 bg-radial to-transparent" />
    }
  />
);
