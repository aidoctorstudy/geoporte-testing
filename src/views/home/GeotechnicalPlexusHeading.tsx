"use client";

// 📖 Docs: obsidian/frontend/text-engine.md

import TextEngine from "spring-text-engine";
import { easings } from "@react-spring/web";

export interface GeotechnicalPlexusHeadingProps {
  id: string;
  text: string;
  className?: string;
}

/**
 * Line-by-line `TextEngine` heading, split into its own client leaf (mirrors
 * `home/HeroHeading.tsx`) rather than importing `spring-text-engine`
 * straight into `GeotechnicalPlexusSection.tsx` (a Server Component) — the
 * package ships no "use client" banner of its own, so importing it directly
 * into a server module breaks the production build (`createContext is not a
 * function` while collecting page data). Every other `TextEngine` use in
 * this codebase already goes through a client-marked file for the same
 * reason (`SectionHeading.tsx`, `HeroHeading.tsx`).
 */
export const GeotechnicalPlexusHeading = ({ id, text, className }: GeotechnicalPlexusHeadingProps) => (
  <TextEngine
    tag="h2"
    id={id}
    mode="once"
    className={className}
    lineIn={{ y: "0%", opacity: 1 }}
    lineOut={{ y: "100%", opacity: 0 }}
    lineStagger={80}
    lineConfig={{ duration: 800, easing: easings.easeOutCubic }}
    overflow
  >
    {text}
  </TextEngine>
);
