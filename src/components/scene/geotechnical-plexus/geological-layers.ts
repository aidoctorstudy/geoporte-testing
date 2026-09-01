/**
 * The six geological strata — Fill, Sand, Clay, Dense Soil, Weathered Rock,
 * Bedrock. Each layer is a real volumetric slab (a wavy top surface + a
 * calmer wavy bottom surface + four side walls), not a flat plane, so the
 * "not perfectly flat, natural variation" requirement holds up from every
 * angle, including once the exploded scroll stage pulls layers apart.
 *
 * Each slab is one `BufferGeometry`/one draw call — `side: DoubleSide`
 * rather than hand-verifying every wall strip's winding order, since a
 * translucent slab is seen from both inside and outside as the camera
 * orbits slightly and during the exploded stage.
 */
import * as THREE from "three";
import { BLOCK_HALF_DEPTH, BLOCK_HALF_WIDTH, LAYERS, signedNoise, type DisposeFn, type LayerDef } from "./constants";

export interface LayerHandle {
  index: number;
  def: LayerDef;
  /** Wraps the slab mesh — position.y is the explode offset, driven by the
   * scroll controller in the orchestrator (this module owns geometry only,
   * not the choreography). */
  group: THREE.Group;
  mesh: THREE.Mesh;
  /** Nominal (pre-explode) top-surface height at a given X/Z — used by
   * `boreholes.ts` to place strata-intersection markers correctly. */
  topYAt: (x: number, z: number) => number;
  setHover: (amount: number) => void;
  dispose: DisposeFn;
}

const LAYER_SEG_X = 18;
const LAYER_SEG_Z = 12;

const buildLayerGeometry = (
  def: LayerDef,
  layerIndex: number,
): { geometry: THREE.BufferGeometry; topYAt: (x: number, z: number) => number } => {
  const segX = LAYER_SEG_X;
  const segZ = LAYER_SEG_Z;
  const width = BLOCK_HALF_WIDTH * 2;
  const depth = BLOCK_HALF_DEPTH * 2;
  const nx = segX + 1;
  const nz = segZ + 1;
  const seed = layerIndex * 17.3;

  const topHeightAt = (x: number, z: number) => def.topY + signedNoise(x, z, seed) * def.waviness;
  const bottomHeightAt = (x: number, z: number) =>
    def.bottomY + signedNoise(x, z, seed + 50) * def.waviness * 0.5;

  const gridX = (ix: number) => -BLOCK_HALF_WIDTH + (width * ix) / segX;
  const gridZ = (iz: number) => -BLOCK_HALF_DEPTH + (depth * iz) / segZ;

  const vertPositions: number[] = [];
  for (let iz = 0; iz < nz; iz++)
    for (let ix = 0; ix < nx; ix++) {
      const x = gridX(ix);
      const z = gridZ(iz);
      vertPositions.push(x, topHeightAt(x, z), z);
    }
  const bottomOffset = nx * nz;
  for (let iz = 0; iz < nz; iz++)
    for (let ix = 0; ix < nx; ix++) {
      const x = gridX(ix);
      const z = gridZ(iz);
      vertPositions.push(x, bottomHeightAt(x, z), z);
    }

  const topIndex = (ix: number, iz: number) => iz * nx + ix;
  const bottomIndex = (ix: number, iz: number) => bottomOffset + iz * nx + ix;

  const indices: number[] = [];
  for (let iz = 0; iz < segZ; iz++)
    for (let ix = 0; ix < segX; ix++) {
      const a = topIndex(ix, iz);
      const b = topIndex(ix + 1, iz);
      const c = topIndex(ix, iz + 1);
      const d = topIndex(ix + 1, iz + 1);
      indices.push(a, c, b, b, c, d);
    }
  for (let iz = 0; iz < segZ; iz++)
    for (let ix = 0; ix < segX; ix++) {
      const a = bottomIndex(ix, iz);
      const b = bottomIndex(ix + 1, iz);
      const c = bottomIndex(ix, iz + 1);
      const d = bottomIndex(ix + 1, iz + 1);
      indices.push(a, b, c, b, d, c);
    }

  const addWallStrip = (
    topAt: (i: number) => number,
    bottomAt: (i: number) => number,
    count: number,
  ) => {
    for (let i = 0; i < count - 1; i++) {
      const t0 = topAt(i);
      const t1 = topAt(i + 1);
      const b0 = bottomAt(i);
      const b1 = bottomAt(i + 1);
      indices.push(t0, b0, t1, t1, b0, b1);
    }
  };
  addWallStrip((i) => topIndex(i, 0), (i) => bottomIndex(i, 0), nx);
  addWallStrip((i) => topIndex(i, segZ), (i) => bottomIndex(i, segZ), nx);
  addWallStrip((i) => topIndex(0, i), (i) => bottomIndex(0, i), nz);
  addWallStrip((i) => topIndex(segX, i), (i) => bottomIndex(segX, i), nz);

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertPositions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return { geometry, topYAt: topHeightAt };
};

export const buildGeologicalLayers = (): LayerHandle[] =>
  LAYERS.map((def, index) => {
    const { geometry, topYAt } = buildLayerGeometry(def, index);
    const material = new THREE.MeshStandardMaterial({
      color: def.color,
      transparent: true,
      opacity: def.opacity,
      roughness: 0.85,
      metalness: 0.05,
      side: THREE.DoubleSide,
      emissive: new THREE.Color(def.color),
      emissiveIntensity: 0,
    });
    const mesh = new THREE.Mesh(geometry, material);
    const group = new THREE.Group();
    group.add(mesh);

    return {
      index,
      def,
      group,
      mesh,
      topYAt,
      setHover: (amount: number) => {
        material.emissiveIntensity = amount * 0.35;
        material.opacity = THREE.MathUtils.lerp(def.opacity, Math.min(1, def.opacity + 0.25), amount);
      },
      dispose: () => {
        geometry.dispose();
        material.dispose();
      },
    };
  });
