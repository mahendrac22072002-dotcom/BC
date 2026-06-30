import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatINR } from "@/lib/format";
import { Briefcase, Loader2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/deals")({
  head: () => ({ meta: [{ title: "Deal Management — Admin" }] }),
  component: AdminDeals,
});

function AdminDeals() {
  const navigate = useNavigate();
  
  const { data: deals, isPending } = useQuery({
    queryKey: ["admin", "deals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deal_rooms")
        .select(`
          id,
          status,
          created_at,
          property:property_id (title, city, price),
          request:request_id (offer_price),
          members:deal_room_members(role, user:user_id(full_name))
        `)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  return (
    <div className="p-6 md:p-10 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Deal Management</h1>
          <p className="text-sm text-slate-500">Monitor all active deals, assign staff, and oversee negotiations.</p>
        </div>
      </div>

      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        {isPending ? (
          <div className="p-12 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-slate-300" /></div>
        ) : !deals || deals.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground border-dashed border-2 m-6 rounded-xl bg-slate-50">
            <Briefcase className="h-8 w-8 mx-auto mb-2 opacity-20" />
            No deals currently active.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-[10px] uppercase tracking-widest text-slate-500 bg-slate-50 border-b">
              <tr>
                <th className="px-5 py-3 text-left font-semibold">Property</th>
                <th className="px-5 py-3 text-left font-semibold">Value</th>
                <th className="px-5 py-3 text-left font-semibold">Participants</th>
                <th className="px-5 py-3 text-left font-semibold">Status</th>
                <th className="px-5 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {deals.map(deal => {
                const brokers = deal.members.filter(m => m.role === 'listing_broker' || m.role === 'buyer_broker');
                const staff = deal.members.filter(m => m.role === 'admin' || m.role === 'staff');
                
                return (
                  <tr key={deal.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-900">{deal.property.title}</div>
                      <div className="text-xs text-slate-500">{deal.property.city}</div>
                    </td>
                    <td className="px-5 py-4 font-semibold">
                      {deal.request?.offer_price ? formatINR(deal.request.offer_price) : formatINR(deal.property.price)}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-slate-400" />
                        <span className="text-xs">{brokers.length} brokers, {staff.length} staff</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        deal.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {deal.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Button variant="outline" size="sm" onClick={() => navigate({ to: `/deals/${deal.id}` })}>
                        Enter Room
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
