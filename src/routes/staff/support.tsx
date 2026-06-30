import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Search,
  Send,
  Paperclip,
  CheckCheck,
  CircleDot,
  Building2,
  Phone,
  ShieldCheck,
  StickyNote,
  ArrowLeft,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { errMessage, initials, relativeTime } from "@/lib/format";
import { maskName, maskPhone } from "@/lib/privacy";
import { logAdminAction } from "@/lib/audit";
import { notify } from "@/lib/notifications";
import { cn } from "@/lib/utils";
import type { Database } from "@/integrations/supabase/types";

export const Route = createFileRoute("/staff/support")({
  head: () => ({ meta: [{ title: "Support — Staff" }] }),
  component: SupportInbox,
});

type Thread = Database["public"]["Tables"]["support_threads"]["Row"];
type Msg = Database["public"]["Tables"]["support_messages"]["Row"];
type Note = Database["public"]["Tables"]["support_internal_notes"]["Row"];
type Status = Database["public"]["Enums"]["support_status"];
type Priority = Database["public"]["Enums"]["support_priority"];

const STATUS_TABS: { key: Status | "all"; label: string }[] = [
  { key: "open", label: "Open" },
  { key: "pending", label: "Pending" },
  { key: "resolved", label: "Resolved" },
  { key: "closed", label: "Closed" },
  { key: "all", label: "All" },
];

const PRIORITY_COLOR: Record<Priority, string> = {
  low: "bg-zinc-100 text-zinc-700",
  normal: "bg-blue-100 text-blue-700",
  high: "bg-amber-100 text-amber-800",
  urgent: "bg-red-100 text-red-700",
};

