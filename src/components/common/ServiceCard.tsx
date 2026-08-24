"use client";

import Link from "next/link";
import { useRef } from "react";
import { Hover } from "@/components/animation/springs/hover";
import { TranslatedText } from "@/components/common/TranslatedText";
import { SceneViewport } from "@/components/scene/SceneViewport";
import { MINI_SCENES } from "@/components/scene/mini-scenes";
import type { Service } from "@/data/mocks/services";

export interface ServiceCardProps {
  service: Service;
}

export const ServiceCard = ({ service }: ServiceCardProps) => {
  const cardRef = useRef<HTMLElement>(null);
  const builder = MINI_SCENES[service.slug];

  return (
    <Hover
      ref={cardRef}
      tag="article"
      from={{ y: 0 }}
      to={{ y: -8 }}
      config={{ tension: 300, friction: 24 }}
      className="border-line bg-surface hover:border-accent/60 relative overflow-hidden rounded-2xl border p-7 transition-colors duration-[var(--duration-normal)] ease-entrance"
    >
      {builder && (
        <SceneViewport
          builder={builder}
          hoverRef={cardRef}
          className="pointer-events-none absolute right-5 top-5 h-16 w-16"
          fallback={
            <div className="border-line/60 bg-background-alt/40 h-16 w-16 rounded-full border" />
          }
        />
      )}
      <Link
        href={`/services/${service.slug}`}
        className="group relative z-10 flex h-full flex-col"
      >
        <h3 className="text-foreground max-w-[calc(100%-4.5rem)] text-xl font-medium">
          {service.title}
        </h3>
        <p className="text-foreground-muted mt-3 flex-1 text-sm leading-relaxed">
          {service.shortDescription}
        </p>
        <span className="text-accent group-hover:text-glow mt-6 inline-flex items-center gap-2 text-xs font-medium tracking-[0.12em] uppercase transition-colors duration-[var(--duration-fast)] ease-entrance">
          <TranslatedText text="Explore" />
          <span aria-hidden="true">→</span>
        </span>
      </Link>
    </Hover>
  );
};
