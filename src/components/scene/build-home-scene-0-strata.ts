/**
 * Home Scene 0 — Soil Strata
 * Horizontal geological layer bands with slow upward particle data pulses.
 * Hero + About sections.
 */
import * as THREE from "three";
import type { HeroSceneHandle } from "./hero-scene-types";

export const createHomeStrataScene = (container: HTMLElement): HeroSceneHandle => {
  const W = container.clientWidth || window.innerWidth;
  const H = container.clientHeight || window.innerHeight;

  const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setSize(W, H);
  renderer.setClearColor(0x010408, 1);
  const canvas = renderer.domElement;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 100);
  camera.position.set(0, 0, 5);

  // ---- Strata bands -------------------------------------------------------
  const LAYERS = [
    { y: 2.2,  h: 0.55, color: 0xc8a96e, label: "FILL"              },
    { y: 1.4,  h: 0.6,  color: 0x8b7355, label: "SAND"              },
    { y: 0.5,  h: 0.65, color: 0x6b8e6e, label: "SILTY CLAY"        },
    { y: -0.4, h: 0.7,  color: 0x4a7c8e, label: "WEATHERED ROCK"    },
    { y: -1.4, h: 0.8,  color: 0x2d5a7a, label: "MEDIUM ROCK"       },
    { y: -2.5, h: 1.0,  color: 0x1a3f5c, label: "COMPETENT ROCK"    },
  ];

  const strataGroup = new THREE.Group();
  LAYERS.forEach(({ y, h, color }) => {
    // base plane
    const geo = new THREE.PlaneGeometry(20, h, 60, 1);
    // subtle noise on vertices
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      pos.setY(i, pos.getY(i) + (Math.random() - 0.5) * 0.08);
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
    const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.55 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(0, y, -2);
    strataGroup.add(mesh);

    // thin bright seam line at top of each layer
    const seamGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-10, y + h / 2, -1.9),
      new THREE.Vector3(10,  y + h / 2, -1.9),
    ]);
    const seamMat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.9 });
    strataGroup.add(new THREE.Line(seamGeo, seamMat));
  });
  scene.add(strataGroup);

  // ---- Data-pulse particles -----------------------------------------------
  const PARTICLE_COUNT = 320;
  const pPositions = new Float32Array(PARTICLE_COUNT * 3);
  const pSpeeds    = new Float32Array(PARTICLE_COUNT);
  const pPhases    = new Float32Array(PARTICLE_COUNT);
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    pPositions[i * 3]     = (Math.random() - 0.5) * 14;
    pPositions[i * 3 + 1] = (Math.random() - 0.5) * 8;
    pPositions[i * 3 + 2] = -1.5 + Math.random() * 0.5;
    pSpeeds[i]  = 0.3 + Math.random() * 0.5;
    pPhases[i]  = Math.random() * Math.PI * 2;
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute("position", new THREE.BufferAttribute(pPositions, 3));
  const pMat = new THREE.PointsMaterial({ color: 0x4fc3f7, size: 0.04, transparent: true, opacity: 0.7, sizeAttenuation: true });
  const particles = new THREE.Points(pGeo, pMat);
  scene.add(particles);

  // ---- Borehole lines -----------------------------------------------------
  const BOREHOLES = [-5, -1.5, 2, 5.5];
  BOREHOLES.forEach(x => {
    const geo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(x, 3, -1.8),
      new THREE.Vector3(x, -3.5, -1.8),
    ]);
    const mat = new THREE.LineBasicMaterial({ color: 0x80cbc4, transparent: true, opacity: 0.4 });
    scene.add(new THREE.Line(geo, mat));
  });

  // ---- Render --------------------------------------------------------------
  let ptrX = 0, ptrY = 0;

  const renderFrame = (t: number) => {
    // Particle rise
    const pos = pGeo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      let y = pos.getY(i) + pSpeeds[i] * 0.008;
      if (y > 4.5) y = -4.5;
      pos.setY(i, y);
      // gentle horizontal wobble
      const x = pos.getX(i) + Math.sin(t * 0.5 + pPhases[i]) * 0.001;
      pos.setX(i, x);
    }
    pos.needsUpdate = true;

    // Subtle parallax
    camera.position.x += (ptrX * 0.3 - camera.position.x) * 0.03;
    camera.position.y += (ptrY * 0.15 - camera.position.y) * 0.03;
    camera.lookAt(0, 0, 0);

    // Strata slow drift
    strataGroup.position.x = Math.sin(t * 0.05) * 0.08;

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
