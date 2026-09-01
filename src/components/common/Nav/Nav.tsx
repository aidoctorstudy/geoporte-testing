"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { services } from "@/data/mocks/services";
import { brand } from "@/lib/company";
import { TranslatedText } from "@/components/common/TranslatedText";
import { Magnetic } from "@/components/common/Magnetic";
import { GeoporteLogo } from "@/components/common/GeoporteLogo";
import { ServicesDropdown } from "./ServicesDropdown";
import { MobileMenu } from "./MobileMenu";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { isGlassBackgroundRoute } from "@/lib/scene/glass-background-routes";

const secondaryLinks = [
  { href: "/about", label: "About Us" },
  { href: "/about/team", label: "Our Team" },
  { href: "/projects", label: "Projects" },
  { href: "/publications", label: "Publications" },
];

export const Nav = () => {
  const [open, setOpen] = useState(false);
  // Every route with its own fixed full-page WebGL background
  // (`glass-background-routes.ts`) gets a darker, more transparent glass
  // tint so that background reads through the nav bar too.
  const glass = isGlassBackgroundRoute(usePathname());

  return (
    <>
      <header className="fixed inset-x-0 top-5 z-50 flex justify-center px-4">
        <div
          className={
            glass
              ? "border-line flex w-full max-w-[75rem] items-center justify-between gap-4 rounded-2xl border bg-background/60 px-5 py-3 backdrop-blur-xl"
              : "flex w-full max-w-[75rem] items-center justify-between gap-4 rounded-2xl border border-line bg-background-alt/70 px-5 py-3 backdrop-blur-xl"
          }
        >
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2.5 text-[0.9375rem] font-semibold tracking-[0.08em] text-foreground uppercase"
          >
            <span id="geoporte-nav-logo" className="inline-flex">
              <GeoporteLogo size={32} />
            </span>
            {brand.wordmark}
          </Link>

          <nav aria-label="Primary">
            <ul className="hidden items-center gap-7 text-sm md:flex">
              <ServicesDropdown services={services} />
              {secondaryLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-foreground-muted transition-colors duration-[var(--duration-fast)] ease-entrance hover:text-foreground"
                  >
                    <TranslatedText text={link.label} />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="hidden items-center gap-5 md:flex">
            <LanguageSwitcher />
            <Magnetic>
              <Link
                href="/contact"
                className="flex min-h-[44px] shrink-0 items-center rounded-lg bg-accent px-[1.125rem] text-sm font-medium text-accent-foreground transition-colors duration-[var(--duration-fast)] ease-entrance hover:bg-accent/90"
              >
                <TranslatedText text="Contact Us" />
              </Link>
            </Magnetic>
          </div>

          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
            className="flex h-[44px] w-[44px] flex-col items-center justify-center gap-[0.3125rem] md:hidden"
          >
            <span
              className={`h-px w-5 bg-foreground transition-transform duration-[var(--duration-fast)] ease-entrance ${open ? "translate-y-[0.34375rem] rotate-45" : ""}`}
            />
            <span
              className={`h-px w-5 bg-foreground transition-opacity duration-[var(--duration-fast)] ease-entrance ${open ? "opacity-0" : "opacity-100"}`}
            />
            <span
              className={`h-px w-5 bg-foreground transition-transform duration-[var(--duration-fast)] ease-entrance ${open ? "-translate-y-[0.34375rem] -rotate-45" : ""}`}
            />
          </button>
        </div>
      </header>

      <MobileMenu open={open} onNavigate={() => setOpen(false)} services={services} />
    </>
  );
};
