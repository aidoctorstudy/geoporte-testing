/**
 * Hero scene for the Telecom Services page — a transmission tower that
 * assembles itself bottom-up on load (staggered mast segments, antenna arms
 * last), five true 3D torus-based coverage-ring shells expanding outward on
 * a clear 1.5s pulse (not flat circles), a connected in-building node
 * lattice that reveals more nodes as you scroll, data-stream particles
 * travelling up the mast, and a subtle background grid plane for a "matrix"
 * backdrop. See `sceneSummary` in `data/mocks/services.ts`.
 */
import * as THREE from "three";
import { HERO_SCENE_COLORS as COLOR } from "../hero-scene-colors";
import { disposeSceneObjects } from "@/lib/scene/shared-viewport-renderer";
import { createHeroSceneRuntime } from "./hero-scene-runtime";
import type { HeroSceneHandle } from "../hero-scene-types";

const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);

const MAST_HEIGHT = 3.2;
const MAST_SEGMENT_COUNT = 6;
const SEGMENT_ASSEMBLE_DURATION_S = 0.5;
const SEGMENT_STAGGER_S = 0.18;

interface TowerSegment {
  line: THREE.LineSegments;
  delay: number;
}

/** The mast built as stacked segments instead of one solid cylinder, purely
 * so each can independently scale/fade in on its own staggered timer for the
 * bottom-up assembly. */
const buildTowerSegments = (): TowerSegment[] => {
  const material = new THREE.LineBasicMaterial({ color: COLOR.line, transparent: true, opacity: 0.6 });
  const segmentHeight = MAST_HEIGHT / MAST_SEGMENT_COUNT;
  return Array.from({ length: MAST_SEGMENT_COUNT }, (_, i) => {
    const topRadius = 0.06 - (i / MAST_SEGMENT_COUNT) * 0.03;
    const bottomRadius = topRadius + 0.008;
    const geometry = new THREE.CylinderGeometry(topRadius, bottomRadius, segmentHeight, 6);
    const line = new THREE.LineSegments(new THREE.EdgesGeometry(geometry), material);
    line.position.y = i * segmentHeight + segmentHeight / 2;
    line.scale.y = 0.0001;
    geometry.dispose();
    return { line, delay: i * SEGMENT_STAGGER_S };
  });
};

const buildAntennaArms = (): THREE.LineSegments[] => {
  const material = new THREE.LineBasicMaterial({ color: COLOR.line, transparent: true, opacity: 0 });
  const armGeometry = new THREE.BoxGeometry(0.9, 0.04, 0.04);
  const armEdges = new THREE.EdgesGeometry(armGeometry);
  armGeometry.dispose();
  return [2.4, 2.7].map((y, i) => {
    const arm = new THREE.LineSegments(armEdges, material.clone());
    arm.position.set(i % 2 === 0 ? 0.3 : -0.3, y, 0);
    return arm;
  });
};

interface RingShell {
  mesh: THREE.Mesh;
  phase: number;
}

const RING_COUNT = 5;
const RING_PULSE_PERIOD_S = 1.5;

/** A single unit torus (radius 1, thin tube), scaled up per-frame per shell
 * to simulate expansion — the same "scale a unit ring" trick the stormwater
 * scene's flood-extent rings use, but a real 3D torus lying flat around the
 * tower rather than a flat circle. */
