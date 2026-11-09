import Link from "next/link";

export const InsightTeaserSection = () => {
  return (
    <section
      id="insight-teaser"
      aria-label="Technical insight"
      className="bg-background-alt/40 border-line border-y py-20 md:py-28"
    >
      <div className="mx-auto max-w-4xl px-6 md:px-8">
        <div className="flex items-start gap-4">
          <span className="text-label mt-1 shrink-0 text-xs tracking-[0.2em] uppercase">
            Technical insight
          </span>
        </div>

        <h2 className="text-foreground font-heading mt-4 text-2xl font-medium leading-snug md:text-3xl">
          Crushed carbonate fills keep settling
        </h2>

        <p className="text-foreground-muted mt-5 max-w-2xl text-base leading-relaxed">
          Reworked limestone fills in Qatar typically show working stiffness of about
          30 to 80 MPa, an order lower than often assumed. Under-estimating settlement
          has led to recurring pipeline joint failures on several projects. Our review
          of post-construction movement records shows the pattern is consistent and
          predictable.
        </p>

        <div className="mt-8">
          <Link
            href="/insights/crushed-carbonate-fills-settlement"
            className="text-accent hover:text-accent/80 inline-flex items-center gap-2 text-sm font-medium transition-colors"
          >
            Read the insight
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
};
