import { SectionHeading } from "@/components/common/SectionHeading";
import { projectCategories, projects } from "@/data/mocks/projects";
import { ProjectModal } from "./ProjectModal";
import { TierProjectsGrid } from "./TierProjectsGrid";

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

      <TierProjectsGrid categories={projectCategories} projects={projects} />

      <ProjectModal />
    </section>
  );
};
