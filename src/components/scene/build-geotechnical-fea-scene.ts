/**
 * Geotechnical FEA hero — a premium, PLAXIS-inspired (not a copy: no
 * Bentley/PLAXIS branding, UI or exact visuals) finite-element geotechnical
 * visualization for the Geotechnical Engineering service page's hero: a
 * deep excavation with a retaining/strut system, a piled foundation and a
 * bored tunnel, all cut into six geological strata, wrapped in a graded FE
 * mesh, with toggleable deformation + analysis-result contours, a 6-stage
 * construction sequence, real click-drag/zoom orbit, hover tooltips and a
 * 5-band scroll choreography.
 *
 * **Architecture — vanilla Three.js**, per this codebase's own existing
 * setup (the brief itself asks to reuse it, not install a new rendering
 * stack) and the same `HeroSceneHandle` contract every other scene here
 * implements — see `geotechnical-plexus`'s ADR-0060 for the fuller
 * R3F-vs-vanilla reasoning this project already settled once.
 *
 * **Decomposition** matches the brief's named components as builder
 * modules under `./geotechnical-fea/`: `ground-model.ts` (GroundModel +
 * the ground surface deformation/contours), `soil-layers.ts` (SoilLayers —
 * stratum colour sampling + boundary lines), `finite-element-mesh.ts`
 * (FiniteElementMesh), `excavation-system.ts` (ExcavationSystem +
 * RetainingWall, combined — a retaining wall only exists as part of an
 * excavation system in this scene, so they share one file rather than
 * splitting a genuinely coupled pair), `pile-foundation.ts`
 * (PileFoundation), `tunnel-model.ts` (TunnelModel), `deformation.ts`
 * (DeformationController's math), `analysis-contours.ts`
 * (AnalysisContours), `construction-stages.ts` (ConstructionStageController
 * — see that file's own header for why it's a thin lookup rather than a
 * bigger controller class), `camera-controller.ts` (CameraController),
 * `lighting.ts` (SceneLighting). `EngineeringTooltip` is the small DOM
 * overlay built directly in this file (`buildTooltipElement` below) — kept
 * here rather than its own module since it's ~15 lines with no state of
 * its own beyond a DOM node.
 *
 * **Real click-drag orbit** is genuinely new for this codebase — every
 * other scene's canvas stays `pointer-events-none` (passive parallax
 * only). This scene's canvas gets `pointer-events: auto` (set inside
 * `camera-controller.ts`), a deliberate, scene-scoped exception.
 *
 * **Result modes + deformation toggle react immediately to clicks**, not
 * gated behind scroll position — but the scroll choreography's "60-80%:
 * switch into analysis mode" *auto-suggests* a result mode and enables the
 * deformed view the first time scroll crosses that band, as long as the
 * user hasn't already made an explicit choice via the UI (`setResultMode`/
 * `setDeformedView` below flip a "user has chosen" flag that permanently
 * hands control to the UI for that session). This keeps the direct-
 * manipulation UI honest (click "Effective Stress" and it always shows
 * effective stress, regardless of scroll position) while still delivering
 * the brief's cinematic scroll-triggered reveal on a first pass.
 *
 * **Mobile**: this codebase's standing convention (see ADR-0060) is
 * mobile-width = no WebGL at all, CSS fallback instead — `<HeroScene>`
 * enforces this unmodified. Tablet gets a reduced FE-mesh `densityScale`.
 */
import * as THREE from "three";
import { getDeviceTier, getTierBudget } from "@/lib/scene/device-tier";
import type { HeroSceneHandle } from "./hero-scene-types";
import { EXCAVATION_LEVEL_2_Y, SURFACE_Y, type ResultMode } from "./geotechnical-fea/constants";
import { setupLighting } from "./geotechnical-fea/lighting";
import { buildGroundModel } from "./geotechnical-fea/ground-model";
import { buildSoilBoundaryLines } from "./geotechnical-fea/soil-layers";
import { buildFiniteElementMesh } from "./geotechnical-fea/finite-element-mesh";
import { buildExcavationSystem } from "./geotechnical-fea/excavation-system";
import { buildPileFoundation } from "./geotechnical-fea/pile-foundation";
import { buildTunnelModel } from "./geotechnical-fea/tunnel-model";
import { createCameraController } from "./geotechnical-fea/camera-controller";
import { getConstructionStage, STAGE_COUNT, STAGE_TRANSITION_DAMPING } from "./geotechnical-fea/construction-stages";

