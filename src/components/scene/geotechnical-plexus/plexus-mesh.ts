/**
 * The Plexus network — the scene's namesake. Small nodes distributed inside
 * the geological block, thin lines connecting nearby nodes, and a sparse set
 * of translucent triangular faces between mutually-connected node triples.
 *
 * Density and structure both increase with depth (`LayerDef.nodeCount` /
 * `.structure` in `constants.ts`): upper soil layers get fewer, purely
 * random nodes; Bedrock gets the most nodes, pulled toward a jittered
 * lattice. That's what keeps this reading as "an engineering computation
 * mesh" rather than a particle-galaxy scatter — the brief's own framing.
 *
 * Performance: one `InstancedMesh` for every node (one draw call regardless
 * of node count), one `BufferGeometry`/`LineSegments` for every connection
 * (one draw call regardless of edge count), one small triangle-soup `Mesh`
 * for the selected faces — matching the brief's explicit "instanced meshes
 * where possible" / "BufferGeometry for Plexus lines" performance asks.
 * Connectivity is computed once at construction (O(n²) over ≤~300 nodes),
 * never per frame.
 */
import * as THREE from "three";
import { BLOCK_HALF_DEPTH, BLOCK_HALF_WIDTH, LAYERS, type DisposeFn } from "./constants";

export interface PlexusEdge {
  start: THREE.Vector3;
  end: THREE.Vector3;
}

export interface PlexusHandle {
  group: THREE.Group;
  /** Exposed so `data-pulses.ts` can ride a subset of the same edges —
   * pulses should travel real Plexus connections, not an independent path. */
  edges: PlexusEdge[];
  /** 0..1 — how prominent the lines/faces/nodes read; driven by the scroll
   * controller's "plexus more visible" stage. */
  setVisibility: (amount: number) => void;
  dispose: DisposeFn;
}

interface PlexusNode {
  position: THREE.Vector3;
  layerIndex: number;
}

/** Keeps nodes off the block's outer walls so the network reads as embedded
 * inside the strata, not pinned to their edges. */
const MARGIN = 0.85;
const NEAREST_NEIGHBOR_COUNT = 3;
/** Numeric mirrors of --raw-color-engineering-accent / a cooler slate
 * variant of it (globals.css) — kept in the blueprint-blue family so the
 * network reads as one instrument, not a rainbow of unrelated hues. */
const NODE_COLOR = 0x3d5a80;
const LINE_COLOR = 0x6b83a3;
const FACE_COLOR = 0x8fb3d9;

const generateNodes = (densityScale: number): PlexusNode[] => {
  const nodes: PlexusNode[] = [];
  LAYERS.forEach((def, layerIndex) => {
    const count = Math.max(4, Math.round(def.nodeCount * densityScale));
    const cellsX = Math.max(2, Math.round(Math.sqrt(count * (BLOCK_HALF_WIDTH / BLOCK_HALF_DEPTH))));
    const cellsZ = Math.max(2, Math.round(count / cellsX));
    const spanX = BLOCK_HALF_WIDTH * 2 * MARGIN;
    const spanZ = BLOCK_HALF_DEPTH * 2 * MARGIN;
    const jitter = (1 - def.structure) * 0.6 + 0.15;

    for (let i = 0; i < count; i++) {
      const randomX = (Math.random() * 2 - 1) * BLOCK_HALF_WIDTH * MARGIN;
      const randomZ = (Math.random() * 2 - 1) * BLOCK_HALF_DEPTH * MARGIN;
      const randomY = THREE.MathUtils.lerp(def.topY, def.bottomY, Math.random());

      const cx = i % cellsX;
      const cz = Math.floor(i / cellsX) % cellsZ;
      const latticeX = -BLOCK_HALF_WIDTH * MARGIN + (cx + 0.5) * (spanX / cellsX) + (Math.random() * 2 - 1) * jitter;
      const latticeZ = -BLOCK_HALF_DEPTH * MARGIN + (cz + 0.5) * (spanZ / cellsZ) + (Math.random() * 2 - 1) * jitter;
      const latticeY = THREE.MathUtils.lerp(def.topY, def.bottomY, 0.5) + (Math.random() * 2 - 1) * jitter * 0.3;

      const x = THREE.MathUtils.lerp(randomX, latticeX, def.structure);
      const z = THREE.MathUtils.lerp(randomZ, latticeZ, def.structure);
      const y = THREE.MathUtils.lerp(randomY, latticeY, def.structure);

      nodes.push({ position: new THREE.Vector3(x, y, z), layerIndex });
    }
  });
  return nodes;
};

const buildConnectivity = (
  nodes: PlexusNode[],
): { edges: [number, number][]; adjacency: Set<number>[] } => {
  const n = nodes.length;
  const adjacency: Set<number>[] = Array.from({ length: n }, () => new Set<number>());
  const edgeSet = new Set<string>();
  const edges: [number, number][] = [];

  for (let i = 0; i < n; i++) {
    const maxDist = 0.75 + LAYERS[nodes[i].layerIndex].structure * 0.55;
    const candidates: { j: number; d: number }[] = [];
    for (let j = 0; j < n; j++) {
      if (i === j) continue;
      const d = nodes[i].position.distanceTo(nodes[j].position);
      if (d <= maxDist) candidates.push({ j, d });
    }
    candidates.sort((a, b) => a.d - b.d);
    for (let k = 0; k < Math.min(NEAREST_NEIGHBOR_COUNT, candidates.length); k++) {
      const j = candidates[k].j;
      const key = i < j ? `${i}_${j}` : `${j}_${i}`;
      if (edgeSet.has(key)) continue;
      edgeSet.add(key);
      edges.push([i, j]);
      adjacency[i].add(j);
      adjacency[j].add(i);
    }
  }
  return { edges, adjacency };
};

