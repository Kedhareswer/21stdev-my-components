// Runnable check for components/string-tie-footer: the cord geometry, the rope
// step and the scroll maths, plus the install-safety rules.
// Run: node tests/string-tie-footer.test.mjs
//
// What breaks silently here: a tied shape and a loose shape of different
// lengths (the rope snaps or stretches on every untie), a loose cord that
// wanders off the footer or up onto the flap, a rope step that lets segments
// creep longer, a wind that overshoots or never quite arrives (the signature
// never writes), and a scroll reading that leaves a footer already on screen
// forever untied.
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const read = (file) =>
  readFileSync(new URL("../components/string-tie-footer/" + file, import.meta.url), "utf8").replace(/\r\n/g, "\n")
const src = read("string-tie-footer.tsx")

const start = src.indexOf("// #region string")
const end = src.indexOf("// #endregion")
assert.ok(start > -1 && end > start, "string region markers missing")
const T = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(src.slice(start, end))))

const top = { x: 600, y: 520 }
const bottom = { x: 600, y: 720 }
const r = 90

// ---- the tied cord -------------------------------------------------------------
const tied = T.tiePath(top, bottom, r * 0.4, r * 0.95)
{
  assert.deepEqual(tied[0], bottom, "anchored in the bottom grommet")
  for (const p of tied) assert.ok(Number.isFinite(p.x) && Number.isFinite(p.y), "no NaN in the tied cord")
  // The figure eight passes the midpoint (the crossing) more than once.
  const mid = { x: 600, y: 620 }
  let crossings = 0
  let near = false
  for (const p of tied) {
    const n = Math.hypot(p.x - mid.x, p.y - mid.y) < 3
    if (n && !near) crossings++
    near = n
  }
  assert.ok(crossings >= 3, "the strands cross between the buttons (" + crossings + ")")
  // It wraps both grommets: points go above the top one and below the bottom one.
  assert.ok(tied.some((p) => p.y < top.y - r * 0.35), "goes over the top grommet")
  assert.ok(tied.some((p) => p.y > bottom.y + r * 0.35), "goes under the bottom grommet")
  // The free end tucks off up and to the right.
  const tip = tied.at(-1)
  assert.ok(tip.x > top.x && tip.y < top.y, "the tail tucks off to the upper right")
  // Close buttons still give a finite, sane cord.
  for (const p of T.tiePath({ x: 0, y: 0 }, { x: 0, y: 10 }, 40, 20)) assert.ok(Number.isFinite(p.x + p.y))
  for (const p of T.tiePath({ x: 0, y: 0 }, { x: 0, y: 0 }, 40, 20)) assert.ok(Number.isFinite(p.x + p.y), "coincident buttons")
}

// ---- resampling ------------------------------------------------------------------
{
  const N = 96
  const s = T.resample(tied, N)
  assert.equal(s.length, N + 1)
  assert.deepEqual(s[0], tied[0])
  assert.deepEqual(s.at(-1), tied.at(-1))
  const seg = T.polyLength(tied) / N
  for (let i = 1; i < s.length; i++) {
    const d = Math.hypot(s[i].x - s[i - 1].x, s[i].y - s[i - 1].y)
    assert.ok(d <= seg + 1e-6, "no resampled segment longer than the arc it stands for")
  }
  assert.deepEqual(T.resample([], 4), [])
  assert.equal(T.resample([{ x: 1, y: 2 }], 4).length, 5)
}

// ---- the loose cord --------------------------------------------------------------
{
  const L = T.polyLength(tied)
  const box = { left: 10, top: 640, right: 1190, bottom: 1100 }
  const rest = T.restPath(bottom, L, r * 0.66, box, 1.4, 2)
  assert.ok(Math.abs(T.polyLength(rest) - L) < 0.5, "loose and tied cords are the same length")
  assert.deepEqual(rest[0], bottom, "still anchored")
  for (const p of rest.slice(1)) {
    assert.ok(p.x >= box.left && p.x <= box.right && p.y >= box.top && p.y <= box.bottom, "loose cord stays in its box")
  }
  assert.deepEqual(T.restPath(bottom, L, r * 0.66, box, 1.4, 2), rest, "reproducible")
  // A box far too small to hold it still pays out the full length rather than looping forever.
  const tight = T.restPath({ x: 50, y: 50 }, 2000, 30, { left: 40, top: 40, right: 60, bottom: 60 })
  assert.ok(T.polyLength(tight) > 0)
  assert.deepEqual(T.restPath(bottom, 0, 20, box), [bottom])
}

