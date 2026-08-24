"use client";

import { useEffect } from "react";
import { queueTranslation } from "@/lib/i18n/translation-queue";
import { useLanguageStore } from "./use-language-store";

/**
 * Translates a UI string (nav links, headings, button labels — see
 * obsidian/frontend/i18n.md) for the current language, via the cached,
 * batched `/api/translate` proxy. Returns the English source text
 * immediately while a translation is pending or unavailable.
 */
export const useTranslated = (text: string): string => {
  const lang = useLanguageStore((state) => state.lang);
  const cached = useLanguageStore((state) => state.cache[text]?.[lang]);

  useEffect(() => {
    if (lang !== "en" && !cached) queueTranslation(text, lang);
  }, [text, lang, cached]);

  return lang === "en" ? text : (cached ?? text);
};
