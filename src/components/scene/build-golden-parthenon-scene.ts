/**
 * Golden Parthenon — the real Meshy "Golden Parthenon at Dusk" GLB standing
 * on a dark ridge under a warm sunset sky, ported from the user-supplied
 * `golden-parthenon.html` source (a self-contained GetLayers scene export
 * with its GLB and ground PBR maps base64-inlined). This supersedes two
 * earlier attempts on the Civil Engineering route: a procedural
 * primitive-geometry temple (`build-golden-parthenon-scene.ts`, ADR-0045 —
 * built because six consecutive `getlayers_materialize` pulls failed and
 * the brief's own asset URL was a literal `[hash]` placeholder) and then a
 * full swap to a different scene, Halcyon Gate — Night (`ADR-0046`, after
 * the procedural temple was reported broken). The user then supplied the
 * real source directly (a zip containing `golden-parthenon.html`, its GLB
 * and ground textures inlined as base64), so this is now a real, verified
 * port — no procedural substitution, no placeholder assets. See ADR-0047.
 *
 * **Asset extraction.** The four base64 blobs in the source
 * (`MODEL_B64`, `GROUND_COLOR_B64`, `GROUND_NORMAL_B64`, `GROUND_ROUGH_B64`)
 * were decoded straight from the HTML file into real binary files —
 * `public/assets/golden-parthenon/{model.glb, ground-color.jpg,
 * ground-normal.jpg, ground-rough.jpg}` — rather than inlined as
 * multi-hundred-KB string literals in this TS file. Verified after
 * decoding: the three JPEGs are valid 512×512 baseline JPEGs with intact
 * EOI markers, and the GLB's own 12-byte header (`glTF`, version 2) reports
 * a length that matches the decoded file size exactly. Loaded here via
 * `GLTFLoader`/`DRACOLoader` and `THREE.TextureLoader` against those real
 * files, same shape as `build-planet-scene.ts`'s own
 * `public/assets/planet/` + self-hosted `public/draco/` precedent
 * (ADR-0034) — including reusing that same self-hosted Draco decoder path
 * (`/draco/`) instead of the source's own `gstatic.com` CDN reference.
 *
 * CONFIG is the source's own values verbatim (dusk sky, warm key light,
 * cool hemisphere fill, real weathered-stone ground, 520 dust motes,
 * bloom 2/0.7/0.62) — the "constants ARE the spec" precedent every scene
 * in this codebase follows. Ported: the vertex-coloured sky dome, the
 * canvas-gradient sun-glow sprite, the 3-panel PMREM environment, the
 * directional/hemisphere/ambient lights with the exact shadow-camera
 * bounds, the fbm-displaced ground with a flat pad under the temple, the
 * camera-parented dust-mote shader, the camera-parented foreground-foliage
 * plane (off by default at `fgOpacity: 0`, kept rather than deleted — same
 * "don't fix a knob the source itself ships quiet" precedent as
 * Einstein-Rosen Lattice's `glowIntensity: 0` layer), the cursor-driven
 * sun azimuth/elevation sweep + camera parallax, the four-pass composer
 * (bloom → OutputPass → luma-aware film grain), and the exposure fade-in.
 *
 * Documented deviations, all forced by this project's actual dependency
 * versions or its `HeroSceneHandle` contract, none visible in the rendered
 * look:
 * - `THREE.WebGLRenderer`/`PlaneGeometry` (source already targets
 *   three@0.170, so only the same two renames every other scene here needs)
 *   and tier-based DPR clamp instead of the source's flat
 *   `min(dpr, 1.5)`.
 * - Self-hosted `/draco/` decoder path instead of the source's
 *   `gstatic.com` CDN reference — this project's own convention (see
 *   `optimize-3d-scene` skill, and `build-planet-scene.ts`'s identical
 *   comment) keeps decoders local so a background visual never depends on
 *   an external host.
 * - The render loop is `HeroScene.tsx`'s own rAF (`renderFrame(elapsedSeconds)`)
 *   instead of the source's freestanding `THREE.Clock`-driven one; the
 *   exposure fade-in reads `elapsedSeconds * 1000` directly in place of the
 *   source's `performance.now() - appearStart`.
 * - `setPointer(x, y)`: `HeroScene.tsx` already supplies container-relative
 *   NDC in the exact same sign convention the source's own
 *   `pointermove` handler computes (`clientX/innerWidth*2-1`,
 *   `clientY/innerHeight*2-1` — both left/top negative), so no conversion
 *   is needed here, unlike the sign-flip `build-halcyon-night-scene.ts`
 *   needed for its y-up shader convention.
 * - The source's own `IS_MOBILE` branch (narrowing `modelX` for narrow
 *   viewports) is omitted — `HeroScene.tsx` already skips mounting WebGL
 *   entirely below the mobile device tier, so that branch would be dead
 *   code in this project regardless of what it set.
 * - The GLTFLoader load is asynchronous (`loader.load`, not the source's
 *   `loader.parse` against an already-in-memory buffer) since the model
 *   now comes from a real file, not a decoded base64 string already sitting
 *   in the module. `renderFrame`/`renderStatic` render whatever is in
 *   `modelGroup` at that instant — an empty group before the load resolves,
 *   the fitted temple after — exactly matching the source's own
 *   `__ready`-gated behaviour. A `disposed` guard skips applying the
 *   resolved GLTF if `dispose()` already ran (component unmounted before
 *   the load finished).
 */
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { getTierBudget } from "@/lib/scene/device-tier";
import type { HeroSceneHandle } from "./hero-scene-types";

