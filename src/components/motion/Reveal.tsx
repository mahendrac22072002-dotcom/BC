import { motion, type Variants } from "motion/react";
import type { ReactNode, ElementType } from "react";
import { fadeUp } from "@/lib/motion/variants";
import { inViewOnce } from "@/lib/motion/presets";

interface RevealProps {
  children: ReactNode;
  variants?: Variants;
  delay?: number;
  className?: string;
  as?: ElementType;
  amount?: number;
}

/** Animate a block into view once when it crosses the viewport. */
export function Reveal({
  children,
  variants = fadeUp,
  delay = 0,
  className,
  as = "div",
  amount = 0.2,
}: RevealProps) {
  const Comp = motion[as as "div"] ?? motion.div;
  return (
    <Comp
      className={className}
      variants={variants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount }}
      transition={{ delay }}
      {...({} as object)}
    >
      {children}
    </Comp>
  );
}

interface StaggerProps {
  children: ReactNode;
  className?: string;
  stagger?: number;
  delay?: number;
  amount?: number;
  as?: ElementType;
}

/** Parent container that staggers reveal of any motion children using `fadeUp`. */
export function Stagger({
  children,
  className,
  stagger = 0.08,
  delay = 0,
  amount = 0.15,
  as = "div",
}: StaggerProps) {
  const Comp = motion[as as "div"] ?? motion.div;
  return (
    <Comp
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount }}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: stagger, delayChildren: delay } },
      }}
      {...({} as object)}
    >
      {children}
    </Comp>
  );
}

/** A single staggered child — use inside <Stagger>. */
export function StaggerItem({
  children,
  className,
  variants = fadeUp,
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  variants?: Variants;
  as?: ElementType;
}) {
  const Comp = motion[as as "div"] ?? motion.div;
  return (
    <Comp className={className} variants={variants} {...({} as object)}>
      {children}
    </Comp>
  );
}

export { inViewOnce };
