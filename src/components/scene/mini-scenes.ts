/**
 * The eight service-card mini scenes — one per discipline, keyed by the same
 * `slug` used in `src/data/mocks/services.ts`. Each registers against the
 * shared viewport renderer (`src/lib/scene/shared-viewport-renderer.ts`);
 * `control` is hover intensity (0 idle, 1 hovered), driving a speed/reveal
 * boost rather than a hard on/off, so the card still reads as "alive" at rest.
 */
import * as THREE from "three";
import type { ViewportBuild, ViewportBuilder } from "@/lib/scene/shared-viewport-renderer";
import { disposeSceneObjects } from "@/lib/scene/shared-viewport-renderer";
import { HERO_SCENE_COLORS as COLOR } from "./hero-scene-colors";

const lineMaterial = (color: number, opacity: number) =>
  new THREE.LineBasicMaterial({ color, transparent: true, opacity });

const makeCamera = (aspect: number, distance = 3.4): THREE.PerspectiveCamera => {
  const camera = new THREE.PerspectiveCamera(40, aspect, 0.1, 20);
  camera.position.set(distance * 0.6, distance * 0.45, distance);
  camera.lookAt(0, 0, 0);
  return camera;
};

const disposeAll = disposeSceneObjects;

// ─── Civil Engineering — wireframe bridge ──────────────────────────────────
const buildCivilBridge: ViewportBuilder = (aspect) => {
  const scene = new THREE.Scene();
  const camera = makeCamera(aspect);
  const group = new THREE.Group();
  scene.add(group);

  const deck = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(3, 0.08, 0.4)),
    lineMaterial(COLOR.glow, 0.7),
  );
  group.add(deck);

  const pylonGeometry = new THREE.EdgesGeometry(new THREE.CylinderGeometry(0.03, 0.03, 1.1, 6));
  for (const x of [-1.2, -0.4, 0.4, 1.2]) {
    const pylon = new THREE.LineSegments(pylonGeometry, lineMaterial(COLOR.line, 0.5));
    pylon.position.set(x, -0.55, 0);
    group.add(pylon);
  }

  const update = (elapsed: number, control: number) => {
    group.rotation.y = Math.sin(elapsed * 0.3) * 0.35 + control * 0.5;
    camera.position.y = 3.4 * 0.45 + Math.sin(elapsed * 0.4) * 0.1;
  };

  return { scene, camera, update, dispose: () => disposeAll(scene) };
};

// ─── Geotechnical — borehole drilling ──────────────────────────────────────
const buildGeotechBorehole: ViewportBuilder = (aspect) => {
  const scene = new THREE.Scene();
  const camera = makeCamera(aspect, 3);
  const group = new THREE.Group();
  scene.add(group);

  const rig = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(0.5, 1.6, 0.5)),
    lineMaterial(COLOR.line, 0.5),
  );
  rig.position.y = 0.8;
  group.add(rig);

  const drillGeometry = new THREE.CylinderGeometry(0.05, 0.05, 1, 8);
  const drill = new THREE.Mesh(
    drillGeometry,
    new THREE.MeshBasicMaterial({ color: COLOR.glow, transparent: true, opacity: 0.8 }),
  );
  group.add(drill);

  const holeMaterial = lineMaterial(COLOR.ink, 0.35);
  const hole = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.CylinderGeometry(0.09, 0.09, 2, 10, 1, true)),
    holeMaterial,
  );
  hole.position.y = -1;
  group.add(hole);

  const update = (elapsed: number, control: number) => {
    const speed = 1 + control * 2.5;
    drill.rotation.y = elapsed * speed * 3;
    const depth = ((Math.sin(elapsed * speed * 0.6) + 1) / 2) * 1.4;
    drill.position.y = 0.5 - depth;
    group.rotation.y = Math.sin(elapsed * 0.25) * 0.25;
  };

  return { scene, camera, update, dispose: () => disposeAll(scene) };
};

