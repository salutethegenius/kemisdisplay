"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { apiUrl } from "@/lib/api";

type Item = { type: string; url: string; duration_seconds: number };

// 10s poll: a "save and look at the TV" workflow needs to feel near-instant.
// Each poll is one cheap GET; even at scale this is trivial.
const POLL_MS = 10_000;
const LS_KEY = (slug: string) => `kemisdisplay_playlist_${slug}`;

/** Stable signature so poll compares playlist content, not only version string. */
function playlistSignature(items: Item[]): string {
  return JSON.stringify(
    items.map((x) => ({
      t: x.type,
      u: x.url,
      d: x.duration_seconds,
    })),
  );
}

function clearPlaylistCache(slug: string) {
  try {
    localStorage.removeItem(LS_KEY(slug));
  } catch {
    /* ignore */
  }
}

export function DisplayPlayer({ slug, token }: { slug: string; token: string }) {
  const [items, setItems] = useState<Item[]>([]);
  const [idx, setIdx] = useState(0);
  const [version, setVersion] = useState<string | null>(null);
  const [fade, setFade] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  /** Avoid restarting the same clip when deps churn but idx/url are unchanged (fixes periodic flash). */
  const lastVideoSlideIdentityRef = useRef<string>("");
  const itemsRef = useRef<Item[]>([]);
  const idxRef = useRef(0);
  const versionRef = useRef<string | null>(null);
  itemsRef.current = items;
  idxRef.current = idx;
  versionRef.current = version;

  const fetchPlaylist = useCallback(
    async (options?: { soft?: boolean }) => {
      const soft = options?.soft === true;
      const u = new URL(
        apiUrl(`/public/screens/${encodeURIComponent(slug)}/playlist`),
      );
      u.searchParams.set("token", token);
      let res: Response;
      try {
        res = await fetch(u.toString());
      } catch {
        if (!soft) {
          setErr(
            "Could not reach the API. Check NEXT_PUBLIC_API_URL and your network.",
          );
          setItems([]);
          setVersion(null);
          clearPlaylistCache(slug);
        }
        return null;
      }
      if (!res.ok) {
        if (!soft) {
          setErr("Invalid display or token.");
          setItems([]);
          setVersion(null);
          clearPlaylistCache(slug);
        }
        return null;
      }
      let data: { playlist_version: string; items: Item[] };
      try {
        data = (await res.json()) as {
          playlist_version: string;
          items: Item[];
        };
      } catch {
        if (!soft) {
          setErr("Invalid response from server.");
          setItems([]);
          setVersion(null);
          clearPlaylistCache(slug);
        }
        return null;
      }
      try {
        localStorage.setItem(
          LS_KEY(slug),
          JSON.stringify({ v: data.playlist_version, items: data.items }),
        );
      } catch {
        /* ignore quota */
      }
      return data;
    },
    [slug, token],
  );

  useEffect(() => {
    lastVideoSlideIdentityRef.current = "";
    void (async () => {
      setLoading(true);
      setErr(null);
      const data = await fetchPlaylist();
      setLoading(false);
      if (data) {
        setVersion(data.playlist_version);
        setItems(data.items);
        setIdx(0);
        setErr(null);
      }
    })();
  }, [slug, token, fetchPlaylist]);

  useEffect(() => {
    const id = setInterval(() => {
      void (async () => {
        const data = await fetchPlaylist({ soft: true });
        if (!data) return;
        const incomingSig = playlistSignature(data.items);
        const currentSig = playlistSignature(itemsRef.current);
        if (incomingSig === currentSig) {
          // Same playlist: update ref only — avoid setState every POLL_MS (was causing ~10s TV flash).
          versionRef.current = data.playlist_version;
          return;
        }
        setVersion(data.playlist_version);
        setItems(data.items);
        setIdx(0);
      })();
    }, POLL_MS);
    return () => clearInterval(id);
  }, [fetchPlaylist]);

  useEffect(() => {
    let wl: WakeLockSentinel | null = null;
    const req = async () => {
      try {
        if ("wakeLock" in navigator) {
          wl = await navigator.wakeLock.request("screen");
        }
      } catch {
        /* TV / iOS may refuse */
      }
    };
    void req();
    const onVis = () => {
      if (document.visibilityState === "visible") void req();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      void wl?.release();
    };
  }, []);

  const item = items[idx] ?? null;

  const advance = useCallback(() => {
    setFade(false);
    setTimeout(() => {
      setIdx((i) => (items.length ? (i + 1) % items.length : 0));
      setFade(true);
    }, 400);
  }, [items.length]);

  const onMediaFailed = useCallback(() => {
    const i = idxRef.current;
    const prev = itemsRef.current;
    if (i < 0 || i >= prev.length) return;
    const next = prev.filter((_, j) => j !== i);
    const newIdx =
      next.length === 0 ? 0 : Math.min(i, next.length - 1);
    setItems(next);
    setIdx(newIdx);
    if (next.length === 0) {
      setErr(
        "No playlist media could be loaded. Check file URLs, R2 CORS, and formats (use MP4 for TVs).",
      );
      clearPlaylistCache(slug);
    }
  }, [slug]);

  const singleItem = items.length === 1;

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!item) return;

    if (item.type === "video") {
      const slideIdentity = `${idx}|${item.url}`;
      const sameSlide = lastVideoSlideIdentityRef.current === slideIdentity;
      const v = videoRef.current;
      if (v) {
        if (!sameSlide) {
          lastVideoSlideIdentityRef.current = slideIdentity;
          v.currentTime = 0;
        }
        void v.play().catch(() => {});
      }
      // Single video item: let the <video loop> attribute handle continuous playback.
      if (singleItem) {
        return;
      }
      const capMs = Math.min(item.duration_seconds, 300) * 1000;
      timerRef.current = setTimeout(() => advance(), capMs);
      return () => {
        if (timerRef.current) clearTimeout(timerRef.current);
      };
    }

    // Single image item: no timer — it just stays.
    if (singleItem) return;

    timerRef.current = setTimeout(
      () => advance(),
      item.duration_seconds * 1000,
    );
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [item, advance, singleItem, items.length, idx]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-zinc-400">
        Loading playlist…
      </div>
    );
  }

  if (err && items.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-black px-6 text-center">
        <p className="text-red-400">{err}</p>
        <p className="max-w-md text-sm text-zinc-500">
          If you changed API or media URLs, clear site data for this origin and
          reload. Stale playlist cache could point at old hosts.
        </p>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-zinc-500">
        No playlist items. Add media in the dashboard.
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black">
      <div
        className={`h-full w-full transition-opacity duration-500 ${
          fade ? "opacity-100" : "opacity-0"
        }`}
      >
        {item.type === "video" ? (
          <video
            ref={videoRef}
            key={item.url + idx}
            src={item.url}
            className="h-full w-full object-contain"
            muted
            playsInline
            loop={singleItem}
            onError={onMediaFailed}
            onEnded={() => {
              if (singleItem) return;
              if (timerRef.current) {
                clearTimeout(timerRef.current);
                timerRef.current = null;
              }
              advance();
            }}
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={item.url + idx}
            src={item.url}
            alt=""
            className="h-full w-full object-contain"
            onError={onMediaFailed}
          />
        )}
      </div>
    </div>
  );
}
