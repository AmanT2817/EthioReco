// EthioReco — Admin Console
// Restrained — not flashy (per spec)
// Tables: Users, Items, Audit logs
// Add Content form with Ethiopian flag toggle → reveals cultural metadata fields

"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/stores/app-store";
import { api } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Shield, Users, BookPlus, ScrollText, RefreshCw } from "lucide-react";

type Tab = "users" | "content" | "logs";

export function AdminConsole() {
  const [tab, setTab] = useState<Tab>("users");
  const [users, setUsers] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { setView } = useAppStore();

  useEffect(() => {
    if (tab === "users") {
      api.adminUsers().then((r) => setUsers(r.data as any[])).catch(() => {}).finally(() => setLoading(false));
    } else if (tab === "content") {
      api.adminContent().then((r) => setItems(r.data as any[])).catch(() => {}).finally(() => setLoading(false));
    } else {
      api.adminLogs().then((r) => setLogs(r.data as any[])).catch(() => {}).finally(() => setLoading(false));
    }
  }, [tab]);

  return (
    <div className="page-enter max-w-7xl mx-auto px-4 sm:px-6 py-8 pb-24 md:pb-8">
      <header className="mb-8">
        <div className="flex items-center gap-2 mb-2 text-xs uppercase tracking-widest text-ash">
          <Shield className="h-4 w-4" />
          Admin Console · RBAC Protected
        </div>
        <h1 className="text-3xl sm:text-4xl font-display uppercase tracking-tight">
          Curation deck
        </h1>
      </header>

      <div className="flex gap-2 mb-6 border-b border-border/40 pb-3 flex-wrap">
        <TabBtn icon={<Users className="h-3 w-3" />} label="Users" active={tab === "users"} onClick={() => setTab("users")} />
        <TabBtn icon={<BookPlus className="h-3 w-3" />} label="Content" active={tab === "content"} onClick={() => setTab("content")} />
        <TabBtn icon={<ScrollText className="h-3 w-3" />} label="Audit logs" active={tab === "logs"} onClick={() => setTab("logs")} />
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : tab === "users" ? (
        <UsersTable users={users} />
      ) : tab === "content" ? (
        <ContentPanel items={items} />
      ) : (
        <LogsTable logs={logs} />
      )}
    </div>
  );
}

