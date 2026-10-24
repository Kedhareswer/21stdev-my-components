// Install-safety, sprite and garden checks for pixel-bloom-preloader.
// Run: node tests/pixel-bloom-preloader.test.mjs

import assert from "node:assert/strict"
import { readFileSync, readdirSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const dir = new URL("../components/pixel-bloom-preloader/", import.meta.url)
const read = (f) => readFileSync(new URL(f, dir), "utf8").replace(/\r\n/g, "\n")
const src = read("pixel-bloom-preloader.tsx")

// ---- 1. Install safety -----------------------------------------------------
assert.deepEqual(
  readdirSync(dir).sort(),
  ["README.md", "demo-dusk.tsx", "demo-gate.tsx", "demo.tsx", "pixel-bloom-preloader.tsx"],
  "the folder ships the component, its demos and a README, nothing else",
)
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "react is the only import")
assert.doesNotMatch(src, /@import/, "no @import — fonts arrive by an injected link")
assert.ok(src.includes('document.createElement("link")'), "fonts arrive by an injected link")
assert.ok(src.includes("if (!fontHref)"), "fontHref={null} loads nothing")
for (const url of src.matchAll(/https?:\/\/[^"'\s)]+/g))
  assert.match(url[0], /^https:\/\/fonts\.googleapis\.com\//, "unexpected external URL: " + url[0])
assert.ok(src.includes('height = "100svh"'), "height defaults to a definite length")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")
assert.ok(src.includes("prefers-reduced-motion"), "honours reduced motion")
assert.ok(src.includes('role="progressbar"') && src.includes("aria-valuenow={pct}"), "reports progress")
assert.ok(src.includes('toggleAttribute("inert"'), "the guarded page cannot take focus under the gate")
assert.ok(src.includes("onCompleteRef.current"), "calls onComplete through a ref")
assert.doesNotMatch(src, /\}, \[[^\]]*\bonComplete\b[^\]]*\]\)/, "effects must not depend on onComplete identity")
assert.ok(src.includes("cancelAnimationFrame(raf)"), "the frame loop is torn down on unmount")
assert.ok(src.includes("ro.disconnect()"), "the resize observer is torn down")
assert.ok(src.includes("timers.forEach(clearTimeout)"), "bloom timers are torn down")
assert.doesNotMatch(src, /console\./, "no debug logging ships")
assert.doesNotMatch(src, /use(State|Ref|Memo|Callback)</, "no generic hook type arguments (the 21st CLI tokenizer hangs on them)")
const generic = src.slice(0, src.indexOf("</")).match(/Partial<|Record<|ReturnType<|React\.[A-Za-z]+</)
assert.equal(generic, null, "no generics before the first JSX close tag: " + (generic && generic[0]))

