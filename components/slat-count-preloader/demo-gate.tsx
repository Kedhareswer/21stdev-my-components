"use client"

import * as React from "react"
import SlatCountPreloader from "@/components/ui/slat-count-preloader"

// The real use: the slats guard a page, then the poster splits into blinds and
// slides off it. Underneath is a small photo carousel. Its "photos" are painted
// as SVG right here, so the demo fetches nothing.

type Scene = {
  title: string
  sky: [string, string]
  sun: [number, number, number, string]
  hills: [string, string, string]
  motif: (s: Scene) => string
}

const SCENES: Scene[] = [
  {
    title: "cable car station",
    sky: ["#9cc7e8", "#f4dfc4"],
    sun: [230, 92, 30, "#fff3d6"],
    hills: ["#8fa7b8", "#5d7a8b", "#2f4655"],
    motif: () =>
      '<path d="M-10 70 L320 230" stroke="#1d2b33" stroke-width="2"/><path d="M-10 84 L320 244" stroke="#1d2b33" stroke-width="1.2"/>' +
      '<path d="M150 145 V162" stroke="#1d2b33" stroke-width="2"/><rect x="124" y="160" width="54" height="44" rx="6" fill="#d9452f"/>' +
      '<rect x="131" y="168" width="17" height="15" rx="2" fill="#f8e6cc"/><rect x="154" y="168" width="17" height="15" rx="2" fill="#f8e6cc"/>',
  },
  {
    title: "light-colored house",
    sky: ["#bcd9ef", "#fbf1e1"],
    sun: [70, 80, 24, "#fffaf0"],
    hills: ["#bfcfa8", "#94ad7c", "#6b8a57"],
    motif: () =>
      '<path d="M86 230 L150 176 L214 230 Z" fill="#c8664a"/><rect x="98" y="228" width="104" height="92" fill="#f6efe4"/>' +
      '<rect x="114" y="248" width="22" height="24" fill="#7ea3bf"/><rect x="164" y="248" width="22" height="24" fill="#7ea3bf"/>' +
      '<rect x="140" y="282" width="20" height="38" fill="#8a5a3c"/>',
  },
  {
    title: "cherry blossoms",
    sky: ["#f6d8df", "#fff6ee"],
    sun: [210, 110, 34, "#ffffff"],
    hills: ["#e8b9c4", "#c98d9c", "#8f6170"],
    motif: () => {
      let s = '<path d="M-10 120 C70 140 120 110 190 150 S280 150 320 130" stroke="#4a2f2a" stroke-width="7" fill="none"/>'
      const pts = [[30, 118], [62, 140], [96, 126], [128, 116], [160, 140], [188, 158], [222, 146], [256, 152], [288, 136], [110, 146], [240, 128], [70, 112]]
      for (const [x, y] of pts) s += '<circle cx="' + x + '" cy="' + y + '" r="13" fill="#f7b7c8"/><circle cx="' + (x + 6) + '" cy="' + (y - 6) + '" r="7" fill="#ffe0e8"/>'
      return s
    },
  },
  {
    title: "bottles of drinks",
    sky: ["#f2c27a", "#f7e7cf"],
    sun: [60, 70, 0, "#000"],
    hills: ["#d4a46a", "#b8834d", "#7d5532"],
    motif: () => {
      const b = (x: number, c: string) =>
        '<rect x="' + (x + 13) + '" y="168" width="14" height="36" rx="3" fill="' + c + '"/><rect x="' + x + '" y="200" width="40" height="110" rx="12" fill="' + c + '"/>' +
        '<rect x="' + (x + 6) + '" y="236" width="28" height="36" fill="#fff6e8" opacity="0.85"/>'
      return '<rect x="0" y="306" width="300" height="94" fill="#5a3a22"/>' + b(64, "#2f7d5b") + b(130, "#c2402b") + b(196, "#e0a23a")
    },
  },
  {
    title: "tree-lined road",
    sky: ["#a9d0e6", "#eef3dc"],
    sun: [150, 120, 22, "#fffbe8"],
    hills: ["#a7c08d", "#7f9e6b", "#567a48"],
    motif: () => {
      let s = '<path d="M138 210 L162 210 L260 400 L40 400 Z" fill="#4d4a47"/><path d="M150 214 L150 400" stroke="#f2e6c9" stroke-width="3" stroke-dasharray="14 12"/>'
      for (let i = 0; i < 5; i++) {
        const t = i / 4
        const y = 214 + t * t * 170
        const r = 8 + t * 34
        s += '<circle cx="' + (128 - t * 110) + '" cy="' + (y - r) + '" r="' + r + '" fill="#355c35"/>'
        s += '<circle cx="' + (172 + t * 110) + '" cy="' + (y - r) + '" r="' + r + '" fill="#2f5530"/>'
      }
      return s
    },
  },
  {
    title: "train window view",
    sky: ["#f5b88a", "#fde7c9"],
    sun: [196, 150, 28, "#fff1d8"],
    hills: ["#c9a0a0", "#9a7584", "#5e4d63"],
    motif: () =>
      '<path fill-rule="evenodd" fill="#2c2a33" d="M0 0 H300 V400 H0 Z M34 46 H266 Q280 46 280 60 V300 Q280 314 266 314 H34 Q20 314 20 300 V60 Q20 46 34 46 Z"/>' +
      '<rect x="0" y="330" width="300" height="70" fill="#3d3a46"/><rect x="20" y="320" width="260" height="8" rx="4" fill="#57535f"/>',
  },
  {
    title: "sunlight streams",
    sky: ["#ffe2a8", "#fff7e6"],
    sun: [240, 40, 40, "#fffdf3"],
    hills: ["#9bb08a", "#6f8a63", "#3f5a3c"],
    motif: () => {
      let s = ""
      for (let i = 0; i < 6; i++) s += '<path d="M240 40 L' + (i * 52 - 20) + " 400 L" + (i * 52 + 8) + ' 400 Z" fill="#fffbe6" opacity="0.22"/>'
      return s
    },
  },
  {
    title: "seagulls",
    sky: ["#8fbbe0", "#e6f1f8"],
    sun: [80, 90, 26, "#ffffff"],
    hills: ["#9cc0d6", "#6c9bb8", "#3e6f8f"],
    motif: () => {
      let s = ""
      const g = [[70, 150, 1], [140, 120, 1.4], [200, 170, 0.9], [236, 112, 1.2], [110, 196, 0.8]]
      for (const [x, y, k] of g)
        s += '<path d="M' + (x - 16 * k) + " " + y + " Q" + (x - 8 * k) + " " + (y - 10 * k) + " " + x + " " + y + " Q" + (x + 8 * k) + " " + (y - 10 * k) + " " + (x + 16 * k) + " " + y + '" stroke="#24323d" stroke-width="2.5" fill="none" stroke-linecap="round"/>'
      return s
    },
  },
  {
    title: "pink flowers",
    sky: ["#f3c6cf", "#fdf0ea"],
    sun: [220, 80, 22, "#fff8f4"],
    hills: ["#b8cf9c", "#86a96d", "#557a44"],
    motif: () => {
      let s = ""
      const f = [[50, 270, 1], [100, 300, 1.3], [160, 262, 1.1], [214, 296, 1.4], [262, 270, 1], [130, 340, 1.2], [236, 350, 1]]
      for (const [x, y, k] of f) {
        s += '<path d="M' + x + " " + y + " V400" + '" stroke="#3f6b35" stroke-width="3"/>'
        for (let p = 0; p < 5; p++) {
          const a = (p / 5) * Math.PI * 2
          s += '<circle cx="' + (x + Math.cos(a) * 9 * k).toFixed(1) + '" cy="' + (y + Math.sin(a) * 9 * k).toFixed(1) + '" r="' + 8 * k + '" fill="#ef7fa4"/>'
        }
        s += '<circle cx="' + x + '" cy="' + y + '" r="' + 5 * k + '" fill="#ffd36b"/>'
      }
      return s
    },
  },
  {
    title: "paddleboarding",
    sky: ["#7fc4d8", "#e4f4f1"],
    sun: [64, 70, 24, "#ffffff"],
    hills: ["#8fc0b8", "#5c9c97", "#2f6f73"],
    motif: () =>
      '<rect x="0" y="250" width="300" height="150" fill="#2c8aa0"/><path d="M0 290 Q40 282 80 290 T160 290 T240 290 T320 290" stroke="#bfe7ee" stroke-width="2" fill="none" opacity="0.7"/>' +
      '<ellipse cx="150" cy="262" rx="62" ry="6" fill="#f5d04a"/><path d="M146 256 L150 214 L156 256" stroke="#1d2a30" stroke-width="7" stroke-linecap="round" fill="none"/>' +
      '<circle cx="151" cy="202" r="9" fill="#1d2a30"/><path d="M150 222 L184 196 M176 186 L196 270" stroke="#1d2a30" stroke-width="3" stroke-linecap="round"/>',
  },
]

