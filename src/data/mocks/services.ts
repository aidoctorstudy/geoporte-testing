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

export type ServiceSceneTheme =
  | "corridor-grading"
  | "bim-clash-detection"
  | "geological-digital-twin"
  | "structural-fem-analysis"
  | "flood-inundation-terrain"
  | "schedule-network-graph"
  | "advisory-lifecycle-network"
  | "telecom-signal-network";

export interface Service {
  slug: string;
  title: string;
  shortDescription: string;
  overview: string;
  sceneTheme: ServiceSceneTheme;
  sceneSummary: string;
  capabilityGroups: ServiceCapabilityGroup[];
  subServices?: ServiceSubService[];
}

export const services: Service[] = [
  {
    slug: "civil-engineering",
    title: "Civil Engineering",
    shortDescription:
      "Designs focused on functionality, constructability, safety and economy.",
    overview:
      "Geoporte's Civil Design team collaborates with clients, architects, contractors and government entities to deliver designs that emphasise functionality, constructability and well-planning — without compromising safety or economic efficiency. The team brings extensive experience across transport, water and building infrastructure projects.",
    sceneTheme: "corridor-grading",
    sceneSummary:
      "An elevated corridor of graded earthworks and roadworks — cut-and-fill contour bands, a culvert crossing a floodway, cross-drainage lines resolving out of a topographic point cloud.",
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
  },
  {
    slug: "design-and-drafting",
    title: "Design & Drafting",
    shortDescription:
      "Comprehensive civil engineering design solutions using cutting-edge technology.",
    overview:
      "High-quality design and drafting services that adhere to industry standards and best practice. The team pairs experienced civil engineers with CAD specialists, working in industry-leading software — AutoCAD, Civil 3D and Revit — to deliver precise, coordinated documentation as an extension of the client's own project team.",
    sceneTheme: "bim-clash-detection",
    sceneSummary:
      "A drafting volume where solid geometry dissolves into wireframe and back — clash-detection spheres flare where two models intersect, drawing sheets hover as thin translucent planes.",
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
  },
  {
    slug: "geotechnical-engineering",
    title: "Geotechnical Engineering",
    shortDescription:
      "Full-service solutions for planning and design challenges beneath the ground.",
    overview:
      "Geoporte's geotechnical practice is the deepest bench in the firm — full-service solutions across site investigation, ground behaviour, foundation design and slope stabilisation, applied to some of the region's most technically demanding infrastructure. This is the discipline the Geoporte digital twin was built to show: what lies beneath the project.",
    sceneTheme: "geological-digital-twin",
    sceneSummary:
      "The full digital-twin cutaway — bridge, tunnel and valley corridor, geological strata, boreholes, piles and monitoring instrumentation. The same scene family as the homepage hero, re-framed for this page.",
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
  },
  {
    slug: "structural-engineering",
    title: "Structural Engineering",
    shortDescription:
      "Cost-effective solutions to the latest standards and codes.",
    overview:
      "Customised, cost-effective structural engineering solutions for the civil infrastructure sector, combining local and international expertise to meet current standards without compromising delivery efficiency. Geoporte works a One Team approach — collaborating directly with clients to develop tailored structural solutions across site development, transportation, utilities and infrastructure.",
    sceneTheme: "structural-fem-analysis",
    sceneSummary:
      "A structural frame under analysis — a steel/concrete frame mesh that ripples between realistic member and FEM stress-colour wireframe, load-path arrows and deflection ghosting through it.",
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
  },
  {
    slug: "stormwater-and-flood-modelling",
    title: "Stormwater & Flood Modelling",
    shortDescription: "Innovative risk management through technical expertise.",
    overview:
      "Helping clients effectively manage stormwater and flood risk through innovative solutions, technical expertise and current modelling technology — hydrological, hydraulic and GIS-based approaches, backed by clear regulatory navigation and sophisticated data visualisation.",
    sceneTheme: "flood-inundation-terrain",
    sceneSummary:
      "A catchment terrain with a rising translucent water-level shader, flood-extent contour rings expanding outward, drainage network lines pulsing with flow direction.",
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
  },
  {
    slug: "project-control-services",
    title: "Project Control Services",
    shortDescription: "Performance optimisation, risk mitigation, timely delivery.",
    overview:
      "Integrated project controls across scheduling, cost management, risk assessment and quality control — optimising project performance, mitigating risk, and ensuring timely, cost-effective delivery through accurate forecasting and transparent stakeholder reporting.",
    sceneTheme: "schedule-network-graph",
    sceneSummary:
      "An abstract 3D critical-path network — nodes and ribbons forming a Gantt-like lattice in space, an S-curve ribbon sweeping through it, progress markers advancing along the critical path.",
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
  },
  {
    slug: "advisory-services",
    title: "Advisory Services",
    shortDescription: "A collaborative partnership approach to geotechnical challenges.",
    overview:
      "Geoporte's value lies in highly experienced staff who understand geotechnical challenges, operating through an open, collaborative partnership approach — creating innovative, practical solutions that save clients time and money across every project phase.",
    sceneTheme: "advisory-lifecycle-network",
    sceneSummary:
      "A rotating knowledge-network — connected nodes representing Plan, Design, Build, Operate arranged around a slowly turning core, links brightening as the scroll narrative moves through the project lifecycle.",
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
  },
  {
    slug: "telecom-services",
    title: "Telecom Services",
    shortDescription: "Surveys, design, build and testing for mobile communications systems.",
    overview:
      "Surveys, design, build and testing of mobile communications systems across in-building (DAS / Small Cells / Repeaters / Nextivity) and outdoor (Macro / PSN / Small Cells) networks — RF engineering delivered by certified professionals from site survey through commissioning.",
    sceneTheme: "telecom-signal-network",
    sceneSummary:
      "A transmission tower and in-building node grid — signal-coverage rings expanding as translucent shells, RF paths linking towers to small cells, a slow sweep showing coverage strengthening.",
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
  },
];

export const getServiceBySlug = (slug: string): Service | undefined =>
  services.find((service) => service.slug === slug);
