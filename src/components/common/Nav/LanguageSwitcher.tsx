"use client";

import { useEffect, useRef, useState } from "react";
import { languages } from "@/lib/i18n/languages";
import { useLanguageStore } from "@/hooks/i18n/use-language-store";

export const LanguageSwitcher = () => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const lang = useLanguageStore((state) => state.lang);
  const setLang = useLanguageStore((state) => state.setLang);
  const current = languages.find((language) => language.code === lang) ?? languages[0];

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
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="text-foreground-muted hover:text-foreground transition-colors duration-[var(--duration-fast)] ease-entrance flex items-center gap-1.5 text-sm"
      >
        <span aria-hidden="true">🌐</span>
        {current.nativeLabel}
      </button>

      <ul
        role="listbox"
        aria-label="Language"
        className={`border-line bg-background-alt/95 absolute end-0 top-full z-50 mt-3 w-36 rounded-xl border p-2 shadow-2xl backdrop-blur-xl transition-[opacity,transform] duration-[var(--duration-normal)] ease-entrance ${
          open
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-2 opacity-0"
        }`}
      >
        {languages.map((language) => (
          <li key={language.code} role="option" aria-selected={language.code === lang}>
            <button
              type="button"
              onClick={() => {
                setLang(language.code);
                setOpen(false);
              }}
              className={`hover:bg-surface hover:text-foreground w-full rounded-lg px-3 py-2 text-start text-sm transition-colors duration-[var(--duration-fast)] ease-entrance ${
                language.code === lang ? "text-foreground" : "text-foreground-muted"
              }`}
            >
              {language.nativeLabel}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};
