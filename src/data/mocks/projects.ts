/**
 * Geoporte project database for www.geoporte.ae.
 *
 * Source: Geoporte ME Website Content and Build Brief, Rev 0, 2 November 2026,
 * Sections 2.2, 9.2 and 9.3.
 *
 * Every project carries one of two labels — this is mandatory per the brief:
 *   "Geoporte commission" — delivered by Geoporte under its own appointment.
 *   "Team experience"     — delivered by Geoporte's senior specialists in
 *                           previous roles with international consultancies,
 *                           shown to illustrate the depth of our people.
 *
 * Client names and contract values are NOT published (brief Section 10).
 * Items marked [CONFIRM] in the brief are included but flagged below.
 *
 * `projects` (the export every consumer uses) is `baseProjects` merged with
 * any /admin-edited overrides in `content.json`, keyed by
 * `slugify(baseProjects[i].title)` — see `content-overrides.ts`. The key is
 * always derived from the *original* hardcoded title, so editing a title
 * through /admin can't orphan its own override.
 */
import { siteContent, slugify } from "@/lib/content-overrides";

export type ProjectLabel = "Geoporte commission" | "Team experience";

export type ProjectCategory =
  | "Rail and Metro"
  | "Water, Wastewater and Drainage"
  | "Tunnelling and Underground"
  | "Roads and Bridges"
  | "Ports, Marine and Reclamation"
  | "Buildings and Developments"
  | "Energy and Utilities"
  | "Investigation and Forensics";

export interface Project {
  title: string;
  location: string;
  country: string;
  /** One of the two mandatory labels. Shown on every card and detail page. */
  label: ProjectLabel;
  category: ProjectCategory;
  sector: string;
  description: string;
  image: {
    src: string;
    alt: string;
  };
  /** Internal reference code (C1–C7, T1–T26). Not displayed publicly. */
  _ref?: string;
}

/** Original, never-overridden data — /admin reads this (not `projects`
 * below) to compute each override's stable key and to show the real
 * baseline value for comparison. */
