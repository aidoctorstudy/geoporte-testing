---
tags: [frontend, stable]
updated: 2026-08-26
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

## Homepage motion/3D overhaul globals (Phase 0)

Six new client leaves, all mounted once in the root layout alongside the existing
headless globals (`AdaptiveGrid`, `ReducedMotion`, `LanguageDirection`) — see
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

First-visit-only load animation: the wordmark reveals letter-by-letter through
`spring-text-engine` (not a hand-rolled SVG path-trace — real per-glyph vector
outlines aren't available for arbitrary web fonts, and the project's hard rule is
that all text animation goes through the vendored text engine), holds, then the
overlay explodes outward (`<Spring>`, opacity/scale) as the hero reveals beneath it.
Gated by a `localStorage` flag (skipped on every return visit) and skipped entirely
under `prefers-reduced-motion` — no partial/instant substitute, since no motion at
all is the correct reduced-motion behaviour for a load animation. Locks/unlocks Lenis
scroll (`useScroll().stop()/start()`) for its ~2.2s duration.

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
`RouteTransitionSweep`. A dismissible bottom-left notice ("Some 3D elements
have been simplified for your device's performance."), shown once per page
lifetime the first time either a static hardware hint
(`navigator.hardwareConcurrency`/`deviceMemory` ≤ 4, checked once on mount)
or a measured hero-scene frame-rate drop below 30fps fires — both come from
`src/lib/scene/performance-monitor.ts`. Mirrors `Cookie/CookieBanner.tsx`'s
`useTransition` mount/unmount idiom (same spring config), bottom-left instead
of bottom-right, self-dismissing after 8s or via its own × button rather than
store-driven. See ADR-0033 in [[decisions-log]].

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
| `Nav.tsx` | Desktop bar — logo, `ServicesDropdown`, secondary links, `LanguageSwitcher`, CTA, mobile toggle |
| `ServicesDropdown.tsx` | Hover-open services menu (desktop) — CSS-only per ADR-0014, not a spring |
| `LanguageSwitcher.tsx` | Click-open language dropdown — see [[i18n]] |
| `MobileMenu.tsx` | Full-screen mobile nav, `<Spring>`-driven open/close |
| `nav-links.ts` | Primary nav link data — also consumed by `Footer` |

## Footer — `Footer/`

Site footer, mounted once in the root layout after `<main>`. Lives in
`src/components/common/Footer/`. Renders contact details, the service list,
`nav-links.ts`, and office locations from `@/lib/company`.

## LanguageDirection — `LanguageDirection.tsx`

`<LanguageDirection>` — a client leaf that syncs `document.documentElement.lang`
/ `dir` to the language store, flipping RTL for Arabic/Urdu. Renders `null`;
mounted once in the root layout next to `<ReducedMotion>`. See [[i18n]].

## TranslatedText — `TranslatedText.tsx`

`<TranslatedText text="..." />` — resolves a UI string through `useTranslated`.
Exists as a component (not a bare hook call) so it can sit inside `.map()`
lists without breaking the rules of hooks. See [[i18n]].

## SectionHeading — `SectionHeading.tsx`

`<SectionHeading eyebrow heading id tag? headingClassName? />` — the eyebrow +
`TextEngine` heading pattern repeated across every homepage section, with
built-in language-switcher translation. See [[i18n]] and [[text-engine]].

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

| Component | Role |
|-----------|------|
| `ServiceStats.tsx` | Wraps the existing `StatCounter` (`src/views/home/`, now with an optional `prefix` prop for values like "$2B+") in a 3-stat row |
| `ServiceSubServiceGrid.tsx` | 6-card grid, local `SubServiceCard` with `@react-spring/web`-driven hover-tilt (not `TiltCard` — these cards aren't clickable) |
| `ServiceProcess.tsx` | Numbered process-step timeline; 5 vs 6 steps switches a static `lg:grid-cols-5`/`lg:grid-cols-6` (Tailwind needs literal class strings, not an interpolated count) |
| `ServiceRelatedProjects.tsx` | Filters real `projects.ts` data through the curated `SERVICE_PROJECT_CATEGORIES` map (`src/data/mocks/service-project-map.ts`), capped at 6, reuses the existing `ProjectCard`/`ProjectModal` unchanged |
| `ServiceCta.tsx` | Magnetic CTA linking to `/contact`, heading text templated as "Ready to start your `<service>` project?" |

> [!note] `#todo`
> `/contact` doesn't exist as its own route yet — it's really the homepage's
> `#contact` anchor section. This CTA matches the same (pre-existing) pattern
> `Nav`/`Footer` already use; not fixed here, flagged for whenever `/contact`
> becomes a real route.

### HeroFallback — `src/components/scene/HeroFallback.tsx`

`<HeroFallback className>` — the mobile substitute for `HeroScene`'s WebGL
canvas (below the mobile device tier — see [[tech-stack]] and [[decisions-log]]
ADR-0031): a slowly pulsing radial-gradient glow via a looping `useSpring`,
reading `--accent`/`--glow` from whatever CSS scope it renders in, so it shows
each service page's own tint automatically. Matches `SceneViewport`'s existing
mobile-fallback convention for mini scenes.

## Related

[[component-conventions]] · [[components/animation-springs]]
