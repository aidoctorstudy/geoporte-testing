"use client";

import { useEffect, useRef, useState } from "react";
import { useLanguageStore } from "@/hooks/i18n/use-language-store";
import { LANGUAGES } from "@/lib/i18n/languages";

/**
 * Nav language switcher — same dual open mechanism as `ServicesDropdown`
 * (hover for a fine pointer, tap/click for touch, both driving the same
 * panel classes). Selecting a language persists it via `useLanguageStore`
 * (`localStorage`, see `use-language-store.ts`); every `<TranslatedText>`/
 * `useTranslated()` call sitewide re-resolves against it on its own, no
 * per-page wiring needed. Restores ADR-0024, reversing ADR-0077 — see
 * ADR-0088.
 */
export const LanguageSwitcher = () => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const language = useLanguageStore((s) => s.language);
  const setLanguage = useLanguageStore((s) => s.setLanguage);
  const current = LANGUAGES.find((candidate) => candidate.code === language) ?? LANGUAGES[0];

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
    <div ref={containerRef} className="group relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label="Change language"
        className="text-foreground-muted flex min-h-[44px] items-center gap-1.5 text-sm transition-colors duration-[var(--duration-fast)] ease-entrance hover:text-foreground"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18" />
          <path d="M12 3a13 13 0 0 1 0 18 13 13 0 0 1 0-18Z" />
        </svg>
        {current.code.toUpperCase()}
      </button>
      <div
        className={`absolute right-0 top-full z-50 mt-6 w-44 -translate-y-2 rounded-xl border border-line bg-background-alt/95 p-2 opacity-0 shadow-2xl backdrop-blur-xl transition-[opacity,transform] duration-[var(--duration-normal)] ease-entrance group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:translate-y-0 group-focus-within:opacity-100 ${
          open ? "pointer-events-auto translate-y-0 opacity-100" : "pointer-events-none"
        }`}
      >
        <ul className="flex flex-col gap-0.5">
          {LANGUAGES.map((lang) => (
            <li key={lang.code}>
              <button
                type="button"
                onClick={() => {
                  setLanguage(lang.code);
                  setOpen(false);
                }}
                aria-current={lang.code === language}
                className={`flex min-h-[40px] w-full items-center justify-between rounded-lg px-3 text-sm transition-colors duration-[var(--duration-fast)] ease-entrance hover:bg-surface hover:text-foreground ${
                  lang.code === language ? "text-foreground" : "text-foreground-muted"
                }`}
              >
                {lang.nativeLabel}
                <span className="text-foreground-muted text-xs uppercase">{lang.code}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
