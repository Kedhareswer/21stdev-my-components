"use client"

import * as React from "react"

/**
 * Molten Ink Template
 *
 * A one-page studio site in hot yellow and black, built around liquid.
 *
 * - A navy loader: one dot splits into an X mark, then a field of dots grows out
 *   of the centre, its middle melts into wavy stripes and floods the screen yellow.
 * - The hero: a huge wordmark with a script word writing itself after it. Black
 *   ink follows the pointer as a liquid trail, and wherever it crosses the
 *   letters they turn to iridescent chrome. A gadget floats in the middle.
 * - A showreel panel that grows to full bleed as you scroll.
 * - A manifesto under a curved yellow edge, line by line.
 * - A work grid of gadgets where a roaming liquid blob uncovers coloured tiles.
 * - A black footer where yellow ink follows the pointer across the sign-off.
 *
 * Everything liquid is one small WebGL renderer (metaballs) in three modes; the
 * loader is its own shader. React is the only dependency.
 */

const SITE = "https://kedhar-components.pages.dev/molten-ink-template/"
const FONT_HREF = "https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;800&family=Caveat:wght@700&display=swap"

export type MoltenWork = { image: string; title: string; kind: string; year: string; tile: string; ink?: string }

export type MoltenInkTemplateProps = {
  /** Height of the hero (and the loader). A definite length. */
  height?: string
  /** The bold half of the wordmark. */
  name?: string
  /** The script word that writes itself after it. */
  script?: string
  /** Short line under the wordmark. */
  tagline?: string
  /** Manifesto lines (one string per line). */
  manifesto?: string[]
  /** Work grid entries. Twelve read best; tiles are the colours the blob uncovers. */
  works?: MoltenWork[]
  /** Contact address in the footer. */
  email?: string
  /** Big footer line. */
  signoff?: string
  /** Skip the navy loader and start on the hero. */
  skipLoader?: boolean
  className?: string
}

const TILES = ["#ff4b3a", "#9ff27a", "#ff6a1a", "#c9a7ff", "#4aa3ff", "#ffc2a1", "#ff8fd0", "#3fe0c5", "#ffb000", "#8ad1ff", "#ff4b3a", "#9ff27a"]
const KINDS = ["Interface", "Motion", "Components", "Brand", "Prototype", "Interface", "Motion", "Components", "Brand", "Prototype", "Interface", "Motion"]

const DEFAULT_WORKS: MoltenWork[] = Array.from({ length: 12 }, (_, i) => ({
  image: SITE + "gadget-" + String(i + 1).padStart(2, "0") + ".webp",
  title: "Client " + (i + 1),
  kind: KINDS[i],
  year: String(2026 - (i % 3)),
  tile: TILES[i],
}))

const DEFAULT_MANIFESTO = [
  "Kedhar is a one-person",
  "design studio built on craft and curiosity.",
  "I melt for lovingly made interfaces,",
  "motion and components.",
]

// #region timeline
// Seconds from the moment the page has its pictures. Read off the reference at 60 fps.
const T = {
  dot: [0.0, 0.28],
  split: [0.3, 0.8],
  markYellow: [0.82, 1.0],
  markOut: [1.05, 1.35],
  field: [1.2, 2.25],
  flood: [1.95, 2.45],
  loaderOut: [2.35, 2.75],
  heroIn: 2.4,
  scriptWrite: [2.75, 3.6],
  swoosh: [2.7, 3.9],
  gadgetIn: [2.9, 3.5],
}
const LOADER_END = T.loaderOut[1]

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x)
const span = (t: number, ab: number[]) => clamp01((t - ab[0]) / (ab[1] - ab[0]))
const easeOut3 = (x: number) => 1 - Math.pow(1 - x, 3)
const easeInOut3 = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2)

/** Point on the intro ink swoosh (0..1): x as a fraction of the hero width, y in name heights from the top of the name (0 = top, 1 = bottom), so it tracks the letters at any aspect ratio: it leaves the hanging drop, sweeps right across the script, loops back left through the middle of the name and leaves at the left edge. */
function swooshAt(u: number) {
  const P = [
    [0.3, 0.08],
    [0.55, 0.42],
    [0.86, 0.58],
    [0.76, 0.96],
    [0.46, 0.69],
    [0.2, 0.58],
    [0.03, 0.85],
  ]
  const s = clamp01(u) * (P.length - 1)
  const i = Math.min(P.length - 2, Math.floor(s))
  const f = s - i
  const p0 = P[Math.max(0, i - 1)]
  const p1 = P[i]
  const p2 = P[i + 1]
  const p3 = P[Math.min(P.length - 1, i + 2)]
  // Catmull-Rom through the control points
  const cr = (a: number, b: number, c: number, d: number) =>
    0.5 * (2 * b + (-a + c) * f + (2 * a - 5 * b + 4 * c - d) * f * f + (-a + 3 * b - 3 * c + d) * f * f * f)
  return [cr(p0[0], p1[0], p2[0], p3[0]), cr(p0[1], p1[1], p2[1], p3[1])]
}

/** Trail radius multiplier after `age` seconds: ink thins, then dries. */
function inkLife(age: number, hold: number) {
  if (age < hold) return 1
  // keep full width, then shrink fast: neighbours are close in age, so the stroke
  // retracts from its start with a short tapered tip instead of beading along its length
  const k = (age - hold) / 0.3
  return k >= 1 ? 0 : 1 - k * k
}
// #endregion

// ---------------------------------------------------------------------------
// WebGL: one metaball renderer, three modes.

const VERT = "attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}"

const INK_FRAG = [
  "precision highp float;",
  "uniform vec2 uRes;uniform float uDpr;uniform vec3 uPts[64];uniform int uCount;uniform float uTime;",
  "uniform vec3 uInk;uniform int uMode;uniform sampler2D uTex;uniform float uHasTex;",
  "float field(vec2 q){float f=0.;for(int i=0;i<64;i++){if(i>=uCount)break;vec3 b=uPts[i];vec2 d=q-b.xy;float k=clamp(1.-dot(d,d)/(4.*b.z*b.z+.001),0.,1.);f+=2.37*k*k*k;}return f;}",
  "void main(){",
  " vec2 q=vec2(gl_FragCoord.x,uRes.y-gl_FragCoord.y)/uDpr;",
  " float f=field(q);",
  " float w=fwidth(f)*1.2+0.02;",
  " float a=smoothstep(1.-w,1.+w,f);",
  " vec2 uv=gl_FragCoord.xy/uRes;",
  " vec4 tex=uHasTex>0.5?texture2D(uTex,uv):vec4(0.);",
  " vec3 col;",
  " if(uMode==1){",
  // reveal: the tiles inside, a dark rim just inside the edge offset down-left
  "  float fs=field(q+vec2(26.,-30.));",
  "  float rim=1.-smoothstep(1.,1.6,fs);",
  "  col=mix(tex.rgb,vec3(0.05),rim*0.92);",
  " }else{",
  // ink: flat ink, but where it crosses the text it turns to thin-film chrome
  "  vec3 irid=0.55+0.45*cos(6.2832*(f*0.22+q.x*0.0016-q.y*0.001+uTime*0.12+vec3(0.,0.33,0.67)));",
  "  float edge=1.-smoothstep(1.,2.4,f);",
  "  vec3 chrome=mix(vec3(.97,.97,.95),irid,.18+.82*edge);",
  "  col=mix(uInk,chrome,tex.r);",
  " }",
  " gl_FragColor=vec4(col*a,a);",
  "}",
].join("\n")

