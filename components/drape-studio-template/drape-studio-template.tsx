"use client"

import { useEffect, useId, useRef, useState, type CSSProperties, type FormEvent } from "react"

// Drape Studio Template — a one-page site for Kedhareswer's design + front-end practice, dressed in
// deep red leather, window light and big type. Pictures are generated originals served from the
// component site (see README). Motion, measured frame by frame on the reference at 1440 × 806:
//   load: a four-ring mark spins inside a progress ring while it turns red → black → glass, the count
//   runs to 100%, then the four petals open into the hero; the hero fabric drifts, the glass mark sits
//   in the middle, the headline lines rise and the catalogue pill unrolls from its red dot.
//   scroll: pillar cards ride a pinned horizontal track; letter columns slide against each other; the
//   name stamps in letter by letter; "YOU DESIGN" breaks apart into "I DELIVER"; two swatch wheels turn
//   and feed the centre card; products swap inside a ring; the newsletter letter drops into its envelope.

// #region motion
export const EASE = "cubic-bezier(.16,1,.3,1)" // reveals, pill unroll, product swap
export const EASE_IO = "cubic-bezier(.65,0,.35,1)" // petals opening
export const LOAD_MS = 1900 // count 0 → 100 (reference: 3% at 0.0s, 100% at ~2.0s)
export const HOLD_MS = 0 // the bloom starts as the count lands
export const OPEN_MS = 1000 // petals open into the hero (reference: ~3.7× the mark at 2.5s, full screen by ~3.1s)
/** Bloom curve: quadratic in-out, so the petals reach ≈3.5× the mark 0.5s after 100% (reference frame 2.5s). */
export const bloomEase = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2)
export const clamp01 = (v: number) => (v <= 0 ? 0 : v > 1 ? 1 : v)
export const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
/** Scroll progress through a pinned section: 0 when its top meets the viewport top, 1 when its end does. */
export const pinProgress = (top: number, height: number, vh: number) => clamp01(-top / Math.max(1, height - vh))
/** Pillar track x: starts `lead` px in, ends with the last card's right edge on the gutter. */
export const trackX = (p: number, trackW: number, viewW: number, gutter: number, lead: number) =>
  lead + (viewW - gutter - trackW - lead) * p
/** The mark's colour while loading: red, then black, then glass (0..1 weights). */
export function markMix(t: number) {
  const black = clamp01((t - 0.38) / 0.14)
  const glass = clamp01((t - 0.78) / 0.14)
  return { red: 1 - black, black: black * (1 - glass), glass }
}
/** Wheel geometry at 1440 wide (measured): radius 787, tiles 121 px every 10°. */
export const WHEEL_R = 787
export const WHEEL_STEP = 10
export const wheelTurn = (p: number) => -40 + p * 110
/** Index of the tile sitting at the wheel's front point, the one nearest the middle of the page. */
export function frontTile(turn: number, n: number) {
  const k = Math.round(-turn / WHEEL_STEP)
  return ((k % n) + n) % n
}
/** Letters of the scatter block: the first word leaves, then the second arrives, one letter at a time. */
export const leaveAt = (p: number, i: number) => clamp01((p - (0.28 + i * 0.022)) / 0.12)
export const arriveAt = (p: number, i: number) => clamp01((p - (0.5 + i * 0.024)) / 0.12)
export const pickIndex = (p: number, n: number) => Math.min(n - 1, Math.max(0, Math.floor(p * n)))
/** Letter columns: odd columns sink, even ones rise, by this share of the viewport over the section. */
export const COLUMN_DRIFT = 0.3
/** Wheel easing: each frame the page covers this share of the way to the wheel's target (about a 0.5s glide). */
export const WHEEL_EASE = 0.11
/** Mark geometry (100-unit box): three rings at -90°, 30°, 150°, as on the reference's loader. */
export const MARK_RINGS = [[-90], [30], [150]]
export const MARK_D = 18.5
export const MARK_R = 21
export const MARK_HOLE = 10
// #endregion

const BASE = "https://kedhar-components.pages.dev/drape-studio-template/"
const img = (k: string) => BASE + k + ".webp"

const FONTS =
  "@font-face{font-family:DsSans;font-style:normal;font-weight:400 600;font-display:swap;src:url(data:font/woff2;base64,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) format('woff2')}"

