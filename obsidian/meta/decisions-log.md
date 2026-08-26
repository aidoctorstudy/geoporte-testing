---
tags: [meta, decision]
updated: 2026-08-26
---

# Decisions Log (ADRs)

Why this project's conventions are what they are. Each entry records a decision,
the reasoning behind it, and what it constrains when you build.

These are **inherited from the starter** — they explain the rules in `AGENTS.md`
and across the vault, and notes link to them by number. Add your project's own
decisions on top, continuing the numbering. Amending an inherited decision is
fine; write a new ADR that says so rather than editing the old one.

Template: [[templates/adr-note]].

---

## ADR-0034 — Cinematic Earth globe: ported to the existing `three` version, `EffectComposer`/bloom introduced for the first time, layered with (not replacing) the ambient background

**Status:** Accepted · 2026-08-26

**Decision.** `build-planet-scene.ts` ports GetLayers' "Ascend" template's
planet scene (`initPlanet`) into this project as a fourth persistent,
app-lifetime WebGL background — same ref-counted singleton category as
`ambient-background-renderer.ts`, mounted alongside it (not replacing it)
in `layout.tsx`, at `z-index: -1` (one step behind ambient background's
existing `z-index: 0`, left untouched). Three explicit, deliberate
departures from what this project has done until now:

1. **`three` itself was never touched**, even though the template pins
   `three@0.143.0`. Confirmed directly against the installed
   `three@0.185.1` (`node -e "require('three')"` plus `require.resolve`
   against every `three/examples/jsm/...` path the scene imports) that
   exactly two APIs the template uses no longer exist —
   `THREE.WebGL1Renderer` and `THREE.sRGBEncoding` — and every other API
   (`EffectComposer`, `UnrealBloomPass`, `GLTFLoader`, `DRACOLoader`,
   `OrbitControls`, etc.) resolves unchanged. Fixed those two
   (`WebGLRenderer` instead of `WebGL1Renderer`;
   `renderer.outputColorSpace = THREE.SRGBColorSpace` instead of
   `outputEncoding = sRGBEncoding`) and ported everything else verbatim,
   rather than downgrading the shared dependency — a downgrade would have
   risked breaking every one of the 8 service hero scenes, the homepage
   hero, the ambient background, and the shared viewport renderer, all
   written against the current API.
