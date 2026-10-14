"use client"

import * as React from "react"

/*
 * Duotone Team Roster: a "meet the people" section. A heavy display headline
 * sits bottom-left on a burning colour field; beside it, the team hangs in
 * tall columns of portraits that drift slowly in opposite directions. Every
 * photo is pushed through one tritone (shadow, midtone, highlight) built from
 * the palette, so a roster shot on ten different phones reads as one set.
 *
 * The signature: point at, tab to or tap a portrait and it lifts out of the
 * wall, colour bleeds back into it, the rest of the wall sinks into the field,
 * and its small craft chip unfolds into a card with the name, role, one line
 * and a link. The columns hold still while you read.
 *
 * Content, photos, open roles, colours (four presets or your own), column
 * count, drift speed, type and height are all props. Below ~700px the columns
 * become one drifting strip above the headline. Reduced motion keeps the
 * columns staggered and still. A pause button stops the drift at any time.
 */

export type RosterPreset = "ember" | "cobalt" | "moss" | "mono"

export type RosterPalette = {
  /** Darkest colour: the edges of the field and the chips. */
  ground: string
  /** The field between the edge and the glow. */
  deep: string
  /** The hot centre of the field, and the tritone midtone. */
  hot: string
  /** The brightest light in the field. */
  glow: string
  /** Headline, chip text and the CTA fill. */
  ink: string
  /** Tritone shadow and highlight applied to every portrait. */
  shadow: string
  highlight: string
}

export type TeamMember = {
  name: string
  role: string
  /** Short label on the chip ("Colour", "Sound"). Defaults to the role. */
  craft?: string
  /** One line shown when the chip unfolds. */
  bio?: string
  /** Portrait URL. A monogram plate stands in when missing or broken. */
  photo?: string
  /** object-position for the portrait, e.g. "50% 30%". */
  focus?: string
  href?: string
  /** Link text in the unfolded card. Defaults to "Say hello". */
  linkLabel?: string
}

export type OpenRole = {
  title: string
  href: string
  /** Chip label. Defaults to "Hiring". */
  craft?: string
  /** One line under the title. */
  note?: string
  /** Big word in the empty frame. Defaults to "You?". */
  mark?: string
}

export type RosterLink = { label: string; href: string }

export type DuotoneTeamRosterProps = {
  members?: TeamMember[]
  /** Empty frames placed among the portraits, each linking to a job. */
  openRoles?: OpenRole[]
  /** Small display word above the headline. */
  eyebrow?: string
  /** The headline. Use "\n" to break lines; each line is fitted to the column. */
  title?: string
  intro?: string
  cta?: RosterLink | null
  secondaryCta?: RosterLink | null
  preset?: RosterPreset
  /** Overrides any colour of the preset. */
  palette?: Partial<RosterPalette>
  /** Portrait columns on wide screens (2 to 4). Tablets get 2; phones a strip. */
  columns?: number
  /** Seconds a column takes to drift past one portrait. Lower is faster. */
  driftSeconds?: number
  /** Section height on tablet and desktop. A definite length, never a percentage. */
  height?: string
  /** Display face for the headline, eyebrow and monograms. */
  fontFamily?: string
  /** Horizontal stretch of the display face (1 = as drawn). */
  stretch?: number
  uppercase?: boolean
  grain?: boolean
  className?: string
  onMemberSelect?: (member: TeamMember) => void
}

// #region roster-logic
export const PRESETS = {
  ember: { ground: "#170403", deep: "#4f0d06", hot: "#ee7a1c", glow: "#ffb54a", ink: "#fff0c8", shadow: "#260604", highlight: "#ffe2ad" },
  cobalt: { ground: "#03061f", deep: "#0d1c6e", hot: "#2e57f5", glow: "#86a6ff", ink: "#eef1ff", shadow: "#050b33", highlight: "#d9e3ff" },
  moss: { ground: "#061008", deep: "#163519", hot: "#5d8a35", glow: "#c3d66e", ink: "#f3f6dd", shadow: "#08170b", highlight: "#eef3c4" },
  mono: { ground: "#090909", deep: "#262626", hot: "#8c8c8c", glow: "#e0e0e0", ink: "#fafafa", shadow: "#0d0d0d", highlight: "#f4f4f4" },
}

export function resolvePalette(preset: string, overrides: any) {
  const base = PRESETS[preset as keyof typeof PRESETS] || PRESETS.ember
  const out = Object.assign({}, base)
  if (overrides) for (const k of Object.keys(base)) if (overrides[k]) (out as any)[k] = overrides[k]
  return out
}

/** "#f80" or "#ff8800" to [r, g, b] in 0..1, for the SVG tritone tables. */
export function hexToUnit(hex: string) {
  let h = String(hex || "").trim().replace("#", "")
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2]
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return [0, 0, 0]
  return [0, 2, 4].map((i) => Math.round((parseInt(h.slice(i, i + 2), 16) / 255) * 1000) / 1000)
}

/** One feFuncR/G/B table per channel: shadow, midtone, highlight. */
export function tritoneTables(shadow: string, mid: string, highlight: string) {
  const s = hexToUnit(shadow)
  const m = hexToUnit(mid)
  const h = hexToUnit(highlight)
  return [0, 1, 2].map((c) => s[c] + " " + m[c] + " " + h[c])
}

