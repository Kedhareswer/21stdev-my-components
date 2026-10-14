"use client"

// Hitch Cargo Landing — a complete landing page for a modular electric cargo
// bike, laid out like a parts catalogue on charcoal sheets.
//
// The product is one bare longtail frame with four mounts (rear deck, sides,
// front rack, power). The hero is a carousel of builds: the frame stays put
// and the parts lift off and drop on, each with a part-number callout. The
// same drawing runs the configurator below (live price, weight and range,
// one part per mount), a dimensioned spec sheet, the ownership steps, rider
// notes, a reservation form that never asks for a card, an FAQ and a footer.
//
// Every bike is drawn in this file as a side elevation, so frame one is
// finished with no network. Any build can show a photo instead (`image`).
// Copy, parts, prices, colours and the whole content set are props; the
// "fleet" preset turns it into a delivery-fleet company.
import * as React from "react"

/* ------------------------------------------------------------------ types */

export type HitchModuleId = "seat" | "footboards" | "flatbed" | "panniers" | "toolbox" | "box" | "basket" | "battery"
export type HitchMount = "rear" | "side" | "front" | "power"
export type HitchModule = {
  name: string
  /** Part number printed on the callout tag. */
  code: string
  mount: HitchMount
  price: number
  /** Kilograms added. */
  weight: number
  /** Kilometres of range added (negative for weight that costs range). */
  range: number
  note: string
}
export type HitchModuleCatalog = { [K in HitchModuleId]: HitchModule }
export type HitchBuild = {
  id: string
  /** Caption under the carousel, e.g. "The school run". Set in caps. */
  caption: string
  /** The grey second half of the headline for this build. */
  tail: string
  modules: HitchModuleId[]
  /** A photo URL that replaces the drawing for this build. */
  image?: string
  imageAlt?: string
}
export type HitchLink = { label: string; href: string }
export type HitchSpec = { label: string; value: string }
export type HitchStep = { title: string; body: string; time: string }
export type HitchRider = { name: string; place: string; build: string; distance: string; quote: string }
export type HitchFaq = { q: string; a: string }
export type HitchColumn = { title: string; links: HitchLink[] }
export type HitchPreset = "signal" | "fleet"
export type HitchReservation = {
  name: string
  email: string
  city: string
  testRide: boolean
  modules: HitchModuleId[]
  total: number
  code: string
}
export type HitchBase = { price: number; weight: number; range: number; maxLoad: number }
export type HitchDimensions = { length: string; wheelbase: string; height: string; deck: string }

export type HitchHeroCopy = { lead: string; body: string; buildLabel: string }
export type HitchSectionCopy = { title: string; intro: string }
export type HitchSpecsCopy = { title: string; intro: string; rows: HitchSpec[]; dimensions: HitchDimensions }
export type HitchOwnershipCopy = { title: string; intro: string; steps: HitchStep[] }
export type HitchRidersCopy = { title: string; items: HitchRider[] }
export type HitchReserveCopy = {
  title: string
  body: string
  cities: string[]
  button: string
  fineprint: string
  /** Shown after submit, e.g. when the next batch opens. */
  batch: string
  /** The opt-in checkbox label, and the line added to the confirmation when it is ticked. */
  checkbox: string
  checkboxNote: string
  /** Confirmation heading; "{name}" is replaced with the first name. */
  doneTitle: string
}
export type HitchFaqCopy = { title: string; items: HitchFaq[] }
export type HitchFooterCopy = { tagline: string; columns: HitchColumn[]; legal: string }
export type HitchModulePatch = { name?: string; code?: string; mount?: HitchMount; price?: number; weight?: number; range?: number; note?: string }

export type HitchCargoLandingProps = {
  preset?: HitchPreset
  brand?: string
  /** Signal colour: the reserve button, the current tick, active parts, the live callout. */
  accent?: string
  /** Frame paint colour of the drawn bike. */
  frameColor?: string
  /** "auto" follows a `.dark` class on any ancestor. */
  theme?: "auto" | "light" | "dark"
  /** Hero height. A definite length, never a percentage. */
  height?: string
  currency?: string
  locale?: string
  nav?: HitchLink[]
  cta?: HitchLink
  hero?: { [K in keyof HitchHeroCopy]?: HitchHeroCopy[K] }
  builds?: HitchBuild[]
  /** Seconds per build before the carousel advances. 0 turns autoplay off. */
  autoplay?: number
  base?: { [K in keyof HitchBase]?: HitchBase[K] }
  /** Rename, re-price or re-number any part. */
  modules?: { [K in HitchModuleId]?: HitchModulePatch }
  configurator?: { [K in keyof HitchSectionCopy]?: HitchSectionCopy[K] }
  specs?: { [K in keyof HitchSpecsCopy]?: HitchSpecsCopy[K] }
  ownership?: { [K in keyof HitchOwnershipCopy]?: HitchOwnershipCopy[K] }
  riders?: { [K in keyof HitchRidersCopy]?: HitchRidersCopy[K] }
  reserve?: { [K in keyof HitchReserveCopy]?: HitchReserveCopy[K] }
  faq?: { [K in keyof HitchFaqCopy]?: HitchFaqCopy[K] }
  footer?: { [K in keyof HitchFooterCopy]?: HitchFooterCopy[K] }
  onReserve?: (reservation: HitchReservation) => void
  className?: string
}

/* ------------------------------------------------------------------ logic */

// #region logic
const MODULE_IDS = ["seat", "footboards", "flatbed", "panniers", "toolbox", "box", "basket", "battery"]
const MOUNTS = ["rear", "side", "front", "power"]

function mergeCatalog(base: HitchModuleCatalog, over?: { [K in HitchModuleId]?: HitchModulePatch }): HitchModuleCatalog {
  const out = {} as HitchModuleCatalog
  for (const id of MODULE_IDS as HitchModuleId[]) out[id] = { ...base[id], ...(over && over[id] ? over[id] : {}) }
  return out
}

/** Toggle one part. A part that shares a mount with one already fitted replaces it. */
function toggleModule(build: HitchModuleId[], id: HitchModuleId, catalog: HitchModuleCatalog) {
  if (build.includes(id)) return { build: build.filter((m) => m !== id), swapped: null as HitchModuleId | null }
  const mount = catalog[id].mount
  const clash = build.find((m) => catalog[m].mount === mount) || null
  const next = build.filter((m) => m !== clash).concat(id)
  next.sort((a, b) => MODULE_IDS.indexOf(a) - MODULE_IDS.indexOf(b))
  return { build: next, swapped: clash }
}

/** Keep only known parts, one per mount, in catalogue order. */
function normalizeBuild(list: string[], catalog: HitchModuleCatalog) {
  let out = [] as HitchModuleId[]
  for (const id of list) if (MODULE_IDS.includes(id) && !out.includes(id as HitchModuleId)) out = toggleModule(out, id as HitchModuleId, catalog).build
  return out
}

function totals(build: HitchModuleId[], catalog: HitchModuleCatalog, base: HitchBase) {
  let price = base.price
  let weight = base.weight
  let range = base.range
  for (const id of build) {
    price += catalog[id].price
    weight += catalog[id].weight
    range += catalog[id].range
  }
  return { price, weight: Math.round(weight * 10) / 10, range: Math.max(0, Math.round(range)) }
}

function formatMoney(n: number, currency: string, locale: string) {
  try {
    return new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 0 }).format(n)
  } catch {
    return currency + " " + Math.round(n)
  }
}

function formatNumber(n: number, locale: string, digits: number) {
  try {
    return new Intl.NumberFormat(locale, { maximumFractionDigits: digits, minimumFractionDigits: digits }).format(n)
  } catch {
    return n.toFixed(digits)
  }
}

function isEmail(s: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s.trim())
}

/** A stable, readable reservation code from the email and the build. */
function reservationCode(email: string, build: string[]) {
  const s = email.trim().toLowerCase() + "|" + build.join(",")
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619) >>> 0
  }
  const abc = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"
  let out = ""
  for (let i = 0; i < 5; i++) {
    out += abc[h % 32]
    h = Math.floor(h / 32)
  }
  return "HX-" + out
}

function wrapIndex(i: number, n: number) {
  return n <= 0 ? 0 : ((i % n) + n) % n
}

/** Black or white text on a hex colour, by WCAG relative luminance. */
function readableOn(hex: string) {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) return "#111214"
  let h = m[1]
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2]
  const ch = [0, 2, 4].map((i) => {
    const v = parseInt(h.slice(i, i + 2), 16) / 255
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
  })
  const L = 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2]
  return (L + 0.05) / 0.05 > 1.05 / (L + 0.05) ? "#111214" : "#ffffff"
}

/** Spoke lines for a wheel, as one path. */
function spokePath(cx: number, cy: number, hub: number, rim: number, count: number) {
  let d = ""
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2
    const b = a + (i % 2 ? 0.62 : -0.62)
    d += "M" + (cx + Math.cos(a) * hub).toFixed(1) + " " + (cy + Math.sin(a) * hub).toFixed(1)
    d += "L" + (cx + Math.cos(b) * rim).toFixed(1) + " " + (cy + Math.sin(b) * rim).toFixed(1)
  }
  return d
}

/** An SVG arc from angle a0 to a1 (degrees, clockwise from +x). */
function arcPath(cx: number, cy: number, r: number, a0: number, a1: number) {
  const p = (a: number) => (cx + Math.cos((a * Math.PI) / 180) * r).toFixed(1) + " " + (cy + Math.sin((a * Math.PI) / 180) * r).toFixed(1)
  return "M" + p(a0) + "A" + r + " " + r + " 0 " + (a1 - a0 > 180 ? 1 : 0) + " 1 " + p(a1)
}
// #endregion logic

/* ------------------------------------------------------------- the drawing */

// Side elevation, viewBox 0 0 1000 600, ground at y 540, bike facing right.
const RA = [240, 420]
const FA = [800, 420]
const BB = [520, 415]

/** Where each part's callout points, and where its tag sits (viewBox units). */
const CALLOUTS = {
  seat: { a: [300, 172], t: [300, 104] },
  footboards: { a: [285, 360], t: [285, 578] },
  flatbed: { a: [470, 226], t: [470, 112] },
  panniers: { a: [330, 384], t: [330, 578] },
  toolbox: { a: [285, 164], t: [285, 104] },
  box: { a: [250, 96], t: [250, 40] },
  basket: { a: [800, 184], t: [800, 112] },
  battery: { a: [430, 340], t: [455, 578] },
} as { [K in HitchModuleId]: { a: number[]; t: number[] } }

const DIM_LABELS = [
  { k: "length", x: 512, y: 30 },
  { k: "wheelbase", x: 520, y: 586 },
  { k: "height", x: 958, y: 300 },
  { k: "deck", x: 52, y: 410 },
] as { k: "length" | "wheelbase" | "height" | "deck"; x: number; y: number }[]

function Wheel({ c, uid }: { c: number[]; uid: string }) {
  const [x, y] = c
  return (
    <g>
      <circle cx={x} cy={y} r={111} className="hx-b-tire" strokeWidth={18} fill="none" />
      <circle cx={x} cy={y} r={119} className="hx-b-tread" strokeWidth={1.5} fill="none" />
      <circle cx={x} cy={y} r={100} className="hx-b-rim" strokeWidth={6} fill="none" />
      <circle cx={x} cy={y} r={96} fill={"url(#" + uid + "-wheel)"} />
      <path d={spokePath(x, y, 10, 97, 28)} className="hx-b-spoke" strokeWidth={1.3} fill="none" />
      <circle cx={x} cy={y} r={30} className="hx-b-rotor" strokeWidth={3} fill="none" />
      <circle cx={x} cy={y} r={11} className="hx-b-hub" />
      <circle cx={x} cy={y} r={4} className="hx-b-axle" />
    </g>
  )
}

function Tube({ d, w, cls }: { d: string; w: number; cls?: string }) {
  return (
    <g className={cls}>
      <path d={d} className="hx-b-paint" strokeWidth={w} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} className="hx-b-shine" strokeWidth={Math.max(1.5, w * 0.2)} fill="none" strokeLinecap="round" transform={"translate(0 " + (-w * 0.22).toFixed(1) + ")"} />
    </g>
  )
}

