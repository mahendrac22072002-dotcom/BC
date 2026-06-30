import { motion } from "motion/react";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/Reveal";
import * as Icons from "lucide-react";

export function FeaturesGrid({ data, items }: { data: any, items: any[] }) {
  if (!items) return null;

  return (
    <section className="border-b border-hairline">
      <div className="container-tight py-24">
        <Reveal className="max-w-2xl">
          {data?.eyebrow && <div className="eyebrow">{data.eyebrow}</div>}
          <h2 className="mt-3 text-4xl tracking-tight md:text-5xl">
            {data?.title}
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            {data?.subtitle}
          </p>
        </Reveal>

        <Stagger className={`mt-14 grid gap-px overflow-hidden rounded-2xl border border-hairline bg-hairline md:grid-cols-${data?.columns || 3}`} stagger={0.07}>
          {items.map((it: any) => {
            // @ts-ignore
            const Icon = Icons[it.data?.icon || "Check"] || Icons.Check;
            return (
              <StaggerItem key={it.id} className="group relative bg-card p-8 transition-colors hover:bg-surface">
                <motion.div whileHover={{ y: -4, scale: 1.01 }} transition={{ type: "spring", stiffness: 300, damping: 22 }}>
                  <motion.div whileHover={{ rotate: -6, scale: 1.1 }} transition={{ type: "spring", stiffness: 300, damping: 18 }} className="inline-block">
                    <Icon className="h-6 w-6" strokeWidth={1.75} />
                  </motion.div>
                  <h3 className="mt-6 text-xl font-bold tracking-tight">{it.data?.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {it.data?.subtitle || it.content}
                  </p>
                </motion.div>
              </StaggerItem>
            );
          })}
        </Stagger>
      </div>
    </section>
  );
}
