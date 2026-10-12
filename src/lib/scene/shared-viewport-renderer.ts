/**
 * One shared WebGL context for every "mini scene" on the page (service card
 * icons, the geological cross-section, the stats globe, the contact terrain).
 * Each caller registers a DOM element; every frame the element's
 * `getBoundingClientRect()` becomes a scissor rect on a single full-viewport
 * canvas, so N mini-scenes cost one GL context instead of N — the technique
 * the three.js manual documents for "multiple canvases, one WebGL context".
 * See obsidian/architecture/tech-stack.md → "3D — shared viewport renderer".
 *
 * The homepage hero keeps its own dedicated `HeroScene` — it is full-bleed
 * and benefits from an uncontested context; this renderer is for the many
 * small scenes threaded through the rest of the page.
 */
import * as THREE from "three";
import { getTierBudget, isLowPowerDevice } from "./device-tier";

export interface ViewportBuild {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  /** `control` is a caller-defined 0..1 (or unbounded) value — hover intensity for
   * service icons, scroll progress for the geological cross-section, etc.
   * `rect` is this registration's live `getBoundingClientRect()` (already computed
   * every frame for scissoring) — optional third param for scenes that want
   * cursor-relative effects (tilt toward the pointer) via the shared pointer store
   * (`@/hooks/cursor/use-pointer`); most builders ignore it. */
  update: (elapsedSeconds: number, control: number, rect: DOMRect) => void;
  dispose: () => void;
}

export type ViewportBuilder = (aspect: number) => ViewportBuild;

interface Registration {
  element: HTMLElement;
  build: ViewportBuild;
  active: boolean;
  control: { current: number };
  warnedOnce: boolean;
}

/** True if any mesh/line geometry in the scene has a non-finite position value —
 * the condition that makes `computeBoundingSphere()` produce a NaN radius/center.
 * Checked directly against the position array (rather than by calling
 * `computeBoundingSphere()` and inspecting the result) so a broken scene doesn't
 * spam THREE's internal "Computed radius is NaN" console error every frame. */
const sceneHasInvalidGeometry = (scene: THREE.Scene): boolean => {
  let invalid = false;
  scene.traverse((object) => {
    if (invalid) return;
    const withGeometry = object as unknown as { geometry?: THREE.BufferGeometry };
    const position = withGeometry.geometry?.attributes.position;
    if (!position) return;
    const array = position.array;
    for (let i = 0; i < array.length; i++) {
      if (!Number.isFinite(array[i])) {
        invalid = true;
        break;
      }
    }
  });
  return invalid;
};

const registrations = new Map<number, Registration>();
let nextId = 1;

let renderer: THREE.WebGLRenderer | null = null;
let canvasEl: HTMLCanvasElement | null = null;
let rafId: number | null = null;
let startTime: number | null = null;
let pageVisible = true;

const handleVisibility = () => {
  pageVisible = document.visibilityState === "visible";
};

/** Scissor-clears exactly one registration's current on-screen rect. Used
 * when a registration goes inactive (element scrolled out of view) so its
 * last-rendered pixels don't linger as a "ghost" — `renderer.autoClear` is
 * off (each registration manually clears only its own scissored slice, so N
 * scenes share one canvas without wiping each other), which means a
 * registration the render loop stops visiting (its `active` flag false) is
 * never cleared again by the loop itself. That's invisible in the common
 * case, where the element has already scrolled off-screen by the time
 * `IntersectionObserver` fires — but on a fast scroll (a big wheel flick, a
 * jump-to-section link, or simulated in a test via a large single scroll
 * delta), the observer can lag behind enough that the *last frame rendered
 * while still active* was drawn at a rect that's still on-screen, leaving a
 * frozen, never-cleared fragment of that scene sitting at whatever position
 * it happened to be — this is what a QA pass caught. */
const clearRegistrationRect = (element: HTMLElement): void => {
  if (!renderer) return;
  const rect = element.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return;

  const dpr = renderer.getPixelRatio();
  const viewportHeight = window.innerHeight;
  const x = Math.round(rect.left * dpr);
  const y = Math.round((viewportHeight - rect.bottom) * dpr);
  const w = Math.round(rect.width * dpr);
  const h = Math.round(rect.height * dpr);
  if (w <= 0 || h <= 0) return;

  renderer.setViewport(x, y, w, h);
  renderer.setScissor(x, y, w, h);
  renderer.clear();
};

