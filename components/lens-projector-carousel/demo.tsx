"use client"

import * as React from "react"
import LensProjectorCarousel, { type ProjectorItem } from "@/components/ui/lens-projector-carousel"

// Five film stills, painted here at runtime so the demo ships no image files
// and makes no network requests. Flat light and dark shapes, because that is
// what survives being projected through a cone.
const W = 1600
const H = 1000
const TAU = Math.PI * 2

type Ctx = CanvasRenderingContext2D

function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function vertical(c: Ctx, stops: [number, string][]) {
  const g = c.createLinearGradient(0, 0, 0, H)
  for (const [at, col] of stops) g.addColorStop(at, col)
  c.fillStyle = g
  c.fillRect(0, 0, W, H)
}

function disc(c: Ctx, x: number, y: number, r: number, fill: string) {
  c.fillStyle = fill
  c.beginPath()
  c.arc(x, y, r, 0, TAU)
  c.fill()
}

// A standing figure, feet at (x, y), h tall. `fist` raises the far arm.
function stand(c: Ctx, x: number, y: number, h: number, fill: string, fist = false) {
  const w = h * 0.14
  c.fillStyle = fill
  c.strokeStyle = fill
  c.lineCap = "round"
  disc(c, x, y - h * 0.9, h * 0.072, fill)
  c.fillRect(x - w * 0.22, y - h * 0.84, w * 0.44, h * 0.06)
  c.beginPath()
  c.moveTo(x - w * 1.1, y - h * 0.79)
  c.quadraticCurveTo(x, y - h * 0.85, x + w * 1.1, y - h * 0.79)
  c.lineTo(x + w * 0.8, y - h * 0.46)
  c.lineTo(x - w * 0.8, y - h * 0.46)
  c.closePath()
  c.fill()
  c.fillRect(x - w * 0.78, y - h * 0.47, w * 0.72, h * 0.47)
  c.fillRect(x + w * 0.06, y - h * 0.47, w * 0.72, h * 0.47)
  c.lineWidth = w * 0.55
  c.beginPath()
  c.moveTo(x - w * 1.05, y - h * 0.77)
  c.lineTo(x - w * 1.2, y - h * 0.5)
  c.moveTo(x + w * 1.05, y - h * 0.77)
  if (fist) c.lineTo(x + w * 1.45, y - h * 1.04)
  else c.lineTo(x + w * 1.2, y - h * 0.5)
  c.stroke()
}

// A seated figure facing `f` (1 right, -1 left), h being the standing height.
function sit(c: Ctx, x: number, y: number, h: number, fill: string, f = 1) {
  const w = h * 0.14
  c.fillStyle = fill
  c.strokeStyle = fill
  c.lineCap = "round"
  disc(c, x, y - h * 0.62, h * 0.072, fill)
  c.beginPath()
  c.moveTo(x - w * 1.05, y - h * 0.55)
  c.quadraticCurveTo(x, y - h * 0.6, x + w * 1.05, y - h * 0.55)
  c.lineTo(x + w * 0.8, y - h * 0.22)
  c.lineTo(x - w * 0.8, y - h * 0.22)
  c.closePath()
  c.fill()
  c.lineWidth = w * 0.7
  c.beginPath()
  c.moveTo(x, y - h * 0.24)
  c.lineTo(x + f * h * 0.26, y - h * 0.26)
  c.lineTo(x + f * h * 0.28, y)
  c.stroke()
  c.lineWidth = w * 0.5
  c.beginPath()
  c.moveTo(x, y - h * 0.5)
  c.lineTo(x + f * h * 0.16, y - h * 0.3)
  c.stroke()
}

// Film grain, dust and a burnt vignette over every still.
function develop(c: Ctx, seed: number) {
  const r = rng(seed)
  for (let i = 0; i < 9000; i++) {
    c.fillStyle = r() > 0.5 ? "rgba(255,240,210,0.07)" : "rgba(20,10,0,0.09)"
    c.fillRect(r() * W, r() * H, 1 + r() * 2.4, 1 + r() * 2.4)
  }
  for (let i = 0; i < 26; i++) {
    c.strokeStyle = "rgba(255,244,220,0.16)"
    c.lineWidth = 1
    c.beginPath()
    const x = r() * W
    const y = r() * H
    c.moveTo(x, y)
    c.lineTo(x + (r() - 0.5) * 90, y + (r() - 0.5) * 90)
    c.stroke()
  }
  const v = c.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.95)
  v.addColorStop(0, "rgba(0,0,0,0)")
  v.addColorStop(1, "rgba(15,6,0,0.55)")
  c.fillStyle = v
  c.fillRect(0, 0, W, H)
}

