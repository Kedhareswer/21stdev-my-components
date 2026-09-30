"use client"

import * as React from "react"

/**
 * Postcard Contact — a contact form written on the back of a vintage postcard.
 *
 * The visitor writes the message on the left, the way you would on a real
 * card, and fills the address side on the right: name, email, address, phone.
 * The stamp is a picker — tap it to choose another design.
 *
 * Send postmarks the stamp, slips the card into a parchment envelope, folds the
 * flap, presses a wax seal and writes a note across the back in ink, then the
 * envelope flies off and a thank-you card takes its place. If `onSend` throws,
 * the envelope comes back stamped RETURN TO SENDER and the card can be opened
 * up again with everything still on it.
 *
 * Nothing is loaded. The paper and parchment are SVG noise, the palm fronds are
 * generated, the POSTCARD lettering and the stamps are drawn in the file — so
 * the whole scene works offline and inside a capture sandbox.
 */

export type PostcardField = "firstName" | "lastName" | "email" | "address" | "phone" | "subject" | "message"

export type PostcardData = {
  firstName: string
  lastName: string
  email: string
  address: string
  phone: string
  subject: string
  message: string
  /** Id of the stamp the visitor picked. */
  stamp: string
}

export type StampDesign = {
  id: string
  /** Handwritten on the stamp. `\n` breaks a line. */
  caption: string
  /** Colour of the perforated frame. */
  frame?: string
  /** Colour of the caption. */
  captionColor?: string
  /** Your own art, drawn into a 100 × 120 viewBox. Replaces the built-in art. */
  art?: React.ReactNode
}

export type PostcardScene = "tropic" | "dusk" | "none"

export type PostcardContactProps = {
  /** Called with the form when the envelope is sealed. Throw (or reject) to bounce it back. */
  onSend?: (data: PostcardData) => void | Promise<unknown>
  /** Your name. Signs the thank-you card. */
  recipient?: string
  /** Optional lines on the address side. `firstName` and `email` are always there. */
  fields?: ("lastName" | "address" | "phone")[]
  /** Fields that must be filled before it can be sent. */
  required?: PostcardField[]
  /** Show the subject line above the message. */
  showSubject?: boolean
  defaultValues?: Partial<PostcardData>
  /** Handwritten across the sealed envelope. `{firstName}` and friends are filled in. */
  envelopeNote?: string
  /** Title of the thank-you card. Same `{field}` tokens. */
  thanksTitle?: string
  /** Body of the thank-you card. */
  thanksBody?: string
  /** Written above the visitor's signature. */
  signoff?: string
  subjectPlaceholder?: string
  messagePlaceholder?: string
  /** Printed small caps over the message side. */
  messageLabel?: string
  /** Printed small caps under the POSTCARD lettering. */
  addressLabel?: string
  /** Printed up the middle divider, like a publisher's imprint. */
  imprint?: string
  /** Text on the send button. */
  sendLabel?: string
  /** Stamp designs the visitor can cycle through. The first is the default. */
  stamps?: StampDesign[]
  /** Longest message, in characters. The writing gets smaller as it fills up. */
  maxLength?: number
  /** The backdrop. `none` leaves the host page showing. */
  scene?: PostcardScene
  /** Handwriting face. A component cannot load fonts — see the README. */
  fontFamily?: string
  /** Signature face. */
  signatureFamily?: string
  /** Face of the printed parts. */
  printFamily?: string
  /** Handwriting colour. */
  ink?: string
  /** Colour of the printed parts: rules, lettering, labels. */
  printInk?: string
  /** Postcard stock. */
  paper?: string
  /** Envelope stock. */
  envelope?: string
  /** Wax seal colour. `false` for no seal. */
  seal?: string | false
  /** Width of the postcard. */
  width?: string
  /** Minimum height of the whole section. Content taller than this grows it. */
  height?: string
  className?: string
}

// #region postcard
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export const EMPTY: PostcardData = {
  firstName: "",
  lastName: "",
  email: "",
  address: "",
  phone: "",
  subject: "",
  message: "",
  stamp: "",
}

const FIELD_NAMES: Record<PostcardField, string> = {
  firstName: "your first name",
  lastName: "your last name",
  email: "an email",
  address: "an address",
  phone: "a phone number",
  subject: "a subject",
  message: "a few words",
}

/** Every problem with the form, keyed by field. Empty when it can be sent. */
export const validate = (data: PostcardData, required: PostcardField[]): Partial<Record<PostcardField, string>> => {
  const out: Partial<Record<PostcardField, string>> = {}
  for (const f of required) {
    if (!String(data[f] || "").trim()) out[f] = "add " + FIELD_NAMES[f]
  }
  const email = data.email.trim()
  if (email && !EMAIL_RE.test(email)) out.email = "that email looks off"
  const phone = data.phone.trim()
  if (phone && phone.replace(/\D/g, "").length < 6) out.phone = "a few digits short"
  return out
}

/** Fills `{firstName}`-style tokens. A missing first name reads "a friend". */
export const fillTemplate = (tpl: string, data: PostcardData): string =>
  tpl.replace(/\{(\w+)\}/g, (_m, key: string) => {
    const v = String((data as Record<string, string>)[key] || "").trim()
    if (v) return v
    return key === "firstName" ? "a friend" : ""
  }).replace(/\s+([,.!?])/g, "$1").trim()

/** Writing shrinks as the message fills the card, like someone running out of room. */
export const messageScale = (length: number, max: number): number => {
  const m = max > 0 ? max : 1
  const t = Math.min(1, Math.max(0, length / m))
  return Math.round((1 - 0.3 * Math.pow(t, 0.8)) * 1000) / 1000
}

/** Largest scale that fits a w × h card inside an envelope, leaving a margin. */
export const fitInside = (w: number, h: number, ew: number, eh: number, margin: number): number => {
  if (!(w > 0 && h > 0 && ew > 0 && eh > 0)) return 1
  return Math.max(0, Math.min((ew * (1 - margin)) / w, (eh * (1 - margin)) / h))
}

/** An envelope for a card of this size: 1.6 : 1, as wide as the card allows. */
export const envelopeFor = (w: number, h: number): { w: number; h: number } => {
  const ew = Math.min(w * 0.94, h * 1.6 * 0.96)
  return { w: ew, h: ew / 1.6 }
}

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"]

export const postmarkDate = (d: Date): string =>
  String(d.getDate()).padStart(2, "0") + " " + MONTHS[d.getMonth()] + " " + d.getFullYear()

