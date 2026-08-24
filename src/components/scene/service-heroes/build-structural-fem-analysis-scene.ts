/**
 * Hero scene for the Structural Engineering service page — a multi-bay
 * portal frame that ripples between a plain "realistic member" wireframe and
 * a bottom-to-top FEM stress-colour gradient, load-path arrows bouncing at
 * load points, and a laterally-swayed "deflection ghost" of the same frame
 * pulsing through it. See `sceneSummary` in `services.ts`.
 */
import * as THREE from "three";
import { HERO_SCENE_COLORS as COLOR } from "../hero-scene-colors";
import { disposeSceneObjects } from "@/lib/scene/shared-viewport-renderer";
import { createHeroSceneRuntime } from "./hero-scene-runtime";
import type { HeroSceneHandle } from "../hero-scene-types";

const BAY_WIDTH = 1.4;
const BAY_HEIGHT = 2.2;
const BAY_DEPTH = 1.4;
const BAYS = 3;

const heightFraction = (y: number) => Math.min(1, Math.max(0, (y + BAY_HEIGHT / 2) / BAY_HEIGHT));

const buildStressColoredWireframe = (geometry: THREE.BoxGeometry): THREE.BufferGeometry => {
  const wire = new THREE.WireframeGeometry(geometry);
  const position = wire.attributes.position;
  const colors = new Float32Array(position.count * 3);
  const from = new THREE.Color(COLOR.line);
  const to = new THREE.Color(COLOR.glow);
  const mixed = new THREE.Color();
  for (let i = 0; i < position.count; i++) {
    mixed.lerpColors(from, to, heightFraction(position.getY(i)));
    colors[i * 3] = mixed.r;
    colors[i * 3 + 1] = mixed.g;
    colors[i * 3 + 2] = mixed.b;
  }
  wire.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  return wire;
};

const buildGhostWireframe = (geometry: THREE.BoxGeometry, swayAmount: number): THREE.BufferGeometry => {
  const wire = new THREE.WireframeGeometry(geometry);
  const position = wire.attributes.position;
  for (let i = 0; i < position.count; i++) {
    const sway = Math.sin(heightFraction(position.getY(i)) * (Math.PI / 2)) * swayAmount;
    position.setX(i, position.getX(i) + sway);
  }
  return wire;
};

const buildLoadArrow = (): THREE.Group => {
  const group = new THREE.Group();
  const material = new THREE.LineBasicMaterial({ color: COLOR.glow, transparent: true, opacity: 0.75 });
  const shaftGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.4, 6);
  group.add(new THREE.LineSegments(new THREE.EdgesGeometry(shaftGeometry), material));
  const headGeometry = new THREE.ConeGeometry(0.08, 0.18, 6);
  const head = new THREE.LineSegments(new THREE.EdgesGeometry(headGeometry), material);
  head.position.y = -0.29;
  group.add(head);
  return group;
};

export const createStructuralFemAnalysisScene = (container: HTMLElement): HeroSceneHandle =>
  createHeroSceneRuntime(
    container,
    { cameraPosition: [4.2, 1.6, 5.6], cameraLookAt: [0.8, 0, 0] },
    () => {
      const scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(COLOR.background, 0.045);

      const bayGeometry = new THREE.BoxGeometry(BAY_WIDTH, BAY_HEIGHT, BAY_DEPTH, 2, 4, 2);
      const memberMaterial = new THREE.LineBasicMaterial({ color: COLOR.line, transparent: true, opacity: 0.4 });
      const stressMaterial = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0 });
      const ghostMaterial = new THREE.LineBasicMaterial({ color: COLOR.line, transparent: true, opacity: 0 });

      const memberGeometry = new THREE.WireframeGeometry(bayGeometry);
      const stressGeometry = buildStressColoredWireframe(bayGeometry);
      const ghostGeometry = buildGhostWireframe(bayGeometry, 0.18);

      const frameGroup = new THREE.Group();
      const stressLayers: THREE.LineSegments[] = [];
      const ghostLayers: THREE.LineSegments[] = [];
      for (let i = 0; i < BAYS; i++) {
        const x = (i - (BAYS - 1) / 2) * (BAY_WIDTH + 0.3);
        const member = new THREE.LineSegments(memberGeometry, memberMaterial);
        member.position.x = x;
        frameGroup.add(member);

        const stress = new THREE.LineSegments(stressGeometry, stressMaterial.clone());
        stress.position.x = x;
        frameGroup.add(stress);
        stressLayers.push(stress);

        const ghost = new THREE.LineSegments(ghostGeometry, ghostMaterial.clone());
        ghost.position.x = x;
        frameGroup.add(ghost);
        ghostLayers.push(ghost);
      }
      scene.add(frameGroup);

      const arrows = [-0.9, 0, 0.9].map((x) => {
        const arrow = buildLoadArrow();
        arrow.position.set(x, BAY_HEIGHT / 2 + 0.5, 0);
        scene.add(arrow);
        return arrow;
      });

      const update = (elapsedSeconds: number) => {
        const dissolve = Math.sin(elapsedSeconds * 0.5) * 0.5 + 0.5;
        memberMaterial.opacity = 0.4 * (1 - dissolve);
        stressLayers.forEach((stress) => {
          (stress.material as THREE.LineBasicMaterial).opacity = 0.6 * dissolve;
        });

        const ghostPulse = (Math.sin(elapsedSeconds * 0.4) * 0.5 + 0.5) * 0.2;
        ghostLayers.forEach((ghost) => {
          (ghost.material as THREE.LineBasicMaterial).opacity = ghostPulse;
        });

        arrows.forEach((arrow, i) => {
          arrow.position.y = BAY_HEIGHT / 2 + 0.5 + Math.sin(elapsedSeconds * 1.4 + i) * 0.08;
        });
      };

      return {
        scene,
        update,
        dispose: () => {
          disposeSceneObjects(scene);
          bayGeometry.dispose();
        },
      };
    },
  );
