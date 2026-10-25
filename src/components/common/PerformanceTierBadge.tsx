"use client";

// 📖 Docs: obsidian/frontend/components/common.md

import { usePerformanceTier } from "@/hooks/performance/use-performance-tier";
import type { PerformanceTier } from "@/lib/scene/performance-tier";

const TIER_ORDER: readonly PerformanceTier[] = ["low", "medium", "high", "ultra"];

/** Display label per the brief's own wording — "Basic" for the lowest tier,
 * not "Low" (matches the user-facing tone of "Performance: Basic/Medium/
 * High/Ultra" rather than the internal `PerformanceTier` string). */
const TIER_LABELS: Record<PerformanceTier, string> = {
  low: "Basic",
  medium: "Medium",
  high: "High",
  ultra: "Ultra",
};

/**
 * Small persistent bottom-left badge (ADR-0105) showing the detected
 * performance tier — "Performance: Basic/Medium/High/Ultra" — and letting a
 * visitor manually override it by clicking through the four tiers in order.
 * An override persists (`usePerformanceTier().setOverride`) and is never
 * silently replaced by the one-time background FPS-benchmark refinement
 * (`performance-tier.ts#scheduleBenchmarkRefinement`).
 *
 * Positioned at `bottom-4 left-4` — `PerformanceWarningToast` (same corner)
 * sits higher, at `bottom-16 left-4`, so the two never overlap when both are
 * visible.
 */
export const PerformanceTierBadge = () => {
  const { tier, setOverride } = usePerformanceTier();

  const cycleTier = () => {
    const nextIndex = (TIER_ORDER.indexOf(tier) + 1) % TIER_ORDER.length;
    setOverride(TIER_ORDER[nextIndex]);
  };

  return (
    <button
      type="button"
      onClick={cycleTier}
      aria-label={`Performance tier: ${TIER_LABELS[tier]}. Click to change.`}
      className="border-foreground/10 bg-background/95 text-foreground-muted hover:text-foreground fixed bottom-4 left-4 z-40 rounded-full border px-3 py-1.5 text-[11px] font-medium tracking-wide shadow-lg backdrop-blur-xl transition-colors duration-[var(--duration-fast)] ease-entrance"
    >
      Performance: {TIER_LABELS[tier]}
    </button>
  );
};
