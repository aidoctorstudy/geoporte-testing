/**
 * Aureole — GetLayers' "golden particle corona" scene
 * (`getlayers_search`/`getlayers_materialize`, id `aureole`) — tens of
 * thousands of motes erupting from a dark hollow core along 16 irregular
 * radial spokes, drifting outward and dissipating, finished with
 * `UnrealBloomPass`. Pulled and ported verbatim; every CONFIG value, the
 * `mulberry32(0x5EED)` deterministic PRNG, the 16-spoke/30%-diffuse-dust
 * geometry construction, and both shaders are copied character for
 * character from the materialized source — cross-checked against the
 * brief's own numbers first, and every one of them (COUNT 95000, SPIKES 16,
 * seed `0x5EED`, 30% diffuse, `phi` tilt via `gauss()*0.16`, CONFIG
 * defaults, camera at `(0,0,17)` fixed head-on, `PULSE_SPEED 14`, up to 16
 * live shockwaves, 2200ms easeOutCubic intro) matches exactly — the brief
 * was clearly written from this same real source, so nothing here needed
 * reconciling.
 *
 * The camera never moves (`driver: "ambient"` in the real asset metadata,
 * confirmed by the source itself: `camera.position.set(0,0,17)` once, no
 * scroll or orbit logic anywhere) — the only motion is the particles'
 * own eruption cycle and the pointer-driven flare/shockwaves.
 *
 * CONFIG colours (`colorCore`/`colorTip`, `#ff7a12`/`#ffe39a`) are the
 * scene's own default amber/gold, not the project's blue tint override —
 * same "the constants ARE the spec" precedent as every other scene here,
 * and this asset's own tint metadata notes it "exposes no knob for:
 * background, secondary," i.e. it wasn't designed to be retinted.
 *
 * Documented deviations, all forced by this project's `HeroSceneHandle`
 * contract or its actual dependency versions, none visible in the
 * rendered look:
 * - Tier-based DPR clamp instead of the source's flat `min(dpr, 2)`.
 * - `window.addEventListener` for `pointermove`/`pointerdown`/
 *   `pointerleave` instead of the source's `canvas.addEventListener` —
 *   this scene's own fixed canvas is `pointer-events-none` (both the
 *   full-page background and the homepage card), so the canvas itself can
 *   never receive pointer events; window-level listeners are the only way
 *   the flare/shockwave interaction can work at all, matching the
 *   brief's own explicit instruction. Same shape as
 *   `build-aether-flux-scene.ts`'s / `build-einstein-rosen-lattice-scene.ts`'s
 *   own bespoke click listeners for interactions `HeroSceneHandle` doesn't
 *   cover — attached in the builder, removed in `dispose()`. `setPointer`
 *   is therefore an intentional no-op: this scene manages its own pointer
 *   state independently of `HeroScene.tsx`'s shared pointer store.
 * - The render loop is `HeroScene.tsx`'s own rAF (`renderFrame(elapsedSeconds)`)
 *   instead of the source's freestanding one; `uTime` reads `elapsedSeconds`
 *   directly, and the 2200ms intro / shockwave radii read
 *   `elapsedSeconds * 1000` in place of the source's own
 *   `performance.now()` deltas.
 * - No `OutputPass`/gamma-correction stage — unlike this project's other
 *   composited scenes (which need one to correct a physically-lit render),
 *   the source itself has none: this is a pure additive-blend point cloud
 *   on black with no tone-mapped lighting to correct, and adding one would
 *   deviate from "implement exactly," not preserve it.
 * - `COUNT` is a constructor option (95000 hero / 30000 card per the
 *   brief) rather than the source's hardcoded constant — the seeded PRNG
 *   stream is still fully deterministic for either count, just a shorter
 *   draw sequence for the card.
 */
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { getTierBudget } from "@/lib/scene/device-tier";
import type { HeroSceneHandle } from "./hero-scene-types";

// Verbatim "Default" CONFIG from the materialized source.
const CONFIG = {
  colorCore: "#ff7a12",
  colorTip: "#ffe39a",
  coreRadius: 2.25,
  reach: 14,
  falloff: 2.95,
  flowSpeed: 0.075,
  pointSize: 2,
  cursorHeat: 0.15,
  cursorFocus: 1,
};

