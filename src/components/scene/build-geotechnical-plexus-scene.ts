/**
 * Geotechnical Plexus — a premium underground digital-twin visualization for
 * the homepage: ground surface, six geological strata, a depth-graded
 * "Plexus" node/line/face network reading as an engineering computation
 * mesh, five labelled boreholes, a piled foundation, a groundwater plane,
 * and slow data pulses riding the network — composed into one scroll- and
 * pointer-driven scene.
 *
 * **Architecture — vanilla Three.js, not React Three Fiber.** The original
 * brief asked for React Three Fiber + @react-three/drei + GSAP/Framer
 * Motion. That conflicts with this codebase's hard rule #1 (all motion is
 * spring-based via @react-spring/web; framer-motion is explicitly banned)
 * and none of R3F/drei/gsap/framer-motion are installed dependencies. Raised
 * to the user directly (`AskUserQuestion`), who chose to match the existing
 * architecture over forking it. So: one plain `THREE.WebGLRenderer` builder
 * implementing this project's own `HeroSceneHandle` contract (same shape as
 * `build-negentropy-scene.ts`, `build-pinwheel-galaxy-scene.ts`, etc.),
 * mounted through the existing `<HeroScene>` wrapper — which supplies
 * mobile/reduced-motion gating, tier-based DPR clamp, pause-when-offscreen,
 * and dispose-on-unmount for free, exactly as it does for every other scene
 * in this codebase. Zero new dependencies.
 *
 * **Decomposition.** The brief explicitly asks for named sub-components
 * (Terrain, GeologicalLayers, PlexusMesh, Boreholes, FoundationSystem,
 * Groundwater, DataPulses, SceneLighting) and "do not put everything inside
 * one huge component." This is one imperative Three.js scene graph, not a
 * declarative React tree, so there's no JSX component per part — instead
 * each part is its own builder module under `./geotechnical-plexus/`,
 * returning a small handle (`{ group, dispose, ...controls }`) that this
 * file composes. The brief's "ScrollController" is the keyframe/lerp logic
 * below, inline rather than a tenth file — it's ~30 lines of pure math with
 * no geometry of its own, and every other scroll-driven scene in this
 * codebase (Negentropy, Pinwheel Galaxy) keeps that logic in the main
 * builder for the same reason.
 *
 * **Visual direction is a deliberate light-theme island.** The brief asks
 * for a "white/light background... premium, minimal, architectural" look —
 * the opposite of this site's dark Neural Monitor palette everywhere else.
 * Scoped to new `--surface-engineering`/`--ink-engineering`/etc tokens
 * (globals.css) rather than touching `--background`/`--foreground`, so nothing
 * else on the site is affected. The canvas itself renders with `alpha: true`
 * so the section's own light CSS background shows through — no hardcoded
 * clear colour to keep in sync with the token.
 *
 * **No EffectComposer / bloom.** Every other subsystem here already reads
 * clearly through plain lighting and translucency; the brief also
 * explicitly asks to avoid "excessive bloom" and "glowing sci-fi grids".
 * Skipping post-processing entirely is both truer to the brief and a real
 * performance win — this is the least GPU-expensive hero scene in the
 * codebase (no render targets, one draw call per subsystem via instancing/
 * BufferGeometry, no shadow maps).
 *
 * **Mobile.** The brief asks for "reduced node count and line density" on
 * mobile, implying the scene keeps rendering there. This codebase's own
 * established convention (every other WebGL hero/background this session)
 * is instead "mobile tier = no WebGL, CSS/spring fallback" — `<HeroScene>`
 * enforces this itself and was left unmodified per the plan above. The
 * *tablet* tier (which brief-wise is still "a smaller screen") does get the
 * density reduction (`densityScale` below), which is where the brief's
 * intent actually lands given that architecture; true mobile-width devices
 * get the section's own light-themed static fallback instead of a
 * struggling WebGL scene, consistent with every other scene on this site.
 *
 * **Coordinate system.** X: ±6 (width 12), Z: ±4 (depth 8), Y: surface at
 * +1.0 down to bedrock's floor at -9.5 — see `geotechnical-plexus/constants.ts`.
 */
import * as THREE from "three";
import { getDeviceTier, getTierBudget } from "@/lib/scene/device-tier";
import type { HeroSceneHandle } from "./hero-scene-types";
import { LAYERS } from "./geotechnical-plexus/constants";
import { buildTerrain } from "./geotechnical-plexus/terrain";
import { buildGeologicalLayers } from "./geotechnical-plexus/geological-layers";
import { buildPlexusMesh } from "./geotechnical-plexus/plexus-mesh";
import { buildBoreholes } from "./geotechnical-plexus/boreholes";
import { buildFoundationSystem } from "./geotechnical-plexus/foundation-system";
import { buildGroundwater } from "./geotechnical-plexus/groundwater";
import { buildDataPulses } from "./geotechnical-plexus/data-pulses";
import { setupLighting } from "./geotechnical-plexus/lighting";

