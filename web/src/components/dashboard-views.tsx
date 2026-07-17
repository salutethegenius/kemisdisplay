"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { MenuEditor, MenuList, MenuNew } from "@/components/menu-views";
import { OnboardingChecklist } from "@/components/onboarding-checklist";
import { StatusPill } from "@/components/status-pill";
import { SupportCard } from "@/components/support-card";
import { apiFetch, apiUploadWithProgress } from "@/lib/api";
import { MEDIA_LIBRARY_REFRESH_CHANNEL } from "@/lib/media-sync";
import { useAuth } from "@/lib/auth-context";

export type ScreenRow = {
  id: string;
  name: string;
  slug: string;
  token: string;
  display_number: number;
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
  mux_status?: string | null;
  thumbnail_url?: string | null;
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
      <OnboardingChecklist />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-heading text-2xl font-semibold text-brand-cream">Your screens</h1>
        <Link
          href="/dashboard/screens/new"
          className="inline-flex min-h-11 items-center justify-center rounded-lg bg-brand-amber px-4 text-sm font-semibold text-brand-deep hover:bg-brand-amber-bright"
        >
          New screen
        </Link>
      </div>
      {screens.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          <Link
            href="/dashboard/media"
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-white/15 bg-brand-warm/80 px-3 text-sm font-medium text-brand-cream hover:bg-brand-warm"
          >
            Media library
          </Link>
          <Link
            href="/dashboard/menus"
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-white/15 bg-brand-warm/80 px-3 text-sm font-medium text-brand-cream hover:bg-brand-warm"
          >
            Menus
          </Link>
          <Link
            href="/dashboard/menus/new"
            className="col-span-2 inline-flex min-h-11 items-center justify-center rounded-lg border border-brand-amber/40 bg-brand-amber/10 px-3 text-sm font-medium text-brand-amber hover:bg-brand-amber/20 sm:col-span-1"
          >
            New menu video
          </Link>
        </div>
      )}
      {err && <p className="mt-4 text-sm text-red-400">{err}</p>}
      <ul className="mt-8 space-y-3">
        {screens.map((s) => (
          <li
            key={s.id}
            className="flex flex-col gap-2 rounded-xl border border-white/10 bg-brand-warm/80 p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="font-medium text-brand-cream">{s.name}</p>
              <p className="mt-1 break-all font-mono text-xs text-brand-muted">
                {typeof window !== "undefined"
                  ? `${window.location.origin}${s.display_url_hint}`
                  : s.display_url_hint}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/dashboard/screens/${s.id}/playlist`}
                className="inline-flex min-h-11 flex-1 items-center justify-center rounded-lg border border-white/15 px-3 text-sm text-brand-cream hover:bg-brand-warm sm:flex-none sm:min-w-[88px]"
              >
                Playlist
              </Link>
              <Link
                href={`/dashboard/screens/${s.id}`}
                className="inline-flex min-h-11 flex-1 items-center justify-center rounded-lg border border-white/15 px-3 text-sm text-brand-cream hover:bg-brand-warm sm:flex-none sm:min-w-[88px]"
              >
                Settings
              </Link>
            </div>
          </li>
        ))}
      </ul>
      {screens.length === 0 && !err && (
        <p className="mt-12 text-center text-sm text-brand-muted">
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
        className="text-sm text-brand-muted hover:text-brand-cream"
      >
        ← Back to screens
      </Link>
      <h1 className="mt-6 font-heading text-2xl font-semibold text-brand-cream">New screen</h1>
      <p className="mt-2 text-sm text-brand-muted">
        Name the screen (e.g. &quot;Front bar TV&quot;). You&apos;ll get a
        unique URL to open on the display.
      </p>
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <div>
          <label className="text-xs font-medium text-brand-text">Name</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-white/10 bg-brand-warm px-3 py-2 text-sm text-brand-cream outline-none focus:border-brand-amber"
          />
        </div>
        {err && <p className="text-sm text-red-400">{err}</p>}
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-brand-amber px-5 py-2.5 text-sm font-semibold text-brand-deep hover:bg-brand-amber-bright disabled:opacity-50"
        >
          {pending ? "Creating…" : "Create screen"}
        </button>
      </form>
    </div>
  );
}

function DisplayQrCode({ value }: { value: string }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const mod = await import("qrcode");
        const url = await mod.toDataURL(value, { width: 280, margin: 1 });
        if (!cancelled) setDataUrl(url);
      } catch {
        // qrcode lib unavailable — show a placeholder rather than blocking.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [value]);

  if (!dataUrl) {
    return (
      <div
        aria-hidden
        className="h-[140px] w-[140px] shrink-0 animate-pulse rounded-lg bg-white/10"
      />
    );
  }

  return (
    <div className="shrink-0 rounded-lg bg-white p-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={dataUrl} alt="QR code for the display URL" width={140} height={140} />
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
    return <p className="text-brand-muted">Loading…</p>;
  }
  if (err && !screen) {
    return <p className="text-red-400">{err}</p>;
  }

  return (
    <div className="mx-auto max-w-xl">
      <Link
        href="/dashboard"
        className="text-sm text-brand-muted hover:text-brand-cream"
      >
        ← Screens
      </Link>
      <h1 className="mt-6 font-heading text-2xl font-semibold text-brand-cream">Screen settings</h1>

      <form onSubmit={saveName} className="mt-8 space-y-4">
        <div>
          <label className="text-xs font-medium text-brand-text">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-white/10 bg-brand-warm px-3 py-2 text-sm text-brand-cream outline-none focus:border-brand-amber"
          />
        </div>
        {err && <p className="text-sm text-red-400">{err}</p>}
        <button
          type="submit"
          className="rounded-lg border border-white/15 px-4 py-2 text-sm text-brand-cream hover:bg-brand-warm"
        >
          Save name
        </button>
      </form>

      <div className="mt-10 rounded-xl border border-white/10 bg-brand-warm/60 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-brand-muted">
          TV URL
        </p>
        <p className="mt-2 break-all font-mono text-sm text-brand-amber/90">
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
          className="mt-3 text-sm text-brand-text hover:text-brand-cream"
        >
          {copied ? "Copied" : "Copy URL"}
        </button>

        {fullUrl && (
          <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-start">
            <DisplayQrCode value={fullUrl} />
            <div className="text-sm text-brand-muted">
              <p className="font-medium text-brand-cream">
                On your TV — three steps:
              </p>
              <ol className="mt-2 list-decimal space-y-1 pl-4">
                <li>Open the TV&apos;s built-in browser.</li>
                <li>
                  Type the URL above (screen {screen?.display_number}) — or scan the QR
                  with your phone first to test.
                </li>
                <li>Bookmark it so the TV reopens it on power-on.</li>
              </ol>
              <p className="mt-3 text-xs">
                Anyone with this link can view your playlist. Use &ldquo;Refresh
                security code&rdquo; below to revoke old long URLs that included a
                token.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => void regenerateToken()}
          className="rounded-lg border border-amber-600/50 px-4 py-2 text-sm text-amber-200 hover:bg-amber-950/40"
          title="Use this if you ever need to revoke an old TV's access."
        >
          Refresh security code
        </button>
        <Link
          href={`/dashboard/screens/${id}/playlist`}
          className="rounded-lg bg-brand-amber/20 px-4 py-2 text-sm font-medium text-brand-amber hover:bg-brand-amber/30"
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
  const router = useRouter();
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
    router.push("/dashboard");
  }

  const used = new Set(rows.map((r) => r.media_id));

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href={`/dashboard/screens/${id}`}
        className="text-sm text-brand-muted hover:text-brand-cream"
      >
        ← Screen settings
      </Link>
      <h1 className="mt-6 font-heading text-2xl font-semibold text-brand-cream">Playlist</h1>
      <p className="mt-2 text-sm text-brand-muted">
        Pick what plays on this TV. Saved changes reach the screen within about 10
        seconds.
      </p>
      {rows.length === 0 && (
        <p className="mt-3 text-sm text-brand-muted">
          Add at least one video or image from your library.
        </p>
      )}
      {rows.length === 1 && (
        <p className="mt-3 rounded-lg border border-white/10 bg-brand-warm/50 px-3 py-2 text-sm text-brand-cream/90">
          <span className="font-medium text-brand-amber">One item</span> — the TV
          loops it without switching away. Seconds are saved per row; they only
          matter if you add more items later.
        </p>
      )}
      {rows.length > 1 && (
        <p className="mt-3 rounded-lg border border-white/10 bg-brand-warm/50 px-3 py-2 text-sm text-brand-cream/90">
          <span className="font-medium text-brand-amber">Multiple items</span> —
          each row shows for its seconds, then the display crossfades to the next.
          For one looping menu with no cuts, use a single row only.
        </p>
      )}

      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <select
          value={pick}
          onChange={(e) => setPick(e.target.value)}
          className="min-h-11 w-full rounded-lg border border-white/10 bg-brand-warm px-3 py-2 text-sm text-brand-cream sm:max-w-md sm:flex-1"
        >
          <option value="">Add media…</option>
          {media
            .filter((m) => !used.has(m.id))
            .filter(
              (m) =>
                m.type !== "video" ||
                ((m.mux_status == null || m.mux_status === "ready") &&
                  (m.file_url || "").trim().length > 0),
            )
            .map((m) => (
              <option key={m.id} value={m.id}>
                {m.filename} ({m.type})
              </option>
            ))}
        </select>
        <button
          type="button"
          disabled={!pick}
          onClick={addMedia}
          className="min-h-11 rounded-lg border border-white/15 px-3 py-2 text-sm text-brand-cream hover:bg-brand-warm disabled:cursor-not-allowed disabled:opacity-40 sm:shrink-0"
        >
          Add to list
        </button>
        <button
          type="button"
          onClick={() => router.push("/dashboard/media")}
          className="min-h-11 rounded-lg border border-white/15 px-3 py-2 text-sm text-brand-cream hover:bg-brand-warm sm:shrink-0"
        >
          Add
        </button>
        <button
          type="button"
          onClick={() => void save()}
          disabled={saving}
          className="min-h-11 rounded-lg bg-brand-amber px-4 py-2 text-sm font-semibold text-brand-deep hover:bg-brand-amber-bright disabled:opacity-50 sm:shrink-0"
        >
          {saving ? "Saving…" : "Save playlist"}
        </button>
      </div>
      {err && <p className="mt-4 text-sm text-red-400">{err}</p>}

      <ul className="mt-8 space-y-2">
        {rows.map((r, i) => (
          <li
            key={r.id}
            className="flex flex-col gap-3 rounded-lg border border-white/10 bg-brand-warm/80 p-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2"
          >
            <span className="min-w-0 flex-1 text-sm text-brand-cream sm:truncate">
              {r.filename}
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-1 text-xs text-brand-muted">
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
                  className="min-h-9 w-16 rounded border border-white/10 bg-brand-deep px-2 py-1 text-sm text-brand-cream"
                />
              </label>
              <button
                type="button"
                onClick={() => move(i, -1)}
                className="min-h-9 min-w-9 rounded border border-white/10 px-2 py-1 text-brand-text hover:bg-brand-warm"
                aria-label="Move up"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => move(i, 1)}
                className="min-h-9 min-w-9 rounded border border-white/10 px-2 py-1 text-brand-text hover:bg-brand-warm"
                aria-label="Move down"
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() => removeAt(i)}
                className="min-h-9 text-sm text-red-400 hover:underline"
              >
                Remove
              </button>
            </div>
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
  /** `null` = idle; `number` = 0–100; `"…"` = indeterminate */
  const [uploadPct, setUploadPct] = useState<number | "…" | null>(null);

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

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "visible") void load();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [load]);

  useEffect(() => {
    if (typeof BroadcastChannel === "undefined") return;
    const ch = new BroadcastChannel(MEDIA_LIBRARY_REFRESH_CHANNEL);
    ch.onmessage = () => void load();
    return () => ch.close();
  }, [load]);

  useEffect(() => {
    const needsPoll = items.some((m) => m.mux_status === "processing");
    if (!needsPoll || !token) return;
    const t = setInterval(() => void load(), 10_000);
    return () => clearInterval(t);
  }, [items, load, token]);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f || !token) return;
    setPending(true);
    setUploadPct(0);
    setErr(null);
    const fd = new FormData();
    fd.append("file", f);
    try {
      const res = await apiUploadWithProgress("/media/upload", {
        token,
        body: fd,
        onProgress: (pct) => setUploadPct(pct ?? "…"),
      });
      e.target.value = "";
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setErr(String(d.detail || "Upload failed"));
        return;
      }
      void load();
    } catch (uploadErr) {
      setErr(
        uploadErr instanceof Error
          ? uploadErr.message
          : "Upload failed (network error).",
      );
    } finally {
      setPending(false);
      setUploadPct(null);
    }
  }

  async function del(mid: string) {
    if (!token || !confirm("Delete this file?")) return;
    await apiFetch(`/media/${mid}`, { method: "DELETE", token });
    void load();
  }

  return (
    <div>
      <h1 className="font-heading text-2xl font-semibold text-brand-cream">Media library</h1>
      <p className="mt-2 text-sm text-brand-muted">
        Images and video. Upload from here, then add to a screen playlist.
      </p>
      <div className="mt-6 space-y-3">
        <label className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-lg bg-brand-amber px-4 text-sm font-semibold text-brand-deep hover:bg-brand-amber-bright disabled:cursor-not-allowed disabled:opacity-60">
          {pending ? "Uploading…" : "Upload file"}
          <input
            type="file"
            accept="image/*,video/*"
            className="hidden"
            disabled={pending}
            onChange={(e) => void onFile(e)}
          />
        </label>
        {uploadPct !== null && (
          <div className="max-w-md">
            <div className="mb-1 flex justify-between text-xs text-brand-muted">
              <span>Uploading</span>
              <span>
                {uploadPct === "…" ? "…" : `${uploadPct}%`}
              </span>
            </div>
            <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-brand-warm/80">
              {uploadPct === "…" ? (
                <div className="absolute inset-y-0 left-0 w-2/5 rounded-full bg-brand-amber upload-indeterminate-bar" />
              ) : (
                <div
                  className="h-full rounded-full bg-brand-amber transition-[width] duration-150 ease-out"
                  style={{ width: `${uploadPct}%` }}
                />
              )}
            </div>
          </div>
        )}
      </div>
      {err && <p className="mt-4 text-sm text-red-400">{err}</p>}
      {items.length === 0 && !err && !pending && (
        <div className="mt-10 rounded-2xl border border-dashed border-white/15 bg-brand-warm/30 p-8 text-center">
          <p className="text-sm font-medium text-brand-cream">
            No videos or images yet.
          </p>
          <p className="mt-1 text-sm text-brand-muted">
            Click <strong className="text-brand-amber">Upload file</strong>{" "}
            above to add one — then drop it into a screen&apos;s playlist.
          </p>
        </div>
      )}
      <div className="mt-8 md:hidden">
        <ul className="space-y-3">
          {items.map((m) => (
            <li
              key={m.id}
              className="flex flex-col gap-3 rounded-xl border border-white/10 bg-brand-warm/80 p-4"
            >
              <div className="flex gap-3">
                {m.thumbnail_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={m.thumbnail_url}
                    alt=""
                    className="h-16 w-28 shrink-0 rounded-md object-cover"
                  />
                ) : null}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-brand-cream">{m.filename}</p>
                  <p className="mt-1 text-xs text-brand-muted">
                    {m.type}
                    {m.duration_seconds != null
                      ? ` · ${m.duration_seconds}s`
                      : ""}{" "}
                    · {(m.size_bytes / 1024 / 1024).toFixed(2)} MB
                  </p>
                  {m.mux_status === "processing" && (
                    <div className="mt-2">
                      <StatusPill tone="amber">Processing</StatusPill>
                    </div>
                  )}
                  {m.mux_status === "failed" && (
                    <div className="mt-2">
                      <StatusPill tone="red">Failed</StatusPill>
                    </div>
                  )}
                </div>
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
      <div className="mt-8 hidden overflow-x-auto rounded-xl border border-white/10 md:block">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="border-b border-white/10 bg-brand-bar text-xs uppercase tracking-wide text-brand-muted">
            <tr>
              <th className="px-4 py-3">Preview</th>
              <th className="px-4 py-3">File</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Duration</th>
              <th className="px-4 py-3">Size</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10 text-brand-cream">
            {items.map((m) => (
              <tr key={m.id}>
                <td className="px-4 py-3">
                  {m.thumbnail_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={m.thumbnail_url}
                      alt=""
                      className="h-12 w-20 rounded object-cover"
                    />
                  ) : (
                    <span className="text-brand-muted">—</span>
                  )}
                </td>
                <td className="max-w-[200px] truncate px-4 py-3 text-brand-cream">
                  {m.filename}
                </td>
                <td className="px-4 py-3">
                  <span className="mr-2">{m.type}</span>
                  {m.mux_status === "processing" && (
                    <StatusPill tone="amber">Processing</StatusPill>
                  )}
                  {m.mux_status === "failed" && (
                    <StatusPill tone="red">Failed</StatusPill>
                  )}
                </td>
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
      <h1 className="font-heading text-2xl font-semibold text-brand-cream">Admin · Users</h1>
      <p className="mt-2 max-w-2xl text-sm text-brand-muted">
        View and edit customer accounts. Grant admin with the checkbox (or set{" "}
        <code className="text-brand-text">ADMIN_EMAILS</code> in the API env and
        restart to auto-promote listed emails).
      </p>

      <div className="mt-8 space-y-3 md:hidden">
        {rows.map((r) => (
          <div
            key={r.id}
            className="rounded-xl border border-white/10 bg-brand-warm/80 p-4"
          >
            <p className="font-mono text-xs text-brand-amber/90">{r.email}</p>
            <p className="mt-2 text-sm text-brand-cream">
              {r.business_name || "—"} · {r.plan}
            </p>
            <p className="mt-1 text-xs text-brand-muted">
              Tier {r.effective_tier ?? "—"} · {r.screen_count} screens ·{" "}
              {r.media_count} media
              {r.is_admin ? " · admin" : ""}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => openEdit(r)}
                className="min-h-11 flex-1 rounded-lg border border-white/15 text-sm text-brand-amber hover:bg-brand-warm"
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

      <div className="mt-8 hidden overflow-x-auto rounded-xl border border-white/10 md:block">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-white/10 bg-brand-bar text-xs uppercase tracking-wide text-brand-muted">
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
          <tbody className="divide-y divide-white/10">
            {rows.map((r) => (
              <tr key={r.id} className="text-brand-cream">
                <td className="px-4 py-3 font-mono text-xs text-brand-amber/90">
                  {r.email}
                </td>
                <td className="max-w-[140px] truncate px-4 py-3">
                  {r.business_name || "—"}
                </td>
                <td className="px-4 py-3">{r.plan}</td>
                <td className="px-4 py-3 text-brand-muted">
                  {r.effective_tier ?? "—"}
                </td>
                <td className="px-4 py-3">{r.screen_count}</td>
                <td className="px-4 py-3">{r.media_count}</td>
                <td className="px-4 py-3">{r.is_admin ? "Yes" : ""}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => openEdit(r)}
                    className="text-brand-amber hover:underline"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4">
          <div className="my-auto w-full max-w-md rounded-xl border border-white/10 bg-brand-warm p-5 shadow-xl sm:p-6">
            <h2 className="text-lg font-semibold text-brand-cream">Edit user</h2>
            <p className="mt-1 font-mono text-xs text-brand-muted">{editing.email}</p>
            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs text-brand-muted">Business name</label>
                <input
                  value={form.business_name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, business_name: e.target.value }))
                  }
                  className="mt-1 w-full rounded-lg border border-white/10 bg-brand-deep px-3 py-2 text-sm text-brand-cream"
                />
              </div>
              <div>
                <label className="text-xs text-brand-muted">Plan</label>
                <select
                  value={form.plan}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, plan: e.target.value }))
                  }
                  className="mt-1 w-full rounded-lg border border-white/10 bg-brand-deep px-3 py-2 text-sm text-brand-cream"
                >
                  {["trialing", "starter", "pro", "business"].map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-brand-muted">Trial ends (local)</label>
                <input
                  type="datetime-local"
                  value={form.trial_local}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, trial_local: e.target.value }))
                  }
                  className="mt-1 w-full rounded-lg border border-white/10 bg-brand-deep px-3 py-2 text-sm text-brand-cream"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-brand-cream">
                <input
                  type="checkbox"
                  checked={form.is_admin}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, is_admin: e.target.checked }))
                  }
                  className="rounded border-white/15"
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
                className="rounded-lg border border-white/15 px-4 py-2 text-sm text-brand-cream"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => void saveEdit()}
                className="rounded-lg bg-brand-amber px-4 py-2 text-sm font-semibold text-brand-deep disabled:opacity-50"
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

function SupportPage() {
  return (
    <div className="max-w-lg">
      <h1 className="font-heading text-2xl font-semibold text-brand-cream">Support</h1>
      <div className="mt-6">
        <SupportCard />
      </div>
    </div>
  );
}

function AccountPage() {
  const { user, token, refreshUser } = useAuth();
  const [accountSlug, setAccountSlug] = useState("");
  const [slugErr, setSlugErr] = useState<string | null>(null);
  const [slugSaved, setSlugSaved] = useState(false);
  const [savingSlug, setSavingSlug] = useState(false);
  const [billingErr, setBillingErr] = useState<string | null>(null);
  const [billingBusy, setBillingBusy] = useState<"checkout" | "portal" | null>(
    null,
  );
  const [billingStatus, setBillingStatus] = useState<string | null>(null);

  useEffect(() => {
    void refreshUser();
  }, [refreshUser]);

  useEffect(() => {
    if (user?.account_slug) setAccountSlug(user.account_slug);
  }, [user?.account_slug]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const value = new URLSearchParams(window.location.search).get("billing");
    setBillingStatus(value);
  }, []);

  const isPaid = ["starter", "pro", "business"].includes(user?.plan ?? "");
  const trialExpired =
    Boolean(user?.trial_ends_at) &&
    new Date(user!.trial_ends_at).getTime() < Date.now() &&
    !isPaid;

  const shortUrlPrefix =
    typeof window !== "undefined" && user?.account_slug
      ? `${window.location.host}/${user.account_slug}/`
      : user?.account_slug
        ? `www.kemisdisplay.com/${user.account_slug}/`
        : "";

  async function saveAccountSlug(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !accountSlug.trim()) return;
    setSlugErr(null);
    setSavingSlug(true);
    const res = await apiFetch("/auth/me", {
      method: "PATCH",
      token,
      body: JSON.stringify({ account_slug: accountSlug.trim() }),
    });
    setSavingSlug(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setSlugErr(String(d.detail || "Could not update URL"));
      return;
    }
    await refreshUser();
    setSlugSaved(true);
    setTimeout(() => setSlugSaved(false), 2000);
  }

  async function startCheckout() {
    if (!token) return;
    setBillingErr(null);
    setBillingBusy("checkout");
    try {
      const res = await apiFetch("/billing/checkout", {
        method: "POST",
        token,
      });
      const d = (await res.json().catch(() => ({}))) as {
        url?: string;
        detail?: string;
      };
      if (!res.ok || !d.url) {
        setBillingErr(String(d.detail || "Could not start checkout."));
        return;
      }
      window.location.href = d.url;
    } catch {
      setBillingErr("Could not reach billing. Try again.");
    } finally {
      setBillingBusy(null);
    }
  }

  async function openPortal() {
    if (!token) return;
    setBillingErr(null);
    setBillingBusy("portal");
    try {
      const res = await apiFetch("/billing/portal", {
        method: "POST",
        token,
      });
      const d = (await res.json().catch(() => ({}))) as {
        url?: string;
        detail?: string;
      };
      if (!res.ok || !d.url) {
        setBillingErr(String(d.detail || "Could not open billing portal."));
        return;
      }
      window.location.href = d.url;
    } catch {
      setBillingErr("Could not reach billing. Try again.");
    } finally {
      setBillingBusy(null);
    }
  }

  return (
    <div className="max-w-lg">
      <h1 className="font-heading text-2xl font-semibold text-brand-cream">Account</h1>
      <div className="mt-6">
        <SupportCard />
      </div>
      <div className="mt-6 space-y-4 rounded-xl border border-white/10 bg-brand-warm/60 p-6 text-sm text-brand-cream">
        <p>
          <span className="text-brand-muted">Email</span>
          <br />
          {user?.email}
        </p>
        <p>
          <span className="text-brand-muted">Plan</span>
          <br />
          {user?.plan} · effective tier: {user?.effective_tier ?? "none"}
        </p>
        <p>
          <span className="text-brand-muted">Trial ends</span>
          <br />
          {user?.trial_ends_at
            ? new Date(user.trial_ends_at).toLocaleString()
            : "—"}
        </p>

        <div className="border-t border-white/10 pt-4">
          <p className="text-brand-muted">Billing</p>
          <p className="mt-1 text-brand-cream">
            Starter is <span className="font-semibold">$25/month</span> for up to{" "}
            <span className="font-semibold">2 screens</span>. Cancel anytime from
            Manage billing.
          </p>
          {billingStatus === "success" && (
            <p className="mt-2 text-sm text-brand-amber">
              Payment received. Your Starter plan will activate in a moment — refresh
              if the plan still shows as trial.
            </p>
          )}
          {billingStatus === "cancel" && (
            <p className="mt-2 text-sm text-brand-muted">
              Checkout canceled. You can subscribe whenever you&apos;re ready.
            </p>
          )}
          {trialExpired && (
            <p className="mt-2 text-sm text-red-300">
              Your trial has ended. Subscribe to keep publishing to your screens.
            </p>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            {!isPaid && (
              <button
                type="button"
                disabled={billingBusy !== null}
                onClick={() => void startCheckout()}
                className="rounded-lg bg-brand-amber px-4 py-2 text-sm font-semibold text-brand-deep transition hover:bg-brand-amber-bright disabled:opacity-50"
              >
                {billingBusy === "checkout"
                  ? "Redirecting…"
                  : "Subscribe — $25/mo"}
              </button>
            )}
            {(user?.has_billing_customer || isPaid) && (
              <button
                type="button"
                disabled={billingBusy !== null}
                onClick={() => void openPortal()}
                className="rounded-lg border border-white/15 px-4 py-2 text-sm text-brand-cream transition hover:bg-brand-warm disabled:opacity-50"
              >
                {billingBusy === "portal" ? "Opening…" : "Manage billing"}
              </button>
            )}
          </div>
          {billingErr && (
            <p className="mt-2 text-sm text-red-400">{billingErr}</p>
          )}
        </div>

        <form onSubmit={(e) => void saveAccountSlug(e)} className="pt-2">
          <label className="text-brand-muted">TV link prefix</label>
          <p className="mt-1 text-xs text-brand-muted">
            Screens use{" "}
            <span className="font-mono text-brand-text">
              {shortUrlPrefix || "your-name/"}
              1
            </span>
            ,{" "}
            <span className="font-mono text-brand-text">
              {shortUrlPrefix || "your-name/"}
              2
            </span>
            , etc.
          </p>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="flex min-w-0 flex-1 items-center rounded-lg border border-white/10 bg-brand-warm">
              <span className="shrink-0 pl-3 text-xs text-brand-muted">/</span>
              <input
                value={accountSlug}
                onChange={(e) => setAccountSlug(e.target.value)}
                className="min-w-0 flex-1 bg-transparent py-2 pr-3 text-sm text-brand-cream outline-none"
                placeholder="your-business"
              />
              <span className="shrink-0 pr-3 text-xs text-brand-muted">/1</span>
            </div>
            <button
              type="submit"
              disabled={savingSlug}
              className="rounded-lg border border-white/15 px-4 py-2 text-sm text-brand-cream hover:bg-brand-warm disabled:opacity-50"
            >
              {savingSlug ? "Saving…" : slugSaved ? "Saved" : "Save"}
            </button>
          </div>
          {slugErr && <p className="mt-2 text-sm text-red-400">{slugErr}</p>}
        </form>
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
  if (pathname === "/dashboard/support") {
    return <SupportPage />;
  }
  if (pathname === "/dashboard/account") {
    return <AccountPage />;
  }
  return <ScreenList />;
}
