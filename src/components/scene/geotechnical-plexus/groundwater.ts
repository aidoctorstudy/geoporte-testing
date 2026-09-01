/**
 * Groundwater table — one semi-transparent, gently uneven plane intersecting
 * the Sand/Clay boundary. Deliberately the most restrained subsystem in the
 * scene (low opacity, no flow animation) — the brief asks for "subtle,
 * professional", not a water-simulation centrepiece.
 */
import * as THREE from "three";
import { BLOCK_HALF_DEPTH, BLOCK_HALF_WIDTH, signedNoise, type DisposeFn } from "./constants";

export interface GroundwaterHandle {
  mesh: THREE.Mesh;
  dispose: DisposeFn;
}

const GROUNDWATER_Y = -2.2;
const WAVINESS = 0.08;
const WATER_COLOR = 0x6fa8c9;

export const buildGroundwater = (): GroundwaterHandle => {
  const width = BLOCK_HALF_WIDTH * 2 * 0.94;
  const depth = BLOCK_HALF_DEPTH * 2 * 0.94;
  const geometry = new THREE.PlaneGeometry(width, depth, 14, 9);
  geometry.rotateX(-Math.PI / 2);
  const pos = geometry.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    pos.setY(i, GROUNDWATER_Y + signedNoise(pos.getX(i), pos.getZ(i), 500) * WAVINESS);
  }
  pos.needsUpdate = true;
  geometry.computeVertexNormals();

  const material = new THREE.MeshStandardMaterial({
    color: WATER_COLOR,
    transparent: true,
    opacity: 0.14,
    roughness: 0.15,
    metalness: 0.1,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(geometry, material);

  return {
    mesh,
    dispose: () => {
      geometry.dispose();
      material.dispose();
    },
  };
};
