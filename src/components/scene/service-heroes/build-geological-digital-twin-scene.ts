/**
 * Bespoke hero scene for the Geotechnical Engineering service page — a
 * descending cutaway through named soil/rock layers (the same `STRATA_LAYERS`
 * palette the About section's geological cross-section uses, for visual
 * continuity), a borehole tube with a core-sampler drill continuously
 * descending through it, floating core samples pulled from a few depths, and
 * two glowing water veins threading through the lower layers. Replaces this
 * page's earlier direct reuse of the homepage's `createHeroScene` — this page
 * needed its own layer-descent behaviour, not the homepage's bridge/tunnel/
 * corridor narrative. See `sceneSummary` in `data/mocks/services.ts`.
 */
import * as THREE from "three";
import { HERO_SCENE_COLORS as COLOR } from "../hero-scene-colors";
import { STRATA_LAYERS } from "../strata-scene-colors";
import { disposeSceneObjects } from "@/lib/scene/shared-viewport-renderer";
import { createHeroSceneRuntime } from "./hero-scene-runtime";
import type { HeroSceneHandle } from "../hero-scene-types";

const LAYER_COUNT = STRATA_LAYERS.length;
const LAYER_HEIGHT = 1.3;
const STACK_TOP = LAYER_HEIGHT / 2;
const STACK_BOTTOM = -LAYER_COUNT * LAYER_HEIGHT + LAYER_HEIGHT / 2;
const DESCEND_DISTANCE = 3.4;
const AUTO_DESCEND_PERIOD_S = 16;

interface BuiltLayer {
  mesh: THREE.Mesh;
  material: THREE.MeshBasicMaterial;
  edgeMaterial: THREE.LineBasicMaterial;
  baseColor: THREE.Color;
}

/** Same box-stack-with-edges construction as the About section's cross
 * section, sized for a full-bleed hero instead of a small panel. */
const buildLayerStack = (): { group: THREE.Group; layers: BuiltLayer[] } => {
  const group = new THREE.Group();
  const layers = STRATA_LAYERS.map((layer, i) => {
    const width = 6.4 - i * 0.4;
    const depth = 4 - i * 0.25;
    const geometry = new THREE.BoxGeometry(width, LAYER_HEIGHT, depth);
    const baseColor = new THREE.Color(layer.color);

    const material = new THREE.MeshBasicMaterial({ color: layer.color, transparent: true, opacity: 0.16 });
    const mesh = new THREE.Mesh(geometry, material);

    const edgeMaterial = new THREE.LineBasicMaterial({ color: layer.color, transparent: true, opacity: 0.4 });
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geometry), edgeMaterial);
    mesh.add(edges);

    mesh.position.y = -i * LAYER_HEIGHT;
    group.add(mesh);

    return { mesh, material, edgeMaterial, baseColor };
  });
  return { group, layers };
};

interface BuiltBorehole {
  group: THREE.Group;
  drill: THREE.Mesh;
  drillMaterial: THREE.MeshBasicMaterial;
}

/** A translucent casing tube spanning the full stack depth, plus a small
 * solid drill bit that continuously descends through it on its own timer —
 * the same descending-drill idiom the About section's cross section uses. */
const buildBorehole = (x: number, z: number): BuiltBorehole => {
  const group = new THREE.Group();
  group.position.set(x, 0, z);

  const tubeGeometry = new THREE.CylinderGeometry(0.16, 0.16, LAYER_COUNT * LAYER_HEIGHT, 12, 1, true);
  const tube = new THREE.LineSegments(
    new THREE.WireframeGeometry(tubeGeometry),
    new THREE.LineBasicMaterial({ color: COLOR.ink, transparent: true, opacity: 0.3 }),
  );
  tube.position.y = (STACK_TOP + STACK_BOTTOM) / 2;
  group.add(tube);
  tubeGeometry.dispose();

  const drillGeometry = new THREE.CylinderGeometry(0.06, 0.06, 0.45, 8);
  const drillMaterial = new THREE.MeshBasicMaterial({ color: COLOR.glow, transparent: true, opacity: 0.85 });
  const drill = new THREE.Mesh(drillGeometry, drillMaterial);
  group.add(drill);
  drillGeometry.dispose();

  return { group, drill, drillMaterial };
};

interface BuiltCoreSample {
  mesh: THREE.Mesh;
  baseY: number;
  phase: number;
}

/** A short horizontal cylinder puck — a core segment pulled from the ground,
 * floating and slowly turning near the depth it was drawn from. */
