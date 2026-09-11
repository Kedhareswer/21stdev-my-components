"use client"

import * as React from "react"

/* ------------------------------------------------------------------ types */

export type BoardContact = { kind: "phone" | "mail" | "link"; text: string }
export type BoardRow = { title: string; lines?: string[]; date: string; ring?: boolean }
export type BoardSchool = { title: string; detail?: string[]; date: string }
export type BoardTile = { label: string; tint: string; ink?: string }

export type FlatlayResumeBoardProps = {
  /**
   * Height of the hero. Must be a definite length — the board is fitted to this
   * box, so a percentage collapses to 0px unless every ancestor up to <html>
   * has a real height. Never pass `"100%"`.
   */
  height?: string
  /** Floor for the height, so the board stays readable on short viewports. */
  minHeight?: string
  name?: string
  title?: string
  /** The smaller role lines under the title. Three fit. */
  roles?: string[]
  country?: string
  locale?: string
  contacts?: BoardContact[]
  /** Pre-broken lines for the watch face. Wrap a phrase in *stars* to bold it. */
  about?: string[]
  /** The receipt. Six rows fit before it runs past the paper. */
  items?: BoardRow[]
  education?: BoardSchool[]
  abilities?: string[]
  skills?: string[]
  tiles?: BoardTile[]
  /** Encoded into the pinned QR, for real — see README. */
  portfolioUrl?: string
  /** Encoded into the second QR, at the foot of the receipt. */
  codeUrl?: string
  /** Portrait for the card. Omit it for the drawn stand-in. */
  photo?: string
  className?: string
}

const W = 735
const H = 1035

// #region qr
/* A QR encoder, byte mode, error-correction level M, versions 1-10 (up to 213
   bytes — every URL anyone puts on a CV). A decorative QR is worse than none
   on a resume, so this produces a real, scannable matrix. */

const GF_EXP = new Uint8Array(512)
const GF_LOG = new Uint8Array(256)
for (let i = 0, x = 1; i < 255; i++) {
  GF_EXP[i] = x
  GF_LOG[x] = i
  x <<= 1
  if (x & 0x100) x ^= 0x11d
}
for (let i = 255; i < 512; i++) GF_EXP[i] = GF_EXP[i - 255]

const gmul = (a: number, b: number) => (a === 0 || b === 0 ? 0 : GF_EXP[GF_LOG[a] + GF_LOG[b]])

/* ecPerBlock, group1 blocks, group1 data codewords, group2 blocks, group2 data */
const EC_M = [
  [10, 1, 16, 0, 0],
  [16, 1, 28, 0, 0],
  [26, 1, 44, 0, 0],
  [18, 2, 32, 0, 0],
  [24, 2, 43, 0, 0],
  [16, 4, 27, 0, 0],
  [18, 4, 31, 0, 0],
  [22, 2, 38, 2, 39],
  [22, 3, 36, 2, 37],
  [26, 4, 43, 1, 44],
]
const ALIGN: number[][] = [[], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34], [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50]]
const REMAINDER = [0, 7, 7, 7, 7, 7, 0, 0, 0, 0]

function genPoly(n: number) {
  let p = [1]
  for (let i = 0; i < n; i++) {
    const next = new Array(p.length + 1).fill(0)
    for (let j = 0; j < p.length; j++) {
      next[j] ^= p[j]
      next[j + 1] ^= gmul(p[j], GF_EXP[i])
    }
    p = next
  }
  return p
}

function ecBytes(data: number[], n: number) {
  const gen = genPoly(n)
  const res = new Array(data.length + n).fill(0)
  for (let i = 0; i < data.length; i++) res[i] = data[i]
  for (let i = 0; i < data.length; i++) {
    const c = res[i]
    if (c === 0) continue
    for (let j = 0; j < gen.length; j++) res[i + j] ^= gmul(gen[j], c)
  }
  return res.slice(data.length)
}

function bch(value: number, poly: number, bits: number) {
  let v = value << bits
  const deg = poly.toString(2).length - 1
  while (v.toString(2).length - 1 >= deg) v ^= poly << (v.toString(2).length - 1 - deg)
  return (value << bits) | v
}

