---
tags: [backend, stable]
updated: 2026-11-07
---

# Backend

`next16-claude-starter` is frontend-first, with a server **API layer**: Next.js
Route Handlers under `src/app/api/`. The starter itself ships **no database, CMS
or auth** — those are added per project, and the conventions for doing so are
documented here so every project built from this starter does it the same way.

## What exists

- **API endpoints** — `app/api/**/route.ts` Route Handlers. Convention and
  rules: [[api-architecture]].
- **Env validation** — `src/env.ts` (zod), public vs server-only split.
- **Shared API helpers** — `src/lib/api/` (`handle`, `ApiError`) and the
  client-side `src/lib/api-client.ts`.

## Not in the starter — added per project

| Need | Choice | Note | Added by |
|------|--------|------|----------|
| CMS | **Payload**, inside this Next app | [[cms-payload]] | `/cms` |
| Database | **Supabase** Postgres | [[database-supabase]] | `/db` |
| File storage | **Supabase Storage** (S3-compatible) | [[cms-payload]] | `/cms` |
| Auth | **Supabase Auth** — only if real user accounts are needed | [[database-supabase]] | `supabase-auth` skill |

They stay out of the starter deliberately: most projects built from it are
marketing sites that never need a database, and an unused Payload install is a
large dependency surface plus a migration story to maintain. The decision is
recorded as ADR-0020.

> [!note] `/admin` is a one-off password gate, not Supabase Auth
> This project added a simple content editor at `/admin` — one hardcoded
> `ADMIN_PASSWORD`, one session cookie, no accounts, no database — explicitly
> requested as a lighter-weight alternative to real auth. See
> [[decisions-log]] ADR-0112 for the full reasoning. Saving on Vercel (read-
> only filesystem at runtime) works by committing straight to GitHub and
> triggering a Deploy Hook rather than writing a local file — ADR-0113 — gated
> behind `GITHUB_TOKEN`/`GITHUB_REPO`/`VERCEL_DEPLOY_HOOK`; without those it
> still falls back to a local-file write for `next dev`. A "Photos" tab
> (ADR-0114) replaces project/team/service/publication photos the same way —
> same publish trio, path-whitelisted so the upload can only ever overwrite
> one of 50 known image files, never an arbitrary repo path. If this ever needs
> real multi-user editing or instant (no-rebuild) updates, that's the signal
> to swap `src/lib/content-overrides.ts`'s JSON import for Payload/Supabase
> instead of extending the GitHub-commit approach further.

Still open:

- Server Actions — the default for mutations is still TBD; everything currently
  goes through `app/api`.

Also: add deps to [[tech-stack]], record an ADR in [[decisions-log]], update
[[data-flow]], add a [[changelog]] entry.

> [!tip] Deployment target
> The repo targets **Vercel**. Route handlers run on Fluid Compute (Node.js) —
> do not use the Edge runtime (Next 16 removed it from `proxy.ts` regardless).
> See [[ship]] for the launch gate.

## Related

[[api-architecture]] · [[cms-payload]] · [[database-supabase]] · [[system-overview]] · [[tech-stack]] · [[environment-variables]] · [[ship]]
