import { SectionHeading } from "@/components/common/SectionHeading";
import { Inview } from "@/components/animation/springs/in-view";
import { projectCategories, projects } from "@/data/mocks/projects";
import { ProjectCard } from "./ProjectCard";
import { ProjectModal } from "./ProjectModal";

export interface ProjectsSectionProps {
  /** Defaults to "h2" (the homepage's own `<h1>` lives in `HeroHeading`).
   * The standalone `/projects` page passes "h1". */
  headingTag?: "h1" | "h2";
}

export const ProjectsSection = ({ headingTag = "h2" }: ProjectsSectionProps = {}) => {
  return (
    <section
      id="projects"
      aria-labelledby="projects-heading"
      className="mx-auto max-w-6xl px-6 py-24 md:px-8 md:py-32"
    >
      <SectionHeading
        id="projects-heading"
        tag={headingTag}
        eyebrow="Selected work"
        heading="Landmark projects, across continents"
      />

      <div className="mt-14 flex flex-col gap-16">
        {projectCategories.map((category, index) => {
          const categoryProjects = projects.filter(
            (project) => project.category === category,
          );
          return (
            <Inview
              key={category}
              tag="section"
              mode="once"
              from={{ opacity: 0, y: 24 }}
              to={{ opacity: 1, y: 0 }}
              delayIn={index * 100}
            >
              <h3 className="text-foreground-muted text-sm tracking-[0.16em] uppercase">
                {category}
              </h3>
              <ul className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {categoryProjects.map((project, cardIndex) => (
                  <li key={project.title}>
                    <ProjectCard project={project} priority={index === 0 && cardIndex < 3} />
                  </li>
                ))}
              </ul>
            </Inview>
          );
        })}
      </div>

      <ProjectModal />
    </section>
  );
};
