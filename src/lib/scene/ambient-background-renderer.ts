/**
 * Persistent ambient background — a slow drift of wireframe shapes (geodesic
 * spheres, octahedrons, toruses, and construction-themed silhouettes: thin
 * I-beam cross-sections, hex "bolt" cylinders) behind every page, alive for
 * the whole app lifetime. Mounted once from `AmbientBackground.tsx` in
 * `layout.tsx`, unlike the per-route `HeroScene` (which unmounts/disposes on
 * navigation) — this is a third standalone WebGL-context pattern alongside
 * the hero and the shared scissored mini-scene renderer
 * (`shared-viewport-renderer.ts`); see obsidian/meta/decisions-log.md.
 *
 * Reads the shared pointer/scroll-signal stores non-reactively (per-frame
 * polling, same convention `HeroScene` uses for its own pointer parallax) so
 * nearby shapes tilt toward the cursor and fast scrolling stretches/dims the
 * field — items 12 of the homepage motion spec. A periodic thin bright line
 * ("shooting star" / lidar-pulse, item 13) sweeps the scene every 4–8s.
 */
import * as THREE from "three";
import { disposeSceneObjects } from "./shared-viewport-renderer";
import { getPointerSnapshot } from "@/hooks/cursor/use-pointer";
import { getScrollSignalSnapshot } from "@/hooks/scroll/use-scroll-signal";
import { HERO_SCENE_COLORS as COLOR } from "@/components/scene/hero-scene-colors";

const FIELD_DEPTH = 14;
const FIELD_SPREAD_X = 9;
const FIELD_SPREAD_Y = 6;
const CURSOR_TILT_RADIUS = 0.55; // NDC-space proximity a shape must be within to react
const CURSOR_TILT_STRENGTH = 0.6;
const SCROLL_STRETCH_VELOCITY_DIVISOR = 60;
const MAX_SCROLL_STRETCH = 0.6;
const PULSE_MIN_DELAY_S = 4;
const PULSE_MAX_DELAY_S = 8;
const PULSE_DURATION_S = 0.55;

interface Shape {
  mesh: THREE.LineSegments;
  basePosition: THREE.Vector3;
  driftPhase: THREE.Vector3;
  driftSpeed: THREE.Vector3;
  rotationSpeed: THREE.Vector3;
  baseOpacity: number;
  material: THREE.LineBasicMaterial;
}

const geometryFactories: Array<() => THREE.BufferGeometry> = [
  () => new THREE.IcosahedronGeometry(0.9, 1), // geodesic sphere
  () => new THREE.OctahedronGeometry(0.85),
  () => new THREE.TorusGeometry(0.7, 0.22, 6, 16),
  () => new THREE.BoxGeometry(1.3, 0.16, 0.16), // I-beam cross-section silhouette
  () => new THREE.CylinderGeometry(0.45, 0.45, 0.18, 6), // hex bolt
];

const randomRange = (min: number, max: number) => min + Math.random() * (max - min);
const randomPulseDelay = () => randomRange(PULSE_MIN_DELAY_S, PULSE_MAX_DELAY_S);

let renderer: THREE.WebGLRenderer | null = null;
let scene: THREE.Scene | null = null;
let camera: THREE.PerspectiveCamera | null = null;
let canvasEl: HTMLCanvasElement | null = null;
let rafId: number | null = null;
let startTime: number | null = null;
let pageVisible = true;
let shapes: Shape[] = [];
let pulseLine: THREE.Line | null = null;
let pulseMaterial: THREE.LineBasicMaterial | null = null;
let pulseStartTime: number | null = null;
let nextPulseAt = randomPulseDelay();
let refCount = 0;
let dprClamp = 2;

const handleVisibility = (): void => {
  pageVisible = document.visibilityState === "visible";
};

const handleResize = (): void => {
  if (!renderer || !camera) return;
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
};

