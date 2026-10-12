// 📖 Docs: obsidian/frontend/components/common.md, obsidian/frontend/i18n.md
"use client";

import type { ElementType } from "react";
import { useTranslated } from "@/hooks/i18n/use-translated";

export interface TranslatedTextProps {
  text: string;
  /** Semantic element to render — never defaults to a meaningless wrapper in
   * a context where it matters; pass the real tag (`span`, `p`, `h3`, …). */
  tag?: ElementType;
  className?: string;
}

/**
 * Translates `text` into the currently-selected language
 * (`use-language-store.ts`) and renders it in `tag`. Renders the English
 * source unchanged while a translation is pending, on upstream failure, or
 * when the language is English. Scope is nav links, section headings, and
 * button labels — not full body copy (ADR-0024, restored by ADR-0088).
 */
export const TranslatedText = ({ text, tag: Tag = "span", className }: TranslatedTextProps) => {
  const translated = useTranslated(text);
  return <Tag className={className}>{translated}</Tag>;
};
