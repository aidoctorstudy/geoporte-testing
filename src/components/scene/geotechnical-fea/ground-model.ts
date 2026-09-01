/**
 * Ground surface + the two static "cutaway" outer walls — the visible
 * envelope of the soil mass. The ground surface is one continuous height-
 * field grid that dips to the current excavation formation level within
 * the excavation footprint (no separate hole/wall geometry needed — see
 * `soil-layers.ts`'s header for why); vertex-coloured by depth so the
 * excavation cavity reads as cut into the strata. The two outer walls
 * (far X and far Z faces only — the near faces stay open so the camera
 * looks straight into the model, the standard "cutaway diorama"
 * convention) are static, multi-band strata panels.
 */
import * as THREE from "three";
import {
  BLOCK_HALF_DEPTH,
  BLOCK_HALF_WIDTH,
  BEDROCK_BOTTOM_Y,
  EXCAVATION_BOUNDS,
  EXCAVATION_LEVEL_2_Y,
  FOUNDATION_CENTER,
  FOUNDATION_SLAB_SIZE,
  SURFACE_Y,
  type DisposeFn,
} from "./constants";
import { computeSurfaceSettlement } from "./deformation";
import { computeSurfaceResultScalar, writeContourColor } from "./analysis-contours";
import { stratumColorAt } from "./soil-layers";
import type { ResultMode } from "./constants";
import { signedNoise } from "@/lib/scene/value-noise";

const GRID_SEG_X = 48;
const GRID_SEG_Z = 36;
const SURFACE_NOISE_AMPLITUDE = 0.12;

const isInsideExcavation = (x: number, z: number): boolean =>
  x > EXCAVATION_BOUNDS.x0 && x < EXCAVATION_BOUNDS.x1 && z > EXCAVATION_BOUNDS.z0 && z < EXCAVATION_BOUNDS.z1;

export interface GroundModelHandle {
  group: THREE.Group;
  /** Called every frame the excavation depth/deformation/result mode is
   * still transitioning — recomputes the height field + vertex colours. */
  update: (excavationY: number, deformAmount: number, resultMode: ResultMode, contourBlend: number) => void;
  setBuildingReveal: (amount: number) => void;
  /** The ground surface + both cutaway walls — "Soil Stratigraphy" hover
   * target. */
  interactiveObjects: THREE.Object3D[];
  setHover: (amount: number) => void;
  dispose: DisposeFn;
}

