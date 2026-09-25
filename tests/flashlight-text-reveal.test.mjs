// Install-safety, wiring and light-mask check for components/flashlight-text-reveal.
// Run: node tests/flashlight-text-reveal.test.mjs
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const src = readFileSync(
  new URL("../components/flashlight-text-reveal/flashlight-text-reveal.tsx", import.meta.url),
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
const fragAt = src.indexOf("const FRAG = `")
const frag = src.slice(fragAt, src.indexOf("`", fragAt + 14))
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
  "hue = 6.28", "blur = 0.016", "grain = 0.16", "drift = 0.03", "radius = 0.35", "strength = 1",
]) assert.ok(src.includes(def), `default drifted: ${def}`)
assert.ok(
  src.includes("const SPOTLIGHT = 4") && src.includes("presence, SPOTLIGHT, s.strength, s.radius"),
  "the light is the shader's spotlight (effect 4)",
)

// The writing is masked by the same light the shader draws, from the same
// eased position, or the words and the lit wall drift apart.
assert.ok(src.includes("gl.uniform4f(loc.space, 0, 0, light.x, light.y)"), "shader must read the eased light")
assert.ok(
  src.includes("writing.style.webkitMaskImage = mask") && src.includes("s.radius * Math.min(w, h)"),
  "mask must follow the light at the shader's radius",
)

// Runtime rules from the brief.
assert.ok(src.includes("Math.min(window.devicePixelRatio || 1, 2)"), "cap DPR at 2")
assert.ok(src.includes('"visibilitychange"') && src.includes("document.hidden"), "pause while the tab is hidden")
assert.ok(src.includes("webglcontextlost") && src.includes("webglcontextrestored"), "context loss must be handled")
assert.ok(src.includes("setFailed(true)") && src.includes("radial-gradient"), "needs a no-WebGL fallback")
assert.ok(src.includes("const moving = !reduced && !s.paused"), "reduced motion must stop the clock")
for (const gone of [
  "gl.deleteProgram(program)", "gl.deleteBuffer(triangleBuffer)", "observer.disconnect()",
  "cancelAnimationFrame(raf)", 'removeEventListener("pointermove", onMove)',
]) {
  assert.ok(src.includes(gone), `cleanup is missing ${gone}`)
}

// The real logic, lifted out of the component.
const start = src.indexOf("// #region light")
const end = src.indexOf("// #endregion", start)
assert.ok(start > -1 && end > start, "light region markers missing")
const { hexToRgb, lightMask, wanderAt, FALLOFF } = await import(
  "data:text/javascript," +
    encodeURIComponent(stripTypeScriptTypes(src.slice(start, end)) + "\nexport { hexToRgb, lightMask, wanderAt, FALLOFF }")
)

const near = (a, b) => a.every((v, i) => Math.abs(v - b[i]) < 0.002)
assert.ok(near(hexToRgb("#101010"), [0.063, 0.063, 0.063]), "#101010 → header's 0.063")
assert.ok(near(hexToRgb("#3A3A3A"), [0.227, 0.227, 0.227]), "#3A3A3A → header's 0.227")
assert.deepEqual(hexToRgb("#fff"), [1, 1, 1], "short hex expands")
assert.deepEqual(hexToRgb("nope"), [0, 0, 0], "junk falls back to black, not NaN")

// FALLOFF is the shader's 1 - smoothstep(0, r, d), sampled at quarters.
const smooth = (x) => x * x * (3 - 2 * x)
FALLOFF.forEach((f, i) => assert.ok(Math.abs(f - (1 - smooth(i / 4))) < 1e-9, `falloff stop ${i} off the shader curve`))

// The mask: fully lit at the centre, ghost at the rim, ghost everywhere when off.
{
  const alphas = (m) => [...m.matchAll(/rgba\(0,0,0,([\d.]+)\)/g)].map((x) => Number(x[1]))
  const on = lightMask(100, 50, 200, 1, 0.03)
  assert.ok(on.startsWith("radial-gradient(circle 200.0px at 100.0px 50.0px"), on)
  assert.deepEqual([alphas(on)[0], alphas(on).at(-1)], [1, 0.03], "lit centre, ghost rim")
  assert.ok(alphas(lightMask(0, 0, 200, 0, 0.03)).every((a) => a === 0.03), "light off leaves only the ghost")
  assert.ok(lightMask(0, 0, 0, 1, 0).includes("circle 1.0px"), "zero radius must not emit an invalid 0px circle")
}

// The roaming light stays on the wall and keeps moving.
for (let t = 0; t < 120; t += 0.25) {
  const [x, y] = wanderAt(t)
  assert.ok(Math.abs(x) < 0.7 && Math.abs(y) < 0.6, `light roams off the wall at t=${t}`)
}
assert.notDeepEqual(wanderAt(0), wanderAt(3), "the roaming light must move")

console.log("flashlight-text-reveal: ok")
