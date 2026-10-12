// 📖 Docs: obsidian/frontend/i18n.md
"use client";

import { create } from "zustand";
import { DEFAULT_LANGUAGE, isLanguageCode, type LanguageCode } from "@/lib/i18n/languages";

const STORAGE_KEY = "geoporte:language";

/** Mirrors `cookieStore.ts`'s manual load/save shape (not zustand's `persist`
 * middleware) — reading `localStorage` synchronously at store-creation time
 * would run before hydration completes and disagree with the server-rendered
 * `<html lang="en">`, tripping the same class of hydration-mismatch bug
 * ADR-0087 fixed elsewhere. `hydrated` lets callers (here, `LanguageDirection`)
 * defer the real read to a `useEffect`. */
const loadLanguage = (): LanguageCode => {
  if (typeof window === "undefined") return DEFAULT_LANGUAGE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw && isLanguageCode(raw) ? raw : DEFAULT_LANGUAGE;
  } catch {
    return DEFAULT_LANGUAGE;
  }
};

const saveLanguage = (language: LanguageCode) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, language);
  } catch {
    /* ignore storage failures (private mode, quota) */
  }
};

interface LanguageStore {
  language: LanguageCode;
  /** True once the client has read the persisted language — guards against
   * an SSR/CSR mismatch on the very first render. */
  hydrated: boolean;
  hydrate: () => void;
  setLanguage: (language: LanguageCode) => void;
  /** `cache[language][sourceText] = translatedText` — a string is ever
   * translated at most once per language, for the lifetime of the tab. */
  cache: Record<string, Record<string, string>>;
  setCached: (language: LanguageCode, text: string, translated: string) => void;
}

export const useLanguageStore = create<LanguageStore>((set) => ({
  language: DEFAULT_LANGUAGE,
  hydrated: false,
  hydrate: () => set({ language: loadLanguage(), hydrated: true }),
  setLanguage: (language) => {
    saveLanguage(language);
    set({ language });
  },
  cache: {},
  setCached: (language, text, translated) =>
    set((state) => ({
      cache: {
        ...state.cache,
        [language]: { ...state.cache[language], [text]: translated },
      },
    })),
}));
