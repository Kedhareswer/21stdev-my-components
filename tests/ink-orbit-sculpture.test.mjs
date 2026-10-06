// Install-safety and logic checks for components/ink-orbit-sculpture.
// Run: node tests/ink-orbit-sculpture.test.mjs
//
// The drawing itself can't be asserted here. What is checked is what fails
// silently: a seed that doesn't reproduce its shape, two seeds whose clouds
// can't morph grain-for-grain, a reforge that lands on the same seed, a HUD
// heading outside 0–359, a colour string that turns the ink black.
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const SLUG = "ink-orbit-sculpture"
const read = (f) => readFileSync(new URL(`../components/${SLUG}/${f}`, import.meta.url), "utf8").replace(/\r\n/g, "\n")
const src = read(`${SLUG}.tsx`)

/* ---------- install safety ---------- */

const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "react is the only import")
assert.doesNotMatch(src, /@import|@font-face|fetch\(|new Image\(|https?:\/\//, "nothing loads at runtime")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")
assert.ok(src.includes('height = "100svh"'), "height defaults to a definite length")
assert.match(src, /style=\{\{\s*height,/, "the height prop reaches the root")
assert.match(src, /relative w-full/, "the root claims full width inside a flex wrapper")
assert.match(src, /max-width:none/, "the canvas is guarded against Preflight's img/canvas max-width")
assert.match(src, /prefers-reduced-motion/, "reduced motion is honoured")
assert.doesNotMatch(src, /use(State|Ref|Memo|Callback)</, "hooks typed without <generics> (21st CLI tokenizer)")
{
  const css = src.match(/const IOS_CSS = `([\s\S]*?)`/)[1]
  assert.doesNotMatch(css, /\$\{|(^|[\s}])(\*|body|html|:root)\s*\{/, "no interpolation, no global resets")
  const rules = [...css.matchAll(/([^{}]+)\{[^}]*\bheight:100%/g)].map((m) => m[1].trim())
  assert.deepEqual(rules, [".ios-canvas"], "percentage height only on the absolutely-placed canvas")
}
for (const d of ["demo.tsx", "demo-custom.tsx"]) {
  const demo = read(d)
  assert.match(demo, /from "@\/components\/ui\/ink-orbit-sculpture"/, `${d} imports the installed path`)
  assert.doesNotMatch(demo, /https?:\/\//, `${d} is self-contained, so 21st can capture it`)
}

/* ---------- logic ---------- */

const a = src.indexOf("// #region logic\n")
const b = src.indexOf("// #endregion logic\n")
assert.ok(a > -1 && b > a, "logic region missing")
const js = stripTypeScriptTypes(src.slice(a, b)) + "\nexport { buildCloud, project, mixHex, nextSeed, headingOf, CORE_N, GRAIN_N, SPIKE_N }"
const L = await import("data:text/javascript," + encodeURIComponent(js))

{
  const c1 = L.buildCloud(4211, 400, 2000, 8)
  const c2 = L.buildCloud(4211, 400, 2000, 8)
  const c3 = L.buildCloud(4212, 400, 2000, 8)
  assert.equal(c1.core.length, 400 * 4)
  assert.equal(c1.grain.length, 2000 * 3)
  assert.equal(c1.spikes.length, 8 * 6)
  assert.deepEqual(c1.grain, c2.grain, "a seed reproduces its shape exactly")
  assert.equal(c3.grain.length, c1.grain.length, "any two seeds morph grain-for-grain")
  assert.notDeepEqual(c3.core, c1.core, "a different seed is a different shape")
  for (const arr of [c1.core, c1.grain, c1.spikes]) {
    for (const v of arr) assert.ok(Number.isFinite(v) && Math.abs(v) < 3, "the cloud stays finite and in frame")
  }
}

{
  const [x, y, z, s] = L.project(0, 0, 0, 1.2, 0.4, 3.4)
  assert.ok(Math.abs(x) < 1e-9 && Math.abs(y) < 1e-9 && Math.abs(z) < 1e-9 && s === 1, "the origin projects to the centre")
  const near = L.project(0, 0, 1, 0, 0, 3.4)
  const far = L.project(0, 0, -1, 0, 0, 3.4)
  assert.ok(near[3] > 1 && far[3] < 1, "nearer points draw larger")
}

assert.equal(L.mixHex("#000000", "#ffffff", 0.5), "rgb(128,128,128)")
assert.equal(L.mixHex("#fff", "#000", 0), "rgb(255,255,255)", "3-digit hex works")
assert.equal(L.mixHex("not-a-colour", "#ffffff", 0), "rgb(0,0,0)", "a bad colour degrades, not NaN")
assert.doesNotMatch(L.mixHex("#2b1d14", "#f3ece1", 2), /NaN/, "t is clamped")

{
  let s = 4211
  const seen = new Set()
  for (let i = 0; i < 500; i++) {
    const n = L.nextSeed(s)
    assert.ok(Number.isInteger(n) && n >= 0 && n < 100000, "seeds fit the five-digit HUD")
    assert.notEqual(n, s, "a reforge always changes the shape")
    seen.add(n)
    s = n
  }
  assert.ok(seen.size > 450, "reforging doesn't fall into a short cycle")
  assert.notEqual(L.nextSeed(0), 0)
}

for (const [yaw, deg] of [[0, 0], [Math.PI / 2, 90], [-Math.PI / 2, 270], [Math.PI * 4 + 0.01, 1], [-0.001, 0]]) {
  assert.equal(L.headingOf(yaw), deg, `heading of ${yaw}`)
}

console.log(`${SLUG}: ok`)
