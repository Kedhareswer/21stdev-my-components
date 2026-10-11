"use client"

import AstroNavbar from "@/components/ui/astro-navbar"

// The bar sticks while the page scrolls; its links underline the section in view.
export default function Demo() {
  return (
    <div className="w-full" style={{ background: "#060821" }}>
      <AstroNavbar defaultTheme="dark" />
      {["mission", "projects", "nights", "join"].map((id, i) => (
        <section
          key={id}
          id={id}
          style={{
            height: 460,
            margin: "18px clamp(12px,3vw,40px)",
            display: "grid",
            placeItems: "center",
            borderRadius: 26,
            background:
              "radial-gradient(circle at " + (20 + i * 22) + "% 40%, #41ef96 0 34px, transparent 35px), radial-gradient(circle at " +
              (70 - i * 12) + "% 62%, #12d0ff 0 52px, transparent 53px), radial-gradient(circle at " + (45 + i * 8) +
              "% 20%, #b5c3ff 0 22px, transparent 23px), #2f47ff",
            color: "#ffffff",
            fontFamily: "Poppins, ui-sans-serif, system-ui, sans-serif",
            fontWeight: 800,
            fontSize: "clamp(40px,9vw,120px)",
            letterSpacing: "-.03em",
            textTransform: "uppercase",
          }}
        >
          {id}
        </section>
      ))}
    </div>
  )
}
