"use client"

import * as React from "react"

/*
 * Wirebound Inquiry: the contact section of a studio, agency or freelancer,
 * built as a wire-bound notebook. Closed, the kraft cover is already a full
 * contact card: the studio name printed big, a highlighter band that opens the
 * brief, the email and socials written on the cover lines. Open it and the
 * project inquiry is one question per page. Every answer turns a page over the
 * wire, and the back of each turned page is the brief so far.
 *
 * Everything is drawn here: the coil is SVG in two halves (behind the pages and
 * in front of them, through punched holes), the kraft and paper grain is a
 * small canvas texture made once on the client, the cover title is SVG text in
 * system fonts measured and condensed to fit. No images, no web fonts.
 *
 * Pages turn around the binding with CSS 3D transforms only. On wide screens
 * the notebook opens into a spread; on a phone it is a single page and turned
 * pages fold away behind. Reduced motion swaps pages without turning them.
 *
 * A real form: chips with radio or checkbox semantics, optional questions,
 * inline errors, Enter for next, index tabs that jump between pages you can
 * reach, focus moved to each new page and an aria-live announcement, async
 * onSubmit with pending and error states, a receipt page and a reset.
 */

export type WireboundPreset = "kraft" | "ink" | "cobalt" | "olive"

export type WireboundPalette = {
  /** Section background. */
  field: string
  /** Text on the field. */
  text: string
  /** Secondary text on the field (keep 4.5:1). */
  muted: string
  /** Cover board. */
  cover: string
  /** The studio name printed on the cover. */
  coverPrint: string
  /** The light or dark edge under the print that makes it look pressed in. */
  coverEmboss: string
  /** Labels and lines written on the cover. */
  coverText: string
  /** Page paper. */
  paper: string
  /** Text on paper. */
  ink: string
  /** Ruled lines. */
  rule: string
  /** The margin line. */
  margin: string
  /** Highlighter: the cover band, index tabs, hover marks. */
  highlight: string
  /** Text on the highlighter. */
  onHighlight: string
  /** Ballpoint: circled answers, typed answers, focus on paper. */
  pen: string
  /** The receipt stamp and error notes. */
  stamp: string
  /** Wire coil. */
  wire: string
}

export type WireboundQuestion = {
  /** Key for this answer in the submitted brief. */
  id: string
  /** Index tab label (one short word). */
  tab: string
  /** The question, as the page title. */
  title: string
  /** One line under the title. */
  hint?: string
  options: string[]
  /** Circle several (checkboxes) instead of one (radios). */
  multiple?: boolean
  /** Can be left blank. */
  optional?: boolean
}

export type WireboundBrief = {
  /** Picked options per question id. */
  answers: { [id: string]: string[] }
  name: string
  email: string
  message: string
}

export type WireboundLink = { label: string; href: string }

export type WireboundInquiryProps = {
  /** Studio or person. Used in the copy and, by default, on the cover. */
  studio?: string
  /** Cover print. A string ("\n" fixes the line breaks) or the lines. Defaults to the studio. */
  coverTitle?: string | string[]
  /** Small label above the headline. null hides it. */
  kicker?: React.ReactNode | null
  headline?: React.ReactNode
  intro?: React.ReactNode
  /** Direct address, shown beside the notebook and on the cover. */
  email?: string
  emailLabel?: string
  socials?: WireboundLink[]
  socialsLabel?: string
  /** A short availability line, e.g. "Booking projects from January 2027". null hides it. */
  availability?: React.ReactNode | null
  /** Who reads the briefs. Used on the inside cover. */
  reader?: string
  /** How fast you reply, as it reads after "within", e.g. "two working days". */
  replyTime?: string
  /** One page per question. The details page (name, email, note) always comes last. */
  questions?: WireboundQuestion[]
  detailsTab?: string
  detailsTitle?: string
  detailsHint?: string
  nameLabel?: string
  namePlaceholder?: string
  emailFieldLabel?: string
  emailPlaceholder?: string
  messageLabel?: string
  messagePlaceholder?: string
  /** Require the note as well as name and email. */
  requireMessage?: boolean
  openLabel?: string
  nextLabel?: string
  backLabel?: string
  submitLabel?: string
  pendingLabel?: string
  closeLabel?: string
  stampLabel?: string
  resetLabel?: string
  /** Inside-cover note. A function gets the number of pages. */
  insideNote?: React.ReactNode | ((pages: number) => React.ReactNode)
  /** What happens after a brief is sent, listed in order on the receipt. Empty hides it. */
  nextSteps?: string[]
  /** Receipt copy. A function gets the brief. */
  receipt?: React.ReactNode | ((brief: WireboundBrief) => React.ReactNode)
  /**
   * Called with the brief. Resolve (optionally with a reference string, shown on the receipt) to turn to
   * the receipt; throw or reject with an Error to show its message. Without it the form succeeds after a short pause.
   */
  onSubmit?: (brief: WireboundBrief) => void | string | Promise<void | string>
  preset?: WireboundPreset
  /** Override the preset's light colours. */
  palette?: WireboundPaletteInput
  /** Override the preset's dark colours. */
  darkPalette?: WireboundPaletteInput
  /** "auto" follows a `.dark` class on any ancestor (shadcn / Tailwind convention). */
  theme?: "auto" | "light" | "dark"
  /** Section minimum height. Any definite CSS length. */
  height?: number | string
  /** Start with the notebook open on the first question. */
  defaultOpen?: boolean
  /** Font stacks. Pass your own, e.g. "var(--font-display)". */
  displayFont?: string
  textFont?: string
  monoFont?: string
  ariaLabel?: string
  id?: string
  className?: string
  style?: React.CSSProperties
}

const PALETTE_KEYS = [
  "field",
  "text",
  "muted",
  "cover",
  "coverPrint",
  "coverEmboss",
  "coverText",
  "paper",
  "ink",
  "rule",
  "margin",
  "highlight",
  "onHighlight",
  "pen",
  "stamp",
  "wire",
]

const PAPER = {
  paper: "#fbf9f2",
  ink: "#1c1b18",
  rule: "rgba(46, 96, 176, 0.24)",
  margin: "rgba(214, 70, 70, 0.5)",
  pen: "#1d3cc4",
  stamp: "#c83a2c",
}
const PAPER_DARK = { ...PAPER, paper: "#e9e5d9", rule: "rgba(46, 96, 176, 0.28)" }

const PRESETS: { [k: string]: { light: WireboundPalette; dark: WireboundPalette } } = {
  kraft: {
    light: {
      field: "#2340c9", text: "#ffffff", muted: "rgba(255, 255, 255, 0.8)",
      cover: "#c4955b", coverPrint: "#6a4823", coverEmboss: "rgba(255, 236, 200, 0.4)", coverText: "#1d150c",
      ...PAPER, highlight: "#ffd84a", onHighlight: "#17130b", wire: "#26262b",
    },
    dark: {
      field: "#0d1544", text: "#eef0ff", muted: "rgba(238, 240, 255, 0.74)",
      cover: "#b4874f", coverPrint: "#5c3d1c", coverEmboss: "rgba(255, 230, 190, 0.3)", coverText: "#1d150c",
      ...PAPER_DARK, highlight: "#ffd84a", onHighlight: "#17130b", wire: "#2e2e34",
    },
  },
  ink: {
    light: {
      field: "#ff5b2e", text: "#170d08", muted: "rgba(23, 13, 8, 0.78)",
      cover: "#1d1d21", coverPrint: "#efe9dd", coverEmboss: "rgba(0, 0, 0, 0.55)", coverText: "#efe9dd",
      ...PAPER, highlight: "#ffe45c", onHighlight: "#17130b", wire: "#b9b9c2",
    },
    dark: {
      field: "#2a0e05", text: "#ffe9df", muted: "rgba(255, 233, 223, 0.74)",
      cover: "#1d1d21", coverPrint: "#e6dfd2", coverEmboss: "rgba(0, 0, 0, 0.55)", coverText: "#e6dfd2",
      ...PAPER_DARK, highlight: "#ffe45c", onHighlight: "#17130b", wire: "#a5a5ae",
    },
  },
  cobalt: {
    light: {
      field: "#f4c430", text: "#15110a", muted: "rgba(21, 17, 10, 0.78)",
      cover: "#2446c6", coverPrint: "#f5f0e4", coverEmboss: "rgba(0, 10, 60, 0.45)", coverText: "#f5f0e4",
      ...PAPER, highlight: "#ffa3c4", onHighlight: "#1a0b12", wire: "#1c1c21",
    },
    dark: {
      field: "#2a2106", text: "#fff3cf", muted: "rgba(255, 243, 207, 0.74)",
      cover: "#2142bb", coverPrint: "#efe9dc", coverEmboss: "rgba(0, 10, 60, 0.45)", coverText: "#efe9dc",
      ...PAPER_DARK, highlight: "#ffa3c4", onHighlight: "#1a0b12", wire: "#24242a",
    },
  },
  olive: {
    light: {
      field: "#b9a8ff", text: "#17122b", muted: "rgba(23, 18, 43, 0.78)",
      cover: "#6c7838", coverPrint: "#454e1f", coverEmboss: "rgba(240, 250, 200, 0.28)", coverText: "#f5f3e6",
      ...PAPER, highlight: "#fff06a", onHighlight: "#17130b", wire: "#1d1d21",
    },
    dark: {
      field: "#1a1530", text: "#ece6ff", muted: "rgba(236, 230, 255, 0.74)",
      cover: "#64702f", coverPrint: "#3f481b", coverEmboss: "rgba(240, 250, 200, 0.24)", coverText: "#f5f3e6",
      ...PAPER_DARK, highlight: "#fff06a", onHighlight: "#17130b", wire: "#26262b",
    },
  },
}

