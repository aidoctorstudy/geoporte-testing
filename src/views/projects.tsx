import type { Metadata } from "next";
import { ProjectsCascade } from "@/views/projects/ProjectsCascade";
import { ProjectsShowreel } from "@/views/projects/ProjectsShowreel";
import { ProjectModal } from "@/views/home/ProjectModal";
import { generateMetadata as buildMetadata } from "@/utils/seo/generate-page-metadata";

export function generateMetadata(): Metadata {
  return buildMetadata({
    title: "Projects | Geoporte",
    description:
      "Ground engineering projects across the Gulf — rail, water, tunnelling, roads and bridges, ports and marine, and buildings. Each shows Geoporte commissions or our senior team's prior work.",
    url: "/projects",
  });
}

/**
 * `ProjectsShowreel` is a cinematic lead-in (scroll-driven 3D flight through
 * every real project, no heading of its own) sitting above `ProjectsCascade`
 * — a page-scoped "Cards Cascade" scroll-driven 3D deck (own `<h1>`, "Our
 * Projects") that replaced the plain browsable `ProjectsSection` grid this
 * page used previously. `ProjectsSection` itself is untouched and still
 * used by the homepage — this page no longer renders it, which means it no
 * longer mounts that component's own `<ProjectModal />` either: `Projects
 * Showreel`'s tiles still open the shared `useProjectModalStore` on click,
 * so `<ProjectModal />` is mounted directly here instead (the same shared
 * singleton `ServiceRelatedProjects.tsx` mounts on service pages — not a
 * second modal implementation). See ADR-0075.
 */
export function ProjectsView() {
  return (
    <>
      <ProjectsShowreel />
      <ProjectsCascade />
      <ProjectModal />
    </>
  );
}
