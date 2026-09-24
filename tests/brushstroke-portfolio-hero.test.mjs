// Install-safety check for components/brushstroke-portfolio-hero.
// Run: node tests/brushstroke-portfolio-hero.test.mjs
//
// Two kinds of failure are worth guarding here. The first is the usual install
// surface: a style block that escapes the component root, a percentage height
// that collapses to 0px on an installed page, an external origin the capture
// sandbox blocks, and filter ids two instances on one page would fight over.
//
// The second is the brush. Every painted mark on this sheet is generated from a
// centreline and a pressure profile rather than drawn as a literal outline, so
// the geometry is real code and it is tested by running it — the marked region
// is lifted out of the .tsx so the published component stays one file.
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

const src = readFileSync(
  new URL("../components/brushstroke-portfolio-hero/brushstroke-portfolio-hero.tsx", import.meta.url),
  "utf8",
).replace(/\r\n/g, "\n") // a Windows checkout is CRLF; the slices below look for "\n"

const css = src.slice(src.indexOf("const CSS = `") + 13, src.indexOf("\n`\n"))
assert.ok(css.length > 200, "could not extract the style block")

/* ---------- install safety ---------- */

assert.doesNotMatch(css, /@import/, "no @import in the inline style block")
assert.doesNotMatch(css, /[`]|\$\{/, "no backticks or template holes inside the CSS")
assert.doesNotMatch(src, /https?:\/\/(?!www\.w3\.org)/, "no external origins — the capture sandbox blocks them")

for (const line of css.split("\n")) {
  const m = line.match(/^\s*([^@{}/*][^{]*)\{/)
  if (!m) continue
  for (const sel of m[1].split(",")) {
    const s = sel.trim()
    if (!s) continue
    assert.ok(s.startsWith(".bph"), `selector escapes the component root: ${s}`)
  }
}

/* ---------- the height has to survive installation ---------- */

// dev/styles.css gives html, body and #root a height. An installed page does
// not, so anything percentage-based below the root paints at 0px there while
// still looking correct in the workshop.
assert.match(src, /height = "100svh"/, "height must default to a definite length")
assert.doesNotMatch(src, /h-full/, "no h-full on the component root")

const rootRule = css.match(/\.bph-root\{([^}]*)\}/)
assert.ok(rootRule, "missing the .bph-root rule")
assert.doesNotMatch(rootRule[1], /height/, "the root must not set its own height")
for (const m of css.matchAll(/(\.bph-[\w-]+)\{([^}]*height:\s*100%[^}]*)\}/g)) {
  assert.match(m[2], /position:absolute/, `${m[1]} uses a percentage height without being positioned`)
}

/* ---------- two on one page must not fight over ids ---------- */

assert.match(src, /React\.useId\(\)/, "ids must be namespaced per instance")
assert.equal(src.match(/url\(#(?!")/g), null, "every url(#...) must be built by u(), not hard-coded")

/* ---------- every glyph the ghost lockup sets is drawn ---------- */

const drawn = new Set()
for (const m of src.matchAll(/^\s*([A-Z]):\s*\{\s*w:/gm)) drawn.add(m[1])
assert.ok(drawn.size >= 7, `only found ${drawn.size} display glyphs`)
for (const m of src.matchAll(/setWord\("([A-Z]+)"/g)) {
  for (const ch of m[1]) {
    assert.ok(drawn.has(ch), `the lockup sets ${ch} but no glyph is drawn for it`)
  }
}

/* ---------- the brush math, run for real ---------- */

const start = src.indexOf("// #region ribbon")
const end = src.indexOf("// #endregion")
assert.ok(start > -1 && end > start, "ribbon region markers missing")

const js = src
  .slice(start, end)
  .replace(/:\s*(Vec\[\]|number\[\]|number|boolean|string)(?=[,)\s{])/g, "")
const { curve, ribbon, ring, bowl } = await import(
  "data:text/javascript," + encodeURIComponent(js)
)

/**
 * Control points are not the curve — a Catmull-Rom cap overshoots the points it
 * passes through — so sample the cubics instead of measuring their handles.
 */
const flatten = (d) => {
  const toks = d.match(/[MCZ]|-?\d+(?:\.\d+)?/g)
  const num = () => Number(toks[i++])
  const pts = []
  let i = 0
  let cur = [0, 0]
  let first = [0, 0]
  while (i < toks.length) {
    const t = toks[i++]
    if (t === "M") {
      cur = [num(), num()]
      first = cur
      pts.push(cur)
    } else if (t === "C") {
      const c1 = [num(), num()]
      const c2 = [num(), num()]
      const p = [num(), num()]
      for (let s = 1; s <= 16; s++) {
        const u = s / 16
        const m = 1 - u
        pts.push([
          m * m * m * cur[0] + 3 * m * m * u * c1[0] + 3 * m * u * u * c2[0] + u * u * u * p[0],
          m * m * m * cur[1] + 3 * m * m * u * c1[1] + 3 * m * u * u * c2[1] + u * u * u * p[1],
        ])
      }
      cur = p
    } else if (t === "Z") {
      cur = first
    }
  }
  return pts
}

const span = (pts, pick) => {
  const v = pts.map(pick)
  return { lo: Math.min(...v), hi: Math.max(...v) }
}

// An open spline stays open; a closed one comes back to the start.
assert.doesNotMatch(curve([[0, 0], [10, 10], [20, 0]], false), /Z$/, "open curve must not close")
assert.match(curve([[0, 0], [10, 10], [20, 0]], true), /Z$/, "closed curve must close")

// A stroke of constant width is a band of exactly that half-width either side.
// Measured across the middle, where the caps cannot contribute.
const flat = flatten(ribbon([[0, 0], [20, 0], [40, 0], [60, 0], [80, 0], [100, 0]], [10, 10, 10, 10, 10, 10]))
const mid = flat.filter((p) => p[0] > 30 && p[0] < 70)
const midY = span(mid, (p) => p[1])
assert.ok(Math.abs(midY.hi - 10) < 0.02 && Math.abs(midY.lo + 10) < 0.02, `band is not 10 either side: ${midY.lo}..${midY.hi}`)
assert.equal((ribbon([[0, 0], [50, 0]], [10, 10]).match(/Z/g) || []).length, 1, "a stroke is one closed contour")

// The cap rounds over rather than turning a corner, but it must stay a cap —
// an unbounded overshoot here would show up as a blob on the end of every mark.
const allY = span(flat, (p) => p[1])
assert.ok(allY.hi < 10 * 1.35, `cap overshoots too far: ${allY.hi}`)

// Pressure is the whole point: dropping the profile at one end has to narrow
// that end and leave the other alone.
const taper = flatten(ribbon([[0, 0], [25, 0], [50, 0], [75, 0], [100, 0]], [10, 7.5, 5, 2.5, 0.5]))
const loaded = span(taper.filter((p) => p[0] < 3), (p) => p[1])
const dry = span(taper.filter((p) => p[0] > 97), (p) => p[1])
// The cap rounds over, so the loaded end reads a little proud of its
// half-width. What matters is that it is still carrying it.
assert.ok(loaded.hi > 9 && loaded.hi < 11.5, `the loaded end lost its width: ${loaded.hi}`)
assert.ok(dry.hi < 1.2, `the dry end did not taper: ${dry.hi}`)

// A bowl is a ring: two contours, and a counter that is actually a hole.
const o = bowl(0, 0, 50, 50, 10, 10, 0, 48)
assert.equal((o.match(/M/g) || []).length, 2, "a bowl is an outer and an inner contour")
assert.equal((o.match(/Z/g) || []).length, 2, "both contours must close")
const outer = o.slice(0, o.indexOf("M", 1))
const inner = o.slice(o.indexOf("M", 1))
assert.ok(Math.abs(span(flatten(outer), (p) => p[0]).hi - 60) < 0.3, "outer edge should sit at r+w")
assert.ok(Math.abs(span(flatten(inner), (p) => p[0]).hi - 40) < 0.3, "inner edge should sit at r-w")

// The counter has to wind against the outer contour, or fill-rule nonzero
// paints it solid and every bowl on the sheet fills in.
const area = (pts) => {
  let a = 0
  for (let i = 0; i < pts.length; i++) {
    const j = (i + 1) % pts.length
    a += pts[i][0] * pts[j][1] - pts[j][0] * pts[i][1]
  }
  return a / 2
}
assert.ok(area(flatten(outer)) * area(flatten(inner)) < 0, "the counter must wind opposite to the outer contour")

// Two nested contours with the same winding is the bug this guards against.
assert.match(src, /inner\.reverse\(\)/, "ring() must reverse its inner contour")

console.log("ok - brushstroke-portfolio-hero")
