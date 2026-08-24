"use client";

// 📖 Docs: obsidian/frontend/components/common.md

import { useEffect, useRef, useState } from "react";
import { animated, to, useSpring } from "@react-spring/web";
import { usePointer, getPointerSnapshot } from "@/hooks/cursor/use-pointer";
import { isReducedMotion } from "@/lib/scene/shared-viewport-renderer";
import { subscribeToTicker } from "@/lib/animation/ticker";

type CursorVariant = "default" | "interactive" | "canvas";

const DOT_SIZE_PX = 6;
const RING_SIZE_PX = 40;
const RING_HOVER_SIZE_PX = 60;
const GLOW_SIZE_PX = 600;

const DOT_SPRING_CONFIG = { tension: 900, friction: 45 };
const RING_SPRING_CONFIG = { tension: 180, friction: 22 };
const GLOW_SPRING_CONFIG = { tension: 90, friction: 26 };
const VARIANT_SPRING_CONFIG = { tension: 300, friction: 26 };

/** Only spawn a trail particle once the pointer clears this speed. */
const PARTICLE_VELOCITY_THRESHOLD = 4;
/** Minimum gap between spawned particles while moving fast. */
const PARTICLE_SPAWN_INTERVAL_MS = 60;
const PARTICLE_MAX_ALIVE = 12;
const PARTICLE_LIFETIME_MS = 800;

const INTERACTIVE_SELECTOR = 'a, button, [role="button"], [data-cursor-hover]';
const CANVAS_SELECTOR = '[data-cursor="canvas"]';

interface Particle {
  id: number;
  x: number;
  y: number;
}

let particleIdCounter = 0;

/** A single trail dot — mounts at full opacity, then fades over
 * `--duration-slow` on the next frame (a discrete, one-shot opacity change —
 * the ADR-0014 CSS-transition exception, not continuous/scroll-driven
 * motion). Removes itself from the parent's list after its lifetime. */
const TrailParticle = ({
  particle,
  onExpire,
}: {
  particle: Particle;
  onExpire: (id: number) => void;
}) => {
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setFading(true));
    const timeout = setTimeout(() => onExpire(particle.id), PARTICLE_LIFETIME_MS);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timeout);
    };
  }, [particle.id, onExpire]);

  return (
    <div
      aria-hidden="true"
      className={`bg-glow pointer-events-none fixed top-0 left-0 z-[10001] h-1.5 w-1.5 rounded-full transition-opacity duration-[var(--duration-slow)] ease-entrance ${
        fading ? "opacity-0" : "opacity-70"
      }`}
      style={{ transform: `translate3d(${particle.x - 3}px, ${particle.y - 3}px, 0)` }}
    />
  );
};

/**
 * Custom cursor system (items 1–3 of the homepage motion spec): a small
 * glowing dot that tracks the pointer near-instantly, a larger ring that
 * follows with spring lag, a soft ambient glow trailing behind both, and a
 * short-lived particle trail while moving fast. Hides the native cursor
 * while active (`.cursor-hidden` on `<html>`, see `globals.css`) and swaps
 * to an accent-filled expanded ring over interactive elements, or a
 * crosshair over anything marked `data-cursor="canvas"`.
 *
 * Gated off entirely on touch (`usePointer().isFinePointer`) and under
 * `prefers-reduced-motion` — the native cursor and default focus rings stay
 * intact there. Position updates ride the shared ticker rather than a
 * per-component `pointermove` listener.
 */