const DEFAULT_QUESTIONS: WireboundQuestion[] = [
  {
    id: "project",
    tab: "Project",
    title: "What are we making?",
    hint: "Circle all that apply.",
    options: ["Brand identity", "Website", "Product design", "Packaging", "Motion", "Not sure yet"],
    multiple: true,
  },
  {
    id: "budget",
    tab: "Budget",
    title: "Roughly what budget?",
    hint: "A range is fine. Skip it if you'd rather talk.",
    options: ["Under $10k", "$10k to $25k", "$25k to $50k", "$50k and up"],
    optional: true,
  },
  {
    id: "timing",
    tab: "Timing",
    title: "When does it need to launch?",
    hint: "Pick the closest.",
    options: ["As soon as possible", "In 1 to 3 months", "Later this year", "Just exploring"],
  },
]

const DEFAULT_SOCIALS: WireboundLink[] = [
  { label: "Instagram", href: "https://instagram.com" },
  { label: "LinkedIn", href: "https://linkedin.com" },
  { label: "Are.na", href: "https://are.na" },
]

const DEFAULT_NEXT = ["We read it together.", "You get a plan and price.", "A short call if it fits."]

// #region logic
export type WireboundLayout = {
  mode: "wide" | "stacked" | "single"
  pad: number
  tab: number
  gap: number
  pageW: number
  pageH: number
  rule: number
  textW: number
}

/** Page size and arrangement for a section this wide. */
export function layoutFor(width: number): WireboundLayout {
  const w = Math.max(280, width || 0)
  if (w >= 1220) {
    const pad = 56
    const tab = 26
    const gap = 30
    const textW = Math.round(Math.min(460, Math.max(340, w * 0.3)))
    const stage = Math.min(w, 1560) - pad * 2 - textW - 40
    const pageW = Math.floor(Math.min(430, (stage - gap - tab * 2) / 2))
    const pageH = Math.max(Math.round(pageW * 1.32), 470)
    return { mode: "wide", pad, tab, gap, pageW, pageH, rule: ruleFor(pageH), textW }
  }
  if (w >= 760) {
    const pad = 32
    const tab = 24
    const gap = 28
    const pageW = Math.floor(Math.min(400, (w - pad * 2 - gap - tab * 2) / 2))
    const pageH = Math.max(Math.round(pageW * 1.32), 450)
    return { mode: "stacked", pad, tab, gap, pageW, pageH, rule: ruleFor(pageH), textW: Math.min(680, w - pad * 2) }
  }
  const pad = 16
  const tab = 24
  const gap = 24
  const pageW = Math.floor(Math.min(440, w - pad * 2 - gap - tab))
  const pageH = Math.max(Math.round(pageW * 1.62), 520)
  return { mode: "single", pad, tab, gap, pageW, pageH, rule: 27, textW: w - pad * 2 }
}

/** Ruled-line spacing: about 17 lines a page, never cramped, never airy. */
export function ruleFor(pageH: number) {
  return Math.max(26, Math.min(31, Math.round(pageH / 17)))
}

/** Coil loop centres down the binding. */
export function ringYs(pageH: number) {
  const inset = 22
  const n = Math.max(6, Math.floor((pageH - inset * 2) / 24) + 1)
  const step = (pageH - inset * 2) / (n - 1)
  const out: number[] = []
  for (let i = 0; i < n; i++) out.push(Math.round(inset + i * step))
  return out
}

export function isEmail(s: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s.trim())
}

export function toggleOption(picked: string[], option: string, multiple: boolean) {
  if (!multiple) return picked[0] === option ? [] : [option]
  return picked.indexOf(option) > -1 ? picked.filter((p) => p !== option) : picked.concat(option)
}

/** The first question (index) that blocks moving past `upto`, or -1. */
export function firstBlocked(questions: { optional?: boolean; id: string }[], answers: { [id: string]: string[] }, upto: number) {
  for (let i = 0; i < Math.min(upto, questions.length); i++) {
    const q = questions[i]
    if (!q.optional && !(answers[q.id] && answers[q.id].length)) return i
  }
  return -1
}

export function detailsErrors(name: string, email: string, message: string, requireMessage: boolean) {
  const out: { name?: string; email?: string; message?: string } = {}
  if (!name.trim()) out.name = "Add a name so we know who to reply to."
  if (!email.trim()) out.email = "Add an email address."
  else if (!isEmail(email)) out.email = "That address looks incomplete."
  if (requireMessage && !message.trim()) out.message = "Add a line about the project."
  return out
}

export function firstName(name: string) {
  return name.trim().split(/\s+/)[0] || ""
}

/** Split a cover title into at most `max` balanced lines. */
export function coverLines(title: string | string[], max: number) {
  if (Array.isArray(title)) return title.filter(Boolean).slice(0, max)
  if (title.indexOf("\n") > -1) return title.split("\n").map((s) => s.trim()).filter(Boolean).slice(0, max)
  const words = title.trim().split(/\s+/)
  if (words.length < 2 || title.length <= 9) return [title.trim()]
  let best = [title.trim()]
  let score = Infinity
  for (let i = 1; i < words.length; i++) {
    const a = words.slice(0, i).join(" ")
    const b = words.slice(i).join(" ")
    const s = Math.abs(a.length - b.length)
    if (s < score) {
      score = s
      best = [a, b]
    }
  }
  return best.slice(0, max)
}

/** Horizontal squeeze and size for one cover line: condensed look, never wider than the cover. */
export function fitLine(natural: number, avail: number, size: number) {
  const ideal = 0.74
  if (natural <= 0) return { scale: ideal, size }
  const scale = Math.min(ideal, avail / natural)
  if (scale >= 0.46) return { scale, size }
  return { scale: 0.46, size: (size * scale) / 0.46 }
}
// #endregion logic

// "rule" is also the line spacing, so the colour gets its own name.
const cssName = (k: string) => (k === "rule" ? "rulec" : k)

const CSS_VARS =
  ".wbi{" +
  PALETTE_KEYS.map((k) => "--" + cssName(k) + ":var(--wl-" + k + ");").join("") +
  "}" +
  ':where(.dark) .wbi[data-theme="auto"],.wbi[data-theme="dark"]{' +
  PALETTE_KEYS.map((k) => "--" + cssName(k) + ":var(--wd-" + k + ");").join("") +
  "}"

