---
tags: [architecture, stable]
updated: 2026-08-24
---

# Tech Stack

Every dependency in `package.json`, what it does, and why it is here.
Package name: `next16-claude-starter` · version `0.1.0` · private.

## Core framework

| Package | Version | Role |
|---------|---------|------|
| `next` | `16.3.1` | App Router framework. ⚠️ See warning below. |
| `react` / `react-dom` | `19.2.8` | UI runtime |
| `typescript` | `^5` | Type system — `any` is banned |

> [!warning] This is not the Next.js you may know
> `AGENTS.md` warns: APIs, conventions, and file structure may differ from older
> Next.js knowledge. Always check [[routing]] before writing routing code, and
> heed deprecation notices.

## Styling

| Package | Version | Role |
|---------|---------|------|
| `tailwindcss` | `^4` | Utility CSS — **no `tailwind.config.js`** |
| `@tailwindcss/postcss` | `^4` | PostCSS integration |

Tailwind v4 is configured entirely in `src/app/globals.css` via `@theme inline`.
See [[design-system]].

## Animation (the heart of the starter)

| Package | Version | Role |
|---------|---------|------|
| `@react-spring/web` | `^10.1.2` | Spring physics — drives **all** motion |
| `spring-text-engine` | `^0.1.5` | Scroll-aware spring text animation |

No `framer-motion`, no CSS transitions/keyframes. See [[animation-system]] and
[[text-engine]]. ADR: [[decisions-log]] ADR-0002.

## 3D — Geoporte hero + service scenes

| Package | Version | Role |
|---------|---------|------|
| `three` | `^0.185.1` | WebGL scene engine for the bespoke digital-twin hero and per-service scenes |
| `@types/three` | `^0.185.4` | Type definitions |

Added per project (ADR-0020 pattern) via GetLayers Scene Lab — see [[decisions-log]].
Scenes are self-contained modules with their own `requestAnimationFrame` loop
(mounted from a client-leaf React component), separate from the spring `ticker`,
which drives only `@react-spring/web`/`spring-text-engine` motion.

**Hero scene** (`src/components/scene/`) — the homepage's digital-twin cutaway:
a valley terrain, bridge, tunnel, geological strata, borehole/monitoring
markers, a lidar-style point cloud, a background construction rig (crane,
girders, scaffolding, all wireframe) and upward-drifting dust particles, all
built from `three` primitives (no external models). Pointer movement drives a
small camera-parallax offset (smoothed, never snapped straight to the raw
event). `build-hero-scene.ts` is the framework-free THREE setup; `HeroScene.tsx`
is the client leaf that owns the render loop, pausing off-screen
(`IntersectionObserver`), on tab-hide (`visibilitychange`), and rendering one
static frame instead of looping — and skipping the `pointermove` listener
entirely — when `prefers-reduced-motion` is set. `hero-scene-colors.ts` mirrors
the Neural Monitor Tier-1 tokens in `globals.css` — three.js materials take
numeric colours directly and can't consume CSS custom properties, so these are
kept in sync by hand. See ADR-0023 in [[decisions-log]].

**Shared viewport renderer** (`src/lib/scene/shared-viewport-renderer.ts` +
`src/components/scene/SceneViewport.tsx`) — every *other* 3D moment on the
homepage (the 8 service-card icons, the About geological cross-section, the
Stats globe, the Contact terrain) shares **one** `WebGLRenderer`/`<canvas>`
rather than one context each. The canvas is `position: fixed`, covers the
viewport, and sits behind page content (`z-index: 1`; callers give their own
foreground text `relative z-10`, the same convention the hero already uses for
its own overlay). Each caller registers a DOM element; every frame, that
element's `getBoundingClientRect()` becomes a scissored viewport rect on the
shared canvas — the technique the three.js manual documents for "multiple
canvases, one WebGL context". `SceneViewport` is the React wrapper: it
registers on mount, pauses via `IntersectionObserver`, exposes a
`setControl(value)` imperative handle (hover intensity for the service icons,
scroll progress for the geological cross-section), and — below 768px or under
`prefers-reduced-motion` — never mounts WebGL at all, rendering a plain CSS
`fallback` instead. Scene builder modules: `mini-scenes.ts` (the 8 service
icons, keyed by `service.slug`), `geological-cross-section.ts`,
`world-globe.ts`, `office-terrain.ts`. See ADR-0025 in [[decisions-log]].

**Guardrail:** the render loop skips (and warns once, rather than spamming
`console.error` every frame) any registered scene whose geometry has a non-finite
position value — the condition that makes `computeBoundingSphere()` produce a NaN
radius. When building a scene builder that mutates a `BufferGeometry`'s position
attribute per frame (as `buildStormwaterFlow` in `mini-scenes.ts` does), animate
the *same* attribute object that's actually being rendered — don't derive a
display geometry (e.g. `THREE.WireframeGeometry`) from a source geometry and then
index into it using indices/clones taken from the source; the derived geometry's
vertex layout doesn't line up with the source's, so per-vertex updates read/write
out of bounds and produce NaNs. See ADR-0026 in [[decisions-log]].

**Device tiering** (`src/lib/scene/device-tier.ts`) — one module owning what
"mobile"/"tablet"/"desktop" means for every 3D scene in this project: `getDeviceTier()`
by viewport width (same 768px/1024px breakpoints already used elsewhere), and named
per-tier budgets (DPR clamp, ambient-shape count, whether the ambient background runs
at all). Added as the homepage's motion/3D overhaul started adding enough concurrent
WebGL work (a persistent background + elevated per-service scenes + a bigger globe +
a denser terrain) that per-module hardcoded numbers stopped being tenable — see
`obsidian/workflows/optimize-3d-scene.md`'s device-tiering guidance and ADR-0027.

