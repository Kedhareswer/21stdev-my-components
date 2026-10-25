// Install-safety, paper-keying, tiling, curve, coral, order and pin-swing checks for
// components/benthos-collection-template.
// Run: node tests/benthos-collection-template.test.mjs
import assert from "node:assert/strict"
import { readFileSync, readdirSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const root = new URL("../", import.meta.url)
const dir = new URL("components/benthos-collection-template/", root)
const src = readFileSync(new URL("benthos-collection-template.tsx", dir), "utf8")
const pkg = JSON.parse(readFileSync(new URL("package.json", root), "utf8"))

// ---- install safety ------------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react", "gsap", "gsap/ScrollTrigger"], "only react and gsap")
assert.ok(pkg.dependencies?.gsap, "gsap must be declared in the root package.json")
assert.match(src, /gsap\.registerPlugin\(ScrollTrigger\)/, "ScrollTrigger is registered")
for (const f of readdirSync(dir))
  assert.ok(/^(benthos-collection-template\.tsx|demo(-[a-z0-9-]+)?\.tsx|README\.md)$/.test(f), "unexpected file in the folder: " + f)

assert.ok(src.includes('height = "100svh"'), "stage height defaults to a definite length")
assert.ok(src.includes('"--h": height'), "the height prop feeds --h")
assert.ok(src.includes(".bct-dive{position:relative;height:calc(var(--h) * 2.3)"), "the dive's scroll length comes from the height prop")
assert.ok(/\.bct-stage\{position:sticky;top:0;height:var\(--h\)/.test(src), "the stage is sticky and sized by --h, not a percentage")
assert.doesNotMatch(src, /className=["'][^"']*\bh-full\b/, "no h-full")
assert.doesNotMatch(src, /pin:\s*true/, "no ScrollTrigger pinning (it rewrites React's DOM)")
assert.ok(src.includes("ctx.revert()"), "every trigger and tween is reverted on unmount")

// Fonts: a <link> only when asked for, never an @import.
assert.doesNotMatch(src, /@import/, "no @import")
assert.ok(src.includes('{fontHref && <link rel="stylesheet" href={fontHref} />}'), "fontHref null loads nothing")

// The scoped CSS string: prefixed selectors only, no bare resets, no template holes.
const css = src.match(/const CSS = `([\s\S]*?)`/)[1].replace(/\/\*[\s\S]*?\*\//g, "")
assert.doesNotMatch(css, /\$\{/, "no ${ in the CSS string")
for (const bad of [/(^|[},])\s*\*\s*\{/, /(^|[},])\s*body\s*\{/, /:root/, /(^|[},])\s*html\s*\{/])
  assert.doesNotMatch(css, bad, "no bare resets in the CSS: " + bad)
for (const rule of css.matchAll(/(?:^|\})\s*(?!@)([^{}\s][^{}]*)\{/g)) {
  const sel = rule[1].trim()
  if (!sel || /^(from|to|\d+%)/.test(sel)) continue
  const parts = []
  let depth = 0
  let cur = ""
  for (const ch of sel) {
    if (ch === "(") depth++
    if (ch === ")") depth--
    if (ch === "," && depth === 0) {
      parts.push(cur)
      cur = ""
    } else cur += ch
  }
  parts.push(cur)
  for (const one of parts) {
    const s = one.trim()
    assert.ok(
      s.startsWith(".bct-") || s.startsWith(".is-") || s.startsWith(":where(.bct-root)") || s.startsWith(":where(.dark) .bct-root"),
      "unscoped selector: " + s,
    )
  }
}
// .is-* rules only ever qualify a .bct- element
for (const m of css.matchAll(/(?:^|\})\s*(\.is-[a-z-]+)[^{]*\{/g)) assert.match(css.slice(m.index, m.index + m[0].length), /\.is-[a-z-]+ \.bct-/, "a bare state class must scope to .bct-: " + m[0])
assert.ok(css.includes("prefers-reduced-motion"), "CSS honours reduced motion")
// GSAP owns `transform` on what it tweens; a CSS transform transition there makes a
// re-run .from() record a half-transitioned value as the resting state
for (const cls of ["bct-btn", "bct-link", "bct-stat", "bct-lic", "bct-shelf-item", "bct-fig", "bct-weed", "bct-strip-card", "bct-pinned", "bct-chipcard", "bct-swatch"])
  for (const m of css.matchAll(new RegExp("\\." + cls + "\\{[^}]*\\}", "g")))
    assert.doesNotMatch(m[0], /transition:[^;}]*\btransform\b/, cls + " must not transition transform")
// GSAP writes translate:none inline on what it tweens, so parallax lives on a child
assert.doesNotMatch(css, /\.bct-fig\{[^}]*translate:/, "no CSS translate on a GSAP-tweened figure")
assert.ok(css.includes(".bct-fig > *{translate:calc(var(--px) * 1px) calc(var(--py) * 1px)}"), "figure parallax rides on the child")
assert.ok(src.includes('setTimeout(() => reject(new Error("clipboard timeout")), 700)'), "a clipboard that never answers falls back")
assert.ok(src.includes('motion: "(prefers-reduced-motion: no-preference)"'), "GSAP choreography only runs with motion allowed")
assert.ok(src.includes("setStill(true)"), "reduced motion gets the static layout")
assert.ok(css.includes("@container"), "layout answers the component's width, not the window")
assert.ok(css.includes(":where(.dark) .bct-root"), "dark mode follows a .dark ancestor")

// Preflight: artwork, fills and plate images must not be clamped.
assert.ok(/\.bct-art\{display:block;max-width:none\}/.test(css), "artwork guards max-width")
assert.ok(/\.bct-cut\{[^}]*max-width:none/.test(css), "cut-outs guard max-width")
assert.ok(/\.bct-poster-fig img\{[^}]*max-width:none/.test(css), "the poster guards max-width")
assert.ok(/\.bct-strip-card\.is-plate img\{[^}]*max-width:none/.test(css), "strip plates guard max-width")
assert.ok(/\.bct-plate-art \.bct-art,\.bct-plate-art img\{[^}]*max-width:none/.test(css), "plate images guard max-width")
assert.ok(css.includes("--light:var(--c-paper);--dark:var(--c-ink)"), "artwork paints with fixed light/dark so it keeps its colours in dark mode")
const art = src.slice(src.indexOf("// ---- the creatures"), src.indexOf("// ---- patterns ---"))
assert.doesNotMatch(art, /var\(--paper\)|var\(--ink\)/, "creatures never use the page's inverting paper/ink")

// 21st's CLI tokenizer hangs on generics before the first JSX close tag.
const head = src.slice(0, src.indexOf("</"))
assert.doesNotMatch(head, /use(State|Ref|Memo|Callback)<|Partial<|Record<|Array<|Map<|React\.[A-Za-z]+<|\[K in /, "no generics before the JSX")

// Runtime hygiene.
for (const gone of [
  'st.removeEventListener("pointermove", onMove)', 'el.removeEventListener("pointerdown", down)', "cancelAnimationFrame(raf)",
  'window.removeEventListener("keydown", key)', "tl.kill()",
]) assert.ok(src.includes(gone), "cleanup is missing " + gone)
assert.ok(src.includes("navigator.clipboard?.writeText"), "copies with the clipboard API")
// artwork pipeline: fetched CORS-readable, keyed off the main thread, cached, with a drawn fallback
assert.ok(src.includes('fetch(art.src, { mode: "cors", credentials: "omit" })'), "the worker fetches plates with CORS")
assert.ok(src.includes('img.crossOrigin = "anonymous"'), "the main-thread fallback reads images cross-origin")
assert.ok(src.includes("new Worker(url)") && src.includes("keyPaper.toString()"), "keying runs in a worker built from keyPaper's own source")
assert.ok(src.includes('typeof OffscreenCanvas === "undefined"'), "no OffscreenCanvas falls back to the main thread")
assert.ok(src.includes("w.onerror"), "a worker refused by CSP falls back too")
assert.ok(src.includes("if (cuts[k] !== undefined) return cuts[k]"), "cut-outs are cached per page")
assert.ok(/return <Creature kind=\{kind\} mode="wash"/.test(src), "a missing or blocked plate shows the drawn creature")
assert.ok(src.includes('artMode === "plates"'), "artMode drawn skips the network")
assert.ok(src.includes("onError={() => setFailed(true)}"), "a plate that fails falls back to its drawing")
assert.ok(src.includes("setTimeout(() => setHeroReady(true), 3200)"), "the hero never waits on the network for long")
assert.ok(src.includes('document.execCommand("copy")'), "and falls back where it is blocked")
assert.ok(src.includes('e.key === "Escape"'), "Esc closes the lightbox")
assert.ok(src.includes('role="dialog" aria-modal="true"'), "the lightbox is a dialog")
assert.ok(src.includes('role="radiogroup"'), "patterns are a radio group")
assert.ok(/useId\(\)/.test(src), "ids are per instance")
for (const m of src.matchAll(/https?:\/\/([a-z0-9.-]+)\//g))
  assert.ok(["fonts.googleapis.com", "www.w3.org", "upload.wikimedia.org", "instagram.com", "pinterest.com", "www.behance.net"].includes(m[1]), "unexpected host " + m[1])
// Wikimedia only serves fixed thumbnail widths; anything else is a 400
for (const m of src.matchAll(/\/(\d+)px-[^"]+"/g)) assert.ok(["500", "960", "1280"].includes(m[1]), "unserved Wikimedia thumbnail width " + m[1])
assert.ok(src.includes("CC BY 4.0"), "CC BY plates are credited")
assert.ok(src.includes("{credits && artMode === \"plates\" && <p className=\"bct-foot-credits\">{credits}</p>}"), "credits show in the footer")

// ---- the lifted logic ---------------------------------------------------------------
const region = (name) => {
  const start = src.indexOf("// #region " + name)
  const end = src.indexOf("// #endregion", start)
  assert.ok(start > -1 && end > start, name + " region markers missing")
  return src.slice(start, end)
}
const lift = (names, exports) =>
  import(
    "data:text/javascript," +
      encodeURIComponent(stripTypeScriptTypes(names.map(region).join("\n")) + "\nexport { " + exports + " }")
  )

{
  const C = await lift(["curves"], "smoothPath, ribbon, rng, tendril, spiral, polar")
  const pts = [[0, 0], [100, 0], [200, 80], [300, 80]]
  const open = C.smoothPath(pts, false)
  assert.match(open, /^M0,0(C[-\d.]+,[-\d.]+ [-\d.]+,[-\d.]+ [-\d.]+,[-\d.]+){3}$/, "one cubic per segment, open")
  assert.ok(open.endsWith("300,80"), "ends on the last point")
  const closed = C.smoothPath(pts, true)
  assert.match(closed, /Z$/, "closed")
  assert.equal((closed.match(/C/g) || []).length, 4, "a closed path has one cubic per point")
  assert.equal(C.smoothPath([[1, 1]], true), "", "one point draws nothing")
  assert.doesNotMatch(open + closed, /NaN|Infinity/)

  const rib = C.ribbon([[0, 0], [50, 0], [100, 0]], (t) => 20 * (1 - t) + 2)
  assert.match(rib, /^M[-\d.]+,[-\d.]+C.*Z$/, "a ribbon is a closed outline")
  const ys = [...rib.matchAll(/(-?[\d.]+),(-?[\d.]+)/g)].map((m) => +m[2])
  assert.ok(Math.max(...ys) <= 15 && Math.min(...ys) >= -15, "never wider than the profile (control points may overshoot a little)")
  assert.deepEqual(C.ribbon([[0, 0], [50, 0], [100, 0]], () => 4), C.ribbon([[0, 0], [50, 0], [100, 0]], () => 4), "deterministic")

  const a = C.rng(7)
  const b = C.rng(7)
  for (let i = 0; i < 50; i++) {
    const x = a()
    assert.equal(x, b(), "seeded")
    assert.ok(x >= 0 && x < 1)
  }
  assert.notEqual(C.rng(1)(), C.rng(2)(), "different seeds differ")

  const t = C.tendril(0, 0, Math.PI / 2, 100, 0.4, 1, 0.5, 3)
  assert.equal(t.length, 27, "steps + 1 points")
  assert.deepEqual(t[0], [0, 0], "starts at the base")
  assert.ok(t[t.length - 1][1] > 40, "walks mostly in its heading")
  let len = 0
  for (let i = 1; i < t.length; i++) len += Math.hypot(t[i][0] - t[i - 1][0], t[i][1] - t[i - 1][1])
  assert.ok(len < 100 && len > 60, "the tip steps shorten, so it is shorter than its nominal length: " + len)
  assert.deepEqual(C.tendril(0, 0, 0, 50, 0, 0, 0, 9), C.tendril(0, 0, 0, 50, 0, 0, 0, 9), "deterministic")

  const sp = C.spiral(0, 0, 1, 0.2, 0, Math.PI * 2, 10)
  assert.equal(sp.length, 11)
  assert.ok(Math.hypot(...sp[10]) > Math.hypot(...sp[0]) * 3, "grows outward")
  const star = C.polar(0, 0, (th) => 10 + 5 * Math.cos(5 * th), 50)
  assert.equal(star.length, 50)
  for (const [x, y] of star) assert.ok(Math.hypot(x, y) <= 15.01 && Math.hypot(x, y) >= 4.99)
}

{
  const T = await lift(["curves", "coral"], "growTree, SEA_FAN, RED_CORAL")
  const fan = T.growTree(7, T.SEA_FAN)
  assert.ok(fan.length > 120 && fan.length < 2000, "a sea fan has a lattice of branches: " + fan.length)
  assert.deepEqual(T.growTree(7, T.SEA_FAN), fan, "deterministic for a seed")
  assert.notDeepEqual(T.growTree(8, T.SEA_FAN), fan, "another seed grows another fan")
  for (const s of fan) {
    assert.ok([s.x1, s.y1, s.x2, s.y2, s.w].every(Number.isFinite))
    assert.ok(s.d >= 0 && s.d < T.SEA_FAN.depth)
    assert.ok(s.y2 < 40, "grows up from the holdfast, never far below it")
  }
  const widths = new Map()
  for (const s of fan) widths.set(s.d, s.w)
  for (let d = 1; d < T.SEA_FAN.depth; d++) assert.ok(widths.get(d) < widths.get(d - 1), "branches thin with depth")
  assert.equal(fan[0].x1, 0)
  assert.equal(fan[0].y1, 0)
  const coral = T.growTree(9, T.RED_CORAL)
  assert.ok(coral.length > 20 && coral.length < 200, "branching coral is sparser: " + coral.length)
  assert.ok(coral[0].w > fan[0].w, "and thicker")
}

{
  const K = await lift(["key"], "keyPaper, cropRect")
  // a 60×40 cream page with a dark disc in the middle, a pale highlight inside it,
  // and a small dark speck in a corner
  const W = 60
  const H = 40
  const img = () => {
    const px = new Uint8ClampedArray(W * H * 4)
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        const i = (y * W + x) * 4
        const d = Math.hypot(x - 30, y - 20)
        let c = [240, 232, 214]
        if (d < 12) c = [60, 70, 80]
        if (d < 3) c = [238, 230, 212]
        if (x >= 2 && x < 4 && y >= 2 && y < 4) c = [40, 40, 40]
        px.set([...c, 255], i)
      }
    return px
  }
  const a = (px, x, y) => px[(y * W + x) * 4 + 3]
  const px = img()
  const paper = K.keyPaper(px, W, H, {})
  assert.deepEqual(paper, [240, 232, 214], "finds the paper colour on the border")
  assert.equal(a(px, 0, 0), 0, "paper is transparent")
  assert.equal(a(px, 30, 12), 255, "ink is opaque")
  assert.equal(a(px, 30, 20), 255, "a paper-coloured highlight inside the drawing is kept")
  assert.equal(a(px, 2, 2), 0, "specks are dropped")
  for (let i = 3; i < px.length; i += 4) assert.ok(px[i] === 0 || px[i] === 255 || (px[i] > 0 && px[i] < 255))
  const holes = img()
  K.keyPaper(holes, W, H, { holes: 0.001 })
  assert.equal(a(holes, 30, 20), 0, "with holes set, an enclosed paper pocket is keyed")
  const duo = img()
  K.keyPaper(duo, W, H, { duotone: ["#000000", "#ff0000"] })
  const k = (20 * W + 22) * 4
  assert.ok(duo[k] > 0 && duo[k + 1] === 0 && duo[k + 2] === 0, "duotone maps luminance onto the two inks")
  // the same input twice gives the same output
  const x1 = img()
  const x2 = img()
  K.keyPaper(x1, W, H, { holes: 0.001 })
  K.keyPaper(x2, W, H, { holes: 0.001 })
  assert.deepEqual(x1, x2, "deterministic")

  const r = K.cropRect(1000, 500, [0.1, 0.2, 0.5, 0.8], 200)
  assert.deepEqual([r.sx, r.sy, r.sw, r.sh].map(Math.round), [100, 100, 400, 300])
  assert.equal(r.w, 200, "the longest side is held to max")
  assert.equal(r.h, 150)
  assert.deepEqual(K.cropRect(300, 200, undefined, 900), { sx: 0, sy: 0, sw: 300, sh: 200, w: 300, h: 200 }, "never upscales")
  const c = K.cropRect(100, 100, [0.9, 0.9, 1.4, 1.4], 50)
  assert.ok(c.sx + c.sw <= 100 && c.sy + c.sh <= 100, "crops clamp to the image")
}

{
  const T = await lift(["tiles"], "wrapOffsets")
  assert.deepEqual(T.wrapOffsets(50, 50, 10, 100, 100), [[0, 0]], "an item well inside is drawn once")
  assert.deepEqual(T.wrapOffsets(5, 50, 10, 100, 100), [[0, 0], [100, 0]], "over the left edge, drawn again on the right")
  assert.equal(T.wrapOffsets(5, 95, 10, 100, 100).length, 4, "over a corner, drawn four times")
  for (const [dx, dy] of T.wrapOffsets(98, 2, 6, 100, 80)) assert.ok(Math.abs(dx) <= 100 && Math.abs(dy) <= 80)
  // every canvas tile item names a cut-out the template fetches
  const order = src.match(/const ART_ORDER = \[([^\]]+)\]/)[1]
  const tiles = src.slice(src.indexOf("const CANVAS_TILES"), src.indexOf("const tileCache"))
  for (const m of tiles.matchAll(/art: "([a-zA-Z]+)"/g)) assert.ok(order.includes('"' + m[1] + '"'), "tile uses an unfetched cut-out " + m[1])
  for (const key of ["reef-toile", "night-reef", "shell-toss", "octopus-slate", "kelp-garden", "starfish-dot"]) {
    assert.ok(tiles.includes('"' + key + '"'), "canvas tile missing: " + key)
    assert.equal(src.split('"' + key + '": {\n    w: ').length - 1, 2, "needs a canvas tile and a drawn fallback tile: " + key)
  }
}

{
  const O = await lift(["order"], "seatMultiplier, orderTotal, roman")
  assert.deepEqual([1, 5, 20, 100].map(O.seatMultiplier), [1, 2.4, 5, 9])
  assert.equal(O.seatMultiplier(3), 1, "between tiers rounds down")
  assert.equal(O.orderTotal(49, 1), 49)
  assert.equal(O.orderTotal(49, 5), 118)
  assert.equal(O.orderTotal(129, 100), 1161)
  for (const p of [29, 49, 129]) for (const s of [1, 5, 20]) assert.ok(O.orderTotal(p, s) < O.orderTotal(p, s * 5), "more seats never cost less")
  assert.deepEqual([1, 2, 3, 4, 5, 6, 9, 10, 14].map(O.roman), ["I", "II", "III", "IV", "V", "VI", "IX", "X", "XIV"])
}

{
  const P = await lift(["pins"], "pinAngle, swingTo")
  assert.equal(P.pinAngle(0, 0, 0, 10), 0, "straight down is zero")
  assert.ok(P.pinAngle(0, 0, 10, 10) > 0, "right of the pin is positive")
  assert.ok(P.pinAngle(0, 0, -10, 10) < 0, "left is negative")
  assert.equal(P.swingTo(2, 10, 10), 2, "no movement keeps the rest tilt")
  assert.ok(P.swingTo(0, 0, 20) < 0, "dragging the hanging edge right turns the card anticlockwise")
  assert.equal(P.swingTo(0, 0, 90), -38, "clamped to the limit")
  assert.equal(P.swingTo(0, 0, -90, 20), 20, "custom limit")
  assert.equal(P.swingTo(0, 170, -170), -20, "wraps across ±180")
}

// ---- demos -----------------------------------------------------------------------------
for (const f of readdirSync(dir).filter((f) => f.startsWith("demo"))) {
  const demo = readFileSync(new URL(f, dir), "utf8")
  const di = [...demo.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
  assert.deepEqual(di, ["@/components/ui/benthos-collection-template"], f + " imports only the installed path")
  assert.ok(demo.includes('className="w-full"'), f + ": wrapper keeps full width")
}

const tsconfig = readFileSync(new URL("tsconfig.json", root), "utf8")
assert.ok(tsconfig.includes('"@/components/ui/benthos-collection-template"'), "tsconfig paths line missing")

console.log("benthos-collection-template: ok")
