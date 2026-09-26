// Install-safety, wiring and bouquet-layout check for components/scanline-bloom.
// Run: node tests/scanline-bloom.test.mjs
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const src = readFileSync(new URL("../components/scanline-bloom/scanline-bloom.tsx", import.meta.url), "utf8")

// 21st ships this file alone.
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "the only import may be react")

assert.ok(/height = "100svh"/.test(src), "root height must default to a definite length")
assert.doesNotMatch(src, /<section\s+className={"relative w-full[^"]*\bh-full\b/, "no h-full on the root")
assert.doesNotMatch(src, /@import/, "no @import")
assert.doesNotMatch(src, /https?:\/\//, "nothing is fetched: the bouquet is painted, not downloaded")

// Plain WebGL1 — no webgl2-only calls sneaking in.
assert.ok(src.includes('getContext("webgl",'), "must use a WebGL1 context")
assert.doesNotMatch(src, /webgl2|createVertexArray|#version 300/, "no WebGL2")

// Every uniform the shader declares is bound by name. A misspelt one links
// fine and renders black.
const fragAt = src.indexOf("const FRAG = `")
const frag = src.slice(fragAt, src.indexOf("`", fragAt + 14))
const declared = [...frag.matchAll(/uniform \w+ (u_\w+)/g)].map((m) => m[1])
assert.deepEqual(
  declared.sort(),
  ["u_bg", "u_frame", "u_frameColor", "u_fx", "u_hot", "u_ink", "u_pointer", "u_post", "u_print", "u_scene", "u_texA", "u_texB"],
  "uniform set drifted",
)
for (const name of declared) assert.ok(src.includes('u("' + name + '")'), `nothing binds ${name}`)
assert.ok(src.includes("new Float32Array([-1, -1, 3, -1, -1, 3])"), "fullscreen triangle, not a quad")
// The look: tone-driven scanlines, a stipple dither, a lens that flips them.
assert.ok(frag.includes("m = mix(m, 1.0 - m, lens)"), "the lens must flip the print mode")
assert.ok(frag.includes("pow(tone, 0.8)"), "line thickness must follow the tone")
assert.ok(frag.includes("float stipple = step(hash("), "stipple must be a dither")
// Fragment uniform vectors: 6 vec4 + 4 vec3 stays far under WebGL1's 16.
assert.ok(declared.length - 2 <= 16, "too many fragment uniforms for WebGL1")

// Runtime rules.
assert.ok(src.includes("Math.min(window.devicePixelRatio || 1, 2)"), "cap DPR at 2")
assert.ok(src.includes('"visibilitychange"') && src.includes("document.hidden"), "pause while the tab is hidden")
assert.ok(src.includes("webglcontextlost") && src.includes("webglcontextrestored"), "context loss must be handled")
assert.ok(src.includes("setFailed(true)") && src.includes("repeating-linear-gradient"), "needs a no-WebGL fallback")
assert.ok(src.includes("const moving = !reduced && !s.paused"), "reduced motion must stop the clock")
assert.ok(src.includes("reduced ? 0 : s.sway") && src.includes("const tearTarget = reduced ? 0"), "reduced motion: no sway, no tearing")
assert.ok(src.includes('img.crossOrigin = "anonymous"'), "src images must be requested with CORS")
assert.ok(src.includes('target.closest("a, button'), "children's own controls must not trigger a rebloom")
assert.ok(src.includes('e.key !== "Enter" && e.key !== " "'), "rebloom must be reachable from the keyboard")
for (const gone of [
  "gl.deleteProgram(program)", "gl.deleteBuffer(triangleBuffer)", "gl.deleteTexture(texA)", "gl.deleteTexture(texB)",
  "observer.disconnect()", "cancelAnimationFrame(raf)", 'removeEventListener("pointermove", onMove)',
  "window.clearTimeout(repaintTimer)",
]) {
  assert.ok(src.includes(gone), `cleanup is missing ${gone}`)
}

// The real logic, lifted out of the component.
const start = src.indexOf("// #region bloom")
const end = src.indexOf("// #endregion", start)
assert.ok(start > -1 && end > start, "bloom region markers missing")
const { mulberry32, nextSeed, hexToRgb, layoutBouquet, paintSize } = await import(
  "data:text/javascript," +
    encodeURIComponent(
      stripTypeScriptTypes(src.slice(start, end)) + "\nexport { mulberry32, nextSeed, hexToRgb, layoutBouquet, paintSize }",
    )
)

// Seeded and in range.
{
  const a = mulberry32(7)
  const b = mulberry32(7)
  for (let i = 0; i < 200; i++) {
    const v = a()
    assert.equal(v, b(), "same seed, same stream")
    assert.ok(v >= 0 && v < 1, "rng out of range")
  }
}

// The rebloom chain walks to fresh, positive seeds and never sticks.
{
  const seen = new Set()
  let s = 7
  for (let i = 0; i < 500; i++) {
    s = nextSeed(s)
    assert.ok(Number.isInteger(s) && s > 0 && s < 1_000_000, `bad seed ${s}`)
    seen.add(s)
  }
  assert.ok(seen.size > 490, "the seed chain cycles too soon")
}

assert.deepEqual(hexToRgb("#fff"), [1, 1, 1], "short hex expands")
assert.deepEqual(hexToRgb("#e3161f").map((v) => Math.round(v * 255)), [227, 22, 31])
assert.deepEqual(hexToRgb("nope"), [0, 0, 0], "junk falls back to black, not NaN")

// Bouquets: deterministic, both species, blooms on (or just over) the sheet,
// leaves drawn first, and tall boxes get an extra bloom.
for (const aspect of [1.48, 1, 0.46, 3]) {
  for (let seed = 1; seed < 400; seed += 7) {
    const { heart, blooms } = layoutBouquet(seed, aspect)
    assert.deepEqual(layoutBouquet(seed, aspect).blooms, blooms, "layout must be deterministic")
    assert.ok(heart.every((v) => v > 0.3 && v < 0.7), "the heart sits near the middle")
    const flowers = blooms.filter((b) => b.kind === "lily" || b.kind === "rose")
    assert.equal(flowers.length, aspect < 0.85 ? 4 : 3, "flower count")
    assert.ok(flowers.some((b) => b.kind === "lily") && flowers.some((b) => b.kind === "rose"), `seed ${seed}: both species`)
    for (const b of blooms) {
      for (const v of [b.x, b.y, b.r, b.a, b.k, b.b, b.tone]) assert.ok(Number.isFinite(v), "non-finite layout value")
      assert.ok(b.x > -0.1 && b.x < 1.1 && b.y > -0.1 && b.y < 1.1, `seed ${seed}: ${b.kind} off the sheet`)
      assert.ok(b.r > 0 && b.tone > 0 && b.tone <= 1, `seed ${seed}: ${b.kind} size/tone`)
    }
    const firstFlower = blooms.findIndex((b) => b.kind !== "leaf")
    assert.ok(blooms.slice(firstFlower).every((b) => b.kind !== "leaf"), "leaves must be painted behind everything")
    for (let i = 1; i < flowers.length; i++) assert.ok(flowers[i].y >= flowers[i - 1].y, "lower blooms overlap higher ones")
  }
}
assert.notDeepEqual(layoutBouquet(7, 1.4).blooms, layoutBouquet(8, 1.4).blooms, "seeds must differ")

// Painting size: follows the box, never huge, never zero.
assert.deepEqual(paintSize(1000, 500, 1), [1000, 500])
assert.deepEqual(paintSize(1000, 500, 3), [1500, 750], "dpr capped at 1.5 for painting")
assert.ok(Math.max(...paintSize(4000, 2000, 2)) <= 1600, "long side capped")
assert.ok(paintSize(0, 0, 1).every((v) => v >= 2), "degenerate boxes still paint")

console.log("scanline-bloom: ok")