// Verbatim CONFIG from the source `golden-parthenon.html`.
const CONFIG = {
  skyTop: "#161b28",
  skyHorizon: "#e07e2e",
  sunGlow: "#15110a",
  sunGlowSize: 170,
  sunGlowStrength: 1.85,
  horizonY: -0.3,
  exposure: 1,
  fogColor: "#593203",
  fogNear: 4,
  fogFar: 30,
  sunAzimuth: 63,
  sunElevation: 11,
  sunFollow: 28,
  keyColor: "#ffd7a0",
  keyStrength: 4.9,
  skyFillColor: "#46689e",
  groundFillColor: "#2b2016",
  hemiStrength: 0.55,
  ambient: 0,
  marbleTint: "#ffffff",
  marbleRough: 1.06,
  marbleEnv: 0,
  warmBoost: 0,
  modelYaw: 69,
  modelScale: 1.08,
  modelX: -4.9,
  modelY: 0,
  modelZ: 1.6,
  groundColor: "#8a7a63",
  groundTile: 8,
  groundBump: 3,
  groundRough: 1.04,
  groundEnv: 0.34,
  groundDisplace: 5.8,
  groundFeature: 15,
  groundRough2: 1.5,
  groundFlatRadius: 0,
  groundY: -1.6,
  fov: 34,
  camY: -0.5,
  camZ: 14.5,
  targetY: 2.3,
  parallax: 0.5,
  parallaxEase: 2.4,
  dustAmount: 520,
  dustColor: "#ffcf92",
  dustSize: 0.065,
  dustOpacity: 0.5,
  fgOpacity: 0,
  fgColor: "#0b0d10",
  fgScale: 1,
  bloomStrength: 2,
  bloomRadius: 0.7,
  bloomThreshold: 0.62,
  grain: 0.06,
};

const DEG = Math.PI / 180;
const GROUND_SIZE = 600;
const SKY_R = 900;
const ASSET_BASE = "/assets/golden-parthenon";

// --- fractal value-noise terrain height field (ported verbatim) ---
const hash2 = (x: number, y: number): number => {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
};
const vnoise = (x: number, y: number): number => {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const a = hash2(xi, yi);
  const b = hash2(xi + 1, yi);
  const c = hash2(xi, yi + 1);
  const d = hash2(xi + 1, yi + 1);
  return (a * (1 - u) + b * u) * (1 - v) + (c * (1 - u) + d * u) * v;
};
const fbm = (x: number, y: number, crag: number): number => {
  let f = 0;
  let amp = 0.5;
  let frq = 1;
  let norm = 0;
  const oct = [1, 1, 1, crag, crag];
  for (let i = 0; i < 5; i++) {
    f += oct[i] * amp * vnoise(x * frq, y * frq);
    norm += oct[i] * amp;
    frq *= 2.03;
    amp *= 0.5;
  }
  return f / norm;
};