export const mulberry32 = (seed: number): (() => number) => {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const f1 = (v: number): string => (Math.round(v * 10) / 10).toString()

/**
 * One palm frond as filled path data: a drooping stem with leaflets down both
 * sides, longest in the middle. `ang` is where it points, `bend` how far
 * gravity pulls the tip down.
 */
export const frondPath = (
  ox: number,
  oy: number,
  ang: number,
  len: number,
  bend: number,
  leaf: number,
  count: number,
  seed: number,
): string => {
  const rnd = mulberry32(seed)
  const dx = Math.cos(ang)
  const dy = Math.sin(ang)
  const cx = ox + dx * len * 0.55
  const cy = oy + dy * len * 0.55 - bend * len * 0.2
  const tx = ox + dx * len
  const ty = oy + dy * len + bend * len
  const at = (t: number): number[] => {
    const u = 1 - t
    return [u * u * ox + 2 * u * t * cx + t * t * tx, u * u * oy + 2 * u * t * cy + t * t * ty]
  }
  const tangent = (t: number): number[] => {
    const gx = 2 * (1 - t) * (cx - ox) + 2 * t * (tx - cx)
    const gy = 2 * (1 - t) * (cy - oy) + 2 * t * (ty - cy)
    const l = Math.hypot(gx, gy) || 1
    return [gx / l, gy / l]
  }
  let d = ""
  // The stem, tapering to the tip.
  const left: string[] = []
  const right: string[] = []
  for (let i = 0; i <= 12; i++) {
    const t = i / 12
    const [px, py] = at(t)
    const [gx, gy] = tangent(t)
    const w = leaf * 0.045 * (1 - t) + 0.6
    left.push(f1(px - gy * w) + " " + f1(py + gx * w))
    right.unshift(f1(px + gy * w) + " " + f1(py - gx * w))
  }
  d += "M" + left.join("L") + "L" + right.join("L") + "Z"
  for (let i = 1; i <= count; i++) {
    const t = 0.06 + (0.94 * i) / (count + 1)
    const [px, py] = at(t)
    const [gx, gy] = tangent(t)
    const base = Math.atan2(gy, gx)
    for (const side of [-1, 1]) {
      const spread = (1.05 - 0.45 * t) * side
      let ax = Math.cos(base + spread)
      let ay = Math.sin(base + spread)
      // Leaflets hang: pull every one a little toward straight down.
      ax = ax * 0.72
      ay = ay * 0.72 + 0.34
      const al = Math.hypot(ax, ay) || 1
      ax /= al
      ay /= al
      const L = leaf * (0.3 + 0.7 * Math.pow(Math.sin(Math.PI * Math.min(1, t * 1.1)), 0.7)) * (1 - 0.45 * t) * (0.82 + 0.36 * rnd())
      const w = Math.max(1.2, L * 0.05)
      const nx = -ay
      const ny = ax
      const tipX = px + ax * L
      const tipY = py + ay * L + L * 0.12
      const midX = px + ax * L * 0.5
      const midY = py + ay * L * 0.5
      d +=
        "M" + f1(px + nx * w) + " " + f1(py + ny * w) +
        "Q" + f1(midX + nx * w * 1.3) + " " + f1(midY + ny * w * 1.3) + " " + f1(tipX) + " " + f1(tipY) +
        "Q" + f1(midX - nx * w * 1.1) + " " + f1(midY - ny * w * 1.1) + " " + f1(px - nx * w) + " " + f1(py - ny * w) + "Z"
    }
  }
  return d
}

/** A crown of fronds fanned between two angles. */
export const crownPath = (
  ox: number,
  oy: number,
  from: number,
  to: number,
  n: number,
  len: number,
  bend: number,
  seed: number,
): string => {
  const rnd = mulberry32(seed)
  let d = ""
  for (let i = 0; i < n; i++) {
    const a = from + ((to - from) * (i + 0.5)) / n + (rnd() - 0.5) * 0.12
    const l = len * (0.78 + rnd() * 0.3)
    d += frondPath(ox, oy, a, l, bend * (0.8 + rnd() * 0.4), l * 0.3, 26, seed * 31 + i)
  }
  return d
}

/** A tileable SVG noise layer as a data URI, for a CSS background. */
export const noise = (size: number, freq: string, octaves: number, seed: number, matrix: string): string =>
  "url(\"data:image/svg+xml," +
  encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' width='" + size + "' height='" + size + "'>" +
      "<filter id='n' x='0' y='0' width='100%' height='100%'>" +
      "<feTurbulence type='fractalNoise' baseFrequency='" + freq + "' numOctaves='" + octaves + "' seed='" + seed + "' stitchTiles='stitch'/>" +
      "<feColorMatrix values='" + matrix + "'/></filter>" +
      "<rect width='100%' height='100%' filter='url(#n)'/></svg>",
  ) +
  "\")"
// #endregion

// ---- paper -------------------------------------------------------------------

// Brown mottling, pale blooms, fine grain and a few foxing spots. Each is only
// alpha over the stock colour, so any `paper` or `envelope` colour ages the same.
const MOTTLE = noise(520, "0.006 0.009", 4, 4, "0 0 0 0 0.36 0 0 0 0 0.26 0 0 0 0 0.1 0.5 0 0 0 -0.2")
const BLOOM = noise(460, "0.012", 3, 9, "0 0 0 0 1 0 0 0 0 1 0 0 0 0 0.97 -1.1 0 0 0 0.58")
const GRAIN = noise(180, "0.85", 2, 2, "0 0 0 0 0.2 0 0 0 0 0.15 0 0 0 0 0.08 0.7 0 0 0 -0.34")
const FOXING = noise(640, "0.035", 3, 17, "0 0 0 0 0.52 0 0 0 0 0.36 0 0 0 0 0.16 5 0 0 0 -3.72")

const CARD_TEXTURE = [FOXING, GRAIN, BLOOM, MOTTLE].join(",")
const ENVELOPE_TEXTURE = [FOXING, GRAIN, BLOOM, MOTTLE].join(",")

// ---- the scene -----------------------------------------------------------------

const PALMS_NEAR =
  crownPath(-80, 60, -0.35, 1.75, 8, 640, 0.3, 3) +
  crownPath(1690, 1080, -2.95, -1.55, 7, 560, 0.22, 11) +
  crownPath(-40, 820, -1.1, 0.4, 4, 380, 0.26, 23)
const PALMS_FAR =
  crownPath(620, 1090, -2.35, -0.95, 6, 360, 0.2, 7) +
  crownPath(1660, 90, 1.9, 3.5, 5, 330, 0.25, 19)

const BOKEH = [
  [38, 620, 16], [92, 700, 11], [20, 760, 22], [128, 790, 9], [60, 860, 14],
  [150, 560, 7], [8, 540, 10], [110, 930, 18], [1540, 520, 8], [1575, 610, 12],
]

const SKIES: Record<Exclude<PostcardScene, "none">, string[]> = {
  tropic: ["#1b4f8a", "#2a67a6", "#3b7cb9"],
  dusk: ["#141a36", "#3b3765", "#c3795c"],
}

function Scene({ scene, uid }: { scene: Exclude<PostcardScene, "none">; uid: string }) {
  const sky = SKIES[scene]
  const leaves = scene === "dusk" ? ["#07090f", "#161827"] : ["#0a130f", "#1b2d24"]
  return (
    <div className="pc-scene" aria-hidden="true">
      <svg viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice" width="1600" height="1000">
        <defs>
          <linearGradient id={uid + "sky"} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={sky[0]} />
            <stop offset="0.55" stopColor={sky[1]} />
            <stop offset="1" stopColor={sky[2]} />
          </linearGradient>
          <radialGradient id={uid + "glow"} cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#fff3c4" />
            <stop offset="0.35" stopColor="#ffd27a" stopOpacity="0.85" />
            <stop offset="1" stopColor="#ff9e3d" stopOpacity="0" />
          </radialGradient>
          <filter id={uid + "far"} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="7" />
          </filter>
          <filter id={uid + "near"} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.6" />
          </filter>
        </defs>
        <rect width="1600" height="1000" fill={"url(#" + uid + "sky)"} />
        <path d={PALMS_FAR} fill={leaves[1]} opacity="0.85" filter={"url(#" + uid + "far)"} />
        <path d={PALMS_NEAR} fill={leaves[0]} filter={"url(#" + uid + "near)"} />
        {BOKEH.map(([x, y, r], i) => (
          <circle key={i} cx={x} cy={y} r={r * 2.4} fill={"url(#" + uid + "glow)"} opacity={scene === "dusk" ? 0.95 : 0.7} />
        ))}
      </svg>
    </div>
  )
}

// ---- lettering -------------------------------------------------------------------