const CSS =
  FONTS +
  ".ds-root{--paper:#f9f7f6;--ink:#141414;--mute:#ababab;--soft:#6d6d6d;--card:#ffffff;--red:#e8463c;--night:#08090b;--line:rgba(20,20,20,.07);--tick:#c2bdbb;--g:clamp(18px,3.9vw,56px);--dh:100svh;" +
  "position:relative;width:100%;background:var(--paper);color:var(--ink);font-family:DsSans,ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,Arial,sans-serif;font-weight:400;letter-spacing:-.01em;-webkit-font-smoothing:antialiased;overflow-x:clip}" +
  ".dark .ds-root{--paper:#0f0f10;--ink:#f1efee;--mute:#5d5d5d;--soft:#9a9a9a;--card:#1a1a1b;--line:rgba(255,255,255,.07);--tick:#4a4a4a}" +
  ".ds-root *,.ds-root *::before,.ds-root *::after{box-sizing:border-box;margin:0;padding:0}" +
  ".ds-root img{max-width:none;display:block}" +
  ".ds-root :where(a){color:inherit;text-decoration:none}" +
  ".ds-root :where(button,input){font:inherit;color:inherit;letter-spacing:inherit}" +
  ".ds-root :where(button){background:none;border:0;cursor:pointer}" +
  ".ds-root :where(a,button,input):focus-visible{outline:2px solid var(--red);outline-offset:3px}" +
  // light sections: paper + window light
  ".ds-light{position:relative;background:var(--paper);color:var(--ink);overflow:hidden}" +
  ".ds-blinds{position:absolute;inset:0;pointer-events:none;background-size:auto 190%;background-position:28% 38%;background-repeat:no-repeat;mix-blend-mode:multiply;opacity:.5}" +
  ".ds-fill{position:absolute;inset:0}" +
  ".dark .ds-blinds{mix-blend-mode:screen;opacity:.06;filter:invert(1)}" +
  ".ds-dark{position:relative;background:var(--night);color:#fff}" +
  ".ds-grain{position:absolute;inset:0;pointer-events:none;background:radial-gradient(120% 90% at 50% 30%,rgba(255,255,255,.07),transparent 60%)}" +
  // grid lines + side ticks
  ".ds-grid{position:absolute;inset:0;pointer-events:none}" +
  ".ds-grid i{position:absolute;top:0;bottom:0;width:1px;background:var(--line)}" +
  ".ds-dark .ds-grid i{background:rgba(255,255,255,.06)}" +
  ".ds-ticks{position:absolute;top:8%;bottom:8%;display:flex;flex-direction:column;justify-content:space-between;font-size:9px;line-height:1;color:var(--tick);letter-spacing:0}" +
  ".ds-dark .ds-ticks{color:#3c3c3c}" +
  ".ds-ticks.l{left:calc(var(--g)*.32)}.ds-ticks.r{right:calc(var(--g)*.32)}" +
  ".ds-meta{position:absolute;left:var(--g);right:var(--g);bottom:clamp(18px,8.2%,66px);height:12px;font-size:10px;line-height:12px;color:var(--soft);letter-spacing:0;pointer-events:none}" +
  ".ds-dark .ds-meta,.ds-onimg .ds-meta{color:rgba(255,255,255,.55)}" +
  ".ds-meta span{position:absolute;top:0;white-space:nowrap}" +
  ".ds-meta span:nth-child(1){left:0}.ds-meta span:nth-child(2){left:19%}.ds-meta span:nth-child(3){left:75%}.ds-meta span:nth-child(4){right:0}" +
  ".ds-meta b{font-weight:400;color:var(--red)}" +
  // type
  ".ds-h2{font-size:clamp(34px,3.9vw,56px);line-height:.98;font-weight:600;letter-spacing:-.05em;text-wrap:balance}" +
  ".ds-h2 em{font-style:normal;color:rgba(255,255,255,.5)}" +
  ".ds-light .ds-h2 em{color:var(--mute)}" +
  ".ds-h3{font-size:clamp(30px,3vw,44px);line-height:1.02;font-weight:600;letter-spacing:-.05em;text-wrap:balance}" +
  // film grain over everything, very quiet
  ".ds-grainfx{position:fixed;inset:-50%;width:200%;height:200%;pointer-events:none;z-index:55;opacity:.07;mix-blend-mode:overlay;background-image:url(\"data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 .5 0 0 0 0 .5 0 0 0 0 .5 0 0 0 1.4 -.2'/%3E%3C/filter%3E%3Crect width='220' height='220' filter='url(%23n)'/%3E%3C/svg%3E\");animation:ds-grain 1s steps(6) infinite}" +
  "@keyframes ds-grain{0%{transform:translate(0,0)}20%{transform:translate(-4%,3%)}40%{transform:translate(3%,-2%)}60%{transform:translate(-2%,-4%)}80%{transform:translate(4%,2%)}100%{transform:translate(0,0)}}" +
  // footer
  ".ds-foot{position:relative;background:#0b0b0c;color:#f1efee;overflow:hidden;padding:clamp(70px,9vw,130px) var(--g) 28px}" +
  ".ds-foot-top{display:grid;grid-template-columns:1.35fr 1fr;gap:40px;align-items:end}" +
  ".ds-foot h2{font-size:clamp(40px,5.6vw,84px);line-height:.95;font-weight:600;letter-spacing:-.055em}" +
  ".ds-foot h2 em{font-style:normal;color:rgba(255,255,255,.38)}" +
  ".ds-foot-mail{display:inline-block;margin-top:34px;font-size:clamp(18px,1.9vw,26px);font-weight:500;letter-spacing:-.03em;position:relative;padding-bottom:6px}" +
  ".ds-foot-mail::after{content:'';position:absolute;left:0;right:0;bottom:0;height:1px;background:currentColor;transform-origin:0 50%;transition:transform .6s " + EASE + "}" +
  ".ds-foot-cols{display:grid;grid-template-columns:repeat(3,1fr);gap:24px;font-size:13px;line-height:1.5}" +
  ".ds-foot-cols h6{font-size:10px;font-weight:500;letter-spacing:.02em;color:rgba(255,255,255,.4);margin-bottom:14px;text-transform:uppercase}" +
  ".ds-foot-cols button,.ds-foot-cols p{display:block;text-align:left;color:rgba(255,255,255,.82);padding:2px 0;transition:color .3s ease}" +
  ".ds-foot-word{margin-top:clamp(50px,7vw,100px);font-size:clamp(60px,17.2vw,260px);line-height:.78;font-weight:600;letter-spacing:-.065em;color:#161617;white-space:nowrap;user-select:none;-webkit-text-stroke:1px rgba(255,255,255,.06)}" +
  ".ds-foot-base{display:flex;justify-content:space-between;gap:16px;margin-top:22px;padding-top:18px;border-top:1px solid rgba(255,255,255,.08);font-size:11px;color:rgba(255,255,255,.45)}" +
  ".ds-foot-base button{color:inherit}" +
  ".ds-mag{transition:transform .5s " + EASE + "}" +
  ".ds-word{display:inline-block;transition:color .5s ease}" +
  ".ds-word.ds-dim{color:var(--mute)}" +
  ".ds-dark .ds-word.ds-dim{color:rgba(255,255,255,.35)}" +
  ".ds-word.ds-redw{color:var(--red)}" +
  // reveal
  ".ds-rv{opacity:0;transform:translateY(28px);transition:opacity .9s " + EASE + ",transform .9s " + EASE + "}" +
  ".ds-rv.ds-in{opacity:1;transform:none}" +
  // pill button
  ".ds-pill{position:relative;display:inline-flex;align-items:center;height:52px;padding:0 64px 0 22px;border-radius:40px;background:#fff;color:#141414;font-size:14px;font-weight:500;white-space:nowrap;overflow:hidden;box-shadow:0 1px 0 rgba(0,0,0,.04)}" +
  ".ds-pill i{position:absolute;right:5px;top:5px;width:42px;height:42px;border-radius:50%;background:var(--red);color:#fff;display:grid;place-items:center;transition:transform .5s " + EASE + "}" +
  ".ds-pill i svg{width:16px;height:16px}" +
  ".ds-pill.ds-blk i{background:#141414}" +
  ".ds-pill.ds-sm{height:46px;padding:0 54px 0 18px;font-size:13px}.ds-pill.ds-sm i{width:36px;height:36px}" +
  ".ds-pill.ds-bord{border:1px solid rgba(0,0,0,.12)}" +
  ".dark .ds-light .ds-pill{background:#f1efee}" +
  // nav
  ".ds-nav{position:sticky;top:0;z-index:30;height:0}" +
  ".ds-navin{position:absolute;left:0;right:0;top:16px;height:40px;padding:0 var(--g) 0 calc(var(--g)*.5)}" +
  ".ds-chip{position:absolute;top:0;height:40px;border-radius:22px;display:flex;align-items:center;gap:8px;padding:0 15px 0 12px;font-size:13px;font-weight:500;letter-spacing:-.02em;color:#fff;background:rgba(255,255,255,.14);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);transition:background-color .4s ease,color .4s ease}" +
  ".ds-chip svg{width:18px;height:18px}" +
  ".ds-brand{left:calc(var(--g)*.5)}" +
  ".ds-burger{right:calc(var(--g)*.5);width:40px;padding:0;justify-content:center}" +
  ".ds-burger span{display:block;width:12px;height:1.5px;background:currentColor;box-shadow:0 4px 0 currentColor;transform:translateY(-2px)}" +
  ".ds-nav.ds-tl .ds-chip{background:rgba(20,20,20,.07);color:#2a2a2a}" +
  ".dark .ds-nav.ds-tl .ds-chip{background:rgba(255,255,255,.08);color:#eee}" +
  ".ds-links{position:absolute;top:0;height:40px;display:flex;align-items:center;font-size:13px;letter-spacing:-.01em;color:#fff;transition:opacity .4s ease,transform .4s ease}" +
  ".ds-nav.ds-off .ds-links{opacity:0;transform:translateY(-8px);pointer-events:none}" +
  ".ds-lang{left:25.6%;gap:22px}.ds-menu{left:50%;gap:30px}" +
  ".ds-links button{opacity:.62;transition:opacity .25s ease;display:inline-flex;align-items:center;gap:6px}" +
  ".ds-links button.ds-on{opacity:1}" +
  ".ds-links button.ds-on::before{content:'';width:4px;height:4px;border-radius:50%;background:currentColor}" +
  ".ds-links svg{width:8px;height:8px}" +
  ".ds-sheet{position:absolute;right:calc(var(--g)*.5);top:48px;width:220px;padding:10px;border-radius:18px;background:rgba(20,20,20,.86);-webkit-backdrop-filter:blur(16px);backdrop-filter:blur(16px);color:#fff;display:grid;gap:2px;opacity:0;transform:translateY(-6px) scale(.98);transform-origin:100% 0;pointer-events:none;transition:opacity .3s ease,transform .4s " + EASE + "}" +
  ".ds-sheet.ds-open{opacity:1;transform:none;pointer-events:auto}" +
  ".ds-sheet button{text-align:left;padding:10px 12px;border-radius:10px;font-size:15px;font-weight:500}" +
  // preloader
  ".ds-pre{position:fixed;inset:0;z-index:60;pointer-events:none}" +
  ".ds-pre-ui{position:absolute;inset:0;background:var(--paper);overflow:hidden}" +
  ".ds-pre-name{position:absolute;left:0;right:0;top:3.6%;text-align:center;color:var(--red);font-size:clamp(20px,1.95vw,28px);font-weight:500;letter-spacing:-.04em}" +
  ".ds-pre-mid{position:absolute;left:50%;top:48.5%;width:clamp(200px,20.6vw,296px);aspect-ratio:1;transform:translate(-50%,-50%)}" +
  ".ds-pre-mid svg.ds-pre-ring{position:absolute;inset:0;width:100%;height:100%;overflow:visible}" +
  ".ds-pre-mark{position:absolute;inset:17%}" +
  ".ds-pre-mark svg{position:absolute;inset:0;width:100%;height:100%}" +
  ".ds-pre-pct{position:absolute;left:50%;bottom:calc(100% + 16px);transform:translateX(-50%) rotate(-90deg);transform-origin:50% 50%;font-size:9px;letter-spacing:0;color:#9a9a9a;white-space:nowrap;width:60px;text-align:center}" +
  ".ds-pre-pct b{font-weight:600;color:var(--ink)}" +
  ".ds-pre-load{position:absolute;left:50%;top:calc(100% + 30px);transform:translateX(-50%) rotate(90deg);font-size:9px;color:var(--soft);letter-spacing:0}" +
  ".ds-pre-cap{position:absolute;left:0;right:0;bottom:8%;text-align:center;font-size:11px;line-height:1.35;color:var(--soft)}" +
  ".ds-petals{position:absolute;inset:0;width:100%;height:100%}" +
  ".ds-pre-top{position:absolute;left:50%;top:48.5%;aspect-ratio:1;opacity:0;transform:translate(-50%,-50%)}" +
  ".ds-pre-top svg,.ds-hero-mark svg,.ds-pre-mark svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible}" +
  ".ds-lens{position:absolute;inset:0;-webkit-mask-size:100% 100%;mask-size:100% 100%;-webkit-backdrop-filter:blur(5px) brightness(1.22) saturate(1.12);backdrop-filter:blur(5px) brightness(1.22) saturate(1.12);background:linear-gradient(150deg,rgba(255,255,255,.2),rgba(255,255,255,.02) 46%,rgba(255,255,255,.12))}" +
  ".ds-lens-paper{-webkit-backdrop-filter:blur(3px) brightness(1.04);backdrop-filter:blur(3px) brightness(1.04);background:linear-gradient(150deg,rgba(255,255,255,.75),rgba(225,215,215,.35) 50%,rgba(255,255,255,.6));box-shadow:none}" +
  // hero
  ".ds-hero{position:relative;overflow:hidden;background:#4a0b10;color:#fff;min-height:540px}" +
  ".ds-hero-bg{position:absolute;inset:-4%;}" +
  ".ds-hero-bg img{width:100%;height:100%;object-fit:cover;animation:ds-drift 22s ease-in-out infinite alternate}" +
  "@keyframes ds-drift{from{transform:scale(1.04) translate(-1.2%,-.8%)}to{transform:scale(1.12) translate(1.4%,1%)}}" +
  ".ds-hero-shade{position:absolute;inset:0;background:linear-gradient(180deg,rgba(30,0,4,.28),transparent 30%,transparent 62%,rgba(25,0,3,.42))}" +
  ".ds-hero-mark{position:absolute;left:50%;top:46.5%;width:clamp(190px,22.4vw,322px);aspect-ratio:1;transform:translate(-50%,-50%)}" +
  ".ds-hero-mark{transition:transform .9s " + EASE + ";will-change:transform}" +
  ".ds-hero-foot{position:absolute;left:var(--g);right:var(--g);bottom:clamp(40px,8.6%,72px);display:grid;grid-template-columns:1fr 1fr;align-items:end}" +
  ".ds-h1{font-size:clamp(40px,3.9vw,56px);line-height:1.02;font-weight:600;letter-spacing:-.055em}" +
  ".ds-h1 span{display:block;overflow:hidden;padding-bottom:.06em}" +
  ".ds-h1 span>b{display:block;font-weight:600;transform:translateY(105%);transition:transform 1.1s " + EASE + "}" +
  ".ds-h1 span+span{color:rgba(255,255,255,.58)}" +
  ".ds-go .ds-h1 span>b{transform:none}" +
  ".ds-go .ds-h1 span+span>b{transition-delay:.12s}" +
  ".ds-info{display:flex;align-items:flex-end;justify-content:space-between;gap:24px}" +
  ".ds-info h4{font-size:16px;font-weight:600;letter-spacing:-.03em;line-height:1.2}" +
  ".ds-info p{margin-top:8px;font-size:12px;line-height:1.4;color:rgba(255,255,255,.66);max-width:290px}" +
  ".ds-fade{opacity:0;transform:translateY(14px);transition:opacity .9s " + EASE + " .25s,transform .9s " + EASE + " .25s}" +
  ".ds-go .ds-fade{opacity:1;transform:none}" +
  ".ds-unroll{clip-path:inset(0 0 0 calc(100% - 52px) round 40px);transition:clip-path 1s " + EASE + " .45s}" +
  ".ds-go .ds-unroll{clip-path:inset(0 0 0 0 round 40px)}" +
  // pillars
  ".ds-pillars{position:relative;background:#121212;color:#fff}" +
  ".ds-pin{position:sticky;top:0;height:var(--dh);min-height:540px;overflow:hidden}" +
  ".ds-pin-bg{position:absolute;inset:-6%;}" +
  ".ds-pin-bg img{width:100%;height:100%;object-fit:cover}" +
  ".ds-pin-bg::after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.35),rgba(0,0,0,.08) 40%,rgba(0,0,0,.45))}" +
  ".ds-sec-head{position:absolute;left:var(--g);top:15.8%}" +
  ".ds-track{position:absolute;left:0;top:38.6%;display:flex;gap:clamp(14px,1.7vw,24px);will-change:transform}" +
  ".ds-card{position:relative;flex:none;width:clamp(300px,45.3vw,652px);height:clamp(300px,44vh,356px);border-radius:18px;background:#fff;color:#141414;padding:8px;--line:rgba(20,20,20,.08);--soft:#6d6d6d;display:grid;grid-template-columns:1fr 41%;gap:8px;box-shadow:0 0 0 3px rgba(255,255,255,.9),0 30px 60px -30px rgba(0,0,0,.6)}" +
  ".ds-card-l{position:relative;padding:20px 18px 14px 20px;display:flex;flex-direction:column}" +
  ".ds-card-l h5{font-size:clamp(15px,1.25vw,18px);font-weight:600;letter-spacing:-.04em;padding-bottom:14px;border-bottom:1px solid var(--line)}" +
  ".ds-card-l .ds-sq{position:absolute;right:18px;top:24px;width:10px;height:10px;border-radius:2px;background:var(--ink);box-shadow:inset 0 0 0 2px var(--card),0 0 0 1px var(--ink)}" +
  ".ds-ico{margin-top:auto;width:58px;height:58px;border-radius:50%;border:1px solid rgba(0,0,0,.14);display:grid;place-items:center;color:#555}" +
  ".dark .ds-ico{border-color:rgba(255,255,255,.16);color:#bbb}" +
  ".ds-ico svg{width:24px;height:24px}" +
  ".ds-card-l p{margin-top:20px;font-size:13px;line-height:1.45;color:var(--soft);max-width:260px;text-wrap:pretty}" +
  ".ds-card-r{position:relative;border-radius:12px;overflow:hidden;background:#222}" +
  ".ds-card-r img{width:100%;height:100%;object-fit:cover;filter:blur(14px) brightness(.8) saturate(.6);transform:scale(1.25);transition:filter .8s " + EASE + ",transform .8s " + EASE + "}" +
  ".ds-card-r::after{content:'';position:absolute;inset:0;background:radial-gradient(120% 90% at 70% 15%,rgba(255,255,255,.14),transparent 55%),linear-gradient(180deg,rgba(0,0,0,0),rgba(0,0,0,.35))}" +
  ".ds-card-r b{z-index:1}" +
  ".ds-card-r b{position:absolute;left:14px;top:10px;font-size:clamp(30px,3.2vw,46px);font-weight:400;letter-spacing:-.04em;color:var(--red)}" +
  // globe
  ".ds-globe{height:var(--dh);min-height:600px}" +
  ".ds-globe-head{position:absolute;left:0;right:0;top:8.3%;text-align:center;z-index:3}" +
  ".ds-globe-head p{margin:14px auto 0;font-size:13px;line-height:1.35;color:var(--soft);max-width:300px}" +
  ".ds-globe-head .ds-pill{margin-top:18px}" +
  ".ds-earth{position:absolute;left:50%;top:36%;width:min(81vw,1170px);aspect-ratio:1;transform:translateX(-50%)}" +
  ".ds-earth>img{width:100%;height:100%;border-radius:50%;filter:contrast(1.04)}" +
  ".ds-pinpt{position:absolute;width:30px;height:30px;margin:-15px 0 0 -15px;border-radius:50%;background:#fff;box-shadow:0 0 0 1.5px #222,0 6px 14px rgba(0,0,0,.35);display:grid;place-items:center;transform:scale(0)}" +
  ".ds-pinpt::after{content:'';width:9px;height:9px;border-radius:50%;background:var(--red)}" +
  ".ds-place{position:absolute;width:clamp(170px,15.6vw,226px);padding:15px 16px 16px;border-radius:12px;background:#fff;color:#141414;box-shadow:0 14px 30px -12px rgba(0,0,0,.45);opacity:0}" +
  ".ds-place h6{font-size:17px;font-weight:600;letter-spacing:-.03em;padding-bottom:9px;margin-bottom:8px;border-bottom:1px solid rgba(0,0,0,.08)}" +
  ".ds-place p{font-size:11.5px;line-height:1.42;color:#5a5a5a}" +
  ".ds-pinpt.ds-shown{animation:ds-pop .6s " + EASE + " both}.ds-place.ds-shown{animation:ds-card .7s " + EASE + " both}" +
  "@keyframes ds-pop{from{transform:scale(0)}to{transform:none}}" +
  "@keyframes ds-card{from{opacity:0;transform:translateY(12px) scale(.96)}to{opacity:1;transform:none}}" +
  ".ds-tabs{position:absolute;left:calc(50% - min(40.5vw,585px) + min(4.6vw,66px));right:calc(50% - min(40.5vw,585px) + min(4.6vw,66px));bottom:3.6%;display:grid;grid-template-columns:repeat(3,1fr);gap:clamp(16px,6vw,110px);color:#fff}" +
  ".ds-tabs button{text-align:left;font-size:clamp(12px,1vw,14px);font-weight:500;letter-spacing:-.02em;padding-bottom:9px;position:relative;opacity:.55;transition:opacity .3s ease}" +
  ".ds-tabs button.ds-on{opacity:1}" +
  ".ds-tabs button::after{content:'';position:absolute;left:0;right:0;bottom:0;height:1px;background:rgba(255,255,255,.3)}" +
  ".ds-tabs button i{position:absolute;left:0;bottom:0;height:1px;width:0;background:#fff;z-index:1}" +
  ".ds-tabs button.ds-on i{animation:ds-bar 5s linear forwards}" +
  "@keyframes ds-bar{to{width:100%}}" +
  ".ds-tabs small{display:block;margin-top:8px;font-size:10px;opacity:.75;font-weight:400}" +
  ".ds-tabs button:nth-child(1){text-align:left}.ds-tabs button:nth-child(2){text-align:left}.ds-tabs button:nth-child(3){text-align:right}" +
  // cta
  ".ds-cta{height:calc(var(--dh)*1.05);min-height:620px}" +
  ".ds-cta-head{position:absolute;left:0;right:0;top:8.6%;text-align:center}" +
  ".ds-orbs{position:absolute;left:50%;top:60%;width:clamp(300px,33.4vw,480px);aspect-ratio:1;margin:calc(clamp(300px,33.4vw,480px)/-2) 0 0 calc(clamp(300px,33.4vw,480px)/-2);will-change:transform}" +
  ".ds-orb{position:absolute;width:50%;height:50%;border-radius:50%;overflow:hidden;background:#5a0d14}" +
  ".ds-orb img{position:absolute;width:300%;height:300%;object-fit:cover;max-width:none;filter:saturate(1.35) contrast(1.15) brightness(.92)}" +
  ".ds-orb::after{content:'';position:absolute;inset:0;border-radius:50%;background:radial-gradient(60% 55% at 32% 26%,rgba(255,220,220,.22),transparent 60%),radial-gradient(85% 85% at 50% 50%,transparent 58%,rgba(30,0,4,.6));box-shadow:inset 0 -14px 30px rgba(20,0,3,.35)}" +
  ".ds-orbs{filter:drop-shadow(0 30px 40px rgba(90,10,20,.28))}" +
  ".ds-orbs a{position:absolute;inset:30%;border-radius:50%;display:grid;place-items:center;color:#fff;font-size:clamp(13px,1.05vw,15px);font-weight:500;letter-spacing:-.02em;z-index:2}" +
  ".ds-orbs a span{transition:transform .5s " + EASE + "}" +
  // letters
  ".ds-letters{height:calc(var(--dh)*1.7);min-height:900px}" +
  ".ds-cols{position:absolute;left:var(--g);right:var(--g);top:calc(var(--dh)*.16);bottom:0;display:grid;grid-template-columns:repeat(4,1fr)}" +
  ".ds-col{position:relative;will-change:transform}" +
  ".ds-big{display:block;font-size:clamp(110px,33vw,475px);line-height:.86;margin:0 0 calc(var(--dh)*.42);font-weight:400;letter-spacing:-.04em;color:var(--red)}" +
  ".ds-col .ds-note{margin:clamp(16px,3vw,40px) 0;font-size:clamp(12px,1.1vw,16px);line-height:1.3;color:var(--ink);max-width:250px}" +
  ".ds-note small{display:block;color:var(--soft);font-size:.8em;margin-top:8px;line-height:1.4}" +
  ".ds-note ol{list-style:none;display:grid;gap:2px;font-size:clamp(14px,1.4vw,20px);letter-spacing:-.03em}" +
  ".ds-note ol span{font-size:.45em;color:var(--soft);margin-right:4px;vertical-align:middle}" +
  // name
  ".ds-name{position:relative;height:var(--dh);min-height:420px;background:var(--red);overflow:hidden;display:grid;place-items:center}" +
  ".ds-name .ds-blinds{opacity:.55}" +
  ".dark .ds-name .ds-blinds{mix-blend-mode:multiply;opacity:.4;filter:none}" +
  ".ds-word-big{position:relative;display:flex;font-size:clamp(36px,15.3vw,240px);line-height:1;font-weight:600;letter-spacing:-.045em;will-change:transform;filter:drop-shadow(0 -1px 0 rgba(255,255,255,.22)) drop-shadow(0 2px 1px rgba(60,0,0,.45)) drop-shadow(0 18px 22px rgba(70,0,0,.32))}" +
  ".ds-word-big span{display:block;color:#151515;background-size:cover;background-position:center;-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;opacity:0;transform:translateY(18%) scale(.92);transition:opacity .5s ease,transform .8s " + EASE + "}" +
  ".ds-word-big.ds-in span{opacity:1;transform:none}" +
  // scatter
  ".ds-scatter{height:calc(var(--dh)*2.4)}" +
  ".ds-stage{position:absolute;inset:0}" +
  ".ds-ch{position:absolute;left:0;top:0;font-size:clamp(64px,10.3vw,149px);line-height:1;font-weight:600;letter-spacing:0;transform:translate(-50%,-50%);will-change:transform,opacity,filter}" +
  ".ds-mid{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);font-size:clamp(12px,1.05vw,15px);font-weight:500;letter-spacing:-.02em}" +
  // textures
  ".ds-tex{height:calc(var(--dh)*2.6)}" +
  ".ds-wheel{position:absolute;top:50%;width:0;height:0}" +
  ".ds-tile{position:absolute;left:0;top:0;width:var(--ts);height:var(--ts);margin:calc(var(--ts)/-2) 0 0 calc(var(--ts)/-2);border-radius:14px;overflow:hidden;padding:7%;box-shadow:inset 0 0 0 1px rgba(255,255,255,.1),0 10px 24px rgba(0,0,0,.5);background:linear-gradient(160deg,#202020,#0d0d0d)}" +
  ".ds-tile img{width:100%;height:100%;object-fit:cover;border-radius:9px}" +
  ".ds-tile-lab{position:absolute;left:0;top:0;font-size:9px;color:rgba(255,255,255,.55);white-space:nowrap;letter-spacing:0}" +
  ".ds-tex-head{position:absolute;left:0;right:0;top:6.6%;text-align:center;z-index:2}" +
  ".ds-frame{position:absolute;left:50%;top:49.3%;width:clamp(190px,23.6vw,340px);aspect-ratio:1;transform:translate(-50%,-50%);border-radius:28px;background:linear-gradient(160deg,#1c1c1c,#0c0c0c);box-shadow:0 0 0 1px rgba(255,255,255,.08),0 30px 60px rgba(0,0,0,.6);padding:8%;z-index:2}" +
  ".ds-frame-in{position:absolute;inset:8.5%;border-radius:16px;overflow:hidden;box-shadow:0 0 0 1px rgba(255,255,255,.16)}" +
  ".ds-frame img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transition:opacity .45s ease}" +
  ".ds-side{position:absolute;top:49.3%;transform:translateY(-50%);font-size:clamp(14px,1.25vw,18px);font-weight:500;letter-spacing:-.03em;z-index:2}" +
  ".ds-side sup{font-size:.55em;vertical-align:top}" +
  ".ds-tex-foot{position:absolute;left:0;right:0;bottom:4%;text-align:center;z-index:2}" +
  ".ds-tex-foot p{font-size:12px;line-height:1.38;color:rgba(255,255,255,.62);max-width:260px;margin:0 auto 22px}" +
  // industries
  ".ds-ind{height:calc(var(--dh)*3.4)}" +
  ".ds-ring{position:absolute;left:50%;top:47.4%;width:clamp(300px,37.7vw,543px);aspect-ratio:1;transform:translate(-50%,-50%);border-radius:50%;box-shadow:inset 0 0 0 1px rgba(255,255,255,.22)}" +
  ".ds-disc{position:absolute;inset:6.6%;border-radius:50%;background:radial-gradient(80% 80% at 42% 32%,#383838,#1e1e1e 72%);box-shadow:0 0 0 1px rgba(255,255,255,.06),inset 0 2px 20px rgba(255,255,255,.04)}" +
  ".ds-prod{position:absolute;inset:3%;mix-blend-mode:lighten;transition:opacity .6s " + EASE + ",transform .8s " + EASE + "}" +
  ".ds-prod img{width:100%;height:100%;object-fit:contain;-webkit-mask-image:radial-gradient(closest-side,#000 86%,transparent 97%);mask-image:radial-gradient(closest-side,#000 86%,transparent 97%)}" +
  ".ds-count{position:absolute;left:var(--g);top:73%;font-size:clamp(22px,2vw,29px);font-weight:500;letter-spacing:-.04em}" +
  ".ds-count small{font-size:10px;color:rgba(255,255,255,.4);margin-left:4px;vertical-align:top}" +
  ".ds-ilab{position:absolute;right:var(--g);top:73%;text-align:right;font-size:clamp(20px,2vw,29px);font-weight:500;letter-spacing:-.04em}" +
  ".ds-ilab p{display:none}" +
  ".ds-dot{position:absolute;right:var(--g);top:14.6%;width:6px;height:6px;border-radius:50%;background:#fff}" +
  ".ds-ruler{position:absolute;left:var(--g);right:var(--g);bottom:clamp(30px,8%,64px);height:10px;border-top:1px solid rgba(255,255,255,.25);background:repeating-linear-gradient(90deg,rgba(255,255,255,.25) 0 1px,transparent 1px 8%) top/100% 6px no-repeat}" +
  ".ds-ruler i{position:absolute;top:-4px;width:7px;height:7px;margin-left:-3.5px;border-radius:50%;background:var(--red)}" +
  ".ds-ind .ds-meta{bottom:calc(clamp(30px,8%,64px) + 16px)}" +
  // newsletter
  ".ds-news{height:var(--dh);min-height:640px}" +
  ".ds-env{position:absolute;left:50%;top:27.7%;width:clamp(300px,32.8vw,472px);margin-left:calc(clamp(300px,32.8vw,472px)/-2);height:clamp(330px,63.4%,511px)}" +
  ".ds-env-back{position:absolute;inset:0;border-radius:4px;background:#262626;clip-path:polygon(5% 0,95% 0,100% 16%,100% 100%,0 100%,0 16%)}" +
  ".ds-env-front{position:absolute;left:0;right:0;bottom:0;height:59%;border-radius:0 0 4px 4px;overflow:hidden;background:#2c2c2c;box-shadow:0 -1px 0 rgba(255,255,255,.06);z-index:3}" +
  ".ds-env-front::before{content:'';position:absolute;inset:0;background:linear-gradient(180deg,rgba(255,255,255,.05),transparent 14%)}" +
  ".ds-env-tex{position:absolute;inset:0;opacity:.1;mix-blend-mode:overlay;background-size:cover}" +
  ".ds-env-deboss{position:absolute;left:50%;top:58%;width:44%;transform:translate(-50%,-50%);opacity:.5}" +
  ".ds-letter{position:absolute;left:11%;right:11%;top:3%;height:50%;border-radius:4px;background:linear-gradient(180deg,#f3f2f1,#dedcdb);color:#141414;padding:16px 16px 0;z-index:2;transition:transform .8s " + EASE_IO + "}" +
  ".ds-letter h6{font-size:clamp(11px,.95vw,13px);line-height:1.25;font-weight:600;letter-spacing:-.02em}" +
  ".ds-letter h6 span{display:block;color:#9c9c9c;font-weight:500}" +
  ".ds-letter input[type=email]{margin-top:12px;width:100%;height:34px;border-radius:20px;border:0;background:#fff;padding:0 14px;font-size:12px;color:#141414;outline:0;box-shadow:0 0 0 1px rgba(0,0,0,.05)}" +
  ".ds-letter label{margin-top:10px;display:flex;gap:8px;align-items:flex-start;font-size:8.5px;line-height:1.35;color:#7a7a7a;cursor:pointer}" +
  ".ds-letter label input{flex:none;width:11px;height:11px;margin-top:1px;accent-color:#141414}" +
  ".ds-letter label b{font-weight:400;color:var(--red)}" +
  ".ds-env.ds-sent .ds-letter{transform:translateY(80%)}" +
  ".ds-submit{position:absolute;left:50%;top:76%;transform:translate(-50%,-50%);z-index:4;transition:opacity .4s ease,background-color .3s ease,color .3s ease}" +
  ".ds-submit.ds-pill i{background:#141414;transition:background-color .3s ease,color .3s ease}" +
  ".ds-submit.ds-ready{background:#141414;color:#fff}.ds-submit.ds-ready i{background:#fff;color:#141414}" +
  ".ds-env.ds-sent .ds-submit{opacity:0;pointer-events:none}" +
  ".ds-thanks{position:absolute;left:0;right:0;top:-12%;height:66%;z-index:2;pointer-events:none}" +
  ".ds-tcard{position:absolute;width:62%;height:100%;border-radius:18px;opacity:0;transition:transform 1.1s " + EASE + ",opacity .5s ease}" +
  ".ds-tcard.r{left:0;overflow:hidden;transform:translateY(60%) rotate(-4deg);background:#5a0d14}" +
  ".ds-tcard.r img{width:100%;height:100%;object-fit:cover}" +
  ".ds-tcard.g{right:6%;transform:translateY(60%) rotate(2deg);background:linear-gradient(180deg,rgba(120,110,112,.42),rgba(60,40,44,.28));-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);box-shadow:inset 0 0 0 1px rgba(255,255,255,.35),0 20px 40px -20px rgba(0,0,0,.5);color:#fff;text-align:center;padding:12% 10% 0}" +
  ".ds-tcard.g h6{font-size:clamp(22px,2vw,30px);font-weight:600;letter-spacing:-.04em;text-shadow:0 1px 10px rgba(60,0,6,.55)}" +
  ".ds-tcard.g p{margin-top:10px;font-size:12px;line-height:1.35;color:#fff;text-shadow:0 1px 8px rgba(60,0,6,.6)}" +
  ".ds-sign{position:absolute;left:12%;bottom:12%;font-family:'Brush Script MT','Segoe Script',cursive;font-size:clamp(26px,2.4vw,36px);color:#c3242a;transform:rotate(-8deg);letter-spacing:0}" +
  ".ds-env.ds-sent .ds-tcard{opacity:1}" +
  ".ds-env.ds-sent .ds-tcard.r{transform:translate(2%,-30%) rotate(-7deg);transition-delay:.55s}" +
  ".ds-env.ds-sent .ds-tcard.g{transform:translate(-2%,-26%) rotate(6deg);transition-delay:.7s}" +
  ".ds-mailto{color:var(--ink)}" +
  // hover
  "@media (hover:hover) and (pointer:fine){" +
  ".ds-card:hover .ds-card-r img{filter:blur(6px) brightness(.9) saturate(.75);transform:scale(1.15)}" +
  ".ds-chip:hover{background:rgba(255,255,255,.24)}.ds-nav.ds-tl .ds-chip:hover{background:rgba(20,20,20,.12)}" +
  ".ds-tile:hover img{transform:scale(1.08)}.ds-tile img{transition:transform .6s " + EASE + "}" +
  ".ds-foot-mail:hover::after{transform:scaleX(.35)}" +
  ".ds-foot-cols button:hover,.ds-foot-base button:hover{color:#fff}" +
  ".ds-tabs button:hover{opacity:.85}" +
  ".ds-pill:hover i{transform:rotate(45deg)}" +
  ".ds-links button:hover{opacity:1}" +
  ".ds-sheet button:hover{background:rgba(255,255,255,.1)}" +
  ".ds-orbs a:hover span{transform:scale(1.08)}" +
  ".ds-card{transition:transform .5s " + EASE + "}.ds-card:hover{transform:translateY(-6px)}" +
  ".ds-place:hover{box-shadow:0 18px 36px -12px rgba(0,0,0,.55)}" +
  ".ds-mailto:hover{color:var(--red)}" +
  "}" +
  // phones
  "@media (max-width:760px){" +
  ".ds-links{display:none}" +
  ".ds-foot-top{grid-template-columns:1fr}.ds-foot-cols{grid-template-columns:1fr 1fr}.ds-foot-base{flex-direction:column}" +
  ".ds-hero-foot{grid-template-columns:1fr;gap:26px}" +
  ".ds-info{flex-direction:column;align-items:flex-start}" +
  ".ds-hero-mark{top:36%}" +
  ".ds-card{grid-template-columns:1fr;grid-template-rows:1fr 46%;height:440px;width:80vw}" +
  ".ds-track{top:34%}" +
  ".ds-earth{width:118vw;top:42%}" +
  ".ds-place{width:132px;padding:9px 10px}.ds-place h6{font-size:12px;padding-bottom:5px;margin-bottom:5px}.ds-place p{font-size:9px}" +
  ".ds-tabs{gap:10px}.ds-tabs small{display:none}.ds-place{display:none}" +
  ".ds-meta span:nth-child(2),.ds-meta span:nth-child(3){display:none}" +
  ".ds-orbs{top:58%}" +
  ".ds-col .ds-note{display:none}" +
  ".ds-col:nth-child(1) .ds-note,.ds-col:nth-child(4) .ds-note{display:block;font-size:11px}" +
  ".ds-side{top:auto;bottom:22%}" +
  ".ds-tex-foot p{display:none}" +
  ".ds-ilab p{display:block;margin-top:8px;font-size:11px;line-height:1.35;font-weight:400;letter-spacing:0;color:rgba(255,255,255,.6);max-width:46vw}" +
  ".ds-count,.ds-ilab{top:72%}" +
  ".ds-env{top:24%}" +
  "}" +
  // reduced motion
  "@media (prefers-reduced-motion:reduce){" +
  ".ds-hero-bg img{animation:none}.ds-grainfx{animation:none}.ds-mag{transition:none!important;transform:none!important}" +
  ".ds-rv,.ds-fade,.ds-h1 span>b,.ds-word-big span,.ds-prod,.ds-place,.ds-pinpt,.ds-tcard,.ds-letter{transition:none!important}" +
  ".ds-rv,.ds-fade{opacity:1;transform:none}.ds-h1 span>b{transform:none}.ds-unroll{clip-path:none;transition:none}" +
  ".ds-tabs button.ds-on i{animation:none;width:100%}" +
  "}"

