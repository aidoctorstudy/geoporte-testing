/**
 * Registry of service detail page hero scenes, keyed by `sceneTheme` (not
 * slug) — this is what lets `geological-digital-twin` reuse the homepage's
 * `createHeroScene` directly instead of needing a 9th bespoke scene or a
 * special case in the view. See ADR-0027 in obsidian/meta/decisions-log.md.
 */
import type { Service } from "@/data/mocks/services";
import { createHeroScene } from "../build-hero-scene";
import type { HeroSceneHandle } from "../hero-scene-types";
import { createCorridorGradingScene } from "./build-corridor-grading-scene";
import { createBimClashDetectionScene } from "./build-bim-clash-detection-scene";
import { createStructuralFemAnalysisScene } from "./build-structural-fem-analysis-scene";
import { createFloodInundationTerrainScene } from "./build-flood-inundation-terrain-scene";
import { createScheduleNetworkGraphScene } from "./build-schedule-network-graph-scene";
import { createAdvisoryLifecycleNetworkScene } from "./build-advisory-lifecycle-network-scene";
import { createTelecomSignalNetworkScene } from "./build-telecom-signal-network-scene";

const createGeologicalDigitalTwinScene = (container: HTMLElement): HeroSceneHandle =>
  createHeroScene(container, { cameraPosition: [0, 3.6, 9], cameraLookAt: [0, 0.2, 0] });

export const SERVICE_HERO_SCENES: Record<Service["sceneTheme"], (container: HTMLElement) => HeroSceneHandle> = {
  "corridor-grading": createCorridorGradingScene,
  "bim-clash-detection": createBimClashDetectionScene,
  "geological-digital-twin": createGeologicalDigitalTwinScene,
  "structural-fem-analysis": createStructuralFemAnalysisScene,
  "flood-inundation-terrain": createFloodInundationTerrainScene,
  "schedule-network-graph": createScheduleNetworkGraphScene,
  "advisory-lifecycle-network": createAdvisoryLifecycleNetworkScene,
  "telecom-signal-network": createTelecomSignalNetworkScene,
};
