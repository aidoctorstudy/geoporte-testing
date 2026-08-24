import { SectionHeading } from "@/components/common/SectionHeading";
import { Inview } from "@/components/animation/springs/in-view";
import type { ServiceCapabilityGroup } from "@/data/mocks/services";

export interface ServiceCapabilitiesProps {
  groups: ServiceCapabilityGroup[];
}

export const ServiceCapabilities = ({ groups }: ServiceCapabilitiesProps) => {
  return (
    <section
      aria-labelledby="service-capabilities-heading"
      className="bg-background-alt/40 border-line border-y py-16 md:py-24"
    >
      <div className="mx-auto max-w-6xl px-6 md:px-8">
        <SectionHeading
          id="service-capabilities-heading"
          eyebrow="Capabilities"
          heading="Where we add value"
        />

        <div className="mt-14 grid grid-cols-1 gap-8 md:grid-cols-2">
          {groups.map((group, index) => (
            <Inview
              key={group.heading}
              tag="article"
              mode="once"
              from={{ opacity: 0, y: 24 }}
              to={{ opacity: 1, y: 0 }}
              delayIn={(index % 2) * 100}
              className="border-line bg-surface rounded-2xl border p-6"
            >
              <h3 className="text-foreground text-lg font-medium">{group.heading}</h3>
              <ul className="text-foreground-muted mt-4 flex flex-col gap-2 text-sm leading-relaxed">
                {group.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </Inview>
          ))}
        </div>
      </div>
    </section>
  );
};
