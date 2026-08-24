"use client";

// 📖 Docs: obsidian/architecture/tech-stack.md → "3D — Geoporte hero + service scenes"

import { useEffect, useRef } from "react";
import { createHeroScene } from "./build-hero-scene";
import type { HeroSceneHandle } from "./hero-scene-types";

export interface HeroSceneProps {
  className?: string;
  /** Which scene factory to mount. Defaults to the homepage digital-twin
   * scene; every service detail page hero passes its own factory from
   * `service-heroes/index.ts`'s `SERVICE_HERO_SCENES` registry. */
  createScene?: (container: HTMLElement) => HeroSceneHandle;
}

/**
 * Full-bleed WebGL background — the homepage hero and every service detail
 * page hero, parameterized by `createScene`. Runs its own
 * `requestAnimationFrame` loop, separate from the spring ticker that drives
 * `@react-spring/web` — three.js needs native frame timing, not the shared
 * ticker's throttled framerate.
 *
 * Pauses when off-screen, when the tab is hidden, or when the OS "reduce
 * motion" setting is on (renders one static frame instead).
 */
export const HeroScene = ({ className, createScene = createHeroScene }: HeroSceneProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = createScene(container);
    container.appendChild(scene.canvas);

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let rafId: number | null = null;
    let inView = true;
    let start: number | null = null;

    const loop = (time: number) => {
      if (start === null) start = time;
      scene.renderFrame((time - start) / 1000);
      rafId = requestAnimationFrame(loop);
    };

    const startLoop = () => {
      if (rafId !== null || reducedMotion) return;
      rafId = requestAnimationFrame(loop);
    };

    const stopLoop = () => {
      if (rafId === null) return;
      cancelAnimationFrame(rafId);
      rafId = null;
    };

    if (reducedMotion) {
      scene.renderStatic();
    } else {
      startLoop();
    }

    const resizeObserver = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      scene.resize(width, height);
      if (reducedMotion) scene.renderStatic();
    });
    resizeObserver.observe(container);

    // Mouse-driven parallax — normalized -1..1 from the container's centre.
    // Skipped entirely under reduced motion, matching the rest of the scene.
    const handlePointerMove = (event: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = ((event.clientY - rect.top) / rect.height) * 2 - 1;
      scene.setPointer(x, y);
    };
    if (!reducedMotion) {
      window.addEventListener("pointermove", handlePointerMove, { passive: true });
    }

    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
        if (!reducedMotion) {
          if (inView && document.visibilityState === "visible") startLoop();
          else stopLoop();
        }
      },
      { threshold: 0 },
    );
    intersectionObserver.observe(container);

    const handleVisibility = () => {
      if (reducedMotion) return;
      if (document.visibilityState === "visible" && inView) startLoop();
      else stopLoop();
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      stopLoop();
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("pointermove", handlePointerMove);
      scene.dispose();
      container.removeChild(scene.canvas);
    };
    // `createScene` is only ever a stable module-level factory (the default,
    // or one keyed out of `SERVICE_HERO_SCENES`) — re-running this effect on
    // every render would tear down and rebuild the WebGL context for no reason.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className={className}
    />
  );
};
