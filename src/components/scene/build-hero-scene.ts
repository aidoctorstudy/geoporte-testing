/**
 * Pure three.js setup for the homepage hero — as of 2026-10-12 (ADR-0093/94),
 * a single particle Geoporte emblem (the real brand mark, not a text
 * wordmark — see `PARTICLE_LOGO_SRC` below) glowing via a dedicated bloom
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
  /** Overrides `PARTICLE_LOGO_POSITION_X_DESKTOP` — the emblem's desktop-
   * reference X position before `computeLogoFraming` scales/clamps it for
   * narrower aspect ratios. Defaults to the homepage's right-biased value;
   * pass `0` for a centered emblem (the maintenance page's own use — see
   * ADR-0109). Combine with a matching `cameraLookAt` x of `0` (the default)
   * so the camera is actually pointed at a centered emblem, not just the
   * emblem being centered in world space. */
  logoPositionXDesktop?: number;
}

/**
 * Classic "particles form a logotype" technique (the genre this mirrors —
 * motion-graphics demos that spell a mark from glowing points on load, then
 * let it drift/breathe and scatter under the cursor): sample which pixels
 * of an image are "on" (alpha ≥ 128) and use those as the particles'
 * resting positions. As of this revision, the source is the real brand
 * emblem (`/assets/logo/geoporte-logo.png` — the same navbar/footer logo,
 * `GeoporteLogo.tsx`'s own asset: 480×480, alpha-cutout, confirmed via its
 * PNG header) rather than canvas-rendered text, per an explicit "use the
 * actual logo, not the wordmark" brief.
 */
const PARTICLE_LOGO_SRC = "/assets/logo/geoporte-logo.png";
const PARTICLE_LOGO_ASSEMBLE_DURATION_S = 2;
/** Diameter, in world units, the assembled emblem should occupy — large
 * and prominent (the brief's own "large on the right side"), comparable to
 * the old wordmark's ~6.4-unit width. */
const PARTICLE_LOGO_TARGET_SIZE = 5.6;
/** World-space position biasing the emblem toward the right half of the
 * frame, so it reads as "right side" against the 2D text content anchored
 * left in `HeroSection.tsx` (that file's own `max-w-xl` left column is the
 * matching half of this layout). This is the *desktop* reference value —
 * `computeLogoFraming` below scales both this and `PARTICLE_LOGO_TARGET_SIZE`
 * down together on narrower aspect ratios, since a fixed world-space value
 * only clears the camera frustum's right edge at roughly 16:9 and wider: at
 * iPad landscape (4:3) the emblem's right edge already overflows the visible
 * frame, and at iPad/phone portrait it overflows by most of its own width.
 * See ADR-0101 (iPad/mobile particle-logo overflow fix). */
const PARTICLE_LOGO_POSITION_X_DESKTOP = 2.6;
const PARTICLE_LOGO_POSITION_Y_Z: [number, number] = [0.2, 0];
/** World-unit gap kept between the emblem's scaled right edge and the
 * camera frustum's right edge, so it never touches (let alone crosses) the
 * screen edge on any aspect ratio. */
const LOGO_FRUSTUM_EDGE_MARGIN = 0.6;

/** Half the horizontal extent (in world units) visible at the emblem's own
 * depth, for a camera with vertical field-of-view `fovDeg` sitting
 * `distance` units away — i.e. half of `tan(fov/2) * distance`, widened by
 * the current aspect ratio. Perspective-camera horizontal frustum math, not
 * tied to any particular scene. */
const getHalfFrustumWidth = (fovDeg: number, aspect: number, distance: number): number =>
  Math.tan((fovDeg * Math.PI) / 360) * distance * aspect;

/** Derives this emblem's actual position/scale for the current aspect
 * ratio: shrinks it (never enlarges past the desktop reference size) just
 * enough that its full width — plus `LOGO_FRUSTUM_EDGE_MARGIN` — fits
 * inside the right half of the frustum (`[0, halfFrustumWidth]`), then
 * places it as close to the desktop-reference x position as that fitted
 * width allows. This is what keeps the emblem fully on-screen (and inside
 * the page's own right-50% layout half) on iPad and phone aspect ratios
 * instead of overflowing off the right edge. */
const LOGO_MIN_SCALE = 0.05;

