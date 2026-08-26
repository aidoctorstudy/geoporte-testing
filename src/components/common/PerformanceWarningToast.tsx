"use client";

// 📖 Docs: obsidian/frontend/components/common.md

import { useEffect, useState } from "react";
import { animated, useTransition } from "@react-spring/web";
import {
  hasStaticLowPerformanceSignal,
  subscribeToLowFpsWarning,
} from "@/lib/scene/performance-monitor";

const AUTO_DISMISS_MS = 8000;
const TRANSITION_CONFIG = { tension: 280, friction: 32 };

/**
 * A dismissible bottom-left notice shown once, the first time this device
 * looks underpowered for the site's 3D work — either a static hint
 * (`navigator.hardwareConcurrency`/`deviceMemory`, checked immediately on
 * mount) or a measured frame-rate drop below 30fps (reported by
 * `HeroScene.tsx`'s own render loop via `performance-monitor.ts`, after a
 * warm-up grace period so a scene's own load-in animation doesn't read as
 * a slow device). Mirrors `CookieBanner`'s spring/mount-unmount idiom, just
 * bottom-left instead of bottom-right and self-dismissing rather than
 * store-driven.
 */
export const PerformanceWarningToast = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (hasStaticLowPerformanceSignal()) {
      setVisible(true);
      return;
    }
    return subscribeToLowFpsWarning(() => setVisible(true));
  }, []);

  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => setVisible(false), AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [visible]);

  const transitions = useTransition(visible, {
    from: { opacity: 0, y: 16 },
    enter: { opacity: 1, y: 0 },
    leave: { opacity: 0, y: 16 },
    config: TRANSITION_CONFIG,
  });

  return transitions(
    (style, show) =>
      show && (
        <animated.div
          style={style}
          role="status"
          className="fixed bottom-4 left-4 z-50 flex max-w-xs items-start gap-3 rounded-xl border border-foreground/10 bg-background/95 px-4 py-3 shadow-2xl backdrop-blur-xl"
        >
          <p className="text-foreground-muted text-xs leading-relaxed">
            Some 3D elements have been simplified for your device&apos;s performance.
          </p>
          <button
            type="button"
            onClick={() => setVisible(false)}
            aria-label="Dismiss"
            className="text-foreground-muted hover:text-foreground flex h-5 w-5 shrink-0 items-center justify-center transition-colors duration-[var(--duration-fast)] ease-entrance"
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden>
              <path
                d="M4 4l8 8M12 4l-8 8"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </animated.div>
      ),
  );
};
