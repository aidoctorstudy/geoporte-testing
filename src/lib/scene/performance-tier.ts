/**
 * Sitewide 4-tier performance/capability system — Ultra/High/Medium/Low —
 * superseding the simpler `hardwareConcurrency <= 4` check ADR-0056 added
 * to `device-tier.ts` one turn ago. See ADR-0058.
 *
 * `device-tier.ts`'s own "mobile"/"tablet"/"desktop" tiers are unchanged
 * (viewport-width-driven, used for grid/ambient-shape-count concerns
 * unrelated to raw device capability) — its `isLowPowerDevice()` now
 * delegates to this module's `detectPerformanceTier() === "low"` instead
 * of its own narrower hardwareConcurrency-only check, so every existing
 * consumer (`HeroScene`, `AmbientBackground`, `PlanetBackground`,
 * `SceneViewport`, every scene's own DPR clamp) picks up the fuller
 * detection — mobile UA, `deviceMemory`, screen width, session-persisted
 * downgrades — with zero additional wiring, the same "one module decides"
 * principle ADR-0056 already established.
 */

export type PerformanceTier = "ultra" | "high" | "medium" | "low";

export interface TierParticleBudget {
  /** Multiplier a scene builder *could* apply to its own baseline
   * particle/point count. Not yet wired into the 9 verbatim-ported scene
   * builders — see ADR-0058's "not done" section for why. */
  particleScale: number;
  /** Multiplier a scene builder *could* apply to its own baseline bloom
   * strength/radius. Same caveat as `particleScale`. */
  bloomScale: number;
  /** Clamp applied to `window.devicePixelRatio` — this one IS wired,
   * through `device-tier.ts`'s existing `TierBudget.dprClamp`. */
  dprClamp: number;
  /** WebGL never mounts at all on this tier — every scene (`HeroScene`,
   * `PlanetBackground`, `AmbientBackground`, `SceneViewport`) gates its own
   * mount on `isLowPowerDevice()` reporting true, i.e. this tier being
   * "low". Capable mobile devices resolve to "medium"/"high" instead (see
   * `detectPerformanceTier`, ADR-0078) and mount WebGL like any other tier. */
  webglDisabled: boolean;
}

export const PERFORMANCE_TIER_BUDGETS: Record<PerformanceTier, TierParticleBudget> = {
  ultra: { particleScale: 1, bloomScale: 1, dprClamp: 2, webglDisabled: false },
  high: { particleScale: 0.7, bloomScale: 0.5, dprClamp: 2, webglDisabled: false },
  medium: { particleScale: 0.3, bloomScale: 0, dprClamp: 1, webglDisabled: false },
  low: { particleScale: 0, bloomScale: 0, dprClamp: 1, webglDisabled: true },
};

const STORAGE_KEY = "geoporte:performance-tier";
const TIER_ORDER: PerformanceTier[] = ["low", "medium", "high", "ultra"];

interface NavigatorWithMemory extends Navigator {
  /** Non-standard (Chromium-only) — absent everywhere else, hence optional,
   * same pattern `performance-monitor.ts` already uses. */
  deviceMemory?: number;
}

const isMobileUserAgent = (): boolean =>
  typeof navigator !== "undefined" && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);

const isIPhoneDevice = (): boolean =>
  typeof navigator !== "undefined" && /iPhone/i.test(navigator.userAgent);

const isIPadDevice = (): boolean =>
  typeof navigator !== "undefined" && /iPad/i.test(navigator.userAgent);