function paint(s: Scene, i: number) {
  const [x, y, r, sun] = s.sun
  const [h1, h2, h3] = s.hills
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400">' +
    '<defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + s.sky[0] + '"/><stop offset="1" stop-color="' + s.sky[1] + '"/></linearGradient>' +
    '<filter id="g"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="' + (i + 3) + '"/><feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.16 0"/></filter></defs>' +
    '<rect width="300" height="400" fill="url(#s)"/>' +
    (r ? '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="' + sun + '"/>' : "") +
    '<path d="M0 240 Q70 196 140 226 T300 210 V400 H0 Z" fill="' + h1 + '"/>' +
    '<path d="M0 286 Q90 244 170 276 T300 262 V400 H0 Z" fill="' + h2 + '"/>' +
    '<path d="M0 334 Q110 300 200 330 T300 322 V400 H0 Z" fill="' + h3 + '"/>' +
    s.motif(s) +
    '<rect width="300" height="400" filter="url(#g)"/></svg>'
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg)
}

const SLIDES = SCENES.map((s, i) => ({ src: paint(s, i), title: s.title }))

const CAROUSEL_CSS = `
.scd-title { animation: scd-in 700ms cubic-bezier(0.34, 1.4, 0.64, 1) both; }
@keyframes scd-in { from { opacity: 0; transform: scale(0.5); filter: blur(2px); } to { opacity: 1; transform: scale(1); filter: blur(0); } }
@media (prefers-reduced-motion: reduce) { .scd-title { animation: none; } .scd-slide, .scd-track { transition: none !important; } }
`

