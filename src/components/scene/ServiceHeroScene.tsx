"use client";

import { HeroScene } from "./HeroScene";
import { SERVICE_HERO_SCENES } from "./service-heroes";
import type { Service } from "@/data/mocks/services";

export interface ServiceHeroSceneProps {
  sceneTheme: Service["sceneTheme"];
  className?: string;
}

/**
 * Client-boundary leaf between a service detail page (Server Component) and
 * `HeroScene` — functions can't cross the server/client boundary as props,
 * so the caller passes the serializable `sceneTheme` and the
 * `SERVICE_HERO_SCENES` lookup happens here instead.
 */
export const ServiceHeroScene = ({ sceneTheme, className }: ServiceHeroSceneProps) => (
  <HeroScene className={className} createScene={SERVICE_HERO_SCENES[sceneTheme]} />
);
