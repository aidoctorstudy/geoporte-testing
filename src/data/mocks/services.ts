/**
 * Geoporte's eight service lines — real content sourced from geoporte.com.au,
 * expanded for the detail pages. `sceneTheme` names the tailored 3D scene
 * concept each service page's hero should run (see `components/scene/`).
 */

export interface ServiceCapabilityGroup {
  heading: string;
  items: string[];
}

export interface ServiceSubService {
  title: string;
  description: string;
}

export interface ServiceStat {
  value: number;
  /** Appended after the number, e.g. "+" or "%". Defaults to "+" (matches
   * `StatCounter`'s own default) when omitted. */
  suffix?: string;
  /** Prepended before the number, e.g. "$" for "$2B+ project value managed". */
  prefix?: string;
  label: string;
}

export type ServiceSceneTheme =
  | "golden-parthenon"
  | "aether-flux"
  | "solaris"
  | "einstein-rosen-lattice"
  | "negentropy"
  | "schedule-network-graph"
  | "advisory-lifecycle-network"
  | "telecom-signal-network";

// Themes whose scene mounts as a fixed, page-wide background instead of a
// section-scoped hero (see `AetherFluxBackground.tsx`/`SolarisBackground.tsx`/
// `EinsteinRosenLatticeBackground.tsx`/`GoldenParthenonBackground.tsx`/
// `NegentropyBackground.tsx`/`ProjectControlBackground.tsx`/
// `AureoleBackground.tsx`/`SpiralGalaxyBackground.tsx`) — dense/bright
// enough (or, for `schedule-network-graph`, backed by a video rather than a
// WebGL scene at all) that plain text-on-gradient loses contrast, so
// `ServiceHero.tsx` swaps in a frosted glass band and every content section
// on that page (`service-detail.tsx`) swaps its opaque background for the
// `.glass-panel` treatment. One shared Set so the two files can't drift.
//
// Geotechnical Engineering keeps `solaris` here (full-page fixed
// background, unchanged) — but its *hero section* no longer goes through
// `ServiceHero.tsx`'s glass branch. `service-detail.tsx` special-cases this
// slug to render the bespoke `GeotechnicalAnalysisHero.tsx` instead, which
// mounts a second, bounded 3D scene (`build-geotechnical-fea-scene.ts`, a
// PLAXIS-inspired FE model) inside the hero on top of the Solaris
// background — both visible together, per explicit user direction. See
// ADR-0061.
export const GLASS_SCENE_THEMES: ReadonlySet<ServiceSceneTheme> = new Set([
  "solaris",
  "aether-flux",
  "einstein-rosen-lattice",
  "golden-parthenon",
  "negentropy",
  "schedule-network-graph",
  "advisory-lifecycle-network",
  "telecom-signal-network",
]);
export const isGlassSceneTheme = (theme: ServiceSceneTheme): boolean => GLASS_SCENE_THEMES.has(theme);

export interface Service {
  slug: string;
  title: string;
  shortDescription: string;
  overview: string;
  sceneTheme: ServiceSceneTheme;
  sceneSummary: string;
  capabilityGroups: ServiceCapabilityGroup[];
  subServices?: ServiceSubService[];
  /** The 3 headline stats shown on the detail page's overview section. */
  stats: ServiceStat[];
  /** The 5-6 step "how we work" process timeline, in order. */
  processSteps: string[];
  /** Exactly 6 cards for the detail page's sub-services grid — distinct from
   * (and a shorter, page-facing complement to) `subServices`/`capabilityGroups`
   * above, which stay as the deeper, previously-sourced content folded into
   * the overview section instead. */
  subServiceGrid: ServiceSubService[];
}

