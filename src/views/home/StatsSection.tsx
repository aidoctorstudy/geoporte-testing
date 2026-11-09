import { StatCounter } from "./StatCounter";
import { StatsGlobe } from "./StatsGlobe";

/**
 * Four approved statistics from brief Section 11.1.
 * These are hand-approved numbers — do NOT replace with computed values
 * from the project array (brief Section 11.3 explicitly prohibits this).
 *
 * "200+ projects completed globally in the last three years" — from the
 *   Executive Capability Statement. Status: [CONFIRM alignment across sites].
 * "200+ years of combined senior team experience" — approved.
 * "7 countries of Gulf and regional experience" — approved (UAE, KSA, Qatar,
 *   Oman, Kuwait, Bahrain, Iraq).
 * "3 certified management systems (ISO 9001, 14001, 45001)" — approved with
 *   Section 9.6 wording caveat (certificate scope covers AU/NZ entity only
 *   until UAE extension confirmed).
 */
const STATS = [
  { value: 200, suffix: "+", label: "Projects completed globally in the last three years" },
  { value: 200, suffix: "+", label: "Years of combined senior team experience" },
  { value: 7, suffix: "", label: "Countries of Gulf and regional experience" },
  { value: 3, suffix: "", label: "Certified management systems (ISO 9001 · 14001 · 45001)" },
] as const;

export const StatsSection = () => {
  return (
    <section aria-label="Track record" className="relative overflow-hidden py-20">
      <StatsGlobe />
      <div className="relative z-10 mx-auto grid max-w-5xl grid-cols-2 gap-10 px-6 md:grid-cols-4 md:gap-12 md:px-8">
        {STATS.map((stat) => (
          <StatCounter
            key={stat.label}
            value={stat.value}
            suffix={stat.suffix}
            label={stat.label}
          />
        ))}
      </div>
    </section>
  );
};
