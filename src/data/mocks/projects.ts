/**
 * Geoporte's project showcase — real projects sourced from the "Projects"
 * page at geoporte.com.au, grouped into the site's own three categories.
 *
 * `image` — real photos supplied directly (a local `images/` folder, 27
 * files for these 27 projects), copied unchanged into
 * `public/assets/projects/`. The source filenames carry no project-to-photo
 * correspondence of their own (generic site/software-screenshot names, not
 * project-titled) — matches what ADR-0065/ADR-0071 already found scraping
 * the live site: no real per-project photography exists to map by content.
 * Assigned by position instead: the 27 files sorted alphabetically, zipped
 * 1:1 against this array in its existing order. See ADR-0073.
 */

export type ProjectCategory =
  | "Transport"
  | "Built Environment"
  | "Energy, Resources & Water";

export interface Project {
  title: string;
  location: string;
  country: string;
  category: ProjectCategory;
  sector: string;
  /** Placeholder detail copy shown in the project modal — swap for real
   * project write-ups when available. */
  description: string;
  image: {
    src: string;
    alt: string;
  };
}

export const projects: Project[] = [
  // Transport
  { title: "Healesville–Koo Wee Rup Road Upgrade", location: "Victoria", country: "Australia", category: "Transport", sector: "Civil Engineering", description: "Corridor grading, drainage and pavement design for a rural arterial upgrade, balancing constructability against a constrained floodplain crossing.", image: { src: "/assets/projects/2222.jpeg", alt: "Healesville–Koo Wee Rup Road Upgrade" } },
  { title: "Melbourne Airport", location: "Victoria", country: "Australia", category: "Transport", sector: "Civil Engineering", description: "Civil design support across airside and landside infrastructure works at one of Australia's busiest aviation hubs.", image: { src: "/assets/projects/Advisory-Photo.jpg", alt: "Melbourne Airport" } },
  { title: "Princes Highway East Rail Bridge", location: "Victoria", country: "Australia", category: "Transport", sector: "Civil Engineering", description: "Structural and civil design for a rail bridge replacement, sequenced to keep both road and rail corridors operating through construction.", image: { src: "/assets/projects/Cover-1.jpg", alt: "Princes Highway East Rail Bridge" } },
  { title: "Airport East Precinct", location: "Sydney, NSW", country: "Australia", category: "Transport", sector: "Civil Engineering", description: "Precinct-scale civil engineering for a transport-adjacent development, coordinating earthworks, drainage and utility corridors.", image: { src: "/assets/projects/GI-1.jpg", alt: "Airport East Precinct" } },
  { title: "Te Ahu a Turanga Manawatū Highway", location: "North Island", country: "New Zealand", category: "Transport", sector: "Civil Engineering", description: "Geotechnical and civil input to a major new highway alignment through steep, slip-prone terrain in the Manawatū Gorge replacement route.", image: { src: "/assets/projects/Linkedin-1.jpg", alt: "Te Ahu a Turanga Manawatū Highway" } },
  { title: "City Rail Link (CRL)", location: "Auckland", country: "New Zealand", category: "Transport", sector: "Civil Engineering", description: "Support on Auckland's largest transport infrastructure project — underground rail tunnels and stations through the CBD.", image: { src: "/assets/projects/MicroTBM-1.png", alt: "City Rail Link (CRL)" } },
  { title: "Etihad Rail", location: "Abu Dhabi", country: "UAE", category: "Transport", sector: "Civil Engineering", description: "Geotechnical and earthworks design along the UAE's national freight and passenger rail network.", image: { src: "/assets/projects/NZ-Handerson-Auckland-Trip-1.jpg", alt: "Etihad Rail" } },
  { title: "Dubai Metro Extension", location: "Dubai", country: "UAE", category: "Transport", sector: "Civil Engineering", description: "Civil and geotechnical design supporting an extension of the Dubai Metro network into newly developed districts.", image: { src: "/assets/projects/Plaxis-3D-A.png", alt: "Dubai Metro Extension" } },
  { title: "Dubai Water Canal", location: "Dubai", country: "UAE", category: "Transport", sector: "Civil Engineering", description: "Geotechnical assessment and marine-adjacent civil design along the Dubai Water Canal waterway corridor.", image: { src: "/assets/projects/Plaxis-3D-C.png", alt: "Dubai Water Canal" } },
  { title: "Hyderabad Metro Project", location: "Hyderabad", country: "India", category: "Transport", sector: "Civil Engineering", description: "Geotechnical investigation and design input for elevated and at-grade metro rail sections across the city.", image: { src: "/assets/projects/Plaxis-3D-D.png", alt: "Hyderabad Metro Project" } },
  { title: "Blackfriars Railway Bridge", location: "London", country: "United Kingdom", category: "Transport", sector: "Civil Engineering", description: "Structural assessment and design support for a heritage rail bridge crossing the Thames, balancing conservation with modern loading.", image: { src: "/assets/projects/Senior-1.jpg", alt: "Blackfriars Railway Bridge" } },
  { title: "Network Rail Osborne Station", location: "Kent", country: "United Kingdom", category: "Transport", sector: "Civil Engineering", description: "Civil and structural design for station infrastructure upgrades within the Network Rail estate.", image: { src: "/assets/projects/Senior-2.jpg", alt: "Network Rail Osborne Station" } },
  { title: "London Underground Maintenance Works", location: "London", country: "United Kingdom", category: "Transport", sector: "Civil Engineering", description: "Ongoing structural and geotechnical support for maintenance and renewal works across the Underground network.", image: { src: "/assets/projects/Senior-4.jpg", alt: "London Underground Maintenance Works" } },
  { title: "Network Rail Silkstream Junction", location: "England", country: "United Kingdom", category: "Transport", sector: "Civil Engineering", description: "Track and earthworks design at a key rail junction, sequenced around live operational possessions.", image: { src: "/assets/projects/Senior-6.jpg", alt: "Network Rail Silkstream Junction" } },

  // Built Environment
  { title: "Greensborough and Frankston Car Parks", location: "Melbourne, Victoria", country: "Australia", category: "Built Environment", sector: "Structural / Civil", description: "Structural design for multi-storey commuter car parks, optimised for cost-effective precast construction at two Melbourne rail stations.", image: { src: "/assets/projects/WhatsApp-Image-2023-07-23-at-4.07.08-PM-8-1.jpeg", alt: "Greensborough and Frankston Car Parks" } },
  { title: "Osborne Naval Shipbuilding Precinct", location: "Adelaide, South Australia", country: "Australia", category: "Built Environment", sector: "Built Environment", description: "Geotechnical and civil engineering for heavy-industrial shipbuilding infrastructure, including high-capacity hardstand and load-out facilities.", image: { src: "/assets/projects/WhatsApp-Image-2023-07-23-at-4.07.08-PM-9-1.jpeg", alt: "Osborne Naval Shipbuilding Precinct" } },
  { title: "Etihad Museum", location: "Dubai", country: "UAE", category: "Built Environment", sector: "Built Environment", description: "Geotechnical input for a landmark cultural building, coordinating foundation design with an architecturally ambitious form.", image: { src: "/assets/projects/WhatsApp-Image-2023-07-23-at-4.07.09-PM-4-1.jpeg", alt: "Etihad Museum" } },
  { title: "Marsa Al Seef Khor", location: "Dubai", country: "UAE", category: "Built Environment", sector: "Built Environment", description: "Waterfront redevelopment engineering along Dubai Creek, addressing marine geotechnical conditions and heritage-district constraints.", image: { src: "/assets/projects/WhatsApp-Image-2025-06-12-at-16.20.44_0392bd9b-scaled.jpg", alt: "Marsa Al Seef Khor" } },
  { title: "Sohar Industrial Port Company (SIPC)", location: "Sohar", country: "UAE", category: "Built Environment", sector: "Built Environment", description: "Geotechnical and civil design for industrial port facilities, including ground improvement for heavy plant foundations.", image: { src: "/assets/projects/WhatsApp-Image-2025-06-12-at-16.20.44_27b89dcb-scaled.jpg", alt: "Sohar Industrial Port Company (SIPC)" } },
  { title: "Dammam Industrial City 3", location: "Dammam", country: "Saudi Arabia", category: "Built Environment", sector: "Built Environment", description: "Infrastructure engineering for a large-scale industrial city development, covering earthworks, roads and utility corridors.", image: { src: "/assets/projects/WhatsApp-Image-2025-06-12-at-16.20.47_28786926-scaled.jpg", alt: "Dammam Industrial City 3" } },
  { title: "Sarb Artificial Islands", location: "Abu Dhabi", country: "UAE", category: "Built Environment", sector: "Built Environment", description: "Geotechnical assessment of reclaimed land for artificial island development, addressing settlement and ground improvement.", image: { src: "/assets/projects/Yarraman-1.jpg", alt: "Sarb Artificial Islands" } },
  { title: "Yas Island Development", location: "Abu Dhabi", country: "UAE", category: "Built Environment", sector: "Built Environment", description: "Civil and geotechnical design across a mixed-use island development spanning leisure, hospitality and residential precincts.", image: { src: "/assets/projects/Yarraman-3.jpg", alt: "Yas Island Development" } },

  // Energy, Resources & Water
  { title: "AGL Torrens Island Battery Facility", location: "Adelaide, South Australia", country: "Australia", category: "Energy, Resources & Water", sector: "Energy", description: "Civil and structural design for grid-scale battery storage infrastructure, supporting South Australia's renewable energy transition.", image: { src: "/assets/projects/Yarraman-4.jpg", alt: "AGL Torrens Island Battery Facility" } },
  { title: "Strategic Tunnel Enhancement Programme (STEP)", location: "Abu Dhabi", country: "UAE", category: "Energy, Resources & Water", sector: "Infrastructure", description: "Geotechnical engineering for a deep tunnel sewerage network upgrade beneath Abu Dhabi's urban core.", image: { src: "/assets/projects/Yarraman-5.jpg", alt: "Strategic Tunnel Enhancement Programme (STEP)" } },
  { title: "Pakistan Gasport Liquefied Natural Gas Berth", location: "Karachi", country: "Pakistan", category: "Energy, Resources & Water", sector: "Energy", description: "Geotechnical and marine civil engineering for an LNG import berth, addressing challenging coastal ground conditions.", image: { src: "/assets/projects/Yarraman-9.jpeg", alt: "Pakistan Gasport Liquefied Natural Gas Berth" } },
  { title: "Das Island Accommodation Project", location: "Das Island, Abu Dhabi", country: "UAE", category: "Energy, Resources & Water", sector: "Infrastructure", description: "Civil and structural design for offshore accommodation infrastructure serving an active oil and gas processing island.", image: { src: "/assets/projects/g21.png", alt: "Das Island Accommodation Project" } },
  { title: "Hamriyah Free Zone Fuel Pipe Protection Works", location: "Sharjah", country: "UAE", category: "Energy, Resources & Water", sector: "Energy / Infrastructure", description: "Protective works design for fuel pipeline infrastructure within an active industrial free zone.", image: { src: "/assets/projects/g22-1.png", alt: "Hamriyah Free Zone Fuel Pipe Protection Works" } },
];

export const projectCategories: ProjectCategory[] = [
  "Transport",
  "Built Environment",
  "Energy, Resources & Water",
];

/** Countries of hands-on experience, derived from the project list above. */
export const experienceCountryCount = new Set(projects.map((p) => p.country))
  .size;
