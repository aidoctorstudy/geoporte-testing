import { StatCounter } from "@/views/home/StatCounter";
import type { ServiceStat } from "@/data/mocks/services";

export interface ServiceStatsProps {
  stats: ServiceStat[];
}

/** The 3-stat row inside the overview section — reuses `StatCounter`
 * (`src/views/home/StatCounter.tsx`) as-is; it's already a generic
 * `{value, label, suffix}` component with nothing homepage-specific. */
export const ServiceStats = ({ stats }: ServiceStatsProps) => {
  return (
    <div className="mt-14 grid grid-cols-1 gap-10 sm:grid-cols-3">
      {stats.map((stat) => (
        <StatCounter
          key={stat.label}
          value={stat.value}
          suffix={stat.suffix}
          prefix={stat.prefix}
          label={stat.label}
        />
      ))}
    </div>
  );
};
