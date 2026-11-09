import { SectionHeading } from "@/components/common/SectionHeading";
import { TierInview as Inview } from "@/components/common/TierInview";
import { baseProjects } from "@/data/mocks/projects";

const CAROUSEL_REFS = ["T1", "T4", "T7", "T8", "T14", "T19"];

const carouselProjects = baseProjects.filter(
  (p) => p._ref && CAROUSEL_REFS.includes(p._ref)
);

const FOOTNOTE =
  "Geoporte commission: delivered by Geoporte. Team experience: delivered by Geoporte's senior specialists in previous roles with international consultancies, shown to illustrate the depth of our people.";

export const TeamExperienceSection = () => {
  return (
    <section
      id="team-experience"
      aria-labelledby="team-experience-heading"
      className="bg-background-alt/40 border-line border-y py-24 md:py-32"
    >
      <div className="mx-auto max-w-6xl px-6 md:px-8">
        <SectionHeading
          id="team-experience-heading"
          eyebrow="Our people"
          heading="Experience behind every commission"
        />

        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {carouselProjects.map((project, index) => (
            <Inview
              key={project._ref}
              mode="once"
              from={{ opacity: 0, y: 24 }}
              to={{ opacity: 1, y: 0 }}
              delayIn={index * 80}
            >
              <div className="border-line bg-surface flex h-full flex-col rounded-2xl border overflow-hidden">
                <div
                  className="h-36 w-full bg-cover bg-center flex-shrink-0"
                  style={{ backgroundImage: `url(${project.image.src})` }}
                  role="img"
                  aria-label={project.image.alt}
                />
                <div className="flex flex-1 flex-col justify-between p-5">
                  <div>
                    <span className="border-line text-label mt-1 inline-block rounded-full border px-2.5 py-0.5 text-[10px] font-medium tracking-[0.12em] uppercase">
                      {project.label}
                    </span>
                    <h3 className="text-foreground mt-3 text-sm font-medium leading-snug">
                      {project.title}
                    </h3>
                  </div>
                  <p className="text-foreground-muted mt-4 text-xs">
                    {project.location}, {project.country}
                  </p>
                </div>
              </div>
            </Inview>
          ))}
        </div>

        <p className="text-foreground-muted mt-10 max-w-3xl text-xs leading-relaxed">
          <span className="font-medium">Note: </span>
          {FOOTNOTE}
        </p>
      </div>
    </section>
  );
};