const buildShapes = (count: number): Shape[] => {
  const built: Shape[] = [];
  for (let i = 0; i < count; i++) {
    const geometry = new THREE.WireframeGeometry(
      geometryFactories[i % geometryFactories.length](),
    );
    const depth = randomRange(2, FIELD_DEPTH);
    const scale = 0.4 + depth / FIELD_DEPTH; // nearer (small depth) reads larger
    const baseOpacity = randomRange(0.06, 0.16) * (1.4 - depth / FIELD_DEPTH);
    const material = new THREE.LineBasicMaterial({
      color: i % 3 === 0 ? COLOR.glow : COLOR.line,
      transparent: true,
      opacity: baseOpacity,
    });
    const mesh = new THREE.LineSegments(geometry, material);
    const basePosition = new THREE.Vector3(
      randomRange(-FIELD_SPREAD_X, FIELD_SPREAD_X),
      randomRange(-FIELD_SPREAD_Y, FIELD_SPREAD_Y),
      -depth,
    );
    mesh.position.copy(basePosition);
    mesh.scale.setScalar(scale);
    mesh.rotation.set(randomRange(0, Math.PI), randomRange(0, Math.PI), 0);

    built.push({
      mesh,
      basePosition,
      driftPhase: new THREE.Vector3(randomRange(0, Math.PI * 2), randomRange(0, Math.PI * 2), 0),
      driftSpeed: new THREE.Vector3(randomRange(0.05, 0.12), randomRange(0.04, 0.1), 0),
      rotationSpeed: new THREE.Vector3(
        randomRange(-0.06, 0.06),
        randomRange(-0.06, 0.06),
        randomRange(-0.03, 0.03),
      ),
      baseOpacity,
      material,
    });
  }
  return built;
};

const buildPulse = (): { line: THREE.Line; material: THREE.LineBasicMaterial } => {
  const geometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 0, 0),
  ]);
  const material = new THREE.LineBasicMaterial({
    color: COLOR.glow,
    transparent: true,
    opacity: 0,
  });
  return { line: new THREE.Line(geometry, material), material };
};

/** Advances the shooting-star pulse; spawns a new diagonal sweep on its own timer. */
const updatePulse = (elapsed: number): void => {
  if (!scene || !pulseLine || !pulseMaterial) return;

  if (pulseStartTime === null) {
    if (elapsed < nextPulseAt) return;
    pulseStartTime = elapsed;
  }

  const progress = (elapsed - pulseStartTime) / PULSE_DURATION_S;
  if (progress >= 1) {
    pulseMaterial.opacity = 0;
    pulseStartTime = null;
    nextPulseAt = elapsed + randomPulseDelay();
    return;
  }

  const startX = -FIELD_SPREAD_X - 2;
  const endX = FIELD_SPREAD_X + 2;
  const travel = startX + (endX - startX) * progress;
  const positions = pulseLine.geometry.attributes.position as THREE.BufferAttribute;
  positions.setXYZ(0, travel, FIELD_SPREAD_Y + 1 - progress * (FIELD_SPREAD_Y * 2 + 2), -4);
  positions.setXYZ(1, travel - 1.6, FIELD_SPREAD_Y + 1.6 - progress * (FIELD_SPREAD_Y * 2 + 2), -4);
  positions.needsUpdate = true;
  pulseMaterial.opacity = Math.sin(progress * Math.PI) * 0.6;
};

