/**
 * Sitewide 4-tier performance/capability system — Ultra/High/Medium/Low —
 * superseding the simpler `hardwareConcurrency <= 4` check ADR-0056 added
 * to `device-tier.ts` one turn ago. See ADR-0058, and ADR-0105 for the
 * GPU-string/FPS-benchmark detection layer added on top of it.
 *
 * `device-tier.ts`'s own "mobile"/"tablet"/"desktop" tiers are unchanged
 * (viewport-width-driven, used for grid/ambient-shape-count concerns
 * unrelated to raw device capability) — its `isLowPowerDevice()` now
 * delegates to this module's `detectPerformanceTier() === "low"` instead
 * of its own narrower hardwareConcurrency-only check, so every existing
 * consumer (`HeroScene`, `AmbientBackground`, `PlanetBackground`,
 * `SceneViewport`, every scene's own DPR clamp) picks up the fuller
 * detection — mobile UA, `deviceMemory`, screen width, session-persisted
 * downgrades, and (as of ADR-0105) a GPU-model string and a measured FPS
 * benchmark — with zero additional wiring, the same "one module decides"
 * principle ADR-0056 already established.
 */

export type PerformanceTier = "ultra" | "high" | "medium" | "low";

export interface TierParticleBudget {
  /** Multiplier a scene builder applies to its own baseline particle/point
   * count — wired through `device-tier.ts#getTierBudget`. */
  particleScale: number;
  /** Multiplier a scene builder applies to its own baseline bloom
   * strength/radius — same wiring as `particleScale`. `0` means the
   * builder's own `bloomPass.enabled = bloomStrength > 0.001` check skips
   * the post-processing pass entirely rather than just rendering an
   * invisible one (ADR-0105/optimize-3d-scene skill §7). */
  bloomScale: number;
  /** Clamp applied to `window.devicePixelRatio` — wired through
   * `device-tier.ts`'s existing `TierBudget.dprClamp`. */
  dprClamp: number;
  /** WebGL never mounts at all on this tier — every scene (`HeroScene`,
   * `PlanetBackground`, `AmbientBackground`, `SceneViewport`) gates its own
   * mount on `isLowPowerDevice()` reporting true, i.e. this tier being
   * "low". Capable mobile devices resolve to "medium"/"high" instead (see
   * `detectPerformanceTier`, ADR-0078) and mount WebGL like any other tier. */
  webglDisabled: boolean;
  /** Minimum gap (ms) a scene's own render loop should enforce between
   * frames — `0` means uncapped (every rAF tick). Merged into
   * `device-tier.ts#getTierBudget`'s `heroFrameIntervalMs` by taking the
   * *more conservative* (larger) of this and the viewport-width tier's own
   * value, so a desktop-width but only "medium"-capability machine still
   * gets capped instead of running uncapped purely by virtue of its
   * width (ADR-0105). Moot on "low" — WebGL never mounts there. */
  frameIntervalMs: number;
}

export const PERFORMANCE_TIER_BUDGETS: Record<PerformanceTier, TierParticleBudget> = {
  // Tier 4 — "ultra": everything maxed, uncapped frame rate.
  ultra: { particleScale: 1, bloomScale: 1, dprClamp: 2, webglDisabled: false, frameIntervalMs: 0 },
  // Tier 3 — "high"/"full 3D reduced": particles -40%, bloom strength -50%,
  // capped at 60fps.
  high: { particleScale: 0.6, bloomScale: 0.5, dprClamp: 2, webglDisabled: false, frameIntervalMs: 1000 / 60 },
  // Tier 2 — "medium"/"simplified 3D": particles -80%, zero bloom, capped
  // at 30fps.
  medium: { particleScale: 0.2, bloomScale: 0, dprClamp: 1, webglDisabled: false, frameIntervalMs: 1000 / 30 },
  // Tier 1 — "low"/"baqala mode": WebGL never mounts; frameIntervalMs is
  // unreachable (no loop to throttle).
  low: { particleScale: 0, bloomScale: 0, dprClamp: 1, webglDisabled: true, frameIntervalMs: 1000 / 30 },
};