// ---- content -----------------------------------------------------------------

const PILLARS = [
  { t: "Tailored support", d: "Kedhareswer works closely with you from first sketch to launch, with clear notes and quick replies at every stage.", ico: "hand", m: "m1" },
  { t: "Rapid delivery", d: "Lean scopes and a tested component kit keep turnaround fast and launch dates reliable.", ico: "truck", m: "m2" },
  { t: "Quality assurance", d: "Every build is checked across browsers, screen sizes and reduced-motion settings before it ships.", ico: "shield", m: "m3" },
  { t: "Research backed", d: "Decisions start from your users and your numbers, then get tested against both.", ico: "flask", m: "m4" },
  { t: "Long-term care", d: "After launch Kedhareswer stays on for fixes, small features and the next round of ideas.", ico: "loop", m: "m1" },
]

// globe pins: x / y in % of the globe picture
const PLACES = [
  {
    tab: "Clients",
    sub: "India / UAE / China / Japan",
    items: [
      { n: "India", d: "Home studio of Kedhareswer. Brand sites and product UI, designed and built end to end.", x: 28, y: 33, cx: 22, cy: -158 },
      { n: "UAE", d: "Client 1: a launch site and booking flow, shipped in six weeks.", x: 14, y: 25, cx: -210, cy: -150 },
      { n: "China", d: "Client 2: a product catalogue with a hundred-plus materials, built to filter fast.", x: 63, y: 24, cx: -248, cy: -176 },
      { n: "Japan", d: "Client 3: a quiet, motion-led portfolio for a design studio.", x: 72, y: 22, cx: 26, cy: -40 },
    ],
  },
  {
    tab: "Studio",
    sub: "India",
    items: [{ n: "India", d: "Where Kedhareswer designs, writes the code and tests every page before it ships.", x: 28, y: 33, cx: 24, cy: -150 }],
  },
  {
    tab: "Partners",
    sub: "Nepal / Korea",
    items: [
      { n: "Nepal", d: "Project 01: photography and retouching partner for product shoots.", x: 34, y: 22, cx: -250, cy: -140 },
      { n: "Korea", d: "Project 02: motion and 3D partner for launch films.", x: 66, y: 20, cx: 26, cy: -140 },
    ],
  },
]

