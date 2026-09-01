/**
 * Einstein–Rosen Lattice — GetLayers' "platinum lattice wormhole funnelling
 * down to a glowing throat, warm gold at the mouth and cold sapphire at the
 * flaring rim" scene (`getlayers_search`/`getlayers_materialize`, id
 * `einstein-rosen-lattice`), pulled as its portable single-HTML master and
 * ported verbatim — same practice as `build-solaris-scene.ts` (ADR-0039)
 * and `build-aether-flux-scene.ts` (ADR-0042): QUAD_VERT, BRIDGE_FRAG,
 * GLOW_FRAG, the FinalPass composite shader, the catenoid raymarch math
 * (`phiOf`/`lattice`/the asinh-warped step scan), the per-frame spin/
 * phase/pulse/breath/zoom/parallax update, and the three-composer bloom
 * rig are all copied character for character from the materialized
 * source. There is genuinely NO 3D geometry here — both quads are
 * `PlaneGeometry(2, 2)` screen fills; the wormhole is entirely an
 * analytic raymarch against the Flamm catenoid (`rho = a*cosh(y/b)`) done
 * per-pixel in the fragment shader. CONFIG values are the scene's own
 * "Default" variant (platinum/gold/sapphire), not re-tinted through this
 * project's blue Style — same "the constants ARE the spec" precedent as
 * Solaris's amber/orange and Aether Flux's platinum.
 *
 * Unlike Aether Flux, this scene's extra composers are NOT structurally
 * dead: the bridge quad is on `TORUS_SCENE` (so `torusComposer` blooms the
 * lattice wireframe itself) and the glow quad is on `BLOOM_SCENE` (so
 * `bloomComposer` blooms the throat glow) — both real, working passes.
 * The glow quad reads as invisible at the default `glowIntensity: 0`
 * (quiet by default, not dead code — a future tuning knob the source
 * itself ships off), which is a different situation from Aether Flux's
 * genuinely-empty layers and is not "fixed" here either way, per this
 * project's standing rule about not improvising on a verbatim ask.
 *
 * Documented deviations only, all invisible to the rendered look or
 * forced by this project's actual dependency versions:
 * - `THREE.WebGLRenderer` instead of `THREE.WebGL1Renderer` (removed in
 *   three@0.185, installed here) and `THREE.PlaneGeometry` instead of
 *   `PlaneBufferGeometry` (folded into the plain name years ago) — the
 *   same two non-negotiable renames already made in the other two scene
 *   files in this codebase.
 * - Tier-based DPR clamp instead of the source's flat `min(dpr, 1.5)`.
 * - No `extensions: { derivatives: true }` on the bridge material —
 *   `ShaderMaterial`'s `extensions` option in three@0.185 no longer
 *   exposes that WebGL1-era `GL_OES_standard_derivatives` flag at all
 *   (WebGL2, three's default context here, has `fwidth()`/derivatives
 *   natively). The shader's own `fwidth()` calls are unchanged.
 * - The render loop is `HeroScene.tsx`'s own rAF
 *   (`renderFrame(elapsedSeconds)`) instead of a freestanding one; `dt` is
 *   derived from consecutive `elapsedSeconds` values instead of the
 *   source's own `performance.now()` delta.
 * - `setPointer`/click/leave: `HeroScene.tsx` already supplies
 *   container-relative NDC (not aspect-corrected) via `setPointer(x, y)`;
 *   the source's own `ndc()` aspect-correction step
 *   (`if (a >= 1) x *= a; else y /= a`, then clamp ±2) is replicated here
 *   using the container's own tracked aspect instead of
 *   `window.innerWidth/innerHeight`. Click-zoom and pointer-leave-reset
 *   aren't part of `HeroSceneHandle`'s contract, so this builder attaches
 *   its own `pointerdown`/`pointerleave` window listeners directly (same
 *   pattern Aether Flux's click-burst already uses), removed in
 *   `dispose()`.
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

// Verbatim "Default" variant CONFIG from the materialized source.
const CONFIG = {
  lineColor: 0xeef3ff,
  throatTint: 0xffd9a6,
  rimTint: 0x5878ff,
  glowColor: 0x8fb4ff,

  throatRadius: 1.0,
  flareHeight: 1.7,
  cameraDistance: 14.5,
  cameraFov: 60.0,

  meridians: 60,
  ringSpacing: 1.0,

  lineWidth: 0.9,
  lineGain: 0.44,
  hazeMax: 0.263,
  throatBoost: 0.38,
  tintAmount: 0.3,
  tintFalloff: 3.0,
  fadeStart: 160.0,
  fadeEnd: 20000.0,
  vignette: 0.18,
  vignettePower: 1.6,
  horizonFloor: 1.0,
  seamGap: 1.5,

  spinSpeed: 0.022,
  driftSpeed: 0.12,
  breathAmp: 0.02,
  breathSpeed: 0.3,
  pulseAmp: 0.32,
  pulseDecay: 1.15,
  fadeInSeconds: 1.25,

  zoomAmount: 0.06,
  zoomDuration: 0.9,

  parallaxAz: 0.11,
  parallaxEl: 0.0,
  parallaxEase: 0.055,

  glowIntensity: 0.0,
  glowWidth: 0.15,
  glowHeight: 0.33,
  glowFalloff: 2.4,
};

const LAYERS = { NONE: 0, TORUS_SCENE: 1, BLOOM_SCENE: 2, ENTIRE_SCENE: 3 };

const hexToVec3 = (hex: number): THREE.Vector3 => {
  const r = ((hex >> 16) & 255) / 255;
  const g = ((hex >> 8) & 255) / 255;
  const b = (hex & 255) / 255;
  return new THREE.Vector3(r, g, b);
};

// ---------------------------------------------------------------------------
// Shaders — verbatim from the materialized source. Do not "clean up": the
// exact raymarch math and lattice function define the look.
// ---------------------------------------------------------------------------

const QUAD_VERT = /* glsl */ `
  void main(){ gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

const BRIDGE_FRAG = /* glsl */ `
  precision highp float;

  uniform vec3  iResolution;
  uniform float iTime, iAlpha, uAspect;
  uniform float iAz, iEl, iSpin, iPhase, iPulse, iBreath;
  uniform float uA, uB, uCamDist, uTanFov;
  uniform float uMeridians, uRingSpacing;
  uniform float uLineWidth, uLineGain, uHazeMax, uThroatBoost;
  uniform float uTintAmount, uTintFalloff;
  uniform float uFadeStart, uFadeEnd, uVignette, uVignettePower, uHorizonFloor;
  uniform float uPulseAmp;
  uniform float uSeamGap;
  uniform vec3  uLineColor, uThroatTint, uRimTint;

  const int   STEPS  = 72;
  const int   BISECT = 18;
  const float PI     = 3.14159265359;
  const float SPAN   = 15.0;

  float acoshx(float x){ x = max(x, 1.0); return log(x + sqrt(x * x - 1.0)); }
  float asinhx(float x){ return log(x + sqrt(x * x + 1.0)); }

  // signed "outside-ness": > 0 in the waist chamber the camera occupies,
  // < 0 inside the funnel.  Root = the catenoid  rho = a*cosh(y/b).
  float phiOf(float sig, float A, float Rm2, float cy, float vy, float a, float b){
    float R = sqrt(A * sig * sig + Rm2);
    return acoshx(R / a) - abs(cy + vy * sig) / b;
  }

  // one lattice family: crisp line, dissolving to a bounded haze once the
  // spacing drops under a pixel (this is what paints the horizon band)
  float lattice(float v, float per, float grad){
    float w = max(grad * uLineWidth, 1e-9);
    float d = abs(fract(v / per) - 0.5) * per;
    float s = 1.0 - clamp(d / w, 0.0, 1.0);
    s = s * s * (3.0 - 2.0 * s);
    float ratio = 2.0 * w / per;
    float avg = min(clamp(ratio, 0.0, 1.0), uHazeMax);
    float k = clamp((ratio - 0.30) / 0.70, 0.0, 1.0);
    return clamp(mix(s, avg, k), 0.0, 1.0);
  }

  void main(){
    vec2 p = gl_FragCoord.xy / iResolution.xy * 2.0 - 1.0;

    // breathing throat + click ripple through the bridge
    float a = uA * iBreath * (1.0 - iPulse * uPulseAmp * 0.25);
    float b = uB * (1.0 + iPulse * uPulseAmp * 0.35);

    // orbit camera (pointer parallax) — at rest this is (0, 0, D) looking at 0
    float ca = cos(iAz), sa = sin(iAz), ce = cos(iEl), se = sin(iEl);
    vec3  O  = uCamDist * vec3(sa * ce, se, ca * ce);
    vec3  fw = normalize(-O);
    vec3  rt = normalize(cross(fw, vec3(0.0, 1.0, 0.0)));
    vec3  up = cross(rt, fw);
    vec3  V  = normalize(fw + rt * (p.x * uTanFov * uAspect) + up * (p.y * uTanFov));

    float A    = max(V.x * V.x + V.z * V.z, 1e-8);
    float sqA  = sqrt(A);
    float tst  = -(O.x * V.x + O.z * V.z) / A;
    float Rm2  = max(O.x * O.x + O.z * O.z - A * tst * tst, 0.0);
    float cy   = O.y + V.y * tst;

    // scan sigma = t - tstar in an asinh-warped variable so the throat and
    // the far field are both resolved by the same fixed step count
    float sig0 = -tst;
    float w0   = asinhx(sqA * sig0 / a);
    float dw   = SPAN / float(STEPS);
    float ew   = exp(w0);
    float ed   = exp(dw);
    float iw   = 1.0 / ew;
    float id   = 1.0 / ed;
    float kSig = a / sqA;

    float sPrev = sig0;
    float pPrev = phiOf(sig0, A, Rm2, cy, V.y, a, b);
    float lo = 0.0, hi = 0.0;
    bool  hit = false;

    for (int i = 0; i < STEPS; i++){
      ew *= ed; iw *= id;
      float sg = kSig * 0.5 * (ew - iw);
      float ph = phiOf(sg, A, Rm2, cy, V.y, a, b);
      if (pPrev > 0.0 && ph <= 0.0){ lo = sPrev; hi = sg; hit = true; break; }
      sPrev = sg; pPrev = ph;
    }

    // near-equatorial rays never cross the catenoid — rather than stamp a hard
    // black seam across the middle, let them ride out to the farthest marched
    // sample so the horizon reads as one continuous surface top-to-bottom
    float miss = hit ? 0.0 : 1.0;
    if (hit){
      for (int i = 0; i < BISECT; i++){
        float m = 0.5 * (lo + hi);
        if (phiOf(m, A, Rm2, cy, V.y, a, b) > 0.0) lo = m; else hi = m;
      }
    } else {
      lo = sPrev; hi = sPrev;
    }

    float t = tst + 0.5 * (lo + hi);
    vec3  h = O + V * t;

    // lattice coordinates: rings drift along the bridge, meridians spin
    float ring = h.y + iPhase;
    float mer  = atan(h.z, h.x) + iSpin;

    float perR = 2.0 * PI * b / uMeridians * uRingSpacing;
    float perM = 2.0 * PI / uMeridians;

    float dR = fwidth(ring);
    float dM = min(fwidth(mer), fwidth(mod(mer + PI, 2.0 * PI)));

    float g = max(lattice(ring, perR, dR), lattice(mer, perM, dM));

    // shading — value structure: black field, fine bright wire
    float rr = clamp(abs(h.y) / (b * uTintFalloff), 0.0, 1.0);
    vec3  col = uLineColor;
    col = mix(col, uThroatTint, uTintAmount * (1.0 - smoothstep(0.0, 0.55, rr)));
    col = mix(col, uRimTint,    uTintAmount * smoothstep(0.35, 1.0, rr));

    float boost = 1.0 + uThroatBoost * (1.0 - smoothstep(0.0, 0.45, rr));
    float fade  = 1.0 - clamp((t - uFadeStart) / max(uFadeEnd - uFadeStart, 1e-3), 0.0, 1.0);
    // keep lit pixels (lines + horizon haze) above a floor so the far field and
    // the equatorial miss-fill never fade to a black seam — the sheets stay joined
    fade = max(fade, uHorizonFloor);
    float vig   = 1.0 - uVignette * pow(clamp(length(p) * 0.72, 0.0, 1.0), uVignettePower);

    // FAR-HORIZON gap: split the BACKGROUND where the receding upper & lower
    // sheets meet at the equator, WITHOUT touching the near throat. The seam is an
    // EQUATORIAL-DIRECTION ray (cy ~ 0, cy = the ray's height at closest approach
    // to the axis) — true for BOTH the near throat and the far horizon, so cy alone
    // can't tell them apart. Distance does: gate on t so only far hits (the
    // background horizon, t >> throat) get cut, leaving the central throat whole.
    // uSeamGap = half-width of the black band in cy (world height at the axis).
    float farNess = smoothstep(uCamDist * 1.7, uCamDist * 3.0, t);
    float eqNess  = 1.0 - smoothstep(0.0, max(uSeamGap, 1e-4), abs(cy));
    float gapMask = farNess * eqNess;

    float I = g * boost * fade * vig * uLineGain * iAlpha * (1.0 - gapMask);
    gl_FragColor = vec4(col * I, 1.0);
  }
