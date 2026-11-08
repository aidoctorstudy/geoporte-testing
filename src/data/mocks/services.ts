/**
 * Geoporte service lines for www.geoporte.ae.
 *
 * Source: Geoporte ME Website Content and Build Brief, Rev 0,
 * 2 November 2026, Sections 7.0–7.10.
 *
 * Nine services replace the AU/NZ service set. Telecom Services,
 * Design & Drafting and Project Control Services are removed.
 *
 * `services` (the export every consumer uses) is `baseServices` merged
 * with any /admin-edited overrides in `content.json`, keyed by `slug` —
 * see `content-overrides.ts`. `slug` itself is never overridable, so the
 * key never drifts.
 */
import { siteContent } from "@/lib/content-overrides";

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
  /** Appended after the number, e.g. "+" or "%". Defaults to "+" when omitted. */
  suffix?: string;
  /** Prepended before the number, e.g. "$". */
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

export const GLASS_SCENE_THEMES: ReadonlySet<ServiceSceneTheme> = new Set([
  "aether-flux",
  "einstein-rosen-lattice",
  "negentropy",
  "schedule-network-graph",
]);

export const isGlassSceneTheme = (theme: ServiceSceneTheme): boolean =>
  GLASS_SCENE_THEMES.has(theme);

export interface Service {
  slug: string;
  title: string;
  shortDescription: string;
  overview: string;
  sceneTheme: ServiceSceneTheme;
  sceneSummary: string;
  capabilityGroups: ServiceCapabilityGroup[];
  subServices?: ServiceSubService[];
  stats: ServiceStat[];
  processSteps: string[];
  subServiceGrid: ServiceSubService[];
}

