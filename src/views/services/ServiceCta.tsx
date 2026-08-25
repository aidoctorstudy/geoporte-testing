import Link from "next/link";
import { SectionHeading } from "@/components/common/SectionHeading";
import { TranslatedText } from "@/components/common/TranslatedText";
import { Magnetic } from "@/components/common/Magnetic";

export interface ServiceCtaProps {
  serviceTitle: string;
}

/** The closing CTA (item 6 of the service page spec) — a magnetic button
 * linking to `/contact`, matching the homepage footer's CTA row pattern. */
export const ServiceCta = ({ serviceTitle }: ServiceCtaProps) => {
  return (
    <section
      aria-labelledby="service-cta-heading"
      className="border-line border-t"
    >
      <div className="mx-auto flex max-w-6xl flex-col items-start gap-8 px-6 py-20 md:flex-row md:items-center md:justify-between md:px-8 md:py-24">
        <SectionHeading
          id="service-cta-heading"
          eyebrow="Get in touch"
          heading={`Ready to start your ${serviceTitle} project?`}
          headingClassName="leading-display text-foreground max-w-xl text-2xl font-medium md:text-4xl"
        />

        <Magnetic>
          <Link
            href="/contact"
            className="bg-accent text-accent-foreground hover:bg-accent/90 shrink-0 rounded-full px-8 py-4 text-sm font-medium tracking-[0.08em] uppercase transition-colors duration-[var(--duration-fast)] ease-entrance"
          >
            <TranslatedText text="Contact Us" />
          </Link>
        </Magnetic>
      </div>
    </section>
  );
};
