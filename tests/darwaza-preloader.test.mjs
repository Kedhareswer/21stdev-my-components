// Install-safety and geometry checks for darwaza-preloader.
// Run: node tests/darwaza-preloader.test.mjs
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const dir = new URL("../components/darwaza-preloader/", import.meta.url)
const read = (f) => readFileSync(new URL(f, dir), "utf8").replace(/\r\n/g, "\n")
const src = read("darwaza-preloader.tsx")

// ---- install safety ----
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "react is the only import")
assert.doesNotMatch(src, /@import|https?:\/\//, "nothing fetched")
assert.ok(src.includes('height = "100svh"'), "height defaults to a definite length")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")
assert.ok(src.includes("prefers-reduced-motion"), "honours reduced motion")
assert.ok(src.includes("max-width: none") && src.includes('maxWidth: "none"'), "SVGs are guarded against Preflight")
assert.ok(src.includes('role="progressbar"') && src.includes('"aria-valuenow"'), "reports progress")
assert.ok(src.includes("onCompleteRef.current") && src.includes("onReadyRef.current"), "calls back through refs")
assert.ok(src.includes("cancelAnimationFrame(raf)") && src.includes("ro.disconnect()"), "cleans up its loops and observer")
assert.ok(src.includes('removeEventListener("scroll"'), "removes its scroll listener")
assert.ok(src.includes("html.style.overflow = prev"), "gives the page its scroll back")
assert.ok(src.includes("React.useId()"), "SVG ids are unique per instance")
assert.doesNotMatch(src, /console\./, "no debug logging ships")
assert.doesNotMatch(src, /Hand\(|bangle|sleeve/i, "no hands")
assert.doesNotMatch(
  src.slice(0, src.indexOf("</")),
  /use(State|Ref|Memo|Callback)<|Partial<|Record<|React\.[A-Za-z]+</,
  "no generics before the first JSX close tag (the 21st CLI tokenizer hangs on them)",
)
for (const f of ["demo.tsx", "demo-gate.tsx", "demo-neel.tsx"]) {
  const d = read(f)
  const di = [...d.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
  assert.ok(di.includes("@/components/ui/darwaza-preloader"), f + ": imports the component by its installed path")
  assert.ok(di.every((p) => p === "react" || p === "@/components/ui/darwaza-preloader"), f + ": nothing else")
  assert.doesNotMatch(d, /https?:\/\//, f + ": no external assets")
}
assert.match(read("demo.tsx"), /<DarwazaPreloader>[\s\S]*<\/DarwazaPreloader>/, "default demo opens onto a page")

// ---- scoped CSS ----
const css = src.match(/const DWZ_CSS = `([\s\S]*?)`/)[1]
assert.doesNotMatch(css, /\$\{/, "no interpolation in the CSS string")
for (const m of css.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/(?<=^|[{}])\s*([^{}]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (sel.startsWith("@") || /^(from|to|[\d.,\s%]+$)/.test(sel)) continue
  assert.ok(sel.split(",").every((s) => s.trim().startsWith(".dwz-")), "unscoped selector: " + sel)
}
assert.match(css, /\.dwz-gatewrap \{[^}]*position: sticky/, "the gate is pinned while the doors open")
assert.match(css, /\.dwz-content \{[^}]*position: sticky/, "the page is pinned behind it")
assert.doesNotMatch(css, /\.dwz-root \{[^}]*overflow: hidden/, "the root never becomes a scroll container (sticky would break)")

// ---- geometry ----
const a = src.indexOf("// #region geometry\n")
const b = src.indexOf("// #endregion\n", a)
assert.ok(a > -1 && b > a, "geometry region missing")
const L = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(src.slice(a, b))))

// The simulated load runs 0 → 100 and never backwards.
assert.equal(L.dwzSimulated(0), 0)
assert.equal(L.dwzSimulated(1), 100)
let prev = -1
for (let i = 0; i <= 1000; i++) {
  const v = L.dwzSimulated(i / 1000)
  assert.ok(v >= prev - 1e-9 && v >= 0 && v <= 100, "monotonic at t=" + i / 1000)
  prev = v
}

// The load: the sketch draws first, the colour follows, both finish.
assert.deepEqual(L.dwzWash(0), { sketch: 0, wash: 0 })
assert.deepEqual(L.dwzWash(100), { sketch: 1, wash: 1 })
assert.equal(L.dwzWash(30).wash, 0, "no colour before the sketch is well along")
assert.ok(L.dwzWash(30).sketch > 0.4)
assert.ok(L.dwzEdge(0) > 1200 && L.dwzEdge(1) === 0, "paint starts below the floor and comes home")
assert.ok(L.dwzEdge(0.3) > L.dwzEdge(0.6), "the wet edge rises")

// The scroll entrance: closed at 0, open at 1, every channel moving the right way.
const s0 = L.dwzScrub(0)
const s1 = L.dwzScrub(1)
assert.equal(s0.door, 0)
assert.equal(s0.walk, 0)
assert.equal(s0.title, 1)
assert.equal(s0.fade, 1)
assert.ok(Math.abs(s1.door - 104) < 1e-9, "doors swing past square")
assert.equal(s1.walk, 1)
assert.equal(s1.title, 0)
assert.equal(s1.fade, 0)
let pd = -1
let pw = -1
for (let i = 0; i <= 200; i++) {
  const k = L.dwzScrub(i / 200)
  assert.ok(k.door >= pd - 1e-9 && k.walk >= pw - 1e-9, "doors and walk never go backwards at " + i / 200)
  pd = k.door
  pw = k.walk
}
assert.ok(L.dwzScrub(0.5).fade === 1, "the gate is still there mid-way")
assert.deepEqual(L.dwzScrub(-1), s0)
assert.deepEqual(L.dwzScrub(3), s1)

// The arch: floor, left jamb, one foil per lobe, right jamb, closed, apex cusp at ya.
const arch = L.dwzArch(212, 788, 637, 381, 1200, 8)
assert.ok(arch.startsWith("M212 1200 L212 637"), "starts at the left foot")
assert.equal((arch.match(/ A/g) || []).length, 8, "one foil per lobe")
assert.ok(arch.endsWith("L788 1200 Z"), "ends at the right foot")
assert.doesNotMatch(arch, /NaN|e-/, "plain numbers only")
const ends = [...arch.matchAll(/ A[\d.]+ [\d.]+ 0 0 0 ([\d.]+) ([\d.]+)/g)].map((m) => [+m[1], +m[2]])
for (const [x, y] of ends) {
  const e = ((x - 500) / 288) ** 2 + ((637 - y) / 256) ** 2
  assert.ok(Math.abs(e - 1) < 0.01, "foil point on the envelope: " + x + "," + y)
}
assert.deepEqual(ends[3], [500, 381], "even lobes put a cusp at the apex")
assert.ok(L.dwzOpening(20).startsWith("M192 "), "a padded opening widens the jamb")

// Fit: the doors stand on the floor, the arch always fits across, the walk clears the screen.
for (const [w, h] of [[1440, 900], [390, 844], [1920, 1080], [800, 1400], [320, 640]]) {
  const f = L.dwzFit(w, h)
  assert.ok(Math.abs(f.oy + 1200 * f.k - h) < 0.01, "doors on the floor at " + w + "x" + h)
  assert.ok(1200 * f.k <= h + 0.01, "fits the height at " + w + "x" + h)
  assert.ok(f.ox + 192 * f.k >= -0.01 && f.ox + 808 * f.k <= w + 0.01, "the arch moulding stays on screen at " + w + "x" + h)
  const z = L.dwzZoom(w, h, f.k)
  assert.ok(576 * f.k * z >= w && 819 * f.k * z >= h, "the walk clears the screen at " + w + "x" + h)
}

// Ornament builders return closed, finite paths.
for (const d of [L.dwzPalmate(50), L.dwzFeather(60, 20, 4, -0.2), L.dwzRibbon(L.dwzSpiral(0, 0, 14, 3, 230, -1.1, 30), 9, 3)]) {
  assert.match(d, /^M/)
  assert.match(d, / Z$/)
  assert.doesNotMatch(d, /NaN|Infinity/)
}
assert.equal((L.dwzPalmateVeins(50).match(/M/g) || []).length, 5, "a vein per lobe")
const chain = L.dwzChain([0, 0], [[10, 0, 20, 10, 20, 20]], 10)
assert.equal(chain.length, 11)
assert.deepEqual(chain[10], [20, 20], "the chain ends where it says")

// Title: letters laid along the arc in order, centred, each tangent to the curve.
const lay = L.dwzArcLayout([30, 30, 30, 30, 30], 500, 692, 248, 172)
assert.equal(lay.places.length, 5)
assert.ok(Math.abs(lay.places[2][0] - 500) < 0.5 && Math.abs(lay.places[2][1] - 520) < 0.5, "the middle letter sits on the apex")
assert.ok(Math.abs(lay.places[2][2]) < 0.5, "and stands upright")
assert.ok(lay.places[0][2] < 0 && lay.places[4][2] > 0, "the ends lean with the curve")
assert.ok(lay.places.every((p, i, all) => !i || p[0] > all[i - 1][0]), "left to right")
assert.equal(L.dwzTitleSize(14), 40)
assert.ok(L.dwzTitleSize(20) < 40 && L.dwzTitleSize(20) * 20 <= 571 + 1e-9)
assert.equal(L.dwzTitleSize(200), 22)

assert.deepEqual(L.dwzHex("#e0226d", [0, 0, 0]), [224, 34, 109])
assert.deepEqual(L.dwzHex("pink", [1, 2, 3]), [1, 2, 3], "a named colour falls back")
assert.equal(L.dwzShade("#808080", 1), "rgb(255,255,255)")
assert.equal(L.dwzShade("#808080", -1), "rgb(0,0,0)")
assert.equal(L.dwzN(1.23456), "1.23")

console.log("darwaza-preloader: ok")
