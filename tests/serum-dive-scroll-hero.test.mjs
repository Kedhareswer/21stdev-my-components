// Install-safety and motion check for components/serum-dive-scroll-hero.
// Run: node tests/serum-dive-scroll-hero.test.mjs
//
// The first half asserts the rules that only fail once the file is installed
// elsewhere. The second half lifts the "// #region motion" block out of the
// component and runs it: lines never overlap mid-swap, the camera is
// continuous, the dropper only lifts at the end, and the pill docks in the nav.
import assert from "node:assert/strict"
import { readFileSync, statSync } from "node:fs"

const src = readFileSync(new URL("../components/serum-dive-scroll-hero/serum-dive-scroll-hero.tsx", import.meta.url), "utf8")
const demo = readFileSync(new URL("../components/serum-dive-scroll-hero/demo.tsx", import.meta.url), "utf8")
const tsconfig = readFileSync(new URL("../tsconfig.json", import.meta.url), "utf8")

// --- install safety -------------------------------------------------------
assert.match(src, /height = "100svh"/, "stage height defaults to a definite length")
assert.ok(src.includes('style={{ height, width: "100%" }}'), "the sticky stage carries the height prop")
assert.ok(src.includes('"calc(" + height + " * " + (screens + 1) + ")"'), "the pin length is a definite multiple of the stage")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")
assert.doesNotMatch(src, /@import/, "no @import")
assert.doesNotMatch(src, /`/, "no backticks in the file")
assert.doesNotMatch(src, /\$\{/, "no ${ in the file")
assert.doesNotMatch(src, /useRef</, "no useRef generics")
assert.doesNotMatch(src, /(^|[{}"])\s*(\*|body|html|:root)\s*\{/m, "no bare global resets")
assert.ok(Buffer.byteLength(src) < 200 * 1024, "21st rejects component files over 200 kB")
assert.match(demo, /from "@\/components\/ui\/serum-dive-scroll-hero"/, "demo imports the installed path")
assert.ok(tsconfig.includes('"@/components/ui/serum-dive-scroll-hero"'), "tsconfig needs its paths line")
assert.doesNotMatch(src, /serum-product-card/, "independent of the product card")
assert.ok(!/var\(--color-/.test(src), "assumes no theme tokens: the scene is its own palette")
const imports = src.match(/^import .* from "([^"]+)"/gm) || []
assert.deepEqual(imports.map((l) => l.replace(/.*from "/, "").replace(/"$/, "")), ["react"], "React is the only import")

// Preflight guards and no enlarging with transforms.
assert.ok(src.includes(".sdh-root img{max-width:none"), "CSS guard against img max-width:100%")
assert.equal((src.match(/maxWidth: "none"/g) || []).length, 8, "inline guard on every picture")
assert.doesNotMatch(src, /scale\(/, "nothing is enlarged with transform: scale; pictures are laid out at their on-screen size")
assert.ok(src.includes("el.style.width = px(w)") && src.includes("el.style.height = px(h)"), "pictures get their on-screen size each frame")
assert.ok(src.includes("wordEl.style.fontSize = px(fs)"), "the word grows by font size, not by scaling")

// Pictures come from the catalog site and exist locally.
assert.ok(src.includes('"https://kedhar-components.pages.dev/serum-dive-scroll-hero/"'), "image base is the catalog")
const hosts = new Set((src.match(/https:\/\/[a-z0-9.-]+/gi) || []).map((u) => u.toLowerCase()))
for (const h of hosts) assert.ok(["https://kedhar-components.pages.dev", "https://fonts.googleapis.com"].includes(h), "unexpected host " + h)
for (const n of ["wall-dry", "wall-wet", "bottle", "dropper", "bottle-shadow", "dropper-shadow"]) {
  assert.ok(src.includes('"' + n + '.webp"'), "uses " + n)
  assert.ok(statSync(new URL("../dev/public/serum-dive-scroll-hero/" + n + ".webp", import.meta.url)).size > 1000, n + ".webp present")
}

// No identifiers from the reference.
for (const banned of [/clair/i, /ascenta/i, /instagram/i, /2500\$/]) assert.doesNotMatch(src, banned, "no reference identifiers: " + banned)
assert.ok(src.includes('brand = "KEDHAR"'), "placeholder wordmark is Kedhareswer's")

// Motion rules.
assert.ok(src.includes("prefers-reduced-motion: reduce") && src.includes("@media (prefers-reduced-motion:reduce)"), "honours reduced motion in JS and CSS")
assert.ok(src.includes('height: reduced ? height :'), "reduced motion does not pin")
assert.ok(src.includes("const ease = 1 - Math.pow(1 - 0.12, dt / 16.67)"), "scroll input is eased, frame-rate independent")
assert.ok(src.includes("new IntersectionObserver") && src.includes("document.hidden"), "the loop pauses off screen and in hidden tabs")
assert.ok(src.includes('fonts.load("600 expanded 100px Archivo")') && src.includes('fonts.addEventListener("loadingdone", bump)'), "measures the word only once its face has loaded")
assert.ok(src.includes(".sdh-root:not([data-ready=true]) .sdh-word"), "the word stays hidden until measured")
assert.ok(src.includes('s.style.visibility = o < 0.002 ? "hidden" : "visible"'), "visibility only flips once a letter is fully transparent")
assert.ok(src.includes("maskImage: fog.mask") && src.includes("mask='url(#m)'"), "the fog is an alpha mask with the wordmark wiped out")
assert.ok(src.includes("clipPath = \"inset(\" + px(Math.max(0, lineY))"), "the water rises as a clip on the wet wall")

// --- the motion, executed ---------------------------------------------------
const start = src.indexOf("// #region motion")
const end = src.indexOf("// #endregion motion")
assert.ok(start > 0 && end > start, "motion region present")
const body = src
  .slice(start, end)
  .replace(/export interface \w+ \{[^}]*\}/g, "")
  .replace(/export /g, "")
  .replace(/\): CamKey \{/g, ") {")
  .replace(/: (number\[\]|number|CamKey\[\])/g, "")
const m = new Function(body + "\nreturn { T, clamp01, span, easeInOut, easeOut, mix, beatState, SHEET, camAt, pillY }")()

// The story windows run forward and stay inside the pin.
const windows = [m.T.introOut, m.T.fog, m.T.wordIn, m.T.water, m.T.prefixOut, m.T.cam1, m.T.wordOut, m.T.cam2, m.T.cam3]
for (const w of windows) assert.ok(w[0] >= 0 && w[1] <= 1 && w[1] > w[0], "window " + w)
assert.ok(m.T.wordIn[0] >= m.T.introOut[0] && m.T.water[0] >= m.T.wordIn[1], "fog clears and the word lands before the water rises")
assert.ok(m.T.prefixOut[1] <= m.T.cam1[0], "the prefix is gone before the camera pushes in")
assert.ok(m.T.cam3[0] >= m.T.cam2[1], "the dropper lifts only after the close-up")

// Each line leaves before the next one arrives (staggered, never overlapping).
for (let i = 0; i < m.T.beats.length - 1; i++) {
  assert.ok(m.T.beats[i][3] <= m.T.beats[i + 1][0], "line " + i + " has left before line " + (i + 1) + " enters")
  for (let p = 0; p <= 1; p += 0.002) {
    const a = m.beatState(p, m.T.beats[i]).o
    const b = m.beatState(p, m.T.beats[i + 1]).o
    assert.ok(a < 0.001 || b < 0.001, "lines " + i + " and " + (i + 1) + " both visible at p=" + p.toFixed(3))
  }
}
assert.ok(m.T.introOut[1] <= m.T.beats[0][0], "the intro leaves before the first line")
// Lines rest sharp and in place.
for (const w of m.T.beats) {
  const s = m.beatState((w[1] + Math.min(w[2], 1)) / 2, w)
  assert.equal(s.o, 1)
  assert.equal(s.blur, 0)
  assert.equal(s.y, 0)
}

// The camera is continuous: no jumps between consecutive 1/1000 steps.
const keys = [
  { z: 1, x: 0.525, by: 0.855 },
  { z: 1.25, x: 0.4, by: 0.925 },
  { z: 1.6, x: 0.56, by: 1.25 },
  { z: 1.6, x: 0.6, by: 1.375 },
]
let prev = m.camAt(0, keys, 0.52, 0.42)
for (let i = 1; i <= 1000; i++) {
  const c = m.camAt(i / 1000, keys, 0.52, 0.42)
  assert.ok(Math.abs(c.z - prev.z) < 0.01 && Math.abs(c.x - prev.x) < 0.01 && Math.abs(c.by - prev.by) < 0.02, "camera jumps at " + i / 1000)
  prev = c
}
assert.deepEqual(m.camAt(0, keys, 0.52, 0.42), { z: 1, x: 0.52, by: 0.855 }, "starts on the word's junction")
assert.deepEqual(m.camAt(1, keys, 0.52, 0.42), { z: 1.6, x: 0.6, by: 1.375 }, "ends on the close-up")
const mid = m.camAt(m.T.cam1[1] + 0.001, keys, 0.52, 0.42)
assert.ok(Math.abs(mid.x - 0.42) < 1e-9 && mid.z === 1.25, "after the push-in the bottle stands at the re-centred word's junction")

// The shortened dropper clears the neck at full lift.
const pipe = m.SHEET.dropper.h - m.SHEET.dropper.collar
assert.ok(m.SHEET.lift >= pipe + m.SHEET.neckTop - (m.SHEET.total - m.SHEET.bottle.h) - 20, "the pipette tip reaches the neck")

// The pill rides its line, then sticks in the nav row.
assert.equal(m.pillY(500, 0, 11), 500)
assert.equal(m.pillY(500, 300, 11), 200)
assert.equal(m.pillY(500, 900, 11), 11)

console.log("serum-dive-scroll-hero: all checks passed")
