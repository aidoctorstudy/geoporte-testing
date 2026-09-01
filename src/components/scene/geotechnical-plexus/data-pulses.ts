/**
 * Data pulses — small points riding a subset of the Plexus network's own
 * edges, looping slowly (~8-11s per traversal). Reads as live sensor/
 * structural-analysis data moving through the mesh, not a particle effect —
 * kept deliberately slow and few in number per the brief's "slow and
 * elegant, not flashy".
 */
import * as THREE from "three";
import type { DisposeFn } from "./constants";
import type { PlexusEdge } from "./plexus-mesh";

export interface DataPulsesHandle {
  mesh: THREE.InstancedMesh;
  setVisibility: (amount: number) => void;
  update: (elapsedSeconds: number) => void;
  dispose: DisposeFn;
}

interface Pulse {
  start: THREE.Vector3;
  end: THREE.Vector3;
  speed: number;
  phase: number;
}

/** Numeric mirror of --raw-color-engineering-glow (globals.css) — brighter
 * than the Plexus lines themselves so a pulse reads as "live" without
 * needing bloom. */
const PULSE_COLOR = 0x4fb8e0;

export const buildDataPulses = (edges: PlexusEdge[], densityScale: number): DataPulsesHandle => {
  const count = Math.max(1, Math.min(edges.length, Math.round(42 * densityScale)));
  const shuffled = edges.length > 0 ? [...edges].sort(() => Math.random() - 0.5) : [];
  const pulses: Pulse[] = [];
  for (let i = 0; i < count && shuffled.length > 0; i++) {
    const edge = shuffled[i % shuffled.length];
    pulses.push({
      start: edge.start,
      end: edge.end,
      speed: 0.09 + Math.random() * 0.08,
      phase: Math.random(),
    });
  }

  const geometry = new THREE.SphereGeometry(0.032, 6, 6);
  const material = new THREE.MeshBasicMaterial({ color: PULSE_COLOR, transparent: true, opacity: 0 });
  const mesh = new THREE.InstancedMesh(geometry, material, count);
  const scratchMatrix = new THREE.Matrix4();
  const scratchPosition = new THREE.Vector3();

  const update = (elapsedSeconds: number) => {
    pulses.forEach((pulse, i) => {
      const localT = (elapsedSeconds * pulse.speed + pulse.phase) % 1;
      scratchPosition.lerpVectors(pulse.start, pulse.end, localT);
      scratchMatrix.makeTranslation(scratchPosition.x, scratchPosition.y, scratchPosition.z);
      mesh.setMatrixAt(i, scratchMatrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  };
  update(0);

  const setVisibility = (amount: number) => {
    material.opacity = THREE.MathUtils.clamp(amount, 0, 1) * 0.85;
  };
  setVisibility(0.3);

  return {
    mesh,
    setVisibility,
    update,
    dispose: () => {
      geometry.dispose();
      material.dispose();
    },
  };
};
