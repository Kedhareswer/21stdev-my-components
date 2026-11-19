"use client"

import { useEffect, useRef, useState } from "react"

/*
 * Flipboard Checkout Counter
 * A shop counter with the cart on it. The decks you picked drop onto the wood top, a split-flap board lists
 * them character by character, and the total flaps over as quantities change. Click a deck (or take its
 * quantity to zero) and it tips onto its edge and tumbles off the front. "Checkout" slides a frosted drawer
 * out of the counter; Pay is a little deck that kickflips, the drawer slides home and the board flaps to
 * a thank-you.
 *
 * Only the counter top is 3D (a perspective plane the decks lie on). The board, plaque and drawer stay flat
 * so their text renders crisp. All sizes come from container units; nothing reads layout.
 */

const IMG_BASE = "https://kedhar-components.pages.dev/flipboard-checkout-counter/"

export type CounterProduct = { id: string; name: string; price: number; image: string }
export type CartLine = { id: string; qty: number }
export type CheckoutDetails = { email: string; address: string; card: string; expiry: string; cvc: string }

export const DEFAULT_PRODUCTS: CounterProduct[] = [
  { id: "onyx", name: "Onyx", price: 68, image: IMG_BASE + "deck-onyx.webp" },
  { id: "chalk", name: "Chalk", price: 64, image: IMG_BASE + "deck-chalk.webp" },
  { id: "garnet", name: "Garnet", price: 72, image: IMG_BASE + "deck-garnet.webp" },
  { id: "fern", name: "Fern", price: 70, image: IMG_BASE + "deck-fern.webp" },
  { id: "teak", name: "Teak", price: 84, image: IMG_BASE + "deck-teak.webp" },
]

export type FlipboardCheckoutCounterProps = {
  products?: CounterProduct[]
  defaultItems?: CartLine[]
  shopName?: string
  /** Optional wall art behind the counter (a transparent wordmark reads best). */
  backdropSrc?: string
  currency?: string
  /** Prefilled checkout fields (the demo fills them so Pay works first time). */
  defaultDetails?: Partial<CheckoutDetails>
  onCartChange?: (lines: CartLine[]) => void
  onPay?: (order: { id: string; lines: CartLine[]; total: number; details: CheckoutDetails }) => void
  height?: string
  className?: string
}

// #region logic
export const LEFT = 11
export const RIGHT = 7
export const ROWS = 5
export type Row = { left: string; right: string }

export function cartTotal(lines: { id: string; qty: number }[], products: { id: string; price: number }[]) {
  return lines.reduce((s, l) => s + l.qty * (products.find((p) => p.id === l.id)?.price ?? 0), 0)
}

/** One split-flap row: name and quantity in LEFT cells, the line price right-aligned in RIGHT cells. */
export function rowText(name: string, qty: number, price: number, currency: string): Row {
  const left = name.toUpperCase().slice(0, 8).padEnd(9, " ") + (qty > 1 ? "X" + qty : "").padEnd(2, " ")
  const right = (currency + qty * price).slice(-RIGHT).padStart(RIGHT, " ")
  return { left, right }
}

export function pair(a: string, b: string): Row {
  return { left: a.toUpperCase().slice(0, LEFT).padEnd(LEFT, " "), right: b.toUpperCase().slice(-RIGHT).padStart(RIGHT, " ") }
}

export function setQty(lines: { id: string; qty: number }[], id: string, qty: number) {
  const q = Math.max(0, Math.min(9, qty))
  const has = lines.some((l) => l.id === id)
  const next = has ? lines.map((l) => (l.id === id ? { ...l, qty: q } : l)) : [...lines, { id, qty: q }]
  return next.filter((l) => l.qty > 0)
}

export function validate(d: { email: string; address: string; card: string; expiry: string; cvc: string }) {
  const bad: string[] = []
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email.trim())) bad.push("email")
  if (d.address.trim().length < 4) bad.push("address")
  if (d.card.replace(/\D/g, "").length < 12) bad.push("card")
  if (!/^(0[1-9]|1[0-2])\s*\/\s*\d{2}$/.test(d.expiry.trim())) bad.push("expiry")
  if (!/^\d{3,4}$/.test(d.cvc.trim())) bad.push("cvc")
  return bad
}
// #endregion

const GLYPHS = "ABCDEFGHIJKLMNOPRSTUVWXYZ0123456789$"
const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches

