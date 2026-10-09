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
  high: { particleScale: 0.8, bloomScale: 1, dprClamp: 2, webglDisabled: false },
  medium: { particleScale: 0.4, bloomScale: 0.5, dprClamp: 1, webglDisabled: false },
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

const isIOSDevice = (): boolean =>
  typeof navigator !== "undefined" && /iPhone/i.test(navigator.userAgent);

/**
 * Safari never puts the device model in `navigator.userAgent` (every iPhone
 * reports the same generic `"Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac
 * OS X)…"` string, model-free), never implements `navigator.deviceMemory`
 * (Chromium-only), and has reported a flat `hardwareConcurrency: 6` on every
 * iPhone since the A13 (iPhone 11, 2019) — so none of the usual capability
 * signals can tell a 15 Pro Max from a 12 mini. The only proxy left is the
 * device's logical screen size × `devicePixelRatio`, which Apple ties to a
 * specific screen panel/chip generation.
 *
 * `[shortSide, longSide, dpr]` in CSS px, normalized (sorted) so portrait vs
 * landscape both match — `screen.width`/`height`'s order isn't reliably
 * orientation-stable across mobile Safari versions.
 *
 * MAINTENANCE: update this table when a new iPhone generation ships. An
 * unrecognized (future) iPhone falls through to the normal cores/memory
 * tiering below — safe by construction, never silently mis-promoted to
 * "ultra"; worst case a new flagship reads as "medium" until this table is
 * updated, not "low"/broken.
 */
const IOS_FLAGSHIP_SCREEN_SIGNATURES: ReadonlyArray<readonly [number, number, number]> = [
  [393, 852, 3], // iPhone 14 Pro, 15, 15 Pro, 16
  [430, 932, 3], // iPhone 14 Pro Max, 15 Plus, 15 Pro Max, 16 Plus
  [402, 874, 3], // iPhone 16 Pro
  [440, 956, 3], // iPhone 16 Pro Max
];

const isFlagshipIOSDevice = (): boolean => {
  if (!isIOSDevice()) return false;
  if (typeof screen === "undefined" || typeof window === "undefined") return false;
  const [shortSide, longSide] = [screen.width, screen.height].sort((a, b) => a - b);
  const dpr = window.devicePixelRatio;
  return IOS_FLAGSHIP_SCREEN_SIGNATURES.some(
    ([s, l, d]) => s === shortSide && l === longSide && d === dpr,
  );
};

/** Android (and other Chromium-mobile) flagships report real
 * `hardwareConcurrency`/`deviceMemory` — no proxy needed, unlike iOS above. */
const isFlagshipAndroidDevice = (cores: number | null, memory: number | null): boolean =>
  cores !== null && cores >= 8 && memory !== null && memory >= 8;

const isFlagshipMobileDevice = (cores: number | null, memory: number | null): boolean =>
  isFlagshipIOSDevice() || isFlagshipAndroidDevice(cores, memory);

const readSignals = () => {
  const nav = typeof navigator !== "undefined" ? (navigator as NavigatorWithMemory) : null;
  const cores = nav && typeof nav.hardwareConcurrency === "number" ? nav.hardwareConcurrency : null;
  const memory = nav && typeof nav.deviceMemory === "number" ? nav.deviceMemory : null;
  return { cores, memory, isMobile: isMobileUserAgent() };
};

/**
 * Pure detection, run once per session (see `getOrDetectTier`). Unknown
 * hardware hints (`cores`/`memory` both null — an older or privacy-hardened
 * browser) default to 4/4, the medium/low boundary — a conservative middle
 * ground rather than assuming either extreme.
 *
 * Mobile devices are judged on actual `cores`/`memory` signals, the same as
 * desktop — not auto-floored to "low" purely for being under the mobile
 * width/UA check (ADR-0078 removed that forcing rule: it was catching every
 * phone, including high-end ones like iPhone 14+/15 Pro, since Safari never
 * exposes `deviceMemory` and `width < 768` is true for essentially all
 * phones in portrait). A phone's GPU/thermal envelope is generally weaker
 * than a desktop's at the same core count, so the ordinary mobile ceiling is
 * capped at "high" — except a *flagship* device (see
 * `isFlagshipMobileDevice`: recent Pro-tier iPhones by screen signature,
 * Android by real 8-core/8GB signals), which reaches "ultra" — the same
 * uncapped budget desktop gets, no simplification (ADR-0079).
 */
export const detectPerformanceTier = (): PerformanceTier => {
  const { cores, memory, isMobile } = readSignals();
  const c = cores ?? 4;
  const m = memory ?? 4;

  if (isMobile) {
    if (isFlagshipMobileDevice(cores, memory)) return "ultra";
    if (c < 6 || m < 4) return "low";
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
