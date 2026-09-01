/**
 * Procedural deformation field — this scene visualizes plausible ground
 * movement, not a real FE solve. Three effects, all driven by
 * `excavationFraction` (0 = not excavated, 1 = at final formation level)
 * and a global `deformAmount` (0 = undeformed mesh, 1 = fully deformed):
 *
 * - a settlement bowl in the ground surface, centred on the excavation's
 *   retaining wall (and gently reinforced along the tunnel's axis, so
 *   "settlement above the tunnel" reads as part of the same field rather
 *   than a second unrelated system)
 * - inward bow of each retaining wall panel, peaking at mid-height
 * - a slight vertical ovalization of the tunnel lining ring
 *
 * Kept intentionally simple (smooth, bounded, hand-tuned functions) — real
 * enough to read as engineering deformation, never exaggerated per the
 * brief's own "do not exaggerate deformation unrealistically".
 */
import * as THREE from "three";
import { EXCAVATION_BOUNDS, TUNNEL_RADIUS, TUNNEL_Z } from "./constants";

const MAX_SETTLEMENT = 0.32;
const SETTLEMENT_INFLUENCE = 4.5;
const MAX_WALL_BOW = 0.22;
const MAX_TUNNEL_OVALIZATION = 0.06;

export const distanceToExcavationEdge = (x: number, z: number): number => {
  const dx = Math.max(EXCAVATION_BOUNDS.x0 - x, x - EXCAVATION_BOUNDS.x1, 0);
  const dz = Math.max(EXCAVATION_BOUNDS.z0 - z, z - EXCAVATION_BOUNDS.z1, 0);
  if (dx === 0 && dz === 0) return 0; // inside the footprint
  return Math.hypot(dx, dz);
};

/** Vertical settlement (negative = downward) at a ground-surface point. */
export const computeSurfaceSettlement = (
  x: number,
  z: number,
  excavationFraction: number,
  deformAmount: number,
): number => {
  const edgeDist = distanceToExcavationEdge(x, z);
  const bowl = Math.exp(-edgeDist / SETTLEMENT_INFLUENCE);
  const tunnelDist = Math.abs(z - TUNNEL_Z);
  const tunnelBowl = Math.exp(-tunnelDist / 2.2) * 0.35;
  return -MAX_SETTLEMENT * excavationFraction * deformAmount * Math.min(1, bowl + tunnelBowl);
};

/** Inward (toward excavation centre) horizontal offset for a retaining wall
 * vertex, given its normalized depth (0 = top, 1 = toe) and which side of
 * the excavation it belongs to. `inwardDir` is the unit vector pointing
 * from the wall toward the excavation's centre. */
export const computeWallBowOffset = (
  normalizedDepth: number,
  excavationFraction: number,
  deformAmount: number,
  inwardDir: THREE.Vector2,
  out: THREE.Vector2,
): THREE.Vector2 => {
  // Peaks around 60% depth (typical propped-wall deflection shape), zero at
  // the top (propped/braced) and tapering toward the embedded toe.
  const shape = Math.sin(Math.PI * Math.min(1, normalizedDepth / 0.85)) * (1 - normalizedDepth * 0.3);
  const magnitude = MAX_WALL_BOW * excavationFraction * deformAmount * Math.max(0, shape);
  return out.copy(inwardDir).multiplyScalar(magnitude);
};

/** Radial ovalization offset for a tunnel lining ring vertex at angle
 * `theta` (0 = +Y/crown). Squashes the crown/invert in slightly and bulges
 * the springlines — the classic tunnelling-induced ovalization shape. */
export const computeTunnelOvalization = (
  theta: number,
  excavationFraction: number,
  deformAmount: number,
): THREE.Vector2 => {
  const magnitude = MAX_TUNNEL_OVALIZATION * excavationFraction * deformAmount;
  const radial = Math.cos(2 * theta); // +1 at crown/invert, -1 at springlines
  const scale = TUNNEL_RADIUS - radial * magnitude;
  return new THREE.Vector2(Math.sin(theta) * scale, Math.cos(theta) * scale);
};

/** Ground-surface settlement expressed as a 0..1 "total displacement"
 * fraction, for `analysis-contours.ts` to share the same underlying field
 * rather than inventing a second one. */
export const settlementToUnitScalar = (settlement: number): number =>
  THREE.MathUtils.clamp(Math.abs(settlement) / MAX_SETTLEMENT, 0, 1);
