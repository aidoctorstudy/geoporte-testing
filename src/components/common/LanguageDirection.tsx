// 📖 Docs: obsidian/frontend/i18n.md
"use client";

import { useEffect } from "react";
import { useLanguageStore } from "@/hooks/i18n/use-language-store";
import { getLanguageDir } from "@/lib/i18n/languages";

/**
 * Hydrates the persisted language choice from `localStorage` on mount
 * (same "load once, after hydration" shape `Cookie.tsx` uses for its own
 * store), then keeps `<html lang>`/`dir` in sync with it — `dir="rtl"` for
 * Arabic/Urdu, `"ltr"` otherwise. Mounted once at the app root
 * (`layout.tsx`). Mutates the DOM directly rather than through JSX: the
 * root layout renders the `<html>` tag itself (hardcoded `lang="en"`), so
 * this leaf can only ever adjust it after the fact, client-side.
 */
export const LanguageDirection = () => {
  const language = useLanguageStore((s) => s.language);
  const hydrate = useLanguageStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = getLanguageDir(language);
  }, [language]);

  return null;
};