// ─── Structural — rotating steel frame building ────────────────────────────
const buildStructuralFrame: ViewportBuilder = (aspect) => {
  const scene = new THREE.Scene();
  const camera = makeCamera(aspect);
  const geometry = new THREE.BoxGeometry(1.2, 2, 1.2, 3, 5, 3);
  const frame = new THREE.LineSegments(
    new THREE.WireframeGeometry(geometry),
    lineMaterial(COLOR.glow, 0.55),
  );
  scene.add(frame);

  const update = (elapsed: number, control: number) => {
    frame.rotation.y = elapsed * (0.25 + control * 0.9);
    frame.rotation.x = Math.sin(elapsed * 0.2) * 0.08;
  };

  return { scene, camera, update, dispose: () => disposeAll(scene) };
};

// ─── Stormwater — animated water flow mesh ─────────────────────────────────
/** Grid-line index pairs for a PlaneGeometry's own vertex buffer — used instead of
 * `WireframeGeometry`, whose derived vertex layout doesn't line up 1:1 with the
 * source plane, so per-frame position updates keyed by plane vertex index would
 * read/write out of bounds and produce NaNs. */
const buildPlaneGridIndex = (widthSegments: number, heightSegments: number): number[] => {
  const indices: number[] = [];
  const columns = widthSegments + 1;
  for (let row = 0; row <= heightSegments; row++) {
    for (let col = 0; col <= widthSegments; col++) {
      const i = row * columns + col;
      if (col < widthSegments) indices.push(i, i + 1);
      if (row < heightSegments) indices.push(i, i + columns);
    }
  }
  return indices;
};

const buildStormwaterFlow: ViewportBuilder = (aspect) => {
  const scene = new THREE.Scene();
  const camera = makeCamera(aspect);
  camera.position.set(0, 2.4, 2.2);
  camera.lookAt(0, 0, 0);

  const segments = 24;
  const geometry = new THREE.PlaneGeometry(2.6, 2.6, segments, segments);
  geometry.rotateX(-Math.PI / 2);

  const lineGeometry = new THREE.BufferGeometry();
  lineGeometry.setAttribute("position", geometry.attributes.position);
  lineGeometry.setIndex(buildPlaneGridIndex(segments, segments));

  const mesh = new THREE.LineSegments(lineGeometry, lineMaterial(COLOR.glow, 0.5));
  scene.add(mesh);
  const base = geometry.attributes.position.clone();

  const update = (elapsed: number, control: number) => {
    const amp = 0.06 + control * 0.1;
    const speed = 1.4 + control * 1.6;
    const position = lineGeometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < position.count; i++) {
      const x = base.getX(i);
      const z = base.getZ(i);
      position.setY(i, Math.sin(x * 2 + elapsed * speed) * amp + Math.cos(z * 2 - elapsed * speed) * amp);
    }
    position.needsUpdate = true;
  };

  return { scene, camera, update, dispose: () => disposeAll(scene) };
};

// ─── Design & Drafting — rotating blueprint plan ───────────────────────────
const buildDraftingBlueprint: ViewportBuilder = (aspect) => {
  const scene = new THREE.Scene();
  const camera = makeCamera(aspect, 3);
  camera.position.set(0, 2.6, 1.2);
  camera.lookAt(0, 0, 0);

  const group = new THREE.Group();
  scene.add(group);

  const gridGeometry = new THREE.PlaneGeometry(2.4, 2.4, 8, 8);
  gridGeometry.rotateX(-Math.PI / 2);
  const grid = new THREE.LineSegments(
    new THREE.WireframeGeometry(gridGeometry),
    lineMaterial(COLOR.ink, 0.4),
  );
  group.add(grid);

  const outline = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(1.3, 0.02, 0.9)),
    lineMaterial(COLOR.glow, 0.8),
  );
  outline.position.y = 0.05;
  group.add(outline);

  const update = (elapsed: number, control: number) => {
    group.rotation.y = elapsed * (0.2 + control * 0.6);
    outline.position.y = 0.05 + Math.sin(elapsed * 1.2) * 0.03;
  };

  return { scene, camera, update, dispose: () => disposeAll(scene) };
};