const CSS = `
.wbi {
  --ease-turn: cubic-bezier(0.62, 0.04, 0.24, 1);
  --ease-out: cubic-bezier(0.23, 1, 0.32, 1);
  position: relative;
  isolation: isolate;
  overflow: hidden;
  display: flex;
  align-items: center;
  width: 100%;
  background: var(--field);
  color: var(--text);
  font-family: var(--wbi-sans);
  container-type: inline-size;
  -webkit-font-smoothing: antialiased;
}
.wbi *, .wbi *::before, .wbi *::after { box-sizing: border-box; }
.wbi svg { max-width: none; }
:where(.wbi) button { font: inherit; color: inherit; background: none; border: 0; margin: 0; padding: 0; cursor: pointer; text-align: inherit; }
:where(.wbi) a { color: inherit; }
.wbi-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }

.wbi-inner {
  position: relative;
  width: 100%;
  max-width: 1560px;
  margin: 0 auto;
  display: grid;
  align-items: center;
  gap: 40px;
}
.wbi[data-mode="wide"] .wbi-inner { grid-template-columns: var(--text-w) minmax(0, 1fr); }
.wbi[data-mode="stacked"] .wbi-inner, .wbi[data-mode="single"] .wbi-inner { grid-template-columns: minmax(0, 1fr); gap: 36px; }

/* Intro beside the notebook */
.wbi-intro { max-width: var(--text-w); }
.wbi-kicker {
  display: inline-block;
  margin: 0 0 22px;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text);
}
.wbi-kicker::before {
  content: "";
  display: inline-block;
  width: 9px;
  height: 9px;
  margin-right: 10px;
  border-radius: 2px;
  background: var(--highlight);
  transform: translateY(-1px) rotate(45deg);
}
.wbi-headline {
  margin: 0;
  font-family: var(--wbi-display);
  font-weight: 900;
  font-size: clamp(42px, 5.6cqi, 88px);
  line-height: 0.94;
  letter-spacing: -0.035em;
  text-wrap: balance;
}
.wbi[data-mode="single"] .wbi-headline { font-size: clamp(38px, 11.5cqi, 56px); }
.wbi-intro-copy {
  margin: 24px 0 0;
  max-width: 34em;
  font-size: 17px;
  line-height: 1.55;
  color: var(--muted);
}
.wbi-direct { margin-top: 34px; display: grid; gap: 18px; }
.wbi-label {
  display: block;
  margin-bottom: 6px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--muted);
}
.wbi-mark {
  text-decoration: none;
  padding: 0 0.12em;
  margin: 0 -0.12em;
  background-image: linear-gradient(var(--highlight), var(--highlight));
  background-repeat: no-repeat;
  background-size: 100% 0.2em;
  background-position: 0 92%;
  transition: background-size 260ms var(--ease-out), color 200ms ease;
}
.wbi-mark:hover { background-size: 100% 100%; color: var(--onHighlight); }
.wbi-mark:focus-visible { outline: 2px solid var(--highlight); outline-offset: 4px; border-radius: 2px; }
.wbi-email {
  font-family: var(--wbi-mono);
  font-weight: 700;
  font-size: clamp(17px, 1.7cqi, 22px);
  overflow-wrap: anywhere;
}
.wbi-socials { display: flex; flex-wrap: wrap; gap: 6px 22px; margin: 0; padding: 0; list-style: none; font-size: 16px; font-weight: 600; }
.wbi-avail { display: flex; align-items: baseline; gap: 10px; font-size: 15px; color: var(--muted); }
.wbi-avail::before { content: ""; flex: none; width: 18px; height: 2px; background: var(--highlight); transform: translateY(-4px); }

/* The stage and the book */
.wbi-stage { position: relative; display: flex; justify-content: center; align-items: center; min-width: 0; }
.wbi-book {
  position: relative;
  flex: none;
  transition: transform 720ms var(--ease-turn);
}
.wbi-shadow {
  position: absolute;
  border-radius: 6px;
  box-shadow: 0 34px 60px -22px rgba(0, 0, 0, 0.5), 0 10px 22px -8px rgba(0, 0, 0, 0.32);
  pointer-events: none;
}
.wbi-board {
  position: absolute;
  border-radius: 3px 7px 7px 3px;
  background-color: var(--cover);
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.12);
}
.wbi-board::after, .wbi-kraft::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background-image: var(--wbi-fibre);
  background-size: 256px 256px;
  mix-blend-mode: multiply;
  opacity: 0.55;
  pointer-events: none;
}
.wbi-edges {
  position: absolute;
  border-radius: 2px 5px 5px 2px;
  background: var(--paper);
  box-shadow: 1px 1px 0 rgba(0, 0, 0, 0.06), 2px 2px 0 var(--paper), 3px 3px 0 rgba(0, 0, 0, 0.08), 4px 4px 0 var(--paper), 5px 5px 0 rgba(0, 0, 0, 0.1);
  transition: opacity 300ms ease;
}

.wbi-sheet {
  position: absolute;
  top: 0;
  transform-style: preserve-3d;
  transform: perspective(var(--persp)) rotateY(0deg);
  transition: transform var(--dur, 620ms) var(--ease-turn) var(--delay, 0ms);
  will-change: transform;
}
.wbi-sheet[data-turned] { transform: perspective(var(--persp)) rotateY(-180deg); }
.wbi-sheet[data-peek]:hover, .wbi-sheet[data-peek]:focus-within { transform: perspective(var(--persp)) rotateY(-11deg); transition-duration: 380ms; }
.wbi[data-mode="single"] .wbi-sheet[data-turned]:not([data-turning]) { visibility: hidden; }
.wbi-face {
  position: absolute;
  inset: 0;
  overflow: hidden;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}
.wbi-back { transform: rotateY(180deg); }
.wbi-shade {
  position: absolute;
  inset: 0;
  opacity: 0;
  pointer-events: none;
  background: linear-gradient(90deg, rgba(0, 0, 0, 0.42), rgba(0, 0, 0, 0.08) 60%, rgba(0, 0, 0, 0.2));
}
.wbi-back .wbi-shade { background: linear-gradient(270deg, rgba(0, 0, 0, 0.42), rgba(0, 0, 0, 0.08) 60%, rgba(0, 0, 0, 0.2)); }
.wbi-sheet[data-turning] .wbi-shade { animation: wbi-shade var(--dur, 620ms) var(--ease-turn) var(--delay, 0ms) both; }
@keyframes wbi-shade { 0% { opacity: 0; } 50% { opacity: 1; } 100% { opacity: 0; } }

/* Kraft cover */
.wbi-kraft {
  background-color: var(--cover);
  border-radius: 2px 7px 7px 2px;
  color: var(--coverText);
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.14), inset -10px 0 22px -14px rgba(0, 0, 0, 0.35), inset 0 -14px 30px -24px rgba(0, 0, 0, 0.4);
}
.wbi-inside { background-color: color-mix(in srgb, var(--cover) 72%, #fff 28%); border-radius: 7px 2px 2px 7px; }
.wbi-cover-title { position: absolute; display: block; overflow: visible; pointer-events: none; }
.wbi-cover-title text { font-family: var(--wbi-display); font-weight: 900; }
.wbi-band {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 0 14px;
  border: 1.5px solid var(--onHighlight);
  background: var(--highlight);
  color: var(--onHighlight);
  font-size: calc(12.5px * var(--u));
  font-weight: 800;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  box-shadow: 0 1px 0 rgba(0, 0, 0, 0.16);
  transition: transform 160ms var(--ease-out), box-shadow 200ms ease;
}
.wbi-band:hover { box-shadow: 0 3px 0 rgba(0, 0, 0, 0.22); transform: translateY(-1px); }
.wbi-band:active { transform: translateY(0) scale(0.985); }
.wbi-band:focus-visible { outline: 2px solid var(--coverText); outline-offset: 3px; }
.wbi-arrow { display: inline-block; transition: transform 240ms var(--ease-out); }
.wbi-band:hover .wbi-arrow, .wbi-next:hover .wbi-arrow { transform: translateX(5px); }
.wbi-cover-lines { position: absolute; display: grid; gap: calc(14px * var(--u)); }
.wbi-cover-line {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 4px 12px;
  padding-bottom: 5px;
  border-bottom: 2px solid var(--highlight);
}
.wbi-cover-line .wbi-cl { font-size: calc(11px * var(--u)); font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; }
.wbi-cover-line a {
  font-family: var(--wbi-mono);
  font-weight: 700;
  font-size: max(13px, calc(15px * var(--u)));
  text-decoration: none;
  overflow-wrap: anywhere;
  border-radius: 2px;
}
.wbi-cover-line a:hover { text-decoration: underline; text-decoration-thickness: 2px; text-underline-offset: 3px; }
.wbi-cover-line a:focus-visible { outline: 2px solid var(--highlight); outline-offset: 2px; }
.wbi-cover-foot {
  position: absolute;
  font-family: var(--wbi-mono);
  font-size: calc(11px * var(--u));
  letter-spacing: 0.02em;
  opacity: 0.82;
}

/* Paper */
.wbi-paper {
  background-color: var(--paper);
  color: var(--ink);
  border-radius: 1px 4px 4px 1px;
  background-image:
    linear-gradient(var(--paper), var(--paper)),
    repeating-linear-gradient(to bottom, transparent 0, transparent calc(var(--rule) - 1px), var(--rulec) calc(var(--rule) - 1px), var(--rulec) var(--rule));
  background-size: 100% var(--head), 100% var(--rule);
  background-repeat: no-repeat, repeat;
  background-position: 0 0, 0 var(--rule-shift);
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.06);
}
.wbi-back.wbi-paper { border-radius: 4px 1px 1px 4px; }
.wbi-paper::after {
  content: "";
  position: absolute;
  inset: 0;
  background-image: var(--wbi-grain);
  background-size: 200px 200px;
  mix-blend-mode: multiply;
  opacity: 0.5;
  pointer-events: none;
}
.wbi-marginline { position: absolute; top: 0; bottom: 0; width: 1.5px; background: var(--margin); }
.wbi-hole {
  position: absolute;
  width: 7px;
  height: 9px;
  border-radius: 3px;
  background: radial-gradient(circle at 50% 35%, rgba(0, 0, 0, 0.72), rgba(0, 0, 0, 0.5) 70%);
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.35);
}
.wbi-kraft .wbi-hole { background: radial-gradient(circle at 50% 35%, rgba(0, 0, 0, 0.78), rgba(0, 0, 0, 0.6) 70%); }

.wbi-page {
  position: absolute;
  top: var(--head);
  bottom: 0;
  display: flex;
  flex-direction: column;
  line-height: var(--rule);
  outline: none;
}
.wbi-meta {
  position: absolute;
  top: calc(var(--head) - var(--rule) - 2px);
  display: flex;
  justify-content: space-between;
  gap: 10px;
  font-family: var(--wbi-mono);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  line-height: var(--rule);
  color: color-mix(in srgb, var(--ink) 62%, transparent);
}
.wbi-q {
  margin: 0;
  font-family: var(--wbi-display);
  font-weight: 900;
  font-size: max(20px, calc(26px * var(--u)));
  line-height: var(--rule);
  letter-spacing: -0.02em;
  text-wrap: balance;
  outline: none;
}
.wbi-q:focus, .wbi-q:focus-visible { outline: none; }
.wbi-hint { margin: 0; font-size: max(13px, calc(14px * var(--u))); line-height: var(--rule); color: color-mix(in srgb, var(--ink) 68%, transparent); }
.wbi-chips { display: flex; flex-wrap: wrap; gap: calc(var(--rule) * 0.42) 10px; margin: calc(var(--rule) * 0.5) 0 0; padding: 0; list-style: none; }
.wbi-chip {
  position: relative;
  display: inline-flex;
  align-items: center;
  height: calc(var(--rule) - 4px);
  padding: 0 12px;
  border-radius: 999px;
  border: 1px dashed color-mix(in srgb, var(--ink) 38%, transparent);
  font-size: max(14px, calc(15px * var(--u)));
  font-weight: 600;
  white-space: nowrap;
  transition: transform 150ms var(--ease-out), color 160ms ease, border-color 160ms ease, background-color 160ms ease;
}
.wbi-chip:hover { background: color-mix(in srgb, var(--highlight) 55%, transparent); border-color: transparent; }
.wbi-chip::before { content: ""; position: absolute; inset: -5px -4px; }
.wbi-chip:active { transform: scale(0.96); }
.wbi-chip:focus-visible { outline: 2px solid var(--pen); outline-offset: 3px; }
.wbi-chip[aria-checked="true"] { color: var(--pen); border-color: transparent; }
.wbi-loop {
  position: absolute;
  left: -9px;
  top: -6px;
  width: calc(100% + 18px);
  height: calc(100% + 12px);
  overflow: visible;
  pointer-events: none;
}
.wbi-loop path {
  fill: none;
  stroke: var(--pen);
  stroke-width: 2.2;
  stroke-linecap: round;
  stroke-dasharray: 1 2;
  stroke-dashoffset: 1;
  stroke-opacity: 0;
  transition: stroke-dashoffset 340ms var(--ease-out), stroke-opacity 60ms linear;
}
.wbi-chip[aria-checked="true"] .wbi-loop path { stroke-dashoffset: 0; stroke-opacity: 1; }

.wbi-error {
  display: flex;
  gap: 8px;
  margin: 0;
  min-height: var(--rule);
  font-family: var(--wbi-mono);
  font-size: 13px;
  line-height: var(--rule);
  color: var(--stamp);
}
.wbi-nav {
  margin-top: auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  height: calc(var(--rule) * 2);
  padding-bottom: calc(var(--rule) * 0.45);
}
.wbi-backbtn {
  font-size: 14px;
  font-weight: 700;
  white-space: nowrap;
  padding: 6px 2px;
  border-radius: 3px;
  color: color-mix(in srgb, var(--ink) 78%, transparent);
  transition: color 160ms ease;
}
.wbi-backbtn:hover { color: var(--ink); text-decoration: underline; text-underline-offset: 4px; }
.wbi-backbtn:focus-visible, .wbi-next:focus-visible, .wbi-sumrow:focus-visible, .wbi-tab:focus-visible { outline: 2px solid var(--pen); outline-offset: 3px; }
.wbi-next {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  height: 42px;
  padding: 0 18px;
  white-space: nowrap;
  border-radius: 3px;
  background: var(--ink);
  color: var(--paper);
  font-size: 14px;
  font-weight: 800;
  letter-spacing: 0.02em;
  box-shadow: 3px 3px 0 var(--highlight);
  transition: transform 160ms var(--ease-out), box-shadow 200ms var(--ease-out), opacity 200ms ease;
}
.wbi[data-mode="single"] .wbi-next { padding: 0 14px; gap: 8px; }
.wbi-next:hover { transform: translate(-1px, -1px); box-shadow: 5px 5px 0 var(--highlight); }
.wbi-next:active { transform: translate(1px, 1px) scale(0.98); box-shadow: 1px 1px 0 var(--highlight); }
.wbi-next[aria-disabled="true"] { opacity: 0.7; cursor: progress; }
.wbi-dots { display: inline-flex; gap: 3px; }
.wbi-dots i { width: 4px; height: 4px; border-radius: 50%; background: currentColor; animation: wbi-dot 900ms ease-in-out infinite; }
.wbi-dots i:nth-child(2) { animation-delay: 120ms; }
.wbi-dots i:nth-child(3) { animation-delay: 240ms; }
@keyframes wbi-dot { 0%, 100% { opacity: 0.25; } 50% { opacity: 1; } }

/* Details fields written on the rules */
.wbi-fields { display: grid; grid-template-columns: minmax(0, 1fr); margin-top: calc(var(--rule) * 0.5); }
.wbi-field { display: flex; align-items: flex-end; gap: 12px; height: var(--rule); }
.wbi-field label, .wbi-flabel {
  flex: none;
  width: var(--lab-w);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  line-height: var(--rule);
  color: color-mix(in srgb, var(--ink) 72%, transparent);
}
.wbi-input, .wbi-textarea {
  flex: 1 1 0;
  width: 0;
  min-width: 0;
  height: var(--rule);
  padding: 0 4px;
  border: 0;
  border-radius: 0;
  background: transparent;
  font-family: var(--wbi-mono);
  font-size: 16px;
  font-weight: 600;
  line-height: var(--rule);
  color: var(--pen);
  caret-color: var(--pen);
  outline: none;
  box-shadow: inset 0 -2px 0 transparent;
  transition: background-color 160ms ease, box-shadow 160ms ease;
}
.wbi-input::placeholder, .wbi-textarea::placeholder { color: color-mix(in srgb, var(--ink) 40%, transparent); font-weight: 500; }
.wbi-input:focus, .wbi-textarea:focus { background-color: color-mix(in srgb, var(--highlight) 35%, transparent); box-shadow: inset 0 -2px 0 var(--pen); }
.wbi-input[aria-invalid="true"] { box-shadow: inset 0 -2px 0 var(--stamp); }
.wbi-textarea { display: block; flex: none; width: 100%; height: calc(var(--rule) * var(--msg-rows)); resize: none; overflow: auto; }
.wbi-msg { margin-top: 0; }

/* Summary on the back of turned pages */
.wbi-sumhead { margin: 0; font-size: 11px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; line-height: var(--rule); color: color-mix(in srgb, var(--ink) 70%, transparent); }
.wbi-sumlist { margin: 0; padding: 0; list-style: none; }
.wbi-sumrow {
  display: grid;
  grid-template-columns: var(--lab-w) minmax(0, 1fr);
  gap: 12px;
  width: 100%;
  min-height: var(--rule);
  border-radius: 2px;
  line-height: var(--rule);
}
button.wbi-sumrow:hover { background: color-mix(in srgb, var(--highlight) 40%, transparent); }
.wbi-sumrow .wbi-sk { font-size: 11px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; color: color-mix(in srgb, var(--ink) 66%, transparent); }
.wbi-sumrow .wbi-sv { font-family: var(--wbi-mono); font-size: 14px; font-weight: 600; color: var(--pen); overflow-wrap: anywhere; }
.wbi-sumrow .wbi-sv.wbi-empty { color: color-mix(in srgb, var(--ink) 45%, transparent); font-weight: 500; }
.wbi-note { margin: 0; font-family: var(--wbi-mono); font-size: max(13px, calc(14px * var(--u))); line-height: var(--rule); }
.wbi-toc { margin: 0; padding: 0; list-style: none; font-family: var(--wbi-mono); font-size: 13px; line-height: var(--rule); }
.wbi-toc li { display: flex; gap: 10px; }
.wbi-toc li span:first-child { width: 2ch; opacity: 0.6; }
.wbi-closebtn { font-size: 13px; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase; padding: 6px 2px; border-radius: 2px; }
.wbi-closebtn:hover { text-decoration: underline; text-underline-offset: 4px; }
.wbi-closebtn:focus-visible { outline: 2px solid var(--coverText); outline-offset: 3px; }

/* Receipt */
.wbi-stamp {
  align-self: flex-start;
  display: inline-grid;
  justify-items: center;
  margin: calc(var(--rule) * 0.5) 0 calc(var(--rule) * 0.5) 6px;
  padding: 6px 16px 5px;
  border: 3px solid var(--stamp);
  outline: 1.5px solid var(--stamp);
  outline-offset: 3px;
  border-radius: 4px;
  color: var(--stamp);
  transform: rotate(-6deg);
  mix-blend-mode: multiply;
  opacity: 0.92;
}
.wbi-stamp b { font-family: var(--wbi-display); font-size: max(26px, calc(34px * var(--u))); font-weight: 900; letter-spacing: 0.06em; line-height: 1.05; text-transform: uppercase; }
.wbi-stamp small { font-family: var(--wbi-mono); font-size: 11px; font-weight: 700; letter-spacing: 0.06em; line-height: 1.4; text-transform: uppercase; }
.wbi-sheet[data-current] .wbi-stamp { animation: wbi-stamp 420ms var(--ease-out) both; animation-delay: calc(var(--delay, 0ms) + 380ms); }
@keyframes wbi-stamp { 0% { opacity: 0; transform: rotate(-6deg) scale(1.35); } 60% { opacity: 0.92; transform: rotate(-6deg) scale(0.97); } 100% { opacity: 0.92; transform: rotate(-6deg) scale(1); } }

/* Index tabs */
.wbi-tab {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--ink);
  background: color-mix(in srgb, var(--paper) 70%, var(--highlight) 30%);
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.12), 1px 1px 0 rgba(0, 0, 0, 0.1);
  transition: background-color 160ms ease, padding 200ms var(--ease-out);
}
.wbi-tab span { writing-mode: vertical-rl; white-space: nowrap; }
.wbi-tab[data-side="r"] { border-radius: 0 6px 6px 0; }
.wbi-tab[data-side="l"] { border-radius: 6px 0 0 6px; transform: rotateY(180deg); }
.wbi-tab[data-side="l"] span { transform: rotate(180deg); }
.wbi-tab:hover { background: var(--highlight); }
.wbi-tab:active { filter: brightness(0.94); }
.wbi-tab[aria-current="step"] { background: var(--highlight); color: var(--onHighlight); }
.wbi-tab[data-done] span::after { content: " \\2713"; }

.wbi-coil { position: absolute; top: 0; overflow: visible; pointer-events: none; }

@media (prefers-reduced-motion: reduce) {
  .wbi-sheet, .wbi-book, .wbi-band, .wbi-next, .wbi-chip, .wbi-mark, .wbi-loop path { transition-duration: 0ms !important; transition-delay: 0ms !important; }
  .wbi-sheet[data-peek]:hover, .wbi-sheet[data-peek]:focus-within { transform: perspective(var(--persp)) rotateY(0deg); }
  .wbi-sheet[data-turning] .wbi-shade, .wbi-dots i { animation: none; }
  .wbi-sheet[data-current] .wbi-page { animation: wbi-fade 220ms ease both; }
  .wbi-sheet[data-current] .wbi-stamp { animation: none; }
}
@keyframes wbi-fade { from { opacity: 0; } to { opacity: 1; } }
`

