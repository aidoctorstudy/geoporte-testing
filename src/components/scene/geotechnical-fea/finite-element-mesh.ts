/**
 * The visible 3D finite-element mesh — the brief's central visual element.
 * A layered network of horizontal + vertical wireframe grid sheets through
 * the soil mass: a coarse base grid everywhere, plus finer grids clipped to
 * the "critical zone" rectangles from `constants.ts` (around the
 * excavation, the tunnel, the pile group), reading as adaptive mesh density
 * — denser near structural elements, coarser away from them — without
 * needing a real tetrahedral mesh generator.
 *
 * Static: built once from fixed constants, never rebuilt per frame. Lines
 * are omitted wherever they'd fall inside the excavation's XZ footprint
 * above the final formation level (`EXCAVATION_LEVEL_2_Y`) — that volume
 * reads as "the excavation zone" throughout every construction stage
 * (including before the dig starts) rather than the mesh dynamically
 * appearing/disappearing there, a deliberate simplification kept for a
 * single static `BufferGeometry`/one draw call. See ADR-0061.
 */
import * as THREE from "three";
import {
  BLOCK_HALF_DEPTH,
  BLOCK_HALF_WIDTH,
  EXCAVATION_BOUNDS,
  EXCAVATION_LEVEL_2_Y,
  MESH_BASE_DIV_X,
  MESH_BASE_DIV_Z,
  MESH_DENSE_ZONES,
  MESH_HORIZONTAL_DEPTHS_Y,
  MESH_VERTICAL_PLANES_Z,
  SURFACE_Y,
  BEDROCK_BOTTOM_Y,
  type DisposeFn,
} from "./constants";

export interface FiniteElementMeshHandle {
  lines: THREE.LineSegments;
  setVisibility: (amount: number) => void;
  dispose: DisposeFn;
}

const insideExcavationFootprint = (x: number, z: number): boolean =>
  x > EXCAVATION_BOUNDS.x0 && x < EXCAVATION_BOUNDS.x1 && z > EXCAVATION_BOUNDS.z0 && z < EXCAVATION_BOUNDS.z1;

/** Adds a 2D grid of lines (both axes) at a fixed Y, across `bounds`, at
 * `divX`×`divZ` resolution — clipped so nothing is drawn inside the
 * excavation footprint if `clipExcavation` and this sheet is shallower than
 * the final formation level. */
const addHorizontalSheet = (
  positions: number[],
  y: number,
  bounds: { x0: number; x1: number; z0: number; z1: number },
  divX: number,
  divZ: number,
  clipExcavation: boolean,
) => {
  const skip = (x: number, z: number) => clipExcavation && y > EXCAVATION_LEVEL_2_Y && insideExcavationFootprint(x, z);
  for (let i = 0; i <= divX; i++) {
    const x = bounds.x0 + ((bounds.x1 - bounds.x0) * i) / divX;
    for (let s = 0; s < divZ; s++) {
      const z0 = bounds.z0 + ((bounds.z1 - bounds.z0) * s) / divZ;
      const z1 = bounds.z0 + ((bounds.z1 - bounds.z0) * (s + 1)) / divZ;
      if (skip(x, z0) && skip(x, z1)) continue;
      positions.push(x, y, z0, x, y, z1);
    }
  }
  for (let j = 0; j <= divZ; j++) {
    const z = bounds.z0 + ((bounds.z1 - bounds.z0) * j) / divZ;
    for (let s = 0; s < divX; s++) {
      const x0 = bounds.x0 + ((bounds.x1 - bounds.x0) * s) / divX;
      const x1 = bounds.x0 + ((bounds.x1 - bounds.x0) * (s + 1)) / divX;
      if (skip(x0, z) && skip(x1, z)) continue;
      positions.push(x0, y, z, x1, y, z);
    }
  }
};

/** Vertical sheet at a fixed Z, spanning the full soil depth, same
 * base+dense-zone density treatment applied along X and Y. */
const addVerticalSheet = (positions: number[], z: number, divX: number, divY: number) => {
  const y0 = BEDROCK_BOTTOM_Y;
  const y1 = SURFACE_Y;
  for (let i = 0; i <= divX; i++) {
    const x = -BLOCK_HALF_WIDTH + (BLOCK_HALF_WIDTH * 2 * i) / divX;
    for (let s = 0; s < divY; s++) {
      const ya = y0 + ((y1 - y0) * s) / divY;
      const yb = y0 + ((y1 - y0) * (s + 1)) / divY;
      if (ya > EXCAVATION_LEVEL_2_Y && insideExcavationFootprint(x, z)) continue;
      positions.push(x, ya, z, x, yb, z);
    }
  }
  for (let j = 0; j <= divY; j++) {
    const y = y0 + ((y1 - y0) * j) / divY;
    for (let s = 0; s < divX; s++) {
      const xa = -BLOCK_HALF_WIDTH + (BLOCK_HALF_WIDTH * 2 * s) / divX;
      const xb = -BLOCK_HALF_WIDTH + (BLOCK_HALF_WIDTH * 2 * (s + 1)) / divX;
      if (y > EXCAVATION_LEVEL_2_Y && insideExcavationFootprint(xa, z) && insideExcavationFootprint(xb, z)) continue;
      positions.push(xa, y, z, xb, y, z);
    }
  }
};

export const buildFiniteElementMesh = (densityScale: number): FiniteElementMeshHandle => {
  const positions: number[] = [];
  const fullBounds = { x0: -BLOCK_HALF_WIDTH, x1: BLOCK_HALF_WIDTH, z0: -BLOCK_HALF_DEPTH, z1: BLOCK_HALF_DEPTH };
  const scaleDiv = (n: number) => Math.max(2, Math.round(n * densityScale));

  for (const y of MESH_HORIZONTAL_DEPTHS_Y) {
    addHorizontalSheet(positions, y, fullBounds, scaleDiv(MESH_BASE_DIV_X), scaleDiv(MESH_BASE_DIV_Z), true);
    for (const zone of MESH_DENSE_ZONES) {
      addHorizontalSheet(
        positions,
        y,
        zone,
        scaleDiv(zone.divX),
        scaleDiv(zone.divZ),
        true,
      );
    }
  }

  for (const z of MESH_VERTICAL_PLANES_Z) {
    addVerticalSheet(positions, z, scaleDiv(MESH_BASE_DIV_X), scaleDiv(10));
  }
  // Denser vertical resolution directly through the excavation/tunnel
  // cross-section (z=0) — the "hero" cut plane.
  addVerticalSheet(positions, 0.02, scaleDiv(24), scaleDiv(16));

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  const material = new THREE.LineBasicMaterial({ color: 0x4a5568, transparent: true, opacity: 0.24 });
  const lines = new THREE.LineSegments(geometry, material);

  return {
    lines,
    setVisibility: (amount: number) => {
      material.opacity = THREE.MathUtils.lerp(0.1, 0.32, THREE.MathUtils.clamp(amount, 0, 1));
    },
    dispose: () => {
      geometry.dispose();
      material.dispose();
    },
  };
};
