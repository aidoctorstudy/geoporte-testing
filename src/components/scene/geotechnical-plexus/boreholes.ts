/**
 * Boreholes — five thin vertical core lines (BH-01..BH-05), each carrying a
 * ring marker at every geological boundary it passes through and a small
 * billboard label above the surface. Positions and target depths are fixed,
 * hand-placed constants (not random) so the layout is stable across
 * renders/reloads and reads as a deliberate site-investigation grid rather
 * than scattered noise.
 */
import * as THREE from "three";
import { SURFACE_Y, type DisposeFn } from "./constants";
import type { LayerHandle } from "./geological-layers";

export interface BoreholesHandle {
  group: THREE.Group;
  /** Raycast targets, tagged via `userData.boreholeIndex` — the orchestrator
   * raycasts against these for hover, then calls `setHover`. */
  interactiveObjects: THREE.Object3D[];
  setHover: (index: number, amount: number) => void;
  dispose: DisposeFn;
}

interface BoreholeDef {
  code: string;
  x: number;
  z: number;
  depth: number;
}

const BOREHOLE_DEFS: BoreholeDef[] = [
  { code: "BH-01", x: -4.2, z: -2.6, depth: -8.6 },
  { code: "BH-02", x: -1.4, z: 2.9, depth: -9.0 },
  { code: "BH-03", x: 1.9, z: -3.1, depth: -8.3 },
  { code: "BH-04", x: 4.1, z: 1.3, depth: -9.2 },
  { code: "BH-05", x: 0.4, z: 3.5, depth: -8.8 },
];

/** Numeric mirror of --raw-color-engineering-ink / --raw-color-engineering-accent. */
const CYLINDER_COLOR = 0x33404f;
const MARKER_COLOR = 0x2b6e8f;
const LABEL_INK = "#1c1e22";

const makeLabelSprite = (
  text: string,
): { sprite: THREE.Sprite; texture: THREE.CanvasTexture; material: THREE.SpriteMaterial } => {
  const canvas = document.createElement("canvas");
  canvas.width = 160;
  canvas.height = 56;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.font = "600 30px system-ui, sans-serif";
    ctx.fillStyle = LABEL_INK;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);
  }
  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(0.85, 0.3, 1);
  return { sprite, texture, material };
};

export const buildBoreholes = (layers: LayerHandle[]): BoreholesHandle => {
  const group = new THREE.Group();
  const interactiveObjects: THREE.Object3D[] = [];
  const cylinderMaterials: THREE.MeshStandardMaterial[] = [];
  const disposables: DisposeFn[] = [];

  const markerGeometry = new THREE.TorusGeometry(0.075, 0.01, 6, 14);
  disposables.push(() => markerGeometry.dispose());

  BOREHOLE_DEFS.forEach((def, index) => {
    const length = SURFACE_Y - def.depth;
    const geometry = new THREE.CylinderGeometry(0.035, 0.035, length, 8);
    const material = new THREE.MeshStandardMaterial({
      color: CYLINDER_COLOR,
      roughness: 0.5,
      metalness: 0.2,
      emissive: new THREE.Color(CYLINDER_COLOR),
      emissiveIntensity: 0,
    });
    const cylinder = new THREE.Mesh(geometry, material);
    cylinder.position.set(def.x, SURFACE_Y - length / 2, def.z);
    cylinder.userData.boreholeIndex = index;
    group.add(cylinder);
    interactiveObjects.push(cylinder);
    cylinderMaterials.push(material);
    disposables.push(() => {
      geometry.dispose();
      material.dispose();
    });

    layers.forEach((layer) => {
      if (layer.def.topY > SURFACE_Y || layer.def.topY < def.depth) return;
      const markerMaterial = new THREE.MeshStandardMaterial({ color: MARKER_COLOR, roughness: 0.4 });
      const marker = new THREE.Mesh(markerGeometry, markerMaterial);
      marker.rotation.x = Math.PI / 2;
      marker.position.set(def.x, layer.def.topY, def.z);
      group.add(marker);
      disposables.push(() => markerMaterial.dispose());
    });

    const { sprite, texture, material: spriteMaterial } = makeLabelSprite(def.code);
    sprite.position.set(def.x, SURFACE_Y + 0.35, def.z);
    group.add(sprite);
    disposables.push(() => {
      texture.dispose();
      spriteMaterial.dispose();
    });
  });

  const setHover = (index: number, amount: number) => {
    const material = cylinderMaterials[index];
    if (material) material.emissiveIntensity = amount * 0.6;
  };

  return {
    group,
    interactiveObjects,
    setHover,
    dispose: () => disposables.forEach((dispose) => dispose()),
  };
};