const computeLogoFraming = (
  halfFrustumWidth: number,
  desktopX: number = PARTICLE_LOGO_POSITION_X_DESKTOP,
): { positionX: number; scale: number } => {
  const availableWidth = halfFrustumWidth - LOGO_FRUSTUM_EDGE_MARGIN;
  // Floored well below any real device's aspect ratio — guards only against
  // a pathologically narrow/tall viewport driving `scale` to zero or
  // negative (which would invert or disappear the emblem), not a case this
  // scene is expected to look good at.
  const scale = Math.max(LOGO_MIN_SCALE, Math.min(1, availableWidth / PARTICLE_LOGO_TARGET_SIZE));
  const radius = (PARTICLE_LOGO_TARGET_SIZE * scale) / 2;
  const desiredX = desktopX * scale;
  // `desktopX = 0` (centered) has no minimum-x floor to respect — clamping
  // to `radius` would always push a centered emblem rightward. Only the
  // right-biased (positive desktopX) case needs that floor.
  const minX = desktopX === 0 ? -Infinity : radius;
  const maxX = halfFrustumWidth - LOGO_FRUSTUM_EDGE_MARGIN - radius;
  const positionX = Math.max(minX, Math.min(desiredX, maxX));
  return { positionX, scale };
};
// A radius sized relative to `PARTICLE_LOGO_TARGET_SIZE` (5.6 units
// diameter, ~2.8 unit radius from centre) — tight enough that only a
// deliberate, close hover displaces particles. The previous 1.5-unit
// radius covered more than half the emblem's own diameter, so the cursor
// merely passing near its centre pushed a large fraction of all particles
// outward in a radial burst at once — reading as "the logo breaks apart,"
// not a precise hover effect, and triggered far too easily given
// `pointerActive` (below) goes permanently true after a single mouse move
// anywhere on the page, not specifically over the hero.
const HOVER_REPULSE_RADIUS = 0.5;
const HOVER_REPULSE_STRENGTH = 0.6;
// How fast a particle's hover-repulsion offset decays back toward zero once
// the cursor moves away (or was never close enough to begin with) — the
// guarantee that particles "reassemble to logo shape on mouseleave." 0.18
// means ~70% of any offset is gone within 6 frames (~100ms) and over 99% is
// gone within half a second; raised from 0.12 for a snappier, more
// obviously-deliberate return to rest.
const HOVER_SPRING_RATE = 0.18;
// Idle breathe/drift amplitude, in world units — kept well under what ~2px
// of on-screen drift works out to at this scene's camera framing (roughly
// 0.02 world units per CSS pixel at a typical viewport height; see the
// camera setup below), so the wiggle reads as "subtle life in the shape,"
// never as motion large enough to look like it's leaving the logo outline.
const BREATHE_AMPLITUDE = 0.012;
const DRIFT_AMPLITUDE = 0.008;

/** Draws `image` to an offscreen canvas at its own native resolution and
 * returns one 3D point per sampled "on" pixel (alpha ≥ 128 — the logo PNG
 * is already background-removed, so this is a clean cutout, not a guess),
 * centred on the origin and scaled so the longer image dimension is
 * `targetSize` world units. `step` controls sampling density (and
 * therefore particle count) — larger on lower-capability tiers. Same-origin
 * asset, so no `crossOrigin`/canvas-taint handling is needed. */
const sampleImageParticlePositions = (
  image: HTMLImageElement,
  targetSize: number,
  step: number,
): Float32Array => {
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new Float32Array(0);
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const samples: number[] = [];
  for (let y = 0; y < canvas.height; y += step) {
    for (let x = 0; x < canvas.width; x += step) {
      if (data[(y * canvas.width + x) * 4 + 3] < 128) continue;
      samples.push(x, y);
    }
  }

  const scale = targetSize / Math.max(canvas.width, canvas.height);
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
   * the pointer hasn't moved yet or doesn't currently hit the emblem's
   * plane), or once with a saturating `elapsedSeconds` and a `null` pointer
   * from `renderStatic` so a reduced-motion/one-frame render shows the
   * fully-formed emblem rather than mid-scatter. A no-op (particles stay
   * invisible) until the source image has finished loading — see the
   * `image.onload` handler below. */
  update: (elapsedSeconds: number, pointerLocal: THREE.Vector2 | null) => void;
  /** Forces the fully-assembled resting frame regardless of timing — see
   * its own doc comment below for why this is a separate method from
   * `update`. */
  renderAssembledOnce: () => void;
}

