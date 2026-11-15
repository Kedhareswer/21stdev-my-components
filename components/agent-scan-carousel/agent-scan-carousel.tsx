"use client"

import * as React from "react"

/**
 * Agent Scan Carousel — a stream of website cards drifting through a glowing
 * scanner line. Right of the line each card is the page people see; left of
 * it the same card has been rewritten as the lean semantic markup an AI agent
 * reads, with a running "token reduction" counter riding on the scanner.
 *
 * Grab the stream and fling it: it coasts, then settles back to its drift.
 * Arrow keys nudge it. Pixels shed off the scan front onto the page side.
 *
 * Self-contained: React is the only import. One canvas for the beam and the
 * pixels, plain DOM for the cards. Pictures are served from the catalog site.
 */

export interface AgentScanCard {
  /** The human page, drawn at 800 x 500 design pixels. */
  face: React.ReactNode
  /** The agent version, shown left of the scanner. */
  markup: string
  /** Comment lines in the second code column. */
  notes?: string[]
  /** Tokens before and after; the counter counts the difference as the card is scanned. */
  original: number
  compressed: number
  /** Accessible name for the card. */
  label: string
}

export interface AgentScanCarouselProps {
  cards?: AgentScanCard[]
  eyebrow?: string
  title?: string
  titleItalic?: string
  description?: string
  ctaLabel?: string
  ctaHref?: string
  counterLabel?: string
  /** Drift speed in px per second at full size. */
  speed?: number
  /** Beam, pixels and counter pill. */
  accent?: string
  /** Button fill. */
  ctaColor?: string
  /** Must be a definite length: percentages collapse on a page with no height chain. */
  height?: string
  /** Where the pictures live. */
  imageBase?: string
  /** Google Fonts stylesheet, or null to bring your own. */
  fontHref?: string | null
  className?: string
}

const FONT_HREF =
  "https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;1,6..72,400&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&family=Handjet:wght@300;400&display=swap"

const IMG_BASE = "https://kedhar-components.pages.dev/agent-scan-carousel/"

// Card geometry, measured on the reference at 1521 px wide.
const CARD_W = 800
const CARD_H = 500
const GAP = 80
const PITCH = CARD_W + GAP
const STAGE_H = 580
const CARD_TOP = 40
const RADIUS = 38

// #region model
/** Positive modulo. */
export function wrap(x: number, period: number): number {
  return ((x % period) + period) % period
}

/** Left edge of slot i for a stream offset, wrapped so slots tile [-pitch, period - pitch). */
export function slotX(i: number, offset: number, pitch: number, period: number): number {
  return wrap(i * pitch + offset + pitch, period) - pitch
}

/** How far the scanner has crossed a card, 0 to 1, or -1 when it is not over the card. */
export function scanProgress(scanX: number, cardX: number, cardW: number): number {
  if (scanX < cardX || scanX > cardX + cardW) return -1
  return (scanX - cardX) / cardW
}

/** Counter readout for a card part-way through the scanner. */
export function tokenReadout(p: number, original: number, compressed: number): { saved: number; percent: number } {
  const q = Math.min(1, Math.max(0, p))
  return {
    saved: Math.round(q * (original - compressed)),
    percent: Math.round(q * (1 - compressed / original) * 100),
  }
}

export function formatTokens(n: number): string {
  return "-" + Math.round(n).toLocaleString("en-US")
}

/** After a fling the stream relaxes back to its drift; tau in seconds. */
export function relaxVelocity(v: number, base: number, dt: number, tau: number): number {
  return base + (v - base) * Math.exp(-dt / tau)
}

/** Scale for the cards: fit the width with a 16 px gutter each side, never grow past 1. */
export function fitScale(stageW: number, availH: number): number {
  const byW = (stageW - 32) / CARD_W
  const byH = availH / STAGE_H
  return Math.max(0.3, Math.min(1, byW, byH))
}
// #endregion model

const CREAM = "#f1e8c7"

