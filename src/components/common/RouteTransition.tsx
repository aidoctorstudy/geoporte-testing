"use client";

// 📖 Docs: obsidian/frontend/components/common.md

import { ReactNode, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { animated, useSpring } from "@react-spring/web";

const LEAVE_MS = 300;
const ENTER_MS = 300;
const TRANSITION_SPRING_CONFIG = { tension: 280, friction: 32 };

export interface RouteTransitionProps {
  children: ReactNode;
}

/**
 * Wraps route content with an enter/exit slide+fade between navigations
 * (item 15): the outgoing page slides up and fades out, then the incoming
 * page slides up from below into place, with an accent bar sweeping across
 * at the handoff. A `"use client"` leaf so `layout.tsx` itself stays a
 * Server Component (hard rule 6) — same `@react-spring/web` primitives
 * `ProjectModal.tsx` already uses directly for its own open/close sequencing
 * (imperative `.set()`/`.start()`, not the declarative `Spring` wrapper),
 * because the exact "snap the new content below, then animate it up"
 * sequencing needs that imperative control.
 *
 * Next's App Router swaps `children` to the new route's content the instant
 * `pathname` changes — there's no "previous page" left to animate out by
 * then — so the outgoing page is held in local state until its exit
 * animation finishes, and only then swapped for the (already-current)
 * `children`.
 */
export const RouteTransition = ({ children }: RouteTransitionProps) => {
  const pathname = usePathname();
  const [displayed, setDisplayed] = useState<{ pathname: string; node: ReactNode }>({
    pathname,
    node: children,
  });
  const [sweeping, setSweeping] = useState(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const [contentStyle, contentApi] = useSpring(() => ({
    opacity: 1,
    y: 0,
    config: TRANSITION_SPRING_CONFIG,
  }));
  const [sweepStyle, sweepApi] = useSpring(() => ({ x: -100 }));

  useEffect(() => {
    if (pathname === displayed.pathname) {
      // Same route, content changed for another reason (e.g. server data) —
      // swap in place, no transition.
      setDisplayed({ pathname, node: children });
      return;
    }

    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];

    setSweeping(true);
    sweepApi.set({ x: -100 });
    sweepApi.start({ x: 100, config: { duration: LEAVE_MS + ENTER_MS } });
    contentApi.start({ opacity: 0, y: -24, config: TRANSITION_SPRING_CONFIG });

    timersRef.current.push(
      setTimeout(() => {
        setDisplayed({ pathname, node: children });
        contentApi.set({ opacity: 0, y: 24 });
        contentApi.start({ opacity: 1, y: 0, config: TRANSITION_SPRING_CONFIG });
      }, LEAVE_MS),
      setTimeout(() => setSweeping(false), LEAVE_MS + ENTER_MS),
    );

    return () => {
      timersRef.current.forEach(clearTimeout);
    };
    // Re-runs only on navigation — `children`/`contentApi`/`sweepApi` are
    // read fresh inside, not tracked as retrigger sources.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <>
      <animated.div style={contentStyle}>{displayed.node}</animated.div>
      {sweeping && (
        <animated.div
          aria-hidden="true"
          className="bg-accent pointer-events-none fixed inset-y-0 left-0 z-[10005] w-full"
          style={{
            transform: sweepStyle.x.to((x) => `translateX(${x}%)`),
          }}
        />
      )}
    </>
  );
};
