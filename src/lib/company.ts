/**
 * Geoporte company content — offices, contact channels, culture.
 *
 * Updated for www.geoporte.ae (Middle East site).
 * Source: Geoporte ME Website Content and Build Brief, Rev 0, 2 November 2026.
 */

export const brand = {
  wordmark: "GEOPORTE",
  tagline: "Global Expertise, Local Commitment",
  positioningLine: "Specialist ground engineering for the Gulf",
  descriptor: "Geotechnical, civil and structural engineering for rail, water, tunnelling, roads and bridges, ports and marine, and buildings across the Gulf",
  philosophy: "Complex ground. Complex engineering. Clear decisions.",
  mission:
    "Risk-based design and management of complex engineering projects, built on senior engineering judgement and decades of Gulf and international experience.",
} as const;

export interface OfficeLocation {
  city: string;
  country: "Australia" | "New Zealand" | "United Arab Emirates" | "United Kingdom" | "Canada";
  address: string;
}

export const offices: OfficeLocation[] = [
  {
    city: "Dubai",
    country: "United Arab Emirates",
    address: "Meydan Grandstand, 6th Floor, Meydan Road, Nad Al Sheba, Dubai, United Arab Emirates",
  },
  {
    city: "Melbourne",
    country: "Australia",
    address: "Level 23, Tower 5, Collins Square, 727 Collins Street, Docklands VIC 3008",
  },
  {
    city: "Sydney",
    country: "Australia",
    address: "Three International Towers, Tower Three, 300 Barangaroo Avenue, Sydney NSW 2000",
  },
  {
    city: "Perth",
    country: "Australia",
    address: "108 St Georges Terrace, Perth WA 6000",
  },
  {
    city: "Auckland",
    country: "New Zealand",
    address: "110 Carlton Gore Road, Newmarket, Auckland 1023",
  },
  {
    city: "Grantham",
    country: "United Kingdom",
    address: "156 Barrowby Road, Grantham, England NG31 8AF",
  },
  {
    city: "Oakville",
    country: "Canada",
    address: "3275 Stalybridge Drive, Oakville, Ontario L6M 0L2",
  },
];

/**
 * Middle East specific content for the About page and home page sections.
 * Source: Brief Section 3, 6, 11.
 */
export const middleEast = {
  tagline: "Global Expertise, Local Commitment",
  subheading: "Specialist ground engineering for the Gulf",
  description:
    "Geoporte is an international engineering consultancy providing geotechnical, civil and structural design. We serve Middle East clients through Geoporte Middle East L.L.C-FZ in Dubai, backed by our technical teams in Melbourne, Sydney, Perth and Auckland and registered entities in Australia, New Zealand, the United Kingdom, Canada and the UAE.",
  stats: [
    { value: "25+", label: "Years Gulf Experience" },
    { value: "7", label: "Countries Active" },
    { value: "ISO", label: "9001 · 14001 · 45001" },
    { value: "8", label: "Senior Specialists" },
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
    "Government authorities and utilities",
    "Master developers and private developers",
    "Lead consultants and design teams",
    "Design and build contractors",
  ],
} as const;

export const contact = {
  email: "enquiries@geoporte.com",
  directEmail: "qaiser.hayat@geoporte.com",
  responseTime: "We reply within one business day.",
  businessHours: "Monday to Friday, 8:30 am to 5:30 pm Gulf Standard Time",
  phones: [
    { region: "Middle East", number: "+971 55 195 5797" },
    { region: "Australia", number: "+61 (0) 431 55 4626" },
    { region: "New Zealand", number: "+64 (0) 212 87 0714" },
  ],
  primaryContact: {
    name: "Qaiser Hayat",
    title: "Managing Director",
    phone: "+971 55 195 5797",
    phoneLink: "tel:+971551955797",
  },
  address: {
    company: "Geoporte Middle East L.L.C-FZ",
    street: "Meydan Grandstand, 6th Floor, Meydan Road, Nad Al Sheba",
    city: "Dubai",
    country: "United Arab Emirates",
  },
} as const;

export const cultureValues = [
  "Teamwork",
  "Honesty",
  "Commitment",
  "Engineering Excellence",
] as const;

export const teamComposition = [
  "Geotechnical Engineers",
  "Tunnel Engineers",
  "Structural Engineers",
  "Engineering Geologists",
  "Numerical Analysts",
  "Foundation Design Specialists",
] as const;

export const experienceRegions = [
  "United Arab Emirates",
  "Saudi Arabia",
  "Qatar",
  "Kuwait",
  "Oman",
  "Bahrain",
  "Australia",
  "New Zealand",
  "United Kingdom",
] as const;
