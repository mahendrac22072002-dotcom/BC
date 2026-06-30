import { useRef } from "react";
import { Link } from "@tanstack/react-router";
import { motion, useScroll, useTransform } from "motion/react";
import { Button } from "@/components/ui/button";
import { ArrowRight, BadgeCheck } from "lucide-react";

export function HeroWithPreview({ data }: { data: any }) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const previewY = useTransform(scrollYProgress, [0, 1], [0, 80]);
  const previewScale = useTransform(scrollYProgress, [0, 1], [1, 0.96]);
  const previewOpacity = useTransform(scrollYProgress, [0, 1], [1, 0.4]);

  return (
    <section ref={ref} className="relative overflow-hidden border-b border-hairline">
      {/* grid bg */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "linear-gradient(var(--color-foreground) 1px, transparent 1px), linear-gradient(90deg, var(--color-foreground) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage:
            "radial-gradient(ellipse at 50% 0%, black 30%, transparent 75%)",
        }}
      />
      {/* floating ambient shapes */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="animate-ambient absolute -left-32 top-20 h-72 w-72 rounded-full opacity-[0.06]"
          style={{ background: "radial-gradient(circle, var(--color-foreground) 0%, transparent 70%)" }}
        />
        <div
          className="animate-ambient absolute -right-24 top-40 h-96 w-96 rounded-full opacity-[0.05]"
          style={{ background: "radial-gradient(circle, var(--color-foreground) 0%, transparent 70%)", animationDelay: "3s" }}
        />
      </div>

      <div className="container-tight relative pt-20 pb-24 md:pt-28 md:pb-32">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
          }}
          className="mx-auto max-w-4xl text-center"
        >
          {data?.eyebrow && (
            <motion.span
              variants={{
                hidden: { opacity: 0, y: 8 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
              }}
              className="inline-flex items-center gap-2 rounded-full border border-hairline bg-card px-3 py-1 text-xs font-medium text-muted-foreground"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-foreground animate-pulse" />
              {data.eyebrow}
            </motion.span>
          )}

          <motion.h1
            variants={{
              hidden: { opacity: 0, y: 24, filter: "blur(8px)" },
              visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } },
            }}
            className="mt-6 text-5xl leading-[1.02] tracking-tight md:text-7xl lg:text-[88px]"
          >
            {data?.title}
          </motion.h1>

          <motion.p
            variants={{
              hidden: { opacity: 0, y: 16 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
            }}
            className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground"
          >
            {data?.subtitle}
          </motion.p>

          <motion.div
            variants={{
              hidden: { opacity: 0, y: 16 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
            }}
            className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            {data?.cta_primary && (
              <motion.div whileHover={{ scale: 1.03, y: -1 }} whileTap={{ scale: 0.97 }} transition={{ type: "spring", stiffness: 400, damping: 25 }}>
                <Button asChild size="lg" className="h-12 px-6 text-base shadow-lg shadow-foreground/10">
                  <Link to={data.cta_primary.url}>
                    {data.cta_primary.label} <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </Button>
              </motion.div>
            )}
            {data?.cta_secondary && (
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} transition={{ type: "spring", stiffness: 400, damping: 25 }}>
                <Button asChild variant="outline" size="lg" className="h-12 px-6 text-base">
                  <Link to={data.cta_secondary.url}>{data.cta_secondary.label}</Link>
                </Button>
              </motion.div>
            )}
          </motion.div>

          <motion.p
            variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.6, delay: 0.1 } } }}
            className="mt-6 text-xs text-muted-foreground"
          >
            Free 14-day trial · No credit card · KYC review in 24 hrs
          </motion.p>
        </motion.div>

        {/* hero preview card */}
        <motion.div
          style={{ y: previewY, scale: previewScale, opacity: previewOpacity }}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="relative mx-auto mt-16 max-w-5xl"
        >
          <div className="rounded-2xl border border-hairline bg-card p-2 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.25)]">
            <div className="rounded-xl border border-hairline bg-background">
              <div className="flex items-center gap-1.5 border-b border-hairline px-4 py-3">
                <span className="h-2.5 w-2.5 rounded-full bg-foreground/15" />
                <span className="h-2.5 w-2.5 rounded-full bg-foreground/15" />
                <span className="h-2.5 w-2.5 rounded-full bg-foreground/15" />
                <span className="ml-3 text-xs text-muted-foreground">
                  app.brokersconnect.in / marketplace
                </span>
              </div>
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } } }}
                className="grid gap-px bg-hairline p-px md:grid-cols-3"
              >
                {[
                  { city: "Gurugram", type: "Commercial", area: "12,400 sqft", price: "₹38 Cr" },
                  { city: "Mumbai", type: "Residential", area: "4 BHK · 3,800 sqft", price: "₹14.2 Cr" },
                  { city: "Bengaluru", type: "Plot", area: "9,000 sqft", price: "₹6.8 Cr" },
                ].map((l) => (
                  <motion.div
                    key={l.city}
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
                    }}
                    whileHover={{ y: -4, transition: { duration: 0.2 } }}
                    className="bg-card p-5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="eyebrow">{l.type}</div>
                      <BadgeCheck className="h-4 w-4 text-foreground" />
                    </div>
                    <div className="mt-3 text-xl font-bold tracking-tight">
                      {l.city}
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">{l.area}</div>
                    <div className="mt-6 flex items-end justify-between">
                      <div className="text-2xl font-extrabold tracking-tight">
                        {l.price}
                      </div>
                      <div className="text-xs font-medium text-muted-foreground">
                        Verified broker
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
