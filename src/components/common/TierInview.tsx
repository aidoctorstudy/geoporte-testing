"use client";

import { CSSProperties, ReactNode } from "react";
import { Inview } from "@/components/animation/springs/in-view";
import { isReducedMotion } from "@/lib/scene/shared-viewport-renderer";
import { useWindowWidth } from "@/hooks/use-window-size";
import { Tags } from "@/types/springs";

export interface TierInviewProps {
  tag?: Tags;
  mode?: "always" | "once" | "forward";
  /** Same loose shape `<Inview>` itself accepts — react-spring aliases
   * (`y`, `x`, `scale`, …) included, not just real CSS properties. The
   * Tier 1 branch below only ever applies `to` directly as inline `style`,
   * which silently no-ops any non-CSS alias — harmless for every current
   * caller (all pass `y: 0` as their final value, a transform that's a
   * no-op anyway) but worth knowing before giving a future caller a
   * non-zero final `y`/`x`/`scale`. */
  from?: Record<string, unknown>;
  to?: Record<string, unknown>;
  delayIn?: number;
  delayOut?: number;
  className?: string;
  children?: ReactNode;
}

/**
 * Tier 1 ("low" capability) / OS reduced-motion substitute for `<Inview>` —
 * see ADR-0102. `<Inview mode="once">`'s revealed (`to`) state depends
 * entirely on its own `IntersectionObserver` eventually reporting
 * `isIntersecting: true` (`src/components/animation/springs/in-view.tsx`,
 * a protected engine file — composed here, not edited). Nothing in its
 * public API can force the revealed state directly: `enabled={false}`
 * makes it permanently show `from` instead, the opposite of what's needed.
 * A slow/low-power main thread (exactly what Tier 1 exists to describe)
 * makes that observer's first callback arrive late or, on a fast scroll
 * past an element whose observer only just registered, never arrive at
 * all — leaving the section stuck at `from` (typically `opacity: 0`)
 * indefinitely, which reads as "the page stopped rendering" even though
 * the content is present in the DOM.
 *
 * On Tier 1 / reduced motion, skips `<Inview>` (and its observer) entirely
 * and renders `children` directly in the final `to` state — no observer
 * dependency, so nothing can get stuck invisible. `width > 0` defers the
 * check to strictly after hydration, matching every other tier-dependent
 * branch in this codebase (see `device-tier.ts`'s own comment on why) —
 * `isReducedMotion()` reads `navigator`/`matchMedia` synchronously, which
 * disagrees with the server-rendered HTML if read on the client's first
 * render before hydration completes.
 */
export const TierInview = ({
  tag: Tag = "div",
  mode = "always",
  from = {},
  to = {},
  delayIn = 0,
  delayOut = 0,
  className,
  children,
}: TierInviewProps) => {
  const width = useWindowWidth();

  if (width > 0 && isReducedMotion()) {
    return (
      <Tag className={className} style={{ ...from, ...to } as CSSProperties}>
        {children}
      </Tag>
    );
  }

  return (
    <Inview
      tag={Tag}
      mode={mode}
      from={from}
      to={to}
      delayIn={delayIn}
      delayOut={delayOut}
      className={className}
    >
      {children}
    </Inview>
  );
};
