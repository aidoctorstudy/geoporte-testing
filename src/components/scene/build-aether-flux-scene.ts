/**
 * Aether Flux — GetLayers' "brushed-platinum rods swirling through a silent
 * black void" scene (`getlayers_search`/`getlayers_materialize`, id
 * `aether-flux`), pulled as its portable single-HTML master and ported
 * verbatim — same practice as `build-solaris-scene.ts` (ADR-0039): the
 * NOISE_GLSL block, the rod vertex/fragment shaders, the dust vertex/
 * fragment shaders, the grid-generation math, the cursor ray/pocket/vortex
 * logic, the click-burst ring, the turntable spin/tilt, the camera damping,
 * and the three-composer bloom rig are all copied character for character
 * from the materialized source. CONFIG values are the scene's own "Default"
 * variant (pearlescent platinum, not re-tinted through this project's blue
 * Style) — per the source's own contract, colour is a param the Style would
 * normally tint, but the brief asks for this exact platinum look, matching
 * this project's established precedent of keeping a scene's own bespoke
 * palette rather than retinting it (Solaris's amber/orange, ADR-0039).
 *
 * Documented deviations only, all invisible to the rendered look or forced
 * by this project's actual dependency versions:
 * - `THREE.WebGL1Renderer` doesn't exist in three@0.185 (installed here,
 *   removed upstream years after this scene was authored) — `WebGLRenderer`
 *   instead, this codebase's own convention everywhere else.
 * - `renderer.shadowMap` setup dropped — nothing in the scene casts or
 *   receives a shadow (the key light is a hardcoded shader vector, not a
 *   real `THREE.Light`), so it was dead configuration in the source too.
 * - Tier-based DPR clamp instead of the source's flat, unclamped
 *   `devicePixelRatio` — this project's standing perf convention.
 * - `THREE.CylinderGeometry` instead of `CylinderBufferGeometry` — the
 *   `*BufferGeometry` classes were folded into their plain-name equivalents
 *   years ago and no longer exist; same non-negotiable rename already made
 *   for `SphereGeometry` in `build-solaris-scene.ts`. Same constructor args.
 * - The render loop is `HeroScene.tsx`'s own rAF (`renderFrame(elapsedSeconds)`,
 *   called once per frame) instead of the source's freestanding
 *   `requestAnimationFrame` loop; per-frame `dt` is derived from consecutive
 *   `elapsedSeconds` values instead of the source's own `performance.now()`
 *   delta — the same values either way, just sourced from the caller.
 * - Click handling: the source already attaches its `pointerdown` listener
 *   to `window`, not the canvas (this project's canvas is `pointer-events:
 *   none` so page content underneath stays clickable — the same reason the
 *   source's own listener is window-scoped, not canvas-scoped). Ported as-is
 *   inside this builder, with a `dispose()` cleanup the standalone page
 *   never needed.
 *
 * One thing preserved AS FOUND, not fixed: `torusComposer` and
 * `bloomComposer` render a scene where nothing is on their layers (only
 * `LAYERS.ENTIRE_SCENE` has the rod mesh/dust on it) — their bloom passes
 * are a structural no-op in the real source, not something this port
 * broke. See ADR in decisions-log.md; kept verbatim rather than "fixed"
 * per this project's own hard-won lesson about not improvising on a scene
 * the user asked for character-for-character.
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
  silverCool: 0x9fb0c4,
  silverWarm: 0xf4eee2,
  specColor: 0xffffff,
  dustColor: 0x7d93b0,
  ambient: 0.12,
  keyLight: 1.15,
  gridN: 26,
  rodLength: 0.55,
  rodRadius: 0.74,
  flowFreq: 1.01,
  flowSpeed: 0.215,
  spin: 0.14,
  camDist: 7.4,
  parallax: 0.55,
  cursorRadius: 0.75,
  cursorPush: 0.4,
  cursorSwirl: 0.8,
  dust: 0,
  mainAlpha: 1,
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
// exact noise, basis construction, and lighting terms define the look.
// ---------------------------------------------------------------------------

const NOISE_GLSL = /* glsl */ `
  vec3 mod289(vec3 x){ return x - floor(x * (1.0/289.0)) * 289.0; }
  vec4 mod289(vec4 x){ return x - floor(x * (1.0/289.0)) * 289.0; }
  vec4 permute(vec4 x){ return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r){ return 1.79284291400159 - 0.85373472095314 * r; }
  float snoise(vec3 v){
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute(permute(permute(
              i.z + vec4(0.0, i1.z, i2.z, 1.0))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }
  vec3 snoiseVec3(vec3 x){
    float s  = snoise(x);
    float s1 = snoise(vec3(x.y - 19.1, x.z + 33.4, x.x + 47.2));
    float s2 = snoise(vec3(x.z + 74.2, x.x - 124.5, x.y + 99.4));
    return vec3(s, s1, s2);
  }
  vec3 curlNoise(vec3 p){
    const float e = 0.1;
    vec3 dx = vec3(e, 0.0, 0.0);
    vec3 dy = vec3(0.0, e, 0.0);
    vec3 dz = vec3(0.0, 0.0, e);
    vec3 p_x0 = snoiseVec3(p - dx); vec3 p_x1 = snoiseVec3(p + dx);
    vec3 p_y0 = snoiseVec3(p - dy); vec3 p_y1 = snoiseVec3(p + dy);
    vec3 p_z0 = snoiseVec3(p - dz); vec3 p_z1 = snoiseVec3(p + dz);
    float x = p_y1.z - p_y0.z - p_z1.y + p_z0.y;
    float y = p_z1.x - p_z0.x - p_x1.z + p_x0.z;
    float z = p_x1.y - p_x0.y - p_y1.x + p_y0.x;
    return vec3(x, y, z) / (2.0 * e);
  }
`;

