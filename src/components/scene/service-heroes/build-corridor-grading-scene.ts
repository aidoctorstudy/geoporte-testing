/**
 * Hero scene for the Civil Engineering service page — a city construction
 * site: roads growing outward from a centre point, a cable-stay bridge whose
 * cables attach one by one, low-poly cars running the finished road
 * segments, and two tower cranes swinging beams into place. See
 * `sceneSummary` in `data/mocks/services.ts`.
 */
import * as THREE from "three";
import { HERO_SCENE_COLORS as COLOR } from "../hero-scene-colors";
import { getDeviceTier } from "@/lib/scene/device-tier";
import { disposeSceneObjects } from "@/lib/scene/shared-viewport-renderer";
import { createHeroSceneRuntime } from "./hero-scene-runtime";
import type { HeroSceneHandle } from "../hero-scene-types";

const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);

interface RoadSpec {
  angleDeg: number;
  length: number;
}

const ROADS: RoadSpec[] = [
  { angleDeg: 0, length: 8.5 },
  { angleDeg: 55, length: 6.5 },
  { angleDeg: 115, length: 7.5 },
  { angleDeg: 180, length: 9 },
  { angleDeg: 235, length: 6 },
  { angleDeg: 300, length: 7 },
];

const ROAD_ASSEMBLE_STAGGER_S = 0.35;
const ROAD_ASSEMBLE_DURATION_S = 1.6;

interface BuiltRoad {
  pivot: THREE.Group;
  mesh: THREE.LineSegments;
  length: number;
  delay: number;
}

/** A road segment sits in its own pivot group rotated to `angleDeg`; the
 * segment's geometry is translated so its near edge (x=0) sits at the pivot
 * — animating `mesh.scale.x` from ~0 to 1 then reads as the road extending
 * outward from the centre point rather than growing from its own midpoint. */
const buildRoad = (spec: RoadSpec, index: number): BuiltRoad => {
  const pivot = new THREE.Group();
  pivot.rotation.y = THREE.MathUtils.degToRad(spec.angleDeg);

  const geometry = new THREE.BoxGeometry(spec.length, 0.05, 0.9);
  geometry.translate(spec.length / 2, 0, 0);
  const mesh = new THREE.LineSegments(
    new THREE.EdgesGeometry(geometry),
    new THREE.LineBasicMaterial({ color: COLOR.line, transparent: true, opacity: 0.5 }),
  );
  mesh.scale.x = 0.0001;
  pivot.add(mesh);
  geometry.dispose();

  return { pivot, mesh, length: spec.length, delay: index * ROAD_ASSEMBLE_STAGGER_S };
};

const BRIDGE_POSITION: [number, number, number] = [1.5, 0, -3.2];
const CABLE_COUNT_PER_SIDE = 4;
const CABLE_ASSEMBLE_START_S = 1.4;
const CABLE_ASSEMBLE_STAGGER_S = 0.18;
const CABLE_ASSEMBLE_DURATION_S = 0.7;

interface BuiltBridge {
  group: THREE.Group;
  cables: THREE.Line[];
  cableDelays: number[];
}

const buildBridge = (): BuiltBridge => {
  const group = new THREE.Group();
  group.position.set(...BRIDGE_POSITION);

  const deckGeometry = new THREE.BoxGeometry(7.2, 0.12, 0.9);
  const deck = new THREE.LineSegments(
    new THREE.EdgesGeometry(deckGeometry),
    new THREE.LineBasicMaterial({ color: COLOR.glow, transparent: true, opacity: 0.7 }),
  );
  deck.position.y = 1.6;
  group.add(deck);
  deckGeometry.dispose();

  const pylonGeometry = new THREE.CylinderGeometry(0.07, 0.09, 3.4, 8);
  const pylon = new THREE.LineSegments(
    new THREE.EdgesGeometry(pylonGeometry),
    new THREE.LineBasicMaterial({ color: COLOR.line, transparent: true, opacity: 0.55 }),
  );
  pylon.position.set(0, 1.6, 0);
  group.add(pylon);
  pylonGeometry.dispose();

  // Cables start fully transparent and fade in one at a time (staggered by
  // `cableDelays`, read in `update()`) — the cable-stay "attaching
  // sequentially" the spec calls for.
  const cableTop = new THREE.Vector3(0, 3.2, 0);
  const cables: THREE.Line[] = [];
  const cableDelays: number[] = [];
  let cableIndex = 0;
  for (const side of [-1, 1]) {
    for (let i = 0; i < CABLE_COUNT_PER_SIDE; i++) {
      const deckX = side * (0.6 + i * 0.85);
      const geometry = new THREE.BufferGeometry().setFromPoints([
        cableTop,
        new THREE.Vector3(deckX, 1.66, 0),
      ]);
      const cable = new THREE.Line(
        geometry,
        new THREE.LineBasicMaterial({ color: COLOR.ink, transparent: true, opacity: 0 }),
      );
      group.add(cable);
      cables.push(cable);
      cableDelays.push(CABLE_ASSEMBLE_START_S + cableIndex * CABLE_ASSEMBLE_STAGGER_S);
      cableIndex++;
    }
  }

  return { group, cables, cableDelays };
};