// Versioned (`:v3`, was `:v2`) as of ADR-0105 — the detection algorithm
// itself changed (GPU-string + FPS-benchmark layer added ahead of the
// existing heuristic), which per this key's own established policy
// (ADR-0086) is exactly the kind of change that earns a one-time reset:
// every visitor re-detects fresh exactly once under the new algorithm,
// after which this version's own downgrades/overrides persist and stop
// self-healing again, same as always.
const STORAGE_KEY = "geoporte:performance-tier:v3";
/** Set once a visitor manually overrides the tier via the on-screen badge
 * (ADR-0105) — while this flag is set, the one-time benchmark refinement
 * below (`scheduleBenchmarkRefinement`) never silently overwrites their
 * choice. The *runtime* low-FPS auto-downgrade (`downgradeTier`, called
 * from `performance-monitor.ts` on a real measured slowdown) still applies
 * even under an override — that is a safety net against an actually
 * unusable experience, not a re-detection, and the brief never asked for a
 * way to disable it. */
const OVERRIDE_KEY = "geoporte:performance-tier:override:v1";
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
 * As of ADR-0105 this is specifically the *fallback* path, reached when
 * neither the GPU-string tier lists nor the FPS benchmark classify the
 * device — which in practice is every visit on Safari (desktop or iOS),
 * since Safari does not implement `WEBGL_debug_renderer_info` at all
 * (`gl.getExtension` returns `null`), unlike Chromium/Firefox. Do not
 * delete this path when adding GPU-string rules; it is the only thing that
 * works on the platform this project has repeatedly had to tune for.
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

// ---------------------------------------------------------------------------
// GPU-string + FPS-benchmark detection layer (ADR-0105)
// ---------------------------------------------------------------------------

interface GPUInfo {
  renderer: string;
  vendor: string;
}

/** Reads `WEBGL_debug_renderer_info` off a throwaway 1×1 canvas/context,
 * disposed immediately after. Returns empty strings (never throws) when the
 * extension is unavailable — which is every visit on Safari, desktop or
 * iOS: Apple has never implemented this extension, for the same
 * fingerprinting-surface reasons it never implements `deviceMemory`. On
 * Chromium/Firefox (any platform, including Chrome-for-Android and Chrome-
 * for-Mac) it typically resolves to the real GPU/ANGLE string. */
const detectGPUInfo = (): GPUInfo => {
  if (typeof document === "undefined") return { renderer: "", vendor: "" };
  try {
    const canvas = document.createElement("canvas");
    const gl = (canvas.getContext("webgl") ??
      canvas.getContext("experimental-webgl")) as WebGLRenderingContext | null;
    if (!gl) return { renderer: "", vendor: "" };
    const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
    const renderer = debugInfo ? String(gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)) : "";
    const vendor = debugInfo ? String(gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL)) : "";
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return { renderer, vendor };
  } catch {
    return { renderer: "", vendor: "" };
  }
};

const matchesAny = (value: string, patterns: readonly RegExp[]): boolean =>
  value.length > 0 && patterns.some((pattern) => pattern.test(value));

// Per-tier GPU name lists, matched case-insensitively against the renderer
// string. Apple Silicon beyond the base chip (Pro/Max/Ultra variants) isn't
// distinguished here — the spec's own lists don't cover every variant
// either — an unrecognized string like that simply falls through to the
// FPS benchmark + cores signals below, same treatment any other
// unmatched renderer string gets.
const TIER1_GPU_PATTERNS: readonly RegExp[] = [
  /intel.*hd graphics (4000|5000|6000|515|520|530)/i,
  /intel.*uhd graphics (620|630|615)/i,
  /\bmesa\b/i,
  /llvmpipe/i,
  /swiftshader/i,
  /software rasterizer/i,
];
const TIER2_GPU_PATTERNS: readonly RegExp[] = [
  /iris xe graphics/i,
  /uhd graphics (770|750h)/i,
  /intel.*\barc\b/i,
  /radeon.*vega [68]\b/i,
  /\bmx250\b|\bmx350\b|\bmx450\b/i,
  /apple m1\b/i,
];
const TIER3_GPU_PATTERNS: readonly RegExp[] = [
  /radeon.*\b(780m|890m)\b/i,
  /apple m2\b|apple m3\b/i,
  /\b(gtx 1650|gtx 1660)\b/i,
  /radeon.*rx 5500m|rx 5600m/i,
];
const TIER4_GPU_PATTERNS: readonly RegExp[] = [
  /ai max.*365|8060s/i,
  /radeon.*rx 7\d{3}/i,
  /apple m4\b/i,
  /\brtx (3\d|4\d|5\d)\d{2}/i,
];

const BENCHMARK_FRAME_COUNT = 60;
const BENCHMARK_CANVAS_SIZE = 256;

