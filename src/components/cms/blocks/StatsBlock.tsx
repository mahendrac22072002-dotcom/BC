import { Stagger, StaggerItem } from "@/components/motion/Reveal";
import { AnimatedNumber } from "@/components/motion/AnimatedNumber";

export function StatsBlock({ items }: { items: any[] }) {
  if (!items) return null;

  return (
    <section className="border-b border-hairline">
      <div className="container-tight py-20">
        <Stagger className="grid gap-12 md:grid-cols-4" stagger={0.1}>
          {items.map((s: any) => (
            <StaggerItem key={s.id}>
              <div className="text-5xl font-extrabold tracking-tight md:text-6xl">
                <AnimatedNumber value={s.data?.value} duration={1.4} />
                {s.data?.suffix ?? ""}
              </div>
              <div className="mt-3 text-sm text-muted-foreground">{s.data?.label}</div>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