const rodVertexShader =
  NOISE_GLSL +
  /* glsl */ `
    attribute vec3 aCenter; attribute float aRand;
    uniform float uFlowPhase; uniform float uFreq; uniform float uRodLen; uniform float uRodRad;
    uniform float uBurstT; uniform float uBurstAmt;
    uniform vec3 uPointer; uniform vec3 uViewLocal;
    uniform float uPtrStr; uniform float uPtrRad; uniform float uPtrPush; uniform float uPtrSwirl;
    varying vec3 vNormal; varying vec3 vView; varying float vAxis; varying float vY; varying float vGlow; varying float vRand;
    void main(){
      vRand = aRand;

      // cursor force: a soft pocket that reaches into the block and parts the rods,
      // strongest at the cursor and falling off with a gaussian radius
      vec3 toP = aCenter - uPointer;
      float pd = length(toP);
      float infl = exp(-(pd * pd) / (uPtrRad * uPtrRad)) * uPtrStr;
      vec3 outDir = pd > 1e-4 ? toP / pd : vec3(0.0, 1.0, 0.0);
      vec3 ctr = aCenter + outDir * infl * uPtrPush;       // displaced centre (rods part away)

      // divergence-free flow direction at the displaced cell (rotates with the cube)
      vec3 dom = ctr * uFreq + vec3(0.0, uFlowPhase, uFlowPhase * 0.6);
      vec3 dir = curlNoise(dom);
      float dl = length(dir);
      dir = dl > 1e-4 ? dir / dl : vec3(0.0, 1.0, 0.0);

      // near the cursor, curl the rods around it (tangent to the view axis) for a vortex feel
      vec3 tang = cross(normalize(uViewLocal), toP);
      float tl = length(tang);
      if (tl > 1e-4) dir = normalize(mix(dir, tang / tl, clamp(infl * uPtrSwirl, 0.0, 0.92)));

      // orthonormal basis with local +Y mapped onto the flow direction
      vec3 up = abs(dir.y) < 0.99 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);
      vec3 tx = normalize(cross(up, dir));
      vec3 bz = cross(dir, tx);
      mat3 basis = mat3(tx, dir, bz);

      // expanding ring from a click: lengthen + ignite rods at the wavefront
      float d = length(aCenter);
      float ring = exp(-pow((d - uBurstT * 2.6) / 0.45, 2.0)) * uBurstAmt;
      vGlow = ring + infl * 0.7;                            // cursor pocket glows too

      float lenJ = uRodLen * (0.62 + 0.85 * aRand);        // per-rod length variation
      float len = lenJ * (1.0 + ring * 0.9 + infl * 0.6);  // cursor energises rods
      vec3 p = position;
      vY = p.y + 0.5;
      p.y *= len;
      p.xz *= uRodRad * (0.7 + 0.5 * aRand);
      vec3 world = ctr + basis * p;

      vec4 mv = modelViewMatrix * vec4(world, 1.0);
      gl_Position = projectionMatrix * mv;

      vNormal = normalize(normalMatrix * (basis * normal));
      vView = normalize(-mv.xyz);
      // how aligned the rod axis is with the view direction (tips-on -> bright dot)
      vec3 axisView = normalize((modelViewMatrix * vec4(dir, 0.0)).xyz);
      vAxis = abs(dot(axisView, vView));
    }
`;

