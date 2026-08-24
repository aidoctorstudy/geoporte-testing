/**
 * Supported UI languages for the nav language switcher. `ar`/`ur` flip the
 * document to RTL — see `LanguageDirection` (mounted in the root layout).
 */
export type LanguageCode = "en" | "ar" | "ur" | "fr" | "zh";

export interface LanguageOption {
  code: LanguageCode;
  label: string;
  nativeLabel: string;
  dir: "ltr" | "rtl";
}

export const languages: LanguageOption[] = [
  { code: "en", label: "English", nativeLabel: "English", dir: "ltr" },
  { code: "ar", label: "Arabic", nativeLabel: "العربية", dir: "rtl" },
  { code: "ur", label: "Urdu", nativeLabel: "اردو", dir: "rtl" },
  { code: "fr", label: "French", nativeLabel: "Français", dir: "ltr" },
  { code: "zh", label: "Chinese", nativeLabel: "中文", dir: "ltr" },
];

export const getLanguage = (code: LanguageCode): LanguageOption =>
  languages.find((language) => language.code === code) ?? languages[0];
