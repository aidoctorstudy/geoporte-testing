"use client";

import { useEffect, useState } from "react";
import { animated, useSpring } from "@react-spring/web";
import { useDynamicInView } from "@/hooks/animation/use-dynamic-in-view";
import { isReducedMotion } from "@/lib/scene/shared-viewport-renderer";

export interface StatCounterProps {
  value: number;
  label: string;
  suffix?: string;
  /** Prepended before the number, e.g. "$" for "$2B+". */
  prefix?: string;
}

/** Spring count-up, triggered once the stat scrolls into view. A low
 * threshold plus a one-way `hasAnimated` latch (rather than driving the
 * spring straight off `inView`) keeps the count-up reliable on mobile: a
 * fast or bouncy scroll can drop the element below the intersection
 * threshold again before/while the spring is running, which — wired
 * directly to `inView` — snapped the number back to 0 mid-animation.
 *
 * Latched straight to `true` on Tier 1 / reduced motion (ADR-0102) in a
 * `useEffect` — never in `useState`'s own lazy initializer, which runs
 * during render and would disagree with the server-rendered "0" the very
 * first client render has to match, tripping a hydration mismatch — rather
 * than waiting on `inView` at all. Same observer-reliability gap as
 * `<Inview>` (see `TierInview.tsx`): a slow/low-power main thread can
 * delay or entirely miss the `IntersectionObserver`'s first callback,
 * which otherwise left this counter frozen at 0 forever. */
export const StatCounter = ({ value, label, suffix = "+", prefix = "" }: StatCounterProps) => {
  const [setNode, inView] = useDynamicInView({ threshold: 0.15 });
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    if (inView || isReducedMotion()) setHasAnimated(true);
  }, [inView]);

  const { number } = useSpring({
    number: hasAnimated ? value : 0,
    config: { tension: 60, friction: 26 },
  });

  return (
    <div
      ref={setNode}
      className="flex flex-col items-center text-center md:items-start md:text-left"
    >
      <animated.span className="text-foreground text-5xl font-medium md:text-6xl">
        {number.to((n) => `${prefix}${Math.round(n)}${suffix}`)}
      </animated.span>
      <span className="text-label mt-3 text-sm tracking-[0.16em] uppercase">
        {label}
      </span>
    </div>
  );
};
