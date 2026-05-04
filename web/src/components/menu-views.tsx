"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { apiFetch } from "@/lib/api";
import { broadcastMediaLibraryRefresh } from "@/lib/media-sync";
import { useAuth } from "@/lib/auth-context";

/** Must match API `MENU_MAX_ITEMS` in `api/app/schemas.py`. */
const MENU_MAX_ITEMS = 24;

function countMenuItems(
  secs: { items: { name: string; price: string }[] }[],
): number {
  return secs.reduce((n, sec) => n + sec.items.length, 0);
}

function menuDeleteAbortSignal(): AbortSignal | undefined {
  try {
    if (typeof AbortSignal !== "undefined" && "timeout" in AbortSignal) {
      return AbortSignal.timeout(60_000);
    }
  } catch {
    /* ignore */
  }
  return undefined;
}

function formatFastApiDetail(body: unknown, fallback: string): string {
  if (typeof body === "object" && body !== null && "detail" in body) {
    const det = (body as { detail: unknown }).detail;
    if (typeof det === "string") return det;
    if (Array.isArray(det)) {
      return det
        .map((e) =>
          typeof e === "object" &&
          e !== null &&
          "msg" in e &&
          typeof (e as { msg: unknown }).msg === "string"
            ? (e as { msg: string }).msg
            : String(e),
        )
        .join(" ");
    }
  }
  return fallback;
}

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

function ChalkPreviewPanel({
  previewHtml,
  onRefresh,
}: {
  previewHtml: string | null;
  onRefresh: () => void;
}) {
  const frameWrapRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const parent = frameWrapRef.current;
    if (!parent || !previewHtml) return;
    const ro = new ResizeObserver(([entry]) => {
      const s = entry.contentRect.width / 1920;
      parent.style.setProperty("--preview-scale", String(s));
      parent.style.height = `${1080 * s}px`;
    });
    ro.observe(parent);
    return () => ro.disconnect();
  }, [previewHtml]);

  return (
    <>
      <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-brand-muted">
          Live preview (chalkboard)
        </p>
        <button
          type="button"
          onClick={() => void onRefresh()}
          className="min-h-10 shrink-0 rounded-lg border border-white/10 px-3 py-2 text-xs text-brand-cream hover:bg-brand-warm sm:py-1.5"
        >
          Refresh preview
        </button>
      </div>
      <div
        ref={frameWrapRef}
        className="aspect-video w-full max-h-[70vh] overflow-hidden rounded-xl border border-white/10 bg-black lg:max-h-none"
      >
        {previewHtml ? (
          <iframe
            title="Chalkboard preview"
            srcDoc={previewHtml}
            sandbox="allow-scripts allow-same-origin"
            className="h-[1080px] w-[1920px] border-0 origin-top-left"
            style={{ transform: "scale(var(--preview-scale,0.28))" }}
          />
        ) : (
          <div className="flex h-64 items-center justify-center text-brand-muted">
            Preview loading…
          </div>
        )}
      </div>
      <p className="mt-2 text-xs text-brand-muted">
        Preview reflects the last saved menu. Save, then refresh here.
      </p>
    </>
  );
}

/** Avoid hydration mismatch: resolve breakpoint after mount (before paint). */
function useLgBreakpointReady(): { ready: boolean; lg: boolean } {
  const [state, setState] = useState<{ ready: boolean; lg: boolean }>({
    ready: false,
    lg: false,
  });

  useLayoutEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const apply = () =>
      setState((s) => ({ ...s, ready: true, lg: mq.matches }));
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  return { ready: state.ready, lg: state.lg };
}