export function qrMatrix(text: string) {
  const bytes: number[] = []
  for (const b of new TextEncoder().encode(text)) bytes.push(b)

  let version = -1
  for (let v = 1; v <= 10; v++) {
    const spec = EC_M[v - 1]
    const capacity = spec[1] * spec[2] + spec[3] * spec[4]
    if (bytes.length * 8 + 4 + (v < 10 ? 8 : 16) <= capacity * 8) {
      version = v
      break
    }
  }
  if (version < 0) return null

  const [ecLen, g1, d1, g2, d2] = EC_M[version - 1]
  const dataCodewords = g1 * d1 + g2 * d2
  const countBits = version < 10 ? 8 : 16

  /* bit stream */
  const bits: number[] = []
  const push = (val: number, len: number) => {
    for (let i = len - 1; i >= 0; i--) bits.push((val >> i) & 1)
  }
  push(0b0100, 4)
  push(bytes.length, countBits)
  for (const b of bytes) push(b, 8)
  const cap = dataCodewords * 8
  for (let i = 0; i < 4 && bits.length < cap; i++) bits.push(0)
  while (bits.length % 8 !== 0) bits.push(0)
  const words: number[] = []
  for (let i = 0; i < bits.length; i += 8) {
    let w = 0
    for (let j = 0; j < 8; j++) w = (w << 1) | bits[i + j]
    words.push(w)
  }
  const PAD = [0xec, 0x11]
  for (let i = 0; words.length < dataCodewords; i++) words.push(PAD[i % 2])

  /* split into blocks, compute EC, interleave */
  const blocks: number[][] = []
  let at = 0
  for (let i = 0; i < g1; i++) {
    blocks.push(words.slice(at, at + d1))
    at += d1
  }
  for (let i = 0; i < g2; i++) {
    blocks.push(words.slice(at, at + d2))
    at += d2
  }
  const ecs = blocks.map((b) => ecBytes(b, ecLen))

  const stream: number[] = []
  const maxData = Math.max(d1, d2)
  for (let i = 0; i < maxData; i++) {
    for (const b of blocks) if (i < b.length) stream.push(b[i])
  }
  for (let i = 0; i < ecLen; i++) {
    for (const e of ecs) stream.push(e[i])
  }

  /* matrix */
  const size = version * 4 + 17
  const m: number[][] = Array.from({ length: size }, () => new Array(size).fill(-1))

  const finder = (r: number, c: number) => {
    for (let i = -1; i <= 7; i++) {
      for (let j = -1; j <= 7; j++) {
        const rr = r + i
        const cc = c + j
        if (rr < 0 || rr >= size || cc < 0 || cc >= size) continue
        const on =
          i >= 0 && i <= 6 && j >= 0 && j <= 6 &&
          (i === 0 || i === 6 || j === 0 || j === 6 || (i >= 2 && i <= 4 && j >= 2 && j <= 4))
        m[rr][cc] = on ? 1 : 0
      }
    }
  }
  finder(0, 0)
  finder(0, size - 7)
  finder(size - 7, 0)

  for (let i = 8; i < size - 8; i++) {
    const on = i % 2 === 0 ? 1 : 0
    m[6][i] = on
    m[i][6] = on
  }

  const onFinder = (r: number, c: number) =>
    (r <= 8 && c <= 8) || (r <= 8 && c >= size - 9) || (r >= size - 9 && c <= 8)
  for (const r of ALIGN[version - 1]) {
    for (const c of ALIGN[version - 1]) {
      if (onFinder(r, c)) continue
      for (let i = -2; i <= 2; i++) {
        for (let j = -2; j <= 2; j++) {
          m[r + i][c + j] = Math.max(Math.abs(i), Math.abs(j)) !== 1 ? 1 : 0
        }
      }
    }
  }

  m[size - 8][8] = 1 /* dark module */

  /* reserve format areas */
  const reserved: number[][] = []
  for (let i = 0; i < 9; i++) {
    if (m[8][i] < 0) { m[8][i] = 0; reserved.push([8, i]) }
    if (m[i][8] < 0) { m[i][8] = 0; reserved.push([i, 8]) }
  }
  for (let i = 0; i < 8; i++) {
    if (m[8][size - 1 - i] < 0) { m[8][size - 1 - i] = 0; reserved.push([8, size - 1 - i]) }
    if (m[size - 1 - i][8] < 0) { m[size - 1 - i][8] = 0; reserved.push([size - 1 - i, 8]) }
  }
  if (version >= 7) {
    for (let i = 0; i < 6; i++) {
      for (let j = 0; j < 3; j++) {
        m[size - 11 + j][i] = 0
        m[i][size - 11 + j] = 0
        reserved.push([size - 11 + j, i], [i, size - 11 + j])
      }
    }
  }
  const isReserved = new Set(reserved.map(([r, c]) => r * size + c))

  /* place the stream */
  const dataBits: number[] = []
  for (const w of stream) for (let i = 7; i >= 0; i--) dataBits.push((w >> i) & 1)
  for (let i = 0; i < REMAINDER[version - 1]; i++) dataBits.push(0)

  let bi = 0
  let up = true
  for (let col = size - 1; col > 0; col -= 2) {
    if (col === 6) col--
    for (let k = 0; k < size; k++) {
      const row = up ? size - 1 - k : k
      for (const c of [col, col - 1]) {
        if (m[row][c] >= 0) continue
        m[row][c] = bi < dataBits.length ? dataBits[bi] : 0
        bi++
      }
    }
    up = !up
  }

  /* masks */
  const MASKS = [
    (r: number, c: number) => (r + c) % 2 === 0,
    (r: number) => r % 2 === 0,
    (r: number, c: number) => c % 3 === 0,
    (r: number, c: number) => (r + c) % 3 === 0,
    (r: number, c: number) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0,
    (r: number, c: number) => ((r * c) % 2) + ((r * c) % 3) === 0,
    (r: number, c: number) => (((r * c) % 2) + ((r * c) % 3)) % 2 === 0,
    (r: number, c: number) => (((r + c) % 2) + ((r * c) % 3)) % 2 === 0,
  ]

  const functional: boolean[][] = Array.from({ length: size }, () => new Array(size).fill(false))
  const mark = (r: number, c: number) => { if (r >= 0 && r < size && c >= 0 && c < size) functional[r][c] = true }
  for (let i = -1; i <= 7; i++) for (let j = -1; j <= 7; j++) {
    mark(i, j); mark(i, size - 7 + j); mark(size - 7 + i, j)
  }
  for (let i = 0; i < size; i++) { mark(6, i); mark(i, 6) }
  for (const r of ALIGN[version - 1]) for (const c of ALIGN[version - 1]) {
    if (onFinder(r, c)) continue
    for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++) mark(r + i, c + j)
  }
  for (const [r, c] of reserved) mark(r, c)
  mark(size - 8, 8)

  const penalty = (g: number[][]) => {
    let score = 0
    for (let r = 0; r < size; r++) {
      let run = 1
      for (let c = 1; c < size; c++) {
        if (g[r][c] === g[r][c - 1]) run++
        else { if (run >= 5) score += run - 2; run = 1 }
      }
      if (run >= 5) score += run - 2
    }
    for (let c = 0; c < size; c++) {
      let run = 1
      for (let r = 1; r < size; r++) {
        if (g[r][c] === g[r - 1][c]) run++
        else { if (run >= 5) score += run - 2; run = 1 }
      }
      if (run >= 5) score += run - 2
    }
    for (let r = 0; r < size - 1; r++) {
      for (let c = 0; c < size - 1; c++) {
        const v = g[r][c]
        if (v === g[r][c + 1] && v === g[r + 1][c] && v === g[r + 1][c + 1]) score += 3
      }
    }
    const pat1 = [1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0]
    const pat2 = [0, 0, 0, 0, 1, 0, 1, 1, 1, 0, 1]
    const hit = (arr: number[], p: number[]) => p.every((v: number, i: number) => arr[i] === v)
    for (let r = 0; r < size; r++) {
      for (let c = 0; c + 11 <= size; c++) {
        const row = g[r].slice(c, c + 11)
        if (hit(row, pat1) || hit(row, pat2)) score += 40
      }
    }
    for (let c = 0; c < size; c++) {
      for (let r = 0; r + 11 <= size; r++) {
        const col = []
        for (let k = 0; k < 11; k++) col.push(g[r + k][c])
        if (hit(col, pat1) || hit(col, pat2)) score += 40
      }
    }
    let dark = 0
    for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) dark += g[r][c]
    const pct = (dark * 100) / (size * size)
    score += Math.floor(Math.abs(pct - 50) / 5) * 10
    return score
  }

  let best: number[][] = []
  let bestScore = Infinity
  for (let mask = 0; mask < 8; mask++) {
    const g = m.map((row) => row.slice())
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (!functional[r][c] && MASKS[mask](r, c)) g[r][c] ^= 1
      }
    }
    /* format info: level M is 0b00 */
    const fmt = bch((0b00 << 3) | mask, 0b10100110111, 10) ^ 0b101010000010010
    for (let i = 0; i <= 5; i++) g[8][i] = (fmt >> (14 - i)) & 1
    g[8][7] = (fmt >> 8) & 1
    g[8][8] = (fmt >> 7) & 1
    g[7][8] = (fmt >> 6) & 1
    for (let i = 9; i <= 14; i++) g[14 - i][8] = (fmt >> (14 - i)) & 1
    for (let i = 0; i <= 7; i++) g[size - 1 - i][8] = (fmt >> i) & 1
    for (let i = 8; i <= 14; i++) g[8][size - 15 + i] = (fmt >> i) & 1
    g[size - 8][8] = 1
    if (version >= 7) {
      const vinfo = bch(version, 0b1111100100101, 12)
      for (let i = 0; i < 18; i++) {
        const bit = (vinfo >> i) & 1
        g[Math.floor(i / 3)][size - 11 + (i % 3)] = bit
        g[size - 11 + (i % 3)][Math.floor(i / 3)] = bit
      }
    }
    const sc = penalty(g)
    if (sc < bestScore) { bestScore = sc; best = g }
  }
  return best
}
// #endregion