export const services: Service[] = [
  {
    slug: "civil-engineering",
    title: "Civil Engineering",
    shortDescription:
      "Designs focused on functionality, constructability, safety and economy.",
    overview:
      "Geoporte's Civil Design team collaborates with clients, architects, contractors and government entities to deliver designs that emphasise functionality, constructability and well-planning — without compromising safety or economic efficiency. The team brings extensive experience across transport, water and building infrastructure projects.",
    sceneTheme: "golden-parthenon",
    sceneSummary:
      "A classical temple at golden hour — sun-warmed stone colonnade against a dusk sky, drifting dust motes catching the light, the sun itself following the cursor across the horizon as it sweeps.",
    capabilityGroups: [
      {
        heading: "Design & Planning",
        items: [
          "Conceptual design — preliminary layouts and renderings",
          "Detailed design — comprehensive drawings and specifications",
          "3D modelling of structures and systems",
          "Site planning and grading optimisation",
          "Construction documentation packages",
        ],
      },
      {
        heading: "Civil Infrastructure",
        items: [
          "Temporary works design",
          "Earthworks and road formations",
          "Roadworks and pavement design",
          "Footpath and cycleway design",
          "Underground stormwater systems",
          "Cross drainage culverts and floodways",
          "Waterway rehabilitation design",
          "Dams, levees and retaining structures",
          "Stormwater drainage and detention basins",
          "Water and sewer reticulation",
          "Utilities and wastewater design",
        ],
      },
      {
        heading: "Specialised Work",
        items: [
          "Signage and line markings",
          "Creek diversion design",
          "Hardstand infrastructure pads",
          "Sediment and erosion control",
          "Hydraulic network modelling",
          "Rail infrastructure design",
        ],
      },
    ],
    stats: [
      { value: 15, label: "Road projects" },
      { value: 8, label: "Bridges" },
      { value: 3, suffix: "", label: "Countries" },
    ],
    processSteps: [
      "Brief",
      "Site Investigation",
      "Concept Design",
      "Detailed Design",
      "Construction Support",
      "As-Built",
    ],
    subServiceGrid: [
      {
        title: "Road & Highway Design",
        description:
          "Geometric design, pavement structure and intersection layouts for new and upgraded road corridors.",
      },
      {
        title: "Bridge Engineering",
        description:
          "Concept through detailed design of bridge structures, from simple culverts to multi-span crossings.",
      },
      {
        title: "Pavement Design",
        description:
          "Flexible and rigid pavement design compliant with Austroads and local road authority standards.",
      },
      {
        title: "Traffic & Transport Planning",
        description:
          "Traffic modelling, intersection analysis and transport network planning to support development approvals.",
      },
      {
        title: "Civil Infrastructure",
        description:
          "Water, sewer and utility reticulation design integrated with the broader civil works package.",
      },
      {
        title: "Drainage Design",
        description:
          "Stormwater drainage networks and detention systems sized to manage runoff at the source.",
      },
    ],
  },
  {
    slug: "design-and-drafting",
    title: "Design & Drafting",
    shortDescription:
      "Comprehensive civil engineering design solutions using cutting-edge technology.",
    overview:
      "High-quality design and drafting services that adhere to industry standards and best practice. The team pairs experienced civil engineers with CAD specialists, working in industry-leading software — AutoCAD, Civil 3D and Revit — to deliver precise, coordinated documentation as an extension of the client's own project team.",
    sceneTheme: "aether-flux",
    sceneSummary:
      "A slowly turning cube of brushed-platinum drafting rods, each one orienting itself along a swirling flow field — the cursor parts them into a soft pocket and curls them into a vortex, a click sends an expanding ring that lengthens and ignites the rods it passes.",
    capabilityGroups: [
      {
        heading: "Services Offered",
        items: [
          "Conceptual design — preliminary layouts, sketches and renderings",
          "Detailed design — comprehensive drawings for site development, transportation, utilities and infrastructure",
          "3D modelling — three-dimensional visualisations identifying potential design conflicts",
          "Site planning and grading — layout optimisation and earthwork calculations",
          "Construction documentation — construction drawings, quantity takeoffs and material specifications",
        ],
      },
      {
        heading: "How we work",
        items: [
          "Industry-leading CAD software — AutoCAD, Civil 3D & Revit",
          "Rigorous review processes for accuracy and compliance",
          "Collaborative method — direct alignment with clients and stakeholders",
          "A One Team approach — Geoporte as an extension of your project team",
        ],
      },
    ],
    stats: [
      { value: 500, label: "Drawings delivered" },
      { value: 8, suffix: "", label: "Disciplines covered" },
      { value: 100, suffix: "%", label: "Digital workflow" },
    ],
    processSteps: [
      "Design Brief",
      "Concept Sketches",
      "CAD Development",
      "Review",
      "Final Drawings",
      "Revisions",
    ],
    subServiceGrid: [
      {
        title: "2D CAD Drafting",
        description:
          "Precise, coordinated 2D drawings produced in AutoCAD and Civil 3D to construction-ready standard.",
      },
      {
        title: "3D BIM Modelling",
        description:
          "Federated 3D models in Revit that catch clashes and coordination issues before they reach site.",
      },
      {
        title: "As-Built Documentation",
        description:
          "Accurate as-constructed drawings capturing what was actually built against the design intent.",
      },
      {
        title: "Shop Drawings",
        description:
          "Fabrication-level detail drawings for contractors and manufacturers to build directly from.",
      },
      {
        title: "Coordination Drawings",
        description:
          "Multi-discipline overlay drawings resolving clashes between structural, civil and services.",
      },
      {
        title: "Specification Writing",
        description:
          "Technical specifications that translate design intent into enforceable contract documentation.",
      },
    ],
  },
  {
    slug: "geotechnical-engineering",
    title: "Geotechnical Engineering",
    shortDescription:
      "Full-service solutions for planning and design challenges beneath the ground.",
    overview:
      "Geoporte's geotechnical practice is the deepest bench in the firm — full-service solutions across site investigation, ground behaviour, foundation design and slope stabilisation, applied to some of the region's most technically demanding infrastructure. This is the discipline the Geoporte digital twin was built to show: what lies beneath the project.",
    sceneTheme: "solaris",
    sceneSummary:
      "A breathing navy-to-azure particle sun as the page's full-page background, with a bounded finite-element geotechnical model layered on top of it inside the hero: six geological strata cut away around a deep excavation with retaining walls, a piled foundation and a tunnel bore, a graded FE mesh denser around every structural element, toggleable deformation and analysis-result contours, a 6-stage construction sequence, and a clamped orbit camera.",
    capabilityGroups: [
      {
        heading: "Ground engineering",
        items: [
          "Slope Stability Assessment & Stabilisation Design",
          "Retention Systems — sheet piled walls, diaphragm walls, bored pile walls, gravity retaining walls",
          "Earthworks Design",
          "Ground Improvement Design — dynamic compaction, vibrocompaction, vibro-replacement, surcharging",
          "Ground Settlement (Static and Seismic)",
        ],
      },
      {
        heading: "Investigation & analysis",
        items: [
          "Site Investigation Planning and Reporting — drilling, soil sampling, laboratory testing, test pitting",
          "Numerical Modelling — state-of-the-art numerical analysis for complex geotechnical problems",
          "Seismic Hazard Analyses and Earthquake Geotechnical Design",
          "Desktop Studies and Geohazard Geotechnical Assessment",
          "Forensic Geotechnical Engineering — investigating settlement, expansive soil and lateral movement failures",
        ],
      },
      {
        heading: "Infrastructure-specific design",
        items: [
          "Proof Engineering Services of Geotechnical Design",
          "Reclamation Works Design",
          "Road Subgrade Assessment and Design",
          "Temporary Works Design",
          "Pipelines — impact assessment of loads on existing pipelines",
          "Pavement Profile Design — Austroads Guide to Pavement Technology, VicRoads compliant",
        ],
      },
    ],
    subServices: [
      {
        title: "Proof Engineering Services of Geotechnical Design",
        description:
          "Independent verification of geotechnical design against the governing standards before construction proceeds.",
      },
      {
        title: "Slope Stability Assessment & Stabilization Design",
        description:
          "Assessing natural and engineered slopes and designing stabilisation works where the factor of safety falls short.",
      },
      {
        title: "Reclamation Works Design",
        description: "Engineering design for land reclamation projects.",
      },
      {
        title: "Road Subgrade Assessment and Design",
        description:
          "Characterising subgrade conditions to inform pavement and formation design.",
      },
      {
        title: "Temporary Works Design",
        description:
          "Many construction sites need temporary works in order to facilitate permanent works.",
      },
      {
        title: "Retention Systems",
        description:
          "Design of sheet piled walls, diaphragm walls, bored pile walls and gravity retaining walls.",
      },
      {
        title: "Earthworks Design",
        description:
          "Sites may contain natural or man-made constraints to development — earthworks design resolves them.",
      },
      {
        title: "Pipelines",
        description:
          "Impact assessment of loads on existing pipelines from nearby works.",
      },
      {
        title: "Ground Settlement (Static and Seismic)",
        description:
          "Settlement is the vertical movement of the ground — assessed under both static and seismic loading.",
      },
      {
        title: "Ground Improvement Design",
        description:
          "Dynamic compaction, vibrocompaction, vibro-replacement and surcharging.",
      },
      {
        title: "Seismic Hazard Analyses and Earthquake Geotechnical Design",
        description:
          "Site-specific seismic hazard characterisation and earthquake-resistant geotechnical design.",
      },
      {
        title: "Site Investigation Planning and Reporting",
        description:
          "Drilling, soil sampling, laboratory testing and test pitting, planned and reported to support design.",
      },
      {
        title: "Forensic Geotechnical Engineering",
        description:
          "Investigating settlement of structures, expansive soil and lateral movement failures.",
      },
      {
        title: "Numerical Modelling",
        description:
          "State-of-the-art numerical analysis for complex geotechnical problems.",
      },
      {
        title: "Pavement Profile Design",
        description:
          "Compliant with the Austroads Guide to Pavement Technology and VicRoads standards.",
      },
      {
        title: "Desktop Studies and Geohazard Geotechnical Assessment",
        description:
          "Feasibility studies, site reconnaissance and geohazard evaluation ahead of investment.",
      },
    ],
    stats: [
      { value: 200, label: "Boreholes supervised" },
      { value: 50, label: "Site investigations" },
      { value: 7, suffix: "", label: "Countries" },
    ],
    processSteps: [
      "Desk Study",
      "Field Investigation",
      "Lab Testing",
      "Analysis",
      "Report",
      "Design Recommendations",
    ],
    subServiceGrid: [
      {
        title: "Site Investigations",
        description:
          "Drilling, sampling and in-situ testing programs planned and supervised to characterise ground conditions.",
      },
      {
        title: "Laboratory Testing",
        description:
          "Soil and rock testing to determine the engineering properties driving foundation and earthworks design.",
      },
      {
        title: "Foundation Design",
        description:
          "Shallow and deep foundation design matched to the ground conditions and structural loads.",
      },
      {
        title: "Slope Stability Analysis",
        description:
          "Assessing natural and engineered slopes and designing stabilisation where the factor of safety falls short.",
      },
      {
        title: "Ground Improvement",
        description:
          "Dynamic compaction, vibro-replacement and surcharging design to strengthen weak or variable ground.",
      },
      {
        title: "Retaining Wall Design",
        description:
          "Sheet piled, diaphragm, bored pile and gravity retaining wall design for permanent and temporary works.",
      },
    ],
  },
  {
    slug: "structural-engineering",
    title: "Structural Engineering",
    shortDescription:
      "Cost-effective solutions to the latest standards and codes.",
    overview:
      "Customised, cost-effective structural engineering solutions for the civil infrastructure sector, combining local and international expertise to meet current standards without compromising delivery efficiency. Geoporte works a One Team approach — collaborating directly with clients to develop tailored structural solutions across site development, transportation, utilities and infrastructure.",
    sceneTheme: "einstein-rosen-lattice",
    sceneSummary:
      "A platinum lattice wormhole funnelling down to a glowing throat — warm gold at the mouth, cold sapphire at the flaring rim, its meridian wireframe breathing and drifting as the structure slowly spins.",
    capabilityGroups: [
      {
        heading: "Core capabilities",
        items: [
          "Conceptual Design — preliminary layouts, sketches and renderings",
          "Detailed Design — comprehensive drawings, plans and specifications",
          "3D Modelling — detailed models enabling visualisation and clash detection",
          "Site Planning and Grading — layout optimisation, earthwork calculations and drainage design",
          "Construction Documentation — construction drawings, quantity takeoffs and material specifications",
        ],
      },
    ],
    stats: [
      { value: 100, label: "Structures designed" },
      { value: 30, label: "Years combined experience" },
      { value: 0, suffix: "", label: "Structural failures" },
    ],
    processSteps: [
      "Architectural Brief",
      "Structural Concept",
      "Analysis & Design",
      "Documentation",
      "Construction Support",
    ],
    subServiceGrid: [
      {
        title: "Building Structural Design",
        description:
          "Structural systems for new buildings, from concept framing through detailed documentation.",
      },
      {
        title: "Industrial Structures",
        description:
          "Structural design for industrial facilities, plant support structures and heavy equipment foundations.",
      },
      {
        title: "Retaining Structures",
        description:
          "Structural design of retaining walls and earth-retention systems coordinated with the geotechnical model.",
      },
      {
        title: "Facade Engineering",
        description:
          "Structural support systems for building facades, glazing and cladding.",
      },
      {
        title: "Structural Assessments",
        description:
          "Condition assessments and capacity checks of existing structures against current loading codes.",
      },
      {
        title: "Peer Review",
        description:
          "Independent structural design review providing assurance before construction proceeds.",
      },
    ],
  },
  {
    slug: "stormwater-and-flood-modelling",
    title: "Stormwater & Flood Modelling",
    shortDescription: "Innovative risk management through technical expertise.",
    overview:
      "Helping clients effectively manage stormwater and flood risk through innovative solutions, technical expertise and current modelling technology — hydrological, hydraulic and GIS-based approaches, backed by clear regulatory navigation and sophisticated data visualisation.",
    sceneTheme: "negentropy",
    sceneSummary:
      "A drifting field of luminous particles — a spiral web resolving into strands of light, an orbiting molecule cage, a swirling green storm, a counter-spinning hourglass galaxy — flown through with the scroll as a single cursor-reactive composition.",
    capabilityGroups: [
      {
        heading: "Core competencies",
        items: [
          "Advanced modelling techniques — hydrological, hydraulic and GIS-based simulation of runoff, inundation and drainage",
          "Risk assessment and mitigation — evaluating flooding impacts and resilience strategies",
          "Customised solutions aligned to project goals, regulatory demands and budget",
          "Regulatory compliance across multiple jurisdictions",
          "Data analysis and visualisation of complex hydraulic datasets",
        ],
      },
      {
        heading: "Specific services",
        items: [
          "Flood Hazard Mapping",
          "Stormwater Management Plans",
          "Hydraulic Modelling",
          "Climate Change Adaptation",
          "Emergency Response Planning",
        ],
      },
    ],
    stats: [
      { value: 80, label: "Flood studies" },
      { value: 5, suffix: "", label: "Software platforms" },
      { value: 3, suffix: "", label: "Countries" },
    ],
    processSteps: [
      "Catchment Analysis",
      "Hydrological Modelling",
      "Hydraulic Modelling",
      "Risk Assessment",
      "Design",
      "Reporting",
    ],
    subServiceGrid: [
      {
        title: "Stormwater Management Plans",
        description:
          "Catchment-wide stormwater strategies balancing flood risk, water quality and development yield.",
      },
      {
        title: "Flood Risk Assessment",
        description:
          "Flood extent, depth and hazard mapping to inform planning, design and emergency response.",
      },
      {
        title: "Drainage Network Design",
        description:
          "Underground stormwater network design sized against current design storm standards.",
      },
      {
        title: "MUSIC Modelling",
        description:
          "Water quality treatment train modelling using the MUSIC platform to meet stormwater quality targets.",
      },
      {
        title: "TUFLOW/HEC-RAS Modelling",
        description:
          "2D/1D hydraulic modelling of catchments and waterways using industry-standard TUFLOW and HEC-RAS platforms.",
      },
      {
        title: "Water Sensitive Urban Design",
        description:
          "Integrated stormwater treatment and reuse design embedded into the urban landscape.",
      },
    ],
  },
  {
    slug: "project-control-services",
    title: "Project Control Services",
    shortDescription: "Performance optimisation, risk mitigation, timely delivery.",
    overview:
      "Integrated project controls across scheduling, cost management, risk assessment and quality control — optimising project performance, mitigating risk, and ensuring timely, cost-effective delivery through accurate forecasting and transparent stakeholder reporting.",
    sceneTheme: "schedule-network-graph",
    sceneSummary:
      "A looping silhouette video backdrop (GetLayers' \"Siloutte\"), muted and full-bleed behind every section, rather than the WebGL Gantt-bar field the theme name still refers to.",
    capabilityGroups: [
      {
        heading: "Planning & scheduling",
        items: [
          "Baseline schedule preparation (Primavera P6)",
          "Regular schedule updates and dashboard/monthly reporting",
          "Cost and resource loading",
          "Extension of Time claims assessment",
        ],
      },
      {
        heading: "Cost management",
        items: [
          "Cost Breakdown Structure development",
          "Baseline cost preparation",
          "Cashflow generation",
          "Cost tracking at agreed intervals",
        ],
      },
      {
        heading: "Earned value management",
        items: ["S-Curve generation", "Schedule and Cost Performance Indices (SPI/CPI)"],
      },
      {
        heading: "Additional offerings",
        items: [
          "Risk identification and mitigation strategy development",
          "Change control process implementation",
          "Quality assurance and compliance oversight",
        ],
      },
    ],
    stats: [
      { value: 50, label: "Projects controlled" },
      { value: 2, prefix: "$", suffix: "B+", label: "Project value managed" },
      { value: 99, suffix: "%", label: "On-time delivery" },
    ],
    processSteps: [
      "Project Setup",
      "Baseline Schedule",
      "Monitoring",
      "Reporting",
      "Change Control",
      "Closeout",
    ],
    subServiceGrid: [
      {
        title: "Project Scheduling",
        description:
          "Baseline and progressively updated project schedules built in Primavera P6.",
      },
      {
        title: "Cost Management",
        description:
          "Cost breakdown structures, baseline budgets and ongoing cost tracking against approved scope.",
      },
      {
        title: "Risk Management",
        description:
          "Structured risk identification, assessment and mitigation planning across the project lifecycle.",
      },
      {
        title: "Change Management",
        description:
          "Formal change control processes keeping scope, cost and schedule impacts visible and approved.",
      },
      {
        title: "Progress Reporting",
        description:
          "Regular dashboard and narrative reporting keeping stakeholders aligned on project status.",
      },
      {
        title: "Earned Value Analysis",
        description:
          "S-curve generation and schedule/cost performance indices tracking delivery against baseline.",
      },
    ],
  },
  {
    slug: "advisory-services",
    title: "Advisory Services",
    shortDescription: "A collaborative partnership approach to geotechnical challenges.",
    overview:
      "Geoporte's value lies in highly experienced staff who understand geotechnical challenges, operating through an open, collaborative partnership approach — creating innovative, practical solutions that save clients time and money across every project phase.",
    sceneTheme: "advisory-lifecycle-network",
    sceneSummary:
      "A golden particle corona — tens of thousands of motes erupting from a dark hollow core along sixteen irregular spokes, drifting outward and dissipating, the cursor dragging a directional solar flare across the field and every click spawning another shockwave ring.",
    capabilityGroups: [
      {
        heading: "Core advisory capabilities",
        items: [
          "Project Planning & Feasibility — thorough viability assessments",
          "Design & Engineering — roads, bridges, buildings, water systems and treatment facilities",
          "Risk Management — identifying challenges and mitigation strategies",
          "Transportation Planning — road, rail and transit connectivity",
          "Regulatory Compliance — permitting requirements and standards",
          "Construction Management — scheduling, budgeting, quality and safety oversight",
          "Geotechnical & Foundation Engineering — soil mechanics and subsurface investigation",
          "Asset Management — optimising infrastructure performance through maintenance strategy",
        ],
      },
    ],
    stats: [
      { value: 7, suffix: "", label: "Countries" },
      { value: 27, label: "Landmark projects" },
      { value: 15, label: "Years experience" },
    ],
    processSteps: [
      "Scope Definition",
      "Data Gathering",
      "Analysis",
      "Expert Review",
      "Report",
      "Presentation",
    ],
    subServiceGrid: [
      {
        title: "Technical Due Diligence",
        description:
          "Independent technical assessment of engineering risk ahead of acquisition or investment decisions.",
      },
      {
        title: "Expert Witness",
        description:
          "Independent expert opinion and reporting to support dispute resolution and litigation.",
      },
      {
        title: "Peer Review",
        description:
          "Independent review of design and analysis, providing assurance before construction proceeds.",
      },
      {
        title: "Feasibility Studies",
        description:
          "Early-stage viability assessment weighing technical, cost and programme considerations.",
      },
      {
        title: "Risk Advisory",
        description:
          "Identifying and advising on engineering and delivery risk across the project lifecycle.",
      },
      {
        title: "Procurement Advisory",
        description:
          "Guidance on procurement strategy and contractor selection for complex infrastructure delivery.",
      },
    ],
  },
  {
    slug: "telecom-services",
    title: "Telecom Services",
    shortDescription: "Surveys, design, build and testing for mobile communications systems.",
    overview:
      "Surveys, design, build and testing of mobile communications systems across in-building (DAS / Small Cells / Repeaters / Nextivity) and outdoor (Macro / PSN / Small Cells) networks — RF engineering delivered by certified professionals from site survey through commissioning.",
    sceneTheme: "telecom-signal-network",
    sceneSummary:
      "A slowly turning two-arm spiral galaxy — molten-gold core fading into deep-violet dust — diving toward its centre as you scroll, the disc tipping edge-on, drifting atmosphere motes and a cursor-driven void parting the dust.",
    capabilityGroups: [
      {
        heading: "Core competencies",
        items: [
          "In-Building Solutions — RF engineering and DAS design, network surveys and installation",
          "Network Optimisation — performance modifications based on throughput, call quality and failure diagnostics",
          "RF Design Services — cellular, public safety and broadband wireless site analysis and design",
          "Telecom Installation & Commissioning — cellular, microwave, fibre optic and satellite deployment",
        ],
      },
      {
        heading: "Services offered",
        items: [
          "Conceptual Design",
          "Detailed Design",
          "3D Modelling",
          "Site Planning and Grading",
          "Construction Documentation",
        ],
      },
    ],
    stats: [
      { value: 200, label: "Sites surveyed" },
      { value: 5, suffix: "", label: "Telecom providers" },
      { value: 3, suffix: "", label: "Countries" },
    ],
    processSteps: [
      "Site Survey",
      "Structural Assessment",
      "Design",
      "Authority Approval",
      "Construction",
      "Testing & Commissioning",
    ],
    subServiceGrid: [
      {
        title: "Tower Structural Assessment",
        description:
          "Structural capacity assessment of existing towers ahead of new equipment loading.",
      },
      {
        title: "Site Surveys",
        description:
          "Detailed site and structural surveys supporting telecom design and approvals.",
      },
      {
        title: "RF Planning Support",
        description:
          "Engineering support for RF coverage planning across macro, small cell and in-building networks.",
      },
      {
        title: "Construction Management",
        description:
          "On-site construction oversight through installation, testing and commissioning.",
      },
      {
        title: "As-Built Documentation",
        description:
          "Accurate as-constructed records of installed telecom infrastructure.",
      },
      {
        title: "Compliance Reporting",
        description:
          "Documentation and reporting to meet carrier and regulatory compliance requirements.",
      },
    ],
  },
];

export const getServiceBySlug = (slug: string): Service | undefined =>
  services.find((service) => service.slug === slug);
