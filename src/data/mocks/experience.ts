/**
 * Homepage "Project Experience" section content.
 *
 * Updated for geoporte.ae per Geoporte ME Website Content and Build Brief,
 * Rev 0, 2 November 2026, Section 6.1 (Stats strip and "how we work").
 *
 * middleEast stats from company.ts: "25+ Years Gulf Experience",
 * "7 Countries Active", "ISO 9001·14001·45001", "8 Senior Specialists".
 */

export interface ExperienceStat {
  value: number;
  suffix: string;
  label: string;
  variant: "purple" | "amber";
}

export const experienceStats: ExperienceStat[] = [
  { value: 25, suffix: "+", label: "Years of Gulf experience", variant: "purple" },
  { value: 7, suffix: "", label: "Countries currently active in the region", variant: "amber" },
];

export const experienceCopy = {
  eyebrow: "Gulf Ground, Understood",
  heading: "Experience behind every commission",
  body: "Our senior specialists have designed some of the region's largest underground, transport and marine systems — metro lines, deep sewer tunnels, offshore islands, ports and causeways across the GCC. These projects were delivered in previous roles with international consultancies. The same engineers now lead Geoporte's work in the Middle East.",
};

/** Site photo — replace with ME-specific photo when available. */
export const experienceTeamPhoto = {
  src: "/assets/team/geoporte-team.jpg",
  alt: "Geoporte senior engineers reviewing ground investigation results on site",
  width: 600,
  height: 400,
};
