/**
 * Colour constants for the hero digital-twin scene.
 *
 * three.js materials take numeric/hex colours directly and cannot consume CSS
 * custom properties, so these mirror the Tier-1 raw tokens in `globals.css`
 * (Neural Monitor style, `getlayers.json`) and must be kept in sync by hand.
 */
export const HERO_SCENE_COLORS = {
  background: 0x01040e, // --raw-color-navy-950
  backgroundAlt: 0x04122e, // --raw-color-navy-900
  line: 0x1f6ae0, // --raw-color-azure-600 (gl-accent)
  glow: 0x70bcff, // --raw-color-azure-300 (gl-glow)
  ink: 0x8ecbff, // --raw-color-sky-300 (gl-ink-muted)
  white: 0xffffff,
  // The particle GEOPORTE logo (below) deliberately reuses the heading
  // accent (--raw-color-heading-blue) rather than the scene's own --glow,
  // so the particle wordmark reads as the same visual family as the
  // sitewide heading colour, not a third unrelated blue.
  logoGlow: 0x4fc3f7, // --raw-color-heading-blue
} as const;
