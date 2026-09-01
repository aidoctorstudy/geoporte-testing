"use client";

// 📖 Docs: obsidian/frontend/components/about-team.md

import { useEffect, useMemo, useRef } from "react";
import Image from "next/image";
import { animated } from "@react-spring/web";
import { useProgressTrigger } from "@/hooks/animation/use-progress-trigger";
import { subscribeToTicker } from "@/lib/animation/ticker";
import { useScroll } from "@/hooks/smooth-scroll/use-scroll";
import { TranslatedText } from "@/components/common/TranslatedText";
import type { TeamMember } from "@/data/mocks/team";
import {
  cascadeActiveIndex,
  HERO_VH,
  introOpacity,
  placeCascadeCard,
  trackVh,
} from "./team-cascade-config";

export interface TeamCascadeProps {
  members: TeamMember[];
}

const PROGRESS_SPRING_CONFIG = { tension: 120, friction: 32 };

/** This page's own required accent override — teal instead of the sitewide
 * `--accent` blue, scoped to this component only (not a global token
 * change, per this feature's own explicit brief). Same category of
 * narrow, flagged exception the WebGL scenes' CONFIG blocks already use
 * for one-off colour values. */
const ACCENT = "#5cc8d7";

/**
 * `/about/team`'s "Cards Cascade" — a `position: sticky`-style tall-track
 * deck that folds through every real team member one at a time, built with
 * plain CSS 3D transforms (`perspective` + `translate3d` + `rotateX`)
 * driven by this codebase's own spring scroll-trigger hook. No WebGL, no
 * canvas, no `@keyframes` — replaces "Mirror Hall" (ADR-0074), the
 * previous WebGL carousel this route used, per an explicit later brief
 * asking for a CSS-3D-only cascade instead. See ADR-0076.
 *
 * Same architecture as `ProjectsCascade.tsx` (`/projects`' own Cards
 * Cascade, ADR-0075) — tall track, manual sticky-emulation ticker,
 * `useProgressTrigger`-driven placement — written as its own copy rather
 * than a shared component, since neither page's deck was asked to share
 * code with the other.
 *
 * `prefers-reduced-motion` gets a plain static grid of every member
 * instead of the scroll-jacked fold — same rationale as every other
 * scroll-driven section in this codebase: the tall track has no natural
 * slower version, so the honest fallback is a different, static layout.
 *
 * Each active card is a two-column layout (photo left, full details right
 * — name, title, experience, bio, credentials) that stacks to a single
 * column below `md`; the whole two-column block is one animated unit
 * (`placeCascadeCard`'s transform applies to the outer wrapper), so the
 * fold/depth animation is unaffected by what's inside it.
 */