/**
 * Renders `BENCHMARK_FRAME_COUNT` frames of a deliberately fill-rate-heavy
 * fragment shader (a nested trig loop — cheap to read, expensive to run) to
 * a small throwaway canvas, calling `gl.finish()` every frame so the CPU
 * actually waits for GPU completion rather than just queuing work — without
 * that, a weak GPU's real slowness would be hidden behind `requestAnimationFrame`'s
 * own vsync pacing. Resolves the measured average fps; never rejects —
 * anything that goes wrong (no WebGL, SSR, a shader that fails to link)
 * resolves `60` instead, since "assume capable, let the other signals
 * decide" is the safer failure mode than classifying every oddity as the
 * weakest tier.
 *
 * On a display faster than the GPU can actually drive, this measures real
 * throughput; on a display *slower* than the GPU (any 60Hz monitor paired
 * with a genuinely fast card), `requestAnimationFrame`'s vsync wait caps the
 * measured number at the refresh rate — a benign under-classification (a
 * very fast desktop still lands in "> 60fps → ultra" whenever its display is
 * 75Hz+, and in the 45–60 "high" band on a plain 60Hz display, which this
 * file's own GPU-string list almost always catches first anyway for a card
 * worth calling "ultra").
 */
const runFpsBenchmark = (): Promise<number> =>
  new Promise((resolve) => {
    if (typeof document === "undefined" || typeof requestAnimationFrame === "undefined") {
      resolve(60);
      return;
    }
    try {
      const canvas = document.createElement("canvas");
      canvas.width = BENCHMARK_CANVAS_SIZE;
      canvas.height = BENCHMARK_CANVAS_SIZE;
      const gl = (canvas.getContext("webgl") ??
        canvas.getContext("experimental-webgl")) as WebGLRenderingContext | null;
      if (!gl) {
        resolve(60);
        return;
      }

      const compile = (type: number, src: string): WebGLShader | null => {
        const shader = gl.createShader(type);
        if (!shader) return null;
        gl.shaderSource(shader, src);
        gl.compileShader(shader);
        return gl.getShaderParameter(shader, gl.COMPILE_STATUS) ? shader : null;
      };

      const vertexShader = compile(
        gl.VERTEX_SHADER,
        `attribute vec2 aPos; void main() { gl_Position = vec4(aPos, 0.0, 1.0); }`,
      );
      const fragmentShader = compile(
        gl.FRAGMENT_SHADER,
        `precision mediump float;
         uniform vec2 uResolution;
         void main() {
           vec2 uv = gl_FragCoord.xy / uResolution;
           float v = 0.0;
           for (int i = 0; i < 48; i++) {
             v += sin(uv.x * float(i) + uv.y * float(i)) * cos(uv.y * float(i));
           }
           gl_FragColor = vec4(vec3(v), 1.0);
         }`,
      );
      const program = gl.createProgram();
      if (!vertexShader || !fragmentShader || !program) {
        resolve(60);
        return;
      }
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        resolve(60);
        return;
      }
      gl.useProgram(program);

      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      // One oversized triangle covering the full clip space — cheaper than
      // two triangles for a fullscreen pass, no index buffer needed.
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      const posLocation = gl.getAttribLocation(program, "aPos");
      gl.enableVertexAttribArray(posLocation);
      gl.vertexAttribPointer(posLocation, 2, gl.FLOAT, false, 0, 0);

      const resolutionLocation = gl.getUniformLocation(program, "uResolution");
      gl.uniform2f(resolutionLocation, BENCHMARK_CANVAS_SIZE, BENCHMARK_CANVAS_SIZE);
      gl.viewport(0, 0, BENCHMARK_CANVAS_SIZE, BENCHMARK_CANVAS_SIZE);

      let frame = 0;
      let startTime = 0;

      const finish = (fps: number) => {
        gl.getExtension("WEBGL_lose_context")?.loseContext();
        resolve(fps);
      };

      const tick = (time: number) => {
        if (frame === 0) startTime = time;
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        gl.finish();
        frame += 1;
        if (frame >= BENCHMARK_FRAME_COUNT) {
          const elapsedSeconds = (time - startTime) / 1000;
          finish(elapsedSeconds > 0 ? BENCHMARK_FRAME_COUNT / elapsedSeconds : 60);
          return;
        }
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    } catch {
      resolve(60);
    }
  });

interface GpuTierSignals {
  rendererLower: string;
  /** `null` on the synchronous first pass (before the benchmark has run) —
   * the FPS-based rules are simply skipped that one time, no different
   * from how any other not-yet-known signal is handled here. */
  fps: number | null;
  cores: number | null;
  width: number | null;
  isMobile: boolean;
}

