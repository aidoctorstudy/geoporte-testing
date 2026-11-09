import type { Metadata } from "next";
import { generateMetadata as buildMetadata } from "@/utils/seo/generate-page-metadata";

export function generateQualityMetadata(): Metadata {
  return buildMetadata({
    title: "Quality, Environment and Safety | Geoporte",
    description:
      "Geoporte is certified to ISO 9001:2015, ISO 14001:2015 and ISO 45001:2018 by Global Compliance Certification, accredited by JAS-ANZ. Our quality and governance practices.",
    url: "/about/quality",
  });
}

const CHECKING_STEPS = [
  {
    step: "1",
    title: "Originator check",
    description:
      "The engineer who produces the calculation, model or drawing checks their own work against the brief, the ground model and the design standards before issue.",
  },
  {
    step: "2",
    title: "Independent technical check",
    description:
      "A second engineer of equal or greater seniority who was not involved in production carries out an independent check. For numerical models, the checker runs an independent simplified calculation to verify the model output is of the right order.",
  },
  {
    step: "3",
    title: "Senior engineer review",
    description:
      "A principal or technical director reviews the checked deliverable for engineering judgement, completeness and consistency with the project ground model and risk register.",
  },
  {
    step: "4",
    title: "Drawing and document control",
    description:
      "All deliverables are issued under a controlled document number and revision. Superseded revisions are retained and the reason for revision is recorded.",
  },
  {
    step: "5",
    title: "Client review and close-out",
    description:
      "Client comments are logged and responded to in a comment response register. The register is retained as a quality record for the project.",
  },
];

export const QualityView = () => {
  return (
    <main className="mx-auto max-w-4xl px-6 py-24 md:px-8 md:py-32">
      {/* Page header */}
      <div className="mb-16">
        <p className="text-label mb-4 text-xs tracking-[0.3em] uppercase">
          Governance
        </p>
        <h1 className="font-heading text-foreground text-3xl font-medium leading-snug md:text-5xl">
          Quality, environment and safety
        </h1>
        <p className="text-foreground-muted mt-6 max-w-2xl text-base leading-relaxed">
          Senior engineering judgement is our first quality gate. Every
          deliverable is independently checked before it leaves the office.
        </p>
      </div>

      {/* ISO certification */}
      <section aria-labelledby="iso-heading" className="mb-16">
        <h2
          id="iso-heading"
          className="text-foreground mb-5 text-xl font-semibold"
        >
          Certified management systems
        </h2>
        <div className="bg-surface border-line rounded-2xl border p-6 md:p-8">
          <p className="text-foreground-muted text-sm leading-relaxed">
            Geoporte&apos;s management systems are certified to ISO 9001:2015
            (quality), ISO 14001:2015 (environment) and ISO 45001:2018
            (occupational health and safety) by Global Compliance Certification,
            accredited by JAS-ANZ.
          </p>
          <div className="mt-6 flex flex-wrap gap-4">
            {["ISO 9001:2015", "ISO 14001:2015", "ISO 45001:2018"].map((iso) => (
              <span
                key={iso}
                className="border-line bg-background-alt text-foreground rounded-full border px-4 py-2 text-sm font-medium"
              >
                {iso}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Five-step checking process */}
      <section aria-labelledby="checking-heading" className="mb-16">
        <h2
          id="checking-heading"
          className="text-foreground mb-5 text-xl font-semibold"
        >
          Five-step checking process
        </h2>
        <p className="text-foreground-muted mb-10 max-w-xl text-sm leading-relaxed">
          Every technical deliverable passes through five stages before it
          reaches the client. The process applies to calculations, models,
          reports and drawings.
        </p>
        <ol className="space-y-6">
          {CHECKING_STEPS.map((item) => (
            <li key={item.step} className="flex gap-5">
              <span className="bg-accent text-white flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold">
                {item.step}
              </span>
              <div>
                <h3 className="text-foreground text-sm font-semibold">
                  {item.title}
                </h3>
                <p className="text-foreground-muted mt-1 text-sm leading-relaxed">
                  {item.description}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Environment and HSE */}
      <section aria-labelledby="hse-heading" className="mb-16">
        <h2
          id="hse-heading"
          className="text-foreground mb-5 text-xl font-semibold"
        >
          Environment and occupational health and safety
        </h2>
        <p className="text-foreground-muted text-sm leading-relaxed">
          Geoporte is certified to ISO 14001:2015 (environment) and ISO
          45001:2018 (occupational health and safety). Our environmental and
          safety objectives are reviewed annually as part of the management
          system review. As a consulting engineering firm, our direct
          environmental footprint is principally through office operations;
          our indirect contribution is through the quality and rigour of the
          engineering advice we give on projects that affect ground, water and
          public safety.
        </p>
      </section>

      {/* Governance */}
      <section aria-labelledby="governance-heading">
        <h2
          id="governance-heading"
          className="text-foreground mb-5 text-xl font-semibold"
        >
          Governance and professional indemnity
        </h2>
        <p className="text-foreground-muted text-sm leading-relaxed">
          Geoporte holds professional indemnity insurance appropriate for the
          scale and complexity of its commissions. All senior engineers hold
          current chartered or registered engineer status with their respective
          professional bodies. Conflicts of interest are declared to clients
          before appointment; Geoporte does not act as both designer and
          independent checker on the same element of work.
        </p>
      </section>
    </main>
  );
};
