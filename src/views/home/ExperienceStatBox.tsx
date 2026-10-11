"use client";

import { useEffect, useState } from "react";
import { animated, useSpring } from "@react-spring/web";
import { useDynamicInView } from "@/hooks/animation/use-dynamic-in-view";
import type { ExperienceStat } from "@/data/mocks/experience";

const VARIANT_CLASSNAME: Record<ExperienceStat["variant"], string> = {
  purple: "bg-stat-purple",
  amber: "bg-stat-amber",
};

export interface ExperienceStatBoxProps {
  stat: ExperienceStat;
}

/** One colour-block callout in the "Project Experience" section — same
 * spring count-up idiom as `StatCounter`, styled as a flat solid card
 * instead of a plain centred number. Same `hasAnimated` latch as
 * `StatCounter` — see its comment for why driving the spring straight off
 * `inView` was unreliable on mobile. */
export const ExperienceStatBox = ({ stat }: ExperienceStatBoxProps) => {
  const [setNode, inView] = useDynamicInView({ threshold: 0.15 });
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    if (inView) setHasAnimated(true);
  }, [inView]);

  const { number } = useSpring({
    number: hasAnimated ? stat.value : 0,
    config: { tension: 60, friction: 26 },
  });

  return (
    <div
      ref={setNode}
      className={`${VARIANT_CLASSNAME[stat.variant]} flex flex-col justify-center gap-2 rounded-2xl p-6`}
    >
      <animated.span className="text-foreground text-3xl font-semibold md:text-4xl">
        {number.to((n) => `${Math.round(n)}${stat.suffix}`)}
      </animated.span>
      <span className="text-foreground/85 text-sm leading-snug">
        {stat.label}
      </span>
    </div>
  );
};
