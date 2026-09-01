/**
 * The cinematic Earth globe — ported from GetLayers' "Ascend" template
 * (`src/scene/planet.js`), not rewritten: a GLTF earth with a day/night-
 * lights/rim/ocean shader, a soft atmosphere halo, three drifting cloud
 * shells, ambient motes, a starfield, golden radar-ping land markers, and a
 * second layer of glowing accent-blue pins at Geoporte's seven real project
 * countries — composited through a bloom + corner-flame final pass. A single
 * scroll-driven `worldGroup` (position + uniform scale only) carries the
 * whole planet through three keyframe stops: huge and low on the hero, small
 * and swung side to side mid-scroll, settled small near the end.
 *
 * A persistent, app-lifetime singleton — same category as
 * `ambient-background-renderer.ts` (ref-counted start/stop, one canvas
 * appended straight to `document.body`), not the per-route `HeroScene`
 * pattern, since this mounts once in the root layout and never tears down on
 * navigation. See obsidian/meta/decisions-log.md for the ADR on why this
 * introduces `EffectComposer`/bloom to the codebase for the first time, and
 * why the `three` dependency itself was never touched even though the
 * template pins `three@0.143.0` — see the two fixes marked below.
 */
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { GammaCorrectionShader } from "three/examples/jsm/shaders/GammaCorrectionShader.js";
import { CopyShader } from "three/examples/jsm/shaders/CopyShader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { HERO_SCENE_COLORS as COLOR } from "./hero-scene-colors";
import { PROJECT_LOCATIONS, latLonToVector3 } from "./world-globe";
import { disposeSceneObjects } from "@/lib/scene/shared-viewport-renderer";
import { getScrollSignalSnapshot } from "@/hooks/scroll/use-scroll-signal";

const CONFIG = {
  rimColor: "#c1faff",
  rimPower: 2.4,
  nightLights: 10,
  terrainDepth: 0.33,
  terrainShade: 1.3,
  oceanGlint: 0.45,
  oceanDeep: 0.12,
  oceanFlow: 3,
  oceanFlowSpeed: 0.8,
  oceanFlowScale: 2.1,
  glowColor: "#3a6cff",
  glowIntensity: 3.35,
  planetRadius: 1.95,
  spin: 0.03,
  initRotation: 2.07,
  tilt: 0.37,
  cloud1Height: 1.005,
  cloud1Opacity: 0.6,
  cloud1Spin: 0.06,
  cloud2Height: 1.03,
  cloud2Opacity: 0.5,
  cloud2Spin: 0.14,
  cloud3Height: 1.075,
  cloud3Opacity: 0.5,
  cloud3Spin: 0.1,
  bgColor: "#040a1e",
  flameColor: "#3a6cff",
  flameColor2: "#c1faff",
  flameAmt: 0.15,
  atmoColor: "#9fc4ff",
  atmoSize: 22,
  atmoSpeed: 0.8,
  starColor: "#cfe0ff",
  starSize: 1.6,
  starFlicker: 1,
  markerColor: "#ffd27a",
  markerSize: 16,
  markerSpeed: 0.5,
  pinColor: COLOR.glow,
  pinSize: 20,
} as const;

/** The only counts that scale by device tier — every other CONFIG value is a
 * fixed art-direction choice, not a performance budget. Desktop matches the
 * canonical template's own numbers exactly; tablet is roughly halved, mobile
 * roughly halved again (see ADR-0078 — capable phones now mount this scene
 * too, so it needs its own budget rather than never being reached). */
interface PlanetTierCounts {
  starCount: number;
  atmoCount: number;
  markerCount: number;
}
const TIER_COUNTS: Record<"mobile" | "tablet" | "desktop", PlanetTierCounts> = {
  mobile: { starCount: 350, atmoCount: 80, markerCount: 15 },
  tablet: { starCount: 700, atmoCount: 160, markerCount: 30 },
  desktop: { starCount: 1400, atmoCount: 320, markerCount: 60 },
};

const LAYERS = { NONE: 0, TORUS_SCENE: 1, BLOOM_SCENE: 2, ENTIRE_SCENE: 3 };
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

interface KeyframeStop {
  p: number;
  v: number;
}

/** Piecewise smoothstep interpolation over keyframe stops (`p` ascending). */
const sample = (stops: KeyframeStop[], p: number): number => {
  if (p <= stops[0].p) return stops[0].v;
  for (let i = 1; i < stops.length; i++) {
    if (p <= stops[i].p) {
      const a = stops[i - 1];
      const b = stops[i];
      const t = (p - a.p) / (b.p - a.p);
      const e = t * t * (3 - 2 * t);
      return a.v + (b.v - a.v) * e;
    }
  }
  return stops[stops.length - 1].v;
};

