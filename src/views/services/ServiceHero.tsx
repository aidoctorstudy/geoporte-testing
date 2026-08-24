import { SectionHeading } from "@/components/common/SectionHeading";
import { ServiceHeroScene } from "@/components/scene/ServiceHeroScene";
import type { Service } from "@/data/mocks/services";

export interface ServiceHeroProps {
  service: Service;
}

/**
 * Mirrors `HeroSection.tsx`'s structure (full-bleed scene + gradient overlay
 * + the page's single `<h1>`), parameterized by which bespoke scene to mount
 * — see `components/scene/service-heroes/index.ts`.
 */
export const ServiceHero = ({ service }: ServiceHeroProps) => {
  return (
    <section
      aria-labelledby="service-hero-heading"
      className="bg-background relative flex min-h-[70vh] items-center overflow-hidden"
    >
      <ServiceHeroScene className="absolute inset-0 h-full w-full" sceneTheme={service.sceneTheme} />
      <div
        aria-hidden="true"
        className="from-background via-background/75 to-background/15 absolute inset-0 bg-gradient-to-t"
      />

      <div className="relative z-10 mx-auto w-full max-w-6xl px-6 md:px-8">
        <SectionHeading
          id="service-hero-heading"
          tag="h1"
          eyebrow="Services"
          heading={service.title}
        />

        <p className="text-foreground-muted mt-6 max-w-xl text-lg">
          {service.shortDescription}
        </p>
      </div>
    </section>
  );
};