2. **`EffectComposer`/`UnrealBloomPass` enter this codebase for the first
   time.** The Phase 0 cross-cutting decision for the service-pages roadmap
   explicitly kept this project bloom-free ("No `EffectComposer`/bloom pass
   exists anywhere in this codebase... keeps bundle size, render cost, and
   risk down") — this scene is a deliberate, explicit exception to that,
   not a quiet reversal of it. The reasoning for staying bloom-free
   elsewhere stands; this one scene needed the canonical template's own
   three-composer pipeline (torus-layer / bloom-layer / final composite via
   `THREE.Layers`) to read as the template's own cinematic look, and porting
   a working pipeline is a smaller risk than re-deriving an equivalent
   glow effect from this project's existing `AdditiveBlending` technique.
3. **Layered with `AmbientBackground`, not replacing it** — the user's own
   explicit choice after being shown the trade-off (two always-on
   full-screen WebGL contexts, on top of whatever per-route hero scene a
   page also has). Tier-gated the same way every other scene in this
   project already is (mobile skip, `getTierBudget(width).dprClamp`,
   reduced star/atmo/marker counts on tablet) precisely because that cost
   is real and accepted, not because it's free.

**Why (the rest).** Pulled the actual template via the GetLayers plugin
(`getlayers_search`/`getlayers_source`) rather than improvising a "cinematic
Earth" from a written description — a real, working ~400-line scene, not a
guess at one. Scroll choreography reads from this project's own
`getScrollSignalSnapshot().progress` (Lenis-smoothed, already built for
exactly this — "WebGL loops," per its own doc comment) instead of the
template's raw `window.scrollY` read, removing a duplicate scroll-fraction
calculation rather than adding one. The Draco decoder is self-hosted in
`public/draco/` rather than the template's own `gstatic.com` CDN reference —
the user's explicit choice, matching this project's all-local-assets
convention and the `optimize-3d-scene` skill's guidance against a CDN
decoder on the critical path. A second marker layer — glowing accent-blue
pins at Geoporte's seven real project countries — reuses `PROJECT_LOCATIONS`/
`latLonToVector3`, already exported from `world-globe.ts` this session for
the Advisory Services hero scene, rather than a third copy of that data.

**When building.** If a future scene needs bloom/post-processing too, this
is now precedent that it's available in the codebase — but the Phase 0
reasoning for defaulting to `AdditiveBlending`-only glow still applies to
everything else; reach for a real composer only when a scene's own source
material (like this one) already depends on one. If `AmbientBackground` and
the planet ever prove visually or perceptibly too much running together,
that's the same trade-off flagged and accepted here — revisit by asking
whether to disable ambient background specifically on routes the planet
already dominates, not by silently dropping either.

---

## ADR-0033 — Low-performance detection: static hardware hints + measured hero-scene fps, no persistence

**Status:** Accepted · 2026-08-26

**Decision.** `PerformanceWarningToast.tsx` shows a dismissible bottom-left
notice the first time either signal fires: a static hardware check
(`navigator.hardwareConcurrency <= 4` or the non-standard, Chromium-only
`navigator.deviceMemory <= 4`, read once on mount) or a measured render-rate
check (the rolling average of actually-rendered frames from `HeroScene.tsx`'s
own loop dropping below 30fps over a 3-second window, after a 2-second warm-up
grace period so a scene's own load-in animation doesn't read as device
struggle). Both live in a new `src/lib/scene/performance-monitor.ts` module.
Once either fires, it fires once for the page's lifetime — no re-arming, no
`localStorage` persistence across page loads.

**Why.** This is new territory — `device-tier.ts`'s tiering is viewport-width
only, deliberately (ADR-0027 chose a device-tier module over per-component
`navigator` checks precisely because viewport width is what every existing
tier decision — DPR, particle counts, ambient background — actually needed).
A toast reacting to raw device capability is a genuinely different question
("is this hardware struggling *right now*") than "which tier's budget should
this component use," so it doesn't belong bolted onto `device-tier.ts`.
Real FPS measurement has to live in `HeroScene.tsx`'s own native
`requestAnimationFrame` loop (not the shared spring ticker, which already
throttles its own subscribers and would measure its own throttle, not the
GPU) — see that file's existing comments on why WebGL frame timing can't
come from the ticker. No persistence was a deliberate choice, not an
oversight: this is a one-time, session-scoped notice ("some elements were
simplified"), not a setting: a returning visitor on the same slow device
should be able to see it again and dismiss it again, not have it permanently
suppressed by a stale flag from a different browsing session.

**When building.** Any future per-instance "is this device coping" check
should read from `performance-monitor.ts`'s exports rather than re-deriving
`navigator.hardwareConcurrency`/`deviceMemory` inline — same reasoning
`device-tier.ts` itself gives for centralizing tier numbers. If a scene other
than the main hero ever needs to feed the fps signal too (a mini scene via
the shared viewport renderer, say), extend `reportHeroSceneFrame`'s call
sites rather than duplicating the rolling-window logic.

---

## ADR-0032 — Service pages: curated service→project category map instead of a per-project field

**Status:** Accepted · 2026-08-24

**Decision.** The Related Projects section on each service detail page filters
`projects` (`src/data/mocks/projects.ts`) through a small hand-curated
`SERVICE_PROJECT_CATEGORIES: Record<string, ProjectCategory[]>` map
(`src/data/mocks/service-project-map.ts`) — each service slug lists the 1–3
existing `ProjectCategory` values ("Transport", "Built Environment", "Energy,
Resources & Water") it's relevant to. No new field was added to `Project`.

**Why.** `Project` has no service linkage today, only that 3-value `category`
and a loose free-text `sector`. Adding a `relatedServiceSlugs: string[]` to
all 26 existing projects is real per-record data entry with no source
document to check it against (unlike `category`/`sector`, which trace back to
the live site) — it would be 26 judgment calls invented for this feature
alone, versus 8 (one per service). The category axis is coarse but already
real, sourced data; curating which categories map to which service is a
single small decision per service instead.

**When building.** If a project ever needs finer-grained service tagging than
category can express (e.g. a Transport project that's really civil-only, not
also structural), extend the map's value type rather than reaching for a new
`Project` field first — the map can hold richer matching logic (a slug
allowlist/denylist per category) without touching the 26 project records. Only
add a real per-project field if the category-based filter starts producing
visibly wrong matches in practice.

---

## ADR-0031 — Service hero fallback closes a pre-existing mobile-WebGL gap in the shared `HeroScene`

**Status:** Accepted · 2026-08-24

**Decision.** `HeroScene.tsx` (shared by the homepage hero and all 8 service
detail page heroes) now skips mounting WebGL entirely below the `mobile`
device tier (`getDeviceTier` < 768px, `device-tier.ts`) and renders a new
`HeroFallback.tsx` instead — a CSS-scoped radial gradient whose glow pulses
via a looping `useSpring` (real spring physics, not `@keyframes`). It reads
`--accent`/`--glow` from whatever scope it's rendered in, so it automatically
picks up a service page's per-service tint (ADR-0030) with no props.

**Why.** This was written as part of the service-pages "mobile replaces 3D
hero with a CSS version" requirement, but `HeroScene` is the *shared*
component — before this change, it had no mobile skip at all, unlike
`SceneViewport` (the mini-scene component), which already had this
convention. Every full-bleed hero, including the homepage's, was mounting a
full WebGL context on mobile with no budget guard beyond DPR clamping. Fixing
it at the shared-component level closes that gap everywhere at once rather
than duplicating a skip check in 8 separate hero builders.

**When building.** Any new full-bleed WebGL section should route through
`HeroScene` (or follow its skip-below-mobile + fallback pattern directly)
rather than mounting a renderer unconditionally — `SceneViewport` and
`HeroScene` are now the two places this convention lives; a third bespoke
full-bleed scene should match them, not reintroduce the old gap.

---

## ADR-0030 — Per-service accent tint via scoped Tier-2 CSS custom-property overrides

**Status:** Accepted · 2026-08-24

**Decision.** Each service detail page wraps its content in a single element
(`service-detail.tsx`) whose inline `style` sets `--accent`/`--glow` — the
project's existing Tier-2 role names — to that service's own Tier-1
primitives (`--raw-color-service-<slug>-accent` / `-glow`, 8 new pairs added
to `globals.css`, all close navy/azure/cyan variants, none leaving the blue
family). `getServiceAccentStyle(slug)` (`src/lib/scene/service-accent.ts`)
produces that inline style. No new Tier-2 role names were invented and no
`@theme` binding changed — every existing utility that already resolves
through `--color-accent`/`--color-glow` (`bg-accent`, `text-glow`, the hero
scenes' pointer-glow colour, `HeroFallback`, `Magnetic`'s CTA button, etc.)
picks up the per-page tint automatically, with zero changes to the components
themselves.

**Why.** `design-system.md`'s token rule 3 already documents Tier 2 as "the
themeable layer" — the layer runtime theming is meant to override. This is
the first project feature to actually exercise that rule; per-service tinting
is a textbook case (same information architecture, one variable dimension),
not a new mechanism bolted on.

**When building.** Reach for this same pattern — a scoped wrapper overriding
Tier-2 custom properties — for any future "same layout, different accent per
instance" need (a future light mode would use the identical technique at the
document root). Never invent a new Tier-2 role name to carry a per-instance
variant; override the existing one in a narrower scope instead.

---

## ADR-0029 — Route transitions never wrap the App Router's live `children`; a decoupled overlay instead

**Status:** Accepted · 2026-08-24

**Decision.** Item 15 of the homepage motion overhaul (route transitions) is
implemented as `RouteTransitionSweep.tsx` — an accent sweep bar plus a brief
full-page fade, mounted as a *sibling* of `<main>` in `layout.tsx`, reacting
only to `usePathname()` changes. It never touches, wraps, or holds a reference
to the `children` prop that `layout.tsx` passes to `<main>`. An earlier
version (`RouteTransition.tsx`, since deleted) wrapped `{children}` directly
using `@react-spring/web`'s `useTransition` keyed on pathname, to visually
slide the actual outgoing/incoming page content — the literal interpretation
of the spec ("outgoing page slides up and fades out … incoming page slides up
from below").

**Why.** That version hit a genuine, reproducible Next.js 16 (Turbopack)
hazard, found during Phase 2 QA: a component that wraps the App Router's live
`children` prop and mounts more than one independent `@react-spring/web` hook
— confirmed down to `useTransition` plus even a second, *unused* `useSpring`
call, with no state, no effects, nothing rendered from it — causes Next to
silently orphan that `children` subtree into a hidden `<template>` element,
collapsing `<main>` to zero height. The failure looked at first like a WebGL
scissor bug (a scene rendering outside its card) and, separately, like it
might be dev-server-only; a clean-server bisection (deleting hooks one at a
time, testing in a fresh tab, confirming against a `next build && next start`
run) ruled both out and pinned it to this exact combination. `children` here
is not a plain React tree — it's the router's own live segment subtree, and
holding any processed/wrapped version of it across multiple spring-machinery
hooks in the same component is fragile in a way that doesn't reproduce with
ordinary JSX.

**When building.** Never pass the root layout's `children` prop through
`useTransition`, `useSpring`, or any hook combination that could re-render the
wrapping component independently of a real navigation — render `children`
directly and undecorated in `<main>`. A route-transition *effect* (sweep bar,
fade, any other decorative layer) belongs in its own component, driven only by
`usePathname()`, that never receives or touches `children` — see
`RouteTransitionSweep.tsx` for the pattern. If a future phase wants the actual
outgoing/incoming page content to visually animate (not just a covering
sweep), investigate the browser's native View Transitions API (which Next.js
has some support for) rather than routing page content through
`@react-spring/web`'s children-wrapping primitives again.

---

## ADR-0028 — Shared viewport renderer clears a registration's rect on deactivation, not just on unregister

**Status:** Accepted · 2026-08-24

**Decision.** `registerViewport()`'s `setActive(false)` path (called by
`SceneViewport`'s `IntersectionObserver` when a mini-scene's element leaves
the viewport) now immediately performs a scissored `renderer.clear()` over
that registration's *current* on-screen rect, via a new
`clearRegistrationRect()` helper in `shared-viewport-renderer.ts`. Previously
it only flipped the `active` flag; the render loop already skips inactive
registrations (`if (!reg.active) return`), so nothing re-clears that
registration's last-drawn pixels once it goes inactive.

**Why.** `renderer.autoClear` is `false` by design here (ADR-0025) — each
registration manually clears only its own scissored slice per frame, so N
mini-scenes share one canvas without wiping each other. That's correct for
the steady state, but has a gap: once a registration stops being visited by
the loop, its last frame is never cleared again *by the loop*. In the common
case this is invisible, because by the time `IntersectionObserver` actually
fires "left the viewport," the element (and therefore where its last frame
was drawn) is already off-screen. But `IntersectionObserver` can lag behind a
*fast* scroll enough that the last frame rendered while still `active` was
drawn at a rect that's still on-screen — a big wheel flick, a jump-to-section
link, or (how this was found) a large single `scroll_amount` in an automated
test. That leaves a frozen, permanently-uncleared fragment of the scene
sitting at whatever screen position it happened to occupy at that moment —
found during Phase 2 QA as what looked like a huge geological-cross-section
box rendering outside its card; a debug overlay marking the card's *actual*
live rect, compared against the same screenshot after a scroll, proved the
rendered fragment didn't move with scroll at all, while the real card did —
the signature of a stale, never-recleared scissor region, not a live
miscalculation.

The render loop's per-registration body was also wrapped in a `try`/`catch`
in the same pass (mirroring `ticker.ts`'s existing "isolate failures" pattern,
documented as intentional there) — a plain `Map.forEach` callback throwing
aborts the *entire* iteration, silently skipping every registration ordered
after the throwing one for that frame, which was a real risk while
bisecting this bug and is worth closing off regardless.

**When building.** A `setActive`/pause API on any future scissor-sharing
renderer needs to clear-on-deactivate, not just stop-updating-on-deactivate —
"stopped rendering it" and "no longer showing stale pixels of it" are not the
same guarantee when clearing is manual per-region. Any per-registration
callback inside a shared render loop's `forEach`/loop body should be wrapped
to isolate failures, so one broken scene can't blank out scenes registered
after it for that frame.

---

## ADR-0027 — A third standalone WebGL context for a persistent ambient background; device tiering added as a foundation module

**Status:** Accepted · 2026-08-24

**Decision.** The homepage motion/3D overhaul (a 35-item spec: global cursor/scroll
effects, a persistent 3D background, a page-load intro, route transitions, and deep
per-section upgrades — built in phases, this is Phase 0 / Foundation) adds a
persistent, full-viewport ambient background scene (`src/lib/scene/
ambient-background-renderer.ts` + `src/components/scene/AmbientBackground.tsx`):
slowly drifting wireframe shapes, mounted once from the root layout so it survives
route changes. This is a *third* standalone WebGL-context pattern in the project,
alongside the per-route `HeroScene` (own context, disposed on navigation) and the
shared scissored mini-scene renderer (`shared-viewport-renderer.ts`, one context
multiplexed across many DOM-anchored scenes). The ambient background doesn't fit
either: it isn't per-route like the hero, and it has exactly one occupant so there's
nothing to scissor — a single always-full-canvas render loop, standalone, was simpler
than forcing a "no element = full viewport" mode into the scissoring renderer.

Alongside it, a device-tiering module (`src/lib/scene/device-tier.ts`) was added as
a foundation piece rather than deferred: `getDeviceTier()` (mobile/tablet/desktop by
viewport width) plus named per-tier budgets (DPR clamp, ambient-shape count, whether
the ambient background runs at all). `optimize-3d-scene.md` already called this out
as "not in the starter, add when a project needs it" — this phase set is the first
point in the project where it's genuinely needed, since a persistent background +
(planned, later phases) elevated per-service scenes + a bigger globe + a denser
terrain can all be concurrent on the homepage.

**Why.** The alternative to a new background renderer was reusing
`shared-viewport-renderer.ts` with an optional element-less registration that skips
the scissor/viewport calls. That would have added a conditional branch through code
whose entire design (`registrations` keyed to DOM elements, per-registration scissor
rects computed from `getBoundingClientRect()`) assumes scissoring — for one caller
that never scissors. A new, much smaller module (no registration map, no scissor
test, one scene) was less code and easier to reason about than bending the existing
one around a case it wasn't built for. Device budgets as hardcoded numbers scattered
across the ambient background, the (upcoming) elevated service scenes, the bigger
globe, and the denser terrain would have meant re-deciding the same tier boundaries
in four places, with no single spot to tune them from.

**When building.** A new persistent (survives navigation), always-full-viewport 3D
element belongs in its own singleton module following `ambient-background-renderer.ts`'s
shape (ref-counted `start`/`stop`, `document.visibilitychange` pause, its own
`requestAnimationFrame` loop) — not folded into `shared-viewport-renderer.ts`, which
stays scissoring-only. Any new 3D module's tunable numbers (particle/shape counts, DPR
clamps, whether it runs at all on a given tier) should read from `getTierBudget()`
rather than hardcoding — extend `TIER_BUDGETS` in `device-tier.ts` with a new field
rather than adding a parallel ad-hoc check.

