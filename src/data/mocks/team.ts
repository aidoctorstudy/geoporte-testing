/**
 * Geoporte leadership profiles for www.geoporte.ae.
 *
 * Source: Geoporte ME Website Content and Build Brief, Rev 0,
 * 2 November 2026, Section 8.
 *
 * Items marked [CONFIRM] in the brief are included but noted inline.
 * They must not go live until signed off by Qaiser Hayat.
 *
 * The wider AU/NZ team (Section 8.9) is intentionally not listed here;
 * their experience is mainly AU-based and they are not shown on
 * geoporte.ae at launch.
 *
 * `teamMembers` (the export every consumer uses) is `baseTeamMembers`
 * merged with any /admin-edited overrides in `content.json`, keyed by
 * `slugify(baseTeamMembers[i].name)` — see `content-overrides.ts`. The
 * key is always derived from the *original* hardcoded name, so editing
 * a name through /admin can't orphan its own override.
 */
import { siteContent, slugify } from "@/lib/content-overrides";

export interface TeamMember {
  name: string;
  title: string;
  credentials: string[];
  /** One-line card summary with years of experience and specialisation. */
  experience?: string;
  bio: string;
  photo: {
    src: string;
    alt: string;
  };
}

/** Original, never-overridden data — /admin reads this (not
 * `teamMembers` below) to compute each override's stable key and to show
 * the real baseline value for comparison. */
