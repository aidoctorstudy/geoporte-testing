/**
 * The shared service-card mini-scene registry — empty as of this file's
 * latest revision. All eight service-card icons now have their own
 * dedicated full-bleed card background instead of a shared corner
 * mini-scene — see `ServiceCard.tsx`'s `DEDICATED_CARD_SCENES`/
 * `DEDICATED_CARD_VIDEOS`, `build-solaris-scene.ts` (ADR-0036),
 * `build-aether-flux-scene.ts` (ADR-0042),
 * `build-einstein-rosen-lattice-scene.ts` (ADR-0044),
 * `build-golden-parthenon-scene.ts` (ADR-0045/ADR-0047),
 * `build-negentropy-scene.ts` (ADR-0048), the Siloutte video (ADR-0050),
 * `build-aureole-scene.ts` (ADR-0051), and `build-spiral-galaxy-scene.ts`
 * (ADR-0054, which retired this file's last entry, `buildTelecomTower`).
 * Kept (rather than deleted) as the registration point for a future
 * service-card icon that doesn't warrant its own dedicated
 * `EffectComposer`/full-bleed treatment — see `SceneViewport.tsx`, which
 * reads this map and simply renders nothing when a slug has no entry.
 */
import type { ViewportBuilder } from "@/lib/scene/shared-viewport-renderer";

export const MINI_SCENES: Record<string, ViewportBuilder> = {};
