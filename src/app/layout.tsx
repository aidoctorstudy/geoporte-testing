import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";

import {
  generateMetadata,
  generateViewport,
} from "@/utils/seo/generate-page-metadata";
import { getSiteStructuredData } from "@/utils/seo/structured-data";

import { LazyCookie } from "@/components/common/Cookie";
import { Footer } from "@/components/common/Footer";
import { AdaptiveGrid } from "@/components/common/grid";
import { Nav } from "@/components/common/Nav";
import { ReducedMotion } from "@/components/common/reduced-motion";
import { ScrollSignal } from "@/components/common/ScrollSignal";
import { ScrollProgressBar } from "@/components/common/ScrollProgressBar";
import { CustomCursor } from "@/components/common/Cursor";
import { PageLoadIntro } from "@/components/common/PageLoadIntro";
import { PerformanceWarningToast } from "@/components/common/PerformanceWarningToast";
import { PerformanceTierBadge } from "@/components/common/PerformanceTierBadge";
import { RouteTransitionSweep } from "@/components/common/RouteTransitionSweep";
import { AetherFluxBackground } from "@/components/scene/AetherFluxBackground";
import { AmbientBackground } from "@/components/scene/AmbientBackground";
import { AureoleBackground } from "@/components/scene/AureoleBackground";
import { AurumPeakBackground } from "@/components/scene/AurumPeakBackground";
import { BirdBackground } from "@/components/scene/BirdBackground";
import { EinsteinRosenLatticeBackground } from "@/components/scene/EinsteinRosenLatticeBackground";
import { GoldenParthenonBackground } from "@/components/scene/GoldenParthenonBackground";
import { NegentropyBackground } from "@/components/scene/NegentropyBackground";
import { PinwheelGalaxyBackground } from "@/components/scene/PinwheelGalaxyBackground";
import { PlanetBackground } from "@/components/scene/PlanetBackground";
import { ProjectControlBackground } from "@/components/scene/ProjectControlBackground";
import { PurplePlanetBackground } from "@/components/scene/PurplePlanetBackground";
import { SolarisBackground } from "@/components/scene/SolarisBackground";
import { SpiralGalaxyBackground } from "@/components/scene/SpiralGalaxyBackground";
import { TeamStarfieldBackground } from "@/components/scene/TeamStarfieldBackground";
import { ScrollLayout } from "@/layouts/scroll-layout";
import { PerformanceTierProvider } from "@/hooks/performance/use-performance-tier";

import "@/app/globals.css";

export const metadata: Metadata = generateMetadata();
export const viewport: Viewport = generateViewport();

// Heading/body typeface pair — bound into Tier 1 (`--raw-font-heading`/
// `--raw-font-body` in globals.css) rather than consumed directly, same
// "primitive, never referenced in markup" convention as every other Tier 1
// token. Replaces the previous single General-Sans-for-everything stack
// (loaded via a Fontshare <link>, now removed) with next/font/google's
// self-hosted, zero-extra-request loading — see obsidian/meta/decisions-log.md.
const headingFont = Playfair_Display({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-heading-face",
  display: "swap",
});
const bodyFont = Inter({
  subsets: ["latin"],
  variable: "--font-body-face",
  display: "swap",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${headingFont.variable} ${bodyFont.variable}`}>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(getSiteStructuredData()),
          }}
        />
        <PerformanceTierProvider>
          <ScrollLayout>
            <AdaptiveGrid />
            <ReducedMotion />
            <ScrollSignal />
            {/* Planet mounts first — its canvas is pinned to z-index: -1 in
                build-planet-scene.ts regardless of mount order, but this JSX
                order documents the intended stack: planet furthest back,
                AmbientBackground's wireframe shapes in front of it, both
                behind real page content. */}
            <PlanetBackground />
            <SolarisBackground />
            <AetherFluxBackground />
            <AureoleBackground />
            <AurumPeakBackground />
            <EinsteinRosenLatticeBackground />
            <GoldenParthenonBackground />
            <NegentropyBackground />
            <ProjectControlBackground />
            <PurplePlanetBackground />
            <SpiralGalaxyBackground />
            <PinwheelGalaxyBackground />
            <TeamStarfieldBackground />
            <BirdBackground />
            <AmbientBackground />
            <CustomCursor />
            <ScrollProgressBar />
            <LazyCookie />
            <Nav />
            <main className="relative z-10">{children}</main>
            <Footer />
            <PageLoadIntro />
            <RouteTransitionSweep />
            <PerformanceWarningToast />
            <PerformanceTierBadge />
          </ScrollLayout>
        </PerformanceTierProvider>
      </body>
    </html>
  );
}
