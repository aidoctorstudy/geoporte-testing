/**
 * Home Scene 4 — Pile Matrix
 * A deep grid of driven piles descending into rock — glowing columns
 * with load-transfer ripples at the pile-cap level.
 * WhoWeWorkFor + Insight + Projects sections.
 */
import * as THREE from "three";
import type { HeroSceneHandle } from "./hero-scene-types";

export const createHomePileMatrixScene = (container: HTMLElement): HeroSceneHandle => {
  const W = container.clientWidth || window.innerWidth;
  const H = container.clientHeight || window.innerHeight;

  const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setSize(W, H);
  renderer.setClearColor(0x010408, 1);
  const canvas = renderer.domElement;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, W / H, 0.1, 100);
  camera.position.set(0, 3, 10);
  camera.lookAt(0, -1, 0);

  // ---- Ground plane (pile-cap level) ----------------------------------------
  const groundGeo = new THREE.PlaneGeometry(18, 14, 1, 1);
  groundGeo.rotateX(-Math.PI / 2);
  const groundMat = new THREE.MeshBasicMaterial({ color: 0x1a2a3a, transparent: true, opacity: 0.5 });
  scene.add(new THREE.Mesh(groundGeo, groundMat));

  // Ground grid lines
  const gridHelper = new THREE.GridHelper(16, 20, 0x1e4060, 0x1e4060);
  (gridHelper.material as THREE.LineBasicMaterial).transparent = true;
  (gridHelper.material as THREE.LineBasicMaterial).opacity = 0.3;
  scene.add(gridHelper);

  // ---- Pile columns --------------------------------------------------------
  const PILE_COLS = 9, PILE_ROWS = 7;
  const PILE_SPACING = 1.6;
  const PILE_DEPTH = 5.5;
  const pileData: { line: THREE.Line; x: number; z: number; phase: number; glowMat: THREE.LineBasicMaterial }[] = [];

  for (let r = 0; r < PILE_ROWS; r++) {
    for (let c = 0; c < PILE_COLS; c++) {
      const x = (c - (PILE_COLS - 1) / 2) * PILE_SPACING;
      const z = (r - (PILE_ROWS - 1) / 2) * PILE_SPACING;
      const geo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(x, 0, z),
        new THREE.Vector3(x, -PILE_DEPTH, z),
      ]);
      const mat = new THREE.LineBasicMaterial({ color: 0x1565c0, transparent: true, opacity: 0.5 });
      const line = new THREE.Line(geo, mat);
      scene.add(line);

      // Pile cap dot
      const capGeo = new THREE.CircleGeometry(0.1, 8);
      capGeo.rotateX(-Math.PI / 2);
      const capMat = new THREE.MeshBasicMaterial({ color: 0x42a5f5, transparent: true, opacity: 0.8 });
      const cap = new THREE.Mesh(capGeo, capMat);
      cap.position.set(x, 0.01, z);
      scene.add(cap);

      pileData.push({ line, x, z, phase: (c + r * PILE_COLS) / (PILE_COLS * PILE_ROWS) * Math.PI * 2, glowMat: mat });
    }
  }

  // ---- Load ripple rings ---------------------------------------------------
  const RIPPLE_COUNT = 4;
  const ripples: { ring: THREE.Mesh; phase: number }[] = [];
  for (let i = 0; i < RIPPLE_COUNT; i++) {
    const geo = new THREE.RingGeometry(0.1, 0.18, 32);
    geo.rotateX(-Math.PI / 2);
    const mat = new THREE.MeshBasicMaterial({ color: 0x42a5f5, transparent: true, opacity: 0, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(geo, mat);
    ring.position.y = 0.02;
    scene.add(ring);
    ripples.push({ ring, phase: (i / RIPPLE_COUNT) * Math.PI * 2 });
  }

  let ptrX = 0, ptrY = 0;

  const renderFrame = (t: number) => {
    // Pile load pulse — each pile brightens in sequence
    pileData.forEach(({ glowMat, phase }) => {
      const pulse = (Math.sin(t * 1.2 + phase) + 1) / 2;
      glowMat.opacity = 0.3 + pulse * 0.5;
      glowMat.color.setHex(pulse > 0.7 ? 0x64b5f6 : 0x1565c0);
    });

    // Ripple rings expand
    ripples.forEach(({ ring, phase }) => {
      const p = ((t * 0.35 + phase / (Math.PI * 2)) % 1.0);
      ring.scale.setScalar(1 + p * 7);
      (ring.material as THREE.MeshBasicMaterial).opacity = (1 - p) * 0.5;
    });

    camera.position.x += (ptrX * 0.5 - camera.position.x) * 0.03;
    camera.position.y += (3 - ptrY * 0.3 - camera.position.y) * 0.03;
    camera.lookAt(0, -1, 0);

    renderer.render(scene, camera);
  };

  return {
    canvas,
    renderFrame,
    renderStatic: () => renderFrame(0),
    resize: (w, h) => {
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    },
    setPointer: (x, y) => { ptrX = x; ptrY = y; },
    dispose: () => { renderer.dispose(); scene.clear(); },
  };
};
