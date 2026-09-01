import Link from "next/link";
import { SectionHeading } from "@/components/common/SectionHeading";
import { TranslatedText } from "@/components/common/TranslatedText";
import { Magnetic } from "@/components/common/Magnetic";

export interface ServiceCtaProps {
  serviceTitle: string;
  /** Glass-panel treatment instead of a plain opaque background — the
   * Geotechnical page only, so its fixed Solaris background stays visible
   * through this section. See ADR in decisions-log.md. */
  glass?: boolean;
}

/** The closing CTA (item 6 of the service page spec) — a magnetic button
 * linking to the homepage's `#contact` section, matching the homepage
 * footer's CTA row pattern. */
export const ServiceCta = ({ serviceTitle, glass }: ServiceCtaProps) => {
  return (
    <section
      aria-labelledby="service-cta-heading"
      className={glass ? "relative z-10" : "bg-background border-line relative z-10 border-t"}
    >
      <div
        className={
          glass
            ? "glass-panel mx-auto my-8 flex max-w-6xl flex-col items-start gap-8 px-6 py-20 md:my-12 md:flex-row md:items-center md:justify-between md:px-8 md:py-24"
            : "mx-auto flex max-w-6xl flex-col items-start gap-8 px-6 py-20 md:flex-row md:items-center md:justify-between md:px-8 md:py-24"
        }
      >
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