// POSTCARD, drawn as monoline strokes on a 56 × 84 cell so it prints the same
// on every machine.
const LETTERS: Record<string, string> = {
  P: "M8 82V4H30C52 4 52 44 30 44H8",
  O: "M30 4C9 4 5 24 5 43C5 62 9 82 30 82C51 82 55 62 55 43C55 24 51 4 30 4Z",
  S: "M51 16C46 7 38 3 29 3C16 3 8 11 8 22C8 45 53 36 53 61C53 74 43 82 29 82C18 82 10 77 5 67",
  T: "M3 4H55M29 4V82",
  C: "M53 19C49 9 41 4 31 4C13 4 6 24 6 43C6 62 13 82 31 82C42 82 49 76 53 66",
  A: "M3 82L29 4L55 82M12 57H46",
  R: "M8 82V4H30C52 4 52 44 30 44H8M27 44L52 82",
  D: "M8 4V82H24C48 82 54 62 54 43C54 24 48 4 24 4Z",
}

function Lettering({ word, uid }: { word: string; uid: string }) {
  const chars = word.toUpperCase().split("")
  const w = chars.length * 62
  return (
    <svg className="pc-title" viewBox={"-6 -6 " + (w + 6) + " 96"} role="img" aria-label={word}>
      <defs>
        <filter id={uid + "print"} x="-5%" y="-10%" width="110%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="1" seed="4" result="t" />
          <feDisplacementMap in="SourceGraphic" in2="t" scale="2.2" />
        </filter>
      </defs>
      <g fill="none" stroke="currentColor" strokeWidth="8.5" strokeLinejoin="round" strokeLinecap="round" filter={"url(#" + uid + "print)"}>
        {chars.map((c, i) => (LETTERS[c] ? <path key={i} d={LETTERS[c]} transform={"translate(" + i * 62 + " 0)"} /> : null))}
      </g>
    </svg>
  )
}

// ---- stamps ----------------------------------------------------------------------

export const DEFAULT_STAMPS: StampDesign[] = [
  { id: "apple", caption: "Apple of\nmy\neye.", frame: "#4d7894", captionColor: "#c94f3a" },
  { id: "palm", caption: "wish you\nwere here", frame: "#3f7a6c", captionColor: "#2d6a8f" },
  { id: "shell", caption: "shell we\nchat?", frame: "#b0645a", captionColor: "#9a4a52" },
  { id: "sun", caption: "hello,\nsunshine", frame: "#c28a2e", captionColor: "#b5562b" },
]

function StampArt({ id, uid }: { id: string; uid: string }) {
  const hatch = "url(#" + uid + "hatch)"
  if (id === "palm") {
    return (
      <g>
        <circle cx="62" cy="62" r="14" fill="#f2b544" />
        <circle cx="62" cy="62" r="14" fill={hatch} />
        <path d="M14 96C30 90 44 92 56 96C68 100 80 98 86 94V108H14Z" fill="#4f8fb0" />
        <path d="M14 100C26 96 36 97 46 100" fill="none" stroke="#dcecf2" strokeWidth="1.4" strokeLinecap="round" />
        <path d="M34 100C38 86 40 72 38 58" fill="none" stroke="#7a5634" strokeWidth="4" strokeLinecap="round" />
        <path d="M38 58C30 52 22 54 18 60C26 57 32 58 38 58ZM38 58C44 50 54 50 58 56C50 54 44 56 38 58ZM38 58C34 48 36 42 42 40C40 46 40 52 38 58ZM38 58C46 58 52 64 52 70C46 64 42 62 38 58ZM38 58C30 60 26 66 26 72C30 66 34 62 38 58Z" fill="#4c8a4a" />
      </g>
    )
  }
  if (id === "shell") {
    return (
      <g transform="translate(8 16) scale(.84)">
        <path d="M50 104L28 92C20 78 20 62 30 52C40 42 60 42 70 52C80 62 80 78 72 92Z" fill="#f0b9a0" />
        <path d="M50 104L28 92C20 78 20 62 30 52C40 42 60 42 70 52C80 62 80 78 72 92Z" fill={hatch} />
        {[-26, -15, -5, 5, 15, 26].map((x, i) => (
          <path key={i} d={"M50 102Q" + (50 + x * 0.6) + " 76 " + (50 + x) + " 50"} fill="none" stroke="#c9735f" strokeWidth="1.6" strokeLinecap="round" />
        ))}
        <path d="M42 104H58L55 110H45Z" fill="#e39a86" />
      </g>
    )
  }
  if (id === "sun") {
    return (
      <g transform="translate(5 10) scale(.9)">
        {Array.from({ length: 12 }, (_, i) => {
          const a = (i / 12) * Math.PI * 2
          return (
            <path key={i} d={"M" + f1(50 + Math.cos(a) * 21) + " " + f1(80 + Math.sin(a) * 21) + "L" + f1(50 + Math.cos(a) * 30) + " " + f1(80 + Math.sin(a) * 30)} stroke="#e9923a" strokeWidth="3" strokeLinecap="round" />
          )
        })}
        <circle cx="50" cy="80" r="16" fill="#f5c04a" />
        <circle cx="50" cy="80" r="16" fill={hatch} />
        <circle cx="44" cy="77" r="1.6" fill="#7a4a1c" />
        <circle cx="56" cy="77" r="1.6" fill="#7a4a1c" />
        <path d="M43 84Q50 90 57 84" fill="none" stroke="#7a4a1c" strokeWidth="1.6" strokeLinecap="round" />
      </g>
    )
  }
  // apple
  return (
    <g transform="translate(-6 -2)">
      <path d="M50 70C41 61 23 63 23 82C23 99 36 108 50 104C64 108 77 99 77 82C77 63 59 61 50 70Z" fill="#e36a3a" />
      <path d="M50 70C41 61 23 63 23 82C23 99 36 108 50 104C64 108 77 99 77 82C77 63 59 61 50 70Z" fill={hatch} />
      <ellipse cx="36" cy="80" rx="5" ry="8" fill="#f6a567" opacity="0.8" transform="rotate(18 36 80)" />
      <path d="M50 70C50 63 51 58 54 54" fill="none" stroke="#5a3d22" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M53 60C57 51 67 50 72 54C66 61 58 62 53 60Z" fill="#6d9a4a" />
    </g>
  )
}

function Stamp({ design, uid }: { design: StampDesign; uid: string }) {
  const frame = design.frame || "#4d7894"
  const holes: React.ReactNode[] = []
  for (let i = 0; i <= 12; i++) {
    holes.push(<circle key={"t" + i} cx={(i * 100) / 12} cy="0" r="3.3" />, <circle key={"b" + i} cx={(i * 100) / 12} cy="120" r="3.3" />)
  }
  for (let i = 0; i <= 14; i++) {
    holes.push(<circle key={"l" + i} cx="0" cy={(i * 120) / 14} r="3.3" />, <circle key={"r" + i} cx="100" cy={(i * 120) / 14} r="3.3" />)
  }
  const lines = design.caption.split("\n")
  return (
    <svg viewBox="0 0 100 120" width="100" height="120" className="pc-stamp-svg" aria-hidden="true">
      <defs>
        <mask id={uid + "perf"}>
          <rect width="100" height="120" fill="#fff" />
          <g fill="#000">{holes}</g>
        </mask>
        <pattern id={uid + "hatch"} width="3" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
          <rect width="3" height="1.1" fill="#000" opacity="0.14" />
        </pattern>
        <filter id={uid + "crayon"} x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves="2" seed="8" result="t" />
          <feDisplacementMap in="SourceGraphic" in2="t" scale="2.4" />
        </filter>
      </defs>
      <g mask={"url(#" + uid + "perf)"}>
        <rect width="100" height="120" fill="#f7f3ea" />
        <rect x="3.5" y="3.5" width="93" height="113" fill={frame} />
        <rect x="11" y="11" width="78" height="98" fill="#f4efe2" stroke="#fff" strokeWidth="1" />
      </g>
      <g filter={"url(#" + uid + "crayon)"}>{design.art ?? <StampArt id={design.id} uid={uid} />}</g>
      <text fill={design.captionColor || "#c94f3a"} fontSize="9.5" className="pc-stamp-caption">
        {lines.map((l, i) => (
          <tspan key={i} x={design.id === "apple" ? [16, 60, 66][i] ?? 18 : 18} dy={i ? 13 : 0} y={i ? undefined : 27}>
            {l}
          </tspan>
        ))}
      </text>
    </svg>
  )
}