const baseServices: Service[] = [
  {
    slug: "ground-investigation",
    title: "Ground investigation and geohazard assessment",
    shortDescription:
      "Scope, supervise and interpret investigations that answer the design questions that matter.",
    overview:
      "Most cost and programme overruns on Gulf projects trace back to the ground. We scope investigations around the design questions that matter, then turn the results into a defensible ground model and design parameters. Gulf ground changes quickly: sabkha and shallow saline groundwater, calcareous sands and reclaimed fills, cemented caprock over weaker layers, karstic limestone with cavities, and collapsible or expansive soils. Aggressive groundwater affects concrete and steel durability and must be tested and reported.",
    sceneTheme: "solaris",
    sceneSummary: "Subsurface ground model — boreholes, strata and groundwater across the Gulf profile.",
    capabilityGroups: [
      {
        heading: "What we deliver",
        items: [
          "Desk studies, site reconnaissance and geohazard mapping: sabkha, karst and cavities, collapsible and expansive soils, wadi and flood exposure",
          "Investigation scoping and specification: borehole spacing and depth, in-situ testing (SPT, CPT, pressuremeter, plate load, geophysics) and laboratory schedules matched to the structure and the risk",
          "Supervision and logging, contractor coordination and quality checks",
          "Factual and interpretive reports, ground models and characteristic design parameters",
          "Geotechnical baseline reports for tunnelling and major earthworks contracts",
        ],
      },
      {
        heading: "Gulf considerations",
        items: [
          "Sabkha and shallow saline groundwater",
          "Calcareous sands and reclaimed fills: CPT correlations must be adjusted",
          "Cemented caprock over weaker layers",
          "Karstic limestone with cavities",
          "Collapsible and expansive soils in arid terrain",
          "Aggressive groundwater: concrete and steel durability testing",
        ],
      },
    ],
    stats: [
      { value: 25, suffix: "+", label: "Years Gulf investigation experience" },
      { value: 7, suffix: "+", label: "Countries active" },
      { value: 8, suffix: "", label: "Senior specialists" },
    ],
    processSteps: [
      "Desk study and geohazard mapping",
      "Scope and specification",
      "Supervision and QA",
      "Factual reporting",
      "Interpretive report and ground model",
      "Design parameters",
    ],
    subServiceGrid: [
      { title: "Desk studies", description: "Review of available data, mapping and geohazard screening before mobilisation." },
      { title: "Geohazard mapping", description: "Sabkha, karst, collapsible soils and wadi flood risk mapped against the alignment or footprint." },
      { title: "Investigation scoping", description: "Borehole layout, in-situ testing schedule and laboratory programme matched to the structure and risk." },
      { title: "Site supervision", description: "Logging, contractor coordination and quality checks during fieldwork." },
      { title: "Factual reporting", description: "Factual borehole logs, test results and groundwater observations." },
      { title: "Ground models", description: "Interpretive report, design parameter selection and geotechnical baseline reports." },
    ],
  },
  {
    slug: "geotechnical-design",
    title: "Geotechnical design: foundations, retaining structures, earthworks and slopes",
    shortDescription:
      "Concept, tender and detailed design matched to Gulf ground conditions and regional authority requirements.",
    overview:
      "Concept, tender and detailed geotechnical design for buildings, transport, marine and utility infrastructure, matched to the ground conditions, the structural loads and the way the contractor will build it. We design to SBC 303 in the Kingdom, QCS and QHDM in Qatar, and Dubai Municipality and Abu Dhabi authority requirements in the UAE, alongside Eurocode 7, BS and AASHTO. Durability in saline groundwater, settlement of carbonate fills and seismic design of reclaimed land are routine considerations, not afterthoughts.",
    sceneTheme: "golden-parthenon",
    sceneSummary: "Foundation geometry and soil-structure interaction beneath a typical Gulf tower.",
    capabilityGroups: [
      {
        heading: "What we deliver",
        items: [
          "Shallow foundations, piled foundations and piled rafts, including pile springs and settlement for the structural model",
          "Deep basements and excavation support: secant and contiguous pile walls, diaphragm walls, anchors and struts, dewatering",
          "Retaining structures: blockwork and gravity walls, sheet pile walls, reinforced soil and MSE walls",
          "Earthworks design, cut and fill optimisation, embankments on soft ground, working platforms",
          "Rock slope and cutting design: rock mass characterisation, rockfall assessment, bolting, mesh and drainage",
          "Seismic site response and liquefaction assessment",
          "Pavement subgrade assessment and design parameters for heavy-duty and highway pavements",
        ],
      },
    ],
    stats: [
      { value: 25, suffix: "+", label: "Years Gulf design experience" },
      { value: 90, suffix: "+", label: "Structures designed and checked" },
      { value: 7, suffix: "+", label: "GCC countries" },
    ],
    processSteps: [
      "Brief and ground model review",
      "Concept design and options",
      "Tender design and specification",
      "Detailed design and calculations",
      "Drawing issue and authority submission",
      "Construction support",
    ],
    subServiceGrid: [
      { title: "Piled rafts and deep foundations", description: "Pile spring derivation and settlement analysis for the structural model." },
      { title: "Basement excavation support", description: "Secant and diaphragm wall design, anchors, struts and dewatering." },
      { title: "Retaining and MSE walls", description: "Gravity, blockwork, sheet pile and mechanically stabilised earth wall design." },
      { title: "Earthworks", description: "Cut and fill, embankments on soft ground and working platform design." },
      { title: "Rock slopes", description: "Rock mass characterisation, rockfall risk and stabilisation design." },
      { title: "Seismic design", description: "Site response, liquefaction assessment and seismic design parameters." },
    ],
  },
  {
    slug: "tunnelling-underground",
    title: "Tunnelling and underground structures",
    shortDescription:
      "TBM and microtunnel design, shafts, dewatering and impact assessment from the Gulf's metro corridors to utility crossings.",
    overview:
      "Our senior specialists have designed some of the region's largest underground systems, from metro tunnels and stations to the deepest sewer shafts in the Gulf. We bring the same discipline to shafts, microtunnels and pipe jacking for utilities and stormwater. Tunnels in the Gulf pass through variable limestone, weathered rock and soil, often below shallow saline groundwater and close to dense utility corridors. Impact on live assets is usually the governing design case.",
    sceneTheme: "einstein-rosen-lattice",
    sceneSummary: "TBM drive and shaft cross-section through Gulf limestone and weathered rock.",
    capabilityGroups: [
      {
        heading: "What we deliver",
        items: [
          "Tunnelling method selection and multi-criteria analysis (TBM, microtunnelling, pipe jacking, HDD, open cut)",
          "Shaft design: secant pile, diaphragm wall and caisson shafts, base stability and uplift",
          "Ground movement assessment: settlement troughs for a range of volume loss cases and building and utility damage assessment",
          "Dewatering strategy and groundwater control",
          "Performance specifications for secant piles, dewatering, pipe jacking and monitoring",
          "Tender support and construction phase advice to tunnelling contractors",
        ],
      },
    ],
    stats: [
      { value: 100, suffix: "+", label: "km of tunnel designed" },
      { value: 12, suffix: "", label: "Years heading a Gulf tunnels team" },
      { value: 5, suffix: "+", label: "Deep metro programmes" },
    ],
    processSteps: [
      "Ground model and geohazard review",
      "Method selection and feasibility",
      "Tender design and performance spec",
      "Detailed shaft and lining design",
      "Construction phase advice",
      "Monitoring interpretation",
    ],
    subServiceGrid: [
      { title: "TBM drive design", description: "Ground model, TBM selection, face pressure and tail void grouting specifications." },
      { title: "Shaft design", description: "Secant pile, diaphragm wall and caisson shaft design for depths up to 100 m." },
      { title: "Microtunnelling", description: "Pipe jacking, HDD and microtunnel design for utility and stormwater crossings." },
      { title: "Ground movement", description: "Settlement trough prediction, building damage assessment and utility impact." },
      { title: "Dewatering", description: "Groundwater control strategy, well design and drawdown impact assessment." },
      { title: "Performance specifications", description: "Specifications for secant piles, dewatering, pipe jacking and monitoring." },
    ],
  },
  {
    slug: "numerical-modelling",
    title: "Numerical modelling and soil-structure interaction",
    shortDescription:
      "Advanced PLAXIS 2D and 3D modelling applied with practical construction judgement.",
    overview:
      "Advanced analysis is only as good as the ground model behind it. We build independent ground models from first principles, calibrate them against site behaviour, and use finite element analysis where it changes the decision. Riyadh's mixed limestone, weathered rock and soil profiles, and reworked carbonate fills along the coast, punish generic parameters. Our models are checked against observed behaviour before they are relied on for design or for protecting a live asset.",
    sceneTheme: "aether-flux",
    sceneSummary: "Finite element mesh of a staged excavation in variable Gulf stratigraphy.",
    capabilityGroups: [
      {
        heading: "What we deliver",
        items: [
          "PLAXIS 2D and 3D staged construction modelling of excavations, shafts, tunnels, embankments and slopes",
          "Piled raft and pile group soil-structure interaction, upper and lower bound pile springs for the structural model",
          "Seismic and dynamic analysis, site response and liquefaction",
          "Back-analysis of measured movements to calibrate parameters",
          "Software proficiency: PLAXIS, GeoStudio, FLAC, UDEC, Midas GTS NX, ABAQUS, LPile, DeepSoil and the Rocscience suite",
        ],
      },
    ],
    stats: [
      { value: 200, suffix: "+", label: "PLAXIS models completed" },
      { value: 3, suffix: "D", label: "Staged construction models" },
      { value: 20, suffix: "+", label: "Published numerical methods papers" },
    ],
    processSteps: [
      "Ground model from first principles",
      "Constitutive model selection",
      "Calibration against site data",
      "Staged analysis",
      "Sensitivity studies",
      "Report and design recommendations",
    ],
    subServiceGrid: [
      { title: "Excavation and shaft modelling", description: "Staged PLAXIS models of deep excavations including dewatering and prop removal." },
      { title: "Tunnel and TBM modelling", description: "Ground loss, greenfield settlement and building damage from TBM drives." },
      { title: "Piled raft analysis", description: "3D soil-structure interaction and pile spring derivation for the structural team." },
      { title: "Seismic and dynamic analysis", description: "Site response, liquefaction and dynamic amplification for seismic design." },
      { title: "Back-analysis", description: "Calibration of parameters against measured displacements and loads." },
      { title: "Slope and embankment", description: "Stability, deformation and seepage analysis for embankments and rock slopes." },
    ],
  },
  {
    slug: "ground-improvement-reclamation",
    title: "Ground improvement and reclamation",
    shortDescription:
      "Reclamation, quay walls and ground improvement over calcareous fills — a core strength of our leadership.",
    overview:
      "Reclamation, quay walls and ground improvement over calcareous fills are core strengths of our leadership, applied to offshore islands, urban waterways and container terminals. Calcareous sands crush and creep, and their CPT response differs from silica sands, so correlations must be adjusted. Verification criteria need to reflect this or acceptance testing will be disputed.",
    sceneTheme: "negentropy",
    sceneSummary: "Reclamation fill placement, vibro-compaction probes and quay wall cross-section.",
    capabilityGroups: [
      {
        heading: "What we deliver",
        items: [
          "Reclamation design: fill selection, dredged fill placement, settlement and liquefaction assessment",
          "Ground improvement design: vibro-compaction, vibro-replacement (stone columns), dynamic compaction and rapid impact compaction, surcharging with or without prefabricated vertical drains, deep soil mixing, grouting",
          "Performance-based specifications and acceptance criteria for specialist contractors",
          "Pre and post-improvement testing, interpretation and compliance verification",
          "Marine structures foundations: quay walls, revetments, breakwaters and slope protection; dredging investigation and design input",
        ],
      },
    ],
    stats: [
      { value: 6, suffix: "+", label: "Major reclamation and port projects" },
      { value: 50, suffix: "+", label: "km² of reclamation designed" },
      { value: 25, suffix: "+", label: "Years Gulf marine experience" },
    ],
    processSteps: [
      "Ground investigation and fill characterisation",
      "Method selection and feasibility",
      "Design and performance specification",
      "Trial testing and calibration",
      "Full-scale improvement and monitoring",
      "Verification and compliance reporting",
    ],
    subServiceGrid: [
      { title: "Reclamation design", description: "Fill selection, placement sequence, settlement and liquefaction assessment." },
      { title: "Vibro-compaction", description: "Design and specification for vibro-compaction and vibro-replacement in calcareous sands." },
      { title: "Dynamic and impact compaction", description: "Dynamic compaction and rapid impact compaction design." },
      { title: "Vertical drains and surcharge", description: "PVD layout, surcharge design and time-settlement prediction for soft ground." },
      { title: "Quay walls and marine structures", description: "Foundation design for quay walls, revetments and breakwaters." },
      { title: "Verification testing", description: "Acceptance criteria and compliance testing for specialist contractors." },
    ],
  },
  {
    slug: "independent-checking",
    title: "Independent checking, peer review and value engineering",
    shortDescription:
      "Category III checking, peer review and value engineering — an independent ground model and calculations, not just comments.",
    overview:
      "Independent design checking, peer review and value engineering for developers, checking engineers, lead consultants and EPC contractors. We bring an independent ground model and calculations, not just comments on someone else's. Checking is common on Gulf towers, reclamation and infrastructure. Our checks are written for the checking engineer, the authority and the contractor to act on, with clear accept, revise or verify outcomes.",
    sceneTheme: "advisory-lifecycle-network",
    sceneSummary: "Design review workflow: independent model, check certificate and comment register.",
    capabilityGroups: [
      {
        heading: "What we deliver",
        items: [
          "Category III and third-party checking of geotechnical and temporary works designs",
          "Peer review of EPC and contractor geotechnical designs (piles, rafts, walls, slopes, tunnels)",
          "Review of designs submitted for authority approval",
          "Value engineering: alternative foundation and retaining solutions with cost and programme comparison",
          "Design basis review for major utility and water infrastructure",
        ],
      },
    ],
    stats: [
      { value: 30, suffix: "+", label: "Years Category III checking experience" },
      { value: 50, suffix: "+", label: "Design packages independently checked" },
      { value: 7, suffix: "+", label: "GCC countries" },
    ],
    processSteps: [
      "Brief review and independent ground model",
      "Independent calculations",
      "Comparison with submitted design",
      "Comment register",
      "Designer's response review",
      "Check certificate",
    ],
    subServiceGrid: [
      { title: "Category III checking", description: "Independent ground model and calculations to check and certify geotechnical designs." },
      { title: "Peer review", description: "Technical peer review of EPC and contractor design packages." },
      { title: "Authority submission review", description: "Review and comment on designs prior to authority submission." },
      { title: "Value engineering", description: "Alternative foundation or retaining solutions with cost and programme comparison." },
      { title: "Design basis review", description: "Independent review of design basis and ground model for major infrastructure." },
      { title: "Temporary works review", description: "Independent review of contractor temporary works designs." },
    ],
  },
  {
    slug: "forensic-investigation",
    title: "Failure and forensic investigation",
    shortDescription:
      "Find out why assets have moved, cracked or leaked before spending money on a fix.",
    overview:
      "Settlement, cracking, leaking pipe joints, moving excavations and underperforming piles all have a cause that can be found. When assets misbehave we establish the cause before anyone spends money on a fix. Crushed carbonate fills, wetting collapse of desert soils and saline groundwater attack are frequent causes of long-term movement and distress in the Gulf region.",
    sceneTheme: "schedule-network-graph",
    sceneSummary: "Forensic timeline: event sequence, back-analysis and root cause.",
    capabilityGroups: [
      {
        heading: "What we deliver",
        items: [
          "Review of design, construction and monitoring records",
          "Back-analysis of observed behaviour and targeted further testing",
          "Root cause assessment and settlement prediction for remaining service life",
          "Remediation options appraisal and remediation design in proportion to the risk",
          // [CONFIRM] Expert witness services in UAE/KSA — to be confirmed before publishing
          "Expert reports written to stand up to third-party, contractual and authority scrutiny",
        ],
      },
    ],
    stats: [
      { value: 25, suffix: "+", label: "Years forensic investigation experience" },
      { value: 50, suffix: "+", label: "Forensic investigations completed" },
      { value: 7, suffix: "+", label: "GCC countries" },
    ],
    processSteps: [
      "Records review and site visit",
      "Back-analysis of observed behaviour",
      "Further testing and investigation",
      "Root cause assessment",
      "Remediation options appraisal",
      "Expert report",
    ],
    subServiceGrid: [
      { title: "Records review", description: "Review of design, construction and monitoring records against observed behaviour." },
      { title: "Back-analysis", description: "Numerical and analytical back-analysis to calibrate parameters against measured movement." },
      { title: "Root cause assessment", description: "Structured assessment of cause, mechanism and sequence of distress." },
      { title: "Targeted further testing", description: "Scoped investigation to fill gaps in the records and test hypotheses." },
      { title: "Remediation design", description: "Remediation options appraisal and proportionate remediation design." },
      { title: "Expert reporting", description: "Reports written to stand up to third-party, contractual and authority scrutiny." },
    ],
  },
  {
    slug: "structural-engineering",
    title: "Structural engineering",
    shortDescription:
      "Structural design, assessment, strengthening and rehabilitation — coordinated with the ground model.",
    overview:
      "Structural design, assessment, strengthening and rehabilitation, delivered by Technical Directors with experience across marine and water-retaining structures, offshore oil and gas facilities, bridges and high-rise buildings. Working alongside our geotechnical team means foundations and structure are designed as one system. Durability in aggressive marine and saline environments, heritage buildings that have been modified over decades, and soil-structure interaction on piled rafts are common themes in the region.",
    sceneTheme: "golden-parthenon",
    sceneSummary: "Structural frame and foundation interaction — reinforced concrete tower on a piled raft.",
    capabilityGroups: [
      {
        heading: "What we deliver",
        items: [
          "Structural design of reinforced concrete, prestressed concrete and steel structures",
          "Marine and water-retaining structures",
          "Bridges and infrastructure structures",
          "Condition assessment, capacity checks, strengthening and rehabilitation of existing structures",
          "Finite element analysis and structural optimisation (ETABS, SAP2000, SAFE, STAAD, SACS, ABAQUS)",
          "Forensic structural investigations and independent structural review",
        ],
      },
    ],
    stats: [
      { value: 20, suffix: "+", label: "Years structural experience" },
      { value: 90, suffix: "+", label: "Projects delivered" },
      { value: 50, suffix: "+", label: "Peer-reviewed publications" },
    ],
    processSteps: [
      "Concept design",
      "FEED and detailed engineering",
      "Procurement and specification",
      "Construction phase support",
      "Structural integrity management",
      "Rehabilitation and strengthening",
    ],
    subServiceGrid: [
      { title: "Reinforced and prestressed concrete", description: "Design to American (ACI), British (BS), European (Eurocode), Saudi (SBC) and UAE (Local) codes." },
      { title: "Marine and water-retaining structures", description: "Quay walls, jetties, tanks and reservoirs designed for durability." },
      { title: "Bridges and infrastructure", description: "Highway bridges, interchanges and marine bridges." },
      { title: "Existing structure assessment", description: "Capacity checks, condition assessment and rehabilitation design." },
      { title: "Structural FEA", description: "ETABS, SAP2000, SAFE, STAAD, SACS and ABAQUS modelling." },
      { title: "Independent structural review", description: "Peer review and check of structural design packages." },
    ],
  },
  {
    slug: "construction-support",
    title: "Construction phase support and monitoring",
    shortDescription:
      "Stay involved through construction to check that the ground behaves as predicted and act quickly when it does not.",
    overview:
      "Design assumptions are tested during construction. We stay involved through construction to check that the ground behaves as predicted and to act quickly when it does not. Many Gulf projects are built next to live metro tunnels, bridges, utilities and heritage buildings. Monitoring with agreed triggers is how those assets are protected.",
    sceneTheme: "advisory-lifecycle-network",
    sceneSummary: "Monitoring network: sensors, trigger levels and response actions during construction.",
    capabilityGroups: [
      {
        heading: "What we deliver",
        items: [
          "Temporary works and working platform design",
          "Piling supervision, pile test specification and interpretation (static, bi-directional, dynamic, integrity)",
          "Instrumentation and monitoring plans with trigger levels and response actions",
          "Interpretation of monitoring data and back-analysis",
          "Inspection of excavations and foundations; design office and site presence for quality assurance",
        ],
      },
    ],
    stats: [
      { value: 25, suffix: "+", label: "Years construction phase experience" },
      { value: 100, suffix: "+", label: "Monitoring programmes managed" },
      { value: 7, suffix: "+", label: "GCC countries" },
    ],
    processSteps: [
      "Pre-construction baseline survey",
      "Instrumentation installation and monitoring plan",
      "Trigger levels and response actions agreed",
      "Live monitoring and data interpretation",
      "Back-analysis and design updates",
      "Post-construction review",
    ],
    subServiceGrid: [
      { title: "Temporary works design", description: "Working platform, shoring and temporary structure design." },
      { title: "Pile testing", description: "Static, bi-directional, dynamic and integrity test specification and interpretation." },
      { title: "Monitoring plans", description: "Instrumentation layout, trigger levels and response actions for live asset protection." },
      { title: "Data interpretation", description: "Real-time monitoring data review and back-analysis during construction." },
      { title: "Site inspection", description: "Excavation and foundation inspections during construction." },
      { title: "Quality assurance", description: "Design office and site presence through critical construction phases." },
    ],
  },
];

export const services: Service[] = baseServices.map((service) => ({
  ...service,
  ...siteContent.services?.[service.slug],
}));

export const getServiceBySlug = (slug: string): Service | undefined =>
  services.find((service) => service.slug === slug);