const css =
  ".asc-root{position:relative;width:100%;overflow:hidden;background:color-mix(in oklab,var(--color-background,#fff) 90%,#b48a4f);color:var(--color-foreground,#0b0b0b);display:flex;flex-direction:column;justify-content:center;font-family:Inter,ui-sans-serif,system-ui,sans-serif;-webkit-font-smoothing:antialiased}" +
  ".asc-gridlines{position:absolute;inset:0;pointer-events:none;opacity:.3;-webkit-mask-image:linear-gradient(to bottom,#000 0,rgba(0,0,0,.55) 35%,transparent 75%);mask-image:linear-gradient(to bottom,#000 0,rgba(0,0,0,.55) 35%,transparent 75%)}" +
  ".asc-head{position:relative;z-index:2;width:100%;max-width:1440px;margin:0 auto;padding:0 24px;box-sizing:border-box;display:grid;grid-template-columns:minmax(0,696px) minmax(0,576px);justify-content:space-between;column-gap:48px;row-gap:24px}" +
  ".asc-eyebrow{margin:0 0 16px;font-family:'IBM Plex Mono',ui-monospace,monospace;font-size:16px;line-height:24px;font-weight:400;text-transform:uppercase;color:var(--color-foreground,#000)}" +
  ".asc-title{margin:0;font-family:Newsreader,'Times New Roman',serif;font-weight:400;font-size:clamp(34px,3.3vw,50px);line-height:1.05;letter-spacing:-.025em;color:var(--color-foreground,#000)}" +
  ".asc-title i{display:block;font-style:italic;opacity:.9}" +
  ".asc-desc{margin:0;font-size:clamp(16px,1.2vw,18px);line-height:1.56;color:var(--color-foreground,#000)}" +
  ".asc-cta{display:inline-flex;align-items:center;justify-content:center;margin-top:24px;padding:12px 32px;border-radius:999px;font-size:15px;line-height:22.5px;font-weight:500;color:#fff;text-decoration:none;transition:transform .3s cubic-bezier(.22,1,.36,1),filter .3s}" +
  ".asc-cta:hover{transform:translateY(-1px);filter:brightness(1.08)}" +
  ".asc-cta:focus-visible,.asc-stage:focus-visible{outline:2px solid var(--asc-accent);outline-offset:4px}" +
  ".asc-stage{position:relative;z-index:1;width:100%;flex:none;cursor:grab;touch-action:pan-y;-webkit-user-select:none;user-select:none;outline:none}" +
  ".asc-stage[data-drag='1']{cursor:grabbing}" +
  ".asc-fade{position:absolute;inset:0;-webkit-mask-image:linear-gradient(to right,transparent 0,#000 6%,#000 100%);mask-image:linear-gradient(to right,transparent 0,#000 6%,#000 100%)}" +
  ".asc-card{position:absolute;left:0;top:0;width:800px;height:500px;transform-origin:0 0;will-change:transform}" +
  ".asc-face{position:absolute;inset:0;border-radius:38px;overflow:hidden;will-change:clip-path}" +
  ".asc-face img{max-width:none;display:block}" +
  ".asc-code{position:absolute;inset:0;overflow:hidden;will-change:clip-path;display:flex;font-family:Inter,ui-sans-serif,system-ui,sans-serif;font-size:13px;line-height:17px;white-space:pre-wrap;padding-top:24px;box-sizing:border-box}" +
  ".asc-code-main{width:416px;flex:none;padding-right:16px;box-sizing:border-box;color:color-mix(in oklab,var(--color-foreground,#1d1107) 62%,transparent)}" +
  ".asc-code-notes{width:384px;flex:none;color:color-mix(in oklab,var(--color-foreground,#1d1107) 45%,transparent)}" +
  ".asc-canvas{position:absolute;left:0;top:0;pointer-events:none;z-index:3}" +
  ".asc-meter{position:absolute;z-index:4;display:flex;flex-direction:column;align-items:center;pointer-events:none;transform:translateX(-50%)}" +
  ".asc-meter-label{font-size:13px;line-height:20px;font-weight:500;white-space:nowrap;margin-bottom:10px;color:color-mix(in oklab,var(--color-foreground,#000) 42%,var(--color-background,#f8f3ea))}" +
  ".asc-pill{display:flex;align-items:center;gap:28px;height:32px;padding:6px 18px;box-sizing:border-box;border-radius:999px;background:var(--asc-accent);box-shadow:0 0 24px 0 var(--asc-glow);color:#597a00;white-space:nowrap}" +
  ".asc-pill-n{font-family:'IBM Plex Mono',ui-monospace,monospace;font-size:16px;line-height:20px;font-weight:400;min-width:7ch;font-variant-numeric:tabular-nums}" +
  ".asc-pill-p{font-size:12px;line-height:20px;font-weight:700}" +
  ".asc-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}" +
  /* faces */
  ".asc-wm{position:absolute;left:38px;top:22px;font-family:Handjet,ui-monospace,monospace;font-size:82px;line-height:1;font-weight:400;letter-spacing:-.01em}" +
  ".asc-nav{position:absolute;right:40px;top:30px;display:flex;gap:27px;font-size:15px;line-height:22px;letter-spacing:.01em}" +
  ".asc-rule{position:absolute;left:40px;right:40px;top:132px;height:1px}" +
  ".asc-serif{font-family:Newsreader,'Times New Roman',serif;font-weight:400;letter-spacing:-.02em}" +
  ".asc-serif i{font-style:italic}" +
  "@media (max-width:900px){.asc-head{grid-template-columns:minmax(0,1fr)}.asc-cta{margin-top:20px}}" +
  "@media (prefers-reduced-motion:reduce){.asc-cta{transition:none}.asc-cta:hover{transform:none}}"

const pic = (base: string, name: string) => base + name + ".webp"

function Img(props: { src: string; w: number; h: number; x?: number; y?: number; pos?: string; style?: React.CSSProperties }) {
  return (
    <img
      src={props.src}
      alt=""
      width={props.w}
      height={props.h}
      draggable={false}
      loading="lazy"
      decoding="async"
      style={{
        position: "absolute",
        left: props.x ?? 0,
        top: props.y ?? 0,
        width: props.w,
        height: props.h,
        maxWidth: "none",
        objectFit: "cover",
        objectPosition: props.pos ?? "50% 50%",
        ...props.style,
      }}
    />
  )
}

function Brand(props: { color: string; navColor?: string; rule?: string }) {
  return (
    <>
      <div className="asc-wm" style={{ color: props.color }}>
        Kedhar
      </div>
      <div className="asc-nav" style={{ color: props.navColor ?? props.color }}>
        <span>WORK</span>
        <span>ABOUT</span>
        <span>CONTACT</span>
      </div>
      {props.rule && <div className="asc-rule" style={{ background: props.rule }} />}
    </>
  )
}

