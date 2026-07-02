import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Search,
  Plus,
  Send,
  X,
  CheckCheck,
  Building2,
  Phone,
  Mail,
  ShieldCheck,
  CircleDot,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { errMessage, initials, relativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Database } from "@/integrations/supabase/types";

export const Route = createFileRoute("/_authenticated/help")({
  head: () => ({ meta: [{ title: "Help Center — BrokersConnect" }] }),
  component: HelpCenter,
});

type Thread = Database["public"]["Tables"]["support_threads"]["Row"];
type Msg = Database["public"]["Tables"]["support_messages"]["Row"];
type Priority = Database["public"]["Enums"]["support_priority"];
type Status = Database["public"]["Enums"]["support_status"];

const STATUS_TABS: { key: Status | "all"; label: string }[] = [
  { key: "open", label: "Open" },
  { key: "pending", label: "Pending" },
  { key: "resolved", label: "Resolved" },
  { key: "closed", label: "Closed" },
  { key: "all", label: "All" },
];

const PRIORITY_COLOR: Record<Priority, string> = {
  low: "bg-slate-100 text-slate-700",
  normal: "bg-blue-100 text-blue-700",
  high: "bg-amber-100 text-amber-800",
  urgent: "bg-red-100 text-red-700",
};

function HelpCenter() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [active, setActive] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<Status | "all">("open");

  const threadsQ = useQuery({
    queryKey: ["help", "threads", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("support_threads")
        .select("*")
        .eq("opener_id", user!.id)
        .order("last_message_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Thread[];
    },
  });

  // Last-message preview lookup
  const lastMsgQ = useQuery({
    queryKey: ["help", "last-msgs", (threadsQ.data ?? []).map((t) => t.id).join(",")],
    enabled: (threadsQ.data ?? []).length > 0,
    queryFn: async () => {
      const ids = (threadsQ.data ?? []).map((t) => t.id);
      const { data, error } = await supabase
        .from("support_messages")
        .select("thread_id, body, created_at, sender_id")
        .in("thread_id", ids)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const map = new Map<string, { body: string; created_at: string; sender_id: string }>();
      for (const m of data ?? []) {
        if (!map.has(m.thread_id)) {
          map.set(m.thread_id, { body: m.body, created_at: m.created_at, sender_id: m.sender_id });
        }
      }
      return map;
    },
  });

  const profileQ = useQuery({
    queryKey: ["help", "self-profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, firm, phone, city, kyc_status")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const messagesQ = useQuery({
    queryKey: ["help", "messages", active],
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

  // Realtime: new messages in active thread
  useEffect(() => {
    if (!active) return;
    const ch = supabase
      .channel(`help-thread-${active}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "support_messages", filter: `thread_id=eq.${active}` },
        () => {
          qc.invalidateQueries({ queryKey: ["help", "messages", active] });
          qc.invalidateQueries({ queryKey: ["help", "last-msgs"] });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [active, qc]);

  // Realtime: thread status changes
  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel(`help-threads-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "support_threads", filter: `opener_id=eq.${user.id}` },
        () => qc.invalidateQueries({ queryKey: ["help", "threads", user.id] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [user, qc]);

  const reply = useMutation({
    mutationFn: async (body: string) => {
      const { error } = await supabase
        .from("support_messages")
        .insert({ thread_id: active!, sender_id: user!.id, body });
      if (error) throw error;
      await supabase
        .from("support_threads")
        .update({ status: "open", last_message_at: new Date().toISOString() })
        .eq("id", active!);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["help", "messages", active] });
      qc.invalidateQueries({ queryKey: ["help", "threads"] });
    },
    onError: (e) => toast.error(errMessage(e)),
  });

  const close = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("support_threads")
        .update({ status: "closed", closed_at: new Date().toISOString() })
        .eq("id", active!);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["help", "threads"] });
      toast.success("Ticket closed");
    },
    onError: (e) => toast.error(errMessage(e)),
  });

  const threads = threadsQ.data ?? [];
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return threads.filter((t) => {
      if (tab !== "all" && t.status !== tab) return false;
      if (q && !t.subject.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [threads, search, tab]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { open: 0, pending: 0, resolved: 0, closed: 0, all: threads.length };
    for (const t of threads) c[t.status] = (c[t.status] ?? 0) + 1;
    return c;
  }, [threads]);

  const activeThread = threads.find((t) => t.id === active) ?? null;

  return (
    <div className="flex h-[calc(100vh-64px)] flex-col md:h-screen">
      <div className="flex h-14 items-center justify-between border-b border-hairline px-4 md:px-6">
        <div>
          <h1 className="text-base font-bold tracking-tight md:text-lg">Help Center</h1>
          <p className="hidden text-[11px] text-muted-foreground md:block">
            Chat with our team. Replies arrive in real time.
          </p>
        </div>
        <Button size="sm" onClick={() => setCreating(true)} className="gap-1.5">
          <Plus className="h-3.5 w-3.5" /> New ticket
        </Button>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[320px_1fr_320px]">
        {/* LEFT — thread list */}
        <aside className={cn("flex min-h-0 flex-col border-r border-hairline bg-surface/40", active && "hidden lg:flex")}>
          <div className="border-b border-hairline p-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tickets…"
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
                      ? "bg-foreground text-background"
                      : "bg-surface text-muted-foreground hover:bg-muted",
                  )}
                >
                  {s.label}
                  <span className="ml-1 opacity-70">{counts[s.key] ?? 0}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {threadsQ.isPending ? (
              <div className="p-6 text-center text-xs text-muted-foreground">Loading…</div>
            ) : filtered.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                {threads.length === 0 ? "No tickets yet — start one." : "Nothing matches your filter."}
              </div>
            ) : (
              <ul className="divide-y divide-hairline">
                {filtered.map((t) => {
                  const last = lastMsgQ.data?.get(t.id);
                  return (
                    <li key={t.id}>
                      <button
                        type="button"
                        onClick={() => setActive(t.id)}
                        className={cn(
                          "flex w-full items-start gap-3 px-3 py-3 text-left transition-colors hover:bg-surface",
                          active === t.id && "bg-surface",
                        )}
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-foreground text-[11px] font-bold text-background">
                          {initials(t.subject)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <div className="truncate text-sm font-semibold">{t.subject}</div>
                            <div className="shrink-0 text-[10px] text-muted-foreground">
                              {relativeTime(t.last_message_at)}
                            </div>
                          </div>
                          <div className="mt-0.5 truncate text-xs text-muted-foreground">
                            {last?.body ?? "No messages yet."}
                          </div>
                          <div className="mt-1.5 flex items-center gap-1.5">
                            <span
                              className={cn(
                                "rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider",
                                PRIORITY_COLOR[t.priority as keyof typeof PRIORITY_COLOR],
                              )}
                            >
                              {t.priority}
                            </span>
                            <span className="rounded-full bg-surface px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider text-muted-foreground">
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

        {/* MIDDLE — conversation */}
        <section className={cn("flex min-h-0 min-w-0 flex-col bg-background", !active && "hidden lg:flex")}>
          {creating ? (
            <NewTicket
              onCancel={() => setCreating(false)}
              onCreated={(id) => {
                setCreating(false);
                setActive(id);
                qc.invalidateQueries({ queryKey: ["help", "threads"] });
              }}
            />
          ) : !activeThread ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-surface">
                <Send className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <div className="text-sm font-semibold">Select a ticket</div>
                <div className="text-xs text-muted-foreground">
                  Or start a new conversation to get help.
                </div>
              </div>
            </div>
          ) : (
            <Conversation
              thread={activeThread}
              messages={messagesQ.data ?? []}
              loading={messagesQ.isPending}
              currentUserId={user!.id}
              onClose={() => close.mutate()}
              onBack={() => setActive(null)}
              onSend={(body) => reply.mutate(body)}
              sending={reply.isPending}
            />
          )}
        </section>

        {/* RIGHT — details */}
        <aside className={cn("hidden min-h-0 flex-col overflow-y-auto border-l border-hairline bg-surface/40 lg:flex")}>
          {activeThread ? (
            <DetailsPanel thread={activeThread} profile={profileQ.data} />
          ) : (
            <div className="p-6 text-xs text-muted-foreground">Ticket details appear here.</div>
          )}
        </aside>
      </div>
    </div>
  );
}

function Conversation({
  thread,
  messages,
  loading,
  currentUserId,
  onSend,
  onClose,
  onBack,
  sending,
}: {
  thread: Thread;
  messages: Msg[];
  loading: boolean;
  currentUserId: string;
  onSend: (b: string) => void;
  onClose: () => void;
  onBack: () => void;
  sending: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  return (
    <>
      <header className="flex items-center gap-3 border-b border-hairline px-4 py-3">
        <button
          type="button"
          onClick={onBack}
          className="rounded-md p-1.5 text-muted-foreground hover:bg-surface lg:hidden"
          aria-label="Back to list"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-foreground text-[11px] font-bold text-background">
          {initials(thread.subject)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold">{thread.subject}</div>
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <CircleDot className="h-2.5 w-2.5 text-emerald-500" /> Support
            </span>
            <span>·</span>
            <span className="uppercase tracking-wider">{thread.status}</span>
            <span>·</span>
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider",
                PRIORITY_COLOR[thread.priority as keyof typeof PRIORITY_COLOR],
              )}
            >
              {thread.priority}
            </span>
          </div>
        </div>
        {thread.status !== "closed" && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        )}
      </header>

      <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto bg-[radial-gradient(circle_at_top,theme(colors.muted)/40,transparent)] px-4 py-5">
        {loading ? (
          <div className="text-center text-xs text-muted-foreground">Loading messages…</div>
        ) : messages.length === 0 ? (
          <div className="mx-auto max-w-sm rounded-xl border border-dashed border-hairline bg-surface/60 p-6 text-center text-xs text-muted-foreground">
            No messages yet. Send the first one below.
          </div>
        ) : (
          messages.map((m, i) => {
            const mine = m.sender_id === currentUserId;
            const prev = messages[i - 1];
            const grouped = prev && prev.sender_id === m.sender_id;
            return (
              <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[78%] rounded-2xl px-3.5 py-2 text-sm shadow-sm",
                    mine
                      ? "rounded-br-sm bg-foreground text-background"
                      : "rounded-bl-sm bg-card text-foreground border border-hairline",
                    grouped && (mine ? "rounded-tr-md" : "rounded-tl-md"),
                  )}
                >
                  <div className="whitespace-pre-wrap break-words">{m.body}</div>
                  <div
                    className={cn(
                      "mt-1 flex items-center justify-end gap-1 text-[10px]",
                      mine ? "text-background/70" : "text-muted-foreground",
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
      </div>

      {thread.status !== "closed" ? (
        <Composer onSend={onSend} disabled={sending} />
      ) : (
        <div className="border-t border-hairline bg-surface/60 px-4 py-3 text-center text-xs text-muted-foreground">
          This ticket is closed. Open a new one to continue the conversation.
        </div>
      )}
    </>
  );
}

function Composer({ onSend, disabled }: { onSend: (b: string) => void; disabled: boolean }) {
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
      className="flex items-end gap-2 border-t border-hairline bg-background px-3 py-2.5"
    >
      <div className="flex-1 rounded-2xl border border-hairline bg-surface/60 px-3 py-2 focus-within:border-foreground/40">
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
          placeholder="Type a message…   (Enter to send, Shift+Enter for new line)"
          className="min-h-0 resize-none border-0 bg-transparent px-0 py-0 text-sm shadow-none focus-visible:ring-0"
        />
      </div>
      <Button type="submit" size="icon" disabled={disabled || !body.trim()} className="h-10 w-10 rounded-full">
        <Send className="h-4 w-4" />
      </Button>
    </form>
  );
}

function DetailsPanel({
  thread,
  profile,
}: {
  thread: Thread;
  profile:
    | {
        full_name: string | null;
        firm: string | null;
        phone: string | null;
        city: string | null;
        kyc_status: string | null;
      }
    | null
    | undefined;
}) {
  return (
    <div className="space-y-5 p-5">
      <div>
        <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Ticket
        </div>
        <div className="mt-1 text-sm font-semibold">{thread.subject}</div>
        <div className="mt-1 font-mono text-[10px] text-muted-foreground">#{thread.id.slice(0, 8)}</div>
      </div>

      <div className="rounded-lg border border-hairline bg-card p-4">
        <div className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Your details
        </div>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-foreground text-[11px] font-bold text-background">
            {initials(profile?.full_name)}
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">{profile?.full_name ?? "—"}</div>
            <div className="truncate text-xs text-muted-foreground">{profile?.city ?? ""}</div>
          </div>
        </div>
        <ul className="mt-4 space-y-2 text-xs text-muted-foreground">
          <li className="flex items-center gap-2">
            <Building2 className="h-3.5 w-3.5" /> {profile?.firm ?? "—"}
          </li>
          <li className="flex items-center gap-2">
            <Phone className="h-3.5 w-3.5" /> {profile?.phone ?? "—"}
          </li>
          <li className="flex items-center gap-2">
            <Mail className="h-3.5 w-3.5" /> Email on file
          </li>
          <li className="flex items-center gap-2">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span className="uppercase tracking-wider">KYC: {profile?.kyc_status ?? "pending"}</span>
          </li>
        </ul>
      </div>

      <div className="rounded-lg border border-hairline bg-card p-4">
        <div className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Activity
        </div>
        <ul className="space-y-1.5 text-xs">
          <li className="text-muted-foreground">Created {relativeTime(thread.created_at)}</li>
          <li className="text-muted-foreground">Last message {relativeTime(thread.last_message_at)}</li>
          {thread.closed_at && (
            <li className="text-muted-foreground">Closed {relativeTime(thread.closed_at)}</li>
          )}
        </ul>
      </div>
    </div>
  );
}

function NewTicket({
  onCancel,
  onCreated,
}: {
  onCancel: () => void;
  onCreated: (id: string) => void;
}) {
  const { user } = useAuth();
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [priority, setPriority] = useState<Priority>("normal");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim() || !body.trim()) {
      toast.error("Subject and message are required");
      return;
    }
    setBusy(true);
    const { data, error } = await supabase
      .from("support_threads")
      .insert({ opener_id: user!.id, subject: subject.trim(), priority })
      .select()
      .single();
    if (error || !data) {
      setBusy(false);
      toast.error(errMessage(error));
      return;
    }
    const { error: mErr } = await supabase
      .from("support_messages")
      .insert({ thread_id: data.id, sender_id: user!.id, body: body.trim() });
    setBusy(false);
    if (mErr) {
      toast.error(errMessage(mErr));
      return;
    }
    toast.success("Ticket created");
    onCreated(data.id);
  }

  return (
    <form onSubmit={submit} className="mx-auto w-full max-w-xl space-y-4 p-6">
      <div>
        <h2 className="text-lg font-bold">Start a new ticket</h2>
        <p className="text-xs text-muted-foreground">We typically reply within a few hours.</p>
      </div>
      <div className="space-y-1.5">
        <Label>Subject</Label>
        <Input value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={160} />
      </div>
      <div className="space-y-1.5">
        <Label>Message</Label>
        <Textarea rows={6} value={body} onChange={(e) => setBody(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label>Priority</Label>
        <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(["low", "normal", "high", "urgent"] as const).map((p) => (
              <SelectItem key={p} value={p}>
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={busy}>
          {busy ? "Creating…" : "Create ticket"}
        </Button>
      </div>
    </form>
  );
}
