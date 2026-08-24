/**
 * @fileoverview Shared scroll-signal store.
 *
 * Publishes whole-page scroll `progress` (0..1), `velocity`, and `direction`
 * — bridged once from Lenis's own `scroll` event by `ScrollSignal`
 * (`src/components/common/ScrollSignal.tsx`), which is mounted once in
 * `layout.tsx`. Nothing else in this codebase reads Lenis's own scroll event
 * today — every existing scroll-driven component re-derives progress from
 * `getBoundingClientRect()` per element instead — so this is new plumbing for
 * whole-page effects (the progress bar, the ambient background's
 * scroll-stretch, the hero's scroll parallax) that need a single global
 * signal rather than N per-element recomputations.
 *
 * `useSyncExternalStore`, same idiom as `useWindowSize` / `usePointer`.
 */

"use client";

import { useSyncExternalStore } from "react";

export interface ScrollSignalState {
  /** 0..1 — how far through the whole scrollable page. */
  progress: number;
  /** Signed px/frame, straight from Lenis. */
  velocity: number;
  direction: 1 | -1 | 0;
}

const SERVER_SNAPSHOT: ScrollSignalState = { progress: 0, velocity: 0, direction: 0 };

let snapshot: ScrollSignalState = SERVER_SNAPSHOT;
const listeners = new Set<() => void>();

/** Called by `ScrollSignal` on every Lenis `scroll` event. */
export const publishScrollSignal = (next: ScrollSignalState): void => {
  snapshot = next;
  listeners.forEach((listener) => listener());
};

const subscribe = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const useScrollSignal = (): ScrollSignalState =>
  useSyncExternalStore(subscribe, () => snapshot, () => SERVER_SNAPSHOT);

/** Non-reactive read for per-frame consumers (ticker callbacks, WebGL loops). */
export const getScrollSignalSnapshot = (): ScrollSignalState => snapshot;
