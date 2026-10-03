// Install-safety check for components/anodized-ink.
// Run: node tests/anodized-ink.test.mjs
//
// A full-screen shader background, so the failures worth guarding are the ones a
// screenshot in this repo cannot see: a dependency that does not travel, a root
// that collapses to 0px once installed, a loop that never stops, a GL context
// that is never released, and uniform names that drifted from the JS.
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

const src = readFileSync(
  new URL("../components/anodized-ink/anodized-ink.tsx", import.meta.url),
  "utf8",
)

// 21st ships this file alone — the source page's three.js must not come back.
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "the only import may be react")
assert.doesNotMatch(src, /THREE\.|from ["']three["']/, "no three.js")

// Root height must be a definite length, never an inherited percentage.
assert.ok(/height = "100svh"/.test(src), "root height must default to a definite length")
assert.doesNotMatch(src, /className=\{"relative w-full[^"]*\bh-full\b/, "no h-full on the root")

// It is a background: it must not restyle the host page or read the window's pointer.
assert.doesNotMatch(src, /@import/, "no @import")
assert.doesNotMatch(src, /^\s*(\*|body|:root)\s*{/m, "no bare global resets")
assert.doesNotMatch(src, /window\.addEventListener\(["']pointer|window\.addEventListener\(["']mouse/, "pointer is read off the component, not the window")
assert.doesNotMatch(src, /cursor:\s*none|cursor-none/, "never hide the host's cursor")

// Reduced motion stops the loop outright; off-screen stops it too.
assert.ok(src.includes("if (!reduced && visible) raf = requestAnimationFrame(draw)"), "loop must stop under reduced motion and off-screen")
assert.ok(src.includes("IntersectionObserver"), "must pause when scrolled away")
assert.ok(/if \(reduced \|\| !paramsRef\.current\.ripples\) return/.test(src), "reduced motion must skip ink drops")

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
]) {
  assert.ok(src.includes(gone), `cleanup is missing ${gone}`)
}

assert.ok(src.includes("webglcontextlost") && src.includes("webglcontextrestored"), "context loss must be handled")
assert.ok(src.includes("setFailed(true)") && src.includes("radial-gradient"), "needs a no-WebGL fallback")

// Props flow through a ref; changing one must not tear down the context.
const deps = src.match(/\}, \[([^\]]*)\]\)\n\n  return \(/)
assert.ok(deps, "main effect deps not found")
assert.deepEqual(deps[1].split(",").map((s) => s.trim()), ["interactive", "reduced", "generation", "maxDpr"], "visual props must not rebuild GL")

// Every uniform the JS binds exists in the shader, and the ripple array size matches.
const frag = src.slice(src.indexOf("const FRAG = `"), src.indexOf("`", src.indexOf("const FRAG = `") + 14))
const bound = [...src.matchAll(/u\("(u[A-Z]\w*)"\)/g)].map((m) => m[1])
assert.ok(bound.length >= 16, "expected the uniforms to be looked up by name")
for (const name of bound) {
  assert.ok(new RegExp("uniform \\w+ " + name + "\\b").test(frag), `shader is missing uniform ${name}`)
}
const max = Number(src.match(/const MAX_RIPPLES = (\d+)/)[1])
assert.ok(frag.includes("uRipples[" + max + "]") && frag.includes("i < " + max), "ripple array size drifted from MAX_RIPPLES")

// The canvas has to fill its box explicitly — it has no intrinsic size.
assert.ok(src.includes('className="absolute inset-0 block h-full w-full"'), "canvas must fill the root")

// hexToRgb runs for real: every preset must parse, and junk must not throw.
const start = src.indexOf("// #region color")
const end = src.indexOf("// #endregion")
assert.ok(start > -1 && end > start, "color region markers missing")
const js = src.slice(start, end).replace(/\(hex: string\)/, "(hex)")
const { hexToRgb } = await import("data:text/javascript," + encodeURIComponent(js))

const close = (a, b) => a.every((v, i) => Math.abs(v - b[i]) < 1e-6)
assert.ok(close(hexToRgb("#d1001c"), [209 / 255, 0, 28 / 255]), "6-digit hex")
assert.ok(close(hexToRgb("#fff"), [1, 1, 1]), "3-digit hex")
assert.ok(close(hexToRgb("FF000080"), [1, 0, 0]), "8-digit hex drops alpha")
assert.ok(close(hexToRgb("not a colour"), [0, 0, 0]), "junk falls back to black")
for (const hex of src.matchAll(/(deep|ink|sheen): "(#[0-9a-f]+)"/gi)) {
  assert.ok(/^#[0-9a-f]{6}$/i.test(hex[2]), `preset colour ${hex[2]} must be #rrggbb`)
}

console.log("anodized-ink: ok")