/**
 * The literal 4-tier spec (ADR-0105): each tier is an OR of a GPU-name
 * match, an FPS-benchmark band, and a couple of cores/width combinations.
 * Checked most-restrictive-first (`low`) and most-capable-first after that
 * (`ultra`, `high`, `medium`) so a device matching multiple bands lands on
 * the more meaningful one rather than whichever happened to be checked
 * first. Returns `null` when nothing matches (typical on Safari/iOS, where
 * the GPU string is always empty) — the caller falls back to the
 * screen-signature/cores/memory heuristic below, which already covers that
 * platform gap.
 */
const classifyByGpuTierRules = (signals: GpuTierSignals): PerformanceTier | null => {
  const { rendererLower, fps, cores, width, isMobile } = signals;
  const c = cores ?? 4;

  if (
    matchesAny(rendererLower, TIER1_GPU_PATTERNS) ||
    (fps !== null && fps < 20) ||
    c <= 2 ||
    (isMobile && width !== null && width < 768 && c <= 4)
  ) {
    return "low";
  }

  if (matchesAny(rendererLower, TIER4_GPU_PATTERNS) || (fps !== null && fps > 60)) {
    return "ultra";
  }

  if (matchesAny(rendererLower, TIER3_GPU_PATTERNS) || (fps !== null && fps >= 45 && fps <= 60)) {
    return "high";
  }

  if (
    matchesAny(rendererLower, TIER2_GPU_PATTERNS) ||
    (isMobile && c >= 6 && width !== null && width >= 768) ||
    (fps !== null && fps >= 20 && fps < 45)
  ) {
    return "medium";
  }

  return null;
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
 *
 * As of ADR-0105 this is the *fallback* — `detectPerformanceTierSync`/
 * `detectPerformanceTierAsync` below try the GPU-string + FPS-benchmark
 * rules first and only call this when neither matched anything.
 */
const detectPerformanceTierLegacy = (): PerformanceTier => {
  const { cores, memory, width, isMobile } = readSignals();
  const c = cores ?? 4;
  const m = memory ?? 4;
  const memoryKnown = memory !== null;

  if (isMobile) {
    if (isUltraTierIOSDevice(cores) || c >= 12) return "ultra";
    if (c <= 4 || m <= 3 || (width !== null && width <= 390)) return "low";
    if (isHighTierIOSDevice()) return "high";
    if (c >= 8 && m >= 6) return "high";
    return "medium";
  }

  if (c >= 16 || (memoryKnown && c >= 8 && m >= 16)) return "ultra";
  if (c >= 8 && (!memoryKnown || m >= 8)) return "high";
  if (c < 4 || (memoryKnown && m < 4)) return "low";
  return "medium";
};

/** Synchronous first pass — GPU string + cores + width, no FPS benchmark
 * (which is async and must not block this page's own WebGL mount/budget
 * decisions). Called once, immediately, by `getOrDetectTier()` the first
 * time a session has no stored tier. */
const detectPerformanceTierSync = (): PerformanceTier => {
  const { cores, width, isMobile } = readSignals();
  const { renderer } = detectGPUInfo();
  const byRules = classifyByGpuTierRules({
    rendererLower: renderer.toLowerCase(),
    fps: null,
    cores,
    width,
    isMobile,
  });
  return byRules ?? detectPerformanceTierLegacy();
};

/** Benchmark-refined pass — same rules, this time with a real measured FPS.
 * Only ever called once per session, in the background, by
 * `scheduleBenchmarkRefinement`. */
const detectPerformanceTierAsync = async (): Promise<PerformanceTier> => {
  const { cores, width, isMobile } = readSignals();
  const { renderer } = detectGPUInfo();
  const fps = await runFpsBenchmark();
  const byRules = classifyByGpuTierRules({
    rendererLower: renderer.toLowerCase(),
    fps,
    cores,
    width,
    isMobile,
  });
  return byRules ?? detectPerformanceTierLegacy();
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

export const isOverrideActive = (): boolean => {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(OVERRIDE_KEY) === "1";
  } catch {
    return false;
  }
};

/** Called when a visitor manually picks a tier via the on-screen badge
 * (`PerformanceTierBadge.tsx`) — persists it and marks the override flag so
 * the one-time benchmark refinement never silently replaces their choice. */
export const setTierOverride = (tier: PerformanceTier): void => {
  persistTier(tier);
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(OVERRIDE_KEY, "1");
  } catch {
    // Same best-effort fallback as `persistTier` above.
  }
};

const refinementListeners = new Set<(tier: PerformanceTier) => void>();
/** Subscribe to the one-time benchmark-refined tier, if/when it lands —
 * `PerformanceTierProvider` uses this to update the reactive context (and
 * therefore the badge) without needing to poll. Never fires more than once
 * per page lifetime, and never fires at all once a manual override is set. */
