import { Inview } from "@/components/animation/springs/in-view";
import { AboutHeading } from "./AboutHeading";
import { GeologicalCrossSection } from "./GeologicalCrossSection";
import { TeamPanel } from "./TeamPanel";

export interface AboutSectionProps {
  /** Defaults to "h2" (the homepage's own `<h1>` lives in `HeroHeading`).
   * The standalone `/about` page passes "h1". */
  headingTag?: "h1" | "h2";
}

export const AboutSection = ({ headingTag = "h2" }: AboutSectionProps = {}) => {
  return (
    <section
      id="about"
      aria-labelledby="about-heading"
      className="bg-background/50 backdrop-blur-sm relative z-10 mx-auto max-w-6xl px-6 py-24 md:px-8 md:py-32"
    >
      <div className="grid grid-cols-1 gap-16 md:grid-cols-[1.2fr_1fr]">
        <div>
          <p className="text-label mb-4 text-xs tracking-[0.3em] uppercase">
            Geoporte in the Middle East
          </p>
          <AboutHeading
            id="about-heading"
            tag={headingTag}
            className="leading-display font-heading text-heading max-w-xl text-3xl font-medium md:text-5xl"
          />

          <Inview
            tag="div"
            mode="once"
            from={{ opacity: 0, y: 24 }}
            to={{ opacity: 1, y: 0 }}
            className="mt-8 flex max-w-xl flex-col gap-5"
          >
            <p className="text-foreground-muted text-base leading-relaxed md:text-lg">
              Geoporte is a specialist ground engineering consultancy for the Gulf. We provide
              geotechnical, tunnelling, civil and structural design — led by senior engineers
              with decades of experience on the region&#39;s most demanding infrastructure.
            </p>
            <p className="text-foreground-muted text-base leading-relaxed md:text-lg">
              Every commission is led by a principal engineer. We pair rigorous senior judgement
              with advanced numerical modelling and digital tools — across rail, water,
              tunnelling, roads and bridges, ports and marine, and buildings.
            </p>
          </Inview>
        </div>

        <Inview
          tag="div"
          mode="once"
          from={{ opacity: 0, y: 24 }}
          to={{ opacity: 1, y: 0 }}
          delayIn={150}
          className="flex flex-col gap-6"
        >
          <GeologicalCrossSection />

          <TeamPanel />
        </Inview>
      </div>
    </section>
  );
};
