"use client";

import { usePerformanceTier } from "@/hooks/performance/use-performance-tier";
import { TierInview as Inview } from "@/components/common/TierInview";
import { ProjectCard } from "./ProjectCard";
import type { Project, ProjectCategory } from "@/data/mocks/projects";

export interface TierProjectsGridProps {
  categories: readonly ProjectCategory[];
  projects: readonly Project[];
}

/** "Maximum baqala mode" (ADR-0103) spec — "show maximum 4 project cards". */
const TIER1_MAX_PROJECT_CARDS = 4;

/**
 * Client leaf so the homepage `ProjectsSection` (a Server Component) can
 * still react to a client-detected tier without converting the whole view
 * — same shape as `TierImage`/`TierInview`. On Tier 1, replaces the full
 * categorized grid with a flat, uncategorized list of at most
 * `TIER1_MAX_PROJECT_CARDS` cards instead.
 *
 * Tier is only known client-side (`usePerformanceTier()`) — the server
 * still has to send every project's markup in the initial HTML regardless
 * of tier, so this only reduces what ends up *mounted* after hydration
 * (fewer `ProjectCard`/`IntersectionObserver` instances), not the bytes
 * already downloaded. A fix that stops Tier 1 from ever receiving the
 * other projects' HTML at all needs a server-side tier signal — a bigger,
 * separately-scoped decision (see ADR-0103's own note).
 */
export const TierProjectsGrid = ({ categories, projects }: TierProjectsGridProps) => {
  const { tier } = usePerformanceTier();

  if (tier === "low") {
    const capped = projects.slice(0, TIER1_MAX_PROJECT_CARDS);
    return (
      <ul className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {capped.map((project, index) => (
          <li key={project.title}>
            <ProjectCard project={project} priority={index < 3} />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="mt-14 flex flex-col gap-16">
      {categories.map((category, index) => {
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
            <h3 className="text-label text-sm tracking-[0.16em] uppercase">
              {category}
            </h3>
            <ul className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {categoryProjects.map((project, cardIndex) => (
                <li key={project.title}>
                  <ProjectCard
                    project={project}
                    priority={index === 0 && cardIndex < 3}
                  />
                </li>
              ))}
            </ul>
          </Inview>
        );
      })}
    </div>
  );
};
