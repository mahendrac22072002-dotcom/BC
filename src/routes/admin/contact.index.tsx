import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { relativeTime, errMessage } from "@/lib/format";

export const Route = createFileRoute("/admin/contact/")({
  component: ContactInbox,
});

function ContactInbox() {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const [page, setPage] = useState(0);
  const pageSize = 50;

  const q = useQuery({
    queryKey: ["admin", "contact", filter, search, page],
    queryFn: async () => {
      let query = supabase.from("contact_submissions").select("*", { count: "exact" }).order("created_at", { ascending: false });
      
      if (filter !== "all") {
        query = query.eq("status", filter);
      }
      if (search) {
        query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,subject.ilike.%${search}%`);
      }
      
      const { data, error, count } = await query.range(page * pageSize, (page + 1) * pageSize - 1);
      if (error) throw error;
      return { data, count };
    },
  });

  const exportCSV = () => {
    if (!q.data?.data) return;
    const headers = ["ID", "Name", "Email", "Phone", "Subject", "Status", "Created At"];
    const rows = q.data.data.map(r => [
      r.id, 
      `"${(r.name || "").replace(/"/g, '""')}"`, 
      r.email, 
      r.phone || "", 
      `"${(r.subject || "").replace(/"/g, '""')}"`, 
      r.status, 
      r.created_at
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `contact_submissions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalPages = q.data?.count ? Math.ceil(q.data.count / pageSize) : 0;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-4 p-4 border-b">
        <Input 
          placeholder="Search name, email, subject..." 
          value={search} 
          onChange={e => { setSearch(e.target.value); setPage(0); }} 
          className="max-w-sm"
        />
        <select 
          value={filter} 
          onChange={e => { setFilter(e.target.value); setPage(0); }}
          className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
        >
          <option value="all">All Statuses</option>
          <option value="unread">Unread</option>
          <option value="read">Read</option>
          <option value="replied">Replied</option>
          <option value="resolved">Resolved</option>
          <option value="archived">Archived</option>
          <option value="deleted">Deleted</option>
        </select>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" onClick={exportCSV}>Export CSV</Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-slate-50 p-4">
        {q.isPending ? (
          <div className="text-center text-sm text-zinc-500 py-8">Loading...</div>
        ) : q.isError ? (
          <div className="text-center text-sm text-red-500 py-8">
            Error loading submissions: {errMessage(q.error)}
          </div>
        ) : !q.data?.data || q.data.data.length === 0 ? (
          <div className="text-center text-sm text-zinc-500 py-8">No contact submissions found.</div>
        ) : (
          <>
            <div className="bg-white rounded-lg border shadow-sm divide-y mb-4">
              {q.data.data.map(sub => (
                <div 
                  key={sub.id} 
                  onClick={() => navigate({ to: `/admin/contact/${sub.id}` })}
                  className={`p-4 flex gap-4 items-center cursor-pointer hover:bg-slate-50 ${sub.status === 'unread' ? 'bg-blue-50/30' : ''}`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-sm font-semibold truncate ${sub.status === 'unread' ? 'text-black' : 'text-zinc-700'}`}>{sub.name}</span>
                      <span className="text-xs text-zinc-500 truncate">{sub.email}</span>
                    </div>
                    <div className={`text-sm truncate ${sub.status === 'unread' ? 'font-semibold text-black' : 'text-zinc-600'}`}>
                      {sub.subject}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className="text-xs text-zinc-400">{relativeTime(sub.created_at)}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide
                      ${sub.status === 'unread' ? 'bg-blue-100 text-blue-700' : 
                        sub.status === 'replied' ? 'bg-emerald-100 text-emerald-700' : 
                        sub.status === 'resolved' ? 'bg-purple-100 text-purple-700' : 
                        'bg-slate-100 text-slate-700'}`}
                    >
                      {sub.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            
            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <div className="text-sm text-zinc-500">
                  Showing {page * pageSize + 1} to {Math.min((page + 1) * pageSize, q.data.count || 0)} of {q.data.count}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Previous</Button>
                  <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Next</Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
