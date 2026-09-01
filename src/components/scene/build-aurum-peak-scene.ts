/**
 * Aurum Peak — GetLayers' "single golden summit rising through drifting
 * sunset cloud" scene (`getlayers_search`/`getlayers_materialize`, id
 * `aurum-peak`), pulled as its portable single-HTML master and ported
 * verbatim: the `jhash`/`jnoise`/`jfbm`/`jridge`/`jridgefbm` CPU noise
 * functions, the single-central-massif height field, the CPU-triangulated
 * `bary`-attributed summit mesh, the drifting fbm cloud backdrop, the
 * three-composer selective-bloom rig, and the FinalPass refractive-lens/
 * chromatic-aberration/vignette/grain composite are all copied character
 * for character from the materialized source — cross-checked against the
 * brief's own numbers first, and every one of them (camera `52°`/`CAM_BASE
 * (0,2.7,10.5)`/`CAM_TARGET (0,0.7,-1.2)`, `NX 42`/`NZ 30`/the `X0/X1/Z0/Z1`
 * grid bounds, torusComposer bloom `0.22/0.2/0`, bloomComposer bloom
 * `0/0.55/0`, FinalPass uniforms and defaults, every cloud/terrain colour)
 * matches exactly — the brief was clearly written from this same real
 * source, so nothing here needed reconciling.
 *
 * CONFIG colours (`bgColor #12100b`, `cloudColor #7c5a2c`, `cloudHigh
 * #e8bd6a`, `lineColor #c8862f`, `peakColor #ffdf9c`, `faceColor #483827`,
 * `fillColor #ffcf72`, `hazeColor #7a5832`, `mistColor #8a6a3c`) are the
 * scene's own "Default" variant, not this project's Neural Monitor Style
 * blue tint override — same "the constants ARE the spec" precedent as
 * every other verbatim scene here, reinforced this time by the brief
 * itself listing these exact hex values.
 *
 * Like `build-einstein-rosen-lattice-scene.ts`'s glow quad, the extra
 * composers here are not a live bloom path: the source puts both the cloud
 * backdrop and the terrain mesh on `LAYERS.ENTIRE_SCENE` only (never
 * `TORUS_SCENE`/`BLOOM_SCENE`), and ships `bloomStr: 0` — "glow is
 * in-shader now" per its own CONFIG comment (`lineGlow`/`fillGlow` do the
 * work inside `TERRAIN_FRAG` instead). `torusComposer`/`bloomComposer`
 * therefore render an empty scene every frame; kept exactly as the source
 * has it, per this project's standing rule about not "fixing" a verbatim
 * ask.
 *
 * Documented deviations only, all invisible to the rendered look or forced
 * by this project's actual dependency versions:
 * - `THREE.WebGLRenderer` instead of `THREE.WebGL1Renderer` (removed in
 *   three@0.185, installed here) — the same non-negotiable rename already
 *   made in every other verbatim scene in this codebase.
 * - `renderer.shadowMap.enabled = true` / `THREE.VSMShadowMap` kept
 *   verbatim (the brief asks for it explicitly) but is inert: nothing in
 *   this scene casts or receives a shadow (no `THREE.Light`, no
 *   `castShadow`/`receiveShadow` anywhere in the source) — same
 *   "quiet by default, not dead code" situation as the einstein-rosen
 *   glow quad above.
 * - No `extensions: { derivatives: true }` on the terrain material, and no
 *   `#extension GL_OES_standard_derivatives : enable` line in its fragment
 *   shader — `ShaderMaterial`'s `extensions` option in three@0.185 no
 *   longer exposes that WebGL1-era flag at all (WebGL2, three's default
 *   context here, has `dFdx`/`dFdy`/`fwidth` natively). The shader's own
 *   `fwidth()` calls (the wireframe edge/halo/sub-triangle math) are
 *   unchanged. Same exact deviation already documented in
 *   `build-einstein-rosen-lattice-scene.ts`.
 * - Tier-based DPR clamp instead of the source's flat
 *   `renderer.setPixelRatio(window.devicePixelRatio)`.
 * - The render loop is `HeroScene.tsx`'s own rAF
 *   (`renderFrame(elapsedSeconds)`) instead of the source's freestanding
 *   one; `uTime` and the hover-fill/distort-activation lerps read
 *   `elapsedSeconds` directly in place of the source's own
 *   `performance.now()` deltas — same idiom every other scene here uses.
 * - Interaction is already window-level in the source itself
 *   (`window.addEventListener('pointermove'/'pointerdown'/'pointerleave',
 *   ...)`, computing `nx`/`ny` from `window.innerWidth`/`innerHeight`) —
 *   matching the brief's explicit "window listeners for interaction" with
 *   zero adaptation needed, since this canvas (like Aureole's) is always
 *   `pointer-events-none`. `setPointer` is therefore an intentional no-op,
 *   same as `build-aureole-scene.ts`.
 * - The source's "black `#fade-overlay` DOM `<div>` fading opacity 1 → 0
 *   over 1400ms after a 300ms delay" intro is folded into a `uFadeIn`
 *   uniform inside `FinalPass` (multiplying the final composited colour by
 *   `clamp((elapsedSeconds*1000-300)/1400, 0, 1)`, i.e. black-then-reveal
 *   over the same 300ms/1400ms timing) instead of a literal DOM overlay
 *   element — same choice `build-aether-flux-scene.ts` and
 *   `build-golden-parthenon-scene.ts` already made for their own
 *   `appearStart`-driven intro fades, which keeps the intro entirely
 *   inside the WebGL render loop rather than introducing a CSS/DOM
 *   animation this project's motion rules don't have a primitive for.
 *   `CONFIG.appearFade` is fixed at `1` (never exposed as a runtime knob
 *   here), so the direct `ft` value stands in for
 *   `(1 - opacity) = ft * appearFade` unsimplified.
 */
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { GammaCorrectionShader } from "three/examples/jsm/shaders/GammaCorrectionShader.js";
import { CopyShader } from "three/examples/jsm/shaders/CopyShader.js";
import { getTierBudget } from "@/lib/scene/device-tier";
import type { HeroSceneHandle } from "./hero-scene-types";

