"use client";

// 📖 Docs: obsidian/frontend/components/common.md

import TextEngine from "spring-text-engine";
import { easings } from "@react-spring/web";
import { useTranslated } from "@/hooks/i18n/use-translated";

export interface SectionHeadingProps {
  eyebrow: string;
  heading: string;
  id: string;
  tag?: "h1" | "h2";
  headingClassName?: string;
}

const DEFAULT_HEADING_CLASSNAME =
  "leading-display text-foreground max-w-2xl text-3xl font-medium md:text-5xl";

/**
 * The eyebrow + `TextEngine` heading pattern repeated across every homepage
 * section — one place to keep the reveal config and language-switcher
 * translation consistent. See obsidian/frontend/i18n.md.
 */
export const SectionHeading = ({
  eyebrow,
  heading,
  id,
  tag = "h2",
  headingClassName = DEFAULT_HEADING_CLASSNAME,
}: SectionHeadingProps) => {
  const translatedEyebrow = useTranslated(eyebrow);
  const translatedHeading = useTranslated(heading);

  return (
    <>
      <p className="text-foreground-muted mb-4 text-xs tracking-[0.3em] uppercase">
        {translatedEyebrow}
      </p>
      <TextEngine
        tag={tag}
        id={id}
        mode="once"
        className={headingClassName}
        lineIn={{ y: "0%", opacity: 1 }}
        lineOut={{ y: "100%", opacity: 0 }}
        lineStagger={80}
        lineConfig={{ duration: 800, easing: easings.easeOutCubic }}
        overflow
      >
        {translatedHeading}
      </TextEngine>
    </>
  );
};