function Postmark({ date, uid }: { date: string; uid: string }) {
  return (
    <svg viewBox="0 0 160 80" width="160" height="80" className="pc-postmark" aria-hidden="true">
      <defs>
        <path id={uid + "ring"} d="M40 64A24 24 0 1 1 40.1 64" />
        <filter id={uid + "rubber"} x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="2" seed="3" result="t" />
          <feColorMatrix in="t" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 -2.2 1.6" result="holes" />
          <feComposite in="SourceGraphic" in2="holes" operator="in" />
        </filter>
      </defs>
      <g fill="none" stroke="currentColor" filter={"url(#" + uid + "rubber)"}>
        <circle cx="40" cy="40" r="31" strokeWidth="2.2" />
        <circle cx="40" cy="40" r="16" strokeWidth="1.4" />
        <text fontSize="7.4" fill="currentColor" stroke="none" letterSpacing="1.4" className="pc-print">
          <textPath href={"#" + uid + "ring"}>{"SENT · " + date + " ·"}</textPath>
        </text>
        <text x="40" y="43.5" fontSize="9" fill="currentColor" stroke="none" textAnchor="middle" fontWeight="700" className="pc-print">
          POST
        </text>
        {[20, 32, 44, 56].map((y) => (
          <path key={y} d={"M76 " + y + "q6 -5 12 0t12 0t12 0t12 0t12 0t12 0"} strokeWidth="2.2" />
        ))}
      </g>
    </svg>
  )
}

// ---- the form --------------------------------------------------------------------

type Phase = "edit" | "sending" | "sent" | "returned"

