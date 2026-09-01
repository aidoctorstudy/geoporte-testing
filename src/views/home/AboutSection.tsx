import { Inview } from "@/components/animation/springs/in-view";
import { TranslatedText } from "@/components/common/TranslatedText";
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
      className="mx-auto max-w-6xl px-6 py-24 md:px-8 md:py-32"
    >
      <div className="grid grid-cols-1 gap-16 md:grid-cols-[1.2fr_1fr]">
        <div>
          <p className="text-foreground-muted mb-4 text-xs tracking-[0.3em] uppercase">
            <TranslatedText text="About Geoporte" />
          </p>
          <AboutHeading
            id="about-heading"
            tag={headingTag}
            className="leading-display text-foreground max-w-xl text-3xl font-medium md:text-5xl"
          />

          <Inview
            tag="div"
            mode="once"
            from={{ opacity: 0, y: 24 }}
            to={{ opacity: 1, y: 0 }}
            className="mt-8 flex max-w-xl flex-col gap-5"
          >
            <p className="text-foreground-muted text-base leading-relaxed md:text-lg">
              Geoporte leads in risk-based design and management of complex
              engineering projects. Our specialists draw creative, buildable
              solutions from vast local and international experience — an
              agile team with decades in the field, gained on projects around
              the world.
            </p>
            <p className="text-foreground-muted text-base leading-relaxed md:text-lg">
              We work as a One Team with our clients, pairing cutting-edge
              digital tools and modelling with rigorous senior review — across
              building, transport, water, ports, marine and energy
              infrastructure.
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
