"use client";

import { useEffect, useRef, useState } from "react";
import { SectionHeading } from "@/components/common/SectionHeading";
import { TierInview as Inview } from "@/components/common/TierInview";
import { ServiceCard } from "@/components/common/ServiceCard";
import { services } from "@/data/mocks/services";

export const ServicesSection = () => {
  const trackRef = useRef<HTMLUListElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  // Dot indicator: use IntersectionObserver to track which card is most visible
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const cards = Array.from(track.children) as HTMLElement[];
    const observers: IntersectionObserver[] = [];

    cards.forEach((card, i) => {
      const obs = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && entries[0].intersectionRatio > 0.5) {
            setActiveIndex(i);
          }
        },
        { root: track, threshold: 0.5 },
      );
      obs.observe(card);
      observers.push(obs);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, []);

  const scrollTo = (i: number) => {
    const track = trackRef.current;
    if (!track) return;
    const card = track.children[i] as HTMLElement;
    card?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  };

  return (
    <section
      id="services"
      aria-labelledby="services-heading"
      className="bg-background/50 backdrop-blur-sm border-line relative z-10 border-y py-24 md:py-32"
    >
      <div className="mx-auto max-w-6xl px-6 md:px-8">
        <SectionHeading
          id="services-heading"
          eyebrow="What we do"
          heading="Our Services"
        />

        {/* Desktop: regular grid — Mobile: horizontal scroll snap */}
        <ul
          ref={trackRef}
          className="
            mt-14
            grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3
            max-lg:flex max-lg:snap-x max-lg:snap-mandatory max-lg:overflow-x-auto max-lg:gap-0
            max-lg:[scrollbar-width:none] max-lg:[&::-webkit-scrollbar]:hidden
          "
        >
          {services.map((service, index) => (
            <Inview
              key={service.slug}
              tag="li"
              mode="once"
              from={{ opacity: 0, y: 24 }}
              to={{ opacity: 1, y: 0 }}
              delayIn={(index % 3) * 100}
              className="max-lg:w-[min(80vw,320px)] max-lg:flex-shrink-0 max-lg:snap-center max-lg:px-3 first:max-lg:pl-6 last:max-lg:pr-6"
            >
              <ServiceCard service={service} />
            </Inview>
          ))}
        </ul>

        {/* Pagination dots — only visible below lg */}
        <div
          aria-label="Service card navigation"
          className="mt-6 flex justify-center gap-2 lg:hidden"
        >
          {services.map((_, i) => (
            <button
              key={i}
              aria-label={`Go to service ${i + 1}`}
              onClick={() => scrollTo(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === activeIndex
                  ? "bg-accent w-5"
                  : "bg-foreground/20 hover:bg-foreground/40 w-1.5"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
