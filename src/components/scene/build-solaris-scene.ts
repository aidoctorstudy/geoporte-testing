/**
 * Solaris — the particle-sun scene from GetLayers' "Creative Studio" template
 * (`getlayers_search`/`getlayers_source`, id `creative-studio`), pulled and
 * ported verbatim — not the standalone "solaris" catalog scene used earlier,
 * which turned out to be an under-specified variant of this same effect.
 * Shaders, uniform names, the camera's offset framing, the sphere's own Y
 * offset, and the cursor-flare defaults are copied character for character
 * from `src/views/home/solaris/{shaders,solaris-scene}.tsx` and
 * `DEFAULT_SCENE_SETTINGS` in that template's `config.ts` — see ADR-0039.
 * Two deliberate, documented deviations only (both invisible to the
 * rendered look): this project's tier-based DPR clamp instead of a flat 2x,
 * and driving the render loop through `HeroScene.tsx`'s own rAF (this
 * project's established convention for "needs native frame timing, not the
 * shared spring ticker") instead of the template's shared-ticker hookup.
 *
 * Framework-free, same shape as `build-hero-scene.ts` — own renderer, own
 * render loop, implements `HeroSceneHandle`. One builder, two configurations
 * — colour is fixed regardless (per the template's own `config.ts`
 * comment: "the constants ARE the spec, not tunable project content"), and
 * bloom/particleSize are the same verbatim numbers on both, made to work at
 * both sizes by the template's own `vwScale` (see `computeVwScale`). The
 * card's only real deviations are `sphereSegments` and bloom threshold —
 * see `createSolarisCardScene`'s own comment for why. See `SolarisOptions`
 * and the two exported factories.
 */
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { getTierBudget } from "@/lib/scene/device-tier";
import type { HeroSceneHandle } from "./hero-scene-types";

// Verbatim from the template's config.ts. `colorWarm`/`colorCool` feed both
// the sphere gradient (through `invertGradient: true`, baked in below — so
// uColorTop is colorCool and uColorBottom is colorWarm) and the aurora
// (`color1`/`color2`, colorWarm/colorCool directly, no invert). Not a
// per-instance option — the template's own config.ts is explicit that these
// are fixed spec, not tunable content, and the hero/card ask are both this
// same amber/orange.
const SOLARIS_COLOR_WARM = 0xff301a;
const SOLARIS_COLOR_COOL = 0xff7033;
const PARTICLE_COLOR_TOP = SOLARIS_COLOR_COOL; // invertGradient: true
const PARTICLE_COLOR_BOTTOM = SOLARIS_COLOR_WARM;
const AURORA_COLOR_1 = SOLARIS_COLOR_WARM;
const AURORA_COLOR_2 = SOLARIS_COLOR_COOL;

const NOISE_SPEED = 1.41;
// Matches the template's own per-tick accumulation (`time += 0.005 *
// noiseSpeed` once per shared-ticker tick, ~60/s) but driven off real
// elapsed seconds instead of a tick count, since this scene's render loop
// is `HeroScene.tsx`'s own rAF (see file header), not the shared ticker.
const TIME_SCALE = 0.005 * 60 * NOISE_SPEED;

const SPHERE_RADIUS = 4.2;
const INTRO_SECONDS = 2.4;

// Verbatim from the template's own `solaris-scene.tsx`: particle size and
// bloom strength scale with the container's own width relative to a 1440
// design reference, clamped to [0.4, 1.5] — "so the sun keeps its
// proportions as the window shrinks/grows." This is what makes one shared
// bloom config (below) work for both the full hero and the small card: at
// ~275px the card lands at the 0.4 floor, tempering the same 2.33 strength
// down to a sane value instead of blowing its tiny buffer to white; a
// full-width hero lands near/above 1. Not an invented per-instance bloom
// tune — the template has no separate "card" bloom config, only this scale.
const computeVwScale = (width: number) => Math.min(Math.max(width / 1440, 0.4), 1.5);

// ---------------------------------------------------------------------------
// Shaders — verbatim from src/views/home/solaris/shaders.ts. Do not "clean
// up": the exact noise, masks, and constants define the look.
// ---------------------------------------------------------------------------

