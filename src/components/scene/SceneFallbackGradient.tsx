// 📖 Docs: obsidian/architecture/tech-stack.md → "3D — mobile/low-power fallback"

export interface SceneFallbackGradientProps {
  /** `var(--raw-gradient-fallback-<scene>)` — that scene's own full CSS
   * gradient value, defined as a single Tier-1 token in globals.css. */
  gradient: string;
  className?: string;
}

/**
 * Static CSS substitute for a full-page WebGL background on the "low"
 * performance tier (see `performance-tier.ts`'s `detectPerformanceTier`,
 * ADR-0058) — a plain radial gradient toward each scene's own real accent
 * colour, so a page doesn't go flat black just because its particle field
 * didn't mount. Deliberately not animated (no `useSpring` pulse like
 * `HeroFallback`): the whole point of this tier is zero per-frame cost,
 * not a cheaper animation. `gradient` is always a
 * `var(--raw-gradient-fallback-...)` reference — see ADR-0056/ADR-0058 for
 * why each scene gets its own token instead of reusing the sitewide
 * `--accent`/`--glow` (those drive buttons/links too; retinting them to
 * match a scene's palette would recolour the whole page's UI, not just the
 * background).
 */
export const SceneFallbackGradient = ({ gradient, className }: SceneFallbackGradientProps) => (
  <div
    aria-hidden="true"
    className={`bg-background ${className ?? ""}`}
    style={{ background: gradient }}
  />
);
