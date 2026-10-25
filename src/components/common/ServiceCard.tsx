"use client";

import Link from "next/link";
import { useCallback, useRef } from "react";
import { Hover } from "@/components/animation/springs/hover";
import { SceneViewport } from "@/components/scene/SceneViewport";
import { HeroScene } from "@/components/scene/HeroScene";
import { SceneFallbackGradient } from "@/components/scene/SceneFallbackGradient";
import { useDynamicInView } from "@/hooks/animation/use-dynamic-in-view";
import { useWindowWidth } from "@/hooks/use-window-size";
import { getCardSceneRootMargin } from "@/lib/scene/device-tier";
import { MINI_SCENES } from "@/components/scene/mini-scenes";
import { createSolarisCardScene } from "@/components/scene/build-solaris-scene";
import { createAetherFluxCardScene } from "@/components/scene/build-aether-flux-scene";
import { createEinsteinRosenLatticeCardScene } from "@/components/scene/build-einstein-rosen-lattice-scene";
import { createGoldenParthenonCardScene } from "@/components/scene/build-golden-parthenon-scene";
import { createNegentropySpiralCardScene } from "@/components/scene/build-negentropy-scene";
import { createAureoleCardScene } from "@/components/scene/build-aureole-scene";
import { createSpiralGalaxyCardScene } from "@/components/scene/build-spiral-galaxy-scene";
import { VideoBackground } from "@/components/common/VideoBackground";
import type { HeroSceneHandle } from "@/components/scene/hero-scene-types";
import type { Service } from "@/data/mocks/services";

export interface ServiceCardProps {
  service: Service;
}

// The six cards with a full-bleed contained WebGL scene instead of the
// shared mini-scene corner icon — each needs its own `EffectComposer` for
// bloom, which the shared scissored renderer (`shared-viewport-renderer.ts`)
// can't provide. Same pattern as `GLASS_BACKGROUND_ROUTES`/`GLASS_SCENE_THEMES`:
// one lookup instead of a per-slug boolean, so a seventh dedicated-scene card
// doesn't mean copy-pasting this special case again. See ADR-0036, ADR-0042,
// ADR-0044, ADR-0045, ADR-0047, ADR-0048, ADR-0051, ADR-0054.
const DEDICATED_CARD_SCENES: Record<string, (container: HTMLElement) => HeroSceneHandle> = {
  "geotechnical-engineering": createSolarisCardScene,
  "design-and-drafting": createAetherFluxCardScene,
  "structural-engineering": createEinsteinRosenLatticeCardScene,
  "civil-engineering": createGoldenParthenonCardScene,
  "stormwater-and-flood-modelling": createNegentropySpiralCardScene,
  "advisory-services": createAureoleCardScene,
  "telecom-services": createSpiralGalaxyCardScene,
};

// Mobile/tablet (`< MOBILE_WEBGL_SKIP_WIDTH`) never mounts any of the
// `DEDICATED_CARD_SCENES` above — ADR-0106: 7 cards each spinning up their
// own `WebGLRenderer` + `EffectComposer` + `UnrealBloomPass` (the whole
// reason they can't share the scissored renderer every other mini-scene
// uses) is already a real concurrent-WebGL-context pressure point on iOS
// (ADR-0087's crash report), and below the grid's own `lg:grid-cols-3`
// breakpoint (1024px) the section lays out 1–2 columns instead of 3,
// meaning every card scrolls past one at a time rather than a full row's
// worth sharing one scroll position — each one's shader compile/composer
// setup is real main-thread work landing right as the page is trying to
// scroll the user toward Stats/Projects/Contact, which is exactly the kind
// of transient main-thread stall ADR-0102 already diagnosed as capable of
// starving an `IntersectionObserver` callback for content further down the
// page. Reusing each scene's own already-tokenized fallback gradient
// (`SceneFallbackGradient`, the same component every full-page background
// shows on the "low" capability tier) instead of inventing a second
// fallback treatment. Width-gated, not capability-tier-gated — unlike
// `isLowPowerDevice()`, this applies even to a flagship phone/tablet,
// because the pressure here is *concurrent context count*, which doesn't
// care how fast any one of them is.
const MOBILE_WEBGL_SKIP_WIDTH = 1024;

