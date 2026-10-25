"use client";

// 📖 Docs: obsidian/architecture/tech-stack.md → "3D — Geoporte hero + service scenes"

import { HeroScene } from "./HeroScene";
import { HeroFallback } from "./HeroFallback";
import { createHeroScene } from "./build-hero-scene";

/**
 * The maintenance page's own particle emblem — same `build-hero-scene.ts`
 * engine as the homepage hero, just centered (`logoPositionXDesktop: 0`)
 * instead of right-biased, since there's no left-column text competing for
 * the frame here. See ADR-0109.
 */
const createCenteredHeroScene = (container: HTMLElement) =>
  createHeroScene(container, { logoPositionXDesktop: 0 });

export const MaintenanceScene = () => (
  <HeroScene
    className="h-full w-full"
    createScene={createCenteredHeroScene}
    fallback={<HeroFallback className="h-full w-full" />}
  />
);