// ---- the rope step ---------------------------------------------------------------
{
  const N = 96
  const tiedN = T.resample(tied, N)
  const restN = T.resample(T.restPath(bottom, T.polyLength(tied), r * 0.66, { left: 10, top: 640, right: 1190, bottom: 1100 }, 1.4, 2), N)
  const rope = T.makeRope(restN)
  // Wind it on in stages, as the scroll would.
  for (let k = 0; k <= N + 1; k += 4) for (let f = 0; f < 6; f++) T.stepRope(rope, tiedN, restN, k, 0.05)
  for (let f = 0; f < 120; f++) T.stepRope(rope, tiedN, restN, N + 1, 0.05)
  for (let i = 0; i <= N; i++) {
    assert.ok(Math.hypot(rope.x[i] - tiedN[i].x, rope.y[i] - tiedN[i].y) < 0.5, "fully wound, point " + i + " sits on the tied shape")
  }
  // Unwind and let it settle: segments keep their length, the anchor never moves.
  for (let f = 0; f < 400; f++) T.stepRope(rope, tiedN, restN, 1, 0.05)
  assert.equal(rope.x[0], bottom.x)
  assert.equal(rope.y[0], bottom.y)
  for (let i = 1; i <= N; i++) {
    const d = Math.hypot(rope.x[i] - rope.x[i - 1], rope.y[i] - rope.y[i - 1])
    assert.ok(Math.abs(d - rope.seg) < rope.seg * 0.08, "segment " + i + " keeps its length (" + d.toFixed(2) + " vs " + rope.seg.toFixed(2) + ")")
  }
  // A drag pins one point to the pointer; nearestFree finds it, and never a wound one.
  T.stepRope(rope, tiedN, restN, 1, 0, { i: N, x: 300, y: 900 })
  assert.equal(rope.x[N], 300)
  assert.equal(T.nearestFree(rope, 300, 900, 1, 20), N)
  assert.equal(T.nearestFree(rope, 300, 900, N + 1, 20), -1, "wound points can't be grabbed")
  assert.equal(T.nearestFree(rope, -999, -999, 1, 20), -1)
}

// ---- the path, the wind and the scroll -------------------------------------------
{
  assert.equal(T.smoothPath([0], [0]), "")
  assert.match(T.smoothPath([0, 10, 20], [0, 5, 0]), /^M0 0Q10 5 15 2\.5L20 0$/)

  assert.equal(T.scrollProgress(900, 800, 900), 0, "top at the fold: not started")
  assert.equal(T.scrollProgress(0, 900, 900), 1, "already on screen: wound")
  assert.ok(T.scrollProgress(500, 900, 900) > 0 && T.scrollProgress(500, 900, 900) < 1, "partway")
  assert.equal(T.scrollProgress(2000, 900, 900), 0)
  assert.equal(T.scrollProgress(0, 900, 0), 1, "no viewport: don't hold the cord hostage")
  assert.equal(T.scrollProgress(NaN, 900, 900), 1)

  let w = 0
  let steps = 0
  while (w < 1 && steps++ < 1000) {
    const next = T.stepWind(w, 1, 1 / 60, 0.85)
    assert.ok(next >= w && next <= 1, "monotonic, no overshoot")
    assert.ok(next - w <= 0.85 / 60 + 1e-9, "rate-limited")
    w = next
  }
  assert.equal(w, 1, "arrives exactly (the signature waits on it)")
  assert.ok(steps > 60, "takes over a second, so the wind is seen")
  assert.equal(T.stepWind(0.5, 0.5, 1 / 60, 1), 0.5)
  assert.equal(T.stepWind(0.3, 0, 0, 1), 0.3, "dt 0 holds")
}

// ---- install safety --------------------------------------------------------------
{
  assert.ok(/height = "100svh"/.test(src), "height defaults to a definite length")
  assert.doesNotMatch(src, /\bh-full\b/, "no h-full anywhere")
  assert.doesNotMatch(src, /@import/, "no @import")
  assert.doesNotMatch(src, /^\s*(\*|body|:root|html)\s*[{,]/m, "no bare global resets")
  const css = src.slice(src.indexOf("const CSS ="), src.indexOf("/** Stamps each signature"))
  assert.ok(css.length > 1000, "found the CSS block")
  assert.doesNotMatch(css, /`|\$\{/, "no backticks or ${ in the CSS string")
  assert.doesNotMatch(css, /(^|[}"])\s*(\*|body|:root|html)\s*\{/, "every rule is scoped under .stt")
  for (const m of css.matchAll(/"([^"]*)\{/g)) {
    const sel = m[1].replace(/^[}\s]*/, "")
    if (/^@|^\d|^from|^to/.test(sel) || sel === "") continue
    assert.ok(/\.stt/.test(sel), "unscoped selector: " + sel)
  }
  assert.ok(css.includes("prefers-reduced-motion"), "honours reduced motion")
  assert.ok(/reduce\)"\)/.test(src) && src.includes("s.reduced"), "the rope also stops moving under reduced motion")
  // Preflight's svg/img max-width would squash the buttons, cord and signature.
  for (const cls of [".stt-btn svg", ".stt-cord", ".stt-sign{"]) {
    const rule = css.slice(css.indexOf(cls))
    assert.ok(/max-width:none/.test(rule.slice(0, rule.indexOf("}"))), cls + " needs max-width:none")
  }
  // Nothing fetched: no external URLs in what renders.
  assert.doesNotMatch(src, /https?:\/\/(?!www\.w3\.org)/, "no external assets")
  // SVG ids are per instance, or two footers on a page share one filter.
  assert.ok(src.includes("React.useId()"), "per-instance ids")
  // Only React is imported.
  assert.deepEqual([...src.matchAll(/^import .* from "([^"]+)"/gm)].map((m) => m[1]), ["react"])

  const tsconfig = readFileSync(new URL("../tsconfig.json", import.meta.url), "utf8")
  assert.ok(tsconfig.includes('"@/components/ui/string-tie-footer"'), "tsconfig paths line")
  for (const demo of ["demo.tsx", "demo-scroll.tsx"]) {
    assert.ok(read(demo).includes('from "@/components/ui/string-tie-footer"'), demo + " imports the installed path")
  }
}

console.log("string-tie-footer: ok")