const E = "cubic-bezier(.2,.8,.2,1)"
const CSS =
  "@property --fc-oy{syntax:'<number>';inherits:true;initial-value:0}" +
  ".fc-root{position:relative;overflow:hidden;container:fc/size;isolation:isolate;" +
  "--fc-wall:color-mix(in oklab,var(--color-background) 86%,#d9a79e);--fc-floor:color-mix(in oklab,var(--color-background) 72%,#7d6f6a);" +
  "--fc-ink:var(--color-foreground);--fc-soft:var(--color-muted-foreground);--fc-g:clamp(16px,3cqw,40px);" +
  "background:var(--fc-wall);color:var(--fc-ink);" +
  "font-family:Inter,'Helvetica Neue',Arial,system-ui,sans-serif;-webkit-font-smoothing:antialiased}" +
  ".fc-root img{max-width:none;display:block;pointer-events:none;-webkit-user-drag:none}" +
  ".fc-root :where(button){font:inherit;color:inherit;background:none;border:0;padding:0;margin:0;cursor:pointer;-webkit-tap-highlight-color:transparent}" +
  ".fc-root :where(button,input):focus-visible{outline:2px solid #c9a35b;outline-offset:2px}" +
  ".fc-scene{position:absolute;inset:0;--u:min(1cqw,1.65cqh);--du:var(--u);--fc-oy:0;transition:--fc-oy .9s " + E + ";" +
  "--cw:76;--ct:7;--cf:20;--dep:30;--dx:19;--dy:-6.5;--dw:33;--dh:17;--px:19;--py:4.6;--s0:-28;--sg:9.4;--sd:14}" +
  ".fc-scene[data-drawer]{--fc-oy:-7;transition:--fc-oy .8s " + E + "}" +
  "@container fc (max-aspect-ratio:4/5){.fc-scene .fc-mark{display:none}.fc-scene[data-drawer]{--fc-oy:-9}.fc-scene{--u:1.24cqw;--du:calc(1.75*var(--u));--ct:17;--cf:22;--dx:0;--dy:-24;--dw:33;--dh:17;--px:23;--py:13.8;--s0:-27;--sg:10.5;--sd:14}}" +
  ".fc-x{position:absolute;left:calc(50% + var(--x)*var(--u));top:calc(50% + var(--fc-oy)*var(--u) + var(--y)*var(--u));transform:translate(-50%,-50%)}" +
  ".fc-mark{position:absolute;left:calc(50% - 14*var(--u));top:calc(50% + var(--fc-oy)*var(--u) + (var(--ct) - 24)*var(--u));width:calc(34*var(--u));transform:translate(-50%,-50%);opacity:.5;filter:blur(2px);transition:opacity .5s ease}" +
  ".fc-scene[data-drawer] .fc-mark{opacity:0}" +
  ".fc-floor{position:absolute;left:0;right:0;bottom:0;top:calc(50% + var(--fc-oy)*var(--u) + (var(--ct) - 18)*var(--u));background:linear-gradient(180deg,color-mix(in oklab,var(--fc-floor) 78%,var(--fc-wall)),var(--fc-floor) 60%);box-shadow:0 -1px 0 color-mix(in oklab,var(--fc-floor) 60%,var(--fc-wall))}" +
  ".fc-shadow{left:50%;top:calc(50% + var(--fc-oy)*var(--u) + (var(--ct) + var(--cf))*var(--u));width:calc((var(--cw) + 8)*var(--u));height:calc(5*var(--u));transform:translate(-50%,-50%);position:absolute;border-radius:50%;background:radial-gradient(closest-side,rgba(30,12,10,.42),transparent)}" +
  ".fc-front{position:absolute;left:calc(50% - var(--cw)/2*var(--u));top:calc(50% + var(--fc-oy)*var(--u) + var(--ct)*var(--u));width:calc(var(--cw)*var(--u));height:calc(var(--cf)*var(--u));box-sizing:border-box;" +
  "background:linear-gradient(180deg,#f3ede4,#e7ddd0);border-radius:0 0 calc(.5*var(--u)) calc(.5*var(--u));box-shadow:inset 0 calc(.6*var(--u)) calc(1.2*var(--u)) rgba(60,30,20,.25),inset 0 -2px 0 rgba(0,0,0,.08);" +
  "display:grid;grid-template-columns:22% 1fr 22%;gap:calc(1.4*var(--u));padding:calc(1.6*var(--u)) calc(1.8*var(--u))}" +
  ".fc-front > *{transition:opacity .3s ease .4s}" +
  ".fc-scene[data-drawer] .fc-front > *{opacity:0;transition:opacity .18s ease}" +
  ".fc-flute{border-radius:3px;background:repeating-linear-gradient(90deg,#efe7dc 0,#fbf7f1 calc(.5*var(--u)),#d8ccbd calc(1*var(--u)),#efe7dc calc(1.3*var(--u)));box-shadow:inset 0 0 0 1px rgba(80,50,30,.08)}" +
  ".fc-plate{display:grid;place-content:center;justify-items:center;gap:calc(.9*var(--u));border:1px solid rgba(80,50,30,.22);border-radius:2px;color:#4a3320;text-align:center}" +
  ".fc-plate b{font-family:'Archivo Black','Arial Black','Helvetica Neue',Arial,sans-serif;font-weight:900;font-size:calc(2.7*var(--u));letter-spacing:.32em;margin-right:-.32em;color:#6b4a22}" +
  ".fc-plate span{font-size:calc(.62*var(--u));font-weight:700;letter-spacing:.28em;text-transform:uppercase;opacity:.8}" +
  ".fc-lip{position:absolute;left:calc(50% - (var(--cw)/2 + .6)*var(--u));top:calc(50% + var(--fc-oy)*var(--u) + (var(--ct) - .9)*var(--u));width:calc((var(--cw) + 1.2)*var(--u));height:calc(1.1*var(--u));border-radius:3px;background:linear-gradient(180deg,#3a2414,#1e120a);box-shadow:0 2px 3px rgba(0,0,0,.25)}" +
  ".fc-top{position:absolute;z-index:2;left:calc(50% - (var(--cw)/2 + .6)*var(--u));top:calc(50% + var(--fc-oy)*var(--u) + (var(--ct) - .9 - var(--dep))*var(--u));width:calc((var(--cw) + 1.2)*var(--u));height:calc(var(--dep)*var(--u));" +
  "transform-origin:50% 100%;transform:perspective(calc(120*var(--u))) rotateX(58deg);transform-style:preserve-3d;" +
  "background:linear-gradient(180deg,rgba(255,255,255,.08),rgba(0,0,0,.18)),repeating-linear-gradient(90deg,#5a3720 0,#6e4529 calc(.35*var(--u)),#4b2c17 calc(.7*var(--u)),#633d24 calc(1.1*var(--u)));border-radius:4px 4px 0 0}" +
  ".fc-deck{position:absolute;width:calc(6.2*var(--u));height:calc(23.5*var(--u));left:calc((var(--cw)/2 + .6 + var(--s0) + var(--slot)*var(--sg))*var(--u));top:calc((var(--dep) - var(--sd))*var(--u));" +
  "transform-style:preserve-3d;transform:translate3d(-50%,-50%,calc(var(--k)*.55*var(--u)))}" +
  ".fc-deck-in{position:absolute;inset:0;transform-style:preserve-3d;rotate:z var(--rz)}" +
  ".fc-deck-in img{width:100%;height:100%;filter:drop-shadow(calc(.5*var(--u)) calc(.6*var(--u)) calc(.5*var(--u)) rgba(15,6,2,.5))}" +
  ".fc-deck[data-in]{animation:fc-drop .95s cubic-bezier(.3,.6,.3,1) both;animation-delay:var(--d)}" +
  ".fc-deck[data-out]{animation:fc-off 1.9s cubic-bezier(.45,0,.55,1) both;pointer-events:none}" +
  ".fc-deck button{position:absolute;inset:0;border-radius:40%}" +
  "@keyframes fc-drop{0%{opacity:0;transform:translate3d(-50%,-90%,calc(34*var(--u))) rotateX(-30deg) rotateY(24deg)}" +
  "55%{opacity:1;transform:translate3d(-50%,-50%,calc(var(--k)*.55*var(--u))) rotateX(3deg) rotateY(-2deg)}" +
  "72%{transform:translate3d(-50%,-50%,calc((var(--k)*.55 + 1.6)*var(--u))) rotateX(-2deg) rotateY(1deg)}" +
  "86%,100%{opacity:1;transform:translate3d(-50%,-50%,calc(var(--k)*.55*var(--u))) rotateX(0) rotateY(0)}}" +
  "@keyframes fc-off{0%{opacity:1;transform:translate3d(-50%,-50%,calc(var(--k)*.55*var(--u))) rotateY(0) rotateX(0)}" +
  "13%{transform:translate3d(-50%,-49%,calc(4*var(--u))) rotateY(58deg) rotateX(0)}" +
  "32%{transform:translate3d(-50%,calc(-50% + (var(--sd) + 1)*var(--u)),calc(5*var(--u))) rotateY(130deg) rotateX(-28deg)}" +
  "52%{transform:translate3d(-50%,calc(-50% + (var(--sd) + 5)*var(--u)),calc(-10*var(--u))) rotateY(176deg) rotateX(-12deg)}" +
  "64%{transform:translate3d(-50%,calc(-50% + (var(--sd) + 8)*var(--u)),calc(-19*var(--u))) rotateY(180deg) rotateX(0)}" +
  "69%{opacity:1;transform:translate3d(-50%,calc(-50% + (var(--sd) + 8.3)*var(--u)),calc(-18*var(--u))) rotateY(180deg) rotateX(2deg)}" +
  "74%{opacity:1;transform:translate3d(-50%,calc(-50% + (var(--sd) + 8.5)*var(--u)),calc(-19*var(--u))) rotateY(180deg) rotateX(0)}" +
  "100%{opacity:0;transform:translate3d(-50%,calc(-50% + (var(--sd) + 8.5)*var(--u)),calc(-19*var(--u))) rotateY(180deg) rotateX(0)}}" +
  ".fc-board{position:absolute;z-index:3;left:calc(50% + var(--dx)*var(--u));top:calc(50% + var(--fc-oy)*var(--u) + var(--dy)*var(--u));width:calc(var(--dw)*var(--du));height:calc(var(--dh)*var(--du));transform:translate(-50%,-50%);" +
  "box-sizing:border-box;padding:calc(.9*var(--du)) calc(1.1*var(--du));border-radius:calc(.35*var(--du));background:linear-gradient(180deg,#232120,#121110);" +
  "box-shadow:0 0 0 calc(.32*var(--du)) #b48a3e,0 0 0 calc(.42*var(--du)) #6e5221,0 calc(1.2*var(--du)) calc(2*var(--du)) rgba(20,8,4,.35);display:grid;grid-template-rows:auto 1fr auto;gap:calc(.5*var(--du));color:#f1e9da}" +
  ".fc-board-label{font-size:calc(.56*var(--du));font-weight:700;letter-spacing:.3em;text-transform:uppercase;color:#a99c86}" +
  ".fc-rows{display:grid;grid-template-rows:repeat(5,1fr);gap:calc(.22*var(--du))}" +
  ".fc-row{display:flex;align-items:center;gap:calc(.5*var(--du));border-bottom:1px solid rgba(255,255,255,.07);box-shadow:0 1px 0 rgba(0,0,0,.6)}" +
  ".fc-flaps{display:flex;flex:none}.fc-gap{flex:1}" +
  ".fc-cell{position:relative;flex:none;width:calc(.86*var(--du));display:grid;place-items:center;height:calc(1.75*var(--du));font-family:'Archivo Black','Arial Black','Helvetica Neue',Arial,sans-serif;font-weight:900;font-size:calc(1.08*var(--du));line-height:1;perspective:calc(6*var(--du))}" +
  ".fc-cell i{font-style:normal;display:block;transform-origin:50% 0;animation:fc-flap .11s cubic-bezier(.3,.7,.4,1) both}" +
  "@keyframes fc-flap{from{transform:rotateX(-80deg);opacity:.25}to{transform:rotateX(0);opacity:1}}" +
  ".fc-keys{display:flex;gap:calc(.25*var(--du));opacity:0;transition:opacity .3s ease}" +
  ".fc-row[data-live] .fc-keys{opacity:1}" +
  ".fc-key{width:calc(1.15*var(--du));height:calc(1.15*var(--du));border-radius:50%;display:grid;place-items:center;font-size:calc(.8*var(--du));font-weight:800;line-height:1;color:#2a1d0c;background:radial-gradient(circle at 35% 30%,#f2d595,#b48a3e 70%);box-shadow:0 1px 2px rgba(0,0,0,.5)}" +
  ".fc-key:disabled{opacity:.35;cursor:default}" +
  ".fc-total{display:flex;align-items:center;justify-content:space-between;border-top:1px solid rgba(255,255,255,.12);padding-top:calc(.4*var(--du))}" +
  ".fc-total .fc-flaps{margin-right:calc(3.05*var(--du))}" +
  ".fc-plaque{position:absolute;z-index:4;left:calc(50% + var(--px)*var(--u));top:calc(50% + var(--fc-oy)*var(--u) + var(--py)*var(--u));transform:translate(-50%,-50%);min-width:calc(9.5*var(--u));height:max(28px,calc(2.3*var(--u)));padding:0 max(12px,calc(1.2*var(--u)));border-radius:3px;" +
  "font-family:'Archivo Black','Arial Black','Helvetica Neue',Arial,sans-serif;font-size:max(10px,calc(.78*var(--u)));white-space:nowrap;letter-spacing:.24em;text-transform:uppercase;color:#f1e9da;background:linear-gradient(180deg,#2a2725,#141312);box-shadow:0 0 0 1px #b48a3e,0 calc(.4*var(--u)) calc(.8*var(--u)) rgba(20,8,4,.4);transition:transform .25s " + E + ",box-shadow .25s ease}" +
  ".fc-plaque:hover{transform:translate(-50%,calc(-50% - 2px))}" +
  ".fc-plaque:disabled{opacity:.45;cursor:default;transform:translate(-50%,-50%)}" +
  ".fc-drawer{position:absolute;z-index:6;left:calc(50% - (var(--cw)/2 - 1.5)*var(--u));top:calc(50% + (var(--fc-oy) + var(--ct) + .6)*var(--u));min-height:calc((var(--cf) - .6)*var(--u));width:calc((var(--cw) - 3)*var(--u));box-sizing:border-box;" +
  "padding:clamp(18px,2.2cqw,32px);border-radius:6px;display:grid;grid-template-columns:minmax(0,.8fr) minmax(0,1.2fr);gap:clamp(16px,2.6cqw,40px);color:#211a14;" +
  "background:color-mix(in oklab,#f6efe5 95%,transparent);will-change:transform,opacity,clip-path;" +
  "box-shadow:inset 0 0 0 1px rgba(255,255,255,.6),0 30px 60px -24px rgba(40,15,8,.45);transform-origin:50% 100%;" +
  "opacity:0;transform:perspective(1200px) translateY(38%) rotateX(-14deg);clip-path:inset(0 0 100% 0 round 6px);visibility:hidden;" +
  "transition:opacity .35s ease,transform .55s cubic-bezier(.6,0,.8,.4),clip-path .55s cubic-bezier(.6,0,.8,.4),visibility 0s linear .55s}" +
  ".fc-drawer[data-open]{opacity:1;transform:perspective(1200px) translateY(0) rotateX(0deg);clip-path:inset(0 0 0 0 round 6px);visibility:visible;" +
  "transition:opacity .45s ease .15s,transform .85s " + E + ",clip-path .75s " + E + ",visibility 0s}" +
  "@container fc (max-aspect-ratio:4/5){.fc-drawer{left:var(--fc-g);width:calc(100% - 2*var(--fc-g));top:auto;min-height:0;bottom:var(--fc-g);grid-template-columns:1fr;gap:14px}.fc-note{display:none}.fc-form{grid-template-columns:1fr 1fr}.fc-form .fc-f-card{grid-column:1/-1}.fc-form .fc-f-expiry{grid-column:1/2}.fc-form .fc-f-cvc{grid-column:2/3}}" +
  ".fc-eyebrow{font-size:10px;font-weight:700;letter-spacing:.24em;text-transform:uppercase;opacity:.6}" +
  ".fc-h{margin:.4em 0 0;font-family:'Archivo Black','Arial Black','Helvetica Neue',Arial,sans-serif;font-weight:900;font-size:clamp(1.6rem,3cqw,2.6rem);line-height:1;letter-spacing:.01em}" +
  ".fc-note{margin:.9em 0 0;font-size:13px;line-height:1.55;opacity:.8}" +
  ".fc-sum{margin-top:1em;font-size:12px;font-weight:700;letter-spacing:.14em;text-transform:uppercase}" +
  ".fc-form{display:grid;grid-template-columns:1fr 6.5em 4.5em;column-gap:18px;row-gap:12px;align-content:start}" +
  ".fc-field{display:grid;gap:4px;grid-column:1/-1}.fc-f-card{grid-column:1/2}.fc-f-expiry{grid-column:2/3}.fc-f-cvc{grid-column:3/4}" +
  ".fc-field span{font-size:9.5px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;opacity:.6}" +
  ".fc-field input{all:unset;box-sizing:border-box;width:100%;font-size:14px;padding:4px 0 6px;border-bottom:1px solid rgba(33,26,20,.3);transition:border-color .2s ease}" +
  ".fc-field input:focus{border-color:#211a14}" +
  ".fc-field[data-bad] input{border-color:#c2263b}" +
  ".fc-field[data-bad] span{color:#c2263b;opacity:1}" +
  ".fc-form-foot{grid-column:1/-1;display:flex;justify-content:flex-end;align-items:center;gap:16px;margin-top:6px}" +
  ".fc-back{margin-top:1.4em;font-size:10px;font-weight:700;letter-spacing:.22em;text-transform:uppercase;opacity:.6;transition:opacity .2s ease}" +
  ".fc-back:hover{opacity:1}" +
  ".fc-flip{position:relative;flex:none;width:10.5rem;height:2.8rem;perspective:520px;color:#f1e9da;border-radius:999px}" +
  ".fc-air,.fc-spin{position:absolute;inset:0;transform-style:preserve-3d;will-change:transform}" +
  ".fc-face{position:absolute;inset:0;border-radius:999px;overflow:hidden;backface-visibility:hidden;-webkit-backface-visibility:hidden}" +
  ".fc-face-top{display:grid;place-items:center;background:linear-gradient(180deg,#2c2a28,#121110);font-size:11px;font-weight:800;letter-spacing:.18em;text-transform:uppercase;box-shadow:inset 0 1px 0 rgba(255,255,255,.16)}" +
  ".fc-face-bot{transform:rotateX(180deg) translateZ(1px);background:#1b1a1a}" +
  ".fc-face-bot img{position:absolute;left:50%;top:50%;width:2.8rem;height:10.5rem;transform:translate(-50%,-50%) rotate(90deg)}" +
  ".fc-truck{position:absolute;top:14%;bottom:14%;width:13%;border-radius:4px;background:linear-gradient(90deg,#b9b9bd,#f1f1f3 50%,#9d9da2);box-shadow:0 1px 2px rgba(0,0,0,.45)}" +
  ".fc-truck::before,.fc-truck::after{content:'';position:absolute;left:-12%;right:-12%;height:28%;border-radius:40%;background:#f4efe6}" +
  ".fc-truck::before{top:-26%}.fc-truck::after{bottom:-26%}" +
  ".fc-fshadow{position:absolute;left:10%;right:10%;bottom:-9px;height:8px;border-radius:50%;background:rgba(40,12,12,.28);filter:blur(4px)}" +
  ".fc-flip[data-go='kick'] .fc-air{animation:fc-pop .8s cubic-bezier(.3,.7,.4,1) both}" +
  ".fc-flip[data-go='kick'] .fc-spin{animation:fc-kick .8s cubic-bezier(.45,.05,.3,1) both}" +
  ".fc-flip[data-go='kick'] .fc-fshadow{animation:fc-sh .8s cubic-bezier(.3,.7,.4,1) both}" +
  ".fc-flip[data-go='bail'] .fc-spin{animation:fc-bail .5s cubic-bezier(.3,.7,.4,1) both}" +
  "@keyframes fc-pop{0%{transform:translateY(0)}14%{transform:translateY(3px)}50%{transform:translateY(-32px)}84%{transform:translateY(0)}92%{transform:translateY(2px)}100%{transform:translateY(0)}}" +
  "@keyframes fc-kick{0%,14%{transform:rotateX(0deg) rotateZ(0deg)}50%{transform:rotateX(190deg) rotateZ(-5deg)}84%,100%{transform:rotateX(360deg) rotateZ(0deg)}}" +
  "@keyframes fc-sh{0%,14%{transform:scaleX(1);opacity:1}50%{transform:scaleX(.55);opacity:.35}84%,100%{transform:scaleX(1);opacity:1}}" +
  "@keyframes fc-bail{0%,100%{transform:rotateZ(0)}20%{transform:rotateZ(-7deg) translateY(-6px)}45%{transform:rotateZ(5deg)}70%{transform:rotateZ(-2deg)}}" +
  ".fc-top-ui{position:absolute;z-index:7;left:var(--fc-g);right:var(--fc-g);top:var(--fc-g);display:flex;justify-content:space-between;align-items:center;font-size:11px;font-weight:700;letter-spacing:.22em;text-transform:uppercase;pointer-events:none}" +
  "@media (prefers-reduced-motion:reduce){.fc-deck[data-in],.fc-deck[data-out],.fc-cell i,.fc-flip[data-go] .fc-air,.fc-flip[data-go] .fc-spin,.fc-flip[data-go] .fc-fshadow{animation:none}" +
  ".fc-deck[data-out]{opacity:0}.fc-scene,.fc-scene[data-drawer],.fc-mark,.fc-front > *,.fc-scene[data-drawer] .fc-front > *,.fc-drawer,.fc-drawer[data-open],.fc-keys,.fc-plaque{transition-duration:.01s}}"

