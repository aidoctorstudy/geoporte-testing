/**
 * Home Scene 2 — FEA Stress Mesh
 * Glowing node network simulating finite element analysis.
 * GeotechnicalPlexus + HowWeWork + ProjectExperience sections.
 */
import * as THREE from "three";
import type { HeroSceneHandle } from "./hero-scene-types";

export const createHomeFEAScene = (container: HTMLElement): HeroSceneHandle => {
  const W = container.clientWidth || window.innerWidth;
  const H = container.clientHeight || window.innerHeight;

  const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setSize(W, H);
  renderer.setClearColor(0x010408, 1);
  const canvas = renderer.domElement;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, W / H, 0.1, 100);
  camera.position.set(0, 0, 7);

  // ---- FEA grid nodes -------------------------------------------------------
  const COLS = 22, ROWS = 14;
  const SPACING = 0.52;
  const nodePositions: THREE.Vector3[] = [];
  const nodePhases: number[] = [];

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const x = (c - COLS / 2) * SPACING;
      const y = (r - ROWS / 2) * SPACING;
      nodePositions.push(new THREE.Vector3(x, y, 0));
      nodePhases.push(Math.random() * Math.PI * 2);
    }
  }

  // Node points
  const nodeGeo = new THREE.BufferGeometry();
  const nodePos = new Float32Array(nodePositions.length * 3);
  nodePositions.forEach((v, i) => { nodePos[i*3]=v.x; nodePos[i*3+1]=v.y; nodePos[i*3+2]=v.z; });
  nodeGeo.setAttribute("position", new THREE.BufferAttribute(nodePos, 3));
  const nodeMat = new THREE.PointsMaterial({ color: 0x26c6da, size: 0.07, transparent: true, opacity: 0.85 });
  scene.add(new THREE.Points(nodeGeo, nodeMat));

  // Grid edges (horizontal + vertical + diagonal)
  const edgeVerts: number[] = [];
  const addEdge = (a: THREE.Vector3, b: THREE.Vector3) => {
    edgeVerts.push(a.x,a.y,a.z, b.x,b.y,b.z);
  };
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const idx = r * COLS + c;
      if (c < COLS - 1) addEdge(nodePositions[idx], nodePositions[idx + 1]);
      if (r < ROWS - 1) addEdge(nodePositions[idx], nodePositions[idx + COLS]);
      if (r < ROWS - 1 && c < COLS - 1) addEdge(nodePositions[idx], nodePositions[idx + COLS + 1]);
    }
  }
  const edgeGeo = new THREE.BufferGeometry();
  edgeGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(edgeVerts), 3));
  const edgeMat = new THREE.LineBasicMaterial({ color: 0x00838f, transparent: true, opacity: 0.18 });
  scene.add(new THREE.LineSegments(edgeGeo, edgeMat));

  // ---- Stress pulse wave ---------------------------------------------------
  // A travelling horizontal wave that lights up rows of nodes
  let ptrX = 0, ptrY = 0;

  const renderFrame = (t: number) => {
    // Animate node z-positions (wave deformation)
    const pos = nodeGeo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < nodePositions.length; i++) {
      const baseX = nodePositions[i].x;
      const baseY = nodePositions[i].y;
      const wave = Math.sin(t * 1.1 + baseX * 0.6 + nodePhases[i] * 0.3) * 0.14
                 + Math.sin(t * 0.7 + baseY * 0.4) * 0.08;
      pos.setZ(i, wave);
    }
    pos.needsUpdate = true;

    // Camera gentle drift
    camera.position.x += (ptrX * 0.5 - camera.position.x) * 0.03;
    camera.position.y += (ptrY * 0.25 + 0.3 - camera.position.y) * 0.03;
    camera.lookAt(0, 0, 0);

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
