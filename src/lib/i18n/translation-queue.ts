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
/** Matches the `/api/translate` route's own `zod` cap (`texts` max length 50)
 * — a page with enough on-screen strings (a full project grid, a bio-heavy
 * team page) can queue well past that in one 120ms window, and the route
 * rejects the whole array, not just the overflow. Chunk client-side so one
 * busy page can't silently fail every pending translation. */
const MAX_TEXTS_PER_REQUEST = 50;

const chunk = <T,>(items: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size));
  return chunks;
};

const flush = async (lang: LanguageCode) => {
  const texts = Array.from(pending.get(lang) ?? []);
  pending.delete(lang);
  timers.delete(lang);
  if (texts.length === 0) return;

  const { setCached } = useLanguageStore.getState();

  await Promise.all(
    chunk(texts, MAX_TEXTS_PER_REQUEST).map(async (batch) => {
      try {
        const { translations } = await apiFetch<{ translations: string[] }>(
          "/api/translate",
          { method: "POST", body: JSON.stringify({ texts: batch, targetLang: lang }) },
        );
        batch.forEach((text, i) => {
          const translated = translations[i];
          if (translated) setCached(text, lang, translated);
        });
      } catch {
        // Upstream failed for this batch — leave it uncached, `useTranslated`
        // keeps returning the English source text (the required fallback
        // behaviour). Other batches in the same flush still get a chance.
      }
    }),
  );
};

/** Matches the route's own `zod` cap (`texts[i]` max length 500). */
const MAX_TEXT_LENGTH = 500;

export const queueTranslation = (text: string, lang: LanguageCode) => {
  if (lang === "en") return;
  if (useLanguageStore.getState().cache[text]?.[lang]) return;
  // Over the route's own per-string cap — queuing it would fail the whole
  // batch it landed in (the route validates the array as a unit) and take
  // every other pending string down with it. Skip it; `useTranslated` keeps
  // returning the English source, same fallback as an upstream failure.
  if (text.length > MAX_TEXT_LENGTH) return;

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
