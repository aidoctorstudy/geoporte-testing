"use client";

import { TiltCard } from "@/components/common/TiltCard";
import type { Project } from "@/data/mocks/projects";
import { useProjectModalStore } from "./project-modal-store";

export interface ProjectCardProps {
  project: Project;
}

export const ProjectCard = ({ project }: ProjectCardProps) => {
  const openProject = useProjectModalStore((s) => s.open);

  return (
    <TiltCard
      onActivate={() => openProject(project)}
      aria-label={`View details for ${project.title}`}
      className="border-line bg-surface hover:border-accent/60 flex h-full cursor-pointer flex-col justify-between rounded-2xl border p-6 transition-colors duration-[var(--duration-fast)] ease-entrance focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <div>
        <p className="text-foreground-muted text-xs tracking-[0.14em] uppercase">
          {project.sector}
        </p>
        <h3 className="text-foreground mt-2 text-lg font-medium">
          {project.title}
        </h3>
      </div>
      <p className="text-foreground-muted mt-6 text-sm">
        {project.location}, {project.country}
      </p>
    </TiltCard>
  );
};
