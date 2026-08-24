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
import { ScrollLayout } from "@/layouts/scroll-layout";

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
        <ScrollLayout>
          <AdaptiveGrid />
          <ReducedMotion />
          <LanguageDirection />
          <LazyCookie />
          <Nav />
          <main>{children}</main>
          <Footer />
        </ScrollLayout>
      </body>
    </html>
  );
}
