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

## 2026-08-24 (homepage motion/3D overhaul — Phase 1/Hero)

Second checkpoint of the phased homepage motion/3D overhaul (see Phase 0 below).
Elevated the existing hero digital-twin scene rather than replacing it:

- **Camera orbit** — `build-hero-scene.ts`'s pointer parallax now drives a true
  ±15° orbit around the look-at point (spherical coordinates, not just a position
  offset), and `HeroScene.tsx` reads pointer position from the shared `usePointer`
  store (Phase 0) via the shared ticker instead of wiring its own `window.pointermove`
  listener — one fewer app-wide listener, same behaviour.
- **Scroll parallax** — a new `setScrollProgress` on `HeroSceneHandle`, fed by
  `useProgressTrigger` (the engine hook, called directly — no extra wrapper element)
  against the hero's own container rect. As the user scrolls through the hero the
  camera zooms in and descends toward the geological strata layers already in the
  scene, while the construction rig and point cloud fade — a "descend into the
  ground" gesture rather than a literal cross-canvas morph into the separate About
  section scene (a much bigger feature, out of scope here).
- **Construction animation** — the crane's jib now swings independently (refactored
  into its own pivot sub-group); girders "fly in" and scaffolding scales up from
  nothing over the first ~2.5s.
- **Lidar pulse** — a ring expands from the scene centre every 3s, matching the
  existing hero fog (`THREE.FogExp2`, already present — item 16's "atmospheric haze"
  needed no new code).
- **Hero heading** (`HeroHeading.tsx`, new) — word-by-word spring entrance via
  `TextEngine`, split out of the shared `SectionHeading` (which reveals line-by-line
  and is used by every other section) rather than changing that component's
  behaviour project-wide. Also a looping shimmer sweep — a separate gradient bar
  swept via ticker-driven `translateX`, `mix-blend-screen` (not `overlay`, which was
  tried first and *darkened* the light heading text against the dark background —
  `screen` only ever brightens, the safe choice for light-on-dark).
- **Hero subtext** (`HeroSubtext`, same file) — types in letter-by-letter via
  `TextEngine`'s letter stagger after the heading settles, instead of a hand-rolled
  `setInterval` typewriter (a custom text-animation component — banned).
- **Project ticker** (`ProjectTicker.tsx`, new) — continuous marquee of real project
  names along the hero's bottom edge, doubled-list technique, ticker-driven
  `translateX` (continuous motion, not a CSS `animation`), pauses on hover, static
  single list under reduced motion.
- **Scroll cue** (`ScrollCue.tsx`, new) — bouncing-dot mouse icon, ticker-driven (SVG
  attribute set via ref, not React state, so it doesn't re-render every frame),
  fades out via a real spring once the shared scroll signal reports the page has
  actually scrolled.

`verify.sh` (0 FAIL), `yarn lint`, `yarn build`, and a browser QA pass all came back
clean — no console errors, ticker loops seamlessly, heading/subtext/shimmer read
correctly, scroll-through-hero flows into the About section. Not independently
verified this pass: the exact camera-orbit/zoom trajectory (subtle background
motion, hard to confirm from screenshots) and true narrow-viewport/touch behaviour
(the browser automation's `resize_window` didn't produce a real mobile viewport to
test against) — both ride code paths already proven elsewhere (the pointer-parallax
lerp pattern, the `SceneViewport` mobile/reduced-motion gate), so risk is low, but
flagging rather than claiming a check that didn't happen.

## 2026-08-24 (homepage motion/3D overhaul — Phase 0/Foundation)

Kicked off a large, phased homepage motion/3D overhaul (35-item spec — global cursor
effects, global scroll effects, a persistent 3D background, a page-load intro, route
transitions, plus deep per-section upgrades to come in later phases). This entry is
Phase 0 — the global systems every later phase builds on:

- **Custom cursor** (`components/common/Cursor/CustomCursor.tsx`) — a glowing dot,
  a lagging ring, an ambient glow, and a short-lived particle trail while moving
  fast, all spring/ticker-driven. Fills accent on interactive-element hover, swaps to
  a crosshair over `data-cursor="canvas"` (the hero scene so far). Hides the native
  cursor via a new `.cursor-hidden` rule in `globals.css`. Gated off on touch and
  `prefers-reduced-motion`, and stays hidden until the pointer's first real move (a
  real bug — the ring/dot briefly rendered at a stale `0,0` before movement — found
  during browser QA and fixed via a new `hasMoved` flag on the pointer store).
