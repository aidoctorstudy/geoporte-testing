"use client";

// 📖 Docs: obsidian/frontend/animation-system.md

import { Inview } from "@/components/animation/springs/in-view";
import { useTranslated } from "@/hooks/i18n/use-translated";

interface LineSpec {
  text: string;
  from: Record<string, number>;
  to: Record<string, number>;
}

const LINE_STAGGER_MS = 200;

const LINES: LineSpec[] = [
  { text: "Complex ground.", from: { opacity: 0, x: -40 }, to: { opacity: 1, x: 0 } },
  { text: "Complex engineering.", from: { opacity: 0, x: 40 }, to: { opacity: 1, x: 0 } },
  { text: "Clear decisions.", from: { opacity: 0, y: 24 }, to: { opacity: 1, y: 0 } },
];

const AboutHeadingLine = ({
  text,
  from,
  to,
  delayIn,
}: LineSpec & { delayIn: number }) => {
  const translated = useTranslated(text);
  return (
    <Inview tag="span" mode="once" from={from} to={to} delayIn={delayIn} className="block">
      {translated}
    </Inview>
  );
};

export interface AboutHeadingProps {
  id: string;
  className?: string;
}

/**
 * The About section's three-line heading (item 21) — each line enters from a
 * different direction (left / right / up), 200ms after the previous, instead
 * of the shared `SectionHeading`'s single line-by-line reveal (which every
 * other section uses and shouldn't change project-wide for one section's
 * particular effect).
 */
export const AboutHeading = ({ id, className }: AboutHeadingProps) => (
  <h2 id={id} className={className}>
    {LINES.map((line, i) => (
      <AboutHeadingLine key={line.text} {...line} delayIn={i * LINE_STAGGER_MS} />
    ))}
  </h2>
);
