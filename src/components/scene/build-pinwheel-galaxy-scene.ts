/**
 * Pinwheel Galaxy — GetLayers' "deep-emerald logarithmic spiral galaxy
 * whose arms wind as embers lift off the disc" scene (materialized
 * default variant is actually magenta/gold, not emerald — see below)
 * (`getlayers_search`/`getlayers_materialize`, id `pinwheel-galaxy`),
 * pulled as its portable single-HTML master and ported verbatim: the
 * arms/bulge/spark point clouds (stored in polar coordinates and
 * reinterpreted per-vertex for differential rotation — inner radii spin
 * faster, exactly the real thing's visual signature), the appear-in
 * slide/fade, the scroll-driven dive/spin-acceleration/expand/chaos, the
 * cursor NDC repulsion, the three-composer rig, and all six shaders (arms,
 * bulge, sparks, FinalPass, atmosphere motes — vertex+fragment each) are
 * copied character for character from the materialized source, cross-
 * checked against the brief's own numbers first — every one of them
 * (armCount 6, coreConcentration 1.15, armSpread 0.29, windingFactor 2.25,
 * arms/bulge/spark counts 120000/2500/5000, camera 45°/z=3, composer bloom
 * 0.22/0.2/0 + 0.38/0.55/0) matches exactly. Every non-colour number is
 * still verbatim.
 *
 * CONFIG colours were originally the scene's own "Default" variant —
 * magenta/gold/mint (`coreColor #ffd1f5`, `midColor #c026d3`, `rimColor
 * #1a0833`, `armAccent #33f59a`, `bulgeColor #ffb3ec`, `sparkColor
 * #ffe066`/`sparkColorTop #ff7ae0`), not the catalog description's
 * "deep-emerald" (that description matches the scene's own `-002` roll,
 * not its default). Explicitly re-tinted to this project's own dark-navy/
 * sky-blue family per client direction — see the CONFIG block below for
 * the current values and ADR-0070 in decisions-log.md. Tinting through
 * CONFIG rather than the shader is the same sanctioned re-skin path used
 * for every other materialized GetLayers asset in this codebase.
 *
 * Per `contract.notes` on the materialized asset: the differential
 * rotation accumulates a spin PHASE in JS (`spinPhase +=
 * spinSpeed*(1+scrollT*scrollSpin)*dt`), never a speed-scaled `iTime` —
 * rewriting it that way would make scroll changes jump the rotation
 * discontinuously. Preserved verbatim. Arms/bulge/sparks render
 * `ENTIRE_SCENE`-only (never `TORUS_SCENE`/`BLOOM_SCENE`) — same "no live
 * bloom path, torus/bloom composers render an empty scene" situation
 * already documented in `build-aurum-peak-scene.ts`/
 * `build-spiral-galaxy-scene.ts`, kept exactly as the source has it.
 *
 * Documented deviations only, all invisible to the rendered look or
 * forced by this project's actual dependency versions:
 * - `THREE.WebGLRenderer` instead of `THREE.WebGL1Renderer` (removed in
 *   three@0.185, installed here) — the same non-negotiable rename made in
 *   every other verbatim scene in this codebase.
 * - `renderer.shadowMap.enabled = true` / `THREE.VSMShadowMap` and
 *   `scene.fog` both kept verbatim (the source sets them) but are inert —
 *   nothing here casts/receives a shadow or reads a fog uniform, same
 *   "quiet by default" situation `build-spiral-galaxy-scene.ts` documents
 *   for its own identical settings.
 * - Tier-based DPR clamp instead of the source's flat
 *   `renderer.setPixelRatio(window.devicePixelRatio)`.
 * - The render loop is `HeroScene.tsx`'s own rAF
 *   (`renderFrame(elapsedSeconds)`) instead of the source's two
 *   freestanding ones (the main `render()` loop AND a second,
 *   independent `appearIn()` rAF loop using its own `performance.now()`
 *   deltas) — folded into one, with the appear-slide/opacity/`iAnimate`
 *   math driven directly off `elapsedSeconds * 1000` each frame instead
 *   of a separate loop, same idiom every other scene here uses for its
 *   own intro timing.
 * - **Scroll driver**: the source tracks `window.scrollY` itself; this
 *   project already has a shared, Lenis-bridged whole-page scroll signal
 *   (`getScrollSignalSnapshot().progress`) that
 *   `build-spiral-galaxy-scene.ts`/`build-negentropy-scene.ts`/
 *   `build-planet-scene.ts` already read instead of a redundant listener
 *   — same substitution here, keeping the source's own single-stage
 *   `scrollCurrent` lerp damping (`Lerp(scrollCurrent, scrollTarget,
 *   0.08)`, unchanged).
 * - Interaction is window-level in the source itself
 *   (`window.addEventListener('mousemove', ...)`, tracked in raw CSS
 *   pixel coordinates and converted to NDC via `canvas.clientWidth/
 *   clientHeight` in `getScenePointer()`) — matching this project's own
 *   established pattern with zero adaptation needed, since this canvas is
 *   always `pointer-events-none`. `setPointer` is therefore an
 *   intentional no-op.
 * - No card variant exported — the request only asked for the
 *   `/about` page's fixed full-page background, not a homepage-card use.
 */
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { GammaCorrectionShader } from "three/examples/jsm/shaders/GammaCorrectionShader.js";
import { CopyShader } from "three/examples/jsm/shaders/CopyShader.js";
import { getScrollSignalSnapshot } from "@/hooks/scroll/use-scroll-signal";
import { getTierBudget } from "@/lib/scene/device-tier";
import type { HeroSceneHandle } from "./hero-scene-types";

