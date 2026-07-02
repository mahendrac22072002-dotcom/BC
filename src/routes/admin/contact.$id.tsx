import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { relativeTime, errMessage } from "@/lib/format";

export const Route = createFileRoute("/admin/contact/$id")({
  component: ContactDetail,
});

function ContactDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [replyText, setReplyText] = useState("");
  const [internalNote, setInternalNote] = useState("");

  const q = useQuery({
    queryKey: ["admin", "contact", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contact_submissions")
        .select(`
          *,
          assigned_user:assigned_to ( email, raw_user_meta_data )
        `)
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const staffQ = useQuery({
    queryKey: ["admin", "staff-users"],
    queryFn: async () => {
      // In a real app we would query auth.users joined with staff_roles
      // Here we will just fetch staff_roles and rely on edges if possible, or leave as text input
      const { data, error } = await supabase.from("staff_roles").select("user_id");
      if (error) throw error;
      return data || [];
    }
  });

  // Mark as read when opening
  useEffect(() => {
    if (q.data && q.data.status === "unread") {
      supabase.from("contact_submissions").update({ status: "read" }).eq("id", id).then(() => {
        queryClient.invalidateQueries({ queryKey: ["admin", "contact"] });
      });
    }
  }, [q.data, id, queryClient]);

  const updateStatus = async (status: string) => {
    await supabase.from("contact_submissions").update({ status }).eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["admin", "contact"] });
  };

  const saveNote = async () => {
    const newNotes = q.data?.notes ? `${q.data.notes}\n\n--- ${new Date().toISOString().split('T')[0]} ---\n${internalNote}` : internalNote;
    await supabase.from("contact_submissions").update({ notes: newNotes }).eq("id", id);
    setInternalNote("");
    queryClient.invalidateQueries({ queryKey: ["admin", "contact", id] });
  };

  const sendReply = async () => {
    // In a real app, this would trigger an Edge Function to send an email via Resend
    // For now, we simulate success and update status
    await supabase.from("contact_submissions").update({ status: "replied" }).eq("id", id);
    alert("Reply sent successfully via Email (Simulation).");
    setReplyText("");
    queryClient.invalidateQueries({ queryKey: ["admin", "contact"] });
  };

  if (q.isPending) return <div className="p-8 text-sm text-zinc-500">Loading...</div>;
  if (q.isError) return <div className="p-8 text-sm text-red-500">Error: {errMessage(q.error)}</div>;
  if (!q.data) return <div className="p-8 text-sm text-red-500">Submission not found</div>;

  const sub = q.data;

  return (
    <div className="flex h-full flex-col md:flex-row overflow-hidden">
      {/* Main Content */}
      <div className="flex-1 overflow-auto p-6 lg:p-8 bg-white">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold mb-2">{sub.subject}</h2>
            <div className="flex items-center gap-3 text-sm text-zinc-600">
              <span className="font-semibold text-black">{sub.name}</span>
              <span>&lt;{sub.email}&gt;</span>
              <span>•</span>
              <span>{sub.created_at ? new Date(sub.created_at).toLocaleString() : ''}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => updateStatus(sub.status === 'archived' ? 'read' : 'archived')}>
              {sub.status === 'archived' ? 'Unarchive' : 'Archive'}
            </Button>
            <Button variant="outline" size="sm" onClick={() => updateStatus('deleted')} className="text-red-600 hover:text-red-700">Delete</Button>
          </div>
        </div>

        <div className="bg-slate-50 p-6 rounded-xl text-sm leading-relaxed whitespace-pre-wrap text-zinc-800 border mb-8">
          {sub.message}
        </div>

        <div className="mt-12">
          <h3 className="text-lg font-bold mb-4">Reply to User</h3>
          <textarea 
            className="w-full h-32 rounded-md border p-3 text-sm mb-4" 
            placeholder="Type your reply here... (Will be sent via email if Resend is configured)"
            value={replyText}
            onChange={e => setReplyText(e.target.value)}
          />
          <Button onClick={sendReply} disabled={!replyText.trim()}>Send Reply</Button>
        </div>
      </div>

      {/* Sidebar Info */}
      <div className="w-full md:w-80 bg-slate-50 border-l p-6 overflow-auto">
        <h3 className="font-bold text-sm uppercase tracking-wider text-zinc-500 mb-6">Details</h3>
        
        <div className="space-y-4 text-sm mb-8">
          <div>
            <div className="text-zinc-500 text-xs mb-1">Status</div>
            <select 
              value={sub.status}
              onChange={e => updateStatus(e.target.value)}
              className="w-full rounded border p-1.5 bg-white"
            >
              <option value="unread">Unread</option>
              <option value="read">Read</option>
              <option value="replied">Replied</option>
              <option value="resolved">Resolved</option>
              <option value="archived">Archived</option>
              <option value="deleted">Deleted</option>
            </select>
          </div>
          <div>
            <div className="text-zinc-500 text-xs mb-1">Phone</div>
            <div>{sub.phone || "—"}</div>
          </div>
          <div>
            <div className="text-zinc-500 text-xs mb-1">Company</div>
            <div>{sub.company || "—"}</div>
          </div>
          <div>
            <div className="text-zinc-500 text-xs mb-1">Assigned To</div>
            <div className="text-zinc-400 italic">Unassigned</div>
          </div>
        </div>

        <h3 className="font-bold text-sm uppercase tracking-wider text-zinc-500 mb-4 border-t pt-6">Internal Notes</h3>
        {sub.notes && (
          <div className="bg-yellow-50 p-3 rounded text-xs whitespace-pre-wrap text-yellow-900 border border-yellow-200 mb-4">
            {sub.notes}
          </div>
        )}
        <textarea 
          className="w-full h-20 rounded border p-2 text-xs mb-2 bg-white" 
          placeholder="Add a private note..."
          value={internalNote}
          onChange={e => setInternalNote(e.target.value)}
        />
        <Button variant="secondary" size="sm" className="w-full" onClick={saveNote} disabled={!internalNote.trim()}>Save Note</Button>
      </div>
    </div>
  );
}
