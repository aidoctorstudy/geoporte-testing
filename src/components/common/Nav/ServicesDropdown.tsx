"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Service } from "@/data/mocks/services";

export interface ServicesDropdownProps {
  services: Service[];
}

/**
 * Opens on hover for a fine pointer (plain CSS `group-hover`/`group-focus-
 * within`, per ADR-0014 — no layout/motion beyond opacity + a small
 * translate, so this stays CSS rather than a spring component) — **and**
 * on click/tap, via `open` state, since `:hover` alone is not a reliable
 * open mechanism on a touchscreen (a tablet in the `md:flex` desktop nav
 * is still a touch device). Both mechanisms drive the same panel classes,
 * so a mouse user gets the zero-JS hover convenience and a touch user gets
 * a real, predictable tap-to-open.
 */
export const ServicesDropdown = ({ services }: ServicesDropdownProps) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  return (
    <li ref={containerRef} className="group relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="true"
        aria-expanded={open}
        className="text-foreground-muted flex min-h-[44px] items-center transition-colors duration-[var(--duration-fast)] ease-entrance hover:text-foreground"
      >
        Services
      </button>
      <div
        className={`absolute left-1/2 top-full z-50 mt-6 w-[28rem] max-w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-2 rounded-xl border border-line bg-background-alt/95 p-6 opacity-0 shadow-2xl backdrop-blur-xl transition-[opacity,transform] duration-[var(--duration-normal)] ease-entrance group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:translate-y-0 group-focus-within:opacity-100 ${
          open ? "pointer-events-auto translate-y-0 opacity-100" : "pointer-events-none"
        }`}
      >
        <ul className="grid grid-cols-2 gap-x-6 gap-y-1">
          {services.map((service) => (
            <li key={service.slug}>
              <Link
                href={`/services/${service.slug}`}
                onClick={() => setOpen(false)}
                className="flex min-h-[44px] items-center rounded-lg px-3 text-sm text-foreground-muted transition-colors duration-[var(--duration-fast)] ease-entrance hover:bg-surface hover:text-foreground"
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
