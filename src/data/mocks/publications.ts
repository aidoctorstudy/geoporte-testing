/**
 * Real Geoporte-associated technical publications, sourced from
 * geoporte.com.au/publications (three cover images, no accompanying
 * metadata on the live site itself — title/authors/venue below are read
 * directly off each cover image, not invented).
 */

export interface Publication {
  title: string;
  authors: string;
  venue: string;
  cover: { src: string; alt: string };
}

export const publications: Publication[] = [
  {
    title: "2022 AGS Victorian Symposium: Digital Geotechnics",
    authors: "Australian Geomechanics Society, Victorian Chapter",
    venue: "AGS Victoria Symposium, 26 October 2022",
    cover: {
      src: "/assets/publications/g13-688x1024-1.jpg",
      alt: "Cover of the 2022 AGS Victorian Symposium: Digital Geotechnics",
    },
  },
  {
    title: "Challenges to Digital Transformation in Geotechnical Engineering",
    authors: "Qaiser Hayat, Jack W Muir, Hamish E Nelson",
    venue: "2022 AGS Victoria Symposium — Digital Geotechnics",
    cover: {
      src: "/assets/publications/g12-1024x724-1.jpg",
      alt: "Cover slide of Challenges to Digital Transformation in Geotechnical Engineering",
    },
  },
  {
    title: "Technical Assessment of New Developments' Impact on Historical and Recent Tunnels in Melbourne",
    authors: "L. Yang, A.L. Bennett, Q. Hayat",
    venue: "Aurecon, Melbourne",
    cover: {
      src: "/assets/publications/g14-724x1024-1.jpg",
      alt: "First page of Technical Assessment of New Developments' Impact on Historical and Recent Tunnels in Melbourne",
    },
  },
];