/** Builds the particle Geoporte emblem — loads `PARTICLE_LOGO_SRC`
 * asynchronously (image decode, not available synchronously the way
 * canvas-rendered text was), then once ready, each particle eases from a
 * scattered sphere into its sampled position over
 * `PARTICLE_LOGO_ASSEMBLE_DURATION_S`, then (once settled) gently breathes
 * and drifts in place, and scatters away from the cursor when it comes
 * close, springing back once it moves away.
 *
 * `onReady` is called once, synchronously from the image's `onload`, after
 * the real geometry is in place — the caller uses this hook to force an
 * immediate fully-assembled render *only* for a reduced-motion visitor
 * (whose `renderStatic()` runs exactly once, before the image has had any
 * chance to finish loading, so without this they'd never see the emblem
 * at all). The normal animated path deliberately does nothing here — see
 * the call site in `createHeroScene` for why forcing a render
 * unconditionally caused a visible "flash of the solid logo" bug. */
const buildParticleLogo = (particleScale: number, onReady: () => void): ParticleLogo => {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(3), 3));
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

  let count = 0;
  let start: Float32Array | null = null;
  let target: Float32Array | null = null;
  let phase: Float32Array | null = null;
  let breatheSpeed: Float32Array | null = null;
  let hoverX: Float32Array | null = null;
  let hoverY: Float32Array | null = null;
  // Anchors the assembly ease to the first `update()` call *after* the
  // image is ready, not to `elapsedSeconds === 0` — the image can take an
  // arbitrary amount of time to decode, and without this the ease would
  // already be partway (or fully) through `PARTICLE_LOGO_ASSEMBLE_DURATION_S`
  // by the time real positions exist, reading as an instant pop-in instead
  // of an assembly.
  let assembleStartSeconds: number | null = null;

  // Sparser sampling (fewer particles) on lower-capability tiers — mirrors
  // every other particleScale consumer in this codebase. A solid-filled
  // emblem icon samples far denser than sparse wordmark text at the same
  // step, so the baseline step is larger than the old text sampler used.
  const step = Math.max(3, Math.round(6 / Math.sqrt(particleScale)));

  // Never appended to the DOM — only ever drawn into the detached offscreen
  // `<canvas>` inside `sampleImageParticlePositions`, which is also never
  // appended — so neither element can render visibly on its own regardless
  // of style. Explicit `opacity: 0`/`display: none` anyway, defensively and
  // for anyone reading this later: this `Image` is a pure pixel-data source,
  // never a visible element, by construction, not by CSS.
  const image = new Image();
  image.style.opacity = "0";
  image.style.display = "none";
  image.onload = () => {
    target = sampleImageParticlePositions(image, PARTICLE_LOGO_TARGET_SIZE, step);
    count = target.length / 3;

    start = new Float32Array(count * 3);
    phase = new Float32Array(count);
    breatheSpeed = new Float32Array(count);
    hoverX = new Float32Array(count);
    hoverY = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      // Scattered start: a loose sphere around the emblem's resting position.
      const radius = 4.5 + Math.random() * 3.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      start[i * 3] = Math.sin(phi) * Math.cos(theta) * radius;
      start[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * radius;
      start[i * 3 + 2] = Math.cos(phi) * radius;
      phase[i] = Math.random() * Math.PI * 2;
      breatheSpeed[i] = 0.5 + Math.random() * 0.5;
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(start), 3));
    onReady();
  };
  image.onerror = () => {
    console.error(`[hero-scene] failed to load particle logo source: ${PARTICLE_LOGO_SRC}`);
  };
  image.src = PARTICLE_LOGO_SRC;

  /** Shared per-particle write — `ease`/`settled` are supplied by the two
   * callers below rather than computed in here, so the "force fully
   * assembled, right now" path (`renderAssembledOnce`) can skip the
   * `assembleStartSeconds` timing state entirely rather than fighting it.
   *
   * `baseX`/`baseY`/`baseZ` are recomputed from `target` fresh every single
   * frame — never integrated/accumulated from the *previous* frame's
   * position — so there is no mechanism by which the breathe/drift wiggle
   * (or anything else in here) can compound over time and carry a particle
   * away from its target: each frame's position is always `target +
   * (bounded, recentred-every-frame offset)`, never `previous position +
   * offset`. Once `ease` reaches 1 (permanently, once assembled — see
   * `update()` below) this is mathematically a 100% pull toward the target
   * every frame, stronger than any lerp rate could express — the resting
   * state cannot drift away on its own. The only term that can move a
   * particle away from `target` at all is the cursor-hover repulsion below,
   * and that decays back toward zero (`HOVER_SPRING_RATE`) the moment the
   * cursor isn't close enough to justify it — there is no separate
   * "scatter/explode" animation anywhere in this file. */
  const writeParticles = (
    ease: number,
    settled: boolean,
    elapsedSeconds: number,
    pointerLocal: THREE.Vector2 | null,
  ) => {
    if (!target || !start || !phase || !breatheSpeed || !hoverX || !hoverY) return;
    const posAttr = geometry.attributes.position;

    for (let i = 0; i < count; i++) {
      const breathe = settled
        ? Math.sin(elapsedSeconds * breatheSpeed[i] + phase[i]) * BREATHE_AMPLITUDE
        : 0;
      const drift = settled
        ? Math.cos(elapsedSeconds * breatheSpeed[i] * 0.6 + phase[i]) * DRIFT_AMPLITUDE
        : 0;
      const baseX = start[i * 3] + (target[i * 3] - start[i * 3]) * ease + drift;
      const baseY = start[i * 3 + 1] + (target[i * 3 + 1] - start[i * 3 + 1]) * ease + breathe;
      const baseZ = start[i * 3 + 2] + (target[i * 3 + 2] - start[i * 3 + 2]) * ease;

      // Repulsion only once settled — scattering mid-assembly would fight
      // the ease and never visibly resolve into the emblem.
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

  const update = (elapsedSeconds: number, pointerLocal: THREE.Vector2 | null) => {
    if (count === 0) return;
    assembleStartSeconds ??= elapsedSeconds;
    const localElapsed = elapsedSeconds - assembleStartSeconds;
    const assembleT = Math.min(Math.max(localElapsed / PARTICLE_LOGO_ASSEMBLE_DURATION_S, 0), 1);
    const ease = 1 - Math.pow(1 - assembleT, 3); // easeOutCubic
    writeParticles(ease, assembleT >= 1, elapsedSeconds, pointerLocal);
  };

  /** Forces the fully-assembled, non-breathing resting frame, independent
   * of `assembleStartSeconds`/the time-based `update()` path above — used
   * both by `renderStatic()` (every reduced-motion render) and by
   * `onReady` (the one render that fires the instant the image finishes
   * loading, for a reduced-motion visitor whose single `renderStatic()`
   * call already happened before that — see `onReady`'s own comment).
   * Deliberately doesn't touch `assembleStartSeconds`: if the animated
   * loop is also running, its own next `update()` call still anchors and
   * eases normally from the true scatter, unaffected by this. */
  const renderAssembledOnce = () => {
    if (count === 0) return;
    writeParticles(1, false, 0, null);
  };

  return { points, update, renderAssembledOnce };
};

export const createHeroScene = (
  container: HTMLElement,
  framing: HeroSceneFraming = {},
): HeroSceneHandle => {
  const scene = new THREE.Scene();
  // Deliberately no `scene.background`/fog — the renderer's canvas (`alpha:
  // true` below) stays transparent wherever nothing is drawn, so the
  // persistent Earth globe and ambient shapes (mounted at the app root)
  // show through behind the particle emblem. Reverses ADR-0068's "the
  // hero occludes the globe" decision for this one scene — that decision
  // existed to let the old digital-twin diorama read as the hero's only 3D
  // content; with the diorama removed outright, there's nothing left to
  // protect. See ADR-0093.
  const [px, py, pz] = framing.cameraPosition ?? [0, 0, 9];
  const [lx, ly, lz] = framing.cameraLookAt ?? [0, 0, 0];
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(px, py, pz);
  camera.lookAt(lx, ly, lz);
  // Distance from the camera to the emblem's own plane — the other input
  // (besides fov/aspect) `getHalfFrustumWidth` needs to know how wide the
  // visible frame is at the emblem's depth. Read once: the camera only ever
  // nudges by the small parallax offset in `renderFrame` below, negligible
  // against this distance.
  const cameraDistance = camera.position.distanceTo(new THREE.Vector3(lx, ly, lz));

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

  // Mutable: recomputed in `resize()` below whenever the aspect ratio
  // changes (tablet/phone rotation, a responsive breakpoint) — tracked here
  // so `renderFrame`'s pointer-local math (further down) can always divide
  // by the emblem's *current* visual scale, not the desktop-reference one.
  let logoScale = 1;

  // `onReady` references `composer`/`particleLogo`, assigned just below —
  // safe because the callback only ever runs later, asynchronously, from
  // the image's `onload` (well after both exist), never during this
  // synchronous construction.
  //
  // Forces a fully-assembled render ONLY under `prefers-reduced-motion` —
  // that visitor's one-and-only `renderStatic()` call already happened
  // before the image had any chance to load, so without this they'd never
  // see the emblem at all (see `renderAssembledOnce`'s own comment).
  // Deliberately does NOT force anything for the normal animated path: an
  // earlier version of this fix called `renderAssembledOnce()`
  // unconditionally here, which rendered one frame of the *fully
  // assembled* (and, at this particle density, visually solid-looking —
  // easy to mistake for "the original logo image flashing") emblem the
  // instant the image loaded, before the real scatter-based intro had
  // drawn a single frame. Skipping the forced render for the animated
  // case means the canvas shows nothing (an empty, invisible placeholder
  // point) until the real data exists, and the very first frame that data
  // ever appears in is the genuine scattered start — never the assembled
  // shape — because `update()`'s own `assembleStartSeconds ??=
  // elapsedSeconds` anchors to exactly that first real `renderFrame` call,
  // not to this callback.
  const particleLogo = buildParticleLogo(particleScale, () => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      particleLogo.renderAssembledOnce();
      composer.render();
    }
  });
  {
    const initialAspect = (clientWidth || window.innerWidth) / (clientHeight || window.innerHeight || 1);
    const initialFraming = computeLogoFraming(
      getHalfFrustumWidth(camera.fov, initialAspect, cameraDistance),
      framing.logoPositionXDesktop,
    );
    logoScale = initialFraming.scale;
    particleLogo.points.position.set(initialFraming.positionX, ...PARTICLE_LOGO_POSITION_Y_Z);
    particleLogo.points.scale.setScalar(initialFraming.scale);
  }
  scene.add(particleLogo.points);

  // Selective bloom would need the 3-composer/`THREE.Layers` trick
  // `build-planet-scene.ts` uses (ADR-0034) — not needed here, since the
  // *entire* visible scene is the particle emblem and everything in frame
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
  // where the cursor sits in the emblem's own local space, driving the
  // hover-repulsion in `buildParticleLogo`. `setPointer` is only ever called
  // by `HeroScene.tsx` after a *real* `pointermove` (its own ticker
  // subscription gates on `pointer.hasMoved` before calling this) — never
  // synthesized from the shared pointer store's default (0,0) snapshot,
  // which would otherwise punch a permanent repulsion hole through the
  // centre of the emblem on every touch device and every page that
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
    // Forces the fully-assembled resting state rather than the scattered
    // construction state (or, before the image has loaded, nothing at
    // all) — `renderStatic` never calls `renderFrame`'s own time-driven
    // `update()`, so without this a reduced-motion visitor would see
    // either a permanent scattered particle cloud or an empty canvas,
    // never the emblem. No pointer interaction under reduced motion. Also
    // called (possibly more than once — `HeroScene.tsx` calls this again
    // on every resize while `prefers-reduced-motion` holds) independent of
    // whether the image has loaded yet; `renderAssembledOnce` itself
    // no-ops cleanly until it has.
    particleLogo.renderAssembledOnce();
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
        // Divide out `logoScale`: the particle geometry's own buffer
        // attribute holds *unscaled* local-space positions (sampled once at
        // `PARTICLE_LOGO_TARGET_SIZE`), while `pointerWorldHit` is a world-
        // space point — on a device where the emblem is rendered shrunk
        // (`points.scale`, set in `resize()`/above for tablet/phone aspect
        // ratios), the raw world-space offset would be smaller than the
        // local-space distances `HOVER_REPULSE_RADIUS` etc. are tuned
        // against, making the hover/touch repulsion radius read as
        // effectively larger than intended at every shrunk size.
        pointerLocalScratch.set(
          (pointerWorldHit.x - particleLogo.points.position.x) / logoScale,
          (pointerWorldHit.y - particleLogo.points.position.y) / logoScale,
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

    // Re-fit the emblem to the new aspect ratio (rotation, or a responsive
    // breakpoint) — same framing math as the initial placement above.
    const resizeFraming = computeLogoFraming(
      getHalfFrustumWidth(camera.fov, camera.aspect, cameraDistance),
      framing.logoPositionXDesktop,
    );
    logoScale = resizeFraming.scale;
    particleLogo.points.position.setX(resizeFraming.positionX);
    particleLogo.points.scale.setScalar(resizeFraming.scale);
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