export const TeamCascade = ({ members }: TeamCascadeProps) => {
  const trackRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const reducedMotion =
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const lenis = useScroll((s) => s.lenis);

  const total = members.length;

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
      members.map((_, index) => ({
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
    [interpolatedProgress, total, members],
  );

  // Manual stand-in for `position: sticky` — this site's Lenis smooth-scroll
  // setup means `<body>`'s own overflow never actually engages, so `sticky`
  // never resolves against the real scrolling element. Same workaround
  // `ProjectsShowreel.tsx`/`ProjectsCascade.tsx` already use: absolute at
  // the track's top before it reaches the viewport, fixed while passing
  // through, absolute at the track's bottom once scrolled past — driven by
  // the shared ticker (imperative style writes, since this runs every
  // frame).
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

  // The deck's content sits inside the pseudo-sticky stage, which is
  // `position: fixed` for most of its lifetime — a plain `href="#..."`
  // anchor jump into that stage would resolve against a fixed target
  // already pinned at the viewport's top, computing a ~0 scroll delta and
  // never actually advancing. Scroll to a real document-relative offset
  // instead.
  //
  // Neither this codebase's shared `scrollTo()` helper (`@/utils/scroll-
  // to`) nor Lenis's own `lenis.scrollTo()` actually moved the page when
  // tested live — the helper races the `isEnableScroll` Zustand flag
  // against its own `window.scrollTo()` call (the flag's `useEffect` hasn't
  // necessarily called `lenis.stop()` yet), and `lenis.scrollTo()` itself
  // was a no-op in this setup regardless. `lenis.stop()` + a plain
  // `window.scrollTo({ behavior: "instant" })` + `lenis.start()` afterward
  // works reliably — but only with `"instant"`; `"smooth"` was silently
  // cancelled every time it was tested, on this exact sequence, even
  // completely outside React (confirmed directly in the console). Trading
  // the animated scroll for a guaranteed-working jump on purpose: an
  // instant scroll that actually happens beats a smooth one that silently
  // does nothing. Not fixed in the shared helper itself since other,
  // unrelated call sites depend on its current behaviour and fixing it
  // sitewide was out of scope for this page.
  const handleMeetTeamClick = () => {
    const track = trackRef.current;
    if (!track) return;
    const trackTop = track.getBoundingClientRect().top + window.scrollY;
    const target = trackTop + (HERO_VH / 100) * window.innerHeight;
    lenis?.stop();
    window.scrollTo({ top: target, behavior: "instant" });
    lenis?.start();
  };

  if (reducedMotion) {
    return (
      <section aria-labelledby="team-cascade-heading" className="mx-auto max-w-6xl px-6 py-24 md:px-8 md:py-32">
        <p className="text-foreground-muted text-xs tracking-[0.3em] uppercase">
          <TranslatedText text="GEOPORTE · Our People" />
        </p>
        <h1 id="team-cascade-heading" className="text-foreground leading-display mt-4 text-3xl font-medium md:text-5xl">
          <TranslatedText text="Our" />
          <br />
          <em style={{ color: ACCENT }}>
            <TranslatedText text="Team" />
          </em>
        </h1>
        <p className="text-foreground-muted mt-4 text-lg">
          <TranslatedText text="The specialists behind every project" />
        </p>
        <ul className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {members.map((member) => (
            <li
              key={member.name}
              className="border-line/50 bg-surface relative flex aspect-[4/5] flex-col justify-end overflow-hidden rounded-2xl border p-4"
            >
              <Image
                src={member.photo.src}
                alt={member.photo.alt}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover"
              />
              <div
                aria-hidden="true"
                className="absolute inset-0"
                style={{
                  background: "linear-gradient(to top, rgba(1,4,14,.88) 0%, rgba(1,4,14,.15) 45%, rgba(1,4,14,0) 70%)",
                }}
              />
              <div className="relative">
                <h3 className="text-foreground text-sm font-medium">
                  <TranslatedText text={member.name} />
                </h3>
                <p className="text-foreground-muted mt-1 text-xs">
                  <TranslatedText text={member.title} />
                </p>
                {member.experience ? (
                  <p className="mt-1 text-xs" style={{ color: ACCENT }}>
                    <TranslatedText text={member.experience} />
                  </p>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      </section>
    );
  }

  return (
    <section
      aria-labelledby="team-cascade-heading"
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
            <TranslatedText text="GEOPORTE · Our People" />
          </p>
          <h1 id="team-cascade-heading" className="text-foreground leading-display text-3xl font-medium md:text-5xl">
            <TranslatedText text="Our" />
            <br />
            <em style={{ color: ACCENT }}>
              <TranslatedText text="Team" />
            </em>
          </h1>
          <p className="text-foreground-muted mt-4 text-lg">
            <TranslatedText text="The specialists behind every project" />
          </p>
          <button
            type="button"
            onClick={handleMeetTeamClick}
            style={{ background: ACCENT }}
            className="text-accent-foreground hover:opacity-90 transition-opacity duration-[var(--duration-fast)] ease-entrance pointer-events-auto mt-8 inline-flex items-center rounded-full px-8 py-4 text-sm font-medium tracking-[0.08em] uppercase"
          >
            <TranslatedText text="Meet the team" />
          </button>
        </animated.div>

        <div className="relative h-full w-full [perspective:1400px]" style={{ perspectiveOrigin: "50% 50%" }}>
          {members.map((member, index) => (
            <animated.div
              key={member.name}
              className="absolute top-1/2 left-1/2 flex w-[min(960px,92vw)] max-h-[86vh] flex-col items-center gap-8 overflow-y-auto md:flex-row md:items-center md:gap-12"
              style={{
                transform: cardAnimations[index].transform,
                opacity: cardAnimations[index].opacity,
                zIndex: cardAnimations[index].zIndex,
              }}
            >
              {/* LEFT — photo card */}
              <div className="border-line/50 bg-surface relative aspect-[4/5] w-[240px] shrink-0 overflow-hidden rounded-2xl border md:w-[300px]">
                <Image
                  src={member.photo.src}
                  alt={member.photo.alt}
                  fill
                  sizes="300px"
                  className="object-cover"
                  priority={index < 2}
                />
              </div>

              {/* RIGHT — full details */}
              <div className="min-w-0 flex-1 text-center md:text-left">
                <h2 className="text-foreground text-2xl font-medium md:text-4xl">
                  <TranslatedText text={member.name} />
                </h2>
                <p className="mt-2 text-base font-medium md:text-lg" style={{ color: ACCENT }}>
                  <TranslatedText text={member.title} />
                </p>
                {member.experience ? (
                  <p className="text-foreground-muted mt-1 text-xs tracking-[0.08em] uppercase">
                    <TranslatedText text={member.experience} />
                  </p>
                ) : null}
                <p className="text-foreground-muted mx-auto mt-4 max-w-xl text-sm leading-relaxed md:mx-0 md:text-base">
                  <TranslatedText text={member.bio} />
                </p>
                {member.credentials.length > 0 ? (
                  <div className="mt-4 flex flex-wrap justify-center gap-2 md:justify-start">
                    {member.credentials.map((credential) => (
                      <span
                        key={credential}
                        className="border-line/60 text-foreground-muted rounded-full border px-3 py-1 text-xs"
                      >
                        <TranslatedText text={credential} />
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            </animated.div>
          ))}
        </div>
      </div>
    </section>
  );
};
