import type { Metadata } from "next";
import { generateMetadata as buildMetadata } from "@/utils/seo/generate-page-metadata";
import { contact } from "@/lib/company";
import { MaintenanceScene } from "@/components/scene/MaintenanceScene";
import {
  MaintenanceWordmark,
  MaintenanceHeading,
  MaintenanceSubtext,
} from "./maintenance/MaintenanceCopy";
import { MaintenanceDots } from "./maintenance/MaintenanceDots";

export function generateMetadata(): Metadata {
  return {
    ...buildMetadata({
      title: "We're improving your experience | Geoporte",
      description:
        "Our website is currently undergoing maintenance. We'll be back shortly.",
      url: "/maintenance",
    }),
    // Never index the maintenance page itself — it isn't real content, and
    // every other route redirects here while proxy.ts is active, so there's
    // nothing underneath it to rank anyway.
    robots: { index: false, follow: false },
  };
}

/**
 * Site-wide maintenance mode's landing page — every other route redirects
 * here while `proxy.ts` is active. See ADR-0109. `Nav.tsx`/`Footer.tsx` opt
 * out of rendering on this one route (their own pathname check) — the full
 * site chrome doesn't make sense when every link in it just bounces back
 * here.
 *
 * Background is a semi-transparent navy scrim, not opaque:
 * `PlanetBackground` (mounted at the app root, not route-gated out here via
 * `glass-background-routes.ts`) still renders behind it, so "full dark navy
 * background" and "keep the Earth globe as background" are both satisfied
 * at once — the same transparent-background technique `HeroSection.tsx`
 * uses for the homepage particle logo, just dialled toward "navy dominant,
 * globe subtle" rather than "globe dominant."
 */
export const MaintenanceView = () => {
  return (
    <section
      aria-labelledby="maintenance-heading"
      className="bg-background-maintenance/92 relative flex min-h-screen flex-col items-center justify-center gap-8 overflow-hidden px-6 py-24 text-center"
    >
      <div
        aria-hidden="true"
        data-cursor="canvas"
        className="border-line/30 relative h-[38vh] max-h-[420px] min-h-[220px] w-full max-w-2xl overflow-hidden rounded-2xl border shadow-2xl"
      >
        <MaintenanceScene />
      </div>

      <div className="relative z-10 flex max-w-xl flex-col items-center gap-6">
        <MaintenanceWordmark />
        <MaintenanceHeading
          id="maintenance-heading"
          text="We're improving your experience"
        />
        <MaintenanceSubtext text="Our website is currently undergoing maintenance. We'll be back shortly." />

        <MaintenanceDots />

        <p className="text-label text-xs tracking-[0.2em] uppercase">
          Back online soon
        </p>

        <dl className="text-foreground-muted mt-4 flex flex-col items-center gap-2 text-sm">
          <div>
            <dt className="sr-only">Email</dt>
            <dd>
              <a
                href={`mailto:${contact.email}`}
                className="hover:text-foreground transition-colors duration-[var(--duration-fast)] ease-entrance"
              >
                {contact.email}
              </a>
            </dd>
          </div>
          <div>
            <dt className="sr-only">Phone</dt>
            <dd>
              <a
                href={`tel:${contact.phones[0].number.replace(/[^+\d]/g, "")}`}
                className="hover:text-foreground transition-colors duration-[var(--duration-fast)] ease-entrance"
              >
                {contact.phones[0].number}
              </a>
            </dd>
          </div>
        </dl>
      </div>
    </section>
  );
};
