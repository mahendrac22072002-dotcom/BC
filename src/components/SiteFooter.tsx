import { Logo } from "./Logo";
import { useNavItems, useSiteSettings } from "@/hooks/use-nav";

const staticCols = [
  {
    heading: "For brokers",
    links: [
      { label: "Get verified", href: "/auth?mode=signup", open_in_new_tab: false },
      { label: "Sign in", href: "/auth?mode=signin", open_in_new_tab: false },
      { label: "Subscriptions", href: "/pricing", open_in_new_tab: false },
    ],
  },
];

export function SiteFooter() {
  const cols = [
    {
      heading: "Platform",
      links: [
        { label: "Pricing", href: "/pricing", open_in_new_tab: false },
        { label: "About", href: "/about", open_in_new_tab: false },
        { label: "Blog", href: "/blog", open_in_new_tab: false },
        { label: "Contact", href: "/contact", open_in_new_tab: false },
      ],
    },
    ...staticCols,
  ];

  return (
    <footer className="mt-24 border-t border-hairline bg-surface">
      <div className="container-tight py-16">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              India's verified marketplace for real estate brokers. Authentic listings, trusted connections, simplified deals.
            </p>
          </div>
          {cols.map((col) => (
            <div key={col.heading}>
              <div className="eyebrow mb-4">{col.heading}</div>
              <ul className="space-y-3">
                {col.links.map((l) => (
                  <li key={l.href + l.label}>
                    <a
                      href={l.href}
                      target={l.open_in_new_tab ? "_blank" : undefined}
                      rel={l.open_in_new_tab ? "noopener noreferrer" : undefined}
                      className="text-sm text-foreground/80 transition-colors hover:text-foreground"
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 flex flex-col items-start justify-between gap-4 border-t border-hairline pt-8 md:flex-row md:items-center">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} BrokersConnect. Real Estate. Simplified.
          </p>
          <p className="text-xs text-muted-foreground">Made for brokers, in India.</p>
        </div>
      </div>
    </footer>
  );
}
