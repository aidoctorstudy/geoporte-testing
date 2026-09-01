"use client";

// 📖 Docs: obsidian/frontend/components/projects.md

import { useCallback, useEffect, useMemo, useRef } from "react";
import Image from "next/image";
import { animated } from "@react-spring/web";
import { useProgressTrigger } from "@/hooks/animation/use-progress-trigger";
import { subscribeToTicker } from "@/lib/animation/ticker";
import { useScroll } from "@/hooks/smooth-scroll/use-scroll";
import { projects } from "@/data/mocks/projects";
import {
  cascadeActiveIndex,
  HERO_VH,
  introOpacity,
  placeCascadeCard,
  trackVh,
} from "./projects-cascade-config";

const PROGRESS_SPRING_CONFIG = { tension: 120, friction: 32 };

/**
 * `/projects`'s "Cards Cascade" — a `position: sticky`-style tall-track deck
 * that folds through every real project one at a time as the page scrolls,
 * built with plain CSS 3D transforms (`perspective` + `translate3d` +
 * `rotateX`) driven by this codebase's own spring scroll-trigger hook — no
 * WebGL, no `@keyframes`, no framer-motion. Page-scoped: only wired into
 * `projects.tsx`, not `ProjectsSection.tsx` (which the homepage also
 * renders and was left untouched). See ADR-0075.
 *
 * `prefers-reduced-motion` gets a plain static grid of every project instead
 * of the scroll-jacked fold — same approach `ProjectsShowreel.tsx` (this
 * page's other scroll-driven section) already takes, for the same reason:
 * the tall track and 3D transforms have no non-motion equivalent, so the
 * honest fallback is a different, static layout rather than a slowed-down
 * copy of the same animation.
 */
