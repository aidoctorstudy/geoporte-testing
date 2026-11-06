/**
 * Geoporte company content — offices, contact channels, culture.
 *
 * Real site content (not placeholder data), so it lives alongside `site.ts`
 * rather than under `data/mocks/`. Sourced from geoporte.com.au.
 */

export const brand = {
  wordmark: "GEOPORTE",
  tagline: "Design Engineering Advisory",
  mission:
    "Risk-based design and management of complex engineering projects, fuelled by vast local and international experience.",
  philosophy: "Complex ground. Complex engineering. Clear decisions.",
} as const;

export interface OfficeLocation {
  city: string;
  country: "Australia" | "New Zealand" | "United Arab Emirates";
  address: string;
}

export const offices: OfficeLocation[] = [
  {
    city: "Melbourne",
    country: "Australia",
    address: "Tower 5, Collins Square, 727 Collins Street, VIC 3008",
  },
  {
    city: "Sydney",
    country: "Australia",
    address: "Three International Towers, 300 Barangaroo Ave, NSW 2000",
  },
  {
    city: "Perth",
    country: "Australia",
    address: "108 St Georges Terrace, WA 6000",
  },
  {
    city: "Auckland",
    country: "New Zealand",
    address: "110 Carlton Gore Road, New Market, 1023",
  },
  {
    city: "Dubai",
    country: "United Arab Emirates",
    // No street address supplied (only the legal entity name) — shown in
    // the same slot every other office uses for its building/street line.
    address: "Geoporte Middle East L.L.C-FZ",
  },
];

/**
 * "Geoporte in the Middle East" content — About page section (see
 * `views/about/MiddleEastSection.tsx`). Sourced from the Geoporte Middle
 * East capability statement, not derived/invented — unlike `StatsSection`'s
 * homepage counters (deliberately computed from the real project list),
 * these are the capability statement's own published figures, so they stay
 * as given rather than being backed into project-list math.
 */
export const middleEast = {
  tagline: "Global Expertise, Local Commitment",
  subheading: "Specialist ground engineering for the Gulf",
  description:
    "Geoporte is an international engineering consultancy providing geotechnical, civil and structural design. We serve Middle East clients through Geoporte Middle East L.L.C-FZ in Dubai, backed by our technical teams in Melbourne, Sydney, Perth and Auckland.",
  stats: [
    { value: "200+", label: "Projects" },
    { value: "200+", label: "Years Experience" },
    { value: "6", label: "Countries" },
    { value: "ISO", label: "Certified" },
  ],
  sectors: [
    "Rail and metro",
    "Water, wastewater and drainage",
    "Tunnelling and underground",
    "Roads and bridges",
    "Ports, marine and reclamation",
    "Buildings and developments",
    "Energy and utilities",
    "Investigation and forensics",
  ],
  whoWeWorkFor: [
    "Government authorities",
    "Master developers",
    "Lead consultants",
    "Design & build contractors",
  ],
} as const;

export const contact = {
  email: "enquiries@geoporte.com.au",
  responseTime: "24-hour response",
  phones: [
    { region: "Australia", number: "+61 (0) 431 55 4626" },
    { region: "Australia (alt)", number: "+61 (0) 388 21 7758" },
    { region: "New Zealand", number: "+64 (0) 212 87 0714" },
  ],
} as const;

export const cultureValues = [
  "Teamwork",
  "Honesty",
  "Commitment",
  "Engineering Excellence",
] as const;

export const teamComposition = [
  "Civil Engineers",
  "Geotechnical Engineers",
  "Numerical Analysts",
  "Engineering Geologists",
  "Hydrogeologists",
  "Foundation Design Specialists",
] as const;

export const experienceRegions = [
  "Australia",
  "New Zealand",
  "Europe",
  "Middle East",
  "Asia",
] as const;
