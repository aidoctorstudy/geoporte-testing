// 📖 Docs: obsidian/frontend/i18n.md
"use client";

import { apiFetch } from "@/lib/api-client";
import { useLanguageStore } from "@/hooks/i18n/use-language-store";
import type { LanguageCode } from "@/lib/i18n/languages";

interface TranslateResponse {
  translations: string[];
}

interface QueueEntry {
  text: string;
  resolve: (translated: string) => void;
}

const queues = new Map<LanguageCode, QueueEntry[]>();
const scheduled = new Set<LanguageCode>();

const flush = async (language: LanguageCode) => {
  scheduled.delete(language);
  const entries = queues.get(language) ?? [];
  queues.delete(language);
  if (entries.length === 0) return;

  const texts = Array.from(new Set(entries.map((entry) => entry.text)));

  let translated: string[] = texts;
  try {
    const result = await apiFetch<TranslateResponse>("/api/translate", {
      method: "POST",
      body: JSON.stringify({ texts, target: language }),
    });
    translated = result.translations;
  } catch {
    // Upstream failure (network, both providers down) — fall through to the
    // source strings. Nothing gets cached, so the next request for the same
    // text (a route change, re-selecting the language) tries again instead
    // of permanently caching a miss. Never surfaced to the caller as an
    // error — per ADR-0024, a failed translation just leaves the English
    // source on screen.
    translated = texts;
  }

  const byText = new Map(texts.map((text, i) => [text, translated[i] ?? text]));
  const { setCached } = useLanguageStore.getState();
  entries.forEach(({ text, resolve }) => {
    const value = byText.get(text) ?? text;
    if (value !== text) setCached(language, text, value);
    resolve(value);
  });
};

/**
 * Queues `text` for translation into `language`, batching every call queued
 * in the same tick into one request to `/api/translate` — matching every
 * `useTranslated` instance that fires together on a render, same shape as
 * ADR-0024's original `translation-queue.ts`. Resolves with the source text
 * unchanged on any upstream failure; never rejects.
 */
export const queueTranslation = (language: LanguageCode, text: string): Promise<string> =>
  new Promise((resolve) => {
    if (!queues.has(language)) queues.set(language, []);
    queues.get(language)!.push({ text, resolve });

    if (!scheduled.has(language)) {
      scheduled.add(language);
      queueMicrotask(() => flush(language));
    }
  });