const bgVertexShader = /* glsl */ `
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = vec4(position, 1.0);
    }
`;

const bgFragmentShader = /* glsl */ `
    uniform float uTime;
    uniform float uScroll;
    uniform vec2 uResolution;
    uniform vec3 color1;
    uniform vec3 color2;
    varying vec2 vUv;

    // Morgan McGuire noise
    float hash(float n) { return fract(sin(n) * 1e4); }
    float hash(vec2 p) { return fract(1e4 * sin(17.0 * p.x + p.y * 0.1) * (0.1 + abs(sin(p.y * 13.0 + p.x)))); }
    float noise(vec2 x) {
        vec2 i = floor(x);
        vec2 f = fract(x);
        float a = hash(i);
        float b = hash(i + vec2(1.0, 0.0));
        float c = hash(i + vec2(0.0, 1.0));
        float d = hash(i + vec2(1.0, 1.0));
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
    }
    #define OCTAVES 4
    float fbm(vec2 x) {
        float v = 0.0;
        float a = 0.5;
        vec2 shift = vec2(100);
        mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.50));
        for (int i = 0; i < OCTAVES; ++i) {
            v += a * noise(x);
            x = rot * x * 2.0 + shift;
            a *= 0.5;
        }
        return v;
    }

    void main() {
        vec2 st = vUv;
        st.x *= uResolution.x / uResolution.y;

        // Faster animation + massive boost on scroll
        float t = uTime * 6.0 + uScroll * 150.0;

        // Scale coordinates for large, organic blurs
        vec2 st1 = st * 1.2;
        vec2 st2 = st * 1.6;

        // Shape 1: Deep Blue blurs (color2)
        float f1 = fbm(st1 + vec2(t * 0.15, t * 0.1));
        float mask1 = pow(fbm(st1 + f1 * 2.5 - vec2(t * 0.25, 0.0)), 2.0) * 3.5;

        // Shape 2: Blazing Orange blurs (color1)
        float f2 = fbm(st2 - vec2(t * 0.1, t * 0.2));
        float mask2 = pow(fbm(st2 + f2 * 2.0 + vec2(0.0, t * 0.2)), 2.5) * 4.0;

        // Additive blending for extreme saturation without muddy grays
        vec3 finalColor = color2 * mask1 + color1 * mask2;

        // Corner mask: hide the aurora in the center to keep focus on the 3D sphere
        // Using vUv ensures it stays perfectly centered regardless of devicePixelRatio!
        vec2 aspectUv = vUv - 0.5;
        aspectUv.x *= uResolution.x / uResolution.y;
        float centerDist = length(aspectUv);

        // Make the mask dynamic and organic!
        // Adding uScroll makes the "amoeba" actively spin and morph as you scroll
        float angle = atan(aspectUv.y, aspectUv.x) + uScroll * 15.0;
        // Combine a couple of slow sine waves to create an "amoeba" like breathing edge
        float maskOffset = sin(angle * 3.0 + t * 0.4) * 0.05
                         + sin(angle * 5.0 - t * 0.6) * 0.03;
        float dynamicDist = centerDist + maskOffset;

        // Push visibility entirely to the extreme corners
        float cornerFade = smoothstep(0.7, 1.15, dynamicDist);
        cornerFade = pow(cornerFade, 1.6);

        // Apply fade and reduce overall intensity to keep it subtle
        finalColor *= cornerFade * 0.9;

        // Deep dark background base
        vec3 baseBg = vec3(0.012, 0.012, 0.02);

        gl_FragColor = vec4(baseBg + finalColor, 1.0);
    }
`;

