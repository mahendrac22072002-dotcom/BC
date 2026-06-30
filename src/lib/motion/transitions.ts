// Centralized easing + transition tokens. Used by all motion components.
import type { Transition } from "motion/react";

// Cubic-bezier curves used across Linear/Vercel/Framer
export const ease = {
  out: [0.16, 1, 0.3, 1] as const,        // expressive out
  inOut: [0.65, 0, 0.35, 1] as const,     // smooth inOut
  spring: [0.34, 1.56, 0.64, 1] as const, // gentle overshoot
  standard: [0.4, 0, 0.2, 1] as const,    // material standard
};

export const duration = {
  micro: 0.15,
  fast: 0.25,
  base: 0.4,
  slow: 0.6,
  page: 0.45,
};

export const transitions = {
  smooth: { duration: duration.base, ease: ease.out } satisfies Transition,
  fast: { duration: duration.fast, ease: ease.out } satisfies Transition,
  spring: { type: "spring", stiffness: 380, damping: 30, mass: 0.8 } satisfies Transition,
  springSoft: { type: "spring", stiffness: 220, damping: 26 } satisfies Transition,
  page: { duration: duration.page, ease: ease.out } satisfies Transition,
};