/* -------------------------------------------------------------------- copy */

const ROLES = ["Software Developer", "ML / Data Science", "Full-stack Engineer"]

const CONTACTS: BoardContact[] = [
  { kind: "phone", text: "+91 93989 11432" },
  { kind: "mail", text: "kedhareswer.12110626@gmail.com" },
  { kind: "link", text: "kedhar.vercel.app" },
]

const ABOUT = [
  "I am an *AI Engineer* and",
  "*Software Developer* building",
  "document intelligence and",
  "*RAG* systems at *DiligenceVault*.",
  "My work spans *LLM agents*,",
  "*retrieval systems* and",
  "full-stack product engineering.",
]

const ITEMS: BoardRow[] = [
  { title: "Software Developer", lines: ["DiligenceVault", "lead sales app, internal tools"], date: "2026-now" },
  { title: "AI Engineer Intern", lines: ["DiligenceVault", "document intelligence"], date: "2025-2026", ring: true },
  { title: "Research Intern", lines: ["upGrad Campus", "Yara rules + ML hybrid"], date: "2025" },
  { title: "QuantumPDF ChatApp", lines: ["RAG over PDFs", "adaptive chunking, vector db"], date: "2025" },
  { title: "ThesisFlow-AI", lines: ["research platform", "realtime collaboration"], date: "2025" },
  { title: "Agentic LLM Chess", lines: ["agent orchestration", "self-improvement loop"], date: "2026" },
]

const EDUCATION: BoardSchool[] = [
  { title: "B.Tech CSE", detail: ["Lovely Professional University", "Data Science (AI & ML) — CGPA 7.74"], date: "2021 - 2025" },
  { title: "higher secondary", detail: ["Sri Siddhartha Junior College", "Marks 889"], date: "2019 - 2021" },
  { title: "matriculation", detail: ["Vijaya Bharathi EM High School", "GPA 9.5"], date: "2018 - 2019" },
]

const ABILITIES = [
  "machine learning",
  "retrieval / RAG",
  "document intelligence",
  "full-stack development",
  "data science",
  "agentic LLM systems",
]

const SKILLS = ["adaptability", "communication", "collaboration", "problem-solving"]

const TILES: BoardTile[] = [
  { label: "Py", tint: "#2f4f7a", ink: "#9fd0ff" },
  { label: "TS", tint: "#20456e", ink: "#8fc7ff" },
  { label: "Re", tint: "#1c3550", ink: "#7fe3f5" },
  { label: "SQL", tint: "#4a3a1c", ink: "#ffd79a" },
]

const CSS = `
.frb-root{position:relative;width:100%;overflow:hidden;isolation:isolate;background-color:#0c0c0d;display:flex;align-items:center;justify-content:center}
.frb-l{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;display:block}
.frb-board{position:relative;display:block;width:100%;height:100%}
.frb-grain{mix-blend-mode:overlay;opacity:.4}
.frb-vig{background:radial-gradient(118% 74% at 50% 40%,rgba(0,0,0,0) 46%,rgba(0,0,0,.42) 82%,rgba(0,0,0,.7) 100%)}
.frb-sans{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif}
.frb-sr{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
`

