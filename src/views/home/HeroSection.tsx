import Link from "next/link";
import { Magnetic } from "@/components/common/Magnetic";
import { brand } from "@/lib/company";
import { getHeroHeading } from "@/lib/content-overrides";
import { HeroHeading, HeroSubtext } from "./HeroHeading";
import { ProjectTicker } from "./ProjectTicker";
import { ScrollCue } from "./ScrollCue";

/**
 * Hero section — background is provided by HomeScrollBackground (scene 0:
 * soil strata). The old per-section HeroScene (particle GEOPORTE wordmark)
 * was removed; HomeScrollBackground's fixed canvas shows through.
 */
export const HeroSection = () => {
  return (
    <section
      id="hero"
      aria-labelledby="hero-heading"
      className="relative z-0 flex min-h-screen items-center overflow-hidden"
    >
      <div className="relative z-10 w-full max-w-xl px-6 md:px-12 lg:px-20">
        <p className="text-label [text-shadow:0_2px_16px_rgba(0,0,0,.8)] mb-4 text-xs tracking-[0.3em] uppercase">
          Geoporte Middle East · Dubai, UAE
        </p>
        <HeroHeading
          id="hero-heading"
          text={getHeroHeading()}
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
              View Our Projects
            </Link>
          </Magnetic>
        </div>
      </div>

      <ProjectTicker />
      <ScrollCue />
    </section>
  );
};