const loop = (time: number): void => {
  rafId = requestAnimationFrame(loop);
  if (!renderer || !camera || !scene || !pageVisible) return;
  if (startTime === null) startTime = time;
  const elapsed = (time - startTime) / 1000;

  const pointer = getPointerSnapshot();
  const scrollSignal = getScrollSignalSnapshot();
  // Before the first real pointermove, `x`/`y` are still the `0,0` default —
  // treat that as "no cursor influence" rather than tilting every shape
  // toward the top-left corner.
  const pointerNdcX = pointer.hasMoved ? (pointer.x / window.innerWidth) * 2 - 1 : 10;
  const pointerNdcY = pointer.hasMoved ? -((pointer.y / window.innerHeight) * 2 - 1) : 10;
  const scrollStretch = Math.min(
    Math.abs(scrollSignal.velocity) / SCROLL_STRETCH_VELOCITY_DIVISOR,
    MAX_SCROLL_STRETCH,
  );

  for (const shape of shapes) {
    const drift = shape.driftPhase;
    shape.mesh.position.x =
      shape.basePosition.x + Math.sin(elapsed * shape.driftSpeed.x + drift.x) * 0.6;
    shape.mesh.position.y =
      shape.basePosition.y + Math.cos(elapsed * shape.driftSpeed.y + drift.y) * 0.5;

    shape.mesh.rotation.x += shape.rotationSpeed.x * 0.016;
    shape.mesh.rotation.y += shape.rotationSpeed.y * 0.016;
    shape.mesh.rotation.z += shape.rotationSpeed.z * 0.016;

    // Nearest shapes (in screen-projected space) tilt toward the cursor.
    const screenX = shape.mesh.position.x / FIELD_SPREAD_X;
    const screenY = shape.mesh.position.y / FIELD_SPREAD_Y;
    const distance = Math.hypot(screenX - pointerNdcX, screenY - pointerNdcY);
    if (distance < CURSOR_TILT_RADIUS) {
      const pull = (1 - distance / CURSOR_TILT_RADIUS) * CURSOR_TILT_STRENGTH;
      shape.mesh.rotation.x += (pointerNdcY - screenY) * pull * 0.02;
      shape.mesh.rotation.y += (pointerNdcX - screenX) * pull * 0.02;
    }

    // Fast scroll stretches shapes along the scroll direction and dims them —
    // a cheap stand-in for a directional blur (a real post-process blur pass
    // is out of scope for an always-on background layer).
    const stretchDirection = scrollSignal.direction >= 0 ? 1 : -1;
    shape.mesh.scale.y = shape.mesh.scale.x * (1 + scrollStretch * stretchDirection * 0.4);
    shape.material.opacity = shape.baseOpacity * (1 - scrollStretch * 0.5);
  }

  updatePulse(elapsed);

  renderer.render(scene, camera);
};

const start = (): void => {
  if (rafId !== null) return;
  rafId = requestAnimationFrame(loop);
};

export interface AmbientBackgroundOptions {
  shapeCount: number;
  dprClamp: number;
}

/**
 * Starts (or joins, ref-counted) the ambient background. Returns a stop
 * function — call it on unmount. Ref-counting keeps this safe under React
 * Strict Mode's dev double-invoke without leaking a second WebGL context.
 */
export const startAmbientBackground = (options: AmbientBackgroundOptions): (() => void) => {
  refCount += 1;
  dprClamp = options.dprClamp;

  if (refCount === 1) {
    const canvas = document.createElement("canvas");
    canvas.style.position = "fixed";
    canvas.style.inset = "0";
    canvas.style.width = "100vw";
    canvas.style.height = "100vh";
    canvas.style.pointerEvents = "none";
    canvas.style.zIndex = "0";
    document.body.appendChild(canvas);
    canvasEl = canvas;

    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, dprClamp));
    renderer.setSize(window.innerWidth, window.innerHeight, false);

    camera = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      0.1,
      40,
    );
    camera.position.z = 6;

    scene = new THREE.Scene();
    shapes = buildShapes(options.shapeCount);
    shapes.forEach((shape) => scene!.add(shape.mesh));

    const pulse = buildPulse();
    pulseLine = pulse.line;
    pulseMaterial = pulse.material;
    scene.add(pulseLine);

    window.addEventListener("resize", handleResize, { passive: true });
    document.addEventListener("visibilitychange", handleVisibility);
    start();
  }

  return () => {
    refCount -= 1;
    if (refCount > 0) return;

    if (rafId !== null) cancelAnimationFrame(rafId);
    rafId = null;
    startTime = null;
    pulseStartTime = null;
    nextPulseAt = randomPulseDelay();
    window.removeEventListener("resize", handleResize);
    document.removeEventListener("visibilitychange", handleVisibility);

    if (scene) disposeSceneObjects(scene);
    renderer?.dispose();
    canvasEl?.remove();

    renderer = null;
    scene = null;
    camera = null;
    canvasEl = null;
    shapes = [];
    pulseLine = null;
    pulseMaterial = null;
  };
};