// Re-tinted from the materialized source's "Default" (magenta/gold/mint)
// palette to this project's own dark-navy/sky-blue family — CONFIG colour
// is exactly the sanctioned re-skin surface for a verbatim GetLayers scene
// ("tint through CONFIG, never the shader"), same precedent as retinting
// any other materialized asset to match a site's palette. Explicit request:
// the purple/pink "galaxy explosion" read as off-brand and needed to become
// the same subtle dark-space look used everywhere else on the site
// (`--raw-color-navy-925`/`-950` dark navy, `--raw-color-azure-600`/
// `-sky-300` accents — see globals.css). Every non-colour number (counts,
// spread, decay, bloom strengths, scroll response) is untouched — see
// ADR-0070 in decisions-log.md.
const CONFIG = {
  atmoColor: "#8ecbff",
  atmoCount: 200,
  atmoSize: 22,
  atmoSpeed: 0.8,
  coreColor: "#bcd9ff",
  midColor: "#1f6ae0",
  rimColor: "#040d1a",
  armAccent: "#5a9bd8",
  bulgeColor: "#9fc4ff",
  armCount: 6,
  coreConcentration: 1.15,
  armSpread: 0.29,
  windingFactor: 2.25,
  spinSpeed: 0.06,
  coreSoftening: 0.02,
  gradientPow: 0.8,
  shimmerSpeed: 1,
  shimmerAmount: 0.35,
  pointerRadius: 0.35,
  pointerStrength: 0.5,
  scrollDiveZ: 3.5,
  scrollSpin: 4,
  scrollExpand: 0.4,
  scrollChaos: 0.5,
  sparkColor: "#cfe0ff",
  sparkColorTop: "#8ecbff",
  sparkCount: 5000,
  sparkRise: 0.17,
  sparkSpeed: 0.22,
  sparkSize: 33,
  cornerBlue: "#040d1a",
  cornerOrange: "#081428",
};

const LAYERS = { NONE: 0, TORUS_SCENE: 1, BLOOM_SCENE: 2, ENTIRE_SCENE: 3 };
const ARMS_COUNT = 120000;
const BULGE_COUNT = 2500;
const GALAXY_R = 1.9;
const GALAXY_H = 0.12;
const BASE_CAMERA_Z = 3;

