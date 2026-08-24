"use client";

import { useEffect, useRef } from "react";
import { animated, useTransition } from "@react-spring/web";
import { useScroll } from "@/hooks/smooth-scroll/use-scroll";
import { useProjectModalStore } from "./project-modal-store";

const TITLE_ID = "project-modal-title";

/**
 * Detail modal opened from a project `TiltCard` — replaces linking to a
 * project detail route that doesn't exist in this app. Mirrors
 * `CookiePreferencesModal`'s spring mount/unmount + focus/scroll handling.
 */
export const ProjectModal = () => {
  const project = useProjectModalStore((s) => s.project);
  const close = useProjectModalStore((s) => s.close);
  const open = project !== null;

  const stopScroll = useScroll((s) => s.stop);
  const startScroll = useScroll((s) => s.start);

  const triggerRef = useRef<Element | null>(null);
  useEffect(() => {
    if (!open) return;
    triggerRef.current = document.activeElement;
    stopScroll();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);

    return () => {
      window.removeEventListener("keydown", onKey);
      startScroll();
      const t = triggerRef.current as HTMLElement | null;
      if (t && typeof t.focus === "function") t.focus();
    };
  }, [open, close, stopScroll, startScroll]);

  const transitions = useTransition(open, {
    from: { opacity: 0, scale: 0.94 },
    enter: { opacity: 1, scale: 1 },
    leave: { opacity: 0, scale: 0.94 },
    config: { tension: 320, friction: 32 },
  });

  return transitions((style, isOpen) =>
    isOpen && project ? (
      <animated.div className="fixed inset-0 z-[100]" style={{ opacity: style.opacity }}>
        <div
          aria-hidden
          onMouseDown={close}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        />
        <animated.div
          role="dialog"
          aria-modal="true"
          aria-labelledby={TITLE_ID}
          style={{
            transform: style.scale.to((s) => `translate(-50%, -50%) scale(${s})`),
          }}
          className="border-line bg-background absolute top-1/2 left-1/2 flex max-h-[calc(100dvh-1.5rem)] w-[calc(100vw-1.5rem)] max-w-[560px] flex-col gap-5 overflow-y-auto rounded-2xl border p-6 text-foreground shadow-2xl sm:p-8"
        >
          <header className="flex items-start justify-between gap-3">
            <div>
              <p className="text-foreground-muted text-xs tracking-[0.14em] uppercase">
                {project.category}
              </p>
              <h2 id={TITLE_ID} className="text-foreground mt-2 text-2xl font-medium leading-tight">
                {project.title}
              </h2>
            </div>
            <button
              type="button"
              onClick={close}
              aria-label="Close project details"
              className="border-line text-foreground hover:bg-surface flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                <path
                  d="M4 4l8 8M12 4l-8 8"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </header>

          <dl className="border-line grid grid-cols-2 gap-4 border-y py-4 text-sm">
            <div>
              <dt className="text-foreground-muted text-xs tracking-[0.1em] uppercase">
                Location
              </dt>
              <dd className="text-foreground mt-1">
                {project.location}, {project.country}
              </dd>
            </div>
            <div>
              <dt className="text-foreground-muted text-xs tracking-[0.1em] uppercase">
                Discipline
              </dt>
              <dd className="text-foreground mt-1">{project.sector}</dd>
            </div>
          </dl>

          <p className="text-foreground-muted text-sm leading-relaxed">
            {project.description}
          </p>
        </animated.div>
      </animated.div>
    ) : null,
  );
};
