/**
 * Pure three.js setup for the homepage hero — a bespoke "digital twin" scene:
 * a valley corridor cut by a bridge and a tunnel, geological strata exposed in
 * cutaway, borehole/monitoring markers, and a lidar-style point cloud drifting
 * above it. Authored by hand (not a GetLayers catalog scene) per the brief in
 * `getlayers.json`.
 *
 * Framework-free by design: this module owns its own THREE objects and a
 * manual render loop driven by the caller (`HeroScene.tsx`), independent of
 * the spring ticker that drives `@react-spring/web` — see
 * obsidian/architecture/tech-stack.md → "3D — Geoporte hero + service scenes".
 */
import * as THREE from "three";
import { HERO_SCENE_COLORS as COLOR } from "./hero-scene-colors";
import type { HeroSceneHandle } from "./hero-scene-types";

/** Optional camera re-framing for a scene reused on more than one page (e.g.
 * the geotechnical service page reuses this scene family "re-framed" per its
 * `sceneSummary` in `data/mocks/services.ts`) — defaults reproduce the
 * original homepage hero framing exactly. */
export interface HeroSceneFraming {
  cameraPosition?: [number, number, number];
  cameraLookAt?: [number, number, number];
}

const buildTerrain = (): THREE.LineSegments => {
  const geometry = new THREE.PlaneGeometry(26, 18, 48, 32);
  geometry.rotateX(-Math.PI / 2);
  const position = geometry.attributes.position;
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i);
    const z = position.getZ(i);
    const corridor = Math.exp(-((z / 3.2) ** 2)) * 1.6; // dip for the valley corridor
    const ridge = Math.sin(x * 0.35) * 0.35 + Math.sin(z * 0.5) * 0.25;
    position.setY(i, ridge - corridor);
  }
  geometry.computeVertexNormals();

  const wireframe = new THREE.WireframeGeometry(geometry);
  const material = new THREE.LineBasicMaterial({
    color: COLOR.line,
    transparent: true,
    opacity: 0.32,
  });
  geometry.dispose();
  return new THREE.LineSegments(wireframe, material);
};

const buildStrata = (): THREE.Group => {
  const group = new THREE.Group();
  const layers = 6;
  for (let i = 0; i < layers; i++) {
    const width = 3.2 - i * 0.32;
    const geometry = new THREE.BoxGeometry(width, 0.28, 5.5 - i * 0.4);
    const edges = new THREE.EdgesGeometry(geometry);
    const material = new THREE.LineBasicMaterial({
      color: i % 2 === 0 ? COLOR.line : COLOR.glow,
      transparent: true,
      opacity: 0.25 + i * 0.06,
    });
    const layer = new THREE.LineSegments(edges, material);
    layer.position.set(-8.5, -0.4 - i * 0.32, 0);
    group.add(layer);
    geometry.dispose();
  }
  return group;
};

const buildBridge = (): THREE.Group => {
  const group = new THREE.Group();
  const deckGeometry = new THREE.BoxGeometry(11, 0.16, 1.1);
  const deckEdges = new THREE.EdgesGeometry(deckGeometry);
  const deckMaterial = new THREE.LineBasicMaterial({
    color: COLOR.glow,
    transparent: true,
    opacity: 0.75,
  });
  const deck = new THREE.LineSegments(deckEdges, deckMaterial);
  deck.position.set(0.5, 2.1, -2.4);
  group.add(deck);
  deckGeometry.dispose();

  const pylonGeometry = new THREE.CylinderGeometry(0.07, 0.07, 2.2, 8);
  const pylonEdges = new THREE.EdgesGeometry(pylonGeometry);
  const pylonMaterial = new THREE.LineBasicMaterial({
    color: COLOR.line,
    transparent: true,
    opacity: 0.5,
  });
  for (const x of [-4, -1.3, 1.3, 4]) {
    const pylon = new THREE.LineSegments(pylonEdges, pylonMaterial);
    pylon.position.set(x + 0.5, 1, -2.4);
    group.add(pylon);
  }
  pylonGeometry.dispose();

  return group;
};

const buildTunnel = (): THREE.LineSegments => {
  const geometry = new THREE.CylinderGeometry(1.1, 1.1, 6, 16, 5, true);
  geometry.rotateZ(Math.PI / 2);
  const wireframe = new THREE.WireframeGeometry(geometry);
  const material = new THREE.LineBasicMaterial({
    color: COLOR.glow,
    transparent: true,
    opacity: 0.4,
  });
  const tunnel = new THREE.LineSegments(wireframe, material);
  tunnel.position.set(6, 0.1, 2.6);
  geometry.dispose();
  return tunnel;
};