const rodFragmentShader = /* glsl */ `
    precision highp float;
    uniform vec3 uCool; uniform vec3 uWarm; uniform vec3 uSpec;
    uniform float uAmbient; uniform float uKey; uniform float iAlpha;
    varying vec3 vNormal; varying vec3 vView; varying float vAxis; varying float vY; varying float vGlow; varying float vRand;
    void main(){
      vec3 N = normalize(vNormal);
      vec3 V = normalize(vView);
      if (dot(N, V) < 0.0) N = -N;                       // two-sided shading
      vec3 L = normalize(vec3(-0.35, 0.78, 0.52));       // key light (view space)

      float diff = max(dot(N, L), 0.0);
      float fres = pow(1.0 - max(dot(N, V), 0.0), 3.0);
      vec3  H = normalize(L + V);
      float spec = pow(max(dot(N, H), 0.0), 46.0);

      // pearlescent base: cool in shadow -> warm in light
      vec3 base = mix(uCool, uWarm, diff * 0.85 + 0.15);
      vec3 col = base * (uAmbient + uKey * diff);
      col += uWarm * fres * 0.5;                          // rim sheen
      col += uSpec * spec * (0.7 + 0.6 * vAxis);          // specular, hotter on tip-on rods

      // tip-on rods catch a bright pinpoint glint (the dots in the field)
      float glint = smoothstep(0.86, 1.0, vAxis);
      col += uSpec * glint * (0.35 + 0.4 * vRand);

      // length gradient: tips brighter than roots (brushed-stroke read)
      col *= mix(0.55, 1.12, vY);

      // click ring ignites rods
      col += uWarm * vGlow * 1.6;

      gl_FragColor = vec4(col * iAlpha, 1.0);
    }
`;

const dustVertexShader = /* glsl */ `
        attribute float aSize; uniform float iTime; uniform float uDpr;
        varying float vTw;
        void main(){
          vec3 p = position;
          float t = iTime * 0.25 + position.x * 0.7 + position.y * 1.3;
          vTw = 0.45 + 0.55 * sin(t);
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = aSize * uDpr * 110.0 / max(0.1, -mv.z);
        }
`;

const dustFragmentShader = /* glsl */ `
        precision highp float;
        uniform vec3 uColor; uniform float uBright; uniform float iAlpha;
        varying float vTw;
        void main(){
          vec2 d = gl_PointCoord - 0.5;
          float r = dot(d, d);
          float a = exp(-r * 9.0);
          gl_FragColor = vec4(uColor * a * vTw * uBright * 1.4, 1.0) * a * iAlpha;
        }
`;

// Composite-only pass — rod scene + (structurally-empty) bloom layers over a
// clean black background. `haloTexture` is sampled but never assigned a
// value anywhere in the source — an unused leftover uniform, kept verbatim.
const FinalPass = {
  uniforms: {
    tDiffuse: { value: null as THREE.Texture | null },
    torusTexture: { value: null as THREE.Texture | null },
    bloomTexture: { value: null as THREE.Texture | null },
    haloTexture: { value: null as THREE.Texture | null },
  },
  vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position, 1.0); }`,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse; uniform sampler2D bloomTexture; uniform sampler2D torusTexture; uniform sampler2D haloTexture;
    varying vec2 vUv;
    void main() {
      vec3 halo = texture2D(haloTexture, vUv).xyz;
      gl_FragColor = vec4(texture2D(bloomTexture, vUv).xyz + texture2D(torusTexture, vUv).xyz + texture2D(tDiffuse, vUv).xyz + halo, 1.);
    }`,
};

interface AetherFluxOptions {
  /** `UnrealBloomPass` strength for the two structurally-dead composers
   * (see file header) — radius/threshold stay the source's own fixed
   * values. The card instance still needs its own lower numbers here
   * because `UnrealBloomPass`'s mip-chain cost scales with the render
   * target's own pixel count regardless of what's on its layers. */
  torusBloomStrength: number;
  bloomBloomStrength: number;
}

