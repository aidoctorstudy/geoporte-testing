"use client";

// 📖 Docs: obsidian/frontend/components/common.md

import { useEffect } from "react";
import { useScroll } from "@/hooks/smooth-scroll/use-scroll";
import { publishScrollSignal } from "@/hooks/scroll/use-scroll-signal";

/**
 * Bridges Lenis's own `scroll` event into the shared scroll-signal store —
 * one subscription for the whole app, instead of every scroll-reactive
 * consumer (progress bar, ambient background, hero parallax) reaching into
 * `useScroll().lenis` and wiring its own listener. Renders nothing; mount
 * once at the app root, alongside the other headless components in
 * `layout.tsx`.
 */
export const ScrollSignal = (): null => {
  const lenis = useScroll((state) => state.lenis);

  useEffect(() => {
    if (!lenis) return;

    return lenis.on("scroll", (instance) => {
      publishScrollSignal({
        progress: instance.progress,
        velocity: instance.velocity,
        direction: instance.direction,
      });
    });
  }, [lenis]);

  return null;
};
