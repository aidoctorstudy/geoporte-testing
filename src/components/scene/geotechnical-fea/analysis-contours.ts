/**
 * Analysis-result colour mapping — an original, lightweight stand-in for
 * professional FE-analysis contour output. Every mode derives a 0..1
 * scalar from the same procedural geometry the deformation field already
 * uses (excavation proximity, depth, settlement magnitude), not a real
 * solve — the brief frames this as "should look like numerical analysis
 * data", a visualization requirement, not a physics one.
 */
import * as THREE from "three";
import { type ResultMode } from "./constants";
import { computeSurfaceSettlement, distanceToExcavationEdge, settlementToUnitScalar } from "./deformation";

const STRESS_PROXIMITY_INFLUENCE = 3.5;

/** 0..1 scalar for a ground-surface point, given the active result mode. */
export const computeSurfaceResultScalar = (
  mode: ResultMode,
  x: number,
  z: number,
  excavationFraction: number,
  deformAmount: number,
): number => {
  const settlement = computeSurfaceSettlement(x, z, excavationFraction, deformAmount);
  const settlementUnit = settlementToUnitScalar(settlement);
  const edgeDist = distanceToExcavationEdge(x, z);
  const proximity = Math.exp(-edgeDist / STRESS_PROXIMITY_INFLUENCE);

  switch (mode) {
    case "displacement-total":
    case "displacement-vertical":
      return settlementUnit;
    case "displacement-horizontal":
      // Horizontal ground movement tracks the same bowl but reads as
      // roughly half the vertical component at the surface — a common
      // real-world ratio for a well-propped wall.
      return settlementUnit * 0.6;
    case "effective-stress":
      return THREE.MathUtils.clamp(proximity * 0.7 + excavationFraction * 0.3, 0, 1);
    case "safety-factor":
      // Inverted: low safety factor (red) near the excavation edge, high
      // (blue) further away — the ramp itself is the same 4-stop scale,
      // just fed the complement.
      return 1 - THREE.MathUtils.clamp(proximity * 0.85 + excavationFraction * 0.15, 0, 1);
    default:
      return 0;
  }
};

/** 0..1 scalar for a retaining-wall vertex, given its normalized depth. */
export const computeWallResultScalar = (
  mode: ResultMode,
  normalizedDepth: number,
  excavationFraction: number,
  deformAmount: number,
): number => {
  const bowShape = Math.sin(Math.PI * Math.min(1, normalizedDepth / 0.85));
  switch (mode) {
    case "displacement-total":
    case "displacement-horizontal":
      return THREE.MathUtils.clamp(bowShape * excavationFraction * deformAmount * 1.3, 0, 1);
    case "displacement-vertical":
      return THREE.MathUtils.clamp(bowShape * excavationFraction * deformAmount * 0.4, 0, 1);
    case "effective-stress":
      return THREE.MathUtils.clamp(0.3 + normalizedDepth * 0.6 + excavationFraction * 0.2, 0, 1);
    case "safety-factor":
      return 1 - THREE.MathUtils.clamp(bowShape * excavationFraction * 1.1, 0, 1);
    default:
      return 0;
  }
};

/** 0..1 scalar for a tunnel-lining ring vertex. */
export const computeTunnelResultScalar = (
  mode: ResultMode,
  excavationFraction: number,
  deformAmount: number,
): number => {
  switch (mode) {
    case "displacement-total":
    case "displacement-vertical":
    case "displacement-horizontal":
      return THREE.MathUtils.clamp(excavationFraction * deformAmount * 0.8, 0, 1);
    case "effective-stress":
      return 0.55;
    case "safety-factor":
      return 1 - THREE.MathUtils.clamp(excavationFraction * 0.5, 0, 1);
    default:
      return 0;
  }
};

export { scalarToContourColor as writeContourColor } from "./constants";
