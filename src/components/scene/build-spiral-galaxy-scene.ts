/**
 * Spiral Galaxy — GetLayers' "slowly turning two-arm galaxy with a molten
 * gold core fading into deep-violet dust" scene
 * (`getlayers_search`/`getlayers_materialize`, id `spiral-galaxy`), pulled
 * as its portable single-HTML master and ported verbatim. No prior spec for
 * this scene existed anywhere in this project (checked `getlayers.json` and
 * the conversation itself) despite the request referencing "the exact same
 * spec as already provided" — pulled the real source instead of guessing,
 * same discipline as every other scene here, and every structural piece
 * (the `SphereGeometry(4.2, 200, 600)` re-hashed per-vertex into
 * radius/arm/angle with a spherical core bulge, the two-arm placement, the
 * scroll-driven dive/tilt, the cursor world-unproject "void" repel, the
 * three-composer rig, both the galaxy and atmosphere-mote shaders) is
 * copied character for character from the materialized source. CONFIG
 * colours (`colorCore #ffe7a8` warm gold / `colorEdge #6b2bff` violet,
 * `bgColor #0e0626`, `flameColor`/`flameColor2`/`atmoColor`) are the
 * scene's own "Default" variant, not Neural Monitor Style's blue tint —
 * same "the constants ARE the spec" precedent as every other verbatim
 * scene this project has pulled.
 *
 * Like `build-aurum-peak-scene.ts`/`build-einstein-rosen-lattice-scene.ts`,
 * the extra composers here are not a live bloom path: both the galaxy
 * points and the atmosphere motes sit on `LAYERS.ENTIRE_SCENE` only, never
 * `TORUS_SCENE`/`BLOOM_SCENE` — `torusComposer`/`bloomComposer` render an
 * empty scene every frame, and the additive glow that reads as "bloom" is
 * entirely the points' own `AdditiveBlending`. Kept exactly as the source
 * has it, per this project's standing rule about not "fixing" a verbatim
 * ask.
 *
 * Documented deviations only, all invisible to the rendered look or forced
 * by this project's actual dependency versions:
 * - `THREE.WebGLRenderer` instead of `THREE.WebGL1Renderer` (removed in
 *   three@0.185, installed here) — the same non-negotiable rename made in
 *   every other verbatim scene in this codebase.
 * - `renderer.shadowMap.enabled = true` / `THREE.VSMShadowMap` and
 *   `scene.fog` both kept verbatim (the source sets them) but are inert:
 *   nothing here casts/receives a shadow, and neither `ShaderMaterial` sets
 *   `fog: true` or reads a fog uniform/chunk — same "quiet by default, not
 *   dead code" situation `build-aurum-peak-scene.ts` documents for its own
 *   inert shadow-map setting.
 * - Tier-based DPR clamp instead of the source's flat
 *   `renderer.setPixelRatio(window.devicePixelRatio)`.
 * - The render loop is `HeroScene.tsx`'s own rAF
 *   (`renderFrame(elapsedSeconds)`) instead of the source's freestanding
 *   one; `uTime`/`uAppear`/`finalPass.uniforms.iTime` read `elapsedSeconds`
 *   directly in place of the source's own `performance.now()` deltas.
 * - **Scroll driver**: the source tracks `window.scrollY` itself
 *   (`updateScroll()`, a raw `scroll` listener). This project already has a
 *   shared, Lenis-bridged whole-page scroll signal
 *   (`getScrollSignalSnapshot().progress`, `src/hooks/scroll/
 *   use-scroll-signal.ts`) that `build-negentropy-scene.ts` and
 *   `build-planet-scene.ts` already read instead of a redundant listener —
 *   same substitution here, feeding the identical two-stage
 *   `scrollSmooth`/`scrollCurrent` damping the source itself does.
 * - Interaction (pointer parallax + the cursor "void" world-unproject) is
 *   window-level in the source itself
 *   (`window.addEventListener('mousemove'/'mouseout', ...)`) — matching
 *   this project's own established pattern (Aureole/Aurum Peak) with zero
 *   adaptation needed, since this canvas is always `pointer-events-none`.
 *   `setPointer` is therefore an intentional no-op.
 * - **Card variant**: this scene has no exposed "particle count" knob (the
 *   galaxy is a fixed `SphereGeometry` re-hashed per-vertex), so the card's
 *   lighter buffer comes from lower sphere segment counts
 *   (`90×260` vs. the hero's `200×600`, ~1/5 the vertex count) and a
 *   quarter the atmosphere motes (`80` vs. `300`) — the same "tone the
 *   buffer down for the card" latitude `createAureoleCardScene`/
 *   `createNegentropySpiralCardScene` already took, just applied to segment
 *   counts instead of a `count` option. The card also skips the
 *   scroll-driven dive/tilt entirely (no natural scroll range inside a
 *   small card) and keeps a fixed camera, same choice
 *   `createNegentropySpiralCardScene` made for its own card version. Bloom
 *   strengths/radii scaled to roughly 70% of the hero's, the same ratio
 *   Aureole's own card scaling used.
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

// Verbatim "Default" CONFIG from the materialized source.
const CONFIG = {
  bgColor: "#0e0626",
  flameColor: "#ffe7a8",
  flameColor2: "#6b2bff",
  flameAmt: 0.2,
  atmoColor: "#d9b0ff",
  atmoSize: 24,
  atmoSpeed: 1.0,
  colorEdge: "#6b2bff",
  colorCore: "#ffe7a8",
  opacity: 0.55,
  pointSize: 6,
  brightness: 1.5,
  armSpin: 0.4,
  tilt: -0.5,
  scale: 0.18,
  scrollDive: 30,
  scrollTilt: 0.5,
  parallax: 4,
  pointerRadius: 5,
  pointerStrength: 2.0,
};

const LAYERS = { NONE: 0, TORUS_SCENE: 1, BLOOM_SCENE: 2, ENTIRE_SCENE: 3 };
const CAM_Z = 48;

const hexToVec3 = (hex: string): THREE.Vector3 => {
  const n = parseInt(hex.slice(1), 16);
  return new THREE.Vector3(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
};
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

// ---------------------------------------------------------------------------
// Shaders — verbatim from the materialized source.
// ---------------------------------------------------------------------------
const GALAXY_VERT = /* glsl */ `
  uniform float uTime; uniform float uSize; uniform float uArmSpin; uniform float uScale;
  uniform vec3 uColEdge; uniform vec3 uColCore;
  uniform vec3 uCursor; uniform float uRepelRadius; uniform float uRepelStrength; uniform float uActivity;
  varying float vFade; varying vec3 vColor;
  void main() {
    float gRnd1 = fract(sin(dot(position.xyz, vec3(12.989, 78.233, 45.164))) * 43758.545);
    float gRnd2 = fract(sin(dot(position.xyz, vec3(93.989, 67.345, 54.256))) * 24634.634);
    float gRnd3 = fract(sin(dot(position.xyz, vec3(43.332, 11.235, 89.234))) * 56475.234);
    float gRnd4 = fract(sin(dot(position.xyz, vec3(75.321, 32.123, 23.456))) * 35432.123);

    float galaxyR = pow(gRnd1, 2.0) * 60.0 + pow(gRnd2, 3.0) * 30.0;
    float swirl = pow(galaxyR, 1.1) * 0.08;
    float armIndex = floor(gRnd2 * 2.0);
    float baseAngle = armIndex * 3.14159265;
    float uniformTheta = gRnd3 * 2.0 - 1.0;
    float dTheta = pow(uniformTheta, 5.0) * 3.14159;
    float theta = baseAngle + swirl + dTheta + uTime * uArmSpin;

    float gx = galaxyR * cos(theta);
    float gz = galaxyR * sin(theta);
    float gyDisc = pow(gRnd4 * 2.0 - 1.0, 3.0) * 1.5;
    vec3 basePos = vec3(gx, gyDisc, gz);

    float bulgeStrength = smoothstep(25.0, 0.0, galaxyR);
    float gRnd5 = fract(sin(gRnd1 * 44.44 + gRnd2) * 555.55);
    float gRnd6 = fract(sin(gRnd3 * 66.66 + gRnd4) * 777.77);
    float gRnd7 = fract(sin(gRnd5 * 88.88 + gRnd6) * 999.99);
    float phi = acos(gRnd5 * 2.0 - 1.0);
    float thetaS = gRnd6 * 6.2831853 + uTime * (uArmSpin * 2.0);
    float rS = pow(gRnd7, 2.0) * 18.0;
    vec3 bulge = vec3(rS * sin(phi) * cos(thetaS), rS * cos(phi), rS * sin(phi) * sin(thetaS));

    vec3 galaxyPos = mix(basePos, bulge, bulgeStrength);
    vec3 finalPos = galaxyPos * uScale;
    vec4 modelPosition = modelMatrix * vec4(finalPos, 1.0);
    vec3 toP = modelPosition.xyz - uCursor;
    float cd = length(toP);
    float fall = smoothstep(uRepelRadius, 0.0, cd);
    modelPosition.xyz += normalize(toP + vec3(0.0001)) * fall * uRepelStrength * uActivity;
    vec4 mvPosition = viewMatrix * modelPosition;

    float coreMix = smoothstep(80.0, 0.0, galaxyR);
    vColor = mix(uColEdge, uColCore, clamp(coreMix, 0.0, 1.0));

    float isOrb = step(0.98, fract(gRnd1 * 77.77));
    float starSize = mix(1.0, 3.0, isOrb);
    vFade = mix(0.7, 1.0, isOrb);

    gl_PointSize = uSize * starSize * (10.0 / -mvPosition.z);
    gl_PointSize = max(gl_PointSize, 1.5);
    gl_Position = projectionMatrix * mvPosition;
  }`;

