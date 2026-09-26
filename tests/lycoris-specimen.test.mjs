// Install-safety, scroll math and flower-geometry check for components/lycoris-specimen.
// Run: node tests/lycoris-specimen.test.mjs
import assert from "node:assert/strict"
import { readFileSync, readdirSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const dir = new URL("../components/lycoris-specimen/", import.meta.url)
const src = readFileSync(new URL("lycoris-specimen.tsx", dir), "utf8")

// ---- install safety ------------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "the only import may be react")
assert.deepEqual(
  readdirSync(dir).sort(),
  ["README.md", "demo.tsx", "lycoris-specimen.tsx"],
  "the folder ships the component, its demo and a README — nothing else",
)

assert.ok(src.includes('height = "100svh"'), "stage height must default to a definite length")
assert.doesNotMatch(src, /\bh-full\b[^"]*"\s*\n?\s*style=\{\{ height: "calc/, "no h-full on the root")
assert.ok(
  src.includes('style={{ height: "calc(" + height + " * "'),
  "the root's scroll length is derived from the height prop, not a percentage",
)
assert.ok(src.includes("sticky top-0"), "the stage is sticky")

// The display face is loaded with a <link>, never an @import.
assert.doesNotMatch(src, /@import/, "no @import")
assert.ok(src.includes('document.createElement("link")'), "font is injected as a link")
assert.ok(src.includes("if (!fontHref) return"), "fontHref={null} must load nothing")

// The scoped CSS string: prefixed selectors only, no bare resets, no template holes.
const cssAt = src.indexOf("const CSS =")
const css = src.slice(cssAt, src.indexOf("\n\n", cssAt))
assert.doesNotMatch(css, /`|\$\{/, "no backticks or ${ in the CSS string")
for (const bad of [/"\*\s*\{/, /[{}"]\s*body\s*\{/, /:root/, /[{}"]\s*html\s*\{/])
  assert.doesNotMatch(css, bad, "no bare resets in the CSS: " + bad)
for (const rule of css.matchAll(/"([^"@{][^"{]*)\{/g)) {
  const sel = rule[1].trim()
  if (/^(from|to|\d+%)/.test(sel)) continue
  assert.ok(sel.split(",").every((s) => s.trim().startsWith(".lys-")), "unscoped selector: " + sel)
}
assert.ok(css.includes("prefers-reduced-motion"), "CSS honours reduced motion")

// Preflight: the canvas must not be clamped by img/canvas max-width rules.
assert.ok(src.includes('maxWidth: "none"'), "canvas guards Preflight's max-width")

// Runtime hygiene.
assert.ok(src.includes('getContext("webgl"'), "WebGL1 context")
assert.doesNotMatch(src, /webgl2|#version 300/, "no WebGL2")
assert.ok(src.includes('canvas.getContext("2d")'), "needs a no-WebGL fallback")
assert.ok(src.includes("webglcontextlost") && src.includes("webglcontextrestored"), "context loss handled")
assert.ok(src.includes("Math.min(window.devicePixelRatio || 1, 2)"), "cap DPR at 2")
assert.ok(src.includes('"visibilitychange"') && src.includes("IntersectionObserver"), "pause off-screen")
assert.ok(src.includes("const moving = L.alive && !L.reduced"), "reduced motion stops the clock")
for (const gone of [
  "cancelAnimationFrame(raf)", "io.disconnect()", "ro.disconnect()",
  "g.deleteProgram(prog)", 'removeEventListener("pointermove", onMove)',
]) assert.ok(src.includes(gone), "cleanup is missing " + gone)

// Every shader uniform the JS binds is declared, and vice versa.
const shaders = src.slice(src.indexOf("const VERT = `"), src.indexOf("// ---- copy"))
const declared = [...shaders.matchAll(/uniform \w+ (u_\w+);/g)].map((m) => m[1]).sort()
const bound = JSON.parse(src.match(/for \(const n of (\[[^\]]+\])\)\s*\n\s*loc\[n\]/)[1]).sort()
assert.deepEqual(bound, [...new Set(declared)], "uniform names drifted between GLSL and JS")

// ---- the lifted logic ---------------------------------------------------------------
const lift = (name, exports) => {
  const start = src.indexOf("// #region " + name)
  const end = src.indexOf("// #endregion", start)
  assert.ok(start > -1 && end > start, name + " region markers missing")
  return import(
    "data:text/javascript," +
      encodeURIComponent(stripTypeScriptTypes(src.slice(start, end)) + "\nexport { " + exports + " }")
  )
}

const { progressFrom, sceneCoord, reveal } = await lift("scroll", "progressFrom, sceneCoord, reveal")
{
  const h = 7000
  const vp = 900
  assert.equal(progressFrom(0, h, vp), 0)
  assert.equal(progressFrom(-(h - vp), h, vp), 1)
  assert.equal(progressFrom(400, h, vp), 0, "before it enters, clamps to 0")
  assert.equal(progressFrom(-99999, h, vp), 1, "past the end, clamps to 1")
  assert.equal(progressFrom(-10, 500, vp), 0, "no travel, no progress")
}
{
  const n = 6
  // Frames sit exactly on the integers, with a hold around each.
  for (let i = 0; i < n; i++) assert.ok(Math.abs(sceneCoord(i / (n - 1), n, 0.34) - i) < 1e-9, "frame " + i)
  assert.equal(sceneCoord(0.01, n, 0.34), 0, "holds at the first frame")
  assert.equal(sceneCoord(1, n, 0.34), n - 1, "ends on the last frame, not past it")
  let prev = -1
  for (let p = 0; p <= 1.0001; p += 0.002) {
    const c = sceneCoord(p, n, 0.34)
    assert.ok(c >= prev - 1e-9 && c >= 0 && c <= n - 1, "monotone and in range at " + p)
    prev = c
  }
  assert.equal(sceneCoord(0.5, 1, 0.34), 0, "a single frame never moves")
}
{
  for (const d of [0, 0.3, 0.7, 1]) assert.equal(reveal(2, 2, d), 1, "fully shown on its own frame")
  for (const c of [0, 1.4, 2.6, 5]) assert.equal(reveal(c, 2, 0), 0, "gone a frame away")
  assert.ok(reveal(1.7, 2, 0) > reveal(1.7, 2, 1), "late elements arrive late")
  assert.ok(reveal(2.3, 2, 1) > reveal(2.3, 2, 0), "and leave late")
}

const { buildCurves, buildMesh, STRIDE } = await lift("flower", "buildCurves, buildMesh, STRIDE")
for (const [florets, seed] of [[6, 7], [3, 1], [8, 99], [40, 2]]) {
  const { curves, radius } = buildCurves(florets, seed)
  const mesh = buildMesh(curves)
  // Indices are Uint16 with no extension: one vertex past 65535 wraps silently.
  assert.ok(mesh.vertices < 65536, `florets=${florets}: ${mesh.vertices} vertices overflow Uint16`)
  assert.equal(mesh.data.length, mesh.vertices * STRIDE, "interleaved layout")
  assert.equal(mesh.index.length % 3, 0, "whole triangles")
  assert.ok(mesh.index.every((i) => i < mesh.vertices), "no index past the buffer")
  assert.ok(mesh.data.every(Number.isFinite), "no NaN in the geometry")
  for (let v = 0; v < mesh.vertices; v++) {
    const o = v * STRIDE
    const l = Math.hypot(mesh.data[o + 3], mesh.data[o + 4], mesh.data[o + 5])
    assert.ok(Math.abs(l - 1) < 1e-3, "normals are unit length")
  }
  assert.ok(radius > 1 && radius < 4, "framing radius is sane: " + radius)
  // Same seed, same flower — the demo cover and the installed page must match.
  assert.deepEqual(buildMesh(buildCurves(florets, seed).curves).data, mesh.data, "deterministic")
}

// ---- demo ----------------------------------------------------------------------------
const demo = readFileSync(new URL("demo.tsx", dir), "utf8")
assert.ok(demo.includes('from "@/components/ui/lycoris-specimen"'), "demo imports the installed path")
assert.ok(demo.includes('className="w-full"'), "demo wrapper keeps full width")

const tsconfig = readFileSync(new URL("../tsconfig.json", import.meta.url), "utf8")
assert.ok(tsconfig.includes('"@/components/ui/lycoris-specimen"'), "tsconfig paths line missing")

console.log("lycoris-specimen: ok")