function Flap({ ch, delay }: { ch: string; delay: number }) {
  const [c, setC] = useState(" ")
  const [n, setN] = useState(0)
  const cur = useRef(" ")
  useEffect(() => {
    if (ch === cur.current) return
    const set = (x: string) => {
      cur.current = x
      setC(x)
      setN((v) => v + 1)
    }
    if (reduced()) {
      set(ch)
      return
    }
    const ids: number[] = []
    let step = 0
    const steps = 2 + Math.floor(Math.random() * 3)
    const tick = () => {
      step++
      if (step > steps) return set(ch)
      set(GLYPHS[Math.floor(Math.random() * GLYPHS.length)])
      ids.push(window.setTimeout(tick, 52))
    }
    ids.push(window.setTimeout(tick, delay))
    return () => ids.forEach(clearTimeout)
  }, [ch, delay])
  return (
    <span className="fc-cell">
      <i key={n}>{c === " " ? " " : c}</i>
    </span>
  )
}

function FlapRow({ text, delay }: { text: string; delay: number }) {
  return (
    <span className="fc-flaps">
      {text.split("").map((ch, i) => (
        <Flap key={i} ch={ch} delay={delay + i * 26} />
      ))}
    </span>
  )
}

type Ghost = { key: string; slot: number; k: number; image: string; rz: number }