export function initials(name: string) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return "?"
  const first = parts[0][0]
  const last = parts.length > 1 ? parts[parts.length - 1][0] : ""
  return (first + last).toUpperCase()
}

/**
 * Deals the people (and open roles) into columns round-robin, so neighbours
 * differ, then pads short columns with repeats until each holds `minPerColumn`
 * so a drifting loop never shows a gap. Repeats are flagged `dup` and are
 * hidden from assistive tech. Open roles are spread through the deck.
 */
export function dealColumns(count: number, roleCount: number, columns: number, minPerColumn: number) {
  const cols = Math.max(1, Math.floor(columns) || 1)
  const deck: { kind: string; index: number }[] = []
  for (let i = 0; i < count; i++) deck.push({ kind: "member", index: i })
  for (let r = 0; r < roleCount; r++) {
    const at = Math.min(deck.length, Math.round(((r + 1) * (count + roleCount)) / (roleCount + 1)) - 1 + r)
    deck.splice(Math.max(0, at), 0, { kind: "role", index: r })
  }
  const out: { kind: string; index: number; dup: boolean }[][] = []
  for (let c = 0; c < cols; c++) out.push([])
  deck.forEach((d, i) => out[i % cols].push({ kind: d.kind, index: d.index, dup: false }))
  if (!deck.length) return out
  // Pad from the far end of the column furthest away, so a repeat never sits
  // level with the same face in the next column.
  for (let c = 0; c < cols; c++) {
    let from = (c + Math.floor(cols / 2) + (cols % 2 ? 1 : 0)) % cols
    if (cols === 1) from = 0
    const pool = out[from].filter((e) => !e.dup).slice().reverse()
    const rest = deck.map((d) => ({ kind: d.kind, index: d.index, dup: false })).reverse()
    const candidates = pool.concat(rest)
    let k = 0
    let guard = 0
    while (out[c].length < minPerColumn && guard < candidates.length * 3) {
      const d = candidates[k % candidates.length]
      k++
      guard++
      const clash = out[c].some((e) => e.kind === d.kind && e.index === d.index)
      if (clash && guard < candidates.length) continue
      out[c].push({ kind: d.kind, index: d.index, dup: true })
    }
  }
  return out
}

/** Font size that makes the widest headline line fill `available` px. */
export function fitTitleSize(available: number, widestAt100: number, stretch: number, min: number, max: number) {
  if (!(available > 0) || !(widestAt100 > 0)) return min
  const size = (available / (widestAt100 * (stretch > 0 ? stretch : 1))) * 100
  return Math.max(min, Math.min(max, Math.floor(size * 10) / 10))
}

/** Layout for a container width: a strip on phones, 2 columns on tablets. */
export function layoutFor(width: number, columns: number) {
  if (width > 0 && width < 700) return 0
  const wanted = Math.max(2, Math.min(4, Math.round(columns) || 3))
  if (width > 0 && width < 1000) return 2
  return wanted
}