const CSS =
  ".pc-root{position:relative;overflow:hidden;display:flex;flex-direction:column;align-items:center;justify-content:center;box-sizing:border-box;isolation:isolate;padding:clamp(28px,6vw,72px) clamp(14px,4vw,48px)}" +
  ".pc-root *,.pc-root *::before,.pc-root *::after{box-sizing:border-box}" +
  ".pc-scene{position:absolute;inset:0;z-index:0;pointer-events:none}" +
  ".pc-scene svg{position:absolute;inset:0;width:100%;height:100%;max-width:none;display:block}" +
  ".pc-stage{position:relative;z-index:1;container-type:inline-size;max-width:100%}" +
  ".pc-flyer{position:relative}" +
  ".pc-card{position:relative;z-index:3;--u:1cqw;aspect-ratio:1.56;display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1.04fr);column-gap:calc(var(--u)*2.2);padding:calc(var(--u)*2.8) calc(var(--u)*3.2) calc(var(--u)*2.6);border-radius:3px;background-size:640px 640px,180px 180px,460px 460px,520px 520px;box-shadow:0 1px 1px rgba(40,30,10,.18),0 18px 40px -12px rgba(5,12,30,.55),0 40px 80px -30px rgba(5,12,30,.5),inset 0 0 calc(var(--u)*6) rgba(120,90,40,.16);transform-origin:50% 50%}" +
  ".pc-print{font-family:var(--pc-print-font);color:var(--pc-print);text-transform:uppercase;letter-spacing:.14em;font-weight:600}" +
  ".pc-left{display:flex;flex-direction:column;min-width:0;min-height:0}" +
  ".pc-small{font-size:calc(var(--u)*1.22);line-height:1.2;margin:0}" +
  ".pc-hand,.pc-env-note,.pc-note h3,.pc-note p{word-spacing:.12em}.pc-hand{font-family:var(--pc-hand);color:var(--pc-ink);background:transparent;border:0;outline:0;box-shadow:none;border-radius:0;padding:0;margin:0;width:100%;min-width:0;-webkit-appearance:none;appearance:none;caret-color:var(--pc-ink)}" +
  ".pc-hand::placeholder{color:var(--pc-ink);opacity:.3}" +
  ".pc-subject{font-size:calc(var(--u)*2.5);text-align:center;margin-top:calc(var(--u)*3.2);line-height:1.4}" +
  ".pc-message{flex:1 1 auto;min-height:calc(var(--u)*16);resize:none;text-align:center;line-height:1.55;margin-top:calc(var(--u)*1.8);overflow-y:auto;scrollbar-width:none}" +
  ".pc-message::-webkit-scrollbar{display:none}" +
  ".pc-signoff{display:flex;flex-direction:column;align-items:flex-end;padding-right:calc(var(--u)*1);margin-top:calc(var(--u)*.6)}" +
  ".pc-signoff-line{font-family:var(--pc-hand);color:var(--pc-ink);font-size:calc(var(--u)*2.1);line-height:1.2}" +
  ".pc-signature{font-family:var(--pc-sign);color:var(--pc-ink);font-size:calc(var(--u)*4);line-height:1.1;min-height:1.1em;padding-right:calc(var(--u)*1)}" +
  ".pc-signature[data-empty]{opacity:.22}" +
  ".pc-divider{display:flex;flex-direction:column;align-items:center;gap:calc(var(--u)*1.2);padding:calc(var(--u)*.4) 0}" +
  ".pc-divider i{flex:1 1 auto;width:max(1.5px,calc(var(--u)*.22));background:var(--pc-print);opacity:.85;border-radius:2px}" +
  ".pc-imprint{writing-mode:vertical-rl;font-size:calc(var(--u)*1.05);letter-spacing:.55em;font-weight:700;white-space:nowrap}" +
  ".pc-right{display:flex;flex-direction:column;min-width:0}" +
  ".pc-head{display:flex;align-items:flex-start;justify-content:space-between;gap:calc(var(--u)*1.5)}" +
  ".pc-title{display:block;width:calc(var(--u)*25);height:auto;max-width:none;color:var(--pc-print);margin-top:calc(var(--u)*2.4)}" +
  ".pc-titletext{font-size:calc(var(--u)*4.6);letter-spacing:.02em;line-height:1;margin-top:calc(var(--u)*2.4);font-weight:800}" +
  ".pc-head .pc-small{margin-top:calc(var(--u)*1.6)}" +
  ".pc-stampwrap{position:relative;flex:none}" +
  ".pc-stamp{display:block;position:relative;width:calc(var(--u)*11.4);padding:0;margin:0;border:0;background:none;cursor:pointer;transform:rotate(1.5deg);transition:transform .35s cubic-bezier(.3,1.4,.5,1);filter:drop-shadow(0 1px 1.2px rgba(40,30,10,.3))}" +
  ".pc-stamp:hover{transform:rotate(-2.5deg) translateY(-2px) scale(1.03)}" +
  ".pc-stamp:focus-visible{outline:2px dashed var(--pc-print);outline-offset:5px}" +
  ".pc-stamp:disabled{cursor:default;transform:rotate(1.5deg)}" +
  ".pc-stamp-svg{display:block;width:100%;height:auto;max-width:none}" +
  ".pc-stamp-caption{font-family:var(--pc-hand)}" +
  ".pc-stamp-hint{position:absolute;left:50%;top:100%;transform:translate(-50%,4px);white-space:nowrap;font-size:calc(var(--u)*.9);opacity:0;transition:opacity .2s}" +
  ".pc-stampwrap:hover .pc-stamp-hint,.pc-stamp:focus-visible+.pc-stamp-hint{opacity:.75}" +
  ".pc-postmark{position:absolute;right:38%;top:44%;width:calc(var(--u)*17);height:auto;max-width:none;color:#27385a;opacity:0;transform:rotate(-12deg);pointer-events:none;mix-blend-mode:multiply}" +
  ".pc-lines{display:flex;flex-direction:column;justify-content:space-evenly;flex:1 1 auto;padding-top:calc(var(--u)*1.2)}" +
  ".pc-row{display:flex;gap:calc(var(--u)*2.2)}.pc-row>.pc-line{flex:1 1 0}" +
  ".pc-line{position:relative;flex:none;min-width:0;display:flex;align-items:baseline;gap:calc(var(--u)*1);padding-top:calc(var(--u)*2.4);border-bottom:max(1.5px,calc(var(--u)*.2)) solid var(--pc-print);transition:border-color .2s}" +
  ".pc-line:focus-within{border-bottom-color:var(--pc-ink)}" +
  ".pc-line[data-invalid]{border-bottom-color:#b3322a}" +
  ".pc-line label{flex:none;font-size:calc(var(--u)*.95);opacity:.78;white-space:nowrap}" +
  ".pc-line .pc-hand{font-size:calc(var(--u)*2.25);line-height:1.5;padding-bottom:calc(var(--u)*.1)}" +
  ".pc-indent{padding-left:calc(var(--u)*2.4)}" +
  ".pc-err{position:absolute;right:0;top:calc(var(--u)*.3);font-family:var(--pc-hand);color:#b3322a;font-size:calc(var(--u)*1.55);transform:rotate(-2deg);pointer-events:none}" +
  ".pc-actions{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:clamp(14px,2.4cqw,24px);transition:opacity .3s}" +
  ".pc-actions[data-hidden]{opacity:0;pointer-events:none}" +
  ".pc-hint{font-size:11px;letter-spacing:.2em;color:var(--pc-hint)}" +
  ".pc-send{display:inline-flex;align-items:center;gap:10px;padding:12px 22px 12px 20px;border:0;border-radius:999px;cursor:pointer;background:var(--pc-paper);color:var(--pc-print);font-family:var(--pc-print-font);font-size:13px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;box-shadow:0 1px 0 rgba(255,255,255,.6) inset,0 8px 22px -8px rgba(5,12,30,.6);transition:transform .2s,box-shadow .2s}" +
  ".pc-send:hover{transform:translateY(-1px) rotate(-1deg);box-shadow:0 1px 0 rgba(255,255,255,.6) inset,0 12px 26px -8px rgba(5,12,30,.7)}" +
  ".pc-send:focus-visible{outline:2px solid var(--pc-paper);outline-offset:3px}" +
  ".pc-send svg{width:20px;height:auto;max-width:none}" +
  ".pc-env{position:absolute;opacity:0;pointer-events:none}" +
  ".pc-env-shadow{z-index:1;border-radius:4px;box-shadow:0 20px 44px -14px rgba(5,12,30,.6),0 2px 3px rgba(40,30,10,.25)}" +
  ".pc-env-back{z-index:2;border-radius:3px;filter:brightness(.8)}" +
  ".pc-env-pocket{z-index:4;filter:drop-shadow(0 -1px 1px rgba(60,45,15,.28))}" +
  ".pc-env-pocket>div,.pc-env-bottom>div,.pc-env-flap>div{position:absolute;inset:0}" +
  ".pc-env-bottom{z-index:5;filter:drop-shadow(0 -2px 2px rgba(60,45,15,.22))}" +
  ".pc-env-flap{z-index:1;transform-origin:50% 0;filter:drop-shadow(0 2px 2px rgba(60,45,15,.25))}" +
  ".pc-env-seal{z-index:7}" +
  ".pc-env-note{z-index:7;display:flex;align-items:center;justify-content:center;font-family:var(--pc-hand);color:var(--pc-ink);white-space:nowrap;text-align:center}" +
  ".pc-return{z-index:8;display:flex;align-items:flex-end;justify-content:center;padding-bottom:11%}" +
  ".pc-return span{display:block;padding:.35em .8em;border:.18em double #b3322a;color:#b3322a;font-family:var(--pc-print-font);font-weight:800;letter-spacing:.18em;text-transform:uppercase;transform:rotate(-9deg);mix-blend-mode:multiply;opacity:.88}" +
  ".pc-panel{position:absolute;left:50%;top:50%;z-index:10;width:min(92%,520px);transform:translate(-50%,-50%);text-align:center}" +
  ".pc-note{position:relative;padding:clamp(22px,5cqw,40px) clamp(20px,5cqw,44px);border-radius:3px;background-size:640px 640px,180px 180px,460px 460px,520px 520px;box-shadow:0 18px 40px -12px rgba(5,12,30,.55);transform:rotate(-1.4deg)}" +
  ".pc-note h3{font-family:var(--pc-hand);color:var(--pc-ink);font-weight:400;font-size:clamp(24px,5cqw,38px);line-height:1.25;margin:.5em 0 .3em}" +
  ".pc-note p{font-family:var(--pc-hand);color:var(--pc-ink);font-size:clamp(16px,3cqw,21px);line-height:1.55;margin:0}" +
  ".pc-note .pc-signature{font-size:clamp(30px,6cqw,46px);margin-top:.3em;text-align:right}" +
  ".pc-again{margin-top:18px;display:inline-flex;align-items:center;gap:8px;padding:10px 18px;border-radius:999px;border:1.5px solid currentColor;background:transparent;cursor:pointer;font-family:var(--pc-print-font);font-size:12px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:var(--pc-print)}" +
  ".pc-again:hover{background:rgba(31,79,160,.08)}" +
  ".pc-again:focus-visible{outline:2px solid var(--pc-print);outline-offset:3px}" +
  ".pc-trap{position:absolute;left:-9999px;width:1px;height:1px;opacity:0}" +
  ".pc-sr{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}" +
  "@container (max-width: 640px){" +
  ".pc-card{--u:2.35cqw;aspect-ratio:auto;grid-template-columns:minmax(0,1fr);row-gap:calc(var(--u)*2.4);padding:calc(var(--u)*4) calc(var(--u)*4.4) calc(var(--u)*4)}" +
  ".pc-right{order:-2}.pc-divider{order:-1;flex-direction:row;padding:0}" +
  ".pc-divider i{width:auto;height:max(1.5px,calc(var(--u)*.22))}" +
  ".pc-imprint{writing-mode:horizontal-tb;letter-spacing:.35em}" +
  ".pc-title{width:calc(var(--u)*27)}.pc-stamp{width:calc(var(--u)*13)}" +
  ".pc-message{min-height:calc(var(--u)*30)}.pc-row{flex-direction:column;gap:0}" +
  ".pc-indent{padding-left:0}.pc-hint{display:none}.pc-actions{justify-content:flex-end}" +
  "}" +
  "@media (prefers-reduced-motion: reduce){.pc-stamp,.pc-send,.pc-line,.pc-actions{transition:none}.pc-stamp:hover,.pc-send:hover{transform:none}}"

const DEFAULT_REQUIRED: PostcardField[] = ["firstName", "email", "message"]
const DEFAULT_FIELDS: ("lastName" | "address" | "phone")[] = ["lastName", "address", "phone"]

