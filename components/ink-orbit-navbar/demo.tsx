"use client"

import InkOrbitNavbar from "@/components/ui/ink-orbit-navbar"

// The bar sticks while the page scrolls, and its caret follows the section in view.
export default function Demo() {
  return (
    <div
      className="w-full"
      style={{
        background: "#0b0b0b",
        backgroundImage: "repeating-linear-gradient(135deg,rgba(255,255,255,.05) 0 1px,transparent 1px 10px)",
      }}
    >
      <InkOrbitNavbar theme="dark" />
      {["home", "features", "testimonials", "pricing", "about"].map((id) => (
        <section
          key={id}
          id={id}
          style={{
            height: 420,
            margin: "18px clamp(10px,2.4vw,28px)",
            display: "grid",
            placeItems: "center",
            border: "1px solid #262626",
            background: "#121212",
            color: "#5d5d5d",
            fontFamily: "ui-monospace, monospace",
            fontSize: 12,
            letterSpacing: ".08em",
            textTransform: "uppercase",
          }}
        >
          {id}
        </section>
      ))}
    </div>
  )
}
