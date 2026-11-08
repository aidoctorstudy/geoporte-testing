/**
 * Curated service → project-category relevance map, used by the service
 * detail page's Related Projects section to filter `projects` down to a
 * handful of representative real projects.
 *
 * Maps each of the 9 ME service slugs to the ProjectCategory values that
 * best represent it. The section filters and caps at 6 cards.
 *
 * Source: Geoporte ME Website Content and Build Brief, Rev 0,
 * 2 November 2026, Section 7 (Related projects noted per service).
 */
import type { ProjectCategory } from "./projects";

export const SERVICE_PROJECT_CATEGORIES: Record<string, ProjectCategory[]> = {
  "ground-investigation": [
    "Rail and Metro",
    "Water, Wastewater and Drainage",
    "Roads and Bridges",
  ],
  "geotechnical-design": [
    "Buildings and Developments",
    "Roads and Bridges",
    "Energy and Utilities",
  ],
  "tunnelling-underground": [
    "Rail and Metro",
    "Water, Wastewater and Drainage",
    "Tunnelling and Underground",
  ],
  "numerical-modelling": [
    "Buildings and Developments",
    "Water, Wastewater and Drainage",
    "Tunnelling and Underground",
  ],
  "ground-improvement-reclamation": [
    "Ports, Marine and Reclamation",
  ],
  "independent-checking": [
    "Buildings and Developments",
    "Ports, Marine and Reclamation",
    "Roads and Bridges",
  ],
  "forensic-investigation": [
    "Water, Wastewater and Drainage",
    "Buildings and Developments",
    "Investigation and Forensics",
  ],
  "structural-engineering": [
    "Buildings and Developments",
    "Energy and Utilities",
    "Roads and Bridges",
  ],
  "construction-support": [
    "Rail and Metro",
    "Buildings and Developments",
    "Water, Wastewater and Drainage",
  ],
};
