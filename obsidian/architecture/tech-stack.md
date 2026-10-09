---
tags: [architecture, stable]
updated: 2026-09-02
---

# Tech Stack

Every dependency in `package.json`, what it does, and why it is here.
Package name: `next16-claude-starter` · version `0.1.0` · private.

## Core framework

| Package | Version | Role |
|---------|---------|------|
| `next` | `16.3.1` | App Router framework. ⚠️ See warning below. |
| `react` / `react-dom` | `19.2.8` | UI runtime |
| `typescript` | `^5` | Type system — `any` is banned |

> [!warning] This is not the Next.js you may know
> `AGENTS.md` warns: APIs, conventions, and file structure may differ from older
> Next.js knowledge. Always check [[routing]] before writing routing code, and
> heed deprecation notices.

## Styling

| Package | Version | Role |
|---------|---------|------|
| `tailwindcss` | `^4` | Utility CSS — **no `tailwind.config.js`** |
| `@tailwindcss/postcss` | `^4` | PostCSS integration |

Tailwind v4 is configured entirely in `src/app/globals.css` via `@theme inline`.
See [[design-system]].

## Animation (the heart of the starter)

| Package | Version | Role |
|---------|---------|------|
| `@react-spring/web` | `^10.1.2` | Spring physics — drives **all** motion |
| `spring-text-engine` | `^0.1.5` | Scroll-aware spring text animation |

No `framer-motion`, no CSS transitions/keyframes. See [[animation-system]] and
[[text-engine]]. ADR: [[decisions-log]] ADR-0002.

## 3D — Geoporte hero + service scenes

| Package | Version | Role |
|---------|---------|------|
| `three` | `^0.185.1` | WebGL scene engine for the bespoke digital-twin hero and per-service scenes |
| `@types/three` | `^0.185.4` | Type definitions |

Added per project (ADR-0020 pattern) via GetLayers Scene Lab — see [[decisions-log]].
No separate packages for `three/examples/jsm/*` (`GLTFLoader`, `DRACOLoader`,
`EffectComposer`, `UnrealBloomPass`, `OrbitControls`, etc.) — they ship inside
the `three` package itself and are imported by subpath; the cinematic Earth
globe (see the "Cinematic Earth globe" entry below) is what first exercises
that surface in this project.
Scenes are self-contained modules with their own `requestAnimationFrame` loop
(mounted from a client-leaf React component), separate from the spring `ticker`,
which drives only `@react-spring/web`/`spring-text-engine` motion.

**Hero scene** (`src/components/scene/`) — the homepage's digital-twin cutaway:
a valley terrain, bridge, tunnel, geological strata, borehole/monitoring
markers, a lidar-style point cloud, a background construction rig (crane,
girders, scaffolding, all wireframe) and upward-drifting dust particles, all
built from `three` primitives (no external models). `build-hero-scene.ts` is the
framework-free THREE setup; `HeroScene.tsx` is the client leaf that owns the
render loop, pausing off-screen (`IntersectionObserver`), on tab-hide
(`visibilitychange`), and rendering one static frame instead of looping — and
skipping all pointer/scroll reactivity — when `prefers-reduced-motion` is set.
`hero-scene-colors.ts` mirrors the Neural Monitor Tier-1 tokens in `globals.css`
— three.js materials take numeric colours directly and can't consume CSS custom
properties, so these are kept in sync by hand. See ADR-0023 in [[decisions-log]].

Pointer movement drives a true ±15° camera orbit (spherical coordinates around
the look-at point, smoothed, never snapped straight to the raw event) — `HeroScene`
reads the shared `usePointer` store (see [[hooks]]) each ticker tick rather than
wiring its own `pointermove` listener. Scrolling through the hero (via
`useProgressTrigger`, called directly against the hero's own container rect —
the container fills the section exactly, so its rect doubles as the trigger
range) zooms the camera in and descends it toward the strata layers, fading the
construction rig and point cloud — `HeroSceneHandle.setScrollProgress`. The
construction rig also animates on its own: the crane's jib swings on an
independent pivot sub-group, girders fly in and scaffolding scales up from
nothing over the first ~2.5s, and a ring pulses outward from the scene centre
every 3s (a lidar sweep). Homepage-motion-overhaul Phase 1 — see [[changelog]].

**Service hero scenes** (`src/components/scene/service-heroes/`) — each of the
8 `/services/<slug>` pages passes its own scene factory into the shared
`HeroScene.tsx` (via `SERVICE_HERO_SCENES`, keyed by slug), so they get the
same render loop, pause/resize/reduced-motion handling as the homepage hero
for free. `hero-scene-runtime.ts` is the shared setup all 8 builders (plus the
homepage's `build-hero-scene.ts`) go through; its returned handle gained
`setScrollProgress` (service-pages Phase 0 — see [[changelog]] and ADR-0030 in
[[decisions-log]]), mirroring the homepage hero's own scroll-reactivity —
every builder can read scroll progress once it chooses to use it — civil,
design & drafting, geotechnical and structural now do (service-pages Phases 1
and 2), the remaining four land as each is individually elevated in a later
phase. Geotechnical no longer reuses the homepage's `createHeroScene`, nor its
own Phase-2 `build-geological-digital-twin-scene.ts` cutaway (retired) — its
hero is now Solaris, a breathing particle-sun scene ported *verbatim* from
GetLayers' real "Creative Studio" template source (`getlayers_source`, not
guessed from a description) into `build-solaris-scene.ts` — authentic
amber/orange (`#ff301a`/`#ff7033`, `invertGradient: true`), full aurora, the
template's own offset camera/sphere framing
(`cameraDistance: 4.6, cameraOffsetY: 2.8, sphereOffsetY: 5.5`),
`UnrealBloomPass` at the brief's literal `2.33/1.16/0`, cursor-raycast solar
flare, on-load fill→hollow intro. Two earlier passes (ADR-0037, ADR-0038)
tuned a *guessed* shader — different colours, a widened fresnel band, and
per-page hand-tuned bloom — before the real template was ever pulled; all
of that is superseded. What actually makes `2.33/1.16/0` work at both hero
and card scale is the template's own `vwScale` (`clamp(width/1440, 0.4,
1.5)`, scaling `bloomPass.strength`/`uParticleSize` only), also ported
verbatim. `service-heroes/index.ts` no longer imports `build-hero-scene.ts`
at all as a result. The same `build-solaris-scene.ts` also exports
`createSolarisCardScene`, mounted via `HeroScene.tsx` inside the
Geotechnical *homepage card* — the first non-fullscreen use of that
wrapper's dedicated-context pattern, since Solaris's bloom needs an
`EffectComposer` the shared viewport renderer below can't provide; at the
card's ~275px width (well outside anything the template itself runs at),
`vwScale`'s floor alone isn't enough, so the card also uses a coarser
sphere (48×90 segments vs. the hero's verbatim 200×600) and a higher bloom
threshold (0.4 vs. 0) — see ADR-0036 and ADR-0039 in [[decisions-log]].

The homepage's **Geotechnical Plexus** feature section
(`GeotechnicalPlexusSection.tsx`, between `AboutSection` and
`ServicesSection`) is a from-scratch (not GetLayers-sourced) scene, built
after the user explicitly chose to match this project's own vanilla-
Three.js architecture over the original brief's React Three Fiber/drei/
GSAP ask (see ADR-0060). `build-geotechnical-plexus-scene.ts` composes 9
independent builder modules under `src/components/scene/
geotechnical-plexus/`: `terrain.ts`, `geological-layers.ts` (six real
volumetric strata, wavy top *and* bottom surfaces), `plexus-mesh.ts` (a
depth-graded node/line/triangle network — sparse/random near the surface,
dense/lattice-like in Bedrock, one `InstancedMesh` + one
`BufferGeometry`/`LineSegments` regardless of count), `boreholes.ts` (five
labelled cylinders with strata-crossing markers), `foundation-system.ts`
(instanced pile grid), `groundwater.ts`, `data-pulses.ts` (small points
riding a subset of the Plexus's own edges), `lighting.ts`, and
`constants.ts` (the shared block bounds/layer spec/noise). No
`EffectComposer` — the only hero-scale scene in this codebase without one,
deliberately, per the brief's "avoid excessive bloom." Second non-
fullscreen use of `HeroScene.tsx`'s dedicated-context pattern (after the
Solaris card above) — mounted inside a bounded, rounded-corner container
in a two-column homepage section, not a fixed page background. Ships its
own `--surface-engineering`/`--ink-engineering`/etc token set (`globals.css`,
originally light-themed) rather than the sitewide dark palette — as of
ADR-0069 this section overrides those specific Tier-2 tokens page-scoped on
its own `<section>` (dark navy `#040d1a`, white text) so it renders
differently from `/services/geotechnical-engineering`'s hero, the token
set's other consumer, which keeps the original light look untouched. Also
has its own `GeotechnicalPlexusHeading`/`GeotechnicalPlexusScene` client leaves so
`spring-text-engine`/`three` never get imported straight into the
Server Component section — see ADR-0060 for the build failure that
uncovered why that split is required.

