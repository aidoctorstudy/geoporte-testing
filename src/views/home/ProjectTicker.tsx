"use client";

// 📖 Docs: obsidian/frontend/animation-system.md

import { useEffect, useRef } from "react";
import { projects } from "@/data/mocks/projects";
import { subscribeToTicker } from "@/lib/animation/ticker";
import { isReducedMotion } from "@/lib/scene/shared-viewport-renderer";

const TICKER_SPEED_PX_PER_S = 36;

/**
 * Continuous horizontal marquee of real project names, along the bottom edge
 * of the hero (item 18). Ticker-driven `translateX` on a doubled list (the
 * standard seamless-marquee technique) rather than a CSS `animation` — this
 * is continuous, looping motion, not the discrete-state-change the ADR-0014
 * CSS-transition exception covers. Pauses on hover; under
 * `prefers-reduced-motion` it renders a single static (non-scrolling) list
 * instead of animating at all.
 *
 * Purely decorative — the same projects get their full treatment in
 * `ProjectsSection` further down the page — so the whole strip is
 * `aria-hidden`, avoiding a duplicated project list for screen readers.
 */
export const ProjectTicker = () => {
  const trackRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(0);
  const pausedRef = useRef(false);
  const reducedMotion = isReducedMotion();

  useEffect(() => {
    if (reducedMotion) return;
    let lastTime: number | null = null;

    return subscribeToTicker((time) => {
      if (lastTime === null) lastTime = time;
      const dt = (time - lastTime) / 1000;
      lastTime = time;

      const track = trackRef.current;
      if (!track || pausedRef.current) return;

      const loopWidth = track.scrollWidth / 2;
      if (loopWidth <= 0) return;

      offsetRef.current -= TICKER_SPEED_PX_PER_S * dt;
      if (Math.abs(offsetRef.current) >= loopWidth) offsetRef.current += loopWidth;
      track.style.transform = `translateX(${offsetRef.current}px)`;
    }, () => 0);
  }, [reducedMotion]);

  const names = projects.map((project) => project.title);
  const track = reducedMotion ? names : [...names, ...names];

  return (
    <div
      aria-hidden="true"
      className="border-line/60 absolute inset-x-0 bottom-0 z-10 overflow-hidden border-t py-4 backdrop-blur-sm"
      onMouseEnter={() => {
        pausedRef.current = true;
      }}
      onMouseLeave={() => {
        pausedRef.current = false;
      }}
    >
      <div ref={trackRef} className="flex w-max items-center whitespace-nowrap">
        {track.map((name, i) => (
          <span key={i} className="text-foreground-muted/70 flex items-center text-sm">
            {name}
            <span className="text-accent/50 px-6">◆</span>
          </span>
        ))}
      </div>
    </div>
  );
};
