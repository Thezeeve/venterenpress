import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/site";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          height: "100%",
          width: "100%",
          background: "linear-gradient(135deg, #0f1728, #b42318)",
          color: "white",
          padding: "64px",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <div style={{ fontSize: 28, letterSpacing: 8, textTransform: "uppercase" }}>{siteConfig.name}</div>
        <div style={{ fontSize: 72, fontWeight: 700, lineHeight: 1.1, maxWidth: 900 }}>
          Premium global journalism, live coverage, and newsroom-grade publishing.
        </div>
      </div>
    ),
    size,
  );
}
