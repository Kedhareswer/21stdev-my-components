// Install-safety, timeline and artwork checks for dragon-seal-preloader.
// Run: node tests/dragon-seal-preloader.test.mjs

import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

const dir = new URL("../components/dragon-seal-preloader/", import.meta.url)
const src = readFileSync(new URL("dragon-seal-preloader.tsx", dir), "utf8")
const demos = Object.fromEntries(
  ["demo", "demo-jade", "demo-paper"].map((name) => [name, readFileSync(new URL(name + ".tsx", dir), "utf8")]),
)
const tsconfig = readFileSync(new URL("../tsconfig.json", import.meta.url), "utf8")

// ---- 1. Install safety -----------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "react is the only import the component may have")
assert.doesNotMatch(src, /@import/, "no @import: fonts come from the host or the fallback stack")
assert.doesNotMatch(src, /https?:\/\//, "no external assets: every line is drawn in the file")
assert.ok(src.includes('height = "100svh"'), "height defaults to a definite length")
assert.doesNotMatch(src, /className=["'][^"']*\bh-full\b/, "no h-full")
assert.ok(src.includes("prefers-reduced-motion"), "honours reduced motion")
assert.ok(src.includes('role="progressbar"'), "reports progress to assistive tech")
assert.ok(src.includes("aria-valuenow={pct}"), "progressbar carries its value")
assert.ok(src.includes('role="slider"'), "the seal is a keyboard-operable dial")
assert.ok(src.includes("aria-valuenow={safeIndex + 1}"), "the dial reports which credit is up")
assert.ok(src.includes("onLoadedRef.current"), "calls onLoaded through a ref")
assert.doesNotMatch(src, /\}, \[[^\]]*\bonLoaded\b[^\]]*\]\)/, "effects must not depend on onLoaded identity")
assert.ok(src.includes("cancelAnimationFrame(raf)"), "the frame loops are torn down on unmount")
assert.ok(src.includes("ro.disconnect()"), "the resize observer is torn down on unmount")
assert.doesNotMatch(src, /console\./, "no debug logging ships")
assert.doesNotMatch(src, /toBlob\(/, "textures are encoded synchronously")
assert.doesNotMatch(src, /useMemo\([^)]*paint(Paper|Grain)/, "canvas textures are painted in an effect, not during render")
// StrictMode runs state updaters twice; turning the seal from inside one would
// turn it two steps for every credit.
assert.doesNotMatch(src, /setIndex\(\(/, "no side effects inside the index updater")
// Links without an href must not navigate (a bare "#" would also wreck hash routers).
assert.doesNotMatch(src, /href=["']#["']/, "no placeholder # links")

// ---- 2. Scoped CSS ---------------------------------------------------------
const cssMatch = src.match(/const DSP_CSS = `([\s\S]*?)`/)
assert.ok(cssMatch, "DSP_CSS block is present")
const css = cssMatch[1]
assert.doesNotMatch(css, /\$\{|`/, "no interpolation or backticks in the CSS string")
assert.doesNotMatch(css, /^\s*(\*|body|html|:root)\s*\{/m, "no bare global resets")
assert.match(css, /\.dsp-root svg, \.dsp-root canvas, \.dsp-root img \{ max-width: none; \}/, "media overrides Preflight's max-width")
assert.doesNotMatch(css, /\.dsp-root \*/, "box-sizing stays inside the shell, off the host's children")

let rules = 0
for (const match of css.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/(?<=^|[{}])\s*([^{}]+?)\s*\{/g)) {
  const sel = match[1].trim()
  if (sel.startsWith("@") || /^(from|to|[\d.]+%)/.test(sel)) continue
  rules++
  assert.ok(
    sel.split(",").every((s) => s.trim().startsWith(".dsp-")),
    `unscoped CSS selector would leak into the host app: ${sel}`,
  )
}
assert.ok(rules >= 100, `expected a full scoped sheet, saw ${rules} rules`)

for (const phase of ["boot", "load", "summon", "landing"]) {
  assert.ok(css.includes(`[data-phase="${phase}"]`), `phase ${phase} is styled`)
}

const reduced = css.slice(css.indexOf("@media (prefers-reduced-motion: reduce)"))
assert.match(reduced, /\.dsp-root \{ --dsp-par: 0px; \}/, "no parallax under reduced motion")
assert.match(reduced, /\.dsp-weave, \.dsp-grain, \.dsp-flicker, \.dsp-scratch \{ animation: none; \}/, "the film holds still")
assert.match(reduced, /\.dsp-draw \{ stroke-dasharray: none;/, "the dragon fades in instead of drawing")

// ---- 3. The two pure regions, executed -------------------------------------
const region = (name) => {
  const start = src.indexOf("// #region " + name)
  const end = src.indexOf("// #endregion", start)
  assert.ok(start > -1 && end > start, `${name} region markers missing`)
  return src.slice(start, end)
}
// Strip the handful of annotation shapes the regions use: `: number`, `: Pt[]`,
// `): Pt =>` and the like. Anything fancier in a region breaks this on purpose.
const js = (region("timeline") + region("art")).replace(
  /:\s*(?:number|string|boolean|Pt|Shape)(?:\[\])*(?=\s*(?:[,)=;{]))/g,
  "",
)
const m = await import("data:text/javascript," + encodeURIComponent(js))

// simulated load
assert.equal(m.dspSimulated(-1), 0)
assert.equal(m.dspSimulated(0), 0)
assert.equal(m.dspSimulated(1), 1)
assert.equal(m.dspSimulated(2), 1)
let prev = 0
for (let i = 1; i <= 400; i++) {
  const v = m.dspSimulated(i / 400)
  assert.ok(v >= prev - 1e-9, `simulated progress must never run backwards (t=${i / 400})`)
  assert.ok(v >= 0 && v <= 1, "simulated progress stays in range")
  prev = v
}
assert.ok(m.dspSimulated(0.31) - m.dspSimulated(0.2) < 0.05, "the first stall is present")

// trigrams: one per eighth of the load
assert.equal(m.dspLit(0), 0)
assert.equal(m.dspLit(0.124), 0)
assert.equal(m.dspLit(0.125), 1)
assert.equal(m.dspLit(0.375), 3, "float error must not drop a trigram at its exact boundary")
assert.equal(m.dspLit(1), 8)
assert.equal(m.dspLit(4), 8)
assert.equal(m.dspLit(-1), 0)

// the dial
assert.equal(m.dspStep(4), 90)
assert.equal(m.dspStep(0), 360, "no credits must not divide by zero")
assert.equal(m.dspIndexAt(0, 4), 0)
assert.equal(m.dspIndexAt(90, 4), 1)
assert.equal(m.dspIndexAt(44, 4), 0)
assert.equal(m.dspIndexAt(46, 4), 1)
assert.equal(m.dspIndexAt(-90, 4), 3, "turning back wraps to the last credit")
assert.equal(m.dspIndexAt(720 + 180, 4), 2, "whole turns are ignored")
assert.equal(m.dspSnap(100, 4), 90)
assert.equal(m.dspSnap(-140, 4), -180)
assert.equal(m.dspSnap(370, 3), 360, "snapping keeps whole turns so the seal never spins back")
assert.equal(m.dspDelta(0, 1, 4), 1)
assert.equal(m.dspDelta(0, 3, 4), -1, "the short way round")
assert.equal(m.dspDelta(3, 0, 4), 1)
assert.equal(m.dspDelta(2, 2, 4), 0)
assert.equal(Math.abs(m.dspDelta(0, 2, 4)), 2)
assert.equal(m.dspWrap(190), -170)
assert.equal(m.dspWrap(-190), 170)
assert.equal(m.dspWrap(180), 180)
assert.equal(m.dspWrap(-180), 180)
assert.equal(m.dspWrap(720 + 30), 30)

// timecode
assert.equal(m.dspTimecode(0, 24), "00:00:00:00")
assert.equal(m.dspTimecode(1000, 24), "00:00:01:00")
assert.equal(m.dspTimecode(1500, 24), "00:00:01:12")
assert.equal(m.dspTimecode(61_000, 24), "00:01:01:00")
assert.equal(m.dspTimecode(-5, 24), "00:00:00:00")

// seeded noise
const a = m.dspRng(42)
const b = m.dspRng(42)
const seq = Array.from({ length: 50 }, () => a())
assert.deepEqual(seq, Array.from({ length: 50 }, () => b()), "the stipple is the same on every mount")
assert.ok(seq.every((v) => v >= 0 && v < 1), "rng stays in [0, 1)")
assert.notDeepEqual(seq, Array.from({ length: 50 }, m.dspRng(43)), "different seeds differ")

// ---- 4. The artwork --------------------------------------------------------
// Every path the engraving produces must be valid, finite path data.
const PATH = /^[MLCQAZhv0-9 .\-]+$/
const checkPath = (d, where) => {
  assert.equal(typeof d, "string", `${where} is a string`)
  assert.ok(d.length > 0, `${where} is not empty`)
  assert.doesNotMatch(d, /NaN|Infinity|undefined/, `${where} has no NaN`)
  assert.match(d, PATH, `${where} is plain path data`)
  assert.match(d, /^M/, `${where} starts with a move`)
}
const walk = (v, where) => {
  if (typeof v === "string") return checkPath(v, where)
  if (Array.isArray(v)) {
    if (v.length === 2 && v.every((x) => typeof x === "number")) {
      assert.ok(v.every(Number.isFinite), `${where} is a finite point`)
      return
    }
    return v.forEach((x, i) => walk(x, `${where}[${i}]`))
  }
  for (const [k, x] of Object.entries(v)) walk(x, `${where}.${k}`)
}

const dragon = m.dspDragon()
walk(dragon, "dragon")
for (const k of ["bodyFill", "outline", "scales", "belly", "fins", "legFill", "legLine", "tailFill", "tailLine", "clouds"]) {
  assert.ok(dragon[k].length > 400, `dragon.${k} has real detail`)
}
// the coil stays round the seal: the body clears the rim and the frame
const pts = [...dragon.outline.matchAll(/(-?[\d.]+) (-?[\d.]+)/g)].map((p) => Math.hypot(+p[1], +p[2]))
assert.ok(Math.min(...pts) > 150 && Math.max(...pts) < 420, "the dragon coils between the seal and the lace")

const rings = m.dspRings()
walk(rings, "rings")
const raised = m.dspHandRaised()
const open = m.dspHandOpen()
for (const [name, hand] of [["raised", raised], ["open", open]]) {
  assert.ok(hand.shapes.length >= 5, `${name} hand has a palm, fingers and a thumb`)
  walk(hand, name)
}
const seal = m.dspSeal()
walk(seal, "seal")
assert.equal(seal.trigrams.length, 8, "eight trigrams round the seal")

assert.equal(m.DSP_TRIGRAMS.length, 8)
assert.equal(new Set(m.DSP_TRIGRAMS.map((t) => t.lines.join())).size, 8, "the trigrams are all different")
assert.ok(m.DSP_TRIGRAMS.every((t) => t.lines.length === 3 && t.han && t.name), "each trigram has three lines and a name")

checkPath(m.dspCloud(10, 20, 30, 1, -1), "cloud")
checkPath(m.dspSmooth([[0, 0], [10, 0], [10, 10]], true), "smooth")
assert.equal(m.dspSmooth([[0, 0]], false), "", "a single point is no path")

// ---- 5. No borrowed credits ------------------------------------------------
// The look is after a film title card; its credits and names must not ship.
for (const mark of [/郝艺/, /hao\s*yi/i, /set\s*&\s*costume/i]) {
  assert.doesNotMatch(src + Object.values(demos).join(""), mark, `borrowed credit must not ship: ${mark}`)
}

// ---- 6. Demos and wiring ---------------------------------------------------
for (const [name, d] of Object.entries(demos)) {
  assert.ok(d.includes('from "@/components/ui/dragon-seal-preloader"'), `${name} imports the canonical path`)
  assert.doesNotMatch(d, /href=/, `${name} must not navigate: the workshop routes on the hash`)
}
assert.match(demos.demo, /<DragonSealPreloader\s*\/>/, "default demo is the component, untouched")
assert.doesNotMatch(demos.demo, /<div/, "default demo must not wrap the component")
assert.match(demos["demo-jade"], /progress=\{loaded\}/, "one demo drives real progress")
assert.match(demos["demo-paper"], /tone="paper"/, "one demo shows the light tone")
assert.ok(
  tsconfig.includes('"@/components/ui/dragon-seal-preloader": ["./components/dragon-seal-preloader/dragon-seal-preloader.tsx"]'),
  "tsconfig maps the canonical import for npm run check",
)

console.log("dragon-seal-preloader: ok")
