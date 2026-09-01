"use client";

// 📖 Docs: obsidian/frontend/animation-system.md

import { useEffect, useRef, useState } from "react";
import { animated, useSpring } from "@react-spring/web";
import { useScrollSignal } from "@/hooks/scroll/use-scroll-signal";
import { subscribeToTicker } from "@/lib/animation/ticker";
import { isReducedMotion } from "@/lib/scene/shared-viewport-renderer";

const DOT_BOUNCE_PERIOD_S = 1.6;
const DOT_TRAVEL_PX = 6;
const DOT_REST_Y = 8;
const HAS_SCROLLED_THRESHOLD = 0.01;

/**
 * Hero scroll indicator (item 19) — a mouse icon with a dot that bounces
 * inside it, fading out once the page has actually scrolled. The dot's
 * bounce is ticker-driven (a raw SVG attribute set via ref, not React state,
 * so it doesn't re-render every frame) since it's continuous looping motion,
 * not a discrete state — the fade-out on scroll *is* a discrete state change
 * and rides `@react-spring/web` directly.
 */
export const ScrollCue = () => {
  const { progress } = useScrollSignal();
  const [hasScrolled, setHasScrolled] = useState(false);
  const dotRef = useRef<SVGCircleElement>(null);
  const reducedMotion = isReducedMotion();

  useEffect(() => {
    if (progress > HAS_SCROLLED_THRESHOLD) setHasScrolled(true);
  }, [progress]);

  useEffect(() => {
    if (reducedMotion) return;
    return subscribeToTicker((time) => {
      const dot = dotRef.current;
      if (!dot) return;
      const phase = (time / 1000 / DOT_BOUNCE_PERIOD_S) % 1;
      const eased = (Math.sin(phase * Math.PI * 2 - Math.PI / 2) + 1) / 2;
      dot.setAttribute("cy", String(DOT_REST_Y + eased * DOT_TRAVEL_PX));
    }, () => 0);
  }, [reducedMotion]);

  const style = useSpring({
    opacity: hasScrolled ? 0 : 1,
    config: { tension: 170, friction: 24 },
  });

  return (
    <animated.div
      aria-hidden="true"
      style={style}
      className="pointer-events-none absolute inset-x-0 bottom-24 z-10 flex flex-col items-center gap-2"
    >
      <svg width="20" height="32" viewBox="0 0 20 32" fill="none">
        <rect
          x="1"
          y="1"
          width="18"
          height="30"
          rx="9"
          stroke="currentColor"
          className="text-foreground-muted/60"
          strokeWidth="1.5"
        />
        <circle ref={dotRef} cx="10" cy={DOT_REST_Y} r="2" fill="currentColor" className="text-accent" />
      </svg>
      <span className="text-foreground-muted/50 text-xs tracking-[0.3em] uppercase">
        Scroll
      </span>
    </animated.div>
  );
};