/**
 * Safari never puts the device model in `navigator.userAgent` (every iPhone
 * reports the same generic `"Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac
 * OS X)…"` string, model-free), never implements `navigator.deviceMemory`
 * (Chromium-only), and has reported a flat `hardwareConcurrency: 6` on every
 * iPhone since the A13 (iPhone 11, 2019) — so none of the usual capability
 * signals can tell a 15 Pro Max from a 12 mini, and `deviceMemory` defaulting
 * to 4 (see `readSignals`) means NO iPhone can ever clear a `memory >= 6`
 * gate. The only proxy left is the device's logical screen size ×
 * `devicePixelRatio`, which Apple ties to a specific screen panel/chip
 * generation.
 *
 * `[shortSide, longSide, dpr]` in CSS px, normalized (sorted) so portrait vs
 * landscape both match — `screen.width`/`height`'s order isn't reliably
 * orientation-stable across mobile Safari versions.
 *
 * Two buckets, not one: Apple gives the same panel to a Pro and a non-Pro
 * model in the same generation (14 Pro/15/15 Pro/16 all share 393×852×3), so
 * screen signature alone cannot isolate "Pro" within that bucket — it is
 * demoted to HIGH rather than ULTRA for that reason (see the 2026-10-11 ADR
 * in decisions-log.md, which also covers why the Plus/Pro-Max bucket below
 * still reads ULTRA despite the identical ambiguity against the non-Pro
 * "Plus"). Reserve ULTRA for the larger Plus/Pro-Max panel class, which is
 * also where a new flagship generation is most likely to land if Apple keeps
 * the panel size stable across a generation (unverified for any iPhone this
 * table doesn't explicitly list — see the MAINTENANCE note).
 *
 * MAINTENANCE: update this table when a new iPhone generation ships. An
 * unrecognized (future) iPhone falls through to the normal cores/memory
 * tiering below — safe by construction, never silently mis-promoted; worst
 * case a new flagship reads as "medium" until this table is updated, not
 * "low"/broken.
 */
const IOS_HIGH_TIER_SCREEN_SIGNATURES: ReadonlyArray<readonly [number, number, number]> = [
  [393, 852, 3], // iPhone 14 Pro, 15, 15 Pro, 16
  [402, 874, 3], // iPhone 16 Pro
];
const IOS_ULTRA_TIER_SCREEN_SIGNATURES: ReadonlyArray<readonly [number, number, number]> = [
  [430, 932, 3], // iPhone 14 Pro Max, 15 Plus, 15 Pro Max, 16 Plus
  [440, 956, 3], // iPhone 16 Pro Max — also assumed to cover 17 Pro Max if the
  // panel didn't change generation-over-generation; NOT independently
  // verified against a real 17 Pro Max. Correct this entry (or add a new one)
  // once that can be confirmed.
];

const matchesIPhoneScreenSignature = (
  table: ReadonlyArray<readonly [number, number, number]>,
): boolean => {
  if (!isIPhoneDevice()) return false;
  if (typeof screen === "undefined" || typeof window === "undefined") return false;
  const [shortSide, longSide] = [screen.width, screen.height].sort((a, b) => a - b);
  const dpr = window.devicePixelRatio;
  return table.some(([s, l, d]) => s === shortSide && l === longSide && d === dpr);
};

/**
 * iPad, unlike iPhone, reports its chip's real core count on Safari (M-series
 * iPads: 8+) — `deviceMemory` is still never exposed, so cores alone is the
 * only usable signal there. `cores >= 8` is the M-series cutoff (the user's
 * named "iPad Pro M1" example is exactly this); an A-series iPad (fewer
 * cores) falls through to the normal numeric tiering below like any other
 * unrecognized device.
 */
const isUltraTierIPad = (cores: number | null): boolean =>
  isIPadDevice() && cores !== null && cores >= 8;

const isHighTierIOSDevice = (): boolean => matchesIPhoneScreenSignature(IOS_HIGH_TIER_SCREEN_SIGNATURES);

const isUltraTierIOSDevice = (cores: number | null): boolean =>
  matchesIPhoneScreenSignature(IOS_ULTRA_TIER_SCREEN_SIGNATURES) || isUltraTierIPad(cores);

const readSignals = () => {
  const nav = typeof navigator !== "undefined" ? (navigator as NavigatorWithMemory) : null;
  const cores = nav && typeof nav.hardwareConcurrency === "number" ? nav.hardwareConcurrency : null;
  const memory = nav && typeof nav.deviceMemory === "number" ? nav.deviceMemory : null;
  const width = typeof screen !== "undefined" ? screen.width : null;
  return { cores, memory, width, isMobile: isMobileUserAgent() };
};

