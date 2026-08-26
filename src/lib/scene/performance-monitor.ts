/**
 * Feeds `PerformanceWarningToast` — whether this device looks under-powered
 * for the site's 3D work, from two independent signals: static hardware
 * hints (checked once, no listener needed) and measured frame rate (sampled
 * from `HeroScene.tsx`'s own render loop, the busiest single scene on any
 * page — see its own comments on why WebGL frame timing can't come from the
 * shared spring ticker).
 */

const SAMPLE_WINDOW_MS = 3000;
const LOW_FPS_THRESHOLD = 30;
/** Scenes are still assembling (fly-ins, unrolls, etc.) right after mount —
 * ignore frame timing until that settles, so a slow *load* doesn't read as a
 * slow *device*. */
const WARMUP_GRACE_MS = 2000;

interface NavigatorWithDeviceMemory extends Navigator {
  /** Non-standard (Chromium-only) — absent everywhere else, hence optional. */
  deviceMemory?: number;
}

let frameTimestamps: number[] = [];
let windowStart: number | null = null;
let hasWarned = false;

type Listener = () => void;
const listeners = new Set<Listener>();

/** Call once per rendered frame from a hero scene's own rAF loop, passing
 * the same timestamp `requestAnimationFrame` handed it. */
export const reportHeroSceneFrame = (nowMs: number): void => {
  if (hasWarned) return;
  if (windowStart === null) windowStart = nowMs;
  if (nowMs - windowStart < WARMUP_GRACE_MS) return;

  frameTimestamps.push(nowMs);
  const cutoff = nowMs - SAMPLE_WINDOW_MS;
  while (frameTimestamps.length > 0 && frameTimestamps[0] < cutoff) {
    frameTimestamps.shift();
  }
  if (frameTimestamps.length < 2) return;

  const spanSeconds = (frameTimestamps[frameTimestamps.length - 1] - frameTimestamps[0]) / 1000;
  if (spanSeconds < SAMPLE_WINDOW_MS / 1000 - 0.1) return; // wait for a full window

  const fps = frameTimestamps.length / spanSeconds;
  if (fps < LOW_FPS_THRESHOLD) {
    hasWarned = true;
    listeners.forEach((listener) => listener());
  }
};

/** Core count / RAM hints — cheap, synchronous, no sampling needed. Either
 * signal alone is treated as "this device is probably underpowered," per
 * the same reasoning `device-tier.ts` uses coarse-pointer as a tablet proxy:
 * a rough signal is enough to be worth acting on. */
export const hasStaticLowPerformanceSignal = (): boolean => {
  if (typeof navigator === "undefined") return false;
  const nav = navigator as NavigatorWithDeviceMemory;
  const lowCores = typeof nav.hardwareConcurrency === "number" && nav.hardwareConcurrency <= 4;
  const lowMemory = typeof nav.deviceMemory === "number" && nav.deviceMemory <= 4;
  return lowCores || lowMemory;
};

/** Fires once, the first time the rolling average drops below threshold —
 * never again after that for the page's lifetime (no point re-warning once
 * the toast has already told the user). */
export const subscribeToLowFpsWarning = (listener: Listener): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
