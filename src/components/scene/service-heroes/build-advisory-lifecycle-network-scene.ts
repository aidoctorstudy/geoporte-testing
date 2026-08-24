/**
 * Hero scene for the Advisory Services page — a rotating knowledge-network:
 * a wireframe core with four stage nodes (Plan, Design, Build, Operate)
 * around it, linked to the core and to each other, brightening in sequence
 * as a stand-in for the scroll-linked narrative described in `sceneSummary`
 * (no hero scene in this codebase takes a scroll-progress input — see
 * ADR-0027 — so the sweep runs on a time-based cycle instead).
 */
import * as THREE from "three";
import { HERO_SCENE_COLORS as COLOR } from "../hero-scene-colors";
import { disposeSceneObjects } from "@/lib/scene/shared-viewport-renderer";
import { createHeroSceneRuntime } from "./hero-scene-runtime";
import type { HeroSceneHandle } from "../hero-scene-types";

const STAGE_COUNT = 4;
const STAGE_RADIUS = 1.7;
const STAGE_SECONDS = 3;

export const createAdvisoryLifecycleNetworkScene = (container: HTMLElement): HeroSceneHandle =>
  createHeroSceneRuntime(
    container,
    { cameraPosition: [0, 0.8, 6.4], cameraLookAt: [0, 0, 0] },
    () => {
      const scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(COLOR.background, 0.045);

      const group = new THREE.Group();
      scene.add(group);

      const core = new THREE.LineSegments(
        new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(1.15, 1)),
        new THREE.LineBasicMaterial({ color: COLOR.line, transparent: true, opacity: 0.45 }),
      );
      group.add(core);

      const stagePositions = Array.from({ length: STAGE_COUNT }, (_, i) => {
        const angle = (i / STAGE_COUNT) * Math.PI * 2;
        return new THREE.Vector3(Math.cos(angle) * STAGE_RADIUS, Math.sin(angle * 0.6) * 0.3, Math.sin(angle) * STAGE_RADIUS);
      });

      const nodeGeometry = new THREE.IcosahedronGeometry(0.13, 1);
      const stageNodes = stagePositions.map((position) => {
        const node = new THREE.Mesh(
          nodeGeometry,
          new THREE.MeshBasicMaterial({ color: COLOR.glow, transparent: true, opacity: 0.55 }),
        );
        node.position.copy(position);
        group.add(node);
        return node;
      });

      const spokeLinks = stagePositions.map((position) => {
        const geometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), position]);
        const line = new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: COLOR.glow, transparent: true, opacity: 0.2 }));
        group.add(line);
        return line;
      });

      const ringLinks = stagePositions.map((position, i) => {
        const next = stagePositions[(i + 1) % STAGE_COUNT];
        const geometry = new THREE.BufferGeometry().setFromPoints([position, next]);
        const line = new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: COLOR.ink, transparent: true, opacity: 0.2 }));
        group.add(line);
        return line;
      });

      const update = (elapsedSeconds: number) => {
        group.rotation.y = elapsedSeconds * 0.06;
        core.rotation.y = -elapsedSeconds * 0.03;

        const activeStage = Math.floor(elapsedSeconds / STAGE_SECONDS) % STAGE_COUNT;
        stageNodes.forEach((node, i) => {
          const active = i === activeStage;
          const pulse = Math.sin(elapsedSeconds * 1.5 + i) * 0.5 + 0.5;
          (node.material as THREE.MeshBasicMaterial).opacity = active ? 0.7 + pulse * 0.3 : 0.35;
          node.scale.setScalar(active ? 1 + pulse * 0.25 : 0.85);
        });
        spokeLinks.forEach((line, i) => {
          (line.material as THREE.LineBasicMaterial).opacity = i === activeStage ? 0.7 : 0.15;
        });
        ringLinks.forEach((line, i) => {
          const connectsActive = i === activeStage || (i + 1) % STAGE_COUNT === activeStage;
          (line.material as THREE.LineBasicMaterial).opacity = connectsActive ? 0.5 : 0.12;
        });
      };

      return {
        scene,
        update,
        dispose: () => {
          disposeSceneObjects(scene);
          nodeGeometry.dispose();
        },
      };
    },
  );
