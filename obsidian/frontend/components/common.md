---
tags: [frontend, stable]
updated: 2026-08-29
---

# Catalog — Common Components

Files in `src/components/common/` — shared infrastructure that may depend on
providers. Conventions: [[component-conventions]].

## Cookie — `Cookie/`

Self-contained cookie consent system — a bottom-right **banner** plus a full
category **preferences modal**. No third-party library (the old
`react-cookie-consent` dependency was removed). Lives in `src/components/common/Cookie/`.

| File | Role |
|------|------|
| `Cookie.tsx` | Mount component — hydrates the store, renders banner + modal |
| `LazyCookie.tsx` | `next/dynamic` `ssr:false` wrapper — keeps cookie JS out of first-load |
| `CookieBanner.tsx` | Bottom-right consent banner |
| `CookiePreferencesModal.tsx` | Category preferences dialog with per-category toggles |
| `CookieButton.tsx` | Local button primitive — `primary` / `secondary` variants |
| `cookieStore.ts` | Zustand store + `localStorage` persistence |
| `index.ts` | Barrel exports — `Cookie`, `LazyCookie`, `useCookieStore`, `CookieConsent` |

**Mounting** — the root layout renders `<LazyCookie />` inside `ScrollLayout`:
```tsx
import { LazyCookie } from "@/components/common/Cookie";
```

**State** — `useCookieStore` (Zustand). `consent` is `null` until the user decides;
the banner shows only after hydration confirms `consent === null`. Persisted to
`localStorage` under key `cookie-consent-v1`. Three categories: `necessary`
(always on), `analytics`, `marketing`.

**Styling & motion** — ported to the project stack: Tailwind v4 with the
`background` / `foreground` design tokens (dark-mode adaptive, no hardcoded hex),
and `@react-spring/web` for all motion — `useTransition` drives the banner and
modal mount/unmount, `useSpring` drives the toggle knob. No CSS transitions.
The modal locks scroll through the Lenis [[smooth-scroll|scroll store]]
(`useScroll.stop()`), not `body` overflow.

> [!note] `#todo`
> The privacy-policy link points to `/privacy-policy` — that route does not exist
> yet. Placeholder consent copy should be reviewed before launch.

## Grid — adaptive scaling (`grid/`)

The **adaptive scaling grid** keeps a rem-based layout proportional across every
viewport by scaling the root (`<html>`) font-size. Design in `rem` once, and the
whole UI scales as one unit. Lives in `src/components/common/grid/`.

| File | Role |
|------|------|
| `grid.config.ts` | Breakpoints + `FONT_BASE` — the single source of truth for the grid |
| `adaptive-grid.tsx` | `<AdaptiveGrid>` client component — drives the scale-up, renders `null` |
| `index.ts` | Barrel exports — `AdaptiveGrid`, `GRID_BREAKPOINTS`, … |

**How it works** — two halves cover the whole viewport range:

- **Scale down** (viewport ≤ 1920px) — `vw`-based `html { font-size }` media
  queries in `globals.css`. At each breakpoint's design base width the root
  font-size resolves to 16px; between breakpoints it tracks the viewport.
- **Scale up** (viewport > 1920px) — the `<AdaptiveGrid>` component sets an
  inline `html` font-size at runtime via [[hooks|`useAdaptiveGrid`]], so the
  design keeps growing (damped by `coef`) on large displays.

The `globals.css` media queries and `grid.config.ts` describe the same
breakpoints — **keep them in sync** (formula: `font-size = 16 * 100 / baseWidth vw`).

**Mounting** — the root layout renders `<AdaptiveGrid />` inside `ScrollLayout`:
```tsx
import { AdaptiveGrid } from "@/components/common/grid";
```
Mount it once. Props: `baseWidth` (defaults to the largest breakpoint) and
`coef` (0–1 scale-up damping, default `0.6666`).

> [!note]
> This replaced a `styled-components`-based scaling system that was dropped into
> `common/` — see [[decisions-log]] ADR-0008. `styled-components` is **not** a
> project dependency; the scale-down CSS lives in `globals.css` per [[design-system]].

