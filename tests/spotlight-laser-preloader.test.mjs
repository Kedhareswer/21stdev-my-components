// Install-safety and engine checks for spotlight-laser-preloader.
// Run: node tests/spotlight-laser-preloader.test.mjs

import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

const dir = new URL("../components/spotlight-laser-preloader/", import.meta.url)
const src = readFileSync(new URL("spotlight-laser-preloader.tsx", dir), "utf8")
const demo = readFileSync(new URL("demo.tsx", dir), "utf8")
const gate = readFileSync(new URL("demo-gate.tsx", dir), "utf8")
const custom = readFileSync(new URL("demo-custom.tsx", dir), "utf8")

// ---- 1. Install safety -----------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "react is the only import the component may have")
assert.doesNotMatch(src, /@import/, "no @import")
assert.doesNotMatch(src, /https?:\/\//, "no external assets: the capture sandbox blocks other origins")
assert.ok(src.includes('height = "100svh"'), "height defaults to a definite length")
assert.doesNotMatch(src, /className=["'][^"']*\bh-full\b/, "no h-full")
assert.ok(src.includes("prefers-reduced-motion"), "honours reduced motion")
assert.ok(src.includes('role="progressbar"'), "reports progress to assistive tech")
assert.ok(src.includes("aria-valuenow={pct}"), "progressbar carries its value")
assert.ok(src.includes("onCompleteRef.current"), "calls onComplete through a ref")
assert.doesNotMatch(src, /\}, \[[^\]]*\bonComplete\b[^\]]*\]\)/, "effects must not depend on onComplete identity")
assert.ok(src.includes("cancelAnimationFrame(raf)"), "the frame loop is torn down on unmount")
assert.ok(src.includes("ro.disconnect()"), "the resize observer is torn down on unmount")
// The UI stays clean: no buttons, inputs or HUD text in the component itself.
assert.doesNotMatch(src, /<button|<input|<select|<label/, "the component ships no on-screen controls")

