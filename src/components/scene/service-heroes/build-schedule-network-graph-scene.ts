/**
 * Hero scene for the Project Control Services page — a floating Gantt-bar
 * field: bars extend left-to-right on staggered timers, a glowing timeline
 * axis runs beneath them, thin dependency connectors link consecutive bars,
 * and small milestone diamonds pulse along the axis. Scroll reveals extra
 * bars beyond the base set, capped at `MAX_BAR_COUNT`. See `sceneSummary` in
 * `data/mocks/services.ts`.
 *
 * Bar status is colour-coded, but through this project's existing
 * navy/azure palette (`HERO_SCENE_COLORS`) rather than literal traffic-light
 * red/amber/green — every other hero scene in this codebase, including ones
 * with just as strong a literal-colour case (the structural page's stress
 * analysis), stays inside the Neural Monitor monochrome-blue identity
 * (see [[design-system]]); "on track" reads brightest, "at risk" reads
 * whitest/hottest, "delayed" reads dimmest, all still blue-family.
 */
import * as THREE from "three";
import { HERO_SCENE_COLORS as COLOR } from "../hero-scene-colors";
import { disposeSceneObjects } from "@/lib/scene/shared-viewport-renderer";
import { createHeroSceneRuntime } from "./hero-scene-runtime";
import type { HeroSceneHandle } from "../hero-scene-types";

const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);

const BASE_BAR_COUNT = 5;
const MAX_BAR_COUNT = 9;
const ROW_SPACING = 0.55;
const BAR_HEIGHT = 0.16;
const BAR_ASSEMBLE_DURATION_S = 0.9;

type BarStatus = "on-track" | "at-risk" | "delayed";

const STATUS_CYCLE: BarStatus[] = ["on-track", "at-risk", "delayed"];

const statusColor = (status: BarStatus): THREE.Color => {
  const glow = new THREE.Color(COLOR.glow);
  if (status === "on-track") return glow;
  if (status === "at-risk") return glow.clone().lerp(new THREE.Color(COLOR.white), 0.6);
  return new THREE.Color(COLOR.line);
};

interface BarSpec {
  row: number;
  startX: number;
  length: number;
  status: BarStatus;
  delay: number;
}

const buildBarSpecs = (): BarSpec[] =>
  Array.from({ length: MAX_BAR_COUNT }, (_, i) => ({
    row: i,
    startX: -3.6 + ((i * 7) % 5) * 0.7,
    length: 1.3 + ((i * 11) % 6) * 0.4,
    status: STATUS_CYCLE[i % STATUS_CYCLE.length],
    delay: i * 0.12,
  }));

interface BuiltBar {
  mesh: THREE.Mesh;
  spec: BarSpec;
  endX: number;
  y: number;
  /** Set the first frame this bar becomes eligible to animate in (either
   * within `BASE_BAR_COUNT` from the start, or once scroll reveals it) —
   * `null` until then, so its extend-in timing is measured from when it
   * actually appeared rather than from scene mount. */
  revealedAt: number | null;
}

const buildBar = (spec: BarSpec): BuiltBar => {
  const geometry = new THREE.BoxGeometry(spec.length, BAR_HEIGHT, BAR_HEIGHT);
  geometry.translate(spec.length / 2, 0, 0);
  const material = new THREE.MeshBasicMaterial({
    color: statusColor(spec.status),
    transparent: true,
    opacity: 0,
  });
  const mesh = new THREE.Mesh(geometry, material);
  const y = (spec.row - (MAX_BAR_COUNT - 1) / 2) * ROW_SPACING;
  mesh.position.set(spec.startX, y, 0);
  mesh.scale.x = 0.0001;
  geometry.dispose();
  return { mesh, spec, endX: spec.startX + spec.length, y, revealedAt: null };
};

const buildTimelineAxis = (width: number, y: number): THREE.Group => {
  const group = new THREE.Group();
  const axisGeometry = new THREE.BoxGeometry(width, 0.03, 0.03);
  const axis = new THREE.Mesh(
    axisGeometry,
    new THREE.MeshBasicMaterial({ color: COLOR.glow, transparent: true, opacity: 0.5 }),
  );
  axis.position.y = y;
  group.add(axis);
  axisGeometry.dispose();

  const tickMaterial = new THREE.LineBasicMaterial({ color: COLOR.glow, transparent: true, opacity: 0.35 });
  const tickCount = 10;
  for (let i = 0; i <= tickCount; i++) {
    const x = -width / 2 + (i / tickCount) * width;
    const geometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(x, y - 0.08, 0),
      new THREE.Vector3(x, y + 0.08, 0),
    ]);
    group.add(new THREE.Line(geometry, tickMaterial));
  }

  return group;
};

