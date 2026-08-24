"use client";

import { SceneViewport } from "@/components/scene/SceneViewport";
import { buildOfficeTerrain } from "@/components/scene/office-terrain";

/**
 * Background terrain for the Contact section, with a glowing marker for each
 * of the four Geoporte offices. Registers with the shared viewport renderer;
 * falls back to a plain gradient on mobile / reduced-motion.
 */
export const ContactTerrain = () => (
  <SceneViewport
    builder={buildOfficeTerrain}
    className="pointer-events-none absolute inset-0"
    fallback={
      <div className="from-line/20 absolute inset-0 bg-gradient-to-t to-transparent" />
    }
  />
);
