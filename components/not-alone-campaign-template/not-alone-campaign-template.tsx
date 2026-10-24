"use client"

import * as React from "react"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

/*
 * Not Alone: a mental-health awareness campaign page, printed like a zine.
 *
 * Every photograph is cut down to a handful of flat colours in a canvas (a
 * median-cut palette, then a mode filter that melts the speckle into shapes),
 * so the page reads as one screen-printed booklet: a vellum frame over a
 * pasture, a blue highlighter label, hand-drawn stick figures, page numbers.
 * Before a photo arrives (or if it never can) a drawn landscape in the same
 * flat colours stands in, so the first frame is always finished.
 */

export type NacShot = { src: string; alt?: string; tone?: string; focus?: string }
export type NacLink = { label: string; href: string }
export type NacStat = { value: string; text: string; fraction: number; source?: NacLink | null }
export type NacSign = { title: string; body: string; help: string; shot: NacShot; urgent?: boolean }
export type NacHelpline = { name: string; detail: string; contact: string; href?: string; urgent?: boolean }
export type NacMood = { label: string; reply: string; action: "talk" | "breathe" | "reach" }
export type NacVerse = { text: string; cite: string }
export type NacHero = {
  tagline: string
  kicker: string
  word: string
  fact: string
  source?: NacLink | null
  faith?: string | null
  closing: string
  landscape: NacShot
  window: NacShot
}
export type NacFaith = { kicker: string; title: string; body: string; verses: NacVerse[]; shot: NacShot }
export type NacPledge = { title: string; body: string; cta: string; done: string; count: number; shot: NacShot }
export type NacBrand = { name: string; word: string; org: string }
export type NacPalette = { paper: string; ink: string; label: string; labelInk: string; accent: string; buddy: string }
export type NacLabels = {
  navFacts?: string
  navSigns?: string
  navFaith?: string
  navHelp?: string
  menu?: string
  close?: string
  talk?: string
  quickExit?: string
  quickExitHint?: string
  page?: string
  factsKicker?: string
  factsTitle?: string
  factsFigure?: string
  factsStep?: string
  signsKicker?: string
  signsTitle?: string
  signsHint?: string
  signsFront?: string
  signsBack?: string
  helpKicker?: string
  helpTitle?: string
  helpBody?: string
  checkinTitle?: string
  checkinHint?: string
  moodScale?: string
  breatheTitle?: string
  breatheBody?: string
  breatheStart?: string
  breatheStop?: string
  breatheIn?: string
  breatheHold?: string
  breatheOut?: string
  linesTitle?: string
  copy?: string
  copied?: string
  checkinText?: string
  actionTalk?: string
  actionBreathe?: string
  actionReach?: string
  pledgeKicker?: string
  pledgeCount?: string
  buddyHi?: string
  buddyLines?: string
  footerNote?: string
  footerTop?: string
}

export type NotAloneCampaignTemplateProps = {
  brand?: NacBrand
  hero?: NacHero
  stats?: NacStat[] | null
  signs?: NacSign[] | null
  faith?: NacFaith | null
  helplines?: NacHelpline[]
  moods?: NacMood[]
  breath?: number[]
  pledge?: NacPledge | null
  labels?: NacLabels
  palette?: "meadow" | "heather" | "tide" | NacPalette
  theme?: "system" | "light" | "dark"
  colors?: number
  quickExitUrl?: string | null
  onPledge?: () => unknown
  onCheckin?: (mood: NacMood, index: number) => unknown
  height?: string
  className?: string
}

// #region content
const UNSPLASH = "https://images.unsplash.com/photo-"
const pic = (id: string, alt: string, tone: string, focus?: string) => ({ src: UNSPLASH + id, alt, tone, focus }) as NacShot

export const DEFAULT_BRAND: NacBrand = { name: "Not", word: "Alone", org: "Harbour Youth Ministry" }

export const DEFAULT_HERO: NacHero = {
  tagline: "Mental Health is More Common Than you Think.",
  kicker: "You are not",
  word: "alone.",
  fact: "In ==Indo==nesia, about 1 in 3 adolescents aged 10 to 17 experienced mental health problems in 2022. This means many young people struggle silently.",
  source: { label: "qcmhr.org", href: "https://qcmhr.org" },
  faith: "God entrusts us with our lives and teaches us to love and support others. Caring for others and ourselves is part of Christian stewardship.",
  closing: "Seeking help will make you stronger!",
  landscape: pic("1438786657495-640937046d18", "A green glen under big summer clouds", "#6f8f45", "50% 82%"),
  window: pic("1465379944081-7f47de8d74ac", "Cows grazing in a misty field", "#9a9677", "30% 62%"),
}

export const DEFAULT_STATS: NacStat[] = [
  {
    value: "1 in 3",
    text: "adolescents aged 10 to 17 in Indonesia had a mental health problem in the past year.",
    fraction: 0.349,
    source: { label: "I-NAMHS 2022", href: "https://qcmhr.org" },
  },
  {
    value: "1 in 20",
    text: "met the criteria for a mental disorder. That is a friend in almost every classroom.",
    fraction: 0.055,
    source: { label: "I-NAMHS 2022", href: "https://qcmhr.org" },
  },
  {
    value: "2.6%",
    text: "of the young people who were struggling had ever used a counselling or mental health service.",
    fraction: 0.026,
    source: { label: "I-NAMHS 2022", href: "https://qcmhr.org" },
  },
]

export const DEFAULT_SIGNS: NacSign[] = [
  {
    title: "Sleep goes strange",
    body: "Sleeping far more or far less than usual, or tired all the time no matter what.",
    help: "Ask how they have been sleeping. Small, practical questions open big doors.",
    shot: pic("1505322022379-7c3353ee6291", "A starry night over a misty lake", "#1f2a3a", "50% 40%"),
  },
  {
    title: "Pulling away",
    body: "Skipping youth group, leaving the chat on read, eating lunch alone.",
    help: "Invite, do not interrogate. \"Walk with me after service?\" goes a long way.",
    shot: pic("1502082553048-f009c37129b9", "A lone tree in a green field", "#6d8f3c", "50% 60%"),
  },
  {
    title: "Losing the spark",
    body: "Quitting the band, the team, the things that used to light them up.",
    help: "Name what you noticed, gently: \"You have not played in a while. I miss it.\"",
    shot: pic("1446329813274-7c9036bd9a1f", "An autumn path through the woods", "#a8662a", "50% 55%"),
  },
  {
    title: "Always on edge",
    body: "Snapping at small things, restless, unable to settle or focus.",
    help: "Stay calm and stay close. Irritability is often exhaustion wearing armour.",
    shot: pic("1505765050516-f72dcac9c60e", "Sharp peaks rising out of cloud", "#8a8f96", "50% 45%"),
  },
  {
    title: "Hopeless talk",
    body: "\"What is the point.\" \"Everyone would be better off.\" Take it seriously, every time.",
    help: "Ask directly if they are thinking of ending their life. Asking does not plant the idea. Stay with them and call 119 ext. 8, or 112 if they are in danger.",
    shot: pic("1500534314209-a25ddb2bd429", "Blue ridges fading into haze", "#3d4f57", "50% 60%"),
    urgent: true,
  },
]

export const DEFAULT_FAITH: NacFaith = {
  kicker: "Faith",
  title: "Caring is part of **stewardship**.",
  body: "God entrusts us with our lives and teaches us to love and support others. Looking after your mind is not a lack of faith. Caring for others and for ourselves is part of Christian stewardship.",
  verses: [
    { text: "Carry each other's burdens, and in this way you will fulfill the law of Christ.", cite: "Galatians 6:2" },
    { text: "Cast all your anxiety on him because he cares for you.", cite: "1 Peter 5:7" },
  ],
  shot: pic("1472214103451-9374bd1c798e", "A spiral of stones in a green valley at sunset", "#5c8a2a", "50% 70%"),
}

export const DEFAULT_HELPLINES: NacHelpline[] = [
  { name: "SEJIWA line", detail: "Ministry of Health mental health line. Call 119, then press 8.", contact: "119 ext. 8", href: "tel:119" },
  { name: "Emergency", detail: "If someone is in immediate danger, call now and stay with them.", contact: "112", href: "tel:112", urgent: true },
  { name: "Into The Light", detail: "Suicide prevention community with a directory of support near you.", contact: "intothelightid.org", href: "https://www.intothelightid.org" },
  { name: "Your youth pastor", detail: "Find us after Sunday service, or message the church office for a quiet time.", contact: "Talk in person" },
]

export const DEFAULT_MOODS: NacMood[] = [
  { label: "Really struggling", reply: "Thank you for being honest. That takes courage. You do not have to carry this alone: talk to someone today.", action: "talk" },
  { label: "Low", reply: "Low days are heavy. Tell one person how you are, even in one line.", action: "talk" },
  { label: "Okay-ish", reply: "Somewhere in the middle. A slow minute of breathing can take the edge off.", action: "breathe" },
  { label: "Pretty good", reply: "Good to hear. Is there someone who has gone quiet lately?", action: "reach" },
  { label: "Great", reply: "Love that. Pass it on: check in on one friend today.", action: "reach" },
]

export const DEFAULT_PLEDGE: NacPledge = {
  title: "Be someone's **not alone**.",
  body: "One message can change someone's week. Promise to check in on one person in the next seven days.",
  cta: "I'll check in on someone",
  done: "Promise made. Who comes to mind first?",
  count: 1284,
  shot: pic("1501854140801-50d01698950b", "Rolling green hills from above", "#4f7a2c", "50% 50%"),
}

export const DEFAULT_LABELS = {
  navFacts: "The facts",
  navSigns: "Signs",
  navFaith: "Faith",
  navHelp: "Get help",
  menu: "Menu",
  close: "Close",
  talk: "Talk to someone",
  quickExit: "Quick exit",
  quickExitHint: "Leave this page now",
  page: "Page",
  factsKicker: "Struggling silently",
  factsTitle: "Most of it happens where no one can see.",
  factsFigure: "{count} of every {total} young people",
  factsStep: "Show fact {n}",
  signsKicker: "Notice",
  signsTitle: "What it can look like",
  signsHint: "Tap a card to see what helps",
  signsFront: "The sign",
  signsBack: "What helps",
  helpKicker: "Get help",
  helpTitle: "Seeking help will make you **stronger**!",
  helpBody: "Talking to someone is not weakness. It is the bravest, most ordinary first step, and you can take it today.",
  checkinTitle: "How are you, really?",
  checkinHint: "Drag the face, or use the arrow keys",
  moodScale: "Your mood",
  breatheTitle: "Breathe with me",
  breatheBody: "In for 4, hold for 7, out for 8. Four rounds is enough.",
  breatheStart: "Start",
  breatheStop: "Stop",
  breatheIn: "Breathe in",
  breatheHold: "Hold",
  breatheOut: "Breathe out",
  linesTitle: "Who to call",
  copy: "Copy",
  copied: "Copied",
  checkinText: "Hey, I have been thinking about you. How are you really doing? I'm here.",
  actionTalk: "See who to call",
  actionBreathe: "Breathe with me",
  actionReach: "Copy a check-in text",
  pledgeKicker: "Pass it on",
  pledgeCount: "{count} promises so far",
  buddyHi: "Say hi",
  buddyLines: "hi!|you ok?|we're here|me too|you matter",
  footerNote: "This page shares information, not a diagnosis. If you or someone you know is in danger, call 112 now.",
  footerTop: "Back to top",
}

export const PALETTES = {
  meadow: { paper: "#ebeaee", ink: "#1f2a1c", label: "#2f63d8", labelInk: "#ffffff", accent: "#e3342f", buddy: "#f4c20d" },
  heather: { paper: "#eeeaee", ink: "#2a1f2b", label: "#a3306a", labelInk: "#ffffff", accent: "#e8572a", buddy: "#f6c344" },
  tide: { paper: "#e6ebec", ink: "#14262b", label: "#0d7672", labelInk: "#ffffff", accent: "#e2502f", buddy: "#ffd23f" },
}
// #endregion content

// #region logic
export function resolvePalette(p: NotAloneCampaignTemplateProps["palette"]): NacPalette {
  if (p && typeof p === "object") return p
  return (PALETTES as { [k: string]: NacPalette })[p || "meadow"] || PALETTES.meadow
}

export function sized(src: string, w: number) {
  if (!/^https:\/\/images\.unsplash\.com\/photo-/.test(src)) return src
  return src.split("?")[0] + "?auto=format&fit=crop&q=80&w=" + Math.round(w)
}

/** `**bold**` and `==accent==` inside copy. */
export function richParts(text: string) {
  const out = [] as { text: string; kind: "plain" | "bold" | "hl" }[]
  const re = /(\*\*|==)(.+?)\1/g
  let last = 0
  let m = re.exec(text)
  while (m) {
    if (m.index > last) out.push({ text: text.slice(last, m.index), kind: "plain" })
    out.push({ text: m[2], kind: m[1] === "**" ? "bold" : "hl" })
    last = m.index + m[0].length
    m = re.exec(text)
  }
  if (last < text.length) out.push({ text: text.slice(last), kind: "plain" })
  return out
}

export function plain(text: string) {
  return text.replace(/(\*\*|==)(.+?)\1/g, "$2")
}

export function fill(t: string, vars: { [k: string]: string | number }) {
  return t.replace(/\{(\w+)\}/g, (all, k) => (k in vars ? String(vars[k]) : all))
}

export function clamp(v: number, a: number, b: number) {
  return Math.min(b, Math.max(a, v))
}

export function grouped(n: number, locale = "en-US") {
  return new Intl.NumberFormat(locale).format(Math.round(n))
}

export function hexRgb(hex: string) {
  const h = hex.replace("#", "")
  const f = h.length === 3 ? h.split("").map((c) => c + c).join("") : h
  return [0, 2, 4].map((i) => parseInt(f.slice(i, i + 2), 16) || 0)
}

