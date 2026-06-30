import { useReducedMotion } from "motion/react";

/** Returns true when the user has prefers-reduced-motion. Safe on SSR. */
export function useReducedMotionSafe(): boolean {
  const r = useReducedMotion();
  return !!r;
}
