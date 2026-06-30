import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Reveal } from "@/components/motion/Reveal";
import { Button } from "@/components/ui/button";

export function CTABlock({ data }: { data: any }) {
  if (!data) return null;

  return (
    <section>
      <div className="container-tight py-24">
        <Reveal>
          <div className="rounded-3xl border border-hairline bg-card px-8 py-16 text-center md:px-16 md:py-24">
            <h2 className="mx-auto max-w-3xl text-4xl tracking-tight md:text-6xl">
              {data.title}
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-muted-foreground">
              {data.subtitle}
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              {data.cta_primary && (
                <motion.div whileHover={{ scale: 1.03, y: -1 }} whileTap={{ scale: 0.97 }} transition={{ type: "spring", stiffness: 400, damping: 25 }}>
                  <Button asChild size="lg" className="h-12 px-6 text-base">
                    <Link to={data.cta_primary.url}>{data.cta_primary.label}</Link>
                  </Button>
                </motion.div>
              )}
              {data.cta_secondary && (
                <Button asChild variant="ghost" size="lg" className="h-12 px-6 text-base">
                  <Link to={data.cta_secondary.url}>{data.cta_secondary.label}</Link>
                </Button>
              )}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