function FaceServices({ base }: { base: string }) {
  const items = [
    "Interface design",
    "Design systems",
    "Front-end engineering",
    "Motion & interaction",
    "Agent-ready markup",
    "Accessibility audits",
    "Performance tuning",
  ]
  return (
    <div style={{ position: "absolute", inset: 0, background: "#24211e" }}>
      <Brand color={CREAM} />
      <div style={{ position: "absolute", left: 46, top: 191, width: 709, height: 261, borderRadius: 20, overflow: "hidden" }}>
        <Img src={pic(base, "sky")} w={709} h={261} pos="50% 62%" />
        <div style={{ position: "absolute", left: 30, top: 22, fontSize: 14, lineHeight: "20px", fontWeight: 500, color: "#fff" }}>
          Services
        </div>
        <div style={{ position: "absolute", left: 386, top: 27 }}>
          {items.map((t, i) => (
            <div key={t} style={{ display: "flex", gap: 14, fontSize: 14, lineHeight: "20px", height: 32.8, fontWeight: 500, color: "#fff" }}>
              <span style={{ opacity: 0.5, width: 15 }}>{"0" + (i + 1)}</span>
              <span>{t}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function FaceHero({ base }: { base: string }) {
  return (
    <div style={{ position: "absolute", inset: 0, background: "#2b2a35" }}>
      <Img src={pic(base, "dusk")} w={800} h={500} pos="40% 40%" />
      <Brand color={CREAM} />
      <div className="asc-serif" style={{ position: "absolute", left: 54, top: 196, width: 470, fontSize: 52, lineHeight: "48px", color: CREAM }}>
        Design <i>interfaces people</i> trust on every screen.
      </div>
      <div
        style={{
          position: "absolute",
          left: 54,
          top: 393,
          height: 52,
          padding: "0 32px",
          display: "flex",
          alignItems: "center",
          borderRadius: 999,
          background: "#1d1a17",
          color: CREAM,
          fontSize: 15,
          fontWeight: 500,
        }}
      >
        Start a project
      </div>
    </div>
  )
}

function FacePricing({ base }: { base: string }) {
  const rows: [string, string, string][] = [
    ["Screens designed", "12", "Unlimited"],
    ["Components built", "20", "Unlimited"],
    ["Design system", "Starter", "Full"],
    ["Revision rounds", "2", "Unlimited"],
    ["Motion pass", "Basic", "Full"],
    ["Agent markup", "Included", "Included + audits"],
  ]
  const ink = "#1d1d1b"
  return (
    <div style={{ position: "absolute", inset: 0, background: "#c9c48a" }}>
      <Img src={pic(base, "grass")} w={800} h={500} pos="50% 50%" style={{ filter: "blur(7px) saturate(1.05)", transform: "scale(1.06)" }} />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(128deg,rgba(236,228,206,.92) 0%,rgba(230,224,190,.7) 30%,rgba(196,206,90,.25) 62%,rgba(60,62,20,.28) 100%)",
        }}
      />
      <Brand color={ink} rule="rgba(29,29,27,.14)" />
      {[
        ["Sprint", "$2,900", 40],
        ["Retainer", "$8,400", 340],
      ].map(([k, v, x]) => (
        <div key={k as string} style={{ position: "absolute", left: x as number, top: 205, color: ink }}>
          <div style={{ fontSize: 14, lineHeight: "20px", fontWeight: 500 }}>{k}</div>
          <div style={{ fontSize: 76, lineHeight: "80px", fontWeight: 500, letterSpacing: "-.03em", marginTop: 4 }}>{v}</div>
        </div>
      ))}
      <div style={{ position: "absolute", left: 40, right: 40, top: 352, height: 1, background: "rgba(29,29,27,.14)" }} />
      <div style={{ position: "absolute", left: 40, top: 366 }}>
        {rows.map((r) => (
          <div key={r[0]} style={{ display: "flex", fontSize: 13, lineHeight: "23px", fontWeight: 500 }}>
            <span style={{ width: 300, color: "rgba(29,29,27,.5)" }}>{r[0]}</span>
            <span style={{ width: 196, color: ink }}>{r[1]}</span>
            <span style={{ color: ink }}>{r[2]}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function FaceCase({ base }: { base: string }) {
  const ink = "#1f1d19"
  return (
    <div style={{ position: "absolute", inset: 0, background: "#b9b49c" }}>
      <Img src={pic(base, "lichen")} w={800} h={500} pos="50% 50%" style={{ filter: "blur(5px) saturate(.85)", transform: "scale(1.05)" }} />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(160deg,rgba(232,228,214,.55) 0%,rgba(226,222,204,.3) 55%,rgba(226,222,204,.12) 100%)" }} />
      <Brand color={ink} />
      <div style={{ position: "absolute", left: 55, top: 344, color: ink }}>
        <div style={{ fontSize: 58, lineHeight: "60px", fontWeight: 500, letterSpacing: "-.02em" }}>3.4x</div>
        <div style={{ fontSize: 27, lineHeight: "32px", marginTop: 2 }}>conversion lift</div>
      </div>
      <div style={{ position: "absolute", left: 393, top: 236, width: 360, fontSize: 18, lineHeight: "25px", color: ink }}>
        How Client 1 rebuilt its storefront with me in six weeks: 3.4x more checkouts at half the page weight.
      </div>
      {[
        ["62%", "lighter pages", 393],
        ["48%", "faster first paint", 507],
      ].map(([n, l, x]) => (
        <div key={n as string} style={{ position: "absolute", left: x as number, top: 362, width: 100, color: ink }}>
          <div style={{ fontSize: 26, lineHeight: "30px", fontWeight: 500 }}>{n}</div>
          <div style={{ fontSize: 13, lineHeight: "15px", marginTop: 6 }}>{l}</div>
        </div>
      ))}
    </div>
  )
}

function FaceJournal({ base }: { base: string }) {
  const cap = (k: string, t: string, x: number) => (
    <div style={{ position: "absolute", left: x + 10, top: 433, width: 180 }}>
      <div style={{ fontSize: 9, lineHeight: "12px", fontWeight: 500, color: "rgba(241,232,199,.55)" }}>{k}</div>
      <div style={{ fontSize: 13, lineHeight: "16px", fontWeight: 500, marginTop: 9, color: "#fff" }}>{t}</div>
    </div>
  )
  return (
    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(165deg,#756a57 0%,#3d342a 42%,#1c140d 100%)" }}>
      <Brand color={CREAM} rule="rgba(241,232,199,.16)" />
      <div style={{ position: "absolute", left: 45, top: 217, width: 193, height: 195, borderRadius: 12, overflow: "hidden" }}>
        <Img src={pic(base, "bloom")} w={193} h={195} pos="40% 70%" />
      </div>
      {cap("Project 01", "How Client 2 shipped a design system in 30 days", 45)}
      <div style={{ position: "absolute", left: 257, top: 217, width: 285, height: 300, borderRadius: 12, overflow: "hidden" }}>
        <Img src={pic(base, "sky")} w={285} h={300} pos="30% 60%" />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom,rgba(28,36,58,.42) 0%,rgba(28,36,58,0) 55%)" }} />
        <div style={{ position: "absolute", left: 15, top: 20, fontSize: 9, fontWeight: 500, color: "rgba(255,255,255,.8)" }}>Mar 18, 2026</div>
        <div className="asc-serif" style={{ position: "absolute", left: 15, top: 44, width: 250, fontSize: 22, lineHeight: "24px", color: CREAM }}>
          Notes on motion: interfaces that move with intent
        </div>
      </div>
      <div style={{ position: "absolute", left: 561, top: 217, width: 194, height: 195, borderRadius: 12, overflow: "hidden" }}>
        <Img src={pic(base, "dusk")} w={194} h={195} pos="55% 35%" />
      </div>
      {cap("Project 02", "One codebase, twelve storefronts for Client 3", 561)}
    </div>
  )
}

function FaceStudio({ base }: { base: string }) {
  return (
    <div style={{ position: "absolute", inset: 0, background: "#1e130b" }}>
      <Img
        src={pic(base, "bloom")}
        w={800}
        h={330}
        y={170}
        pos="50% 55%"
        style={{
          WebkitMaskImage: "linear-gradient(to bottom,transparent 0,#000 38%)",
          maskImage: "linear-gradient(to bottom,transparent 0,#000 38%)",
        }}
      />
      <Brand color={CREAM} />
      <div className="asc-serif" style={{ position: "absolute", left: 52, top: 326, width: 360, fontSize: 50, lineHeight: "46px", color: CREAM }}>
        The one-person <i>design studio.</i>
      </div>
      <div style={{ position: "absolute", left: 450, top: 336, width: 277, color: "#fff", fontSize: 15, lineHeight: "22px" }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Work</span>
          <span>01</span>
        </div>
        <div style={{ height: 1, background: "rgba(255,255,255,.3)", margin: "18px 0 15px" }} />
        {["Interface design", "Design systems", "Agent-ready markup"].map((t) => (
          <div key={t} style={{ height: 34 }}>
            {t}
          </div>
        ))}
      </div>
    </div>
  )
}

const note = (pct: string, a: number, b: number, path: string) => [
  "<!-- agent-ready: " + pct + "% token reduction -->",
  "<!-- original: " + a.toLocaleString("en-US") + " tokens -->",
  "<!-- compressed: " + b.toLocaleString("en-US") + " tokens -->",
  "<!-- kedhareswer/" + path + " -->",
]

export function defaultCards(base: string = IMG_BASE): AgentScanCard[] {
  return [
    {
      label: "Services page",
      face: <FaceServices base={base} />,
      original: 123916,
      compressed: 1355,
      notes: note("98.9", 123916, 1355, "services"),
      markup:
        "<h1>Kedhar — Services</h1>\n<p>Everything I take on, from first sketch\nto a shipped, agent-readable front end.</p>\n\n<h2>01. Interface design</h2>\n<p>Product screens drawn for real content,\nreal states and real devices.</p>\n\n<h2>02. Design systems</h2>\n<p>Tokens, components and docs a team\ncan keep extending after I leave.</p>\n\n<h2>03. Front-end engineering</h2>\n<p>React and Tailwind, typed end to end,\nmeasured on slow phones.</p>\n\n<h2>04. Motion & interaction</h2>\n<p>Motion with a job: feedback, focus\nand continuity between states.</p>\n\n<h2>05. Agent-ready markup</h2>\n<p>Clean semantic HTML that AI agents read\nin a fraction of the tokens.</p>",
    },
    {
      label: "Home page hero",
      face: <FaceHero base={base} />,
      original: 96480,
      compressed: 2214,
      notes: note("97.7", 96480, 2214, "home"),
      markup:
        "<h1>Design interfaces people trust</h1>\n<h1>on every screen.</h1>\n\n<p>Kedhareswer. Designer and front-end\ndeveloper building calm, fast, accessible\nproduct interfaces.</p>\n\n<a href='/contact'>Start a project</a>\n\n<nav>\n  <a href='/work'>Work</a>\n  <a href='/about'>About</a>\n  <a href='/contact'>Contact</a>\n</nav>\n\n<h2>Selected work</h2>\n<ul>\n  <li>Project 01 for Client 1</li>\n  <li>Project 02 for Client 2</li>\n  <li>Project 03 for Client 3</li>\n</ul>\n\n<h2>Contact</h2>\n<p>kedhareswer.12110626@gmail.com</p>",
    },
    {
      label: "Pricing page",
      face: <FacePricing base={base} />,
      original: 58302,
      compressed: 1876,
      notes: note("96.8", 58302, 1876, "pricing"),
      markup:
        "<h1>Pricing</h1>\n<p>Two ways to work together.</p>\n\n<table>\n  <tr><th></th><th>Sprint</th><th>Retainer</th></tr>\n  <tr><td>Price</td><td>$2,900</td><td>$8,400</td></tr>\n  <tr><td>Screens designed</td><td>12</td>\n      <td>Unlimited</td></tr>\n  <tr><td>Components built</td><td>20</td>\n      <td>Unlimited</td></tr>\n  <tr><td>Design system</td><td>Starter</td>\n      <td>Full</td></tr>\n  <tr><td>Revision rounds</td><td>2</td>\n      <td>Unlimited</td></tr>\n  <tr><td>Motion pass</td><td>Basic</td>\n      <td>Full</td></tr>\n  <tr><td>Agent markup</td><td>Included</td>\n      <td>Included + audits</td></tr>\n</table>\n\n<a href='/contact'>Book a sprint</a>",
    },
    {
      label: "Case study",
      face: <FaceCase base={base} />,
      original: 74118,
      compressed: 1603,
      notes: note("97.8", 74118, 1603, "work/client-1"),
      markup:
        "<h1>Client 1: 3.4x conversion lift</h1>\n\n<p>How Client 1 rebuilt its storefront\nwith Kedhareswer in six weeks: 3.4x more\ncheckouts at half the page weight.</p>\n\n<h2>Results</h2>\n<ul>\n  <li>3.4x conversion lift</li>\n  <li>62% lighter pages</li>\n  <li>48% faster first paint</li>\n</ul>\n\n<h2>What changed</h2>\n<p>A new product grid, a two-step checkout\nand a design system of 40 components.</p>\n\n<h2>Stack</h2>\n<p>React, TypeScript, Tailwind CSS.</p>\n\n<a href='/work'>All projects</a>",
    },
    {
      label: "Journal",
      face: <FaceJournal base={base} />,
      original: 88645,
      compressed: 2490,
      notes: note("97.2", 88645, 2490, "journal"),
      markup:
        "<h1>Journal</h1>\n\n<article>\n  <h2>How Client 2 shipped a design\n  system in 30 days</h2>\n  <p>Project 01</p>\n</article>\n\n<article>\n  <time>2026-03-18</time>\n  <h2>Notes on motion: interfaces\n  that move with intent</h2>\n</article>\n\n<article>\n  <h2>One codebase, twelve storefronts\n  for Client 3</h2>\n  <p>Project 02</p>\n</article>\n\n<a href='/journal'>All entries</a>",
    },
    {
      label: "Studio page",
      face: <FaceStudio base={base} />,
      original: 112730,
      compressed: 1985,
      notes: note("98.2", 112730, 1985, "studio"),
      markup:
        "<h1>The one-person design studio.</h1>\n\n<p>One person, end to end: research,\ninterface design, design systems and\nproduction front end.</p>\n\n<h2>Work</h2>\n<ul>\n  <li>Interface design</li>\n  <li>Design systems</li>\n  <li>Agent-ready markup</li>\n</ul>\n\n<h2>How I work</h2>\n<p>Short sprints, weekly demos, every\ncomponent documented and tested.</p>\n\n<h2>Clients</h2>\n<p>Client 1, Client 2, Client 3.</p>\n\n<a href='mailto:kedhareswer.12110626@gmail.com'>\n  Say hello</a>",
    },
  ]
}

type Particle = { x: number; y: number; vx: number; vy: number; age: number; life: number; size: number; cream: boolean }

const reducedMotion = () =>
  typeof window !== "undefined" && !!window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches

export default function AgentScanCarousel({
  cards,
  eyebrow = "Kedhareswer",
  title = "Built for people.",
  titleItalic = "Readable by agents.",
  description = "I'm Kedhareswer, a designer and front-end developer. Every site I ship gives people the full experience and hands AI agents clean, token-light markup, without changing a pixel of what visitors see.",
  ctaLabel = "Work with me",
  ctaHref = "mailto:kedhareswer.12110626@gmail.com",
  counterLabel = "Token reduction",
  speed = 48,
  accent = "#d8fc3b",
  ctaColor = "#2f4fff",
  height = "max(100svh, 900px)",
  imageBase = IMG_BASE,
  fontHref = FONT_HREF,
  className,
}: AgentScanCarouselProps) {
  const list = React.useMemo(() => (cards && cards.length ? cards : defaultCards(imageBase)), [cards, imageBase])
  const rootRef = React.useRef(null as HTMLDivElement | null)
  const headRef = React.useRef(null as HTMLDivElement | null)
  const stageRef = React.useRef(null as HTMLDivElement | null)
  const canvasRef = React.useRef(null as HTMLCanvasElement | null)
  const meterRef = React.useRef(null as HTMLDivElement | null)
  const numRef = React.useRef(null as HTMLSpanElement | null)
  const pctRef = React.useRef(null as HTMLSpanElement | null)
  const cardEls = React.useRef([] as (HTMLDivElement | null)[])
  const faceEls = React.useRef([] as (HTMLDivElement | null)[])
  const codeEls = React.useRef([] as (HTMLDivElement | null)[])
  const [copies, setCopies] = React.useState(2)
  const live = React.useRef({
    offset: 0,
    vel: -speed,
    drag: false,
    lastX: 0,
    lastT: 0,
    dragVel: 0,
    scale: 1,
    stageW: 0,
    placed: false,
  })

  const n = list.length
  const slots = n * copies

  // Layout: scale from the box, copies so the stream always overfills it.
  React.useEffect(() => {
    const root = rootRef.current
    const head = headRef.current
    const stage = stageRef.current
    if (!root || !head || !stage) return
    const fit = () => {
      const w = root.clientWidth
      const h = root.clientHeight
      const headH = head.offsetHeight
      const avail = h - headH - 120
      const s = fitScale(w, avail)
      const L = live.current
      L.scale = s
      L.stageW = w
      stage.style.height = STAGE_H * s + "px"
      stage.style.marginTop = Math.round(Math.max(32, 80 * s)) + "px"
      const need = Math.max(2, Math.ceil((w + 2 * PITCH * s) / (n * PITCH * s)))
      setCopies((c) => (c === need ? c : need))
      if (!L.placed) {
        // Open with the first card part-way through the scanner.
        L.offset = w / 2 - 0.42 * CARD_W * s
        L.placed = true
      }
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(root)
    ro.observe(head)
    return () => ro.disconnect()
  }, [n])

  React.useEffect(() => {
    const stage = stageRef.current
    const canvas = canvasRef.current
    if (!stage || !canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    const L = live.current
    const reduce = reducedMotion()
    const base = reduce ? 0 : -Math.abs(speed)
    if (!L.drag) L.vel = base
    const particles: Particle[] = []
    let intensity = 0
    let spawnAcc = 0
    let last = performance.now()
    let raf = 0
    let visible = true
    let shown = ""
    let cw = 0
    let ch = 0
    let dpr = 1
    const clipCache: string[] = []
    const posCache: string[] = []
    const accentRgb = (() => {
      const m = /^#?([0-9a-f]{6})$/i.exec(accent.trim())
      const v = m ? parseInt(m[1], 16) : 0xd8fc3b
      return [(v >> 16) & 255, (v >> 8) & 255, v & 255]
    })()
    const rgba = (a: number) => "rgba(" + accentRgb[0] + "," + accentRgb[1] + "," + accentRgb[2] + "," + a + ")"

    const sizeCanvas = () => {
      const s = L.scale
      const w = L.stageW || stage.clientWidth
      const h = STAGE_H * s
      dpr = Math.min(2, window.devicePixelRatio || 1)
      if (cw !== w || ch !== h) {
        cw = w
        ch = h
        canvas.width = Math.round(w * dpr)
        canvas.height = Math.round(h * dpr)
        canvas.style.width = w + "px"
        canvas.style.height = h + "px"
      }
    }

    const drawBeam = (scanX: number, s: number) => {
      const top = (CARD_TOP - 25) * s
      const bot = (CARD_TOP + CARD_H + 40) * s
      const core = Math.max(4, 8 * s)
      // Glow measured off the reference canvas: ~50 px to the left, ~45 px to the right.
      const left = scanX - core / 2 - 56 * s
      const right = scanX + core / 2 + 48 * s
      const g = ctx.createLinearGradient(left, 0, right, 0)
      const span = right - left
      const at = (x: number) => Math.min(1, Math.max(0, (x - left) / span))
      g.addColorStop(0, rgba(0))
      g.addColorStop(at(scanX - core / 2 - 40 * s), rgba(0.1))
      g.addColorStop(at(scanX - core / 2 - 24 * s), rgba(0.25))
      g.addColorStop(at(scanX - core / 2 - 10 * s), rgba(0.52))
      g.addColorStop(at(scanX - core / 2 - 2 * s), rgba(0.9))
      g.addColorStop(at(scanX - core / 2), rgba(1))
      g.addColorStop(at(scanX + core / 2), rgba(1))
      g.addColorStop(at(scanX + core / 2 + 6 * s), rgba(0.62))
      g.addColorStop(at(scanX + core / 2 + 14 * s), rgba(0.36))
      g.addColorStop(at(scanX + core / 2 + 26 * s), rgba(0.14))
      g.addColorStop(1, rgba(0))
      ctx.save()
      ctx.fillStyle = g
      ctx.fillRect(left, top, span, bot - top)
      // Soft ends.
      ctx.globalCompositeOperation = "destination-out"
      const fade = 34 * s
      const gt = ctx.createLinearGradient(0, top, 0, top + fade)
      gt.addColorStop(0, "rgba(0,0,0,1)")
      gt.addColorStop(1, "rgba(0,0,0,0)")
      ctx.fillStyle = gt
      ctx.fillRect(left, top, span, fade)
      const gb = ctx.createLinearGradient(0, bot - fade, 0, bot)
      gb.addColorStop(0, "rgba(0,0,0,0)")
      gb.addColorStop(1, "rgba(0,0,0,1)")
      ctx.fillStyle = gb
      ctx.fillRect(left, bot - fade, span, fade)
      ctx.restore()
    }

    const frame = (now: number) => {
      raf = 0
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000))
      last = now
      const s = L.scale
      const pitch = PITCH * s
      const period = slots * pitch
      const scanX = Math.round((L.stageW || stage.clientWidth) / 2)
      if (!L.drag) {
        L.vel = reduce ? 0 : relaxVelocity(L.vel, base, dt, 0.55)
        L.offset += L.vel * dt
      }
      L.offset = wrap(L.offset, period)

      // Cards: position plus the two complementary clips at the scanner.
      let over = -1
      let overP = 0
      for (let i = 0; i < slots; i++) {
        const el = cardEls.current[i]
        if (!el) continue
        const x = slotX(i, L.offset, pitch, period)
        const pos = "translate3d(" + x.toFixed(2) + "px," + (CARD_TOP * s).toFixed(2) + "px,0) scale(" + s + ")"
        if (posCache[i] !== pos) {
          el.style.transform = pos
          posCache[i] = pos
        }
        const local = Math.min(CARD_W, Math.max(0, (scanX - x) / s))
        const clip = local.toFixed(1)
        if (clipCache[i] !== clip) {
          clipCache[i] = clip
          const f = faceEls.current[i]
          const c = codeEls.current[i]
          if (f) f.style.clipPath = "inset(0 0 0 " + clip + "px)"
          if (c) {
            c.style.clipPath = "inset(0 " + (CARD_W - local).toFixed(1) + "px 0 0)"
            c.style.visibility = local <= 0 ? "hidden" : "visible"
          }
        }
        const p = scanProgress(scanX, x, CARD_W * s)
        if (p >= 0) {
          over = i % n
          overP = p
        }
      }

      if (over >= 0) {
        const c = list[over]
        const r = tokenReadout(overP, c.original, c.compressed)
        const txt = formatTokens(r.saved) + "|" + r.percent
        if (txt !== shown) {
          shown = txt
          if (numRef.current) numRef.current.textContent = formatTokens(r.saved)
          if (pctRef.current) pctRef.current.textContent = r.percent + "% less"
        }
      }

      // Beam and shed pixels.
      sizeCanvas()
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, cw, ch)
      drawBeam(scanX, s)
      if (!reduce) {
        const target = over >= 0 ? 1 : 0
        intensity += (target - intensity) * (1 - Math.exp(-dt / (target > intensity ? 1.4 : 0.55)))
        // Spread measured off the reference canvas at full strength: median 77 px
        // from the beam, 90th percentile 165 px, 99th 220 px, card height plus ~32 px.
        spawnAcc += 860 * intensity * s * dt
        const top = CARD_TOP * s
        const hgt = CARD_H * s
        // Pixels ride with the stream when it is dragged backwards.
        const drift = Math.min(0, L.drag ? L.dragVel : L.vel)
        while (spawnAcc >= 1 && particles.length < 3400) {
          spawnAcc -= 1
          particles.push({
            x: scanX + 5 * s + (Math.random() < 0.96 ? Math.pow(Math.random(), 1.75) * 196 : 140 + Math.random() * 140) * s,
            y: top - 32 * s + Math.random() * (hgt + 64 * s),
            vx: (4 + Math.random() * 22) * s,
            vy: (Math.random() - 0.5) * 8 * s,
            age: 0,
            life: 0.7 + Math.random() * 1.5,
            size: [2, 3, 3, 4, 4, 5, 5, 6][(Math.random() * 8) | 0] * Math.max(0.6, s),
            cream: Math.random() < 0.21,
          })
        }
        if (spawnAcc > 1) spawnAcc = 0
        const reach = 300 * s
        let k = 0
        for (let i = 0; i < particles.length; i++) {
          const q = particles[i]
          q.age += dt
          q.x += (q.vx + drift * 0.15) * dt
          q.y += q.vy * dt
          const dx = q.x - scanX
          if (q.age >= q.life || dx > reach || dx < -6) continue
          particles[k++] = q
          const fadeT = Math.min(1, (q.life - q.age) / 0.25, q.age / 0.06)
          const fadeX = 1 - Math.pow(Math.min(1, dx / reach), 6)
          const a = fadeT * fadeX
          if (a <= 0.02) continue
          ctx.globalAlpha = a
          ctx.fillStyle = q.cream ? "#f1e8c7" : accent
          ctx.fillRect(Math.round(q.x), Math.round(q.y), q.size, q.size)
        }
        particles.length = k
        ctx.globalAlpha = 1
      }

      if (meterRef.current) {
        meterRef.current.style.left = scanX + "px"
        meterRef.current.style.top = CARD_TOP * s - 14 - 30 + "px"
      }

      if (visible && !document.hidden && (!reduce || L.drag)) raf = requestAnimationFrame(frame)
    }

    const kick = () => {
      if (!raf && visible && !document.hidden) {
        last = performance.now()
        raf = requestAnimationFrame(frame)
      }
    }
    const io = new IntersectionObserver((e) => {
      visible = e[0] ? e[0].isIntersecting : true
      if (visible) kick()
    })
    io.observe(stage)
    const onVis = () => kick()
    document.addEventListener("visibilitychange", onVis)
    const ro = new ResizeObserver(() => {
      if (reduce) {
        last = performance.now()
        frame(last)
      } else kick()
    })
    ro.observe(stage)

    // Drag and fling.
    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return
      L.drag = true
      L.lastX = e.clientX
      L.lastT = performance.now()
      L.dragVel = 0
      stage.dataset.drag = "1"
      try {
        stage.setPointerCapture(e.pointerId)
      } catch {}
      kick()
    }
    const onMove = (e: PointerEvent) => {
      if (!L.drag) return
      const t = performance.now()
      const dx = e.clientX - L.lastX
      const dts = Math.max(0.001, (t - L.lastT) / 1000)
      L.offset += dx
      L.dragVel = L.dragVel * 0.6 + (dx / dts) * 0.4
      L.lastX = e.clientX
      L.lastT = t
      if (reduce) {
        last = t
        frame(t)
      } else kick()
    }
    const onUp = (e: PointerEvent) => {
      if (!L.drag) return
      L.drag = false
      delete stage.dataset.drag
      const idle = performance.now() - L.lastT > 90
      L.vel = reduce ? 0 : idle ? base : Math.max(-4200, Math.min(4200, L.dragVel))
      try {
        stage.releasePointerCapture(e.pointerId)
      } catch {}
      kick()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return
      e.preventDefault()
      const dir = e.key === "ArrowLeft" ? -1 : 1
      if (reduce) {
        L.offset += dir * PITCH * L.scale * 0.25
        last = performance.now()
        frame(last)
      } else {
        L.vel += dir * 900
        kick()
      }
    }
    stage.addEventListener("pointerdown", onDown)
    stage.addEventListener("pointermove", onMove)
    stage.addEventListener("pointerup", onUp)
    stage.addEventListener("pointercancel", onUp)
    stage.addEventListener("keydown", onKey)
    kick()
    if (reduce) frame(performance.now())
    return () => {
      if (raf) cancelAnimationFrame(raf)
      io.disconnect()
      ro.disconnect()
      document.removeEventListener("visibilitychange", onVis)
      stage.removeEventListener("pointerdown", onDown)
      stage.removeEventListener("pointermove", onMove)
      stage.removeEventListener("pointerup", onUp)
      stage.removeEventListener("pointercancel", onUp)
      stage.removeEventListener("keydown", onKey)
    }
  }, [slots, n, list, speed, accent])

  const vars = {
    height,
    width: "100%",
    "--asc-accent": accent,
    "--asc-glow": "color-mix(in oklab," + accent + " 35%,transparent)",
  } as React.CSSProperties

  return (
    <div ref={rootRef} className={"asc-root" + (className ? " " + className : "")} style={vars}>
      {fontHref && <link rel="stylesheet" href={fontHref} />}
      <style>{css}</style>
      <svg className="asc-gridlines" width="100%" height="100%" aria-hidden="true">
        <defs>
          <pattern id="asc-grid-cell" width="122" height="122" patternUnits="userSpaceOnUse">
            <path d="M122 0.5H0.5V122" fill="none" stroke="#9ca3af" strokeDasharray="4 4" strokeOpacity="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#asc-grid-cell)" />
      </svg>

      <div ref={headRef} className="asc-head">
        <div>
          <p className="asc-eyebrow">{eyebrow}</p>
          <h2 className="asc-title">
            {title}
            <i>{titleItalic}</i>
          </h2>
        </div>
        <div>
          <p className="asc-desc">{description}</p>
          {ctaLabel && (
            <a className="asc-cta" href={ctaHref} style={{ background: ctaColor }}>
              {ctaLabel}
            </a>
          )}
        </div>
      </div>

      <div
        ref={stageRef}
        className="asc-stage"
        tabIndex={0}
        role="region"
        aria-roledescription="carousel"
        aria-label="Website pages passing through a scanner that rewrites them as agent markup. Drag, or use the arrow keys."
        style={{ height: STAGE_H }}
      >
        <div className="asc-fade">
          {Array.from({ length: slots }, (_, i) => {
            const c = list[i % n]
            const dup = i >= n
            return (
              <div
                key={i}
                ref={(el) => {
                  cardEls.current[i] = el
                }}
                className="asc-card"
                aria-hidden={dup ? true : undefined}
              >
                <div
                  className="asc-code"
                  ref={(el) => {
                    codeEls.current[i] = el
                  }}
                  aria-hidden="true"
                  style={{ visibility: "hidden" }}
                >
                  <div className="asc-code-main">{c.markup}</div>
                  <div className="asc-code-notes">{(c.notes || []).join("\n")}</div>
                </div>
                <div
                  className="asc-face"
                  role={dup ? undefined : "img"}
                  aria-label={dup ? undefined : c.label}
                  ref={(el) => {
                    faceEls.current[i] = el
                  }}
                >
                  {c.face}
                </div>
              </div>
            )
          })}
        </div>
        <canvas ref={canvasRef} className="asc-canvas" aria-hidden="true" />
        <div ref={meterRef} className="asc-meter" aria-hidden="true" style={{ left: "50%", top: -4 }}>
          <div className="asc-meter-label">{counterLabel}</div>
          <div className="asc-pill">
            <span ref={numRef} className="asc-pill-n">
              -0
            </span>
            <span ref={pctRef} className="asc-pill-p">
              0% less
            </span>
          </div>
        </div>
      </div>
      <span className="asc-sr">
        {list.map((c) => c.label + ": " + Math.round((1 - c.compressed / c.original) * 1000) / 10 + "% fewer tokens for agents.").join(" ")}
      </span>
    </div>
  )
}
