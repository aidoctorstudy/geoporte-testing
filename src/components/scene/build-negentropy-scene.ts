/**
 * Negentropy — a six-field particle composition for the Stormwater & Flood
 * Modelling service page: an ambient bone/violet starfield behind five
 * featured GetLayers particle scenes (spiral network, molecule, red storm,
 * hourglass galaxy, close starfield), cross-faded and camera-flown through
 * as the page scrolls. "Negentropy" itself is NOT a cataloged GetLayers
 * asset — `getlayers_search` for it returns nothing (confirmed before
 * building anything, not assumed) — but every field the brief names down to
 * exact particle counts and geometry IS real and individually cataloged, so
 * each one was pulled verbatim via `getlayers_materialize`
 * (`spiral-network`, `molecule`, `hourglass-galaxy`, `starfield-close`,
 * `storm` — the brief's "RED STORM" is this scene's own default "red" hue
 * variant) and cross-checked against the brief's own numbers before this
 * file was written:
 * - spiral-network: 80000 pts, radius 5, 2 branches — matches the brief
 *   exactly.
 * - molecule: 12 atoms × 600 pts + 30 bonds × 60 pts, radius 3.0 — matches
 *   exactly (12 vertices / 30 edges of an icosahedron, confirmed in the
 *   real source's own `RAW_ATOMS`/edge-scan code).
 * - hourglass-galaxy: 70000 pts per funnel × 2, radius 2.5, 3 branches —
 *   matches exactly.
 * - storm: 50000 pts, radius 2.5 — matches exactly.
 * - starfield-close: box ±12/±8/±15 matches exactly, but the brief's stated
 *   "1500 pts" does NOT match the real source's own fixed `count = 4200` —
 *   particle count is a structural constant here (`contract.preserve:
 *   ["motion","composition"]`, "geometry is built once from fixed
 *   constants," not a CONFIG/tint knob), so the real 4200 is kept rather
 *   than the brief's number, per this project's standing rule of never
 *   letting a brief override a verified source's structural geometry.
 * - "AMBIENT STARFIELD" (1200 pts, radius 60, plain `PointsMaterial`) has
 *   no matching cataloged scene under that name — it's simple enough
 *   (a bare sphere of points, no custom shader) to build directly from the
 *   brief's own spec rather than force-fit a pull.
 *
 * Every field's vertex/fragment shader below is copied character for
 * character from its materialized source — do not "clean up" the GLSL.
 * Colours (inner/outer, atom/bond, core/mid/rim, inside/outside, colorA-C)
 * are the brief's own explicit hex values where it gave them, else each
 * field's own real CONFIG default — same "constants ARE the spec" precedent
 * as every other scene in this codebase.
 *
 * **Structural deviations, all necessary because NEGENTROPY composites six
 * fields under ONE shared camera/composer, where each pulled source is its
 * own standalone single-scene page with its own camera and composer:**
 * - Each field's own per-frame camera repositioning
 *   (`camera.position.set(...); camera.lookAt(...)`) is dropped — six
 *   fields independently steering the same camera would fight each other.
 *   The brief's own 7-anchor camera flight is the ONE thing driving the
 *   shared camera; each field keeps only its idle group spin.
 * - Each field's own triple-composer "FinalPass" rig (torusComposer /
 *   bloomComposer / finalComposer with a corner-flame atmosphere shader) is
 *   dropped — that compositing exists to give each standalone scene its own
 *   background-gradient-plus-flame look, which doesn't make sense once six
 *   fields share one frame. Replaced with the ONE shared composer the brief
 *   itself specifies (`RenderPass -> UnrealBloomPass(0.55, 1.8, 0.02)`),
 *   plus an `OutputPass` for correct sRGB output — the brief's own list
 *   doesn't mention one, but every composited scene in this codebase ends
 *   its chain with a colour-correct output stage (see
 *   `build-golden-parthenon-scene.ts`) and omitting it here would leave the
 *   final image in linear space.
 * - The cursor-void system (`uCursor`/`uActivity`, world-space unproject to
 *   z=0, 0.12 position lerp, 3s-idle 0.06 activity lerp) is defined ONCE and
 *   shared across every field, not duplicated five times — the five pulled
 *   sources define byte-identical `POINTER`/`updatePointer()` logic, so
 *   sharing one instance changes nothing about the behaviour, only the
 *   bookkeeping.
 * - `setPointer(x, y)`: `HeroScene.tsx` already supplies the same NDC sign
 *   convention the real sources compute from `window.mousemove`
 *   (`clientX/innerWidth*2-1`, Y flipped) — no conversion needed, since
 *   this scene's container is always the full viewport (`fixed inset-0`).
 * - Scroll progress reads this project's own shared whole-page scroll
 *   signal (`getScrollSignalSnapshot().progress`, Lenis-smoothed) instead
 *   of each pulled source's own raw `window.scrollY / maxScroll` —
 *   `HeroSceneHandle`'s `setScrollProgress` is scoped to the hero section's
 *   own trigger range via `useProgressTrigger`, which is meaningless for a
 *   `fixed inset-0` background whose container never actually scrolls; same
 *   precedent as `build-planet-scene.ts`'s own scroll choreography (ADR-0034).
 *   Damped with a single exponential smoothing (`+= (target - cur) *
 *   min(1, dt*4.5)`), matching that same file's convention, rather than the
 *   pulled sources' own double-lerp (built for their raw, unsmoothed
 *   `scrollY` reads).
 * - Tier-based DPR clamp and a `densityScale` (1 desktop, 0.4 tablet — the
 *   brief only states the desktop value) applied to every field's particle
 *   count, instead of the pulled sources' own flat `min(dpr, 2)` and fixed
 *   counts. Mobile never reaches this code at all — `HeroScene.tsx` skips
 *   mounting WebGL below the mobile breakpoint.
 * - `THREE.WebGLRenderer`/`PlaneGeometry`-family APIs are already current
 *   in the pulled sources (they target three@0.143 already using modern
 *   naming), so no forced rename was needed there.
 * - Starfield Close's "cyan/violet/bone" colours: the brief names hues, not
 *   hex values, for this one field (unlike every other field, which gives
 *   exact hex) — chosen as `#7fe0ff`/`#a78cff`/`#eafff2`, the violet reused
 *   from Spiral Network's own outer colour so the two starfields read as
 *   one family, the bone close to the real source's own `colorC` default.
 */
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { getDeviceTier, getTierBudget } from "@/lib/scene/device-tier";
import { getScrollSignalSnapshot } from "@/hooks/scroll/use-scroll-signal";
import type { HeroSceneHandle } from "./hero-scene-types";

