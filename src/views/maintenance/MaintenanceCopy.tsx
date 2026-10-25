"use client";

// 📖 Docs: obsidian/frontend/text-engine.md

import TextEngine from "spring-text-engine";
import { easings } from "@react-spring/web";
import { brand } from "@/lib/company";

const WORDMARK_SETTLE_MS = 500;
const HEADING_SETTLE_MS = WORDMARK_SETTLE_MS + 700;

export interface MaintenanceHeadingProps {
  id: string;
  text: string;
}

/**
 * The page's three text beats, staggered to read in sequence: wordmark
 * settles first (it's paired with the particle emblem above it, same
 * logo+wordmark convention as `Nav.tsx`/`PageLoadIntro.tsx`), then the `<h1>`
 * word-by-word, then the subtext letter by letter — mirrors
 * `views/home/HeroHeading.tsx`'s own settle-then-reveal chaining, just with
 * three beats instead of two.
 */
export const MaintenanceWordmark = () => (
  <TextEngine
    tag="p"
    mode="once"
    className="text-foreground justify-center text-center text-sm font-semibold tracking-[0.32em] uppercase"
    letterIn={{ opacity: 1, y: 0 }}
    letterOut={{ opacity: 0, y: 16 }}
    letterStagger={30}
    letterConfig={{ duration: 400, easing: easings.easeOutCubic }}
    seo={false}
  >
    {brand.wordmark}
  </TextEngine>
);

export const MaintenanceHeading = ({ id, text }: MaintenanceHeadingProps) => (
  <TextEngine
    tag="h1"
    id={id}
    mode="once"
    className="font-heading text-heading leading-display justify-center text-center text-3xl font-medium md:text-5xl"
    delayIn={WORDMARK_SETTLE_MS}
    wordIn={{ y: 0, opacity: 1 }}
    wordOut={{ y: 24, opacity: 0 }}
    wordStagger={70}
    wordConfig={{ duration: 600, easing: easings.easeOutCubic }}
    overflow
  >
    {text}
  </TextEngine>
);

export interface MaintenanceSubtextProps {
  text: string;
}

export const MaintenanceSubtext = ({ text }: MaintenanceSubtextProps) => (
  <TextEngine
    tag="p"
    mode="once"
    className="text-foreground-muted justify-center text-center text-base"
    delayIn={HEADING_SETTLE_MS}
    letterIn={{ opacity: 1 }}
    letterOut={{ opacity: 0 }}
    letterStagger={10}
    letterConfig={{ duration: 1, easing: easings.linear }}
  >
    {text}
  </TextEngine>
);
