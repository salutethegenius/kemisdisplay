"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { MenuEditor, MenuList, MenuNew } from "@/components/menu-views";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export type ScreenRow = {
  id: string;
  name: string;
  slug: string;
  token: string;
  display_url_hint: string;
  created_at: string;
  updated_at: string;
};

type PlaylistRow = {
  id: string;
  media_id: string;
  sort_order: number;
  duration_seconds: number;
  file_url: string;
  type: string;
  filename: string;
};

type MediaRow = {
  id: string;
  filename: string;
  file_url: string;
  type: string;
  duration_seconds: number | null;
  size_bytes: number;
  created_at: string;
};

function ScreenList() {
  const { token } = useAuth();
  const [screens, setScreens] = useState<ScreenRow[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    const res = await apiFetch("/screens", { token });
    if (!res.ok) {
      setErr("Could not load screens");
      return;
    }
    setScreens(await res.json());
    setErr(null);
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-white">Your screens</h1>
        <Link
          href="/dashboard/screens/new"
          className="inline-flex min-h-11 items-center justify-center rounded-lg bg-emerald-500 px-4 text-sm font-semibold text-zinc-950 hover:bg-emerald-400"
        >
          New screen
        </Link>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
        <Link
          href="/dashboard/media"
          className="inline-flex min-h-11 items-center justify-center rounded-lg border border-zinc-600 bg-zinc-900/50 px-3 text-sm font-medium text-zinc-200 hover:bg-zinc-800"
        >
          Media library
        </Link>
        <Link
          href="/dashboard/menus"
          className="inline-flex min-h-11 items-center justify-center rounded-lg border border-zinc-600 bg-zinc-900/50 px-3 text-sm font-medium text-zinc-200 hover:bg-zinc-800"
        >
          Menus
        </Link>
        <Link
          href="/dashboard/menus/new"
          className="col-span-2 inline-flex min-h-11 items-center justify-center rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 text-sm font-medium text-emerald-300 hover:bg-emerald-500/20 sm:col-span-1"
        >
          New menu video
        </Link>
      </div>
      {err && <p className="mt-4 text-sm text-red-400">{err}</p>}
      <ul className="mt-8 space-y-3">
        {screens.map((s) => (
          <li
            key={s.id}
            className="flex flex-col gap-2 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="font-medium text-white">{s.name}</p>
              <p className="mt-1 break-all font-mono text-xs text-zinc-500">
                {typeof window !== "undefined"
                  ? `${window.location.origin}${s.display_url_hint}`
                  : s.display_url_hint}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/dashboard/screens/${s.id}/playlist`}
                className="inline-flex min-h-11 min-w-[88px] items-center justify-center rounded-lg border border-zinc-600 px-3 text-sm text-zinc-200 hover:bg-zinc-800"
              >
                Playlist
              </Link>
              <Link
                href={`/dashboard/screens/${s.id}`}
                className="inline-flex min-h-11 min-w-[88px] items-center justify-center rounded-lg border border-zinc-600 px-3 text-sm text-zinc-200 hover:bg-zinc-800"
              >
                Settings
              </Link>
            </div>
          </li>
        ))}
      </ul>
      {screens.length === 0 && !err && (
        <p className="mt-12 text-center text-sm text-zinc-500">
          No screens yet. Create one to get a display URL for your TV.
        </p>
      )}
    </div>
  );
}

function NewScreen() {
  const { token } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setErr(null);
    setPending(true);
    try {
      const res = await apiFetch("/screens", {
        method: "POST",
        token,
        body: JSON.stringify({ name }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(String(data.detail || "Could not create screen"));
        return;
      }
      router.push(`/dashboard/screens/${data.id}`);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <Link
        href="/dashboard"
        className="text-sm text-zinc-500 hover:text-zinc-300"
      >
        ← Back to screens
      </Link>
      <h1 className="mt-6 text-2xl font-semibold text-white">New screen</h1>
      <p className="mt-2 text-sm text-zinc-500">
        Name the screen (e.g. &quot;Front bar TV&quot;). You&apos;ll get a
        unique URL to open on the display.
      </p>
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <div>
          <label className="text-xs font-medium text-zinc-400">Name</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
          />
        </div>
        {err && <p className="text-sm text-red-400">{err}</p>}
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-emerald-400 disabled:opacity-50"
        >
          {pending ? "Creating…" : "Create screen"}
        </button>
      </form>
    </div>
  );
}

function ScreenSettings({ id }: { id: string }) {
  const { token } = useAuth();
  const router = useRouter();
  const [screen, setScreen] = useState<ScreenRow | null>(null);
  const [name, setName] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    const res = await apiFetch(`/screens/${id}`, { token });
    if (!res.ok) {
      setErr("Screen not found");
      return;
    }
    const s = (await res.json()) as ScreenRow;
    setScreen(s);
    setName(s.name);
  }, [token, id]);

  useEffect(() => {
    void load();
  }, [load]);

  const fullUrl =
    typeof window !== "undefined" && screen
      ? `${window.location.origin}${screen.display_url_hint}`
      : "";

  async function saveName(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !screen) return;
    setErr(null);
    const res = await apiFetch(`/screens/${id}`, {
      method: "PATCH",
      token,
      body: JSON.stringify({ name }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setErr(String(d.detail || "Update failed"));
      return;
    }
    setScreen(await res.json());
  }

  async function regenerateToken() {
    if (!token) return;
    const res = await apiFetch(`/screens/${id}`, {
      method: "PATCH",
      token,
      body: JSON.stringify({ regenerate_token: true }),
    });
    if (res.ok) setScreen(await res.json());
  }

  async function remove() {
    if (!token || !confirm("Delete this screen and its playlist?")) return;
    const res = await apiFetch(`/screens/${id}`, { method: "DELETE", token });
    if (res.ok) router.push("/dashboard");
  }

  if (!screen && !err) {
    return <p className="text-zinc-500">Loading…</p>;
  }
  if (err && !screen) {
    return <p className="text-red-400">{err}</p>;
  }

  return (
    <div className="mx-auto max-w-xl">
      <Link
        href="/dashboard"
        className="text-sm text-zinc-500 hover:text-zinc-300"
      >
        ← Screens
      </Link>
      <h1 className="mt-6 text-2xl font-semibold text-white">Screen settings</h1>

      <form onSubmit={saveName} className="mt-8 space-y-4">
        <div>
          <label className="text-xs font-medium text-zinc-400">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
          />
        </div>
        {err && <p className="text-sm text-red-400">{err}</p>}
        <button
          type="submit"
          className="rounded-lg border border-zinc-600 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-800"
        >
          Save name
        </button>
      </form>

      <div className="mt-10 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          Display URL
        </p>
        <p className="mt-2 break-all font-mono text-sm text-emerald-400/90">
          {fullUrl}
        </p>
        <button
          type="button"
          onClick={() => {
            void navigator.clipboard.writeText(fullUrl).then(() => {
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            });
          }}
          className="mt-3 text-sm text-zinc-400 hover:text-white"
        >
          {copied ? "Copied" : "Copy URL"}
        </button>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => void regenerateToken()}
          className="rounded-lg border border-amber-600/50 px-4 py-2 text-sm text-amber-200 hover:bg-amber-950/40"
        >
          Regenerate display token
        </button>
        <Link
          href={`/dashboard/screens/${id}/playlist`}
          className="rounded-lg bg-emerald-500/20 px-4 py-2 text-sm font-medium text-emerald-300 hover:bg-emerald-500/30"
        >
          Edit playlist
        </Link>
      </div>

      <button
        type="button"
        onClick={() => void remove()}
        className="mt-12 text-sm text-red-400 hover:underline"
      >
        Delete screen
      </button>
    </div>
  );
}

function PlaylistEditor({ id }: { id: string }) {
  const { token } = useAuth();
  const [rows, setRows] = useState<PlaylistRow[]>([]);
  const [media, setMedia] = useState<MediaRow[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [pick, setPick] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    const [pr, mr] = await Promise.all([
      apiFetch(`/screens/${id}/playlist`, { token }),
      apiFetch("/media", { token }),
    ]);
    if (pr.ok) setRows(await pr.json());
    if (mr.ok) setMedia(await mr.json());
  }, [token, id]);

  useEffect(() => {
    void load();
  }, [load]);

  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= rows.length) return;
    const next = [...rows];
    [next[i], next[j]] = [next[j], next[i]];
    setRows(next);
  }

  function removeAt(i: number) {
    setRows(rows.filter((_, k) => k !== i));
  }

  function addMedia() {
    if (!pick) return;
    const m = media.find((x) => x.id === pick);
    if (!m) return;
    setRows([
      ...rows,
      {
        id: `tmp-${pick}-${Date.now()}`,
        media_id: m.id,
        sort_order: rows.length,
        duration_seconds: m.duration_seconds ?? 10,
        file_url: m.file_url,
        type: m.type,
        filename: m.filename,
      },
    ]);
    setPick("");
  }

  async function save() {
    if (!token) return;
    setSaving(true);
    setErr(null);
    const body = {
      items: rows.map((r, i) => ({
        media_id: r.media_id,
        duration_seconds: r.duration_seconds,
        sort_order: i,
      })),
    };
    const res = await apiFetch(`/screens/${id}/playlist`, {
      method: "PUT",
      token,
      body: JSON.stringify(body),
    });
    setSaving(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setErr(String(d.detail || "Save failed"));
      return;
    }
    setRows(await res.json());
  }

  const used = new Set(rows.map((r) => r.media_id));

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href={`/dashboard/screens/${id}`}
        className="text-sm text-zinc-500 hover:text-zinc-300"
      >
        ← Screen settings
      </Link>
      <h1 className="mt-6 text-2xl font-semibold text-white">Playlist</h1>
      <p className="mt-2 text-sm text-zinc-500">
        Order and duration (seconds) per slide. Save to push updates to displays
        (polls about every minute).
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        <select
          value={pick}
          onChange={(e) => setPick(e.target.value)}
          className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white"
        >
          <option value="">Add media…</option>
          {media
            .filter((m) => !used.has(m.id))
            .map((m) => (
              <option key={m.id} value={m.id}>
                {m.filename} ({m.type})
              </option>
            ))}
        </select>
        <button
          type="button"
          onClick={addMedia}
          className="rounded-lg border border-zinc-600 px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-800"
        >
          Add
        </button>
        <button
          type="button"
          onClick={() => void save()}
          disabled={saving}
          className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-emerald-400 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save playlist"}
        </button>
      </div>
      {err && <p className="mt-4 text-sm text-red-400">{err}</p>}

      <ul className="mt-8 space-y-2">
        {rows.map((r, i) => (
          <li
            key={r.id}
            className="flex flex-wrap items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/50 p-3"
          >
            <span className="min-w-0 flex-1 truncate text-sm text-zinc-300">
              {r.filename}
            </span>
            <label className="flex items-center gap-1 text-xs text-zinc-500">
              sec
              <input
                type="number"
                min={1}
                max={3600}
                value={r.duration_seconds}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10) || 1;
                  setRows(
                    rows.map((x, j) =>
                      j === i ? { ...x, duration_seconds: v } : x,
                    ),
                  );
                }}
                className="w-16 rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-sm text-white"
              />
            </label>
            <button
              type="button"
              onClick={() => move(i, -1)}
              className="rounded border border-zinc-700 px-2 py-1 text-zinc-400 hover:bg-zinc-800"
            >
              ↑
            </button>
            <button
              type="button"
              onClick={() => move(i, 1)}
              className="rounded border border-zinc-700 px-2 py-1 text-zinc-400 hover:bg-zinc-800"
            >
              ↓
            </button>
            <button
              type="button"
              onClick={() => removeAt(i)}
              className="text-sm text-red-400 hover:underline"
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function MediaLibrary() {
  const { token } = useAuth();
  const [items, setItems] = useState<MediaRow[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    const res = await apiFetch("/media", { token });
    if (!res.ok) {
      setErr("Could not load media");
      return;
    }
    setItems(await res.json());
    setErr(null);
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f || !token) return;
    setPending(true);
    setErr(null);
    const fd = new FormData();
    fd.append("file", f);
    const res = await apiFetch("/media/upload", {
      method: "POST",
      token,
      body: fd,
    });
    setPending(false);
    e.target.value = "";
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setErr(String(d.detail || "Upload failed"));
      return;
    }
    void load();
  }

  async function del(mid: string) {
    if (!token || !confirm("Delete this file?")) return;
    await apiFetch(`/media/${mid}`, { method: "DELETE", token });
    void load();
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-white">Media library</h1>
      <p className="mt-2 text-sm text-zinc-500">
        Images and video. Upload from here, then add to a screen playlist.
      </p>
      <div className="mt-6">
        <label className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-lg bg-emerald-500 px-4 text-sm font-semibold text-zinc-950 hover:bg-emerald-400">
          {pending ? "Uploading…" : "Upload file"}
          <input
            type="file"
            accept="image/*,video/*"
            className="hidden"
            disabled={pending}
            onChange={(e) => void onFile(e)}
          />
        </label>
      </div>
      {err && <p className="mt-4 text-sm text-red-400">{err}</p>}
      <div className="mt-8 md:hidden">
        <ul className="space-y-3">
          {items.map((m) => (
            <li
              key={m.id}
              className="flex flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-white">{m.filename}</p>
                <p className="mt-1 text-xs text-zinc-500">
                  {m.type}
                  {m.duration_seconds != null
                    ? ` · ${m.duration_seconds}s`
                    : ""}{" "}
                  · {(m.size_bytes / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <button
                type="button"
                onClick={() => void del(m.id)}
                className="min-h-11 w-full rounded-lg border border-red-500/30 bg-red-500/10 text-sm font-medium text-red-400 hover:bg-red-500/20"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div className="mt-8 hidden overflow-x-auto rounded-xl border border-zinc-800 md:block">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="border-b border-zinc-800 bg-zinc-900/80 text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-4 py-3">File</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Duration</th>
              <th className="px-4 py-3">Size</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800 text-zinc-300">
            {items.map((m) => (
              <tr key={m.id}>
                <td className="max-w-[200px] truncate px-4 py-3 text-white">
                  {m.filename}
                </td>
                <td className="px-4 py-3">{m.type}</td>
                <td className="px-4 py-3">
                  {m.duration_seconds != null ? `${m.duration_seconds}s` : "—"}
                </td>
                <td className="px-4 py-3">
                  {(m.size_bytes / 1024 / 1024).toFixed(2)} MB
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => void del(m.id)}
                    className="text-sm text-red-400 hover:underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

type AdminUserRow = {
  id: string;
  email: string;
  business_name: string;
  plan: string;
  trial_ends_at: string;
  is_admin: boolean;
  created_at: string;
  effective_tier: string | null;
  screen_count: number;
  media_count: number;
};

function isoToDatetimeLocal(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function AdminUsers() {
  const { token, user } = useAuth();
  const [rows, setRows] = useState<AdminUserRow[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [editing, setEditing] = useState<AdminUserRow | null>(null);
  const [form, setForm] = useState({
    business_name: "",
    plan: "trialing",
    is_admin: false,
    trial_local: "",
  });
  const [saveErr, setSaveErr] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    const res = await apiFetch("/admin/users", { token });
    if (res.status === 403) {
      setErr("You don’t have admin access.");
      return;
    }
    if (!res.ok) {
      setErr("Could not load users.");
      return;
    }
    setRows(await res.json());
    setErr(null);
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  function openEdit(r: AdminUserRow) {
    setEditing(r);
    setForm({
      business_name: r.business_name,
      plan: r.plan,
      is_admin: r.is_admin,
      trial_local: isoToDatetimeLocal(r.trial_ends_at),
    });
    setSaveErr(null);
  }

  async function saveEdit() {
    if (!token || !editing) return;
    setPending(true);
    setSaveErr(null);
    const body: Record<string, unknown> = {
      business_name: form.business_name,
      plan: form.plan,
      is_admin: form.is_admin,
    };
    if (form.trial_local) {
      body.trial_ends_at = new Date(form.trial_local).toISOString();
    }
    const res = await apiFetch(`/admin/users/${editing.id}`, {
      method: "PATCH",
      token,
      body: JSON.stringify(body),
    });
    setPending(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setSaveErr(String(d.detail || "Save failed"));
      return;
    }
    setEditing(null);
    void load();
  }

  async function removeUser(id: string) {
    if (!token || id === user?.id) return;
    if (
      !confirm(
        "Delete this user and all their screens, media, and playlists?",
      )
    )
      return;
    const res = await apiFetch(`/admin/users/${id}`, {
      method: "DELETE",
      token,
    });
    if (res.ok) void load();
  }

  if (err) {
    return <p className="text-red-400">{err}</p>;
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-white">Admin · Users</h1>
      <p className="mt-2 max-w-2xl text-sm text-zinc-500">
        View and edit customer accounts. Grant admin with the checkbox (or set{" "}
        <code className="text-zinc-400">ADMIN_EMAILS</code> in the API env and
        restart to auto-promote listed emails).
      </p>

      <div className="mt-8 space-y-3 md:hidden">
        {rows.map((r) => (
          <div
            key={r.id}
            className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4"
          >
            <p className="font-mono text-xs text-emerald-400/90">{r.email}</p>
            <p className="mt-2 text-sm text-zinc-300">
              {r.business_name || "—"} · {r.plan}
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              Tier {r.effective_tier ?? "—"} · {r.screen_count} screens ·{" "}
              {r.media_count} media
              {r.is_admin ? " · admin" : ""}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => openEdit(r)}
                className="min-h-11 flex-1 rounded-lg border border-zinc-600 text-sm text-emerald-400 hover:bg-zinc-800"
              >
                Edit
              </button>
              {r.id !== user?.id && (
                <button
                  type="button"
                  onClick={() => void removeUser(r.id)}
                  className="min-h-11 flex-1 rounded-lg border border-red-500/30 text-sm text-red-400 hover:bg-red-500/10"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 hidden overflow-x-auto rounded-xl border border-zinc-800 md:block">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-zinc-800 bg-zinc-900/80 text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Business</th>
              <th className="px-4 py-3">Plan</th>
              <th className="px-4 py-3">Tier</th>
              <th className="px-4 py-3">Screens</th>
              <th className="px-4 py-3">Media</th>
              <th className="px-4 py-3">Admin</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {rows.map((r) => (
              <tr key={r.id} className="text-zinc-300">
                <td className="px-4 py-3 font-mono text-xs text-emerald-400/90">
                  {r.email}
                </td>
                <td className="max-w-[140px] truncate px-4 py-3">
                  {r.business_name || "—"}
                </td>
                <td className="px-4 py-3">{r.plan}</td>
                <td className="px-4 py-3 text-zinc-500">
                  {r.effective_tier ?? "—"}
                </td>
                <td className="px-4 py-3">{r.screen_count}</td>
                <td className="px-4 py-3">{r.media_count}</td>
                <td className="px-4 py-3">{r.is_admin ? "Yes" : ""}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => openEdit(r)}
                    className="text-emerald-400 hover:underline"
                  >
                    Edit
                  </button>
                  {r.id !== user?.id && (
                    <button
                      type="button"
                      onClick={() => void removeUser(r.id)}
                      className="ml-3 text-red-400 hover:underline"
                    >
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-xl border border-zinc-700 bg-zinc-900 p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-white">Edit user</h2>
            <p className="mt-1 font-mono text-xs text-zinc-500">{editing.email}</p>
            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs text-zinc-500">Business name</label>
                <input
                  value={form.business_name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, business_name: e.target.value }))
                  }
                  className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-500">Plan</label>
                <select
                  value={form.plan}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, plan: e.target.value }))
                  }
                  className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white"
                >
                  {["trialing", "starter", "pro", "business"].map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-zinc-500">Trial ends (local)</label>
                <input
                  type="datetime-local"
                  value={form.trial_local}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, trial_local: e.target.value }))
                  }
                  className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-zinc-300">
                <input
                  type="checkbox"
                  checked={form.is_admin}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, is_admin: e.target.checked }))
                  }
                  className="rounded border-zinc-600"
                />
                Admin access
              </label>
            </div>
            {saveErr && (
              <p className="mt-3 text-sm text-red-400">{saveErr}</p>
            )}
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="rounded-lg border border-zinc-600 px-4 py-2 text-sm text-zinc-300"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => void saveEdit()}
                className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-zinc-950 disabled:opacity-50"
              >
                {pending ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AccountPage() {
  const { user, refreshUser } = useAuth();
  useEffect(() => {
    void refreshUser();
  }, [refreshUser]);

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-semibold text-white">Account</h1>
      <div className="mt-6 space-y-4 rounded-xl border border-zinc-800 bg-zinc-900/40 p-6 text-sm text-zinc-300">
        <p>
          <span className="text-zinc-500">Email</span>
          <br />
          {user?.email}
        </p>
        <p>
          <span className="text-zinc-500">Plan</span>
          <br />
          {user?.plan} · effective tier: {user?.effective_tier ?? "none"}
        </p>
        <p>
          <span className="text-zinc-500">Trial ends</span>
          <br />
          {user?.trial_ends_at
            ? new Date(user.trial_ends_at).toLocaleString()
            : "—"}
        </p>
        <p className="text-zinc-500">
          Billing via KemisPay will appear here in Phase 3. For now, use{" "}
          <code className="text-zinc-400">DEV_BYPASS_BILLING</code> in local API
          env for unrestricted dev.
        </p>
      </div>
    </div>
  );
}

export function DashboardRouter() {
  const pathname = usePathname();

  if (pathname === "/dashboard/screens/new") {
    return <NewScreen />;
  }
  const pl = pathname.match(/^\/dashboard\/screens\/([^/]+)\/playlist$/);
  if (pl) {
    return <PlaylistEditor id={pl[1]} />;
  }
  const sc = pathname.match(/^\/dashboard\/screens\/([^/]+)$/);
  if (sc) {
    return <ScreenSettings id={sc[1]} />;
  }
  if (pathname === "/dashboard/media") {
    return <MediaLibrary />;
  }
  if (pathname === "/dashboard/menus/new") {
    return <MenuNew />;
  }
  const menuEdit = pathname.match(/^\/dashboard\/menus\/([^/]+)$/);
  if (menuEdit && menuEdit[1] !== "new") {
    return <MenuEditor id={menuEdit[1]} />;
  }
  if (pathname === "/dashboard/menus") {
    return <MenuList />;
  }
  if (pathname === "/dashboard/admin") {
    return <AdminUsers />;
  }
  if (pathname === "/dashboard/account") {
    return <AccountPage />;
  }
  return <ScreenList />;
}
