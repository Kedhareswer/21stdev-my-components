// Install-safety, scroll math, flower geometry and handwriting checks for
// components/florilegium-template.
// Run: node tests/florilegium-template.test.mjs
import assert from "node:assert/strict"
import { readFileSync, readdirSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const dir = new URL("../components/florilegium-template/", import.meta.url)
const src = readFileSync(new URL("florilegium-template.tsx", dir), "utf8")

// ---- install safety ------------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "the only import may be react")
for (const f of readdirSync(dir))
  assert.ok(/^(florilegium-template\.tsx|demo(-[a-z0-9-]+)?\.tsx|README\.md)$/.test(f), "unexpected file in the folder: " + f)

assert.ok(src.includes('height = "100svh"'), "stage height must default to a definite length")
assert.ok(
  src.includes('style={{ height: "calc(" + height + " * " + (1 + (N - 1) * sceneScroll).toFixed(3) + ")" }}'),
  "the root's scroll length is derived from the height prop, not a percentage",
)
assert.doesNotMatch(src, /className=["'][^"']*\bh-full\b/, "no h-full")
assert.ok(/\.flg-stage\{position:sticky;top:0;/.test(src), "the stage is sticky")

// Fonts: a <link> only when asked for, never an @import.
assert.doesNotMatch(src, /@import/, "no @import")
assert.ok(src.includes("const fontHref = fonts?.href ?? null"), "no web font by default")
assert.ok(src.includes("if (!fontHref) return"), "fonts.href null must load nothing")

// The scoped CSS string: prefixed selectors only, no bare resets, no template holes.
const css = src.match(/const CSS = `([\s\S]*?)`/)[1]
assert.doesNotMatch(css, /\$\{/, "no ${ in the CSS string")
for (const bad of [/(^|[},])\s*\*\s*\{/, /(^|[},])\s*body\s*\{/, /:root/, /(^|[},])\s*html\s*\{/])
  assert.doesNotMatch(css, bad, "no bare resets in the CSS: " + bad)
for (const rule of css.matchAll(/(?:^|\})\s*(?!@)([^{}\s][^{}]*)\{/g)) {
  const sel = rule[1].trim()
  if (!sel || /^(from|to|\d+%)/.test(sel)) continue
  // split on top-level commas only — :where(a, b) is one selector
  const parts = []
  let depth = 0
  let cur = ""
  for (const ch of sel) {
    if (ch === "(") depth++
    if (ch === ")") depth--
    if (ch === "," && depth === 0) {
      parts.push(cur)
      cur = ""
    } else cur += ch
  }
  parts.push(cur)
  for (const one of parts) assert.ok(one.trim().startsWith(".flg-"), "unscoped selector: " + one)
}
assert.ok(css.includes("prefers-reduced-motion"), "CSS honours reduced motion")
assert.ok(css.includes("@container"), "layout answers the stage, not the window")

// Preflight: the canvas and absolutely sized images must not be clamped.
assert.ok(css.includes(".flg-canvas{position:absolute;inset:0;width:100%;height:100%;max-width:none"), "canvas guards max-width")
assert.ok(/flg-item img,\.flg-tile\{[^}]*max-width:none/.test(css), "thumbnails guard max-width")

// 21st's CLI tokenizer hangs on generics before the first JSX close tag.
const head = src.slice(0, src.indexOf("</"))
assert.doesNotMatch(head, /use(State|Ref|Memo|Callback)<|Partial<|Record<|Array<|Map<|React\.[A-Za-z]+<|\[K in /, "no generics before the JSX")

// Runtime hygiene.
assert.ok(src.includes('getContext("webgl"'), "WebGL1 context")
assert.doesNotMatch(src, /webgl2|#version 300/, "no WebGL2")
assert.ok(src.includes('canvas.getContext("2d")'), "needs a no-WebGL fallback")
assert.ok(src.includes("webglcontextlost") && src.includes("webglcontextrestored"), "context loss handled")
assert.ok(src.includes("Math.min(window.devicePixelRatio || 1, 2)"), "cap DPR at 2")
assert.ok(/swiftshader\|llvmpipe\|software/.test(src) && src.includes("const budget = soft ?"), "pixel budget, smaller in software")
assert.ok(src.includes('"visibilitychange"') && src.includes("IntersectionObserver"), "pause off-screen")
assert.ok(src.includes('window.matchMedia("(prefers-reduced-motion: reduce)").matches'), "reduced motion skips the preloader")
assert.ok(src.includes("const moving = Lv.alive && !Lv.reduced"), "reduced motion stops the idle clock")
for (const gone of [
  "cancelAnimationFrame(raf)", "io.disconnect()", "ro.disconnect()", "mo.disconnect()",
  "g.deleteProgram(prog)", "g.deleteProgram(blit)", 'window.removeEventListener("pointermove", onMove)',
]) assert.ok(src.includes(gone), "cleanup is missing " + gone)

// Every uniform the JS binds is declared in GLSL, and vice versa.
const glsl = src.slice(src.indexOf("const VERT = `"), src.indexOf("// ---- poses"))
const declared = new Set([...glsl.matchAll(/uniform \w+ (u_\w+);/g)].map((m) => m[1]))
const bound = new Set(
  [...src.matchAll(/for \(const n of (\[[^\]]+\])\)\s*loc\[n\]/g)].flatMap((m) => JSON.parse(m[1])),
)
assert.deepEqual([...bound].sort(), [...declared].sort(), "uniform names drifted between GLSL and JS")

// ---- the lifted logic ---------------------------------------------------------------
const region = (name) => {
  const start = src.indexOf("// #region " + name)
  const end = src.indexOf("// #endregion", start)
  assert.ok(start > -1 && end > start, name + " region markers missing")
  return src.slice(start, end)
}
const lift = (names, exports) =>
  import(
    "data:text/javascript," +
      encodeURIComponent(stripTypeScriptTypes(names.map(region).join("\n")) + "\nexport { " + exports + " }")
  )

const { progressFrom, sceneCoord, span } = await lift(["scroll"], "progressFrom, sceneCoord, span")
{
  const h = 9000
  const vp = 900
  assert.equal(progressFrom(0, h, vp), 0)
  assert.equal(progressFrom(-(h - vp), h, vp), 1)
  assert.equal(progressFrom(400, h, vp), 0, "before it enters, clamps to 0")
  assert.equal(progressFrom(-99999, h, vp), 1, "past the end, clamps to 1")
  assert.equal(progressFrom(-10, 500, vp), 0, "no travel, no progress")
}
{
  const n = 10
  for (let i = 0; i < n; i++) assert.ok(Math.abs(sceneCoord(i / (n - 1), n, 0.34) - i) < 1e-9, "scene " + i)
  assert.equal(sceneCoord(0.01, n, 0.34), 0, "holds at the first scene")
  assert.equal(sceneCoord(1, n, 0.34), n - 1, "ends on the last scene")
  let prev = -1
  for (let p = 0; p <= 1.0001; p += 0.001) {
    const c = sceneCoord(p, n, 0.34)
    assert.ok(c >= prev - 1e-9 && c >= 0 && c <= n - 1, "monotone and in range at " + p)
    prev = c
  }
}
{
  for (const d of [0, 0.5, 1]) {
    assert.equal(span(3, 3, 3, d), 1, "fully shown on its own scene")
    assert.equal(span(0, 0, 9, d), 1, "a persistent element is shown everywhere in range")
    assert.equal(span(4.5, 3, 3, d), 0, "gone well before the next scene")
  }
  assert.ok(span(2.55, 3, 3, 0) > span(2.55, 3, 3, 1), "late elements arrive late")
  // consecutive scenes never overlap: the old copy has left before the new arrives
  for (let c = 3; c <= 4; c += 0.01) assert.ok(Math.min(span(c, 3, 3, 0.5), span(c, 4, 4, 0.5)) < 1e-9, "overlap at " + c)
}

const F = await lift(
  ["flower"],
  "resolveForm, mixForm, buildTopology, buildFlower, VERTS, STRIDE, O_STEM, MAXL, MAXP, PETAL_V",
)
{
  assert.ok(F.VERTS < 140000, "vertex budget: " + F.VERTS)
  assert.ok(src.includes('getExtension("OES_element_index_uint")') && src.includes("g.UNSIGNED_INT"), "32-bit indices need the extension")
  const topo = F.buildTopology()
  assert.equal(topo.vertices, F.VERTS)
  assert.equal(topo.index.length % 3, 0, "whole triangles")
  assert.ok(topo.index.every((i) => i < F.VERTS), "no index past the buffer")
  const used = new Uint8Array(F.VERTS)
  for (const i of topo.index) used[i] = 1
  assert.ok(used.every((u) => u === 1), "every slot is referenced by the fixed topology")

  const keys = Object.keys(F.FLORA)
  assert.ok(keys.length >= 10, "ten presets ship")
  const data = new Float32Array(F.VERTS * F.STRIDE)
  const extent = (d) => {
    let r = 0
    for (let v = 0; v < F.MAXL * F.MAXP * F.PETAL_V; v++) r = Math.max(r, Math.hypot(d[v * F.STRIDE], d[v * F.STRIDE + 2]))
    return r
  }
  for (const k of keys) {
    const rf = F.resolveForm(F.FLORA[k])
    const m = F.buildFlower(rf, 1, data)
    assert.ok(data.every(Number.isFinite), k + ": no NaN in the geometry")
    for (let v = 0; v < F.VERTS; v++) {
      const o = v * F.STRIDE
      const l = Math.hypot(data[o + 3], data[o + 4], data[o + 5])
      assert.ok(Math.abs(l - 1) < 1e-3, k + ": unit normal at vertex " + v + " (" + l + ")")
    }
    assert.ok(m.radius > 0.2 && m.radius < 2, k + ": framing radius is sane: " + m.radius)
    const open = extent(data)
    const copy = Float32Array.from(data)
    F.buildFlower(rf, 1, data)
    assert.deepEqual(data, copy, k + ": deterministic")
    F.buildFlower(rf, 0, data)
    assert.ok(extent(data) < open * 0.8, k + ": the bud is tighter than the bloom")
  }
  // absent petals collapse to the origin, so the fixed topology draws nothing there
  F.buildFlower(F.resolveForm(F.FLORA.poppy), 1, data)
  const lastSlot = ((F.MAXL - 1) * F.MAXP + F.MAXP - 1) * F.PETAL_V * F.STRIDE
  assert.equal(Math.hypot(data[lastSlot], data[lastSlot + 1], data[lastSlot + 2]), 0, "unused petal slots collapse")

  // the morph: endpoints are the presets, the middle is a valid flower too
  const a = F.resolveForm(F.FLORA.anemone)
  const b = F.resolveForm(F.FLORA.dahlia)
  assert.deepEqual(F.mixForm(a, b, 0), a)
  assert.deepEqual(F.mixForm(a, b, 1), b)
  const mid = F.mixForm(a, b, 0.5)
  assert.equal(mid.n.layers, (a.n.layers + b.n.layers) / 2, "numbers interpolate")
  assert.equal(mid.n.petals[0], (a.n.petals[0] + b.n.petals[0]) / 2, "pairs interpolate")
  for (let t = 0; t <= 1; t += 0.125) {
    F.buildFlower(F.mixForm(a, b, t), 1, data)
    assert.ok(data.every(Number.isFinite), "no NaN mid-morph at " + t)
  }
}

const H = await lift(["flower", "hand"], "layoutHand, GLYPHS, MARKS")
{
  for (const [ch, g] of Object.entries(H.GLYPHS)) {
    assert.ok(g[0] > 0 && g[0] < 1, "advance of " + ch)
    assert.match(g[1], /^M[-\d.]/, "glyph " + ch + " starts with a move")
    assert.doesNotMatch(g[1], /NaN|undefined/, "glyph " + ch)
  }
  for (const d of Object.values(H.MARKS)) assert.match(d, /^M[-\d.]/)
  // every character the default copy writes by hand has a glyph
  const copy = [
    "Flowers", "Grow", "Light", "people are\nthe flowers\nof life", "roots before\nbranches", "turn toward\nwhat warms you",
    "joy", "love", "grow", "slowly", "care", "rain", "sun", "home", "seed", "Hear. See. Feel.", "life, people",
  ]
  for (const t of copy) {
    for (const ch of t.replace(/[\s]/g, "")) assert.ok(H.GLYPHS[ch], "no glyph for " + JSON.stringify(ch))
    const lay = H.layoutHand(t, 3)
    assert.ok(lay.placed.length > 0 && lay.width > 0, "lays out " + t)
    assert.equal(lay.lines, t.split("\n").length)
    assert.deepEqual(H.layoutHand(t, 3), lay, "seeded, so server and client agree")
    for (const p of lay.placed) assert.ok(/^M/.test(p.d) && p.d.indexOf("M", 1) === -1, "one subpath per stroke")
  }
  assert.ok(src.includes('text={nt.text}'), "footer notes go through the hand layout")
}

// ---- demos -----------------------------------------------------------------------------
for (const f of readdirSync(dir).filter((f) => f.startsWith("demo"))) {
  const demo = readFileSync(new URL(f, dir), "utf8")
  const di = [...demo.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
  assert.deepEqual(di, ["@/components/ui/florilegium-template"], f + " imports only the installed path")
  assert.ok(demo.includes('className="w-full"'), f + ": wrapper keeps full width")
}

const tsconfig = readFileSync(new URL("../tsconfig.json", import.meta.url), "utf8")
assert.ok(tsconfig.includes('"@/components/ui/florilegium-template"'), "tsconfig paths line missing")

console.log("florilegium-template: ok")