// Verbatim "Default" CONFIG from the materialized source.
const CONFIG = {
  bgColor: "#12100b",
  cloudColor: "#7c5a2c",
  cloudHigh: "#e8bd6a",
  cloudScale: 3.2,
  cloudCover: 0.34,
  cloudSpeed: 0.16,
  hazeColor: "#7a5832",
  hazeStart: 18.0,
  hazeEnd: 21.0,
  mistColor: "#8a6a3c",
  mistAmt: 0.45,
  mistHeight: 0.7,
  mistBand: 1.6,
  lineColor: "#c8862f",
  peakColor: "#ffdf9c",
  faceColor: "#483827",
  faceFootDark: 0.55,
  lineWidth: 1.1,
  lineBright: 1.2,
  lineGlow: 0.55,
  bottomFade: 1.0,
  footFade: 0.85,
  peakHeight: 4.4,
  ridgeAmp: 1.35,
  fillColor: "#ffcf72",
  hoverRadius: 2.6,
  subDiv: 6.0,
  subWidth: 1.25,
  fillGlow: 0.7,
  parallaxAmt: 0.55,
  distortAmt: 0.28,
  distortRadius: 0.34,
  chromatic: 0.0011,
  grain: 0.035,
  vignette: 0.95,
  bloomStr: 0.0,
  bloomRadius: 0.55,
  bloomThresh: 0.0,
  appearFade: 1.0,
};

const LAYERS = { NONE: 0, TORUS_SCENE: 1, BLOOM_SCENE: 2, ENTIRE_SCENE: 3 };
const CAM_BASE = new THREE.Vector3(0, 2.7, 10.5);
const CAM_TARGET = new THREE.Vector3(0, 0.7, -1.2);
const NX = 42;
const NZ = 30;
const X0 = -19.0;
const X1 = 19.0;
const Z0 = -15.0;
const Z1 = 13.0;

