"use client";

// 📖 Docs: obsidian/architecture/tech-stack.md → "3D — Geoporte hero + service scenes"

import { useCallback, useRef, useState } from "react";
import { HeroScene } from "./HeroScene";
import {
  createGeotechnicalFeaHeroScene,
  type GeotechnicalFeaSceneHandle,
} from "./build-geotechnical-fea-scene";
import type { HeroSceneHandle } from "./hero-scene-types";
import { CONSTRUCTION_STAGES, RESULT_MODES } from "./geotechnical-fea/constants";
import type { ResultMode } from "./geotechnical-fea/constants";
import { useWindowWidth } from "@/hooks/use-window-size";
import { getDeviceTier } from "@/lib/scene/device-tier";

export interface GeotechnicalFeaSceneProps {
  className?: string;
}

/**
 * Thin client leaf wrapping `<HeroScene>` with the Geotechnical FEA scene
 * factory (mirrors `GeotechnicalPlexusScene.tsx`/`ServiceHeroScene.tsx`'s
 * role — a scene factory that imports `three` can't be passed as a prop
 * straight from a Server Component; see ADR-0060/ADR-0061), plus the small
 * original stage/result-mode/deformation control panel the brief asks for
 * — rendered as a real, accessible sibling of `<HeroScene>`'s own
 * `aria-hidden` canvas container, not inside it.
 *
 * The control panel is hidden below the mobile breakpoint, matching
 * `HeroScene.tsx`'s own internal gating there (no WebGL scene mounts, so
 * `onSceneReady` never fires and the buttons would otherwise sit inert).
 */
export const GeotechnicalFeaScene = ({ className }: GeotechnicalFeaSceneProps) => {
  const sceneRef = useRef<GeotechnicalFeaSceneHandle | null>(null);
  const width = useWindowWidth();
  const isMobile = width > 0 && getDeviceTier(width) === "mobile";

  const [stageIndex, setStageIndex] = useState(0);
  const [resultMode, setResultModeState] = useState<ResultMode>("none");
  const [deformed, setDeformed] = useState(false);

  const handleSceneReady = useCallback((scene: HeroSceneHandle) => {
    sceneRef.current = scene as GeotechnicalFeaSceneHandle;
  }, []);

  const goToStage = (index: number) => {
    const clamped = Math.max(0, Math.min(CONSTRUCTION_STAGES.length - 1, index));
    setStageIndex(clamped);
    sceneRef.current?.setConstructionStage(clamped);
  };

  const handleResultModeChange = (mode: ResultMode) => {
    setResultModeState(mode);
    sceneRef.current?.setResultMode(mode);
  };

  const handleDeformedToggle = () => {
    const next = !deformed;
    setDeformed(next);
    sceneRef.current?.setDeformedView(next);
  };

  return (
    <div className={`relative ${className ?? ""}`}>
      <HeroScene className="h-full w-full" createScene={createGeotechnicalFeaHeroScene} onSceneReady={handleSceneReady} fallback={<FeaFallback />} />

      {!isMobile && (
        <div className="border-line-engineering bg-surface-engineering/92 pointer-events-auto absolute inset-x-2 bottom-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-lg border px-3 py-2 text-[11px] backdrop-blur-sm">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => goToStage(stageIndex - 1)}
              disabled={stageIndex === 0}
              aria-label="Previous construction stage"
              className="text-ink-engineering-muted hover:text-ink-engineering disabled:opacity-30 flex h-8 w-8 items-center justify-center rounded transition-colors duration-[var(--duration-fast)] ease-entrance disabled:pointer-events-none"
            >
              ‹
            </button>
            <span className="text-ink-engineering min-w-[10.5rem] text-center font-medium">
              Stage {stageIndex + 1}/{CONSTRUCTION_STAGES.length} — {CONSTRUCTION_STAGES[stageIndex].label}
            </span>
            <button
              type="button"
              onClick={() => goToStage(stageIndex + 1)}
              disabled={stageIndex === CONSTRUCTION_STAGES.length - 1}
              aria-label="Next construction stage"
              className="text-ink-engineering-muted hover:text-ink-engineering disabled:opacity-30 flex h-8 w-8 items-center justify-center rounded transition-colors duration-[var(--duration-fast)] ease-entrance disabled:pointer-events-none"
            >
              ›
            </button>
          </div>

          <div className="bg-line-engineering h-3.5 w-px" aria-hidden="true" />

          <label className="text-ink-engineering-muted flex items-center gap-1.5">
            <input
              type="checkbox"
              checked={deformed}
              onChange={handleDeformedToggle}
              className="accent-accent-engineering h-3 w-3"
            />
            Deformed
          </label>

          <div className="bg-line-engineering h-3.5 w-px" aria-hidden="true" />

          <label className="flex items-center gap-1.5">
            <span className="text-ink-engineering-muted">Results</span>
            <select
              value={resultMode}
              onChange={(e) => handleResultModeChange(e.target.value as ResultMode)}
              className="border-line-engineering text-ink-engineering rounded border bg-transparent px-1 py-0.5 text-[11px]"
            >
              {RESULT_MODES.map((mode) => (
                <option key={mode.id} value={mode.id}>
                  {mode.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}
    </div>
  );
};

/** Static light-themed substitute for the mobile/reduced-motion tier —
 * `HeroFallback` hardcodes the sitewide dark `bg-background`, wrong here
 * since this scene's own bounded viewport is a light "instrument panel"
 * floating over the page's Solaris background (see `GeotechnicalAnalysisHero.tsx`). */
const FeaFallback = () => (
  <div
    aria-hidden="true"
    className="bg-surface-engineering-alt relative h-full w-full"
    style={{
      backgroundImage:
        "radial-gradient(circle at 30% 35%, var(--glow-engineering) 0%, transparent 55%), radial-gradient(circle at 75% 70%, var(--accent-engineering) 0%, transparent 45%)",
      backgroundBlendMode: "multiply",
      opacity: 0.35,
    }}
  />
);