---

## ADR-0026 — Shared viewport renderer skips scenes with NaN geometry; animate the rendered attribute, not a derived one

**Status:** Accepted · 2026-08-24

**Decision.** `shared-viewport-renderer.ts`'s render loop now checks each active
registration's scene for a non-finite `position` attribute value before calling
`renderer.render()`; a scene that fails the check is skipped (not the whole
loop) and logged once via `console.error`, not every frame. The Stormwater
mini-scene (`mini-scenes.ts` → `buildStormwaterFlow`) — the scene that was
tripping this — no longer derives a `THREE.WireframeGeometry` from its
`PlaneGeometry` and then indexes into the wireframe's position buffer using
indices/clones taken from the source plane; it builds its own `BufferGeometry`
that shares the plane's actual position attribute plus a hand-built grid line
index, so the buffer being animated is the same buffer being rendered.

**Why.** `WireframeGeometry`'s derived vertex layout doesn't correspond 1:1
with its source geometry (edges duplicate shared vertices), so the old code's
per-frame loop — `for (i < wireframe.position.count) { read source.position[i] }`
— read past the end of the source's (smaller) position array once `i` exceeded
it, producing `NaN` Y values. Three's automatic frustum-culling bounding-sphere
computation then hit those NaNs, producing the
`THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN` console
error every frame for that card.

