// Install-safety and motion check for components/helix-ribbon-hero.
// Run: node tests/helix-ribbon-hero.test.mjs
//
// The first half asserts the rules that only fail once the file is installed
// elsewhere. The second half lifts the "// #region motion" block out of the
// component and runs it: the headline is gone before the ribbon leaves, the
// grid only lands once the ribbon has gone up, every card has landed before
// the grid scrolls, and autoplay never jumps.
import assert from "node:assert/strict"
import { readFileSync, statSync } from "node:fs"

const src = readFileSync(new URL("../components/helix-ribbon-hero/helix-ribbon-hero.tsx", import.meta.url), "utf8")
const demo = readFileSync(new URL("../components/helix-ribbon-hero/demo.tsx", import.meta.url), "utf8")
const tsconfig = readFileSync(new URL("../tsconfig.json", import.meta.url), "utf8")

// --- install safety -------------------------------------------------------
assert.match(src, /height = "100svh"/, "stage height defaults to a definite length")
assert.ok(src.includes('style={{ height, width: "100%" }}'), "the sticky stage carries the height prop")
assert.ok(src.includes('height: "calc(" + height + " * " + (screens + 1) + ")"'), "the pin length is a definite multiple of the stage")
assert.ok(!/\bh-full\b/.test(src), "no h-full")
assert.ok(!/@import/.test(src), "no @import")
assert.ok(!/`/.test(src), "no backticks in the file")
assert.ok(!/\$\{/.test(src), "no ${ in the file")
assert.ok(!/useRef</.test(src), "no useRef generics")
assert.ok(!/(^|[{}"])\s*(\*|body|html|:root)\s*\{/m.test(src), "no bare global resets")
assert.ok(Buffer.byteLength(src) < 200 * 1024, "21st rejects component files over 200 kB")
const imports = src.match(/^import .* from "([^"]+)"/gm) || []
assert.deepEqual(imports.map((l) => l.replace(/.*from "/, "").replace(/"$/, "")), ["react"], "React is the only import")
assert.ok(!/var\(--color-/.test(src), "assumes no theme tokens: the scene is its own palette")

// The demo, as 21st shows it: a full-width root in its flex shell, and the
// story playing on its own because nothing scrolls an unattended preview.
assert.match(demo, /from "@\/components\/ui\/helix-ribbon-hero"/, "demo imports the installed path")
assert.match(demo, /<main style=\{\{ width: "100%" \}\}>/, "the demo root fills 21st's flex shell")
assert.match(demo, /<HelixRibbonHero autoPlay \/>/, "the demo plays itself")
assert.doesNotMatch(demo, /https?:\/\//, "the demo links nowhere")
assert.ok(tsconfig.includes('"@/components/ui/helix-ribbon-hero": ["./components/helix-ribbon-hero/helix-ribbon-hero.tsx"]'), "tsconfig needs its paths line")

// Preflight guards, and nothing enlarged with transform: scale.
assert.ok(src.includes(".hrh-root img{max-width:none"), "CSS guard against img max-width:100%")
assert.equal((src.match(/<img /g) || []).length, 2, "two kinds of picture")
assert.equal((src.match(/maxWidth: "none"/g) || []).length, 2, "inline guard on every picture")
assert.equal((src.match(/<img [^>]*width=\{\d+\} height=\{\d+\}/g) || []).length, 2, "pictures carry intrinsic sizes")
assert.ok(!/scale\(/.test(src), "no transform: scale; flying cards are laid out at their on-screen size")
assert.ok(!/will-change/.test(src), "no will-change on layers that change size")
assert.ok(src.includes("img.style.width = px(w)") && src.includes("img.style.height = px(h)"), "flying cards get their on-screen size each frame")
assert.ok(src.includes("el.style.fontSize = px(f / s)"), "the headline is laid out larger by exactly what the perspective takes away")

// Pictures come from the catalogue site and exist locally, each once.
assert.ok(src.includes('const IMG = "https://kedhar-components.pages.dev/helix-ribbon-hero/"'), "image base is the catalogue")
const hosts = new Set((src.match(/https:\/\/[a-z0-9.-]+/gi) || []).map((u) => u.toLowerCase()))
for (const h of hosts) assert.ok(["https://kedhar-components.pages.dev", "https://fonts.googleapis.com"].includes(h), "unexpected host " + h)
const names = [...src.matchAll(/IMG \+ "([a-z0-9-]+\.webp)"/g)].map((m) => m[1])
assert.equal(names.length, 13, "twelve projects and a portrait")
assert.equal(new Set(names).size, 13, "no picture is used twice")
for (const n of names) {
  const size = statSync(new URL("../dev/public/helix-ribbon-hero/" + n, import.meta.url)).size
  assert.ok(size > 1000 && size < 200 * 1024, n + " present and small")
}

// No identifiers from the reference; placeholder copy is Kedhareswer's.
for (const banned of [/martin/i, /lucas/i, /marin/i, /hungr/i, /magist/i, /designbyshiv/i, /pixelcraft/i, /amelia/i, /barcelona/i, /vercel/i, /instagram/i, /framer/i]) {
  assert.doesNotMatch(src, banned, "no reference identifiers: " + banned)
  assert.doesNotMatch(demo, banned, "no reference identifiers in the demo: " + banned)
}
assert.ok(src.includes('brand = "Kedhareswer"') && src.includes("kedhareswer.12110626@gmail.com"), "placeholder copy is Kedhareswer's")
assert.ok(src.includes("Client 1, Client 2 and Client 3"), "placeholder clients")

// Motion and loading rules.
assert.ok(src.includes("prefers-reduced-motion: reduce") && src.includes("@media (prefers-reduced-motion:reduce)"), "honours reduced motion in JS and CSS")
assert.ok(src.includes("let auto = autoPlay && !reduced && target() < 0.002"), "autoplay only from the top, never under reduced motion")
assert.ok(src.includes("autoPlay = false,"), "autoplay is opt-in")
for (const ev of ['"wheel", onUser', '"touchstart", onUser', '"keydown", onUser', '"scroll", onScroll']) {
  assert.ok(src.includes("window.addEventListener(" + ev), "listens for " + ev)
  assert.ok(src.includes("window.removeEventListener(" + ev), "stops listening for " + ev)
}
assert.ok(src.includes("const k = 1 - Math.exp(-dt / (auto ? 40 : 110))"), "scroll input is eased, frame-rate independent")
assert.ok(src.includes("new IntersectionObserver") && src.includes("io.disconnect()"), "the loop sleeps off screen")
assert.ok(src.includes('root.setAttribute("data-ready", "true")') && src.includes(".hrh-root:not([data-ready=true]) .hrh-view"), "nothing is painted before it is laid out")
assert.ok(src.includes(".hrh-root[data-ready=true] .hrh-ch{animation"), "the intro plays once, after the faces load")
assert.ok(src.includes('<span className="hrh-fade" style={{ display: "block" }}>'), "the count's intro runs on an inner span, so its scroll transform is not overridden")
assert.ok(src.includes("projects.slice(0, 12).reverse()"), "the grid's six ride the ribbon's upper end, which leaves first")
assert.ok(src.includes('(back ? " translateX(" + px(sw + 2) + ") rotateY(180deg)" : "")') && src.includes("backface-visibility:hidden"), "the ribbon's back faces are their own, readable, slices")
assert.ok(src.includes(".hrh-slice{position:absolute;left:0;top:0;transform-origin:0 0;"), "slices turn about the helix axis, not their own centre (that opened gaps)")
assert.ok(src.includes("el.style.width = px(sw + 2)") && src.includes("px(1 - (back ? S - 1 - j : j) * sw)"), "slices overlap 1px each side, so no hairline seams")

// --- the motion, executed ---------------------------------------------------
const start = src.indexOf("// #region motion")
const end = src.indexOf("// #endregion")
assert.ok(start > 0 && end > start, "motion region present")
const body = src.slice(start, end).replace(/export /g, "").replace(/: number/g, "")
const m = new Function(body + "\nreturn { PHASE, HELIX, seg, headline, helix, gridCard, gridScroll, autoProgress, AUTO }")()

for (const k of ["bio", "split", "helix", "grid", "gridScroll", "calmOut", "calmIn"]) {
  const w = m.PHASE[k]
  assert.ok(w[0] >= 0 && w[1] <= 1 && w[1] > w[0], "window " + k)
}
const N = 6
const lastLand = m.PHASE.grid[1] + (N - 1) * m.PHASE.gridStagger
assert.ok(lastLand <= m.PHASE.gridScroll[0], "every tile has landed before the grid scrolls")
assert.ok(m.PHASE.split[1] < m.PHASE.helix[1], "the headline has left before the ribbon does")
assert.ok(m.PHASE.bio[1] <= m.PHASE.split[0] + 0.01, "the bio is gone before the name splits")
assert.ok(m.PHASE.grid[0] > m.PHASE.helix[0] + 0.75 * (m.PHASE.helix[1] - m.PHASE.helix[0]), "tiles only arrive once the ribbon is most of the way up")
assert.ok(m.PHASE.calmOut[1] <= m.PHASE.calmIn[0], "reduced motion: the hero has faded before the grid fades in")

// Rest states.
assert.deepEqual(m.headline(0), { l1: 0, l2: -0, gone: false })
assert.equal(m.headline(1).gone, true)
assert.equal(m.helix(0).t, 0)
assert.equal(m.helix(1).t, 1)
for (let i = 0; i < N; i++) {
  assert.equal(m.gridCard(m.PHASE.grid[0] - 0.001, i), 0, "tile " + i + " waits")
  assert.equal(m.gridCard(1, i), 1, "tile " + i + " lands")
}
assert.equal(m.gridScroll(0.5), 0)
assert.equal(m.gridScroll(1), 1)

// Continuous, monotonic motion over scroll.
let prev = m.helix(0)
for (let p = 0.001; p <= 1.0001; p += 0.001) {
  const h = m.helix(p)
  assert.ok(h.rise >= prev.rise - 1e-9 && h.spin >= prev.spin - 1e-9, "the ribbon only rises and turns one way")
  assert.ok(h.rise - prev.rise < 0.01 && h.spin - prev.spin < 0.05, "no jump at p=" + p.toFixed(3))
  prev = h
}
// Tiles enter one after another.
assert.ok(m.PHASE.gridStagger > 0, "tiles are staggered")
for (let p = 0; p <= 1; p += 0.002) for (let i = 1; i < N; i++) assert.ok(m.gridCard(p, i) <= m.gridCard(p, i - 1), "tile " + i + " follows tile " + (i - 1))

// Autoplay: starts at the hero, holds on the grid, rewinds, never jumps.
assert.equal(m.autoProgress(0), 0)
assert.equal(m.autoProgress(m.AUTO.play + 10), 1)
assert.equal(m.autoProgress(m.AUTO.play + m.AUTO.hold + m.AUTO.rewind + 10), 0)
let a = m.autoProgress(0)
const cycle = m.AUTO.play + m.AUTO.hold + m.AUTO.rewind + m.AUTO.rest
for (let t = 16; t < cycle * 2; t += 16) {
  const b = m.autoProgress(t)
  assert.ok(Math.abs(b - a) < 0.01, "autoplay jumps at " + t + " ms")
  a = b
}

console.log("helix-ribbon-hero: ok")
