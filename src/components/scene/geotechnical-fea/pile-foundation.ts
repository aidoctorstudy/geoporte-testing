/**
 * Pile foundation — a slab with a 3×3 instanced pile grid reaching into
 * Weathered Rock, on the opposite side of the block from the excavation.
 * Revealed at the "Foundation Installation" construction stage.
 */
import * as THREE from "three";
import {
  FOUNDATION_CENTER,
  FOUNDATION_SLAB_SIZE,
  FOUNDATION_SLAB_THICKNESS,
  PILE_GRID,
  PILE_TIP_Y,
  SURFACE_Y,
  type DisposeFn,
} from "./constants";

const SLAB_COLOR = 0xd7d3c6;
const PILE_COLOR = 0xb7b0a0;

export interface PileFoundationHandle {
  group: THREE.Group;
  interactiveObjects: THREE.Object3D[];
  setReveal: (amount: number) => void;
  setHover: (amount: number) => void;
  dispose: DisposeFn;
}

export const buildPileFoundation = (): PileFoundationHandle => {
  const group = new THREE.Group();

  const slabGeometry = new THREE.BoxGeometry(FOUNDATION_SLAB_SIZE, FOUNDATION_SLAB_THICKNESS, FOUNDATION_SLAB_SIZE);
  const slabMaterial = new THREE.MeshStandardMaterial({
    color: SLAB_COLOR,
    roughness: 0.72,
    metalness: 0.05,
    transparent: true,
    opacity: 0,
    emissive: new THREE.Color(0xffffff),
    emissiveIntensity: 0,
  });
  const slab = new THREE.Mesh(slabGeometry, slabMaterial);
  slab.position.set(FOUNDATION_CENTER.x, SURFACE_Y - FOUNDATION_SLAB_THICKNESS / 2, FOUNDATION_CENTER.z);
  slab.userData.tooltip = "Deep Foundation";
  group.add(slab);

  const slabBottomY = SURFACE_Y - FOUNDATION_SLAB_THICKNESS;
  const pileLength = slabBottomY - PILE_TIP_Y;
  const pileGeometry = new THREE.CylinderGeometry(0.055, 0.055, pileLength, 8);
  pileGeometry.translate(0, -pileLength / 2, 0);
  const pileMaterial = new THREE.MeshStandardMaterial({
    color: PILE_COLOR,
    roughness: 0.6,
    metalness: 0.15,
    transparent: true,
    opacity: 0,
  });
  const pileCount = PILE_GRID * PILE_GRID;
  const piles = new THREE.InstancedMesh(pileGeometry, pileMaterial, pileCount);
  piles.userData.tooltip = "Deep Foundation";

  const spacing = FOUNDATION_SLAB_SIZE * 0.62;
  const scratchMatrix = new THREE.Matrix4();
  let instanceIndex = 0;
  for (let gx = 0; gx < PILE_GRID; gx++) {
    for (let gz = 0; gz < PILE_GRID; gz++) {
      const x = FOUNDATION_CENTER.x + (gx - (PILE_GRID - 1) / 2) * (spacing / (PILE_GRID - 1));
      const z = FOUNDATION_CENTER.z + (gz - (PILE_GRID - 1) / 2) * (spacing / (PILE_GRID - 1));
      scratchMatrix.makeTranslation(x, slabBottomY, z);
      piles.setMatrixAt(instanceIndex, scratchMatrix);
      instanceIndex++;
    }
  }
  piles.instanceMatrix.needsUpdate = true;
  group.add(piles);

  const setReveal = (amount: number) => {
    const a = THREE.MathUtils.clamp(amount, 0, 1);
    slabMaterial.opacity = a * 0.96;
    pileMaterial.opacity = a * 0.9;
  };
  const setHover = (amount: number) => {
    slabMaterial.emissiveIntensity = amount * 0.3;
  };
  setReveal(0);

  return {
    group,
    interactiveObjects: [slab, piles],
    setReveal,
    setHover,
    dispose: () => {
      slabGeometry.dispose();
      slabMaterial.dispose();
      pileGeometry.dispose();
      pileMaterial.dispose();
    },
  };
};
