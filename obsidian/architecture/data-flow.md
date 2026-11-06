---
tags: [architecture, stable]
updated: 2026-11-06
---

# Data Flow

How state, scroll position, and animation data move through the app. Almost
all of it is **client-side UI state** — the one exception is `/admin`'s
content-override layer (see below), a small file-backed read/write path.

## Provider hierarchy (fixed order)

The root layout (`src/app/layout.tsx`) wraps everything in this exact order.
**Do not reorder** — see [[decisions-log]].

```
<html> <body>
  <ScrollLayout>        ← Lenis smooth scroll + scroll state store
    <LazyCookie />      ← cookie consent banner + preferences modal
    {children}          ← the routed page
  </ScrollLayout>
</body> </html>
```

## Scroll state — Zustand store

The scroll store (`src/hooks/smooth-scroll/use-scroll.ts`) is the one piece of
global state. Shape:

```ts
{
  lenis: Lenis | null      // the Lenis instance
  setLenis(...)            // setter
  isEnableScroll: boolean  // is scrolling currently allowed?
  start()                  // enable scroll
  stop()                   // disable scroll (e.g. modal open)
}
```

### Flow

```
ScrollController (in ScrollLayout) mounts
   │
   ├─ new Lenis()  →  setLenis(instance)   ──► store.lenis
   │
   ├─ requestAnimationFrame loop  →  lenis.raf(time)   (continuous)
   │
   └─ watches store.isEnableScroll:
         true  → lenis.start() + native scroll on
         false → lenis.stop()  + native scroll locked (html overflow:hidden)
```

Any component reads/writes scroll state through the store:

```ts
const lenis = useScroll((s) => s.lenis)
const [start, stop] = useScroll(useShallow((s) => [s.start, s.stop]))
```

See [[smooth-scroll]] for the full API.

## Animation data flow

Animation values never live in React state — they live in **springs**.

```
Component renders with from / to props
   │
   ▼
@react-spring/web useSpring  →  animated values (outside React render cycle)
   │
   ▼
Trigger source updates the spring:
   ├─ IntersectionObserver   → <Inview>, <Spring>     (enter viewport)
   ├─ scroll position        → <SpringTrigger>        (scroll progress)
   ├─ mouse events           → <Hover>                (pointer enter/leave)
   └─ scroll position        → <TextEngine mode="progress">
   │
   ▼
animated.<tag> applies values directly to the DOM node — no re-render
```

Global animation behaviour (mobile disable, breakpoint) is read from
`src/lib/springs/config.ts` — see [[animation-system]].

## Page data flow

```
app/page.tsx  →  views/home.tsx  →  composed components
```

Per the [[component-conventions]]:
- **No hardcoded content** in components — data comes from props or hooks.
- Placeholder data → `src/data/mocks/<page>.ts`, passed via props.
- Async data → custom hook in `src/hooks/`; component handles `loading` / `error`
  / `empty` with skeleton loaders. See [[components/common]].

## Server / external data flow

External APIs are reached **only** through server code — the browser never
calls a third party directly or holds a secret.

```
Server Component         →  reads data at render time (no client request)
Client Component         →  apiFetch('/api/…')  →  app/api/**/route.ts  →  upstream
app/api/**/route.ts      →  validates (zod) → does the work → { data } | { error }
```

Secrets live in unprefixed env vars, read via `getServerEnv()` inside route
handlers. Full convention: [[api-architecture]].

## Hash-link scrolling

`ScrollController` watches `usePathname()`. If the path contains a `#hash`, it waits
300 ms then calls `scrollTo(hash, true)` so smooth scroll lands on the target.

## Content overrides (`/admin`)

The one real server-side data flow in this project (see ADR-0112 for the
full reasoning):

```
src/data/content.json  →  content-overrides.ts (plain JSON import)  →
  services.ts / projects.ts / team.ts merge it into their exported arrays  →
  every existing consumer (server or client) reads the merged result unchanged

/admin (Server Component, reads the session cookie)  →  AdminEditor (client)  →
  POST /api/admin/content  →  one of:
    (a) GITHUB_TOKEN/GITHUB_REPO/VERCEL_DEPLOY_HOOK all set:
        commit content.json to GitHub → POST the Deploy Hook → Vercel rebuilds (~2 min)
    (b) any missing: fs.writeFile(content.json) locally →
        next dev's file watcher Fast-Refreshes every importer
```

Because the import is static, a production build bakes `content.json`'s
contents in at build time — that's *why* path (a) above has to exist at all:
`/admin` can't change live content by writing a file on Vercel (read-only at
runtime, and nothing there survives past the request anyway), only by
getting a new commit built. See ADR-0113 for why "just hit a Deploy Hook"
alone doesn't work. Keys are `slugify()`d from each project's/team member's
*original* title/name (read from the new `baseProjects`/`baseTeamMembers`
exports), never from the current, possibly already-overridden value — see
ADR-0112.

## Related

[[system-overview]] · [[smooth-scroll]] · [[animation-system]] · [[backend/README]]
