/**
 * Home Scene 3 — Sonar / Bathymetric Sweep
 * Circular radar rings expanding over a glowing terrain wireframe.
 * RecentCommissions + TeamExperience + Stats sections.
 */
import * as THREE from "three";
import type { HeroSceneHandle } from "./hero-scene-types";

export const createHomeSonarScene = (container: HTMLElement): HeroSceneHandle => {
  const W = container.clientWidth || window.innerWidth;
  const H = container.clientHeight || window.innerHeight;

  const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setSize(W, H);
  renderer.setClearColor(0x010408, 1);
  const canvas = renderer.domElement;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 100);
  camera.position.set(0, 5, 8);
  camera.lookAt(0, 0, 0);

  // ---- Terrain grid --------------------------------------------------------
  const GRID_W = 36, GRID_H = 24;
  const terrainGeo = new THREE.PlaneGeometry(14, 9, GRID_W - 1, GRID_H - 1);
  terrainGeo.rotateX(-Math.PI / 2);
  const terrainPos = terrainGeo.attributes.position as THREE.BufferAttribute;
  const terrainBase = new Float32Array(terrainPos.count * 3);
  for (let i = 0; i < terrainPos.count; i++) {
    const x = terrainPos.getX(i);
    const z = terrainPos.getZ(i);
    const y = Math.sin(x * 0.5) * 0.4 + Math.cos(z * 0.7) * 0.3
            + Math.sin(x * 1.2 + z * 0.8) * 0.2;
    terrainPos.setY(i, y - 1.5);
    terrainBase[i*3]   = terrainPos.getX(i);
    terrainBase[i*3+1] = y - 1.5;
    terrainBase[i*3+2] = terrainPos.getZ(i);
  }
  terrainPos.needsUpdate = true;
  terrainGeo.computeVertexNormals();
  const terrainMat = new THREE.MeshBasicMaterial({ color: 0x0d6e7a, wireframe: true, transparent: true, opacity: 0.35 });
  scene.add(new THREE.Mesh(terrainGeo, terrainMat));

  // ---- Sonar rings ---------------------------------------------------------
  const RING_COUNT = 5;
  const sonarRings: { mesh: THREE.Mesh; phase: number }[] = [];
  for (let i = 0; i < RING_COUNT; i++) {
    const geo = new THREE.RingGeometry(0.01, 0.06, 48);
    geo.rotateX(-Math.PI / 2);
    const mat = new THREE.MeshBasicMaterial({ color: 0x00e5ff, transparent: true, opacity: 0, side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.y = -1.0;
    scene.add(mesh);
    sonarRings.push({ mesh, phase: (i / RING_COUNT) * Math.PI * 2 });
  }

  // ---- Data dots on terrain ------------------------------------------------
  const DOT_COUNT = 120;
  const dotPos = new Float32Array(DOT_COUNT * 3);
  for (let i = 0; i < DOT_COUNT; i++) {
    const x = (Math.random() - 0.5) * 13;
    const z = (Math.random() - 0.5) * 8;
    const y = Math.sin(x * 0.5) * 0.4 + Math.cos(z * 0.7) * 0.3 + Math.sin(x * 1.2 + z * 0.8) * 0.2 - 1.5;
    dotPos[i*3] = x; dotPos[i*3+1] = y + 0.05; dotPos[i*3+2] = z;
  }
  const dotGeo = new THREE.BufferGeometry();
  dotGeo.setAttribute("position", new THREE.BufferAttribute(dotPos, 3));
  const dotMat = new THREE.PointsMaterial({ color: 0x00e5ff, size: 0.07, transparent: true, opacity: 0.5 });
  scene.add(new THREE.Points(dotGeo, dotMat));

  let ptrX = 0, ptrY = 0;

  const renderFrame = (t: number) => {
    // Expand sonar rings outward
    sonarRings.forEach(({ mesh, phase }) => {
      const p = ((t * 0.4 + phase / (Math.PI * 2)) % 1.0);
      const r = p * 9;
      const geo = mesh.geometry as THREE.RingGeometry;
      mesh.scale.setScalar(r + 0.01);
      (mesh.material as THREE.MeshBasicMaterial).opacity = (1 - p) * 0.6;
    });

    // Terrain gentle undulation
    const pos = terrainGeo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      pos.setY(i, terrainBase[i*3+1] + Math.sin(t * 0.4 + terrainBase[i*3] * 0.3) * 0.06);
    }
    pos.needsUpdate = true;

    camera.position.x += (ptrX * 0.6 - camera.position.x) * 0.03;
    camera.position.y += (5 + ptrY * 0.3 - camera.position.y) * 0.03;
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
