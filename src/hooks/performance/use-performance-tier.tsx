"use client";

/**
 * React context for the 4-tier performance system (`performance-tier.ts`,
 * ADR-0058) — the explicit "store tier in a React context so all scenes can
 * read it" mechanism, sitting alongside the synchronous
 * `getDeviceTier()`/`getTierBudget()` API every scene builder already reads
 * at construction time. This context is for reactive consumers instead —
 * currently `PerformanceWarningToast.tsx`, which needs to notice a
 * live tier change (an FPS-triggered downgrade) and re-render.
 */

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import {
  downgradeTier,
  getOrDetectTier,
  type PerformanceTier,
} from "@/lib/scene/performance-tier";

export interface PerformanceTierContextValue {
  tier: PerformanceTier;
  /** Steps the tier down one level (floored at "low") and persists it. */
  downgrade: () => void;
}

// SSR-safe default — "high" is a conservative-but-not-crippled guess for
// the brief instant before the client measures real hardware signals,
// matching every other tier check in this codebase treating the
// unmeasured state as "not yet mobile/low" rather than assuming the worst.
const DEFAULT_VALUE: PerformanceTierContextValue = { tier: "high", downgrade: () => {} };

const PerformanceTierContext = createContext<PerformanceTierContextValue>(DEFAULT_VALUE);

export const usePerformanceTier = (): PerformanceTierContextValue =>
  useContext(PerformanceTierContext);

export const PerformanceTierProvider = ({ children }: { children: React.ReactNode }) => {
  const [tier, setTier] = useState<PerformanceTier>(DEFAULT_VALUE.tier);

  useEffect(() => {
    setTier(getOrDetectTier());
  }, []);

  const downgrade = useCallback(() => {
    setTier((current) => downgradeTier(current));
  }, []);

  return (
    <PerformanceTierContext.Provider value={{ tier, downgrade }}>
      {children}
    </PerformanceTierContext.Provider>
  );
};
