/**
 * Shared mark for generated PWA icons (ImageResponse / Satori).
 * Concept 02 — Screen Pulse colors.
 */
export const PWA_DEEP = "#0D0806";
export const PWA_AMBER = "#FFAA00";

export function PwaMarkIcon({ box }: { box: number }) {
  const r = Math.round(box * 0.2);
  const inset = Math.round(box * 0.12);
  return (
    <div
      style={{
        width: box,
        height: box,
        borderRadius: r,
        background: PWA_DEEP,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: `3px solid ${PWA_AMBER}`,
      }}
    >
      <div
        style={{
          fontSize: Math.round(box * 0.42),
          fontWeight: 800,
          color: PWA_AMBER,
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
          lineHeight: 1,
          paddingTop: inset / 4,
        }}
      >
        K
      </div>
    </div>
  );
}