const COLOR_SW = ["Teal satin", "Crimson silk", "Olive sheen", "Lilac charmeuse", "Tangerine silk", "Champagne satin", "Cobalt silk", "Blush satin", "Emerald silk"]
const FINISH_SW = ["Perforated", "Carbon twill", "Quilted", "Crackle", "Croc emboss", "Knit mesh", "Brushed metal", "Honeycomb", "Suede"]

const INDUSTRIES = [
  { n: "Footwear", d: "Drop pages and product stories for sneaker and shoe labels." },
  { n: "Handbags", d: "Lookbooks and storefronts for bags and accessories." },
  { n: "Audio", d: "Launch sites for headphones and speakers, sound-first." },
  { n: "Interiors", d: "Catalogues for furniture makers, built to browse slowly." },
  { n: "Automotive", d: "Configurator screens and spec pages for seating and trim." },
  { n: "Sport", d: "Team and equipment sites that load fast on the field." },
]

// letters: first word, then second; x / y in % of the stage
const WORD_A = [
  ["Y", 18, 13], ["O", 49, 13], ["U", 77, 13],
  ["D", 18, 49], ["E", 77, 49],
  ["S", 17, 86], ["I", 39, 86], ["G", 57, 86], ["N", 77, 86],
] as const
const WORD_B = [
  ["I", 50, 15],
  ["D", 37, 61], ["E", 63, 61],
  ["L", 22, 86], ["I", 36, 86], ["V", 50, 86], ["E", 64, 86], ["R", 78, 86],
] as const

