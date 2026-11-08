// Install-safety and motion-logic checks for components/3d-curved-carousel.
// Run: node tests/3d-curved-carousel.test.mjs
import assert from "node:assert/strict"
import { readFileSync, readdirSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const dir = new URL("../components/3d-curved-carousel/", import.meta.url)
const src = readFileSync(new URL("3d-curved-carousel.tsx", dir), "utf8")

// ---- install safety ------------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "imports react only")
assert.deepEqual(readdirSync(dir).sort(), ["3d-curved-carousel.tsx", "README.md", "demo.tsx"])
assert.ok(src.includes('height = "100svh"'), "stage height defaults to a definite length")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full: percentage heights collapse on an installed page")
assert.doesNotMatch(src, /use(Ref|State|Memo|Callback|Effect)</, "no generic hook type arguments (they hang the 21st CLI)")
assert.ok(src.length < 60_000, "the component stays lean: " + src.length)

const cssAt = src.indexOf("const CSS =")
const css = src.slice(cssAt, src.indexOf("\n\n", cssAt))
assert.doesNotMatch(css, /`|\$\{|@import/, "no backticks, ${ or @import in the CSS string")
const flat = css.replace(/"\s*\+\s*\n\s*"/g, "").replace(/url\(\\"data:.*?\\"\)/g, "url()")
let rules = 0
for (const m of flat.matchAll(/(?<=^|[{}"])\s*([^{}"]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (sel.startsWith("@") || sel.startsWith("const CSS") || sel.startsWith("FONT +")) continue
  rules++
  assert.ok(sel.split(",").every((s) => s.trim().startsWith(".clc-")), "unscoped selector: " + sel)
}
assert.ok(rules >= 25, "the scope check saw real rules, saw " + rules)
assert.match(flat, /\.clc-fallback\{[^}]*max-width:none/, "the fallback photo overrides Preflight's max-width")
const allowed = new Set(["--clc-ink", "--clc-font"])
for (const [, v] of src.matchAll(/var\((--[a-z-]+)/g)) assert.ok(allowed.has(v), "token not guaranteed in a host: " + v)
const urls = [...src.matchAll(/https?:\/\/[^"'\s)]+/g)].map((m) => m[0]).filter((u) => !u.startsWith("http://www.w3.org/2000/svg"))
assert.deepEqual(urls, [], "the component fetches nothing itself")

// ---- runtime hygiene -------------------------------------------------------------
assert.match(src, /matchMedia\("\(prefers-reduced-motion: reduce\)"\)/, "reduced motion is read")
assert.match(flat, /@media \(prefers-reduced-motion:reduce\)/, "CSS transitions honour reduced motion")
assert.ok(src.includes("Math.min(2, window.devicePixelRatio || 1)"), "DPR capped at 2")
assert.ok(src.includes("new ResizeObserver") && src.includes("entries[0].contentRect"), "size comes from ResizeObserver")
assert.ok(src.includes("new IntersectionObserver"), "pauses off-screen")
assert.doesNotMatch(src, /getBoundingClientRect|offset(Top|Left|Width|Height)|client(Width|Height)|scrollHeight|getComputedStyle|inner(Width|Height)/, "no layout reads anywhere")
assert.doesNotMatch(src, /addEventListener\("wheel"/, "the page scroll is never captured")
assert.match(src, /touch-action:pan-y/, "vertical swipes still scroll the page on touch")
for (const gone of ["cancelAnimationFrame(raf)", "ro.disconnect()", "io.disconnect()", "gl.deleteTexture", "gl.deleteProgram(prog)", 'canvas.removeEventListener("pointermove", onMove)', 'root.removeEventListener("keydown", onKey)'])
  assert.ok(src.includes(gone), "cleanup is missing " + gone)
assert.ok(src.includes('aria-roledescription="carousel"') && src.includes('aria-live="polite"'), "carousel semantics")
assert.doesNotMatch(src, /autoplay|setInterval/, "no autoplay")
assert.match(src, /"precision highp float;"/, "uniforms shared by both shaders need matching precision")

// ---- the lifted motion logic -------------------------------------------------------
const start = src.indexOf("// #region motion")
const end = src.indexOf("// #endregion", start)
assert.ok(start > -1 && end > start, "motion region markers missing")
const L = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(src.slice(start, end))))

assert.equal(L.wrap(-1, 7), 6)
assert.equal(L.wrap(7, 7), 0)
assert.equal(L.wrap(3, 0), 0, "empty list")
assert.equal(L.offsetOf(0, 0, 7), 0)
assert.equal(L.offsetOf(6, 0, 7), -1, "the last slide sits just left of the first")
assert.equal(L.offsetOf(1, 6.5, 7), 1.5, "offsets wrap the short way round")
assert.equal(L.restFor(2.2, 0), 2)
assert.equal(L.restFor(2.2, 10), 4, "a flick carries further")
assert.equal(L.restFor(0, 1000), 3, "flicks are capped")
let p = 0, v = 0, peak = 0
for (let i = 0; i < 120; i++) {
  ;[p, v] = L.springStep(p, v, 1, 1 / 60)
  peak = Math.max(peak, p)
}
assert.ok(Math.abs(p - 1) < 0.002 && Math.abs(v) < 0.05, "the spring settles in two seconds: " + p)
assert.ok(peak < 1.01, "critically damped: no visible overshoot " + peak)
const [cw, ch] = L.cardSize(1440, 900)
assert.ok(cw > 200 && cw <= 320 && ch > cw, "desktop cards are portrait " + cw + "x" + ch)
assert.ok(L.cardSize(375, 812)[0] < 375 * 0.6, "phone cards leave the neighbours peeking in")
assert.equal(L.pad2(4), "04")

console.log("3d-curved-carousel: ok")