const buildBoreholes = (
  group: THREE.Group,
): { markers: THREE.Mesh[] } => {
  const positions: Array<[number, number]> = [
    [-3.5, 1.5],
    [-0.5, -1.8],
    [2.2, 3.2],
    [4.5, -0.5],
    [-6, 3],
  ];
  const markers: THREE.Mesh[] = [];
  const lineMaterial = new THREE.LineBasicMaterial({
    color: COLOR.ink,
    transparent: true,
    opacity: 0.45,
  });
  const markerGeometry = new THREE.IcosahedronGeometry(0.09, 0);
  const markerMaterial = new THREE.MeshBasicMaterial({
    color: COLOR.glow,
    transparent: true,
    opacity: 0.8,
  });

  for (const [x, z] of positions) {
    const lineGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(x, 1.6, z),
      new THREE.Vector3(x, -1.4, z),
    ]);
    const line = new THREE.Line(lineGeometry, lineMaterial);
    group.add(line);

    const marker = new THREE.Mesh(markerGeometry, markerMaterial.clone());
    marker.position.set(x, 1.6, z);
    group.add(marker);
    markers.push(marker);
  }

  return { markers };
};

/** A tower crane rendered as a thin wireframe silhouette. */
const buildCrane = (): THREE.Group => {
  const group = new THREE.Group();
  const material = new THREE.LineBasicMaterial({
    color: COLOR.line,
    transparent: true,
    opacity: 0.4,
  });

  const mastGeometry = new THREE.CylinderGeometry(0.05, 0.05, 5.5, 6);
  const mast = new THREE.LineSegments(
    new THREE.EdgesGeometry(mastGeometry),
    material,
  );
  mast.position.y = 2.75;
  group.add(mast);
  mastGeometry.dispose();

  const jibGeometry = new THREE.BoxGeometry(4.6, 0.08, 0.08);
  const jib = new THREE.LineSegments(new THREE.EdgesGeometry(jibGeometry), material);
  jib.position.set(2, 5.4, 0);
  group.add(jib);

  const counterJib = new THREE.LineSegments(
    new THREE.EdgesGeometry(jibGeometry),
    material,
  );
  counterJib.scale.set(0.4, 1, 1);
  counterJib.position.set(-1, 5.4, 0);
  group.add(counterJib);
  jibGeometry.dispose();

  const hookLineGeometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(3.6, 5.4, 0),
    new THREE.Vector3(3.6, 3.1, 0),
  ]);
  group.add(new THREE.Line(hookLineGeometry, material));

  return group;
};

/** A loose stack of leaning I-beam-style girders. */
const buildGirders = (): THREE.Group => {
  const group = new THREE.Group();
  const material = new THREE.LineBasicMaterial({
    color: COLOR.ink,
    transparent: true,
    opacity: 0.35,
  });
  const beamGeometry = new THREE.BoxGeometry(3.2, 0.18, 0.18);
  const edges = new THREE.EdgesGeometry(beamGeometry);

  const placements: Array<[number, number, number, number]> = [
    [0, 0, 0, 0.08],
    [0.3, 0.4, 0.6, -0.05],
    [-0.4, 0.85, -0.5, 0.12],
  ];
  for (const [x, y, z, rot] of placements) {
    const beam = new THREE.LineSegments(edges, material);
    beam.position.set(x, y, z);
    beam.rotation.z = rot;
    group.add(beam);
  }
  beamGeometry.dispose();

  return group;
};

/** A small scaffolding lattice — a cross-braced box frame. */
const buildScaffolding = (): THREE.LineSegments => {
  const geometry = new THREE.BoxGeometry(1.6, 2.4, 1.6, 2, 3, 2);
  const wireframe = new THREE.WireframeGeometry(geometry);
  const material = new THREE.LineBasicMaterial({
    color: COLOR.glow,
    transparent: true,
    opacity: 0.3,
  });
  geometry.dispose();
  return new THREE.LineSegments(wireframe, material);
};

/** The background construction rig — crane, girders, scaffolding — a single
 * group that rotates slowly and independently of the main digital-twin group. */
const buildConstructionRig = (): THREE.Group => {
  const group = new THREE.Group();

  const crane = buildCrane();
  crane.position.set(-8, -1.2, -6);
  group.add(crane);

  const girders = buildGirders();
  girders.position.set(7, 2.4, -5.5);
  group.add(girders);

  const scaffolding = buildScaffolding();
  scaffolding.position.set(-5.5, 0.6, 4.5);
  group.add(scaffolding);

  return group;
};

