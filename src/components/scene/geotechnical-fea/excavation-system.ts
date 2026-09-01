/**
 * Excavation retaining system — four retaining-wall panels around the
 * excavation perimeter (deformable: bow inward as excavation deepens,
 * contour-mappable) plus two levels of bracing struts (static, revealed
 * per construction stage and struck out again once the foundation is in,
 * matching real temporary-works sequencing).
 */
import * as THREE from "three";
import {
  EXCAVATION_BOUNDS,
  EXCAVATION_LEVEL_2_Y,
  RETAINING_WALL_TOE_Y,
  STRUT_LEVELS_Y,
  SURFACE_Y,
  type DisposeFn,
  type ResultMode,
} from "./constants";
import { computeWallBowOffset } from "./deformation";
import { computeWallResultScalar, writeContourColor } from "./analysis-contours";

const WALL_COLOR = 0x9a9a9e;
const STRUT_COLOR = 0x7a7a80;

interface WallSpec {
  side: "north" | "south" | "east" | "west";
  fixedAxis: "x" | "z";
  fixedValue: number;
  spanFrom: number;
  spanTo: number;
  inward: THREE.Vector2;
}

const WALL_SPECS: WallSpec[] = [
  { side: "north", fixedAxis: "z", fixedValue: EXCAVATION_BOUNDS.z1, spanFrom: EXCAVATION_BOUNDS.x0, spanTo: EXCAVATION_BOUNDS.x1, inward: new THREE.Vector2(0, -1) },
  { side: "south", fixedAxis: "z", fixedValue: EXCAVATION_BOUNDS.z0, spanFrom: EXCAVATION_BOUNDS.x0, spanTo: EXCAVATION_BOUNDS.x1, inward: new THREE.Vector2(0, 1) },
  { side: "east", fixedAxis: "x", fixedValue: EXCAVATION_BOUNDS.x1, spanFrom: EXCAVATION_BOUNDS.z0, spanTo: EXCAVATION_BOUNDS.z1, inward: new THREE.Vector2(-1, 0) },
  { side: "west", fixedAxis: "x", fixedValue: EXCAVATION_BOUNDS.x0, spanFrom: EXCAVATION_BOUNDS.z0, spanTo: EXCAVATION_BOUNDS.z1, inward: new THREE.Vector2(1, 0) },
];

const SPAN_DIV = 8;
const DEPTH_DIV = 16;

interface WallPanel {
  spec: WallSpec;
  mesh: THREE.Mesh;
  geometry: THREE.BufferGeometry;
  material: THREE.MeshStandardMaterial;
  positionAttr: THREE.BufferAttribute;
  colorAttr: THREE.BufferAttribute;
}

