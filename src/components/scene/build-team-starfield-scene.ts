/**
 * `/about/team`'s dedicated background — a plain, calm particle field.
 * Replaces that page's prior use of the shared Pinwheel Galaxy scene
 * (still used, unchanged, on `/about` — see `PinwheelGalaxyBackground.tsx`):
 * a spinning-galaxy simulation (differential rotation, a pulsing bulge,
 * rising sparks) reads as busy/explosive no matter what palette it's
 * tinted with, which is exactly what this page needed to stop doing. This
 * scene has no galaxy structure at all — one static point cloud, one very
 * slow whole-field rotation, no bloom, no composers. See ADR-0072.
 *
 * Deliberately the simplest scene in this codebase: no `EffectComposer` —
 * just one `THREE.Points` cloud with `NormalBlending` (additive blending on
 * white/blue points at this density reads as a soft glow that drifted back
 * toward the "nightclub" look this page explicitly needed to move away
 * from). Still needs a small custom `ShaderMaterial`, though — the stock
 * `THREE.PointsMaterial` renders hard-edged squares, not soft dots, and its
 * `sizeAttenuation` scales `gl_PointSize` by `(rendererHeight/2) /
 * -viewSpaceZ`, which is not a pixel size at all: a `size` chosen to look
 * like ~1.6px turned into ~90px squares for the particles nearest the
 * camera. Fixed the same way every other starfield in this codebase
 * already does it (see `build-planet-scene.ts`'s `addStars`) — a per-vertex
 * `size` attribute consumed directly as a **constant screen-space pixel
 * size** (no perspective division at all), plus a circular alpha falloff
 * in the fragment shader instead of a bare square.
 */
import * as THREE from "three";
import type { HeroSceneHandle } from "./hero-scene-types";

const STAR_VERT = /* glsl */ `
  attribute float size;
  attribute vec3 color;
  varying vec3 vColor;
  uniform float uPixelRatio;
  void main() {
    vColor = color;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = size * uPixelRatio;
    gl_Position = projectionMatrix * mvPosition;
  }`;

const STAR_FRAG = /* glsl */ `
  varying vec3 vColor;
  uniform float uOpacity;
  void main() {
    vec2 p = gl_PointCoord - 0.5;
    float d = length(p) * 2.0;
    float core = smoothstep(1.0, 0.0, d);
    gl_FragColor = vec4(vColor, core * uOpacity);
  }`;

const PALETTE = ["#ffffff", "#dcefff", "#a9d6e5", "#7fb3c8", "#5cc8d7"] as const;
/** One in this many particles gets the rare cyan accent (`PALETTE[4]`) —
 * everything else draws from the four white/blue-white shades. */
const ACCENT_EVERY = 14;

const BOUNDS = { x: 20, yMin: -15, yMax: 15, zMin: -15, zMax: 5 };
const ROTATION_SPEED_Y = 0.006; // rad/s — a full turn takes ~17 minutes
const ROTATION_SPEED_X = 0.0015;
const POINTER_MAX_OFFSET = 0.35; // world units — reads as a few px on screen

const hexToRgb = (hex: string): [number, number, number] => {
  const n = parseInt(hex.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};

const buildTeamStarfieldScene = (
  container: HTMLElement,
  particleCount: number,
): HeroSceneHandle => {
  const canvas = document.createElement("canvas");
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  const { clientWidth, clientHeight } = container;
  // Capped low and independent of this project's usual tier-based dprClamp
  // (`device-tier.ts`, normally up to 2) — this scene is meant to stay
  // negligibly cheap, not to match every other scene's sharpness budget.
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setSize(clientWidth || 1, clientHeight || 1);
  // Transparent clear — the page's own `--background` (#040d1a) stays the
  // authoritative colour; this canvas only ever draws the points on top of
  // it, never a fill behind them.
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    50,
    (clientWidth || 1) / (clientHeight || 1),
    0.1,
    100,
  );
  camera.position.set(0, 0, 12);

  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);
  const sizes = new Float32Array(particleCount);
  const paletteRgb = PALETTE.map(hexToRgb);
  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() * 2 - 1) * BOUNDS.x;
    positions[i * 3 + 1] = BOUNDS.yMin + Math.random() * (BOUNDS.yMax - BOUNDS.yMin);
    positions[i * 3 + 2] = BOUNDS.zMin + Math.random() * (BOUNDS.zMax - BOUNDS.zMin);

    const isAccent = i % ACCENT_EVERY === 0;
    const [r, g, b] = isAccent ? paletteRgb[4] : paletteRgb[i % 4];
    colors[i * 3] = r;
    colors[i * 3 + 1] = g;
    colors[i * 3 + 2] = b;

    // A small minority render slightly larger — "a tiny number may be
    // slightly larger to create depth" — rest stay near the floor size.
    sizes[i] = Math.random() < 0.08 ? 2.2 + Math.random() * 0.3 : 1 + Math.random() * 0.8;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uPixelRatio: { value: renderer.getPixelRatio() },
      uOpacity: { value: 0.4 },
    },
    vertexShader: STAR_VERT,
    fragmentShader: STAR_FRAG,
    transparent: true,
    blending: THREE.NormalBlending,
    depthWrite: false,
  });
  const points = new THREE.Points(geometry, material);
  scene.add(points);

  let cameraTargetX = 0;
  let cameraTargetY = 0;

  const renderStatic = () => {
    renderer.render(scene, camera);
  };

  const renderFrame = (elapsedSeconds: number, dt: number) => {
    points.rotation.y += ROTATION_SPEED_Y * dt;
    points.rotation.x += ROTATION_SPEED_X * dt;

    // Pointer parallax: camera eases toward a tiny offset, never chases —
    // "maximum movement should be approximately 2-4px perceived movement".
    camera.position.x += (cameraTargetX - camera.position.x) * Math.min(1, dt * 1.5);
    camera.position.y += (cameraTargetY - camera.position.y) * Math.min(1, dt * 1.5);
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
  };

  let lastElapsed = 0;
  const renderFrameFromHeroScene = (elapsedSeconds: number) => {
    const dt = Math.min(0.1, Math.max(0, elapsedSeconds - lastElapsed));
    lastElapsed = elapsedSeconds;
    renderFrame(elapsedSeconds, dt);
  };

  const resize = (width: number, height: number) => {
    if (width <= 0 || height <= 0) return;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  };
  resize(clientWidth || 1, clientHeight || 1);

  const setPointer = (x: number, y: number) => {
    cameraTargetX = x * POINTER_MAX_OFFSET;
    cameraTargetY = -y * POINTER_MAX_OFFSET;
  };

  const dispose = () => {
    geometry.dispose();
    material.dispose();
    renderer.dispose();
  };

  return { renderStatic, renderFrame: renderFrameFromHeroScene, resize, setPointer, dispose, canvas };
};

/** Desktop/tablet particle counts — mobile never reaches this factory at
 * all (`HeroScene.tsx` shows the fallback gradient below the mobile
 * breakpoint, same as every other full-page scene in this codebase). */
export const createTeamStarfieldScene = (container: HTMLElement): HeroSceneHandle => {
  const isTablet = (container.clientWidth || window.innerWidth) < 1024;
  return buildTeamStarfieldScene(container, isTablet ? 550 : 950);
};
