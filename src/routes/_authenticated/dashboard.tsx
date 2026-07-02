import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Check, Lock, ShieldCheck, Building2, Users, MessagesSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — BrokersConnect" }] }),
  component: Dashboard,
});

type ProfileRow = {
  full_name: string | null;
  firm: string | null;
  city: string | null;
  phone: string | null;
  kyc_status: "pending" | "in_review" | "verified" | "rejected";
  kyc_submitted_at: string | null;
  onboarding_profile_completed: boolean;
  onboarding_kyc_submitted: boolean;
  onboarding_listing_published: boolean;
  onboarding_network_started: boolean;
};

const PROFILE_COLUMNS =
  "full_name, firm, city, phone, kyc_status, kyc_submitted_at, onboarding_profile_completed, onboarding_kyc_submitted, onboarding_listing_published, onboarding_network_started";

function Dashboard() {
  const { user } = useAuth();
  const userId = user?.id;

  const profileQuery = useQuery({
    queryKey: ["profile", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select(PROFILE_COLUMNS)
        .eq("id", userId!)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as ProfileRow | null;
    },
  });

  // Live counts
  const listingsCountQ = useQuery({
    queryKey: ["count", "listings", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { count, error } = await supabase
        .from("listings")
        .select("id", { count: "exact", head: true })
        .eq("broker_id", userId!);
      if (error) throw error;
      return count ?? 0;
    },
  });
  const connCountQ = useQuery({
    queryKey: ["count", "connections", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { count, error } = await supabase
        .from("connections")
        .select("id", { count: "exact", head: true })
        .eq("status", "accepted")
        .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);
      if (error) throw error;
      return count ?? 0;
    },
  });
  const convoCountQ = useQuery({
    queryKey: ["count", "conversations", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { count, error } = await supabase
        .from("conversations")
        .select("id", { count: "exact", head: true })
        .or(`broker_a.eq.${userId},broker_b.eq.${userId}`);
      if (error) throw error;
      return count ?? 0;
    },
  });

  const profile = profileQuery.data;
  const displayName =
    profile?.full_name?.trim() || (user?.email ? user.email.split("@")[0] : "broker");
  const kyc = profile?.kyc_status ?? "pending";

  const profileComplete =
    !!profile?.full_name?.trim() && !!profile?.firm?.trim() && !!profile?.city?.trim();

  type StepHref = any;
  const steps: Array<{
    title: string;
    description: string;
    cta: string;
    done: boolean;
    locked?: boolean;
    href: StepHref;
  }> = [
    {
      title: "Complete your broker profile",
      description: profileComplete
        ? "Profile looks good — you can update it any time."
        : "Add your full name, firm and city so peers can find you.",
      cta: profileComplete ? "Edit profile" : "Complete profile",
      done: !!profile?.onboarding_profile_completed && profileComplete,
      href: "/settings",
    },
    {
      title: "Submit KYC documents",
      description:
        kyc === "verified"
          ? "Your account is verified."
          : kyc === "in_review"
          ? "Documents are with our review team."
          : kyc === "rejected"
          ? "KYC was rejected. Resubmit to try again."
          : "Upload broker photo, visiting card and office photo.",
      cta:
        kyc === "verified"
          ? "View documents"
          : kyc === "in_review"
          ? "Track review"
          : "Upload documents",
      done: kyc === "verified" || !!profile?.onboarding_kyc_submitted,
      locked: !profileComplete,
      href: "/kyc",
    },
    {
      title: "Publish your first listing",
      description: "Listings are visible only to verified brokers.",
      cta: "Create listing",
      done: !!profile?.onboarding_listing_published,
      locked: kyc !== "verified",
      href: "/listings",
    },
    {
      title: "Connect with brokers in your city",
      description: "Send your first connection request to start building network.",
      cta: "Find brokers",
      done: !!profile?.onboarding_network_started,
      locked: kyc !== "verified",
      href: "/network",
    },
  ];

  const completed = steps.filter((s) => s.done).length;
  const progress = Math.round((completed / steps.length) * 100);

  const stats = [
    { label: "Active listings", value: String(listingsCountQ.data ?? 0), icon: Building2 },
    { label: "Connections", value: String(connCountQ.data ?? 0), icon: Users },
    { label: "Open deals", value: String(convoCountQ.data ?? 0), icon: MessagesSquare },
    { label: "KYC status", value: kycLabel(kyc), icon: ShieldCheck },
  ];

  return (
    <div className="flex-1 px-6 py-10 md:px-10">
      <div className="max-w-5xl">
        <div className="eyebrow">Welcome</div>
        <h1 className="mt-2 text-4xl tracking-tight md:text-5xl">Hi, {displayName}.</h1>
        <p className="mt-3 max-w-xl text-muted-foreground">
          Your BrokersConnect workspace is ready. Complete the checklist below to unlock the marketplace.
        </p>

        <div className="mt-8 rounded-2xl border border-hairline bg-foreground p-6 text-background">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-widest text-background/60">
                Onboarding
              </div>
              <p className="mt-1 text-lg font-medium">
                {completed} of {steps.length} steps complete
                {kyc === "verified" && " — you're live"}
              </p>
            </div>
            <div className="text-3xl font-extrabold tracking-tight tabular-nums">{progress}%</div>
          </div>
          <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-background/15">
            <div
              className="h-full bg-background transition-[width] duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-hairline bg-hairline sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="bg-card p-6">
              <s.icon className="h-5 w-5 text-muted-foreground" />
              <div className="mt-6 text-3xl font-extrabold tracking-tight">{s.value}</div>
              <div className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">
                {s.label}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <div className="rounded-2xl border border-hairline bg-card">
            <div className="border-b border-hairline px-6 py-4">
              <h2 className="text-lg font-bold">Getting started</h2>
            </div>
            <ol className="divide-y divide-hairline">
              {steps.map((step, i) => {
                const inner = (
                  <div className="flex items-start gap-4 px-6 py-5">
                    <span
                      className={
                        "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold " +
                        (step.done
                          ? "border-foreground bg-foreground text-background"
                          : "border-hairline text-muted-foreground")
                      }
                      aria-hidden
                    >
                      {step.done ? <Check className="h-4 w-4" /> : i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline gap-x-2">
                        <p className={"font-semibold " + (step.done ? "opacity-70" : "")}>
                          {step.title}
                        </p>
                        {step.locked && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                            <Lock className="h-3 w-3" /> Locked
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{step.description}</p>
                    </div>
                    <span
                      className={
                        "ml-auto inline-flex shrink-0 items-center gap-1 rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors " +
                        (step.locked
                          ? "border-hairline text-muted-foreground"
                          : "border-foreground bg-foreground text-background group-hover:bg-background group-hover:text-foreground")
                      }
                    >
                      {step.cta}
                      {!step.locked && <ArrowRight className="h-3.5 w-3.5" />}
                    </span>
                  </div>
                );

                return (
                  <li key={step.href}>
                    {step.locked ? (
                      <div className="cursor-not-allowed opacity-70" aria-disabled>
                        {inner}
                      </div>
                    ) : (
                      <Link
                        to={step.href}
                        className="group block transition-colors hover:bg-surface focus:bg-surface focus:outline-none"
                      >
                        {inner}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ol>
          </div>

          <div className="rounded-2xl border border-hairline bg-card p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Your profile</h2>
              <Link to="/settings" className="text-xs font-semibold uppercase tracking-widest text-muted-foreground hover:text-foreground">
                Edit
              </Link>
            </div>
            <dl className="mt-4 space-y-3 text-sm">
              <ProfileRowItem label="Name" value={profile?.full_name} />
              <ProfileRowItem label="Firm" value={profile?.firm} />
              <ProfileRowItem label="City" value={profile?.city} />
              <ProfileRowItem label="Phone" value={profile?.phone} />
              <div className="flex items-center justify-between gap-4 border-t border-hairline pt-3">
                <dt className="text-muted-foreground">KYC</dt>
                <dd>
                  <KycBadge status={kyc} />
                </dd>
              </div>
              {profile?.kyc_submitted_at && (
                <div className="text-xs text-muted-foreground">
                  Submitted {new Date(profile.kyc_submitted_at).toLocaleDateString()}
                </div>
              )}
            </dl>
            <Link
              to="/kyc"
              className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-foreground hover:underline"
            >
              Manage KYC documents <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileRowItem({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={value ? "font-medium" : "text-muted-foreground"}>{value || "Not set"}</dd>
    </div>
  );
}

function KycBadge({ status }: { status: ProfileRow["kyc_status"] }) {
  const map: Record<ProfileRow["kyc_status"], { label: string; cls: string }> = {
    verified: { label: "Verified", cls: "bg-foreground text-background" },
    in_review: { label: "In review", cls: "border border-foreground" },
    rejected: { label: "Rejected", cls: "border border-foreground" },
    pending: { label: "Pending", cls: "border border-hairline text-muted-foreground" },
  };
  const v = map[status];
  return (
    <span className={"inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold " + v.cls}>
      {v.label}
    </span>
  );
}

function kycLabel(s: ProfileRow["kyc_status"]) {
  switch (s) {
    case "verified": return "Verified";
    case "in_review": return "In review";
    case "rejected": return "Rejected";
    default: return "Pending";
  }
}
