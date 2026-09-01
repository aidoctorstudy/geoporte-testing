import type { Metadata, Viewport } from "next";

import {
  generateMetadata,
  generateViewport,
} from "@/utils/seo/generate-page-metadata";
import { getSiteStructuredData } from "@/utils/seo/structured-data";

import { LazyCookie } from "@/components/common/Cookie";
import { Footer } from "@/components/common/Footer";
import { AdaptiveGrid } from "@/components/common/grid";
import { LanguageDirection } from "@/components/common/LanguageDirection";
import { Nav } from "@/components/common/Nav";
import { ReducedMotion } from "@/components/common/reduced-motion";
import { ScrollSignal } from "@/components/common/ScrollSignal";
import { ScrollProgressBar } from "@/components/common/ScrollProgressBar";
import { CustomCursor } from "@/components/common/Cursor";
import { PageLoadIntro } from "@/components/common/PageLoadIntro";
import { PerformanceWarningToast } from "@/components/common/PerformanceWarningToast";
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* General Sans (Neural Monitor Style's gl-font-display/body) is hosted
            on Fontshare, not Google Fonts — next/font/google can't load it, so
            it comes in via a stylesheet link. See obsidian/frontend/design-system.md. */}
        <link
          rel="stylesheet"
          href="https://api.fontshare.com/v2/css?f[]=general-sans@200,300,400,500,600,700&display=swap"
        />
      </head>
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
            <LanguageDirection />
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
          </ScrollLayout>
        </PerformanceTierProvider>
      </body>
    </html>
  );
}