// ─── Project Control — animated gantt / timeline bars ──────────────────────
const buildProjectControlGantt: ViewportBuilder = (aspect) => {
  const scene = new THREE.Scene();
  const camera = makeCamera(aspect, 3.6);
  camera.position.set(0.6, 1.6, 3.4);
  camera.lookAt(0, 0, 0);

  const rows = 5;
  const bars: Array<{ mesh: THREE.Mesh; target: number }> = [];
  for (let i = 0; i < rows; i++) {
    const target = 0.5 + Math.random() * 1.6;
    const geometry = new THREE.BoxGeometry(1, 0.12, 0.12);
    const mesh = new THREE.Mesh(
      geometry,
      new THREE.MeshBasicMaterial({ color: COLOR.glow, transparent: true, opacity: 0.75 }),
    );
    mesh.position.set(-1, i * 0.28 - 0.55, 0);
    mesh.scale.x = 0.001;
    scene.add(mesh);
    bars.push({ mesh, target });
  }

  const update = (elapsed: number, control: number) => {
    const speed = 0.5 + control * 1.2;
    bars.forEach((bar, i) => {
      const progress = Math.min(1, Math.max(0, elapsed * speed - i * 0.3));
      bar.mesh.scale.x = 0.02 + progress * bar.target;
      bar.mesh.position.x = -1 + (bar.mesh.scale.x * 1) / 2;
    });
  };

  return { scene, camera, update, dispose: () => disposeAll(scene) };
};

// ─── Advisory — rotating compass / globe ───────────────────────────────────
const buildAdvisoryCompass: ViewportBuilder = (aspect) => {
  const scene = new THREE.Scene();
  const camera = makeCamera(aspect, 3);

  const globe = new THREE.LineSegments(
    new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(0.85, 1)),
    lineMaterial(COLOR.line, 0.45),
  );
  scene.add(globe);

  const ringGeometry = new THREE.EdgesGeometry(new THREE.TorusGeometry(1.05, 0.015, 4, 40));
  const needle = new THREE.LineSegments(ringGeometry, lineMaterial(COLOR.glow, 0.8));
  needle.rotation.x = Math.PI / 2.2;
  scene.add(needle);

  const update = (elapsed: number, control: number) => {
    globe.rotation.y = elapsed * (0.15 + control * 0.5);
    needle.rotation.z = elapsed * (0.35 + control * 1.1);
  };

  return { scene, camera, update, dispose: () => disposeAll(scene) };
};

// ─── Telecom — signal tower with expanding waves ───────────────────────────
const buildTelecomTower: ViewportBuilder = (aspect) => {
  const scene = new THREE.Scene();
  const camera = makeCamera(aspect, 3.2);

  const mast = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.CylinderGeometry(0.02, 0.04, 1.8, 6)),
    lineMaterial(COLOR.line, 0.6),
  );
  mast.position.y = 0.1;
  scene.add(mast);

  const circlePoints: THREE.Vector3[] = [];
  for (let i = 0; i <= 48; i++) {
    const theta = (i / 48) * Math.PI * 2;
    circlePoints.push(new THREE.Vector3(Math.cos(theta), 0, Math.sin(theta)));
  }
  const circleGeometry = new THREE.BufferGeometry().setFromPoints(circlePoints);

  const ringCount = 3;
  const rings: THREE.Line[] = [];
  for (let i = 0; i < ringCount; i++) {
    const ring = new THREE.Line(circleGeometry, lineMaterial(COLOR.glow, 0));
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.85;
    scene.add(ring);
    rings.push(ring);
  }

  const update = (elapsed: number, control: number) => {
    const speed = 0.6 + control * 1.2;
    rings.forEach((ring, i) => {
      const phase = ((elapsed * speed + i / ringCount) % 1);
      const scale = 0.15 + phase * 1.3;
      ring.scale.set(scale, scale, scale);
      const material = ring.material as THREE.LineBasicMaterial;
      material.opacity = (1 - phase) * 0.7;
    });
  };

  return { scene, camera, update, dispose: () => disposeAll(scene) };
};

export const MINI_SCENES: Record<string, ViewportBuilder> = {
  "civil-engineering": buildCivilBridge,
  "geotechnical-engineering": buildGeotechBorehole,
  "structural-engineering": buildStructuralFrame,
  "stormwater-and-flood-modelling": buildStormwaterFlow,
  "design-and-drafting": buildDraftingBlueprint,
  "project-control-services": buildProjectControlGantt,
  "advisory-services": buildAdvisoryCompass,
  "telecom-services": buildTelecomTower,
};
