import Image from "next/image";
import type { TeamMember } from "@/data/mocks/team";

export interface TeamMemberCardProps {
  member: TeamMember;
  priority?: boolean;
}

/**
 * One team member, fully self-contained — photo, name, title, experience,
 * credential chips and bio all in a single card. Replaces the old split
 * "one active member in a bio panel + a photo deck" layout (see ADR-0072):
 * every member is now independently visible at once, not just whichever one
 * scroll progress currently selects.
 */
export const TeamMemberCard = ({ member, priority = false }: TeamMemberCardProps) => (
  <article className="glass-panel flex h-full flex-col overflow-hidden">
    <div className="relative aspect-[4/5] w-full overflow-hidden">
      <Image
        src={member.photo.src}
        alt={member.photo.alt}
        fill
        sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
        className="object-cover"
        priority={priority}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background: "linear-gradient(to top, rgba(1,4,14,.85) 0%, rgba(1,4,14,.15) 45%, rgba(1,4,14,0) 70%)",
        }}
      />
    </div>

    <div className="flex flex-1 flex-col gap-4 p-6">
      <div>
        <h3 className="text-foreground text-xl font-medium [text-shadow:0_1px_20px_rgba(0,0,0,.7)]">
          {member.name}
        </h3>
        <p className="text-accent mt-1 text-sm font-medium tracking-[0.04em]">
          {member.title}
        </p>
        {member.experience && (
          <p className="text-foreground/70 mt-1 text-xs tracking-[0.1em] uppercase">
            {member.experience} experience
          </p>
        )}
      </div>

      <ul className="flex flex-wrap gap-2">
        {member.credentials.map((credential) => (
          <li
            key={credential}
            className="text-foreground/90 rounded-full border border-[var(--glass-border)] bg-[var(--glass-fill)] px-3 py-1 text-xs backdrop-blur-md"
          >
            {credential}
          </li>
        ))}
      </ul>

      <p className="text-foreground/85 mt-auto text-sm leading-relaxed [text-shadow:0_1px_16px_rgba(0,0,0,.6)]">
        {member.bio}
      </p>
    </div>
  </article>
);