export function splitLines(title: string) {
  return String(title || "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
}
// #endregion roster-logic

const U = "https://images.unsplash.com/"
const Q = "?auto=format&fit=crop&w=720&h=960&q=80"

export const DEFAULT_MEMBERS: TeamMember[] = [
  { name: "Priya Nair", role: "Supervising colourist", craft: "Colour", bio: "Grades every feature that leaves the building. Prefers film emulation to LUTs.", photo: U + "photo-1494790108377-be9c29b29330" + Q, focus: "50% 30%", href: "mailto:priya@foxglove-post.example" },
  { name: "Daniel Osei", role: "Head of sound", craft: "Sound", bio: "Mixes in Atmos, then checks every reel on a pair of tired laptop speakers.", photo: U + "photo-1507003211169-0a1dd7228f2d" + Q, focus: "50% 30%", href: "mailto:daniel@foxglove-post.example" },
  { name: "Ellie Marsh", role: "Offline editor", craft: "Edit", bio: "Cuts long-form documentary. Asks what the film is about before opening the timeline.", photo: U + "photo-1438761681033-6461ffad8d80" + Q, focus: "50% 35%", href: "mailto:ellie@foxglove-post.example" },
  { name: "Marcus Bell", role: "VFX supervisor", craft: "VFX", bio: "Fixes what the shoot could not: skies, rigs, the boom that dipped into frame.", photo: U + "photo-1500648767791-00dcc994a43e" + Q, focus: "50% 30%", href: "mailto:marcus@foxglove-post.example" },
  { name: "Hannah Cole", role: "Post producer", craft: "Production", bio: "Keeps schedules, budgets and deliverables honest from first call to final QC.", photo: U + "photo-1544005313-94ddf0286df2" + Q, focus: "50% 30%", href: "mailto:hannah@foxglove-post.example" },
  { name: "Graham Whitlock", role: "Online editor", craft: "Finishing", bio: "Conforms, masters and delivers to whatever spec a broadcaster invents next.", photo: U + "photo-1472099645785-5658abf4ff4e" + Q, focus: "50% 30%", href: "mailto:graham@foxglove-post.example" },
  { name: "Mira Kowalczyk", role: "Motion designer", craft: "Motion", bio: "Titles, maps and the end credits nobody notices until they are wrong.", photo: U + "photo-1517841905240-472988babdf9" + Q, focus: "50% 30%", href: "mailto:mira@foxglove-post.example" },
  { name: "Jules Okafor", role: "Dialogue editor", craft: "Dialogue", bio: "Rebuilds noisy location sound one syllable at a time.", photo: U + "photo-1506794778202-cad84cf45f1d" + Q, focus: "50% 30%", href: "mailto:jules@foxglove-post.example" },
  { name: "Sam Lindqvist", role: "Assistant colourist", craft: "Colour", bio: "Matches cameras, preps the grade and runs the dailies every morning.", photo: U + "photo-1502823403499-6ccfcf4fb453" + Q, focus: "50% 30%", href: "mailto:sam@foxglove-post.example" },
  { name: "Noa Brandt", role: "Studio manager", craft: "Studio", bio: "Runs the suites, the kit room and, under protest, the coffee rota.", photo: U + "photo-1524504388940-b1c1722653e1" + Q, focus: "50% 30%", href: "mailto:noa@foxglove-post.example" },
]

const DISPLAY_STACK = '"Arial Black", "Archivo Black", "Helvetica Neue", Inter, "Segoe UI", system-ui, sans-serif'

const css = `
.dtr{position:relative;isolation:isolate;overflow:hidden;width:100%;container-type:inline-size;color:var(--dtr-ink);background:var(--dtr-ground);font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;-webkit-font-smoothing:antialiased;--dtr-ease:cubic-bezier(.23,1,.32,1);--dtr-gap:14px;--dtr-pad:clamp(20px,3.2cqw,48px)}
.dtr *,.dtr *::before,.dtr *::after{box-sizing:border-box}
.dtr-field{position:absolute;inset:0;z-index:-2;background:radial-gradient(70% 62% at 34% 36%,var(--dtr-glow) 0%,var(--dtr-hot) 26%,color-mix(in srgb,var(--dtr-hot) 55%,var(--dtr-deep)) 48%,transparent 78%),radial-gradient(60% 90% at 78% 30%,color-mix(in srgb,var(--dtr-hot) 70%,var(--dtr-deep)) 0%,transparent 70%),linear-gradient(98deg,var(--dtr-ground) 0%,var(--dtr-deep) 16%,transparent 42%),linear-gradient(0deg,var(--dtr-ground) 0%,color-mix(in srgb,var(--dtr-deep) 85%,transparent) 30%,transparent 62%),var(--dtr-deep)}
.dtr-grain{position:absolute;inset:-50%;z-index:-1;pointer-events:none;opacity:.2;mix-blend-mode:overlay;background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 1.6 -.35'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");background-size:220px 220px}
.dtr-defs{position:absolute;width:0;height:0;overflow:hidden;pointer-events:none}
.dtr-in{position:relative;display:grid;grid-template-columns:minmax(0,42fr) minmax(0,58fr);height:100%}
.dtr-copy{position:relative;z-index:2;display:flex;flex-direction:column;justify-content:flex-end;padding:var(--dtr-pad);padding-right:clamp(16px,2cqw,32px);min-width:0}
.dtr-title{margin:0;font-family:var(--dtr-display);font-weight:900;line-height:.84;letter-spacing:-.035em;color:var(--dtr-ink);font-size:var(--dtr-ts,120px);text-transform:var(--dtr-case)}
.dtr-eyebrow{display:block;font-size:.36em;line-height:1;letter-spacing:-.01em;margin:0 0 .16em .02em;transform:scaleX(var(--dtr-stretch));transform-origin:0 50%;white-space:nowrap}
.dtr-line{display:block;overflow:hidden;padding-bottom:.04em;margin-bottom:-.04em}
.dtr-line>span{display:inline-block;white-space:nowrap;transform:scaleX(var(--dtr-stretch));transform-origin:0 50%}
.dtr-line>span>span{display:inline-block;animation:dtr-line-in 900ms var(--dtr-ease) both;animation-delay:calc(120ms + var(--i,0) * 70ms)}
.dtr-intro{margin:clamp(18px,2.2cqw,28px) 0 0;max-width:38ch;font-size:clamp(15px,1.15cqw,17px);line-height:1.55;color:color-mix(in srgb,var(--dtr-ink) 86%,transparent);text-wrap:pretty}
.dtr-actions{display:flex;flex-wrap:wrap;align-items:center;gap:12px 22px;margin-top:clamp(20px,2.4cqw,30px)}
.dtr-cta{position:relative;display:inline-flex;align-items:center;gap:12px;height:46px;padding:0 18px 0 20px;border-radius:3px;background:var(--dtr-ink);color:var(--dtr-ground);font-size:13px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;text-decoration:none;overflow:hidden;transition:transform 160ms var(--dtr-ease),background-color 220ms ease;outline:none}
.dtr-cta-label{position:relative;display:inline-block;overflow:hidden;height:1.2em;line-height:1.2em}
.dtr-cta-label>span{display:block;transition:transform 380ms var(--dtr-ease)}
.dtr-cta-arrow{display:inline-block;transition:transform 380ms var(--dtr-ease)}
.dtr-cta:active{transform:scale(.97)}
.dtr-cta:focus-visible,.dtr-link:focus-visible,.dtr-pause:focus-visible,.dtr-panel a:focus-visible{outline:2px solid var(--dtr-ink);outline-offset:3px}
.dtr-link{color:var(--dtr-ink);font-size:14px;font-weight:600;text-decoration:underline;text-decoration-thickness:1px;text-underline-offset:5px;transition:text-underline-offset 220ms var(--dtr-ease),opacity 200ms ease;outline:none}
.dtr-wall{position:relative;z-index:1;display:grid;grid-template-columns:repeat(var(--dtr-cols),minmax(0,1fr));gap:var(--dtr-gap);padding:0 var(--dtr-pad) 0 clamp(8px,1cqw,16px);height:100%;overflow:hidden;-webkit-mask-image:linear-gradient(180deg,transparent 0,#000 5%,#000 95%,transparent 100%);mask-image:linear-gradient(180deg,transparent 0,#000 5%,#000 95%,transparent 100%)}
.dtr-col{position:relative;min-width:0;animation:dtr-rise 1100ms var(--dtr-ease) both;animation-delay:calc(var(--ci) * 90ms)}
.dtr-track{display:flex;flex-direction:column;will-change:transform;transition:translate 480ms var(--dtr-ease);animation:dtr-up var(--dtr-dur) linear infinite;animation-delay:var(--dtr-phase)}
.dtr-col[data-dir="down"] .dtr-track{animation-name:dtr-down}
.dtr[data-paused] .dtr-track,.dtr[data-active] .dtr-track,.dtr[data-offscreen] .dtr-track,.dtr-wall:focus-within .dtr-track,.dtr[data-paused] .dtr-strip-track,.dtr[data-active] .dtr-strip-track,.dtr[data-offscreen] .dtr-strip-track,.dtr-strip:focus-within .dtr-strip-track{animation-play-state:paused}
.dtr-card{position:relative;margin:0 0 var(--dtr-gap);aspect-ratio:3/4;border-radius:3px;outline:none;cursor:pointer;transition:transform 420ms var(--dtr-ease),box-shadow 420ms var(--dtr-ease);-webkit-tap-highlight-color:transparent}
.dtr-photo{position:absolute;inset:0;overflow:hidden;border-radius:3px;background:var(--dtr-deep);transition:opacity 420ms ease,filter 420ms ease}
.dtr-photo img{position:absolute;inset:0;display:block;width:100%;height:100%;max-width:none;object-fit:cover}
.dtr-true{opacity:0;transition:opacity 520ms ease}
.dtr-plate{position:absolute;inset:0;display:grid;place-items:center;background:radial-gradient(90% 70% at 50% 35%,var(--dtr-hot),var(--dtr-deep) 70%,var(--dtr-ground));font-family:var(--dtr-display);font-weight:900;color:var(--dtr-ink);font-size:clamp(40px,7cqw,96px);letter-spacing:-.04em}
.dtr-plate span{transform:scaleX(var(--dtr-stretch))}
.dtr-plate{grid-template-rows:1fr auto 1fr}.dtr-plate span{grid-row:2}
.dtr-plate em{grid-row:3;align-self:start;margin-top:.9em;max-width:80%;font:700 12px/1.35 ui-sans-serif,system-ui,sans-serif;letter-spacing:.04em;text-transform:uppercase;font-style:normal;text-align:center;color:color-mix(in srgb,var(--dtr-ink) 78%,transparent)}
.dtr-role .dtr-plate{background:repeating-linear-gradient(135deg,transparent 0 10px,color-mix(in srgb,var(--dtr-ink) 9%,transparent) 10px 11px),radial-gradient(90% 70% at 50% 30%,color-mix(in srgb,var(--dtr-hot) 70%,var(--dtr-deep)),var(--dtr-ground) 85%);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--dtr-ink) 28%,transparent);font-size:clamp(34px,5.2cqw,76px)}
.dtr-chip,.dtr-panel{position:absolute;left:12px;bottom:12px;background:color-mix(in srgb,var(--dtr-ground) 92%,transparent);color:var(--dtr-ink);border-radius:3px}
.dtr-chip{padding:8px 10px 7px;font-size:11px;font-weight:700;line-height:1;letter-spacing:.06em;text-transform:uppercase;white-space:nowrap;max-width:calc(100% - 24px);overflow:hidden;text-overflow:ellipsis;transition:opacity 160ms ease}
.dtr-panel{right:12px;padding:12px 14px 13px;clip-path:inset(calc(100% - 26px) calc(100% - var(--dtr-cw)) 0 0 round 3px);opacity:0;transition:clip-path 360ms var(--dtr-ease),opacity 140ms ease 220ms;pointer-events:none}
.dtr-panel-craft{display:block;font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:color-mix(in srgb,var(--dtr-ink) 70%,transparent);margin-bottom:8px}
.dtr-name{margin:0;font-size:clamp(16px,1.25cqw,19px);font-weight:800;line-height:1.15;letter-spacing:-.01em}
.dtr-roleline{margin:3px 0 0;font-size:13px;line-height:1.35;color:color-mix(in srgb,var(--dtr-ink) 78%,transparent)}
.dtr-bio{margin:8px 0 0;font-size:13px;line-height:1.45;color:color-mix(in srgb,var(--dtr-ink) 90%,transparent)}
.dtr-panel a{display:inline-flex;align-items:center;gap:6px;margin-top:10px;color:var(--dtr-ink);font-size:13px;font-weight:700;text-decoration:underline;text-decoration-thickness:1px;text-underline-offset:4px;outline:none}
.dtr-panel a span{display:inline-block;transition:transform 260ms var(--dtr-ease)}
.dtr-card[data-on]{z-index:3;transform:translateY(-6px) scale(1.02);box-shadow:0 24px 50px -18px color-mix(in srgb,var(--dtr-ground) 85%,transparent)}
.dtr-card[data-on] .dtr-true{opacity:.74}
.dtr-card[data-on] .dtr-chip{opacity:0;transition-duration:90ms}
.dtr-card[data-on] .dtr-panel{clip-path:inset(0 0 0 0 round 3px);opacity:1;pointer-events:auto;transition:clip-path 460ms var(--dtr-ease),opacity 80ms ease}
.dtr[data-active] .dtr-card:not([data-on]) .dtr-photo{opacity:.42;filter:saturate(.7)}
.dtr[data-active] .dtr-card:not([data-on]) .dtr-chip{opacity:.5}
.dtr-card:focus-visible{box-shadow:0 0 0 2px var(--dtr-ground),0 0 0 4px var(--dtr-ink)}
.dtr-pause{margin-left:auto;box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--dtr-ink) 32%,transparent);display:inline-flex;align-items:center;gap:8px;height:32px;padding:0 12px;border:0;border-radius:3px;background:color-mix(in srgb,var(--dtr-ground) 88%,transparent);color:var(--dtr-ink);font:700 11px/1 ui-sans-serif,system-ui,sans-serif;letter-spacing:.06em;text-transform:uppercase;cursor:pointer;transition:transform 160ms var(--dtr-ease),background-color 200ms ease;outline:none}
.dtr-pause:active{transform:scale(.96)}
.dtr-pause i{display:inline-block;width:8px;height:9px;border-left:3px solid currentColor;border-right:3px solid currentColor}
.dtr[data-paused] .dtr-pause i{border-right:0;border-left:8px solid currentColor;border-top:4.5px solid transparent;border-bottom:4.5px solid transparent;width:0;height:0}
.dtr-strip{display:none}
.dtr[data-mode="strip"] .dtr-in{display:flex;flex-direction:column;height:auto}
.dtr[data-mode="strip"] .dtr-wall{display:none}
.dtr[data-mode="strip"] .dtr-strip{display:block;position:relative;order:-1;overflow:hidden;padding:20px 0 4px;-webkit-mask-image:linear-gradient(90deg,transparent 0,#000 6%,#000 94%,transparent 100%);mask-image:linear-gradient(90deg,transparent 0,#000 6%,#000 94%,transparent 100%)}
.dtr-strip-track{display:flex;width:max-content;will-change:transform;transition:translate 480ms var(--dtr-ease);animation:dtr-left var(--dtr-sdur) linear infinite}
.dtr-strip .dtr-card{width:clamp(170px,56cqw,250px);margin:0 10px 0 0;flex:none}
.dtr[data-mode="strip"] .dtr-copy{padding:18px 20px 28px}
@keyframes dtr-up{from{transform:translate3d(0,0,0)}to{transform:translate3d(0,-50%,0)}}
@keyframes dtr-down{from{transform:translate3d(0,-50%,0)}to{transform:translate3d(0,0,0)}}
@keyframes dtr-left{from{transform:translate3d(0,0,0)}to{transform:translate3d(-50%,0,0)}}
@keyframes dtr-rise{from{opacity:0;transform:translate3d(0,56px,0)}to{opacity:1;transform:none}}
@keyframes dtr-line-in{from{transform:translate3d(0,104%,0)}to{transform:none}}
@media (hover:hover) and (pointer:fine){
.dtr-cta:hover .dtr-cta-label>span{transform:translateY(-100%)}
.dtr-cta:hover .dtr-cta-arrow{transform:translateX(4px)}
.dtr-link:hover{text-underline-offset:8px}
.dtr-panel a:hover span{transform:translate(2px,-2px)}
.dtr-pause:hover{background:var(--dtr-ground)}
}
@media (prefers-reduced-motion:reduce){
.dtr-track,.dtr-strip-track{animation:none;transform:translate3d(0,calc(-50% * var(--dtr-rest,0)),0)}
.dtr-strip-track{transform:none}
.dtr-col,.dtr-line>span>span{animation:none}
.dtr-card,.dtr-panel,.dtr-cta-label>span,.dtr-cta-arrow{transition-duration:1ms}
.dtr-card[data-on]{transform:none}
.dtr-pause{display:none}
}
`

type Slot =
  | { key: string; kind: "member"; member: TeamMember; dup: boolean }
  | { key: string; kind: "role"; role: OpenRole; dup: boolean }

/** Nudges a drifting column (or the phone strip) so a focused card is fully visible. */
function bringIntoView(card: HTMLElement) {
  const frame = card.closest(".dtr-wall, .dtr-strip") as HTMLElement | null
  const track = card.closest(".dtr-track, .dtr-strip-track") as HTMLElement | null
  if (!frame || !track) return
  const f = frame.getBoundingClientRect()
  const r = card.getBoundingClientRect()
  const vertical = track.classList.contains("dtr-track")
  const parts = (track.style.translate || "0px 0px").split(" ")
  let x = parseFloat(parts[0]) || 0
  let y = parseFloat(parts[1] || "0") || 0
  const m = 24
  if (vertical) {
    if (r.top < f.top + m) y += f.top + m - r.top
    else if (r.bottom > f.bottom - m) y -= r.bottom - (f.bottom - m)
  } else {
    if (r.left < f.left + m) x += f.left + m - r.left
    else if (r.right > f.right - m) x -= r.right - (f.right - m)
  }
  track.style.translate = Math.round(x) + "px " + Math.round(y) + "px"
}

function Portrait(props: {
  slot: Slot
  on: boolean
  filterId: string
  onEnter: (key: string) => void
  onLeave: (key: string) => void
  onToggle: (key: string) => void
  onSelect?: (member: TeamMember) => void
}) {
  const { slot, on, filterId, onEnter, onLeave, onToggle, onSelect } = props
  const [failed, setFailed] = React.useState(false)
  const pointer = React.useRef("mouse")
  const hidden = slot.dup
  const isRole = slot.kind === "role"
  const member = slot.kind === "member" ? slot.member : null
  const role = slot.kind === "role" ? slot.role : null
  const craft = member ? member.craft || member.role : role ? role.craft || "Hiring" : ""
  const label = member ? member.name + ", " + member.role : role ? "Open role: " + role.title : ""
  const photo = member && member.photo && !failed ? member.photo : ""
  const href = member ? member.href : role ? role.href : undefined
  const linkLabel = member ? member.linkLabel || "Say hello" : "See the role"

  return (
    <article
      className={"dtr-card" + (isRole ? " dtr-role" : "")}
      data-on={on ? "" : undefined}
      tabIndex={hidden ? -1 : 0}
      aria-hidden={hidden ? true : undefined}
      aria-label={label}
      aria-expanded={hidden ? undefined : on}
      style={{ ["--dtr-cw" as any]: Math.min(26, craft.length) * 0.74 + 2.2 + "em" }}
      onPointerDown={(e) => {
        pointer.current = e.pointerType
      }}
      onPointerEnter={(e) => {
        if (e.pointerType === "mouse") onEnter(slot.key)
      }}
      onPointerLeave={(e) => {
        if (e.pointerType === "mouse") onLeave(slot.key)
      }}
      onFocus={(e) => {
        const el = e.currentTarget as HTMLElement
        // Pointer focus is handled by hover and tap; only keyboard focus unfolds here.
        if (e.target === el && !el.matches(":focus-visible")) return
        onEnter(slot.key)
        bringIntoView(el)
      }}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) onLeave(slot.key)
      }}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest("a")) return
        if (member && onSelect) onSelect(member)
        if (pointer.current !== "mouse") {
          if (!on) bringIntoView(e.currentTarget as HTMLElement)
          onToggle(slot.key)
        }
      }}
      onKeyDown={(e) => {
        if (e.target !== e.currentTarget) {
          if (e.key === "Escape") (e.currentTarget as HTMLElement).focus()
          return
        }
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          if (member && onSelect) onSelect(member)
          const a = e.currentTarget.querySelector("a")
          if (a) a.focus()
        } else if (e.key === "Escape") {
          ;(e.currentTarget as HTMLElement).blur()
        }
      }}
    >
      <div className="dtr-photo">
        {photo ? (
          <>
            <img
              className="dtr-duo"
              src={photo}
              alt=""
              width={720}
              height={960}
              loading="lazy"
              decoding="async"
              draggable={false}
              style={{ filter: "url(#" + filterId + ")", objectPosition: (member && member.focus) || "50% 30%" }}
              onError={() => setFailed(true)}
            />
            <img
              className="dtr-true"
              src={photo}
              alt=""
              width={720}
              height={960}
              loading="lazy"
              decoding="async"
              draggable={false}
              style={{ objectPosition: (member && member.focus) || "50% 30%" }}
            />
          </>
        ) : (
          <div className="dtr-plate" aria-hidden="true">
            <span>{member ? initials(member.name) : (role && role.mark) || "You?"}</span>
            {role ? <em>{role.title}</em> : null}
          </div>
        )}
      </div>
      <span className="dtr-chip" aria-hidden="true">
        {craft}
      </span>
      <div className="dtr-panel">
        <span className="dtr-panel-craft" aria-hidden="true">
          {craft}
        </span>
        <p className="dtr-name">{member ? member.name : role ? role.title : ""}</p>
        <p className="dtr-roleline">{member ? member.role : role ? role.note || "We are hiring" : ""}</p>
        {member && member.bio ? <p className="dtr-bio">{member.bio}</p> : null}
        {href ? (
          <a href={href} tabIndex={hidden || !on ? -1 : 0} onClick={(e) => e.stopPropagation()}>
            {linkLabel} <span aria-hidden="true">↗</span>
          </a>
        ) : null}
      </div>
    </article>
  )
}

