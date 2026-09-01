"use client";

// 📖 Docs: obsidian/architecture/tech-stack.md → "Video background — Purple Planet"

import { usePathname } from "next/navigation";
import { VideoBackground } from "@/components/common/VideoBackground";

// The Projects page's own fixed full-page background — same shape as
// `ProjectControlBackground.tsx` (GetLayers' Siloutte video), just a
// different asset and a non-service route. Two heavy fixed full-page
// backgrounds on one page reads as a mistake, not a choice, so this takes
// the globe's (and the ambient wireframe shapes') place here rather than
// joining them — see `glass-background-routes.ts`, which every other
// exclusive component on this route reads from.
const PURPLE_PLANET_BACKGROUND_ROUTE = "/projects";

/**
 * Mounted once at the app root, alongside every other route-scoped fixed
 * background — but only actually renders on the Projects page. Reuses
 * `VideoBackground` completely unchanged (see `ProjectControlBackground.tsx`
 * for the first use of this component); `fixed inset-0` so the video
 * persists behind the whole page as you scroll. See ADR-0050 (the Siloutte
 * video's own ADR, same mechanism) and the ADR for this asset in
 * decisions-log.md.
 */
export const PurplePlanetBackground = () => {
  const pathname = usePathname();
  if (pathname !== PURPLE_PLANET_BACKGROUND_ROUTE) return null;

  return (
    <VideoBackground
      mp4Src="/assets/purple-planet/purple-planet-bg.mp4"
      webmSrc="/assets/purple-planet/purple-planet-bg.webm"
      mobileMp4Src="/assets/purple-planet/purple-planet-bg-720.mp4"
      mobileWebmSrc="/assets/purple-planet/purple-planet-bg-720.webm"
      poster="/assets/purple-planet/purple-planet-bg.jpg"
      className="pointer-events-none fixed inset-0 z-0 h-full w-full object-cover"
    />
  );
};
