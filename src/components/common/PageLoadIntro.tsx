"use client";

// 📖 Docs: obsidian/frontend/components/common.md

import { useEffect, useState } from "react";
import TextEngine from "spring-text-engine";
import { easings } from "@react-spring/web";
import { Spring } from "@/components/animation/springs/spring";
import { brand } from "@/lib/company";
import { useScroll } from "@/hooks/smooth-scroll/use-scroll";
import { isReducedMotion } from "@/lib/scene/shared-viewport-renderer";

const STORAGE_KEY = "geoporte-intro-seen";
const REVEAL_MS = 1200;
const HOLD_MS = 400;
const EXPLODE_MS = 600;
const TOTAL_MS = REVEAL_MS + HOLD_MS + EXPLODE_MS; // 2200ms — matches the spec's 2.2s

type Phase = "hidden" | "revealing" | "exploding";

/**
 * First-visit load intro (item 14): the wordmark draws in letter by letter,
 * holds, then the overlay explodes outward as the hero reveals beneath it.
 * Skipped on every return visit via a `localStorage` flag, and skipped
 * entirely under `prefers-reduced-motion` (no partial/instant substitute —
 * the correct reduced-motion behaviour for a load animation is none at all).
 *
 * The letter-by-letter reveal goes through `spring-text-engine`, not a
 * hand-rolled SVG path-trace — real per-glyph vector outlines aren't
 * available for arbitrary web fonts, and this project's hard rule is that
 * all text animation goes through the vendored text engine.
 */
export const PageLoadIntro = () => {
  const [phase, setPhase] = useState<Phase>("hidden");
  const stopScroll = useScroll((state) => state.stop);
  const startScroll = useScroll((state) => state.start);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isReducedMotion()) return;
    if (window.localStorage.getItem(STORAGE_KEY)) return;

    setPhase("revealing");
    stopScroll();

    const explodeTimer = setTimeout(() => setPhase("exploding"), REVEAL_MS + HOLD_MS);
    const doneTimer = setTimeout(() => {
      window.localStorage.setItem(STORAGE_KEY, "1");
      setPhase("hidden");
      startScroll();
    }, TOTAL_MS);

    return () => {
      clearTimeout(explodeTimer);
      clearTimeout(doneTimer);
    };
    // Runs once on mount only — re-firing on a `stopScroll`/`startScroll`
    // identity change would restart the intro.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (phase === "hidden") return null;

  return (
    <Spring
      tag="div"
      enabled={phase === "exploding"}
      from={{ opacity: 1, scale: 1 }}
      to={{ opacity: 0, scale: 1.15 }}
      config={{ tension: 120, friction: 22 }}
      aria-hidden="true"
      className="bg-background pointer-events-none fixed inset-0 z-[10010] flex items-center justify-center"
    >
      <TextEngine
        tag="p"
        mode="once"
        className="text-foreground text-center justify-center text-3xl font-semibold tracking-[0.32em] uppercase md:text-5xl"
        letterIn={{ opacity: 1, y: 0 }}
        letterOut={{ opacity: 0, y: 24 }}
        letterStagger={45}
        letterConfig={{ duration: 500, easing: easings.easeOutCubic }}
        seo={false}
      >
        {brand.wordmark}
      </TextEngine>
    </Spring>
  );
};
