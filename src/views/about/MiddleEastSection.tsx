import { SectionHeading } from "@/components/common/SectionHeading";
import { Inview } from "@/components/animation/springs/in-view";
import { middleEast } from "@/lib/company";

/**
 * "Geoporte in the Middle East" — About page section. Same `glass-panel`
 * section rhythm as `AboutView`'s other sections (this page carries a fixed
 * Pinwheel Galaxy background — see `about.tsx`'s own header comment).
 *
 * Stats are plain static text, not `StatCounter`'s spring count-up: that
 * component animates toward an integer, and two of these four values aren't
 * integers ("200+", "ISO") — the capability statement's own published
 * figures, not something to coerce into a counter built for a different
 * shape of data.
 */
export const MiddleEastSection = () => {
  return (
    <section
      aria-labelledby="middle-east-heading"
      className="glass-panel relative z-10 mx-auto my-8 max-w-6xl px-6 py-16 md:my-12 md:px-8 md:py-24"
    >
      <SectionHeading
        id="middle-east-heading"
        eyebrow={middleEast.tagline}
        heading="Geoporte in the Middle East"
      />

      <Inview
        tag="p"
        mode="once"
        from={{ opacity: 0, y: 24 }}
        to={{ opacity: 1, y: 0 }}
        delayIn={80}
        className="text-foreground mt-4 max-w-2xl text-lg font-medium"
      >
        {middleEast.subheading}
      </Inview>

      <Inview
        tag="p"
        mode="once"
        from={{ opacity: 0, y: 24 }}
        to={{ opacity: 1, y: 0 }}
        delayIn={140}
        className="text-foreground-muted mt-5 max-w-2xl text-base leading-relaxed md:text-lg"
      >
        {middleEast.description}
      </Inview>

      <Inview
        tag="ul"
        mode="once"
        from={{ opacity: 0, y: 24 }}
        to={{ opacity: 1, y: 0 }}
        delayIn={200}
        className="mt-14 grid grid-cols-2 gap-8 md:grid-cols-4"
      >
        {middleEast.stats.map((stat) => (
          <li
            key={stat.label}
            className="flex flex-col items-center text-center md:items-start md:text-left"
          >
            <span className="text-foreground text-4xl font-medium md:text-5xl">
              {stat.value}
            </span>
            <span className="text-label mt-2 text-xs tracking-[0.16em] uppercase">
              {stat.label}
            </span>
          </li>
        ))}
      </Inview>

      <div className="mt-16 grid grid-cols-1 gap-12 md:grid-cols-2">
        <div>
          <p className="text-label text-xs tracking-[0.2em] uppercase">
            Sectors we serve
          </p>
          <Inview
            tag="ul"
            mode="once"
            from={{ opacity: 0, y: 16 }}
            to={{ opacity: 1, y: 0 }}
            delayIn={240}
            className="mt-5 flex flex-col gap-2.5"
          >
            {middleEast.sectors.map((sector) => (
              <li key={sector} className="text-foreground-muted text-sm">
                {sector}
              </li>
            ))}
          </Inview>
        </div>

        <div>
          <p className="text-label text-xs tracking-[0.2em] uppercase">
            Who we work for
          </p>
          <Inview
            tag="ul"
            mode="once"
            from={{ opacity: 0, y: 16 }}
            to={{ opacity: 1, y: 0 }}
            delayIn={280}
            className="mt-5 flex flex-col gap-2.5"
          >
            {middleEast.whoWeWorkFor.map((item) => (
              <li key={item} className="text-foreground-muted text-sm">
                {item}
              </li>
            ))}
          </Inview>
        </div>
      </div>
    </section>
  );
};
