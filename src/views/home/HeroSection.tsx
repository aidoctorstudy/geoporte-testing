import Link from "next/link";
import { Magnetic } from "@/components/common/Magnetic";
import { brand } from "@/lib/company";
import { HeroScene } from "@/components/scene/HeroScene";
import { HeroHeading, HeroSubtext } from "./HeroHeading";
import { ProjectTicker } from "./ProjectTicker";
import { ScrollCue } from "./ScrollCue";

/**
 * The page's single `<h1>` lives here — the hero headline.
 */
export const HeroSection = () => {
  return (
    <section
      id="hero"
      aria-labelledby="hero-heading"
      className="bg-background relative z-0 flex min-h-screen items-center overflow-hidden"
    >
      {/* Opaque dark-navy fill, by explicit design choice: the hero keeps its
          own bespoke digital-twin wireframe scene (below) as its ONLY 3D
          content, so this section's background must occlude the persistent
          Earth globe (mounted at the app root, `position:fixed`/`z-index:-1`,
          see PlanetBackground.tsx) rather than let it show through. Every
          section below this one stays transparent/translucent so the globe
          is visible there as the user scrolls — see ADR-0068 in
          decisions-log.md. */}
      <div data-cursor="canvas" className="absolute inset-0 z-0 h-full w-full">
        <HeroScene className="h-full w-full" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-6xl px-6 md:px-8">
        <p className="text-foreground-muted [text-shadow:0_2px_16px_rgba(0,0,0,.8)] mb-4 text-xs tracking-[0.3em] uppercase">
          Civil · Geotechnical · Structural · Telecom
        </p>
        <HeroHeading
          id="hero-heading"
          text="Design. Engineering. Advisory."
          className="leading-display text-foreground [text-shadow:0_2px_24px_rgba(0,0,0,.85)] max-w-4xl text-5xl font-medium md:text-7xl"
        />

        <HeroSubtext
          text={brand.mission}
          className="text-foreground-muted [text-shadow:0_2px_16px_rgba(0,0,0,.8)] mt-6 max-w-xl text-lg"
        />

        <div className="mt-10">
          <Magnetic>
            <Link
              href="#projects"
              className="bg-accent text-accent-foreground hover:bg-accent/90 transition-colors duration-[var(--duration-fast)] ease-entrance inline-flex items-center rounded-full px-8 py-4 text-sm font-medium tracking-[0.08em] uppercase"
            >
              See Our Projects
            </Link>
          </Magnetic>
        </div>
      </div>

      <ProjectTicker />
      <ScrollCue />
    </section>
  );
};
