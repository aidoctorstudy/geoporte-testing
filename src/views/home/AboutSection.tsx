import { SectionHeading } from "@/components/common/SectionHeading";
import { TranslatedText } from "@/components/common/TranslatedText";
import { Inview } from "@/components/animation/springs/in-view";
import { cultureValues, teamComposition } from "@/lib/company";
import { GeologicalCrossSection } from "./GeologicalCrossSection";

export const AboutSection = () => {
  return (
    <section
      id="about"
      aria-labelledby="about-heading"
      className="mx-auto max-w-6xl px-6 py-24 md:px-8 md:py-32"
    >
      <div className="grid grid-cols-1 gap-16 md:grid-cols-[1.2fr_1fr]">
        <div>
          <SectionHeading
            id="about-heading"
            eyebrow="About Geoporte"
            heading="Complex ground. Complex engineering. Clear decisions."
            headingClassName="leading-display text-foreground max-w-xl text-3xl font-medium md:text-5xl"
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

          <aside
            aria-label="Our team and values"
            className="border-line bg-surface flex flex-col gap-8 rounded-2xl border p-8"
          >
            <div>
              <h3 className="text-foreground-muted text-xs tracking-[0.2em] uppercase">
                <TranslatedText text="Our team" />
              </h3>
              <ul className="mt-4 flex flex-col gap-2">
                {teamComposition.map((role) => (
                  <li key={role} className="text-foreground text-sm">
                    {role}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-foreground-muted text-xs tracking-[0.2em] uppercase">
                <TranslatedText text="What drives us" />
              </h3>
              <ul className="mt-4 flex flex-wrap gap-2">
                {cultureValues.map((value) => (
                  <li
                    key={value}
                    className="border-line text-foreground rounded-full border px-3 py-1 text-xs"
                  >
                    {value}
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </Inview>
      </div>
    </section>
  );
};
