import { errMessage } from "@/lib/format";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profile";
import { useRoles } from "@/hooks/use-role";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — BrokersConnect" }] }),
  component: SettingsPage,
});

const schema = z.object({
  full_name: z.string().trim().min(2, "Full name required").max(120),
  firm: z.string().trim().max(120).optional(),
  city: z.string().trim().min(2, "City required").max(120),
  phone: z.string().trim().max(40).optional(),
});

function SettingsPage() {
  const { user } = useAuth();
  const { data: profile, isPending } = useProfile();
  const { roles } = useRoles();
  const qc = useQueryClient();

  const [form, setForm] = useState({ full_name: "", firm: "", city: "", phone: "" });

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name ?? "",
        firm: profile.firm ?? "",
        city: profile.city ?? "",
        phone: profile.phone ?? "",
      });
    }
  }, [profile]);

  const save = useMutation({
    mutationFn: async () => {
      const parsed = schema.safeParse(form);
      if (!parsed.success) throw new Error(parsed.error.issues[0].message);
      const v = parsed.data;
      const profileComplete = !!v.full_name && !!v.firm && !!v.city;
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: v.full_name,
          firm: v.firm || null,
          city: v.city,
          phone: v.phone || null,
          onboarding_profile_completed: profileComplete,
        })
        .eq("id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Profile saved");
      qc.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (e) => toast.error(errMessage(e)),
  });

  return (
    <div className="flex-1 px-6 py-10 md:px-10">
      <div className="mx-auto max-w-3xl">
        <div className="eyebrow">Account</div>
        <h1 className="mt-2 text-4xl tracking-tight md:text-5xl">Settings</h1>

        <form
          className="mt-8 space-y-5 rounded-2xl border border-hairline bg-card p-6"
          onSubmit={(e) => { e.preventDefault(); save.mutate(); }}
        >
          <div className="space-y-2">
            <Label htmlFor="full_name">Full name</Label>
            <Input id="full_name" value={form.full_name} disabled={isPending}
              onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))} required />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firm">Firm</Label>
              <Input id="firm" value={form.firm}
                onChange={(e) => setForm((f) => ({ ...f, firm: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input id="city" value={form.city} required
                onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={user?.email ?? ""} disabled />
            </div>
          </div>
          <Button type="submit" disabled={save.isPending}>
            {save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save changes
          </Button>
        </form>

        <div className="mt-8 rounded-2xl border border-hairline bg-card p-6">
          <h2 className="text-lg font-bold">Roles</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Roles are managed by the BrokersConnect admin team.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {roles.length === 0 ? (
              <span className="text-sm text-muted-foreground">No roles assigned.</span>
            ) : (
              roles.map((r) => (
                <span key={r} className="rounded-full bg-foreground px-3 py-1 text-xs font-bold uppercase tracking-widest text-background">
                  {r}
                </span>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
