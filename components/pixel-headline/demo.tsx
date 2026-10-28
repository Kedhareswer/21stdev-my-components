"use client"

import PixelHeadline from "@/components/ui/pixel-headline"

export default function Demo() {
  return (
    <div
      style={{
        width: "100%",
        minHeight: "100svh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 28,
        padding: "48px 24px",
        background: "radial-gradient(70% 55% at 50% 45%, #23242c, #070708 70%)",
      }}
    >
      <PixelHeadline lines={["Describe an app", "We'll build it"]} assemble="load" />
      <p style={{ margin: 0, color: "rgba(255,255,255,.6)", fontSize: 15 }}>Move the pointer across the letters.</p>
    </div>
  )
}
