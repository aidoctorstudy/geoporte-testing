"use client";

// 📖 Docs: obsidian/frontend/text-engine.md

import { useEffect, useRef } from "react";
import TextEngine from "spring-text-engine";
import { easings } from "@react-spring/web";
import { subscribeToTicker } from "@/lib/animation/ticker";

const SHIMMER_PERIOD_S = 5;
const SHIMMER_WIDTH_PERCENT = 16;

export interface HeroHeadingProps {
  id: string;
  text: string;
  className?: string;
}

/**
 * The hero's `<h1>` — word-by-word spring entrance (item 17), plus a looping
 * shimmer sweep ("light reflecting off metal"). Split out of the shared
 * `SectionHeading` (which reveals line-by-line, used by every other section)
 * rather than changing that component's behaviour project-wide.
 *
 * The shimmer is a separate absolutely-positioned gradient bar swept via
 * `translateX`, not a `background-clip: text` gradient on the heading text
 * itself — `TextEngine` splits its children into nested word/letter spans
 * internally, and `background-clip: text` only clips to an element's *own*
 * glyphs, not descendants', so it can't cleanly sit on `TextEngine`'s root.
 * Ticker-driven (continuous, not a discrete state — the ADR-0014 CSS
 * exception doesn't cover this), mutating the DOM node directly via a ref
 * rather than a per-frame React re-render.
 */
export const HeroHeading = ({ id, text, className }: HeroHeadingProps) => {
  const shimmerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return subscribeToTicker((time) => {
      const el = shimmerRef.current;
      if (!el) return;
      const phase = (time / 1000 / SHIMMER_PERIOD_S) % 1;
      const travel = 100 + SHIMMER_WIDTH_PERCENT;
      el.style.transform = `translateX(${phase * travel - SHIMMER_WIDTH_PERCENT}%)`;
    }, () => 0);
  }, []);

  return (
    <div className="relative overflow-hidden">
      <TextEngine
        tag="h1"
        id={id}
        mode="once"
        className={className}
        wordIn={{ y: 0, opacity: 1 }}
        wordOut={{ y: 40, opacity: 0 }}
        wordStagger={90}
        wordConfig={{ duration: 700, easing: easings.easeOutCubic }}
      >
        {text}
      </TextEngine>
      <div
        ref={shimmerRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 w-1/6 bg-gradient-to-r from-transparent via-white/40 to-transparent mix-blend-screen"
      />
    </div>
  );
};

/** How long the heading's word-by-word entrance takes to settle — the
 * subtext's `delayIn` starts right after, so it reads as "the subtext types
 * in once the heading has finished." Three words, `wordStagger={90}` +
 * `wordConfig.duration={700}` on `HeroHeading` above — keep these two in
 * sync if either changes. */
export const HERO_HEADING_SETTLE_MS = 900;

export interface HeroSubtextProps {
  text: string;
  className?: string;
}

/**
 * The hero's subtext — reveals letter by letter after the heading settles,
 * reading as a typing effect (item 17) without a hand-rolled
 * `setInterval` typewriter, which would be a custom text-animation
 * component — banned by this project's hard rule. `TextEngine`'s letter
 * stagger produces the same visual read while staying inside the vendored
 * engine.
 */
export const HeroSubtext = ({ text, className }: HeroSubtextProps) => {
  return (
    <TextEngine
      tag="p"
      mode="once"
      className={className}
      delayIn={HERO_HEADING_SETTLE_MS}
      letterIn={{ opacity: 1 }}
      letterOut={{ opacity: 0 }}
      letterStagger={14}
      letterConfig={{ duration: 1, easing: easings.linear }}
    >
      {text}
    </TextEngine>
  );
};
