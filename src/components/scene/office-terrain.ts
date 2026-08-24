/**
 * Mini scene for the Contact section — a stylised wireframe terrain with a
 * glowing marker for each Geoporte office, spread left-to-right in roughly
 * their real west-to-east order (Perth → Melbourne → Sydney → Auckland).
 * Registers against the shared viewport renderer — see
 * `src/lib/scene/shared-viewport-renderer.ts`.
 */
import * as THREE from "three";
import type { ViewportBuild, ViewportBuilder } from "@/lib/scene/shared-viewport-renderer";
import { disposeSceneObjects } from "@/lib/scene/shared-viewport-renderer";
import { HERO_SCENE_COLORS as COLOR } from "./hero-scene-colors";

interface OfficeMarker {
  city: string;
  x: number;
  z: number;
}

const OFFICE_MARKERS: OfficeMarker[] = [
  { city: "Perth", x: -3.4, z: 0.4 },
  { city: "Melbourne", x: -0.2, z: 1.1 },
  { city: "Sydney", x: 1.1, z: 0.2 },
  { city: "Auckland", x: 3.6, z: -0.6 },
];

const buildTerrainMesh = (): { mesh: THREE.LineSegments; heightAt: (x: number, z: number) => number } => {
  const geometry = new THREE.PlaneGeometry(11, 4.5, 32, 14);
  geometry.rotateX(-Math.PI / 2);
  const position = geometry.attributes.position;
  const heightAt = (x: number, z: number) =>
    Math.sin(x * 0.5) * 0.15 + Math.cos(z * 0.7) * 0.12;

  for (let i = 0; i < position.count; i++) {
    position.setY(i, heightAt(position.getX(i), position.getZ(i)));
  }
  geometry.computeVertexNormals();

  const wireframe = new THREE.WireframeGeometry(geometry);
  const material = new THREE.LineBasicMaterial({
    color: COLOR.line,
    transparent: true,
    opacity: 0.3,
  });
  geometry.dispose();
  return { mesh: new THREE.LineSegments(wireframe, material), heightAt };
};

export const buildOfficeTerrain: ViewportBuilder = (aspect): ViewportBuild => {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, aspect, 0.1, 30);
  camera.position.set(0, 3.2, 4.4);
  camera.lookAt(0, 0, 0);

  const { mesh: terrain, heightAt } = buildTerrainMesh();
  scene.add(terrain);

  const markerGeometry = new THREE.IcosahedronGeometry(0.07, 0);
  const markers = OFFICE_MARKERS.map(({ x, z }, i) => {
    const material = new THREE.MeshBasicMaterial({
      color: COLOR.glow,
      transparent: true,
      opacity: 0.85,
    });
    const marker = new THREE.Mesh(markerGeometry, material);
    marker.position.set(x, heightAt(x, z) + 0.12, z);
    scene.add(marker);
    return { marker, material, phase: i };
  });

  const update = (elapsedSeconds: number, control: number) => {
    terrain.rotation.y = Math.sin(elapsedSeconds * 0.08) * 0.06 + control * 0.05;

    markers.forEach(({ marker, material, phase }) => {
      const pulse = Math.sin(elapsedSeconds * 1.3 + phase) * 0.5 + 0.5;
      marker.scale.setScalar(0.8 + pulse * 0.5);
      material.opacity = 0.55 + pulse * 0.4;
    });
  };

  const dispose = () => disposeSceneObjects(scene);

  return { scene, camera, update, dispose };
};
