"use client";

// 📖 Docs: obsidian/frontend/components/common.md

import { useEffect } from "react";
import { Globals } from "@react-spring/web";
import { usePerformanceTier } from "@/hooks/performance/use-performance-tier";

/**
 * Honours the OS "reduce motion" accessibility setting *and* the Tier 1
 * ("low" capability, see `performance-tier.ts`) performance mode — either one
 * forces react-spring's global `skipAnimation`, so every spring — and
 * `spring-text-engine`, which runs on react-spring — jumps straight to its
 * end state instead of animating. Covers every spring-driven surface
 * (`Inview`/`SpringTrigger`/`Hover`/`Handle`/`TextEngine`, plus the one-off
 * `useSpring` calls in `RouteTransitionSweep`/`ScrollCue`/`CustomCursor`) with
 * zero per-component wiring. Non-spring motion (WebGL scenes, the cursor
 * trail, the page-load intro) reads the same tier through
 * `isReducedMotion()` (`shared-viewport-renderer.ts`) instead, since it
 * isn't driven by react-spring's `Globals`.
 *
 * Doesn't use `@react-spring/web`'s own `useReducedMotion()` hook — that
 * hook owns its matchMedia listener internally and has no way to OR in a
 * second condition, so it would race with (and intermittently undo) a tier-
 * driven force. This re-implements the same OS listener directly instead,
 * combined with the live tier on every re-evaluation.
 *
 * Also sets `data-perf-tier` on `<html>` to the live tier value (`"low"` |
 * `"medium"` | `"high"` | `"ultra"`, ADR-0105 — was `"low"`-only-or-absent
 * before) — `globals.css`'s `[data-perf-tier="low"]` rules (flattening
 * every `backdrop-filter`/`.glass-panel` surface to a solid fill, stripping
 * box-shadow/corner-radius/custom fonts) are unaffected, since they still
 * key off that exact value; the attribute is just never *absent* now,
 * which lets a future rule target `[data-perf-tier="medium"]` etc. without
 * another wiring pass. Same "toggle an attribute on `<html>`" convention
 * `CustomCursor` already uses for `.cursor-hidden`.
 *
 * Renders nothing; mount once at the app root.
 */
export const ReducedMotion = (): null => {
  const { tier } = usePerformanceTier();

  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => {
      Globals.assign({ skipAnimation: mql.matches || tier === "low" });
    };
    apply();
    mql.addEventListener("change", apply);
    return () => mql.removeEventListener("change", apply);
  }, [tier]);

  useEffect(() => {
    document.documentElement.setAttribute("data-perf-tier", tier);
    return () => document.documentElement.removeAttribute("data-perf-tier");
  }, [tier]);

  return null;
};