// Loader: an X mark of five dots, then a 45-degree dot field that grows out of
// the centre, melts into stripes and floods yellow. The background is navy.
const LOADER_FRAG = [
  "precision highp float;",
  "uniform vec2 uRes;uniform float uDpr;uniform float uT;",
  "float smin(float a,float b,float k){float h=clamp(.5+.5*(b-a)/k,0.,1.);return mix(b,a,h)-k*h*(1.-h);}",
  "float cl(float x){return clamp(x,0.,1.);}",
  "float sp(float t,float a,float b){return cl((t-a)/(b-a));}",
  "float eo(float x){return 1.-pow(1.-x,3.);}",
  "float markSdf(vec2 q,float t){",
  " float grow=eo(sp(t,0.,.28));float sp2=eo(sp(t,.3,.8));",
  " float r=7.*grow+2.*sp2;float d=length(q)-r*(1.-sp2*.25);",
  " float s=14.*sp2;",
  " for(int i=0;i<4;i++){float a=.7854+1.5708*float(i);vec2 c=vec2(cos(a),sin(a))*s;d=smin(d,length(q-c)-r*.8,8.*sp2+.01);}",
  " return d;}",
  "float fieldSdf(vec2 q,float t,float maxD){",
  " float g=34.;mat2 R=mat2(.7071,-.7071,.7071,.7071);vec2 p=R*q;",
  " vec2 cell=floor(p/g);float d=1e5;",
  " float front=eo(sp(t,1.2,2.25))*maxD*1.15;float flood=sp(t,1.95,2.45);",
  // dots in one diagonal row melt together first (wavy stripes), rows only join in the flood
  " for(int j=-1;j<=1;j++){float dr=1e5;float kr=.01;",
  "  for(int i=-1;i<=1;i++){",
  "   vec2 c=(cell+vec2(float(i),float(j))+.5)*g;vec2 cw=c*R;float D=length(cw);",
  "   float on=cl((front-D)/(maxD*.12));",
  "   float core=cl(1.-D/(maxD*.6))*cl((t-1.4)/.55);",
  "   float r=g*(.13*on+.27*core*on)+g*1.2*flood*flood;",
  "   if(on<=0.)continue;",
  "   kr=max(kr,g*.55*core+g*.9*flood);",
  "   dr=smin(dr,length(p-c)-r,g*.55*core+g*.9*flood+.01);",
  "  }",
  "  d=smin(d,dr,g*.9*flood+.01);",
  " }",
  " return d;}",
  "void main(){",
  " vec2 q=(vec2(gl_FragCoord.x,uRes.y-gl_FragCoord.y)/uDpr)-(uRes/uDpr)*vec2(.5,.5);",
  " float maxD=length(uRes/uDpr)*.5;",
  " vec3 navy=mix(vec3(.02,.05,.15),vec3(.09,.2,.48),cl(.5-q.y/(uRes.y/uDpr)+.2));",
  " vec3 yel=vec3(.97,.84,0.);",
  " float t=uT;vec3 col=navy;",
  // the mark
  " float md=markSdf(q,t);float mA=(1.-smoothstep(-.8,.8,md))*(1.-sp(t,1.05,1.35));",
  " vec3 mCol=mix(vec3(1.),yel,sp(t,.82,1.));col=mix(col,mCol,mA);",
  // the field, with a small colour split at its edges
  " float fa=1.-smoothstep(-.8,.8,fieldSdf(q,t,maxD));",
  " float fr=1.-smoothstep(-.8,.8,fieldSdf(q+vec2(1.6,0.),t,maxD));",
  " float fb=1.-smoothstep(-.8,.8,fieldSdf(q-vec2(1.6,0.),t,maxD));",
  " float toY=sp(t,1.8,2.3);",
  " vec3 dotCol=mix(vec3(1.),yel,toY);",
  " vec3 fcol=vec3(mix(col.r,dotCol.r,fr),mix(col.g,dotCol.g,fa),mix(col.b,dotCol.b,fb));",
  " col=fcol;",
  " gl_FragColor=vec4(col,1.);",
  "}",
].join("\n")

type Gl = { gl: WebGLRenderingContext; prog: WebGLProgram; u: (n: string) => WebGLUniformLocation | null; tex: WebGLTexture | null }

function makeGl(canvas: HTMLCanvasElement, frag: string): Gl | null {
  // a lost or blocked context paints the canvas white, so a canvas without working GL hides itself
  const off = () => {
    canvas.style.display = "none"
    return null
  }
  canvas.addEventListener("webglcontextlost", off)
  const gl = canvas.getContext("webgl", { premultipliedAlpha: true, alpha: true, antialias: false })
  if (!gl || gl.isContextLost()) return off()
  gl.getExtension("OES_standard_derivatives")
  const sh = (type: number, src: string) => {
    const s = gl.createShader(type)
    if (!s) return null
    gl.shaderSource(s, src)
    gl.compileShader(s)
    return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null
  }
  const fragSrc = "#extension GL_OES_standard_derivatives : enable\n" + frag
  const vs = sh(gl.VERTEX_SHADER, VERT)
  const fs = sh(gl.FRAGMENT_SHADER, fragSrc)
  if (!vs || !fs) return off()
  const prog = gl.createProgram()
  if (!prog) return off()
  gl.attachShader(prog, vs)
  gl.attachShader(prog, fs)
  gl.linkProgram(prog)
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return off()
  gl.useProgram(prog)
  const buf = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buf)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
  const loc = gl.getAttribLocation(prog, "p")
  gl.enableVertexAttribArray(loc)
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)
  const cache: Record<string, WebGLUniformLocation | null> = {}
  const u = (n: string) => (n in cache ? cache[n] : (cache[n] = gl.getUniformLocation(prog, n)))
  return { gl, prog, u, tex: null }
}

