// Install-safety check for components/singularity-horizon.
// Run: node tests/singularity-horizon.test.mjs
//
// This one is a WebGL component, so the failures worth guarding are the ones a
// screenshot in this repo cannot see: a dependency that does not travel, a root
// that collapses to 0px once installed, a canvas that never gets torn down, and
// a shader whose attribute names have drifted apart from the JS that binds them.
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

const src = readFileSync(
  new URL("../components/singularity-horizon/singularity-horizon.tsx", import.meta.url),
  "utf8",
)

// 21st ships this file alone. three/gsap are not in the installer's project and
// are not declared anywhere here, so importing them is an instant broken build.
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "the only import may be react")

// Root height: a canvas inside an inherited height renders here and collapses
// on a page with no height chain.
assert.ok(/height = "100svh"/.test(src), "root height must default to a definite length")
assert.doesNotMatch(src, /className={?"relative w-full[^"]*\bh-full\b/, "no h-full on the root")

// Styles have to be self-contained and must not restyle the host page.
assert.doesNotMatch(src, /@import/, "no @import — the host owns Tailwind and fonts")
assert.doesNotMatch(src, /^\s*(\*|body|:root)\s*{/m, "no bare global resets")

// The inline style block is a template literal elsewhere in this repo; here it
// is a joined array, and either way an unescaped backtick or ${ breaks it.
const styleBlock = src.slice(src.indexOf("const styles = ["), src.indexOf('].join("\\n")'))
assert.doesNotMatch(styleBlock, /[`]|\$\{/, "no backticks or interpolation inside the CSS")
assert.ok(styleBlock.includes("prefers-reduced-motion"), "the HUD fade must be opt-out")

// Motion is not optional. Reduced motion must stop the loop, not just slow it:
// the RAF is only rescheduled when motion is allowed.
assert.ok(src.includes("if (!reduced) raf = requestAnimationFrame(draw)"), "reduced motion must stop the render loop")
assert.ok(/if \(reduced \|\| cycle\.length < 2/.test(src), "reduced motion must stop the state cycle")

// Every GL object allocated in the effect has to be released, or a remount in
// a router leaks contexts until the browser drops the oldest one.
for (const gone of [
  "gl.deleteProgram(diskProgram)",
  "gl.deleteProgram(coreProgram)",
  "gl.deleteBuffer(cornerBuffer)",
  "gl.deleteBuffer(seedBuffer)",
  "gl.deleteVertexArray(diskVao)",
  "gl.deleteVertexArray(coreVao)",
  "observer.disconnect()",
  "cancelAnimationFrame(raf)",
]) {
  assert.ok(src.includes(gone), `cleanup is missing ${gone}`)
}

// A dropped context is silent: the canvas just stays black forever unless the
// component asks for the restore and rebuilds.
assert.ok(src.includes("webglcontextlost") && src.includes("webglcontextrestored"), "context loss must be handled")

// No WebGL2 at all (older Safari, blocklisted GPU, headless capture) must not
// leave an empty black box where the hero should be.
assert.ok(src.includes("setFailed(true)") && src.includes("radial-gradient"), "needs a no-WebGL fallback")

// Names the JS looks up must exist in the shader it looks them up in. A typo
// here compiles, links, and renders nothing.
const shaderOf = (name) => {
  const start = src.indexOf("const " + name + " = `")
  const end = src.indexOf("`", start + name.length + 10)
  return src.slice(start, end)
}
const diskSource = shaderOf("DISK_VERT") + shaderOf("DISK_FRAG")
const coreSource = shaderOf("CORE_VERT") + shaderOf("CORE_FRAG")

for (const [label, shader, names] of [
  ["disk", diskSource, ["aCorner", "aSeed", "uProj", "uView", "uCam", "uTime", "uMorph", "uCompression", "uIntensity", "uOrbit"]],
  ["core", coreSource, ["aCorner", "uProj", "uView", "uRight", "uUp", "uForward", "uSize", "uHorizon", "uIntensity", "uGlow"]],
]) {
  for (const name of names) {
    assert.ok(new RegExp("\\b" + name + "\\b").test(shader), `${label} shader is missing ${name}`)
    assert.ok(src.includes('"' + name + '"'), `nothing binds ${name} on the JS side`)
  }
}

// The disk is one instanced draw. Per-streak draw calls at 5000 instances would
// be a slideshow, and the divisor is what makes the instancing real.
assert.ok(src.includes("gl.vertexAttribDivisor(diskSeed, 1)"), "aSeed must advance per instance")
assert.ok(/drawArraysInstanced\(gl\.TRIANGLE_STRIP, 0, 4, count\)/.test(src), "the disk must be one instanced draw")

// Draw order is load-bearing: the opaque horizon writes depth first so the far
// side of the disk is eclipsed, then the disk draws additively without writing.
const order = ["gl.depthMask(true)", "gl.blendFunc(gl.SRC_ALPHA, gl.ONE)", "gl.depthMask(false)"]
let cursor = 0
for (const step of order) {
  const at = src.indexOf(step, cursor)
  assert.ok(at > -1, `draw order is missing ${step}`)
  cursor = at
}

console.log("singularity-horizon: ok")