function ModuleArt({ id }: { id: HitchModuleId }) {
  switch (id) {
    case "seat":
      return (
        <g>
          <rect x={148} y={258} width={300} height={18} rx={8} className="hx-m-pad" />
          <rect x={126} y={192} width={26} height={84} rx={9} className="hx-m-pad" />
          <rect x={282} y={226} width={20} height={50} rx={7} className="hx-m-pad" />
          <path d="M122 280L122 186Q122 172 136 172L432 172Q446 172 446 186L446 280" className="hx-m-rail" strokeWidth={8} fill="none" strokeLinecap="round" />
          <path d="M122 222L446 222" className="hx-m-rail" strokeWidth={5} fill="none" />
          <path d="M126 174L444 174" className="hx-m-glint" strokeWidth={2} fill="none" />
        </g>
      )
    case "footboards":
      return (
        <g>
          <path d="M192 360L216 292M380 360L358 292" className="hx-m-bracket" strokeWidth={6} fill="none" strokeLinecap="round" />
          <rect x={148} y={354} width={276} height={12} rx={4} className="hx-m-plate" />
          <path d="M156 356L416 356" className="hx-m-glint" strokeWidth={1.5} fill="none" />
        </g>
      )
    case "flatbed":
      return (
        <g>
          <rect x={128} y={178} width={164} height={84} rx={4} className="hx-m-load" />
          <rect x={300} y={198} width={142} height={64} rx={4} className="hx-m-load2" />
          <path d="M128 200L292 200M300 218L442 218" className="hx-m-tape" strokeWidth={3} fill="none" />
          <path d="M208 178L208 262M372 198L372 262" className="hx-m-strap" strokeWidth={4} fill="none" />
          <rect x={84} y={260} width={420} height={14} rx={4} className="hx-m-plate" />
          <path d="M96 262L96 226L492 226L492 262M294 262L294 226" className="hx-m-rail" strokeWidth={6} fill="none" strokeLinejoin="round" strokeLinecap="round" />
        </g>
      )
    case "panniers":
      return (
        <g>
          <path d="M150 292L400 292L400 410Q400 428 382 428L168 428Q150 428 150 410Z" className="hx-m-bag" />
          <rect x={150} y={292} width={250} height={24} rx={4} className="hx-m-bagtop" />
          <path d="M205 292L205 374M345 292L345 374" className="hx-m-strap" strokeWidth={6} fill="none" />
          <rect x={196} y={366} width={18} height={14} rx={2} className="hx-m-buckle" />
          <rect x={336} y={366} width={18} height={14} rx={2} className="hx-m-buckle" />
          <path d="M152 402L398 402" className="hx-m-reflect" strokeWidth={4} fill="none" />
        </g>
      )
    case "toolbox":
      return (
        <g>
          <rect x={104} y={176} width={366} height={100} rx={8} className="hx-m-case" />
          <rect x={104} y={176} width={366} height={24} rx={8} className="hx-m-lid" />
          <path d="M180 210L180 266M260 210L260 266M340 210L340 266M420 210L420 266" className="hx-m-rib" strokeWidth={3} fill="none" />
          <rect x={136} y={192} width={18} height={14} rx={2} className="hx-m-buckle" />
          <rect x={422} y={192} width={18} height={14} rx={2} className="hx-m-buckle" />
          <path d="M248 176L248 162L322 162L322 176" className="hx-m-handle" strokeWidth={7} fill="none" strokeLinejoin="round" />
        </g>
      )
    case "box":
      return (
        <g>
          <rect x={100} y={96} width={300} height={180} rx={10} className="hx-m-box" />
          <rect x={118} y={114} width={264} height={144} rx={5} className="hx-m-door" strokeWidth={2} />
          <path d="M360 168L360 204" className="hx-m-handle" strokeWidth={6} fill="none" strokeLinecap="round" />
          <path d="M140 104L360 104" className="hx-m-glint" strokeWidth={2} fill="none" />
          <rect x={134} y={130} width={84} height={22} rx={3} className="hx-m-badge" />
        </g>
      )
    case "basket":
      return (
        <g>
          <rect x={726} y={184} width={146} height={80} rx={5} className="hx-m-wirefill" />
          <path d="M742 186V262M758 186V262M774 186V262M790 186V262M806 186V262M822 186V262M838 186V262M854 186V262M728 210H870M728 236H870" className="hx-m-wire" strokeWidth={1.6} fill="none" />
          <rect x={726} y={184} width={146} height={80} rx={5} className="hx-m-wireframe" strokeWidth={5} fill="none" />
        </g>
      )
    case "battery":
      return (
        <g>
          <rect x={392} y={296} width={76} height={88} rx={9} className="hx-m-cell" />
          <rect x={400} y={304} width={60} height={10} rx={3} className="hx-m-lid" />
          <circle cx={412} cy={366} r={3} className="hx-m-led" />
          <circle cx={424} cy={366} r={3} className="hx-m-led" />
          <circle cx={436} cy={366} r={3} className="hx-m-led" />
          <circle cx={448} cy={366} r={3} className="hx-m-led hx-m-led-off" />
        </g>
      )
  }
}

/** Order parts are painted in: bags hang over the wheel, cases sit on the deck. */
const PAINT_ORDER = ["battery", "panniers", "footboards", "flatbed", "toolbox", "box", "seat", "basket"] as HitchModuleId[]

function Bike({
  modules,
  live,
  callouts,
  dims,
  uid,
  stagger = true,
}: {
  modules: HitchModuleId[]
  live?: HitchModuleId | null
  callouts?: boolean
  dims?: boolean
  uid: string
  stagger?: boolean
}) {
  let order = 0
  return (
    <svg className="hx-svg" viewBox="0 0 1000 600" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id={uid + "-shadow"} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" className="hx-b-shadow-a" />
          <stop offset="1" className="hx-b-shadow-b" />
        </radialGradient>
        <radialGradient id={uid + "-wheel"} cx="0.5" cy="0.42" r="0.6">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.07" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={uid + "-motor"} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4a4f56" />
          <stop offset="1" stopColor="#1d1f22" />
        </linearGradient>
      </defs>

      <ellipse cx={520} cy={541} rx={470} ry={16} fill={"url(#" + uid + "-shadow)"} />
      <path d="M40 540L980 540" className="hx-b-ground" strokeWidth={1.5} />

      {dims ? (
        <g className="hx-dim">
          <path d="M104 30V270M920 30V412M240 430V594M800 430V594M640 84H970M38 276H112M38 540H180" strokeWidth={1} className="hx-dim-ext" fill="none" />
          <path d="M104 30H920M240 586H800M958 84V540M48 276V540" strokeWidth={1.5} className="hx-dim-line" fill="none" />
          <path d="M104 30l12-5v10zM920 30l-12-5v10zM240 586l12-5v10zM800 586l-12-5v10zM958 84l-5 12h10zM958 540l-5-12h10zM48 276l-5 12h10zM48 540l-5-12h10z" className="hx-dim-head" />
        </g>
      ) : null}

      {/* parts that hang behind the frame */}
      {PAINT_ORDER.slice(0, 1).map((id) => (
        <g key={id} className="hx-mod" data-on={modules.includes(id) ? "true" : "false"} style={{ transitionDelay: modules.includes(id) && stagger ? order++ * 50 + "ms" : "0ms" }}>
          <ModuleArt id={id} />
        </g>
      ))}

      {/* fenders and wheels */}
      <path d={arcPath(RA[0], RA[1], 128, 196, 344)} className="hx-b-fender" strokeWidth={7} fill="none" strokeLinecap="round" />
      <path d={arcPath(FA[0], FA[1], 128, 208, 334)} className="hx-b-fender" strokeWidth={7} fill="none" strokeLinecap="round" />
      <Wheel c={RA} uid={uid} />
      <Wheel c={FA} uid={uid} />

      {/* drivetrain */}
      <path d={"M" + BB[0] + " 377L" + RA[0] + " 407M" + BB[0] + " 453L" + RA[0] + " 433"} className="hx-b-chain" strokeWidth={3.5} fill="none" strokeDasharray="5 3" />
      <circle cx={RA[0]} cy={RA[1]} r={14} className="hx-b-cog" strokeWidth={4} fill="none" />

      {/* rear frame and deck */}
      <Tube d="M240 420L300 286M240 420L178 286" w={11} />
      <Tube d={"M" + BB[0] + " 418L" + RA[0] + " 421"} w={13} />
      <rect x={110} y={274} width={378} height={16} rx={6} className="hx-b-paint-fill" />
      <rect x={110} y={274} width={378} height={4} rx={2} className="hx-b-shine-fill" />
      <path d="M134 282H476" className="hx-b-holes" strokeWidth={3.5} strokeDasharray="0.1 22" strokeLinecap="round" fill="none" />
      <rect x={103} y={276} width={9} height={12} rx={2} className="hx-b-taillight" />

      {/* main frame */}
      <Tube d="M520 415L453 195" w={22} />
      <path d="M453 195L441 152" className="hx-b-post" strokeWidth={13} strokeLinecap="round" fill="none" />
      <path d="M402 150Q440 138 482 146L480 158Q442 154 406 162Z" className="hx-b-saddle" />
      <Tube d="M714 236C660 280 590 350 534 404" w={36} />
      <path d="M694 254C652 288 602 336 562 374" className="hx-b-battery" strokeWidth={14} strokeLinecap="round" fill="none" />
      <path d="M676 268L668 274M664 278L656 284M652 288L644 294" className="hx-b-gauge" strokeWidth={4} strokeLinecap="round" />
      <Tube d="M720 262L696 194" w={28} />
      <path d="M720 258Q748 350 800 420" className="hx-b-fork" strokeWidth={12} strokeLinecap="round" fill="none" />
      <path d="M696 194L681 150L694 128" className="hx-b-stem" strokeWidth={12} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M694 128Q692 94 662 86L640 86" className="hx-b-bar" strokeWidth={8} strokeLinecap="round" fill="none" />
      <path d="M660 86L634 86" className="hx-b-grip" strokeWidth={14} strokeLinecap="round" />

      {/* front rack and lamp */}
      <path d="M720 266H868" className="hx-b-rack" strokeWidth={7} strokeLinecap="round" />
      <path d="M720 266L764 266L722 290Z" className="hx-b-rack-fill" />
      <rect x={866} y={256} width={18} height={14} rx={3} className="hx-b-lamp" />
      <rect x={880} y={258} width={4} height={10} rx={1} className="hx-b-lens" />

      {/* motor, cranks, stand */}
      <path d="M512 428L494 538M530 428L548 538" className="hx-b-stand" strokeWidth={6} strokeLinecap="round" />
      <path d="M520 415L482 349" className="hx-b-crank hx-b-far" strokeWidth={10} strokeLinecap="round" />
      <circle cx={BB[0]} cy={BB[1]} r={36} fill={"url(#" + uid + "-motor)"} />
      <circle cx={BB[0]} cy={BB[1]} r={40} className="hx-b-ring" strokeWidth={4} fill="none" strokeDasharray="4 3" />
      <circle cx={BB[0]} cy={BB[1]} r={14} className="hx-b-hub" />
      <path d="M520 415L558 481" className="hx-b-crank" strokeWidth={11} strokeLinecap="round" />
      <rect x={542} y={477} width={34} height={9} rx={3} className="hx-b-pedal" />

      {/* parts on top of the frame */}
      {PAINT_ORDER.slice(1).map((id) => (
        <g key={id} className="hx-mod" data-on={modules.includes(id) ? "true" : "false"} style={{ transitionDelay: modules.includes(id) && stagger ? order++ * 50 + "ms" : "0ms" }}>
          <ModuleArt id={id} />
        </g>
      ))}

      {callouts
        ? (MODULE_IDS as HitchModuleId[]).map((id) => {
            const c = CALLOUTS[id]
            const on = modules.includes(id)
            return (
              <g key={id} className="hx-lead" data-on={on ? "true" : "false"} data-live={live === id ? "true" : "false"}>
                <path d={"M" + c.a[0] + " " + c.a[1] + "L" + c.t[0] + " " + c.t[1]} className="hx-lead-halo" strokeWidth={6} fill="none" pathLength={1} />
                <path d={"M" + c.a[0] + " " + c.a[1] + "L" + c.t[0] + " " + c.t[1]} className="hx-lead-line" strokeWidth={1.6} fill="none" pathLength={1} />
                <circle cx={c.a[0]} cy={c.a[1]} r={6} className="hx-lead-dot" />
              </g>
            )
          })
        : null}
    </svg>
  )
}

/** The drawing (or a photo) plus its HTML callout tags, sized 5:3. */
function Plate({
  modules,
  live,
  callouts,
  dims,
  image,
  imageAlt,
  catalog,
  dimensions,
  label,
}: {
  modules: HitchModuleId[]
  live?: HitchModuleId | null
  callouts?: boolean
  dims?: boolean
  image?: string
  imageAlt?: string
  catalog: HitchModuleCatalog
  dimensions?: HitchDimensions
  label: string
}) {
  const uid = "hx" + React.useId().replace(/[^a-zA-Z0-9]/g, "")
  return (
    <div className="hx-plate" role="img" aria-label={label}>
      {image ? (
        <img className="hx-photo" src={image} alt={imageAlt || label} width={1000} height={600} loading="lazy" draggable={false} />
      ) : (
        <Bike modules={modules} live={live} callouts={callouts} dims={dims} uid={uid} />
      )}
      {callouts && !image
        ? (MODULE_IDS as HitchModuleId[]).map((id) => {
            const c = CALLOUTS[id]
            return (
              <span
                key={id}
                className="hx-tag"
                aria-hidden="true"
                data-on={modules.includes(id) ? "true" : "false"}
                data-live={live === id ? "true" : "false"}
                style={{ left: c.t[0] / 10 + "%", top: (c.t[1] / 600) * 100 + "%" }}
              >
                <b>{catalog[id].code}</b>
                {catalog[id].name}
              </span>
            )
          })
        : null}
      {dims && dimensions
        ? DIM_LABELS.map((d) => (
            <span key={d.k} className={"hx-dimtag hx-dimtag-" + d.k} aria-hidden="true" style={{ left: d.x / 10 + "%", top: (d.y / 600) * 100 + "%" }}>
              {dimensions[d.k]}
            </span>
          ))
        : null}
    </div>
  )
}

/* ------------------------------------------------------------------ icons */