function TabBtn({ icon, label, active, onClick }: {
  icon: React.ReactNode; label: string; active: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 rounded text-xs uppercase tracking-widest transition-all",
        active ? "bg-ember text-bone" : "bg-graphite border border-border/60 text-ash hover:text-bone",
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function UsersTable({ users }: { users: any[] }) {
  const [busy, setBusy] = useState<string | null>(null);
  const handleAction = async (userId: string, action: "suspend" | "activate" | "delete") => {
    setBusy(userId);
    try {
      await api.adminUserAction(userId, action);
      const r = await api.adminUsers();
      // setUsers(r.data as any[]);
    } catch {}
    setBusy(null);
  };
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-widest text-ash border-b border-border/40">
            <th className="py-2 pr-4">Name</th>
            <th className="py-2 pr-4">Email</th>
            <th className="py-2 pr-4">Role</th>
            <th className="py-2 pr-4">Status</th>
            <th className="py-2 pr-4">Onboarded</th>
            <th className="py-2 pr-4">Created</th>
            <th className="py-2 pr-4">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-b border-border/20 hover:bg-graphite/50">
              <td className="py-3 pr-4">{u.name}</td>
              <td className="py-3 pr-4 text-ash">{u.email}</td>
              <td className="py-3 pr-4">
                <span className={cn("text-xs uppercase", u.role === "admin" ? "text-ember" : "text-ash")}>
                  {u.role}
                </span>
              </td>
              <td className="py-3 pr-4">
                <span className={cn(
                  "text-xs uppercase",
                  u.status === "active" ? "text-bone" : "text-ember",
                )}>
                  {u.status}
                </span>
              </td>
              <td className="py-3 pr-4 text-ash text-xs">
                {u.onboardingCompleted ? "✓" : "—"}
              </td>
              <td className="py-3 pr-4 text-ash text-xs">
                {new Date(u.createdAt).toLocaleDateString()}
              </td>
              <td className="py-3 pr-4 flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={busy === u.id}
                  onClick={() => handleAction(u.id, u.status === "active" ? "suspend" : "activate")}
                  className="text-xs text-ash hover:text-ember px-2 py-1"
                >
                  {u.status === "active" ? "Suspend" : "Activate"}
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ContentPanel({ items }: { items: any[] }) {
  const [showForm, setShowForm] = useState(false);
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-ash">{items.length} items in catalog</p>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="bg-ember text-bone hover:bg-ember/90 uppercase tracking-widest text-xs"
        >
          {showForm ? "Cancel" : "+ Add content"}
        </Button>
      </div>

      {showForm && <AddContentForm onDone={() => setShowForm(false)} />}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-widest text-ash border-b border-border/40">
              <th className="py-2 pr-4">Title</th>
              <th className="py-2 pr-4">Type</th>
              <th className="py-2 pr-4">Genre</th>
              <th className="py-2 pr-4">Avg</th>
              <th className="py-2 pr-4">Ethiopian</th>
              <th className="py-2 pr-4">Created</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.id} className="border-b border-border/20 hover:bg-graphite/50">
                <td className="py-3 pr-4">{it.title}</td>
                <td className="py-3 pr-4 text-xs uppercase text-ash">{it.type}</td>
                <td className="py-3 pr-4 text-xs text-ash">{it.genre ?? "—"}</td>
                <td className="py-3 pr-4 match-score text-xs">{it.averageRating.toFixed(1)}</td>
                <td className="py-3 pr-4">
                  {it.ethiopianMetadata ? (
                    <span className="brass-badge px-1.5 py-0.5 text-[10px] rounded">
                      {it.ethiopianMetadata.traditionalGenre ?? "ETHIO"}
                    </span>
                  ) : (
                    <span className="text-ash/40 text-xs">—</span>
                  )}
                </td>
                <td className="py-3 pr-4 text-xs text-ash">
                  {new Date(it.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AddContentForm({ onDone }: { onDone: () => void }) {
  const [form, setForm] = useState<any>({
    title: "", type: "book", description: "", genre: "",
    releaseYear: "", language: "", country: "",
    author: "", director: "", artist: "", album: "",
    coverImageUrl: "",
    ethiopian: {
      culturalRegion: "", traditionalGenre: "", isTraditional: false,
      amharicTitle: "", amharicDescription: "", culturalSignificance: "",
      featuredPriority: 5,
    },
  });
  const [showEth, setShowEth] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (k: string, v: any) => setForm((s: any) => ({ ...s, [k]: v }));
  const setEth = (k: string, v: any) =>
    setForm((s: any) => ({ ...s, ethiopian: { ...s.ethiopian, [k]: v } }));

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const payload = { ...form };
      if (!showEth) delete payload.ethiopian;
      if (form.releaseYear) payload.releaseYear = parseInt(form.releaseYear, 10);
      await api.adminAddContent(payload);
      // Recompute vectors
      await api.recomputeVectors();
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add content");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 bg-graphite border border-border/60 rounded-lg space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Title"><Input value={form.title} onChange={(e) => set("title", e.target.value)} className="bg-obsidian border-border/60" /></Field>
        <Field label="Type">
          <select
            value={form.type}
            onChange={(e) => set("type", e.target.value)}
            className="w-full bg-obsidian border border-border/60 rounded px-3 py-2 text-bone"
          >
            <option value="book">Book</option>
            <option value="movie">Movie</option>
            <option value="music">Music</option>
          </select>
        </Field>
        <Field label="Genre"><Input value={form.genre} onChange={(e) => set("genre", e.target.value)} className="bg-obsidian border-border/60" placeholder="Romance, Drama, Tizita..." /></Field>
        <Field label="Release year"><Input type="number" value={form.releaseYear} onChange={(e) => set("releaseYear", e.target.value)} className="bg-obsidian border-border/60" /></Field>
        <Field label="Language"><Input value={form.language} onChange={(e) => set("language", e.target.value)} className="bg-obsidian border-border/60" placeholder="Amharic, English, ..." /></Field>
        <Field label="Country"><Input value={form.country} onChange={(e) => set("country", e.target.value)} className="bg-obsidian border-border/60" /></Field>
        <Field label="Cover image URL"><Input value={form.coverImageUrl} onChange={(e) => set("coverImageUrl", e.target.value)} className="bg-obsidian border-border/60" /></Field>
        {form.type === "book" && <Field label="Author"><Input value={form.author} onChange={(e) => set("author", e.target.value)} className="bg-obsidian border-border/60" /></Field>}
        {form.type === "movie" && <Field label="Director"><Input value={form.director} onChange={(e) => set("director", e.target.value)} className="bg-obsidian border-border/60" /></Field>}
        {form.type === "music" && <Field label="Artist"><Input value={form.artist} onChange={(e) => set("artist", e.target.value)} className="bg-obsidian border-border/60" /></Field>}
        {form.type === "music" && <Field label="Album"><Input value={form.album} onChange={(e) => set("album", e.target.value)} className="bg-obsidian border-border/60" /></Field>}
      </div>

      <Field label="Description">
        <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} className="bg-obsidian border-border/60 min-h-[80px]" />
      </Field>

      {/* Ethiopian flag toggle — reveals cultural metadata fields */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={showEth}
          onChange={(e) => setShowEth(e.target.checked)}
          className="w-4 h-4 accent-ember"
        />
        <span className="text-sm text-bone">Ethiopian content flag</span>
        <span className="text-xs text-ash">— reveals cultural metadata fields</span>
      </label>

      {showEth && (
        <div className="p-4 ethiopian-wash rounded space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="Amharic title"><Input value={form.ethiopian.amharicTitle} onChange={(e) => setEth("amharicTitle", e.target.value)} className="bg-obsidian border-border/60 font-amharic" /></Field>
            <Field label="Cultural region"><Input value={form.ethiopian.culturalRegion} onChange={(e) => setEth("culturalRegion", e.target.value)} className="bg-obsidian border-border/60" placeholder="Gondar, Addis Ababa, Tigray..." /></Field>
            <Field label="Traditional genre"><Input value={form.ethiopian.traditionalGenre} onChange={(e) => setEth("traditionalGenre", e.target.value)} className="bg-obsidian border-border/60" placeholder="Tizita, Bati, Anchihoye..." /></Field>
            <Field label="Featured priority (0-10)">
              <Input
                type="number"
                min={0}
                max={10}
                value={form.ethiopian.featuredPriority}
                onChange={(e) => setEth("featuredPriority", parseInt(e.target.value, 10) || 0)}
                className="bg-obsidian border-border/60"
              />
            </Field>
          </div>
          <Field label="Amharic description">
            <Textarea value={form.ethiopian.amharicDescription} onChange={(e) => setEth("amharicDescription", e.target.value)} className="bg-obsidian border-border/60 font-amharic min-h-[80px]" />
          </Field>
          <Field label="Cultural significance">
            <Textarea value={form.ethiopian.culturalSignificance} onChange={(e) => setEth("culturalSignificance", e.target.value)} className="bg-obsidian border-border/60 min-h-[80px]" placeholder="Editorial callout — why this matters culturally" />
          </Field>
          <label className="flex items-center gap-2 cursor-pointer text-xs">
            <input
              type="checkbox"
              checked={form.ethiopian.isTraditional}
              onChange={(e) => setEth("isTraditional", e.target.checked)}
              className="w-4 h-4 accent-brass"
            />
            <span>Is traditional cultural content (applies 1.3x boost for users who opted in)</span>
          </label>
        </div>
      )}

      {error && <div className="text-xs text-ember bg-ember/10 border border-ember/30 rounded p-2">{error}</div>}

      <div className="flex gap-2">
        <Button onClick={submit} disabled={submitting} className="bg-ember text-bone hover:bg-ember/90 uppercase tracking-widest text-xs">
          {submitting ? "Saving..." : "Save content"}
        </Button>
        <Button onClick={onDone} variant="ghost" className="text-ash">Cancel</Button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-[10px] uppercase tracking-widest text-ash">{label}</Label>
      {children}
    </div>
  );
}

function LogsTable({ logs }: { logs: any[] }) {
  return (
    <div className="space-y-2">
      {logs.map((l) => (
        <div key={l.id} className="p-3 bg-graphite border border-border/40 rounded text-sm flex items-center gap-4">
          <span className="text-xs text-ash match-score">{new Date(l.createdAt).toLocaleString()}</span>
          <span className="text-ember text-xs uppercase tracking-widest">{l.action}</span>
          <span className="text-ash text-xs">{l.targetType} · {l.targetId?.slice(0, 8)}</span>
          <span className="text-ash text-xs ml-auto">{l.admin?.email}</span>
        </div>
      ))}
      {logs.length === 0 && (
        <p className="text-center text-ash p-12">No audit logs yet.</p>
      )}
    </div>
  );
}