const hexToVec3 = (hex: string): THREE.Vector3 => {
  const n = parseInt(hex.slice(1), 16);
  return new THREE.Vector3(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
};

const SNOISE = `
  vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
  vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
  float snoise(vec3 v){
    const vec2 C = vec2(1.0/6.0, 1.0/3.0); const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i = floor(v + dot(v, C.yyy)); vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz); vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy); vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + 1.0 * C.xxx; vec3 x2 = x0 - i2 + 2.0 * C.xxx; vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;
    i = mod(i, 289.0);
    vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 1.0/7.0; vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z *ns.z);
    vec4 x_ = floor(j * ns.z); vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ *ns.x + ns.yyyy; vec4 y = y_ *ns.x + ns.yyyy; vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy); vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0)*2.0 + 1.0; vec4 s1 = floor(b1)*2.0 + 1.0; vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy; vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
    vec3 p0 = vec3(a0.xy,h.x); vec3 p1 = vec3(a0.zw,h.y); vec3 p2 = vec3(a1.xy,h.z); vec3 p3 = vec3(a1.zw,h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.5 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0); m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }`;

const FinalPass = {
  uniforms: {
    iTime: { value: 0 },
    tDiffuse: { value: null },
    torusTexture: { value: null },
    bloomTexture: { value: null },
    haloTexture: { value: null },
    uBg: { value: hexToVec3(CONFIG.bgColor) },
    uFlameA: { value: hexToVec3(CONFIG.flameColor) },
    uFlameB: { value: hexToVec3(CONFIG.flameColor2) },
    uFlameAmt: { value: CONFIG.flameAmt },
  },
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position, 1.0); }`,
  fragmentShader: `
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

const firstMesh = (obj: THREE.Object3D): THREE.Mesh | null => {
  let found: THREE.Mesh | null = null;
  obj.traverse((o) => {
    if (!found && (o as THREE.Mesh).isMesh) found = o as THREE.Mesh;
  });
  return found;
};

export interface PlanetBackgroundOptions {
  dprClamp: number;
  tier: "mobile" | "tablet" | "desktop";
}

/** Module-level singleton state — ref-counted, same pattern as
 * `ambient-background-renderer.ts`, since this is the same "one persistent
 * app-lifetime scene" category, not a per-route hero. */
let renderer: THREE.WebGLRenderer | null = null;
let canvasEl: HTMLCanvasElement | null = null;
let rafId: number | null = null;
let disposeContent: (() => void) | null = null;
let refCount = 0;

const handleResizeFactory = (camera: THREE.PerspectiveCamera, composers: EffectComposer[]) => {
  return () => {
    if (!renderer) return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    const dpr = renderer.getPixelRatio();
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    for (const c of composers) {
      c.setPixelRatio(dpr);
      c.setSize(w, h);
    }
  };
};