function Arrow({ dir = "right" }: { dir?: "left" | "right" | "up" }) {
  const r = dir === "left" ? 180 : dir === "up" ? -90 : 0
  return (
    <svg className="hx-ico" viewBox="0 0 20 20" aria-hidden="true" focusable="false" style={{ transform: "rotate(" + r + "deg)" }}>
      <path d="M4 10H15M10.5 5.5L15 10L10.5 14.5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/* ---------------------------------------------------------------- presets */

const SIGNAL_MODULES: HitchModuleCatalog = {
  seat: { name: "Kid seat and rail", code: "HX-21", mount: "rear", price: 420, weight: 4.6, range: -4, note: "Two padded seats inside a steel rail, for ages 1 to 7." },
  footboards: { name: "Footboards", code: "HX-22", mount: "side", price: 110, weight: 1.4, range: 0, note: "Fold-down boards for small feet or an adult passenger." },
  flatbed: { name: "Flatbed", code: "HX-31", mount: "rear", price: 380, weight: 6.2, range: -6, note: "A wide deck with stake rails and four strap points." },
  panniers: { name: "Pannier pair", code: "HX-41", mount: "side", price: 240, weight: 2.2, range: -2, note: "Two 62 litre roll-top bags with a reflective band." },
  toolbox: { name: "Lockable case", code: "HX-33", mount: "rear", price: 520, weight: 8.8, range: -7, note: "A 140 litre steel case with a keyed latch." },
  box: { name: "Courier box", code: "HX-35", mount: "rear", price: 690, weight: 10.5, range: -9, note: "Insulated, 230 litres, with a side door." },
  basket: { name: "Front crate", code: "HX-51", mount: "front", price: 150, weight: 1.6, range: -1, note: "Mounted to the frame, so the steering stays light." },
  battery: { name: "Second battery", code: "HX-61", mount: "power", price: 890, weight: 3.1, range: 75, note: "Doubles the pack to 1,000 Wh." },
}

type Content = {
  brand: string
  accent: string
  frameColor: string
  currency: string
  locale: string
  nav: HitchLink[]
  cta: HitchLink
  hero: HitchHeroCopy
  builds: HitchBuild[]
  base: HitchBase
  modules: HitchModuleCatalog
  configurator: HitchSectionCopy
  specs: HitchSpecsCopy
  ownership: HitchOwnershipCopy
  riders: HitchRidersCopy
  reserve: HitchReserveCopy
  faq: HitchFaqCopy
  footer: HitchFooterCopy
}

const PRESETS: { [K in HitchPreset]: Content } = {
  signal: {
    brand: "Hitch",
    accent: "#ff5b1a",
    frameColor: "#b9bec4",
    currency: "USD",
    locale: "en-US",
    nav: [
      { label: "Configure", href: "#configure" },
      { label: "Specs", href: "#specs" },
      { label: "Ownership", href: "#ownership" },
      { label: "Riders", href: "#riders" },
      { label: "FAQ", href: "#faq" },
    ],
    cta: { label: "Reserve", href: "#reserve" },
    hero: {
      lead: "One bike for",
      body: "An electric longtail with a bolt-on rear deck. Start with the bare frame, then add seats, bags or a flatbed when your week changes.",
      buildLabel: "Build this one",
    },
    builds: [
      { id: "school", caption: "The school run", tail: "the school run.", modules: ["seat", "footboards", "basket"] },
      { id: "shop", caption: "The weekly shop", tail: "the weekly shop.", modules: ["panniers", "basket"] },
      { id: "trades", caption: "The trades rig", tail: "the job site.", modules: ["toolbox", "battery"] },
      { id: "flatbed", caption: "The flatbed", tail: "the big move.", modules: ["flatbed", "basket"] },
      { id: "bare", caption: "The bare frame", tail: "what comes next.", modules: [] },
    ],
    base: { price: 3900, weight: 31, range: 90, maxLoad: 200 },
    modules: SIGNAL_MODULES,
    configurator: {
      title: "Build yours",
      intro: "Every part bolts to one of four mounts with a single 5 mm hex key. Pick one part per mount and the numbers update as you go.",
    },
    specs: {
      title: "The numbers",
      intro: "Measured on the bare frame with the stem upright. Range is for a 75 kg rider on mixed city roads.",
      rows: [
        { label: "Motor", value: "Mid-drive, 85 Nm" },
        { label: "Battery", value: "500 Wh, removable" },
        { label: "Range", value: "Up to 90 km, 165 km with two" },
        { label: "Drive", value: "Belt, 5-speed hub" },
        { label: "Brakes", value: "4-piston hydraulic discs" },
        { label: "Wheels", value: "20 in, 2.4 in tyres" },
        { label: "Max load", value: "200 kg, rider included" },
        { label: "Fits riders", value: "150 to 195 cm" },
        { label: "Weight", value: "31 kg bare" },
      ],
      dimensions: { length: "1,880 mm", wheelbase: "1,300 mm", height: "1,090 mm", deck: "620 mm" },
    },
    ownership: {
      title: "How ownership works",
      intro: "From a reserved slot to your first service, in four steps.",
      steps: [
        { title: "Reserve a build slot", body: "Pick your parts and leave an email. Nothing to pay today.", time: "2 min" },
        { title: "Ride it first", body: "Book a 40 minute test ride at a partner shop, with your parts fitted.", time: "Week 1" },
        { title: "Delivered built", body: "We bring it to your door ready to ride, set to your height, and show you every mount.", time: "Weeks 4 to 6" },
        { title: "Serviced near you", body: "Two free services in the first year. Parts swap in ten minutes, so the bike changes with you.", time: "Year 1" },
      ],
    },
    riders: {
      title: "In service",
      items: [
        { name: "Noor", place: "Rotterdam", build: "The school run", distance: "6,200 km", quote: "The car went in March. Two kids, two bags and one bridge every morning, and with the second battery I charge on Sundays." },
        { name: "Teo", place: "Lyon", build: "The trades rig", distance: "11,900 km", quote: "I carry a full plumbing kit through the old town faster than the van ever did, and I park at the door." },
        { name: "Ines", place: "Portland", build: "The flatbed", distance: "3,400 km", quote: "We moved a whole studio flat with it. The bed came off and the kid seat went back on before dinner." },
      ],
    },
    reserve: {
      title: "Reserve your build",
      body: "We build in batches of 400. Leave your details and we hold a slot for the build you made above.",
      cities: ["Amsterdam", "Berlin", "Copenhagen", "Lyon", "Portland", "Somewhere else"],
      button: "Reserve this build",
      fineprint: "No card today. The $150 deposit is due when your batch opens, and it is refundable until delivery.",
      batch: "Batch 07 opens in March.",
      checkbox: "Book a test ride before the deposit",
      checkboxNote: "A partner shop will offer test ride times first.",
      doneTitle: "Slot held for {name}.",
    },
    faq: {
      title: "Questions",
      items: [
        { q: "Can I change parts after delivery?", a: "Yes. Every part bolts to the same four mounts with one 5 mm hex key. Swapping the flatbed for the kid seat takes about ten minutes." },
        { q: "How much can it carry?", a: "200 kg in total, rider included. The rear deck alone is rated for 80 kg, and the front crate for 20 kg." },
        { q: "Will it fit in a lift or a hallway?", a: "Fold the stem, turn the bars flat and stand it on its tail: it is 52 cm wide and fits most apartment lifts." },
        { q: "Where does it get serviced?", a: "At a partner shop in every city we deliver to, or by a mobile mechanic who comes to you. Two services in year one are free." },
        { q: "Can I ride it in the rain?", a: "Yes. The belt, the hub gears, the motor and the battery are all sealed. Ride it like any commuter bike." },
        { q: "What does it cost to run?", a: "A full charge costs about 15 cents. Expect a new belt every 15,000 km and brake pads about once a year." },
      ],
    },
    footer: {
      tagline: "Electric longtails that change with your week.",
      columns: [
        { title: "Bike", links: [{ label: "Configure", href: "#configure" }, { label: "Specs", href: "#specs" }, { label: "Parts", href: "#configure" }] },
        { title: "Owning", links: [{ label: "Test rides", href: "#reserve" }, { label: "Service", href: "#ownership" }, { label: "FAQ", href: "#faq" }] },
        { title: "Company", links: [{ label: "About", href: "#top" }, { label: "Careers", href: "#top" }, { label: "Press", href: "#top" }] },
      ],
      legal: "Prices include sales tax. Range measured with a 75 kg rider on mixed city roads.",
    },
  },
  fleet: {
    brand: "Kerbside",
    accent: "#ffd21f",
    frameColor: "#e3b512",
    currency: "EUR",
    locale: "en-IE",
    nav: [
      { label: "Fleet builder", href: "#configure" },
      { label: "Specs", href: "#specs" },
      { label: "Leasing", href: "#ownership" },
      { label: "Operators", href: "#riders" },
      { label: "FAQ", href: "#faq" },
    ],
    cta: { label: "Get a quote", href: "#reserve" },
    hero: {
      lead: "Built for",
      body: "Cargo bikes for delivery and trades fleets. One frame across the whole fleet, with parts that change with the route.",
      buildLabel: "Spec this bike",
    },
    builds: [
      { id: "parcel", caption: "Parcel round", tail: "the last mile.", modules: ["box", "battery"] },
      { id: "grocer", caption: "Grocery drop", tail: "the early round.", modules: ["box", "basket"] },
      { id: "site", caption: "Site service", tail: "the site visit.", modules: ["toolbox", "panniers"] },
      { id: "bulk", caption: "Bulk load", tail: "the bulk drop.", modules: ["flatbed", "battery"] },
    ],
    base: { price: 3400, weight: 33, range: 85, maxLoad: 220 },
    modules: {
      ...SIGNAL_MODULES,
      box: { name: "Parcel box", code: "KS-35", mount: "rear", price: 640, weight: 10.5, range: -9, note: "230 litres, insulated, side door, fleet number plate." },
      toolbox: { name: "Service case", code: "KS-33", mount: "rear", price: 520, weight: 8.8, range: -7, note: "140 litres, keyed alike across the fleet." },
      flatbed: { name: "Load bed", code: "KS-31", mount: "rear", price: 360, weight: 6.2, range: -6, note: "Pallet-width deck with six strap points." },
      panniers: { name: "Side bags", code: "KS-41", mount: "side", price: 220, weight: 2.2, range: -2, note: "Two 62 litre bags in hi-vis yellow." },
      basket: { name: "Front crate", code: "KS-51", mount: "front", price: 140, weight: 1.6, range: -1, note: "Frame-mounted, for the scanner and the next drop." },
      battery: { name: "Shift battery", code: "KS-61", mount: "power", price: 820, weight: 3.1, range: 75, note: "Swap at the depot and ride a double shift." },
      seat: { name: "Passenger seat", code: "KS-21", mount: "rear", price: 420, weight: 4.6, range: -4, note: "For a second crew member on training rides." },
      footboards: { name: "Footboards", code: "KS-22", mount: "side", price: 110, weight: 1.4, range: 0, note: "Fold-down boards for a second crew member." },
    },
    configurator: { title: "Spec the fleet bike", intro: "One frame for every route. Pick a part per mount and see the price per bike, the weight and the range on a single charge." },
    specs: {
      title: "Fleet numbers",
      intro: "Measured on the bare frame. Range is for an 85 kg rider with 60 kg of cargo on city routes.",
      rows: [
        { label: "Motor", value: "Mid-drive, 90 Nm" },
        { label: "Battery", value: "500 Wh, depot-swappable" },
        { label: "Range", value: "85 km, 160 km with two" },
        { label: "Drive", value: "Belt, automatic hub" },
        { label: "Brakes", value: "4-piston hydraulic discs" },
        { label: "Max load", value: "220 kg, rider included" },
        { label: "Telematics", value: "GPS, theft alerts, service log" },
        { label: "Service", value: "48 hour swap guarantee" },
        { label: "Weight", value: "33 kg bare" },
      ],
      dimensions: { length: "1,880 mm", wheelbase: "1,300 mm", height: "1,090 mm", deck: "620 mm" },
    },
    ownership: {
      title: "How leasing works",
      intro: "A fixed monthly price per bike, with service and replacements included.",
      steps: [
        { title: "Spec your routes", body: "Tell us the drops, the loads and the hours. We size the fleet and the parts.", time: "Day 1" },
        { title: "Two week trial", body: "Five bikes on your real routes, with the riders who will use them.", time: "Weeks 1 to 2" },
        { title: "Fleet delivered", body: "Bikes arrive numbered, tagged and logged in your dashboard, with rider training.", time: "Week 6" },
        { title: "Kept on the road", body: "A broken bike is swapped within 48 hours. Parts move between bikes as routes change.", time: "Every month" },
      ],
    },
    riders: {
      title: "Operators",
      items: [
        { name: "Moss & Daughters", place: "Dublin", build: "Grocery drop", distance: "42 bikes", quote: "We retired nine vans in a year. The riders do more drops per hour because they park at the door." },
        { name: "Pipewell", place: "Bristol", build: "Site service", distance: "18 bikes", quote: "Engineers reach a call-out in the city centre twenty minutes sooner, with the whole kit in the case." },
        { name: "Halde", place: "Hamburg", build: "Parcel round", distance: "120 bikes", quote: "The battery swap at the depot means one bike covers two shifts without a charger in sight." },
      ],
    },
    reserve: {
      title: "Get a fleet quote",
      body: "Tell us where you operate and we send a quote for the bike you specced above, within two working days.",
      cities: ["Dublin", "Bristol", "Hamburg", "Rotterdam", "Lyon", "Somewhere else"],
      button: "Request the quote",
      fineprint: "No commitment. Quotes include service, insurance and replacements.",
      batch: "Trials start every month.",
      checkbox: "Include a two week trial with five bikes",
      checkboxNote: "The quote includes a trial on your busiest route.",
      doneTitle: "Quote on its way, {name}.",
    },
    faq: {
      title: "Fleet questions",
      items: [
        { q: "Can parts move between bikes?", a: "Yes. Every part fits every frame, so a parcel bike becomes a service bike in ten minutes at the depot." },
        { q: "What happens when a bike breaks?", a: "We swap it within 48 hours and repair the broken one ourselves. Your riders keep working." },
        { q: "Do riders need a licence?", a: "No. The motor assists up to 25 km/h, so it rides as a bicycle in the EU and the UK." },
        { q: "Is there a minimum fleet size?", a: "Five bikes. Most operators start with a trial on their busiest route and grow from there." },
      ],
    },
    footer: {
      tagline: "Cargo bikes for fleets that park at the door.",
      columns: [
        { title: "Fleet", links: [{ label: "Fleet builder", href: "#configure" }, { label: "Specs", href: "#specs" }, { label: "Telematics", href: "#specs" }] },
        { title: "Leasing", links: [{ label: "How it works", href: "#ownership" }, { label: "Get a quote", href: "#reserve" }, { label: "FAQ", href: "#faq" }] },
        { title: "Company", links: [{ label: "About", href: "#top" }, { label: "Careers", href: "#top" }, { label: "Contact", href: "#reserve" }] },
      ],
      legal: "Prices per bike, excluding VAT. Range measured with an 85 kg rider and 60 kg of cargo.",
    },
  },
}

/* ------------------------------------------------------------------ hooks */

function useReducedMotion() {
  const [reduced, setReduced] = React.useState(false)
  React.useEffect(() => {
    if (typeof matchMedia !== "function") return
    const mq = matchMedia("(prefers-reduced-motion: reduce)")
    const on = () => setReduced(mq.matches)
    on()
    mq.addEventListener("change", on)
    return () => mq.removeEventListener("change", on)
  }, [])
  return reduced
}

function useHostDark(root: { current: HTMLElement | null }, theme: string) {
  const [dark, setDark] = React.useState(theme === "dark")
  React.useEffect(() => {
    if (theme !== "auto") {
      setDark(theme === "dark")
      return
    }
    const check = () => setDark(!!root.current && !!root.current.parentElement && !!root.current.parentElement.closest(".dark"))
    check()
    const mo = new MutationObserver(check)
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class"], subtree: true })
    return () => mo.disconnect()
  }, [theme, root])
  return dark
}

/* ------------------------------------------------------------------- hero */

function Hero({
  c,
  height,
  autoplay,
  reduced,
  onBuild,
}: {
  c: Content
  height: string
  autoplay: number
  reduced: boolean
  onBuild: (modules: HitchModuleId[]) => void
}) {
  const builds = c.builds
  const n = builds.length
  const [index, setIndex] = React.useState(0)
  const [prevMods, setPrevMods] = React.useState([] as HitchModuleId[])
  const [paused, setPaused] = React.useState(false)
  const [hold, setHold] = React.useState(false)
  const [visible, setVisible] = React.useState(true)
  const ref = React.useRef(null as HTMLElement | null)
  const drag = React.useRef(null as { x: number; y: number } | null)

  const build = builds[wrapIndex(index, n)] || builds[0]
  const mods = build ? normalizeBuild(build.modules, c.modules) : []
  const live = mods.find((m) => !prevMods.includes(m)) || mods[mods.length - 1] || null
  const sum = totals(mods, c.modules, c.base)

  const go = (i: number) => {
    setPrevMods(mods)
    setIndex(wrapIndex(i, n))
  }

  React.useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver !== "function") return
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.2 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const running = autoplay > 0 && !reduced && !paused && !hold && visible && n > 1

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") {
      e.preventDefault()
      go(index + 1)
    } else if (e.key === "ArrowLeft") {
      e.preventDefault()
      go(index - 1)
    }
  }

  if (!build) return null
  const prev = builds[wrapIndex(index - 1, n)]
  const next = builds[wrapIndex(index + 1, n)]

  return (
    <section
      ref={ref}
      className="hx-hero"
      style={{ minHeight: "calc(" + height + " - 72px)", ["--hx-h" as string]: height } as React.CSSProperties}
      aria-roledescription="carousel"
      aria-label={c.brand + " builds"}
      onKeyDown={onKey}
      onMouseEnter={() => setHold(true)}
      onMouseLeave={() => setHold(false)}
      onFocus={() => setHold(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setHold(false)
      }}
    >
      <div className="hx-hero-card">
        <h1 className="hx-h1">
          <span className="hx-h1-lead">{c.hero.lead} </span>
          <span className="hx-h1-tail" key={build.id}>
            {build.tail.split(" ").map((w, i) => (
              <React.Fragment key={i}>
                <span className="hx-word" style={{ animationDelay: i * 45 + "ms" }}>
                  {w}
                </span>{" "}
              </React.Fragment>
            ))}
          </span>
        </h1>
        <div className="hx-hero-side">
          <p className="hx-hero-body">{c.hero.body}</p>
          <div className="hx-hero-buy">
            <p className="hx-price">
              <span className="hx-price-label">This build</span>
              <span className="hx-price-num">{formatMoney(sum.price, c.currency, c.locale)}</span>
            </p>
            <button type="button" className="hx-btn hx-btn-ghost" onClick={() => onBuild(mods)}>
              <span>{c.hero.buildLabel}</span>
              <Arrow />
            </button>
          </div>
        </div>
      </div>

      <div
        className="hx-stage"
        onPointerDown={(e) => {
          drag.current = { x: e.clientX, y: e.clientY }
        }}
        onPointerUp={(e) => {
          const d = drag.current
          drag.current = null
          if (!d) return
          const dx = e.clientX - d.x
          if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(e.clientY - d.y)) go(index + (dx < 0 ? 1 : -1))
        }}
        onPointerCancel={() => (drag.current = null)}
      >
        {n > 1 ? (
          <>
            <div className="hx-peek hx-peek-l" aria-hidden="true">
              <Plate modules={normalizeBuild(prev.modules, c.modules)} image={prev.image} catalog={c.modules} label="" />
            </div>
            <div className="hx-peek hx-peek-r" aria-hidden="true">
              <Plate modules={normalizeBuild(next.modules, c.modules)} image={next.image} catalog={c.modules} label="" />
            </div>
          </>
        ) : null}
        <div className="hx-stage-main">
          <Plate
            modules={mods}
            live={live}
            callouts
            image={build.image}
            imageAlt={build.imageAlt}
            catalog={c.modules}
            label={c.brand + " cargo bike, " + build.caption + (mods.length ? ": " + mods.map((m) => c.modules[m].name).join(", ") : ", no parts fitted")}
          />
        </div>
        {n > 1 ? (
          <>
            <button type="button" className="hx-arrow hx-arrow-l" onClick={() => go(index - 1)} aria-label={"Previous build: " + prev.caption}>
              <Arrow dir="left" />
            </button>
            <button type="button" className="hx-arrow hx-arrow-r" onClick={() => go(index + 1)} aria-label={"Next build: " + next.caption}>
              <Arrow />
            </button>
          </>
        ) : null}
      </div>

      <ul className="hx-chips" aria-hidden="true">
        {mods.length ? (
          mods.map((m) => (
            <li key={m} data-live={m === live ? "true" : "false"}>
              <b>{c.modules[m].code}</b> {c.modules[m].name}
            </li>
          ))
        ) : (
          <li>Bare frame, four empty mounts</li>
        )}
      </ul>

      <div className="hx-bar">
        <p className="hx-caption" aria-live={running ? "off" : "polite"}>
          {build.caption}
        </p>
        <div className="hx-ticks" role="group" aria-label="Choose a build">
          {builds.map((b, i) => (
            <button
              key={b.id}
              type="button"
              className="hx-tick"
              aria-label={b.caption}
              aria-current={i === wrapIndex(index, n) ? "true" : undefined}
              onClick={() => go(i)}
            >
              <span className="hx-tick-fill" key={i === wrapIndex(index, n) ? "on" + index : "off"} style={i === wrapIndex(index, n) && autoplay > 0 && !reduced ? { animationDuration: autoplay + "s", animationPlayState: running ? "running" : "paused" } : undefined} onAnimationEnd={() => go(index + 1)} />
            </button>
          ))}
        </div>
        <div className="hx-count">
          <span className="hx-count-num">
            {String(wrapIndex(index, n) + 1).padStart(2, "0")} / {String(n).padStart(2, "0")}
          </span>
          {autoplay > 0 && !reduced && n > 1 ? (
            <button type="button" className="hx-pause" onClick={() => setPaused((p) => !p)} aria-label={paused ? "Play builds" : "Pause builds"}>
              {paused ? (
                <svg viewBox="0 0 20 20" aria-hidden="true" className="hx-ico">
                  <path d="M7 5L15 10L7 15Z" fill="currentColor" />
                </svg>
              ) : (
                <svg viewBox="0 0 20 20" aria-hidden="true" className="hx-ico">
                  <path d="M7 5V15M13 5V15" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" />
                </svg>
              )}
            </button>
          ) : null}
        </div>
      </div>
    </section>
  )
}

