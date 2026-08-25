/**
 * Hero scene for the Advisory Services page — a rotating wireframe globe
 * reusing the exact lat/lon projection and country list the Stats section's
 * `world-globe.ts` mini scene already uses (Geoporte's seven real project
 * countries), with a glowing pin at each, curved hub-and-spoke arcs radiating
 * from Australia to every other country with a moving dot travelling each
 * path, and a soft atmosphere rim glow via a larger back-facing translucent
 * sphere (the cheap depth-ordering trick — no shader needed). Cursor
 * movement adds a rotation offset on top of the globe's own ambient spin;
 * scroll zooms the whole globe in. See `sceneSummary` in
 * `data/mocks/services.ts`.
 */
import * as THREE from "three";
import { HERO_SCENE_COLORS as COLOR } from "../hero-scene-colors";
import { PROJECT_LOCATIONS, latLonToVector3 } from "../world-globe";
import { disposeSceneObjects } from "@/lib/scene/shared-viewport-renderer";
import { createHeroSceneRuntime } from "./hero-scene-runtime";
import type { HeroSceneHandle } from "../hero-scene-types";

const GLOBE_RADIUS = 2.2;
const RIM_RADIUS = GLOBE_RADIUS * 1.12;
const AUTO_SPIN_SPEED = 0.05;
const CURSOR_ROTATION_MAX = THREE.MathUtils.degToRad(35);
const ARC_LIFT = 0.55;

interface GlobePin {
  mesh: THREE.Mesh;
  phase: number;
}

const buildPin = (position: THREE.Vector3, phase: number): GlobePin => {
  const geometry = new THREE.IcosahedronGeometry(0.06, 1);
  const mesh = new THREE.Mesh(
    geometry,
    new THREE.MeshBasicMaterial({ color: COLOR.glow, transparent: true, opacity: 0.85 }),
  );
  mesh.position.copy(position);
  geometry.dispose();
  return { mesh, phase };
};

interface Arc {
  curve: THREE.CatmullRomCurve3;
  line: THREE.Line;
  dot: THREE.Mesh;
  phase: number;
}

/** A single hub-and-spoke arc — three points (start, an outward-lifted
 * midpoint, end) lofted into a `CatmullRomCurve3` so it bulges up off the
 * globe's surface rather than cutting straight through it. */
const buildArc = (from: THREE.Vector3, to: THREE.Vector3, phase: number): Arc => {
  const mid = from.clone().add(to).multiplyScalar(0.5);
  const liftedMid = mid.clone().normalize().multiplyScalar(mid.length() + ARC_LIFT);
  const curve = new THREE.CatmullRomCurve3([from, liftedMid, to]);
  const points = curve.getPoints(32);

  const line = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(points),
    new THREE.LineBasicMaterial({
      color: COLOR.glow,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );

  const dotGeometry = new THREE.IcosahedronGeometry(0.035, 0);
  const dot = new THREE.Mesh(
    dotGeometry,
    new THREE.MeshBasicMaterial({ color: COLOR.white, transparent: true, opacity: 0.9 }),
  );
  dotGeometry.dispose();

  return { curve, line, dot, phase };
};

const buildRimGlow = (): THREE.Mesh => {
  const geometry = new THREE.SphereGeometry(RIM_RADIUS, 32, 24);
  const mesh = new THREE.Mesh(
    geometry,
    new THREE.MeshBasicMaterial({
      color: COLOR.glow,
      transparent: true,
      opacity: 0.14,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  geometry.dispose();
  return mesh;
};

export const createAdvisoryLifecycleNetworkScene = (container: HTMLElement): HeroSceneHandle =>
  createHeroSceneRuntime(
    container,
    { cameraPosition: [0, 0.9, 7.2], cameraLookAt: [0, 0, 0] },
    () => {
      const scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(COLOR.background, 0.04);

      const globeGroup = new THREE.Group();
      globeGroup.rotation.x = 0.15;
      scene.add(globeGroup);

      const sphereGeometry = new THREE.SphereGeometry(GLOBE_RADIUS, 32, 22);
      const globe = new THREE.LineSegments(
        new THREE.WireframeGeometry(sphereGeometry),
        new THREE.LineBasicMaterial({ color: COLOR.line, transparent: true, opacity: 0.3 }),
      );
      globeGroup.add(globe);
      sphereGeometry.dispose();

      globeGroup.add(buildRimGlow());

      const points = PROJECT_LOCATIONS.map(({ lat, lon }) => latLonToVector3(lat, lon, GLOBE_RADIUS));
      const pins = points.map((point, i) => buildPin(point, i));
      pins.forEach(({ mesh }) => globeGroup.add(mesh));

      const hub = points[0];
      const arcs = points.slice(1).map((point, i) => buildArc(hub, point, i * 1.6));
      arcs.forEach(({ line, dot }) => {
        globeGroup.add(line);
        globeGroup.add(dot);
      });

      const update = (elapsedSeconds: number, pointer: { x: number; y: number }, scrollProgress: number) => {
        globeGroup.rotation.y = elapsedSeconds * AUTO_SPIN_SPEED + pointer.x * CURSOR_ROTATION_MAX;
        globeGroup.rotation.x = 0.15 - pointer.y * CURSOR_ROTATION_MAX * 0.4;
        globeGroup.scale.setScalar(1 + scrollProgress * 0.4);

        pins.forEach(({ mesh, phase }) => {
          const pulse = Math.sin(elapsedSeconds * 1.2 + phase) * 0.5 + 0.5;
          mesh.scale.setScalar(0.8 + pulse * 0.6);
          (mesh.material as THREE.MeshBasicMaterial).opacity = 0.55 + pulse * 0.4;
        });

        arcs.forEach(({ curve, dot, phase }) => {
          const t = (elapsedSeconds * 0.15 + phase) % 1;
          dot.position.copy(curve.getPointAt(t));
        });
      };

      return { scene, update, dispose: () => disposeSceneObjects(scene) };
    },
  );
