import type { Metadata } from "next";
import { generateMetadata as buildMetadata } from "@/utils/seo/generate-page-metadata";
import { teamMembers } from "@/data/mocks/team";
import { TeamCascade } from "./about-team/TeamCascade";

export function generateMetadata(): Metadata {
  return buildMetadata({
    title: "Our Team | Geoporte",
    description:
      "Meet the senior specialists who lead and deliver every Geoporte commission — decades of combined Gulf and international experience across geotechnical, tunnelling, structural and marine engineering.",
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
