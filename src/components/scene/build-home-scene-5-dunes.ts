/**
 * Home Scene 5 — Desert Dune Particles
 * Flowing golden sand-dune particle field — aerial desert view.
 * TeamCTA + Contact sections.
 */
import * as THREE from "three";
import type { HeroSceneHandle } from "./hero-scene-types";

export const createHomeDunesScene = (container: HTMLElement): HeroSceneHandle => {
  const W = container.clientWidth || window.innerWidth;
  const H = container.clientHeight || window.innerHeight;

  const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setSize(W, H);
  renderer.setClearColor(0x010408, 1);
  const canvas = renderer.domElement;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, W / H, 0.1, 100);
  camera.position.set(0, 4, 8);
  camera.lookAt(0, 0, 0);

  // ---- Dune surface via sine waves ----------------------------------------
  const DW = 50, DH = 50;
  const duneGeo = new THREE.PlaneGeometry(16, 12, DW - 1, DH - 1);
  duneGeo.rotateX(-Math.PI / 2);
  const dunePos = duneGeo.attributes.position as THREE.BufferAttribute;
  const duneBase = new Float32Array(dunePos.count * 3);
  for (let i = 0; i < dunePos.count; i++) {
    const x = dunePos.getX(i);
    const z = dunePos.getZ(i);
    const y = Math.sin(x * 0.4) * 0.8
            + Math.sin(x * 0.9 + z * 0.3) * 0.4
            + Math.cos(z * 0.5) * 0.3;
    dunePos.setY(i, y - 0.5);
    duneBase[i*3] = x; duneBase[i*3+1] = y - 0.5; duneBase[i*3+2] = z;
  }
  dunePos.needsUpdate = true;
  duneGeo.computeVertexNormals();
  const duneMat = new THREE.MeshBasicMaterial({ color: 0x8d6e3f, wireframe: true, transparent: true, opacity: 0.22 });
  scene.add(new THREE.Mesh(duneGeo, duneMat));

  // ---- Sand particles streaming over dunes --------------------------------
  const GRAIN_COUNT = 1800;
  const grainPos  = new Float32Array(GRAIN_COUNT * 3);
  const grainVel  = new Float32Array(GRAIN_COUNT);  // wind speed
  const grainPhase = new Float32Array(GRAIN_COUNT);
  for (let i = 0; i < GRAIN_COUNT; i++) {
    grainPos[i*3]   = (Math.random() - 0.5) * 16;
    grainPos[i*3+1] = (Math.random() - 0.5) * 2.5;
    grainPos[i*3+2] = (Math.random() - 0.5) * 12;
    grainVel[i]     = 0.01 + Math.random() * 0.025;
    grainPhase[i]   = Math.random() * Math.PI * 2;
  }
  const grainGeo = new THREE.BufferGeometry();
  grainGeo.setAttribute("position", new THREE.BufferAttribute(grainPos, 3));
  const grainMat = new THREE.PointsMaterial({ color: 0xd4a853, size: 0.03, transparent: true, opacity: 0.55, sizeAttenuation: true });
  scene.add(new THREE.Points(grainGeo, grainMat));

  // ---- Crest highlight lines (dune ridges) --------------------------------
  const RIDGE_COUNT = 8;
  for (let i = 0; i < RIDGE_COUNT; i++) {
    const z = (i / RIDGE_COUNT - 0.5) * 10;
    const pts: THREE.Vector3[] = [];
    for (let x = -8; x <= 8; x += 0.3) {
      const y = Math.sin(x * 0.4) * 0.8 + Math.sin(x * 0.9 + z * 0.3) * 0.4 + Math.cos(z * 0.5) * 0.3 - 0.5 + 0.04;
      pts.push(new THREE.Vector3(x, y, z));
    }
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const mat = new THREE.LineBasicMaterial({ color: 0xe6c47a, transparent: true, opacity: 0.45 });
    scene.add(new THREE.Line(geo, mat));
  }

  let ptrX = 0, ptrY = 0;

  const renderFrame = (t: number) => {
    const pos = grainGeo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < GRAIN_COUNT; i++) {
      // Wind: particles drift in +X direction with some vertical bob
      let x = pos.getX(i) + grainVel[i];
      if (x > 8.5) x = -8.5;
      const y = pos.getY(i) + Math.sin(t * 2 + grainPhase[i]) * 0.002;
      pos.setX(i, x);
      pos.setY(i, y);
    }
    pos.needsUpdate = true;

    // Dune surface slow shift
    const dp = duneGeo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < dp.count; i++) {
      dp.setY(i, duneBase[i*3+1] + Math.sin(t * 0.25 + duneBase[i*3] * 0.3) * 0.05);
    }
    dp.needsUpdate = true;

    camera.position.x += (ptrX * 0.4 - camera.position.x) * 0.03;
    camera.position.y += (4 - ptrY * 0.3 - camera.position.y) * 0.03;
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
