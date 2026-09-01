// 📖 Docs: obsidian/frontend/components/common.md

import Image from "next/image";

export interface GeoporteLogoProps {
  size?: number;
  className?: string;
}

/**
 * The real Geoporte emblem — pulled from the live geoporte.com.au brand
 * mark (`public/assets/logo/geoporte-logo-source.jpg`, the only source
 * that exists; the live site has no SVG/transparent asset) and
 * background-removed via `scripts/process-logo.mjs` (luminance-threshold
 * alpha, kept alongside the source so it's rerunnable) into
 * `public/assets/logo/geoporte-logo.png`. A raster cutout, not a redrawn
 * SVG, so it matches the real mark exactly. Purely decorative — always
 * paired with the literal "GEOPORTE" wordmark text, so it's `aria-hidden`.
 */
export const GeoporteLogo = ({ size = 40, className }: GeoporteLogoProps) => (
  <Image
    src="/assets/logo/geoporte-logo.png"
    alt=""
    width={size}
    height={size}
    className={className}
    aria-hidden="true"
    priority
  />
);