const particleVertexShader = /* glsl */ `
    uniform float uTime;
    uniform float uScroll;
    uniform float uIntro; // 0 = on-load filled/appearing, 1 = settled
    uniform vec3 uColorTop;    // warm — top of the gradient
    uniform vec3 uColorBottom; // cool — bottom of the gradient
    uniform vec3 uCursor;        // cursor hit point on the sphere surface (world space)
    uniform float uCursorStrength; // 0 = idle, 1 = pointer touching the sphere
    uniform float uCursorRadius;
    uniform float uCursorFlare;
    uniform float uCursorHeat;
    uniform float uParticleSize; // base point-size multiplier
    uniform float uDeform;       // breathing (noise) displacement amplitude
    varying float vEdgeFade;
    varying float vHeat;
    varying vec3 vColor;

    // 3D Simplex Noise
    vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
    vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
    float snoise(vec3 v){
      const vec2 C = vec2(1.0/6.0, 1.0/3.0); const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
      vec3 i = floor(v + dot(v, C.yyy)); vec3 x0 = v - i + dot(i, C.xxx);
      vec3 g = step(x0.yzx, x0.xyz); vec3 l = 1.0 - g;
      vec3 i1 = min(g.xyz, l.zxy); vec3 i2 = max(g.xyz, l.zxy);
      vec3 x1 = x0 - i1 + 1.0 * C.xxx; vec3 x2 = x0 - i2 + 2.0 * C.xxx; vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;
      i = mod(i, 289.0);
      vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));
      float n_ = 1.0/7.0; vec3 ns = n_ * D.wyz - D.xzx;
      vec4 j = p - 49.0 * floor(p * ns.z *ns.z);
      vec4 x_ = floor(j * ns.z); vec4 y_ = floor(j - 7.0 * x_);
      vec4 x = x_ *ns.x + ns.yyyy; vec4 y = y_ *ns.x + ns.yyyy; vec4 h = 1.0 - abs(x) - abs(y);
      vec4 b0 = vec4(x.xy, y.xy); vec4 b1 = vec4(x.zw, y.zw);
      vec4 s0 = floor(b0)*2.0 + 1.0; vec4 s1 = floor(b1)*2.0 + 1.0; vec4 sh = -step(h, vec4(0.0));
      vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy; vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
      vec3 p0 = vec3(a0.xy,h.x); vec3 p1 = vec3(a0.zw,h.y); vec3 p2 = vec3(a1.xy,h.z); vec3 p3 = vec3(a1.zw,h.w);
      vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
      p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
      vec4 m = max(0.5 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0); m = m * m;
      return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
    }

    void main() {
        vec3 normalVec = normalize(position);

        // --- SPHERE POS (resting blob — breathing Simplex deformation) ---
        float noiseVal = snoise(position * 0.5 + uTime * 0.8);
        noiseVal += 0.5 * snoise(position * 1.5 - uTime * 1.2);
        vec3 spherePos = position + normalVec * (noiseVal * uDeform);

        // --- CURSOR SOLAR FLARE ---
        // The sphere sits at the origin with an identity model matrix, so its
        // local position == world position; uCursor is the pointer's hit point
        // on the surface. Particles within reach erupt outward along their
        // normal — a prominence that swells toward the cursor and flickers like
        // real plasma.
        float cursorDist = distance(spherePos, uCursor);
        float flareFall = 1.0 - smoothstep(0.0, uCursorRadius, cursorDist);
        flareFall = pow(flareFall, 1.5);
        float flicker = 0.65 + 0.35 * snoise(position * 3.0 + uTime * 5.0);
        float flare = flareFall * uCursorStrength * flicker;
        spherePos += normalVec * (flare * uCursorFlare);
        vHeat = clamp(flare * uCursorHeat, 0.0, 1.0);

        vec3 finalPos = spherePos;

        vec4 mvPosition = modelViewMatrix * vec4(finalPos, 1.0);

        // Fresnel / Edge fade
        vec3 viewDir = normalize(-mvPosition.xyz);
        vec3 worldNormal = normalize(normalMatrix * normalVec); // approximate normal
        float rim = 1.0 - abs(dot(viewDir, worldNormal));

        // Center dark, edges glowing — the signature hollow-ring look.
        float edgeFadeSphere = smoothstep(0.4, 0.9, rim);

        float opacityMultiplier = 0.8;
        float sizeMultiplier = uParticleSize;

        // Intro: at uIntro=0 the sphere is fully filled (whole disc visible);
        // as uIntro→1 the centre hollows back to the fresnel rim. A short fade
        // (smoothstep) brings the whole cloud up from nothing on load.
        float introSphere = mix(1.0, edgeFadeSphere, uIntro);
        vEdgeFade = introSphere * opacityMultiplier;
        vEdgeFade *= smoothstep(0.0, 0.2, uIntro);

        // Flared particles light up even in the hollow centre, and swell.
        vEdgeFade += vHeat * 0.7 * smoothstep(0.0, 0.2, uIntro);

        // --- COLORS — pure cool-to-warm gradient across the sphere ---
        float baseColorMix = smoothstep(-3.0, 3.0, position.y + position.x * 0.5);
        vColor = mix(uColorBottom, uColorTop, clamp(baseColorMix, 0.0, 1.0));

        gl_PointSize = sizeMultiplier * (10.0 / -mvPosition.z) * (1.0 + vHeat * 1.6);
        gl_PointSize = max(gl_PointSize, 1.5);

        gl_Position = projectionMatrix * mvPosition;
    }
`;

