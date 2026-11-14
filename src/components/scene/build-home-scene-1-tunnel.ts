/**
 * Home Scene 1 — TBM Tunnel Bore
 * A rotating wireframe tunnel boring machine drill head advancing through
 * a glowing rock cross-section. Services + Sectors sections.
 */
import * as THREE from "three";
import type { HeroSceneHandle } from "./hero-scene-types";

export const createHomeTunnelScene = (container: HTMLElement): HeroSceneHandle => {
  const W = container.clientWidth || window.innerWidth;
  const H = container.clientHeight || window.innerHeight;

  const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setSize(W, H);
  renderer.setClearColor(0x010408, 1);
  const canvas = renderer.domElement;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, W / H, 0.1, 200);
  camera.position.set(0, 0, 8);

  // ---- Tunnel tube (receding rings) ----------------------------------------
  const RING_COUNT = 24;
  const rings: THREE.Line[] = [];
  for (let i = 0; i < RING_COUNT; i++) {
    const z = -i * 1.1;
    const radius = 2.2;
    const segments = 48;
    const pts: THREE.Vector3[] = [];
    for (let s = 0; s <= segments; s++) {
      const a = (s / segments) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * radius, Math.sin(a) * radius, z));
    }
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const alpha = 1 - i / RING_COUNT;
    const mat = new THREE.LineBasicMaterial({ color: 0x1a9fce, transparent: true, opacity: alpha * 0.7 });
    const ring = new THREE.Line(geo, mat);
    scene.add(ring);
    rings.push(ring);
  }

  // ---- Longitudinal tunnel ribs ---------------------------------------------
  const RIB_COUNT = 12;
  for (let i = 0; i < RIB_COUNT; i++) {
    const a = (i / RIB_COUNT) * Math.PI * 2;
    const x = Math.cos(a) * 2.2;
    const y = Math.sin(a) * 2.2;
    const geo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(x, y, 0),
      new THREE.Vector3(x, y, -RING_COUNT * 1.1),
    ]);
    const mat = new THREE.LineBasicMaterial({ color: 0x0d6e96, transparent: true, opacity: 0.4 });
    scene.add(new THREE.Line(geo, mat));
  }

  // ---- TBM drill head (front cutter wheel) ---------------------------------
  const tbmGroup = new THREE.Group();
  // Outer ring
  const tbmRingGeo = new THREE.TorusGeometry(2.2, 0.06, 8, 48);
  const tbmMat = new THREE.MeshBasicMaterial({ color: 0x4fc3f7, wireframe: false });
  tbmGroup.add(new THREE.Mesh(tbmRingGeo, tbmMat));
  // Spokes
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const spokeGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(Math.cos(a) * 2.1, Math.sin(a) * 2.1, 0),
    ]);
    const spokeMat = new THREE.LineBasicMaterial({ color: 0x4fc3f7, transparent: true, opacity: 0.9 });
    tbmGroup.add(new THREE.Line(spokeGeo, spokeMat));
  }
  // Center hub
  const hubGeo = new THREE.CircleGeometry(0.3, 16);
  const hubMat = new THREE.MeshBasicMaterial({ color: 0x80deea });
  tbmGroup.add(new THREE.Mesh(hubGeo, hubMat));
  tbmGroup.position.set(0, 0, 0.1);
  scene.add(tbmGroup);

  // ---- Rock fragment particles -------------------------------------------
  const FRAG_COUNT = 180;
  const fragPos = new Float32Array(FRAG_COUNT * 3);
  const fragVel = new Float32Array(FRAG_COUNT * 3);
  for (let i = 0; i < FRAG_COUNT; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = Math.random() * 2.0;
    fragPos[i*3]   = Math.cos(a) * r;
    fragPos[i*3+1] = Math.sin(a) * r;
    fragPos[i*3+2] = -(Math.random() * 4);
    fragVel[i*3]   = (Math.random()-0.5) * 0.02;
    fragVel[i*3+1] = (Math.random()-0.5) * 0.02;
    fragVel[i*3+2] = -(0.02 + Math.random() * 0.04);
  }
  const fragGeo = new THREE.BufferGeometry();
  fragGeo.setAttribute("position", new THREE.BufferAttribute(fragPos, 3));
  const fragMat = new THREE.PointsMaterial({ color: 0xa0d4e8, size: 0.06, transparent: true, opacity: 0.6 });
  scene.add(new THREE.Points(fragGeo, fragMat));

  let ptrX = 0, ptrY = 0;

  const renderFrame = (t: number) => {
    // Rotate TBM
    tbmGroup.rotation.z = t * 0.6;

    // Tunnel rings pulse forward (simulates advancing)
    rings.forEach((ring, i) => {
      ring.position.z = ((ring.position.z + 0.012) % (RING_COUNT * 1.1));
      (ring.material as THREE.LineBasicMaterial).opacity =
        (1 - ((-ring.position.z) / (RING_COUNT * 1.1))) * 0.7;
    });

    // Rock fragments recede
    const pos = fragGeo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < FRAG_COUNT; i++) {
      let z = pos.getZ(i) + fragVel[i*3+2];
      if (z < -RING_COUNT * 1.1) z = -(Math.random() * 0.5);
      pos.setZ(i, z);
    }
    pos.needsUpdate = true;

    camera.position.x += (ptrX * 0.4 - camera.position.x) * 0.04;
    camera.position.y += (ptrY * 0.2 - camera.position.y) * 0.04;
    camera.lookAt(0, 0, -5);

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