export function MenuList() {
  const { token } = useAuth();
  const [rows, setRows] = useState<MenuRow[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  async function removeMenu(menuId: string, menuTitle: string) {
    if (!token) return;
    const label = menuTitle.trim() || "Untitled";
    if (
      !window.confirm(
        `Delete “${label}”? Files already in Media or on playlists are not removed automatically.`,
      )
    ) {
      return;
    }
    setDeletingId(menuId);
    setErr(null);
    const signal = menuDeleteAbortSignal();
    try {
      const res = await apiFetch(`/menus/${menuId}`, {
        method: "DELETE",
        token,
        ...(signal ? { signal } : {}),
      });
      if (!res.ok) {
        const raw = await res.json().catch(() => ({}));
        setErr(formatFastApiDetail(raw, "Could not delete menu"));
        return;
      }
      setRows((r) => r.filter((x) => x.id !== menuId));
    } catch (e) {
      const name = e instanceof DOMException ? e.name : "";
      const msg =
        name === "TimeoutError" || name === "AbortError"
          ? "Delete timed out — check your connection and try again."
          : e instanceof Error
            ? e.message
            : "Could not delete menu (network error).";
      setErr(msg);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-brand-cream">Menus</h1>
        <Link
          href="/dashboard/menus/new"
          className="inline-flex min-h-11 items-center justify-center rounded-lg bg-brand-amber px-4 text-sm font-semibold text-brand-deep hover:bg-brand-amber-bright"
        >
          New menu
        </Link>
      </div>
      <p className="mt-2 text-sm text-brand-muted">
        Build a specials board, generate a video, then add it to a playlist
        from Media.
      </p>
      {err && <p className="mt-4 text-sm text-red-400">{err}</p>}
      <ul className="mt-8 space-y-3">
        {rows.map((m) => (
          <li key={m.id}>
            <div className="flex flex-col gap-2 rounded-xl border border-white/10 bg-brand-warm/80 p-2 sm:flex-row sm:items-stretch">
              <Link
                href={`/dashboard/menus/${m.id}`}
                className="flex min-h-11 flex-1 flex-col justify-center rounded-lg px-3 py-3 hover:bg-brand-warm/90"
              >
                <span className="font-medium text-brand-cream">{m.title}</span>
                <span className="text-xs text-brand-muted">
                  {m.sections?.length ?? 0} section
                  {m.sections?.length === 1 ? "" : "s"}
                </span>
              </Link>
              <button
                type="button"
                disabled={deletingId === m.id}
                onClick={() => void removeMenu(m.id, m.title)}
                className="min-h-11 shrink-0 rounded-lg border border-red-500/25 bg-red-500/10 px-4 text-sm font-medium text-red-400 hover:bg-red-500/20 disabled:opacity-50 sm:self-center"
              >
                {deletingId === m.id ? "Deleting…" : "Delete"}
              </button>
            </div>
          </li>
        ))}
      </ul>
      {rows.length === 0 && !err && (
        <p className="mt-12 text-center text-sm text-brand-muted">
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
        className="text-sm text-brand-muted hover:text-brand-cream"
      >
        ← Menus
      </Link>
      <h1 className="mt-6 text-2xl font-semibold text-brand-cream">New menu</h1>
      <p className="mt-2 text-sm text-brand-muted">
        We&apos;ll open the editor with a starter layout. You can rename sections
        and items, then generate video.
      </p>
      {err && <p className="mt-4 text-sm text-red-400">{err}</p>}
      <button
        type="button"
        disabled={pending}
        onClick={() => void create()}
        className="mt-8 min-h-11 w-full rounded-lg bg-brand-amber px-4 py-3 text-sm font-semibold text-brand-deep hover:bg-brand-amber-bright disabled:opacity-50"
      >
        {pending ? "Creating…" : "Create menu"}
      </button>
    </div>
  );
}

export function MenuEditor({ id }: { id: string }) {
  const { token } = useAuth();
  const router = useRouter();
  const [menu, setMenu] = useState<MenuRow | null>(null);
  const [title, setTitle] = useState("");
  const [footer, setFooter] = useState("");
  const [sections, setSections] = useState<
    { heading: string; items: { name: string; price: string }[] }[]
  >([]);
  const [err, setErr] = useState<string | null>(null);
  const [phase, setPhase] = useState<
    "idle" | "saving" | "rendering" | "done"
  >("idle");
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<string | null>(null);
  const [jobErr, setJobErr] = useState<string | null>(null);
  const [mediaId, setMediaId] = useState<string | null>(null);
  const { ready: previewReady, lg: previewLg } = useLgBreakpointReady();
  const [mobilePreviewOpen, setMobilePreviewOpen] = useState(false);
  /** JPEG to R2 (default): best for TVs. Uncheck for legacy 10s MP4 + Mux pipeline. */
  const [renderAsImage, setRenderAsImage] = useState(true);
  const [deleting, setDeleting] = useState(false);

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
      setJobErr(formatFastApiDetail(d, "Save failed"));
      return false;
    }
    setMenu(await res.json());
    void refreshPreview();
    return true;
  }

  async function deleteMenu() {
    if (!token || deleting) return;
    const label = title.trim() || "this menu";
    if (
      !window.confirm(
        `Delete “${label}”? Files already in Media or on playlists are not removed automatically.`,
      )
    ) {
      return;
    }
    setJobErr(null);
    setDeleting(true);
    const signal = menuDeleteAbortSignal();
    try {
      const res = await apiFetch(`/menus/${id}`, {
        method: "DELETE",
        token,
        ...(signal ? { signal } : {}),
      });
      if (!res.ok) {
        const raw = await res.json().catch(() => ({}));
        setJobErr(formatFastApiDetail(raw, "Could not delete menu"));
        return;
      }
      router.push("/dashboard/menus");
    } catch (e) {
      const name = e instanceof DOMException ? e.name : "";
      setJobErr(
        name === "TimeoutError" || name === "AbortError"
          ? "Delete timed out — check your connection and try again."
          : e instanceof Error
            ? e.message
            : "Could not delete menu (network error).",
      );
    } finally {
      setDeleting(false);
    }
  }

  async function saveAndRender() {
    if (!token) return;
    setJobErr(null);
    setMediaId(null);
    setJobStatus(null);
    setPhase("saving");

    const saved = await save();
    if (!saved) {
      setPhase("idle");
      return;
    }

    setPhase("rendering");
    const q = renderAsImage ? "as_image=true" : "as_image=false";
    const res = await apiFetch(`/menus/${id}/render?${q}`, {
      method: "POST",
      token,
    });
    const data = await res.json().catch(() => ({}));
    if (res.status === 503) {
      setJobErr(
        String(data.detail || "Menu renderer is busy — try again in a moment."),
      );
      setPhase("idle");
      return;
    }
    if (!res.ok) {
      setJobErr(String(data.detail || "Could not start publishing the menu"));
      setPhase("idle");
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
        setPhase("done");
        broadcastMediaLibraryRefresh();
        clearInterval(t);
      }
      if (j.status === "failed") {
        setJobErr(j.error_message || "Menu export failed");
        setPhase("idle");
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
    if (countMenuItems(sections) >= MENU_MAX_ITEMS) return;
    setSections((s) =>
      s.map((sec, j) =>
        j === si
          ? { ...sec, items: [...sec.items, { name: "", price: "" }] }
          : sec,
      ),
    );
  }

  function removeItem(si: number, ii: number) {
    setSections((s) =>
      s.map((sec, j) =>
        j === si
          ? { ...sec, items: sec.items.filter((_, k) => k !== ii) }
          : sec,
      ),
    );
  }

  function addSection() {
    if (countMenuItems(sections) + 1 > MENU_MAX_ITEMS) return;
    setSections((s) => [
      ...s,
      { heading: "Section", items: [{ name: "", price: "" }] },
    ]);
  }

  function removeSection(si: number) {
    const sec = sections[si];
    if (!sec) return;
    const label = sec.heading.trim() || "this section";
    const ok = window.confirm(
      `Remove "${label}" and its ${sec.items.length} item${sec.items.length === 1 ? "" : "s"}?`,
    );
    if (!ok) return;
    setSections((s) => s.filter((_, j) => j !== si));
  }

  if (!menu && !err) {
    return <p className="text-brand-muted">Loading…</p>;
  }
  if (err && !menu) {
    return <p className="text-red-400">{err}</p>;
  }

  const itemTotal = countMenuItems(sections);
  const atItemCap = itemTotal >= MENU_MAX_ITEMS;

  return (
    <div className="mx-auto max-w-6xl">
      <Link
        href="/dashboard/menus"
        className="text-sm text-brand-muted hover:text-brand-cream"
      >
        ← Menus
      </Link>
      <h1 className="mt-6 text-2xl font-semibold text-brand-cream">Edit menu</h1>
      <p className="mt-2 text-sm text-brand-muted">
        {itemTotal}/{MENU_MAX_ITEMS} items (max across all sections).{" "}
        {atItemCap ? (
          <span className="text-brand-amber">
            Remove an item or section to add more.
          </span>
        ) : null}
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <div className="space-y-6">
          <div>
            <label className="text-xs text-brand-muted">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 min-h-11 w-full rounded-lg border border-white/10 bg-brand-warm px-3 py-2 text-sm text-brand-cream"
            />
          </div>
          <div>
            <label className="text-xs text-brand-muted">Footer (phone, etc.)</label>
            <input
              value={footer}
              onChange={(e) => setFooter(e.target.value)}
              className="mt-1 min-h-11 w-full rounded-lg border border-white/10 bg-brand-warm px-3 py-2 text-sm text-brand-cream"
            />
          </div>

          {sections.map((sec, si) => (
            <div
              key={si}
              className="rounded-xl border border-white/10 bg-brand-warm/60 p-4"
            >
              <div className="mb-3 flex items-center gap-2 border-b border-white/10">
                <input
                  value={sec.heading}
                  onChange={(e) => updateSectionHeading(si, e.target.value)}
                  className="min-w-0 flex-1 bg-transparent text-lg font-semibold text-brand-amber outline-none"
                />
                <button
                  type="button"
                  onClick={() => removeSection(si)}
                  className="shrink-0 text-xs text-red-400 hover:text-red-300"
                >
                  Remove section
                </button>
              </div>
              {sec.items.map((it, ii) => (
                <div key={ii} className="mb-2 flex gap-2">
                  <input
                    value={it.name}
                    onChange={(e) => updateItem(si, ii, "name", e.target.value)}
                    placeholder="Item"
                    className="min-h-11 flex-1 rounded border border-white/10 bg-brand-deep px-2 text-sm text-brand-cream"
                  />
                  <input
                    value={it.price}
                    onChange={(e) => updateItem(si, ii, "price", e.target.value)}
                    placeholder="$"
                    className="min-h-11 w-20 rounded border border-white/10 bg-brand-deep px-2 text-sm text-brand-cream"
                  />
                  <button
                    type="button"
                    onClick={() => removeItem(si, ii)}
                    aria-label="Remove item"
                    className="flex h-11 w-9 shrink-0 items-center justify-center rounded border border-white/10 text-brand-muted hover:border-red-400/40 hover:text-red-400"
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addItem(si)}
                disabled={atItemCap}
                className="mt-2 text-sm text-brand-amber hover:underline disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:no-underline"
              >
                + Add item
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={addSection}
            disabled={atItemCap}
            className="text-sm text-brand-text hover:text-brand-cream disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:text-brand-text"
          >
            + Add section
          </button>

          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-white/10 bg-brand-warm/40 px-3 py-3 text-sm text-brand-cream">
            <input
              type="checkbox"
              checked={renderAsImage}
              onChange={(e) => setRenderAsImage(e.target.checked)}
              className="mt-1 h-4 w-4 shrink-0 rounded border-white/20 bg-brand-deep text-brand-amber"
            />
            <span>
              <span className="font-medium text-brand-cream">
                Static image for TVs (recommended)
              </span>
              <span className="mt-1 block text-brand-muted">
                Exports a full-page JPEG to your CDN — fast and stable on browsers.
                Turn off to generate a 10s MP4 instead (heavier; may use Mux).
              </span>
            </span>
          </label>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void saveAndRender()}
              disabled={phase === "saving" || phase === "rendering"}
              className="min-h-11 w-full rounded-lg bg-brand-amber px-4 py-2 text-sm font-semibold text-brand-deep hover:bg-brand-amber-bright disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {phase === "saving"
                ? "Saving…"
                : phase === "rendering"
                  ? renderAsImage
                    ? "Publishing image…"
                    : "Encoding video…"
                  : renderAsImage
                    ? "Save & publish image"
                    : "Save & encode video"}
            </button>
          </div>
          {phase === "done" && (
            <p className="text-sm text-brand-text" role="status">
              ✓ Saved and published. Screens using this menu pick up the update
              within ~10 seconds.
              {mediaId && (
                <>
                  {" "}
                  Media ID <code className="text-brand-amber">{mediaId}</code>.
                </>
              )}
            </p>
          )}
          {phase === "rendering" && jobStatus && (
            <p className="text-sm text-brand-text" role="status">
              {renderAsImage
                ? "Capturing menu image… (usually 10–30s)"
                : "Encoding video… (usually 30–60s)"}
            </p>
          )}
          {jobErr && <p className="text-sm text-red-400">{jobErr}</p>}

          <div className="border-t border-white/10 pt-6">
            <p className="text-xs font-medium uppercase tracking-wide text-brand-muted">
              Danger zone
            </p>
            <button
              type="button"
              disabled={deleting}
              onClick={() => void deleteMenu()}
              className="mt-3 min-h-11 w-full rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              {deleting ? "Deleting…" : "Delete this menu"}
            </button>
          </div>
        </div>

        <div className="min-w-0">
          {!previewReady ? (
            <div
              className="aspect-video animate-pulse rounded-xl bg-white/5"
              aria-hidden
            />
          ) : previewLg ? (
            <ChalkPreviewPanel
              previewHtml={previewHtml}
              onRefresh={refreshPreview}
            />
          ) : (
            <details
              className="group rounded-xl border border-white/10 bg-brand-warm/30 p-4 open:border-brand-amber/25"
              onToggle={(e) =>
                setMobilePreviewOpen((e.target as HTMLDetailsElement).open)
              }
            >
              <summary className="cursor-pointer list-none text-sm font-medium text-brand-cream">
                <span className="flex items-center justify-between gap-2">
                  Chalkboard preview
                  <span className="text-xs font-normal text-brand-muted group-open:hidden">
                    Show
                  </span>
                  <span className="hidden text-xs font-normal text-brand-muted group-open:inline">
                    Hide
                  </span>
                </span>
              </summary>
              {mobilePreviewOpen ? (
                <div className="mt-4">
                  <ChalkPreviewPanel
                    previewHtml={previewHtml}
                    onRefresh={refreshPreview}
                  />
                </div>
              ) : null}
            </details>
          )}
        </div>
      </div>
    </div>
  );
}