const buildRingShells = (): { shells: RingShell[]; geometry: THREE.TorusGeometry } => {
  const geometry = new THREE.TorusGeometry(1, 0.012, 8, 48);
  const shells = Array.from({ length: RING_COUNT }, (_, i) => {
    const mesh = new THREE.Mesh(
      geometry,
      new THREE.MeshBasicMaterial({
        color: COLOR.glow,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    mesh.rotation.x = Math.PI / 2;
    mesh.position.y = 1.6;
    mesh.scale.setScalar(0.001);
    return { mesh, phase: i / RING_COUNT };
  });
  return { shells, geometry };
};

interface NodeLattice {
  points: THREE.Points;
  connectors: THREE.LineSegments;
  totalVertexCount: number;
}

const NODE_LAYERS = 3;
const NODE_PER_LAYER = 9;

const buildNodeLattice = (): NodeLattice => {
  const nodePositions: THREE.Vector3[] = [];
  for (let l = 0; l < NODE_LAYERS; l++) {
    for (let n = 0; n < NODE_PER_LAYER; n++) {
      const col = n % 3;
      const row = Math.floor(n / 3);
      nodePositions.push(new THREE.Vector3(3.2 + col * 0.4, l * 0.5 + 0.2, row * 0.4 - 0.4));
    }
  }

  const positions = new Float32Array(nodePositions.length * 3);
  nodePositions.forEach((p, i) => p.toArray(positions, i * 3));
  const pointsGeometry = new THREE.BufferGeometry();
  pointsGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  pointsGeometry.setDrawRange(0, 0);
  const points = new THREE.Points(
    pointsGeometry,
    new THREE.PointsMaterial({
      color: COLOR.glow,
      size: 0.05,
      transparent: true,
      opacity: 0.75,
      sizeAttenuation: true,
    }),
  );

  // Connects each node to its right-hand neighbour and to the node directly
  // above it in the next layer — a simple lattice, not every pair, to stay
  // legible.
  const connectorPoints: THREE.Vector3[] = [];
  for (let l = 0; l < NODE_LAYERS; l++) {
    for (let n = 0; n < NODE_PER_LAYER; n++) {
      const idx = l * NODE_PER_LAYER + n;
      const col = n % 3;
      if (col < 2) {
        connectorPoints.push(nodePositions[idx], nodePositions[idx + 1]);
      }
      if (l < NODE_LAYERS - 1) {
        connectorPoints.push(nodePositions[idx], nodePositions[idx + NODE_PER_LAYER]);
      }
    }
  }
  const connectors = new THREE.LineSegments(
    new THREE.BufferGeometry().setFromPoints(connectorPoints),
    new THREE.LineBasicMaterial({ color: COLOR.ink, transparent: true, opacity: 0 }),
  );

  return { points, connectors, totalVertexCount: nodePositions.length };
};

interface DataStream {
  points: THREE.Points;
  ys: Float32Array;
  speeds: Float32Array;
}

const DATA_STREAM_COUNT = 40;

const buildDataStream = (): DataStream => {
  const positions = new Float32Array(DATA_STREAM_COUNT * 3);
  const ys = new Float32Array(DATA_STREAM_COUNT);
  const speeds = new Float32Array(DATA_STREAM_COUNT);
  for (let i = 0; i < DATA_STREAM_COUNT; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = 0.1 + Math.random() * 0.08;
    positions[i * 3] = Math.cos(angle) * radius;
    positions[i * 3 + 1] = Math.random() * MAST_HEIGHT;
    positions[i * 3 + 2] = Math.sin(angle) * radius;
    ys[i] = positions[i * 3 + 1];
    speeds[i] = 0.7 + Math.random() * 0.6;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    color: COLOR.white,
    size: 0.035,
    transparent: true,
    opacity: 0.7,
    sizeAttenuation: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  return { points: new THREE.Points(geometry, material), ys, speeds };
};

/** A large, faint ground-level grid plane for the "matrix" backdrop read —
 * static geometry, no per-frame cost beyond the group's own transform. */
const buildBackgroundGrid = (): THREE.LineSegments => {
  const geometry = new THREE.PlaneGeometry(16, 16, 16, 16);
  geometry.rotateX(-Math.PI / 2);
  const wireframe = new THREE.WireframeGeometry(geometry);
  const grid = new THREE.LineSegments(
    wireframe,
    new THREE.LineBasicMaterial({ color: COLOR.line, transparent: true, opacity: 0.08 }),
  );
  grid.position.y = -0.6;
  geometry.dispose();
  return grid;
};

export const createTelecomSignalNetworkScene = (container: HTMLElement): HeroSceneHandle =>
  createHeroSceneRuntime(
    container,
    { cameraPosition: [3, 2.2, 6.8], cameraLookAt: [1.5, 1, 0] },
    () => {
      const scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(COLOR.background, 0.045);

      scene.add(buildBackgroundGrid());

      const towerGroup = new THREE.Group();
      scene.add(towerGroup);

      const segments = buildTowerSegments();
      segments.forEach(({ line }) => towerGroup.add(line));

      const arms = buildAntennaArms();
      arms.forEach((arm) => towerGroup.add(arm));

      const { shells, geometry: ringGeometry } = buildRingShells();
      shells.forEach(({ mesh }) => towerGroup.add(mesh));

      const dataStream = buildDataStream();
      towerGroup.add(dataStream.points);

      const { points: nodes, connectors, totalVertexCount } = buildNodeLattice();
      scene.add(nodes);
      scene.add(connectors);

      const rfMaterial = new THREE.LineBasicMaterial({ color: COLOR.ink, transparent: true, opacity: 0.3 });
      const rfGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 1.6, 0),
        new THREE.Vector3(3.6, 0.7, 0),
      ]);
      scene.add(new THREE.Line(rfGeometry, rfMaterial));

      const update = (elapsedSeconds: number, _pointer: { x: number; y: number }, scrollProgress: number) => {
        segments.forEach(({ line, delay }) => {
          const t = Math.max(0, Math.min(1, (elapsedSeconds - delay) / SEGMENT_ASSEMBLE_DURATION_S));
          const eased = easeOutCubic(t);
          line.scale.y = Math.max(0.0001, eased);
          (line.material as THREE.LineBasicMaterial).opacity = 0.6 * eased;
        });

        const armsFade = Math.max(
          0,
          Math.min(1, (elapsedSeconds - MAST_SEGMENT_COUNT * SEGMENT_STAGGER_S) / 0.5),
        );
        arms.forEach((arm) => {
          (arm.material as THREE.LineBasicMaterial).opacity = armsFade * 0.6;
        });

        const maxRadius = 2.6 + scrollProgress * 1.6;
        shells.forEach(({ mesh, phase }) => {
          const normalizedPhase = (elapsedSeconds / RING_PULSE_PERIOD_S + phase) % 1;
          mesh.scale.setScalar(0.15 + normalizedPhase * maxRadius);
          (mesh.material as THREE.MeshBasicMaterial).opacity = (1 - normalizedPhase) * 0.5;
        });

        const visibleNodes = Math.max(
          Math.min(9, totalVertexCount),
          Math.round(scrollProgress * totalVertexCount),
        );
        (nodes.geometry as THREE.BufferGeometry).setDrawRange(0, visibleNodes);
        (nodes.material as THREE.PointsMaterial).opacity = 0.75;
        (connectors.material as THREE.LineBasicMaterial).opacity = 0.15 + scrollProgress * 0.15;

        const dt = 1 / 60;
        const dataPositions = dataStream.points.geometry.attributes.position as THREE.BufferAttribute;
        for (let i = 0; i < dataStream.speeds.length; i++) {
          dataStream.ys[i] += dataStream.speeds[i] * dt;
          if (dataStream.ys[i] > MAST_HEIGHT) dataStream.ys[i] = 0;
          dataPositions.setY(i, dataStream.ys[i]);
        }
        dataPositions.needsUpdate = true;

        nodes.rotation.y = Math.sin(elapsedSeconds * 0.2) * 0.05;
      };

      return {
        scene,
        update,
        dispose: () => {
          disposeSceneObjects(scene);
          ringGeometry.dispose();
        },
      };
    },
  );
