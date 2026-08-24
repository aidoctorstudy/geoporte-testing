/**
 * Mini scene for the About section — a stacked geological cross-section
 * (clay / weathered rock / residual soil / bedrock) that reveals layer by
 * layer as `control` (0..1 scroll progress, fed from a `SpringTrigger`) rises.
 * Registers against the shared viewport renderer — see
 * `src/lib/scene/shared-viewport-renderer.ts`.
 *
 * Phase 2 additions: the camera pushes down/in toward the strata as scroll
 * progress rises (rather than sitting static), each layer briefly brightens
 * as the camera's implied "depth" passes it, a borehole drill continuously
 * descends through all four layers, and the group tilts toward the cursor
 * using the shared pointer store + this registration's live rect (passed by
 * the renderer as `update`'s third argument).
 */
import * as THREE from "three";
import type { ViewportBuild, ViewportBuilder } from "@/lib/scene/shared-viewport-renderer";
import { disposeSceneObjects } from "@/lib/scene/shared-viewport-renderer";
import { getPointerSnapshot } from "@/hooks/cursor/use-pointer";
import { STRATA_LAYERS } from "./strata-scene-colors";

const LAYER_COUNT = STRATA_LAYERS.length;
const LAYER_HEIGHT = 0.85;
const BASE_CAMERA_POSITION = new THREE.Vector3(3.4, 1.4, 5.2);
const BASE_LOOK_AT = new THREE.Vector3(0, -0.4, 0);
const SCROLL_DESCEND_Y = 1.9;
const SCROLL_PUSH_IN_Z = 1.6;
const DRILL_PERIOD_S = 4.5;
const TILT_MAX_RAD = THREE.MathUtils.degToRad(10);

export const buildGeologicalCrossSection: ViewportBuilder = (aspect): ViewportBuild => {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, aspect, 0.1, 50);
  camera.position.copy(BASE_CAMERA_POSITION);
  camera.lookAt(BASE_LOOK_AT);

  const group = new THREE.Group();
  scene.add(group);

  const stackTop = LAYER_HEIGHT / 2;
  const stackBottom = -LAYER_COUNT * LAYER_HEIGHT + LAYER_HEIGHT / 2;

  const layers = STRATA_LAYERS.map((layer, i) => {
    const width = 3.6 - i * 0.15;
    const depth = 2.4 - i * 0.1;
    const geometry = new THREE.BoxGeometry(width, LAYER_HEIGHT, depth);
    const baseColor = new THREE.Color(layer.color);

    const material = new THREE.MeshBasicMaterial({
      color: layer.color,
      transparent: true,
      opacity: 0,
    });
    const mesh = new THREE.Mesh(geometry, material);

    const edgeMaterial = new THREE.LineBasicMaterial({
      color: layer.color,
      transparent: true,
      opacity: 0,
    });
    const edgeGeometry = new THREE.EdgesGeometry(geometry);
    const edges = new THREE.LineSegments(edgeGeometry, edgeMaterial);
    mesh.add(edges);

    mesh.position.y = -i * LAYER_HEIGHT - LAYER_HEIGHT / 2;
    group.add(mesh);

    return { mesh, material, edgeMaterial, baseColor };
  });

  // A thin vertical drill, continuously descending through every layer on
  // its own timer (independent of scroll) — item 20's "borehole drill
  // animation."
  const drillGeometry = new THREE.CylinderGeometry(0.025, 0.025, 0.4, 8);
  const drillMaterial = new THREE.MeshBasicMaterial({
    color: STRATA_LAYERS[0].color,
    transparent: true,
    opacity: 0.8,
  });
  const drill = new THREE.Mesh(drillGeometry, drillMaterial);
  drill.position.x = 1.4;
  drill.position.z = 0.6;
  group.add(drill);

  let tiltX = 0;
  let tiltY = 0;

  const update = (elapsedSeconds: number, control: number, rect: DOMRect) => {
    const progress = Math.max(0, Math.min(1, control));

    // Cursor tilt — smoothed toward the pointer's position relative to this
    // panel's own rect; settles back to neutral once the pointer hasn't
    // moved yet (SSR/first-paint) rather than snapping to a stale `0,0`.
    const pointer = getPointerSnapshot();
    let targetTiltX = 0;
    let targetTiltY = 0;
    if (pointer.hasMoved && rect.width > 0 && rect.height > 0) {
      const localX = ((pointer.x - rect.left) / rect.width) * 2 - 1;
      const localY = ((pointer.y - rect.top) / rect.height) * 2 - 1;
      targetTiltY = THREE.MathUtils.clamp(localX, -1, 1) * TILT_MAX_RAD;
      targetTiltX = THREE.MathUtils.clamp(localY, -1, 1) * TILT_MAX_RAD;
    }
    tiltX += (targetTiltX - tiltX) * 0.06;
    tiltY += (targetTiltY - tiltY) * 0.06;

    group.rotation.y = Math.sin(elapsedSeconds * 0.15) * 0.1 + tiltY;
    group.rotation.x = tiltX;

    // Camera pushes down and in toward the strata as scroll progress rises.
    camera.position.y = BASE_CAMERA_POSITION.y - progress * SCROLL_DESCEND_Y;
    camera.position.z = BASE_CAMERA_POSITION.z - progress * SCROLL_PUSH_IN_Z;
    camera.lookAt(BASE_LOOK_AT.x, BASE_LOOK_AT.y - progress * SCROLL_DESCEND_Y, BASE_LOOK_AT.z);
    // The camera's implied position in the stack, in layer-index units —
    // used to brighten whichever layer it's currently "passing through."
    const cameraDepthIndex = progress * LAYER_COUNT;

    layers.forEach((layer, i) => {
      const threshold = i / LAYER_COUNT;
      const local = Math.max(0, Math.min(1, (progress - threshold) * LAYER_COUNT * 1.6));
      const glow = Math.max(0, 1 - Math.abs(cameraDepthIndex - (i + 0.5)));

      layer.material.opacity = local * 0.62;
      layer.edgeMaterial.opacity = local * 0.9;
      layer.mesh.scale.y = 0.4 + local * 0.6;
      layer.material.color.copy(layer.baseColor).lerp(new THREE.Color(0xffffff), glow * 0.55);
    });

    const drillPhase = (elapsedSeconds % DRILL_PERIOD_S) / DRILL_PERIOD_S;
    drill.position.y = stackTop - drillPhase * (stackTop - stackBottom);
    drillMaterial.opacity = 0.5 + Math.sin(drillPhase * Math.PI) * 0.4;
  };

  const dispose = () => disposeSceneObjects(scene);

  return { scene, camera, update, dispose };
};
