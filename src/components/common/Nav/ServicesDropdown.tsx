import Link from "next/link";
import { TranslatedText } from "@/components/common/TranslatedText";
import type { Service } from "@/data/mocks/services";

export interface ServicesDropdownProps {
  services: Service[];
}

/**
 * Hover-open only (no layout/motion beyond opacity + a small translate), so
 * this stays plain CSS per the project's ADR-0014 exception rather than a
 * spring component — see obsidian/frontend/design-system.md.
 */
export const ServicesDropdown = ({ services }: ServicesDropdownProps) => {
  return (
    <li className="group relative">
      <button
        type="button"
        className="text-foreground-muted transition-colors duration-[var(--duration-fast)] ease-entrance hover:text-foreground"
        aria-haspopup="true"
      >
        <TranslatedText text="Services" />
      </button>
      <div
        className="pointer-events-none absolute left-1/2 top-full z-50 mt-6 w-[28rem] -translate-x-1/2 -translate-y-2 rounded-xl border border-line bg-background-alt/95 p-6 opacity-0 shadow-2xl backdrop-blur-xl transition-[opacity,transform] duration-[var(--duration-normal)] ease-entrance group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:translate-y-0 group-focus-within:opacity-100"
      >
        <ul className="grid grid-cols-2 gap-x-6 gap-y-3">
          {services.map((service) => (
            <li key={service.slug}>
              <Link
                href={`/services/${service.slug}`}
                className="block rounded-lg px-3 py-2 text-sm text-foreground-muted transition-colors duration-[var(--duration-fast)] ease-entrance hover:bg-surface hover:text-foreground"
              >
                {service.title}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </li>
  );
};