const NAME = "Kedhareswer"

// ---- small pieces ------------------------------------------------------------

const Arrow = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
    <path d="M4.5 11.5l7-7M5.5 4.5h6v6" />
  </svg>
)

const Icon = ({ k }: { k: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {k === "hand" && <path d="M3 12l4-4 3 1 3-2 4 1 4 4M7 8l-4 4 5 5 2-1 2 2 2-1 2 2 3-3M10 16l2-2M12 18l2-2M9 11l3-2" />}
    {k === "truck" && <path d="M2 6h11v9H2zM13 9h4l3 3v3h-7M6 18.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM16.5 18.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />}
    {k === "shield" && <path d="M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6zM9 12l2 2 4-4" />}
    {k === "flask" && <path d="M9 3h6M10 3v6l-5 9a2 2 0 002 3h10a2 2 0 002-3l-5-9V3M7.5 15h9" />}
    {k === "loop" && <path d="M4 12a8 8 0 0114-5l2 2M20 12a8 8 0 01-14 5l-2-2M20 4v5h-5M4 20v-5h5" />}
  </svg>
)

/** Kedhareswer's three-ring mark: ring centres, ring radius and hole radius in a 100-unit box. */
const RINGS = MARK_RINGS.map(([a]) => [50 + Math.cos((a * Math.PI) / 180) * MARK_D, 50 + Math.sin((a * Math.PI) / 180) * MARK_D])
const MARK_SHAPE =
  "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><defs><mask id='m'><rect width='100' height='100' fill='black'/>" +
  RINGS.map(([x, y]) => "<circle cx='" + x.toFixed(2) + "' cy='" + y.toFixed(2) + "' r='" + MARK_R + "' fill='white'/>").join("") +
  RINGS.map(([x, y]) => "<circle cx='" + x.toFixed(2) + "' cy='" + y.toFixed(2) + "' r='" + MARK_HOLE + "' fill='black'/>").join("") +
  "</mask></defs><rect width='100' height='100' fill='black' mask='url(%23m)'/></svg>"
const MARK_MASK = "url(\"data:image/svg+xml;utf8," + MARK_SHAPE.replace(/</g, "%3C").replace(/>/g, "%3E") + "\")"

/** The mark as a flat fill (`fill`) or as an embossed glass rim (`glass`): a specular bevel lit from the top left. */
function Mark({ fill = "#fff", glass = false, size }: { fill?: string; glass?: boolean; size?: number }) {
  const id = "ds" + useId().replace(/[^a-zA-Z0-9]/g, "")
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true" style={{ overflow: "visible" }}>
      <defs>
        <mask id={id + "m"} maskUnits="userSpaceOnUse" x="-10" y="-10" width="120" height="120">
          <rect x="-10" y="-10" width="120" height="120" fill="#000" />
          {RINGS.map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={MARK_R} fill="#fff" />
          ))}
          {RINGS.map(([x, y], i) => (
            <circle key={"h" + i} cx={x} cy={y} r={MARK_HOLE} fill="#000" />
          ))}
        </mask>
        {glass && (
          <filter id={id + "f"} x="-15%" y="-15%" width="130%" height="130%" colorInterpolationFilters="sRGB">
            {/* rim: a band just inside the edge */}
            <feMorphology in="SourceAlpha" operator="erode" radius="2.1" result="in" />
            <feComposite in="SourceAlpha" in2="in" operator="out" result="band" />
            {/* bevel light over the band */}
            <feGaussianBlur in="SourceAlpha" stdDeviation="1.5" result="bump" />
            <feSpecularLighting in="bump" surfaceScale="5" specularConstant="1.1" specularExponent="22" lightingColor="#fff" result="spec">
              <feDistantLight azimuth="225" elevation="38" />
            </feSpecularLighting>
            <feComposite in="spec" in2="band" operator="in" result="specb" />
            {/* soft dark edge on the far side for depth */}
            <feOffset in="band" dx=".9" dy="1.1" result="off" />
            <feComposite in="off" in2="band" operator="out" result="lip" />
            <feFlood floodColor="#2a0207" floodOpacity=".45" />
            <feComposite in2="lip" operator="in" result="shadow" />
            {/* thin bright outline on both edges */}
            <feMorphology in="SourceAlpha" operator="dilate" radius=".35" result="d" />
            <feComposite in="d" in2="SourceAlpha" operator="out" result="outer" />
            <feMorphology in="in" operator="erode" radius=".35" result="in2" />
            <feComposite in="in" in2="in2" operator="out" result="inner" />
            <feMerge result="lines">
              <feMergeNode in="outer" />
              <feMergeNode in="inner" />
            </feMerge>
            <feFlood floodColor="#fff" floodOpacity=".75" />
            <feComposite in2="lines" operator="in" result="hi" />
            <feFlood floodColor="#fff" floodOpacity=".1" />
            <feComposite in2="band" operator="in" result="bandfill" />
            <feMerge>
              <feMergeNode in="bandfill" />
              <feMergeNode in="shadow" />
              <feMergeNode in="specb" />
              <feMergeNode in="hi" />
            </feMerge>
          </filter>
        )}
      </defs>
      {/* filter on the outer group so it sees the masked shape, not the whole square */}
      <g filter={glass ? "url(#" + id + "f)" : undefined}>
        <g mask={"url(#" + id + "m)"}>
          <rect x="-10" y="-10" width="120" height="120" fill={fill} />
        </g>
      </g>
    </svg>
  )
}

/** The glass mark: a lens that blurs and lifts whatever is behind it, clipped to the mark, under the bevel rim. */
function GlassMark() {
  return (
    <>
      <span className="ds-lens" style={{ WebkitMaskImage: MARK_MASK, maskImage: MARK_MASK }} />
      <Mark fill="#fff" glass />
    </>
  )
}

