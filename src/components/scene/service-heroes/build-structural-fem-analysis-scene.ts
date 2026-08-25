/**
 * Hero scene for the Structural Engineering service page — a 3-bay steel
 * frame that assembles itself: individual members (columns, beams, cross
 * braces) fly in from random off-scene offsets and converge on their final
 * positions, a brief weld-spark burst marks each arrival, glass facade panels
 * slide into place once the frame is mostly assembled, and the completed
 * frame turns slowly once every member has arrived. See `sceneSummary` in
 * `data/mocks/services.ts`.
 */
import * as THREE from "three";
import { HERO_SCENE_COLORS as COLOR } from "../hero-scene-colors";
import { disposeSceneObjects } from "@/lib/scene/shared-viewport-renderer";
import { createHeroSceneRuntime } from "./hero-scene-runtime";
import type { HeroSceneHandle } from "../hero-scene-types";

const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);

const BAY_WIDTH = 1.5;
const BAY_HEIGHT = 2.4;
const BAY_DEPTH = 1.6;
const BAYS = 3;
const MEMBER_THICKNESS = 0.09;

const GRID_X = Array.from({ length: BAYS + 1 }, (_, i) => (i - BAYS / 2) * BAY_WIDTH);
const Z_FRONT = -BAY_DEPTH / 2;
const Z_BACK = BAY_DEPTH / 2;

interface MemberSpec {
  start: THREE.Vector3;
  end: THREE.Vector3;
}

/** The frame's member list, generated from the bay grid rather than
 * hand-authored: a vertical column at every grid intersection, top beams
 * connecting adjacent columns along both axes, and two end-bay diagonal
 * braces for visual interest. */
const buildMemberSpecs = (): MemberSpec[] => {
  const specs: MemberSpec[] = [];

  for (const x of GRID_X) {
    for (const z of [Z_FRONT, Z_BACK]) {
      specs.push({
        start: new THREE.Vector3(x, -BAY_HEIGHT / 2, z),
        end: new THREE.Vector3(x, BAY_HEIGHT / 2, z),
      });
    }
  }

  for (const z of [Z_FRONT, Z_BACK]) {
    for (let i = 0; i < GRID_X.length - 1; i++) {
      specs.push({
        start: new THREE.Vector3(GRID_X[i], BAY_HEIGHT / 2, z),
        end: new THREE.Vector3(GRID_X[i + 1], BAY_HEIGHT / 2, z),
      });
    }
  }

  for (const x of GRID_X) {
    specs.push({
      start: new THREE.Vector3(x, BAY_HEIGHT / 2, Z_FRONT),
      end: new THREE.Vector3(x, BAY_HEIGHT / 2, Z_BACK),
    });
  }

  specs.push({
    start: new THREE.Vector3(GRID_X[0], -BAY_HEIGHT / 2, Z_FRONT),
    end: new THREE.Vector3(GRID_X[1], BAY_HEIGHT / 2, Z_FRONT),
  });
  specs.push({
    start: new THREE.Vector3(GRID_X[BAYS - 1], -BAY_HEIGHT / 2, Z_FRONT),
    end: new THREE.Vector3(GRID_X[BAYS], BAY_HEIGHT / 2, Z_FRONT),
  });

  return specs;
};

interface BuiltMember {
  line: THREE.LineSegments;
  finalPosition: THREE.Vector3;
  /** The orientation `lookAt` gave this member so it lies along its actual
   * start→end axis — captured once and re-applied every frame (composed with
   * the fly-in jitter below) since `update()` sets `line.quaternion` wholesale
   * each frame and would otherwise overwrite it back to identity. */
  baseQuaternion: THREE.Quaternion;
  offset: THREE.Vector3;
  rotJitter: THREE.Vector3;
  delay: number;
  spark: THREE.Points;
}

const buildMemberLine = (start: THREE.Vector3, end: THREE.Vector3, material: THREE.LineBasicMaterial) => {
  const length = start.distanceTo(end);
  const geometry = new THREE.BoxGeometry(MEMBER_THICKNESS, MEMBER_THICKNESS, length);
  const line = new THREE.LineSegments(new THREE.EdgesGeometry(geometry), material);
  const mid = start.clone().add(end).multiplyScalar(0.5);
  line.position.copy(mid);
  line.lookAt(end);
  const baseQuaternion = line.quaternion.clone();
  geometry.dispose();
  return { line, finalPosition: mid, baseQuaternion };
};

const SPARK_PARTICLE_COUNT = 10;

const buildWeldSpark = (): THREE.Points => {
  const positions = new Float32Array(SPARK_PARTICLE_COUNT * 3);
  for (let i = 0; i < SPARK_PARTICLE_COUNT; i++) {
    const dir = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5)
      .normalize()
      .multiplyScalar(0.1 + Math.random() * 0.18);
    positions[i * 3] = dir.x;
    positions[i * 3 + 1] = dir.y;
    positions[i * 3 + 2] = dir.z;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    color: COLOR.white,
    size: 0.05,
    transparent: true,
    opacity: 0,
    sizeAttenuation: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  return new THREE.Points(geometry, material);
};