const SANS = 'Inter, "Helvetica Neue", "Segoe UI", "Liberation Sans", Arial, system-ui, sans-serif'
const DISPLAY = '"Arial Black", "Inter Display", Inter, "Helvetica Neue", "Liberation Sans", Arial, sans-serif'
const MONO = '"IBM Plex Mono", "JetBrains Mono", "SF Mono", Menlo, Consolas, "Liberation Mono", "Courier New", monospace'

const useIsoLayoutEffect = typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect

/* Grain: kraft fibres and paper tooth, drawn once per page load. */
let grainCache: { fibre: string; grain: string } | null = null
function makeGrain() {
  if (grainCache) return grainCache
  if (typeof document === "undefined") return null
  try {
    const rand = (() => {
      let s = 7
      return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646
    })()
    const fc = document.createElement("canvas")
    fc.width = fc.height = 256
    const f = fc.getContext("2d")
    if (!f) return null
    f.fillStyle = "#fff"
    f.fillRect(0, 0, 256, 256)
    const img = f.getImageData(0, 0, 256, 256)
    for (let i = 0; i < img.data.length; i += 4) {
      const v = 214 + rand() * 41
      img.data[i] = v
      img.data[i + 1] = v
      img.data[i + 2] = v
    }
    f.putImageData(img, 0, 0)
    for (let i = 0; i < 900; i++) {
      const x = rand() * 256
      const y = rand() * 256
      const a = rand() * Math.PI
      const l = 3 + rand() * 11
      const dark = rand() < 0.72
      f.strokeStyle = dark ? "rgba(70, 45, 20," + (0.12 + rand() * 0.22) + ")" : "rgba(255, 245, 225," + (0.3 + rand() * 0.3) + ")"
      f.lineWidth = 0.5 + rand() * 0.9
      f.beginPath()
      for (const dx of [-256, 0, 256]) {
        for (const dy of [-256, 0, 256]) {
          f.moveTo(x + dx, y + dy)
          f.lineTo(x + dx + Math.cos(a) * l, y + dy + Math.sin(a) * l)
        }
      }
      f.stroke()
    }
    const gc = document.createElement("canvas")
    gc.width = gc.height = 200
    const g = gc.getContext("2d")
    if (!g) return null
    const gimg = g.createImageData(200, 200)
    for (let i = 0; i < gimg.data.length; i += 4) {
      const v = 236 + rand() * 19
      gimg.data[i] = v
      gimg.data[i + 1] = v
      gimg.data[i + 2] = v - 4
      gimg.data[i + 3] = 255
    }
    g.putImageData(gimg, 0, 0)
    grainCache = { fibre: "url(" + fc.toDataURL("image/png") + ")", grain: "url(" + gc.toDataURL("image/png") + ")" }
    return grainCache
  } catch {
    return null
  }
}

