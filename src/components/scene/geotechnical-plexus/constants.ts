/**
 * Shared geometry constants and layer definitions for the Geotechnical
 * Plexus feature scene. One module so every subsystem (terrain, layers,
 * plexus mesh, boreholes, foundation, groundwater) agrees on the same
 * block bounds and layer boundaries instead of each hardcoding its own copy.
 *
 * The noise helpers used to live here; moved to `src/lib/scene/value-noise.ts`
 * when `build-geotechnical-fea-scene.ts` needed the same shape, and
 * re-exported below so every existing import site in this folder is
 * unaffected.
 */
export { smoothNoise2D, fbm2, signedNoise } from "@/lib/scene/value-noise";

/** Half-extents of the underground block. X: ±BLOCK_HALF_WIDTH, Z: ±BLOCK_HALF_DEPTH. */
export const BLOCK_HALF_WIDTH = 6;
export const BLOCK_HALF_DEPTH = 4;
export const SURFACE_Y = 1.0;
export const BEDROCK_BOTTOM_Y = -9.5;

export interface LayerDef {
  name: string;
  /** Short label used on borehole strata-intersection markers. */
  code: string;
  topY: number;
  bottomY: number;
  color: number;
  opacity: number;
  /** Vertical noise amplitude applied to the layer's top surface. */
  waviness: number;
  /** 0 = fully random/irregular node placement, 1 = fully lattice-snapped —
   * drives the Plexus network's "denser/structured in bedrock, open/
   * irregular in upper soil" requirement. */
  structure: number;
  /** Base Plexus node count at density scale 1 (desktop). */
  nodeCount: number;
}

/** Top to bottom. Depths, colours and waviness/structure all decrease or
 * increase monotonically with depth by design — the geometry itself reads
 * as "settling into order" the deeper it goes, not just the Plexus overlay. */
export const LAYERS: LayerDef[] = [
  { name: "Fill / Loose Soil", code: "FILL", topY: SURFACE_Y, bottomY: 0.0, color: 0xcdb999, opacity: 0.48, waviness: 0.22, structure: 0.08, nodeCount: 26 },
  { name: "Sand", code: "SAND", topY: 0.0, bottomY: -1.6, color: 0xe0c978, opacity: 0.5, waviness: 0.18, structure: 0.15, nodeCount: 34 },
  { name: "Clay", code: "CLAY", topY: -1.6, bottomY: -3.3, color: 0xb97a50, opacity: 0.56, waviness: 0.14, structure: 0.28, nodeCount: 42 },
  { name: "Dense Soil", code: "DENS", topY: -3.3, bottomY: -5.1, color: 0x8a6448, opacity: 0.6, waviness: 0.11, structure: 0.45, nodeCount: 50 },
  { name: "Weathered Rock", code: "WROK", topY: -5.1, bottomY: -7.1, color: 0x8d8d92, opacity: 0.66, waviness: 0.08, structure: 0.68, nodeCount: 62 },
  { name: "Bedrock", code: "BROK", topY: -7.1, bottomY: BEDROCK_BOTTOM_Y, color: 0x4c4c56, opacity: 0.82, waviness: 0.05, structure: 0.92, nodeCount: 78 },
];

export type DisposeFn = () => void;
