import Link from "next/link";
import { SectionHeading } from "@/components/common/SectionHeading";
import { GeotechnicalFeaScene } from "@/components/scene/GeotechnicalFeaScene";
import { Magnetic } from "@/components/common/Magnetic";
import { TranslatedText } from "@/components/common/TranslatedText";

/**
 * Bespoke hero for the Geotechnical Engineering service page — replaces
 * `ServiceHero.tsx` for this one page (special-cased by slug in
 * `service-detail.tsx`) rather than extending that shared component, since
 * this brief's literal side-by-side "text left / large bounded 3D model
 * right (~55-65% of the visual area)" layout doesn't match any of
 * `ServiceHero.tsx`'s existing branches. See ADR-0061.
 *
 * Deliberately transparent — no opaque background here. Solaris keeps
 * rendering as this page's full-page fixed background
 * (`SolarisBackground.tsx`, mounted in `layout.tsx`, unchanged), showing
 * through around the frosted text panel and around the FEA scene's own
 * box, per explicit user direction: both scenes visible together, one
 * layered on the other, not one replacing the other. Reuses
 * `SectionHeading` directly (unlike the homepage Plexus section) because
 * this page's `--foreground`/`--foreground-muted` are already brightened
 * for glass pages (`glassReadabilityStyle` in `service-detail.tsx`), so
 * there's no light/dark token mismatch to work around here.
 *
 * The FEA scene's own bounded viewport (`GeotechnicalFeaScene`) is styled
 * as a light "instrument panel" (the `-engineering` tokens from
 * `globals.css`, shared with the homepage Plexus section) floating over
 * the dark Solaris background — satisfying the brief's "light or very
 * light neutral background" for the 3D model itself without requiring the
 * whole page to go light.
 */
export const GeotechnicalAnalysisHero = () => {
  return (
    <section
      aria-labelledby="service-hero-heading"
      className="relative flex min-h-[85vh] items-center overflow-hidden py-16"
    >
      <div className="relative z-10 mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-10 px-6 lg:grid-cols-[1fr_1.3fr] lg:gap-12 md:px-8">
        <div className="border-line bg-background-alt/75 rounded-2xl border p-8 backdrop-blur-xl md:p-10">
          <SectionHeading
            id="service-hero-heading"
            tag="h1"
            eyebrow="Services"
            heading="Advanced 3D Geotechnical Analysis"
          />
          <p className="text-foreground-muted mt-6 max-w-xl text-lg">
            <TranslatedText text="Model complex soil–structure interaction, excavation behaviour, foundations, tunnels and ground deformation using advanced three-dimensional finite element analysis." />
          </p>
          <div className="mt-8">
            <Magnetic>
              <Link
                href="#service-overview"
                className="bg-accent text-accent-foreground hover:bg-accent/90 transition-colors duration-[var(--duration-fast)] ease-entrance inline-flex items-center rounded-full px-8 py-4 text-sm font-medium tracking-[0.08em] uppercase"
              >
                <TranslatedText text="Explore Our Capabilities" />
              </Link>
            </Magnetic>
          </div>
        </div>

        <div
          className="border-line-engineering bg-surface-engineering relative h-[440px] w-full overflow-hidden rounded-2xl border shadow-2xl md:h-[600px]"
          data-cursor="canvas"
        >
          <GeotechnicalFeaScene className="h-full w-full" />
        </div>
      </div>
    </section>
  );
};
