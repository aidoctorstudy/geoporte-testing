"use client";

// 📖 Docs: obsidian/frontend/components/common.md

import { useTranslated } from "@/hooks/i18n/use-translated";

export interface TranslatedTextProps {
  text: string;
}

/**
 * Renders `text` translated into the current language (nav links, button
 * labels, …) — a component rather than a bare hook call so it can sit inside
 * `.map()` lists without breaking the rules of hooks.
 */
export const TranslatedText = ({ text }: TranslatedTextProps) => {
  return <>{useTranslated(text)}</>;
};
