/**
 * Hero scene for the Telecom Services page — a transmission tower with an
 * in-building node grid off to one side, expanding spherical coverage
 * shells, static RF paths linking tower to nodes, and a slow radar-style
 * sweep. See `sceneSummary` in `services.ts`.
 */
import * as THREE from "three";
import { HERO_SCENE_COLORS as COLOR } from "../hero-scene-colors";
import { disposeSceneObjects } from "@/lib/scene/shared-viewport-renderer";
import { createHeroSceneRuntime } from "./hero-scene-runtime";
import type { HeroSceneHandle } from "../hero-scene-types";

const buildTower = (): THREE.Group => {
  const group = new THREE.Group();
  const material = new THREE.LineBasicMaterial({ color: COLOR.line, transparent: true, opacity: 0.6 });

  const mastGeometry = new THREE.CylinderGeometry(0.03, 0.06, 3.2, 6);
  const mast = new THREE.LineSegments(new THREE.EdgesGeometry(mastGeometry), material);
  mast.position.y = 1.6;
  group.add(mast);
  mastGeometry.dispose();

  const armGeometry = new THREE.BoxGeometry(0.9, 0.04, 0.04);
  const armEdges = new THREE.EdgesGeometry(armGeometry);
  [2.4, 2.7].forEach((y, i) => {
    const arm = new THREE.LineSegments(armEdges, material);
    arm.position.set(i % 2 === 0 ? 0.3 : -0.3, y, 0);
    group.add(arm);
  });
  armGeometry.dispose();

  return group;
};

const buildInBuildingNodes = (): THREE.Points => {
  const layers = 3;
  const perLayer = 9;
  const positions = new Float32Array(layers * perLayer * 3);
  let idx = 0;
  for (let l = 0; l < layers; l++) {
    for (let n = 0; n < perLayer; n++) {
      const col = n % 3;
      const row = Math.floor(n / 3);
      positions[idx++] = 3.2 + col * 0.4;
      positions[idx++] = l * 0.5 + 0.2;
      positions[idx++] = row * 0.4 - 0.4;
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    color: COLOR.glow,
    size: 0.05,
    transparent: true,
    opacity: 0.65,
    sizeAttenuation: true,
  });
  return new THREE.Points(geometry, material);
};

export const createTelecomSignalNetworkScene = (container: HTMLElement): HeroSceneHandle =>
  createHeroSceneRuntime(
    container,
    { cameraPosition: [3, 2.2, 6.8], cameraLookAt: [1.5, 1, 0] },
    () => {
      const scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(COLOR.background, 0.045);

      scene.add(buildTower());

      const nodes = buildInBuildingNodes();
      scene.add(nodes);

      const rfMaterial = new THREE.LineBasicMaterial({ color: COLOR.ink, transparent: true, opacity: 0.3 });
      const rfGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 1.6, 0),
        new THREE.Vector3(3.6, 0.7, 0),
      ]);
      scene.add(new THREE.Line(rfGeometry, rfMaterial));

      const shellGeometry = new THREE.SphereGeometry(1, 14, 10);
      const shells = [0, 1, 2].map((i) => {
        const shell = new THREE.LineSegments(
          new THREE.WireframeGeometry(shellGeometry),
          new THREE.LineBasicMaterial({ color: COLOR.glow, transparent: true, opacity: 0 }),
        );
        shell.position.y = 1.6;
        scene.add(shell);
        return { shell, phase: i / 3 };
      });

      const sweepGeometry = new THREE.EdgesGeometry(new THREE.RingGeometry(0.3, 3.2, 24, 1, 0, Math.PI / 6));
      const sweep = new THREE.LineSegments(
        sweepGeometry,
        new THREE.LineBasicMaterial({ color: COLOR.glow, transparent: true, opacity: 0.3 }),
      );
      sweep.rotation.x = -Math.PI / 2;
      sweep.position.y = 1.6;
      scene.add(sweep);

      const update = (elapsedSeconds: number) => {
        shells.forEach(({ shell, phase }) => {
          const shellPhase = (elapsedSeconds * 0.18 + phase) % 1;
          const scale = 0.2 + shellPhase * 3.4;
          shell.scale.setScalar(scale);
          (shell.material as THREE.LineBasicMaterial).opacity = (1 - shellPhase) * 0.4;
        });

        sweep.rotation.z = elapsedSeconds * 0.3;
        nodes.rotation.y = Math.sin(elapsedSeconds * 0.2) * 0.05;
      };

      return {
        scene,
        update,
        dispose: () => {
          disposeSceneObjects(scene);
          shellGeometry.dispose();
        },
      };
    },
  );
