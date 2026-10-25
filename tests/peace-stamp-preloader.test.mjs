// Install-safety, timeline and artwork checks for peace-stamp-preloader.
// Run: node tests/peace-stamp-preloader.test.mjs

import assert from "node:assert/strict"
import { readFileSync, readdirSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const dir = new URL("../components/peace-stamp-preloader/", import.meta.url)
const read = (f) => readFileSync(new URL(f, dir), "utf8").replace(/\r\n/g, "\n")
const src = read("peace-stamp-preloader.tsx")
const demos = Object.fromEntries(["demo", "demo-gate", "demo-cobalt"].map((n) => [n, read(n + ".tsx")]))
const tsconfig = readFileSync(new URL("../tsconfig.json", import.meta.url), "utf8")

// ---- 1. Install safety -----------------------------------------------------
assert.deepEqual(
  readdirSync(dir).sort(),
  ["README.md", "demo-cobalt.tsx", "demo-gate.tsx", "demo.tsx", "peace-stamp-preloader.tsx"],
  "the folder ships the component, its demos and a README, nothing else",
)
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "react is the only import")
assert.doesNotMatch(src, /@import/, "no @import: faces come from the host or the fallback stacks")
assert.doesNotMatch(src, /https?:\/\/(?!www\.w3\.org\/2000\/svg)/, "nothing is fetched: every mark is drawn in the file")
assert.ok(src.includes('height = "100svh"'), "height defaults to a definite length")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")
assert.ok(src.includes("prefers-reduced-motion"), "honours reduced motion")
assert.ok(src.includes('role="progressbar"') && src.includes("aria-valuenow={pct}"), "reports progress")
assert.ok(src.includes('toggleAttribute("inert"'), "the guarded page cannot take focus under the gate")
assert.ok(src.includes("onCompleteRef.current"), "calls onComplete through a ref")
assert.doesNotMatch(src, /\}, \[[^\]]*\bonComplete\b[^\]]*\]\)/, "effects must not depend on onComplete identity")
assert.ok(src.includes("cancelAnimationFrame(raf)"), "the frame loop is torn down on unmount")
assert.ok(src.includes("ro.disconnect()"), "the resize observer is torn down")
assert.ok(src.includes('mq.removeEventListener("change", set)'), "the motion query listener is torn down")
assert.doesNotMatch(src, /console\./, "no debug logging ships")
assert.doesNotMatch(src, /use(State|Ref|Memo|Callback)</, "no generic hook type arguments (the 21st CLI tokenizer hangs on them)")
const generic = src.slice(0, src.indexOf("</")).match(/Partial<|Record<|ReturnType<|React\.[A-Za-z]+</)
assert.equal(generic, null, "no generics before the first JSX close tag: " + (generic && generic[0]))
// Everything that moves every frame is written to the DOM directly, never through state.
assert.doesNotMatch(src, /setState\(/, "no per-frame setState")
assert.ok(src.includes("React.useId()"), "SVG ids are unique per instance")
// The guarded page must not inherit the read-out's face.
assert.doesNotMatch(src, /className=\{"psp-root[^}]*\}\s*\n\s*style=\{\{ height, fontFamily/, "the root carries no font; only the stage does")
assert.ok(src.includes("fontFamily: monoFamily"), "the stage sets the read-out face")

// ---- 2. Scoped CSS ---------------------------------------------------------
const css = src.match(/const PSP_CSS = `([\s\S]*?)`/)[1]
assert.doesNotMatch(css, /\$\{|`/, "no interpolation or backticks in the CSS string")
assert.doesNotMatch(css, /^\s*(\*|body|html|:root)\s*\{/m, "no bare global resets")
assert.match(css, /\.psp-root svg, \.psp-root canvas, \.psp-root img \{ max-width: none; \}/, "media overrides Preflight's max-width")
let rules = 0
for (const m of css.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/(?<=^|[{}])\s*([^{}]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (sel.startsWith("@") || /^(from|to|[\d.]+%)/.test(sel)) continue
  rules++
  assert.ok(sel.split(",").every((s) => s.trim().startsWith(".psp-")), "unscoped selector would leak into the host app: " + sel)
}
assert.ok(rules >= 40, `expected a full scoped sheet, saw ${rules} rules`)
for (const k of css.matchAll(/@keyframes ([\w-]+)/g)) assert.ok(k[1].startsWith("psp-"), "unprefixed keyframes: " + k[1])
for (const phase of ["enter", "load", "touch", "cancel", "exit", "done"]) assert.ok(css.includes(`[data-phase="${phase}"]`), `phase ${phase} is styled`)
const reduced = css.slice(css.indexOf("@media (prefers-reduced-motion: reduce)"))
assert.match(reduced, /\.psp-sheen \{ animation: none/, "the sheen holds still under reduced motion")
assert.match(reduced, /\.psp-root\[data-phase="exit"\] \.psp-tilt[^{]*\{ animation: psp-fade/, "the lift becomes a fade under reduced motion")
assert.match(css, /mask-size: 100% 100%/, "the perforation mask fits the sheet")

// ---- 3. The art region, executed -------------------------------------------
const a = src.indexOf("// #region art")
const b = src.indexOf("// #endregion")
assert.ok(a > -1 && b > a, "art region missing")
const m = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes("type Pt = [number, number]\n" + src.slice(a, b))))

const PATH = /^[MLCQAZHVahv0-9 .\-]+$/
const checkPath = (d, where) => {
  assert.equal(typeof d, "string", `${where} is a string`)
  assert.ok(d.length > 0, `${where} is not empty`)
  assert.doesNotMatch(d, /NaN|Infinity|undefined/, `${where} has no NaN`)
  assert.match(d, PATH, `${where} is plain path data`)
  assert.match(d, /^M/, `${where} starts with a move`)
}

// the simulated load never runs backwards and stalls twice
assert.equal(m.pspSimulated(-1), 0)
assert.equal(m.pspSimulated(0), 0)
assert.equal(m.pspSimulated(1), 1)
assert.equal(m.pspSimulated(3), 1)
let prev = 0
for (let i = 1; i <= 500; i++) {
  const v = m.pspSimulated(i / 500)
  assert.ok(v >= prev - 1e-9, `simulated progress must never run backwards (t=${i / 500})`)
  assert.ok(v >= 0 && v <= 1, "simulated progress stays in range")
  prev = v
}
assert.ok(m.pspSimulated(0.4) - m.pspSimulated(0.3) < m.pspSimulated(0.2) - m.pspSimulated(0.1), "the first stall slows the climb")

// easing
assert.equal(m.pspClamp(5, 0, 1), 1)
assert.equal(m.pspClamp(-5, 0, 1), 0)
assert.equal(m.pspSmoothstep(0, 1, 0.5), 0.5)
assert.equal(m.pspSmoothstep(2, 4, 1), 0)
assert.equal(m.pspSmoothstep(2, 4, 9), 1)
assert.ok(m.pspEaseBack(0.8) > 1, "the back ease overshoots")
assert.equal(m.pspEaseBack(1), 1)
assert.equal(m.pspEaseBack(0), 0)

// the face value counts up with the load
assert.equal(m.pspMoney(0.68, "€", ",", 1), "€0,68")
assert.equal(m.pspMoney(0.68, "€", ",", 0), "€0,00")
assert.equal(m.pspMoney(0.68, "€", ",", 0.5), "€0,34")
assert.equal(m.pspMoney(0.5, "$", ".", 1), "$0.50")
assert.equal(m.pspMoney(2, "£", ".", 1), "£2")
assert.equal(m.pspMoney(-3, "€", ",", 1), "€0", "no negative values")

// deterministic noise
const r1 = m.pspRng(9)
const r2 = m.pspRng(9)
const seq = Array.from({ length: 40 }, () => r1())
assert.deepEqual(seq, Array.from({ length: 40 }, () => r2()), "the same seed gives the same grains")
assert.ok(seq.every((v) => v >= 0 && v < 1), "rng stays in [0, 1)")
assert.notDeepEqual(seq, Array.from({ length: 40 }, m.pspRng(10)))

// splines and arcs
checkPath(m.pspSmooth([[0, 0], [10, 0], [10, 10]], true), "smooth closed")
assert.match(m.pspSmooth([[0, 0], [10, 0], [10, 10]], true), /Z$/, "closed splines close")
assert.doesNotMatch(m.pspSmooth([[0, 0], [10, 0], [10, 10]], false), /Z$/, "open splines stay open")
assert.equal(m.pspSmooth([[0, 0]], false), "", "a single point is no path")
checkPath(m.pspArc(0, 0, 10, 0, 90), "arc")
assert.match(m.pspArc(0, 0, 10, 0, 90), /A10 10 0 0 1 /, "a short clockwise arc")
assert.match(m.pspArc(0, 0, 10, 200, 10), /A10 10 0 1 0 /, "a long counter-clockwise arc")

// perforation: holes on every edge, none inside, one evenodd path with the torn tooth
const holes = m.pspPerforation(760, 540, 24)
assert.ok(holes.length > 90, "a hole every tooth round the sheet")
assert.ok(holes.every(([x, y]) => x === 0 || y === 0 || x === 760 || y === 540), "holes sit on the edge")
assert.ok(holes.some(([x]) => x === 760) && holes.some(([, y]) => y === 540), "the far edges are punched too")
const perf = m.pspPerforationPath(760, 540, holes, 8.5)
checkPath(perf, "perforation")
assert.equal((perf.match(/a8\.5 8\.5/g) || []).length, holes.length * 2, "two arcs per hole")
assert.match(perf, /M0 516L0 540L24 540Z$/, "the torn tooth is the last subpath")

// guilloche and dots
const g = m.pspGuilloche(668, 9, 46, 0)
checkPath(g, "guilloche")
const ys = [...g.matchAll(/(-?[\d.]+) (-?[\d.]+)/g)].map((p) => +p[2])
assert.ok(Math.max(...ys) <= 9.5 && Math.min(...ys) >= -9.5, "the ribbon stays inside its band")
assert.deepEqual(m.pspDots(50, 20), [10, 30], "dots are centred in their steps")

// the petals morph from a bud to an open petal
const bud = m.pspPetal(0)
const open = m.pspPetal(1)
checkPath(bud, "bud petal")
checkPath(open, "open petal")
assert.notEqual(bud, open, "the petal changes shape")
const widest = (d) => Math.max(...[...d.matchAll(/(-?[\d.]+) (-?[\d.]+)/g)].map((p) => Math.abs(+p[1])))
const tallest = (d) => Math.max(...[...d.matchAll(/(-?[\d.]+) (-?[\d.]+)/g)].map((p) => -+p[2]))
assert.ok(widest(open) > widest(bud) * 3, "the open petal is far wider than the bud")
assert.ok(tallest(open) > tallest(bud) * 2, "and longer")
for (const v of m.pspVeins(1)) checkPath(v, "vein")
assert.equal(m.pspVeins(0.5).length, 3, "three veins a petal")
const flower = m.pspFlower(1)
assert.equal(flower.length, 5, "five petals")
const spread = (fl) => Math.abs(fl[0].angle - fl[4].angle)
assert.ok(spread(m.pspFlower(1)) > 250 && spread(m.pspFlower(0)) < 90, "the petals fan out as the flower opens")
for (const pt of flower) checkPath(pt.d, "petal")

// a serrated leaf
const leaf = m.pspLeaf(74, 26, 11, 3)
checkPath(leaf, "leaf")
assert.equal(m.pspLeaf(74, 26, 11, 3), leaf, "the same seed cuts the same leaf")

// hands: kinematics and marks
const fk = m.pspFk([0, 0], [10, 10], [0, 90])
assert.deepEqual(fk.map((p) => p.map(Math.round)), [[0, 0], [10, 0], [10, 10]], "forward kinematics walks the joints")
for (const e of [0, 0.5, 1]) {
  const o = m.pspHandOpen(e)
  const p = m.pspHandPinch(e)
  checkPath(o.palm, "open palm")
  checkPath(p.palm, "pinch palm")
  checkPath(o.highlight, "open highlight")
  assert.equal(o.fingers.length, 5, "four fingers and a thumb")
  assert.equal(p.fingers.length, 5)
  for (const f of [...o.fingers, ...p.fingers]) {
    assert.equal(f.pts.length, f.lens.length + 1, "a joint per segment plus the base")
    assert.ok(f.pts.every((pt) => pt.every(Number.isFinite)), "finite joints")
    const marks = m.pspFingerMarks(f)
    checkPath(marks.d, "finger")
    assert.equal(marks.highlights.length, f.lens.length, "a highlight per segment")
    assert.equal(marks.creases.length, f.lens.length, "a crease at the base and each joint")
    for (const h of marks.highlights) if (h) checkPath(h, "highlight")
    for (const c of marks.creases) checkPath(c, "crease")
    assert.ok(Number.isFinite(marks.nail.x) && Number.isFinite(marks.nail.a), "the nail has a place")
  }
}
const openFinal = m.pspHandOpen(1)
assert.ok(openFinal.tip[0] > 230, "the index reaches past the palm")
assert.ok(openFinal.tip[0] > m.pspHandOpen(0).tip[0], "the index straightens as the hand arrives")
const idx = openFinal.fingers[3]
assert.ok(idx.pts[3][1] < openFinal.fingers[2].pts[3][1], "the index is the highest finger")
const pinchFinal = m.pspHandPinch(1)
const thumbTip = m.pspFingerTip(pinchFinal.fingers[4])
const indexTip = m.pspFingerTip(pinchFinal.fingers[3])
assert.ok(Math.hypot(thumbTip[0] - pinchFinal.pinch[0], thumbTip[1] - pinchFinal.pinch[1]) < 40, "the pinch sits at the thumb's tip")
assert.ok(indexTip[0] > thumbTip[0], "the index reaches past the thumb")
assert.ok(thumbTip[1] < indexTip[1], "the thumb lies over the index")
const curled = pinchFinal.fingers[0]
assert.ok(curled.a[2] > 90, "the little finger curls back under")
assert.ok(m.pspHandPinch(0).fingers[0].a[2] < 90, "and opens out when relaxed")

// ---- 4. No borrowed marks --------------------------------------------------
// The look is after a postage stamp; the issuing body's name must not ship.
for (const mark of [/vereinte/i, /united\s*nations/i, /\bUN\b\s*2017/]) {
  assert.doesNotMatch(src + Object.values(demos).join(""), mark, `borrowed mark must not ship: ${mark}`)
}

// ---- 5. Demos and wiring ---------------------------------------------------
for (const [name, d] of Object.entries(demos)) {
  assert.ok(d.includes('from "@/components/ui/peace-stamp-preloader"'), `${name} imports the canonical path`)
  assert.doesNotMatch(d, /href=/, `${name} must not navigate: the workshop routes on the hash`)
}
assert.match(demos.demo, /<PeaceStampPreloader loop \/>/, "default demo is the looping showcase, untouched")
assert.doesNotMatch(demos.demo, /<div/, "default demo must not wrap the component")
assert.match(demos["demo-gate"], /progress=\{loaded\}/, "the gate demo drives real progress")
assert.match(demos["demo-gate"], /<main/, "the gate demo guards a page")
assert.match(demos["demo-cobalt"], /preset="cobalt"/, "one demo shows another printing")
assert.ok(
  tsconfig.includes('"@/components/ui/peace-stamp-preloader": ["./components/peace-stamp-preloader/peace-stamp-preloader.tsx"]'),
  "tsconfig maps the canonical import for npm run check",
)

console.log("peace-stamp-preloader: ok")