const buildCoreSample = (y: number, x: number, z: number, colorHex: number, phase: number): BuiltCoreSample => {
  const geometry = new THREE.CylinderGeometry(0.14, 0.14, 0.5, 10);
  geometry.rotateZ(Math.PI / 2);
  const mesh = new THREE.Mesh(
    geometry,
    new THREE.MeshBasicMaterial({ color: colorHex, transparent: true, opacity: 0.55, wireframe: true }),
  );
  mesh.position.set(x, y, z);
  geometry.dispose();
  return { mesh, baseY: y, phase };
};

/** A thin, gently zig-zagging line threading diagonally through the stack —
 * an additive-blended "water vein," pulsing rather than static. */
const buildWaterVein = (startY: number, endY: number, xOffset: number, zOffset: number): THREE.Line => {
  const points: THREE.Vector3[] = [];
  const segments = 14;
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const y = startY + (endY - startY) * t;
    const wobble = Math.sin(t * Math.PI * 3) * 0.35;
    points.push(new THREE.Vector3(xOffset + wobble, y, zOffset + wobble * 0.5));
  }
  return new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(points),
    new THREE.LineBasicMaterial({
      color: COLOR.glow,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
};

export const createGeologicalDigitalTwinScene = (container: HTMLElement): HeroSceneHandle =>
  createHeroSceneRuntime(
    container,
    { cameraPosition: [5.4, 2.2, 8.4], cameraLookAt: [0, -1.4, 0] },
    () => {
      const scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(COLOR.background, 0.045);

      // Everything below descends together as `depth` rises — the camera has
      // no reference here (the shared runtime owns it), so a "camera
      // descending through the layers" is faked by moving the stack up past
      // a fixed camera instead, the same substitution civil's "pull back"
      // uses for its own camera-less load animation.
      const worldGroup = new THREE.Group();
      scene.add(worldGroup);

      const { group: stackGroup, layers } = buildLayerStack();
      worldGroup.add(stackGroup);

      const borehole = buildBorehole(2.4, 1.2);
      worldGroup.add(borehole.group);

      const coreSamples = [
        buildCoreSample(-0.4, 1.1, 2.1, STRATA_LAYERS[0].color, 0),
        buildCoreSample(-1.9, 0.7, 1.9, STRATA_LAYERS[1].color, 1.4),
        buildCoreSample(-3.6, 1.3, 2.3, STRATA_LAYERS[2].color, 2.8),
        buildCoreSample(-4.9, 0.9, 2, STRATA_LAYERS[3].color, 4.2),
      ];
      coreSamples.forEach((sample) => worldGroup.add(sample.mesh));

      const veins = [
        buildWaterVein(-2.2, -4.8, -1.4, 0.3),
        buildWaterVein(-3, -5.4, 1.8, -0.6),
      ];
      veins.forEach((vein) => worldGroup.add(vein));

      const update = (elapsedSeconds: number, _pointer: { x: number; y: number }, scrollProgress: number) => {
        // A slow autonomous descent cycle (down, back up, repeat) keeps the
        // scene alive with no scroll input; scrolling pushes depth further
        // than wherever the autonomous cycle currently sits, never backward.
        const cyclePhase = (elapsedSeconds % AUTO_DESCEND_PERIOD_S) / AUTO_DESCEND_PERIOD_S;
        const autoDepth = cyclePhase < 0.5 ? cyclePhase * 2 : (1 - cyclePhase) * 2;
        const depth = Math.max(autoDepth, scrollProgress);

        worldGroup.position.y = depth * DESCEND_DISTANCE;

        const cameraDepthIndex = depth * LAYER_COUNT;
        layers.forEach((layer, i) => {
          const glow = Math.max(0, 1 - Math.abs(cameraDepthIndex - (i + 0.5)));
          layer.material.color.copy(layer.baseColor).lerp(new THREE.Color(0xffffff), glow * 0.5);
          layer.edgeMaterial.opacity = 0.4 + glow * 0.4;
        });

        const drillPhase = (elapsedSeconds % 5) / 5;
        borehole.drill.position.y = STACK_TOP - drillPhase * (STACK_TOP - STACK_BOTTOM);
        borehole.drillMaterial.opacity = 0.5 + Math.sin(drillPhase * Math.PI) * 0.4;

        coreSamples.forEach((sample) => {
          sample.mesh.position.y = sample.baseY + Math.sin(elapsedSeconds * 0.5 + sample.phase) * 0.12;
          sample.mesh.rotation.x += 0.003;
        });

        veins.forEach((vein, i) => {
          (vein.material as THREE.LineBasicMaterial).opacity =
            0.25 + (Math.sin(elapsedSeconds * 0.8 + i * 1.7) * 0.5 + 0.5) * 0.35;
        });
      };

      return { scene, update, dispose: () => disposeSceneObjects(scene) };
    },
  );
