// Install-safety, wiring and dot-matrix logic check for components/led-status-sign.
// Run: node tests/led-status-sign.test.mjs
import assert from "node:assert/strict"
import { readFileSync, readdirSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const dir = new URL("../components/led-status-sign/", import.meta.url)
const src = readFileSync(new URL("led-status-sign.tsx", dir), "utf8")

// ---- 1. Install safety -----------------------------------------------------
// 21st ships this file alone.
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "the only import may be react")
assert.deepEqual(
  readdirSync(dir).sort(),
  ["README.md", "demo-custom.tsx", "demo-desk.tsx", "demo.tsx", "led-status-sign.tsx"],
  "folder holds the component, its demos and a README — nothing else",
)
for (const demo of ["demo.tsx", "demo-custom.tsx", "demo-desk.tsx"]) {
  const d = readFileSync(new URL(demo, dir), "utf8")
  assert.ok(d.includes('from "@/components/ui/led-status-sign"'), `${demo} imports the installer path`)
  assert.match(d, /export default function \w*Demo\w*/, `${demo} default-exports a Demo`)
}
const tsconfig = readFileSync(new URL("../tsconfig.json", import.meta.url), "utf8")
assert.ok(tsconfig.includes('"@/components/ui/led-status-sign": ["./components/led-status-sign/led-status-sign.tsx"]'), "tsconfig paths line")

