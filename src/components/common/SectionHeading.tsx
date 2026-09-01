"use client";

// 📖 Docs: obsidian/frontend/components/common.md

import TextEngine from "spring-text-engine";
import { easings } from "@react-spring/web";

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
 * section — one place to keep the reveal config consistent.
 */
export const SectionHeading = ({
  eyebrow,
  heading,
  id,
  tag = "h2",
  headingClassName = DEFAULT_HEADING_CLASSNAME,
}: SectionHeadingProps) => {
  return (
    <>
      <p className="text-foreground-muted mb-4 text-xs tracking-[0.3em] uppercase">
        {eyebrow}
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
        {heading}
      </TextEngine>
    </>
  );
};
