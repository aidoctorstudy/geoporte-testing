---
tags: [frontend, stable]
updated: 2026-08-30
---

# Catalog — `/about/team`

Files in `src/views/about-team.tsx` + `src/views/about-team/`. See
[[decisions-log]] ADR-0076 for the full rationale — this note is the
catalog entry. (Superseded ADR-0074's WebGL "Mirror Hall", which itself
superseded ADR-0072's plain-grid architecture, which itself superseded
ADR-0062/ADR-0070's original Cards Cascade deck — see "History" at the
bottom before reaching for anything that describes any of those here.)

**Reachable from:** the primary nav ("Our Team", desktop `secondaryLinks`
in `Nav.tsx` and `MobileMenu.tsx`'s own `primaryLinks`), the footer's
"Company" column (`nav-links.ts`'s `primaryNavLinks`, shared by both), and
a `bg-accent` "Meet Our Team →" button in `/about`'s own team section
(`about.tsx`). These are three separate link arrays, not one shared
source — adding a nav destination means touching all three plus
`nav-links.ts`.

## `about-team.tsx` — `AboutTeamView`

The route's Server Component (`src/app/about/team/page.tsx` → this). Does
nothing but hand the real roster straight through:

```tsx
export function AboutTeamView() {
  return <TeamCascade members={teamMembers} />;
}
```

`teamMembers` (`@/data/mocks/team`) is passed unchanged — no second copy
of the roster exists anywhere in this feature. `TeamCascade` owns its own
in-page hero copy, so this Server Component carries none of its own.

## `about-team/team-cascade-config.ts` / `about-team/TeamCascade.tsx`

`/about/team`'s current "Cards Cascade" (ADR-0076) — a
`position: sticky`-style tall-track deck built with plain CSS 3D
transforms (`perspective`/`translate3d`/`rotateX`), no WebGL, no canvas.
Same architecture as `/projects`' own Cards Cascade
(`views/projects/projects-cascade-config.ts` / `ProjectsCascade.tsx`,
ADR-0075) — written as its own copy for this page's own data and hero
copy, not a shared component.

- `trackVh(total)` / `cascadeActiveIndex(p, total)` / `placeCascadeCard(d)`
  — a tall track sized to the real member count, a continuous "which card
  is active" position derived from overall scroll progress, and a
  symmetric fold placement (`d` = a member's index minus that continuous
  active position) applied as `translate3d` + `rotateX` + `scale` +
  opacity, spring-interpolated off one `interpolatedProgress` value (hard
  rule #1 — no `@keyframes`). `cascadeActiveIndex` is deliberately
  unclamped below 0 (only the upper end is clamped) — the projects page
  found and fixed the "first card sits at rest behind the hero for the
  whole intro" bug first (ADR-0075); this file starts from that fix.
- **Each card is two columns: photo left, full details right** — name
  (large), title (teal `ACCENT`), experience, full bio, and credential
  chips (all of `TeamMember`'s fields except `photo` itself), stacking to
  one column below `md`. The two-column block is one animated unit — the
  `placeCascadeCard` transform applies to the outer wrapper, so this
  layout change didn't touch the fold/depth animation at all, only what
  renders inside each card. A first version showed only the photo,
  centred, with name/title/experience overlaid on it (closer to Mirror
  Hall's own card face) — moved to two columns with the full bio and
  credentials surfaced per a follow-up request.
- **Accent colour is scoped, not global.** `ACCENT = "#5cc8d7"` (teal, not
  the sitewide blue `--accent`) is a local constant applied via inline
  `style`, not a new design token — this page's own brief explicitly
  wanted a different accent here, and touching the global token would
  have changed every other button/link sitewide. Same category of narrow,
  flagged exception as a WebGL scene's own CONFIG block.
- Same manual sticky-emulation ticker technique as `ProjectsShowreel.tsx`/
  `ProjectsCascade.tsx` (`position: sticky` does not work anywhere on this
  site — see ADR-0071's note on why) — this page now has its own copy of
  that workaround too, not a shared hook.
- `prefers-reduced-motion` gets a plain static grid of every member
  instead of the scroll-jacked fold — own copy, not reusing `TeamMemberCard`
  or `ProjectsCascade`'s grid — same rationale every scroll-driven section
  in this codebase already uses: the tall track has no natural slower
  version.

> [!warning] The CTA button's `scrollTo` needed a non-obvious fix (ADR-0076)
> Neither this codebase's shared `scrollTo()` helper (`@/utils/scroll-to`)
> nor Lenis's own `lenis.scrollTo()` actually scroll the page in this
> project's Lenis setup — confirmed live, not assumed. What works,
> confirmed repeatedly: get the real `Lenis` instance via
> `useScroll((s) => s.lenis)`, then `lenis.stop()` → a plain
> `window.scrollTo({ top, behavior: "instant" })` → `lenis.start()`.
> `behavior: "smooth"` was reliably cancelled by Lenis in this exact
> sequence, every time, even tested completely outside React — only
> `"instant"` reliably works. `ProjectsCascade.tsx`'s "Explore projects"
> button uses the identical pattern; if a future CTA on either page
> "does nothing" when clicked, check this before assuming a logic bug.

## History — what this page used to be

**ADR-0074 (superseded by ADR-0076, above):** "Mirror Hall" — a WebGL
carousel (`TeamMirrorHall.tsx` / `build-mirror-hall-scene.ts`): real
photos on a shallow 3D arc with pointer-drag/wheel/touch, a genuine
real-time water reflection (a second camera mirrored across a water
plane, rendered into a `WebGLRenderTarget` and sampled via screen-space
projective texturing — not a faked effect), a fixed-size ripple pool, and
a particle field. Replaced outright per an explicit later brief asking
for a pure-CSS-3D cascade instead of WebGL — **both files were deleted**,
not retired, since neither had any remaining importer anywhere in the
codebase once `about-team.tsx` stopped using them (unlike
`TeamStarfieldBackground.tsx`, which stays mounted sitewide in
`layout.tsx` and was only route-gated to empty — that file is unaffected
by this change). If you're looking for the water-reflection projective-
texturing technique, or the mirrored-camera reflection technique
generally, it no longer exists in this codebase — see ADR-0074 in the
decisions log for the full writeup of how it worked, kept there as
history even though the code is gone.

**ADR-0072 (superseded by ADR-0074):** a plain responsive grid —
`TeamMemberCard.tsx` inside an `<Inview>`-staggered `<ul>` grid, plus a
fixed full-page background scene, `TeamStarfieldBackground.tsx` /
`build-team-starfield-scene.ts` (one static `THREE.Points` cloud, ~950/
~550 particles desktop/tablet, no WebGL on mobile). Both files still exist
in the codebase — `TeamMemberCard.tsx` was Mirror Hall's WebGL-failure
fallback markup (that fallback no longer exists now that Mirror Hall is
gone; `TeamCascade`'s own reduced-motion path is a fresh, separate grid,
not a reuse of `TeamMemberCard`), and `TeamStarfieldBackground.tsx` stays
retired to an empty route set regardless of which foreground experience
this page runs. The starfield's shader is worth knowing about regardless:

> [!warning] `THREE.PointsMaterial` + `sizeAttenuation` is not a pixel size
> `gl_PointSize` there scales by `(rendererHeight/2) / -viewSpaceZ` — a
> `size` tuned to look like ~1.6px rendered as ~90px hard-edged squares for
> particles near the camera. Use a small custom `ShaderMaterial` instead: a
> per-vertex `size` attribute consumed as a **true, constant screen-space
> pixel size** (`gl_PointSize = size * uPixelRatio`, no perspective
> division), plus a circular alpha falloff in the fragment shader — the
> same pattern `build-planet-scene.ts`'s own `addStars()` uses. Reach for
> that pattern again before ever reaching for bare `THREE.PointsMaterial`
> with `sizeAttenuation` on a per-vertex-sized field.

**ADR-0062 (initial port) / ADR-0070 (re-tint + retune):** before the
grid, this page ran GetLayers' "Cards Cascade" section — a
`position: sticky` tall-track deck where scrolling folded through team
members one at a time (`TeamCascadeDeck.tsx`, `cascade-config.ts`'s
`placeCascadeCard` 3D-fold formula), paired with a `TeamBioPanel.tsx`
showing only the current "active" member, both owned by
`TeamCascadeExperience.tsx`. All four files were deleted in ADR-0072 — an
explicit brief made clear the deck/fold mechanic itself (not just its
tuning) was the problem at the time. (The *mechanic* came back in
ADR-0076 above, rebuilt from scratch with this codebase's current
conventions — not a restoration of these old, long-deleted files, which
no longer exist to restore.) If you find a stale reference to any of
`TeamCascadeDeck`/`TeamCascadeExperience`/`TeamBioPanel`/
`cascade-config.ts` elsewhere in the codebase or vault, it's leftover from
before that rewrite — safe to correct.

## Related

[[components/common]] · [[decisions-log]] ADR-0076 (current), ADR-0074,
ADR-0072, ADR-0062/ADR-0070 (all superseded) · [[animation-system]] ·
[[smooth-scroll]]
