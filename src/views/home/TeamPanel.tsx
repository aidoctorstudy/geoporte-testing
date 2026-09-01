"use client";

// 📖 Docs: obsidian/frontend/animation-system.md · obsidian/frontend/text-engine.md

import { useEffect, useRef, useState } from "react";
import { animated, easings, useInView, useSpring } from "@react-spring/web";
import TextEngine from "spring-text-engine";
import { Inview } from "@/components/animation/springs/in-view";
import { cultureValues, teamComposition } from "@/lib/company";
import { subscribeToTicker } from "@/lib/animation/ticker";

const FLIP_CONFIG = { tension: 200, friction: 26 };
const ROLE_LETTER_STAGGER_MS = 22;
const ROLE_ENTRY_STAGGER_MS = 120;
const BLINK_CHECK_FRAMERATE_MS = 100;
const BLINK_PERIOD_S = 0.9;
const CURSOR_LINGER_MS = 500;

/** One team-role line — types itself in letter by letter (via `TextEngine`,
 * not a hand-rolled typewriter) with a blinking cursor that disappears once
 * typing settles. The blink toggle is throttled to ~10fps (via the shared
 * ticker) since it only needs to look like a blink, not track every frame. */
const TeamRoleTyped = ({ text, delayIn }: { text: string; delayIn: number }) => {
  const [cursorOn, setCursorOn] = useState(true);
  const [cursorVisible, setCursorVisible] = useState(true);
  const startRef = useRef<number | null>(null);
  const typingDurationMs = text.length * ROLE_LETTER_STAGGER_MS;

  useEffect(() => {
    return subscribeToTicker((time) => {
      if (startRef.current === null) startRef.current = time;
      const elapsedMs = time - startRef.current;
      setCursorOn(Math.floor(elapsedMs / 1000 / (BLINK_PERIOD_S / 2)) % 2 === 0);
      if (elapsedMs > delayIn + typingDurationMs + CURSOR_LINGER_MS) setCursorVisible(false);
    }, () => BLINK_CHECK_FRAMERATE_MS);
  }, [delayIn, typingDurationMs]);

  return (
    <li className="text-foreground flex items-center text-sm">
      <TextEngine
        tag="span"
        mode="once"
        delayIn={delayIn}
        letterIn={{ opacity: 1 }}
        letterOut={{ opacity: 0 }}
        letterStagger={ROLE_LETTER_STAGGER_MS}
        letterConfig={{ duration: 1, easing: easings.linear }}
      >
        {text}
      </TextEngine>
      {cursorVisible && (
        <span
          aria-hidden="true"
          className={`bg-accent ml-0.5 inline-block h-3.5 w-px transition-opacity duration-[var(--duration-fast)] ${
            cursorOn ? "opacity-100" : "opacity-0"
          }`}
        />
      )}
    </li>
  );
};

/**
 * The About section's team/values card (item 22) — flips into view on scroll
 * entry (a real 3D `rotateY`, `@react-spring/web` directly, same idiom as
 * `TiltCard`'s tilt — not the declarative `Spring` wrapper, which can't
 * cleanly animate a templated `transform` string), then reveals team roles
 * as a typing effect and value tags with a bouncy spring pop.
 */
export const TeamPanel = () => {
  const [ref, inView] = useInView({ once: true });
  const flipStyle = useSpring({
    rotateY: inView ? 0 : -90,
    opacity: inView ? 1 : 0,
    config: FLIP_CONFIG,
  });

  return (
    <animated.aside
      ref={ref}
      aria-label="Our team and values"
      className="border-line bg-surface flex flex-col gap-8 rounded-2xl border p-8"
      style={{
        opacity: flipStyle.opacity,
        transform: flipStyle.rotateY.to((deg) => `perspective(1200px) rotateY(${deg}deg)`),
      }}
    >
      <div>
        <h3 className="text-foreground-muted text-xs tracking-[0.2em] uppercase">
          Our team
        </h3>
        <ul className="mt-4 flex flex-col gap-2">
          {teamComposition.map((role, i) => (
            <TeamRoleTyped key={role} text={role} delayIn={i * ROLE_ENTRY_STAGGER_MS} />
          ))}
        </ul>
      </div>
      <div>
        <h3 className="text-foreground-muted text-xs tracking-[0.2em] uppercase">
          What drives us
        </h3>
        <ul className="mt-4 flex flex-wrap gap-2">
          {cultureValues.map((value, i) => (
            <Inview
              key={value}
              tag="li"
              mode="once"
              from={{ opacity: 0, scale: 0.5 }}
              to={{ opacity: 1, scale: 1 }}
              delayIn={i * 80}
              config={{ tension: 400, friction: 12 }}
              className="border-line text-foreground rounded-full border px-3 py-1 text-xs"
            >
              {value}
            </Inview>
          ))}
        </ul>
      </div>
    </animated.aside>
  );
};
