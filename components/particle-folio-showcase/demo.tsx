"use client"

import * as React from "react"
import ParticleFolioShowcase, { type FolioItem } from "@/components/ui/particle-folio-showcase"

// Six portfolio covers, painted here at runtime so the demo ships no image
// files and makes no network requests. Every name and company is made up.
const W = 1280
const H = 880

type Ctx = CanvasRenderingContext2D

const HEAVY = '900 {px}px "Arial Black", "Helvetica Neue", Arial, sans-serif'
const MONO = '700 {px}px "Courier New", ui-monospace, monospace'
const font = (tpl: string, px: number) => tpl.replace("{px}", String(px))

function spaced(c: Ctx, v: string) {
  ;(c as Ctx & { letterSpacing?: string }).letterSpacing = v
}

function navBar(c: Ctx, ink: string, label: string) {
  c.fillStyle = ink
  c.globalAlpha = 0.75
  c.font = "600 22px Arial, sans-serif"
  c.fillText(label, 60, 70)
  c.font = "500 18px Arial, sans-serif"
  ;["Work", "About", "Contact"].forEach((t, i) => c.fillText(t, W - 330 + i * 100, 70))
  c.globalAlpha = 1
}

const COVERS: { item: Omit<FolioItem, "src">; paint: (c: Ctx) => void }[] = [
  {
    item: {
      name: "Anaya Mehra",
      country: "India",
      role: "Lead Visual Designer",
      style: "Creative",
      experience: "5 years",
      accent: "#f59e0b",
      companies: [
        { name: "Northwind", color: "#0ea5e9" },
        { name: "Kiln Studio", color: "#111111" },
      ],
      alt: "A white poster reading Hey, I'm Anaya, Graphic Designer, with a yellow sticker",
    },
    paint: (c) => {
      c.fillStyle = "#f4f3ef"
      c.fillRect(0, 0, W, H)
      navBar(c, "#111", "anaya.studio")
      c.fillStyle = "#111"
      c.textAlign = "center"
      c.font = font(HEAVY, 92)
      spaced(c, "-3px")
      c.fillText("Hey, I'm Anaya", W / 2, 330)
      c.fillStyle = "#ffd60a"
      c.fillRect(250, 380, 780, 140)
      c.fillStyle = "#111"
      c.font = font(HEAVY, 108)
      c.fillText("GRAPHIC", W / 2, 490)
      c.font = font(HEAVY, 108)
      c.fillText("DESIGNER", W / 2, 620)
      spaced(c, "0px")
      c.save()
      c.translate(980, 700)
      c.rotate(-0.14)
      c.fillStyle = "#111"
      c.fillRect(-110, -60, 220, 120)
      c.fillStyle = "#fff"
      c.font = "italic 900 62px Georgia, serif"
      c.fillText("That", 0, 20)
      c.restore()
      c.textAlign = "left"
    },
  },
  {
    item: {
      name: "Rohan Varghese",
      country: "India",
      role: "Product Design Engineer",
      style: "Interactive",
      experience: "2 years",
      accent: "#16a34a",
      companies: [{ name: "Orbit", color: "#1f2937" }],
      alt: "A yellow poster with the name Rohan Varghese beside a dark portrait silhouette",
    },
    paint: (c) => {
      c.fillStyle = "#f5d547"
      c.fillRect(0, 0, W, H)
      navBar(c, "#1a1a1a", "RV")
      c.fillStyle = "#1a1a1a"
      c.font = font(HEAVY, 150)
      spaced(c, "-6px")
      c.fillText("ROHAN", 60, 380)
      c.fillText("VARGHESE", 60, 530)
      spaced(c, "0px")
      c.font = "500 26px Arial, sans-serif"
      c.fillText("Designer who ships code.", 66, 610)
      // portrait silhouette, cut off by the right edge
      c.fillStyle = "#26231d"
      c.beginPath()
      c.ellipse(1010, 360, 140, 170, 0, 0, Math.PI * 2)
      c.fill()
      c.beginPath()
      c.moveTo(760, H)
      c.bezierCurveTo(780, 620, 880, 560, 1010, 560)
      c.bezierCurveTo(1140, 560, 1240, 620, 1260, H)
      c.fill()
      c.fillStyle = "#3b362c"
      c.beginPath()
      c.ellipse(960, 320, 40, 60, -0.4, 0, Math.PI * 2)
      c.fill()
    },
  },
  {
    item: {
      name: "Ishaan Kapoor",
      country: "India",
      role: "Senior Product Designer",
      style: "Interactive",
      experience: "6 years",
      accent: "#0ea5e9",
      companies: [
        { name: "Lumen", color: "#7c3aed" },
        { name: "Parcel", color: "#ef4444" },
        { name: "Tandem", color: "#0f766e" },
      ],
      alt: "A sunset sky over a sea of clouds with the line Not your usual case study",
    },
    paint: (c) => {
      const g = c.createLinearGradient(0, 0, 0, H)
      g.addColorStop(0, "#1d3d8f")
      g.addColorStop(0.45, "#e7809a")
      g.addColorStop(0.7, "#ffbf75")
      g.addColorStop(1, "#ffe6b0")
      c.fillStyle = g
      c.fillRect(0, 0, W, H)
      c.fillStyle = "#fff4d9"
      c.beginPath()
      c.arc(860, 560, 70, 0, Math.PI * 2)
      c.fill()
      // cloud bank
      let seed = 3
      const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
      for (let layer = 0; layer < 3; layer++) {
        c.fillStyle = ["#f6c6c4", "#fbe1d6", "#fff3ea"][layer]
        for (let i = 0; i < 26; i++) {
          const x = rnd() * W
          const y = 620 + layer * 70 + rnd() * 50
          c.beginPath()
          c.ellipse(x, y, 90 + rnd() * 120, 40 + rnd() * 30, 0, 0, Math.PI * 2)
          c.fill()
        }
      }
      c.fillStyle = "#fff"
      c.textAlign = "center"
      c.font = "italic 400 64px Georgia, serif"
      c.fillText("Not your usual", W / 2, 300)
      c.font = "italic 400 64px Georgia, serif"
      c.fillText("case study.", W / 2, 380)
      c.font = "600 22px Arial, sans-serif"
      c.globalAlpha = 0.8
      c.fillText("SCROLL TO BEGIN ↓", W / 2, 450)
      c.globalAlpha = 1
      c.textAlign = "left"
    },
  },
  {
    item: {
      name: "Sana Qureshi",
      country: "India",
      role: "UX Researcher",
      style: "Minimal",
      experience: "3 years",
      accent: "#a855f7",
      companies: [
        { name: "Northwind", color: "#0ea5e9" },
        { name: "Orbit", color: "#1f2937" },
      ],
      alt: "Bold outlined white letters reading Product Researcher on deep violet",
    },
    paint: (c) => {
      c.fillStyle = "#1c1340"
      c.fillRect(0, 0, W, H)
      c.strokeStyle = "rgba(255,255,255,0.08)"
      c.lineWidth = 2
      for (let x = 0; x < W; x += 64) {
        c.beginPath()
        c.moveTo(x, 0)
        c.lineTo(x, H)
        c.stroke()
      }
      navBar(c, "#fff", "sana/q")
      c.font = font(HEAVY, 170)
      spaced(c, "-4px")
      c.lineWidth = 6
      c.strokeStyle = "#fff"
      c.strokeText("PRODUCT", 60, 430)
      c.fillStyle = "#fff"
      c.fillText("RESEARCHER", 60, 610)
      spaced(c, "0px")
      c.fillStyle = "#c4b5fd"
      c.font = font(MONO, 26)
      c.fillText("// 40+ interviews · 12 studies · 3 launches", 66, 690)
    },
  },
  {
    item: {
      name: "Kabir Sethi",
      country: "India",
      role: "Brand Designer",
      style: "Experimental",
      experience: "4 years",
      accent: "#525252",
      companies: [
        { name: "Kiln Studio", color: "#111111" },
        { name: "Lumen", color: "#7c3aed" },
      ],
      alt: "White words Beyond Visuals on black, split by a grey square",
    },
    paint: (c) => {
      c.fillStyle = "#0b0b0b"
      c.fillRect(0, 0, W, H)
      navBar(c, "#fff", "KABIR SETHI")
      c.fillStyle = "#f2f2f2"
      c.font = font(HEAVY, 130)
      spaced(c, "-2px")
      c.fillText("BEYOND", 60, 520)
      c.textAlign = "right"
      c.fillText("VISUALS", W - 60, 520)
      c.textAlign = "left"
      spaced(c, "0px")
      const g = c.createLinearGradient(560, 300, 720, 620)
      g.addColorStop(0, "#9b9b9b")
      g.addColorStop(1, "#4a4a4a")
      c.fillStyle = g
      c.fillRect(560, 300, 160, 280)
      c.fillStyle = "#777"
      c.font = "500 22px Arial, sans-serif"
      c.fillText("Selected work 2021—2026", 60, 800)
    },
  },
  {
    item: {
      name: "Tara Iyer",
      country: "India",
      role: "Visual & Communication Designer",
      style: "Interactive",
      experience: "Less than 1 year",
      accent: "#e11d48",
      companies: [
        { name: "Parcel", color: "#ef4444" },
        { name: "Tandem", color: "#0f766e" },
      ],
      alt: "A beige page titled My Vault with a pinned photo of a clock tower",
    },
    paint: (c) => {
      c.fillStyle = "#efe6d6"
      c.fillRect(0, 0, W, H)
      c.fillStyle = "#1b1b1b"
      c.font = font(MONO, 110)
      c.textAlign = "center"
      c.fillText("My Vault _", W / 2, 190)
      c.textAlign = "left"
      // a photo: sky, a clock tower and a spire
      c.save()
      c.translate(W / 2, 540)
      c.rotate(-0.02)
      c.fillStyle = "#fff"
      c.fillRect(-430, -250, 860, 520)
      const sky = c.createLinearGradient(0, -230, 0, 250)
      sky.addColorStop(0, "#6f9fcf")
      sky.addColorStop(1, "#d8e4ec")
      c.fillStyle = sky
      c.fillRect(-410, -230, 820, 480)
      c.fillStyle = "#7a4a33"
      c.fillRect(-90, -120, 140, 370)
      c.beginPath()
      c.moveTo(-100, -120)
      c.lineTo(-20, -220)
      c.lineTo(60, -120)
      c.fill()
      c.fillStyle = "#f3efe6"
      c.beginPath()
      c.arc(-20, -60, 34, 0, Math.PI * 2)
      c.fill()
      c.strokeStyle = "#222"
      c.lineWidth = 4
      c.beginPath()
      c.moveTo(-20, -60)
      c.lineTo(-20, -84)
      c.moveTo(-20, -60)
      c.lineTo(-2, -52)
      c.stroke()
      c.fillStyle = "#3f4a52"
      c.fillRect(200, 40, 18, 210)
      c.beginPath()
      c.moveTo(194, 40)
      c.lineTo(209, -170)
      c.lineTo(224, 40)
      c.fill()
      c.fillStyle = "#5d6b55"
      c.fillRect(-410, 170, 820, 80)
      c.restore()
      // a little sticker in the corner
      c.save()
      c.translate(1060, 300)
      c.rotate(0.12)
      c.fillStyle = "#fff"
      c.fillRect(-90, -90, 180, 180)
      c.fillStyle = "#1b1b1b"
      c.font = font(MONO, 22)
      c.textAlign = "center"
      c.fillText("TARA.", 0, 0)
      c.fillText("visuals", 0, 30)
      c.restore()
      c.textAlign = "left"
    },
  },
]

function paintCovers(): FolioItem[] {
  const canvas = document.createElement("canvas")
  canvas.width = W
  canvas.height = H
  const c = canvas.getContext("2d")
  if (!c) return []
  return COVERS.map(({ item, paint }) => {
    c.setTransform(1, 0, 0, 1, 0, 0)
    c.textAlign = "left"
    c.textBaseline = "alphabetic"
    paint(c)
    return { ...item, src: canvas.toDataURL("image/jpeg", 0.9) }
  })
}

export default function Demo() {
  const [items, setItems] = React.useState([] as FolioItem[])
  React.useEffect(() => setItems(paintCovers()), [])
  return (
    // w-full: 21st centres demos in a flex wrapper that would shrink this to 0px.
    <div className="relative w-full">
      <ParticleFolioShowcase items={items} autoplay={5200} initialIndex={5} />
    </div>
  )
}
