"use client";

// 📖 Docs: obsidian/frontend/components/projects.md

import { useEffect, useMemo, useRef } from "react";
import Image from "next/image";
import { animated } from "@react-spring/web";
import { useProgressTrigger } from "@/hooks/animation/use-progress-trigger";
import { subscribeToTicker } from "@/lib/animation/ticker";
import { projects } from "@/data/mocks/projects";
import { useProjectModalStore } from "@/views/home/project-modal-store";
import {
  buildShowreelTiles,
  cameraRigTransform,
  ctaOpacity,
  gridOpacity,
  introOpacity,
  tileTransform,
  TRACK_VH,
} from "./projects-showreel-config";

const PROGRESS_SPRING_CONFIG = { tension: 120, friction: 30 };

/**
 * Scroll-driven "flight" through a scattered field of every real project —
 * the Projects page's cinematic lead-in, sitting above the full browsable
 * `ProjectsSection` grid beneath it (unchanged). Adapted from the
 * user-supplied "AI Studio" reference template's Projects/Showreel section
 * (see `projects-showreel-config.ts` header) using this project's own
 * scroll-trigger hook and spring motion — a single sticky stage with a
 * `perspective` 3D field, one progress-trigger driving a camera-rig
 * transform + group opacity (`useProgressTrigger`, the same vendored
 * scroll-trigger hook other tall-track/sticky-stage sections in this
 * codebase use).
 *
 * `prefers-reduced-motion` gets a static grid instead of the flight — the
 * scroll-jacked tall track and 3D transforms have no non-motion equivalent,
 * so the honest accessible fallback is the plain collage, not a slowed-down
 * version of the same animation.
 */