export function mixHex(a: string, b: string, t: number) {
  const x = hexRgb(a)
  const y = hexRgb(b)
  return "#" + x.map((v, i) => Math.round(v + (y[i] - v) * clamp(t, 0, 1)).toString(16).padStart(2, "0")).join("")
}

/** Deterministic pseudo-random numbers, so drawings and shuffles hold still between renders. */
export function rng(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Median cut over flat rgb triplets: up to k representative colours. */
export function medianCut(rgb: ArrayLike<number>, k: number) {
  const n = Math.floor(rgb.length / 3)
  if (!n) return [[0, 0, 0]]
  let boxes = [Array.from({ length: n }, (_, i) => i)]
  while (boxes.length < k) {
    let best = -1
    let score = -1
    let axis = 0
    for (let b = 0; b < boxes.length; b++) {
      const box = boxes[b]
      if (box.length < 2) continue
      for (let c = 0; c < 3; c++) {
        let lo = 255
        let hi = 0
        for (const i of box) {
          const v = rgb[i * 3 + c]
          if (v < lo) lo = v
          if (v > hi) hi = v
        }
        const s = (hi - lo) * Math.sqrt(box.length)
        if (s > score) {
          score = s
          best = b
          axis = c
        }
      }
    }
    if (best < 0 || score <= 0) break
    const box = boxes[best].slice().sort((x, y) => rgb[x * 3 + axis] - rgb[y * 3 + axis])
    const mid = box.length >> 1
    boxes = boxes.slice(0, best).concat([box.slice(0, mid), box.slice(mid)], boxes.slice(best + 1))
  }
  return boxes.map((box) => {
    const sum = [0, 0, 0]
    for (const i of box) for (let c = 0; c < 3; c++) sum[c] += rgb[i * 3 + c]
    return sum.map((v) => Math.round(v / box.length))
  })
}

export function nearest(pal: number[][], r: number, g: number, b: number) {
  let best = 0
  let dist = Infinity
  for (let i = 0; i < pal.length; i++) {
    const dr = pal[i][0] - r
    const dg = pal[i][1] - g
    const db = pal[i][2] - b
    const d = 2 * dr * dr + 4 * dg * dg + 3 * db * db
    if (d < dist) {
      dist = d
      best = i
    }
  }
  return best
}

/** The most common index in each 3x3 neighbourhood: speckle melts into flat shapes. */
export function modeFilter(idx: Uint8Array, w: number, h: number, k: number) {
  const out = new Uint8Array(idx)
  const count = new Uint16Array(k)
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      count.fill(0)
      let best = idx[y * w + x]
      let top = 0
      for (let dy = -1; dy <= 1; dy++) {
        const row = (y + dy) * w + x
        for (let dx = -1; dx <= 1; dx++) {
          const v = idx[row + dx]
          const c = ++count[v]
          if (c > top) {
            top = c
            best = v
          }
        }
      }
      out[y * w + x] = top >= 4 ? best : idx[y * w + x]
    }
  }
  return out
}

/** Screen-print an RGBA buffer in place: k flat colours, smoothed into shapes. */
export function cutoutPixels(px: Uint8ClampedArray, w: number, h: number, k: number, passes = 2) {
  const step = Math.max(1, Math.floor((w * h) / 24000))
  const sample = [] as number[]
  for (let i = 0; i < w * h; i += step) sample.push(px[i * 4], px[i * 4 + 1], px[i * 4 + 2])
  const pal = medianCut(sample, clamp(Math.round(k), 2, 32))
  const lut = new Int16Array(32768).fill(-1)
  let idx = new Uint8Array(w * h)
  for (let i = 0; i < w * h; i++) {
    const r = px[i * 4]
    const g = px[i * 4 + 1]
    const b = px[i * 4 + 2]
    const key = ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3)
    let v = lut[key]
    if (v < 0) v = lut[key] = nearest(pal, r, g, b)
    idx[i] = v
  }
  for (let p = 0; p < passes; p++) idx = modeFilter(idx, w, h, pal.length)
  for (let i = 0; i < w * h; i++) {
    const c = pal[idx[i]]
    px[i * 4] = c[0]
    px[i * 4 + 1] = c[1]
    px[i * 4 + 2] = c[2]
  }
  return pal
}

/** A shuffled order for the pictogram, so highlighted people are scattered like a real crowd. */
export function isoOrder(total: number, seed = 7) {
  const r = rng(seed)
  const order = Array.from({ length: total }, (_, i) => i)
  for (let i = total - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1))
    const t = order[i]
    order[i] = order[j]
    order[j] = t
  }
  const rank = new Array(total).fill(0) as number[]
  order.forEach((p, i) => (rank[p] = i))
  return rank
}

export function isoCount(fraction: number, total: number) {
  if (!(fraction > 0)) return 0
  return clamp(Math.round(fraction * total), 1, total)
}

export function stepAt(progress: number, n: number) {
  return clamp(Math.floor(clamp(progress, 0, 1) * n * 0.9999), 0, Math.max(0, n - 1))
}

/** The check-in face for a mood from 0 (really struggling) to max (great). */
export function moodShape(m: number, max: number) {
  const t = max > 0 ? clamp(m / max, 0, 1) : 0.5
  const curve = (t - 0.5) * 30
  return {
    mouth: "M40 78 Q60 " + (78 + curve).toFixed(1) + " 80 78",
    brow: ((0.5 - t) * 16).toFixed(1),
    eye: (2.2 + t * 2.6).toFixed(2),
    t,
  }
}

/** One round of box breathing, as phases with their own durations. */
export function breathPhases(pattern: number[]) {
  const [a = 4, b = 7, c = 8] = pattern
  return [
    { key: "in", secs: Math.max(1, a) },
    { key: "hold", secs: Math.max(0, b) },
    { key: "out", secs: Math.max(1, c) },
  ].filter((p) => p.secs > 0)
}

export function breathAt(elapsed: number, pattern: number[]) {
  const ph = breathPhases(pattern)
  const round = ph.reduce((a, p) => a + p.secs, 0)
  let t = ((elapsed % round) + round) % round
  for (let i = 0; i < ph.length; i++) {
    if (t < ph[i].secs) return { phase: ph[i].key, index: i, left: Math.ceil(ph[i].secs - t), round: Math.floor(elapsed / round) }
    t -= ph[i].secs
  }
  return { phase: ph[0].key, index: 0, left: ph[0].secs, round: 0 }
}

/** A hand-drawn line through points: quadratic segments with a seeded wobble. */
export function scrawl(pts: number[][], seed: number, wob = 1.1) {
  const r = rng(seed)
  let d = "M" + pts[0][0] + " " + pts[0][1]
  for (let i = 1; i < pts.length; i++) {
    const [ax, ay] = pts[i - 1]
    const [bx, by] = pts[i]
    const len = Math.hypot(bx - ax, by - ay) || 1
    const off = (r() - 0.5) * 2 * wob
    const cx = (ax + bx) / 2 + (-(by - ay) / len) * off
    const cy = (ay + by) / 2 + ((bx - ax) / len) * off
    d += " Q" + cx.toFixed(1) + " " + cy.toFixed(1) + " " + bx + " " + by
  }
  return d
}

export function headPath(cx: number, cy: number, r: number) {
  return "M" + (cx - r) + " " + cy + " a" + r + " " + r + " 0 1 0 " + 2 * r + " 0 a" + r + " " + r + " 0 1 0 " + -2 * r + " 0"
}

export function nextIndex(i: number, key: string, n: number) {
  if (key === "ArrowRight" || key === "ArrowUp") return Math.min(n - 1, i + 1)
  if (key === "ArrowLeft" || key === "ArrowDown") return Math.max(0, i - 1)
  if (key === "Home") return 0
  if (key === "End") return n - 1
  return -1
}
// #endregion logic

/* ------------------------------------------------------------------ */
/* Stick figures                                                        */
/* ------------------------------------------------------------------ */

const FIGURES = [
  {
    head: [24, 15, 8.5],
    eyes: [[21, 14], [27, 14]],
    smile: "M20 18.5 Q24 22 28 18.5",
    strokes: [
      [[25, 24], [28, 40], [31, 54]],
      [[27, 32], [16, 38], [8, 33]],
      [[27.5, 31], [39, 27], [47, 18]],
      [[31, 54], [20, 63], [9, 61]],
      [[31, 54], [41, 68], [37, 83]],
    ],
  },
  {
    head: [32, 15, 8.5],
    eyes: [[29, 14], [35, 14]],
    smile: "M28 18.5 Q32 22.5 36 18.5",
    strokes: [
      [[32, 24], [32, 40], [32, 55]],
      [[32, 32], [21, 25], [14, 10]],
      [[32, 32], [44, 25], [50, 10]],
      [[32, 55], [25, 69], [21, 85]],
      [[32, 55], [40, 69], [45, 85]],
    ],
  },
  {
    head: [32, 14, 8.5],
    eyes: [[29, 13], [35, 13]],
    smile: "M28 17.5 Q32 21.5 36 17.5",
    strokes: [
      [[32, 23], [32, 37], [32, 50]],
      [[32, 29], [20, 20], [10, 8]],
      [[32, 29], [45, 18], [55, 8]],
      [[32, 50], [21, 63], [12, 75]],
      [[32, 50], [43, 63], [53, 75]],
    ],
  },
]

function Figure({ i, color, className }: { i: number; color: string; className?: string }) {
  const f = FIGURES[i % FIGURES.length]
  return (
    <svg viewBox="0 0 64 92" className={className} aria-hidden="true" fill="none" stroke={color} strokeWidth="3.1" strokeLinecap="round" strokeLinejoin="round">
      <path className="nac-stroke" pathLength={1} d={headPath(f.head[0], f.head[1], f.head[2])} />
      {f.strokes.map((s, k) => (
        <path key={k} className="nac-stroke" pathLength={1} d={scrawl(s, i * 31 + k * 7 + 3)} />
      ))}
      <g className="nac-face" stroke={color} strokeWidth="1.8">
        <circle cx={f.eyes[0][0]} cy={f.eyes[0][1]} r="0.9" fill={color} />
        <circle cx={f.eyes[1][0]} cy={f.eyes[1][1]} r="0.9" fill={color} />
        <path d={f.smile} />
      </g>
    </svg>
  )
}

