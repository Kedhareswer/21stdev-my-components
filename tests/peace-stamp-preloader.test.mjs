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
assert.match(css, /\.psp-ring \{ transform-origin: 50% 50%; will-change: transform/, "the ring turns on the compositor")
assert.match(css, /\.psp-hand \{[^}]*will-change: transform/, "the hands slide on the compositor")
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
const holes = m.pspPerforation(800, 540, 22.5)
assert.ok(holes.length > 100, "a hole every tooth round the sheet")
assert.ok(holes.every(([x, y]) => x === 0 || y === 0 || x === 800 || y === 540), "holes sit on the edge")
assert.ok(holes.some(([x]) => x === 800) && holes.some(([, y]) => y === 540), "the far edges are punched too")
const perf = m.pspPerforationPath(800, 540, holes, 7.2)
checkPath(perf, "perforation")
assert.equal((perf.match(/a7\.2 7\.2/g) || []).length, holes.length * 2, "two arcs per hole")
assert.match(perf, /M0 518L0 540L22 540Z$/, "the torn tooth is the last subpath")

// scrollwork: tapered ribbons, spirals, S-scrolls, the lyre and the fleur
const spiral = m.pspSpiral([0, 0], 20, 0, 1, 1)
const radii = spiral.map(([x, y]) => Math.hypot(x, y))
assert.ok(radii.every((r, i) => i === 0 || r < radii[i - 1]), "a spiral winds inward")
checkPath(m.pspRibbon([[0, 0], [10, 0], [20, 5]], 1, 4, 1), "ribbon")
assert.equal(m.pspRibbon([[0, 0]], 1, 2, 1), "", "a single point is no ribbon")
const ss = m.pspSScroll([0, 0], [40, 40], 10, 12, 1, 6)
checkPath(ss.d, "S-scroll")
assert.equal(ss.eyes.length, 2, "an S-scroll has an eye at each end")
const lyre = m.pspLyre()
assert.equal(lyre.scrolls.length, 4, "the lyre is two S-scrolls and two small ones")
for (const d of [...lyre.scrolls, ...lyre.leaves]) checkPath(d, "lyre")
assert.ok(lyre.eyes.every((p) => p.every(Number.isFinite)), "the lyre's eyes are finite")
const xs = lyre.scrolls.join(" ").match(/-?[\d.]+(?= )/g).map(Number)
assert.ok(Math.max(...xs) > 20 && Math.min(...xs) < -20, "the lyre is mirrored about its axis")
const fleur = m.pspFleur()
for (const d of [...fleur.wings, fleur.drop]) checkPath(d, "fleur")
checkPath(m.pspDrop([0, 0], [0, -20], 8, 2), "drop")

// the petals morph from a bud to an open petal
const bud = m.pspPetal(0)
const open = m.pspPetal(1)
checkPath(bud, "bud petal")
checkPath(open, "open petal")
assert.notEqual(bud, open, "the petal changes shape")
const coords = (d) => [...d.matchAll(/(-?[\d.]+) (-?[\d.]+)/g)].map((p) => [+p[1], +p[2]])
const widest = (d) => Math.max(...coords(d).map((p) => Math.abs(p[0])))
const tallest = (d) => Math.max(...coords(d).map((p) => -p[1]))
assert.ok(widest(open) > widest(bud) * 3, "the open petal is far wider than the bud")
assert.ok(tallest(open) > tallest(bud) * 1.8, "and longer")
for (const v of m.pspPetalLines(1)) checkPath(v, "petal line")
assert.equal(m.pspPetalLines(0.5).length, 9, "nine engraved lines a petal")
const flower = m.pspFlower(1)
assert.equal(flower.length, 5, "five petals")
const spread = (fl) => Math.abs(fl[0].angle - fl[4].angle)
assert.ok(spread(m.pspFlower(1)) > 250 && spread(m.pspFlower(0)) < 90, "the petals fan out as the flower opens")
for (const pt of flower) checkPath(pt.d, "petal")

// a serrated leaf and its veins
const leaf = m.pspLeaf(48, 24, 13, 3)
checkPath(leaf, "leaf")
assert.equal(m.pspLeaf(48, 24, 13, 3), leaf, "the same seed cuts the same leaf")
for (const v of m.pspLeafLines(48, 24)) checkPath(v, "vein")

// ---- 3b. The hands: the fresco's, embedded, tinted by the palette ------------
// They are Michelangelo's (public domain), cut out and stored as WebP data
// URIs in the file itself, so nothing is fetched and the file still travels alone.
for (const name of ["PSP_HAND_L", "PSP_HAND_R"]) {
  const m2 = src.match(new RegExp("const " + name + " =\\s*\"data:image/webp;base64,([A-Za-z0-9+/=]+)\""))
  assert.ok(m2, `${name} is an embedded WebP data URI`)
  const bytes = Buffer.from(m2[1], "base64")
  assert.equal(bytes.subarray(0, 4).toString("ascii"), "RIFF", `${name} decodes to a RIFF container`)
  assert.equal(bytes.subarray(8, 12).toString("ascii"), "WEBP", `${name} is WebP`)
  assert.ok(bytes.length > 8000 && bytes.length < 40000, `${name} stays small (${bytes.length} bytes)`)
  assert.equal(bytes.readUInt32LE(4) + 8, bytes.length, `${name} is a complete file`)
}
assert.ok(src.includes("public domain"), "the hands' provenance is recorded in the file")
assert.ok(src.includes('<feComponentTransfer result="t">') && src.includes('type="table" tableValues={table(0)}'), "a gradient map tints the hands")
assert.ok(src.includes("hex(C.skinDark)") && src.includes("hex(C.skinLight)"), "the tint comes from the palette")
const hands = src.match(/l: \{ w: (\d+), h: (\d+), tip: \[(\d+), (\d+)\], at: \[(\d+), (\d+)\][^}]*\},\s*r: \{ w: (\d+), h: (\d+), tip: \[(\d+), (\d+)\], at: \[(\d+), (\d+)\]/)
assert.ok(hands, "both hands are placed")
const [lw, lh, ltx, lty, lax, lay, rw, rh, rtx, rty, rax, ray] = hands.slice(1).map(Number)
assert.ok(ltx > lw * 0.9 && rtx < rw * 0.1, "the left hand reaches right, the right hand reaches left")
assert.ok(lty < lh && rty < rh, "fingertips lie inside their images")
const gap = Math.hypot(rax - lax, ray - lay)
assert.ok(gap > 15 && gap < 60, `the fingertips almost meet, as in the fresco (gap ${gap.toFixed(1)})`)
assert.ok(lax > 300 && rax < 460, "the touch is in the middle of the disc")

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
