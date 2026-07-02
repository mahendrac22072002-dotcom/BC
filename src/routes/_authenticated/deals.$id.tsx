import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect, useRef } from "react";
import { formatINR, errMessage } from "@/lib/format";
import { Send, Paperclip, Loader2, FileText, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { SignedImage } from "@/components/SignedImage";

export const Route = createFileRoute("/_authenticated/deals/$id")({
  component: DealRoomDetail,
});

function DealRoomDetail() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [msg, setMsg] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  const { data: room, isPending } = useQuery({
    queryKey: ["deal_rooms", "detail", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deal_rooms")
        .select(`
          *,
          property:property_id (*),
          request:request_id (*),
          members:deal_room_members(
            role,
            user:user_id(id, full_name, firm, kyc_status)
          )
        `)
        .eq("id", id)
        .single();
      if (error) throw error;
      return data as any;
    }
  });

  const { data: messages } = useQuery({
    queryKey: ["deal_messages", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deal_messages")
        .select("*, sender:sender_id(id, full_name)")
        .eq("room_id", id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as any[];
    },
    refetchInterval: 3000 // Simple polling for now
  });

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = useMutation({
    mutationFn: async () => {
      if (!msg.trim() || !user) return;
      const { error } = await supabase
        .from("deal_messages")
        .insert({
          room_id: id,
          sender_id: user.id,
          content: msg.trim(),
        });
      if (error) throw error;
      setMsg("");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["deal_messages", id] });
    },
    onError: (e) => toast.error(errMessage(e))
  });

  if (isPending) return <div className="flex flex-1 items-center justify-center"><Loader2 className="animate-spin text-slate-300 h-8 w-8" /></div>;
  if (!user) return <div className="p-8 text-center text-muted-foreground">Please log in to view this room.</div>;
  if (!room) return <div className="p-8 text-center text-muted-foreground">Deal Room not found.</div>;

  return (
    <div className="flex h-full w-full bg-white overflow-hidden">
      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 border-r relative bg-slate-50">
        
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b bg-white flex-shrink-0 z-10">
          <div>
            <h2 className="font-bold text-lg truncate">{room.property.title}</h2>
            <div className="text-xs text-muted-foreground flex gap-2 items-center">
              <span className={`px-2 py-0.5 rounded-full uppercase tracking-widest text-[9px] font-bold ${room.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'}`}>
                {room.status}
              </span>
              <span>Deal Room created {new Date(room.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="text-center">
            <div className="inline-block bg-white border rounded-full px-4 py-1 text-xs text-muted-foreground shadow-sm">
              Deal Room Created. Start negotiating!
            </div>
          </div>

          {messages?.map(m => {
            const isMe = m.sender_id === user.id;
            return (
              <div key={m.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <span className="text-[10px] text-muted-foreground mb-1 px-1">{isMe ? 'You' : m.sender.full_name}</span>
                <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${isMe ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white border text-slate-800 rounded-bl-none'}`}>
                  {m.content}
                </div>
                <span className="text-[10px] text-slate-400 mt-1 px-1">{new Date(m.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
              </div>
            );
          })}
          <div ref={endRef} />
        </div>

        {/* Input */}
        <div className="p-4 bg-white border-t">
          <form 
            onSubmit={e => { e.preventDefault(); sendMessage.mutate(); }}
            className="flex items-center gap-2"
          >
            <Button type="button" variant="ghost" size="icon" className="shrink-0 text-slate-400 hover:text-slate-600">
              <Paperclip className="h-5 w-5" />
            </Button>
            <Input 
              value={msg}
              onChange={e => setMsg(e.target.value)}
              placeholder="Type a message..." 
              className="flex-1 h-12 bg-slate-50 border-slate-200 rounded-full px-6"
            />
            <Button type="submit" size="icon" className="shrink-0 rounded-full h-12 w-12" disabled={sendMessage.isPending || !msg.trim()}>
              {sendMessage.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            </Button>
          </form>
        </div>
      </div>

      {/* Internal Deal Panel (Right Sidebar) */}
      <div className="w-80 bg-white flex-shrink-0 flex flex-col overflow-y-auto border-l">
        <div className="p-6 border-b">
          <h3 className="font-bold uppercase tracking-widest text-[10px] text-muted-foreground mb-4">Property Details</h3>
          <SignedImage bucket="listings" path={room.property.cover_image_url} alt={room.property.title} className="w-full aspect-video rounded-lg object-cover border mb-4" />
          <h4 className="font-bold text-sm mb-1">{room.property.title}</h4>
          <div className="text-xl font-extrabold mb-2">{formatINR(room.property.price)}</div>
          <div className="text-xs text-muted-foreground">{room.property.locality}, {room.property.city}</div>
        </div>

        <div className="p-6 border-b">
          <h3 className="font-bold uppercase tracking-widest text-[10px] text-muted-foreground mb-4">Participants</h3>
          <div className="space-y-4">
            {room.members?.map((m: any) => (
              <div key={m.user.id} className="flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold shrink-0">
                    {m.user.full_name?.charAt(0) || '?'}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold truncate">{m.user.full_name}</div>
                    <div className="text-[10px] uppercase text-muted-foreground tracking-widest">{m.role.replace('_', ' ')}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 pt-6 border-t">
            <Button variant="outline" size="sm" className="w-full text-xs gap-2 border-dashed">
              + Assign Staff / Admin
            </Button>
          </div>
        </div>

        <div className="p-6 border-b">
          <h3 className="font-bold uppercase tracking-widest text-[10px] text-muted-foreground mb-4">Deal Progress</h3>
          <div className="space-y-3 text-sm bg-slate-50 p-4 rounded-xl border">
            <div>
              <span className="block text-slate-500 text-[10px] uppercase tracking-wider mb-0.5">Deal Status</span>
              <select 
                className="w-full border rounded px-2 py-1 bg-white text-sm font-semibold"
                value={room.status}
                onChange={e => alert("Admin status change coming soon")}
              >
                <option value="active">Active</option>
                <option value="pending_documents">Pending Documents</option>
                <option value="negotiation">Negotiation</option>
                <option value="closed">Closed / Won</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div className="pt-2">
              <span className="block text-slate-500 text-[10px] uppercase tracking-wider mb-0.5">Agreed Offer Price</span>
              <span className="font-semibold">{room.request.offer_price ? formatINR(room.request.offer_price) : 'N/A'}</span>
            </div>
            <div>
              <span className="block text-slate-500 text-[10px] uppercase tracking-wider mb-0.5">Commission Proposal</span>
              <span className="font-semibold">{room.request.commission_proposal}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
