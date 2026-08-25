/**
 * Registry of service detail page hero scenes, keyed by `sceneTheme` (not
 * slug). See ADR-0027 in obsidian/meta/decisions-log.md for why this is a
 * theme-keyed registry rather than a slug-keyed one.
 */
import type { Service } from "@/data/mocks/services";
import type { HeroSceneHandle } from "../hero-scene-types";
import { createCorridorGradingScene } from "./build-corridor-grading-scene";
import { createBimClashDetectionScene } from "./build-bim-clash-detection-scene";
import { createGeologicalDigitalTwinScene } from "./build-geological-digital-twin-scene";
import { createStructuralFemAnalysisScene } from "./build-structural-fem-analysis-scene";
import { createFloodInundationTerrainScene } from "./build-flood-inundation-terrain-scene";
import { createScheduleNetworkGraphScene } from "./build-schedule-network-graph-scene";
import { createAdvisoryLifecycleNetworkScene } from "./build-advisory-lifecycle-network-scene";
import { createTelecomSignalNetworkScene } from "./build-telecom-signal-network-scene";

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
