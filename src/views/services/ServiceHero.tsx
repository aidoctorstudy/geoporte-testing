import { SectionHeading } from "@/components/common/SectionHeading";
import { ServiceHeroScene } from "@/components/scene/ServiceHeroScene";
import { isGlassSceneTheme, type Service } from "@/data/mocks/services";

export interface ServiceHeroProps {
  service: Service;
}

// Full-bleed Solaris/Aether Flux (`isGlassSceneTheme`) are both dense/bright
// enough that plain text-on-gradient (every other service's hero) loses
// contrast against them — these pages get the "Creative Studio" template's
// own frosted glass band + orbit rings instead, ported from that GetLayers
// template's hero-background.tsx (simplified: a top band rather than its
// exact mask-cutout-window CSS trick — this page only needs the band, not
// the sharp window below it). See ADR-0039.

// Diameters as specified — each ring's top edge sits on the band's bottom
// edge and grows downward, so they nest pressed together at the top,
// fanning out like ripples (Creative Studio's own orbit-ring convention).
const RING_DIAMETERS_REM = [8, 24, 40, 56];

/**
 * Mirrors `HeroSection.tsx`'s structure (full-bleed scene + gradient overlay
 * + the page's single `<h1>`), parameterized by which bespoke scene to mount
 * — see `components/scene/service-heroes/index.ts`.
 */
export const ServiceHero = ({ service }: ServiceHeroProps) => {
  const useGlassPanel = isGlassSceneTheme(service.sceneTheme);

  return (
    <section
      aria-labelledby="service-hero-heading"
      className={`relative flex min-h-[70vh] items-start overflow-hidden ${useGlassPanel ? "" : "bg-background"}`}
    >
      {/* Solaris/Aether Flux render as a fixed, page-wide background instead
          (`SolarisBackground.tsx`/`AetherFluxBackground.tsx`, mounted in
          layout.tsx, z-index 0) — this section stays transparent so it
          shows through instead of mounting a second, section-scoped
          instance of the same heavy scene. */}
      {!useGlassPanel && (
        <ServiceHeroScene className="absolute inset-0 h-full w-full" sceneTheme={service.sceneTheme} />
      )}
      {!useGlassPanel && (
        <div
          aria-hidden="true"
          className="from-background via-background/75 to-background/15 absolute inset-0 bg-gradient-to-t"
        />
      )}

      {useGlassPanel ? (
        <div className="relative z-10 w-full">
          <div className="border-line bg-background-alt/80 border-b backdrop-blur-xl">
            <div className="mx-auto w-full max-w-6xl px-6 py-10 md:px-8 md:py-14">
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
          </div>

          {/* Orbit rings hanging from the glass band's bottom edge. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-full -translate-x-1/2"
          >
            {RING_DIAMETERS_REM.map((diameter) => (
              <span
                key={diameter}
                className="absolute left-1/2 top-0 -translate-x-1/2 rounded-full border border-white/10"
                style={{ width: `${diameter}rem`, height: `${diameter}rem` }}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="relative z-10 mx-auto w-full max-w-6xl self-center px-6 md:px-8">
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
      )}
    </section>
  );
};
