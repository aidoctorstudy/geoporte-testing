import { SectionHeading } from "@/components/common/SectionHeading";
import { Inview } from "@/components/animation/springs/in-view";
import { projects } from "@/data/mocks/projects";
import { SERVICE_PROJECT_CATEGORIES } from "@/data/mocks/service-project-map";
import { ProjectCard } from "@/views/home/ProjectCard";
import { ProjectModal } from "@/views/home/ProjectModal";

const MAX_RELATED_PROJECTS = 6;

export interface ServiceRelatedProjectsProps {
  serviceSlug: string;
}

/** Filters the real project list (`@/data/mocks/projects`) via the curated
 * `SERVICE_PROJECT_CATEGORIES` map (no per-project service field exists — see
 * ADR in decisions-log.md), capped at 6 cards, reusing `ProjectCard`
 * unchanged — it already opens the shared `ProjectModal` on click. */
export const ServiceRelatedProjects = ({ serviceSlug }: ServiceRelatedProjectsProps) => {
  const relevantCategories = SERVICE_PROJECT_CATEGORIES[serviceSlug] ?? [];
  const relatedProjects = projects
    .filter((project) => relevantCategories.includes(project.category))
    .slice(0, MAX_RELATED_PROJECTS);

  if (relatedProjects.length === 0) return null;

  return (
    <section
      aria-labelledby="service-related-projects-heading"
      className="mx-auto max-w-6xl px-6 py-16 md:px-8 md:py-24"
    >
      <SectionHeading
        id="service-related-projects-heading"
        eyebrow="Track record"
        heading="Related projects"
      />

      <ul className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {relatedProjects.map((project, index) => (
          <Inview
            key={project.title}
            tag="li"
            mode="once"
            from={{ opacity: 0, y: 24 }}
            to={{ opacity: 1, y: 0 }}
            delayIn={(index % 3) * 80}
          >
            <ProjectCard project={project} />
          </Inview>
        ))}
      </ul>

      <ProjectModal />
    </section>
  );
};
