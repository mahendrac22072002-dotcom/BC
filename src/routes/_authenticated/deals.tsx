import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Building2, MessageSquare, Loader2 } from "lucide-react";
import { relativeTime, errMessage } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/deals")({
  head: () => ({ meta: [{ title: "Deal Rooms — BrokersConnect" }] }),
  component: DealsLayout,
});

function DealsLayout() {
  const { user } = useAuth();
  
  // Fetch deal requests (incoming or outgoing)
  const requestsQuery = useQuery({
    queryKey: ["deal_requests", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deal_requests")
        .select(`
          *,
          property:property_id (title, city, cover_image_url),
          requesting_broker:requesting_broker_id (full_name, firm),
          listing_broker:listing_broker_id (full_name, firm)
        `)
        .or(`listing_broker_id.eq.${user?.id},requesting_broker_id.eq.${user?.id}`)
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  // Fetch deal rooms where I am a member
  const roomsQuery = useQuery({
    queryKey: ["deal_rooms", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deal_room_members")
        .select(`
          room_id,
          role,
          deal_rooms!inner (
            id, status, created_at,
            property:property_id (title, city, cover_image_url)
          )
        `)
        .eq("user_id", user?.id || "00000000-0000-0000-0000-000000000000");
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  if (!user) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-61px)] lg:h-screen w-full overflow-hidden bg-white">
      {/* Sidebar List */}
      <div className="w-full md:w-[350px] border-r flex flex-col bg-slate-50 flex-shrink-0 h-full">
        <div className="p-4 border-b bg-white flex items-center justify-between">
          <h1 className="font-bold text-lg">Deal Rooms</h1>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Pending Requests Section */}
          {requestsQuery.isError && (
            <div className="p-4 border-b border-dashed">
              <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Pending Requests</h2>
              <div className="text-xs text-red-500">Error loading requests: {errMessage(requestsQuery.error)}</div>
            </div>
          )}
          {requestsQuery.data && requestsQuery.data.length > 0 && (
            <div className="p-4 border-b border-dashed">
              <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Pending Requests</h2>
              <div className="space-y-2">
                {requestsQuery.data.map(req => {
                  const isIncoming = req.listing_broker_id === user.id;
                  const otherBroker = isIncoming ? req.requesting_broker : req.listing_broker;
                  return (
                    <Link
                      key={req.id}
                      to={`/deals/requests/${req.id}`}
                      className="block p-3 bg-white border rounded-lg hover:border-slate-400 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-xs font-semibold text-blue-600">
                          {isIncoming ? "Incoming Offer" : "Sent Offer"}
                        </span>
                        <span className="text-[10px] text-muted-foreground">{relativeTime(req.created_at)}</span>
                      </div>
                      <div className="font-semibold text-sm truncate">{req.property.title}</div>
                      <div className="text-xs text-muted-foreground truncate">with {otherBroker.full_name}</div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Active Deal Rooms Section */}
          <div className="p-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Active Deals</h2>
            {roomsQuery.isPending ? (
              <div className="flex justify-center p-4"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>
            ) : roomsQuery.isError ? (
              <div className="text-center p-8 text-sm text-red-500 border border-dashed border-red-200 rounded-xl bg-red-50">
                Error loading deals: {errMessage(roomsQuery.error)}
              </div>
            ) : !roomsQuery.data || roomsQuery.data.length === 0 ? (
              <div className="text-center p-8 text-sm text-muted-foreground border border-dashed rounded-xl bg-white">
                <Building2 className="h-8 w-8 mx-auto mb-2 opacity-20" />
                No active deals yet.
              </div>
            ) : (
              <div className="space-y-1">
                {roomsQuery.data.map(m => {
                  const room = m.deal_rooms;
                  return (
                    <Link
                      key={room.id}
                      to={`/deals/${room.id}`}
                      className="block p-3 rounded-lg hover:bg-slate-200/50 transition-colors"
                      activeProps={{ className: "bg-slate-200" }}
                    >
                      <div className="font-semibold text-sm truncate">{room.property.title}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider
                          ${room.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'}`}>
                          {room.status}
                        </span>
                        <span className="text-xs text-muted-foreground truncate">{room.property.city}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="hidden md:flex flex-1 flex-col bg-white overflow-hidden relative">
        <Outlet />
      </div>
    </div>
  );
}
