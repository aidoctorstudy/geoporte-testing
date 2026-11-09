/**
 * Geoporte insights articles and publications for www.geoporte.ae.
 *
 * Source: Geoporte ME Website Content and Build Brief, Rev 0,
 * 2 November 2026, Sections 10.1–10.3.
 *
 * Three launch articles (approved for publication pending Qaiser sign-off).
 * Articles marked [CONFIRM] in the brief are included but noted below.
 */

export interface InsightArticle {
  slug: string;
  title: string;
  /** Short summary for the index card and og:description. */
  excerpt: string;
  metaTitle: string;
  metaDescription: string;
  /** Full article body — paragraphs as array. */
  body: string[];
  /** ISO 8601 date published (or expected launch date). */
  date: string;
  author: string;
  category: "Technical note" | "Ground conditions" | "Project insight";
}

export const articles: InsightArticle[] = [
  {
    slug: "crushed-carbonate-fills-settlement",
    title: "Crushed carbonate fills keep settling",
    excerpt:
      "Reworked limestone fills — crushed Simsima and Rus — are widely used as pipeline fill in Qatar and across the Gulf. Our back-analysis tells a different story than the stiff granular fill they are often treated as.",
    metaTitle: "Crushed Carbonate Fill Settlement — What Back-Analysis Shows | Geoporte",
    metaDescription:
      "Working stiffness of crushed Simsima and Rus fills is typically 30 to 80 MPa — an order lower than often assumed. Creep and wetting collapse can add five to ten times the immediate settlement over a service life.",
    date: "2026-11-01",
    author: "Qaiser Hayat",
    category: "Technical note",
    body: [
      "Reworked limestone fills, such as crushed Simsima and Rus material, are widely used as structural and pipeline fill in Qatar and across the Gulf. They are often treated as stiff granular fill. Our back-analysis on large-diameter pipelines at reservoir pumping stations told a different story.",
      "Working stiffness of these fills is typically about 30 to 80 MPa, an order lower than often assumed. Immediate settlement under pipelines is small, but creep, particle breakage and wetting collapse can add five to ten times as much over the service life. Flexible couplings designed for the immediate settlement alone may then open and leak.",
      "The mechanism is not well captured by standard granular fill design practice. Calcareous particles are angular and brittle. Under sustained load, particle breakage reduces void ratio progressively, and the rate depends on stress level, particle size and the degree of saturation. When the groundwater table rises — or when a pipeline joint leaks and wets the surrounding fill — wetting collapse adds a step change in settlement on top of the creep already accumulated.",
      "Design implications: use realistic moduli derived from testing and back-analysis, treat creep and wetting explicitly, and specify compaction and moisture control that limits collapse potential. Where assets are already in service, monitoring and a calibrated model give a defensible basis for remediation.",
      "On a recent commission in Qatar, we re-evaluated residual settlement at five reservoir pumping stations using realistic moduli for crushed Simsima and Rus fills and an explicit treatment of long-term creep and wetting collapse. The revised analysis gave the remediation design a defensible basis and informed the bedding and backfill specification for replacement pipeline sections.",
    ],
  },
  {
    slug: "gulf-ground-conditions",
    title: "Reading Gulf ground: six conditions that change a design",
    excerpt:
      "Gulf ground changes quickly over short distances. Six conditions account for most surprises on investigation, foundation and tunnelling projects across the region.",
    metaTitle: "Six Gulf Ground Conditions That Change a Design | Geoporte Middle East",
    metaDescription:
      "Sabkha, calcareous sands, reclaimed fills, cemented caprock, karstic limestone and collapsible soils — what to look for, how to scope the investigation and how each condition affects design.",
    date: "2026-11-01",
    author: "Qaiser Hayat",
    category: "Ground conditions",
    body: [
      "Gulf ground changes quickly over short distances. Six conditions account for most surprises on investigation, foundation and tunnelling projects across the region.",
      "Sabkha with shallow saline groundwater: sabkha is a salt-encrusted evaporite deposit formed in coastal and inland areas with high evaporation. It is weak, compressible and aggressive to concrete and steel. Foundations must bear below the sabkha zone; dewatering during construction must manage the aggressive groundwater; and durability design must specify the right cement type and cover. A desk study that maps sabkha extent and depth before investigation scoping saves time and cost on sites where the deposit is variable.",
      "Calcareous sands that crush and creep: carbonate sands are weaker than silica sands of equivalent density. CPT tip resistance and friction ratio differ, and silica-sand correlations for relative density and stiffness over-predict both. Piles in calcareous sand perform differently to piles in silica sand of the same CPT profile — the skin friction is lower and more displacement is needed to mobilise it. Settlements under sustained load include a creep component that continues well beyond the immediate response.",
      "Reclaimed and dredged fills of variable density: reclaimed fills across the Gulf range from well-compacted hydraulic fill to loose, uncontrolled dumped fill with zones of very low density. Variability within a single island or plot can be high. Liquefaction under seismic loading is a design consideration for loose fills, and verification testing after ground improvement is essential.",
      "Cemented caprock over weaker layers: a surface layer of cemented sand or weak rock — cemented by carbonates or sulphates — is common across the Gulf. It can mislead a shallow investigation: a few metres of firm material gives a false impression of a good founding stratum. The weak material beneath can control settlement, slope stability and pile capacity. Penetrating the caprock in the investigation programme, and understanding what lies beneath it, is not optional.",
      "Karstic limestone with cavities: the Miocene and older limestones of Bahrain, Qatar and parts of the UAE are karstic. Cavities, dissolution pipes and weak zones are found at depths that affect deep foundations and tunnels. Geophysical surveys, closely-spaced probing and careful borehole logging are needed to characterise the cavity risk before design commitments are made.",
      "Collapsible and expansive desert soils: aeolian and alluvial soils in desert areas can collapse on wetting — a sudden reduction in void ratio when the soil is saturated under load. Expansive soils swell on wetting and can lift lightly-loaded floor slabs and pavements. Both require laboratory testing to identify and quantify, and design to either avoid or accommodate the volume change.",
    ],
  },
  {
    slug: "protecting-live-assets-riyadh",
    title: "Protecting live assets with an independent ground model",
    excerpt:
      "Riyadh's mixed limestone, weathered rock and soil profiles punish generic parameters. On recent commissions beside a live bridge and next to 17 buried utilities, we built an independent ground model from first principles before relying on it for design.",
    metaTitle: "Independent Ground Model for Live Asset Protection, Riyadh | Geoporte",
    metaDescription:
      "How back-analysis, staged PLAXIS modelling, saturation sensitivity and trigger levels with agreed response actions protected a live multi-span bridge and 17 utilities during adjacent deep excavation in Riyadh.",
    date: "2026-11-01",
    author: "Qaiser Hayat",
    category: "Project insight",
    body: [
      "Riyadh's mixed limestone, weathered rock and soil profiles punish generic parameters. On recent commissions beside a live bridge and next to 17 buried utilities, we built an independent ground model from first principles, tested it against measured movements, and only then relied on it for design.",
      "The commission was a construction impact assessment for deep cut slopes, L-walls and rock bolting beside the piers of a multi-span reinforced concrete bridge in service. The bridge piers were monitored throughout the adjacent excavation; pier movements had already been measured before we were appointed.",
      "We began with back-analysis: fitting a PLAXIS 2D model of the previous, smaller excavation stage to the measured pier movements. This gave us a calibrated set of stiffness and strength parameters for the variable limestone and weathered rock profile — not the textbook defaults, but values that reproduced what had actually happened at this site.",
      "With a calibrated model, we ran the subsequent excavation stages with 3D PLAXIS models, including sensitivity to changes in rock mass parameters and to the effect of groundwater rising above the design level. The 3D models resolved the influence of different excavation sequences, L-wall positions and rock bolt patterns on each pier individually.",
      "Settlement troughs were computed for each construction stage at 0.5, 1 and 2 per cent volume loss, covering the range from well-controlled to poorly-controlled earthworks. Impact checks on the 17 buried utilities followed the settlement trough predictions to assess joint opening, pipe bending and thrust block movement.",
      "Monitoring trigger levels and response actions were agreed with the delivery team before excavation started. Each trigger corresponded to a specific modelled scenario, so the response action — slow down, review, stop — was justified by the analysis rather than chosen conservatively. This gave the contractor a framework for decision-making that was clear, proportionate and defensible.",
    ],
  },
];

export interface Publication {
  authors: string;
  title: string;
  venue: string;
  year: number;
  /** [CONFIRM] flag for items pending verification. */
  confirm?: string;
}

/** Publications list from brief Section 10.3. */
export const publications: Publication[] = [
  {
    authors: "Hayat Q., Muir J.W., Nelson H.E.",
    title: "Challenges to Digital Transformation in Geotechnical Engineering",
    venue: "AGS Victoria Symposium: Digital Geotechnics, 26 October 2022",
    year: 2022,
  },
  {
    authors: "Yang L., Bennett A.L., Hayat Q.",
    title:
      "Technical Assessment of New Developments' Impact on Historical and Recent Tunnels in Melbourne",
    venue: "Unpublished",
    year: 2022,
  },
  {
    authors: "Yassin S.",
    title: "Code Companion to the Saudi Soils and Foundation Code (SBC 303)",
    venue: "International Code Council (ICC)",
    year: 2022,
    confirm: "Full citation and year to be confirmed",
  },
];
