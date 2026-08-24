/**
 * Mini scene for the About section — a stacked geological cross-section
 * (clay / weathered rock / residual soil / bedrock) that reveals layer by
 * layer as `control` (0..1 scroll progress, fed from a `SpringTrigger`) rises.
 * Registers against the shared viewport renderer — see
 * `src/lib/scene/shared-viewport-renderer.ts`.
 */
import * as THREE from "three";
import type { ViewportBuild, ViewportBuilder } from "@/lib/scene/shared-viewport-renderer";
import { disposeSceneObjects } from "@/lib/scene/shared-viewport-renderer";
import { STRATA_LAYERS } from "./strata-scene-colors";

const LAYER_COUNT = STRATA_LAYERS.length;

export const buildGeologicalCrossSection: ViewportBuilder = (aspect): ViewportBuild => {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, aspect, 0.1, 50);
  camera.position.set(3.4, 1.4, 5.2);
  camera.lookAt(0, -0.4, 0);

  const group = new THREE.Group();
  scene.add(group);

  const layerHeight = 0.85;
  const layers = STRATA_LAYERS.map((layer, i) => {
    const width = 3.6 - i * 0.15;
    const depth = 2.4 - i * 0.1;
    const geometry = new THREE.BoxGeometry(width, layerHeight, depth);

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

    mesh.position.y = -i * layerHeight - layerHeight / 2;
    group.add(mesh);

    return { mesh, material, edgeMaterial };
  });

  const update = (elapsedSeconds: number, control: number) => {
    const progress = Math.max(0, Math.min(1, control));
    group.rotation.y = Math.sin(elapsedSeconds * 0.15) * 0.1;

    layers.forEach((layer, i) => {
      const threshold = i / LAYER_COUNT;
      const local = Math.max(0, Math.min(1, (progress - threshold) * LAYER_COUNT * 1.6));
      layer.material.opacity = local * 0.62;
      layer.edgeMaterial.opacity = local * 0.9;
      layer.mesh.scale.y = 0.4 + local * 0.6;
    });
  };

  const dispose = () => disposeSceneObjects(scene);

  return { scene, camera, update, dispose };
};
