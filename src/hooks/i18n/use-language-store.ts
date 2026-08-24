"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { LanguageCode } from "@/lib/i18n/languages";

type TranslationCache = Record<string, Partial<Record<LanguageCode, string>>>;

export interface LanguageStore {
  lang: LanguageCode;
  cache: TranslationCache;
  setLang: (lang: LanguageCode) => void;
  setCached: (sourceText: string, lang: LanguageCode, translated: string) => void;
}

/**
 * Persisted (localStorage, key `geoporte-language`) so the chosen language
 * and every translation fetched so far survive a reload — satisfies "cache
 * translations in localStorage so it doesn't re-fetch every time".
 */
export const useLanguageStore = create<LanguageStore>()(
  persist(
    (set) => ({
      lang: "en",
      cache: {},
      setLang: (lang) => set({ lang }),
      setCached: (sourceText, lang, translated) =>
        set((state) => ({
          cache: {
            ...state.cache,
            [sourceText]: { ...state.cache[sourceText], [lang]: translated },
          },
        })),
    }),
    { name: "geoporte-language" },
  ),
);
