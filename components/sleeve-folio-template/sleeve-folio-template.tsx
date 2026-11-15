"use client"

import React, { useEffect, useRef, useState } from "react"

/*
 * Sleeve Folio — a one-page portfolio for Kedhareswer Naidu (Kedhar), AI engineer.
 *
 * Near-black page (#080808), one orange accent (#ff5100), a condensed display serif over a
 * quiet grotesk. Desktop is a fixed 1240px column; under 810px it switches to a 15px-gutter phone layout.
 * Motion, top to bottom:
 *  - hero: a 3D collage of photographs settles out of a steep tilt (4s), its nine pieces flip in
 *    on springs, then the whole stage tips back as you scroll (direct, unsmoothed);
 *  - text rises 40px on a soft spring as it enters; section titles rise word by word;
 *  - about cards fold up from rotateX(-50deg), 150ms apart; the dots light up under the cursor;
 *  - work: each photo slides up out of a sleeve (a slanted coloured card) and tilts -5deg on a
 *    bouncier spring, slides back in when it leaves, and lifts while the sleeve flips its slant on hover;
 *  - toolkit: eight panels stand at rotateX(-30) rotateY(50), deal in 100ms apart, lift on hover;
 *  - kind words: three columns drift at three speeds under two fades;
 *  - contact card folds up like the about cards.
 * Everything honours prefers-reduced-motion (final states, no tilt, no drift).
 * Pictures and the two font subsets are served from kedhar-components.pages.dev to keep this file small.
 */

const BASE = "https://kedhar-components.pages.dev/sleeve-folio-template/"
const EMAIL = "kedhareswer.12110626@gmail.com"

// #region springs
// Damped springs sampled into CSS linear() easings, fitted to the measured motion:
// A = soft (w 10.6, zeta .9), M = slow hero piece (w 5.66, zeta .9), B = sleeve bounce (w 13.8, zeta .6),
// C = panel deal (w 14, zeta .7), H = hover (w 25, zeta .85), W = title words (w 15, zeta .85).
export function springAt(w: number, z: number, t: number) {
  if (z < 1) {
    const wd = w * Math.sqrt(1 - z * z)
    return 1 - Math.exp(-z * w * t) * (Math.cos(wd * t) + ((z * w) / wd) * Math.sin(wd * t))
  }
  return 1 - Math.exp(-w * t) * (1 + w * t)
}
export const SPRINGS = {
  A: { w: 10.6, z: 0.9, dur: 0.9 },
  M: { w: 5.66, z: 0.9, dur: 1.7 },
  B: { w: 13.8, z: 0.6, dur: 1.0 },
  C: { w: 14, z: 0.7, dur: 0.8 },
  H: { w: 25, z: 0.85, dur: 0.45 },
  W: { w: 15, z: 0.85, dur: 0.7 },
}
// Hero stage: tilt and sink are linear in scroll. Desktop reaches -40deg / 150px at 407px;
// the phone layout only leans to -10deg / 10px, reached at 103px.
export function heroTilt(scroll: number, narrow: boolean) {
  const p = Math.min(1, Math.max(0, scroll / (narrow ? 103 : 407)))
  return narrow ? { rx: -10 * p, ty: 10 * p } : { rx: -40 * p, ty: 150 * p }
}
// Kind words: each column starts lifted (70 / 200 / 400px) and sinks back through 0
// over 745px of scroll once the column block reaches the top of the view, then keeps going.
export const DRIFT = [-70, -200, -400]
export function driftAt(start: number, past: number) {
  const p = Math.min(2.2, Math.max(0, past / 745))
  return start * (1 - p)
}
// #endregion

const EASE: Record<string, string> = {
  A: "linear(0,0.03,0.1024,0.1972,0.3007,0.4037,0.5007,0.5887,0.6661,0.7327,0.7889,0.8355,0.8735,0.9041,0.9285,0.9476,0.9623,0.9736,0.982,0.9883,0.9928,0.996,0.9982,0.9997,1.0006,1.0012,1.0014,1.0015,1.0015,1.0014,1.0013,1.0011,1.0009,1.0008,1.0007,1.0005,1)",
  M: "linear(0,0.0251,0.0869,0.1696,0.2621,0.3566,0.448,0.533,0.61,0.6782,0.7374,0.7881,0.8309,0.8665,0.8959,0.9198,0.9391,0.9544,0.9665,0.9759,0.9831,0.9886,0.9927,0.9957,0.9978,0.9993,1.0003,1.0009,1.0013,1.0015,1.0015,1.0015,1.0014,1.0013,1.0011,1.001,1.0008,1.0007,1.0006,1.0005,1)",
  B: "linear(0,0.0516,0.1772,0.3396,0.5107,0.671,0.8088,0.9182,0.9985,1.0517,1.0819,1.0939,1.0928,1.0831,1.0687,1.0525,1.0368,1.0228,1.0114,1.0027,0.9967,0.9931,0.9914,0.991,0.9917,0.9929,0.9944,0.996,0.9974,0.9985,0.9995,1.0001,1.0005,1.0008,1.0009,1.0008,1.0007,1.0006,1.0004,1.0003,1)",
  C: "linear(0,0.0518,0.1745,0.3288,0.4876,0.6341,0.7589,0.8584,0.933,0.9851,1.0185,1.0371,1.045,1.0455,1.0415,1.035,1.0277,1.0206,1.0142,1.009,1.0049,1.0019,0.9999,0.9987,0.9981,0.9979,0.998,0.9982,0.9985,0.9989,0.9992,0.9995,1)",
  H: "linear(0,0.115,0.3348,0.5513,0.7236,0.8447,0.922,0.9672,0.9911,1.0021,1.0059,1.0061,1.005,1.0036,1.0024,1.0014,1.0008,1.0004,1.0001,1,1)",
  W: "linear(0,0.0568,0.1838,0.3348,0.483,0.6145,0.7236,0.8097,0.8748,0.922,0.955,0.9771,0.9911,0.9994,1.0039,1.0059,1.0063,1.0059,1.005,1.0041,1.0032,1.0024,1.0017,1.0012,1.0008,1.0005,1.0003,1.0001,1)",
}

