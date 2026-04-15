"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export type MenuRow = {
  id: string;
  user_id: string;
  screen_id: string | null;
  title: string;
  theme: string;
  footer_note: string | null;
  sections: { heading: string; items: { name: string; price: string }[] }[];
  created_at: string;
  updated_at: string;
};

export function MenuList() {
  const { token } = useAuth();
  const [rows, setRows] = useState<MenuRow[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    const res = await apiFetch("/menus", { token });
    if (!res.ok) {
      setErr("Could not load menus");
      return;
    }
    setRows(await res.json());
    setErr(null);
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-white">Menus</h1>
        <Link
          href="/dashboard/menus/new"
          className="inline-flex min-h-11 items-center justify-center rounded-lg bg-emerald-500 px-4 text-sm font-semibold text-zinc-950 hover:bg-emerald-400"
        >
          New menu
        </Link>
      </div>
      <p className="mt-2 text-sm text-zinc-500">
        Build a specials board, generate a 30s video, then add it to a playlist
        from Media.
      </p>
      {err && <p className="mt-4 text-sm text-red-400">{err}</p>}
      <ul className="mt-8 space-y-3">
        {rows.map((m) => (
          <li key={m.id}>
            <Link
              href={`/dashboard/menus/${m.id}`}
              className="flex min-h-11 flex-col justify-center rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 hover:border-zinc-600"
            >
              <span className="font-medium text-white">{m.title}</span>
              <span className="text-xs text-zinc-500">
                {m.sections?.length ?? 0} section(s) · theme {m.theme}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {rows.length === 0 && !err && (
        <p className="mt-12 text-center text-sm text-zinc-500">
          No menus yet. Create one to generate chalkboard videos for your TVs.
        </p>
      )}
    </div>
  );
}

export function MenuNew() {
  const { token } = useAuth();
  const router = useRouter();
  const [err, setErr] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function create() {
    if (!token) return;
    setPending(true);
    setErr(null);
    const res = await apiFetch("/menus", {
      method: "POST",
      token,
      body: JSON.stringify({ title: "SPECIALS", theme: "chalkboard", sections: [] }),
    });
    setPending(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErr(String(data.detail || "Could not create menu"));
      return;
    }
    router.push(`/dashboard/menus/${data.id}`);
  }

  return (
    <div className="mx-auto max-w-lg">
      <Link
        href="/dashboard/menus"
        className="text-sm text-zinc-500 hover:text-zinc-300"
      >
        ← Menus
      </Link>
      <h1 className="mt-6 text-2xl font-semibold text-white">New menu</h1>
      <p className="mt-2 text-sm text-zinc-500">
        We&apos;ll open the editor with a starter layout. You can rename sections
        and items, then generate video.
      </p>
      {err && <p className="mt-4 text-sm text-red-400">{err}</p>}
      <button
        type="button"
        disabled={pending}
        onClick={() => void create()}
        className="mt-8 min-h-11 w-full rounded-lg bg-emerald-500 px-4 py-3 text-sm font-semibold text-zinc-950 hover:bg-emerald-400 disabled:opacity-50"
      >
        {pending ? "Creating…" : "Create menu"}
      </button>
    </div>
  );
}

export function MenuEditor({ id }: { id: string }) {
  const { token } = useAuth();
  const [menu, setMenu] = useState<MenuRow | null>(null);
  const [title, setTitle] = useState("");
  const [footer, setFooter] = useState("");
  const [sections, setSections] = useState<
    { heading: string; items: { name: string; price: string }[] }[]
  >([]);
  const [err, setErr] = useState<string | null>(null);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<string | null>(null);
  const [jobErr, setJobErr] = useState<string | null>(null);
  const [mediaId, setMediaId] = useState<string | null>(null);

  const refreshPreview = useCallback(async () => {
    if (!token) return;
    const res = await apiFetch(`/menus/${id}/preview`, { token });
    if (res.ok) {
      setPreviewHtml(await res.text());
    }
  }, [token, id]);

  const load = useCallback(async () => {
    if (!token) return;
    const res = await apiFetch(`/menus/${id}`, { token });
    if (!res.ok) {
      setErr("Menu not found");
      return;
    }
    const m = (await res.json()) as MenuRow;
    setMenu(m);
    setTitle(m.title);
    setFooter(m.footer_note || "");
    setSections(
      m.sections?.length
        ? m.sections
        : [{ heading: "SPECIALS", items: [{ name: "", price: "" }] }],
    );
    setErr(null);
    void refreshPreview();
  }, [token, id, refreshPreview]);

  useEffect(() => {
    void load();
  }, [load]);

  async function save(): Promise<boolean> {
    if (!token) return false;
    setSaveMsg(null);
    const res = await apiFetch(`/menus/${id}`, {
      method: "PUT",
      token,
      body: JSON.stringify({
        title,
        footer_note: footer || null,
        theme: "chalkboard",
        sections,
      }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setSaveMsg(String(d.detail || "Save failed"));
      return false;
    }
    setMenu(await res.json());
    setSaveMsg("Saved");
    void refreshPreview();
    return true;
  }

  async function renderVideo() {
    if (!token) return;
    setJobErr(null);
    setMediaId(null);
    setJobStatus(null);
    const saved = await save();
    if (!saved) {
      setJobErr("Fix errors above, then try Generate again.");
      return;
    }
    const res = await apiFetch(`/menus/${id}/render`, { method: "POST", token });
    const data = await res.json().catch(() => ({}));
    if (res.status === 503) {
      setJobErr(String(data.detail || "Renderer busy — try again shortly."));
      return;
    }
    if (!res.ok) {
      setJobErr(String(data.detail || "Could not start render"));
      return;
    }
    setJobId(data.job_id);
    setJobStatus(data.status || "pending");
  }

  useEffect(() => {
    if (!jobId || !token) return;
    const t = setInterval(async () => {
      const res = await apiFetch(`/jobs/${jobId}`, { token });
      if (!res.ok) return;
      const j = await res.json();
      setJobStatus(j.status);
      if (j.status === "succeeded" && j.media_id) {
        setMediaId(j.media_id);
        clearInterval(t);
      }
      if (j.status === "failed") {
        setJobErr(j.error_message || "Render failed");
        clearInterval(t);
      }
    }, 2000);
    return () => clearInterval(t);
  }, [jobId, token]);

  function updateSectionHeading(i: number, heading: string) {
    setSections((s) =>
      s.map((sec, j) => (j === i ? { ...sec, heading } : sec)),
    );
  }

  function updateItem(
    si: number,
    ii: number,
    field: "name" | "price",
    value: string,
  ) {
    setSections((s) =>
      s.map((sec, j) => {
        if (j !== si) return sec;
        const items = sec.items.map((it, k) =>
          k === ii ? { ...it, [field]: value } : it,
        );
        return { ...sec, items };
      }),
    );
  }

  function addItem(si: number) {
    setSections((s) =>
      s.map((sec, j) =>
        j === si
          ? { ...sec, items: [...sec.items, { name: "", price: "" }] }
          : sec,
      ),
    );
  }

  function addSection() {
    setSections((s) => [
      ...s,
      { heading: "Section", items: [{ name: "", price: "" }] },
    ]);
  }

  if (!menu && !err) {
    return <p className="text-zinc-500">Loading…</p>;
  }
  if (err && !menu) {
    return <p className="text-red-400">{err}</p>;
  }

  return (
    <div className="mx-auto max-w-6xl">
      <Link
        href="/dashboard/menus"
        className="text-sm text-zinc-500 hover:text-zinc-300"
      >
        ← Menus
      </Link>
      <h1 className="mt-6 text-2xl font-semibold text-white">Edit menu</h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <div className="space-y-6">
          <div>
            <label className="text-xs text-zinc-500">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-500">Footer (phone, etc.)</label>
            <input
              value={footer}
              onChange={(e) => setFooter(e.target.value)}
              className="mt-1 min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white"
            />
          </div>

          {sections.map((sec, si) => (
            <div
              key={si}
              className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4"
            >
              <input
                value={sec.heading}
                onChange={(e) => updateSectionHeading(si, e.target.value)}
                className="mb-3 w-full border-b border-zinc-700 bg-transparent text-lg font-semibold text-emerald-400 outline-none"
              />
              {sec.items.map((it, ii) => (
                <div key={ii} className="mb-2 flex gap-2">
                  <input
                    value={it.name}
                    onChange={(e) => updateItem(si, ii, "name", e.target.value)}
                    placeholder="Item"
                    className="min-h-11 flex-1 rounded border border-zinc-700 bg-zinc-950 px-2 text-sm text-white"
                  />
                  <input
                    value={it.price}
                    onChange={(e) => updateItem(si, ii, "price", e.target.value)}
                    placeholder="$"
                    className="min-h-11 w-24 rounded border border-zinc-700 bg-zinc-950 px-2 text-sm text-white"
                  />
                </div>
              ))}
              <button
                type="button"
                onClick={() => addItem(si)}
                className="mt-2 text-sm text-emerald-400 hover:underline"
              >
                + Add item
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={addSection}
            className="text-sm text-zinc-400 hover:text-white"
          >
            + Add section
          </button>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void save()}
              className="min-h-11 rounded-lg border border-zinc-600 px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-800"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => void renderVideo()}
              className="min-h-11 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-emerald-400"
            >
              Generate 30s video
            </button>
          </div>
          {saveMsg && (
            <p className="text-sm text-zinc-400" role="status">
              {saveMsg}
            </p>
          )}
          {jobStatus && (
            <p className="text-sm text-zinc-400">
              Render: <strong>{jobStatus}</strong>
              {mediaId && (
                <>
                  {" "}
                  — media ID <code className="text-emerald-400">{mediaId}</code>.
                  Open{" "}
                  <Link href="/dashboard/media" className="text-emerald-400 underline">
                    Media
                  </Link>{" "}
                  to confirm, then add to a playlist.
                </>
              )}
            </p>
          )}
          {jobErr && <p className="text-sm text-red-400">{jobErr}</p>}
        </div>

        <div className="hidden lg:block">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Live preview (chalkboard)
            </p>
            <button
              type="button"
              onClick={() => void refreshPreview()}
              className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800"
            >
              Refresh preview
            </button>
          </div>
          <div className="aspect-video w-full overflow-hidden rounded-xl border border-zinc-800 bg-black">
            {previewHtml ? (
              <iframe
                title="Preview"
                srcDoc={previewHtml}
                sandbox="allow-scripts allow-same-origin"
                className="h-[1080px] w-[1920px] border-0 origin-top-left"
                style={{ transform: "scale(var(--preview-scale,0.28))" }}
                ref={(el) => {
                  if (!el) return;
                  const parent = el.parentElement;
                  if (!parent) return;
                  const ro = new ResizeObserver(([entry]) => {
                    const s = entry.contentRect.width / 1920;
                    parent.style.setProperty("--preview-scale", String(s));
                    parent.style.height = `${1080 * s}px`;
                  });
                  ro.observe(parent);
                }}
              />
            ) : (
              <div className="flex h-64 items-center justify-center text-zinc-600">
                Preview loading…
              </div>
            )}
          </div>
          <p className="mt-2 text-xs text-zinc-600">
            Preview reflects the last saved menu. Save, then refresh here.
          </p>
        </div>
      </div>
    </div>
  );
}
