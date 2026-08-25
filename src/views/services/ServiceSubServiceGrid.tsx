"use client";

import { useRef } from "react";
import { animated, to, useSpring } from "@react-spring/web";
import { SectionHeading } from "@/components/common/SectionHeading";
import { Inview } from "@/components/animation/springs/in-view";
import type { ServiceSubService } from "@/data/mocks/services";

const MAX_TILT_DEG = 6;
const TILT_SPRING_CONFIG = { tension: 280, friction: 24 };

/** A single grid card with a cursor-tilt hover — a lighter, non-interactive
 * cousin of `TiltCard` (`src/components/common/TiltCard.tsx`): these cards
 * don't open anything on click, so they stay a plain `article` rather than
 * `TiltCard`'s `role="button"`/`aria-haspopup="dialog"` semantics, which
 * would misrepresent purely informational content as an activatable control. */
const SubServiceCard = ({ title, description }: ServiceSubService) => {
  const ref = useRef<HTMLDivElement>(null);
  const canTilt = useRef(
    typeof window !== "undefined" &&
      window.matchMedia("(hover: hover) and (pointer: fine)").matches,
  );

  const [style, api] = useSpring(() => ({
    rotateX: 0,
    rotateY: 0,
    scale: 1,
    config: TILT_SPRING_CONFIG,
  }));

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!canTilt.current) return;
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width - 0.5;
    const py = (event.clientY - rect.top) / rect.height - 0.5;
    api.start({ rotateX: -py * MAX_TILT_DEG, rotateY: px * MAX_TILT_DEG, scale: 1.02 });
  };

  const handleMouseLeave = () => {
    api.start({ rotateX: 0, rotateY: 0, scale: 1 });
  };

  return (
    <animated.article
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: to(
          [style.rotateX, style.rotateY, style.scale],
          (rx, ry, s) => `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg) scale(${s})`,
        ),
      }}
      className="border-line bg-surface hover:border-accent/60 h-full rounded-2xl border p-6 transition-colors duration-[var(--duration-normal)] ease-entrance"
    >
      <h3 className="text-foreground text-base font-medium">{title}</h3>
      <p className="text-foreground-muted mt-3 text-sm leading-relaxed">{description}</p>
    </animated.article>
  );
};

export interface ServiceSubServiceGridProps {
  subServices: ServiceSubService[];
}

/** The 6-card sub-services grid (item 3 of the service page spec) — distinct
 * from the deeper `capabilityGroups`/`subServices` content folded into
 * `ServiceOverview` instead; see ADR in decisions-log.md. */
export const ServiceSubServiceGrid = ({ subServices }: ServiceSubServiceGridProps) => {
  return (
    <section
      aria-labelledby="service-subservice-grid-heading"
      className="mx-auto max-w-6xl px-6 py-16 md:px-8 md:py-24"
    >
      <SectionHeading
        id="service-subservice-grid-heading"
        eyebrow="In depth"
        heading="Specialist offerings"
      />

      <ul className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {subServices.map((subService, index) => (
          <Inview
            key={subService.title}
            tag="li"
            mode="once"
            from={{ opacity: 0, y: 24 }}
            to={{ opacity: 1, y: 0 }}
            delayIn={(index % 3) * 80}
          >
            <SubServiceCard {...subService} />
          </Inview>
        ))}
      </ul>
    </section>
  );
};
