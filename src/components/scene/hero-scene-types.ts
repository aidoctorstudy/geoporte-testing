/**
 * Shared handle shape for every full-bleed, own-render-loop 3D scene in this
 * codebase — the homepage digital-twin hero and each service detail page's
 * bespoke hero. `HeroScene.tsx` is generic over any factory returning this
 * shape, via its `createScene` prop.
 */
export interface HeroSceneHandle {
  renderStatic: () => void;
  renderFrame: (elapsedSeconds: number) => void;
  resize: (width: number, height: number) => void;
  /** Normalized pointer position (-1..1 each axis) — drives a subtle camera
   * parallax. Call from a `pointermove` listener; omit calls entirely (never
   * call) to leave the camera on its idle drift only. */
  setPointer: (x: number, y: number) => void;
  /** 0..1 scroll progress through the hero's own trigger range (fed by a
   * `<SpringTrigger mode="scrub">` wrapping the hero, not the whole-page
   * scroll signal) — drives the camera zooming/descending toward the
   * geological strata as the user scrolls past the hero. Optional: a factory
   * that doesn't implement scroll-driven framing can simply not call it. */
  setScrollProgress?: (progress: number) => void;
  dispose: () => void;
  canvas: HTMLCanvasElement;
}
