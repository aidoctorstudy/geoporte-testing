"use client";

// 📖 Docs: obsidian/architecture/tech-stack.md → "3D — ambient background"

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { startAmbientBackground } from "@/lib/scene/ambient-background-renderer";
import { isReducedMotion } from "@/lib/scene/shared-viewport-renderer";
import { getTierBudget, isLowPowerDevice } from "@/lib/scene/device-tier";
import { useWindowWidth } from "@/hooks/use-window-size";
import { isGlassBackgroundRoute } from "@/lib/scene/glass-background-routes";

// Every route with its own fixed full-page WebGL background
// (`glass-background-routes.ts`) — the wireframe shapes clash with those
// scenes' own particle/rod texture, so they step aside on those pages.

/**
 * Mounts the persistent ambient background scene (drifting wireframe shapes,
 * items 11–13 of the homepage motion spec) once at the app root, alongside
 * the other headless globals in `layout.tsx`. Gated on device *capability*
 * (`isLowPowerDevice()`) and `prefers-reduced-motion` — not on viewport
 * width; a capable phone still gets the shapes, just fewer of them via
 * `getTierBudget(width).ambientShapeCount`. Renders nothing itself; the
 * scene's canvas is appended straight to `document.body` by
 * `ambient-background-renderer.ts`, same technique as the shared mini-scene
 * renderer. See ADR-0078.
 */
export const AmbientBackground = (): null => {
  const width = useWindowWidth();
  const pathname = usePathname();
  const budget = getTierBudget(width);
  const enabled =
    width > 0 &&
    !isLowPowerDevice() &&
    !isReducedMotion() &&
    !isGlassBackgroundRoute(pathname);

  useEffect(() => {
    if (!enabled) return;
    return startAmbientBackground({
      shapeCount: budget.ambientShapeCount,
      dprClamp: budget.dprClamp,
    });
  }, [enabled, budget.ambientShapeCount, budget.dprClamp]);

  return null;
};