const buildScene = (canvas: HTMLCanvasElement, options: PlanetBackgroundOptions) => {
  const counts = TIER_COUNTS[options.tier];

  /* ---------- RENDERER / SCENE / CAMERA ----------
     Two fixes from the canonical `three@0.143.0` source, both confirmed
     against this project's installed `three@0.185.1` (WebGL1Renderer and
     sRGBEncoding no longer exist there): WebGLRenderer instead of
     WebGL1Renderer, and outputColorSpace instead of outputEncoding. */
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, options.dprClamp));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.VSMShadowMap;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);
  const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 200);
  camera.position.set(0, 0, 8);
  camera.layers.enable(LAYERS.TORUS_SCENE);
  camera.layers.enable(LAYERS.BLOOM_SCENE);
  camera.layers.enable(LAYERS.ENTIRE_SCENE);
  scene.add(camera);

  const ambientLight = new THREE.AmbientLight(0xffffff, 1.8);
  ambientLight.layers.enable(LAYERS.ENTIRE_SCENE);
  scene.add(ambientLight);
  const sun = new THREE.DirectionalLight(0xffffff, 0.8);
  sun.position.set(0, 10, 2);
  sun.layers.enable(LAYERS.ENTIRE_SCENE);
  scene.add(sun);

  /* ---------- COMPOSER ---------- */
  const renderScene = new RenderPass(scene, camera);
  const torusComposer = new EffectComposer(renderer);
  torusComposer.renderToScreen = false;
  torusComposer.addPass(renderScene);
  torusComposer.addPass(new ShaderPass(GammaCorrectionShader));
  torusComposer.addPass(new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.22, 0.2, 0));
  torusComposer.addPass(new ShaderPass(CopyShader));
  const bloomComposer = new EffectComposer(renderer);
  bloomComposer.renderToScreen = false;
  bloomComposer.addPass(renderScene);
  bloomComposer.addPass(new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.5, 0.6, 0));
  bloomComposer.addPass(new ShaderPass(GammaCorrectionShader));
  const finalPass = new ShaderPass(FinalPass);
  (finalPass.uniforms.bloomTexture as { value: THREE.Texture }).value = bloomComposer.renderTarget1.texture;
  (finalPass.uniforms.torusTexture as { value: THREE.Texture }).value = torusComposer.renderTarget1.texture;
  const finalComposer = new EffectComposer(renderer);
  finalComposer.addPass(renderScene);
  finalComposer.addPass(finalPass);

  /* ---------- ORBIT CONTROLS ----------
     Kept faithful to the canonical source even though `autoRotate` is 0 and
     input is disabled here — the planet's actual rotation is driven
     manually below (`planetGroup.rotation.y`), not by OrbitControls. Ported
     as-is rather than removed, to stay a port and not a rewrite. */
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.enablePan = false;
  controls.enabled = false;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0;
  controls.minDistance = 3.5;
  controls.maxDistance = 16;
  controls.target.set(0, 0, 0);

  /* ---------- PLANET ASSEMBLY ---------- */
  const worldGroup = new THREE.Group();
  scene.add(worldGroup);
  const planetGroup = new THREE.Group();
  planetGroup.rotation.z = CONFIG.tilt;
  worldGroup.add(planetGroup);
  const cloudGroup = new THREE.Group();
  cloudGroup.rotation.z = CONFIG.tilt;
  cloudGroup.visible = false;
  worldGroup.add(cloudGroup);
  const planetTime = { value: 0 };
  const cloudTime = { value: 0 };
  let glowMat: THREE.ShaderMaterial | null = null;
  let glowMesh: THREE.Mesh | null = null;
  let spinPhase = 0;
  let entryActive = false;
  let entryT = 0;
  const ENTRY_DUR = 1.9;
  const ENTRY_START_Y = -6.5;

  /* ---------- SCROLL STORYTELLING ----------
     Scroll progress (0..1 down the page) drives the planet's position +
     scale through keyframe stops — hero: huge globe, low, half below the
     fold; then zooms out and swings side to side before settling near the
     end. `curP` reads from this project's own shared whole-page scroll
     signal (`getScrollSignalSnapshot().progress`, Lenis-smoothed, already
     used by `ScrollProgressBar`) instead of the canonical source's raw
     `window.scrollY / maxScroll` — same 0..1 range, so every keyframe stop
     below is unchanged from the template. */
  const STOPS_X: KeyframeStop[] = [
    { p: 0, v: 0 },
    { p: 0.32, v: -3.1 },
    { p: 0.64, v: 3.2 },
    { p: 1, v: 0 },
  ];
  // Hero stop (p: 0) only — was { v: -4.5 }, "huge globe, low, half below the
  // fold" per the ported template's own design (see the comment above). The
  // brief now explicitly requires the globe fully visible behind the hero,
  // which that pose contradicts, so it's tuned smaller/higher here. Every
  // other stop (0.32/0.64/1, the mid-scroll swing and settle) is untouched.
  const STOPS_Y: KeyframeStop[] = [
    { p: 0, v: -1.3 },
    { p: 0.32, v: 0.55 },
    { p: 0.64, v: 0.45 },
    { p: 1, v: 0.15 },
  ];
  const STOPS_S: KeyframeStop[] = [
    { p: 0, v: 1.35 },
    { p: 0.32, v: 1.0 },
    { p: 0.64, v: 0.92 },
    { p: 1, v: 1.12 },
  ];
  let curX = STOPS_X[0].v;
  let curY = STOPS_Y[0].v;
  let curS = STOPS_S[0].v;
  let curP = 0;
  worldGroup.position.set(curX, curY, 0);
  worldGroup.scale.setScalar(curS);

  const applyPlanetShader = (material: THREE.MeshStandardMaterial, nightTex: THREE.Texture | null) => {
    material.onBeforeCompile = (shader) => {
      shader.uniforms.time = planetTime;
      shader.uniforms.noiseScale = { value: 30.0 };
      shader.uniforms.speedX = { value: 1.5 };
      shader.uniforms.speedY = { value: 2.0 };
      shader.uniforms.speedZ = { value: 2.5 };
      shader.uniforms.rimColor = { value: hexToVec3(CONFIG.rimColor) };
      shader.uniforms.rimPower = { value: CONFIG.rimPower };
      shader.uniforms.nightBlendTexture = { value: nightTex };
      shader.uniforms.nightLights = { value: CONFIG.nightLights };
      shader.uniforms.terrainDepth = { value: CONFIG.terrainDepth };
      shader.uniforms.terrainShade = { value: CONFIG.terrainShade };
      shader.uniforms.oceanGlint = { value: CONFIG.oceanGlint };
      shader.uniforms.oceanDeep = { value: CONFIG.oceanDeep };
      shader.uniforms.oceanFlow = { value: CONFIG.oceanFlow };
      shader.uniforms.oceanFlowSpeed = { value: CONFIG.oceanFlowSpeed };
      shader.uniforms.oceanFlowScale = { value: CONFIG.oceanFlowScale };
      shader.vertexShader = `varying vec2 vCustomUv;\n` + shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace(
        "void main() {",
        "void main() {\n  vCustomUv = uv;",
      );
      shader.fragmentShader =
        `
        uniform float time; uniform float noiseScale; uniform float speedX; uniform float speedY; uniform float speedZ;
        uniform vec3 rimColor; uniform float rimPower; uniform sampler2D nightBlendTexture; uniform float nightLights;
        uniform float terrainDepth; uniform float terrainShade;
        uniform float oceanGlint; uniform float oceanDeep; uniform float oceanFlow;
        uniform float oceanFlowSpeed; uniform float oceanFlowScale;
        varying vec2 vCustomUv;
        ${SNOISE}
      ` + shader.fragmentShader;
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <dithering_fragment>",
        `#include <dithering_fragment>
        vec3 normalizedNormal = normalize(vNormal);
        vec3 viewDir = normalize(vViewPosition);
        float rim = 1.0 - max(dot(viewDir, normalizedNormal), 0.0);
        rim = pow(rim, rimPower); rim = pow(rim, 1.5); rim *= 0.7;
        vec3 currentColor = gl_FragColor.rgb;
        float blueDom = currentColor.b - max(currentColor.r, currentColor.g);
        float waterMask = clamp(smoothstep(-0.005, 0.03, blueDom), 0.0, 1.0);
        float shimmer = snoise(vec3(vCustomUv.x * noiseScale + time * speedX, vCustomUv.y * noiseScale - time * speedY, time * speedZ));
        gl_FragColor.rgb += waterMask * shimmer * 0.025;
        float fT = time * oceanFlowSpeed * 4.0;
        float fS = 4.0 * oceanFlowScale;
        float warp = snoise(vec3(vCustomUv.x * fS - fT * 0.5, vCustomUv.y * fS + fT * 0.4, fT * 0.5));
        float flow = snoise(vec3(vCustomUv.x * fS * 2.0 + fT * 0.6 + warp, vCustomUv.y * fS * 2.0 - fT * 0.5, fT * 0.7));
        flow = warp * 0.6 + flow * 0.4;
        gl_FragColor.rgb += waterMask * flow * 0.12 * oceanFlow;
        gl_FragColor.rgb = mix(gl_FragColor.rgb, vec3(0.01, 0.06, 0.16), waterMask * oceanDeep);
        vec3 finalColor = mix(gl_FragColor.rgb, rimColor, rim);
        gl_FragColor = vec4(finalColor, 1.0);
        vec3 surfPos = -vViewPosition;
        float terrH = dot(texture2D(map, vCustomUv).rgb, vec3(0.299, 0.587, 0.114));
        vec3 sigX = dFdx(surfPos), sigY = dFdy(surfPos);
        vec3 vR1 = cross(sigY, normalizedNormal), vR2 = cross(normalizedNormal, sigX);
        float fDet = dot(sigX, vR1);
        vec3 vGrad = sign(fDet) * (dFdx(terrH) * vR1 + dFdy(terrH) * vR2);
        vec3 bumpedNormal = normalize(abs(fDet) * normalizedNormal - terrainDepth * vGrad);
        vec3 shadeNormal = mix(bumpedNormal, normalizedNormal, waterMask);
        vec3 cityLights = texture2D(nightBlendTexture, vCustomUv).rgb * gl_FragColor.rgb * nightLights;
        vec3 viewSunDir = normalize(vec3(-0.9, 0.18, 0.4));
        float ndl = dot(normalizedNormal, viewSunDir);
        float dayAmt = smoothstep(-0.05, 0.35, ndl);
        float relief = dot(shadeNormal, viewSunDir) - ndl;
        gl_FragColor.rgb *= clamp(1.0 + relief * terrainShade * dayAmt, 0.55, 1.6);
        float nightFactor  = smoothstep(0.18, -0.30, ndl);
        float lightsFactor = smoothstep(0.30, -0.35, ndl);
        gl_FragColor.rgb = mix(gl_FragColor.rgb, gl_FragColor.rgb * 0.08, nightFactor);
        gl_FragColor.rgb += cityLights * lightsFactor;
        vec3 halfDir = normalize(viewSunDir + viewDir);
        float ripple = snoise(vec3(vCustomUv * 240.0, time * 4.0));
        float ndh = max(dot(normalizedNormal, halfDir) + ripple * 0.02, 0.0);
        float glint = pow(ndh, 140.0);
        gl_FragColor.rgb += glint * waterMask * dayAmt * oceanGlint * vec3(1.0, 0.97, 0.88);
      `,
      );
    };
    material.needsUpdate = true;
  };

  const addAtmosphereGlow = (radius: number) => {
    const g = new THREE.PlaneGeometry(2, 2);
    glowMat = new THREE.ShaderMaterial({
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uGlow: { value: hexToVec3(CONFIG.glowColor) },
        uIntensity: { value: CONFIG.glowIntensity },
      },
      vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: `uniform vec3 uGlow; uniform float uIntensity; varying vec2 vUv;
        void main(){
          float d = length(vUv - 0.5) * 2.0;
          float a = pow(clamp(1.0 - d, 0.0, 1.0), 2.2);
          gl_FragColor = vec4(uGlow * a * uIntensity, a);
        }`,
    });
    glowMesh = new THREE.Mesh(g, glowMat);
    glowMesh.scale.setScalar(radius * 2.3);
    glowMesh.layers.enable(LAYERS.ENTIRE_SCENE);
    worldGroup.add(glowMesh);
  };

  const CLOUD_LAYERS = [
    { hKey: "cloud1Height", oKey: "cloud1Opacity", sKey: "cloud1Spin", ry: 0.0, phase: 0.0 },
    { hKey: "cloud2Height", oKey: "cloud2Opacity", sKey: "cloud2Spin", ry: 2.2, phase: 13.0 },
    { hKey: "cloud3Height", oKey: "cloud3Opacity", sKey: "cloud3Spin", ry: 4.3, phase: 27.0 },
  ] as const;
  const cloudMeshes: Array<{ mesh: THREE.Mesh; spinKey: (typeof CLOUD_LAYERS)[number]["sKey"]; phase: number }> = [];

  const addClouds = () => {
    const tex = new THREE.TextureLoader().load("/assets/planet/planet-clouds.png");
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(5, 5);
    for (const layer of CLOUD_LAYERS) {
      const g = new THREE.SphereGeometry(CONFIG.planetRadius * CONFIG[layer.hKey], 64, 64);
      const mat = new THREE.MeshStandardMaterial({ map: tex, transparent: true, depthWrite: false });
      mat.onBeforeCompile = (shader) => {
        shader.uniforms.uTime = cloudTime;
        shader.uniforms.noiseScale = { value: 20.0 };
        shader.uniforms.uSpeedX = { value: 1.0 };
        shader.uniforms.uSpeedY = { value: 2.0 };
        shader.uniforms.uSpeedZ = { value: 2.0 };
        shader.uniforms.uOpacity = { value: CONFIG[layer.oKey] };
        shader.uniforms.uPhase = { value: layer.phase };
        shader.vertexShader = `varying vec2 vCloudUv;\n` + shader.vertexShader;
        shader.vertexShader = shader.vertexShader.replace(
          "void main() {",
          "void main() {\n  vCloudUv = uv;",
        );
        shader.fragmentShader =
          `
          uniform float uTime; uniform float noiseScale; uniform float uSpeedX; uniform float uSpeedY; uniform float uSpeedZ; uniform float uOpacity; uniform float uPhase;
          varying vec2 vCloudUv;
          ${SNOISE}
        ` + shader.fragmentShader;
        shader.fragmentShader = shader.fragmentShader.replace(
          "#include <dithering_fragment>",
          `#include <dithering_fragment>
          gl_FragColor.rgb = vec3(1.0);
          float cloudNoise = snoise(vec3(vCloudUv.x * noiseScale + uTime * uSpeedX + uPhase, vCloudUv.y * noiseScale - uTime * uSpeedY + uPhase, uTime * uSpeedZ + uPhase));
          float cloudNdv = max(dot(normalize(vNormal), normalize(vViewPosition)), 0.0);
          float cloudEdge = pow(1.0 - cloudNdv, 3.0);
          float cloudMod = mix(cloudNoise, 1.0, cloudEdge);
          float cloudNdl = dot(normalize(vNormal), normalize(vec3(-0.9, 0.18, 0.4)));
          float cloudDay = 1.0 - smoothstep(0.30, -0.30, cloudNdl) * 0.9;
          gl_FragColor.a *= cloudMod * uOpacity * cloudDay;
        `,
        );
      };
      mat.needsUpdate = true;
      const clouds = new THREE.Mesh(g, mat);
      clouds.rotation.y = layer.ry;
      clouds.renderOrder = 2;
      clouds.layers.enable(LAYERS.ENTIRE_SCENE);
      cloudGroup.add(clouds);
      cloudMeshes.push({ mesh: clouds, spinKey: layer.sKey, phase: layer.ry });
    }
  };
  addClouds();

  const draco = new DRACOLoader();
  // Self-hosted, not the gstatic.com CDN the template points at — this
  // project's own convention (see optimize-3d-scene skill) keeps decoders
  // local so a background visual never depends on an external host.
  draco.setDecoderPath("/draco/");
  const gltfLoader = new GLTFLoader();
  gltfLoader.setDRACOLoader(draco);

  /** The seven glowing accent-blue pins — Geoporte's real project countries,
   * the same list/projection the Stats globe and Advisory Services hero
   * scene already use. Added as children of the loaded planet mesh (not
   * `planetGroup`) so they inherit its rotation exactly like the canonical
   * golden radar-ping markers do. Lat/lon uses the standard equirectangular
   * convention `world-globe.ts` already relies on; this specific GLB's
   * texture wasn't authored by this project, so if a pin reads as visibly
   * offset from its coastline after a real visual pass, the fix is a single
   * longitude-offset constant here, not a rewrite of the projection. */
  const addCountryPins = (planetMesh: THREE.Mesh) => {
    const positions: number[] = [];
    for (const { lat, lon } of PROJECT_LOCATIONS) {
      const p = latLonToVector3(lat, lon, CONFIG.planetRadius * 1.015);
      positions.push(p.x, p.y, p.z);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    const pinTime = { value: 0 };
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: pinTime,
        uColor: { value: new THREE.Color(CONFIG.pinColor) },
        uSize: { value: CONFIG.pinSize },
        uRes: {
          value: new THREE.Vector2(
            window.innerWidth * window.devicePixelRatio,
            window.innerHeight * window.devicePixelRatio,
          ),
        },
      },
      vertexShader: `
        uniform float uSize; uniform vec2 uRes;
        varying float vFade;
        void main(){
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          vec3 vn = normalize(normalMatrix * normalize(position));
          vec3 vd = normalize(-mv.xyz);
          vFade = smoothstep(0.15, 0.5, dot(vn, vd));
          gl_PointSize = max(uSize * uRes.y / 900.0 * (7.0 / max(-mv.z, 1.0)), 2.0);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: `
        uniform vec3 uColor; uniform float uTime;
        varying float vFade;
        void main(){
          if (vFade <= 0.001) discard;
          vec2 p = gl_PointCoord - 0.5;
          float d = length(p) * 2.0;
          if (d > 1.0) discard;
          float core = smoothstep(0.30, 0.0, d) * 1.2;
          float pulse = 0.6 + 0.4 * sin(uTime * 1.6 + gl_FragCoord.x * 0.01);
          gl_FragColor = vec4(uColor, core * pulse * vFade);
        }`,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: true,
    });
    const pins = new THREE.Points(g, mat);
    pins.frustumCulled = false;
    pins.layers.enable(LAYERS.ENTIRE_SCENE);
    pins.onBeforeRender = () => {
      pinTime.value = performance.now() / 1000;
    };
    planetMesh.add(pins);
  };

  function loadPlanet() {
    gltfLoader.load("/assets/planet/planet-lights.glb", (lights) => {
      const lmesh = firstMesh(lights.scene);
      const nightTex =
        lmesh && (lmesh.material as THREE.MeshStandardMaterial)?.map
          ? (lmesh.material as THREE.MeshStandardMaterial).map
          : null;
      gltfLoader.load("/assets/planet/planet.glb", (gltf) => {
        const mesh = firstMesh(gltf.scene);
        if (!mesh) return;
        mesh.geometry.computeBoundingSphere();
        const r = mesh.geometry.boundingSphere ? mesh.geometry.boundingSphere.radius : 1;
        const s = CONFIG.planetRadius / r;
        const planetMat = (mesh.material as THREE.MeshStandardMaterial).clone();
        planetMat.metalness = 0.0;
        planetMat.roughness = 1.0;
        planetMat.envMapIntensity = 0.0;
        applyPlanetShader(planetMat, nightTex);
        const planet = new THREE.Mesh(mesh.geometry, planetMat);
        planet.scale.setScalar(s);
        planet.layers.enable(LAYERS.ENTIRE_SCENE);
        planetGroup.add(planet);
        addMarkers(planet, planetMat);
        addCountryPins(planet);
        addAtmosphereGlow(CONFIG.planetRadius);
        cloudGroup.visible = true;
        entryActive = true;
        entryT = 0;
      });
    });
  }
  loadPlanet();

  /* ---------- ambient atmosphere particles ---------- */
  let atmoMat: THREE.ShaderMaterial | null = null;
  const buildAtmoPoints = (): THREE.Points => {
    const N = counts.atmoCount;
    const positions = new Float32Array(N * 3);
    const sizes = new Float32Array(N);
    const seeds = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      positions[i * 3] = 2 * Math.random() - 1;
      positions[i * 3 + 1] = 2 * Math.random() - 1;
      positions[i * 3 + 2] = 2 * Math.random() - 1;
      sizes[i] = CONFIG.atmoSize * (0.4 + Math.random());
      seeds[i] = Math.random();
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    g.setAttribute("size", new THREE.Float32BufferAttribute(sizes, 1));
    g.setAttribute("seed", new THREE.Float32BufferAttribute(seeds, 1));
    atmoMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: hexToVec3(CONFIG.atmoColor) },
        uRes: {
          value: new THREE.Vector2(
            window.innerWidth * window.devicePixelRatio,
            window.innerHeight * window.devicePixelRatio,
          ),
        },
      },
      vertexShader: `
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
        }`,
      fragmentShader: `
        uniform vec3 uColor; varying float vA;
        void main(){ vec2 p = gl_PointCoord - 0.5; float l = length(p); if (l > 0.5) discard;
          float tex = smoothstep(0.5, 0.0, l); gl_FragColor = vec4(uColor * tex, tex * vA * 0.55); }`,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: false,
    });
    const pts = new THREE.Points(g, atmoMat);
    pts.frustumCulled = false;
    pts.layers.enable(LAYERS.ENTIRE_SCENE);
    scene.add(pts);
    pts.onBeforeRender = () => {
      const t = performance.now() / 1000;
      (atmoMat as THREE.ShaderMaterial).uniforms.uTime.value = t * CONFIG.atmoSpeed * 8.0;
      pts.position.copy(camera.position);
      (finalPass.uniforms.iTime as { value: number }).value = t;
    };
    return pts;
  };
  buildAtmoPoints();

  /* ---------- STARFIELD ---------- */
  const starTime = { value: 0 };
  let starMat: THREE.ShaderMaterial | null = null;
  const addStars = () => {
    const COUNT = counts.starCount;
    const R = 90;
    const pos = new Float32Array(COUNT * 3);
    const seed = new Float32Array(COUNT);
    const bright = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) {
      const u = Math.random() * 2 - 1;
      const th = Math.random() * Math.PI * 2;
      const r = Math.sqrt(1 - u * u);
      pos[i * 3] = R * r * Math.cos(th);
      pos[i * 3 + 1] = R * u;
      pos[i * 3 + 2] = R * r * Math.sin(th);
      seed[i] = Math.random() * 6.2831853;
      bright[i] = 0.35 + Math.random() * 0.65;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute("seed", new THREE.Float32BufferAttribute(seed, 1));
    geo.setAttribute("bright", new THREE.Float32BufferAttribute(bright, 1));
    starMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: starTime,
        uSize: { value: CONFIG.starSize },
        uFlicker: { value: CONFIG.starFlicker },
        uColor: { value: hexToVec3(CONFIG.starColor) },
        uRes: {
          value: new THREE.Vector2(
            window.innerWidth * window.devicePixelRatio,
            window.innerHeight * window.devicePixelRatio,
          ),
        },
      },
      vertexShader: `
        attribute float seed; attribute float bright;
        uniform float uTime; uniform float uSize; uniform float uFlicker; uniform vec2 uRes;
        varying float vTw;
        void main(){
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          float tw = 0.6 + 0.4 * sin(uTime * uFlicker + seed);
          vTw = bright * tw;
          gl_PointSize = max(uSize * uRes.y / 900.0 * (90.0 / max(-mv.z, 1.0)), 1.0);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: `
        uniform vec3 uColor; varying float vTw;
        void main(){
          vec2 p = gl_PointCoord - 0.5; float l = length(p); if (l > 0.5) discard;
          float core = smoothstep(0.5, 0.0, l);
          gl_FragColor = vec4(uColor, core * vTw);
        }`,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: true,
    });
    const stars = new THREE.Points(geo, starMat);
    stars.frustumCulled = false;
    stars.layers.enable(LAYERS.ENTIRE_SCENE);
    scene.add(stars);
  };
  addStars();

  /* ---------- LOCATION MARKERS (golden radar pings) ---------- */
  let markerMat: THREE.ShaderMaterial | null = null;
  const markerTime = { value: 0 };
  const addMarkers = (planetMesh: THREE.Mesh, planetMat: THREE.MeshStandardMaterial) => {
    const tex = planetMat.map;
    if (!tex || !tex.image) return;
    const img = tex.image as HTMLImageElement;
    const W = Math.min(img.width || 1024, 1024);
    const H = Math.min(img.height || 512, 512);
    const cv = document.createElement("canvas");
    cv.width = W;
    cv.height = H;
    const cctx = cv.getContext("2d");
    if (!cctx) return;
    cctx.drawImage(img, 0, 0, W, H);
    let px: Uint8ClampedArray;
    try {
      px = cctx.getImageData(0, 0, W, H).data;
    } catch {
      return;
    }
    const geom = planetMesh.geometry;
    const pos = geom.attributes.position as THREE.BufferAttribute;
    const uv = geom.attributes.uv as THREE.BufferAttribute | undefined;
    if (!uv) return;
    const index = geom.index;
    const triCount = index ? index.count / 3 : pos.count / 3;
    const triIdx = (t: number, k: number) => (index ? index.getX(t * 3 + k) : t * 3 + k);
    const cum = new Float32Array(triCount);
    const A = new THREE.Vector3();
    const B = new THREE.Vector3();
    const C = new THREE.Vector3();
    const e1 = new THREE.Vector3();
    const e2 = new THREE.Vector3();
    let total = 0;
    for (let t = 0; t < triCount; t++) {
      A.fromBufferAttribute(pos, triIdx(t, 0));
      B.fromBufferAttribute(pos, triIdx(t, 1));
      C.fromBufferAttribute(pos, triIdx(t, 2));
      e1.subVectors(B, A);
      e2.subVectors(C, A);
      total += e1.cross(e2).length() * 0.5;
      cum[t] = total;
    }
    const pickTri = () => {
      const rnd = Math.random() * total;
      let lo = 0;
      let hi = triCount - 1;
      while (lo < hi) {
        const m = (lo + hi) >> 1;
        if (cum[m] < rnd) lo = m + 1;
        else hi = m;
      }
      return lo;
    };
    const want = counts.markerCount;
    const positions: number[] = [];
    const seeds: number[] = [];
    const lift = 1.012;
    const uvA = new THREE.Vector2();
    const uvB = new THREE.Vector2();
    const uvC = new THREE.Vector2();
    let attempts = 0;
    const maxAtt = want * 400 + 2000;
    while (positions.length / 3 < want && attempts < maxAtt) {
      attempts++;
      const t = pickTri();
      const i0 = triIdx(t, 0);
      const i1 = triIdx(t, 1);
      const i2 = triIdx(t, 2);
      let r1 = Math.random();
      let r2 = Math.random();
      if (r1 + r2 > 1) {
        r1 = 1 - r1;
        r2 = 1 - r2;
      }
      const w0 = 1 - r1 - r2;
      const w1 = r1;
      const w2 = r2;
      uvA.fromBufferAttribute(uv, i0);
      uvB.fromBufferAttribute(uv, i1);
      uvC.fromBufferAttribute(uv, i2);
      const u = uvA.x * w0 + uvB.x * w1 + uvC.x * w2;
      const vv = uvA.y * w0 + uvB.y * w1 + uvC.y * w2;
      const sx = Math.min(W - 1, Math.max(0, (u * W) | 0));
      const sy = Math.min(H - 1, Math.max(0, ((1 - vv) * H) | 0));
      const o = (sy * W + sx) * 4;
      const cr = px[o];
      const cg = px[o + 1];
      const cb = px[o + 2];
      if (cb > cr + 6 && cb > cg + 6) continue;
      A.fromBufferAttribute(pos, i0);
      B.fromBufferAttribute(pos, i1);
      C.fromBufferAttribute(pos, i2);
      positions.push(
        (A.x * w0 + B.x * w1 + C.x * w2) * lift,
        (A.y * w0 + B.y * w1 + C.y * w2) * lift,
        (A.z * w0 + B.z * w1 + C.z * w2) * lift,
      );
      seeds.push(Math.random());
    }
    if (!positions.length) return;
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    g.setAttribute("seed", new THREE.Float32BufferAttribute(seeds, 1));
    markerMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: markerTime,
        uColor: { value: hexToVec3(CONFIG.markerColor) },
        uSize: { value: CONFIG.markerSize },
        uSpeed: { value: CONFIG.markerSpeed },
        uRes: {
          value: new THREE.Vector2(
            window.innerWidth * window.devicePixelRatio,
            window.innerHeight * window.devicePixelRatio,
          ),
        },
      },
      vertexShader: `
        attribute float seed; uniform float uSize; uniform vec2 uRes;
        varying float vSeed; varying float vFade;
        void main(){
          vSeed = seed;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          vec3 vn = normalize(normalMatrix * normalize(position));
          vec3 vd = normalize(-mv.xyz);
          vFade = smoothstep(0.15, 0.5, dot(vn, vd));
          gl_PointSize = max(uSize * uRes.y / 900.0 * (7.0 / max(-mv.z, 1.0)), 2.0);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: `
        uniform vec3 uColor; uniform float uTime; uniform float uSpeed;
        varying float vSeed; varying float vFade;
        void main(){
          if (vFade <= 0.001) discard;
          vec2 p = gl_PointCoord - 0.5;
          float d = length(p) * 2.0;
          if (d > 1.0) discard;
          float core = smoothstep(0.30, 0.0, d) * 1.2;
          float ph = fract(uTime * uSpeed + vSeed);
          float ring = smoothstep(0.07, 0.0, abs(d - ph)) * (1.0 - ph);
          gl_FragColor = vec4(uColor, clamp(core + ring, 0.0, 1.0) * vFade);
        }`,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: true,
    });
    const marks = new THREE.Points(g, markerMat);
    marks.frustumCulled = false;
    marks.layers.enable(LAYERS.ENTIRE_SCENE);
    planetMesh.add(marks);
  };

  /* ---------- RESIZE ---------- */
  const resize = handleResizeFactory(camera, [torusComposer, bloomComposer, finalComposer]);
  const resizeAll = () => {
    resize();
    const w = window.innerWidth;
    const h = window.innerHeight;
    const dpr = renderer?.getPixelRatio() ?? 1;
    if (atmoMat) atmoMat.uniforms.uRes.value.set(w * dpr, h * dpr);
    if (starMat) starMat.uniforms.uRes.value.set(w * dpr, h * dpr);
    if (markerMat) markerMat.uniforms.uRes.value.set(w * dpr, h * dpr);
  };
  window.addEventListener("resize", resizeAll, { passive: true });
  resizeAll();

  /* ---------- RENDER LOOP ---------- */
  let disposed = false;
  let t0 = performance.now() / 1000;

  const renderFrame = () => {
    if (disposed) return;
    const t = performance.now() / 1000;
    const dt = Math.min(0.05, t - t0);
    t0 = t;
    planetTime.value += dt / 12;
    cloudTime.value += dt / 20;
    starTime.value += dt;
    markerTime.value += dt;
    spinPhase += dt * CONFIG.spin;
    for (const cl of cloudMeshes) {
      cl.phase += dt * CONFIG[cl.spinKey];
      cl.mesh.rotation.y = cl.phase;
    }

    // --- scroll-driven framing (this project's shared scroll signal) ---
    const pTarget = clamp(getScrollSignalSnapshot().progress, 0, 1);
    curP += (pTarget - curP) * Math.min(1, dt * 4.5);
    const sideScale = clamp(window.innerWidth / 1200, 0.5, 1);
    const tx = sample(STOPS_X, curP) * sideScale;
    const ty = sample(STOPS_Y, curP);
    const ts = sample(STOPS_S, curP);
    const k = Math.min(1, dt * 3.2);
    curX += (tx - curX) * k;
    curY += (ty - curY) * k;
    curS += (ts - curS) * k;

    let entryY = 0;
    if (entryActive) {
      entryT = Math.min(1, entryT + dt / ENTRY_DUR);
      const e = 1 - Math.pow(1 - entryT, 3);
      entryY = lerp(ENTRY_START_Y, 0, e);
      if (entryT >= 1) entryActive = false;
    }
    worldGroup.position.set(curX, curY + entryY, 0);
    worldGroup.scale.setScalar(curS);
    planetGroup.rotation.y = CONFIG.initRotation + spinPhase + curP * Math.PI * 1.6;

    controls.update();
    if (glowMesh) glowMesh.quaternion.copy(camera.quaternion);

    camera.layers.set(LAYERS.TORUS_SCENE);
    torusComposer.render();
    camera.layers.set(LAYERS.BLOOM_SCENE);
    bloomComposer.render();
    camera.layers.set(LAYERS.ENTIRE_SCENE);
    finalComposer.render();

    rafId = requestAnimationFrame(renderFrame);
  };
  rafId = requestAnimationFrame(renderFrame);

  return function cleanup() {
    disposed = true;
    if (rafId !== null) cancelAnimationFrame(rafId);
    window.removeEventListener("resize", resizeAll);
    controls.dispose();
    torusComposer.dispose();
    bloomComposer.dispose();
    finalComposer.dispose();
    disposeSceneObjects(scene);
    renderer?.dispose();
  };
};

/**
 * Starts (or joins, ref-counted) the planet background. Returns a stop
 * function — call it on unmount. Same ref-counting convention as
 * `ambient-background-renderer.ts`, safe under React Strict Mode's dev
 * double-invoke.
 */
export const startPlanetBackground = (options: PlanetBackgroundOptions): (() => void) => {
  refCount += 1;

  if (refCount === 1) {
    const canvas = document.createElement("canvas");
    canvas.style.position = "fixed";
    canvas.style.inset = "0";
    canvas.style.width = "100vw";
    canvas.style.height = "100vh";
    canvas.style.pointerEvents = "none";
    // One step behind the ambient background's own `z-index: 0` (left
    // untouched) — two `position: fixed` siblings appended imperatively at
    // different times can't rely on DOM order alone for a deterministic
    // stack, so this is pinned explicitly rather than left to mount timing.
    canvas.style.zIndex = "-1";
    document.body.appendChild(canvas);
    canvasEl = canvas;

    disposeContent = buildScene(canvas, options);
  }

  return () => {
    refCount -= 1;
    if (refCount > 0) return;

    disposeContent?.();
    disposeContent = null;
    canvasEl?.remove();
    canvasEl = null;
    renderer = null;
    rafId = null;
  };
};
