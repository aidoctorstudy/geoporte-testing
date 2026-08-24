/**
 * Shared plumbing for a full-bleed, own-`WebGLRenderer` hero scene: canvas,
 * renderer, camera idle-drift + pointer-parallax, resize, dispose — the
 * boilerplate every scene in this folder would otherwise duplicate. Mirrors
 * `build-hero-scene.ts`'s `createHeroScene` internals; each `build-*-scene.ts`
 * module here supplies only its scene contents and per-frame animation via
 * `build()`. See obsidian/architecture/tech-stack.md → "3D — service hero
 * scenes".
 */
import * as THREE from "three";
import type { HeroSceneHandle } from "../hero-scene-types";

export interface HeroSceneFraming {
  cameraPosition?: [number, number, number];
  cameraLookAt?: [number, number, number];
  /** Scales the shared idle sine-drift + pointer-parallax camera motion — 1
   * (default) matches the homepage hero's magnitude, 0 locks the camera to
   * `cameraPosition`/`cameraLookAt` (pointer parallax still applies). Used by
   * scenes that read as a fixed inspection viewpoint rather than a sweeping
   * establishing shot. */
  driftScale?: number;
}

export interface HeroSceneBuild {
  scene: THREE.Scene;
  /** Runs every animated frame. `pointer` is the smoothed -1..1 position
   * (stays 0,0 until `setPointer` is ever called). */
  update: (elapsedSeconds: number, pointer: { x: number; y: number }) => void;
  dispose: () => void;
}

export const createHeroSceneRuntime = (
  container: HTMLElement,
  framing: HeroSceneFraming,
  build: () => HeroSceneBuild,
): HeroSceneHandle => {
  const [px, py, pz] = framing.cameraPosition ?? [0, 3.2, 8];
  const [lx, ly, lz] = framing.cameraLookAt ?? [0, 0, 0];
  const driftScale = framing.driftScale ?? 1;

  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(px, py, pz);
  camera.lookAt(lx, ly, lz);

  const canvas = document.createElement("canvas");
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  const { clientWidth, clientHeight } = container;
  renderer.setSize(clientWidth || 1, clientHeight || 1);

  const { scene, update, dispose: disposeContent } = build();

  let pointerTargetX = 0;
  let pointerTargetY = 0;
  let pointerX = 0;
  let pointerY = 0;

  const setPointer = (x: number, y: number) => {
    pointerTargetX = Math.max(-1, Math.min(1, x));
    pointerTargetY = Math.max(-1, Math.min(1, y));
  };

  const renderStatic = () => {
    renderer.render(scene, camera);
  };

  const renderFrame = (elapsedSeconds: number) => {
    pointerX += (pointerTargetX - pointerX) * 0.04;
    pointerY += (pointerTargetY - pointerY) * 0.04;

    camera.position.x = px + Math.sin(elapsedSeconds * 0.04) * 1.1 * driftScale + pointerX * 1.2;
    camera.position.y = py + Math.sin(elapsedSeconds * 0.07) * 0.25 * driftScale - pointerY * 0.5;
    camera.lookAt(lx, ly + pointerY * 0.25, lz);

    update(elapsedSeconds, { x: pointerX, y: pointerY });

    renderer.render(scene, camera);
  };

  const resize = (width: number, height: number) => {
    if (width <= 0 || height <= 0) return;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  };

  const dispose = () => {
    disposeContent();
    renderer.dispose();
  };

  return { renderStatic, renderFrame, resize, setPointer, dispose, canvas };
};