// Hero collage. Desktop box (left, top, width, height in px of a 960 x 613 stage), phone box
// (px of a 360 x 383 stage), depth, and how each piece flies in:
// [img, [l,t,w,h], [l,t,w,h], z, flipY, fromScale, fromX, fromY, delay, spring]
type Piece = [string, number[], number[], number, number, number, number, number, number, string]
const PIECES: Piece[] = [
  ["h-a", [12, 124, 280, 290], [-8, 116, 164, 170], -70, 180, 0.7, -30, 220, 0.7, "A"],
  ["h-b", [36, 420, 298, 276], [19, 272, 125, 116], 80, 50, 0.8, -30, 220, 1.3, "A"],
  ["h-main", [274, 11, 413, 581], [65, 20, 230, 333], 50, 120, 0.94, -30, 500, 0.5, "M"],
  ["h-c", [110, 277, 260, 314], [16, 201, 126, 152], 10, 80, 0.7, 0, 220, 0.8, "A"],
  ["h-d", [626, 62, 196, 211], [214, 42, 146, 157], -130, 70, 0.8, 120, 220, 0.9, "A"],
  ["h-e", [402, -38, 175, 129], [115, -44, 138, 102], -30, 20, 0.8, -30, -220, 0.9, "A"],
  ["h-f", [376, 535, 189, 108], [135, 339, 89, 51], -20, 120, 0.8, -30, 220, 1.0, "A"],
  ["h-g", [602, 532, 209, 172], [225, 308, 119, 98], 10, 70, 0.8, 80, 220, 1.2, "A"],
  ["h-h", [651, 260, 268, 298], [162, 166, 162, 180], -20, 145, 0.8, 80, 220, 0.9, "A"],
]

// Eleven sleeves: picture + the colour of the slanted card behind it.
const WORK = ["#62574a", "#1f3648", "#2d1c16", "#016498", "#2d1b11", "#ca6c30", "#857a62", "#a3a3a3", "#826a48", "#202c1e", "#ba5829"]

const TOOLKIT = ["LLM Apps", "RAG Systems", "Agents", "Fine-tuning", "Evaluation", "Data Pipelines", "Interfaces", "Prototypes"]

// Dot pyramid on the first about card: rows of 3..7 circles.
const DOT_ROWS = [3, 4, 5, 6, 7]

type Quote = { n: number; text: string }
const WORDS: Quote[][] = [
  [
    { n: 1, text: "It felt like every document finally had its own answer. His use of retrieval and evaluation is next-level, and the turnaround was super fast without compromising quality. If you’re looking for someone with both rigor and taste, Kedhar’s the one." },
    { n: 2, text: "I hired Kedhar for our contract search tool, and honestly, I’m still surprised how calm the launch was. He didn’t push us into a stiff, generic chatbot — he let the team work the way it already worked and built around that. The pipeline, the citations, the small interface details — all of it felt considered. People keep asking who built it, and I’ve been happily passing his name along." },
    { n: 3, text: "There’s a reason Kedhar’s work feels different — it’s because he cares. He’s not just wiring a model to a text box. He gets to know the problem." },
  ],
  [
    { n: 4, text: "He brought this energy that made our messy data feel workable. The final tool? Solid. It didn’t just demo well, it held up in production. You can tell he’s careful." },
    { n: 5, text: "I was blown away by Kedhar’s ability to listen and explain. He really understood what we wanted." },
    { n: 6, text: "Our team was launching a new product, and Kedhar was our top choice to build the assistant. He came prepared with test sets, failure cases, and a full understanding of our users. On launch day, he was calm under pressure, resourceful, and had a sharp eye for detail." },
    { n: 7, text: "The care, the intention behind the build. I watched him turn a pile of scanned PDFs into a clean, searchable system with patience and good judgment. He’s got real range, and it shows in every release." },
  ],
  [
    { n: 8, text: "Kedhar is a force. He doesn’t just ship features — he builds trust. I brought him in for an agent prototype, and what he delivered went beyond anything I imagined." },
    { n: 9, text: "He set up the evaluations, tuned the prompts, gave clear updates, and somehow made the hard parts disappear. The results were so much more than I hoped for — they were honest, measurable, and easy to extend. Highly recommend him to anyone who wants a real product, not just a demo." },
    { n: 10, text: "Kedhar has this gift of making complex systems feel simple. I’m usually lost in technical reviews, but with him, I didn’t even notice the jargon. He gave just the right amount of detail and kept us moving." },
  ],
]
const AV = ["#ff5100", "#e9e2d6", "#6f8fb4", "#c9a27a", "#9fb59a", "#f2b58a", "#d6d6d6", "#ffb26b", "#b9a7d8", "#e6c15a"]

function fontCss() {
  return (
    "@font-face{font-family:SlvSerif;src:url(" + BASE + "serif.woff2) format(\"woff2\");font-weight:400;font-display:swap}" +
    "@font-face{font-family:SlvSans;src:url(" + BASE + "sans.woff2) format(\"woff2\");font-weight:400;font-display:swap}"
  )
}