function uploadTex(g: Gl, src: HTMLCanvasElement) {
  const { gl } = g
  if (!g.tex) g.tex = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, g.tex)
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
}

type Blob = { x: number; y: number; r: number; born: number; hold: number }

/** Draw an element's text into a mask canvas at its on-screen place, in white. */
function paintText(ctx: CanvasRenderingContext2D, el: HTMLElement, origin: DOMRect, dpr: number) {
  const cs = getComputedStyle(el)
  const r = el.getBoundingClientRect()
  ctx.save()
  ctx.scale(dpr, dpr)
  ctx.fillStyle = "#fff"
  ctx.textBaseline = "alphabetic"
  ctx.font = cs.fontStyle + " " + cs.fontWeight + " " + cs.fontSize + " " + cs.fontFamily
  const ls = parseFloat(cs.letterSpacing)
  const c = ctx as CanvasRenderingContext2D & { letterSpacing?: string }
  if ("letterSpacing" in c) c.letterSpacing = (isNaN(ls) ? 0 : ls) + "px"
  const m = ctx.measureText("Hg")
  const ascent = m.fontBoundingBoxAscent || parseFloat(cs.fontSize) * 0.8
  const descent = m.fontBoundingBoxDescent || parseFloat(cs.fontSize) * 0.2
  const lh = ascent + descent
  const pad = (r.height - lh) / 2
  const raw = el.textContent || ""
  const txt = cs.textTransform === "uppercase" ? raw.toUpperCase() : cs.textTransform === "lowercase" ? raw.toLowerCase() : raw
  ctx.fillText(txt, r.left - origin.left, r.top - origin.top + pad + ascent)
  ctx.restore()
}

// ---------------------------------------------------------------------------

const CSS =
  ".mit-root{position:relative;width:100%;background:#f6d400;color:#0d0d0d;font-family:'Inter Tight',ui-sans-serif,system-ui,-apple-system,'Segoe UI',sans-serif;overflow-x:clip}" +
  ".mit-root *{box-sizing:border-box}" +
  ".mit-root img{max-width:none}" +
  ".mit-hero{position:relative;overflow:hidden;isolation:isolate}" +
  ".mit-loader{position:absolute;inset:0;z-index:30;pointer-events:none}" +
  ".mit-loader canvas{position:absolute;inset:0;width:100%;height:100%;display:block}" +
  ".mit-nav{position:absolute;left:0;right:0;top:0;z-index:20;display:flex;align-items:center;justify-content:space-between;padding:clamp(14px,2vw,26px) clamp(16px,2.4vw,34px);pointer-events:none}" +
  ".mit-nav a{pointer-events:auto}" +
  ".mit-x{width:22px;height:22px;display:block;color:#0d0d0d}" +
  ".mit-orb{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:46px;height:24px;color:#0d0d0d}" +
  ".mit-pills{display:flex;gap:6px}" +
  ".mit-pill{font-size:10px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:#0d0d0d;text-decoration:none;border:1.5px solid #0d0d0d;border-radius:999px;padding:6px 12px;transition:background .25s,color .25s}" +
  ".mit-pill:hover{background:#0d0d0d;color:#f6d400}" +
  ".mit-pill:focus-visible{outline:2px solid #0d0d0d;outline-offset:3px}" +
  ".mit-head{position:absolute;z-index:1;left:clamp(16px,2.4vw,34px);right:clamp(16px,2.4vw,34px);top:18%;display:flex;flex-direction:column;align-items:flex-start}" +
  ".mit-mark{margin:0;display:flex;align-items:baseline;gap:.08em;line-height:.86;white-space:nowrap}" +
  ".mit-name{font-weight:800;font-size:clamp(64px,15vw,250px);letter-spacing:-.065em}" +
  ".mit-script{font-family:Caveat,'Segoe Script','Brush Script MT',cursive;font-weight:700;font-size:clamp(70px,15.5vw,260px);letter-spacing:-.02em;line-height:.7;padding:0 .14em;margin:0 -.14em;-webkit-mask-image:linear-gradient(90deg,#000 var(--w,0%),transparent calc(var(--w,0%) + 6%));mask-image:linear-gradient(90deg,#000 var(--w,0%),transparent calc(var(--w,0%) + 6%))}" +
  ".mit-tag{margin:calc(clamp(64px,15vw,250px) * .26 + 8px) 0 0;font-size:10px;font-weight:600;letter-spacing:.16em;line-height:1.4;text-transform:uppercase;opacity:.7}" +
  ".mit-inkc{position:absolute;inset:0;width:100%;height:100%;z-index:2;pointer-events:none;display:block}" +
  ".mit-gadget{position:absolute;z-index:3;left:50%;top:56%;width:clamp(150px,19vw,300px);height:auto;transform:translate(-50%,-50%);filter:drop-shadow(0 30px 40px rgba(0,0,0,.25))}" +
  ".mit-cue{position:absolute;z-index:3;left:50%;bottom:4%;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;gap:6px;font-size:9px;font-weight:600;letter-spacing:.2em;text-transform:uppercase}" +
  ".mit-reel{position:relative;height:200svh}" +
  ".mit-reel-pin{position:sticky;top:0;height:100svh;display:flex;align-items:center;justify-content:center;overflow:hidden}" +
  ".mit-reel-card{position:relative;width:100%;height:100%;overflow:hidden;background:#0a2bd8;will-change:clip-path}" +
  ".mit-reel-card img{position:absolute;left:50%;top:50%;width:120%;height:120%;object-fit:cover;transform:translate(-50%,-50%)}" +
  ".mit-reel-cap{position:absolute;left:clamp(16px,2.4vw,34px);bottom:clamp(16px,3vw,40px);color:#fff;display:flex;flex-direction:column;gap:10px}" +
  ".mit-reel-cap b{font-size:clamp(28px,5vw,72px);font-weight:800;letter-spacing:-.04em;line-height:1.25}" +
  ".mit-reel-cap small{font-size:10px;font-weight:600;letter-spacing:.18em;text-transform:uppercase;opacity:.8}" +
  ".mit-about{position:relative;z-index:2;margin-top:-14svh;padding:calc(14svh + clamp(40px,7vw,110px)) clamp(16px,2.4vw,34px) clamp(40px,6vw,90px)}" +
  ".mit-about-edge{position:absolute;left:0;top:0;width:100%;height:14svh;display:block}" +
  ".mit-about-body{position:relative;background:#f6d400}" +
  ".mit-kicker{font-size:10px;font-weight:600;letter-spacing:.18em;text-transform:uppercase;opacity:.6;margin:0 0 16px}" +
  ".mit-manifesto{margin:0;font-weight:500;font-size:clamp(26px,4.4vw,72px);line-height:.98;letter-spacing:-.035em;text-transform:uppercase}" +
  ".mit-manifesto span{display:block;overflow:hidden;padding-bottom:.04em}" +
  ".mit-manifesto span i{display:block;font-style:normal;will-change:transform}" +
  ".mit-manifesto span:first-child i{padding-left:38%}" +
  ".mit-works{position:relative;padding:clamp(20px,4vw,60px) clamp(16px,2.4vw,34px) clamp(60px,8vw,120px);isolation:isolate}" +
  ".mit-works-c{position:absolute;inset:0;width:100%;height:100%;z-index:0;pointer-events:none;display:block}" +
  ".mit-grid{position:relative;z-index:1;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:0;list-style:none;margin:0;padding:0}" +
  ".mit-card{position:relative;aspect-ratio:1/1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:8% 6% 14%}" +
  ".mit-card img{width:62%;height:62%;object-fit:contain;transition:transform .6s cubic-bezier(.2,.8,.2,1)}" +
  ".mit-card:hover img{transform:scale(1.06) rotate(-3deg)}" +
  ".mit-card a{position:absolute;inset:0;border-radius:4px}" +
  ".mit-card a:focus-visible{outline:2px solid #0d0d0d;outline-offset:-6px}" +
  ".mit-meta{position:absolute;left:8%;right:8%;bottom:7%;display:flex;justify-content:space-between;font-size:11px;font-weight:600;letter-spacing:.06em}" +
  ".mit-meta span:last-child{opacity:.55}" +
  ".mit-foot{position:relative;background:#0d0d0d;color:#f6d400;isolation:isolate;overflow:hidden;min-height:clamp(340px,58svh,620px);display:flex;flex-direction:column;justify-content:flex-end;padding:clamp(20px,3vw,40px) clamp(16px,2.4vw,34px)}" +
  ".mit-foot-c{position:absolute;inset:0;width:100%;height:100%;z-index:1;pointer-events:none;display:block}" +
  ".mit-sign{position:relative;margin:0 0 calc(clamp(64px,9.4vw,170px) * 1.06 - clamp(48px,11vw,190px) * .42 + 18px);display:flex;justify-content:center}" +
  ".mit-sign b{font-weight:800;font-size:clamp(48px,11vw,190px);letter-spacing:-.045em;line-height:.85;white-space:nowrap;text-transform:uppercase}" +
  ".mit-gl{position:relative;display:inline-block}" +
  ".mit-glove{position:absolute;z-index:2;left:50%;top:50%;width:clamp(64px,9.4vw,170px);max-width:none;height:auto;transform:translate(-50%,-46%) rotate(-6deg);pointer-events:none;filter:drop-shadow(0 18px 24px rgba(0,0,0,.45))}" +
  ".mit-foot-row{position:relative;z-index:3;display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);align-items:center;gap:12px 24px;font-size:11px;font-weight:600;letter-spacing:.12em;line-height:1.4;text-transform:uppercase}" +
  ".mit-foot-row > :first-child{justify-self:start}" +
  ".mit-foot-row > :last-child{justify-self:end}" +
  ".mit-foot-row a{color:#f6d400;text-decoration:none;border-bottom:1px solid rgba(246,212,0,.4)}" +
  ".mit-foot-row a:hover{border-color:#f6d400}" +
  ".mit-foot-row a:focus-visible{outline:2px solid #f6d400;outline-offset:3px}" +
  "@media (max-width:900px){.mit-foot-row{grid-template-columns:1fr}.mit-foot-row > :last-child{justify-self:start}}" +
  "@media (max-width:720px){.mit-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.mit-pills{display:none}.mit-manifesto span:first-child i{padding-left:0}}" +
  "@media (max-width:720px) and (orientation:portrait){.mit-head{top:13%}.mit-name{font-size:24vw}.mit-script{font-size:25vw}.mit-mark{flex-wrap:wrap;row-gap:0}.mit-name{line-height:1.22}.mit-script{line-height:1.28}.mit-tag{margin-top:calc(24vw * .12 + 8px)}.mit-gadget{top:69%}}" +
  "@media (prefers-reduced-motion:reduce){.mit-card img{transition:none}}"

