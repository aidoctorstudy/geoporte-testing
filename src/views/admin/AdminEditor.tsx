"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, ApiClientError } from "@/lib/api-client";

const fieldClassName =
  "border-line bg-surface text-foreground placeholder:text-foreground-muted/60 focus:border-accent w-full rounded-lg border px-4 py-2.5 text-sm outline-none transition-colors duration-[var(--duration-fast)] ease-entrance";

export interface AdminServiceFields {
  slug: string;
  title: string;
  shortDescription: string;
  overview: string;
}

export interface AdminProjectFields {
  id: string;
  title: string;
  description: string;
}

export interface AdminTeamFields {
  id: string;
  name: string;
  bio: string;
}

export interface AdminEditorProps {
  heroHeading: string;
  services: AdminServiceFields[];
  projects: AdminProjectFields[];
  team: AdminTeamFields[];
  /** Whether `GITHUB_TOKEN`/`GITHUB_REPO`/`VERCEL_DEPLOY_HOOK` are all
   * configured (`isPublishConfigured()`, read server-side in `admin.tsx`) —
   * known ahead of the save request, so the UI can say "publishing" rather
   * than just "saving" from the moment the button is clicked. See ADR-0113. */
  publishConfigured: boolean;
}

type SaveStatus = "idle" | "saving" | "saved" | "error";

/**
 * The actual editor behind `/admin`'s password gate. One form, one "Save all
 * changes" button posting the whole content object to `/api/admin/content`
 * — no per-field saves, no autosave, matching the brief's "simple" framing.
 * Pre-filled with the *current effective* text (base content plus any prior
 * `/admin` edits); saving always writes what's currently in the fields,
 * regardless of whether it matches the original.
 */
