import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { services, getServiceBySlug } from "@/data/mocks/services";
import { generateMetadata as buildMetadata } from "@/utils/seo/generate-page-metadata";
import { getServiceStructuredData } from "@/utils/seo/structured-data";
import { getServiceAccentStyle } from "@/lib/scene/service-accent";
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

  return (
    // The per-service accent tint is a scoped CSS custom-property override —
    // the sanctioned Tier-2 theming mechanism (design-system.md rule 3), see
    // decisions-log.md.
    <div style={getServiceAccentStyle(service.slug)}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(getServiceStructuredData(service)) }}
      />
      <ServiceHero service={service} />
      <ServiceOverview service={service} />
      <ServiceSubServiceGrid subServices={service.subServiceGrid} />
      <ServiceProcess steps={service.processSteps} />
      <ServiceRelatedProjects serviceSlug={service.slug} />
      <ServiceCta serviceTitle={service.title} />
    </div>
  );
}