const buildWallPanel = (spec: WallSpec): WallPanel => {
  const spanCount = SPAN_DIV + 1;
  const depthCount = DEPTH_DIV + 1;
  const positions = new Float32Array(spanCount * depthCount * 3);
  const colors = new Float32Array(spanCount * depthCount * 3);
  const indices: number[] = [];

  for (let vi = 0; vi < depthCount; vi++) {
    const t = vi / DEPTH_DIV;
    const y = THREE.MathUtils.lerp(SURFACE_Y, RETAINING_WALL_TOE_Y, t);
    for (let hi = 0; hi < spanCount; hi++) {
      const s = spec.spanFrom + ((spec.spanTo - spec.spanFrom) * hi) / SPAN_DIV;
      const x = spec.fixedAxis === "x" ? spec.fixedValue : s;
      const z = spec.fixedAxis === "z" ? spec.fixedValue : s;
      const idx = vi * spanCount + hi;
      positions[idx * 3] = x;
      positions[idx * 3 + 1] = y;
      positions[idx * 3 + 2] = z;
      const c = new THREE.Color(WALL_COLOR);
      colors[idx * 3] = c.r;
      colors[idx * 3 + 1] = c.g;
      colors[idx * 3 + 2] = c.b;
    }
  }
  for (let vi = 0; vi < DEPTH_DIV; vi++) {
    for (let hi = 0; hi < SPAN_DIV; hi++) {
      const a = vi * spanCount + hi;
      const b = a + 1;
      const c = a + spanCount;
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }

  const geometry = new THREE.BufferGeometry();
  const positionAttr = new THREE.Float32BufferAttribute(positions, 3);
  const colorAttr = new THREE.Float32BufferAttribute(colors, 3);
  geometry.setAttribute("position", positionAttr);
  geometry.setAttribute("color", colorAttr);
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  const material = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.55,
    metalness: 0.25,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0,
    emissive: new THREE.Color(0xffffff),
    emissiveIntensity: 0,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.userData.tooltip = "Retaining System";

  return { spec, mesh, geometry, material, positionAttr: positionAttr as THREE.BufferAttribute, colorAttr: colorAttr as THREE.BufferAttribute };
};

export interface ExcavationSystemHandle {
  group: THREE.Group;
  interactiveObjects: THREE.Object3D[];
  update: (
    excavationY: number,
    deformAmount: number,
    wallsRevealed: number,
    strutsRevealed: readonly [number, number],
    resultMode: ResultMode,
    contourBlend: number,
  ) => void;
  setHover: (amount: number) => void;
  dispose: DisposeFn;
}

export const buildExcavationSystem = (): ExcavationSystemHandle => {
  const group = new THREE.Group();
  const panels = WALL_SPECS.map(buildWallPanel);
  panels.forEach((p) => group.add(p.mesh));

  const strutMaterial = new THREE.MeshStandardMaterial({ color: STRUT_COLOR, roughness: 0.4, metalness: 0.4, transparent: true, opacity: 0 });
  const strutGroup = new THREE.Group();
  const struts: THREE.Mesh[] = [];
  const excavationWidth = EXCAVATION_BOUNDS.x1 - EXCAVATION_BOUNDS.x0;
  const excavationDepth = EXCAVATION_BOUNDS.z1 - EXCAVATION_BOUNDS.z0;
  const strutSize = 0.18;
  STRUT_LEVELS_Y.forEach((y) => {
    const beamX = new THREE.Mesh(new THREE.BoxGeometry(excavationWidth, strutSize, strutSize), strutMaterial);
    beamX.position.set((EXCAVATION_BOUNDS.x0 + EXCAVATION_BOUNDS.x1) / 2, y, 0);
    const beamZ = new THREE.Mesh(new THREE.BoxGeometry(strutSize, strutSize, excavationDepth), strutMaterial);
    beamZ.position.set((EXCAVATION_BOUNDS.x0 + EXCAVATION_BOUNDS.x1) / 2, y, 0);
    strutGroup.add(beamX, beamZ);
    struts.push(beamX, beamZ);
  });
  group.add(strutGroup);

  const scratch2 = new THREE.Vector2();
  const baseColor = new THREE.Color();
  const contourColor = new THREE.Color();

  const update = (
    excavationY: number,
    deformAmount: number,
    wallsRevealed: number,
    strutsRevealed: readonly [number, number],
    resultMode: ResultMode,
    contourBlend: number,
  ) => {
    const excavationFraction = THREE.MathUtils.clamp((SURFACE_Y - excavationY) / (SURFACE_Y - EXCAVATION_LEVEL_2_Y), 0, 1);
    const wallOpacity = THREE.MathUtils.clamp(wallsRevealed, 0, 1) * 0.95;

    for (const panel of panels) {
      panel.material.opacity = wallOpacity;
      for (let vi = 0; vi < DEPTH_DIV + 1; vi++) {
        const t = vi / DEPTH_DIV;
        for (let hi = 0; hi < SPAN_DIV + 1; hi++) {
          const idx = vi * (SPAN_DIV + 1) + hi;
          const s = panel.spec.spanFrom + ((panel.spec.spanTo - panel.spec.spanFrom) * hi) / SPAN_DIV;
          const baseX = panel.spec.fixedAxis === "x" ? panel.spec.fixedValue : s;
          const baseZ = panel.spec.fixedAxis === "z" ? panel.spec.fixedValue : s;
          const bow = computeWallBowOffset(t, excavationFraction, deformAmount, panel.spec.inward, scratch2);
          panel.positionAttr.setX(idx, baseX + bow.x);
          panel.positionAttr.setZ(idx, baseZ + bow.y);

          baseColor.setHex(WALL_COLOR);
          if (resultMode !== "none" && contourBlend > 0.001) {
            const scalar = computeWallResultScalar(resultMode, t, excavationFraction, deformAmount);
            writeContourColor(scalar, contourColor);
            baseColor.lerp(contourColor, contourBlend);
          }
          panel.colorAttr.setXYZ(idx, baseColor.r, baseColor.g, baseColor.b);
        }
      }
      panel.positionAttr.needsUpdate = true;
      panel.colorAttr.needsUpdate = true;
      panel.geometry.computeVertexNormals();
    }

    strutMaterial.opacity =
      Math.max(strutsRevealed[0], strutsRevealed[1]) > 0
        ? THREE.MathUtils.clamp(Math.max(strutsRevealed[0], strutsRevealed[1]), 0, 1) * 0.9
        : 0;
    struts[0].visible = struts[1].visible = strutsRevealed[0] > 0.02;
    struts[2].visible = struts[3].visible = strutsRevealed[1] > 0.02;
  };

  const setHover = (amount: number) => {
    for (const panel of panels) panel.material.emissiveIntensity = amount * 0.3;
  };

  update(SURFACE_Y, 0, 0, [0, 0], "none", 0);

  return {
    group,
    interactiveObjects: panels.map((p) => p.mesh),
    update,
    setHover,
    dispose: () => {
      panels.forEach((p) => {
        p.geometry.dispose();
        p.material.dispose();
      });
      struts.forEach((s) => s.geometry.dispose());
      strutMaterial.dispose();
    },
  };
};
