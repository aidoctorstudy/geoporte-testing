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
import { getTierBudget } from "@/lib/scene/device-tier";
import type { HeroSceneHandle } from "./hero-scene-types";

/** Optional camera re-framing — unused today (this scene is homepage-only
 * since the geotechnical service page got its own bespoke builder), kept as
 * an override point rather than hardcoding the homepage framing inline;
 * defaults reproduce the original homepage hero framing exactly. */
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

/** A tower crane rendered as a thin wireframe silhouette. The jib (arm) sits
 * in its own sub-group, pivoted at the mast top, so it can swing
 * independently of the mast — see `jibGroup` in the return value. */
const buildCrane = (): { group: THREE.Group; jibGroup: THREE.Group } => {
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

  const jibGroup = new THREE.Group();
  jibGroup.position.set(0, 5.4, 0);
  group.add(jibGroup);

  const jibGeometry = new THREE.BoxGeometry(4.6, 0.08, 0.08);
  const jib = new THREE.LineSegments(new THREE.EdgesGeometry(jibGeometry), material);
  jib.position.set(2, 0, 0);
  jibGroup.add(jib);

  const counterJib = new THREE.LineSegments(
    new THREE.EdgesGeometry(jibGeometry),
    material,
  );
  counterJib.scale.set(0.4, 1, 1);
  counterJib.position.set(-1, 0, 0);
  jibGroup.add(counterJib);
  jibGeometry.dispose();

  const hookLineGeometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(3.6, 0, 0),
    new THREE.Vector3(3.6, -2.3, 0),
  ]);
  jibGroup.add(new THREE.Line(hookLineGeometry, material));

  return { group, jibGroup };
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
 * group that rotates slowly and independently of the main digital-twin group.
 * Returns the sub-parts the render loop animates: the crane's jib (swings
 * independently), and the girders/scaffolding final positions (they "fly in"
 * / scale up from nothing over the first few seconds — see `renderFrame`). */
const buildConstructionRig = (): {
  group: THREE.Group;
  jibGroup: THREE.Group;
  girders: THREE.Group;
  girdersRestX: number;
  scaffolding: THREE.LineSegments;
} => {
  const group = new THREE.Group();

  const { group: crane, jibGroup } = buildCrane();
  crane.position.set(-8, -1.2, -6);
  group.add(crane);

  const girders = buildGirders();
  const girdersRestX = 7;
  girders.position.set(girdersRestX, 2.4, -5.5);
  group.add(girders);

  const scaffolding = buildScaffolding();
  scaffolding.position.set(-5.5, 0.6, 4.5);
  scaffolding.scale.setScalar(0.001);
  group.add(scaffolding);

  return { group, jibGroup, girders, girdersRestX, scaffolding };
};

