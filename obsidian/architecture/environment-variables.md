---
tags: [architecture, config, stable]
updated: 2026-11-07
---

# Environment Variables

Rules for handling configuration and secrets.

## Rules

- Store all secrets in **`.env.local`** — never commit it (it is git-ignored).
- Document every required variable in **`.env.example`** (committed, no real values).
- Reference variables in code via `process.env.VARIABLE_NAME`.
- Prefix with **`NEXT_PUBLIC_`** only if the value is safe to expose to the browser.
  Unprefixed variables are server-only.

## Current variables

| Name | Scope | Purpose |
|------|-------|---------|
| `NEXT_PUBLIC_SITE_URL` | public | Site origin (no trailing slash). Drives canonical URLs, OG/Twitter tags, `robots.txt`, `sitemap.xml`, JSON-LD. Falls back to `https://geoporte-testing.vercel.app` when unset (this project's deployed origin — was `http://localhost:3000` until the 2026-10-10 fix in [[changelog]], which was leaking into production canonical tags because the var was never actually set on Vercel) — **set this var in the Vercel project regardless; the fallback is a safety net, not a substitute**. See [[seo-metadata]]. |
| `CONTACT_ENDPOINT` | server-only | Optional upstream the `/api/contact` route forwards leads to (CRM / webhook). When unset, submissions are logged server-side. See [[api-architecture]]. |
| `ADMIN_PASSWORD` | server-only | `/admin`'s single-password content-editor gate (not a real auth system — see [[decisions-log]] ADR-0112). Unset disables `/admin` entirely (login always fails) rather than falling back to a guessable default. |
| `GITHUB_TOKEN` | server-only | Fine-grained PAT, "Contents: write" on this repo only. With `GITHUB_REPO` and `VERCEL_DEPLOY_HOOK`, lets `/admin` publish text *and photo* edits to production — see [[decisions-log]] ADR-0113/ADR-0114. Any one of the three missing falls back to `/admin`'s local-file write (dev only). |
| `GITHUB_REPO` | server-only | `"owner/repo"` `/admin` commits to (`content.json` for text, `public/assets/**` for a replaced photo), e.g. `aidoctorstudy/geoporte-testing`. Part of the same publish trio as `GITHUB_TOKEN` above. |
| `GITHUB_BRANCH` | server-only | Branch Vercel's production deployment builds from. Optional even when publishing is configured — defaults to `master` (this repo's current default branch). |
| `VERCEL_DEPLOY_HOOK` | server-only | Deploy Hook URL (Vercel project → Settings → Git → Deploy Hooks). POSTed after `/admin`'s GitHub commit (text or photo) succeeds, so a rebuild starts without waiting on Vercel's own git-push webhook. Part of the same publish trio as `GITHUB_TOKEN` above. |

Documented in `.env.example` (committed). Validated by `src/env.ts` (zod):
`publicEnv` for `NEXT_PUBLIC_*` (safe anywhere), `getServerEnv()` for
server-only secrets (route handlers only) — see [[api-architecture]]. Read env
through `src/env.ts`, never `process.env` directly.

> [!important] Optional variables must treat `""` as unset
> `cp .env.example .env` — the documented setup step — leaves declared-but-blank
> keys (`CONTACT_ENDPOINT=`), which arrive as `""`, **not** `undefined`. A bare
> `z.url().optional()` rejects `""` as *"Invalid URL"*, so the copy alone broke
> `/api/contact`. Every optional variable therefore goes through the
> `optionalUrl()` helper in `src/env.ts`, which preprocesses `""` → `undefined`.
> **Follow this for any new optional variable** — `.optional()` on its own is not
> enough.

> [!important] Secret handling
> Secret keys are **unprefixed** — `NEXT_PUBLIC_` is only for values safe in the
> browser. Secrets are read in server code (`app/api/**`); the browser never
> holds one. See [[api-architecture]].

When the next variable is introduced:
1. Add it to `.env.example` with a comment describing it.
2. Add a row to the table above (name, scope, purpose).
3. If it is optional, wrap it so `""` parses as unset (see the note above) —
   otherwise copying `.env.example` breaks it.
4. Add a [[changelog]] entry.

## Related

[[tech-stack]] · [[seo-metadata]] · [[backend/README]]