- **Magnetic buttons** (`components/common/Magnetic.tsx`) — 80px-radius cursor
  attraction on the Nav and Hero CTAs so far.
- **Scroll progress bar** (`components/common/ScrollProgressBar.tsx`) + a new
  **scroll signal** (`hooks/scroll/use-scroll-signal.ts` + `ScrollSignal.tsx`) — the
  first place in this codebase reading Lenis's own `scroll` event directly (every
  existing scroll-driven component re-derives progress from `getBoundingClientRect()`
  per element instead).
- **Persistent ambient background** (`lib/scene/ambient-background-renderer.ts` +
  `scene/AmbientBackground.tsx`) — drifting wireframe shapes behind every page,
  reacting to cursor position and scroll velocity, with a periodic diagonal "lidar
  pulse." A third standalone WebGL-context pattern alongside the hero and the shared
  mini-scene renderer — see ADR-0027.
- **Device tiering** (`lib/scene/device-tier.ts`) — added as a foundation module
  now that concurrent WebGL work on the homepage is scaling up. See ADR-0027.
- **Page-load intro** (`components/common/PageLoadIntro.tsx`) — first-visit-only
  wordmark reveal (via `spring-text-engine`, not a hand-rolled SVG path-trace) that
  explodes outward into the hero; `localStorage`-gated, skipped under reduced motion.
- **Route transitions** (`components/common/RouteTransition.tsx`) — slide/fade
  handoff between pages with an accent sweep bar, as a client leaf wrapping
  `{children}` so `layout.tsx` itself stays a Server Component.

All new work rides existing primitives rather than adding parallel ones: the shared
animation ticker (not a new `requestAnimationFrame` loop) for cursor/magnetic
position updates, `@react-spring/web` directly (the same pattern `ProjectModal.tsx`
already uses) for anything needing imperative sequencing, and the existing
mobile/`prefers-reduced-motion` WebGL-skip convention for every new 3D piece.

`verify.sh` (0 FAIL), `yarn lint`, `yarn build`, and a live browser QA pass (Chrome
extension) all came back clean. Remaining phases (hero, about, services, stats,
projects, contact, footer) are tracked in the session's implementation plan and land
as separate checkpointed turns.

## 2026-08-24 (QA pass)

- Ran the full verify/lint/build/qa-verify loop before committing the homepage
  build (see below) and fixed what it found: arbitrary rem values converted to
  the standard Tailwind spacing scale in `Nav.tsx`, `MobileMenu.tsx`,
  `LanguageSwitcher.tsx`, and `ServicesDropdown.tsx` (`px-[1.25rem]` → `px-5`
  and equivalents — same computed value, no longer a token-rule WARN); the
  per-category project blocks in `ProjectsSection.tsx` changed from
  `tag="div"` to `tag="section"` (each has its own `<h3>`, a genuine
  sectioning match). Deleted `Nav/ServicesMenu.tsx` — an unused duplicate of
  `ServicesDropdown.tsx` that nothing imported. `yarn lint` and `yarn build`
  both pass clean; remaining `verify.sh` WARNs are either pre-existing starter
  baseline files (`Cookie/*`, the contact route's fallback `console.log`) or
  genuine one-off values the script's own guidance calls out as acceptable
  (a `max-w-[75rem]` header width, the hamburger icon's sub-pixel translate
  offsets).

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
