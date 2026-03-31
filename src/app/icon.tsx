import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0f1623",
          borderRadius: 6,
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 800,
            color: "white",
            letterSpacing: -0.5,
          }}
        >
          HJC
        </span>
      </div>
    ),
    { ...size }
  );
}
