import { ImageResponse } from "next/og";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0F4C81",
          color: "#F5F8FB",
          fontSize: 116,
          fontWeight: 700,
        }}
      >
        !
      </div>
    ),
    { width: 192, height: 192 }
  );
}