interface BuiltCrane {
  group: THREE.Group;
  jibGroup: THREE.Group;
  hook: THREE.Group;
  swingSpeed: number;
  phase: number;
}

/** A tower crane — mast, a jib pivoting independently at the mast top (swings
 * continuously), and a hook that bobs up and down carrying a small beam,
 * reading as the crane placing beams into the site below. */
const buildCrane = (
  position: [number, number, number],
  scale: number,
  swingSpeed: number,
  phase: number,
): BuiltCrane => {
  const group = new THREE.Group();
  group.position.set(...position);
  group.scale.setScalar(scale);

  const material = new THREE.LineBasicMaterial({ color: COLOR.line, transparent: true, opacity: 0.45 });

  const mastGeometry = new THREE.CylinderGeometry(0.05, 0.05, 5, 6);
  const mast = new THREE.LineSegments(new THREE.EdgesGeometry(mastGeometry), material);
  mast.position.y = 2.5;
  group.add(mast);
  mastGeometry.dispose();

  const jibGroup = new THREE.Group();
  jibGroup.position.y = 4.9;
  group.add(jibGroup);

  const jibGeometry = new THREE.BoxGeometry(4, 0.07, 0.07);
  const jib = new THREE.LineSegments(new THREE.EdgesGeometry(jibGeometry), material);
  jib.position.x = 1.8;
  jibGroup.add(jib);

  const counterJib = new THREE.LineSegments(new THREE.EdgesGeometry(jibGeometry), material);
  counterJib.scale.set(0.35, 1, 1);
  counterJib.position.x = -0.9;
  jibGroup.add(counterJib);
  jibGeometry.dispose();

  const hook = new THREE.Group();
  hook.position.set(3.2, -0.4, 0);
  jibGroup.add(hook);

  const hookLineGeometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, -1.6, 0),
  ]);
  hook.add(new THREE.Line(hookLineGeometry, material));

  const beamGeometry = new THREE.BoxGeometry(1.1, 0.14, 0.14);
  const beam = new THREE.LineSegments(
    new THREE.EdgesGeometry(beamGeometry),
    new THREE.LineBasicMaterial({ color: COLOR.glow, transparent: true, opacity: 0.6 }),
  );
  beam.position.y = -1.6;
  hook.add(beam);
  beamGeometry.dispose();

  return { group, jibGroup, hook, swingSpeed, phase };
};

const CAR_ROAD_INDICES = [0, 3];
const CAR_SPEED = 0.35;

interface BuiltCar {
  mesh: THREE.LineSegments;
  roadIndex: number;
  phase: number;
}

/** A minimal low-poly car — a single small box, added directly into its
 * road's own pivot group so it inherits that road's rotation for free and
 * only needs a local-x position to move along the road. */
const buildCar = (roadIndex: number, phase: number): BuiltCar => {
  const geometry = new THREE.BoxGeometry(0.32, 0.14, 0.16);
  const mesh = new THREE.LineSegments(
    new THREE.EdgesGeometry(geometry),
    new THREE.LineBasicMaterial({ color: COLOR.white, transparent: true, opacity: 0 }),
  );
  geometry.dispose();
  return { mesh, roadIndex, phase };
};