const particleFragmentShader = /* glsl */ `
    varying float vEdgeFade;
    varying float vHeat;
    varying vec3 vColor;

    void main() {
        vec2 xy = gl_PointCoord.xy - vec2(0.5);
        float ll = length(xy);
        if(ll > 0.5) discard;

        // Soft round points
        float pointAlpha = smoothstep(0.5, 0.1, ll);

        // Flared particles burn toward a white-hot core.
        vec3 col = mix(vColor, vec3(1.0, 0.96, 0.84), vHeat);

        gl_FragColor = vec4(col, vEdgeFade * pointAlpha * 0.9);
    }
`;

const hexToVec3 = (hex: number): THREE.Vector3 => {
  const r = ((hex >> 16) & 255) / 255;
  const g = ((hex >> 8) & 255) / 255;
  const b = (hex & 255) / 255;
  return new THREE.Vector3(r, g, b);
};

interface SolarisOptions {
  includeAurora: boolean;
  bloom: { strength: number; radius: number; threshold: number };
  cameraDistance: number;
  /** Vertical offset shared by the camera and the sphere+pick-sphere — the
   * template's own "sun rising through the bottom of frame" framing. 0 for a
   * simple centered view (used by the card, where the wide letterbox framing
   * this was tuned for doesn't apply). */
  cameraOffsetY: number;
  sphereOffsetY: number;
  particleSize: number;
  deformAmount: number;
  cursorRadius: number;
  cursorFlare: number;
  cursorHeat: number;
  /** Sphere geometry resolution — verbatim (200, 600) for the hero. `vwScale`
   * (see `computeVwScale`) shrinks point *size*, but the vertex *count* is
   * fixed regardless of container size; at the card's ~275×167px buffer,
   * 120k points (200×600) average several overlapping vertices per pixel,
   * saturating the additive blend white before bloom even runs — no amount
   * of size/threshold tuning fixes overdraw, only fewer points does. The
   * template never renders this scene at a size small enough to hit this. */
  sphereSegments: { width: number; height: number };
}

