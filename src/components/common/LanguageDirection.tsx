"use client";

// 📖 Docs: obsidian/frontend/components/common.md

import { useEffect } from "react";
import { getLanguage } from "@/lib/i18n/languages";
import { useLanguageStore } from "@/hooks/i18n/use-language-store";

/**
 * Keeps `<html lang>` / `<html dir>` in sync with the chosen language —
 * flips to RTL for Arabic/Urdu. Renders nothing; mount once at the app root.
 */
export const LanguageDirection = (): null => {
  const lang = useLanguageStore((state) => state.lang);

  useEffect(() => {
    const { code, dir } = getLanguage(lang);
    document.documentElement.lang = code;
    document.documentElement.dir = dir;
  }, [lang]);

  return null;
};