export const ProjectsShowreel = () => {
  const trackRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const openProject = useProjectModalStore((s) => s.open);
  const reducedMotion =
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const tiles = useMemo(() => buildShowreelTiles(projects), []);

  const { interpolatedProgress } = useProgressTrigger({
    elementRef: trackRef,
    start: "top top",
    end: "bottom bottom",
    config: PROGRESS_SPRING_CONFIG,
    enabled: !reducedMotion,
  });

  const s = useMemo(
    () => ({
      camera: interpolatedProgress.to(cameraRigTransform),
      grid: interpolatedProgress.to(gridOpacity),
      intro: interpolatedProgress.to(introOpacity),
      cta: interpolatedProgress.to(ctaOpacity),
    }),
    [interpolatedProgress],
  );

  // Manual stand-in for `position: sticky`. This site's `<body>` carries its
  // own `overflow: hidden auto` alongside `<html>`'s (the Lenis smooth-scroll
  // setup) — since body's own content never actually overflows its box,
  // `position: sticky` resolves against body's (permanently zero) scrollTop
  // instead of the real scrolling element (`<html>`), so it never engages.
  // Confirmed via `getBoundingClientRect()` against another identical
  // `sticky top-0` stage elsewhere in this codebase (about-team's old
  // Cards Cascade deck, since replaced by a plain grid — ADR-0072) — same
  // failure there too, a pre-existing sitewide quirk, not something
  // introduced here. Out of scope to fix globally this turn (see
  // ADR-0071), so this component reproduces sticky's three states by
  // hand: `absolute` at the track's top before it reaches the viewport
  // top, `fixed` to the viewport while the track is passing through,
  // `absolute` at the track's bottom once it's scrolled past — driven by
  // the shared ticker (imperative style writes, not React state, since
  // this runs every frame).
  useEffect(() => {
    if (reducedMotion) return;
    return subscribeToTicker(() => {
      const track = trackRef.current;
      const stage = stageRef.current;
      if (!track || !stage) return;
      const rect = track.getBoundingClientRect();
      const vh = window.innerHeight;
      if (rect.top > 0) {
        stage.style.position = "absolute";
        stage.style.top = "0";
        stage.style.bottom = "";
      } else if (rect.bottom < vh) {
        stage.style.position = "absolute";
        stage.style.top = "";
        stage.style.bottom = "0";
      } else {
        stage.style.position = "fixed";
        stage.style.top = "0";
        stage.style.bottom = "";
      }
    }, () => 0);
  }, [reducedMotion]);

  const tileNodes = tiles.map((tile) => (
    <div
      key={tile.project.title}
      role="button"
      tabIndex={0}
      aria-label={`View details for ${tile.project.title}`}
      onClick={() => openProject(tile.project)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openProject(tile.project);
        }
      }}
      className="border-line/50 bg-surface hover:border-accent/60 absolute top-1/2 left-1/2 flex cursor-pointer flex-col justify-end overflow-hidden rounded-2xl border p-4 transition-colors duration-[var(--duration-fast)] ease-entrance focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      style={
        reducedMotion
          ? { width: tile.width, height: tile.height }
          : {
              width: tile.width,
              height: tile.height,
              transform: `translate(-50%, -50%) ${tileTransform(tile)}`,
            }
      }
    >
      <Image
        src={tile.project.image.src}
        alt=""
        fill
        sizes="340px"
        className="object-cover"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background: "linear-gradient(to top, rgba(1,4,14,.85) 0%, rgba(1,4,14,.15) 45%, rgba(1,4,14,0) 70%)",
        }}
      />
      <div className="relative">
        <p className="text-foreground-muted text-xs tracking-[0.14em] uppercase [text-shadow:0_1px_10px_rgba(0,0,0,.6)]">
          {tile.project.sector}
        </p>
        <h3 className="text-foreground mt-1 text-sm font-medium [text-shadow:0_1px_10px_rgba(0,0,0,.6)]">
          {tile.project.title}
        </h3>
      </div>
    </div>
  ));

  if (reducedMotion) {
    return (
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-4 px-6 py-16 sm:grid-cols-3 md:grid-cols-4 md:px-8">
        {tiles.map((tile) => (
          <div
            key={tile.project.title}
            role="button"
            tabIndex={0}
            aria-label={`View details for ${tile.project.title}`}
            onClick={() => openProject(tile.project)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                openProject(tile.project);
              }
            }}
            className="border-line/50 bg-surface hover:border-accent/60 relative flex aspect-[4/3] cursor-pointer flex-col justify-end overflow-hidden rounded-2xl border p-4 transition-colors duration-[var(--duration-fast)] ease-entrance focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <Image
              src={tile.project.image.src}
              alt=""
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
              className="object-cover"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0"
              style={{
                background: "linear-gradient(to top, rgba(1,4,14,.85) 0%, rgba(1,4,14,.15) 45%, rgba(1,4,14,0) 70%)",
              }}
            />
            <div className="relative">
              <p className="text-foreground-muted text-xs tracking-[0.14em] uppercase">
                {tile.project.sector}
              </p>
              <h3 className="text-foreground mt-1 text-sm font-medium">
                {tile.project.title}
              </h3>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div ref={trackRef} className="relative" style={{ height: `${TRACK_VH}vh` }}>
      <div
        ref={stageRef}
        className="bg-background absolute inset-x-0 top-0 z-10 flex h-screen items-center justify-center overflow-hidden"
      >
        <animated.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-1/3 z-10 mx-auto max-w-2xl px-6 text-center"
          style={{ opacity: s.intro }}
        >
          <p className="text-foreground-muted mb-4 text-xs tracking-[0.3em] uppercase">
            27 projects · 7 countries
          </p>
          <h2 className="text-foreground leading-display text-3xl font-medium md:text-5xl">
            Every landmark, in one field
          </h2>
        </animated.div>

        <div className="relative h-full w-full [perspective:1400px]" style={{ perspectiveOrigin: "50% 50%" }}>
          <animated.div
            className="absolute top-1/2 left-1/2 h-0 w-0 [transform-style:preserve-3d]"
            style={{ transform: s.camera, opacity: s.grid }}
          >
            {tileNodes}
          </animated.div>
        </div>

        <animated.div
          className="pointer-events-none absolute inset-x-0 bottom-16 z-10 flex justify-center"
          style={{ opacity: s.cta }}
        >
          <a
            href="#projects"
            className="bg-accent text-accent-foreground hover:bg-accent/90 transition-colors duration-[var(--duration-fast)] pointer-events-auto ease-entrance inline-flex items-center rounded-full px-8 py-4 text-sm font-medium tracking-[0.08em] uppercase"
          >
            Explore All Projects
          </a>
        </animated.div>
      </div>
    </div>
  );
};
