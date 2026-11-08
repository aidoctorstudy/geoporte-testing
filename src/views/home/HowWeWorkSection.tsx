import { TierInview as Inview } from "@/components/common/TierInview";
import { SectionHeading } from "@/components/common/SectionHeading";

/**
 * Homepage "How we work" 4-card strip — brief Section 6.1 Section E.
 * Four differentiators: Senior-led, Risk-based design, Regional standards,
 * Advanced analysis.
 */
const HOW_WE_WORK_CARDS = [
  {
    title: "Senior-led",
    body: "Our principals build the models, attend site and sign off the work. You deal directly with the engineers responsible for the answer.",
    icon: "01",
  },
  {
    title: "Risk-based design",
    body: "We identify, quantify and communicate ground risk from investigation through construction, so residual risks are visible and priced.",
    icon: "02",
  },
  {
    title: "Regional standards",
    body: "Fluent in SBC 303, QCS, regional authority requirements, Eurocode 7, BS, AASHTO and Australian Standards. One of our principals authored the code companion to SBC 303.",
    icon: "03",
  },
  {
    title: "Advanced analysis",
    body: "PLAXIS 2D and 3D, soil-structure interaction, seismic and dynamic analysis, applied with practical construction judgement.",
    icon: "04",
  },
] as const;

export const HowWeWorkSection = () => {
  return (
    <section
      id="how-we-work"
      aria-labelledby="how-we-work-heading"
      className="border-line border-y py-24 md:py-32"
    >
      <div className="mx-auto max-w-6xl px-6 md:px-8">
        <SectionHeading
          id="how-we-work-heading"
          eyebrow="Our approach"
          heading="How we work"
        />

        <ul className="mt-14 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {HOW_WE_WORK_CARDS.map((card, index) => (
            <Inview
              key={card.title}
              tag="li"
              mode="once"
              from={{ opacity: 0, y: 24 }}
              to={{ opacity: 1, y: 0 }}
              delayIn={index * 100}
              className="border-line bg-surface flex flex-col gap-4 rounded-2xl border p-6"
            >
              <span
                className="text-label font-mono text-xs tracking-[0.2em]"
                aria-hidden="true"
              >
                {card.icon}
              </span>
              <h3 className="text-heading text-base font-semibold">{card.title}</h3>
              <p className="text-foreground-muted text-sm leading-relaxed">{card.body}</p>
            </Inview>
          ))}
        </ul>
      </div>
    </section>
  );
};
