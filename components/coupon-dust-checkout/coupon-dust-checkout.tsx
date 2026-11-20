"use client"
import { useEffect, useRef, useState } from "react"

export type CouponStop = [number, string]

export interface CouponDustCoupon {
  /** Code printed on the ticket, e.g. "GLOW70". */
  code: string
  /** Percentage taken off the subtotal. */
  percent: number
  /** Gradient stops (position 0..1, hex). The dust is tinted from the same stops. */
  tint?: CouponStop[]
}

export interface CouponDustCheckoutProps {
  coupons?: CouponDustCoupon[]
  /** Items subtotal before any discount. */
  subtotal?: number
  currency?: string
  address?: string
  /** Shipping options: [label, eta, price]. */
  shipping?: [string, string, number][]
  /** Height of the stage the card is centred in. */
  height?: string | number
  className?: string
  onApply?: (code: string, saving: number) => void
  onPlaceOrder?: (total: number) => void
}

// #region model
/** Fixed card geometry in px. The particle paths are computed from these, never from layout reads. */
export const L = {
  PAD: 20,
  CW: 148,
  CH: 52,
  GAP: 10,
  COUPON_TOP: 64,
  CHIP_W: 56,
  CHIP_H: 22,
  /** Distance from the card's bottom edge to the chip's centre line. */
  CHIP_FROM_BOTTOM: 37,
  /** How far the total lifts when the "You save" line opens. */
  LIFT: 9,
  CARD_H: 438,
  /** Order-placed view: top padding and the badge's centre line (badge is 64 px). */
  CONFIRM_TOP: 91,
  CONFIRM_BADGE_Y: 123,
}

/** Place-order sequence, seconds from the press. */
export const O = {
  check: 1.15,
  view: 1.55,
  burst: 1.8,
  reducedCheck: 0.5,
  reducedView: 0.8,
}

/** A stable, made-up order number for a total. */
export function orderNumber(total: number) {
  return "CD-" + (4000 + (Math.round(total * 100) * 37) % 6000)
}

/** Timeline in seconds from the tap, measured off the reference at 60 fps. */
export const T = {
  wipeAt: 0.13,
  wipe: 0.32,
  depart: 0.5,
  departSpread: 0.38,
  travel: 0.48,
  slot: 0.85,
  save: 1.45,
  saveDur: 0.3,
  swap: 1.8,
  end: 2.1,
}

export function clamp01(x: number) {
  return x < 0 ? 0 : x > 1 ? 1 : x
}

export function easeInOutCubic(x: number) {
  x = clamp01(x)
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2
}

export function bezier(a: number, b: number, c: number, d: number, s: number) {
  const m = 1 - s
  return m * m * m * a + 3 * m * m * s * b + 3 * m * s * s * c + s * s * s * d
}

export function round2(n: number) {
  return Math.round(n * 100) / 100
}

export function saving(subtotal: number, percent: number) {
  return round2((subtotal * percent) / 100)
}

export function money(n: number, currency: string) {
  const v = Math.max(0, round2(n))
  const [i, d] = v.toFixed(2).split(".")
  return currency + i.replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "." + d
}

