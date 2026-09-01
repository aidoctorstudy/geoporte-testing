/**
 * Tunnel — a lined bore running the full X-extent of the block at
 * mid-depth, threading beneath both the excavation and the pile
 * foundation. The lining ring is a custom radial×length grid (not a stock
 * `CylinderGeometry`) so each vertex can be individually ovalized
 * (`computeTunnelOvalization`) and contour-coloured, the same treatment
 * the retaining wall panels get.
 */
import * as THREE from "three";
import { BLOCK_HALF_WIDTH, TUNNEL_Y, TUNNEL_Z, type DisposeFn, type ResultMode } from "./constants";
import { computeTunnelOvalization } from "./deformation";
import { computeTunnelResultScalar, writeContourColor } from "./analysis-contours";

const LINING_COLOR = 0xb2aea0;
const RING_DIV = 28;
const LENGTH_DIV = 22;

export interface TunnelModelHandle {
  group: THREE.Group;
  interactiveObjects: THREE.Object3D[];
  update: (excavationFraction: number, deformAmount: number, resultMode: ResultMode, contourBlend: number) => void;
  setHover: (amount: number) => void;
  dispose: DisposeFn;
}

export const buildTunnelModel = (): TunnelModelHandle => {
  const ringVerts = RING_DIV + 1;
  const lengthVerts = LENGTH_DIV + 1;
  const total = ringVerts * lengthVerts;
  const positions = new Float32Array(total * 3);
  const colors = new Float32Array(total * 3);
  const indices: number[] = [];

  for (let li = 0; li < lengthVerts; li++) {
    const x = THREE.MathUtils.lerp(-BLOCK_HALF_WIDTH, BLOCK_HALF_WIDTH, li / LENGTH_DIV);
    for (let ri = 0; ri < ringVerts; ri++) {
      const theta = (ri / RING_DIV) * Math.PI * 2;
      const idx = li * ringVerts + ri;
      positions[idx * 3] = x;
      positions[idx * 3 + 1] = TUNNEL_Y;
      positions[idx * 3 + 2] = TUNNEL_Z;
      const c = new THREE.Color(LINING_COLOR);
      colors[idx * 3] = c.r;
      colors[idx * 3 + 1] = c.g;
      colors[idx * 3 + 2] = c.b;
    }
  }
  for (let li = 0; li < LENGTH_DIV; li++) {
    for (let ri = 0; ri < RING_DIV; ri++) {
      const a = li * ringVerts + ri;
      const b = a + 1;
      const c = a + ringVerts;
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
    roughness: 0.6,
    metalness: 0.1,
    side: THREE.DoubleSide,
    emissive: new THREE.Color(0xffffff),
    emissiveIntensity: 0,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.userData.tooltip = "Tunnel & Underground Works";

  const group = new THREE.Group();
  group.add(mesh);

  const baseColor = new THREE.Color();
  const contourColor = new THREE.Color();

  const update = (
    excavationFraction: number,
    deformAmount: number,
    resultMode: ResultMode,
    contourBlend: number,
  ) => {
    const scalar = computeTunnelResultScalar(resultMode, excavationFraction, deformAmount);
    for (let li = 0; li < lengthVerts; li++) {
      for (let ri = 0; ri < ringVerts; ri++) {
        const theta = (ri / RING_DIV) * Math.PI * 2;
        const idx = li * ringVerts + ri;
        const oval = computeTunnelOvalization(theta, excavationFraction, deformAmount);
        positionAttr.setY(idx, TUNNEL_Y + oval.y);
        positionAttr.setZ(idx, TUNNEL_Z + oval.x);

        baseColor.setHex(LINING_COLOR);
        if (resultMode !== "none" && contourBlend > 0.001) {
          writeContourColor(scalar, contourColor);
          baseColor.lerp(contourColor, contourBlend);
        }
        colorAttr.setXYZ(idx, baseColor.r, baseColor.g, baseColor.b);
      }
    }
    positionAttr.needsUpdate = true;
    colorAttr.needsUpdate = true;
    geometry.computeVertexNormals();
  };
  update(0, 0, "none", 0);

  return {
    group,
    interactiveObjects: [mesh],
    update,
    setHover: (amount: number) => {
      material.emissiveIntensity = amount * 0.25;
    },
    dispose: () => {
      geometry.dispose();
      material.dispose();
    },
  };
};
