---
tags: [workflow, qa, stable]
updated: 2026-08-25
---

# Workflow — QA & Verification

How work in this repo is checked before it is called done. Two layers, because
half the hard rules are mechanically decidable and half are not.
ADR: [[decisions-log]] ADR-0019.

## Layer 1 — `.claude/scripts/verify.sh`

```bash
.claude/scripts/verify.sh                     # whole src/
.claude/scripts/verify.sh src/views/about.tsx # scoped
```

Exit code 1 on any **FAIL**. **WARN**s never fail the run — they are judgement
calls that must be fixed or justified, not ignored.

What it decides mechanically:

| Group | Checks |
|-------|--------|
| Motion | `@keyframes`, foreign animation libs, `mode="manual"`, `leading-none`+`overflow`, dead `duration-fast` class, untokenised transitions |
| Tokens | hex in `className`/`style`, arbitrary px, literals in `@theme inline` or a Tier 2 token |
| Architecture | route importing outside `views/`, `"use client"` on page/layout/view, `any`, `next/router`, `middleware.ts`, `process.env` outside `env.ts` |
| Markup | raw `<img>`, missing `alt`, raw `<a>` internal link, click handler on a `div`, multiple `<h1>`, `tag="div"` |
| Hygiene | `console.log`, TODO/FIXME, **any diff inside the vendored animation engine** |

It is deliberately conservative: it greps source, it does not parse TypeScript, so
it can miss things and occasionally flags a legitimate case. Prefer a false
positive you dismiss over a rule nobody checks.

> [!note] It does not replace `yarn lint` or `yarn build`
> Run all three. The script checks *this project's* rules; the compiler and
> linter check the language.

## Layer 2 — the `qa-verify` skill

The checks a script cannot make: design fidelity against a **re-fetched** Figma
node, whether a token is named for its purpose, whether the chosen spring
primitive is the right one, semantics and heading outline, responsive behaviour
down to 320px, and whether content genuinely arrives via props.

The loop: run layer 1 → fix every FAIL → walk layer 2 section by section → re-run
layer 1 (fixes introduce violations) → repeat until clean.

## When it runs

- `/qa` — on demand
- inside `/new-page` and `/section` before they report done
- inside `/ship` as the first gate
- by the `section-builder` agent before it hands back

## Known gaps

- No visual regression testing — no baseline screenshots, so "matches the design"
  remains a human/model judgement.
- No automated a11y engine (axe/Lighthouse CI) — contrast and focus order are
  checked by inspection.
- No unit or E2E tests in the project at all. If that changes, this workflow is
  where the gate belongs.

## Browser QA gotchas (Claude-in-Chrome specifically)

Two false alarms hit during the service-pages hero-scene work (see
[[changelog]] 2026-08-25, Phase 1) are worth checking for *before* concluding
a WebGL/canvas scene is actually broken:

- **Stale dev-server bundle after editing a file the running `next dev`
  already served.** Editing a `.ts`/`.tsx` file on disk doesn't guarantee the
  already-running dev server's Turbopack cache serves the new code on the next
  navigate — it can keep serving the old compiled chunk. If a scene looks
  unchanged after an edit, don't assume the edit was wrong first: fetch the
  loaded JS chunks (`performance.getEntriesByType('resource')`, filter
  `.js`, `fetch()` each, search for a literal string unique to the new vs. old
  version — identifiers can survive dev bundling but a JSDoc/comment string is
  the most reliable) and confirm which version is actually running. If it's
  stale, kill and restart the dev server process rather than debugging code
  that was never actually re-served.
- **The automation tab can report `document.hidden === true` /
  `visibilityState === "hidden"` permanently** (not actually composited by the
  OS), which is exactly the condition every WebGL scene in this project is
  *designed* to pause on (battery-saving, correct behaviour for a real user's
  backgrounded tab) — so the canvas exists, sized correctly, with a valid
  context, but never draws a single frame, looking identical to a genuinely
  broken scene. Check `document.hidden` first when a scene renders nothing.
  To force a real frame for verification, override the property and redispatch
  the event from the page console: `Object.defineProperty(document, 'hidden',
  { get: () => false, configurable: true })` (same for `visibilityState` →
  `'visible'`), then `document.dispatchEvent(new Event('visibilitychange'))`.
  Do this *after* the component has mounted, not immediately on navigate — too
  early and the `visibilitychange` listener isn't attached yet.
- **After several hours of continuous heavy WebGL churn in one automation
  session, the tab/browser itself can degrade to where a hero canvas simply
  never gets appended to the DOM** — `document.createElement("canvas")` and
  `container.appendChild()` inside the mount effect stop having any visible
  effect, with zero thrown errors anywhere (`window.onerror`,
  `unhandledrejection`, React's own console output). This happened during
  service-pages Phase 4 (see [[changelog]] 2026-08-25) after three earlier
  phases' scenes had each been screenshotted working correctly with the exact
  same shared `HeroScene.tsx`/`hero-scene-runtime.ts` code. Before concluding
  the *app* is broken, rule out the environment in this order — each is cheap
  and any one of them fixing it tells you which layer was actually at fault:
  1. A fresh dev-server restart (the stale-bundle gotcha above).
  2. A full process kill + delete `.next` + fresh `npm run dev` (rules out
     Turbopack persistent-cache corruption, not just stale HMR state).
  3. A brand-new tab via `tabs_create_mcp` instead of reusing one that's been
     through many navigations (rules out per-tab WebGL context accumulation —
     hiding a canvas via `style.display='none'` does **not** free its WebGL
     context, and this session had hidden many across dozens of pages).
  4. `next build && next start` instead of `next dev` (rules out React Strict
     Mode's dev-only double-effect-invocation as the culprit).
  5. A raw `canvas.getContext('webgl')` probe, independent of React/three.js,
     to confirm the browser can still create *any* WebGL context at all.
  If all five still reproduce the same failure — as they did here — it's the
  browser-automation tab/GPU state itself, not the code. At that point, fall
  back to: `verify.sh` + `yarn lint` + `yarn build` (TypeScript) all passing,
  zero console errors on a real page load, and code review against a scene
  that *was* visually confirmed working with the same shared plumbing. Don't
  keep escalating debugging effort past this point — there is no tool
  available to restart the actual Chrome process or inspect `chrome://gpu`
  from within this harness.

## Related

[[agent-harness]] · [[new-page]] · [[ship]] · [[ai-agent-guide]]
