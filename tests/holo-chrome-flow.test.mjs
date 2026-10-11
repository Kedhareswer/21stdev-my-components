// Install-safety check for components/holo-chrome-flow.
// Run: node tests/holo-chrome-flow.test.mjs
//
// A full-screen shader background, so the failures worth guarding are the ones a
// screenshot in this repo cannot see: a dependency that does not travel, a root
// that collapses to 0px once installed, a loop that never stops, a GL context
// that is never released, uniform names that drifted from the JS, and a palette
// that silently breaks the no-WebGL fallback.
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

const src = readFileSync(
  new URL("../components/holo-chrome-flow/holo-chrome-flow.tsx", import.meta.url),
  "utf8",
)

// 21st ships this file alone.
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "the only import may be react")

// Root height must be a definite length, never an inherited percentage.
assert.ok(/height = "100svh"/.test(src), "root height must default to a definite length")
assert.doesNotMatch(src, /className=\{"relative w-full[^"]*\bh-(full|screen)\b/, "no h-full on the root")

// It is a background: it must not restyle the host page or read the window's pointer.
assert.doesNotMatch(src, /@import/, "no @import")
assert.doesNotMatch(src, /^\s*(\*|body|:root|html)\s*{/m, "no bare global resets")
assert.doesNotMatch(src, /window\.addEventListener\(["'](pointer|mouse)/, "pointer is read off the component, not the window")
assert.doesNotMatch(src, /innerWidth|innerHeight/, "size from the element, not the window")
assert.doesNotMatch(src, /cursor:\s*none|cursor-none/, "never hide the host's cursor")

// Reduced motion stops the loop outright; off-screen stops it too.
assert.ok(src.includes("if (!reduced && visible) raf = requestAnimationFrame(draw)"), "loop must stop under reduced motion and off-screen")
assert.ok(src.includes("IntersectionObserver"), "must pause when scrolled away")
assert.ok(/if \(reduced \|\| !paramsRef\.current\.ripples\) return/.test(src), "reduced motion must skip mercury drops")

// Every GL object and listener allocated in the effect is released.
for (const gone of [
  "gl.deleteProgram(program)",
  "gl.deleteVertexArray(vao)",
  "resizeObserver.disconnect()",
  "visibility.disconnect()",
  "cancelAnimationFrame(raf)",
  "window.clearInterval(retire)",
  'root.removeEventListener("pointermove", onMove)',
  'root.removeEventListener("pointerdown", onDown)',
  'root.removeEventListener("pointerleave", onLeave)',
  'canvas.removeEventListener("webglcontextlost", onLost)',
]) {
  assert.ok(src.includes(gone), `cleanup is missing ${gone}`)
}

assert.ok(src.includes("webglcontextlost") && src.includes("webglcontextrestored"), "context loss must be handled")
assert.ok(src.includes("setFailed(true)") && src.includes("radial-gradient"), "needs a no-WebGL fallback")

// Props flow through a ref; changing one must not tear down the context.
const deps = src.match(/\}, \[([^\]]*)\]\)\n\n  const base = /)
assert.ok(deps, "main effect deps not found")
assert.deepEqual(deps[1].split(",").map((s) => s.trim()), ["interactive", "reduced", "generation", "maxDpr"], "visual props must not rebuild GL")

// Every uniform the JS binds exists in the shader, every uniform the shader
// declares is bound, and the ripple array size matches.
const fragStart = src.indexOf("const FRAG = `")
const frag = src.slice(fragStart, src.indexOf("`", fragStart + 14))
const bound = [...src.matchAll(/u\("(u[A-Z]\w*)"\)/g)].map((m) => m[1])
const declared = [...frag.matchAll(/^uniform \w+ (u[A-Z]\w*)/gm)].map((m) => m[1])
assert.ok(bound.length >= 25, `expected the uniforms to be looked up by name, saw ${bound.length}`)
for (const name of bound) assert.ok(declared.includes(name), `shader is missing uniform ${name}`)
for (const name of declared) assert.ok(bound.includes(name), `uniform ${name} is declared but never uploaded`)
const max = Number(src.match(/const MAX_RIPPLES = (\d+)/)[1])
assert.ok(frag.includes("uRipples[" + max + "]") && frag.includes("i < " + max), "ripple array size drifted from MAX_RIPPLES")

// No backticks or ${ inside the shader strings — they are template literals.
assert.doesNotMatch(frag.slice(14), /\$\{/, "no interpolation inside the shader")

// The canvas has to fill its box explicitly — it has no intrinsic size.
assert.ok(src.includes('className="absolute inset-0 block h-full w-full"'), "canvas must fill the root")

// The colour helpers run for real.
const start = src.indexOf("// #region color")
const end = src.indexOf("// #endregion")
assert.ok(start > -1 && end > start, "color region markers missing")
const js = src
  .slice(start, end)
  .replace(/\(hex: string\)/, "(hex)")
  .replace(/\(hex: string, fallback: string\)/, "(hex, fallback)")
const { hexToRgb, cssHex } = await import("data:text/javascript," + encodeURIComponent(js))

const close = (a, b) => a.every((v, i) => Math.abs(v - b[i]) < 1e-6)
assert.ok(close(hexToRgb("#ff6fd8"), [1, 0x6f / 255, 0xd8 / 255]), "6-digit hex")
assert.ok(close(hexToRgb("#fff"), [1, 1, 1]), "3-digit hex")
assert.ok(close(hexToRgb("FF000080"), [1, 0, 0]), "8-digit hex drops alpha")
assert.ok(close(hexToRgb("not a colour"), [0, 0, 0]), "junk falls back to black")

// The fallback gradient appends alpha digits to these, so anything but #rgb /
// #rrggbb would make the whole declaration invalid and paint nothing.
assert.equal(cssHex("#abc", "#000"), "#abc")
assert.equal(cssHex(" #AABBCC ", "#000"), "#AABBCC")
assert.equal(cssHex("#aabbcc80", "#000"), "#000", "alpha hex must not reach the gradient")
assert.equal(cssHex("red", "#111"), "#111", "named colours must not reach the gradient")

// Every preset is a full palette of #rrggbb.
const presetBlock = src.slice(src.indexOf("export const HOLO_CHROME_PRESETS"), src.indexOf("satisfies Record"))
const names = [...presetBlock.matchAll(/^  "?([a-z-]+)"?: \{/gm)].map((m) => m[1])
assert.ok(names.length >= 5, "expected at least five presets")
const fields = [...presetBlock.matchAll(/(base|shine|vein|filmA|filmB|filmC): "(#[0-9a-f]+)"/gi)]
assert.equal(fields.length, names.length * 6, "every preset sets all six colours")
for (const [, , hex] of fields) assert.ok(/^#[0-9a-f]{6}$/i.test(hex), `preset colour ${hex} must be #rrggbb`)
assert.ok(names.includes("opal") && /preset = "opal"/.test(src), "opal is the default look")

// Demos import the installer's path and keep the full-bleed one full-bleed.
for (const name of ["demo.tsx", "demo-hero.tsx", "demo-playground.tsx"]) {
  const demo = readFileSync(new URL(`../components/holo-chrome-flow/${name}`, import.meta.url), "utf8")
  assert.ok(demo.includes('from "@/components/ui/holo-chrome-flow"'), `${name} must import the installed path`)
  assert.doesNotMatch(demo, /from ["']\.\.?\//, `${name} must not import relatively`)
}

console.log("holo-chrome-flow: ok")
