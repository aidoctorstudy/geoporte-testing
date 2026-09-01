/**
 * Feeds `PerformanceWarningToast` — whether this device looks under-powered
 * for the site's 3D work, from two independent signals: the static 4-tier
 * capability read (`performance-tier.ts`, checked once, no listener needed)
 * and measured frame rate (sampled from `HeroScene.tsx`'s own render loop,
 * the busiest single scene on any page — see its own comments on why WebGL
 * frame timing can't come from the shared spring ticker).
 */

import { getOrDetectTier, isReducedPerformanceTier } from "./performance-tier";

const SAMPLE_WINDOW_MS = 3000;
/** Per ADR-0058's tier system: "if FPS drops below 20 for 3 consecutive
 * seconds, automatically downgrade one tier." `SAMPLE_WINDOW_MS` above
 * already *is* that 3-second window — was 3000ms/30fps before ADR-0058,
 * tuned here to match the new spec exactly rather than coincidentally. */
const LOW_FPS_THRESHOLD = 20;
/** Scenes are still assembling (fly-ins, unrolls, etc.) right after mount —
 * ignore frame timing until that settles, so a slow *load* doesn't read as a
 * slow *device*. */
const WARMUP_GRACE_MS = 2000;
/** After firing, don't re-arm for a bit — otherwise the same still-slow
 * frame stream re-triggers on literally the next sampled frame once the
 * window is cleared, downgrading several tiers in a fraction of a second
 * instead of "one tier per sustained slow period." */
const RE_ARM_COOLDOWN_MS = 5000;

let frameTimestamps: number[] = [];
let windowStart: number | null = null;
let lastFiredAt: number | null = null;

type Listener = () => void;
const listeners = new Set<Listener>();

/** Call once per rendered frame from a hero scene's own rAF loop, passing
 * the same timestamp `requestAnimationFrame` handed it. Per ADR-0058, this
 * can fire more than once per page lifetime (each firing both re-shows
 * `PerformanceWarningToast` and downgrades the tier one more step) —
 * floored naturally once the tier reaches "low", since WebGL stops
 * mounting there and this stops being called at all.
 *
 * No-op outside production. Turbopack's dev-mode recompilation/HMR
 * routinely stalls the main thread well past this module's 20fps/3s
 * threshold for reasons that have nothing to do with the device's real
 * capability — and because a downgrade PERSISTS to localStorage
 * (`persistTier`), one such stall permanently disables every WebGL scene
 * on every subsequent reload until someone manually clears storage,
 * which reads exactly like "the 3D got removed" rather than "the dev
 * server hitched once." See obsidian/meta/decisions-log.md ADR-0058 and
 * the follow-up ADR added alongside this guard. */
export const reportHeroSceneFrame = (nowMs: number): void => {
  if (process.env.NODE_ENV !== "production") return;
  if (lastFiredAt !== null && nowMs - lastFiredAt < RE_ARM_COOLDOWN_MS) return;
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
    lastFiredAt = nowMs;
    frameTimestamps = [];
    windowStart = null;
    listeners.forEach((listener) => listener());
  }
};

/** Per ADR-0058's toast spec: shown whenever the resolved tier is "medium"
 * or "low" — delegates to the same 4-tier detection every scene budget
 * reads, rather than re-deriving a narrower hardwareConcurrency/deviceMemory
 * check here. */
export const hasStaticLowPerformanceSignal = (): boolean =>
  isReducedPerformanceTier(getOrDetectTier());

/** Fires each time the rolling average drops below threshold (throttled by
 * `RE_ARM_COOLDOWN_MS` above so a sustained slow stretch downgrades one
 * tier at a time, not several at once) — per ADR-0058, no longer a
 * once-per-page-lifetime lock, since a live downgrade needs to be able to
 * re-show the toast. */
export const subscribeToLowFpsWarning = (listener: Listener): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
