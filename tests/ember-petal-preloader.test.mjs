// Install-safety, geometry and garden-layout checks for ember-petal-preloader.
// Run: node tests/ember-petal-preloader.test.mjs

import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const dir = new URL("../components/ember-petal-preloader/", import.meta.url)
const src = readFileSync(new URL("ember-petal-preloader.tsx", dir), "utf8")
const demos = Object.fromEntries(
  ["demo", "demo-gate", "demo-dusk"].map((name) => [name, readFileSync(new URL(name + ".tsx", dir), "utf8")]),
)

// ---- 1. Install safety -----------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "react is the only import the component may have")
assert.doesNotMatch(src, /@import/, "no @import — fonts come from the host or the fallback stack")
assert.doesNotMatch(src, /https?:\/\/(?!www\.w3\.org\/2000\/svg)/, "no external assets: the capture sandbox blocks other origins")
assert.ok(src.includes('height = "100svh"'), "height defaults to a definite length")
assert.doesNotMatch(src, /className=["'][^"']*\bh-full\b/, "no h-full")
assert.ok(src.includes("prefers-reduced-motion"), "honours reduced motion")
assert.ok(src.includes('role="progressbar"'), "reports progress to assistive tech")
assert.ok(src.includes('setAttribute("aria-valuenow"'), "progressbar carries its live value")
assert.ok(src.includes("onCompleteRef.current"), "calls onComplete through a ref")
assert.doesNotMatch(src, /\}, \[[^\]]*\bonComplete\b[^\]]*\]\)/, "effects must not depend on onComplete identity")
assert.ok(src.includes("cancelAnimationFrame(raf)"), "the frame loop is torn down on unmount")
assert.ok(src.includes("ro.disconnect()"), "the resize observer is torn down on unmount")
assert.ok(src.includes("React.useId()"), "SVG ids are unique per instance")
assert.ok(src.includes('preserveAspectRatio="xMidYMax meet"'), "the garden is laid out for the box, never cropped")

