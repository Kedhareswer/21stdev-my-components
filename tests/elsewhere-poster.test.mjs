// Install-safety and geometry checks for components/elsewhere-poster.
// Run: node tests/elsewhere-poster.test.mjs
//
// The painting is canvas and can't be asserted here. What can, and what breaks
// silently, is everything that frames it: a sheet path whose tab doesn't move
// with the slider leaves a sliver of black between paper and painting, a title
// layout that ignores long words runs into the globes, and a scramble that never
// lands leaves the destination spelled in random letters.
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const SLUG = "elsewhere-poster"
const read = (file) => readFileSync(new URL("../components/" + SLUG + "/" + file, import.meta.url), "utf8").replace(/\r\n/g, "\n")
const src = read(SLUG + ".tsx")

/* ---------- nothing travels with it ---------- */

const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "react is the only import")
assert.doesNotMatch(src, /@import|@font-face|<link\b|fetch\(|new Image\(/, "nothing loads at runtime")
assert.doesNotMatch(src, /https?:\/\//, "no external URL: the capture sandbox blocks other origins")
assert.doesNotMatch(src, /[`]/, "no backticks: CSS is built by concatenation")
assert.doesNotMatch(src, /\$\{/, "no template interpolation")
assert.doesNotMatch(src, /useState</, "hook types written without generics (21st CLI tokenizer)")
assert.doesNotMatch(src, /useRef</, "hook types written without generics (21st CLI tokenizer)")

const css = src.match(/const CSS = \[([\s\S]*?)\]\.join\(""\)/)
assert.ok(css, "CSS block present")
const rules = [...css[1].matchAll(/"([^"]*)"/g)].map((m) => m[1]).join("")
assert.doesNotMatch(rules, /url\(/, "no url() in the style block")
for (const m of rules.replace(/@keyframes [\w-]+\{(?:[^{}]*\{[^}]*\})*\s*\}/g, "").replace(/@media[^{]*\{/g, "").matchAll(/(?<=^|[{}])\s*([^{}@]+?)\s*\{/g)) {
  for (const s of m[1].split(/,(?![^(]*\))/)) assert.match(s.trim(), /^\.ew-/, "selector escapes the component: " + s.trim())
}
assert.ok(rules.includes("@media (prefers-reduced-motion:reduce)"), "honours reduced motion in CSS")
assert.match(src, /matchMedia\("\(prefers-reduced-motion: reduce\)"\)/, "and in script")
assert.match(src, /const motion = animate && !reduced/, "reduced motion stops the decorative motion")

// Sized by width and a square ratio, never a percentage height on the root.
assert.match(src, /aspectRatio: "1 \/ 1"/, "the poster keeps its square")
assert.match(src, /\.ew-root\{position:relative;width:100%/, "root has a width, so a flex parent can't collapse it")
assert.doesNotMatch(src, /\bh-(full|screen)\b/, "no percentage height classes")

// Preflight: img/svg/canvas get max-width:100%, which the full-bleed layers opt out of.
assert.ok((src.match(/maxWidth: "none"/g) || []).length >= 3, "full-bleed layers opt out of max-width")
assert.match(rules, /\.ew-svg\{[^}]*max-width:none/, "the overlay svg opts out too")

// ids are per instance; two posters on a page must not share paths.
assert.match(src, /sid\(React\.useId\(\)\)/, "svg ids are namespaced per mount")

// Everything allocated is released.
for (const gone of ["ro.disconnect()", "io?.disconnect()", "cancelAnimationFrame(raf)", 'removeEventListener("change", onMq)', "window.clearTimeout(t)"]) {
  assert.ok(src.includes(gone), "cleanup is missing " + gone)
}

/* ---------- it's operable ---------- */

assert.match(src, /role="slider"/, "the window is a slider")
assert.ok(src.includes('e.key === "ArrowDown"') && src.includes('e.key === "Home"'), "and answers the keyboard")
assert.match(src, /touch-action:pan-y/, "the page still scrolls over it on touch")
assert.equal((src.match(/role="button"/g) || []).length, 2, "title and globes are buttons (globe() renders twice)")
assert.match(src, /aria-live="polite"/, "travelling is announced")
assert.match(src, /<h2 className="ew-sr">/, "the destination exists as text")

/* ---------- demos ---------- */

for (const demo of ["demo.tsx", "demo-custom.tsx"]) {
  const d = read(demo)
  assert.ok(d.includes('from "@/components/ui/' + SLUG + '"'), demo + " imports the installed path")
  const first = d.match(/return \(\s*<div className="([^"]*)"/)
  assert.ok(first && /\bw-full\b/.test(first[1]), demo + " wraps the poster without a width")
}

/* ---------- logic, executed ---------- */

const a = src.indexOf("// #region logic\n")
const b = src.indexOf("// #endregion logic\n")
assert.ok(a > -1 && b > a, "logic region missing")
const code =
  src.slice(a, b).replace(/import type[^\n]*\n/g, "") +
  "\nexport { clamp, rng, hash, wrap, G, gateShift, gatePaths, barcode, layoutTitle, scramble, arcPath, fit, ringFit, ringPath, sparkle, tri, ridge, yAt, hexRgb, mix, luminance, SCENES, paletteOf }\n"
const L = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(code)))

// rng is seeded and in range
{
  const x = L.rng(7)
  const y = L.rng(7)
  assert.equal(x(), y(), "rng is seeded")
  assert.ok([...Array(500)].map(L.rng(3)).every((v) => v >= 0 && v < 1))
  assert.equal(L.wrap(-1, 4), 3)
  assert.equal(L.wrap(9, 4), 1)
  assert.equal(L.wrap(2, 0), 0, "an empty list doesn't divide by zero")
}

// the slider maps onto the drop and stays inside it
{
  assert.equal(L.gateShift(0), L.G.sMin)
  assert.equal(L.gateShift(1), L.G.sMax)
  assert.equal(L.gateShift(-3), L.G.sMin, "clamped low")
  assert.equal(L.gateShift(9), L.G.sMax, "clamped high")
  // the bottom tab's contents sit at bottom + s + ~22; the credits start at 790
  assert.ok(L.G.bottom + L.G.sMax + 22 < 790, "a fully open window must not run into the credits")
  assert.ok(L.G.top + L.G.sMin - 38 > 186, "a closed window must not push the tagline into the labels")
}

// sheet outlines: closed, finite, and the tab moves with s while the sides don't
{
  const nums = (d) => d.match(/-?[\d.]+/g).map(Number)
  for (const s of [L.G.sMin, 40, 57, L.G.sMax]) {
    const { top, bottom } = L.gatePaths(s)
    for (const d of [top, bottom]) {
      assert.ok(/^M/.test(d) && d.endsWith("Z"), "closed path")
      assert.ok(nums(d).every(Number.isFinite), "finite numbers only")
      assert.ok(nums(d).every((n) => n >= 0 && n <= 1200), "stays on the card")
    }
    assert.ok(top.includes("L" + L.G.l1 + " " + (L.G.top + s)), "top tab drops by s")
    assert.ok(bottom.includes("L" + L.G.r1 + " " + (L.G.bottom + s)), "bottom tab drops by s")
    assert.ok(top.includes("L" + L.G.r0 + " " + L.G.top), "top shoulders stay put")
    assert.ok(bottom.includes("L" + L.G.l0 + " " + L.G.bottom), "bottom shoulders stay put")
  }
}

// barcodes: deterministic, inside their box, bars never touch
{
  const x = L.barcode("ELSEWHERE-46N", 58)
  assert.deepEqual(x, L.barcode("ELSEWHERE-46N", 58), "same text, same bars")
  assert.notDeepEqual(x, L.barcode("ELSEWHERE-47N", 58), "different text, different bars")
  assert.ok(x.length > 12, "enough bars to read as a barcode")
  for (let i = 0; i < x.length; i++) {
    assert.ok(x[i].x + x[i].w <= 58, "bar runs out of the box")
    if (i) assert.ok(x[i].x > x[i - 1].x + x[i - 1].w, "bars touch")
  }
  assert.ok(L.barcode("", 40).length > 0, "an empty code still prints")
}

// title: centred, ordered, and never wider than its room
{
  for (const word of ["Elsewhere", "Far Away", "I", "Wanderlust Forever", "Ωmega", ""]) {
    const t = L.layoutTitle(word, 600, 118, 0.03)
    assert.ok(t.size > 0 && t.size <= 118, "size within bounds for " + word)
    if (!t.letters.length) continue
    const first = t.letters[0]
    const last = t.letters[t.letters.length - 1]
    const span = last.x + last.w / 2 - (first.x - first.w / 2)
    assert.ok(span <= 600.5, word + " spills past its room: " + span)
    assert.ok(Math.abs(last.x + last.w / 2 + (first.x - first.w / 2)) < 0.5, word + " is centred")
    for (let i = 1; i < t.letters.length; i++) assert.ok(t.letters[i].x > t.letters[i - 1].x, "letters in order")
  }
  assert.equal(L.layoutTitle("I", 600, 118, 0.03).size, 118, "a short word is capped, not blown up")
  assert.ok(L.layoutTitle("WANDERLUST FOREVER", 600, 118, 0.03).size < 60, "a long word shrinks to fit")
}

// the split-flap lands, keeps spaces, and starts left to right
{
  const r = L.rng(1)
  assert.equal(L.scramble("FAR AWAY", 99999, 55, 260, r), "FAR AWAY", "it lands")
  const mid = L.scramble("FAR AWAY", 300, 55, 260, r)
  assert.equal(mid.length, 8, "same length while turning")
  assert.equal(mid[3], " ", "spaces never turn")
  assert.equal(mid[0], "F", "the first letter lands first")
  assert.match(L.scramble("NOWHERE", 0, 55, 260, r), /^[A-Z]{7}$/, "turning letters are capitals")
}

// arcs and marks produce clean path data
{
  const top = L.arcPath(600, 940, 145, Math.PI * 1.258, Math.PI * 1.742, false)
  const bot = L.arcPath(600, 412, 600, Math.PI * 0.64, Math.PI * 0.36, true)
  assert.match(top, /^M[\d. ]+A[\d. ]+ 0 0 1 [\d. ]+$/, "the top arc reads over the top")
  assert.match(bot, /^M[\d. ]+A[\d. ]+ 0 0 0 [\d. ]+$/, "the bottom arc is a smile")
  const [x1, y1] = top.slice(1).split("A")[0].split(" ").map(Number)
  assert.ok(x1 < 600 && y1 < 900, "the top arc starts left and above the title")
  const ys = bot.match(/[\d.]+/g).map(Number)
  assert.ok(ys[1] > 940 && ys[1] < 1000, "the bottom arc sits under the title")
  assert.match(L.ringPath(150, 150, 34), /^M116 150a34 34 0 1 1 68 0a34 34 0 1 1 -68 0$/)
  assert.ok(L.sparkle(10, 10, 5).endsWith("Z"))
  assert.ok(L.tri(10, 10, true).endsWith("Z") && L.tri(10, 10, false).endsWith("Z"))
  assert.deepEqual(L.fit("SHORT", 8, 0.3, 500), {}, "short captions are left alone")
  assert.equal(L.fit("X".repeat(200), 8, 0.3, 500).textLength, 500, "long captions are squeezed to fit")
  assert.equal(L.ringFit("HI", 8, 0.3, 200).lengthAdjust, "spacing", "a short ring spreads its spacing")
  assert.equal(L.ringFit("X".repeat(80), 8, 0.3, 200).lengthAdjust, "spacingAndGlyphs", "a long ring squeezes")
}

// the painting's helpers
{
  const pts = L.ridge(5, [0, 100], [400, 300], 5, 60)
  assert.equal(pts.length, 33, "2^5 + 1 points")
  assert.deepEqual(pts[0], [0, 100])
  assert.deepEqual(pts[pts.length - 1], [400, 300])
  for (let i = 1; i < pts.length; i++) assert.ok(pts[i][0] > pts[i - 1][0], "y-jitter keeps x sorted")
  assert.deepEqual(L.ridge(5, [0, 100], [400, 300], 5, 60), pts, "deterministic")
  assert.equal(L.yAt([[0, 0], [10, 10]], 5), 5)
  assert.equal(L.yAt([[0, 0], [10, 10]], -5), 0, "clamped left")
  assert.equal(L.yAt([[0, 0], [10, 10]], 50), 10, "clamped right")
  assert.deepEqual(L.hexRgb("#fff"), [255, 255, 255])
  assert.deepEqual(L.hexRgb("1c1b19"), [28, 27, 25])
  assert.deepEqual(L.hexRgb("nope"), [128, 128, 128], "a bad colour is grey, not NaN")
  assert.equal(L.mix("#000000", "#ffffff", 0.5, 0.3), "rgba(128,128,128,0.3)")
  assert.ok(L.luminance(L.SCENES.night.skyTop) < 0.25, "night gets stars")
  assert.ok(L.luminance(L.SCENES.golden.skyTop) > 0.25, "golden does not")
  const keys = Object.keys(L.SCENES.golden).sort()
  for (const [name, p] of Object.entries(L.SCENES)) {
    assert.deepEqual(Object.keys(p).sort(), keys, name + " palette is complete")
    for (const v of Object.values(p)) assert.match(v, /^#[0-9a-f]{6}$/i, name + " has a bad colour " + v)
  }
  assert.equal(L.paletteOf(undefined), L.SCENES.golden)
  assert.equal(L.paletteOf("dusk"), L.SCENES.dusk)
  assert.equal(L.paletteOf("bogus"), L.SCENES.golden, "an unknown preset falls back")
  const custom = L.paletteOf({ water: "#00ff00" })
  assert.equal(custom.water, "#00ff00", "custom colours win")
  assert.equal(custom.pine, L.SCENES.golden.pine, "and the rest come from golden")
}

console.log("elsewhere-poster: ok")