**When building.** If a scene builder needs to animate a geometry's vertex
positions per frame, animate the exact attribute object being rendered — never
a geometry *derived from* the one being mutated (or vice versa). If you need a
line/wireframe rendering that still shares a live position buffer with a solid
mesh, build the line geometry's index yourself against the source geometry's
own vertex numbering (see `buildPlaneGridIndex` in `mini-scenes.ts`) rather than
letting `THREE.WireframeGeometry` re-derive one. The render-loop guard is a
safety net, not a substitute for this — it prevents a bad scene from spamming
the console or breaking sibling scenes, but the actual visual (a flat/frozen
mini-scene) still means something is wrong upstream.

---

## ADR-0025 — One shared WebGL context for every mini scene; mouse-tilt via a raw-spring wrapper

**Status:** Accepted · 2026-08-24

**Decision.** The homepage's many small 3D moments (8 service-card icons, the
About geological cross-section, the Stats globe, the Contact terrain) render
through **one** shared `WebGLRenderer`/canvas (`src/lib/scene/shared-viewport-renderer.ts`),
not one context per scene — a full-viewport `position: fixed` canvas that
scissors a rect per registered DOM element every frame. The homepage hero
keeps its own dedicated context (`HeroScene.tsx`, unchanged) since it is
full-bleed and benefits from an uncontested renderer. Separately, the project
cards' cursor-tracked 3D tilt (`TiltCard.tsx`) is built directly on
`@react-spring/web`'s `useSpring`/`to()`, not the vendored `Hover` component.

