// Runnable check for the breath, glyph and outline math in
// components/engraved-ticket, plus the install-safety rules the .tsx has to keep.
// Run: node tests/engraved-ticket.test.mjs
//
// The plates are canvas and cannot be asserted here. What can — and what breaks
// silently — is everything around them: a breath index that never advances
// never fires onBreath, a glyph missing from the table prints as a hole in the
// headline, and a hole contour wound the same way as its outline fills in the
// counter of every B, O and R without a single error.
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

const src = readFileSync(
  new URL("../components/engraved-ticket/engraved-ticket.tsx", import.meta.url),
  "utf8",
)

const start = src.indexOf("// #region ticket")
const end = src.indexOf("// #endregion")
assert.ok(start > -1 && end > start, "ticket region markers missing")

let js = src.slice(start, end)
for (const t of [
  ": Record<string, { w: number; c: string[]; h?: string[] }>",
  ": { glyphs: { ch: string; x: number; w: number }[]; width: number }",
  ": { value: number; phase: number; left: number; index: number }",
  ": { ch: string; x: number; w: number }[]",
  ": { x: number; w: number }[]",
  ": (() => number)",
]) {
  js = js.split(t).join("")
}
js = js.replace(/:\s*(number\[\]\[\]|number\[\]|number|string|boolean)(?!\w)/g, "")
const T = await import("data:text/javascript," + encodeURIComponent(js))
const { breathAt, letterBreath, ticketPath, barcode, GLYPHS, layoutWord, glyphPath, contourPath, parseContour } = T

// ---- breathing -------------------------------------------------------------
{
  const r = [4, 2, 6, 1]
  assert.deepEqual(breathAt(0, r), { value: 0, phase: 0, left: 4, index: 0 }, "a breath starts empty")
  assert.equal(breathAt(4, r).phase, 1, "inhale gives way to hold")
  assert.equal(breathAt(4.5, r).value, 1, "and hold is full")
  assert.equal(breathAt(6.001, r).phase, 2, "then exhale")
  assert.equal(breathAt(12.5, r).value, 0, "and rest is empty")
  assert.equal(breathAt(13, r).index, 1, "a whole cycle advances the count")
  assert.equal(breathAt(13 * 7 + 1, r).index, 7, "and keeps counting")
  // The value is continuous across every boundary: a jump is a visible snap
  // of the whole headline.
  let prev = breathAt(0, r).value
  for (let t = 0.01; t < 40; t += 0.01) {
    const b = breathAt(t, r)
    assert.ok(b.value >= 0 && b.value <= 1, "value left [0,1] at " + t)
    assert.ok(Math.abs(b.value - prev) < 0.02, "value jumped at " + t)
    assert.ok(b.left >= 0, "negative countdown at " + t)
    prev = b.value
  }
  // A zero hold must not divide by zero; a nonsense rhythm must not produce NaN.
  for (const bad of [[4, 0, 4, 0], [0, 0, 0, 0], [-1, -1, -1, -1], [NaN, 2, 2, 2], []]) {
    for (const t of [0, 1, 3.9, 4, 7, 100, NaN, -3]) {
      const b = breathAt(t, bad)
      assert.ok(Number.isFinite(b.value) && Number.isFinite(b.left), "non-finite for " + bad + " at " + t)
      assert.ok(b.phase >= 0 && b.phase <= 3, "phase out of range")
    }
  }
}

// ---- the letters inhale in order and all arrive -----------------------------
{
  for (const n of [1, 3, 7, 12]) {
    for (let i = 0; i < n; i++) {
      assert.equal(letterBreath(1, i, n, 0.07), 1, "letter " + i + " of " + n + " must reach full")
      assert.equal(letterBreath(0, i, n, 0.07), 0, "and start empty")
    }
    for (let v = 0.05; v < 1; v += 0.05) {
      for (let i = 1; i < n; i++) {
        assert.ok(letterBreath(v, i, n, 0.07) <= letterBreath(v, i - 1, n, 0.07), "letters must fill left to right")
      }
    }
  }
}

