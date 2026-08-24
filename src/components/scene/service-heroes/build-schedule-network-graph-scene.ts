/**
 * Hero scene for the Project Control Services page — an abstract 3D critical-
 * path network: activity nodes in a loose lattice, precedence links, an
 * S-curve ribbon swept by progress markers, nodes brightening in sequence.
 * See `sceneSummary` in `services.ts`.
 */
import * as THREE from "three";
import { HERO_SCENE_COLORS as COLOR } from "../hero-scene-colors";
import { disposeSceneObjects } from "@/lib/scene/shared-viewport-renderer";
import { createHeroSceneRuntime } from "./hero-scene-runtime";
import type { HeroSceneHandle } from "../hero-scene-types";

const NODE_COUNT = 14;
const REVEAL_LOOP_SECONDS = 8;

const buildNodePositions = (): THREE.Vector3[] =>
  Array.from({ length: NODE_COUNT }, (_, i) => {
    const col = i % 5;
    const row = Math.floor(i / 5);
    return new THREE.Vector3(
      (col - 2) * 1.05,
      row * 0.75 - 0.75,
      Math.sin(i * 1.7) * 0.7,
    );
  });

const buildEdges = (positions: THREE.Vector3[]): [number, number][] => {
  const edges: [number, number][] = [];
  for (let i = 0; i < positions.length - 1; i++) edges.push([i, i + 1]);
  for (let i = 0; i < positions.length - 3; i += 3) edges.push([i, i + 3]);
  return edges;
};

const buildSCurve = (): THREE.CatmullRomCurve3 =>
  new THREE.CatmullRomCurve3([
    new THREE.Vector3(-3.2, -1.1, 0.3),
    new THREE.Vector3(-2, -1, 0.1),
    new THREE.Vector3(-0.8, -0.5, -0.1),
    new THREE.Vector3(0, 0.1, 0),
    new THREE.Vector3(0.8, 0.7, 0.1),
    new THREE.Vector3(2, 1, -0.1),
    new THREE.Vector3(3.2, 1.1, -0.3),
  ]);

export const createScheduleNetworkGraphScene = (container: HTMLElement): HeroSceneHandle =>
  createHeroSceneRuntime(
    container,
    { cameraPosition: [1.5, 1.4, 7.5], cameraLookAt: [0, 0, 0] },
    () => {
      const scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(COLOR.background, 0.04);

      const positions = buildNodePositions();
      const nodeGeometry = new THREE.IcosahedronGeometry(0.08, 0);
      const nodes = positions.map((position) => {
        const node = new THREE.Mesh(
          nodeGeometry,
          new THREE.MeshBasicMaterial({ color: COLOR.glow, transparent: true, opacity: 0 }),
        );
        node.position.copy(position);
        scene.add(node);
        return node;
      });

      const edgeMaterial = new THREE.LineBasicMaterial({ color: COLOR.line, transparent: true, opacity: 0.35 });
      buildEdges(positions).forEach(([a, b]) => {
        const geometry = new THREE.BufferGeometry().setFromPoints([positions[a], positions[b]]);
        scene.add(new THREE.Line(geometry, edgeMaterial));
      });

      const curve = buildSCurve();
      const tubeGeometry = new THREE.TubeGeometry(curve, 64, 0.018, 6, false);
      const ribbon = new THREE.Mesh(
        tubeGeometry,
        new THREE.MeshBasicMaterial({ color: COLOR.glow, transparent: true, opacity: 0.6 }),
      );
      scene.add(ribbon);

      const markerGeometry = new THREE.IcosahedronGeometry(0.05, 0);
      const markers = [0, 0.33, 0.66].map((phase) => {
        const marker = new THREE.Mesh(
          markerGeometry,
          new THREE.MeshBasicMaterial({ color: COLOR.white, transparent: true, opacity: 0.9 }),
        );
        scene.add(marker);
        return { marker, phase };
      });

      const update = (elapsedSeconds: number) => {
        const cycle = elapsedSeconds % REVEAL_LOOP_SECONDS;
        nodes.forEach((node, i) => {
          const progress = Math.min(1, Math.max(0, cycle * 3 - i * 0.5));
          (node.material as THREE.MeshBasicMaterial).opacity = progress * 0.9;
          node.scale.setScalar(0.7 + progress * 0.5);
        });

        markers.forEach(({ marker, phase }) => {
          const t = (elapsedSeconds * 0.08 + phase) % 1;
          marker.position.copy(curve.getPointAt(t));
        });

        ribbon.rotation.z = Math.sin(elapsedSeconds * 0.1) * 0.02;
      };

      return {
        scene,
        update,
        dispose: () => {
          disposeSceneObjects(scene);
          nodeGeometry.dispose();
          markerGeometry.dispose();
        },
      };
    },
  );
