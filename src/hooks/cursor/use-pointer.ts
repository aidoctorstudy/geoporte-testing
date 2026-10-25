/**
 * @fileoverview Shared pointer-position store.
 *
 * One `window.pointermove` listener for the whole app (bound on the first
 * subscriber, torn down on the last) instead of one per consumer — the custom
 * cursor, the ambient background scene's cursor-tilt, magnetic buttons, and
 * the hero's camera-orbit all need live pointer position. Follows the same
 * shared-listener + `useSyncExternalStore` idiom as `useWindowSize`
 * (`src/hooks/use-window-size.ts`).
 *
 * `isFinePointer` gates every cursor-driven effect off on touch devices,
 * where the native cursor and default focus rings must stay intact — but a
 * live touch still updates `x`/`y`/`isTouchActive` below, so a consumer that
 * wants a touch equivalent (a floating cursor following the finger while
 * it's down, a magnetic button nudging toward it) can gate on
 * `isFinePointer || isTouchActive` instead.
 */

"use client";

import { useSyncExternalStore } from "react";

const FINE_POINTER_QUERY = "(hover: hover) and (pointer: fine)";
/** How long after the last pointermove/touchmove before `isMoving`/`velocity`
 * reset. */
const IDLE_TIMEOUT_MS = 120;

export interface PointerState {
  x: number;
  y: number;
  /** Approximate px moved per ~16ms tick — used for velocity-gated effects
   * (the particle trail's "only while moving fast" threshold). */
  velocity: number;
  isMoving: boolean;
  isFinePointer: boolean;
  /** True from `touchstart` until that touch's `touchend`/`touchcancel` —
   * the touch equivalent of "the pointer is currently engaged," since touch
   * has no persistent hover position the way a mouse does. Consumers that
   * want touch to drive a mouse-shaped effect (the custom cursor, magnetic
   * buttons) gate on `isFinePointer || isTouchActive` rather than
   * `isFinePointer` alone. */
  isTouchActive: boolean;
  /** False until the first real `pointermove`/`touchstart` — `x`/`y` are
   * meaningless before then (still the `0,0` default), so cursor-position
   * consumers (`CustomCursor`, the ambient background's tilt) must stay
   * hidden/inert until this flips true, rather than rendering at a stale
   * top-left `0,0`. */
  hasMoved: boolean;
}

const SERVER_SNAPSHOT: PointerState = {
  x: 0,
  y: 0,
  velocity: 0,
  isMoving: false,
  isFinePointer: false,
  isTouchActive: false,
  hasMoved: false,
};

const readFinePointer = (): boolean =>
  typeof window !== "undefined" && window.matchMedia(FINE_POINTER_QUERY).matches;

let snapshot: PointerState = {
  ...SERVER_SNAPSHOT,
  isFinePointer: readFinePointer(),
};

const listeners = new Set<() => void>();
let bound = false;
let lastX = 0;
let lastY = 0;
let lastTime = 0;
let idleTimeoutId: ReturnType<typeof setTimeout> | undefined;
let finePointerQuery: MediaQueryList | null = null;

const publish = (next: PointerState): void => {
  snapshot = next;
  listeners.forEach((listener) => listener());
};

const handlePointerMove = (event: PointerEvent): void => {
  // Browsers dispatch a synthesized `pointermove` (`pointerType: "touch"`)
  // alongside the real `touchmove` for the same finger gesture — without
  // this guard, that synthesized event would race the explicit touch
  // handlers below and immediately stomp `isTouchActive` back to `false`
  // (this branch has no other way to know a touch is involved), making the
  // touch-driven effects flicker on/off within the same gesture. Pen input
  // (`pointerType: "pen"`) still flows through here as a fine pointer.
  if (event.pointerType === "touch") return;

  const now = performance.now();
  const dt = Math.max(now - lastTime, 1);
  const dx = event.clientX - lastX;
  const dy = event.clientY - lastY;
  const velocity = (Math.hypot(dx, dy) / dt) * 16;
  lastX = event.clientX;
  lastY = event.clientY;
  lastTime = now;

  if (idleTimeoutId) clearTimeout(idleTimeoutId);
  idleTimeoutId = setTimeout(() => {
    publish({ ...snapshot, velocity: 0, isMoving: false });
  }, IDLE_TIMEOUT_MS);

  publish({
    x: event.clientX,
    y: event.clientY,
    velocity,
    isMoving: true,
    isFinePointer: snapshot.isFinePointer,
    // Real mouse movement implies this isn't a touch gesture.
    isTouchActive: false,
    hasMoved: true,
  });
};

