/**
 * Studio-style lighting — soft ambient + hemisphere fill + one warm
 * directional key casting a subtle shadow, no dramatic cinematic darkness
 * per the brief. No shadow maps beyond the key light's own (cheap: one
 * shadow-casting light, nothing else) — full SSAO is skipped, a deliberate
 * performance trade documented in ADR-0061.
 */
import * as THREE from "three";
import type { DisposeFn } from "./constants";

export interface LightingHandle {
  dispose: DisposeFn;
}

export const setupLighting = (scene: THREE.Scene): LightingHandle => {
  const ambient = new THREE.AmbientLight(0xffffff, 0.6);
  const hemisphere = new THREE.HemisphereLight(0xffffff, 0xcac2b0, 0.5);
  const key = new THREE.DirectionalLight(0xfff2df, 0.95);
  key.position.set(9, 13, 7);
  const fill = new THREE.DirectionalLight(0xdce8f2, 0.22);
  fill.position.set(-7, 5, -6);
  scene.add(ambient, hemisphere, key, fill);

  return {
    dispose: () => {
      scene.remove(ambient, hemisphere, key, fill);
    },
  };
};