// ---- the face ---------------------------------------------------------------
{
  for (const ch of "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.,-!?'") {
    assert.ok(GLYPHS[ch], "glyph " + ch + " is missing")
    const g = GLYPHS[ch]
    for (const c of [...g.c, ...(g.h || [])]) {
      for (const [x, y, r] of parseContour(c)) {
        assert.ok(Number.isFinite(x) && Number.isFinite(y), ch + " has a bad point")
        assert.ok(x >= 0 && x <= g.w, ch + " spills out of its advance: x=" + x)
        assert.ok(y >= 0 && y <= 115, ch + " spills out of its line: y=" + y)
        assert.ok(r === undefined || r >= 0, ch + " has a negative radius")
      }
    }
    assert.ok(/^M[\d. LQZM-]+Z$/.test(glyphPath(ch)), ch + " produced bad path data")
  }
  // Signed area (shoelace) of a contour as drawn. Holes must wind opposite to
  // outlines, or nonzero fill paints straight over every counter.
  const area = (d) => {
    const pts = [...d.matchAll(/[ML]([\d.-]+) ([\d.-]+)/g)].map((m) => [Number(m[1]), Number(m[2])])
    let a = 0
    for (let i = 0; i < pts.length; i++) {
      const [x1, y1] = pts[i]
      const [x2, y2] = pts[(i + 1) % pts.length]
      a += x1 * y2 - x2 * y1
    }
    return a / 2
  }
  for (const [ch, g] of Object.entries(GLYPHS)) {
    for (const c of g.c) assert.ok(area(contourPath(c, false)) > 0, ch + " outline winds the wrong way")
    for (const c of g.h || []) assert.ok(area(contourPath(c, true)) < 0, ch + " hole winds the same way as its outline")
  }

  const w = layoutWord("breathe")
  assert.equal(w.glyphs.map((g) => g.ch).join(""), "BREATHE", "the word is set in capitals")
  assert.equal(w.glyphs[0].x, 0, "it starts at the origin")
  const last = w.glyphs[w.glyphs.length - 1]
  assert.equal(w.width, last.x + last.w, "no trailing tracking on the last letter")
  for (let i = 1; i < w.glyphs.length; i++) {
    assert.ok(w.glyphs[i].x >= w.glyphs[i - 1].x + w.glyphs[i - 1].w, "letters overlap")
  }
  assert.equal(layoutWord("").width, 0, "an empty word is empty")
  assert.ok(layoutWord("AÉB").glyphs.length === 3, "an unknown letter is a gap, not a crash")
  assert.equal(glyphPath("É"), "", "and draws nothing")
}

// ---- the stub outline -------------------------------------------------------
{
  const d = ticketPath(1200, 460, 34, 0)
  assert.ok(d.startsWith("M34 0") && d.endsWith("Z"), "outline starts after the top-left notch")
  assert.equal((d.match(/A/g) || []).length, 4, "four punched corners")
  // Concave: sweep flag 0 on every arc. A 1 there bulges the corner outward
  // and the ticket becomes a rounded rectangle.
  for (const m of d.matchAll(/A[\d.]+ [\d.]+ 0 0 (\d)/g)) assert.equal(m[1], "0", "corners must be concave")
  const inset = ticketPath(1200, 460, 34, 10)
  const nums = inset.match(/[\d.]+/g).map(Number)
  assert.ok(Math.min(...nums) >= 0 && Math.max(...nums) <= 1200, "inset outline stays on the ticket")
  assert.ok(inset.startsWith("M44 10"), "the inset is a true offset: the arc grows by the inset")
}

// ---- the barcode -------------------------------------------------------------
{
  const a = barcode("BREATHE-7", 150)
  assert.deepEqual(a, barcode("BREATHE-7", 150), "same text, same bars")
  assert.notDeepEqual(a, barcode("BREATHE-8", 150), "different text, different bars")
  assert.ok(a.length > 20, "enough bars to read as a barcode")
  for (let i = 0; i < a.length; i++) {
    assert.ok(a[i].x + a[i].w <= 150, "bar runs out of the box")
    if (i) assert.ok(a[i].x > a[i - 1].x + a[i - 1].w, "bars must not touch")
  }
  assert.ok(barcode("", 150).length > 0, "an empty code still prints")
}