export const ProjectsCascade = () => {
  const trackRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const reducedMotion =
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const lenis = useScroll((s) => s.lenis);

  const total = projects.length;

  const { interpolatedProgress } = useProgressTrigger({
    elementRef: trackRef,
    start: "top top",
    end: "bottom bottom",
    config: PROGRESS_SPRING_CONFIG,
    enabled: !reducedMotion,
  });

  const intro = useMemo(
    () => interpolatedProgress.to((p) => introOpacity(p, total)),
    [interpolatedProgress, total],
  );

  const cardAnimations = useMemo(
    () =>
      projects.map((_, index) => ({
        transform: interpolatedProgress.to(
          (p) => placeCascadeCard(index - cascadeActiveIndex(p, total)).transform,
        ),
        opacity: interpolatedProgress.to(
          (p) => placeCascadeCard(index - cascadeActiveIndex(p, total)).opacity,
        ),
        zIndex: interpolatedProgress.to(
          (p) => placeCascadeCard(index - cascadeActiveIndex(p, total)).zIndex,
        ),
      })),
    [interpolatedProgress, total],
  );

  // Manual stand-in for `position: sticky` — this site's Lenis smooth-scroll
  // setup means `<body>`'s own overflow never actually engages, so `sticky`
  // never resolves against the real scrolling element. Same pre-existing
  // sitewide quirk `ProjectsShowreel.tsx` (this page's other tall-track
  // section) already works around the same way: absolute at the track's
  // top before it reaches the viewport, fixed while passing through,
  // absolute at the track's bottom once scrolled past — driven by the
  // shared ticker (imperative style writes, since this runs every frame).
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

  // The deck's own detail elements sit inside the pseudo-sticky stage above,
  // so a plain `href="#..."` anchor jump would resolve against a
  // `position: fixed` target sitting permanently at the viewport's top —
  // the browser would compute a ~0 scroll delta and never actually advance
  // past the intro. Scroll to a real document-relative offset instead (the
  // track's own top plus the intro's own height).
  //
  // Neither this codebase's shared `scrollTo()` helper (`@/utils/scroll-
  // to`) nor Lenis's own `lenis.scrollTo()` actually moved the page when
  // tested live (this button never advanced) — the helper races the
  // `isEnableScroll` Zustand flag against its own `window.scrollTo()` call
  // (the flag's `useEffect` hasn't necessarily called `lenis.stop()` yet),
  // and `lenis.scrollTo()` itself was a no-op in this setup regardless.
  // `lenis.stop()` + a plain `window.scrollTo({ behavior: "instant" })` +
  // `lenis.start()` afterward works reliably — but only with `"instant"`;
  // `"smooth"` was silently cancelled every time it was tested, on this
  // exact sequence, even completely outside React (confirmed directly in
  // the console). Trading the animated scroll for a guaranteed-working
  // jump on purpose: an instant scroll that actually happens beats a
  // smooth one that silently does nothing. Not fixed in the shared helper
  // itself since other, unrelated call sites depend on its current
  // behaviour and fixing it sitewide was out of scope here.
  const handleExploreClick = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const trackTop = track.getBoundingClientRect().top + window.scrollY;
    const target = trackTop + (HERO_VH / 100) * window.innerHeight;
    lenis?.stop();
    window.scrollTo({ top: target, behavior: "instant" });
    lenis?.start();
  }, [lenis]);

  if (reducedMotion) {
    return (
      <section id="projects" aria-labelledby="projects-cascade-heading" className="mx-auto max-w-6xl px-6 py-24 md:px-8 md:py-32">
        <p className="text-foreground-muted text-xs tracking-[0.3em] uppercase">
          GEOPORTE · Selected Work
        </p>
        <h1 id="projects-cascade-heading" className="text-foreground leading-display mt-4 text-3xl font-medium md:text-5xl">
          Our Projects
        </h1>
        <ul className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <li
              key={project.title}
              className="border-line/50 bg-surface relative flex aspect-[4/3] flex-col justify-end overflow-hidden rounded-2xl border p-4"
            >
              <Image
                src={project.image.src}
                alt={project.image.alt}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
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
                  {project.category}
                </p>
                <h3 className="text-foreground mt-1 text-sm font-medium">
                  {project.title}
                </h3>
                <p className="text-foreground-muted mt-1 text-xs">
                  {project.location}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </section>
    );
  }

  return (
    <section
      id="projects"
      aria-labelledby="projects-cascade-heading"
      ref={trackRef}
      className="relative"
      style={{ height: `${trackVh(total)}vh` }}
    >
      <div
        ref={stageRef}
        className="bg-background absolute inset-x-0 top-0 z-10 flex h-screen items-center justify-center overflow-hidden"
      >
        <animated.div
          className="pointer-events-none absolute inset-x-0 top-1/3 z-10 mx-auto max-w-2xl px-6 text-center"
          style={{ opacity: intro }}
        >
          <p className="text-foreground-muted mb-4 text-xs tracking-[0.3em] uppercase">
            GEOPORTE · Selected Work
          </p>
          <h1 id="projects-cascade-heading" className="text-foreground leading-display text-3xl font-medium md:text-5xl">
            Our Projects
          </h1>
          <button
            type="button"
            onClick={handleExploreClick}
            className="bg-accent text-accent-foreground hover:bg-accent/90 transition-colors duration-[var(--duration-fast)] ease-entrance pointer-events-auto mt-8 inline-flex items-center rounded-full px-8 py-4 text-sm font-medium tracking-[0.08em] uppercase"
          >
            Explore projects
          </button>
        </animated.div>

        <div
          id="projects-cascade-deck"
          className="relative h-full w-full [perspective:1400px]"
          style={{ perspectiveOrigin: "50% 50%" }}
        >
          {projects.map((project, index) => (
            <animated.div
              key={project.title}
              className="border-line/50 bg-surface absolute top-1/2 left-1/2 w-[min(640px,86vw)] overflow-hidden rounded-2xl border aspect-[16/10]"
              style={{
                transform: cardAnimations[index].transform,
                opacity: cardAnimations[index].opacity,
                zIndex: cardAnimations[index].zIndex,
              }}
            >
              <Image
                src={project.image.src}
                alt={project.image.alt}
                fill
                sizes="640px"
                className="object-cover"
                priority={index < 2}
              />
              <div
                aria-hidden="true"
                className="absolute inset-0"
                style={{
                  background: "linear-gradient(to top, rgba(1,4,14,.88) 0%, rgba(1,4,14,.2) 45%, rgba(1,4,14,0) 72%)",
                }}
              />
              <div className="absolute inset-x-0 bottom-0 p-6 md:p-8">
                <p className="text-foreground-muted text-xs tracking-[0.14em] uppercase [text-shadow:0_1px_10px_rgba(0,0,0,.6)]">
                  {project.category}
                </p>
                <h3 className="text-foreground mt-2 text-xl font-medium md:text-2xl [text-shadow:0_1px_10px_rgba(0,0,0,.6)]">
                  {project.title}
                </h3>
                <p className="text-foreground-muted mt-1 text-sm [text-shadow:0_1px_10px_rgba(0,0,0,.6)]">
                  {project.location}
                </p>
              </div>
            </animated.div>
          ))}
        </div>
      </div>
    </section>
  );
};