const GALAXY_FRAG = /* glsl */ `
  uniform float uOpacity; uniform float uBrightness; uniform float uAppear;
  varying float vFade; varying vec3 vColor;
  void main() {
    vec2 xy = gl_PointCoord - 0.5;
    float ll = length(xy);
    if (ll > 0.5) discard;
    float a = smoothstep(0.5, 0.1, ll);
    gl_FragColor = vec4(vColor * uBrightness, vFade * a * uOpacity * uAppear);
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
    float tex = smoothstep(0.5, 0.0, l); gl_FragColor = vec4(uColor * tex, tex * vA * 0.6); }`;

const FinalPass = {
  uniforms: {
    iTime: { value: 0 },
    tDiffuse: { value: null as THREE.Texture | null },
    torusTexture: { value: null as THREE.Texture | null },
    bloomTexture: { value: null as THREE.Texture | null },
    haloTexture: { value: null as THREE.Texture | null },
    uBg: { value: hexToVec3(CONFIG.bgColor) },
    uFlameA: { value: hexToVec3(CONFIG.flameColor) },
    uFlameB: { value: hexToVec3(CONFIG.flameColor2) },
    uFlameAmt: { value: CONFIG.flameAmt },
  },
  vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position, 1.0); }`,
  fragmentShader: /* glsl */ `
    uniform float iTime; uniform sampler2D tDiffuse; uniform sampler2D bloomTexture; uniform sampler2D torusTexture; uniform sampler2D haloTexture;
    uniform vec3 uBg; uniform vec3 uFlameA; uniform vec3 uFlameB; uniform float uFlameAmt;
    varying vec2 vUv;
    vec3 warp3d(vec3 pos, float t){ float curv=.8,a=1.9,b=0.7; pos*=2.;
      pos.x+=curv*sin(t+a*pos.y)+t*b; pos.y+=curv*cos(t+a*pos.x);
      pos.y+=curv*sin(t+a*pos.z)+t*b; pos.z+=curv*cos(t+a*pos.y);
      pos.z+=curv*sin(t+a*pos.x)+t*b; pos.x+=curv*cos(t+a*pos.z);
      return 0.5+0.5*cos(pos.xyz+vec3(1,2,4)); }
    void main(){
      vec2 uv = 2.*vUv - 1.;
      vec3 w = pow(warp3d(vec3(uv.x, sin(uv.y), uv.y), iTime*1.5), vec3(1.5));
      vec3 flame = 1.5*uFlameA*w.x; flame*=w.y; flame += uFlameB*w.z;
      flame *= smoothstep(0.25, 1., abs(uv.y));
      float md = smoothstep(-0.7, 1., -uv.y*uv.x); flame *= md*md;
      vec3 bg = uBg * (1.0 - 0.4 * length(uv));
      vec3 halo = texture2D(haloTexture, vUv).xyz;
      gl_FragColor = vec4(bg + flame*uFlameAmt + texture2D(bloomTexture, vUv).xyz + texture2D(torusTexture, vUv).xyz + texture2D(tDiffuse, vUv).xyz + halo, 1.);
    }`,
};

interface SpiralGalaxyOptions {
  widthSegments: number;
  heightSegments: number;
  atmoCount: number;
  scrollDriven: boolean;
  torusBloom: { strength: number; radius: number; threshold: number };
  mainBloom: { strength: number; radius: number; threshold: number };
}

const buildSpiralGalaxyScene = (container: HTMLElement, options: SpiralGalaxyOptions): HeroSceneHandle => {
  const { widthSegments, heightSegments, atmoCount, scrollDriven, torusBloom, mainBloom } = options;
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
  const camera = new THREE.PerspectiveCamera(45, (clientWidth || 1) / (clientHeight || 1), 0.1, 400);
  camera.position.set(0, 0, CAM_Z);
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
    new UnrealBloomPass(
      new THREE.Vector2(clientWidth || 1, clientHeight || 1),
      torusBloom.strength,
      torusBloom.radius,
      torusBloom.threshold,
    ),
  );
  torusComposer.addPass(new ShaderPass(CopyShader));

  const bloomComposer = new EffectComposer(renderer);
  bloomComposer.renderToScreen = false;
  bloomComposer.addPass(renderScene);
  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(clientWidth || 1, clientHeight || 1),
    mainBloom.strength,
    mainBloom.radius,
    mainBloom.threshold,
  );
  bloomComposer.addPass(bloomPass);
  bloomComposer.addPass(new ShaderPass(GammaCorrectionShader));

  const finalPass = new ShaderPass(FinalPass);
  finalPass.uniforms.bloomTexture.value = bloomComposer.renderTarget1.texture;
  finalPass.uniforms.torusTexture.value = torusComposer.renderTarget1.texture;
  const finalComposer = new EffectComposer(renderer);
  finalComposer.addPass(renderScene);
  finalComposer.addPass(finalPass);

  // ---- galaxy points ----
  const galaxyUniforms = {
    uTime: { value: 0 },
    uAppear: { value: 0 },
    uColEdge: { value: hexToVec3(CONFIG.colorEdge) },
    uColCore: { value: hexToVec3(CONFIG.colorCore) },
    uOpacity: { value: CONFIG.opacity },
    uSize: { value: CONFIG.pointSize },
    uBrightness: { value: CONFIG.brightness },
    uArmSpin: { value: CONFIG.armSpin },
    uScale: { value: CONFIG.scale },
    uCursor: { value: new THREE.Vector3() },
    uRepelRadius: { value: CONFIG.pointerRadius },
    uRepelStrength: { value: CONFIG.pointerStrength },
    uActivity: { value: 0 },
  };
  const galaxyGeometry = new THREE.SphereGeometry(4.2, widthSegments, heightSegments);
  const galaxyMaterial = new THREE.ShaderMaterial({
    uniforms: galaxyUniforms,
    vertexShader: GALAXY_VERT,
    fragmentShader: GALAXY_FRAG,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const galaxyGroup = new THREE.Group();
  galaxyGroup.rotation.x = -CONFIG.tilt;
  const galaxyPoints = new THREE.Points(galaxyGeometry, galaxyMaterial);
  galaxyPoints.frustumCulled = false;
  galaxyPoints.layers.enable(LAYERS.ENTIRE_SCENE);
  galaxyGroup.add(galaxyPoints);
  scene.add(galaxyGroup);

  // ---- ambient atmosphere motes (camera-attached) ----
  const atmoPositions = new Float32Array(atmoCount * 3);
  const atmoSizes = new Float32Array(atmoCount);
  for (let i = 0; i < atmoCount; i++) {
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
  const mouseTarget = { x: 0, y: 0 };
  const mouse = { x: 0, y: 0 };
  const pointerWorld = new THREE.Vector3();
  let pointerActive = false;
  let pointerActivity = 0;
  let lastMoveElapsed = 0;
  const ndc = new THREE.Vector3();
  const dir = new THREE.Vector3();
  const target = new THREE.Vector3();

  const handleMouseMove = (e: MouseEvent) => {
    mouseTarget.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouseTarget.y = -((e.clientY / window.innerHeight) * 2 - 1);
    pointerActive = true;
    lastMoveElapsed = lastElapsed;
  };
  const handleMouseOut = () => {
    pointerActive = false;
  };
  window.addEventListener("mousemove", handleMouseMove, { passive: true });
  window.addEventListener("mouseout", handleMouseOut, { passive: true });

  const updatePointerWorld = () => {
    target.set(0, 0, 0);
    if (pointerActive) {
      ndc.set(mouse.x, mouse.y, 0.5).unproject(camera);
      dir.copy(ndc).sub(camera.position).normalize();
      const dn = dir.z;
      if (Math.abs(dn) > 1e-4) {
        const tt = -camera.position.z / dn;
        if (tt > 0 && Number.isFinite(tt)) target.copy(camera.position).addScaledVector(dir, tt);
      }
    }
    pointerWorld.lerp(target, 0.12);
    const idle = lastElapsed - lastMoveElapsed;
    pointerActivity += ((pointerActive && idle < 3 ? 1 : 0) - pointerActivity) * 0.06;
  };

  // ---- scroll (double-damped, from the shared scroll signal — see file header) ----
  let scrollSmooth = 0;
  let scrollCurrent = 0;
  let lastElapsed = 0;
  let appearStart: number | null = null;

  const renderStatic = () => {
    galaxyUniforms.uAppear.value = 1;
    camera.position.set(0, 0, CAM_Z);
    camera.lookAt(0, 0, 0);
    camera.layers.set(LAYERS.TORUS_SCENE);
    torusComposer.render();
    camera.layers.set(LAYERS.BLOOM_SCENE);
    bloomComposer.render();
    camera.layers.set(LAYERS.ENTIRE_SCENE);
    finalComposer.render();
  };

  const renderFrame = (elapsedSeconds: number) => {
    lastElapsed = elapsedSeconds;
    if (appearStart === null) appearStart = elapsedSeconds;
    const t = elapsedSeconds;
    galaxyUniforms.uTime.value = t;

    if (scrollDriven) {
      const scrollTarget = THREE.MathUtils.clamp(getScrollSignalSnapshot().progress, 0, 1);
      scrollSmooth = lerp(scrollSmooth, scrollTarget, 0.1);
      scrollCurrent = lerp(scrollCurrent, scrollSmooth, 0.06);
    }
    mouse.x = lerp(mouse.x, mouseTarget.x, 0.06);
    mouse.y = lerp(mouse.y, mouseTarget.y, 0.06);

    camera.position.set(
      mouse.x * CONFIG.parallax,
      mouse.y * CONFIG.parallax,
      CAM_Z - (scrollDriven ? scrollCurrent * CONFIG.scrollDive : 0),
    );
    camera.lookAt(0, 0, 0);
    galaxyGroup.rotation.x = -(CONFIG.tilt + (scrollDriven ? scrollCurrent * CONFIG.scrollTilt : 0));
    galaxyGroup.rotation.z = mouse.x * 0.12;
    updatePointerWorld();

    galaxyUniforms.uCursor.value.copy(pointerWorld);
    galaxyUniforms.uActivity.value = pointerActivity;
    const elapsedSinceAppear = t - appearStart;
    galaxyUniforms.uAppear.value = Math.max(0, Math.min(1, (elapsedSinceAppear - 0.2) / 1.6));

    atmoUniforms.uTime.value = t * CONFIG.atmoSpeed * 8.0;
    atmoPoints.position.copy(camera.position);
    finalPass.uniforms.iTime.value = t;

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
    window.removeEventListener("mouseout", handleMouseOut);
    galaxyGeometry.dispose();
    galaxyMaterial.dispose();
    atmoGeometry.dispose();
    atmoMaterial.dispose();
    torusComposer.dispose();
    bloomComposer.dispose();
    finalComposer.dispose();
    renderer.dispose();
  };

  return { renderStatic, renderFrame, resize, setPointer, dispose, canvas };
};

/** Full-bleed Telecom Services service-page background — the source's own
 * numbers verbatim (200×600 sphere segments, 300 atmosphere motes,
 * scroll-driven dive/tilt, bloom 0.22/0.2/0 torus + 0.6/0.6/0 main). */
export const createSpiralGalaxyHeroScene = (container: HTMLElement): HeroSceneHandle =>
  buildSpiralGalaxyScene(container, {
    widthSegments: 200,
    heightSegments: 600,
    atmoCount: 300,
    scrollDriven: true,
    torusBloom: { strength: 0.22, radius: 0.2, threshold: 0 },
    mainBloom: { strength: 0.6, radius: 0.6, threshold: 0 },
  });

/** Small, contained homepage-card version — same shaders/palette as the
 * hero; lighter sphere segments and atmosphere-mote count for the card's
 * small buffer, no scroll dive (no natural scroll range inside a card),
 * bloom toned down to roughly 70% of the hero's, per the file header. */
export const createSpiralGalaxyCardScene = (container: HTMLElement): HeroSceneHandle =>
  buildSpiralGalaxyScene(container, {
    widthSegments: 90,
    heightSegments: 260,
    atmoCount: 80,
    scrollDriven: false,
    torusBloom: { strength: 0.15, radius: 0.14, threshold: 0 },
    mainBloom: { strength: 0.42, radius: 0.42, threshold: 0 },
  });