function Grid({ ticks = true }: { ticks?: boolean }) {
  return (
    <div className="ds-grid" aria-hidden="true">
      {[0, 1, 2, 3, 4].map((k) => (
        <i key={k} style={{ left: "calc(var(--g) + (100% - 2 * var(--g)) * " + k / 4 + ")" }} />
      ))}
      {ticks && (
        <>
          <div className="ds-ticks l">
            {["01", "02", "03", "04", "05"].map((t) => (
              <span key={t}>{t}</span>
            ))}
          </div>
          <div className="ds-ticks r">
            {["06", "07", "08", "09", "10"].map((t) => (
              <span key={t}>{t}</span>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

const Meta = ({ a, b, c, d }: { a: string; b: string; c: string; d: string }) => (
  <div className="ds-meta" aria-hidden="true">
    <span>{a}</span>
    <span>{b}</span>
    <span>
      {c} <b>✦</b>
    </span>
    <span>{d}</span>
  </div>
)

/** Words that ink in as the block crosses the viewport (`data-ink` = word count already lit). */
function Ink({ text }: { text: string }) {
  return (
    <>
      {text.split(" ").map((w, i, all) => (
        <span key={i}>
          <span className="ds-word ds-dim" data-w="">
            {w}
          </span>
          {i < all.length - 1 ? " " : ""}
        </span>
      ))}
    </>
  )
}

// ---- component -----------------------------------------------------------------

export interface DrapeStudioTemplateProps {
  /** Height of one screen of the page (hero, pinned scenes). Defaults to the small viewport height. */
  height?: string
  /** Contact address for "Contact Us". */
  email?: string
  /** Where the pictures live; defaults to the component site. */
  assetBase?: string
  /** Skip the loading screen. */
  skipIntro?: boolean
  /** Ease mouse-wheel scrolling (off for touch, keyboard and reduced motion). */
  smoothScroll?: boolean
  className?: string
  style?: CSSProperties
}

export default function DrapeStudioTemplate({
  height = "100svh",
  email = "kedhareswer.12110626@gmail.com",
  assetBase,
  skipIntro = false,
  smoothScroll = true,
  className,
  style,
}: DrapeStudioTemplateProps) {
  const pic = (k: string) => (assetBase ? assetBase.replace(/\/?$/, "/") + k + ".webp" : img(k))
  const rootRef = useRef(null as HTMLDivElement | null)
  const navRef = useRef(null as HTMLElement | null)
  const heroRef = useRef(null as HTMLElement | null)
  const preRef = useRef(null as HTMLDivElement | null)
  const [phase, setPhase] = useState(skipIntro ? 2 : 0) // 0 loading, 1 opening, 2 done
  const [tab, setTab] = useState(0)
  const [lang, setLang] = useState(0)
  const [menu, setMenu] = useState(false)
  const [sw, setSw] = useState(0)
  const [prod, setProd] = useState(0)
  const [mail, setMail] = useState("")
  const [agree, setAgree] = useState(false)
  const [sent, setSent] = useState(false)
  const [globeIn, setGlobeIn] = useState(false)
  const st = useRef({ reduced: false })
  const scrollTo = useRef(null as ((y: number) => void) | null)
  const [clock, setClock] = useState("")

  // ---- loading screen: count, spin, colour, then the petals open into the hero
  useEffect(() => {
    if (phase === 2) return
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (reduced) {
      setPhase(2)
      return
    }
    const pre = preRef.current
    if (!pre) return
    const pct = pre.querySelector("[data-pct]") as HTMLElement | null
    const arc = pre.querySelector("[data-arc]") as SVGCircleElement | null
    const spin = pre.querySelector("[data-spin]") as HTMLElement | null
    const layers = Array.from(pre.querySelectorAll("[data-layer]")) as HTMLElement[]
    const ui = pre.querySelector("[data-ui]") as HTMLElement | null
    const petals = Array.from(pre.querySelectorAll("[data-petal]")) as SVGCircleElement[]
    const svg = pre.querySelector("[data-petals]") as SVGSVGElement | null
    const top = pre.querySelector("[data-glasstop]") as HTMLElement | null
    const mid = pre.querySelector(".ds-pre-mid") as HTMLElement | null
    const t0 = performance.now()
    let raf = 0
    let opened = false
    const frame = (now: number) => {
      const t = now - t0
      const load = clamp01(t / LOAD_MS)
      const k = easeInOut(load)
      if (pct) pct.textContent = Math.max(3, Math.round(k * 100)) + "%"
      if (arc) arc.style.strokeDashoffset = String(1 - k)
      if (spin) spin.style.transform = "rotate(" + (-150 * k).toFixed(2) + "deg)"
      const mix = markMix(load)
      if (layers[0]) layers[0].style.opacity = String(mix.red)
      if (layers[1]) layers[1].style.opacity = String(mix.black)
      if (layers[2]) layers[2].style.opacity = String(mix.glass)
      const o = clamp01((t - LOAD_MS - HOLD_MS) / OPEN_MS)
      if (o > 0) {
        if (!opened) {
          opened = true
          setPhase(1)
        }
        const e = bloomEase(o)
        if (mid) mid.style.opacity = String(1 - clamp01(o / 0.2))
        const w = window.innerWidth
        const h = window.innerHeight
        if (svg) svg.setAttribute("viewBox", "0 0 " + w + " " + h)
        const unit = Math.min(296, Math.max(200, w * 0.206)) * 0.66 // mark box inside the ring
        const s = 1 + e * (Math.hypot(w, h) / unit) * 1.15
        petals.forEach((c, i) => {
          const a = (MARK_RINGS[i][0] * Math.PI) / 180
          const d = unit * (MARK_D / 100) * s
          c.setAttribute("cx", (w / 2 + Math.cos(a) * d).toFixed(1))
          c.setAttribute("cy", (h * 0.485 + Math.sin(a) * d).toFixed(1))
          c.setAttribute("r", (unit * (MARK_R / 100) * s).toFixed(1))
        })
        if (ui) ui.style.opacity = String(1 - clamp01((o - 0.55) / 0.35))
        if (top) {
          // the glass mark rides above the petals and grows into the hero's mark
          const hero = Math.min(322, Math.max(190, w * 0.224))
          const k = 1 + (hero / unit - 1) * e
          top.style.opacity = "1"
          top.style.transform = "translate(-50%,-50%) translateY(" + (-0.02 * h * e).toFixed(1) + "px) scale(" + k.toFixed(3) + ")"
          top.style.width = unit + "px"
        }
      }
      if (o >= 1) {
        setPhase(2)
        return
      }
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ---- scroll scenes
  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    st.current.reduced = mq.matches

    const io = new IntersectionObserver(
      (list) => {
        for (const e of list) {
          if (!e.isIntersecting) continue
          const el = e.target as HTMLElement
          el.classList.add("ds-in")
          if (el.hasAttribute("data-globe")) setGlobeIn(true)
          io.unobserve(el)
        }
      },
      { rootMargin: "0px 0px -18% 0px" },
    )
    root.querySelectorAll(".ds-rv,[data-name],[data-globe]").forEach((el) => io.observe(el))

    const q = (s: string) => root.querySelector(s) as HTMLElement | null
    const pillars = q("[data-pillars]")
    const track = q("[data-track]")
    const pinBg = q("[data-pinbg]")
    const cols = Array.from(root.querySelectorAll("[data-col]")) as HTMLElement[]
    const letters = q("[data-letters]")
    const nameSec = q("[data-namesec]")
    const nameWord = q("[data-name]")
    const scatter = q("[data-scatter]")
    const chA = Array.from(root.querySelectorAll("[data-a]")) as HTMLElement[]
    const chB = Array.from(root.querySelectorAll("[data-b]")) as HTMLElement[]
    const tex = q("[data-tex]")
    const wheels = Array.from(root.querySelectorAll("[data-wheel]")) as HTMLElement[]
    const ind = q("[data-ind]")
    const ruler = q("[data-ruler]")
    const cta = q("[data-cta]")
    const orbs = q("[data-orbs]")
    const inkBlocks = (Array.from(root.querySelectorAll("[data-ink]")) as HTMLElement[]).map((el) => ({
      el,
      words: Array.from(el.querySelectorAll("[data-w]")) as HTMLElement[],
      lit: -1,
    }))
    const tones = Array.from(root.querySelectorAll("[data-tone]")) as HTMLElement[]
    let lastSw = -1
    let lastProd = -1
    let tone = ""
    let off = false

    // tiles live on two wheels whose centres sit off-screen; each arc bulges toward the middle
    // (measured: front tiles at 24.3% and 72.4% of the width, radius 787, a tile every 10°)
    const placeTiles = () => {
      const w = root.clientWidth
      const k = Math.max(0.42, Math.min(1.15, w / 1440))
      wheels.forEach((wh, side) => {
        const R = WHEEL_R * k
        const ts = Math.round(121 * k)
        wh.style.setProperty("--ts", ts + "px")
        const front = side === 0 ? 0.243 * w : 0.724 * w
        wh.style.left = (side === 0 ? front - R : front + R).toFixed(1) + "px"
        const base = side === 0 ? 0 : 180
        const kids = Array.from(wh.children) as HTMLElement[]
        kids.forEach((el, c) => {
          const j = c >> 1 // children alternate tile, label
          const deg = base + j * WHEEL_STEP
          const a = (deg * Math.PI) / 180
          if (c % 2 === 0) {
            el.style.transform = "translate(" + (Math.cos(a) * R).toFixed(1) + "px," + (Math.sin(a) * R).toFixed(1) + "px) rotate(" + (deg - base) + "deg)"
          } else {
            const lr = R - ts / 2 - 12
            el.style.transform =
              "translate(" + (Math.cos(a) * lr).toFixed(1) + "px," + (Math.sin(a) * lr).toFixed(1) + "px) rotate(" + (deg - base + (side === 0 ? -90 : 90)) + "deg) translate(-50%,-50%)"
          }
        })
      })
    }
    placeTiles()

    let raf = 0
    const frame = () => {
      raf = 0
      const reduced = st.current.reduced
      const vh = window.innerHeight
      const vw = root.clientWidth

      // nav: links leave after the hero; chips follow the tone of the section under them
      const hero = heroRef.current
      if (hero) {
        const past = hero.getBoundingClientRect().bottom < 90
        if (past !== off) {
          off = past
          navRef.current?.classList.toggle("ds-off", past)
        }
      }
      let t = "dark"
      for (const s of tones) {
        const r = s.getBoundingClientRect()
        if (r.top <= 36 && r.bottom > 36) {
          t = s.getAttribute("data-tone") || "dark"
          break
        }
      }
      if (t !== tone) {
        tone = t
        navRef.current?.classList.toggle("ds-tl", t === "light")
      }

      // pillars: pinned horizontal track
      if (pillars && track) {
        const r = pillars.getBoundingClientRect()
        const p = pinProgress(r.top, r.height, vh)
        const g = Math.min(56, Math.max(18, vw * 0.039))
        track.style.transform = "translate3d(" + trackX(p, track.scrollWidth, vw, g, g).toFixed(1) + "px,0,0)"
        if (pinBg) pinBg.style.transform = reduced ? "" : "scale(" + (1.04 + p * 0.08).toFixed(3) + ") translateX(" + (-p * 2).toFixed(2) + "%)"
      }

      // CTA: orbs turn and grow as the block rises
      if (cta && orbs) {
        const r = cta.getBoundingClientRect()
        const p = clamp01((vh - r.top) / (vh + r.height * 0.6))
        orbs.style.transform = reduced ? "" : "rotate(" + (-10 + p * 20).toFixed(2) + "deg) scale(" + (0.94 + p * 0.12).toFixed(3) + ")"
        const label = orbs.querySelector("a span") as HTMLElement | null
        if (label && !reduced) label.style.rotate = (10 - p * 20).toFixed(2) + "deg"
      }

      // letter columns slide against each other
      if (letters) {
        const r = letters.getBoundingClientRect()
        const p = clamp01((vh - r.top) / (vh + r.height)) - 0.5
        cols.forEach((c, i) => {
          c.style.transform = reduced ? "" : "translate3d(0," + ((i % 2 ? -1 : 1) * p * COLUMN_DRIFT * vh * 2).toFixed(1) + "px,0)"
        })
      }

      // name: settles from 1.12 to 1 as the section arrives
      if (nameSec && nameWord) {
        const r = nameSec.getBoundingClientRect()
        const p = clamp01((vh - r.top) / vh)
        nameWord.style.transform = reduced ? "" : "scale(" + (1.14 - 0.14 * easeInOut(p)).toFixed(3) + ")"
      }

      // scatter: YOU DESIGN leaves, I DELIVER arrives
      if (scatter) {
        const r = scatter.getBoundingClientRect()
        const p = pinProgress(r.top, r.height, vh)
        const drift = reduced ? 0 : -18 * p
        chA.forEach((el, i) => {
          const o = reduced ? (p < 0.45 ? 0 : 1) : leaveAt(p, i)
          el.style.opacity = String(1 - o)
          el.style.color = o > 0 ? "rgb(" + Math.round(255 - 120 * o) + "," + Math.round(255 - 120 * o) + "," + Math.round(255 - 120 * o) + ")" : "#fff"
          el.style.filter = o > 0 && !reduced ? "blur(" + (o * 8).toFixed(1) + "px)" : ""
          el.style.translate = "0 " + (drift - o * 24).toFixed(1) + "px"
        })
        chB.forEach((el, i) => {
          const a = reduced ? (p < 0.45 ? 0 : 1) : arriveAt(p, i)
          el.style.opacity = String(a)
          const c = Math.round(135 + 120 * a)
          el.style.color = "rgb(" + c + "," + c + "," + c + ")"
          el.style.filter = a < 1 && !reduced ? "blur(" + ((1 - a) * 8).toFixed(1) + "px)" : ""
          el.style.translate = "0 " + (drift + (1 - a) * 24).toFixed(1) + "px"
        })
      }

      // textures: two wheels turn, the front tile feeds the centre card
      if (tex) {
        const r = tex.getBoundingClientRect()
        const p = pinProgress(r.top, r.height, vh)
        const turn = wheelTurn(p)
        wheels.forEach((wh, side) => {
          wh.style.transform = "rotate(" + (side === 0 ? turn : -turn).toFixed(2) + "deg)"
        })
        const f = frontTile(turn, COLOR_SW.length)
        if (f !== lastSw) {
          lastSw = f
          setSw(f)
        }
      }

      // industries: pick the product for this stretch of scroll
      if (ind) {
        const r = ind.getBoundingClientRect()
        const p = pinProgress(r.top, r.height, vh)
        const n = pickIndex(p, INDUSTRIES.length)
        if (n !== lastProd) {
          lastProd = n
          setProd(n)
        }
        if (ruler) ruler.style.left = (p * 100).toFixed(2) + "%"
      }

      // ink words: light up across the middle of the viewport
      for (const b of inkBlocks) {
        const r = b.el.getBoundingClientRect()
        const n = b.words.length
        const want = reduced ? n : Math.round(clamp01((vh * 0.92 - r.top) / (vh * 0.42)) * n)
        if (want === b.lit) continue
        b.words.forEach((w, i) => w.classList.toggle("ds-dim", i >= want))
        b.lit = want
      }
    }
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(frame)
    }
    const onResize = () => {
      placeTiles()
      schedule()
    }
    const onMq = () => {
      st.current.reduced = mq.matches
      schedule()
    }
    schedule()
    window.addEventListener("scroll", schedule, { passive: true })
    window.addEventListener("resize", onResize)
    mq.addEventListener("change", onMq)
    return () => {
      io.disconnect()
      window.removeEventListener("scroll", schedule)
      window.removeEventListener("resize", onResize)
      mq.removeEventListener("change", onMq)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  // globe tabs advance on their own (paused under reduced motion)
  useEffect(() => {
    if (!globeIn) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const id = window.setTimeout(() => setTab((t) => (t + 1) % PLACES.length), 5000)
    return () => window.clearTimeout(id)
  }, [tab, globeIn])

  // eased wheel scrolling: the page glides to where the wheel says (keyboard, scrollbar and touch stay native)
  useEffect(() => {
    if (!smoothScroll) return
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    const fine = window.matchMedia("(pointer: fine)")
    if (mq.matches || !fine.matches) return
    let target = window.scrollY
    let current = window.scrollY
    let raf = 0
    let ours = false
    const max = () => document.documentElement.scrollHeight - window.innerHeight
    const tick = () => {
      current += (target - current) * WHEEL_EASE
      if (Math.abs(target - current) < 0.4) current = target
      ours = true
      window.scrollTo(0, current)
      raf = current === target ? 0 : requestAnimationFrame(tick)
    }
    const glide = (y: number) => {
      target = Math.max(0, Math.min(max(), y))
      if (!raf) {
        current = window.scrollY
        raf = requestAnimationFrame(tick)
      }
    }
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.defaultPrevented) return
      const t = e.target as HTMLElement | null
      if (t && t.closest && t.closest("input,textarea,select,.ds-sheet")) return
      e.preventDefault()
      const unit = e.deltaMode === 1 ? 32 : e.deltaMode === 2 ? window.innerHeight : 1
      glide((raf ? target : window.scrollY) + e.deltaY * unit)
    }
    const onScroll = () => {
      if (ours) {
        ours = false
        return
      }
      if (!raf) target = current = window.scrollY
    }
    scrollTo.current = glide
    window.addEventListener("wheel", onWheel, { passive: false })
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => {
      scrollTo.current = null
      window.removeEventListener("wheel", onWheel)
      window.removeEventListener("scroll", onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [smoothScroll])

  // pointer finesse: the glass mark tilts toward the cursor; pill buttons lean toward it
  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return
    const hero = heroRef.current
    const mark = root.querySelector("[data-tilt]") as HTMLElement | null
    const onHero = (e: PointerEvent) => {
      if (!hero || !mark) return
      const r = hero.getBoundingClientRect()
      const x = (e.clientX - r.left) / r.width - 0.5
      const y = (e.clientY - r.top) / r.height - 0.5
      mark.style.transform = "translate(-50%,-50%) perspective(900px) rotateY(" + (x * 14).toFixed(2) + "deg) rotateX(" + (-y * 14).toFixed(2) + "deg)"
    }
    const offHero = () => {
      if (mark) mark.style.transform = "translate(-50%,-50%)"
    }
    let last = null as HTMLElement | null
    const onMove = (e: PointerEvent) => {
      const t = e.target as HTMLElement | null
      const el = t && t.closest ? (t.closest(".ds-pill") as HTMLElement | null) : null
      if (last && last !== el) {
        last.style.translate = ""
        last = null
      }
      if (!el) return
      const r = el.getBoundingClientRect()
      const dx = (e.clientX - (r.left + r.width / 2)) / r.width
      const dy = (e.clientY - (r.top + r.height / 2)) / r.height
      el.classList.add("ds-mag")
      el.style.translate = (dx * 10).toFixed(1) + "px " + (dy * 8).toFixed(1) + "px"
      last = el
    }
    hero?.addEventListener("pointermove", onHero)
    hero?.addEventListener("pointerleave", offHero)
    root.addEventListener("pointermove", onMove)
    return () => {
      hero?.removeEventListener("pointermove", onHero)
      hero?.removeEventListener("pointerleave", offHero)
      root.removeEventListener("pointermove", onMove)
    }
  }, [])

  // footer clock: the studio's local time
  useEffect(() => {
    const fmt = () => {
      try {
        setClock(new Date().toLocaleTimeString("en-GB", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit" }) + " IST")
      } catch {
        setClock("")
      }
    }
    fmt()
    const id = window.setInterval(fmt, 30000)
    return () => window.clearInterval(id)
  }, [])

  const go = (sel: string) => {
    setMenu(false)
    const el = rootRef.current?.querySelector(sel)
    if (!el) return
    const y = (el as HTMLElement).getBoundingClientRect().top + window.scrollY
    if (scrollTo.current) scrollTo.current(y)
    else window.scrollTo({ top: y, behavior: st.current.reduced ? "auto" : "smooth" })
  }
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail) && agree
  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (valid) setSent(true)
  }
  const links = [
    ["Home", "[data-hero]"],
    ["Work", "[data-ind]"],
    ["Process", "[data-pillars]"],
    ["Reach", "[data-globe-sec]"],
    ["About", "[data-letters]"],
  ]
  const sheetLinks = [...links, ["Contact", "[data-news]"]]

  return (
    <div
      ref={rootRef}
      className={"ds-root" + (className ? " " + className : "")}
      style={{ ...style, ["--dh" as string]: height } as CSSProperties}
    >
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {phase !== 2 && (
        <div ref={preRef} className="ds-pre" aria-hidden="true">
          <div className="ds-pre-ui" data-ui="" style={{ opacity: 1 }}>
            <div className="ds-blinds" style={{ backgroundImage: "url(" + pic("blinds") + ")" }} />
            <Grid />
            <div className="ds-pre-name">{NAME}</div>
            <div className="ds-pre-mid">
              <svg className="ds-pre-ring" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="49" fill="none" stroke="rgba(0,0,0,.08)" strokeWidth=".35" />
                <circle data-arc="" cx="50" cy="50" r="49" fill="none" stroke="#e8463c" strokeWidth=".55" pathLength={1} strokeDasharray="1" strokeDashoffset="1" transform="rotate(-90 50 50)" />
                {[0, 90, 180, 270].map((a) => (
                  <line key={a} x1="50" y1="-1.5" x2="50" y2="2.5" stroke="#999" strokeWidth=".35" transform={"rotate(" + a + " 50 50)"} />
                ))}
              </svg>
              <div className="ds-pre-pct">
                <b data-pct="">3%</b> / 100%
              </div>
              <div className="ds-pre-mark" data-spin="">
                <div data-layer="" style={{ position: "absolute", inset: 0 }}>
                  <Mark fill="#d8342c" />
                </div>
                <div data-layer="" style={{ position: "absolute", inset: 0, opacity: 0 }}>
                  <Mark fill="#1b1414" />
                </div>
                <div data-layer="" style={{ position: "absolute", inset: 0, opacity: 0 }}>
                  <span className="ds-lens ds-lens-paper" style={{ WebkitMaskImage: MARK_MASK, maskImage: MARK_MASK }} />
                  <Mark fill="#fff" glass />
                </div>
              </div>
              <div className="ds-pre-load">Loading</div>
            </div>
            <p className="ds-pre-cap">
              Kedhareswer designs and builds websites
              <br />
              for brands around the world.
            </p>
          </div>
          <svg className="ds-petals" data-petals="" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <clipPath id="ds-petal-clip">
                {MARK_RINGS.map((_, i) => (
                  <circle key={i} data-petal="" cx="-999" cy="-999" r="0" />
                ))}
              </clipPath>
            </defs>
            <image href={pic("hero")} x="0" y="0" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" clipPath="url(#ds-petal-clip)" />
          </svg>
          <div className="ds-pre-top" data-glasstop="">
            <GlassMark />
          </div>
        </div>
      )}

      {/* nav */}
      <header ref={navRef} className="ds-nav">
        <div className="ds-navin" style={{ opacity: phase === 0 ? 0 : 1, transition: "opacity .8s ease .3s" }}>
          <button className="ds-chip ds-brand" onClick={() => go("[data-hero]")} aria-label="Kedhareswer, back to top">
            <Mark />
            {NAME}
          </button>
          <div className="ds-links ds-lang">
            {["Eng", "हिन्दी"].map((l, i) => (
              <button key={l} className={lang === i ? "ds-on" : ""} onClick={() => setLang(i)}>
                {l}
              </button>
            ))}
          </div>
          <nav className="ds-links ds-menu" aria-label="Sections">
            {links.map(([l, s], i) => (
              <button key={l} className={i === 0 ? "ds-on" : ""} onClick={() => go(s)}>
                {l}
                {l === "Work" && (
                  <svg viewBox="0 0 8 8" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true">
                    <path d="M1.5 3l2.5 2.5L6.5 3" />
                  </svg>
                )}
              </button>
            ))}
          </nav>
          <button className="ds-chip ds-burger" aria-label="Menu" aria-expanded={menu} onClick={() => setMenu((m) => !m)}>
            <span />
          </button>
          <div className={"ds-sheet" + (menu ? " ds-open" : "")}>
            {sheetLinks.map(([l, s]) => (
              <button key={l} onClick={() => go(s)} tabIndex={menu ? 0 : -1}>
                {l}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* hero */}
      <section ref={heroRef} data-hero="" data-tone="dark" className={"ds-hero" + (phase >= 1 ? " ds-go" : "")} style={{ height: "var(--dh)" }} aria-label="Introduction">
        <div className="ds-hero-bg">
          <img src={pic("hero")} alt="Deep red leather draped in soft waves" />
        </div>
        <div className="ds-hero-shade" />
        <div className="ds-hero-mark" data-tilt="">
          <GlassMark />
        </div>
        <div className="ds-hero-foot">
          <h1 className="ds-h1">
            <span>
              <b>You Design.</b>
            </span>
            <span>
              <b>I Deliver.</b>
            </span>
          </h1>
          <div className="ds-info">
            <div className="ds-fade">
              <h4>Design and front-end, end to end</h4>
              <p>Kedhareswer shapes brand sites and product interfaces, then builds them to ship.</p>
            </div>
            <button className="ds-pill ds-unroll" onClick={() => go("[data-ind]")}>
              Browse Selected Work
              <i>
                <Arrow />
              </i>
            </button>
          </div>
        </div>
      </section>

      {/* pillars */}
      <section data-pillars="" data-tone="dark" className="ds-pillars ds-onimg" style={{ height: "calc(var(--dh) * 2.6)" }} aria-label="How Kedhareswer works">
        <div className="ds-pin">
          <div className="ds-pin-bg" data-pinbg="">
            <img src={pic("perf")} alt="" loading="lazy" />
          </div>
          <h2 className="ds-h2 ds-sec-head">
            Core brand
            <br />
            <em>pillars.</em>
          </h2>
          <div className="ds-track" data-track="">
            {PILLARS.map((c, i) => (
              <article key={c.t} className="ds-card">
                <div className="ds-card-l">
                  <h5>{c.t}</h5>
                  <i className="ds-sq" />
                  <span className="ds-ico">
                    <Icon k={c.ico} />
                  </span>
                  <p>{c.d}</p>
                </div>
                <div className="ds-card-r">
                  <img src={pic(c.m)} alt="" loading="lazy" />
                  <b>{String(i + 1).padStart(2, "0")}</b>
                </div>
              </article>
            ))}
          </div>
          <Meta a="(2026)" b="(pillars.05)" c="(kedhareswer)" d="(sc.02)" />
        </div>
      </section>

      {/* globe */}
      <section data-globe-sec="" data-tone="light" className="ds-light ds-globe" aria-label="Where Kedhareswer works">
        <div className="ds-blinds" style={{ backgroundImage: "url(" + pic("blinds") + ")" }} />
        <Grid />
        <div className="ds-globe-head ds-rv">
          <h2 className="ds-h3" data-ink="">
            <Ink text="A global network" />
            <br />
            <Ink text="built around you." />
          </h2>
          <p>Kedhareswer works with teams in every time zone, from first call to launch day.</p>
          <button className="ds-pill ds-sm ds-blk ds-bord" onClick={() => go("[data-letters]")}>
            About
            <i>
              <Arrow />
            </i>
          </button>
        </div>
        <div className="ds-earth" data-globe="">
          <img src={pic("globe")} alt="Earth seen from space over Asia" loading="lazy" />
          {PLACES[tab].items.map((p, i) => (
            <div key={PLACES[tab].tab + p.n}>
              <span className={"ds-pinpt" + (globeIn ? " ds-shown" : "")} style={{ left: p.x + "%", top: p.y + "%", animationDelay: 0.1 + i * 0.12 + "s" }} />
              <div
                className={"ds-place" + (globeIn ? " ds-shown" : "")}
                style={{ left: "calc(" + p.x + "% + " + p.cx + "px)", top: "calc(" + p.y + "% + " + p.cy + "px)", animationDelay: 0.2 + i * 0.12 + "s" }}
              >
                <h6>{p.n}</h6>
                <p>{p.d}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="ds-tabs" role="tablist" aria-label="Places">
          {PLACES.map((g, i) => (
            <button key={g.tab} role="tab" aria-selected={tab === i} className={tab === i ? "ds-on" : ""} onClick={() => setTab(i)}>
              <i key={tab === i ? "on" + tab : "off"} />
              {g.tab}
              <small>{g.sub}</small>
            </button>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section data-cta="" data-tone="light" className="ds-light ds-cta" aria-label="Contact">
        <div className="ds-blinds" style={{ backgroundImage: "url(" + pic("blinds") + ")" }} />
        <Grid />
        <h2 className="ds-h3 ds-cta-head" data-ink="">
          <Ink text="Ready to take the" />
          <br />
          <span className="ds-word ds-redw">next</span> <Ink text="step?" />
        </h2>
        <div className="ds-orbs" data-orbs="">
          {[
            [25, 1, "20% 10%"],
            [46, 37, "90% 40%"],
            [4, 37, "30% 95%"],
          ].map(([l, t, pos], i) => (
            <div key={i} className="ds-orb" style={{ left: l + "%", top: t + "%" }}>
              <img src={pic("hero")} alt="" loading="lazy" style={{ objectPosition: pos as string, left: -i * 40 + "%", top: -(i % 2) * 60 + "%" }} />
            </div>
          ))}
          <a href={"mailto:" + email}>
            <span>Contact Us</span>
          </a>
        </div>
        <Meta a="(2026)" b="(contact.01)" c="(kedhareswer)" d="(sc.04)" />
      </section>

      {/* big letters */}
      <section data-letters="" data-tone="light" className="ds-light ds-letters" aria-label="About Kedhareswer">
        <Grid />
        <div className="ds-cols">
          <div className="ds-col" data-col="">
            <span className="ds-big" aria-hidden="true">K</span>
            <div className="ds-note">
              (2026)
              <small>Every page here is designed and built by Kedhareswer, end to end.</small>
            </div>
            <span className="ds-big" aria-hidden="true">K</span>
          </div>
          <div className="ds-col" data-col="" style={{ paddingTop: "18vh" }}>
            <div className="ds-note">
              <ol>
                <li><span>[01]</span>Brand sites</li>
                <li><span>[02]</span>Product UI</li>
                <li><span>[03]</span>Motion</li>
                <li><span>[04]</span>Front-end</li>
              </ol>
            </div>
            <span className="ds-big" aria-hidden="true" style={{ textAlign: "right" }}>E</span>
            <span className="ds-big" aria-hidden="true" style={{ textAlign: "right" }}>E</span>
          </div>
          <div className="ds-col" data-col="">
            <span className="ds-big" aria-hidden="true">/</span>
            <div className="ds-note">
              (kedhareswer)<b style={{ color: "var(--red)", fontWeight: 400 }}>✦</b>
              <small>(sc.05)</small>
            </div>
            <span className="ds-big" aria-hidden="true">/</span>
          </div>
          <div className="ds-col" data-col="" style={{ paddingTop: "8vh" }}>
            <div className="ds-note">
              (Perfect base)
              <small>
                For your product.
                <br />
                For you.
              </small>
            </div>
            <span className="ds-big" aria-hidden="true">D</span>
            <span className="ds-big" aria-hidden="true">D</span>
          </div>
        </div>
      </section>

      {/* name */}
      <section data-namesec="" data-tone="light" className="ds-name" aria-label={NAME}>
        <div className="ds-blinds" style={{ backgroundImage: "url(" + pic("blinds") + ")" }} />
        <div className="ds-word-big" data-name="" role="img" aria-label={NAME}>
          {NAME.split("").map((ch, i) => (
            <span key={i} style={{ backgroundImage: "url(" + pic("perf") + ")", transitionDelay: ((i * 7) % 11) * 0.07 + "s" }}>
              {ch}
            </span>
          ))}
        </div>
      </section>

      {/* scatter */}
      <section data-scatter="" data-tone="dark" className="ds-dark ds-scatter" aria-label="You design, I deliver">
        <div className="ds-pin">
          <Grid />
          <div className="ds-stage" aria-hidden="true">
            {WORD_A.map(([c, x, y], i) => (
              <span key={"a" + i} className="ds-ch" data-a="" style={{ left: x + "%", top: y + "%" }}>
                {c}
              </span>
            ))}
            {WORD_B.map(([c, x, y], i) => (
              <span key={"b" + i} className="ds-ch" data-b="" style={{ left: x + "%", top: y + "%", opacity: 0 }}>
                {c}
              </span>
            ))}
          </div>
          <div className="ds-mid">{NAME}</div>
          <p style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>You design. I deliver.</p>
        </div>
      </section>

      {/* textures */}
      <section data-tex="" data-tone="dark" className="ds-dark ds-tex" aria-label="Design without limitations">
        <div className="ds-pin">
          <div className="ds-grain" />
          <Grid ticks={false} />
          {[COLOR_SW, FINISH_SW].map((set, side) => (
            <div key={side} className="ds-wheel" data-wheel="" aria-hidden="true">
              {Array.from({ length: 36 }).map((_, i) => {
                const k = i % set.length
                return [
                  <div key={"t" + i} className="ds-tile">
                    <img src={pic((side === 0 ? "sc" : "sf") + (k + 1))} alt="" loading="lazy" />
                  </div>,
                  <span key={"l" + i} className="ds-tile-lab">
                    {set[k]}
                  </span>,
                ]
              })}
            </div>
          ))}
          <div className="ds-tex-head">
            <h2 className="ds-h2" data-ink="">
              <Ink text="Design without" />
              <br />
              <Ink text="limitations." />
            </h2>
          </div>
          <span className="ds-side" style={{ left: "var(--g)" }}>
            Textures<sup>°</sup>
          </span>
          <span className="ds-side" style={{ right: "var(--g)" }}>
            <sup>°</sup>Finishes
          </span>
          <div className="ds-frame">
            <div className="ds-frame-in">
              {COLOR_SW.map((n, i) => (
                <img key={n} src={pic("sc" + (i + 1))} alt={i === sw ? n + " swatch" : ""} loading="lazy" style={{ opacity: i === sw ? 1 : 0 }} />
              ))}
            </div>
          </div>
          <div className="ds-tex-foot">
            <p>Bring your ideas to life with endless palettes, textures and motion combinations.</p>
            <button className="ds-pill" onClick={() => go("[data-ind]")}>
              Browse Selected Work
              <i>
                <Arrow />
              </i>
            </button>
          </div>
        </div>
      </section>

      {/* industries */}
      <section data-ind="" data-tone="dark" className="ds-dark ds-ind" aria-label="Industries Kedhareswer serves">
        <div className="ds-pin">
          <div className="ds-grain" />
          <div className="ds-grid" aria-hidden="true">
            {["var(--g)", "calc(var(--g) + 12%)", "50%", "calc(100% - var(--g) - 12%)", "calc(100% - var(--g))"].map((l) => (
              <i key={l} style={{ left: l, background: "rgba(255,255,255,.06)" }} />
            ))}
          </div>
          <h2 className="ds-h2 ds-sec-head">
            Industries
            <br />
            <em>I serve.</em>
          </h2>
          <span className="ds-dot" />
          <div className="ds-ring">
            <div className="ds-disc" />
            {INDUSTRIES.map((it, i) => (
              <div
                key={it.n}
                className="ds-prod"
                style={{
                  opacity: i === prod ? 1 : 0,
                  transform: i === prod ? "none" : "rotate(" + (i < prod ? -24 : 24) + "deg) scale(.72)",
                }}
              >
                <img src={pic("p" + (i + 1))} alt={i === prod ? it.n : ""} loading="lazy" />
              </div>
            ))}
          </div>
          <div className="ds-count" aria-live="polite">
            {String(prod + 1).padStart(2, "0")}
            <small>/{String(INDUSTRIES.length).padStart(2, "0")}</small>
          </div>
          <div className="ds-ilab">
            {INDUSTRIES[prod].n}
            <p>{INDUSTRIES[prod].d}</p>
          </div>
          <Meta a="▲(sc.14)" b="▲(industries)" c="(kedhareswer)" d="(2026)▲" />
          <div className="ds-ruler" aria-hidden="true">
            <i data-ruler="" />
          </div>
        </div>
      </section>

      {/* newsletter */}
      <section data-news="" data-tone="light" className="ds-light ds-news" aria-label="Newsletter">
        <div className="ds-blinds" style={{ backgroundImage: "url(" + pic("blinds") + ")" }} />
        <Grid />
        <div className="ds-rv ds-fill">
        <form className={"ds-env" + (sent ? " ds-sent" : "")} onSubmit={submit}>
          <div className="ds-env-back" />
          <div className="ds-thanks" aria-live="polite">
            <div className="ds-tcard r">
              <img src={pic("hero")} alt="" loading="lazy" />
            </div>
            <div className="ds-tcard g">
              {sent && (
                <>
                  <h6>Thank You!</h6>
                  <p>You are on the list. Notes from Kedhareswer land in your inbox soon.</p>
                </>
              )}
              <span className="ds-sign" aria-hidden="true">
                Kedhareswer
              </span>
            </div>
          </div>
          <div className="ds-letter" aria-hidden={sent}>
            <h6>
              Sign up for Kedhareswer&apos;s letter today and receive
              <span>new work and notes straight to your inbox.</span>
            </h6>
            <input type="email" placeholder="Email" aria-label="Email" value={mail} onChange={(e) => setMail(e.target.value)} disabled={sent} required />
            <label>
              <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} disabled={sent} />
              <span>
                I agree to receive occasional updates from Kedhareswer and can unsubscribe at any time. See the <b>Privacy Policy</b>.
              </span>
            </label>
          </div>
          <div className="ds-env-front">
            <div className="ds-env-tex" style={{ backgroundImage: "url(" + pic("perf") + ")" }} />
            <div className="ds-env-deboss">
              <Mark fill="rgba(0,0,0,.35)" />
            </div>
          </div>
          <button type="submit" className={"ds-pill ds-sm ds-submit" + (valid ? " ds-ready" : "")} aria-disabled={!valid}>
            Submit
            <i>
              <Arrow />
            </i>
          </button>
        </form>
        </div>
        <div className="ds-meta" style={{ pointerEvents: "auto" }}>
          <span>(2026)</span>
          <span>(letter.01)</span>
          <span>
            <a className="ds-mailto" href={"mailto:" + email}>
              ({email})
            </a>
          </span>
          <span>(sc.08)</span>
        </div>
      </section>

      {/* footer */}
      <footer className="ds-foot" data-tone="dark" aria-label="Footer">
        <div className="ds-foot-top">
          <div>
            <h2>
              Let&apos;s make
              <br />
              <em>something that lasts.</em>
            </h2>
            <a className="ds-foot-mail" href={"mailto:" + email}>
              {email}
            </a>
          </div>
          <div className="ds-foot-cols">
            <div>
              <h6>Sections</h6>
              {links.map(([l, s2]) => (
                <button key={l} onClick={() => go(s2)}>
                  {l}
                </button>
              ))}
            </div>
            <div>
              <h6>Studio</h6>
              <p>Kedhareswer</p>
              <p>Design + front-end</p>
              <p>India, working worldwide</p>
            </div>
            <div>
              <h6>Now</h6>
              <p>{clock || "IST"}</p>
              <p>Booking projects for 2026</p>
              <p>Replies within a day</p>
            </div>
          </div>
        </div>
        <div className="ds-foot-word" aria-hidden="true">
          {NAME}
        </div>
        <div className="ds-foot-base">
          <span>© 2026 Kedhareswer. Designed and built by hand.</span>
          <button onClick={() => go("[data-hero]")}>Back to top ↑</button>
        </div>
      </footer>
      <div className="ds-grainfx" aria-hidden="true" />
    </div>
  )
}
