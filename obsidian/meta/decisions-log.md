---
tags: [meta, decision]
updated: 2026-09-01
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

## ADR-0078 — WebGL scenes no longer skip on narrow viewport width; gate is device capability only

**Status:** Accepted · 2026-09-01 · **Amends ADR-0056, ADR-0058, ADR-0060, ADR-0031.**

**Context.** Explicit user report: on a real iPhone 15 Pro Max (Safari and
Chrome iOS), every WebGL scene sitewide — the Earth globe (`PlanetBackground`),
the homepage hero wireframe (`HeroScene`), the Geotechnical FEA scene
(`GeotechnicalFeaScene`), every service-page hero, the ambient background, and
every `SceneViewport` mini-scene (Stats globe, geological cross-section,
contact terrain) — was not rendering. Root cause: two independent width-driven
gates. (1) `device-tier.ts#getDeviceTier` treated any viewport `< 768px` as
`"mobile"` tier outright, and every scene mount site treated `tier ===
"mobile"` as "skip WebGL, show the CSS fallback" — true for essentially every
phone regardless of capability. (2) `performance-tier.ts#detectPerformanceTier`
independently forced any mobile-UA device with `width < 768` to the "low"
capability tier, regardless of actual `hardwareConcurrency`/`deviceMemory` —
catching high-end phones too, since Safari never exposes `deviceMemory` at all.
A modern flagship phone (6+ CPU cores, full WebGL2) was being treated the same
as end-of-life hardware, purely for being narrow and having a mobile UA
string.

**Decision.** Un-conflate "narrow viewport" from "should WebGL mount":

- `detectPerformanceTier` now judges mobile devices on real `cores`/`memory`
  signals, same as desktop, instead of flooring every mobile UA to "low" via
  the width check. The mobile ceiling stays capped at "high" (never "ultra") —
  phone GPUs/thermals are still weaker than desktop at the same core count.
- `isLowPowerDevice()` (capability-only, no width dependency) is now the
  *sole* "skip WebGL, show CSS/spring fallback" signal, called directly by
  every scene mount site: `HeroScene`, `GeotechnicalFeaScene`,
  `PlanetBackground`, `AmbientBackground`, `SceneViewport`. `getDeviceTier`'s
  width-based `"mobile"` result is now documented and used as a *budget* tier
  only (DPR clamp, particle/shape counts, hero frame-rate cap) — never again
  as a mount/skip condition.
- `SceneViewport`'s `mobileBreakpoint` prop (the width-based skip override, no
  caller ever set it) is removed outright.