/* A hand-drawn loop: not quite closed, overlapping at the start like a real pen circle. */
const LOOP_PATH = "M 18 8 C 42 0.8 86 1.6 97 12.8 C 105 24 78 38.4 42 38 C 12 37.6 -3 27.2 3 16.8 C 7 8.8 25 3.2 46 2"

function resolvePalette(preset: string, light: WireboundPaletteInput | undefined, dark: WireboundPaletteInput | undefined) {
  const base = PRESETS[preset] || PRESETS.kraft
  return { light: { ...base.light, ...(light || {}) }, dark: { ...base.dark, ...(dark || {}) } }
}

export default function WireboundInquiry({
  studio = "Marlowe & Pike",
  coverTitle,
  kicker = "New projects",
  headline = "Start with a page, not a call.",
  intro = "Four short questions about what you're making. We read every brief ourselves and write back with a rough plan and a price range.",
  email = "hello@marlowepike.studio",
  emailLabel = "Or write to",
  socials = DEFAULT_SOCIALS,
  socialsLabel = "Elsewhere",
  availability = "Booking projects from January 2027",
  reader = "Ines Marlowe",
  replyTime = "two working days",
  questions = DEFAULT_QUESTIONS,
  detailsTab = "You",
  detailsTitle = "Last page. Who's writing?",
  detailsHint = "We reply to this address, nowhere else.",
  nameLabel = "Name",
  namePlaceholder = "Your name",
  emailFieldLabel = "Email",
  emailPlaceholder = "you@company.com",
  messageLabel = "Notes",
  messagePlaceholder = "Links, deadlines, anything we should read first",
  requireMessage = false,
  openLabel = "Open the brief",
  nextLabel = "Next page",
  backLabel = "Back",
  submitLabel = "Send the brief",
  pendingLabel = "Sending",
  closeLabel = "Close the notebook",
  stampLabel = "Received",
  resetLabel = "Start a new brief",
  insideNote,
  nextSteps = DEFAULT_NEXT,
  receipt,
  onSubmit,
  preset = "kraft",
  palette,
  darkPalette,
  theme = "auto",
  height = "100svh",
  defaultOpen = false,
  displayFont,
  textFont,
  monoFont,
  ariaLabel,
  id,
  className,
  style,
}: WireboundInquiryProps) {
  const rootRef = React.useRef(null as HTMLElement | null)
  const sheetRefs = React.useRef([] as (HTMLDivElement | null)[])
  const titleRefs = React.useRef([] as (SVGTextElement | null)[])
  const timers = React.useRef([] as number[])
  const focusAfter = React.useRef(-1)
  const uid = React.useId().replace(/[^a-zA-Z0-9_-]/g, "")

  const [width, setWidth] = React.useState(() => (typeof window === "undefined" ? 1440 : window.innerWidth))
  const [grain, setGrain] = React.useState(null as { fibre: string; grain: string } | null)
  const [reduced, setReduced] = React.useState(false)
  const nQ = questions.length
  const S = nQ + 1 // steps with a tab: the questions and the details page
  const RECEIPT = nQ + 2
  const [turned, setTurned] = React.useState(defaultOpen ? 1 : 0)
  const [turning, setTurning] = React.useState({} as { [i: number]: { dur: number; delay: number } })
  const [answers, setAnswers] = React.useState({} as { [id: string]: string[] })
  const [qErrors, setQErrors] = React.useState({} as { [id: string]: string })
  const [name, setName] = React.useState("")
  const [mail, setMail] = React.useState("")
  const [message, setMessage] = React.useState("")
  const [fErrors, setFErrors] = React.useState({} as { name?: string; email?: string; message?: string })
  const [status, setStatus] = React.useState("idle" as "idle" | "pending" | "error" | "sent")
  const [sendError, setSendError] = React.useState("")
  const [reference, setReference] = React.useState("")
  const [announce, setAnnounce] = React.useState("")
  const [fit, setFit] = React.useState([] as { scale: number; size: number }[])

  const L = layoutFor(width)
  const spread = L.mode !== "single"
  const u = L.pageW / 400
  const { pageW, pageH, gap, tab, rule } = L
  const rightLeft = spread ? tab + pageW + gap : gap
  const spine = rightLeft - gap / 2
  const bookW = spread ? tab * 2 + pageW * 2 + gap : gap + pageW + tab
  const head = rule * 3
  const ringR = gap / 2 + 11
  const rings = React.useMemo(() => ringYs(pageH), [pageH])
  const isOpen = turned > 0
  const pal = resolvePalette(preset, palette, darkPalette)

  // Measure the section, follow reduced motion, make the grain.
  useIsoLayoutEffect(() => {
    const el = rootRef.current
    if (!el) return
    setWidth(el.clientWidth)
    if (typeof ResizeObserver === "undefined") return
    const ro = new ResizeObserver((entries) => {
      // clientWidth: the layout maths includes the section's own padding.
      const w = (entries[0].target as HTMLElement).clientWidth
      if (w > 0) setWidth(w)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  React.useEffect(() => {
    setGrain(makeGrain())
    const mq = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : null
    if (!mq) return
    const on = () => setReduced(mq.matches)
    on()
    mq.addEventListener ? mq.addEventListener("change", on) : mq.addListener(on)
    return () => (mq.removeEventListener ? mq.removeEventListener("change", on) : mq.removeListener(on))
  }, [])
  React.useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), [])

  // Cover title: measure each line and condense it to the cover width.
  const lines = coverLines(coverTitle ?? studio.toUpperCase(), 3)
  const coverPad = Math.round(22 * u)
  const titleW = pageW - coverPad * 2 - 14
  const titleH = Math.round(pageH * 0.36)
  const lineBox = titleH / Math.max(2, lines.length)
  const baseSize = lineBox * 1.16
  useIsoLayoutEffect(() => {
    const measure = () => {
      const next = lines.map((_, i) => {
        const el = titleRefs.current[i]
        let natural = 0
        try {
          // Measured at whatever size is on screen now; normalise to the base size.
          const at = el ? parseFloat(el.getAttribute("font-size") || "") || baseSize : baseSize
          natural = el ? (el.getComputedTextLength() * baseSize) / at : 0
        } catch {
          natural = 0
        }
        return fitLine(natural, titleW, baseSize)
      })
      setFit((prev) => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next))
    }
    measure()
    const fonts = (document as Document & { fonts?: { ready: Promise<unknown> } }).fonts
    if (fonts && fonts.ready) fonts.ready.then(measure).catch(() => {})
  }, [lines.join("|"), titleW, baseSize, displayFont])

  // Move focus to the new page once its turn has landed.
  React.useEffect(() => {
    if (focusAfter.current < 0) return
    const target = focusAfter.current
    const wait = reduced ? 30 : 600
    const t = window.setTimeout(() => {
      focusAfter.current = -1
      const sheet = sheetRefs.current[target]
      const el = sheet && (sheet.querySelector("[data-focus]") as HTMLElement | null)
      if (el) el.focus({ preventScroll: true })
    }, wait)
    timers.current.push(t)
  }, [turned, reduced])

  const stepTitle = (t: number) =>
    t <= 0 ? "" : t <= nQ ? questions[t - 1].title : t === nQ + 1 ? detailsTitle : stampLabel

  const turnTo = (target: number, focus = true) => {
    const from = turned
    if (target === from) return
    const lo = Math.min(from, target)
    const hi = Math.max(from, target)
    const forward = target > from
    const count = hi - lo
    const each = 45
    const dur = forward ? 580 : 420
    const next: { [i: number]: { dur: number; delay: number } } = {}
    for (let i = lo; i < hi; i++) {
      const order = forward ? i - lo : hi - 1 - i
      next[i] = { dur: reduced ? 0 : dur, delay: reduced ? 0 : order * each }
    }
    setTurning((prev) => ({ ...prev, ...next }))
    const total = reduced ? 20 : dur + (count - 1) * each + 60
    const t = window.setTimeout(() => {
      setTurning((prev) => {
        const out = { ...prev }
        for (let i = lo; i < hi; i++) delete out[i]
        return out
      })
    }, total)
    timers.current.push(t)
    if (focus) focusAfter.current = target
    setTurned(target)
    setAnnounce(target === 0 ? "Notebook closed." : target === RECEIPT ? stampLabel : "Page " + Math.min(target, S) + " of " + S + ": " + stepTitle(target))
  }

  /** Go to a page, stopping at the first question that still needs an answer. */
  const goTo = (target: number) => {
    if (status === "pending") return
    let t = Math.max(0, Math.min(target, nQ + 1))
    if (t > turned) {
      const blocked = firstBlocked(questions, answers, t - 1)
      if (blocked > -1 && blocked + 1 < t) {
        t = blocked + 1
        const q = questions[blocked]
        setQErrors((e) => ({ ...e, [q.id]: q.multiple ? "Circle at least one to carry on." : "Circle one to carry on." }))
      }
    }
    turnTo(t)
  }

  const nextFromQuestion = (qi: number) => {
    const q = questions[qi]
    const picked = answers[q.id] || []
    if (!q.optional && !picked.length) {
      setQErrors((e) => ({ ...e, [q.id]: q.multiple ? "Circle at least one to carry on." : "Circle one to carry on." }))
      return
    }
    turnTo(qi + 2)
  }

  const pick = (q: WireboundQuestion, option: string) => {
    setAnswers((a) => ({ ...a, [q.id]: toggleOption(a[q.id] || [], option, !!q.multiple) }))
    setQErrors((e) => {
      if (!e[q.id]) return e
      const out = { ...e }
      delete out[q.id]
      return out
    })
  }

  const brief = (): WireboundBrief => {
    const out: { [id: string]: string[] } = {}
    for (const q of questions) out[q.id] = answers[q.id] || []
    return { answers: out, name: name.trim(), email: mail.trim(), message: message.trim() }
  }

  const submit = async () => {
    if (status === "pending") return
    const errs = detailsErrors(name, mail, message, requireMessage)
    setFErrors(errs)
    if (errs.name || errs.email || errs.message) {
      const sheet = sheetRefs.current[nQ + 1]
      const first = errs.name ? "name" : errs.email ? "email" : "message"
      const el = sheet && (sheet.querySelector('[data-field="' + first + '"]') as HTMLElement | null)
      if (el) el.focus()
      return
    }
    const blocked = firstBlocked(questions, answers, nQ)
    if (blocked > -1) {
      goTo(blocked + 1)
      return
    }
    setStatus("pending")
    setSendError("")
    try {
      let result: void | string = undefined
      if (onSubmit) result = await onSubmit(brief())
      else await new Promise((r) => window.setTimeout(r, 900))
      setReference(typeof result === "string" ? result : "")
      setStatus("sent")
      turnTo(RECEIPT)
    } catch (err) {
      setStatus("error")
      setSendError(err instanceof Error && err.message ? err.message : "That didn't send. Try again, or email us directly.")
    }
  }

  const reset = () => {
    turnTo(0)
    const t = window.setTimeout(() => {
      setAnswers({})
      setQErrors({})
      setName("")
      setMail("")
      setMessage("")
      setFErrors({})
      setStatus("idle")
      setSendError("")
      setReference("")
    }, reduced ? 0 : 700)
    timers.current.push(t)
  }

  // Which faces take input: the page on top on the right, and the summary on top on the left.
  const frontActive = (i: number) => i === turned
  const backActive = (i: number) => spread && i === turned - 1
  const inert = (on: boolean) => (on ? {} : { inert: "", "aria-hidden": true }) as {}

  const lightVars: { [k: string]: string } = {}
  const darkVars: { [k: string]: string } = {}
  for (const k of PALETTE_KEYS) {
    lightVars["--wl-" + k] = (pal.light as { [k: string]: string })[k]
    darkVars["--wd-" + k] = (pal.dark as { [k: string]: string })[k]
  }
  const rootStyle = {
    ...lightVars,
    ...darkVars,
    "--wbi-sans": textFont || SANS,
    "--wbi-display": displayFont || DISPLAY,
    "--wbi-mono": monoFont || MONO,
    "--wbi-fibre": grain ? grain.fibre : "none",
    "--wbi-grain": grain ? grain.grain : "none",
    "--text-w": L.textW + "px",
    "--persp": Math.round(pageW * 5.2) + "px",
    "--u": u.toFixed(3),
    "--rule": rule + "px",
    "--head": head + "px",
    "--rule-shift": head - Math.round(rule * 0.22) + "px",
    "--lab-w": Math.round(Math.max(64, 74 * u)) + "px",
    "--msg-rows": String(Math.max(2, Math.min(4, Math.floor((pageH - head - rule * (spread ? 10.5 : 13)) / rule)))),
    minHeight: typeof height === "number" ? height + "px" : height,
    padding: (L.mode === "single" ? 56 : 72) + "px " + L.pad + "px",
    ...style,
  } as React.CSSProperties

  const holeX = ringR - gap / 2 - 3.5 + 2
  const holes = (side: "f" | "b") =>
    rings.map((y, i) => (
      <span
        key={i}
        className="wbi-hole"
        style={{ top: y - 4.5, left: side === "f" ? holeX - 3.5 : undefined, right: side === "b" ? holeX - 3.5 : undefined }}
      />
    ))

  const padL = Math.round(Math.max(40, 50 * u))
  const padR = Math.round(Math.max(18, 24 * u))
  const marginX = padL - 12
  const pageBox = (side: "f" | "b") =>
    ({ left: side === "f" ? padL : padR, right: side === "f" ? padR : padL }) as React.CSSProperties

  const tabH = Math.min(70, Math.round((pageH * 0.64) / S))
  const tabTop = (j: number) => Math.round(pageH * 0.16 + j * tabH)
  const doneStep = (j: number) => (j < nQ ? (answers[questions[j].id] || []).length > 0 || (!!questions[j].optional && turned > j + 1) : status === "sent")

  const tabs = (sheetIndex: number) => {
    const j = sheetIndex - 1
    if (j < 0 || j >= S) return null
    const label = j < nQ ? questions[j].tab : detailsTab
    const current = turned === sheetIndex
    const common = {
      type: "button" as const,
      className: "wbi-tab",
      "aria-current": current ? ("step" as const) : undefined,
      "data-done": doneStep(j) ? "" : undefined,
      "aria-label": label + (current ? ", current page" : ""),
      onClick: () => goTo(sheetIndex),
      tabIndex: status === "sent" ? -1 : 0,
    }
    return (
      <>
        <button {...common} data-side="r" style={{ left: pageW - 1, top: tabTop(j), width: tab, height: tabH - 3 }}>
          <span>{label}</span>
        </button>
        {spread ? (
          <button {...common} tabIndex={-1} aria-hidden data-side="l" style={{ left: pageW - 1, top: tabTop(j), width: tab, height: tabH - 3 }}>
            <span>{label}</span>
          </button>
        ) : null}
      </>
    )
  }

  const summaryRows = (upto: number, withDetails: boolean) => (
    <ul className="wbi-sumlist">
      {questions.slice(0, upto).map((q, i) => {
        const v = (answers[q.id] || []).join(", ")
        return (
          <li key={q.id}>
            <button type="button" className="wbi-sumrow" onClick={() => goTo(i + 1)} aria-label={"Change " + q.tab + ": " + (v || "skipped")}>
              <span className="wbi-sk">{q.tab}</span>
              <span className={"wbi-sv" + (v ? "" : " wbi-empty")}>{v || "skipped"}</span>
            </button>
          </li>
        )
      })}
      {withDetails ? (
        <>
          <li className="wbi-sumrow">
            <span className="wbi-sk">{nameLabel}</span>
            <span className="wbi-sv">{name.trim()}</span>
          </li>
          <li className="wbi-sumrow">
            <span className="wbi-sk">{emailFieldLabel}</span>
            <span className="wbi-sv">{mail.trim()}</span>
          </li>
        </>
      ) : null}
    </ul>
  )

  const coverFront = (
    <div
      className="wbi-face wbi-kraft"
      onClick={(e) => {
        if (turned !== 0) return
        if ((e.target as HTMLElement).closest("a,button")) return
        goTo(1)
      }}
      style={{ cursor: turned === 0 ? "pointer" : undefined }}
      {...inert(frontActive(0))}
    >
      {holes("f")}
      <svg
        className="wbi-cover-title"
        aria-hidden
        width={titleW}
        height={titleH}
        viewBox={"0 0 " + titleW + " " + titleH}
        style={{ left: coverPad + 14, top: Math.round(coverPad * 1.1) }}
      >
        {lines.map((line, i) => {
          const f = fit[i] || { scale: 0.74, size: baseSize }
          const y = (i + 1) * lineBox - lineBox * 0.06
          const tr = "translate(" + titleW + " " + y.toFixed(1) + ") scale(" + f.scale.toFixed(3) + " 1)"
          return (
            <g key={i} transform={tr}>
              <text x={0} y={1.6} textAnchor="end" fontSize={f.size} fill="var(--coverEmboss)">
                {line}
              </text>
              <text
                ref={(el) => {
                  titleRefs.current[i] = el
                }}
                x={0}
                y={0}
                textAnchor="end"
                fontSize={f.size}
                fill="var(--coverPrint)"
              >
                {line}
              </text>
            </g>
          )
        })}
      </svg>
      <span className="wbi-sr">{lines.join(" ")}</span>
      <button
        type="button"
        className="wbi-band"
        onClick={() => goTo(1)}
        style={{ left: coverPad + 14, right: coverPad, top: Math.round(titleH + coverPad * 1.1 + 24 * u), height: Math.round(Math.max(38, 42 * u)) }}
      >
        <span>{openLabel}</span>
        <span className="wbi-arrow" aria-hidden>
          &rarr;
        </span>
      </button>
      <div
        className="wbi-cover-lines"
        style={{ left: coverPad + 14, right: coverPad, top: Math.round(titleH + coverPad * 1.1 + 24 * u + Math.max(38, 42 * u) + 30 * u) }}
      >
        {email ? (
          <div className="wbi-cover-line">
            <span className="wbi-cl">Write to</span>
            <a href={"mailto:" + email}>{email}</a>
          </div>
        ) : null}
        {socials.length ? (
          <div className="wbi-cover-line">
            <span className="wbi-cl">Find us</span>
            {socials.map((s) => (
              <a key={s.label} href={s.href} target="_blank" rel="noreferrer">
                {s.label}
              </a>
            ))}
          </div>
        ) : null}
      </div>
      <div className="wbi-cover-foot" style={{ left: coverPad + 14, right: coverPad, bottom: Math.round(coverPad * 0.9) }}>
        Replies within {replyTime}
      </div>
      <span className="wbi-shade" />
    </div>
  )

  const coverBack = (
    <div className="wbi-face wbi-back wbi-kraft wbi-inside" {...inert(backActive(0))}>
      {holes("b")}
      <div className="wbi-page" style={{ ...pageBox("b"), top: Math.round(coverPad * 1.2), color: "var(--coverText)" }}>
        <p className="wbi-sumhead" style={{ color: "inherit", opacity: 0.8 }}>
          Before you start
        </p>
        <p className="wbi-note" style={{ marginBottom: rule * 0.5 }}>
          {typeof insideNote === "function"
            ? insideNote(S)
            : insideNote ?? (
                <>
                  {S} pages, about two minutes. {reader} reads every brief and replies within {replyTime}.
                </>
              )}
        </p>
        <ol className="wbi-toc">
          {questions.map((q, i) => (
            <li key={q.id}>
              <span>{i + 1}</span>
              <span>{q.title}</span>
            </li>
          ))}
          <li>
            <span>{S}</span>
            <span>{detailsTitle}</span>
          </li>
        </ol>
        <div style={{ marginTop: "auto", paddingBottom: rule * 0.6 }}>
          <button type="button" className="wbi-closebtn" onClick={() => goTo(0)}>
            {closeLabel}
          </button>
        </div>
      </div>
      <span className="wbi-shade" />
    </div>
  )

  const questionFront = (q: WireboundQuestion, qi: number) => {
    const sheetIndex = qi + 1
    const picked = answers[q.id] || []
    const err = qErrors[q.id]
    const hid = uid + "-q" + qi
    return (
      <div className="wbi-face wbi-paper" {...inert(frontActive(sheetIndex))}>
        {holes("f")}
        <span className="wbi-marginline" style={{ left: marginX }} />
        <div className="wbi-meta" style={pageBox("f")}>
          <span>
            {sheetIndex} / {S}
          </span>
          <span>{q.optional ? "optional" : q.multiple ? "circle any" : "circle one"}</span>
        </div>
        <form
          className="wbi-page"
          style={pageBox("f")}
          noValidate
          onSubmit={(e) => {
            e.preventDefault()
            nextFromQuestion(qi)
          }}
        >
          <h3 className="wbi-q" id={hid} tabIndex={-1} data-focus>
            {q.title}
          </h3>
          {q.hint ? <p className="wbi-hint">{q.hint}</p> : null}
          <ul className="wbi-chips" role={q.multiple ? "group" : "radiogroup"} aria-labelledby={hid}>
            {q.options.map((o) => {
              const on = picked.indexOf(o) > -1
              return (
                <li key={o}>
                  <button
                    type="button"
                    className="wbi-chip"
                    role={q.multiple ? "checkbox" : "radio"}
                    aria-checked={on}
                    onClick={() => pick(q, o)}
                  >
                    <svg className="wbi-loop" viewBox="-4 -2 109 43" preserveAspectRatio="none" aria-hidden>
                      <path d={LOOP_PATH} pathLength={1} />
                    </svg>
                    {o}
                  </button>
                </li>
              )
            })}
          </ul>
          <p className="wbi-error" role="alert">
            {err ? (
              <>
                <span aria-hidden>!</span>
                {err}
              </>
            ) : null}
          </p>
          <div className="wbi-nav">
            <button type="button" className="wbi-backbtn" onClick={() => goTo(sheetIndex - 1)}>
              &larr; {backLabel}
            </button>
            <button type="submit" className="wbi-next">
              {q.optional && !picked.length ? "Skip" : nextLabel}
              <span className="wbi-arrow" aria-hidden>
                &rarr;
              </span>
            </button>
          </div>
        </form>
        <span className="wbi-shade" />
      </div>
    )
  }

  const summaryBack = (sheetIndex: number, upto: number, withDetails: boolean) => (
    <div className="wbi-face wbi-back wbi-paper" {...inert(backActive(sheetIndex))}>
      {holes("b")}
      <span className="wbi-marginline" style={{ right: marginX }} />
      <div className="wbi-meta" style={pageBox("b")}>
        <span>{withDetails ? "Your brief" : "Your brief so far"}</span>
      </div>
      <div className="wbi-page" style={pageBox("b")}>
        <p className="wbi-sumhead">{withDetails ? "Sent to " + studio : "Tap a line to change it"}</p>
        {summaryRows(upto, withDetails)}
        {withDetails && message.trim() ? (
          <p className="wbi-note" style={{ color: "var(--pen)", marginTop: rule * 0.5, display: "-webkit-box", WebkitLineClamp: 4, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {message.trim()}
          </p>
        ) : null}
        {email && !withDetails ? (
          <p className="wbi-note" style={{ marginTop: "auto", paddingBottom: rule * 0.6, fontSize: 13 }}>
            Rather talk?{" "}
            <a href={"mailto:" + email} style={{ color: "var(--pen)", fontWeight: 700 }}>
              {email}
            </a>
          </p>
        ) : null}
      </div>
      <span className="wbi-shade" />
    </div>
  )

  const detailsIndex = nQ + 1
  const detailsFront = (
    <div className="wbi-face wbi-paper" {...inert(frontActive(detailsIndex))}>
      {holes("f")}
      <span className="wbi-marginline" style={{ left: marginX }} />
      <div className="wbi-meta" style={pageBox("f")}>
        <span>
          {S} / {S}
        </span>
        <span>last page</span>
      </div>
      <form
        className="wbi-page"
        style={pageBox("f")}
        noValidate
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
      >
        <h3 className="wbi-q" tabIndex={-1} data-focus>
          {detailsTitle}
        </h3>
        {detailsHint ? <p className="wbi-hint">{detailsHint}</p> : null}
        <div className="wbi-fields">
          <div className="wbi-field">
            <label htmlFor={uid + "-name"}>{nameLabel}</label>
            <input
              id={uid + "-name"}
              data-field="name"
              className="wbi-input"
              autoComplete="name"
              placeholder={namePlaceholder}
              value={name}
              aria-invalid={fErrors.name ? true : undefined}
              aria-describedby={fErrors.name ? uid + "-ferr" : undefined}
              onChange={(e) => {
                setName(e.target.value)
                if (fErrors.name) setFErrors((f) => ({ ...f, name: undefined }))
              }}
            />
          </div>
          <div className="wbi-field">
            <label htmlFor={uid + "-email"}>{emailFieldLabel}</label>
            <input
              id={uid + "-email"}
              data-field="email"
              className="wbi-input"
              type="email"
              inputMode="email"
              autoComplete="email"
              spellCheck={false}
              placeholder={emailPlaceholder}
              value={mail}
              aria-invalid={fErrors.email ? true : undefined}
              aria-describedby={fErrors.email ? uid + "-ferr" : undefined}
              onChange={(e) => {
                setMail(e.target.value)
                if (fErrors.email) setFErrors((f) => ({ ...f, email: undefined }))
              }}
            />
          </div>
          <div className="wbi-field">
            <label htmlFor={uid + "-msg"}>{messageLabel}</label>
            <span className="wbi-hint" style={{ fontSize: 12, opacity: 0.9 }} aria-hidden>
              {requireMessage ? "" : "optional"}
            </span>
          </div>
          <textarea
            id={uid + "-msg"}
            data-field="message"
            className="wbi-textarea wbi-msg"
            rows={3}
            value={message}
            placeholder={messagePlaceholder}
            aria-invalid={fErrors.message ? true : undefined}
            onChange={(e) => {
              setMessage(e.target.value)
              if (fErrors.message) setFErrors((f) => ({ ...f, message: undefined }))
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                submit()
              }
            }}
          />
        </div>
        <p className="wbi-error" role="alert" id={uid + "-ferr"}>
          {fErrors.name || fErrors.email || fErrors.message || (status === "error" ? sendError : "") ? (
            <>
              <span aria-hidden>!</span>
              {fErrors.name || fErrors.email || fErrors.message || sendError}
            </>
          ) : null}
        </p>
        <div className="wbi-nav">
          <button type="button" className="wbi-backbtn" onClick={() => goTo(nQ)}>
            &larr; {backLabel}
          </button>
          <button type="submit" className="wbi-next" aria-disabled={status === "pending" ? true : undefined}>
            {status === "pending" ? (
              <>
                {pendingLabel}
                <span className="wbi-dots" aria-hidden>
                  <i />
                  <i />
                  <i />
                </span>
              </>
            ) : (
              <>
                {submitLabel}
                <span className="wbi-arrow" aria-hidden>
                  &rarr;
                </span>
              </>
            )}
          </button>
        </div>
      </form>
      <span className="wbi-shade" />
    </div>
  )

  const b = brief()
  const receiptFront = (
    <div className="wbi-face wbi-paper" {...inert(frontActive(RECEIPT))}>
      {holes("f")}
      <span className="wbi-marginline" style={{ left: marginX }} />
      <div className="wbi-meta" style={pageBox("f")}>
        <span>{reference ? "Ref. " + reference : studio}</span>
        <span>filed</span>
      </div>
      <div className="wbi-page" style={pageBox("f")}>
        <h3 className="wbi-q" tabIndex={-1} data-focus>
          {firstName(name) ? "Thanks, " + firstName(name) + "." : "Thanks."}
        </h3>
        <div className="wbi-stamp" aria-hidden>
          <b>{stampLabel}</b>
          <small>{studio}</small>
        </div>
        <p className="wbi-note">
          {typeof receipt === "function"
            ? receipt(b)
            : receipt ?? (
                <>
                  {reader} will reply to <span style={{ color: "var(--pen)", fontWeight: 700, overflowWrap: "anywhere" }}>{b.email}</span> within {replyTime}.
                </>
              )}
        </p>
        {nextSteps.length ? (
          <>
            <p className="wbi-sumhead" style={{ marginTop: rule * 0.5 }}>
              What happens next
            </p>
            <ol className="wbi-toc">
              {nextSteps.map((n, i) => (
                <li key={i}>
                  <span>{i + 1}</span>
                  <span>{n}</span>
                </li>
              ))}
            </ol>
          </>
        ) : null}
        <div className="wbi-nav">
          <span />
          <button type="button" className="wbi-backbtn" onClick={reset}>
            {resetLabel} &rarr;
          </button>
        </div>
      </div>
    </div>
  )

  // Sheets, top of the right-hand stack first: cover, questions, details, receipt.
  const sheets: { front: React.ReactNode; back: React.ReactNode | null; cover?: boolean }[] = [
    { front: coverFront, back: coverBack, cover: true },
    ...questions.map((q, qi) => ({ front: questionFront(q, qi), back: summaryBack(qi + 1, qi + 1, false) })),
    { front: detailsFront, back: summaryBack(detailsIndex, nQ, true) },
    { front: receiptFront, back: null },
  ]
  const N = sheets.length

  const bookShift = !isOpen && spread ? -(pageW + gap) / 2 : 0
  const bookTilt = isOpen ? 0 : -1.6

  const ringPath = (y: number, front: boolean) => {
    const a = ringR
    const x1 = spine + a
    const x0 = spine - a
    const h = 5.5
    return front
      ? "M " + x1 + " " + y + " C " + (x1 - a * 0.25) + " " + (y - h * 1.9) + " " + (x0 + a * 0.2) + " " + (y - h * 1.2) + " " + x0 + " " + (y + 1.5)
      : "M " + x0 + " " + (y + 1.5) + " C " + (x0 + a * 0.35) + " " + (y + h * 1.5) + " " + (x1 - a * 0.3) + " " + (y + h * 1.1) + " " + x1 + " " + y
  }

  return (
    <section
      ref={(el) => {
        rootRef.current = el
      }}
      id={id}
      className={"wbi" + (className ? " " + className : "")}
      data-theme={theme}
      data-mode={L.mode}
      data-open={isOpen ? "" : undefined}
      aria-label={ariaLabel || "Contact " + studio}
      style={rootStyle}
    >
      <style>{CSS_VARS + CSS}</style>
      <div className="wbi-inner">
        <div className="wbi-intro">
          {kicker ? <p className="wbi-kicker">{kicker}</p> : null}
          <h2 className="wbi-headline">{headline}</h2>
          {intro ? <p className="wbi-intro-copy">{intro}</p> : null}
          <div className="wbi-direct">
            {email ? (
              <div>
                <span className="wbi-label">{emailLabel}</span>
                <a className="wbi-mark wbi-email" href={"mailto:" + email}>
                  {email}
                </a>
              </div>
            ) : null}
            {socials.length && L.mode === "wide" ? (
              <div>
                <span className="wbi-label">{socialsLabel}</span>
                <ul className="wbi-socials">
                  {socials.map((s) => (
                    <li key={s.label}>
                      <a className="wbi-mark" href={s.href} target="_blank" rel="noreferrer">
                        {s.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {availability ? <p className="wbi-avail" style={{ margin: 0 }}>{availability}</p> : null}
          </div>
        </div>

        <div className="wbi-stage" style={{ height: pageH + 40 }}>
          <div
            className="wbi-book"
            style={{ width: bookW, height: pageH, transform: "translateX(" + bookShift + "px) rotate(" + bookTilt + "deg)" }}
          >
            <span className="wbi-shadow" style={{ left: rightLeft, top: 0, width: pageW, height: pageH }} />
            {spread ? (
              <span
                className="wbi-shadow"
                style={{ left: tab, top: 0, width: pageW, height: pageH, opacity: isOpen ? 1 : 0, transition: "opacity 400ms ease" }}
              />
            ) : null}
            <span className="wbi-board" style={{ left: rightLeft, top: 0, width: pageW, height: pageH }} />
            <span
              className="wbi-edges"
              style={{ left: rightLeft, top: 4, width: pageW - 6, height: pageH - 9, opacity: turned < RECEIPT ? 1 : 0 }}
            />
            <svg className="wbi-coil" aria-hidden width={bookW} height={pageH} style={{ left: 0, zIndex: 1 }}>
              {rings.map((y, i) => (
                <path key={i} d={ringPath(y, false)} fill="none" stroke="var(--wire)" strokeWidth={2.6} strokeLinecap="round" opacity={0.75} />
              ))}
            </svg>
            {sheets.map((s, i) => {
              const isTurned = i < turned
              const turn = turning[i]
              const z = turn ? 300 + (isTurned ? i : N - i) : isTurned ? 100 + i : 100 + (N - i)
              const inset = s.cover ? 0 : 3
              return (
                <div
                  key={i}
                  ref={(el) => {
                    sheetRefs.current[i] = el
                  }}
                  className="wbi-sheet"
                  data-turned={isTurned ? "" : undefined}
                  data-turning={turn ? "" : undefined}
                  data-current={i === turned ? "" : undefined}
                  data-peek={s.cover && turned === 0 && !turn ? "" : undefined}
                  style={
                    {
                      left: rightLeft,
                      top: inset,
                      width: pageW - inset,
                      height: pageH - inset * 2,
                      zIndex: z,
                      transformOrigin: -(gap / 2) + "px 50%",
                      "--dur": turn ? turn.dur + "ms" : undefined,
                      "--delay": turn ? turn.delay + "ms" : undefined,
                    } as React.CSSProperties
                  }
                >
                  {s.front}
                  {s.back}
                  {tabs(i)}
                </div>
              )
            })}
            <svg className="wbi-coil" aria-hidden width={bookW} height={pageH} style={{ left: 0, zIndex: 900 }}>
              <defs>
                <linearGradient id={uid + "-wire"} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#fff" stopOpacity="0.55" />
                  <stop offset="0.5" stopColor="#fff" stopOpacity="0" />
                </linearGradient>
              </defs>
              {rings.map((y, i) => (
                <g key={i}>
                  <path d={ringPath(y, true)} fill="none" stroke="rgba(0,0,0,0.28)" strokeWidth={3.4} strokeLinecap="round" transform="translate(0.8 1.6)" />
                  <path d={ringPath(y, true)} fill="none" stroke="var(--wire)" strokeWidth={3} strokeLinecap="round" />
                  <path d={ringPath(y, true)} fill="none" stroke={"url(#" + uid + "-wire)"} strokeWidth={1.1} strokeLinecap="round" transform="translate(0 -0.6)" />
                </g>
              ))}
            </svg>
          </div>
        </div>
      </div>
      <p className="wbi-sr" aria-live="polite">
        {announce}
      </p>
    </section>
  )
}

export type WireboundPaletteInput = Partial<WireboundPalette>
