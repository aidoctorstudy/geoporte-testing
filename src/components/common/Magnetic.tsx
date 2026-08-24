"use client";

// 📖 Docs: obsidian/frontend/components/common.md

import { ReactNode, useEffect, useRef } from "react";
import { animated, useSpring } from "@react-spring/web";
import { getPointerSnapshot, usePointer } from "@/hooks/cursor/use-pointer";
import { subscribeToTicker } from "@/lib/animation/ticker";

const ATTRACTION_RADIUS_PX = 80;
const MAX_DRIFT_PX = 15;
const MAGNETIC_SPRING_CONFIG = { tension: 200, friction: 18 };
/** Uncapped — magnetic drift wants to track the pointer at native frame rate. */
const TICKER_FRAMERATE_MS = 0;

export interface MagneticProps {
  children: ReactNode;
  className?: string;
}

/**
 * Wraps a button/CTA with magnetic cursor attraction (item 4 of the homepage
 * motion spec): drifts up to `MAX_DRIFT_PX` toward the pointer once it's
 * within `ATTRACTION_RADIUS_PX`, springs back outside it. No-ops on touch —
 * gated on `usePointer().isFinePointer`, same convention as `TiltCard`.
 * Reads the shared pointer store non-reactively (`getPointerSnapshot`) inside
 * a single shared-ticker subscription, rather than re-subscribing per pointer
 * move.
 */
export const Magnetic = ({ children, className }: MagneticProps) => {
  const containerRef = useRef<HTMLSpanElement>(null);
  const { isFinePointer } = usePointer();
  const [style, api] = useSpring(() => ({
    x: 0,
    y: 0,
    config: MAGNETIC_SPRING_CONFIG,
  }));

  useEffect(() => {
    if (!isFinePointer) return;

    return subscribeToTicker(() => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const pointer = getPointerSnapshot();
      const dx = pointer.x - centerX;
      const dy = pointer.y - centerY;
      const distance = Math.hypot(dx, dy);

      if (distance > 0 && distance < ATTRACTION_RADIUS_PX) {
        const pull = (1 - distance / ATTRACTION_RADIUS_PX) * (MAX_DRIFT_PX / distance);
        api.start({ x: dx * pull, y: dy * pull });
      } else {
        api.start({ x: 0, y: 0 });
      }
    }, () => TICKER_FRAMERATE_MS);
  }, [isFinePointer, api]);

  return (
    <animated.span
      ref={containerRef}
      style={style}
      className={`inline-block${className ? ` ${className}` : ""}`}
    >
      {children}
    </animated.span>
  );
};
