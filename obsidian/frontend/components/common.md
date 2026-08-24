---
tags: [frontend, stable]
updated: 2026-08-24
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

## Related

[[component-conventions]] · [[components/animation-springs]]
