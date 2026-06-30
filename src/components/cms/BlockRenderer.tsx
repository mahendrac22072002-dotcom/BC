import React from "react";
import { PageBlock } from "@/types/blocks";
import { Button } from "@/components/ui/button";
import { HeroWithPreview } from "./blocks/HeroWithPreview";
import { LogoCloud } from "./blocks/LogoCloud";
import { FeaturesGrid } from "./blocks/FeaturesGrid";
import { TimelineBlock } from "./blocks/TimelineBlock";
import { StatsBlock } from "./blocks/StatsBlock";
import { CTABlock } from "./blocks/CTABlock";
import { BlogListBlock } from "./blocks/BlogListBlock";
import { Link } from "@tanstack/react-router";

export function BlockRenderer({ blocks }: { blocks: PageBlock[] }) {
  if (!blocks || !Array.isArray(blocks)) return null;

  return (
    <>
      {blocks.map((block) => (
        <Block key={block.id} block={block} />
      ))}
    </>
  );
}

function Block({ block }: { block: PageBlock }) {
  switch (block.type) {
    case "rich-text":
      return (
        <div
          className="prose prose-neutral max-w-none"
          dangerouslySetInnerHTML={{ __html: block.content ?? "" }}
        />
      );

    case "hero-with-preview":
      return <HeroWithPreview data={block.data} />;

    case "logo-cloud":
      return <LogoCloud data={block.data} />;

    case "features-grid":
      return <FeaturesGrid data={block.data} items={block.items || []} />;

    case "timeline":
      return <TimelineBlock data={block.data} items={block.items || []} />;

    case "stats":
      return <StatsBlock items={block.items || []} />;

    case "cta":
      return <CTABlock data={block.data} />;

    case "hero":
      return (
        <section className="border-b border-hairline">
          <div className="container-tight pt-20 pb-16 md:pt-28 text-center md:text-left">
            {block.data?.eyebrow && <div className="eyebrow mx-auto md:mx-0">{block.data.eyebrow}</div>}
            <h1 className="mt-3 max-w-4xl text-5xl tracking-tight md:text-7xl">
              {block.data?.title}
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
              {block.data?.subtitle}
            </p>
            {block.items && block.items.length > 0 && (
              <div className="mt-8 flex gap-4">
                {block.items.map((b) => <Block key={b.id} block={b} />)}
              </div>
            )}
          </div>
        </section>
      );

    case "grid":
      return (
        <section>
          <div className="container-tight py-20">
            {block.data?.eyebrow && <div className="eyebrow">{block.data.eyebrow}</div>}
            {block.data?.title && <h2 className="mt-3 text-3xl tracking-tight">{block.data.title}</h2>}
            <div className={`mt-8 grid gap-px overflow-hidden rounded-2xl border border-hairline bg-hairline md:grid-cols-${block.data?.columns || 3}`}>
              {block.items?.map((item) => (
                <div key={item.id} className="bg-card p-8">
                  <h3 className="text-xl font-bold tracking-tight">{item.data?.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.content || item.data?.subtitle}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      );

    case "columns":
      return (
        <section className="border-b border-hairline">
          <div className="container-tight grid gap-16 py-20 md:grid-cols-[1fr_2fr]">
            <div>
              {block.data?.eyebrow && <div className="eyebrow">{block.data.eyebrow}</div>}
              {block.data?.title && (
                <h2 className="mt-3 text-3xl tracking-tight">{block.data.title}</h2>
              )}
            </div>
            <div className="space-y-6 text-base leading-relaxed text-muted-foreground">
              {block.items?.map((b) => <Block key={b.id} block={b} />)}
            </div>
          </div>
        </section>
      );

    case "button":
      return (
        <Button variant={block.data?.variant || "default"} asChild>
          <a href={block.data?.url || "#"} target={block.data?.newTab ? "_blank" : undefined}>
            {block.data?.label}
          </a>
        </Button>
      );

    case "image":
      return (
        <div className="my-8 overflow-hidden rounded-xl">
          <img src={block.data?.url} alt={block.data?.alt || ""} className="w-full h-auto" />
        </div>
      );

    case "spacer":
      return <div style={{ height: block.data?.height || "4rem" }} />;
      
    case "divider":
      return <hr className="border-hairline my-12" />;

    case "blog-list":
      return <BlogListBlock data={block.data} />;

    default:
      return <div className="p-4 border border-red-200 bg-red-50 text-red-800 text-sm">Unknown block type: {block.type}</div>;
  }
}