/* ----------------------------------------------------------- configurator */

function Configurator({
  c,
  build,
  setBuild,
  note,
  setNote,
}: {
  c: Content
  build: HitchModuleId[]
  setBuild: (b: HitchModuleId[]) => void
  note: string
  setNote: (s: string) => void
}) {
  const [live, setLive] = React.useState(null as HitchModuleId | null)
  const sum = totals(build, c.modules, c.base)
  const mountLabel = { rear: "Rear deck", side: "Sides", front: "Front rack", power: "Power" } as { [K in HitchMount]: string }

  const flip = (id: HitchModuleId) => {
    const r = toggleModule(build, id, c.modules)
    setBuild(r.build)
    setLive(r.build.includes(id) ? id : null)
    if (r.swapped) setNote(c.modules[id].name + " replaced the " + c.modules[r.swapped].name.toLowerCase() + ". Both use the " + mountLabel[c.modules[id].mount].toLowerCase() + ".")
    else setNote(r.build.includes(id) ? c.modules[id].name + " added." : c.modules[id].name + " removed.")
  }

  return (
    <section id="configure" className="hx-sheet hx-config hx-reveal" aria-labelledby="hx-config-h">
      <div className="hx-config-art">
        <Plate
          modules={build}
          live={live}
          callouts
          catalog={c.modules}
          label={c.brand + " cargo bike with " + (build.length ? build.map((m) => c.modules[m].name).join(", ") : "no parts fitted")}
        />
        <dl className="hx-totals">
          <div>
            <dt>Price</dt>
            <dd>{formatMoney(sum.price, c.currency, c.locale)}</dd>
          </div>
          <div>
            <dt>Weight</dt>
            <dd>
              {formatNumber(sum.weight, c.locale, 1)}
              <small> kg</small>
            </dd>
          </div>
          <div>
            <dt>Range</dt>
            <dd>
              {sum.range}
              <small> km</small>
            </dd>
          </div>
        </dl>
      </div>
      <div className="hx-config-head">
        <h2 id="hx-config-h" className="hx-h2">
          {c.configurator.title}
        </h2>
        <p className="hx-lede">{c.configurator.intro}</p>
      </div>
      <div className="hx-config-side">
        {(MOUNTS as HitchMount[]).map((mount) => {
          const ids = (MODULE_IDS as HitchModuleId[]).filter((id) => c.modules[id].mount === mount)
          if (!ids.length) return null
          return (
            <fieldset key={mount} className="hx-mount">
              <legend>
                {mountLabel[mount]}
                <span>{ids.length > 1 ? "one at a time" : "optional"}</span>
              </legend>
              {ids.map((id) => {
                const m = c.modules[id]
                const on = build.includes(id)
                return (
                  <button key={id} type="button" className="hx-part" aria-pressed={on} onClick={() => flip(id)}>
                    <span className="hx-part-box" aria-hidden="true">
                      <svg viewBox="0 0 16 16" className="hx-part-check">
                        <path d="M3.5 8.5L6.5 11.5L12.5 4.5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    <span className="hx-part-text">
                      <span className="hx-part-name">
                        <b>{m.code}</b> {m.name}
                      </span>
                      <span className="hx-part-note">{m.note}</span>
                    </span>
                    <span className="hx-part-price">+{formatMoney(m.price, c.currency, c.locale)}</span>
                  </button>
                )
              })}
            </fieldset>
          )
        })}
        <p className="hx-note" aria-live="polite">
          {note}
        </p>
        <div className="hx-config-cta">
          <a className="hx-btn hx-btn-accent" href="#reserve">
            <span>{c.reserve.button}</span>
            <Arrow />
          </a>
          <button
            type="button"
            className="hx-link"
            onClick={() => {
              setBuild([])
              setLive(null)
              setNote("Back to the bare frame.")
            }}
          >
            Start over
          </button>
        </div>
      </div>
    </section>
  )
}

/* --------------------------------------------------------------- sections */

