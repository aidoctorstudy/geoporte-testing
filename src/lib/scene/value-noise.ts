/**
 * Small hash-based smooth value-noise, shared by scene builders that need
 * "slightly irregular" terrain/geology without pulling in a noise library
 * (`simplex-noise` isn't an installed dependency). Extracted from
 * `geotechnical-plexus/constants.ts` when `build-geotechnical-fea-scene.ts`
 * needed the same shape for its own terrain/soil layers — not simplex
 * noise, just plenty for gentle geological variation.
 */
import * as THREE from "three";

const hash2 = (x: number, y: number): number => {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
  return s - Math.floor(s);
};

/** Smooth (Hermite-interpolated) 2D value noise, range 0..1. */
export const smoothNoise2D = (x: number, y: number): number => {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const a = hash2(xi, yi);
  const b = hash2(xi + 1, yi);
  const c = hash2(xi, yi + 1);
  const d = hash2(xi + 1, yi + 1);
  return THREE.MathUtils.lerp(THREE.MathUtils.lerp(a, b, u), THREE.MathUtils.lerp(c, d, u), v);
};

/** 3-octave fractal value noise, range roughly 0..1. */
export const fbm2 = (x: number, y: number): number => {
  let amp = 0.5;
  let freq = 1;
  let sum = 0;
  let norm = 0;
  for (let i = 0; i < 3; i++) {
    sum += smoothNoise2D(x * freq, y * freq) * amp;
    norm += amp;
    amp *= 0.5;
    freq *= 2;
  }
  return sum / norm;
};

/** Signed noise (-1..1) — the form every height-offset call site wants. */
export const signedNoise = (x: number, y: number, seedOffset: number): number =>
  fbm2(x * 0.35 + seedOffset, y * 0.35 + seedOffset) * 2 - 1;