`;

const GLOW_FRAG = /* glsl */ `
  precision highp float;
  uniform vec3  iResolution;
  uniform float uAspect, iAlpha, iPulse;
  uniform float uGlowIntensity, uGlowWidth, uGlowHeight, uGlowFalloff;
  uniform vec3  uGlowColor;
  void main(){
    vec2 q = gl_FragCoord.xy / iResolution.xy * 2.0 - 1.0;
    q.x *= uAspect;
    vec2 e = q / vec2(max(uGlowWidth, 1e-3), max(uGlowHeight, 1e-3));
    float d = length(e);
    float g = exp(-pow(d, uGlowFalloff));
    float amp = uGlowIntensity * (1.0 + iPulse * 0.9);
    gl_FragColor = vec4(uGlowColor * g * amp * iAlpha, 1.0);
  }
`;

const FINAL_VERT = /* glsl */ `
  varying vec2 vUv;
  void main(){ vUv = uv; gl_Position = vec4(position, 1.0); }
`;

const FINAL_FRAG = /* glsl */ `
  uniform sampler2D tDiffuse;
  uniform sampler2D torusTexture;
  uniform sampler2D bloomTexture;
  uniform sampler2D haloTexture;
  varying vec2 vUv;
  void main(){
    vec4 base  = texture2D(tDiffuse,     vUv);
    vec4 torus = texture2D(torusTexture, vUv);
    vec4 bloom = texture2D(bloomTexture, vUv);
    vec4 halo  = texture2D(haloTexture,  vUv);
    gl_FragColor = vec4(bloom.rgb + torus.rgb + base.rgb + halo.rgb, 1.0);
  }