/** Selected triangular faces — triples that are all mutually connected,
 * capped so the fill reads as "selected", not "every possible face". */
const buildFaces = (
  edges: [number, number][],
  adjacency: Set<number>[],
  cap: number,
): [number, number, number][] => {
  const faces: [number, number, number][] = [];
  const seen = new Set<string>();
  for (const [i, j] of edges) {
    if (faces.length >= cap) break;
    for (const k of adjacency[i]) {
      if (k === j || !adjacency[j].has(k)) continue;
      const tri = [i, j, k].sort((a, b) => a - b);
      const key = tri.join("_");
      if (seen.has(key)) continue;
      seen.add(key);
      faces.push([tri[0], tri[1], tri[2]]);
      if (faces.length >= cap) break;
    }
  }
  return faces;
};

export const buildPlexusMesh = (densityScale: number): PlexusHandle => {
  const nodes = generateNodes(densityScale);
  const { edges, adjacency } = buildConnectivity(nodes);
  const faces = buildFaces(edges, adjacency, Math.round(90 * densityScale));

  const group = new THREE.Group();

  const nodeGeometry = new THREE.IcosahedronGeometry(0.045, 0);
  const nodeMaterial = new THREE.MeshStandardMaterial({
    color: NODE_COLOR,
    transparent: true,
    opacity: 0.85,
    roughness: 0.4,
    metalness: 0.1,
  });
  const nodesMesh = new THREE.InstancedMesh(nodeGeometry, nodeMaterial, nodes.length);
  const scratchMatrix = new THREE.Matrix4();
  nodes.forEach((node, i) => {
    scratchMatrix.makeTranslation(node.position.x, node.position.y, node.position.z);
    nodesMesh.setMatrixAt(i, scratchMatrix);
  });
  nodesMesh.instanceMatrix.needsUpdate = true;
  group.add(nodesMesh);

  const linePositions = new Float32Array(edges.length * 6);
  edges.forEach(([i, j], e) => {
    const a = nodes[i].position;
    const b = nodes[j].position;
    const o = e * 6;
    linePositions[o] = a.x;
    linePositions[o + 1] = a.y;
    linePositions[o + 2] = a.z;
    linePositions[o + 3] = b.x;
    linePositions[o + 4] = b.y;
    linePositions[o + 5] = b.z;
  });
  const lineGeometry = new THREE.BufferGeometry();
  lineGeometry.setAttribute("position", new THREE.Float32BufferAttribute(linePositions, 3));
  const lineMaterial = new THREE.LineBasicMaterial({ color: LINE_COLOR, transparent: true, opacity: 0.28 });
  const linesMesh = new THREE.LineSegments(lineGeometry, lineMaterial);
  group.add(linesMesh);

  const facePositions = new Float32Array(faces.length * 9);
  faces.forEach(([i, j, k], f) => {
    const a = nodes[i].position;
    const b = nodes[j].position;
    const c = nodes[k].position;
    const o = f * 9;
    facePositions[o] = a.x;
    facePositions[o + 1] = a.y;
    facePositions[o + 2] = a.z;
    facePositions[o + 3] = b.x;
    facePositions[o + 4] = b.y;
    facePositions[o + 5] = b.z;
    facePositions[o + 6] = c.x;
    facePositions[o + 7] = c.y;
    facePositions[o + 8] = c.z;
  });
  const faceGeometry = new THREE.BufferGeometry();
  faceGeometry.setAttribute("position", new THREE.Float32BufferAttribute(facePositions, 3));
  faceGeometry.computeVertexNormals();
  const faceMaterial = new THREE.MeshBasicMaterial({
    color: FACE_COLOR,
    transparent: true,
    opacity: 0.05,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const facesMesh = new THREE.Mesh(faceGeometry, faceMaterial);
  group.add(facesMesh);

  const setVisibility = (amount: number) => {
    const a = THREE.MathUtils.clamp(amount, 0, 1);
    lineMaterial.opacity = THREE.MathUtils.lerp(0.12, 0.5, a);
    faceMaterial.opacity = THREE.MathUtils.lerp(0.015, 0.1, a);
    nodeMaterial.opacity = THREE.MathUtils.lerp(0.5, 0.95, a);
  };
  setVisibility(0.3);

  return {
    group,
    edges: edges.map(([i, j]) => ({ start: nodes[i].position.clone(), end: nodes[j].position.clone() })),
    setVisibility,
    dispose: () => {
      nodeGeometry.dispose();
      nodeMaterial.dispose();
      lineGeometry.dispose();
      lineMaterial.dispose();
      faceGeometry.dispose();
      faceMaterial.dispose();
    },
  };
};
