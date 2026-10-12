import Link from "next/link";
import { Magnetic } from "@/components/common/Magnetic";
import { TranslatedText } from "@/components/common/TranslatedText";
import { brand } from "@/lib/company";
import { HeroScene } from "@/components/scene/HeroScene";
import { HeroHeading, HeroSubtext } from "./HeroHeading";
import { ProjectTicker } from "./ProjectTicker";
import { ScrollCue } from "./ScrollCue";

/**
 * The page's single `<h1>` lives here — the hero headline.
 *
 * As of 2026-10-12 (ADR-0093), redesigned to an "AiMatic-style" split: text
 * content anchored left (`max-w-xl`, not the previous full-width centered
 * block), a particle "GEOPORTE" wordmark on the right (part of `HeroScene`'s
 * own scene — see `build-hero-scene.ts`). The hero's background is now
 * deliberately transparent — it reverses ADR-0068's "occlude the globe"
 * decision: the hero's old bespoke digital-twin diorama (which that opacity
 * existed to let read as the *only* 3D content) was removed outright in the
 * same redesign, so there's nothing left to protect from showing the
 * persistent Earth globe (`PlanetBackground`, mounted at the app root)
 * through. `fallback={null}` on `<HeroScene>` carries the same transparency
 * through to the low-power-tier CSS fallback path too (the default
 * `HeroFallback` paints its own opaque `bg-background`, which every other
 * `HeroScene` caller still wants, just not this one).
 */
export const HeroSection = () => {
  return (
    <section
      id="hero"
      aria-labelledby="hero-heading"
      className="relative z-0 flex min-h-screen items-center overflow-hidden"
    >
      <div data-cursor="canvas" className="absolute inset-0 z-0 h-full w-full">
        <HeroScene className="h-full w-full" fallback={null} />
      </div>

      <div className="relative z-10 w-full max-w-xl px-6 md:px-12 lg:px-20">
        <p className="text-label [text-shadow:0_2px_16px_rgba(0,0,0,.8)] mb-4 text-xs tracking-[0.3em] uppercase">
          Civil · Geotechnical · Structural · Telecom
        </p>
        <HeroHeading
          id="hero-heading"
          text="Design. Engineering. Advisory."
          className="leading-display font-heading text-heading [text-shadow:0_2px_24px_rgba(0,0,0,.85)] text-5xl font-medium md:text-7xl"
        />

        <HeroSubtext
          text={brand.mission}
          className="text-foreground-muted [text-shadow:0_2px_16px_rgba(0,0,0,.8)] mt-6 text-lg"
        />

        <div className="mt-10">
          <Magnetic>
            <Link
              href="#projects"
              className="bg-accent text-accent-foreground hover:bg-accent/90 transition-colors duration-[var(--duration-fast)] ease-entrance inline-flex items-center rounded-full px-8 py-4 text-sm font-medium tracking-[0.08em] uppercase"
            >
              <TranslatedText text="See Our Projects" />
            </Link>
          </Magnetic>
        </div>
      </div>

      <ProjectTicker />
      <ScrollCue />
    </section>
  );
};
