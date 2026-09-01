/**
 * Custom clamped-orbit camera — real click-and-drag orbiting + wheel zoom,
 * a genuinely new interaction for this codebase (every other scene here
 * only does passive pointer-parallax on an always `pointer-events-none`
 * canvas). The brief explicitly asks for real orbit/zoom, which needs the
 * canvas to actually receive pointer events — this scene's canvas gets
 * `pointer-events: auto` set directly on the element (only this scene;
 * every other canvas in the codebase stays `pointer-events-none`), plus
 * its own local `pointerdown`/`pointermove`/`pointerup`/`wheel` listeners,
 * rather than reading the shared passive pointer store other scenes use
 * for parallax-only tilt. No R3F/drei `OrbitControls` available (vanilla
 * Three.js by explicit choice, see ADR-0061) — this is a small, purpose-
 * built equivalent: spherical coordinates around a fixed look-at target,
 * clamped azimuth/polar/distance ranges, damped toward every target so
 * drag/zoom/idle-rotate/parallax all read as one smooth motion.
 */
import * as THREE from "three";

const TARGET = new THREE.Vector3(-0.8, -2.3, 0.2);
const BASE_AZIMUTH = THREE.MathUtils.degToRad(38);
const BASE_POLAR = THREE.MathUtils.degToRad(52);
const AZIMUTH_RANGE = THREE.MathUtils.degToRad(42);
const POLAR_MIN = THREE.MathUtils.degToRad(30);
const POLAR_MAX = THREE.MathUtils.degToRad(76);
const MIN_DISTANCE = 11;
const MAX_DISTANCE = 24;
const BASE_DISTANCE = 18;
const DRAG_ROTATE_SPEED = 0.006;
const WHEEL_ZOOM_SPEED = 0.012;
const DAMPING = 4.5;
const PARALLAX_MAX_AZIMUTH = THREE.MathUtils.degToRad(4.5);
const PARALLAX_MAX_POLAR = THREE.MathUtils.degToRad(2.5);
/** Idle "engineering showcase" rotation on load — a few degrees, once,
 * never a continuous product-viewer spin. */
const IDLE_ROTATE_TOTAL = THREE.MathUtils.degToRad(10);
const IDLE_ROTATE_DURATION_S = 3.2;

export interface CameraControllerHandle {
  camera: THREE.PerspectiveCamera;
  update: (dt: number, elapsedSeconds: number) => void;
  setAspect: (aspect: number) => void;
  setParallax: (ndcX: number, ndcY: number) => void;
  /** Additive scroll-driven nudge on top of the user's own drag/zoom state
   * — `distanceNudge` in world units, `azimuthNudge` in radians. Both
   * damped internally so scroll and user interaction compose smoothly
   * instead of fighting. */
  setScrollInfluence: (distanceNudge: number, azimuthNudge: number) => void;
  isDragging: () => boolean;
  dispose: () => void;
}

