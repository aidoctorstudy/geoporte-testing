import { SectionHeading } from "@/components/common/SectionHeading";
import { Inview } from "@/components/animation/springs/in-view";
import { ServiceCard } from "@/components/common/ServiceCard";
import { services } from "@/data/mocks/services";

export const ServicesSection = () => {
  return (
    <section
      id="services"
      aria-labelledby="services-heading"
      className="bg-background-alt/40 border-line border-y py-24 md:py-32"
    >
      <div className="mx-auto max-w-6xl px-6 md:px-8">
        <SectionHeading
          id="services-heading"
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
      </div>
    </section>
  );
};