/** Five figures holding hands, drawn by the scroll. */
function HandsRow({ buddy, line }: { buddy: string; line: string }) {
  const n = 5
  const w = 80 + (n - 1) * 64
  return (
    <svg viewBox={"0 0 " + w + " 96"} className="nac-hands" aria-hidden="true" fill="none" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      {Array.from({ length: n }, (_, i) => {
        const cx = 40 + i * 64
        const c = i === 2 ? buddy : line
        const s = i * 13 + 5
        return (
          <g key={i} stroke={c}>
            <path className="nac-hand-stroke" pathLength={1} d={headPath(cx, 16, 8.5)} />
            <path className="nac-hand-stroke" pathLength={1} d={scrawl([[cx, 25], [cx, 41], [cx, 57]], s)} />
            <path className="nac-hand-stroke" pathLength={1} d={scrawl([[cx, 33], [cx - 16, 45], [cx - 31, 50]], s + 1)} />
            <path className="nac-hand-stroke" pathLength={1} d={scrawl([[cx, 33], [cx + 16, 45], [cx + 31, 50]], s + 2)} />
            <path className="nac-hand-stroke" pathLength={1} d={scrawl([[cx, 57], [cx - 6, 72], [cx - 10, 88]], s + 3)} />
            <path className="nac-hand-stroke" pathLength={1} d={scrawl([[cx, 57], [cx + 6, 72], [cx + 10, 88]], s + 4)} />
          </g>
        )
      })}
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/* The drawn landscape: the first frame, and the fallback               */
/* ------------------------------------------------------------------ */

function ridge(y0: number, amp: number, freq: number, seed: number, bottom = 1000) {
  const r = rng(seed)
  const ph = [r() * 6.28, r() * 6.28, r() * 6.28]
  let d = "M0 " + bottom
  for (let x = 0; x <= 1600; x += 32) {
    const y = y0 + Math.sin(x * freq + ph[0]) * amp + Math.sin(x * freq * 2.3 + ph[1]) * amp * 0.38 + Math.sin(x * freq * 5.1 + ph[2]) * amp * 0.12
    d += " L" + x + " " + y.toFixed(1)
  }
  return d + " L1600 " + bottom + " Z"
}

const HILLS = (() => {
  const r = rng(42)
  const trees = Array.from({ length: 46 }, (_, i) => {
    const x = (i / 46) * 1640 - 20 + r() * 30
    const y = 470 + Math.sin(i * 0.7) * 26 + r() * 30 - (x > 1000 ? (x - 1000) * 0.06 : 0)
    return { x, y, s: 26 + r() * 34 }
  })
  const flowers = Array.from({ length: 70 }, () => ({ x: r() * 560, y: 830 + r() * 170, s: 3 + r() * 7 }))
  const cows = [
    [1180, 560, 1],
    [1262, 548, -1],
    [1330, 590, 1],
    [1088, 612, -1],
    [1430, 566, 1],
  ]
  return {
    layers: [
      { d: ridge(268, 22, 0.004, 1), c: "#d5d0b8" },
      { d: ridge(318, 30, 0.0032, 2), c: "#c2b98e" },
      { d: ridge(372, 26, 0.0045, 3), c: "#a9a36a" },
      { d: ridge(432, 22, 0.0027, 4), c: "#7f8c45" },
    ],
    trees,
    fields: [
      { d: ridge(560, 30, 0.0021, 5), c: "#5d8a2f" },
      { d: ridge(640, 40, 0.0018, 6), c: "#4f7d27" },
      { d: ridge(760, 34, 0.0024, 7), c: "#3f6b20" },
      { d: ridge(880, 28, 0.003, 8), c: "#2f5718" },
    ],
    flowers,
    cows,
  }
})()

function HillsArt() {
  return (
    <svg className="nac-hills" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      {HILLS.layers.map((l, i) => (
        <path key={i} d={l.d} fill={l.c} />
      ))}
      {HILLS.trees.map((t, i) => (
        <g key={i} fill={i % 3 ? "#2c4a1d" : "#3a5a22"}>
          <circle cx={t.x} cy={t.y} r={t.s} />
          <circle cx={t.x + t.s * 0.7} cy={t.y + t.s * 0.3} r={t.s * 0.75} />
        </g>
      ))}
      {HILLS.fields.map((l, i) => (
        <path key={i} d={l.d} fill={l.c} />
      ))}
      {HILLS.cows.map(([x, y, dir], i) => (
        <g key={i} transform={"translate(" + x + " " + y + ") scale(" + dir + " 1)"} fill={i % 2 ? "#c99a5e" : "#9c6b3b"}>
          <rect x="-16" y="-9" width="32" height="13" rx="5" />
          <rect x="12" y="-14" width="9" height="9" rx="3" />
          <rect x="-13" y="2" width="3.4" height="10" />
          <rect x="9" y="2" width="3.4" height="10" />
        </g>
      ))}
      {HILLS.flowers.map((f, i) => (
        <ellipse key={i} cx={f.x} cy={f.y} rx={f.s} ry={f.s * 0.7} fill={i % 4 ? "#dfe6d8" : "#c9d7c3"} />
      ))}
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/* Screen-printed photographs                                          */
/* ------------------------------------------------------------------ */

const CUTS = new Map()
let queue = Promise.resolve() as Promise<unknown>

function cutout(img: HTMLImageElement, key: string, colors: number): Promise<string | null> {
  const hit = CUTS.get(key)
  if (hit) return hit
  const job = (queue = queue.then(
    () =>
      new Promise((resolve) => {
        // one at a time, in idle moments, so the page never stutters while prints develop
        const run = () => {
          try {
            const w = Math.min(img.naturalWidth, 1600)
            const h = Math.round((w * img.naturalHeight) / img.naturalWidth)
            if (!w || !h) return resolve(null)
            const cv = document.createElement("canvas")
            cv.width = w
            cv.height = h
            const ctx = cv.getContext("2d", { willReadFrequently: true })
            if (!ctx) return resolve(null)
            if ("filter" in ctx) ctx.filter = "blur(" + Math.max(0.6, w / 1100).toFixed(2) + "px) saturate(1.12)"
            ctx.drawImage(img, 0, 0, w, h)
            const data = ctx.getImageData(0, 0, w, h)
            cutoutPixels(data.data, w, h, colors, 2)
            ctx.putImageData(data, 0, 0)
            cv.toBlob((b) => resolve(b ? URL.createObjectURL(b) : null), "image/webp", 0.9)
          } catch {
            resolve(null) // a host without CORS taints the canvas: keep the photo as it is
          }
        }
        const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }
        if (w.requestIdleCallback) w.requestIdleCallback(run, { timeout: 400 })
        else setTimeout(run, 16)
      })
  )) as Promise<string | null>
  CUTS.set(key, job)
  return job
}

type PrintProps = {
  shot: NacShot
  width: number
  colors: number
  eager?: boolean
  className?: string
  decorative?: boolean
  fallback?: React.ReactNode
}

/** A photograph, screen-printed. A new source or colour count starts it afresh. */
function Print(props: PrintProps) {
  return <PrintOnce key={sized(props.shot.src, props.width) + "|" + props.colors} {...props} />
}

function PrintOnce({ shot, width, colors, eager, className, decorative, fallback }: PrintProps) {
  const url = sized(shot.src, width)
  const [cors, setCors] = React.useState(true)
  const [state, setState] = React.useState("loading" as "loading" | "raw" | "cut" | "failed")
  const [cut, setCut] = React.useState(null as string | null)
  const alive = React.useRef(true)
  React.useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
    }
  }, [])

  const onLoad = (e: React.SyntheticEvent) => {
    const img = e.currentTarget as HTMLImageElement
    if (!cors || colors < 2) return setState("raw")
    const slow = setTimeout(() => alive.current && setState((s) => (s === "loading" ? "raw" : s)), 2600)
    cutout(img, url + "|" + colors, colors).then((u) => {
      clearTimeout(slow)
      if (!alive.current) return
      if (u) {
        setCut(u)
        setState("cut")
      } else setState("raw")
    })
  }
  const onError = () => {
    if (cors) setCors(false)
    else setState("failed")
  }
  return (
    <div className={"nac-pic" + (className ? " " + className : "")} data-state={state} style={{ background: shot.tone || "#5d7a3a" }}>
      {fallback}
      <img
        key={cors ? "c" : "n"}
        className="nac-pic-raw"
        src={url}
        alt={decorative ? "" : shot.alt || ""}
        aria-hidden={decorative || state === "cut" ? true : undefined}
        crossOrigin={cors ? "anonymous" : undefined}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        draggable={false}
        onLoad={onLoad}
        onError={onError}
        style={{ maxWidth: "none", objectPosition: shot.focus }}
      />
      {cut && (
        <img
          className="nac-pic-cut"
          src={cut}
          alt={decorative ? "" : shot.alt || ""}
          aria-hidden={decorative ? true : undefined}
          draggable={false}
          style={{ maxWidth: "none", objectPosition: shot.focus }}
        />
      )}
    </div>
  )
}

function Rich({ text }: { text: string }) {
  return (
    <>
      {richParts(text).map((p, i) =>
        p.kind === "plain" ? <React.Fragment key={i}>{p.text}</React.Fragment> : p.kind === "bold" ? <strong key={i}>{p.text}</strong> : <span key={i} className="nac-hl">{p.text}</span>
      )}
    </>
  )
}

function PageNo({ n, light }: { n: number; light?: boolean }) {
  const s = String(n).padStart(2, "0")
  return (
    <span className="nac-pageno" data-light={light ? "" : undefined} aria-hidden="true">
      <span>{s[0]}</span>
      <span>{s[1]}</span>
    </span>
  )
}

function Grain({ id }: { id: string }) {
  return (
    <svg className="nac-grain" aria-hidden="true">
      <filter id={id}>
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch" />
        <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .55 0" />
      </filter>
      <rect width="100%" height="100%" filter={"url(#" + id + ")"} />
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/* Hooks                                                               */
/* ------------------------------------------------------------------ */

const useIsoLayoutEffect = typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect

function prefersReduced() {
  return typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches
}

function useReducedMotion() {
  const [reduced, setReduced] = React.useState(false)
  useIsoLayoutEffect(() => {
    if (typeof matchMedia !== "function") return
    const mq = matchMedia("(prefers-reduced-motion: reduce)")
    const on = () => setReduced(mq.matches)
    on()
    mq.addEventListener("change", on)
    return () => mq.removeEventListener("change", on)
  }, [])
  return reduced
}

function useDark(pref: "system" | "light" | "dark") {
  const [dark, setDark] = React.useState(pref === "dark")
  useIsoLayoutEffect(() => {
    if (pref !== "system") return setDark(pref === "dark")
    const mq = typeof matchMedia === "function" ? matchMedia("(prefers-color-scheme: dark)") : null
    const read = () => {
      const el = document.documentElement
      if (el.classList.contains("dark")) return setDark(true)
      if (el.classList.contains("light")) return setDark(false)
      setDark(!!(mq && mq.matches))
    }
    read()
    const mo = new MutationObserver(read)
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })
    if (mq) mq.addEventListener("change", read)
    return () => {
      mo.disconnect()
      if (mq) mq.removeEventListener("change", read)
    }
  }, [pref])
  return dark
}

/** The element that actually scrolls: a host's scrolling panel, or the window. */
function findScroller(el: HTMLElement): HTMLElement | Window {
  let p = el.parentElement
  while (p && p !== document.body && p !== document.documentElement) {
    const s = getComputedStyle(p)
    if (/(auto|scroll|overlay)/.test(s.overflowY) && p.scrollHeight > p.clientHeight + 1) return p
    p = p.parentElement
  }
  return window
}

function scrollToY(scroller: HTMLElement | Window, el: HTMLElement, extra: number, smooth: boolean) {
  const behavior = smooth ? "smooth" : "auto"
  if (scroller === window) {
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY + extra, behavior })
  } else {
    const s = scroller as HTMLElement
    s.scrollTo({ top: s.scrollTop + el.getBoundingClientRect().top - s.getBoundingClientRect().top + extra, behavior })
  }
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    try {
      const ta = document.createElement("textarea")
      ta.value = text
      ta.setAttribute("readonly", "")
      ta.style.position = "fixed"
      ta.style.opacity = "0"
      document.body.appendChild(ta)
      ta.select()
      const ok = document.execCommand("copy")
      ta.remove()
      return ok
    } catch {
      return false
    }
  }
}

/* ------------------------------------------------------------------ */
/* Styles                                                              */
/* ------------------------------------------------------------------ */

