/**
 * Clean, minimal three-light rig — ambient fill + hemisphere + one warm key
 * light, no shadow maps, no post-processing. Deliberately simple: the brief
 * asks for "clean lighting... avoid excessive bloom", and every other
 * subsystem here already carries its own translucency/emissive accents, so
 * a heavier rig would fight them rather than clarify the geometry.
 */
import * as THREE from "three";
import type { DisposeFn } from "./constants";

export interface LightingHandle {
  dispose: DisposeFn;
}

export const setupLighting = (scene: THREE.Scene): LightingHandle => {
  const ambient = new THREE.AmbientLight(0xffffff, 0.65);
  const hemisphere = new THREE.HemisphereLight(0xffffff, 0xcfc7b4, 0.55);
  const key = new THREE.DirectionalLight(0xfff2df, 0.85);
  key.position.set(8, 12, 6);
  const fill = new THREE.DirectionalLight(0xdce8f2, 0.25);
  fill.position.set(-6, 4, -8);
  scene.add(ambient, hemisphere, key, fill);

  return {
    dispose: () => {
      scene.remove(ambient, hemisphere, key, fill);
    },
  };
};
