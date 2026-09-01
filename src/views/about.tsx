import type { Metadata } from "next";
import Link from "next/link";
import { AboutHeading } from "@/views/home/AboutHeading";
import { TeamPanel } from "@/views/home/TeamPanel";
import { SectionHeading } from "@/components/common/SectionHeading";
import { Magnetic } from "@/components/common/Magnetic";
import { Inview } from "@/components/animation/springs/in-view";
import { generateMetadata as buildMetadata } from "@/utils/seo/generate-page-metadata";
import { TranslatedText } from "@/components/common/TranslatedText";
import { offices, experienceRegions, brand } from "@/lib/company";

export function generateMetadata(): Metadata {
  return buildMetadata({
    title: "About Us | Geoporte",
    description:
      "Geoporte leads in risk-based design and management of complex engineering projects — an agile team with decades of local and international experience.",
    url: "/about",
  });
}

// This page carries its own fixed Pinwheel Galaxy background (see
// `PinwheelGalaxyBackground.tsx`/`glass-background-routes.ts`), so every
// content section uses the `.glass-panel` treatment instead of an opaque
// one — same mechanism `publications.tsx` uses. `data-glass-readability`
// (globals.css) supplies the theme-aware --foreground/--foreground-muted
// override and text-shadow — see ADR-0064.
export function AboutView() {
  return (
    <div data-glass-readability>
      <section
        aria-labelledby="about-heading"
        className="glass-panel relative z-10 mx-auto mt-24 max-w-6xl px-6 py-16 md:mt-32 md:px-8 md:py-24"
      >
        <p className="text-foreground-muted mb-4 text-xs tracking-[0.3em] uppercase">
          <TranslatedText text="About Geoporte" />
        </p>
        <AboutHeading
          id="about-heading"
          tag="h1"
          className="leading-display text-foreground max-w-2xl text-3xl font-medium md:text-5xl"
        />

        <div className="mt-8 flex max-w-2xl flex-col gap-5">
          <Inview
            tag="p"
            mode="once"
            from={{ opacity: 0, y: 24 }}
            to={{ opacity: 1, y: 0 }}
            delayIn={100}
            className="text-foreground-muted text-base leading-relaxed md:text-lg"
          >
            <TranslatedText text={brand.mission} />
          </Inview>
          <Inview
            tag="p"
            mode="once"
            from={{ opacity: 0, y: 24 }}
            to={{ opacity: 1, y: 0 }}
            delayIn={160}
            className="text-foreground-muted text-base leading-relaxed md:text-lg"
          >
            <TranslatedText text="We work as a One Team with our clients, pairing cutting-edge digital tools and modelling with rigorous senior review — across building, transport, water, ports, marine and energy infrastructure." />
          </Inview>
        </div>
      </section>

      <section
        aria-labelledby="about-team-heading"
        className="glass-panel relative z-10 mx-auto my-8 max-w-6xl px-6 py-16 md:my-12 md:px-8 md:py-24"
      >
        <SectionHeading
          id="about-team-heading"
          eyebrow="Our people"
          heading="One team, decades of experience"
        />
        <div className="mt-14 max-w-lg">
          <TeamPanel />
        </div>
        <Magnetic className="mt-8">
          <Link
            href="/about/team"
            className="bg-accent text-accent-foreground hover:bg-accent/90 inline-flex min-h-[44px] items-center gap-2 rounded-full px-6 text-sm font-medium transition-colors duration-[var(--duration-fast)] ease-entrance"
          >
            <TranslatedText text="Meet Our Team" />
            <span aria-hidden="true">→</span>
          </Link>
        </Magnetic>
      </section>

      <section
        aria-labelledby="about-offices-heading"
        className="glass-panel relative z-10 mx-auto my-8 max-w-6xl px-6 py-16 md:my-12 md:px-8 md:py-24"
      >
        <SectionHeading
          id="about-offices-heading"
          eyebrow="Where we work"
          heading="Offices across Australia and New Zealand"
        />
        <Inview
          tag="ul"
          mode="once"
          from={{ opacity: 0, y: 24 }}
          to={{ opacity: 1, y: 0 }}
          className="mt-14 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4"
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

        <p className="text-foreground-muted mt-14 text-xs tracking-[0.2em] uppercase">
          <TranslatedText text="Project experience" />
        </p>
        <ul className="mt-4 flex flex-wrap gap-2">
          {experienceRegions.map((region, i) => (
            <Inview
              key={region}
              tag="li"
              mode="once"
              from={{ opacity: 0, scale: 0.5 }}
              to={{ opacity: 1, scale: 1 }}
              delayIn={i * 80}
              config={{ tension: 400, friction: 12 }}
              className="border-line text-foreground rounded-full border px-3 py-1 text-xs"
            >
              <TranslatedText text={region} />
            </Inview>
          ))}
        </ul>
      </section>

      <Inview
        tag="section"
        aria-label="Get in touch"
        mode="once"
        from={{ opacity: 0, y: 24 }}
        to={{ opacity: 1, y: 0 }}
        delayIn={100}
        className="glass-panel relative z-10 mx-auto my-8 max-w-6xl px-6 py-16 text-center md:my-12 md:px-8 md:py-24"
      >
        <p className="text-foreground text-lg font-medium">
          <TranslatedText text={brand.philosophy} />
        </p>
        <p className="text-foreground-muted mx-auto mt-3 max-w-md text-sm leading-relaxed">
          <TranslatedText text="Talk to us about your next project." />
        </p>
        <Link
          href="/contact"
          className="bg-accent text-accent-foreground hover:bg-accent/90 mt-6 inline-flex min-h-[44px] items-center rounded-lg px-6 text-sm font-medium transition-colors duration-[var(--duration-fast)] ease-entrance"
        >
          <TranslatedText text="Contact Geoporte" />
        </Link>
      </Inview>
    </div>
  );
}
