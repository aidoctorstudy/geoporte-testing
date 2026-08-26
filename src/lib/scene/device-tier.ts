/**
 * Device tiering — one module owning what "mobile"/"tablet"/"desktop" means
 * for the WebGL work this project carries, and the per-tier budgets (DPR
 * clamp, shape/particle counts, whether the ambient background runs at all).
 * Every new 3D module reads its numbers from here instead of hardcoding them
 * inline. See obsidian/workflows/optimize-3d-scene.md — "device tiering, not
 * in the starter, add when a project needs it."
 *
 * Breakpoints match the ones already in use elsewhere (`SceneViewport`'s
 * default `mobileBreakpoint`, `springsConfig.mobileWidth` = 768).
 */

export type DeviceTier = "mobile" | "tablet" | "desktop";

const MOBILE_MAX_WIDTH = 768;
const TABLET_MAX_WIDTH = 1024;

export interface TierBudget {
  /** Clamp applied to `window.devicePixelRatio` for any renderer on this tier. */
  dprClamp: number;
  /** Whether the persistent ambient background scene mounts at all. */
  ambientBackgroundEnabled: boolean;
  /** How many drifting wireframe shapes the ambient background builds. */
  ambientShapeCount: number;
  /** Whether the custom cursor spawns a particle trail while moving fast. */
  particleTrailEnabled: boolean;
  /** Minimum gap (ms) `HeroScene.tsx` enforces between rendered WebGL
   * frames — `0` means every rAF tick. These scenes are fill-bound, not
   * motion-bound (slow ambient drift), so a capped tablet frame rate is hard
   * to see and a real battery/GPU saving. Comparison in the render loop is
   * strict `<`, so the budget here matches the frame rate it actually
   * produces (unlike a `<=` check, which measures a few fps under the
   * nominal number — see obsidian/workflows/optimize-3d-scene.md §5). */
  heroFrameIntervalMs: number;
}

const TIER_BUDGETS: Record<DeviceTier, TierBudget> = {
  mobile: {
    dprClamp: 1,
    ambientBackgroundEnabled: false,
    ambientShapeCount: 0,
    particleTrailEnabled: false,
    heroFrameIntervalMs: 1000 / 30,
  },
  tablet: {
    dprClamp: 1.5,
    ambientBackgroundEnabled: true,
    ambientShapeCount: 8,
    particleTrailEnabled: false,
    heroFrameIntervalMs: 1000 / 45,
  },
  desktop: {
    dprClamp: 2,
    ambientBackgroundEnabled: true,
    ambientShapeCount: 18,
    particleTrailEnabled: true,
    heroFrameIntervalMs: 0,
  },
};

export const getDeviceTier = (viewportWidth: number): DeviceTier => {
  if (viewportWidth > 0 && viewportWidth < MOBILE_MAX_WIDTH) return "mobile";
  if (viewportWidth > 0 && viewportWidth < TABLET_MAX_WIDTH) return "tablet";
  return "desktop";
};

export const getTierBudget = (viewportWidth: number): TierBudget =>
  TIER_BUDGETS[getDeviceTier(viewportWidth)];
