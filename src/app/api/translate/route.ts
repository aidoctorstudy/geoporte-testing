import { z } from "zod";

import { getServerEnv } from "@/env";
import { handle } from "@/lib/api";

/**
 * Server-side translation proxy for the nav language switcher — the browser
 * only ever calls this same-origin route (hard rule #9), never a third-party
 * translation API directly. Restores ADR-0024's design, reversed by
 * ADR-0077; see ADR-0088 and `obsidian/frontend/i18n.md`.
 *
 * Two providers, tried in order per string:
 * 1. LibreTranslate, only when `LIBRETRANSLATE_ENDPOINT` is configured (a
 *    self-hosted instance, or the official API with `LIBRETRANSLATE_API_KEY`
 *    — libretranslate.com's hosted API now requires a key for every request,
 *    confirmed live: an unauthenticated call returns `{"error":"Visit
 *    https://portal.libretranslate.com to get an API key"}`).
 * 2. MyMemory (api.mymemory.translated.net) — free, keyless, confirmed
 *    reachable from this project's deploy target for en→ar/ur/fr/zh. Used
 *    whenever LibreTranslate isn't configured or a request to it fails.
 *
 * Never throws for a provider failure — a string that can't be translated
 * by either provider resolves to its own English source, matching
 * ADR-0024's original "on upstream failure, the string simply stays
 * uncached" behaviour. Only a malformed request (bad shape) returns the
 * `{ error }` envelope, via `handle()`'s own `ZodError` handling.
 */

// Must match `LANGUAGES` in `src/lib/i18n/languages.ts` — kept as a literal
// tuple here (rather than derived from that array) so zod can narrow
// `target`'s type without an unsafe cast.
const LANGUAGE_CODES = ["en", "ar", "ur", "fr", "zh"] as const;
type LanguageCode = (typeof LANGUAGE_CODES)[number];

const translateSchema = z.object({
  texts: z.array(z.string().min(1).max(500)).min(1).max(50),
  target: z.enum(LANGUAGE_CODES),
});

const decodeHtmlEntities = (value: string): string =>
  value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#10;/g, "\n")
    .trim();

const translateWithLibreTranslate = async (
  text: string,
  target: LanguageCode,
): Promise<string | null> => {
  const { LIBRETRANSLATE_ENDPOINT, LIBRETRANSLATE_API_KEY } = getServerEnv();
  if (!LIBRETRANSLATE_ENDPOINT) return null;

  const res = await fetch(`${LIBRETRANSLATE_ENDPOINT.replace(/\/$/, "")}/translate`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      q: text,
      source: "en",
      target,
      format: "text",
      ...(LIBRETRANSLATE_API_KEY ? { api_key: LIBRETRANSLATE_API_KEY } : {}),
    }),
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) return null;

  const body = (await res.json()) as { translatedText?: string };
  return typeof body.translatedText === "string" && body.translatedText.length > 0
    ? body.translatedText
    : null;
};

/** `[bracketed note]`-shaped strings observed in MyMemory's top-level
 * `translatedText` for some short/rare source strings (a translation-memory
 * annotation, not a real translation) — filtered out in favour of the
 * best-scored plain entry in `matches`. */
const looksLikeTranslatorNote = (value: string): boolean => /[[\]]/.test(value);

const translateWithMyMemory = async (
  text: string,
  target: LanguageCode,
): Promise<string | null> => {
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${target}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
  if (!res.ok) return null;

  const body = (await res.json()) as {
    responseData?: { translatedText?: string };
    matches?: { translation?: string; match?: number }[];
  };

  const primary = body.responseData?.translatedText;
  if (primary && !looksLikeTranslatorNote(primary)) return decodeHtmlEntities(primary);

  const bestMatch = (body.matches ?? [])
    .filter((match) => match.translation && !looksLikeTranslatorNote(match.translation))
    .sort((a, b) => (b.match ?? 0) - (a.match ?? 0))[0];
  if (bestMatch?.translation) return decodeHtmlEntities(bestMatch.translation);

  return primary ? decodeHtmlEntities(primary) : null;
};

const translateOne = async (text: string, target: LanguageCode): Promise<string> => {
  try {
    const viaLibreTranslate = await translateWithLibreTranslate(text, target);
    if (viaLibreTranslate) return viaLibreTranslate;
  } catch {
    // Fall through to MyMemory below.
  }

  try {
    const viaMyMemory = await translateWithMyMemory(text, target);
    if (viaMyMemory) return viaMyMemory;
  } catch {
    // Both providers failed — fall through to the English source.
  }

  return text;
};

export const POST = handle(async (req) => {
  const { texts, target } = translateSchema.parse(await req.json());

  if (target === "en") {
    return { translations: texts };
  }

  const translations = await Promise.all(texts.map((text) => translateOne(text, target)));
  return { translations };
});