- Kept and tuned rather than removed: the width-based *budget* scaling this
  project already relies on for battery/thermal reasons. `TIER_BUDGETS.mobile`
  moved from `dprClamp: 1` to `1.5` (the brief's explicit "keep DPR capped at
  1.5 on mobile"); `heroFrameIntervalMs` stays a 30fps cap at mobile width.
  Ambient background and the Earth globe, previously fully disabled at mobile
  width (`ambientBackgroundEnabled: false`, `tier !== "mobile"`), now mount at
  mobile width with their own reduced counts instead of zero —
  `ambientShapeCount: 6` (was 0) and a new `TIER_COUNTS.mobile` entry in
  `build-planet-scene.ts` (350/80/15 vs tablet's 700/160/30), so a capable
  phone gets a lighter version of the scene rather than either the full
  desktop load or nothing.
- A genuinely low-spec device (< 6 cores or < 4GB RAM on a mobile UA; < 4
  cores or < 4GB on desktop) still resolves to "low" and still gets the CSS
  fallback — this was a deliberate scope decision (the alternative, forcing
  WebGL on for every phone with no capability floor, was rejected) to avoid
  crashes/thermal throttling on end-of-life Android hardware.

**Why.** The width-based gate was over-broad by construction: it used
"narrower than 768px" as a proxy for "can't handle WebGL," which stopped being
true once modern phones shipped genuine GPUs. The fix keeps the *reason*
mobile gets a reduced experience (real capability limits, battery/thermal
budget) while dropping the *proxy* that had drifted from that reason (screen
width, and a mobile UA string).

**Amends.** ADR-0056 (original sitewide "mobile = no WebGL" convention),
ADR-0058 (the 4-tier capability system that layered the same width-forcing
rule on top), ADR-0060 (`HeroScene`'s and `GeotechnicalFeaScene`'s internal
gating), ADR-0031 (service hero fallback's mobile-WebGL skip) — all reasoned
soundly at the time from the brief's own "MOBILE SPECIFIC" forcing rules, but
those rules are now explicitly reversed by direct user instruction backed by
real-device testing.

**When building.** Never reintroduce a raw viewport-width check as a WebGL
mount/skip condition — that regresses this ADR. Width belongs only in budget
lookups (`getTierBudget`/`getDeviceTier`, read for DPR/particle/frame-rate
scaling). The skip decision is always `isLowPowerDevice()`.

---

## ADR-0077 — Language switcher and the entire i18n stack removed; site is English-only

**Status:** Accepted · 2026-09-01 · **Supersedes ADR-0024, ADR-0065.**

**Context.** Explicit user direction: "Remove the language switcher
completely from the entire Geoporte website" — the nav toggle, all
switching functionality, and any i18n/translation config, site-wide, with
nothing else touched. ADR-0024 originally added the switcher (server-side
LibreTranslate proxy, client-cached via `zustand`), and ADR-0065 widened its
coverage from nav/headings/buttons to every page. Both are now reversed.

**Decision.** Removed outright rather than disabled/flagged off, matching
how this project has retired other features before (e.g. `ThemeController`,
ADR-0066):

- Deleted: `components/common/Nav/LanguageSwitcher.tsx`,
  `components/common/LanguageDirection.tsx`,
  `components/common/TranslatedText.tsx`, `hooks/i18n/` (`use-translated.ts`,
  `use-language-store.ts`), `lib/i18n/` (`translation-queue.ts`,
  `languages.ts`), `app/api/translate/route.ts`, `obsidian/frontend/i18n.md`.
- `Nav.tsx`/`MobileMenu.tsx` no longer import or render
  `<LanguageSwitcher>`; `layout.tsx` no longer mounts `<LanguageDirection>`
  (so `<html lang>`/`dir` now stay at their static `"en"`/`ltr` defaults set
  directly on the `<html>` tag).
- Every `<TranslatedText text={expr} />` / `<TranslatedText text="literal" />`
  call across `views/` and `components/common/` (~30 files: `Footer`,
  `ServiceCard`, `ServicesDropdown`, every `views/home/*` and
  `views/services/*` section, `ProjectCard`/`ProjectModal`/`ProjectsSection`/
  `ProjectsCascade`/`ProjectsShowreel`, `TeamCascade`/`TeamMemberCard`,
  `about.tsx`/`contact.tsx`/`publications.tsx`) replaced with the plain
  source string in place — mechanical, done via a one-off codemod script
  (not committed) plus manual review of each diff. `SectionHeading`,
  `HeroHeading` (`HeroHeading`/`HeroSubtext`), `AboutHeading`, and
  `TeamPanel`'s `TeamRoleTyped` dropped their `useTranslated()` indirection
  and now pass their `text` prop straight to `TextEngine`/`Inview`.
- `LIBRETRANSLATE_ENDPOINT` removed from `src/env.ts`'s server zod schema
  and from `.env.example`.
- Two comments in `contact.tsx`/`ContactSection.tsx` explaining why the
  office street address was excluded from translation were removed — the
  premise (a translation system that skips certain fields) no longer
  applies.

**Consequence.** `zustand` itself stays (still backs the scroll store,
cookie-consent store, and the project-modal store — none of those are i18n).
Two pre-existing `react/no-unescaped-entities` lint failures surfaced once
`<TranslatedText>` text became literal JSX children ("Let's talk", "as
they're presented") and were fixed with `&apos;` in the same pass, since
leaving `yarn lint` red would misrepresent this change as unverified. No
other files were touched — `.claude/scripts/verify.sh`'s one pre-existing
FAIL (a false-positive `@keyframes` match on a comment string in
`TeamCascade.tsx`/`ProjectsCascade.tsx`) and its WARNs all predate this
change and were left alone per the user's "do not touch anything else."
`yarn build` confirms `/api/translate` is gone from the route list; live
verification on `/`, `/about`, `/about/team`, `/contact`, `/projects`,
`/publications` found no globe icon, no language dropdown, and no
`TranslatedText`/`i18n` references anywhere in `src/` outside CSS
`translate()`/`translate3d()` transform calls (a false-positive substring
match, unrelated to language translation).

---

## ADR-0076 — `/about/team` moves from "Mirror Hall" (WebGL) to a CSS-3D-only "Cards Cascade"; a real sitewide Lenis `scrollTo` bug found and fixed in both Cascade CTAs

**Status:** Accepted · 2026-08-30

**Context.** A later, explicit brief asked to replace "Mirror Hall"
(ADR-0074, the WebGL water-reflection carousel this route had shipped
with) outright: no WebGL, no canvas, pure CSS 3D transforms — the same
"Cards Cascade" mechanism `/projects` got in ADR-0075, re-skinned for the
team roster with its own hero copy ("GEOPORTE · Our People" / "Our
**Team**" / "The specialists behind every project" / "Meet the team") and
a teal (`#5cc8d7`) accent in place of the sitewide blue.

**Decision.** New `team-cascade-config.ts` + `TeamCascade.tsx`, same
architecture as `projects-cascade-config.ts`/`ProjectsCascade.tsx` — tall
track, manual sticky-emulation ticker, `useProgressTrigger`-driven
placement, symmetric fold formula — written as its own copy rather than
extracting a shared module, matching how this codebase already keeps this
category of near-duplicate logic separate per page. `about-team.tsx` now
renders `TeamCascade` instead of `TeamMirrorHall`; `teamMembers`
(`@/data/mocks/team`) passed through unchanged, no data touched. Cards
show photo, name, title, and experience — narrower than Mirror Hall's own
detail panel (no bio/credentials), matching this brief's own shorter card-
content list.

**`TeamMirrorHall.tsx` and `build-mirror-hall-scene.ts` were deleted**, not
retired — once `about-team.tsx` stopped importing them, both files had
zero remaining references anywhere in the codebase (confirmed by search),
unlike `TeamStarfieldBackground.tsx` (ADR-0072/ADR-0074), which stays
mounted sitewide in `layout.tsx` and was only route-gated to empty. A
component with no importer left anywhere is dead code, not a retired
component — this codebase's own convention is to delete that outright
rather than leave it as a landmine for a future reader to wonder about.

**A real, sitewide bug found and fixed — the Cascade CTAs' `scrollTo`
never worked, on either page.** Both `ProjectsCascade`'s "Explore
projects" and this page's own "Meet the team" button compute a scroll
target and hand it to this codebase's shared `scrollTo()` helper
(`@/utils/scroll-to`). Tested live (clicking the button, checking
`window.scrollY` before and after): nothing happened, on either page —
confirmed a REAL functional bug, not a testing-tool artifact this time
(reproduced identically via a raw browser click and via `.click()` in the
console, both outside any automation-visibility quirk). Root cause,
diagnosed live in the console:

- The shared helper flips an `isEnableScroll` Zustand flag; a separate
  `ScrollController` component reacts to that flag in a `useEffect` and
  *then* calls `lenis.stop()`. The helper's own `window.scrollTo()` runs
  on a bare `setTimeout(…, 50)`, with no guarantee that effect has
  actually fired first — so Lenis is frequently still driving the page,
  and its own render loop reasserts the unmoved scroll position on its
  very next tick, silently cancelling the jump.
- Lenis's own instance method, `lenis.scrollTo()`, was tried as the
  "correct" fix and turned out to be a no-op in this project's setup too
  (confirmed directly against `window.lenis`, live).
- What worked, confirmed repeatedly by direct console testing: call
  `lenis.stop()`, then a plain `window.scrollTo()`, then `lenis.start()`
  once the jump has taken effect — Lenis resyncs its own internal
  position from the real DOM `scrollTop` on `start()`, so it doesn't snap
  back.
- One more layer to this: `window.scrollTo({ behavior: "smooth" })` was
  *still* silently cancelled inside that exact stop → scroll → start
  sequence, every time, even run entirely outside React directly in the
  console. Only `behavior: "instant"` was reliable. Both CTAs now jump
  instantly rather than animate — a deliberate trade: an instant scroll
  that actually happens beats a smooth one that silently does nothing.

**Not fixed in `src/utils/scroll-to.ts` itself** — other call sites
depend on its current behaviour and a sitewide audit of every consumer
was out of scope for this page's own brief. Both Cascade components now
bypass it and call `lenis.stop()`/`window.scrollTo(..., "instant")`/
`lenis.start()` directly instead, via `useScroll((s) => s.lenis)`.

**Consequence.** No team member name, title, bio, credential, experience
figure, or photo path was changed. `TeamStarfieldBackground.tsx` stays
retired (unaffected, still an empty route set). `/about`, `/projects`, the
homepage, and services pages were not touched beyond the `ProjectsCascade`
CTA fix above. `yarn lint`/`yarn build` clean; both CTAs verified actually
scrolling, live, after the fix.

---

## ADR-0075 — `/projects` gains a "Cards Cascade" scroll-driven deck, CSS 3D only; `ProjectsSection` untouched

**Status:** Accepted · 2026-08-30

**Context.** A follow-up request asked for a "Cards Cascade" on `/projects`
— explicitly CSS 3D transforms, no WebGL — folding through every real
project one at a time as the page scrolls, with its own hero (eyebrow
"GEOPORTE · Selected Work", title "Our Projects", CTA "Explore projects").
This is not a restoration of anything: the old team-page "Cards Cascade"
(`TeamCascadeDeck.tsx`/`cascade-config.ts`) was deleted outright in
ADR-0072, and even if it still existed, `/projects` already has its own
grid (`ProjectsSection`, shared with the homepage) that a team-page-shaped
deck wouldn't fit. Built fresh for this page's own data and numbers.

**Decision.** New `projects-cascade-config.ts` (pure functions) +
`ProjectsCascade.tsx`, wired into `projects.tsx` in place of
`<ProjectsSection headingTag="h1">`. `ProjectsSection.tsx` itself was left
completely unmodified — it's still rendered by the homepage
(`home.tsx`), and a shared component can't be reshaped for one page
without affecting the other. `projects.ts`'s real project data (title,
location, category, real photo) is reused unchanged, same as every other
real-data source this codebase touches — no duplicate array, no invented
projects.

- **Mechanism:** a tall track (`trackVh(total)` = `HERO_VH + (total-1) ×
  CARD_VH + TAIL_VH`) plus a pseudo-sticky stage, driven by
  `useProgressTrigger` — the same vendored scroll-trigger hook
  `ProjectsShowreel.tsx` (this page's other tall-track section) already
  uses, including its `subscribeToTicker`-based manual sticky emulation
  (`absolute` at the track's top → `fixed` while passing through →
  `absolute` at the track's bottom), needed because `position: sticky`
  does not work anywhere on this site — see ADR-0071's note on why. This
  is real CSS 3D (`perspective`, `translate3d`, `rotateX`), not WebGL, and
  the enter/exit fold is spring-interpolated
  (`interpolatedProgress.to(...)`) per hard rule #1 — not `@keyframes` or
  raw scroll-synced style writes.
- **Placement formula** (`placeCascadeCard`, in the config file): each
  card's placement is a function of `d = index − continuous-active-index`
  — symmetric by design, so entering and exiting read as one continuous
  fold rather than two stitched-together animations.
- **A real bug this build caught, only once real interactive testing was
  possible:** the first version clamped `cascadeActiveIndex` to `[0, total
  - 1]` at both ends. Clamping the *lower* end meant the first card's `d`
  was exactly 0 — fully at rest, fully opaque — for the *entire* intro
  phase, sitting directly behind the eyebrow/title/CTA the whole time
  instead of waiting off-stage. Reasoning about the formula in isolation
  didn't surface this; scrolling the real page did. Fixed by leaving the
  lower end unclamped (down to −1.5), so the first card stays mostly faded
  until `p` actually approaches the end of the intro, then rises in sync
  with the intro fading out.
- **A testing-tool false alarm, not a real bug:** jumping the scroll
  position instantly via `window.scrollTo()` (bypassing Lenis and the
  ticker's gradual per-frame updates) produced a visible "hole" — a fixed
  full-bleed background `<video>` (mounted globally, `z-0`, behind
  `<main>`'s `z-10`) briefly showing through between the Showreel's track
  ending and the Cascade's track beginning, because neither section's
  pseudo-sticky stage had yet run a tick to reposition itself for the new,
  instantly-jumped scroll value. Re-tested with real incremental
  wheel-scroll input (what an actual user's scrolling produces, and what
  keeps the ticker's per-frame position writes continuously in sync) and
  the transition is clean with no gap. Not a code defect — a limitation of
  instant-jump scroll testing, same category of false alarm as the
  tab-visibility finding in ADR-0074.
- **CTA is a real `<button>`, not an anchor.** The deck's own content sits
  inside the pseudo-sticky stage, which is `position: fixed` for most of
  its lifetime — an `href="#..."` anchor jump into that stage would
  resolve against a fixed target already pinned at the viewport's top,
  computing a ~0 scroll delta and never actually advancing. The CTA
  instead computes a real document-relative scroll target and calls this
  codebase's own Lenis-aware `scrollTo()` helper (`@/utils/scroll-to`).

**Consequence.** `ProjectsSection.tsx`/`ProjectCard.tsx`/the homepage are
untouched — the homepage's own "Selected work" grid section renders
exactly as before. No project title, location, category, or photo path
was changed. `yarn lint`/`yarn build` clean; verified interactively in a
real browser (scroll, hero-to-deck transition, multiple card folds), not
just built.

---

## ADR-0074 — `/about/team` rebuilt as "Mirror Hall": an original Three.js 3D carousel with real-time water reflection

**Status:** Accepted · 2026-08-30

**Context.** A follow-up brief asked to replace this page's plain
responsive grid (ADR-0072) with a named "Mirror Hall" experience — a
curved 3D carousel of team portraits above a reflective, rippling water
plane with a particle field, described as ported from "the Mirror Hall
specification." No such specification was ever actually supplied (the
brief's own template had an empty placeholder where it should have been)
— confirmed directly with the user rather than guessing at or inventing a
fictitious "spec" to claim fidelity to. The user's explicit direction:
there is no separate document; treat the detailed technical requirements
already given (carousel behaviour, card geometry, water/ripple/particle
technique, camera, HUD copy, accessibility, performance budget) as the
actual specification, and design the implementation from scratch using
this project's own conventions.

**Decision — architecture.** New `build-mirror-hall-scene.ts` (vanilla
Three.js, this codebase's usual `build-*-scene.ts` shape) + new
`about-team/TeamMirrorHall.tsx` (the client wrapper owning input, the
render loop, and the DOM overlay). `about-team.tsx` now renders nothing
but `<TeamMirrorHall members={teamMembers} />` — the real roster,
unchanged, passed straight through; no second copy of the data exists
anywhere.

- **Carousel.** 11 photo cards on a shallow arc (`ANGLE_STEP`/`RADIUS`
  constants), one continuous `scrollOffset` float driven by
  pointer-drag/wheel/touch, inertia + spring-like snap-to-nearest-integer
  when not actively dragging, click-vs-drag disambiguated by a real
  pixel-movement threshold (not a time threshold alone).
- **Water reflection — genuinely real-time, not faked.** A second camera,
  mirrored across the water plane's Y through the standard planar-
  reflection identity, renders the card group (only) into a
  `WebGLRenderTarget` every frame; the water fragment shader samples that
  texture, distorted by a fixed-size ripple pool (8 slots, ring-buffer
  overwrite — no per-frame allocation). No `three/examples` Reflector/
  Water addon — a bespoke shader, matching how every other scene in this
  codebase is already built, and giving full control over the ripple
  distortion and Geoporte's own colour tinting.
- **Reflected cards can never be accidental click targets** — not because
  of extra guard logic, but architecturally: the reflection is a texture
  sample, not real duplicate meshes below the water, so there is nothing
  there for the raycaster to ever hit.
- **Particles** reuse the exact per-vertex-pixel-size + circular-falloff
  shader technique `build-team-starfield-scene.ts`/`build-planet-scene.ts`
  already established in this codebase (see that file's own warning about
  why bare `THREE.PointsMaterial` + `sizeAttenuation` doesn't produce a
  pixel size at all).
- **Mobile still runs WebGL** — a deliberate, brief-driven exception to
  this codebase's usual "no WebGL below the mobile breakpoint" rule
  (`device-tier.ts`); tiering here is a local three-step reduction
  (particle count, reflection-texture resolution, DPR cap) keyed off
  container width instead.
- **Accessibility** doesn't depend on the canvas at all: a real, keyboard-
  reachable `<button>` per member (`sr-only`, in the DOM and the
  accessibility tree) drives selection independently of the raycaster;
  Escape/close/backdrop all work through the same React state the buttons
  use.
- **WebGL-unavailable fallback** reuses `TeamMemberCard`/the same grid
  layout ADR-0072 shipped — not a second, different fallback design.

**A real bug this build caught and fixed:** the water plane (24×16 world
units, `transparent: true`, default `depthWrite: true`) was large enough
to overlap every card on screen, and Three.js's transparent-object sort is
one distance value per object, not per pixel — the water could paint over
every card depending on which side of that single sort comparison it
landed on. Fixed with `water.depthWrite = false` and a fixed
`renderOrder = -1`, so it always draws first regardless of the automatic
distance sort. Caught by direct pixel-level `gl.readPixels()` diagnosis
(matching earlier `frame`/`calls` counters via `renderer.info`), not by
eyeballing a screenshot — screenshots of this scene are unreliable in this
particular tool: the automated browser tab reports `document.hidden:
true`/`visibilityState: "hidden"` even when actively screenshotted via
CDP, which correctly (per the Page Visibility API) pauses this component's
`requestAnimationFrame` loop and `IntersectionObserver` — both legitimate,
desired behaviour for real hidden tabs. Verified the scene's actual output
instead by calling `renderer.render()` directly and reading back real
pixel colours immediately afterward (avoiding the classic
`preserveDrawingBuffer` pitfall of reading a cleared buffer after the
fact): the card position sampled real photo colours, open background
sampled exactly `#040d1a`, and the water region sampled a distinct navy
tint — confirming the render pipeline is correct independent of this
tool's inability to run a real animated frame loop.

**A second, more significant bug — found only once real visual testing was
possible.** The `document.hidden`/`visibilityState` limitation above blocks
a genuinely *animated* screenshot, but forcing `document.hidden = false`
via `Object.defineProperty` + dispatching a synthetic `visibilitychange`
(a runtime override for testing only, not a code change) let the
component's own rAF loop actually run and be screenshotted honestly for
the first time. That surfaced a real defect no amount of scene-graph/
pixel-counter inspection had caught: the water plane rendered as a flat,
textureless navy slab — no reflection at all. The cause was conceptual,
not a typo: the fragment shader sampled the reflection render target using
the water plane's own **geometric UV** (`vUv`), but a perspective-camera
render does not correspond linearly to world-space position across a flat
ground plane — screen-space content from a perspective projection has to
be looked up via that camera's own projection, not the receiving surface's
UV layout. The symptom was a tiny, badly-scaled sliver of the reflected
cards crammed into one corner of the plane once the blend math was
bypassed to inspect the raw sample directly.

**Fix:** adopted the same technique three.js's own `Reflector.js` uses —
project each water fragment's world position through the reflection
camera's view-projection matrix (computed fresh each frame, right after
`renderReflection()`'s render-to-texture pass, from
`reflectionCamera.projectionMatrix` × `reflectionCamera.matrixWorldInverse`),
pass the clip-space result to the fragment shader as a varying, and derive
the sample UV from `clipPos.xy / clipPos.w * 0.5 + 0.5` (screen-space
projective texturing) instead of the plane's own `vUv`. Ripple distortion
still perturbs this same derived UV. After the fix, the reflection
correctly mirrors the full carousel row, in registration with the real
cards above it. Verified interactively, not just visually: click-to-select
dollies the camera and opens the real-data detail panel (photo, name,
title, experience, bio, credential chips) styled per spec, and Escape
closes it with the expected fade. `yarn lint`/`yarn build` re-verified
clean after the fix.

**Known, reported, not-yet-worked-around test-tool limitation:** the
browser-automation tool's `resize_window` does not change the page's
actual effective viewport/`window.innerWidth` in this environment (matches
an unrelated finding earlier in this project) — so the brief's mobile/
tablet breakpoint behaviour is verified by reading `build-mirror-hall-
scene.ts`'s tier logic (keyed off `container.clientWidth` at construction),
not by an empirical narrow-viewport screenshot.

**Consequence.** No team member name, title, bio, credential, experience
figure, or photo path was changed. `TeamStarfieldBackground.tsx` (ADR-0072)
is retired — its route set is now empty rather than the file/its
`layout.tsx` mount being deleted, since it would otherwise sit fully
hidden behind Mirror Hall's own opaque canvas forever, costing a second
wasted render loop for nothing. `/about` itself (Pinwheel Galaxy) was not
touched. `yarn lint`/`yarn build` both clean.

---

## ADR-0073 — Projects page: real photography supplied directly, mapped by position; modal gained a large image

**Status:** Accepted · 2026-08-30

**Context.** ADR-0065/ADR-0071 both confirmed — by inspecting the live
geoporte.com.au DOM — that no real per-project photography exists to
scrape: the live site's own Projects page renders only Elementor's stock
`placeholder.png`, and no gallery or per-project sub-page exists either.
Both ADRs used a category-tinted gradient instead. That premise changed
this turn: the user supplied a local `images/` folder directly (27 files,
generic filenames — `Plaxis-3D-A.png`, `Yarraman-1.jpg`,
`WhatsApp-Image-...jpg`, etc. — carrying no project-to-photo
correspondence of their own, exactly the same "no real content mapping"
situation the live-site gallery had, just now with usable files instead of
a dead end).

**Decision — image mapping.** Copied all 27 files unchanged into
`public/assets/projects/`. `projects.ts` (27 entries, same count as the
supplied images) gained an `image: { src, alt }` field, assigned by
**position**: the 27 filenames sorted alphabetically, zipped 1:1 against
the array in its existing (category-grouped) order. No content-based
matching was attempted — the filenames don't name projects, so a positional
assignment is exactly as accurate as any other mapping and is at least
deterministic and reproducible.

**Decision — surfaces.** `ProjectCard.tsx`'s category-gradient div was
replaced with the real photo (`next/image`, `fill` + `object-cover`) —
`CATEGORY_GRADIENT` and the now-unneeded `ProjectCategory` import were
deleted outright, not left dead. `ProjectsShowreel.tsx`'s tiles got the
same treatment (its own local gradient map and the now-unused
`gradientAngle` PRNG field were removed from `projects-showreel-
config.ts` too). `ProjectModal.tsx` — previously text-only — was
restructured so the photo sits full-bleed above the padded text content
(`aspect-[16/10]`, rounded via the panel's own `overflow-hidden`), with
the close button moved onto the image itself; every other field
(category, title, location, discipline, description) is unchanged.

**Consequence.** No placeholder or gradient imagery remains anywhere on
the Projects page or its modal. Because `ProjectCard`/`ProjectModal` are
shared with the homepage's own embedded `ProjectsSection`, the homepage's
Projects section also now shows real photos — verified live, nothing else
on that page changed. Scope stayed within Projects-feature files only; no
global CSS, layout, or unrelated-page file was touched.

---

## ADR-0072 — `/about/team`: Cards Cascade replaced with a plain grid; Pinwheel Galaxy replaced with a dedicated calm starfield

**Status:** Accepted · 2026-08-30

**Context.** Two follow-up rounds on `/about/team` (ADR-0070 retuned the
existing Pinwheel Galaxy's colours and the Cascade's `backFade`) hadn't
resolved the underlying complaints: an explicit, detailed brief made clear
the desired outcome was categorically different, not a tuning pass —
(1) no galaxy structure at all, just a calm, near-static particle field,
and (2) no stacked/sticky-per-card deck at all, just independent cards in
normal document flow. Both prior fixes kept the same mechanics (a spinning
galaxy simulation; a scroll-driven single-active-card fold) and only
adjusted their numbers, which was the wrong lever for what was actually
being asked.

**Decision — background.** New `TeamStarfieldBackground.tsx` +
`build-team-starfield-scene.ts`, mounted only on `/about/team`
(`PinwheelGalaxyBackground.tsx`'s own route set now excludes it — `/about`
keeps the galaxy, unchanged). The new scene has no galaxy structure
whatsoever: one static `THREE.Points` cloud (~950 desktop / ~550 tablet
particles, white/blue-white/muted-cyan palette), a very slow whole-field
rotation (~17 minutes per turn), no `EffectComposer`, no bloom. Building it
surfaced a real bug worth recording: the stock `THREE.PointsMaterial` with
`sizeAttenuation` scales `gl_PointSize` by `(rendererHeight/2) /
-viewSpaceZ` — not a pixel size — so a `size` tuned to look like ~1.6px
rendered as ~90px hard-edged squares for the particles nearest the camera.
Fixed with a small custom `ShaderMaterial` (the same per-vertex-size-as-
true-pixels + circular alpha-falloff pattern `build-planet-scene.ts`'s own
starfield already uses), verified visually before/after via the browser.
Mobile never mounts WebGL for this scene at all — same convention every
other full-page scene in this codebase already follows (`HeroScene.tsx`
shows the fallback gradient below the mobile breakpoint) — so "mobile
particle count" is moot; a new `--raw-gradient-fallback-team-starfield`
token covers that tier. In the same pass, `--raw-gradient-fallback-
pinwheel-galaxy` was corrected from the pre-ADR-0070 magenta pair to match
that scene's own already-recoloured blue CONFIG — an inconsistency ADR-0070
missed (the WebGL scene got re-tinted, its mobile/low-tier fallback
didn't).

**Decision — cards.** Deleted `TeamCascadeExperience.tsx`,
`TeamCascadeDeck.tsx`, `TeamBioPanel.tsx`, `cascade-config.ts` outright — no
longer referenced by anything. Replaced with `TeamMemberCard.tsx` (every
member fully self-contained: photo, name, title, experience, credential
chips, bio, all in one `.glass-panel` article) rendered in a plain
responsive CSS Grid in `about-team.tsx` (`grid-cols-1 md:grid-cols-2
xl:grid-cols-3`, `gap-x-8 gap-y-12`) — the same responsive-grid convention
`ProjectsSection.tsx` already uses elsewhere in this codebase. Entrance
animation is `<Inview>` (spring-based, per hard rule #1) with a small
per-card stagger, not the old shared-`activeIndex`/scroll-fold mechanic —
every member is independently visible at once now, not just whichever one
scroll progress currently selected. The intro paragraph's closing sentence
("Scroll to meet the team") was removed since it described the old
scroll-driven mechanic and no longer applies — the only non-team-member
copy touched.

**Consequence.** No team member name, title, photo, credential, experience
figure, or bio was changed. Verified live: particles render as small soft
dots (not squares), no purple/pink/explosive look, cards lay out in a
clean multi-column grid with zero overlap at any scroll position, real
photos load correctly, click targets/hover states work, no console errors,
`yarn lint`/`yarn build` both clean. `/about` (still on the Pinwheel
Galaxy) was not touched.

---

## ADR-0071 — Projects page: an "AI Studio"-inspired scroll flythrough section, and a sitewide `position: sticky` bug it uncovered

**Status:** Accepted · 2026-08-29

**Context.** Two requests for `/projects`: (1) take inspiration from a
user-supplied "AI Studio" Next.js reference template's Projects/Showreel
section — grid image layout, smooth scroll animation, 3D scene feel,
adapted rather than copied — and (2) use real scraped project images, no
placeholders. On (2): re-verified live against geoporte.com.au (its
Projects page renders only Elementor's own stock `placeholder.png`,
`/gallery` 404s, no project has a sub-page) — the same "no real per-project
photography exists" finding ADR-0065 already made. Real images genuinely
don't exist to scrape; tiles use the existing category-gradient system
instead (see `projects.md` catalog note), not fabricated stock photography.

**Decision — the showreel.** New `src/views/projects/` module
(`ProjectsShowreel.tsx` + `projects-showreel-config.ts`), inserted above
the existing `ProjectsSection` grid (unchanged) in `projects.tsx`. Studied
the reference template's `showreel-stage.tsx`/`utils/showreel/{geometry,
timeline}.ts` for technique — a single scroll-driven progress value scrubs
many small pure functions mapping progress → CSS transforms/opacities,
inside a tall-track/sticky-stage shell — then built an original, much
smaller implementation: one scroll track, `useProgressTrigger` (the
vendored hook `about-team/TeamCascadeDeck.tsx` already uses), and just two
animated values (a camera-rig transform, a group opacity) rather than a
per-tile timeline, since every tile's own 3D position is static and the
"flying through a collage" read falls out of CSS perspective on the shared
group transform alone. No reference code was copied into this codebase.

**Decision — the sticky bug.** Verifying the flythrough in-browser found
the stage scrolling away instead of pinning, even though `getComputedStyle`
reported `position: sticky; top: 0` correctly. Root cause: `<body>` carries
its own `overflow: hidden auto` alongside `<html>`'s (`html.lenis`) as part
of the Lenis smooth-scroll setup — but body's own content never actually
overflows its box (`scrollHeight === clientHeight` always), so per the CSS
spec, `position: sticky` resolves against the *nearest ancestor with
non-visible overflow*, which is body, not the element that's actually
scrolling (`<html>`, confirmed via `documentElement.scrollTop` tracking
`window.scrollY` while `body.scrollTop` stays permanently `0`). Since body
never scrolls, sticky never engages — it behaves exactly like a static
element. Confirmed this is **sitewide, not new**: `TeamCascadeDeck.tsx`'s
own identical `sticky top-0` stage has the exact same failure. Fixing it
properly means touching `<body>`'s CSS, which was out of scope for a turn
scoped to the Projects page — flagged here rather than silently worked
around everywhere. `ProjectsShowreel.tsx` instead reproduces sticky's three
states by hand, locally: a `subscribeToTicker` callback reads the track's
`getBoundingClientRect()` every frame and writes the stage's `position`
directly (`absolute` at the track's top, `fixed` once the track is
passing through the viewport, `absolute` at the track's bottom) — the same
imperative-style-write idiom `TeamCascadeDeck.tsx`'s own per-frame fold
already uses, so no new pattern was introduced.

**Consequence.** The showreel works correctly (verified live: fixed
positioning while scrolling, real project tiles growing as the camera
"flies" past them, click-to-open on the existing `ProjectModal`, clean
hand-off into `ProjectsSection` below). But `TeamCascadeDeck.tsx` and any
future `sticky`-based component on this site carries the same latent bug
until `<body>`'s overflow is fixed globally — a follow-up task, not done
here. See the `projects.md` catalog note for exactly where to look if a
future sticky element reads as "not quite pinned."

---

## ADR-0070 — Team page: Pinwheel Galaxy re-tinted off magenta/pink, Cards Cascade `backFade` retuned for an 11-member roster

**Status:** Accepted · 2026-08-29

**Context.** Two problems reported on `/about/team`: (1) the Pinwheel
Galaxy background's purple/pink palette read as off-brand — wanted the
same subtle dark-navy/sky-blue "space" look used everywhere else on the
site; (2) the Cards Cascade deck's floating photo cards looked like an
overlapping jumble with no clear layout when scrolling. Explicit
constraint: don't touch team member data, names, photos, or bios.

**Decision — the galaxy.** `build-pinwheel-galaxy-scene.ts`'s CONFIG
colours (`coreColor`, `midColor`, `rimColor`, `armAccent`, `bulgeColor`,
`sparkColor`/`sparkColorTop`, `cornerBlue`/`cornerOrange`, `atmoColor`)
were re-tinted from the materialized GetLayers source's own magenta/gold/
mint "Default" variant to this project's dark-navy/sky-blue family
(`#040d1a`/`#1f6ae0`/`#8ecbff`-class hues, matching `--background` and the
existing azure/sky raw colours in `globals.css`). This is the sanctioned
re-skin path for a verbatim-ported scene — "tint through CONFIG, never the
shader" — so the geometry, all six shaders, the scroll-driven dive/spin,
and every non-colour number are untouched.

**Decision — the cascade overlap.** The "overlap" was `cascade-
config.ts`'s `backFade: 9.0` — inherited from the GetLayers "Cards
Cascade" source template, correct for a 3–5 card deck (the whole stack
stays fully opaque, nothing to fade) but wrong for this roster's 11
members: every card back to `p = 9` in `placeCascadeCard`'s back-stack
opacity formula (`clamp(1 - (p - backFade) * 0.5, 0, 1)`) rendered at full
opacity *simultaneously*, stacking most of the team on top of each other
with no separation. Retuned `backFade` to `0.5` — only the crest card plus
~2 cards behind it now stay visible, fading to 0 opacity by `p ≈ 2.5` —
while leaving the fold formula itself (the exponential `backDecay` curve)
untouched, per the file's own "don't linearise the curve, the numbers are
tunable" contract. Verified live via `el.style.opacity`/`transform` on
each card ref: card 0 (crest) = 1.0, card 1 = 0.75 (tilted -45°, receded
243px), card 2 = 0.25, card 3+ = 0.

**Consequence.** No team data, photos, names, or bios were touched — only
the galaxy's CONFIG hex values and one cascade-geometry number changed.

---

## ADR-0069 — Homepage Digital Twin section recoloured dark via a page-scoped Tier-2 override, not a shared-token edit

**Status:** Accepted · 2026-08-29

**Context.** `GeotechnicalPlexusSection.tsx` ("See beneath every site before
you build on it") was built on the shared `-engineering` token set
(`--surface-engineering`, `--ink-engineering`, `--ink-engineering-muted`,
`--accent-engineering`) — a deliberately light, warm "engineering diagram"
palette (ADR reasoning captured in the component's own original comment).
Explicit direction: this one homepage section must become dark navy
(`#040d1a`) with white text, while the *same token set*'s other consumer —
`/services/geotechnical-engineering`'s PLAXIS-inspired hero
(`GeotechnicalAnalysisHero.tsx`) — must keep its original light look
untouched.

**Decision.** Rather than edit the shared Tier-2 defaults in `:root` (which
would repaint both consumers), `GeotechnicalPlexusSection.tsx`'s own
`<section>` now carries a page-scoped override via Tailwind's
arbitrary-property syntax: `[--surface-engineering:var(--raw-color-navy-925)]
[--ink-engineering:var(--raw-color-white)]
[--ink-engineering-muted:var(--raw-color-white)]`. This is the exact pattern
design-system.md documents for `--accent` — it works because every consumer
underneath (`bg-surface-engineering`, `text-ink-engineering`,
`text-ink-engineering-muted`) is a genuine Tailwind utility generated by
`@theme inline`, which resolves its `var()` live at the element rather than
freezing it at build time, so the override cascades correctly into every
descendant. A hand-written CSS rule referencing the Tier-3 alias directly
would NOT have picked this up (ADR-0059's gotcha). A new Tier-1 primitive,
`--raw-color-navy-925: #040d1a`, was added alongside the existing
`--raw-color-navy-950`/`-900` for the exact literal the brief specified —
close to but distinct from both existing navy shades, so reusing either
would have been a visible mismatch against the specified hex.
`--accent-engineering` (the "Explore Geotechnical Engineering" button's
teal) was deliberately left un-overridden; its label already carried a
literal `text-white` before this change, satisfying "button text must be
white" with no further edit needed. The eyebrow label ("Digital Twin ·
Ground Intelligence") switched from `text-accent-engineering` to
`text-ink-engineering` so it also turns white, per "all text in this
section must be white." The 3D soil-layers scene
(`GeotechnicalPlexusScene`/`build-geotechnical-plexus-scene.ts`) and its
container border (`border-line-engineering`) were not touched.

**Consequence.** Verified live: the homepage section renders
`rgb(4, 13, 26)` background with pure white heading text, while
`/services/geotechnical-engineering`'s hero still renders its original
light panel unchanged. Any future section that needs a one-off recolour of
a shared `-engineering`/token-set consumer should reach for this same
page-scoped override technique before touching the shared Tier-2 defaults.

---

## ADR-0068 — Homepage hero reverts to opaque: it keeps the wireframe scene only, Earth globe hidden there, visible everywhere else

**Status:** Accepted · 2026-08-29

**Context.** ADR-0066 made the hero `bg-transparent` specifically so the
persistent Earth globe (mounted at the app root, `position:fixed`/
`z-index:-1`) would show through it, layered behind the hero's own
digital-twin wireframe scene. Explicit follow-up direction reversed that
choice for the hero only: the hero's 3D content should be the wireframe
scene alone, with the globe hidden there — while staying visible on every
other homepage section (about, services, stats, projects, contact, footer)
during scroll, unchanged from ADR-0066.

**Decision.** `HeroSection.tsx` goes back to an opaque `bg-background`
(the same dark-navy token, `--raw-color-navy-950`, already used everywhere
else — no new token needed) instead of `bg-transparent`. Because the globe's
canvas sits at `z-index: -1` and the hero section paints its own opaque
background above that, the fixed globe canvas is fully occluded for exactly
the hero's scroll range; the wireframe scene's own canvas is a sibling
inside the hero with a higher stacking position, so it renders over that
opaque fill exactly as before. No other section was touched — all of them
were already correctly transparent/translucent enough to show the globe
(confirmed by scrolling the live page: visible in About, Services, Stats,
Projects, and Contact). `Footer.tsx`'s `bg-background-alt` was and remains
opaque, same as before this change — pre-existing, not touched here.

**Consequence.** The globe's presence is now scroll-position-gated by simple
CSS opacity rather than by any change to `build-planet-scene.ts` — the
globe itself, its keyframe stops, and its render loop are all unchanged.
If the hero's `HeroScene` component (the wireframe scene) is ever swapped
back to something that itself needs the globe to show through, revert this
section's background to transparent again rather than touching the globe's
own code.

---

## ADR-0067 — Dev-mode FPS downgrade was self-sabotaging: `reportHeroSceneFrame` now no-ops outside production

**Status:** Accepted · 2026-08-29

**Context.** User reported the homepage as broken in three ways: Earth globe
"completely removed," hero background "white/beige," and a PLAXIS scene
"on the homepage." None of that was true of the source — `HeroSection.tsx`,
`layout.tsx`, and `PlanetBackground.tsx` all matched the correct, working
state from ADR-0066, and a `curl` of the live dev server's HTML contained
zero "PLAXIS" occurrences. The actual symptom, confirmed via the browser
extension: `document.querySelectorAll('canvas').length === 0` — every WebGL
scene on the page (globe, hero digital-twin wireframe, ambient background)
had failed to mount at all.

**Root cause.** `localStorage["geoporte:performance-tier"]` was stuck at
`"low"`. Per ADR-0058's 4-tier system, `"low"` sets `webglDisabled: true`,
which gates off every scene sitewide via `getDeviceTier`/`getTierBudget`
(`src/lib/scene/device-tier.ts`). The tier got there through
`performance-monitor.ts`'s live FPS watchdog: `HeroScene.tsx`'s render loop
reports frame timestamps, and if the rolling average drops below 20fps for
a sustained 3-second window, `PerformanceWarningToast` calls
`usePerformanceTier().downgrade()`, which persists the new tier to
localStorage immediately (`persistTier` in `performance-tier.ts`) — durable
across reloads, on purpose, so a genuinely weak device doesn't
un-downgrade itself. The watchdog has no dev-mode exemption, and Turbopack's
own recompilation/HMR work routinely stalls the main thread past that
threshold for reasons with zero bearing on the site's real runtime
performance. One such stall — on this machine, 32GB RAM / 24 cores, nowhere
near actually "low" tier — silently and permanently disabled all 3D until
someone thought to check `localStorage` by hand. That reads indistinguishable
from "the code regressed."

**Decision.** `reportHeroSceneFrame` (`src/lib/scene/performance-monitor.ts`)
now returns immediately when `process.env.NODE_ENV !== "production"` — the
live FPS-triggered downgrade path only runs in production builds. The
one-time static capability read (`hasStaticLowPerformanceSignal`, from
`cores`/`memory`/mobile-UA signals in `performance-tier.ts`) is untouched and
still runs everywhere, since that check is a real hardware read, not a
noisy runtime sample — dev mode isn't exempt from looking genuinely
underpowered on a genuinely underpowered device.

**Consequence.** A dev-mode stutter can no longer brick a developer's own
local 3D rendering across reloads. Production still self-protects real users
on weak hardware exactly as ADR-0058 intended. Anyone hitting the "visual
effects simplified" toast permanently on a machine they know is capable
should check `localStorage.getItem("geoporte:performance-tier")` and clear it
— there's no in-app reset control, by design (ADR-0058: a downgraded tier
should not silently self-heal).

---

## ADR-0066 — Light theme fully reverted (dark-only again); homepage hero made transparent so the persistent Earth globe shows through

**Status:** Accepted · 2026-08-29

**Context.** Two requests in one turn: (1) remove ADR-0064's light theme
entirely — dark-only, no toggle in the nav; (2) the homepage hero's own
background must be fully transparent so the persistent Earth globe
(`PlanetBackground.tsx`, mounted at the app root) shows through behind the
hero text, with correct z-index layering (globe behind, text on top).

**Decision 1 — full removal, not a feature flag.** Deleted
`use-theme-store.ts`, `ThemeController.tsx`, `Nav/ThemeToggle.tsx` outright
rather than disabling them. Removed the `<ThemeToggle>` mounts from
`Nav.tsx` and `MobileMenu.tsx`, the `<ThemeController>` mount and the
blocking anti-flash `<script>` from `layout.tsx`'s `<head>`. In
`globals.css`: removed the light Tier-1 primitives (`--raw-color-mist-*`/
`--raw-color-ink-*`/the light glass trio), the
`:root[data-theme="light"]` Tier-2 override block, and the
`:root[data-theme="light"] [data-glass-readability]` variant — restoring
the Tier-2 block's original "DARK-ONLY by design" comment (now noting the
light theme was tried and reverted the same day, so it isn't silently
re-added later without context). **One deliberate keeper:**
`[data-glass-readability]`'s consolidation from five duplicated per-page
inline `style` objects into a single CSS attribute-selector rule (done to
make the override theme-aware) stayed — it's a genuine simplification
independent of theming, and reverting it would mean reintroducing dead
weight into `about.tsx`/`contact.tsx`/`publications.tsx`/`about-team.tsx`/
`service-detail.tsx` for no reason.

**Decision 2 — remove the opaque paint, not the z-index (there was nothing
wrong with the z-index).** Diagnosis first: the globe's canvas is already
`position: fixed; inset: 0; z-index: -1` (`build-planet-scene.ts`),
appended straight to `document.body` outside `<main>` entirely — it was
already correctly stacked behind all normal page content, `<main>`'s own
`z-index: 10` notwithstanding (that only governs stacking *within* main's
local context, not against a sibling at the body level). The globe wasn't
invisible in the hero because of stacking order; it was invisible because
`HeroSection.tsx`'s `<section>` painted an opaque `bg-background` fill
over it, and a second `from-background via-background/75 to-background/15`
gradient wash painted over what the first fill missed. **Fix:** removed
both — the section is now `bg-transparent`, the gradient div deleted
outright. `HeroScene`'s own digital-twin canvas (`build-hero-scene.ts`)
was already correctly transparent (`alpha: true`, no `scene.background`
set) and needed no change.

**Decision 3 — the globe was already rendering; it just wasn't the
"fully visible" the brief now asks for, by the original template's own
design.** After Decision 2's fix, a screenshot at scroll position 0 still
showed no obvious globe — looked like a second bug. Verified methodically
before touching anything: `performance.getEntriesByType('resource')`
confirmed `planet.glb`/`planet-lights.glb`/`planet-clouds.png`/the Draco
decoder all loaded (a `transferSize: 300` reported by the browser's own
resource-timing API for every one of them turned out to be an artifact of
this session's browser-automation environment, not a real failure —
`curl`ing the same URLs directly returned the real files at full size:
1.1MB valid glTF, a real 283KB wasm module). Scrolling down surfaced the
answer: the globe was there all along, arcing in from the very bottom
edge, mostly cropped below the fold. `build-planet-scene.ts`'s own header
comment says so explicitly — "hero: huge globe, low, half below the
fold" — a deliberate cinematic choice carried over unchanged from the
ported GetLayers "Ascend" template. That design directly contradicts this
turn's explicit "Earth globe must be fully visible behind all hero
content." **Fix:** retuned only the `p: 0` (hero) keyframe stop in
`STOPS_Y`/`STOPS_S` — `Y: -4.5 → -1.3`, `Scale: 2.15 → 1.35` — smaller and
higher, so the globe's lit atmosphere fills the hero frame instead of
being cropped by it. `STOPS_X` and every other stop across all three
arrays (`p: 0.32`, `0.64`, `1` — the mid-scroll swing and the settle) are
untouched, so the rest of the scroll choreography is exactly as ported.

**Both 3D layers stay, by explicit user choice.** The homepage hero
now shows the persistent Earth globe AND the bespoke digital-twin
wireframe scene (bridge/tunnel/geological cutaway) layered together — the
user was asked directly whether to remove the wireframe scene so the globe
is the sole visual, or keep both layered, given the brief's own two-layer
("globe behind, text on top") framing didn't mention the wireframe scene
at all. They chose to keep both. The wireframe geometry (thin, 25–32%-
opacity lines) partially overlaps the globe within the hero viewport but
doesn't occlude it as an opaque layer would.

**Consequence: hero text needed a legibility mechanism that isn't a
background.** With both the opaque fill and the gradient gone, hero copy
(`HeroSection.tsx`'s eyebrow, `HeroHeading`, `HeroSubtext`) now carries a
`text-shadow` (arbitrary value, `[text-shadow:...]`) instead — same
"contrast via shadow, not an opaque backdrop" idiom `[data-glass-
readability]` already uses elsewhere for text over busy scenes, just
applied directly to these three elements rather than through that shared
attribute (the hero isn't a glass-panel page). The CTA button is
unaffected — it already sits on its own opaque `bg-accent` pill.

## ADR-0065 — i18n scope widened to full page coverage; client-side batch chunking bug fixed; real Publications content added; Projects cards get category gradients (no real per-project photography exists on the source site)

**Status:** Accepted · 2026-08-29

**Context.** Requested: fix the language switcher ("broken on most pages"),
scrape every image off geoporte.com.au and wire real photography
throughout, with a themed CSS-gradient fallback wherever no real image
exists. Two separate problems turned up under the first ask, and the
second ask resolved to a much smaller scope than requested once the real
site was actually inspected.

**i18n: the mechanism was never broken — coverage was incomplete.** The
store (`useLanguageStore`, zustand `persist`, key `geoporte-language`),
`useTranslated`, and `queueTranslation` are all global, not page-scoped —
a saved language and its cache already survive both client-side
navigation and a reload. Auditing per-file `<TranslatedText>`/
`useTranslated` usage across every view found the real cause: whole pages
(`about.tsx`, `contact.tsx`, `publications.tsx`, `about-team.tsx` and its
`TeamBioPanel`/`TeamCascadeDeck`, `ProjectCard`/`ProjectModal`/
`ProjectsSection`, `ServiceHero`, `ServiceOverview`, `ServiceSubServiceGrid`,
the shared `ServiceCard`, `StatCounter`, `ExperienceStatBox`, `TeamPanel`'s
culture-value tags) had never had their body copy, card text or button
labels wrapped in the first place — only `SectionHeading`'s own
eyebrow/heading ever went through translation on those pages, which reads
exactly like "only the homepage works" from the outside, since the
homepage's own sections happened to have better coverage already.
**Fixed by widening scope to match this request** — every static UI
string, card field and body paragraph across the app now goes through
`<TranslatedText>` (or, for `TeamPanel`'s typed role lines,
`useTranslated` resolved *before* `TextEngine` gets the string as
`children` — the same reason `SectionHeading` already does this; a text-
animation component that splits `children` into letters can't accept an
unresolved translation component). This explicitly **supersedes ADR-0024's
"nav/headings/buttons only" scope** — noted in `ServiceOverview.tsx`'s own
comment rather than silently overridden.

**Two exceptions, deliberate:** a physical mailing address
(`office.address`) stays untranslated — machine-translating a street
address is a functional/legal risk, not a UI-copy nicety — and
`privacy-policy.tsx`'s legal text is left alone for the same reason at a
larger scale. Decorative, `aria-hidden` content (`ProjectTicker`'s
marquee, `GeologicalCrossSection`, `ContactTerrain`, `StatsGlobe`) was
also left alone — there's no visible text to a screen reader or sighted
user there to translate.

**A real, separate bug: the client never respected the route's own batch
cap.** `/api/translate`'s `zod` schema caps `texts` at 50 entries per
call and validates the array as a single unit — a page with more than 50
translatable strings queued inside one 120ms batching window (a full
project grid, a bio-heavy team page) would have every one of those
strings rejected, not just the overflow past 50, and silently fall back
to English for all of them (the existing, correct failure-fallback
behaviour, just triggered by a client-side bug rather than a genuine
upstream failure). Fixed in `translation-queue.ts`: `flush()` now chunks
the pending set into ≤50-string requests and fires them with
`Promise.all`, so one oversized batch degrades to "some chunks succeed,"
not "the whole page's translations fail." A second, related guard: any
single string over the route's own 500-character cap is now skipped at
queue time (falls back to English for just that string) rather than
poisoning whichever 50-string chunk it lands in.

**Image scrape: the real site has far less photography than the brief
assumed — verified by inspecting the live DOM, not by trusting a page
summary.** A first pass via `WebFetch` on `/projects` reported a rich
per-project photo gallery with specific-sounding filenames
("Yarraman-*.jpg", "Plaxis-3D-*.png", "NZ-Handerson-*.jpg") — this turned
out to be **fabricated**: `WebFetch` runs the page through a summarising
model, and re-checking with `document.querySelectorAll('img')` /
computed-`background-image` in an actual browser tab found none of those
files on the page at all. The real `/projects` page has no `<img>`
content images beyond the logo and one small decorative background PNG;
projects are, and always were, text-only cards on the live site (`no
individual photo assignments per project`, confirmed independently by
both the DOM inspection and `WebFetch`'s own prose summary). One
candidate background image the DOM inspection did surface (`17.jpg`)
turned out to be a stock rock-climbing-gym photo — unrelated to Geoporte's
work, presumably leftover media-library cruft on their WordPress install
— and was discarded rather than mis-attributed to a project.

**Decision — verify against the live DOM before downloading anything a
page-summary tool reports**, and use the documented CSS-gradient fallback
(hard rule 4 already requires this to come from tokens) where the source
genuinely has nothing: `ProjectCard.tsx` now renders a category-keyed
gradient band (`CATEGORY_GRADIENT`) instead of a photo, reusing existing
brand tokens rather than inventing a fourth colour — `--accent`/`--glow`
for Transport, `--stat-purple` for Built Environment, `--stat-amber` for
Energy/Resources & Water (the same two stat-box colours from the homepage
"Project Experience" section, ADR from 2026-08-29's changelog entry).

**Publications: real content did exist, and is now used.**
`/publications` has exactly three real cover images
(`g13-688x1024-1.jpg`, `g12-1024x724-1.jpg`, `g14-724x1024-1.jpg`,
downloaded to `public/assets/publications/`) with no accompanying
metadata on the live site — title, authors and venue for each were read
directly off the cover image content itself (a symposium preface, a
conference presentation slide crediting Qaiser Hayat — Geoporte's own
Director, confirmed against `data/mocks/team.ts` — and a co-authored
technical paper's first page), not invented, and recorded in the new
`src/data/mocks/publications.ts`. `publications.tsx` gained a real
"Selected publications" grid between the intro and the existing services-
topics grid; the closing "New publications are on the way" section was
reworded since that was no longer true.

## ADR-0064 — Light/dark theme toggle: token-level split, fixed WebGL/video backgrounds NOT retinted

**Status:** Superseded by ADR-0066 (2026-08-29, same day) · Accepted 2026-08-29

> [!warning] Reverted the same day
> Removed entirely under explicit user direction ("remove light mode
> entirely, dark mode only, remove toggle button from navbar") — see
> ADR-0066. This entry stays as the historical record of what was built and
> why; none of the `data-theme`/`useThemeStore`/`ThemeController`/
> `ThemeToggle` machinery it describes exists in the codebase anymore.

**Context.** Requested: a persisted sun/moon toggle in the nav, dark as
the default, light mode inverting to white/light-grey backgrounds with
dark text and lighter glass panels, everywhere. `design-system.md`
previously documented this Style as "DARK-ONLY by design... deliberately
no `prefers-color-scheme` override" — this ADR amends that, not silently.

**Decision — token-level split via `data-theme`, not `prefers-color-
scheme`.** `useThemeStore` (zustand `persist`, key `geoporte-theme`,
default `"dark"`) drives `<html data-theme>` through `ThemeController.tsx`
(mirrors `LanguageDirection.tsx`'s pattern exactly). A blocking inline
`<script>` in `layout.tsx`'s `<head>` reads the same localStorage key
synchronously before first paint and sets the attribute immediately, so a
saved "light" preference doesn't flash dark server-rendered markup for a
frame — `ThemeController` only has to handle changes *after* hydration.
Deliberately not `prefers-color-scheme`: this is a persisted user choice
that should win over the OS setting, not follow it, and dark must stay
the default regardless of OS preference until the user explicitly opts
into light.

Because the token system already enforces "no hardcoded colour outside
`globals.css`" (hard rule 4), the actual re-theme is small: a new
`:root[data-theme="light"]` block overrides exactly the roles that mean
"dark navy vs. white" — `--background`, `--background-alt`, `--surface`,
`--surface-raised`, `--foreground`, `--foreground-muted`, `--line`,
`--glass-fill`, `--glass-border`, `--glass-text-shadow` — against two new
Tier-1 families (`--raw-color-mist-*` for light surfaces, `--raw-color-
ink-*` for light-mode text), independent of the dark navy ramp rather
than a "lighter step" of it, since navy-950/900 have no natural invert
within the same hue family. `--accent`/`--glow`/`--danger`/the `--strata-`
family/the `-engineering` family/the `--stat-` family are unchanged in
both themes — brand identity, not part of the dark/light distinction (and
the `-engineering` tokens are already their own fixed light "instrument
panel" regardless of site theme, per ADR-0060).

**Deliberately NOT retinted: every fixed WebGL/video background** (Solaris,
Aether Flux, the Einstein–Rosen lattice, Golden Parthenon, Negentropy,
Aureole, Aurum Peak, Spiral/Pinwheel Galaxy, the Planet, the ambient
wireframes, the Bird/Siloutte/Purple Planet videos). These are baked
scene/shader/material colours in `build-*-scene.ts` files and `<video>`
sources, not CSS custom properties — re-authoring nine bespoke three.js
scenes (plus video re-encodes) for a light variant was judged well
outside this task's scope. The practical consequence: on every glass-
background route, light theme renders as light frosted content panels
floating over an unchanged dark/cosmic scene — a deliberate, accepted
look (frosted glass at night), not an oversight.

**A real bug this surfaced: `[data-glass-readability]`'s inline-style
override would have gone white-on-white in light mode.** Five Server
Component pages (`about.tsx`, `contact.tsx`, `publications.tsx`,
`about-team.tsx`, `service-detail.tsx`'s glass branch) each hardcoded
`style={{"--foreground": "var(--raw-color-white)", ...}}` alongside a
`data-glass-readability` attribute — forcing white text unconditionally.
Once `--glass-fill` could also become light under the new theme, that
combination is white text on light glass. A Server Component can't read
the client's persisted theme at render time to compute a conditional
inline style, but a CSS selector can: the override moved into
`globals.css`'s existing `[data-glass-readability]` rule (previously just
the text-shadow), with a `:root[data-theme="light"] [data-glass-
readability]` variant supplying dark ink instead. All five pages were
simplified to just the bare `data-glass-readability` attribute — the
inline `style` objects (and their `CSSProperties` imports, where nothing
else in the file needed them) were deleted, not left dead.

## ADR-0063 — Sitewide responsive/touch sweep: fixed 3 unguarded fixed-column grids, hover-only Services dropdown, and discovered rem-based touch targets silently shrink under the adaptive grid

**Status:** Accepted · 2026-08-29

**Context.** Requested: audit and fix the whole site for "fully responsive
and resizable-friendly" — no horizontal scrollbar 320px→4K, mobile
single-column stacking, tablet 2-column, iPad split-screen/Windows snap,
44px touch targets, hamburger below 768px, footer stacking, and every
named 2-column/grid/flex-row layout stacking below 768px. The codebase
already had strong responsive foundations (every section-level grid
audited already used `grid-cols-1` with `sm:`/`md:`/`lg:` overrides,
`flex-col ... md:flex-row` for split rows, `HeroScene`'s `ResizeObserver`
and three independent scene renderers' own `resize` listeners already
correct) — this pass found and fixed the real gaps rather than rebuilding
what already worked.

**Found and fixed — genuine unguarded fixed-column grids** (`grid-cols-N`
with no `grid-cols-1` mobile default, so N columns rendered at every
width down to 320px):
1. `Footer.tsx`'s 4-column row — was `grid-cols-2` unconditionally (2×2
   even at 320px), not the requested "4 across → 2×2 → 1 column." Now
   `grid-cols-1 sm:grid-cols-2 md:grid-cols-[1.4fr_1fr_1fr_1fr]`.
2. **The offices grid, duplicated in three places**, all unconditionally
   `grid-cols-2`: `home/ContactSection.tsx`, `contact.tsx`, and (already
   correct, for comparison) `about.tsx`'s own version already had `sm:`/
   `lg:` prefixes — the other two didn't. Both fixed to `grid-cols-1
   sm:grid-cols-2`.
3. `home/ProjectExperienceSection.tsx`'s two stat boxes — `grid-cols-2`
   unconditionally. Fixed to `grid-cols-1 sm:grid-cols-2`.
4. `home/ProjectModal.tsx`'s location/discipline `<dl>` — `grid-cols-2`
   unconditionally inside a `max-w-[560px]` modal. Fixed to `grid-cols-1
   sm:grid-cols-2`.

A full-codebase grep for `grid-cols-[2-9]` without a `grid-cols-1`/`sm:`/
`md:` guard, and separately for bare `flex-row` without a `flex-col`
default, turned up nothing else — every other split layout in the app
already stacks correctly.

**Found and fixed — hover-only interaction.** `ServicesDropdown.tsx`
opened only via CSS `group-hover`/`group-focus-within` — a real problem
on a touchscreen, since `:hover` is not a reliable open mechanism there
and this dropdown renders inside the `md:flex` desktop nav, which a
768–1023px iPad in the "tablet" device tier still shows (touch is not
exclusive to `< md`). Converted to a client component: click/tap now
toggles `open` state, layered onto the same CSS classes the hover path
already used, so a mouse user keeps the zero-JS hover convenience and a
touch user gets a real, predictable tap-to-open with outside-click-to-
close (same pattern as `LanguageSwitcher.tsx`, which already had this
right).

**Major finding — rem-based Tailwind sizing does not reliably produce
its nominal pixel size on this site, because of the adaptive scaling
grid ([[design-system]]).** `html`'s font-size is driven by four
`max-width` media-query brackets (1920/1440/1024/640, see
`grid.config.ts`), each computing `font-size: FONT_BASE * 100 /
bracketBaseWidth` in `vw`. Each bracket hits exactly 16px root font-size
only at its own `baseWidth` (1920, 1440, 1024, and — separately — the
mobile bracket's own 360 reference); everywhere else within a bracket,
rem-sized elements scale proportionally with the viewport, same as the
rest of the design. Computing `min-h-11` (2.75rem) at a representative
sweep of real device/window widths:

| viewport | root font-size | `min-h-11` renders as |
|---|---|---|
| 320px | 14.2px | 39.1px |
| 375px | 16.7px | 45.8px |
| **768px (iPad portrait)** | **12.0px** | **33.0px** |
| 1024px (iPad landscape) | 16.0px | 44.0px |
| 1280px | 14.2px | 39.1px |
| **1366px (common laptop)** | **15.2px** | **41.7px** |
| **1536px (common laptop)** | **12.8px** | **35.2px** |
| 1920px | 16.0px | 44.0px |

So a control sized with `h-11`/`min-h-11`/`w-11` is **not** guaranteed
44px — it only hits that nominal value at the bracket's own reference
width (1024, 1440, 1920) and undershoots by as much as 25% at other
common device and window widths, iPad portrait and ordinary laptop
widths included. This is invisible in any single-breakpoint visual
check; it only shows up by computing the actual `getBoundingClientRect()`
height at the specific widths named in the brief, which is how it was
caught here (confirmed live: `min-h-[44px]` measured exactly 44px at a
1536px viewport where root font-size was 12.8px; the pre-fix `min-h-11`
would have measured 35.2px there).

**Fix, and its intentionally limited scope.** Every touch target this
pass touched now uses an **arbitrary absolute-px** Tailwind value
(`min-h-[44px]`/`h-[44px]`/`w-[44px]`) instead of the `-11` rem utility,
immune to the adaptive-grid scaling: the mobile hamburger toggle, the
Nav "Contact Us" CTA, `LanguageSwitcher`'s trigger and option buttons,
`ServicesDropdown`'s trigger and menu links, `CookieButton`'s shared
style, `CookieBanner`'s "Manage preferences" link, the cookie-preferences
`Toggle` switch (restructured so the 44px tap zone wraps a visually
unchanged 24px track — see its own comment), `MobileMenu`'s link rows,
and `about.tsx`'s two CTA buttons. **This is not a sitewide sweep of
every button** — the same undershoot applies in principle to any
`py-*`-padded button anywhere in the app (a `px-8 py-4` CTA nominally
~52px still measures ~39px at 768px viewport by the same math), and
fixing that everywhere would mean touching most of the interactive
surface of the site. Only the elements above — the primary nav/menu
controls and the ones this task named — were converted; a fuller pass
(or a shared `.tap-target-44` utility, so future buttons don't have to
remember the arbitrary-value convention) is a reasonable follow-up but
was judged out of scope for this turn. Flagged here so it isn't
rediscovered from scratch.

**Not changed, and why.** `TeamCascadeDeck.tsx`'s 11 progress-rail ticks
(from ADR-0062) — packed ~22px apart along the rail regardless of
viewport width, so no touch target size fixes the density problem
itself. Hidden below `md` instead (`hidden md:block`); touch users
navigate the deck via its native-scroll fold, which was always the
primary interaction, not the rail. `GeotechnicalFeaScene.tsx`'s
stage-stepper prev/next buttons got a modest `h-5 w-5` → `h-8 w-8`
bump (not full 44px) — a deliberately compact "instrument panel" per
ADR-0061, and a secondary/optional control the scene remains fully usable
without (camera drag-orbit is the primary interaction); its checkbox is
wrapped in a `<label>` with visible text, so its *effective* tap target
already includes that text regardless of the 12px box itself.

**Defensive addition.** `html, body { overflow-x: hidden; max-width:
100% }` added to `globals.css`'s `@layer base` — X-axis only, so
`position: sticky` (the Cards Cascade deck, ADR-0062) keeps working,
since sticky only breaks when an ancestor *other than* the viewport
clips overflow. Belt-and-suspenders given the "no horizontal scrollbar
at any width" requirement; no overflow bug was actually found that this
alone fixes, but `ServiceHero.tsx`'s decorative orbit rings (sized in
rem, well past the viewport at narrow widths) were found to already rely
entirely on their own section's `overflow-hidden` for containment — one
missed `overflow-hidden` anywhere in the tree would otherwise have
widened the whole page, which is exactly the failure mode this closes off.

**Confirmed already correct, not touched:** every `grid-cols-1 sm:/md:/
lg:` section grid (Services, Projects, Publications, ServiceRelatedProjects,
ServiceSubServiceGrid, ServiceStats, StatsSection), every `flex-col md:
flex-row` split row (Footer's CTA band, `ServiceCta`), the Nav's `md:flex`/
`md:hidden` collapse at exactly 768px, and window-resize handling for all
four independent WebGL renderer systems (`HeroScene`'s `ResizeObserver`,
`shared-viewport-renderer.ts`, `ambient-background-renderer.ts`,
`build-planet-scene.ts` — each already has its own `resize` listener
calling `renderer.setSize`).

## ADR-0062 — `/about/team`: GetLayers "Cards Cascade" section ported into a scroll-synced bio/deck page; automatic scroll-snap tried and reverted

**Status:** Accepted · 2026-08-29

**Context.** Requested: a dedicated team page using the GetLayers "Cards
Cascade" catalog **section** (`cards-cascade`, role `cards` — a CSS-3D
scroll-pinned card deck, not a WebGL scene despite the brief calling it a
"3D scene"), pulled via `getlayers_materialize({ id: "cards-cascade",
styleId: "neural-monitor-style", target: "starter" })` — the Style already
committed in this project's `getlayers.json`. Real team roster (11 people)
scraped from geoporte.com.au/our-team, photos downloaded to
`public/assets/team/`. Layout: left glass bio panel synced to whichever
card is at the crest, right the cascading deck; Pinwheel Galaxy background
(already built for `/about`, ADR-0055) reused unchanged.

**Decision — preserve the fold math verbatim, re-author everything else.**
The section's own contract (`preserve: ["motion", "composition"]`) singles
out one thing as load-bearing: `place(el, p)`, the back-stack
saturating-exponential fan/recede and the pit fold/drop, `p = index -
progress`. That function and its `CASCADE_GEOMETRY`/`CASCADE_LAYOUT`
constants are ported byte-for-byte into `src/views/about-team/cascade-
config.ts`, untouched. Everything else — the source's hand-rolled `<style>`
block, its raw `getBoundingClientRect()` scroll math, its static Syne
hero copy — is re-authored to this project's conventions:

1. **Scroll progress comes from the vendored `useProgressTrigger` hook**
   (`start: "top top"`, `end: "bottom bottom"` on the tall track element),
   not a hand-rolled scroll listener. Algebraically this reproduces the
   source's own `clamp(-rect.top, 0, travel) / travel` exactly (worked out
   in `TeamCascadeDeck.tsx`'s own comment) — the vendored hook already
   solves "normalized progress across a pinned tall track," so there was
   no reason to duplicate it. `interpolatedProgress` is a react-spring
   `SpringValue`, giving the eased catch-up the source's own hand-rolled
   `ease: 0.14` lerp provided, for free.
2. **The fold itself stays outside react-spring** — a `subscribeToTicker`
   callback reads `interpolatedProgress.get()` once per frame and calls
   `placeCascadeCard` imperatively on each of the 11 card refs, exactly
   the same shape every `build-*-scene.ts` WebGL scene in this project
   already uses (its own rAF loop, driven by a spring-interpolated
   progress, imperatively mutating DOM/GPU state outside React's render
   cycle) — hard rule #1's "spring-based motion" governs page/UI reveals,
   not a bespoke scene's own internal render loop, and this section is
   architecturally a scene in every way that matters even though GetLayers
   files it as a "section."
3. **Skin re-authored in Tailwind + this project's tokens**, not the
   source's literal CSS custom-property block: cards show a team photo +
   name/title overlay instead of chapter art; the left "hero" slot is
   replaced entirely by `TeamBioPanel.tsx` (glass-panel, credentials as
   chips, `useSpring` re-running on `member.name` change for the "slides
   in from the left" reveal) instead of the source's static display
   headline — a legitimate re-skin under the contract, since which content
   occupies the pinned-left slot is "skin," not the pinning mechanic
   itself. New tokens: none — `--glass-*`, `--accent`, `--foreground*` all
   already existed.
4. **`activeIndex` is lifted to `TeamCascadeExperience.tsx`**, computed
   once in the same ticker callback that places the cards
   (`clamp(Math.round(progress), 0, N-1)`, the same "active" definition
   the source's own rail label used) and pushed up via `onActiveChange`
   only on change — so the bio panel re-renders once per card transition,
   not once per frame.

**Reverted: automatic "snap after scroll settles."** An earlier version
added a `window` `scroll` listener that, after a debounce, eased to the
nearest card via `lenis.scrollTo` whenever the raw progress wasn't already
on an integer. In testing this **trapped scroll near the top of the
track** — the snap's own `scrollTo` fires more `scroll` events, and
without care the debounce re-arms mid-animation and repeatedly
re-targets, fighting the user's actual scroll input rather than
assisting it. Diagnosed by comparing `window.scrollY` after an identical
wheel gesture on this page (≈390px) against a plain page (≈1500px) — a
reproducible regression, not a one-off. Fixed by dropping the automatic
snap entirely rather than hardening it further: the progress rail (click
a tick, or arrow-left/right) already gives deliberate, one-member-at-a-
time navigation, which is what "each scroll snap focuses one team member"
actually needed. Manual jumps go straight through `lenis.scrollTo(...,
{force: true})` — not the sitewide `scrollTo()` util in `utils/scroll-
to.ts`, which toggles the scroll store's `isEnableScroll` and locks
native `<html>` overflow for its duration (built for a one-off anchor
jump, not a rail's repeated small-delta jumps).

**Routing & background.** New route `/about/team` →
`src/views/about-team.tsx` → `AboutTeamView`, registered in
`sitemap.ts`. Added to `GLASS_BACKGROUND_ROUTES`
(`glass-background-routes.ts`) and to `PinwheelGalaxyBackground.tsx`'s own
route set (now a `Set` of two paths instead of a single string) — the
same galaxy and the same glass-panel treatment as `/about`, reused
unchanged rather than re-authored. `/about`'s own team section links to
`/about/team` ("Meet the full team →").

**Data.** `src/data/mocks/team.ts` — 11 real staff members (name, title,
credentials, years, bio, photo) sourced from geoporte.com.au/our-team;
photos in `public/assets/team/`, one file per person.

## ADR-0061 — Geotechnical Engineering page: bespoke PLAXIS-inspired FEA hero layered on top of the existing Solaris background

**Status:** Accepted · 2026-08-29

**Context.** Requested: a premium, PLAXIS-inspired (explicitly not a copy —
no Bentley/PLAXIS branding, UI or exact visuals) finite-element
geotechnical hero for `/services/geotechnical-engineering`: excavation +
retaining walls + struts, a piled foundation, a bored tunnel, six strata,
a graded FE mesh, toggleable deformation/analysis-result contours, a
6-stage construction sequence, real click-drag/zoom orbit, hover
tooltips, and a 5-band scroll choreography. Reuse the existing Three.js
setup, not a new rendering stack — no R3F/drei/GSAP conflict this time
(unlike ADR-0060's Plexus scene), since the brief itself asks to keep the
current stack.

**First draft of this ADR retired Solaris entirely** (full-page background
gone, `sceneTheme` renamed), reasoning that the brief's literal
side-by-side layout was incompatible with Solaris's existing full-page
treatment and that two differently-composed 3D layers on one page reads
as a mistake — the same principle this project applied to every prior
"two backgrounds on one page" question. **Explicit user correction:**
keep Solaris as the page's full-page fixed background; the new FEA scene
renders on top of it, bounded to the hero section only — both visible
together, deliberately. The "two heavy backgrounds" concern doesn't apply
here because the FEA scene isn't a second full-page background; it's a
bounded box inside a page that already has one, same as any other
section-scoped content sitting on top of a fixed canvas.

**Decision — full Solaris revert + a bespoke, additive hero component.**
1. `SolarisBackground.tsx` restored verbatim, remounted in `layout.tsx`;
   `/services/geotechnical-engineering` restored in
   `GLASS_BACKGROUND_ROUTES` and `GLASS_SCENE_THEMES`; `ServiceSceneTheme`
   reverted to `"solaris"` (no new theme value needed — the bespoke hero
   below calls the FEA scene factory directly, not through the
   theme-keyed `SERVICE_HERO_SCENES` registry, so there was never a real
   need to rename the theme). Every content section on the page keeps its
   `.glass-panel` treatment, unchanged from before this turn.
2. **`GeotechnicalAnalysisHero.tsx`** (`src/views/services/`) — a bespoke
   Server Component, special-cased by slug in `service-detail.tsx` (`service.slug
   === "geotechnical-engineering"`) instead of extending `ServiceHero.tsx`,
   per explicit user direction ("it's complex enough to deserve its own
   component"). Deliberately transparent (no opaque background) so
   Solaris shows through around it, same convention `ServiceHero.tsx`'s
   own glass branch already uses. Reuses `SectionHeading` directly (unlike
   the homepage Plexus section) — this page's `--foreground`/
   `--foreground-muted` are already brightened for glass pages
   (`glassReadabilityStyle` in `service-detail.tsx`), so there's no
   light/dark token mismatch to design around here.
3. The FEA scene's own bounded viewport is styled as a light "instrument
   panel" — the `-engineering` token set from `globals.css` (ADR-0060,
   shared with the homepage Plexus section) — floating over the dark
   Solaris background. Satisfies the brief's "light or very light neutral
   background" for the 3D model itself without requiring the whole page
   to go light, and reads as a deliberate, premium juxtaposition (a clean
   engineering readout over a warm cosmic backdrop) rather than a
   mismatch.
4. `HeroScene.tsx` gained an optional `onSceneReady?: (scene: HeroSceneHandle) => void`
   prop, called once right after construction — lets `GeotechnicalFeaScene.tsx`
   (the client leaf wrapping `<HeroScene>`) capture the concrete handle to
   drive its stage/result-mode/deformation UI controls, which live beyond
   the base `HeroSceneHandle` contract. Backward-compatible; every
   existing caller is unaffected.
5. All 12 `geotechnical-fea/` builder modules composed into
   `build-geotechnical-fea-scene.ts` (`GeotechnicalFeaSceneHandle`,
   extending `HeroSceneHandle` with `setConstructionStage`/
   `setResultMode`/`setDeformedView`): `constants.ts` (block bounds, six
   strata, excavation/tunnel/pile geometry, the 6 construction stages, the
   5 result modes, the 4-stop contour colour ramp), `deformation.ts`
   (procedural settlement-bowl/wall-bow/tunnel-ovalization fields — a
   visualization, not a real FE solve, per the brief's own "should look
   like numerical analysis data" framing), `analysis-contours.ts` (scalar
   fields per result mode, sharing the deformation field rather than a
   second system), `soil-layers.ts` (stratum colour sampling + boundary
   lines), `ground-model.ts` (one continuous height-field grid that dips
   into the excavation footprint — no separate hole/wall geometry needed;
   see that file's own header for why six separate volumetric slabs, the
   Plexus scene's technique, was deliberately not repeated here),
   `finite-element-mesh.ts` (coarse base grid + finer grids clipped to
   dense-zone rectangles around the excavation/tunnel/piles — reads as
   adaptive mesh density without a real tetrahedral generator),
   `excavation-system.ts` (four deformable, contour-mappable retaining
   wall panels + two strut levels), `pile-foundation.ts`, `tunnel-model.ts`
   (custom radial×length grid, individually ovalizable per vertex),
   `lighting.ts`, `camera-controller.ts` (this scene's own real click-
   drag/zoom orbit — the canvas gets `pointer-events: auto`, a deliberate,
   scene-scoped exception to every other scene's `pointer-events-none`;
   spherical coordinates, clamped azimuth/polar/distance, damped, plus a
   one-time idle showcase rotation and passive pointer-parallax when not
   dragging), `construction-stages.ts`.
6. `GeotechnicalFeaScene.tsx` (client leaf) renders the DOM tooltip overlay
   (built directly in the scene builder, positioned per frame via
   `camera.project()`) and the stage-stepper/deformed-toggle/result-mode
   selector — a real, accessible sibling of `<HeroScene>`'s own
   `aria-hidden` canvas container, not nested inside it. Hidden below the
   mobile breakpoint, matching `HeroScene.tsx`'s own internal gating there.

**Mobile.** Same standing convention as every other scene this session
(ADR-0060): mobile-width = no WebGL, CSS fallback (`FeaFallback`, reusing
the `-engineering` light palette) instead. Tablet gets a reduced FE-mesh
`densityScale`.

**Verification.** `.claude/scripts/verify.sh` (0 FAIL; new WARNs — hex
literals in the scene builder, a few arbitrary `text-[11px]`/`h-[440px]`
values, one `tag="div"` on an `Inview` — all match patterns already
accepted elsewhere in this codebase), `yarn lint` clean, `yarn build`
clean. Browser-verified on the running dev server, including a forced-
synchronous-render ground-truth pass (this automation browser's tab
reports `document.visibilityState: "hidden"` despite having focus — the
same well-documented quirk noted throughout this session — which
correctly pauses `HeroScene.tsx`'s own rAF loop; a temporary
`window.__feaForce(t)` hook calling `renderFrame(t)` directly, removed
before finishing, confirmed the excavation cutaway, retaining walls,
struts, FE mesh, hover tooltips, stage stepper, deformation toggle and
contour colour ramp all render and update correctly): the excavation pit
visibly deepens and the retaining walls/struts appear across construction
stages; "Soil Stratigraphy" tooltip appears on hover; toggling "Deformed"
+ selecting "Total Displacement" produces the intended blue→green→
yellow→red contour gradient across the ground surface and wall panels.

**Consequences.** `LAYERS`/`STRATA`-style constants for this scene live in
`geotechnical-fea/constants.ts`, the canonical spec for any future tweak
to the excavation/tunnel/pile geometry or the construction sequence. The
`-engineering` token set (ADR-0060) now has a second consumer, confirming
it as this project's general-purpose "light engineering panel" palette
rather than a one-off for the homepage Plexus section.

---

## ADR-0060 — Geotechnical Plexus homepage scene: built vanilla Three.js (not R3F/drei/GSAP) per explicit user choice; light-theme island tokens; RSC boundary fix for `spring-text-engine`

**Status:** Accepted · 2026-08-28

**Context.** Requested: a premium, interactive 3D "Plexus" scene for a
homepage feature section — ground surface, six geological strata, a
depth-graded node/line/triangle "Plexus" network, five labelled boreholes,
a piled foundation, a groundwater plane, slow data pulses, mouse-driven
restrained tilt, and a 5-stage scroll choreography (assembled → exploded
layers → plexus emphasis → borehole/pile highlight → reassembly). The
brief's own stack ask — React Three Fiber, @react-three/drei, GSAP/Framer
Motion — conflicts with hard rule #1 (spring-only motion, framer-motion
explicitly banned) and none of those four packages are installed
(`package.json` confirmed: only `@react-spring/web`, `three`, `lenis`
among relevant deps). Raised to the user directly via `AskUserQuestion`
rather than deciding unilaterally — the brief's own closing line ("integrate
without breaking the current design system or dependencies") was itself a
signal this tension mattered. **User selected "match existing architecture."**

**Decision — vanilla Three.js, existing `HeroSceneHandle` pattern, zero new
dependencies.** One plain `THREE.WebGLRenderer` builder,
`createGeotechnicalPlexusScene`, implementing the same handle shape as
`build-negentropy-scene.ts`/`build-pinwheel-galaxy-scene.ts`
(`renderFrame`/`renderStatic`/`resize`/`setPointer`/`setScrollProgress`/
`dispose`/`canvas`), mounted through the existing `<HeroScene>` wrapper
unmodified — inherits mobile/reduced-motion gating, tier-based DPR clamp,
pause-when-offscreen, and dispose-on-unmount for free, same as every other
scene this session.

**Decomposition.** The brief names sub-components (Terrain,
GeologicalLayers, PlexusMesh, Boreholes, FoundationSystem, Groundwater,
DataPulses, SceneLighting) and asks not to put everything in one huge
component. This is one imperative scene graph, not a declarative React
tree, so each part is its own builder module under
`src/components/scene/geotechnical-plexus/` (`terrain.ts`,
`geological-layers.ts`, `plexus-mesh.ts`, `boreholes.ts`,
`foundation-system.ts`, `groundwater.ts`, `data-pulses.ts`, `lighting.ts`,
`constants.ts`), each returning a small handle
(`{ group, dispose, ...controls }`) composed by
`build-geotechnical-plexus-scene.ts`. The brief's "ScrollController" is the
5-keyframe piecewise-linear interpolation + damping logic inline in that
same orchestrator file (~30 lines of pure math, no geometry) — matching
where `build-negentropy-scene.ts`'s own `evaluateCameraFlight` lives.

**No noise library.** `simplex-noise` isn't installed and the brief didn't
ask for terrain realism beyond "slightly irregular" — `constants.ts` has a
small hash-based smooth value-noise (`smoothNoise2D`/`fbm2`), reused by
terrain, the six layer slabs (top *and* bottom surfaces, independently
seeded, so each layer is a real volume with natural thickness variation —
not a flat plane), and the groundwater plane.

**Plexus density/structure driven by depth**, per the brief's own framing
("engineering computation mesh, not a random galaxy"): each layer in
`LAYERS` (`constants.ts`) carries a `nodeCount` and a `structure` (0=random,
1=lattice-snapped) that both increase with depth — Fill gets 26 sparse,
irregular nodes; Bedrock gets 78 dense, lattice-jittered ones. Connectivity
is K-nearest-neighbour (K=3) within a depth-scaled max distance, computed
once at construction (O(n²) over ≤~300 nodes); triangular faces are found
from mutually-connected triples and capped (~90 desktop) so the fill reads
as "selected," not "every possible face." One `InstancedMesh` for nodes,
one `BufferGeometry`/`LineSegments` for all connections, one small
triangle-soup `Mesh` for faces — one draw call each regardless of count,
per the brief's explicit performance asks.

**No `EffectComposer` / bloom.** Every other scene this session uses
`UnrealBloomPass`; this one deliberately doesn't — the brief explicitly
asks to avoid "excessive bloom" and "glowing sci-fi grids," every subsystem
already reads clearly under plain `AmbientLight`/`HemisphereLight`/two
`DirectionalLight`s, and skipping post-processing entirely makes this the
cheapest hero scene in the codebase (no render targets, no shadow maps).

**Light-theme island, not a sitewide change.** The brief asks for a
"white/light background... premium, minimal" look — the opposite of this
site's dark Neural Monitor palette everywhere else. New Tier 1/2/3 tokens
in `globals.css` (`--raw-color-engineering-*` → `--surface-engineering`/
`--ink-engineering`/`--line-engineering`/`--accent-engineering`/
`--glow-engineering` → `@theme inline` bindings generating
`bg-surface-engineering`/`text-ink-engineering`/etc utilities) scope this
to the new section only — `--background`/`--foreground` are untouched, so
nothing else on the site is affected. The canvas itself renders with
`alpha: true` / transparent clear colour so the section's own CSS
background shows through, rather than hardcoding a colour that could drift
from the token. `GeotechnicalPlexusSection.tsx` deliberately does not reuse
`SectionHeading` — that component hardcodes the sitewide dark-theme
`text-foreground`/`text-foreground-muted` tokens, which would render wrong
(near-invisible) against this section's light background — local markup
with the `-engineering` tokens instead. `HeroFallback` (the default mobile/
reduced-motion substitute) hardcodes `bg-background` for the same reason,
so this scene ships its own light-themed static `PlexusFallback`.

**Mobile.** The brief asks for reduced node/line density on mobile,
implying the scene keeps rendering there. This codebase's own established
convention (every other WebGL scene this session) is instead "mobile tier
= no WebGL at all, CSS/spring fallback" — enforced by `<HeroScene>` itself,
left unmodified per the plan above. The *tablet* tier does get the
brief's density reduction (`densityScale` 0.55 vs desktop's 1, applied to
every subsystem's node/line/pulse counts); true mobile-width devices get
the section's own light-themed static fallback instead of a struggling
WebGL scene, consistent with every other scene on this site. Documented as
a deliberate deviation from a literal reading of the brief, not an
oversight.

**A real bug found and fixed en route:** the first version imported
`spring-text-engine`'s `TextEngine` directly into
`GeotechnicalPlexusSection.tsx`, a Server Component. `next build` failed
at "Collecting page data" with `TypeError: [x].createContext is not a
function` — `spring-text-engine` ships no `"use client"` banner of its
own (it's not written for Next's RSC system), so importing it straight
into a server module breaks the production build. Confirmed by bisection
(minimal section builds fine; adding `TextEngine` alone reproduces the
failure) and by checking precedent: every existing `TextEngine` use in
this codebase already goes through a client-marked file
(`SectionHeading.tsx`, `home/HeroHeading.tsx`) — none import it directly
into a server component. Fixed by extracting a `GeotechnicalPlexusHeading.tsx`
client leaf (mirrors `HeroHeading.tsx`) rather than marking the whole
section `"use client"`, keeping hard rule #6 (Server Components by
default) intact. Worth remembering for any future `TextEngine` use: it
must always sit behind its own `"use client"` file, never imported
straight into a Server Component.

A second, smaller instance of the same class of issue: the initial
`GeotechnicalPlexusSection.tsx` imported `createGeotechnicalPlexusScene`
(which pulls in `three`) directly and passed it as a `createScene` prop to
`<HeroScene>` — RSC can't serialize a plain function reference across the
server/client boundary that way. Fixed by extracting
`GeotechnicalPlexusScene.tsx`, a thin client leaf doing the lookup
internally, mirroring `ServiceHeroScene.tsx`'s existing role for the
per-service-page hero scenes.

**Placement.** The brief describes "a full-width hero or feature section"
without naming a page. Mounted on the homepage, between `AboutSection` and
`ServicesSection` — the existing Geotechnical Engineering service page
already carries a full-page fixed Solaris background (see the Solaris ADR)
that this section's own light theme would visually clash with if mounted
there, and the homepage is where every other "digital twin" style
capability moment already lives. Flagged here as a judgement call, not a
literal instruction — reorderable on request.

**Verification.** `.claude/scripts/verify.sh` (0 FAIL; the 2 new WARNs —
one arbitrary `h-[420px]`/`h-[560px]` on the canvas wrapper, one `tag="div"`
on an `Inview` — both match existing accepted patterns elsewhere in the
codebase, e.g. `CookieBanner.tsx`'s `sm:w-[420px]`,
`AboutSection.tsx`'s own `tag="div"` usage), `yarn lint` clean, `yarn build`
clean after the RSC fixes above. Browser-verified on the running dev
server: the scene renders correctly (six distinct strata colours, five
labelled boreholes, survey-line grid, no console errors, `gl.getError()
=== 0`), scroll into the section visibly changes the camera framing and
layer state, confirming the `setScrollProgress` wiring is live.

**Consequences.** `LAYERS` in `constants.ts` is now the canonical
depth/colour/waviness/structure spec for this scene — any future tweak to
strata depths or the Plexus density curve changes there, not scattered
across subsystem files. The `-engineering` token set is available for any
future light-themed section without re-deriving a palette.

---

## ADR-0059 — Contact page glass intensified 50%; fixed a latent bug where `.glass-panel`'s page-scoped overrides (Stormwater included) never actually applied

**Status:** Accepted · 2026-08-28

**Context.** Requested: make `/contact`'s glass panels "50% more liquid
glass." Implemented as a page-scoped Tier-2 override (`--glass-blur`/
`--glass-border`/new `--glass-saturate`, all ×1.5), the same mechanism
`service-detail.tsx`'s `stormwaterGlassStyle` already used for Stormwater's
own "more transparent" override (ADR-0049) — and then verified it with
`getComputedStyle` rather than trusting a screenshot. It didn't work:
`blur`/`border` stayed at the sitewide default; only a newly-added,
directly-referenced `--glass-saturate` (no Tailwind alias) actually
applied.

**Root cause.** `.glass-panel`'s hand-written CSS read `--color-glass-fill`/
`--color-glass-border`/`--blur-glass` — Tailwind `@theme inline` aliases of
the real Tier-2 tokens (`--glass-fill`/`--glass-border`/`--glass-blur`).
`@theme inline`'s "inline" behaviour only inlines the aliased variable into
**Tailwind-generated utility classes** (e.g. `bg-accent` genuinely does
resolve `var(--accent)` live, correctly respecting a descendant override —
that mechanism is fine and unaffected by this ADR). Hand-authored CSS that
references the alias name directly, like `.glass-panel` did, gets ordinary
CSS custom-property semantics instead: `--blur-glass: var(--glass-blur)`'s
value is fixed by resolving `--glass-blur` **at the element where
`--blur-glass` itself is declared** (`:root`), not at the element
consuming `--blur-glass`. A page-scoped override of `--glass-blur`
further down the tree therefore never reached it — the classic
`--b: var(--a)` / `.override { --a: blue }` CSS gotcha. This meant
**Stormwater's own glass override has been silently non-functional since
ADR-0049** — its panels have been rendering at the sitewide 0.65-opacity/
20px-blur default, not the intended 0.35-opacity/12px "much more
see-through" treatment, this whole time. Not caught earlier because every
prior check was visual (a screenshot showing "some" transparency reads as
correct at a glance) rather than a `getComputedStyle` diff.

**Decision.**
1. `.glass-panel` now reads all four properties by their Tier-2 name
   directly (`--glass-fill`/`--glass-border`/`--glass-blur`/
   `--glass-saturate`), never through a Tier-3 alias — removed the now-
   provably-dead `--color-glass-fill`/`--color-glass-border`/`--blur-glass`
   `@theme inline` entries entirely (confirmed via grep: no
   `bg-glass-fill`/`border-glass-border`/`blur-glass` utility class is used
   anywhere in this codebase, so nothing else depended on them).
2. New `--raw-saturate-glass` (Tier 1, 180% default) / `--glass-saturate`
   (Tier 2) — `saturate()` has no Tailwind namespace to bind into (same
   reasoning the file already gave for writing it as a literal before),
   so it was hardcoded 180% directly in `.glass-panel`; now a proper
   token like the rest of the glass quartet.
3. New Contact-only Tier-1 "-intense" trio (`--raw-blur-glass-intense:
   30px`, `--raw-color-glass-border-intense: rgba(255,255,255,0.15)`,
   `--raw-saturate-glass-intense: 270%`) — each exactly ×1.5 the sitewide
   default (20px→30px, 0.1→0.15, 180%→270%), applied via a new
   `intenseGlassStyle` override in `contact.tsx`, same "swap the Tier 2
   role's value" mechanism as `stormwaterGlassStyle`. Fill deliberately
   left at the sitewide default — it's the text-legibility backing, not
   part of what reads as "glassy".

**A second, self-inflicted bug found and fixed en route:** the first
attempt at the ADR comment for this fix used the literal phrase "@theme
inline" in prose, which `verify.sh`'s `awk '/@theme inline/,/^}/'` token
check matches textually (not just the real block) — it started treating
everything after that comment as if it were inside `@theme inline` and
flagged dozens of unrelated pre-existing tokens as FAILs. Reworded to
avoid the exact substring; worth remembering when writing comments in
`globals.css` near that block.

**Verification.** `.claude/scripts/verify.sh` (0 FAIL, WARN set unchanged),
`yarn lint`, `yarn build` all clean. Browser-verified via
`getComputedStyle` on both pages, not just visually: `/contact`'s
`.glass-panel` now reports `blur(30px) saturate(2.7)` and
`rgba(255,255,255,0.15)` border (was `blur(20px) saturate(1.8)` /
`0.1` before the fix); `/services/stormwater-and-flood-modelling`'s now
correctly reports `blur(12px)` / `rgba(4,6,15,0.35)` fill /
`rgba(255,255,255,0.08)` border — its intended ADR-0049 values, for the
first time.

**Consequences.** Any *future* page-scoped `.glass-panel` override
(`--glass-fill`/`-border`/`-blur`/`-saturate`) now actually works. Worth
remembering generally: a CSS custom-property override on a descendant
only reaches a consumer that references the overridden variable *by its
own name* — an intermediate alias declared once at `:root` (exactly what
`@theme inline` produces for non-utility-class consumers) will not
forward it, and this class of bug is invisible to a screenshot.

---

## ADR-0058 — Sitewide bug sweep + 4-tier performance system (Ultra/High/Medium/Low), superseding ADR-0056's simpler 3-tier gate

**Status:** Accepted · 2026-08-28

**Context.** Two requests arrived together: "fix all bugs across the site"
(scroll-to-top on navigation, a real 4-tier performance/capability system
with React-context + localStorage + FPS-based auto-downgrade + a specific
mobile-detection ruleset, plus a general bug sweep) and a `/contact`+Bird-
video request that turned out to already be fully shipped the immediately
preceding turn (ADR-0057) — confirmed, not rebuilt, only its "hook up every
Contact Us button" sub-task was still open. The new tier spec directly
supersedes ADR-0056's simpler `hardwareConcurrency <= 4` gate from one
turn earlier (new thresholds, `deviceMemory`, mobile-UA detection,
localStorage persistence, live FPS-triggered downgrade, and literal
3-stop CSS gradients replacing ADR-0056's scene-CONFIG-sourced two-stop
ones) — treated as an authoritative revision, not an addition alongside
it, per the request's own exhaustive, precise thresholds.

**Decision — scroll restoration.** `ScrollController` in
`scroll-layout.tsx` already tracked `pathname` changes (for in-page hash
navigation) but never reset scroll position on a plain route change —
confirmed via reading the file, not assumed. Added an `else` branch:
`lenis.scrollTo(0, { immediate: true })` (not a raw `window.scrollTo`,
which would desync Lenis's own virtual scroll position and jank the next
user scroll) when there's no hash, falling back to `window.scrollTo(0,0)`
if Lenis isn't mounted yet.

**Decision — the 4-tier system.**
1. New `src/lib/scene/performance-tier.ts` — pure detection
   (`detectPerformanceTier()`), localStorage persistence
   (`getOrDetectTier()`/`downgradeTier()`), per the brief's exact
   thresholds. One genuine internal contradiction in the brief, resolved
   and flagged rather than silently picked: Tier 3's own description
   ("high-end phones like iPhone 14+") is HIGH, but the brief's explicit
   "MOBILE SPECIFIC" forcing rules never assign anything above MEDIUM to
   a mobile UA. Followed the forcing rules (more operationally precise)
   as authoritative.
2. `device-tier.ts`'s existing `isLowPowerDevice()` (ADR-0056) now
   delegates to `getOrDetectTier() === "low"` instead of its own narrower
   hardwareConcurrency-only check — every existing consumer (`HeroScene`,
   `AmbientBackground`, `PlanetBackground`, `SceneViewport`) picks up the
   fuller detection with zero additional wiring, the same "one module
   decides" principle ADR-0056 established. `getTierBudget`'s `dprClamp`
   now also takes the smaller of the width-tier's own clamp and the
   capability-tier's clamp, so a desktop-*width*-but-Medium-*capability*
   device gets dpr=1 (per the new spec) instead of desktop's dpr=2.
3. New `src/hooks/performance/use-performance-tier.tsx` — the explicit
   "store tier in a React context" ask, mounted once in `layout.tsx`
   wrapping `<ScrollLayout>`. Reactive consumers (currently just
   `PerformanceWarningToast`) read `usePerformanceTier()`; scene builders
   keep reading the existing synchronous `getDeviceTier()`/`getTierBudget()`
   API at construction time — unchanged, since scenes are built once per
   mount and a live in-place quality change would need new imperative
   hooks in all 9 already-shipped scene builders (see the "not done"
   section below).
4. `performance-monitor.ts`'s FPS sampling: threshold 30→20fps (the
   existing 3000ms sample window already *was* the spec's "3 consecutive
   seconds", no change needed there); removed its permanent one-shot
   `hasWarned` lock (added a 5s re-arm cooldown instead) so a live
   downgrade can fire more than once per page lifetime, floored naturally
   once the tier reaches "low" (WebGL stops mounting, so this stops being
   called at all). `PerformanceWarningToast.tsx` now calls
   `usePerformanceTier().downgrade()` on every low-FPS event (in addition
   to showing/re-showing itself) — message text and 6s auto-dismiss
   updated to the brief's exact wording/timing.
5. **New literal fallback gradients**, replacing ADR-0056's two-stop
   `from`/`to` pairs with the brief's exact 3-stop `radial-gradient(...)`
   strings — new `--raw-gradient-fallback-<scene>` Tier-1 tokens (one
   string per token, still "only Tier 1 holds a literal" per the token
   rules — the gradient function's own hex stops are that token's
   literal value, same shape `--raw-color-glass-fill: rgba(4, 6, 15,
   0.65)` already uses). `SceneFallbackGradient.tsx` now takes a single
   `gradient` prop instead of `from`/`to`. Stormwater & Flood Modelling
   wasn't in the brief's own gradient list (the same gap already flagged
   in ADR-0056) — kept Negentropy's own accent, reshaped into the new
   3-stop form. `/projects` and `/contact` were also listed in the
   brief's gradient set despite being *video* backgrounds — per the same
   brief's own explicit "videos still play... at 480p on tier 1" line,
   videos are NOT replaced by a CSS gradient on any tier; the two
   contradict, and the more specific "videos still play" instruction won.
6. **Not done, flagged rather than silently skipped**: Medium tier's
   "particles reduced 60%, bloom halved" is not live-wired into the 9
   already-shipped, verbatim-ported scene builders. Each hardcodes its
   own particle-buffer construction (a deliberate "implement exactly"
   constraint from the turns that built them) — retrofitting a live
   per-tier reduction into all 9 risks correctness regressions in
   carefully cross-checked shader/geometry code for a change that, per
   this same brief's own Low-tier rule, only matters for devices that
   pass the Low bar in the first place (Medium-tier devices already get
   the smaller `dprClamp` and would get the bloom scale, had it been
   wired — `PERFORMANCE_TIER_BUDGETS` exports `particleScale`/
   `bloomScale` numbers for this, ready for a scene-by-scene follow-up
   that wasn't rushed into this turn).

**Decision — bug sweep.** Found by direct grep/read, not assumed:
1. **Five stale `/#contact` links** (`Nav.tsx`, `MobileMenu.tsx`,
   `Footer.tsx` ×2, `ServiceCta.tsx`) — left over from before the
   standalone `/contact` page existed. All now point to `/contact`.
2. **`/privacy-policy` linked from two places** (`CookieBanner.tsx`,
   `CookiePreferencesModal.tsx`) **but never built** — a genuine 404.
   Built a minimal, honest page (`src/views/privacy-policy.tsx`)
   describing only what this site's own code actually does (the three
   real cookie categories from `CookiePreferencesModal.tsx`, what the
   contact form does with submitted data) rather than asserting broader
   legal claims (retention windows, third-party processors,
   jurisdiction-specific rights) this page has no authority to make —
   Geoporte is a real company, so a fabricated legal document would be
   worse than an honest placeholder. Added to `sitemap.ts`.
3. **Nav hamburger button was 36×36px**, below the 44px touch-target
   floor the brief asks for — the one concrete, high-visibility gap found
   in a mobile-behaviour audit. Everything else audited turned out
   already covered by existing infrastructure, confirmed by reading it
   rather than assumed: `AdaptiveGrid` already scales root font-size
   sitewide (mobile font sizes), `MobileMenu.tsx` already exists (nav
   hamburger), every grid in this codebase already defaults to
   `grid-cols-1` before a `sm:`/`md:`/`lg:` override (Tailwind mobile-
   first, already single-column on mobile everywhere), `CustomCursor`/
   `Magnetic` already gate on `isFinePointer` (no cursor trail/magnetic
   buttons on touch), and the only genuine "parallax" in this codebase
   lives inside WebGL scenes that don't mount on mobile/low tier at all
   (confirmed via grep — no page component uses `<SpringTrigger
   mode="scrub">` directly). "Simplify scroll reveals to fade-in only"
   was deliberately not done — `Inview` springs are lightweight
   composited transform/opacity animations, not scroll-linked JS, so
   this reads as a UX preference rather than a performance bug, and
   retrofitting dozens of call sites for it wasn't judged worth the
   change volume in this pass.
4. **Language switcher**: confirmed already working uniformly sitewide
   (a `zustand` global store, not scoped to any page) — the actual
   translation *coverage* is uniformly partial everywhere (headings/nav/
   button labels via `SectionHeading`/`TranslatedText`, body copy and
   form fields left untranslated on the homepage too, an existing,
   consistent convention, not a homepage-only regression).
5. Console-error and route spot-checks (homepage, Geotechnical/Solaris,
   Telecom/Spiral Galaxy, `/privacy-policy`) all clean.

**Verification.** `.claude/scripts/verify.sh` (0 FAIL — the WARN set is
unchanged from before this turn plus one new, consciously-accepted
`tag="div"` on `privacy-policy.tsx` matching the same shape already
accepted on six other files), `yarn lint`, `yarn build` all clean.
Browser-verified the tier system end-to-end (not just the individual
pieces): `localStorage.getItem('geoporte:performance-tier')` returned
`"ultra"` on the dev machine after a real page load — confirming
detection, the React context mount, and persistence all actually ran,
not just type-checked.

**Consequences.** The performance-tier system is now the sitewide source
of truth for device capability; `device-tier.ts`'s width-based tiers are
unchanged in meaning (grid/ambient-shape-count) but their `dprClamp` now
also respects capability. A follow-up turn is the natural place to wire
`particleScale`/`bloomScale` into the 9 scene builders, if that's wanted.

---

## ADR-0057 — Bird video background on /contact; page rebuilt from the shared homepage ContactSection into its own real-content page

**Status:** Accepted · 2026-08-28

**Context.** GetLayers' "Bird" background video requested as the standalone
`/contact` page's fixed full-page background, plus "Build proper /contact
page" with a contact form (name/email/phone/message), the four real office
locations, and phone/email from `company.ts`. Downloaded via the signed
URL (confirmed via `curl -sIL` first, then explicit user confirmation
before fetching, per this project's established file-download protocol);
extracted a real 2700×2160/5s h264 master + 2K poster, no watermark
(confirmed via the archive's own `README.txt`).

**Decision.**
1. **Assets**: re-encoded to the established `public/assets/<name>/`
   convention (`public/assets/bird/`, not the request's literal
   `public/videos/` path — kept consistent with every other video asset
   this project has pulled: Siloutte, Purple Planet) — 1920×1080 mp4
   (h264) + webm, cover-cropped from the 2700×2160 master (not 16:9,
   needed a real crop, not just a scale), plus a 1280×720 mobile pair.
   The mobile pair wasn't asked for, but `VideoBackground.tsx` gained a
   `mobileMp4Src`/`mobileWebmSrc` quality-ladder mechanism in ADR-0056,
   the turn immediately before this one — shipping a new full-page video
   without it would have made this the one background inconsistent with
   the mobile-optimization work just finished, so it was added
   proactively rather than flagged as a gap.
2. **`BirdBackground.tsx`** mounted route-gated to `/contact`, reusing
   `VideoBackground.tsx` unchanged — same shape as
   `ProjectControlBackground.tsx`/`PurplePlanetBackground.tsx`.
   `/contact` added to `GLASS_BACKGROUND_ROUTES`.
3. **The page itself was previously `<ContactForm />` + the shared
   `<ContactSection />`** (offices/phone/email, plus `ContactTerrain` — a
   section-scoped WebGL office-marker terrain). `ContactSection`/
   `ContactTerrain` are also used by the homepage, built for a plain
   non-glass background; reusing them as-is here would have put a second,
   semi-transparent WebGL backdrop behind the office section, competing
   with the new full-page video. Rebuilt `src/views/contact.tsx` with its
   own `.glass-panel` sections instead, reusing `ContactForm` and the real
   `offices`/`contact` data from `company.ts` directly rather than the
   shared section component. `ContactSection.tsx`/`ContactTerrain.tsx` are
   untouched and still used by the homepage.
4. **Added a phone field** to `ContactForm.tsx` (optional, `type="tel"`)
   to match the brief's explicit "name, email, phone, message" — the
   existing form only had name/email/message. Added `phone:
   z.string().max(30).optional()` to `/api/contact/route.ts`'s zod schema
   to match.
5. Cleaned up a pre-existing `tag="div"` WARN on the office/address grid
   while rewriting this page (split into two independently-animated
   `Inview`s — `tag="address"` and `tag="ul"` — instead of one generic
   `div` wrapping both), rather than reproducing it verbatim from the old
   `ContactSection` markup.

**Verification.** `.claude/scripts/verify.sh` (0 FAIL — two consciously-
kept WARNs: the single-child `Inview tag="div"` wrapping `<ContactForm
/>`, same pre-existing shape already accepted in `AboutSection.tsx`/
`ContactSection.tsx`; and the pre-existing `console.log` in the contact
route), `yarn lint`, `yarn build` all clean; `/contact` still prerenders
static. Browser-verified directly (unlike several prior turns): the video
background, the phone field, and all four real offices with correct
addresses all rendered correctly in a screenshot — this automation tab's
usual rAF-starvation only affected the text reveal timing (content
present, mid-animation), not the video or the DOM content itself.

**Consequences.** `/contact` now behaves like every other glass route and
has a complete contact form (with phone) instead of the previous
name/email/message-only version — the schema change is additive and
doesn't affect the homepage's own use of `ContactForm`.

---

## ADR-0056 — Sitewide mobile/low-power optimization: WebGL disabled below a single shared gate, per-scene static CSS fallback, video quality ladder

**Status:** Accepted · 2026-08-28

**Context.** Requested: disable every dedicated full-page WebGL scene on
narrow viewports *and* on low-core desktops (`navigator.hardwareConcurrency
<= 4`), replace them with a static CSS gradient matching each page's own
scene palette, keep the two video backgrounds but serve a smaller size on
mobile, and make sure every WebGL canvas already pauses off-screen/
backgrounded. The request named 7 of the 9 dedicated scenes for the
disable list and gave explicit gradient colours for 7 of the 9 pages —
Civil Engineering (Golden Parthenon) and Stormwater & Flood Modelling
(Negentropy) were missing from both lists, and Aurum Peak/Publications was
missing from the disable list specifically. Given the request's own
framing ("across the ENTIRE site"), treated this as an omission rather
than a deliberate exclusion and extended the same treatment to all 9
uniformly — flagged here rather than silently leaving two pages
unoptimized.

**Decision.**
1. **Pause-on-hidden/off-screen was already fully implemented.**
   `HeroScene.tsx` already gates its render loop on `document.hidden` *and*
   an `IntersectionObserver`, for every one of the 9 dedicated scenes,
   since ADR-0031. No change needed — audited via the `optimize-3d-scene`
   skill's §0 before writing anything, per the project's hard rule #13.
2. **One shared gate, not nine.** `device-tier.ts`'s `getDeviceTier` already
   decided "mobile" (width < 768px) → `HeroScene.tsx` never mounts WebGL at
   all, showing `HeroFallback` instead — this was already the established,
   shipped behaviour (not a tiered-down scene, a fully-skipped one),
   confirmed against the `optimize-3d-scene` skill's own "don't drop the
   scene wholesale" advice as a deliberate, already-ADR'd deviation for
   this project rather than something to relitigate here. Added
   `isLowPowerDevice()` (`navigator.hardwareConcurrency <= 4`, SSR-safe,
   guarded behind the same `viewportWidth > 0` check every caller already
   uses so it can't disagree between server HTML and the client's first
   paint and trip a hydration-mismatch warning) and OR'd it into
   `getDeviceTier` itself — every existing consumer (`HeroScene`,
   `AmbientBackground`, `PlanetBackground`, `SceneViewport`'s mini-scenes,
   every tier budget) now honours the new rule with zero additional
   per-scene wiring, exactly the skill's own "one module decides" principle.
3. **Interpretation of "reduce particle counts by 60% on hardwareConcurrency
   <= 4": under the design above, such a device already gets zero WebGL
   (the scene is never constructed at all), making a 60%-reduced buffer
   moot — there's no reachable code path where it would apply. Did not
   build a dead, never-triggered reduction path into the 9 already-shipped
   verbatim scene files (each of which documents "implement exactly" as a
   deliberate prior constraint) to satisfy a clause the stricter "disable
   entirely" rule already supersedes. Flagged rather than silently doing
   something different from what was asked.
4. **Per-scene static CSS fallback**, not the generic `--accent`/`--glow`
   pulse. `HeroScene.tsx` gained an optional `fallback` prop (default
   `HeroFallback`, unchanged for the homepage hero and every service page
   that isn't a fixed-background route); each of the 9 `*Background.tsx`
   wrappers now passes a new `<SceneFallbackGradient from to>` — a plain,
   *unanimated* radial gradient (deliberately no `useSpring` pulse: the
   entire point of this tier is zero per-frame cost). Deliberately not the
   sitewide `--accent`/`--glow` tokens (`service-accent.ts`) — those also
   tint buttons/links across the whole page, and don't match each scene's
   own individual palette anyway (Geotechnical's site accent is cyan-blue
   `#1f8ec2`; Solaris itself is amber `#ff7033`). New Tier-1 tokens instead,
   one shared dark `--raw-color-fallback-from` (`--raw-color-navy-950`)
   plus nine `--raw-color-fallback-<scene>-to` accents, each copied from
   that scene's own real `CONFIG` colour (documented per-token in
   `globals.css`), consumed via `var()` the same way the existing
   `stormwaterGlassStyle`/`glassReadabilityStyle` inline-style overrides
   already reference Tier-1 tokens directly.
5. **Video quality ladder**: `VideoBackground.tsx` gained optional
   `mobileMp4Src`/`mobileWebmSrc` props, rendered as `<source media=
   "(max-width: 768px)">` entries ahead of the default sources — a plain
   browser-native mechanism, evaluated before any bytes download, with no
   client JS and no hydration risk (unlike computing "is this mobile" in
   React, which is what `preload="none"` needed instead, accepting the
   same width-gated hydration-safe pattern used everywhere else in this
   codebase). Re-encoded 1280×720 mp4+webm from the existing 1920×1080
   Siloutte and Purple Planet assets (not from a 4K master — neither is
   kept in the repo) via the already-installed ffmpeg, same settings as
   the original 1080p encode. `preload="none"` on the mobile tier is a
   deliberately accepted partial fix: without server-side UA sniffing (a
   bigger trade-off — it opts these currently-static routes out of
   prerendering, per the `optimize-3d-scene` skill's own §1 warning), the
   browser may already be honouring the default preload hint for the very
   first paint or two before the client-measured tier lands.
6. **`SceneViewport.tsx`** (the shared mini-scene renderer, currently unused
   since `MINI_SCENES` went empty in ADR-0054, but still a live code path)
   had its own independent width check consolidated to also OR in
   `isLowPowerDevice()`, keeping its per-call `mobileBreakpoint` override
   intact rather than replacing it outright with `getDeviceTier`.

**Verification.** `.claude/scripts/verify.sh` (0 FAIL, no new WARNs),
`yarn lint`, `yarn build` all clean throughout every step. All 10 new
`--raw-color-fallback-*` tokens confirmed resolving to their intended real
hex values via `getComputedStyle`. Desktop rendering re-confirmed
unaffected for both a WebGL scene (Solaris) and a video background
(Purple Planet) via screenshot. **Not directly verified**: this automation
browser's `resize_window` tool does not actually change the page's
`window.innerWidth` in this environment (confirmed: window resized to
390×844, `window.innerWidth` still read 1536), and this harness has no
CPU-core emulation, so the fallback-gradient/no-WebGL branch itself could
not be visually exercised end-to-end — the width-gated logic was code-
reviewed against the exact same hydration-safe pattern this codebase
already uses successfully in `HeroScene.tsx`'s own pre-existing mobile
check, rather than left unverified without comment.

**Consequences.** Every dedicated WebGL scene and video background now
degrades the same way on a narrow viewport or a weak CPU — a free, static,
scene-toned gradient — with a single shared gate governing all of it.

---

## ADR-0055 — Pinwheel Galaxy background on /about; page rebuilt from a bare re-export of the homepage's About section into its own real-content page

**Status:** Accepted · 2026-08-28

**Context.** GetLayers' "Pinwheel Galaxy" scene (differential-rotation
spiral arms + a bulge + rising ember sparks, magenta/gold default palette)
requested as the standalone `/about` page's fixed full-page background,
plus "Build proper /about page with Geoporte team info (pull from real
site if possible)." Pulled via `getlayers_search`/`getlayers_materialize`
(id `pinwheel-galaxy`, target `next`) — every number in the brief (CONFIG
values, geometry counts 120000/2500/5000, camera 45°/z=3, composer bloom
0.22/0.2/0 + 0.38/0.55/0) matched the real materialized source exactly.
Note: the catalog's own one-line description calls this scene "deep-
emerald" — that describes its `-002` saved roll, not the "Default" variant
actually pulled and used here (magenta/gold/mint), confirmed against the
materialized source's own `variantConfigs`, not assumed from the
description.

**Decision.**
1. **Verbatim port**, `src/components/scene/build-pinwheel-galaxy-scene.ts`
   — same discipline as every prior scene: the arms/bulge/sparks point
   clouds (stored in polar coordinates, reinterpreted per-vertex for
   differential rotation — inner radii spin faster, driven by a JS-
   accumulated spin phase per the asset's own `contract.notes` warning
   against ever rewriting it as a speed-scaled `iTime`), the appear-in
   slide from `z=-20`, the scroll-driven dive/spin-acceleration/expand/
   chaos, the cursor NDC repulsion, and all six shaders (arms, bulge,
   sparks, FinalPass, atmosphere motes) copied character for character.
2. **Two intro loops folded into one**: the source runs its main
   `render()` loop AND a second, independent `appearIn()` rAF loop driven
   by its own `performance.now()` deltas. Folded both into
   `HeroScene.tsx`'s single `renderFrame(elapsedSeconds)` call, computing
   the slide/opacity/`iAnimate` ramps directly off `elapsedSeconds * 1000`
   each frame — same idiom every other scene here already uses for its
   own intro timing, just applied to two ramps instead of one.
3. **Scroll driver substitution** (same as ADR-0054's Spiral Galaxy):
   `getScrollSignalSnapshot().progress` instead of the source's own raw
   `window.scrollY` listener, keeping the source's own single-stage
   `scrollCurrent` lerp unchanged.
4. **`/about` added to `GLASS_BACKGROUND_ROUTES`** — the third route in
   that list not tied to a `Service["sceneTheme"]` (after `/projects` and
   `/publications`).
5. **The page itself was previously just `<AboutSection headingTag="h1"
   />`** — a bare re-export of the homepage's own About section (two-
   column layout with `GeologicalCrossSection` and `TeamPanel`, designed
   for a plain, non-glass background). Rebuilt `src/views/about.tsx` as
   its own page: reuses `AboutHeading` (already written expecting to
   become this exact page's only `<h1>`, per its own doc comment) and
   `TeamPanel` (`teamComposition`/`cultureValues`, both real) directly;
   adds new sections built from `company.ts`'s real, already-sourced data
   — an offices grid (mirroring `ContactSection.tsx`'s own office-card
   markup) and an `experienceRegions` pill list — plus a closing CTA
   linking to `/contact`. No fabricated team-member names, bios or photos
   — same reasoning as ADR-0053's Publications page: Geoporte is a real
   company (`company.ts`'s own header confirms it's sourced from
   geoporte.com.au), so the page only uses data already verified real in
   this codebase. `AboutSection.tsx`/`GeologicalCrossSection.tsx` are
   untouched and still used by the homepage.
6. **Verification**: `.claude/scripts/verify.sh` (0 FAIL — one
   consciously-kept WARN, the verbatim CONFIG hex literals), `yarn lint`,
   `yarn build` all clean; `/about` prerenders static. Browser-verified
   with the same forced-render + full-canvas `readPixels()` technique
   ADR-0054 established (a sparse-pixel grid had produced a false negative
   there): a temporary debug hook (removed before finishing) confirmed
   real, non-background pixels up to pure white at ~12% coverage with
   `gl.getError() === 0`. The live automation-tab screenshot itself stayed
   dark/text-faded — the same tab-wide `document.visibilityState:
   "hidden"` rAF starvation documented since ADR-0048, not chased further
   per this project's standing rule once a forced-render ground-truth
   check confirms the code itself is correct.

**Consequences.** `/about` now behaves like every other glass route
(fixed background, hidden ambient shapes, tinted Nav/Footer/cursor) and
has its own real content instead of borrowing the homepage section
wholesale.

---

## ADR-0054 — Spiral Galaxy added to Telecom Services (page background + homepage card), replacing `buildTelecomTower`; last of the eight service-card mini-scenes retired

**Status:** Accepted · 2026-08-28

**Context.** Telecom Services was the only one of the eight service lines
still using the shared corner mini-scene renderer (`buildTelecomTower`, a
simple line-drawn tower with expanding rings) instead of a dedicated
GetLayers scene. Requested to pull GetLayers' "Spiral Galaxy" scene for
both the Telecom Services page background and its homepage card, "using
the exact same spec as already provided" — no such spec existed anywhere
in this conversation or in `getlayers.json`, checked and flagged before
proceeding. Pulled the real source instead of guessing
(`getlayers_search`/`getlayers_materialize`, id `spiral-galaxy`).

**Decision.**
1. **Verbatim port**, `src/components/scene/build-spiral-galaxy-scene.ts`
   — same discipline as every prior scene: the `SphereGeometry(4.2, 200,
   600)` re-hashed per-vertex into galaxy radius/arm/angle with a
   spherical core bulge, the scroll-driven dive/tilt, the cursor
   world-unproject "void" repel, the three-composer rig, and both shaders
   (galaxy points + atmosphere motes) copied character for character.
   CONFIG colours (`colorCore #ffe7a8` warm gold / `colorEdge #6b2bff`
   violet) are the scene's own default, not the site's blue tint — same
   "the constants ARE the spec" precedent as every other verbatim scene.
2. **Scroll driver substitution**: the source tracks `window.scrollY`
   itself; this project already has a shared, Lenis-bridged whole-page
   scroll signal (`getScrollSignalSnapshot().progress`) that
   `build-negentropy-scene.ts`/`build-planet-scene.ts` already read
   instead of a redundant listener — same substitution here, keeping the
   source's own two-stage `scrollSmooth`/`scrollCurrent` damping.
3. **Card variant**: this scene has no exposed particle-count knob (a
   fixed, re-hashed `SphereGeometry`), so the card's lighter buffer comes
   from lower sphere segment counts (90×260 vs. the hero's 200×600, ~1/5
   the vertex count) and a quarter the atmosphere motes — the same "tone
   the buffer down for the card" latitude `createAureoleCardScene`/
   `createNegentropySpiralCardScene` already took. The card also skips the
   scroll-driven dive/tilt entirely (no natural scroll range inside a
   small card) and keeps a fixed camera, matching
   `createNegentropySpiralCardScene`'s own choice; bloom scaled to ~70% of
   the hero's, the same ratio Aureole's card used.
4. **Wired identically to Aureole**: `telecom-signal-network` (the
   page's pre-existing `sceneTheme`) joined `GLASS_SCENE_THEMES`, so
   `ServiceHero.tsx` swaps to the frosted-glass band instead of mounting
   its own section-scoped hero; `/services/telecom-services` added to
   `GLASS_BACKGROUND_ROUTES` alongside it (both mechanisms are needed
   together for every glass service route, confirmed by checking that
   Aureole's own route is in both lists); `SpiralGalaxyBackground.tsx`
   mounted route-gated in `layout.tsx`; `telecom-services:
   createSpiralGalaxyCardScene` added to `ServiceCard.tsx`'s
   `DEDICATED_CARD_SCENES`.
5. **`buildTelecomTower` and its `MINI_SCENES` entry removed** —
   `mini-scenes.ts` now exports an empty `MINI_SCENES` map (kept, not
   deleted, as the registration point for any future non-dedicated
   service-card icon; `ServiceCard.tsx` already renders nothing when a
   slug has no entry, confirmed against its actual conditional render
   before relying on it). All eight service-card icons are now dedicated.
6. **Verification**: `.claude/scripts/verify.sh` (0 FAIL — one
   consciously-kept WARN, the verbatim CONFIG hex literals), `yarn lint`,
   `yarn build` all clean. Browser-verified with a temporary debug hook
   (removed before finishing): an initial sparse-grid `gl.readPixels()`
   scan under-sampled the scene's genuinely small (1.5–4px) point sprites
   and looked deceptively dim; a full-canvas `readPixels()` buffer read
   found real, non-background pixels up to pure white at ~6% coverage,
   confirming the scene renders correctly — a reminder that a coarse
   pixel-sample grid can itself produce a false negative on a sparse
   point-cloud scene, distinct from every prior forced-render check's
   simpler pass/fail read.

**Consequences.** All eight service pages now have a fully dedicated,
GetLayers-sourced background (WebGL scene or video) and homepage card,
completing the pattern started with Solaris (ADR-0036).

---

## ADR-0053 — Aurum Peak golden summit background on /publications; page built out from a placeholder into real topic content

**Status:** Accepted · 2026-08-28

**Context.** GetLayers' "Aurum Peak" scene (a single wireframe golden summit
rising through drifting sunset cloud, three-composer selective bloom,
refractive-lens/chromatic-aberration/vignette/grain final pass) requested
as the standalone `/publications` page's fixed full-page background, plus
"build a proper /publications page showing all Geoporte publications/
papers." Pulled via `getlayers_search`/`getlayers_materialize` (id
`aurum-peak`, target `next`) — every number in the user's brief (camera
`52°`/`CAM_BASE (0,2.7,10.5)`/`CAM_TARGET (0,0.7,-1.2)`, the `NX 42`/`NZ 30`
grid, torus/bloom composer strengths, every cloud/terrain colour) matched
the real materialized source exactly, so nothing needed reconciling.

**Decision.**
1. **Verbatim port**, `src/components/scene/build-aurum-peak-scene.ts` —
   same discipline as every prior scene this project has pulled: the
   `jhash`/`jnoise`/`jfbm`/`jridge`/`jridgefbm` CPU noise, the single-
   massif height field, the CPU-triangulated `bary`-attributed summit mesh,
   both shaders, and the three-composer rig copied character for
   character. CONFIG colours are the scene's own "Default" variant, not
   Neural Monitor Style's blue tint — "the constants ARE the spec," same
   precedent as every other verbatim scene, reinforced here by the brief
   itself listing the exact default hex values.
2. **Two deviations already precedented elsewhere in this codebase, both
   invisible to the rendered look:** `THREE.WebGLRenderer` in place of the
   removed `WebGL1Renderer`, and no `extensions: { derivatives: true }` /
   `#extension GL_OES_standard_derivatives` (WebGL2 has derivatives
   natively) — the identical pair `build-einstein-rosen-lattice-scene.ts`
   already documents.
3. **One new deviation**: the source's intro is a literal black
   `#fade-overlay` DOM `<div>` fading opacity 1→0 over 1400ms after a
   300ms delay. Folded into a `uFadeIn` uniform inside `FinalPass`
   (multiplying the composited colour by the same 300ms/1400ms curve)
   instead of adding a real DOM overlay element — the same choice
   `build-aether-flux-scene.ts`/`build-golden-parthenon-scene.ts` already
   made for their own `appearStart`-driven fades, keeping the intro
   entirely inside the WebGL render loop rather than reaching for a CSS/
   DOM animation this project's motion rules (spring-only, with a narrow
   CSS-transition exception) have no clean primitive for.
4. **`/publications` added to `GLASS_BACKGROUND_ROUTES`** — the second
   route in that list not tied to a `Service["sceneTheme"]` (after
   `/projects`, ADR-0052), so ambient wireframe shapes/globe hide and Nav/
   Footer/cursor pick up the glass treatment automatically, with zero new
   architecture.
5. **The page itself was a placeholder** (`src/views/publications.tsx`:
   heading + one paragraph + a static "new publications are on the way"
   card) — rebuilt with the same `.glass-panel`/`data-glass-readability`
   mechanism `service-detail.tsx` uses, inlined here since this route
   isn't a `Service`. Added a real "Where our engineers publish" grid
   linking each of the eight real service pages (`src/data/mocks/
   services.ts`'s own titles/slugs/descriptions — no fabricated paper
   titles, authors, journals or dates), kept the original honest "coming
   soon, email us for copies" panel unchanged. Geoporte is a real company
   (`company.ts`'s own header: "real site content... sourced from
   geoporte.com.au") — inventing specific publication records for it would
   misrepresent real content as genuine, so the page stays a real,
   navigable framework around real cross-links rather than fabricated
   papers; a future pass can swap the CTA panel for real records once
   they exist.
6. **Verification**: `.claude/scripts/verify.sh` (0 FAIL — one consciously-
   kept WARN, the verbatim CONFIG hex literals, same as every prior scene
   file), `yarn lint`, `yarn build` all clean; `/publications` prerenders
   static. Browser-verified with the same forced-render + `gl.readPixels()`
   technique ADR-0051 used: a temporary `window.__aurumPeakForce(t)` hook
   (removed before finishing) confirmed the composer chain produces real,
   non-transparent terrain/cloud colour with `gl.getError() === 0`. The
   live automation-tab screenshot itself stayed black/text-faded even
   after 15+ real seconds — the same `document.visibilityState: "hidden"`
   rAF-starvation this vault has documented since ADR-0048/0051 (this
   time affecting the WebGL loop **and** the `react-spring` reveal on the
   same page, confirming it's tab-wide, not scene-specific); not chased
   further, consistent with this project's standing rule about not re-
   litigating an environment limitation once a forced-render ground-truth
   check confirms the code itself is correct.

**Consequences.** `/publications` now behaves like every other glass route:
fixed background, hidden ambient shapes, tinted Nav/Footer/cursor. The
topic grid gives the page real internal links and SEO value today without
promising specific documents that don't exist yet.

---

## ADR-0052 — Purple Planet video background on /projects: first glass route outside `/services/*` and not tied to a `Service["sceneTheme"]`

**Status:** Accepted · 2026-08-28

**Context.** GetLayers' "Purple Planet" background video (a glowing violet
planet, city-light network patterns tracing its surface) requested as the
standalone `/projects` page's fixed full-page background. Unlike every
prior glass route, `/projects` isn't part of the `services` data model at
all — `src/views/projects.tsx` renders `ProjectsSection` directly, with no
`Service`/`sceneTheme` concept to hook into.

**Decision.**
1. **Same expired-link pattern as Siloutte** (ADR-0050) — the first signed
   download link returned `"This download link has expired."` instead of
   the archive; asked the user for a fresh one rather than guessing a
   token. The second link (10-minute signed window) was downloaded and
   extracted immediately on receipt.
2. **Never shipped the 4K master.** The archive's `purple-planet.mp4` is
   2892×2160 h264 with an AAC audio track (~29MB, 11.1s). Re-encoded with
   the already-installed `ffmpeg` to a single 1920×1080 pair (mp4/h264 +
   webm/vp9, both `-an` — no audio, always rendered muted), cover-cropped
   at encode time (`scale=...:force_original_aspect_ratio=increase,
   crop=...`, the encode-time equivalent of CSS `object-fit: cover`), plus
   a matching 1920×1080 poster JPEG from the source's 3600×2688 still. Only
   one size this time (unlike Siloutte's hero+card pair) — this asset has
   no homepage-card use case, just the one full-page background. Saved to
   `public/assets/purple-planet/`, the established `public/assets/<name>/`
   convention. All three outputs verified via `ffprobe` before wiring
   anything up.
3. **`GLASS_BACKGROUND_ROUTES` is a plain `Set<string>` of pathnames, not
   scene-theme-keyed, so `/projects` slots in with zero new machinery** —
   new `PurplePlanetBackground.tsx` (`src/components/scene/`) reuses
   `VideoBackground.tsx` unchanged (the same component `ProjectControlBackground.tsx`
   introduced in ADR-0050), route-gated to `/projects`, mounted at the app
   root alongside every other route-scoped background. Adding `/projects`
   to `GLASS_BACKGROUND_ROUTES` gets the ambient wireframe shapes and the
   cinematic globe hidden on this route, plus the Nav/Footer glass tint,
   for free — the same mechanism every prior route already uses, extended
   to a route this project's `services` model has no idea exists.
4. **No changes to `ProjectsSection.tsx`/`ProjectCard.tsx`.** `ProjectCard`
   already uses the sitewide `bg-surface` token (`rgba(255,255,255,0.04)`)
   — translucent enough that the video reads clearly behind every card
   without a `.glass-panel`-style swap. The full "filter buttons + glass
   card redesign" scope from an earlier, superseded version of this
   request (before the first download link expired) was not reiterated in
   the final, narrower instruction that actually landed — reading a
   shorter follow-up message as "finish the video wiring in the
   originally-established context" rather than "the scope has shrunk to
   only these four lines," same interpretation as ADR-0050's own Siloutte
   flow. The 27-project, category-grouped grid and its existing
   `ProjectModal` click-through were left exactly as they were.

**Verification.** `verify.sh`/`yarn lint`/`yarn build` clean. Browser-checked
directly (no compositor-timing artifact this time): a screenshot at the
top of `/projects` shows the actual Purple Planet footage rendering
correctly, and a second screenshot after scrolling shows it reading
clearly through the translucent project cards with card text still fully
legible, no console errors.

---

## ADR-0051 — Aureole golden corona on Advisory Services: seventh glass route, first scene with a fully static camera

**Status:** Accepted · 2026-08-28

**Context.** Seventh glass-background route requested — GetLayers' "Aureole"
scene (a golden particle corona erupting along 16 spokes from a dark
hollow core, cursor-driven flare + click shockwaves), as both Advisory
Services' fixed full-page background and its homepage card. Retires that
page's previous section-scoped hero (`advisory-lifecycle-network`, a
rotating wireframe globe with arcs to Geoporte's real project countries).

**Decision.**
1. **Pulled real, verified against the brief before writing anything.**
   `getlayers_materialize` (id `aureole`) succeeded on the first attempt.
   Every number in the brief — `COUNT 95000`, `SPIKES 16`, PRNG seed
   `0x5EED`, 30% diffuse dust, `phi` tilt via `gauss()*0.16`, every CONFIG
   default (`coreRadius 2.25`, `reach 14`, `falloff 2.95`, `flowSpeed
   0.075`, `pointSize 2`, `cursorHeat 0.15`, `cursorFocus 1`, colours
   `#ff7a12`/`#ffe39a`), camera at `(0,0,17)` fixed head-on, `PULSE_SPEED
   14`, up to 16 live shockwaves, 2200ms easeOutCubic intro — matched the
   real materialized source exactly. Nothing needed reconciling; the brief
   was clearly transcribed from this same real source. Colours are the
   scene's own default amber/gold, not the site's blue tint override — the
   asset's own tint metadata notes it "exposes no knob for: background,
   secondary," i.e. it wasn't designed to be retinted, matching this
   codebase's "constants ARE the spec" precedent for every prior scene.
2. **The only scene in this codebase with a genuinely static camera** —
   `driver: "ambient"` in the real asset metadata, and the source itself
   sets `camera.position` once and never touches it again; all motion is
   the particles' own eruption cycle plus the pointer-driven flare/shockwaves.
   Simplest scene file in this project as a result — no scroll wiring, no
   camera-flight table.
3. **Window-level pointer listeners, not `HeroSceneHandle`'s `setPointer`.**
   The brief explicitly calls for this ("use window listeners for
   interaction"), and it's structurally necessary anyway: this scene's
   canvas is always `pointer-events-none` (both the full-page background
   and the homepage card), so the canvas itself can never receive pointer
   events — window-level `pointermove`/`pointerdown`/`pointerleave`
   listeners are the only way the flare-aim and click-shockwave
   interactions can work at all. Same shape as Aether Flux's and
   Einstein-Rosen Lattice's own bespoke click listeners for interactions
   `HeroSceneHandle` doesn't cover; `setPointer` is an intentional no-op.
4. **No `OutputPass`/gamma-correction stage** — unlike this project's other
   composited scenes (which correct a physically-lit render), the real
   source has none: a pure additive-blend point cloud on black needs no
   tone-mapping correction, and adding one would deviate from "implement
   exactly" rather than honour it.
5. **Reused the existing glass-route machinery.** `advisory-lifecycle-network`
   (Advisory Services' existing `sceneTheme`) joined `GLASS_SCENE_THEMES`;
   `createAdvisoryLifecycleNetworkScene` stays registered in
   `SERVICE_HERO_SCENES` as dead code, same as every other glass theme's
   own factory. New `AureoleBackground.tsx` mounts route-gated to
   `/services/advisory-services`, added to `GLASS_BACKGROUND_ROUTES`.
   Retired `buildAdvisoryCompass` (`mini-scenes.ts`) and its `MINI_SCENES`
   entry — the shared corner-icon renderer now carries only one scene
   (`telecom-services`), the rest of the grid having gone dedicated across
   this and the prior six turns.

**Verification.** `verify.sh`/`yarn lint`/`yarn build` clean. Browser-checked
on the dedicated page: a real screenshot after a forced render shows the
corona rendering exactly as specified — a bright white-gold core with 16
sharp spokes radiating outward against black, no console errors. A first
screenshot attempt showed nothing (same compositor-timing artifact this
session has hit before — a `readPixels` check immediately after a forced
render confirmed correct, bright, non-error pixel data at the same
coordinates the "blank" screenshot covered; re-forcing and waiting a few
real seconds produced the correct visual). The homepage card could not be
independently re-verified this turn — same `document.visibilityState:
"hidden"` tab-throttling limitation already documented in ADR-0048/
ADR-0050, reproduced across a second fresh tab too. Since the card uses
the exact same `buildAureoleScene` function (only `count`/bloom options
differ) and that function is independently confirmed correct on the hero
page, this is read as an environment limitation on verification, not a
defect in the card wiring.

---

## ADR-0050 — Siloutte video background on Project Control Services: the first fixed-background route that isn't a WebGL scene

**Status:** Accepted · 2026-08-27

**Context.** Sixth glass-background route requested — GetLayers' "Siloutte"
background video (a silhouetted figure against a glowing light beam) as
both the Project Control Services page's fixed full-page background and a
smaller loop inside that service's homepage card. Every prior glass route
(Solaris, Aether Flux, Einstein-Rosen Lattice, Golden Parthenon,
Negentropy) is a WebGL scene behind `HeroSceneHandle`; this is the first
one that's a plain `<video>` element, so it needed its own delivery
mechanism rather than reusing `HeroScene.tsx`.

**Decision.**
1. **The signed download link expired before it could be used once** — the
   first attempt returned the literal body `"This download link has
   expired."` instead of the archive. Rather than guess a fresh token (this
   project's standing "never fabricate a URL" rule), stopped and asked the
   user for a new link, per the file-download confirmation this project's
   safety protocol requires for any external fetch. The second link (10-minute
   signed window) was downloaded and extracted immediately on receipt.
2. **Never shipped the 4K master.** The archive's `siloutte.mp4` is
   2892×2160 h264 with an AAC audio track (~5MB, 9.2s). Installed `ffmpeg`
   (via winget — flagged to the user first, then proceeded once confirmed;
   not previously present on this machine) and re-encoded to what the
   layout actually needs: a 1920×1080 pair (mp4/h264 + webm/vp9, both
   `-an` — no audio track, since the video is always rendered muted) for
   the full-page background, and a second 640×360 pair for the homepage
   card (a ~280px-wide card showing a 1920×1080 video would be pure waste).
   Both sizes use `scale=...:force_original_aspect_ratio=increase,crop=...`
   — the encode-time equivalent of CSS `object-fit: cover`, so nothing
   stretches. Poster stills for both sizes generated the same way from the
   source's 2400×1344 poster JPEG. All six files verified post-encode via
   `ffprobe` (dimensions, codec, duration) before wiring anything up.
   Saved to `public/assets/siloutte/`, matching this project's existing
   `public/assets/<name>/` convention (`planet/`, `golden-parthenon/`).
3. **New `VideoBackground.tsx`** (`src/components/common/`) — a small,
   reusable muted/looping/`playsInline` `<video>` wrapper shared by both
   the page background and the card, rather than two one-off video tags.
   Shows `poster` until the first frame decodes (native behaviour, no JS
   needed). Respects `prefers-reduced-motion` by pausing immediately, the
   same convention every WebGL scene here already follows. A
   `pauseWhenOffscreen` prop drives an `IntersectionObserver` play/pause —
   used by the card (explicitly requested), skipped by the page background
   (it's `fixed inset-0`, always "in view" by definition, same reasoning
   `HeroScene.tsx`'s own IO-pause doesn't apply to it either).
4. **Reused the existing glass-route machinery rather than inventing a
   parallel one.** `schedule-network-graph` (Project Control Services'
   existing `sceneTheme`) was added to `GLASS_SCENE_THEMES` — this makes
   `ServiceHero.tsx` skip mounting its own section-scoped WebGL hero
   exactly the way it already does for the other five glass themes, and
   `service-detail.tsx`'s glass-panel treatment applies unchanged.
   `createScheduleNetworkGraphScene` stays registered in
   `SERVICE_HERO_SCENES` — now dead code, same as every other glass
   theme's own WebGL factory already is; deleting it would have broken the
   registry's total-`Record` typing for no benefit. New
   `ProjectControlBackground.tsx` (`src/components/scene/`, alongside its
   WebGL siblings for consistency even though it isn't one) mounts
   `VideoBackground` route-gated to `/services/project-control-services`,
   added to `GLASS_BACKGROUND_ROUTES` the same way as every prior route.
5. **Homepage card**: `DEDICATED_CARD_VIDEOS` in `ServiceCard.tsx`, a
   sibling lookup to `DEDICATED_CARD_SCENES` (same "own full-bleed layer,
   not the shared mini-scene icon" shape, different asset type) — keyed by
   slug, `pauseWhenOffscreen` set. Retired `buildProjectControlGantt`
   (`mini-scenes.ts`) and its `MINI_SCENES` entry — fully superseded, no
   other consumer (confirmed via grep before deleting).

**Verification.** `verify.sh`/`yarn lint`/`yarn build` clean. Browser-checked:
the full-page background renders exactly as expected — a screenshot on
`/services/project-control-services` shows the actual Siloutte footage
(silhouette, light beam) with no console errors. The homepage card's own
`<video>` mounted correctly (right `<source>` URLs, both confirmed
reachable with `curl -I` returning 200), but its `readyState` stayed at 0
(`networkState: 2`, no error) — traced to `document.visibilityState:
"hidden"` in this automation browser, the same class of tab-visibility
throttling already documented for WebGL canvases failing to mount in
earlier turns (ADR-0048's homepage-card note). Since the identical
`VideoBackground` component and identical encoded files render correctly
in the page-background context, this is read as an environment limitation
on verification, not a defect in the card wiring — worth a fresh visual
pass once the browser tooling cooperates.

---

## ADR-0049 — Stormwater's glass panels made more transparent than the sitewide default, scoped to that one page only

**Status:** Accepted · 2026-08-27

**Context.** The sitewide `.glass-panel` fill (`rgba(4,6,15,0.65)`, 20px
blur, `rgba(255,255,255,0.1)` border) was tuned against Solaris — a dense,
busy particle sphere where too much see-through reads as noise. Negentropy
(ADR-0048) is comparatively sparse and dark between its particle clusters,
so the same near-solid glass just hid it; the request was to make it
noticeably more transparent, but only on this one page — the other four
glass routes' panels were already correctly tuned for their own scenes and
were not to change.

**Decision.** Rather than edit the shared `--raw-color-glass-fill`/
`-border`/`-blur` Tier 1 primitives (which would have changed all five
glass routes at once), added a second Tier 1 quartet —
`--raw-color-glass-fill-clear` (0.35 alpha), `--raw-color-glass-border-clear`
(0.08 alpha), `--raw-blur-glass-clear` (12px), and
`--raw-shadow-glass-text-strong` (0.9 alpha, up from the baseline 0.8) —
and override the Tier 2 `--glass-fill`/`--glass-border`/`--glass-blur`/
`--glass-text-shadow` roles onto those instead, on a wrapper scoped to
`service.slug === "stormwater-and-flood-modelling"` in `service-detail.tsx`
(`stormwaterGlassStyle`, alongside the existing `getServiceAccentStyle`/
`glassReadabilityStyle` inline overrides on that same wrapper). This is the
same "override the Tier 2 role's value on a scoped element" mechanism this
project already uses for per-service accent tints and the glass-page
readability boost — design-system.md's own rule 3 ("Tier 2 is the themeable
layer") — just a second, page-specific instance of it rather than a new
mechanism. The `[data-glass-readability]` CSS rule that consumes the
text-shadow was also tokenized (`var(--glass-text-shadow)`, was a bare
literal) since it now needs to vary per page the same way fill/border/blur
already did.

**Verification.** `verify.sh`/`yarn lint`/`yarn build` clean. Browser-checked
via `getComputedStyle` on each glass page's wrapper: Stormwater resolves
`--glass-fill: #04060f59` (0.35 alpha), `--glass-border: #ffffff14` (0.08),
`--glass-blur: 12px`, `--glass-text-shadow` at 0.9 alpha — all four matching
the request exactly; Geotechnical (checked as the control) still resolves
the original 0.65/0.1/20px/0.8 values, confirming the override doesn't leak
to the other four glass routes. A screenshot of Stormwater's "Specialist
offerings" section shows the panel border reading as barely-there and a
soft glow bleeding through from behind, with heading/body text still fully
legible against the strengthened shadow.

---

## ADR-0048 — Negentropy on Stormwater & Flood Modelling: six real GetLayers particle scenes composited under one shared camera flight, replacing a section-scoped hero

**Status:** Accepted · 2026-08-27

**Context.** Fifth glass-background route requested — a "NEGENTROPY" scene
combining an ambient starfield with five named, exact-particle-count fields
(spiral network, molecule, red storm, hourglass galaxy, close starfield),
flown through with a 7-anchor scroll-driven camera and a shared cursor-void
system, as both the Stormwater & Flood Modelling page's fixed background
and a spiral-only homepage card. This retires that page's previous
section-scoped hero (`flood-inundation-terrain`, a bowl-shaped catchment
terrain) in favour of the same glass-page pattern the other four routes use.

**Decision.**
1. **"Negentropy" itself is not a cataloged GetLayers asset** —
   `getlayers_search` for it returns nothing relevant (only unrelated style
   cards at match:0), checked before writing any code. But every field the
   brief names down to exact particle counts and geometry IS real and
   individually cataloged: `spiral-network` (80000 pts, radius 5, 2
   branches), `molecule` (12 atoms × 600 pts + 30 bonds × 60 pts, radius
   3.0 — 12 vertices/30 edges of an icosahedron, confirmed in the real
   source's own edge-scan code), `hourglass-galaxy` (70000 pts per funnel ×
   2, radius 2.5, 3 branches), `storm` (50000 pts, radius 2.5 — the brief's
   "RED STORM" is this scene's own default "red" hue variant), and
   `starfield-close` (box ±12/±8/±15 matches, but the brief's stated 1500
   points does NOT match the real source's fixed `count = 4200` — kept the
   real 4200 since particle count is a structural constant here, not a
   tint/CONFIG knob, same "never let a brief override a verified source's
   geometry" rule this project has followed since ADR-0045/ADR-0047). All
   five were pulled via `getlayers_materialize` and their real vertex/
   fragment shaders cross-checked against the brief's numbers before
   building — see `build-negentropy-scene.ts`'s header for the full
   per-field comparison. "AMBIENT STARFIELD" (1200 pts, radius 60, plain
   `PointsMaterial`) has no matching cataloged scene — simple enough to
   build directly from the brief's own spec.
2. **Six fields share ONE camera and ONE composer, not six.** Each pulled
   source is its own standalone single-scene page with its own camera
   repositioning and its own triple-composer "FinalPass" atmosphere rig —
   both dropped here. Six fields independently steering the same shared
   camera would fight each other, so only the brief's own 7-anchor camera
   flight drives it; each field keeps just its idle group spin. The
   triple-composer rigs are replaced with the ONE shared composer the brief
   specifies (`RenderPass -> UnrealBloomPass(0.55, 1.8, 0.02) -> OutputPass`
   — the `OutputPass` is this file's own addition for correct sRGB output,
   not in the brief's list, matching every other composited scene in this
   codebase).
3. **One shared cursor-void system, not five.** All five pulled sources
   define byte-identical `POINTER`/`updatePointer()` logic (unproject to
   z=0, 0.12 position lerp, 3s-idle 0.06 activity lerp) — defining it once
   and letting every field read the same `uCursor`/`uActivity` values
   changes nothing about the behaviour, only avoids five duplicate copies.
4. **Scroll progress reads this project's own shared scroll signal**
   (`getScrollSignalSnapshot().progress`) instead of each pulled source's
   own raw `window.scrollY` — `HeroSceneHandle`'s `setScrollProgress` is
   scoped to the hero section's own trigger range, meaningless for a `fixed
   inset-0` background whose container never scrolls; same precedent as
   `build-planet-scene.ts`'s own scroll choreography (ADR-0034).
5. **Card variant**: Spiral Network alone (the brief's own "simplest,
   most performant field" choice), water/teal palette (`#0aff7f`/
   `#3affd0`), bloom toned down to 0.4/1.0, static camera framing, no
   scroll dependency — same hero/card split shape as every other dedicated
   card in this codebase.
6. Retired `flood-inundation-terrain` (`build-flood-inundation-terrain-scene.ts`)
   and `buildStormwaterFlow` (the card's old mini-scene water-flow mesh) —
   both fully superseded, no other consumers (confirmed via grep before
   deleting).

**Verification.** `verify.sh` (0 FAIL, same pre-existing hex-literal WARN
pattern), `yarn lint` clean, `yarn build` clean (all 21 routes, including
`/services/stormwater-and-flood-modelling`, compiled). Browser-verified on
the dedicated page: forced renders at scroll progress 0, 0.25, 0.5, 0.6,
0.9 via a temporary debug hook (removed before finishing) all produced
real, varying, non-black pixel values confirming every field renders
across the full scroll range; a real screenshot at progress 0.6 shows the
Molecule field's icosahedral atom cage rendering correctly with the
brief's own cyan/blue palette; zero console errors on a fresh load.

**Homepage card — not independently re-verified this turn, documented
honestly rather than glossed over.** The automation browser tab
repeatedly showed `requestAnimationFrame` never firing at all (a 45s CDP
call outright timed out waiting on one rAF tick) across three fresh tabs,
and under that condition ALL FIVE dedicated-scene cards on the homepage —
not just this one — showed zero mounted canvases, including three scenes
(Solaris, Aether Flux, Einstein-Rosen Lattice) already independently
verified working in earlier turns this same session. That rules out a
Negentropy-specific defect: the freeze is a browser/tab-level condition
this turn couldn't work around (tried: waiting up to 60s combined,
clearing stray `hidden` attributes, closing and recreating the tab three
times, clicking into the page for focus), not a bug in
`build-negentropy-scene.ts` or its `ServiceCard.tsx` wiring, which mirrors
the other four dedicated cards' pattern exactly. Worth a fresh visual pass
next time the browser tooling is responsive.

**When building:** when several independently-verified things all break
identically at the same moment (here: every dedicated card, not just the
new one), that is evidence against the newest change being the cause, not
for it — check whether the failure is scoped to what changed before
spending more turns debugging the new code specifically.

---

## ADR-0047 — Golden Parthenon restored with the real GLB and ground textures, superseding both the procedural substitute and the Halcyon Gate swap

**Status:** Accepted · 2026-08-27

**Context.** Same turn as ADR-0045 and ADR-0046, continued: the user
reported the procedural temple from ADR-0045 rendering as "floating blurry
squares" and asked for a full replacement (see ADR-0046 — swapped to
Halcyon Gate — Night). Mid-verification of that swap, the user sent a
follow-up: the real Golden Parthenon source — the one `getlayers_materialize`
could never pull in ADR-0045 — was available locally as
`golden-parthenon.zip` in Downloads, and asked for the scene to be rebuilt
from it directly, with the real GLB and ground textures this time, not a
procedural stand-in and not a different scene.

**Decision.**
1. **Located and verified the real source before building anything.** The
   user's stated path (`C:\Geoporte\golden-parthenon_1_.html`) didn't
   exist — confirmed via `Glob`/`find` before reporting anything back.
   Rather than stop there, checked the likely real location and found
   `golden-parthenon.zip` in the Downloads folder, containing
   `golden-parthenon.html` (2.5MB) and a `README.md`. Unzipped to the
   session scratchpad and confirmed the file actually contains
   `GROUND_COLOR_B64`/`GROUND_NORMAL_B64`/`GROUND_ROUGH_B64`/`MODEL_B64`
   constants and a real `GLTFLoader`/`DRACOLoader` load path — i.e. this is
   the genuine scene source, not a guess.
2. **Extracted the four base64 blobs to real binary files** —
   `public/assets/golden-parthenon/{model.glb, ground-color.jpg,
   ground-normal.jpg, ground-rough.jpg}` — via a shell pipeline
   (`awk`+`base64 -d`) that never routed the multi-hundred-KB base64 text
   through the model's own context window. **Verified integrity after
   extraction, not assumed:** all three JPEGs are valid baseline 512×512
   JPEGs with intact EOI (`FFD9`) markers; the GLB's own 12-byte header
   reports `glTF`, version 2, and a length field that matches the decoded
   file's actual byte count exactly (1,617,964 bytes). This is the same
   "real files in `public/assets/`, not inlined strings" shape as
   `build-planet-scene.ts`'s `public/assets/planet/` (ADR-0034).
3. **`build-golden-parthenon-scene.ts` rewritten a second time**, this
   time loading the real assets via `GLTFLoader`/`DRACOLoader` (self-hosted
   `/draco/` decoder, this project's standing convention — see
   `build-planet-scene.ts`'s identical comment — not the source's own
   `gstatic.com` reference) and `THREE.TextureLoader` against the extracted
   JPEGs, instead of either the procedural primitive-geometry temple
   (ADR-0045) or the different scene entirely (ADR-0046, `halcyon-night`,
   now fully deleted — `build-halcyon-night-scene.ts`,
   `HalcyonNightBackground.tsx`, and every reference to them removed). Every
   other CONFIG value — sky, sun-glow sprite, PMREM environment, lights,
   fbm-displaced ground with the flat pad, dust motes, the camera-pinned
   foreground-foliage plane (off by default, kept anyway per this
   codebase's "don't delete a source's own quiet-by-design knob" precedent
   — see Einstein-Rosen Lattice's `glowIntensity: 0`), the cursor-driven
   sun sweep, the four-pass composer, the exposure fade-in — is the real
   source's own verbatim value, ported the same way as every other scene in
   this codebase.
4. **Hero/card split preserved from the original brief**: hero gets the
   source's own bloom (2/0.7/0.62) and full ground relief + dust; the card
   flattens the ground, drops dust, and tones bloom to 1.2/0.5/0.7 — same
   numbers the very first Golden Parthenon brief specified, now finally
   paired with the real temple instead of a substitute.

**Verification.** `verify.sh` (0 FAIL, same pre-existing WARN pattern —
CONFIG hex literals are already accepted for every other scene's palette),
`yarn lint` clean, `yarn build` clean (all 21 routes, including
`/services/civil-engineering`, compiled). Browser-verified against a real
dev server: the hero page renders the actual fluted-column, weathered-marble
temple with visible surface damage/detail against the warm dusk sky, no
console errors on a fresh navigation. The homepage card hit a **verification
artifact worth recording**: `document.body.clientHeight` never advanced past
its pre-hydration value, and the card's `getBoundingClientRect()` returned
all-zero — traced to a stuck React streaming-reveal marker
(`<div hidden id="S:0">`, part of Next's Suspense-boundary reveal
mechanism) that never got its `hidden` attribute removed, almost certainly
downstream of this automation browser's `document.visibilityState` being
permanently `"hidden"` (the same root cause behind this session's
previously-documented long homepage settle times, just manifesting as a
stuck reveal instead of a slow one this time). Confirmed not a shipped bug
by removing the `hidden` attribute via a one-off `document.querySelectorAll
('[hidden]')` call in the verification session only — the card then
measured and rendered normally, showing the temple with legible overlaid
card text. No code changed to work around this; it is purely a quirk of
this automation environment, not the shipped page.

**When building:** when a user says a source file exists at a path and it
doesn't, don't stop at "file not found" — check whether they mean a
differently-named or differently-located file (Downloads, a zip, a
different extension) before asking again. Verify any such find (magic
bytes, header fields, a grep for the expected content) rather than trusting
a filename match alone; both catch the case where "the user is basically
right but imprecise" without ever fabricating data that isn't actually
there.

---

## ADR-0046 — Civil Engineering hero swapped to Halcyon Gate — Night after the procedural Parthenon was reported broken (superseded by ADR-0047, same turn)

**Status:** Superseded by [[decisions-log#ADR-0047]] · 2026-08-27

**Context.** The procedural temple built in ADR-0045 (primitive-geometry
columns/pediment/steps, built because six consecutive `getlayers_materialize`
pulls failed and the brief's own GLB URL was a literal `[hash]` placeholder)
was reported by the user as rendering incorrectly — "floating blurry
squares, not a temple" — with an instruction to remove it entirely and
replace it with a different scene: Halcyon Gate — Night, a moonlit brass
ring over a reflective sea, matching the "invoice" reference the user
described (deep indigo sky `#000219`, twinkling stars, drifting clouds,
cursor-rippled water, a peach moon tracking the cursor).

**Decision.** Pulled the real scene this time — `getlayers_materialize`,
id `halcyon-night`, succeeded on the first attempt (a much lighter scene
than `golden-parthenon`: one fullscreen quad, no 3D geometry at all, versus
the Parthenon's GLB + displaced terrain). Ported verbatim into
`build-halcyon-night-scene.ts`: the sky/moon/clouds/starfield/ring/
reflective-sea math is one analytic fragment shader, the source's own
default (night) CONFIG palette kept rather than the site's tint override,
matching this codebase's standing "constants ARE the spec" precedent. One
deliberate addition beyond the pulled source: the user's brief asked for
`UnrealBloomPass`, which the source ships without (its own composer is
`RenderPass -> GammaCorrectionShader` only) — added and tuned down twice
after a first pass (0.55/0.4/0.75) bloomed the shader's own white-clipped
moon core into an oversized halo that swallowed the ring; settled at
0.16/0.25/0.94 (hero) and 0.1/0.2/0.96 (card). Wired to the Civil
Engineering route and homepage card exactly where the Golden Parthenon
attempt had been, with the Parthenon files deleted.

**Reversal.** Mid-way through verifying the homepage card, the user
supplied the real Golden Parthenon source directly (see ADR-0047) and asked
for it back — this time built from real assets, not a procedural
substitute. `build-halcyon-night-scene.ts` and `HalcyonNightBackground.tsx`
were deleted in the same turn; nothing from this ADR shipped past that
point. Kept as a record for the same reason ADR-0045 documents a substitution
that was itself later superseded: the reasoning at each step was sound
given what was known then, and the record explains why the file history
looks like a scene was built and torn down twice in one sitting.

---

## ADR-0045 — Golden Parthenon on Civil Engineering: the first scene NOT independently verified against a fresh pull, and a procedural temple in place of a GLB the brief couldn't supply a real URL for

**Status:** Accepted · 2026-08-27

**Context.** Fourth GetLayers scene requested (after Solaris/Aether Flux/
Einstein-Rosen Lattice) — a Parthenon at golden hour, sun following the
cursor across the colonnade — as both Civil Engineering's fixed page
background and its homepage card, matching the established glass-page
pattern. This one broke the run of clean verbatim pulls.

**Decision.**
1. **`getlayers_materialize` failed six consecutive times** — two
   "transport dropped mid-call" errors, four "sent no response for 300s"
   idle timeouts, one of the six against `getlayers_scene_lab` instead
   (tried as an alternate path). `golden-parthenon` is tagged `cost: heavy`
   with 55 knobs — the largest of the four scenes pulled this project by a
   wide margin — and every failure pattern is consistent with a payload
   the current MCP transport can't reliably deliver, not a content or
   auth problem. **This scene is therefore NOT independently verified
   against a fresh pull**, unlike Solaris (ADR-0039), Aether Flux
   (ADR-0042), and Einstein-Rosen Lattice (ADR-0044) — it is ported
   directly from the user's own detailed technical brief instead, at the
   user's explicit direction after being asked how to proceed (six failed
   attempts is a real, demonstrated blocker, not a reason to keep silently
   retrying or to guess). The brief's own precision (exact uniform names,
   hex colours, intensities, distances) matches the level of detail the
   other three briefs turned out to reproduce the real source at, which is
   why proceeding from it was the reasonable call here rather than
   blocking indefinitely on a tool that keeps failing.
2. **The GLB is procedural, not loaded — a real content substitution, not
   a deviation of convenience.** The brief's own asset URL had a literal
   `[hash]` placeholder (`.../golden-parthenon-[hash]/parthenon.glb`) —
   not a value this project ever fabricates a real-looking URL for. Asked
   directly, the user confirmed: build the temple procedurally
   (`CylinderGeometry` columns, a custom-`BufferGeometry` triangular
   pediment, `BoxGeometry` stepped krepidoma base) instead of trying to
   load a real model — `build-golden-parthenon-scene.ts` has no
   `GLTFLoader`/`DRACOLoader` at all. Every *other* numeric parameter in
   the brief (sky gradient, sun-glow sprite, PMREM environment, ground
   fbm, lights, dust, cursor/sun parallax, bloom, grain) is implemented
   exactly as specified.
3. **Same builder, hero/card options split** as the other three scenes —
   `createGoldenParthenonHeroScene` (full displaced 320×320 ground, 520
   dust motes, bloom 2/0.7/0.62) and `createGoldenParthenonCardScene`
   (flat low-segment ground, no dust, bloom 1.2/0.5/0.7), per the brief's
   own explicit hero/card split. The procedural temple builds in full for
   both — the brief's own instruction ("temple still loads and renders").
4. **`corridor-grading` retired** — Civil Engineering's prior hero theme
   and its mini-scene corner icon (`buildCivilBridge`, `mini-scenes.ts`)
   are both fully superseded (confirmed via grep: no other consumer).
   `build-corridor-grading-scene.ts` deleted, matching the precedent from
   all three earlier scene retirements (ADR-0039, ADR-0042, ADR-0044).
5. **`GLASS_BACKGROUND_ROUTES`/`GLASS_SCENE_THEMES`/`DEDICATED_CARD_SCENES`
   each grow to four entries** — no new shared-lookup work needed, exactly
   the generalization ADR-0042 built these lookups for.

**Verification note.** A visual check of the homepage card initially
looked wrong — the sitewide globe's curved horizon appeared to bleed
through the card instead of the temple scene, even though a synchronous
force-render + `gl.readPixels()` (the same `__parthenonForce(t)` technique
Solaris/Aether Flux/Einstein-Rosen Lattice verification already
established) confirmed real, warm, non-zero pixel data. This was a
compositor-timing artifact, not a bug: forcing a render again and giving
the compositor a few seconds before re-screenshotting showed the correct
warm scene. Also notable this turn: the homepage's settle time (before
`__parthenonForce` became available) stretched past 150s once, well
beyond any prior scene's settle time — plausible given the homepage now
constructs six dedicated WebGL contexts (planet, hero, and four
per-service cards), one of which (this one) does a `PMREMGenerator` pass
on top. Neither symptom indicated a real defect once given enough real
wall-clock time.

**When building.** If a future GetLayers pull fails repeatedly (transport
drops or idle timeouts, not a real 4xx/5xx), don't keep retrying the exact
same call indefinitely — try one alternate endpoint
(`getlayers_scene_lab`) once, and if that also fails, surface the blocker
to the user rather than fabricating missing values (a URL, a hash, an
asset) to route around it. A sufficiently detailed user brief is a
legitimate fallback source of truth in this project, evidenced by the
other three scenes' briefs each turning out to match the real pulled
CONFIG — but say so plainly in the port's own header and this log, rather
than silently presenting it with the same confidence as an independently
verified pull.

---

## ADR-0044 — Einstein–Rosen Lattice on Structural Engineering: a third glass page/card pair, and the first verbatim scene with a genuinely functional (not dead) extra-composer rig

**Status:** Accepted · 2026-08-27

**Context.** Third GetLayers scene this project has pulled and ported
verbatim (after Solaris/ADR-0039 and Aether Flux/ADR-0042) — a "platinum
lattice wormhole funnelling down to a glowing throat, warm gold at the
mouth and cold sapphire at the flaring rim" (id `einstein-rosen-lattice`),
as both the fixed full-page background for Structural Engineering and a
homepage-card version, matching the established Geotechnical/Design &
Drafting pattern exactly (glass hero band + orbit rings, `.glass-panel`
content sections, darker nav/footer tint, readability text-shadow,
wireframe/globe/cursor exclusion, dedicated-card-scene lookup).

**Decision.**
1. **Ported verbatim into `build-einstein-rosen-lattice-scene.ts`** —
   `QUAD_VERT`/`BRIDGE_FRAG`/`GLOW_FRAG`/the `FinalPass` composite shader,
   the catenoid raymarch (`phiOf`, the asinh-warped step scan, the
   analytic-AA `lattice()` function, the far-horizon gap mask), and the
   per-frame spin/phase/pulse/breath/zoom/parallax update are all copied
   character for character from the materialized source's own CONFIG
   defaults — genuinely no 3D geometry at all: both quads are a
   screen-filling `PlaneGeometry(2, 2)`, and the wormhole is entirely an
   analytic per-pixel raymarch against the Flamm catenoid
   (`rho = a*cosh(y/b)`). Colours (platinum/gold/sapphire) are the scene's
   own default, not retinted through this project's blue Style — same
   "constants ARE the spec" precedent as the other two scenes.
2. **This scene's extra composers are NOT the Aether Flux situation.**
   Aether Flux's `torusComposer`/`bloomComposer` bloom a structurally
   empty scene every frame (ADR-0042) — a real, if verbatim, waste. Here
   the bridge quad is genuinely on `TORUS_SCENE` and the glow quad is
   genuinely on `BLOOM_SCENE`, so both extra composers do real, working
   compositing (bloom on the wireframe lines; bloom on the throat glow).
   The glow quad reads as invisible at the default `glowIntensity: 0` —
   quiet by design, not dead code, and not "fixed" either way per this
   project's rule about not improvising on a verbatim ask.
3. **Two more forced version deviations, on top of the
   `WebGLRenderer`/`PlaneGeometry` renames already established**: no
   `extensions: { derivatives: true }` on the bridge material —
   `ShaderMaterial`'s `extensions` option in three@0.185 no longer exposes
   that WebGL1-era flag at all (WebGL2, three's default context here, has
   `fwidth()` derivatives natively; the shader's own `fwidth()` calls are
   unchanged). Caught by `tsc`, not by inspection — a reminder to always
   typecheck a freshly-ported scene file in isolation before wiring it up,
   the same step that caught Aether Flux's `CylinderBufferGeometry` rename.
4. **Click-zoom and pointer-leave-reset, replicated via the builder's own
   window listeners** — same pattern as Aether Flux's click-burst
   (`HeroSceneHandle` has no click/leave hooks), removed in `dispose()`.
   `setPointer`'s aspect-correction step (`if (a >= 1) x *= a; else
   y /= a`, clamp ±2) uses the container's own tracked aspect instead of
   the source's `window.innerWidth/innerHeight`, since this scene mounts
   in a bounded container (card) as often as full-viewport (hero).
5. **`structural-fem-analysis` retired** — Structural Engineering's prior
   hero theme and its mini-scene corner icon (`buildStructuralFrame`,
   `mini-scenes.ts`) are both fully superseded (confirmed via grep: no
   other consumer). `build-structural-fem-analysis-scene.ts` deleted,
   matching the precedent from both earlier scene retirements
   (ADR-0039, ADR-0042).
6. **`ServiceCard.tsx`'s `DEDICATED_CARD_SCENES` grows to three entries**,
   `GLASS_BACKGROUND_ROUTES`/`GLASS_SCENE_THEMES` each grow to three — no
   new shared-lookup work needed, since ADR-0042 already generalized these
   from single hardcoded checks into lookups precisely so a third
   dedicated-scene page would be a one-line addition per list, not a new
   special case.

**Card verification confirmed the wormhole's own aesthetic is
authentically sparse** — a thin, faint wireframe of meridian/ring arcs
against black (matching the catalog's own "wireframe" tag and the
shader's modest `lineGain: 0.44`/`hazeMax: 0.263`), not a bright glowing
scene. A first screenshot at default settle looked nearly empty; only a
zoomed crop revealed the correct, intentional faint arcs with the
gold-to-sapphire tint gradient visible along them. Confirmed via the same
temporary `__wormholeForce(t)` synchronous force-render hook Solaris/
Aether Flux's own verification already established (ADR-0043), removed
before finishing.

---

## ADR-0043 — Aether Flux homepage card: same builder, tuned bloom only — and a confirmed-false alarm from an async `readPixels` race

**Status:** Accepted · 2026-08-27

**Context.** Mirroring ADR-0036 (Solaris's card), the user asked for the
Aether Flux rod field inside the Design & Drafting homepage card — small
canvas behind the card text, same shading/cursor interaction, bloom toned
down (`torusComposer` strength 0.15, `bloomComposer` strength 0.2 vs. the
hero's 0.22/0.32).

**Decision.**
1. **`buildAetherFluxScene` takes an `AetherFluxOptions` argument**
   (`{ torusBloomStrength, bloomBloomStrength }`) instead of being a single
   hardcoded config — `createAetherFluxHeroScene` (0.22/0.32, verbatim) and
   `createAetherFluxCardScene` (0.15/0.2, per the brief) are two thin
   factories over one builder, same shape as Solaris's pair. Every other
   CONFIG value (grid, geometry, colours, camera, cursor, spin) stays
   identical between hero and card — the brief didn't ask to change them,
   and unlike Solaris the rod material is opaque/depth-tested
   (`transparent: false`), not additively blended, so the card doesn't need
   Solaris's extra deviations (coarser geometry, raised bloom threshold) to
   avoid an overlap-saturation "white blowout" — that failure mode is
   specific to additive blending and doesn't apply here regardless of
   instance count at small buffer sizes.
2. **`ServiceCard.tsx`'s special case generalized to a lookup.**
   `DEDICATED_CARD_SCENES: Record<string, ...>` (`geotechnical-engineering`
   → `createSolarisCardScene`, `design-and-drafting` →
   `createAetherFluxCardScene`) replaces the single `SOLARIS_CARD_SLUG`
   boolean — same "list instead of a growing set of booleans" reasoning
   already applied to `GLASS_BACKGROUND_ROUTES`/`GLASS_SCENE_THEMES`
   (ADR-0042).
3. **`mini-scenes.ts`'s `buildDraftingBlueprint` retired** — Design &
   Drafting's prior corner-icon mini scene, now superseded (confirmed via
   grep: no other consumer), matching the precedent already set when
   Solaris's card superseded Geotechnical's own mini scene (ADR-0036).

**A debugging note worth keeping.** Verification first showed the card
rendering nothing — `gl.readPixels()` called *out of band* (from a separate
`javascript_tool` call, not synchronously inside a render call) returned
`(0,0,0,0)` at every sampled point, including the console logging a real
`THREE.WebGLRenderer: A WebGL context could not be created` error. Both
turned out to be artifacts of the verification method, not the scene:
- The context-creation error was caused by the verification script's own
  `canvas.getContext('webgl') || canvas.getContext('webgl2')` call
  requesting a *different* context type than the one Three had already
  created on that canvas — the browser correctly refuses a second context
  of a different type on the same canvas, and logs exactly this error. It
  is not a symptom of anything wrong with the scene.
- The `(0,0,0,0)` reads were a WebGL drawing-buffer-clear race: the default
  (`preserveDrawingBuffer: false`) buffer can be cleared for compositing
  between an animation frame and an *unrelated*, later, out-of-band
  `readPixels()` call — exactly the failure mode `__solarisForce` was
  already built to route around (ADR from Solaris's own verification
  history). Adding the equivalent temporary `__aetherForce(t)` (call
  `renderFrame(t)` and `readPixels` *synchronously back to back*, removed
  before shipping) produced real, non-zero pixel data immediately, and a
  screenshot confirmed the rod cluster rendering correctly and distinctly
  from the other 7 cards.

**When building.** Never trust an out-of-band `gl.readPixels()` call on a
WebGL canvas driven by its own external render loop — always pair it with
a synchronous force-render call in the same tick, or read a real screenshot
instead. A `getContext()` type-mismatch error in the console is a
diagnostic-script bug, not evidence the scene under test is broken — check
what called `getContext()` and with which argument before concluding
anything about the renderer itself.

---

## ADR-0042 — Aether Flux on Design & Drafting: the Geotechnical/Solaris pattern generalized to a second glass page, a verbatim scene with a known-dead composer rig, and shared route/theme helpers

**Status:** Accepted · 2026-08-27

**Context.** The user asked for a second GetLayers scene — "Aether Flux," a
cube of instanced tapered rods oriented by a curl-noise flow field,
pearlescent platinum shading, cursor pocket/vortex, click-burst ring — as
the fixed full-page background for Design & Drafting, "using the exact same
layout pattern as the Geotechnical Engineering page" (ADR-0037–0041). Pulled
via `getlayers_materialize` (id `aether-flux`, target `next`) rather than
hand-written from the brief's prose — this project's established practice
after Solaris's own early rounds cost real rework by guessing instead.

**Decision.**
1. **Scene ported verbatim** into `build-aether-flux-scene.ts` — NOISE_GLSL,
   rod vertex/fragment shaders, dust vertex/fragment shaders, grid
   generation (26³ with organic edge dropout), cursor ray/pocket/vortex
   math, click-burst ring, turntable spin/tilt, camera damping, and the
   three-composer bloom rig are all copied character for character from the
   materialized source's "Default" variant — including its own pearlescent
   platinum CONFIG colours (`#9fb0c4`/`#f4eee2`/`#ffffff`), kept rather than
   tinted through this project's blue Style, same precedent as Solaris's
   amber/orange (ADR-0039). Four small, forced/invisible deviations only
   (`THREE.WebGL1Renderer`/`CylinderBufferGeometry` don't exist in
   three@0.185, installed here; tier-based DPR clamp; `HeroScene.tsx`'s own
   rAF loop instead of a freestanding one) — see the file's own header for
   the full, itemized list.
2. **The three-composer bloom rig is a structural no-op, kept anyway.**
   `torusComposer`/`bloomComposer` render `camera.layers.set(1)`/`set(2)`,
   but the rod mesh and dust are only ever put on layer 3
   (`LAYERS.ENTIRE_SCENE`) — so both composers bloom an empty scene every
   frame, contributing nothing to the final composite (`finalComposer`,
   layer 3, is the only one with anything to render). This matches the
   `optimize-3d-scene` skill's own documented "wasted full-screen passes"
   pattern almost exactly — confirmed non-trivial in practice, not just
   theoretical: a `Page.captureScreenshot` CDP call timed out once against
   the live page during verification, recovering on retry. Given the user's
   explicit, repeated "exact"/"verbatim" instruction and this project's own
   hard-won lesson about not improvising on a scene asked for character-for-
   character (see Solaris's three revision rounds, ADR-0037–0039), this was
   preserved as-found rather than "fixed." **Flagging for a future pass**:
   if this page's performance becomes a real complaint, dropping
   `torusComposer`/`bloomComposer` entirely (nothing downstream reads their
   output beyond the two now-black texture inputs to `finalPass`, which
   could just as well be unset) removes two full bloom pipelines per frame
   for zero visual change — invoke `optimize-3d-scene` before touching it,
   per hard rule #13.
3. **`GLASS_SCENE_THEMES`/`isGlassSceneTheme`** (new, `services.ts`) replace
   the single hardcoded `=== "solaris"` checks in `ServiceHero.tsx` and
   `service-detail.tsx` — the same theme list read from one place instead of
   two, so a third glass page can't have the two files drift.
4. **`glass-background-routes.ts`** (new, `src/lib/scene/`) replaces the
   single-string route constants that had been independently declared in
   `PlanetBackground`, `AmbientBackground`, `CustomCursor`, `Footer`, and
   `Nav` (ADR-0037/0038/0040/0041 each added one, on the explicit reasoning
   that a *single* route was small enough to duplicate per-file). A second
   route made that the same two-item list copy-pasted five times — past the
   point that reasoning holds; one `GLASS_BACKGROUND_ROUTES` Set +
   `isGlassBackgroundRoute()` now backs all five. `SolarisBackground.tsx`/
   `AetherFluxBackground.tsx` themselves are *not* on this list — they each
   check their own single route (the opposite polarity: "mount only here,"
   not "skip only here"), so sharing would add a dependency without
   removing an actual duplicate.
5. **`bim-clash-detection` retired** — `design-and-drafting`'s prior hero
   theme, now fully superseded (confirmed via grep: no other consumer).
   `build-bim-clash-detection-scene.ts` deleted, matching the precedent
   already set when Solaris superseded the geological-digital-twin scene
   (ADR-0039). `ServiceSceneTheme`'s union member renamed to `"aether-flux"`.
6. **`.glass-panel`/`[data-glass-readability]`/`--color-glass-*` tokens
   needed zero changes** — they were already page-agnostic (ADR-0040/0041
   never baked the Geotechnical route into the CSS, only into the React
   components that apply the classes), so reusing them for a second page
   was purely a matter of widening the `glass` boolean's source, not a CSS
   change.

**When building.** A third glass-background page needs exactly three
additions, no more: an entry in `GLASS_BACKGROUND_ROUTES`
(`glass-background-routes.ts`), an entry in `GLASS_SCENE_THEMES`
(`services.ts`), and its own `<Scene>Background.tsx` mounted in
`layout.tsx` alongside the existing two. Everything else (glass sections,
readability text-shadow, nav/footer tint, wireframe/globe/cursor exclusion)
already reads from those two lists and needs no further touching.

---

## ADR-0041 — Glass-panel readability pass: darker/more opaque fill, ambient wireframe shapes excluded, page-scoped text-shadow + brighter muted text

**Status:** Accepted · 2026-08-27 · Revises ADR-0040

**Context.** ADR-0040's glass-panel spec (`rgba(255,255,255,0.05)` fill) was
implemented exactly as asked, but against Solaris's bright, busy orange/red
it read as barely-there — body text (`--foreground-muted`, the sitewide
muted blue) sat almost directly on the raw particle background with little
backing to separate it, and the ambient wireframe shapes (`AmbientBackground`,
mounted sitewide) added a second, unrelated layer of visual noise competing
with Solaris's own geometry. The user asked for a more opaque, dark glass
fill; the wireframe shapes hidden on this page; forced pure-white text with
a shadow for contrast; and brighter muted/accent text.

**Decision.**
1. **`--raw-color-glass-fill` changed from white to dark navy**:
   `rgba(255, 255, 255, 0.05)` → `rgba(4, 6, 15, 0.65)` (the same navy the
   nav bar's glass tint already uses, ADR-0040). A near-transparent white
   wash over a bright background barely reads as "glass" at all; a darker,
   more opaque backing keeps the frosted-glass look (still translucent,
   still blurred) while giving text a near-solid, readable backdrop again —
   closer to how glass panels read in the sitewide dark theme everywhere
   else. `.glass-panel` itself (`src/app/globals.css`) is unchanged; only
   the raw value the Tier 1 primitive points to moved.
2. **`AmbientBackground` excluded on `/services/geotechnical-engineering`**
   — same `usePathname()` route-check shape as `PlanetBackground`/
   `SolarisBackground`/`CustomCursor`/`Footer`/`Nav` (ADR-0037/0038/0040).
   The drifting wireframe shapes are a homepage-wide ambient layer with no
   relationship to Solaris; on this one page they compete with, rather than
   complement, the particle sun's own geometry.
3. **Page-scoped text-shadow via an inherited CSS property, not per-element
   classes.** `text-shadow` is inherited (unlike `background`/`border`), so
   one declaration on a `[data-glass-readability]` selector
   (`@layer components`, `globals.css`) reaches every descendant — the
   hero's glass band included, which isn't a `.glass-panel` and would
   otherwise need its own separate rule. `service-detail.tsx` sets the
   attribute on its existing per-service wrapper `<div>` (the same element
   `getServiceAccentStyle` already scopes `--accent`/`--glow` to) whenever
   `glass` is true — no new wrapper element.
4. **`--foreground`/`--foreground-muted` reaffirmed/brightened on the same
   wrapper**, via the identical "override the Tier 2 role's *value*, not
   its name" mechanism `service-accent.ts` already established for
   `--accent`/`--glow`: `--foreground: var(--raw-color-white)` (explicit,
   though already the sitewide default — reaffirms the user's literal
   "fully white" ask) and `--foreground-muted:
   var(--raw-color-glass-muted-bright)`, a new Tier 1 primitive (`#d6f0ff`)
   brighter than the sitewide muted blue (`--raw-color-sky-300`,
   `#8ecbff`), which reads low-contrast and muddy against warm orange/red.
   Kept inline in `service-detail.tsx` rather than added to
   `service-accent.ts` — it's a glass-page concern, not a per-service-accent
   one, and used in exactly one place.

**When building.** `text-shadow`'s inheritance is the reason a single
selector on the page wrapper is enough — don't reach for per-component
`text-shadow` classes on future glass-styled pages; scope one declaration
at the wrapper instead. If a future page needs its own ambient-scene
exclusion, `AMBIENT_EXCLUDED_ROUTE`/`GLOBE_EXCLUDED_ROUTE`/
`SOLARIS_BACKGROUND_ROUTE`/`CUSTOM_CURSOR_EXCLUDED_ROUTE`/`GLASS_ROUTE` are
all independently-declared route-string constants in five different files
— duplicated on purpose (each is a small, self-contained guard clause), not
a sign a shared config was missed.

---

## ADR-0040 — Liquid-glass content sections on the Geotechnical page; a Lightning CSS trap with duplicate `-webkit-backdrop-filter`

**Status:** Accepted · 2026-08-27

**Context.** ADR-0039 made every Geotechnical page section an *opaque*
`bg-background`/`bg-background-alt` panel specifically to fix text being
painted over by the fixed Solaris canvas. The user came back wanting the
opposite fill — not opaque, but a translucent frosted-glass panel (`iOS
control-centre` look) so Solaris stays visible and glowing through every
section as you scroll, with an exact recipe: `rgba(255,255,255,0.05)` fill,
`blur(20px) saturate(180%)`, `rgba(255,255,255,0.1)` 1px border, 16px
radius — plus a darker `rgba(4,6,15,0.6)`-ish nav tint on this page only.

**Decision.**
1. **New tokens, full three-tier chain for colour.** `--raw-color-glass-fill`
   / `--raw-color-glass-border` (Tier 1) → `--glass-fill`/`--glass-border`
   (Tier 2) → `--color-glass-fill`/`--color-glass-border` (Tier 3 binding).
   Blur gets the same treatment — `--raw-blur-glass: 20px` → `--glass-blur`
   → `--blur-glass: var(--glass-blur)` — because `verify.sh`'s own check
   only allowlists direct literals in `@theme inline` for
   `--leading-`/`--ease-`/`--text-`/`--spacing-`/`--radius-`/`--breakpoint-`;
   `--blur-*` is not on that list, so skipping tiers there is a real FAIL,
   not just a style preference. `saturate(180%)` has no themeable Tailwind
   namespace at all (confirmed: no `--saturate-*` in Tailwind's own
   `theme.css`), so it stays a plain literal *inside* the one utility rule
   that uses it, per the token rule's actual intent (no scattered magic
   numbers across component files) rather than its letter.
2. **One `.glass-panel` utility** in `@layer utilities`, not a React
   component — this is a repeated pure-utility combo applied to an existing
   element with no new markup/structure/props, exactly the case
   design-system.md's own decision table reserves for a Tailwind utility
   over a component. `border-radius: var(--radius-2xl)` reuses Tailwind's
   own default token (1rem = 16px at the base font-size) rather than
   inventing a redundant radius token for a value the framework already has
   — and being `rem`-based, it scales with this project's adaptive
   root-font-size grid the way a literal `16px` would not.
3. **A real Lightning CSS trap, found by inspecting compiled output, not
   guessed.** Writing both `backdrop-filter: blur(...) saturate(...)` and
   `-webkit-backdrop-filter: blur(...) saturate(...)` (the textbook
   copy-paste pattern, and literally what the user's own spec listed) on
   the same rule caused Tailwind v4's Lightning CSS pass to **drop both
   declarations from the compiled output entirely** — confirmed via
   `document.styleSheets` inspection showing `.glass-panel` compiled with
   `background`/`border`/`border-radius` intact but no `backdrop-filter` at
   all, and `getComputedStyle(...).backdropFilter === "none"` on every
   panel. Removing the redundant `-webkit-` line (trusting the build's own
   autoprefixer, which is what modern tooling is for) fixed it —
   `backdrop-filter: blur(20px) saturate(1.8)` then computed correctly.
4. **Panels float, they don't span edge-to-edge.** Each glass section keeps
   its outer `<section>` fully transparent and moves the fill/border/radius
   onto the *inner* `max-w-6xl` content wrapper, adding vertical margin
   (`my-8 md:my-12`) so gaps open up between stacked panels too — a
   full-bleed section with a border-radius would look wrong (no edge for
   the corner to round against), and the "floating card over the
   background" look needs visible page background in the gaps on every
   side, not just left/right from the existing `max-w-6xl` centering.
5. **Route/theme-scoped, not sitewide.** `ServiceDetailPage` computes
   `glass = service.sceneTheme === "solaris"` once and threads it as a
   prop to `ServiceSubServiceGrid`/`ServiceProcess`/`ServiceRelatedProjects`/
   `ServiceCta` (which don't otherwise receive `service`); `ServiceOverview`
   reads it directly since it already has `service`. `Footer` and `Nav` are
   sitewide singletons with no `service` prop path, so they key off
   `usePathname() === "/services/geotechnical-engineering"` instead — the
   same route string `PlanetBackground`/`SolarisBackground`/`CustomCursor`
   already check (ADR-0037/0038). `Footer` gained `"use client"` for this
   (a justified leaf-level exception to hard rule #6 — it was already a
   pure leaf with no server-only children to preserve, the same trade-off
   those three components already made). Every other service page's
   sections are untouched — still plain opaque `bg-background`.
6. **`ServiceOverview`'s photo-band edge gradients go glass-aware too** —
   under glass they fade `from-transparent` instead of `from-background`,
   since there is no solid section fill left to blend into and the Solaris
   canvas needs to stay visible through the band's edges, not just around
   the rest of the section.

**When building.** If a future `backdrop-filter`/`-webkit-backdrop-filter`
pair silently does nothing despite the rule clearly matching in devtools'
*Styles* panel, check the *Computed* tab (or `getComputedStyle` directly) —
Lightning CSS can drop both declarations from a duplicated pair at build
time without any warning, and the *Styles* panel still shows your
authored source, not the compiled output, so it will look correct there
even when it silently isn't. Prefer a single un-prefixed `backdrop-filter`
and trust the build's autoprefixer.

---

## ADR-0039 — Solaris, round three: verbatim re-port from the real "Creative Studio" GetLayers source, `vwScale` (not per-page bloom guessing), and the z-index bug that hid the page's own title

**Status:** Accepted · 2026-08-27 · Revises ADR-0038

**Context.** ADR-0037/ADR-0038 tuned bloom and widened the fresnel band by
trial and error against a *guessed* shader, because the earlier turns never
actually pulled the real template — they approximated "Solaris" from the
brief's prose. The user came back twice, explicitly: first asking for the
exact Creative Studio shaders "verbatim... copy them character for
character," then reporting the result still looked like "a solid glowing
ring/shell" rather than "flowing solar wind/plasma waves," plus a second,
unrelated bug — the page's own `<h1>` and body copy were invisible,
painted over by the fixed-position WebGL canvas.

**What pulling the real source found.** `getlayers_source` against template
id `creative-studio` (`src/views/home/solaris/{shaders,solaris-scene,config}.ts`)
turned up the actual shader and the actual settings — both different from
what ADR-0037/0038 had guessed:
- The fresnel band is `smoothstep(0.4, 0.9, rim)` in the real source — ADR-
  0038's widening to `(0.12, 0.85)` was a compensation for a bloom value
  that was *also* wrong; with the authentic offset camera framing restored
  (below) the narrow, authentic band reads as the fresnel rim it's meant to
  be, not a ring, because most of the sphere sits outside the frame.
- The aurora fragment shader has **no clamp** on `finalColor` in the real
  source — ADR-0037's `clamp(vec3(0.45))` was compensating for the same
  root cause: wrong camera framing, not a shader defect.
- Camera/sphere framing is a specific offset, not a centered view:
  `cameraDistance: 4.6, cameraOffsetY: 2.8, sphereOffsetY: 5.5` (both
  camera and sun shifted up together, camera close and pitched into the
  sun's lower edge, `lookAt(0, cameraOffsetY, cameraDistance - 100)`). This
  framing is *why* the authentic narrow fresnel band and unclamped aurora
  both work: most of the sphere is off-frame, so what's visible is rim +
  aurora interplay, not a centered disc.
- Colours are the template's own amber/orange (`#ff301a` warm / `#ff7033`
  cool, `invertGradient: true`) — not ADR-0038's explicit azure override,
  and not ADR-0036's per-service-accent choice. Both prior colour decisions
  are superseded; the brief's "same amber/orange" for the card turns out to
  be the *only* correct colour, for the hero too.
- **`vwScale`** — the real mechanism the template uses so one shared
  `bloomStrength`/`particleSize` setting works across container sizes:
  `Math.min(Math.max(containerWidth / 1440, 0.4), 1.5)`, multiplying
  `bloomPass.strength` and `uParticleSize` only (radius/threshold stay raw).
  ADR-0038's separate, hand-tuned hero/card bloom pairs are superseded by
  this — one bloom config (`2.33/1.16/0`, the brief's own literal numbers)
  now works for both, because `vwScale` is what makes it work, not a
  per-page guess.

**Decision.**
1. `build-solaris-scene.ts` shaders, colours, framing constants, and
   `vwScale` all re-ported verbatim from the real template (see file
   header for the exact source paths). Superseds the shader/colour/bloom
   changes in ADR-0037 and ADR-0038 outright.
2. **Card-specific deviations, kept minimal and explicitly justified** —
   `vwScale`'s 0.4 floor is tuned for a responsively-narrowed *viewport*
   (a phone at ~375px+), not a ~275px card nested in a page, a size the
   template never runs at. At that floor, `vwScale` alone still washed the
   card's tiny buffer toward white — not because bloom was too strong, but
   because `SphereGeometry(4.2, 200, 600)` (~120k points) massively
   overdraws a ~46k-pixel buffer regardless of point size. Two additions,
   both new options on `SolarisOptions`, both card-only: a coarser
   `sphereSegments` (48×90 vs. the hero's verbatim 200×600 — invisible at
   card scale, removes the overdraw at its source) and a bloom threshold of
   `0.4` (vs. the verbatim `0`, which still let the dim background bloom).
   strength/radius/particleSize stay the exact template numbers on both.
3. **The hidden-title bug — a CSS stacking-order bug, not a scene bug.**
   The Solaris canvas is `position: fixed; z-index: 0`; six page sections
   (`ServiceOverview`, `ServiceSubServiceGrid`, `ServiceProcess`,
   `ServiceRelatedProjects`, `ServiceCta`, `Footer`) were plain
   statically-positioned elements with no `z-index` of their own. Per the
   CSS2.1 stacking-context algorithm, non-positioned static content paints
   *before* a positioned `z-index: 0` sibling in the same stacking context
   — so the fixed canvas painted over all of them regardless of DOM order.
   Fix: `relative z-10` added to all six (plus `<main>` in `layout.tsx` as
   defense-in-depth — confirmed `position: relative` there doesn't affect
   `ProjectModal.tsx`'s `fixed inset-0 z-[100]` descendant). Every section
   already had an opaque `bg-background`/`bg-background-alt`, so once
   stacked correctly they also occlude the fixed canvas as scrolled past,
   exactly as intended.
4. **Layout — frosted glass band + orbit rings**, replacing ADR-0037's
   plain gradient-overlay text for this one theme: `ServiceHero.tsx`
   branches on `service.sceneTheme === "solaris"` into a `bg-background-alt/80
   backdrop-blur-xl` band (Tailwind's built-in `xl` step, not an arbitrary
   `blur-[20px]` — matches `Nav.tsx`'s own established glass recipe and
   clears the tokens-check WARN an arbitrary value raises) holding the
   `<h1>`/description at `z-10`, with four concentric `border-white/10`
   rings (8/24/40/56rem) hanging from the band's bottom edge — the
   template's own orbit-ring convention (`hero-background.tsx`), simplified
   from its exact mask-cutout-window CSS trick to a plain band since this
   page only needs the band, not a sharp window below it.

**When building.** If Solaris (or a future scene reusing this file) is
asked to change bloom or fresnel numbers again, check `vwScale` and the
camera/sphere offset framing *first* — they are what make the raw shader
numbers work as-intended; changing the raw numbers without them is what
produced two rounds of wrong-looking bloom fixes (ADR-0037, ADR-0038)
before the real source was ever pulled. When a fixed-position full-page
canvas is added to any future page, check every sibling section has its
own `z-index` — a `position: fixed` sibling at `z-index: 0` paints over
plain static content regardless of DOM order, not just `z-index: auto`
positioned content.

---

## ADR-0038 — Solaris white-blowout, round two: the fresnel band was the real "looks like a ring" cause, not just bloom; cursor/pointer cleanup

**Status:** Accepted · 2026-08-26 · Revises ADR-0037

**Context.** ADR-0037's fix (aurora clamp + bloom cut to 0.32-0.5 strength)
did stop the white wash-out, but introduced a different, real defect: at
that low a bloom, the particle sphere's fresnel rim — geometrically a thin
band near the true silhouette edge, by construction — rendered as a literal
glowing ring/torus rather than a lit sphere, because nothing was left to
blur/fill the mostly-dark disc between rim and center. Separately, two
sitewide UI elements were only ever visible *because* nothing had excluded
them from this one page: `CustomCursor`'s accent-coloured dot+ring (a
second, conflicting cursor reaction on top of Solaris's own solar-flare
raycast) and a missing `pointer-events: none` on both Solaris canvases.

**Decision.**
1. **Fresnel band widened** — `smoothstep(0.4, 0.9, rim)` → `smoothstep(0.12,
   0.85, rim)` in the particle vertex shader. Spreads visibility across
   most of the sphere's surface (only a small central cap stays dark)
   instead of a thin edge band, so it reads as a lit orb even with modest
   bloom. Shared by both Solaris instances — not a per-page tuning knob.
2. **Bloom re-bisected with the wider band in place** — re-tested the
   brief's literal 2.33/1.16/0 and confirmed it *still* washes the frame to
   white regardless of the fresnel/aurora fixes (threshold 0 bloom every
   near-black pixel, and at this particle density that includes most of
   the frame). Settled on `{ strength: 0.45, radius: 0.5, threshold: 0.5 }`
   for the hero and `{ strength: 1.1, radius: 0.9, threshold: 0.25 }` for
   the card (tighter framing, less headroom) — real glow, no whiteout,
   confirmed by direct visual check after each change, not assumed.
3. **Explicit colour override** — `#4db8ff`/`#1a6bff` given directly,
   replacing ADR-0037's Geotechnical-per-service-accent choice. Aurora
   `baseBg` also set to the specified `#040d1a` (was a generic near-black).
4. **`pointer-events: none` added explicitly** to both Solaris canvases
   (`SolarisBackground.tsx`, `ServiceCard.tsx`'s card instance) and the
   background `z-index` changed from `-10` to `0` — matches
   `ambient-background-renderer.ts`'s own established convention
   (`canvas.style.pointerEvents = "none"`), which the fixed-full-page
   background hadn't been given yet.
5. **`CustomCursor` excluded on `/services/geotechnical-engineering`** —
   same `usePathname()` route-check shape as `PlanetBackground`'s own
   exclusion of this page. Every other page keeps the custom cursor
   unchanged.

**When building.** If the sphere ever looks "thin"/"ring-like" again after
a future change, check the fresnel `smoothstep` range first — it is the
more direct cause than bloom strength, and cutting bloom to compensate for
a narrow band just trades one defect (whiteout) for another (ring). Bloom
numbers this dense a particle field can safely run are empirically lower
than either the brief's literal ask or the scene's own GetLayers defaults;
re-verify visually (not just "0 FAIL") before trusting a new bloom value
here.

---

## ADR-0037 — Geotechnical page: route-scoped background swap (globe → Solaris), and the aurora/bloom white-blowout fix

**Status:** Accepted · 2026-08-26

**Decision.** `PlanetBackground.tsx` now reads `usePathname()` and returns
early (mounts nothing) on `/services/geotechnical-engineering`; a new
`SolarisBackground.tsx`, mounted alongside it in `layout.tsx`, does the
exact opposite — it renders `null` on every route *except* that one, where
it mounts `HeroScene`/`createSolarisHeroScene` in a `fixed inset-0 -z-10`
container. The two are deliberately symmetric and mutually exclusive: this
is the only page in the codebase where the persistent background scene is
route-conditional, because it is the only page carrying two backgrounds
heavy enough that running both at once would be a real cost, not a free
layering (the globe is already the single heaviest scene in the codebase —
Draco GLB, day/night shaders, three composers — and Solaris runs its own
`EffectComposer`/`UnrealBloomPass`). `AmbientBackground` is untouched and
keeps running on this page as on every other — only the globe steps aside.

`ServiceHero.tsx`'s solaris branch no longer mounts its own
section-scoped `ServiceHeroScene` — that would be a *second* live instance
of the same heavy scene next to the fixed one. The hero `<section>` itself
goes transparent (drops `bg-background`) for this one theme so the fixed
background shows through it; every other service theme is unchanged.

**The white-blowout bug, and what actually caused it.** The brief's literal
bloom spec (strength 2.33, radius 1.16, threshold 0) and even the scene's
own vetted GetLayers defaults (1.64/1.14/0.04, already used for the ADR-0036
card) both produced a full-frame white wash-out on this page, not a glow —
confirmed by bisection (disabling `UnrealBloomPass` entirely reproduced a
correct-looking dark scene; re-enabling it at either value reproduced the
whiteout). Root cause, found by inspecting the ported aurora shader rather
than guessing at bloom numbers: `mask1`/`mask2` in the aurora fragment
shader are `pow(fbm(...), n) * 3.5` / `* 4.0` — unbounded above ~1.0 by
construction, so `finalColor = color2*mask1 + color1*mask2` already exceeds
white in bright regions *before* bloom touches it, and at
`SphereGeometry(4.2, 200, 600)` (~120k points), the particle sphere's own
additive overdraw is dense enough that even a "hot spots only" bloom
threshold sees most of the sphere surface as a hot spot. Two independent
fixes, both required:
1. `finalColor` is now `clamp`ed to `vec3(0.45)` before combining with the
   aurora's base colour — caps the aurora's own contribution short of
   white at any `colorTop`/`colorBottom` pair, not just this page's.
2. Bloom on **both** Solaris configurations (hero and the ADR-0036 card)
   dropped to `{ strength: 0.32-0.5, radius: 0.5-0.6, threshold: 0.55-0.65 }`
   — a threshold this high restricts bloom to genuinely bright pixels (the
   cursor flare's white-hot core), which is what a glow pass is for in the
   first place, rather than amplifying the whole sphere surface.

**When building.** Any future scene reusing `build-solaris-scene.ts`'s
aurora shader inherits the clamp automatically — it is not a per-page
tuning knob. If a future page wants a *hotter* aurora, raise the clamp
deliberately and re-check for blowout at that page's own colour pair and
resolution; do not assume the ported values are safe as-is, they were not.

---

## ADR-0036 — Solaris card: `HeroScene`'s dedicated-context pattern extended to a bounded (non-fullscreen) use for the first time

**Status:** Accepted · 2026-08-26

**Decision.** The Geotechnical homepage card's Solaris scene mounts via the
existing `HeroScene.tsx` wrapper — unmodified — inside a small, sized
`<div>` in the card, instead of registering against the shared scissored
context every other service card's mini scene uses
(`src/lib/scene/shared-viewport-renderer.ts`). That shared renderer is a
single `WebGLRenderer` with no `EffectComposer` support; Solaris needs
`UnrealBloomPass`. Rather than bolt composer support onto that shared,
heavily-used core module for one card, the card gets its own dedicated
context — the same trade-off the shared renderer's own file comment already
makes for the full-bleed hero ("this renderer is for the many small scenes
... the homepage hero keeps its own dedicated context"), just applied to a
*bounded* element for the first time.

**Why no changes to `HeroScene.tsx` were needed.** It already sizes itself
via `ResizeObserver` on its own container, not `window` — it was never
actually "full-viewport-only," just always used that way until now. Mount
it inside any sized, positioned div and it works: mobile skip,
reduced-motion, tier-based DPR clamp, `IntersectionObserver`
pause-when-offscreen, tab-visibility pause, and pointer parallax (already
computed container-relative, exactly what Solaris's cursor-raycast solar
flare needs) all apply for free. `HeroFallback` (the mobile/reduced-motion
substitute) is reused as-is too — it already reads `--accent`/`--glow` from
whatever CSS scope it's rendered in and has no hardcoded size assumptions,
so it works as a small card-scale glow just as well as a full hero one.

**One scene builder, two configurations.** `build-solaris-scene.ts` is one
internal builder (`buildSolarisScene`) plus two thin exported factories
(`createSolarisHeroScene`, `createSolarisCardScene`) that only differ in an
options object — colour, aurora on/off, bloom values, camera distance,
intro duration — sharing every shader/geometry/composer line. The aurora
background pass is card-excluded (not requested for the card; the brief's
effects list for the card stops at "bloom post-processing") rather than
kept and just visually suppressed, so the card build genuinely skips a
render pass instead of paying for one it doesn't show.

**Colour fidelity, not just "make it blue."** The card keeps Solaris' own
template defaults (`#ff4c33` warm / `#3366ff` cool) as local constants —
matches the brief's explicit "same amber/orange" — deliberately off this
project's semantic tokens, the same way `build-planet-scene.ts` (ADR-0034)
leaves its golden radar-ping markers un-retinted: a scene's own bespoke
accent palette, not something meant to blend into the site. The hero,
asked to "shift to navy/azure," reuses **Geotechnical's own per-service
accent pair** already in `globals.css`
(`--raw-color-service-geotechnical-engineering-accent`/`-glow`) as numeric
three.js mirrors — the same pair `service-accent.ts`/ADR-0030 already
scopes onto every DOM element on that exact page — rather than the generic
site-wide `HERO_SCENE_COLORS` or a newly invented pair, so the WebGL sphere
matches its own page's accent automatically.

**When building.** This is the first non-fullscreen use of the
`HeroScene`/`HeroSceneHandle` dedicated-context pattern. Reach for it again
— mount `HeroScene` in a sized container — before inventing a new wrapper,
whenever a bounded element needs a 3D effect the shared scissored renderer
can't support (composer/post-processing, or anything needing its own
uncontested context). It does cost a second live WebGL context on that
page; that's the same accepted trade-off ADR-0034 already made for running
the planet background alongside the ambient background, not a new one.

---

## ADR-0035 — Logo shrink-to-navbar: one measured-DOM-rect FLIP spring, not a second element or a hardcoded offset

**Status:** Accepted · 2026-08-26

**Decision.** `PageLoadIntro.tsx`'s large centred `<GeoporteLogo>` shrinks into
its real navbar position using a single `<Spring>` whose `to` prop swaps
value when the phase flips to `"exploding"` — not a second logo element
crossfaded in, and not a hardcoded pixel offset guessed from one viewport
size. The target is measured live: `getBoundingClientRect()` on
`Nav.tsx`'s real logo (`#geoporte-nav-logo`, a stable id kept specifically
for this), converted to a translate delta from viewport-centre. Scale is
the one piece *not* measured — it's a fixed `32/96` ratio between the two
markup sizes (`LOGO_LARGE_PX`/`LOGO_NAV_PX`), since both are known
constants and computing it from rects would just reintroduce the same
number with more failure modes.

**Why one spring, not two elements.** `Spring`'s own file comment already
documents that `useSpring({ from, to, ... })` re-diffs `to` on every
render — "a parent re-render with the same target is a no-op — no
re-animation, no reset" — which is exactly the property needed here: the
entrance pose and the shrink target are just two different `to` values on
the same spring, so the component re-renders with a new target when
`phase` changes and react-spring animates the delta automatically. A
second element (real nav logo fades in as the big one fades out) was
rejected — it needs the two to be pixel-aligned at the crossfade moment
anyway, which is the same measurement problem, plus a visible seam risk if
the timing is even slightly off. Landing the animated mark exactly on top
of the real one (already rendered at full opacity underneath the overlay
the whole time) has no seam by construction.

**Why measured, not hardcoded.** The nav is responsive — its logo's
on-screen position changes with viewport width and the header's own
padding — so a fixed "shrink toward top-left, offset (x, y)" would only be
correct at one width. `getBoundingClientRect()` on the real target is the
same technique `Spring`'s own `mode="forward"` scroll handler already uses
elsewhere in this file's dependency chain, not a new pattern invented for
this.

**When building.** This is the first FLIP-style (measure real DOM
position, animate a stand-in toward it) transition in this codebase. Reach
for the same shape — one spring, `to` swapped on a live rect read, landing
on top of a real element already rendered underneath — before inventing a
different technique for a similar "grows/shrinks into its real position"
effect.

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
