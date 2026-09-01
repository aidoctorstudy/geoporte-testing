"use client";

import Image from "next/image";
import { TiltCard } from "@/components/common/TiltCard";
import { TranslatedText } from "@/components/common/TranslatedText";
import type { Project } from "@/data/mocks/projects";
import { useProjectModalStore } from "./project-modal-store";

export interface ProjectCardProps {
  project: Project;
  priority?: boolean;
}

/**
 * Real photography, supplied directly (see `projects.ts`'s own header) and
 * copied into `public/assets/projects/` — replaces the category-tinted
 * gradient placeholder this card used before real images existed (ADR-0065/
 * ADR-0071's finding — no real per-project photography could be scraped
 * from the live site — no longer applies now that real photos exist; see
 * ADR-0073).
 */
export const ProjectCard = ({ project, priority = false }: ProjectCardProps) => {
  const openProject = useProjectModalStore((s) => s.open);

  return (
    <TiltCard
      onActivate={() => openProject(project)}
      aria-label={`View details for ${project.title}`}
      className="border-line bg-surface hover:border-accent/60 flex h-full cursor-pointer flex-col justify-between overflow-hidden rounded-2xl border transition-colors duration-[var(--duration-fast)] ease-entrance focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <div className="relative h-24 w-full overflow-hidden">
        <Image
          src={project.image.src}
          alt={project.image.alt}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover"
          priority={priority}
        />
      </div>
      <div className="flex flex-1 flex-col justify-between p-6">
        <div>
          <p className="text-foreground-muted text-xs tracking-[0.14em] uppercase">
            <TranslatedText text={project.sector} />
          </p>
          <h3 className="text-foreground mt-2 text-lg font-medium">
            <TranslatedText text={project.title} />
          </h3>
        </div>
        <p className="text-foreground-muted mt-6 text-sm">
          {project.location}, <TranslatedText text={project.country} />
        </p>
      </div>
    </TiltCard>
  );
};
