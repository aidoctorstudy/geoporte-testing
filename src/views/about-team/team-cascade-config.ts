/**
 * Pure geometry + scroll-timeline math for `TeamCascade.tsx` — a
 * `position: sticky`-style tall-track deck that folds through every real
 * team member one at a time. Same shape as `projects-cascade-config.ts`
 * (pure functions, no React) — written as its own copy rather than a
 * shared module, matching how this codebase already keeps
 * `ProjectsShowreel.tsx`'s and the deleted `TeamCascadeDeck.tsx`'s own
 * near-identical sticky-emulation logic separate rather than extracted,
 * since neither page's Cascade was asked to share code with the other.
 * See ADR-0076 (this page replacing "Mirror Hall", ADR-0074, with a CSS-3D
 * cascade instead of a WebGL carousel).
 */

const clamp01 = (x: number): number => Math.min(1, Math.max(0, x));

export const HERO_VH = 70;
export const CARD_VH = 58;
export const TAIL_VH = 36;

export const trackVh = (total: number): number =>
  HERO_VH + Math.max(0, total - 1) * CARD_VH + TAIL_VH;

const heroFraction = (total: number): number => HERO_VH / trackVh(total);

const deckFraction = (total: number): number =>
  (Math.max(0, total - 1) * CARD_VH) / trackVh(total);

/**
 * Continuous "which card is active" position. Deliberately unclamped below
 * 0 (only the upper end, past the last card, is clamped) — see
 * `projects-cascade-config.ts`'s own note on why: clamping both ends makes
 * the first card sit fully at rest behind the hero for the whole intro
 * phase instead of waiting off-stage. That exact bug was found and fixed
 * for the projects page first (ADR-0075); this file starts from the fix,
 * not the original mistake.
 */
export const cascadeActiveIndex = (p: number, total: number): number => {
  if (total <= 1) return 0;
  const start = heroFraction(total);
  const span = deckFraction(total);
  const local = span > 0 ? Math.min(1, Math.max(-1.5, (p - start) / span)) : 0;
  return local * (total - 1);
};

export const introOpacity = (p: number, total: number): number => {
  const start = heroFraction(total);
  return 1 - clamp01(p / (start * 0.85));
};

export interface CascadeCardPlacement {
  transform: string;
  opacity: number;
  zIndex: number;
}

/** Same symmetric enter/exit fold as the projects deck — see that file's
 * own comment for the reasoning (one continuous shape, not two animations
 * stitched together). */
export const placeCascadeCard = (d: number): CascadeCardPlacement => {
  const ad = Math.abs(d);
  const translateY = d * 46;
  const translateZ = -Math.min(ad, 1.4) * 170;
  const rotateX = -d * 27;
  const scale = 1 - Math.min(ad, 1.4) * 0.15;
  const opacity = Math.max(0, 1 - clamp01((ad - 0.1) / 0.95));

  return {
    transform: `translate3d(-50%, calc(-50% + ${translateY.toFixed(2)}vh), ${translateZ.toFixed(1)}px) rotateX(${rotateX.toFixed(2)}deg) scale(${scale.toFixed(3)})`,
    opacity,
    zIndex: Math.round(1000 - ad * 100),
  };
};
