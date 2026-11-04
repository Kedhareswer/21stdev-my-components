// Install-safety and orbit-logic checks for components/orbit-screens-showcase.
// Run: node tests/orbit-screens-showcase.test.mjs
import assert from "node:assert/strict"
import { readFileSync, readdirSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const dir = new URL("../components/orbit-screens-showcase/", import.meta.url)
const src = readFileSync(new URL("orbit-screens-showcase.tsx", dir), "utf8")

// ---- install safety ------------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react", "three", "three/examples/jsm/environments/RoomEnvironment.js"], "imports react and three only")
const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"))
assert.ok(pkg.dependencies.three, "three is declared in the root package.json")
assert.deepEqual(readdirSync(dir).sort(), ["README.md", "demo.tsx", "orbit-screens-showcase.tsx"])
assert.ok(src.includes('height = "100svh"'), "stage height defaults to a definite length")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full: percentage heights collapse on an installed page")
assert.doesNotMatch(src, /use(Ref|State|Memo|Callback|Effect|LayoutEffect)</, "no generic hook type arguments (they hang the 21st CLI)")
assert.ok(src.length < 40_000, "the component stays lean: " + src.length)

const cssAt = src.indexOf("const CSS =")
const css = src.slice(cssAt, src.indexOf("\n\n", cssAt))
assert.doesNotMatch(css, /`|\$\{|@import/, "no backticks, ${ or @import in the CSS string")
const flat = css.replace(/"\s*\+\s*\n\s*"/g, "")
let rules = 0
for (const m of flat.matchAll(/(?<=^|[{}"])\s*([^{}"]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (sel.startsWith("@") || sel.startsWith("const CSS") || /^(from|to)$/.test(sel)) continue
  rules++
  assert.ok(sel.split(",").every((s) => s.trim().startsWith(".oss-")), "unscoped selector: " + sel)
}
assert.ok(rules >= 30, "the scope check saw real rules, saw " + rules)
assert.match(flat, /\.oss-fallback\{[^}]*max-width:none/, "the fallback photo overrides Preflight's max-width")
const allowed = new Set(["--oss-bg", "--oss-ink", "--oss-accent"])
for (const [, v] of src.matchAll(/var\((--[a-z-]+)/g)) assert.ok(allowed.has(v), "token not guaranteed in a host: " + v)
assert.deepEqual([...src.matchAll(/https?:\/\/[^"'\s)]+/g)].map((m) => m[0]), [], "the component fetches nothing itself")

// ---- runtime hygiene -------------------------------------------------------------
assert.match(src, /matchMedia\("\(prefers-reduced-motion: reduce\)"\)/, "reduced motion is read")
assert.match(flat, /@media \(prefers-reduced-motion:reduce\)/, "CSS animations honour reduced motion")
assert.ok(src.includes("renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1))"), "DPR capped at 2")
assert.ok(src.includes("new ResizeObserver") && src.includes("entries[0].contentRect"), "sizes come from ResizeObserver")
assert.ok(src.includes("new IntersectionObserver"), "pauses off-screen")
// The only layout read is the canvas rect, taken on pointerenter / pointerdown.
assert.equal(src.match(/getBoundingClientRect/g)?.length, 1, "one layout read in the whole file")
const measure = src.slice(src.indexOf("const measure = () => {"), src.indexOf("const frame ="))
assert.ok(measure.includes("getBoundingClientRect"), "and it lives in measure()")
const frame = src.slice(src.indexOf("const frame = (now: number) => {"), src.indexOf("function kick()"))
const onMove = src.slice(src.indexOf("const onMove = (e: PointerEvent) => {"), src.indexOf("const onUp ="))
for (const [name, body] of [["frame", frame], ["onMove", onMove]]) {
  assert.ok(body.length > 200, name + " sliced")
  assert.doesNotMatch(body, /measure\(|getBoundingClientRect|offset(Top|Left|Width|Height|X|Y)|client(Width|Height)|getComputedStyle|inner(Width|Height)/, "no layout reads in " + name)
}
for (const gone of ["cancelAnimationFrame(raf)", "ro.disconnect()", "io.disconnect()", "renderer.dispose()", "pmrem.dispose()", "env.dispose()", "knotGeo.dispose()", "knotMat.dispose()", "dustGeo.dispose()", "plane.dispose()", "it.mat.map?.dispose()", 'canvas.removeEventListener("pointermove", onMove)', 'root.removeEventListener("keydown", onKey)'])
  assert.ok(src.includes(gone), "cleanup is missing " + gone)
assert.doesNotMatch(src, /addEventListener\("wheel"|passive: false/, "the page scroll is never hijacked")
assert.match(flat, /touch-action:pan-y/, "vertical swipes still scroll the page")
assert.ok(src.includes('aria-roledescription="carousel"') && src.includes('aria-live="polite"'), "carousel semantics")

// ---- the lifted orbit logic -----------------------------------------------------------
const start = src.indexOf("// #region orbit")
const end = src.indexOf("// #endregion", start)
assert.ok(start > -1 && end > start, "orbit region markers missing")
const L = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(src.slice(start, end))))

const near = (a, b, msg) => assert.ok(Math.abs(a - b) < 1e-9, msg + ": " + a + " vs " + b)
near(L.screenAngle(2, 2, 8), Math.PI / 2, "turning to i brings screen i to the front")
near(Math.sin(L.screenAngle(0, 4, 8)), -1, "the opposite screen sits at the back")
assert.equal(L.turnTo(1, 0, 8), 1)
assert.equal(L.turnTo(7, 0, 8), -1, "the short way round")
assert.equal(L.turnTo(0, 15.2, 8), 16, "from far along the ring too")
assert.equal(L.wrap(L.turnTo(5, 22, 8), 8), 5)
assert.deepEqual(L.toNdc(50, 50, 0, 0, 100, 100), [0, 0])
assert.deepEqual(L.toNdc(10, 20, 10, 20, 100, 100), [-1, 1], "top left is (-1, 1)")
assert.ok(L.framing(0.46).dist > L.framing(1.6).dist, "phones step the camera back")
assert.ok(L.framing(1.6).x > 0, "wide stages shift the scene right of the copy")

console.log("orbit-screens-showcase: ok")