// The 21st CLI hangs on generics ahead of the first JSX close tag.
const head = src.slice(0, src.indexOf("</"))
assert.equal(head.match(/use(State|Ref|Memo|Callback)<|Partial<|Record<|Array<|Map<|React\.[A-Za-z]+<|\[K in /g), null, "no generics before the JSX")

// ---- 2. Scoped CSS ---------------------------------------------------------
const cssMatch = src.match(/const EMB_CSS = `([\s\S]*?)`/)
assert.ok(cssMatch, "EMB_CSS block is present")
const css = cssMatch[1]
assert.doesNotMatch(css, /\$\{|`/, "no interpolation or backticks in the CSS string")
assert.doesNotMatch(css, /^\s*(\*|body|html|:root)\s*\{/m, "no bare global resets")
assert.match(css, /\.emb-svg \{[^}]*max-width: none/, "the SVGs override Preflight's max-width")

let rules = 0
for (const match of css.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/(?<=^|[{}])\s*([^{}]+?)\s*\{/g)) {
  const sel = match[1].trim()
  if (sel.startsWith("@") || /^(from|to|[\d.]+%)/.test(sel)) continue
  rules++
  assert.ok(
    sel.split(",").every((s) => s.trim().startsWith(".emb-")),
    `unscoped CSS selector would leak into the host app: ${sel}`,
  )
}
assert.ok(rules >= 25, `expected a full scoped sheet, saw ${rules} rules`)
for (const phase of ["bloom", "hold", "lift", "set"]) {
  assert.ok(css.includes(`[data-phase="${phase}"]`), `phase ${phase} is styled`)
}
const reduced = css.slice(css.indexOf("@media (prefers-reduced-motion: reduce)"))
assert.match(reduced, /\[data-phase="lift"\] \.emb-world \{ animation: none; \}/, "the camera does not dive under reduced motion")
assert.ok(src.includes("if (still) {"), "growth, wind and pollen are off under reduced motion")

// ---- 3. Geometry helpers, executed -----------------------------------------
const start = src.indexOf("// #region geometry")
const end = src.indexOf("// #endregion")
assert.ok(start > -1 && end > start, "geometry region markers missing")
const js = stripTypeScriptTypes(src.slice(start, end))
const { embSmooth, embHash, embRng, embRgb, embMix, embAlpha, embSimulated, embCounter, embPetal, embBlade, embBez, embBezTan, embStem, embFlower, embGarden } =
  await import("data:text/javascript," + encodeURIComponent(js))

// numbers in a path, as [x, y] pairs
const pairs = (d) => {
  const n = d.match(/-?\d+(?:\.\d+)?/g).map(Number)
  const out = []
  for (let i = 0; i < n.length; i += 2) out.push([n[i], n[i + 1]])
  return out
}

// easing and noise
assert.equal(embSmooth(-1), 0)
assert.equal(embSmooth(2), 1)
assert.equal(embSmooth(0.5), 0.5)
for (let i = 0; i < 200; i++) {
  const h = embHash(i * 1.37)
  assert.ok(h >= 0 && h < 1, "hash stays in [0, 1)")
}
const a = embRng(7)
const b = embRng(7)
const seq = Array.from({ length: 50 }, () => a())
assert.deepEqual(seq, Array.from({ length: 50 }, () => b()), "a seed replays the same sequence")
assert.ok(seq.every((v) => v >= 0 && v < 1), "rng stays in [0, 1)")
assert.ok(new Set(seq).size > 45, "rng does not repeat")
assert.notEqual(embRng(8)(), seq[0], "a different seed differs")

// colour
assert.deepEqual(embRgb("#ff8a3e"), [255, 138, 62])
assert.deepEqual(embRgb("#fff"), [255, 255, 255])
assert.deepEqual(embRgb("nope"), [128, 128, 128], "bad input is grey, never NaN")
assert.equal(embMix("#000000", "#ffffff", 0.5), "#808080")
assert.equal(embMix("#ff0000", "#0000ff", 0), "#ff0000")
assert.equal(embMix("#ff0000", "#0000ff", 1), "#0000ff")
assert.equal(embAlpha("#ff8a3e", 0.5), "rgba(255, 138, 62, 0.5)")

// progress
assert.equal(embSimulated(-1), 0)
assert.equal(embSimulated(1), 1)
let prev = 0
for (let i = 1; i <= 400; i++) {
  const v = embSimulated(i / 400)
  assert.ok(v >= prev - 1e-9 && v <= 1, `simulated progress never runs backwards (t=${i / 400})`)
  prev = v
}
assert.ok(embSimulated(0.3) - embSimulated(0.2) < 0.05, "first stall is present")
assert.equal(embCounter(42.4), "42%")
assert.equal(embCounter(140), "100%")
assert.equal(embCounter(-3), "0%")

// a petal: closed, starts and ends at its base, stays inside its box, opens wider
for (const [L, w, curl, tip] of [[40, 13, 0, 0.7], [40, 26, 1, 0.95], [38, 11, 0.5, -0.35], [24, 8, 0.2, 0.45]]) {
  const d = embPetal(L, w, curl, tip, 0.3)
  assert.match(d, /^M0 0 C[\d\s.-]+ C[\d\s.-]+ C[\d\s.-]+ C[\d\s.-]+ 0 0 Z$/, "petal is four cubics, closed at the base")
  for (const [x, y] of pairs(d)) {
    assert.ok(Math.abs(x) <= w * 1.6, `petal x ${x} inside its width ${w}`)
    assert.ok(y <= 0.01 && y >= -L * 1.2, `petal y ${y} inside its length ${L}`)
  }
}
const widthOf = (d) => Math.max(...pairs(d).map(([x]) => Math.abs(x)))
assert.ok(widthOf(embPetal(40, 13, 1, 0.7, 0)) > widthOf(embPetal(40, 13, 0, 0.7, 0)), "curl widens the tip")
assert.notEqual(embPetal(40, 13, 0.5, 0.7, 0.4), embPetal(40, 13, 0.5, 0.7, -0.4), "ruffle leans the outline")

// a blade
const blade = embBlade(60, 18, 0.3)
assert.match(blade, /^M0 0 C[\d\s.-]+ C[\d\s.-]+ 0 0 Z$/, "blade is two cubics, closed at the base")
assert.ok(pairs(blade).every(([, y]) => y <= 0.01 && y >= -60.01), "blade points up and stays inside its length")

// the stem curve
assert.deepEqual(embBez(0, 100, 0, 50, 0, 0, 0), [0, 100])
assert.deepEqual(embBez(0, 100, 0, 50, 0, 0, 1), [0, 0])
assert.deepEqual(embBezTan(0, 100, 0, 50, 0, 0, 0.5), [0, -100])
const stem = embStem(100, 600, 110, 450, 130, 300, 4, 1.6)
assert.match(stem, /^M[\d\s.L-]+ Z$/, "stem is a closed polyline")
const sp = pairs(stem)
assert.equal(sp.length, 26, "13 samples a side")
assert.ok(Math.abs(sp[0][0] - sp[25][0]) <= 8.1 && Math.abs(sp[0][0] - sp[25][0]) >= 7.9, "the base is 2 × w0 wide")
assert.ok(Math.abs(sp[12][0] - sp[13][0]) <= 3.3, "the tip is 2 × w1 wide")

// a flower across its opening
for (const kind of ["poppy", "tulip", "bud"]) {
  const closed = embFlower(kind, 0, 1, 3)
  const open = embFlower(kind, 1, 1, 3)
  const over = embFlower(kind, 1.3, 1, 3)
  assert.equal(closed.length, open.length, `${kind} keeps its petal count while opening`)
  assert.equal(open.length, over.length, `${kind} keeps its petal count through the overshoot`)
  assert.ok(closed.length >= 3, `${kind} has at least three petals`)
  const firstBowl = closed.findIndex((s) => s.k !== 0)
  assert.ok(closed.slice(0, firstBowl).every((s) => s.k === 0), `${kind}: back petals are listed first`)
  assert.ok(closed.slice(firstBowl).every((s) => s.k !== 0), `${kind}: then the bowl`)
  assert.equal(closed.filter((s) => s.k === 2).length, 1, `${kind} has exactly one front lip`)
  const spread = (specs) => Math.max(...specs.map((s) => s.r)) - Math.min(...specs.map((s) => s.r))
  assert.ok(spread(open) > spread(closed), `${kind} opens wider than its bud`)
  assert.ok(spread(over) > spread(open), `${kind} flares past open on the bloom`)
  assert.deepEqual(embFlower(kind, 2, 1, 3), over, "openness is capped at 1.3")
  assert.deepEqual(embFlower(kind, -1, 1, 3), closed, "and floored at 0")
  const big = embFlower(kind, 1, 2, 3)
  assert.ok(widthOf(big[0].d) > widthOf(open[0].d) * 1.8, `${kind} scales with size`)
}

// the garden, across boxes
for (const [W, dens] of [[1000, 1], [360, 1], [2400, 1], [960, 0.6], [1440, 1.5]]) {
  const g = embGarden(W, 600, dens, 7)
  const at = `${W} × 600 @ ${dens}`
  assert.ok(g.length >= 11, `${at}: a garden, not a pot`)
  let layer = 0
  for (const p of g) {
    assert.ok(p.x >= 0 && p.x <= W, `${at}: every plant stands inside the box`)
    assert.ok(p.h > 0 && p.h < 600, `${at}: heights are sane`)
    assert.ok(p.layer >= layer, `${at}: far plants come first, so the array is paint order`)
    layer = p.layer
    assert.ok(["poppy", "tulip", "bud", "leaf"].includes(p.kind), `${at}: known kind ${p.kind}`)
    assert.ok(p.delay >= 0 && p.delay <= 0.5, `${at}: everything starts growing by half way`)
    if (p.kind !== "leaf") {
      assert.ok(p.openAt + p.openSpan <= 1.0001, `${at}: every bud is open by 100%`)
      assert.ok(p.leaves.length >= 1 && p.leaves.length <= 3, `${at}: one to three leaves`)
      for (const lf of p.leaves) assert.ok(lf.t > 0.1 && lf.t < 0.9, `${at}: leaves sit on the stem, not at its ends`)
      assert.ok(p.size >= 0.8 && p.size <= 3.1, `${at}: flower sizes stay in range`)
    }
  }
  assert.ok(g.some((p) => p.layer === 0) && g.some((p) => p.layer === 1) && g.some((p) => p.layer === 2), `${at}: three layers of depth`)
  assert.ok(g.some((p) => p.kind === "leaf"), `${at}: foreground foliage`)
}
assert.deepEqual(embGarden(1000, 600, 1, 7), embGarden(1000, 600, 1, 7), "the layout is deterministic for a seed")
assert.notDeepEqual(embGarden(1000, 600, 1, 7), embGarden(1000, 600, 1, 8), "a new seed is a new garden")
assert.ok(embGarden(1000, 600, 1.5, 7).length > embGarden(1000, 600, 1, 7).length, "density adds plants")
assert.ok(embGarden(1000, 600, 1, 7).some((p) => p.hue === "lilac") && embGarden(1000, 600, 1, 7).some((p) => p.hue === "gold"), "lavender and gold flowers are in the mix")

// ---- 4. Demos ---------------------------------------------------------------
for (const [name, d] of Object.entries(demos)) {
  assert.ok(d.includes('from "@/components/ui/ember-petal-preloader"'), `${name} imports the canonical path`)
}
assert.match(demos.demo, /<EmberPetalPreloader loop \/>/, "default demo is the looping component, full bleed")
assert.doesNotMatch(demos.demo, /<div/, "default demo must not wrap the component")
assert.ok(demos["demo-gate"].includes("</EmberPetalPreloader>"), "gate demo passes children")
assert.ok(demos["demo-dusk"].includes('preset="dusk"'), "dusk demo shows a second preset")

console.log("ember-petal-preloader: ok")
