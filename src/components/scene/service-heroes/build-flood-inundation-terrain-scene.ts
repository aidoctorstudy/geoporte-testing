/**
 * Hero scene for the Stormwater & Flood Modelling service page — a bowl-
 * shaped catchment terrain with a rising translucent water plane, expanding
 * flood-extent contour rings, and a branching drainage network whose
 * brightness sweeps trunk-to-outlet. See `sceneSummary` in `services.ts`.
 */
import * as THREE from "three";
import { HERO_SCENE_COLORS as COLOR } from "../hero-scene-colors";
import { disposeSceneObjects } from "@/lib/scene/shared-viewport-renderer";
import { createHeroSceneRuntime } from "./hero-scene-runtime";
import type { HeroSceneHandle } from "../hero-scene-types";

const CATCHMENT_LOW_Y = -1.8;
const CATCHMENT_RIM_Y = 0;

const buildCatchmentTerrain = (): THREE.LineSegments => {
  const geometry = new THREE.PlaneGeometry(16, 13, 40, 32);
  geometry.rotateX(-Math.PI / 2);
  const position = geometry.attributes.position;
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i);
    const z = position.getZ(i);
    const depth = Math.exp(-((x / 6) ** 2 + (z / 5) ** 2)) * 1.8;
    position.setY(i, -depth);
  }
  geometry.computeVertexNormals();

  const wireframe = new THREE.WireframeGeometry(geometry);
  const material = new THREE.LineBasicMaterial({ color: COLOR.line, transparent: true, opacity: 0.3 });
  geometry.dispose();
  return new THREE.LineSegments(wireframe, material);
};

const buildWaterPlane = (): THREE.Mesh => {
  const geometry = new THREE.PlaneGeometry(14, 11);
  geometry.rotateX(-Math.PI / 2);
  return new THREE.Mesh(
    geometry,
    new THREE.MeshBasicMaterial({ color: COLOR.glow, transparent: true, opacity: 0.12, side: THREE.DoubleSide }),
  );
};

const buildFloodRingGeometry = (): THREE.BufferGeometry => {
  const points: THREE.Vector3[] = [];
  for (let i = 0; i <= 48; i++) {
    const theta = (i / 48) * Math.PI * 2;
    points.push(new THREE.Vector3(Math.cos(theta), 0, Math.sin(theta)));
  }
  return new THREE.BufferGeometry().setFromPoints(points);
};

interface DrainageSegment {
  line: THREE.Line;
  order: number;
}

/** A small branching tree of drainage lines running from the catchment rim
 * down to the low point — `order` is distance-from-outlet, used to sweep
 * brightness from trunk to outlet. */
const buildDrainageNetwork = (): DrainageSegment[] => {
  const material = () => new THREE.LineBasicMaterial({ color: COLOR.ink, transparent: true, opacity: 0 });
  const branches: Array<{ from: THREE.Vector3; to: THREE.Vector3; order: number }> = [
    { from: new THREE.Vector3(0, -1.75, 0), to: new THREE.Vector3(-2, -1, 1.5), order: 0 },
    { from: new THREE.Vector3(0, -1.75, 0), to: new THREE.Vector3(2, -1, -1.5), order: 0 },
    { from: new THREE.Vector3(-2, -1, 1.5), to: new THREE.Vector3(-4.5, -0.3, 3), order: 1 },
    { from: new THREE.Vector3(-2, -1, 1.5), to: new THREE.Vector3(-3, -0.3, 0.2), order: 1 },
    { from: new THREE.Vector3(2, -1, -1.5), to: new THREE.Vector3(4.5, -0.3, -3), order: 1 },
    { from: new THREE.Vector3(2, -1, -1.5), to: new THREE.Vector3(3, -0.3, -0.2), order: 1 },
  ];
  return branches.map(({ from, to, order }) => {
    const geometry = new THREE.BufferGeometry().setFromPoints([from, to]);
    return { line: new THREE.Line(geometry, material()), order };
  });
};

export const createFloodInundationTerrainScene = (container: HTMLElement): HeroSceneHandle =>
  createHeroSceneRuntime(
    container,
    { cameraPosition: [0, 3.6, 7.2], cameraLookAt: [0, -0.6, 0] },
    () => {
      const scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(COLOR.background, 0.045);

      scene.add(buildCatchmentTerrain());

      const water = buildWaterPlane();
      scene.add(water);

      const ringGeometry = buildFloodRingGeometry();
      const rings = [0, 1, 2].map((i) => {
        const ring = new THREE.Line(
          ringGeometry,
          new THREE.LineBasicMaterial({ color: COLOR.glow, transparent: true, opacity: 0 }),
        );
        ring.rotation.x = Math.PI / 2;
        scene.add(ring);
        return { ring, phase: i / 3 };
      });

      const drainage = buildDrainageNetwork();
      drainage.forEach(({ line }) => scene.add(line));

      const update = (elapsedSeconds: number) => {
        const level = (Math.sin(elapsedSeconds * 0.15) + 1) / 2;
        water.position.y = CATCHMENT_LOW_Y + level * (CATCHMENT_RIM_Y - CATCHMENT_LOW_Y);

        rings.forEach(({ ring, phase }) => {
          const ringPhase = (elapsedSeconds * 0.15 + phase) % 1;
          const scale = 0.5 + ringPhase * 5.5;
          ring.scale.set(scale, 1, scale);
          ring.position.y = water.position.y;
          (ring.material as THREE.LineBasicMaterial).opacity = (1 - ringPhase) * 0.5;
        });

        drainage.forEach(({ line, order }) => {
          const sweep = (elapsedSeconds * 0.6 - order * 0.35) % 1.4;
          const opacity = sweep >= 0 && sweep <= 1 ? Math.sin(sweep * Math.PI) * 0.6 : 0;
          (line.material as THREE.LineBasicMaterial).opacity = opacity;
        });
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
