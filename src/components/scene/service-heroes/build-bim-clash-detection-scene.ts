/**
 * Hero scene for the Design & Drafting service page — a blueprint sheet that
 * unrolls into view, its drafting lines drawing themselves on (a growing
 * `BufferGeometry` draw range on the same geometry that's actually rendered,
 * never a derived/re-indexed one — see ADR-0026), dimension call-outs and
 * revision-cloud annotations fading in after, cursor proximity brightening
 * nearby lines via a live vertex-colour attribute. See `sceneSummary` in
 * `data/mocks/services.ts`.
 */
import * as THREE from "three";
import { HERO_SCENE_COLORS as COLOR } from "../hero-scene-colors";
import { disposeSceneObjects } from "@/lib/scene/shared-viewport-renderer";
import { createHeroSceneRuntime } from "./hero-scene-runtime";
import type { HeroSceneHandle } from "../hero-scene-types";

const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);

const toColorArray = (hex: number): [number, number, number] => {
  const c = new THREE.Color(hex);
  return [c.r, c.g, c.b];
};

const UNROLL_DURATION_S = 2.2;

const buildBlueprintPlane = (): THREE.Mesh => {
  const geometry = new THREE.PlaneGeometry(6.4, 4.4);
  const material = new THREE.MeshBasicMaterial({
    color: COLOR.line,
    transparent: true,
    opacity: 0.05,
    side: THREE.DoubleSide,
  });
  return new THREE.Mesh(geometry, material);
};

/** A small technical floor-plan-style line network — outer wall, two
 * partitions, a corridor, door-swing ticks, roof-truss diagonals, one detail
 * line. Local-space (x,y) pairs, drawn onto the blueprint plane's face. */
const DRAFTING_SEGMENTS: Array<[number, number, number, number]> = [
  [-3, -2, 3, -2],
  [3, -2, 3, 2],
  [3, 2, -3, 2],
  [-3, 2, -3, -2],
  [-1, -2, -1, 0.4],
  [1, -2, 1, 0.4],
  [-3, 0.4, -1, 0.4],
  [1, 0.4, 3, 0.4],
  [-1, 0.4, 1, 0.4],
  [-2.4, -2, -1.8, -1.3],
  [2.4, -2, 1.8, -1.3],
  [-2, 1.2, -1, 2],
  [2, 1.2, 1, 2],
  [-0.4, 0.4, 0.4, 1.6],
];

interface DraftingLines {
  lines: THREE.LineSegments;
  geometry: THREE.BufferGeometry;
  vertexCount: number;
  baseColor: [number, number, number];
}

/** Every vertex gets its own colour (`vertexColors: true`) rather than one
 * material colour, so `update()` can brighten individual line segments by
 * cursor proximity each frame — the same "mutate the attribute that's
 * actually rendered" rule ADR-0026 established, applied to colour instead of
 * position. `setDrawRange` (not a position rewrite) drives the self-drawing
 * reveal, so the two techniques never conflict. */
const buildDraftingLines = (): DraftingLines => {
  const vertexCount = DRAFTING_SEGMENTS.length * 2;
  const positions = new Float32Array(vertexCount * 3);
  DRAFTING_SEGMENTS.forEach(([x1, y1, x2, y2], i) => {
    positions[i * 6] = x1;
    positions[i * 6 + 1] = y1;
    positions[i * 6 + 2] = 0.02;
    positions[i * 6 + 3] = x2;
    positions[i * 6 + 4] = y2;
    positions[i * 6 + 5] = 0.02;
  });

  const baseColor = toColorArray(COLOR.glow);
  const colors = new Float32Array(vertexCount * 3);
  for (let i = 0; i < vertexCount; i++) {
    colors[i * 3] = baseColor[0];
    colors[i * 3 + 1] = baseColor[1];
    colors[i * 3 + 2] = baseColor[2];
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geometry.setDrawRange(0, 0);

  const lines = new THREE.LineSegments(
    geometry,
    new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.75 }),
  );

  return { lines, geometry, vertexCount, baseColor };
};

/** Two dimension lines (bottom + right edge) with arrowhead ticks at each end. */
const buildDimensionArrows = (): THREE.LineSegments => {
  const ARROW = 0.16;
  const segments: Array<[number, number, number, number]> = [
    [-3, -2.6, 3, -2.6],
    [-3, -2.6, -3 + ARROW, -2.6 + ARROW],
    [-3, -2.6, -3 + ARROW, -2.6 - ARROW],
    [3, -2.6, 3 - ARROW, -2.6 + ARROW],
    [3, -2.6, 3 - ARROW, -2.6 - ARROW],
    [3.6, -2, 3.6, 2],
    [3.6, -2, 3.6 - ARROW, -2 + ARROW],
    [3.6, -2, 3.6 + ARROW, -2 + ARROW],
    [3.6, 2, 3.6 - ARROW, 2 - ARROW],
    [3.6, 2, 3.6 + ARROW, 2 - ARROW],
  ];
  const points = segments.flatMap(([x1, y1, x2, y2]) => [
    new THREE.Vector3(x1, y1, 0.03),
    new THREE.Vector3(x2, y2, 0.03),
  ]);
  return new THREE.LineSegments(
    new THREE.BufferGeometry().setFromPoints(points),
    new THREE.LineBasicMaterial({ color: COLOR.ink, transparent: true, opacity: 0 }),
  );
};

