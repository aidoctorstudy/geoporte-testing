"use client";

import { animated, useSpring } from "@react-spring/web";
import { useDynamicInView } from "@/hooks/animation/use-dynamic-in-view";

export interface StatCounterProps {
  value: number;
  label: string;
  suffix?: string;
  /** Prepended before the number, e.g. "$" for "$2B+". */
  prefix?: string;
}

/** Spring count-up, triggered once the stat scrolls into view. */
export const StatCounter = ({ value, label, suffix = "+", prefix = "" }: StatCounterProps) => {
  const [setNode, inView] = useDynamicInView({ threshold: 0.4 });
  const { number } = useSpring({
    number: inView ? value : 0,
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
      <span className="text-foreground-muted mt-3 text-sm tracking-[0.16em] uppercase">
        {label}
      </span>
    </div>
  );
};
