import type { Metadata } from "next";
import { SectionHeading } from "@/components/common/SectionHeading";
import { ServiceCard } from "@/components/common/ServiceCard";
import { Inview } from "@/components/animation/springs/in-view";
import { services } from "@/data/mocks/services";
import { generateMetadata as buildMetadata } from "@/utils/seo/generate-page-metadata";

export function generateMetadata(): Metadata {
  return buildMetadata({
    title: "Our Services | Geoporte",
    description: "Eight engineering disciplines, one team — civil, geotechnical, structural, stormwater, project controls, advisory and telecom services.",
    url: "/services",
  });
}

export function ServicesView() {
  return (
    <section
      aria-labelledby="services-heading"
      className="mx-auto max-w-6xl px-6 py-24 md:px-8 md:py-32"
    >
      <SectionHeading
        id="services-heading"
        tag="h1"
        eyebrow="What we do"
        heading="Eight disciplines, one team"
      />

      <ul className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((service, index) => (
          <Inview
            key={service.slug}
            tag="li"
            mode="once"
            from={{ opacity: 0, y: 24 }}
            to={{ opacity: 1, y: 0 }}
            delayIn={(index % 3) * 100}
          >
            <ServiceCard service={service} />
          </Inview>
        ))}
      </ul>
    </section>
  );
}
