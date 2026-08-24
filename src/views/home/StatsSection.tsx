import { projects, experienceCountryCount } from "@/data/mocks/projects";
import { StatCounter } from "./StatCounter";
import { StatsGlobe } from "./StatsGlobe";

/**
 * Numbers are derived from the real project list in `data/mocks/projects.ts`
 * (sourced from geoporte.com.au/projects) rather than invented — the live
 * site's own counters render "0+" placeholders with no populated values.
 */
export const StatsSection = () => {
  return (
    <section aria-label="Track record" className="relative overflow-hidden py-20">
      <StatsGlobe />
      <div className="relative z-10 mx-auto grid max-w-4xl grid-cols-1 gap-12 px-6 sm:grid-cols-2 md:px-8">
        <StatCounter value={projects.length} label="Landmark projects delivered" />
        <StatCounter
          value={experienceCountryCount}
          suffix=""
          label="Countries of hands-on experience"
        />
      </div>
    </section>
  );
};
