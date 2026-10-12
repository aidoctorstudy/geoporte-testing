"use client";

// 📖 Docs: obsidian/frontend/components/common.md

import Image, { type ImageProps } from "next/image";
import { usePerformanceTier } from "@/hooks/performance/use-performance-tier";

/** Tier 1's ("low" capability) reduced-weight image budget — roughly half of
 * Next's own 75 default. Must be listed in `next.config.ts`'s
 * `images.qualities`, which only serves quality values it explicitly allows. */
const TIER1_IMAGE_QUALITY = 40;

export interface TierImageProps extends ImageProps {}

/**
 * Drop-in `next/image` replacement that halves quality on the Tier 1
 * ("low" capability, see `performance-tier.ts`) performance tier — part of
 * "baqala mode" (ADR-0083): every content image ships lighter on a genuinely
 * weak/old device. A `quality` prop can't react to a client-detected tier on
 * its own — Next resolves the optimizer URL from whatever value is passed at
 * render time — and most pages that render a photo are Server Components by
 * design (hard rule 7), so this is the "split a leaf client wrapper instead
 * of marking the whole view `use client`" shape `component-conventions.md`
 * asks for, not a reason to convert those views. Every other `<Image>` prop
 * (`fill`, `sizes`, `priority`, …) passes through unchanged; a caller's own
 * `quality` is respected on every tier above low.
 */
export const TierImage = ({ quality, ...props }: TierImageProps) => {
  const { tier } = usePerformanceTier();
  // `alt` is a required field on `ImageProps` (enforced by TypeScript on
  // every caller) — the lint rule just can't see through the `{...props}`
  // spread to confirm it statically.
  // eslint-disable-next-line jsx-a11y/alt-text
  return <Image {...props} quality={tier === "low" ? TIER1_IMAGE_QUALITY : quality} />;
};
