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
  country: "Australia" | "New Zealand";
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
];

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