export const CustomCursor = () => {
  const { isFinePointer, hasMoved } = usePointer();
  const reducedMotion = isReducedMotion();
  const active = isFinePointer && !reducedMotion;
  // Visible only once the pointer has actually moved — before that, `x`/`y`
  // are still the `0,0` default and rendering would show the cursor stuck in
  // the top-left corner instead of staying hidden until first movement.
  const visible = active && hasMoved;

  const [variant, setVariant] = useState<CursorVariant>("default");
  const [particles, setParticles] = useState<Particle[]>([]);
  const lastSpawnRef = useRef(0);
  const hasSnappedRef = useRef(false);

  const [dotStyle, dotApi] = useSpring(() => ({ x: 0, y: 0, config: DOT_SPRING_CONFIG }));
  const [ringStyle, ringApi] = useSpring(() => ({ x: 0, y: 0, config: RING_SPRING_CONFIG }));
  const [glowStyle, glowApi] = useSpring(() => ({ x: 0, y: 0, config: GLOW_SPRING_CONFIG }));
  const [variantStyle] = useSpring(
    () => ({
      dotScale: variant === "interactive" ? 0 : 1,
      ringSize: variant === "interactive" ? RING_HOVER_SIZE_PX : RING_SIZE_PX,
      ringOpacity: variant === "canvas" ? 0 : 1,
      crosshairOpacity: variant === "canvas" ? 1 : 0,
      config: VARIANT_SPRING_CONFIG,
    }),
    [variant],
  );

  // Position tracking — one ticker subscription drives dot/ring/glow targets
  // and the particle trail, instead of a dedicated `pointermove` listener.
  useEffect(() => {
    if (!active) return;
    hasSnappedRef.current = false;

    return subscribeToTicker((time) => {
      const pointer = getPointerSnapshot();
      if (!pointer.hasMoved) return;

      // First real position after mount/hide — jump every layer straight
      // there instead of springing in from the stale `0,0` default.
      const jump = !hasSnappedRef.current;
      if (jump) hasSnappedRef.current = true;

      dotApi.start({ x: pointer.x, y: pointer.y, immediate: true });
      ringApi.start({ x: pointer.x, y: pointer.y, immediate: jump });
      glowApi.start({ x: pointer.x, y: pointer.y, immediate: jump });

      if (
        pointer.isMoving &&
        pointer.velocity > PARTICLE_VELOCITY_THRESHOLD &&
        time - lastSpawnRef.current > PARTICLE_SPAWN_INTERVAL_MS
      ) {
        lastSpawnRef.current = time;
        setParticles((current) => [
          ...current.slice(-(PARTICLE_MAX_ALIVE - 1)),
          { id: particleIdCounter++, x: pointer.x, y: pointer.y },
        ]);
      }
    }, () => 0);
  }, [active, dotApi, ringApi, glowApi]);

  // Interactive/canvas hover detection — one delegated listener rather than
  // per-element wiring; `closest()` finds the nearest matching ancestor from
  // whatever the pointer actually entered.
  useEffect(() => {
    if (!active) return;

    const handlePointerOver = (event: PointerEvent) => {
      const target = event.target as Element | null;
      if (!target) return;
      if (target.closest(CANVAS_SELECTOR)) setVariant("canvas");
      else if (target.closest(INTERACTIVE_SELECTOR)) setVariant("interactive");
      else setVariant("default");
    };

    document.addEventListener("pointerover", handlePointerOver, { passive: true });
    return () => document.removeEventListener("pointerover", handlePointerOver);
  }, [active]);

  // Native cursor hidden only while the custom cursor is actually active.
  useEffect(() => {
    document.documentElement.classList.toggle("cursor-hidden", active);
    return () => document.documentElement.classList.remove("cursor-hidden");
  }, [active]);

  const expireParticle = (id: number) => {
    setParticles((current) => current.filter((particle) => particle.id !== id));
  };

  if (!visible) return null;

  return (
    <>
      <animated.div
        aria-hidden="true"
        className="bg-accent pointer-events-none fixed top-0 left-0 z-[10002] rounded-full"
        style={{
          width: DOT_SIZE_PX,
          height: DOT_SIZE_PX,
          scale: variantStyle.dotScale,
          transform: to(
            [dotStyle.x, dotStyle.y],
            (x, y) => `translate3d(${x - DOT_SIZE_PX / 2}px, ${y - DOT_SIZE_PX / 2}px, 0)`,
          ),
        }}
      />
      <animated.div
        aria-hidden="true"
        className="border-accent pointer-events-none fixed top-0 left-0 z-[10001] rounded-full border"
        style={{
          width: variantStyle.ringSize,
          height: variantStyle.ringSize,
          opacity: variantStyle.ringOpacity,
          background:
            variant === "interactive" ? "var(--accent)" : "transparent",
          marginLeft: variantStyle.ringSize.to((size) => -size / 2),
          marginTop: variantStyle.ringSize.to((size) => -size / 2),
          transform: to(
            [ringStyle.x, ringStyle.y],
            (x, y) => `translate3d(${x}px, ${y}px, 0)`,
          ),
        }}
      />
      <animated.svg
        aria-hidden="true"
        width={24}
        height={24}
        viewBox="0 0 24 24"
        className="pointer-events-none fixed top-0 left-0 z-[10001] -ml-3 -mt-3"
        style={{
          opacity: variantStyle.crosshairOpacity,
          transform: to(
            [ringStyle.x, ringStyle.y],
            (x, y) => `translate3d(${x}px, ${y}px, 0)`,
          ),
        }}
      >
        <line x1="12" y1="0" x2="12" y2="24" stroke="var(--accent)" strokeWidth="1.5" />
        <line x1="0" y1="12" x2="24" y2="12" stroke="var(--accent)" strokeWidth="1.5" />
      </animated.svg>
      <animated.div
        aria-hidden="true"
        className="pointer-events-none fixed top-0 left-0 z-[10000] rounded-full opacity-[0.08]"
        style={{
          width: GLOW_SIZE_PX,
          height: GLOW_SIZE_PX,
          marginLeft: -GLOW_SIZE_PX / 2,
          marginTop: -GLOW_SIZE_PX / 2,
          background: "radial-gradient(circle, var(--accent) 0%, transparent 70%)",
          transform: to(
            [glowStyle.x, glowStyle.y],
            (x, y) => `translate3d(${x}px, ${y}px, 0)`,
          ),
        }}
      />
      {particles.map((particle) => (
        <TrailParticle key={particle.id} particle={particle} onExpire={expireParticle} />
      ))}
    </>
  );
};