// ---------------------------------------------------------------------------
// Scroll choreography — 5 keyframes matching the brief's 5 named stages:
// 1 complete block, 2 exploded layers, 3 plexus emphasis, 4 borehole/pile
// highlight, 5 reassembly. Piecewise-linear between keyframes (matching
// `evaluateCameraFlight` in build-negentropy-scene.ts), then damped toward
// per-frame so no stage transition is abrupt.
// ---------------------------------------------------------------------------
interface StageKeyframe {
  p: number;
  explode: number;
  plexusVisibility: number;
  highlight: number;
}
const STAGE_KEYFRAMES: StageKeyframe[] = [
  { p: 0.0, explode: 0, plexusVisibility: 0.15, highlight: 0 },
  { p: 0.25, explode: 1.0, plexusVisibility: 0.3, highlight: 0 },
  { p: 0.5, explode: 0.6, plexusVisibility: 1.0, highlight: 0.2 },
  { p: 0.75, explode: 0.3, plexusVisibility: 0.7, highlight: 1.0 },
  { p: 1.0, explode: 0, plexusVisibility: 0.4, highlight: 0.2 },
];

const evaluateStage = (p: number): { explode: number; plexusVisibility: number; highlight: number } => {
  let i = 0;
  while (i < STAGE_KEYFRAMES.length - 2 && p > STAGE_KEYFRAMES[i + 1].p) i++;
  const a = STAGE_KEYFRAMES[i];
  const b = STAGE_KEYFRAMES[i + 1];
  const span = b.p - a.p;
  const t = span > 0 ? THREE.MathUtils.clamp((p - a.p) / span, 0, 1) : 0;
  return {
    explode: THREE.MathUtils.lerp(a.explode, b.explode, t),
    plexusVisibility: THREE.MathUtils.lerp(a.plexusVisibility, b.plexusVisibility, t),
    highlight: THREE.MathUtils.lerp(a.highlight, b.highlight, t),
  };
};

const EXPLODE_GAP = 0.85;
const LAYER_MIDDLE_INDEX = (LAYERS.length - 1) / 2;
/** Per-second damping rate for the eased stage values and mouse tilt — a
 * `1 - exp(-rate*dt)` style approach-to-target, matching the dt-scaled
 * lerp idiom already used in `build-negentropy-scene.ts`. */
const STAGE_DAMPING = 3.2;
const TILT_DAMPING = 2.5;
const HOVER_DAMPING = 6;
const MAX_TILT_Y = 0.15;
const MAX_TILT_X = 0.08;

type InteractiveKind = "borehole" | "foundation" | "layer";
interface InteractiveEntry {
  object: THREE.Object3D;
  kind: InteractiveKind;
  index: number;
}

