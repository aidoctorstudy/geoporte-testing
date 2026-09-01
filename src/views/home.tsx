import { AboutSection } from "./home/AboutSection";
import { ContactSection } from "./home/ContactSection";
import { GeotechnicalPlexusSection } from "./home/GeotechnicalPlexusSection";
import { HeroSection } from "./home/HeroSection";
import { ProjectExperienceSection } from "./home/ProjectExperienceSection";
import { ProjectsSection } from "./home/ProjectsSection";
import { ServicesSection } from "./home/ServicesSection";
import { StatsSection } from "./home/StatsSection";

/**
 * Home view — a Server Component. `RootLayout` owns the page's single <main>
 * landmark, so this renders a fragment of sections, not its own <main>.
 */
export const HomeView = () => {
  return (
    <>
      <HeroSection />
      <AboutSection />
      <GeotechnicalPlexusSection />
      <ServicesSection />
      <ProjectExperienceSection />
      <StatsSection />
      <ProjectsSection />
      <ContactSection />
    </>
  );
};
