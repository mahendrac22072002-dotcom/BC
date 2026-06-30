import { Link } from "@tanstack/react-router";
import { Stagger, StaggerItem } from "@/components/motion/Reveal";
import { Button } from "@/components/ui/button";

export function TimelineBlock({ data, items }: { data: any, items: any[] }) {
  if (!items) return null;

  return (
    <section className="border-b border-hairline bg-foreground text-background">
      <div className="container-tight py-24">
        <div className="flex flex-col gap-10 md:flex-row md:items-end md:justify-between">
          <div className="max-w-xl">
            {data?.eyebrow && <div className="eyebrow text-background/60">{data.eyebrow}</div>}
            <h2 className="mt-3 text-4xl tracking-tight md:text-5xl">
              {data?.title}
            </h2>
          </div>
          {data?.cta && (
            <Button asChild variant="outline" className="w-fit border-background/30 bg-transparent text-background hover:bg-background hover:text-foreground">
              <Link to={data.cta.url}>{data.cta.label}</Link>
            </Button>
          )}
        </div>

        <Stagger className={`mt-14 grid gap-px bg-background/15 md:grid-cols-${data?.columns || 4}`} stagger={0.08}>
          {items.map((s: any) => (
            <StaggerItem key={s.id} className="bg-foreground p-8">
              <div className="text-sm font-mono text-background/50">{s.data?.num}</div>
              <h3 className="mt-8 text-xl font-bold tracking-tight">{s.data?.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-background/70">{s.data?.subtitle}</p>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