const SPIKES = 16;
const PULSE_SPEED = 14;
const MAX_PULSES = 16;
const CAM_DIST = 17;

const hexToVec3 = (hex: string): THREE.Vector3 => {
  const n = parseInt(hex.slice(1), 16);
  return new THREE.Vector3(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
};

// Deterministic PRNG so the corona looks the same every load — verbatim.
const mulberry32 = (a: number) => (): number => {
  a |= 0;
  a = (a + 0x6d2b79f5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

// ---------------------------------------------------------------------------
// Shaders — verbatim from the materialized source.
// ---------------------------------------------------------------------------
const PARTICLE_VERT = /* glsl */ `
    attribute float aReachN;   // normalized max radius for this mote (0..~1.3)
    attribute float aSeed;     // per-particle phase + twinkle seed
    uniform float uTime;
    uniform float uCore;
    uniform float uReach;
    uniform float uFalloff;
    uniform float uFlow;
    uniform float uPointSize;
    uniform float uIntro;
    uniform vec3  uColorCore;
    uniform vec3  uColorTip;
    uniform vec3  uCursorDir;      // world-space direction the pointer aims at
    uniform float uCursorStrength; // 0 idle, 1 pointer active
    uniform float uCursorHeat;
    uniform float uCursorFocus;
    uniform float uPulses[16];     // radii of the live shockwaves (world units)
    uniform int   uPulseCount;     // how many are in flight this frame
    varying float vAlpha;
    varying vec3  vCol;

    void main() {
        vec3 dir = normalize(position);

        // Outward eruption: each mote travels core -> tip on a looping phase.
        // pow() warps the loop so motes linger near the core (dense) and
        // accelerate as they fling out (sparse tips).
        float phase = fract(uTime * uFlow + aSeed);
        float rr = pow(phase, uFalloff);
        float maxR = uReach * aReachN;

        // Directional flare — motes aimed toward the pointer reach further and burn white.
        float aim = max(dot(dir, uCursorDir), 0.0);
        float heat = pow(aim, uCursorFocus) * uCursorStrength * uCursorHeat;

        float r = uCore + rr * maxR * (1.0 + heat * 0.7);
        vec3 pos = dir * r;

        // Life alpha: emerge from the core, dissipate at the tips, twinkle.
        float tw = 0.6 + 0.4 * sin(aSeed * 43.0 + uTime * 6.2);
        vAlpha = smoothstep(0.0, 0.08, phase) * (1.0 - smoothstep(0.55, 1.0, phase)) * tw;
        vAlpha += heat * 0.6;

        // Click shockwaves: brighten a thin ring for each live wave (many at once).
        float ring = 0.0;
        for (int i = 0; i < 16; i++) {
          if (i >= uPulseCount) break;
          ring += 1.0 - smoothstep(0.0, 0.7, abs(r - uPulses[i]));
        }
        vAlpha += ring * 0.9;

        vAlpha *= uIntro;

        float grad = clamp((r - uCore) / max(uReach, 0.001), 0.0, 1.0);
        vCol = mix(uColorCore, uColorTip, grad);
        vCol = mix(vCol, vec3(1.0, 0.95, 0.82), clamp(heat + ring * 0.6, 0.0, 1.0));

        vec4 mv = modelViewMatrix * vec4(pos, 1.0);
        gl_PointSize = uPointSize * (34.0 / -mv.z) * (0.8 + heat * 1.3);
        gl_PointSize = max(gl_PointSize, 1.0);
        gl_Position = projectionMatrix * mv;
    }
`;

const PARTICLE_FRAG = /* glsl */ `
    varying float vAlpha;
    varying vec3  vCol;
    void main() {
        vec2 xy = gl_PointCoord.xy - vec2(0.5);
        float d = length(xy);
        if (d > 0.5) discard;
        float a = smoothstep(0.5, 0.0, d);
        gl_FragColor = vec4(vCol, vAlpha * a);
    }
`;

interface AureoleOptions {
  count: number;
  bloomStrength: number;
  bloomRadius: number;
  bloomThreshold: number;
}

const buildAureoleScene = (container: HTMLElement, options: AureoleOptions): HeroSceneHandle => {
  const { count, bloomStrength, bloomRadius, bloomThreshold } = options;
  const canvas = document.createElement("canvas");
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  const { clientWidth, clientHeight } = container;
  const { dprClamp } = getTierBudget(clientWidth || window.innerWidth);
  const pixelRatio = Math.min(window.devicePixelRatio, dprClamp);
  renderer.setPixelRatio(pixelRatio);
  renderer.setSize(clientWidth || 1, clientHeight || 1);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);

  const camera = new THREE.PerspectiveCamera(60, (clientWidth || 1) / (clientHeight || 1), 0.1, 1000);
  camera.position.set(0, 0, CAM_DIST);
  camera.lookAt(0, 0, 0);

  // ---- particle corona geometry — verbatim construction ----
  const rng = mulberry32(0x5eed);
  const gauss = () => (rng() + rng() + rng() - 1.5) / 1.5;

  const spikeAngle: number[] = [];
  const spikeMult: number[] = [];
  for (let i = 0; i < SPIKES; i++) {
    spikeAngle.push((i / SPIKES) * Math.PI * 2 + (rng() - 0.5) * 0.38);
    spikeMult.push(0.5 + rng() * 0.8);
  }

  const dirs = new Float32Array(count * 3);
  const reachN = new Float32Array(count);
  const seeds = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const diffuse = rng() < 0.3;
    let theta: number;
    let rm: number;
    if (diffuse) {
      theta = rng() * Math.PI * 2;
      rm = 0.25 + rng() * 0.55;
    } else {
      const s = Math.floor(rng() * SPIKES);
      theta = spikeAngle[s] + gauss() * 0.06;
      rm = spikeMult[s] * (0.7 + rng() * 0.5);
    }
    const phi = gauss() * 0.16;
    const cp = Math.cos(phi);
    dirs[i * 3] = Math.cos(theta) * cp;
    dirs[i * 3 + 1] = Math.sin(theta) * cp;
    dirs[i * 3 + 2] = Math.sin(phi);
    reachN[i] = Math.min(1.35, rm);
    seeds[i] = rng();
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(dirs, 3));
  geometry.setAttribute("aReachN", new THREE.BufferAttribute(reachN, 1));
  geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));

  const uniforms = {
    uTime: { value: 0 },
    uCore: { value: CONFIG.coreRadius },
    uReach: { value: CONFIG.reach },
    uFalloff: { value: CONFIG.falloff },
    uFlow: { value: CONFIG.flowSpeed },
    uPointSize: { value: CONFIG.pointSize },
    uIntro: { value: 0 },
    uColorCore: { value: hexToVec3(CONFIG.colorCore) },
    uColorTip: { value: hexToVec3(CONFIG.colorTip) },
    uCursorDir: { value: new THREE.Vector3(1, 0, 0) },
    uCursorStrength: { value: 0 },
    uCursorHeat: { value: CONFIG.cursorHeat },
    uCursorFocus: { value: CONFIG.cursorFocus },
    uPulses: { value: new Array(MAX_PULSES).fill(0) },
    uPulseCount: { value: 0 },
  };
  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: PARTICLE_VERT,
    fragmentShader: PARTICLE_FRAG,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    depthTest: false,
  });
  const corona = new THREE.Points(geometry, material);
  corona.frustumCulled = false;
  scene.add(corona);

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(clientWidth || 1, clientHeight || 1),
    bloomStrength,
    bloomRadius,
    bloomThreshold,
  );
  composer.addPass(bloomPass);

  // ---- interaction — window listeners, since the canvas is always
  // pointer-events-none (see file header) ----
  const pointerNdc = new THREE.Vector2();
  let pointerInside = false;
  const raycaster = new THREE.Raycaster();
  const discPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  const hitPoint = new THREE.Vector3();
  const cursorTarget = new THREE.Vector3(1, 0, 0);
  const pulses: number[] = []; // start time (elapsedSeconds) of every live shockwave

  const handlePointerMove = (e: PointerEvent) => {
    pointerNdc.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointerNdc.y = -(e.clientY / window.innerHeight) * 2 + 1;
    pointerInside = true;
  };
  const handlePointerDown = () => {
    pulses.push(lastElapsed);
  };
  const handlePointerLeave = () => {
    pointerInside = false;
  };
  window.addEventListener("pointermove", handlePointerMove);
  window.addEventListener("pointerdown", handlePointerDown);
  window.addEventListener("pointerleave", handlePointerLeave);

  let lastElapsed = 0;

  const renderStatic = () => {
    uniforms.uTime.value = 0;
    uniforms.uIntro.value = 1;
    uniforms.uCursorStrength.value = 0;
    uniforms.uPulseCount.value = 0;
    composer.render();
  };

  const renderFrame = (elapsedSeconds: number) => {
    lastElapsed = elapsedSeconds;
    uniforms.uTime.value = elapsedSeconds;

    const introRaw = Math.min((elapsedSeconds * 1000) / 2200, 1);
    uniforms.uIntro.value = 1 - Math.pow(1 - introRaw, 3); // easeOutCubic

    // Pointer flare — raycast onto the disc plane and aim the flare at the hit.
    let active = false;
    if (pointerInside) {
      raycaster.setFromCamera(pointerNdc, camera);
      if (raycaster.ray.intersectPlane(discPlane, hitPoint) && hitPoint.length() > 0.001) {
        cursorTarget.copy(hitPoint).normalize();
        active = true;
      }
    }
    uniforms.uCursorStrength.value += ((active ? 1 : 0) - uniforms.uCursorStrength.value) * 0.08;
    uniforms.uCursorDir.value.lerp(cursorTarget, 0.15).normalize();

    // Shockwaves — advance every live ring, drop the ones that have swept
    // past the corona, hand the current radii (up to 16) to the shader.
    const maxR = CONFIG.reach * 1.4 + CONFIG.coreRadius;
    for (let i = pulses.length - 1; i >= 0; i--) {
      if ((elapsedSeconds - pulses[i]) * PULSE_SPEED > maxR) pulses.splice(i, 1);
    }
    const arr = uniforms.uPulses.value;
    const n = Math.min(pulses.length, MAX_PULSES);
    for (let i = 0; i < n; i++) arr[i] = (elapsedSeconds - pulses[i]) * PULSE_SPEED;
    uniforms.uPulseCount.value = n;

    composer.render();
  };

  const resize = (width: number, height: number) => {
    if (width <= 0 || height <= 0) return;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    const dpr = renderer.getPixelRatio();
    composer.setPixelRatio(dpr);
    composer.setSize(width, height);
    bloomPass.setSize(width, height);
  };
  resize(clientWidth || 1, clientHeight || 1);

  // Interaction is fully window-driven (see file header) — HeroScene.tsx's
  // own shared pointer store isn't used, so this is an intentional no-op.
  const setPointer = () => {};

  const dispose = () => {
    window.removeEventListener("pointermove", handlePointerMove);
    window.removeEventListener("pointerdown", handlePointerDown);
    window.removeEventListener("pointerleave", handlePointerLeave);
    geometry.dispose();
    material.dispose();
    composer.dispose();
    renderer.dispose();
  };

  return { renderStatic, renderFrame, resize, setPointer, dispose, canvas };
};

/** Full-bleed Advisory Services service-page background — the source's own
 * numbers verbatim (95000 particles, bloom 1.77/0.96/0). */
export const createAureoleHeroScene = (container: HTMLElement): HeroSceneHandle =>
  buildAureoleScene(container, { count: 95000, bloomStrength: 1.77, bloomRadius: 0.96, bloomThreshold: 0 });

/** Small, contained homepage-card version — same shader/geometry/interaction
 * as the hero, particle count and bloom both toned down for the card's
 * small buffer, per the brief. */
export const createAureoleCardScene = (container: HTMLElement): HeroSceneHandle =>
  buildAureoleScene(container, { count: 30000, bloomStrength: 1.2, bloomRadius: 0.7, bloomThreshold: 0 });
