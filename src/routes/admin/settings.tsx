import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { usePermissions } from "@/hooks/use-permissions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { errMessage } from "@/lib/format";
import { logAdminAction } from "@/lib/audit";
import { Save } from "lucide-react";

export const Route = createFileRoute("/admin/settings")({
  head: () => ({ meta: [{ title: "Site Settings — Admin" }] }),
  component: SettingsPage,
});

interface SocialLinks {
  twitter?: string;
  linkedin?: string;
  instagram?: string;
  youtube?: string;
}

interface SettingsForm {
  brand_name: string;
  support_email: string;
  contact_phone: string;
  seo_title: string;
  seo_description: string;
  footer_html: string;
  social_links: SocialLinks;
}

const empty: SettingsForm = {
  brand_name: "",
  support_email: "",
  contact_phone: "",
  seo_title: "",
  seo_description: "",
  footer_html: "",
  social_links: {},
};

function SettingsPage() {
  const { can } = usePermissions();
  const qc = useQueryClient();
  const editable = can("settings", "update");
  const [form, setForm] = useState<SettingsForm>(empty);

  const q = useQuery({
    queryKey: ["admin", "site_settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("*")
        .eq("singleton", true)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (q.data) {
      setForm({
        brand_name: q.data.brand_name ?? "",
        support_email: q.data.support_email ?? "",
        contact_phone: q.data.contact_phone ?? "",
        seo_title: q.data.seo_title ?? "",
        seo_description: q.data.seo_description ?? "",
        footer_html: q.data.footer_html ?? "",
        social_links: (q.data.social_links ?? {}) as SocialLinks,
      });
    }
  }, [q.data]);

  const save = useMutation({
    mutationFn: async () => {
      if (!q.data) throw new Error("Settings row missing");
      const before = q.data;
      const { error } = await supabase
        .from("site_settings")
        .update({
          brand_name: form.brand_name.trim() || "BrokersConnect",
          support_email: form.support_email.trim() || null,
          contact_phone: form.contact_phone.trim() || null,
          seo_title: form.seo_title.trim() || null,
          seo_description: form.seo_description.trim() || null,
          footer_html: form.footer_html.trim() || null,
          social_links: form.social_links as never,
        })
        .eq("id", q.data.id);
      if (error) throw error;
      await logAdminAction({
        action: "site_settings.update",
        resource: "site_settings",
        resource_id: q.data.id,
        before,
        after: form,
      });
    },
    onSuccess: () => {
      toast.success("Settings saved");
      qc.invalidateQueries({ queryKey: ["admin", "site_settings"] });
    },
    onError: (e) => toast.error(errMessage(e)),
  });

  const Field = ({
    id,
    label,
    hint,
    children,
  }: {
    id: string;
    label: string;
    hint?: string;
    children: React.ReactNode;
  }) => (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs font-semibold text-slate-700">
        {label}
      </Label>
      {children}
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Site Settings</h1>
          <p className="text-sm text-slate-500">
            Brand, support, and SEO defaults shown across the public site.
          </p>
        </div>
        <Button
          onClick={() => save.mutate()}
          disabled={!editable || save.isPending}
          className="h-9 gap-1.5 bg-slate-900 hover:bg-slate-800"
        >
          <Save className="h-3.5 w-3.5" />
          {save.isPending ? "Saving…" : "Save changes"}
        </Button>
      </div>

      {!editable && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-800">
          Read-only — you don't have settings:update permission.
        </div>
      )}

      {q.isPending ? (
        <div className="rounded-lg border border-slate-200 bg-white px-5 py-12 text-center text-sm text-slate-500">
          Loading…
        </div>
      ) : (
        <div className="space-y-6">
          <section className="rounded-lg border border-slate-200 bg-white p-6">
            <h2 className="mb-4 text-sm font-semibold text-slate-900">Brand</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="brand_name" label="Brand name">
                <Input
                  id="brand_name"
                  value={form.brand_name}
                  disabled={!editable}
                  onChange={(e) => setForm({ ...form, brand_name: e.target.value })}
                />
              </Field>
              <Field id="support_email" label="Support email">
                <Input
                  id="support_email"
                  type="email"
                  value={form.support_email}
                  disabled={!editable}
                  onChange={(e) => setForm({ ...form, support_email: e.target.value })}
                />
              </Field>
              <Field id="contact_phone" label="Contact phone">
                <Input
                  id="contact_phone"
                  value={form.contact_phone}
                  disabled={!editable}
                  onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
                />
              </Field>
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-6">
            <h2 className="mb-4 text-sm font-semibold text-slate-900">SEO defaults</h2>
            <div className="grid gap-4">
              <Field
                id="seo_title"
                label="Default title"
                hint="Used on pages that don't override the title."
              >
                <Input
                  id="seo_title"
                  value={form.seo_title}
                  disabled={!editable}
                  onChange={(e) => setForm({ ...form, seo_title: e.target.value })}
                />
              </Field>
              <Field id="seo_description" label="Default meta description">
                <Textarea
                  id="seo_description"
                  rows={3}
                  value={form.seo_description}
                  disabled={!editable}
                  onChange={(e) => setForm({ ...form, seo_description: e.target.value })}
                />
              </Field>
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-6">
            <h2 className="mb-4 text-sm font-semibold text-slate-900">Social</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {(["twitter", "linkedin", "instagram", "youtube"] as const).map((k) => (
                <Field key={k} id={`social_${k}`} label={k[0].toUpperCase() + k.slice(1)}>
                  <Input
                    id={`social_${k}`}
                    placeholder={`https://${k}.com/yourbrand`}
                    value={form.social_links[k] ?? ""}
                    disabled={!editable}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        social_links: { ...form.social_links, [k]: e.target.value },
                      })
                    }
                  />
                </Field>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-6">
            <h2 className="mb-4 text-sm font-semibold text-slate-900">Footer HTML</h2>
            <Textarea
              rows={5}
              value={form.footer_html}
              disabled={!editable}
              onChange={(e) => setForm({ ...form, footer_html: e.target.value })}
              placeholder="© 2026 BrokersConnect. All rights reserved."
            />
            <p className="mt-2 text-xs text-slate-500">
              Rendered as-is in the public footer. Keep markup minimal.
            </p>
          </section>
        </div>
      )}
    </div>
  );
}