export const createCameraController = (canvas: HTMLCanvasElement, aspect: number): CameraControllerHandle => {
  const camera = new THREE.PerspectiveCamera(42, aspect, 0.1, 100);

  let azimuth = BASE_AZIMUTH;
  let polar = BASE_POLAR;
  let distance = BASE_DISTANCE;
  let targetAzimuth = azimuth;
  let targetPolar = polar;
  let targetDistance = distance;
  let parallaxAzimuth = 0;
  let parallaxPolar = 0;
  let scrollAzimuthNudge = 0;
  let scrollDistanceNudge = 0;
  let scrollAzimuthNudgeTarget = 0;
  let scrollDistanceNudgeTarget = 0;

  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  let idleElapsed = 0;

  const onPointerDown = (e: PointerEvent) => {
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    canvas.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: PointerEvent) => {
    if (!dragging) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;
    targetAzimuth = THREE.MathUtils.clamp(
      targetAzimuth - dx * DRAG_ROTATE_SPEED,
      BASE_AZIMUTH - AZIMUTH_RANGE,
      BASE_AZIMUTH + AZIMUTH_RANGE,
    );
    targetPolar = THREE.MathUtils.clamp(targetPolar - dy * DRAG_ROTATE_SPEED, POLAR_MIN, POLAR_MAX);
  };
  const onPointerUp = (e: PointerEvent) => {
    dragging = false;
    if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
  };
  const onWheel = (e: WheelEvent) => {
    e.preventDefault();
    targetDistance = THREE.MathUtils.clamp(targetDistance + e.deltaY * WHEEL_ZOOM_SPEED, MIN_DISTANCE, MAX_DISTANCE);
  };

  canvas.style.pointerEvents = "auto";
  canvas.style.touchAction = "none";
  canvas.style.cursor = "grab";
  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("pointercancel", onPointerUp);
  canvas.addEventListener("wheel", onWheel, { passive: false });

  const applyCartesian = () => {
    const totalAzimuth = azimuth + parallaxAzimuth + scrollAzimuthNudge;
    const totalPolar = THREE.MathUtils.clamp(polar + parallaxPolar, POLAR_MIN * 0.9, POLAR_MAX * 1.02);
    const totalDistance = THREE.MathUtils.clamp(distance + scrollDistanceNudge, MIN_DISTANCE * 0.85, MAX_DISTANCE);
    const sinPolar = Math.sin(totalPolar);
    camera.position.set(
      TARGET.x + totalDistance * sinPolar * Math.sin(totalAzimuth),
      TARGET.y + totalDistance * Math.cos(totalPolar),
      TARGET.z + totalDistance * sinPolar * Math.cos(totalAzimuth),
    );
    camera.lookAt(TARGET);
  };
  applyCartesian();

  return {
    camera,
    update: (dt, _elapsedSeconds) => {
      void _elapsedSeconds;
      if (idleElapsed < IDLE_ROTATE_DURATION_S && !dragging) {
        const prevT = idleElapsed / IDLE_ROTATE_DURATION_S;
        idleElapsed = Math.min(IDLE_ROTATE_DURATION_S, idleElapsed + dt);
        const t = idleElapsed / IDLE_ROTATE_DURATION_S;
        const eased = 1 - Math.pow(1 - t, 3);
        const prevEased = 1 - Math.pow(1 - prevT, 3);
        targetAzimuth += (eased - prevEased) * IDLE_ROTATE_TOTAL;
      }
      const damping = Math.min(1, dt * DAMPING);
      azimuth += (targetAzimuth - azimuth) * damping;
      polar += (targetPolar - polar) * damping;
      distance += (targetDistance - distance) * damping;
      scrollAzimuthNudge += (scrollAzimuthNudgeTarget - scrollAzimuthNudge) * Math.min(1, dt * 2.4);
      scrollDistanceNudge += (scrollDistanceNudgeTarget - scrollDistanceNudge) * Math.min(1, dt * 2.4);
      canvas.style.cursor = dragging ? "grabbing" : "grab";
      applyCartesian();
    },
    setAspect: (nextAspect) => {
      camera.aspect = nextAspect;
      camera.updateProjectionMatrix();
    },
    setParallax: (ndcX, ndcY) => {
      if (dragging) return;
      const targetParallaxAzimuth = THREE.MathUtils.clamp(ndcX, -1, 1) * PARALLAX_MAX_AZIMUTH;
      const targetParallaxPolar = THREE.MathUtils.clamp(-ndcY, -1, 1) * PARALLAX_MAX_POLAR;
      parallaxAzimuth += (targetParallaxAzimuth - parallaxAzimuth) * 0.06;
      parallaxPolar += (targetParallaxPolar - parallaxPolar) * 0.06;
    },
    setScrollInfluence: (distanceNudge: number, azimuthNudge: number) => {
      scrollDistanceNudgeTarget = distanceNudge;
      scrollAzimuthNudgeTarget = azimuthNudge;
    },
    isDragging: () => dragging,
    dispose: () => {
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
      canvas.removeEventListener("wheel", onWheel);
    },
  };
};
