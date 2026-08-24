// 📖 Docs: obsidian/frontend/components/common.md
"use client";

import { create } from "zustand";
import type { Project } from "@/data/mocks/projects";

interface ProjectModalStore {
  project: Project | null;
  open: (project: Project) => void;
  close: () => void;
}

export const useProjectModalStore = create<ProjectModalStore>((set) => ({
  project: null,
  open: (project) => set({ project }),
  close: () => set({ project: null }),
}));
