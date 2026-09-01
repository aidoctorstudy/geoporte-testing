import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { SectionHeading } from "@/components/common/SectionHeading";
import { ContactForm } from "@/components/common/ContactForm";
import { Inview } from "@/components/animation/springs/in-view";
import { generateMetadata as buildMetadata } from "@/utils/seo/generate-page-metadata";
import { contact, offices } from "@/lib/company";

export function generateMetadata(): Metadata {
  return buildMetadata({
    title: "Contact Us | Geoporte",
    description:
      "Get in touch with Geoporte's engineering team — send a message or reach one of our Melbourne, Sydney, Perth or Auckland offices directly.",
    url: "/contact",
  });
}

// This page carries its own fixed Bird video background (see
// `BirdBackground.tsx`/`glass-background-routes.ts`), so every content
// section uses the `.glass-panel` treatment instead of an opaque one —
// same mechanism `publications.tsx`/`about.tsx` use, inlined here since
// this route isn't tied to a `Service`. Note this page builds its own
// content rather than reusing the homepage's `ContactSection`/
// `ContactTerrain` — that pair is designed for a plain, non-glass
// background (`ContactTerrain`'s own section-scoped WebGL office-marker
// terrain would compete with the new full-page video) and stays
// unchanged for the homepage. See the ADR for this page in
// decisions-log.md. `data-glass-readability` (globals.css) supplies the
// theme-aware --foreground/--foreground-muted override and text-shadow —
// see ADR-0064.

// "50% more liquid glass" — blur/saturation/border each scaled ×1.5 over
// the sitewide .glass-panel default, this page only. Same "swap the Tier 2
// role's value" override mechanism as service-detail.tsx's own
// stormwaterGlassStyle, just intensifying instead of thinning the glass.
// Fill is deliberately left at the sitewide default — see the token's own
// comment in globals.css for why. See the ADR for this page in
// decisions-log.md.
const intenseGlassStyle: CSSProperties = {
  "--glass-border": "var(--raw-color-glass-border-intense)",
  "--glass-blur": "var(--raw-blur-glass-intense)",
  "--glass-saturate": "var(--raw-saturate-glass-intense)",
} as CSSProperties;

export function ContactView() {
  return (
    <div style={intenseGlassStyle} data-glass-readability>
      <section
        aria-labelledby="contact-form-heading"
        className="glass-panel relative z-10 mx-auto mt-24 max-w-3xl px-6 py-16 md:mt-32 md:px-8 md:py-24"
      >
        <SectionHeading
          id="contact-form-heading"
          tag="h1"
          eyebrow="Contact"
          heading="Let's talk about your next project"
        />

        <Inview
          tag="div"
          mode="once"
          from={{ opacity: 0, y: 24 }}
          to={{ opacity: 1, y: 0 }}
          className="mt-12"
        >
          <ContactForm />
        </Inview>
      </section>

      <section
        aria-labelledby="contact-offices-heading"
        className="glass-panel relative z-10 mx-auto my-8 max-w-6xl px-6 py-16 md:my-12 md:px-8 md:py-24"
      >
        <SectionHeading
          id="contact-offices-heading"
          eyebrow="Get in touch"
          heading="Ready to engineer with confidence in complex ground?"
        />

        <div className="mt-14 grid grid-cols-1 gap-12 md:grid-cols-[1fr_1.4fr]">
          <Inview
            tag="address"
            mode="once"
            from={{ opacity: 0, y: 24 }}
            to={{ opacity: 1, y: 0 }}
            className="text-foreground not-italic"
          >
            <p>
              <a
                href={`mailto:${contact.email}`}
                className="hover:text-accent transition-colors duration-[var(--duration-fast)] ease-entrance text-2xl font-medium"
              >
                {contact.email}
              </a>
            </p>
            <p className="text-foreground-muted mt-2 text-sm">
              {contact.responseTime}
            </p>
            <ul className="mt-6 flex flex-col gap-2">
              {contact.phones.map((phone) => (
                <li key={phone.number} className="text-foreground-muted text-sm">
                  <a
                    href={`tel:${phone.number.replace(/[^+\d]/g, "")}`}
                    className="hover:text-foreground transition-colors duration-[var(--duration-fast)] ease-entrance"
                  >
                    {phone.number}
                  </a>{" "}
                  <span className="text-foreground-muted/60">
                    ({phone.region})
                  </span>
                </li>
              ))}
            </ul>
          </Inview>

          <Inview
            tag="ul"
            mode="once"
            from={{ opacity: 0, y: 24 }}
            to={{ opacity: 1, y: 0 }}
            delayIn={100}
            className="grid grid-cols-1 gap-x-8 gap-y-8 sm:grid-cols-2"
          >
            {offices.map((office) => (
              <li key={office.city}>
                <address className="not-italic">
                  <p className="text-foreground font-medium">{office.city}</p>
                  <p className="text-foreground-muted mt-1 text-sm">
                    {office.country}
                  </p>
                  <p className="text-foreground-muted/80 mt-2 text-sm">
                    {office.address}
                  </p>
                </address>
              </li>
            ))}
          </Inview>
        </div>
      </section>
    </div>
  );
}
