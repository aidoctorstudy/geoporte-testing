import Link from "next/link";
import Image from "next/image";
import { baseTeamMembers } from "@/data/mocks/team";
import { Magnetic } from "@/components/common/Magnetic";

export const TeamCtaSection = () => {
  return (
    <section
      id="team-cta"
      aria-labelledby="team-cta-heading"
      className="mx-auto max-w-6xl px-6 py-24 md:px-8 md:py-32"
    >
      {/* Portrait row */}
      <div className="flex flex-wrap justify-center gap-6 md:justify-start">
        {baseTeamMembers.map((member) => (
          <Link
            key={member.name}
            href="/about/team"
            className="group flex flex-col items-center gap-2 text-center"
            aria-label={`${member.name}, ${member.title}`}
          >
            <div className="border-line relative h-16 w-16 overflow-hidden rounded-full border-2 transition-transform duration-200 group-hover:scale-105">
              <Image
                src={member.photo.src}
                alt={member.photo.alt}
                fill
                sizes="64px"
                className="object-cover"
              />
            </div>
            <span className="text-foreground max-w-[80px] text-[11px] font-medium leading-tight">
              {member.name}
            </span>
            <span className="text-foreground-muted max-w-[80px] text-[10px] leading-tight">
              {member.title.split(",")[0]}
            </span>
          </Link>
        ))}
      </div>

      {/* Closing CTA */}
      <div className="mt-20 border-t border-line pt-20 text-center">
        <h2
          id="team-cta-heading"
          className="font-heading text-foreground mx-auto max-w-2xl text-3xl font-medium leading-snug md:text-4xl"
        >
          Ready to engineer with confidence in complex ground?
        </h2>
        <p className="text-foreground-muted mx-auto mt-6 max-w-xl text-base leading-relaxed">
          Tell us about your project and a senior engineer will reply within one
          business day.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Magnetic>
            <Link
              href="/contact"
              className="bg-accent hover:bg-accent/90 inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-medium text-white transition-colors"
            >
              Discuss your project
            </Link>
          </Magnetic>
          <Magnetic>
            <a
              href="/assets/Geoporte_ME_Capability_Statement_2026.pdf"
              download
              className="border-line text-foreground hover:border-accent/60 inline-flex items-center gap-2 rounded-full border px-7 py-3.5 text-sm font-medium transition-colors"
            >
              Download capability statement (PDF)
            </a>
          </Magnetic>
        </div>
      </div>
    </section>
  );
};