`;

const FinalPass = {
  uniforms: {
    tDiffuse: { value: null as THREE.Texture | null },
    torusTexture: { value: null as THREE.Texture | null },
    bloomTexture: { value: null as THREE.Texture | null },
    haloTexture: { value: null as THREE.Texture | null },
  },
  vertexShader: FINAL_VERT,
  fragmentShader: FINAL_FRAG,
};

interface EinsteinRosenLatticeOptions {
  torusStrength: number;
  bloomStrength: number;
}

const buildEinsteinRosenLatticeScene = (
  container: HTMLElement,
  options: EinsteinRosenLatticeOptions,
): HeroSceneHandle => {
  const { torusStrength, bloomStrength } = options;
  const canvas = document.createElement("canvas");
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
  const { clientWidth, clientHeight } = container;
  // Tier-based, not the source's flat min(dpr, 1.5) — the one deliberate
  // perf deviation, invisible to the rendered look. See file header.
  const { dprClamp } = getTierBudget(clientWidth || window.innerWidth);
  const pixelRatio = Math.min(window.devicePixelRatio, dprClamp);
  renderer.setPixelRatio(pixelRatio);
  renderer.setSize(clientWidth || 1, clientHeight || 1);
  renderer.autoClear = false;
  renderer.setClearColor(0x000000, 1);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);

  // Dummy camera — RenderPass needs one, but every ray is rebuilt
  // analytically in the fragment shader from iAz/iEl/uCamDist; this
  // object's own transform is never actually used for projection.
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
  camera.position.set(0, 0, 5);
  camera.layers.enable(LAYERS.NONE);
  camera.layers.enable(LAYERS.TORUS_SCENE);
  camera.layers.enable(LAYERS.BLOOM_SCENE);
  camera.layers.enable(LAYERS.ENTIRE_SCENE);
  scene.add(camera);

  const uniforms = {
    iTime: { value: 0 },
    iAlpha: { value: 0 },
    iResolution: { value: new THREE.Vector3(1, 1, 1) },
    uAspect: { value: 1 },

    iAz: { value: 0 },
    iEl: { value: 0 },
    iSpin: { value: 0 },
    iPhase: { value: 0 },
    iPulse: { value: 0 },
    iBreath: { value: 1 },

    uA: { value: CONFIG.throatRadius },
    uB: { value: CONFIG.flareHeight },
    uCamDist: { value: CONFIG.cameraDistance },
    uTanFov: { value: Math.tan((CONFIG.cameraFov * Math.PI) / 360) },

    uMeridians: { value: CONFIG.meridians },
    uRingSpacing: { value: CONFIG.ringSpacing },

    uLineWidth: { value: CONFIG.lineWidth },
    uLineGain: { value: CONFIG.lineGain },
    uHazeMax: { value: CONFIG.hazeMax },
    uThroatBoost: { value: CONFIG.throatBoost },
    uTintAmount: { value: CONFIG.tintAmount },
    uTintFalloff: { value: CONFIG.tintFalloff },
    uFadeStart: { value: CONFIG.fadeStart },
    uFadeEnd: { value: CONFIG.fadeEnd },
    uVignette: { value: CONFIG.vignette },
    uVignettePower: { value: CONFIG.vignettePower },
    uHorizonFloor: { value: CONFIG.horizonFloor },
    uPulseAmp: { value: CONFIG.pulseAmp },
    uSeamGap: { value: CONFIG.seamGap },

    uLineColor: { value: hexToVec3(CONFIG.lineColor) },
    uThroatTint: { value: hexToVec3(CONFIG.throatTint) },
    uRimTint: { value: hexToVec3(CONFIG.rimTint) },

    uGlowColor: { value: hexToVec3(CONFIG.glowColor) },
    uGlowIntensity: { value: CONFIG.glowIntensity },
    uGlowWidth: { value: CONFIG.glowWidth },
    uGlowHeight: { value: CONFIG.glowHeight },
    uGlowFalloff: { value: CONFIG.glowFalloff },
  };

  const bridgeMaterial = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: QUAD_VERT,
    fragmentShader: BRIDGE_FRAG,
    depthTest: false,
    depthWrite: false,
    transparent: false,
    // No `extensions: { derivatives: true }` — that GL_OES_standard_derivatives
    // flag existed for WebGL1, where fwidth() needed an explicit extension
    // enable; three@0.185's ShaderMaterial no longer exposes it (its
    // `extensions` type only has clipCullDistance/multiDraw now) because
    // WebGL2 — three's default context here — has derivatives natively. The
    // shader's own fwidth() calls (dR/dM) work unchanged.
  });
  const bridge = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), bridgeMaterial);
  bridge.frustumCulled = false;
  bridge.renderOrder = 0;
  bridge.layers.enable(LAYERS.ENTIRE_SCENE);
  bridge.layers.enable(LAYERS.TORUS_SCENE);
  scene.add(bridge);

  const glowMaterial = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: QUAD_VERT,
    fragmentShader: GLOW_FRAG,
    depthTest: false,
    depthWrite: false,
    transparent: true,
    blending: THREE.AdditiveBlending,
  });
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), glowMaterial);
  glow.frustumCulled = false;
  glow.renderOrder = 1;
  glow.layers.enable(LAYERS.ENTIRE_SCENE);
  glow.layers.enable(LAYERS.BLOOM_SCENE);
  scene.add(glow);

  const renderScene = new RenderPass(scene, camera);

  const torusComposer = new EffectComposer(renderer);
  torusComposer.renderToScreen = false;
  torusComposer.addPass(renderScene);
  torusComposer.addPass(new ShaderPass(GammaCorrectionShader));
  const torusBloom = new UnrealBloomPass(
    new THREE.Vector2(clientWidth || 1, clientHeight || 1),
    torusStrength,
    0.2,
    0,
  );
  torusComposer.addPass(torusBloom);
  torusComposer.addPass(new ShaderPass(CopyShader));

  const bloomComposer = new EffectComposer(renderer);
  bloomComposer.renderToScreen = false;
  bloomComposer.addPass(renderScene);
  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(clientWidth || 1, clientHeight || 1),
    bloomStrength,
    0.55,
    0,
  );
  bloomComposer.addPass(bloomPass);
  bloomComposer.addPass(new ShaderPass(GammaCorrectionShader));

  const blackPixel = new THREE.DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1, THREE.RGBAFormat);
  blackPixel.needsUpdate = true;

  const finalComposer = new EffectComposer(renderer);
  finalComposer.addPass(renderScene);
  const finalPass = new ShaderPass(FinalPass);
  finalPass.uniforms.bloomTexture.value = bloomComposer.renderTarget1.texture;
  finalPass.uniforms.torusTexture.value = torusComposer.renderTarget1.texture;
  finalPass.uniforms.haloTexture.value = blackPixel;
  finalComposer.addPass(finalPass);

  // ---- interaction state ----
  let aspect = (clientWidth || 1) / (clientHeight || 1);
  let tx = 0;
  let ty = 0;
  let px = 0;
  let py = 0;
  let spin = 0;
  let phase = 0;
  let pulse = 0;
  let zoomStart = -1;
  let lastElapsed = 0;

  const setPointer = (x: number, y: number) => {
    // `HeroScene.tsx` supplies container-relative, non-aspect-corrected NDC
    // (y already flipped to screen-up); replicate the source's own
    // aspect-correction + clamp step here against the container's aspect
    // instead of window.innerWidth/innerHeight.
    let ax = x;
    let ay = y;
    if (aspect >= 1) ax *= aspect;
    else ay /= aspect;
    tx = Math.max(-2, Math.min(2, ax));
    ty = Math.max(-2, Math.min(2, ay));
  };

  const handlePointerDown = () => {
    if (zoomStart < 0) zoomStart = performance.now() / 1000;
  };
  const handlePointerLeave = () => {
    tx = 0;
    ty = 0;
  };
  window.addEventListener("pointerdown", handlePointerDown);
  window.addEventListener("pointerleave", handlePointerLeave);

  const renderStatic = () => {
    uniforms.iAlpha.value = 1;
    uniforms.iBreath.value = 1;
    uniforms.iSpin.value = 0;
    uniforms.iPhase.value = 0;
    uniforms.iPulse.value = 0;
    uniforms.uCamDist.value = CONFIG.cameraDistance;
    uniforms.iAz.value = 0;
    uniforms.iEl.value = 0;
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
    uniforms.iTime.value = elapsedSeconds;

    const f = Math.min(1, elapsedSeconds / Math.max(CONFIG.fadeInSeconds, 0.001));
    uniforms.iAlpha.value = f * f * (3 - 2 * f);

    spin += dt * CONFIG.spinSpeed;
    if (spin > Math.PI * 2) spin -= Math.PI * 2;
    uniforms.iSpin.value = spin;

    const ringPeriod = ((2 * Math.PI * CONFIG.flareHeight) / Math.max(CONFIG.meridians, 1)) * CONFIG.ringSpacing;
    phase += dt * CONFIG.driftSpeed;
    if (phase > ringPeriod) phase -= ringPeriod;
    uniforms.iPhase.value = phase;

    pulse *= Math.exp(-dt * CONFIG.pulseDecay);
    uniforms.iPulse.value = pulse;

    uniforms.iBreath.value = 1 + CONFIG.breathAmp * Math.sin(elapsedSeconds * CONFIG.breathSpeed);

    // click zoom — a small smooth push-in then back out (0 -> 1 -> 0)
    let zoom = 0;
    if (zoomStart >= 0) {
      const now = performance.now() / 1000;
      const zt = (now - zoomStart) / Math.max(CONFIG.zoomDuration, 0.001);
      if (zt >= 1) zoomStart = -1;
      else zoom = Math.sin(Math.PI * zt);
    }
    uniforms.uCamDist.value = CONFIG.cameraDistance * (1 - zoom * CONFIG.zoomAmount);

    const e = 1 - Math.pow(1 - Math.min(CONFIG.parallaxEase, 0.999), dt * 60);
    px += (tx - px) * e;
    py += (ty - py) * e;
    uniforms.iAz.value = px * CONFIG.parallaxAz;
    uniforms.iEl.value = py * CONFIG.parallaxEl;

    camera.layers.set(LAYERS.TORUS_SCENE);
    torusComposer.render();
    camera.layers.set(LAYERS.BLOOM_SCENE);
    bloomComposer.render();
    camera.layers.set(LAYERS.ENTIRE_SCENE);
    finalComposer.render();
  };

  const resize = (width: number, height: number) => {
    if (width <= 0 || height <= 0) return;
    aspect = width / height;
    uniforms.iResolution.value.set(width * renderer.getPixelRatio(), height * renderer.getPixelRatio(), 1);
    uniforms.uAspect.value = aspect;
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    const dpr = renderer.getPixelRatio();
    for (const composer of [torusComposer, bloomComposer, finalComposer]) {
      composer.setPixelRatio(dpr);
      composer.setSize(width, height);
    }
    finalPass.uniforms.bloomTexture.value = bloomComposer.renderTarget1.texture;
    finalPass.uniforms.torusTexture.value = torusComposer.renderTarget1.texture;
  };
  // Prime resolution/aspect once at construction — HeroScene.tsx's own
  // ResizeObserver fires resize() again on layout, but the first frame
  // needs real values already.
  resize(clientWidth || 1, clientHeight || 1);

  const dispose = () => {
    window.removeEventListener("pointerdown", handlePointerDown);
    window.removeEventListener("pointerleave", handlePointerLeave);
    bridge.geometry.dispose();
    bridgeMaterial.dispose();
    glow.geometry.dispose();
    glowMaterial.dispose();
    blackPixel.dispose();
    torusComposer.dispose();
    bloomComposer.dispose();
    finalComposer.dispose();
    renderer.dispose();
  };

  return { renderStatic, renderFrame, resize, setPointer, dispose, canvas };
};

/** Full-bleed Structural Engineering service-page background — the
 * source's own bloom strengths verbatim (torus 0.22, bloom 0.3). */
export const createEinsteinRosenLatticeHeroScene = (container: HTMLElement): HeroSceneHandle =>
  buildEinsteinRosenLatticeScene(container, { torusStrength: 0.22, bloomStrength: 0.3 });

/** Small, contained homepage-card version — same shaders/geometry/colours/
 * cursor interaction/spin as the hero, only the two composers' bloom
 * strength toned down (0.15 / 0.2) for the card's small buffer, per the
 * brief. Like Aether Flux's card (not Solaris's), no geometry reduction is
 * needed: both quads are a fixed screen-filling `PlaneGeometry(2, 2)`
 * regardless of canvas size, and the raymarch cost is per-pixel, not
 * per-instance, so there's no overdraw/instance-count knob to turn down
 * in the first place. */
export const createEinsteinRosenLatticeCardScene = (container: HTMLElement): HeroSceneHandle =>
  buildEinsteinRosenLatticeScene(container, { torusStrength: 0.15, bloomStrength: 0.2 });
