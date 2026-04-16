import { ImageResponse } from "next/og";

export const runtime = "edge";

export const size = { width: 180, height: 180 };

export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0c0a09",
          borderRadius: 36,
        }}
      >
        <div
          style={{
            width: 120,
            height: 120,
            borderRadius: 28,
            border: "4px solid #FFAA00",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(255,170,0,0.1)",
            color: "#FFAA00",
            fontSize: 56,
            fontWeight: 800,
            fontFamily: "system-ui, sans-serif",
          }}
        >
          K
        </div>
      </div>
    ),
    { ...size },
  );
}