/** A scalloped circle outline — a lightweight wireframe stand-in for a CAD
 * "revision cloud" annotation, matching this codebase's line-only aesthetic
 * rather than introducing a canvas-texture sprite for the first time. */
const buildAnnotationCloud = (centerX: number, centerY: number, radius: number): THREE.LineLoop => {
  const points: THREE.Vector3[] = [];
  const segments = 28;
  for (let i = 0; i <= segments; i++) {
    const theta = (i / segments) * Math.PI * 2;
    const r = radius * (1 + Math.sin(theta * 6) * 0.12);
    points.push(new THREE.Vector3(centerX + Math.cos(theta) * r, centerY + Math.sin(theta) * r, 0.04));
  }
  return new THREE.LineLoop(
    new THREE.BufferGeometry().setFromPoints(points),
    new THREE.LineBasicMaterial({ color: COLOR.white, transparent: true, opacity: 0 }),
  );
};

const CURSOR_BRIGHTEN_RADIUS = 2.6;
const START_TILT_RAD = -Math.PI / 2.05;

export const createBimClashDetectionScene = (container: HTMLElement): HeroSceneHandle =>
  createHeroSceneRuntime(
    container,
    { cameraPosition: [1.4, 0.6, 7.6], cameraLookAt: [0, 0, 0], driftScale: 0.3 },
    () => {
      const scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(COLOR.background, 0.05);

      // Starts almost edge-on and scaled flat — "unrolling" is this group
      // easing rotation.x back to 0 and scale.y up to 1 together.
      const group = new THREE.Group();
      group.rotation.x = START_TILT_RAD;
      group.scale.y = 0.04;
      scene.add(group);

      const plane = buildBlueprintPlane();
      group.add(plane);

      const { lines, geometry: linesGeometry, vertexCount, baseColor } = buildDraftingLines();
      group.add(lines);

      const arrows = buildDimensionArrows();
      group.add(arrows);

      const clouds = [buildAnnotationCloud(-2, 1.5, 0.5), buildAnnotationCloud(2.2, -1.2, 0.4)];
      clouds.forEach((cloud) => group.add(cloud));

      const colorAttribute = linesGeometry.getAttribute("color") as THREE.BufferAttribute;
      const positionAttribute = linesGeometry.getAttribute("position") as THREE.BufferAttribute;
      const brightColor = toColorArray(COLOR.white);

      const update = (elapsedSeconds: number, pointer: { x: number; y: number }, scrollProgress: number) => {
        const unrollProgress = easeOutCubic(Math.min(1, elapsedSeconds / UNROLL_DURATION_S));
        group.rotation.x = START_TILT_RAD * (1 - unrollProgress);
        group.scale.y = 0.04 + 0.96 * unrollProgress;
        (plane.material as THREE.MeshBasicMaterial).opacity = 0.03 + unrollProgress * 0.05;

        // Self-drawing lines — a growing draw range, boosted (not replaced)
        // by scroll so scrolling into the hero can finish the reveal early.
        const timeDrawProgress = Math.max(
          0,
          Math.min(1, (elapsedSeconds - UNROLL_DURATION_S * 0.5) / 1.8),
        );
        const drawProgress = Math.max(timeDrawProgress, scrollProgress);
        const visibleVertices = Math.min(vertexCount, Math.floor((drawProgress * vertexCount) / 2) * 2);
        linesGeometry.setDrawRange(0, visibleVertices);

        const arrowsFade = Math.max(0, Math.min(1, (elapsedSeconds - UNROLL_DURATION_S - 1.8) / 0.8));
        (arrows.material as THREE.LineBasicMaterial).opacity = arrowsFade * 0.5;

        clouds.forEach((cloud, i) => {
          const cloudFade = Math.max(
            0,
            Math.min(1, (elapsedSeconds - UNROLL_DURATION_S - 2.2 - i * 0.3) / 0.6),
          );
          (cloud.material as THREE.LineBasicMaterial).opacity = cloudFade * 0.4;
        });

        // Cursor-proximity line brightening — the normalized pointer (-1..1,
        // already relative to this hero's own container rect, not the whole
        // page) is projected onto the blueprint's local plane extents, and
        // each vertex's colour is pushed toward white by how close it sits.
        const pointerLocalX = pointer.x * 3.4;
        const pointerLocalY = -pointer.y * 2.4;
        for (let i = 0; i < vertexCount; i++) {
          const vx = positionAttribute.getX(i);
          const vy = positionAttribute.getY(i);
          const distance = Math.hypot(vx - pointerLocalX, vy - pointerLocalY);
          const proximity = Math.max(0, 1 - distance / CURSOR_BRIGHTEN_RADIUS);
          const boost = proximity * proximity * 0.7;
          colorAttribute.setXYZ(
            i,
            baseColor[0] + (brightColor[0] - baseColor[0]) * boost,
            baseColor[1] + (brightColor[1] - baseColor[1]) * boost,
            baseColor[2] + (brightColor[2] - baseColor[2]) * boost,
          );
        }
        colorAttribute.needsUpdate = true;

        // Slow, continuous full-object turn once the sheet has unrolled.
        group.rotation.y = elapsedSeconds * 0.03;
        group.rotation.z = Math.sin(elapsedSeconds * 0.05) * 0.1;
      };

      return { scene, update, dispose: () => disposeSceneObjects(scene) };
    },
  );