**Why.** Browsers cap concurrent WebGL contexts (commonly 8–16); eleven
simultaneous mini-scenes (8 service icons + cross-section + globe + terrain)
each with their own context risked silently losing contexts on lower-end
devices, on top of the GPU/driver overhead of that many live renderers — the
exact failure mode [[optimize-3d-scene]] warns against. One shared context
with scissored viewports is the pattern the three.js manual documents for
this case and costs one GL context regardless of how many mini-scenes exist.
Separately, `Hover` (`src/components/animation/springs/hover.tsx`) only
supports a binary enter/leave spring target — it cannot express a transform
that tracks continuous pointer position within an element, which 3D tilt
needs. Rather than requesting a change to the protected engine (hard rule
#2 — `#do-not-modify` without sign-off), `TiltCard` composes the same
underlying `@react-spring/web` library directly, per the engine note's own
guidance ("need different behaviour? compose a wrapper instead").

**When building.** A new mini scene is a `ViewportBuilder` (`src/lib/scene/shared-viewport-renderer.ts`
exports the type) — `(aspect) => { scene, camera, update(elapsed, control), dispose }` —
registered via `<SceneViewport builder=... />`. `control` is a free-form
0..1-ish channel: hover intensity via `hoverRef`, or scroll progress fed
imperatively through the `SceneViewportHandle.setControl()` ref (e.g. from a
`SpringTrigger`'s `onChange`, which must stay a plain callback — never
`setState` there, or every scroll tick re-renders the host component).
Below 768px, or under `prefers-reduced-motion`, `SceneViewport` never mounts
WebGL — it renders `fallback` (plain CSS) instead, satisfying "simplify 3D on
mobile" without a second code path per scene. A card/section hosting a scene
slot must give its own foreground text `relative z-10` (the same convention
`HeroSection` already uses over its own canvas) since the shared canvas sits
at a low but explicit `z-index`.

---

## ADR-0024 — Language switcher: server-side translation proxy, client-cached

**Status:** Accepted · 2026-08-23

**Decision.** The nav language switcher (English/Arabic/Urdu/French/Chinese,
RTL for `ar`/`ur`) translates **nav links, section headings, and button
labels only** — not full body copy. Translation is a server-side proxy
(`app/api/translate/route.ts`) to a LibreTranslate instance, called through
the standard `apiFetch`/`handle()` envelope. The client batches every string
requested per render tick into one request per language
(`lib/i18n/translation-queue.ts`) and caches results in a `zustand`
`persist` store (`hooks/i18n/use-language-store.ts`), keyed by source string
and language, in `localStorage`.

**Why.** Hard rule #9 / [[api-architecture]] bans the browser calling a
third-party API directly — a naive client-side LibreTranslate integration
would violate that on every keystroke of a language switch. Scoping to
short UI strings (not paragraphs) keeps a single free public MT endpoint
viable without hitting its rate limits or translating brand/technical terms
unpredictably. Caching client-side means a string is translated at most once
per language, ever, across reloads.

**When building.** `useTranslated(text)` / `<TranslatedText text />` for a
plain string; `<SectionHeading>` for the eyebrow + `TextEngine` heading
pattern (translation must resolve to a plain string **before** it reaches
`TextEngine`, since it reads `children` directly rather than rendering
custom components first). On upstream failure, the string simply stays
uncached — `useTranslated` keeps returning the English source, no error
surfaced to the user. Full design: [[i18n]].

---

## ADR-0023 — Hero scene: hand-built three.js, own render loop

**Status:** Accepted · 2026-08-23

**Decision.** The homepage hero's "digital twin" scene (bridge, tunnel,
geological cutaway, boreholes, point cloud) is hand-authored from `three`
primitives — no external 3D models, no GetLayers catalog scene. It runs its
own `requestAnimationFrame` loop, started/stopped by the mounting client
component (`src/components/scene/HeroScene.tsx`), independent of the shared
spring `ticker` (`lib/animation/ticker.ts`).

**Why.** The catalog didn't have an engineering "digital twin" concept to
place — the brief (`getlayers.json`) called for one authored in Scene Lab.
The shared ticker throttles callbacks to a configurable framerate (default
100ms) for spring/text-engine motion; a WebGL render loop needs native frame
timing instead, so it stays outside that system entirely per [[tech-stack]].

**When building.** Colours live in `hero-scene-colors.ts`, manually mirroring
the Tier-1 tokens in `globals.css` (three.js materials can't consume CSS
custom properties). The loop pauses via `IntersectionObserver` (off-screen),
`visibilitychange` (tab hidden), and renders a single static frame instead of
looping when `prefers-reduced-motion` is set — checked directly via
`matchMedia`, not react-spring's `useReducedMotion` (that only affects spring
values, not a raw WebGL loop). Per-service scenes (`sceneTheme` in
`data/mocks/services.ts`) should follow the same pattern: a pure `build-*.ts`
setup module + a thin client-leaf wrapper.

---

## ADR-0022 — Track latest within majors; hold TypeScript 7 and ESLint 10

**Status:** Accepted · 2026-08-18

**Decision.** Dependencies track the newest release **within their current
major**. Three majors are deliberately held back.

**Why.** Stale pins hand every new project a migration debt on day one; a broken
toolchain is worse. Each hold was tested, not assumed:

- **TypeScript 5, not 7** — `eslint-config-next` depends on `typescript-eslint@8`,
  whose peer range is `typescript >=4.8.4 <6.1.0`. TS 7 breaks `yarn lint`.
- **ESLint 9, not 10** — ESLint 10 removed `context.getFilename()`;
  `eslint-plugin-react` still calls it, so linting dies on startup.
- **`@types/node` tracks the Node major in use**, not the newest published.

**When building.** The blockers live in someone else's dependency graph, so they
lift without work here — **re-test periodically** rather than treating them as
permanent. [[tech-stack]] carries the table and the reasons. Node ≥ 20.19 is a
hard floor (`engines` + `.nvmrc`): the ESLint toolchain fails to install below it.

---

## ADR-0021 — SEO is a practice with a workflow, not just a metadata helper

