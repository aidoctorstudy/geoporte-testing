"use client";

// 📖 Docs: obsidian/frontend/animation-system.md

import { animated, useSpring } from "@react-spring/web";

const DOT_COUNT = 3;
const PULSE_CONFIG = { duration: 900 };
const DOT_STAGGER_MS = 180;

/**
 * "Still working on it" indicator — three dots pulsing in sequence via a
 * looping `useSpring` per dot (real spring physics, not a looping CSS
 * animation — this project's one hard rule on motion). A literal percentage
 * progress bar would imply a known completion time this maintenance window
 * doesn't have; dots read as "in progress," not "X% done."
 */
export const MaintenanceDots = () => (
  <div aria-hidden="true" className="flex items-center gap-2">
    {Array.from({ length: DOT_COUNT }, (_, index) => (
      <Dot key={index} delay={index * DOT_STAGGER_MS} />
    ))}
  </div>
);

const Dot = ({ delay }: { delay: number }) => {
  const { pulse } = useSpring({
    from: { pulse: 0 },
    to: { pulse: 1 },
    loop: { reverse: true },
    delay,
    config: PULSE_CONFIG,
  });

  return (
    <animated.span
      className="bg-accent block h-2.5 w-2.5 rounded-full"
      style={{
        opacity: pulse.to((p) => 0.35 + p * 0.65),
        scale: pulse.to((p) => 0.8 + p * 0.3),
      }}
    />
  );
};