const hexToVec3 = (hex: string): THREE.Vector3 => {
  const n = parseInt(hex.slice(1), 16);
  return new THREE.Vector3(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
};

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

// ---------------------------------------------------------------------------
// CPU value noise driving the terrain height field — verbatim.
// ---------------------------------------------------------------------------
const jhash = (x: number, y: number): number => {
  const h = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return h - Math.floor(h);
};
const jnoise = (x: number, y: number): number => {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const a = jhash(xi, yi);
  const b = jhash(xi + 1, yi);
  const c = jhash(xi, yi + 1);
  const d = jhash(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v * (1 - u) + (d - b) * u * v;
};
const jfbm = (x: number, y: number): number => {
  let f = 0;
  let amp = 0.5;
  for (let i = 0; i < 4; i++) {
    f += amp * jnoise(x, y);
    x *= 2.03;
    y *= 2.01;
    amp *= 0.5;
  }
  return f;
};
const jridge = (x: number, y: number): number => 1 - Math.abs(jnoise(x, y) * 2 - 1);
const jridgefbm = (x: number, y: number): number => {
  let f = 0;
  let amp = 0.5;
  for (let i = 0; i < 5; i++) {
    f += amp * jridge(x, y);
    x *= 2.05;
    y *= 2.03;
    amp *= 0.5;
  }
  return f;
};

// Single central massif with ridge noise — verbatim.
const terrainHeight = (x: number, z: number): number => {
  const P = CONFIG.peakHeight;
  const A = CONFIG.ridgeAmp;
  const dxa = x - 0.0;
  const dza = z + 1.0;
  const ra = Math.sqrt(dxa * dxa * 0.45 + dza * dza * 0.85);
  const ma = Math.max(0, 1 - ra / 5.6);
  const coneA = Math.pow(ma, 1.16) * P;
  let h = coneA;
  const mask = ma;
  h += A * 0.9 * (jfbm(x * 0.24 + 7.0, z * 0.24) - 0.5) * Math.pow(mask, 0.5);
  const rd = jridgefbm(x * 0.4 + 12.0, z * 0.4 + 3.0);
  h += A * 1.9 * (rd - 0.42) * Math.pow(mask, 0.55);
  const rd2 = jridgefbm(x * 0.85 + 40.0, z * 0.85 + 8.0);
  h += A * 1.2 * (rd2 - 0.45) * Math.pow(mask, 0.8);
  h += A * 0.7 * (jfbm(x * 1.7 + 20.0, z * 1.7) - 0.5) * Math.pow(mask, 1.0);
  h += 0.06 * (jfbm(x * 0.5 + 5.0, z * 0.5) - 0.5) * (1.0 - mask);
  return h - 0.15;
};

// ---------------------------------------------------------------------------
// Shaders — verbatim from the materialized source.
// ---------------------------------------------------------------------------
const CLOUD_VERT = /* glsl */ `
  varying vec2 vUv;
  void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;

const CLOUD_FRAG = /* glsl */ `
  varying vec2 vUv;
  uniform float uTime, uAlpha, uScale, uCover, uSpeed;
  uniform vec3 uBg, uCloud, uHigh;
  float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p){
    vec2 i = floor(p), f = fract(p);
    float a = hash(i), b = hash(i + vec2(1,0)), c = hash(i + vec2(0,1)), d = hash(i + vec2(1,1));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }
  float fbm(vec2 p){
    float v = 0.0, a = 0.5;
    for(int i = 0; i < 6; i++){ v += a * noise(p); p *= 2.02; a *= 0.5; }
    return v;
  }
  void main(){
    vec2 p = vUv * uScale;
    p.x += uTime * uSpeed;
    float f  = fbm(p + vec2(0.0, uTime * uSpeed * 0.25));
    float f2 = fbm(p * 1.9 + vec2(11.0, -uTime * uSpeed * 0.6));
    float field = f * 0.65 + f2 * 0.5;
    float clouds = smoothstep(uCover, uCover + 0.55, field);
    float vgrad = smoothstep(-0.15, 1.0, vUv.y);
    vec3 col = mix(uBg * 0.6, uBg * 1.1, vgrad);
    float band = smoothstep(0.26, 0.46, vUv.y) * smoothstep(0.72, 0.46, vUv.y);
    col += uHigh * band * 0.5;
    float glow = smoothstep(0.74, 0.0, distance(vUv * vec2(1.0, 1.2), vec2(0.72, 0.82) * vec2(1.0, 1.2)));
    col += uHigh * glow * 0.78;
    col += uHigh * pow(glow, 3.0) * 0.65;
    vec3 cl = mix(uCloud, uHigh, smoothstep(0.45, 1.0, field));
    col = mix(col, cl, clouds * (0.35 + 0.65 * vgrad));
    float tl = smoothstep(0.35, 1.0, (1.0 - vUv.x) * 0.6 + vUv.y * 0.7);
    col *= mix(1.0, 0.55, tl);
    float sil1 = 0.40 + 0.17 * fbm(vec2(vUv.x * 3.2 + 2.0, 1.7));
    float sil2 = 0.35 + 0.12 * fbm(vec2(vUv.x * 6.0 + 20.0, 4.2));
    float m1 = smoothstep(sil1 + 0.025, sil1 - 0.05, vUv.y);
    float m2 = smoothstep(sil2 + 0.02, sil2 - 0.05, vUv.y);
    col = mix(col, uBg * 0.42, m1 * 0.85);
    col = mix(col, uBg * 0.18, m2 * 0.95);
    gl_FragColor = vec4(col * uAlpha, 1.0);
  }`;

const TERRAIN_VERT = /* glsl */ `
  attribute vec3 bary;
  varying vec3 vBary; varying float vY; varying vec2 vXZ; varying vec3 vWorld; varying vec3 vView;
  void main(){
    vBary = bary; vY = position.y;
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorld = wp.xyz; vXZ = wp.xz; vView = cameraPosition - wp.xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }`;

const TERRAIN_FRAG = /* glsl */ `
  precision highp float;
  varying vec3 vBary; varying float vY; varying vec2 vXZ; varying vec3 vWorld; varying vec3 vView;
  uniform float uAlpha, uLineW, uLineBright, uGlow, uSubDiv, uSubW, uFillGlow, uHitR, uHitAct, uPeakH, uResY, uFadeH, uFootFade, uFogNear, uFogFar, uTime, uMistAmt, uMistY, uMistW;
  uniform vec3 uLine, uPeak, uFill, uFace, uHaze, uMist; uniform vec2 uHit; uniform float uFaceFoot;
  float edgeF(vec3 bc, float w){
    vec3 dd = fwidth(bc);
    vec3 a = smoothstep(vec3(0.0), dd * w, bc);
    return 1.0 - min(min(a.x, a.y), a.z);
  }
  float haloF(vec3 bc, float wpx){
    vec3 dd = fwidth(bc);
    vec3 an = bc / max(dd, vec3(1e-5));
    float md = min(min(an.x, an.y), an.z);
    return exp(-md / max(wpx, 0.001));
  }
  float subF(vec3 bc, float N, float w){
    vec3 b = bc * N;
    vec3 fr = fract(b);
    vec3 dl = min(fr, 1.0 - fr);
    vec3 dd = fwidth(b);
    vec3 a = smoothstep(vec3(0.0), dd * w, dl);
    return 1.0 - min(min(a.x, a.y), a.z);
  }
  void main(){
    vec3 N = normalize(cross(dFdx(vWorld), dFdy(vWorld)));
    vec3 V = normalize(vView);
    if (dot(N, V) < 0.0) N = -N;
    vec3 L = normalize(vec3(0.15, 0.55, -1.0));
    float diff = max(dot(N, L), 0.0);
    float rim = pow(1.0 - abs(dot(N, V)), 2.2);
    float h = clamp((vY + 0.4) / (uPeakH + 0.4), 0.0, 1.0);
    vec3 face = uFace * (0.34 + 0.42 * diff) + uPeak * rim * 0.28;
    face *= mix(1.0 - uFaceFoot, 1.0, h);
    float wire = edgeF(vBary, uLineW);
    float halo = haloF(vBary, 6.0) * uGlow;
    vec3 edgeCol = mix(uLine, uPeak, max(h * 0.7, rim));
    float hd = distance(vXZ, uHit);
    float fill = smoothstep(uHitR, 0.0, hd);
    fill = pow(fill, 2.2) * uHitAct;
    float sub = subF(vBary, uSubDiv, uSubW) * fill;
    float nf = smoothstep(3.0, 12.5, length(vView));
    float fadeB = mix(1.0, nf, clamp(uFadeH, 0.0, 1.0));
    float foot = mix(1.0, smoothstep(-0.05, 0.55, h), clamp(uFootFade, 0.0, 1.0));
    float lf = fadeB * foot;
    vec3 col = face;
    col += edgeCol * halo * 0.5 * lf;
    col += uFill * fill * uFillGlow * 0.5 * fadeB;
    col = mix(col, edgeCol * uLineBright, wire * lf);
    col = mix(col, uFill * 2.2, clamp(sub * fadeB, 0.0, 1.0));
    float drift = 0.6 + 0.4 * sin(vWorld.x * 0.55 + uTime * 0.14) * cos(vWorld.z * 0.5 - uTime * 0.11);
    float mist = exp(-pow((vY - uMistY) / max(uMistW, 0.001), 2.0)) * uMistAmt * drift;
    col = mix(col, uMist, clamp(mist, 0.0, 1.0));
    float fog = smoothstep(uFogNear, uFogFar, length(vView));
    col = mix(col, uHaze, fog * 0.7);
    gl_FragColor = vec4(col, uAlpha * (1.0 - fog));
  }`;

// FinalPass — same composite as the source, plus a `uFadeIn` multiplier
// standing in for the source's DOM `#fade-overlay` (see file header).
const FinalPass = {
  uniforms: {
    tDiffuse: { value: null as THREE.Texture | null },
    torusTexture: { value: null as THREE.Texture | null },
    bloomTexture: { value: null as THREE.Texture | null },
    uMouse: { value: new THREE.Vector2(0.5, 0.5) },
    uDistortAmt: { value: CONFIG.distortAmt },
    uDistortR: { value: CONFIG.distortRadius },
    uDistortAct: { value: 0 },
    uAspect: { value: 1 },
    uTime: { value: 0 },
    uGrain: { value: CONFIG.grain },
    uVignette: { value: CONFIG.vignette },
    uCA: { value: CONFIG.chromatic },
    uFadeIn: { value: 0 },
  },
  vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position, 1.0); }`,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse; uniform sampler2D bloomTexture; uniform sampler2D torusTexture;
    uniform vec2 uMouse; uniform float uDistortAmt, uDistortR, uDistortAct, uAspect, uTime, uGrain, uVignette, uCA, uFadeIn;
    varying vec2 vUv;
    float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    vec3 sampleAll(vec2 u){ return texture2D(bloomTexture, u).rgb + texture2D(torusTexture, u).rgb + texture2D(tDiffuse, u).rgb; }
    void main() {
      vec2 uv = vUv;
      vec2 d = uv - uMouse; d.x *= uAspect;
      float dist = length(d);
      float infl = smoothstep(uDistortR, 0.0, dist) * uDistortAct;
      float sw = infl * 0.14;
      mat2 rot = mat2(cos(sw), -sin(sw), sin(sw), cos(sw));
      vec2 off = (uv - uMouse);
      off = rot * off;
      uv = uMouse + off * (1.0 - infl * uDistortAmt);
      vec2 caoff = (vUv - 0.5) * uCA;
      float r = sampleAll(uv + caoff).r;
      float g = sampleAll(uv).g;
      float b = sampleAll(uv - caoff).b;
      vec3 col = vec3(r, g, b);
      float vig = smoothstep(0.85, 0.24, length(vUv - 0.5));
      col *= mix(1.0, vig, uVignette);
      col += (hash(gl_FragCoord.xy + uTime) - 0.5) * uGrain;
      gl_FragColor = vec4(col * uFadeIn, 1.0);
    }`,
};

