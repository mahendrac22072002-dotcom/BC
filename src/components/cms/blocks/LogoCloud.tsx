import { Stagger, StaggerItem } from "@/components/motion/Reveal";

export function LogoCloud({ data }: { data: any }) {
  const items = data?.items || [];
  
  if (items.length === 0) return null;

  return (
    <section className="border-b border-hairline">
      <Stagger className="container-tight flex flex-wrap items-center justify-center gap-x-10 gap-y-3 py-8 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground" stagger={0.05}>
        {items.map((i: string, idx: number) => (
          <StaggerItem key={i} as="span" className="flex items-center gap-3">
            {idx > 0 && <span className="hidden h-1 w-1 rounded-full bg-muted-foreground/40 sm:block" />}
            {i}
          </StaggerItem>
        ))}
      </Stagger>
    </section>
  );
}