> [!warning] A rem-sized Tailwind utility is NOT a guaranteed pixel size — ever
> Because root font-size tracks the viewport, `h-11`/`min-h-11`/`w-11` (or any
> other rem-based sizing utility) only renders at its nominal 44px at each
> bracket's own reference width (1024, 1440, 1920, or the mobile bracket's own
> 360 reference) — everywhere else it scales with the rest of the design. Real
> numbers, computed live (ADR-0063): `min-h-11` measures **33px at 768px**
> viewport (iPad portrait), **35px at 1536px**, **41.7px at 1366px** — all
> common device/window widths, all short of the WCAG/task "44px touch target"
> floor a plain `h-11` looks like it should satisfy. **Any element whose actual
> pixel size matters — a touch target, anything measured against a hard
> external number — must use an arbitrary absolute value** (`min-h-[44px]`,
> not `min-h-11`) to opt out of the scaling. Decorative/layout sizing that's
> meant to scale with the rest of the page should keep using rem utilities;
> this only applies when a real px number is the actual requirement.



## Homepage motion/3D overhaul globals (Phase 0)

Six new client leaves, all mounted once in the root layout alongside the existing
headless globals (`AdaptiveGrid`, `ReducedMotion`) — see
[[decisions-log]] ADR-0027 for why a persistent ambient background scene needed its
own renderer, and [[hooks]] for the `usePointer` / `useScrollSignal` stores these
all read.

### CustomCursor — `Cursor/CustomCursor.tsx`

Replaces the native cursor with a small glowing dot (near-instant tracking) and a
larger lagging ring (`@react-spring/web`, driven off the shared ticker rather than
its own `pointermove` listener), plus a soft ambient glow trailing behind both and a
short-lived particle trail while the pointer moves fast. Swaps to an accent-filled
expanded ring over `a`, `button`, `[role="button"]`, `[data-cursor-hover]`; swaps to a
crosshair over anything marked `data-cursor="canvas"` (the hero scene wrapper carries
this today). Hides the native cursor via a `.cursor-hidden` class toggled on
`<html>` (see `globals.css` `@layer components` — a plain inherited `cursor: none`
on `body` doesn't override links/buttons' own `cursor: pointer`, so this needs the
`!important` + universal-selector rule under the class instead).

Gated off entirely — renders `null`, native cursor stays — on touch
(`usePointer().isFinePointer`) and under `prefers-reduced-motion`. Also stays hidden
until the pointer's first real move (`usePointer().hasMoved`); before that its `x`/`y`
are the `0,0` default, which would otherwise show the cursor stuck in the top-left
corner. See ADR-0027.