**Status:** Accepted · 2026-08-18

**Decision.** SEO and AEO get skills, an audit agent and a documented order of
work ([[seo-aeo]]), not just the metadata utilities.

**Why.** The mechanism existed; the practice did not. Nothing checked whether a
new route reached `sitemap.ts`, whether titles were unique, or whether the site
was legible to answer engines — the fastest-moving part of search and the one
most likely to be skipped.

**When building.** Audit in order: indexability → metadata → content structure →
structured data → performance → AEO. A perfectly optimised page that cannot be
crawled is worth nothing. **AI-crawler policy is the user's decision** — "be
cited by AI" and "don't train on my content" need different bots allowed. Never
cloak, and never emit schema describing content that is not on the page.

---

## ADR-0020 — Payload + Supabase are the CMS and database, added per project

**Status:** Accepted · 2026-08-18

**Decision.** Payload (Postgres adapter) on Supabase are the documented defaults.
**Neither ships in the starter** — the `payload-cms` / `supabase-db` skills
install them when a project needs them.

**Why.** Payload runs *inside* the Next app — admin as a route group, content via
an in-process Local API, types generated from the schema — which matches how this
starter already works (Server Components reading data, passing props down) and
keeps deployment one Vercel project. Supabase covers database, media bucket and
optional auth in one service. Most projects from this starter are marketing sites
that never need either, so an unused install would be a large dependency surface
and a migration story maintained for nothing.

**When building.** [[cms-payload]] and [[database-supabase]] carry the
conventions. Two constraints break installs if ignored: `@payloadcms/next` pins a
minimum Next version (verify before installing), and Supabase's connection
strings are not interchangeable — runtime on the transaction pooler (6543, no
prepared statements), migrations on the direct connection (5432).

---

## ADR-0019 — Hard rules get a mechanical check, not just prose

**Status:** Accepted · 2026-08-18

**Decision.** `.claude/scripts/verify.sh` checks every hard rule that is
objectively decidable from source and exits non-zero on any FAIL. Judgement calls
stay with the `qa-verify` skill.

**Why.** Rules that are never checked decay into suggestions, and silently — a
stray `@keyframes` or hardcoded hex surfaces at review, if at all. `yarn lint`
knows nothing about springs, token tiers or route delegation.

**When building.** Run it after any code change ([[qa-verification]]). It greps
rather than parsing TypeScript, so it is biased toward false positives: a
dismissed warning costs seconds, an unchecked rule costs a review cycle. WARNs
never fail a build, so justify them rather than ignoring them.

---

## ADR-0018 — Split the docs into knowledge (vault) and execution (`.claude/`)

**Status:** Accepted · 2026-08-18

**Decision.** The vault stays the single source of truth for *why* and *what*;
`.claude/` holds *how it runs* — path-scoped rules, skills, agents, commands and
the verify script ([[agent-harness]]). Every skill, agent and command is
registered in the vault.

**Why.** Documentation that cannot be executed gets skipped; execution files
without recorded reasoning drift and duplicate. Keeping each mechanism to one job
avoids both.

**When building.** `.claude/` files stay short and point into the vault rather
than restating it — restated rules drift out of sync. **Path-scoped rules fire
when Claude *reads* a matching file, not when it writes one, and are not
re-injected after `/compact`.** They reinforce; they never guarantee. Anything
that must hold unconditionally belongs in `verify.sh` or a hook.

---

## ADR-0017 — A skill states its preconditions and its own internal conflicts

**Status:** Accepted · 2026-07-24

**Decision.** Every skill must state the environment its measurements assume, and
name explicitly where one of its steps undermines another.

**Why.** `optimize-3d-scene` was run on a real scene and the fix *order* held up
— what cost hours was everything left implicit: a first step that could not be
executed on the stack in front of it, measurements silently invalidated by the
dev server, and two individually correct steps that contradicted each other.

**When building.** When writing or editing a skill: a step names its
preconditions, and a step names where it fights another step. Numbers taken in
the wrong environment are worse than no numbers, because they read as evidence.

---

## ADR-0016 — Skills are registered in the vault, not just dropped in `.claude/`

**Status:** Accepted · 2026-07-24

**Decision.** A skill is only "installed" once it lives in `.claude/skills/<name>/`,
has a vault note under `workflows/`, is linked from [[README]] and
[[ai-agent-guide]], and — if invocation should be non-optional — has a routing
rule in `AGENTS.md`.

**Why.** A skill folder is discoverable to Claude Code at runtime but invisible in
the vault, leaving the invocation decision to model judgement. Where the skill
exists *because the order of operations matters*, that is exactly the wrong thing
to leave to chance.

**When building.** Registration is also when a skill gets checked against reality
— stale paths and references to files that do not exist surface here.

---

## ADR-0015 — Strict three-tier design-token naming convention

**Status:** Accepted · 2026-07-17 · amends ADR-0004

**Decision.** Tokens follow three tiers with an explicit grammar: primitive
`--raw-<category>-<name>[-<shade>]` → semantic `--<role>[-<variant>][-<state>]` →
`@theme inline` binding. Only Tier 1 holds literals; Tier 2 names purpose, never
appearance, and is the themeable layer. No tier may be skipped.

**Why.** ADR-0004 made tokens the styling currency but never said what a token
should be *called*, so every project would invent its own — defeating the point of
a shared starter. The names are predictable across projects by design.

**When building.** Full rules in [[design-system]]. Two Tailwind v4 facts,
verified by compiling a probe stylesheet, that guides commonly get wrong:

1. Naming primitives `--color-*` would **generate a utility for every raw value**
   and let markup bypass the semantic tier — hence the `--raw-*` prefix, kept out
   of `@theme`.
