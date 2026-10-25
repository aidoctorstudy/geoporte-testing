"use client";

/**
 * React context for the 4-tier performance system (`performance-tier.ts`,
 * ADR-0058) — the explicit "store tier in a React context so all scenes can
 * read it" mechanism, sitting alongside the synchronous
 * `getDeviceTier()`/`getTierBudget()` API every scene builder already reads
 * at construction time. This context is for reactive consumers instead —
 * `PerformanceWarningToast.tsx` (notices a live tier change from an
 * FPS-triggered downgrade), `PerformanceTierBadge.tsx` (displays the tier
 * and lets a visitor override it, ADR-0105), and `ReducedMotion.tsx` (the
 * `data-perf-tier` attribute on `<html>`).
 */

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import {
  downgradeTier,
  getOrDetectTier,
  onTierRefined,
  setTierOverride,
  type PerformanceTier,
} from "@/lib/scene/performance-tier";

export interface PerformanceTierContextValue {
  tier: PerformanceTier;
  /** Steps the tier down one level (floored at "low") and persists it. */
  downgrade: () => void;
  /** Manually pins the tier (ADR-0105's on-screen badge) — persists it and
   * marks the override flag so the background benchmark refinement never
   * silently replaces the choice. */
  setOverride: (tier: PerformanceTier) => void;
}

// SSR-safe default — "high" is a conservative-but-not-crippled guess for
// the brief instant before the client measures real hardware signals,
// matching every other tier check in this codebase treating the
// unmeasured state as "not yet mobile/low" rather than assuming the worst.
const DEFAULT_VALUE: PerformanceTierContextValue = {
  tier: "high",
  downgrade: () => {},
  setOverride: () => {},
};

const PerformanceTierContext = createContext<PerformanceTierContextValue>(DEFAULT_VALUE);

export const usePerformanceTier = (): PerformanceTierContextValue =>
  useContext(PerformanceTierContext);

export const PerformanceTierProvider = ({ children }: { children: React.ReactNode }) => {
  const [tier, setTier] = useState<PerformanceTier>(DEFAULT_VALUE.tier);

  useEffect(() => {
    setTier(getOrDetectTier());
    // One-time background FPS-benchmark refinement (ADR-0105) — fires at
    // most once per page lifetime, never once a manual override is set.
    // Updates this context so the badge reflects the refined tier even
    // though nothing already mounted this session is torn down/rebuilt.
    return onTierRefined(setTier);
  }, []);

  const downgrade = useCallback(() => {
    setTier((current) => downgradeTier(current));
  }, []);

  const setOverride = useCallback((next: PerformanceTier) => {
    setTierOverride(next);
    setTier(next);
  }, []);

  return (
    <PerformanceTierContext.Provider value={{ tier, downgrade, setOverride }}>
      {children}
    </PerformanceTierContext.Provider>
  );
};
