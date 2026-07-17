import { ImageResponse } from "next/og";

/** Concept 02 — Screen Pulse (kemisdisplay-brand-identity.html) */
const C2_DEEP = "#0D0806";
const C2_WARM = "#1A1410";
const C2_AMBER = "#FFAA00";
const C2_VIOLET = "#7B61FF";
const C2_CREAM = "#FFF6E8";

export const runtime = "edge";

export const alt =
  "KemisDisplay — turn any TV into a revenue screen. No hardware. No headaches.";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function TwitterImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "row",
          alignItems: "stretch",
          background: `linear-gradient(135deg, ${C2_DEEP} 0%, ${C2_WARM} 42%, ${C2_DEEP} 100%)`,
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
        }}
      >
        {/* Amber hairline — matches .mark-stage-c2 border */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            margin: 48,
            borderRadius: 28,
            border: `1px solid rgba(255, 170, 0, 0.12)`,
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "72px 64px 72px 80px",
            maxWidth: 720,
          }}
        >
          <div
            style={{
              fontSize: 11,
              letterSpacing: "0.28em",
              textTransform: "uppercase" as const,
              color: C2_AMBER,
              fontWeight: 700,
              marginBottom: 28,
            }}
          >
            KemisDisplay
          </div>
          <div
            style={{
              fontSize: 52,
              fontWeight: 800,
              lineHeight: 1.08,
              letterSpacing: "-0.03em",
              color: C2_CREAM,
              marginBottom: 20,
            }}
          >
            Turn any TV into a revenue screen.
          </div>
          <div
            style={{
              fontSize: 34,
              fontWeight: 700,
              color: C2_AMBER,
              marginBottom: 28,
            }}
          >
            No hardware. No headaches.
          </div>
          <div
            style={{
              fontSize: 22,
              lineHeight: 1.5,
              color: "rgba(200, 206, 223, 0.95)",
              maxWidth: 560,
            }}
          >
            Upload menus, promos, or videos — publish once, update every screen
            instantly.
          </div>
          <div
            style={{
              marginTop: 36,
              fontSize: 17,
              fontWeight: 600,
              color: C2_CREAM,
              opacity: 0.9,
            }}
          >
            14-day free trial · then $25/mo · up to 2 screens
          </div>
        </div>

        {/* Screen Pulse mark — simplified frame + violet signal */}
        <div
          style={{
            width: 420,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            paddingRight: 72,
          }}
        >
          <div
            style={{
              position: "relative",
              width: 280,
              height: 200,
              borderRadius: 20,
              border: `3px solid ${C2_AMBER}`,
              background: "rgba(255, 170, 0, 0.06)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: 220,
                height: 140,
                borderRadius: 14,
                background: "rgba(255, 170, 0, 0.1)",
              }}
            />
            <div
              style={{
                position: "absolute",
                bottom: -36,
                left: "50%",
                marginLeft: -6,
                width: 12,
                height: 12,
                borderRadius: 6,
                background: C2_VIOLET,
              }}
            />
            <div
              style={{
                position: "absolute",
                bottom: -48,
                left: "50%",
                marginLeft: -16,
                width: 32,
                height: 32,
                borderRadius: 16,
                border: `1.5px solid ${C2_VIOLET}`,
                opacity: 0.45,
              }}
            />
            <div
              style={{
                position: "absolute",
                bottom: -58,
                left: "50%",
                marginLeft: -26,
                width: 52,
                height: 52,
                borderRadius: 26,
                border: `1px solid ${C2_VIOLET}`,
                opacity: 0.22,
              }}
            />
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
