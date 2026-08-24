/**
 * Hero scene for the Civil Engineering service page — an elevated graded
 * corridor: a flat cut-and-fill bench running the length of the terrain,
 * stepped contour terracing rising away from it, a culvert crossing a
 * floodway, cross-drainage lines, and a topographic point cloud that
 * resolves in over time. See `sceneSummary` in `data/mocks/services.ts`.
 */
import * as THREE from "three";
import { HERO_SCENE_COLORS as COLOR } from "../hero-scene-colors";
import { disposeSceneObjects } from "@/lib/scene/shared-viewport-renderer";
import { createHeroSceneRuntime } from "./hero-scene-runtime";
import type { HeroSceneHandle } from "../hero-scene-types";

const CORRIDOR_HALF_WIDTH = 2.2;

const buildCorridorTerrain = (): THREE.LineSegments => {
  const geometry = new THREE.PlaneGeometry(20, 12, 40, 24);
  geometry.rotateX(-Math.PI / 2);
  const position = geometry.attributes.position;
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i);
    const z = position.getZ(i);
    const bench = Math.abs(z) <= CORRIDOR_HALF_WIDTH ? -0.35 : 0;
    const slope = Math.max(0, Math.abs(z) - CORRIDOR_HALF_WIDTH) * 0.16;
    position.setY(i, bench + slope + Math.sin(x * 0.4) * 0.04);
  }
  geometry.computeVertexNormals();

  const wireframe = new THREE.WireframeGeometry(geometry);
  const material = new THREE.LineBasicMaterial({ color: COLOR.line, transparent: true, opacity: 0.32 });
  geometry.dispose();
  return new THREE.LineSegments(wireframe, material);
};

/** Stepped elevation-contour terracing climbing the grading slope. */
const buildContourBands = (): THREE.Group => {
  const group = new THREE.Group();
  const bands = 5;
  for (let i = 0; i < bands; i++) {
    const width = 9 - i * 0.7;
    const geometry = new THREE.BoxGeometry(width, 0.05, 0.18);
    const edges = new THREE.EdgesGeometry(geometry);
    const material = new THREE.LineBasicMaterial({
      color: i % 2 === 0 ? COLOR.line : COLOR.glow,
      transparent: true,
      opacity: 0.28 + i * 0.06,
    });
    const band = new THREE.LineSegments(edges, material);
    band.position.set(0, i * 0.3, CORRIDOR_HALF_WIDTH + 0.6 + i * 0.9);
    group.add(band);
    geometry.dispose();
  }
  return group;
};

const buildCulvertCrossing = (): THREE.Group => {
  const group = new THREE.Group();

  const culvertGeometry = new THREE.CylinderGeometry(0.35, 0.35, CORRIDOR_HALF_WIDTH * 2 + 1, 14, 1, true);
  culvertGeometry.rotateX(Math.PI / 2);
  const culvert = new THREE.LineSegments(
    new THREE.WireframeGeometry(culvertGeometry),
    new THREE.LineBasicMaterial({ color: COLOR.glow, transparent: true, opacity: 0.5 }),
  );
  culvert.position.y = -0.45;
  group.add(culvert);
  culvertGeometry.dispose();

  const floodwayGeometry = new THREE.PlaneGeometry(1.6, 8, 1, 6);
  floodwayGeometry.rotateX(-Math.PI / 2);
  floodwayGeometry.rotateY(Math.PI / 2);
  const floodway = new THREE.LineSegments(
    new THREE.WireframeGeometry(floodwayGeometry),
    new THREE.LineBasicMaterial({ color: COLOR.ink, transparent: true, opacity: 0.2 }),
  );
  floodway.position.y = -0.5;
  group.add(floodway);
  floodwayGeometry.dispose();

  return group;
};

const buildCrossDrainage = (): THREE.Group => {
  const group = new THREE.Group();
  const material = new THREE.LineBasicMaterial({ color: COLOR.ink, transparent: true, opacity: 0.4 });
  for (const x of [-6, -2.5, 2.5, 6]) {
    const geometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(x, 0, -CORRIDOR_HALF_WIDTH),
      new THREE.Vector3(x, -0.5, -5.4),
    ]);
    group.add(new THREE.Line(geometry, material));
  }
  return group;
};

const buildTopographicPointCloud = (): THREE.Points => {
  const count = 900;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 20;
    positions[i * 3 + 1] = Math.random() * 2.4 - 0.6;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 12;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    color: COLOR.ink,
    size: 0.03,
    transparent: true,
    opacity: 0,
    sizeAttenuation: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  return new THREE.Points(geometry, material);
};

export const createCorridorGradingScene = (container: HTMLElement): HeroSceneHandle =>
  createHeroSceneRuntime(
    container,
    { cameraPosition: [5.5, 3.4, 8.5], cameraLookAt: [0, -0.2, 0] },
    () => {
      const scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(COLOR.background, 0.045);

      const group = new THREE.Group();
      group.add(buildCorridorTerrain());
      group.add(buildContourBands());
      group.add(buildCulvertCrossing());
      group.add(buildCrossDrainage());
      scene.add(group);

      const points = buildTopographicPointCloud();
      scene.add(points);

      const update = (elapsedSeconds: number) => {
        group.rotation.y = Math.sin(elapsedSeconds * 0.04) * 0.08;

        const resolvePhase = (elapsedSeconds % 9) / 9;
        (points.material as THREE.PointsMaterial).opacity =
          Math.sin(resolvePhase * Math.PI) * 0.45;
        points.rotation.y += 0.0004;
      };

      return { scene, update, dispose: () => disposeSceneObjects(scene) };
    },
  );