const buildSolarisScene = (container: HTMLElement, options: SolarisOptions): HeroSceneHandle => {
  const {
    includeAurora,
    bloom,
    cameraDistance,
    cameraOffsetY,
    sphereOffsetY,
    particleSize,
    deformAmount,
    cursorRadius,
    cursorFlare,
    cursorHeat,
    sphereSegments,
  } = options;

  const canvas = document.createElement("canvas");
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  const { clientWidth, clientHeight } = container;
  // Tier-based, not the template's flat 2x — the one deliberate perf
  // deviation, invisible to the rendered look. See file header.
  const { dprClamp } = getTierBudget(clientWidth || window.innerWidth);
  const pixelRatio = Math.min(window.devicePixelRatio, dprClamp);
  renderer.setPixelRatio(pixelRatio);
  renderer.setSize(clientWidth || 1, clientHeight || 1);
  renderer.autoClear = false;

  let vwScale = computeVwScale(clientWidth || window.innerWidth);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
  camera.position.z = cameraDistance;

  let bgScene: THREE.Scene | null = null;
  let bgCamera: THREE.OrthographicCamera | null = null;
  let bgMaterial: THREE.ShaderMaterial | null = null;
  if (includeAurora) {
    bgScene = new THREE.Scene();
    bgCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, -1, 1);
    bgMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uScroll: { value: 0 },
        uResolution: { value: new THREE.Vector2(clientWidth || 1, clientHeight || 1) },
        color1: { value: new THREE.Color(AURORA_COLOR_1) },
        color2: { value: new THREE.Color(AURORA_COLOR_2) },
      },
      vertexShader: bgVertexShader,
      fragmentShader: bgFragmentShader,
      depthWrite: false,
    });
    bgScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), bgMaterial));
  }

  const geometry = new THREE.SphereGeometry(SPHERE_RADIUS, sphereSegments.width, sphereSegments.height);
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uScroll: { value: 0 },
      uIntro: { value: 0 },
      uColorTop: { value: hexToVec3(PARTICLE_COLOR_TOP) },
      uColorBottom: { value: hexToVec3(PARTICLE_COLOR_BOTTOM) },
      uCursor: { value: new THREE.Vector3(0, 0, SPHERE_RADIUS) },
      uCursorStrength: { value: 0 },
      uCursorRadius: { value: cursorRadius },
      uCursorFlare: { value: cursorFlare },
      uCursorHeat: { value: cursorHeat },
      uParticleSize: { value: particleSize * vwScale },
      uDeform: { value: deformAmount },
    },
    vertexShader: particleVertexShader,
    fragmentShader: particleFragmentShader,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const particles = new THREE.Points(geometry, material);
  particles.frustumCulled = false;
  particles.position.y = sphereOffsetY;
  scene.add(particles);

  const composer = new EffectComposer(renderer);
  composer.setPixelRatio(pixelRatio); // optimize-3d-scene skill §6 — clamp the composer too
  if (bgScene && bgCamera) {
    composer.addPass(new RenderPass(bgScene, bgCamera));
  }
  const renderFg = new RenderPass(scene, camera);
  if (includeAurora) {
    renderFg.clear = false;
    renderFg.clearDepth = true;
  }
  composer.addPass(renderFg);
  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(clientWidth || 1, clientHeight || 1),
    bloom.strength * vwScale,
    bloom.radius,
    bloom.threshold,
  );
  composer.addPass(bloomPass);

  // Invisible pick target for the cursor raycast — never added to `scene`.
  // Offset to match the sun's own position; hits are corrected back to the
  // sphere's local space before feeding the shader (`uCursor` is local).
  const pickGeometry = new THREE.SphereGeometry(SPHERE_RADIUS, 48, 48);
  const pickSphere = new THREE.Mesh(pickGeometry);
  pickSphere.position.y = sphereOffsetY;
  pickSphere.updateMatrixWorld();
  const raycaster = new THREE.Raycaster();
  const pointerNdc = new THREE.Vector2(0, 0);
  const cursorTarget = new THREE.Vector3(0, 0, SPHERE_RADIUS);
  let pointerActive = false;

  const setPointer = (x: number, y: number) => {
    // `HeroScene.tsx` computes container-relative x/y in screen-space
    // convention (y grows downward); three.js NDC needs y flipped (y grows
    // upward) or the raycast — and the cursor flare — lands mirrored.
    pointerNdc.set(Math.max(-1, Math.min(1, x)), -Math.max(-1, Math.min(1, y)));
    pointerActive = true;
  };

  const renderStatic = () => {
    // Under reduced motion this is the only frame ever drawn — `uIntro`
    // must be the settled (hollowed-rim) value, not its construction-time
    // 0 (which the shader's own on-load fade renders as fully invisible).
    material.uniforms.uIntro.value = 1;
    camera.position.set(0, cameraOffsetY, cameraDistance);
    camera.lookAt(0, cameraOffsetY, cameraDistance - 100.0);
    composer.render();
  };

  const renderFrame = (elapsedSeconds: number) => {
    const introRaw = Math.min(elapsedSeconds / INTRO_SECONDS, 1);
    const introEased = 1 - Math.pow(1 - introRaw, 3); // easeOutCubic
    material.uniforms.uIntro.value = introEased;

    const time = elapsedSeconds * TIME_SCALE;
    material.uniforms.uTime.value = time;
    if (bgMaterial) bgMaterial.uniforms.uTime.value = time;

    const introZoom = (1 - introEased) * -3.0;
    camera.position.set(0, cameraOffsetY, cameraDistance + introZoom);
    camera.lookAt(0, cameraOffsetY, cameraDistance - 100.0);

    let overSphere = false;
    if (pointerActive) {
      raycaster.setFromCamera(pointerNdc, camera);
      const hit = raycaster.intersectObject(pickSphere, false)[0];
      if (hit) {
        cursorTarget.copy(hit.point);
        cursorTarget.y -= sphereOffsetY; // world → sphere-local
        overSphere = true;
      }
    }
    const strength = material.uniforms.uCursorStrength;
    strength.value += ((overSphere ? 1 : 0) - strength.value) * 0.09;
    (material.uniforms.uCursor.value as THREE.Vector3).lerp(cursorTarget, 0.18);

    composer.render();
  };

  const resize = (width: number, height: number) => {
    if (width <= 0 || height <= 0) return;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    composer.setSize(width, height);
    composer.setPixelRatio(renderer.getPixelRatio());
    if (bgMaterial) bgMaterial.uniforms.uResolution.value.set(width, height);

    vwScale = computeVwScale(width);
    bloomPass.strength = bloom.strength * vwScale;
    material.uniforms.uParticleSize.value = particleSize * vwScale;
  };

  const dispose = () => {
    geometry.dispose();
    material.dispose();
    pickGeometry.dispose();
    if (bgScene) {
      bgScene.traverse((object) => {
        const mesh = object as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
      });
      bgMaterial?.dispose();
    }
    composer.dispose();
    renderer.dispose();
  };

  return { renderStatic, renderFrame, resize, setPointer, dispose, canvas };
};