// Width-only guard (optimize-3d-scene skill §13) — see the identical fix in
// `ambient-background-renderer.ts` for why: iOS URL-bar collapse during
// scroll fires `resize` with the width unchanged, and resizing the drawing
// buffer on that reads as a flicker.
let lastResizeWidth = typeof window !== "undefined" ? window.innerWidth : 0;
const handleResize = () => {
  if (!renderer) return;
  if (window.innerWidth === lastResizeWidth) return;
  lastResizeWidth = window.innerWidth;
  renderer.setSize(window.innerWidth, window.innerHeight, false);
};

const ensureRenderer = (): THREE.WebGLRenderer => {
  if (renderer) return renderer;

  const canvas = document.createElement("canvas");
  canvas.style.position = "fixed";
  canvas.style.inset = "0";
  canvas.style.width = "100vw";
  canvas.style.height = "100vh";
  canvas.style.pointerEvents = "none";
  canvas.style.zIndex = "1";
  document.body.appendChild(canvas);
  canvasEl = canvas;

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  // Tier-based, not a flat 2x — see the identical fix in
  // `service-heroes/hero-scene-runtime.ts`. Read once here (construction-time
  // only, matching every other per-tier value in this project) rather than on
  // every `handleResize` — a device doesn't change tier mid-session.
  const { dprClamp } = getTierBudget(window.innerWidth);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, dprClamp));
  renderer.autoClear = false;
  renderer.setScissorTest(true);
  renderer.setSize(window.innerWidth, window.innerHeight, false);

  window.addEventListener("resize", handleResize, { passive: true });
  document.addEventListener("visibilitychange", handleVisibility);
  window.addEventListener("pagehide", disposeRenderer);

  return renderer;
};

// Unlike `registerViewport`'s own `unregister()` (which only drops that one
// registration and stops the shared rAF loop once every registration is
// gone — the renderer/canvas themselves are deliberately never torn down
// mid-session, since another mini-scene can register again at any time),
// this forces a full teardown. Exists for `pagehide` specifically — a real
// iOS crash report prompted this, and `pagehide` (navigation away, tab
// close, bfcache eviction) isn't covered by the `visibilitychange` gate
// already in place, which only pauses rendering, not frees it. Idempotent:
// `renderer?.dispose()` and the rest all no-op past the first call, and
// `ensureRenderer()` transparently rebuilds everything from scratch the
// next time any caller registers, so a `pagehide` that turns out to be a
// bfcache round-trip rather than a real unload self-heals on return.
const disposeRenderer = (): void => {
  if (rafId !== null) cancelAnimationFrame(rafId);
  rafId = null;
  window.removeEventListener("resize", handleResize);
  document.removeEventListener("visibilitychange", handleVisibility);
  window.removeEventListener("pagehide", disposeRenderer);

  registrations.forEach((reg) => reg.build.dispose());
  registrations.clear();
  renderer?.dispose();
  canvasEl?.remove();
  renderer = null;
  canvasEl = null;
};

const loop = (time: number) => {
  rafId = requestAnimationFrame(loop);
  if (!renderer || !pageVisible || registrations.size === 0) return;
  if (startTime === null) startTime = time;
  const elapsed = (time - startTime) / 1000;

  const dpr = renderer.getPixelRatio();
  const viewportHeight = window.innerHeight;

  registrations.forEach((reg) => {
    if (!reg.active) return;
    const rect = reg.element.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    if (rect.bottom < 0 || rect.top > viewportHeight) return;

    const x = Math.round(rect.left * dpr);
    const y = Math.round((viewportHeight - rect.bottom) * dpr);
    const w = Math.round(rect.width * dpr);
    const h = Math.round(rect.height * dpr);
    if (w <= 0 || h <= 0) return;

    renderer!.setViewport(x, y, w, h);
    renderer!.setScissor(x, y, w, h);
    renderer!.clear();

    // Isolate failures — one scene's `update()` throwing must not skip
    // every other registration for this frame (a plain `forEach` callback
    // throwing aborts the whole iteration, unlike an early `return`).
    try {
      const aspect = rect.width / rect.height;
      if (reg.build.camera.aspect !== aspect) {
        reg.build.camera.aspect = aspect;
        reg.build.camera.updateProjectionMatrix();
      }

      reg.build.update(elapsed, reg.control.current, rect);

      if (sceneHasInvalidGeometry(reg.build.scene)) {
        if (!reg.warnedOnce) {
          console.error(
            "[shared-viewport-renderer] Skipping render: scene geometry has NaN position values.",
          );
          reg.warnedOnce = true;
        }
        return;
      }

      renderer!.render(reg.build.scene, reg.build.camera);
    } catch (error) {
      if (!reg.warnedOnce) {
        console.error("[shared-viewport-renderer] registration update threw:", error);
        reg.warnedOnce = true;
      }
    }
  });
};

