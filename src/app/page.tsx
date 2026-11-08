import type { Metadata } from "next";
import { generateMetadata as gen } from "@/utils/seo/generate-page-metadata";
import { HomeView } from "@/views/home";

export const metadata: Metadata = gen({
  title: "Geoporte Middle East | Geotechnical Engineering Consultants, Dubai",
  description:
    "Senior-led geotechnical, tunnelling, civil and structural engineering for rail, water, ports, roads and buildings across the UAE, Saudi Arabia and Qatar.",
  url: "/",
});

export default function Home() {
  return <HomeView />;
}
