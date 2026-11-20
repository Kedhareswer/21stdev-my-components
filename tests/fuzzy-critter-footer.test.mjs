// Install-safety, motion and physics checks for components/fuzzy-critter-footer.
// Run: node tests/fuzzy-critter-footer.test.mjs
//
// The 2D body solver and the wordmark arc live in the one published .tsx between
// `// #region physics` and `// #endregion`; the test lifts that region out, strips the
// types and runs it, so the physics is tested as shipped.
import assert from "node:assert/strict"
import { readFileSync, readdirSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const slug = "fuzzy-critter-footer"
const dir = new URL("../components/" + slug + "/", import.meta.url)
const src = readFileSync(new URL(slug + ".tsx", dir), "utf8").replace(/\r\n/g, "\n")
const demo = readFileSync(new URL("demo.tsx", dir), "utf8")

// ---------- install safety ----------
assert.deepEqual(readdirSync(dir).sort(), ["README.md", "demo.tsx", slug + ".tsx"].sort(), "folder holds only the publishable files")
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, [
  "react",
  "three",
  "three/examples/jsm/geometries/RoundedBoxGeometry.js",
  "three/examples/jsm/math/MeshSurfaceSampler.js",
  "three/examples/jsm/utils/BufferGeometryUtils.js",
], "imports")
const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"))
for (const i of imports) assert.ok(pkg.dependencies[i.split("/")[0]], i + " is declared in the root package.json")
const ts = readFileSync(new URL("../tsconfig.json", import.meta.url), "utf8")
assert.ok(ts.includes('"@/components/ui/' + slug + '": ["./components/' + slug + "/" + slug + '.tsx"]'), "tsconfig paths line")
assert.match(demo, /from "@\/components\/ui\/fuzzy-critter-footer"/, "demo imports the installed path")
assert.match(src, /^"use client"/, "client component")
assert.doesNotMatch(src + demo, /\bh-full\b/, "no h-full")
assert.doesNotMatch(src + demo, /use(Ref|State|Memo|Callback|Reducer|Context)</, "no generic hook type arguments (they hang the 21st CLI)")
assert.ok(src.length < 60_000, "component stays lean, " + src.length)
assert.ok(Buffer.byteLength(demo) < 200_000, "demo under 21st's 200 kB limit")