function realitySinks(c: Ctx) {
  vertical(c, [[0, "#b52a20"], [0.62, "#8c1a14"], [1, "#4a0d0a"]])
  const r = rng(11)
  // A kiln wall stepping down toward the viewer.
  for (let row = 0; row < 7; row++) {
    const y = 610 + row * 56
    for (let x = -60 + (row % 2) * 34; x < W; x += 68) {
      c.fillStyle = "hsl(" + (14 + r() * 8) + "," + (38 + r() * 12) + "%," + (26 + r() * 10 - row * 1.2) + "%)"
      c.fillRect(x, y, 64, 50)
    }
  }
  c.fillStyle = "rgba(20,8,4,0.45)"
  c.fillRect(0, 600, W, 14)
  // The crowd on the left, a dark mass.
  for (let i = 0; i < 26; i++) sit(c, 20 + i * 24, 690 + (i % 3) * 22, 330 + (i % 4) * 26, "#170d0a", 1)
  const lit = "#d9d0c0"
  sit(c, 700, 640, 360, lit, 1)
  stand(c, 900, 640, 330, lit)
  stand(c, 1040, 600, 380, lit, true)
  sit(c, 1220, 640, 350, lit, -1)
  stand(c, 1380, 640, 340, lit)
  sit(c, 1500, 650, 340, lit, -1)
  develop(c, 3)
}

function queueAtDawn(c: Ctx) {
  vertical(c, [[0, "#f6e2b0"], [0.5, "#e8b06a"], [1, "#a25a2a"]])
  disc(c, 1180, 330, 160, "rgba(255,248,224,0.85)")
  disc(c, 1180, 330, 240, "rgba(255,248,224,0.18)")
  c.fillStyle = "#c98a52"
  for (const [x, w, h] of [[100, 150, 210], [280, 110, 290], [420, 200, 180], [980, 120, 250], [1400, 160, 300]]) c.fillRect(x, 720 - h, w, h)
  c.fillStyle = "#8f4f26"
  c.fillRect(0, 720, W, 280)
  for (let i = 0; i < 9; i++) {
    const t = i / 8
    stand(c, 130 + i * 128, 900 - t * 150, 560 - t * 250, "#24140c")
  }
  // The ballot box the line is heading for.
  c.fillStyle = "#7a1d17"
  c.fillRect(1230, 730, 250, 170)
  c.fillStyle = "#0c0604"
  c.fillRect(1290, 748, 130, 12)
  c.fillStyle = "#f4ead2"
  c.save()
  c.translate(1350, 690)
  c.rotate(-0.15)
  c.fillRect(-40, -24, 80, 50)
  c.restore()
  develop(c, 5)
}

function longRoad(c: Ctx) {
  vertical(c, [[0, "#1c1236"], [0.35, "#8e3a3a"], [0.56, "#f2a848"], [0.561, "#1b100b"], [1, "#0e0806"]])
  disc(c, 800, 560, 260, "rgba(255,196,110,0.22)")
  c.save()
  c.beginPath()
  c.rect(0, 0, W, 560)
  c.clip()
  disc(c, 800, 560, 170, "#ffd98a")
  c.restore()
  c.fillStyle = "#2c1c13"
  c.beginPath()
  c.moveTo(740, 560)
  c.lineTo(860, 560)
  c.lineTo(1500, 1000)
  c.lineTo(100, 1000)
  c.closePath()
  c.fill()
  c.fillStyle = "#e9c982"
  for (let i = 0; i < 8; i++) {
    const t0 = Math.pow(i / 8, 1.8)
    const t1 = Math.pow((i + 0.5) / 8, 1.8)
    const y0 = 570 + t0 * 430
    const y1 = 570 + t1 * 430
    c.beginPath()
    c.moveTo(800 - 2 - t0 * 12, y0)
    c.lineTo(800 + 2 + t0 * 12, y0)
    c.lineTo(800 + 2 + t1 * 12, y1)
    c.lineTo(800 - 2 - t1 * 12, y1)
    c.fill()
  }
  c.fillStyle = "#0a0605"
  for (const side of [-1, 1]) {
    for (let i = 0; i < 4; i++) {
      const t = Math.pow(i / 4, 1.7)
      const x = 800 + side * (110 + t * 780)
      const base = 575 + t * 400
      const hh = 60 + t * 460
      c.fillRect(x - 4 - t * 8, base - hh, 8 + t * 16, hh)
      c.fillRect(x - 30 - t * 40, base - hh + 14, 60 + t * 80, 6 + t * 6)
    }
  }
  stand(c, 812, 770, 210, "#080403")
  c.fillStyle = "#080403"
  c.beginPath()
  c.arc(790, 700, 26, 0, TAU)
  c.fill()
  develop(c, 7)
}

