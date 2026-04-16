import { ImageResponse } from "next/og";
import { PwaMarkIcon } from "@/lib/pwa-mark";

export const runtime = "edge";

export async function GET() {
  const size = 512;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0D0806",
        }}
      >
        <PwaMarkIcon box={380} />
      </div>
    ),
    { width: size, height: size },
  );
}