const buildAetherFluxScene = (container: HTMLElement, options: AetherFluxOptions): HeroSceneHandle => {
  const { torusBloomStrength, bloomBloomStrength } = options;
  const canvas = document.createElement("canvas");
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  const { clientWidth, clientHeight } = container;
  // Tier-based, not the source's flat, unclamped devicePixelRatio — the one
  // deliberate perf deviation, invisible to the rendered look. See file header.
  const { dprClamp } = getTierBudget(clientWidth || window.innerWidth);
  const pixelRatio = Math.min(window.devicePixelRatio, dprClamp);
  renderer.setPixelRatio(pixelRatio);
  renderer.setSize(clientWidth || 1, clientHeight || 1);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);
  scene.fog = new THREE.Fog(0x000000, 0, 15);

  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 80);
  camera.position.set(0, 0, 4.3);
  camera.layers.enable(LAYERS.TORUS_SCENE);
  camera.layers.enable(LAYERS.BLOOM_SCENE);
  camera.layers.enable(LAYERS.ENTIRE_SCENE);
  scene.add(camera);

  // ---- composer rig (verbatim structure — see file header re: dead layers) ----
  const renderScene = new RenderPass(scene, camera);
  const torusComposer = new EffectComposer(renderer);
  torusComposer.renderToScreen = false;
  torusComposer.addPass(renderScene);
  torusComposer.addPass(new ShaderPass(GammaCorrectionShader));
  torusComposer.addPass(
    new UnrealBloomPass(new THREE.Vector2(clientWidth || 1, clientHeight || 1), torusBloomStrength, 0.2, 0),
  );
  torusComposer.addPass(new ShaderPass(CopyShader));

  const bloomComposer = new EffectComposer(renderer);
  bloomComposer.renderToScreen = false;
  bloomComposer.addPass(renderScene);
  bloomComposer.addPass(
    new UnrealBloomPass(new THREE.Vector2(clientWidth || 1, clientHeight || 1), bloomBloomStrength, 0.6, 0.55),
  );
  bloomComposer.addPass(new ShaderPass(GammaCorrectionShader));

  const finalPass = new ShaderPass(FinalPass);
  finalPass.uniforms.bloomTexture.value = bloomComposer.renderTarget1.texture;
  finalPass.uniforms.torusTexture.value = torusComposer.renderTarget1.texture;
  const finalComposer = new EffectComposer(renderer);
  finalComposer.addPass(renderScene);
  finalComposer.addPass(finalPass);

  // ---- rod field ----
  const group = new THREE.Group();
  scene.add(group);

  const uniforms = {
    iTime: { value: 0 },
    iAlpha: { value: 0 },
    uFlowPhase: { value: 0 },
    uFreq: { value: CONFIG.flowFreq },
    uRodLen: { value: 1 },
    uRodRad: { value: 1 },
    uCool: { value: hexToVec3(CONFIG.silverCool) },
    uWarm: { value: hexToVec3(CONFIG.silverWarm) },
    uSpec: { value: hexToVec3(CONFIG.specColor) },
    uAmbient: { value: CONFIG.ambient },
    uKey: { value: CONFIG.keyLight },
    uBurstT: { value: 0 },
    uBurstAmt: { value: 0 },
    uPointer: { value: new THREE.Vector3(99, 99, 99) },
    uViewLocal: { value: new THREE.Vector3(0, 0, 1) },
    uPtrStr: { value: 0 },
    uPtrRad: { value: CONFIG.cursorRadius },
    uPtrPush: { value: CONFIG.cursorPush },
    uPtrSwirl: { value: CONFIG.cursorSwirl },
  };

  const half = 1.3;
  const N = CONFIG.gridN;
  const spacing = (half * 2) / (N - 1);

  const centers: number[] = [];
  const rands: number[] = [];
  for (let ix = 0; ix < N; ix++) {
    for (let iy = 0; iy < N; iy++) {
      for (let iz = 0; iz < N; iz++) {
        const x = -half + ix * spacing;
        const y = -half + iy * spacing;
        const z = -half + iz * spacing;
        // distance to the nearest cube face (0 at surface, grows inward)
        const edge = Math.min(half - Math.abs(x), Math.min(half - Math.abs(y), half - Math.abs(z)));
        const keep = Math.random() > Math.min(0.45, edge * 0.5); // thin the deep interior a touch, fray the rim
        if (!keep && edge > 0.12) continue;
        centers.push(x, y, z);
        rands.push(Math.random());
      }
    }
  }

  const baseGeometry = new THREE.CylinderGeometry(0.55, 1.0, 1.0, 6, 1, false);
  const geometry = new THREE.InstancedBufferGeometry();
  geometry.index = baseGeometry.index;
  geometry.attributes.position = baseGeometry.attributes.position;
  geometry.attributes.normal = baseGeometry.attributes.normal;
  geometry.setAttribute("aCenter", new THREE.InstancedBufferAttribute(new Float32Array(centers), 3));
  geometry.setAttribute("aRand", new THREE.InstancedBufferAttribute(new Float32Array(rands), 1));
  geometry.instanceCount = rands.length;

  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: rodVertexShader,
    fragmentShader: rodFragmentShader,
    transparent: false,
    depthTest: true,
    depthWrite: true,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.frustumCulled = false;
  mesh.layers.enable(LAYERS.ENTIRE_SCENE);
  group.add(mesh);

  // uRodLen/uRodRad scale with the grid's own spacing (matches the source's
  // `applyConfig()`, which is only ever called once at this fixed gridN).
  uniforms.uRodLen.value = spacing * CONFIG.rodLength;
  uniforms.uRodRad.value = spacing * 0.34 * CONFIG.rodRadius;

  // ---- ambient dust (camera-attached faint motes) ----
  const DUST_COUNT = 420;
  const dustPositions = new Float32Array(DUST_COUNT * 3);
  const dustSizes = new Float32Array(DUST_COUNT);
  for (let i = 0; i < DUST_COUNT; i++) {
    const r = 3.0 + Math.random() * 9.0;
    const th = Math.random() * Math.PI * 2;
    const ph = Math.acos(2 * Math.random() - 1);
    dustPositions[i * 3] = r * Math.sin(ph) * Math.cos(th);
    dustPositions[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th);
    dustPositions[i * 3 + 2] = r * Math.cos(ph);
    dustSizes[i] = 1.0 + Math.random() * 2.0;
  }
  const dustGeometry = new THREE.BufferGeometry();
  dustGeometry.setAttribute("position", new THREE.BufferAttribute(dustPositions, 3));
  dustGeometry.setAttribute("aSize", new THREE.BufferAttribute(dustSizes, 1));
  const dustUniforms = {
    iTime: uniforms.iTime,
    iAlpha: uniforms.iAlpha,
    uColor: { value: hexToVec3(CONFIG.dustColor) },
    uBright: { value: CONFIG.dust },
    uDpr: { value: pixelRatio },
  };
  const dustMaterial = new THREE.ShaderMaterial({
    uniforms: dustUniforms,
    vertexShader: dustVertexShader,
    fragmentShader: dustFragmentShader,
    transparent: true,
    depthTest: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const dust = new THREE.Points(dustGeometry, dustMaterial);
  dust.frustumCulled = false;
  dust.layers.enable(LAYERS.ENTIRE_SCENE);
  scene.add(dust);

  // ---- cursor + click state ----
  const pointerNdc = new THREE.Vector2(0, 0);
  let pointerActive = false;
  let tilt = 0;
  const rayOrigin = new THREE.Vector3();
  const rayDir = new THREE.Vector3();
  const camNormal = new THREE.Vector3();
  const hitPoint = new THREE.Vector3();
  const invGroupQuat = new THREE.Quaternion();
  let lastElapsed = 0;

  const setPointer = (x: number, y: number) => {
    pointerNdc.set(Math.max(-1, Math.min(1, x)), -Math.max(-1, Math.min(1, y)));
    pointerActive = true;
  };

  // Click burst — the source attaches this to `window`, not the canvas
  // (this project's canvas is `pointer-events: none`, same reason).
  const handlePointerDown = () => {
    uniforms.uBurstT.value = 0;
    uniforms.uBurstAmt.value = 1;
  };
  window.addEventListener("pointerdown", handlePointerDown);

  const renderStatic = () => {
    uniforms.iAlpha.value = CONFIG.mainAlpha;
    uniforms.iTime.value = 3;
    uniforms.uFlowPhase.value = 3 * CONFIG.flowSpeed;
    uniforms.uPtrStr.value = 0;
    group.rotation.y = 0.4;
    group.rotation.x = 0.12;
    camera.position.set(0, 0, CONFIG.camDist);
    camera.lookAt(0, 0, 0);
    dust.position.copy(camera.position);
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

    // churn the field + turntable (phase-accumulated so it stays smooth)
    uniforms.uFlowPhase.value += dt * CONFIG.flowSpeed;
    group.rotation.y += dt * CONFIG.spin;
    tilt += dt * 0.18;
    group.rotation.x = Math.sin(tilt) * 0.18 + 0.12;
    group.updateMatrixWorld();

    // mouse parallax around the tweakable camera distance
    camera.position.x += (pointerNdc.x * CONFIG.parallax - camera.position.x) * 0.05;
    camera.position.y += (pointerNdc.y * CONFIG.parallax * 0.7 - camera.position.y) * 0.05;
    camera.position.z += (CONFIG.camDist - camera.position.z) * 0.06;
    camera.lookAt(0, 0, 0);

    // project the cursor into the cube: ray from camera, hit the plane through the
    // centre facing the camera, then pull that world point into cube-local space
    rayOrigin.set(pointerNdc.x, pointerNdc.y, 0.5).unproject(camera);
    rayDir.copy(rayOrigin).sub(camera.position).normalize();
    camNormal.copy(camera.position).normalize();
    const denom = rayDir.dot(camNormal);
    if (Math.abs(denom) > 1e-4) {
      const tt = -camera.position.dot(camNormal) / denom;
      hitPoint.copy(camera.position).addScaledVector(rayDir, tt);
      group.worldToLocal(hitPoint);
      uniforms.uPointer.value.copy(hitPoint);
    }
    // view direction in cube-local space (for the swirl axis)
    invGroupQuat.copy(group.quaternion).invert();
    uniforms.uViewLocal.value.copy(camNormal).applyQuaternion(invGroupQuat);
    // ease the cursor influence in (no pop on load / first move)
    const target = pointerActive ? 1 : 0;
    uniforms.uPtrStr.value += (target - uniforms.uPtrStr.value) * Math.min(1, dt * 4);

    // click ring travels outward and fades
    if (uniforms.uBurstAmt.value > 0.001) {
      uniforms.uBurstT.value += dt;
      uniforms.uBurstAmt.value *= Math.pow(0.5, dt / 0.7);
      if (uniforms.uBurstT.value > 1.4) uniforms.uBurstAmt.value = 0;
    }

    dust.position.copy(camera.position);

    // "since mount" — elapsedSeconds already starts near 0 at the scene's
    // first frame (HeroScene.tsx's own rAF clock), same intent as the
    // source's `performance.now() - this.appearStart`.
    uniforms.iAlpha.value =
      Math.max(0, Math.min(1, (elapsedSeconds * 1000 - 300) / 1400)) * CONFIG.mainAlpha;

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
    dustUniforms.uDpr.value = dpr;
  };

  const dispose = () => {
    window.removeEventListener("pointerdown", handlePointerDown);
    geometry.dispose(); // never baseGeometry — its buffers are shared into geometry, see file header
    material.dispose();
    dustGeometry.dispose();
    dustMaterial.dispose();
    torusComposer.dispose();
    bloomComposer.dispose();
    finalComposer.dispose();
    renderer.dispose();
  };

  return { renderStatic, renderFrame, resize, setPointer, dispose, canvas };
};

/** Full-bleed Design & Drafting service-page background — the source's own
 * bloom strengths verbatim (0.22 / 0.32), same as `createSolarisHeroScene`'s
 * relationship to `createSolarisCardScene`. */
export const createAetherFluxHeroScene = (container: HTMLElement): HeroSceneHandle =>
  buildAetherFluxScene(container, { torusBloomStrength: 0.22, bloomBloomStrength: 0.32 });

/** Small, contained homepage-card version — same shaders/geometry/colours/
 * cursor interaction/turntable spin as the hero, only the two composers'
 * bloom strength toned down (0.15 / 0.2) for the card's small buffer.
 * Unlike Solaris's card, no geometry/particle-size reduction is needed
 * here: the rod material is opaque and depth-tested (`transparent: false`),
 * not additively blended, so it can't suffer Solaris's overlap-saturation
 * "white blowout" at small size regardless of instance count. */
export const createAetherFluxCardScene = (container: HTMLElement): HeroSceneHandle =>
  buildAetherFluxScene(container, { torusBloomStrength: 0.15, bloomBloomStrength: 0.2 });
