import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profile";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SignedImage } from "@/components/SignedImage";
import { formatINR, errMessage } from "@/lib/format";
import type { Database, ListingRow } from "@/types/database-compat";
import { Building2, MapPin, Loader2 } from "lucide-react";
import { DealRequestModal } from "@/components/deals/DealRequestModal";

export const Route = createFileRoute("/_authenticated/marketplace")({
  head: () => ({ meta: [{ title: "Marketplace — BrokersConnect" }] }),
  component: MarketplacePage,
});

type Listing = ListingRow;
type PropertyType = "apartment" | "villa" | "plot" | "commercial" | "office" | "retail" | "warehouse" | "other";
type ListingType = "sale" | "rent" | "lease";

const PROPERTY_TYPES: PropertyType[] = [
  "apartment", "villa", "plot", "commercial", "office", "retail", "warehouse", "other",
];
const LISTING_TYPES: ListingType[] = ["sale", "rent", "lease"];

function MarketplacePage() {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const isVerified = profile?.kyc_status === "verified";

  const [city, setCity] = useState("");
  const [locality, setLocality] = useState("");
  const [propertyType, setPropertyType] = useState<PropertyType | "all">("all");
  const [listingType, setListingType] = useState<ListingType | "all">("all");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [bathrooms, setBathrooms] = useState("");
  const [minArea, setMinArea] = useState("");

  const { data, isPending, isError, error } = useQuery({
    queryKey: ["listings", "marketplace", city, locality, propertyType, listingType, minPrice, maxPrice, bedrooms, bathrooms, minArea],
    queryFn: async () => {
      let q = supabase
        .from("listings")
        .select("*, broker:broker_id(full_name, firm, kyc_status)")
        .eq("status", "active");
        
      if (!import.meta.env.VITE_SHOW_OWN_LISTINGS) {
        q = q.neq("broker_id", user?.id || "00000000-0000-0000-0000-000000000000");
      }

      if (city) q = q.ilike("city", `%${city}%`);
      if (locality) q = q.ilike("locality", `%${locality}%`);
      if (propertyType !== "all") q = q.eq("property_type", propertyType);
      if (listingType !== "all") q = q.eq("listing_type", listingType);
      if (minPrice) q = q.gte("price", Number(minPrice));
      if (maxPrice) q = q.lte("price", Number(maxPrice));
      if (bedrooms) q = q.eq("bedrooms", Number(bedrooms));
      if (bathrooms) q = q.eq("bathrooms", Number(bathrooms));
      if (minArea) q = q.gte("area_sqft", Number(minArea));

      const { data, error } = await q.order("created_at", { ascending: false }).limit(100);
      if (error) throw error;
      return data as (Listing & { broker: { full_name: string | null; firm: string | null; kyc_status: string } })[];
    },
    enabled: isVerified && !!user,
  });

  if (!user) {
    return (
      <div className="flex-1 px-6 py-10 md:px-10 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isVerified) {
    return (
      <div className="flex-1 px-6 py-10 md:px-10">
        <div className="mx-auto max-w-6xl">
          <div className="eyebrow mb-2">Marketplace</div>
          <h1 className="text-4xl tracking-tight md:text-5xl mb-8">Verified Broker Network</h1>
          <EmptyState title="Verification required" body="Complete KYC to browse listings from other brokers and send deal requests." />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 px-6 py-10 md:px-10 flex flex-col h-full overflow-hidden">
      <div className="mx-auto max-w-6xl w-full flex-1 flex flex-col">
        <div className="mb-6">
          <div className="eyebrow mb-2">Marketplace</div>
          <h1 className="text-4xl tracking-tight md:text-5xl">Broker Network</h1>
          <p className="mt-2 text-muted-foreground">Discover published properties from verified brokers and propose deals.</p>
        </div>

        <div className="flex flex-col gap-4 bg-slate-50 p-4 rounded-xl border border-hairline mb-6 shrink-0">
          <div className="flex flex-wrap gap-4">
            <Input 
              placeholder="Search City" 
              value={city} 
              onChange={(e) => setCity(e.target.value)}
              className="w-full sm:w-48 bg-white"
            />
            <Input 
              placeholder="Locality" 
              value={locality} 
              onChange={(e) => setLocality(e.target.value)}
              className="w-full sm:w-48 bg-white"
            />
            <Select value={propertyType} onValueChange={(v) => setPropertyType(v as PropertyType | "all")}>
              <SelectTrigger className="w-full sm:w-48 bg-white"><SelectValue placeholder="Property Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Properties</SelectItem>
                {PROPERTY_TYPES.map(p => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={listingType} onValueChange={(v) => setListingType(v as ListingType | "all")}>
              <SelectTrigger className="w-full sm:w-48 bg-white"><SelectValue placeholder="Listing Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {LISTING_TYPES.map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-wrap gap-4">
            <Input 
              type="number"
              placeholder="Min Price" 
              value={minPrice} 
              onChange={(e) => setMinPrice(e.target.value)}
              className="w-full sm:w-32 bg-white"
            />
            <Input 
              type="number"
              placeholder="Max Price" 
              value={maxPrice} 
              onChange={(e) => setMaxPrice(e.target.value)}
              className="w-full sm:w-32 bg-white"
            />
            <Input 
              type="number"
              placeholder="Beds" 
              value={bedrooms} 
              onChange={(e) => setBedrooms(e.target.value)}
              className="w-full sm:w-24 bg-white"
            />
            <Input 
              type="number"
              placeholder="Baths" 
              value={bathrooms} 
              onChange={(e) => setBathrooms(e.target.value)}
              className="w-full sm:w-24 bg-white"
            />
            <Input 
              type="number"
              placeholder="Min Sqft" 
              value={minArea} 
              onChange={(e) => setMinArea(e.target.value)}
              className="w-full sm:w-32 bg-white"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 pb-10">
          {isPending ? (
            <div className="flex justify-center items-center h-48"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
          ) : isError ? (
            <div className="text-red-500 p-8 text-center bg-red-50 border border-red-200 border-dashed rounded-xl">
              Error fetching marketplace: {errMessage(error)}
            </div>
          ) : !data || data.length === 0 ? (
            <EmptyState 
              title="No listings from other brokers yet." 
              body="Your own listings are hidden from the marketplace."
            >
              <Button asChild>
                <Link to="/listings">View My Listings</Link>
              </Button>
            </EmptyState>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.map((l) => (
                <article key={l.id} className="overflow-hidden rounded-2xl border border-hairline bg-card flex flex-col">
                  <SignedImage bucket="listings" path={l.cover_image_url} alt={l.title}
                    className="aspect-[4/3] w-full object-cover" fallbackClassName="aspect-[4/3] w-full" />
                  <div className="p-5 flex flex-col h-full">
                    <h3 className="font-bold leading-tight">{l.title}</h3>
                    <p className="mt-2 text-2xl font-extrabold tracking-tight">{formatINR(l.price)}</p>
                    
                    <div className="mt-3 flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold shrink-0">
                        {l.broker.full_name?.charAt(0) || '?'}
                      </div>
                      <div className="text-sm truncate">
                        <span className="font-medium">{l.broker.full_name}</span>
                        {l.broker.firm && <span className="text-muted-foreground"> • {l.broker.firm}</span>}
                      </div>
                      {l.broker.kyc_status === 'verified' && (
                        <span className="bg-emerald-100 text-emerald-700 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase shrink-0">Verified</span>
                      )}
                    </div>

                    <p className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" /> {l.locality ? `${l.locality}, ${l.city}` : l.city}
                    </p>
                    <p className="mt-1 mb-4 text-[11px] uppercase tracking-widest text-muted-foreground">
                      {l.property_type} · {l.listing_type} {l.area_sqft ? `· ${l.area_sqft} sqft` : ''} · {l.created_at ? new Date(l.created_at).toLocaleDateString() : ''}
                    </p>
                    <div className="mt-auto pt-4 border-t border-hairline">
                      <DealRequestModal listing={l} requestingBrokerId={user.id} />
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ title, body, children }: { title: string; body: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-hairline bg-card px-6 py-16 text-center">
      <Building2 className="h-8 w-8 text-muted-foreground" />
      <h3 className="mt-4 text-lg font-bold">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{body}</p>
      {children && <div className="mt-6">{children}</div>}
    </div>
  );
}
