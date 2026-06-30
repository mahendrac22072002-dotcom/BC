import { motion } from "motion/react";
import { useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { pageVariants } from "@/lib/motion/variants";

/** Wrap an Outlet child to fade/slide between routes. Keyed by pathname. */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <motion.div
      key={pathname}
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      style={{ willChange: "transform, opacity" }}
    >
      {children}
    </motion.div>
  );
}