const DEDICATED_CARD_GRADIENTS: Record<string, string> = {
  "geotechnical-engineering": "var(--raw-gradient-fallback-solaris)",
  "design-and-drafting": "var(--raw-gradient-fallback-aether-flux)",
  "structural-engineering": "var(--raw-gradient-fallback-wormhole)",
  "civil-engineering": "var(--raw-gradient-fallback-golden-parthenon)",
  "stormwater-and-flood-modelling": "var(--raw-gradient-fallback-negentropy)",
  "advisory-services": "var(--raw-gradient-fallback-aureole)",
  "telecom-services": "var(--raw-gradient-fallback-spiral-galaxy)",
};

// The one card with a full-bleed background *video* instead of a WebGL
// scene — same "own full-bleed layer, not the shared mini-scene icon" shape
// as `DEDICATED_CARD_SCENES` above, just a different asset type. Card-sized
// re-encodes of the same Siloutte video used on the Project Control
// Services page background. See ADR-0050.
const DEDICATED_CARD_VIDEOS: Record<string, { mp4: string; webm: string; poster: string }> = {
  "project-control-services": {
    mp4: "/assets/siloutte/siloutte-card.mp4",
    webm: "/assets/siloutte/siloutte-card.webm",
    poster: "/assets/siloutte/siloutte-card.jpg",
  },
};

