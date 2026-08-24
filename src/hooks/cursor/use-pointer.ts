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
 * where the native cursor and default focus rings must stay intact.
 */

"use client";

import { useSyncExternalStore } from "react";

const FINE_POINTER_QUERY = "(hover: hover) and (pointer: fine)";
/** How long after the last pointermove before `isMoving`/`velocity` reset. */
const IDLE_TIMEOUT_MS = 120;

export interface PointerState {
  x: number;
  y: number;
  /** Approximate px moved per ~16ms tick — used for velocity-gated effects
   * (the particle trail's "only while moving fast" threshold). */
  velocity: number;
  isMoving: boolean;
  isFinePointer: boolean;
  /** False until the first real `pointermove` — `x`/`y` are meaningless
   * before then (still the `0,0` default), so cursor-position consumers
   * (`CustomCursor`, the ambient background's tilt) must stay hidden/inert
   * until this flips true, rather than rendering at a stale top-left `0,0`. */
  hasMoved: boolean;
}

const SERVER_SNAPSHOT: PointerState = {
  x: 0,
  y: 0,
  velocity: 0,
  isMoving: false,
  isFinePointer: false,
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
    hasMoved: true,
  });
};

const handleFinePointerChange = (): void => {
  publish({ ...snapshot, isFinePointer: readFinePointer() });
};

const subscribe = (listener: () => void): (() => void) => {
  if (!bound) {
    lastX = snapshot.x;
    lastY = snapshot.y;
    lastTime = performance.now();
    finePointerQuery = window.matchMedia(FINE_POINTER_QUERY);
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    finePointerQuery.addEventListener("change", handleFinePointerChange);
    bound = true;
  }
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      window.removeEventListener("pointermove", handlePointerMove);
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