const buildAurumPeakScene = (container: HTMLElement): HeroSceneHandle => {
  const canvas = document.createElement("canvas");
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
  const { clientWidth, clientHeight } = container;
  const { dprClamp } = getTierBudget(clientWidth || window.innerWidth);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, dprClamp));
  renderer.setSize(clientWidth || 1, clientHeight || 1);
  // Kept verbatim per the brief; inert — nothing in this scene casts or
  // receives a shadow (see file header).
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.VSMShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);
  const camera = new THREE.PerspectiveCamera(52, (clientWidth || 1) / (clientHeight || 1), 0.1, 140);
  camera.position.copy(CAM_BASE);
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
    CONFIG.bloomStr,
    CONFIG.bloomRadius,
    CONFIG.bloomThresh,
  );
  bloomComposer.addPass(bloomPass);
  bloomComposer.addPass(new ShaderPass(GammaCorrectionShader));

  const finalPass = new ShaderPass(FinalPass);
  finalPass.uniforms.bloomTexture.value = bloomComposer.renderTarget1.texture;
  finalPass.uniforms.torusTexture.value = torusComposer.renderTarget1.texture;
  const finalComposer = new EffectComposer(renderer);
  finalComposer.addPass(renderScene);
  finalComposer.addPass(finalPass);

  // ---- drifting cloud backdrop ----
  const cloudUniforms = {
    uTime: { value: 0 },
    uAlpha: { value: 0 },
    uScale: { value: CONFIG.cloudScale },
    uCover: { value: CONFIG.cloudCover },
    uSpeed: { value: CONFIG.cloudSpeed },
    uBg: { value: hexToVec3(CONFIG.bgColor) },
    uCloud: { value: hexToVec3(CONFIG.cloudColor) },
    uHigh: { value: hexToVec3(CONFIG.cloudHigh) },
  };
  const cloudMaterial = new THREE.ShaderMaterial({
    uniforms: cloudUniforms,
    depthWrite: true,
    depthTest: true,
    vertexShader: CLOUD_VERT,
    fragmentShader: CLOUD_FRAG,
  });
  const cloudGeometry = new THREE.PlaneGeometry(96, 56);
  const clouds = new THREE.Mesh(cloudGeometry, cloudMaterial);
  clouds.position.set(0, 1.5, -16);
  clouds.renderOrder = -10;
  clouds.layers.set(LAYERS.ENTIRE_SCENE);
  scene.add(clouds);

  // ---- CPU-triangulated summit ----
  const px = (i: number) => X0 + (X1 - X0) * (i / NX);
  const pz = (j: number) => Z0 + (Z1 - Z0) * (j / NZ);
  const pos: number[] = [];
  const bary: number[] = [];
  const B = [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
  ];
  const pushVert = (x: number, z: number, k: number) => {
    pos.push(x, terrainHeight(x, z), z);
    bary.push(B[k][0], B[k][1], B[k][2]);
  };
  for (let j = 0; j < NZ; j++) {
    for (let i = 0; i < NX; i++) {
      const x0 = px(i);
      const x1 = px(i + 1);
      const z0 = pz(j);
      const z1 = pz(j + 1);
      pushVert(x0, z0, 0);
      pushVert(x1, z0, 1);
      pushVert(x1, z1, 2);
      pushVert(x0, z0, 0);
      pushVert(x1, z1, 1);
      pushVert(x0, z1, 2);
    }
  }
  const terrainGeometry = new THREE.BufferGeometry();
  terrainGeometry.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  terrainGeometry.setAttribute("bary", new THREE.Float32BufferAttribute(bary, 3));
  terrainGeometry.computeBoundingSphere();

  const terrainUniforms = {
    uAlpha: { value: 0 },
    uLine: { value: hexToVec3(CONFIG.lineColor) },
    uPeak: { value: hexToVec3(CONFIG.peakColor) },
    uFill: { value: hexToVec3(CONFIG.fillColor) },
    uFace: { value: hexToVec3(CONFIG.faceColor) },
    uFaceFoot: { value: CONFIG.faceFootDark },
    uLineW: { value: CONFIG.lineWidth },
    uLineBright: { value: CONFIG.lineBright },
    uGlow: { value: CONFIG.lineGlow },
    uSubDiv: { value: CONFIG.subDiv },
    uSubW: { value: CONFIG.subWidth },
    uFillGlow: { value: CONFIG.fillGlow },
    uHit: { value: new THREE.Vector2(0, 0) },
    uHitR: { value: CONFIG.hoverRadius },
    uHitAct: { value: 0 },
    uPeakH: { value: CONFIG.peakHeight },
    uResY: { value: (clientHeight || 1) * renderer.getPixelRatio() },
    uFadeH: { value: CONFIG.bottomFade },
    uFootFade: { value: CONFIG.footFade },
    uHaze: { value: hexToVec3(CONFIG.hazeColor) },
    uFogNear: { value: CONFIG.hazeStart },
    uFogFar: { value: CONFIG.hazeEnd },
    uTime: { value: 0 },
    uMist: { value: hexToVec3(CONFIG.mistColor) },
    uMistAmt: { value: CONFIG.mistAmt },
    uMistY: { value: CONFIG.mistHeight },
    uMistW: { value: CONFIG.mistBand },
  };
  const terrainMaterial = new THREE.ShaderMaterial({
    uniforms: terrainUniforms,
    transparent: true,
    depthWrite: true,
    depthTest: true,
    side: THREE.DoubleSide,
    vertexShader: TERRAIN_VERT,
    fragmentShader: TERRAIN_FRAG,
  });
  const terrain = new THREE.Mesh(terrainGeometry, terrainMaterial);
  terrain.renderOrder = 2;
  terrain.layers.set(LAYERS.ENTIRE_SCENE);
  scene.add(terrain);

  // ---- hover raycast (see contract.notes: must enable ENTIRE_SCENE) ----
  const raycaster = new THREE.Raycaster();
  raycaster.layers.enable(LAYERS.ENTIRE_SCENE);
  const hit = new THREE.Vector2(0, 0);
  let hitActive = 0;
  const ndc = new THREE.Vector2(0, 0);

  // ---- pointer — window-level, exactly as the source itself does it ----
  const pointer = { tx: 0, ty: 0, x: 0, y: 0, active: 0 };
  const handlePointerMove = (e: PointerEvent) => {
    const nx = e.clientX / window.innerWidth;
    const ny = e.clientY / window.innerHeight;
    pointer.tx = nx * 2 - 1;
    pointer.ty = ny * 2 - 1;
    pointer.active = 1;
    ndc.set(pointer.tx, -pointer.ty);
    finalPass.uniforms.uMouse.value.set(nx, 1 - ny);
  };
  const handlePointerLeave = () => {
    pointer.active = 0;
  };
  window.addEventListener("pointermove", handlePointerMove, { passive: true });
  window.addEventListener("pointerdown", handlePointerMove, { passive: true });
  window.addEventListener("pointerleave", handlePointerLeave, { passive: true });

  const renderStatic = () => {
    cloudUniforms.uAlpha.value = 1;
    terrainUniforms.uAlpha.value = 1;
    finalPass.uniforms.uFadeIn.value = 1;
    camera.layers.set(LAYERS.TORUS_SCENE);
    torusComposer.render();
    camera.layers.set(LAYERS.BLOOM_SCENE);
    bloomComposer.render();
    camera.layers.set(LAYERS.ENTIRE_SCENE);
    finalComposer.render();
  };

  const renderFrame = (elapsedSeconds: number) => {
    const t = elapsedSeconds;

    // eased parallax
    pointer.x = lerp(pointer.x, pointer.tx, 0.06);
    pointer.y = lerp(pointer.y, pointer.ty, 0.06);
    const parX = pointer.x * CONFIG.parallaxAmt;
    const parY = pointer.y * CONFIG.parallaxAmt;
    camera.position.set(CAM_BASE.x + parX, CAM_BASE.y - parY * 0.5, CAM_BASE.z);
    camera.lookAt(CAM_TARGET.x + parX * 0.15, CAM_TARGET.y - parY * 0.1, CAM_TARGET.z);

    // hover raycast onto the summit
    camera.updateMatrixWorld();
    terrain.updateMatrixWorld();
    raycaster.setFromCamera(ndc, camera);
    const hits = raycaster.intersectObject(terrain, false);
    if (hits.length) {
      hit.set(hits[0].point.x, hits[0].point.z);
      hitActive = 1;
    } else {
      hitActive = 0;
    }

    cloudUniforms.uTime.value = t;
    terrainUniforms.uTime.value = t;
    cloudUniforms.uAlpha.value = 1;
    terrainUniforms.uAlpha.value = 1;
    terrainUniforms.uHit.value.lerp(hit, 0.25);
    terrainUniforms.uHitAct.value = lerp(terrainUniforms.uHitAct.value, hitActive, 0.12);

    finalPass.uniforms.uTime.value = t;
    finalPass.uniforms.uDistortAct.value = lerp(finalPass.uniforms.uDistortAct.value, pointer.active, 0.1);
    // Intro reveal — see file header ("uFadeIn" replaces the source's DOM overlay).
    finalPass.uniforms.uFadeIn.value = Math.max(0, Math.min(1, (t * 1000 - 300) / 1400));

    camera.layers.set(LAYERS.TORUS_SCENE);
    torusComposer.render();
    camera.layers.set(LAYERS.BLOOM_SCENE);
    bloomComposer.render();
    camera.layers.set(LAYERS.ENTIRE_SCENE);
    finalComposer.render();
  };

  const resize = (width: number, height: number) => {
    if (width <= 0 || height <= 0) return;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    const dpr = renderer.getPixelRatio();
    for (const composer of [torusComposer, bloomComposer, finalComposer]) {
      composer.setPixelRatio(dpr);
      composer.setSize(width, height);
    }
    bloomPass.setSize(width, height);
    finalPass.uniforms.uAspect.value = width / height;
    terrainUniforms.uResY.value = height * dpr;
    finalPass.uniforms.bloomTexture.value = bloomComposer.renderTarget1.texture;
    finalPass.uniforms.torusTexture.value = torusComposer.renderTarget1.texture;
  };
  resize(clientWidth || 1, clientHeight || 1);

  // Interaction is fully window-driven (see file header) — HeroScene.tsx's
  // own shared pointer store isn't used, so this is an intentional no-op.
  const setPointer = () => {};

  const dispose = () => {
    window.removeEventListener("pointermove", handlePointerMove);
    window.removeEventListener("pointerdown", handlePointerMove);
    window.removeEventListener("pointerleave", handlePointerLeave);
    cloudGeometry.dispose();
    cloudMaterial.dispose();
    terrainGeometry.dispose();
    terrainMaterial.dispose();
    torusComposer.dispose();
    bloomComposer.dispose();
    finalComposer.dispose();
    renderer.dispose();
  };

  return { renderStatic, renderFrame, resize, setPointer, dispose, canvas };
};

/** Full-bleed Publications page background — the source's own numbers
 * verbatim (52° FOV, torus bloom 0.22/0.2/0, bloom-pass 0/0.55/0 which is
 * a no-op strength, per the file header). */
export const createAurumPeakHeroScene = (container: HTMLElement): HeroSceneHandle =>
  buildAurumPeakScene(container);
