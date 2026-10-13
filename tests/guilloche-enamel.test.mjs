// Install-safety check for components/guilloche-enamel.
// Run: node tests/guilloche-enamel.test.mjs
//
// A full-bleed shader surface, so the failures worth guarding are the ones a
// screenshot cannot see: a dependency that does not travel, a root that
// collapses to 0px once installed, a loop that never stops, GL that is never
// released, uniforms that drifted from the JS, and TS generics that hang the
// 21st CLI's tokenizer.
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const src = readFileSync(
  new URL("../components/guilloche-enamel/guilloche-enamel.tsx", import.meta.url),
  "utf8",
)

const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "the only import may be react")

// Root height must be a definite length, never an inherited percentage.
assert.ok(/height = "100svh"/.test(src), "root height must default to a definite length")
assert.doesNotMatch(src, /className=\{"relative w-full[^"]*\bh-full\b/, "no h-full on the root")

// It must not restyle the host page, read the window's pointer or hide the cursor.
assert.doesNotMatch(src, /@import/, "no @import")
assert.doesNotMatch(src, /^\s*(\*|body|:root)\s*{/m, "no bare global resets")
assert.doesNotMatch(src, /window\.addEventListener\(["'](pointer|mouse)/, "pointer is read off the component")
assert.doesNotMatch(src, /cursor:\s*none|cursor-none/, "never hide the host's cursor")
// Touch must still scroll the page; the lamp only follows a finger that is down.
assert.ok(src.includes('touchAction: "pan-y"'), "touch must not trap page scroll")
assert.ok(src.includes('e.pointerType !== "mouse" && e.buttons === 0'), "a finger steers only while down")

// Reduced motion stops the loop and skips the intro; off-screen stops it too.
assert.ok(src.includes("if (!reduced && visible) raf = requestAnimationFrame(draw)"), "loop must stop under reduced motion and off-screen")
assert.ok(src.includes("intro && !reduced ? -1 : -Infinity"), "reduced motion must start fully cut")
assert.ok(src.includes("IntersectionObserver"), "must pause when scrolled away")

for (const gone of [
  "gl.deleteProgram(program)",
  "gl.deleteVertexArray(vao)",
  "resizeObserver.disconnect()",
  "visibility.disconnect()",
  "cancelAnimationFrame(raf)",
  'root.removeEventListener("pointermove", onMove)',
  'root.removeEventListener("pointerdown", onDown)',
  'root.removeEventListener("pointerup", onUp)',
  'root.removeEventListener("pointerleave", onLeave)',
]) {
  assert.ok(src.includes(gone), `cleanup is missing ${gone}`)
}
assert.ok(src.includes("webglcontextlost") && src.includes("webglcontextrestored"), "context loss must be handled")
assert.ok(src.includes("setFailed(true)") && src.includes("repeating-conic-gradient"), "needs a no-WebGL fallback")

// Visual props flow through a ref; changing one must not tear down the context.
const deps = src.match(/\}, \[([^\]]*)\]\)\n\n  return \(/)
assert.ok(deps, "main effect deps not found")
assert.deepEqual(deps[1].split(",").map((s) => s.trim()), ["interactive", "reduced", "generation", "maxDpr", "intro"], "visual props must not rebuild GL")

// Every uniform the JS binds exists in the shader.
const fragStart = src.indexOf("const FRAG = `")
const frag = src.slice(fragStart, src.indexOf("`", fragStart + 14))
const bound = [...src.matchAll(/u\("(u[A-Z]\w*)"\)/g)].map((m) => m[1])
assert.ok(bound.length >= 11, "expected the uniforms to be looked up by name")
for (const name of bound) {
  assert.ok(new RegExp("uniform \\w+ " + name + "\\b").test(frag), `shader is missing uniform ${name}`)
}
// GLSL ES 3.0 reserves `half` and forbids ?: on structs; both broke compiles here.
const code = frag.replace(/\/\/.*$/gm, "")
assert.doesNotMatch(code, /\bhalf\b/, "half is a reserved word in GLSL ES")
assert.doesNotMatch(code,/return [^;]*\?[^;]*:[^;]*Surf|\? a : b/, "no ternary on structs")

// The 21st CLI tokenizer treats `<Letter` as JSX and goes exponential on runs
// of TS generics before the first JSX close tag.
const beforeJsx = src.slice(0, src.indexOf("</"))
assert.doesNotMatch(beforeJsx, /\b(useRef|useState|Record|Partial|Map)</, "no TS generics before the first JSX close tag")

// The math region runs for real.
const start = src.indexOf("// #region math")
const end = src.indexOf("// #endregion")
assert.ok(start > -1 && end > start, "math region markers missing")
const js = stripTypeScriptTypes(src.slice(start, end))
const m = await import("data:text/javascript," + encodeURIComponent(js))

const close = (a, b, e = 1e-6) => a.every((v, i) => Math.abs(v - b[i]) < e)
assert.ok(close(m.hexToRgb("#3d6fe0"), [61 / 255, 111 / 255, 224 / 255]), "6-digit hex")
assert.ok(close(m.hexToRgb("#fff"), [1, 1, 1]), "3-digit hex")
assert.ok(close(m.hexToRgb("junk"), [0, 0, 0]), "junk falls back to black")
assert.ok(close(m.hexToLinear("#ffffff"), [1, 1, 1]), "white stays white in linear")
assert.equal(m.rgba("#abc", 0.5), "rgba(170,187,204,0.5)", "3-digit hex fallback colours stay valid CSS")
assert.ok(close(m.hexToLinear("#808080"), [0.2158605, 0.2158605, 0.2158605], 1e-5), "sRGB mid grey is ~0.216 linear")

// The rosette sits right of centre on wide boxes and centres on phones.
assert.ok(m.rosetteCenter(1.6, "right").x > 0.25, "wide + right pushes the rosette right")
assert.ok(m.rosetteCenter(1.6, "left").x < -0.25, "wide + left pushes it left")
assert.equal(m.rosetteCenter(0.46, "right").x, 0, "a phone centres it")
assert.equal(m.rosetteCenter(1.6, "center").x, 0, "center is centre")

// The intro starts as a blank, ends fully cut, never overshoots, and is monotonic.
assert.equal(m.cutProgress(0, 2.1), 0)
assert.equal(m.cutProgress(2.1, 2.1), 1)
assert.equal(m.cutProgress(Infinity, 2.1), 1, "a skipped intro is fully cut")
let prev = 0
for (let t = 0; t <= 2.2; t += 0.05) {
  const v = m.cutProgress(t, 2.1)
  assert.ok(v >= prev - 1e-12 && v >= 0 && v <= 1, "cut progress must rise within 0..1")
  prev = v
}

for (const hex of src.matchAll(/(enamel|metal): "(#[0-9a-f]+)"/gi)) {
  assert.ok(/^#[0-9a-f]{6}$/i.test(hex[2]), `preset colour ${hex[2]} must be #rrggbb`)
}

console.log("guilloche-enamel: ok")