export interface GeotechnicalFeaSceneHandle extends HeroSceneHandle {
  setConstructionStage: (index: number) => void;
  setResultMode: (mode: ResultMode) => void;
  setDeformedView: (enabled: boolean) => void;
}

// ---------------------------------------------------------------------------
// Scroll choreography — 6 keyframes across the brief's 5 named bands
// (0-20/20-40/40-60/60-80/80-100%), same piecewise-linear + damped-lerp
// idiom every scroll-driven scene in this codebase already uses.
// ---------------------------------------------------------------------------
interface ScrollKeyframe {
  p: number;
  meshVisibility: number;
  excavationEmphasis: number;
  analysisGate: number;
  cameraDistanceNudge: number;
  cameraAzimuthNudge: number;
}
const SCROLL_KEYFRAMES: ScrollKeyframe[] = [
  { p: 0.0, meshVisibility: 0.22, excavationEmphasis: 0, analysisGate: 0, cameraDistanceNudge: 0, cameraAzimuthNudge: 0 },
  { p: 0.2, meshVisibility: 0.32, excavationEmphasis: 0, analysisGate: 0, cameraDistanceNudge: 0, cameraAzimuthNudge: 0 },
  { p: 0.4, meshVisibility: 0.7, excavationEmphasis: 0.2, analysisGate: 0, cameraDistanceNudge: -1.1, cameraAzimuthNudge: 0 },
  { p: 0.6, meshVisibility: 0.85, excavationEmphasis: 1.0, analysisGate: 0.1, cameraDistanceNudge: -1.7, cameraAzimuthNudge: 0.04 },
  { p: 0.8, meshVisibility: 0.55, excavationEmphasis: 0.35, analysisGate: 1.0, cameraDistanceNudge: -0.9, cameraAzimuthNudge: 0.16 },
  { p: 1.0, meshVisibility: 0.35, excavationEmphasis: 0.1, analysisGate: 1.0, cameraDistanceNudge: 0.6, cameraAzimuthNudge: 0.34 },
];
const evaluateScroll = (p: number): ScrollKeyframe => {
  let i = 0;
  while (i < SCROLL_KEYFRAMES.length - 2 && p > SCROLL_KEYFRAMES[i + 1].p) i++;
  const a = SCROLL_KEYFRAMES[i];
  const b = SCROLL_KEYFRAMES[i + 1];
  const span = b.p - a.p;
  const t = span > 0 ? THREE.MathUtils.clamp((p - a.p) / span, 0, 1) : 0;
  return {
    p,
    meshVisibility: THREE.MathUtils.lerp(a.meshVisibility, b.meshVisibility, t),
    excavationEmphasis: THREE.MathUtils.lerp(a.excavationEmphasis, b.excavationEmphasis, t),
    analysisGate: THREE.MathUtils.lerp(a.analysisGate, b.analysisGate, t),
    cameraDistanceNudge: THREE.MathUtils.lerp(a.cameraDistanceNudge, b.cameraDistanceNudge, t),
    cameraAzimuthNudge: THREE.MathUtils.lerp(a.cameraAzimuthNudge, b.cameraAzimuthNudge, t),
  };
};

const buildTooltipElement = (): HTMLDivElement => {
  const el = document.createElement("div");
  el.style.cssText = [
    "position:absolute",
    "left:0",
    "top:0",
    "pointer-events:none",
    "padding:5px 11px",
    "border-radius:7px",
    "font:500 12px/1.3 system-ui,sans-serif",
    "letter-spacing:0.02em",
    "background:rgba(28,30,34,0.92)",
    "color:#f4f2ec",
    "white-space:nowrap",
    "transform:translate(-50%,-135%)",
    "opacity:0",
    "transition:opacity 140ms ease",
    "z-index:20",
    "will-change:transform,opacity",
  ].join(";");
  return el;
};

type InteractiveGroup = "wall" | "foundation" | "tunnel" | "ground";
const GROUP_ORDER: InteractiveGroup[] = ["wall", "foundation", "tunnel", "ground"];

