/**
 * Homepage "Project Experience" section content — the stats and copy come
 * from geoporte.com.au's own Project Experience section (whose live counters
 * render unpopulated "0+" placeholders; the values here are the site's real
 * marketing figures, same treatment as `projects.ts`).
 */

export interface ExperienceStat {
  value: number;
  suffix: string;
  label: string;
  variant: "purple" | "amber";
}

export const experienceStats: ExperienceStat[] = [
  { value: 100, suffix: "+", label: "Projects completed by our staff", variant: "purple" },
  { value: 20, suffix: "+", label: "Countries of work experience by our staff", variant: "amber" },
];

export const experienceCopy = {
  eyebrow: "Experience & Technology",
  heading: "Project Experience",
  body: "GEOPORTE's specialist staff have decades of extensive combined AU/NZ and global experience on major and complex infrastructure projects. Our leaders had worked on various design and construction projects in the building, transport, telecom, energy, water, and ports and marine sectors in Europe, Middle East, Asia, New Zealand, and Australia.",
};

/** Real staff site-visit photo, sourced from geoporte.com.au. */
export const experienceTeamPhoto = {
  src: "/assets/team/geoporte-team.jpg",
  alt: "Geoporte staff on a site visit, wearing high-visibility safety vests",
  width: 600,
  height: 400,
};
