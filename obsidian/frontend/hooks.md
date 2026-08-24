---
tags: [frontend, stable]
updated: 2026-08-24
---

# Catalog — Hooks

Custom hooks in `src/hooks/`, grouped by domain.

## `hooks/animation/` — `#do-not-modify`

The hooks powering the [[animation-system]]. Consume them through the spring
components — don't call them directly unless extending the engine.

| Hook | File | Role |
|------|------|------|
| `useInViewRef` | `use-in-view-ref.ts` | IntersectionObserver ref for viewport detection |
| `useDynamicInView` | `use-dynamic-in-view.ts` | in-view detection with dynamic targets |
| `useLoopInView` | `use-loop-in-view.ts` | in-view tied to a render loop |
| `useProgressTrigger` | `use-progress-trigger.ts` | scroll → 0–1 progress (powers `<SpringTrigger>` / `<ProgressTrigger>`); returns `progress` as a `RefObject<number>` — read `.current` |
| `useSpringTrigger` | `use-spring-trigger.ts` | scroll-driven spring logic |
| `useLoop` | `use-render-loop.ts` | subscribes a callback to the shared rAF ticker (`src/lib/animation/ticker.ts`) |
| `useResizeLoop` | `user-resize-loop.ts` | runs a callback when window width changes (via `useLoop`) |

## `hooks/smooth-scroll/`

| Hook | File | Role |
|------|------|------|
| `useScroll` | `use-scroll.ts` | Zustand store for Lenis + scroll state — see [[smooth-scroll]] |

## `hooks/cursor/`

| Hook | File | Role |
|------|------|------|
| `usePointer` | `use-pointer.ts` | Shared pointer position/velocity store — one `window.pointermove` listener for the whole app (`useSyncExternalStore`, same idiom as `useWindowSize`). Also exports `getPointerSnapshot()`, a non-reactive read for per-frame consumers (ticker callbacks, WebGL render loops) that must not re-subscribe on every pointer move. `isFinePointer` gates cursor-driven effects off on touch (`matchMedia("(hover: hover) and (pointer: fine)")`). `hasMoved` is false until the first real `pointermove` — consumers must stay hidden/inert until it flips true, or they render at the stale `0,0` default (see ADR-0027). |

## `hooks/scroll/`

| Hook | File | Role |
|------|------|------|
| `useScrollSignal` | `use-scroll-signal.ts` | Shared whole-page scroll progress/velocity/direction store, bridged from Lenis's own `scroll` event by `<ScrollSignal>` (see [[components/common]]) rather than each consumer re-deriving progress from `getBoundingClientRect()`. Also exports `getScrollSignalSnapshot()` for per-frame consumers. |

## `hooks/` (root)

| Hook | File | Role |
|------|------|------|
| `useWindowWidth` / `useWindowHeight` / `useWindowSize` | `use-window-size.ts` | SSR-safe window dimensions — all three share **one** debounced (300 ms) `resize` listener via a `useSyncExternalStore` store |
| `useAdaptiveGrid` | `use-adaptive-grid.ts` | Scales the root `<html>` font-size up while the viewport exceeds `baseWidth` — powers `<AdaptiveGrid>`, see [[components/common]] |

> [!note] Shared render loop
> Loop-based hooks (`useLoop`, `useResizeLoop`, `useLoopInView`, the trigger
> hooks) all subscribe to the single app-wide ticker in `src/lib/animation/ticker.ts`
> rather than each starting their own `requestAnimationFrame`. See
> [[animation-system]]. The ticker is **not** `#do-not-modify`.

## Adding a hook

Place it under `hooks/<domain>/`. Data-fetching logic belongs in hooks, not in
presentational components. Use [[templates/hook-note]] to document it here.

## Related

[[animation-system]] · [[smooth-scroll]] · [[utils]]
