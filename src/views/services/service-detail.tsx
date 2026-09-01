import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { services, getServiceBySlug, isGlassSceneTheme } from "@/data/mocks/services";
import { generateMetadata as buildMetadata } from "@/utils/seo/generate-page-metadata";
import { getServiceStructuredData } from "@/utils/seo/structured-data";
import { getServiceAccentStyle } from "@/lib/scene/service-accent";
import { GeotechnicalAnalysisHero } from "./GeotechnicalAnalysisHero";
import { ServiceHero } from "./ServiceHero";
import { ServiceOverview } from "./ServiceOverview";
import { ServiceSubServiceGrid } from "./ServiceSubServiceGrid";
import { ServiceProcess } from "./ServiceProcess";
import { ServiceRelatedProjects } from "./ServiceRelatedProjects";
import { ServiceCta } from "./ServiceCta";

interface ServiceDetailPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return services.map((service) => ({ slug: service.slug }));
}

// `dynamicParams = false` lives directly in `app/services/[slug]/page.tsx`,
// not here — Next statically parses route segment config exports at compile
// time and errors if they're re-exported from another module, unlike
// `generateStaticParams`/`generateMetadata`/`default`.

export async function generateMetadata({ params }: ServiceDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const service = getServiceBySlug(slug);
  if (!service) return buildMetadata({ title: "Service not found" });

  return buildMetadata({
    title: `${service.title} | Geoporte`,
    description: service.shortDescription,
    url: `/services/${service.slug}`,
  });
}

export async function ServiceDetailPage({ params }: ServiceDetailPageProps) {
  const { slug } = await params;
  const service = getServiceBySlug(slug);
  if (!service) notFound();

  // Only the Geotechnical/Design & Drafting pages carry a fixed,
  // always-visible background worth showing through every section — every
  // other page's sections stay plain opaque `bg-background`. See
  // `GLASS_SCENE_THEMES` in services.ts and the ADR in decisions-log.md.
  const glass = isGlassSceneTheme(service.sceneTheme);

  // Readability boost, glass pages only — `data-glass-readability` (globals.css,
  // ADR-0064) supplies the theme-aware --foreground/--foreground-muted
  // override (brightening the sitewide muted-text colour, too low-contrast
  // against a busy scene in dark theme; dark ink in light theme) plus the
  // text-shadow every glass page needs against a busy, bright background —
  // set via the `data-glass-readability={glass || undefined}` attribute below.

  // Stormwater & Flood Modelling only — much more see-through glass so the
  // Negentropy particle field reads clearly through every section, plus a
  // stronger text-shadow to compensate (thinner glass backs body text with
  // less of its own darkness). Same "override the Tier 2 role's value"
  // mechanism as glassReadabilityStyle above, just a second, page-specific
  // variant of it. See the "-clear"/"-strong" tokens in globals.css.
  const stormwaterGlassStyle: CSSProperties =
    service.slug === "stormwater-and-flood-modelling"
      ? ({
          "--glass-fill": "var(--raw-color-glass-fill-clear)",
          "--glass-border": "var(--raw-color-glass-border-clear)",
          "--glass-blur": "var(--raw-blur-glass-clear)",
          "--glass-text-shadow": "var(--raw-shadow-glass-text-strong)",
        } as CSSProperties)
      : {};

  return (
    // The per-service accent tint is a scoped CSS custom-property override —
    // the sanctioned Tier-2 theming mechanism (design-system.md rule 3), see
    // decisions-log.md.
    <div
      style={{
        ...getServiceAccentStyle(service.slug),
        ...stormwaterGlassStyle,
      }}
      data-glass-readability={glass || undefined}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(getServiceStructuredData(service)) }}
      />
      {/* Geotechnical Engineering's hero is bespoke — a literal side-by-side
          text/bounded-3D-model layout `ServiceHero.tsx` doesn't otherwise
          support — rather than the shared glass-band pattern every other
          page (including this one's own Solaris background) uses. See
          ADR-0061. */}
      {service.slug === "geotechnical-engineering" ? (
        <GeotechnicalAnalysisHero />
      ) : (
        <ServiceHero service={service} />
      )}
      <ServiceOverview service={service} />
      <ServiceSubServiceGrid subServices={service.subServiceGrid} glass={glass} />
      <ServiceProcess steps={service.processSteps} glass={glass} />
      <ServiceRelatedProjects serviceSlug={service.slug} glass={glass} />
      <ServiceCta serviceTitle={service.title} glass={glass} />
    </div>
  );
}