**Ambient background** (`src/lib/scene/ambient-background-renderer.ts` +
`src/components/scene/AmbientBackground.tsx`) — a *third* standalone WebGL-context
pattern, alongside the hero and the shared viewport renderer above: one singleton,
always-full-canvas scene (no scissoring — there's only ever one occupant) of slowly
drifting wireframe shapes (geodesic spheres, octahedrons, toruses, I-beam/hex-bolt
silhouettes), mounted once from the root layout so it persists across route changes
(unlike the per-route `HeroScene`). Reads the shared `usePointer`/`useScrollSignal`
stores (see [[hooks]]) non-reactively each frame — nearby shapes tilt toward the
cursor, fast scrolling stretches and dims the field — and runs a periodic diagonal
"lidar pulse" line on its own timer. Device-tier gated; skipped below 768px and under
`prefers-reduced-motion`, same convention as every other scene here. See ADR-0027.

## Internationalization

Homepage UI strings (nav links, section headings, button labels) translate at
runtime for the nav language switcher — English, Arabic, Urdu, French, Chinese,
with `ar`/`ur` flipping the document to RTL. No i18n framework/package added;
built from what's already in the stack:

| Piece | Uses | Role |
|-------|------|------|
| `app/api/translate/route.ts` | `zod`, `fetch` | Server-side proxy to a LibreTranslate instance (public `translate.disroot.org` by default, `LIBRETRANSLATE_ENDPOINT` overrides) — the browser never calls it directly, per [[api-architecture]]. |
| `hooks/i18n/use-language-store.ts` | `zustand` + `persist` | Chosen language + translation cache, persisted to `localStorage` (`geoporte-language`). |
| `lib/i18n/translation-queue.ts` | `lib/api-client.ts` | Batches every string requested in one tick into a single `/api/translate` call per language. |

See [[i18n]] for the full design (batching, caching, RTL, fallback behaviour) and
ADR-0024 in [[decisions-log]].

## Scroll & state

| Package | Version | Role |
|---------|---------|------|
| `lenis` | `^1.3.26` | Smooth scrolling |
| `zustand` | `^5.0.15` | Lightweight global state (scroll store) |
| `resize-observer-polyfill` | `^1.5.1` | ResizeObserver fallback for animation hooks |
| `zod` | `^4.4.3` | Schema validation — env (`src/env.ts`) + API payloads. See [[api-architecture]] |

See [[smooth-scroll]] and [[data-flow]].

## Misc

No miscellaneous runtime dependencies. Cookie consent is an in-house component
(`src/components/common/Cookie/`) built on Zustand + `@react-spring/web` — the
former `react-cookie-consent` package was removed. See [[components/common]].

## Tooling

| Package | Role |
|---------|------|
| `eslint` `^9` + `eslint-config-next` | Linting — run `yarn lint` before commits |
| `@types/*` | Type definitions for node/react |

## Scripts

```bash
yarn dev      # next dev — local development
yarn build    # next build — production build
yarn start    # next start — serve production build
yarn lint     # eslint
```

Package manager: **Yarn** (`yarn.lock` is committed). This project's local dev
machine has no admin rights to enable Corepack, so installs here were run with
`npm` (`package-lock.json` alongside `yarn.lock`) — prefer `yarn` if available in
your environment; `npm install` / `npm run <script>` work identically otherwise.

## Runtime

**Node ≥ 20.19.0**, declared in `package.json` `engines` and pinned for local dev
by `.nvmrc` (24.16.0). Next 16 itself only needs ≥ 20.9, but the ESLint 9
toolchain pulls `eslint-visitor-keys@5`, which requires
`^20.19.0 || ^22.13.0 || >=24` — on Node 20.17 `yarn install` **fails outright**,
which is why the floor is declared rather than left implicit.

## Deliberately held back

Three dependencies are **not** on latest, each for a verified reason (ADR-0022).
Re-test these periodically rather than assuming they are still blocked:

| Package | Held at | Latest | Why |
|---------|---------|--------|-----|
| `typescript` | `^5.9.3` | `7.0.2` | `eslint-config-next` depends on `typescript-eslint@8`, whose peer range is `typescript >=4.8.4 <6.1.0`. TS 7 (the native Go compiler, GA July 2026) would break linting. Revisit when typescript-eslint supports it. |
| `eslint` | `^9.39.4` | `10.8.1` | **Tested and reverted.** ESLint 10 crashes `eslint-plugin-react` (`context.getFilename()` was removed): `TypeError: contextOrFilename.getFilename is not a function`. Three of Next's bundled plugins still declare `eslint ^9` peers. |
| `@types/node` | `^24` | `26.2.0` | Tracks the Node major actually in use (24), not the newest published. |

## Not in the starter — chosen, but added per project

The starter stays dependency-light; these are the **decided** defaults, installed
only when a project needs them (ADR-0020):

| Need | Choice | Playbook |
|------|--------|----------|
| CMS | Payload (in-app, Next-native) | [[cms-payload]] · `/cms` |
| Database | Supabase Postgres | [[database-supabase]] · `/db` |
| File storage | Supabase Storage (S3-compatible) | [[cms-payload]] |
| Auth | Supabase Auth (`@supabase/ssr`) — only with real user accounts | [[database-supabase]] |

> [!note] Payload compatibility — satisfied as of 2026-08-18
> `@payloadcms/next` 3.88 peer-requires `next >=16.2.6 <17`. The starter is on
> `16.3.1`, so it now satisfies that range. Re-check when either side moves.

i18n adopted 2026-08-23 — see the "Internationalization" section above. Still
undecided: payments, data-fetching libraries, testing. Document here when
adopted and add an ADR to [[decisions-log]].

## Related

[[system-overview]] · [[folder-structure]]
