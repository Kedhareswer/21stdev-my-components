// Install-safety and wiring check for components/mesh-drift-background.
// Run: node tests/mesh-drift-background.test.mjs
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const src = readFileSync(
  new URL("../components/mesh-drift-background/mesh-drift-background.tsx", import.meta.url),
  "utf8",
)

// 21st ships this file alone.
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "the only import may be react")

assert.ok(/height = "100svh"/.test(src), "root height must default to a definite length")
assert.doesNotMatch(src, /<section\s+className={"relative w-full[^"]*\bh-full\b/, "no h-full on the root")
assert.doesNotMatch(src, /@import/, "no @import")

// Plain WebGL1, as the recipe asks — no webgl2-only calls sneaking in.
assert.ok(src.includes('getContext("webgl",'), "must use a WebGL1 context")
assert.doesNotMatch(src, /webgl2|createVertexArray|#version 300/, "no WebGL2")

// The fragment shader is the builder's recipe, and the JS must feed every
// packed uniform it declares. A misspelt name links fine and renders black.
const frag = src.slice(src.indexOf("const FRAG = `"), src.indexOf("`", src.indexOf("const FRAG = `") + 14))
for (const name of ["u_colors", "u_scene", "u_shape", "u_surface", "u_finish", "u_transform", "u_space", "u_cursor"]) {
  assert.ok(new RegExp("uniform vec[34] " + name + "\\b").test(frag), `shader lost ${name}`)
  assert.ok(src.includes('u("' + name + '")'), `nothing binds ${name}`)
}
assert.ok(frag.includes("vec3 shade(vec2 uv, vec2 p, float t)") && frag.includes("grainHash"), "shader must be the Mesh drift recipe")
assert.ok(src.includes('"a_position"') && /attribute vec2 a_position/.test(src), "vertex attribute names drifted")
assert.ok(src.includes("new Float32Array([-1, -1, 3, -1, -1, 3])"), "fullscreen triangle, not a quad")

// Recipe defaults land in the right slots.
for (const def of [
  'colors = ["#101010", "#3A3A3A"]',
  "speed = 0.86", "scale = 2.5", "intensity = 0.59", "contrast = 0.91", "brightness = -0.1",
  "hue = 6.28", "blur = 0.016", "grain = 0.16", "drift = 0.03", 'cursor = "spotlight"', "cursorRadius = 0.35",
]) assert.ok(src.includes(def), `default drifted: ${def}`)
assert.ok(/spotlight: 4\b/.test(src), "spotlight is cursor effect 4 in the shader")

// Runtime rules from the brief.
assert.ok(src.includes("Math.min(window.devicePixelRatio || 1, 2)"), "cap DPR at 2")
assert.ok(src.includes('"visibilitychange"') && src.includes("document.hidden"), "pause while the tab is hidden")
assert.ok(src.includes("webglcontextlost") && src.includes("webglcontextrestored"), "context loss must be handled")
assert.ok(src.includes("setFailed(true)") && src.includes("radial-gradient"), "needs a no-WebGL fallback")
assert.ok(src.includes("const moving = !reduced && !s.paused"), "reduced motion must stop the clock")
for (const gone of ["gl.deleteProgram(program)", "gl.deleteBuffer(triangleBuffer)", "observer.disconnect()", "cancelAnimationFrame(raf)", 'removeEventListener("pointermove", onMove)']) {
  assert.ok(src.includes(gone), `cleanup is missing ${gone}`)
}

// hexToRgb: the only real logic on the JS side.
const start = src.indexOf("// #region hexToRgb")
const end = src.indexOf("// #endregion", start)
const { hexToRgb } = await import(
  "data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(src.slice(start, end)) + "\nexport { hexToRgb }")
)
const near = (a, b) => a.every((v, i) => Math.abs(v - b[i]) < 0.002)
assert.ok(near(hexToRgb("#101010"), [0.063, 0.063, 0.063]), "#101010 → header's 0.063")
assert.ok(near(hexToRgb("#3A3A3A"), [0.227, 0.227, 0.227]), "#3A3A3A → header's 0.227")
assert.deepEqual(hexToRgb("#fff"), [1, 1, 1], "short hex expands")
assert.deepEqual(hexToRgb("nope"), [0, 0, 0], "junk falls back to black, not NaN")

console.log("mesh-drift-background: ok")