const NAC_CSS = `
.nac-root{--nac-sans:"Helvetica Neue",Helvetica,Arial,system-ui,sans-serif;--nac-head:64px;--nac-vellum:rgba(239,239,243,.82);--nac-muted:#59604f;--nac-line:rgba(20,30,20,.14);--nac-card:#f6f5f7;--nac-white:#ffffff;position:relative;min-height:var(--nac-h);background:var(--nac-paper);color:var(--nac-ink);font-family:var(--nac-sans);overflow-x:clip;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility}
.nac-root[data-theme="dark"]{--nac-paper:#0d121b;--nac-ink:#e7eaf1;--nac-vellum:rgba(20,26,38,.8);--nac-muted:#a6aebd;--nac-line:rgba(255,255,255,.13);--nac-card:#161d2a}
.nac-root :where(svg,canvas,img){display:block;max-width:none}
.nac-root :where(h1,h2,h3,p,figure,ol,ul,blockquote){margin:0;padding:0}
.nac-root :where(ol,ul){list-style:none}
.nac-root :where(button){font:inherit;color:inherit;background:none;border:0;padding:0;cursor:pointer}
.nac-root :where(a){color:inherit}
.nac-root :where(a,button,[tabindex]):focus-visible{outline:2px solid var(--nac-label);outline-offset:3px;border-radius:2px}
.nac-root strong{font-weight:700}
.nac-hl{color:var(--nac-accent);font-weight:500}
.nac-label{display:inline-block;background:var(--nac-label);color:var(--nac-label-ink);padding:.02em .12em .08em;line-height:1.05}
.nac-kicker{display:flex;align-items:center;gap:10px;font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:var(--nac-muted)}
.nac-kicker:before{content:"";width:22px;height:2px;background:var(--nac-label)}
.nac-h2{font-size:clamp(30px,4.2vw,60px);line-height:1.02;letter-spacing:-.025em;font-weight:700;text-wrap:balance}
.nac-h2 strong{background:var(--nac-label);color:var(--nac-label-ink);padding:0 .1em}
.nac-it{font-style:italic;font-weight:300}
.nac-chip{display:inline-flex;align-items:center;gap:6px;background:var(--nac-label);color:var(--nac-label-ink);font-size:12px;line-height:1;padding:5px 8px;text-decoration:none;transition:transform .25s cubic-bezier(.2,.8,.2,1)}
.nac-chip:hover{transform:translateY(-2px)}
.nac-chip svg{width:10px;height:10px}

.nac-pic{position:absolute;inset:0;overflow:hidden}
.nac-pic img,.nac-pic .nac-hills{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;max-width:none}
.nac-pic-raw{opacity:0;transition:opacity .6s ease}
.nac-pic[data-state="raw"] .nac-pic-raw{opacity:1;filter:saturate(.85) contrast(1.08)}
.nac-pic-cut{opacity:0;animation:nac-develop 1.1s cubic-bezier(.2,.7,.2,1) forwards}
@keyframes nac-develop{from{opacity:0;filter:contrast(1.6) brightness(1.25) saturate(0)}to{opacity:1;filter:none}}
.nac-root[data-theme="dark"] .nac-night{filter:brightness(.52) saturate(.72) hue-rotate(14deg)}
.nac-grain{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;opacity:.16;mix-blend-mode:multiply;z-index:3}
.nac-root[data-theme="dark"] .nac-grain{mix-blend-mode:screen;opacity:.07}

.nac-head{position:sticky;top:0;z-index:40;height:var(--nac-head);margin-bottom:calc(var(--nac-head) * -1);display:flex;align-items:center;gap:20px;padding:0 clamp(16px,2.6vw,40px);transition:background-color .35s ease,box-shadow .35s ease,color .35s ease}
.nac-root[data-solid] .nac-head{background:color-mix(in srgb,var(--nac-paper) 88%,transparent);-webkit-backdrop-filter:blur(12px) saturate(1.2);backdrop-filter:blur(12px) saturate(1.2);box-shadow:0 1px 0 var(--nac-line)}
.nac-brand{display:flex;align-items:center;gap:10px;font-weight:700;font-size:17px;letter-spacing:-.01em;text-decoration:none;white-space:nowrap}
.nac-brand-mark{width:26px;height:30px;background:var(--nac-vellum);box-shadow:inset 0 0 0 1px var(--nac-line);position:relative}
.nac-brand-mark:after{content:"";position:absolute;left:4px;right:4px;top:5px;height:12px;background:#4d7b2a}
.nac-brand-mark i{position:absolute;left:4px;bottom:4px;width:12px;height:4px;background:var(--nac-label)}
.nac-nav{display:flex;gap:4px;margin-left:auto;position:relative}
.nac-nav button{position:relative;font-size:14px;padding:8px 12px;border-radius:999px;color:var(--nac-ink);opacity:.72;transition:opacity .2s}
.nac-nav button:hover,.nac-nav button[aria-current="true"]{opacity:1}
.nac-nav-ink{position:absolute;bottom:2px;height:2px;background:var(--nac-label);left:0;width:0;transition:transform .45s cubic-bezier(.2,.8,.2,1),width .45s cubic-bezier(.2,.8,.2,1),opacity .3s}
.nac-pager{font-size:12px;letter-spacing:.12em;color:var(--nac-muted);font-variant-numeric:tabular-nums;display:flex;gap:4px;align-items:baseline;min-width:58px;justify-content:center}
.nac-pager b{display:inline-block;color:var(--nac-ink);font-weight:600;animation:nac-roll .5s cubic-bezier(.2,.8,.2,1)}
@keyframes nac-roll{from{transform:translateY(70%);opacity:0}to{transform:none;opacity:1}}
.nac-exit{font-size:13px;padding:8px 12px;border-radius:999px;box-shadow:inset 0 0 0 1.5px var(--nac-ink);display:flex;align-items:center;gap:6px;white-space:nowrap;transition:background-color .2s,color .2s}
.nac-exit:hover{background:var(--nac-ink);color:var(--nac-paper)}
.nac-exit kbd{font:inherit;font-size:10px;opacity:.6;letter-spacing:.06em}
.nac-cta{background:var(--nac-label);color:var(--nac-label-ink);font-size:14px;font-weight:600;padding:10px 16px;white-space:nowrap;transition:transform .25s cubic-bezier(.2,.8,.2,1),box-shadow .25s}
.nac-cta:hover{transform:translateY(-2px);box-shadow:0 10px 24px -12px var(--nac-label)}
.nac-menu-btn{display:none;margin-left:auto;font-size:14px;padding:8px 4px}
.nac-sheet{position:absolute;top:calc(var(--nac-head) - 4px);left:12px;right:12px;background:var(--nac-paper);box-shadow:0 20px 50px -20px rgba(0,0,0,.35),0 0 0 1px var(--nac-line);padding:10px;display:grid;gap:2px;z-index:41}
.nac-sheet button{text-align:left;padding:14px 12px;font-size:17px;border-bottom:1px solid var(--nac-line)}
.nac-sheet button:last-child{border-bottom:0}

.nac-hero{position:relative;min-height:max(var(--nac-h),660px);display:flex;flex-direction:column;overflow:clip;isolation:isolate}
.nac-tagline{position:relative;z-index:2;padding:calc(var(--nac-head) + 2.6vh) 24px 0;text-align:center;font-style:italic;font-weight:300;font-size:clamp(14px,1.12vw,17px);letter-spacing:.01em;color:var(--nac-ink)}
.nac-land{position:absolute;inset:0;z-index:0;-webkit-mask-image:linear-gradient(180deg,transparent 0,transparent 12%,#000 25%);mask-image:linear-gradient(180deg,transparent 0,transparent 12%,#000 25%)}
.nac-land-move{position:absolute;inset:-3% -3% -8% -3%;will-change:transform}
.nac-hero .nac-land-move > .nac-pic{top:-40%}
.nac-hero-grid{position:relative;z-index:2;flex:1;display:grid;grid-template-columns:minmax(16px,1fr) minmax(250px,25vw) minmax(24px,1.3fr) minmax(250px,23vw) minmax(16px,.55fr);align-items:center;padding:8vh 0 13vh}
.nac-frame-slot{grid-column:2;align-self:end}
.nac-copy-slot{grid-column:4;align-self:start;margin-top:3vh}
.nac-frame{position:relative;background:var(--nac-vellum);padding:15% 3.6% 0;aspect-ratio:.81;-webkit-backdrop-filter:blur(3px) saturate(.8);backdrop-filter:blur(3px) saturate(.8);box-shadow:0 40px 80px -40px rgba(10,24,8,.55)}
.nac-frame-win{position:relative;aspect-ratio:1.34;overflow:hidden;background:#3d5a2a}
.nac-frame-cap{padding:7% 4% 0;position:relative}
.nac-frame-kicker{display:block;font-style:italic;font-weight:300;font-size:clamp(15px,1.3vw,20px);color:var(--nac-ink)}
.nac-frame-word{font-size:clamp(34px,3.3vw,54px);font-weight:700;letter-spacing:-.02em;line-height:1;margin-top:.12em}
.nac-frame-word .nac-label{overflow:hidden}
.nac-label-t{display:inline-block}
.nac-frame-gutter{position:absolute;right:4.2%;top:62%;bottom:0;width:1px;background:var(--nac-line)}
.nac-hero-copy{position:relative;color:#fff}
.nac-hero-copy:before{content:"";position:absolute;inset:-60px -70px;background:radial-gradient(closest-side,rgba(8,24,6,.3),rgba(8,24,6,0));z-index:-1;pointer-events:none}
.nac-fact,.nac-faithline{font-style:italic;font-weight:300;font-size:clamp(14px,1.08vw,16.5px);line-height:1.5;text-align:justify;-webkit-hyphens:auto;hyphens:auto;text-shadow:0 1px 12px rgba(0,0,0,.4)}
.nac-fact .nac-hl{text-shadow:none}
.nac-hero-copy .nac-chip{margin-top:10px}
.nac-buddies{display:flex;justify-content:center;align-items:flex-end;gap:clamp(6px,1vw,14px);margin:22px 0 18px}
.nac-buddy{position:relative;width:clamp(50px,4.6vw,70px);aspect-ratio:64/92}
.nac-buddy-btn{position:absolute;inset:0;display:block;border-radius:8px}
.nac-buddy-body{position:absolute;inset:0;transform-origin:50% 100%}
.nac-buddy svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible;filter:drop-shadow(0 2px 6px rgba(0,0,0,.25))}
.nac-bubble{position:absolute;left:50%;bottom:100%;transform:translate(-50%,-6px);background:#fff;color:#16210f;font-size:12px;font-weight:600;padding:5px 9px;border-radius:12px;white-space:nowrap;pointer-events:none;opacity:0}
.nac-bubble:after{content:"";position:absolute;left:50%;top:100%;border:5px solid transparent;border-top-color:#fff;transform:translateX(-50%)}
.nac-closing{position:absolute;left:0;right:0;bottom:6vh;z-index:2;text-align:center;color:#fff;font-style:italic;font-weight:300;font-size:clamp(14px,1.12vw,17px);text-shadow:0 1px 12px rgba(0,0,0,.45)}
.nac-pageno{position:absolute;right:clamp(16px,2.4vw,36px);bottom:3.2vh;z-index:3;display:flex;flex-direction:column;align-items:center;font-size:13px;line-height:1.55;color:var(--nac-muted);font-variant-numeric:tabular-nums}
.nac-pageno[data-light]{color:#fff}
.nac-scrollcue{position:absolute;left:clamp(16px,2.4vw,36px);bottom:3.2vh;z-index:3;display:flex;align-items:center;gap:10px;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#fff}
.nac-scrollcue i{position:relative;width:1px;height:34px;background:rgba(255,255,255,.35);overflow:hidden}
.nac-scrollcue i:after{content:"";position:absolute;left:0;top:-40%;width:1px;height:40%;background:#fff;animation:nac-cue 1.8s cubic-bezier(.6,0,.3,1) infinite}
@keyframes nac-cue{to{top:100%}}

.nac-facts{position:relative;height:calc(var(--nac-h) * (var(--nac-n) * .75 + 1))}
.nac-facts-stick{position:sticky;top:0;height:var(--nac-h);min-height:560px;display:grid;grid-template-columns:1.05fr 1fr;gap:clamp(24px,5vw,90px);align-items:center;padding:calc(var(--nac-head) + 3vh) clamp(16px,5vw,90px) 6vh;overflow:hidden}
.nac-facts-left{display:flex;flex-direction:column;gap:22px;min-width:0}
.nac-facts-title{font-size:clamp(18px,1.6vw,24px);font-weight:300;font-style:italic;max-width:28ch;color:var(--nac-ink)}
.nac-stats{position:relative;display:grid}
.nac-stat{grid-area:1/1;visibility:hidden}
.nac-stat[data-active]{visibility:visible}
.nac-stat-value{font-size:clamp(76px,11vw,188px);line-height:.9;font-weight:700;letter-spacing:-.05em;display:flex;flex-wrap:nowrap;white-space:pre;overflow:hidden;padding-bottom:.04em}
.nac-ch{display:inline-block;will-change:transform}
.nac-stat-value .nac-ch-hl{color:var(--nac-label)}
.nac-stat-text{margin-top:18px;font-size:clamp(17px,1.5vw,22px);line-height:1.4;max-width:30ch}
.nac-stat .nac-chip{margin-top:16px}
.nac-steps{display:flex;gap:8px;margin-top:6px}
.nac-steps button{width:42px;height:28px;position:relative}
.nac-steps button:before{content:"";position:absolute;left:0;right:0;top:50%;height:3px;margin-top:-1.5px;background:var(--nac-line);transition:background-color .3s}
.nac-steps button[aria-current="true"]:before{background:var(--nac-label)}
.nac-facts-right{position:relative;display:flex;flex-direction:column;align-items:center;gap:22px}
.nac-lens-card{position:relative;background:var(--nac-vellum);padding:5% 5% 4%;width:min(100%,50vh,560px);box-shadow:0 40px 80px -48px rgba(10,24,8,.5)}
.nac-lens{position:relative;aspect-ratio:1;overflow:hidden;clip-path:inset(0% 0% 0% 0% round 0% 0% 0% 0%);background:#4f7a2c}
.nac-lens .nac-pic{will-change:transform}
.nac-lens-cap{display:flex;justify-content:space-between;gap:12px;margin-top:12px;font-size:12px;color:var(--nac-muted);font-style:italic}
.nac-iso{display:grid;grid-template-columns:repeat(25,1fr);gap:6px 4px;width:min(100%,50vh,560px)}
.nac-iso svg{width:100%;height:auto;color:var(--nac-line);transition:color .45s ease}
.nac-root[data-theme="dark"] .nac-iso svg{color:rgba(255,255,255,.2)}
.nac-root .nac-iso svg[data-on]{color:var(--nac-buddy)}
.nac-facts-bar{position:absolute;left:0;right:0;bottom:0;height:3px;background:var(--nac-line)}
.nac-facts-bar i{position:absolute;inset:0;background:var(--nac-label);transform-origin:0 50%;transform:scaleX(0)}

.nac-signs{position:relative;height:calc(var(--nac-h) + var(--nac-run,220vh))}
.nac-signs-stick{position:sticky;top:0;height:var(--nac-h);min-height:600px;display:flex;flex-direction:column;justify-content:center;gap:clamp(20px,4vh,44px);overflow:hidden;padding-top:var(--nac-head)}
.nac-signs-head{display:flex;justify-content:space-between;align-items:flex-end;gap:24px;padding:0 clamp(16px,5vw,90px)}
.nac-signs-head .nac-h2{margin-top:14px}
.nac-signs-meta{display:flex;flex-direction:column;align-items:flex-end;gap:8px;font-size:13px;color:var(--nac-muted);font-style:italic;text-align:right}
.nac-signs-meta b{font-style:normal;font-size:28px;font-weight:700;color:var(--nac-ink);font-variant-numeric:tabular-nums;letter-spacing:-.02em}
.nac-track-wrap{position:relative}
.nac-track{display:flex;gap:clamp(16px,2.4vw,36px);padding:12px clamp(16px,5vw,90px) 24px;width:max-content;will-change:transform}
.nac-card{width:clamp(264px,25vw,380px);height:clamp(400px,56vh,540px);perspective:1400px;flex:none}
.nac-card-in{position:absolute;inset:0;transform-style:preserve-3d;transition:transform .8s cubic-bezier(.2,.75,.2,1)}
.nac-card[data-flipped] .nac-card-in{transform:rotateY(180deg)}
.nac-face-f,.nac-face-b{position:absolute;inset:0;-webkit-backface-visibility:hidden;backface-visibility:hidden;display:flex;flex-direction:column;background:var(--nac-card);box-shadow:0 30px 60px -40px rgba(10,24,8,.6),0 0 0 1px var(--nac-line)}
.nac-face-f{padding:14px 14px 18px}
.nac-face-b{transform:rotateY(180deg);background:var(--nac-label);color:var(--nac-label-ink);padding:24px 22px;justify-content:space-between}
.nac-card[data-urgent] .nac-face-b{background:var(--nac-accent)}
.nac-card-photo{position:relative;flex:1;min-height:0;overflow:hidden;background:#3d5a2a}
.nac-card-photo .nac-pic{inset:-4% -12%}
.nac-card-no{display:flex;justify-content:space-between;align-items:baseline;margin-top:14px;font-size:12px;color:var(--nac-muted);font-style:italic}
.nac-card-no b{font-style:normal;color:var(--nac-ink);font-weight:600;letter-spacing:.08em}
.nac-card h3{font-size:clamp(20px,1.7vw,26px);font-weight:700;letter-spacing:-.02em;margin-top:6px;line-height:1.1}
.nac-card-body{font-size:15px;line-height:1.45;margin-top:8px;color:var(--nac-muted)}
.nac-face-b h3{margin:0}
.nac-face-b p{font-size:clamp(17px,1.35vw,20px);line-height:1.42;font-weight:400}
.nac-face-b small{font-size:12px;letter-spacing:.14em;text-transform:uppercase;opacity:.85}
.nac-flip{position:absolute;inset:0;z-index:2;border-radius:2px}
.nac-flip-hint{display:inline-flex;align-items:center;gap:6px;margin-top:12px;font-size:12px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--nac-label)}
.nac-root[data-theme="dark"] .nac-flip-hint{color:#8fb0ff}
.nac-face-b .nac-flip-hint{color:inherit}
.nac-signs-bar{margin:0 clamp(16px,5vw,90px);height:2px;background:var(--nac-line);position:relative}
.nac-signs-bar i{position:absolute;inset:0;background:var(--nac-ink);transform-origin:0 50%;transform:scaleX(0)}

.nac-faith{position:relative;min-height:max(var(--nac-h),640px);display:grid;place-items:center;padding:calc(var(--nac-head) + 8vh) clamp(16px,5vw,90px) 12vh;overflow:clip;isolation:isolate;color:#fff}
.nac-faith-bg{position:absolute;inset:-12% 0;z-index:-1}
.nac-faith-bg:after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(6,16,4,.55),rgba(6,16,4,.25) 40%,rgba(6,16,4,.65))}
.nac-faith-in{max-width:1080px;width:100%;display:grid;gap:clamp(26px,5vh,48px)}
.nac-faith .nac-kicker{color:rgba(255,255,255,.85)}
.nac-faith-title{font-size:clamp(30px,4.2vw,60px);line-height:1.02;letter-spacing:-.025em;font-weight:700}
.nac-faith-title strong{background:var(--nac-label);color:var(--nac-label-ink);padding:0 .1em}
.nac-quote{font-size:clamp(22px,2.6vw,38px);line-height:1.3;font-weight:300;font-style:italic;letter-spacing:-.01em;max-width:30ch}
.nac-w{opacity:1}
.nac-verses{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px}
.nac-verse{background:var(--nac-vellum);color:var(--nac-ink);padding:20px 22px;display:flex;flex-direction:column;gap:12px;-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px)}
.nac-verse p{font-size:17px;line-height:1.45;font-style:italic}
.nac-verse cite{font-style:normal;font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:var(--nac-muted)}
.nac-hands{width:min(100%,420px);height:auto;overflow:visible;filter:drop-shadow(0 2px 8px rgba(0,0,0,.3))}
.nac-hand-stroke{stroke-dasharray:1;stroke-dashoffset:0}

.nac-help{position:relative;padding:calc(var(--nac-head) + 9vh) clamp(16px,5vw,90px) 12vh;display:grid;gap:clamp(32px,6vh,64px)}
.nac-help-head{display:grid;grid-template-columns:1.2fr 1fr;gap:24px 60px;align-items:end}
.nac-help-head .nac-h2{margin-top:14px}
.nac-help-head p{font-size:clamp(16px,1.3vw,19px);line-height:1.5;color:var(--nac-muted);max-width:42ch}
.nac-help-grid{display:grid;grid-template-columns:1.15fr 1fr 1.2fr;gap:18px;align-items:stretch}
.nac-panel{background:var(--nac-card);box-shadow:0 0 0 1px var(--nac-line);padding:clamp(20px,2vw,30px);display:flex;flex-direction:column;gap:16px;min-width:0}
.nac-panel h3{font-size:20px;font-weight:700;letter-spacing:-.015em}
.nac-panel-hint{font-size:13px;color:var(--nac-muted);font-style:italic}
.nac-face-wrap{display:flex;align-items:center;justify-content:center;padding:6px 0}
.nac-mood-face{width:clamp(120px,11vw,160px);height:auto;overflow:visible}
.nac-slider{position:relative;height:44px;touch-action:none;cursor:grab;outline:none}
.nac-slider:active{cursor:grabbing}
.nac-slider-track{position:absolute;left:0;right:0;top:50%;height:4px;margin-top:-2px;background:var(--nac-line)}
.nac-slider-fill{position:absolute;left:0;top:50%;height:4px;margin-top:-2px;background:var(--nac-label);width:0}
.nac-slider-dots{position:absolute;left:0;right:0;top:50%;display:flex;justify-content:space-between;pointer-events:none}
.nac-slider-dots i{width:8px;height:8px;margin-top:-4px;border-radius:50%;background:var(--nac-paper);box-shadow:inset 0 0 0 2px var(--nac-line)}
.nac-slider-thumb{position:absolute;top:50%;left:0;width:28px;height:28px;margin:-14px 0 0 -14px;border-radius:50%;background:var(--nac-label);box-shadow:0 0 0 5px color-mix(in srgb,var(--nac-label) 22%,transparent),0 6px 14px -6px rgba(0,0,0,.4)}
.nac-slider:focus-visible .nac-slider-thumb{outline:2px solid var(--nac-ink);outline-offset:4px}
.nac-mood-label{display:flex;flex-direction:column;gap:4px}
.nac-mood-label b{font-size:22px;letter-spacing:-.02em}
.nac-reply{font-size:16px;line-height:1.5;min-height:4.5em}
.nac-act{align-self:flex-start;display:inline-flex;align-items:center;gap:8px;font-weight:600;font-size:14px;padding:11px 16px;background:var(--nac-ink);color:var(--nac-paper);transition:transform .25s cubic-bezier(.2,.8,.2,1)}
.nac-act:hover{transform:translateY(-2px)}
.nac-act svg{width:14px;height:14px}
.nac-breath{position:relative;flex:1;min-height:220px;display:grid;place-items:center}
.nac-breath-ring{position:absolute;width:min(220px,80%);aspect-ratio:1;border-radius:50%;box-shadow:inset 0 0 0 1.5px var(--nac-line)}
.nac-breath-orb{width:min(220px,80%);aspect-ratio:1;border-radius:50%;background:radial-gradient(circle at 35% 30%,color-mix(in srgb,var(--nac-buddy) 70%,#fff),var(--nac-buddy) 60%,color-mix(in srgb,var(--nac-buddy) 70%,#a86b00));transform:scale(.55);box-shadow:0 20px 50px -20px color-mix(in srgb,var(--nac-buddy) 80%,#000)}
.nac-breath-txt{position:absolute;text-align:center;color:#2a2100;pointer-events:none}
.nac-breath-txt b{display:block;font-size:20px;letter-spacing:-.01em}
.nac-breath-txt span{font-size:34px;font-weight:700;font-variant-numeric:tabular-nums}
.nac-breath-row{display:flex;justify-content:space-between;align-items:center;gap:12px;font-size:13px;color:var(--nac-muted)}
.nac-lines{display:flex;flex-direction:column}
.nac-line{display:grid;grid-template-columns:1fr auto;gap:4px 16px;padding:16px 0;border-top:1px solid var(--nac-line);align-items:center}
.nac-line:first-child{border-top:0;padding-top:4px}
.nac-line[data-flash]{animation:nac-flash 1.6s ease}
@keyframes nac-flash{0%,100%{background:transparent}25%{background:color-mix(in srgb,var(--nac-buddy) 40%,transparent)}}
.nac-line h4{font-size:16px;font-weight:700;margin:0}
.nac-line p{grid-column:1;font-size:13.5px;line-height:1.45;color:var(--nac-muted)}
.nac-line-act{grid-row:1 / span 2;grid-column:2;display:flex;flex-direction:column;align-items:flex-end;gap:6px}
.nac-num{font-size:clamp(17px,1.5vw,21px);font-weight:700;letter-spacing:-.01em;text-decoration:none;white-space:nowrap;padding:2px 0;background-image:linear-gradient(var(--nac-label),var(--nac-label));background-size:0 2px;background-position:0 100%;background-repeat:no-repeat;transition:background-size .35s cubic-bezier(.2,.8,.2,1)}
.nac-num:hover{background-size:100% 2px}
.nac-line[data-urgent] .nac-num{color:var(--nac-accent)}
.nac-copy{font-size:12px;color:var(--nac-muted);text-decoration:underline;text-underline-offset:3px}

.nac-pledge{position:relative;min-height:max(var(--nac-h),640px);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:calc(var(--nac-head) + 10vh) 16px 14vh;overflow:clip;isolation:isolate}
.nac-pledge .nac-land{-webkit-mask-image:linear-gradient(180deg,transparent 0,#000 30%);mask-image:linear-gradient(180deg,transparent 0,#000 30%)}
.nac-pledge-card{position:relative;z-index:2;background:var(--nac-vellum);width:min(100%,620px);padding:clamp(26px,4vw,48px);display:flex;flex-direction:column;gap:18px;-webkit-backdrop-filter:blur(4px) saturate(.85);backdrop-filter:blur(4px) saturate(.85);box-shadow:0 50px 90px -50px rgba(10,24,8,.6)}
.nac-pledge-card p{font-size:17px;line-height:1.5;color:var(--nac-muted)}
.nac-crowd{display:flex;align-items:flex-end;gap:2px;height:46px;overflow:hidden}
.nac-crowd svg{width:22px;height:auto;flex:none}
.nac-pledge-row{display:flex;flex-wrap:wrap;align-items:center;gap:14px 20px}
.nac-pledge-btn{background:var(--nac-label);color:var(--nac-label-ink);font-weight:700;font-size:16px;padding:15px 22px;display:inline-flex;align-items:center;gap:10px;white-space:nowrap;transition:transform .25s cubic-bezier(.2,.8,.2,1),background-color .3s}
.nac-pledge-btn svg{width:15px;height:15px}
.nac-pledge-btn:hover{transform:translateY(-2px)}
.nac-pledge-btn[aria-pressed="true"]{background:var(--nac-ink);color:var(--nac-paper)}
.nac-pledge-count{font-size:14px;color:var(--nac-muted);font-variant-numeric:tabular-nums}

.nac-foot{position:relative;padding:clamp(48px,9vh,96px) clamp(16px,5vw,90px) 28px;display:grid;gap:clamp(36px,6vh,64px);border-top:1px solid var(--nac-line)}
.nac-foot-mark{font-size:clamp(48px,8.4vw,150px);font-weight:700;letter-spacing:-.05em;line-height:.95;display:flex;flex-wrap:wrap;align-items:baseline;gap:0 .22em}
.nac-foot-mark .nac-it{font-weight:300;letter-spacing:-.04em}
.nac-foot-mark .nac-label{line-height:1;padding:0 .08em .1em;transition:transform .5s cubic-bezier(.2,.8,.2,1)}
.nac-foot-mark:hover .nac-label{transform:rotate(-2deg) translateY(-4px)}
.nac-foot-row{display:flex;flex-wrap:wrap;justify-content:space-between;gap:20px;font-size:13px;color:var(--nac-muted);align-items:center}
.nac-foot-row nav{display:flex;flex-wrap:wrap;gap:6px 18px}
.nac-foot-row button{font-size:13px;text-decoration:underline;text-underline-offset:3px;text-decoration-color:var(--nac-line)}
.nac-foot-note{max-width:60ch}

.nac-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}

@media (max-width:1100px){
.nac-help-grid{grid-template-columns:1fr 1fr}
.nac-help-grid .nac-panel-lines{grid-column:1 / -1}
}
@media (max-width:900px){
.nac-nav,.nac-pager{display:none}
.nac-menu-btn{display:block}
.nac-exit kbd{display:none}
.nac-facts-stick{grid-template-columns:1fr;align-content:center;gap:20px;padding-top:calc(var(--nac-head) + 2vh)}
.nac-facts-right{flex-direction:row;align-items:flex-end;order:-1}
.nac-lens-card{width:min(44vw,240px);flex:none}
.nac-iso{width:auto;flex:1;grid-template-columns:repeat(10,1fr);gap:4px 5px}
.nac-stat-value{font-size:clamp(64px,19vw,120px)}
.nac-facts-title{display:none}
.nac-help-head{grid-template-columns:1fr}
}
@media (max-width:760px){
.nac-head{gap:10px}
.nac-cta{display:none}
.nac-hero-grid{display:flex;flex-direction:column;align-items:center;gap:30px;padding:5vh 20px 120px}
.nac-frame-slot{width:min(80vw,330px)}
.nac-copy-slot{width:min(100%,400px);margin-top:0}
.nac-closing{bottom:64px;padding:0 24px}
.nac-help-grid{grid-template-columns:1fr}
.nac-signs-head{flex-direction:column;align-items:flex-start}
.nac-signs-meta{align-items:flex-start;text-align:left}
.nac-card{width:76vw;height:min(54vh,460px)}
.nac-signs-meta{flex-direction:row;align-items:baseline;gap:14px}
.nac-signs-meta b{font-size:20px}
.nac-signs .nac-pageno,.nac-lens-cap span:first-child{display:none}
.nac-signs-stick{gap:18px}
.nac-scrollcue{display:none}
}
@media (prefers-reduced-motion:reduce){
.nac-pic-cut{animation:none;opacity:1}
.nac-pic-raw{transition:none}
.nac-card-in{transition:none}
.nac-card[data-flipped] .nac-card-in{transform:none}
.nac-card[data-flipped] .nac-face-f{visibility:hidden}
.nac-face-b{transform:none;visibility:hidden}
.nac-card[data-flipped] .nac-face-b{visibility:visible}
.nac-scrollcue i:after,.nac-pager b{animation:none}
.nac-nav-ink{transition:none}
}
.nac-root[data-motion="reduced"] .nac-signs{height:auto}
.nac-root[data-motion="reduced"] .nac-signs-stick{position:relative;height:auto;min-height:0;padding:calc(var(--nac-head) + 6vh) 0 8vh}
.nac-root[data-motion="reduced"] .nac-track-wrap{overflow-x:auto;scroll-snap-type:x mandatory}
.nac-root[data-motion="reduced"] .nac-card{scroll-snap-align:center}
.nac-root[data-motion="reduced"] .nac-signs-bar{display:none}
`

