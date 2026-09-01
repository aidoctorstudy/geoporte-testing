---
tags: [frontend, stable]
updated: 2026-08-30
---

# Catalog — `/projects`

Files in `src/views/projects.tsx` + `src/views/projects/`. See
[[decisions-log]] ADR-0071 (showreel mechanic), ADR-0073 (real photos,
superseding the "no photography exists" premise below), and ADR-0075
(Cards Cascade, superseding this page's use of `ProjectsSection`) for the
full rationale.

## `projects.tsx` — `ProjectsView`

The route's Server Component (`src/app/projects/page.tsx` → this). Renders
`ProjectsShowreel` (below) followed by `ProjectsCascade` (below) — the
showreel is a cinematic lead-in with no heading of its own, and
`ProjectsCascade` owns the page's one `<h1>` ("Our Projects") in its own
in-deck hero. As of ADR-0075 this page no longer renders `ProjectsSection`
(`src/views/home/ProjectsSection.tsx`) — that component is shared with the
homepage and was left completely unmodified; this page just stopped using
it rather than reshaping shared code for one page's needs.

## `projects-showreel-config.ts`

Pure, framework-agnostic module — no React. Geometry + scroll-timeline math
for the showreel, adapted (not copied) from the user-supplied "AI Studio"
reference template's Projects/Showreel section
(`ai-studio/src/utils/showreel/{geometry,timeline}.ts`,
`ai-studio/src/views/home/showreel-stage.tsx`) — that reference drives a
much larger multi-scene hero→carousel→sphere→portfolio journey with a
per-tile progress-driven timeline; this is a single, smaller flight-
through-a-grid moment, written fresh with this project's own numbers.

- `buildShowreelTiles(projects)` — scatters every real project (title,
  location, sector, category, and now a real photo — see below) into a
  wide, depth-varied 3D field using a seeded PRNG (`mulberry32`), so
  layout is stable across renders/SSR rather than reseeded on every call
  like `Math.random()` would be.
- `tileTransform(tile)` — each tile's **static** 3D transform
  (`translate3d` + `rotateY`), computed once from its seeded layout data.
- `cameraRigTransform(p)` — the **one** animated transform: scaling the
  whole tile field up and pushing it toward the viewer as scroll progress
  `p` (0→1) advances. The "flying through a collage" read comes from CSS
  perspective acting on this single group transform, not from per-tile
  math — deliberately simpler than the AI Studio reference's per-item
  timeline functions.
- `gridOpacity` / `introOpacity` / `ctaOpacity` — fade the tile field in/
  out and cross-fade the intro heading and the "Explore All Projects" CTA.

**Real photography.** No per-project photography could be scraped from the
live site (confirmed by inspecting the live geoporte.com.au DOM: its own
Projects page renders only Elementor's stock `placeholder.png`, `/gallery`
404s, no per-project sub-pages — ADR-0065/ADR-0071's finding). That premise
changed in ADR-0073: a local `images/` folder (27 real photos, generic
filenames with no project-to-photo correspondence of their own) was
supplied directly, copied unchanged into `public/assets/projects/`, and
mapped onto `projects.ts`'s 27 entries **by position** — the 27 filenames
sorted alphabetically, zipped 1:1 against the array in its existing order.
Tiles render `project.image` directly (`next/image`, `fill`); the old
category-tinted gradient map and its `gradientAngle` PRNG field were
deleted, not left dead.

## `ProjectsShowreel.tsx` — `"use client"`

The scroll-driven stage. Tall track (`TRACK_VH` = 260vh) → progress from
`useProgressTrigger` (`start: "top top"`, `end: "bottom bottom"`, the same
vendored scroll-trigger hook `about-team/TeamCascadeDeck.tsx` uses) drives
`s.camera`/`s.grid`/`s.intro`/`s.cta`, each a react-spring `.to(...)`
interpolation off `interpolatedProgress`.

> [!warning] `position: sticky` does not work on this site — use the manual
> workaround below, not `sticky top-0`
> `<body>` carries its own `overflow: hidden auto` alongside `<html>`'s (the
> Lenis smooth-scroll setup, `html.lenis`) — and since body's own content
> never actually overflows its box (`scrollHeight === clientHeight`
> always), `position: sticky` resolves against body's permanently-zero
> `scrollTop` instead of the real scrolling element (`<html>`), so it never
> engages. Confirmed via `getBoundingClientRect()` against
> `TeamCascadeDeck.tsx`'s own identical `sticky top-0` stage — same
> failure there too. This is a **pre-existing, sitewide** bug, not
> something either component introduced, and fixing it globally (touching
> `<body>`'s CSS) was out of scope for the turn that found it — see
> ADR-0071. `ProjectsShowreel.tsx` works around it locally: a
> `subscribeToTicker` callback reads the track's `getBoundingClientRect()`
> every frame and hand-writes the stage's `position`
> (`absolute`/top-of-track → `fixed` → `absolute`/bottom-of-track),
> reproducing sticky's three states manually — the same imperative-style-
> write idiom `TeamCascadeDeck.tsx`'s own per-frame fold already uses.
> **If `TeamCascadeDeck.tsx` or any future component reads as not-quite-
> pinned, this is why — check this first before assuming a logic bug.**

`prefers-reduced-motion` renders a plain static grid instead (no tall
track, no camera flight, no manual-sticky ticker) — the scroll-jacked
flight has no natural "slower" version, so the honest fallback is the
collage without motion, not a throttled copy of the same animation.

Clicking a tile calls the same `useProjectModalStore` (`@/views/home/
project-modal-store`) `ProjectCard.tsx` uses — the store itself is a
shared Zustand singleton, but the `<ProjectModal />` component that
actually renders it still has to be mounted somewhere on the page. As of
ADR-0075 that's `projects.tsx` directly (previously `ProjectsSection`,
rendered further down the page, mounted it — removing that component from
this page silently broke the showreel's click-to-open behaviour until
caught and fixed in the same turn).

## `projects-cascade-config.ts` / `ProjectsCascade.tsx`

`/projects`' own "Cards Cascade" (ADR-0075) — replaces
`ProjectsSection` on this page only; `ProjectsSection.tsx` is untouched
and still renders on the homepage. Same category of file split as the
showreel: `projects-cascade-config.ts` is pure geometry/timeline math (no
React), `ProjectsCascade.tsx` is the `"use client"` scroll-driven stage.

- `trackVh(total)` / `cascadeActiveIndex(p, total)` / `placeCascadeCard(d)`
  — a tall track sized to the real project count, a continuous "which
  card is active" position derived from overall scroll progress, and a
  symmetric fold placement (`d` = a card's index minus that continuous
  active position) applied as `translate3d` + `rotateX` + `scale` +
  opacity, all spring-interpolated off one `interpolatedProgress` value
  (hard rule #1 — no `@keyframes`).
- Same manual sticky-emulation ticker technique as `ProjectsShowreel.tsx`
  (see the warning above) — this page now has **two** independent copies
  of that workaround, not a shared hook. Left duplicated rather than
  extracted, matching how this codebase already had it duplicated once
  before (`ProjectsShowreel.tsx` / the deleted `TeamCascadeDeck.tsx`);
  extracting it would touch both existing files for a feature that wasn't
  asked for.
- **The `cascadeActiveIndex` clamp bug (ADR-0075):** clamping the
  continuous active-index at both ends made the first card sit fully at
  rest, fully opaque, for the entire intro phase — directly behind the
  eyebrow/title/CTA. Only clamp the upper end (past the last card); leave
  the lower end free to run negative, so the first card stays off-stage
  until the intro is actually ending. If a future card animation "pops"
  in fully visible from the very start of its own track, check this
  clamp shape first.
- **CTA is a real `<button>`, not `href="#id"`.** The deck's content sits
  inside the pseudo-sticky stage, which is `position: fixed` for most of
  its lifetime — an anchor jump into a fixed target computes a ~0 scroll
  delta and goes nowhere. `handleExploreClick` computes a real
  document-relative offset instead.
  > [!warning] Neither `scrollTo()` nor `lenis.scrollTo()` actually scroll here (ADR-0076)
  > Found while building `/about/team`'s identical CTA: this codebase's
  > shared `scrollTo()` helper (`@/utils/scroll-to`) and Lenis's own
  > `lenis.scrollTo()` are both no-ops in this project's Lenis setup —
  > confirmed live, clicking the button did nothing either way. What
  > works, confirmed repeatedly: get the instance via
  > `useScroll((s) => s.lenis)`, then `lenis.stop()` → a plain
  > `window.scrollTo({ top, behavior: "instant" })` → `lenis.start()`.
  > `behavior: "smooth"` was reliably cancelled by Lenis in this exact
  > sequence every time, even tested outside React — only `"instant"`
  > works, so this button jumps rather than animates. Not fixed in the
  > shared helper itself; other call sites depend on its current
  > behaviour.
- `prefers-reduced-motion` gets a plain static grid of every project (own
  copy, not reusing `ProjectsSection`'s grid or `ProjectsShowreel`'s
  reduced-motion grid) — same rationale both of those already use: the
  scroll-jacked fold has no natural slower version.

## Related

[[components/common]] · [[decisions-log]] ADR-0065, ADR-0071, ADR-0073,
ADR-0075, ADR-0076 · [[animation-system]] · [[smooth-scroll]]