/**
 * Pure detection, run once per session (see `getOrDetectTier`). Unknown
 * hardware hints (`cores`/`memory` both null — an older or privacy-hardened
 * browser) default to 4/4, the medium/low boundary — a conservative middle
 * ground rather than assuming either extreme.
 *
 * Mobile thresholds (2026-10-11 spec, see decisions-log.md): LOW is
 * `cores <= 4 OR memory <= 3 OR screen.width <= 390`; MEDIUM is the
 * `cores >= 5 AND memory >= 4` band above that; HIGH is `cores >= 8 AND
 * memory >= 6`; ULTRA is `cores >= 12`. That last number is real for Android
 * (Chromium reports true `hardwareConcurrency`/`deviceMemory`) but
 * unreachable for *any* iPhone or iPad — Safari's signals can't clear it (see
 * the iOS comment above) — so ULTRA there is reached through the screen-
 * signature/iPad-cores proxy instead (`isUltraTierIOSDevice`), and the same
 * proxy's HIGH bucket (`isHighTierIOSDevice`) covers Pro-class iPhones that
 * the numeric check alone would misclassify as MEDIUM. Width is not part of
 * the HIGH/ULTRA path by design — only LOW's `<= 390` cutoff reads it
 * directly (real iPhone "standard"/Pro widths are 393+, so that cutoff
 * doesn't catch them; see decisions-log.md for why this isn't the ADR-0078
 * regression it looks like at first glance).
 *
 * A phone's GPU/thermal envelope is generally weaker than a desktop's at the
 * same core count, so desktop's own thresholds below are intentionally more
 * permissive and unrelated to the mobile ones above.
 */
export const detectPerformanceTier = (): PerformanceTier => {
  const { cores, memory, width, isMobile } = readSignals();
  const c = cores ?? 4;
  const m = memory ?? 4;

  if (isMobile) {
    if (isUltraTierIOSDevice(cores) || c >= 12) return "ultra";
    if (c <= 4 || m <= 3 || (width !== null && width <= 390)) return "low";
    if (isHighTierIOSDevice()) return "high";
    if (c >= 8 && m >= 6) return "high";
    return "medium";
  }

  if (c >= 16 || (c >= 8 && m >= 16)) return "ultra";
  if (c >= 8 && m >= 8) return "high";
  if (c < 4 || m < 4) return "low";
  return "medium";
};

const isValidTier = (value: string | null): value is PerformanceTier =>
  value === "ultra" || value === "high" || value === "medium" || value === "low";

export const getStoredTier = (): PerformanceTier | null => {
  if (typeof window === "undefined") return null;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return isValidTier(stored) ? stored : null;
  } catch {
    return null;
  }
};

const persistTier = (tier: PerformanceTier): void => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, tier);
  } catch {
    // Storage unavailable (private browsing, quota) — the tier still works
    // for this session via React state, it just doesn't survive a reload.
  }
};

/** Session-stable read: a previously downgraded tier (this session or a
 * past one, via localStorage) always wins over a fresh detection — a
 * device that got downgraded for being too slow doesn't silently
 * un-downgrade itself on the next reload. First call on a fresh browser
 * profile detects and persists. */
export const getOrDetectTier = (): PerformanceTier => {
  const stored = getStoredTier();
  if (stored) return stored;
  const detected = detectPerformanceTier();
  persistTier(detected);
  return detected;
};

/** One step down, floored at "low". Persists immediately so it survives a
 * reload, same as the initial detection. */
export const downgradeTier = (current: PerformanceTier): PerformanceTier => {
  const index = TIER_ORDER.indexOf(current);
  const next = TIER_ORDER[Math.max(0, index - 1)];
  persistTier(next);
  return next;
};

/** Per the toast spec: shown when the resolved tier is "medium" or "low". */
export const isReducedPerformanceTier = (tier: PerformanceTier): boolean =>
  tier === "medium" || tier === "low";
