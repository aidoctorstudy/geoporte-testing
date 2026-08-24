/**
 * Numeric mirrors of the strata design tokens in `globals.css`, for three.js
 * materials (which cannot consume CSS custom properties). Keep in sync by hand
 * — see `HERO_SCENE_COLORS` for the same pattern.
 */
export const STRATA_SCENE_COLORS = {
  clay: 0x9fd4ff, // --raw-color-strata-clay
  rock: 0x4a8fe0, // --raw-color-strata-rock
  soil: 0x2456a8, // --raw-color-strata-soil
  bedrock: 0x0f2a5c, // --raw-color-strata-bedrock
} as const;

export const STRATA_LAYERS = [
  { key: "clay", label: "Clay", color: STRATA_SCENE_COLORS.clay },
  { key: "rock", label: "Weathered rock", color: STRATA_SCENE_COLORS.rock },
  { key: "soil", label: "Residual soil", color: STRATA_SCENE_COLORS.soil },
  { key: "bedrock", label: "Bedrock", color: STRATA_SCENE_COLORS.bedrock },
] as const;
