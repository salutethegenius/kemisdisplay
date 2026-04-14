"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { apiUrl } from "@/lib/api";

type Item = { type: string; url: string; duration_seconds: number };

const POLL_MS = 60_000;
const LS_KEY = (slug: string) => `kemisdisplay_playlist_${slug}`;

export function DisplayPlayer({ slug, token }: { slug: string; token: string }) {
  const [items, setItems] = useState<Item[]>([]);
  const [idx, setIdx] = useState(0);
  const [version, setVersion] = useState<string | null>(null);
  const [fade, setFade] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const fetchPlaylist = useCallback(async () => {
    const u = new URL(
      apiUrl(`/public/screens/${encodeURIComponent(slug)}/playlist`),
    );
    u.searchParams.set("token", token);
    const res = await fetch(u.toString());
    if (!res.ok) {
      setErr("Invalid display or token.");
      return null;
    }
    const data = (await res.json()) as {
      playlist_version: string;
      items: Item[];
    };
    try {
      localStorage.setItem(
        LS_KEY(slug),
        JSON.stringify({ v: data.playlist_version, items: data.items }),
      );
    } catch {
      /* ignore quota */
    }
    return data;
  }, [slug, token]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(LS_KEY(slug));
      if (raw) {
        const parsed = JSON.parse(raw) as { v: string; items: Item[] };
        if (parsed.items?.length) {
          setItems(parsed.items);
          setVersion(parsed.v);
        }
      }
    } catch {
      /* ignore */
    }
    void (async () => {
      const data = await fetchPlaylist();
      if (data) {
        setVersion(data.playlist_version);
        setItems(data.items);
        setErr(null);
      }
    })();
  }, [slug, token, fetchPlaylist]);

  useEffect(() => {
    const id = setInterval(() => {
      void (async () => {
        const data = await fetchPlaylist();
        if (!data) return;
        if (data.playlist_version !== version) {
          setVersion(data.playlist_version);
          setItems(data.items);
          setIdx(0);
        }
      })();
    }, POLL_MS);
    return () => clearInterval(id);
  }, [fetchPlaylist, version]);

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

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!item) return;

    if (item.type === "video") {
      const v = videoRef.current;
      if (v) {
        v.currentTime = 0;
        void v.play().catch(() => {});
      }
      const capMs = Math.min(item.duration_seconds, 300) * 1000;
      timerRef.current = setTimeout(() => advance(), capMs);
      return () => {
        if (timerRef.current) clearTimeout(timerRef.current);
      };
    }

    timerRef.current = setTimeout(
      () => advance(),
      item.duration_seconds * 1000,
    );
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [item, advance]);

  if (err && items.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-red-400">
        {err}
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
            loop={false}
            onEnded={() => {
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
          />
        )}
      </div>
    </div>
  );
}
