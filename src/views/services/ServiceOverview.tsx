import Image from "next/image";
import { SectionHeading } from "@/components/common/SectionHeading";
import { TranslatedText } from "@/components/common/TranslatedText";
import { ServiceStats } from "./ServiceStats";
import type { Service } from "@/data/mocks/services";

/** Real per-service photo downloaded from geoporte.com.au — see
 * obsidian/meta/decisions-log.md for why these are treated as a duotone
 * background layer here rather than used as literal hero images. */
const SERVICE_IMAGES: Record<string, string> = {
  "civil-engineering": "/assets/services/civil-engineering.jpeg",
  "design-and-drafting": "/assets/services/design-and-drafting.jpg",
  "geotechnical-engineering": "/assets/services/geotechnical-engineering.png",
  "structural-engineering": "/assets/services/structural-engineering.jpeg",
  "stormwater-and-flood-modelling": "/assets/services/stormwater-and-flood-modelling.jpg",
  "project-control-services": "/assets/services/project-control-services.jpg",
  "advisory-services": "/assets/services/advisory-services.jpeg",
  "telecom-services": "/assets/services/telecom-services.jpg",
};

export interface ServiceOverviewProps {
  service: Service;
}

/** `overview` and `capabilityGroups` were plain strings under ADR-0024's
 * original "nav/headings/buttons only" i18n scope; that scope was widened to
 * full page coverage (see the i18n note in decisions-log.md), so this body
 * copy now goes through `<TranslatedText>` too, same as everything else.
 *
 * `capabilityGroups` used to be its own `ServiceCapabilities` section; folded
 * in here so the page reads as the 6 sections the spec calls for without
 * dropping that real, previously-sourced content — see decisions-log.md. */
export const ServiceOverview = ({ service }: ServiceOverviewProps) => {
  const image = SERVICE_IMAGES[service.slug];
  // Only the Geotechnical page carries a fixed Solaris background worth
  // showing through the section — every other page keeps plain opaque
  // `bg-background`. See ADR in decisions-log.md.
  const glass = service.sceneTheme === "solaris";

  return (
    <section
      id="service-overview"
      aria-labelledby="service-overview-heading"
      className={glass ? "relative z-10" : "relative z-10 bg-background"}
    >
      {image && (
        // Confined to a top band, not the whole (tall — paragraph + stats +
        // capability lists) section: an overlay strong enough to keep text
        // legible against a full-height photo would have hidden the photo
        // almost entirely everywhere except a thin midpoint band. A defined
        // top band with its own bottom fade shows the photo for real while
        // the rest of the section sits on plain background.
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-80 overflow-hidden md:h-96"
        >
          <div className="absolute inset-0" style={{ filter: "grayscale(1) contrast(1.1)" }}>
            <Image
              src={image}
              alt=""
              fill
              sizes="100vw"
              className="object-cover opacity-50"
              priority={false}
            />
          </div>
          <div className="bg-accent/30 absolute inset-0 mix-blend-multiply" />
          {/* Fades to solid background at both the band's top edge (blends
              into the hero above, no hard seam) and bottom edge (blends into
              the plain-background content below) — the photo only reads
              clearly through a band in the middle. Glass mode fades to
              transparent instead: there's no solid section fill to blend
              into, and the Solaris canvas must stay visible through it. */}
          <div
            className={`absolute inset-0 bg-gradient-to-b from-0% via-transparent via-35% to-transparent ${glass ? "from-transparent" : "from-background"}`}
          />
          <div
            className={`absolute inset-0 bg-gradient-to-t from-0% via-transparent via-55% to-transparent ${glass ? "from-transparent" : "from-background"}`}
          />
        </div>
      )}

      <div
        className={
          glass
            ? "glass-panel relative z-10 mx-auto my-8 max-w-6xl px-6 py-16 md:my-12 md:px-8 md:py-24"
            : "relative z-10 mx-auto max-w-6xl px-6 py-16 md:px-8 md:py-24"
        }
      >
        <SectionHeading id="service-overview-heading" eyebrow="Overview" heading="What we deliver" />
        <p className="text-foreground-muted mt-6 max-w-3xl text-lg leading-relaxed">
          <TranslatedText text={service.overview} />
        </p>

        <ServiceStats stats={service.stats} />

        <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2">
          {service.capabilityGroups.map((group) => (
            <div key={group.heading}>
              <h3 className="text-foreground-muted text-xs tracking-[0.2em] uppercase">
                <TranslatedText text={group.heading} />
              </h3>
              <ul className="text-foreground-muted/90 mt-4 flex flex-col gap-1.5 text-sm leading-relaxed">
                {group.items.map((item) => (
                  <li key={item}>
                    <TranslatedText text={item} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Geotechnical's own, deeper 16-entry breakdown — the only service
            with this field populated (real content sourced from the live
            site's granular sub-pages, which this app consolidates into one
            page rather than 16 separate routes). */}
        {service.subServices && (
          <div className="mt-16">
            <h3 className="text-foreground-muted text-xs tracking-[0.2em] uppercase">
              <TranslatedText text="In more detail" />
            </h3>
            <dl className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
              {service.subServices.map((subService) => (
                <div key={subService.title}>
                  <dt className="text-foreground text-sm font-medium">
                    <TranslatedText text={subService.title} />
                  </dt>
                  <dd className="text-foreground-muted mt-1 text-sm leading-relaxed">
                    <TranslatedText text={subService.description} />
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </div>
    </section>
  );
};
