import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { formatINR, errMessage } from "@/lib/format";
import { toast } from "sonner";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/deals/requests/$id")({
  component: DealRequestDetail,
});

function DealRequestDetail() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();

  const { data: req, isPending } = useQuery({
    queryKey: ["deal_requests", "detail", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deal_requests")
        .select(`
          *,
          property:property_id (title, city, cover_image_url, price, area_sqft, bedrooms, locality),
          requesting_broker:requesting_broker_id (id, full_name, firm, city),
          listing_broker:listing_broker_id (id, full_name, firm, city)
        `)
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    }
  });

  const acceptMutation = useMutation({
    mutationFn: async () => {
      // 1. Update request status
      const { error: reqErr } = await supabase
        .from("deal_requests")
        .update({ status: "accepted" })
        .eq("id", id);
      if (reqErr) throw reqErr;

      // 2. Create Deal Room
      const { data: room, error: roomErr } = await supabase
        .from("deal_rooms")
        .insert({
          request_id: id,
          property_id: req!.property_id,
          status: "active"
        })
        .select("id")
        .single();
      if (roomErr) throw roomErr;

      // 3. Get Staff Members
      const { data: staff } = await supabase.from("staff_roles").select("user_id, role");
      const staffMembers = (staff || []).map(s => ({
        room_id: room.id,
        user_id: s.user_id,
        role: s.role === "admin" || s.role === "super_admin" ? "admin" : "staff",
      }));

      // 4. Add Members (Listing Broker, Requesting Broker, Admin, Staff)
      const { error: memErr } = await supabase
        .from("deal_room_members")
        .insert([
          { room_id: room.id, user_id: req!.listing_broker_id, role: "listing_broker" },
          { room_id: room.id, user_id: req!.requesting_broker_id, role: "buyer_broker" },
          ...staffMembers
        ]);
      if (memErr) throw memErr;

      // 4. Create timeline event
      await supabase.from("deal_timeline").insert({
        room_id: room.id,
        event_type: "deal_created",
        actor_id: user?.id,
        description: "Deal Room automatically created after request acceptance."
      });

      return room.id;
    },
    onSuccess: (roomId) => {
      toast.success("Request accepted. Deal Room created!");
      qc.invalidateQueries({ queryKey: ["deal_requests"] });
      qc.invalidateQueries({ queryKey: ["deal_rooms"] });
      navigate({ to: `/deals/${roomId}` });
    },
    onError: (e) => toast.error(errMessage(e))
  });

  const rejectMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("deal_requests")
        .update({ status: "rejected" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Request rejected");
      qc.invalidateQueries({ queryKey: ["deal_requests"] });
      navigate({ to: "/deals" });
    },
    onError: (e) => toast.error(errMessage(e))
  });

  if (isPending) return <div className="flex items-center justify-center h-full"><Loader2 className="animate-spin h-8 w-8 text-slate-300" /></div>;
  if (!user) return null;
  if (!req) return <div className="p-8 text-center text-muted-foreground">Request not found.</div>;

  const isIncoming = req.listing_broker_id === user.id;
  const otherBroker = isIncoming ? req.requesting_broker : req.listing_broker;

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto p-6 lg:p-10">
        
        <div className="mb-8">
          <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
            {isIncoming ? "Incoming Deal Request" : "Sent Deal Request"}
          </div>
          <h1 className="text-2xl font-bold mb-4">Request for {req.property.title}</h1>
          <div className="flex items-center gap-4 text-sm text-slate-600">
            <span className="bg-slate-100 px-2 py-1 rounded font-medium">Status: {req.status.toUpperCase()}</span>
            <span>Created: {new Date(req.created_at).toLocaleString()}</span>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <div className="space-y-6">
            <section className="bg-slate-50 p-6 rounded-xl border">
              <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-4">Proposal Details</h2>
              <div className="space-y-4 text-sm">
                <div>
                  <span className="block text-slate-500 text-xs mb-1">Offer Price</span>
                  <span className="font-semibold text-lg">{req.offer_price ? formatINR(req.offer_price) : "Not specified"}</span>
                </div>
                <div>
                  <span className="block text-slate-500 text-xs mb-1">Commission Proposal</span>
                  <span className="font-semibold">{req.commission_proposal}</span>
                </div>
                <div>
                  <span className="block text-slate-500 text-xs mb-1">Expected Closing Date</span>
                  <span className="font-semibold">{req.expected_closing_date ? new Date(req.expected_closing_date).toLocaleDateString() : "Not specified"}</span>
                </div>
                <div>
                  <span className="block text-slate-500 text-xs mb-1">Message</span>
                  <p className="bg-white p-3 rounded border text-slate-800 whitespace-pre-wrap">{req.message}</p>
                </div>
                {req.notes && (
                  <div>
                    <span className="block text-slate-500 text-xs mb-1">Notes</span>
                    <p className="bg-white p-3 rounded border text-slate-800 whitespace-pre-wrap">{req.notes}</p>
                  </div>
                )}
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <section className="bg-white p-6 rounded-xl border shadow-sm">
              <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-4">Property Snapshot</h2>
              <div className="text-sm">
                <div className="font-bold mb-2">{req.property.title}</div>
                <div className="text-slate-600 mb-1">Original Price: {formatINR(req.property.price)}</div>
                <div className="text-slate-600">{req.property.locality}, {req.property.city}</div>
              </div>
            </section>

            <section className="bg-white p-6 rounded-xl border shadow-sm">
              <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-4">Broker Details</h2>
              <div className="text-sm">
                <div className="font-bold mb-1">{otherBroker.full_name}</div>
                <div className="text-slate-600 mb-1">{otherBroker.firm}</div>
                <div className="text-slate-600">{otherBroker.city}</div>
              </div>
            </section>
          </div>
        </div>

        {isIncoming && req.status === 'pending' && (
          <div className="flex gap-4 border-t pt-8">
            <Button size="lg" className="flex-1 bg-emerald-600 hover:bg-emerald-700" onClick={() => acceptMutation.mutate()} disabled={acceptMutation.isPending}>
              {acceptMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-5 w-5 mr-2" />}
              Accept & Create Deal Room
            </Button>
            <Button size="lg" variant="outline" className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => rejectMutation.mutate()} disabled={rejectMutation.isPending}>
              {rejectMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <XCircle className="h-5 w-5 mr-2" />}
              Reject Offer
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