export default function FlipboardCheckoutCounter({
  products = DEFAULT_PRODUCTS,
  defaultItems = [
    { id: "onyx", qty: 1 },
    { id: "garnet", qty: 1 },
  ],
  shopName = "Slab Skate Co.",
  backdropSrc = IMG_BASE + "wordmark.webp",
  currency = "$",
  defaultDetails = {},
  onCartChange,
  onPay,
  height = "100svh",
  className = "",
}: FlipboardCheckoutCounterProps) {
  const [lines, setLines] = useState(defaultItems)
  const [ghosts, setGhosts] = useState([] as Ghost[])
  const [mounted, setMounted] = useState(false)
  const [drawer, setDrawer] = useState(false)
  const [done, setDone] = useState(null as null | { id: string; total: number })
  const [go, setGo] = useState("")
  const [paid, setPaid] = useState(false)
  const [bad, setBad] = useState([] as string[])
  const [details, setDetails] = useState({ email: "", address: "", card: "", expiry: "", cvc: "", ...defaultDetails } as CheckoutDetails)
  const slots = useRef({} as Record<string, number>)
  const timers = useRef([] as number[])
  const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, reduced() ? 0 : ms))

  useEffect(() => {
    const t = window.setTimeout(() => setMounted(true), 60)
    return () => {
      window.clearTimeout(t)
      timers.current.forEach(clearTimeout)
    }
  }, [])
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDrawer(false)
    }
    window.addEventListener("keydown", key)
    return () => window.removeEventListener("keydown", key)
  }, [])

  // stable counter slots: a deck keeps its spot while others come and go
  for (const l of lines) {
    if (slots.current[l.id] === undefined) {
      const used = new Set(Object.values(slots.current))
      let s = 0
      while (used.has(s)) s++
      slots.current[l.id] = s
    }
  }
  const product = (id: string) => products.find((p) => p.id === id)
  const total = cartTotal(lines, products)
  const rz = (id: string, k: number) => 60 + ((id.charCodeAt(0) * 7 + k * 11) % 9) - 4

  const update = (id: string, qty: number) => {
    if (done || go) return
    const before = lines.find((l) => l.id === id)?.qty ?? 0
    const next = setQty(lines, id, qty)
    const after = next.find((l) => l.id === id)?.qty ?? 0
    if (after < before) {
      const p = product(id)
      const slot = slots.current[id]
      const gone: Ghost[] = []
      for (let k = after; k < Math.min(before, 3); k++) gone.push({ key: id + "-" + k + "-" + Date.now(), slot, k, image: p?.image ?? "", rz: rz(id, k) })
      setGhosts((g) => [...g, ...gone])
      later(() => setGhosts((g) => g.filter((x) => !gone.includes(x))), 2000)
      if (after === 0) delete slots.current[id]
    }
    setLines(next)
    onCartChange?.(next)
  }

  const pay = () => {
    if (go) return
    const b = validate(details)
    setBad(b)
    if (b.length) {
      setGo("bail")
      later(() => setGo(""), 520)
      return
    }
    const order = { id: "SL-" + String(2600 + ((total * 7 + lines.length * 13) % 400)), total }
    setGo("kick")
    later(() => setPaid(true), 400)
    later(() => setGo(""), 820)
    later(() => setDrawer(false), 1000)
    later(() => {
      setDone(order)
      onPay?.({ id: order.id, lines, total, details })
    }, 1500)
  }

  const reset = () => {
    setDone(null)
    setPaid(false)
    setGhosts([])
    slots.current = {}
    setLines([])
    later(() => setLines(defaultItems), 350)
  }

  const live = mounted
  const rows: Row[] = []
  if (done) {
    rows.push(pair("Thank you", ""), pair("Order", done.id), pair("Ships in", "48 H"))
  } else if (live) {
    for (const l of lines.slice(0, ROWS)) {
      const p = product(l.id)
      if (p) rows.push(rowText(p.name, l.qty, p.price, currency))
    }
    if (!lines.length) rows.push(pair("Cart empty", ""))
  }
  while (rows.length < ROWS) rows.push(pair("", ""))
  const shownTotal = done ? done.total : live ? total : 0
  const totalText = (currency + shownTotal).padStart(5, " ").slice(-5)
  const count = lines.reduce((s, l) => s + l.qty, 0)

  return (
    <div className={"fc-root " + className} style={{ height }}>
      <style>{CSS}</style>
      <div className="fc-top-ui">
        <span>{shopName}</span>
        <span aria-live="polite">
          {done ? "Order " + done.id : "Cart " + count}
        </span>
      </div>
      <div className="fc-scene" data-drawer={drawer ? "" : undefined}>
        {backdropSrc && <img className="fc-mark" src={backdropSrc} alt="" draggable={false} />}
        <div className="fc-floor" />
        <div className="fc-shadow" />
        <div className="fc-front" aria-hidden>
          <div className="fc-flute" />
          <div className="fc-plate">
            <b>{shopName.split(" ")[0].toUpperCase()}</b>
            <span>Skate Co. · Est. 2026</span>
            <span>Worldwide shipping · 30-day returns</span>
          </div>
          <div className="fc-flute" />
        </div>
        <div className="fc-lip" />
        <div className="fc-top">
          {live &&
            lines.flatMap((l, li) => {
              const p = product(l.id)
              if (!p) return []
              return Array.from({ length: Math.min(l.qty, 3) }, (_, k) => (
                <div
                  key={l.id + "-" + k}
                  className="fc-deck"
                  data-in=""
                  style={{ "--slot": slots.current[l.id], "--k": k, "--rz": rz(l.id, k) + "deg", "--d": (k ? 0 : li * 160) + "ms" } as React.CSSProperties}
                >
                  <div className="fc-deck-in">
                    <img src={p.image} alt="" draggable={false} />
                  </div>
                  {k === Math.min(l.qty, 3) - 1 && (
                    <button type="button" aria-label={"Remove one " + p.name} onClick={() => update(l.id, l.qty - 1)} disabled={!!done} />
                  )}
                </div>
              ))
            })}
          {ghosts.map((g) => (
            <div key={g.key} className="fc-deck" data-out="" style={{ "--slot": g.slot, "--k": g.k, "--rz": g.rz + "deg" } as React.CSSProperties}>
              <div className="fc-deck-in">
                <img src={g.image} alt="" draggable={false} />
              </div>
            </div>
          ))}
        </div>

        <div className="fc-board" role="group" aria-label="Your cart">
          <span className="fc-board-label">Your cart</span>
          <div className="fc-rows">
            {rows.map((r, i) => {
              const l = !done && live ? lines[i] : undefined
              const p = l && product(l.id)
              return (
                <div className="fc-row" key={i} data-live={p ? "" : undefined}>
                  <FlapRow text={r.left} delay={i * 140} />
                  <span className="fc-gap" />
                  <FlapRow text={r.right} delay={i * 140 + LEFT * 26} />
                  <span className="fc-keys">
                    <button type="button" className="fc-key" aria-label={p ? "One fewer " + p.name : "Fewer"} disabled={!p} onClick={() => l && update(l.id, l.qty - 1)}>
                      −
                    </button>
                    <button type="button" className="fc-key" aria-label={p ? "One more " + p.name : "More"} disabled={!p || (l?.qty ?? 0) >= 9} onClick={() => l && update(l.id, l.qty + 1)}>
                      +
                    </button>
                  </span>
                </div>
              )
            })}
          </div>
          <div className="fc-total">
            <span className="fc-board-label">Total</span>
            <FlapRow text={totalText} delay={ROWS * 140} />
          </div>
        </div>

        <button
          type="button"
          className="fc-plaque"
          disabled={!done && !lines.length}
          onClick={() => (done ? reset() : setDrawer((o) => !o))}
          aria-expanded={drawer}
        >
          {done ? "New order" : "Checkout"}
        </button>

        <form
          className="fc-drawer"
          data-open={drawer ? "" : undefined}
          aria-hidden={!drawer}
          onSubmit={(e) => {
            e.preventDefault()
            pay()
          }}
        >
          <div>
            <p className="fc-eyebrow">{shopName}</p>
            <h2 className="fc-h">CHECKOUT</h2>
            <p className="fc-note">
              Ships worldwide in 48 h.
              <br />
              30-day returns. Secure payment.
            </p>
            <p className="fc-sum">
              {count} {count === 1 ? "deck" : "decks"} · {currency}
              {total}
            </p>
            <button type="button" className="fc-back" tabIndex={drawer ? 0 : -1} onClick={() => setDrawer(false)}>
              Back to the counter
            </button>
          </div>
          <div className="fc-form">
            {(
              [
                ["email", "Email", "you@example.com"],
                ["address", "Shipping address", "Street, city, postcode"],
                ["card", "Card number", "4242 4242 4242 4242"],
                ["expiry", "MM / YY", "08 / 29"],
                ["cvc", "CVC", "123"],
              ] as const
            ).map(([k, label, ph]) => (
              <label key={k} className={"fc-field fc-f-" + k} data-bad={bad.includes(k) ? "" : undefined}>
                <span>{label}</span>
                <input
                  value={details[k]}
                  placeholder={ph}
                  tabIndex={drawer ? 0 : -1}
                  inputMode={k === "card" || k === "cvc" ? "numeric" : undefined}
                  autoComplete={k === "email" ? "email" : k === "address" ? "street-address" : k === "card" ? "cc-number" : k === "expiry" ? "cc-exp" : "cc-csc"}
                  onChange={(e) => {
                    setDetails((d) => ({ ...d, [k]: e.target.value }))
                    setBad((b) => b.filter((x) => x !== k))
                  }}
                />
              </label>
            ))}
            <div className="fc-form-foot">
              <button type="submit" className="fc-flip" data-go={go || undefined} tabIndex={drawer ? 0 : -1}>
                <span className="fc-fshadow" />
                <span className="fc-air">
                  <span className="fc-spin">
                    <span className="fc-face fc-face-top">{paid ? "Paid" : "Pay " + currency + total}</span>
                    <span className="fc-face fc-face-bot" aria-hidden>
                      <img src={product(lines[0]?.id ?? "")?.image ?? products[0]?.image} alt="" draggable={false} />
                      <span className="fc-truck" style={{ left: "17%" }} />
                      <span className="fc-truck" style={{ right: "17%" }} />
                    </span>
                  </span>
                </span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
