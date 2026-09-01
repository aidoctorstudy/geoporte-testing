/**
 * Shared geometry/engineering constants for the Geotechnical FEA hero scene
 * — block bounds, the six strata, the excavation/retaining-wall/strut
 * geometry, the tunnel, the pile foundation, the construction stages and
 * the analysis-result colour ramp. One module so every subsystem agrees on
 * the same numbers instead of each hardcoding its own copy — mirrors
 * `geotechnical-plexus/constants.ts`'s role for that scene.
 */
import * as THREE from "three";

export const BLOCK_HALF_WIDTH = 7; // X: ±7
export const BLOCK_HALF_DEPTH = 5; // Z: ±5
export const SURFACE_Y = 1.0;
export const BEDROCK_BOTTOM_Y = -10.0;

export interface StratumDef {
  name: string;
  topY: number;
  bottomY: number;
  color: number;
  opacity: number;
  waviness: number;
}

/** Top to bottom — PLAXIS-style stratigraphy naming, not literal PLAXIS
 * content. Colours are a restrained, desaturated engineering palette (see
 * the scene builder's own header for the "avoid unrealistic geological
 * colours" brief line this follows). */
export const STRATA: StratumDef[] = [
  { name: "Fill", topY: SURFACE_Y, bottomY: -0.3, color: 0xc9b995, opacity: 0.46, waviness: 0.16 },
  { name: "Loose / Medium Sand", topY: -0.3, bottomY: -2.0, color: 0xd8c377, opacity: 0.48, waviness: 0.13 },
  { name: "Dense Sand", topY: -2.0, bottomY: -3.8, color: 0xc2a854, opacity: 0.52, waviness: 0.1 },
  { name: "Clay", topY: -3.8, bottomY: -5.8, color: 0xa97650, opacity: 0.56, waviness: 0.08 },
  { name: "Weathered Rock", topY: -5.8, bottomY: -7.8, color: 0x8c8c90, opacity: 0.64, waviness: 0.05 },
  { name: "Bedrock", topY: -7.8, bottomY: BEDROCK_BOTTOM_Y, color: 0x55555e, opacity: 0.8, waviness: 0.03 },
];

// ---------------------------------------------------------------------------
// Excavation (west side of the block, X < 0)
// ---------------------------------------------------------------------------
export const EXCAVATION_BOUNDS = { x0: -6.5, x1: -1.0, z0: -3.0, z1: 3.0 };
export const EXCAVATION_LEVEL_1_Y = -2.5;
export const EXCAVATION_LEVEL_2_Y = -5.0; // final formation level, top of Weathered Rock
export const RETAINING_WALL_TOE_Y = -6.6; // embedment below final formation level
export const RETAINING_WALL_THICKNESS = 0.22;
export const STRUT_LEVELS_Y = [-0.9, -3.3];

// ---------------------------------------------------------------------------
// Pile foundation (east side of the block, X > 0)
// ---------------------------------------------------------------------------
export const FOUNDATION_CENTER = { x: 4.4, z: 0 };
export const FOUNDATION_SLAB_SIZE = 3.6;
export const FOUNDATION_SLAB_THICKNESS = 0.3;
export const PILE_TIP_Y = -6.8; // into Weathered Rock
export const PILE_GRID = 3;

// ---------------------------------------------------------------------------
// Tunnel — bored along X, threading beneath both the excavation and the
// foundation (the brief's combined "excavation + foundation + tunnel" hero).
// ---------------------------------------------------------------------------
export const TUNNEL_Y = -4.6; // within Clay
export const TUNNEL_Z = 0;
export const TUNNEL_RADIUS = 0.85;
export const TUNNEL_LINING_THICKNESS = 0.14;