/** Dust motes drifting upward through the scene, wrapping once they clear the top. */
const buildDust = (): THREE.Points => {
  const count = 260;
  const positions = new Float32Array(count * 3);
  const speeds = new Float32Array(count);
  const drift = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 22;
    positions[i * 3 + 1] = Math.random() * 7 - 1.5;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 16;
    speeds[i] = 0.15 + Math.random() * 0.25;
    drift[i] = Math.random() * Math.PI * 2;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    color: COLOR.glow,
    size: 0.025,
    transparent: true,
    opacity: 0.5,
    sizeAttenuation: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const points = new THREE.Points(geometry, material);
  points.userData.speeds = speeds;
  points.userData.drift = drift;
  return points;
};

const buildPointCloud = (): THREE.Points => {
  const count = 1200;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const radius = Math.pow(Math.random(), 0.5) * 13;
    const angle = Math.random() * Math.PI * 2;
    positions[i * 3] = Math.cos(angle) * radius;
    positions[i * 3 + 1] = 0.5 + Math.random() * 5.5;
    positions[i * 3 + 2] = Math.sin(angle) * radius * 0.7;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    color: COLOR.ink,
    size: 0.035,
    transparent: true,
    opacity: 0.45,
    sizeAttenuation: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  return new THREE.Points(geometry, material);
};

export const createHeroScene = (
  container: HTMLElement,
  framing: HeroSceneFraming = {},
): HeroSceneHandle => {
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(COLOR.background, 0.048);

  const [px, py, pz] = framing.cameraPosition ?? [0, 4.6, 11.5];
  const [lx, ly, lz] = framing.cameraLookAt ?? [0, 0.4, 0];
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(px, py, pz);
  camera.lookAt(lx, ly, lz);

  const canvas = document.createElement("canvas");
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  const { clientWidth, clientHeight } = container;
  renderer.setSize(clientWidth || 1, clientHeight || 1);

  const group = new THREE.Group();
  group.add(buildTerrain());
  group.add(buildStrata());
  group.add(buildBridge());
  group.add(buildTunnel());
  const { markers } = buildBoreholes(group);
  scene.add(group);

  const rig = buildConstructionRig();
  scene.add(rig);

  const points = buildPointCloud();
  scene.add(points);

  const dust = buildDust();
  scene.add(dust);

  // Pointer parallax — target values set by the caller on `pointermove`,
  // smoothed here so a jittery mouse never produces a jittery camera.
  let pointerTargetX = 0;
  let pointerTargetY = 0;
  let pointerX = 0;
  let pointerY = 0;

  const setPointer = (x: number, y: number) => {
    pointerTargetX = Math.max(-1, Math.min(1, x));
    pointerTargetY = Math.max(-1, Math.min(1, y));
  };

  const renderStatic = () => {
    renderer.render(scene, camera);
  };

  const renderFrame = (elapsedSeconds: number) => {
    pointerX += (pointerTargetX - pointerX) * 0.04;
    pointerY += (pointerTargetY - pointerY) * 0.04;

    group.rotation.y = Math.sin(elapsedSeconds * 0.05) * 0.06 + pointerX * 0.12;
    camera.position.x = px + Math.sin(elapsedSeconds * 0.04) * 1.2 + pointerX * 1.4;
    camera.position.y =
      py + Math.sin(elapsedSeconds * 0.07) * 0.3 - pointerY * 0.6;
    camera.lookAt(lx, ly + pointerY * 0.3, lz);

    markers.forEach((marker, i) => {
      const pulse = Math.sin(elapsedSeconds * 1.5 + i) * 0.5 + 0.5;
      marker.scale.setScalar(0.85 + pulse * 0.4);
      (marker.material as THREE.MeshBasicMaterial).opacity = 0.5 + pulse * 0.4;
    });

    points.rotation.y += 0.0006;
    rig.rotation.y = Math.sin(elapsedSeconds * 0.03) * 0.08;

    const dustPositions = dust.geometry.attributes.position;
    const speeds = dust.userData.speeds as Float32Array;
    const drift = dust.userData.drift as Float32Array;
    for (let i = 0; i < speeds.length; i++) {
      let y = dustPositions.getY(i) + speeds[i] * 0.016;
      if (y > 5.5) y = -1.5;
      const x = dustPositions.getX(i) + Math.sin(elapsedSeconds * 0.4 + drift[i]) * 0.002;
      dustPositions.setXY(i, x, y);
    }
    dustPositions.needsUpdate = true;

    renderer.render(scene, camera);
  };

  const resize = (width: number, height: number) => {
    if (width <= 0 || height <= 0) return;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  };

  const dispose = () => {
    scene.traverse((object) => {
      if (object instanceof THREE.Mesh || object instanceof THREE.LineSegments || object instanceof THREE.Line || object instanceof THREE.Points) {
        object.geometry.dispose();
        const material = object.material;
        if (Array.isArray(material)) {
          material.forEach((m) => m.dispose());
        } else {
          material.dispose();
        }
      }
    });
    renderer.dispose();
  };

  return { renderStatic, renderFrame, resize, setPointer, dispose, canvas };
};
