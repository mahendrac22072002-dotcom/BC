// Interaction presets for hover/tap/whileInView used across the app.
import { transitions } from "./transitions";

export const hoverLift = {
  whileHover: { y: -3, transition: transitions.fast },
  whileTap: { y: 0, scale: 0.98, transition: { duration: 0.1 } },
};

export const hoverScale = {
  whileHover: { scale: 1.02, transition: transitions.fast },
  whileTap: { scale: 0.97, transition: { duration: 0.1 } },
};

export const tapSpring = {
  whileTap: { scale: 0.96, transition: { duration: 0.1 } },
};

export const inViewOnce = {
  initial: "hidden",
  whileInView: "visible",
  viewport: { once: true, amount: 0.2 },
} as const;