export function hexRgb(hex: string): [number, number, number] {
  let h = hex.replace("#", "")
  if (h.length === 3) h = h.split("").map((c) => c + c).join("")
  const n = parseInt(h, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

export function sampleStops(stops: CouponStop[], x: number): [number, number, number] {
  x = clamp01(x)
  for (let i = 1; i < stops.length; i++) {
    if (x <= stops[i][0]) {
      const [p0, c0] = stops[i - 1]
      const [p1, c1] = stops[i]
      const k = p1 === p0 ? 0 : (x - p0) / (p1 - p0)
      const a = hexRgb(c0)
      const b = hexRgb(c1)
      return [0, 1, 2].map((j) => Math.round(a[j] + (b[j] - a[j]) * k)) as [number, number, number]
    }
  }
  return hexRgb(stops[stops.length - 1][1])
}

/** The ragged dissolve edge, in px from the coupon's left side, at height v (0..1). */
export function edgeX(v: number, p: number, t: number) {
  return p * (L.CW + 30) - 15 + 7 * Math.sin(v * 8.5 + t * 17) + 4 * Math.sin(v * 21 - t * 11)
}

/** Left edge of coupon i inside the card, given the row's horizontal scroll. */
export function couponX(i: number, scroll: number) {
  return L.PAD + i * (L.CW + L.GAP) - scroll
}

/** How far the total has lifted (px) at time t. */
export function liftAt(t: number) {
  return L.LIFT * easeInOutCubic((t - T.save) / T.saveDur)
}

export function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
// #endregion

const HOLO: CouponStop[] = [
  [0, "#f6c9ec"],
  [0.22, "#cddcff"],
  [0.42, "#b8f0e1"],
  [0.6, "#eef3c4"],
  [0.8, "#dcc6ff"],
  [1, "#f9d6ef"],
]
const LILAC: CouponStop[] = [
  [0, "#e9dcff"],
  [0.5, "#d6c6fb"],
  [1, "#f0e7ff"],
]
const SILVER: CouponStop[] = [
  [0, "#f4f4f7"],
  [0.5, "#d9dae2"],
  [1, "#f8f8fb"],
]

const DEFAULT_COUPONS: CouponDustCoupon[] = [
  { code: "GLOW70", percent: 70, tint: HOLO },
  { code: "GLOW50", percent: 50, tint: LILAC },
  { code: "GLOW30", percent: 30, tint: SILVER },
]

const DEFAULT_SHIPPING: [string, string, number][] = [
  ["Standard", "3–5 business days", 0],
  ["Express", "1–2 business days", 12],
]

function tintOf(c: CouponDustCoupon, i: number) {
  return c.tint && c.tint.length > 1 ? c.tint : [HOLO, LILAC, SILVER][i % 3]
}

function ticketBg(stops: CouponStop[]) {
  const s = stops.map(([p, c]) => c + " " + Math.round(p * 100) + "%").join(",")
  return (
    "radial-gradient(120% 90% at 28% 18%,rgba(255,255,255,.6),rgba(255,255,255,0) 58%)," +
    "linear-gradient(115deg," + s + ")"
  )
}

function badgePath() {
  const pts: string[] = []
  const n = 24
  for (let k = 0; k < n; k++) {
    const a = (k / n) * Math.PI * 2 - Math.PI / 2
    const r = k % 2 ? 10.4 : 12
    pts.push((12 + r * Math.cos(a)).toFixed(2) + " " + (12 + r * Math.sin(a)).toFixed(2))
  }
  return "M" + pts.join("L") + "Z"
}
const BADGE = badgePath()

const CSS =
  ".cdc-root{position:relative;display:grid;place-items:center;width:100%;padding:16px;box-sizing:border-box;background:var(--color-background);overflow:hidden}" +
  ".cdc-card{position:relative;width:min(100%,420px);height:" + L.CARD_H + "px;box-sizing:border-box;padding:22px " + L.PAD + "px 0;border-radius:28px;background:#0a0a0b;color:#f4f4f6;overflow:hidden;font-size:15px;line-height:20px;-webkit-font-smoothing:antialiased;box-shadow:0 0 0 1px rgba(255,255,255,.07),0 30px 60px -20px rgba(0,0,0,.45)}" +
  ".cdc-head{display:flex;align-items:center;justify-content:space-between;height:22px}" +
  ".cdc-h{margin:0;font-size:17px;line-height:22px;font-weight:600;letter-spacing:-.01em}" +
  ".cdc-link{appearance:none;border:0;background:none;padding:0;font:inherit;font-size:15px;line-height:22px;color:#a6a6ad;cursor:pointer;transition:color .25s}" +
  ".cdc-link:hover{color:#f4f4f6}" +
  ".cdc-link-on{color:#f4f4f6}" +
  ".cdc-busy .cdc-dim{color:#55555b}" +
  ".cdc-slot{position:relative;display:grid;margin-top:14px;height:64px}" +
  ".cdc-slot>*{grid-area:1/1}" +
  ".cdc-row{display:flex;gap:" + L.GAP + "px;margin:0 -" + L.PAD + "px;padding:6px " + L.PAD + "px;height:64px;box-sizing:border-box;overflow-x:auto;overflow-y:hidden;scrollbar-width:none;-webkit-mask:linear-gradient(90deg,#0000,#000 " + L.PAD + "px,#000 calc(100% - " + (L.PAD + 8) + "px),#0000);mask:linear-gradient(90deg,#0000,#000 " + L.PAD + "px,#000 calc(100% - " + (L.PAD + 8) + "px),#0000);transition:opacity .16s ease .14s,filter .16s ease .14s,transform .16s ease .14s}" +
  ".cdc-row::-webkit-scrollbar{display:none}" +
  ".cdc-on .cdc-row{opacity:0;filter:blur(6px);transform:scale(.98);pointer-events:none;transition-delay:0s}" +
  ".cdc-coupon{appearance:none;position:relative;flex:none;width:" + L.CW + "px;height:" + L.CH + "px;padding:0;border:0;border-radius:10px;color:#191426;font:inherit;cursor:pointer;text-align:left;" +
  "-webkit-mask:radial-gradient(circle 5px at 69% 0,#0000 96%,#000) top/100% 51% no-repeat,radial-gradient(circle 5px at 69% 100%,#0000 96%,#000) bottom/100% 51% no-repeat;" +
  "mask:radial-gradient(circle 5px at 69% 0,#0000 96%,#000) top/100% 51% no-repeat,radial-gradient(circle 5px at 69% 100%,#0000 96%,#000) bottom/100% 51% no-repeat}" +
  ".cdc-coupon:focus-visible{outline:none}" +
  ".cdc-face{position:absolute;inset:0;border-radius:10px;box-shadow:inset 0 0 0 1px rgba(255,255,255,.55),inset 0 -1px 2px rgba(60,40,90,.12);transition:transform .16s ease,filter .2s}" +
  ".cdc-coupon:hover .cdc-face{filter:brightness(1.06)}" +
  ".cdc-coupon:active .cdc-face{transform:scale(.965)}" +
  ".cdc-coupon:focus-visible .cdc-face{box-shadow:inset 0 0 0 2px #7c5cff}" +
  ".cdc-seam{position:absolute;left:69%;top:8px;bottom:8px;border-left:1px dashed rgba(25,20,38,.22)}" +
  ".cdc-tag{position:absolute;left:10px;top:7px;font-size:8px;line-height:10px;font-weight:600;letter-spacing:.02em;opacity:.7}" +
  ".cdc-line{position:absolute;left:0;right:0;top:19px;display:flex;align-items:baseline;height:22px;white-space:nowrap}" +
  ".cdc-code{flex:1;min-width:0;margin-left:10px;font-size:16px;line-height:22px;font-weight:700;letter-spacing:-.01em}" +
  ".cdc-pct{flex:none;width:31%;text-align:center;font-size:14px;line-height:22px;font-weight:700;letter-spacing:-.01em}" +
  ".cdc-banner{display:flex;align-items:center;gap:12px;align-self:center;height:56px;padding:0 10px 0 12px;box-sizing:border-box;border-radius:16px;background:#19191b;box-shadow:inset 0 0 0 1px rgba(255,255,255,.05);opacity:0;transform:translateY(6px);filter:blur(4px);pointer-events:none;transition:opacity .2s ease,transform .2s ease,filter .2s ease}" +
  ".cdc-on .cdc-banner{opacity:1;transform:translateY(0);filter:blur(0);pointer-events:auto;transition:opacity .3s ease .14s,transform .3s cubic-bezier(.2,.8,.2,1) .14s,filter .3s ease .14s}" +
  ".cdc-badge{flex:none;color:#3ccf73}" +
  ".cdc-btxt{flex:1;min-width:0}" +
  ".cdc-bt{display:block;font-size:15px;line-height:19px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}" +
  ".cdc-bs{display:block;font-size:13px;line-height:17px;color:#4ade80;white-space:nowrap}" +
  ".cdc-x{appearance:none;flex:none;display:grid;place-items:center;width:28px;height:28px;padding:0;border:0;border-radius:999px;background:#2b2b2e;color:#b5b5bb;cursor:pointer;transition:background .2s,color .2s}" +
  ".cdc-x:hover{background:#38383c;color:#fff}" +
  ".cdc-del{margin-top:14px}" +
  ".cdc-addr{margin:10px 0 0;height:20px;font-size:14px;line-height:20px;color:#a6a6ad;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}" +
  ".cdc-addr b{font-weight:600;color:#f4f4f6;font-size:15px}" +
  ".cdc-opts{margin-top:14px;border:1px solid rgba(255,255,255,.1);border-radius:16px;overflow:hidden}" +
  ".cdc-opt{display:flex;align-items:center;gap:14px;height:62px;padding:0 16px;box-sizing:border-box;cursor:pointer;position:relative}" +
  ".cdc-opt+.cdc-opt{border-top:1px solid rgba(255,255,255,.08);height:63px}" +
  ".cdc-opt input{position:absolute;opacity:0;width:1px;height:1px;margin:0}" +
  ".cdc-radio{flex:none;width:20px;height:20px;border-radius:999px;box-sizing:border-box;border:1.5px solid #6b6b72;display:grid;place-items:center;transition:border-color .2s}" +
  ".cdc-radio::after{content:'';width:10px;height:10px;border-radius:999px;background:#fff;transform:scale(0);transition:transform .2s cubic-bezier(.2,.8,.2,1)}" +
  ".cdc-opt input:checked+.cdc-radio{border-color:#fff}" +
  ".cdc-opt input:checked+.cdc-radio::after{transform:scale(1)}" +
  ".cdc-opt input:focus-visible+.cdc-radio{box-shadow:0 0 0 3px rgba(124,92,255,.6)}" +
  ".cdc-ol{flex:1;min-width:0}" +
  ".cdc-on1{display:block;font-size:15px;line-height:20px;font-weight:500}" +
  ".cdc-on2{display:block;font-size:13px;line-height:18px;color:#8d8d94}" +
  ".cdc-op{font-size:15px;line-height:20px;font-weight:500;font-variant-numeric:tabular-nums}" +
  ".cdc-foot{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:18px -" + L.PAD + "px 0;padding:14px " + L.PAD + "px;height:91px;box-sizing:border-box;border-top:1px solid rgba(255,255,255,.08)}" +
  ".cdc-sum{display:grid;grid-template-rows:16px 28px 0fr;min-width:0;transition:grid-template-rows .3s cubic-bezier(.65,0,.35,1)}" +
  ".cdc-saved .cdc-sum{grid-template-rows:16px 28px 1fr}" +
  ".cdc-tl{font-size:12px;line-height:16px;color:#8d8d94}" +
  ".cdc-amtrow{display:flex;align-items:center;height:28px;white-space:nowrap}" +
  ".cdc-chipslot{display:block;flex:none;width:0;height:" + L.CHIP_H + "px;overflow:hidden;transition:width .32s cubic-bezier(.3,.7,.2,1)}" +
  ".cdc-open .cdc-chipslot{width:" + (L.CHIP_W + 8) + "px}" +
  ".cdc-chip{position:relative;display:block;width:" + L.CHIP_W + "px;height:" + L.CHIP_H + "px;border-radius:4px;color:#191426;opacity:0;transition:opacity .2s;" +
  "-webkit-mask:radial-gradient(circle 2px at 69% 0,#0000 96%,#000) top/100% 51% no-repeat,radial-gradient(circle 2px at 69% 100%,#0000 96%,#000) bottom/100% 51% no-repeat;" +
  "mask:radial-gradient(circle 2px at 69% 0,#0000 96%,#000) top/100% 51% no-repeat,radial-gradient(circle 2px at 69% 100%,#0000 96%,#000) bottom/100% 51% no-repeat}" +
  ".cdc-open .cdc-chip{opacity:1;transition:none}" +
  ".cdc-cline{position:absolute;left:0;right:0;top:7px;display:flex;align-items:baseline;height:8px;white-space:nowrap}" +
  ".cdc-cc{flex:1;min-width:0;margin-left:4px;font-size:6.5px;line-height:8px;font-weight:800}" +
  ".cdc-cp{flex:none;width:31%;text-align:center;font-size:6px;line-height:8px;font-weight:700}" +
  ".cdc-amt{font-size:22px;line-height:28px;font-weight:700;letter-spacing:-.01em;font-variant-numeric:tabular-nums}" +
  ".cdc-ch{display:inline-block;white-space:pre}" +
  ".cdc-savewrap{overflow:hidden;min-height:0}" +
  ".cdc-save{display:block;font-size:13px;line-height:18px;color:#4ade80;opacity:0;transition:opacity .25s ease}" +
  ".cdc-saved .cdc-save{opacity:1;transition:opacity .35s ease .05s}" +
  ".cdc-place{appearance:none;position:relative;flex:none;display:grid;grid-template:100%/100%;width:136px;height:48px;padding:0;border:0;border-radius:999px;background:#fff;color:#0a0a0b;font:inherit;font-size:16px;font-weight:600;cursor:pointer;overflow:hidden;transition:width .34s cubic-bezier(.3,.7,.2,1),background .25s,transform .15s}" +
  ".cdc-place>*{grid-area:1/1;place-self:center;min-width:0}" +
  ".cdc-place:hover{background:#e9e9ee}" +
  ".cdc-place:active{transform:scale(.97)}" +
  ".cdc-place:disabled{cursor:default}" +
  ".cdc-busy .cdc-place{opacity:.55;transition:opacity .2s}" +
  ".cdc-pl{max-width:100%;overflow:hidden;white-space:nowrap;line-height:20px;transition:opacity .12s}" +
  ".cdc-spin,.cdc-tick{display:block;opacity:0;transition:opacity .2s}" +
  ".cdc-spin{animation:cdc-rot .8s linear infinite}" +
  ".cdc-tick path{stroke-dasharray:20;stroke-dashoffset:20;transition:stroke-dashoffset .32s cubic-bezier(.3,.7,.2,1) .08s}" +
  ".cdc-ord1 .cdc-place,.cdc-ord2 .cdc-place,.cdc-ord3 .cdc-place{width:48px;transform:none}" +
  ".cdc-ord1 .cdc-pl,.cdc-ord2 .cdc-pl,.cdc-ord3 .cdc-pl{opacity:0}" +
  ".cdc-ord1 .cdc-spin{opacity:1;transition-delay:.16s}" +
  ".cdc-ord2 .cdc-place,.cdc-ord3 .cdc-place{background:#3ccf73}" +
  ".cdc-ord2 .cdc-tick,.cdc-ord3 .cdc-tick{opacity:1}" +
  ".cdc-ord2 .cdc-tick path,.cdc-ord3 .cdc-tick path{stroke-dashoffset:0}" +
  "@keyframes cdc-rot{to{transform:rotate(360deg)}}" +
  ".cdc-main{transition:opacity .26s ease .18s,filter .26s ease .18s,transform .26s ease .18s}" +
  ".cdc-ord3 .cdc-main{opacity:0;filter:blur(6px);transform:translateY(-8px);pointer-events:none;transition-delay:0s}" +
  ".cdc-done{position:absolute;inset:0;z-index:1;display:flex;flex-direction:column;align-items:center;padding:" + L.CONFIRM_TOP + "px " + L.PAD + "px 0;box-sizing:border-box;text-align:center;opacity:0;pointer-events:none;transition:opacity .2s ease}" +
  ".cdc-ord3 .cdc-done{opacity:1;pointer-events:auto;transition:opacity .3s ease .14s}" +
  ".cdc-done>*{transform:translateY(8px);opacity:0;transition:transform .2s ease,opacity .2s ease}" +
  ".cdc-ord3 .cdc-done>*{transform:translateY(0);opacity:1;transition:transform .5s cubic-bezier(.2,.8,.2,1),opacity .35s ease}" +
  ".cdc-ord3 .cdc-done>:nth-child(1){transition-delay:.16s}" +
  ".cdc-ord3 .cdc-done>:nth-child(2){transition-delay:.22s}" +
  ".cdc-ord3 .cdc-done>:nth-child(3){transition-delay:.28s}" +
  ".cdc-ord3 .cdc-done>:nth-child(4){transition-delay:.34s}" +
  ".cdc-ord3 .cdc-done>:nth-child(5){transition-delay:.4s}" +
  ".cdc-ord3 .cdc-done>:nth-child(6){transition-delay:.46s}" +
  ".cdc-dbadge{display:block;flex:none;width:64px;height:64px;color:#3ccf73}" +
  ".cdc-done>.cdc-dbadge{transform:scale(.5)}" +
  ".cdc-ord3 .cdc-done>.cdc-dbadge{transform:scale(1);transition:transform .55s cubic-bezier(.3,1.6,.5,1) .16s,opacity .2s ease .16s}" +
  ".cdc-dt{margin:18px 0 0;height:28px;font-size:22px;line-height:28px;font-weight:700;letter-spacing:-.01em}" +
  ".cdc-dl{display:block;max-width:100%;height:20px;font-size:14px;line-height:20px;color:#a6a6ad;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}" +
  ".cdc-dl+.cdc-dl{margin-top:4px}" +
  ".cdc-dt+.cdc-dl{margin-top:8px}" +
  ".cdc-dg{color:#4ade80}" +
  ".cdc-back{appearance:none;flex:none;margin-top:26px;height:44px;padding:0 22px;border:0;border-radius:999px;background:#232326;color:#f4f4f6;font:inherit;font-size:15px;font-weight:600;cursor:pointer;transition:background .2s}" +
  ".cdc-back:hover{background:#2e2e32}" +
  ".cdc-canvas{position:absolute;left:0;top:0;width:100%;height:100%;max-width:none;pointer-events:none;z-index:2}" +
  ".cdc-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}" +
  "@media (prefers-reduced-motion:reduce){.cdc-row,.cdc-banner,.cdc-on .cdc-banner,.cdc-chipslot,.cdc-sum,.cdc-save,.cdc-saved .cdc-save,.cdc-face,.cdc-main,.cdc-done,.cdc-done>*,.cdc-place{transition:opacity .2s linear!important;transform:none!important;filter:none!important}.cdc-spin{animation:none}}"

type Dust = {
  n: number
  sx: Float32Array
  sy: Float32Array
  tx: Float32Array
  ty: Float32Array
  u: Float32Array
  v: Float32Array
  rel: Float32Array
  dep: Float32Array
  dur: Float32Array
  vx: Float32Array
  vy: Float32Array
  j1x: Float32Array
  j1y: Float32Array
  j2x: Float32Array
  j2y: Float32Array
  lat: Float32Array
  size: Float32Array
  tw: Float32Array
  col: string[]
}

function makeDust(seed: number, x0: number, y0: number, tx0: number, ty0: number, stops: CouponStop[]): Dust {
  const rnd = mulberry32(seed)
  const n = Math.round((L.CW * L.CH) / 4.4)
  const f = () => new Float32Array(n)
  const d: Dust = {
    n, sx: f(), sy: f(), tx: f(), ty: f(), u: f(), v: f(), rel: f(), dep: f(), dur: f(), vx: f(), vy: f(),
    j1x: f(), j1y: f(), j2x: f(), j2y: f(), lat: f(), size: f(), tw: f(), col: [],
  }
  for (let k = 0; k < n; k++) {
    const u = rnd()
    const v = rnd()
    d.u[k] = u
    d.v[k] = v
    d.sx[k] = x0 + u * L.CW
    d.sy[k] = y0 + v * L.CH
    d.tx[k] = tx0 + u * L.CHIP_W
    d.ty[k] = ty0 + v * L.CHIP_H
    d.rel[k] = -1
    d.dep[k] = T.depart + u * T.departSpread + rnd() * 0.04
    d.dur[k] = T.travel * (0.95 + rnd() * 0.1)
    d.vx[k] = -22 + rnd() * 42
    d.vy[k] = (v - 0.5) * 44 + (rnd() - 0.6) * 28
    d.j1x[k] = (rnd() - 0.5) * 36
    d.j1y[k] = (rnd() - 0.5) * 36
    d.j2x[k] = (rnd() - 0.5) * 40
    d.j2y[k] = (rnd() - 0.5) * 30
    d.lat[k] = (rnd() - 0.5) * 2
    const spark = rnd() < 0.07
    d.size[k] = spark ? 2 : 1 + rnd() * 0.7
    d.tw[k] = rnd() * 6.283
    const base = sampleStops(stops, u * 0.75 + v * 0.25)
    const w = spark ? 0.85 : 0.3 + rnd() * 0.55
    const c = base.map((x) => Math.round(x + (255 - x) * w))
    d.col.push("rgb(" + c[0] + "," + c[1] + "," + c[2] + ")")
  }
  return d
}

const KIND_DIGIT = /[0-9]/

export default function CouponDustCheckout({
  coupons = DEFAULT_COUPONS,
  subtotal = 134,
  currency = "$",
  address = "48 Orchard Lane, Portland OR 97209",
  shipping = DEFAULT_SHIPPING,
  height = "100svh",
  className = "",
  onApply,
  onPlaceOrder,
}: CouponDustCheckoutProps) {
  const [phase, setPhase] = useState(0)
  const [active, setActive] = useState(-1)
  const [ship, setShip] = useState(0)
  /** 0 checkout, 1 placing (spinner), 2 placed (check), 3 order-placed view */
  const [order, setOrder] = useState(0)
  const timers = useRef([] as number[])
  /** What the order view shows, frozen at the press so it can't change while it fades out. */
  const [receipt, setReceipt] = useState({ paid: 0, saved: "", ship: "" })
  const burstRaf = useRef(0)

  const cardRef = useRef(null as HTMLDivElement | null)
  const rowRef = useRef(null as HTMLDivElement | null)
  const canvasRef = useRef(null as HTMLCanvasElement | null)
  const chipRef = useRef(null as HTMLSpanElement | null)
  const amtRef = useRef(null as HTMLSpanElement | null)
  const couponRefs = useRef([] as (HTMLButtonElement | null)[])
  const size = useRef({ w: 380, h: L.CARD_H, dpr: 1 })
  const run = useRef({ raf: 0, t0: 0, idx: -1, phase: 0, dust: null as Dust | null })
  const roll = useRef({ raf: 0, shown: "" })

  const shipCost = shipping[ship] ? shipping[ship][2] : 0
  const cur = active >= 0 ? coupons[active] : null
  const off = cur && phase >= 3 ? saving(subtotal, cur.percent) : 0
  const totalStr = money(subtotal - off + shipCost, currency)

  // Canvas follows the card's size; positions come from the fixed geometry in L.
  useEffect(() => {
    const card = cardRef.current
    const canvas = canvasRef.current
    if (!card || !canvas) return
    const ro = new ResizeObserver((entries) => {
      const e = entries[0]
      const b = e.borderBoxSize && e.borderBoxSize[0]
      const w = b ? b.inlineSize : e.contentRect.width + L.PAD * 2
      const h = b ? b.blockSize : L.CARD_H
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      size.current = { w, h, dpr }
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
    })
    ro.observe(card)
    return () => ro.disconnect()
  }, [])

  // The total: digits blur and tumble left to right whenever the amount changes.
  useEffect(() => {
    const el = amtRef.current
    if (!el) return
    const from = roll.current.shown
    roll.current.shown = totalStr
    cancelAnimationFrame(roll.current.raf)
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (!from || from === totalStr || reduced) {
      el.textContent = totalStr
      return
    }
    const len = Math.max(from.length, totalStr.length)
    el.textContent = ""
    const spans: HTMLSpanElement[] = []
    for (let i = 0; i < len; i++) {
      const s = document.createElement("span")
      s.className = "cdc-ch"
      s.textContent = from[i] ?? ""
      el.appendChild(s)
      spans.push(s)
    }
    const rnd = mulberry32(len * 97 + totalStr.charCodeAt(1))
    const t0 = performance.now()
    const STAG = 0.028
    const SPIN = 0.12
    const SETTLE = 0.09
    let last = -1
    const tick = (now: number) => {
      const t = (now - t0) / 1000
      const step = Math.floor(t / 0.05)
      for (let i = 0; i < len; i++) {
        const a = from[i] ?? ""
        const b = totalStr[i] ?? ""
        const s = spans[i]
        const lt = t - i * STAG
        if (a === b) continue
        if (lt < 0) continue
        if (lt < SPIN) {
          const k = lt / SPIN
          if (step !== last) s.textContent = KIND_DIGIT.test(b || a) ? String(Math.floor(rnd() * 10)) : b || a
          s.style.filter = "blur(" + (1 + 3 * Math.sin(k * Math.PI)).toFixed(2) + "px)"
          s.style.opacity = b ? String(0.55 + 0.25 * Math.cos(k * Math.PI * 2)) : String(1 - k)
        } else {
          const k = clamp01((lt - SPIN) / SETTLE)
          s.textContent = b
          s.style.filter = k < 1 ? "blur(" + (2 * (1 - k)).toFixed(2) + "px)" : ""
          s.style.opacity = k < 1 ? String(0.6 + 0.4 * k) : ""
        }
      }
      last = step
      if (t < (len - 1) * STAG + SPIN + SETTLE) roll.current.raf = requestAnimationFrame(tick)
      else el.textContent = totalStr
    }
    roll.current.raf = requestAnimationFrame(tick)
  }, [totalStr])

  useEffect(() => {
    const r = run.current
    const rl = roll.current
    const tm = timers.current
    const br = burstRaf
    return () => {
      cancelAnimationFrame(r.raf)
      cancelAnimationFrame(rl.raf)
      cancelAnimationFrame(br.current)
      for (const id of tm) clearTimeout(id)
    }
  }, [])

  // The order-placed badge throws a ring of the same iridescent dust.
  const burst = (stops: CouponStop[]) => {
    const canvas = canvasRef.current
    const ctx = canvas && canvas.getContext("2d")
    if (!ctx) return
    const rnd = mulberry32(31)
    const n = 220
    const ang: number[] = []
    const spd: number[] = []
    const life: number[] = []
    const sz: number[] = []
    const col: string[] = []
    for (let k = 0; k < n; k++) {
      ang.push(rnd() * Math.PI * 2)
      spd.push(70 + rnd() * 170)
      life.push(0.55 + rnd() * 0.6)
      sz.push(rnd() < 0.08 ? 2 : 1 + rnd() * 0.7)
      const base = sampleStops(stops, rnd())
      const w = 0.3 + rnd() * 0.6
      const c = base.map((x) => Math.round(x + (255 - x) * w))
      col.push("rgb(" + c[0] + "," + c[1] + "," + c[2] + ")")
    }
    const t0 = performance.now()
    const frame = (now: number) => {
      const t = (now - t0) / 1000
      const { w, h, dpr } = size.current
      const cx = w / 2
      const cy = L.CONFIRM_BADGE_Y
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, w, h)
      ctx.globalCompositeOperation = "lighter"
      let alive = 0
      for (let k = 0; k < n; k++) {
        const a = 1 - t / life[k]
        if (a <= 0) continue
        alive++
        const d = 30 + (spd[k] * (1 - Math.exp(-t * 3.2))) / 3.2
        const x = cx + Math.cos(ang[k]) * d
        const y = cy + Math.sin(ang[k]) * d + 18 * t * t
        ctx.globalAlpha = a * (0.6 + 0.4 * Math.sin(t * 21 + k))
        ctx.fillStyle = col[k]
        ctx.fillRect(x - sz[k] / 2, y - sz[k] / 2, sz[k], sz[k])
      }
      ctx.globalAlpha = 1
      if (alive) burstRaf.current = requestAnimationFrame(frame)
      else ctx.clearRect(0, 0, w, h)
    }
    cancelAnimationFrame(burstRaf.current)
    burstRaf.current = requestAnimationFrame(frame)
  }

  const later = (sec: number, fn: () => void) => {
    timers.current.push(window.setTimeout(fn, sec * 1000))
  }

  const placeOrder = () => {
    const p = run.current.phase
    if (order !== 0 || (p > 0 && p < 4)) return
    const paidNow = subtotal - off + shipCost
    onPlaceOrder?.(paidNow)
    const sh = shipping[ship] || DEFAULT_SHIPPING[0]
    setReceipt({
      paid: paidNow,
      saved: cur && run.current.phase === 4 ? cur.code + " saved you " + money(saving(subtotal, cur.percent), currency) : "",
      ship: sh[0] + " · arriving in " + sh[1].replace(" business", ""),
    })
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    setOrder(1)
    later(reduced ? O.reducedCheck : O.check, () => setOrder(2))
    later(reduced ? O.reducedView : O.view, () => setOrder(3))
    if (!reduced) later(O.burst, () => burst(cur ? tintOf(cur, active) : HOLO))
  }

  const backToCheckout = () => {
    if (order !== 3) return
    for (const id of timers.current) clearTimeout(id)
    timers.current = []
    cancelAnimationFrame(burstRaf.current)
    const canvas = canvasRef.current
    const ctx = canvas && canvas.getContext("2d")
    if (canvas && ctx) {
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
    }
    for (const el of couponRefs.current) if (el) el.style.clipPath = ""
    go(0)
    setOrder(0)
  }

  const go = (p: number) => {
    run.current.phase = p
    setPhase(p)
  }

  const apply = (i: number) => {
    const r = run.current
    if (r.phase !== 0) return
    const c = coupons[i]
    const coupon = couponRefs.current[i]
    const chip = chipRef.current
    const canvas = canvasRef.current
    if (!c || !coupon || !chip || !canvas) return
    setActive(i)
    r.idx = i
    onApply?.(c.code, saving(subtotal, c.percent))
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    chip.style.clipPath = ""
    chip.style.filter = ""
    if (reduced) {
      go(4)
      return
    }
    const { w, h } = size.current
    const scroll = rowRef.current ? rowRef.current.scrollLeft : 0
    const x0 = couponX(i, scroll)
    const y0 = L.COUPON_TOP
    const ty0 = h - L.CHIP_FROM_BOTTOM - L.CHIP_H / 2
    r.dust = makeDust(1 + i * 7919, x0, y0, L.PAD, ty0, tintOf(c, i))
    chip.style.clipPath = "inset(0 100% 0 0)"
    chip.style.filter = "blur(2.5px)"
    go(1)
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    // Shared path, read off the reference: up and right over the next coupon, down the right
    // half of the sheet, then back left into the slot beside the total.
    const scx = x0 + L.CW / 2
    const tcy = ty0 + L.CHIP_H / 2
    const p1x = Math.min(w - 36, Math.max(scx + w * 0.42, w * 0.62))
    const p1y = y0 - 64
    const p2x = w * 0.76
    const p2y = tcy - 70
    const d = r.dust
    r.t0 = performance.now()

    const frame = (now: number) => {
      const t = (now - r.t0) / 1000
      const { w: cw, h: chh, dpr } = size.current
      // 1. the coupon dissolves behind a ragged edge
      const p = clamp01((t - T.wipeAt) / T.wipe)
      if (t >= T.wipeAt) {
        if (p >= 1 && t > T.wipeAt + T.wipe + 0.05) coupon.style.clipPath = "inset(0 0 0 100%)"
        else {
          const pts: string[] = []
          for (let k = 0; k <= 12; k++) {
            const v = k / 12
            pts.push(edgeX(v, p, t).toFixed(1) + "px " + (v * L.CH).toFixed(1) + "px")
          }
          pts.push(L.CW + 2 + "px " + L.CH + "px", L.CW + 2 + "px 0px")
          coupon.style.clipPath = "polygon(" + pts.join(",") + ")"
        }
      }
      // 2. dust
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, cw, chh)
      ctx.globalCompositeOperation = "lighter"
      const lift = liftAt(t)
      let landed = 0
      for (let k = 0; k < d.n; k++) {
        if (d.rel[k] < 0) {
          if (t >= T.wipeAt && edgeX(d.v[k], p, t) >= d.u[k] * L.CW) {
            d.rel[k] = t
            if (d.dep[k] < t + 0.12) d.dep[k] = t + 0.12
          } else continue
        }
        const rel = d.rel[k]
        const dep = d.dep[k]
        const arr = dep + d.dur[k]
        let x: number
        let y: number
        let a = 1
        if (t < arr) {
          const dt = Math.min(t, dep) - rel
          const g = (1 - Math.exp(-dt * 2.6)) / 2.6
          const wob = Math.sin(t * 5 + d.tw[k]) * 1.2
          const bx = d.sx[k] + d.vx[k] * g + wob
          const by = d.sy[k] + d.vy[k] * g + wob * 0.6
          if (t < dep) {
            x = bx
            y = by
            a = Math.min(1, (t - rel) * 14)
          } else {
            const s = easeInOutCubic((t - dep) / d.dur[k])
            const ex = d.tx[k]
            const ey = d.ty[k] - lift
            const c1x = p1x + d.j1x[k]
            const c1y = p1y + d.j1y[k]
            const c2x = p2x + d.j2x[k]
            const c2y = p2y + d.j2y[k]
            x = bezier(bx, c1x, c2x, ex, s)
            y = bezier(by, c1y, c2y, ey, s)
            // spread across the path, widest mid-flight
            const tx = bezier(bx, c1x, c2x, ex, Math.min(1, s + 0.01)) - x
            const tyy = bezier(by, c1y, c2y, ey, Math.min(1, s + 0.01)) - y
            const ln = Math.hypot(tx, tyy) || 1
            const off2 = d.lat[k] * Math.sin(Math.PI * s) * 11
            x += (-tyy / ln) * off2
            y += (tx / ln) * off2
          }
        } else {
          landed++
          a = 1 - (t - arr) / 0.14
          if (a <= 0) continue
          x = d.tx[k]
          y = d.ty[k] - lift
        }
        const tw = 0.62 + 0.38 * Math.sin(t * 19 + d.tw[k] * 3)
        ctx.globalAlpha = a * tw
        ctx.fillStyle = d.col[k]
        const sz = d.size[k]
        ctx.fillRect(x - sz / 2, y - sz / 2, sz, sz)
      }
      ctx.globalAlpha = 1
      // 3. the chip rebuilds left to right as its dust lands, then comes into focus
      const q = landed / d.n
      chip.style.clipPath = q >= 1 ? "" : "inset(0 " + ((1 - q) * 100).toFixed(1) + "% 0 0)"
      const b = 2.5 * (1 - clamp01((t - T.save + 0.08) / 0.2))
      chip.style.filter = b > 0.02 ? "blur(" + b.toFixed(2) + "px)" : ""
      // 4. hand-offs
      if (t >= T.slot && r.phase < 2) go(2)
      if (t >= T.save && r.phase < 3) go(3)
      if (t >= T.swap && r.phase < 4) go(4)
      if (t < T.end || landed < d.n) r.raf = requestAnimationFrame(frame)
      else {
        ctx.clearRect(0, 0, cw, chh)
        chip.style.clipPath = ""
        chip.style.filter = ""
        r.dust = null
      }
    }
    cancelAnimationFrame(r.raf)
    r.raf = requestAnimationFrame(frame)
  }

  const remove = () => {
    const r = run.current
    if (r.phase !== 4) return
    cancelAnimationFrame(r.raf)
    const ctx = canvasRef.current && canvasRef.current.getContext("2d")
    if (ctx) ctx.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height)
    for (const el of couponRefs.current) if (el) el.style.clipPath = ""
    go(0)
  }

  const chipC = active >= 0 ? coupons[active] : coupons[0]
  const busy = phase > 0 && phase < 4
  const applied = phase === 4 && cur
  const fullSave = cur ? saving(subtotal, cur.percent) : 0

  const cls =
    "cdc-card" +
    (busy ? " cdc-busy" : "") +
    (phase >= 2 && active >= 0 ? " cdc-open" : "") +
    (phase >= 3 && active >= 0 ? " cdc-saved" : "") +
    (phase === 4 ? " cdc-on" : "") +
    (order ? " cdc-ord" + order : "")

  return (
    <div className={"cdc-root " + className} style={{ height }}>
      <style>{CSS}</style>
      <div className={cls} ref={cardRef}>
        <div className="cdc-main" aria-hidden={order === 3 ? true : undefined}>
        <div className="cdc-head">
          <h3 className="cdc-h">Coupons</h3>
          <button type="button" className="cdc-link cdc-dim">Add a coupon</button>
        </div>
        <div className="cdc-slot">
          <div className="cdc-row" ref={rowRef} aria-hidden={phase === 4 ? true : undefined}>
            {coupons.map((c, i) => (
              <button
                key={c.code + i}
                type="button"
                className="cdc-coupon"
                ref={(el) => {
                  couponRefs.current[i] = el
                }}
                tabIndex={phase === 0 && order === 0 ? 0 : -1}
                aria-label={"Apply coupon " + c.code + ", " + c.percent + "% off"}
                onClick={() => apply(i)}
              >
                <span className="cdc-face" style={{ background: ticketBg(tintOf(c, i)) }}>
                  <span className="cdc-seam" />
                  <span className="cdc-tag">promo</span>
                  <span className="cdc-line">
                    <span className="cdc-code">{c.code}</span>
                    <span className="cdc-pct">{c.percent}%</span>
                  </span>
                </span>
              </button>
            ))}
          </div>
          <div className="cdc-banner" aria-hidden={phase === 4 ? undefined : true}>
            <svg className="cdc-badge" width="26" height="26" viewBox="0 0 24 24" aria-hidden="true">
              <path d={BADGE} fill="currentColor" />
              <path d="M7.6 12.3l3 2.9 5.8-6" fill="none" stroke="#0a0a0b" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="cdc-btxt">
              <span className="cdc-bt">{(cur ? cur.code : "") + " applied"}</span>
              <span className="cdc-bs">{(cur ? cur.percent : 0) + "% off · −" + money(fullSave, currency)}</span>
            </span>
            <button type="button" className="cdc-x" aria-label="Remove coupon" tabIndex={phase === 4 ? 0 : -1} onClick={remove}>
              <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
                <path d="M2.5 2.5l7 7M9.5 2.5l-7 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>

        <div className="cdc-head cdc-del">
          <h3 className="cdc-h">Delivery</h3>
          <button type="button" className="cdc-link cdc-link-on">Change</button>
        </div>
        <p className="cdc-addr">
          <b>Home,</b> {address}
        </p>
        <div className="cdc-opts" role="radiogroup" aria-label="Delivery speed">
          {shipping.map(([label, eta, price], i) => (
            <label className="cdc-opt" key={label}>
              <input type="radio" name="cdc-ship" checked={ship === i} onChange={() => setShip(i)} />
              <span className="cdc-radio" aria-hidden="true" />
              <span className="cdc-ol">
                <span className="cdc-on1">{label}</span>
                <span className="cdc-on2">{eta}</span>
              </span>
              <span className="cdc-op">{price ? money(price, currency) : "Free"}</span>
            </label>
          ))}
        </div>

        <div className="cdc-foot">
          <div className="cdc-sum">
            <span className="cdc-tl">Total</span>
            <span className="cdc-amtrow">
              <span className="cdc-chipslot" aria-hidden="true">
                <span className="cdc-chip" ref={chipRef} style={{ background: ticketBg(tintOf(chipC, Math.max(0, active))) }}>
                  <span className="cdc-cline">
                    <span className="cdc-cc">{chipC.code}</span>
                    <span className="cdc-cp">{chipC.percent}%</span>
                  </span>
                </span>
              </span>
              <span className="cdc-amt" ref={amtRef} />
            </span>
            <span className="cdc-savewrap">
              <span className="cdc-save">
                {"You save " + money(fullSave, currency)}
              </span>
            </span>
          </div>
          <button
            type="button"
            className="cdc-place"
            onClick={placeOrder}
            disabled={busy || order === 3}
            aria-label={order === 1 ? "Placing order" : order >= 2 ? "Order placed" : undefined}
          >
            <span className="cdc-pl">Place order</span>
            <svg className="cdc-spin" width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
              <circle cx="11" cy="11" r="8.5" fill="none" stroke="rgba(10,10,11,.15)" strokeWidth="2.4" />
              <path d="M11 2.5a8.5 8.5 0 0 1 8.5 8.5" fill="none" stroke="#0a0a0b" strokeWidth="2.4" strokeLinecap="round" />
            </svg>
            <svg className="cdc-tick" width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
              <path d="M5.5 11.5l3.8 3.7 7.2-8" fill="none" stroke="#0a0a0b" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
        </div>

        <div className="cdc-done" aria-hidden={order === 3 ? undefined : true}>
          <svg className="cdc-dbadge" viewBox="0 0 24 24" aria-hidden="true">
            <path d={BADGE} fill="currentColor" />
            <path d="M7.6 12.3l3 2.9 5.8-6" fill="none" stroke="#0a0a0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <h3 className="cdc-dt">Order placed</h3>
          <span className="cdc-dl">{"Order " + orderNumber(receipt.paid) + " · " + money(receipt.paid, currency) + " paid"}</span>
          <span className={"cdc-dl" + (receipt.saved ? " cdc-dg" : "")}>{receipt.saved || "No coupon applied"}</span>
          <span className="cdc-dl">{receipt.ship}</span>
          <button type="button" className="cdc-back" tabIndex={order === 3 ? 0 : -1} onClick={backToCheckout}>
            Back to checkout
          </button>
        </div>
        <canvas className="cdc-canvas" ref={canvasRef} aria-hidden="true" />
        <div className="cdc-sr" aria-live="polite">
          {order === 3 ? "Order placed. " + money(receipt.paid, currency) + " paid." : applied ? cur.code + " applied, " + cur.percent + "% off. New total " + totalStr + "." : ""}
        </div>
      </div>
    </div>
  )
}
