---
tags: [meta, changelog]
updated: 2026-08-24
---

# Changelog

Chronological log of notable changes to **this project**. Newest first.
Human-curated — not a mirror of `git log`.

Log a change here when it would surprise someone returning in six months: a new
dependency, a new route or section, a convention bent, a bug whose cause is worth
remembering. Routine commits do not need an entry.

For *why* the conventions are what they are, see [[decisions-log]].

---

## Baseline — built from `next16-claude-starter` v0.1.0

What the starter ships, so the first project entry has something to diff against:

| Area | What is there |
|------|---------------|
| Framework | Next.js 16 App Router · React 19 · TypeScript · Yarn · Node ≥ 20.19 |
| Styling | Tailwind v4, CSS-only config, three-tier design tokens ([[design-system]]) |
| Motion | Vendored spring engine + `spring-text-engine`, shared rAF ticker, reduced-motion ([[animation-system]]) |
| Layout | Adaptive scaling grid — root font-size tracks the viewport ([[design-system]]) |
| Scroll | Lenis smooth scroll + Zustand scroll store ([[smooth-scroll]]) |
| Server | `app/api` route handlers, zod-validated env, `{ data }`/`{ error }` envelope ([[api-architecture]]) |
| SEO | Metadata generator, `robots.ts`, `sitemap.ts`, JSON-LD ([[seo-metadata]]) |
| Agent harness | 8 commands, 7 path-scoped rules, 11 skills, 4 subagents, `verify.sh` ([[agent-harness]]) |
| Not included | CMS, database, auth, payments, i18n, tests — added per project ([[backend/README]]) |

The home view (`src/views/home.tsx`, route `/`) ships empty on purpose — start
there ([[new-page]]).

<!-- Log this project's changes below, newest first, under a `## YYYY-MM-DD` heading. -->

## 2026-08-24

- Full-page 3D pass across every homepage section — see ADR-0025 in
  [[decisions-log]] for the architecture.
  - **Hero** — pointer-driven camera parallax, a background wireframe
    construction rig (crane, girders, scaffolding), and upward-drifting dust
    particles, all added to the existing `build-hero-scene.ts`/`HeroScene.tsx`.
  - **New shared viewport renderer** (`src/lib/scene/shared-viewport-renderer.ts`,
    `src/components/scene/SceneViewport.tsx`) — one `WebGLRenderer` for every
    other mini scene on the page, scissored per registered DOM element.
  - **About** — `GeologicalCrossSection.tsx`: a stacked clay/rock/soil/bedrock
    cutaway that reveals layer-by-layer on scroll (`SpringTrigger` scrub feeds
    the scene's `control`), with fading DOM labels. New strata design tokens
    in `globals.css` (Tier 1 `--raw-color-strata-*` → Tier 2 `--strata-*` →
    `@theme` bindings) and `strata-scene-colors.ts`.
  - **Services** — each of the 8 `ServiceCard`s now carries a small live mini
    scene (`mini-scenes.ts`, keyed by `service.slug`): wireframe bridge,
    borehole drill, rotating steel frame, water-flow mesh, blueprint plane,
    Gantt bars, compass/globe, telecom signal rings — idle-animating, sped up
    on hover via the shared renderer's `control` channel.
  - **Stats** — `StatsGlobe.tsx`: a rotating wireframe globe with a glowing
    pin at each of the 7 countries in `data/mocks/projects.ts`, behind the
    existing counters.
  - **Projects** — `ProjectCard` now uses the new `<TiltCard>` (cursor-tracked
    3D tilt, `@react-spring/web` directly) and opens a `ProjectModal` (detail
    dialog: category, location, discipline, description) instead of linking
    anywhere — there was no project-detail route to link to. Added
    `description` copy (placeholder, swap for real write-ups) to every entry
    in `data/mocks/projects.ts`.
  - **Contact** — `ContactTerrain.tsx`: a stylised terrain with a glowing
    marker per office (Melbourne, Sydney, Perth, Auckland), spread
    west-to-east behind the existing office list.
  - All new mini scenes pause off-screen (`IntersectionObserver`, via
    `SceneViewport`), skip WebGL entirely below 768px and under
    `prefers-reduced-motion` (CSS `fallback` instead), and share the hero's
    existing off-screen/tab-hidden pause conventions.

- Fixed the Stormwater service mini-scene (`mini-scenes.ts` →
  `buildStormwaterFlow`) producing `THREE.BufferGeometry.computeBoundingSphere():
  Computed radius is NaN` every frame — it was animating a `WireframeGeometry`
  derived from a `PlaneGeometry` using vertex indices from the source plane,
  and the two geometries' vertex layouts don't match. Rebuilt it on a
  `BufferGeometry` that shares the plane's actual position attribute plus a
  hand-built grid line index, so the animated buffer is the buffer being
  rendered. Also hardened `shared-viewport-renderer.ts`'s render loop to skip
  (and warn once for) any registered scene whose geometry has non-finite
  position values, as a guard against future scene builders hitting the same
  class of bug. See ADR-0026 in [[decisions-log]].

## 2026-08-23

- Built out the homepage (`src/views/home.tsx`, previously empty): Hero, About,
  Services grid, Stats, Projects, Contact — see `src/views/home/*.tsx`.
- Hero digital-twin 3D scene built by hand from `three` primitives (bridge,
  tunnel, geological cutaway, boreholes, point cloud) — `src/components/scene/`,
  own render loop, reduced-motion + off-screen pause. ADR-0023.
- Added `src/data/mocks/projects.ts` — 27 real Geoporte projects sourced from
  geoporte.com.au/projects, across 7 countries. The live site's own stat
  counters render unpopulated "0+" placeholders, so the homepage's "landmark
  projects" / "countries of experience" counters are derived from this real
  project list instead of invented numbers.
- Added the nav **language switcher** — English/Arabic/Urdu/French/Chinese,
  RTL for Arabic/Urdu — translating nav links, section headings, and button
  labels via a server-side LibreTranslate proxy (`app/api/translate/route.ts`),
  batched and cached client-side (`zustand` `persist`). ADR-0024, full design
  in [[i18n]]. New env var `LIBRETRANSLATE_ENDPOINT` (optional).
- Nav/Footer (built the previous session, previously undocumented) now
  documented in [[components/common]], along with the new `LanguageDirection`,
  `TranslatedText`, and `SectionHeading` common components.
- Fixed two false positives in `.claude/scripts/verify.sh`: the
  `duration-fast`/`duration-normal` FAIL regex matched its own documented-correct
  form (`var(--duration-fast)`), and the `"use client" on a … view` check
  recursed into `src/views/<page>/` feature subfolders, flagging correctly
  client-leaf components as if they were page-level views.

## 2026-08-22

- Project renamed **Geoporte** — engineering consultancy site (risk-based design,
  geotechnical/civil/structural engineering, project control, advisory, telecom).
  Built via the GetLayers MCP: Style **Neural Monitor** (`neural-monitor-style`)
  committed in `getlayers.json` — near-black ground, azure accent used as light
  not fill, General Sans throughout.
- Added `three` + `@types/three` (see [[tech-stack]]) for a bespoke hero
  digital-twin scene (authored via GetLayers Scene Lab, not a catalog scene) and
  per-service 3D scenes.
- Installs run with `npm` instead of `yarn` (no admin rights to enable Corepack
  on this machine) — see [[tech-stack]] runtime note.
