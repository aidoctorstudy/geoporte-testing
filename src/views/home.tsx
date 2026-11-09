import { AboutSection } from "./home/AboutSection";
import { ContactSection } from "./home/ContactSection";
import { GeotechnicalPlexusSection } from "./home/GeotechnicalPlexusSection";
import { HeroSection } from "./home/HeroSection";
import { ProjectExperienceSection } from "./home/ProjectExperienceSection";
import { ProjectsSection } from "./home/ProjectsSection";
import { ServicesSection } from "./home/ServicesSection";
import { StatsSection } from "./home/StatsSection";
import { HowWeWorkSection } from "./home/HowWeWorkSection";
import { SectorsSection } from "./home/SectorsSection";
import { RecentCommissionsSection } from "./home/RecentCommissionsSection";
import { TeamExperienceSection } from "./home/TeamExperienceSection";
import { WhoWeWorkForSection } from "./home/WhoWeWorkForSection";
import { InsightTeaserSection } from "./home/InsightTeaserSection";
import { TeamCtaSection } from "./home/TeamCtaSection";

/**
 * Home view — a Server Component. `RootLayout` owns the page's single <main>
 * landmark, so this renders a fragment of sections, not its own <main>.
 *
 * Section order per brief Rev 0 (2 November 2026):
 *   A  Hero
 *   B  About / intro
 *   C  Services (what we do)
 *   D  Sectors (where we work) — 8 sector cards
 *   E  How we work / GeotechnicalPlexus
 *   F  Recent Geoporte commissions (4 featured cards: C1, C2, C5, C6)
 *   G  Team experience carousel (T1, T4, T7, T8, T14, T19)
 *      Stats strip (4 approved numbers)
 *   H  Who we work for (4-row table)
 *   I  Insight teaser (Crushed carbonate fills)
 *      Full projects grid
 *   K  Team portrait row + closing CTA
 *      Contact
 */
export const HomeView = () => {
  return (
    <>
      <HeroSection />
      <AboutSection />
      <ServicesSection />
      <SectorsSection />
      <GeotechnicalPlexusSection />
      <HowWeWorkSection />
      <ProjectExperienceSection />
      <RecentCommissionsSection />
      <TeamExperienceSection />
      <StatsSection />
      <WhoWeWorkForSection />
      <InsightTeaserSection />
      <ProjectsSection />
      <TeamCtaSection />
      <ContactSection />
    </>
  );
};
