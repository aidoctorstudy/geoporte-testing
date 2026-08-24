import { AboutSection } from "./home/AboutSection";
import { ContactSection } from "./home/ContactSection";
import { HeroSection } from "./home/HeroSection";
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
      <ServicesSection />
      <StatsSection />
      <ProjectsSection />
      <ContactSection />
    </>
  );
};