const handleFinePointerChange = (): void => {
  publish({ ...snapshot, isFinePointer: readFinePointer() });
};

/** `touchstart`/`touchmove` share this — both land the touch's current
 * position into the store exactly like a `pointermove`, tracking velocity
 * off the same `lastX`/`lastY`/`lastTime` the mouse path uses. Explicit
 * `Touch*` listeners (rather than relying on the browser's own touch→
 * pointer-event synthesis) because iOS Safari can hand a touch-driven drag
 * off to native scrolling mid-gesture, which stops further synthesized
 * `pointermove` dispatch for that touch — `touchmove` keeps firing
 * regardless, since the listeners here are `passive` and never call
 * `preventDefault` (scrolling must keep working). */
const publishTouchPosition = (touch: Touch, isMoving: boolean): void => {
  const now = performance.now();
  const dt = Math.max(now - lastTime, 1);
  const dx = touch.clientX - lastX;
  const dy = touch.clientY - lastY;
  const velocity = isMoving ? (Math.hypot(dx, dy) / dt) * 16 : 0;
  lastX = touch.clientX;
  lastY = touch.clientY;
  lastTime = now;

  if (idleTimeoutId) clearTimeout(idleTimeoutId);
  idleTimeoutId = setTimeout(() => {
    publish({ ...snapshot, velocity: 0, isMoving: false });
  }, IDLE_TIMEOUT_MS);

  publish({
    x: touch.clientX,
    y: touch.clientY,
    velocity,
    isMoving,
    isFinePointer: snapshot.isFinePointer,
    isTouchActive: true,
    hasMoved: true,
  });
};

const handleTouchStart = (event: TouchEvent): void => {
  const touch = event.touches[0];
  if (!touch) return;
  // No prior position to diff against yet — jump straight there, same as
  // `subscribe()` seeding `lastX`/`lastY` below for the mouse path.
  lastX = touch.clientX;
  lastY = touch.clientY;
  lastTime = performance.now();
  publishTouchPosition(touch, false);
};

const handleTouchMove = (event: TouchEvent): void => {
  const touch = event.touches[0];
  if (!touch) return;
  publishTouchPosition(touch, true);
};

const handleTouchEnd = (): void => {
  if (idleTimeoutId) clearTimeout(idleTimeoutId);
  publish({ ...snapshot, velocity: 0, isMoving: false, isTouchActive: false });
};

const subscribe = (listener: () => void): (() => void) => {
  if (!bound) {
    lastX = snapshot.x;
    lastY = snapshot.y;
    lastTime = performance.now();
    finePointerQuery = window.matchMedia(FINE_POINTER_QUERY);
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });
    window.addEventListener("touchcancel", handleTouchEnd, { passive: true });
    finePointerQuery.addEventListener("change", handleFinePointerChange);
    bound = true;
  }
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("touchcancel", handleTouchEnd);
      finePointerQuery?.removeEventListener("change", handleFinePointerChange);
      finePointerQuery = null;
      if (idleTimeoutId) clearTimeout(idleTimeoutId);
      bound = false;
    }
  };
};

export const usePointer = (): PointerState =>
  useSyncExternalStore(subscribe, () => snapshot, () => SERVER_SNAPSHOT);

/**
 * Non-reactive read of the current pointer state — for per-frame consumers
 * (ticker callbacks, WebGL render loops) that poll every tick and must not
 * re-subscribe/re-render on every pointer move.
 */
export const getPointerSnapshot = (): PointerState => snapshot;