export const AdminEditor = ({ heroHeading, services, projects, team, publishConfigured }: AdminEditorProps) => {
  const router = useRouter();
  const [heading, setHeading] = useState(heroHeading);
  const [serviceFields, setServiceFields] = useState(() =>
    Object.fromEntries(services.map((s) => [s.slug, { shortDescription: s.shortDescription, overview: s.overview }])),
  );
  const [projectFields, setProjectFields] = useState(() =>
    Object.fromEntries(projects.map((p) => [p.id, { title: p.title, description: p.description }])),
  );
  const [teamFields, setTeamFields] = useState(() =>
    Object.fromEntries(team.map((m) => [m.id, { name: m.name, bio: m.bio }])),
  );
  const [projectQuery, setProjectQuery] = useState("");
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [published, setPublished] = useState(false);
  const [error, setError] = useState("");

  const filteredProjects = useMemo(() => {
    const q = projectQuery.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter((p) => projectFields[p.id].title.toLowerCase().includes(q));
  }, [projectQuery, projects, projectFields]);

  const handleSave = async (event: FormEvent) => {
    event.preventDefault();
    setStatus("saving");
    setError("");
    try {
      const result = await apiFetch<{ ok: boolean; published: boolean }>("/api/admin/content", {
        method: "POST",
        body: JSON.stringify({
          hero: { heading },
          services: serviceFields,
          projects: projectFields,
          team: teamFields,
        }),
      });
      setPublished(result.published);
      setStatus("saved");
      router.refresh();
    } catch (err) {
      setStatus("error");
      setError(err instanceof ApiClientError ? err.message : "Something went wrong — please try again.");
    }
  };

  const handleLogout = async () => {
    await apiFetch("/api/admin/logout", { method: "POST" });
    router.refresh();
  };

  return (
    <main className="mx-auto max-w-3xl px-6 py-16 md:px-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-foreground text-2xl font-medium">Content editor</h1>
          <p className="text-foreground-muted mt-2 text-sm leading-relaxed">
            Edit text here, then save — changes go straight to the live pages.
          </p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="text-foreground-muted hover:text-foreground border-line shrink-0 rounded-lg border px-4 py-2 text-sm transition-colors duration-[var(--duration-fast)] ease-entrance"
        >
          Log out
        </button>
      </div>

      <form onSubmit={handleSave} className="mt-10 flex flex-col gap-10">
        <section>
          <h2 className="text-label text-xs uppercase tracking-[0.12em]">Homepage hero</h2>
          <label htmlFor="hero-heading" className="text-foreground-muted mt-3 mb-2 block text-sm">
            Heading
          </label>
          <input
            id="hero-heading"
            value={heading}
            onChange={(event) => setHeading(event.target.value)}
            maxLength={200}
            className={fieldClassName}
          />
        </section>

        <section>
          <h2 className="text-label text-xs uppercase tracking-[0.12em]">Services ({services.length})</h2>
          <div className="mt-4 flex flex-col gap-6">
            {services.map((service) => (
              <details key={service.slug} className="border-line rounded-lg border p-4">
                <summary className="text-foreground cursor-pointer text-sm font-medium">{service.title}</summary>
                <div className="mt-4 flex flex-col gap-4">
                  <div>
                    <label
                      htmlFor={`service-short-${service.slug}`}
                      className="text-foreground-muted mb-2 block text-sm"
                    >
                      Short description
                    </label>
                    <input
                      id={`service-short-${service.slug}`}
                      value={serviceFields[service.slug].shortDescription}
                      maxLength={300}
                      onChange={(event) =>
                        setServiceFields((current) => ({
                          ...current,
                          [service.slug]: { ...current[service.slug], shortDescription: event.target.value },
                        }))
                      }
                      className={fieldClassName}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor={`service-overview-${service.slug}`}
                      className="text-foreground-muted mb-2 block text-sm"
                    >
                      Overview
                    </label>
                    <textarea
                      id={`service-overview-${service.slug}`}
                      value={serviceFields[service.slug].overview}
                      maxLength={3000}
                      rows={4}
                      onChange={(event) =>
                        setServiceFields((current) => ({
                          ...current,
                          [service.slug]: { ...current[service.slug], overview: event.target.value },
                        }))
                      }
                      className={`${fieldClassName} resize-none`}
                    />
                  </div>
                </div>
              </details>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-label text-xs uppercase tracking-[0.12em]">Projects ({projects.length})</h2>
          <input
            type="search"
            value={projectQuery}
            onChange={(event) => setProjectQuery(event.target.value)}
            placeholder="Filter by title…"
            className={`${fieldClassName} mt-3`}
          />
          <div className="mt-4 flex max-h-[32rem] flex-col gap-4 overflow-y-auto pr-1">
            {filteredProjects.map((project) => (
              <details key={project.id} className="border-line rounded-lg border p-4">
                <summary className="text-foreground cursor-pointer text-sm font-medium">
                  {projectFields[project.id].title}
                </summary>
                <div className="mt-4 flex flex-col gap-4">
                  <div>
                    <label
                      htmlFor={`project-title-${project.id}`}
                      className="text-foreground-muted mb-2 block text-sm"
                    >
                      Title
                    </label>
                    <input
                      id={`project-title-${project.id}`}
                      value={projectFields[project.id].title}
                      maxLength={200}
                      onChange={(event) =>
                        setProjectFields((current) => ({
                          ...current,
                          [project.id]: { ...current[project.id], title: event.target.value },
                        }))
                      }
                      className={fieldClassName}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor={`project-description-${project.id}`}
                      className="text-foreground-muted mb-2 block text-sm"
                    >
                      Description
                    </label>
                    <textarea
                      id={`project-description-${project.id}`}
                      value={projectFields[project.id].description}
                      maxLength={2000}
                      rows={3}
                      onChange={(event) =>
                        setProjectFields((current) => ({
                          ...current,
                          [project.id]: { ...current[project.id], description: event.target.value },
                        }))
                      }
                      className={`${fieldClassName} resize-none`}
                    />
                  </div>
                </div>
              </details>
            ))}
            {filteredProjects.length === 0 && (
              <p className="text-foreground-muted text-sm">No projects match &ldquo;{projectQuery}&rdquo;.</p>
            )}
          </div>
        </section>

        <section>
          <h2 className="text-label text-xs uppercase tracking-[0.12em]">Team ({team.length})</h2>
          <div className="mt-4 flex flex-col gap-4">
            {team.map((member) => (
              <details key={member.id} className="border-line rounded-lg border p-4">
                <summary className="text-foreground cursor-pointer text-sm font-medium">
                  {teamFields[member.id].name}
                </summary>
                <div className="mt-4 flex flex-col gap-4">
                  <div>
                    <label htmlFor={`team-name-${member.id}`} className="text-foreground-muted mb-2 block text-sm">
                      Name
                    </label>
                    <input
                      id={`team-name-${member.id}`}
                      value={teamFields[member.id].name}
                      maxLength={200}
                      onChange={(event) =>
                        setTeamFields((current) => ({
                          ...current,
                          [member.id]: { ...current[member.id], name: event.target.value },
                        }))
                      }
                      className={fieldClassName}
                    />
                  </div>
                  <div>
                    <label htmlFor={`team-bio-${member.id}`} className="text-foreground-muted mb-2 block text-sm">
                      Bio
                    </label>
                    <textarea
                      id={`team-bio-${member.id}`}
                      value={teamFields[member.id].bio}
                      maxLength={2000}
                      rows={3}
                      onChange={(event) =>
                        setTeamFields((current) => ({
                          ...current,
                          [member.id]: { ...current[member.id], bio: event.target.value },
                        }))
                      }
                      className={`${fieldClassName} resize-none`}
                    />
                  </div>
                </div>
              </details>
            ))}
          </div>
        </section>

        <div className="border-line sticky bottom-0 flex flex-col gap-2 border-t bg-background/95 py-4 backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={status === "saving"}
              className="bg-accent text-accent-foreground hover:bg-accent/90 inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-medium transition-colors duration-[var(--duration-fast)] ease-entrance disabled:cursor-not-allowed disabled:opacity-60"
            >
              {status === "saving" && (
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
              )}
              {status === "saving"
                ? publishConfigured
                  ? "Saving and publishing…"
                  : "Saving…"
                : "Save all changes"}
            </button>
            {status === "saved" && !published && (
              <p className="text-foreground-muted text-sm">Saved — local only (no publish target configured).</p>
            )}
            {status === "error" && (
              <p role="alert" className="text-danger text-sm">
                {error}
              </p>
            )}
          </div>
          {status === "saved" && published && (
            <p role="status" className="text-foreground-muted text-sm">
              Saved and publishing — the live site will update in about 2 minutes.
            </p>
          )}
        </div>
      </form>
    </main>
  );
};
