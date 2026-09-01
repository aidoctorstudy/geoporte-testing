"use client";

// 📖 Docs: obsidian/architecture/tech-stack.md → "Video background — Siloutte"

import { usePathname } from "next/navigation";
import { VideoBackground } from "@/components/common/VideoBackground";

// The Project Control Services service page's own fixed full-page
// background — same route-gated, mount-once-at-root shape as the WebGL
// backgrounds (`SolarisBackground.tsx` etc.), just backed by a video
// element instead of a canvas. Two heavy fixed full-page backgrounds on one
// page reads as a mistake, not a choice, so this takes the globe's (and
// the WebGL scenes') place here rather than joining them — see
// `glass-background-routes.ts`, which every other exclusive component on
// this route reads from.
const PROJECT_CONTROL_BACKGROUND_ROUTE = "/services/project-control-services";

/**
 * Mounted once at the app root, alongside `PlanetBackground`/
 * `AmbientBackground`/every `*Background.tsx` WebGL scene — but only
 * actually renders on the Project Control Services service page. GetLayers'
 * "Siloutte" background video, re-encoded to two self-hosted web-friendly
 * sizes (`public/assets/siloutte/`) rather than shipped as its original 4K
 * master. `fixed inset-0` so it persists behind the whole page as you
 * scroll; `object-cover` so it fills the viewport at any aspect without
 * distortion. See ADR-0050.
 */
export const ProjectControlBackground = () => {
  const pathname = usePathname();
  if (pathname !== PROJECT_CONTROL_BACKGROUND_ROUTE) return null;

  return (
    <VideoBackground
      mp4Src="/assets/siloutte/siloutte-bg.mp4"
      webmSrc="/assets/siloutte/siloutte-bg.webm"
      mobileMp4Src="/assets/siloutte/siloutte-bg-720.mp4"
      mobileWebmSrc="/assets/siloutte/siloutte-bg-720.webm"
      poster="/assets/siloutte/siloutte-bg.jpg"
      className="pointer-events-none fixed inset-0 z-0 h-full w-full object-cover"
    />
  );
};