const hexToVec3 = (hex: string): THREE.Vector3 => {
  const n = parseInt(hex.slice(1), 16);
  return new THREE.Vector3(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
};
const lerp = (a: number, b: number, t = 0.075): number => a + (b - a) * t;

// ---------------------------------------------------------------------------
// Shaders — verbatim from the materialized source.
// ---------------------------------------------------------------------------
const ARMS_VERT = /* glsl */ `
  attribute float size; attribute float id;
  uniform float iTime; uniform float iAnimate; uniform float uExpand;
  uniform vec2 iMouse; uniform float uSpinPhase; uniform float uWinding;
  uniform float uCoreSoftening; uniform float uChaos; uniform float uR;
  uniform float uAspect; uniform float uPointerRadius; uniform float uPointerStrength;
  varying float vR; varying float vAngle;
  void main() {
    float r = position.x;
    float h = position.y;
    float baseAngle = position.z;
    float ang = baseAngle + uWinding * r + uSpinPhase / (r + uCoreSoftening);
    float rr = r * uExpand;
    vec3 p = vec3(rr * cos(ang), h, rr * sin(ang));
    vec3 jitter = vec3(
      fract(sin(id * 12.9898) * 43758.5453) - 0.5,
      fract(sin(id * 78.233 ) * 12345.6789) - 0.5,
      fract(sin(id * 39.123 ) * 65432.1234) - 0.5
    );
    p += jitter * uChaos;
    vR = clamp(r / uR, 0.0, 1.0);
    vAngle = ang;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_PointSize = size / -mv.z * (0.5 + 0.5 * iAnimate);
    vec4 res = projectionMatrix * mv;
    vec2 ndc = res.xy / res.w;
    vec2 diff = ndc - iMouse;
    float pdist = length(diff * vec2(uAspect, 1.0));
    float f = clamp(uPointerRadius - pdist, 0.0, 1.0);
    vec2 dir = length(diff) > 1e-4 ? normalize(diff) : vec2(0.0);
    res.xy += dir * (f * f * uPointerStrength) * res.w;
    float a = pow(iAnimate, 0.6);
    res.xy *= clamp(2.0 * a + pow(id, 0.7) - 1.0, 0.0, 1.0);
    gl_Position = res;
  }`;

const ARMS_FRAG = /* glsl */ `
  uniform float iTime; uniform float uOpacity;
  uniform vec3 uCore; uniform vec3 uMid; uniform vec3 uRim; uniform vec3 uAccent;
  uniform float uGradientPow; uniform float uShimmerSpeed; uniform float uShimmerAmount;
  uniform float uArmCount;
  varying float vR; varying float vAngle;
  vec3 grad3(vec3 a, vec3 b, vec3 c, float t) {
    return t < 0.5 ? mix(a, b, t * 2.0) : mix(b, c, clamp((t - 0.5) * 2.0, 0.0, 1.0));
  }
  void main() {
    float t = pow(vR, uGradientPow);
    vec3 col = grad3(uCore, uMid, uRim, t);
    float sh = 0.5 + 0.5 * sin(vAngle * uArmCount - iTime * uShimmerSpeed);
    col = mix(col, uAccent, sh * uShimmerAmount * (1.0 - t));
    col *= (0.45 + 0.7 * (1.0 - t));
    float tex = 1.0 - smoothstep(0.5, 1.0, length(2.0 * gl_PointCoord - 1.0));
    gl_FragColor = vec4(col * tex, tex * uOpacity);
  }`;

const BULGE_VERT = /* glsl */ `
  attribute float size; attribute float id;
  uniform float iTime; uniform float iAnimate; uniform float uExpand;
  uniform vec2 iMouse; uniform float uAspect; uniform float uPointerRadius; uniform float uPointerStrength;
  varying float vId;
  void main() {
    vId = id;
    vec3 p = position * uExpand;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_PointSize = size / -mv.z * (0.8 + 0.2 * sin(iTime * (1.0 + id) * 2.0)) * (0.5 + 0.5 * iAnimate);
    vec4 res = projectionMatrix * mv;
    float a = pow(iAnimate, 0.9);
    res.xy *= clamp(2.0 * a + pow(id, 0.7) - 1.0, 0.0, 1.0);
    vec2 pndc = res.xy / res.w;
    vec2 pdiff = pndc - iMouse;
    float pdist = length(pdiff * vec2(uAspect, 1.0));
    float pf = clamp(uPointerRadius - pdist, 0.0, 1.0);
    vec2 pdir = length(pdiff) > 1e-4 ? normalize(pdiff) : vec2(0.0);
    res.xy += pdir * (pf * pf * uPointerStrength) * res.w;
    gl_Position = res;
  }`;

const BULGE_FRAG = /* glsl */ `
  uniform float uOpacity; uniform vec3 uCore; varying float vId;
  void main() {
    float tex = 1.0 - smoothstep(0.2, 1.0, length(2.0 * gl_PointCoord - 1.0));
    gl_FragColor = vec4(uCore * tex * 0.7, tex * (0.5 + 0.5 * vId) * uOpacity);
  }`;

const SPARKS_VERT = /* glsl */ `
  attribute float size; attribute float speed;
  uniform float iTime; uniform float iAnimate; uniform float uExpand;
  uniform float uSpinPhase; uniform float uWinding; uniform float uCoreSoftening;
  uniform float uSparkRise; uniform float uSparkSpeed; uniform float uSparkSize;
  uniform vec2 iMouse; uniform float uAspect; uniform float uPointerRadius; uniform float uPointerStrength;
  varying float vLife;
  void main() {
    float r = position.x;
    float baseAngle = position.y;
    float seed = position.z;
    float ang = baseAngle + uWinding * r + uSpinPhase / (r + uCoreSoftening);
    float rr = r * uExpand;
    float life = fract(iTime * uSparkSpeed * speed + seed);
    vLife = life;
    float rise = life * uSparkRise;
    vec3 p = vec3(rr * cos(ang), rise, rr * sin(ang));
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_PointSize = size * uSparkSize / -mv.z * (1.0 - 0.55 * life) * (0.4 + 0.6 * iAnimate);
    vec4 res = projectionMatrix * mv;
    vec2 pndc = res.xy / res.w;
    vec2 pdiff = pndc - iMouse;
    float pdist = length(pdiff * vec2(uAspect, 1.0));
    float pf = clamp(uPointerRadius - pdist, 0.0, 1.0);
    vec2 pdir = length(pdiff) > 1e-4 ? normalize(pdiff) : vec2(0.0);
    res.xy += pdir * (pf * pf * uPointerStrength) * res.w;
    gl_Position = res;
  }`;

const SPARKS_FRAG = /* glsl */ `
  uniform float uOpacity; uniform vec3 uSpark; uniform vec3 uSparkTop;
  varying float vLife;
  void main() {
    vec3 col = mix(uSpark, uSparkTop, smoothstep(0.0, 0.9, vLife));
    float fade = sin(clamp(vLife, 0.0, 1.0) * 3.14159265);
    float tex = 1.0 - smoothstep(0.15, 1.0, length(2.0 * gl_PointCoord - 1.0));
    gl_FragColor = vec4(col * tex, tex * fade * uOpacity);
  }`;

const ATMO_VERT = /* glsl */ `
  attribute float size; attribute float seed; uniform float uTime; uniform vec2 uRes;
  varying float vA;
  vec3 warp(vec3 p, float t){ float c=0.9,a=1.9,b=0.02,s=0.05; p*=2.;
    p.x+=c*sin(s*t+a*p.y)+t*b; p.y+=c*cos(s*t+a*p.x); p.y+=c*sin(s*t+a*p.z)+t*b;
    p.z+=c*cos(s*t+a*p.y); p.z+=c*sin(s*t+a*p.x)+t*b; p.x+=c*cos(s*t+a*p.z);
    return cos(p+vec3(1,2,4)); }
  void main(){
    vec3 v = position*4.0 + warp(position, uTime)*1.2;
    vec4 mv = modelViewMatrix * vec4(v, 1.0);
    float r = length(v); float farF = 1.0 - smoothstep(5.0, 6.5, r); float nearF = smoothstep(0.0, 0.5, -mv.z);
    vA = farF * nearF;
    gl_PointSize = size * uRes.y / 900.0 / -mv.z; gl_PointSize = max(gl_PointSize, 1.0);
    gl_Position = projectionMatrix * mv;
  }`;

const ATMO_FRAG = /* glsl */ `
  uniform vec3 uColor; varying float vA;
  void main(){ vec2 p = gl_PointCoord - 0.5; float l = length(p); if (l > 0.5) discard;
    float tex = smoothstep(0.5, 0.0, l); gl_FragColor = vec4(uColor * tex, tex * vA * 0.55); }`;

const FinalPass = {
  uniforms: {
    iTime: { value: 0 },
    tDiffuse: { value: null as THREE.Texture | null },
    torusTexture: { value: null as THREE.Texture | null },
    bloomTexture: { value: null as THREE.Texture | null },
    haloTexture: { value: null as THREE.Texture | null },
    iCornerBlue: { value: hexToVec3(CONFIG.cornerBlue) },
    iCornerOrange: { value: hexToVec3(CONFIG.cornerOrange) },
  },
  vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position, 1.0); }`,
  fragmentShader: /* glsl */ `
    uniform float iTime; uniform sampler2D tDiffuse; uniform sampler2D bloomTexture; uniform sampler2D torusTexture; uniform sampler2D haloTexture;
    uniform vec3 iCornerBlue; uniform vec3 iCornerOrange; varying vec2 vUv;
    vec3 warp3d(vec3 pos, float t) {
      float curv = .8, a = 1.9, b = 0.7; pos *= 2.;
      pos.x += curv * sin(t + a * pos.y) + t * b; pos.y += curv * cos(t + a * pos.x);
      pos.y += curv * sin(t + a * pos.z) + t * b; pos.z += curv * cos(t + a * pos.y);
      pos.z += curv * sin(t + a * pos.x) + t * b; pos.x += curv * cos(t + a * pos.z);
      return 0.5 + 0.5 * cos(pos.xyz + vec3(1, 2, 4));
    }
    void main() {
      vec2 uv = 2. * vUv - 1.;
      vec3 w = pow(warp3d(vec3(uv.x, sin(uv.y), uv.y), iTime * 1.5), vec3(1.5));
      vec3 col = 1.5 * iCornerBlue * w.x; col *= w.y; col += iCornerOrange * w.z;
      col *= smoothstep(0.6, 1., abs(uv.y));
      col *= smoothstep(-.5, 1., -uv.y * uv.x); col *= smoothstep(-.5, 1., -uv.y * uv.x);
      vec3 halo = texture2D(haloTexture, vUv).xyz;
      vec3 atmoBg = vec3(0.06, 0.02, 0.10) * (1.0 - 0.4 * length(uv));
      gl_FragColor = vec4(atmoBg + col * 0.2 + texture2D(bloomTexture, vUv).xyz + texture2D(torusTexture, vUv).xyz + texture2D(tDiffuse, vUv).xyz + halo, 1.);
    }`,
};

const buildPinwheelGalaxyScene = (container: HTMLElement): HeroSceneHandle => {
  const canvas = document.createElement("canvas");
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  const { clientWidth, clientHeight } = container;
  const { dprClamp } = getTierBudget(clientWidth || window.innerWidth);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, dprClamp));
  renderer.setSize(clientWidth || 1, clientHeight || 1);
  // Kept verbatim per the source; inert — see file header.
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.VSMShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);
  scene.fog = new THREE.Fog(0x000000, 0, 15); // inert — see file header
  const camera = new THREE.PerspectiveCamera(45, (clientWidth || 1) / (clientHeight || 1), 0.1, 80);
  camera.position.set(0, 0, BASE_CAMERA_Z);
  camera.layers.enable(LAYERS.TORUS_SCENE);
  camera.layers.enable(LAYERS.BLOOM_SCENE);
  camera.layers.enable(LAYERS.ENTIRE_SCENE);
  scene.add(camera);

  // ---- composer (3-composer selective bloom — see file header) ----
  const renderScene = new RenderPass(scene, camera);
  const torusComposer = new EffectComposer(renderer);
  torusComposer.renderToScreen = false;
  torusComposer.addPass(renderScene);
  torusComposer.addPass(new ShaderPass(GammaCorrectionShader));
  torusComposer.addPass(
    new UnrealBloomPass(new THREE.Vector2(clientWidth || 1, clientHeight || 1), 0.22, 0.2, 0),
  );
  torusComposer.addPass(new ShaderPass(CopyShader));

  const bloomComposer = new EffectComposer(renderer);
  bloomComposer.renderToScreen = false;
  bloomComposer.addPass(renderScene);
  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(clientWidth || 1, clientHeight || 1),
    0.38,
    0.55,
    0,
  );
  bloomComposer.addPass(bloomPass);
  bloomComposer.addPass(new ShaderPass(GammaCorrectionShader));

  const finalPass = new ShaderPass(FinalPass);
  finalPass.uniforms.bloomTexture.value = bloomComposer.renderTarget1.texture;
  finalPass.uniforms.torusTexture.value = torusComposer.renderTarget1.texture;
  const finalComposer = new EffectComposer(renderer);
  finalComposer.addPass(renderScene);
  finalComposer.addPass(finalPass);

  // ---- shared "common" uniforms (iTime/iAnimate/uOpacity/uExpand) ----
  const common = {
    iTime: { value: 0 },
    iAnimate: { value: 0 },
    uOpacity: { value: 1 },
    uExpand: { value: 1 },
  };
  const mouseCurrent = { x: 0, y: 0, z: 0 };

  // ---- galaxy group (starts hidden at z=-20, slides in — see appear logic below) ----
  const instance = new THREE.Group();
  instance.position.set(0, 0, -20);
  const PARTICLE_POSITION: [number, number, number] = [0, 0, -0.8];
  const PARTICLE_ROTATION: [number, number, number] = [0.55, 0, 0];

  // ---- arms ----
  const armsPositions = new Float32Array(ARMS_COUNT * 3);
  const armsSizes = new Float32Array(ARMS_COUNT);
  const armsIds = new Float32Array(ARMS_COUNT);
  for (let i = 0; i < ARMS_COUNT; i++) {
    const arm = Math.floor(Math.random() * CONFIG.armCount);
    const r = GALAXY_R * Math.pow(Math.random(), CONFIG.coreConcentration);
    const armOffset = arm * ((2 * Math.PI) / CONFIG.armCount);
    const scatter = (Math.random() + Math.random() - 1) * CONFIG.armSpread;
    const baseAngle = armOffset + scatter;
    const h = (Math.random() * 2 - 1) * GALAXY_H * (0.25 + (1 - r / GALAXY_R));
    armsPositions[i * 3] = r;
    armsPositions[i * 3 + 1] = h;
    armsPositions[i * 3 + 2] = baseAngle;
    armsSizes[i] = 5 + 9 * Math.random();
    armsIds[i] = Math.random();
  }
  const armsGeometry = new THREE.BufferGeometry();
  armsGeometry.setAttribute("position", new THREE.BufferAttribute(armsPositions, 3));
  armsGeometry.setAttribute("size", new THREE.BufferAttribute(armsSizes, 1));
  armsGeometry.setAttribute("id", new THREE.BufferAttribute(armsIds, 1));

  const armsUniforms = {
    ...common,
    iMouse: { value: mouseCurrent },
    uAspect: { value: (clientWidth || 1) / (clientHeight || 1) },
    uPointerRadius: { value: CONFIG.pointerRadius },
    uPointerStrength: { value: CONFIG.pointerStrength },
    uSpinPhase: { value: 0 },
    uWinding: { value: CONFIG.windingFactor },
    uCoreSoftening: { value: CONFIG.coreSoftening },
    uChaos: { value: 0 },
    uR: { value: GALAXY_R },
    uArmCount: { value: CONFIG.armCount },
    uCore: { value: hexToVec3(CONFIG.coreColor) },
    uMid: { value: hexToVec3(CONFIG.midColor) },
    uRim: { value: hexToVec3(CONFIG.rimColor) },
    uAccent: { value: hexToVec3(CONFIG.armAccent) },
    uGradientPow: { value: CONFIG.gradientPow },
    uShimmerSpeed: { value: CONFIG.shimmerSpeed },
    uShimmerAmount: { value: CONFIG.shimmerAmount },
  };
  const armsMaterial = new THREE.ShaderMaterial({
    uniforms: armsUniforms,
    vertexShader: ARMS_VERT,
    fragmentShader: ARMS_FRAG,
    blending: THREE.AdditiveBlending,
    depthTest: false,
    transparent: true,
  });
  const arms = new THREE.Points(armsGeometry, armsMaterial);
  arms.position.set(...PARTICLE_POSITION);
  arms.rotation.set(...PARTICLE_ROTATION);
  arms.layers.enable(LAYERS.ENTIRE_SCENE);

  // ---- bulge ----
  const bulgePositions = new Float32Array(BULGE_COUNT * 3);
  const bulgeSizes = new Float32Array(BULGE_COUNT);
  const bulgeIds = new Float32Array(BULGE_COUNT);
  for (let i = 0; i < BULGE_COUNT; i++) {
    const rr = 0.32 * Math.pow(Math.random(), 1.5);
    const a = Math.random() * 2 * Math.PI;
    const u = Math.random() * 2 - 1;
    bulgePositions[i * 3] = rr * Math.sin(a);
    bulgePositions[i * 3 + 1] = u * 0.12 * (1 - rr / 0.32);
    bulgePositions[i * 3 + 2] = rr * Math.cos(a);
    bulgeSizes[i] = 12 + 14 * Math.random();
    bulgeIds[i] = Math.random();
  }
  const bulgeGeometry = new THREE.BufferGeometry();
  bulgeGeometry.setAttribute("position", new THREE.BufferAttribute(bulgePositions, 3));
  bulgeGeometry.setAttribute("size", new THREE.BufferAttribute(bulgeSizes, 1));
  bulgeGeometry.setAttribute("id", new THREE.BufferAttribute(bulgeIds, 1));

  const bulgeUniforms = {
    ...common,
    uCore: { value: hexToVec3(CONFIG.bulgeColor) },
    iMouse: { value: mouseCurrent },
    uAspect: { value: (clientWidth || 1) / (clientHeight || 1) },
    uPointerRadius: { value: CONFIG.pointerRadius },
    uPointerStrength: { value: CONFIG.pointerStrength },
  };
  const bulgeMaterial = new THREE.ShaderMaterial({
    uniforms: bulgeUniforms,
    vertexShader: BULGE_VERT,
    fragmentShader: BULGE_FRAG,
    blending: THREE.AdditiveBlending,
    depthTest: false,
    transparent: true,
  });
  const bulge = new THREE.Points(bulgeGeometry, bulgeMaterial);
  bulge.position.set(...PARTICLE_POSITION);
  bulge.rotation.set(...PARTICLE_ROTATION);
  bulge.layers.enable(LAYERS.ENTIRE_SCENE);

  // ---- sparks ----
  const sparkPositions = new Float32Array(CONFIG.sparkCount * 3);
  const sparkSizes = new Float32Array(CONFIG.sparkCount);
  const sparkSpeeds = new Float32Array(CONFIG.sparkCount);
  for (let i = 0; i < CONFIG.sparkCount; i++) {
    const arm = Math.floor(Math.random() * CONFIG.armCount);
    const r = GALAXY_R * Math.pow(Math.random(), CONFIG.coreConcentration);
    const armOffset = arm * ((2 * Math.PI) / CONFIG.armCount);
    const scatter = (Math.random() + Math.random() - 1) * CONFIG.armSpread;
    sparkPositions[i * 3] = r;
    sparkPositions[i * 3 + 1] = armOffset + scatter;
    sparkPositions[i * 3 + 2] = Math.random();
    sparkSizes[i] = 0.6 + 0.8 * Math.random();
    sparkSpeeds[i] = 0.6 + 0.9 * Math.random();
  }
  const sparksGeometry = new THREE.BufferGeometry();
  sparksGeometry.setAttribute("position", new THREE.BufferAttribute(sparkPositions, 3));
  sparksGeometry.setAttribute("size", new THREE.BufferAttribute(sparkSizes, 1));
  sparksGeometry.setAttribute("speed", new THREE.BufferAttribute(sparkSpeeds, 1));

  const sparksUniforms = {
    ...common,
    uSpinPhase: { value: 0 },
    uWinding: { value: CONFIG.windingFactor },
    uCoreSoftening: { value: CONFIG.coreSoftening },
    uSparkRise: { value: CONFIG.sparkRise },
    uSparkSpeed: { value: CONFIG.sparkSpeed },
    uSparkSize: { value: CONFIG.sparkSize },
    uSpark: { value: hexToVec3(CONFIG.sparkColor) },
    uSparkTop: { value: hexToVec3(CONFIG.sparkColorTop) },
    iMouse: { value: mouseCurrent },
    uAspect: { value: (clientWidth || 1) / (clientHeight || 1) },
    uPointerRadius: { value: CONFIG.pointerRadius },
    uPointerStrength: { value: CONFIG.pointerStrength },
  };
  const sparksMaterial = new THREE.ShaderMaterial({
    uniforms: sparksUniforms,
    vertexShader: SPARKS_VERT,
    fragmentShader: SPARKS_FRAG,
    blending: THREE.AdditiveBlending,
    depthTest: false,
    transparent: true,
  });
  const sparks = new THREE.Points(sparksGeometry, sparksMaterial);
  sparks.position.set(...PARTICLE_POSITION);
  sparks.rotation.set(...PARTICLE_ROTATION);
  sparks.layers.enable(LAYERS.ENTIRE_SCENE);

  instance.add(arms);
  instance.add(bulge);
  instance.add(sparks);
  scene.add(instance);

  // ---- ambient atmosphere motes (camera-attached) ----
  const atmoPositions = new Float32Array(CONFIG.atmoCount * 3);
  const atmoSizes = new Float32Array(CONFIG.atmoCount);
  for (let i = 0; i < CONFIG.atmoCount; i++) {
    atmoPositions[i * 3] = 2 * Math.random() - 1;
    atmoPositions[i * 3 + 1] = 2 * Math.random() - 1;
    atmoPositions[i * 3 + 2] = 2 * Math.random() - 1;
    atmoSizes[i] = CONFIG.atmoSize * (0.4 + Math.random());
  }
  const atmoGeometry = new THREE.BufferGeometry();
  atmoGeometry.setAttribute("position", new THREE.Float32BufferAttribute(atmoPositions, 3));
  atmoGeometry.setAttribute("size", new THREE.Float32BufferAttribute(atmoSizes, 1));
  const atmoUniforms = {
    uTime: { value: 0 },
    uColor: { value: hexToVec3(CONFIG.atmoColor) },
    uRes: {
      value: new THREE.Vector2(
        (clientWidth || 1) * renderer.getPixelRatio(),
        (clientHeight || 1) * renderer.getPixelRatio(),
      ),
    },
  };
  const atmoMaterial = new THREE.ShaderMaterial({
    uniforms: atmoUniforms,
    vertexShader: ATMO_VERT,
    fragmentShader: ATMO_FRAG,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    depthTest: false,
  });
  const atmoPoints = new THREE.Points(atmoGeometry, atmoMaterial);
  atmoPoints.frustumCulled = false;
  atmoPoints.layers.enable(LAYERS.ENTIRE_SCENE);
  scene.add(atmoPoints);

  // ---- pointer — window-level, exactly as the source itself does it ----
  // (the source reads `this.canvas.clientWidth/clientHeight`; tracking the
  // same values via resize() avoids a layout read every pointermove).
  let currentWidth = clientWidth || 1;
  let currentHeight = clientHeight || 1;
  const rawMouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  const handleMouseMove = (e: MouseEvent) => {
    rawMouse.x = e.clientX;
    rawMouse.y = e.clientY;
  };
  window.addEventListener("mousemove", handleMouseMove, { passive: true });

  const getScenePointer = (): THREE.Vector2 =>
    new THREE.Vector2(
      (rawMouse.x / currentWidth) * 2 - 1,
      (rawMouse.y / currentHeight) * -2 + 1,
    );

  // ---- scroll (from the shared scroll signal — see file header) ----
  let scrollCurrent = 0;
  let spinPhase = 0;
  let lastElapsed = 0;

  const renderStatic = () => {
    common.uOpacity.value = 1;
    common.iAnimate.value = 1;
    instance.position.z = 0;
    camera.position.z = BASE_CAMERA_Z;
    camera.layers.set(LAYERS.TORUS_SCENE);
    torusComposer.render();
    camera.layers.set(LAYERS.BLOOM_SCENE);
    bloomComposer.render();
    camera.layers.set(LAYERS.ENTIRE_SCENE);
    finalComposer.render();
  };

  const renderFrame = (elapsedSeconds: number) => {
    const dt = Math.min(0.05, Math.max(0, elapsedSeconds - lastElapsed));
    lastElapsed = elapsedSeconds;
    const t = elapsedSeconds;
    const elapsedMs = t * 1000;

    // Appear-in: slide from z=-20 (starting 500ms in, over 1500ms,
    // easeOutQuart) + a separate 2000ms iAnimate smoothstep ramp — folded
    // from the source's own second rAF loop into this single one (see
    // file header).
    const tSlide = Math.max(0, Math.min(1, (elapsedMs - 500) / 1500));
    const easedSlide = 1 - Math.pow(1 - tSlide, 4);
    instance.position.z = lerp(-20, 0, easedSlide);
    common.uOpacity.value = easedSlide;
    const tAnim = Math.max(0, Math.min(1, elapsedMs / 2000));
    common.iAnimate.value = tAnim * tAnim * (3 - 2 * tAnim);

    // Scroll — shared signal instead of the source's own window.scrollY read.
    const scrollTarget = THREE.MathUtils.clamp(getScrollSignalSnapshot().progress, 0, 1);
    scrollCurrent = lerp(scrollCurrent, scrollTarget, 0.08);
    camera.position.z = BASE_CAMERA_Z - scrollCurrent * CONFIG.scrollDiveZ;

    // Differential rotation — a JS-accumulated phase, never a speed-scaled
    // iTime (see file header / the asset's own contract.notes).
    spinPhase += CONFIG.spinSpeed * (1 + scrollCurrent * CONFIG.scrollSpin) * dt;
    common.iTime.value = t;
    common.uExpand.value = 1 + scrollCurrent * CONFIG.scrollExpand;
    armsUniforms.uSpinPhase.value = spinPhase;
    sparksUniforms.uSpinPhase.value = spinPhase;
    armsUniforms.uChaos.value = scrollCurrent * scrollCurrent * CONFIG.scrollChaos;

    const target = getScenePointer();
    mouseCurrent.x = lerp(mouseCurrent.x, target.x, 0.09);
    mouseCurrent.y = lerp(mouseCurrent.y, target.y, 0.09);

    finalPass.uniforms.iTime.value = t;
    atmoUniforms.uTime.value = t * CONFIG.atmoSpeed * 8.0;
    atmoPoints.position.copy(camera.position);

    camera.layers.set(LAYERS.TORUS_SCENE);
    torusComposer.render();
    camera.layers.set(LAYERS.BLOOM_SCENE);
    bloomComposer.render();
    camera.layers.set(LAYERS.ENTIRE_SCENE);
    finalComposer.render();
  };

  const resize = (width: number, height: number) => {
    if (width <= 0 || height <= 0) return;
    currentWidth = width;
    currentHeight = height;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    const dpr = renderer.getPixelRatio();
    for (const composer of [torusComposer, bloomComposer, finalComposer]) {
      composer.setPixelRatio(dpr);
      composer.setSize(width, height);
    }
    bloomPass.setSize(width, height);
    const aspect = width / height;
    armsUniforms.uAspect.value = aspect;
    bulgeUniforms.uAspect.value = aspect;
    sparksUniforms.uAspect.value = aspect;
    atmoUniforms.uRes.value.set(width * dpr, height * dpr);
    finalPass.uniforms.bloomTexture.value = bloomComposer.renderTarget1.texture;
    finalPass.uniforms.torusTexture.value = torusComposer.renderTarget1.texture;
  };
  resize(clientWidth || 1, clientHeight || 1);

  // Interaction is fully window-driven (see file header) — HeroScene.tsx's
  // own shared pointer store isn't used, so this is an intentional no-op.
  const setPointer = () => {};

  const dispose = () => {
    window.removeEventListener("mousemove", handleMouseMove);
    armsGeometry.dispose();
    armsMaterial.dispose();
    bulgeGeometry.dispose();
    bulgeMaterial.dispose();
    sparksGeometry.dispose();
    sparksMaterial.dispose();
    atmoGeometry.dispose();
    atmoMaterial.dispose();
    torusComposer.dispose();
    bloomComposer.dispose();
    finalComposer.dispose();
    renderer.dispose();
  };

  return { renderStatic, renderFrame, resize, setPointer, dispose, canvas };
};

/** Full-bleed About page background — the source's own numbers verbatim
 * (120000/2500/5000 arms/bulge/spark points, 45° FOV, torus bloom
 * 0.22/0.2/0, main bloom 0.38/0.55/0). */
export const createPinwheelGalaxyHeroScene = (container: HTMLElement): HeroSceneHandle =>
  buildPinwheelGalaxyScene(container);
