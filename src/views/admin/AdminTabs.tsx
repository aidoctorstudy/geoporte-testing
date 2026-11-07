"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api-client";
import { AdminEditor, type AdminEditorProps } from "./AdminEditor";
import { AdminPhotos, type AdminImageEntry } from "./AdminPhotos";

export interface AdminTabsProps extends AdminEditorProps {
  images: AdminImageEntry[];
}

type Tab = "content" | "photos";

const TAB_LABEL: Record<Tab, string> = { content: "Content", photos: "Photos" };

/**
 * Owns the one piece of state `AdminEditor`/`AdminPhotos` don't each need
 * their own copy of: which tab is active. Also owns the shared header
 * (title, log out) so it renders once rather than once per tab. See
 * ADR-0114 — the "Photos" tab was added alongside the existing text editor,
 * not folded into it, since photo replacement has no "save all" batching
 * (each upload publishes immediately) unlike the text fields.
 */
export const AdminTabs = (props: AdminTabsProps) => {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("content");

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
            Edit text or photos here, then save — changes go straight to the live pages.
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

      <div role="tablist" className="border-line mt-8 flex gap-1 border-b">
        {(Object.keys(TAB_LABEL) as Tab[]).map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={`-mb-px border-b-2 px-4 py-3 text-sm font-medium transition-colors duration-[var(--duration-fast)] ease-entrance ${
              tab === key
                ? "border-accent text-foreground"
                : "text-foreground-muted hover:text-foreground border-transparent"
            }`}
          >
            {TAB_LABEL[key]}
          </button>
        ))}
      </div>

      <div className="mt-10">
        {tab === "content" ? (
          <AdminEditor
            heroHeading={props.heroHeading}
            services={props.services}
            projects={props.projects}
            team={props.team}
            publishConfigured={props.publishConfigured}
          />
        ) : (
          <AdminPhotos images={props.images} publishConfigured={props.publishConfigured} />
        )}
      </div>
    </main>
  );
};
