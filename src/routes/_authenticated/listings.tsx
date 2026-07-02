import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SignedImage } from "@/components/SignedImage";
import { formatINR, relativeTime, errMessage } from "@/lib/format";
import type { Database, ListingRow } from "@/types/database-compat";
import { Building2, Loader2, MapPin, Plus, Trash2, Send } from "lucide-react";
import { DealRequestModal } from "@/components/deals/DealRequestModal";

export const Route = createFileRoute("/_authenticated/listings")({
  head: () => ({ meta: [{ title: "Listings — BrokersConnect" }] }),
  component: ListingsPage,
});

type Listing = ListingRow;
type PropertyType = "apartment" | "villa" | "plot" | "commercial" | "office" | "retail" | "warehouse" | "other";
type ListingType = "sale" | "rent" | "lease";
type ListingStatus = "draft" | "active" | "closed" | "rejected";

const PROPERTY_TYPES: PropertyType[] = [
  "apartment", "villa", "plot", "commercial", "office", "retail", "warehouse", "other",
];
const LISTING_TYPES: ListingType[] = ["sale", "rent", "lease"];
const LISTING_STATUSES: ListingStatus[] = ["draft", "active", "closed"];

function ListingsPage() {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const [open, setOpen] = useState(false);
  const isVerified = profile?.kyc_status === "verified";
  if (!user) {
    return <div className="flex-1 px-6 py-10 md:px-10 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="flex-1 px-6 py-10 md:px-10">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="eyebrow">Listings</div>
            <h1 className="mt-2 text-4xl tracking-tight md:text-5xl">Your inventory</h1>
            <p className="mt-2 max-w-xl text-muted-foreground">
              Manage your published properties and drafts.
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="gap-2"><Plus className="h-4 w-4" /> New listing</Button>
            </DialogTrigger>
            <ListingDialog onClose={() => setOpen(false)} />
          </Dialog>
        </div>

        <div className="mt-8">
          <MyListings userId={user.id} />
        </div>
      </div>
    </div>
  );
}