function Specs({ c }: { c: Content }) {
  return (
    <section id="specs" className="hx-sheet hx-paper hx-specs hx-reveal" aria-labelledby="hx-specs-h">
      <div className="hx-specs-head">
        <h2 id="hx-specs-h" className="hx-h2">
          {c.specs.title}
        </h2>
        <p className="hx-lede">{c.specs.intro}</p>
      </div>
      <Plate modules={[]} dims dimensions={c.specs.dimensions} catalog={c.modules} label={"Side elevation with dimensions: " + c.specs.dimensions.length + " long, " + c.specs.dimensions.wheelbase + " wheelbase, " + c.specs.dimensions.height + " tall, deck at " + c.specs.dimensions.deck} />
      <dl className="hx-spec-grid">
        {c.specs.rows.map((r) => (
          <div key={r.label}>
            <dt>{r.label}</dt>
            <dd>{r.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

function Ownership({ c }: { c: Content }) {
  return (
    <section id="ownership" className="hx-sheet hx-own hx-reveal" aria-labelledby="hx-own-h">
      <div className="hx-own-head">
        <h2 id="hx-own-h" className="hx-h2">
          {c.ownership.title}
        </h2>
        <p className="hx-lede">{c.ownership.intro}</p>
      </div>
      <ol className="hx-steps">
        {c.ownership.steps.map((s, i) => (
          <li key={s.title} className="hx-step">
            <span className="hx-step-n" aria-hidden="true">
              {String(i + 1).padStart(2, "0")}
            </span>
            <h3 className="hx-h3">{s.title}</h3>
            <p>{s.body}</p>
            <span className="hx-step-time">{s.time}</span>
          </li>
        ))}
      </ol>
    </section>
  )
}

function Riders({ c }: { c: Content }) {
  const [i, setI] = React.useState(0)
  const items = c.riders.items
  const tabs = React.useId().replace(/[^a-zA-Z0-9]/g, "")
  const r = items[Math.min(i, items.length - 1)]
  if (!r) return null
  return (
    <section id="riders" className="hx-sheet hx-riders hx-reveal" aria-labelledby="hx-riders-h">
      <h2 id="hx-riders-h" className="hx-h2">
        {c.riders.title}
      </h2>
      <div className="hx-riders-body">
        <div className="hx-rider-list" role="tablist" aria-label={c.riders.title}>
          {items.map((it, k) => (
            <button
              key={it.name}
              type="button"
              role="tab"
              id={tabs + "t" + k}
              aria-selected={k === i}
              aria-controls={tabs + "p"}
              tabIndex={k === i ? 0 : -1}
              className="hx-rider"
              onClick={() => setI(k)}
              onKeyDown={(e) => {
                if (e.key !== "ArrowDown" && e.key !== "ArrowUp" && e.key !== "ArrowRight" && e.key !== "ArrowLeft") return
                e.preventDefault()
                const nx = wrapIndex(k + (e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : -1), items.length)
                setI(nx)
                const el = document.getElementById(tabs + "t" + nx)
                if (el) el.focus()
              }}
            >
              <span className="hx-rider-name">
                {it.name}, {it.place}
              </span>
              <span className="hx-rider-meta">
                {it.build} <i aria-hidden="true">/</i> {it.distance}
              </span>
            </button>
          ))}
        </div>
        <figure className="hx-quote" id={tabs + "p"} role="tabpanel" aria-labelledby={tabs + "t" + i} key={r.name}>
          <blockquote>
            <p>{"“" + r.quote + "”"}</p>
          </blockquote>
          <figcaption>
            {r.name}, {r.place} <span>{r.build}</span>
          </figcaption>
        </figure>
      </div>
    </section>
  )
}

function Reserve({
  c,
  build,
  onReserve,
}: {
  c: Content
  build: HitchModuleId[]
  onReserve?: (r: HitchReservation) => void
}) {
  const [name, setName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [city, setCity] = React.useState("")
  const [ride, setRide] = React.useState(true)
  const [errors, setErrors] = React.useState({} as { name?: string; email?: string; city?: string })
  const [done, setDone] = React.useState(null as HitchReservation | null)
  const sum = totals(build, c.modules, c.base)
  const fid = React.useId().replace(/[^a-zA-Z0-9]/g, "")
  const nameRef = React.useRef(null as HTMLInputElement | null)
  const emailRef = React.useRef(null as HTMLInputElement | null)
  const cityRef = React.useRef(null as HTMLSelectElement | null)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const errs = {} as { name?: string; email?: string; city?: string }
    if (!name.trim()) errs.name = "Add the name for the reservation."
    if (!isEmail(email)) errs.email = "Enter an email like name@example.com."
    if (!city) errs.city = "Pick the city for delivery."
    setErrors(errs)
    if (errs.name) return nameRef.current && nameRef.current.focus()
    if (errs.email) return emailRef.current && emailRef.current.focus()
    if (errs.city) return cityRef.current && cityRef.current.focus()
    const r = { name: name.trim(), email: email.trim(), city, testRide: ride, modules: build, total: sum.price, code: reservationCode(email, build) }
    setDone(r)
    if (onReserve) onReserve(r)
  }

  return (
    <section id="reserve" className="hx-sheet hx-reserve hx-reveal" aria-labelledby="hx-reserve-h">
      <div className="hx-reserve-head">
        <h2 id="hx-reserve-h" className="hx-h2 hx-h2-xl">
          {c.reserve.title}
        </h2>
        <p className="hx-lede">{c.reserve.body}</p>
        <div className="hx-summary">
          <p className="hx-summary-h">Your build</p>
          <ul>
            <li>
              <span>Bare frame</span>
              <span>{formatMoney(c.base.price, c.currency, c.locale)}</span>
            </li>
            {build.map((m) => (
              <li key={m}>
                <span>
                  <b>{c.modules[m].code}</b> {c.modules[m].name}
                </span>
                <span>+{formatMoney(c.modules[m].price, c.currency, c.locale)}</span>
              </li>
            ))}
            <li className="hx-summary-total">
              <span>Total</span>
              <span>{formatMoney(sum.price, c.currency, c.locale)}</span>
            </li>
          </ul>
          <a className="hx-link" href="#configure">
            Change parts
          </a>
        </div>
      </div>

      {done ? (
        <div className="hx-done" role="status">
          <p className="hx-done-code">{done.code}</p>
          <h3 className="hx-h3">{c.reserve.doneTitle.replace("{name}", done.name.split(" ")[0])}</h3>
          <p>
            We sent the build to {done.email}. {c.reserve.batch}
            {done.testRide ? " " + c.reserve.checkboxNote : ""}
          </p>
          <button type="button" className="hx-link" onClick={() => setDone(null)}>
            Edit the details
          </button>
        </div>
      ) : (
        <form className="hx-form" onSubmit={submit} noValidate>
          <div className="hx-field" data-error={errors.name ? "true" : "false"}>
            <label htmlFor={fid + "n"}>Name</label>
            <input
              ref={nameRef}
              id={fid + "n"}
              name="name"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? fid + "ne" : undefined}
            />
            {errors.name ? (
              <p id={fid + "ne"} className="hx-err">
                {errors.name}
              </p>
            ) : null}
          </div>
          <div className="hx-field" data-error={errors.email ? "true" : "false"}>
            <label htmlFor={fid + "e"}>Email</label>
            <input
              ref={emailRef}
              id={fid + "e"}
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? fid + "ee" : undefined}
            />
            {errors.email ? (
              <p id={fid + "ee"} className="hx-err">
                {errors.email}
              </p>
            ) : null}
          </div>
          <div className="hx-field" data-error={errors.city ? "true" : "false"}>
            <label htmlFor={fid + "c"}>Delivery city</label>
            <div className="hx-select">
              <select
                ref={cityRef}
                id={fid + "c"}
                name="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                aria-invalid={!!errors.city}
                aria-describedby={errors.city ? fid + "ce" : undefined}
              >
                <option value="">Choose a city</option>
                {c.reserve.cities.map((x) => (
                  <option key={x} value={x}>
                    {x}
                  </option>
                ))}
              </select>
              <svg viewBox="0 0 20 20" aria-hidden="true" className="hx-ico">
                <path d="M6 8L10 12L14 8" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            {errors.city ? (
              <p id={fid + "ce"} className="hx-err">
                {errors.city}
              </p>
            ) : null}
          </div>
          <label className="hx-check">
            <input type="checkbox" checked={ride} onChange={(e) => setRide(e.target.checked)} />
            <span className="hx-part-box" aria-hidden="true">
              <svg viewBox="0 0 16 16" className="hx-part-check">
                <path d="M3.5 8.5L6.5 11.5L12.5 4.5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <span>{c.reserve.checkbox}</span>
          </label>
          <button type="submit" className="hx-btn hx-btn-accent hx-btn-wide">
            <span>{c.reserve.button}</span>
            <Arrow />
          </button>
          <p className="hx-fine">{c.reserve.fineprint}</p>
        </form>
      )}
    </section>
  )
}

function Faq({ c }: { c: Content }) {
  const [open, setOpen] = React.useState(0 as number)
  const id = React.useId().replace(/[^a-zA-Z0-9]/g, "")
  return (
    <section id="faq" className="hx-sheet hx-paper hx-faq hx-reveal" aria-labelledby="hx-faq-h">
      <h2 id="hx-faq-h" className="hx-h2">
        {c.faq.title}
      </h2>
      <div className="hx-faq-list">
        {c.faq.items.map((f, i) => {
          const on = open === i
          return (
            <div key={f.q} className="hx-qa" data-open={on ? "true" : "false"}>
              <h3 className="hx-qa-h">
                <button type="button" aria-expanded={on} aria-controls={id + "a" + i} id={id + "q" + i} onClick={() => setOpen(on ? -1 : i)}>
                  <span className="hx-qa-n" aria-hidden="true">
                    Q.{String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="hx-qa-q">{f.q}</span>
                  <span className="hx-qa-x" aria-hidden="true" />
                </button>
              </h3>
              <div className="hx-qa-a" id={id + "a" + i} role="region" aria-labelledby={id + "q" + i} hidden={!on}>
                <p>{f.a}</p>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function Footer({ c, onTop }: { c: Content; onTop: () => void }) {
  return (
    <footer className="hx-foot">
      <div className="hx-foot-top">
        <p className="hx-foot-tag">{c.footer.tagline}</p>
        <nav className="hx-foot-cols" aria-label="Footer">
          {c.footer.columns.map((col) => (
            <div key={col.title}>
              <p className="hx-foot-h">{col.title}</p>
              <ul>
                {col.links.map((l) => (
                  <li key={l.label}>
                    <a href={l.href}>{l.label}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>
      <svg className="hx-wordmark" viewBox="0 0 1000 190" role="img" aria-label={c.brand}>
        <text x="0" y="172" textLength="1000" lengthAdjust="spacingAndGlyphs">
          {c.brand.toUpperCase()}
        </text>
      </svg>
      <div className="hx-foot-bottom">
        <p>
          © {new Date().getFullYear()} {c.brand}. {c.footer.legal}
        </p>
        <button type="button" className="hx-link" onClick={onTop}>
          Back to top <Arrow dir="up" />
        </button>
      </div>
    </footer>
  )
}

/* ------------------------------------------------------------------- root */

export default function HitchCargoLanding({
  preset = "signal",
  brand,
  accent,
  frameColor,
  theme = "auto",
  height = "100svh",
  currency,
  locale,
  nav,
  cta,
  hero,
  builds,
  autoplay = 7,
  base,
  modules,
  configurator,
  specs,
  ownership,
  riders,
  reserve,
  faq,
  footer,
  onReserve,
  className,
}: HitchCargoLandingProps) {
  const p = PRESETS[preset] || PRESETS.signal
  const catalog = mergeCatalog(p.modules, modules)
  const c: Content = {
    brand: brand || p.brand,
    accent: accent || p.accent,
    frameColor: frameColor || p.frameColor,
    currency: currency || p.currency,
    locale: locale || p.locale,
    nav: nav || p.nav,
    cta: cta || p.cta,
    hero: { ...p.hero, ...(hero || {}) },
    builds: builds && builds.length ? builds : p.builds,
    base: { ...p.base, ...(base || {}) },
    modules: catalog,
    configurator: { ...p.configurator, ...(configurator || {}) },
    specs: { ...p.specs, ...(specs || {}) },
    ownership: { ...p.ownership, ...(ownership || {}) },
    riders: { ...p.riders, ...(riders || {}) },
    reserve: { ...p.reserve, ...(reserve || {}) },
    faq: { ...p.faq, ...(faq || {}) },
    footer: { ...p.footer, ...(footer || {}) },
  }

  const rootRef = React.useRef(null as HTMLDivElement | null)
  const dark = useHostDark(rootRef, theme)
  const reduced = useReducedMotion()
  const [menu, setMenu] = React.useState(false)
  const [scrolled, setScrolled] = React.useState(false)
  const [build, setBuild] = React.useState(() => normalizeBuild((c.builds[0] && c.builds[0].modules) || [], catalog))
  const [note, setNote] = React.useState("")
  const menuBtn = React.useRef(null as HTMLButtonElement | null)
  const menuId = React.useId().replace(/[^a-zA-Z0-9]/g, "")

  const scrollToHash = (href: string) => {
    if (!href.startsWith("#")) return false
    const root = rootRef.current
    if (!root) return false
    const target = href === "#top" ? root : (root.querySelector(href) as HTMLElement | null)
    if (!target) return false
    target.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" })
    if (href === "#hx-main") target.focus({ preventScroll: true })
    return true
  }

  const onLink = (e: React.MouseEvent) => {
    const a = (e.target as HTMLElement).closest("a")
    if (!a) return
    const href = a.getAttribute("href") || ""
    if (scrollToHash(href)) {
      e.preventDefault()
      setMenu(false)
    }
  }

  React.useEffect(() => {
    const onScroll = () => setScrolled(scrollY > 8)
    onScroll()
    addEventListener("scroll", onScroll, { passive: true })
    return () => removeEventListener("scroll", onScroll)
  }, [])

  React.useEffect(() => {
    if (!menu) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenu(false)
        if (menuBtn.current) menuBtn.current.focus()
      }
    }
    addEventListener("keydown", onKey)
    const first = rootRef.current && (rootRef.current.querySelector(".hx-menu a") as HTMLElement | null)
    if (first) first.focus()
    return () => removeEventListener("keydown", onKey)
  }, [menu])

  // reveal sheets below the fold as they arrive; anything already on screen stays put
  React.useEffect(() => {
    const root = rootRef.current
    if (!root || reduced || typeof IntersectionObserver !== "function") return
    const below = Array.from(root.querySelectorAll(".hx-reveal")).filter((n) => n.getBoundingClientRect().top > innerHeight)
    below.forEach((n) => n.classList.add("hx-pre"))
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries)
          if (e.isIntersecting) {
            e.target.classList.remove("hx-pre")
            io.unobserve(e.target)
          }
      },
      { rootMargin: "0px 0px -8% 0px" }
    )
    below.forEach((n) => io.observe(n))
    return () => {
      io.disconnect()
      below.forEach((n) => n.classList.remove("hx-pre"))
    }
  }, [reduced])

  const style = {
    "--hx-accent": c.accent,
    "--hx-on-accent": readableOn(c.accent),
    "--hx-frame": c.frameColor,
  } as React.CSSProperties

  return (
    <div
      ref={rootRef}
      id="top"
      className={"hx-root" + (className ? " " + className : "")}
      data-theme={theme === "auto" ? (dark ? "dark" : "light") : theme}
      data-reduced={reduced ? "true" : "false"}
      style={style}
      onClick={onLink}
    >
      <style>{HX_CSS}</style>
      <a className="hx-skip" href="#hx-main">
        Skip to content
      </a>
      <header className="hx-nav" data-scrolled={scrolled ? "true" : "false"}>
        <a className="hx-logo" href="#top" aria-label={c.brand + ", back to top"}>
          <svg viewBox="0 0 28 28" aria-hidden="true" className="hx-logo-mark">
            <circle cx="7" cy="20" r="5" fill="none" stroke="currentColor" strokeWidth="2.4" />
            <circle cx="21" cy="20" r="5" fill="none" stroke="currentColor" strokeWidth="2.4" />
            <path d="M3 10H17L21 20M7 20L12 10" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round" />
            <rect x="3" y="7" width="12" height="3" className="hx-logo-deck" />
          </svg>
          <span>{c.brand}</span>
        </a>
        <nav className="hx-links" aria-label="Main">
          {c.nav.map((l) => (
            <a key={l.label} href={l.href}>
              <span>{l.label}</span>
            </a>
          ))}
        </nav>
        <a className="hx-btn hx-btn-accent hx-nav-cta" href={c.cta.href}>
          <span>{c.cta.label}</span>
          <Arrow />
        </a>
        <button ref={menuBtn} type="button" className="hx-menu-btn" aria-expanded={menu} aria-controls={menuId} onClick={() => setMenu((m) => !m)}>
          <span className="hx-burger" aria-hidden="true">
            <i />
            <i />
          </span>
          <span className="hx-sr">{menu ? "Close menu" : "Open menu"}</span>
        </button>
        <div id={menuId} className="hx-menu" data-open={menu ? "true" : "false"} hidden={!menu}>
          <nav aria-label="Menu">
            {c.nav.map((l) => (
              <a key={l.label} href={l.href}>
                {l.label}
              </a>
            ))}
            <a href={c.cta.href} className="hx-menu-cta">
              {c.cta.label}
            </a>
          </nav>
        </div>
      </header>

      <main className="hx-main" id="hx-main" tabIndex={-1}>
        <Hero
          c={c}
          height={height}
          autoplay={autoplay}
          reduced={reduced}
          onBuild={(m) => {
            setBuild(m)
            setNote("Loaded into the builder. Change any part below.")
            scrollToHash("#configure")
          }}
        />
        <Configurator c={c} build={build} setBuild={setBuild} note={note} setNote={setNote} />
        <Specs c={c} />
        <Ownership c={c} />
        <Riders c={c} />
        <Reserve c={c} build={build} onReserve={onReserve} />
        <Faq c={c} />
      </main>
      <Footer c={c} onTop={() => scrollToHash("#top")} />
    </div>
  )
}

/* -------------------------------------------------------------------- css */

const HX_CSS = `
.hx-root{
  --hx-page:#d6d9dc;--hx-page-ink:#131416;--hx-page-muted:#4d5258;--hx-page-line:rgba(19,20,22,.16);
  --hx-panel:#1b1d20;--hx-card:#25282c;--hx-ink:#f1f2f3;--hx-muted:#a3a9b0;--hx-line:rgba(255,255,255,.1);
  --hx-paper:#eef0f1;--hx-paper-ink:#141517;--hx-paper-muted:#51575d;--hx-paper-line:rgba(20,21,23,.14);
  --hx-ease:cubic-bezier(.23,1,.32,1);--hx-ease-io:cubic-bezier(.77,0,.175,1);
  --hx-display:"Arial Black","Helvetica Neue",Inter,"Segoe UI",Arial,system-ui,sans-serif;
  --hx-sans:ui-sans-serif,system-ui,-apple-system,"Segoe UI","Helvetica Neue",Arial,sans-serif;
  --hx-mono:ui-monospace,"SF Mono",Menlo,"Cascadia Mono","Liberation Mono",monospace;
  --hx-gut:clamp(10px,1.6vw,20px);--hx-r:clamp(18px,2.2vw,30px);
  position:relative;width:100%;background:var(--hx-page);color:var(--hx-page-ink);
  font-family:var(--hx-sans);font-size:16px;line-height:1.5;overflow-x:clip;container-type:inline-size;
  -webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility;
}
.hx-root[data-theme="dark"]{
  --hx-page:#0c0d0e;--hx-page-ink:#f1f2f3;--hx-page-muted:#9ba1a8;--hx-page-line:rgba(255,255,255,.1);
  --hx-panel:#1a1c1f;--hx-card:#24272b;
  --hx-paper:#24272b;--hx-paper-ink:#f1f2f3;--hx-paper-muted:#a3a9b0;--hx-paper-line:rgba(255,255,255,.1);
}
.hx-root *,.hx-root *::before,.hx-root *::after{box-sizing:border-box}
.hx-root :where(h1,h2,h3,p,ul,ol,dl,dd,figure,blockquote,fieldset){margin:0;padding:0}
.hx-root :where(ul,ol){list-style:none}
.hx-root :where(button,input,select){font:inherit;color:inherit;letter-spacing:inherit}
.hx-root :where(button){background:none;border:0;cursor:pointer;padding:0}
.hx-root :where(a){color:inherit;text-decoration:none}
.hx-root ::selection{background:var(--hx-accent);color:var(--hx-on-accent)}
.hx-root :where(a,button,input,select,[tabindex]):focus-visible{outline:2px solid var(--hx-accent);outline-offset:3px;border-radius:6px}
.hx-nav :focus-visible,.hx-foot :focus-visible{outline-color:var(--hx-page-ink)}
.hx-skip{position:absolute;left:12px;top:-60px;z-index:30;padding:10px 16px;border-radius:999px;background:var(--hx-page-ink);color:var(--hx-page);font-weight:700;font-size:14px;transition:top .2s var(--hx-ease)}
.hx-skip:focus{top:12px}
.hx-root p{text-wrap:pretty}
.hx-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
.hx-ico{width:18px;height:18px;flex:none;display:block}
.hx-svg{display:block;width:100%;height:100%;max-width:none;overflow:visible}
.hx-photo{position:absolute;inset:0;width:100%;height:100%;max-width:none;object-fit:contain}

/* nav */
.hx-nav{position:sticky;top:0;z-index:20;display:flex;align-items:center;gap:10px;height:72px;padding:0 calc(var(--hx-gut) + 8px);background:var(--hx-page);transition:box-shadow .2s ease}
.hx-nav[data-scrolled="true"]{box-shadow:0 1px 0 var(--hx-page-line)}
.hx-logo{display:inline-flex;align-items:center;gap:8px;min-width:0;font-family:var(--hx-display);font-weight:900;font-size:clamp(18px,5cqi,22px);letter-spacing:-.02em;text-transform:uppercase;margin-right:auto}
.hx-logo-mark{width:30px;height:30px}
.hx-logo-deck{fill:var(--hx-accent)}
.hx-links{display:none;gap:4px}
.hx-links a{position:relative;padding:8px 12px;font-size:14px;font-weight:600;color:var(--hx-page-muted);transition:color .2s ease}
.hx-links a span{position:relative;display:inline-block}
.hx-links a span::after{content:"";position:absolute;left:0;right:0;bottom:-3px;height:2px;background:var(--hx-accent);transform:scaleX(0);transform-origin:right;transition:transform .25s var(--hx-ease)}
.hx-links a:hover{color:var(--hx-page-ink)}
.hx-links a:hover span::after{transform:scaleX(1);transform-origin:left}
.hx-nav .hx-nav-cta{height:40px;padding:0 14px;font-size:13px;letter-spacing:.03em}
.hx-nav .hx-nav-cta .hx-ico{display:none}
.hx-menu-btn{display:inline-flex;align-items:center;justify-content:center;width:44px;height:44px;border-radius:12px;background:var(--hx-panel);color:var(--hx-ink)}
.hx-burger{position:relative;width:18px;height:10px}
.hx-burger i{position:absolute;left:0;right:0;height:2px;background:currentColor;border-radius:2px;transition:transform .25s var(--hx-ease)}
.hx-burger i:first-child{top:0}
.hx-burger i:last-child{bottom:0}
.hx-menu-btn[aria-expanded="true"] .hx-burger i:first-child{transform:translateY(4px) rotate(45deg)}
.hx-menu-btn[aria-expanded="true"] .hx-burger i:last-child{transform:translateY(-4px) rotate(-45deg)}
.hx-menu{position:absolute;left:var(--hx-gut);right:var(--hx-gut);top:68px;background:var(--hx-panel);color:var(--hx-ink);border-radius:var(--hx-r);padding:12px;box-shadow:0 24px 48px -24px rgba(0,0,0,.5)}
.hx-menu[hidden]{display:none}
.hx-menu nav{display:flex;flex-direction:column}
.hx-menu a{font-family:var(--hx-display);font-weight:900;text-transform:uppercase;font-size:26px;letter-spacing:-.02em;padding:10px 12px;border-radius:12px;animation:hx-in .3s var(--hx-ease) both}
.hx-menu a:nth-child(2){animation-delay:.03s}.hx-menu a:nth-child(3){animation-delay:.06s}.hx-menu a:nth-child(4){animation-delay:.09s}.hx-menu a:nth-child(5){animation-delay:.12s}.hx-menu a:nth-child(6){animation-delay:.15s}
.hx-menu a:hover{background:var(--hx-card)}
.hx-menu .hx-menu-cta{margin-top:8px;background:var(--hx-accent);color:var(--hx-on-accent)}
.hx-menu .hx-menu-cta:hover{background:var(--hx-accent)}

/* buttons */
.hx-btn{position:relative;display:inline-flex;align-items:center;justify-content:center;gap:10px;height:46px;padding:0 18px 0 20px;border-radius:999px;font-weight:800;font-size:14px;letter-spacing:.04em;text-transform:uppercase;white-space:nowrap;overflow:hidden;isolation:isolate;transition:transform .16s var(--hx-ease),color .25s ease,background-color .25s ease,box-shadow .25s ease}
.hx-btn:active{transform:scale(.97)}
.hx-btn .hx-ico{transition:transform .3s var(--hx-ease)}
.hx-btn:hover .hx-ico{transform:translateX(4px)}
.hx-btn-accent{background:var(--hx-accent);color:var(--hx-on-accent)}
.hx-btn-accent::before{content:"";position:absolute;inset:0;z-index:-1;background:var(--hx-page-ink);transform:translateY(101%);transition:transform .35s var(--hx-ease)}
.hx-btn-accent:hover{color:var(--hx-page)}
.hx-btn-accent:hover::before{transform:none}
.hx-sheet .hx-btn-accent::before{background:var(--hx-ink)}
.hx-sheet .hx-btn-accent:hover{color:var(--hx-panel)}
.hx-btn-ghost{color:var(--hx-ink);box-shadow:inset 0 0 0 1.5px rgba(255,255,255,.28)}
.hx-btn-ghost:hover{box-shadow:inset 0 0 0 1.5px var(--hx-ink);background:rgba(255,255,255,.06)}
.hx-btn-wide{width:100%;height:54px;font-size:15px}
.hx-link{display:inline-flex;align-items:center;gap:6px;font-size:14px;font-weight:700;text-decoration:underline;text-decoration-thickness:1.5px;text-underline-offset:4px;text-decoration-color:var(--hx-accent);transition:text-underline-offset .2s var(--hx-ease)}
.hx-link:hover{text-underline-offset:7px}
.hx-link .hx-ico{width:15px;height:15px}

/* sheets */
.hx-main:focus{outline:none}
.hx-main{display:flex;flex-direction:column;gap:var(--hx-gut);padding:0 var(--hx-gut)}
.hx-sheet,.hx-hero{scroll-margin-top:84px;position:relative;background:var(--hx-panel);color:var(--hx-ink);border-radius:var(--hx-r);padding:clamp(22px,4vw,56px)}
.hx-paper{background:var(--hx-paper);color:var(--hx-paper-ink);--hx-muted:var(--hx-paper-muted);--hx-line:var(--hx-paper-line)}
.hx-h1,.hx-h2{font-family:var(--hx-display);font-weight:900;text-transform:uppercase;letter-spacing:-.025em;line-height:.92;text-wrap:balance}
.hx-h2{font-size:clamp(34px,5.2cqi,76px);margin-bottom:16px}
.hx-h2-xl{font-size:clamp(40px,7cqi,108px)}
.hx-h3{font-size:clamp(18px,1.6cqi,22px);font-weight:800;line-height:1.2;letter-spacing:-.01em}
.hx-lede{max-width:44ch;color:var(--hx-muted);font-size:clamp(15px,1.25cqi,17px)}
.hx-reveal{transition:opacity .6s var(--hx-ease),transform .7s var(--hx-ease)}
.hx-reveal.hx-pre{opacity:0;transform:translateY(28px)}

/* hero */
.hx-hero{--hx-h:100svh;display:flex;flex-direction:column;overflow:hidden;padding:clamp(12px,1.4vw,18px);gap:0}
.hx-hero-card{position:relative;z-index:1;display:grid;gap:20px;background:var(--hx-card);border-radius:calc(var(--hx-r) - 8px);padding:clamp(22px,3vw,44px) clamp(22px,3.4vw,52px) clamp(56px,6cqi,96px)}
.hx-h1{font-size:clamp(34px,10cqi,64px);min-height:calc(3 * .92em)}
.hx-h1-lead{color:var(--hx-ink)}
.hx-h1-tail{color:#80868e}
.hx-word{display:inline-block;animation:hx-word .55s var(--hx-ease) both}
.hx-hero-side{display:flex;flex-direction:column;gap:18px}
.hx-hero-body{color:var(--hx-muted);max-width:40ch;font-size:15px}
.hx-hero-buy{display:flex;align-items:center;gap:16px;flex-wrap:wrap}
.hx-price{display:flex;flex-direction:column;line-height:1.1}
.hx-price-label{font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--hx-muted)}
.hx-price-num{font-family:var(--hx-display);font-weight:900;font-size:26px;letter-spacing:-.01em;font-variant-numeric:tabular-nums}
.hx-stage{--hx-pw:100%;position:relative;z-index:2;flex:1 0 auto;display:flex;align-items:center;margin-top:clamp(-90px,-6cqi,-40px);touch-action:pan-y;user-select:none;-webkit-user-select:none}
.hx-stage-main{position:relative;width:var(--hx-pw);margin:0 auto}
.hx-plate{position:relative;width:100%;aspect-ratio:5/3}
.hx-peek{display:none;position:absolute;top:50%;transform:translateY(-50%);width:var(--hx-pw);opacity:.22;filter:saturate(.4);pointer-events:none}
.hx-peek-l{right:calc(50% + var(--hx-pw) / 2 - 3%)}
.hx-peek-r{left:calc(50% + var(--hx-pw) / 2 - 3%)}
.hx-arrow{position:absolute;top:58%;z-index:3;display:none;align-items:center;justify-content:center;width:52px;height:52px;border-radius:50%;color:var(--hx-ink);box-shadow:inset 0 0 0 1.5px rgba(255,255,255,.3);background:rgba(26,28,31,.6);transition:transform .16s var(--hx-ease),box-shadow .2s ease,background-color .2s ease}
.hx-arrow:hover{box-shadow:inset 0 0 0 1.5px var(--hx-accent);background:var(--hx-panel)}
.hx-arrow:active{transform:scale(.94)}
.hx-arrow-l{left:clamp(8px,2.4vw,32px)}
.hx-arrow-r{right:clamp(8px,2.4vw,32px)}
.hx-arrow-l:hover .hx-ico{transform:translateX(-3px)}
.hx-arrow-r:hover .hx-ico{transform:translateX(3px)}
.hx-arrow .hx-ico{transition:transform .25s var(--hx-ease)}
.hx-chips{display:flex;flex-wrap:wrap;gap:6px;padding:4px 6px 0}
.hx-chips li{font-size:12px;font-weight:600;padding:6px 10px;border-radius:999px;background:var(--hx-card);color:var(--hx-muted)}
.hx-chips li b,.hx-tag b,.hx-part-name b,.hx-summary b{font-family:var(--hx-mono);font-weight:600;font-size:.92em;margin-right:6px;color:var(--hx-muted)}
.hx-chips li[data-live="true"]{color:var(--hx-ink);box-shadow:inset 0 0 0 1.5px var(--hx-accent)}
.hx-bar{display:grid;grid-template-columns:1fr auto;align-items:center;gap:14px 16px;padding:16px 8px 6px}
.hx-caption{grid-column:1/-1;font-family:var(--hx-display);font-weight:900;text-transform:uppercase;letter-spacing:-.01em;font-size:20px;line-height:1}
.hx-ticks{display:flex;gap:4px}
.hx-tick{position:relative;width:26px;height:24px}
.hx-tick::before{content:"";position:absolute;left:0;right:0;top:9px;height:6px;border-radius:2px;background:#6b7179;transition:background-color .2s ease}
.hx-tick:hover::before{background:#9aa0a7}
.hx-tick-fill{position:absolute;left:0;right:0;top:9px;height:6px;border-radius:2px;background:var(--hx-accent);transform:scaleX(0);transform-origin:left}
.hx-tick[aria-current="true"] .hx-tick-fill{transform:scaleX(1)}
.hx-tick[aria-current="true"] .hx-tick-fill[style]{animation:hx-fill linear both}
.hx-tick[aria-current="true"]::before{background:color-mix(in srgb,var(--hx-accent) 35%,#2a2d31)}
.hx-count{display:flex;align-items:center;gap:10px}
.hx-count-num{font-family:var(--hx-mono);font-size:14px;color:var(--hx-muted);font-variant-numeric:tabular-nums}
.hx-pause{display:inline-flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:50%;color:var(--hx-ink);box-shadow:inset 0 0 0 1.5px rgba(255,255,255,.22);transition:box-shadow .2s ease,transform .16s var(--hx-ease)}
.hx-pause:hover{box-shadow:inset 0 0 0 1.5px var(--hx-ink)}
.hx-pause:active{transform:scale(.94)}
.hx-pause .hx-ico{width:14px;height:14px}

/* callouts */
.hx-tag{position:absolute;z-index:2;display:none;transform:translate(-50%,-50%) translateY(6px);opacity:0;white-space:nowrap;font-size:12px;font-weight:600;line-height:1;padding:7px 10px;border-radius:999px;background:var(--hx-panel);color:var(--hx-ink);box-shadow:inset 0 0 0 1px rgba(255,255,255,.18);transition:opacity .12s ease,transform .12s ease;pointer-events:none}
.hx-tag[data-on="true"]{opacity:1;transform:translate(-50%,-50%);transition:opacity .25s ease .26s,transform .3s var(--hx-ease) .26s}
.hx-tag[data-live="true"]{box-shadow:inset 0 0 0 1.5px var(--hx-accent)}
.hx-tag[data-live="true"] b{color:var(--hx-accent)}
.hx-lead path{stroke-dasharray:1;stroke-dashoffset:1;transition:stroke-dashoffset .12s ease}
.hx-lead circle{opacity:0;transition:opacity .12s ease}
.hx-lead[data-on="true"] path{stroke-dashoffset:0;transition:stroke-dashoffset .3s var(--hx-ease) .22s}
.hx-lead[data-on="true"] circle{opacity:1;transition:opacity .2s ease .2s}
.hx-lead{display:none}
.hx-lead-line{stroke:#c9cdd2}
.hx-lead-halo{stroke:var(--hx-panel)}
.hx-lead-dot{fill:#c9cdd2;stroke:var(--hx-panel);stroke-width:3}
.hx-lead[data-live="true"] .hx-lead-line{stroke:var(--hx-accent)}
.hx-lead[data-live="true"] .hx-lead-dot{fill:var(--hx-accent)}

/* the bike */
.hx-b-paint{stroke:var(--hx-frame)}
.hx-b-paint-fill{fill:var(--hx-frame)}
.hx-b-shine{stroke:#ffffff;opacity:.38}
.hx-b-shine-fill{fill:#ffffff;opacity:.3}
.hx-b-tire{stroke:#0b0c0d}
.hx-b-tread{stroke:#3a3e43}
.hx-b-rim{stroke:#5b6168}
.hx-b-spoke{stroke:#8d939a;opacity:.75}
.hx-b-rotor{stroke:#8d939a}
.hx-b-hub{fill:#2c2f33;stroke:#6b7178;stroke-width:2}
.hx-b-axle{fill:#9aa0a6}
.hx-b-fender{stroke:#2e3135}
.hx-b-chain{stroke:#71777e}
.hx-b-cog{stroke:#71777e}
.hx-b-post{stroke:#9ea4aa}
.hx-b-saddle{fill:#121315}
.hx-b-battery{stroke:#1e2023}
.hx-b-gauge{stroke:var(--hx-accent)}
.hx-b-fork{stroke:#2a2d31}
.hx-b-stem{stroke:#2a2d31}
.hx-b-bar{stroke:#2a2d31}
.hx-b-grip{stroke:#0e0f10}
.hx-b-rack{stroke:#2a2d31}
.hx-b-rack-fill{fill:#2a2d31}
.hx-b-lamp{fill:#2a2d31}
.hx-b-lens{fill:#f4f1e8}
.hx-b-taillight{fill:#c8312b}
.hx-b-holes{stroke:#1a1c1f}
.hx-b-stand{stroke:#3a3e43}
.hx-b-crank{stroke:#2a2d31}
.hx-b-far{opacity:.55}
.hx-b-ring{stroke:#7b8188}
.hx-b-pedal{fill:#1a1c1f}
.hx-b-ground{stroke:rgba(255,255,255,.12)}
.hx-paper .hx-b-ground{stroke:var(--hx-paper-line)}
.hx-b-shadow-a{stop-color:#000;stop-opacity:.55}
.hx-b-shadow-b{stop-color:#000;stop-opacity:0}
.hx-paper .hx-b-shadow-a{stop-opacity:.22}
.hx-m-pad{fill:#33373c}
.hx-m-rail{stroke:#b3b9bf}
.hx-m-glint{stroke:#ffffff;opacity:.35}
.hx-m-bracket{stroke:#2a2d31}
.hx-m-plate{fill:#3d4248}
.hx-m-load{fill:#6d737a}
.hx-m-load2{fill:#585e65}
.hx-m-tape{stroke:#8a9097}
.hx-m-strap{stroke:#17181a}
.hx-m-bag{fill:#2e3236}
.hx-m-bagtop{fill:#3b4046}
.hx-m-buckle{fill:#9aa0a6}
.hx-m-reflect{stroke:#d4d8dc;opacity:.8}
.hx-m-case{fill:#43484e}
.hx-m-lid{fill:#53595f}
.hx-m-rib{stroke:#383c41}
.hx-m-handle{stroke:#1d1f22}
.hx-m-box{fill:#4a4f55}
.hx-m-door{fill:none;stroke:#3a3e43}
.hx-m-badge{fill:var(--hx-frame)}
.hx-m-wire{stroke:#a6acb2}
.hx-m-wireframe{stroke:#b9bfc5}
.hx-m-wirefill{fill:rgba(255,255,255,.04)}
.hx-m-cell{fill:#25282c}
.hx-m-led{fill:var(--hx-accent)}
.hx-m-led-off{fill:#4a4f56}
.hx-mod{opacity:0;transform:translateY(-36px);transition:opacity .14s ease,transform 0s linear .15s}
.hx-mod[data-on="true"]{opacity:1;transform:none;transition:opacity .22s ease,transform .38s cubic-bezier(.3,1.25,.5,1)}
.hx-paper .hx-svg .hx-b-fork,.hx-paper .hx-svg .hx-b-stem,.hx-paper .hx-svg .hx-b-bar{stroke:#2a2d31}
.hx-dim-ext{stroke:var(--hx-muted);stroke-dasharray:3 4;opacity:.7}
.hx-dim-line{stroke:var(--hx-paper-ink)}
.hx-dim-head{fill:var(--hx-paper-ink)}
.hx-dimtag{position:absolute;transform:translate(-50%,-50%);font-family:var(--hx-mono);font-size:12px;font-weight:600;line-height:1;padding:5px 8px;border-radius:6px;background:var(--hx-paper);color:var(--hx-paper-ink);white-space:nowrap;font-variant-numeric:tabular-nums}

/* configurator */
.hx-config{display:grid;grid-template-areas:"head" "art" "side";gap:clamp(20px,3vw,40px) clamp(20px,3vw,48px)}
.hx-config-head{grid-area:head}
.hx-config-head .hx-lede{margin-top:-4px}
.hx-config-art{grid-area:art;display:flex;flex-direction:column;gap:16px;min-width:0}
.hx-config-art .hx-plate{background:var(--hx-card);border-radius:calc(var(--hx-r) - 8px)}
.hx-totals{display:grid;grid-template-columns:repeat(3,1fr);border-top:1px solid var(--hx-line)}
.hx-totals div{padding:14px 0 0;border-right:1px solid var(--hx-line);padding-left:14px}
.hx-totals div:first-child{padding-left:0}
.hx-totals div:last-child{border-right:0}
.hx-totals dt{font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--hx-muted)}
.hx-totals dd{font-family:var(--hx-display);font-weight:900;font-size:clamp(22px,2.6cqi,38px);letter-spacing:-.02em;line-height:1.1;font-variant-numeric:tabular-nums}
.hx-totals small{font-family:var(--hx-sans);font-size:.5em;font-weight:700;color:var(--hx-muted)}
.hx-config-side{grid-area:side;display:flex;flex-direction:column;gap:14px;min-width:0}
.hx-mount{border:0;display:flex;flex-direction:column;gap:6px;min-width:0}
.hx-mount legend{display:flex;justify-content:space-between;width:100%;padding:0 0 6px;font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase}
.hx-mount legend span{font-weight:600;letter-spacing:.02em;text-transform:none;color:var(--hx-muted)}
.hx-part{display:grid;grid-template-columns:auto 1fr auto;align-items:start;gap:12px;width:100%;text-align:left;padding:12px 14px;border-radius:14px;background:var(--hx-card);box-shadow:inset 0 0 0 1px transparent;transition:box-shadow .2s ease,background-color .2s ease,transform .16s var(--hx-ease)}
.hx-part:hover{box-shadow:inset 0 0 0 1px rgba(255,255,255,.22)}
.hx-part:active{transform:scale(.985)}
.hx-part[aria-pressed="true"]{box-shadow:inset 0 0 0 1.5px var(--hx-accent);background:color-mix(in srgb,var(--hx-accent) 8%,var(--hx-card))}
.hx-part-box{display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;margin-top:1px;border-radius:6px;box-shadow:inset 0 0 0 1.5px rgba(255,255,255,.45);color:var(--hx-on-accent);transition:background-color .2s ease,box-shadow .2s ease}
.hx-part-check{width:14px;height:14px;opacity:0;transform:scale(.6);transition:opacity .15s ease,transform .25s var(--hx-ease)}
.hx-part[aria-pressed="true"] .hx-part-box,.hx-check input:checked + .hx-part-box{background:var(--hx-accent);box-shadow:none}
.hx-part[aria-pressed="true"] .hx-part-check,.hx-check input:checked + .hx-part-box .hx-part-check{opacity:1;transform:none}
.hx-part-text{display:flex;flex-direction:column;gap:2px;min-width:0}
.hx-part-name{font-weight:700;font-size:15px}
.hx-part-note{font-size:13px;color:var(--hx-muted);line-height:1.4}
.hx-part-price{font-family:var(--hx-mono);font-size:13px;font-weight:600;font-variant-numeric:tabular-nums;color:var(--hx-muted);padding-top:2px}
.hx-part[aria-pressed="true"] .hx-part-price{color:var(--hx-ink)}
.hx-note{min-height:1.5em;font-size:14px;color:var(--hx-muted)}
.hx-config-cta{display:flex;align-items:center;gap:20px;flex-wrap:wrap}

/* specs */
.hx-specs{display:grid;gap:clamp(18px,2.4vw,32px)}
.hx-specs-head{display:grid;gap:4px}
.hx-specs .hx-plate{margin:0 auto;width:100%;max-width:1100px}
.hx-spec-grid{display:grid;grid-template-columns:1fr;border-top:1.5px solid var(--hx-paper-ink)}
.hx-spec-grid div{display:flex;justify-content:space-between;gap:16px;padding:12px 0;border-bottom:1px solid var(--hx-line)}
.hx-spec-grid dt{font-size:13px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--hx-muted)}
.hx-spec-grid dd{font-weight:700;text-align:right}

/* ownership */
.hx-own{display:grid;gap:clamp(20px,3vw,40px)}
.hx-steps{display:grid;border-top:1px solid var(--hx-line)}
.hx-step{display:grid;grid-template-columns:56px 1fr;grid-template-areas:"n h" "n p" "n t";gap:4px 14px;padding:20px 0;border-bottom:1px solid var(--hx-line)}
.hx-step-n{grid-area:n;font-family:var(--hx-display);font-weight:900;font-size:40px;line-height:.9;letter-spacing:-.03em;color:var(--hx-accent)}
.hx-step .hx-h3{grid-area:h}
.hx-step p{grid-area:p;color:var(--hx-muted);max-width:52ch}
.hx-step-time{grid-area:t;font-family:var(--hx-mono);font-size:13px;color:var(--hx-ink);margin-top:4px}

/* riders */
.hx-riders{display:grid;gap:clamp(20px,3vw,36px)}
.hx-riders-body{display:grid;gap:24px}
.hx-rider-list{display:flex;flex-direction:column;border-top:1px solid var(--hx-line)}
.hx-rider{display:flex;flex-direction:column;align-items:flex-start;gap:2px;width:100%;text-align:left;padding:14px 0 14px 18px;border-bottom:1px solid var(--hx-line);position:relative;transition:padding .3s var(--hx-ease)}
.hx-rider::before{content:"";position:absolute;left:0;top:18px;bottom:18px;width:3px;border-radius:2px;background:var(--hx-accent);transform:scaleY(0);transition:transform .3s var(--hx-ease)}
.hx-rider[aria-selected="true"]::before{transform:none}
.hx-rider:hover{padding-left:24px}
.hx-rider-name{font-weight:800;font-size:17px}
.hx-rider-meta{font-size:13px;color:var(--hx-muted)}
.hx-rider-meta i{font-style:normal;opacity:.6;margin:0 4px}
.hx-quote{display:flex;flex-direction:column;gap:20px;animation:hx-in .45s var(--hx-ease) both}
.hx-quote p{font-family:var(--hx-display);font-weight:900;font-size:clamp(24px,3.4cqi,50px);line-height:1.04;letter-spacing:-.02em;text-transform:uppercase;text-indent:-.4em}
.hx-quote figcaption{font-size:14px;color:var(--hx-muted);font-weight:600}
.hx-quote figcaption span{margin-left:10px;padding:4px 10px;border-radius:999px;background:var(--hx-card);color:var(--hx-ink);font-size:12px}

/* reserve */
.hx-reserve{display:grid;gap:clamp(24px,3vw,48px)}
.hx-reserve-head{display:flex;flex-direction:column;gap:16px}
.hx-summary{display:flex;flex-direction:column;gap:10px;margin-top:8px;max-width:520px}
.hx-summary-h{font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase}
.hx-summary ul{border-top:1px solid var(--hx-line)}
.hx-summary li{display:flex;justify-content:space-between;gap:12px;padding:9px 0;border-bottom:1px solid var(--hx-line);font-size:14px;font-variant-numeric:tabular-nums}
.hx-summary li span:last-child{font-family:var(--hx-mono);font-size:13px}
.hx-summary-total{font-weight:800}
.hx-summary .hx-link{align-self:flex-start}
.hx-form,.hx-done{display:flex;flex-direction:column;gap:16px;background:var(--hx-card);border-radius:calc(var(--hx-r) - 8px);padding:clamp(18px,2.6vw,36px);align-self:start}
.hx-field{display:flex;flex-direction:column;gap:6px}
.hx-field label{font-size:13px;font-weight:700}
.hx-field input,.hx-select select{height:50px;width:100%;padding:0 14px;border-radius:12px;border:0;background:var(--hx-panel);color:var(--hx-ink);box-shadow:inset 0 0 0 1px rgba(255,255,255,.34);transition:box-shadow .2s ease;appearance:none;-webkit-appearance:none}
.hx-field input:hover,.hx-select select:hover{box-shadow:inset 0 0 0 1px rgba(255,255,255,.55)}
.hx-field input:focus-visible,.hx-select select:focus-visible{outline:none;box-shadow:inset 0 0 0 2px var(--hx-accent)}
.hx-field[data-error="true"] input,.hx-field[data-error="true"] select{box-shadow:inset 0 0 0 2px #ff7a6b}
.hx-err{font-size:13px;color:#ff9b8f;font-weight:600}
.hx-select{position:relative}
.hx-select .hx-ico{position:absolute;right:14px;top:50%;transform:translateY(-50%);pointer-events:none;color:var(--hx-muted)}
.hx-select option{background:#1b1d20;color:#f1f2f3}
.hx-check{position:relative;display:flex;align-items:center;gap:12px;font-size:14px;font-weight:600;cursor:pointer;padding:4px 0}
.hx-check input{position:absolute;opacity:0;width:22px;height:22px;margin:0}
.hx-check input:focus-visible + .hx-part-box{outline:2px solid var(--hx-accent);outline-offset:3px}
.hx-fine{font-size:13px;color:var(--hx-muted)}
.hx-done{gap:10px;animation:hx-in .45s var(--hx-ease) both}
.hx-done-code{font-family:var(--hx-mono);font-size:clamp(28px,3cqi,40px);letter-spacing:.04em;color:var(--hx-accent);font-weight:700;line-height:1.1}
.hx-done p{color:var(--hx-muted)}
.hx-done .hx-link{align-self:flex-start;margin-top:6px;color:var(--hx-ink)}

/* faq */
.hx-faq{display:grid;gap:clamp(16px,2.4vw,32px)}
.hx-faq-list{border-top:1.5px solid var(--hx-paper-ink)}
.hx-qa{border-bottom:1px solid var(--hx-line)}
.hx-qa-h button{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:14px;width:100%;text-align:left;padding:18px 0;font-size:clamp(16px,1.5cqi,20px);font-weight:800;letter-spacing:-.01em}
.hx-qa-n{font-family:var(--hx-mono);font-size:12px;font-weight:600;color:var(--hx-muted);min-width:44px}
.hx-qa-q{transition:transform .3s var(--hx-ease)}
.hx-qa-h button:hover .hx-qa-q{transform:translateX(4px)}
.hx-qa-x{position:relative;width:30px;height:30px;border-radius:50%;box-shadow:inset 0 0 0 1.5px var(--hx-line);transition:transform .3s var(--hx-ease),background-color .2s ease}
.hx-qa-x::before,.hx-qa-x::after{content:"";position:absolute;left:50%;top:50%;width:12px;height:2px;margin:-1px 0 0 -6px;background:currentColor;border-radius:2px}
.hx-qa-x::after{transform:rotate(90deg);transition:transform .3s var(--hx-ease)}
.hx-qa[data-open="true"] .hx-qa-x{background:var(--hx-accent);color:var(--hx-on-accent);box-shadow:none}
.hx-qa[data-open="true"] .hx-qa-x::after{transform:rotate(0deg)}
.hx-qa-a{padding:0 44px 20px 58px;color:var(--hx-muted);max-width:76ch;animation:hx-in .3s var(--hx-ease) both}

/* footer */
.hx-foot{display:flex;flex-direction:column;gap:clamp(24px,4vw,48px);padding:clamp(40px,6vw,88px) calc(var(--hx-gut) + 8px) 24px;color:var(--hx-page-ink)}
.hx-foot-top{display:grid;gap:32px}
.hx-foot-tag{font-family:var(--hx-display);font-weight:900;text-transform:uppercase;font-size:clamp(22px,2.6cqi,34px);line-height:1;letter-spacing:-.02em;max-width:18ch}
.hx-foot-cols{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px}
.hx-foot-h{font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--hx-page-muted);margin-bottom:10px}
.hx-foot-cols li{padding:3px 0}
.hx-foot-cols a{font-weight:600;transition:color .2s ease}
.hx-foot-cols a:hover{color:var(--hx-page-muted);text-decoration:underline;text-decoration-color:var(--hx-accent);text-underline-offset:4px}
.hx-wordmark{display:block;width:100%;height:auto;max-width:none;overflow:visible}
.hx-wordmark text{font-family:var(--hx-display);font-weight:900;font-size:236px;letter-spacing:-.02em;fill:var(--hx-page-ink)}
.hx-foot-bottom{display:flex;flex-wrap:wrap;justify-content:space-between;gap:12px;font-size:13px;color:var(--hx-page-muted);border-top:1px solid var(--hx-page-line);padding-top:16px}
.hx-foot-bottom .hx-link{color:var(--hx-page-ink)}

@keyframes hx-in{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
@keyframes hx-word{from{opacity:0;transform:translateY(.35em)}to{opacity:1;transform:none}}
@keyframes hx-fill{from{transform:scaleX(0)}to{transform:scaleX(1)}}

@container (min-width:720px){
  .hx-nav{gap:20px}
  .hx-links{display:flex}
  .hx-nav .hx-nav-cta{height:46px;padding:0 18px 0 20px;font-size:14px}
  .hx-nav .hx-nav-cta .hx-ico{display:block}
  .hx-menu-btn,.hx-menu{display:none}
  .hx-menu[hidden]{display:none}

  .hx-arrow{display:inline-flex}
  .hx-stage{--hx-pw:min(90%,1080px,max(520px,calc((var(--hx-h) - 380px) * 1.6667)))}
  .hx-peek{display:block}
  .hx-h1{font-size:clamp(40px,7cqi,80px);min-height:calc(2 * .92em)}
  .hx-hero-side{flex-direction:row;align-items:flex-end;justify-content:space-between;gap:24px}
  .hx-hero-body{max-width:46ch}
  .hx-tag,.hx-lead{display:block}
  .hx-chips{display:none}
  .hx-bar{grid-template-columns:1fr auto 1fr;padding:14px 28px 14px}
  .hx-caption{grid-column:auto;font-size:24px}
  .hx-count{justify-content:flex-end}
  .hx-tick{width:34px}
  .hx-spec-grid{grid-template-columns:repeat(3,minmax(0,1fr));column-gap:32px}
  .hx-step{grid-template-columns:90px minmax(0,1.1fr) minmax(0,1.6fr) 140px;grid-template-areas:"n h p t";align-items:baseline;padding:26px 0}
  .hx-step-n{font-size:56px}
  .hx-step-time{text-align:right;margin:0}
  .hx-own-head,.hx-specs-head{grid-template-columns:minmax(0,1.6fr) minmax(0,1fr);align-items:end;display:grid;gap:24px}
  .hx-own-head .hx-lede,.hx-specs-head .hx-lede{justify-self:end}
  .hx-riders-body{grid-template-columns:minmax(0,1fr) minmax(0,2.2fr);gap:56px;align-items:start}
  .hx-reserve{grid-template-columns:minmax(0,1.15fr) minmax(0,1fr)}
  .hx-faq{grid-template-columns:minmax(0,1fr) minmax(0,2fr);align-items:start}
  .hx-foot-top{grid-template-columns:minmax(0,1fr) minmax(0,1.3fr)}
}
@container (min-width:1080px){
  .hx-hero-card{grid-template-columns:minmax(0,2.3fr) minmax(0,1fr);align-items:start;gap:40px;padding-bottom:clamp(40px,3cqi,56px)}
  .hx-hero-side{flex-direction:column;align-items:stretch;justify-content:flex-start;padding-top:10px}
  .hx-h1{font-size:clamp(40px,5.4cqi,80px);min-height:calc(3 * .92em)}
  .hx-stage{--hx-pw:min(84%,1080px,max(560px,calc((var(--hx-h) - 380px) * 1.6667)))}
  .hx-config{grid-template-columns:minmax(0,1.55fr) minmax(0,1fr);grid-template-areas:"art head" "art side";grid-template-rows:auto 1fr;align-items:start}
  .hx-config-art{position:sticky;top:90px}
}
@container (max-width:719px){
  .hx-dimtag{font-size:10px;padding:3px 5px}
  .hx-dimtag-deck{display:none}
  .hx-qa-a{padding:0 0 18px 58px}
}

@media (prefers-reduced-motion:reduce){
  .hx-root *,.hx-root *::before,.hx-root *::after{animation-duration:.01ms !important;animation-iteration-count:1 !important;transition-duration:.01ms !important;transition-delay:0ms !important;scroll-behavior:auto !important}
}
`