// ---- 2. Scoped CSS ---------------------------------------------------------
const cssMatch = src.match(/const SLP_CSS = `([\s\S]*?)`/)
assert.ok(cssMatch, "SLP_CSS block is present")
const css = cssMatch[1]
assert.doesNotMatch(css, /\$\{|`/, "no interpolation or backticks in the CSS string")
assert.doesNotMatch(css, /^\s*(\*|body|html|:root)\s*\{/m, "no bare global resets")
assert.match(css, /\.slp-root \.slp-canvas \{[^}]*max-width: none/, "canvas overrides Preflight's max-width")
for (const match of css.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/(?<=^|[{}])\s*([^{}]+?)\s*\{/g)) {
  const sel = match[1].trim()
  if (sel.startsWith("@") || /^(from|to|[\d.]+%)/.test(sel)) continue
  assert.ok(
    sel.split(",").every((s) => s.trim().startsWith(".slp-")),
    `unscoped CSS selector would leak into the host app: ${sel}`,
  )
}
assert.ok(css.includes('[data-phase="exit"]'), "the exit fade is styled")
// the canvas side of reduced motion: no flicker, no sparks, no beam
assert.ok(src.includes("reduced ? 1 - t"), "the light fades instead of flickering under reduced motion")
assert.ok(src.includes("writing && !reduced"), "no beam or sparks under reduced motion")

// ---- 3. Engine helpers, executed -------------------------------------------
const start = src.indexOf("// #region engine")
const end = src.indexOf("// #endregion")
assert.ok(start > -1 && end > start, "engine region markers missing")
const js = src
  .slice(start, end)
  .replace(/:\s*(number\[\]\[\]|string\[\]|number|string|SlpTrace|Strokes)(?=[,)])/g, "")
  .replace(/ as SlpTrace/g, "")
const { slpFlicker, slpRelight, slpHash, slpRgb, slpLayout, slpTrace, slpTip } = await import(
  "data:text/javascript," + encodeURIComponent(js)
)

// the light: on, flickering, then out for good
assert.equal(slpFlicker(-1), 1)
assert.equal(slpFlicker(0), 1)
assert.equal(slpFlicker(1), 0)
assert.equal(slpFlicker(0.95), 0, "the lamp is dead before the flicker ends")
const levels = Array.from({ length: 200 }, (_, i) => slpFlicker(i / 200))
assert.ok(levels.every((v) => v >= 0 && v <= 1), "flicker stays in range")
let drops = 0
for (let i = 1; i < levels.length; i++) if (levels[i] < levels[i - 1] - 0.4) drops++
assert.ok(drops >= 4, `the light should stutter several times, saw ${drops}`)
assert.equal(slpRelight(0), 0)
assert.equal(slpRelight(1), 1)
assert.equal(slpRelight(0.6), 1, "relit before the light phase ends")

for (let i = 0; i < 300; i++) {
  const h = slpHash(i * 1.37)
  assert.ok(h >= 0 && h < 1, "hash stays in [0, 1)")
}

assert.deepEqual(slpRgb("#ff0000", "#000"), [255, 0, 0])
assert.deepEqual(slpRgb("#0f0", "#000"), [0, 255, 0])
assert.deepEqual(slpRgb("tomato", "#00f"), [0, 0, 255], "unparseable colours fall back")

// the layout: the default name, on a laptop and on a phone
const STROKES = { K: 3, E: 2, D: 1, H: 3, A: 2, R: 2 }
const wide = slpLayout("KEDHAR", 1280, 800)
assert.equal(wide.strokes.length, Object.values(STROKES).reduce((a, b) => a + b), "every stroke of KEDHAR is laid out")
assert.ok(wide.box.w <= 1280 * 0.8 + 1, "the name fits the width")
assert.ok(wide.size <= 800 * 0.2 + 1, "the name does not swamp the stage")
for (const s of wide.strokes) {
  for (const [x, y] of s) {
    assert.ok(x >= 0 && x <= 1280 && y >= 0 && y <= 800, "every point lands on the stage")
  }
}
const phone = slpLayout("KEDHAR", 390, 844)
assert.ok(phone.box.w <= 390 * 0.8 + 1, "the name fits a phone")
assert.equal(slpLayout("kedhar", 1280, 800).strokes.length, wide.strokes.length, "lowercase is upper-cased")
assert.equal(slpLayout("K~D", 1280, 800).strokes.length, 4, "unknown characters are skipped as spaces")
const twoWords = slpLayout("HELLO THERE", 390, 844)
const ys = new Set(twoWords.strokes.map((s) => Math.round(Math.min(...s.map((p) => p[1])) / 10)))
assert.ok(ys.size >= 2, "two words break onto two lines on a narrow screen")
assert.ok(slpLayout("KEDHAR", 10, 10).size >= 14, "never collapses below a readable size")

// every drawable character has strokes that stay in its box
for (const c of "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-.!?/'") {
  const l = slpLayout(c, 1000, 1000)
  assert.ok(l.strokes.length > 0, `glyph ${c} is drawn`)
  for (const s of l.strokes) {
    assert.ok(s.length >= 2, `glyph ${c} has no degenerate strokes`)
    for (const [, y] of s) assert.ok(y >= l.box.y - l.size * 0.08 && y <= l.box.y + l.size * 1.08, `glyph ${c} stays within its cap height`)
  }
}

// the trace: one timeline, a dwell before every stroke
const tr = slpTrace(wide.strokes, wide.size)
assert.equal(tr.starts.length, wide.strokes.length, "every stroke has a start on the timeline")
assert.ok(tr.n > 100, "strokes are chopped into short segments")
for (let i = 1; i < tr.n; i++) assert.ok(tr.u0[i] >= tr.u1[i - 1] - 1e-9, "segments run forward in time")
assert.ok(Math.abs(tr.total - tr.u1[tr.n - 1]) < 1e-9, "the timeline ends with the last segment")

const empty = slpTrace(slpLayout("   ", 800, 600).strokes, 40)
assert.equal(empty.n, 0)
assert.equal(empty.total, 0)
assert.equal(slpTip(empty, 0).done, 0, "an empty name has nothing to burn")

assert.equal(slpTip(tr, 0).done, 0, "nothing is burned at the start")
assert.equal(slpTip(tr, 0).on, false, "the beam aims before it strikes")
assert.equal(slpTip(tr, tr.total).done, tr.n, "everything is burned at the end")
assert.equal(slpTip(tr, tr.total).on, false, "the beam is off once the name is written")
let prev = 0
for (let i = 0; i <= 600; i++) {
  const t = slpTip(tr, (tr.total * i) / 600)
  const v = t.done + t.part
  assert.ok(v >= prev - 1e-9, "the burn never runs backwards")
  assert.ok(Number.isFinite(t.x) && Number.isFinite(t.y), "the tip is always somewhere")
  prev = v
}
const mid = slpTip(tr, tr.starts[1] + tr.dwell + 1)
assert.equal(mid.on, true, "the beam burns while drawing")
assert.equal(mid.done, tr.first[1], "drawing the second stroke starts at its first segment")

// ---- 4. Demos ---------------------------------------------------------------
for (const [name, d] of [["demo", demo], ["demo-gate", gate], ["demo-custom", custom]]) {
  assert.ok(d.includes('from "@/components/ui/spotlight-laser-preloader"'), `${name} imports the canonical path`)
}
assert.match(demo, /<SpotlightLaserPreloader loop \/>/, "default demo is the looping component, full bleed")
assert.doesNotMatch(demo, /<div|<button|<input/, "default demo is the preloader and nothing else")
assert.ok(gate.includes("</SpotlightLaserPreloader>"), "gate demo passes children")

console.log("spotlight-laser-preloader: ok")
