/**
 * Pure geometry + scroll-timeline math for `ProjectsCascade.tsx` — a
 * `position: sticky`-style tall-track deck where scrolling folds through
 * every real project one at a time, each rising into a centred 3D rest
 * position before tilting away as the next one takes over. Same category of
 * component as `projects-showreel-config.ts` (pure functions, no React) so
 * the interpolation math can be unit-reasoned-about independent of the
 * component's render loop.
 *
 * This is a fresh implementation, not a restoration of the old team-page
 * "Cards Cascade" (`TeamCascadeDeck`/`cascade-config.ts`, deleted in
 * ADR-0072) — that deck no longer exists in the codebase to reuse, and its
 * own fold formula was never the documented problem (the deck mechanic
 * itself, on the team page specifically, was). Built from scratch for the
 * projects page's own numbers. See ADR-0075.
 */

const clamp01 = (x: number): number => Math.min(1, Math.max(0, x));

/** How much scroll (vh) is spent on the intro hero before the deck begins. */
export const HERO_VH = 70;
/** How much scroll (vh) each card after the first gets. */
export const CARD_VH = 52;
/** Trailing scroll (vh) after the last card settles, before the track ends. */
export const TAIL_VH = 34;

/** Total track height for a deck of `total` cards. */
export const trackVh = (total: number): number =>
  HERO_VH + Math.max(0, total - 1) * CARD_VH + TAIL_VH;

/** Fraction of the whole track spent on the intro hero. */
const heroFraction = (total: number): number => HERO_VH / trackVh(total);

/** Fraction of the whole track spent moving through the card deck. */
const deckFraction = (total: number): number =>
  (Math.max(0, total - 1) * CARD_VH) / trackVh(total);

/**
 * Continuous "which card is active" position (0 at the first card, `total -
 * 1` at the last) for overall track progress `p` (0..1). Fractional values
 * are expected and wanted — they're what makes neighbouring cards visible
 * mid-transition instead of popping.
 *
 * Deliberately unclamped below 0 (only the upper end, past the last card,
 * is clamped) — clamping both ends made the first card's `d` hit exactly 0
 * for the whole intro phase (`p` from 0 to `start`), so it sat fully at
 * rest, fully opaque, directly behind the eyebrow/title/CTA for that whole
 * duration instead of waiting off-stage. Letting it run negative means the
 * first card is still mostly faded (`d` well above the opacity falloff's
 * range) until `p` actually approaches `start`, matching the intended
 * "hero text alone, then the deck begins" sequence. Caught only by
 * scrolling the real page, not by reasoning about the formula in isolation.
 */
export const cascadeActiveIndex = (p: number, total: number): number => {
  if (total <= 1) return 0;
  const start = heroFraction(total);
  const span = deckFraction(total);
  const local = span > 0 ? Math.min(1, Math.max(-1.5, (p - start) / span)) : 0;
  return local * (total - 1);
};

/** The intro eyebrow/title/CTA — visible only before the deck starts moving. */
export const introOpacity = (p: number, total: number): number => {
  const start = heroFraction(total);
  return 1 - clamp01(p / (start * 0.85));
};

export interface CascadeCardPlacement {
  transform: string;
  opacity: number;
  zIndex: number;
}

/**
 * One card's placement given `d` — its index minus the current continuous
 * active index. `d = 0` is dead-centre and fully at rest; positive `d`
 * hasn't arrived yet (waiting below, tilted back); negative `d` has already
 * passed (exited above, tilted away and faded). Symmetric by design — same
 * shape entering as leaving, just mirrored — because that's what reads as a
 * single continuous fold rather than two different animations stitched
 * together.
 */
export const placeCascadeCard = (d: number): CascadeCardPlacement => {
  const ad = Math.abs(d);
  const translateY = d * 46; // vh — waiting cards sit below, exited cards above
  const translateZ = -Math.min(ad, 1.4) * 170; // px — recede in depth off-centre
  const rotateX = -d * 27; // deg — tilts back on approach, forward on exit
  const scale = 1 - Math.min(ad, 1.4) * 0.15;
  const opacity = Math.max(0, 1 - clamp01((ad - 0.1) / 0.95));

  return {
    transform: `translate3d(-50%, calc(-50% + ${translateY.toFixed(2)}vh), ${translateZ.toFixed(1)}px) rotateX(${rotateX.toFixed(2)}deg) scale(${scale.toFixed(3)})`,
    opacity,
    zIndex: Math.round(1000 - ad * 100),
  };
};
