"use client";

import Link from "next/link";
import { useRef } from "react";
import { Hover } from "@/components/animation/springs/hover";
import { SceneViewport } from "@/components/scene/SceneViewport";
import { HeroScene } from "@/components/scene/HeroScene";
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

  return (
    <Hover
      ref={cardRef}
      tag="article"
      from={{ y: 0 }}
      to={{ y: -8 }}
      config={{ tension: 300, friction: 24 }}
      className="border-line bg-surface hover:border-accent/60 relative overflow-hidden rounded-2xl border p-7 transition-colors duration-[var(--duration-normal)] ease-entrance"
    >
      {dedicatedScene && (
        <>
          <HeroScene
            createScene={dedicatedScene}
            className="pointer-events-none absolute inset-0"
          />
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