/* ------------------------------------------------------------------ */
/* Pieces                                                              */
/* ------------------------------------------------------------------ */

function Arrow() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <path d="M4 12 L12 4 M6 4 H12 V10" />
    </svg>
  )
}

function Person({ on }: { on?: boolean }) {
  return (
    <svg viewBox="0 0 12 22" data-on={on ? "" : undefined} aria-hidden="true">
      <circle cx="6" cy="3.6" r="3" fill="currentColor" />
      <path d="M2.2 8.6 Q6 6.6 9.8 8.6 L9.4 15 L8 15 L7.6 21.4 L4.4 21.4 L4 15 L2.6 15 Z" fill="currentColor" />
    </svg>
  )
}

function Buddies({ palette, lines, hi }: { palette: NacPalette; lines: string[]; hi: string }) {
  const refs = React.useRef([] as (HTMLDivElement | null)[])
  const [said, setSaid] = React.useState(["", "", ""])
  const count = React.useRef(0)
  const poke = (i: number) => {
    const el = refs.current[i]
    const line = lines[count.current++ % lines.length] || "hi!"
    setSaid((s) => s.map((v, k) => (k === i ? line : v)))
    if (!el) return
    const body = el.querySelector(".nac-buddy-body")
    const bubble = el.querySelector(".nac-bubble")
    if (prefersReduced()) {
      gsap.set(bubble, { opacity: 1 })
      gsap.to(bubble, { opacity: 0, delay: 1.6, duration: 0.01 })
      return
    }
    gsap.killTweensOf([body, bubble])
    gsap
      .timeline()
      .to(body, { scaleY: 0.82, scaleX: 1.1, duration: 0.12, ease: "power2.in" })
      .to(body, { y: -26, scaleY: 1.08, scaleX: 0.94, rotate: i === 1 ? 0 : i === 0 ? -8 : 8, duration: 0.32, ease: "power3.out" })
      .to(body, { y: 0, scaleY: 1, scaleX: 1, rotate: 0, duration: 0.5, ease: "bounce.out" })
    gsap.fromTo(bubble, { opacity: 0, y: 8, scale: 0.7 }, { opacity: 1, y: -6, scale: 1, duration: 0.35, ease: "back.out(2.6)" })
    gsap.to(bubble, { opacity: 0, y: -14, duration: 0.35, delay: 1.7, ease: "power2.in" })
  }
  const colors = ["#ffffff", palette.buddy, "#ffffff"]
  return (
    <div className="nac-buddies">
      {colors.map((c, i) => (
        <div key={i} className="nac-buddy" ref={(el) => (refs.current[i] = el)}>
          <span className="nac-bubble" aria-live="polite">
            {said[i]}
          </span>
          <button type="button" className="nac-buddy-btn" aria-label={hi} onClick={() => poke(i)}>
            <div className="nac-buddy-body">
              <Figure i={i} color={c} />
            </div>
          </button>
        </div>
      ))}
    </div>
  )
}