// the scoped CSS string
const cssAt = src.indexOf("const CSS =")
const css = src.slice(cssAt, src.indexOf("\n\n", cssAt))
assert.doesNotMatch(css, /`|\$\{|@import/, "no backticks, ${ or @import in the CSS string")
const flat = css.replace(/"\s*\+\s*\n\s*"/g, "")
let rules = 0
for (const m of flat.matchAll(/(?<=^|[{}"])\s*([^{}"]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (sel.startsWith("@") || sel.startsWith("const CSS")) continue
  rules++
  assert.ok(sel.split(",").every((s) => s.trim().startsWith(".fcf-")), "unscoped selector: " + sel)
}
assert.ok(rules >= 25, "the scope check saw real rules, saw " + rules)
assert.match(flat, /@media \(prefers-reduced-motion:reduce\)/, "CSS honours reduced motion")
assert.match(flat, /\.fcf-canvas\{[^}]*max-width:none/, "the WebGL canvas escapes Preflight's max-width")
// the footer takes its height from its content; only the canvas fills its absolutely positioned (definite) stage
const rule = (sel) => { const at = flat.indexOf(sel + "{"); return at < 0 ? "" : flat.slice(at, flat.indexOf("}", at) + 1) }
assert.ok(rule(".fcf-root") && !/height/.test(rule(".fcf-root")), "the root sets no height")
assert.match(rule(".fcf-stage"), /position:absolute;left:0;right:0;top:0;bottom:0/, "the stage is pinned on all four sides")
assert.deepEqual([...flat.matchAll(/\.([a-z-]+)\{[^}]*height:\d+%/g)].map((m) => m[1]), ["fcf-canvas"], "percentage height only on the canvas")
const TOKENS = ["--color-background", "--color-foreground", "--color-muted-foreground", "--color-border", "--color-primary"]
for (const [, v] of src.matchAll(/var\((--[a-z0-9-]+)/g)) assert.ok(TOKENS.includes(v), "token not guaranteed in a host: " + v)
for (const t of ["--color-background", "--color-foreground", "--color-muted-foreground", "--color-border"]) assert.ok(src.includes("var(" + t + ")"), "themes through " + t)
assert.deepEqual([...src.matchAll(/https?:\/\/[^"'\s)]+/g)].map((m) => m[0]), [], "the component fetches nothing (no web font, no textures)")
assert.deepEqual([...demo.matchAll(/https?:\/\/[^"'\s)]+/g)].map((m) => m[0]), [], "the demo is self-contained")
assert.doesNotMatch(src + demo, /Softfield|cuedesign|\bcue\b/i, "no identifiers from the reference")

// ---------- behaviour, as source ----------
assert.match(src, /prefers-reduced-motion: reduce/, "reduced motion is read at runtime")
assert.match(src, /windU = \{ value: reduced \? 0 : wind \}/, "reduced motion stills the fur")
assert.match(src, /if \(reduced\) \{\s*restInRow\(bodies, world\)/, "reduced motion seats the creatures without a fall")
assert.match(src, /if \(reduced \|\| \(e\.target as Element\)\.closest\("a,button,input"\)\) return/, "links and buttons stay clickable; no grabbing under reduced motion")
assert.match(src, /\|\| !curve \|\| window\.matchMedia\("\(prefers-reduced-motion: reduce\)"\)\.matches\) return/, "no wordmark arc under reduced motion")
assert.match(src, /bend \+= \(goal - bend\) \* 0\.14/, "the arc is eased, not scroll-locked")
assert.match(src, /later\(curve && !reduced \? 260 : 0, drop\)/, "the drop waits 260 ms for the arc to settle")
assert.match(src, /i \* 260 \+ Math\.random\(\) \* 120/, "drops are staggered 260 ms apart")
assert.match(src, /for \(let s = 0; s < 3; s\+\+\)/, "three substeps a frame")
assert.match(src, /Math\.min\(0\.033, \(now - last\) \/ 1000\)/, "the frame step is capped")
assert.match(src, /type="button" className="fcf-again"/, "re-drop is a real button")
assert.match(src, /leaving\[i\] = start \+ 520 \+ at/, "re-drop tosses residents out through the top instead of blinking them out")
assert.match(src, /className="fcf-sr"/, "screen-reader description")
assert.match(src, /aria-label=\{wordmark\} role="img"/, "the split wordmark reads as one word")
assert.match(src, /aria-hidden="true">\{ch\}/, "single glyphs are hidden from assistive tech")
assert.match(src, /\(hover:hover\) and \(pointer:fine\)\{\.fcf-root\.fcf-over\{cursor:grab\}/, "grab cursor only for fine pointers")
assert.match(src, /if \(!live\.current\.sound\) return[\s\S]*?new AudioContext\(\)/, "audio starts only after a gesture and only with sound on")
assert.match(src, /gl\.dispose\(\)/, "the renderer is disposed on unmount")
assert.match(src, /gl\.forceContextLoss\(\)/, "the WebGL context is released")
assert.match(src, /io\.disconnect\(\)/, "the offscreen pause observer is cleaned up")
assert.match(src, /if \(!onScreen\) return/, "rendering pauses off screen")
assert.match(src, /catch \{\s*return \/\/ no WebGL/, "no WebGL leaves a working footer")
assert.match(src, /setPixelRatio\(Math\.min\(2,/, "pixel ratio is capped")
assert.doesNotMatch(src, /\bflat\b(?=[^"]*")/, "no GLSL 3 reserved word as an identifier in the shaders")
assert.match(src, /convertLinearToSRGB\(\)/, "ShaderMaterial fur gets display-space colours")
assert.match(src, /halfWidth\(geo, 0\.16, yaw\) \+ 0\.24/, "walls use the turned body's half-width plus its fur")

// ---------- physics, as shipped ----------
const start = src.indexOf("// #region physics"), end = src.indexOf("// #endregion", start)
assert.ok(start > -1 && end > start, "physics region markers")
const g = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(src.slice(start, end))))

// seeded randomness, so a failure reproduces
const rng = (seed) => () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296)
const SIZES = [1.08, 0.86, 1.22, 1.05, 0.96, 0.95]
const REACH = [0.88, 0.82, 0.86, 0.95, 0.92, 1.0] // roughly what halfWidth + fur gives for the default six

assert.equal(g.unitFor(1280), 1280 / 9.4, "desktop unit")
assert.equal(g.unitFor(3000), 150, "unit is capped")
assert.equal(g.unitFor(300), 40, "unit has a floor")
assert.ok(g.unitFor(390) < 390 / 7.4, "phones get a smaller unit than desktop scaling would give")

for (const [W, H] of [[1440, 406], [1280, 360], [1920, 519], [1024, 287], [390, 126]]) {
  const tag = W + "x" + H
  const unit = g.unitFor(W)
  const world = { w: W, h: H, floor: g.floorFor(unit), gravity: 2600, bounce: 0.32 }
  const bodies = SIZES.map((k, i) => g.makeBody(unit * 0.68 * k, unit * REACH[i] * k))
  const rnd = rng(W)
  bodies.forEach((b, i) => {
    g.dropStart(b, i, bodies.length, world, rnd)
    assert.ok(b.y - b.r > H, tag + ": body " + i + " enters from above the stage top")
    assert.ok(b.x - b.wall >= 0 && b.x + b.wall <= W, tag + ": body " + i + " enters inside the walls")
  })
  let landings = 0
  for (let s = 0; s < 8 * 180; s++) {
    const hits = g.stepBodies(bodies, world, 1 / 180, null)
    landings += hits.filter((h) => h > 0).length
    assert.ok(hits.every((h) => h >= 0 && h <= 1), tag + ": impacts are 0..1")
  }
  assert.ok(landings >= bodies.length, tag + ": every body lands (" + landings + ")")
  for (const [i, b] of bodies.entries()) {
    assert.ok([b.x, b.y, b.vx, b.vy, b.a, b.va].every(Number.isFinite), tag + ": body " + i + " finite")
    assert.ok(b.y - b.r >= world.floor - 0.01, tag + ": body " + i + " is not under the floor")
    assert.ok(b.x - b.wall >= -0.01 && b.x + b.wall <= W + 0.01, tag + ": body " + i + " is inside the walls")
    assert.ok(Math.abs(b.vy) < 5 && Math.abs(b.vx) < 25, tag + ": body " + i + " has come to rest")
    assert.ok(Math.abs(Math.atan2(Math.sin(b.a), Math.cos(b.a))) < 0.2, tag + ": body " + i + " sits upright")
  }
  // nobody ends up stacked off the floor when they fit side by side
  const span = bodies.reduce((s, b) => s + 2 * b.r * 0.92, 0)
  if (span < W) for (const [i, b] of bodies.entries()) assert.ok(b.y - b.r - world.floor < 2, tag + ": body " + i + " rests on the floor")

  // a held body follows the hand inside the stage and gets thrown on release
  const b = bodies[2]
  b.held = true
  for (let s = 0; s < 120; s++) g.stepBodies(bodies, world, 1 / 180, { x: W * 0.5, y: H * 0.7 })
  assert.ok(Math.abs(b.x - W * 0.5) < 6 && b.y > world.floor + b.r, tag + ": held body follows the hand")
  for (let s = 0; s < 120; s++) g.stepBodies(bodies, world, 1 / 180, { x: W * 2, y: H * 5 })
  assert.ok(b.x + b.wall <= W + 0.01 && b.y <= H - b.r * 0.6 + 0.01, tag + ": a hand outside the stage can't drag it out (" + [b.x + b.wall, W, b.y, H - b.r * 0.6].map(Math.round) + ")")
  b.held = false
  for (let s = 0; s < 6 * 180; s++) g.stepBodies(bodies, world, 1 / 180, null)
  assert.ok(Math.abs(b.y - b.r - world.floor) < 2 || bodies.some((o) => o !== b && Math.hypot(o.x - b.x, o.y - b.y) < (o.r + b.r)), tag + ": released body comes back down")
}

// hit test: topmost wins
{
  const a = g.makeBody(50), b = g.makeBody(50)
  a.live = b.live = true
  a.x = 100; a.y = 100; b.x = 130; b.y = 100
  assert.equal(g.bodyAt([a, b], 115, 100), 1, "overlap picks the later (top) body")
  assert.equal(g.bodyAt([a, b], 60, 100), 0, "picks the one under the point")
  assert.equal(g.bodyAt([a, b], 400, 100), -1, "misses empty space")
  b.live = false
  assert.equal(g.bodyAt([a, b], 170, 100), -1, "hidden bodies can't be grabbed")
}

// reduced motion row
{
  const world = { w: 1280, h: 360, floor: 32, gravity: 2600, bounce: 0.32 }
  const bodies = SIZES.map((k) => g.makeBody(90 * k))
  g.restInRow(bodies, world)
  bodies.forEach((b, i) => {
    assert.ok(b.live && b.onFloor && b.y === world.floor + b.r, "row " + i + " on the floor")
    assert.equal(b.x, (1280 / 7) * (i + 1), "row " + i + " evenly spaced")
  })
}

// wordmark arc: straight at 0, symmetric, a frown at full bend
{
  for (let i = 0; i < 9; i++) {
    const a = g.arcFor(i, 9, 0)
    assert.ok(Math.abs(a.x) + Math.abs(a.y) + Math.abs(a.deg) < 1e-9, "straight when settled")
  }
  const L = g.arcFor(0, 9, 1), M = g.arcFor(4, 9, 1), R = g.arcFor(8, 9, 1)
  assert.deepEqual([L.x, L.y, L.deg], [-0.14, 0.2, -13], "left end")
  assert.deepEqual([R.x, R.y, R.deg], [0.14, 0.2, 13], "right end")
  assert.ok(M.y === 0 && M.deg === 0, "centre glyph stays put")
  assert.deepEqual(g.arcFor(0, 1, 1), { x: 0, y: 0, deg: 0 }, "one glyph never bends")
  assert.equal(g.bendFor(900, 700, 900), 1, "footer just entering: full bend")
  assert.equal(g.bendFor(200, 700, 900), 0, "footer bottom at the fold: straight")
  assert.ok(Math.abs(g.bendFor(550, 700, 900) - 0.5) < 1e-9, "half in: half bent")
  assert.equal(g.bendFor(-100, 700, 900), 0, "scrolled past: straight")
}

console.log("fuzzy-critter-footer: ok")
