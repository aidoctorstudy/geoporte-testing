/**
 * Hero scene for the Design & Drafting service page — a drafting volume
 * where two overlapping BIM models dissolve between solid and wireframe,
 * clash-detection markers flare where they intersect, and drawing sheets
 * hover as thin translucent planes. See `sceneSummary` in `services.ts`.
 */
import * as THREE from "three";
import { HERO_SCENE_COLORS as COLOR } from "../hero-scene-colors";
import { disposeSceneObjects } from "@/lib/scene/shared-viewport-renderer";
import { createHeroSceneRuntime } from "./hero-scene-runtime";
import type { HeroSceneHandle } from "../hero-scene-types";

interface DissolvingVolume {
  solid: THREE.Mesh;
  wireframe: THREE.LineSegments;
}

const buildDissolvingVolume = (
  size: [number, number, number],
  position: [number, number, number],
  rotationY: number,
): DissolvingVolume => {
  const geometry = new THREE.BoxGeometry(...size);

  const solid = new THREE.Mesh(
    geometry,
    new THREE.MeshBasicMaterial({ color: COLOR.line, transparent: true, opacity: 0.08 }),
  );
  solid.position.set(...position);
  solid.rotation.y = rotationY;

  const wireframe = new THREE.LineSegments(
    new THREE.WireframeGeometry(geometry),
    new THREE.LineBasicMaterial({ color: COLOR.glow, transparent: true, opacity: 0 }),
  );
  wireframe.position.copy(solid.position);
  wireframe.rotation.y = rotationY;

  return { solid, wireframe };
};

const buildClashMarkers = (points: Array<[number, number, number]>): THREE.Mesh[] => {
  const geometry = new THREE.IcosahedronGeometry(0.1, 1);
  return points.map(([x, y, z]) => {
    const marker = new THREE.Mesh(
      geometry,
      new THREE.MeshBasicMaterial({ color: COLOR.glow, transparent: true, opacity: 0.8 }),
    );
    marker.position.set(x, y, z);
    return marker;
  });
};

const buildDrawingSheets = (): THREE.LineSegments[] => {
  const geometry = new THREE.EdgesGeometry(new THREE.PlaneGeometry(1.6, 1.1));
  return [-1, 0, 1].map((i) => {
    const sheet = new THREE.LineSegments(
      geometry,
      new THREE.LineBasicMaterial({ color: COLOR.ink, transparent: true, opacity: 0.35 }),
    );
    sheet.position.set(i * 0.6, 0.4, 1.4 + i * 0.3);
    sheet.rotation.y = 0.15;
    return sheet;
  });
};

export const createBimClashDetectionScene = (container: HTMLElement): HeroSceneHandle =>
  createHeroSceneRuntime(
    container,
    { cameraPosition: [2.6, 1.4, 5.2], cameraLookAt: [0, 0.2, 0], driftScale: 0.2 },
    () => {
      const scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(COLOR.background, 0.05);

      const structure = buildDissolvingVolume([2.4, 1.6, 1.4], [-0.4, 0, 0], 0);
      const services = buildDissolvingVolume([1.3, 2.2, 1.3], [0.6, 0.1, 0.3], 0.5);
      [structure, services].forEach(({ solid, wireframe }) => {
        scene.add(solid);
        scene.add(wireframe);
      });

      const markers = buildClashMarkers([
        [0.15, 0.5, 0.1],
        [-0.1, -0.3, 0.4],
        [0.4, 0.9, -0.1],
      ]);
      markers.forEach((marker) => scene.add(marker));

      const sheets = buildDrawingSheets();
      sheets.forEach((sheet) => scene.add(sheet));

      const update = (elapsedSeconds: number) => {
        const dissolve = Math.sin(elapsedSeconds * 0.6) * 0.5 + 0.5;
        [structure, services].forEach(({ solid, wireframe }) => {
          (solid.material as THREE.MeshBasicMaterial).opacity = 0.1 * (1 - dissolve);
          (wireframe.material as THREE.LineBasicMaterial).opacity = 0.55 * dissolve;
        });

        markers.forEach((marker, i) => {
          const pulse = Math.sin(elapsedSeconds * 2 + i) * 0.5 + 0.5;
          marker.scale.setScalar(0.7 + pulse * 0.5);
          (marker.material as THREE.MeshBasicMaterial).opacity = 0.5 + pulse * 0.4;
        });

        sheets.forEach((sheet, i) => {
          sheet.position.y = 0.4 + Math.sin(elapsedSeconds * 0.8 + i) * 0.12;
        });
      };

      return { scene, update, dispose: () => disposeSceneObjects(scene) };
    },
  );
