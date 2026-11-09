/**
 * Geoporte sector pages for www.geoporte.ae.
 *
 * Source: Geoporte ME Website Content and Build Brief, Rev 0,
 * 2 November 2026, Section 7.11.
 *
 * Eight sectors. Each sector page: H1, intro (two short paragraphs),
 * "Typical work" bullets, related projects pulled by sector tag, CTA.
 */

export interface Sector {
  slug: string;
  title: string;
  /** Short summary used on the sector index cards. */
  cardSummary: string;
  metaTitle: string;
  metaDescription: string;
  intro: string[];
  typicalWork: string[];
  /** _ref codes of related projects (C1–C7, T1–T26). */
  relatedProjectRefs: string[];
}

export const sectors: Sector[] = [
  {
    slug: "rail-metro",
    title: "Rail and metro",
    cardSummary:
      "Investigation scoping, cut-and-cover and bored tunnels, station boxes, viaduct foundations, embankments and cuttings.",
    metaTitle: "Rail and Metro Geotechnical Engineering | Geoporte Middle East",
    metaDescription:
      "Ground investigation, tunnelling design and foundation engineering for metro lines, rail corridors and viaducts across the UAE, KSA and Qatar.",
    intro: [
      "Rail and metro projects in the Gulf sit at the intersection of demanding ground conditions and very low tolerance for movement. Station boxes, cut-and-cover tunnels and bored TBM drives pass through sabkha, calcareous fills and variable rock — ground that needs a site-specific model, not borrowed parameters.",
      "Our senior specialists led the geotechnical design of the Dubai Metro Route 2020 extension, provided design input to the Doha and Riyadh Metro tender designs, and scoped and reviewed the ground investigation programme for the 900 km Etihad Rail national freight and passenger network. The same team now leads Geoporte's rail and metro commissions in the region.",
    ],
    typicalWork: [
      "Ground investigation scoping and specification for metro alignments and station sites",
      "Cut-and-cover tunnel and station box design: secant and diaphragm walls, anchors and props, dewatering",
      "TBM drive design: ground model, face pressure and tail void grouting specifications",
      "Viaduct and bridge foundation design under seismic and static loading",
      "Embankment and cutting design: earthworks stability, settlement and drainage",
      "Ground movement assessment and protection of adjacent structures and utilities",
      "Geotechnical baseline reports for design and build contracts",
    ],
    relatedProjectRefs: ["T1", "T2", "T3"],
  },
  {
    slug: "water",
    title: "Water, wastewater and drainage",
    cardSummary:
      "Deep shafts, sewer tunnels, reservoirs, large-diameter pipelines, wadi and stormwater works.",
    metaTitle: "Water and Wastewater Geotechnical Engineering | Geoporte Middle East",
    metaDescription:
      "Deep shaft design, TBM sewer tunnels, reservoir foundations and large-diameter pipeline geotechnics for water authorities across the GCC.",
    intro: [
      "Water and wastewater infrastructure in the Gulf goes deep. Deep pumping station shafts, long TBM sewer tunnels through variable rock, large-diameter pipelines on crushed carbonate fills and reservoir foundations on soft or collapsible ground all need geotechnical design that is calibrated to the local conditions.",
      "Our specialists provided geotechnical design input to the STEP programme in Abu Dhabi — a 100 m deep, 50 m diameter pumping station shaft connected to 41 km of deep sewer tunnels — and to the Inner Doha Re-sewerage Implementation Strategy (IDRIS) and the Mega Reservoir Programme in Doha. We also carried out independent technical review of a remediation design basis for leaking large-diameter pipeline joints at five reservoir pumping stations in Qatar.",
    ],
    typicalWork: [
      "Deep shaft design: secant pile, diaphragm wall and caisson shafts",
      "TBM sewer tunnel geotechnics: ground model, face pressure and tail void grouting specifications",
      "Reservoir and tank foundation design",
      "Large-diameter pipeline corridor geotechnics: trench stability, bedding and backfill, settlement",
      "Wadi and stormwater drainage: flood risk, erosion and scour assessment",
      "Geotechnical baseline reports for tunnelling contracts",
      "Settlement analysis and forensic review for existing water infrastructure",
    ],
    relatedProjectRefs: ["C1", "C6", "T4", "T5", "T6"],
  },
  {
    slug: "tunnelling",
    title: "Tunnelling and underground",
    cardSummary:
      "TBM and microtunnelling, secant and diaphragm wall shafts, dewatering, impact on adjacent assets.",
    metaTitle: "Tunnelling and Underground Geotechnical Engineering | Geoporte Middle East",
    metaDescription:
      "TBM drive design, shaft design, dewatering and ground movement assessment for tunnelling projects in the UAE, KSA, Qatar and Bahrain.",
    intro: [
      "Tunnelling in the Gulf demands a defensible ground model from the start. Karst cavities and dissolution features, variable rock-soil transitions, calcareous fills of uncertain density and very high groundwater pressures are common. The design consequences — TBM face stability, shaft wall deflection, settlement above the drive — depend on parameters that must be tested and justified, not assumed.",
      "Our team led geotechnical design for the Dubai Metro Route 2020 TBM tunnels, provided design input to the STEP pumping station shaft and sewer tunnel programme, led tunnel and geotechnical design for the Doha and Riyadh Metro tender submissions, and designed secant pile shafts and microtunnels for urban flood mitigation in Riyadh.",
    ],
    typicalWork: [
      "TBM drive design: ground model, face pressure, tail void grouting and performance specifications",
      "Shaft design: secant pile, diaphragm wall and caisson shafts for deep pumping stations",
      "Microtunnelling and pipe jacking: ground conditions assessment and performance specification",
      "Dewatering: groundwater control strategy, well design and drawdown impact assessment",
      "Ground movement assessment: settlement trough, building damage and utility impact",
      "Geotechnical baseline reports for design and build contracts",
      "Construction phase support and monitoring during tunnelling adjacent to live assets",
    ],
    relatedProjectRefs: ["C1", "T1", "T2", "T4", "T5", "T6"],
  },
  {
    slug: "roads-bridges",
    title: "Roads and bridges",
    cardSummary:
      "Highway earthworks, rock cuts, bridge and interchange foundations, causeways, pavement subgrade.",
    metaTitle: "Roads and Bridges Geotechnical Engineering | Geoporte Middle East",
    metaDescription:
      "Bridge foundation design, highway earthworks, rock cut stabilisation and causeway geotechnics across the GCC.",
    intro: [
      "Highway and bridge projects in the Gulf span sabkha, calcareous rock and very soft marine clays. Bridge foundations on cemented caprock, embankments over soft ground, rock cuts in the Hajar mountains and causeways through 30 m of very soft clay each need a ground model and design approach specific to that site.",
      "Our specialists led the tender foundation design for the 36 km Sheikh Jaber Al-Ahmad Al-Sabah Causeway in Kuwait, designed foundations for 12 interchanges and 8 wadi bridges in Oman, led the geotechnical parts of the Qatar Highway Design Manual, and provided construction impact assessment for deep cut slopes and L-walls beside a live multi-span bridge in Riyadh.",
    ],
    typicalWork: [
      "Bridge and interchange foundation design: piles in calcareous rock and sand, spread footings on cemented caprock",
      "Highway earthworks: cut and fill design, embankment stability and settlement",
      "Rock cut stabilisation: rock mass characterisation, rockfall risk and stabilisation design",
      "Causeway and marine crossing geotechnics: very soft ground, monopiles and load testing",
      "Pavement subgrade assessment and earthworks design parameters",
      "Scour assessment for wadi and marine crossings",
      "Construction impact assessment for works adjacent to live bridges and infrastructure",
    ],
    relatedProjectRefs: ["C2", "T14", "T15", "T16", "T17", "T22", "T24"],
  },
  {
    slug: "ports-marine",
    title: "Ports, marine and reclamation",
    cardSummary:
      "Quay walls, revetments, breakwaters, dredged reclamation, ground improvement and verification.",
    metaTitle: "Ports, Marine and Reclamation Geotechnical Engineering | Geoporte Middle East",
    metaDescription:
      "Quay wall design, dredged reclamation, ground improvement and marine structure foundations for ports and offshore projects across the GCC.",
    intro: [
      "Marine and port projects in the Gulf combine offshore ground conditions with demanding structural requirements. Dredged fill of variable density, calcareous sand that crushes and creeps, very soft marine clays, and saline groundwater that attacks concrete and steel are routine. Verification criteria need to reflect the actual soil behaviour, not silica-sand correlations.",
      "Our specialists led the geotechnical design of the Sarb artificial islands in Abu Dhabi — 450 m of quay walls, 1.5 km of revetments and ground improvement across 50 hectares of dredged fill — and have delivered quay wall, reclamation and foundation designs at Jebel Ali Port, Khalifa Port, Sohar Port, Dubai Harbour, Mesaieed Port and Al Faw Grand Port.",
    ],
    typicalWork: [
      "Reclamation design: fill selection, placement sequence, settlement and liquefaction assessment",
      "Quay wall, revetment and breakwater design and foundation engineering",
      "Ground improvement design and specification: vibro-compaction, vibro-replacement, dynamic compaction, surcharging",
      "Performance specifications and acceptance criteria for specialist contractors",
      "Pre- and post-improvement testing, interpretation and compliance verification",
      "Marine bridge and jetty foundation design",
      "Dredging investigation and scour assessment",
    ],
    relatedProjectRefs: ["T7", "T8", "T9", "T10", "T11", "T12", "T21"],
  },
  {
    slug: "buildings",
    title: "Buildings and developments",
    cardSummary:
      "High-rise piled rafts, deep basements, dewatering, master plan geohazards, heritage structures.",
    metaTitle: "Buildings and Developments Geotechnical Engineering | Geoporte Middle East",
    metaDescription:
      "Piled raft design, deep basement excavation, dewatering and independent checking for high-rise and mixed-use developments in Dubai, Abu Dhabi and across the GCC.",
    intro: [
      "High-rise and mixed-use developments in the Gulf depend on accurate pile spring stiffnesses, defensible settlement predictions and a basement design that keeps the excavation dry without damaging adjacent buildings. Cemented caprock, variable fill over weaker layers, shallow groundwater and aggressive sulphates are common.",
      "Our team provided independent PLAXIS 3D soil-structure interaction for a G+30 and G+20 mixed-use development in Dubai, led deep basement and foundation design with monitoring to protect the adjacent heritage Union House at the Etihad Museum, and carried out preliminary foundation performance assessment for a heritage building in Bur Dubai that was first constructed around 1970.",
    ],
    typicalWork: [
      "Piled raft and pile group design: pile spring derivation and soil-structure interaction",
      "Settlement and differential settlement analysis",
      "Deep basement excavation support: secant and diaphragm walls, anchors, props and dewatering",
      "Independent geotechnical checking (Category III) for towers and mixed-use developments",
      "Master plan geohazard mapping: sabkha, karst, collapsible soils and wadi flood risk",
      "Foundation performance assessment and forensic review of existing buildings",
      "Construction phase monitoring to protect adjacent heritage structures and live metro tunnels",
    ],
    relatedProjectRefs: ["C5", "C7", "T18", "T19", "T20"],
  },
  {
    slug: "energy-utilities",
    title: "Energy and utilities",
    cardSummary:
      "Solar PV, transmission lines, oil and gas facilities, pipeline protection beneath new embankments.",
    metaTitle: "Energy and Utilities Geotechnical Engineering | Geoporte Middle East",
    metaDescription:
      "Geotechnical design for solar PV, transmission towers, offshore oil and gas structures and pipeline infrastructure across the GCC and Red Sea.",
    intro: [
      "Energy and utilities infrastructure in the Gulf spans solar PV farms across collapsible desert soils, transmission towers in flood-prone ground, offshore oil and gas islands and industrial estates with buried pipelines. Each needs geotechnical design that is calibrated to the specific ground risk — driven piles in highly saline groundwater, vibro-replacement to mitigate liquefaction on dredged islands, or pipe protection from new embankment loads.",
      "Our team provided independent geotechnical peer review for a 2,000 MW solar PV plant in Saudi Arabia, stability analysis for transmission tower foundations in flood-prone ground, and foundation design with dynamic compaction and vibro-replacement for multi-storey accommodation on Das Island. We also designed protective works for fuel pipeline infrastructure in the Hamriyah Free Zone industrial estate.",
    ],
    typicalWork: [
      "Foundation design for solar PV arrays: driven H-piles and screw piles, drivability and uplift",
      "Transmission tower foundation design under compression, uplift and overturning",
      "Independent geotechnical peer review for EPC solar and energy projects",
      "Offshore oil and gas island reclamation and marine structure foundations",
      "Ground improvement to mitigate liquefaction on offshore islands and fills",
      "Pipeline protection design beneath new embankments and earthworks",
      "Corrosion risk assessment in saline groundwater for steel and concrete foundations",
    ],
    relatedProjectRefs: ["C3", "C4", "T7", "T21", "T25"],
  },
  {
    slug: "investigation-forensics",
    title: "Investigation and forensics",
    cardSummary:
      "Ground investigation management, failure investigation, back-analysis and remediation design.",
    metaTitle: "Ground Investigation and Forensic Geotechnics | Geoporte Middle East",
    metaDescription:
      "Root cause investigation of settlement, cracking, underperforming piles and leaking pipelines, with proportionate remediation design for Gulf projects.",
    intro: [
      "When ground-related problems appear — leaking pipeline joints, settling buildings, moving excavations or underperforming piles — establishing the cause before spending money on a fix saves time and dispute. Our forensic work starts with a review of the design, construction and monitoring record, and builds to a back-analysis that tests hypotheses against measured behaviour.",
      "Our recent forensic commissions include construction impact assessment beside a live multi-span bridge in Riyadh, independent technical review of a remediation design basis for large-diameter pipeline joints at five reservoir pumping stations in Qatar, and preliminary foundation performance assessment for a 1970s heritage building in Bur Dubai. Crushed carbonate fills, wetting collapse of desert soils and saline groundwater attack are frequent causes of long-term movement and distress in the region.",
    ],
    typicalWork: [
      "Review of design, construction and monitoring records against observed behaviour",
      "Back-analysis of measured movements, settlements and loads",
      "Root cause assessment: cause, mechanism and sequence of distress",
      "Targeted further investigation to test hypotheses and fill gaps",
      "Residual settlement analysis and remaining service life assessment",
      "Remediation options appraisal and proportionate remediation design",
      "Independent technical review of remediation design bases and construction records",
    ],
    relatedProjectRefs: ["C2", "C6", "C7"],
  },
];

export const sectorSlugs = sectors.map((s) => s.slug);