export const baseTeamMembers: TeamMember[] = [
  {
    name: "Qaiser Hayat",
    title: "Managing Director and Principal Geotechnical Engineer",
    credentials: [
      "MSc Soil Mechanics and Engineering Seismology, DIC (Imperial College London)",
      "BSc Civil Engineering (Hons)",
      "CPEng, NER, APEC Engineer, IntPE (Aus)",
      "CEng MICE (UK)",
      "CPEng (NZ)",
      "RPEQ, RPEV",
      // [CONFIRM] PE (Idaho, USA) — state licence to verify
    ],
    experience:
      "25+ years. Gulf ports and reclamation, metro and tunnels, seismic design and ground risk. Former regional practice manager for tunnels and earth engineering in the Middle East.",
    bio: "Qaiser is a Chartered Geotechnical Engineer with more than 25 years of experience in the design and management of civil and geotechnical engineering projects. He founded Geoporte to give clients direct access to senior engineering judgement.\n\nMuch of his career has been in the Gulf. In previous roles with international engineering consultancies he provided geotechnical design input to the Sarb artificial islands, Yas Island, Das Island and Zakum Island in Abu Dhabi, Dubai Culture Village, the Dubai Metro Route 2020 extension, the Dubai Water Canal, the STEP wastewater programme in Abu Dhabi and island works for the Saudi Bahrain causeway. He served as Regional Practice Manager and Manager of Talent in the Middle East and in Australia and New Zealand.\n\nSpecialisations: ground risk management, earthquake geotechnical engineering, reclamation and ground improvement, retaining walls and slope stabilisation, shallow and deep foundations, forensic analysis of geotechnical failures, and leading multidisciplinary teams on major infrastructure.",
    photo: { src: "/assets/team/qaiser-hayat.jpeg", alt: "Qaiser Hayat" },
  },
  {
    name: "Dr Mazin Alhamrany",
    title: "Technical Director, Ground Engineering",
    credentials: [
      // [CONFIRM] PhD institution — brief notes "PhD (UK)"; university of Sheffield pending confirmation
      "PhD Geotechnical Engineering (University of Sheffield) [CONFIRM]",
      "MSc Geotechnical Engineering",
      "BSc Civil Engineering",
      "CPEng, RPEV, NER, APEC Engineer, IntPE (Aus)",
      "MICE",
      "Member British Geotechnical Association",
      "Member CROW (Netherlands)",
    ],
    experience:
      "35 years, including twelve years heading a tunnels and geotechnics team in Dubai. Doha and Riyadh metros, STEP, IDRIS and Etihad Rail.",
    bio: "Mazin is a Chartered Engineer with 35 years of experience leading geotechnical and tunnelling design in the Middle East, the UK, Europe and Australia, including twelve years heading a tunnels and geotechnics team in Dubai.\n\nHe has led and managed design on the Doha Metro, the Riyadh Metro and Etihad Rail; the Strategic Tunnel Enhancement Programme (STEP) in Abu Dhabi, with its deep pumping station shaft and some 41 km of deep sewer tunnels; the Inner Doha Re-sewerage Implementation Strategy (IDRIS); and the Mega Reservoir programme in Doha. In Europe his work includes Crossrail (Farringdon Station and Pudding Mill Lane Portal), the Amsterdam Metro North-South Line and levee and dike improvement in the Netherlands.\n\nMazin is a specialist in advanced numerical modelling and complex geotechnical problem-solving, and has published and taught on numerical methods for geotechnical engineering.",
    photo: { src: "/assets/team/mazin-alhamrany.jpg", alt: "Dr Mazin Alhamrany" },
  },
  {
    name: "Dr Salwa Yassin",
    title: "Principal Geotechnical Engineer",
    credentials: [
      "PhD Geotechnical Engineering",
      "MSc Geotechnical Engineering",
      "BSc Civil Engineering",
      "CEng MICE",
      "Value Methodology Associate (VMA)",
      "CSCS",
      "Member ISSMGE",
    ],
    experience:
      "30+ years. Causeways, ports, reclamation and Category III checking across the Gulf. Author of the Code Companion to the Saudi Soils and Foundation Code (SBC 303).",
    bio: "Salwa is a chartered geotechnical engineer with more than 30 years of experience delivering geotechnical design and advisory services across the Middle East, Australia and Southeast Asia, from feasibility and investigation through detailed design, construction support and forensic review.\n\nHer Gulf experience includes causeways, ports, reclamation and Category III checking. She is the author of the Code Companion to the Saudi Soils and Foundation Code (SBC 303), published by the International Code Council (ICC).\n\nHer technical strengths are soil-structure interaction, deep foundations, embankments, tunnels, retaining structures, slope stability and ground improvement under difficult geological and seismic conditions, with particular expertise in finite element analysis using PLAXIS. At Geoporte she plays a key role in technical governance: independent design review, mentoring engineers and developing best-practice methods.",
    photo: { src: "/assets/team/salwa-yassin.png", alt: "Dr Salwa Yassin" },
  },
  {
    name: "Dr Azam Khan",
    title: "Technical Director, Structures",
    credentials: [
      "PhD Structural Engineering (Imperial College London)",
      "MSc Concrete Structural Design",
      "MBA",
      "BSc Civil Engineering (Hons)",
      "CEng MICE",
    ],
    experience:
      "20+ years. Marine and water-retaining structures on the Red Sea coast, offshore oil and gas structures, bridges and buildings.",
    bio: "Azam is a Chartered Structural Engineer with more than 20 years of experience delivering structural engineering across commercial, industrial, residential, transport, renewables and petrochemical sectors.\n\nHis Middle East work includes marine and water-retaining structures on the Red Sea coast and offshore oil and gas structures. His expertise spans the full project lifecycle from conceptual design and front-end engineering design (FEED) to detailed engineering, procurement and construction (EPC), and structural integrity management.\n\nHe works in steel and concrete to Australian, American, British, European and Russian codes and is proficient in SACS, ETABS, STAAD, SAP2000 and ABAQUS.",
    photo: { src: "/assets/team/azam-khan.png", alt: "Dr Azam Khan" },
  },
  {
    name: "Prof. Dr Bashir Alam",
    title: "Technical Director, Structures",
    credentials: [
      "D.Sc. Structural Engineering (The George Washington University, USA)",
      "MSc Civil Engineering (Structures)",
      "BSc Civil Engineering (Hons)",
      "Member, Governing Body (Civil), Pakistan Engineering Council",
      "Expert and Convener (Civil), PEC",
    ],
    experience:
      "35 years. High-rise design, investigation and rehabilitation of existing structures, and delivery of major public capital programmes.",
    bio: "Bashir is a structural engineer and senior engineering leader with 35 years of experience across structural design, construction, research and the delivery of major public-sector capital programmes in Pakistan and the United States.\n\nHe has designed and evaluated high-rise buildings and bridges in structural steel, reinforced concrete and prestressed concrete in the United States, including investigation, repair and rehabilitation of existing structures. He has provided consultancy on more than 90 structural and civil engineering projects and authored more than 50 peer-reviewed papers on structural optimisation, retrofit strengthening, prestressed girders, retaining walls and seismic pounding.\n\nAt Geoporte he provides structural design leadership, independent technical review and technical governance.",
    photo: { src: "/assets/team/geoporte-team.jpg", alt: "Prof. Dr Bashir Alam" },
  },
  {
    name: "Prof. Dr Beenish Jehan Khan",
    title: "Principal Geotechnical Engineer",
    credentials: [
      "PhD Civil Engineering (Geotechnical)",
      "MSc Civil Engineering (Geotechnical)",
      "BSc Civil Engineering (UET Peshawar)",
      "Professor of Civil Engineering",
    ],
    experience:
      "20+ years. Slope stabilisation, foundations, MSE walls and numerical modelling for highways, tunnels and major buildings.",
    bio: "Beenish is a geotechnical engineer with more than 20 years in civil and geotechnical engineering. She has served as Geotechnical Expert on feasibility studies and detailed design for highway and motorway realignments, tunnel approach roads and slope stabilisation, and has designed foundations for major buildings including university campuses and hotel developments.\n\nHer research covers mechanically stabilised earth walls, sustainable and recycled geomaterials, PLAXIS 3D numerical analysis and machine-learning prediction of soil behaviour, with more than 20 peer-reviewed publications.\n\nAt Geoporte she provides geotechnical design, technical review and proposal input across the firm's infrastructure projects.",
    photo: { src: "/assets/team/geoporte-team.jpg", alt: "Prof. Dr Beenish Jehan Khan" },
  },
  {
    name: "Sirous Agha Amiri",
    title: "Principal Engineering Geologist",
    credentials: [
      "MSc Geology",
      "BSc Geology",
      "Diploma in Project Management",
      "RPGeo (Geotechnical and Engineering, Australia)",
      "Member AIG",
      "Associate Member ANCOLD",
      "Fellow of the Geological Society of London (FGS)",
      "Licensed Remote Pilot (RePL)",
    ],
    experience:
      "25+ years. Dams, tunnels in karst, rock slopes and geohazard mapping in arid terrain.",
    bio: "Sirous is an engineering geologist with more than 25 years of international experience across the Middle East, Australia and Southeast Asia, including senior roles with major engineering consultancies.\n\nHis expertise covers geological and geotechnical risk assessment, slope stability and landslide analysis, tunnelling and underground geohazards including karst, dam and hydropower foundation assessment, 3D geological modelling and site characterisation, and geomorphological and terrain analysis in arid environments. He is a recognised specialist in applying ANCOLD guidelines for dam safety and AGS 2007 guidelines for slope risk.",
    photo: { src: "/assets/team/sirous-amiri-agha.jpg", alt: "Sirous Agha Amiri" },
  },
  {
    name: "Dr Syed Danial Ali",
    title: "Senior Geotechnical Engineer",
    credentials: [
      "PhD Geotechnical Engineering",
      "MSc Geo and Water Engineering",
      "BSc Mining Engineering",
      // [CONFIRM] MICE membership
      "MICE [CONFIRM]",
    ],
    experience:
      "17+ years. Port geotechnics, soft-soil improvement, seismic site response and advanced numerical modelling.",
    bio: "Danial is a geotechnical engineer with more than 17 years of experience in consultancy, research and technical support, working through feasibility, detailed design and construction for public and private clients in Australia, New Zealand and other regions.\n\nHe specialises in ground improvement design, interpretation of geotechnical parameters, slope stability and settlement analysis, seepage and dewatering, seismic site response and liquefaction assessment.\n\nHe is an advanced numerical modeller, proficient in PLAXIS 2D and 3D, GeoStudio, FLAC 2D, UDEC, Midas GTS NX, ABAQUS, DeepSoil, CPeT-IT, CLiq, LPile, GRL-WEAP and the Rocscience suite (RS2, Slide2, Settle3, Unwedge, Dips, RocData, Swedge, RocSupport).",
    photo: { src: "/assets/team/syed-ali.jpg", alt: "Dr Syed Danial Ali" },
  },
];

export const teamMembers: TeamMember[] = baseTeamMembers.map((member) => ({
  ...member,
  ...siteContent.team?.[slugify(member.name)],
}));
