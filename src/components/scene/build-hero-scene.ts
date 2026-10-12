/**
 * Pure three.js setup for the homepage hero — as of 2026-10-12 (ADR-0093), a
 * single particle "GEOPORTE" wordmark glowing via a dedicated bloom
 * composer, over a transparent background so the persistent Earth globe
 * (`PlanetBackground`, mounted at the app root) shows through. Replaces the
 * previous bespoke "digital twin" diorama (valley terrain, bridge, tunnel,
 * geological strata, a construction rig, dust, a point cloud) — removed
 * outright per an explicit "AiMatic-style" redesign brief, not hidden or
 * gated behind a flag.
 *
 * Framework-free by design: this module owns its own THREE objects and a
 * manual render loop driven by the caller (`HeroScene.tsx`), independent of
 * the spring ticker that drives `@react-spring/web` — see
 * obsidian/architecture/tech-stack.md → "3D — Geoporte hero + service scenes".
 */
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { HERO_SCENE_COLORS as COLOR } from "./hero-scene-colors";
import { getTierBudget } from "@/lib/scene/device-tier";
import type { HeroSceneHandle } from "./hero-scene-types";

/** Optional camera re-framing — unused today (this scene is homepage-only;
 * every service page has its own bespoke builder), kept as an override
 * point rather than hardcoding the framing inline. */
export interface HeroSceneFraming {
  cameraPosition?: [number, number, number];
  cameraLookAt?: [number, number, number];
}

/**
 * Classic "particles form a logotype" technique (the genre this mirrors —
 * motion-graphics demos that spell a wordmark from glowing points on load,
 * then let it drift/breathe and scatter under the cursor): render the brand
 * wordmark to an offscreen 2D canvas, sample which pixels are "on", and use
 * those as the particles' resting positions.
 */
const PARTICLE_LOGO_TEXT = "GEOPORTE";
const PARTICLE_LOGO_ASSEMBLE_DURATION_S = 2;
const PARTICLE_LOGO_CANVAS_WIDTH = 960;
const PARTICLE_LOGO_CANVAS_HEIGHT = 220;
const PARTICLE_LOGO_TARGET_WIDTH = 6.4;
/** World-space position biasing the wordmark toward the right half of the
 * frame, so it reads as "right side" against the 2D text content anchored
 * left in `HeroSection.tsx` (that file's own `max-w-xl` left column is the
 * matching half of this layout). Not visually tuned against a live browser
 * — no Chrome extension connected the session this was built — worth a
 * real look before calling this placement settled. */
const PARTICLE_LOGO_POSITION: [number, number, number] = [2.6, 0.2, 0];
const HOVER_REPULSE_RADIUS = 1.5;
const HOVER_REPULSE_STRENGTH = 1;
const HOVER_SPRING_RATE = 0.12;

/** Renders `text` to an offscreen canvas and returns one 3D point per
 * sampled "on" pixel (alpha ≥ 128), centred on the origin and scaled so the
 * text is `targetWidth` world units wide. `step` controls sampling density
 * (and therefore particle count) — larger on lower-capability tiers. */