// ---- install safety ----------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "the only import may be react")

const code = src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1")
assert.doesNotMatch(code, /@import/, "no @import — the host owns Tailwind and fonts")
assert.doesNotMatch(code, /^\s*(\*|body|:root|html)\s*{/m, "no bare global resets")
assert.doesNotMatch(code, /[`]/, "no backticks — build CSS strings with concatenation")
assert.doesNotMatch(code, /\$\{/, "no template interpolation anywhere near the CSS")
assert.doesNotMatch(code, /https?:\/\/(?!www\.w3\.org)/, "nothing is fetched: the capture sandbox blocks other origins")
assert.doesNotMatch(code, /innerWidth|innerHeight|scrollY/, "size from the element, not the window")

// Sized by width and an aspect ratio. A percentage height on the root collapses
// wherever the host page has no height chain.
assert.ok(/aspectRatio: VIEW_W \+ " \/ " \+ VIEW_H/.test(src), "the stub keeps its ratio")
const root = src.slice(src.lastIndexOf("  return (\n    <div"), src.indexOf("<style>{CSS}</style>"))
assert.doesNotMatch(root, /\bh-(full|screen)\b/, "no percentage height on the root")

// The type is sized in container units off the ticket, so the fine print scales
// with the ticket and not with the viewport.
assert.ok(src.includes('containerType: "inline-size"'), "the card must be a size container")
assert.ok(/"cqw"/.test(src), "type is sized in container units")

// The canvas redraws when resized, and everything allocated is released.
assert.ok(src.includes("canvas.clientWidth"), "the plate measures its own box")
for (const gone of ["observer.disconnect()", "io.disconnect()", "cancelAnimationFrame(raf)", 'removeEventListener("change", onMq)']) {
  assert.ok(src.includes(gone), "cleanup is missing " + gone)
}

// Preflight: img/svg/canvas get max-width:100%, which an absolutely positioned
// full-bleed layer must opt out of.
assert.ok((src.match(/maxWidth: "none"/g) || []).length >= 4, "full-bleed layers must opt out of max-width")

// Reduced motion stops the automatic breath and the spray animation; holding
// still works, because that motion is the reader's own.
assert.ok(src.includes("prefers-reduced-motion"), "must read prefers-reduced-motion")
assert.ok(/cfg\.breathe && !reduced/.test(src), "reduced motion must stop the automatic rhythm")
assert.ok(/prefers-reduced-motion: reduce\)\{\.et-splat,\.et-drip\{animation:none\}/.test(src), "and the spray")

// It is a control: focusable, operable from the keyboard, and it says so.
assert.ok(src.includes('role="button"') && src.includes("tabIndex={0}"), "the ticket must be focusable")
assert.ok(src.includes('e.key === " "') && src.includes("onKeyUp"), "and holdable from the keyboard")
assert.ok(src.includes("aria-pressed"), "and report that it is held")
assert.ok(src.includes('className="sr-only"'), "the headline must exist as text")
assert.ok(src.includes('touchAction: "pan-y"'), "the page must still scroll over it on touch")

// Filter ids are per instance; two tickets on a page must not share one.
assert.ok(src.includes("React.useId()"), "filter ids must be unique per mount")

// A demo wrapper left at width:auto collapses inside 21st's centring flex.
for (const demo of ["demo.tsx", "demo-custom.tsx"]) {
  const first = readFileSync(new URL("../components/engraved-ticket/" + demo, import.meta.url), "utf8")
    .match(/return \(\s*<div className="([^"]*)"/)
  assert.ok(first && /\bw-(full|screen|\[|\d)/.test(first[1]), demo + " wraps the tickets without a width")
}

console.log("engraved-ticket: ok")
