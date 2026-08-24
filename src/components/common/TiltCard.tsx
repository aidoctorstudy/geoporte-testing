// 📖 Docs: obsidian/frontend/components/common.md
"use client";

import { animated, to, useSpring } from "@react-spring/web";
import { KeyboardEvent, MouseEvent, ReactNode, useRef } from "react";

export interface TiltCardProps {
  children: ReactNode;
  className?: string;
  onActivate: () => void;
  "aria-label": string;
}

const MAX_TILT_DEG = 9;

/**
 * A card that tilts in 3D toward the cursor (perspective transform, spring-
 * driven — not CSS keyframes) and exposes a single activation callback. Built
 * as a `role="button"` div rather than a real `<button>` because its children
 * include heading/paragraph content, which `<button>`'s content model
 * (phrasing content only) does not permit — full keyboard support (Enter /
 * Space) makes up the difference.
 */
export const TiltCard = ({ children, className, onActivate, ...rest }: TiltCardProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const canTilt = useRef(
    typeof window !== "undefined" &&
      window.matchMedia("(hover: hover) and (pointer: fine)").matches,
  );

  const [style, api] = useSpring(() => ({
    rotateX: 0,
    rotateY: 0,
    scale: 1,
    config: { tension: 280, friction: 24 },
  }));

  const handleMouseMove = (event: MouseEvent<HTMLDivElement>) => {
    if (!canTilt.current) return;
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width - 0.5;
    const py = (event.clientY - rect.top) / rect.height - 0.5;
    api.start({ rotateX: -py * MAX_TILT_DEG, rotateY: px * MAX_TILT_DEG, scale: 1.02 });
  };

  const handleMouseLeave = () => {
    api.start({ rotateX: 0, rotateY: 0, scale: 1 });
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    onActivate();
  };

  return (
    <animated.div
      ref={ref}
      role="button"
      tabIndex={0}
      aria-haspopup="dialog"
      onClick={onActivate}
      onKeyDown={handleKeyDown}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: to(
          [style.rotateX, style.rotateY, style.scale],
          (rx, ry, s) => `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg) scale(${s})`,
        ),
      }}
      className={className}
      {...rest}
    >
      {children}
    </animated.div>
  );
};