const sampleTextParticlePositions = (
  text: string,
  targetWidth: number,
  step: number,
): Float32Array => {
  const canvas = document.createElement("canvas");
  canvas.width = PARTICLE_LOGO_CANVAS_WIDTH;
  canvas.height = PARTICLE_LOGO_CANVAS_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new Float32Array(0);

  // A bold, geometric system sans — not one of this project's two actual
  // webfonts (Playfair Display's thin serifs would scatter into
  // disconnected dots at particle resolution; Inter would work but isn't
  // guaranteed loaded by the time this runs). Only used for sampling pixel
  // positions, never rendered on screen, so it doesn't need to match either.
  ctx.fillStyle = "#fff";
  ctx.font = `700 ${PARTICLE_LOGO_CANVAS_HEIGHT * 0.56}px system-ui, -apple-system, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  // `letterSpacing` is a standard (if newer) 2D-context property — widens
  // the sampled glyphs slightly so tightly-kerned letters still resolve
  // into visually separate particle clusters rather than one dense blob.
  ctx.letterSpacing = "6px";
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);

  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const samples: number[] = [];
  for (let y = 0; y < canvas.height; y += step) {
    for (let x = 0; x < canvas.width; x += step) {
      if (data[(y * canvas.width + x) * 4 + 3] < 128) continue;
      samples.push(x, y);
    }
  }

  const scale = targetWidth / canvas.width;
  const positions = new Float32Array((samples.length / 2) * 3);
  for (let i = 0; i < samples.length / 2; i++) {
    positions[i * 3] = (samples[i * 2] - canvas.width / 2) * scale;
    positions[i * 3 + 1] = -(samples[i * 2 + 1] - canvas.height / 2) * scale; // canvas Y grows down
    positions[i * 3 + 2] = (Math.random() - 0.5) * 0.15; // slight z-jitter, not a flat decal
  }
  return positions;
};

interface ParticleLogo {
  points: THREE.Points;
  /** Advances the assembly ease, idle breathe/drift, and (once settled) the
   * cursor-repulsion scatter — call once per `renderFrame` with the
   * pointer's position in this object's own local space (`null` whenever
   * the pointer hasn't moved yet or doesn't currently hit the wordmark's
   * plane), or once with a saturating `elapsedSeconds` and a `null` pointer
   * from `renderStatic` so a reduced-motion/one-frame render shows the
   * fully-formed logo rather than mid-scatter. */
  update: (elapsedSeconds: number, pointerLocal: THREE.Vector2 | null) => void;
}

/** Builds the particle GEOPORTE wordmark — each particle eases from a
 * scattered sphere into its sampled text position over
 * `PARTICLE_LOGO_ASSEMBLE_DURATION_S`, then (once settled) gently breathes
 * and drifts in place, and scatters away from the cursor when it comes
 * close, springing back once it moves away. */
const buildParticleLogo = (particleScale: number): ParticleLogo => {
  // Sparser sampling (fewer particles) on lower-capability tiers — mirrors
  // every other particleScale consumer in this codebase.
  const step = Math.max(2, Math.round(4 / Math.sqrt(particleScale)));
  const target = sampleTextParticlePositions(PARTICLE_LOGO_TEXT, PARTICLE_LOGO_TARGET_WIDTH, step);
  const count = target.length / 3;

  const start = new Float32Array(count * 3);
  const phase = new Float32Array(count);
  const breatheSpeed = new Float32Array(count);
  // Current cursor-repulsion offset per particle (the wordmark is flat-ish,
  // so only x/y need it), smoothed toward its target each frame so
  // particles spring back rather than snapping when the cursor leaves.
  const hoverX = new Float32Array(count);
  const hoverY = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    // Scattered start: a loose sphere around the text's resting position.
    const radius = 4.5 + Math.random() * 3.5;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(Math.random() * 2 - 1);
    start[i * 3] = Math.sin(phi) * Math.cos(theta) * radius;
    start[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * radius;
    start[i * 3 + 2] = Math.cos(phi) * radius;
    phase[i] = Math.random() * Math.PI * 2;
    breatheSpeed[i] = 0.5 + Math.random() * 0.5;
  }

  const positions = new Float32Array(start);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    color: COLOR.logoGlow,
    size: 0.05,
    transparent: true,
    opacity: 0,
    sizeAttenuation: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;

  const update = (elapsedSeconds: number, pointerLocal: THREE.Vector2 | null) => {
    const assembleT = Math.min(elapsedSeconds / PARTICLE_LOGO_ASSEMBLE_DURATION_S, 1);
    const ease = 1 - Math.pow(1 - assembleT, 3); // easeOutCubic
    const settled = assembleT >= 1;
    const posAttr = geometry.attributes.position;

    for (let i = 0; i < count; i++) {
      const breathe = settled ? Math.sin(elapsedSeconds * breatheSpeed[i] + phase[i]) * 0.04 : 0;
      const drift = settled ? Math.cos(elapsedSeconds * breatheSpeed[i] * 0.6 + phase[i]) * 0.025 : 0;
      const baseX = start[i * 3] + (target[i * 3] - start[i * 3]) * ease + drift;
      const baseY = start[i * 3 + 1] + (target[i * 3 + 1] - start[i * 3 + 1]) * ease + breathe;
      const baseZ = start[i * 3 + 2] + (target[i * 3 + 2] - start[i * 3 + 2]) * ease;

      // Repulsion only once settled — scattering mid-assembly would fight
      // the ease and never visibly resolve into the wordmark.
      let pushX = 0;
      let pushY = 0;
      if (settled && pointerLocal) {
        const dx = baseX - pointerLocal.x;
        const dy = baseY - pointerLocal.y;
        const dist = Math.hypot(dx, dy);
        if (dist < HOVER_REPULSE_RADIUS && dist > 0.0001) {
          const force = (1 - dist / HOVER_REPULSE_RADIUS) * HOVER_REPULSE_STRENGTH;
          pushX = (dx / dist) * force;
          pushY = (dy / dist) * force;
        }
      }
      hoverX[i] += (pushX - hoverX[i]) * HOVER_SPRING_RATE;
      hoverY[i] += (pushY - hoverY[i]) * HOVER_SPRING_RATE;

      posAttr.setXYZ(i, baseX + hoverX[i], baseY + hoverY[i], baseZ);
    }
    posAttr.needsUpdate = true;
    material.opacity = 0.3 + ease * 0.6 + (settled ? Math.sin(elapsedSeconds * 0.8) * 0.08 : 0);
  };

  return { points, update };
};

export const createHeroScene = (
  container: HTMLElement,
  framing: HeroSceneFraming = {},
): HeroSceneHandle => {
  const scene = new THREE.Scene();
  // Deliberately no `scene.background`/fog — the renderer's canvas (`alpha:
  // true` below) stays transparent wherever nothing is drawn, so the
  // persistent Earth globe and ambient shapes (mounted at the app root)
  // show through behind the particle wordmark. Reverses ADR-0068's "the
  // hero occludes the globe" decision for this one scene — that decision
  // existed to let the old digital-twin diorama read as the hero's only 3D
  // content; with the diorama removed outright, there's nothing left to
  // protect. See ADR-0093.
  const [px, py, pz] = framing.cameraPosition ?? [0, 0, 9];
  const [lx, ly, lz] = framing.cameraLookAt ?? [0, 0, 0];
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(px, py, pz);
  camera.lookAt(lx, ly, lz);

  const canvas = document.createElement("canvas");
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
  });
  // Tier-based, not a flat 2x — see the identical fix in
  // `service-heroes/hero-scene-runtime.ts`.
  const { clientWidth, clientHeight } = container;
  const { dprClamp, particleScale, bloomScale } = getTierBudget(clientWidth || window.innerWidth);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, dprClamp));
  renderer.setSize(clientWidth || 1, clientHeight || 1);

  const particleLogo = buildParticleLogo(particleScale);
  particleLogo.points.position.set(...PARTICLE_LOGO_POSITION);
  scene.add(particleLogo.points);

  // Selective bloom would need the 3-composer/`THREE.Layers` trick
  // `build-planet-scene.ts` uses (ADR-0034) — not needed here, since the
  // *entire* visible scene is the particle wordmark and everything in frame
  // is meant to glow. A single composer + `UnrealBloomPass` over the whole
  // render is both correct and simpler; mirrors `build-solaris-scene.ts`'s
  // own single-composer shape. optimize-3d-scene skill §7: scale bloom by
  // the capability tier and skip the pass entirely when it would
  // contribute nothing (`bloomScale` is 0 on medium/low capability).
  const composer = new EffectComposer(renderer);
  composer.setPixelRatio(renderer.getPixelRatio());
  composer.addPass(new RenderPass(scene, camera));
  const bloomStrength = 0.9 * bloomScale;
  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(clientWidth || 1, clientHeight || 1),
    bloomStrength,
    0.6,
    0.15,
  );
  bloomPass.enabled = bloomStrength > 0.001;
  composer.addPass(bloomPass);

  // Pointer — smoothed for the gentle camera parallax below, and raycast
  // each frame (scratch objects below, never reallocated per-frame) to find
  // where the cursor sits in the wordmark's own local space, driving the
  // hover-repulsion in `buildParticleLogo`. `setPointer` is only ever called
  // by `HeroScene.tsx` after a *real* `pointermove` (its own ticker
  // subscription gates on `pointer.hasMoved` before calling this) — never
  // synthesized from the shared pointer store's default (0,0) snapshot,
  // which would otherwise punch a permanent repulsion hole through the
  // centre of the wordmark on every touch device and every page that
  // hasn't been touched yet (optimize-3d-scene skill §11).
  let pointerTargetX = 0;
  let pointerTargetY = 0;
  let pointerX = 0;
  let pointerY = 0;
  let pointerActive = false;
  const pointerRaycaster = new THREE.Raycaster();
  const pointerNdc = new THREE.Vector2();
  const pointerPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -particleLogo.points.position.z);
  const pointerWorldHit = new THREE.Vector3();
  const pointerLocalScratch = new THREE.Vector2();

  const setPointer = (x: number, y: number) => {
    pointerTargetX = Math.max(-1, Math.min(1, x));
    pointerTargetY = Math.max(-1, Math.min(1, y));
    pointerActive = true;
  };

  // Scroll-driven fade — target set by the caller from a `<SpringTrigger
  // mode="scrub">` wrapping the hero, smoothed the same way as pointer.
  let scrollTarget = 0;
  let scrollProgress = 0;

  const setScrollProgress = (progress: number) => {
    scrollTarget = Math.max(0, Math.min(1, progress));
  };

  const renderStatic = () => {
    // Forces the particle logo to its fully-assembled resting state rather
    // than the scattered construction state it starts in — `renderStatic`
    // never calls `renderFrame`'s own time-driven update, so without this a
    // reduced-motion visitor would see a permanent scattered particle cloud
    // instead of the wordmark. No pointer interaction under reduced motion.
    particleLogo.update(PARTICLE_LOGO_ASSEMBLE_DURATION_S, null);
    composer.render();
  };

  const renderFrame = (elapsedSeconds: number) => {
    pointerX += (pointerTargetX - pointerX) * 0.06;
    pointerY += (pointerTargetY - pointerY) * 0.06;
    scrollProgress += (scrollTarget - scrollProgress) * 0.06;

    // Gentle parallax only — no orbit. There's no terrain to orbit around
    // anymore, and a large camera swing would fight the fixed left-text/
    // right-particle layout this scene is now framed for.
    camera.position.x = px + pointerX * 0.4;
    camera.position.y = py - pointerY * 0.3;
    camera.lookAt(lx, ly, lz);

    let pointerLocal: THREE.Vector2 | null = null;
    if (pointerActive) {
      pointerNdc.set(pointerTargetX, -pointerTargetY);
      pointerRaycaster.setFromCamera(pointerNdc, camera);
      if (pointerRaycaster.ray.intersectPlane(pointerPlane, pointerWorldHit)) {
        pointerLocalScratch.set(
          pointerWorldHit.x - particleLogo.points.position.x,
          pointerWorldHit.y - particleLogo.points.position.y,
        );
        pointerLocal = pointerLocalScratch;
      }
    }
    particleLogo.update(elapsedSeconds, pointerLocal);

    // Fade out as the user scrolls past the hero into the next section.
    (particleLogo.points.material as THREE.PointsMaterial).opacity *= 1 - scrollProgress;

    composer.render();
  };

  const resize = (width: number, height: number) => {
    if (width <= 0 || height <= 0) return;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    composer.setSize(width, height);
    composer.setPixelRatio(renderer.getPixelRatio());
  };

  const dispose = () => {
    particleLogo.points.geometry.dispose();
    (particleLogo.points.material as THREE.PointsMaterial).dispose();
    composer.dispose();
    renderer.dispose();
  };

  return {
    renderStatic,
    renderFrame,
    resize,
    setPointer,
    setScrollProgress,
    dispose,
    canvas,
  };
};