const buildTopographicPointCloud = (count: number): THREE.Points => {
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

const TILT_MAX_RAD = THREE.MathUtils.degToRad(20);
const PULLBACK_DURATION_S = 3.2;

export const createCorridorGradingScene = (container: HTMLElement): HeroSceneHandle =>
  createHeroSceneRuntime(
    container,
    { cameraPosition: [6.5, 3.8, 9.5], cameraLookAt: [0, 0.6, -1] },
    () => {
      // Mobile never reaches this builder (HeroScene skips WebGL below that
      // tier) — this is really just a tablet/desktop split, same as the
      // stormwater scene's terrain/rain counts.
      const pointCount = getDeviceTier(container.clientWidth) === "desktop" ? 900 : 450;

      const scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(COLOR.background, 0.045);

      // Everything the cursor-tilt/load-pullback treatment below applies to,
      // as one group — including the roads' own pivot groups.
      const worldGroup = new THREE.Group();
      scene.add(worldGroup);

      const roads = ROADS.map((spec, i) => buildRoad(spec, i));
      roads.forEach((road) => worldGroup.add(road.pivot));

      const bridge = buildBridge();
      worldGroup.add(bridge.group);

      const cranes = [
        buildCrane([-3.6, -0.1, -4.5], 0.9, 0.5, 0),
        buildCrane([4.2, -0.1, 2.6], 0.65, 0.65, 2.1),
      ];
      cranes.forEach((crane) => worldGroup.add(crane.group));

      const cars = CAR_ROAD_INDICES.map((roadIndex, i) => buildCar(roadIndex, i * Math.PI));
      cars.forEach((car) => roads[car.roadIndex].pivot.add(car.mesh));

      const points = buildTopographicPointCloud(pointCount);
      scene.add(points);

      const update = (elapsedSeconds: number, pointer: { x: number; y: number }, scrollProgress: number) => {
        // No camera access from here (the runtime owns it) — a load-in
        // "pull back" is faked by easing the whole world's scale down from a
        // closer-looking 1.22x to 1x, which reads the same as a camera dolly
        // out without needing to reach into the shared runtime for it.
        const pullbackEase = easeOutCubic(Math.min(1, elapsedSeconds / PULLBACK_DURATION_S));
        worldGroup.scale.setScalar(1.22 - pullbackEase * 0.22);

        // Cursor tilt — layered on top of the runtime's own subtle camera
        // parallax, not a replacement for it.
        worldGroup.rotation.y = pointer.x * TILT_MAX_RAD + Math.sin(elapsedSeconds * 0.05) * 0.05;
        worldGroup.rotation.x = -pointer.y * TILT_MAX_RAD * 0.5;

        // Scroll both deepens the reveal (boosts road/cable assembly beyond
        // wherever their own timers have reached) and pulls the site nearer.
        worldGroup.position.z = scrollProgress * -1.4;

        for (const road of roads) {
          const timeProgress = Math.max(0, Math.min(1, (elapsedSeconds - road.delay) / ROAD_ASSEMBLE_DURATION_S));
          road.mesh.scale.x = Math.max(0.0001, easeOutCubic(timeProgress), scrollProgress * 0.9);
        }

        bridge.cables.forEach((cable, i) => {
          const t = Math.max(0, Math.min(1, (elapsedSeconds - bridge.cableDelays[i]) / CABLE_ASSEMBLE_DURATION_S));
          (cable.material as THREE.LineBasicMaterial).opacity = easeOutCubic(t) * 0.55;
        });

        for (const crane of cranes) {
          crane.jibGroup.rotation.y = Math.sin(elapsedSeconds * crane.swingSpeed + crane.phase) * 0.5;
          const bob = Math.sin(elapsedSeconds * crane.swingSpeed * 1.3 + crane.phase) * 0.5 + 0.5;
          crane.hook.position.y = -0.4 - bob * 1.1;
        }

        for (const car of cars) {
          const road = roads[car.roadIndex];
          const visibleLength = road.length * road.mesh.scale.x;
          const material = car.mesh.material as THREE.LineBasicMaterial;
          if (visibleLength < 1) {
            material.opacity = 0;
            continue;
          }
          const t = Math.sin(elapsedSeconds * CAR_SPEED + car.phase) * 0.5 + 0.5;
          car.mesh.position.x = t * (visibleLength - 0.4) + 0.2;
          car.mesh.position.y = 0.1;
          material.opacity = 0.7;
        }

        const resolvePhase = (elapsedSeconds % 9) / 9;
        (points.material as THREE.PointsMaterial).opacity = Math.sin(resolvePhase * Math.PI) * 0.4;
        points.rotation.y += 0.0004;
      };

      return { scene, update, dispose: () => disposeSceneObjects(scene) };
    },
  );