export const createGeotechnicalPlexusScene = (container: HTMLElement): HeroSceneHandle => {
  const canvas = document.createElement("canvas");
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",
  });
  renderer.setClearColor(0x000000, 0);

  const { clientWidth, clientHeight } = container;
  const measuredWidth = clientWidth || window.innerWidth;
  const { dprClamp } = getTierBudget(measuredWidth);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, dprClamp, 2));
  renderer.setSize(clientWidth || 1, clientHeight || 1);

  const densityScale = getDeviceTier(measuredWidth) === "desktop" ? 1 : 0.55;

  const scene = new THREE.Scene();
  const sceneRoot = new THREE.Group();
  scene.add(sceneRoot);

  const camera = new THREE.PerspectiveCamera(38, (clientWidth || 1) / (clientHeight || 1), 0.1, 100);
  camera.position.set(10.5, 7.5, 11.5);
  camera.lookAt(0, -3.2, 0);

  const lighting = setupLighting(scene);
  const terrain = buildTerrain();
  const layers = buildGeologicalLayers();
  const plexus = buildPlexusMesh(densityScale);
  const boreholes = buildBoreholes(layers);
  const foundation = buildFoundationSystem();
  const groundwater = buildGroundwater();
  const pulses = buildDataPulses(plexus.edges, densityScale);

  sceneRoot.add(terrain.group);
  layers.forEach((layer) => sceneRoot.add(layer.group));
  sceneRoot.add(plexus.group);
  sceneRoot.add(boreholes.group);
  sceneRoot.add(foundation.group);
  sceneRoot.add(groundwater.mesh);
  sceneRoot.add(pulses.mesh);

  const interactive: InteractiveEntry[] = [
    ...boreholes.interactiveObjects.map((object, index): InteractiveEntry => ({ object, kind: "borehole", index })),
    ...foundation.interactiveObjects.map((object): InteractiveEntry => ({ object, kind: "foundation", index: 0 })),
    ...layers.map((layer): InteractiveEntry => ({ object: layer.mesh, kind: "layer", index: layer.index })),
  ];
  const interactiveObjects = interactive.map((entry) => entry.object);
  const raycaster = new THREE.Raycaster();
  const hoverAmounts = new Map<string, number>();

  const pointerNdc = new THREE.Vector2(0, 0);
  let hasPointer = false;
  let scrollTarget = 0;
  let curExplode = STAGE_KEYFRAMES[0].explode;
  let curPlexusVisibility = STAGE_KEYFRAMES[0].plexusVisibility;
  let curHighlight = STAGE_KEYFRAMES[0].highlight;
  let curTiltX = 0;
  let curTiltY = 0;
  let lastElapsed = 0;

  const applyExplode = (amount: number) => {
    layers.forEach((layer) => {
      layer.group.position.y = (LAYER_MIDDLE_INDEX - layer.index) * amount * EXPLODE_GAP;
    });
  };

  const applyPlexusVisibility = (amount: number) => {
    plexus.setVisibility(amount);
    pulses.setVisibility(amount);
  };

  const updateHover = (dt: number, stageHighlight: number) => {
    let hoveredKey: string | null = null;
    if (hasPointer) {
      raycaster.setFromCamera(pointerNdc, camera);
      const hit = raycaster.intersectObjects(interactiveObjects, false)[0];
      if (hit) {
        const entry = interactive.find((candidate) => candidate.object === hit.object);
        if (entry) hoveredKey = `${entry.kind}_${entry.index}`;
      }
    }
    interactive.forEach((entry) => {
      const key = `${entry.kind}_${entry.index}`;
      const current = hoverAmounts.get(key) ?? 0;
      const target = key === hoveredKey ? 1 : 0;
      const next = current + (target - current) * Math.min(1, dt * HOVER_DAMPING);
      hoverAmounts.set(key, next);
      if (entry.kind === "borehole") boreholes.setHover(entry.index, Math.max(next, stageHighlight));
      else if (entry.kind === "foundation") foundation.setHover(Math.max(next, stageHighlight));
      else layers[entry.index].setHover(next);
    });
  };

  const setPointer = (x: number, y: number) => {
    pointerNdc.set(x, y);
    hasPointer = true;
  };

  const setScrollProgress = (progress: number) => {
    scrollTarget = THREE.MathUtils.clamp(progress, 0, 1);
  };

  const renderStatic = () => {
    applyExplode(0);
    applyPlexusVisibility(STAGE_KEYFRAMES[0].plexusVisibility);
    foundation.setHover(0);
    pulses.update(0);
    renderer.render(scene, camera);
  };

  const renderFrame = (elapsedSeconds: number) => {
    const dt = Math.min(0.05, Math.max(0, elapsedSeconds - lastElapsed));
    lastElapsed = elapsedSeconds;

    const targets = evaluateStage(scrollTarget);
    const damping = Math.min(1, dt * STAGE_DAMPING);
    curExplode += (targets.explode - curExplode) * damping;
    curPlexusVisibility += (targets.plexusVisibility - curPlexusVisibility) * damping;
    curHighlight += (targets.highlight - curHighlight) * damping;

    applyExplode(curExplode);
    applyPlexusVisibility(curPlexusVisibility);
    updateHover(dt, curHighlight);

    const tiltDamping = Math.min(1, dt * TILT_DAMPING);
    curTiltY += (pointerNdc.x * MAX_TILT_Y - curTiltY) * tiltDamping;
    curTiltX += (-pointerNdc.y * MAX_TILT_X - curTiltX) * tiltDamping;
    sceneRoot.rotation.y = curTiltY;
    sceneRoot.rotation.x = curTiltX;

    pulses.update(elapsedSeconds);
    renderer.render(scene, camera);
  };

  const resize = (width: number, height: number) => {
    if (width <= 0 || height <= 0) return;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  };
  resize(clientWidth || 1, clientHeight || 1);

  const dispose = () => {
    lighting.dispose();
    terrain.dispose();
    layers.forEach((layer) => layer.dispose());
    plexus.dispose();
    boreholes.dispose();
    foundation.dispose();
    groundwater.dispose();
    pulses.dispose();
    renderer.dispose();
  };

  return { renderStatic, renderFrame, resize, setPointer, setScrollProgress, dispose, canvas };
};