const buildMembers = (): BuiltMember[] => {
  const material = new THREE.LineBasicMaterial({ color: COLOR.line, transparent: true, opacity: 0.6 });
  return buildMemberSpecs().map((spec, i) => {
    const { line, finalPosition, baseQuaternion } = buildMemberLine(spec.start, spec.end, material);
    const offsetDir = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
    return {
      line,
      finalPosition,
      baseQuaternion,
      offset: offsetDir.multiplyScalar(5 + Math.random() * 4),
      rotJitter: new THREE.Vector3(
        (Math.random() - 0.5) * Math.PI,
        (Math.random() - 0.5) * Math.PI,
        (Math.random() - 0.5) * Math.PI,
      ),
      delay: i * 0.07,
      spark: buildWeldSpark(),
    };
  });
};

interface GlassPanel {
  mesh: THREE.Mesh;
  finalY: number;
}

const buildGlassPanel = (x: number, z: number): GlassPanel => {
  const geometry = new THREE.PlaneGeometry(BAY_WIDTH * 0.86, BAY_HEIGHT * 0.86);
  const material = new THREE.MeshBasicMaterial({
    color: COLOR.glow,
    transparent: true,
    opacity: 0,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, 0, z);
  geometry.dispose();
  return { mesh, finalY: 0 };
};

const MEMBER_ASSEMBLE_DURATION_S = 1.1;
const SPARK_DURATION_S = 0.4;
const GLASS_START_PROGRESS = 0.7;
const GLASS_SLIDE_OFFSET = 2.4;

export const createStructuralFemAnalysisScene = (container: HTMLElement): HeroSceneHandle =>
  createHeroSceneRuntime(
    container,
    { cameraPosition: [4.4, 1.8, 6.4], cameraLookAt: [0, 0, 0] },
    () => {
      const scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(COLOR.background, 0.045);

      const frameGroup = new THREE.Group();
      scene.add(frameGroup);

      const members = buildMembers();
      members.forEach((member) => {
        frameGroup.add(member.line);
        member.spark.position.copy(member.finalPosition);
        frameGroup.add(member.spark);
      });

      const panels = GRID_X.slice(0, -1).map((x, i) =>
        buildGlassPanel(x + BAY_WIDTH / 2, i % 2 === 0 ? Z_FRONT - 0.02 : Z_BACK + 0.02),
      );
      panels.forEach((panel) => frameGroup.add(panel.mesh));

      const scratchEuler = new THREE.Euler();
      const scratchQuaternion = new THREE.Quaternion();

      const update = (elapsedSeconds: number, _pointer: { x: number; y: number }, scrollProgress: number) => {
        let allArrived = true;
        let slowestProgress = 1;
        for (const member of members) {
          const timeProgress = Math.max(
            0,
            Math.min(1, (elapsedSeconds - member.delay) / MEMBER_ASSEMBLE_DURATION_S),
          );
          const progress = Math.max(timeProgress, scrollProgress);
          slowestProgress = Math.min(slowestProgress, progress);
          const eased = easeOutCubic(progress);
          if (eased < 1) allArrived = false;

          member.line.position.copy(member.finalPosition).addScaledVector(member.offset, 1 - eased);
          scratchEuler.set(
            member.rotJitter.x * (1 - eased),
            member.rotJitter.y * (1 - eased),
            member.rotJitter.z * (1 - eased),
          );
          scratchQuaternion.setFromEuler(scratchEuler);
          member.line.quaternion.copy(member.baseQuaternion).multiply(scratchQuaternion);
          (member.line.material as THREE.LineBasicMaterial).opacity = 0.2 + eased * 0.4;

          const sparkAge = elapsedSeconds - (member.delay + MEMBER_ASSEMBLE_DURATION_S);
          const sparkMaterial = member.spark.material as THREE.PointsMaterial;
          if (sparkAge >= 0 && sparkAge < SPARK_DURATION_S) {
            const sparkT = sparkAge / SPARK_DURATION_S;
            sparkMaterial.opacity = (1 - sparkT) * 0.9;
            member.spark.scale.setScalar(0.6 + sparkT * 1.4);
          } else {
            sparkMaterial.opacity = 0;
          }
        }

        panels.forEach((panel) => {
          const panelProgress = Math.max(
            0,
            Math.min(1, (slowestProgress - GLASS_START_PROGRESS) / (1 - GLASS_START_PROGRESS)),
          );
          const eased = easeOutCubic(panelProgress);
          panel.mesh.position.y = panel.finalY + (1 - eased) * GLASS_SLIDE_OFFSET;
          (panel.mesh.material as THREE.MeshBasicMaterial).opacity = eased * 0.1;
        });

        if (allArrived) {
          frameGroup.rotation.y = elapsedSeconds * 0.04;
        }
      };

      return {
        scene,
        update,
        dispose: () => disposeSceneObjects(scene),
      };
    },
  );
