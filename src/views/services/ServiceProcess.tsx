import { SectionHeading } from "@/components/common/SectionHeading";
import { Inview } from "@/components/animation/springs/in-view";

export interface ServiceProcessProps {
  steps: string[];
  /** Glass-panel treatment instead of a plain opaque background — the
   * Geotechnical page only, so its fixed Solaris background stays visible
   * through this section. See ADR in decisions-log.md. */
  glass?: boolean;
}

/** The "how we work" process timeline (item 4 of the service page spec) — a
 * numbered step sequence with a connecting line, each step staggering in on
 * scroll. Step count varies per service (5 or 6), so the grid is driven by
 * `steps.length` rather than a fixed column count. */
export const ServiceProcess = ({ steps, glass }: ServiceProcessProps) => {
  return (
    <section
      aria-labelledby="service-process-heading"
      className={glass ? "relative z-10" : "bg-background-alt/40 border-line relative z-10 border-y py-16 md:py-24"}
    >
      <div
        className={
          glass
            ? "glass-panel mx-auto my-8 max-w-6xl px-6 py-16 md:my-12 md:px-8 md:py-24"
            : "mx-auto max-w-6xl px-6 md:px-8"
        }
      >
        <SectionHeading id="service-process-heading" eyebrow="How we work" heading="Our process" />

        <ol
          className={`relative mt-16 grid grid-cols-1 gap-10 sm:grid-cols-2 lg:gap-6 ${
            steps.length === 6 ? "lg:grid-cols-6" : "lg:grid-cols-5"
          }`}
        >
          <div
            aria-hidden="true"
            className="border-line absolute top-4 right-0 left-0 hidden border-t lg:block"
          />
          {steps.map((step, index) => (
            <Inview
              key={step}
              tag="li"
              mode="once"
              from={{ opacity: 0, y: 20 }}
              to={{ opacity: 1, y: 0 }}
              delayIn={index * 100}
              className="relative flex flex-col gap-3"
            >
              <span className="bg-accent text-accent-foreground relative z-10 flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium">
                {index + 1}
              </span>
              <p className="text-foreground text-sm font-medium">
                {step}
              </p>
            </Inview>
          ))}
        </ol>
      </div>
    </section>
  );
};
