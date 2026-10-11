"use client";

import { useEffect, useRef } from "react";
import { useWindowWidth } from "@/hooks/use-window-size";
import { getDeviceTier } from "@/lib/scene/device-tier";
import { usePerformanceTier } from "@/hooks/performance/use-performance-tier";

export interface VideoBackgroundProps {
  mp4Src: string;
  webmSrc: string;
  poster: string;
  className?: string;
  /** Card usage only — pauses playback via `IntersectionObserver` once the
   * video scrolls off-screen. The full-page background skips this: it's
   * `position: fixed` behind everything, so it's always "in view" by
   * definition and the native `autoplay`/`loop` attributes are enough on
   * their own. */
  pauseWhenOffscreen?: boolean;
  /** 1280×720 re-encodes, selected via a `<source media>` query
   * (`max-width: 768px`) — a plain browser-native mechanism, evaluated
   * before any byte downloads and with no client JS or hydration risk
   * involved, unlike computing "is this mobile" in React. Omit on a
   * component that has no mobile-sized re-encode (none currently do not). */
  mobileMp4Src?: string;
  mobileWebmSrc?: string;
  /** 854×480 re-encodes for the LOW performance tier specifically (see
   * `performance-tier.ts`, 2026-10-11 spec) — unlike the 720p pair above,
   * this can't be a plain `<source media>` width query: LOW vs MEDIUM is a
   * *capability* split, not a viewport-width one, so two same-width phones
   * can land on either side of it. Picked in JS via `usePerformanceTier()`
   * instead, same accepted first-paint trade-off as the `preload` attribute
   * below. Omit on a component with no low-tier-specific re-encode. */
  mobileMp4Src480?: string;
  mobileWebmSrc480?: string;
}

/**
 * Muted, looping, `playsInline` background video — shared by the full-page
 * Project Control Services background (`ProjectControlBackground.tsx`), the
 * full-page Purple Planet background (`PurplePlanetBackground.tsx`), and
 * Project Control's homepage card. Shows `poster` until the first frame
 * decodes — native `<video>` behaviour, no extra JS needed for that part.
 * Respects `prefers-reduced-motion` by pausing immediately rather than
 * looping indefinitely, the same convention every WebGL scene in this
 * codebase already follows.
 *
 * `preload="none"` on the mobile/low-power tier (see `device-tier.ts`) —
 * computed client-side via `useWindowWidth`/`getDeviceTier`, the same
 * hydration-safe "starts matching the server's unmeasured state, flips
 * after the client measures a real width" pattern `HeroScene.tsx`'s own
 * `isMobile` already uses. Unlike the `<source media>` swap above, there is
 * no server-safe way to know device tier without reading the request's
 * User-Agent (a bigger trade-off — it opts the route out of static
 * prerendering, see `obsidian/workflows/optimize-3d-scene.md` §1) so this
 * is a deliberately accepted limitation: the browser may already be
 * honouring the default preload hint for the first paint or two before the
 * client-measured value lands. See ADR-0056.
 */
export const VideoBackground = ({
  mp4Src,
  webmSrc,
  poster,
  className,
  pauseWhenOffscreen,
  mobileMp4Src,
  mobileWebmSrc,
  mobileMp4Src480,
  mobileWebmSrc480,
}: VideoBackgroundProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const width = useWindowWidth();
  const isMobile = width > 0 && getDeviceTier(width) === "mobile";
  const { tier } = usePerformanceTier();
  const isLowTier = isMobile && tier === "low";

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      video.pause();
      return;
    }
    if (!pauseWhenOffscreen) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) video.play().catch(() => {});
        else video.pause();
      },
      { threshold: 0 },
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, [pauseWhenOffscreen]);

  return (
    <video
      ref={videoRef}
      autoPlay
      loop
      muted
      playsInline
      preload={isMobile ? "none" : undefined}
      poster={poster}
      className={className}
      aria-hidden="true"
    >
      {isLowTier && mobileWebmSrc480 && <source src={mobileWebmSrc480} type="video/webm" />}
      {isLowTier && mobileMp4Src480 && <source src={mobileMp4Src480} type="video/mp4" />}
      {!isLowTier && mobileWebmSrc && <source media="(max-width: 768px)" src={mobileWebmSrc} type="video/webm" />}
      {!isLowTier && mobileMp4Src && <source media="(max-width: 768px)" src={mobileMp4Src} type="video/mp4" />}
      <source src={webmSrc} type="video/webm" />
      <source src={mp4Src} type="video/mp4" />
    </video>
  );
};