export const ServiceCard = ({ service }: ServiceCardProps) => {
  const cardRef = useRef<HTMLElement>(null);
  const dedicatedScene = DEDICATED_CARD_SCENES[service.slug];
  const dedicatedVideo = DEDICATED_CARD_VIDEOS[service.slug];
  const builder = MINI_SCENES[service.slug];

  // Mounts each dedicated card scene's own `WebGLRenderer`/`EffectComposer`
  // trio only while the card is within ~800px of the viewport — not just
  // deferred until first arrival (ADR-0084), but *unmounted* again once
  // scrolled well past, instead of accumulating forever. A one-way "warm
  // once, keep forever" latch (this component's previous shape) still lets
  // total concurrent contexts climb back up to the pre-ADR-0084 count by the
  // time a user has scrolled past all 7 `DEDICATED_CARD_SCENES` cards — it
  // only delayed reaching that ceiling, it didn't lower it. Symmetric
  // `rootMargin` (expands the intersection root by 800px on every side, so
  // a card is "in view" from 800px before it arrives until 800px after it
  // leaves) gives this hysteresis for free: generous enough that ordinary
  // scrolling never thrashes mount/unmount, tight enough to bound the
  // concurrent ceiling to roughly "however many cards fit in a ~1600px
  // scroll band" instead of every card ever visited. This is the real,
  // capability- and platform-agnostic answer to "Mobile Safari has limited
  // WebGL memory" for any device that actually mounts one of these scenes
  // at all. `HeroScene`'s own `isLowPowerDevice()` gate still applies
  // underneath this regardless. As of ADR-0106, below
  // `MOBILE_WEBGL_SKIP_WIDTH` none of these mount in the first place — a
  // different concern than per-device *capability* (the "a capable phone
  // keeps full WebGL rather than losing it to a viewport-width check"
  // principle ADR-0078/79/81/83 established is about GPU/CPU speed, and
  // stays true above that width): this is about how many of these
  // own-composer contexts the 1–2-column mobile/tablet layout can put
  // "near view" at once, a per-tab resource ceiling no amount of per-device
  // speed changes.
  //
  // Uses the callback-ref form (`setNode`), not `trigger: cardRef` — proven
  // pattern, same as `StatCounter`/`ExperienceStatBox`. `cardRef` is still
  // needed separately for `hoverRef` on the `SceneViewport` branch below,
  // so both refs are set from one `useCallback`-memoized callback — not an
  // inline closure: `Hover`'s `ref` prop is a callback ref, and React
  // detaches (`null`) then reattaches a callback ref whenever its identity
  // changes between renders, not just on mount/unmount. An unmemoized
  // closure gets a new identity every render, and `setInViewNode` (the
  // state setter driving `nearView`) itself triggers a render — so every
  // render it caused would detach-then-reattach the ref, re-triggering
  // `setInViewNode` again: a loop that churns without ever letting the
  // `IntersectionObserver` hold a stable-enough subscription to report
  // back, which is what silently made `nearView` never turn `true` before
  // this was memoized. `rootMargin` itself is platform-scaled (ADR-0087) —
  // tighter on iOS (400px vs 800px), where the real WebGL memory ceiling
  // this hysteresis is bounding actually lives, independent of capability
  // tier; see `getCardSceneRootMargin`'s own comment.
  const [setInViewNode, nearView] = useDynamicInView({ rootMargin: getCardSceneRootMargin() });
  // `0` is the pre-hydration/SSR snapshot (see `useWindowWidth`) — treated
  // as "not mobile yet" so this never mounts WebGL server-side and only
  // skips it once the client has actually measured a narrow viewport,
  // matching every other `width > 0 &&` guard in this codebase.
  const windowWidth = useWindowWidth();
  const skipDedicatedScene = windowWidth > 0 && windowWidth < MOBILE_WEBGL_SKIP_WIDTH;
  const setCardNode = useCallback(
    (node: HTMLElement | null) => {
      cardRef.current = node;
      setInViewNode(node);
    },
    [setInViewNode],
  );

  return (
    <Hover
      ref={setCardNode}
      tag="article"
      from={{ y: 0 }}
      to={{ y: -8 }}
      config={{ tension: 300, friction: 24 }}
      className="border-line bg-surface hover:border-accent/60 relative overflow-hidden rounded-2xl border p-7 transition-colors duration-[var(--duration-normal)] ease-entrance"
    >
      {dedicatedScene && (skipDedicatedScene || nearView) && (
        <>
          {skipDedicatedScene ? (
            <SceneFallbackGradient
              gradient={DEDICATED_CARD_GRADIENTS[service.slug]}
              className="pointer-events-none absolute inset-0"
            />
          ) : (
            <HeroScene
              createScene={dedicatedScene}
              className="pointer-events-none absolute inset-0"
            />
          )}
          <div
            aria-hidden="true"
            className="from-background/90 via-background/40 absolute inset-0 bg-gradient-to-t to-transparent"
          />
        </>
      )}
      {dedicatedVideo && (
        <>
          <VideoBackground
            mp4Src={dedicatedVideo.mp4}
            webmSrc={dedicatedVideo.webm}
            poster={dedicatedVideo.poster}
            pauseWhenOffscreen
            className="pointer-events-none absolute inset-0 z-0 h-full w-full object-cover"
          />
          <div
            aria-hidden="true"
            className="from-background/90 via-background/40 absolute inset-0 z-0 bg-gradient-to-t to-transparent"
          />
        </>
      )}
      {!dedicatedScene && !dedicatedVideo && builder && (
        <SceneViewport
          builder={builder}
          hoverRef={cardRef}
          className="pointer-events-none absolute right-5 top-5 h-16 w-16"
          fallback={
            <div className="border-line/60 bg-background-alt/40 h-16 w-16 rounded-full border" />
          }
        />
      )}
      <Link
        href={`/services/${service.slug}`}
        className="group relative z-10 flex h-full flex-col"
      >
        <h3 className="text-foreground max-w-[calc(100%-4.5rem)] text-xl font-medium">
          {service.title}
        </h3>
        <p className="text-foreground-muted mt-3 flex-1 text-sm leading-relaxed">
          {service.shortDescription}
        </p>
        <span className="text-accent group-hover:text-glow mt-6 inline-flex items-center gap-2 text-xs font-medium tracking-[0.12em] uppercase transition-colors duration-[var(--duration-fast)] ease-entrance">
          Explore
          <span aria-hidden="true">→</span>
        </span>
      </Link>
    </Hover>
  );
};
