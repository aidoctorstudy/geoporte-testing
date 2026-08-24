"use client";

// 📖 Docs: obsidian/frontend/components/common.md

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { animated, useSpring } from "@react-spring/web";

const SWEEP_DURATION_MS = 600;
const FADE_SPRING_CONFIG = { tension: 210, friction: 26 };

/**
 * The visible half of route transitions (item 15) — an accent bar sweeping
 * across the viewport on navigation, plus a brief full-page fade "through"
 * the background colour at the handoff. Mounted once at the app root as a
 * sibling of `<main>`, not a wrapper around it.
 *
 * That placement is deliberate, not incidental: an earlier version wrapped
 * `{children}` directly (sliding the actual outgoing/incoming page content)
 * via `@react-spring/web`'s `useTransition`. That hit a genuine, reproducible
 * Next.js 16 hazard found during Phase 0 QA — a component wrapping the App
 * Router's live `children` prop that mounts more than one independent
 * react-spring hook (confirmed down to `useTransition` plus even a second,
 * *unused* `useSpring` call) causes Next to silently orphan that children
 * subtree into a hidden `<template>`, collapsing `<main>` to zero height.
 * The failure was intermittent enough to look like a rendering fluke before
 * a clean-server bisection nailed it down. Rather than a component that
 * could regress the same way the next time someone adds a hook here, this
 * component never touches `children` at all — it only reacts to `pathname`
 * changes and paints two purely decorative layers above the page, so the
 * hazard class is structurally impossible here, not just currently absent.
 */
export const RouteTransitionSweep = () => {
  const pathname = usePathname();
  const previousPathnameRef = useRef(pathname);
  const [sweeping, setSweeping] = useState(false);
  const [sweepStyle, sweepApi] = useSpring(() => ({ x: -100 }));
  const [fadeStyle, fadeApi] = useSpring(() => ({ opacity: 0 }));

  useEffect(() => {
    if (previousPathnameRef.current === pathname) return;
    previousPathnameRef.current = pathname;

    setSweeping(true);
    sweepApi.set({ x: -100 });
    sweepApi.start({
      x: 100,
      config: { duration: SWEEP_DURATION_MS },
      onRest: () => setSweeping(false),
    });

    fadeApi.start({ opacity: 1, config: FADE_SPRING_CONFIG });
    fadeApi.start({
      opacity: 0,
      delay: SWEEP_DURATION_MS / 2,
      config: FADE_SPRING_CONFIG,
    });
    // `sweepApi`/`fadeApi` identities are stable across renders — only a
    // genuine `pathname` change should retrigger this.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <>
      <animated.div
        aria-hidden="true"
        className="bg-background pointer-events-none fixed inset-0 z-[10004]"
        style={{ opacity: fadeStyle.opacity }}
      />
      {sweeping && (
        <animated.div
          aria-hidden="true"
          className="bg-accent pointer-events-none fixed inset-y-0 left-0 z-[10005] w-full"
          style={{ transform: sweepStyle.x.to((x) => `translateX(${x}%)`) }}
        />
      )}
    </>
  );
};
