/**
 * Mini scene for the Stats section — a slowly rotating wireframe globe with
 * glowing pins at the seven countries the project list (`data/mocks/projects`)
 * has delivered work in. Registers against the shared viewport renderer — see
 * `src/lib/scene/shared-viewport-renderer.ts`.
 */
import * as THREE from "three";
import type { ViewportBuild, ViewportBuilder } from "@/lib/scene/shared-viewport-renderer";
import { disposeSceneObjects } from "@/lib/scene/shared-viewport-renderer";
import { HERO_SCENE_COLORS as COLOR } from "./hero-scene-colors";

/** Representative lat/lon for each country the project list covers. */
const PROJECT_LOCATIONS: Array<{ country: string; lat: number; lon: number }> = [
  { country: "Australia", lat: -35.3, lon: 149.1 },
  { country: "New Zealand", lat: -41.29, lon: 174.78 },
  { country: "UAE", lat: 24.45, lon: 54.38 },
  { country: "India", lat: 28.61, lon: 77.21 },
  { country: "United Kingdom", lat: 51.51, lon: -0.13 },
  { country: "Saudi Arabia", lat: 24.71, lon: 46.68 },
  { country: "Pakistan", lat: 24.86, lon: 67.01 },
];

const GLOBE_RADIUS = 1.4;

const latLonToVector3 = (lat: number, lon: number, radius: number): THREE.Vector3 => {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  );
};

export const buildWorldGlobe: ViewportBuilder = (aspect): ViewportBuild => {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, aspect, 0.1, 20);
  camera.position.set(0, 0.6, 4.2);
  camera.lookAt(0, 0, 0);

  const group = new THREE.Group();
  scene.add(group);

  const sphereGeometry = new THREE.SphereGeometry(GLOBE_RADIUS, 24, 16);
  const globe = new THREE.LineSegments(
    new THREE.WireframeGeometry(sphereGeometry),
    new THREE.LineBasicMaterial({ color: COLOR.line, transparent: true, opacity: 0.32 }),
  );
  group.add(globe);

  const pinGeometry = new THREE.IcosahedronGeometry(0.045, 1);
  const pins = PROJECT_LOCATIONS.map(({ lat, lon }, i) => {
    const position = latLonToVector3(lat, lon, GLOBE_RADIUS);
    const material = new THREE.MeshBasicMaterial({
      color: COLOR.glow,
      transparent: true,
      opacity: 0.85,
    });
    const pin = new THREE.Mesh(pinGeometry, material);
    pin.position.copy(position);
    group.add(pin);
    return { pin, material, phase: i };
  });

  const update = (elapsedSeconds: number, control: number) => {
    group.rotation.y = elapsedSeconds * (0.08 + control * 0.05);
    group.rotation.x = 0.15;

    pins.forEach(({ pin, material, phase }) => {
      const pulse = Math.sin(elapsedSeconds * 1.2 + phase) * 0.5 + 0.5;
      pin.scale.setScalar(0.8 + pulse * 0.6);
      material.opacity = 0.55 + pulse * 0.4;
    });
  };

  const dispose = () => disposeSceneObjects(scene);

  return { scene, camera, update, dispose };
};
