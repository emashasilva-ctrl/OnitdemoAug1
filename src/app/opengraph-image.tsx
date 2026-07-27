import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#14181C",
          padding: 80,
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 108,
            fontWeight: 600,
            color: "#F5F8FB",
            letterSpacing: "-0.02em",
          }}
        >
          On It<span style={{ color: "#4A8FC2" }}>!</span>
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 24,
            fontSize: 36,
            color: "#9BA4AA",
            textAlign: "center",
          }}
        >
          Colombo&apos;s concierge, on demand.
        </div>
      </div>
    ),
    { ...size }
  );
}
