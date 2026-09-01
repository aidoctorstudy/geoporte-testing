import Image from "next/image";
import Link from "next/link";
import { Inview } from "@/components/animation/springs/in-view";
import { Magnetic } from "@/components/common/Magnetic";
import { SectionHeading } from "@/components/common/SectionHeading";
import { TranslatedText } from "@/components/common/TranslatedText";
import { experienceCopy, experienceStats, experienceTeamPhoto } from "@/data/mocks/experience";
import { ExperienceStatBox } from "./ExperienceStatBox";

/** Homepage section (mounted between `ServicesSection` and `StatsSection`) —
 * a team photo and two colour-block stats on the left, the "decades of
 * combined experience" copy and an /about CTA on the right, inside the
 * sitewide `.glass-panel` treatment over `AmbientBackground`'s persistent
 * scene, same idiom as `ServiceCta`'s glass variant. */
export const ProjectExperienceSection = () => {
  return (
    <section
      id="project-experience"
      aria-labelledby="project-experience-heading"
      className="relative z-10 py-16 md:py-24"
    >
      <div className="glass-panel mx-auto max-w-6xl px-6 py-16 md:px-8 md:py-20">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 md:items-center">
          <Inview
            tag="div"
            mode="once"
            from={{ opacity: 0, y: 24 }}
            to={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-6"
          >
            <div className="relative aspect-[3/2] overflow-hidden rounded-2xl">
              <Image
                src={experienceTeamPhoto.src}
                alt={experienceTeamPhoto.alt}
                fill
                sizes="(min-width: 768px) 40vw, 90vw"
                className="object-cover"
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {experienceStats.map((stat) => (
                <ExperienceStatBox key={stat.label} stat={stat} />
              ))}
            </div>
          </Inview>

          <Inview
            tag="div"
            mode="once"
            from={{ opacity: 0, y: 24 }}
            to={{ opacity: 1, y: 0 }}
            delayIn={150}
          >
            <SectionHeading
              id="project-experience-heading"
              eyebrow={experienceCopy.eyebrow}
              heading={experienceCopy.heading}
              headingClassName="leading-display text-foreground max-w-xl text-3xl font-medium uppercase md:text-5xl"
            />
            <p className="text-foreground-muted mt-6 max-w-xl text-base leading-relaxed md:text-lg">
              {experienceCopy.body}
            </p>
            <Magnetic className="mt-8">
              <Link
                href="/about"
                className="bg-accent text-accent-foreground hover:bg-accent/90 inline-flex items-center gap-2 rounded-full px-8 py-4 text-sm font-medium tracking-[0.08em] uppercase transition-colors duration-[var(--duration-fast)] ease-entrance"
              >
                <TranslatedText text="Learn more" />
                <span aria-hidden="true">→</span>
              </Link>
            </Magnetic>
          </Inview>
        </div>
      </div>
    </section>
  );
};
