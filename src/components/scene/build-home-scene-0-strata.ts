/**
 * Home Scene 0 — Soil Strata
 * Subtle geological cross-section viewed from the side.
 * Camera is far back so layers appear as thin atmospheric bands.
 */
import * as THREE from "three";
import type { HeroSceneHandle } from "./hero-scene-types";

export const createHomeStrataScene = (container: HTMLElement): HeroSceneHandle => {
  const W = container.clientWidth || window.innerWidth;
  const H = container.clientHeight || window.innerHeight;

  const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setSize(W, H);
  renderer.setClearColor(0x01040e, 1);
  const canvas = renderer.domElement;
  canvas.style.display = "block";
  canvas.style.width = "100%";
  canvas.style.height = "100%";

  const scene = new THREE.Scene();

  // Camera far back — layers appear thin and atmospheric
  const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 500);
  camera.position.set(0, 0, 28);
  camera.lookAt(0, 0, 0);

  // Geological layers — 7 thin horizontal bands spread across a wide canvas
  const LAYERS = [
    { y: 3.5,  h: 0.35, color: 0x8b7355 },  // FILL — sandy brown
    { y: 2.6,  h: 0.30, color: 0xc8a96e },  // SAND — warm tan
    { y: 1.75, h: 0.28, color: 0x9e8a6a },  // SILTY SAND — mid tan
    { y: 0.9,  h: 0.25, color: 0x5a7a5e },  // SILTY CLAY — olive green
    { y: 0.0,  h: 0.22, color: 0x3d6b7a },  // WEATHERED ROCK — slate teal
    { y: -0.9, h: 0.20, color: 0x2a4f6e },  // MEDIUM ROCK — mid blue
    { y: -1.8, h: 0.18, color: 0x1a3550 },  // COMPETENT ROCK — deep navy
  ];

  LAYERS.forEach(({ y, h, color }) => {
    const geo = new THREE.PlaneGeometry(80, h);
    const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.55 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(0, y, -2);
    scene.add(mesh);

    // dark separator line
    const lineGeo = new THREE.PlaneGeometry(80, 0.012);
    const lineMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.7 });
    const line = new THREE.Mesh(lineGeo, lineMat);
    line.position.set(0, y - h / 2, -1.9);
    scene.add(line);
  });

  // Rising data particles — small cyan dots drifting upward slowly
  const GRAIN = 600;
  const pPos = new Float32Array(GRAIN * 3);
  const pSpeed = new Float32Array(GRAIN);
  for (let i = 0; i < GRAIN; i++) {
    pPos[i*3]   = (Math.random() - 0.5) * 36;
    pPos[i*3+1] = (Math.random() - 0.5) * 10;
    pPos[i*3+2] = (Math.random() - 0.5) * 4;
    pSpeed[i]   = 0.003 + Math.random() * 0.008;
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
  const pMat = new THREE.PointsMaterial({ color: 0x4fc3f7, size: 0.04, transparent: true, opacity: 0.5, sizeAttenuation: true });
  scene.add(new THREE.Points(pGeo, pMat));

  // 3 borehole vertical lines
  for (let i = 0; i < 3; i++) {
    const x = [-8, 0, 8][i];
    const pts = [new THREE.Vector3(x, 5, 0), new THREE.Vector3(x, -3, 0)];
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const mat = new THREE.LineBasicMaterial({ color: 0x4fc3f7, transparent: true, opacity: 0.3 });
    scene.add(new THREE.Line(geo, mat));
  }

  let ptrX = 0;

  const renderFrame = (t: number) => {
    // drift particles upward, wrap
    const pos = pGeo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < GRAIN; i++) {
      let y = pos.getY(i) + pSpeed[i];
      if (y > 5.5) y = -5.5;
      pos.setY(i, y);
    }
    pos.needsUpdate = true;

    // very subtle camera parallax on mouse
    camera.position.x += (ptrX * 1.5 - camera.position.x) * 0.02;

    // slow horizontal camera drift
    camera.position.x += Math.sin(t * 0.05) * 0.002;

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
    setPointer: (x, y) => { ptrX = x; },
    dispose: () => { renderer.dispose(); scene.clear(); },
  };
};
