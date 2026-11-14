"use client";

// 📖 Docs: obsidian/architecture/tech-stack.md → "3D — scroll-triggered homepage scenes"

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { HeroScene } from "./HeroScene";
import { SceneFallbackGradient } from "./SceneFallbackGradient";
import { createGeotechnicalPlexusScene } from "./build-geotechnical-plexus-scene";
import { createSolarisHeroScene } from "./build-solaris-scene";
import { createTeamStarfieldScene } from "./build-team-starfield-scene";
import { createSpiralGalaxyHeroScene } from "./build-spiral-galaxy-scene";

/**
 * Homepage-only scroll-triggered background system — replaces the cinematic
 * Earth globe (`PlanetBackground`) on the homepage with four lightweight
 * geo-themed scenes that crossfade as the user scrolls through the page.
 *
 * **Why four scenes instead of one?**
 * The planet canvas was destroying devices — a Draco GLB, custom day/night
 * shaders, three `EffectComposer` bloom passes, three cloud shells, a
 * starfield, and radar pings. Four lightweight scenes crossfaded via CSS
 * `opacity` are significantly cheaper in total than the planet: no GLB load,
 * no Draco decompression, no bloom composers, no cloud shells.
 *
 * **Scene assignments** (chosen for geotechnical brand fit):
 *   0 — GeotechnicalPlexus  → hero, about, services, sectors
 *       The underground digital-twin mesh. Earns the hero's first impression.
 *   1 — Solaris             → how-we-work, project experience, commissions
 *       Warm amber-orange particle sun — engineering warmth.
 *   2 — TeamStarfield       → team experience, stats, who we work for
 *       Calm deep-navy starfield — authority without noise.
 *   3 — SpiralGalaxy        → insight, projects, team CTA, contact
 *       Gold-violet spiral — a premium close to the page.
 *
 * Mounted once at the app root (in `layout.tsx`) but only renders on `/`.
 * `PlanetBackground` excludes `/` via its own updated guard so the two
 * never render together.
 */

const HOMEPAGE_ROUTE = "/";

// IDs of the first section in each scene group.
// Group 0: GeotechnicalPlexus — hero through sectors
// Group 1: Solaris — how-we-work through recent-commissions
// Group 2: TeamStarfield — team-experience through who-we-work-for
// Group 3: SpiralGalaxy — insight-teaser through contact
const SCENE_SENTINELS = ["hero", "how-we-work", "team-experience", "who-we-work-for"] as const;

const SCENE_FALLBACKS = [
  "var(--raw-gradient-fallback-geotechnical-plexus)",
  "var(--raw-gradient-fallback-solaris)",
  "var(--raw-gradient-fallback-team-starfield)",
  "var(--raw-gradient-fallback-spiral-galaxy)",
] as const;

const SCENE_FACTORIES = [
  createGeotechnicalPlexusScene,
  createSolarisHeroScene,
  createTeamStarfieldScene,
  createSpiralGalaxyHeroScene,
] as const;

export const HomeScrollBackground = () => {
  const pathname = usePathname();
  const [activeScene, setActiveScene] = useState(0);
  const observersRef = useRef<IntersectionObserver[]>([]);

  useEffect(() => {
    observersRef.current.forEach((obs) => obs.disconnect());
    observersRef.current = [];

    const sentinels = SCENE_SENTINELS.map((id) => document.getElementById(id));

    sentinels.forEach((el, i) => {
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setActiveScene(i);
          }
        },
        { threshold: 0.15 },
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
