import { z } from "zod";

import { getServerEnv } from "@/env";
import { ApiError, handle } from "@/lib/api";

/**
 * Server-side proxy for the nav language switcher — the browser never calls
 * LibreTranslate directly (AGENTS.md hard rule #9 / api-architecture.md).
 * The client caches results in localStorage (see `src/lib/i18n/`), so this
 * only runs once per string/language pair.
 */

const SUPPORTED_TARGETS = ["ar", "ur", "fr", "zh"] as const;

const DEFAULT_ENDPOINT = "https://translate.disroot.org";

const translateSchema = z.object({
  texts: z.array(z.string().min(1).max(500)).min(1).max(50),
  targetLang: z.enum(SUPPORTED_TARGETS),
});

interface LibreTranslateResponse {
  translatedText: string | string[];
}

export const POST = handle(async (req) => {
  const { texts, targetLang } = translateSchema.parse(await req.json());
  const { LIBRETRANSLATE_ENDPOINT } = getServerEnv();
  const endpoint = LIBRETRANSLATE_ENDPOINT ?? DEFAULT_ENDPOINT;

  const upstream = await fetch(`${endpoint}/translate`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      q: texts,
      source: "en",
      target: targetLang,
      format: "text",
    }),
  });

  if (!upstream.ok) {
    throw new ApiError(
      502,
      "upstream_error",
      "Translation service unavailable.",
    );
  }

  const body = (await upstream.json()) as LibreTranslateResponse;
  const translations = Array.isArray(body.translatedText)
    ? body.translatedText
    : [body.translatedText];

  return { translations };
});
