/**
 * Geoporte's specialist staff — real team roster sourced from
 * geoporte.com.au/our-team. Photos downloaded to `public/assets/team/`.
 */

export interface TeamMember {
  name: string;
  title: string;
  credentials: string[];
  experience?: string;
  bio: string;
  photo: {
    src: string;
    alt: string;
  };
}

export const teamMembers: TeamMember[] = [
  {
    name: "Qaiser Hayat",
    title: "Director & Principal Geotechnical Engineer",
    credentials: [
      "MSc Soil Mechanics and Engineering Seismology",
      "BSc Civil Engineering (Hons)",
      "CPEng",
      "NER",
      "APEC Engineer",
      "IntPE (Australia)",
      "CEng MICE (UK)",
    ],
    experience: "25+ years",
    bio: "Chartered geotechnical engineer specialising in the design and management of civil and geotechnical projects across Australia, New Zealand, the UK, the Middle East and Asia — retaining walls, slope stabilisation, foundations and earthquake geotechnical engineering.",
    photo: { src: "/assets/team/qaiser-hayat.jpeg", alt: "Qaiser Hayat" },
  },
  {
    name: "Dr Mazin Alhamrany",
    title: "Senior Geotechnical Engineer",
    credentials: [
      "PhD Geotechnical Engineering (UK)",
      "MSc Geotechnical Engineering",
      "BSc Civil Engineering",
      "Chartered Civil Engineer",
      "Member CROW (Netherlands)",
    ],
    experience: "30+ years",
    bio: "Led challenging projects across the UK, Europe, the Middle East and Australia, including the Doha Metro, Riyadh Metro and Etihad Rail — expertise in advanced numerical modelling and complex geotechnical problem-solving.",
    photo: { src: "/assets/team/mazin-alhamrany.jpg", alt: "Dr Mazin Alhamrany" },
  },
  {
    name: "Dr Azam Khan",
    title: "Structural Design Engineer",
    credentials: [
      "PhD Structural Engineering (Imperial College London)",
      "MSc Civil Engineering (Imperial College UK)",
      "BSc Civil Engineering",
    ],
    experience: "20+ years",
    bio: "Experienced across conceptual design, FEED, detailed design, EPC projects and structural integrity management, proficient in SACS, ETABS, STAAD, SAP2000 and ABAQUS.",
    photo: { src: "/assets/team/azam-khan.png", alt: "Dr Azam Khan" },
  },
  {
    name: "Dr Salwa Yassin",
    title: "Senior Geotechnical Engineer",
    credentials: [
      "PhD Geotechnical Engineering",
      "MSc Geotechnical Engineering",
      "BSc Civil Engineering",
      "CEng MICE",
      "CSCS",
    ],
    experience: "30+ years",
    bio: "Led geotechnical specialist teams on mega projects worldwide, spanning buildings, energy, transport, ports and marine infrastructure, with research interests in sustainability and problematic soils.",
    photo: { src: "/assets/team/salwa-yassin.png", alt: "Dr Salwa Yassin" },
  },
  {
    name: "Sirous Amiri Agha",
    title: "Engineering Geologist",
    credentials: [
      "MSc Geology",
      "BSc Geology",
      "Project Management Diploma",
      "RPGeo (Geotechnical and Engineering, Australia)",
      "Fellow GSL",
    ],
    experience: "25+ years",
    bio: "Works across Australia, the Middle East and Southeast Asia, leading engineering geology and geotechnical advisory for dams, tunnels, roads, rail, renewables and mines.",
    photo: { src: "/assets/team/sirous-amiri-agha.jpg", alt: "Sirous Amiri Agha" },
  },
  {
    name: "Zainab Bhatti",
    title: "Architect & Project Manager",
    credentials: [
      "Bachelor of Architecture",
      "Diploma in Construction Project Management (New Zealand)",
      "Certified Member, NZ Institute of Architects",
    ],
    bio: "Blends architectural design expertise with project management capability across large-scale commercial, residential and smart city developments — managing complex stakeholder engagement and integrated design delivery.",
    photo: { src: "/assets/team/zainab-bhatti.jpeg", alt: "Zainab Bhatti" },
  },
  {
    name: "Dr Syed Ali",
    title: "Geotechnical Engineer",
    credentials: [
      "PhD Geotechnical Engineering",
      "MSc Geo and Water Engineering",
      "BSc Mining Engineering",
    ],
    experience: "17+ years",
    bio: "Contributed to infrastructure across Australia, New Zealand and beyond through feasibility, detailed design and construction phases, proficient in GeoStudio, Plaxis, Midas GTS NX, FLAC 2D and the Rocscience suite.",
    photo: { src: "/assets/team/syed-ali.jpg", alt: "Dr Syed Ali" },
  },
  {
    name: "Sumbul Ahsan Khan",
    title: "Business Operations Manager",
    credentials: ["Bachelor of Commerce", "Diploma in Business", "CPA Associate"],
    experience: "4+ years",
    bio: "Background in auditing, financial services and business operations, specialising in quality frameworks, compliance and process improvement.",
    photo: { src: "/assets/team/sumbul-ahsan-khan.jpg", alt: "Sumbul Ahsan Khan" },
  },
  {
    name: "Micah Papasin",
    title: "Civil Engineer",
    credentials: ["MSc Civil Engineering (Swinburne University)", "BSc Civil Engineering"],
    experience: "5+ years",
    bio: "Involved in structural design, geotechnical investigations and project management, including residential building design, site inspections and geotechnical report preparation.",
    photo: { src: "/assets/team/micah-papasin.png", alt: "Micah Papasin" },
  },
  {
    name: "Rabbiya Aziz",
    title: "Project Administration Coordinator",
    credentials: [
      "Bachelor of Arts",
      "Diploma in Business Management",
      "Certificate in Business Administration and Computing",
    ],
    bio: "Results-driven professional experienced in corporate services, research management and administration — coordinating complex projects and HR processes.",
    photo: { src: "/assets/team/rabbiya-aziz.jpeg", alt: "Rabbiya Aziz" },
  },
  {
    name: "Ammar Alam",
    title: "Civil Engineer",
    credentials: ["MSc Civil Engineering", "BSc Civil Engineering"],
    bio: "Specialises in structural design of civil and building infrastructure, proficient in ETABS, SAP2000, SAFE, AutoCAD and Autodesk Revit.",
    photo: { src: "/assets/team/ammar-alam.jpeg", alt: "Ammar Alam" },
  },
];
