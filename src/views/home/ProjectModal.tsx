"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { animated, useTransition } from "@react-spring/web";
import { useScroll } from "@/hooks/smooth-scroll/use-scroll";
import { TranslatedText } from "@/components/common/TranslatedText";
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
          className="border-line bg-background absolute top-1/2 left-1/2 flex max-h-[calc(100dvh-1.5rem)] w-[calc(100vw-1.5rem)] max-w-[560px] flex-col overflow-y-auto rounded-2xl border text-foreground shadow-2xl"
        >
          <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden">
            <Image
              src={project.image.src}
              alt={project.image.alt}
              fill
              sizes="(max-width: 640px) 100vw, 560px"
              className="object-cover"
              priority
            />
            <div
              aria-hidden="true"
              className="absolute inset-0"
              style={{
                background: "linear-gradient(to top, rgba(1,4,14,.75) 0%, rgba(1,4,14,0) 55%)",
              }}
            />
            <button
              type="button"
              onClick={close}
              aria-label="Close project details"
              className="border-line bg-background/80 text-foreground hover:bg-surface absolute top-4 right-4 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border backdrop-blur-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
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
          </div>

          <div className="flex flex-col gap-5 p-6 sm:p-8">
            <div>
              <p className="text-foreground-muted text-xs tracking-[0.14em] uppercase">
                <TranslatedText text={project.category} />
              </p>
              <h2 id={TITLE_ID} className="text-foreground mt-2 text-2xl font-medium leading-tight">
                <TranslatedText text={project.title} />
              </h2>
            </div>

            <dl className="border-line grid grid-cols-1 gap-4 border-y py-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-foreground-muted text-xs tracking-[0.1em] uppercase">
                  <TranslatedText text="Location" />
                </dt>
                <dd className="text-foreground mt-1">
                  {project.location}, <TranslatedText text={project.country} />
                </dd>
              </div>
              <div>
                <dt className="text-foreground-muted text-xs tracking-[0.1em] uppercase">
                  <TranslatedText text="Discipline" />
                </dt>
                <dd className="text-foreground mt-1">
                  <TranslatedText text={project.sector} />
                </dd>
              </div>
            </dl>

            <p className="text-foreground-muted text-sm leading-relaxed">
              <TranslatedText text={project.description} />
            </p>
          </div>
        </animated.div>
      </animated.div>
    ) : null,
  );
};
