"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { DisplayPlayer } from "@/components/display-player";

export function DisplayClient() {
  const params = useParams();
  const searchParams = useSearchParams();
  const raw = params.slug;
  const first = Array.isArray(raw) ? raw[0] : raw;
  const slug = decodeURIComponent(first || "");
  const [storedToken, setStoredToken] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    const q = searchParams.get("token");
    if (q) {
      localStorage.setItem(`kemisdisplay_token_${slug}`, q);
      setStoredToken(q);
    } else {
      setStoredToken(localStorage.getItem(`kemisdisplay_token_${slug}`));
    }
  }, [slug, searchParams]);

  const token = searchParams.get("token") || storedToken || "";

  if (slug && token) {
    return <DisplayPlayer slug={slug} token={token} />;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-2 bg-black px-6 text-center text-zinc-400">
      <p>Missing display token.</p>
      <p className="text-sm">
        Open the full URL from your KemisDisplay dashboard (includes ?token=…).
      </p>
    </div>
  );
}
