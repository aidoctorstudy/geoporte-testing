"use client";

// 📖 Docs: obsidian/architecture/tech-stack.md → "3D — Geoporte hero + service scenes"

import { animated, useSpring } from "@react-spring/web";

const PULSE_SPRING_CONFIG = { duration: 3200 };

export interface HeroFallbackProps {
  className?: string;
}

/**
 * CSS/spring substitute for `HeroScene` below the mobile breakpoint — WebGL
 * never mounts there at all (see the device-tier check in `HeroScene.tsx`),
 * matching `SceneViewport`'s existing mobile-fallback convention for mini
 * scenes. A soft radial glow, slowly pulsing via a looping `useSpring` (real
 * spring physics, not a CSS keyframe animation — the one thing this
 * project's motion rules never allow). Reads `--accent`/`--glow` from
 * whatever CSS scope it's rendered in, so it picks up a service page's
 * per-service tint (see `service-accent.ts`) automatically with no props.
 */
export const HeroFallback = ({ className }: HeroFallbackProps) => {
  const { pulse } = useSpring({
    from: { pulse: 0 },
    to: { pulse: 1 },
    loop: { reverse: true },
    config: PULSE_SPRING_CONFIG,
  });

  return (
    <div aria-hidden="true" className={`bg-background relative overflow-hidden ${className ?? ""}`}>
      <animated.div
        className="absolute inset-0"
        style={{
          opacity: pulse.to((p) => 0.5 + p * 0.3),
          background:
            "radial-gradient(circle at 30% 40%, var(--glow) 0%, transparent 55%), radial-gradient(circle at 75% 70%, var(--accent) 0%, transparent 45%)",
        }}
      />
      <animated.div
        className="absolute inset-0"
        style={{
          opacity: pulse.to((p) => 0.06 + p * 0.05),
          background: "var(--accent)",
          mixBlendMode: "screen",
        }}
      />
    </div>
  );
};