export const buildGroundModel = (): GroundModelHandle => {
  const width = BLOCK_HALF_WIDTH * 2;
  const depth = BLOCK_HALF_DEPTH * 2;

  const geometry = new THREE.PlaneGeometry(width, depth, GRID_SEG_X, GRID_SEG_Z);
  geometry.rotateX(-Math.PI / 2);
  const positionAttr = geometry.attributes.position as THREE.BufferAttribute;
  const colorAttr = new THREE.Float32BufferAttribute(new Float32Array(positionAttr.count * 3), 3);
  geometry.setAttribute("color", colorAttr);

  const baseColor = new THREE.Color();
  const contourColor = new THREE.Color();

  const recompute = (
    excavationY: number,
    deformAmount: number,
    resultMode: ResultMode,
    contourBlend: number,
  ) => {
    const excavationFraction = THREE.MathUtils.clamp((SURFACE_Y - excavationY) / (SURFACE_Y - EXCAVATION_LEVEL_2_Y), 0, 1);
    for (let i = 0; i < positionAttr.count; i++) {
      const x = positionAttr.getX(i);
      const z = positionAttr.getZ(i);
      const inside = isInsideExcavation(x, z);
      const baseY = inside ? excavationY : SURFACE_Y + signedNoise(x, z, 0) * SURFACE_NOISE_AMPLITUDE;
      const settlement = inside ? 0 : computeSurfaceSettlement(x, z, excavationFraction, deformAmount);
      positionAttr.setY(i, baseY + settlement);

      stratumColorAt(inside ? excavationY : SURFACE_Y, baseColor);
      if (resultMode !== "none" && contourBlend > 0.001) {
        const scalar = computeSurfaceResultScalar(resultMode, x, z, excavationFraction, deformAmount);
        writeContourColor(scalar, contourColor);
        baseColor.lerp(contourColor, contourBlend);
      }
      colorAttr.setXYZ(i, baseColor.r, baseColor.g, baseColor.b);
    }
    positionAttr.needsUpdate = true;
    colorAttr.needsUpdate = true;
    geometry.computeVertexNormals();
  };

  recompute(SURFACE_Y, 0, "none", 0);

  const material = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.92,
    metalness: 0,
    side: THREE.DoubleSide,
    emissive: new THREE.Color(0xffffff),
    emissiveIntensity: 0,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.userData.tooltip = "Soil Stratigraphy";

  // Survey grid lines — natural ground only, same idiom as the Plexus
  // scene's terrain.ts.
  const gridLinePositions: number[] = [];
  const gridDivsX = 7;
  const gridDivsZ = 5;
  const steps = 20;
  const sampleOuterY = (x: number, z: number) => SURFACE_Y + signedNoise(x, z, 0) * SURFACE_NOISE_AMPLITUDE + 0.02;
  for (let i = 0; i <= gridDivsX; i++) {
    const x = -BLOCK_HALF_WIDTH + (width * i) / gridDivsX;
    for (let s = 0; s < steps; s++) {
      const z0 = -BLOCK_HALF_DEPTH + (depth * s) / steps;
      const z1 = -BLOCK_HALF_DEPTH + (depth * (s + 1)) / steps;
      if (isInsideExcavation(x, z0) || isInsideExcavation(x, z1)) continue;
      gridLinePositions.push(x, sampleOuterY(x, z0), z0, x, sampleOuterY(x, z1), z1);
    }
  }
  for (let j = 0; j <= gridDivsZ; j++) {
    const z = -BLOCK_HALF_DEPTH + (depth * j) / gridDivsZ;
    for (let s = 0; s < steps; s++) {
      const x0 = -BLOCK_HALF_WIDTH + (width * s) / steps;
      const x1 = -BLOCK_HALF_WIDTH + (width * (s + 1)) / steps;
      if (isInsideExcavation(x0, z) || isInsideExcavation(x1, z)) continue;
      gridLinePositions.push(x0, sampleOuterY(x0, z), z, x1, sampleOuterY(x1, z), z);
    }
  }
  const gridGeometry = new THREE.BufferGeometry();
  gridGeometry.setAttribute("position", new THREE.Float32BufferAttribute(gridLinePositions, 3));
  const gridMaterial = new THREE.LineBasicMaterial({ color: 0x3a3a42, transparent: true, opacity: 0.18 });
  const gridLines = new THREE.LineSegments(gridGeometry, gridMaterial);

  // Static outer cutaway walls — far X (-BLOCK_HALF_WIDTH) and far Z
  // (-BLOCK_HALF_DEPTH) faces only.
  const buildOuterWall = (axis: "x" | "z"): THREE.Mesh => {
    const wallSegV = 20;
    const wallSegH = 4;
    const span = axis === "x" ? depth : width;
    const wallGeometry = new THREE.PlaneGeometry(span, SURFACE_Y - BEDROCK_BOTTOM_Y, wallSegH, wallSegV);
    const wp = wallGeometry.attributes.position as THREE.BufferAttribute;
    const wc = new Float32Array(wp.count * 3);
    const c = new THREE.Color();
    for (let i = 0; i < wp.count; i++) {
      const localY = wp.getY(i) + (SURFACE_Y + BEDROCK_BOTTOM_Y) / 2;
      stratumColorAt(localY, c);
      wc[i * 3] = c.r;
      wc[i * 3 + 1] = c.g;
      wc[i * 3 + 2] = c.b;
    }
    wallGeometry.setAttribute("color", new THREE.Float32BufferAttribute(wc, 3));
    const wallMaterial = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.9,
      side: THREE.DoubleSide,
      emissive: new THREE.Color(0xffffff),
      emissiveIntensity: 0,
    });
    const wall = new THREE.Mesh(wallGeometry, wallMaterial);
    wall.userData.tooltip = "Soil Stratigraphy";
    // Vertex colours above are sampled at local-Y + this same midpoint
    // offset, so the mesh's own position.y must apply that offset too —
    // otherwise the rendered wall and its colour bands disagree about
    // which world depth each vertex actually sits at.
    const midY = (SURFACE_Y + BEDROCK_BOTTOM_Y) / 2;
    if (axis === "x") {
      wall.rotation.y = Math.PI / 2;
      wall.position.set(-BLOCK_HALF_WIDTH, midY, 0);
    } else {
      wall.position.set(0, midY, -BLOCK_HALF_DEPTH);
    }
    return wall;
  };
  const wallX = buildOuterWall("x");
  const wallZ = buildOuterWall("z");

  // Simple building footprint over the foundation — revealed at the final
  // "Final Structure" stage.
  const buildingGeometry = new THREE.BoxGeometry(FOUNDATION_SLAB_SIZE * 0.82, 2.4, FOUNDATION_SLAB_SIZE * 0.82);
  const buildingMaterial = new THREE.MeshStandardMaterial({
    color: 0xeceae2,
    roughness: 0.7,
    transparent: true,
    opacity: 0,
  });
  const buildingMesh = new THREE.Mesh(buildingGeometry, buildingMaterial);
  buildingMesh.position.set(FOUNDATION_CENTER.x, SURFACE_Y + 1.2, FOUNDATION_CENTER.z);

  const group = new THREE.Group();
  group.add(mesh, gridLines, wallX, wallZ, buildingMesh);

  return {
    group,
    update: recompute,
    setBuildingReveal: (amount: number) => {
      buildingMaterial.opacity = THREE.MathUtils.clamp(amount, 0, 1) * 0.96;
      buildingMesh.scale.y = 0.4 + 0.6 * THREE.MathUtils.clamp(amount, 0, 1);
    },
    interactiveObjects: [mesh, wallX, wallZ],
    setHover: (amount: number) => {
      const intensity = THREE.MathUtils.clamp(amount, 0, 1) * 0.2;
      material.emissiveIntensity = intensity;
      (wallX.material as THREE.MeshStandardMaterial).emissiveIntensity = intensity;
      (wallZ.material as THREE.MeshStandardMaterial).emissiveIntensity = intensity;
    },
    dispose: () => {
      geometry.dispose();
      material.dispose();
      gridGeometry.dispose();
      gridMaterial.dispose();
      wallX.geometry.dispose();
      (wallX.material as THREE.Material).dispose();
      wallZ.geometry.dispose();
      (wallZ.material as THREE.Material).dispose();
      buildingGeometry.dispose();
      buildingMaterial.dispose();
    },
  };
};
