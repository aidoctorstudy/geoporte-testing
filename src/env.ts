/**
 * Validated environment variables.
 *
 * `publicEnv` holds `NEXT_PUBLIC_*` values — inlined into the client bundle,
 * safe in the browser. `getServerEnv()` holds server-only values (secrets) —
 * never read it from client code; on the client those values are `undefined`.
 *
 * A missing/invalid variable fails fast with a clear zod error rather than
 * surfacing as a confusing runtime bug later.
 */

import { z } from "zod";

/**
 * Treat an empty env var as unset.
 *
 * `cp .env.example .env` leaves declared-but-blank keys (`CONTACT_ENDPOINT=`),
 * which reach us as `""` — and `""` is not `undefined`, so an `.optional()`
 * schema would reject it as "Invalid URL". Without this, the documented setup
 * flow would break every optional variable the moment someone copied the
 * example file.
 */
const optionalUrl = () =>
  z.preprocess((v) => (v === "" ? undefined : v), z.url().optional());

/** Same `""` → unset treatment as `optionalUrl()`, for a plain secret string
 * rather than a URL (e.g. `ADMIN_PASSWORD`). */
const optionalString = () =>
  z.preprocess((v) => (v === "" ? undefined : v), z.string().min(1).optional());

const publicSchema = z.object({
  NEXT_PUBLIC_SITE_URL: optionalUrl(),
});

const serverSchema = z.object({
  /** Optional upstream the contact endpoint forwards leads to (CRM / webhook). */
  CONTACT_ENDPOINT: optionalUrl(),
  /** `/admin`'s single hardcoded password (ADR-0112) — a simple content
   * editor, not a real auth system. Unset disables `/admin` entirely rather
   * than falling back to a guessable default. */
  ADMIN_PASSWORD: optionalString(),
  /** Together with `GITHUB_REPO` and `VERCEL_DEPLOY_HOOK`, lets `/admin`
   * publish to production (ADR-0113): a fine-grained PAT with "Contents:
   * write" on that one repo. All three are required together — if any is
   * missing, `/admin` falls back to a local-disk write (dev-only, see
   * ADR-0112) instead of publishing. */
  GITHUB_TOKEN: optionalString(),
  /** `"owner/repo"` — the repo `/admin` commits `content.json` to. */
  GITHUB_REPO: optionalString(),
  /** Branch Vercel's production deployment is built from. Defaults to
   * `master` (this repo's current default branch) when the other two
   * publish vars are set but this one isn't. */
  GITHUB_BRANCH: optionalString(),
  /** Vercel Deploy Hook URL — POSTed after the GitHub commit succeeds, so a
   * rebuild starts immediately rather than waiting on Vercel's own git-push
   * webhook (which may be slower, or not configured to auto-deploy this
   * branch at all). See ADR-0113. */
  VERCEL_DEPLOY_HOOK: optionalUrl(),
});

/** Public env — safe to read anywhere (server or client). */
export const publicEnv = publicSchema.parse({
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
});

let cachedServerEnv: z.infer<typeof serverSchema> | undefined;

/**
 * Server-only env. Call from route handlers / server code only — parsed
 * lazily so the client bundle never evaluates it.
 */
export function getServerEnv() {
  cachedServerEnv ??= serverSchema.parse({
    CONTACT_ENDPOINT: process.env.CONTACT_ENDPOINT,
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
    GITHUB_TOKEN: process.env.GITHUB_TOKEN,
    GITHUB_REPO: process.env.GITHUB_REPO,
    GITHUB_BRANCH: process.env.GITHUB_BRANCH,
    VERCEL_DEPLOY_HOOK: process.env.VERCEL_DEPLOY_HOOK,
  });
  return cachedServerEnv;
}
