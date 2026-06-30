import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useNavItems } from "@/hooks/use-nav";
import { AnimatePresence, motion } from "motion/react";

const fallback = [
  { id: "home", label: "Home", href: "/", open_in_new_tab: false },
  { id: "pricing", label: "Pricing", href: "/pricing", open_in_new_tab: false },
  { id: "about", label: "About", href: "/about", open_in_new_tab: false },
  { id: "blog", label: "Blog", href: "/blog", open_in_new_tab: false },
  { id: "contact", label: "Contact", href: "/contact", open_in_new_tab: false },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, loading } = useAuth();
  const signedIn = !!user;
  
  const items = fallback;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className={[
        "sticky top-0 z-40 transition-[background-color,border-color,backdrop-filter] duration-300",
        scrolled
          ? "border-b border-hairline bg-background/70 backdrop-blur-xl supports-[backdrop-filter]:bg-background/55"
          : "border-b border-transparent bg-background/0 backdrop-blur-0",
      ].join(" ")}
    >
      <div className="container-tight flex h-16 items-center justify-between">
        <Logo />

        <nav className="hidden items-center gap-8 md:flex">
          {items.map((n) => (
            <a
              key={n.id}
              href={n.href}
              target={n.open_in_new_tab ? "_blank" : undefined}
              rel={n.open_in_new_tab ? "noopener noreferrer" : undefined}
              className="story-link relative text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {n.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {loading ? null : signedIn ? (
            <Button asChild size="sm">
              <Link to="/dashboard">Open dashboard →</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/auth" search={{ mode: "signin" }}>Sign in</Link>
              </Button>
              <Button asChild size="sm">
                <Link to="/auth" search={{ mode: "signup" }}>Get verified</Link>
              </Button>
            </>
          )}
        </div>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-md md:hidden"
          aria-label="Toggle menu"
          onClick={() => setOpen((v) => !v)}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={open ? "x" : "m"}
              initial={{ rotate: -60, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 60, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="inline-flex"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </motion.span>
          </AnimatePresence>
        </button>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="mobile-nav"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden border-t border-hairline md:hidden"
          >
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                hidden: {},
                visible: { transition: { staggerChildren: 0.04, delayChildren: 0.05 } },
              }}
              className="container-tight flex flex-col gap-1 py-4"
            >
              {items.map((n) => (
                <motion.a
                  key={n.id}
                  href={n.href}
                  target={n.open_in_new_tab ? "_blank" : undefined}
                  rel={n.open_in_new_tab ? "noopener noreferrer" : undefined}
                  onClick={() => setOpen(false)}
                  variants={{
                    hidden: { opacity: 0, x: -8 },
                    visible: { opacity: 1, x: 0 },
                  }}
                  className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-surface hover:text-foreground"
                >
                  {n.label}
                </motion.a>
              ))}
              <div className="mt-2 flex gap-2 px-3">
                {signedIn ? (
                  <Button asChild size="sm" className="flex-1">
                    <Link to="/dashboard" onClick={() => setOpen(false)}>Open dashboard</Link>
                  </Button>
                ) : (
                  <>
                    <Button asChild variant="outline" size="sm" className="flex-1">
                      <Link to="/auth" search={{ mode: "signin" }} onClick={() => setOpen(false)}>Sign in</Link>
                    </Button>
                    <Button asChild size="sm" className="flex-1">
                      <Link to="/auth" search={{ mode: "signup" }} onClick={() => setOpen(false)}>Get verified</Link>
                    </Button>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