const hexToVec3 = (hex: string): THREE.Vector3 => {
  const n = parseInt(hex.slice(1), 16);
  return new THREE.Vector3(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
};

/** Linear clamp ramp, per the brief's own `ramp(p, a, b)` calls. */
const ramp = (p: number, a: number, b: number): number => THREE.MathUtils.clamp((p - a) / (b - a), 0, 1);

// ---------------------------------------------------------------------------
// Shared field interface — every field owns its own geometry/material(s) but
// reads camera/cursor/activity from the composite instead of steering them.
// ---------------------------------------------------------------------------
interface Field {
  object: THREE.Object3D;
  dispose: () => void;
  setOpacity: (o: number) => void;
  update: (t: number, dt: number, cursor: THREE.Vector3, activity: number, camera: THREE.Camera) => void;
}

// ---------------------------------------------------------------------------
// AMBIENT STARFIELD — not a cataloged scene, built directly from the brief.
// ---------------------------------------------------------------------------
const buildAmbientStarfield = (densityScale: number): Field => {
  const count = Math.round(1200 * densityScale);
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const bone = new THREE.Color("#eafff2");
  const violet = new THREE.Color("#a78cff");
  const v = new THREE.Vector3();
  for (let i = 0; i < count; i++) {
    v.set(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1).normalize().multiplyScalar(60);
    positions[i * 3] = v.x;
    positions[i * 3 + 1] = v.y;
    positions[i * 3 + 2] = v.z;
    const c = Math.random() < 0.5 ? bone : violet;
    // ×2 brightness, baked into the vertex colour — safe under additive
    // blending, which never clamps before the GPU blend.
    colors[i * 3] = c.r * 2;
    colors[i * 3 + 1] = c.g * 2;
    colors[i * 3 + 2] = c.b * 2;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  const material = new THREE.PointsMaterial({
    size: 0.04,
    vertexColors: true,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });
  const points = new THREE.Points(geometry, material);
  let baseOpacity = 0.8;
  return {
    object: points,
    dispose: () => {
      geometry.dispose();
      material.dispose();
    },
    setOpacity: (o) => {
      baseOpacity = o;
    },
    update: (t) => {
      const appear = Math.min(1, t / 1.4);
      material.opacity = appear * baseOpacity;
    },
  };
};

// ---------------------------------------------------------------------------
// SPIRAL NETWORK — verbatim from `getlayers_materialize("spiral-network")`.
// ---------------------------------------------------------------------------
const SPIRAL_VERT = /* glsl */ `
  uniform float uTime; uniform vec3 uCamPos; uniform float uOpacity; uniform float uSize;
  uniform vec3 uCursor; uniform float uRepelRadius; uniform float uRepelStrength; uniform float uActivity;
  uniform vec3 uInner; uniform vec3 uOuter;
  attribute vec3 aRandom; attribute float aScale; attribute float aMix;
  varying vec3 vColor; varying float vAlpha;
  void main() {
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);
    float angle = atan(modelPosition.y, modelPosition.x);
    float vecLength = length(modelPosition.xy);
    float angleOffset = (1.0 / vecLength) * uTime;
    angle += angleOffset;
    modelPosition.x = cos(angle) * vecLength;
    modelPosition.z = sin(angle) * vecLength;
    modelPosition.y += tan(angle) * dot(normalize(uCamPos), vec3(0.0, 0.0, 1.0));
    modelPosition.xyz += aRandom;

    vec3 toParticle = modelPosition.xyz - uCursor;
    float dist = length(toParticle);
    float falloff = smoothstep(uRepelRadius, 0.0, dist);
    modelPosition.xyz += normalize(toParticle + vec3(0.0001)) * falloff * uRepelStrength * uActivity;

    vec4 mvPosition = viewMatrix * modelPosition;
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = uSize * aScale;
    gl_PointSize *= (1.0 / -mvPosition.z);

    vColor = mix(uInner, uOuter, aMix);
    vAlpha = uOpacity;
  }
`;
const SPIRAL_FRAG = /* glsl */ `
  uniform float uBrightness;
  varying vec3 vColor; varying float vAlpha;
  void main() {
    float strength = 1.0 - distance(gl_PointCoord, vec2(0.5));
    strength = step(0.5, strength);
    vec3 color = mix(vec3(0.0), vColor, strength);
    gl_FragColor = vec4(color * uBrightness, strength * vAlpha);
  }
`;

interface SpiralOptions {
  densityScale: number;
  inner: string;
  outer: string;
  pointSize: number;
  spin: number;
}

const buildSpiralNetwork = (opts: SpiralOptions): Field => {
  const count = Math.round(80000 * opts.densityScale);
  const radius = 5;
  const branches = 2;
  const positions = new Float32Array(count * 3);
  const randomness = new Float32Array(count * 3);
  const scales = new Float32Array(count);
  const mixv = new Float32Array(count);
  const randomnessFactor = 0.777;
  const randomnessPower = 2;
  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    const t = ((i % branches) / branches) * Math.PI * 2;
    const r = Math.random() * radius;
    positions[i3] = Math.cos(t + Math.PI * 0.5) * r;
    positions[i3 + 1] = Math.sin(t + Math.PI * 0.5) * r;
    positions[i3 + 2] = 0;
    for (let j = 0; j < 3; j++) {
      randomness[i3 + j] = Math.pow(Math.random(), randomnessPower) * (Math.random() < 0.5 ? -1 : 1) * randomnessFactor * r;
    }
    mixv[i] = r / radius;
    scales[i] = Math.random();
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("aRandom", new THREE.Float32BufferAttribute(randomness, 3));
  geometry.setAttribute("aScale", new THREE.Float32BufferAttribute(scales, 1));
  geometry.setAttribute("aMix", new THREE.Float32BufferAttribute(mixv, 1));

  const uniforms = {
    uTime: { value: 0 },
    uCamPos: { value: new THREE.Vector3() },
    uOpacity: { value: 0 },
    uCursor: { value: new THREE.Vector3() },
    uRepelRadius: { value: 1.6 },
    uRepelStrength: { value: 1.0 },
    uActivity: { value: 0 },
    uInner: { value: hexToVec3(opts.inner) },
    uOuter: { value: hexToVec3(opts.outer) },
    uBrightness: { value: 1.4 },
    uSize: { value: opts.pointSize },
  };
  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: SPIRAL_VERT,
    fragmentShader: SPIRAL_FRAG,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const group = new THREE.Group();
  group.rotation.x = -0.35;
  group.add(new THREE.Points(geometry, material));

  return {
    object: group,
    dispose: () => {
      geometry.dispose();
      material.dispose();
    },
    setOpacity: (o) => {
      uniforms.uOpacity.value = o;
    },
    update: (t, dt, cursor, activity, camera) => {
      uniforms.uTime.value = t;
      uniforms.uCamPos.value.copy(camera.position);
      uniforms.uCursor.value.copy(cursor);
      uniforms.uActivity.value = activity;
      group.rotation.y += dt * opts.spin;
    },
  };
};

// ---------------------------------------------------------------------------
// MOLECULE — verbatim from `getlayers_materialize("molecule")`.
// ---------------------------------------------------------------------------
const MOLECULE_VERT = /* glsl */ `
  uniform float uTime; uniform float uSize; uniform float uWobble;
  uniform vec3 uCursor; uniform float uRepelRadius; uniform float uRepelStrength; uniform float uActivity;
  uniform vec3 uAtomInner; uniform vec3 uAtomOuter; uniform vec3 uBond;
  attribute float aScale; attribute float aMix; attribute float aIsBond;
  varying vec3 vColor;
  void main() {
    float wt = uTime + aScale * 12.566;
    vec3 wobble = vec3(sin(wt * 1.4), cos(wt * 1.6), sin(wt * 1.2 + 1.57)) * uWobble;
    vec3 base = position + wobble;

    vec4 modelPosition = modelMatrix * vec4(base, 1.0);

    vec3 toParticle = modelPosition.xyz - uCursor;
    float d = length(toParticle);
    float falloff = smoothstep(uRepelRadius, 0.0, d);
    modelPosition.xyz += normalize(toParticle + vec3(0.0001)) * falloff * uRepelStrength * uActivity;

    vec4 viewPosition = viewMatrix * modelPosition;
    gl_Position = projectionMatrix * viewPosition;
    gl_PointSize = uSize * aScale;
    gl_PointSize *= (1.0 / -viewPosition.z);

    vColor = aIsBond > 0.5 ? uBond : mix(uAtomInner, uAtomOuter, aMix);
  }
`;
const MOLECULE_FRAG = /* glsl */ `
  uniform float uOpacity; uniform float uBrightness;
  varying vec3 vColor;
  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv);
    if (d > 0.5) discard;
    float strength = pow(1.0 - d * 2.0, 4.5);
    vec3 color = mix(vec3(0.0), vColor, strength);
    gl_FragColor = vec4(color * uBrightness, strength * uOpacity);
  }
`;

const PHI = (1 + Math.sqrt(5)) / 2;
const RAW_ATOMS: [number, number, number][] = [
  [0, 1, PHI], [0, -1, PHI], [0, 1, -PHI], [0, -1, -PHI],
  [1, PHI, 0], [-1, PHI, 0], [1, -PHI, 0], [-1, -PHI, 0],
  [PHI, 0, 1], [-PHI, 0, 1], [PHI, 0, -1], [-PHI, 0, -1],
];
const ATOM_CLUSTER_RADIUS = 0.32;
const BOND_TUBE_RADIUS = 0.025;
const dist3 = (a: [number, number, number], b: [number, number, number]): number => {
  const dx = a[0] - b[0], dy = a[1] - b[1], dz = a[2] - b[2];
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
};

interface MoleculeOptions {
  densityScale: number;
  atomInner: string;
  atomOuter: string;
  bondColor: string;
}

const buildMolecule = (opts: MoleculeOptions): Field => {
  const radius = 3.0;
  const atomParticles = Math.round(600 * opts.densityScale);
  const bondParticles = Math.round(60 * opts.densityScale);
  const atoms = RAW_ATOMS.map(([x, y, z]) => {
    const len = Math.sqrt(x * x + y * y + z * z);
    return [(x / len) * radius, (y / len) * radius, (z / len) * radius] as [number, number, number];
  });
  let minEdge = Infinity;
  for (let i = 0; i < atoms.length; i++)
    for (let j = i + 1; j < atoms.length; j++) {
      const d = dist3(atoms[i], atoms[j]);
      if (d < minEdge) minEdge = d;
    }
  const bonds: [number, number][] = [];
  const epsilon = minEdge * 0.05;
  for (let i = 0; i < atoms.length; i++)
    for (let j = i + 1; j < atoms.length; j++)
      if (dist3(atoms[i], atoms[j]) <= minEdge + epsilon) bonds.push([i, j]);

  const total = atoms.length * atomParticles + bonds.length * bondParticles;
  const positions = new Float32Array(total * 3);
  const scales = new Float32Array(total);
  const mixv = new Float32Array(total);
  const isBond = new Float32Array(total);
  const TAU = Math.PI * 2;
  let cursor = 0;
  const write = (x: number, y: number, z: number, scale: number, mix: number, bond: number) => {
    const i3 = cursor * 3;
    positions[i3] = x; positions[i3 + 1] = y; positions[i3 + 2] = z;
    scales[cursor] = scale; mixv[cursor] = mix; isBond[cursor] = bond;
    cursor++;
  };
  for (let a = 0; a < atoms.length; a++) {
    const [ax, ay, az] = atoms[a];
    for (let i = 0; i < atomParticles; i++) {
      let u, v, s;
      do { u = Math.random() * 2 - 1; v = Math.random() * 2 - 1; s = u * u + v * v; } while (s >= 1 || s === 0);
      const factor = 2 * Math.sqrt(1 - s);
      const dx = u * factor, dy = v * factor, dz = 1 - 2 * s;
      const localR = ATOM_CLUSTER_RADIUS * (0.55 + Math.pow(Math.random(), 0.7) * 0.45);
      write(ax + dx * localR, ay + dy * localR, az + dz * localR, 0.55 + Math.random() * 0.8, localR / ATOM_CLUSTER_RADIUS, 0);
    }
  }
  for (let b = 0; b < bonds.length; b++) {
    const [iA, iB] = bonds[b];
    const a = atoms[iA], c = atoms[iB];
    for (let i = 0; i < bondParticles; i++) {
      const t = 0.1 + Math.random() * 0.8;
      const cx = a[0] + (c[0] - a[0]) * t;
      const cy = a[1] + (c[1] - a[1]) * t;
      const cz = a[2] + (c[2] - a[2]) * t;
      const phi = Math.random() * TAU;
      const r = Math.random() * BOND_TUBE_RADIUS;
      write(cx + Math.cos(phi) * r, cy + Math.sin(phi) * r * 0.4, cz + Math.sin(phi) * r, 0.28 + Math.random() * 0.2, 0, 1);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("aScale", new THREE.Float32BufferAttribute(scales, 1));
  geometry.setAttribute("aMix", new THREE.Float32BufferAttribute(mixv, 1));
  geometry.setAttribute("aIsBond", new THREE.Float32BufferAttribute(isBond, 1));

  const uniforms = {
    uTime: { value: 0 },
    uSize: { value: 80 },
    uOpacity: { value: 0 },
    uWobble: { value: 0.04 },
    uCursor: { value: new THREE.Vector3() },
    uRepelRadius: { value: 5 },
    uRepelStrength: { value: 0.8 },
    uActivity: { value: 0 },
    uAtomInner: { value: hexToVec3(opts.atomInner) },
    uAtomOuter: { value: hexToVec3(opts.atomOuter) },
    uBond: { value: hexToVec3(opts.bondColor) },
    uBrightness: { value: 2.7 },
  };
  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: MOLECULE_VERT,
    fragmentShader: MOLECULE_FRAG,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const group = new THREE.Group();
  group.add(new THREE.Points(geometry, material));

  return {
    object: group,
    dispose: () => {
      geometry.dispose();
      material.dispose();
    },
    setOpacity: (o) => {
      uniforms.uOpacity.value = o;
    },
    update: (t, dt, cursor2, activity) => {
      uniforms.uTime.value = t;
      uniforms.uCursor.value.copy(cursor2);
      uniforms.uActivity.value = activity;
      group.rotation.y = t * 0.18;
      group.rotation.x = Math.sin(t * 0.45) * 0.06;
    },
  };
};

// ---------------------------------------------------------------------------
// RED STORM — verbatim from `getlayers_materialize("storm")`.
// ---------------------------------------------------------------------------
const STORM_VERT = /* glsl */ `
  uniform float uTime; uniform float uSize; uniform float uBlowUp;
  uniform vec3 uCursor; uniform float uRepelRadius; uniform float uRepelStrength; uniform float uActivity;
  uniform vec3 uCore; uniform vec3 uMid; uniform vec3 uRim;
  attribute float aScale; attribute float aNoise; attribute float aRadialPush; attribute float aMix;
  varying vec3 vColor; varying float vBlowUp;
  void main() {
    vec3 pos = position;

    float t = uTime * 1.4 + aNoise * 6.2831;
    float wobble = sin(t) * 0.1 * aRadialPush;
    pos *= 1.0 + wobble;

    float swirlAngle = uTime * 0.05 + aNoise * 6.2831;
    mat2 swirl = mat2(cos(swirlAngle), -sin(swirlAngle), sin(swirlAngle), cos(swirlAngle));
    pos.xz = swirl * pos.xz;

    vec3 outward = normalize(pos + vec3(0.0001));
    float blow = uBlowUp * uBlowUp;
    pos += outward * blow * (10.0 + aNoise * 18.0) * aRadialPush;

    vec4 modelPosition = modelMatrix * vec4(pos, 1.0);

    vec3 toParticle = modelPosition.xyz - uCursor;
    float dist = length(toParticle);
    float falloff = smoothstep(uRepelRadius, 0.0, dist);
    modelPosition.xyz += normalize(toParticle + vec3(0.0001)) * falloff * uRepelStrength * uActivity;

    vec4 viewPosition = viewMatrix * modelPosition;
    gl_Position = projectionMatrix * viewPosition;
    gl_PointSize = uSize * aScale;
    gl_PointSize *= (1.0 / -viewPosition.z);

    float t1 = smoothstep(0.25, 0.85, aMix);
    vec3 mix1 = mix(uCore, uMid, t1);
    float t2 = clamp((aMix - 0.7) * 3.0, 0.0, 1.0);
    vColor = mix(mix1, uRim, t2);
    vBlowUp = uBlowUp;
  }
`;
const STORM_FRAG = /* glsl */ `
  uniform float uOpacity; uniform float uBrightness;
  varying vec3 vColor; varying float vBlowUp;
  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv);
    if (d > 0.5) discard;
    float strength = pow(1.0 - d * 2.0, 4.5);
    vec3 color = mix(vec3(0.0), vColor, strength);
    float blowFade = 1.0 - smoothstep(0.15, 1.0, vBlowUp);
    gl_FragColor = vec4(color * uBrightness, strength * uOpacity * blowFade);
  }
`;

interface StormOptions {
  densityScale: number;
  core: string;
  mid: string;
  rim: string;
  pointSize: number;
}

interface StormField extends Field {
  setBlowUp: (v: number) => void;
}

const buildRedStorm = (opts: StormOptions): StormField => {
  const count = Math.round(50000 * opts.densityScale);
  const radius = 2.5;
  const positions = new Float32Array(count * 3);
  const scales = new Float32Array(count);
  const noises = new Float32Array(count);
  const radialPush = new Float32Array(count);
  const mixv = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    let u, v, s;
    do { u = Math.random() * 2 - 1; v = Math.random() * 2 - 1; s = u * u + v * v; } while (s >= 1 || s === 0);
    const factor = 2 * Math.sqrt(1 - s);
    const dx = u * factor, dy = v * factor, dz = 1 - 2 * s;
    const rN = Math.pow(Math.random(), 0.4);
    const r = radius * (0.55 + rN * 0.45);
    positions[i3] = dx * r; positions[i3 + 1] = dy * r; positions[i3 + 2] = dz * r;
    mixv[i] = rN;
    scales[i] = 0.45 + Math.random() * 0.8;
    noises[i] = Math.random();
    radialPush[i] = 0.4 + rN * 1.1;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("aScale", new THREE.Float32BufferAttribute(scales, 1));
  geometry.setAttribute("aNoise", new THREE.Float32BufferAttribute(noises, 1));
  geometry.setAttribute("aRadialPush", new THREE.Float32BufferAttribute(radialPush, 1));
  geometry.setAttribute("aMix", new THREE.Float32BufferAttribute(mixv, 1));

  const uniforms = {
    uTime: { value: 0 },
    uSize: { value: opts.pointSize },
    uOpacity: { value: 0 },
    uBlowUp: { value: 0 },
    uCursor: { value: new THREE.Vector3() },
    uRepelRadius: { value: 1.4 },
    uRepelStrength: { value: 4 },
    uActivity: { value: 0 },
    uCore: { value: hexToVec3(opts.core) },
    uMid: { value: hexToVec3(opts.mid) },
    uRim: { value: hexToVec3(opts.rim) },
    uBrightness: { value: 1.6 },
  };
  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: STORM_VERT,
    fragmentShader: STORM_FRAG,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const group = new THREE.Group();
  group.add(new THREE.Points(geometry, material));

  return {
    object: group,
    dispose: () => {
      geometry.dispose();
      material.dispose();
    },
    setOpacity: (o) => {
      uniforms.uOpacity.value = o;
    },
    setBlowUp: (v) => {
      uniforms.uBlowUp.value = v;
    },
    update: (t, dt, cursor, activity) => {
      uniforms.uTime.value = t;
      uniforms.uCursor.value.copy(cursor);
      uniforms.uActivity.value = activity;
      group.rotation.y += dt * 0.03;
      group.rotation.x += dt * 0.03 * 0.33;
    },
  };
};

// ---------------------------------------------------------------------------
// HOURGLASS GALAXY — verbatim from `getlayers_materialize("hourglass-galaxy")`.
// ---------------------------------------------------------------------------
const HOURGLASS_VERT = /* glsl */ `
  uniform float uTime; uniform float uSize; uniform float uVortexDirection; uniform float uYOffset;
  uniform vec3 uCursor; uniform float uRepelRadius; uniform float uRepelStrength; uniform float uActivity;
  uniform vec3 uInside; uniform vec3 uOutside;
  attribute float aScale; attribute vec3 aRandomness; attribute float aMix;
  varying vec3 vColor;
  void main() {
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);
    float angle = atan(modelPosition.x, modelPosition.z);
    float distanceToCenter = length(modelPosition.xz);
    float angleOffset = (1.0 / max(distanceToCenter, 0.0001)) * uTime * 0.2 * uVortexDirection;
    angle += angleOffset;
    modelPosition.x = cos(angle) * distanceToCenter;
    modelPosition.z = sin(angle) * distanceToCenter;

    float pull = clamp(0.5 / max(distanceToCenter, 0.0001), 0.0, uYOffset);
    modelPosition.y = -pull * uVortexDirection + uYOffset * uVortexDirection;

    modelPosition.xyz += aRandomness;

    vec3 toParticle = modelPosition.xyz - uCursor;
    float dist = length(toParticle);
    float falloff = smoothstep(uRepelRadius, 0.0, dist);
    modelPosition.xyz += normalize(toParticle + vec3(0.0001)) * falloff * uRepelStrength * uActivity;

    vec4 viewPosition = viewMatrix * modelPosition;
    gl_Position = projectionMatrix * viewPosition;
    gl_PointSize = uSize * aScale;
    gl_PointSize *= (1.0 / -viewPosition.z);

    vColor = mix(uInside, uOutside, aMix);
  }
`;
const HOURGLASS_FRAG = /* glsl */ `
  uniform float uOpacity; uniform float uBrightness;
  varying vec3 vColor;
  void main() {
    vec2 newUv = gl_PointCoord - 0.5;
    float d = length(newUv);
    if (d > 0.5) discard;
    float strength = 1.0 - d;
    strength = pow(strength, 10.0);
    vec3 color = mix(vec3(0.0), vColor, strength);
    gl_FragColor = vec4(color * uBrightness, strength * uOpacity);
  }
`;

interface HourglassOptions {
  densityScale: number;
  inside: string;
  outside: string;
  pointSize: number;
}

const buildHourglassGalaxy = (opts: HourglassOptions): Field => {
  const count = Math.round(70000 * opts.densityScale);
  const radius = 2.5;
  const branches = 3;
  const yOffset = radius;
  const positions = new Float32Array(count * 3);
  const scales = new Float32Array(count);
  const randomness = new Float32Array(count * 3);
  const mixv = new Float32Array(count);
  const randomnessAmount = 0.5;
  const randomnessPower = 1;
  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    const r = Math.random() * radius;
    const branchAngle = ((i % branches) / branches) * Math.PI * 2;
    positions[i3] = Math.cos(branchAngle) * r;
    positions[i3 + 1] = 0;
    positions[i3 + 2] = Math.sin(branchAngle) * r;
    const radialDensity = Math.pow(Math.random(), randomnessPower) * randomnessAmount * r;
    const phi = Math.acos(1 - 2 * Math.random());
    const theta = Math.random() * Math.PI * 2;
    randomness[i3] = Math.sin(phi) * Math.cos(theta) * radialDensity;
    randomness[i3 + 1] = Math.sin(phi) * Math.sin(theta) * radialDensity;
    randomness[i3 + 2] = Math.cos(phi) * radialDensity;
    mixv[i] = r / radius;
    scales[i] = Math.random();
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("aScale", new THREE.Float32BufferAttribute(scales, 1));
  geometry.setAttribute("aRandomness", new THREE.Float32BufferAttribute(randomness, 3));
  geometry.setAttribute("aMix", new THREE.Float32BufferAttribute(mixv, 1));

  const group = new THREE.Group();
  const uniformSets: { uTime: { value: number }; uOpacity: { value: number }; uCursor: { value: THREE.Vector3 }; uActivity: { value: number } }[] = [];
  const materials: THREE.ShaderMaterial[] = [];
  for (const dir of [1, -1]) {
    const u = {
      uTime: { value: 0 },
      uSize: { value: opts.pointSize },
      uOpacity: { value: 0 },
      uVortexDirection: { value: dir },
      uYOffset: { value: yOffset },
      uCursor: { value: new THREE.Vector3() },
      uRepelRadius: { value: 5 },
      uRepelStrength: { value: 0.45 },
      uActivity: { value: 0 },
      uInside: { value: hexToVec3(opts.inside) },
      uOutside: { value: hexToVec3(opts.outside) },
      uBrightness: { value: 1.6 },
    };
    const mat = new THREE.ShaderMaterial({
      uniforms: u,
      vertexShader: HOURGLASS_VERT,
      fragmentShader: HOURGLASS_FRAG,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    group.add(new THREE.Points(geometry, mat));
    uniformSets.push(u);
    materials.push(mat);
  }

  return {
    object: group,
    dispose: () => {
      geometry.dispose();
      materials.forEach((m) => m.dispose());
    },
    setOpacity: (o) => {
      for (const u of uniformSets) u.uOpacity.value = o;
    },
    update: (t, dt, cursor, activity) => {
      for (const u of uniformSets) {
        u.uTime.value = t;
        u.uCursor.value.copy(cursor);
        u.uActivity.value = activity;
      }
      group.rotation.y += dt * 0.06;
    },
  };
};

// ---------------------------------------------------------------------------
// STARFIELD CLOSE — verbatim from `getlayers_materialize("starfield-close")`.
// Structural count (4200) kept from the real source; see file header.
// ---------------------------------------------------------------------------
const STARFIELD_CLOSE_VERT = /* glsl */ `
  uniform float uTime; uniform float uSize; uniform float uDrift; uniform float uDepth; uniform float uTwinkle;
  uniform vec3 uCursor; uniform float uRepelRadius; uniform float uRepelStrength; uniform float uActivity;
  uniform vec3 uColorA; uniform vec3 uColorB; uniform vec3 uColorC;
  attribute float aScale; attribute float aPhase; attribute float aPalette; attribute float aBright;
  varying vec3 vColor; varying float vTwinkle;
  void main() {
    vec3 pos = position;
    pos.z = mod(pos.z + uDrift + (uDepth * 0.5), uDepth) - (uDepth * 0.5);

    float tw = sin(uTime * 1.6 + aPhase * 6.2831);
    vTwinkle = (1.0 - uTwinkle) + uTwinkle * (0.55 + 0.45 * tw);

    vec4 modelPosition = modelMatrix * vec4(pos, 1.0);

    vec3 toParticle = modelPosition.xyz - uCursor;
    float dist = length(toParticle);
    float falloff = smoothstep(uRepelRadius, 0.0, dist);
    modelPosition.xyz += normalize(toParticle + vec3(0.0001)) * falloff * uRepelStrength * uActivity;

    vec4 viewPosition = viewMatrix * modelPosition;
    gl_Position = projectionMatrix * viewPosition;
    gl_PointSize = uSize * aScale;
    gl_PointSize *= (1.0 / -viewPosition.z);

    vec3 base = aPalette < 0.5 ? uColorA : (aPalette < 1.5 ? uColorB : uColorC);
    vColor = base * aBright;
  }
`;
const STARFIELD_CLOSE_FRAG = /* glsl */ `
  uniform float uOpacity; uniform float uBrightness;
  varying vec3 vColor; varying float vTwinkle;
  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv);
    if (d > 0.5) discard;
    float strength = pow(1.0 - d * 2.0, 4.0);
    vec3 color = mix(vec3(0.0), vColor, strength);
    gl_FragColor = vec4(color * uBrightness, strength * uOpacity * vTwinkle);
  }
`;

interface StarfieldCloseOptions {
  densityScale: number;
  colorA: string;
  colorB: string;
  colorC: string;
  pointSize: number;
}

const buildStarfieldClose = (opts: StarfieldCloseOptions): Field => {
  const count = Math.round(4200 * opts.densityScale);
  const depth = 30;
  const positions = new Float32Array(count * 3);
  const scales = new Float32Array(count);
  const phases = new Float32Array(count);
  const palette = new Float32Array(count);
  const bright = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    positions[i3] = (Math.random() - 0.5) * 24;
    positions[i3 + 1] = (Math.random() - 0.5) * 16;
    positions[i3 + 2] = (Math.random() - 0.5) * 30;
    palette[i] = Math.floor(Math.random() * 3);
    bright[i] = 0.7 + Math.random() * 0.6;
    scales[i] = 0.5 + Math.pow(Math.random(), 1.4) * 2.5;
    phases[i] = Math.random();
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("aScale", new THREE.Float32BufferAttribute(scales, 1));
  geometry.setAttribute("aPhase", new THREE.Float32BufferAttribute(phases, 1));
  geometry.setAttribute("aPalette", new THREE.Float32BufferAttribute(palette, 1));
  geometry.setAttribute("aBright", new THREE.Float32BufferAttribute(bright, 1));

  const uniforms = {
    uTime: { value: 0 },
    uSize: { value: opts.pointSize },
    uOpacity: { value: 0 },
    uDrift: { value: 0 },
    uDepth: { value: depth },
    uTwinkle: { value: 1 },
    uCursor: { value: new THREE.Vector3() },
    uRepelRadius: { value: 5 },
    uRepelStrength: { value: 0.35 },
    uActivity: { value: 0 },
    uColorA: { value: hexToVec3(opts.colorA) },
    uColorB: { value: hexToVec3(opts.colorB) },
    uColorC: { value: hexToVec3(opts.colorC) },
    uBrightness: { value: 1.85 },
  };
  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: STARFIELD_CLOSE_VERT,
    fragmentShader: STARFIELD_CLOSE_FRAG,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const group = new THREE.Group();
  group.add(new THREE.Points(geometry, material));

  return {
    object: group,
    dispose: () => {
      geometry.dispose();
      material.dispose();
    },
    setOpacity: (o) => {
      uniforms.uOpacity.value = o;
    },
    update: (t, dt, cursor, activity) => {
      uniforms.uTime.value = t;
      uniforms.uDrift.value += dt * 2.35;
      uniforms.uCursor.value.copy(cursor);
      uniforms.uActivity.value = activity;
      group.rotation.z += dt * 0.03;
    },
  };
};

// ---------------------------------------------------------------------------
// CAMERA FLIGHT — 7 scroll-progress anchors, per the brief.
// ---------------------------------------------------------------------------
interface CameraAnchor {
  p: number;
  pos: THREE.Vector3;
  look: THREE.Vector3;
}
const CAMERA_ANCHORS: CameraAnchor[] = [
  { p: 0.0, pos: new THREE.Vector3(0, 2.5, 5), look: new THREE.Vector3(0, 2.5, 0) },
  { p: 0.15, pos: new THREE.Vector3(3, 2, 6.5), look: new THREE.Vector3(0, 2, 0) },
  { p: 0.33, pos: new THREE.Vector3(0, 0, 9), look: new THREE.Vector3(0, 0, 1.8) },
  { p: 0.52, pos: new THREE.Vector3(0, 0, 9), look: new THREE.Vector3(0, 0, 4.0) },
  { p: 0.65, pos: new THREE.Vector3(0, 0, 8), look: new THREE.Vector3(0, -1.16, 2.3) },
  { p: 0.83, pos: new THREE.Vector3(0, 0, 7), look: new THREE.Vector3(0, 0, 0) },
  { p: 1.0, pos: new THREE.Vector3(0, 0, 5), look: new THREE.Vector3(0, 0, 0) },
];

const evaluateCameraFlight = (p: number, outPos: THREE.Vector3, outLook: THREE.Vector3): void => {
  let i = 0;
  while (i < CAMERA_ANCHORS.length - 2 && p > CAMERA_ANCHORS[i + 1].p) i++;
  const a = CAMERA_ANCHORS[i];
  const b = CAMERA_ANCHORS[i + 1];
  const span = b.p - a.p;
  const t = span > 0 ? THREE.MathUtils.clamp((p - a.p) / span, 0, 1) : 0;
  outPos.lerpVectors(a.pos, b.pos, t);
  outLook.lerpVectors(a.look, b.look, t);
};

// ---------------------------------------------------------------------------
// COMPOSITE SCENE
// ---------------------------------------------------------------------------
interface NegentropyOptions {
  mode: "hero" | "card";
  bloomStrength: number;
  bloomRadius: number;
  bloomThreshold: number;
}

const buildNegentropyScene = (container: HTMLElement, options: NegentropyOptions): HeroSceneHandle => {
  const { mode, bloomStrength, bloomRadius, bloomThreshold } = options;
  const canvas = document.createElement("canvas");
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: "high-performance" });
  const { clientWidth, clientHeight } = container;
  const { dprClamp } = getTierBudget(clientWidth || window.innerWidth);
  const pixelRatio = Math.min(window.devicePixelRatio, dprClamp, 2);
  renderer.setPixelRatio(pixelRatio);
  renderer.setSize(clientWidth || 1, clientHeight || 1);
  renderer.setClearColor(0x050608, 1);

  const densityScale = getDeviceTier(clientWidth || window.innerWidth) === "desktop" ? 1 : 0.4;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x050608);

  const camera = new THREE.PerspectiveCamera(70, (clientWidth || 1) / (clientHeight || 1), 0.1, 200);
  camera.position.set(0, 2.5, 5);

  const fields: Field[] = [];
  const ambient = buildAmbientStarfield(densityScale);
  scene.add(ambient.object);
  fields.push(ambient);

  const spiral = buildSpiralNetwork({
    densityScale,
    inner: mode === "card" ? "#0aff7f" : "#b3ffd6",
    outer: mode === "card" ? "#3affd0" : "#a78cff",
    pointSize: mode === "card" ? 10 : 8.0,
    spin: 0.86,
  });
  scene.add(spiral.object);
  fields.push(spiral);

  let molecule: Field | null = null;
  let storm: StormField | null = null;
  let hourglass: Field | null = null;
  let starfieldClose: Field | null = null;

  if (mode === "hero") {
    molecule = buildMolecule({ densityScale, atomInner: "#dcf7ff", atomOuter: "#4cb8ff", bondColor: "#808080" });
    scene.add(molecule.object);
    fields.push(molecule);

    storm = buildRedStorm({ densityScale, core: "#0aff7f", mid: "#3affd0", rim: "#caffff", pointSize: 38 });
    scene.add(storm.object);
    fields.push(storm);

    hourglass = buildHourglassGalaxy({ densityScale, inside: "#ff6030", outside: "#1b3984", pointSize: 22 });
    scene.add(hourglass.object);
    fields.push(hourglass);

    starfieldClose = buildStarfieldClose({ densityScale, colorA: "#7fe0ff", colorB: "#a78cff", colorC: "#eafff2", pointSize: 20 });
    scene.add(starfieldClose.object);
    fields.push(starfieldClose);
  }

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(clientWidth || 1, clientHeight || 1),
    bloomStrength,
    bloomRadius,
    bloomThreshold,
  );
  composer.addPass(bloomPass);
  composer.addPass(new OutputPass());

  // ---- shared cursor-void state (see file header) ----
  const pointerNdc = new THREE.Vector2(0, 0);
  const cursorWorld = new THREE.Vector3();
  const cursorTarget = new THREE.Vector3();
  let activity = 0;
  let lastMoveAt = performance.now();
  let hasPointer = false;
  const _ndc3 = new THREE.Vector3();
  const _dir = new THREE.Vector3();

  const setPointer = (x: number, y: number) => {
    pointerNdc.set(x, y);
    hasPointer = true;
    lastMoveAt = performance.now();
  };

  const mouseSmooth = { x: 0, y: 0 };
  let scrollCur = mode === "hero" ? 0 : -1;

  const anchorPos = new THREE.Vector3();
  const anchorLook = new THREE.Vector3();

  const applyCameraFlight = (p: number) => {
    evaluateCameraFlight(p, anchorPos, anchorLook);
    camera.position.set(
      anchorPos.x + mouseSmooth.x * 0.7,
      anchorPos.y + mouseSmooth.y * 0.45,
      anchorPos.z,
    );
    camera.lookAt(anchorLook);
  };

  const applyFieldOpacities = (p: number) => {
    spiral.setOpacity(mode === "card" ? 1 : 1 - ramp(p, 0.18, 0.32));
    if (starfieldClose) starfieldClose.setOpacity(ramp(p, 0.16, 0.28));
    if (molecule) molecule.setOpacity(ramp(p, 0.18, 0.35) * (1 - ramp(p, 0.52, 0.65)));
    if (storm) {
      storm.setOpacity(ramp(p, 0.52, 0.71));
      storm.setBlowUp(ramp(p, 0.83, 0.95));
    }
    if (hourglass) hourglass.setOpacity(ramp(p, 0.83, 0.95));
  };

  let lastElapsed = 0;

  const renderStatic = () => {
    applyFieldOpacities(mode === "hero" ? 0 : -1);
    if (mode === "hero") applyCameraFlight(0);
    for (const f of fields) f.update(0, 0, cursorWorld, 0, camera);
    composer.render();
  };

  const renderFrame = (elapsedSeconds: number) => {
    const dt = Math.min(0.05, Math.max(0, elapsedSeconds - lastElapsed));
    lastElapsed = elapsedSeconds;

    if (mode === "hero") {
      const pTarget = THREE.MathUtils.clamp(getScrollSignalSnapshot().progress, 0, 1);
      scrollCur += (pTarget - scrollCur) * Math.min(1, dt * 4.5);
      applyFieldOpacities(scrollCur);
      applyCameraFlight(scrollCur);
      scene.rotation.y = elapsedSeconds * 0.005;
      scene.rotation.x = ramp(scrollCur, 0, 1) * -0.15;
    }

    mouseSmooth.x += (pointerNdc.x - mouseSmooth.x) * 0.06;
    mouseSmooth.y += (pointerNdc.y - mouseSmooth.y) * 0.06;

    cursorTarget.set(0, 0, 0);
    if (hasPointer) {
      _ndc3.set(pointerNdc.x, pointerNdc.y, 0.5).unproject(camera);
      _dir.copy(_ndc3).sub(camera.position).normalize();
      const denom = _dir.z;
      if (Math.abs(denom) > 1e-4) {
        const t = -camera.position.z / denom;
        if (t > 0 && Number.isFinite(t)) cursorTarget.copy(camera.position).addScaledVector(_dir, t);
      }
    }
    cursorWorld.lerp(cursorTarget, 0.12);
    const idleSeconds = (performance.now() - lastMoveAt) / 1000;
    const wantActivity = hasPointer && idleSeconds < 3 ? 1 : 0;
    activity += (wantActivity - activity) * 0.06;

    for (const f of fields) f.update(elapsedSeconds, dt, cursorWorld, activity, camera);

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
  if (mode !== "hero") applyCameraFlight(0);

  const dispose = () => {
    for (const f of fields) {
      scene.remove(f.object);
      f.dispose();
    }
    composer.dispose();
    renderer.dispose();
  };

  return { renderStatic, renderFrame, resize, setPointer, dispose, canvas };
};

/** Full-bleed Stormwater & Flood Modelling service-page background — all
 * six fields, scroll-driven camera flight, the brief's own bloom
 * (0.55/1.8/0.02). */
export const createNegentropyHeroScene = (container: HTMLElement): HeroSceneHandle =>
  buildNegentropyScene(container, { mode: "hero", bloomStrength: 0.55, bloomRadius: 1.8, bloomThreshold: 0.02 });

/** Small, contained homepage-card version — Spiral Network alone (the
 * simplest, most performant field, per the brief), water/teal palette,
 * bloom toned down (0.4/1.0), static camera framing, no scroll dependency. */
export const createNegentropySpiralCardScene = (container: HTMLElement): HeroSceneHandle =>
  buildNegentropyScene(container, { mode: "card", bloomStrength: 0.4, bloomRadius: 1.0, bloomThreshold: 0.02 });