const startLoop = () => {
  ensureRenderer();
  if (rafId !== null) return;
  rafId = requestAnimationFrame(loop);
};

const stopLoopIfIdle = () => {
  if (registrations.size > 0 || rafId === null) return;
  cancelAnimationFrame(rafId);
  rafId = null;
};

export interface RegisterOptions {
  element: HTMLElement;
  builder: ViewportBuilder;
}

export interface RegisteredViewport {
  setActive: (active: boolean) => void;
  setControl: (value: number) => void;
  unregister: () => void;
}

/** Registers one mini-scene against the shared canvas. Call `unregister()` on unmount. */
export const registerViewport = ({
  element,
  builder,
}: RegisterOptions): RegisteredViewport => {
  const id = nextId++;
  const rect = element.getBoundingClientRect();
  const aspect = rect.width > 0 && rect.height > 0 ? rect.width / rect.height : 1;
  const build = builder(aspect);

  const reg: Registration = {
    element,
    build,
    active: true,
    control: { current: 0 },
    warnedOnce: false,
  };
  registrations.set(id, reg);
  startLoop();

  return {
    setActive: (active) => {
      if (reg.active && !active) clearRegistrationRect(reg.element);
      reg.active = active;
    },
    setControl: (value) => {
      reg.control.current = value;
    },
    unregister: () => {
      registrations.delete(id);
      build.dispose();
      stopLoopIfIdle();
    },
  };
};

/**
 * True under the OS `prefers-reduced-motion` setting *or* on the "low"
 * capability tier (`device-tier.ts#isLowPowerDevice`) — Tier 1 disables every
 * non-WebGL animation surface too (ambient background gating, the cursor
 * trail, the scroll cue, the page-load intro, route-transition sweep), not
 * just the 3D scenes `isLowPowerDevice()` already skips on its own. Every
 * existing caller of this function picks up the Tier 1 behaviour with zero
 * additional wiring — the same "one module decides" principle `device-tier.ts`
 * already documents for `isLowPowerDevice()` itself.
 */
// Both checks gated behind one `typeof window !== "undefined"`, not just
// the matchMedia one — found via a real bug: `isLowPowerDevice()` (and
// therefore `detectPerformanceTier`'s `navigator.hardwareConcurrency` read)
// has no such guard of its own, and Node.js 21+ exposes a built-in
// `navigator` global, so this was executing server-side during SSR/SSG for
// every unconditional caller (`ScrollCue`, `ProjectTicker`, `CustomCursor`
// all read `isReducedMotion()` directly in their render body, no effect or
// width>0 wrapper). A build/serverless-function environment's own CPU count
// has nothing to do with any real visitor's device, and worse, a server
// result that disagreed with the client's own post-hydration read would
// hydration-mismatch exactly the class of bug this codebase's `width > 0`
// guards elsewhere (`device-tier.ts`'s own comment) exist to prevent.
// Surfaced by ADR-0086's console logging showing a "resolved=ultra" tier
// read during `next build`'s static generation, where no real device
// exists to resolve a tier for at all. See ADR-0087.
export const isReducedMotion = (): boolean =>
  typeof window !== "undefined" &&
  (window.matchMedia("(prefers-reduced-motion: reduce)").matches || isLowPowerDevice());

/** Disposes geometries/materials/textures on every mesh-like object in a scene. */
export const disposeSceneObjects = (scene: THREE.Scene): void => {
  scene.traverse((object) => {
    const disposable = object as unknown as {
      geometry?: THREE.BufferGeometry;
      material?: THREE.Material | THREE.Material[];
    };
    disposable.geometry?.dispose();
    if (Array.isArray(disposable.material)) {
      disposable.material.forEach((m) => m.dispose());
    } else {
      disposable.material?.dispose();
    }
  });
};
