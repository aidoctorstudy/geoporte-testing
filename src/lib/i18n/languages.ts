/**
 * Supported languages for the nav language switcher — restores ADR-0024's
 * original list (English/Arabic/Urdu/French/Chinese, RTL for ar/ur). See
 * `obsidian/frontend/i18n.md`.
 */
export type LanguageCode = "en" | "ar" | "ur" | "fr" | "zh";

export interface LanguageDefinition {
  code: LanguageCode;
  /** English name, shown as a small secondary label next to `nativeLabel`. */
  label: string;
  /** The language's own name, in its own script — the switcher's primary label. */
  nativeLabel: string;
  dir: "ltr" | "rtl";
}

export const LANGUAGES: LanguageDefinition[] = [
  { code: "en", label: "English", nativeLabel: "English", dir: "ltr" },
  { code: "ar", label: "Arabic", nativeLabel: "العربية", dir: "rtl" },
  { code: "ur", label: "Urdu", nativeLabel: "اردو", dir: "rtl" },
  { code: "fr", label: "French", nativeLabel: "Français", dir: "ltr" },
  { code: "zh", label: "Chinese", nativeLabel: "中文", dir: "ltr" },
];

export const DEFAULT_LANGUAGE: LanguageCode = "en";

export const isLanguageCode = (value: string): value is LanguageCode =>
  LANGUAGES.some((language) => language.code === value);

export const getLanguageDir = (code: LanguageCode): "ltr" | "rtl" =>
  LANGUAGES.find((language) => language.code === code)?.dir ?? "ltr";
