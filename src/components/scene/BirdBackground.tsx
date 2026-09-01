"use client";

// 📖 Docs: obsidian/architecture/tech-stack.md → "Video background — Bird"

import { usePathname } from "next/navigation";
import { VideoBackground } from "@/components/common/VideoBackground";

// The Contact page's own fixed full-page background — same shape as
// `ProjectControlBackground.tsx`/`PurplePlanetBackground.tsx` (GetLayers
// video, not a WebGL scene).
const BIRD_BACKGROUND_ROUTE = "/contact";

/**
 * Mounted once at the app root, alongside every other route-scoped fixed
 * background — but only actually renders on the Contact page. GetLayers'
 * "Bird" background video, re-encoded from its 2700×2160/5s h264 master
 * (`public/assets/bird/`) down to a 1920×1080 mp4+webm pair (audio
 * stripped — always rendered muted), cover-cropped at encode time, plus a
 * 1280×720 mobile pair (see `VideoBackground.tsx`'s `mobileMp4Src`/
 * `mobileWebmSrc`, ADR-0056). `fixed inset-0` so it persists behind the
 * whole page as you scroll. See ADR-0050 (the Siloutte video's own ADR,
 * same mechanism) and the ADR for this asset in decisions-log.md.
 */
export const BirdBackground = () => {
  const pathname = usePathname();
  if (pathname !== BIRD_BACKGROUND_ROUTE) return null;

  return (
    <VideoBackground
      mp4Src="/assets/bird/bird-bg.mp4"
      webmSrc="/assets/bird/bird-bg.webm"
      mobileMp4Src="/assets/bird/bird-bg-720.mp4"
      mobileWebmSrc="/assets/bird/bird-bg-720.webm"
      poster="/assets/bird/bird-bg.jpg"
      className="pointer-events-none fixed inset-0 z-0 h-full w-full object-cover"
    />
  );
};