const mulberry32 = (a: number) => (): number => {
  a |= 0;
  a = (a + 0x6d2b79f5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const buildSky = (scene: THREE.Scene): THREE.Mesh => {
  const geo = new THREE.SphereGeometry(SKY_R, 48, 32);
  const cTop = new THREE.Color(CONFIG.skyTop);
  const cHor = new THREE.Color(CONFIG.skyHorizon);
  const pos = geo.attributes.position;
  const n = pos.count;
  const col = new Float32Array(n * 3);
  const c = new THREE.Color();
  for (let i = 0; i < n; i++) {
    const ny = pos.getY(i) / SKY_R;
    const t = THREE.MathUtils.smoothstep(ny, CONFIG.horizonY, 0.62);
    const below = THREE.MathUtils.smoothstep(ny, CONFIG.horizonY - 0.22, CONFIG.horizonY);
    c.copy(cHor).lerp(cTop, t);
    c.multiplyScalar(0.35 + 0.65 * below);
    col[i * 3] = c.r;
    col[i * 3 + 1] = c.g;
    col[i * 3 + 2] = c.b;
  }
  geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  const sky = new THREE.Mesh(
    geo,
    new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false }),
  );
  sky.renderOrder = -2;
  scene.add(sky);
  return sky;
};

const makeGlowTexture = (): THREE.CanvasTexture => {
  const s = 256;
  const cv = document.createElement("canvas");
  cv.width = s;
  cv.height = s;
  const ctx = cv.getContext("2d")!;
  const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  g.addColorStop(0.0, "rgba(255,255,255,1)");
  g.addColorStop(0.18, "rgba(255,236,196,0.95)");
  g.addColorStop(0.5, "rgba(255,180,90,0.35)");
  g.addColorStop(1.0, "rgba(255,150,60,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, s, s);
  return new THREE.CanvasTexture(cv);
};

const buildEnvScene = (): THREE.Scene => {
  const s = new THREE.Scene();
  s.background = new THREE.Color("#5a5140");
  const panel = (rgb: [number, number, number], pos: [number, number, number], scale: [number, number, number], rot?: [number, number, number]) => {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({ toneMapped: false, side: THREE.DoubleSide }),
    );
    m.material.color.setRGB(rgb[0], rgb[1], rgb[2]);
    m.position.set(pos[0], pos[1], pos[2]);
    if (rot) m.rotation.set(rot[0] || 0, rot[1] || 0, rot[2] || 0);
    m.scale.set(scale[0], scale[1], scale[2]);
    s.add(m);
  };
  panel([2.4, 1.5, 0.7], [8, 3, 5], [12, 12, 1], [0, -Math.PI / 2.6, 0]);
  panel([0.35, 0.45, 0.7], [-7, 4, 3], [12, 12, 1], [0, Math.PI / 2.6, 0]);
  panel([1.2, 1.1, 0.95], [0, 9, 0], [16, 16, 1], [Math.PI / 2, 0, 0]);
  return s;
};

const makeFoliageTexture = (): THREE.CanvasTexture => {
  const s = 512;
  const cv = document.createElement("canvas");
  cv.width = s;
  cv.height = s;
  const ctx = cv.getContext("2d")!;
  ctx.clearRect(0, 0, s, s);
  ctx.fillStyle = "#fff";
  ctx.strokeStyle = "#fff";
  const rand = mulberry32(9);
  const drawLeaf = (x: number, y: number, r: number, a: number) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(a);
    ctx.beginPath();
    ctx.ellipse(0, 0, r, r * 0.42, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };
  ctx.lineWidth = 10;
  ctx.lineCap = "round";
  const branch = (x0: number, y0: number, ang: number, len: number, depth: number) => {
    if (depth <= 0) return;
    const x1 = x0 + Math.cos(ang) * len;
    const y1 = y0 + Math.sin(ang) * len;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.lineWidth = 3 + depth * 2.2;
    ctx.stroke();
    for (let i = 0; i < 5; i++) {
      const t = 0.2 + rand() * 0.8;
      const lx = x0 + (x1 - x0) * t;
      const ly = y0 + (y1 - y0) * t;
      drawLeaf(lx, ly, 16 + rand() * 22, ang + (rand() - 0.5) * 2.4);
    }
    branch(x1, y1, ang - 0.5 + (rand() - 0.5) * 0.4, len * 0.7, depth - 1);
    if (rand() > 0.35) branch(x1, y1, ang + 0.45 + (rand() - 0.5) * 0.4, len * 0.66, depth - 1);
  };
  branch(40, s - 20, -Math.PI / 2.5, 150, 4);
  branch(20, s - 60, -Math.PI / 3.1, 130, 4);
  return new THREE.CanvasTexture(cv);
};