const buildDependencyLine = (): THREE.Line => {
  const geometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
  return new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: COLOR.ink, transparent: true, opacity: 0 }));
};

interface Milestone {
  mesh: THREE.Mesh;
  phase: number;
}

const buildMilestone = (x: number, y: number, phase: number): Milestone => {
  const geometry = new THREE.OctahedronGeometry(0.09, 0);
  const mesh = new THREE.Mesh(
    geometry,
    new THREE.MeshBasicMaterial({ color: COLOR.white, transparent: true, opacity: 0.85 }),
  );
  mesh.position.set(x, y, 0);
  geometry.dispose();
  return { mesh, phase };
};

export const createScheduleNetworkGraphScene = (container: HTMLElement): HeroSceneHandle =>
  createHeroSceneRuntime(
    container,
    { cameraPosition: [1.2, 0.8, 8.4], cameraLookAt: [0, 0, 0] },
    () => {
      const scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(COLOR.background, 0.04);

      const barGroup = new THREE.Group();
      scene.add(barGroup);

      const bars = buildBarSpecs().map(buildBar);
      bars.forEach((bar) => barGroup.add(bar.mesh));

      const axisY = (0 - (MAX_BAR_COUNT - 1) / 2) * ROW_SPACING - ROW_SPACING;
      const axis = buildTimelineAxis(9, axisY);
      scene.add(axis);

      const dependencyLines = bars.slice(0, -1).map(() => buildDependencyLine());
      dependencyLines.forEach((line) => scene.add(line));

      const milestones = [-2.4, 0.8, 3.2].map((x, i) => buildMilestone(x, axisY, i * 2.1));
      milestones.forEach(({ mesh }) => scene.add(mesh));

      const update = (elapsedSeconds: number, _pointer: { x: number; y: number }, scrollProgress: number) => {
        bars.forEach((bar, i) => {
          const isBase = i < BASE_BAR_COUNT;
          const revealThreshold = isBase ? 0 : (i - BASE_BAR_COUNT + 1) / (MAX_BAR_COUNT - BASE_BAR_COUNT + 1);
          if (bar.revealedAt === null && (isBase || scrollProgress >= revealThreshold)) {
            bar.revealedAt = elapsedSeconds + bar.spec.delay;
          }

          if (bar.revealedAt === null) {
            (bar.mesh.material as THREE.MeshBasicMaterial).opacity = 0;
            bar.mesh.scale.x = 0.0001;
            return;
          }

          const t = Math.max(0, Math.min(1, (elapsedSeconds - bar.revealedAt) / BAR_ASSEMBLE_DURATION_S));
          const eased = easeOutCubic(t);
          bar.mesh.scale.x = Math.max(0.0001, eased);
          (bar.mesh.material as THREE.MeshBasicMaterial).opacity = 0.25 + eased * 0.55;
        });

        for (let i = 0; i < dependencyLines.length; i++) {
          const from = bars[i];
          const to = bars[i + 1];
          const line = dependencyLines[i];
          const visible = from.revealedAt !== null && to.revealedAt !== null;
          const material = line.material as THREE.LineBasicMaterial;
          if (!visible) {
            material.opacity = 0;
            continue;
          }
          const position = line.geometry.attributes.position as THREE.BufferAttribute;
          position.setXYZ(0, from.endX, from.y, 0);
          position.setXYZ(1, to.spec.startX, to.y, 0);
          position.needsUpdate = true;
          material.opacity = 0.3;
        }

        milestones.forEach(({ mesh, phase }) => {
          const pulse = Math.sin(elapsedSeconds * 1.4 + phase) * 0.5 + 0.5;
          mesh.scale.setScalar(0.7 + pulse * 0.5);
          (mesh.material as THREE.MeshBasicMaterial).opacity = 0.5 + pulse * 0.4;
        });

        barGroup.rotation.y = Math.sin(elapsedSeconds * 0.08) * 0.06;
      };

      return { scene, update, dispose: () => disposeSceneObjects(scene) };
    },
  );
