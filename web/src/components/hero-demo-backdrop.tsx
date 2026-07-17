"use client";

import { useEffect, useState } from "react";

function iframeSrcWithCover(embedUrl: string): string {
  try {
    const u = new URL(embedUrl);
    u.searchParams.set("fit", "cover");
    return u.toString();
  } catch {
    const sep = embedUrl.includes("?") ? "&" : "?";
    return `${embedUrl}${sep}fit=cover`;
  }
}

/**
 * Full-bleed live demo player as a dimmed hero backdrop (same feed as /demo).
 */
export function HeroDemoBackdrop({ embedUrl }: { embedUrl: string }) {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mq.matches);
    const onChange = () => setReduceMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  if (reduceMotion) {
    return (
      <div
        className="absolute inset-0 bg-gradient-to-br from-brand-deep via-brand-bar to-brand-warm"
        aria-hidden
      />
    );
  }

  const src = iframeSrcWithCover(embedUrl);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <iframe
        title=""
        src={src}
        tabIndex={-1}
        className="hero-demo-video absolute left-1/2 top-1/2 h-[56.25vw] min-h-full w-full min-w-[177.78vh] border-0"
        allow="autoplay; encrypted-media"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  );
}
