/**
 * Hero scene for the Stormwater & Flood Modelling service page — a bowl-
 * shaped catchment terrain (a tier-budgeted denser grid than a mini-scene
 * would carry, since this is a full-bleed hero) with a scroll-driven rising
 * water plane, expanding flood-extent contour rings, falling rain, and a
 * branching drainage network whose brightness sweeps trunk-to-outlet. See
 * `sceneSummary` in `data/mocks/services.ts`.
 */
import * as THREE from "three";
import { HERO_SCENE_COLORS as COLOR } from "../hero-scene-colors";
import { getDeviceTier } from "@/lib/scene/device-tier";
import { disposeSceneObjects } from "@/lib/scene/shared-viewport-renderer";
import { createHeroSceneRuntime } from "./hero-scene-runtime";
import type { HeroSceneHandle } from "../hero-scene-types";

const CATCHMENT_LOW_Y = -1.8;
const CATCHMENT_RIM_Y = 0;

/** Terrain resolution and rain particle count both come from the device
 * tier — mobile never reaches this builder at all (`HeroScene` skips WebGL
 * below that breakpoint), so this is really a tablet/desktop split. Desktop
 * gets a noticeably denser grid than the pre-elevation version (40×32); a
 * literal 512×512 (homepage-hero-cutaway scale) is more than a full-bleed
 * hero needs to read as "detailed terrain." */
const getTierCounts = (width: number) => {
  const tier = getDeviceTier(width);
  return tier === "desktop"
    ? { terrainSegX: 96, terrainSegZ: 76, rainCount: 480 }
    : { terrainSegX: 52, terrainSegZ: 40, rainCount: 220 };
};

const buildCatchmentTerrain = (segX: number, segZ: number): THREE.LineSegments => {
  const geometry = new THREE.PlaneGeometry(16, 13, segX, segZ);
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
  const material = new THREE.LineBasicMaterial({ color: COLOR.line, transparent: true, opacity: 0.28 });
  geometry.dispose();
  return new THREE.LineSegments(wireframe, material);
};

const buildWaterPlane = (): THREE.Mesh => {
  const geometry = new THREE.PlaneGeometry(14, 11);
  geometry.rotateX(-Math.PI / 2);
  return new THREE.Mesh(
    geometry,
    new THREE.MeshBasicMaterial({ color: COLOR.glow, transparent: true, opacity: 0.14, side: THREE.DoubleSide }),
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

interface RainDrops {
  points: THREE.Points;
  positions: Float32Array;
  speeds: Float32Array;
}

/** Falling rain — each drop resets to a random point above the catchment
 * once it drops below the terrain's low point, fading in near the top and
 * out near the bottom so the reset is never visible as a pop. */
const buildRain = (count: number): RainDrops => {
  const positions = new Float32Array(count * 3);
  const speeds = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 15;
    positions[i * 3 + 1] = Math.random() * 6 - 1;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 12;
    speeds[i] = 2 + Math.random() * 2;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    color: COLOR.ink,
    size: 0.03,
    transparent: true,
    opacity: 0.5,
    sizeAttenuation: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  return { points: new THREE.Points(geometry, material), positions, speeds };
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
    { from: new THREE.Vector3(-4.5, -0.3, 3), to: new THREE.Vector3(-6.2, 0, 4), order: 2 },
    { from: new THREE.Vector3(4.5, -0.3, -3), to: new THREE.Vector3(6.2, 0, -4), order: 2 },
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
      const { terrainSegX, terrainSegZ, rainCount } = getTierCounts(container.clientWidth);

      const scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(COLOR.background, 0.045);

      scene.add(buildCatchmentTerrain(terrainSegX, terrainSegZ));

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

      const rain = buildRain(rainCount);
      scene.add(rain.points);

      const update = (elapsedSeconds: number, _pointer: { x: number; y: number }, scrollProgress: number) => {
        const ambientLevel = (Math.sin(elapsedSeconds * 0.15) + 1) / 2;
        const level = Math.max(ambientLevel, scrollProgress);
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

        const dt = 1 / 60;
        for (let i = 0; i < rain.speeds.length; i++) {
          const idx = i * 3 + 1;
          rain.positions[idx] -= rain.speeds[i] * dt;
          if (rain.positions[idx] < CATCHMENT_LOW_Y - 0.2) {
            rain.positions[idx] = 5 + Math.random();
          }
        }
        rain.points.geometry.attributes.position.needsUpdate = true;
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