// ---------------------------------------------------------------------------
// Finite element mesh — coarse base grid + finer grids clipped to "critical
// zone" rectangles, per the brief's "denser mesh around excavation walls,
// piles, tunnel lining, load zones".
// ---------------------------------------------------------------------------
export interface MeshZone {
  x0: number;
  x1: number;
  z0: number;
  z1: number;
  divX: number;
  divZ: number;
}
export const MESH_DENSE_ZONES: MeshZone[] = [
  { x0: EXCAVATION_BOUNDS.x0 - 0.6, x1: EXCAVATION_BOUNDS.x1 + 0.6, z0: EXCAVATION_BOUNDS.z0 - 0.6, z1: EXCAVATION_BOUNDS.z1 + 0.6, divX: 18, divZ: 14 },
  { x0: -BLOCK_HALF_WIDTH, x1: BLOCK_HALF_WIDTH, z0: TUNNEL_Z - 1.6, z1: TUNNEL_Z + 1.6, divX: 22, divZ: 6 },
  { x0: FOUNDATION_CENTER.x - 2.2, x1: FOUNDATION_CENTER.x + 2.2, z0: FOUNDATION_CENTER.z - 2.2, z1: FOUNDATION_CENTER.z + 2.2, divX: 10, divZ: 10 },
];
export const MESH_HORIZONTAL_DEPTHS_Y = [-1.0, -3.0, -5.0, -7.2];
export const MESH_VERTICAL_PLANES_Z = [0, -3.4];
export const MESH_BASE_DIV_X = 8;
export const MESH_BASE_DIV_Z = 6;

// ---------------------------------------------------------------------------
// Construction stages
// ---------------------------------------------------------------------------
export interface ConstructionStage {
  label: string;
  excavationY: number; // current formation level (SURFACE_Y = not yet excavated)
  wallsRevealed: number; // 0/1 target
  strutsRevealed: [number, number];
  foundationRevealed: number;
  buildingRevealed: number;
  deformAmount: number; // 0..1, how much of the deformation field is applied
}
export const CONSTRUCTION_STAGES: ConstructionStage[] = [
  { label: "Initial Ground", excavationY: SURFACE_Y, wallsRevealed: 0, strutsRevealed: [0, 0], foundationRevealed: 0, buildingRevealed: 0, deformAmount: 0 },
  { label: "Retaining Wall Installation", excavationY: SURFACE_Y, wallsRevealed: 1, strutsRevealed: [0, 0], foundationRevealed: 0, buildingRevealed: 0, deformAmount: 0 },
  { label: "Excavation Level 1", excavationY: EXCAVATION_LEVEL_1_Y, wallsRevealed: 1, strutsRevealed: [1, 0], foundationRevealed: 0, buildingRevealed: 0, deformAmount: 0.35 },
  { label: "Excavation Level 2", excavationY: EXCAVATION_LEVEL_2_Y, wallsRevealed: 1, strutsRevealed: [1, 1], foundationRevealed: 0, buildingRevealed: 0, deformAmount: 0.7 },
  { label: "Foundation Installation", excavationY: EXCAVATION_LEVEL_2_Y, wallsRevealed: 1, strutsRevealed: [1, 1], foundationRevealed: 1, buildingRevealed: 0, deformAmount: 0.7 },
  { label: "Final Structure", excavationY: EXCAVATION_LEVEL_2_Y, wallsRevealed: 1, strutsRevealed: [0, 0], foundationRevealed: 1, buildingRevealed: 1, deformAmount: 1 },
];

// ---------------------------------------------------------------------------
// Analysis result modes + contour colour ramp
// ---------------------------------------------------------------------------
export type ResultMode =
  | "none"
  | "displacement-total"
  | "displacement-vertical"
  | "displacement-horizontal"
  | "effective-stress"
  | "safety-factor";

export const RESULT_MODES: { id: ResultMode; label: string }[] = [
  { id: "none", label: "Model" },
  { id: "displacement-total", label: "Total Displacement" },
  { id: "displacement-vertical", label: "Vertical Displacement" },
  { id: "displacement-horizontal", label: "Horizontal Displacement" },
  { id: "effective-stress", label: "Effective Stress" },
  { id: "safety-factor", label: "Safety Factor" },
];

const CONTOUR_STOPS = [
  new THREE.Color(0x2f6fb0), // low — blue
  new THREE.Color(0x3fae6a), // green
  new THREE.Color(0xe0c23f), // yellow
  new THREE.Color(0xd9483a), // high — red
];

/** Maps a normalized scalar (0..1) to the 4-stop blue→green→yellow→red
 * engineering contour ramp real FE-analysis tools use for magnitude fields. */
export const scalarToContourColor = (t: number, out: THREE.Color): THREE.Color => {
  const clamped = THREE.MathUtils.clamp(t, 0, 1);
  const span = (CONTOUR_STOPS.length - 1) * clamped;
  const i = Math.min(CONTOUR_STOPS.length - 2, Math.floor(span));
  const localT = span - i;
  return out.copy(CONTOUR_STOPS[i]).lerp(CONTOUR_STOPS[i + 1], localT);
};

export type DisposeFn = () => void;
