/**
 * Curated service → project-category relevance map, used by the service
 * detail page's Related Projects section to filter `projects` (`@/data/mocks/
projects`) down to a handful of representative real projects.
 *
 * `Project` has no direct service/discipline linkage — only a 3-value
 * `category` and a loose free-text `sector` that doesn't reliably match any
 * of the 8 service slugs. Rather than add a `relatedServiceSlugs` field to
 * all 26 projects (a bigger, riskier data change than this needs), each
 * service is hand-mapped to the 1-3 project categories it's actually
 * relevant to; the section filters and caps at 6 cards. See ADR in
 * obsidian/meta/decisions-log.md.
 */
import type { ProjectCategory } from "./projects";

export const SERVICE_PROJECT_CATEGORIES: Record<string, ProjectCategory[]> = {
  "civil-engineering": ["Transport"],
  "design-and-drafting": ["Transport", "Built Environment"],
  "geotechnical-engineering": [
    "Transport",
    "Built Environment",
    "Energy, Resources & Water",
  ],
  "structural-engineering": ["Built Environment"],
  "stormwater-and-flood-modelling": [
    "Energy, Resources & Water",
    "Built Environment",
  ],
  "project-control-services": [
    "Transport",
    "Built Environment",
    "Energy, Resources & Water",
  ],
  "advisory-services": [
    "Transport",
    "Built Environment",
    "Energy, Resources & Water",
  ],
  "telecom-services": ["Energy, Resources & Water"],
};
