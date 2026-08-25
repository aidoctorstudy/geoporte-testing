---
tags: [meta, changelog]
updated: 2026-08-25
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

## 2026-08-25 (service detail pages — Phase 1/Civil + Design & Drafting hero scenes)

Second checkpoint of the 8 service detail pages rebuild — the first two hero
scenes elevated to their "most impressive version" per the approved plan,
both rewritten in place (same exported factory names, so
`service-heroes/index.ts`'s registry needed no changes):

- **Civil Engineering** (`build-corridor-grading-scene.ts`) — replaced with a
  city-construction narrative: 6 roads grow outward from a centre point (each
  a box geometry translated so its near edge sits at the pivot, then
  `scale.x` eased 0→1 — grows from the centre rather than its own midpoint),
  a cable-stay bridge whose 8 cables fade in one at a time, two tower cranes
  (independent pivoting jib, a hook that bobs a beam up and down), and two
  low-poly cars running back and forth along their finished road segments
  (only once that road's reveal has grown past a length threshold). A
  load-in "camera pull-back" is faked by easing the whole scene's `scale`
  down from 1.22× to 1× — the shared `hero-scene-runtime.ts` owns the camera
  directly, so a builder has no camera reference to animate a real dolly with.
  A ±20° cursor-driven tilt is layered on top of the runtime's own subtle
  parallax, and scroll boosts every element's reveal progress on top of
  its own timer.
- **Design & Drafting** (`build-bim-clash-detection-scene.ts`) — replaced
  with a blueprint sheet that unrolls into view (`rotation.x`/`scale.y` eased
  from near-edge-on/flat to facing the camera), its drafting-line network
  drawing itself on via a growing `BufferGeometry` draw range on the *same*
  geometry that's rendered (never a derived one — ADR-0026), dimension
  arrows and two scalloped "revision cloud" annotations fading in after, and
  per-vertex cursor-proximity brightening via a live vertex-colour attribute
  (the pointer, already normalized to the hero's own container rect, is
  projected onto the blueprint's local plane space each frame).

**One environment-only false alarm during this phase's browser QA, not a code
bug:** the running dev server was serving a stale Turbopack-cached bundle of
the *old* scene code after the file rewrite — confirmed by fetching the
loaded JS chunks and finding old comment text (`"graded corridor"`) still
present, with none of the new scene's text anywhere in any loaded chunk.
Restarting the dev server picked up the change immediately (confirmed the
same way, this time finding the new text and none of the old). Separately,
the automation browser tab used for this QA reports `document.hidden` as
permanently `true` (not actually composited/foregrounded) — `HeroScene.tsx`'s
own visibility-pause logic (by design, to save battery when a tab is
backgrounded) correctly never starts the render loop in that state, which
briefly looked like a rendering bug before being traced to the tab's
visibility state rather than the scene code. Worked around for this session
by overriding `document.hidden`/`visibilityState` and dispatching a
`visibilitychange` event from the page console to force a real frame — both
scenes render correctly once that's done, confirmed via screenshots.

## 2026-08-25 (service detail pages — Phase 0/Foundation)

First checkpoint of the 8 service detail pages (`/services/<slug>`) rebuild —
every page now renders the full 6-section structure (hero → overview+stats →
sub-services grid → process timeline → related projects → CTA) with real
data and real photography. Hero scenes themselves keep their existing (modest)
visuals in this phase, now scroll-reactive and mobile-safe — elevating each
scene to its "most impressive" bespoke version is later phases' work.

- **`services.ts` data** extended (not replaced) with `stats: ServiceStat[]`
  (3 per service), `processSteps: string[]` (5–6 per service), and
  `subServiceGrid: ServiceSubService[]` (6 per service) for all 8 services —
  the existing `capabilityGroups`/`subServices` fields (geotechnical's 16-entry
  breakdown included) are untouched and now render folded into the new
  Overview section rather than dropped.
- **5 new section components** in `src/views/services/`: `ServiceStats.tsx`
  (wraps the existing `StatCounter`, now with an optional `prefix` prop for
  "$2B+"), `ServiceSubServiceGrid.tsx` (6-card grid, spring hover-tilt),
  `ServiceProcess.tsx` (numbered timeline), `ServiceRelatedProjects.tsx`
  (filters real `projects.ts` data via the new `SERVICE_PROJECT_CATEGORIES`
  map, see ADR-0032, reuses the existing `ProjectCard`/`ProjectModal`
  unchanged), `ServiceCta.tsx` (magnetic CTA linking to `/contact`).
  `service-detail.tsx` reordered to this 6-section structure.
- **Per-service accent tint** — 8 new Tier-1 colour primitives
  (`--raw-color-service-<slug>-accent`/`-glow`) plus
  `getServiceAccentStyle()`, scoping the existing `--accent`/`--glow` Tier-2
  roles per page. See ADR-0030.
- **Real photography** — one photo per service downloaded from the live
  geoporte.com.au into `public/assets/services/`, composited into the
  Overview section as a duotone-treated top band (grayscale + accent
  multiply-blend + top/bottom fade), not used as a literal hero image.
- **Mobile hero fallback** — `HeroScene.tsx` now skips WebGL entirely below
  the mobile device tier and renders a new spring-driven `HeroFallback.tsx`
  gradient instead, closing a gap that also existed (unnoticed) on the
  homepage hero. See ADR-0031.
- **`hero-scene-runtime.ts`** gained `setScrollProgress`, mirroring the
  homepage hero's own scroll-reactivity addition — every service hero scene
  can now read scroll progress once its builder chooses to use it (not yet
  exercised by any of the 8 current builders; that's later phases' work).

**One real bug found and fixed during this phase's browser QA:** the initial
`ServiceOverview` background treatment used one gradient overlay spanning the
entire (tall) section, which — because even its `via` stop was 85%-opaque —
made the photo nearly invisible everywhere except a thin midpoint band.
Confirmed via `javascript_tool` that the image itself had loaded correctly
(`naturalWidth`/`complete` both fine), ruling out a broken asset before
concluding it was a pure CSS visibility bug. Fixed by confining the photo to
a fixed-height top band with its own top/bottom fade gradients instead of one
overlay across the whole section — verified via browser screenshot afterward.

## 2026-08-24 (homepage motion/3D overhaul — Phase 2/About)

Third checkpoint of the phased homepage motion/3D overhaul (see Phase 1/Phase 0
below). Elevated the About section:

- **Geological cross-section** (`geological-cross-section.ts`) — the camera now
  pushes down/in toward the strata as scroll progress rises (deepening into the
  ground rather than sitting static), each layer briefly brightens as the
  camera's implied depth passes it, a thin borehole drill continuously
  descends through all four layers on its own timer, and the whole group tilts
  toward the cursor — reading `rect` (this registration's live scissor rect,
  now passed as a third `update()` argument, see ADR below) against the shared
  pointer store rather than the page-global pointer position, so the tilt is
  relative to the panel itself. `GeologicalCrossSection.tsx`'s layer labels now
  fly in from the right as the camera reaches each layer during scroll
  (quantised to "how many layers reached" so it only re-renders on a real
  threshold crossing).
- **About heading** (`AboutHeading.tsx`, new) — "Complex ground." slides in
  from the left, "Complex engineering." from the right, "Clear decisions."
  fades up, each 200ms after the previous — split out of the shared
  `SectionHeading` (used by every other section) rather than changing its
  line-by-line reveal behaviour project-wide.
- **Team panel** (`TeamPanel.tsx`, new, replacing the inline `<aside>` block
  in `AboutSection.tsx`) — a real 3D `rotateY` flip on scroll entry
  (`@react-spring/web` directly, same idiom `TiltCard`'s tilt uses); team
  roles type themselves in via `spring-text-engine`'s letter stagger with a
  blinking cursor (ticker-throttled to ~10fps — a blink only needs to *look*
  like a blink, not track every frame); value tags pop in with a bouncy
  spring stagger.

**Two real bugs found and fixed during this phase's browser QA** — both
significant enough to get their own ADRs:

- The shared viewport renderer (`shared-viewport-renderer.ts`) never cleared a
  registration's last-rendered pixels when it went inactive (only when
  unregistered) — on a fast scroll, `IntersectionObserver` can lag behind
  enough that a "ghost" frame of a scene stays frozen on-screen at a stale
  position. Looked, at first glance, exactly like a WebGL scissor bug (a
  scene rendering outside its own card); a debug-overlay comparison against
  scroll proved the rendered fragment wasn't tracking the card's actual live
  position at all. Fixed with a clear-on-deactivate path. See ADR-0028.
- An in-progress `RouteTransition.tsx` (Phase 0's item 15, route transitions)
  wrapped the App Router's live `children` prop with more than one
  independent `@react-spring/web` hook, which — confirmed via a careful,
  clean-server bisection — causes Next.js 16/Turbopack to silently orphan
  that subtree into a hidden `<template>`, collapsing `<main>` to zero
  height. Replaced with `RouteTransitionSweep.tsx`, a decorative overlay that
  never touches `children` at all. See ADR-0029.

`verify.sh` (0 FAIL), `yarn lint`, `yarn build`, and a `next build && next
start` production browser pass (used specifically to rule out dev-server
streaming noise while chasing the bugs above) all came back clean — repeated
fast-scroll stress tests (the exact sequence that originally reproduced the
ghost) show no artifacts, no console errors.

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