function MoodFace({ value, max, palette }: { value: number; max: number; palette: NacPalette }) {
  const s = moodShape(value, max)
  const fill = s.t < 0.5 ? mixHex("#9fb0cf", "#e6e2d6", s.t * 2) : mixHex("#e6e2d6", palette.buddy, (s.t - 0.5) * 2)
  const ink = "#1d2433"
  return (
    <svg viewBox="0 0 120 120" className="nac-mood-face" aria-hidden="true">
      <circle cx="60" cy="60" r="52" fill={fill} />
      <circle cx="60" cy="60" r="52" fill="none" stroke={ink} strokeOpacity=".12" strokeWidth="2" />
      <g stroke={ink} strokeWidth="3.4" strokeLinecap="round" fill="none">
        <path d={"M36 " + (40 + Number(s.brow) * 0.4) + " L50 " + (40 - Number(s.brow) * 0.5)} />
        <path d={"M84 " + (40 + Number(s.brow) * 0.4) + " L70 " + (40 - Number(s.brow) * 0.5)} />
        <path d={s.mouth} />
      </g>
      <ellipse cx="44" cy="54" rx="4" ry={s.eye} fill={ink} />
      <ellipse cx="76" cy="54" rx="4" ry={s.eye} fill={ink} />
      <ellipse cx="34" cy="72" rx="7" ry="4" fill="#ff8a7a" opacity={s.t * 0.55} />
      <ellipse cx="86" cy="72" rx="7" ry="4" fill="#ff8a7a" opacity={s.t * 0.55} />
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/* The template                                                        */
/* ------------------------------------------------------------------ */

type SecKey = "home" | "facts" | "signs" | "faith" | "help" | "pledge"

export default function NotAloneCampaignTemplate({
  brand = DEFAULT_BRAND,
  hero = DEFAULT_HERO,
  stats = DEFAULT_STATS,
  signs = DEFAULT_SIGNS,
  faith = DEFAULT_FAITH,
  helplines = DEFAULT_HELPLINES,
  moods = DEFAULT_MOODS,
  breath = [4, 7, 8],
  pledge = DEFAULT_PLEDGE,
  labels,
  palette = "meadow",
  theme = "system",
  colors = 10,
  quickExitUrl = "https://www.google.com/search?q=weather",
  onPledge,
  onCheckin,
  height = "100svh",
  className,
}: NotAloneCampaignTemplateProps) {
  const L = { ...DEFAULT_LABELS, ...labels }
  const pal = resolvePalette(palette)
  const uid = React.useId().replace(/[^a-zA-Z0-9]/g, "")
  const dark = useDark(theme)
  const reduced = useReducedMotion()
  const rootRef = React.useRef(null as HTMLDivElement | null)
  const scrollerRef = React.useRef(null as HTMLElement | Window | null)

  const statList = stats && stats.length ? stats : null
  const signList = signs && signs.length ? signs : null
  const sections = (["home", statList && "facts", signList && "signs", faith && "faith", "help", pledge && "pledge"].filter(Boolean) as SecKey[])
  const pageOf = (k: SecKey) => sections.indexOf(k) + 1
  const navItems = ([
    statList && { key: "facts", label: L.navFacts },
    signList && { key: "signs", label: L.navSigns },
    faith && { key: "faith", label: L.navFaith },
    { key: "help", label: L.navHelp },
  ].filter(Boolean) as { key: SecKey; label: string }[])

  const [active, setActive] = React.useState("home" as SecKey)
  const [solid, setSolid] = React.useState(false)
  const [menu, setMenu] = React.useState(false)
  const [step, setStep] = React.useState(0)
  const [flipped, setFlipped] = React.useState([] as number[])
  const [signAt, setSignAt] = React.useState(0)
  const [mood, setMood] = React.useState(Math.min(2, Math.max(0, moods.length - 1)))
  const [copied, setCopied] = React.useState("")
  const [breathing, setBreathing] = React.useState(false)
  const [breathState, setBreathState] = React.useState(breathAt(0, breath))
  const [pledged, setPledged] = React.useState(false)
  const [flash, setFlash] = React.useState(-1)

  const navRef = React.useRef(null as HTMLElement | null)
  const inkRef = React.useRef(null as HTMLSpanElement | null)
  const moodRef = React.useRef(null as HTMLDivElement | null)
  const moodVal = React.useRef(mood)
  const moodTween = React.useRef(null as gsap.core.Tween | null)
  const [moodLive, setMoodLive] = React.useState(mood)
  const orbRef = React.useRef(null as HTMLDivElement | null)
  const stepRef = React.useRef(0)
  const prevStep = React.useRef(-1)

  const ISO_TOTAL = 50
  const isoRank = React.useMemo(() => isoOrder(ISO_TOTAL, 11), [])
  const buddyLines = L.buddyLines.split("|").filter(Boolean)

  const secEl = (k: SecKey) => rootRef.current?.querySelector('[data-sec="' + k + '"]') as HTMLElement | null
  const go = (k: SecKey) => {
    setMenu(false)
    const el = secEl(k)
    if (!el) return
    scrollToY(scrollerRef.current || window, el, 1, !prefersReduced())
  }
  const goStep = (i: number) => {
    const el = secEl("facts")
    if (!el || !statList) return
    const run = el.offsetHeight - (el.firstElementChild as HTMLElement).offsetHeight
    scrollToY(scrollerRef.current || window, el, ((i + 0.5) / statList.length) * run, !prefersReduced())
  }

  /* ---------- the motion ---------- */

  useIsoLayoutEffect(() => {
    const root = rootRef.current
    if (!root) return
    gsap.registerPlugin(ScrollTrigger)
    const sc = findScroller(root)
    scrollerRef.current = sc
    const scroller = sc === window ? undefined : (sc as HTMLElement)
    const R = prefersReduced()
    const q = (s: string) => Array.from(root.querySelectorAll(s)) as HTMLElement[]
    const offs = [] as (() => void)[]

    const ctx = gsap.context(() => {
      const heroEl = root.querySelector('[data-sec="home"]') as HTMLElement

      // the header turns solid once the first page has scrolled under it
      ScrollTrigger.create({
        trigger: heroEl,
        scroller,
        start: "top+=56 top",
        onEnter: () => setSolid(true),
        onLeaveBack: () => setSolid(false),
      })
      for (const el of q("[data-sec]")) {
        ScrollTrigger.create({
          trigger: el,
          scroller,
          start: "top 45%",
          end: "bottom 45%",
          onToggle: (self) => self.isActive && setActive(el.dataset.sec as SecKey),
        })
      }

      if (!R) {
        // page one: the print develops, the vellum frame settles, the friends draw themselves
        const tl = gsap.timeline({ defaults: { ease: "power3.out" } })
        tl.fromTo(".nac-hero .nac-land", { clipPath: "inset(34% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.7, ease: "power3.inOut", clearProps: "clipPath" }, 0)
          .from(".nac-hero .nac-land-move", { scale: 1.14, duration: 2.4, ease: "power2.out" }, 0)
          .from(".nac-tagline", { y: 16, opacity: 0, duration: 1 }, 0.25)
          .from(".nac-frame", { y: 90, rotate: -2.5, opacity: 0, duration: 1.4 }, 0.5)
          .from(".nac-frame-win .nac-pic", { scale: 1.4, duration: 2 }, 0.5)
          .from(".nac-frame-kicker", { y: 14, opacity: 0, duration: 0.8 }, 1.05)
          .from(".nac-frame-word .nac-label", { scaleX: 0, transformOrigin: "0% 50%", duration: 0.75, ease: "power4.inOut" }, 1.15)
          .from(".nac-frame-word .nac-label-t", { yPercent: 115, duration: 0.7 }, 1.5)
          .from(".nac-fact, .nac-hero-copy .nac-chip", { y: 22, opacity: 0, stagger: 0.12, duration: 0.9 }, 1.1)
          .fromTo(".nac-buddies .nac-stroke", { strokeDasharray: 1, strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.55, stagger: 0.07, ease: "power1.inOut" }, 1.4)
          .from(".nac-buddies .nac-face", { opacity: 0, duration: 0.4, stagger: 0.15 }, 2.4)
          .from(".nac-faithline, .nac-closing, .nac-hero .nac-pageno, .nac-scrollcue", { y: 14, opacity: 0, stagger: 0.1, duration: 0.9 }, 2.1)
          .from(".nac-head", { y: -20, opacity: 0, duration: 0.8 }, 0.3)
        q(".nac-buddy").forEach((b, i) =>
          gsap.to(b, { y: -4, rotate: i === 1 ? 0 : i ? 2 : -2, duration: 1.6 + i * 0.2, ease: "sine.inOut", yoyo: true, repeat: -1, delay: 3 + i * 0.25 })
        )

        // scroll: the land sinks, the frame and the copy lift away at their own speeds
        const sink = { trigger: heroEl, scroller, start: "top top", end: "bottom top", scrub: true }
        gsap.to(".nac-hero .nac-land-move", { yPercent: 9, ease: "none", scrollTrigger: sink })
        gsap.to(".nac-frame-slot", { y: -120, ease: "none", scrollTrigger: sink })
        gsap.to(".nac-copy-slot", { y: -60, ease: "none", scrollTrigger: sink })
        gsap.to(".nac-tagline", { y: 40, opacity: 0, ease: "none", scrollTrigger: { ...sink, end: "30% top" } })

        // the pointer: the land and the window drift against each other, like looking through glass
        const land = heroEl.querySelector(".nac-land-move")
        const win = heroEl.querySelector(".nac-frame-win .nac-pic")
        const lx = gsap.quickTo(land, "x", { duration: 1.2, ease: "power3.out" })
        const wx = gsap.quickTo(win, "x", { duration: 1, ease: "power3.out" })
        const wy = gsap.quickTo(win, "y", { duration: 1, ease: "power3.out" })
        const onMove = (e: PointerEvent) => {
          if (e.pointerType !== "mouse") return
          const r = heroEl.getBoundingClientRect()
          const nx = (e.clientX - r.left) / r.width - 0.5
          const ny = (e.clientY - r.top) / r.height - 0.5
          lx(nx * -18)
          wx(nx * 22)
          wy(ny * 14)
        }
        heroEl.addEventListener("pointermove", onMove)
        offs.push(() => heroEl.removeEventListener("pointermove", onMove))
      }

      // the facts: one step per stretch of scroll
      const factsEl = root.querySelector('[data-sec="facts"]') as HTMLElement | null
      if (factsEl && statList) {
        const n = statList.length
        ScrollTrigger.create({
          trigger: factsEl,
          scroller,
          start: "top top",
          end: "bottom bottom",
          onUpdate: (self) => {
            const i = stepAt(self.progress, n)
            if (i !== stepRef.current) {
              stepRef.current = i
              setStep(i)
            }
          },
        })
        gsap.to(".nac-facts-bar i", { scaleX: 1, ease: "none", scrollTrigger: { trigger: factsEl, scroller, start: "top top", end: "bottom bottom", scrub: true } })
        if (!R) {
          gsap.from(".nac-lens-card", { y: 80, rotate: 2, opacity: 0, duration: 1.2, ease: "power3.out", scrollTrigger: { trigger: factsEl, scroller, start: "top 70%" } })
          gsap.from(".nac-iso svg", { opacity: 0, y: 10, stagger: { each: 0.012, from: "random" }, duration: 0.6, scrollTrigger: { trigger: factsEl, scroller, start: "top 55%" } })
        }
      }

      // the signs: the page scroll walks the row of cards sideways
      const signsEl = root.querySelector('[data-sec="signs"]') as HTMLElement | null
      const track = root.querySelector(".nac-track") as HTMLElement | null
      if (signsEl && track && !R) {
        const wrap = track.parentElement as HTMLElement
        const dist = () => Math.max(0, track.scrollWidth - wrap.clientWidth)
        const setRun = () => signsEl.style.setProperty("--nac-run", Math.round(dist() * 1.6) + "px")
        setRun()
        const cards = q(".nac-card")
        const slide = gsap.to(track, {
          x: () => -dist(),
          ease: "none",
          scrollTrigger: {
            trigger: signsEl,
            scroller,
            start: "top top",
            end: "bottom bottom",
            scrub: 0.6,
            invalidateOnRefresh: true,
            onRefreshInit: setRun,
            onUpdate: (self) => setSignAt(Math.round(self.progress * Math.max(0, cards.length - 1))),
          },
        })
        gsap.to(".nac-signs-bar i", { scaleX: 1, ease: "none", scrollTrigger: { trigger: signsEl, scroller, start: "top top", end: "bottom bottom", scrub: true } })
        cards.forEach((card) => {
          gsap.fromTo(card, { rotate: 3, y: 26 }, { rotate: -2, y: -8, ease: "none", scrollTrigger: { trigger: card, containerAnimation: slide, start: "left right", end: "right left", scrub: true } })
          const ph = card.querySelector(".nac-card-photo .nac-pic")
          if (ph) gsap.fromTo(ph, { xPercent: 7 }, { xPercent: -7, ease: "none", scrollTrigger: { trigger: card, containerAnimation: slide, start: "left right", end: "right left", scrub: true } })
        })
        gsap.from(".nac-signs-head > *", { y: 30, opacity: 0, stagger: 0.12, duration: 1, ease: "power3.out", scrollTrigger: { trigger: signsEl, scroller, start: "top 70%" } })
      }

      // faith: words come up as you read, the friends join hands
      const faithEl = root.querySelector('[data-sec="faith"]') as HTMLElement | null
      if (faithEl && !R) {
        gsap.fromTo(".nac-faith-bg", { yPercent: -6 }, { yPercent: 6, ease: "none", scrollTrigger: { trigger: faithEl, scroller, start: "top bottom", end: "bottom top", scrub: true } })
        gsap.fromTo(".nac-w", { opacity: 0.18 }, { opacity: 1, stagger: 0.08, ease: "none", scrollTrigger: { trigger: ".nac-quote", scroller, start: "top 82%", end: "bottom 45%", scrub: true } })
        gsap.fromTo(".nac-hand-stroke", { strokeDashoffset: 1 }, { strokeDashoffset: 0, stagger: 0.04, ease: "none", scrollTrigger: { trigger: ".nac-hands", scroller, start: "top 92%", end: "top 45%", scrub: true } })
        gsap.from(".nac-faith-title, .nac-verse", { y: 40, opacity: 0, stagger: 0.12, duration: 1, ease: "power3.out", scrollTrigger: { trigger: faithEl, scroller, start: "top 60%" } })
      }

      if (!R) {
        // everything else rises into place once
        for (const el of q("[data-rise]")) {
          gsap.from(el, { y: 36, opacity: 0, duration: 1, ease: "power3.out", scrollTrigger: { trigger: el, scroller, start: "top 88%" } })
        }
        const pledgeEl = root.querySelector('[data-sec="pledge"]') as HTMLElement | null
        if (pledgeEl) {
          gsap.fromTo(pledgeEl.querySelector(".nac-land-move"), { yPercent: -8, scale: 1.08 }, { yPercent: 4, scale: 1, ease: "none", scrollTrigger: { trigger: pledgeEl, scroller, start: "top bottom", end: "bottom bottom", scrub: true } })
          gsap.from(".nac-pledge-card", { y: 100, opacity: 0, rotate: -1.5, duration: 1.3, ease: "power3.out", scrollTrigger: { trigger: pledgeEl, scroller, start: "top 55%" } })
        }
        gsap.from(".nac-foot-mark > *", { yPercent: 60, opacity: 0, stagger: 0.1, duration: 1.1, ease: "power4.out", scrollTrigger: { trigger: ".nac-foot", scroller, start: "top 85%" } })
      }
    }, root)

    // pictures arrive late and change heights: measure again once they settle
    let raf = 0
    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => ScrollTrigger.refresh())
    })
    ro.observe(root)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      offs.forEach((f) => f())
      ctx.revert()
    }
  }, [reduced, statList?.length, signList?.length, !!faith, !!pledge])

  // a fact step: the big number rolls in, the lens changes shape, the crowd lights up
  useIsoLayoutEffect(() => {
    const root = rootRef.current
    if (!root || !statList) return
    const prev = prevStep.current
    prevStep.current = step
    const R = prefersReduced()
    const stat = root.querySelector('.nac-stat[data-i="' + step + '"]')
    const lens = root.querySelector(".nac-lens")
    const lensPic = root.querySelector(".nac-lens .nac-pic")
    // a print, a porthole, a chapel window
    const shapes = ["inset(0% 0% 0% 0% round 0% 0% 0% 0%)", "inset(8% 8% 8% 8% round 50% 50% 50% 50%)", "inset(4% 17% 4% 17% round 50% 50% 0% 0%)"]
    const moves = [
      { scale: 1.12, xPercent: 0, yPercent: 0 },
      { scale: 1.55, xPercent: -12, yPercent: 6 },
      { scale: 1.3, xPercent: 10, yPercent: -4 },
    ]
    const k = step % shapes.length
    if (R || prev < 0) {
      gsap.set(lens, { clipPath: shapes[k] })
      gsap.set(lensPic, moves[k])
      return
    }
    const dir = step >= prev ? 1 : -1
    if (stat) {
      gsap.fromTo(stat.querySelectorAll(".nac-ch"), { yPercent: 105 * dir }, { yPercent: 0, duration: 0.8, stagger: 0.035, ease: "power4.out" })
      gsap.fromTo(stat.querySelectorAll(".nac-stat-text, .nac-chip"), { y: 18 * dir, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, stagger: 0.08, ease: "power3.out", delay: 0.12 })
    }
    gsap.to(lens, { clipPath: shapes[k], duration: 1.1, ease: "power3.inOut" })
    gsap.to(lensPic, { ...moves[k], duration: 1.4, ease: "power3.inOut" })
    const total = ISO_TOTAL
    const now = isoCount(statList[step].fraction, total)
    const was = isoCount(statList[prev]?.fraction || 0, total)
    const lit = Array.from(root.querySelectorAll(".nac-iso svg")).filter((_, i) => isoRank[i] < now && isoRank[i] >= was)
    if (lit.length) gsap.fromTo(lit, { y: -10, scale: 1.35 }, { y: 0, scale: 1, duration: 0.6, stagger: { each: 0.018, from: "random" }, ease: "back.out(3)" })
  }, [step, !!statList])

  // the nav underline follows the page you are on
  useIsoLayoutEffect(() => {
    const nav = navRef.current
    const ink = inkRef.current
    if (!nav || !ink) return
    const btn = nav.querySelector('[data-k="' + active + '"]') as HTMLElement | null
    if (!btn) {
      ink.style.opacity = "0"
      return
    }
    ink.style.opacity = "1"
    ink.style.width = btn.offsetWidth - 24 + "px"
    ink.style.transform = "translateX(" + (btn.offsetLeft + 12) + "px)"
  }, [active, navItems.length])

  // breathing: a clock that knows which phase it is in, and an orb that follows
  React.useEffect(() => {
    if (!breathing) return
    const t0 = performance.now()
    let last = ""
    const tick = () => {
      const s = breathAt((performance.now() - t0) / 1000, breath)
      setBreathState(s)
      if (s.round >= 4) setBreathing(false)
      const key = s.phase + s.round
      if (key !== last) {
        last = key
        const ph = breathPhases(breath)[s.index]
        const orb = orbRef.current
        if (orb && !prefersReduced()) {
          if (s.phase === "in") gsap.to(orb, { scale: 1, duration: ph.secs, ease: "sine.inOut" })
          if (s.phase === "out") gsap.to(orb, { scale: 0.55, duration: ph.secs, ease: "sine.inOut" })
        } else if (orb) gsap.set(orb, { scale: s.phase === "out" ? 0.55 : 1 })
      }
    }
    tick()
    const id = setInterval(tick, 200)
    return () => {
      clearInterval(id)
      if (orbRef.current) gsap.to(orbRef.current, { scale: 0.55, duration: prefersReduced() ? 0 : 1.2, ease: "power2.out" })
    }
  }, [breathing, breath.join(",")])

  // quick exit on a triple Escape, the way many support sites do it
  React.useEffect(() => {
    if (!quickExitUrl) return
    let hits = [] as number[]
    const on = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return
      if (menu) return setMenu(false)
      const now = Date.now()
      hits = hits.filter((t) => now - t < 1200).concat(now)
      if (hits.length >= 3) window.location.replace(quickExitUrl)
    }
    window.addEventListener("keydown", on)
    return () => window.removeEventListener("keydown", on)
  }, [quickExitUrl, menu])

  /* ---------- the check-in slider ---------- */

  const maxMood = Math.max(0, moods.length - 1)
  const setMoodValue = (v: number, settle: boolean) => {
    const c = clamp(v, 0, maxMood)
    if (settle) {
      const target = Math.round(c)
      const obj = { v: moodVal.current }
      moodTween.current?.kill()
      moodTween.current = gsap.to(obj, {
        v: target,
        duration: prefersReduced() ? 0 : 0.45,
        ease: "back.out(2)",
        onUpdate: () => {
          moodVal.current = obj.v
          setMoodLive(obj.v)
        },
      })
      if (target !== mood) {
        setMood(target)
        onCheckin?.(moods[target], target)
      }
    } else {
      moodVal.current = c
      setMoodLive(c)
    }
  }
  const fromPointer = (e: React.PointerEvent) => {
    const el = moodRef.current
    if (!el) return 0
    const r = el.getBoundingClientRect()
    return ((e.clientX - r.left) / r.width) * maxMood
  }
  const dragging = React.useRef(false)
  const moodNow = moods[mood] || moods[0]

  const doAction = async (a: NacMood["action"]) => {
    if (a === "talk") {
      const el = rootRef.current?.querySelector(".nac-lines") as HTMLElement | null
      if (el) scrollToY(scrollerRef.current || window, el, -140, !prefersReduced())
      setFlash(0)
      setTimeout(() => setFlash(-1), 1700)
    } else if (a === "breathe") {
      setBreathing(true)
    } else {
      const ok = await copyText(L.checkinText)
      setCopied(ok ? "checkin" : "")
      setTimeout(() => setCopied(""), 2000)
    }
  }

  const doPledge = () => {
    if (pledged) return
    setPledged(true)
    onPledge?.()
    const root = rootRef.current
    if (!root || prefersReduced()) return
    const crowd = root.querySelectorAll(".nac-crowd svg")
    gsap.fromTo(crowd, { y: 0 }, { y: -10, duration: 0.25, yoyo: true, repeat: 1, stagger: { each: 0.03, from: "end" }, ease: "power2.out" })
  }

  const vars = {
    "--nac-h": height,
    "--nac-paper": dark ? undefined : pal.paper,
    "--nac-ink": dark ? undefined : pal.ink,
    "--nac-label": pal.label,
    "--nac-label-ink": pal.labelInk,
    "--nac-accent": pal.accent,
    "--nac-buddy": pal.buddy,
    "--nac-n": statList ? statList.length : 1,
  } as React.CSSProperties

  const crowdSize = 22
  const pledgeTotal = (pledge ? pledge.count : 0) + (pledged ? 1 : 0)

  return (
    <div
      ref={rootRef}
      className={"nac-root" + (className ? " " + className : "")}
      style={vars}
      data-theme={dark ? "dark" : "light"}
      data-motion={reduced ? "reduced" : "full"}
      data-solid={solid || menu ? "" : undefined}
    >
      <style>{NAC_CSS}</style>

      <header className="nac-head">
        <a className="nac-brand" href={"#" + uid + "-home"} onClick={(e) => (e.preventDefault(), go("home"))}>
          <span className="nac-brand-mark" aria-hidden="true">
            <i />
          </span>
          <span>
            {brand.name} <span className="nac-label">{brand.word}</span>
          </span>
        </a>
        <nav className="nac-nav" ref={navRef} aria-label={brand.name + " " + brand.word}>
          {navItems.map((n) => (
            <button key={n.key} type="button" data-k={n.key} aria-current={active === n.key ? "true" : undefined} onClick={() => go(n.key)}>
              {n.label}
            </button>
          ))}
          <span className="nac-nav-ink" ref={inkRef} aria-hidden="true" />
        </nav>
        <span className="nac-pager" aria-label={L.page + " " + pageOf(active) + " / " + sections.length}>
          <b key={active}>{String(pageOf(active)).padStart(2, "0")}</b>/ {String(sections.length).padStart(2, "0")}
        </span>
        <button type="button" className="nac-menu-btn" aria-expanded={menu} onClick={() => setMenu((m) => !m)}>
          {menu ? L.close : L.menu}
        </button>
        {quickExitUrl && (
          <button type="button" className="nac-exit" title={L.quickExitHint} onClick={() => window.location.replace(quickExitUrl)}>
            {L.quickExit} <kbd>Esc x3</kbd>
          </button>
        )}
        <button type="button" className="nac-cta" onClick={() => go("help")}>
          {L.talk}
        </button>
        {menu && (
          <div className="nac-sheet">
            {navItems.map((n) => (
              <button key={n.key} type="button" onClick={() => go(n.key)}>
                {n.label}
              </button>
            ))}
            <button type="button" onClick={() => go("help")}>
              {L.talk}
            </button>
          </div>
        )}
      </header>

      {/* 01: you are not alone */}
      <section className="nac-hero" data-sec="home" id={uid + "-home"} aria-labelledby={uid + "-h1"}>
        <div className="nac-land" aria-hidden="true">
          <div className="nac-land-move nac-night">
            <Print shot={hero.landscape} width={2000} colors={colors} eager decorative fallback={<HillsArt />} />
          </div>
        </div>
        <Grain id={uid + "-grain"} />
        <p className="nac-tagline">{hero.tagline}</p>
        <div className="nac-hero-grid">
          <div className="nac-frame-slot">
            <figure className="nac-frame">
              <div className="nac-frame-win nac-night">
                <Print shot={hero.window} width={900} colors={colors} eager fallback={<HillsArt />} />
              </div>
              <figcaption className="nac-frame-cap">
                <h1 id={uid + "-h1"}>
                  <span className="nac-frame-kicker">{hero.kicker}</span>
                  <span className="nac-frame-word" style={{ display: "block" }}>
                    <span className="nac-label">
                      <span className="nac-label-t">{hero.word}</span>
                    </span>
                  </span>
                </h1>
              </figcaption>
              <i className="nac-frame-gutter" aria-hidden="true" />
            </figure>
          </div>
          <div className="nac-copy-slot">
            <div className="nac-hero-copy">
              <p className="nac-fact">
                <Rich text={hero.fact} />
              </p>
              {hero.source && (
                <a className="nac-chip" href={hero.source.href} target="_blank" rel="noreferrer">
                  {hero.source.label}
                </a>
              )}
              <Buddies palette={pal} lines={buddyLines} hi={L.buddyHi} />
              {hero.faith && (
                <p className="nac-faithline">
                  <Rich text={hero.faith} />
                </p>
              )}
            </div>
          </div>
        </div>
        <p className="nac-closing">{hero.closing}</p>
        <span className="nac-scrollcue" aria-hidden="true">
          <i />
          Scroll
        </span>
        <PageNo n={1} light />
      </section>

      {/* 02: the facts */}
      {statList && (
        <section className="nac-facts" data-sec="facts" id={uid + "-facts"} aria-labelledby={uid + "-facts-h"}>
          <div className="nac-facts-stick">
            <div className="nac-facts-left">
              <p className="nac-kicker" id={uid + "-facts-h"}>
                {L.factsKicker}
              </p>
              <p className="nac-facts-title">{L.factsTitle}</p>
              <div className="nac-stats" aria-live="polite">
                {statList.map((s, i) => (
                  <div key={i} className="nac-stat" data-i={i} data-active={i === step ? "" : undefined} aria-hidden={i !== step}>
                    <h2 className="nac-stat-value" aria-label={s.value}>
                      {Array.from(s.value).map((c, k) => (
                        <span key={k} className={"nac-ch" + (/\d/.test(c) ? " nac-ch-hl" : "")} aria-hidden="true">
                          {c}
                        </span>
                      ))}
                    </h2>
                    <p className="nac-stat-text">{s.text}</p>
                    {s.source && (
                      <a className="nac-chip" href={s.source.href} target="_blank" rel="noreferrer" tabIndex={i === step ? 0 : -1}>
                        {s.source.label} <Arrow />
                      </a>
                    )}
                  </div>
                ))}
              </div>
              {statList.length > 1 && (
                <div className="nac-steps">
                  {statList.map((_, i) => (
                    <button key={i} type="button" aria-label={fill(L.factsStep, { n: i + 1 })} aria-current={i === step ? "true" : undefined} onClick={() => goStep(i)} />
                  ))}
                </div>
              )}
            </div>
            <div className="nac-facts-right">
              <figure className="nac-lens-card">
                <div className="nac-lens nac-night">
                  <Print shot={hero.landscape} width={1100} colors={colors} decorative fallback={<HillsArt />} />
                </div>
                <figcaption className="nac-lens-cap">
                  <span>Fig. {String(step + 1).padStart(2, "0")}</span>
                  <span>{fill(L.factsFigure, { count: isoCount(statList[step].fraction, ISO_TOTAL), total: ISO_TOTAL })}</span>
                </figcaption>
              </figure>
              <div className="nac-iso" aria-hidden="true">
                {Array.from({ length: ISO_TOTAL }, (_, i) => (
                  <Person key={i} on={isoRank[i] < isoCount(statList[step].fraction, ISO_TOTAL)} />
                ))}
              </div>
            </div>
            <PageNo n={pageOf("facts")} />
            <span className="nac-facts-bar" aria-hidden="true">
              <i />
            </span>
          </div>
        </section>
      )}

      {/* 03: the signs */}
      {signList && (
        <section className="nac-signs" data-sec="signs" id={uid + "-signs"} aria-labelledby={uid + "-signs-h"}>
          <div className="nac-signs-stick">
            <div className="nac-signs-head">
              <div>
                <p className="nac-kicker">{L.signsKicker}</p>
                <h2 className="nac-h2" id={uid + "-signs-h"}>
                  <Rich text={L.signsTitle} />
                </h2>
              </div>
              <div className="nac-signs-meta">
                <b>
                  {String(signAt + 1).padStart(2, "0")} / {String(signList.length).padStart(2, "0")}
                </b>
                <span>{L.signsHint}</span>
              </div>
            </div>
            <div className="nac-track-wrap">
              <ol className="nac-track">
                {signList.map((s, i) => {
                  const on = flipped.includes(i)
                  const toggle = () => setFlipped((f) => (f.includes(i) ? f.filter((x) => x !== i) : f.concat(i)))
                  return (
                    <li key={i} className="nac-card" data-flipped={on ? "" : undefined} data-urgent={s.urgent ? "" : undefined}>
                      <div className="nac-card-in">
                        <div className="nac-face-f" aria-hidden={on}>
                          <div className="nac-card-photo nac-night">
                            <Print shot={s.shot} width={800} colors={colors} decorative />
                          </div>
                          <p className="nac-card-no">
                            <b>{String(i + 1).padStart(2, "0")}</b>
                            <span>{L.signsFront}</span>
                          </p>
                          <h3>{s.title}</h3>
                          <p className="nac-card-body">{s.body}</p>
                          <span className="nac-flip-hint" aria-hidden="true">
                            {L.signsBack} +
                          </span>
                        </div>
                        <div className="nac-face-b" aria-hidden={!on}>
                          <small>
                            {String(i + 1).padStart(2, "0")} / {L.signsBack}
                          </small>
                          <p>{s.help}</p>
                          <h3>{s.title}</h3>
                        </div>
                        <button type="button" className="nac-flip" aria-pressed={on} aria-label={s.title + ": " + (on ? L.signsFront : L.signsBack)} onClick={toggle} />
                      </div>
                    </li>
                  )
                })}
              </ol>
            </div>
            <span className="nac-signs-bar" aria-hidden="true">
              <i />
            </span>
            <PageNo n={pageOf("signs")} />
          </div>
        </section>
      )}

      {/* 04: faith */}
      {faith && (
        <section className="nac-faith" data-sec="faith" id={uid + "-faith"} aria-labelledby={uid + "-faith-h"}>
          <div className="nac-faith-bg nac-night" aria-hidden="true">
            <Print shot={faith.shot} width={2000} colors={colors} decorative fallback={<HillsArt />} />
          </div>
          <div className="nac-faith-in">
            <p className="nac-kicker">{faith.kicker}</p>
            <h2 className="nac-faith-title" id={uid + "-faith-h"}>
              <Rich text={faith.title} />
            </h2>
            <p className="nac-quote">
              {plain(faith.body)
                .split(/(\s+)/)
                .map((w, i) => (/\s/.test(w) ? w : <span key={i} className="nac-w">{w}</span>))}
            </p>
            <HandsRow buddy={pal.buddy} line="#ffffff" />
            <div className="nac-verses">
              {faith.verses.map((v, i) => (
                <blockquote key={i} className="nac-verse">
                  <p>{v.text}</p>
                  <cite>{v.cite}</cite>
                </blockquote>
              ))}
            </div>
          </div>
          <PageNo n={pageOf("faith")} light />
        </section>
      )}

      {/* 05: get help */}
      <section className="nac-help" data-sec="help" id={uid + "-help"} aria-labelledby={uid + "-help-h"}>
        <div className="nac-help-head" data-rise="">
          <div>
            <p className="nac-kicker">{L.helpKicker}</p>
            <h2 className="nac-h2" id={uid + "-help-h"}>
              <Rich text={L.helpTitle} />
            </h2>
          </div>
          <p>{L.helpBody}</p>
        </div>
        <div className="nac-help-grid">
          {moods.length > 0 && (
            <div className="nac-panel" data-rise="">
              <h3>{L.checkinTitle}</h3>
              <div className="nac-face-wrap">
                <MoodFace value={moodLive} max={maxMood} palette={pal} />
              </div>
              <div
                ref={moodRef}
                className="nac-slider"
                role="slider"
                tabIndex={0}
                aria-label={L.moodScale}
                aria-valuemin={0}
                aria-valuemax={maxMood}
                aria-valuenow={mood}
                aria-valuetext={moodNow.label}
                onPointerDown={(e) => {
                  dragging.current = true
                  e.currentTarget.setPointerCapture(e.pointerId)
                  moodTween.current?.kill()
                  setMoodValue(fromPointer(e), false)
                }}
                onPointerMove={(e) => dragging.current && setMoodValue(fromPointer(e), false)}
                onPointerUp={(e) => {
                  dragging.current = false
                  setMoodValue(fromPointer(e), true)
                }}
                onPointerCancel={() => {
                  dragging.current = false
                  setMoodValue(moodVal.current, true)
                }}
                onKeyDown={(e) => {
                  const n = nextIndex(mood, e.key, moods.length)
                  if (n < 0) return
                  e.preventDefault()
                  setMoodValue(n, true)
                }}
              >
                <span className="nac-slider-track" />
                <span className="nac-slider-fill" style={{ width: (maxMood ? (moodLive / maxMood) * 100 : 50) + "%" }} />
                <span className="nac-slider-dots">
                  {moods.map((_, i) => (
                    <i key={i} />
                  ))}
                </span>
                <span className="nac-slider-thumb" style={{ left: (maxMood ? (moodLive / maxMood) * 100 : 50) + "%" }} />
              </div>
              <div className="nac-mood-label">
                <b>{moodNow.label}</b>
                <span className="nac-panel-hint">{L.checkinHint}</span>
              </div>
              <p className="nac-reply" aria-live="polite">
                {moodNow.reply}
              </p>
              <button type="button" className="nac-act" onClick={() => doAction(moodNow.action)}>
                {moodNow.action === "talk" ? L.actionTalk : moodNow.action === "breathe" ? L.actionBreathe : copied === "checkin" ? L.copied : L.actionReach}
                <Arrow />
              </button>
            </div>
          )}

          <div className="nac-panel" data-rise="">
            <h3>{L.breatheTitle}</h3>
            <p className="nac-panel-hint">{L.breatheBody}</p>
            <div className="nac-breath">
              <span className="nac-breath-ring" aria-hidden="true" />
              <div className="nac-breath-orb" ref={orbRef} aria-hidden="true" />
              <div className="nac-breath-txt" aria-live="polite">
                {breathing ? (
                  <>
                    <b>{breathState.phase === "in" ? L.breatheIn : breathState.phase === "hold" ? L.breatheHold : L.breatheOut}</b>
                    <span>{breathState.left}</span>
                  </>
                ) : (
                  <b>{breath.join(" · ")}</b>
                )}
              </div>
            </div>
            <div className="nac-breath-row">
              <span>{breathing ? Math.min(4, breathState.round + 1) + " / 4" : ""}</span>
              <button type="button" className="nac-act" onClick={() => setBreathing((b) => !b)} aria-pressed={breathing}>
                {breathing ? L.breatheStop : L.breatheStart}
              </button>
            </div>
          </div>

          <div className="nac-panel nac-panel-lines" data-rise="">
            <h3>{L.linesTitle}</h3>
            <ul className="nac-lines">
              {helplines.map((h, i) => (
                <li key={i} className="nac-line" data-urgent={h.urgent ? "" : undefined} data-flash={flash === i ? "" : undefined}>
                  <h4>{h.name}</h4>
                  <p>{h.detail}</p>
                  <div className="nac-line-act">
                    {h.href ? (
                      <a className="nac-num" href={h.href} target={/^https?:/.test(h.href) ? "_blank" : undefined} rel="noreferrer">
                        {h.contact}
                      </a>
                    ) : (
                      <span className="nac-num">{h.contact}</span>
                    )}
                    {h.href && /^tel:/.test(h.href) && (
                      <button
                        type="button"
                        className="nac-copy"
                        onClick={async () => {
                          const ok = await copyText(h.contact)
                          setCopied(ok ? "line" + i : "")
                          setTimeout(() => setCopied(""), 1800)
                        }}
                      >
                        {copied === "line" + i ? L.copied : L.copy}
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <PageNo n={pageOf("help")} />
      </section>

      {/* 06: pass it on */}
      {pledge && (
        <section className="nac-pledge" data-sec="pledge" id={uid + "-pledge"} aria-labelledby={uid + "-pledge-h"}>
          <div className="nac-land" aria-hidden="true">
            <div className="nac-land-move nac-night">
              <Print shot={pledge.shot} width={2000} colors={colors} decorative fallback={<HillsArt />} />
            </div>
          </div>
          <Grain id={uid + "-grain2"} />
          <div className="nac-pledge-card">
            <p className="nac-kicker">{L.pledgeKicker}</p>
            <h2 className="nac-h2" id={uid + "-pledge-h"}>
              <Rich text={pledge.title} />
            </h2>
            <p>{pledged ? pledge.done : pledge.body}</p>
            <div className="nac-crowd" aria-hidden="true">
              {Array.from({ length: crowdSize + (pledged ? 1 : 0) }, (_, i) => (
                <Figure key={i} i={i % 3} color={pledged && i === crowdSize ? pal.label : i % 5 === 2 ? pal.buddy : dark ? "#cfd6e4" : "#3b4a35"} />
              ))}
            </div>
            <div className="nac-pledge-row">
              <button type="button" className="nac-pledge-btn" aria-pressed={pledged} onClick={doPledge}>
                {pledged ? "✓" : <Arrow />} {pledge.cta}
              </button>
              <span className="nac-pledge-count" aria-live="polite">
                {fill(L.pledgeCount, { count: grouped(pledgeTotal) })}
              </span>
            </div>
          </div>
          <PageNo n={pageOf("pledge")} light />
        </section>
      )}

      <footer className="nac-foot">
        <p className="nac-foot-mark" aria-label={hero.kicker + " " + hero.word}>
          <span className="nac-it">{hero.kicker}</span>
          <span className="nac-label">{hero.word}</span>
        </p>
        <div className="nac-foot-row">
          <span>
            {brand.name} {brand.word} / {brand.org}
          </span>
          <nav aria-label={brand.org}>
            {navItems.map((n) => (
              <button key={n.key} type="button" onClick={() => go(n.key)}>
                {n.label}
              </button>
            ))}
            <button type="button" onClick={() => go("home")}>
              {L.footerTop}
            </button>
          </nav>
        </div>
        <p className="nac-foot-row nac-foot-note">{L.footerNote}</p>
      </footer>
    </div>
  )
}
