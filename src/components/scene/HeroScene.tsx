"use client";

// 📖 Docs: obsidian/architecture/tech-stack.md → "3D — Geoporte hero + service scenes"

import { useEffect, useRef } from "react";
import { createHeroScene } from "./build-hero-scene";
import { HeroFallback } from "./HeroFallback";
import type { HeroSceneHandle } from "./hero-scene-types";
import { getPointerSnapshot } from "@/hooks/cursor/use-pointer";
import { subscribeToTicker } from "@/lib/animation/ticker";
import { useProgressTrigger } from "@/hooks/animation/use-progress-trigger";
import { useWindowWidth } from "@/hooks/use-window-size";
import { getDeviceTier } from "@/lib/scene/device-tier";

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
  const sceneRef = useRef<HeroSceneHandle | null>(null);
  const width = useWindowWidth();
  // `width === 0` is the pre-hydration/SSR snapshot (see `useWindowSize`) —
  // treated as "not mobile yet" so the real check runs once the client has
  // actually measured the viewport, matching `SceneViewport`'s own guard.
  const isMobile = width > 0 && getDeviceTier(width) === "mobile";

  // Scroll-driven framing — the container fills the hero section exactly
  // (`inset-0` on its parent), so its own rect doubles as the section's
  // scroll-trigger range. Calls the engine's `useProgressTrigger` hook
  // directly (not the `<SpringTrigger>` component) since there's already a
  // ref here and no extra wrapper element is wanted.
  useProgressTrigger({
    elementRef: containerRef,
    start: "top top",
    end: "bottom top",
    onChange: ({ interpolatedProgress }) =>
      sceneRef.current?.setScrollProgress?.(interpolatedProgress),
  });

  useEffect(() => {
    // WebGL never mounts below the mobile breakpoint — `HeroFallback` renders
    // instead (see the JSX below), matching `SceneViewport`'s existing
    // mini-scene convention. This also means resizing from a wide viewport
    // down to mobile doesn't tear down a running scene — it never started.
    if (isMobile) return;

    const container = containerRef.current;
    if (!container) return;

    const scene = createScene(container);
    sceneRef.current = scene;
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

    // Pointer parallax — reads the shared pointer store (one app-wide
    // `pointermove` listener, see `src/hooks/cursor/use-pointer.ts`) each
    // ticker tick instead of this component wiring its own `window`
    // listener; normalized -1..1 from the container's own rect, so this
    // still works correctly for service-page heroes whose container isn't
    // full-window. Skipped entirely under reduced motion.
    const unsubscribePointer = reducedMotion
      ? null
      : subscribeToTicker(() => {
          const pointer = getPointerSnapshot();
          if (!pointer.hasMoved) return;
          const rect = container.getBoundingClientRect();
          const x = ((pointer.x - rect.left) / rect.width) * 2 - 1;
          const y = ((pointer.y - rect.top) / rect.height) * 2 - 1;
          scene.setPointer(x, y);
        }, () => 0);

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
      unsubscribePointer?.();
      sceneRef.current = null;
      scene.dispose();
      container.removeChild(scene.canvas);
    };
    // `createScene` is only ever a stable module-level factory (the default,
    // or one keyed out of `SERVICE_HERO_SCENES`) — re-running this effect on
    // every render would tear down and rebuild the WebGL context for no reason.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div ref={containerRef} aria-hidden="true" className={className}>
      {isMobile && <HeroFallback className="h-full w-full" />}
    </div>
  );
};
