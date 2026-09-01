"use client";

// 📖 Docs: obsidian/architecture/tech-stack.md → "3D — cinematic Earth globe background"

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { startPlanetBackground } from "./build-planet-scene";
import { isReducedMotion } from "@/lib/scene/shared-viewport-renderer";
import { getDeviceTier, getTierBudget, isLowPowerDevice } from "@/lib/scene/device-tier";
import { useWindowWidth } from "@/hooks/use-window-size";
import { isGlassBackgroundRoute } from "@/lib/scene/glass-background-routes";

// Every route with its own fixed full-page WebGL background
// (`glass-background-routes.ts`) gets the globe stepping aside instead —
// two heavy fixed WebGL backgrounds competing on one page reads as a
// mistake, not a choice. Every other route (the homepage and the remaining
// 6 service pages) keeps it.

/**
 * Mounts the cinematic Earth globe (ported from GetLayers' "Ascend"
 * template — see `build-planet-scene.ts`) once at the app root, alongside
 * `AmbientBackground`. Gated on device *capability*
 * (`isLowPowerDevice()`) and `prefers-reduced-motion` — not on viewport
 * width; a capable phone gets the full scene, just at its narrower-width
 * `getTierBudget` numbers (DPR, particle counts). This is easily the
 * heaviest scene here (a Draco-compressed GLB, custom day/night shaders,
 * three `EffectComposer` passes), so it gets the same discipline, not less.
 * Renders nothing itself; the scene's canvas is appended straight to
 * `document.body`, matching `ambient-background-renderer.ts`'s own
 * technique. See ADR-0078 (superseded ADR-0056's mobile-width skip).
 */
export const PlanetBackground = (): null => {
  const width = useWindowWidth();
  const pathname = usePathname();
  const tier = getDeviceTier(width);
  const budget = getTierBudget(width);
  const enabled =
    width > 0 && !isLowPowerDevice() && !isReducedMotion() && !isGlassBackgroundRoute(pathname);

  useEffect(() => {
    if (!enabled) return;
    return startPlanetBackground({ dprClamp: budget.dprClamp, tier });
  }, [enabled, tier, budget.dprClamp]);

  return null;
};