function loudspeaker(c: Ctx) {
  vertical(c, [[0, "#8a1c14"], [0.7, "#5c100c"], [1, "#2a0705"]])
  const r = rng(21)
  for (let i = 0; i < 5; i++) {
    const x = 160 + i * 320
    c.fillStyle = "#1b0a06"
    c.fillRect(x, 120 + (i % 2) * 60, 8, 520)
    c.fillStyle = i % 2 ? "#e8c95a" : "#efe4cc"
    c.beginPath()
    c.moveTo(x + 8, 130 + (i % 2) * 60)
    c.quadraticCurveTo(x + 90, 160 + (i % 2) * 60, x + 170, 130 + (i % 2) * 60)
    c.lineTo(x + 170, 230 + (i % 2) * 60)
    c.quadraticCurveTo(x + 90, 260 + (i % 2) * 60, x + 8, 230 + (i % 2) * 60)
    c.fill()
  }
  // A megaphone and its rings of sound.
  c.fillStyle = "#efe4cc"
  c.beginPath()
  c.moveTo(690, 400)
  c.lineTo(690, 500)
  c.lineTo(1000, 610)
  c.lineTo(1000, 290)
  c.closePath()
  c.fill()
  c.fillStyle = "#1b0a06"
  c.fillRect(650, 420, 46, 60)
  c.fillRect(760, 500, 26, 90)
  c.strokeStyle = "rgba(255,236,196,0.55)"
  c.lineWidth = 8
  for (let i = 0; i < 4; i++) {
    c.beginPath()
    c.arc(1000, 450, 130 + i * 90, -0.65, 0.65)
    c.stroke()
  }
  for (let row = 0; row < 4; row++) {
    for (let i = 0; i < 26; i++) {
      const x = -20 + i * 66 + (row % 2) * 30 + r() * 14
      const y = 800 + row * 60
      const up = r() > 0.72
      c.fillStyle = "#" + ["0f0605", "170a07", "1f0e09", "0a0403"][row]
      disc(c, x, y - 40, 26, c.fillStyle)
      c.fillRect(x - 34, y - 14, 68, 200)
      if (up) {
        c.strokeStyle = c.fillStyle
        c.lineWidth = 16
        c.lineCap = "round"
        c.beginPath()
        c.moveTo(x + 24, y)
        c.lineTo(x + 46, y - 100)
        c.stroke()
        disc(c, x + 48, y - 116, 15, c.fillStyle)
      }
    }
  }
  develop(c, 9)
}