assert.ok(src.includes('height = "100svh"'), "root height must default to a definite length")
assert.doesNotMatch(src, /className=\{?["'][^"']*\bh-full\b/, "no h-full")
assert.doesNotMatch(src, /@import/, "no @import")
assert.doesNotMatch(src, /https?:\/\//, "nothing is fetched: the housing is CSS + SVG, the matrix is painted")

// ---- 2. Scoped CSS ---------------------------------------------------------
const cssMatch = src.match(/const LSS_CSS = `([\s\S]*?)`/)
assert.ok(cssMatch, "LSS_CSS block is present")
const css = cssMatch[1]
assert.doesNotMatch(css, /\$\{|`/, "no interpolation or backticks in the CSS string")
assert.doesNotMatch(css, /^\s*(\*|body|html|:root)\s*[,{]/m, "no bare global resets")
assert.match(css, /\.lss-panel canvas \{[^}]*max-width: none/, "canvases override Preflight's max-width")
assert.match(css, /\.lss-base \{[^}]*max-width: none/, "the base SVG overrides Preflight's max-width")
let rules = 0
for (const match of css.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/(?<=^|[{}])\s*([^{}]+?)\s*\{/g)) {
  const sel = match[1].trim()
  if (sel.startsWith("@") || /^(from|to|[\d.]+%)/.test(sel)) continue
  rules++
  for (const part of sel.split(",")) {
    assert.ok(/^(:where\(\.dark\) )?\.lss-/.test(part.trim()), `unscoped CSS selector would leak into the host app: ${part}`)
  }
}
assert.ok(rules >= 30, `expected a full scoped sheet, saw ${rules} rules`)
assert.ok(css.includes("prefers-reduced-motion"), "CSS honours reduced motion")

// ---- 3. Runtime wiring -----------------------------------------------------
assert.ok(src.includes("Math.min(window.devicePixelRatio || 1, 2)"), "cap DPR at 2")
assert.ok(src.includes('"visibilitychange"') && src.includes("document.hidden"), "pause while the tab is hidden")
assert.ok(src.includes("new IntersectionObserver("), "pause while off screen")
assert.ok(src.includes('matchMedia("(prefers-reduced-motion: reduce)")'), "reads reduced motion")
assert.ok(src.includes('transition: reduced ? "cut" : transition'), "reduced motion: transitions cut")
assert.ok(src.includes('s.effect === "blink" && !reduced') && src.includes('s.effect === "pulse" && !reduced'), "reduced motion: no blink, no pulse")
assert.ok(src.includes("tilt && !reduced"), "reduced motion: no lean")
assert.ok(src.includes('addEventListener("wheel", onWheel, { passive: false })'), "the dial takes the wheel without scrolling the page")
assert.ok(src.includes('role="spinbutton"') && src.includes("aria-valuetext={spoken}"), "the panel is a keyboard-reachable spinbutton")
assert.ok(src.includes('aria-live="polite"'), "status changes are announced")
assert.ok(src.includes("aria-pressed={on}"), "the power bar reports its state")
assert.ok(src.includes('e.key === "Escape"') && src.includes("finishEdit(false)"), "Escape cancels an edit")
for (const gone of [
  "cancelAnimationFrame(raf)", "ro.disconnect()", "io.disconnect()",
  'document.removeEventListener("visibilitychange", onVisibility)',
  'knob.removeEventListener("wheel", onWheel)', "window.clearInterval(id)",
]) {
  assert.ok(src.includes(gone), `cleanup is missing ${gone}`)
}

// ---- 4. The matrix, lifted out of the component -----------------------------
const start = src.indexOf("// #region matrix")
const end = src.indexOf("// #endregion", start)
assert.ok(start > -1 && end > start, "matrix region markers missing")
const names = "FONT, ICONS, GLYPH_H, glyphRows, resolveIcon, composeMessage, placements, blit, mixFrames, hexToRgb, resolvePalette, PALETTES"
const m = await import(
  "data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(src.slice(start, end)) + "\nexport { " + names + " }")
)

// Font: every glyph is a clean rectangle of 7 rows, and the alphabet is complete.
for (const ch of "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 !?.,:-+/'") assert.ok(m.FONT[ch], `font is missing ${JSON.stringify(ch)}`)
for (const [ch, g] of Object.entries(m.FONT)) {
  const rows = g.split("/")
  assert.equal(rows.length, 7, `${ch}: 7 rows`)
  assert.ok(rows.every((r) => r.length === rows[0].length && /^[.#]+$/.test(r)), `${ch}: ragged or dirty rows`)
}
assert.equal(m.GLYPH_H, 9, "top and bottom strokes are doubled")
assert.equal(m.glyphRows("a").join(), m.glyphRows("A").join(), "lowercase draws as capitals")
assert.equal(m.glyphRows("é").join(), m.glyphRows("?").join(), "unknown characters show as ?")

// Icons: rectangles, no taller than 11, so they fit a 13-row panel with a margin.
for (const [name, g] of Object.entries(m.ICONS)) {
  const rows = g.split("/")
  assert.ok(rows.length >= 7 && rows.length <= 11, `${name}: ${rows.length} rows`)
  assert.ok(rows.every((r) => r.length === rows[0].length && /^[.#]+$/.test(r)), `${name}: ragged or dirty rows`)
}
assert.equal(m.resolveIcon(null), null)
assert.equal(m.resolveIcon("nope"), null, "unknown icon names draw nothing")
assert.deepEqual(m.resolveIcon(["#.#", ".#."]), ["#.#", ".#."], "custom bitmaps pass through")

// Composition: icon + 3-dot gap + glyphs with 1-dot spacing, tagged apart, nothing outside the box.
{
  const rows = 13
  const bm = m.composeMessage("ON CALL", m.resolveIcon("mic"), rows)
  const widths = [..."ON CALL"].map((c) => m.glyphRows(c)[0].length)
  assert.equal(bm.w, 9 + 3 + widths.reduce((a, b) => a + b, 0) + widths.length - 1)
  assert.equal(bm.h, rows)
  assert.equal(bm.bits.length, bm.w * rows)
  const tags = new Set([...bm.tag].filter(Boolean))
  assert.deepEqual([...tags].sort(), [1, 2], "text and icon dots are tagged apart")
  for (let i = 0; i < bm.bits.length; i++) assert.ok(bm.bits[i] ? bm.tag[i] : !bm.tag[i], "tag without a dot")
  // Text sits in rows 2..10 of 13; nothing in the top/bottom two text-free rows except the icon.
  for (let x = 12; x < bm.w; x++) {
    for (const y of [0, 1, 11, 12]) assert.equal(bm.bits[y * bm.w + x], 0, `text leaks into row ${y}`)
  }
  assert.equal(m.composeMessage("", null, 13).w, 0, "empty message is empty")
  assert.equal(m.composeMessage("", m.resolveIcon("rec"), 13).w, 9, "icon alone has no gap")
  const tiny = m.composeMessage("HI", null, 5)
  assert.equal(tiny.bits.length, tiny.w * 5, "short panels crop instead of overflowing")
}

// Placement: centred when it fits, a seamless whole-dot marquee when it does not.
{
  const cols = 64
  assert.deepEqual(m.placements(40, cols, "auto", 3, 16, false), [12])
  assert.deepEqual(m.placements(40, cols, "blink", 3, 16, false), [12], "blink holds still")
  assert.equal(m.placements(40, cols, "scroll", 0, 16, false).length, 2, "scroll forces a marquee")
  const w = 100
  const period = w + Math.round(cols / 3)
  for (let t = 0; t < 30; t += 0.05) {
    const xs = m.placements(w, cols, "auto", t, 16, false)
    assert.equal(xs.length, 2)
    assert.equal(xs[0] - xs[1], period, "the two copies are one period apart")
    assert.ok(xs.every(Number.isInteger), "the marquee steps whole dots")
    assert.ok(xs[0] <= cols && xs[0] > cols - period, "the lead copy stays in its window")
  }
  assert.deepEqual(m.placements(w, cols, "auto", 0, 16, true), m.placements(w, cols, "auto", 1, 16, true), "reduced motion pages, it does not crawl")
  assert.notDeepEqual(m.placements(w, cols, "auto", 0, 16, true), m.placements(w, cols, "auto", 3, 16, true), "reduced motion still pages")
  assert.deepEqual(m.placements(80, cols, "edit", 0, 16, false), [cols - 2 - 80], "editing shows the tail of a long draft")
}

// Blit: clips at the panel edge, keeps the brighter value, levels per tag.
{
  const cols = 20
  const rows = 13
  const out = new Float32Array(cols * rows)
  const bm = m.composeMessage("A", m.resolveIcon("rec"), rows)
  m.blit(out, cols, rows, bm, -5, 0.5, 1)
  m.blit(out, cols, rows, bm, 15, 0.5, 1)
  assert.ok(out.every((v) => v === 0 || v === 0.5 || v === 1))
  assert.ok(out.some((v) => v === 0.5) && out.some((v) => v === 1))
}

// Transitions: every kind starts on frame a and lands on frame b.
{
  const cols = 32
  const rows = 13
  const a = new Float32Array(cols * rows)
  const b = new Float32Array(cols * rows)
  m.blit(a, cols, rows, m.composeMessage("ON", null, rows), 2)
  m.blit(b, cols, rows, m.composeMessage("OFF", null, rows), 4)
  const out = new Float32Array(cols * rows)
  for (const kind of ["roll", "wipe", "dissolve", "cut"]) {
    m.mixFrames(a, b, out, cols, rows, 1, kind)
    assert.deepEqual([...out], [...b], `${kind} lands on b`)
    if (kind !== "cut") {
      m.mixFrames(a, b, out, cols, rows, 0, kind)
      assert.deepEqual([...out], [...a], `${kind} starts on a`)
      m.mixFrames(a, b, out, cols, rows, 0.5, kind)
      assert.ok(out.every((v) => Number.isFinite(v) && v >= 0 && v <= 1), `${kind} stays in range`)
      assert.notDeepEqual([...out], [...a], `${kind} has moved by halfway`)
    }
  }
  // Roll: the left edge leads the right.
  m.mixFrames(a, b, out, cols, rows, 0.4, "roll")
  const settled = (x) => [...Array(rows).keys()].every((y) => out[y * cols + x] === b[y * cols + x])
  assert.ok(!settled(cols - 1) || settled(0), "columns roll left to right")
}

// Colour.
assert.deepEqual(m.hexToRgb("#fff"), [1, 1, 1], "short hex expands")
assert.deepEqual(m.hexToRgb("#e0222c").map((v) => Math.round(v * 255)), [224, 34, 44])
assert.deepEqual(m.hexToRgb("nope"), [0, 0, 0], "junk falls back to black, not NaN")
assert.deepEqual(m.resolvePalette(undefined), m.resolvePalette("crimson"), "crimson is the default")
assert.deepEqual(m.resolvePalette("nope"), m.resolvePalette("crimson"), "unknown names fall back")
assert.deepEqual(m.resolvePalette({ lit: "#000", dim: "#fff" }), { lit: [0, 0, 0], dim: [1, 1, 1] }, "custom pairs")
for (const name of Object.keys(m.PALETTES)) {
  const p = m.resolvePalette(name)
  assert.ok([...p.lit, ...p.dim].every((v) => v >= 0 && v <= 1), `${name} in range`)
  assert.ok(p.lit.reduce((a, b) => a + b) > p.dim.reduce((a, b) => a + b), `${name}: lit is brighter than dim`)
}

console.log("led-status-sign: ok")