/** Full-bleed Geotechnical service-page background — the template's own
 * "Creative Studio" hero framing verbatim: camera and sun both offset up
 * (2.8 / 5.5), camera close (4.6) and pitched into the sun's lower/edge
 * region rather than centered on it, full aurora, bloom at the exact
 * template numbers (2.33 / 1.16 / 0). This specific offset framing is what
 * keeps the fresnel rim from reading as "a full sphere" — most of the
 * sphere sits outside the frame, so what's visible is the flowing rim/aurora
 * interplay the template is actually named for, not a centered glowing ball. */
export const createSolarisHeroScene = (container: HTMLElement): HeroSceneHandle =>
  buildSolarisScene(container, {
    includeAurora: true,
    bloom: { strength: 2.33, radius: 1.16, threshold: 0 },
    cameraDistance: 4.6,
    cameraOffsetY: 2.8,
    sphereOffsetY: 5.5,
    particleSize: 0.8,
    deformAmount: 0.5,
    cursorRadius: 1.2,
    cursorFlare: 0.1,
    cursorHeat: 0.7,
    sphereSegments: { width: 200, height: 600 },
  });

/** Small, contained homepage-card version — same shaders/colours/blending,
 * no aurora (not requested for the card), same offset framing and the same
 * strength/particleSize the hero uses. `vwScale` (see `computeVwScale`) is
 * the template's own mechanism for these to work at one shared value across
 * sizes, and it's kept verbatim here too — but its floor (0.4×) and the
 * fixed 200×600 geometry are both tuned for a responsively-narrowed
 * *viewport* (a phone at ~375px+), not a ~275px card nested inside a page —
 * a use case the template never runs at, where 120k points massively
 * overdraw a ~46k-pixel buffer regardless of point size. Two deliberate,
 * additional deviations only: a coarser sphere (see `sphereSegments`) to
 * stop that overdraw at its source, and a higher bloom threshold so the
 * dim background doesn't bloom. strength/radius/particleSize stay the exact
 * template numbers. */
export const createSolarisCardScene = (container: HTMLElement): HeroSceneHandle =>
  buildSolarisScene(container, {
    includeAurora: false,
    bloom: { strength: 2.33, radius: 1.16, threshold: 0.4 },
    cameraDistance: 4.6,
    cameraOffsetY: 2.8,
    sphereOffsetY: 5.5,
    particleSize: 0.8,
    deformAmount: 0.5,
    cursorRadius: 1.2,
    cursorFlare: 0.1,
    cursorHeat: 0.7,
    sphereSegments: { width: 48, height: 90 },
  });
