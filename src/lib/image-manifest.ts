/**
 * Enumerates every "real content photo" `/admin`'s Photos tab can replace
 * (ADR-0114). Scoped deliberately to the four categories that are safe for
 * a plain upload-and-overwrite — project photos, team photos, service hero
 * images, publication covers — not every image asset in the codebase:
 *
 * - The logo (`public/assets/logo/geoporte-logo.png`) is background-removed
 *   from a source JPG via `scripts/process-logo.mjs`; a raw replace would
 *   ship a logo with a solid background box instead of a transparent cutout.
 * - The WebGL/video-scene assets (`public/assets/{bird,golden-parthenon,
 *   planet,purple-planet,siloutte}/`) are textures and video poster frames,
 *   not literal photos — wrong resolution/aspect there can visibly break a
 *   3D scene, not just look slightly off.
 *
 * Both are left code-only. Computed from the live data arrays (not a
 * hand-maintained parallel list) so it can never drift from what the site
 * actually renders — same principle as `content-overrides.ts`'s stable
 * keys. Server-only by convention (only ever read from `admin.tsx`), though
 * nothing in it is actually unsafe to bundle client-side.
 */
import { services } from "@/data/mocks/services";
import { projects } from "@/data/mocks/projects";
import { teamMembers } from "@/data/mocks/team";
import { experienceTeamPhoto } from "@/data/mocks/experience";
import { publications } from "@/data/mocks/publications";
import { SERVICE_IMAGES } from "@/views/services/ServiceOverview";

export type ImageCategory = "Projects" | "Team" | "Services" | "Publications";

export interface ImageManifestEntry {
  /** The public path, e.g. `/assets/projects/2222.jpeg` — doubles as the
   * unique id and, with `public` prefixed, the GitHub repo path to commit
   * a replacement to. */
  path: string;
  category: ImageCategory;
  /** Every project/person/service/publication that renders this exact
   * file — several projects reuse the same photo (27 real photos across
   * 31 projects; see `projects.ts`'s own header comment), so this is an
   * array, not a single name. */
  usedIn: string[];
}

/** Builds the manifest fresh on every call (cheap — a few dozen array
 * entries) rather than caching, so the one place that computes it
 * (`/admin`, a Server Component rendered on every request) always reflects
 * the current data, including any text overrides already applied to
 * `services`/`projects`/`teamMembers`. */
export const getImageManifest = (): ImageManifestEntry[] => {
  const byPath = new Map<string, ImageManifestEntry>();

  const add = (path: string, category: ImageCategory, name: string) => {
    const existing = byPath.get(path);
    if (existing) {
      if (!existing.usedIn.includes(name)) existing.usedIn.push(name);
    } else {
      byPath.set(path, { path, category, usedIn: [name] });
    }
  };

  projects.forEach((project) => add(project.image.src, "Projects", project.title));
  teamMembers.forEach((member) => add(member.photo.src, "Team", member.name));
  add(experienceTeamPhoto.src, "Team", "Homepage team photo");
  Object.entries(SERVICE_IMAGES).forEach(([slug, path]) => {
    const service = services.find((s) => s.slug === slug);
    add(path, "Services", service?.title ?? slug);
  });
  publications.forEach((publication) => add(publication.cover.src, "Publications", publication.title));

  return Array.from(byPath.values());
};

/** The one thing the upload route actually needs — whether a submitted
 * path is one of the known, replaceable images. Everything else about the
 * manifest (labels, categories) is display-only. */
export const isKnownImagePath = (path: string): boolean =>
  getImageManifest().some((entry) => entry.path === path);
