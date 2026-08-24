import Link from "next/link";
import { SectionHeading } from "@/components/common/SectionHeading";
import { TranslatedText } from "@/components/common/TranslatedText";
import { Magnetic } from "@/components/common/Magnetic";
import { brand } from "@/lib/company";
import { HeroScene } from "@/components/scene/HeroScene";

/**
 * The page's single `<h1>` lives here — the hero headline.
 */
export const HeroSection = () => {
  return (
    <section
      id="hero"
      aria-labelledby="hero-heading"
      className="bg-background relative flex min-h-screen items-center overflow-hidden"
    >
      <div data-cursor="canvas" className="absolute inset-0 h-full w-full">
        <HeroScene className="h-full w-full" />
      </div>
      <div
        aria-hidden="true"
        className="from-background via-background/75 to-background/15 absolute inset-0 bg-gradient-to-t"
      />

      <div className="relative z-10 mx-auto w-full max-w-6xl px-6 md:px-8">
        <SectionHeading
          id="hero-heading"
          tag="h1"
          eyebrow="Civil · Geotechnical · Structural · Telecom"
          heading="Design. Engineering. Advisory."
          headingClassName="leading-display text-foreground max-w-4xl text-5xl font-medium md:text-7xl"
        />

        <p className="text-foreground-muted mt-6 max-w-xl text-lg">
          {brand.mission}
        </p>

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
    </section>
  );
};