export const onTierRefined = (listener: (tier: PerformanceTier) => void): (() => void) => {
  refinementListeners.add(listener);
  return () => refinementListeners.delete(listener);
};

let hasScheduledRefinement = false;
const scheduleBenchmarkRefinement = (provisional: PerformanceTier): void => {
  if (hasScheduledRefinement || typeof window === "undefined") return;
  hasScheduledRefinement = true;
  // Deferred one frame so it never competes with this page's own first
  // paint — the synchronous provisional tier above already drove whatever
  // WebGL mount/budget decision this page load needed. This only refines
  // what gets *persisted* for the next load (and what the badge displays);
  // it never tears down or rebuilds anything already mounted this session
  // (tier is decided once at construction — optimize-3d-scene skill §2).
  window.requestAnimationFrame(() => {
    void detectPerformanceTierAsync().then((refined) => {
      if (isOverrideActive()) return;
      logTierDiagnostics(refined, "benchmark-refined");
      if (refined === provisional) return;
      persistTier(refined);
      refinementListeners.forEach((listener) => listener(refined));
    });
  });
};

// Logs the resolved tier plus the raw signals it came from, once per page
// load regardless of how many consumers call `getOrDetectTier` — every
// scene mount site does, plus a second line once the background benchmark
// resolves. Explicitly requested (debugging a real-device report with no
// attached inspector is otherwise guesswork). Uses `warn`, not the plain
// logging method — `next.config.ts`'s `removeConsole` strips every console
// method except `error`/`warn` from the production bundle, so the plain one
// here would silently vanish from exactly the build a real device tests
// against.
let hasLoggedInitialDiagnostics = false;
const logTierDiagnostics = (
  resolved: PerformanceTier,
  source: "stored" | "fresh" | "override" | "benchmark-refined",
): void => {
  if (typeof console === "undefined") return;
  if (source !== "benchmark-refined") {
    if (hasLoggedInitialDiagnostics) return;
    hasLoggedInitialDiagnostics = true;
  }
  const { cores, memory, width, isMobile } = readSignals();
  const { renderer, vendor } = detectGPUInfo();
  const screenInfo =
    typeof screen !== "undefined" && typeof window !== "undefined"
      ? `${screen.width}x${screen.height}@${window.devicePixelRatio}dpr`
      : "unavailable";
  console.warn(
    `[geoporte:performance-tier] resolved="${resolved}" (${source}) — ` +
      `gpu="${renderer || "unavailable (Safari never exposes WEBGL_debug_renderer_info)"}" ` +
      `vendor="${vendor || "unavailable"}" ` +
      `cores=${cores ?? "unavailable"} ` +
      `memory=${memory ?? "unavailable (Safari/Firefox never expose this)"} ` +
      `screen=${screenInfo} isMobile=${isMobile}. ` +
      `To force a fresh read: localStorage.removeItem("${STORAGE_KEY}"); localStorage.removeItem("${OVERRIDE_KEY}")`,
  );
};

/** Session-stable read: a previously downgraded/overridden tier (this
 * session or a past one, via localStorage) always wins over a fresh
 * detection — a device that got downgraded for being too slow, or a
 * visitor who manually picked a tier, doesn't silently revert on the next
 * reload. First call on a fresh browser profile runs the synchronous
 * detection pass immediately and schedules the FPS-benchmark refinement in
 * the background (see `scheduleBenchmarkRefinement`). */
export const getOrDetectTier = (): PerformanceTier => {
  const stored = getStoredTier();
  if (stored) {
    logTierDiagnostics(stored, isOverrideActive() ? "override" : "stored");
    return stored;
  }
  const detected = detectPerformanceTierSync();
  persistTier(detected);
  logTierDiagnostics(detected, "fresh");
  scheduleBenchmarkRefinement(detected);
  return detected;
};

/** One step down, floored at "low". Persists immediately so it survives a
 * reload, same as the initial detection. Applies even under a manual
 * override — a real sustained slowdown is a safety net the brief never
 * asked to disable. */
export const downgradeTier = (current: PerformanceTier): PerformanceTier => {
  const index = TIER_ORDER.indexOf(current);
  const next = TIER_ORDER[Math.max(0, index - 1)];
  persistTier(next);
  return next;
};

/** Per the toast spec: shown when the resolved tier is "medium" or "low". */
export const isReducedPerformanceTier = (tier: PerformanceTier): boolean =>
  tier === "medium" || tier === "low";