export default function DuotoneTeamRoster({
  members = DEFAULT_MEMBERS,
  openRoles = [],
  eyebrow = "Meet",
  title = "The\ncrew",
  intro = "Ten editors, colourists and sound people finishing features, series and ads in a converted print works in Leeds.",
  cta = { label: "Start a project", href: "#contact" },
  secondaryCta = null,
  preset = "ember",
  palette,
  columns = 3,
  driftSeconds = 9,
  height = "100svh",
  fontFamily = DISPLAY_STACK,
  stretch = 1.16,
  uppercase = true,
  grain = true,
  className = "",
  onMemberSelect,
}: DuotoneTeamRosterProps) {
  const pal = resolvePalette(preset, palette)
  const rawId = React.useId()
  const uid = "dtr" + rawId.replace(/[^a-zA-Z0-9]/g, "")
  const filterId = uid + "-tone"
  const titleId = uid + "-title"
  const rootRef = React.useRef(null as HTMLElement | null)
  const copyRef = React.useRef(null as HTMLDivElement | null)
  const titleRef = React.useRef(null as HTMLHeadingElement | null)
  const [cols, setCols] = React.useState(layoutFor(0, columns))
  const [titleSize, setTitleSize] = React.useState(0)
  const [active, setActive] = React.useState(null as string | null)
  const [paused, setPaused] = React.useState(false)
  const [offscreen, setOffscreen] = React.useState(false)

  const lines = splitLines(title)
  const tables = tritoneTables(pal.shadow, pal.hot, pal.highlight)
  const [minPer, setMinPer] = React.useState(4)
  const plan = React.useMemo(
    () => dealColumns(members.length, openRoles.length, cols || 1, cols ? minPer : 0),
    [members.length, openRoles.length, cols, minPer],
  )

  const slotFor = (e: { kind: string; index: number; dup: boolean }, prefix: string): Slot =>
    e.kind === "role"
      ? { key: prefix, kind: "role", role: openRoles[e.index], dup: e.dup }
      : { key: prefix, kind: "member", member: members[e.index], dup: e.dup }

  // Measure the container: choose the layout and fit the headline to its column.
  React.useLayoutEffect(() => {
    const root = rootRef.current
    const copy = copyRef.current
    const head = titleRef.current
    if (!root || !copy || !head) return
    const fit = () => {
      const w = root.getBoundingClientRect().width
      const next = layoutFor(w, columns)
      setCols((c) => (c === next ? c : next))
      const spans = head.querySelectorAll(".dtr-line > span")
      let widest = 0
      const cur = parseFloat(getComputedStyle(head).fontSize) || 100
      spans.forEach((s) => {
        widest = Math.max(widest, (s as HTMLElement).offsetWidth)
      })
      const widestAt100 = (widest / cur) * 100
      const cs = getComputedStyle(copy)
      const avail = copy.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight)
      const h = root.getBoundingClientRect().height
      const strip = next === 0
      // Enough portraits per column that one loop is taller than the wall.
      if (next > 0) {
        const wallW = root.getBoundingClientRect().width * 0.58
        const cardH = ((wallW - 14 * (next + 1)) / next) * (4 / 3) + 14
        const need = Math.max(3, Math.ceil(h / Math.max(80, cardH)))
        setMinPer((m) => (m === need ? m : need))
      }
      const maxByHeight = strip ? 200 : Math.max(56, (h * 0.5) / Math.max(1, lines.length + 0.45))
      setTitleSize(fitTitleSize(avail, widestAt100, stretch, 40, Math.min(260, maxByHeight)))
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(root)
    return () => ro.disconnect()
  }, [columns, stretch, title, fontFamily, uppercase, lines.length])

  // Stop drifting while nobody can see it.
  React.useEffect(() => {
    const root = rootRef.current
    if (!root || typeof IntersectionObserver === "undefined") return
    const io = new IntersectionObserver(([entry]) => setOffscreen(!entry.isIntersecting), { threshold: 0 })
    io.observe(root)
    const vis = () => setOffscreen(document.hidden)
    document.addEventListener("visibilitychange", vis)
    return () => {
      io.disconnect()
      document.removeEventListener("visibilitychange", vis)
    }
  }, [])

  const onEnter = React.useCallback((key: string) => setActive(key), [])
  const onLeave = React.useCallback((key: string) => setActive((a) => (a === key ? null : a)), [])
  const onToggle = React.useCallback((key: string) => setActive((a) => (a === key ? null : key)), [])

  // Tap outside an unfolded card folds it again.
  React.useEffect(() => {
    if (!active) return
    const down = (e: PointerEvent) => {
      if (e.pointerType === "mouse") return
      const t = e.target as HTMLElement | null
      if (!t || !t.closest || !t.closest(".dtr-card")) setActive(null)
    }
    document.addEventListener("pointerdown", down)
    return () => document.removeEventListener("pointerdown", down)
  }, [active])

  const rootStyle = {
    ["--dtr-ground" as any]: pal.ground,
    ["--dtr-deep" as any]: pal.deep,
    ["--dtr-hot" as any]: pal.hot,
    ["--dtr-glow" as any]: pal.glow,
    ["--dtr-ink" as any]: pal.ink,
    ["--dtr-display" as any]: fontFamily,
    ["--dtr-stretch" as any]: String(stretch),
    ["--dtr-case" as any]: uppercase ? "uppercase" : "none",
    ["--dtr-cols" as any]: String(cols || 1),
    ["--dtr-ts" as any]: titleSize ? titleSize + "px" : undefined,
    ["--dtr-sdur" as any]: Math.max(8, (members.length + openRoles.length) * driftSeconds * 0.55) + "s",
    height: cols === 0 ? "auto" : height,
    minHeight: cols === 0 ? undefined : "600px",
    visibility: titleSize ? undefined : ("hidden" as const),
  } as React.CSSProperties

  const pauseButton = (
    <button
      type="button"
      className="dtr-pause"
      aria-pressed={paused}
      onClick={() => setPaused((p) => !p)}
    >
      <i aria-hidden="true" />
      {paused ? "Play" : "Pause"}
    </button>
  )

  const phases = [0, 0.38, 0.71, 0.18]

  return (
    <section
      ref={rootRef}
      className={"dtr " + className}
      style={rootStyle}
      aria-labelledby={titleId}
      data-mode={cols === 0 ? "strip" : "columns"}
      data-active={active ? "" : undefined}
      data-paused={paused ? "" : undefined}
      data-offscreen={offscreen ? "" : undefined}
    >
      <style>{css}</style>
      <svg className="dtr-defs" aria-hidden="true" focusable="false">
        <filter id={filterId} colorInterpolationFilters="sRGB">
          <feColorMatrix type="matrix" values="0.2126 0.7152 0.0722 0 0  0.2126 0.7152 0.0722 0 0  0.2126 0.7152 0.0722 0 0  0 0 0 1 0" />
          <feComponentTransfer>
            <feFuncR type="table" tableValues="0 0.06 0.5 0.94 1" />
            <feFuncG type="table" tableValues="0 0.06 0.5 0.94 1" />
            <feFuncB type="table" tableValues="0 0.06 0.5 0.94 1" />
          </feComponentTransfer>
          <feComponentTransfer>
            <feFuncR type="table" tableValues={tables[0]} />
            <feFuncG type="table" tableValues={tables[1]} />
            <feFuncB type="table" tableValues={tables[2]} />
          </feComponentTransfer>
        </filter>
      </svg>
      <div className="dtr-field" aria-hidden="true" />
      {grain ? <div className="dtr-grain" aria-hidden="true" /> : null}

      <div className="dtr-in">
        <div className="dtr-copy" ref={copyRef}>
          <h2 className="dtr-title" id={titleId} ref={titleRef}>
            {eyebrow ? <span className="dtr-eyebrow">{eyebrow} </span> : null}
            {lines.map((l, i) => (
              <span className="dtr-line" key={i} style={{ ["--i" as any]: i }}>
                <span>
                  <span>{l}</span>
                </span>
                {i < lines.length - 1 ? " " : null}
              </span>
            ))}
          </h2>
          {intro ? <p className="dtr-intro">{intro}</p> : null}
          {
            <div className="dtr-actions">
              {cta ? (
                <a className="dtr-cta" href={cta.href}>
                  <span className="dtr-cta-label">
                    <span>{cta.label}</span>
                    <span aria-hidden="true">{cta.label}</span>
                  </span>
                  <span className="dtr-cta-arrow" aria-hidden="true">
                    →
                  </span>
                </a>
              ) : null}
              {secondaryCta ? (
                <a className="dtr-link" href={secondaryCta.href}>
                  {secondaryCta.label}
                </a>
              ) : null}
              {pauseButton}
            </div>
          }
        </div>

        {cols === 0 ? (
          <div className="dtr-strip">
            <div className="dtr-strip-track">
              {[0, 1].map((copy) =>
                plan[0].map((e, i) => {
                  const slot = slotFor({ ...e, dup: e.dup || copy === 1 }, "s" + copy + "-" + i)
                  return (
                    <Portrait
                      key={slot.key}
                      slot={slot}
                      on={active === slot.key}
                      filterId={filterId}
                      onEnter={onEnter}
                      onLeave={onLeave}
                      onToggle={onToggle}
                      onSelect={onMemberSelect}
                    />
                  )
                }),
              )}
            </div>
          </div>
        ) : (
          <div className="dtr-wall" role="list" aria-label="Team">
            {plan.map((col, c) => {
              const dur = Math.max(6, col.length * driftSeconds)
              const phase = phases[c % phases.length]
              return (
                <div
                  className="dtr-col"
                  key={c}
                  role="presentation"
                  data-dir={c % 2 ? "down" : "up"}
                  style={{
                    ["--ci" as any]: c,
                    ["--dtr-dur" as any]: dur + "s",
                    ["--dtr-phase" as any]: -(dur * phase) + "s",
                    ["--dtr-rest" as any]: c % 2 ? 1 - phase : phase,
                  }}
                >
                  <div className="dtr-track">
                    {[0, 1].map((copy) =>
                      col.map((e, i) => {
                        const slot = slotFor({ ...e, dup: e.dup || copy === 1 }, c + "-" + copy + "-" + i)
                        return (
                          <div role={slot.dup ? undefined : "listitem"} key={slot.key}>
                            <Portrait
                              slot={slot}
                              on={active === slot.key}
                              filterId={filterId}
                              onEnter={onEnter}
                              onLeave={onLeave}
                              onToggle={onToggle}
                              onSelect={onMemberSelect}
                            />
                          </div>
                        )
                      }),
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