function Chevron({ flip }: { flip?: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={flip ? "M9 18l6-6-6-6" : "M15 18l-6-6 6-6"} />
    </svg>
  )
}

function Carousel() {
  const [active, setActive] = React.useState(2)
  const n = SLIDES.length
  const go = (i: number) => setActive(Math.max(0, Math.min(n - 1, i)))

  return (
    <div
      className="select-none text-foreground"
      tabIndex={0}
      aria-roledescription="carousel"
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") go(active - 1)
        if (e.key === "ArrowRight") go(active + 1)
      }}
    >
      <style>{CAROUSEL_CSS}</style>
      <div className="relative" style={{ width: "clamp(120px, 20vw, 240px)" }}>
        <div
          className="scd-track flex w-fit"
          style={{ transform: "translateX(" + (-active * 100) / n + "%)", transition: "transform 800ms cubic-bezier(0.22, 1.15, 0.36, 1)" }}
        >
          {SLIDES.map((s, i) => {
            const on = i === active
            return (
              <div
                key={s.title}
                className="scd-slide flex flex-col items-center"
                style={{
                  width: "clamp(120px, 20vw, 240px)",
                  transform: "translateY(" + (on ? 0 : active > i ? -100 : 100) + "%) scale(" + (on ? 1 : 0.8) + ")",
                  transition: "transform 600ms ease-in-out",
                }}
              >
                <img
                  src={s.src}
                  alt={s.title}
                  width={240}
                  height={320}
                  draggable={false}
                  onClick={() => go(i)}
                  className="block cursor-pointer object-cover"
                  style={{ width: "100%", height: "auto", aspectRatio: "3 / 4", maxWidth: "none" }}
                />
              </div>
            )
          })}
        </div>
        <div className="pointer-events-none absolute bottom-0 left-full top-0 ml-3 flex items-center whitespace-nowrap text-xl font-medium" aria-live="polite">
          <span key={active} className="scd-title inline-block origin-left">
            {SLIDES[active].title}
          </span>
        </div>
      </div>

      <div className="absolute bottom-4 left-0 right-0 mx-auto flex w-fit items-center justify-center gap-4 rounded-full border border-border bg-background/60 px-2 text-muted-foreground shadow-sm backdrop-blur-sm">
        <button type="button" onClick={() => go(active - 1)} className="cursor-pointer p-2 hover:text-foreground" aria-label="Previous photo">
          <Chevron />
        </button>
        <div className="flex w-[180px] items-center justify-center gap-2">
          {SLIDES.map((s, i) => (
            <button
              key={s.title}
              type="button"
              aria-label={"Show " + s.title}
              onClick={() => go(i)}
              className={"h-2 cursor-pointer rounded-full bg-current transition-[width,opacity] duration-300 " + (i === active ? "w-7 opacity-100" : "w-2 opacity-30")}
            />
          ))}
        </div>
        <button type="button" onClick={() => go(active + 1)} className="cursor-pointer p-2 hover:text-foreground" aria-label="Next photo">
          <Chevron flip />
        </button>
      </div>
    </div>
  )
}

export default function DemoGate() {
  const [run, setRun] = React.useState(0)

  return (
    <SlatCountPreloader key={run} label="Slat / Count — Field Notes" caption="Ten postcards from the slow train. Developing now.">
      <main className="relative flex min-h-full flex-col items-center justify-center overflow-hidden bg-background px-6 pb-24 pt-16 text-foreground">
        <p className="absolute left-6 top-6 z-10 text-xs uppercase tracking-[0.3em] text-muted-foreground">Field Notes · Vol. 07</p>
        <button
          type="button"
          onClick={() => setRun((n) => n + 1)}
          className="absolute right-6 top-5 z-10 rounded-full border border-border bg-background px-4 py-1.5 text-xs uppercase tracking-[0.2em] hover:bg-primary hover:text-background"
        >
          Replay loader
        </button>
        <div style={{ marginRight: "clamp(120px, 20vw, 240px)" }}>
          <Carousel />
        </div>
      </main>
    </SlatCountPreloader>
  )
}