/** Dust motes drifting upward through the scene, wrapping once they clear the top. */
const buildDust = (particleScale: number): THREE.Points => {
  const count = Math.round(260 * particleScale);
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

const buildPointCloud = (particleScale: number): THREE.Points => {
  const count = Math.round(1200 * particleScale);
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

/** A flat ring on the ground plane, scaled up each pulse cycle to sweep
 * outward like a surveyor's laser / lidar scan — see the "lidar pulse" in
 * `renderFrame`. Starts at scale 0 (invisible) and is rescaled every frame. */
const buildLidarPulseRing = (): { ring: THREE.Mesh; material: THREE.MeshBasicMaterial } => {
  const geometry = new THREE.RingGeometry(0.97, 1, 64);
  geometry.rotateX(-Math.PI / 2);
  const material = new THREE.MeshBasicMaterial({
    color: COLOR.glow,
    transparent: true,
    opacity: 0,
    side: THREE.DoubleSide,
  });
  const ring = new THREE.Mesh(geometry, material);
  ring.position.y = -1.4;
  ring.scale.setScalar(0.001);
  return { ring, material };
};

/**
 * Classic "particles form a logotype" technique (the genre this mirrors —
 * motion-graphics demos that spell out a wordmark from glowing points on
 * load, then let it drift/breathe): render the brand wordmark to an
 * offscreen 2D canvas, sample which pixels are "on", and use those as the
 * particles' resting positions. Lives inside this same scene/renderer
 * rather than a second dedicated `HeroScene` — a second full-bleed WebGL
 * context for one hero feature would reopen exactly the concurrent-context
 * budget this project has spent several passes closing (ADR-0084/85/87 in
 * decisions-log.md).
 */
const PARTICLE_LOGO_TEXT = "GEOPORTE";
const PARTICLE_LOGO_ASSEMBLE_DURATION_S = 2.8;
const PARTICLE_LOGO_CANVAS_WIDTH = 960;
const PARTICLE_LOGO_CANVAS_HEIGHT = 220;

/** Renders `text` to an offscreen canvas and returns one 3D point per
 * sampled "on" pixel (alpha ≥ 128), centred on the origin and scaled so the
 * text is `targetWidth` world units wide. `step` controls sampling density
 * (and therefore particle count) — larger on lower-capability tiers. */
const sampleTextParticlePositions = (
  text: string,
  targetWidth: number,
  step: number,
): Float32Array => {
  const canvas = document.createElement("canvas");
  canvas.width = PARTICLE_LOGO_CANVAS_WIDTH;
  canvas.height = PARTICLE_LOGO_CANVAS_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new Float32Array(0);

  // A bold, geometric system sans — not one of this project's two actual
  // webfonts (Playfair Display's thin serifs would scatter into
  // disconnected dots at particle resolution; Inter would work but isn't
  // guaranteed loaded by the time this runs). Only used for sampling pixel
  // positions, never rendered on screen, so it doesn't need to match either.
  ctx.fillStyle = "#fff";
  ctx.font = `700 ${PARTICLE_LOGO_CANVAS_HEIGHT * 0.56}px system-ui, -apple-system, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  // `letterSpacing` is a standard (if newer) 2D-context property — widens
  // the sampled glyphs slightly so tightly-kerned letters still resolve
  // into visually separate particle clusters rather than one dense blob.
  ctx.letterSpacing = "6px";
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);

  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const samples: number[] = [];
  for (let y = 0; y < canvas.height; y += step) {
    for (let x = 0; x < canvas.width; x += step) {
      if (data[(y * canvas.width + x) * 4 + 3] < 128) continue;
      samples.push(x, y);
    }
  }

  const scale = targetWidth / canvas.width;
  const positions = new Float32Array((samples.length / 2) * 3);
  for (let i = 0; i < samples.length / 2; i++) {
    positions[i * 3] = (samples[i * 2] - canvas.width / 2) * scale;
    positions[i * 3 + 1] = -(samples[i * 2 + 1] - canvas.height / 2) * scale; // canvas Y grows down
    positions[i * 3 + 2] = (Math.random() - 0.5) * 0.15; // slight z-jitter, not a flat decal
  }
  return positions;
};

interface ParticleLogo {
  points: THREE.Points;
  /** Advances the assembly ease and, once settled, the idle breathe/drift —
   * call once per `renderFrame`, or once with a saturating `elapsedSeconds`
   * from `renderStatic` so a reduced-motion/one-frame render shows the
   * fully-formed logo rather than mid-scatter. */
  update: (elapsedSeconds: number) => void;
}

/** Builds the particle GEOPORTE wordmark — each particle eases from a
 * scattered sphere into its sampled text position over
 * `PARTICLE_LOGO_ASSEMBLE_DURATION_S`, then (once settled) gently breathes
 * and drifts in place via a per-particle sine phase, same idiom this file's
 * `buildDust` already uses for its own per-particle animation. */
const buildParticleLogo = (particleScale: number): ParticleLogo => {
  // Sparser sampling (fewer particles) on lower-capability tiers — mirrors
  // every other particleScale consumer in this file.
  const step = Math.max(2, Math.round(4 / Math.sqrt(particleScale)));
  const target = sampleTextParticlePositions(PARTICLE_LOGO_TEXT, 9, step);
  const count = target.length / 3;

  const start = new Float32Array(count * 3);
  const phase = new Float32Array(count);
  const breatheSpeed = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    // Scattered start: a loose sphere around the text's resting position.
    const radius = 4.5 + Math.random() * 3.5;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(Math.random() * 2 - 1);
    start[i * 3] = Math.sin(phi) * Math.cos(theta) * radius;
    start[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * radius;
    start[i * 3 + 2] = Math.cos(phi) * radius;
    phase[i] = Math.random() * Math.PI * 2;
    breatheSpeed[i] = 0.5 + Math.random() * 0.5;
  }

  const positions = new Float32Array(start);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    color: COLOR.logoGlow,
    size: 0.045,
    transparent: true,
    opacity: 0,
    sizeAttenuation: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;

  const update = (elapsedSeconds: number) => {
    const assembleT = Math.min(elapsedSeconds / PARTICLE_LOGO_ASSEMBLE_DURATION_S, 1);
    const ease = 1 - Math.pow(1 - assembleT, 3); // easeOutCubic, same as the construction rig's own assembly
    const settled = assembleT >= 1;
    const posAttr = geometry.attributes.position;

    for (let i = 0; i < count; i++) {
      const breathe = settled ? Math.sin(elapsedSeconds * breatheSpeed[i] + phase[i]) * 0.04 : 0;
      const drift = settled ? Math.cos(elapsedSeconds * breatheSpeed[i] * 0.6 + phase[i]) * 0.025 : 0;
      posAttr.setXYZ(
        i,
        start[i * 3] + (target[i * 3] - start[i * 3]) * ease + drift,
        start[i * 3 + 1] + (target[i * 3 + 1] - start[i * 3 + 1]) * ease + breathe,
        start[i * 3 + 2] + (target[i * 3 + 2] - start[i * 3 + 2]) * ease,
      );
    }
    posAttr.needsUpdate = true;
    material.opacity = 0.25 + ease * 0.65 + (settled ? Math.sin(elapsedSeconds * 0.8) * 0.08 : 0);
  };

  return { points, update };
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
  // Tier-based, not a flat 2x — see the identical fix in
  // `service-heroes/hero-scene-runtime.ts`.
  const { clientWidth, clientHeight } = container;
  const { dprClamp, particleScale } = getTierBudget(clientWidth || window.innerWidth);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, dprClamp));
  renderer.setSize(clientWidth || 1, clientHeight || 1);

  const group = new THREE.Group();
  group.add(buildTerrain());
  group.add(buildStrata());
  group.add(buildBridge());
  group.add(buildTunnel());
  const { markers } = buildBoreholes(group);
  scene.add(group);

  const { group: rig, jibGroup, girders, girdersRestX, scaffolding } = buildConstructionRig();
  scene.add(rig);

  const points = buildPointCloud(particleScale);
  scene.add(points);

  const dust = buildDust(particleScale);
  scene.add(dust);

  const { ring: lidarRing, material: lidarMaterial } = buildLidarPulseRing();
  scene.add(lidarRing);

  // Elevated, up-and-right of the scene's own look-at point — clears the
  // bridge/terrain below and sits inside the fog's still-legible range.
  // Placement wasn't visually tuned live against the hero's 2D text overlay
  // (no browser session available) — worth a real look before calling this
  // fully settled.
  const particleLogo = buildParticleLogo(particleScale);
  particleLogo.points.position.set(2.6, 3.8, -1.5);
  scene.add(particleLogo.points);

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

  // Scroll-driven framing — target set by the caller from a `<SpringTrigger
  // mode="scrub">` wrapping the hero, smoothed the same way as pointer.
  let scrollTarget = 0;
  let scrollProgress = 0;

  const setScrollProgress = (progress: number) => {
    scrollTarget = Math.max(0, Math.min(1, progress));
  };

  // Camera orbits the scene's look-at point on a fixed-radius circle in the
  // XZ plane — pointer drives the orbit angle (±ORBIT_MAX_RAD) and scroll
  // pulls the camera down/in toward the strata cutaway.
  const orbitRadius = Math.hypot(px - lx, pz - lz);
  const orbitBaseTheta = Math.atan2(px - lx, pz - lz);
  const ORBIT_MAX_RAD = THREE.MathUtils.degToRad(15);
  const LIDAR_PULSE_PERIOD_S = 3;
  const LIDAR_PULSE_MAX_RADIUS = 13;
  const RIG_ASSEMBLE_DURATION_S = 2.5;

  const renderStatic = () => {
    // Forces the particle logo to its fully-assembled resting state rather
    // than the scattered construction state it starts in — `renderStatic`
    // never calls `renderFrame`'s own time-driven update, so without this a
    // reduced-motion visitor would see a permanent scattered particle cloud
    // instead of the logo.
    particleLogo.update(PARTICLE_LOGO_ASSEMBLE_DURATION_S);
    renderer.render(scene, camera);
  };

  const renderFrame = (elapsedSeconds: number) => {
    particleLogo.update(elapsedSeconds);
    pointerX += (pointerTargetX - pointerX) * 0.04;
    pointerY += (pointerTargetY - pointerY) * 0.04;
    scrollProgress += (scrollTarget - scrollProgress) * 0.06;

    group.rotation.y = Math.sin(elapsedSeconds * 0.05) * 0.06 + pointerX * 0.12;

    const orbitTheta = orbitBaseTheta + pointerX * ORBIT_MAX_RAD;
    const zoomedRadius = orbitRadius * (1 - scrollProgress * 0.25);
    camera.position.x =
      lx + Math.sin(orbitTheta) * zoomedRadius + Math.sin(elapsedSeconds * 0.04) * 1.2;
    camera.position.z = lz + Math.cos(orbitTheta) * zoomedRadius;
    camera.position.y =
      py + Math.sin(elapsedSeconds * 0.07) * 0.3 - pointerY * 0.6 - scrollProgress * 3.2;
    camera.lookAt(lx, ly + pointerY * 0.3 - scrollProgress * 1.6, lz);

    markers.forEach((marker, i) => {
      const pulse = Math.sin(elapsedSeconds * 1.5 + i) * 0.5 + 0.5;
      marker.scale.setScalar(0.85 + pulse * 0.4);
      (marker.material as THREE.MeshBasicMaterial).opacity = 0.5 + pulse * 0.4;
    });

    points.rotation.y += 0.0006;
    rig.rotation.y = Math.sin(elapsedSeconds * 0.03) * 0.08;
    jibGroup.rotation.y = Math.sin(elapsedSeconds * 0.15) * 0.35;

    // One-time "assembly" ease over the first few seconds — girders fly in
    // from an offset, scaffolding scales up from nothing.
    const assembleT = Math.min(elapsedSeconds / RIG_ASSEMBLE_DURATION_S, 1);
    const assembleEase = 1 - Math.pow(1 - assembleT, 3); // easeOutCubic
    girders.position.x = girdersRestX + (1 - assembleEase) * 4;
    scaffolding.scale.setScalar(0.001 + assembleEase * 0.999);

    // Rig/point-cloud fade as the camera pulls down toward the strata —
    // gestures at "morphing toward the geological scene below" without a
    // literal cross-canvas morph into the (separate) About section scene.
    const fade = 1 - scrollProgress * 0.7;
    rig.traverse((node) => {
      const withMaterial = node as unknown as { material?: THREE.Material };
      const material = withMaterial.material;
      if (!(material instanceof THREE.LineBasicMaterial)) return;
      material.userData.baseOpacity ??= material.opacity;
      material.opacity = material.userData.baseOpacity * fade;
    });
    (points.material as THREE.PointsMaterial).opacity = 0.45 * fade;

    // Lidar pulse — a ring expanding from the centre every `LIDAR_PULSE_PERIOD_S`.
    const pulsePhase = (elapsedSeconds % LIDAR_PULSE_PERIOD_S) / LIDAR_PULSE_PERIOD_S;
    const pulseRadius = pulsePhase * LIDAR_PULSE_MAX_RADIUS;
    lidarRing.scale.setScalar(Math.max(pulseRadius, 0.001));
    lidarMaterial.opacity = (1 - pulsePhase) * 0.35;

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

  return {
    renderStatic,
    renderFrame,
    resize,
    setPointer,
    setScrollProgress,
    dispose,
    canvas,
  };
};
