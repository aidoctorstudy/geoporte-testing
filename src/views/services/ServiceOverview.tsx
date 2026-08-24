import { SectionHeading } from "@/components/common/SectionHeading";
import type { Service } from "@/data/mocks/services";

export interface ServiceOverviewProps {
  service: Service;
}

/** `overview` is per-service authored body copy, not app chrome — stays a
 * plain string, not `<TranslatedText>` (ADR-0024, i18n scope is nav/section
 * headings/button labels only). */
export const ServiceOverview = ({ service }: ServiceOverviewProps) => {
  return (
    <section
      aria-labelledby="service-overview-heading"
      className="mx-auto max-w-6xl px-6 py-16 md:px-8 md:py-24"
    >
      <SectionHeading id="service-overview-heading" eyebrow="Overview" heading="What we deliver" />
      <p className="text-foreground-muted mt-6 max-w-3xl text-lg leading-relaxed">
        {service.overview}
      </p>
    </section>
  );
};
