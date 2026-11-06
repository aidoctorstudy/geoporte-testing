"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, ApiClientError } from "@/lib/api-client";

const fieldClassName =
  "border-line bg-surface text-foreground placeholder:text-foreground-muted/60 focus:border-accent w-full rounded-lg border px-4 py-3 text-sm outline-none transition-colors duration-[var(--duration-fast)] ease-entrance";

/**
 * `/admin`'s single-password gate — posts to `/api/admin/login`, which sets
 * the session cookie on success. `router.refresh()` re-runs `admin.tsx` (a
 * Server Component) so it picks up the now-authenticated cookie and swaps in
 * `AdminEditor` — no client-side redirect needed, we're already on `/admin`.
 */
export const AdminLoginForm = () => {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await apiFetch("/api/admin/login", {
        method: "POST",
        body: JSON.stringify({ password }),
      });
      router.refresh();
    } catch (err) {
      setSubmitting(false);
      setError(err instanceof ApiClientError ? err.message : "Something went wrong — please try again.");
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <form
        onSubmit={handleSubmit}
        className="border-line bg-surface w-full max-w-sm rounded-2xl border p-8"
        noValidate
      >
        <h1 className="text-foreground text-xl font-medium">Content editor</h1>
        <p className="text-foreground-muted mt-2 text-sm leading-relaxed">
          Enter the admin password to edit the site&apos;s text content.
        </p>

        <label htmlFor="admin-password" className="text-label mt-6 mb-2 block text-xs uppercase tracking-[0.12em]">
          Password
        </label>
        <input
          id="admin-password"
          type="password"
          required
          autoFocus
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className={fieldClassName}
        />

        {error && (
          <p role="alert" className="text-danger mt-3 text-sm">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting || password.length === 0}
          className="bg-accent text-accent-foreground hover:bg-accent/90 mt-6 w-full rounded-lg px-6 py-3 text-sm font-medium transition-colors duration-[var(--duration-fast)] ease-entrance disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Checking…" : "Log in"}
        </button>
      </form>
    </main>
  );
};
