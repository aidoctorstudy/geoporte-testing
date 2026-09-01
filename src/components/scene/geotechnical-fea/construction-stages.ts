/**
 * Construction-stage lookup. The 6 stages themselves are data, in
 * `constants.ts` (`CONSTRUCTION_STAGES`) alongside every other scene
 * constant; this file is the small "controller" the brief names — a
 * clamped accessor plus the transition damping rate, so a stage *change*
 * (however triggered — the UI selector's buttons) still eases in smoothly
 * rather than snapping, matching "relevant geometry should appear/
 * disappear... deformation should update slightly... contours transition
 * smoothly". The actual per-frame lerp toward the target lives in the
 * orchestrator (`build-geotechnical-fea-scene.ts`), the same "keyframe
 * target + damped lerp" idiom every scroll-driven scene in this codebase
 * already uses — a stage change is just a new, discretely-chosen target
 * instead of a continuously-interpolated scroll keyframe.
 */
import { CONSTRUCTION_STAGES, type ConstructionStage } from "./constants";

export const STAGE_COUNT = CONSTRUCTION_STAGES.length;

export const getConstructionStage = (index: number): ConstructionStage =>
  CONSTRUCTION_STAGES[Math.max(0, Math.min(CONSTRUCTION_STAGES.length - 1, index))];

/** Per-second damping rate for every value a stage change drives — slower
 * than the scroll-keyframe damping elsewhere in this scene since a stage
 * jump is a bigger, more deliberate change than a continuous scroll. */
export const STAGE_TRANSITION_DAMPING = 1.6;
