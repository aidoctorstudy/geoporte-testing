import { SectionHeading } from "@/components/common/SectionHeading";

const CLIENTS = [
  {
    type: "Government authorities and utilities",
    description:
      "Water authorities, roads and transport departments, power and utilities regulators and municipal infrastructure owners commissioning design, independent review and construction oversight.",
  },
  {
    type: "Master developers and private developers",
    description:
      "Major mixed-use and residential developers requiring geotechnical design, foundation checking and ground risk management for high-rise and large-footprint schemes.",
  },
  {
    type: "Lead consultants and design teams",
    description:
      "Engineering consultancies and project management firms who sub-contract specialist geotechnical, tunnelling and structural design, numerical modelling and independent checking.",
  },
  {
    type: "Design and build contractors",
    description:
      "Main contractors and specialist subcontractors who need expert geotechnical design support, construction impact assessment and monitoring during complex ground works.",
  },
];

export const WhoWeWorkForSection = () => {
  return (
    <section
      id="who-we-work-for"
      aria-labelledby="clients-heading"
      className="mx-auto max-w-6xl px-6 py-24 md:px-8 md:py-32"
    >
      <SectionHeading
        id="clients-heading"
        eyebrow="Our clients"
        heading="Who we work for"
      />

      <div className="mt-14 overflow-hidden rounded-2xl border border-line">
        {CLIENTS.map((client, index) => (
          <div
            key={client.type}
            className={[
              "grid gap-4 p-6 md:grid-cols-[1fr_2fr] md:gap-8 md:p-8",
              index < CLIENTS.length - 1 ? "border-b border-line" : "",
            ].join(" ")}
          >
            <div>
              <h3 className="text-foreground text-sm font-semibold leading-snug">
                {client.type}
              </h3>
            </div>
            <p className="text-foreground-muted text-sm leading-relaxed">
              {client.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};
