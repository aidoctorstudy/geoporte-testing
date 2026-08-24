"use client";

import Link from "next/link";
import { Spring } from "@/components/animation/springs/spring";
import { TranslatedText } from "@/components/common/TranslatedText";
import type { Service } from "@/data/mocks/services";
import { contact } from "@/lib/company";
import { LanguageSwitcher } from "./LanguageSwitcher";

export interface MobileMenuProps {
  open: boolean;
  onNavigate: () => void;
  services: Service[];
}

const primaryLinks = [
  { href: "/about", label: "About Us" },
  { href: "/projects", label: "Projects" },
  { href: "/publications", label: "Publications" },
  { href: "/contact", label: "Contact" },
];

export const MobileMenu = ({ open, onNavigate, services }: MobileMenuProps) => {
  return (
    <Spring
      tag="div"
      enabled={open}
      from={{ opacity: 0, y: -16 }}
      to={{ opacity: 1, y: 0 }}
      config={{ tension: 280, friction: 32 }}
      style={{ pointerEvents: open ? "auto" : "none" }}
      className="fixed inset-0 z-40 flex flex-col overflow-y-auto bg-background/98 pt-24 pb-8 backdrop-blur-xl md:hidden"
      aria-hidden={!open}
    >
      <nav className="flex flex-1 flex-col gap-8 px-6">
        <LanguageSwitcher />

        <div>
          <p className="mb-3 text-xs tracking-[0.15em] text-foreground-muted uppercase">
            <TranslatedText text="Services" />
          </p>
          <ul className="grid grid-cols-1 gap-2">
            {services.map((service) => (
              <li key={service.slug}>
                <Link
                  href={`/services/${service.slug}`}
                  onClick={onNavigate}
                  className="block py-2 text-lg text-foreground"
                >
                  {service.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <ul className="flex flex-col gap-3 border-t border-line pt-6">
          {primaryLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                onClick={onNavigate}
                className="block py-2 text-xl text-foreground"
              >
                <TranslatedText text={link.label} />
              </Link>
            </li>
          ))}
        </ul>
        <a
          href={`mailto:${contact.email}`}
          className="mt-auto text-sm text-foreground-muted"
        >
          {contact.email}
        </a>
      </nav>
    </Spring>
  );
};
