/**
 * Registry of service detail page hero scenes, keyed by `sceneTheme` (not
 * slug). See ADR-0027 in obsidian/meta/decisions-log.md for why this is a
 * theme-keyed registry rather than a slug-keyed one.
 */
import type { Service } from "@/data/mocks/services";
import type { HeroSceneHandle } from "../hero-scene-types";
import { createAetherFluxHeroScene } from "../build-aether-flux-scene";
import { createSolarisHeroScene } from "../build-solaris-scene";
import { createEinsteinRosenLatticeHeroScene } from "../build-einstein-rosen-lattice-scene";
import { createGoldenParthenonHeroScene } from "../build-golden-parthenon-scene";
import { createNegentropyHeroScene } from "../build-negentropy-scene";
import { createScheduleNetworkGraphScene } from "./build-schedule-network-graph-scene";
import { createAdvisoryLifecycleNetworkScene } from "./build-advisory-lifecycle-network-scene";
import { createTelecomSignalNetworkScene } from "./build-telecom-signal-network-scene";

// `aether-flux`/`solaris`/`einstein-rosen-lattice`/`golden-parthenon`/
// `negentropy`/`schedule-network-graph`/`advisory-lifecycle-network`
// entries are never actually invoked through this registry —
// `ServiceHero.tsx` mounts their scenes as fixed, route-scoped page
// backgrounds instead (`AetherFluxBackground`/`SolarisBackground`/
// `EinsteinRosenLatticeBackground`/`GoldenParthenonBackground`/
// `NegentropyBackground`/`ProjectControlBackground` — a video, not a WebGL
// scene/`AureoleBackground` — so `createScheduleNetworkGraphScene` and
// `createAdvisoryLifecycleNetworkScene` below are dead code, kept only for
// the same reason the others are) and skips calling `ServiceHeroScene` for
// those themes entirely. Kept here only so this remains a total `Record`
// over `Service["sceneTheme"]`.
//
// The Geotechnical Engineering page's *hero section* also never reaches
// this registry — `service-detail.tsx` special-cases that slug to render
// the bespoke `GeotechnicalAnalysisHero.tsx` instead of `ServiceHero.tsx`,
// which mounts its own bounded FE scene
// (`build-geotechnical-fea-scene.ts`) directly, on top of the Solaris
// background this registry's `solaris` entry still (also) serves. See
// ADR-0061.
export const SERVICE_HERO_SCENES: Record<Service["sceneTheme"], (container: HTMLElement) => HeroSceneHandle> = {
  "golden-parthenon": createGoldenParthenonHeroScene,
  "aether-flux": createAetherFluxHeroScene,
  solaris: createSolarisHeroScene,
  "einstein-rosen-lattice": createEinsteinRosenLatticeHeroScene,
  negentropy: createNegentropyHeroScene,
  "schedule-network-graph": createScheduleNetworkGraphScene,
  "advisory-lifecycle-network": createAdvisoryLifecycleNetworkScene,
  "telecom-signal-network": createTelecomSignalNetworkScene,
};
