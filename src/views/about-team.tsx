import type { Metadata } from "next";
import { generateMetadata as buildMetadata } from "@/utils/seo/generate-page-metadata";
import { teamMembers } from "@/data/mocks/team";
import { TeamCascade } from "./about-team/TeamCascade";

export function generateMetadata(): Metadata {
  return buildMetadata({
    title: "Our Team | Geoporte",
    description:
      "Meet Geoporte's specialist engineers and geologists — decades of combined AU/NZ and global experience across civil, structural, geotechnical and telecom infrastructure.",
    url: "/about/team",
  });
}

/**
 * As of ADR-0076, this route is a CSS-3D-only "Cards Cascade"
 * (`TeamCascade`, `about-team/`) instead of "Mirror Hall" (ADR-0074), the
 * WebGL carousel this route used previously — an explicit later brief
 * asked for the WebGL/canvas approach to be replaced outright with a pure
 * CSS 3D transform deck. `TeamCascade` owns its own in-page hero
 * ("GEOPORTE · Our People" / "Our Team" / "The specialists behind every
 * project" / "Meet the team"), so this Server Component does nothing but
 * hand the real roster to it. `teamMembers` (`@/data/mocks/team`) is
 * passed through unchanged — no second copy of the roster exists.
 */
export function AboutTeamView() {
  return <TeamCascade members={teamMembers} />;
}
