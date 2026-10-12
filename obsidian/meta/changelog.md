---
tags: [meta, changelog]
updated: 2026-10-11
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

## 2026-10-12 (Fixed: the particle emblem flashed the solid logo shape for about a second before its scatter-to-assemble intro played)

Report: the hero's particle logo effect shows the original logo image
briefly before breaking into particles. Full root-cause in
[[decisions-log]] ADR-0096; short version here.

- The loaded `Image`/offscreen `<canvas>` used to sample pixel positions
  were never DOM-attached, so neither could render visibly — confirmed
  by re-reading the code, not guessed. The real cause: the callback that
  fires once the image finishes loading unconditionally forced one frame
  of the particles in their *fully assembled* position — dense enough,
  at this image's sampling density, to look like a solid logo render,
  not particles — before the real 2-second scatter-based intro had drawn
  a single frame. A previous entry's own comment had called this
  "harmless" — it was the bug.
- Fixed: that forced render now only happens for
  `prefers-reduced-motion` visitors (the one case that actually needs
  it). The normal animated path renders nothing until the next real
  frame tick, whose own logic anchors the assembly timer to exactly that
  moment — so the very first frame of real particle data is always the
  genuine scatter, never the assembled shape.
- Also added explicit (if redundant, given it's never DOM-attached)
  `opacity: 0`/`display: none` on the source `Image` element, for
  anyone reading the code later.
- `npx eslint`/`npx tsc --noEmit` clean; `.claude/scripts/verify.sh`
  unchanged; `next build` (Turbopack) clean. **Not verified in a live
  browser this turn** — reasoned from the render-timing logic, same way
  the bug itself was found.

## 2026-10-12 (Nav bar fill changed from dark navy to pure black)

Explicit request: nav background `rgba(0, 0, 0, 0.85)` +
`backdrop-filter: blur(10px)`. Full reasoning in [[decisions-log]]
ADR-0095; short version here.

- New tokens: `--raw-color-nav-background`/`-glass` + `--raw-blur-nav`,
  bound through Tier 2 and consumed in `Nav.tsx` via `var()`-reference
  arbitrary values, not literals.
- `Nav.tsx` already had two variants (default + a more-transparent one
  for pages with their own fixed full-page background,
  `isGlassBackgroundRoute()`). Both are black now; the glass variant
  kept its "more transparent than default" relationship (`0.7` vs the
  default's exact `0.85`) rather than collapsing to one literal number,
  which would have made glass routes' nav *less* see-through than
  before — a regression on the pages that transparency exists for.
- `npx eslint`/`npx tsc --noEmit` clean; `.claude/scripts/verify.sh`
  unchanged; `next build` (Turbopack) clean — confirmed the new tokens
  compiled correctly. Not verified in a live browser this turn.

## 2026-10-12 (Hero particle effect switched from a text "GEOPORTE" wordmark to the real Geoporte emblem image — sampled asynchronously, with a reduced-motion race caught and fixed before shipping)

Same-day follow-up to the hero redesign below: use the actual circular
logo emblem (`/assets/logo/geoporte-logo.png`, the navbar/footer mark),
not text, for the particle effect. Same colour, same assembly/breathe,
large on the right. Full reasoning in [[decisions-log]] ADR-0094; short
version here.

- Confirmed the asset first, not assumed: a `node` PNG-header read
  showed 480×480, RGBA (has alpha) — already background-removed, so the
  same alpha-threshold sampling technique applies directly.
- **Real architecture change, not just a swapped function**: image
  decode is asynchronous (`image.onload`), unlike canvas-rendered text,
  but `createHeroScene` still has to return synchronously (every other
  scene builder in this codebase shares that contract). The
  `THREE.Points` object is now built immediately with an invisible
  placeholder, then its real position attribute is swapped in once the
  image loads.
- The assembly timer now anchors to "the image became ready", not "the
  scene was created" — otherwise a slow decode would skip partway
  through the 2s ease before any real positions existed.
- **Caught a real race before shipping, not after**: a reduced-motion
  visitor's one-and-only `renderStatic()` call fires before the async
  image could possibly have loaded — with the old synchronous text
  design that was fine, but with an async image it meant a
  reduced-motion visitor would never see the emblem at all. Fixed with a
  second force-render once the image is ready
  (`renderAssembledOnce()`), built deliberately independent of the
  animated path's own assembly timer so it can't desync it if both are
  running at once — an earlier version of the fix would have caused a
  visible assemble→scatter→reassemble glitch on the very next frame,
  caught by reasoning through the interaction, not by watching it happen.
- Particle sampling density re-tuned (baseline step doubled) for a
  solid-filled icon shape rather than sparse wordmark strokes, which
  would otherwise oversample by a large factor at the old step value.
- `npx eslint`/`npx tsc --noEmit` clean; `.claude/scripts/verify.sh`
  unchanged; both `next build` (Turbopack) and `next build --webpack`
  clean. **Not verified in a live browser this turn.**

## 2026-10-12 (Homepage hero redesigned "AiMatic-style": the digital-twin diorama removed outright, replaced by a two-column layout with a glowing particle "GEOPORTE" wordmark and a now-transparent background over the persistent globe)

Explicit redesign brief naming a reference style. Full reasoning in
[[decisions-log]] ADR-0093; short version here.

- **Removed outright** (not hidden behind a flag): the hero's old
  hand-built digital-twin diorama — valley terrain, bridge, tunnel,
  geological strata, borehole markers, a lidar-style point cloud, a
  construction rig (crane/girders/scaffolding), drifting dust. All of
  `build-hero-scene.ts`'s builder functions and the render-loop logic
  driving them are gone.
- **The particle "GEOPORTE" wordmark is now the hero's entire remaining
  3D content** (earlier the same day it was a secondary accent inside
  the diorama — see the entry below). Assembles from a scatter over ~2s,
  then breathes/drifts idle, and now scatters away from the cursor on
  hover (a per-frame plane-raycast finds the cursor's position on the
  wordmark's own plane; particles within range push away and spring
  back) — gated for free on the same `pointer.hasMoved` check this
  codebase already uses sitewide, so it can't punch a permanent hole
  through the centre on touch devices or untouched page loads.
- **Real `UnrealBloomPass` glow** via a single `EffectComposer` (mirrors
  `build-solaris-scene.ts`'s simpler single-composer shape, not
  `build-planet-scene.ts`'s 3-composer selective-layers trick — nothing
  here needs selective bloom since the whole scene is meant to glow).
  Scales by the capability tier's `bloomScale`; disables itself outright
  on medium/low capability.
- **Hero background is now transparent**, reversing ADR-0068 — that
  decision made it opaque specifically so the old diorama could read as
  the only 3D content; with the diorama gone, the persistent Earth globe
  (and ambient shapes) now show through the hero too, including on the
  low-power-tier fallback path (`fallback={null}` passed to `<HeroScene>`
  for this one call site only).
- **Layout**: the hero's text content is now a left-anchored `max-w-xl`
  column (was a centred full-width block), matching the brief's explicit
  left-text/right-particle split. Typography needed no further change —
  already using the heading-blue/white/label-slate system and Playfair
  Display/Inter pairing from earlier the same day.
- `npx eslint`/`npx tsc --noEmit` clean; `.claude/scripts/verify.sh`
  unchanged; both `next build` (Turbopack) and `next build --webpack`
  clean. **Not visually tuned against a live browser** — no Chrome
  extension connected any session this was built across. The wordmark's
  placement, the hover feel, and the bloom strength are all best-effort,
  documented choices — flagged rather than assumed working.

## 2026-10-12 (`--foreground-muted` split into two roles — "normal" body text is now actually white; small-uppercase labels get their own `--label`/`text-label`)

Follow-up: "make the normal text fully white." `--foreground` (body
text) was already white, but `--foreground-muted` — retargeted to slate
in the previous entry's colour retint, intending it for "section
labels" — turned out to also back dozens of plain paragraph/caption
call sites with no label styling at all (hero subtext, About's intro
paragraphs, card descriptions, nav hover states, …), so most of the
site's actual reading text was rendering grey instead of white. Full
reasoning in [[decisions-log]] ADR-0092.

- `--foreground-muted` → white. Every non-label consumer (the broad,
  plain-paragraph majority) picks this up automatically, no per-file
  changes needed.
- New `--label` role (same slate, `#94A3B8`) → new `text-label` utility,
  for the 38 genuine small-uppercase-label lines specifically (eyebrows,
  form labels, Footer column headers, nav labels) — found by grepping
  every `text-foreground-muted` + `uppercase` co-occurrence, then
  mechanically swapped via `sed` across 19 files.
- The Geotechnical page's own page-scoped `--foreground-muted` override
  (bright pale blue, for contrast against its warm background) is
  untouched.
- `npx eslint`/`npx tsc --noEmit` clean; `.claude/scripts/verify.sh`
  unchanged; `next build` (Turbopack) clean — confirmed in the compiled
  CSS that `text-label` (and its `/50` opacity variant) and the
  retargeted `--foreground-muted` both compiled correctly. Not verified
  in a live browser this turn.

## 2026-10-12 (A pushed commit silently never deployed on Vercel — no code change, just the incident)

Report: "nothing changed on the live site" after the font/colour/particle-
logo/contact-form commit (`1729514`, previous entry below) was pushed.
Investigated by curling the live site directly rather than guessing:
confirmed the two commits before it *were* live (the i18n rebuild and the
Tier 1 background fix both showed up in the deployed HTML/CSS), but
`1729514` itself never did — the deployed page still had the old
"Eight disciplines, one team" text, the old Fontshare link, none of the
new colour tokens. The commit built cleanly locally under both the
webpack fallback and the default Turbopack path (the one Vercel actually
uses) — no reproducible build error found. Since the commit was already
on `origin/master`, a plain `git push` does nothing (no new push event,
no fresh webhook); pushed an empty commit (`800392d`) specifically to
force a new build attempt. That attempt succeeded and the live site now
has everything from `1729514` — confirmed again via direct `curl`
(heading text, fonts, colour tokens, the contact form's new field all
present). Root cause of the original non-deploy is still unknown — no
Vercel dashboard/API access from this environment to see why that one
build was dropped or failed silently. Noted here specifically so a
future "I pushed but the site didn't change" report isn't assumed to be
a code bug first — check whether the commit actually deployed before
re-debugging the code.

## 2026-10-12 (Heading/body font pair + heading colour retint + a particle GEOPORTE logo in the hero + services-heading copy + a Company field on the contact form)

Five-part brief. Full reasoning (including what was already true vs what
needed building, and the touch-target `min-h` correction found along the
way) in [[decisions-log]] ADR-0091; short version here.

- **Copy:** "Eight disciplines, one team" → "Our Services" in both
  places it appears (`services.tsx`, `home/ServicesSection.tsx`).
- **Particle logo:** a "particles form a logotype" effect added *inside*
  the existing homepage hero scene (`build-hero-scene.ts`) — renders
  "GEOPORTE" to an offscreen canvas, samples lit pixels into one
  `THREE.Points` particle each, eases them in from a scatter over ~2.8s,
  then idles with a per-particle breathe/drift. Deliberately not a second
  WebGL context (would reopen the concurrent-context budget ADR-0084/
  85/87 closed). Colour reuses the new heading accent (next item).
  Placement not visually tuned live (no browser this session) — flagged.
- **Fonts:** Playfair Display (headings) + Inter (body), both via
  `next/font/google`, replacing the previous single General-Sans-for-
  everything stack (a Fontshare `<link>`, now removed).
- **Colours:** new `--heading` role (`#4FC3F7`) for every h1/h2;
  `--foreground-muted` (eyebrows/section labels, and every other "muted"
  text sitewide) retargeted from an azure-tinted blue to a calm slate
  (`#94A3B8`); `--foreground` (body text) was already pure white —
  confirmed, not changed. Audited all 14 `SectionHeading` call sites
  before applying — none needed special-casing, and the one genuinely
  different-palette page (`GeotechnicalAnalysisHero`'s light section) is
  untouched since it lives on a separate, unrelated token family.
  Literal h1/h2 tags outside the shared heading components updated too
  (`TeamCascade.tsx`, `ProjectsShowreel.tsx`, `ProjectsCascade.tsx`,
  `Footer.tsx`); modal titles and legal-page subsection headers
  deliberately left alone (small UI chrome, not "main headings" in
  spirit).
- **Also fixed:** two `min-h-11`/`min-h-10` touch targets added earlier
  this session (`LanguageSwitcher.tsx`, `MobileMenu.tsx`) were wrong per
  this project's own documented rule (ADR-0063) — a real pixel
  touch-target needs an arbitrary absolute value, not a rem utility,
  because the adaptive scaling grid rescales the root font-size. Reverted
  to `min-h-[44px]`/`min-h-[40px]`.
- **Contact form:** added a `company` field (optional) to both
  `ContactForm.tsx` and `/api/contact/route.ts`'s `zod` schema — without
  the schema change a submitted value would've been silently dropped
  server-side. The "liquid glass panels" ask was already true (`/contact`
  already wraps the form in `.glass-panel`); the field was the only gap.
- `npx eslint`/`npx tsc --noEmit` clean; `.claude/scripts/verify.sh`
  unchanged (same pre-existing FAIL/WARNs); `next build --webpack` clean
  — confirmed both fonts self-hosted correctly and every new token/
  utility compiled to the expected value. **Not verified in a live
  browser this turn** (Chrome extension wasn't connected) — flagged
  rather than assumed, especially for the particle logo's look.

## 2026-10-12 (Tier 1's "flat black background" root-caused and fixed: `PlanetBackground`/`AmbientBackground` get the same static-gradient fallback their 9 sibling scenes already had; the Tier 1 glass-panel fill lightened for contrast)

Report: "Tier 1 is too aggressive — plain black background with just
text," asking for dark navy + images + glass panels + all sections to
stay, with WebGL/animation/blur/parallax gone. Checked first, not
assumed: everything the report says should already be removed (WebGL,
CSS transitions/animations, backdrop-filter blur) already was, confirmed
against `globals.css` and the prior "baqala mode" commit — no section
hides itself wholesale on this tier either (grepped `src/views/` for
`isLowPowerDevice()`: zero matches). Full root-cause trace in
[[decisions-log]] ADR-0090; short version here.

- **Root cause:** `--background` (`#01040e`) is the real body colour on
  every tier, but it's never actually seen alone except on Tier 1 — every
  other tier has the Earth globe (`PlanetBackground`) and drifting
  wireframe shapes (`AmbientBackground`) giving the page its depth. Both
  returned bare `null` on `isLowPowerDevice()`, unlike their 9 sibling
  fixed-background scenes (`SolarisBackground` etc.), which already
  render a `SceneFallbackGradient` for exactly this reason. `#01040e`
  with nothing in front of it reads as black.
- **Fixed:** two new tokens, same shape as the existing
  `--raw-gradient-fallback-*` set — `--raw-gradient-fallback-planet` (the
  globe's own brand-blue glow) and `--raw-gradient-fallback-ambient`
  (subtler, matching the existing team-starfield tone).
  `PlanetBackground.tsx`/`AmbientBackground.tsx` now render
  `SceneFallbackGradient` instead of `null` on the low tier (excluded on
  the 9 routes that already have their own scene, same as before).
- **Also fixed:** `--raw-color-glass-fill-tier1` was `rgba(4, 6, 15,
  0.85)` — within 6 RGB units of `--background`, so a "glass panel" was
  never visually distinct from the page even before this bug. Lightened
  to `rgba(10, 24, 48, 0.85)`, matching the new ambient fallback's centre
  tone; still a flat, non-blurred fill, same no-blur Tier 1 design as
  before.
- Nothing e86e26a ("baqala mode") already removed was reintroduced — this
  adds a background behind content, not WebGL/animation/blur.
- `npx eslint`/`npx tsc --noEmit` clean; `.claude/scripts/verify.sh`
  unchanged (no new WARN/FAIL); `next build --webpack` clean; confirmed
  both new tokens and the lightened fill compiled into the real CSS
  output via `grep` on `.next/static/css/*.css`. **Not verified visually
  in a browser this turn** (Chrome extension wasn't connected) — a
  contrast/perception bug like this is exactly the kind a screenshot
  would confirm better than code review; flagged rather than assumed.

## 2026-10-12 (Language switcher and the i18n stack rebuilt from scratch — restores ADR-0024's nav/headings/buttons scope; LibreTranslate's hosted API now needs a key, so MyMemory is the practical default provider)

Bug report: "the language switcher doesn't work on Vercel." Checked the
live codebase first — there was no switcher, no `i18n` folder, no
`/api/translate` route, nothing: ADR-0077 (2026-09-01) deleted the entire
stack outright on prior explicit direction, and the site has been
English-only since. Flagged the contradiction; user confirmed they want
it rebuilt. Full reasoning in [[decisions-log]] ADR-0089; short version
here.

- Restored ADR-0024's original scope (nav links, section headings, button
  labels) — not ADR-0065's later widening to every page's body copy, which
  wasn't asked for and is a materially larger surface.
- `src/app/api/translate/route.ts` (new): tries LibreTranslate only when
  `LIBRETRANSLATE_ENDPOINT`/`LIBRETRANSLATE_API_KEY` (both new in
  `src/env.ts`) are configured, falls back to MyMemory
  (`api.mymemory.translated.net`, free, keyless) otherwise or on failure.
  Confirmed live via `curl` before writing code: libretranslate.com's
  hosted API now demands a key for every request (`{"error":"Visit
  https://portal.libretranslate.com..."}`), `translate.argosopentech.com`
  no longer resolves, `lingva.ml` is behind a Cloudflare bot wall — MyMemory
  was the only reachable free, keyless option.
- New: `src/lib/i18n/languages.ts` (English/Arabic/Urdu/French/Chinese,
  RTL flag), `src/hooks/i18n/use-language-store.ts` (zustand, manual
  `localStorage` load/save — mirrors `cookieStore.ts`'s shape, not
  `zustand/persist`, to avoid an SSR/CSR hydration-mismatch class ADR-0087
  already fixed elsewhere), `src/lib/i18n/translation-queue.ts`
  (batches same-tick requests into one call per language),
  `src/hooks/i18n/use-translated.ts`, `src/components/common/
  TranslatedText.tsx`, `src/components/common/LanguageDirection.tsx`
  (keeps `<html lang>`/`dir` in sync — `rtl` for ar/ur), `src/components/
  common/Nav/LanguageSwitcher.tsx` (desktop dropdown) + a language-button
  row in `MobileMenu.tsx`.
- Wired into: `Nav.tsx`, `MobileMenu.tsx`, `ServicesDropdown.tsx`'s
  "Services" trigger, `Footer.tsx`'s nav links + CTA, `SectionHeading.tsx`,
  `HeroHeading.tsx`/`HeroSubtext`, `GeotechnicalPlexusHeading.tsx`,
  `AboutHeading.tsx`, and every `<Magnetic>`-wrapped primary CTA
  (`HeroSection.tsx`, `GeotechnicalPlexusSection.tsx`, `ServiceCta.tsx`,
  `GeotechnicalAnalysisHero.tsx`). Dynamic/data-driven strings (service
  titles, project descriptions, bios) deliberately left untranslated —
  out of scope.
- RTL is `document.documentElement.dir` only (bidi text, native UI
  mirroring) — does not auto-flip this codebase's physical-direction
  Tailwind utilities (`pl-`, `right-`, etc.) sitewide; that would be a
  separate, much larger pass. See [[i18n]] (new catalog note, restored).
- `npx eslint`/`npx tsc --noEmit` clean; `.claude/scripts/verify.sh`
  net-zero new WARNs (fixed new `min-h-[44px]` instances to the
  token-based `min-h-11`/`min-h-10` instead), same pre-existing
  `@keyframes` FAIL as before this turn; `next build --webpack` clean,
  `/api/translate` listed as a dynamic route. Live-verified server-side
  via `curl` against the production build: real translations through the
  MyMemory fallback, 400 on an invalid `target`, English passthrough.
  **Not verified in a live browser this turn** (Chrome extension wasn't
  connected) — the switcher's click interaction, the `localStorage`
  round-trip across a real page navigation, and the visual `dir="rtl"`
  flip are confirmed by code review only.

## 2026-10-12 (Homepage virtual-scroll request narrowed to WebGL only; `GeotechnicalPlexusScene` gains the same near-viewport mount/unmount gate `ServiceCard`'s dedicated scenes already have)

Request: virtualize the homepage on mobile — only the current section + one
ahead rendered, every section unmounted from the DOM once scrolled past,
project cards windowed to 3 in memory, every Three.js scene outside the
viewport destroyed. Flagged before building: full DOM-level section/card
unmounting conflicts with hard rule #10 (crawlable content — `HomeView` is
a Server Component and must keep every section's real content in the DOM)
and is a materially bigger architecture change than anything tried across
ADR-0078–0087, all of which solved the same "mobile WebGL memory" class of
problem without ever removing DOM content. **User chose the narrower
scope**: WebGL disposal only, no section/card unmounting. See
[[decisions-log]] ADR-0088.

- Audited every homepage WebGL mount site for "destroyed when out of
  view": `ServiceCard.tsx`'s 7 dedicated card scenes already have it
  (ADR-0084/85/87); `GeologicalCrossSection`/`ContactTerrain`/`StatsGlobe`
  share one lightweight GL context by design (render-skip, not dispose,
  while off-screen — not a gap); the homepage hero's own scene is
  deliberately resident all session, by existing design. One real gap
  found: `GeotechnicalPlexusScene` — a dedicated `HeroScene` instance like
  the card scenes, but with no near-viewport gate, so its renderer stayed
  allocated forever once scrolled past.
- Fixed: `GeotechnicalPlexusScene.tsx` now uses the same
  `useDynamicInView` + `getCardSceneRootMargin()` pattern `ServiceCard.tsx`
  uses — mounts within ~800px (400px iOS) of the viewport, fully unmounts
  (disposes via `HeroScene`'s existing cleanup) again once scrolled well
  past, showing `PlexusFallback` in between. `GeotechnicalPlexusSection.tsx`
  itself (a Server Component) is untouched.
- `npx eslint`/`npx tsc --noEmit` clean; `.claude/scripts/verify.sh`
  unchanged from before this turn (same pre-existing FAIL/WARNs); `next
  build --webpack` clean.

## 2026-10-12 (iOS WebGL-memory crash mitigations: `pagehide` disposal on all three persistent singleton renderers, iOS-specific tighter context hysteresis, capability-scaled cloud geometry; a real SSR hydration-risk bug caught along the way)

Client report, marked emergency: real iPhone Safari/Chrome crashing, blamed
on too many simultaneous WebGL contexts. Declined (briefly — same reasoning
confirmed four times now: ADR-0081/83/85/86) the request's `screen.width <
1024` / "all mobile" framing for a blanket "max 1 context" rule and a
"globe-only" homepage mode — would again demote this project's own
reference capable device, a real iPhone 15 Pro Max. Took the crash report
itself seriously and shipped real, platform-targeted mitigations instead:

- **`pagehide` disposal**, all three persistent singleton WebGL renderers
  (`ambient-background-renderer.ts`, `shared-viewport-renderer.ts`,
  `build-planet-scene.ts`'s globe) — previously only `visibilitychange`
  (pauses rendering) was handled; `pagehide` (navigation away, tab close,
  bfcache eviction) now forces a full teardown (geometries, materials,
  textures, the renderer, the canvas element) regardless of the normal
  ref-count. Idempotent and self-healing on a bfcache round-trip (the
  renderer rebuilds from scratch on the next registration). Browser-verified:
  manually dispatching `pagehide` dropped the three singleton canvases from
  the page; no console errors.
- **Tighter concurrent-context hysteresis on iOS specifically** — new
  `getCardSceneRootMargin()` (`device-tier.ts`) returns `400px` on iOS vs
  `800px` elsewhere, shrinking ADR-0085's near-viewport mount/unmount window
  for `ServiceCard.tsx`'s 7 dedicated card scenes exactly where the real
  WebGL memory ceiling this bounds actually lives — a platform
  characteristic of iOS WebKit (Safari and Chrome-for-iOS both, since Apple
  mandates WebKit), independent of capability tier. An "ultra" iPhone 15 Pro
  Max gets the tighter margin too; this is deliberately *not* tier-gated.
- **Earth globe cloud-sphere segments capability-scaled**, not
  width-scaled — `sqrt(particleScale)` applied to the previously-hardcoded
  `64×64` segment count per cloud layer (3 layers), same pattern
  `build-solaris-scene.ts` already uses for its own sphere segments
  (ADR-0080). Floored at 16. The main planet mesh itself is a loaded GLTF,
  not a procedural sphere — its vertex count isn't runtime-adjustable
  without a LOD system, out of scope here.

**Real bug caught while verifying this, unrelated to the request but
found because of ADR-0086's new console logging:** `next yarn build`'s
static-generation step was printing a `[geoporte:performance-tier]
resolved="ultra"` line — on the *build machine*, which is not a real
device and has nothing to do with any visitor. Root cause:
`isReducedMotion()` (`shared-viewport-renderer.ts`) called
`isLowPowerDevice()` unconditionally, with no `typeof window` guard — added
in ADR-0081, never guarded, because at the time nothing had deep-dived its
actual call sites. Several components (`ScrollCue`, `ProjectTicker`,
`CustomCursor`) read `isReducedMotion()` directly in their render body (no
effect wrapper), so this executed server-side during SSR/SSG — and because
Node.js 21+ exposes a built-in `navigator` global,
`detectPerformanceTier()`'s `hardwareConcurrency` read didn't no-op there
the way the rest of this module's `localStorage` access already does.
Harmless on its own (a build machine's CPU count isn't used for anything),
but a genuine **hydration-mismatch risk**: if a server environment's signals
ever resolved a different tier than the client's own post-hydration read,
`isReducedMotion()` would disagree between the server-rendered HTML and the
client's first render — exactly the class of bug `device-tier.ts`'s own
`width > 0` guards exist to prevent elsewhere. Fixed: both the OS
`matchMedia` check and the `isLowPowerDevice()` check are now gated behind
one `typeof window !== "undefined"`, so the function can never resolve
anything but `false` outside a real browser. Browser- and build-verified:
the stray build-log line is gone.

## 2026-10-12 (Performance-tier storage key versioned — a one-time reset for every stale pre-fix value sitewide; tier diagnostics logged to console)

Fourth report of the same shape: a real iPhone 15 Pro Max assigned Tier 1,
plus "the page isn't loading fully" — this time flagged CRITICAL, with a
request to deploy to Vercel and test on a real device. Re-verified
`detectPerformanceTier` once more (unchanged since ADR-0080): a real 15 Pro
Max still resolves to `"ultra"` via the iOS screen-signature table — more
than the request's own "Tier 3 minimum." The algorithm was never the
problem, three separate times running now (ADR-0081, ADR-0083, ADR-0085
all independently confirmed this same thing). What's never actually been
fixed, despite being named as the likely cause every single time: a tier
persisted to `localStorage` before today's fixes existed, which — by this
project's own explicit "never silently self-heal" design (ADR-0058/0067) —
can only ever get *worse*, never correct itself, no matter how right the
current detection logic is.

**Fixed, finally, rather than diagnosed a fourth time.** Versioned the
storage key (`geoporte:performance-tier` → `geoporte:performance-tier:v2`)
— a one-time cache invalidation, not a reversal of the no-self-heal policy.
Every pre-existing stored value sitewide is orphaned by the key change;
every visitor (including whatever earlier-session value is sitting on the
reporter's own physical iPhone) re-detects exactly once, fresh, against
today's correct algorithm. Future downgrades persisted under the new key
still never self-heal — identical policy, just not permanently punishing
devices for a bug that's since been fixed.

**Added:** a one-line `console.warn` (survives `next.config.ts`'s
`removeConsole`, which strips everything except `error`/`warn` from the
production bundle — a plain `console.log` here would have silently
vanished from the exact build a real phone tests) logging the resolved
tier, its source (stored vs. fresh), and the raw signals it came from
(cores, memory availability, screen signature, isMobile) — plus the exact
`localStorage.removeItem(...)` call to force a fresh read by hand. Fires
once per page load regardless of how many scene mount sites call
`getOrDetectTier`. Browser-verified: a stale `"low"` set under the old key
was correctly ignored; the new key freshly detected and logged
`resolved="ultra" (fresh) — cores=24 memory=32 screen=1536x960@1.25dpr`.

**Declined, with reasoning stated plainly rather than silently reused: the
request's literal iOS threshold numbers** (`width >= 390` → Tier 2,
`width >= 430` → Tier 3) — the *existing* table already resolves a real
15 Pro Max (430×932×3) to Tier 4/ultra, strictly exceeding what was asked
for, so rewriting the thresholds downward would be a regression dressed up
as the fix the report wanted.

**"Page not loading fully" / "remove all lazy loading" — investigated, not
blindly implemented.** No confirmed bug found in this codebase's actual
lazy-loading surfaces (images already route through `next/image`'s
default; `<Inview>`/`<SceneViewport>` gate motion and WebGL mounting, not
raw content visibility for most sections — confirmed by direct code
reading, not assumption). One **real, structural fragility** was found
while reading `<Inview>` (protected engine file,
`src/components/animation/springs/in-view.tsx`): its `active` state (and
therefore whether `to` is ever applied, vs. staying at `from` — e.g.
`opacity: 0`) depends entirely on its internal `useDynamicInView`'s
`IntersectionObserver` firing at least once, with no fallback. This isn't
special to Tier 1 or `skipAnimation` — forcing `Globals.skipAnimation`
(ADR-0081) changes how fast a transition completes once `active` flips
true; it does not change whether `active` ever flips at all, so a device
whose observer never fires (for *any* reason) would see that `Inview`
section stuck invisible indefinitely, regardless of tier. Not fixed this
turn: it's a protected-engine file requiring explicit sign-off before any
edit (`.claude/rules/engine-protected.md`), and no confirmed failure case
exists yet to justify touching it — flagged to the user as a real,
separate, unconfirmed risk rather than bundled into this fix on
speculation. See the matching ADR for the explicit question asked.

**Honesty check on scope:** this agent has no access to a real iPhone and
cannot personally open the live Vercel URL from one — the one verification
step in this request only the user can actually perform. Said so directly
rather than fabricating a device test.

## 2026-10-12 (Dedicated card WebGL contexts now unmount again once scrolled well past, not just deferred on arrival — bounds the concurrent ceiling for every device; a width-based "mobile" degradation request declined for the third time, same iPhone 15 Pro Max reasoning)

Client request: "Mobile Safari has limited WebGL memory," with a 7-point
fix list gated entirely on `screen.width < 1024` / "on mobile" — max 2
WebGL contexts, −50% particles, DPR capped at 1, ambient shapes off, ticker
off, globe at half resolution, all mini-scenes paused, all **regardless of
device capability**. The premise (mobile Safari has real, documented WebGL
memory/context constraints independent of chip speed) is legitimate; the
prescribed fix (gate on viewport width) is the same pattern declined in
ADR-0081 and ADR-0083 — it would catch this request's own named device, a
real iPhone 15 Pro Max, exactly like the previous two. Declined the width
gate again, same reasoning, briefly (not re-litigated at length — the user
has now confirmed the capability-based approach twice). Checked each of the
7 points against what already exists:

- DPR cap, particle counts, ambient-shape gating, ticker pause-on-
  reduced-motion: all already capability-driven (`isLowPowerDevice()`/
  `isReducedMotion()`/`getTierBudget`), not width-driven. Width-gating them
  instead would be a regression for any capable phone, not an improvement.
- "Pause all mini-scenes, max 2 contexts": partially already true
  (ADR-0084's near-viewport deferral) — but re-reading that fix surfaced a
  real, capability-*agnostic* gap worth closing: it only delayed reaching
  the pre-fix context ceiling, it didn't lower it. A one-way "warm once,
  keep forever" latch meant total concurrent contexts still climbed back
  toward 12 by the time a user had scrolled past all 7
  `DEDICATED_CARD_SCENES` cards.

**Fixed:** `ServiceCard.tsx`'s dedicated-scene gate is no longer a one-way
latch — it now tracks the live `IntersectionObserver` state with a
symmetric 800px `rootMargin` (expands the intersection root on every side),
so a card's WebGL context unmounts again once scrolled ~800px past, not
just deferred on arrival. This bounds the concurrent context ceiling to
roughly "however many cards fit in a ~1600px scroll band" for every device
— capable phone or desktop alike — rather than every card the user has ever
scrolled past. This is judged the actually-correct, capability-agnostic
answer to "Mobile Safari has limited WebGL memory": every platform
benefits from a bounded context count, and a device doesn't need to be
narrow to benefit from it.

**Also fixed in the same pass (found while verifying the above, not
requested):** the first version of this unmount/remount gate used an inline
arrow function as `<Hover>`'s callback ref. React detaches (`null`) and
reattaches a callback ref whenever its *identity* changes between renders,
not just on mount/unmount — an unmemoized closure gets a new identity every
render, and the `IntersectionObserver` hook's own state setter triggers a
render, so this churned in a detach/reattach loop that never let the
observer hold a subscription long enough to report back. Wrapped in
`useCallback`, keyed on the setter (itself referentially stable). Real,
independently-worth-fixing bug regardless of cause.

**Browser-verified end to end**, and importantly, this **also resolved the
"genuine renderer hang" flagged as unexplained in the entry below.**
Testing live, the fix initially looked completely broken — zero dedicated
card canvases ever appeared, even scrolled directly into the services
section. Root cause turned out to be the test tab itself: `document.hidden`
was `true`, `document.hasFocus()` `false`, 0 `requestAnimationFrame` ticks
in a full second — a backgrounded tab, which Chrome throttles
`IntersectionObserver` callbacks on right along with rAF. Forcing a
`Page.captureScreenshot` (which forces a compositor tick) immediately
unblocked it: 12 canvases at the services section, 5 again after scrolling
back to the top — exactly as designed, both directions confirmed. This
strongly suggests the "unresponsive to `Runtime.evaluate`, repeatedly,
45s timeouts" finding in the entry below was the **same** backgrounded-tab
throttling, not a real site bug — severe JS scheduling delay for a
deprioritized background tab, not an infinite loop. Downgrading that
finding from "flag for DevTools reproduction" to "likely a test-harness
artifact, not real" — noted here since the entry below still reads as an
open concern and shouldn't be acted on as one.

## 2026-10-12 (Globe render loop now pauses on a hidden tab and reports its own FPS; dedicated card WebGL contexts deferred to near-viewport — 12→5 canvases on initial homepage load)

Two bundled reports: (1) "Tier 1 content below the fold not loading" and
(2) "iPhone 15 Pro Max lagging, should be Tier 4" with a checklist about
WebGL context counts, 4K rendering, background-tab rAF loops, memory leaks,
particle counts, and an FPS monitor. Report (2) is a 3D-performance request
on a project with WebGL, so the `optimize-3d-scene` skill was loaded first
per the hard rule, then mapped onto what's actually confirmable in this
codebase (§0 audit) rather than applying its checklist blind.

**Confirmed and fixed:**
- `build-planet-scene.ts`'s render loop had no `visibilitychange` gate at
  all — grepped every scene file; it was the one exception (`ambient-
  background-renderer.ts`, `shared-viewport-renderer.ts`, and `HeroScene.tsx`
  all already pause on a hidden tab). The heaviest scene on the page (three
  `EffectComposer`s, a GLTF, custom shaders) kept rendering every frame in a
  background tab. Added the same `pageVisible` gate the other two already
  use — keep rescheduling the rAF so it resumes instantly on return, skip
  the render work while hidden.
- Same file never called `reportHeroSceneFrame` — only `HeroScene.tsx` fed
  the sitewide low-FPS watchdog (`performance-monitor.ts`), so a
  globe-specific slowdown never contributed to the automatic tier downgrade.
  Now wired in.
- `ServiceCard.tsx`: the 7 `DEDICATED_CARD_SCENES` cards (their own
  `WebGLRenderer` + `EffectComposer` each, needed for bloom) were mounting
  the instant `ServicesSection` rendered — on initial page load, regardless
  of scroll position, since nothing deferred them. Measured: **12 canvases
  on initial homepage load, down to 5** after gating each dedicated card
  scene behind `useDynamicInView({ rootMargin: "800px 0px" })` — mounts once
  the card is within ~1 viewport of coming on screen, stays mounted after
  (no thrashing create/dispose on scroll in/out; `HeroScene`'s own
  `IntersectionObserver` already pauses the render *loop* for an off-screen
  card, which is the cheap part to toggle repeatedly). 12 simultaneous
  WebGL contexts is close to or past what real browsers budget — mobile
  Safari especially — and a dropped context reads as jank or "the scene
  never showed up," not a GPU-power problem. This is the most likely
  explanation for lag on genuinely high-end hardware (a flagship phone has
  plenty of GPU power; it doesn't have an unlimited WebGL context budget).

**Investigated, not changed (no bug found):**
- DPR cap: already `min(devicePixelRatio, dprClamp)` with a real tier-aware
  clamp (max 2) — not "full 4K," and a hardcoded 1080p cap would fight the
  existing, more nuanced per-tier system for no measured benefit.
- Particle count: already tier- and capability-scaled
  (`TIER_COUNTS`/`particleScale`, see ADR-0080/81). Halving it further
  sitewide (including desktop) wasn't grounded in any measurement — "cut
  fill, not detail, and don't tune by feel on a desktop" per the skill.
- Scene disposal on navigation: `HeroScene.tsx` already disposes fully on
  unmount (geometries, materials, composers, listeners, canvas removal);
  the globe/ambient/shared-viewport are *deliberately* persistent
  app-lifetime singletons that never tear down on route change (by design,
  not a leak — see their own file-header comments).
- FPS-triggered auto-downgrade: already exists
  (`performance-monitor.ts`/`PerformanceWarningToast`, ADR-0058/0067) —
  20fps/3s threshold, not 30fps/3s as asked, but the existing number was
  itself a deliberate, already-reasoned choice from that ADR; not
  re-tuned without a measured reason to.
- "Below the fold not loading on Tier 1": browser-verified directly —
  `ServicesSection` and all 28 `ProjectsSection` cards render with real
  content on a forced-`"low"`-tier build (screenshots taken scrolling
  through both). Did not find a code path that leaves a section blank on
  Tier 1. **Did** reproduce the renderer becoming genuinely unresponsive to
  `Runtime.evaluate` (not just slow — CDP commands timed out at 45s,
  repeatedly, near the end of a long simulated-scroll session) while
  investigating this, but couldn't isolate a specific cause via static
  code review in the time available, and hit this project's own "stop
  after 2-3 failed browser-tool attempts" guidance before fully
  bisecting it live. Flagged rather than silently dropped: worth
  re-testing directly with Chrome DevTools' CPU throttle (as originally
  suggested) rather than through browser-automation tooling, which may
  have its own overhead on a long, image-heavy page.

Client request: make Tier 1 ("low" capability) the most stripped-down
version possible. Flagged one piece before implementing: the request's own
Tier 1 trigger (`hardwareConcurrency <= 4 OR screen.width <= 414 OR old
iPad`) would catch nearly every modern flagship phone in portrait (iPhone
14/15/16 are all 390–430px), not just old/weak devices — exactly the rule
this project removed across ADR-0078/79/80/81/82. The existing
capability-based detection already correctly lands a real iPhone 6 or a
2013 iPad at "low" (2 cores on both triggers the `cores <= 4` branch
already) without catching current flagships. **User chose to keep the
capability-based trigger** — only the Tier 1 *behaviour* changed, not its
*eligibility* rule. See ADR-0083.

What's new on Tier 1 (most of the list was already true from the
2026-10-11 pass — see below — this closes the remaining gaps):
- **Zero CSS transitions/animations, sitewide**, including the ADR-0014
  `transition-*` exception (hover/focus colour, small nudges) — that
  exception is suspended on this tier specifically. `globals.css`:
  `[data-perf-tier="low"] * { transition: none !important; animation: none
  !important; }`. Static `transform` values used for layout (centering,
  positioning) are untouched — only timing is killed, so a hover state
  still snaps instantly instead of breaking non-animated positioning.
- **Images compressed to Tier 1's own quality budget.** New
  `TierImage.tsx` (`src/components/common/`) — a `"use client"` leaf
  wrapping `next/image`, halving `quality` to 40 (from Next's 75 default)
  on the low tier. Swapped in via a straight `import { TierImage as Image }
  from "@/components/common/TierImage"` across every content-photo call
  site (`publications.tsx`, `ServiceOverview.tsx`, `ProjectsShowreel.tsx`,
  `ProjectsCascade.tsx`, `ProjectCard.tsx`, `ProjectModal.tsx`,
  `ProjectExperienceSection.tsx`, `TeamMemberCard.tsx`, `TeamCascade.tsx`)
  — several of those are Server Components, so this is the "split a leaf
  client wrapper" shape (`component-conventions.md`), not a reason to
  convert those views to `"use client"`. `GeoporteLogo.tsx` deliberately
  excluded — a small brand mark, not worth the visible quality loss for
  negligible bandwidth savings. `next.config.ts`'s `images.qualities` had
  to gain `40` explicitly — Next 16 only serves quality values it's been
  told to allow (default: `[75]` only; an unlisted value throws).

Already true before this turn, confirmed rather than re-implemented: zero
WebGL (`isLowPowerDevice()` gates every scene mount, including `HeroScene`'s
`skipWebgl`), zero backdrop-filter (yesterday's `[data-perf-tier="low"]`
rule, exactly the requested flat `rgba(4, 6, 15, 0.85)`), zero video
autoplay (`VideoBackground` poster-only `<img>`), zero ambient background
shapes (`AmbientBackground` doesn't mount), zero custom cursor effects
(`CustomCursor`'s `active` reads the same `isReducedMotion()`), and the
project ticker/marquee and scroll-progress bar both already freeze to a
static, non-animating state on this tier (react-spring's global
`skipAnimation`, forced by `reduced-motion.tsx`) rather than being removed
from the DOM outright — left that way since a frozen marquee is itself
"static text," which item 10 of the brief explicitly allows.

## 2026-10-12 (Earth globe blur — the *actual* root cause: a skipped initial `renderer.setSize()`, not capability tier)

Yesterday's dprClamp fix (below) was real but didn't explain a report of the
same blur on an RTX 5080 desktop — a machine that already resolved to the
`"ultra"` tier before that fix even landed. Re-investigated from scratch on
the live Vercel deployment via the browser: `getComputedStyle` on every
canvas showed `filter: none`, `opacity: 1` everywhere (no CSS blur, confirmed
answering the "search for filter/blur/opacity" ask directly); the three
full-page fixed canvases (globe `z:-1`, ambient shapes `z:0`, shared mini-
viewport `z:1`) are a deliberate, documented layering, not a stacking bug.
But reading each canvas's actual drawing-buffer size against its CSS size
found it: the globe canvas was rendering at **375×187** internal resolution
while CSS-stretched to fill the full ~1536×770 viewport — a 4x+ upscale,
regardless of device, tier, or GPU. `build-planet-scene.ts`'s
`handleResizeFactory` closure captures `lastResizeWidth` from
`window.innerWidth` at creation time; the deliberate one-off `resizeAll()`
call right after setup compared the (unchanged) width against itself and
skipped, so `renderer.setSize()` was never called with real dimensions —
the renderer and all three `EffectComposer`s stayed at the bare-`<canvas>`
default (300×150 × devicePixelRatio) for the scene's entire lifetime. Every
other scene builder in `src/components/scene/` and `src/lib/scene/` already
calls `renderer.setSize()` unconditionally at setup (confirmed by grep) —
this file was the one exception. Fixed with an explicit initial
`renderer.setSize(window.innerWidth, window.innerHeight, false)` right after
`setPixelRatio`, before the composers are constructed (they read the
renderer's size at construction time for their own render targets).
Browser-verified before/after on the same page: globe canvas buffer went
from 375×187 (CSS 1536×770) to 1920×960 (CSS 1536×768, matching the other
two canvases) — visibly sharp texture detail on the sphere afterward versus
soft/blurred before. `renderer.antialias`/`setPixelRatio(min(dpr, clamp))`
were already correct (confirmed, not the bug). No `scene.fog` exists on the
homepage ambient wireframe shapes (`AmbientBackground`/
`ambient-background-renderer.ts`) — the only homepage-visible `fog` is the
Hero section's own `FogExp2` in `build-hero-scene.ts`, a deliberate
depth-cue on a sparse wireframe scene, left alone (not the reported globe,
and removing it wasn't shown to fix anything measurable). The
`mix-blend-screen`/`mix-blend-multiply` + `filter: grayscale/contrast`
usages found in `HeroHeading.tsx`/`ServiceOverview.tsx` are 2D DOM decoration
(a text shimmer sweep, a tinted photo band) — color/blend operations, not
blur, and not on any canvas — left alone.

## 2026-10-11 (Tier 1 fully static; desktop capability-tier dprClamp bug fixed — root cause of the "blurry globe" report)

**Desktop blur/haze report, root-caused.** The Earth globe and ambient
background shapes looked soft/hazy on desktop — not from any CSS `filter`/
`backdrop-filter` on the canvas or hero/about wrappers (none exist; confirmed
by grep), and not from `THREE.Fog` (the homepage ambient shapes have none).
Root cause: `performance-tier.ts#detectPerformanceTier`'s desktop branch
required `deviceMemory >= 8`/`>= 16` for "high"/"ultra" — but `deviceMemory`
is Chromium-only, so on desktop Safari/Firefox the signal is always
unreadable, defaulted to `4`, and silently failed that check. Any non-Chromium
desktop with 8–15 cores landed at "medium" (`dprClamp: 1`) regardless of real
hardware, rendering every WebGL canvas at half `devicePixelRatio` then
CSS-upscaled — exactly what reads as blur. Fixed: when `deviceMemory` is
unreadable, desktop now falls back to a cores-only read (`cores >= 8` → high)
instead of letting the unreadable signal silently fail an AND check — same
fix shape ADR-0078/79/80 already used for iOS's missing `deviceMemory`,
applied to the desktop half of the same bug class. Chromium desktop (which
does expose `deviceMemory`) is bit-for-bit unchanged.

**Tier 1 (low capability) now disables every animation and heavy-CSS surface
sitewide, not just WebGL** (`webglDisabled` already covered that half) —
client report that the site "still lags on Tier 1 even with WebGL disabled."
- `shared-viewport-renderer.ts#isReducedMotion()` now also returns `true` on
  the low tier — every existing caller (ambient/globe mount gates, the
  cursor trail, the scroll cue, the page-load intro) picks this up with zero
  additional wiring.
- `reduced-motion.tsx` now also forces react-spring's global `skipAnimation`
  on the low tier (covers `Inview`/`SpringTrigger`/`Hover`/`Handle`/
  `TextEngine`, the route-transition sweep, and every one-off `useSpring`
  call), and toggles `data-perf-tier="low"` on `<html>`.
- `globals.css`: `[data-perf-tier="low"]` flattens `.glass-panel` and every
  `backdrop-blur-*` surface sitewide to a solid `rgba(4, 6, 15, 0.85)` fill,
  no blur — `backdrop-filter` is GPU cost independent of WebGL.
- `scroll-layout.tsx`: Lenis is no longer constructed at all on the low
  tier — native scroll instead. Lenis's own per-frame easing math was the one
  animation loop still running after WebGL/springs were already gated off.
- `VideoBackground.tsx`: low tier renders the poster frame only (a plain
  `<img>`, not a `<video>` element at all) — no autoplay, no video bytes
  fetched or decoded. This fully supersedes the previous mobile-width-and-
  low-tier-specific 480p video re-encode mechanism (now dead code, removed,
  along with the `mobileMp4Src480`/`mobileWebmSrc480` props and their three
  call sites) — low tier never reaches the `<video>` tag at all now,
  regardless of width.
- Images were already covered by `next/image`'s default lazy-loading (every
  image in `src/` already goes through it — confirmed, zero raw `<img>`
  tags before this turn); the handful of `priority` images are deliberately
  eager (above-the-fold hero/first-visible images, for LCP) and were left
  alone — forcing those lazy too would regress Core Web Vitals for no real
  gain once Tier 1 has no animation competing for the main thread anyway.

**iPhone 15 Pro Max "still Tier 1" report — investigated, not a detection
bug.** Walked `detectPerformanceTier`/the iOS screen-signature table
(ADR-0080, same day): a fresh detection on a real 15 Pro Max already resolves
to `"ultra"` via `IOS_ULTRA_TIER_SCREEN_SIGNATURES` (430×932×3). Per
ADR-0058/ADR-0067, a downgraded tier is persisted to `localStorage` and
**deliberately never self-heals** — so a device that visited the site before
today's ADR-0078/79/80 fixes landed and got `"low"` persisted will stay
`"low"` forever until that storage key is cleared, by design, regardless of
how correct today's fresh-detection logic is. Not changed: the detection
thresholds themselves (the literal alternate numbers floated in this request
would have regressed ADR-0080's already-reconciled, same-day iOS table for a
symptom that isn't actually in the algorithm). Workaround for verifying on an
affected device: clear `localStorage.getItem('geoporte:performance-tier')`.

## 2026-10-11 (Mobile optimization pass — new tier thresholds, particleScale/bloomScale actually wired into 14 scene builders, iOS resize-flicker guard, 44px tap-target fixes, 480p video tier)

Urgent pre-meeting request: rework the 4-tier performance system to an
explicit new spec (named `hardwareConcurrency`/`deviceMemory`/`screen.width`
cutoffs and example devices per tier), make sure the per-tier budgets
(particle counts, bloom, DPR, cursor, parallax) actually take effect, audit
the mobile layout end-to-end, and deploy. Full reasoning — including why the
spec's literal numbers are unreachable on Safari and how that was reconciled,
and the complete list of touched scene builders — is in
[[decisions-log]] ADR-0080; this entry is the short version.

- **`performance-tier.ts`** — new LOW/MEDIUM/HIGH/ULTRA cutoffs matching the
  spec; Android uses the literal numbers, iOS/iPad use a revised
  screen-signature/cores proxy (Safari can't clear the literal `cores>=12`
  ULTRA bar at all). `PERFORMANCE_TIER_BUDGETS`' `particleScale`/`bloomScale`
  retuned to the spec's stated percentages (HIGH -30%/reduced-bloom, MEDIUM
  -70%/bloom-off).
- **`device-tier.ts`** — `getTierBudget` now also merges `particleScale`/
  `bloomScale`/a scaled `ambientShapeCount` in, so every existing consumer
  picks them up for free.
- **14 scene builders** now actually read `particleScale`/`bloomScale` (were
  declared since ADR-0058 but never consumed anywhere, confirmed via grep) —
  see ADR-0080 for the full per-file list.
- **iOS URL-bar resize-flicker guard** on every full-page WebGL resize path
  (`ambient-background-renderer.ts`, `shared-viewport-renderer.ts`,
  `build-planet-scene.ts`, `HeroScene.tsx`) — skips the resize unless the
  width actually changed, per optimize-3d-scene skill §13.
- **5 tap targets** bumped from ~20-32px to 44px (`h-11 w-11`):
  `ProjectModal`/`CookiePreferencesModal` close buttons,
  `PerformanceWarningToast` dismiss, `GeotechnicalFeaScene`'s stage stepper
  (×2). Nav/grid/footer/stats audit found nothing else to fix.
- **480p video tier**: new `ffmpeg`-encoded 854×480 mp4+webm pairs for the
  three background videos (bird/siloutte/purple-planet), picked in JS by
  `VideoBackground.tsx` specifically on the LOW capability tier — the
  existing 720p pair is a pure width-media-query swap and can't express a
  capability-only split.
- `next build`/`npx eslint src` clean; `.claude/scripts/verify.sh` unchanged
  from before this turn (same pre-existing FAIL/WARNs, nothing new).
  **Could not get reliable mobile-width device emulation** from the browser
  tooling available this session — see ADR-0080's verification section for
  what layout correctness rests on instead.

## 2026-10-10 (Fixed: stats counters stuck at "0+" on mobile, hero heading unclipped during entrance, canonical URL pointing at localhost on Vercel)

Bug report against the deployed site (`https://geoporte-testing.vercel.app`):
the homepage/service-page stat counters never counted up on mobile, the hero
heading looked doubled, and `<link rel="canonical">` resolved to
`http://localhost:3000`.

- **Stats counters** (`StatCounter.tsx`, `ExperienceStatBox.tsx`): both drove
  the count-up spring straight off the live `inView` boolean from
  `useDynamicInView` (`number: inView ? value : 0`) with `threshold: 0.4`. A
  fast or bouncy mobile scroll can drop below that threshold again before or
  during the spring, snapping the number back to 0 — there was no "already
  played" latch, unlike every `mode="once"` animation elsewhere in the
  codebase. Added a one-way `hasAnimated` state (`useEffect` sets it true the
  first time `inView` is true, spring target reads off that instead) and
  lowered the threshold to `0.15` so it fires more reliably when the stat grid
  is taller than a short mobile viewport.
- **Canonical URL** (`src/lib/site.ts`): `siteConfig.url` falls back to
  `http://localhost:3000` when `NEXT_PUBLIC_SITE_URL` is unset — confirmed via
  the live deployed HTML that the env var isn't set on Vercel for this
  project. Changed the fallback to `https://geoporte-testing.vercel.app`.
  `NEXT_PUBLIC_SITE_URL` should still be set in the Vercel project's env vars
  per [[environment-variables]] — the fallback is a safety net, not a
  replacement for that.
- **Hero heading** (`HeroHeading.tsx`): added the `overflow` prop to its
  `TextEngine`. It was the only `TextEngine` heading in the codebase *not*
  setting `overflow` (`SectionHeading.tsx` and `GeotechnicalPlexusHeading.tsx`
  both do), so its word-slide entrance wasn't clipped to the line-height box
  during animation, unlike every other heading. Reported as "doubled" text on
  mobile; the vendored `spring-text-engine` visually-hidden SEO copy was
  independently confirmed correctly hidden (inline `position:absolute` +
  `clip:rect(0,0,0,0)`, unaffected by any stylesheet) on the live site via raw
  HTML inspection, so this brings the heading in line with the rest of the
  codebase's convention rather than fixing a confirmed root cause — no live
  browser was available this session to reproduce the glitch directly. Flagged
  to the user as a best-guess fix pending a screenshot if it recurs.
- `yarn lint` (via `npx eslint` on the changed files) clean; `next build`
  (Turbopack) clean; confirmed in the compiled output that the canonical tag
  and the hero heading's `overflow` styling both changed as expected.

## 2026-10-09 (Fixed: clicking a project card on `/projects` did nothing)

Bug report: project cards on the standalone `/projects` page didn't open the
detail modal on click, even though the identical-looking modal works from the
homepage.

- Root cause: `/projects` renders two sections — `ProjectsShowreel` (the
  scroll-driven flight intro) and `ProjectsCascade` (the scroll-driven 3D
  card deck beneath it, per ADR-0075). `ProjectsShowreel`'s tiles already
  called `useProjectModalStore((s) => s.open)` on click. `ProjectsCascade`'s
  cards never did — in both its animated 3D deck and its
  `prefers-reduced-motion` static-grid fallback, the card markup had no
  `onClick`/`onKeyDown`/`role="button"` at all, so most of the page's cards
  were inert.
- Fix: wired `ProjectsCascade.tsx`'s cards (both variants) to the same shared
  `useProjectModalStore` singleton `ProjectsShowreel.tsx` already uses — no
  new modal, no new store, just the missing click/keyboard handlers, mirroring
  the existing pattern exactly (`role="button"`, `tabIndex`, `aria-label`,
  Enter/Space handling, focus-visible ring).
- `yarn lint` clean; `next build --webpack` clean (Turbopack itself can't run
  in this sandbox — native SWC bindings are blocked by an Application Control
  policy — so the build was run with the documented webpack fallback).
  Verified live via `next dev --webpack`: clicking a Cascade card opens the
  modal with image/category/name/location/discipline/description, and the
  X button closes it.

## 2026-09-02 (Flagship phones now get the full desktop WebGL budget — DPR 2, full particle counts, bloom, uncapped frame rate)

Follow-up to 2026-09-01's fix below: capable phones were no longer *gated
off* WebGL, but every mobile-width device — flagship or not — was still
capped at the reduced mobile budget (DPR 1.5, cut particle counts, 30fps).
Explicit request: iPhone 14 Pro and above (by name) and Android with 8+
cores/8GB+ RAM should get the literal desktop budget, no simplification. Per
[[decisions-log]] ADR-0079 (extends ADR-0078).

- The literal ask ("detect iPhone model from `navigator.userAgent`") isn't
  implementable — Safari never puts the model in the UA string, never
  implements `deviceMemory`, and reports a flat 6-core `hardwareConcurrency`
  on every iPhone since 2019. Flagged to the user; they chose a screen-
  resolution × `devicePixelRatio` lookup table as the proxy, accepting it
  needs manual upkeep as new iPhones ship.
- `performance-tier.ts`: new `isFlagshipMobileDevice()` — iOS path matches
  UA `"iPhone"` + a `[shortSide, longSide, dpr]` signature against a table
  covering 14 Pro/14 Pro Max/15/15 Plus/15 Pro/15 Pro Max/16/16 Plus/16
  Pro/16 Pro Max (14 and 14 Plus non-Pro deliberately excluded — different,
  older screen signature); Android path is the literal `cores >= 8 &&
  memory >= 8` (both real, reliable signals on Chrome). A flagship resolves
  straight to the existing `"ultra"` tier in `detectPerformanceTier`,
  bypassing the mobile ceiling ADR-0078 capped at `"high"`.
- `device-tier.ts#getDeviceTier`: one new line — `"ultra"` capability now
  forces `"desktop"` tier regardless of viewport width, mirroring the
  existing "`"low"` capability forces `"mobile"` regardless of width" rule.
  This single override is the whole mechanism: every consumer already keyed
  off `getDeviceTier`/`getTierBudget` (DPR clamp, ambient shape count, hero
  frame cap, the Earth globe's star/atmo/marker counts, every scene
  builder's own `=== "desktop"` density check) picks up the full desktop
  budget for a flagship phone automatically, no other files touched.
- Verified against synthetic device profiles (not live-device, per the
  09-01 entry's same caveat): iPhone 14 Pro/15/15 Pro Max/16 Pro Max →
  `ultra`/desktop budget; iPhone 13 and plain 14 → unchanged `medium`/mobile
  budget; Android at exactly 8 cores/8GB → `ultra`; Android at 8 cores/6GB →
  stays `high`, not promoted; budget Android → still `low`/gated; desktop
  profile → unaffected.
- `yarn lint` / `yarn build` clean.
- Desktop behaviour untouched — the new override only fires for
  `isMobile`-branch detection; desktop's own tier logic wasn't touched.

## 2026-09-01 (3D scenes were not rendering on mobile — width-based WebGL skip replaced with a capability-only gate)

Bug report: on a real iPhone 15 Pro Max, every WebGL scene sitewide was
missing — Earth globe, homepage hero wireframe, Geotechnical FEA scene, every
service-page hero, ambient background, all `SceneViewport` mini-scenes. Per
[[decisions-log]] ADR-0078 (amends ADR-0056, ADR-0058, ADR-0060, ADR-0031).

- Root cause: `getDeviceTier` treated any viewport `< 768px` as `"mobile"`
  tier, and `detectPerformanceTier` separately floored any mobile-UA device
  under that width to the "low" capability tier regardless of real
  cores/memory (Safari never exposes `deviceMemory`) — so every phone,
  including flagships, was gated the same as end-of-life hardware.
- Fix: `isLowPowerDevice()` (capability only — `hardwareConcurrency`,
  `deviceMemory`, mobile UA, session-persisted downgrade; independent of
  viewport width) is now the sole "skip WebGL, show CSS fallback" signal,
  called directly by `HeroScene`, `GeotechnicalFeaScene`, `PlanetBackground`,
  `AmbientBackground`, `SceneViewport`. `getDeviceTier`'s width-based
  `"mobile"` tier is now budget-only (DPR clamp, particle/shape counts, hero
  frame cap) — never a mount/skip condition.
- A real capability floor stays: < 6 cores or < 4GB RAM on a mobile UA (< 4
  cores/4GB on desktop) still resolves to "low" and still gets the CSS
  fallback, so genuinely weak/old Android hardware doesn't crash or
  thermal-throttle.
- Kept/tuned performance optimizations: `TIER_BUDGETS.mobile.dprClamp` 1 →
  1.5; ambient background and the Earth globe now mount at mobile width with
  reduced counts (`ambientShapeCount` 0 → 6; new `TIER_COUNTS.mobile` in
  `build-planet-scene.ts`, 350/80/15 stars/atmo/markers) instead of being
  fully disabled; the mobile-width 30fps hero frame cap is unchanged.
- `SceneViewport`'s unused `mobileBreakpoint` prop (no caller ever set it)
  removed.
- `yarn lint` / `yarn build` clean. Verified the tier logic against synthetic
  device profiles (iPhone 15 Pro Max, mid/low Android, iPad, a desktop
  resized narrow) — capable devices now mount WebGL at phone widths, a
  genuinely low-spec Android profile still falls back. Live on-device/browser
  verification was not possible this session (Chrome extension not
  connected) — re-check on the actual iPhone before calling this closed.
- Desktop behaviour untouched: desktop-width tiering, DPR clamp, particle
  counts and frame budgets are unchanged.

## 2026-09-01 (Language switcher and the whole i18n stack removed — site is English-only)

Explicit user direction: remove the nav language switcher and every i18n
mechanism, site-wide. Per [[decisions-log]] ADR-0077.

- Deleted outright: `LanguageSwitcher.tsx`, `LanguageDirection.tsx`,
  `TranslatedText.tsx`, `hooks/i18n/` (`use-translated.ts`,
  `use-language-store.ts`), `lib/i18n/` (`translation-queue.ts`,
  `languages.ts`), `app/api/translate/route.ts`.
- `Nav.tsx`/`MobileMenu.tsx` no longer render `<LanguageSwitcher>`;
  `layout.tsx` no longer mounts `<LanguageDirection>`.
- Every `<TranslatedText text={…} />`/`<TranslatedText text="…" />` call
  (~30 files across `views/` and `components/common/`) replaced with the
  plain source string; `SectionHeading`, `HeroHeading`, `AboutHeading`,
  `TeamPanel`'s typed role line dropped their `useTranslated()` calls the
  same way.
- `LIBRETRANSLATE_ENDPOINT` removed from `src/env.ts`'s server schema and
  `.env.example`.
- `zustand` itself is untouched — still used by the scroll store, cookie
  consent, and the project-modal store, none of which were part of i18n.
- `yarn lint` / `yarn build` clean; verified live on `/`, `/about`,
  `/about/team`, `/contact`, `/projects`, `/publications` — no globe icon,
  no language dropdown, `document.documentElement.lang` fixed at `"en"`.

## 2026-08-30 (`TeamCascade` card layout: two columns — photo left, full details right)

Each active card in `/about/team`'s Cards Cascade (ADR-0076) is now a
two-column layout instead of a single centred photo: photo card on the
left, full details on the right (name, title, experience, full bio,
credential chips) — stacks to one column below `md`. The whole two-column
block is still one animated unit, so the existing fold/depth animation is
unchanged; only what renders inside each card changed. `TeamMember` data
(`@/data/mocks/team`) reused unchanged — nothing new added to the type,
just more of the existing fields (`bio`, `credentials`) now rendered.
`yarn lint`/`yarn build` clean; verified live scrolling through multiple
members.

## 2026-08-30 (`/about/team` moves from WebGL "Mirror Hall" to a CSS-3D "Cards Cascade"; a real Lenis `scrollTo` bug fixed on both Cascade pages)

Replaced "Mirror Hall" (ADR-0074) with `TeamCascade` — the same tall-track
CSS-3D "Cards Cascade" mechanism `/projects` got below, re-skinned with
this page's own hero copy and a teal (`#5cc8d7`) accent, per
[[decisions-log#ADR-0076|ADR-0076]].

- `TeamMirrorHall.tsx` / `build-mirror-hall-scene.ts` deleted outright
  (zero remaining references anywhere), not just retired.
- Cards show photo, name, title, experience — reusing `teamMembers`
  unchanged, no data touched.
- **Real bug, not a testing artifact this time:** both Cascade pages'
  CTA buttons ("Explore projects" / "Meet the team") never actually
  scrolled anywhere — the shared `scrollTo()` helper races a Zustand flag
  against Lenis actually stopping. Fixed on both pages by calling
  `lenis.stop()` → `window.scrollTo(..., "instant")` → `lenis.start()`
  directly; `"smooth"` was reliably cancelled by Lenis in this setup, so
  both CTAs jump instantly now instead of animating. Not fixed in the
  shared helper itself — other call sites depend on its current
  behaviour and a sitewide audit was out of scope.
- `yarn lint`/`yarn build` clean; both CTAs verified actually scrolling
  after the fix, live.

## 2026-08-30 (`/projects` gains a "Cards Cascade" scroll-driven deck — CSS 3D only, no WebGL)

Replaced `/projects`' `<ProjectsSection headingTag="h1">` grid with a new
page-scoped `ProjectsCascade` — a tall-track scroll-driven deck that folds
through every real project one at a time, per
[[decisions-log#ADR-0075|ADR-0075]].

- Pure CSS 3D (`perspective`/`translate3d`/`rotateX`), spring-interpolated
  per hard rule #1 — no WebGL, no `@keyframes`. Own hero (eyebrow "GEOPORTE
  · Selected Work", title "Our Projects", CTA "Explore projects").
- `ProjectsSection.tsx` was **not** touched — it's shared with the
  homepage, so this page stopped rendering it rather than reshaping it.
- A real bug (first card sitting at full rest behind the hero for the
  entire intro, from an over-eager clamp in `cascadeActiveIndex`) was
  caught only by scrolling the real page, not by reasoning about the
  interpolation formula alone — see the ADR for the fix.
- `yarn lint`/`yarn build` clean; verified interactively (real gradual
  scroll, not just a build pass).

## 2026-08-30 (`/about/team` rebuilt as "Mirror Hall" — original 3D carousel with real-time water reflection)

Replaced the plain responsive grid (ADR-0072) with an original Three.js
experience: a curved carousel of the real team photos above a reflective
water plane, built from scratch per [[decisions-log#ADR-0074|ADR-0074]] —
no third-party carousel/reflection library, no CSS-faked water.

- New `build-mirror-hall-scene.ts` + `about-team/TeamMirrorHall.tsx`;
  `about-team.tsx` now just hands `teamMembers` (unchanged, `@/data/mocks/team`)
  straight through — no second copy of the roster, no name/bio/photo edited.
- Water reflection is a real second camera mirrored across the water plane,
  rendering the cards into a `WebGLRenderTarget` each frame — not a
  duplicate mesh, not a CSS blur. A fixed-size ripple pool (8 slots)
  distorts the reflection on drag/click; particles reuse the pixel-size
  shader from `build-team-starfield-scene.ts`. Sampling that render target
  by the water plane's own UV (rather than projecting through the
  reflection camera's view-projection matrix, the way three.js's own
  `Reflector.js` does it) initially produced a tiny, mis-scaled sliver of
  reflection instead of a full mirrored carousel — caught in live browser
  testing and fixed; see [[decisions-log#ADR-0074|ADR-0074]] for the full
  diagnosis.
- Mobile keeps WebGL running (reduced tier by container width) rather than
  falling back to the grid — a deliberate exception to this project's usual
  "no WebGL on mobile" rule; the grid is now only the no-WebGL fallback.
- Accessibility doesn't depend on the canvas: a real `sr-only` button per
  member drives selection; Escape/backdrop/close all work through the same
  state.
- `TeamStarfieldBackground.tsx` retired (empty route set, file kept) — fully
  hidden behind Mirror Hall's own opaque canvas either way; `layout.tsx`
  and `/about` were not touched.
- `yarn lint` / `yarn build` clean.

## 2026-08-30 (Projects page: real photos supplied and mapped onto every card, showreel tile and the detail modal)

A local `images/` folder (27 real photos, generic filenames with no
project-to-photo correspondence of their own) was supplied directly,
changing the premise ADR-0065/ADR-0071 established (no real per-project
photography existed to scrape from the live site). Copied all 27 files
into `public/assets/projects/` and added an `image` field to every entry
in `projects.ts`, assigned by position (27 filenames sorted alphabetically,
zipped against the 27-project array in its existing order — deterministic,
since the filenames carry no real content mapping to draw on).

`ProjectCard.tsx`'s category-gradient placeholder and `ProjectsShowreel.tsx`'s
tile gradients were both replaced with the real photos (`next/image`);
the now-dead `CATEGORY_GRADIENT` maps and `gradientAngle` PRNG field were
removed rather than left unused. `ProjectModal.tsx` — previously text-only —
now shows the photo full-bleed and large above the details, with the close
button moved onto the image; category/title/location/discipline/description
are unchanged. Since `ProjectCard`/`ProjectModal` are shared with the
homepage's own embedded Projects section, it picked up real photos too —
verified live, nothing else on that page changed. See [[decisions-log]]
ADR-0073.

## 2026-08-30 (`/about/team`: replaced the Pinwheel Galaxy with a dedicated calm starfield; replaced the Cards Cascade deck with a plain grid)

Two prior tuning passes on this page (ADR-0070: re-tinted the galaxy off
purple/pink, retuned the cascade's `backFade`) turned out to be the wrong
lever — a detailed follow-up brief made clear the actual ask was a
different mechanic entirely, not different numbers on the same one.

**Background.** New `TeamStarfieldBackground.tsx` +
`build-team-starfield-scene.ts` — a plain particle field (no galaxy arms/
bulge/sparks, no bloom), mounted only on `/about/team`; `/about` keeps the
Pinwheel Galaxy unchanged. Caught and fixed a real bug while building it:
`THREE.PointsMaterial`'s `sizeAttenuation` doesn't produce a pixel size at
all, so particles tuned to look like ~1.6px rendered as ~90px squares near
the camera — replaced with a small custom shader (per-vertex size as true
pixels + circular falloff), matching the pattern this codebase's other
starfields already use. Also fixed `--raw-gradient-fallback-pinwheel-
galaxy`, which ADR-0070 missed re-tinting when it recoloured the actual
scene.

**Cards.** Deleted the Cards Cascade deck outright (`TeamCascadeExperience/
Deck/BioPanel.tsx`, `cascade-config.ts`) and replaced it with independent,
self-contained `TeamMemberCard.tsx`s (photo + name + title + experience +
credentials + bio, all in one card) in a plain responsive CSS Grid — same
convention `ProjectsSection.tsx` already uses. No team member data, names,
titles, photos, credentials, or bios were changed; the only page-chrome
copy touched was one sentence describing the old scroll mechanic
("Scroll to meet the team"), which no longer applied. See
[[decisions-log]] ADR-0072.

## 2026-08-29 (Projects page: new scroll-driven "showreel" flythrough section; uncovered a sitewide `position: sticky` bug)

Added `src/views/projects/` (`ProjectsShowreel.tsx` +
`projects-showreel-config.ts`), a scroll-driven 3D flythrough through every
real project, sitting above the existing `ProjectsSection` grid (unchanged)
on `/projects`. Technique adapted — not copied — from a user-supplied "AI
Studio" reference template's Projects/Showreel section: studied its
tall-track/sticky-stage + progress-driven-transforms shape, then built an
original, smaller implementation using this project's own
`useProgressTrigger` hook and two animated values (camera-rig transform +
group opacity) instead of a large per-tile timeline. No real per-project
photography exists to put in the tiles — re-confirmed live against
geoporte.com.au (only Elementor's stock `placeholder.png`, `/gallery`
404s) — so tiles reuse `ProjectCard.tsx`'s category-gradient system,
varied per-tile by a seeded PRNG.

Building it surfaced a real, sitewide bug: `position: sticky` doesn't
work on this site at all. `<body>` carries its own `overflow: hidden auto`
alongside `<html>`'s Lenis setup, and since body's content never actually
overflows its own box, sticky resolves against body's permanently-zero
scroll instead of the real scrolling element — confirmed via
`getBoundingClientRect()`, and confirmed `about-team/TeamCascadeDeck.tsx`'s
identical `sticky top-0` has the same failure. Out of scope to fix
`<body>`'s CSS globally this turn, so `ProjectsShowreel.tsx` reproduces
sticky's three states by hand via a `subscribeToTicker` callback instead.
See [[decisions-log]] ADR-0071 and the `projects.md` catalog note — check
there first if a future sticky-based component looks "not quite pinned."

## 2026-08-29 (Team page: Pinwheel Galaxy re-tinted off purple/pink; Cards Cascade overlap fixed for an 11-member roster)

Two `/about/team` fixes, team data/photos/bios untouched. **Background:**
`build-pinwheel-galaxy-scene.ts`'s CONFIG colours re-tinted from the
materialized GetLayers source's magenta/gold/mint "Default" palette to
this project's own dark-navy/sky-blue family — the sanctioned "tint
through CONFIG, never the shader" re-skin path, geometry and shaders
untouched. **Card overlap:** `cascade-config.ts`'s `backFade` (how many
card-steps deep the back stack stays fully opaque) was the source
template's own `9.0` — fine for a 3–5 card deck, but with this roster's 11
members every card back to `p=9` rendered at full opacity simultaneously,
reading as an overlapping pile with no clear layout. Retuned to `0.5`: only
the crest card plus ~2 cards behind it stay visible now, fading to 0 by
`p≈2.5`; the fold formula itself is unchanged. See [[decisions-log]]
ADR-0070.

## 2026-08-29 (Homepage Digital Twin section recoloured dark navy, without touching the Geotechnical service page's shared light palette)

The "See beneath every site before you build on it" section
(`GeotechnicalPlexusSection.tsx`) had a light "engineering diagram"
background — correct for its original design, but this section specifically
needed to go dark navy (`#040d1a`) with white text. That palette
(`-surface-engineering`/`-ink-engineering`/etc.) is shared with
`/services/geotechnical-engineering`'s own PLAXIS hero, which had to keep
its original light look, so the shared Tier-2 tokens in `:root` were left
alone. Instead, the homepage section's own `<section>` now carries a
page-scoped override via Tailwind arbitrary-property syntax
(`[--surface-engineering:var(--raw-color-navy-925)]` etc.) — the same
technique design-system.md documents for `--accent`. Added one new Tier-1
primitive, `--raw-color-navy-925: #040d1a`, for the exact hex specified.
The button's teal background and white text were already correct and
untouched; the eyebrow label now uses the same white ink token as the
heading/body copy. The 3D soil-layers scene and its border were not
touched. Verified live on both pages. See [[decisions-log]] ADR-0069.

## 2026-08-29 (Homepage hero: wireframe scene only, Earth globe hidden there but kept everywhere else)

Explicit follow-up to ADR-0066: the hero should show its own digital-twin
wireframe scene only, not the Earth globe layered behind it. `HeroSection.tsx`
goes back to an opaque `bg-background` (dark navy, same token used
elsewhere) instead of `bg-transparent` — since the globe's canvas sits at
`z-index: -1`, the hero's own opaque background fully occludes it for that
section's scroll range, while the wireframe scene (a sibling canvas with a
higher stacking position inside the hero) renders unaffected on top. No
other section was changed: About, Services, Stats, Projects, and Contact
were all confirmed (by scrolling the live page) to already show the globe
correctly; `Footer.tsx`'s opaque `bg-background-alt` is pre-existing and
untouched. See [[decisions-log]] ADR-0068.

## 2026-08-29 (Fixed a dev-mode bug that could silently disable every 3D scene sitewide)

**Symptom.** Homepage looked like a regression — no Earth globe, no hero
wireframe scene, no ambient background — even though `HeroSection.tsx`,
`layout.tsx`, and `PlanetBackground.tsx` were all confirmed correct by
direct inspection and a `curl` of the live server's HTML. Browser
inspection found the real symptom: zero `<canvas>` elements anywhere on
the page.

**Cause.** `localStorage["geoporte:performance-tier"]` had been persisted
to `"low"` by `performance-monitor.ts`'s live FPS watchdog, which downgrades
(and durably saves) the tier whenever `HeroScene.tsx`'s render loop measures
under 20fps for a sustained 3 seconds. That watchdog had no dev-mode
exemption, and Turbopack's own recompilation/HMR work is enough to trip it
on its own, regardless of the machine's real capability (this one: 32GB
RAM, 24 cores). Per ADR-0058, tier `"low"` sets `webglDisabled: true`,
which is why every WebGL scene sitewide silently stopped mounting —
and because the tier persists across reloads by design, it stayed broken
until `localStorage` was cleared by hand.

**Fix.** `reportHeroSceneFrame` now no-ops outside production, so a dev-mode
compile stutter can never trigger the live downgrade; the one-time static
hardware read (`hasStaticLowPerformanceSignal`) is untouched and still runs
everywhere. See [[decisions-log]] ADR-0067. No in-app way to reset an
already-downgraded tier by design (ADR-0058) — clear
`geoporte:performance-tier` from `localStorage` manually if this was hit
before this fix landed.

## 2026-08-29 (Light theme fully reverted — dark-only again; homepage hero made transparent for the Earth globe)

**Theme reverted.** Removed everything ADR-0064 added, the same day it
shipped, under explicit user direction: `use-theme-store.ts`,
`ThemeController.tsx`, `Nav/ThemeToggle.tsx` deleted outright; the toggle
mounts in `Nav.tsx`/`MobileMenu.tsx`, the `<ThemeController>` mount and
the anti-flash `<script>` in `layout.tsx` removed; `globals.css`'s light
Tier-1 primitives and `:root[data-theme="light"]` override block removed,
restoring the sitewide dark-only default. `[data-glass-readability]`'s
consolidation into one CSS rule (instead of five duplicated inline
`style` objects) was kept as a standalone simplification. See
[[decisions-log]] ADR-0066.

**Homepage hero: transparent, so the Earth globe shows through.** The
globe's canvas was already correctly `position: fixed; z-index: -1`
behind everything — the actual problem was `HeroSection.tsx` painting an
opaque `bg-background` fill plus a `background`-gradient wash directly
over it. Both removed; the section is now `bg-transparent`. Hero copy
gained a `text-shadow` for legibility in place of the removed gradient
backdrop. The existing digital-twin wireframe scene stays layered with
the globe in the hero (kept by explicit user choice, not removed). A
second issue turned up once the opaque layers were gone: the globe was
still barely visible, cropped to a sliver at the very bottom of the hero —
`build-planet-scene.ts`'s own "hero: huge globe, low, half below the
fold" pose, carried over unchanged from the ported template, which
directly contradicted the "fully visible" requirement. Retuned just the
hero (`p: 0`) keyframe stop (smaller, higher) so the globe's lit
atmosphere fills the frame; every other scroll keyframe (the mid-scroll
swing, the settle) is untouched. See [[decisions-log]] ADR-0066.

## 2026-08-29 (Light/dark theme toggle; i18n coverage widened sitewide + a real batching bug fixed; real Publications content)

**Theme toggle** — sun/moon button in `Nav.tsx` and `MobileMenu.tsx`, next
to the language switcher. `useThemeStore` (zustand `persist`, key
`geoporte-theme`, default `"dark"`) drives `<html data-theme>` via the new
`ThemeController.tsx`; a blocking inline script in `layout.tsx`'s `<head>`
prevents a flash of the wrong theme before hydration. New light-mode
token overrides in `globals.css` under `:root[data-theme="light"]`. Fixed
WebGL/video backgrounds are NOT retinted — only the 2D content layer
(backgrounds, panels, text) responds to the toggle. See [[decisions-log]]
ADR-0064, including a real bug it surfaced and fixed:
`[data-glass-readability]`'s old hardcoded-white-text inline style would
have gone white-on-white once glass panels could turn light too.

**i18n** — audited actual `<TranslatedText>`/`useTranslated` coverage
file-by-file rather than assuming the store was broken; found the store/
cache/persistence mechanism was already correct and global, but most
non-homepage pages had never had their body copy, card fields or button
labels wrapped in the first place. Swept `about.tsx`, `contact.tsx` (+ its
homepage duplicate `ContactSection.tsx`), `publications.tsx`,
`about-team.tsx` and its `TeamBioPanel`/`TeamCascadeDeck`, `ProjectCard`/
`ProjectModal`/`ProjectsSection`, `ServiceHero`, `ServiceOverview` (this
supersedes ADR-0024's narrower scope, noted in place), `ServiceSubServiceGrid`,
the shared `ServiceCard`, `StatCounter`, `ExperienceStatBox`, and
`TeamPanel`'s typed role lines (resolved via `useTranslated` before
`TextEngine`, not `<TranslatedText>` as a child — see ADR-0065). Also
fixed a real bug: `translation-queue.ts` didn't chunk requests to the
`/api/translate` route's own 50-string cap, so any page with more than 50
translatable strings queued in one batch window would fail entirely
instead of partially. See [[decisions-log]] ADR-0065.

**Images** — re-verified the real geoporte.com.au site via live DOM
inspection rather than trusting an LLM page-summary tool, which had
fabricated plausible-sounding project photo filenames that don't actually
exist on the page. Confirmed `/projects` has no real per-project
photography (text-only cards, as documented in `projects.ts` already) —
`ProjectCard.tsx` now shows a category-keyed CSS gradient instead,
reusing existing brand tokens. `/publications` does have three real,
previously-unused cover images — downloaded to
`public/assets/publications/`, with a new `src/data/mocks/publications.ts`
(title/authors/venue read off each cover, since the live site itself
carries no such metadata) and a real "Selected publications" grid on the
page. See [[decisions-log]] ADR-0065.

## 2026-08-29 (Sitewide responsive/touch-target sweep)

Fixed 4 genuinely unguarded fixed-column grids that rendered multi-column
at every width down to 320px (`Footer.tsx`, the offices grid duplicated in
`home/ContactSection.tsx` and `contact.tsx`, `home/ProjectExperienceSection.tsx`'s
stat boxes, `home/ProjectModal.tsx`'s details grid) — all now
`grid-cols-1` with `sm:`/`md:` overrides. Converted `ServicesDropdown.tsx`
from hover-only to click-or-hover (a touchscreen can't reliably trigger
`:hover`, and this dropdown shows on `md:flex`, which iPad's 768–1023px
"tablet" tier still renders). Added a defensive `overflow-x: hidden` to
`html`/`body` in `globals.css`.

**Notable finding, documented in [[decisions-log]] ADR-0063:** this site's
adaptive scaling grid means a rem-based Tailwind size like `min-h-11` is
**not** a guaranteed 44px — it measures as low as 33px at 768px (iPad
portrait) and 35px at 1536px (a common laptop width), only hitting its
nominal value at the grid's own 1024/1440/1920 reference widths. Every
touch target this pass touched (nav CTA, hamburger, language switcher,
services dropdown, cookie consent controls, mobile menu links, about-page
CTAs) was converted to an arbitrary absolute-px value (`min-h-[44px]`)
instead — this is not yet a sitewide sweep of every button, flagged as a
reasonable follow-up. See [[components/common]] and [[design-system]] for
the same warning, so it isn't rediscovered from scratch.

## 2026-08-29 (`/about/team` wired into site navigation)

`/about/team` (added earlier this session, see below) is now reachable from
every standing nav surface, not just the `/about` page's own inline link:
added "Our Team" → `/about/team` to `nav-links.ts`'s `primaryNavLinks`
(shared with `Footer`'s "Company" column), `Nav.tsx`'s own desktop
`secondaryLinks`, and `MobileMenu.tsx`'s `primaryLinks` — three separate,
pre-existing lists (not refactored into one; out of scope for this change).
`/about`'s own "Meet the full team" text link was upgraded to a real
`bg-accent` button ("Meet Our Team →", `Magnetic`-wrapped), matching this
page's other CTA buttons instead of reading as a quieter inline link.

## 2026-08-29 (New `/about/team` page — GetLayers "Cards Cascade" section)

New route `/about/team` (`src/app/about/team/page.tsx` → `src/views/about-
team.tsx`), registered in `sitemap.ts` and linked from `/about`'s own team
section. Built from the GetLayers catalog **section** `cards-cascade`
(role: `cards`, materialized with `styleId: "neural-monitor-style"`) — a
scroll-pinned CSS-3D card deck, ported into `src/views/about-team/`
(`cascade-config.ts`, `TeamCascadeDeck.tsx`, `TeamBioPanel.tsx`,
`TeamCascadeExperience.tsx`) with its fold geometry preserved verbatim per
the asset's own contract, everything else re-authored to this project's
conventions (Tailwind + tokens, the vendored `useProgressTrigger` hook
instead of a hand-rolled scroll listener, the shared ticker instead of a
second rAF loop). See [[decisions-log]] ADR-0062 for the full rationale,
including an automatic scroll-snap feature that was tried, found to trap
native scrolling, and reverted in favour of the deck's rail/keyboard
navigation.

Reuses the existing Pinwheel Galaxy background (ADR-0055) and
`.glass-panel` treatment unchanged — both `GLASS_BACKGROUND_ROUTES` and
`PinwheelGalaxyBackground.tsx`'s own route set were extended to include
this route.

11 real Geoporte staff profiles (`src/data/mocks/team.ts`) scraped from
geoporte.com.au/our-team, photos downloaded to `public/assets/team/`.

## 2026-08-29 (Homepage "Project Experience" section)

New homepage section (`src/views/home/ProjectExperienceSection.tsx`, mounted
between `ServicesSection` and `StatsSection` in `home.tsx`) — a real staff
site-visit photo and two colour-block stat callouts on the left ("100+
Projects completed", "20+ Countries of work experience", spring count-up via
a new `ExperienceStatBox.tsx`, same idiom as the existing `StatCounter`), the
"Experience & Technology" / "Project Experience" copy and a `Magnetic`
"Learn more →" CTA to `/about` on the right, wrapped in the sitewide
`.glass-panel` treatment (justified here by `AmbientBackground`'s persistent
scene sitting behind every homepage section). Content lives in
`src/data/mocks/experience.ts`; the team photo is
`public/assets/team/geoporte-team.jpg`, downloaded from geoporte.com.au's own
Project Experience section (whose live counters show unpopulated "0+"
placeholders — the "100+"/"20+" figures here are the site's real marketing
copy). Added two new Tier 1/2/3 tokens for the stat-box fills —
`--raw-color-stat-purple`/`--raw-color-stat-amber` → `--stat-purple`/
`--stat-amber` → `--color-stat-purple`/`--color-stat-amber` — the first
purple/amber colours in the palette, deliberately outside the sitewide azure
family (same reasoning as the per-service accent tints).

## 2026-08-29 (Geotechnical Engineering page — bespoke PLAXIS-inspired FEA hero, layered on top of the existing Solaris background)

Added a premium finite-element geotechnical visualization — a deep
excavation with retaining walls and struts, a piled foundation, a bored
tunnel, six geological strata, a graded FE mesh network denser around
every structural element, toggleable deformation and analysis-result
contours (5 modes, an original blue→green→yellow→red ramp), a 6-stage
construction sequence, real click-drag/zoom orbit camera, hover tooltips
and a 5-band scroll choreography — as the Geotechnical Engineering service
page's hero. Explicitly not a PLAXIS/Bentley UI copy.

A first pass retired Solaris (that page's previous full-page background)
entirely; on explicit user correction, fully reverted — **Solaris stays as
the page's fixed full-page background, with the new FEA scene rendering
on top of it inside the hero section only**, both visible together. The
hero is a new bespoke component, `GeotechnicalAnalysisHero.tsx`
(special-cased by slug in `service-detail.tsx`, not an extension of the
shared `ServiceHero.tsx`), deliberately transparent so Solaris shows
through around it; the FEA scene's own bounded viewport is styled as a
light "instrument panel" (the `-engineering` tokens from the homepage
Plexus section, ADR-0060) floating over the dark Solaris background. The
homepage Geotechnical card keeps its own Solaris scene unchanged.
`HeroScene.tsx` gained an optional `onSceneReady` callback (backward-
compatible) so a parent component can reach a scene's controls beyond the
base handle contract — used here to wire the stage-stepper/deformed-
toggle/result-mode UI to the scene. All 12 `geotechnical-fea/` builder
modules + the orchestrator are written, wired in, and browser-verified
(including a forced-render ground-truth pass working around this
environment's known `document.visibilityState` quirk) — the excavation
visibly deepens across stages, tooltips appear on hover, and the
deformation/contour toggle produces a correct engineering colour ramp.
`.claude/scripts/verify.sh` (0 FAIL), `yarn lint`, `yarn build` all clean.
Full write-up in ADR-0061.

## 2026-08-28 (Geotechnical Plexus homepage feature section — new digital-twin scene, vanilla Three.js by explicit user choice, new light-theme token island)

Added a new homepage section (`GeotechnicalPlexusSection`, mounted between
`AboutSection` and `ServicesSection`) built around a new scene builder,
`build-geotechnical-plexus-scene.ts`: a light-themed, premium "digital
twin" visualization of an underground site — six geological strata (each a
real wavy volumetric slab, not a flat plane), a depth-graded "Plexus" node/
line/triangle network (sparse and irregular near the surface, dense and
lattice-like in Bedrock), five labelled boreholes (BH-01..05) with strata-
intersection markers, a piled foundation slab, a groundwater plane, slow
data pulses riding the network, mouse-driven restrained tilt, and a
5-stage scroll choreography (assembled → exploded strata → plexus
emphasis → borehole/pile highlight → reassembly).

The brief asked for React Three Fiber + @react-three/drei + GSAP/Framer
Motion, which conflicts with this project's spring-only motion rule and
isn't installed — raised to the user via `AskUserQuestion`, who chose to
match the existing vanilla-Three.js `HeroSceneHandle` architecture instead
of forking it. Zero new dependencies. Decomposed into 9 builder modules
under `src/components/scene/geotechnical-plexus/` per the brief's own
"don't put everything in one component" ask. New `-engineering` token
island in `globals.css` (surface/ink/line/accent/glow) scopes this
section's light background to itself without touching the sitewide dark
theme. Full reasoning, including two RSC-boundary build failures found and
fixed along the way (`spring-text-engine` needs its own `"use client"`
leaf; a scene-factory function can't be passed as a prop straight from a
Server Component), in ADR-0060.

## 2026-08-28 (Contact page glass intensified 50% — surfaced and fixed a latent bug where .glass-panel's page-scoped overrides, Stormwater included, never actually applied)

Requested: 50% more "liquid glass" on `/contact`. Implemented as a
page-scoped override (blur 20px→30px, a new `--glass-saturate` token
180%→270%, border alpha 0.1→0.15, all ×1.5) — the same mechanism
Stormwater's own "more transparent" glass override already used
(ADR-0049). Checked the result with `getComputedStyle` instead of just a
screenshot, and it hadn't worked: only the new saturate change applied;
blur and border stayed at the sitewide default.

Root cause: `.glass-panel` read `--color-glass-fill`/`--color-glass-
border`/`--blur-glass` — Tailwind `@theme inline` aliases of the real
Tier-2 tokens. That aliasing only auto-resolves live for Tailwind-
*generated utility classes* (`bg-accent` and friends are unaffected by
this bug); hand-written CSS referencing the alias name directly gets the
classic CSS custom-property gotcha instead — the alias's value is fixed
at the element where *it* was declared (`:root`), not where it's
consumed, so no page-scoped override further down the tree could ever
reach it. **This means Stormwater's own glass override has been silently
broken since ADR-0049** — its panels have been rendering at the sitewide
default the whole time, not the intended more-see-through treatment.
Fixed by having `.glass-panel` read all four properties (`--glass-fill`/
`-border`/`-blur`/new `-saturate`) by their Tier-2 name directly; removed
the now-dead Tier-3 aliases entirely (confirmed via grep — nothing
consumed them as real Tailwind utility classes). Full write-up, including
a second self-inflicted bug (a comment containing the literal text
"@theme inline" tripped `verify.sh`'s naive `awk` range-match and false-
flagged dozens of unrelated tokens): ADR-0059.

- Verified via `getComputedStyle` on both pages this time, not a
  screenshot: `/contact` now reports `blur(30px) saturate(2.7)` /
  `rgba(255,255,255,0.15)` border; `/services/stormwater-and-flood-
  modelling` now correctly reports its ADR-0049 values
  (`blur(12px)`/`rgba(4,6,15,0.35)`/`rgba(255,255,255,0.08)`) for the
  first time since that ADR shipped.

## 2026-08-28 (Sitewide bug sweep + 4-tier performance system — Ultra/High/Medium/Low, superseding the simpler 3-tier gate from one turn earlier)

Fixed real bugs found by direct grep/read, not assumed: scroll position
never reset on a client-side route change (`ScrollController` in
`scroll-layout.tsx` now calls `lenis.scrollTo(0, { immediate: true })` on
every plain pathname change, distinct from its existing hash-anchor
handling); five stale `/#contact` links left over from before the
standalone `/contact` page existed (`Nav.tsx`, `MobileMenu.tsx`,
`Footer.tsx` ×2, `ServiceCta.tsx`); `/privacy-policy` linked from the
cookie banner/modal but never built — a genuine 404, now a real, honest
page describing only what this site's own code actually does (no
fabricated legal claims for a real company); the Nav hamburger button was
36×36px, below the 44px touch-target floor.

New 4-tier performance/capability system (`src/lib/scene/
performance-tier.ts`, `src/hooks/performance/use-performance-tier.tsx`)
— Ultra/High/Medium/Low, `hardwareConcurrency`/`deviceMemory`/mobile-UA/
screen-width thresholds, localStorage persistence, a React context
provider mounted in `layout.tsx`. Supersedes the simpler
`hardwareConcurrency <= 4` gate ADR-0056 added one turn earlier —
`device-tier.ts`'s `isLowPowerDevice()` now delegates to it, so every
existing consumer (`HeroScene`, `AmbientBackground`, `PlanetBackground`,
`SceneViewport`, every scene's DPR clamp) picks up the fuller detection
with zero additional wiring. `performance-monitor.ts`'s FPS threshold
30→20fps, and its warning can now fire more than once per page lifetime
(5s re-arm cooldown) — each firing downgrades the tier one step via the
new context and re-shows `PerformanceWarningToast` (message/timing
updated to match). Fallback gradients for the 9 dedicated WebGL scenes
replaced with new literal 3-stop `radial-gradient(...)` strings (new
`--raw-gradient-fallback-<scene>` tokens, `SceneFallbackGradient.tsx` now
takes one `gradient` prop instead of `from`/`to`). Full write-up,
including a resolved brief contradiction (mobile tier-3 vs. the brief's
own mobile-forcing rules) and what was deliberately not wired (live
particle/bloom reduction inside the 9 already-shipped scene builders):
ADR-0058.

- Browser-verified the tier system end-to-end, not just individually:
  `localStorage.getItem('geoporte:performance-tier')` returned `"ultra"`
  after a real page load on the dev machine, confirming detection +
  context + persistence all actually ran.
- The `/contact` + Bird video request in the same prompt turned out to
  already be fully shipped the immediately preceding turn (ADR-0057) —
  confirmed, not rebuilt.

## 2026-08-28 (Bird video added to /contact — page rebuilt from the shared homepage ContactSection, contact form gained a phone field, twelfth glass route)

GetLayers' "Bird" background video as the standalone `/contact` page's
fixed full-page background. Downloaded (confirmed via HEAD check + user
confirmation first), extracted a real 2700×2160/5s h264 master, re-encoded
to `public/assets/bird/` (1920×1080 mp4+webm, cover-cropped since the
source isn't 16:9, plus a 1280×720 mobile pair via the quality-ladder
mechanism `VideoBackground.tsx` gained in the immediately-preceding
mobile-optimization turn — added proactively so this new background
wouldn't be the one inconsistent with that work). New
`BirdBackground.tsx` mounted route-gated to `/contact`; `/contact` added
to `GLASS_BACKGROUND_ROUTES`. The page itself was previously
`<ContactForm />` + the shared homepage `<ContactSection />` (which also
renders `ContactTerrain`, a section-scoped WebGL office-marker terrain
built for a plain background) — rebuilt `contact.tsx` with its own
`.glass-panel` sections, reusing `ContactForm` and the real `offices`/
`contact` data from `company.ts` directly instead of the shared section
component; `ContactSection.tsx`/`ContactTerrain.tsx` are untouched and
still power the homepage. `ContactForm.tsx` gained an optional phone
field (`/api/contact/route.ts`'s zod schema updated to match) — the
brief asked for "name, email, phone, message" and the existing form only
had three of the four. Full write-up: ADR-0057.

- Browser-verified directly this time (screenshot): the video background,
  the new phone field, and all four real offices with correct addresses
  all rendered correctly — the usual automation-tab rAF throttling only
  delayed the text-reveal animation, not the content or video itself.

## 2026-08-28 (Sitewide mobile/low-power optimization — WebGL disabled on weak CPUs too, per-scene CSS fallbacks, video quality ladder)

`device-tier.ts`'s `getDeviceTier` now also treats `navigator.
hardwareConcurrency <= 4` as "mobile" tier (SSR/hydration-safe, folded
behind the same `width > 0` gate every caller already used) — a low-core
desktop or a wide-viewport tablet with a weak CPU now gets the exact same
"WebGL never mounts" treatment `HeroScene.tsx` already gave narrow
viewports since ADR-0031. Because every consumer (`HeroScene`,
`AmbientBackground`, `PlanetBackground`, `SceneViewport`) already reads
this one function, the new rule reached all of them with zero per-scene
wiring. `HeroScene.tsx` gained an optional `fallback` prop; each of the 9
dedicated `*Background.tsx` wrappers now passes a new, unanimated
`SceneFallbackGradient.tsx` toned to that scene's own real palette (10 new
`--raw-color-fallback-*` Tier-1 tokens in `globals.css`) instead of the
generic `--accent`/`--glow` pulse `HeroFallback` still uses everywhere
else. `VideoBackground.tsx` gained `mobileMp4Src`/`mobileWebmSrc` props
(`<source media="(max-width: 768px)">`, zero JS) and a client-computed
`preload="none"` on the mobile tier; re-encoded 1280×720 mp4+webm for
Siloutte and Purple Planet from the existing 1920×1080 assets via ffmpeg
(no 4K master kept in the repo to re-derive from). Full write-up,
including the two gaps flagged in the original request (Civil Engineering/
Golden Parthenon and Stormwater/Negentropy missing gradient colours;
Aurum Peak/Publications missing from the disable list) and how they were
resolved: ADR-0056.

- Audited via the `optimize-3d-scene` skill first (hard rule #13) — found
  the off-screen/hidden-tab pause was already fully implemented for all 9
  scenes, so no work was needed there.
- Not directly browser-verified: this automation environment's
  `resize_window` doesn't actually change `window.innerWidth` (confirmed:
  resized to 390×844, `innerWidth` still read 1536) and has no CPU-core
  emulation, so the new fallback-gradient branch couldn't be exercised
  end-to-end visually — verified instead via code review against the
  existing, already-proven `HeroScene.tsx` mobile-check pattern, plus
  confirming all 10 new colour tokens resolve correctly and desktop
  rendering (a WebGL scene and a video background) is unaffected.

## 2026-08-28 (Pinwheel Galaxy added to /about — page rebuilt from a bare re-export into its own real content, tenth glass route)

GetLayers' "Pinwheel Galaxy" scene (differential-rotation spiral arms + a
bulge + rising ember sparks) as the standalone `/about` page's fixed
full-page background. Pulled via `getlayers_materialize` (id
`pinwheel-galaxy`); every brief number matched the real source exactly —
note the catalog's "deep-emerald" description describes a saved roll, not
the actual magenta/gold "Default" variant pulled and used here (checked
against the source's own `variantConfigs`). New
`build-pinwheel-galaxy-scene.ts` ports the polar-coordinate arms/bulge/
spark point clouds, the JS-accumulated differential-rotation phase (never
a speed-scaled `iTime`, per the asset's own contract notes), and the
three-composer rig verbatim; the source's own `window.scrollY` tracking
swapped for the shared `getScrollSignalSnapshot().progress` (same
substitution as Spiral Galaxy/Negentropy/the Planet globe); the source's
two separate rAF loops (main render + a freestanding appear-in loop)
folded into `HeroScene.tsx`'s single `renderFrame(elapsedSeconds)` call.
`/about` added to `GLASS_BACKGROUND_ROUTES`. The page itself was
previously just `<AboutSection headingTag="h1" />` — a bare re-export of
the homepage's own About section — rebuilt into its own page reusing
`AboutHeading`/`TeamPanel` directly plus new sections built entirely from
`company.ts`'s real data (an offices grid, `experienceRegions` pills, a
`/contact` CTA); no fabricated team content, same reasoning as the
Publications page (ADR-0053). `AboutSection.tsx` is untouched and still
used by the homepage. Full write-up: ADR-0055.

- Verified with the same forced-render + full-canvas `readPixels()`
  technique ADR-0054 established: real bright pixels up to pure white at
  ~12% coverage, `gl.getError() === 0`, no console errors. The live
  screenshot stayed dark — the same tab-wide rAF-starvation environment
  limitation documented since ADR-0048, confirmed as environment (not
  code) via the forced-render ground truth.

## 2026-08-28 (Spiral Galaxy added to Telecom Services — page background AND homepage card, last of the eight service lines dedicated)

GetLayers' "Spiral Galaxy" scene (a slowly turning two-arm galaxy, molten
gold core fading into deep-violet dust) replaces `buildTelecomTower` as
Telecom Services' page background and homepage card — the last of the
eight service-card mini-scenes retired, so `mini-scenes.ts` now exports an
empty `MINI_SCENES` map (kept as the registration point for a future
non-dedicated card, not deleted). No prior spec for this scene existed in
this conversation or `getlayers.json` despite being referenced as
"already provided" — flagged, then pulled the real source via
`getlayers_materialize` (id `spiral-galaxy`) instead of guessing. New
`build-spiral-galaxy-scene.ts` ports the re-hashed `SphereGeometry`
galaxy, the cursor-void repel, and the three-composer rig verbatim; the
source's own `window.scrollY` tracking is swapped for this project's
shared `getScrollSignalSnapshot().progress` (same substitution
`build-negentropy-scene.ts`/`build-planet-scene.ts` already made). Card
variant uses lighter sphere segments (90×260 vs. the hero's 200×600) and
skips the scroll-driven dive (no natural scroll range in a small card).
Wired exactly like Aureole: `telecom-signal-network` joined
`GLASS_SCENE_THEMES`, `/services/telecom-services` added to
`GLASS_BACKGROUND_ROUTES`, `SpiralGalaxyBackground.tsx` mounted in
`layout.tsx`, `telecom-services: createSpiralGalaxyCardScene` added to
`ServiceCard.tsx`. Full write-up: ADR-0054.

- Verified with a temporary debug hook (removed before finishing): a
  sparse-grid pixel sample initially looked too dim to be right, but a
  full-canvas `readPixels()` buffer read found real bright pixels (up to
  pure white) at ~6% coverage — the sparse grid had simply been missing
  this scene's small point sprites, not evidence of a bug. Worth
  remembering for any future scene that's a sparse point cloud rather than
  solid geometry: a coarse sample grid can produce a false negative.

## 2026-08-28 (Aurum Peak golden summit added to /publications — page rebuilt from a placeholder, ninth glass route)

GetLayers' "Aurum Peak" scene (a wireframe golden summit rising through
drifting sunset cloud, three-composer selective bloom, refractive-lens/
chromatic-aberration/vignette/grain final pass) as the standalone
`/publications` page's fixed full-page background — the second glass route
with no `Service["sceneTheme"]` to hook into, after `/projects` (ADR-0052).
Pulled via `getlayers_search`/`getlayers_materialize` (id `aurum-peak`);
every number in the brief matched the real source exactly. New
`build-aurum-peak-scene.ts` ports the CPU noise functions, the
CPU-triangulated summit mesh, both shaders and the composer rig verbatim;
CONFIG colours are the scene's own defaults, not the site's blue tint. Two
deviations already precedented by the Einstein–Rosen Lattice scene
(`WebGLRenderer` not `WebGL1Renderer`; no `extensions: { derivatives:
true }`, WebGL2 has them natively); one new one — the source's literal
black `#fade-overlay` DOM intro is folded into a `uFadeIn` uniform inside
`FinalPass` instead of a real DOM element, keeping the intro inside the
render loop rather than reaching for a CSS/DOM animation. `/publications`
added to `GLASS_BACKGROUND_ROUTES`. The page itself was a bare placeholder
(heading + one paragraph + a static "coming soon" card) — rebuilt with the
same `.glass-panel` treatment as every other glass page, plus a real
"Where our engineers publish" grid linking each of the eight service pages
by their own real titles/descriptions (no invented paper titles or
authors — Geoporte is a real company, and this vault only records real
content). Full write-up: ADR-0053.

- Verified with the same forced-render + `gl.readPixels()` technique as
  ADR-0051: a temporary debug hook (removed before finishing) confirmed
  the composer chain produces real terrain/cloud colour with
  `gl.getError() === 0`. The live automation-tab screenshot stayed black —
  the same tab-wide `document.visibilityState: "hidden"` rAF starvation
  documented since ADR-0048, this time also freezing the page's
  `react-spring` text reveal, confirming it's an environment limitation
  rather than anything scene-specific.

## 2026-08-28 (Purple Planet video background added to /projects — first glass route outside `/services/*`)

GetLayers' "Purple Planet" background video (a glowing violet planet with
city-light network patterns) as the standalone `/projects` page's fixed
full-page background — the first glass route that isn't a service detail
page and has no `Service["sceneTheme"]` to hook into. Same expired-link
pattern as the Siloutte download (ADR-0050): the first signed link had
expired by the time it was fetched, asked the user for a fresh one rather
than guessing a token. Re-encoded the 2892×2160/AAC 4K master down to a
single 1920×1080 mp4+webm pair (audio stripped, cover-cropped at encode
time) plus a matching poster — no card-sized variant needed this time,
since this asset has no homepage-card use case. Saved to
`public/assets/purple-planet/`. New `PurplePlanetBackground.tsx` reuses
`VideoBackground.tsx` unchanged and mounts route-gated to `/projects`;
adding `/projects` to `GLASS_BACKGROUND_ROUTES` (a plain pathname `Set`,
not scene-theme-keyed) hides the ambient wireframe shapes and the globe
there and applies the usual Nav/Footer glass tint, with zero new
machinery. `ProjectsSection.tsx`/`ProjectCard.tsx` untouched —
`ProjectCard`'s existing `bg-surface` token is already translucent enough
for the video to read clearly behind every card. Full write-up: ADR-0052.

- Verified directly with two screenshots (top of page and mid-scroll) —
  the actual Purple Planet footage renders correctly both times, reads
  clearly through the translucent project cards, and card text stays
  legible, no console errors, no compositor-timing artifact this time.

## 2026-08-28 (Aureole golden corona added — Advisory Services' page background AND homepage card, seventh glass route)

Seventh glass-background route — GetLayers' "Aureole" scene (a golden
particle corona erupting along 16 spokes from a dark hollow core,
95000 particles, cursor flare + click shockwaves), pulled via
`getlayers_materialize` and verbatim-ported in `build-aureole-scene.ts`.
Every number in the brief matched the real materialized source exactly —
nothing needed reconciling. The only scene in this codebase with a
genuinely static camera (`driver: "ambient"`, `camera.position` set once
and never touched again); the only motion is the particle eruption cycle
and the pointer-driven flare/shockwaves. Window-level pointer listeners
(not `HeroSceneHandle`'s `setPointer`) drive the interaction, since this
scene's canvas is always `pointer-events-none` in both places it's used.
Reused the existing glass-route machinery: `advisory-lifecycle-network`
(Advisory Services' existing scene theme) joined `GLASS_SCENE_THEMES`, its
old WebGL hero factory stays registered as dead code, and
`AureoleBackground.tsx` mounts route-gated the same way as the six routes
before it. Retired `buildAdvisoryCompass` (the card's old mini-scene) — the
shared mini-scene renderer now carries only `telecom-services`. Full
write-up: ADR-0051.

- Verified on the dedicated page with a real screenshot after a forced
  render — the corona renders exactly as specified, no console errors. A
  first screenshot attempt showed nothing; a `readPixels` check
  immediately after the same forced render confirmed correct, bright pixel
  data at those coordinates, so this was the same compositor-timing
  artifact seen in earlier turns, not a rendering bug.
- The homepage card couldn't be independently re-verified this turn — same
  `document.visibilityState: "hidden"` tab-throttling limitation already
  documented in ADR-0048/ADR-0050. Since the card runs the exact same
  `buildAureoleScene` function already confirmed correct on the hero page,
  this reads as an unverified-in-this-session limitation, not a defect.

## 2026-08-28 (Siloutte video background added — Project Control Services' page background AND homepage card, the first non-WebGL glass route)

Sixth glass-background route, and the first one backed by a plain
`<video>` element instead of a WebGL scene — GetLayers' "Siloutte"
background video (silhouette, glowing light beam). The first signed
download link expired before use ("This download link has expired.");
asked the user for a fresh one rather than guessing a token, per this
project's standing rule against fabricating URLs. Installed `ffmpeg`
(flagged first) and re-encoded the 2892×2160 4K/AAC master down to what
the layout needs: a 1920×1080 mp4+webm pair for the full-page background
and a 640×360 pair for the homepage card, both audio-stripped
(`-an` — always rendered muted) and cover-cropped at encode time, plus
matching poster stills — saved to `public/assets/siloutte/`. New
`VideoBackground.tsx` (`src/components/common/`) is a small shared
muted/looping/`playsInline` wrapper used by both; a `pauseWhenOffscreen`
prop drives an `IntersectionObserver` for the card. Reused the existing
glass-route machinery rather than inventing a parallel one:
`schedule-network-graph` (Project Control Services' existing scene theme)
joined `GLASS_SCENE_THEMES`, its old WebGL hero factory stays registered
as dead code (same as every other glass theme's), and
`ProjectControlBackground.tsx` mounts the video route-gated the same way
as the five WebGL backgrounds before it. Retired `buildProjectControlGantt`
(the card's old mini-scene). Full write-up: ADR-0050.

- Verified the full-page background with a real screenshot — the actual
  Siloutte footage renders correctly, no console errors.
- The homepage card's `<video>` mounted with correct, reachable
  (`curl -I` 200) source URLs but stalled at `readyState: 0` — traced to
  `document.visibilityState: "hidden"` in this automation browser, the
  same tab-visibility throttling already documented for WebGL canvases
  (ADR-0048). Same component and files work correctly in the page
  background, so this reads as an unverified-in-this-session limitation,
  not a code defect.

## 2026-08-27 (Stormwater's glass panels made more transparent — page-scoped, not sitewide)

Same day as the Negentropy entry below, continued: its particle field is
sparser/darker between clusters than Solaris (which the sitewide glass fill
was tuned against), so the near-solid `.glass-panel` look was hiding it.
Added a second Tier 1 quartet in `globals.css` —
`--raw-color-glass-fill-clear` (0.35 alpha, was 0.65), `-border-clear`
(0.08, was 0.1), `--raw-blur-glass-clear` (12px, was 20px), and
`--raw-shadow-glass-text-strong` (0.9 alpha, was 0.8) — and override the
Tier 2 `--glass-*` roles onto it from a wrapper scoped to
`stormwater-and-flood-modelling` only (`stormwaterGlassStyle` in
`service-detail.tsx`), alongside the existing per-service accent/
readability overrides on that same wrapper. The other four glass routes'
panels are untouched — confirmed via `getComputedStyle` before shipping.
Full write-up: ADR-0049.

## 2026-08-27 (Negentropy added — Stormwater & Flood Modelling's page background AND homepage card, six real particle scenes under one shared camera flight)

Fifth glass-background route. "Negentropy" isn't a cataloged GetLayers
asset (confirmed via `getlayers_search` before building anything), but
every field the brief named down to exact particle counts and geometry is
— `spiral-network`, `molecule`, `hourglass-galaxy`, `storm` (the brief's
"red storm"), and `starfield-close` were all pulled via
`getlayers_materialize` and cross-checked against the brief's numbers
(one real mismatch found and kept: Starfield Close's real particle count
is a structural 4200, not the brief's stated 1500). New
`build-negentropy-scene.ts` composites all six fields (the five pulled
scenes plus a directly-built ambient starfield) under one shared camera,
one shared cursor-void system, and one shared composer — each pulled source's own
per-field camera control and triple-composer atmosphere rig is dropped,
since six fields sharing one frame can't each steer the camera
independently. Retires `flood-inundation-terrain` (the page's old
catchment-terrain hero) and `buildStormwaterFlow` (the card's old
water-flow mini-scene). Full write-up: ADR-0048.

- Scroll progress reads this project's own shared `getScrollSignalSnapshot()`
  signal, not `HeroSceneHandle`'s hero-scoped `setScrollProgress` (which is
  meaningless for a `fixed inset-0` background) — same precedent as the
  planet scene's own scroll choreography (ADR-0034).
- The card shows Spiral Network alone (the brief's own "simplest, most
  performant field" pick) in a water/teal palette, toned-down bloom, no
  scroll dependency.
- Verified on the dedicated page via forced renders across the full scroll
  range (readPixels confirmed real, varying output at five progress
  values) and a real screenshot of the Molecule field's icosahedral atom
  cage rendering correctly. The homepage card could NOT be independently
  re-verified this turn — the automation browser tab's `requestAnimationFrame`
  stopped firing entirely, and under that condition every dedicated-scene
  card (including three verified working in earlier turns) showed zero
  mounted canvases, ruling out a Negentropy-specific bug but leaving the
  card unconfirmed visually pending a working browser session.

## 2026-08-27 (Golden Parthenon rebuilt a second time with the real GLB — replacing both the procedural temple and a same-day detour to a different scene)

Same day as the procedural Golden Parthenon entry below, continued: the
procedural temple was reported rendering as "floating blurry squares." First
swapped the Civil Engineering route to a different, successfully-pulled
GetLayers scene (Halcyon Gate — Night — a moonlit brass ring over a
reflective sea, `build-halcyon-night-scene.ts`) while that was being
verified, the user supplied the real Golden Parthenon source directly: a
`golden-parthenon.zip` in Downloads containing the original
`golden-parthenon.html` with its GLB and ground PBR maps inlined as base64.
Extracted and verified those four assets into real files
(`public/assets/golden-parthenon/{model.glb, ground-color.jpg,
ground-normal.jpg, ground-rough.jpg}` — JPEG EOI markers and the GLB's own
header/length checked, not assumed) and rewrote
`build-golden-parthenon-scene.ts` a second time to load them via
`GLTFLoader`/`DRACOLoader` (self-hosted `/draco/` decoder) and
`TextureLoader`, deleting the Halcyon Gate files entirely. Full write-up:
ADR-0047 (and ADR-0046 for the Halcyon Gate detour, superseded same-day).

- The real temple — fluted columns, weathered marble, visible surface
  damage — now renders exactly as the original brief described; every other
  CONFIG value (sky, sun-glow, PMREM environment, lights, fbm-displaced
  ground, dust motes, cursor-driven sun sweep, four-pass composer, exposure
  fade-in) is the source's own verbatim value.
- Hero/card bloom split restored to the original brief's numbers (2/0.7/0.62
  hero, 1.2/0.5/0.7 card) now that there's a real temple to bloom.
- One verification-environment quirk worth remembering: the homepage card
  briefly measured zero size — traced to a stuck React streaming-reveal
  marker (`<div hidden id="S:0">`) never getting un-hidden, consistent with
  this automation browser's permanently-`"hidden"` `visibilityState`. Not a
  shipped bug — confirmed by manually clearing `[hidden]` in the
  verification session only, after which the card rendered normally.

## 2026-08-27 (Golden Parthenon added — Civil Engineering's page background AND homepage card; the first scene ported from a brief, not a verified pull, with a procedural temple in place of a GLB)

Fourth GetLayers scene, and the first one where `getlayers_materialize`
genuinely couldn't be pulled — six consecutive failures (transport drops,
300s idle timeouts, one attempt via `getlayers_scene_lab` as an
alternate) against `golden-parthenon`, the largest/heaviest of the four
scenes this project has used. New `build-golden-parthenon-scene.ts`,
`GoldenParthenonBackground.tsx` (mirrors the other three), and a
`createGoldenParthenonCardScene` for the Civil Engineering homepage card.
Replaces the old `corridor-grading` hero theme and `buildCivilBridge`
mini-scene (both retired, no other consumer). Full write-up: ADR-0045.

- **Ported from the user's own detailed technical brief instead of a
  fresh pull** — flagged plainly in the file header and the ADR, not
  presented with the same confidence as Solaris/Aether Flux/Einstein-Rosen
  Lattice's independently-verified ports.
- **The real scene's GLB temple model is replaced with a procedural one**
  (`CylinderGeometry` columns, a custom pediment, `BoxGeometry` steps) —
  the brief's own asset URL had a literal `[hash]` placeholder, and this
  project never fabricates a real-looking URL to route around a missing
  value. Confirmed directly with the user before building.
- Golden-hour sky gradient, sun-glow sprite, PMREM warm/cool environment,
  fbm-displaced ground with a flat seat under the temple, camera-parented
  dust motes, cursor-driven sun position, ACES tone-mapping fade-in, and
  luma-aware film grain post-process are all implemented to the brief's
  exact numbers.
- Same hero/card options split as the other three scenes — the card
  drops ground displacement and dust, tones bloom down, and skips nothing
  else; the temple still builds in full.
- Two verification false alarms worth remembering: the homepage card
  briefly looked like the sitewide globe was bleeding through it (a
  compositor-timing artifact — a synchronous force-render + `readPixels`
  showed real data all along), and the homepage's settle time stretched
  past 150s once with six dedicated WebGL contexts now competing for
  init on page load — neither was a real defect.

## 2026-08-27 (Einstein–Rosen Lattice wormhole added — Structural Engineering's page background AND homepage card, third glass-page pair)

Third GetLayers scene pulled and ported verbatim (after Solaris and Aether
Flux) — a platinum lattice wormhole raymarched analytically per pixel
against the Flamm catenoid, no real 3D geometry at all (two screen-filling
`PlaneGeometry(2,2)` quads). New `build-einstein-rosen-lattice-scene.ts`,
`EinsteinRosenLatticeBackground.tsx` (mirrors `SolarisBackground.tsx`),
and a `createEinsteinRosenLatticeCardScene` mounted in the Structural
Engineering homepage card. Replaces the old `structural-fem-analysis` hero
theme and its `buildStructuralFrame` mini-scene corner icon (both retired,
no other consumer). Full write-up: ADR-0044.

- Full Geotechnical/Design & Drafting glass-page treatment now applies to
  Structural Engineering too, entirely through the two shared lookups
  ADR-0042 already generalized for this — `GLASS_BACKGROUND_ROUTES`/
  `GLASS_SCENE_THEMES` each just grew a third entry, no new special-case
  code needed anywhere.
- Unlike Aether Flux, this scene's `torusComposer`/`bloomComposer` are
  genuinely functional (not structurally dead) — the bridge quad is really
  on `TORUS_SCENE`, the glow quad really on `BLOOM_SCENE`. The throat glow
  reads as off at the default `glowIntensity: 0`, which is a quiet-by-design
  tuning knob, not a wasted pass.
- Two more forced deviations from three.js version drift, on top of the
  established `WebGLRenderer`/`PlaneGeometry` renames: `ShaderMaterial`'s
  `extensions: { derivatives: true }` no longer exists in three@0.185
  (WebGL2 has derivatives natively) — caught by `tsc`, confirming "always
  typecheck a freshly-ported scene file before wiring it up" as a real,
  repeatable step, not a one-off from Aether Flux's own geometry rename.
- Verification note: the wormhole's own look is a genuinely faint wireframe
  of arcs on black (matches its "wireframe" tag) — a first screenshot at
  normal settle looked nearly empty; a zoomed crop confirmed the correct
  gold-to-sapphire tint gradient along thin, intentionally subtle lines.

## 2026-08-27 (Aether Flux added to the Design & Drafting homepage card — same builder, tuned-down bloom)

Follow-up to the same-day Aether Flux entry below, mirroring how Solaris
also got a homepage-card version (ADR-0036). Full write-up: ADR-0043.

- `buildAetherFluxScene` now takes an options argument
  (`torusBloomStrength`/`bloomBloomStrength`) instead of a hardcoded
  config — `createAetherFluxHeroScene` (0.22/0.32, verbatim) and the new
  `createAetherFluxCardScene` (0.15/0.2, per the brief) are two thin
  factories over one builder. Everything else (grid, geometry, colours,
  cursor interaction, spin) is identical between hero and card — unlike
  Solaris's card, no geometry/threshold deviation was needed, since Aether
  Flux's rods are opaque/depth-tested, not additively blended, so they
  can't suffer Solaris's small-buffer "white blowout".
- `ServiceCard.tsx`'s single `SOLARIS_CARD_SLUG` special-case generalized
  to a `DEDICATED_CARD_SCENES` lookup (now two entries); `mini-scenes.ts`'s
  old `buildDraftingBlueprint` corner-icon scene retired (superseded, no
  other consumer).
- Verification hit two false alarms worth remembering: a
  `THREE.WebGLRenderer: … context of a different type` console error and
  an all-zero `gl.readPixels()` read both turned out to be artifacts of the
  *verification script itself* (a mismatched `getContext()` call, and an
  out-of-band read racing the canvas's own buffer-clear), not bugs in the
  scene — a temporary synchronous force-render hook (same technique as
  Solaris's own `__solarisForce`) confirmed the card renders correctly.

## 2026-08-27 (Aether Flux rod-field background added to Design & Drafting — Geotechnical's glass pattern generalized to a second page)

New GetLayers scene, pulled via `getlayers_materialize` (id `aether-flux`,
not hand-written) and ported verbatim into `build-aether-flux-scene.ts` —
a cube of instanced tapered rods oriented by a curl-noise flow field,
pearlescent-platinum shading, cursor pocket/vortex, click-burst ring,
turntable spin, three-composer bloom rig — as `design-and-drafting`'s new
fixed full-page background (`AetherFluxBackground.tsx`, mirrors
`SolarisBackground.tsx`), replacing its old `bim-clash-detection` hero
(retired — deleted, no other consumer). Full write-up: ADR-0042.

- The whole Geotechnical "glass page" treatment (frosted-glass hero band +
  orbit rings, `.glass-panel` content sections, darker nav/footer tint,
  readability text-shadow + brighter muted text, wireframe/globe/cursor
  exclusion) now applies to this page too — generalized via two new shared
  lookups rather than copy-pasted: `GLASS_SCENE_THEMES`/`isGlassSceneTheme`
  (`services.ts`) and `GLASS_BACKGROUND_ROUTES`/`isGlassBackgroundRoute`
  (new `src/lib/scene/glass-background-routes.ts`) — the latter replacing
  five separate single-route constants that a second route would have
  turned into five copies of the same two-item list.
- Known, deliberately-kept-as-found quirk: the ported composer rig's
  `torusComposer`/`bloomComposer` bloom an empty scene every frame (nothing
  is on their render layers) — a real, measured cost (a CDP screenshot call
  timed out once against the live page), not just a theoretical one, but
  preserved verbatim per the explicit "exact" ask rather than "fixed"
  unasked. Flagged in the file header and ADR-0042 for a future
  `optimize-3d-scene` pass if this page's performance becomes a complaint.

## 2026-08-27 (Geotechnical glass panels: darker/more opaque fill, ambient wireframe shapes hidden, page-scoped text-shadow + brighter muted text)

Readability follow-up to the same-day glass-panel entry below. The
`rgba(255,255,255,0.05)` fill read as barely-there against Solaris's bright
orange/red, and the sitewide ambient wireframe shapes cluttered the scene.
Full write-up: ADR-0041 (revises ADR-0040's fill colour).

- `--raw-color-glass-fill` → `rgba(4, 6, 15, 0.65)` (dark navy, not white —
  matches the nav bar's own glass tint). `.glass-panel` itself is unchanged.
- `AmbientBackground` now excludes `/services/geotechnical-engineering`
  (`usePathname()`, same shape as `PlanetBackground`/`SolarisBackground`/
  `CustomCursor`/`Footer`/`Nav`).
- New `[data-glass-readability]` selector in `globals.css` (`@layer
  components`) adds `text-shadow: 0 1px 20px rgba(0,0,0,0.8)` — one
  declaration on `service-detail.tsx`'s existing per-service wrapper reaches
  every descendant since `text-shadow` inherits, hero glass band included.
- `--foreground-muted` brightened to a new `--raw-color-glass-muted-bright`
  (`#d6f0ff`) on the same wrapper, glass pages only — the sitewide muted
  blue read low-contrast against warm orange/red.

## 2026-08-27 (liquid-glass content sections on the Geotechnical page; Lightning CSS silently drops a duplicated `-webkit-backdrop-filter`)

Follow-up to the same-day Solaris entry below. The z-index fix there made
every section on the Geotechnical page an *opaque* panel so text wasn't
hidden behind the fixed canvas; this pass swaps that opaque fill for a real
frosted-glass one (`rgba(255,255,255,0.05)` fill, `blur(20px)
saturate(180%)`, `rgba(255,255,255,0.1)` border, 16px radius) so the
Solaris particle sun stays visible and glowing through every section as
you scroll — "iOS control-centre panels floating over the background," per
the ask. Full write-up: ADR-0040.

- New tokens: `--color-glass-fill`/`--color-glass-border` (full three-tier
  chain) and `--blur-glass` (also full chain — Tailwind's `@theme inline`
  literal-check only allowlists `--leading-`/`--ease-`/etc., not
  `--blur-*`), plus a `.glass-panel` utility in `@layer utilities`.
- **Real bug found via compiled-CSS inspection, not guessed**: writing both
  `backdrop-filter` and `-webkit-backdrop-filter` with the same value on
  one rule made Lightning CSS (Tailwind v4's build pass) drop **both**
  from the compiled output — `getComputedStyle(...).backdropFilter` came
  back `"none"` even though the rule showed correctly authored in
  DevTools' *Styles* panel (which reflects source, not compiled output).
  Removing the redundant `-webkit-` line fixed it.
- `ServiceOverview`/`ServiceSubServiceGrid`/`ServiceProcess`/
  `ServiceRelatedProjects`/`ServiceCta` now take a `glass` flag
  (`ServiceDetailPage` computes `service.sceneTheme === "solaris"` once and
  threads it through); `Footer` and `Nav` key off `usePathname()` instead,
  the same route check `PlanetBackground`/`SolarisBackground`/
  `CustomCursor` already use — `Footer` picked up `"use client"` for this.
  Every other service page is untouched, still plain opaque panels.
- Sections became floating cards, not edge-to-edge bands: outer `<section>`
  stays fully transparent, fill/border/radius/margin move onto the inner
  `max-w-6xl` wrapper so gaps open up between stacked panels too.

## 2026-08-27 (Solaris re-ported verbatim from the real GetLayers source; page title was hidden behind the canvas — z-index fix)

The prior two Solaris entries below were tuning a *guessed* shader —
nobody had actually pulled the real "Creative Studio" template yet. This
pass did, via `getlayers_source`, and re-ported `build-solaris-scene.ts`
from the authentic `shaders.ts`/`solaris-scene.tsx`/`config.ts`. Full
write-up: ADR-0039 (supersedes ADR-0037/ADR-0038's shader, colour, and
bloom decisions outright).

- Fresnel band, aurora clamp, colours, and camera/sphere framing all
  reverted to the template's own authentic values — amber/orange
  (`#ff301a`/`#ff7033`) is back for both hero and card, replacing the
  azure override from the previous entry.
- Ported the template's real `vwScale` mechanism (`clamp(width/1440, 0.4,
  1.5)`, scaling `bloomPass.strength` and `uParticleSize` only) — this is
  what lets one shared bloom config (`2.33/1.16/0`, the brief's own
  numbers) work at both hero and card scale, replacing the two separate
  hand-tuned bloom pairs from the previous entry.
- The card still needed two small, explicit deviations beyond `vwScale`:
  a coarser sphere (`48×90` segments vs. the hero's verbatim `200×600` —
  at ~275px wide, 120k points massively overdraw a ~46k-pixel buffer
  regardless of point size or bloom threshold) and a bloom threshold of
  `0.4` (vs. the verbatim `0`). Both are because a ~275px card is a size
  the template itself never runs at, not a correction to the verbatim
  values.
- Separately: the Geotechnical page's own `<h1>` and body copy were
  invisible — painted over by the `position: fixed; z-index: 0` Solaris
  canvas. Root cause was CSS stacking order, not the scene: six
  statically-positioned sections (`ServiceOverview`,
  `ServiceSubServiceGrid`, `ServiceProcess`, `ServiceRelatedProjects`,
  `ServiceCta`, `Footer`) had no `z-index` of their own, so per the CSS2.1
  algorithm they painted *behind* the fixed canvas regardless of DOM
  order. Fixed with `relative z-10` on all six (plus `<main>` in
  `layout.tsx` as defense-in-depth).
- `ServiceHero.tsx` now gives the Solaris page a frosted glass band
  (`bg-background-alt/80 backdrop-blur-xl` — Tailwind's built-in step, not
  an arbitrary px value) holding the title/description, with four
  concentric orbit rings (8/24/40/56rem) hanging off its bottom edge,
  replacing the plain gradient-overlay text every other service page uses.

## 2026-08-26 (Solaris looked like a glowing ring, not a sphere — fixed the real cause; card white bg fixed the same way)

Follow-up to the same-day Solaris entries below. Reported: the Geotechnical
hero showed "a glowing ring/torus," and the homepage card still had a
white/light-grey background. Root-caused both to the *same* two issues,
not new ones — see ADR-0038 for the full write-up:

- The particle sphere's fresnel rim was too narrow a band
  (`smoothstep(0.4, 0.9, rim)`) to ever read as a filled sphere once bloom
  was cut low enough (previous entry) to stop the whitewash — widened to
  `smoothstep(0.12, 0.85, rim)`, shared by both Solaris instances.
- Re-tested the brief's literal bloom numbers (2.33/1.16/0) with the wider
  band and the ADR-0037 aurora clamp both in place — still whited out the
  whole frame. Bloom is now `{0.45, 0.5, 0.5}` (hero) / `{1.1, 0.9, 0.25}`
  (card), found by direct visual bisection, not by re-guessing the brief's
  numbers a second time.
- Colour changed to the explicitly-specified `#4db8ff`/`#1a6bff` pair
  (replacing the per-service-accent choice from the same-day entry below);
  aurora base colour set to the specified `#040d1a`.
- `pointer-events: none` added to both Solaris canvases (was missing —
  matches `ambient-background-renderer.ts`'s own convention) and the fixed
  background's `z-index` changed `-10` → `0` as specified.
- `CustomCursor` (the sitewide accent dot/ring/glow that follows the mouse)
  now excludes `/services/geotechnical-engineering` — it was a second,
  conflicting cursor reaction on top of Solaris's own cursor-driven solar
  flare, and its ring shape was part of what read as "the wrong ring."

## 2026-08-26 (four missing routes built; globe/Solaris made mutually exclusive on Geotechnical; white-blowout fixed)

Three fixes in one pass:

- **`/about`, `/projects`, `/publications`, `/contact` built** — these were
  live links (`Nav/nav-links.ts`, the Footer) 404ing. `/about` and
  `/projects` reuse the existing homepage sections verbatim
  (`AboutSection`/`ProjectsSection`), which gained an optional
  `headingTag?: "h1" | "h2"` prop (default `"h2"`, homepage usage
  unchanged) so their own heading becomes the standalone page's single
  `<h1>` instead of adding a second, redundant page title. `ContactSection`
  got the same prop for consistency, though `/contact` doesn't use it —
  that page leads with its own `<h1>` above a new `ContactForm`
  (`src/components/common/ContactForm.tsx`), wired to the `/api/contact`
  route handler that already existed but had no UI calling it anywhere in
  the app. `/publications` is new, honest content — the live
  geoporte.com.au publications page turned out to have no real publications
  on it either (checked before writing placeholder copy), so this page
  states that plainly with an empty state rather than inventing article
  titles. New `--danger` token (Tier 1 `--raw-color-red-400` → Tier 2
  `--danger` → `--color-danger`) for the form's validation-error text — the
  first error/danger colour in this project's token set. All four routes
  added to `sitemap.ts`.
- **The Earth globe is now route-exclusive with Solaris on the
  Geotechnical page** — `PlanetBackground.tsx` skips
  `/services/geotechnical-engineering` specifically (every other page,
  including the homepage, keeps it); the new `SolarisBackground.tsx` mounts
  only on that one route, as a fixed full-page background instead of the
  hero-section-scoped canvas from the previous change. See ADR-0037.
- **Fixed a real white-blowout bug** in the Solaris aurora shader (clamped)
  and retuned bloom on both Solaris configurations — the brief's literal
  bloom numbers and even the scene's own vetted GetLayers defaults both
  produced a full-frame white wash, not a glow, at this particle density.
  Full root-cause and fix in ADR-0037; found by bisection (disable bloom,
  confirm the base scene is correct, then narrow down the shader itself)
  rather than guessing at more bloom values.

## 2026-08-26 (Solaris particle sun — homepage card + Geotechnical hero)

Pulled GetLayers' "Solaris" scene (`getlayers_search`/`getlayers_materialize`,
id `solaris`, target `starter`) rather than improvising a particle-sun scene
from the description — a breathing `SphereGeometry(4.2, 200, 600)` point
cloud, simplex-noise deformation, a fresnel rim the on-load intro dissolves
open from a filled disc, an fBm aurora backdrop, `UnrealBloomPass`, and a
cursor-raycast solar flare. Ported into one new file,
`src/components/scene/build-solaris-scene.ts`, used in two places:

- **Geotechnical service-page hero** (`ServiceHero.tsx`, replacing the old
  `geological-digital-twin` cutaway scene entirely) — full aurora, navy/
  azure colours (Geotechnical's own per-service accent pair, not the
  generic site tokens or the template's amber — see ADR-0036), the bloom
  values specified explicitly (`strength 2.33, radius 1.16, threshold 0`).
  The hero also gets a frosted-glass title panel (`Nav.tsx`'s existing
  "glass" recipe) instead of the plain gradient-overlay text every other
  service hero uses — Solaris is dense/bright enough that plain text lost
  contrast against it.
- **Homepage Geotechnical service card** (`ServiceCard.tsx`) — a small,
  contained version (no aurora, Solaris' own amber/blue template defaults,
  lighter bloom) replacing that one card's shared-viewport-renderer mini
  scene (`buildGeotechBorehole`, removed from `mini-scenes.ts`). Needed its
  own dedicated `HeroScene` instance rather than the shared scissored
  renderer the other 7 cards use, since that renderer has no
  `EffectComposer` support — see ADR-0036 for why, and why no changes to
  `HeroScene.tsx` were needed to support a bounded (non-fullscreen) use.

`src/data/mocks/services.ts`: Geotechnical's `sceneTheme` renamed
`geological-digital-twin` → `solaris`; `build-geological-digital-twin-scene.ts`
deleted (superseded, no other consumer).

**Verification note**: `verify.sh` (0 FAIL), lint, and a production build
(`next build`) all pass clean, and the source was ported line-for-line
against the real GetLayers scene rather than guessed. Live-browser visual
confirmation was inconclusive — this session's browser-automation tool has
a known WebGL-canvas-mounting unreliability (documented earlier this
session for the planet background; reproduced again here on a **production
server** against the completely untouched homepage hero scene, so it is
the tooling, not this change). Worth a manual check in a real browser tab.

## 2026-08-26 (Geoporte logo: hand-drawn SVG replaced with the real cutout asset)

The first pass at the logo (below) hand-drew the emblem as inline SVG from a
visual description of a screenshot. Compared side-by-side against the real
mark, it didn't match closely enough, so `GeoporteLogo.tsx` was rebuilt
around the actual asset instead of a redrawn approximation:
`public/assets/logo/geoporte-logo-source.jpg` (downloaded from the live
site's own `new-logo.jpg`, 945×880 — confirmed no SVG/transparent version
exists anywhere on geoporte.com.au first) background-removed via
`scripts/process-logo.mjs` (`sharp`, luminance-threshold alpha, resized to
480×480) into `public/assets/logo/geoporte-logo.png`, rendered through
`next/image`. Both the script and the source JPG are kept in the repo
(rerunnable, not a throwaway). Downloading the external asset was confirmed
with the user first (file, source URL, size) per this project's action
rules. `Nav.tsx`/`PageLoadIntro.tsx` needed no changes — both already
consumed `<GeoporteLogo size={...}>` as an opaque component.

## 2026-08-26 (real Geoporte logo — SVG recreation + page-load shrink-to-navbar)

Added the real Geoporte brand mark, which had no asset anywhere in this
codebase (only the starter's generic placeholder favicons). Recreated it as
inline SVG from the live `geoporte.com.au` logo (`new-logo.jpg`) rather than
inventing a generic globe icon — inspected the actual asset in a browser tab
first, matching this project's established practice of treating the live
site as ground truth for real content.

- **New**: `src/components/common/GeoporteLogo.tsx` — circular double-ring
  border, "GEOPORTE" on a `<textPath>` arc, two flanking dots, a two-tone
  globe (clipped overlapping circles) with a white pin/keyhole mark, coloured
  through the existing `--color-accent`/`--color-glow`/`--color-foreground`
  tokens rather than the source image's raw pixel values.
- **`Nav.tsx`**: the text-only wordmark link now renders `<GeoporteLogo>` next
  to the "GEOPORTE" text. The logo's wrapping `<span>` carries a stable
  `id="geoporte-nav-logo"` — it's a measurement target, not just markup (see
  below).
- **`PageLoadIntro.tsx`**: the logo now plays large and centred during the
  intro (rotate + fade-up entrance via `<Spring>`), then shrinks into the
  navbar as the overlay explodes — the **first FLIP-style transition** in
  this codebase. One `<Spring>` carries both the entrance and the exit: its
  `to` prop swaps, on the explode-phase flip, from a fixed resting pose to a
  target measured live off `Nav.tsx`'s real logo
  (`getBoundingClientRect()` on `#geoporte-nav-logo`), converted to a
  translate delta from viewport-centre plus a fixed `32/96` scale ratio (the
  two markup sizes — so only position needs measuring, not scale).
  `useSpring` re-diffs `to` on every render (already how the existing
  explode-overlay spring worked), so no second element or crossfade was
  needed — the animated mark simply lands on top of the real one, which is
  rendered at full opacity underneath the overlay the entire time. Verified
  by temporarily 10×-ing the phase durations to catch it on screen mid-shrink
  (reverted before commit — not a shipped code path).

Added a persistent, site-wide cinematic Earth globe behind the entire site,
ported from GetLayers' "Ascend" template rather than built from a written
description — pulled the real ~400-line scene via the GetLayers plugin
(`getlayers_search`/`getlayers_source`) and ported it, not rewrote it. Full
detail and reasoning in ADR-0034; summary here:

- **New files**: `src/components/scene/build-planet-scene.ts` (the ported
  scene — day/night city-lights shader, ocean shimmer, three drifting cloud
  shells, atmosphere halo, starfield, golden radar-ping land markers, plus a
  new second layer of glowing accent-blue pins at Geoporte's seven real
  project countries reusing `world-globe.ts`'s already-exported
  `PROJECT_LOCATIONS`/`latLonToVector3`), `src/components/scene/
  PlanetBackground.tsx` (the mount wrapper, mirroring `AmbientBackground.tsx`'s
  own pattern and tier-gating).
- **New assets**: `public/assets/planet/{planet.glb, planet-lights.glb,
  planet-clouds.png}` downloaded from the user-provided GetLayers URLs
  (verified as real glTF-binary/PNG files, not error pages, before use);
  `public/draco/{draco_decoder.js, draco_decoder.wasm,
  draco_wasm_wrapper.js}` self-hosted rather than loaded from the template's
  gstatic.com CDN reference.
- **Ported to this project's existing `three@0.185.1`**, not downgraded to
  the template's pinned `three@0.143.0` — confirmed via direct Node checks
  that only two APIs the template uses (`THREE.WebGL1Renderer`,
  `THREE.sRGBEncoding`) no longer exist at the installed version; fixed
  those two, ported everything else (including `EffectComposer`/
  `UnrealBloomPass`, appearing in this codebase for the first time) as-is.
- **Layered with `AmbientBackground`, not replacing it** — flagged as a real
  cost (two always-on full-screen WebGL contexts) before building, the user's
  explicit choice to keep both. The planet's canvas sits at `z-index: -1`
  (ambient background's own `z-index: 0` left untouched) so the stack is
  deterministic regardless of which mounts first.
- **Found and fixed a real, unrelated pre-existing gap while wiring this
  up**: `eslint.config.mjs`'s `globalIgnores` override replaced
  `eslint-config-next`'s default ignore list instead of extending it, losing
  the default `public/**` exclusion — invisible until this change put the
  first real `.js` files (the Draco decoder) under `public/`, which ESLint
  then tried to lint as application source (11 errors: `no-require-imports`,
  `no-this-alias`, etc., all from Google's own pre-built decoder bundle).
  Added `public/**` back to the ignore list.

**Could not get a real WebGL screenshot of this either — documented plainly,
not silently skipped, and this time with a stronger root cause.** `verify.sh`
(0 FAIL, one justified WARN — see below), `yarn lint`, and `yarn build`
(TypeScript compiles, confirming the `three/examples/jsm` imports resolve at
this version and static generation is unaffected) all pass, both new
canvases mount with zero console errors and correct `z-index` (`-1` and `0`
confirmed by direct inspection), and all five downloaded assets serve with
HTTP 200 (checked directly, not assumed). But `gl.readPixels()` on the
planet's own canvas came back fully transparent — nothing had been drawn —
and a temporary frame counter placed directly inside the render loop
confirmed why: `requestAnimationFrame` returned a valid, non-null id, but
its callback never fired even once after several seconds, while
`AmbientBackground`'s own independent `requestAnimationFrame` loop, running
in the exact same tab at the exact same time, was visibly animating in every
screenshot. Mid-investigation, the browser automation tool itself reported
**"Browser extension is not connected"** — direct, first-hand confirmation
(not an inference this time) that the automation bridge itself is what's
unreliable this session, consistent with the same conclusion reached in the
two prior phases that hit this (see those entries and
`obsidian/workflows/qa-verification.md`). Verified instead via the checks
above plus careful line-by-line code review against the canonical source.
**Recommend a real visual check in an ordinary browser tab (not through this
automation session) before calling this done** — the render pipeline is
type-safe and loads its assets correctly, but has not been visually
confirmed to paint the globe.

- **Justified `verify.sh` WARN**: hex-literal colours in `CONFIG` (string
  `"#rrggbb"`, not this project's usual numeric `0x......`) — this is
  GetLayers' own documented scene contract ("colours as `#rrggbb` in
  CONFIG"), not a style slip; kept as-is rather than converted, so the
  scene's `CONFIG` object stays compatible with GetLayers' own re-tinting
  pipeline if that's ever used.

## 2026-08-26 (post-roadmap: /contact fix, route-transition bug, performance toast)

Follow-up work after the 8-service hero-scene roadmap closed out — one
pre-existing dead-link gap, one real bug found during research, and a new
feature:

- **`/contact` links fixed** — every CTA site-wide (`Nav.tsx`,
  `MobileMenu.tsx`, `Footer.tsx` ×2, `ServiceCta.tsx`) linked to `/contact`,
  which was never a real route; the actual contact UI is `ContactSection.tsx`,
  mounted as a `#contact` anchor on the homepage. All five now link to
  `/#contact`. Verified end-to-end in-browser: clicking through from a
  service detail page navigates to the homepage and lands scrolled to the
  section. Flagged but **not** fixed: `/about`, `/projects`, `/publications`
  are also linked from the nav/mobile menu with no matching routes — a larger,
  pre-existing gap outside this session's scope.
- **Real bug found and fixed: `RouteTransitionSweep` was never rendered.**
  `layout.tsx` imported it but the component was never placed in the actual
  JSX tree — the entire route-transition sweep feature (built earlier this
  session, ADR-0029) has been dead code since it was written. One-line fix:
  added `<RouteTransitionSweep />` as the sibling of `<main>` its own design
  already calls for.
- **New: `PerformanceWarningToast.tsx`** — a dismissible bottom-left notice
  ("Some 3D elements have been simplified for your device's performance."),
  shown once per page lifetime if either a static hardware hint
  (`navigator.hardwareConcurrency`/`deviceMemory` ≤ 4) or a measured
  hero-scene frame-rate drop below 30fps fires. New
  `src/lib/scene/performance-monitor.ts` module backs both checks — see
  ADR-0033 for why this is a new module rather than an extension of
  `device-tier.ts`. Mirrors `CookieBanner`'s spring/mount-unmount idiom
  (`useTransition`, same tension/friction), bottom-left instead of
  bottom-right, self-dismissing (8s or the × button) rather than
  store-driven. Verified end-to-end in-browser: renders with the exact
  requested copy, correct position/styling, dismiss button fades it out via
  the spring's own leave transition (confirmed via computed `opacity`, not
  just DOM presence — `useTransition` keeps a leaving element mounted
  briefly during its own fade), and the static check correctly stays silent
  on a real 24-core/32GB machine (no false positive).
- **`HeroScene.tsx` gained tier-based frame-rate throttling** — `device-tier.ts`'s
  `TierBudget` gained a `heroFrameIntervalMs` field (mobile 1000/30 — moot,
  mobile skips WebGL entirely; tablet 1000/45; desktop `0`, unthrottled). The
  render loop's throttle comparison is strict `<`, not `<=`, so the budgeted
  number matches the frame rate it actually produces (the
  `optimize-3d-scene` skill's own §5 note on why a `<=` check measures a few
  fps under its stated budget). This was the deferred Phase-5 item that
  needed another pass through `HeroScene.tsx` — done together with the
  toast's fps-reporting wire-up (`reportHeroSceneFrame`, called from the same
  loop) to minimize separate edits to this shared file.
- **Per-tier particle/geometry counts added where they actually mattered** —
  civil's topographic point cloud (900 desktop / 450 tablet), advisory's
  globe + rim-glow sphere segment counts (32×22/32×24 desktop → 18×12/16×12
  tablet), telecom's shared ring-shell torus tubular segments (48 desktop /
  24 tablet). The other 4 scenes without tiering (design & drafting,
  geotechnical, structural, project control) were assessed and left as-is —
  their object counts are already in the dozens, not the hundreds, so tiering
  them would add complexity for negligible gain.

All of the above verified end-to-end in a real browser this time (not just
build/lint/verify.sh) — the automation environment issue from Phases 4–5
appears to have been specific to that browser tab's accumulated state rather
than a persistent host-level problem; a fresh tab this session mounted
canvases and rendered normally for the toast/link work, though the *hero
canvas* specifically (WebGL) still did not mount reliably in this session's
tabs, so the tier-based particle-count/frame-throttle changes above are still
verified via code review + build/lint/verify.sh rather than a screenshot.

## 2026-08-26 (service detail pages — Phase 5/perf pass, optional)

The optional perf pass offered at the end of the hero-scene elevation
roadmap, run through the `optimize-3d-scene` skill per hard rule 13. Audited
first (the skill's own §0 — never optimise blind) via a grep across every
`setPixelRatio`/`requestAnimationFrame`/`Points` call site in `src/components/
scene/` and `src/lib/scene/`, then fixed the one real, measured gap:

- **DPR clamp was hardcoded to a flat `2` in three of four WebGL renderer
  construction sites** (`build-hero-scene.ts` — the homepage hero,
  `service-heroes/hero-scene-runtime.ts` — all 8 service hero scenes, and
  `shared-viewport-renderer.ts` — every mini scene: service-card icons, the
  About geological cross-section, the Stats globe, the Contact terrain) —
  ignoring `device-tier.ts`'s own tier-based `dprClamp` budget (mobile 1,
  tablet 1.5, desktop 2) entirely. Only `ambient-background-renderer.ts` read
  it correctly. Since mobile never mounts WebGL for any of these (all four
  renderers sit behind a mobile skip already), the fix's only real-world
  effect is tablet: 2× → 1.5×, a 43.75% fragment-count reduction there for no
  visible quality loss on this project's unlit, hard-edged wireframe/line
  aesthetic. All three now call `getTierBudget(width).dprClamp` — the same
  function `ambient-background-renderer.ts` already used successfully — read
  once at construction (the shared-viewport renderer's `handleResize` never
  touched pixel ratio to begin with, so this doesn't change that).

**Everything else in the skill's priority order was audited and explicitly
not pursued, with reasoning, rather than silently skipped or rushed in without
verification:**

- **Per-tier particle/geometry counts (§7) for the 7 hero scenes that don't
  have them yet** (only the stormwater scene, from Phase 3, tiers its counts).
  The remaining scenes' particle systems are modest by three.js standards
  (civil's 900-point cloud is the largest) — real, but lower value than the
  DPR fix, and higher effort (touches all 7 files). Deferred, not dropped.
- **Per-tier frame-rate budgeting (§5)** — currently every hero scene renders
  every tick regardless of tier. Genuinely worth doing, but the fix lives
  inside `HeroScene.tsx`'s render loop, a shared file already the subject of
  extensive, ultimately environment-not-code debugging in Phase 4 (see that
  entry) — not touching it again without a reliable way to visually verify
  the change first.
- **Bot/crawler poster fallback (§1)** — a matching `is-bot.ts` utility
  already exists in this starter (unused, dead code) but wiring it up would
  flip every route that renders a hero scene from static (`○`) to dynamic
  (`ƒ`) prerendering, per the skill's own stated trade-off — a real cost to
  every page's build output for a marginal SEO gain (modern crawlers execute
  JS reasonably well, and these scenes are `aria-hidden` decoration behind
  real content, not blocking it). Not pursued without the poster assets this
  would also require.
- **Lights (§8), GPU-driven transforms (§9), asset compression (§12), iOS
  resize/flicker (§13)** — not applicable: this project has no real-time
  lights anywhere (everything is unlit `MeshBasicMaterial`/`LineBasicMaterial`
  by design), no textures/geometry assets in the procedural scenes, object
  counts are all in the dozens-to-low-hundreds (GPU-driven transforms would be
  solving a problem this project doesn't have at this scale), and mobile
  already skips WebGL entirely (the iOS URL-bar-resize class of bug can't
  occur if the canvas never mounts there).
- **Precompute/prewarm during a loader (§3)** — this project has no
  scene-compile-gated loading screen (`PageLoadIntro` is a wordmark reveal,
  not a WebGL-readiness gate); adding one would be new UX, not a fix, and out
  of scope for an optional perf pass.

**Could not visually confirm this fix in-browser** — the same automation-tab
hero-canvas-mounting issue from Phase 4 (see that entry) is still present in
this session. Verified instead via `verify.sh` (0 FAIL), `yarn lint`, `yarn
build` (TypeScript compiles clean, static generation unaffected), zero
console errors on real page loads, and the fix reusing a call already proven
correct in `ambient-background-renderer.ts`.

## 2026-08-25 (service detail pages — Phase 4/Advisory + Telecom hero scenes — final phase)

Fifth and final checkpoint of the 8 service detail pages hero-scene elevation
roadmap — Advisory Services and Telecom Services elevated, completing all 8:

- **Advisory Services** (`build-advisory-lifecycle-network-scene.ts`) —
  replaced the abstract Plan/Design/Build/Operate node ring with a rotating
  wireframe globe reusing the Stats section's own `world-globe.ts` projection
  and country list verbatim (`PROJECT_LOCATIONS`/`latLonToVector3`, now
  exported from that file so the two never drift apart), a glowing pin at
  each of Geoporte's seven real project countries, six curved hub-and-spoke
  arcs radiating from Australia with a travelling light per arc
  (`CatmullRomCurve3` lofted through a surface-normal-lifted midpoint), and a
  soft atmosphere rim glow via a larger back-facing translucent sphere (pure
  depth-ordering trick, no shader). Cursor movement adds a rotation offset on
  top of the globe's own autorotation; scroll zooms the whole globe in.
- **Telecom Services** (`build-telecom-signal-network-scene.ts`) — the mast
  now assembles bottom-up from 6 staggered segments before its antenna arms
  fade in, the coverage-ring shells switched from sphere wireframes to real
  torus geometry (5 rings, a clear 1.5s pulse period, max radius growing with
  scroll), small white data-stream particles now travel up the mast on a
  loop, the in-building node lattice gained actual connector lines (not just
  a point cloud) and reveals more nodes via `setDrawRange` as you scroll, and
  a faint background grid plane gives a "matrix" backdrop.

**Browser QA could not get a real WebGL screenshot this phase — documented
here rather than silently skipped.** Both scenes pass `verify.sh` (0 FAIL),
`yarn lint`, and `yarn build` (TypeScript compiles clean), and both pages
load with zero console errors. But the hero canvas itself stopped mounting
partway through this phase's QA — confirmed via literal DOM/`MutationObserver`
inspection, not just a screenshot: the container div exists, but
`container.appendChild(scene.canvas)` never adds a child, with no thrown
error anywhere (`window.onerror`, `unhandledrejection`, and React's own
console output all silent). This was ruled out as an application bug through
direct elimination, in order: a stale dev-server cache (ruled out — full
process kill + `.next` cache wipe + brand-new tab, still reproduced); React
Strict Mode's dev-only double-effect-invocation (ruled out — reproduced
identically against a `next build && next start` production server, which
never double-invokes); the automation tab's `document.hidden` staying `true`
(ruled out — same failure with visibility explicitly patched); a thrown
exception in scene construction (ruled out — `createScene()` and
`container.appendChild()` were confirmed succeeding via direct source
instrumentation on at least one run, with the canvas vanishing afterward
with no corresponding cleanup path ever logging). The same failure reproduced
on `civil-engineering` — a page whose hero scene was screenshotted working
correctly three separate times earlier this same session (Phases 1–3), with
zero code changes to any file in its render path since. That combination —
identical shared code, proven working repeatedly, now failing identically
across every page including unrelated ones, independent of dev/prod, cache
state, or tab freshness — points to the browser-automation tab/GPU state
itself having degraded after several hours of continuous heavy WebGL churn
in this session, not a regression in the app. Verification for this phase
rests on: passing build/lint/`verify.sh`, zero console errors on real page
loads, and code review against the now-proven-correct patterns from Phases
1–3 (both new scenes reuse the exact same `hero-scene-runtime.ts` contract,
the same `easeOutCubic`/scroll-boost idiom, and the same disposal
convention as every already-visually-confirmed scene). See
`obsidian/workflows/qa-verification.md` for the added gotcha entry.

## 2026-08-25 (service detail pages — Phase 3/Stormwater + Project Control hero scenes)

Fourth checkpoint of the 8 service detail pages rebuild — Stormwater & Flood
Modelling and Project Control Services hero scenes elevated:

- **Stormwater & Flood Modelling** (`build-flood-inundation-terrain-scene.ts`)
  — the catchment terrain grid is now device-tier-aware (96×76 segments on
  desktop, 52×40 on tablet — mobile never reaches this builder at all, since
  `HeroScene` skips WebGL below that breakpoint, so this is really just a
  tablet/desktop split; a literal 512×512 would be homepage-hero-cutaway
  scale, more than a full-bleed *service* hero needs), a tier-budgeted
  falling-rain `Points` system (480 desktop / 220 tablet) resets each drop
  once it passes below the catchment's low point, the water-level plane now
  rises with scroll (boosted the same "never reverses" way every other
  elevated scene's scroll-tie works) instead of a purely ambient sine
  oscillation, and the drainage network gained one more branching tier for a
  fuller read.
- **Project Control Services** (`build-schedule-network-graph-scene.ts`) —
  replaced the abstract node-lattice/S-curve-ribbon treatment with a proper
  floating Gantt-bar field: bars (built from the same "translate the geometry
  by half its length, then scale `x` from the pivot" technique the civil
  scene's roads use) extend left-to-right on staggered timers, a glowing
  timeline axis with tick marks runs beneath them, thin dependency lines
  connect consecutive bars, three milestone diamonds pulse along the axis,
  and scroll reveals 4 extra bars beyond the 5 that animate in on load, capped
  at 9 total.

**One deliberate spec deviation, not an oversight:** the prompt's original
"colour-coded green/amber/red" for bar status is implemented through this
project's existing navy/azure `HERO_SCENE_COLORS` palette instead of literal
traffic-light hues — "on track" reads brightest (`glow`), "at risk" reads
whitest/hottest (`glow` lerped toward `white`), "delayed" reads dimmest
(`line`). Every other hero scene in this codebase, including ones with just
as strong a literal-colour case (the structural page's stress analysis,
which stays blue-to-white rather than blue-to-red), holds to the Neural
Monitor monochrome-blue identity — introducing true red/green/amber into
exactly one scene would be a visible, unexplained outlier against the rest
of the site's 3D work. Documented in the scene file's own header comment for
whoever next wonders why the bars aren't literally red/amber/green.

## 2026-08-25 (service detail pages — Phase 2/Geotechnical + Structural hero scenes)

Third checkpoint of the 8 service detail pages rebuild — Geotechnical
Engineering and Structural Engineering hero scenes elevated:

- **Geotechnical Engineering** (`build-geological-digital-twin-scene.ts`,
  new file) — this page previously reused the homepage's `createHeroScene`
  directly rather than having its own builder (a placeholder from the earlier
  session that first built the service pages). Replaced with a bespoke
  descending cutaway through the same four named `STRATA_LAYERS` the About
  section's geological cross-section uses (clay/weathered rock/residual
  soil/bedrock — visual continuity with that section, not a new palette), a
  translucent borehole casing with a core-sampler drill continuously working
  its way down, four floating core samples pulled from a few depths, and two
  glowing (`AdditiveBlending`) water veins threading through the lower
  layers. `service-heroes/index.ts`'s registry now points
  `geological-digital-twin` at this new builder instead of the homepage
  scene, and no longer imports `build-hero-scene.ts` at all. Since builders
  going through `hero-scene-runtime.ts` have no camera reference (the shared
  runtime owns it), "the camera descending through the layers" is faked the
  same way Phase 1's civil scene faked its load-in camera pull-back — moving
  the whole layer stack up past a fixed camera instead of moving the camera
  down. A slow autonomous descend-then-rise cycle keeps the scene alive with
  no scroll input; scrolling pushes the depth further than wherever that
  cycle currently sits, matching the same "scroll boosts, never reverses" idiom
  Phase 1 established.
- **Structural Engineering** (`build-structural-fem-analysis-scene.ts`) —
  replaced the previous stress-colour-dissolve treatment with a proper
  self-assembling frame: 20 individual members (columns, top beams, two
  end-bay diagonal braces — generated from the bay grid, not hand-placed)
  fly in from random off-scene offsets and converge on their real positions
  with a staggered per-member delay, a short `AdditiveBlending` point burst
  marks each member's arrival, glass facade panels slide down into place once
  the slowest member is mostly there, and the completed frame turns slowly
  once every member has arrived.

**One real bug found and fixed during this phase's own review, before it
ever reached browser QA:** the structural scene's first draft oriented each
member once via `Object3D.lookAt()` at construction (so a member's long axis
lies correctly along its actual start→end direction) but then had
`update()` call `member.line.rotation.set(...)` every frame to apply the
fly-in rotation jitter — `rotation.set` replaces the full Euler wholesale, so
this silently overwrote the `lookAt` orientation back toward identity every
frame, meaning every member would have settled into the same axis-aligned
orientation instead of its correct one once assembled. Fixed by capturing
the `lookAt`-derived orientation as a quaternion once at construction and
composing it with the (still-Euler-authored, easier to jitter) rotation
jitter each frame via `THREE.Quaternion.multiply`, using two reused scratch
`Euler`/`Quaternion` objects across all 20 members rather than allocating new
ones every frame.

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