const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches

function useFonts() {
  React.useEffect(() => {
    if (document.querySelector('link[data-mit-font="1"]')) return
    const l = document.createElement("link")
    l.rel = "stylesheet"
    l.href = FONT_HREF
    l.setAttribute("data-mit-font", "1")
    document.head.appendChild(l)
  }, [])
}

export function MoltenInkTemplate({
  height = "100svh",
  name = "Kedhar",
  script = "studio",
  tagline = "A small studio for interfaces, motion and components",
  manifesto = DEFAULT_MANIFESTO,
  works = DEFAULT_WORKS,
  email = "kedhareswer.12110626@gmail.com",
  signoff = "Reach out",
  skipLoader = false,
  className,
}: MoltenInkTemplateProps) {
  useFonts()
  const signWords = signoff.split(" ")
  const signFirst = signWords[0] || ""
  const signRest = signWords.slice(1).join(" ")
  const rootRef = React.useRef(null as HTMLDivElement | null)
  const heroRef = React.useRef(null as HTMLElement | null)
  const loaderRef = React.useRef(null as HTMLDivElement | null)
  const loaderCanvasRef = React.useRef(null as HTMLCanvasElement | null)
  const inkRef = React.useRef(null as HTMLCanvasElement | null)
  const nameRef = React.useRef(null as HTMLSpanElement | null)
  const scriptRef = React.useRef(null as HTMLSpanElement | null)
  const gadgetRef = React.useRef(null as HTMLImageElement | null)
  const reelRef = React.useRef(null as HTMLElement | null)
  const reelCardRef = React.useRef(null as HTMLDivElement | null)
  const reelImgRef = React.useRef(null as HTMLImageElement | null)
  const aboutRef = React.useRef(null as HTMLElement | null)
  const edgeRef = React.useRef(null as SVGPathElement | null)
  const worksRef = React.useRef(null as HTMLElement | null)
  const worksCanvasRef = React.useRef(null as HTMLCanvasElement | null)
  const footRef = React.useRef(null as HTMLElement | null)
  const footCanvasRef = React.useRef(null as HTMLCanvasElement | null)
  const signRef = React.useRef(null as HTMLElement | null)

  React.useEffect(() => {
    const root = rootRef.current
    const hero = heroRef.current
    if (!root || !hero) return
    const still = reduced()
    const skip = skipLoader || still
    let alive = true

    // ---- the clock (starts once the hero pictures are in, 4 s at most) ----
    let t0 = -1
    const now = () => performance.now() / 1000
    const clock = () => (t0 < 0 ? 0 : skip ? 99 : now() - t0)
    const pics = [gadgetRef.current, reelImgRef.current].filter(Boolean) as HTMLImageElement[]
    const ready = Promise.all(
      pics.map((im) => (im.complete ? Promise.resolve() : new Promise<void>((r) => ((im.onload = () => r()), (im.onerror = () => r()))))),
    )
    Promise.race([ready, new Promise((r) => setTimeout(r, 4000))]).then(() => {
      if (alive) t0 = now()
    })

    // ---- loader ----
    const loaderEl = loaderRef.current
    const lc = loaderCanvasRef.current
    const lg = !skip && lc ? makeGl(lc, LOADER_FRAG) : null
    if ((skip || !lg) && loaderEl) loaderEl.style.display = "none"

    // ---- ink renderers ----
    const inkGl = inkRef.current ? makeGl(inkRef.current, INK_FRAG) : null
    const worksGl = worksCanvasRef.current ? makeGl(worksCanvasRef.current, INK_FRAG) : null
    const footGl = footCanvasRef.current ? makeGl(footCanvasRef.current, INK_FRAG) : null
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5)

    const sizeCanvas = (c: HTMLCanvasElement | null, box: HTMLElement | null) => {
      if (!c || !box) return { w: 1, h: 1 }
      const r = box.getBoundingClientRect()
      const w = Math.max(1, Math.round(r.width))
      const h = Math.max(1, Math.round(r.height))
      if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) {
        c.width = Math.round(w * dpr)
        c.height = Math.round(h * dpr)
      }
      return { w, h }
    }

    // masks and tiles are painted to 2D canvases and uploaded as textures
    const paintHeroMask = () => {
      if (!inkGl || !inkRef.current) return
      const c = document.createElement("canvas")
      c.width = inkRef.current.width
      c.height = inkRef.current.height
      const x = c.getContext("2d")
      if (!x) return
      const o = hero.getBoundingClientRect()
      for (const el of [nameRef.current, scriptRef.current]) if (el) paintText(x, el, o, dpr)
      uploadTex(inkGl, c)
    }
    const paintSignMask = () => {
      if (!footGl || !footCanvasRef.current || !footRef.current || !signRef.current) return
      const c = document.createElement("canvas")
      c.width = footCanvasRef.current.width
      c.height = footCanvasRef.current.height
      const x = c.getContext("2d")
      if (!x) return
      paintText(x, signRef.current, footRef.current.getBoundingClientRect(), dpr)
      uploadTex(footGl, c)
    }
    const paintTiles = () => {
      const sec = worksRef.current
      const cv = worksCanvasRef.current
      if (!worksGl || !sec || !cv) return
      const c = document.createElement("canvas")
      c.width = cv.width
      c.height = cv.height
      const x = c.getContext("2d")
      if (!x) return
      const o = sec.getBoundingClientRect()
      x.scale(dpr, dpr)
      x.fillStyle = "#f6d400"
      x.fillRect(0, 0, c.width, c.height)
      const cards = Array.from(sec.querySelectorAll("[data-card]")) as HTMLElement[]
      cards.forEach((el, i) => {
        const r = el.getBoundingClientRect()
        const w = works[i]
        x.fillStyle = (w && w.tile) || TILES[i % TILES.length]
        x.fillRect(r.left - o.left, r.top - o.top, r.width + 1, r.height + 1)
        const tile = (w && w.tile) || TILES[i % TILES.length]
        const ink = TILES[(i + 4) % TILES.length]
        x.save()
        x.beginPath()
        x.rect(r.left - o.left, r.top - o.top, r.width, r.height)
        x.clip()
        x.fillStyle = ink.toLowerCase() === tile.toLowerCase() ? "#0d0d0d" : ink
        x.font = "800 " + Math.round(r.width * 0.2) + "px 'Inter Tight', system-ui, sans-serif"
        x.textBaseline = "middle"
        x.fillText((w && w.title) || "", r.left - o.left - r.width * 0.04, r.top - o.top + r.height * 0.5)
        x.restore()
      })
      uploadTex(worksGl, c)
    }

    let heroBox = { w: 1, h: 1 }
    let nameBox = { top: 1, h: 1 }
    let worksBox = { w: 1, h: 1 }
    let footBox = { w: 1, h: 1 }
    // The console floats over the wordmark on purpose, but never over the tagline.
    // When the two share horizontal space (narrow or near-square frames), it drops
    // below the tagline, and shrinks if the hero is too short to hold it.
    const placeGadget = () => {
      const gd = gadgetRef.current
      const tag = hero.querySelector(".mit-tag") as HTMLElement | null
      const cue = hero.querySelector(".mit-cue") as HTMLElement | null
      if (!gd || !tag) return
      gd.style.top = ""
      gd.style.width = ""
      const hr = hero.getBoundingClientRect()
      const cs = getComputedStyle(gd)
      const ratio = 880 / 558
      let w = parseFloat(cs.width)
      const cy = parseFloat(cs.top)
      const tr = tag.getBoundingClientRect()
      const tagBottom = tr.bottom - hr.top
      if (tr.right - hr.left + 12 <= hr.width / 2 - w / 2) return
      const floor = (cue ? cue.getBoundingClientRect().top - hr.top : hr.height) - 12
      let top = Math.max(cy, tagBottom + 16 + (w * ratio) / 2)
      if (top + (w * ratio) / 2 > floor) {
        w = Math.max(70, (floor - tagBottom - 16) / ratio)
        top = tagBottom + 16 + (w * ratio) / 2
      }
      gd.style.width = w.toFixed(1) + "px"
      gd.style.top = top.toFixed(1) + "px"
    }
    const layout = () => {
      placeGadget()
      heroBox = sizeCanvas(inkRef.current, hero)
      if (nameRef.current) {
        const nr = nameRef.current.getBoundingClientRect()
        nameBox = { top: nr.top - hero.getBoundingClientRect().top, h: Math.max(1, nr.height) }
      }
      sizeCanvas(lc, hero)
      worksBox = sizeCanvas(worksCanvasRef.current, worksRef.current)
      footBox = sizeCanvas(footCanvasRef.current, footRef.current)
      paintHeroMask()
      paintSignMask()
      paintTiles()
    }
    layout()
    const fonts = (document as Document & { fonts?: FontFaceSet }).fonts
    if (fonts && fonts.ready) fonts.ready.then(() => alive && layout())
    const ro = new ResizeObserver(() => layout())
    ro.observe(root)

    // ---- pointer ----
    let px = -1e4
    let py = -1e4
    let lastPx = -1e4
    let lastPy = -1e4
    const onMove = (e: PointerEvent) => {
      px = e.clientX
      py = e.clientY
    }
    window.addEventListener("pointermove", onMove, { passive: true })

    // ---- trails ----
    const heroTrail: Blob[] = []
    const footTrail: Blob[] = []
    const pushTrail = (trail: Blob[], x: number, y: number, r: number, hold: number, born = now()) => {
      trail.push({ x, y, r, born, hold })
      if (trail.length > 50) trail.shift()
    }
    // the works blob: a short chain that follows a target with lag
    const chain = Array.from({ length: 9 }, () => ({ x: 0, y: 0 }))
    let chainInit = false

    const pts = new Float32Array(64 * 3)
    const draw = (g: Gl | null, box: { w: number; h: number }, blobs: { x: number; y: number; r: number }[], mode: number, ink: number[], t: number) => {
      if (!g) return
      const { gl } = g
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)
      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)
      const n = Math.min(64, blobs.length)
      pts.fill(0)
      for (let i = 0; i < n; i++) {
        pts[i * 3] = blobs[i].x
        pts[i * 3 + 1] = blobs[i].y
        pts[i * 3 + 2] = blobs[i].r
      }
      gl.uniform2f(g.u("uRes"), gl.canvas.width, gl.canvas.height)
      gl.uniform1f(g.u("uDpr"), dpr)
      gl.uniform3fv(g.u("uPts"), pts)
      gl.uniform1i(g.u("uCount"), n)
      gl.uniform1f(g.u("uTime"), t)
      gl.uniform3f(g.u("uInk"), ink[0], ink[1], ink[2])
      gl.uniform1i(g.u("uMode"), mode)
      gl.uniform1f(g.u("uHasTex"), g.tex ? 1 : 0)
      if (g.tex) {
        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D, g.tex)
        gl.uniform1i(g.u("uTex"), 0)
      }
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    }

    const inView = (el: Element | null) => {
      if (!el) return false
      const r = el.getBoundingClientRect()
      return r.bottom > -50 && r.top < window.innerHeight + 50
    }

    let raf = 0
    let wander = 0
    let swooshU = 0
    const frame = () => {
      raf = requestAnimationFrame(frame)
      const t = clock()
      const tn = now()
      const vh = window.innerHeight

      // loader
      if (lg && loaderEl) {
        if (t < LOADER_END + 0.05) {
          const g = lg.gl
          g.viewport(0, 0, g.canvas.width, g.canvas.height)
          g.uniform2f(lg.u("uRes"), g.canvas.width, g.canvas.height)
          g.uniform1f(lg.u("uDpr"), dpr)
          g.uniform1f(lg.u("uT"), t)
          g.drawArrays(g.TRIANGLES, 0, 3)
          loaderEl.style.opacity = String(1 - easeOut3(span(t, T.loaderOut)))
        } else if (loaderEl.style.display !== "none") loaderEl.style.display = "none"
      }

      // hero entrance
      const sk = scriptRef.current
      if (sk) sk.style.setProperty("--w", (still ? 100 : easeInOut3(span(t, T.scriptWrite)) * 100).toFixed(1) + "%")
      const gd = gadgetRef.current
      if (gd) {
        const k = still ? 1 : easeOut3(span(t, T.gadgetIn))
        const bob = still ? 0 : Math.sin(tn * 1.3) * 6
        gd.style.opacity = k.toFixed(3)
        gd.style.transform = "translate(-50%,calc(-50% + " + ((1 - k) * 40 + bob).toFixed(1) + "px)) rotate(" + (still ? 0 : Math.sin(tn * 0.7) * 2.5).toFixed(2) + "deg)"
      }

      // hero ink: a hanging drop over the wordmark, the scripted swoosh, then the pointer
      if (inkGl && inView(hero)) {
        const hr = hero.getBoundingClientRect()
        const blobs: { x: number; y: number; r: number }[] = []
        // ink scales with the letters it crosses
        const unit = nameBox.h / 180
        if (!still && t >= T.heroIn) {
          // the drop: a fat blob that sags and wobbles above the name
          const dropK = easeOut3(span(t, [T.heroIn, T.heroIn + 0.5]))
          // a tadpole: a fat head over the name, its tail thinning up and to the right
          // fourteen close blobs so the thin tail stays one piece instead of beading
          for (let j = 0; j < 14; j++) {
            const u = j / 13
            const wob = Math.sin(tn * 1.7 - u * 4) * 6 * (1 - u)
            blobs.push({ x: heroBox.w * (0.3 + 0.14 * u) + wob, y: nameBox.top + nameBox.h * (0.04 - 0.38 * u + 0.11 * u * u) + Math.sin(tn * 2.1 - u * 3) * 3 * u, r: Math.max(14, 42 * (1 - u)) * unit * dropK })
          }
          // the swoosh lays a trail behind its head
          if (t < T.swoosh[1] + 0.05) {
            // walk the path from where the head was last frame, laying a blob
            // every few pixels so a fast stroke stays one continuous stroke
            const u = easeInOut3(span(t, T.swoosh))
            const step = 38 * unit
            while (swooshU < u) {
              const p = swooshAt(swooshU)
              const hx = p[0] * heroBox.w
              const hy = nameBox.top + p[1] * nameBox.h
              const last = heroTrail[heroTrail.length - 1]
              if (!last || Math.hypot(last.x - hx, last.y - hy) >= step) pushTrail(heroTrail, hx, hy, 31 * unit * (0.88 + 0.2 * Math.sin(swooshU * 9)), 1.2, tn - (t - T.swoosh[0]) + swooshU * 1.6)
              swooshU += 0.004
            }
          }
        }
        // pointer over the hero
        const lx = px - hr.left
        const ly = py - hr.top
        if (!still && t > T.heroIn + 0.4 && lx > 0 && ly > 0 && lx < heroBox.w && ly < heroBox.h) {
          const d = Math.hypot(px - lastPx, py - lastPy)
          if (d > 14) {
            const speed = Math.min(1, d / 60)
            const steps = lastPx < -1e3 ? 1 : Math.min(6, Math.ceil(d / 22))
            for (let s2 = 1; s2 <= steps; s2++) {
              const f = s2 / steps
              pushTrail(heroTrail, lastPx < -1e3 ? lx : lx - (px - lastPx) * (1 - f), lastPx < -1e3 ? ly : ly - (py - lastPy) * (1 - f), (20 + 12 * speed) * unit, 0.35)
            }
            lastPx = px
            lastPy = py
          }
        }
        for (let i = heroTrail.length - 1; i >= 0; i--) {
          const b = heroTrail[i]
          const k = inkLife(tn - b.born, b.hold)
          if (k <= 0) {
            heroTrail.splice(i, 1)
            continue
          }
          blobs.push({ x: b.x, y: b.y + (1 - k) * 18 * unit, r: b.r * Math.sqrt(k) })
        }
        draw(inkGl, heroBox, blobs.slice(-64), 0, [0.05, 0.05, 0.05], tn)
      }

      // showreel: the panel grows from an inset card to full bleed
      const reel = reelRef.current
      const card = reelCardRef.current
      if (reel && card) {
        const r = reel.getBoundingClientRect()
        const k = still ? 1 : easeInOut3(clamp01(-r.top / (vh * 0.7)))
        const ix = (1 - k) * 12
        const iy = (1 - k) * 34
        card.style.clipPath = "inset(" + iy.toFixed(2) + "% " + ix.toFixed(2) + "% 0% " + ix.toFixed(2) + "%)"
        const im = reelImgRef.current
        if (im) im.style.transform = "translate(-50%,-50%) scale(" + (1.14 - k * 0.1 + (still ? 0 : Math.sin(tn * 0.5) * 0.02)).toFixed(4) + ")"
      }

      // manifesto: the yellow edge bulges with the scroll, lines rise in
      const about = aboutRef.current
      if (about) {
        const r = about.getBoundingClientRect()
        const k = clamp01((vh - r.top) / (vh * 0.9))
        const edge = edgeRef.current
        if (edge) {
          const bulge = (1 - k) * 100
          edge.setAttribute("d", "M0," + bulge.toFixed(1) + " C25," + (bulge * 0.15).toFixed(1) + " 75," + (bulge * 0.15).toFixed(1) + " 100," + bulge.toFixed(1) + " L100,101 L0,101 Z")
        }
        const lines = Array.from(about.querySelectorAll("[data-line]")) as HTMLElement[]
        lines.forEach((el, i) => {
          const p = still ? 1 : easeOut3(clamp01((vh * 0.92 - el.getBoundingClientRect().top) / (vh * 0.25) - i * 0.05))
          el.style.transform = "translateY(" + ((1 - p) * 105).toFixed(1) + "%)"
        })
      }

      // works: a liquid blob that follows the pointer, or wanders on its own
      const sec = worksRef.current
      if (worksGl && sec && inView(sec)) {
        const r = sec.getBoundingClientRect()
        const inside = px > r.left && px < r.right && py > r.top && py < r.bottom
        if (!still) wander += 0.004
        const tw = still ? 0 : tn
        const tx = inside ? px - r.left : worksBox.w * (0.5 + 0.36 * Math.sin(wander * 2.1))
        const ty = inside
          ? py - r.top
          : clamp01((vh * 0.5 - r.top) / Math.max(1, worksBox.h)) * worksBox.h + Math.sin(wander * 3.3) * worksBox.h * 0.08
        if (!chainInit) {
          chain.forEach((c) => ((c.x = tx), (c.y = ty)))
          chainInit = true
        }
        chain.forEach((c, i) => {
          const lead = i === 0 ? { x: tx, y: ty } : chain[i - 1]
          const k = still ? 1 : i === 0 ? 0.06 : 0.2
          c.x += (lead.x - c.x) * k
          c.y += (lead.y - c.y) * k
        })
        const base = Math.min(worksBox.w, 1400) * 0.155
        const blobs = chain.map((c, i) => ({ x: c.x, y: c.y, r: base * (1 - i * 0.08) * (1 + 0.12 * Math.sin(tw * 2.3 + i * 1.7)) }))
        // two droplets orbit the head so the edge keeps changing shape
        const head = chain[0]
        for (let j = 0; j < 2; j++) {
          const a2 = tw * (0.9 + j * 0.5) + j * 2.4
          blobs.push({ x: head.x + Math.cos(a2) * base * 0.75, y: head.y + Math.sin(a2) * base * 0.6, r: base * (0.42 - j * 0.08) })
        }
        draw(worksGl, worksBox, blobs, 1, [0, 0, 0], tn)
      }

      // footer: yellow ink under the pointer, plus a drip that runs in when it arrives
      const foot = footRef.current
      if (footGl && foot && inView(foot)) {
        const r = foot.getBoundingClientRect()
        const lx = px - r.left
        const ly = py - r.top
        if (!still && lx > 0 && ly > 0 && lx < footBox.w && ly < footBox.h) {
          const d = Math.hypot(px - lastPx, py - lastPy)
          if (d > 14) {
            const steps = lastPx < -1e3 ? 1 : Math.min(6, Math.ceil(d / 24))
            for (let s2 = 1; s2 <= steps; s2++) {
              const f = s2 / steps
              pushTrail(footTrail, lastPx < -1e3 ? lx : lx - (px - lastPx) * (1 - f), lastPx < -1e3 ? ly : ly - (py - lastPy) * (1 - f), 26 + Math.min(1, d / 60) * 16, 0.6)
            }
            lastPx = px
            lastPy = py
          }
        }
        // the works blob pours down into the footer as it arrives, pools and spreads into a wide smear
        const blobs: { x: number; y: number; r: number }[] = []
        const tw = still ? 0 : tn
        const enter = still ? 1 : clamp01((vh - r.top) / Math.max(1, Math.min(footBox.h, vh * 0.6)))
        const sx = Math.min(footBox.w * 0.8, Math.max(footBox.w * 0.2, chainInit ? chain[0].x : footBox.w * 0.5))
        const poolY = footBox.h * 0.36
        const p1 = clamp01(enter / 0.45)
        const p2 = easeOut3(clamp01((enter - 0.3) / 0.7))
        if (p1 > 0 && p2 < 0.85) {
          const len = p1 * poolY
          const sr = 14 + 12 * (1 - p2 / 0.85)
          for (let y = -20; y < len; y += sr * 1.2) blobs.push({ x: sx + Math.sin(y * 0.02 + tw * 2) * 4, y, r: sr })
        }
        if (p2 > 0) {
          const spread = 30 + p2 * footBox.w * 0.5
          const n = Math.min(40, Math.max(2, Math.ceil((2 * spread) / 34)))
          for (let j = 0; j <= n; j++) {
            const u = j / n
            const bx = sx - spread + u * 2 * spread + Math.sin(tw * 0.3) * 40
            const taper = Math.sin(Math.PI * u)
            blobs.push({ x: bx, y: poolY + Math.sin(bx * 0.008 + tw * 0.8) * 12 + (u - 0.5) * 30, r: (26 + 18 * taper) * (0.7 + 0.3 * p2) })
          }
        }
        const room = 64 - blobs.length
        for (let i = footTrail.length - 1; i >= 0; i--) {
          const b = footTrail[i]
          const k = inkLife(tn - b.born, b.hold)
          if (k <= 0) {
            footTrail.splice(i, 1)
            continue
          }
          if (footTrail.length - i <= room) blobs.push({ x: b.x, y: b.y + (1 - k) * 22, r: b.r * Math.sqrt(k) })
        }
        draw(footGl, footBox, blobs.slice(0, 64), 0, [0.965, 0.83, 0], tn)
      }
    }
    raf = requestAnimationFrame(frame)

    return () => {
      alive = false
      cancelAnimationFrame(raf)
      ro.disconnect()
      window.removeEventListener("pointermove", onMove)
      // the contexts are left alive on purpose: a remount (React runs effects
      // twice in development) gets the same canvas back and must reuse them
      for (const g of [lg, inkGl, worksGl, footGl]) if (g && g.tex) g.gl.deleteTexture(g.tex)
    }
    // the copy is read once per mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skipLoader])

  return (
    <div ref={rootRef} className={"mit-root" + (className ? " " + className : "")}>
      <style>{CSS}</style>

      <header ref={heroRef} className="mit-hero" style={{ height }}>
        <div ref={loaderRef} className="mit-loader" aria-hidden="true">
          <canvas ref={loaderCanvasRef} />
        </div>
        <nav className="mit-nav" aria-label="Primary">
          <svg className="mit-x" viewBox="0 0 24 24" aria-hidden="true">
            <g fill="currentColor">
              <circle cx="12" cy="12" r="3.2" />
              <circle cx="5" cy="5" r="3" />
              <circle cx="19" cy="5" r="3" />
              <circle cx="5" cy="19" r="3" />
              <circle cx="19" cy="19" r="3" />
            </g>
          </svg>
          <svg className="mit-orb" viewBox="0 0 46 24" aria-hidden="true">
            <g fill="none" stroke="currentColor" strokeWidth="1.4">
              <ellipse cx="23" cy="12" rx="21" ry="10" />
              <ellipse cx="23" cy="12" rx="21" ry="5" />
              <line x1="2" y1="12" x2="44" y2="12" />
            </g>
          </svg>
          <div className="mit-pills">
            <a className="mit-pill" href="#mit-works">
              Work
            </a>
            <a className="mit-pill" href="#mit-about">
              Profile
            </a>
            <a className="mit-pill" href="#mit-contact">
              Contact
            </a>
          </div>
        </nav>
        <div className="mit-head">
        <h1 className="mit-mark" aria-label={name + " " + script}>
          <span ref={nameRef} className="mit-name" aria-hidden="true">
            {name}
          </span>
          <span ref={scriptRef} className="mit-script" aria-hidden="true">
            {script}
          </span>
        </h1>
        <p className="mit-tag">{tagline}</p>
        </div>
        <canvas ref={inkRef} className="mit-inkc" aria-hidden="true" />
        <img ref={gadgetRef} className="mit-gadget" src={SITE + "console.webp"} alt="" width={558} height={880} style={{ opacity: 0 }} />
        <div className="mit-cue" aria-hidden="true">
          <svg width="40" height="70" viewBox="0 0 40 70">
            <line x1="20" y1="0" x2="20" y2="44" stroke="#0d0d0d" strokeWidth="2" strokeDasharray="2 5" strokeLinecap="round" />
            <path d="M20 44 C34 48 38 60 28 66 C22 70 12 69 8 63 C3 55 9 47 20 44 Z" fill="#0d0d0d" />
          </svg>
          Scroll
        </div>
      </header>

      <section ref={reelRef} className="mit-reel" aria-label="Showreel">
        <div className="mit-reel-pin">
          <div ref={reelCardRef} className="mit-reel-card">
            <img ref={reelImgRef} src={SITE + "reel.webp"} alt="" width={1536} height={1024} />
            <div className="mit-reel-cap">
              <small>Showreel 2026</small>
              <b>Things that melt.</b>
            </div>
          </div>
        </div>
      </section>

      <section ref={aboutRef} id="mit-about" className="mit-about" aria-label="About">
        <svg className="mit-about-edge" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <path ref={edgeRef} d="M0,100 C25,15 75,15 100,100 L100,101 L0,101 Z" fill="#f6d400" />
        </svg>
        <div className="mit-about-body">
          <p className="mit-kicker">Who I am</p>
          <p className="mit-manifesto">
            {manifesto.map((l, i) => (
              <span key={i}>
                <i data-line="">{l}</i>
              </span>
            ))}
          </p>
        </div>
      </section>

      <section ref={worksRef} id="mit-works" className="mit-works" aria-label="Selected work">
        <canvas ref={worksCanvasRef} className="mit-works-c" aria-hidden="true" />
        <ul className="mit-grid">
          {works.map((w, i) => (
            <li key={i} className="mit-card" data-card="">
              <img src={w.image} alt="" width={640} height={640} loading="lazy" />
              <div className="mit-meta">
                <span>{w.title}</span>
                <span>
                  {w.kind} · {w.year}
                </span>
              </div>
              <a href={"#work-" + (i + 1)} aria-label={w.title + ", " + w.kind + ", " + w.year} />
            </li>
          ))}
        </ul>
      </section>

      <footer ref={footRef} id="mit-contact" className="mit-foot">
        <canvas ref={footCanvasRef} className="mit-foot-c" aria-hidden="true" />
        <h2 className="mit-sign">
          <b ref={signRef}>
            {signFirst.slice(0, -1)}
            <span className="mit-gl">
              {signFirst.slice(-1)}
              <img className="mit-glove" src={SITE + "glove.webp"} alt="" width={433} height={848} loading="lazy" />
            </span>
            {signRest ? " " + signRest : ""}
          </b>
        </h2>
        <div className="mit-foot-row">
          <a href={"mailto:" + email}>{email}</a>
          <span>Interfaces · Motion · Components</span>
          <span>© 2026 {name}</span>
        </div>
      </footer>
    </div>
  )
}

export default MoltenInkTemplate
