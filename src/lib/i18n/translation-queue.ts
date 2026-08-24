"use client";

import { apiFetch } from "@/lib/api-client";
import { useLanguageStore } from "@/hooks/i18n/use-language-store";
import type { LanguageCode } from "./languages";

/**
 * Batches every `useTranslated` request made within one tick into a single
 * `/api/translate` call per language, instead of one request per string.
 */

const pending = new Map<LanguageCode, Set<string>>();
const timers = new Map<LanguageCode, ReturnType<typeof setTimeout>>();

const BATCH_WINDOW_MS = 120;

const flush = async (lang: LanguageCode) => {
  const texts = Array.from(pending.get(lang) ?? []);
  pending.delete(lang);
  timers.delete(lang);
  if (texts.length === 0) return;

  try {
    const { translations } = await apiFetch<{ translations: string[] }>(
      "/api/translate",
      { method: "POST", body: JSON.stringify({ texts, targetLang: lang }) },
    );
    const { setCached } = useLanguageStore.getState();
    texts.forEach((text, i) => {
      const translated = translations[i];
      if (translated) setCached(text, lang, translated);
    });
  } catch {
    // Upstream failed — leave uncached, `useTranslated` keeps returning the
    // English source text (the required fallback behaviour).
  }
};

export const queueTranslation = (text: string, lang: LanguageCode) => {
  if (lang === "en") return;
  if (useLanguageStore.getState().cache[text]?.[lang]) return;

  let set = pending.get(lang);
  if (!set) {
    set = new Set();
    pending.set(lang, set);
  }
  set.add(text);

  if (!timers.has(lang)) {
    timers.set(
      lang,
      setTimeout(() => void flush(lang), BATCH_WINDOW_MS),
    );
  }
};