const CSS =
  ".slv-root{--slv-acc:#ff5100;--slv-acc2:#f35d18;--slv-serif:SlvSerif,'Times New Roman',Georgia,serif;--slv-sans:SlvSans,ui-sans-serif,system-ui,sans-serif;position:relative;width:100%;overflow-x:hidden;overflow-y:auto;background:#080808;color:rgba(255,255,255,.8);font-family:var(--slv-sans);font-size:18px;line-height:1.3;letter-spacing:-0.02em;-webkit-font-smoothing:antialiased;scrollbar-width:none}" +
  ".slv-root::-webkit-scrollbar{display:none}" +
  ".slv-root :where(h1,h2,h3,h4,p,figure,ul,li,blockquote){margin:0;padding:0;list-style:none;font-weight:400}" +
  ".slv-root :where(a){color:inherit;text-decoration:none}" +
  ".slv-root :where(button,input){font:inherit;letter-spacing:inherit;color:inherit;background:none;border:0;padding:0;margin:0;border-radius:0}" +
  ".slv-root img,.slv-root svg{max-width:none}" +
  ".slv-root *,.slv-root *::before,.slv-root *::after{box-sizing:border-box}" +
  ".slv-wrap{width:min(1240px,calc(100% - 60px));margin:0 auto}" +
  ".slv-p{font-size:22px;line-height:28.6px;letter-spacing:-0.44px;color:rgba(255,255,255,.8)}" +
  ".slv-h2{font-family:var(--slv-serif);font-size:55px;line-height:66px;letter-spacing:-2.2px;color:#fff}" +
  ".slv-h3{font-family:var(--slv-serif);font-size:33px;line-height:46.2px;letter-spacing:0;color:#fff}" +
  ".slv-acc{color:var(--slv-acc)}" +
  ".slv-link{transition:color .3s ease}" +
  "@media (hover:hover){.slv-link:hover{color:#fff}}" +
  /* nav */
  ".slv-nav{position:sticky;top:0;z-index:20;height:64px;background:#080808;overflow:hidden;transition:height .9s " + EASE.A + "}" +
  ".slv-nav::after{content:'';position:absolute;left:0;right:0;top:63px;height:1px;background:rgba(255,255,255,.08)}" +
  ".slv-bar{height:64px;display:flex;align-items:center;justify-content:space-between;padding:0 5px}" +
  ".slv-brand{font-size:22px;line-height:35.2px;letter-spacing:-0.44px;color:#fff}" +
  ".slv-links{display:flex;gap:24px}" +
  ".slv-links a{font-size:18px;line-height:23.4px;letter-spacing:-0.36px;color:rgba(255,255,255,.8);transition:color .3s ease}" +
  ".slv-links a[aria-current]{color:var(--slv-acc)}" +
  "@media (hover:hover){.slv-links a:not([aria-current]):hover{color:#fff}}" +
  ".slv-burger{display:none;position:relative;width:44px;height:44px;cursor:pointer}" +
  ".slv-burger i{position:absolute;left:12px;width:20px;height:2px;border-radius:10px;background:#999;transition:transform .45s " + EASE.H + "}" +
  ".slv-burger i:first-child{top:16px}.slv-burger i:last-child{top:27px}" +
  ".slv-burger[aria-expanded=true] i:first-child{transform:translateY(5.5px) rotate(45deg)}" +
  ".slv-burger[aria-expanded=true] i:last-child{transform:translateY(-5.5px) rotate(-45deg)}" +
  ".slv-drawer{display:none}" +
  /* reveals */
  ".slv-rise{opacity:0;transform:translateY(40px);transition:transform .9s " + EASE.A + ",opacity .9s " + EASE.A + "}" +
  ".slv-rise[data-in]{opacity:1;transform:none}" +
  ".slv-word{display:inline-block;opacity:0;transform:translateY(50px);transition:transform .7s " + EASE.W + ",opacity .7s " + EASE.W + "}" +
  "[data-in] .slv-word{opacity:1;transform:none}" +
  ".slv-fold{opacity:0;transform:perspective(1500px) translateY(180px) rotateX(-50deg);transition:transform .9s " + EASE.A + ",opacity .9s " + EASE.A + "}" +
  ".slv-fold[data-in]{opacity:1;transform:perspective(1500px)}" +
  /* hero */
  ".slv-hero{padding-top:70px;text-align:center}" +
  ".slv-stagebox{position:relative;width:960px;height:613px;margin:0 auto}" +
  ".slv-tilt{position:absolute;inset:0;transform-style:preserve-3d;will-change:transform}" +
  ".slv-stage{position:absolute;inset:0;transform-style:preserve-3d;animation:slv-settle 4s cubic-bezier(0,.95,.2,.96) both}" +
  "@keyframes slv-settle{from{transform:translateY(70px) rotateX(-60deg) scale(1.5)}to{transform:none}}" +
  ".slv-piece{position:absolute;left:var(--l);top:var(--t);width:var(--w);height:var(--h);transform-style:preserve-3d}" +
  ".slv-piece>div{width:100%;height:100%;border-radius:12px;overflow:hidden;background:#171717;opacity:0;transform:perspective(1500px) translate(var(--fx),var(--fy)) rotateY(var(--fr)) scale(var(--fs));animation:slv-flip var(--fd) var(--fe) var(--fdl) both}" +
  "@keyframes slv-flip{to{opacity:1;transform:perspective(1500px)}}" +
  ".slv-piece img{display:block;width:100%;height:100%;object-fit:cover}" +
  ".slv-h1{font-family:var(--slv-serif);font-size:95px;line-height:104.5px;letter-spacing:-3.8px;color:#fff;margin-top:150px}" +
  ".slv-lead{max-width:850px;margin:16px auto 0}" +
  ".slv-pill{display:inline-flex;align-items:center;justify-content:center;width:174px;height:43px;margin-top:16px;border:2px solid var(--slv-acc2);border-radius:12px;font-size:18px;line-height:23.4px;letter-spacing:-0.36px;color:rgba(255,255,255,.8);transition:background-color .18s ease}" +
  "@media (hover:hover){.slv-pill:hover{background:rgba(243,93,24,.12)}}" +
  ".slv-pill:focus-visible{outline:2px solid #fff;outline-offset:3px}" +
  ".slv-ruler{display:block;width:min(1178px,calc(100% - 12px));height:auto;margin:0 auto}" +
  ".slv-hero .slv-ruler{margin-top:70px}" +
  ".slv-hero{padding-bottom:60px}" +
  /* about */
  ".slv-about{padding:60px 0}" +
  ".slv-cards{display:grid;grid-template-columns:repeat(3,1fr);gap:30px;margin-top:16px}" +
  ".slv-card{position:relative;height:539px;border-radius:12px;background:#171717;overflow:hidden}" +
  ".slv-c1{border-radius:24px}" +
  ".slv-c1 .slv-h3{position:absolute;left:20px;top:20px;width:275px}" +
  ".slv-c1 .slv-h3+div+.slv-h3{top:auto;bottom:20px}" +
  ".slv-dots{position:absolute;left:0;right:0;top:142px;display:flex;flex-direction:column;align-items:center}" +
  ".slv-dots div{display:flex;gap:5px;flex:none}" +
  ".slv-dots span{width:60px;height:60px;flex:none;border-radius:50%;background:#262626;transition:background-color .8s ease}" +
  "@media (hover:hover) and (pointer:fine){.slv-dots span:hover{background:var(--slv-acc);transition-duration:.15s}}" +
  ".slv-c2 figure{height:340px;border-radius:12px 12px 0 0;overflow:hidden}.slv-c2 img{width:100%;height:100%;object-fit:cover;display:block}" +
  ".slv-meta{position:absolute;left:20px;right:20px;top:360px;bottom:20px;display:flex;flex-direction:column;justify-content:space-between}" +
  ".slv-meta>div{display:flex;justify-content:space-between;align-items:center}" +
  ".slv-meta h4{font-family:var(--slv-serif);font-size:30px;line-height:42px;letter-spacing:-1.2px;color:#fff}" +
  ".slv-meta p{font-size:18px;line-height:23.4px;letter-spacing:-0.36px}" +
  ".slv-c3>img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}" +
  ".slv-vf{position:absolute;left:64px;top:47px;width:265px;height:245px;border:2px solid #fff;border-radius:12px;display:grid;place-items:center}" +
  ".slv-vf::after{content:'';width:14px;height:14px;border-radius:50%;background:var(--slv-acc)}" +
  ".slv-c3 .slv-h3{position:absolute;left:20px;bottom:20px;width:196px}" +
  ".slv-also{padding-top:46px}" +
  ".slv-also .slv-p{max-width:910px;margin-top:7px}" +
  ".slv-about .slv-ruler{margin-top:129px}" +
  /* work */
  ".slv-work{padding:60px 0;text-align:center;overflow:hidden}" +
  ".slv-list{margin-top:70px;display:flex;flex-direction:column;align-items:center;gap:28px}" +
  ".slv-proj{position:relative;display:block;width:540px;max-width:100%;height:516px;overflow:hidden;outline:none}" +
  ".slv-holder{position:absolute;left:50%;top:56px;width:330px;height:460px;margin-left:-165px;z-index:3}" +
  ".slv-thumb{position:absolute;inset:0;border-radius:12px;overflow:hidden;background:#171717;transform:translateY(300px);transform-origin:100% 50%;transition:transform 1s " + EASE.B + "}" +
  ".slv-thumb img{width:100%;height:100%;object-fit:cover;display:block}" +
  ".slv-proj[data-in] .slv-thumb{transform:rotate(-5deg)}" +
  ".slv-box{position:absolute;left:50%;top:308px;width:470px;height:210px;margin-left:-235px;border-radius:14px;transform:rotate(10deg) skewY(-10deg);z-index:1;transition:transform .45s " + EASE.H + "}" +
  "@media (hover:hover) and (pointer:fine){.slv-proj[data-in]:hover .slv-thumb{transform:translateY(-48px) rotate(-4deg);transition-duration:.45s;transition-timing-function:" + EASE.H + "}.slv-proj[data-in]:hover .slv-box{transform:rotate(-5deg) skewY(5deg)}}" +
  ".slv-proj:focus-visible .slv-thumb{outline:2px solid var(--slv-acc);outline-offset:-2px}" +
  ".slv-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}" +
  ".slv-work .slv-ruler{margin-top:70px}" +
  /* toolkit */
  ".slv-tools{position:relative;background:var(--slv-acc);color:#080808;overflow:hidden;padding:60px 0;text-align:center}" +
  ".slv-arrow{display:inline-flex;align-items:center;gap:10px;font-size:22px;line-height:35.2px;letter-spacing:-0.44px;color:#080808}" +
  ".slv-arrow svg{width:11px;height:12px;transition:transform .45s " + EASE.H + "}" +
  "@media (hover:hover){.slv-arrow:hover svg{transform:translate(2px,-2px)}}" +
  ".slv-tools .slv-h2{color:#080808;text-transform:uppercase}" +
  ".slv-row{position:relative;height:250px;margin-top:70px;text-align:left}" +
  ".slv-rowin{position:absolute;left:0;top:0;width:1296px;height:430px;transform:scale(var(--k,1));transform-origin:0 0}" +
  ".slv-panel{position:absolute;top:0;left:calc(var(--i) * 144px);width:144px;height:430px;opacity:0;transform:translateY(120px) rotateX(-60deg) rotateY(70deg);transition:transform .8s " + EASE.C + ",opacity .8s " + EASE.C + ";transition-delay:calc(var(--i) * .1s)}" +
  "[data-in] .slv-panel{opacity:1;transform:rotateX(-30deg) rotateY(50deg)}" +
  ".slv-panel a{display:block;width:288px;height:430px;outline:none}" +
  ".slv-panel span{display:flex;justify-content:space-between;align-items:flex-start;width:100%;height:100%;padding:13px;background:#202020;border:2px solid #393939;border-radius:12px;transition:transform .45s " + EASE.H + ",background-color .25s ease,border-color .25s ease}" +
  ".slv-panel svg{flex:none;width:18px;height:18px;margin-top:14px;color:#fff}" +
  "@media (hover:hover) and (pointer:fine){.slv-panel a:hover span{transform:translateY(-70px) scale(1.1);background:#171717;border-color:var(--slv-acc2)}}" +
  ".slv-panel a:focus-visible span{border-color:#fff}" +
  /* kind words */
  ".slv-words{padding:60px 0;text-align:center;overflow:hidden}" +
  ".slv-words-h{padding:60px 0 30px}" +
  ".slv-words-h .slv-p{max-width:910px;margin:7px auto 0}" +
  ".slv-cols{position:relative;display:grid;grid-template-columns:repeat(3,1fr);align-items:start;gap:30px;margin-top:10px;height:1491px;overflow:hidden;text-align:left}" +
  ".slv-cols::before,.slv-cols::after{content:'';position:absolute;left:0;right:0;z-index:1;pointer-events:none}" +
  ".slv-cols::before{top:0;height:230px;background:linear-gradient(#080808,rgba(8,8,8,0))}" +
  ".slv-cols::after{bottom:0;height:366px;background:linear-gradient(rgba(8,8,8,0) 15.852%,#080808 72.007%)}" +
  ".slv-col{display:flex;flex-direction:column;gap:30px;will-change:transform}" +
  ".slv-col:nth-child(1){margin-top:129px}.slv-col:nth-child(3){margin-top:164px}" +
  ".slv-q{opacity:0;transform:translateY(120px) rotateX(-10deg) rotateY(5deg);transition:transform .8s " + EASE.C + ",opacity .8s " + EASE.C + "}" +
  ".slv-q[data-in]{opacity:1;transform:none}" +
  ".slv-q>div{display:flex;flex-direction:column;align-items:flex-start;gap:23px;background:#171717;border-radius:12px;padding:30px}" +
  ".slv-who{display:flex;align-items:center;gap:16px}" +
  ".slv-av{width:80px;height:80px;border-radius:50%;display:grid;place-items:center;font-family:var(--slv-serif);font-size:30px;letter-spacing:-1px;color:#080808;flex:none}" +
  ".slv-who p{font-size:22px;line-height:28.6px;letter-spacing:-0.44px}.slv-who small{display:block;font-size:18px;line-height:23.4px;letter-spacing:-0.36px}" +
  ".slv-q blockquote{font-size:18px;line-height:23.4px;letter-spacing:-0.36px}" +
  ".slv-like{display:inline-flex;align-items:center;gap:10px;height:41px;padding:0 17px;border-radius:38px;background:#232323;font-size:18px;line-height:23.4px;letter-spacing:-0.36px;color:rgba(255,255,255,.8);cursor:pointer;transition:background-color .3s ease}" +
  ".slv-like svg{width:20px;height:19px;fill:rgba(255,255,255,.11);stroke:rgba(255,255,255,.67);transition:fill .2s ease,stroke .2s ease,transform .45s " + EASE.H + "}" +
  ".slv-like[aria-pressed=true] svg{fill:var(--slv-acc);stroke:var(--slv-acc)}" +
  ".slv-like:active svg{transform:scale(.86)}" +
  "@media (hover:hover){.slv-like:hover{background:#262626}}" +
  ".slv-like:focus-visible{outline:2px solid var(--slv-acc);outline-offset:2px}" +
  /* contact */
  ".slv-contact{padding:60px 0}" +
  ".slv-cta{background:var(--slv-acc);color:#080808;border-radius:12px;padding:45px;transform-origin:50% 50%}" +
  ".slv-cta.slv-fold{transform:translateY(180px) rotateX(-50deg)}.slv-cta.slv-fold[data-in]{transform:none}" +
  ".slv-smile{display:block;width:55px;height:55px}" +
  ".slv-cta .slv-h2{color:#080808;margin-top:35px}" +
  ".slv-cta .slv-p{color:#080808;max-width:870px;margin-top:17px}" +
  ".slv-mail{display:flex;align-items:center;height:40px;margin-top:110px;border-bottom:1px solid #080808}" +
  ".slv-mail input{flex:1;min-width:0;height:40px;font-size:18px;color:#080808}.slv-mail input::placeholder{color:#080808;opacity:1}" +
  ".slv-mail input:focus{outline:none}" +
  ".slv-mail button{display:grid;place-items:center;width:56px;height:40px;cursor:pointer}" +
  ".slv-mail button svg{width:20px;height:17px;transition:transform .45s " + EASE.H + "}" +
  "@media (hover:hover){.slv-mail button:hover svg{animation:slv-press .3s " + EASE.H + "}}" +
  "@keyframes slv-press{from{transform:scale(.8)}to{transform:none}}" +
  ".slv-mail button:focus-visible{outline:2px solid #080808}" +
  /* footer */
  ".slv-foot{padding:60px 0}" +
  ".slv-info{display:flex;gap:131px}" +
  ".slv-info>div{width:265px}.slv-info>div:first-child{width:auto;min-width:296px}" +
  ".slv-info h4{font-size:20.5px;line-height:24.6px;letter-spacing:0;color:#fff}" +
  ".slv-info .slv-h3{display:block;margin-top:18px;color:rgba(255,255,255,.8);white-space:nowrap}" +
  ".slv-small{display:flex;gap:60px;margin-top:80px}" +
  ".slv-small h4{font-size:22px;line-height:28.6px;letter-spacing:-0.44px}" +
  ".slv-small p,.slv-small a{display:block;font-size:18px;line-height:23.4px;letter-spacing:-0.36px;color:rgba(255,255,255,.5)}" +
  ".slv-small p{margin-top:10px}.slv-small a{margin-top:10px}.slv-small h4+a{margin-top:12px}" +
  ".slv-small a[aria-current]{color:rgba(255,81,0,.7)}" +
  ".slv-name{display:flex;align-items:flex-end;justify-content:space-between;margin-top:80px}" +
  ".slv-giant{font-family:var(--slv-serif);font-size:200px;line-height:280px;letter-spacing:-4px;color:var(--slv-acc)}" +
  ".slv-name .slv-p{width:270px;padding-bottom:60px}.slv-name .slv-p b{font-weight:600;color:#fff}" +
  ".slv-base{display:flex;justify-content:space-between;margin-top:80px;padding-top:50px;border-top:1px solid rgba(255,255,255,.08);font-size:18px;line-height:23.4px;letter-spacing:-0.36px}" +
  ".slv-base button{cursor:pointer}" +
  /* between phone and the fixed desktop column: keep the desktop design, shrink what cannot fit */
  "@media (max-width:1100px) and (min-width:810px){.slv-stagebox{transform:scale(.8);margin-top:-60px;margin-bottom:-60px}.slv-h1{font-size:76px;line-height:84px}.slv-card{height:500px}.slv-dots{transform:scale(.72);transform-origin:50% 0}.slv-vf{left:12%;width:76%}.slv-info{gap:40px}.slv-giant{font-size:150px;line-height:210px}.slv-meta h4{font-size:24px}}" +
  /* phone */
  "@media (max-width:809px){" +
  ".slv-wrap{width:calc(100% - 30px)}" +
  ".slv-p{font-size:14px;line-height:18.2px;letter-spacing:-0.28px}" +
  ".slv-h2{font-size:30px;line-height:36px;letter-spacing:-1.2px}" +
  ".slv-h3{font-size:21px;line-height:29.4px}" +
  ".slv-nav .slv-wrap{width:calc(100% - 16px)}.slv-bar{padding:0}" +
  ".slv-links{display:none}.slv-burger{display:block}" +
  ".slv-nav[data-open]{height:239px}" +
  ".slv-drawer{display:flex;flex-direction:column;padding:8px 20px 0}.slv-drawer a{font-size:14px;line-height:18.2px;letter-spacing:-0.28px;color:rgba(255,255,255,.8)}.slv-drawer a[aria-current]{color:var(--slv-acc)}" +
  ".slv-stagebox{width:360px;height:383px}" +
  ".slv-piece{left:var(--ml);top:var(--mt);width:var(--mw);height:var(--mh)}" +
  ".slv-h1{font-size:61px;line-height:67.1px;letter-spacing:-2.44px;margin-top:70px}" +
  ".slv-pill{font-size:14px;line-height:18.2px}" +
  ".slv-hero{padding-bottom:15px}.slv-hero .slv-ruler{margin-top:69px}" +
  ".slv-about{padding:15px 0}" +
  ".slv-cards{grid-template-columns:1fr;gap:15px}" +
  ".slv-card.slv-c1{height:518px}.slv-card.slv-c2{height:546px}.slv-card.slv-c3{height:455px}" +
  ".slv-c1 .slv-h3{font-family:var(--slv-serif);font-size:30px;line-height:36px;letter-spacing:-1.2px;width:248px}" +
  ".slv-c1 .slv-h3+div+.slv-h3,.slv-c3 .slv-h3{font-size:42px;line-height:46.2px;letter-spacing:0}" +
  ".slv-dots{top:137px}" +
  ".slv-c2 figure{height:378px}.slv-meta{top:398px}.slv-meta h4{font-size:21px;line-height:29.4px;letter-spacing:-0.84px}.slv-meta p{font-size:14px;line-height:18.2px}" +
  ".slv-vf{left:72px;top:35px;width:216px;height:213px}.slv-c3 .slv-h3{width:284px}" +
  ".slv-also{padding-top:31px}.slv-about .slv-ruler{margin-top:40px;margin-bottom:15px}" +
  ".slv-work{padding:15px 0}.slv-work>.slv-h2{padding-top:70px}" +
  ".slv-list{margin-top:25px;gap:0}" +
  ".slv-proj{width:360px;height:450px}" +
  ".slv-holder{top:105px;width:247px;height:344px;margin-left:-123px;transform:rotate(4deg)}" +
  ".slv-box{top:242px;width:313px;height:210px;margin-left:-157px;transform:rotate(5deg) skewY(-5deg)}" +
  ".slv-work .slv-ruler{margin-top:25px}" +
  ".slv-row{height:3440px;margin-top:25px}" +
  ".slv-rowin{position:relative;width:288px;height:auto;margin:0 auto;transform:none}" +
  ".slv-panel{position:relative;left:auto;width:288px;transform:translateY(120px) rotateX(-60deg) rotateY(110deg);transition-delay:0s}" +
  ".slv-row[data-in] .slv-panel{opacity:0;transform:translateY(120px) rotateX(-60deg) rotateY(110deg)}" +
  ".slv-row .slv-panel[data-in]{opacity:1;transform:translateY(-50px) rotateX(-30deg) rotateY(30deg)}" +
  ".slv-words{padding:0}.slv-words-h{padding:30px 0}.slv-words-h .slv-h2{font-size:42px;line-height:46.2px;letter-spacing:0}" +
  ".slv-cols{grid-template-columns:1fr;gap:15px;height:auto;margin-top:10px}" +
  ".slv-col{gap:15px;margin-top:0!important;transform:none!important}" +
  ".slv-q>div{padding:15px;gap:15px}.slv-av{width:62px;height:62px;font-size:24px}.slv-who{gap:15px}" +
  ".slv-who p,.slv-who small,.slv-q blockquote,.slv-like{font-size:14px;line-height:18.2px;letter-spacing:-0.28px}" +
  ".slv-contact{padding:0 0 60px}" +
  ".slv-cta{padding:25px}" +
  ".slv-foot{padding:60px 0}.slv-info{flex-direction:column;gap:30px}.slv-info .slv-h3{margin-top:4px}" +
  ".slv-small{margin-top:34px;flex-direction:column;gap:30px}.slv-small h4{font-size:14px;line-height:18.2px}.slv-small p,.slv-small a{font-size:14px;line-height:18.2px}" +
  ".slv-name{flex-direction:column;align-items:flex-start;margin-top:34px}.slv-giant{font-size:120px;line-height:150px;letter-spacing:-2.4px}.slv-name .slv-p{width:100%;padding:0}" +
  ".slv-base{margin-top:34px;padding-top:30px;font-size:14px;line-height:18.2px}" +
  "}" +
  /* reduced motion: final states, nothing moves */
  "@media (prefers-reduced-motion:reduce){.slv-root *,.slv-root *::before,.slv-root *::after{animation:none!important;transition-duration:.01ms!important;transition-delay:0s!important}" +
  ".slv-rise,.slv-fold,.slv-cta.slv-fold,.slv-q,.slv-piece>div,.slv-word{opacity:1!important;transform:none!important}.slv-panel{opacity:1;transform:rotateX(-30deg) rotateY(50deg)}.slv-thumb{transform:rotate(-5deg)}.slv-col{transform:none!important}}" +
  "@media (prefers-reduced-motion:reduce) and (max-width:809px){.slv-row .slv-panel,.slv-row[data-in] .slv-panel{opacity:1;transform:translateY(-50px) rotateX(-30deg) rotateY(30deg)}}"