The Geotechnical Engineering *service page's* hero is a third, unrelated
from-scratch scene layered **on top of** the Solaris background above,
not replacing it (ADR-0061) — a bespoke, PLAXIS-inspired (not a UI copy)
finite-element visualization: `build-geotechnical-fea-scene.ts` composes
12 modules under `src/components/scene/geotechnical-fea/`: `constants.ts`
(block bounds, six strata, excavation/tunnel/pile geometry, the 6
construction stages, the 5 result modes, the contour ramp),
`ground-model.ts` (one continuous height-field grid that dips into the
excavation footprint — deliberately not six separate volumes like the
Plexus scene's `geological-layers.ts`, see that file's own header),
`soil-layers.ts`, `finite-element-mesh.ts` (coarse base grid + finer
grids clipped to dense-zone rectangles around the excavation/tunnel/
piles), `excavation-system.ts` (four deformable, contour-mappable
retaining wall panels + struts), `pile-foundation.ts`, `tunnel-model.ts`
(ovalizable per vertex), `deformation.ts` + `analysis-contours.ts`
(procedural, not a real FE solve — a visualization, per the brief's own
framing), `construction-stages.ts`, `lighting.ts`, and
`camera-controller.ts` — this scene's own real click-drag/zoom orbit, the
only canvas in this codebase with `pointer-events: auto` (every other
scene is passive-parallax-only). `GeotechnicalFeaSceneHandle` extends the
base `HeroSceneHandle` with `setConstructionStage`/`setResultMode`/
`setDeformedView`, reachable from `GeotechnicalFeaScene.tsx` (a client
leaf) via `HeroScene.tsx`'s new optional `onSceneReady` callback. Mounted
by a bespoke `GeotechnicalAnalysisHero.tsx` (`src/views/services/`,
special-cased by slug in `service-detail.tsx`, not an extension of
`ServiceHero.tsx`) in a light "instrument panel" box (the `-engineering`
tokens, shared with the Plexus scene) that floats — deliberately
transparent around it — over the still-present Solaris background.