// ---- 2. Scoped CSS ---------------------------------------------------------
const css = src.match(/const PXB_CSS = `([\s\S]*?)`/)[1]
assert.doesNotMatch(css, /\$\{|`/, "no interpolation or backticks in the CSS string")
assert.match(css, /\.pxb-canvas \{[^}]*max-width: none/, "canvases override Preflight's max-width")
let rules = 0
for (const m of css.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/(?<=^|[{}])\s*([^{}]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (sel.startsWith("@") || /^(from|to|[\d.]+%)/.test(sel)) continue
  rules++
  assert.ok(sel.split(",").every((s) => s.trim().startsWith(".pxb-")), "unscoped selector: " + sel)
}
assert.ok(rules >= 20, `expected a full scoped sheet, saw ${rules} rules`)
for (const k of css.matchAll(/@keyframes ([\w-]+)/g)) assert.ok(k[1].startsWith("pxb-"), "unprefixed keyframes: " + k[1])
for (const phase of ["lift", "rest", "refill", "hold"]) assert.ok(css.includes(`[data-phase="${phase}"]`), `phase ${phase} is styled`)

// ---- 3. Garden helpers, executed ---------------------------------------------
const a = src.indexOf("// #region garden")
const b = src.indexOf("// #endregion")
assert.ok(a > -1 && b > a, "garden region missing")
const G = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(src.slice(a, b))))

// sprites: rectangular, known colours, a stem in the middle column
const COLOURS = new Set([..."YyobRrdGgl."])
for (const [kind, sprite] of Object.entries(G.PXB_SPRITES)) {
  const w = sprite.rows[0].length
  assert.ok(sprite.rows.every((r) => r.length === w), `${kind}: every row is ${w} wide`)
  assert.ok(sprite.rows.every((r) => [...r].every((c) => COLOURS.has(c))), `${kind}: only palette characters`)
  const mid = Math.floor(w / 2)
  for (let y = sprite.head; y < sprite.rows.length; y++) assert.match(sprite.rows[y][mid], /[Gg]/, `${kind}: stem runs unbroken (row ${y})`)
  const s = G.pxbParse(kind)
  assert.equal(s.px.length, sprite.rows.join("").replace(/\./g, "").length, `${kind}: every pixel parsed`)
  for (let i = 1; i < s.px.length; i++) assert.ok(s.px[i].rank >= s.px[i - 1].rank, `${kind}: sorted by growth`)
  assert.ok(s.px.every((p) => p.rank >= 0 && p.rank < 1), `${kind}: ranks in [0, 1)`)
  const stem = s.px.filter((p) => p.y >= s.head)
  const head = s.px.filter((p) => p.y < s.head)
  assert.ok(Math.max(...stem.map((p) => p.rank)) < Math.min(...head.map((p) => p.rank)), `${kind}: the stem grows before the head opens`)
  assert.equal(stem[0].y, s.h - 1, `${kind}: growth starts at the ground`)
}

// progress
assert.equal(G.pxbSimulated(-1), 0)
assert.equal(G.pxbSimulated(2), 1)
let prev = 0
for (let i = 1; i <= 400; i++) {
  const v = G.pxbSimulated(i / 400)
  assert.ok(v >= prev - 1e-9 && v <= 1, "simulated progress never runs backwards")
  prev = v
}
assert.equal(G.pxbCount(4.4), "004%")
assert.equal(G.pxbCount(250), "100%")
for (const ch of "0123456789%") assert.equal(G.PXB_DIGITS[ch].length, 5, `digit ${ch} is five rows`)

// colours
assert.equal(G.pxbShade("#000000", 1), "#ffffff")
assert.equal(G.pxbShade("#ffffff", -1), "#000000")
assert.equal(G.pxbShade("#fff", 0), "#ffffff", "short hex expands")
assert.equal(G.pxbShade("tomato", 0.5), "tomato", "non-hex passes through untouched")

// the word's split
assert.deepEqual(G.pxbSplit("outside"), { chars: [..."outsde"], at: 4 })
assert.deepEqual(G.pxbSplit("bloom"), { chars: [..."bloom"], at: 5 }, "no i: the flower ends the word")

// scatter: on the field, clear of the type and of each other, deterministic
for (const [W, H] of [[1280, 800], [390, 844], [2560, 900], [320, 320]]) {
  const avoid = [[W * 0.1, H * 0.35, W * 0.9, H * 0.65]]
  const fw = 70
  const fh = 90
  const fl = G.pxbScatter(W, H, 14, avoid, fw, fh, 7.3)
  assert.deepEqual(fl, G.pxbScatter(W, H, 14, avoid, fw, fh, 7.3), "same seed, same garden")
  for (const f of fl) {
    assert.ok(f.x - fw / 2 >= 0 && f.x + fw / 2 <= W && f.y - fh >= 0 && f.y <= H, `${W}×${H}: on screen`)
    assert.ok(!(f.x + fw / 2 > avoid[0][0] && f.x - fw / 2 < avoid[0][2] && f.y > avoid[0][1] && f.y - fh < avoid[0][3]), `${W}×${H}: clear of the type`)
    assert.ok(f.at > 0 && f.at < 1, "sprouts during the load")
    assert.ok(G.PXB_KINDS.includes(f.kind), "a known flower")
  }
}

// dissolve: ripples outward, every cell leaves exactly once
const order = G.pxbOrder(40, 25, 20, 12, 3)
assert.ok(order.every((o) => o >= 0 && o < 1), "orders in [0, 1)")
assert.ok(order[12 * 40 + 20] < order[0] && order[12 * 40 + 20] < order[24 * 40 + 39], "the bloom goes first, corners last")
assert.ok(order.every((o) => G.pxbCell(o, 0) === 3), "before the wave, all field")
assert.ok(order.every((o) => G.pxbCell(o, 1 + G.PXB_BAND) === 0), "after the wave, all gone")
assert.equal(G.pxbCell(0.5, 0.52), 1, "the leading edge flashes")

// ---- 4. Demos ---------------------------------------------------------------
for (const f of ["demo.tsx", "demo-gate.tsx", "demo-dusk.tsx"]) {
  const d = read(f)
  const di = [...d.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1]).filter((m) => m !== "react")
  assert.deepEqual(di, ["@/components/ui/pixel-bloom-preloader"], f + ": imports only the component")
  assert.doesNotMatch(d, /https?:\/\//, f + ": no external assets")
}
assert.match(read("demo.tsx"), /<PixelBloomPreloader loop \/>/, "default demo is the bare looping component")
assert.ok(read("demo-gate.tsx").includes("</PixelBloomPreloader>"), "gate demo passes children")

console.log("pixel-bloom-preloader: ok")
