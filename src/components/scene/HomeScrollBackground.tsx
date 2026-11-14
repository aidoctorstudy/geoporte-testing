"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { HeroScene } from "./HeroScene";
import { SceneFallbackGradient } from "./SceneFallbackGradient";
import { createHomeStrataScene } from "./build-home-scene-0-strata";
import { createHomeTunnelScene } from "./build-home-scene-1-tunnel";
import { createHomeFEAScene } from "./build-home-scene-2-fea";
import { createHomeSonarScene } from "./build-home-scene-3-sonar";
import { createHomePileMatrixScene } from "./build-home-scene-4-pilemat";
import { createHomeDunesScene } from "./build-home-scene-5-dunes";

const HOMEPAGE_ROUTE = "/";

const SCENE_SENTINELS = [
  "hero",
  "services",
  "digital-twin",
  "recent-commissions",
  "who-we-work-for",
  "team-cta",
] as const;

const SCENE_FALLBACKS = [
  "radial-gradient(ellipse at 30% 70%, #0a3d2e 0%, #040d1a 55%, #010408 100%)",
  "radial-gradient(ellipse at 50% 60%, #0a1a3d 0%, #040d1a 55%, #010408 100%)",
  "radial-gradient(ellipse at 60% 40%, #003344 0%, #040d1a 55%, #010408 100%)",
  "radial-gradient(ellipse at 40% 60%, #001a3d 0%, #040d1a 55%, #010408 100%)",
  "radial-gradient(ellipse at 50% 50%, #001533 0%, #040d1a 55%, #010408 100%)",
  "radial-gradient(ellipse at 50% 70%, #3d2a0a 0%, #1a0d04 55%, #010408 100%)",
] as const;

const SCENE_FACTORIES = [
  createHomeStrataScene,
  createHomeTunnelScene,
  createHomeFEAScene,
  createHomeSonarScene,
  createHomePileMatrixScene,
  createHomeDunesScene,
] as const;

export const HomeScrollBackground = () => {
  const pathname = usePathname();
  // Start at -1 so ALL scenes are opacity-0 until the observer fires,
  // EXCEPT we immediately fire scene 0 on mount via useEffect below.
  const [activeScene, setActiveScene] = useState(0);
  const observersRef = useRef<IntersectionObserver[]>([]);

  useEffect(() => {
    // Immediately show scene 0 — prevents the black flash at page top
    setActiveScene(0);

    observersRef.current.forEach((obs) => obs.disconnect());
    observersRef.current = [];

    const sentinels = SCENE_SENTINELS.map((id) => document.getElementById(id));

    sentinels.forEach((el, i) => {
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveScene(i);
        },
        // rootMargin: triggers a bit BEFORE the section hits 15% visibility
        // so the crossfade is already underway when user reaches the section.
        { threshold: 0.1, rootMargin: "0px 0px -5% 0px" },
      );
      obs.observe(el);
      observersRef.current.push(obs);
    });

    return () => {
      observersRef.current.forEach((obs) => obs.disconnect());
      observersRef.current = [];
    };
  }, []);

  if (pathname !== HOMEPAGE_ROUTE) return null;

  return (
    <>
      {SCENE_FACTORIES.map((factory, i) => (
        <div
          key={i}
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 -z-20 h-full w-full"
          style={{
            opacity: activeScene === i ? 1 : 0,
            transition: "opacity 1.4s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          <HeroScene
            createScene={factory}
            className="h-full w-full"
            fallback={
              <SceneFallbackGradient
                gradient={SCENE_FALLBACKS[i]}
                className="h-full w-full"
              />
            }
          />
        </div>
      ))}
    </>
  );
};