export function SupportInbox() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [active, setActive] = useState<string | null>(null);
  const [tab, setTab] = useState<Status | "all">("open");
  const [search, setSearch] = useState("");

  const threadsQ = useQuery({
    queryKey: ["staff", "threads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("support_threads")
        .select("*")
        .order("last_message_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as Thread[];
    },
  });

  const openerIds = Array.from(new Set((threadsQ.data ?? []).map((t) => t.opener_id)));
  const profilesQ = useQuery({
    queryKey: ["staff", "thread-openers", openerIds.sort().join(",")],
    enabled: openerIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, firm, phone, city, kyc_status")
        .in("id", openerIds);
      if (error) throw error;
      const map = new Map<string, {
        full_name: string | null; firm: string | null; phone: string | null; city: string | null; kyc_status: string | null;
      }>();
      (data ?? []).forEach((p) =>
        map.set(p.id, {
          full_name: p.full_name, firm: p.firm, phone: p.phone, city: p.city, kyc_status: p.kyc_status,
        }),
      );
      return map;
    },
  });

  const lastMsgQ = useQuery({
    queryKey: ["staff", "last-msgs", (threadsQ.data ?? []).map((t) => t.id).join(",")],
    enabled: (threadsQ.data ?? []).length > 0,
    queryFn: async () => {
      const ids = (threadsQ.data ?? []).map((t) => t.id);
      const { data, error } = await supabase
        .from("support_messages")
        .select("thread_id, body, created_at")
        .in("thread_id", ids)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const map = new Map<string, { body: string; created_at: string }>();
      for (const m of data ?? []) {
        if (!map.has(m.thread_id)) map.set(m.thread_id, { body: m.body, created_at: m.created_at });
      }
      return map;
    },
  });

  const messagesQ = useQuery({
    queryKey: ["staff", "messages", active],
    enabled: !!active,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("support_messages")
        .select("*")
        .eq("thread_id", active!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Msg[];
    },
  });

  const notesQ = useQuery({
    queryKey: ["staff", "notes", active],
    enabled: !!active,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("support_internal_notes")
        .select("*")
        .eq("thread_id", active!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Note[];
    },
  });

  // Realtime — new messages
  useEffect(() => {
    if (!active) return;
    const ch = supabase
      .channel(`staff-thread-${active}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "support_messages", filter: `thread_id=eq.${active}` },
        () => {
          qc.invalidateQueries({ queryKey: ["staff", "messages", active] });
          qc.invalidateQueries({ queryKey: ["staff", "last-msgs"] });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [active, qc]);

  // Realtime — thread changes
  useEffect(() => {
    const ch = supabase
      .channel(`staff-threads`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "support_threads" },
        () => qc.invalidateQueries({ queryKey: ["staff", "threads"] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [qc]);

  const activeThread = (threadsQ.data ?? []).find((t) => t.id === active) ?? null;
  const activeProfile = activeThread ? profilesQ.data?.get(activeThread.opener_id) ?? null : null;

  const reply = useMutation({
    mutationFn: async (body: string) => {
      const { error } = await supabase
        .from("support_messages")
        .insert({ thread_id: active!, sender_id: user!.id, body });
      if (error) throw error;
      if (activeThread) {
        await notify({
          user_id: activeThread.opener_id,
          kind: "support_reply",
          title: `Staff replied: ${activeThread.subject}`,
          body: body.slice(0, 140),
          link: "/help",
        });
      }
      await logAdminAction({
        action: "support.reply",
        resource: "support_threads",
        resource_id: active!,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["staff", "messages", active] });
      qc.invalidateQueries({ queryKey: ["staff", "threads"] });
    },
    onError: (e) => toast.error(errMessage(e)),
  });

  const addNote = useMutation({
    mutationFn: async (body: string) => {
      const { error } = await supabase.from("support_internal_notes").insert({
        thread_id: active!, author_id: user!.id, body,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["staff", "notes", active] }),
    onError: (e) => toast.error(errMessage(e)),
  });

  const setStatus = useMutation({
    mutationFn: async (status: Status) => {
      const patch: Partial<Thread> = { status };
      if (status === "closed") patch.closed_at = new Date().toISOString();
      const { error } = await supabase
        .from("support_threads")
        .update(patch as never)
        .eq("id", active!);
      if (error) throw error;
      await logAdminAction({
        action: `support.${status}`,
        resource: "support_threads",
        resource_id: active!,
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["staff", "threads"] }),
    onError: (e) => toast.error(errMessage(e)),
  });

  const setPriority = useMutation({
    mutationFn: async (priority: Priority) => {
      const { error } = await supabase
        .from("support_threads")
        .update({ priority })
        .eq("id", active!);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["staff", "threads"] }),
    onError: (e) => toast.error(errMessage(e)),
  });

  const assignToMe = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("support_threads")
        .update({ assigned_to: user!.id })
        .eq("id", active!);
      if (error) throw error;
      await logAdminAction({
        action: "support.assign",
        resource: "support_threads",
        resource_id: active!,
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["staff", "threads"] }),
    onError: (e) => toast.error(errMessage(e)),
  });

  const threads = threadsQ.data ?? [];
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return threads.filter((t) => {
      if (tab !== "all" && t.status !== tab) return false;
      if (q) {
        const p = profilesQ.data?.get(t.opener_id);
        const displayName = maskName(p?.full_name);
        const blob = `${t.subject} ${displayName} ${p?.firm ?? ""}`.toLowerCase();
        if (!blob.includes(q)) return false;
      }
      return true;
    });
  }, [threads, search, tab, profilesQ.data]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { open: 0, pending: 0, resolved: 0, closed: 0, all: threads.length };
    for (const t of threads) c[t.status] = (c[t.status] ?? 0) + 1;
    return c;
  }, [threads]);

  return (
    <div className="flex h-[calc(100vh-64px)] flex-col">
      <div className="flex h-14 items-center justify-between border-b border-zinc-200 bg-white px-4">
        <div>
          <h1 className="text-base font-bold tracking-tight text-zinc-900">Support Inbox</h1>
          <p className="hidden text-[11px] text-zinc-500 md:block">Chat with brokers in real time.</p>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[320px_1fr_320px] bg-zinc-50">
        {/* LEFT */}
        <aside className={cn("flex min-h-0 flex-col border-r border-zinc-200 bg-white", active && "hidden lg:flex")}>
          <div className="border-b border-zinc-200 p-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search subject or broker…"
                className="h-9 pl-8"
              />
            </div>
            <div className="mt-3 flex flex-wrap gap-1">
              {STATUS_TABS.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setTab(s.key)}
                  className={cn(
                    "rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors",
                    tab === s.key
                      ? "bg-zinc-900 text-white"
                      : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200",
                  )}
                >
                  {s.label} <span className="ml-0.5 opacity-70">{counts[s.key] ?? 0}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {threadsQ.isPending ? (
              <div className="p-6 text-center text-xs text-zinc-400">Loading…</div>
            ) : filtered.length === 0 ? (
              <div className="p-8 text-center text-sm text-zinc-400">No threads.</div>
            ) : (
              <ul className="divide-y divide-zinc-100">
                {filtered.map((t) => {
                  const p = profilesQ.data?.get(t.opener_id);
                  const last = lastMsgQ.data?.get(t.id);
                  return (
                    <li key={t.id}>
                      <button
                        type="button"
                        onClick={() => setActive(t.id)}
                        className={cn(
                          "flex w-full items-start gap-3 px-3 py-3 text-left transition-colors hover:bg-zinc-50",
                          active === t.id && "bg-zinc-100",
                        )}
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-[11px] font-bold text-white">
                          {initials(maskName(p?.full_name))}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <div className="truncate text-sm font-semibold text-zinc-900">
                              {maskName(p?.full_name) || "Broker"}
                            </div>
                            <div className="shrink-0 text-[10px] text-zinc-400">
                              {relativeTime(t.last_message_at)}
                            </div>
                          </div>
                          <div className="truncate text-xs text-zinc-600">{t.subject}</div>
                          <div className="mt-0.5 truncate text-xs text-zinc-400">
                            {last?.body ?? "—"}
                          </div>
                          <div className="mt-1.5 flex items-center gap-1.5">
                            <span
                              className={cn(
                                "rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider",
                                PRIORITY_COLOR[t.priority],
                              )}
                            >
                              {t.priority}
                            </span>
                            <span className="rounded-full bg-zinc-100 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider text-zinc-600">
                              {t.status}
                            </span>
                          </div>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </aside>

        {/* MIDDLE */}
        <section className={cn("flex min-h-0 min-w-0 flex-col bg-white", !active && "hidden lg:flex")}>
          {!activeThread ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100">
                <Send className="h-5 w-5 text-zinc-400" />
              </div>
              <div className="text-sm font-semibold text-zinc-700">Select a thread to start replying</div>
            </div>
          ) : (
            <ConversationStaff
              thread={activeThread}
              profile={activeProfile}
              messages={messagesQ.data ?? []}
              loading={messagesQ.isPending}
              currentUserId={user!.id}
              onBack={() => setActive(null)}
              onSend={(b) => reply.mutate(b)}
              sending={reply.isPending}
              onPriority={(p) => setPriority.mutate(p)}
              onStatus={(s) => setStatus.mutate(s)}
              onAssignMe={() => assignToMe.mutate()}
            />
          )}
        </section>

        {/* RIGHT */}
        <aside className={cn("hidden min-h-0 flex-col overflow-y-auto border-l border-zinc-200 bg-white lg:flex")}>
          {!activeThread ? (
            <div className="p-6 text-xs text-zinc-400">Broker details appear here.</div>
          ) : (
            <StaffDetailsPanel
              thread={activeThread}
              profile={activeProfile}
              notes={notesQ.data ?? []}
              onAddNote={(b) => addNote.mutate(b)}
              addingNote={addNote.isPending}
            />
          )}
        </aside>
      </div>
    </div>
  );
}

function ConversationStaff({
  thread,
  profile,
  messages,
  loading,
  currentUserId,
  onSend,
  onBack,
  sending,
  onPriority,
  onStatus,
  onAssignMe,
}: {
  thread: Thread;
  profile: { full_name: string | null; firm: string | null; kyc_status: string | null } | null;
  messages: Msg[];
  loading: boolean;
  currentUserId: string;
  onSend: (b: string) => void;
  onBack: () => void;
  sending: boolean;
  onPriority: (p: Priority) => void;
  onStatus: (s: Status) => void;
  onAssignMe: () => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  return (
    <>
      <header className="flex items-center gap-3 border-b border-zinc-200 px-4 py-2.5">
        <button
          type="button"
          onClick={onBack}
          className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 lg:hidden"
          aria-label="Back"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-[11px] font-bold text-white">
          {initials(maskName(profile?.full_name))}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-zinc-900">
            {maskName(profile?.full_name) || "Broker"}
            {profile?.kyc_status === "verified" && (
              <ShieldCheck className="ml-1 inline h-3.5 w-3.5 text-emerald-600" />
            )}
          </div>
          <div className="flex items-center gap-2 text-[11px] text-zinc-500">
            <CircleDot className="h-2.5 w-2.5 text-emerald-500" />
            <span className="truncate">{thread.subject}</span>
            <span>·</span>
            <span className="font-mono">#{thread.id.slice(0, 6)}</span>
          </div>
        </div>
        <Select value={thread.priority} onValueChange={(v) => onPriority(v as Priority)}>
          <SelectTrigger className="h-8 w-[110px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(["low", "normal", "high", "urgent"] as const).map((p) => (
              <SelectItem key={p} value={p}>{p}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button size="sm" variant="outline" onClick={onAssignMe}>Take</Button>
        {thread.status !== "resolved" && (
          <Button size="sm" variant="outline" onClick={() => onStatus("resolved")}>Resolve</Button>
        )}
        {thread.status !== "closed" ? (
          <Button size="sm" variant="ghost" onClick={() => onStatus("closed")}>Close</Button>
        ) : (
          <Button size="sm" variant="ghost" onClick={() => onStatus("open")}>Reopen</Button>
        )}
      </header>

      <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto bg-zinc-50 px-4 py-5">
        {loading ? (
          <div className="text-center text-xs text-zinc-400">Loading…</div>
        ) : messages.length === 0 ? (
          <div className="mx-auto max-w-sm rounded-xl border border-dashed border-zinc-200 bg-white p-6 text-center text-xs text-zinc-500">
            No messages yet.
          </div>
        ) : (
          messages.map((m) => {
            const fromBroker = m.sender_id === thread.opener_id;
            const mine = m.sender_id === currentUserId;
            return (
              <div key={m.id} className={cn("flex", fromBroker ? "justify-start" : "justify-end")}>
                <div
                  className={cn(
                    "max-w-[78%] rounded-2xl px-3.5 py-2 text-sm shadow-sm",
                    fromBroker
                      ? "rounded-bl-sm border border-zinc-200 bg-white text-zinc-900"
                      : "rounded-br-sm bg-zinc-900 text-white",
                  )}
                >
                  <div className="whitespace-pre-wrap break-words">{m.body}</div>
                  <div
                    className={cn(
                      "mt-1 flex items-center justify-end gap-1 text-[10px]",
                      fromBroker ? "text-zinc-400" : "text-white/70",
                    )}
                  >
                    {relativeTime(m.created_at)}
                    {mine && <CheckCheck className="h-3 w-3" />}
                  </div>
                </div>
              </div>
            );
          })
        )}
        {/* Placeholder typing indicator */}
        <div className="hidden animate-pulse flex items-center gap-1.5 text-[10px] text-zinc-400">
           Broker is typing<span className="flex gap-0.5"><span className="h-1 w-1 rounded-full bg-zinc-400 animate-bounce"></span><span className="h-1 w-1 rounded-full bg-zinc-400 animate-bounce" style={{animationDelay: '0.1s'}}></span><span className="h-1 w-1 rounded-full bg-zinc-400 animate-bounce" style={{animationDelay: '0.2s'}}></span></span>
        </div>
      </div>

      {thread.status !== "closed" ? (
        <ComposerStaff onSend={onSend} disabled={sending} />
      ) : (
        <div className="border-t border-zinc-200 bg-zinc-50 px-4 py-3 text-center text-xs text-zinc-500">
          Ticket is closed.
        </div>
      )}
    </>
  );
}

function ComposerStaff({ onSend, disabled }: { onSend: (b: string) => void; disabled: boolean }) {
  const [body, setBody] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);
  function submit(e?: React.FormEvent) {
    e?.preventDefault();
    const v = body.trim();
    if (!v) return;
    onSend(v);
    setBody("");
    ref.current?.focus();
  }
  return (
    <form
      onSubmit={submit}
      className="flex items-end gap-2 border-t border-zinc-200 bg-white px-3 py-2.5"
    >
      <Button type="button" variant="ghost" size="icon" className="h-10 w-10 shrink-0 text-zinc-400 hover:text-zinc-600">
        <Paperclip className="h-5 w-5" />
      </Button>
      <div className="flex-1 rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-2 focus-within:border-zinc-400">
        <Textarea
          ref={ref}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          rows={1}
          placeholder="Reply to broker…  (Enter to send)"
          className="min-h-0 resize-none border-0 bg-transparent px-0 py-0 text-sm shadow-none focus-visible:ring-0"
        />
      </div>
      <Button type="submit" size="icon" disabled={disabled || !body.trim()} className="h-10 w-10 rounded-full">
        <Send className="h-4 w-4" />
      </Button>
    </form>
  );
}

function StaffDetailsPanel({
  thread,
  profile,
  notes,
  onAddNote,
  addingNote,
}: {
  thread: Thread;
  profile:
    | { full_name: string | null; firm: string | null; phone: string | null; city: string | null; kyc_status: string | null }
    | null;
  notes: Note[];
  onAddNote: (b: string) => void;
  addingNote: boolean;
}) {
  const [note, setNote] = useState("");
  return (
    <div className="space-y-5 p-5">
      <div className="rounded-lg border border-zinc-200 bg-white p-4">
        <div className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
          Broker
        </div>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900 text-[11px] font-bold text-white">
            {initials(maskName(profile?.full_name))}
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-zinc-900">
              {maskName(profile?.full_name) ?? "—"}
            </div>
            <div className="truncate text-xs text-zinc-500">{profile?.city ?? ""}</div>
          </div>
        </div>
        <ul className="mt-4 space-y-2 text-xs text-zinc-600">
          <li className="flex items-center gap-2">
            <Building2 className="h-3.5 w-3.5" /> {profile?.firm ?? "—"}
          </li>
          <li className="flex items-center gap-2">
            <Phone className="h-3.5 w-3.5" /> {maskPhone(profile?.phone)}
          </li>
          <li className="flex items-center gap-2">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span className="uppercase tracking-wider">KYC: {profile?.kyc_status ?? "pending"}</span>
          </li>
        </ul>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-4">
        <div className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
          Ticket
        </div>
        <div className="text-sm font-semibold text-zinc-900">{thread.subject}</div>
        <div className="mt-1 font-mono text-[10px] text-zinc-500">#{thread.id.slice(0, 8)}</div>
        <ul className="mt-3 space-y-1.5 text-xs text-zinc-500">
          <li>Created {relativeTime(thread.created_at)}</li>
          <li>Last message {relativeTime(thread.last_message_at)}</li>
          {thread.closed_at && <li>Closed {relativeTime(thread.closed_at)}</li>}
        </ul>
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-4">
        <div className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-amber-800">
          <StickyNote className="h-3 w-3" /> Internal notes
        </div>
        <ul className="mb-3 space-y-1.5 text-xs">
          {notes.length === 0 ? (
            <li className="text-zinc-500">No internal notes yet.</li>
          ) : (
            notes.map((n) => (
              <li key={n.id} className="rounded bg-white/60 p-2 text-zinc-700">
                <div className="text-[10px] text-zinc-500">{relativeTime(n.created_at)}</div>
                <div>{n.body}</div>
              </li>
            ))
          )}
        </ul>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const v = note.trim();
            if (!v) return;
            onAddNote(v);
            setNote("");
          }}
          className="flex gap-2"
        >
          <Input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a note…"
            className="h-8"
          />
          <Button type="submit" size="sm" variant="outline" disabled={addingNote || !note.trim()}>
            Add
          </Button>
        </form>
      </div>
    </div>
  );
}