type Props = {
  height?: string
  imageBase?: string
  className?: string
  style?: React.CSSProperties
}

function Ruler() {
  return (
    <svg className="slv-ruler" viewBox="0 0 1178 44" fill="none" aria-hidden="true">
      <path d="M4 21.5H1174" stroke="#202020" />
      <path d="M44.5 43V1M408.5 42V2M772.5 42V2M1136.5 42V2" stroke="#262626" />
      <path d="M226.5 31V13M590.5 31V13M954.5 31V13" stroke="#262626" opacity=".5" />
      <rect x="0" y="18" width="8" height="8" rx="2" fill="#f35d18" />
      <rect x="1170" y="18" width="8" height="8" rx="2" fill="#f35d18" />
    </svg>
  )
}

function Words({ text }: { text: string }) {
  const words = text.split(" ")
  return (
    <>
      {words.map((w, i) => (
        <React.Fragment key={i}>
          <span className="slv-word" style={{ transitionDelay: 0.2 + i * 0.05 + "s" }}>
            {w}
          </span>
          {i < words.length - 1 ? " " : null}
        </React.Fragment>
      ))}
    </>
  )
}

const Arrow = () => (
  <svg viewBox="-1 -1 11 12" fill="none" aria-hidden="true">
    <path d="M1 8.5L9 .6M9 .6H0M9 .6v9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
const Mark = () => (
  <svg viewBox="0 0 18 18" fill="none" aria-hidden="true">
    <circle cx="9" cy="9" r="8.25" stroke="currentColor" strokeWidth="1.5" />
    <path d="M9 4.2v9.6M4.2 9h9.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)
const Heart = () => (
  <svg viewBox="0 0 20 19" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M19 5.75c0-2.5-2.1-4.5-4.7-4.5-1.9 0-3.6 1.1-4.3 2.7-.7-1.6-2.4-2.7-4.3-2.7C3.1 1.25 1 3.25 1 5.75c0 7.2 9 12 9 12s9-4.8 9-12z" />
  </svg>
)

export default function SleeveFolioTemplate({ height = "100svh", imageBase = BASE, className = "", style }: Props) {
  const rootRef = useRef(null as HTMLDivElement | null)
  const tiltRef = useRef(null as HTMLDivElement | null)
  const colsRef = useRef(null as HTMLDivElement | null)
  const colRefs = useRef([] as (HTMLDivElement | null)[])
  const rowRef = useRef(null as HTMLDivElement | null)
  const [liked, setLiked] = useState({} as Record<number, boolean>)
  const [mail, setMail] = useState("")
  const [open, setOpen] = useState(false)
  const img = (n: string) => imageBase + n + ".webp"

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches

    // in-view reveals: once for text and cards, both ways for the work sleeves. Triggers use layout
    // positions (offsetTop ignores transforms), so an element pushed 180px down still fires when its
    // resting top crosses 92% of the view, as in the measured reference.
    const items = Array.from(root.querySelectorAll("[data-reveal]")) as HTMLElement[]
    let tops: number[] = []
    let bottoms: number[] = []
    const absTop = (el: HTMLElement) => {
      let y = 0
      let e: HTMLElement | null = el
      while (e && e !== root) {
        y += e.offsetTop
        e = e.offsetParent as HTMLElement | null
      }
      return y
    }
    const cols = items.map((el) => Number(el.dataset.col ?? -1))
    // how far each element starts below its resting place: the trigger is its moved box entering the view
    const offs = items.map((el) => Number(el.dataset.reveal || 0))
    const want = items.map(() => false)
    const lift = [0, 0, 0]
    let holderTop = 56
    const flip = (i: number, on: boolean) => {
      want[i] = on
      // the reference starts each reveal ~200ms after the element enters; keep that beat
      window.setTimeout(() => {
        if (want[i] === on) items[i].toggleAttribute("data-in", on)
      }, 185)
    }
    const reveal = (s: number) => {
      for (let i = 0; i < items.length; i++) {
        const el = items[i]
        const dy = cols[i] >= 0 ? lift[cols[i]] : 0 // quotes ride their drifting column
        if (el.dataset.toggle != null) {
          // a sleeve: the photo itself is watched. Hidden, it sits 300px lower; shown, at rest.
          const top = tops[i] + holderTop + (want[i] ? 0 : 300)
          const seen = top < s + vh && top + bottoms[i] - tops[i] - holderTop > s
          if (seen !== want[i]) flip(i, seen)
        } else if (!want[i] && tops[i] + offs[i] + dy < s + vh) flip(i, true)
      }
    }
    if (reduce) items.forEach((el) => el.setAttribute("data-in", ""))

    // geometry, cached on resize: the scroll loop only reads scrollTop
    let vh = root.clientHeight
    let colsTop = 0
    let narrow = false
    const measure = () => {
      vh = root.clientHeight
      narrow = root.clientWidth < 810
      tops = items.map(absTop)
      bottoms = items.map((el, i) => tops[i] + el.offsetHeight)
      const c = colsRef.current
      if (c) colsTop = absTop(c)
      const hold = root.querySelector(".slv-holder") as HTMLElement | null
      if (hold) holderTop = hold.offsetTop
      const row = rowRef.current
      if (row) row.style.setProperty("--k", String(Math.min(1, row.clientWidth / 1240)))
    }
    measure()
    const ro = new ResizeObserver(() => {
      measure()
      paint()
    })
    ro.observe(root)
    // sections change height as fonts and pictures arrive; re-measure the cached tops when they do
    root.querySelectorAll("section").forEach((el) => ro.observe(el))

    let raf = 0
    const paint = () => {
      raf = 0
      const s = root.scrollTop
      if (reduce) return
      const past = s - colsTop
      for (let i = 0; i < 3; i++) lift[i] = narrow ? 0 : driftAt(DRIFT[i], past)
      reveal(s)
      const t = heroTilt(s, narrow)
      const tilt = tiltRef.current
      if (tilt) tilt.style.transform = "perspective(1600px) translateY(" + t.ty.toFixed(2) + "px) rotateX(" + t.rx.toFixed(3) + "deg)"
      colRefs.current.forEach((c, i) => {
        if (c) c.style.transform = "translateY(" + lift[i].toFixed(2) + "px)"
      })
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(paint)
    }
    paint()
    root.addEventListener("scroll", onScroll, { passive: true })
    return () => {
      ro.disconnect()
      root.removeEventListener("scroll", onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  const jump = (id: string) => (ev: React.MouseEvent) => {
    const root = rootRef.current
    const el = root && (root.querySelector("#slv-" + id) as HTMLElement | null)
    if (!root || !el) return
    ev.preventDefault()
    setOpen(false)
    root.scrollTo({ top: id === "home" ? 0 : el.offsetTop - 64, behavior: "smooth" })
  }
  const send = (ev: React.FormEvent) => {
    ev.preventDefault()
    window.location.href = "mailto:" + EMAIL + "?subject=" + encodeURIComponent("Hello Kedhar") + (mail ? "&body=" + encodeURIComponent("Reply to: " + mail) : "")
  }
  const navLinks = (
    <>
      <a href="#slv-home" aria-current="page" onClick={jump("home")}>
        Home
      </a>
      <a href="#slv-work" onClick={jump("work")}>
        Projects
      </a>
      <a href="#slv-contact" onClick={jump("contact")}>
        Contact
      </a>
    </>
  )

  return (
    <div ref={rootRef} className={"slv-root " + className} style={{ ...style, height }}>
      <style>{fontCss() + CSS}</style>

      <header className="slv-nav" data-open={open ? "" : undefined}>
        <div className="slv-wrap">
          <div className="slv-bar">
            <a className="slv-brand" href="#slv-home" onClick={jump("home")}>
              KEDHARESWER
            </a>
            <nav className="slv-links" aria-label="Sections">
              {navLinks}
            </nav>
            <button type="button" className="slv-burger" aria-label="Menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
              <i />
              <i />
            </button>
          </div>
          <nav className="slv-drawer" aria-label="Sections, phone" aria-hidden={!open}>
            {navLinks}
          </nav>
        </div>
      </header>

      <section id="slv-home" className="slv-hero">
        <div className="slv-stagebox" aria-hidden="true">
          <div ref={tiltRef} className="slv-tilt" style={{ transform: "perspective(1600px)" }}>
            <div className="slv-stage">
              {PIECES.map(([n, d, m, z, fr, fs, fx, fy, dl, sp]) => (
                <div
                  key={n}
                  className="slv-piece"
                  style={
                    {
                      "--l": d[0] + "px",
                      "--t": d[1] + "px",
                      "--w": d[2] + "px",
                      "--h": d[3] + "px",
                      "--ml": m[0] + "px",
                      "--mt": m[1] + "px",
                      "--mw": m[2] + "px",
                      "--mh": m[3] + "px",
                      transform: "translateZ(" + z + "px)",
                    } as React.CSSProperties
                  }
                >
                  <div
                    style={
                      {
                        "--fx": fx + "px",
                        "--fy": fy + "px",
                        "--fr": fr + "deg",
                        "--fs": fs,
                        "--fd": sp === "M" ? "1.7s" : ".9s",
                        "--fe": EASE[sp],
                        "--fdl": dl + "s",
                      } as React.CSSProperties
                    }
                  >
                    <img src={img(n)} alt="" width={d[2]} height={d[3]} style={{ maxWidth: "none" }} loading="eager" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="slv-wrap">
          <h1 className="slv-h1">Models,Pixels and Kedhar.</h1>
          <p className="slv-p slv-lead slv-rise" data-reveal="40">
            I’m Kedhar, an AI engineer exploring the space between models, product, and people. From quiet pipelines to bold interfaces, my work shapes how we search, read, and decide.
          </p>
          <div className="slv-rise" data-reveal="40">
            <a className="slv-pill" href="#slv-work" onClick={jump("work")}>
              See Work.
            </a>
          </div>
          <Ruler />
        </div>
      </section>

      <section className="slv-about" aria-labelledby="slv-about-h">
        <div className="slv-wrap">
          <h2 id="slv-about-h" className="slv-h2 slv-acc slv-rise" data-reveal="40">
            (About Me)
          </h2>
          <div className="slv-cards">
            <article className="slv-card slv-c1 slv-fold" data-reveal="276">
              <h3 className="slv-h3">Engineering is 20% model, 80% craft</h3>
              <div className="slv-dots" aria-hidden="true">
                {DOT_ROWS.map((n) => (
                  <div key={n}>
                    {Array.from({ length: n }, (_, i) => (
                      <span key={i} />
                    ))}
                  </div>
                ))}
              </div>
              <h3 className="slv-h3">#True</h3>
            </article>
            <article className="slv-card slv-c2 slv-fold" data-reveal="276" style={{ transitionDelay: ".15s" }}>
              <figure>
                <img src={img("a-glass")} alt="" width={393} height={340} style={{ maxWidth: "none" }} loading="lazy" />
              </figure>
              <div className="slv-meta">
                <div>
                  <span>
                    <h4>Build Days</h4>
                    <p>Mon – Fri</p>
                  </span>
                  <span>
                    <h4>Time</h4>
                    <p>10:00 – 19:00</p>
                  </span>
                </div>
                <div>
                  <h4>Location:</h4>
                  <p>Anywhere with Wi-Fi</p>
                </div>
              </div>
            </article>
            <article className="slv-card slv-c3 slv-fold" data-reveal="276" style={{ transitionDelay: ".3s" }}>
              <img src={img("a-red")} alt="" width={393} height={539} style={{ maxWidth: "none" }} loading="lazy" />
              <div className="slv-vf" aria-hidden="true" />
              <h3 className="slv-h3">What’s the point of the model?</h3>
            </article>
          </div>
          <div className="slv-also">
            <h2 className="slv-h2 slv-acc slv-rise" data-reveal="40">
              And Also
            </h2>
            <p className="slv-p slv-rise" data-reveal="40">
              Late builds. Clean logs. That one test run before the demo goes live.
              <br />
              I’m obsessed with chasing clarity through data and design. My work is about building what can’t be faked — from loud product launches to quiet, careful pipelines. If it helps for real, I ship it.
            </p>
          </div>
          <Ruler />
        </div>
      </section>

      <section id="slv-work" className="slv-work" aria-labelledby="slv-work-h">
        <h2 id="slv-work-h" className="slv-h2" data-reveal="50">
          <Words text="#My Work" />
        </h2>
        <div className="slv-list">
          {WORK.map((box, i) => {
            const label = "Project " + String(i + 1).padStart(2, "0")
            return (
              <a key={i} className="slv-proj" href="#slv-work" data-reveal="300" data-toggle="" onClick={(e) => e.preventDefault()}>
                <span className="slv-sr">{label}</span>
                <div className="slv-holder">
                  <figure className="slv-thumb">
                    <img src={img("w" + (i + 1))} alt="" width={330} height={460} style={{ maxWidth: "none" }} loading="lazy" />
                  </figure>
                </div>
                <div className="slv-box" style={{ background: box }} aria-hidden="true" />
              </a>
            )
          })}
        </div>
        <div className="slv-wrap">
          <Ruler />
        </div>
      </section>

      <section className="slv-tools" aria-labelledby="slv-tools-h">
        <div className="slv-wrap">
          <a className="slv-arrow slv-rise" data-reveal="40" href="#slv-work" onClick={jump("work")}>
            See Work <Arrow />
          </a>
          <h2 id="slv-tools-h" className="slv-h2" data-reveal="50">
            <Words text="That’s my toolkit" />
          </h2>
          <div ref={rowRef} className="slv-row" data-reveal="120">
            <div className="slv-rowin">
              {TOOLKIT.map((t, i) => (
                <div key={t} className="slv-panel" data-reveal="120" style={{ "--i": i } as React.CSSProperties}>
                  <a href="#slv-contact" onClick={jump("contact")}>
                    <span>
                      <h3 className="slv-h3">{t}</h3>
                      <Mark />
                    </span>
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="slv-words" aria-labelledby="slv-words-h">
        <div className="slv-wrap">
          <div className="slv-words-h">
            <h2 id="slv-words-h" className="slv-h2 slv-acc slv-rise" data-reveal="40">
              Don’t believe me ?
            </h2>
            <p className="slv-p slv-rise" data-reveal="40">
              These aren’t just clients, they’re collaborators, builders, and part of the work. Scroll through what others said after shipping something with Kedhar.
            </p>
          </div>
          <div ref={colsRef} className="slv-cols">
            {WORDS.map((col, ci) => (
              <div
                key={ci}
                className="slv-col"
                ref={(el) => {
                  colRefs.current[ci] = el
                }}
                style={{ transform: "translateY(" + DRIFT[ci] + "px)" }}
              >
                {col.map((q) => {
                  const on = !!liked[q.n]
                  return (
                    <figure key={q.n} className="slv-q" data-reveal="120" data-col={ci}>
                      <div>
                        <figcaption className="slv-who">
                          <span className="slv-av" style={{ background: AV[(q.n - 1) % AV.length] }} aria-hidden="true">
                            {"C" + q.n}
                          </span>
                          <p>
                            {"Client " + q.n}
                            <small>Team Lead</small>
                          </p>
                        </figcaption>
                        <blockquote>{q.text}</blockquote>
                        <button type="button" className="slv-like" aria-pressed={on} onClick={() => setLiked((m) => ({ ...m, [q.n]: !on }))}>
                          <Heart /> Like
                        </button>
                      </div>
                    </figure>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="slv-contact" className="slv-contact" aria-labelledby="slv-cta-h">
        <div className="slv-wrap">
          <div className="slv-cta slv-fold" data-reveal="180">
            <svg className="slv-smile" viewBox="-3 -3 55 55" fill="none" aria-hidden="true">
              <circle cx="24.5" cy="24.5" r="24.5" stroke="currentColor" strokeWidth="4.1" />
              <path d="M15.8 33.2a12.3 12.3 0 0 0 17.4 0" stroke="currentColor" strokeWidth="4.1" strokeLinecap="round" />
              <ellipse cx="17.4" cy="18.4" rx="1" ry="2" stroke="currentColor" strokeWidth="4.1" />
              <ellipse cx="31.6" cy="18.4" rx="1" ry="2" stroke="currentColor" strokeWidth="4.1" />
            </svg>
            <h2 id="slv-cta-h" className="slv-h2">
              Ready to build something real?
            </h2>
            <p className="slv-p">Let’s create something useful, whether it’s an agent, a search tool, or a whole product. Kedhar’s calendar fills up fast, so don’t wait.</p>
            <form className="slv-mail" onSubmit={send}>
              <input type="email" value={mail} onChange={(e) => setMail(e.target.value)} placeholder="Info@email.com" aria-label="Your email" />
              <button type="submit" aria-label="Email Kedhar">
                <svg viewBox="-1 -1 20 17" fill="none" aria-hidden="true">
                  <path d="M10.5 0L18 7.5M18 7.5L10.5 15M18 7.5H0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </form>
          </div>
        </div>
      </section>

      <footer className="slv-foot">
        <div className="slv-wrap">
          <div className="slv-info">
            <div>
              <h4>[My Email]</h4>
              <a className="slv-h3 slv-link" href={"mailto:" + EMAIL}>
                {EMAIL}
              </a>
            </div>
            <div>
              <h4>[My Role]</h4>
              <span className="slv-h3">AI Engineer</span>
            </div>
            <div>
              <h4>[My Status]</h4>
              <span className="slv-h3">Open to work</span>
            </div>
          </div>
          <div className="slv-small">
            <div>
              <h4>[Location]</h4>
              <p>
                Andhra Pradesh
                <br />
                India
                <br />
                GMT +5:30
              </p>
            </div>
            <div>
              <h4>[Pages]</h4>
              <a className="slv-link" href="#slv-home" aria-current="page" onClick={jump("home")}>
                Home
              </a>
              <a className="slv-link" href="#slv-work" onClick={jump("work")}>
                Projects
              </a>
              <a className="slv-link" href="#slv-contact" onClick={jump("contact")}>
                Contact
              </a>
            </div>
          </div>
          <div className="slv-name">
            <div className="slv-giant">Kedhar</div>
            <p className="slv-p">
              Built in code, shaped in Andhra Pradesh — design by <b>Kedhar,</b> currently creating cool things with <b>AI</b>
            </p>
          </div>
          <div className="slv-base">
            <span>[Created by Kedhareswer]</span>
            <button type="button" className="slv-link" onClick={() => rootRef.current && rootRef.current.scrollTo({ top: 0, behavior: "smooth" })}>
              [Back to top]
            </button>
          </div>
        </div>
      </footer>
    </div>
  )
}
