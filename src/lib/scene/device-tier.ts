/**
 * Device tiering — one module owning what "mobile"/"tablet"/"desktop" means
 * for the WebGL work this project carries, and the per-tier *budgets* (DPR
 * clamp, shape/particle counts, hero frame-rate cap). Every new 3D module
 * reads its numbers from here instead of hardcoding them inline. See
 * obsidian/workflows/optimize-3d-scene.md — "device tiering, not in the
 * starter, add when a project needs it."
 *
 * Breakpoints match the ones already in use elsewhere
 * (`springsConfig.mobileWidth` = 768).
 *
 * IMPORTANT — `getDeviceTier`'s "mobile" result is a *budget* tier only (DPR,
 * particle counts, frame rate), driven primarily by viewport width (with one
 * capability override in each direction — see `getDeviceTier`'s own comment
 * below). It is NOT a "should WebGL mount" signal, and no scene should treat
 * it as one — a capable phone (e.g. iPhone 15 Pro Max) is narrow-width and
 * still mounts full WebGL (see ADR-0078, which reversed ADR-0056/0058/0060's
 * "narrow width = no WebGL" convention); a *flagship* phone additionally
 * gets the full desktop budget outright, not just a reduced-mobile one (see
 * ADR-0079). The actual
 * "skip WebGL, show the CSS/spring fallback" decision belongs to
 * `isLowPowerDevice()` alone — a capability check (hardwareConcurrency,
 * deviceMemory, mobile UA, session-persisted downgrade — see
 * `performance-tier.ts`'s `detectPerformanceTier`) that is independent of
 * screen width: a low-power desktop or a wide-screen tablet with a weak CPU
 * pays the same fill-rate tax as a weak phone, while a narrow-but-capable
 * phone pays none of it. Every scene mount site (`HeroScene`,
 * `PlanetBackground`, `AmbientBackground`, `SceneViewport`) calls
 * `isLowPowerDevice()` directly for that decision, guarded behind the same
 * `viewportWidth > 0` check every caller already uses to detect "not yet
 * measured on the client" (see `isLowPowerDevice`'s own comment) —
 * `navigator`/`localStorage` are available synchronously on the client from
 * the very first render, before hydration completes, so checking them
 * unconditionally would make the tier disagree between the server-rendered
 * HTML and the client's first paint and trip a hydration-mismatch warning.
 * Folding it behind the existing `width > 0` gate means it only ever takes
 * effect on a render that happens strictly after hydration (once
 * `useWindowWidth()` has measured a real value), exactly like every other
 * tier-dependent branch here already does.
 */

import { getOrDetectTier, PERFORMANCE_TIER_BUDGETS } from "./performance-tier";

export type DeviceTier = "mobile" | "tablet" | "desktop";

const MOBILE_MAX_WIDTH = 768;
const TABLET_MAX_WIDTH = 1024;

/** The single "should this device mount WebGL at all" signal — capability
 * only, independent of viewport width. See this file's top comment. */
export const isLowPowerDevice = (): boolean => getOrDetectTier() === "low";

export interface TierBudget {
  /** Clamp applied to `window.devicePixelRatio` for any renderer on this tier. */
  dprClamp: number;
  /** How many drifting wireframe shapes the ambient background builds
   * (whether the scene mounts at all is `isLowPowerDevice()`, not this
   * tier — see this file's top comment). */
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
    dprClamp: 1.5,
    ambientShapeCount: 6,
    particleTrailEnabled: false,
    heroFrameIntervalMs: 1000 / 30,
  },
  tablet: {
    dprClamp: 1.5,
    ambientShapeCount: 8,
    particleTrailEnabled: false,
    heroFrameIntervalMs: 1000 / 45,
  },
  desktop: {
    dprClamp: 2,
    ambientShapeCount: 18,
    particleTrailEnabled: true,
    heroFrameIntervalMs: 0,
  },
};

/**
 * A "low" capability device overrides width toward `"mobile"` (see the top
 * comment); a **flagship** ("ultra" capability — recent Pro-tier iPhones,
 * 8-core/8GB Android, see `performance-tier.ts#isFlagshipMobileDevice`)
 * overrides width the other direction, toward `"desktop"`. This is the one
 * place "no simplification for flagship phones" (ADR-0079) is implemented —
 * every consumer keyed off `getDeviceTier`/`getTierBudget` (DPR clamp,
 * ambient shape count, hero frame cap, the globe's star/atmo/marker counts,
 * every builder's own `getDeviceTier(...) === "desktop"` density check)
 * automatically gets the full desktop budget for a flagship phone with zero
 * additional wiring — the same "one module decides" principle this file
 * already follows for the "low" case.
 */
export const getDeviceTier = (viewportWidth: number): DeviceTier => {
  if (viewportWidth <= 0) return "desktop";
  if (getOrDetectTier() === "ultra") return "desktop";
  if (viewportWidth < MOBILE_MAX_WIDTH || isLowPowerDevice()) return "mobile";
  if (viewportWidth < TABLET_MAX_WIDTH) return "tablet";
  return "desktop";
};

/**
 * `dprClamp` also factors in the 4-tier capability system (`performance-
 * tier.ts`) — takes the smaller of the two clamps, so a desktop-*width*
 * device that's only Medium *capability* (per ADR-0058's dpr=1 for that
 * tier) doesn't get the desktop width-tier's full dpr=2 just because its
 * screen is wide. A narrow/low-power device is unaffected (already at 1). A
 * flagship phone is unaffected too, just at the opposite end: `getDeviceTier`
 * already resolved it to `"desktop"` above, so `widthBudget` is desktop's
 * `dprClamp: 2` and `capabilityDprClamp` is "ultra"'s `2` — the min of the
 * two is still `2`, not a narrower mobile-width number.
 */
export const getTierBudget = (viewportWidth: number): TierBudget => {
  const widthBudget = TIER_BUDGETS[getDeviceTier(viewportWidth)];
  if (viewportWidth <= 0) return widthBudget;
  const capabilityDprClamp = PERFORMANCE_TIER_BUDGETS[getOrDetectTier()].dprClamp;
  return { ...widthBudget, dprClamp: Math.min(widthBudget.dprClamp, capabilityDprClamp) };
};