export const createGeotechnicalFeaHeroScene = (container: HTMLElement): GeotechnicalFeaSceneHandle => {
  const canvas = document.createElement("canvas");
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setClearColor(0x000000, 0);

  let containerWidth = container.clientWidth || window.innerWidth;
  let containerHeight = container.clientHeight || 1;
  const { dprClamp } = getTierBudget(containerWidth);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, dprClamp, 2));
  renderer.setSize(containerWidth || 1, containerHeight || 1);

  const densityScale = getDeviceTier(containerWidth) === "desktop" ? 1 : 0.5;

  const scene = new THREE.Scene();
  const cameraController = createCameraController(canvas, (containerWidth || 1) / (containerHeight || 1));

  const lighting = setupLighting(scene);
  const ground = buildGroundModel();
  const boundaryLines = buildSoilBoundaryLines();
  const feMesh = buildFiniteElementMesh(densityScale);
  const excavation = buildExcavationSystem();
  const foundation = buildPileFoundation();
  const tunnel = buildTunnelModel();

  scene.add(ground.group, boundaryLines.lines, feMesh.lines, excavation.group, foundation.group, tunnel.group);

  // Tooltip is `position: absolute` against `container` — needs a real
  // containing block. Read the *computed* style, not `container.style`,
  // so an already-`relative`/`absolute` container via an external CSS
  // class isn't mistaken for unset and overridden.
  if (getComputedStyle(container).position === "static") {
    container.style.position = "relative";
  }
  const tooltipEl = buildTooltipElement();
  container.appendChild(tooltipEl);

  const groupSetHover: Record<InteractiveGroup, (amount: number) => void> = {
    wall: excavation.setHover,
    foundation: foundation.setHover,
    tunnel: tunnel.setHover,
    ground: ground.setHover,
  };
  const groupTooltipLabel: Record<InteractiveGroup, string> = {
    wall: "Retaining System",
    foundation: "Deep Foundation",
    tunnel: "Tunnel & Underground Works",
    ground: "Soil Stratigraphy",
  };
  const objectToGroup = new Map<THREE.Object3D, InteractiveGroup>();
  excavation.interactiveObjects.forEach((o) => objectToGroup.set(o, "wall"));
  foundation.interactiveObjects.forEach((o) => objectToGroup.set(o, "foundation"));
  tunnel.interactiveObjects.forEach((o) => objectToGroup.set(o, "tunnel"));
  ground.interactiveObjects.forEach((o) => objectToGroup.set(o, "ground"));
  const allInteractiveObjects = [...objectToGroup.keys()];
  const hoverAmounts = new Map<InteractiveGroup, number>(GROUP_ORDER.map((g) => [g, 0]));
  const raycaster = new THREE.Raycaster();

  const pointerNdc = new THREE.Vector2(0, 0);
  let hasPointerMoved = false;

  const updateHover = (dt: number, scrollEmphasis: number) => {
    let hoveredGroup: InteractiveGroup | null = null;
    let hoveredPoint: THREE.Vector3 | null = null;
    if (hasPointerMoved && !cameraController.isDragging()) {
      raycaster.setFromCamera(pointerNdc, cameraController.camera);
      const hit = raycaster.intersectObjects(allInteractiveObjects, false)[0];
      if (hit) {
        hoveredGroup = objectToGroup.get(hit.object) ?? null;
        hoveredPoint = hit.point;
      }
    }

    for (const groupId of GROUP_ORDER) {
      const current = hoverAmounts.get(groupId) ?? 0;
      const target = groupId === hoveredGroup ? 1 : 0;
      const next = current + (target - current) * Math.min(1, dt * 6);
      hoverAmounts.set(groupId, next);
      const applied = groupId === "wall" || groupId === "foundation" ? Math.max(next, scrollEmphasis) : next;
      groupSetHover[groupId](applied);
    }

    if (hoveredGroup && hoveredPoint) {
      tooltipEl.textContent = groupTooltipLabel[hoveredGroup];
      tooltipEl.style.opacity = "1";
      const ndc = hoveredPoint.clone().project(cameraController.camera);
      tooltipEl.style.left = `${(ndc.x * 0.5 + 0.5) * containerWidth}px`;
      tooltipEl.style.top = `${(1 - (ndc.y * 0.5 + 0.5)) * containerHeight}px`;
    } else {
      tooltipEl.style.opacity = "0";
    }
  };

  // ---- construction stage + result mode + deformation state ----
  let currentStageIndex = 0;
  let internalResultMode: ResultMode = "none";
  let userHasSetResultMode = false;
  let internalDeformedView = false;
  let userHasSetDeformedView = false;
  let scrollTarget = 0;

  let curExcavationY = SURFACE_Y;
  let curWallsRevealed = 0;
  let curStrut0 = 0;
  let curStrut1 = 0;
  let curFoundationRevealed = 0;
  let curBuildingRevealed = 0;
  let curStageDeform = 0;
  let curDeformedViewAmount = 0;
  let curContourBlend = 0;
  let curMeshVisibility = SCROLL_KEYFRAMES[0].meshVisibility;
  let curExcavationEmphasis = 0;
  let curAnalysisGate = 0;
  let lastElapsed = 0;

  const setPointer = (x: number, y: number) => {
    pointerNdc.set(x, y);
    hasPointerMoved = true;
  };
  const setScrollProgress = (progress: number) => {
    scrollTarget = THREE.MathUtils.clamp(progress, 0, 1);
  };

  const stepFrame = (dt: number) => {
    const scroll = evaluateScroll(scrollTarget);
    const fastDamp = Math.min(1, dt * 3);
    curMeshVisibility += (scroll.meshVisibility - curMeshVisibility) * fastDamp;
    curExcavationEmphasis += (scroll.excavationEmphasis - curExcavationEmphasis) * fastDamp;
    curAnalysisGate += (scroll.analysisGate - curAnalysisGate) * fastDamp;

    if (!userHasSetResultMode) internalResultMode = curAnalysisGate > 0.5 ? "displacement-total" : "none";
    if (!userHasSetDeformedView) internalDeformedView = curAnalysisGate > 0.5;

    const stage = getConstructionStage(currentStageIndex);
    const stageDamp = Math.min(1, dt * STAGE_TRANSITION_DAMPING);
    curExcavationY += (stage.excavationY - curExcavationY) * stageDamp;
    curWallsRevealed += (stage.wallsRevealed - curWallsRevealed) * stageDamp;
    curStrut0 += (stage.strutsRevealed[0] - curStrut0) * stageDamp;
    curStrut1 += (stage.strutsRevealed[1] - curStrut1) * stageDamp;
    curFoundationRevealed += (stage.foundationRevealed - curFoundationRevealed) * stageDamp;
    curBuildingRevealed += (stage.buildingRevealed - curBuildingRevealed) * stageDamp;
    curStageDeform += (stage.deformAmount - curStageDeform) * stageDamp;

    curDeformedViewAmount += ((internalDeformedView ? 1 : 0) - curDeformedViewAmount) * fastDamp;
    curContourBlend += ((internalResultMode !== "none" ? 1 : 0) - curContourBlend) * fastDamp;

    const effectiveDeform = curStageDeform * curDeformedViewAmount;
    const excavationFraction = THREE.MathUtils.clamp((SURFACE_Y - curExcavationY) / (SURFACE_Y - EXCAVATION_LEVEL_2_Y), 0, 1);

    ground.update(curExcavationY, effectiveDeform, internalResultMode, curContourBlend);
    ground.setBuildingReveal(curBuildingRevealed);
    excavation.update(curExcavationY, effectiveDeform, curWallsRevealed, [curStrut0, curStrut1], internalResultMode, curContourBlend);
    tunnel.update(excavationFraction, effectiveDeform, internalResultMode, curContourBlend);
    foundation.setReveal(curFoundationRevealed);
    feMesh.setVisibility(curMeshVisibility);

    updateHover(dt, curExcavationEmphasis);

    cameraController.setScrollInfluence(scroll.cameraDistanceNudge, scroll.cameraAzimuthNudge);
    cameraController.setParallax(pointerNdc.x, pointerNdc.y);
  };

  const renderStatic = () => {
    stepFrame(0.05);
    cameraController.update(0, 0);
    renderer.render(scene, cameraController.camera);
  };

  const renderFrame = (elapsedSeconds: number) => {
    const dt = Math.min(0.05, Math.max(0, elapsedSeconds - lastElapsed));
    lastElapsed = elapsedSeconds;
    stepFrame(dt);
    cameraController.update(dt, elapsedSeconds);
    renderer.render(scene, cameraController.camera);
  };

  const resize = (width: number, height: number) => {
    if (width <= 0 || height <= 0) return;
    containerWidth = width;
    containerHeight = height;
    cameraController.setAspect(width / height);
    renderer.setSize(width, height);
  };
  resize(containerWidth || 1, containerHeight || 1);

  const dispose = () => {
    lighting.dispose();
    ground.dispose();
    boundaryLines.dispose();
    feMesh.dispose();
    excavation.dispose();
    foundation.dispose();
    tunnel.dispose();
    cameraController.dispose();
    renderer.dispose();
    tooltipEl.remove();
  };

  return {
    renderStatic,
    renderFrame,
    resize,
    setPointer,
    setScrollProgress,
    dispose,
    canvas,
    setConstructionStage: (index: number) => {
      currentStageIndex = Math.max(0, Math.min(STAGE_COUNT - 1, index));
    },
    setResultMode: (mode: ResultMode) => {
      internalResultMode = mode;
      userHasSetResultMode = true;
    },
    setDeformedView: (enabled: boolean) => {
      internalDeformedView = enabled;
      userHasSetDeformedView = true;
    },
  };
};