function harvestDebt(c: Ctx) {
  vertical(c, [[0, "#f7dc98"], [0.42, "#f0b854"], [0.421, "#c88a2a"], [1, "#6a3f12"]])
  disc(c, 300, 300, 150, "rgba(255,252,236,0.9)")
  disc(c, 300, 300, 260, "rgba(255,244,210,0.22)")
  c.strokeStyle = "rgba(70,38,8,0.5)"
  for (let i = -14; i <= 14; i++) {
    c.lineWidth = 2 + Math.abs(i) * 0.25
    c.beginPath()
    c.moveTo(800 + i * 24, 420)
    c.lineTo(800 + i * 150, 1000)
    c.stroke()
  }
  const r = rng(31)
  for (let i = 0; i < 700; i++) {
    const t = Math.pow(r(), 1.5)
    const y = 425 + t * 575
    const x = 800 + (r() - 0.5) * (30 + t * 2300)
    c.strokeStyle = "rgba(96,58,14," + (0.3 + t * 0.4) + ")"
    c.lineWidth = 1 + t * 3
    c.beginPath()
    c.moveTo(x, y)
    c.lineTo(x + (r() - 0.5) * 8, y - 8 - t * 40)
    c.stroke()
  }
  // Sheaves stacked like tents.
  c.fillStyle = "#3a2008"
  for (const [x, y, s] of [[1180, 640, 1], [1330, 690, 1.25], [1470, 760, 1.6]]) {
    c.beginPath()
    c.moveTo(x - 60 * s, y)
    c.lineTo(x, y - 150 * s)
    c.lineTo(x + 60 * s, y)
    c.closePath()
    c.fill()
    c.fillRect(x - 60 * s, y - 4, 120 * s, 10)
  }
  // Two people bent to the stalks.
  for (const [x, y, s] of [[560, 760, 1], [820, 700, 0.78]]) {
    c.fillStyle = "#170d05"
    c.strokeStyle = "#170d05"
    c.lineCap = "round"
    c.lineWidth = 34 * s
    c.beginPath()
    c.moveTo(x, y)
    c.lineTo(x + 30 * s, y - 130 * s)
    c.lineTo(x + 150 * s, y - 190 * s)
    c.stroke()
    c.lineWidth = 26 * s
    c.beginPath()
    c.moveTo(x + 30 * s, y - 130 * s)
    c.lineTo(x - 10 * s, y + 6 * s)
    c.moveTo(x + 150 * s, y - 190 * s)
    c.lineTo(x + 170 * s, y - 60 * s)
    c.stroke()
    disc(c, x + 190 * s, y - 220 * s, 34 * s, "#170d05")
  }
  develop(c, 13)
}

const STILLS: { item: Omit<ProjectorItem, "src">; paint: (c: Ctx) => void }[] = [
  {
    item: {
      heading: "Conflict",
      title: "Reality Sinks",
      note: "Establishes mood: anger, urgency, tension. Stands in for a whole district and its everyday.",
      label: "Wide crop of red background + silhouettes",
      alt: "Pale silhouettes sitting and standing on a brick kiln against a blood-red sky",
    },
    paint: realitySinks,
  },
  {
    item: {
      heading: "Ritual",
      title: "Queue at Dawn",
      note: "Patience as a kind of pressure. The line is the story; the box is the question.",
      label: "Low sun, long shadows, the ballot box at frame right",
      alt: "A line of dark figures walking toward a red ballot box under a pale sun",
    },
    paint: queueAtDawn,
  },
  {
    item: {
      heading: "Journey",
      title: "The Long Road",
      note: "One walker, one bundle, a road that does not end. Distance becomes the argument.",
      label: "Centre the horizon, let the sun sit on the vanishing point",
      alt: "A lone silhouette walking a straight road toward a huge setting sun",
    },
    paint: longRoad,
  },
  {
    item: {
      heading: "Noise",
      title: "Loudspeaker",
      note: "The volume rises before the facts do. Flags, fists and one very loud horn.",
      label: "Crowd as texture, megaphone as the single bright shape",
      alt: "A cream megaphone above a dark crowd with raised fists and flags on a crimson ground",
    },
    paint: loudspeaker,
  },
  {
    item: {
      heading: "Labour",
      title: "Harvest Debt",
      note: "Two people bent to the stalks while the sheaves stack up for someone else.",
      label: "Warm gold to soften the blow, hard black figures to land it",
      alt: "Two bent silhouettes working a golden field beside stacked sheaves",
    },
    paint: harvestDebt,
  },
]

function paintStills(): ProjectorItem[] {
  const canvas = document.createElement("canvas")
  canvas.width = W
  canvas.height = H
  const c = canvas.getContext("2d")
  if (!c) return []
  return STILLS.map(({ item, paint }) => {
    c.clearRect(0, 0, W, H)
    paint(c)
    return { ...item, src: canvas.toDataURL("image/jpeg", 0.88) }
  })
}

export default function Demo() {
  const [items, setItems] = React.useState<ProjectorItem[]>([])
  React.useEffect(() => setItems(paintStills()), [])
  return <LensProjectorCarousel items={items} heading="Conflict" cameraLabel="HD" autoplay={5000} />
}
