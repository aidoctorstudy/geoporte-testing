"use client";

// 📖 Docs: obsidian/architecture/tech-stack.md → "3D — shared viewport renderer"

import {
  forwardRef,
  ReactNode,
  RefObject,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import {
  isReducedMotion,
  registerViewport,
  ViewportBuilder,
} from "@/lib/scene/shared-viewport-renderer";
import { useWindowWidth } from "@/hooks/use-window-size";
import { isLowPowerDevice } from "@/lib/scene/device-tier";

export interface SceneViewportHandle {
  /** Feed a caller-defined control value into the scene's `update` (0..1 hover
   * intensity, scroll progress, etc). No-op on mobile / reduced-motion, where
   * the scene never mounts. */
  setControl: (value: number) => void;
}

export interface SceneViewportProps {
  builder: ViewportBuilder;
  className?: string;
  /** Below this width the WebGL scene is skipped entirely in favour of `fallback`. */
  mobileBreakpoint?: number;
  /** CSS-only substitute rendered on mobile / reduced-motion instead of mounting WebGL. */
  fallback?: ReactNode;
  /** When set, hovering this element drives `control` to 1 (and 0 on leave). */
  hoverRef?: RefObject<HTMLElement | null>;
}

const DEFAULT_MOBILE_BREAKPOINT = 768;

/**
 * A slot registered against the shared multi-viewport WebGL renderer — see
 * `src/lib/scene/shared-viewport-renderer.ts`. On mobile or when the OS
 * "reduce motion" setting is on, it renders `fallback` (plain CSS/markup)
 * instead of mounting any WebGL.
 */
export const SceneViewport = forwardRef<SceneViewportHandle, SceneViewportProps>(
  ({ builder, className, mobileBreakpoint = DEFAULT_MOBILE_BREAKPOINT, fallback, hoverRef }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const controlRef = useRef<((value: number) => void) | null>(null);
    const width = useWindowWidth();
    // `isLowPowerDevice()` is folded in behind the same `width > 0` guard as
    // the breakpoint check — see `device-tier.ts`'s own comment on why: it
    // must not run on the very first client render (before hydration
    // completes), or the tier disagrees with the server-rendered HTML.
    const isMobile = width > 0 && (width < mobileBreakpoint || isLowPowerDevice());
    const skip = isMobile || isReducedMotion();

    useImperativeHandle(ref, () => ({
      setControl: (value: number) => controlRef.current?.(value),
    }));

    useEffect(() => {
      if (skip) return;
      const el = containerRef.current;
      if (!el) return;

      const handle = registerViewport({ element: el, builder });
      controlRef.current = handle.setControl;

      const io = new IntersectionObserver(
        ([entry]) => handle.setActive(entry.isIntersecting),
        { threshold: 0 },
      );
      io.observe(el);

      const hoverEl = hoverRef?.current ?? null;
      const onEnter = () => handle.setControl(1);
      const onLeave = () => handle.setControl(0);
      if (hoverEl) {
        hoverEl.addEventListener("mouseenter", onEnter);
        hoverEl.addEventListener("mouseleave", onLeave);
      }

      return () => {
        io.disconnect();
        if (hoverEl) {
          hoverEl.removeEventListener("mouseenter", onEnter);
          hoverEl.removeEventListener("mouseleave", onLeave);
        }
        controlRef.current = null;
        handle.unregister();
      };
    }, [skip, builder, hoverRef]);

    if (skip) {
      return (
        <div aria-hidden="true" className={className}>
          {fallback}
        </div>
      );
    }

    return <div ref={containerRef} aria-hidden="true" className={className} />;
  },
);

SceneViewport.displayName = "SceneViewport";