export const baseProjects: Project[] = [

  // ─── GEOPORTE COMMISSIONS (C1–C7) ────────────────────────────────────────

  {
    _ref: "C1",
    title: "Urban wadi flood mitigation: deep shafts and microtunnel",
    location: "Riyadh",
    country: "Saudi Arabia",
    label: "Geoporte commission",
    category: "Water, Wastewater and Drainage",
    sector: "Water; Tunnelling",
    description:
      "Geotechnical design and advisory for secant pile shafts and a 4 m diameter microtunnel drive at about 14 m depth. PLAXIS 2D and 3D modelling of staged excavation and dewatering, settlement troughs for 0.5, 1 and 2 per cent volume loss, and impact checks on an adjacent building and 17 buried utilities. Ground models and rock mass parameters in variable rock and soil. Performance specifications for secant piles, dewatering, pipe jacking and monitoring.",
    image: { src: "/assets/projects/GI-1.jpg", alt: "Urban wadi flood mitigation Riyadh" },
  },
  {
    _ref: "C2",
    title: "Live bridge protection during adjacent deep excavation",
    location: "Riyadh",
    country: "Saudi Arabia",
    label: "Geoporte commission",
    category: "Roads and Bridges",
    sector: "Roads and Bridges; Investigation and Forensics",
    description:
      "Construction impact assessment and monitoring design to protect an operating bridge during a deep excavation immediately adjacent to its foundations. Ground investigation scoping, PLAXIS modelling of excavation-induced movement, monitoring plan with trigger and response levels, and construction-phase advice.",
    image: { src: "/assets/projects/Senior-1.jpg", alt: "Live bridge protection during deep excavation Riyadh" },
  },
  {
    _ref: "C3",
    title: "Transmission tower foundations in flood-prone ground",
    location: "Eastern Province",
    country: "Saudi Arabia",
    label: "Geoporte commission",
    category: "Energy and Utilities",
    sector: "Energy and Utilities",
    description:
      "Stability assessment and foundation design for high-voltage transmission towers across ground subject to periodic wadi flooding. Assessment of scour risk, long-term settlement and lateral load capacity. Foundation options appraisal and detailed geotechnical design for the preferred solution.",
    image: { src: "/assets/projects/Plaxis-3D-A.png", alt: "Transmission tower foundations Eastern Province Saudi Arabia" },
  },
  {
    _ref: "C4",
    title: "Utility-scale solar PV plant peer review",
    location: "Kingdom of Saudi Arabia",
    country: "Saudi Arabia",
    label: "Geoporte commission",
    category: "Energy and Utilities",
    sector: "Energy and Utilities",
    description:
      "Independent review of the EPC contractor's geotechnical and civil design for a 2 GW utility-scale solar PV plant. Assessment of pile foundation design, ground investigation adequacy, settlement and bearing capacity calculations, and specification for panel support structures in desert ground conditions.",
    image: { src: "/assets/projects/g21.png", alt: "Utility-scale solar PV peer review Saudi Arabia" },
  },
  {
    _ref: "C5",
    title: "Independent piled raft check",
    location: "Dubai",
    country: "United Arab Emirates",
    label: "Geoporte commission",
    category: "Buildings and Developments",
    sector: "Buildings; Independent Checking",
    description:
      "Third-party geotechnical checking of a piled raft foundation design for a high-rise development in Dubai. Independent ground model, PLAXIS 3D piled raft analysis, settlement and differential settlement assessment, and pile spring derivation for the structural model. Check certificate and report issued.",
    image: { src: "/assets/projects/Plaxis-3D-C.png", alt: "Independent piled raft check Dubai" },
  },
  {
    _ref: "C6",
    title: "Settlement review for leaking pipeline joints",
    location: "Qatar",
    country: "Qatar",
    label: "Geoporte commission",
    category: "Water, Wastewater and Drainage",
    sector: "Water; Investigation and Forensics",
    description:
      "Independent technical review of post-construction settlement beneath a large-diameter water pipeline with recurring joint leaks. Review of design, construction and monitoring records, back-analysis of observed movement, root cause assessment, and remediation options appraisal.",
    image: { src: "/assets/projects/Plaxis-3D-D.png", alt: "Settlement review leaking pipeline Qatar" },
  },
  {
    _ref: "C7",
    title: "Heritage structure preliminary foundation assessment",
    location: "Bur Dubai",
    country: "United Arab Emirates",
    label: "Geoporte commission",
    category: "Buildings and Developments",
    sector: "Buildings; Investigation and Forensics",
    description:
      "Preliminary foundation condition assessment for a heritage building in Bur Dubai. Review of available ground investigation data, structural condition inspection, assessment of foundation type and depth, and recommendations for further investigation and remediation.",
    image: { src: "/assets/projects/WhatsApp-Image-2025-06-12-at-16.20.44_27b89dcb-scaled.jpg", alt: "Heritage structure assessment Bur Dubai" },
  },

  // ─── TEAM EXPERIENCE (T1–T26) ─────────────────────────────────────────────

  {
    _ref: "T1",
    title: "Dubai Metro Route 2020",
    location: "Dubai",
    country: "United Arab Emirates",
    label: "Team experience",
    category: "Rail and Metro",
    sector: "Rail and Metro; Tunnelling",
    description:
      "Geotechnical design lead for a 15 km metro extension including bored tunnels, cut-and-cover stations and elevated viaduct sections. Ground investigation scoping, PLAXIS modelling of tunnelling settlement, foundation design for stations and viaducts, dewatering and monitoring.",
    image: { src: "/assets/projects/MicroTBM-1.png", alt: "Dubai Metro Route 2020" },
  },
  {
    _ref: "T2",
    title: "Doha Metro and Riyadh Metro",
    location: "Doha and Riyadh",
    country: "Qatar and Saudi Arabia",
    label: "Team experience",
    category: "Rail and Metro",
    sector: "Rail and Metro; Tunnelling",
    description:
      "Led tunnel and geotechnical design on multiple contracts for the Doha Metro and Riyadh Metro. TBM drive design, secant pile and diaphragm wall station boxes, dewatering strategy, ground movement assessment and impact on adjacent structures.",
    image: { src: "/assets/projects/NZ-Handerson-Auckland-Trip-1.jpg", alt: "Doha Metro and Riyadh Metro" },
  },
  {
    _ref: "T3",
    title: "Etihad Rail ground investigation scoping",
    location: "United Arab Emirates",
    country: "United Arab Emirates",
    label: "Team experience",
    category: "Rail and Metro",
    sector: "Rail and Metro",
    description:
      "Ground investigation scoping and specification for the UAE national freight and passenger rail network. Geohazard mapping, borehole layout, in-situ and laboratory testing programme, and factual and interpretive reporting for rail formation design.",
    image: { src: "/assets/projects/Linkedin-1.jpg", alt: "Etihad Rail UAE" },
  },
  {
    _ref: "T4",
    title: "Strategic Tunnel Enhancement Programme (STEP)",
    location: "Abu Dhabi",
    country: "United Arab Emirates",
    label: "Team experience",
    category: "Water, Wastewater and Drainage",
    sector: "Water; Tunnelling",
    description:
      "Geotechnical design input to a 100 km deep sewer tunnel network beneath Abu Dhabi, including a 100 m deep pumping station shaft. TBM drive design, shaft stability, dewatering and groundwater control, and construction impact assessment.",
    image: { src: "/assets/projects/Yarraman-5.jpg", alt: "Strategic Tunnel Enhancement Programme STEP Abu Dhabi" },
  },
  {
    _ref: "T5",
    title: "Inner Doha Re-sewerage Implementation Strategy (IDRIS)",
    location: "Doha",
    country: "Qatar",
    label: "Team experience",
    category: "Water, Wastewater and Drainage",
    sector: "Water; Tunnelling",
    description:
      "Geotechnical and tunnel design for the inner Doha sewer tunnel replacement. Ground investigation interpretation, rock mass characterisation, TBM selection and design, shaft design and dewatering strategy for the dense urban corridor.",
    image: { src: "/assets/projects/Advisory-Photo.jpg", alt: "IDRIS Inner Doha Re-sewerage" },
  },
  {
    _ref: "T6",
    title: "Microtunnels, treatment works and pedestrian subways",
    location: "Qatar and UAE",
    country: "Qatar",
    label: "Team experience",
    category: "Water, Wastewater and Drainage",
    sector: "Water; Tunnelling",
    description:
      "Shallow pedestrian subway design and microtunnelling for utility crossings and treatment works connections. Ground investigation, pipe jacking specifications, dewatering design and construction-phase advice.",
    image: { src: "/assets/projects/Cover-1.jpg", alt: "Microtunnels Qatar UAE" },
  },
  {
    _ref: "T7",
    title: "Sarb artificial islands",
    location: "Abu Dhabi",
    country: "United Arab Emirates",
    label: "Team experience",
    category: "Ports, Marine and Reclamation",
    sector: "Ports, Marine and Reclamation",
    description:
      "Led the geotechnical design of reclaimed artificial islands for offshore oil and gas production facilities in Abu Dhabi. Reclamation design, ground improvement specification, settlement and liquefaction assessment, and quay wall and marine structure foundations.",
    image: { src: "/assets/projects/Yarraman-1.jpg", alt: "Sarb artificial islands Abu Dhabi" },
  },
  {
    _ref: "T8",
    title: "Dubai Water Canal",
    location: "Dubai",
    country: "United Arab Emirates",
    label: "Team experience",
    category: "Ports, Marine and Reclamation",
    sector: "Ports, Marine and Reclamation",
    description:
      "Geotechnical design lead for a 3.2 km waterway extension creating the Dubai Water Canal. Excavation support, dewatering, retaining wall design, bridge foundation design and marine geotechnical assessment along the canal corridor.",
    image: { src: "/assets/projects/Yarraman-3.jpg", alt: "Dubai Water Canal" },
  },
  {
    _ref: "T9",
    title: "Jebel Ali Port and Khalifa Port",
    location: "Dubai and Abu Dhabi",
    country: "United Arab Emirates",
    label: "Team experience",
    category: "Ports, Marine and Reclamation",
    sector: "Ports, Marine and Reclamation",
    description:
      "Led replacement quay wall, reclamation and berth deepening design at Jebel Ali Port and provided geotechnical input to new quay walls and container terminal foundations at Khalifa Port, Abu Dhabi.",
    image: { src: "/assets/projects/WhatsApp-Image-2025-06-12-at-16.20.47_28786926-scaled.jpg", alt: "Jebel Ali Port and Khalifa Port UAE" },
  },
  {
    _ref: "T10",
    title: "Sohar Port bund and reclamation",
    location: "Sohar",
    country: "Oman",
    label: "Team experience",
    category: "Ports, Marine and Reclamation",
    sector: "Ports, Marine and Reclamation",
    description:
      "Led the geotechnical reference design for reclamation and perimeter bund construction at Sohar Industrial Port, Oman. Reclamation fill selection, ground improvement design, bund stability and settlement analysis, and verification testing specification.",
    image: { src: "/assets/projects/WhatsApp-Image-2025-06-12-at-16.20.44_0392bd9b-scaled.jpg", alt: "Sohar Port bund and reclamation Oman" },
  },
  {
    _ref: "T11",
    title: "Dubai Harbour and Mesaieed cruise terminals",
    location: "UAE and Qatar",
    country: "United Arab Emirates",
    label: "Team experience",
    category: "Ports, Marine and Reclamation",
    sector: "Ports, Marine and Reclamation",
    description:
      "Cruise terminal foundations, quay wall design and marine geotechnical assessment at Dubai Harbour. Geotechnical input for port infrastructure at Mesaieed Industrial City, Qatar, including independent design review.",
    image: { src: "/assets/projects/WhatsApp-Image-2023-07-23-at-4.07.08-PM-9-1.jpeg", alt: "Dubai Harbour cruise terminal" },
  },
  {
    _ref: "T12",
    title: "Al Faw Grand Port",
    location: "Al Faw",
    country: "Iraq",
    label: "Team experience",
    category: "Ports, Marine and Reclamation",
    sector: "Ports, Marine and Reclamation",
    description:
      "Geotechnical design from FEED through to detailed design for one of the world's largest port projects on the southern Iraqi coast. Soft ground characterisation, ground improvement design, quay wall and breakwater foundation analysis.",
    image: { src: "/assets/projects/WhatsApp-Image-2023-07-23-at-4.07.09-PM-4-1.jpeg", alt: "Al Faw Grand Port Iraq" },
  },
  {
    _ref: "T13",
    title: "Existing port refurbishment review",
    location: "Abu Dhabi",
    country: "United Arab Emirates",
    label: "Team experience",
    category: "Ports, Marine and Reclamation",
    sector: "Ports, Marine and Reclamation",
    description:
      "Technical review of refurbishment options for existing port structures, including condition assessment of quay walls and marine foundations, structural capacity checks and remediation design recommendations.",
    image: { src: "/assets/projects/g22-1.png", alt: "Port refurbishment review Abu Dhabi" },
  },
  {
    _ref: "T14",
    title: "Sheikh Jaber Al-Ahmad Al-Sabah Causeway",
    location: "Kuwait",
    country: "Kuwait",
    label: "Team experience",
    category: "Roads and Bridges",
    sector: "Roads and Bridges",
    description:
      "Led tender foundation design for the 36 km Sheikh Jaber Causeway linking Kuwait City to Subiyah, the longest marine bridge in the world. Pile design for marine bridge foundations, ground improvement for the artificial island and seismic design for the causeway structures.",
    image: { src: "/assets/projects/Senior-2.jpg", alt: "Sheikh Jaber Causeway Kuwait" },
  },
  {
    _ref: "T15",
    title: "Jazan to Farasan Island causeway",
    location: "Jazan",
    country: "Saudi Arabia",
    label: "Team experience",
    category: "Roads and Bridges",
    sector: "Roads and Bridges",
    description:
      "Geotechnical input to feasibility and detailed design for a causeway connecting Jazan to Farasan Island in the Red Sea, including marine ground investigation, foundation design for bridge piers and seabed preparation for the causeway embankment.",
    image: { src: "/assets/projects/Senior-4.jpg", alt: "Jazan to Farasan Island causeway Saudi Arabia" },
  },
  {
    _ref: "T16",
    title: "Qatar Highway Programme",
    location: "Qatar",
    country: "Qatar",
    label: "Team experience",
    category: "Roads and Bridges",
    sector: "Roads and Bridges",
    description:
      "Lead author of the geotechnical design across a seven-year programme of highway and interchange construction in Qatar. Ground investigation management, earthworks design, bridge and interchange foundation design, and pavement subgrade assessment.",
    image: { src: "/assets/projects/Senior-6.jpg", alt: "Qatar Highway Programme" },
  },
  {
    _ref: "T17",
    title: "Highway interchanges and rock cuts",
    location: "Oman and UAE",
    country: "Oman",
    label: "Team experience",
    category: "Roads and Bridges",
    sector: "Roads and Bridges",
    description:
      "Foundations for 12 interchanges along Oman highway upgrades and rock cut assessment and stabilisation design for road cuttings through the Hajar Mountains, including rockfall risk assessment and slope protection design.",
    image: { src: "/assets/projects/2222.jpeg", alt: "Highway interchanges and rock cuts Oman" },
  },
  {
    _ref: "T18",
    title: "Jebel Jais mountain road",
    location: "Ras Al Khaimah",
    country: "United Arab Emirates",
    label: "Team experience",
    category: "Roads and Bridges",
    sector: "Roads and Bridges",
    description:
      "Inspection and engineering geological mapping of the Jebel Jais mountain road in Ras Al Khaimah. Rock slope assessment, rockfall hazard mapping, stabilisation recommendations and monitoring plan for the UAE's highest road.",
    image: { src: "/assets/projects/Yarraman-9.jpeg", alt: "Jebel Jais mountain road Ras Al Khaimah" },
  },
  {
    _ref: "T19",
    title: "Etihad Museum and Marsa Al Seef",
    location: "Dubai",
    country: "United Arab Emirates",
    label: "Team experience",
    category: "Buildings and Developments",
    sector: "Buildings; Tunnelling",
    description:
      "Deep basement, dewatering and construction support for the Etihad Museum and the adjacent Marsa Al Seef waterfront development on Dubai Creek. Foundation design, secant pile wall design, dewatering strategy and monitoring during construction adjacent to heritage structures.",
    image: { src: "/assets/projects/WhatsApp-Image-2023-07-23-at-4.07.09-PM-4-1.jpeg", alt: "Etihad Museum and Marsa Al Seef Dubai" },
  },
  {
    _ref: "T20",
    title: "New cities and industrial cities programme",
    location: "Saudi Arabia and UAE",
    country: "Saudi Arabia",
    label: "Team experience",
    category: "Buildings and Developments",
    sector: "Buildings; Energy and Utilities",
    description:
      "Site selection and geotechnical assessment for MODON industrial city developments across Saudi Arabia. Master plan geohazard mapping, ground investigation scoping, foundation parameters and earthworks specifications for infrastructure across multiple new city developments.",
    image: { src: "/assets/projects/WhatsApp-Image-2023-07-23-at-4.07.08-PM-8-1.jpeg", alt: "New cities and industrial cities Saudi Arabia" },
  },
  {
    _ref: "T21",
    title: "Das Island accommodation and utilities",
    location: "Das Island, Abu Dhabi",
    country: "United Arab Emirates",
    label: "Team experience",
    category: "Energy and Utilities",
    sector: "Energy and Utilities; Ports, Marine and Reclamation",
    description:
      "Ground investigation and foundation design for offshore accommodation and utility infrastructure on Das Island, an active oil and gas processing island in Abu Dhabi. Marine and island geotechnics, pile design and construction-phase advice.",
    image: { src: "/assets/projects/Yarraman-4.jpg", alt: "Das Island Abu Dhabi" },
  },
  {
    _ref: "T22",
    title: "Qatar Highway Programme earthworks",
    location: "Qatar",
    country: "Qatar",
    label: "Team experience",
    category: "Roads and Bridges",
    sector: "Roads and Bridges",
    description:
      "Geotechnical input to a seven-year programme of highway earthworks in Qatar. Cut and fill design, slope stability, embankment settlement and pavement subgrade assessment across multiple contract packages.",
    image: { src: "/assets/projects/Cover-1.jpg", alt: "Qatar Highway Programme earthworks" },
  },
  {
    _ref: "T23",
    title: "Hamriyah Free Zone fuel pipeline protection",
    location: "Sharjah",
    country: "United Arab Emirates",
    label: "Team experience",
    category: "Energy and Utilities",
    sector: "Energy and Utilities",
    description:
      "Protective works design for fuel pipeline infrastructure within the active Hamriyah Free Zone industrial estate. Assessment of ground loading on existing pipelines from new embankment construction and design of protective slab and monitoring system.",
    image: { src: "/assets/projects/g22-1.png", alt: "Hamriyah Free Zone fuel pipeline Sharjah" },
  },
  {
    _ref: "T24",
    title: "Bridges and interchange foundations",
    location: "Gulf region",
    country: "United Arab Emirates",
    label: "Team experience",
    category: "Roads and Bridges",
    sector: "Roads and Bridges",
    description:
      "Foundation design for highway bridges and interchanges across multiple Gulf projects. Pile design in calcareous rock and sand, spread footing design on cemented caprock, scour assessment for wadi and marine crossings, and seismic design for highway structures.",
    image: { src: "/assets/projects/Plaxis-3D-D.png", alt: "Bridge and interchange foundations Gulf" },
  },
  {
    _ref: "T25",
    title: "Offshore oil and gas structures",
    location: "Red Sea",
    country: "Saudi Arabia",
    label: "Team experience",
    category: "Energy and Utilities",
    sector: "Energy and Utilities",
    description:
      "Structural design of marine and water-retaining structures on the Red Sea coast and offshore oil and gas production facilities. Design to SACS, Eurocode and American codes, including inspection, structural integrity management and rehabilitation of existing offshore structures.",
    image: { src: "/assets/projects/Yarraman-5.jpg", alt: "Offshore oil and gas structures Red Sea" },
  },
  {
    _ref: "T26",
    title: "Mega Reservoir Programme",
    location: "Doha",
    country: "Qatar",
    label: "Team experience",
    category: "Water, Wastewater and Drainage",
    sector: "Water; Buildings",
    description:
      "Geotechnical design for large-diameter water storage reservoirs in Doha as part of Qatar's national water security programme. Foundation design, ground improvement, settlement analysis and construction-phase geotechnical monitoring.",
    image: { src: "/assets/projects/WhatsApp-Image-2025-06-12-at-16.20.44_0392bd9b-scaled.jpg", alt: "Mega Reservoir Programme Doha Qatar" },
  },
];

export const projects: Project[] = baseProjects.map((project) => ({
  ...project,
  ...siteContent.projects?.[slugify(project.title)],
}));

export const projectCategories: ProjectCategory[] = [
  "Rail and Metro",
  "Water, Wastewater and Drainage",
  "Tunnelling and Underground",
  "Roads and Bridges",
  "Ports, Marine and Reclamation",
  "Buildings and Developments",
  "Energy and Utilities",
  "Investigation and Forensics",
];

/** Convenience filter helpers */
export const geoporteCommissions = baseProjects.filter(p => p.label === "Geoporte commission");
export const teamExperience = baseProjects.filter(p => p.label === "Team experience");

/** Distinct country count across all projects — derived from the real project
 * list rather than hand-coded so it stays in sync automatically. */
export const experienceCountryCount = new Set(
  baseProjects.map((p) => p.country.split(" and ")).flat()
).size;