Design & Drafting's hero is Aether Flux, the same "pull the real source,
port verbatim" practice applied to a second GetLayers scene
(`getlayers_materialize`, id `aether-flux`) — a cube of ~9–17k instanced,
curl-noise-oriented tapered rods (`InstancedBufferGeometry`, one draw call),
pearlescent-platinum shading (`#9fb0c4` cool / `#f4eee2` warm / `#ffffff`
spec, the scene's own default palette, not retinted), cursor pocket/vortex,
click-burst ring, and a turntable spin, in `build-aether-flux-scene.ts`.
Mounted the same way as Solaris — `AetherFluxBackground.tsx`, a fixed
`pointer-events-none inset-0 z-0` page background, route-gated via
`isGlassBackgroundRoute()`. One ported quirk kept deliberately: the
source's three-composer bloom rig (`torusComposer`/`bloomComposer`/
`finalComposer`) blooms two structurally-empty scenes every frame — a real,
measured cost, preserved as-found rather than "fixed" per the explicit
verbatim ask. See ADR-0042. `build-aether-flux-scene.ts` also exports
`createAetherFluxCardScene`, mounted in the Design & Drafting *homepage
card* via `ServiceCard.tsx`'s `DEDICATED_CARD_SCENES` lookup (alongside
Solaris's card) — same builder, only the two composers' bloom strength
toned down (0.15/0.2 vs. the hero's 0.22/0.32); every other CONFIG value is
identical, and unlike Solaris's card no geometry reduction was needed since
the rods are opaque/depth-tested rather than additively blended. See
ADR-0043.

Structural Engineering's hero is the Einstein–Rosen Lattice, a third
verbatim-pulled GetLayers scene (`getlayers_materialize`, id
`einstein-rosen-lattice`) — a platinum wireframe wormhole with genuinely no
3D geometry: two screen-filling `PlaneGeometry(2, 2)` quads (a "bridge" and
a "glow" quad), the entire look raymarched analytically per pixel in the
fragment shader against the Flamm catenoid (`rho = a*cosh(y/b)`), warm gold
at the throat fading to cold sapphire at the rim, in
`build-einstein-rosen-lattice-scene.ts`. Mounted the same way as the other
two — `EinsteinRosenLatticeBackground.tsx`, route-gated via
`isGlassBackgroundRoute()` — and also exports
`createEinsteinRosenLatticeCardScene` for the homepage card
(`DEDICATED_CARD_SCENES`), bloom toned down the same way Aether Flux's card
is. Unlike Aether Flux, this scene's extra composers are genuinely
functional, not structurally dead — the bridge quad really is on
`TORUS_SCENE` and the glow quad really is on `BLOOM_SCENE`, so both bloom
real content (the glow reads as off only because its default
`glowIntensity` is 0, a quiet-by-design knob). See ADR-0044.

Civil Engineering's hero is the Golden Parthenon, a fourth GetLayers
scene. Its `getlayers_materialize` pull failed six consecutive times
(transport drops, 300s idle timeouts, one via `getlayers_scene_lab` as a
fallback) — `golden-parthenon` is the heaviest scene tried so far — so it
went through two intermediate builds in one day before landing on the real
thing: a procedural primitive-geometry temple (ADR-0045, built because the
brief's own GLB URL was a literal `[hash]` placeholder), reported broken by
the user and briefly swapped for an unrelated scene, Halcyon Gate — Night
(ADR-0046), before the user supplied the real `golden-parthenon.html`
source directly (a zip in Downloads with its GLB and ground PBR maps
inlined as base64) and asked for it rebuilt from that. `build-golden-parthenon-scene.ts`
now loads the real assets — extracted to `public/assets/golden-parthenon/
{model.glb, ground-color.jpg, ground-normal.jpg, ground-rough.jpg}`,
integrity-checked after extraction (JPEG EOI markers, GLB header/length) —
via `GLTFLoader`/`DRACOLoader` (self-hosted `/draco/` decoder, same
convention as `build-planet-scene.ts`'s `public/assets/planet/`, ADR-0034)
and `THREE.TextureLoader`. A golden-hour sky dome (baked vertex colours), a
canvas-gradient sun-glow sprite, a PMREM warm/cool environment, an
fbm-displaced ground plane with a flat seat under the temple, camera-parented
dust motes, cursor-driven sun position and camera parallax, `UnrealBloomPass`
plus a custom luma-aware grain pass, and an ACES exposure fade-in are all
ported to the source's exact numbers — the real temple auto-fit to 6 units
tall and posed exactly as the source specifies, no procedural substitution
left anywhere. Mounted the same way as the other three —
`GoldenParthenonBackground.tsx`, route-gated via `isGlassBackgroundRoute()`
— and also exports `createGoldenParthenonCardScene` for the homepage card
(`DEDICATED_CARD_SCENES`): flat ground (no displacement), no dust, bloom
toned down to 1.2/0.5/0.7 from the hero's 2/0.7/0.62. Replaces the retired
`corridor-grading` hero theme and `buildCivilBridge` mini-scene. See
ADR-0045, ADR-0046, ADR-0047.

Stormwater & Flood Modelling's hero is Negentropy, a composite of five
real GetLayers particle scenes (`spiral-network`, `molecule`,
`hourglass-galaxy`, `storm`, `starfield-close`, all pulled via
`getlayers_materialize` and cross-checked against the brief) plus a
directly-built ambient starfield, in `build-negentropy-scene.ts`. Unlike
every other scene here, the six fields don't each get their own camera or
composer — they share ONE camera (driven by a 7-anchor scroll-progress
flight), ONE cursor-void system (world-space unproject to z=0, shared
`uCursor`/`uActivity` uniforms every field reads), and ONE composer
(`UnrealBloomPass(0.55, 1.8, 0.02)` → `OutputPass`), since each pulled
source's own per-field camera control and triple-composer atmosphere rig
only make sense for that field alone on its own page. Per-field opacity is
driven by linear `ramp(p, a, b)` windows over the scroll progress (Spiral
fades out early, Molecule and Storm cross-fade through the middle, Storm's
own `uBlowUp` uniform detonates near the end, Hourglass fades in last).
Mounted the same way as the other four — `NegentropyBackground.tsx`,
route-gated via `isGlassBackgroundRoute()` — and also exports
`createNegentropySpiralCardScene` for the homepage card: Spiral Network
alone, water/teal palette, toned-down bloom, static camera, no scroll
dependency. Replaces the retired `flood-inundation-terrain` hero theme and
`buildStormwaterFlow` mini-scene. See ADR-0048.

Project Control Services' hero is the first glass-route background that
isn't a WebGL scene at all — GetLayers' "Siloutte" background video
(a silhouetted figure against a glowing light beam), self-hosted and
re-encoded from its original 2892×2160/AAC master down to a 1920×1080
mp4+webm pair (audio stripped — always rendered muted) for the full-page
background and a 640×360 pair for the homepage card, both cover-cropped
at encode time (`public/assets/siloutte/`). `VideoBackground.tsx`
(`src/components/common/`) is the shared muted/looping/`playsInline`
`<video>` wrapper both places use — shows its `poster` until the first
frame decodes, respects `prefers-reduced-motion` by pausing immediately
(same convention every WebGL scene here follows), and takes a
`pauseWhenOffscreen` prop that drives an `IntersectionObserver` for the
card (the page background skips it — `fixed inset-0` is always "in view").
As of ADR-0056 it also takes optional `mobileMp4Src`/`mobileWebmSrc` — a
1280×720 re-encode swapped in via `<source media="(max-width: 768px)">`,
and a client-computed `preload="none"` on the mobile/low-power tier (see
"Device tiering" below); both full-page video backgrounds (this one and
Purple Planet) supply the mobile pair, the homepage card does not.
Reuses the existing glass-route machinery rather than a parallel one:
`schedule-network-graph` (this page's pre-existing `sceneTheme`) joined
`GLASS_SCENE_THEMES`, so `ServiceHero.tsx` skips its own WebGL hero the
same way it already does for the other five glass themes;
`createScheduleNetworkGraphScene` stays registered in
`SERVICE_HERO_SCENES` as dead code, same as every other glass theme's own
factory. Mounted via `ProjectControlBackground.tsx`
(`src/components/scene/`, alongside its WebGL siblings for consistency),
route-gated via `isGlassBackgroundRoute()`; the card uses
`DEDICATED_CARD_VIDEOS` in `ServiceCard.tsx`, a sibling lookup to
`DEDICATED_CARD_SCENES` for this one non-WebGL asset type. Replaces the
retired `buildProjectControlGantt` mini-scene. See ADR-0050.

Advisory Services' hero is Aureole, GetLayers' golden particle corona
(`getlayers_materialize`, id `aureole`) — 95000 particles erupting along
16 irregular spokes from a dark hollow core, drifting outward and
dissipating, in `build-aureole-scene.ts`. The only scene in this codebase
with a genuinely static camera — `camera.position` is set once to
`(0,0,17)` and never touched again; every other route's scene either
orbits, flies through scroll-driven anchors, or at minimum parallaxes with
the cursor. All motion here is the particles' own eruption cycle plus the
pointer: dragging aims a directional flare (a raycast onto the z=0 disc
plane), and every click spawns another shockwave ring (up to 16 live at
once, `PULSE_SPEED` 14 world units/sec). Because this scene's canvas is
always `pointer-events-none`, the interaction is wired via
`window.addEventListener` directly in the builder rather than
`HeroSceneHandle`'s `setPointer` (an intentional no-op here) — same shape
as Aether Flux's/Einstein-Rosen Lattice's own bespoke click listeners.
Mounted via `AureoleBackground.tsx`, route-gated via
`isGlassBackgroundRoute()`; also exports `createAureoleCardScene` for the
homepage card (particle count cut to 30000, bloom toned down to 1.2/0.7
from the hero's 1.77/0.96). Replaces the retired
`advisory-lifecycle-network` hero theme and `buildAdvisoryCompass`
mini-scene. See ADR-0051.

The standalone `/projects` page's background is GetLayers' "Purple
Planet" video — a glowing violet planet traced with city-light network
patterns — the first glass route outside `/services/*` and the first with
no `Service["sceneTheme"]` to hook into at all; `GLASS_BACKGROUND_ROUTES`
is a plain pathname `Set`, so it slots in with zero new machinery. Same
self-hosted, re-encoded-down-from-4K treatment as Siloutte
(`public/assets/purple-planet/`, a single 1920×1080 mp4+webm pair, audio
stripped, cover-cropped at encode time), but only one size — this asset
has no homepage-card use case. `PurplePlanetBackground.tsx` reuses
`VideoBackground.tsx` unchanged, route-gated to `/projects`.
`ProjectsSection.tsx`/`ProjectCard.tsx` needed no changes — `ProjectCard`'s
existing `bg-surface` token (`rgba(255,255,255,0.04)`) is already
translucent enough for the video to read clearly behind every card. See
ADR-0052.

The standalone `/publications` page's background is GetLayers' "Aurum
Peak" scene (`getlayers_materialize`, id `aurum-peak`) — a wireframe
golden summit rising through drifting sunset cloud, in
`build-aurum-peak-scene.ts`. The second glass route with no
`Service["sceneTheme"]` to hook into (after `/projects`, ADR-0052). CPU-
side: `jhash`/`jnoise`/`jfbm`/`jridge`/`jridgefbm` build a single-massif
height field, triangulated into a `bary`-attributed mesh (`NX 42`×`NZ 30`
cells) whose fragment shader draws the glowing wireframe edges, a
cursor-hover sub-triangle fill zone, a drifting mist belt and distance
haze — all from the mesh's own screen-space derivatives, no lighting
pipeline. Shares the three-composer selective-bloom rig (`torusComposer`/
`bloomComposer`/`finalComposer`) `build-einstein-rosen-lattice-scene.ts`
already established, plus a `FinalPass` doing refractive lens distort,
chromatic aberration, vignette and grain — its cursor-follow distort and
the camera's own pointer parallax are both driven by real
`window.addEventListener` listeners (this canvas, like Aureole's, is
always `pointer-events-none`), matching the source's own window-level
interaction with zero adaptation needed. The source's literal black
`#fade-overlay` DOM intro is folded into a `uFadeIn` uniform inside
`FinalPass` instead of a real DOM element — same choice Aether Flux/Golden
Parthenon made for their own intro fades. `AurumPeakBackground.tsx`
mounts route-gated to `/publications`; the page itself
(`src/views/publications.tsx`) was rebuilt from a placeholder into a real
`.glass-panel` page with a topic grid linking each of the eight real
service pages. See ADR-0053.

Telecom Services' hero is Spiral Galaxy, GetLayers' two-arm galaxy with a
molten-gold core fading into deep-violet dust (`getlayers_materialize`, id
`spiral-galaxy`), in `build-spiral-galaxy-scene.ts` — the last of the eight
service lines to get a dedicated scene, replacing `buildTelecomTower` and
retiring `mini-scenes.ts`'s `MINI_SCENES` map to empty (kept as the
registration point for a future non-dedicated card, not deleted). The
galaxy is a single `SphereGeometry(4.2, 200, 600)` whose vertex shader
re-hashes each vertex's own local position into a galaxy radius/arm/angle
plus a spherical core bulge — there's no "galaxy" geometry at all, just a
dense point cloud reshaped entirely in the shader, same trick Solaris's
particle sphere uses for its own shape. Scroll-driven: diving the camera
toward the core and tipping the disc edge-on as you scroll, reading the
shared `getScrollSignalSnapshot().progress` (see [[hooks]]) instead of the
source's own raw `window.scrollY` listener — same substitution Negentropy
and the Planet globe already made. The cursor casts a "void" into the
dust: a world-space unproject onto the z=0 plane repels nearby points,
same window-level interaction pattern as Aureole/Aurum Peak since this
canvas is always `pointer-events-none`. Mounted via
`SpiralGalaxyBackground.tsx`, route-gated via `isGlassBackgroundRoute()`;
also exports `createSpiralGalaxyCardScene` for the homepage card — lighter
sphere segments (90×260 vs. the hero's 200×600) rather than a particle
`count` option (this scene has none), no scroll-driven dive (no natural
scroll range inside a small card), bloom toned to ~70% of the hero's. See
ADR-0054.

The standalone `/about` page's background is GetLayers' "Pinwheel Galaxy"
scene (`getlayers_materialize`, id `pinwheel-galaxy`) — differential-
rotation spiral arms, a small central bulge, and embers that rise off the
disc and fade, in `build-pinwheel-galaxy-scene.ts`. The third glass route
with no `Service["sceneTheme"]` to hook into (after `/projects` and
`/publications`). Unlike Solaris/Spiral Galaxy's reshaped point sphere,
the arms/bulge/spark clouds here are genuinely built in polar coordinates
(`r, h, baseAngle` packed straight into the `position` attribute) and
reinterpreted per-vertex for true differential rotation — inner radii
spin faster than outer ones, via a spin phase accumulated in JS
(`spinPhase += spinSpeed*(1+scrollT*scrollSpin)*dt`, never a speed-scaled
`iTime` — the asset's own `contract.notes` warns that rewriting it that
way makes scroll changes jump the rotation). Two of the source's own rAF
loops — its main render loop and a second, independent appear-in slide/
fade loop — are folded into `HeroScene.tsx`'s single
`renderFrame(elapsedSeconds)` call. Scroll-driven camera dive reads the
shared `getScrollSignalSnapshot().progress` (see [[hooks]]) same as Spiral
Galaxy; the cursor repels points via an NDC-space vertex-shader offset,
window-level interaction since this canvas is always
`pointer-events-none`. Mounted via `PinwheelGalaxyBackground.tsx`,
route-gated via `isGlassBackgroundRoute()`. No homepage-card export — only
the `/about` page uses this scene. The page itself
(`src/views/about.tsx`) was previously a bare `<AboutSection
headingTag="h1" />` re-export of the homepage's own About section;
rebuilt into its own page reusing `AboutHeading`/`TeamPanel` directly plus
new sections built from `company.ts`'s real data (an offices grid,
`experienceRegions` pills). See ADR-0055.

The standalone `/about/team` page originally reused the Pinwheel Galaxy
background above unchanged and added GetLayers' **"Cards Cascade"**
section — a `position: sticky` scroll-fold deck, pure CSS 3D + vanilla JS,
no WebGL context (ADR-0062). ADR-0072 replaced that with its own dedicated,
much calmer starfield scene (`TeamStarfieldBackground.tsx`/
`build-team-starfield-scene.ts`) plus a plain responsive CSS Grid of
independent team cards (`TeamMemberCard.tsx`). ADR-0074 then rebuilt it as
an original WebGL scene ("Mirror Hall") — a curved carousel of the real
team photos above a hand-written, genuinely real-time water-reflection
plane. As of ADR-0076, WebGL was dropped entirely per an explicit brief:
the page is now `TeamCascade` — a CSS-3D-only (`perspective`/
`translate3d`/`rotateX`, no canvas) tall-track "Cards Cascade", the same
mechanism `/projects` uses (ADR-0075), re-skinned with this page's own
hero copy and a teal accent. Mirror Hall's files
(`build-mirror-hall-scene.ts` / `about-team/TeamMirrorHall.tsx`) were
**deleted outright**, not retired — they had zero remaining references
once this page stopped using them. `TeamStarfieldBackground.tsx`/
`TeamMemberCard.tsx` remain in the tree — the former still a retired
(empty-route-set) background regardless of which foreground presentation
this page runs; the latter no longer used by this page at all (it was
Mirror Hall's WebGL-failure fallback markup specifically, and
`TeamCascade`'s own reduced-motion path is a separate, fresh grid, not a
reuse of it). `/about` itself keeps the Pinwheel Galaxy unchanged
throughout. See [[decisions-log]] ADR-0076 (current), ADR-0074, ADR-0072
(both superseded), and [[components/about-team]] for the full breakdown.

The standalone `/contact` page's background is GetLayers' "Bird" video
(`public/assets/bird/`) — re-encoded from a 2700×2160/5s h264 master
(cover-cropped to 1920×1080, not a plain scale, since the source isn't
16:9) with a 1280×720 mobile pair, same treatment as Siloutte/Purple
Planet. `BirdBackground.tsx` reuses `VideoBackground.tsx` unchanged,
route-gated to `/contact`. The page itself (`src/views/contact.tsx`) was
previously `<ContactForm />` plus the shared homepage `<ContactSection />`
(which also renders `ContactTerrain`, a section-scoped WebGL office-marker
terrain built for a plain background); rebuilt into its own `.glass-panel`
page reusing `ContactForm` and the real `offices`/`contact` data from
`company.ts` directly, instead of the shared section component —
`ContactSection.tsx`/`ContactTerrain.tsx` are untouched and still power
the homepage. `ContactForm.tsx` gained an optional phone field
(`/api/contact/route.ts`'s zod schema updated to match). See ADR-0057.

On the low-power device tier — `isLowPowerDevice()` in `performance-tier.ts`
resolving to `"low"`, a *capability* check (cores/memory/mobile-UA), not a
viewport-width one — `HeroScene.tsx` skips mounting WebGL entirely (for both
the homepage hero and every service hero) and renders a `fallback` instead —
an optional prop, defaulting to `HeroFallback.tsx` (a `useSpring`-driven
pulsing radial-gradient glow that reads `--accent`/`--glow` from its CSS
scope, so it automatically shows a service page's own tint with no props).
See ADR-0031 (original) and **ADR-0078**, which reversed this and every
other scene's "narrow viewport = no WebGL" behaviour: a capable phone (e.g.
iPhone 15 Pro Max) now mounts the real scene, at the mobile-width *budget*
tier's tighter DPR/frame-rate numbers, not the CSS fallback. Only a device
whose capability genuinely resolves to "low" (< 6 cores or < 4GB RAM on a
mobile UA, < 4 cores/4GB on desktop) still gets the fallback.

Each of the 9 dedicated full-page `*Background.tsx` wrappers overrides
that default with its own `<SceneFallbackGradient gradient>`
(`src/components/scene/SceneFallbackGradient.tsx`) instead — a plain,
deliberately *unanimated* radial gradient (no spring pulse: the tier exists
for zero per-frame cost) toned to that specific scene's own real palette.
As of ADR-0058, `gradient` is a single `var(--raw-gradient-fallback-
<scene>)` reference — one Tier-1 token per scene holding a full 3-stop
`radial-gradient(...)` literal (`solaris`/`aether-flux`/`wormhole`/
`golden-parthenon`/`negentropy`/`aureole`/`spiral-galaxy`/
`pinwheel-galaxy`/`aurum-peak`), replacing ADR-0056's original two-stop
`from`/`to` colour-pair design. Not the sitewide `--accent`/`--glow` (that
also tints buttons/links and doesn't match an individual scene's palette
anyway).

**Per-service accent tint** (`src/lib/scene/service-accent.ts`) — each service
page wraps its content in an element whose inline style overrides the
existing `--accent`/`--glow` Tier-2 custom properties to that service's own
Tier-1 primitives (`--raw-color-service-<slug>-accent`/`-glow` in
`globals.css`), so every component already styled through `bg-accent`/
`text-glow`/etc. — including the hero scenes' own pointer-glow colouring —
picks up a per-page tint with no component changes. See ADR-0030 in
[[decisions-log]].

**Shared viewport renderer** (`src/lib/scene/shared-viewport-renderer.ts` +
`src/components/scene/SceneViewport.tsx`) — every *other* 3D moment on the
homepage (7 of the 8 service-card icons — Geotechnical's is a dedicated
`HeroScene`/Solaris instance instead, ADR-0036 — the About geological
cross-section, the Stats globe, the Contact terrain) shares **one**
`WebGLRenderer`/`<canvas>`
rather than one context each. The canvas is `position: fixed`, covers the
viewport, and sits behind page content (`z-index: 1`; callers give their own
foreground text `relative z-10`, the same convention the hero already uses for
its own overlay). Each caller registers a DOM element; every frame, that
element's `getBoundingClientRect()` becomes a scissored viewport rect on the
shared canvas — the technique the three.js manual documents for "multiple
canvases, one WebGL context". `SceneViewport` is the React wrapper: it
registers on mount, pauses via `IntersectionObserver`, exposes a
`setControl(value)` imperative handle (hover intensity for the service icons,
scroll progress for the geological cross-section), and — on the low-power
device tier (`isLowPowerDevice()`, capability-only) or under
`prefers-reduced-motion` — never mounts WebGL at all, rendering a plain CSS
`fallback` instead. As of ADR-0078 this is no longer width-gated; the
`mobileBreakpoint` prop that used to add a raw `< 768px` skip has been
removed (no caller ever set it). Scene builder modules: `mini-scenes.ts` (empty as of
ADR-0054 — all 8 service icons are now dedicated `HeroScene` cards, see
`ServiceCard.tsx`'s `DEDICATED_CARD_SCENES` above, keyed by
`service.slug`; the map is kept as the registration point for a future
non-dedicated icon), `geological-cross-section.ts`, `world-globe.ts`,
`office-terrain.ts`. See ADR-0025 in [[decisions-log]].

**Guardrail:** the render loop skips (and warns once, rather than spamming
`console.error` every frame) any registered scene whose geometry has a non-finite
position value — the condition that makes `computeBoundingSphere()` produce a NaN
radius. When building a scene builder that mutates a `BufferGeometry`'s position
attribute per frame, animate
the *same* attribute object that's actually being rendered — don't derive a
display geometry (e.g. `THREE.WireframeGeometry`) from a source geometry and then
index into it using indices/clones taken from the source; the derived geometry's
vertex layout doesn't line up with the source's, so per-vertex updates read/write
out of bounds and produce NaNs. See ADR-0026 in [[decisions-log]].

**Guardrail 2:** `setActive(false)` (fired by `SceneViewport`'s
`IntersectionObserver` when a registration's element leaves the viewport) now
scissor-clears that registration's current rect before flipping the flag —
`renderer.autoClear` is off here by design (each registration only clears its
own scissored slice), so a registration the loop stops visiting was previously
left with whatever it last drew, on-screen, forever, if the observer happened
to fire *after* a fast scroll had already moved on. See ADR-0028 in
[[decisions-log]]. The per-registration render body is also now wrapped in a
`try`/`catch` — a plain `Map.forEach` callback throwing silently aborts the
rest of that frame's iteration, so one broken scene could blank out every
scene registered after it.

`ViewportBuild.update()` takes the registration's live scissor rect as a third
argument (`(elapsedSeconds, control, rect: DOMRect)`) — most builders ignore
it; `geological-cross-section.ts` uses it to compute cursor position relative
to its own panel (via the shared pointer store) for a cursor-tilt effect,
rather than relative to the whole page.

**Device tiering** (`src/lib/scene/device-tier.ts`) — one module owning what
"mobile"/"tablet"/"desktop" means for every 3D scene's *budget* (DPR clamp,
ambient-shape count, hero frame-rate cap) by viewport width (same
768px/1024px breakpoints already used elsewhere). Added as the homepage's
motion/3D overhaul started adding enough concurrent WebGL work (a persistent
background + elevated per-service scenes + a bigger globe + a denser
terrain) that per-module hardcoded numbers stopped being tenable — see
`obsidian/workflows/optimize-3d-scene.md`'s device-tiering guidance and
ADR-0027.

As of ADR-0078 (amending ADR-0056/ADR-0058's original design), this
"mobile"/`"tablet"`/`"desktop"` result is **budget-only** — it no longer
doubles as the "should WebGL mount" signal. That signal is
`isLowPowerDevice()` alone: a pure capability check
(`hardwareConcurrency`/`deviceMemory`/mobile-UA, from `performance-tier.ts`)
independent of viewport width, called directly by every scene mount site
(`HeroScene`, `GeotechnicalFeaScene`, `PlanetBackground`,
`AmbientBackground`, `SceneViewport`). A low-core desktop or a wide tablet
with a weak CPU still gets the "WebGL never mounts" fallback; a narrow but
capable phone (the case ADR-0056/0058 got wrong — every phone was width-
forced into this regardless of actual hardware) no longer does. Guarded
behind the same `viewportWidth > 0` check every caller already used to
detect "not yet measured on the client" — `navigator`/`localStorage` are
available synchronously on the client before hydration completes, so
checking them unconditionally would make the tier disagree between the
server-rendered HTML and the client's first paint.

As of ADR-0079, `getDeviceTier` also returns `"desktop"` for any viewport
width when the device's *capability* tier is `"ultra"` (a detected flagship
phone — see below) — the width-forcing rule's mirror image at the other end:
`"low"` capability already forced `"mobile"` regardless of width;  `"ultra"`
now forces `"desktop"` regardless of width. This is the one line that makes
"no simplification for flagship phones" true everywhere at once: every
`getDeviceTier`/`getTierBudget` consumer (DPR clamp, ambient shape count,
hero frame cap, the Earth globe's star/atmo/marker counts, every scene
builder's own `getDeviceTier(...) === "desktop"` density branch) picks up
the literal desktop budget for a flagship phone with no other file touched.

**4-tier performance/capability system** (`src/lib/scene/
performance-tier.ts` + `src/hooks/performance/use-performance-tier.tsx`,
ADR-0058) — Ultra/High/Medium/Low, resolved once per session from
`navigator.hardwareConcurrency`/`deviceMemory`/mobile-UA/`screen.width`
and persisted to `localStorage` (`geoporte:performance-tier`) so a
downgrade survives a reload. `device-tier.ts`'s `isLowPowerDevice()` now
delegates to `getOrDetectTier() === "low"` instead of its own narrower
hardwareConcurrency-only check (that *was* the whole ADR-0056 mechanism —
now just this module's "low" case), and `getTierBudget`'s `dprClamp` takes
the smaller of the width-tier's own clamp and the capability-tier's clamp,
so a desktop-*width*-but-Medium-*capability* device gets `dpr=1` instead
of desktop's default `dpr=2`. `PerformanceTierProvider` (mounted in
`layout.tsx`, wrapping `<ScrollLayout>`) is the explicit "store tier in a
React context" mechanism — for reactive consumers that need to notice a
*live* tier change; scene builders still read the synchronous
`getDeviceTier()`/`getTierBudget()` API at construction time, unchanged,
since a scene is built once per mount. `PERFORMANCE_TIER_BUDGETS` also
exports `particleScale`/`bloomScale` multipliers per tier, not yet wired
into any of the 9 dedicated scene builders — see ADR-0058's "not done"
section for why.

As of ADR-0079, a mobile-UA device can also resolve straight to `"ultra"` —
previously the mobile branch capped out at `"high"` no matter how capable
the hardware read, since a phone GPU/thermal envelope is generally weaker
than desktop's at the same core count. A **flagship** device is the explicit
exception: `isFlagshipMobileDevice(cores, memory)` checks two independent
paths before the ordinary cores/memory ladder runs —
  - **Android**: the literal `cores >= 8 && memory >= 8` — both real,
    reliable Chrome signals, no proxy needed.
  - **iOS**: `deviceMemory` isn't implemented in Safari at all and
    `hardwareConcurrency` has read a flat `6` on every iPhone since the A13
    (iPhone 11, 2019), so neither can distinguish a 15 Pro Max from a 12
    mini. The only proxy available is the device's logical screen size ×
    `devicePixelRatio` — `IOS_FLAGSHIP_SCREEN_SIGNATURES`, a hand-maintained
    table of `[shortSide, longSide, dpr]` triples (normalized so portrait/
    landscape both match) covering 14 Pro/14 Pro Max/15/15 Plus/15 Pro/15
    Pro Max/16/16 Plus/16 Pro/16 Pro Max. Plain "14"/"14 Plus" (older,
    different screen signature, shared with 12/13) are deliberately not in
    the table. An unrecognized future iPhone falls through to the normal
    ladder — safe by construction, never silently mis-promoted; **update
    this table when a new iPhone generation ships**. See ADR-0079 for why a
    UA-string model check was requested but isn't implementable, and why
    this proxy was chosen over the alternatives (treat every 6-core iOS
    device as flagship; or leave iOS unhandled).

`VideoBackground.tsx` (`src/components/common/`) also reads the mobile
check for a client-computed `preload="none"` (ADR-0056) — separate from
its `<source media="(max-width: 768px)">` mobile-size swap, which is a
plain browser-native mechanism needing no JS/device-tier read at all.
`dprClamp` is read from here by all four WebGL renderer-construction sites in
this project (the homepage hero, the shared service-hero runtime, the shared
viewport renderer, and the ambient background) — a perf-pass audit (see
[[changelog]] 2026-08-26) found the first three had drifted to a hardcoded
flat `2` instead, only the ambient background reading the tier budget
correctly; fixed to read `getTierBudget(width).dprClamp` in all four.
`TierBudget` also carries `heroFrameIntervalMs` (`HeroScene.tsx`'s render loop
throttle — `0` on desktop, 45fps on tablet, 30fps at mobile width; as of
ADR-0078 mobile width does reach this loop, for any device that isn't
capability-`"low"`) and per-scene particle/segment counts read directly by
individual `service-heroes/build-*.ts` builders where the count is large
enough to matter (civil's point cloud, the stormwater terrain/rain from
Phase 3, advisory's globe sphere segments, telecom's ring-shell torus
segments) rather than a generic field on `TierBudget` itself, since each
scene's "what counts as large" differs.

**Performance monitoring** (`src/lib/scene/performance-monitor.ts`) —
backs `PerformanceWarningToast.tsx` (see [[components/common]]): a static
check (`hasStaticLowPerformanceSignal`, delegating to `performance-tier.ts`'s
`isReducedPerformanceTier(getOrDetectTier())` — shown for Medium or Low)
plus a measured check (the rolling average of frames actually rendered by
`HeroScene.tsx`'s own loop dropping below 20fps over a 3s window,
`reportHeroSceneFrame` called from that same loop). As of ADR-0058 this can
fire more than once per page lifetime (a 5s re-arm cooldown, not a
permanent one-shot lock) — each firing calls `usePerformanceTier().
downgrade()` and re-shows the toast, floored naturally once the tier
reaches "low" (WebGL stops mounting, so this stops being called at all).
Deliberately a separate module from `device-tier.ts` rather than an
extension of it — see ADR-0033 in [[decisions-log]] for why; both now sit
alongside `performance-tier.ts` as the third piece of the capability
system.

**Ambient background** (`src/lib/scene/ambient-background-renderer.ts` +
`src/components/scene/AmbientBackground.tsx`) — a *third* standalone WebGL-context
pattern, alongside the hero and the shared viewport renderer above: one singleton,
always-full-canvas scene (no scissoring — there's only ever one occupant) of slowly
drifting wireframe shapes (geodesic spheres, octahedrons, toruses, I-beam/hex-bolt
silhouettes), mounted once from the root layout so it persists across route changes
(unlike the per-route `HeroScene`). Reads the shared `usePointer`/`useScrollSignal`
stores (see [[hooks]]) non-reactively each frame — nearby shapes tilt toward the
cursor, fast scrolling stretches and dims the field — and runs a periodic diagonal
"lidar pulse" line on its own timer. Capability-gated (`isLowPowerDevice()`)
and skipped under `prefers-reduced-motion`, same convention as every other
scene here — as of ADR-0078, mobile width alone no longer skips it; a
capable phone gets a reduced shape count (`ambientShapeCount: 6`) instead of
zero. Also route-gated
like the globe below it — `usePathname()` skips mounting on
`/services/geotechnical-engineering`, where the shapes competed with Solaris's own
particle/aurora geometry rather than complementing it. See ADR-0027, ADR-0041.

**Cinematic Earth globe** (`src/components/scene/build-planet-scene.ts` +
`PlanetBackground.tsx`) — a *fourth* standalone WebGL-context pattern, same
persistent-singleton shape as the ambient background above (mounted once,
never tears down on navigation), layered behind it at `z-index: -1` (ambient
background's own `z-index: 0` unchanged). Ported from GetLayers' "Ascend"
template — day/night city-lights shader, ocean shimmer, three drifting
cloud shells, atmosphere halo, starfield, golden radar-ping land markers,
plus a glowing accent-blue pin layer at Geoporte's seven real project
countries (reusing `world-globe.ts`'s exported `PROJECT_LOCATIONS`/
`latLonToVector3`). The first scene in this codebase to use
`EffectComposer`/`UnrealBloomPass` (three composers — torus-layer /
bloom-layer / final composite via `THREE.Layers`) — see ADR-0034 for why
that's a deliberate exception to the Phase 0 bloom-free decision, not a
reversal of it, and for the two `three` API fixes required to port the
template's pinned `three@0.143.0` source onto this project's actual
`three@0.185.1` without touching the shared dependency version
(`WebGL1Renderer`→`WebGLRenderer`, `sRGBEncoding`→`outputColorSpace`).
Scroll choreography reads `getScrollSignalSnapshot().progress` (see
[[hooks]]) instead of a raw `window.scrollY` read. Draco decoder
self-hosted at `public/draco/`, GLB/texture assets at
`public/assets/planet/`. Capability-gated the same as every other scene
here (`isLowPowerDevice()`) — tier-based DPR clamp and star/atmo/marker
counts. As of ADR-0078 a capable phone mounts this too, at a new
`TIER_COUNTS.mobile` budget (350/80/15 stars/atmo/markers, roughly half of
tablet's) rather than being excluded outright.

**Route-scoped background exclusivity.** `PlanetBackground.tsx` and
`AmbientBackground.tsx` both read `isGlassBackgroundRoute()`
(`src/lib/scene/glass-background-routes.ts`) and skip mounting entirely on
`/services/geotechnical-engineering`, `/services/design-and-drafting`,
`/services/structural-engineering`, `/services/civil-engineering`,
`/services/stormwater-and-flood-modelling`, `/services/project-control-services`,
`/services/advisory-services`, `/services/telecom-services`, `/projects`,
`/publications`, `/about`, or `/contact` — those
twelve pages get their own fixed full-page background instead
(`SolarisBackground.tsx`/`AetherFluxBackground.tsx`/
`EinsteinRosenLatticeBackground.tsx`/`GoldenParthenonBackground.tsx`/
`NegentropyBackground.tsx`/`ProjectControlBackground.tsx`/
`AureoleBackground.tsx`/`SpiralGalaxyBackground.tsx`/
`PurplePlanetBackground.tsx`/`AurumPeakBackground.tsx`/
`PinwheelGalaxyBackground.tsx`/`BirdBackground.tsx` — three of the twelve
(Project Control, Purple Planet, Bird) a `<video>`, not a WebGL scene, same
singleton, mount-once-at-root
shape, `HeroScene`/
`createSolarisHeroScene`|`createAetherFluxHeroScene`|
`createEinsteinRosenLatticeHeroScene`|`createGoldenParthenonHeroScene`|
`createNegentropyHeroScene`|`createAureoleHeroScene`|
`createSpiralGalaxyHeroScene`|`createAurumPeakHeroScene`|
`createPinwheelGalaxyHeroScene` (or
`VideoBackground` for Project Control/
Purple Planet/Bird) inside a `pointer-events-none fixed inset-0 z-0` container
rather than a section-scoped one — every page section plus `Footer`
carries its own `relative z-10` precisely so it still stacks above this
canvas, see
ADR-0039/ADR-0042/ADR-0044/ADR-0045/ADR-0047/ADR-0048/ADR-0050/ADR-0051/ADR-0052/ADR-0053/ADR-0054/ADR-0055/ADR-0057).
Every other route,
including the homepage, keeps the globe and the ambient wireframe shapes
unchanged. Two heavy fixed WebGL backgrounds on one page reads as a
mistake, not a choice
— `GLASS_BACKGROUND_ROUTES` is the one place this
project maintains a list of
routes where a background scene is route-conditional; `CustomCursor`/
`Footer`/`Nav` read the same list to swap in their own glass-page
treatment. See ADR-0037, ADR-0040, ADR-0042, ADR-0044.

## Scroll & state

| Package | Version | Role |
|---------|---------|------|
| `lenis` | `^1.3.26` | Smooth scrolling |
| `zustand` | `^5.0.15` | Lightweight global state (scroll store) |
| `resize-observer-polyfill` | `^1.5.1` | ResizeObserver fallback for animation hooks |
| `zod` | `^4.4.3` | Schema validation — env (`src/env.ts`) + API payloads. See [[api-architecture]] |

See [[smooth-scroll]] and [[data-flow]].

## Misc

No miscellaneous runtime dependencies. Cookie consent is an in-house component
(`src/components/common/Cookie/`) built on Zustand + `@react-spring/web` — the
former `react-cookie-consent` package was removed. See [[components/common]].

## Tooling

| Package | Role |
|---------|------|
| `eslint` `^9` + `eslint-config-next` | Linting — run `yarn lint` before commits |
| `@types/*` | Type definitions for node/react |

## Scripts

```bash
yarn dev      # next dev — local development
yarn build    # next build — production build
yarn start    # next start — serve production build
yarn lint     # eslint
```

Package manager: **Yarn** (`yarn.lock` is committed). This project's local dev
machine has no admin rights to enable Corepack, so installs here were run with
`npm` (`package-lock.json` alongside `yarn.lock`) — prefer `yarn` if available in
your environment; `npm install` / `npm run <script>` work identically otherwise.

## Runtime

**Node ≥ 20.19.0**, declared in `package.json` `engines` and pinned for local dev
by `.nvmrc` (24.16.0). Next 16 itself only needs ≥ 20.9, but the ESLint 9
toolchain pulls `eslint-visitor-keys@5`, which requires
`^20.19.0 || ^22.13.0 || >=24` — on Node 20.17 `yarn install` **fails outright**,
which is why the floor is declared rather than left implicit.

## Deliberately held back

Three dependencies are **not** on latest, each for a verified reason (ADR-0022).
Re-test these periodically rather than assuming they are still blocked:

| Package | Held at | Latest | Why |
|---------|---------|--------|-----|
| `typescript` | `^5.9.3` | `7.0.2` | `eslint-config-next` depends on `typescript-eslint@8`, whose peer range is `typescript >=4.8.4 <6.1.0`. TS 7 (the native Go compiler, GA July 2026) would break linting. Revisit when typescript-eslint supports it. |
| `eslint` | `^9.39.4` | `10.8.1` | **Tested and reverted.** ESLint 10 crashes `eslint-plugin-react` (`context.getFilename()` was removed): `TypeError: contextOrFilename.getFilename is not a function`. Three of Next's bundled plugins still declare `eslint ^9` peers. |
| `@types/node` | `^24` | `26.2.0` | Tracks the Node major actually in use (24), not the newest published. |

## Not in the starter — chosen, but added per project

The starter stays dependency-light; these are the **decided** defaults, installed
only when a project needs them (ADR-0020):

| Need | Choice | Playbook |
|------|--------|----------|
| CMS | Payload (in-app, Next-native) | [[cms-payload]] · `/cms` |
| Database | Supabase Postgres | [[database-supabase]] · `/db` |
| File storage | Supabase Storage (S3-compatible) | [[cms-payload]] |
| Auth | Supabase Auth (`@supabase/ssr`) — only with real user accounts | [[database-supabase]] |

> [!note] Payload compatibility — satisfied as of 2026-08-18
> `@payloadcms/next` 3.88 peer-requires `next >=16.2.6 <17`. The starter is on
> `16.3.1`, so it now satisfies that range. Re-check when either side moves.

i18n was adopted 2026-08-23 and fully removed 2026-09-01 under explicit user
direction — the site is English-only again, no nav language switcher, no
`app/api/translate` proxy, no `zod`/`zustand` i18n plumbing. See ADR-0077 in
[[decisions-log]]. Still undecided: payments, data-fetching libraries,
testing. Document here when adopted and add an ADR to [[decisions-log]].

## Related

[[system-overview]] · [[folder-structure]]