Also gated off on `/services/geotechnical-engineering` (`usePathname()` check,
same shape as `PlanetBackground`'s own route exclusion) — that page's Solaris
background already gives the cursor its own reaction (a solar-flare eruption
raycast onto the sphere), and this component's accent ring on top of that read
as a second, conflicting effect. See ADR-0038.

### Magnetic — `Magnetic.tsx`

`<Magnetic>` — wraps a button/CTA with magnetic cursor attraction: drifts up to 15px
toward the pointer inside an 80px radius, springs back outside it
(`@react-spring/web`, shared-ticker-driven, reads `getPointerSnapshot()` rather than
re-subscribing per pointer move). No-ops on touch. Applied to the Nav and Hero CTAs
so far; more call sites land as later phases touch their sections.

### ScrollSignal — `ScrollSignal.tsx`

Headless (`renders null`) — the single subscription to Lenis's own `scroll` event,
publishing into the `useScrollSignal` store (see [[hooks]]). Everything that needs
whole-page scroll progress/velocity/direction (the progress bar, the ambient
background's scroll-stretch) reads that store instead of each wiring its own Lenis
listener.

### ScrollProgressBar — `ScrollProgressBar.tsx`

Thin (`h-0.5`) accent line pinned to the top of the viewport, filling left-to-right
with `useScrollSignal()`'s `progress` via a spring-driven `scaleX`.

### PageLoadIntro — `PageLoadIntro.tsx`

First-visit-only load animation: a large centred `<GeoporteLogo>` rotates and fades
up into place (`<Spring>`, `rotate`/`x`/`y`/`opacity`/`scale`), the wordmark reveals
letter-by-letter through `spring-text-engine` (not a hand-rolled SVG path-trace —
real per-glyph vector outlines aren't available for arbitrary web fonts, and the
project's hard rule is that all text animation goes through the vendored text
engine), holds, then the overlay explodes outward (`<Spring>`, opacity/scale) as the
hero reveals beneath it. Gated by a `localStorage` flag (skipped on every return
visit) and skipped entirely under `prefers-reduced-motion` — no partial/instant
substitute, since no motion at all is the correct reduced-motion behaviour for a
load animation. Locks/unlocks Lenis scroll (`useScroll().stop()/start()`) for its
~2.2s duration.

**Logo shrink-to-navbar handoff**: the same logo `<Spring>` that plays the entrance
also carries the exit — no second element, no crossfade. When the explode phase
starts, its `to` prop swaps from a fixed resting pose to a target measured live off
`Nav.tsx`'s real logo via `document.getElementById("geoporte-nav-logo")
.getBoundingClientRect()`, converted to a translate delta from viewport-centre plus
a fixed `32/96` scale ratio (the two markup sizes, so only position needs
measuring, not scale). `<Spring>`'s `useSpring` re-diffs `to` on every render (see
its own file comment), so this one declarative prop swap is what drives the
shrink — the real nav logo is already rendered at full opacity underneath the
overlay the whole time, so the animated mark simply lands on top of it. This is
the first FLIP-style (measured-DOM-rect) transition in the codebase; reach for the
same technique before inventing a new one for a similar "shrink into its real
position" effect.

### RouteTransitionSweep — `RouteTransitionSweep.tsx`

Route transitions (item 15) — an accent bar sweeping across the viewport plus a
brief full-page fade, mounted as a **sibling** of `<main>` in the root layout, not
a wrapper around it. Reacts only to `usePathname()` changes and never touches,
wraps, or holds a reference to `children` in any way.

That's a deliberate constraint, not a missed opportunity to animate the actual
page content sliding in/out. An earlier version (`RouteTransition.tsx`, replaced)
wrapped `{children}` directly via `useTransition` keyed on pathname, to visually
slide the real outgoing/incoming content — the literal reading of the spec. It hit
a genuine, reproducible Next.js 16/Turbopack hazard, found during Phase 2 QA: a
component wrapping the App Router's live `children` prop that mounts more than one
independent `@react-spring/web` hook (confirmed down to `useTransition` plus even a
second, *unused* `useSpring` call) causes Next to silently orphan that subtree into
a hidden `<template>`, collapsing `<main>` to zero height. See ADR-0029 in
[[decisions-log]] for the full bisection. Any future route-transition work that
wants the actual page content to animate should look at the browser's native View
Transitions API rather than routing `children` through react-spring's transition
primitives again.

## PerformanceWarningToast — `PerformanceWarningToast.tsx`

`<PerformanceWarningToast>` — mounted once in the root layout, alongside
`RouteTransitionSweep`. A dismissible bottom-left notice ("Some visual
effects have been simplified for your device."), shown whenever either a
static capability check (Medium/Low tier — `hasStaticLowPerformanceSignal`,
`performance-tier.ts`, checked once on mount) or a measured hero-scene
frame-rate drop below 20fps sustained 3s fires — both come from
`src/lib/scene/performance-monitor.ts`. As of ADR-0058, the frame-rate path
can fire more than once per page lifetime (a 5s re-arm cooldown, not a
permanent lock) — each firing calls `usePerformanceTier().downgrade()`
(`use-performance-tier.tsx`) and re-shows this toast, even if already
dismissed. As of ADR-0067, `reportHeroSceneFrame` is a no-op outside
`NODE_ENV === "production"` — Turbopack's own dev-mode recompilation/HMR
stalls can trip the 20fps threshold on their own regardless of real
hardware, and because the downgrade persists to `localStorage`
indefinitely, one dev-mode stutter used to permanently disable every WebGL
scene sitewide. The static capability check still runs in dev (it's a real
hardware read, not a noisy sample). Mirrors `Cookie/CookieBanner.tsx`'s
`useTransition` mount/unmount idiom (same spring config), bottom-left
instead of bottom-right, self-dismissing after 6s or via its own × button
rather than store-driven. See ADR-0033, ADR-0058, ADR-0067 in
[[decisions-log]].

## ReducedMotion — `reduced-motion.tsx`

`<ReducedMotion>` — a client leaf that calls react-spring's `useReducedMotion()`.
It watches the `prefers-reduced-motion` media query and toggles react-spring's
global `skipAnimation`, so every spring — and `spring-text-engine` — jumps to its
end state instead of animating. Renders `null`; mounted once in the root layout.
See [[animation-system]] and [[seo-metadata]].

## Nav — `Nav/`

Fixed, pill-shaped primary navigation, mounted once in the root layout. Lives in
`src/components/common/Nav/`.

| File | Role |
|------|------|
| `Nav.tsx` | Desktop bar — logo, `ServicesDropdown`, secondary links, CTA, mobile toggle |
| `ServicesDropdown.tsx` | Hover-open services menu (desktop) — CSS-only per ADR-0014, not a spring |
| `MobileMenu.tsx` | Full-screen mobile nav, `<Spring>`-driven open/close |
| `nav-links.ts` | Primary nav link data — also consumed by `Footer` |

On every glass-background route (`isGlassBackgroundRoute()`,
`src/lib/scene/glass-background-routes.ts` — currently Geotechnical,
Design & Drafting, Structural Engineering, Civil Engineering, Stormwater &
Flood Modelling, Project Control Services, Advisory Services, Telecom
Services, the standalone `/projects` page, the standalone
`/publications` page, the standalone `/about` page, and the standalone
`/contact` page),
`Nav.tsx` swaps its `bg-background-alt/70`
tint for a darker, more transparent `bg-background/60` so that page's
fixed background reads through the bar. Same shared route check `Footer`/
`PlanetBackground`/`AmbientBackground`/`CustomCursor` use. See ADR-0040,
ADR-0042, ADR-0044, ADR-0045, ADR-0047, ADR-0048, ADR-0050, ADR-0051,
ADR-0052, ADR-0053, ADR-0054, ADR-0055, ADR-0057.

`Nav.tsx`'s logo mark carries a stable `id="geoporte-nav-logo"` on the `<span>`
wrapping `<GeoporteLogo>` — not decorative, it's the measurement target
`PageLoadIntro`'s shrink animation reads via `getBoundingClientRect()`. Don't
remove or rename it without checking that file first.

## GeoporteLogo — `GeoporteLogo.tsx`

Renders `public/assets/logo/geoporte-logo.png` — a **raster cutout of the
real Geoporte brand mark**, not a redrawn SVG. An earlier version hand-drew
the emblem as inline SVG (circular border, arced `<textPath>` text, a guessed
globe/pin shape) as a stand-in while only a screenshot had been seen; once
compared against the real thing it didn't match, so it was replaced with the
actual asset. The live site has no SVG or transparent-background version
anywhere (checked favicons, apple-touch-icon, the full-res upload — all
JPG-on-white), so the real mark is pulled from
`public/assets/logo/geoporte-logo-source.jpg` (the live site's own
`new-logo.jpg`, 945×880) and background-removed via
`scripts/process-logo.mjs` (luminance-threshold alpha through `sharp`,
resized to 480×480) into the shipped PNG. The script and source JPG are kept
in the repo so the cutout is rerunnable (e.g. to retune the threshold), not
a one-off throwaway. Rendered through `next/image` (`width={size}
height={size}`, `priority` — it's above the fold everywhere it's used).
`size` prop (px, square); always `aria-hidden` since it's paired with the
literal "GEOPORTE" text everywhere it's used (`Nav.tsx`, `PageLoadIntro.tsx`).

## Footer — `Footer/`

Site footer, mounted once in the root layout after `<main>`. Lives in
`src/components/common/Footer/`. Renders contact details, the service list,
`nav-links.ts`, and office locations from `@/lib/company`.

`"use client"` (a leaf-level exception to hard rule #6 — see ADR-0040): it
reads `isGlassBackgroundRoute()` (`glass-background-routes.ts`) to swap in
the `.glass-panel` treatment on every glass-background route — currently
Geotechnical, Design & Drafting, Structural Engineering, Civil
Engineering, Stormwater & Flood Modelling, Project Control Services,
Advisory Services, Telecom Services, the standalone `/projects` page,
the standalone
`/publications` page, the standalone `/about` page, and the standalone
`/contact` page, the same shared
list `PlanetBackground`/`AmbientBackground`/`CustomCursor`/`Nav` key off.
Every other route keeps its plain opaque `bg-background-alt` panel. See
ADR-0042, ADR-0044, ADR-0045, ADR-0047, ADR-0048, ADR-0050, ADR-0051,
ADR-0052, ADR-0053, ADR-0054, ADR-0055, ADR-0057.

> [!note] `#removed`
> A `ThemeController`/`ThemeToggle` pair briefly existed here (light/dark
> theme toggle, ADR-0064) and was fully removed the same day under explicit
> user direction — dark-only again, no toggle in the nav. See
> [[decisions-log]] ADR-0066. Noted so it isn't rebuilt from a stale memory
> of this catalog.
>
> The nav language switcher (`LanguageSwitcher.tsx`), `LanguageDirection.tsx`
> and `TranslatedText.tsx` (plus the rest of the i18n stack — `hooks/i18n/`,
> `lib/i18n/`, `app/api/translate/route.ts`) were likewise fully removed —
> see [[decisions-log]] ADR-0077. The site is English-only; don't rebuild
> these from a stale memory of this catalog.

## SectionHeading — `SectionHeading.tsx`

`<SectionHeading eyebrow heading id tag? headingClassName? />` — the eyebrow +
`TextEngine` heading pattern repeated across every homepage section. See
[[text-engine]].

## GeotechnicalPlexusSection — `src/views/home/GeotechnicalPlexusSection.tsx`

Homepage feature section (mounted between `AboutSection` and
`ServicesSection`) for the Geotechnical Plexus 3D scene — see
[[tech-stack]] → "3D — Geoporte hero + service scenes" for
the scene itself, and ADR-0060 for why it's vanilla Three.js. A Server
Component; two client leaves keep it that way:

- `GeotechnicalPlexusHeading.tsx` (same folder) — wraps `TextEngine`.
  Deliberately not the shared `SectionHeading` (that component hardcodes
  the sitewide dark-theme `text-foreground` tokens, wrong against this
  section's own light background) and deliberately its own file rather
  than importing `spring-text-engine` straight into the section — that
  package ships no `"use client"` of its own, so importing it directly
  into a Server Component breaks the production build. Mirrors
  `home/HeroHeading.tsx`'s role.
- `GeotechnicalPlexusScene.tsx` (`src/components/scene/`) — thin
  `<HeroScene createScene={createGeotechnicalPlexusScene} fallback={...} />`
  wrapper, mirrors `ServiceHeroScene.tsx`'s role. A scene factory can't be
  passed as a prop straight from a Server Component either (same RSC
  serialization limit), so this lookup has to happen behind its own
  client boundary too.

Uses the `-engineering` tokens (`bg-surface-engineering`,
`text-ink-engineering`, etc — see [[design-system]]) rather than the
sitewide `--background`/`--foreground`, scoping that palette to this
section (and `/services/geotechnical-engineering`'s own hero) rather than
the whole site. As of ADR-0069, this section's own `<section>` carries a
page-scoped override of `--surface-engineering`/`--ink-engineering`/
`--ink-engineering-muted` (Tailwind arbitrary-property syntax, resolving to
a new `--raw-color-navy-925: #040d1a` + white) so it renders dark with
white text while `/services/geotechnical-engineering`'s hero keeps the
original light palette — the shared Tier-2 defaults were never edited.
`--accent-engineering` (the CTA button) is untouched, still teal.

## ContactForm — `ContactForm.tsx`

`<ContactForm />` — name/email/phone/message, posts to the pre-existing
`/api/contact` route handler via `apiFetch` (that endpoint had no UI calling
it anywhere in the app before the `/contact` page). Phone is optional
(`type="tel"`, omitted from the POST payload entirely when blank rather
than sent as an empty string — see ADR-0057) — added alongside the page
rebuild, the route's own `zod` schema already updated to match
(`phone: z.string().max(30).optional()`). Plain controlled-free
`FormData` read on submit rather than per-keystroke state; `status`
(`idle`/`submitting`/`success`/`error`) swaps the whole form for a
confirmation card on success. Field `maxLength`s mirror the route's own
`zod` schema. Error text uses the `--danger` token — the first error/danger
colour added to this project's token set (`--raw-color-red-400` → Tier 2
`--danger` → `--color-danger`).

## TiltCard — `TiltCard.tsx`

`<TiltCard onActivate aria-label className>` — a card that tilts in 3D toward
the cursor (`perspective`/`rotateX`/`rotateY`, driven by `@react-spring/web`
directly — not the vendored `Hover` component, which only does binary
enter/leave, not a continuous pointer-tracked transform). Renders a
`role="button"` `div` rather than a real `<button>`: its children (headings,
paragraphs) aren't valid inside `<button>`'s phrasing-content-only model, so
it adds `tabIndex`, `onKeyDown` (Enter/Space) and `aria-haspopup="dialog"`
itself. Tilt is skipped when `(hover: hover) and (pointer: fine)` doesn't
match (touch devices). Used by `ProjectCard` (`src/views/home/`) to open the
project detail modal. See ADR-0025 in [[decisions-log]].

## ServiceCard — `ServiceCard.tsx`

`<ServiceCard service>` — one of the 8 cards in the homepage "Eight
disciplines, one team" grid. All 8 now have a dedicated full-bleed card
background instead of the shared `MINI_SCENES`/`<SceneViewport>` corner
icon (`mini-scenes.ts`'s `MINI_SCENES` map is empty as of ADR-0054, kept
as the registration point for a future non-dedicated card, not deleted).
**Geotechnical, Design & Drafting, Structural Engineering, Civil
Engineering, Stormwater & Flood Modelling, Advisory Services, and Telecom
Services are seven of the eight** (`DEDICATED_CARD_SCENES`
lookup, keyed by slug): instead of a mini-scene icon, each renders a
full-bleed `<HeroScene createScene={...} />` behind the card content (plus
a `bg-gradient-to-t` scrim so the title/description/EXPLORE link stay
legible on top) — the small, contained version of the same scene also
used on that service's detail-page hero (`createSolarisCardScene`/
`createAetherFluxCardScene`/`createEinsteinRosenLatticeCardScene`/
`createGoldenParthenonCardScene`/`createNegentropySpiralCardScene`/
`createAureoleCardScene`/`createSpiralGalaxyCardScene`). See
`build-solaris-scene.ts`/
`build-aether-flux-scene.ts`/`build-einstein-rosen-lattice-scene.ts`/
`build-golden-parthenon-scene.ts`/`build-negentropy-scene.ts`/
`build-aureole-scene.ts`/`build-spiral-galaxy-scene.ts` and
ADR-0036/ADR-0043/ADR-0044/ADR-0045/ADR-0047/ADR-0048/ADR-0051/ADR-0054 in
[[decisions-log]] for why these seven cards need their own dedicated
`HeroScene` context rather than the shared mini-scene renderer.

**Project Control Services is the eighth exception, and the only one not
WebGL** (`DEDICATED_CARD_VIDEOS` lookup, a sibling to
`DEDICATED_CARD_SCENES` for this one non-scene asset type): a full-bleed
`VideoBackground` (`src/components/common/VideoBackground.tsx`,
`pauseWhenOffscreen` set) plays the card-sized re-encode of the same
Siloutte video used on that service's page background, same gradient-scrim
treatment as the WebGL cards. See ADR-0050.

## Skeleton loaders

Three skeleton components for `loading` states of async-data components — every
async component must mirror its final layout with one of these
(see [[component-conventions]]).

| Component | File | For |
|-----------|------|-----|
| `<SkeletonImage>` | `skeleton-image.tsx` | image placeholders |
| `<SkeletonLoader>` | `skeleton-loader.tsx` | generic block placeholders |
| `<SkeletonVideo>` | `skeleton-video.tsx` | video placeholders |

> [!note]
> `components/ui/` (design-system primitives) does not exist yet — create it when
> the first primitive is added. See [[folder-structure]].

## Service detail page sections — `src/views/services/`

The 6-section structure every `/services/<slug>` page renders (service-pages
Phase 0 — see [[changelog]] and [[decisions-log]] ADR-0030/0031/0032), assembled
by `service-detail.tsx`. `ServiceHero` (pre-existing) + `ServiceOverview`
(extended in place) aren't listed again here — see [[tech-stack]] for the hero
scene plumbing and the duotone photo treatment respectively.

**One exception to `ServiceHero`:** Geotechnical Engineering
(`service.slug === "geotechnical-engineering"`) renders
`GeotechnicalAnalysisHero.tsx` instead — a bespoke, literal text-left/
bounded-3D-right layout `ServiceHero.tsx`'s existing branches don't
support (ADR-0061). It composes `GeotechnicalFeaScene.tsx`
(`src/components/scene/`, a client leaf wrapping `<HeroScene>` plus the
construction-stage/result-mode/deformation control panel), which mounts
`build-geotechnical-fea-scene.ts` — see [[tech-stack]] for that scene's
own module breakdown. This page still keeps `sceneTheme: "solaris"` and
`isGlassSceneTheme`/`.glass-panel` unchanged (Solaris still renders as the
page's full-page background; the FEA scene layers on top of it inside the
hero only, deliberately transparent around it) — the special-case is
purely about which hero component mounts, not the page's `glass` status.

| Component | Role |
|-----------|------|
| `ServiceStats.tsx` | Wraps the existing `StatCounter` (`src/views/home/`, now with an optional `prefix` prop for values like "$2B+") in a 3-stat row |
| `ServiceSubServiceGrid.tsx` | 6-card grid, local `SubServiceCard` with `@react-spring/web`-driven hover-tilt (not `TiltCard` — these cards aren't clickable) |
| `ServiceProcess.tsx` | Numbered process-step timeline; 5 vs 6 steps switches a static `lg:grid-cols-5`/`lg:grid-cols-6` (Tailwind needs literal class strings, not an interpolated count) |
| `ServiceRelatedProjects.tsx` | Filters real `projects.ts` data through the curated `SERVICE_PROJECT_CATEGORIES` map (`src/data/mocks/service-project-map.ts`), capped at 6, reuses the existing `ProjectCard`/`ProjectModal` unchanged |
| `ServiceCta.tsx` | Magnetic CTA linking to `/contact`, heading text templated as "Ready to start your `<service>` project?" |

All four above (plus `ServiceOverview`) take an optional `glass?: boolean` —
`service-detail.tsx` computes `isGlassSceneTheme(service.sceneTheme)`
(`GLASS_SCENE_THEMES` in `services.ts` — currently `solaris`, `aether-flux`,
`einstein-rosen-lattice`, `golden-parthenon`, `negentropy`,
`schedule-network-graph`, and `advisory-lifecycle-network`) once and
threads it through (`ServiceOverview` reads `service.sceneTheme` directly
since it already has `service`). When true, the section swaps its opaque
`bg-background`/`bg-background-alt` panel for the `.glass-panel` utility
(`src/app/globals.css`) — currently the Geotechnical, Design & Drafting,
Structural Engineering, Civil Engineering, Stormwater & Flood Modelling,
Project Control Services, and Advisory Services pages. The same
`service-detail.tsx` wrapper also sets
`data-glass-readability` and
overrides `--foreground`/`--foreground-muted` when `glass` is true — a
page-scoped text-shadow (inherited, so it reaches every descendant) and a
brighter muted-text colour than the sitewide default. See ADR-0040,
ADR-0041, ADR-0042, ADR-0044.

**Stormwater & Flood Modelling only** carries a second, stronger override
on top of the above — `stormwaterGlassStyle` in `service-detail.tsx`
re-points the Tier 2 `--glass-fill`/`--glass-border`/`--glass-blur`/
`--glass-text-shadow` roles at a more-transparent Tier 1 quartet
(`--raw-color-glass-fill-clear` 0.35 vs the sitewide 0.65,
`--raw-color-glass-border-clear` 0.08 vs 0.1, `--raw-blur-glass-clear`
12px vs 20px, `--raw-shadow-glass-text-strong` 0.9 vs 0.8 alpha) so the
Negentropy particle field reads clearly through every section — same
scoped-CSS-custom-property mechanism as `getServiceAccentStyle`, just a
second page-specific variant of it, keyed by slug rather than by
`glass`/`sceneTheme`. The other four glass pages are unaffected — confirmed
via `getComputedStyle` on each page's wrapper before shipping. See
ADR-0049.

> [!note] `#todo`
> `/contact` doesn't exist as its own route yet — it's really the homepage's
> `#contact` anchor section. This CTA matches the same (pre-existing) pattern
> `Nav`/`Footer` already use; not fixed here, flagged for whenever `/contact`
> becomes a real route.

### HeroFallback — `src/components/scene/HeroFallback.tsx`

`<HeroFallback className>` — the default substitute for `HeroScene`'s WebGL
canvas on the low-power device tier (`isLowPowerDevice()` — a capability
check on cores/memory/mobile-UA, independent of viewport width as of
ADR-0078; not a raw width breakpoint — see [[tech-stack]] and
[[decisions-log]] ADR-0031, ADR-0078): a slowly pulsing radial-gradient glow
via a looping `useSpring`, reading `--accent`/`--glow` from whatever CSS
scope it renders in, so it shows each service page's own tint automatically.
Matches `SceneViewport`'s existing low-power-fallback convention for mini
scenes. Used for the homepage hero and every service-page hero that isn't
one of the 9 fixed-full-page background routes below.

### SceneFallbackGradient — `src/components/scene/SceneFallbackGradient.tsx`

`<SceneFallbackGradient gradient className>` — what each of the 9 dedicated
full-page `*Background.tsx` wrappers (`SolarisBackground`,
`AetherFluxBackground`, `EinsteinRosenLatticeBackground`,
`GoldenParthenonBackground`, `NegentropyBackground`, `AureoleBackground`,
`SpiralGalaxyBackground`, `PinwheelGalaxyBackground`,
`AurumPeakBackground`) passes as `HeroScene`'s `fallback` prop instead of
the default `HeroFallback` above. A plain, deliberately *unanimated* radial
gradient — no spring pulse, since the entire point of this tier is zero
per-frame cost — toned to that specific scene's own real palette. As of
ADR-0058, `gradient` is a single `var(--raw-gradient-fallback-<scene>)`
reference — one Tier-1 token per scene in `globals.css` holding a full
3-stop `radial-gradient(...)` literal, replacing the original ADR-0056
two-stop `from`/`to` colour-pair design — not the sitewide `--accent`/
`--glow`, which also tints buttons/links and doesn't match an individual
scene's palette anyway. See ADR-0056, ADR-0058.

## ProjectExperienceSection — `src/views/home/ProjectExperienceSection.tsx`

Homepage section (mounted between `ServicesSection` and `StatsSection`) — a
real Geoporte staff site-visit photo (`public/assets/team/geoporte-team.jpg`,
downloaded from geoporte.com.au) plus two colour-block stat callouts on the
left, the "Experience & Technology" / "Project Experience" copy and a
`Magnetic` "Learn more →" CTA to `/about` on the right. Content (stats,
copy, photo) lives in `src/data/mocks/experience.ts`, not hardcoded in the
component. Wrapped in the sitewide `.glass-panel` utility — justified on the
homepage (unlike most plain-background sections) because `AmbientBackground`
renders a persistent WebGL scene behind every homepage section, same
reasoning as `ServiceCta`'s `glass` variant. Both content columns reveal via
`<Inview mode="once">`, right column offset with `delayIn={150}` after the
left, matching `AboutSection`'s stagger.

`ExperienceStatBox.tsx` (same folder) — one colour-block stat card, the same
spring count-up idiom as `StatCounter.tsx` (`useDynamicInView` +
`useSpring`), styled as a flat solid fill instead of a plain centred number.
`variant: "purple" | "amber"` picks `bg-stat-purple`/`bg-stat-amber` — the
first purple/amber tokens in the palette (`--raw-color-stat-purple`/
`-amber` → `--stat-purple`/`-amber` → `--color-stat-purple`/`-amber` in
`globals.css`), deliberately outside the sitewide azure family, same
reasoning as the per-service accent tints. See [[changelog]].

## Related

[[component-conventions]] · [[components/animation-springs]]
