import type { Metadata } from "next";
import { isAdminSession } from "@/lib/admin-auth";
import { getHeroHeading, slugify } from "@/lib/content-overrides";
import { isPublishConfigured } from "@/lib/content-publish";
import { getImageManifest } from "@/lib/image-manifest";
import { services } from "@/data/mocks/services";
import { baseProjects, projects } from "@/data/mocks/projects";
import { baseTeamMembers, teamMembers } from "@/data/mocks/team";
import { AdminLoginForm } from "./admin/AdminLoginForm";
import { AdminTabs } from "./admin/AdminTabs";

/** A private utility page, not a real page of the site — skips the shared
 * `generateMetadata` helper entirely (no OG/Twitter/JSON-LD needed) and
 * explicitly opts out of indexing, belt-and-suspenders with `robots.ts`'s
 * `disallow`. */
export function generateMetadata(): Metadata {
  return { title: "Content Editor | Geoporte", robots: { index: false, follow: false } };
}

/**
 * `/admin` — password-gated simple content editor (no CMS, no database;
 * see `src/lib/content-overrides.ts` for text, `src/lib/image-manifest.ts`
 * for photos). A Server Component so the password check and the current
 * content read both happen server-side; the two possible results below are
 * the only client leaves.
 */
export const AdminView = async () => {
  const authenticated = await isAdminSession();
  if (!authenticated) return <AdminLoginForm />;

  return (
    <AdminTabs
      heroHeading={getHeroHeading()}
      publishConfigured={isPublishConfigured()}
      images={getImageManifest()}
      services={services.map((service) => ({
        slug: service.slug,
        title: service.title,
        shortDescription: service.shortDescription,
        overview: service.overview,
      }))}
      // `baseProjects`/`projects` share the same order (`projects` is just
      // `baseProjects` mapped), so pairing them by index is safe — the id
      // comes from the original title, the pre-filled text from the current
      // (possibly already-overridden) one.
      projects={baseProjects.map((base, i) => ({
        id: slugify(base.title),
        title: projects[i].title,
        description: projects[i].description,
      }))}
      team={baseTeamMembers.map((base, i) => ({
        id: slugify(base.name),
        name: teamMembers[i].name,
        bio: teamMembers[i].bio,
      }))}
    />
  );
};
