"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { services } from "@/data/mocks/services";
import { brand, contact, offices } from "@/lib/company";
import { primaryNavLinks } from "@/components/common/Nav/nav-links";
import { isGlassBackgroundRoute } from "@/lib/scene/glass-background-routes";

// Every route with its own fixed full-page WebGL background
// (`glass-background-routes.ts`) gets the footer's glass-panel treatment
// too, so that background stays visible all the way to the page bottom.

export const Footer = () => {
  const year = new Date().getFullYear();
  const glass = isGlassBackgroundRoute(usePathname());

  return (
    <footer
      className={
        glass
          ? "relative z-10"
          : "border-line bg-background-alt relative z-10 border-t"
      }
    >
      <div
        className={
          glass
            ? "glass-panel mx-auto my-8 max-w-6xl px-6 py-16 md:my-12 md:px-8 md:py-20"
            : "mx-auto max-w-6xl px-6 py-16 md:px-8 md:py-20"
        }
      >
        <div className="border-line flex flex-col gap-6 border-b pb-12 md:flex-row md:items-end md:justify-between md:gap-4">
          <div>
            <p className="text-foreground-muted text-xs uppercase tracking-[0.2em]">
              Let&apos;s talk
            </p>
            <h2 className="text-foreground mt-3 max-w-xl text-3xl leading-[1.15] font-medium md:text-4xl">
              Ready to engineer with confidence in complex ground?
            </h2>
          </div>
          <Link
            href="/contact"
            className="bg-accent text-accent-foreground hover:bg-accent/90 transition-colors duration-[var(--duration-fast)] ease-entrance inline-flex shrink-0 items-center justify-center rounded-full px-7 py-3 text-sm font-medium"
          >
            Contact Us
          </Link>
        </div>

        <div className="border-line grid grid-cols-1 gap-x-8 gap-y-10 border-b py-12 sm:grid-cols-2 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <p className="text-foreground text-sm font-semibold tracking-[0.18em]">
              {brand.wordmark}
            </p>
            <p className="text-foreground-muted mt-3 max-w-[26ch] text-sm">
              {brand.tagline} — {brand.mission}
            </p>
            <dl className="text-foreground-muted mt-6 flex flex-col gap-2 text-sm">
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
              {contact.phones.map((phone) => (
                <div key={phone.number}>
                  <dt className="sr-only">{phone.region} phone</dt>
                  <dd>
                    <a
                      href={`tel:${phone.number.replace(/[^+\d]/g, "")}`}
                      className="hover:text-foreground transition-colors duration-[var(--duration-fast)] ease-entrance"
                    >
                      {phone.number}
                    </a>{" "}
                    <span className="text-foreground-muted/60">
                      ({phone.region})
                    </span>
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div>
            <h3 className="text-foreground-muted text-xs uppercase tracking-[0.2em]">
              Services
            </h3>
            <ul className="mt-4 flex flex-col gap-2.5 text-sm">
              {services.map((service) => (
                <li key={service.slug}>
                  <Link
                    href={`/services/${service.slug}`}
                    className="text-foreground/80 hover:text-foreground transition-colors duration-[var(--duration-fast)] ease-entrance"
                  >
                    {service.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-foreground-muted text-xs uppercase tracking-[0.2em]">
              Company
            </h3>
            <ul className="mt-4 flex flex-col gap-2.5 text-sm">
              {primaryNavLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-foreground/80 hover:text-foreground transition-colors duration-[var(--duration-fast)] ease-entrance"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/contact"
                  className="text-foreground/80 hover:text-foreground transition-colors duration-[var(--duration-fast)] ease-entrance"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-foreground-muted text-xs uppercase tracking-[0.2em]">
              Offices
            </h3>
            <ul className="mt-4 flex flex-col gap-3 text-sm">
              {offices.map((office) => (
                <li key={office.city} className="text-foreground/80">
                  <span className="text-foreground block">{office.city}</span>
                  <span className="text-foreground-muted/70 text-xs">
                    {office.country}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="text-foreground-muted flex flex-col gap-2 pt-8 text-xs md:flex-row md:items-center md:justify-between">
          <p>
            © {year} {brand.wordmark}. All rights reserved.
          </p>
          <p>{brand.philosophy}</p>
        </div>
      </div>
    </footer>
  );
};