2. **There is no `--duration-*` namespace.** `duration-fast` compiles to nothing.
   Durations stay Tier 2 and are used as `duration-[var(--duration-fast)]`.
   (`--ease-*` *is* real.)

`@theme inline` is load-bearing: `inline` inlines the `var()` into each utility so
Tier 2 overrides cascade. Binding a literal there freezes the value and silently
breaks theming.

---

## ADR-0014 — Narrow CSS-transition exception for trivial state changes

**Status:** Accepted · 2026-07-17 · amends ADR-0002

**Decision.** All real motion stays spring-based, with one exception: CSS
`transition-*` for simple discrete state changes — `hover:` / `focus-visible:` /
`active:` colour, opacity, border, underline, and small decorative nudges.

**Why.** The outright ban cost most where it helped least: a nav link fading its
colour on hover needed a client component and a spring config to animate one
property nobody will interrupt. The rule pushed toward boilerplate or quiet
rule-breaking.

**When building.** Three conditions, all required, or it is a spring:
token-backed timing (`duration-[var(--duration-fast)] ease-entrance`),
`transition-*` only (`@keyframes` stay banned outright), and utilities only —
never a CSS file. Everything scroll-driven, revealing, staggered, orchestrated,
layout-affecting or interruptible remains a spring; text stays [[text-engine]].
The list is enumerated rather than a judgement call ("simple animations") so it
cannot erode into general CSS animation. Past the list, use `<Hover>`.

---

## ADR-0013 — `<Inview>` self-observe fix; spring components honour resize

**Status:** Accepted · 2026-06-07

**Decision.** Second authorised edit to the protected engine: `<Inview>` now
calls its callback ref so it observes itself when no `trigger` is passed, and
`<Inview>` / `<Spring>` / `<Hover>` pass the React-tracked `width` into
`isMobileDisabled(value, width)`.

**Why.** `<Inview>` only animated when given an external `trigger` — the common
case silently did nothing, because a callback ref was being assigned as
`.current` instead of called. Separately the `width` dependency was tracked but
never used, so resize re-evaluation of mobile gating did nothing.

**When building.** The springs folder stays `#do-not-modify` by default — these
were explicitly signed-off bug fixes, not an opening.

---

## ADR-0012 — Styling lives in utilities and components, not `globals.css`

**Status:** Accepted · 2026-05-22 · amends ADR-0004

**Decision.** A strict placement order, first match wins:

| Situation | Goes where |
|-----------|-----------|
| One-off styling | Tailwind utilities in `className` |
| Repeated pattern with markup/structure/props | a **React component** in `components/ui/` |
| Repeated pure-utility combo, no structure | a Tailwind v4 `@utility` |
| Pseudo-elements, 3rd-party overrides, complex selectors | `@layer components` |
| A new colour/spacing/radius value | a token (per ADR-0015) |

**Why.** With tokens in `globals.css` and guidance to extract repeated patterns
into `@layer components`, the path of least resistance made that file a dumping
ground — hundreds of component-specific classes never deleted when their
component was. Splitting the file would only spread the same bloat; the fix is a
placement rule.

**When building.** The default answer to "this looks repeated" is a **React
component**, not a CSS class — an eyebrow label with a `::before` dot is an
`<Eyebrow>`, not a `.label-eyebrow`. `globals.css` holds imports, tokens, base
resets and the narrow `@layer components` exceptions; if it grows past that,
something was misplaced. **CSS Modules were considered and rejected** — a second
styling mechanism is not worth the mental model when motion is spring-based (no
keyframes to co-locate) and utilities plus components cover everything else.

---

## ADR-0011 — API layer: `app/api` route handlers, secrets server-side

**Status:** Accepted · 2026-05-22

**Decision.** External calls go through Next.js Route Handlers at
`src/app/api/<resource>/route.ts`. The handler owns the work — business logic,
upstream calls, filtering, secret env vars. No mandatory passthrough service
layer; extract shared code only when genuinely reused.

**Why.** `route.ts` is never bundled to the browser, so it is the natural place
for secrets, and a single convention keeps every endpoint the same shape.

**When building.** Every endpoint validates input with `zod` and returns the
`{ data }` / `{ error }` envelope via the shared `handle()` wrapper. Secret env
vars are unprefixed and read through `getServerEnv()`; `NEXT_PUBLIC_` is only for
browser-safe values. Client Components fetch same-origin via `apiFetch`;
render-time data is read in Server Components. Full note: [[api-architecture]].
Server Actions were considered for mutations and deferred — revisit with a new
ADR if forms need progressive enhancement.

---

## ADR-0010 — SEO & performance hardening

**Status:** Accepted · 2026-05-21

**Decision.** `src/lib/site.ts` (`siteConfig`) is the single source of truth for
SEO. `metadataBase` is always set; `themeColor` lives on the `viewport` export.
Added `robots.ts`, `sitemap.ts`, JSON-LD, `loading.tsx` / `error.tsx` /
`not-found.tsx`, and `<ReducedMotion>`.

**Why.** Relative OG/canonical URLs never resolved to absolute, so social
previews broke in production; an animation-heavy starter ignored
`prefers-reduced-motion`; and the home view was a top-level `"use client"`,
breaking the server-first rule it should model.

**When building.** Set `NEXT_PUBLIC_SITE_URL` in every deployed environment or
canonical and OG URLs resolve to localhost. `<ReducedMotion>` toggles
react-spring's global `skipAnimation` from one app-root mount, covering every
spring and the text engine at once. **`isBot()` is discouraged** — it opts the
route out of static rendering and edges toward cloaking; reduced motion is the
preferred lever, since springs only animate opacity/transform and content is in
the DOM for crawlers regardless ([[seo-metadata]]).

---

## ADR-0009 — Shared animation ticker; authorised engine performance refactor