const DUST_VERTEX = /* glsl */ `
  uniform float uTime, uSize, uPix; attribute float aPhase; varying float vTw;
  void main(){
    vec3 p = position;
    p.x += sin(uTime * 0.13 + aPhase) * 0.9;
    p.y += cos(uTime * 0.11 + aPhase * 1.7) * 0.6 + sin(uTime * 0.05 + aPhase) * 0.3;
    vTw = 0.45 + 0.55 * sin(uTime * 1.3 + aPhase * 3.0);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * uPix * 320.0 / max(0.5, -mv.z);
  }
`;
const DUST_FRAGMENT = /* glsl */ `
  uniform vec3 uColor; uniform float uOpacity; varying float vTw;
  void main(){
    vec2 d = gl_PointCoord - 0.5; float r = length(d);
    if (r > 0.5) discard;
    float a = smoothstep(0.5, 0.0, r) * vTw * uOpacity;
    gl_FragColor = vec4(uColor, a);
  }
`;

const GrainShader = {
  uniforms: {
    tDiffuse: { value: null as THREE.Texture | null },
    uAmount: { value: CONFIG.grain },
    uTime: { value: 0 },
    uAspect: { value: 1 },
  },
  vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse; uniform float uAmount, uTime, uAspect; varying vec2 vUv;
    float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
    void main(){
      vec4 c = texture2D(tDiffuse, vUv);
      float luma = dot(c.rgb, vec3(0.299, 0.587, 0.114));
      float g = hash(vUv * vec2(1920.0, 1080.0) + fract(uTime) * 137.0) - 0.5;
      c.rgb += g * uAmount * (0.6 + 0.9 * (1.0 - luma));
      vec2 d = (vUv - 0.5) * vec2(uAspect, 1.0);
      c.rgb *= 1.0 - smoothstep(0.55, 0.95, length(d)) * 0.28;
      gl_FragColor = c;
    }`,
};

interface GoldenParthenonOptions {
  includeGroundDisplacement: boolean;
  includeDust: boolean;
  bloomStrength: number;
  bloomRadius: number;
  bloomThreshold: number;
}

const buildGoldenParthenonScene = (
  container: HTMLElement,
  options: GoldenParthenonOptions,
): HeroSceneHandle => {
  const { includeGroundDisplacement, includeDust, bloomStrength, bloomRadius, bloomThreshold } = options;
  const canvas = document.createElement("canvas");
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
  const { clientWidth, clientHeight } = container;
  const { dprClamp } = getTierBudget(clientWidth || window.innerWidth);
  const pixelRatio = Math.min(window.devicePixelRatio, dprClamp);
  renderer.setPixelRatio(pixelRatio);
  renderer.setSize(clientWidth || 1, clientHeight || 1);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = CONFIG.exposure;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(new THREE.Color(CONFIG.fogColor), CONFIG.fogNear, CONFIG.fogFar);

  const camera = new THREE.PerspectiveCamera(CONFIG.fov, (clientWidth || 1) / (clientHeight || 1), 0.1, 2000);
  const CAM_TARGET = new THREE.Vector3(0, CONFIG.targetY, 0);
  camera.position.set(0, CONFIG.camY, CONFIG.camZ);
  camera.lookAt(CAM_TARGET);
  scene.add(camera);

  buildSky(scene);

  const sunGlow = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: makeGlowTexture(),
      color: new THREE.Color(CONFIG.sunGlow),
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: false,
      fog: false,
    }),
  );
  sunGlow.renderOrder = -1;
  scene.add(sunGlow);

  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  const envRT = pmrem.fromScene(buildEnvScene(), 0.04);
  scene.environment = envRT.texture;

  const sun = new THREE.DirectionalLight(new THREE.Color(CONFIG.keyColor), CONFIG.keyStrength);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.radius = 6;
  sun.shadow.bias = -0.0003;
  {
    const sc = sun.shadow.camera;
    sc.left = -14;
    sc.right = 14;
    sc.top = 16;
    sc.bottom = -12;
    sc.near = 1;
    sc.far = 90;
    sc.updateProjectionMatrix();
  }
  scene.add(sun);
  scene.add(sun.target);

  const hemi = new THREE.HemisphereLight(new THREE.Color(CONFIG.skyFillColor), new THREE.Color(CONFIG.groundFillColor), CONFIG.hemiStrength);
  scene.add(hemi);
  const ambient = new THREE.AmbientLight(0xffffff, CONFIG.ambient);
  scene.add(ambient);

  const _sunDir = new THREE.Vector3();
  const positionSun = (azimuthDeg: number, elevationDeg: number) => {
    const az = azimuthDeg * DEG;
    const el = elevationDeg * DEG;
    _sunDir.set(Math.cos(el) * Math.sin(az), Math.sin(el), Math.cos(el) * Math.cos(az));
    sun.target.position.copy(CAM_TARGET);
    sun.position.copy(CAM_TARGET).addScaledVector(_sunDir, 55);
    const gd = _sunDir.clone();
    gd.y = Math.max(0.015, gd.y * 0.5);
    gd.normalize();
    sunGlow.position.copy(camera.position).addScaledVector(gd, SKY_R * 0.72);
    sunGlow.scale.setScalar(CONFIG.sunGlowSize);
    sunGlow.material.opacity = CONFIG.sunGlowStrength;
  };

  // ---------------------------------------------------------------------
  // GROUND — real weathered-stone PBR maps (extracted to public/assets/
  // golden-parthenon/, see file header), optionally fbm-displaced.
  // ---------------------------------------------------------------------
  const texLoader = new THREE.TextureLoader();
  const loadStoneTex = (file: string, srgb: boolean): THREE.Texture => {
    const t = texLoader.load(`${ASSET_BASE}/${file}`);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(GROUND_SIZE / CONFIG.groundTile, GROUND_SIZE / CONFIG.groundTile);
    t.anisotropy = renderer.capabilities.getMaxAnisotropy();
    t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    return t;
  };
  const stoneColor = loadStoneTex("ground-color.jpg", true);
  const stoneNormal = loadStoneTex("ground-normal.jpg", false);
  const stoneRough = loadStoneTex("ground-rough.jpg", false);
  const groundMat = new THREE.MeshStandardMaterial({
    map: stoneColor,
    normalMap: stoneNormal,
    roughnessMap: stoneRough,
    color: new THREE.Color(CONFIG.groundColor),
    roughness: CONFIG.groundRough,
    metalness: 0,
    envMapIntensity: CONFIG.groundEnv,
  });
  groundMat.normalScale.set(CONFIG.groundBump, CONFIG.groundBump);

  const groundSegments = includeGroundDisplacement ? 320 : 8;
  const groundGeo = new THREE.PlaneGeometry(GROUND_SIZE, GROUND_SIZE, groundSegments, groundSegments);
  if (includeGroundDisplacement) {
    const pos = groundGeo.attributes.position;
    const amp = CONFIG.groundDisplace;
    const feat = Math.max(1, CONFIG.groundFeature);
    const flatR = CONFIG.groundFlatRadius;
    const crag = CONFIG.groundRough2;
    const cx = CONFIG.modelX;
    const cz = CONFIG.modelZ;
    for (let i = 0; i < pos.count; i++) {
      const lx = pos.getX(i);
      const ly = pos.getY(i);
      const h = (fbm(lx / feat + 100, ly / feat + 100, crag) * 2 - 1) * amp;
      const dist = Math.hypot(lx - cx, ly - cz);
      const fall = THREE.MathUtils.smoothstep(dist, flatR, flatR + 18);
      pos.setZ(i, -h * fall);
    }
    groundGeo.computeVertexNormals();
  }
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = CONFIG.groundY;
  ground.receiveShadow = true;
  ground.castShadow = true;
  scene.add(ground);

  // ---------------------------------------------------------------------
  // FOREGROUND FOLIAGE — camera-pinned corner frame, off by default
  // (fgOpacity: 0) but kept per the source's own quiet-by-design knob.
  // ---------------------------------------------------------------------
  const foliageMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(CONFIG.fgColor),
    alphaMap: makeFoliageTexture(),
    transparent: true,
    opacity: CONFIG.fgOpacity,
    depthTest: false,
    depthWrite: false,
    fog: false,
    toneMapped: false,
  });
  const foliage = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), foliageMat);
  foliage.renderOrder = 5;
  camera.add(foliage);
  const layoutFoliage = (width: number, height: number) => {
    const z = -1;
    const h = 2 * Math.tan((CONFIG.fov * DEG) / 2) * Math.abs(z);
    const w = h * (width / height);
    const S = 0.62 * CONFIG.fgScale;
    foliage.scale.set(w * S, h * S, 1);
    foliage.position.set(-w * 0.5 + w * S * 0.42, -h * 0.5 + h * S * 0.42, z);
  };

  // ---------------------------------------------------------------------
  // DUST
  // ---------------------------------------------------------------------
  let dust: THREE.Points | null = null;
  if (includeDust) {
    const n = Math.max(0, Math.round(CONFIG.dustAmount));
    const pos = new Float32Array(n * 3);
    const ph = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      pos[i * 3] = (Math.random() * 2 - 1) * 14;
      pos[i * 3 + 1] = (Math.random() * 2 - 1) * 9;
      pos[i * 3 + 2] = -2 - Math.random() * 20;
      ph[i] = Math.random() * 6.283;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("aPhase", new THREE.BufferAttribute(ph, 1));
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uSize: { value: CONFIG.dustSize },
        uColor: { value: new THREE.Color(CONFIG.dustColor) },
        uOpacity: { value: CONFIG.dustOpacity },
        uPix: { value: pixelRatio },
      },
      vertexShader: DUST_VERTEX,
      fragmentShader: DUST_FRAGMENT,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: false,
    });
    dust = new THREE.Points(geo, mat);
    dust.frustumCulled = false;
    camera.add(dust);
  }

  // ---------------------------------------------------------------------
  // TEMPLE — the real GLB, auto-fit then posed.
  // ---------------------------------------------------------------------
  const modelGroup = new THREE.Group();
  scene.add(modelGroup);
  let templeMats: THREE.Material[] = [];
  let disposed = false;
  let fitScale = 1;
  let inner: THREE.Group | null = null;

  const draco = new DRACOLoader();
  draco.setDecoderPath("/draco/");
  const gltfLoader = new GLTFLoader();
  gltfLoader.setDRACOLoader(draco);

  const _box = new THREE.Box3();
  const _size = new THREE.Vector3();
  const _center = new THREE.Vector3();
  const _tint = new THREE.Color();

  const applyModel = () => {
    if (inner) inner.scale.setScalar(fitScale * CONFIG.modelScale);
    modelGroup.rotation.y = CONFIG.modelYaw * DEG;
    modelGroup.position.set(CONFIG.modelX, CONFIG.groundY + CONFIG.modelY, CONFIG.modelZ);
  };
  const applyMarble = () => {
    _tint.set(CONFIG.marbleTint);
    for (const m of templeMats as THREE.MeshStandardMaterial[]) {
      if (m.color) m.color.copy(_tint);
      m.roughness = CONFIG.marbleRough;
      m.metalness = 0;
      m.envMapIntensity = CONFIG.marbleEnv;
      if (m.emissive) {
        m.emissive.set(CONFIG.keyColor);
        m.emissiveIntensity = CONFIG.warmBoost;
      }
      m.needsUpdate = true;
    }
  };

  gltfLoader.load(
    `${ASSET_BASE}/model.glb`,
    (gltf) => {
      if (disposed) return;
      const temple = gltf.scene;
      templeMats = [];
      temple.traverse((o) => {
        if ((o as THREE.Mesh).isMesh) {
          const mesh = o as THREE.Mesh;
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          const m = mesh.material as THREE.MeshStandardMaterial;
          m.envMapIntensity = CONFIG.marbleEnv;
          templeMats.push(m);
        }
      });
      _box.setFromObject(temple);
      _box.getSize(_size);
      _box.getCenter(_center);
      fitScale = 6 / (_size.y || 1);
      temple.position.set(-_center.x, -_center.y + _size.y / 2, -_center.z);
      inner = new THREE.Group();
      inner.add(temple);
      inner.scale.setScalar(fitScale);
      modelGroup.add(inner);
      applyModel();
      applyMarble();
    },
    undefined,
    (err) => console.error("Golden Parthenon GLB load failed", err),
  );

  // ---------------------------------------------------------------------
  // POST — RenderPass → UnrealBloom → OutputPass (ACES) → film grain
  // ---------------------------------------------------------------------
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(
    new THREE.Vector2(clientWidth || 1, clientHeight || 1),
    bloomStrength,
    bloomRadius,
    bloomThreshold,
  );
  composer.addPass(bloom);
  composer.addPass(new OutputPass());
  const grainPass = new ShaderPass(GrainShader);
  composer.addPass(grainPass);

  // ---- interaction state ----
  const pointer = { x: 0, y: 0 };
  const pSmooth = { x: 0, y: 0 };
  const setPointer = (x: number, y: number) => {
    // `HeroScene.tsx` already supplies container-relative NDC in the same
    // sign convention the source's own pointermove handler computes — no
    // conversion needed here (see file header).
    pointer.x = x;
    pointer.y = y;
  };

  let lastElapsed = 0;

  const renderStatic = () => {
    positionSun(CONFIG.sunAzimuth, CONFIG.sunElevation);
    renderer.toneMappingExposure = CONFIG.exposure;
    composer.render();
  };

  const renderFrame = (elapsedSeconds: number) => {
    const dt = Math.min(0.05, Math.max(0, elapsedSeconds - lastElapsed));
    lastElapsed = elapsedSeconds;

    const k = Math.min(1, dt * CONFIG.parallaxEase);
    pSmooth.x += (pointer.x - pSmooth.x) * k;
    pSmooth.y += (pointer.y - pSmooth.y) * k;
    camera.position.set(pSmooth.x * CONFIG.parallax, CONFIG.camY - pSmooth.y * CONFIG.parallax * 0.5, CONFIG.camZ);
    camera.lookAt(CAM_TARGET);
    positionSun(
      CONFIG.sunAzimuth + pSmooth.x * CONFIG.sunFollow,
      Math.max(1.5, CONFIG.sunElevation - pSmooth.y * CONFIG.sunFollow * 0.55),
    );

    if (dust) (dust.material as THREE.ShaderMaterial).uniforms.uTime.value = elapsedSeconds;
    grainPass.uniforms.uTime.value = elapsedSeconds;

    const appear = THREE.MathUtils.clamp((elapsedSeconds * 1000) / 1400, 0, 1);
    renderer.toneMappingExposure = CONFIG.exposure * (0.15 + 0.85 * appear);

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
    bloom.setSize(width, height);
    grainPass.uniforms.uAspect.value = width / height;
    if (dust) (dust.material as THREE.ShaderMaterial).uniforms.uPix.value = dpr;
    layoutFoliage(width, height);
  };
  resize(clientWidth || 1, clientHeight || 1);

  const dispose = () => {
    disposed = true;
    scene.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) {
        const mesh = o as THREE.Mesh;
        mesh.geometry?.dispose();
        const mat = mesh.material;
        if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
        else mat?.dispose();
      }
    });
    stoneColor.dispose();
    stoneNormal.dispose();
    stoneRough.dispose();
    sunGlow.material.map?.dispose();
    sunGlow.material.dispose();
    foliageMat.map?.dispose();
    foliageMat.dispose();
    envRT.texture.dispose();
    pmrem.dispose();
    if (dust) {
      dust.geometry.dispose();
      (dust.material as THREE.Material).dispose();
    }
    draco.dispose();
    composer.dispose();
    renderer.dispose();
  };

  return { renderStatic, renderFrame, resize, setPointer, dispose, canvas };
};

/** Full-bleed Civil Engineering service-page background — the source's own
 * bloom numbers verbatim (2 / 0.7 / 0.62), full ground relief, dust on. */
export const createGoldenParthenonHeroScene = (container: HTMLElement): HeroSceneHandle =>
  buildGoldenParthenonScene(container, {
    includeGroundDisplacement: true,
    includeDust: true,
    bloomStrength: CONFIG.bloomStrength,
    bloomRadius: CONFIG.bloomRadius,
    bloomThreshold: CONFIG.bloomThreshold,
  });

/** Small, contained homepage-card version — flat ground (no fbm
 * displacement), no dust, bloom toned down to 1.2/0.5/0.7 for the card's
 * small buffer, temple still renders in full. */
export const createGoldenParthenonCardScene = (container: HTMLElement): HeroSceneHandle =>
  buildGoldenParthenonScene(container, {
    includeGroundDisplacement: false,
    includeDust: false,
    bloomStrength: 1.2,
    bloomRadius: 0.5,
    bloomThreshold: 0.7,
  });
