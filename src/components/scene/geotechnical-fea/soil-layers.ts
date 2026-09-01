/**
 * Stratigraphy colour sampling + the faint horizontal boundary lines drawn
 * across the block's cut walls at every layer boundary — the brief's own
 * "Add faint contour or mesh lines over some surfaces" line for the soil
 * layers specifically (the denser FE mesh network is the separate, bigger
 * `finite-element-mesh.ts`).
 *
 * The six strata are not built as six separate volumetric solids here
 * (contrast `geotechnical-plexus/geological-layers.ts`, which does exactly
 * that for a different scene) — `ground-model.ts` builds ONE continuous
 * soil mass whose vertices are coloured by depth via `stratumColorAt`
 * below, which reads as hard geological bands on every cut face (the
 * ground surface's excavation cavity walls, and the two static outer
 * cutaway walls) without needing six separate meshes stitched together
 * around a dynamically-changing excavation cavity. A deliberate geometric
 * simplification of "six visibly separated layers", not a scope cut — see
 * ADR-0061.
 */
import * as THREE from "three";
import { BEDROCK_BOTTOM_Y, BLOCK_HALF_DEPTH, BLOCK_HALF_WIDTH, STRATA, SURFACE_Y, type DisposeFn } from "./constants";

const scratchColor = new THREE.Color();

/** Which stratum a given world-space Y falls in (last entry if below the
 * deepest boundary, matching bedrock extending indefinitely downward). */
export const stratumAt = (y: number) => {
  for (const stratum of STRATA) {
    if (y <= stratum.topY && y > stratum.bottomY) return stratum;
  }
  return STRATA[STRATA.length - 1];
};

/** Hard-banded stratigraphy colour at a given depth — real geological
 * cross-sections show bands, not a smooth gradient, so this is
 * deliberately not interpolated between adjacent strata. */
export const stratumColorAt = (y: number, out: THREE.Color): THREE.Color => out.setHex(stratumAt(y).color);

export const STRATUM_COLOR_SCRATCH = scratchColor;

export interface SoilBoundaryLinesHandle {
  lines: THREE.LineSegments;
  dispose: DisposeFn;
}

/** Thin horizontal rings at each stratum boundary, drawn around the full
 * block perimeter (visible wherever a cut wall crosses that depth). Purely
 * decorative linework, not part of the FE mesh density system. */
export const buildSoilBoundaryLines = (): SoilBoundaryLinesHandle => {
  const positions: number[] = [];
  const corners: [number, number][] = [
    [-BLOCK_HALF_WIDTH, -BLOCK_HALF_DEPTH],
    [BLOCK_HALF_WIDTH, -BLOCK_HALF_DEPTH],
    [BLOCK_HALF_WIDTH, BLOCK_HALF_DEPTH],
    [-BLOCK_HALF_WIDTH, BLOCK_HALF_DEPTH],
  ];
  const boundaryDepths = [SURFACE_Y, ...STRATA.map((s) => s.bottomY)].filter(
    (y) => y > BEDROCK_BOTTOM_Y + 0.01,
  );
  for (const y of boundaryDepths) {
    for (let i = 0; i < corners.length; i++) {
      const [x0, z0] = corners[i];
      const [x1, z1] = corners[(i + 1) % corners.length];
      positions.push(x0, y, z0, x1, y, z1);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  const material = new THREE.LineBasicMaterial({ color: 0x3a3a42, transparent: true, opacity: 0.22 });
  const lines = new THREE.LineSegments(geometry, material);

  return {
    lines,
    dispose: () => {
      geometry.dispose();
      material.dispose();
    },
  };
};
