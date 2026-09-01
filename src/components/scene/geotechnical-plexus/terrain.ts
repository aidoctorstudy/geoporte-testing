/**
 * Ground surface — a slightly irregular plane capping the block at
 * `SURFACE_Y`, plus a subtle survey-line grid draped over it (thin lines,
 * not a texture) for the "clean engineering-style, minimal" ground-truth
 * marker the brief asks for. Deliberately the least detailed subsystem in
 * this scene — it's a backdrop for the strata below it, not a focal point.
 */
import * as THREE from "three";
import { BLOCK_HALF_DEPTH, BLOCK_HALF_WIDTH, SURFACE_Y, signedNoise, type DisposeFn } from "./constants";

export interface TerrainHandle {
  group: THREE.Group;
  dispose: DisposeFn;
}

const TERRAIN_SEG_X = 28;
const TERRAIN_SEG_Z = 20;
const TERRAIN_WAVINESS = 0.16;
/** Numeric mirror of --raw-color-engineering-accent (globals.css). */
const SURVEY_LINE_COLOR = 0x2b6e8f;

const terrainHeightAt = (x: number, z: number): number =>
  SURFACE_Y + signedNoise(x, z, 0) * TERRAIN_WAVINESS;

export const buildTerrain = (): TerrainHandle => {
  const width = BLOCK_HALF_WIDTH * 2;
  const depth = BLOCK_HALF_DEPTH * 2;

  const geometry = new THREE.PlaneGeometry(width, depth, TERRAIN_SEG_X, TERRAIN_SEG_Z);
  geometry.rotateX(-Math.PI / 2);
  const pos = geometry.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    pos.setY(i, terrainHeightAt(pos.getX(i), pos.getZ(i)));
  }
  pos.needsUpdate = true;
  geometry.computeVertexNormals();

  const material = new THREE.MeshStandardMaterial({
    color: 0xded8c6,
    roughness: 0.95,
    metalness: 0,
    transparent: true,
    opacity: 0.92,
  });
  const mesh = new THREE.Mesh(geometry, material);

  const gridDivsX = 6;
  const gridDivsZ = 4;
  const stepsPerLine = 24;
  const linePositions: number[] = [];
  for (let i = 0; i <= gridDivsX; i++) {
    const x = -BLOCK_HALF_WIDTH + (width * i) / gridDivsX;
    for (let s = 0; s < stepsPerLine; s++) {
      const z0 = -BLOCK_HALF_DEPTH + (depth * s) / stepsPerLine;
      const z1 = -BLOCK_HALF_DEPTH + (depth * (s + 1)) / stepsPerLine;
      linePositions.push(x, terrainHeightAt(x, z0) + 0.015, z0, x, terrainHeightAt(x, z1) + 0.015, z1);
    }
  }
  for (let j = 0; j <= gridDivsZ; j++) {
    const z = -BLOCK_HALF_DEPTH + (depth * j) / gridDivsZ;
    for (let s = 0; s < stepsPerLine; s++) {
      const x0 = -BLOCK_HALF_WIDTH + (width * s) / stepsPerLine;
      const x1 = -BLOCK_HALF_WIDTH + (width * (s + 1)) / stepsPerLine;
      linePositions.push(x0, terrainHeightAt(x0, z) + 0.015, z, x1, terrainHeightAt(x1, z) + 0.015, z);
    }
  }
  const gridGeometry = new THREE.BufferGeometry();
  gridGeometry.setAttribute("position", new THREE.Float32BufferAttribute(linePositions, 3));
  const gridMaterial = new THREE.LineBasicMaterial({
    color: SURVEY_LINE_COLOR,
    transparent: true,
    opacity: 0.2,
  });
  const gridLines = new THREE.LineSegments(gridGeometry, gridMaterial);

  const group = new THREE.Group();
  group.add(mesh, gridLines);

  return {
    group,
    dispose: () => {
      geometry.dispose();
      material.dispose();
      gridGeometry.dispose();
      gridMaterial.dispose();
    },
  };
};