function MyListings({ userId }: { userId: string }) {
  const qc = useQueryClient();
  const { data, isPending, isError, error } = useQuery({
    queryKey: ["listings", "mine", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listings")
        .select("*")
        .eq("broker_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Listing[];
    },
  });

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ListingStatus }) => {
      const { error } = await supabase.from("listings").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["listings"] }),
    onError: (e) => toast.error(errMessage(e)),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("listings").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["listings"] });
      toast.success("Listing removed");
    },
    onError: (e) => toast.error(errMessage(e)),
  });

  if (isPending) return <Skeleton />;
  if (isError) {
    return (
      <div className="text-red-500 p-8 text-center bg-red-50 border border-red-200 border-dashed rounded-xl">
        Error loading listings: {errMessage(error)}
      </div>
    );
  }
  if (!data || data.length === 0) {
    return <EmptyState title="No listings yet" body="Create your first listing to share it with verified brokers." />;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {data.map((l) => (
        <article key={l.id} className="overflow-hidden rounded-2xl border border-hairline bg-card">
          <SignedImage
            bucket="listings"
            path={l.cover_image_url}
            alt={l.title}
            className="aspect-[4/3] w-full object-cover"
            fallbackClassName="aspect-[4/3] w-full"
          />
          <div className="p-5">
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-bold leading-tight">{l.title}</h3>
              <StatusPill status={(l.status as ListingStatus) || "draft"} />
            </div>
            <p className="mt-2 text-2xl font-extrabold tracking-tight">{formatINR(l.price)}</p>
            <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" /> {l.locality ? `${l.locality}, ${l.city}` : l.city}
            </p>
            <p className="mt-1 text-[11px] uppercase tracking-widest text-muted-foreground">
              {l.property_type} · {l.listing_type} · {relativeTime(l.created_at)}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <Select
                value={l.status || undefined}
                onValueChange={(v) => setStatus.mutate({ id: l.id, status: v as ListingStatus })}
              >
                <SelectTrigger className="h-9 w-[120px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LISTING_STATUSES.map((s) => (
                    <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto text-muted-foreground hover:text-foreground"
                onClick={() => {
                  if (confirm("Delete this listing?")) remove.mutate(l.id);
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}



const listingFormSchema = z.object({
  title: z.string().trim().min(3, "Title is required").max(180),
  description: z.string().trim().max(4000).optional(),
  property_type: z.enum(PROPERTY_TYPES as unknown as [PropertyType, ...PropertyType[]]),
  listing_type: z.enum(LISTING_TYPES as unknown as [ListingType, ...ListingType[]]),
  status: z.enum(LISTING_STATUSES as unknown as [ListingStatus, ...ListingStatus[]]),
  price: z.string().trim().optional(),
  city: z.string().trim().min(2, "City is required").max(120),
  locality: z.string().trim().max(180).optional(),
  bedrooms: z.string().trim().optional(),
  bathrooms: z.string().trim().optional(),
  area_sqft: z.string().trim().optional(),
});

function ListingDialog({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: profile } = useProfile();
  const [file, setFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    property_type: "apartment" as PropertyType,
    listing_type: "sale" as ListingType,
    status: "draft" as ListingStatus,
    price: "",
    city: profile?.city ?? "",
    locality: "",
    bedrooms: "",
    bathrooms: "",
    area_sqft: "",
  });

  const create = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("You must be logged in to create a listing.");
      
      const parsed = listingFormSchema.safeParse(form);
      if (!parsed.success) throw new Error(parsed.error.issues[0].message);
      const v = parsed.data;
      const { data: inserted, error } = await supabase
        .from("listings")
        .insert({
          broker_id: user.id,
          title: v.title,
          description: v.description || null,
          property_type: v.property_type,
          listing_type: v.listing_type,
          status: v.status,
          price: v.price ? Number(v.price) : null,
          city: v.city,
          locality: v.locality || null,
          bedrooms: v.bedrooms ? Number(v.bedrooms) : null,
          bathrooms: v.bathrooms ? Number(v.bathrooms) : null,
          area_sqft: v.area_sqft ? Number(v.area_sqft) : null,
        } as import("@/types/database-compat").ListingInsert)
        .select("id")
        .single();
      if (error) throw error;

      if (file) {
        const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
        const path = `${user.id}/${inserted.id}/cover.${ext}`;
        const up = await supabase.storage.from("listings").upload(path, file, {
          upsert: true,
          contentType: file.type,
        });
        if (up.error) throw up.error;
        await supabase.from("listings").update({ cover_image_url: path }).eq("id", inserted.id);
      }

      // Bump onboarding flag if first time publishing
      if (v.status === "active") {
        await supabase
          .from("profiles")
          .update({ onboarding_listing_published: true })
          .eq("id", user.id);
      }
    },
    onSuccess: () => {
      toast.success("Listing created");
      qc.invalidateQueries({ queryKey: ["listings"] });
      qc.invalidateQueries({ queryKey: ["profile"] });
      onClose();
    },
    onError: (e) => toast.error(errMessage(e)),
  });

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  return (
    <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle>New listing</DialogTitle>
        <DialogDescription>Shown only to KYC-verified brokers once activated.</DialogDescription>
      </DialogHeader>
      <form
        className="space-y-5"
        onSubmit={(e) => { e.preventDefault(); create.mutate(); }}
      >
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input id="title" value={form.title} onChange={(e) => set("title", e.target.value)}
            placeholder="3 BHK garden-facing apartment in Bandra West" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="desc">Description</Label>
          <Textarea id="desc" value={form.description} onChange={(e) => set("description", e.target.value)}
            placeholder="Layout, furnishings, society amenities, possession status…" rows={4} />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Property type">
            <Select value={form.property_type} onValueChange={(v) => set("property_type", v as PropertyType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PROPERTY_TYPES.map((p) => (
                  <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Listing">
            <Select value={form.listing_type} onValueChange={(v) => set("listing_type", v as ListingType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {LISTING_TYPES.map((p) => (
                  <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Status">
            <Select value={form.status} onValueChange={(v) => set("status", v as ListingStatus)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {LISTING_STATUSES.map((p) => (
                  <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Price (₹)">
            <Input type="number" inputMode="decimal" value={form.price}
              onChange={(e) => set("price", e.target.value)} placeholder="25000000" />
          </Field>
          <Field label="Area (sqft)">
            <Input type="number" inputMode="numeric" value={form.area_sqft}
              onChange={(e) => set("area_sqft", e.target.value)} placeholder="1200" />
          </Field>
          <Field label="Bedrooms">
            <Input type="number" inputMode="numeric" value={form.bedrooms}
              onChange={(e) => set("bedrooms", e.target.value)} placeholder="3" />
          </Field>
          <Field label="Bathrooms">
            <Input type="number" inputMode="numeric" value={form.bathrooms}
              onChange={(e) => set("bathrooms", e.target.value)} placeholder="2" />
          </Field>
          <Field label="City">
            <Input value={form.city} onChange={(e) => set("city", e.target.value)} placeholder="Mumbai" required />
          </Field>
          <Field label="Locality">
            <Input value={form.locality} onChange={(e) => set("locality", e.target.value)} placeholder="Bandra West" />
          </Field>
        </div>

        <div className="space-y-2">
          <Label htmlFor="image">Cover image</Label>
          <Input id="image" type="file" accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          <p className="text-xs text-muted-foreground">JPG/PNG up to ~5 MB.</p>
        </div>

        <DialogFooter className="gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={create.isPending}>
            {create.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create listing
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className="text-xs uppercase tracking-widest text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function StatusPill({ status }: { status: ListingStatus }) {
  const map: Record<ListingStatus, string> = {
    draft: "border border-hairline text-muted-foreground",
    active: "bg-foreground text-background",
    closed: "border border-foreground",
    rejected: "border border-red-500 text-red-500",
  };
  return (
    <span className={"shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest " + map[status]}>
      {status}
    </span>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-hairline bg-card px-6 py-16 text-center">
      <Building2 className="h-8 w-8 text-muted-foreground" />
      <h3 className="mt-4 text-lg font-bold">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{body}</p>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-72 animate-pulse rounded-2xl border border-hairline bg-surface" />
      ))}
    </div>
  );
}
// Silence unused warning for useMemo in some bundlers
void useMemo;