/* ------------------------------------------------------------------ board */

export default function FlatlayResumeBoard({
  height = "100svh",
  minHeight = "640px",
  name = "Kedhareswer N.",
  title = "AI Engineer",
  roles = ROLES,
  country = "CTRY.INDIA",
  locale = "LOC.MADANAPALLE",
  contacts = CONTACTS,
  about = ABOUT,
  items = ITEMS,
  education = EDUCATION,
  abilities = ABILITIES,
  skills = SKILLS,
  tiles = TILES,
  portfolioUrl = "https://kedhar.vercel.app/",
  codeUrl = "https://github.com/Kedhareswer",
  photo,
  className = "",
}: FlatlayResumeBoardProps) {
  const uid = "frb" + React.useId().replace(/[^a-zA-Z0-9]/g, "")
  const id = (n: string) => uid + "-" + n
  const u = (n: string) => "url(#" + uid + "-" + n + ")"

  // The matrices only change when the URLs do, and the encoder is not cheap.
  const portfolioQr = React.useMemo(() => qrMatrix(portfolioUrl), [portfolioUrl])
  const codeQr = React.useMemo(() => qrMatrix(codeUrl), [codeUrl])

  /** Draws a matrix into a box, quiet zone included. */
  const qr = (m: number[][] | null, x: number, y: number, box: number, ink = "#111") => {
    if (!m || m.length === 0) return <rect x={x} y={y} width={box} height={box} fill="#ddd" />
    const quiet = 2
    const n = m.length + quiet * 2
    const s = box / n
    const cells: React.ReactNode[] = []
    for (let r = 0; r < m.length; r++) {
      for (let c = 0; c < m.length; c++) {
        if (m[r][c] !== 1) continue
        cells.push(
          <rect key={r + "-" + c} x={(c + quiet) * s} y={(r + quiet) * s} width={s * 1.04} height={s * 1.04} />,
        )
      }
    }
    return (
      <g transform={"translate(" + x + " " + y + ")"}>
        <rect width={box} height={box} fill="#f4f2ee" />
        <g fill={ink}>{cells}</g>
      </g>
    )
  }

  /** *stars* mark an emphasised run inside a pre-broken line. */
  const emphasised = (line: string, key: number, x: number, y: number, size: number) => {
    const parts = line.split("*")
    return (
      <text key={key} className="frb-sans" x={x} y={y} fontSize={size} fill="#e9e9ea">
        {parts.map((part, i) =>
          i % 2 === 1 ? (
            <tspan key={i} fontWeight="700" fill="#ffffff">
              {part}
            </tspan>
          ) : (
            <tspan key={i}>{part}</tspan>
          ),
        )}
      </text>
    )
  }

  const contactIcon = (kind: BoardContact["kind"], cx: number, cy: number) => (
    <g>
      <circle cx={cx} cy={cy} r="7.2" fill="#2b2b2d" />
      <g fill="none" stroke="#f2f2f2" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round">
        {kind === "phone" ? (
          <path d={"M" + (cx - 2.6) + " " + (cy - 3.2) + "l1.9 1.9-1.1 1.5a5.2 5.2 0 0 0 2.6 2.6l1.5-1.1 1.9 1.9-1.2 1.2a7.4 7.4 0 0 1-6.8-6.8Z"} fill="#f2f2f2" stroke="none" />
        ) : null}
        {kind === "mail" ? (
          <>
            <rect x={cx - 4} y={cy - 2.8} width="8" height="5.6" rx="0.8" />
            <path d={"M" + (cx - 4) + " " + (cy - 2.4) + "l4 2.8 4-2.8"} />
          </>
        ) : null}
        {kind === "link" ? (
          <>
            <path d={"M" + (cx - 0.4) + " " + (cy + 1.6) + "a2.4 2.4 0 0 1 0-3.4l1.8-1.8a2.4 2.4 0 0 1 3.4 3.4l-0.9 0.9"} />
            <path d={"M" + (cx + 0.4) + " " + (cy - 1.6) + "a2.4 2.4 0 0 1 0 3.4l-1.8 1.8a2.4 2.4 0 0 1-3.4-3.4l0.9-0.9"} />
          </>
        ) : null}
      </g>
    </g>
  )

  /** Stand-in portrait — the default cannot be a URL, see README. */
  const drawnPhoto = (w: number, h: number) => (
    <g>
      <rect width={w} height={h} fill="#1a1c20" />
      <rect width={w} height={h * 0.55} fill="#24272c" />
      <ellipse cx={w * 0.5} cy={h * 0.36} rx={w * 0.5} ry={h * 0.3} fill="#2b2f35" />
      <path
        d={
          "M" + w * 0.14 + " " + h +
          "C" + w * 0.16 + " " + h * 0.74 + " " + w * 0.3 + " " + h * 0.62 + " " + w * 0.5 + " " + h * 0.62 +
          "C" + w * 0.7 + " " + h * 0.62 + " " + w * 0.84 + " " + h * 0.74 + " " + w * 0.86 + " " + h +
          "Z"
        }
        fill="#101114"
      />
      <ellipse cx={w * 0.5} cy={h * 0.42} rx={w * 0.16} ry={h * 0.13} fill="#4a453f" />
      <path
        d={
          "M" + w * 0.33 + " " + h * 0.42 +
          "C" + w * 0.32 + " " + h * 0.26 + " " + w * 0.4 + " " + h * 0.2 + " " + w * 0.5 + " " + h * 0.2 +
          "C" + w * 0.6 + " " + h * 0.2 + " " + w * 0.68 + " " + h * 0.26 + " " + w * 0.67 + " " + h * 0.42 +
          "C" + w * 0.64 + " " + h * 0.33 + " " + w * 0.58 + " " + h * 0.31 + " " + w * 0.48 + " " + h * 0.32 +
          "C" + w * 0.4 + " " + h * 0.33 + " " + w * 0.35 + " " + h * 0.36 + " " + w * 0.33 + " " + h * 0.42 +
          "Z"
        }
        fill="#131417"
      />
      <ellipse cx={w * 0.5} cy={h * 0.58} rx={w * 0.09} ry={h * 0.05} fill="#3c3832" />
    </g>
  )

  const allText = [
    name, title, ...roles, country, locale,
    ...contacts.map((c) => c.text),
    ...about.map((a) => a.replace(/\*/g, "")),
    ...items.map((i) => i.title + " " + (i.lines ?? []).join(" ") + " " + i.date),
    ...education.map((e) => e.title + " " + (e.detail ?? []).join(" ") + " " + e.date),
    ...abilities, ...skills, ...tiles.map((t) => t.label),
    portfolioUrl, codeUrl,
  ]

  /** A deterministic torn edge, so the paper is never a ruled rectangle. */
  const torn = (x: number, y: number, w: number, amp: number, seed: number, step = 11) => {
    let d = "M" + x + " " + y
    for (let i = 1; i * step <= w; i++) {
      const t = Math.sin((i + seed) * 12.9898) * 43758.5453
      const j = ((t - Math.floor(t)) * 2 - 1) * amp
      d += "L" + (x + i * step) + " " + (y + j)
    }
    return d + "L" + (x + w) + " " + y
  }

  return (
    <section className={"frb-root " + className} style={{ height, minHeight }}>
      <style>{CSS}</style>
      <div className="frb-sr">
        <h1>{name} — {title}</h1>
        {allText.map((t, i) => (
          <p key={i}>{t}</p>
        ))}
      </div>

      <svg className="frb-board" viewBox={"0 0 " + W + " " + H} preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        <defs>
          <filter id={id("grain")} x="0%" y="0%" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" seed="13" stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
            <feComponentTransfer>
              <feFuncA type="linear" slope="0" intercept="1" />
            </feComponentTransfer>
          </filter>
          <filter id={id("weave")} x="0%" y="0%" width="100%" height="100%">
            <feTurbulence type="turbulence" baseFrequency="0.5 0.5" numOctaves="3" seed="7" stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
            <feComponentTransfer>
              <feFuncA type="linear" slope="0" intercept="1" />
              <feFuncR type="linear" slope="0.3" intercept="0.06" />
              <feFuncG type="linear" slope="0.3" intercept="0.06" />
              <feFuncB type="linear" slope="0.3" intercept="0.07" />
            </feComponentTransfer>
          </filter>
          <filter id={id("drop")} x="-24%" y="-20%" width="152%" height="150%">
            <feDropShadow dx="2" dy="5" stdDeviation="5" floodColor="#000" floodOpacity="0.62" />
          </filter>
          <filter id={id("drop2")} x="-30%" y="-26%" width="164%" height="158%">
            <feDropShadow dx="1.6" dy="3.4" stdDeviation="3" floodColor="#000" floodOpacity="0.55" />
          </filter>
          <filter id={id("soft")} x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="5" />
          </filter>
          <pattern id={id("perf")} patternUnits="userSpaceOnUse" width="14" height="14">
            <circle cx="7" cy="7" r="1.7" fill="#b9b6ae" opacity="0.75" />
          </pattern>
          <linearGradient id={id("paper")} x1="0" y1="0" x2="0.4" y2="1">
            <stop offset="0" stopColor="#f6f4ef" />
            <stop offset="0.5" stopColor="#eceae3" />
            <stop offset="1" stopColor="#dedbd2" />
          </linearGradient>
          <linearGradient id={id("sheet")} x1="0" y1="0" x2="0.3" y2="1">
            <stop offset="0" stopColor="#e9e7e0" />
            <stop offset="1" stopColor="#cfccc3" />
          </linearGradient>
          <linearGradient id={id("wood")} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#e0b878" />
            <stop offset="0.5" stopColor="#cfa363" />
            <stop offset="1" stopColor="#b98c4e" />
          </linearGradient>
          <linearGradient id={id("steel")} x1="0" y1="0" x2="0.4" y2="1">
            <stop offset="0" stopColor="#6f7378" />
            <stop offset="0.35" stopColor="#3a3d41" />
            <stop offset="1" stopColor="#17181b" />
          </linearGradient>
          <linearGradient id={id("cloth")} x1="0" y1="0" x2="0.4" y2="1">
            <stop offset="0" stopColor="#8d8d8a" />
            <stop offset="1" stopColor="#5f5f5d" />
          </linearGradient>
          {tiles.map((t, i) => (
            <linearGradient key={i} id={id("tile" + i)} x1="0" y1="0" x2="0.3" y2="1">
              <stop offset="0" stopColor={t.tint} stopOpacity="1" />
              <stop offset="1" stopColor="#0d1118" />
            </linearGradient>
          ))}
        </defs>

        {/* the desk */}
        <rect width={W} height={H} fill="#0c0c0d" />
        <rect width={W} height={H} filter={u("weave")} opacity="0.5" style={{ mixBlendMode: "screen" }} />
        <ellipse cx="300" cy="380" rx="420" ry="380" fill="#2a2b2e" opacity="0.4" filter={u("soft")} />

        {/* perforated sheet behind the top-left block */}
        <g filter={u("drop")}>
          <path d={torn(58, 16, 300, 4, 3) + "L358 470L58 470Z"} fill={u("sheet")} />
          <rect x="58" y="22" width="300" height="444" fill={u("perf")} opacity="0.55" />
        </g>

        {/* photo + name card */}
        <g filter={u("drop")}>
          <rect x="38" y="82" width="312" height="220" fill={u("paper")} />
          <g transform="translate(44 88)">
            {photo ? (
              <image href={photo} x="0" y="0" width="132" height="164" preserveAspectRatio="xMidYMid slice" />
            ) : (
              drawnPhoto(132, 164)
            )}
          </g>
          <text className="frb-sans" x="190" y="120" fontSize="21" fontWeight="700" fill="#1b1b1c" textLength="150" lengthAdjust="spacing">{name}</text>
          <text className="frb-sans" x="190" y="139" fontSize="13" fontWeight="600" fill="#2c2c2e">{title}</text>
          {roles.slice(0, 3).map((r, i) => (
            <text key={i} className="frb-sans" x="190" y={157 + i * 14} fontSize="9.2" fontStyle="italic" fill="#4c4c4e">{r}</text>
          ))}
          <g>
            <rect x="190" y="196" width="152" height="19" fill="none" stroke="#2b2b2d" strokeWidth="1" />
            <line x1="266" y1="196" x2="266" y2="215" stroke="#2b2b2d" strokeWidth="1" />
            <text className="frb-sans" x="196" y="209" fontSize="7.2" fill="#2b2b2d">{country}</text>
            <text className="frb-sans" x="272" y="209" fontSize="7.2" fill="#2b2b2d">{locale}</text>
          </g>
          {contacts.slice(0, 3).map((c, i) => (
            <g key={i}>
              {contactIcon(c.kind, 198, 229 + i * 18)}
              <text className="frb-sans" x="211" y={232 + i * 18} fontSize="8" fill="#2b2b2d">{c.text}</text>
            </g>
          ))}
          {/* the one the arrow points at */}
          <ellipse cx="266" cy="265" rx="62" ry="10.5" fill="none" stroke="#c62a22" strokeWidth="1.6" transform="rotate(-2 266 265)" />
        </g>
        <path d="M330 262C356 248 380 226 402 206" fill="none" stroke="#c62a22" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M402 208L392 218M402 208L394 224" fill="none" stroke="#c62a22" strokeWidth="1.8" strokeLinecap="round" />

        {/* "my portfolio" — a real QR, pinned */}
        <g filter={u("drop")}>
          <path d={torn(412, 52, 188, 5, 9) + "L600 212L412 212Z"} fill="#f7f5f0" />
          {qr(portfolioQr, 452, 78, 116)}
        </g>
        <g transform="rotate(-2 500 66)" filter={u("drop2")}>
          <rect x="418" y="48" width="150" height="30" rx="12" fill="#fbfaf7" />
          <text className="frb-sans" x="493" y="68" fontSize="14" fontStyle="italic" fontWeight="600" textAnchor="middle" fill="#1c1c1d">my portfolio</text>
        </g>
        <g stroke="#c9c7c2" strokeWidth="1.6" strokeLinecap="round" opacity="0.8">
          <path d="M612 58L624 70M624 58L612 70" />
          <path d="M646 56L658 68M658 56L646 68" />
        </g>

        {/* the watch */}
        <g filter={u("drop")}>
          <rect x="128" y="276" width="224" height="206" rx="46" fill={u("steel")} />
          <rect x="136" y="284" width="208" height="190" rx="40" fill="#0a0a0b" />
          <rect x="145" y="293" width="190" height="172" rx="32" fill="#131315" />
          <rect x="354" y="344" width="9" height="30" rx="4" fill="#5c6065" />
          <rect x="354" y="386" width="7" height="20" rx="3" fill="#3d4145" />
          <g>
            <rect x="158" y="306" width="78" height="21" rx="10.5" fill="#2a2a2c" />
            <text className="frb-sans" x="197" y="321" fontSize="11" fontWeight="600" textAnchor="middle" fill="#ffffff">about me</text>
            <rect x="262" y="309" width="22" height="11" rx="3" fill="none" stroke="#4ade80" strokeWidth="1.2" />
            <rect x="264" y="311" width="14" height="7" fill="#4ade80" />
            <text className="frb-sans" x="322" y="321" fontSize="13" fontWeight="600" textAnchor="middle" fill="#ffffff">12:15</text>
          </g>
          {about.slice(0, 8).map((line, i) => emphasised(line, i, 158, 349 + i * 15, 10.4))}
        </g>

        {/* the receipt */}
        <g filter={u("drop")}>
          <path d={torn(358, 190, 344, 6, 5) + "L702 726L358 726Z"} fill={u("paper")} />
          <g opacity="0.5">
            <path d="M408 200C430 300 402 420 424 540C440 630 420 690 408 726" fill="none" stroke="#cfccc4" strokeWidth="1.2" />
            <path d="M556 196C572 300 548 400 566 520C580 620 566 690 556 726" fill="none" stroke="#cfccc4" strokeWidth="1.2" />
            <path d="M358 300C450 316 560 296 702 312" fill="none" stroke="#d6d3cb" strokeWidth="1.4" />
            <path d="M358 470C470 486 580 464 702 480" fill="none" stroke="#d6d3cb" strokeWidth="1.4" />
          </g>
          {/* coffee ring */}
          <g opacity="0.5">
            <circle cx="622" cy="248" r="46" fill="none" stroke="#a9884f" strokeWidth="7" opacity="0.42" />
            <circle cx="622" cy="248" r="40" fill="#c0a06a" opacity="0.18" />
          </g>
          <text className="frb-sans" x="424" y="272" fontSize="23" fill="#1e1e1f">the</text>
          <text className="frb-sans" x="424" y="308" fontSize="36" fontWeight="700" fill="#141415" letterSpacing="-0.5">experience</text>
          <text className="frb-sans" x="524" y="336" fontSize="23" fill="#1e1e1f">shop</text>
          <text className="frb-sans" x="416" y="368" fontSize="10" fill="#6c6a66">items</text>
          <text className="frb-sans" x="612" y="368" fontSize="10" fill="#6c6a66">date</text>
          {items.slice(0, 6).map((row, i) => {
            const y = 392 + i * 47
            return (
              <g key={i}>
                <text className="frb-sans" x="416" y={y} fontSize="14.5" fontWeight="700" fill="#141415">{row.title}</text>
                <line x1="416" y1={y + 5} x2="604" y2={y + 5} stroke="#9c9a95" strokeWidth="1" strokeDasharray="1.5 3.5" opacity="0.75" />
                <text className="frb-sans" x="608" y={y} fontSize="12.5" fontWeight="700" fill="#141415">{row.date}</text>
                {(row.lines ?? []).slice(0, 2).map((l, j) => (
                  <text key={j} className="frb-sans" x="416" y={y + 14 + j * 11} fontSize="8.6" fill="#84827d">{l}</text>
                ))}
                {row.ring ? (
                  <ellipse cx={416 + row.title.length * 3.9} cy={y - 4} rx={row.title.length * 4.6} ry="14" fill="none" stroke="#c62a22" strokeWidth="1.7" transform={"rotate(-1.5 " + (416 + row.title.length * 3.9) + " " + (y - 4) + ")"} />
                ) : null}
              </g>
            )
          })}
          {/* second QR, at the foot */}
          <g>
            <rect x="416" y="644" width="96" height="40" rx="4" fill="#111113" />
            <text className="frb-sans" x="464" y="672" fontSize="18" fontWeight="800" textAnchor="middle" fill="#f5c518" letterSpacing="0.5">CODE</text>
            <text className="frb-sans" x="416" y="698" fontSize="7.6" fill="#6c6a66">scan the code</text>
            <text className="frb-sans" x="416" y="708" fontSize="7.6" fill="#6c6a66">to view GitHub</text>
            {qr(codeQr, 560, 638, 76)}
          </g>
        </g>

        {/* education */}
        <g filter={u("drop2")} transform="rotate(-1 172 498)">
          <path d={torn(92, 478, 160, 3.5, 21, 9) + "L252 520L92 520Z"} fill="#efece5" />
          <text className="frb-sans" x="104" y="510" fontSize="22" fill="#1b1b1c">education</text>
        </g>
        <g filter={u("drop2")}>
          <rect x="100" y="524" width="232" height="152" fill="#f6f4ef" />
          <g stroke="#c8d4e2" strokeWidth="0.7" opacity="0.9">
            {Array.from({ length: 9 }, (_, i) => (
              <line key={i} x1="108" y1={546 + i * 15} x2="324" y2={546 + i * 15} />
            ))}
          </g>
          <g fill="#b9b6ae">
            {Array.from({ length: 7 }, (_, i) => (
              <circle key={i} cx="107" cy={540 + i * 21} r="2.6" />
            ))}
          </g>
          {education.slice(0, 3).map((e, i) => {
            const y = 552 + i * 44
            return (
              <g key={i}>
                <text className="frb-sans" x="118" y={y} fontSize="12.5" fontWeight="700" fill="#171718">{e.title}</text>
                <text className="frb-sans" x="324" y={y} fontSize="8.6" textAnchor="end" fill="#3a3a3c">{e.date}</text>
                {(e.detail ?? []).slice(0, 2).map((d, j) => (
                  <text key={j} className="frb-sans" x="118" y={y + 12 + j * 10} fontSize="7.8" fill="#77756f">{d}</text>
                ))}
              </g>
            )
          })}
        </g>

        {/* abilities, on a lolly stick */}
        <g filter={u("drop2")} transform="rotate(-1.2 197 694)">
          <rect x="42" y="676" width="310" height="36" rx="17" fill={u("wood")} />
          <g stroke="#a87f45" strokeWidth="0.7" opacity="0.45">
            <path d="M56 686C130 682 230 690 338 685" fill="none" />
            <path d="M56 700C140 704 240 696 338 702" fill="none" />
          </g>
          <text className="frb-sans" x="70" y="702" fontSize="20" fontWeight="700" fill="#fdfbf6" stroke="#8a6531" strokeWidth="0.7">abilities</text>
        </g>
        <g filter={u("drop2")}>
          <rect x="106" y="714" width="212" height="124" fill="#fbfaf6" />
          <g stroke="#d3d8dd" strokeWidth="0.5" opacity="0.9">
            {Array.from({ length: 13 }, (_, i) => (
              <line key={"h" + i} x1="110" y1={718 + i * 10} x2="314" y2={718 + i * 10} />
            ))}
            {Array.from({ length: 21 }, (_, i) => (
              <line key={"v" + i} x1={110 + i * 10} y1="716" x2={110 + i * 10} y2="836" />
            ))}
          </g>
          <g fill="#bcb9b1">
            {Array.from({ length: 6 }, (_, i) => (
              <circle key={i} cx="113" cy={726 + i * 20} r="2.3" />
            ))}
          </g>
          {abilities.slice(0, 6).map((a, i) => (
            <text
              key={i}
              className="frb-sans"
              x="128"
              y={734 + i * 17}
              fontSize="11"
              fill="#26262a"
              transform={"skewX(-8) translate(" + (734 + i * 17) * 0.14 + " 0)"}
            >
              {a}
            </text>
          ))}
        </g>

        {/* skills */}
        <g transform="rotate(-1 98 858)">
          <rect x="52" y="842" width="98" height="26" rx="4" fill="#8fe3f0" opacity="0.5" />
          <text className="frb-sans" x="60" y="863" fontSize="20" fontWeight="700" fill="#f2fbff">skills</text>
        </g>
        {skills.slice(0, 4).map((s, i) => (
          <g key={i} filter={u("drop2")} transform={"rotate(" + (i % 2 ? 1.2 : -0.8) + " " + (180 + i * 14) + " " + (884 + i * 32) + ")"}>
            <rect x={44 + i * 14} y={870 + i * 32} width={228 - i * 4} height="30" rx="4" fill="#e8e6e0" />
            <text className="frb-sans" x={58 + i * 14} y={891 + i * 32} fontSize="15.5" fontStyle="italic" fontWeight="600" fill="#1d1d1f">{s}</text>
          </g>
        ))}
        {/* barcode on the top strip */}
        <g transform="rotate(-1 260 876)">
          <rect x="236" y="862" width="58" height="28" fill="#f4f2ec" />
          <g fill="#1b1b1c">
            {Array.from({ length: 17 }, (_, i) => (
              <rect key={i} x={240 + i * 3.1} y="866" width={i % 3 === 0 ? 1.7 : 0.9} height="20" />
            ))}
          </g>
        </g>

        {/* the SD card */}
        <g filter={u("drop")} transform="rotate(-4 377 723)">
          <path d="M336 686L404 686L418 700L418 762L336 762Z" fill="#1a1a1c" />
          <path d="M336 686L404 686L418 700L418 706L336 706Z" fill="#232326" />
          <g fill="#c9a23f">
            {Array.from({ length: 8 }, (_, i) => (
              <rect key={i} x={342 + i * 9} y="690" width="6" height="12" rx="1.5" />
            ))}
          </g>
          <text className="frb-sans" x="346" y="734" fontSize="13.5" fontWeight="700" fill="#f3f3f3">software</text>
          <text className="frb-sans" x="346" y="750" fontSize="13.5" fontWeight="700" fill="#f3f3f3">skills</text>
        </g>

        {/* the cloth, and the app tiles on it */}
        <g>
          <path d="M396 766L672 758L682 950L410 968Z" fill={u("cloth")} opacity="0.92" />
          <path d="M396 766L672 758L682 950L410 968Z" fill="none" stroke="#9b9b98" strokeWidth="1" opacity="0.4" />
          <path d="M396 766L672 758L682 950L410 968Z" filter={u("weave")} opacity="0.35" style={{ mixBlendMode: "overlay" }} />
        </g>
        {tiles.slice(0, 4).map((t, i) => {
          const x = 418 + (i % 2) * 114
          const y = 782 + Math.floor(i / 2) * 96
          return (
            <g key={i} filter={u("drop")} transform={"rotate(" + (i % 2 ? 1.5 : -1.5) + " " + (x + 40) + " " + (y + 40) + ")"}>
              <rect x={x} y={y} width="80" height="80" rx="19" fill={u("tile" + i)} />
              <rect x={x + 2} y={y + 2} width="76" height="76" rx="17" fill="none" stroke="#cfd6e0" strokeWidth="2" opacity="0.75" />
              <rect x={x + 6} y={y + 6} width="68" height="30" rx="13" fill="#ffffff" opacity="0.07" />
              <text
                className="frb-sans"
                x={x + 40}
                y={y + 54}
                fontSize={t.label.length > 2 ? 26 : 33}
                fontWeight="700"
                textAnchor="middle"
                fill={t.ink ?? "#dfe8f5"}
              >
                {t.label}
              </text>
            </g>
          )
        })}

        {/* the desk's own clutter */}
        <g>
          {/* cable, top left */}
          <path d="M40 -6C74 34 46 70 18 96" fill="none" stroke="#e9e7e2" strokeWidth="5" strokeLinecap="round" opacity="0.9" />
          <path d="M40 -6C74 34 46 70 18 96" fill="none" stroke="#b9b7b2" strokeWidth="1.4" strokeLinecap="round" opacity="0.5" />
          {/* leaves, top right */}
          <g fill="#1d3a24" opacity="0.95">
            <path d="M735 18C700 26 676 48 668 78C702 74 726 54 735 26Z" />
            <path d="M735 66C704 78 686 102 682 132C712 122 730 100 735 74Z" />
            <path d="M700 8C688 36 690 64 706 86C716 60 714 30 702 10Z" />
          </g>
          {/* red string */}
          <path d="M-4 336C22 356 20 388 2 408" fill="none" stroke="#b3251c" strokeWidth="4" strokeLinecap="round" />
          <path d="M0 944C34 930 62 950 74 978C42 986 12 972 -2 950" fill="none" stroke="#b3251c" strokeWidth="4" strokeLinecap="round" />
          {/* gold clips */}
          <g fill="none" stroke="#d8b451" strokeWidth="3.4" strokeLinecap="round">
            <path d="M64 106C62 128 62 150 64 168C66 180 80 180 82 168C84 150 84 128 82 110" />
            <path d="M330 474C328 496 328 516 330 532C332 544 346 544 348 532C350 516 350 496 348 480" />
          </g>
          {/* smiley sticker */}
          <g transform="rotate(-8 62 366)">
            <circle cx="62" cy="366" r="22" fill="#f2c33d" />
            <circle cx="62" cy="366" r="22" fill="none" stroke="#c99b22" strokeWidth="1.4" />
            <circle cx="54" cy="359" r="3.2" fill="#1c1c1c" />
            <circle cx="70" cy="359" r="3.2" fill="#1c1c1c" />
            <path d="M51 372C56 380 68 380 73 372" fill="none" stroke="#1c1c1c" strokeWidth="3" strokeLinecap="round" />
          </g>
          {/* tape */}
          <g opacity="0.32">
            <rect x="352" y="196" width="52" height="20" rx="1" fill="#ffffff" transform="rotate(-6 378 206)" />
            <rect x="86" y="656" width="46" height="18" rx="1" fill="#ffffff" transform="rotate(4 109 665)" />
          </g>
          {/* staple */}
          <g stroke="#9aa0a6" strokeWidth="2.4" fill="none" strokeLinecap="round">
            <path d="M462 186L462 176L486 176L486 186" transform="rotate(-4 474 181)" />
          </g>
        </g>

        {/* grain over the whole board */}
        <rect width={W} height={H} filter={u("grain")} opacity="0.16" style={{ mixBlendMode: "overlay" }} />
      </svg>

      <div className="frb-l frb-vig" />
    </section>
  )
}
