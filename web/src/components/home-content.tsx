"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { DisplayPlayer } from "@/components/display-player";
import { Landing } from "@/components/landing";

export function HomeContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [storedToken, setStoredToken] = useState<string | null>(null);

  useEffect(() => {
    if (!pathname.startsWith("/display/")) return;
    const slug = pathname.replace(/^\/display\//, "").split("/")[0] || "";
    if (!slug) return;
    const q = searchParams.get("token");
    if (q) {
      localStorage.setItem(`kemisdisplay_token_${slug}`, q);
      setStoredToken(q);
    } else {
      setStoredToken(localStorage.getItem(`kemisdisplay_token_${slug}`));
    }
  }, [pathname, searchParams]);

  if (pathname.startsWith("/display/")) {
    const slug = decodeURIComponent(
      pathname.replace(/^\/display\//, "").split("/")[0] || "",
    );
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

  return <Landing />;
}
