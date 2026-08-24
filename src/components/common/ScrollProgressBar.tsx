"use client";

// 📖 Docs: obsidian/frontend/components/common.md

import { animated, useSpring } from "@react-spring/web";
import { useEffect } from "react";
import { useScrollSignal } from "@/hooks/scroll/use-scroll-signal";

const PROGRESS_SPRING_CONFIG = { tension: 210, friction: 30 };

/**
 * Thin accent line pinned to the top of the viewport, filling left-to-right
 * with whole-page scroll progress — reads the shared scroll signal
 * (`useScrollSignal`, bridged from Lenis by `ScrollSignal`). Mount once at
 * the app root; it has no per-route state.
 */
export const ScrollProgressBar = () => {
  const { progress } = useScrollSignal();
  const [style, api] = useSpring(() => ({
    scaleX: 0,
    config: PROGRESS_SPRING_CONFIG,
  }));

  useEffect(() => {
    api.start({ scaleX: progress });
  }, [progress, api]);

  return (
    <div
      aria-hidden="true"
      className="bg-line/40 fixed inset-x-0 top-0 z-[110] h-0.5"
    >
      <animated.div
        className="bg-accent h-full origin-left"
        style={{ transform: style.scaleX.to((value) => `scaleX(${value})`) }}
      />
    </div>
  );
};
