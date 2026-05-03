"use client";

/**
 * Cropped SVG viewBox "21 29 102 68"; inner glass in original user units.
 */
const VIEWBOX = { x: 21, y: 29, w: 102, h: 68 } as const;
const INNER_GLASS = { x: 29.611, y: 39.109, w: 85.934, h: 44.924 } as const;

const SCREEN = {
  left: ((INNER_GLASS.x - VIEWBOX.x) / VIEWBOX.w) * 100,
  top: ((INNER_GLASS.y - VIEWBOX.y) / VIEWBOX.h) * 100,
  w: (INNER_GLASS.w / VIEWBOX.w) * 100,
  h: (INNER_GLASS.h / VIEWBOX.h) * 100,
} as const;

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

export function DemoLiveTv({ embedUrl }: { embedUrl: string }) {
  const playerSrc = iframeSrcWithCover(embedUrl);

  return (
    <div className="relative mx-auto aspect-[102/68] w-full max-w-[min(calc(100vw-2rem),22rem)] sm:max-w-[min(92vw,30rem)] md:max-w-[min(90vw,42rem)] lg:max-w-[min(88vw,50rem)] xl:max-w-[min(85vw,56rem)] 2xl:max-w-[min(82vw,60rem)]">
      {/* eslint-disable-next-line @next/next/no-img-element -- local marketing SVG */}
      <img
        src="/marketing/flatscreen-tv.svg"
        alt=""
        className="pointer-events-none absolute inset-0 z-0 h-full w-full object-contain"
        aria-hidden
      />
      <div
        className="absolute z-10 overflow-hidden rounded-[0.2em] bg-black shadow-[inset_0_0_12px_rgba(0,0,0,0.85)]"
        style={{
          left: `${SCREEN.left}%`,
          top: `${SCREEN.top}%`,
          width: `${SCREEN.w}%`,
          height: `${SCREEN.h}%`,
        }}
      >
        <iframe
          title="KemisDisplay live demo — real screen player"
          src={playerSrc}
          className="h-full w-full border-0"
          loading="lazy"
          allow="fullscreen"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    </div>
  );
}
