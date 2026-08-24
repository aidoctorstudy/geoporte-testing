import { SectionHeading } from "@/components/common/SectionHeading";
import { Inview } from "@/components/animation/springs/in-view";
import type { ServiceSubService } from "@/data/mocks/services";

export interface ServiceSubServicesProps {
  subServices: ServiceSubService[];
}

export const ServiceSubServices = ({ subServices }: ServiceSubServicesProps) => {
  return (
    <section
      aria-labelledby="service-subservices-heading"
      className="mx-auto max-w-6xl px-6 py-16 md:px-8 md:py-24"
    >
      <SectionHeading
        id="service-subservices-heading"
        eyebrow="In depth"
        heading="Specialist offerings"
      />

      <ul className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {subServices.map((subService, index) => (
          <Inview
            key={subService.title}
            tag="li"
            mode="once"
            from={{ opacity: 0, y: 24 }}
            to={{ opacity: 1, y: 0 }}
            delayIn={(index % 3) * 100}
          >
            <article className="border-line bg-surface h-full rounded-2xl border p-6">
              <h3 className="text-foreground text-base font-medium">{subService.title}</h3>
              <p className="text-foreground-muted mt-3 text-sm leading-relaxed">
                {subService.description}
              </p>
            </article>
          </Inview>
        ))}
      </ul>
    </section>
  );
};