export default function PostcardContact({
  onSend,
  recipient = "",
  fields = DEFAULT_FIELDS,
  required = DEFAULT_REQUIRED,
  showSubject = true,
  defaultValues,
  envelopeNote = "cozy vibes from {firstName}",
  thanksTitle = "Thank you, {firstName}!",
  thanksBody = "Your postcard is sealed and on its way. I read every one, and I'll write back soon.",
  signoff = "One love,",
  subjectPlaceholder = "A little hello",
  messagePlaceholder = "Tell me what's on your mind — an idea, a project, a question, or just a hello. I read every card that lands here.",
  messageLabel = "This space for writing messages.",
  addressLabel = "This space for address only.",
  imprint = "P. C. PAPERWORKS",
  sendLabel = "Seal & send",
  stamps = DEFAULT_STAMPS,
  maxLength = 600,
  scene = "tropic",
  fontFamily = '"Homemade Apple", "Nothing You Could Do", "Reenie Beanie", "Caveat", "Segoe Print", "Bradley Hand", "Chalkboard SE", cursive',
  signatureFamily = '"Mrs Saint Delafield", "Great Vibes", "Snell Roundhand", "Segoe Script", "Brush Script MT", cursive',
  printFamily = '"Futura", "Century Gothic", "Avenir Next", ui-sans-serif, system-ui, sans-serif',
  ink = "#1d2230",
  printInk = "#1f4fa0",
  paper = "#efeadc",
  envelope = "#efe4c4",
  seal = "#9b2d25",
  width = "min(100%, 980px)",
  height = "100svh",
  className = "",
}: PostcardContactProps) {
  const uid = "pc" + React.useId().replace(/[^a-zA-Z0-9]/g, "")
  const stampList = stamps.length ? stamps : DEFAULT_STAMPS

  const [data, setData] = React.useState<PostcardData>(() => ({
    ...EMPTY,
    ...defaultValues,
    stamp: defaultValues?.stamp || stampList[0].id,
  }))
  const [errors, setErrors] = React.useState<Partial<Record<PostcardField, string>>>({})
  const [phase, setPhase] = React.useState<Phase>("edit")
  const [date, setDate] = React.useState("")
  const [env, setEnv] = React.useState({ w: 0, h: 0, x: 0, y: 0 })
  const [failure, setFailure] = React.useState("")
  const [status, setStatus] = React.useState("")

  const flyerRef = React.useRef<HTMLDivElement>(null)
  const cardRef = React.useRef<HTMLFormElement>(null)
  const panelRef = React.useRef<HTMLDivElement>(null)
  const trapRef = React.useRef<HTMLInputElement>(null)
  const anims = React.useRef<Animation[]>([])
  const run = React.useRef(0)
  const fit = React.useRef({ s: 1, lift: 0, drop: 0 })

  React.useEffect(() => {
    const live = anims.current
    return () => {
      run.current++
      live.forEach((a) => a.cancel())
    }
  }, [])

  const stampIndex = Math.max(0, stampList.findIndex((s) => s.id === data.stamp))
  const stamp = stampList[stampIndex]

  const set = (key: PostcardField) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = e.target.value
    setData((d) => ({ ...d, [key]: value }))
    if (errors[key]) setErrors((er) => ({ ...er, [key]: undefined }))
  }

  const reduced = () =>
    typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches

  const q = (sel: string) => flyerRef.current?.querySelector<HTMLElement>(sel) ?? null

  const play = (el: Element | null, frames: Keyframe[], opts: KeyframeAnimationOptions & { duration: number }) => {
    if (!el) return Promise.resolve()
    const m = reduced() ? 0 : 1
    const a = el.animate(frames, {
      fill: "forwards",
      easing: "cubic-bezier(.45,.05,.25,1)",
      ...opts,
      duration: Math.max(1, opts.duration * m),
      delay: (Number(opts.delay) || 0) * m,
    })
    anims.current.push(a)
    return a.finished.then(
      () => undefined,
      () => undefined,
    )
  }

  const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, reduced() ? 0 : ms))
  const frame = () => new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())))

  const clearAnims = () => {
    anims.current.forEach((a) => a.cancel())
    anims.current = []
  }

  const send = async () => {
    if (phase !== "edit") return
    const errs = validate(data, required)
    if (Object.keys(errs).length) {
      setErrors(errs)
      setStatus("The postcard needs " + Object.values(errs).join(", ").replace(/add /g, "") + ".")
      const first = (Object.keys(errs) as PostcardField[])[0]
      cardRef.current?.querySelector<HTMLElement>('[name="' + first + '"]')?.focus()
      play(cardRef.current, [
        { transform: "translateX(0)" },
        { transform: "translateX(-8px) rotate(-.4deg)" },
        { transform: "translateX(7px) rotate(.3deg)" },
        { transform: "translateX(-4px)" },
        { transform: "translateX(0)" },
      ], { duration: 420, fill: "none" }).then(() => {
        anims.current = anims.current.filter((a) => a.playState !== "finished")
      })
      return
    }

    const card = cardRef.current
    const flyer = flyerRef.current
    if (!card || !flyer) return
    const id = ++run.current
    const alive = () => run.current === id
    ;(document.activeElement as HTMLElement | null)?.blur?.()

    // The envelope is sized off the card and centred on it; the card scales to
    // fit inside it with a margin.
    const cw = card.offsetWidth
    const ch = card.offsetHeight
    const e = envelopeFor(cw, ch)
    const s = fitInside(cw, ch, e.w, e.h, 0.1)
    fit.current = {
      s,
      lift: -e.h / 2 + e.h * 0.3 - (ch * s) / 2,
      drop: e.h * 0.02,
    }
    setEnv({ w: e.w, h: e.h, x: (cw - e.w) / 2, y: (ch - e.h) / 2 })
    setDate(postmarkDate(new Date()))
    setFailure("")
    setPhase("sending")
    setStatus("Sealing your postcard…")

    // Start the real send now; the animation only waits for it at the end.
    const payload = { ...data }
    const trapped = Boolean(trapRef.current?.value)
    const result: Promise<{ ok: boolean; message?: string }> = Promise.resolve()
      .then(() => (trapped || !onSend ? undefined : onSend(payload)))
      .then(
        () => ({ ok: true }),
        (err: unknown) => ({ ok: false, message: err instanceof Error ? err.message : typeof err === "string" ? err : "" }),
      )

    await frame()
    if (!alive()) return

    const { lift, drop } = fit.current
    const envPieces = [".pc-env-shadow", ".pc-env-back", ".pc-env-pocket", ".pc-env-bottom"]

    // 1 — postmark the stamp.
    play(card.querySelector(".pc-postmark"), [
      { opacity: 0, transform: "rotate(-12deg) scale(1.7)" },
      { opacity: 0.85, transform: "rotate(-12deg) scale(1)" },
    ], { duration: 260, easing: "cubic-bezier(.5,0,.8,.4)" })
    await play(card, [
      { transform: "none" },
      { transform: "translateY(3px) scale(.994)", offset: 0.5 },
      { transform: "none" },
    ], { duration: 240, delay: 220, fill: "none" })
    await wait(260)
    if (!alive()) return

    // 2 — lift the card, bring the envelope up under it, drop the card in.
    const lifted = "translate(0px," + lift.toFixed(1) + "px) scale(" + s.toFixed(4) + ") rotate(-2.5deg)"
    const inside = "translate(0px," + drop.toFixed(1) + "px) scale(" + s.toFixed(4) + ") rotate(0deg)"
    const cardIn = play(card, [
      { transform: "none", boxShadow: getComputedStyle(card).boxShadow },
      { transform: lifted, offset: 0.42 },
      { transform: lifted, offset: 0.62 },
      { transform: inside, boxShadow: "0 2px 6px rgba(0,0,0,.2)" },
    ], { duration: 1650, easing: "cubic-bezier(.55,.05,.3,1)" })
    envPieces.forEach((sel) =>
      play(q(sel), [
        { opacity: 0, transform: "translateY(35%)" },
        { opacity: 1, transform: "translateY(0)" },
      ], { duration: 620, delay: 520, easing: "cubic-bezier(.2,.8,.2,1)" }),
    )
    play(q(".pc-env-flap"), [
      { opacity: 0, transform: "translateY(35%) perspective(1400px) rotateX(180deg)" },
      { opacity: 1, transform: "translateY(0) perspective(1400px) rotateX(180deg)" },
    ], { duration: 620, delay: 520, easing: "cubic-bezier(.2,.8,.2,1)" })
    await cardIn
    if (!alive()) return

    // 3 — fold the flap down. It passes behind to in front of the card halfway.
    await play(q(".pc-env-flap"), [
      { opacity: 1, transform: "perspective(1400px) rotateX(180deg)", zIndex: 1 },
      { opacity: 1, transform: "perspective(1400px) rotateX(90deg)", zIndex: 1, offset: 0.5 },
      { opacity: 1, transform: "perspective(1400px) rotateX(90deg)", zIndex: 6, offset: 0.5 },
      { opacity: 1, transform: "perspective(1400px) rotateX(0deg)", zIndex: 6 },
    ], { duration: 640, easing: "cubic-bezier(.5,0,.3,1)" })
    if (!alive()) return

    // 4 — seal it and write on the back.
    if (seal !== false) {
      await play(q(".pc-env-seal"), [
        { opacity: 0, transform: "scale(1.9) rotate(-30deg)" },
        { opacity: 1, transform: "scale(.94) rotate(-8deg)", offset: 0.7 },
        { opacity: 1, transform: "scale(1) rotate(-8deg)" },
      ], { duration: 420, easing: "cubic-bezier(.5,0,.7,.4)" })
    }
    await play(q(".pc-env-note"), [
      { opacity: 1, clipPath: "inset(0 100% 0 0)" },
      { opacity: 1, clipPath: "inset(0 0% 0 0)" },
    ], { duration: 1500, easing: "cubic-bezier(.3,.1,.6,1)" })
    if (!alive()) return

    setStatus("Sending…")
    const outcome = await result
    if (!alive()) return

    if (!outcome.ok) {
      setFailure(outcome.message || "It didn't go through.")
      setPhase("returned")
      setStatus("Returned to sender. " + (outcome.message || "It didn't go through.") + " Open it back up to try again.")
      await play(q(".pc-return"), [
        { opacity: 0, transform: "scale(1.6)" },
        { opacity: 1, transform: "scale(1)" },
      ], { duration: 280, easing: "cubic-bezier(.5,0,.8,.4)" })
      return
    }

    // 5 — off it goes.
    await play(flyer, [
      { transform: "none", opacity: 1 },
      { transform: "translateY(-3%) rotate(-3deg)", opacity: 1, offset: 0.28 },
      { transform: "translate(120%, -60%) rotate(16deg) scale(.6)", opacity: 0 },
    ], { duration: 1150, easing: "cubic-bezier(.5,0,.75,.2)" })
    if (!alive()) return
    setPhase("sent")
    setStatus(fillTemplate(thanksTitle, payload) + " " + thanksBody)
    await frame()
    play(panelRef.current, [
      { opacity: 0, transform: "translate(-50%,-44%) rotate(3deg)" },
      { opacity: 1, transform: "translate(-50%,-50%) rotate(0deg)" },
    ], { duration: 700, easing: "cubic-bezier(.2,.9,.25,1.15)" })
  }

  const reopen = async () => {
    // Bring the card back out of the envelope with everything still written on it.
    run.current++
    const id = run.current
    const card = cardRef.current
    const { s, drop } = fit.current
    clearAnims()
    setPhase("edit")
    setFailure("")
    setStatus("")
    await frame()
    if (run.current !== id) return
    play(card, [
      { transform: "translate(0px," + drop.toFixed(1) + "px) scale(" + s.toFixed(4) + ")", opacity: 0 },
      { transform: "none", opacity: 1 },
    ], { duration: 650, easing: "cubic-bezier(.2,.8,.2,1)", fill: "none" })
    card?.querySelector<HTMLElement>("textarea")?.focus()
  }

  const again = async () => {
    run.current++
    const id = run.current
    clearAnims()
    setData({ ...EMPTY, stamp: data.stamp })
    setErrors({})
    setPhase("edit")
    setStatus("")
    await frame()
    if (run.current !== id) return
    play(cardRef.current, [
      { opacity: 0, transform: "translateY(24px) rotate(1.5deg)" },
      { opacity: 1, transform: "none" },
    ], { duration: 600, easing: "cubic-bezier(.2,.8,.2,1)", fill: "none" })
    cardRef.current?.querySelector<HTMLElement>('[name="' + (showSubject ? "subject" : "message") + '"]')?.focus()
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      send()
    }
  }

  const locked = phase !== "edit"
  const scale = messageScale(data.message.length, maxLength)
  const texture = { backgroundColor: paper, backgroundImage: CARD_TEXTURE }
  const envBox: React.CSSProperties = { left: env.x, top: env.y, width: env.w, height: env.h }
  const envPaper = { backgroundColor: envelope, backgroundImage: ENVELOPE_TEXTURE, backgroundSize: "900px 900px, 180px 180px, 380px 380px, 420px 420px" }
  const initial = (data.firstName.trim()[0] || "✉").toUpperCase()

  const line = (key: PostcardField, label: string, type = "text", auto = "on", extra = "") => (
    <div className={"pc-line " + extra} data-invalid={errors[key] ? "" : undefined}>
      <label className="pc-print" htmlFor={uid + key}>
        {label}
        {required.includes(key) ? " *" : ""}
      </label>
      <input
        id={uid + key}
        name={key}
        className="pc-hand"
        type={type}
        autoComplete={auto}
        value={data[key]}
        onChange={set(key)}
        disabled={locked}
        aria-invalid={errors[key] ? true : undefined}
        aria-describedby={errors[key] ? uid + key + "err" : undefined}
        aria-required={required.includes(key) || undefined}
      />
      {errors[key] ? (
        <span className="pc-err" id={uid + key + "err"}>
          {errors[key]}
        </span>
      ) : null}
    </div>
  )

  return (
    <section
      className={"pc-root " + className}
      style={
        {
          minHeight: height,
          "--pc-hand": fontFamily,
          "--pc-sign": signatureFamily,
          "--pc-print-font": printFamily,
          "--pc-ink": ink,
          "--pc-print": printInk,
          "--pc-paper": paper,
          "--pc-hint": scene === "none" ? "var(--color-muted-foreground, #777)" : "rgba(255,255,255,.72)",
        } as React.CSSProperties
      }
      aria-label="Contact"
    >
      <style>{CSS}</style>
      {scene !== "none" ? <Scene scene={scene} uid={uid} /> : null}

      <div className="pc-stage" style={{ width }}>
        <div
          ref={flyerRef}
          className="pc-flyer"
          style={{ visibility: phase === "sent" ? "hidden" : undefined }}
          aria-hidden={phase === "sent" || undefined}
        >
          <form
            ref={cardRef}
            className="pc-card"
            style={texture}
            noValidate
            onSubmit={(e) => {
              e.preventDefault()
              send()
            }}
            onKeyDown={onKeyDown}
          >
            <div className="pc-left">
              <p className="pc-print pc-small">{messageLabel}</p>
              {showSubject ? (
                <>
                  <label className="pc-sr" htmlFor={uid + "subject"}>
                    Subject
                  </label>
                  <input
                    id={uid + "subject"}
                    name="subject"
                    className="pc-hand pc-subject"
                    value={data.subject}
                    onChange={set("subject")}
                    placeholder={subjectPlaceholder}
                    disabled={locked}
                    maxLength={80}
                    aria-invalid={errors.subject ? true : undefined}
                  />
                </>
              ) : null}
              <label className="pc-sr" htmlFor={uid + "message"}>
                Message
              </label>
              <textarea
                id={uid + "message"}
                name="message"
                className="pc-hand pc-message"
                style={{ fontSize: "calc(var(--u) * " + (2.35 * scale).toFixed(3) + ")" }}
                value={data.message}
                onChange={set("message")}
                placeholder={messagePlaceholder}
                maxLength={maxLength}
                disabled={locked}
                aria-invalid={errors.message ? true : undefined}
                aria-describedby={errors.message ? uid + "messageerr" : undefined}
                aria-required={required.includes("message") || undefined}
              />
              {errors.message ? (
                <span className="pc-err" id={uid + "messageerr"} style={{ position: "relative", alignSelf: "center" }}>
                  {errors.message}
                </span>
              ) : null}
              <div className="pc-signoff" aria-hidden="true">
                <span className="pc-signoff-line">{signoff}</span>
                <span className="pc-signature" data-empty={data.firstName.trim() ? undefined : ""}>
                  {data.firstName.trim() || "your name"}
                </span>
              </div>
            </div>

            <div className="pc-divider" aria-hidden="true">
              <i />
              <span className="pc-print pc-imprint">{imprint}</span>
              <i />
            </div>

            <div className="pc-right">
              <div className="pc-head">
                <div>
                  <Lettering word="POSTCARD" uid={uid} />
                  <p className="pc-print pc-small">{addressLabel}</p>
                </div>
                <div className="pc-stampwrap">
                  <button
                    type="button"
                    className="pc-stamp"
                    disabled={locked}
                    onClick={() => setData((d) => ({ ...d, stamp: stampList[(stampIndex + 1) % stampList.length].id }))}
                    aria-label={"Stamp: " + stamp.caption.replace(/\n/g, " ") + ". Change stamp."}
                  >
                    <Stamp design={stamp} uid={uid + "s"} />
                  </button>
                  <span className="pc-print pc-stamp-hint" aria-hidden="true">
                    tap to change
                  </span>
                  <Postmark date={date || postmarkDate(new Date(0))} uid={uid + "m"} />
                </div>
              </div>

              <div className="pc-lines">
                <div className="pc-row">
                  {line("firstName", "First name", "text", "given-name")}
                  {fields.includes("lastName") ? line("lastName", "Last name", "text", "family-name") : null}
                </div>
                {line("email", "Email", "email", "email")}
                {fields.includes("address") ? line("address", "Address", "text", "street-address", "pc-indent") : null}
                {fields.includes("phone") ? line("phone", "Phone", "tel", "tel", "pc-indent") : null}
              </div>
            </div>

            <input ref={trapRef} className="pc-trap" name="company" tabIndex={-1} autoComplete="off" aria-hidden="true" defaultValue="" />
          </form>

          {/* The envelope, back side up. Its pieces are siblings of the card so
              the card can sit between the lining and the pocket. */}
          <div className="pc-env pc-env-shadow" style={{ ...envBox, backgroundColor: envelope }} />
          <div className="pc-env pc-env-back" style={{ ...envBox, ...envPaper }} />
          <div className="pc-env pc-env-pocket" style={envBox}>
            <div style={{ ...envPaper, clipPath: "polygon(0 0, 50% 52%, 100% 0, 100% 100%, 0 100%)" }} />
          </div>
          <div className="pc-env pc-env-bottom" style={envBox}>
            <div
              style={{
                ...envPaper,
                clipPath: "polygon(0 100%, 43% 55%, 46.5% 51%, 48.6% 49.6%, 50% 49.2%, 51.4% 49.6%, 53.5% 51%, 57% 55%, 100% 100%)",
              }}
            />
          </div>
          <div className="pc-env pc-env-flap" style={{ ...envBox, height: env.h * 0.56 }}>
            <div
              style={{
                ...envPaper,
                clipPath: "polygon(0 0, 100% 0, 56.5% 86%, 53.4% 94%, 51.4% 97.6%, 50% 98.4%, 48.6% 97.6%, 46.6% 94%, 43.5% 86%)",
              }}
            />
          </div>
          {seal !== false ? (
            <div
              className="pc-env pc-env-seal"
              style={{ left: env.x + env.w / 2 - env.w * 0.055, top: env.y + env.h * 0.47, width: env.w * 0.11, height: env.w * 0.11 }}
            >
              <svg viewBox="0 0 100 100" width="100" height="100" style={{ width: "100%", height: "100%", maxWidth: "none", display: "block" }}>
                <defs>
                  <radialGradient id={uid + "wax"} cx="0.38" cy="0.34" r="0.7">
                    <stop offset="0" stopColor="#fff" stopOpacity="0.35" />
                    <stop offset="0.3" stopColor={seal} />
                    <stop offset="1" stopColor="#000" stopOpacity="0.35" />
                  </radialGradient>
                </defs>
                <path d="M50 3C62 5 70 2 80 12C90 20 97 30 96 44C99 56 95 70 86 80C78 92 64 97 50 96C36 99 22 93 14 83C4 74 2 60 4 48C2 34 8 20 20 12C30 4 40 5 50 3Z" fill={seal} />
                <path d="M50 3C62 5 70 2 80 12C90 20 97 30 96 44C99 56 95 70 86 80C78 92 64 97 50 96C36 99 22 93 14 83C4 74 2 60 4 48C2 34 8 20 20 12C30 4 40 5 50 3Z" fill={"url(#" + uid + "wax)"} />
                <circle cx="50" cy="50" r="30" fill="none" stroke="#000" strokeOpacity="0.22" strokeWidth="3" />
                <circle cx="50" cy="50" r="30" fill="none" stroke="#fff" strokeOpacity="0.18" strokeWidth="1.5" transform="translate(-1 -1)" />
                <text x="50" y="62" textAnchor="middle" fontSize="36" fontFamily="Georgia, 'Times New Roman', serif" fontStyle="italic" fill="#000" fillOpacity="0.3">
                  {initial}
                </text>
                <text x="49" y="61" textAnchor="middle" fontSize="36" fontFamily="Georgia, 'Times New Roman', serif" fontStyle="italic" fill="#fff" fillOpacity="0.16">
                  {initial}
                </text>
              </svg>
            </div>
          ) : null}
          <div className="pc-env pc-env-note" style={{ ...envBox, height: env.h * 0.4, fontSize: env.w * 0.036 }}>
            {fillTemplate(envelopeNote, data)}
          </div>
          <div className="pc-env pc-return" style={{ ...envBox, fontSize: env.w * 0.036 }}>
            <span>Return to sender</span>
          </div>
        </div>

        <div className="pc-actions" data-hidden={phase === "sending" || phase === "sent" ? "" : undefined}>
          {phase === "returned" ? (
            <>
              <span className="pc-hint" style={{ letterSpacing: ".05em", fontSize: 13 }}>
                {failure}
              </span>
              <button type="button" className="pc-send" onClick={reopen}>
                Open it back up
              </button>
            </>
          ) : (
            <>
              <span className="pc-hint pc-print" style={{ color: "var(--pc-hint)" }}>
                Ctrl / &#8984; + Enter to send
              </span>
              <button type="button" className="pc-send" onClick={send} disabled={locked}>
                <svg viewBox="0 0 24 18" width="24" height="18" aria-hidden="true">
                  <rect x="1" y="1" width="22" height="16" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
                  <path d="M1.5 2L12 10L22.5 2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                </svg>
                {sendLabel}
              </button>
            </>
          )}
        </div>

        {phase === "sent" ? (
          <div ref={panelRef} className="pc-panel">
            <div className="pc-note" style={texture}>
              <p className="pc-print pc-small" style={{ fontSize: 11, fontFamily: "var(--pc-print-font)", color: "var(--pc-print)" }}>
                Postmarked {date}
              </p>
              <h3>{fillTemplate(thanksTitle, data)}</h3>
              <p>{fillTemplate(thanksBody, data)}</p>
              {recipient ? <div className="pc-signature">{recipient}</div> : null}
              <button type="button" className="pc-again" onClick={again}>
                Write another postcard
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <p className="pc-sr" role="status" aria-live="polite">
        {status}
      </p>
    </section>
  )
}
