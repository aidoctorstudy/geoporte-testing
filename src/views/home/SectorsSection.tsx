import Link from "next/link";
import { SectionHeading } from "@/components/common/SectionHeading";
import { TierInview as Inview } from "@/components/common/TierInview";
import { sectors } from "@/data/mocks/sectors";

export const SectorsSection = () => {
  return (
    <section
      id="sectors"
      aria-labelledby="sectors-heading"
      className="bg-background relative z-10 mx-auto max-w-6xl px-6 py-24 md:px-8 md:py-32"
    >
      <SectionHeading
        id="sectors-heading"
        eyebrow="Where we work"
        heading="Our sectors"
      />

      <ul className="mt-14 grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {sectors.map((sector, index) => (
          <Inview
            key={sector.slug}
            tag="li"
            mode="once"
            from={{ opacity: 0, y: 20 }}
            to={{ opacity: 1, y: 0 }}
            delayIn={index * 60}
          >
            <Link
              href={`/sectors/${sector.slug}`}
              className="border-line bg-surface hover:border-accent/50 group flex h-full flex-col rounded-2xl border p-5 transition-colors"
            >
              <h3 className="text-foreground text-sm font-semibold leading-snug group-hover:text-accent transition-colors">
                {sector.title}
              </h3>
              <p className="text-foreground-muted mt-3 flex-1 text-xs leading-relaxed">
                {sector.cardSummary}
              </p>
              <span className="text-accent mt-4 text-xs font-medium">
                Learn more &rarr;
              </span>
            </Link>
          </Inview>
        ))}
      </ul>
    </section>
  );
};
