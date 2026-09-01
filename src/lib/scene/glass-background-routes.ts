/**
 * Routes with their own fixed, full-page background (Solaris on
 * Geotechnical, Aether Flux on Design & Drafting, the Einstein–Rosen
 * Lattice wormhole on Structural Engineering, the Golden Parthenon on
 * Civil Engineering, Negentropy on Stormwater & Flood Modelling, the
 * Siloutte video on Project Control Services, the Aureole golden corona on
 * Advisory Services, the Spiral Galaxy on Telecom Services, the Purple
 * Planet video on the standalone `/projects` page, the Aurum Peak golden
 * summit on the standalone `/publications` page, the Pinwheel Galaxy on
 * the standalone `/about` page, its own much calmer starfield on
 * `/about/team` (`TeamStarfieldBackground.tsx` — see ADR-0072), and the
 * Bird video on the standalone `/contact` page — the last five routes here
 * that aren't under `/services/*` and aren't tied to a
 * `Service["sceneTheme"]` at all) —
 * every sitewide "ambient" layer (the drifting wireframe shapes, the
 * cinematic globe, the custom cursor dot, and the glass-panel content
 * treatment on Footer/Nav) checks this one list instead of each carrying
 * its own copy. A single route (ADR-0040/0041) was small enough to
 * duplicate per-file on purpose; a second route made that the same list
 * repeated five times, which is the point this project's own
 * token/component rules exist to avoid — see the ADR for this file in
 * decisions-log.md.
 *
 * `/services/geotechnical-engineering` was briefly removed from this list
 * mid-turn (an earlier draft of ADR-0061 retired Solaris entirely) and
 * restored on explicit user direction: Solaris stays as this page's
 * full-page fixed background, with the new bounded PLAXIS-inspired FEA
 * scene (`GeotechnicalAnalysisHero.tsx`) rendering on top of it inside the
 * hero section only — both visible together, not one replacing the other.
 */
export const GLASS_BACKGROUND_ROUTES: ReadonlySet<string> = new Set([
  "/services/geotechnical-engineering",
  "/services/design-and-drafting",
  "/services/structural-engineering",
  "/services/civil-engineering",
  "/services/stormwater-and-flood-modelling",
  "/services/project-control-services",
  "/services/advisory-services",
  "/services/telecom-services",
  "/projects",
  "/publications",
  "/about",
  "/about/team",
  "/contact",
]);

export const isGlassBackgroundRoute = (pathname: string | null): boolean =>
  pathname !== null && GLASS_BACKGROUND_ROUTES.has(pathname);
