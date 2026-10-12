// 📖 Docs: obsidian/frontend/i18n.md
"use client";

import { useEffect, useState } from "react";
import { useLanguageStore } from "./use-language-store";
import { queueTranslation } from "@/lib/i18n/translation-queue";

/**
 * Returns `text` translated into the currently-selected language (see
 * `use-language-store.ts`) — English passes through unchanged. A cache hit
 * resolves synchronously; a miss queues a batched request
 * (`translation-queue.ts`) and re-renders once it resolves, showing the
 * English source in the meantime. Never throws — an upstream failure just
 * leaves the English source on screen, per ADR-0024/ADR-0088.
 */
export const useTranslated = (text: string): string => {
  const language = useLanguageStore((s) => s.language);
  const cached = useLanguageStore((s) =>
    language === "en" ? undefined : s.cache[language]?.[text],
  );
  const [resolved, setResolved] = useState<string | undefined>(cached);

  useEffect(() => {
    if (language === "en") return;
    if (cached !== undefined) {
      setResolved(cached);
      return;
    }
    let active = true;
    queueTranslation(language, text).then((value) => {
      if (active) setResolved(value);
    });
    return () => {
      active = false;
    };
  }, [language, text, cached]);

  return language === "en" ? text : resolved ?? text;
};
