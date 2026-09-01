/**
 * Foundation system — a slab at the surface with a 3×3 instanced pile grid
 * reaching down into Weathered Rock, plus a small emissive marker at every
 * pile tip so the "pile-tip/deep-ground interaction" the brief calls out
 * reads clearly, especially once the borehole/foundation scroll stage
 * brightens it.
 */
import * as THREE from "three";
import { SURFACE_Y, type DisposeFn } from "./constants";

export interface FoundationHandle {
  group: THREE.Group;
  /** Raycast target for hover — just the slab; the instanced pile grid is
   * cheap to render but awkward to raycast per-instance, and the slab's
   * footprint already covers the pile grid from above. */
  interactiveObjects: THREE.Object3D[];
  setHover: (amount: number) => void;
  dispose: DisposeFn;
}

const SLAB_SIZE = 3.2;
const SLAB_THICKNESS = 0.28;
const PILE_TIP_Y = -5.4;
const PILE_GRID = 3;
const PILE_RADIUS = 0.05;
/** Numeric mirrors: concrete-grey stays neutral (not a token colour — this
 * is a literal material read, like the strata palette), tip accent mirrors
 * --raw-color-engineering-accent (globals.css). */
const SLAB_COLOR = 0xd9d5c8;
const PILE_COLOR = 0xb9b3a0;
const TIP_COLOR = 0x2b6e8f;

export const buildFoundationSystem = (): FoundationHandle => {
  const group = new THREE.Group();

  const slabGeometry = new THREE.BoxGeometry(SLAB_SIZE, SLAB_THICKNESS, SLAB_SIZE);
  const slabMaterial = new THREE.MeshStandardMaterial({
    color: SLAB_COLOR,
    roughness: 0.75,
    metalness: 0.05,
    emissive: new THREE.Color(SLAB_COLOR),
    emissiveIntensity: 0,
  });
  const slab = new THREE.Mesh(slabGeometry, slabMaterial);
  slab.position.set(0, SURFACE_Y - SLAB_THICKNESS / 2, 0);
  group.add(slab);

  const slabBottomY = SURFACE_Y - SLAB_THICKNESS;
  const pileLength = slabBottomY - PILE_TIP_Y;
  const pileGeometry = new THREE.CylinderGeometry(PILE_RADIUS, PILE_RADIUS, pileLength, 8);
  // Pivot at the pile's own top so instances can be placed by their top point.
  pileGeometry.translate(0, -pileLength / 2, 0);
  const pileMaterial = new THREE.MeshStandardMaterial({
    color: PILE_COLOR,
    roughness: 0.6,
    metalness: 0.15,
    emissive: new THREE.Color(PILE_COLOR),
    emissiveIntensity: 0,
  });
  const pileCount = PILE_GRID * PILE_GRID;
  const piles = new THREE.InstancedMesh(pileGeometry, pileMaterial, pileCount);

  const tipGeometry = new THREE.SphereGeometry(0.07, 8, 8);
  const tipMaterial = new THREE.MeshStandardMaterial({
    color: TIP_COLOR,
    emissive: new THREE.Color(TIP_COLOR),
    emissiveIntensity: 0.15,
    roughness: 0.3,
  });
  const tips = new THREE.InstancedMesh(tipGeometry, tipMaterial, pileCount);

  const spacing = SLAB_SIZE * 0.62;
  const scratchMatrix = new THREE.Matrix4();
  let instanceIndex = 0;
  for (let gx = 0; gx < PILE_GRID; gx++) {
    for (let gz = 0; gz < PILE_GRID; gz++) {
      const x = (gx - (PILE_GRID - 1) / 2) * (spacing / (PILE_GRID - 1));
      const z = (gz - (PILE_GRID - 1) / 2) * (spacing / (PILE_GRID - 1));
      scratchMatrix.makeTranslation(x, slabBottomY, z);
      piles.setMatrixAt(instanceIndex, scratchMatrix);
      scratchMatrix.makeTranslation(x, PILE_TIP_Y, z);
      tips.setMatrixAt(instanceIndex, scratchMatrix);
      instanceIndex++;
    }
  }
  piles.instanceMatrix.needsUpdate = true;
  tips.instanceMatrix.needsUpdate = true;
  group.add(piles, tips);

  const setHover = (amount: number) => {
    const a = THREE.MathUtils.clamp(amount, 0, 1);
    slabMaterial.emissiveIntensity = a * 0.25;
    pileMaterial.emissiveIntensity = a * 0.3;
    tipMaterial.emissiveIntensity = 0.15 + a * 0.55;
  };

  return {
    group,
    interactiveObjects: [slab],
    setHover,
    dispose: () => {
      slabGeometry.dispose();
      slabMaterial.dispose();
      pileGeometry.dispose();
      pileMaterial.dispose();
      tipGeometry.dispose();
      tipMaterial.dispose();
    },
  };
};