**Status:** Accepted · 2026-05-21 · amends ADR-0002

**Decision.** One-time authorised refactor of the protected engine, plus a shared
loop primitive: `src/lib/animation/ticker.ts` — a single app-wide,
reference-counted rAF loop that starts on the first subscriber and stops on the
last. It is **not** `#do-not-modify`; it is the supported extension point.

**Why.** Cost scaled with the number of animated components: a private rAF loop
per `useLoop` instance that never stopped, a debounced `resize` listener per
spring component, and an `IntersectionObserver` re-created on every render.

**When building.** A page with N animated components now runs **one** rAF loop
and **one** resize listener. Subscribe new per-frame work to the ticker rather
than starting a loop. Hard rule #2 was amended here: the engine stays protected
by default and changes need explicit sign-off — this ADR is not a precedent for
editing it.

---

## ADR-0008 — Adaptive scaling grid via root font-size

**Status:** Accepted · 2026-05-21

**Decision.** Keep a rem-based design proportional across viewports by scaling
`html { font-size }`: `vw`-based media queries in `globals.css` for scaling down,
and a `<AdaptiveGrid>` client component for scaling up beyond the largest
breakpoint.

**Why.** The behaviour arrived as a `styled-components` implementation, which is
not a project dependency and conflicts with the CSS-only config rule. Only the
behaviour was kept; the implementation was rebuilt on the project stack.

**When building.** Breakpoints live in `grid.config.ts` **and** are mirrored in
the `globals.css` media queries — duplicated by design, since ADR-0004 forbids
generating CSS config from JS. **Keep the two in sync**; the formula is written
in both files. Design px map cleanly to rem at the design base width.

---

## ADR-0007 — Automate the vault workflow with Claude Code hooks

**Status:** Accepted · 2026-05-21

**Decision.** Encode the "read the vault first, update the docs after" workflow as
hooks in `.claude/settings.json`: `SessionStart` injects a pointer to the vault,
`UserPromptSubmit` reminds the agent to consult the relevant guide,
and `Stop` blocks **once per turn** to confirm docs were updated.

**Why.** Documentation drifts the moment it depends on someone remembering.

**When building.** The `Stop` hook uses a `${TMPDIR}` marker keyed by session id
so it blocks at most once per turn — no infinite loop. Hooks are reviewable and
disableable via `/hooks`, and take effect at the next session start.

---

## ADR-0006 — The vault is the single source of truth

**Status:** Accepted · 2026-05-21 · amends ADR-0001

**Decision.** The vault is the **only** documentation source. The repo root keeps
thin shims: `AGENTS.md` carries the breaking-change warning and hard rules and
points into the vault; `CLAUDE.md` and `.cursorrules` `@`-import it.

**Why.** Dense spec files at the root duplicated the vault's content as terse
specs, and the two would drift.

**When building.** Put documentation in the vault and link to it. Keep the root
shims consistent with it — they are the first thing every agent reads.

---

## ADR-0005 — Use standard `next/link` for navigation

**Status:** Accepted · 2026-05-21

**Decision.** Standard Next.js navigation — `<Link>` from `next/link`,
`useRouter` from `next/navigation`. The custom `<AnimLink>` / `useAnimRouter()`
convention referenced in early drafts is dropped; it was never built.

**Why.** Two conflicting conventions existed in the docs and only one had code.

**When building.** No animated route-transition layer exists. If one is needed,
revisit with a new ADR rather than reviving the old names. See [[routing]].

---

## ADR-0004 — Tailwind v4 with CSS-based config

**Status:** Accepted (starter baseline) · amended by ADR-0012 and ADR-0015

**Decision.** All theme configuration lives in `globals.css` under `:root` and
`@theme inline`. There is no `tailwind.config.js`. Raw values in class names are
banned.

**Why.** Tailwind v4 removes the JS config file in favour of CSS-native config.

**When building.** Design tokens are the only styling currency: a value that does
not exist as a token gets added to `globals.css` first — following the three-tier
grammar (ADR-0015) — and component-specific *classes* do not go there at all
(ADR-0012). See [[design-system]].

---

## ADR-0003 — Routes delegate to Views

**Status:** Accepted (starter baseline)

**Decision.** `app/**/page.tsx` only imports and renders a component from
`src/views/`. All layout and UI logic lives in the view.

**Why.** Mixing routing concerns with page UI makes `app/` files heavy and hard
to test.

**When building.** Every route is a ~3-line file; views are the real page
components. `verify.sh` FAILs on a route importing anything else. See [[routing]].

---

## ADR-0002 — All motion is spring-based (`@react-spring/web`)

**Status:** Accepted (starter baseline) · amended by ADR-0014 and ADR-0009

**Decision.** Every animation uses `@react-spring/web` through the component
layer in `src/components/animation/springs/`. CSS keyframes and `framer-motion`
are **banned**. Text animation goes through `spring-text-engine`.

**Why.** Marketing sites need rich, interruptible, physically natural motion. CSS
transitions and keyframes are rigid; competing libraries add weight.

**When building.** The springs folder and `src/hooks/animation/` are
`#do-not-modify` — consume them, wrap them, never edit them without sign-off.
ADR-0014 narrows the CSS ban to allow `transition-*` for trivial hover/focus
state only. See [[animation-system]] and [[text-engine]].

---

## ADR-0001 — Adopt an Obsidian vault as the project brain

**Status:** Accepted (starter baseline) · amended by ADR-0006

**Decision.** `obsidian/` is a linked, navigable vault documenting how the
project is built and why.

**Why.** Project knowledge scattered across root markdown files gave new
contributors and AI agents no structured map of the system.

**When building.** Docs are maintained alongside code — see [[meta/README]] for
the maintenance rules, and [[agent-harness]] for how the vault and `.claude/`
divide the work.
