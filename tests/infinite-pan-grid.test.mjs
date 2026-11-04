// Install-safety and grid-logic checks for components/infinite-pan-grid.
// Run: node tests/infinite-pan-grid.test.mjs
import assert from "node:assert/strict"
import { readFileSync, readdirSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const dir = new URL("../components/infinite-pan-grid/", import.meta.url)
const src = readFileSync(new URL("infinite-pan-grid.tsx", dir), "utf8")

// ---- install safety ------------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "imports react only")
assert.deepEqual(readdirSync(dir).sort(), ["README.md", "demo.tsx", "infinite-pan-grid.tsx"])
assert.ok(src.includes('height = "100svh"'), "stage height defaults to a definite length")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full: percentage heights collapse on an installed page")
assert.doesNotMatch(src, /use(Ref|State|Memo|Callback|Effect|LayoutEffect)</, "no generic hook type arguments (they hang the 21st CLI)")
assert.ok(src.length < 30_000, "the component stays lean: " + src.length)

const cssAt = src.indexOf("const CSS =")
const css = src.slice(cssAt, src.indexOf("\n\n", cssAt))
assert.doesNotMatch(css, /`|\$\{|@import/, "no backticks, ${ or @import in the CSS string")
const flat = css.replace(/"\s*\+\s*\n\s*"/g, "")
let rules = 0
for (const m of flat.matchAll(/(?<=^|[{}"])\s*([^{}"]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (sel.startsWith("@") || sel.startsWith("const CSS")) continue
  rules++
  assert.ok(sel.split(",").every((s) => s.trim().startsWith(".ipg-")), "unscoped selector: " + sel)
}
assert.ok(rules >= 25, "the scope check saw real rules, saw " + rules)
assert.match(flat, /\.ipg-tile img\{[^}]*max-width:none/, "photos override Preflight's max-width")
const allowed = new Set(["--ipg-bg", "--ipg-ink", "--ipg-r", "--ipg-mx", "--ipg-my"])
for (const [, v] of src.matchAll(/var\((--[a-z-]+)/g)) assert.ok(allowed.has(v), "token not guaranteed in a host: " + v)
assert.deepEqual([...src.matchAll(/https?:\/\/[^"'\s)]+/g)].map((m) => m[0]), [], "the component fetches nothing itself")

// ---- runtime hygiene -------------------------------------------------------------
assert.match(src, /matchMedia\("\(prefers-reduced-motion: reduce\)"\)/, "reduced motion is read")
assert.match(flat, /@media \(prefers-reduced-motion:reduce\)/, "CSS transitions honour reduced motion")
assert.ok(src.includes("new ResizeObserver") && src.includes("entries[0].contentRect"), "sizes come from ResizeObserver")
assert.ok(src.includes("new IntersectionObserver"), "pauses off-screen")
// Layout is read in exactly two places, neither per frame: measure() and the dock pill.
assert.equal(src.match(/getBoundingClientRect/g)?.length, 1, "one rect read")
assert.ok(src.slice(src.indexOf("const measure = () => {"), src.indexOf("const frame =")).includes("getBoundingClientRect"), "inside measure()")
const pillAt = src.indexOf("React.useLayoutEffect(")
assert.ok(src.slice(pillAt, pillAt + 260).includes("b.offsetLeft"), "offsets read once per density change")
const frame = src.slice(src.indexOf("const frame = (now: number) => {"), src.indexOf("function kick()"))
const handlers = src.slice(src.indexOf("const local = (e: PointerEvent) => {"), src.indexOf("const onDown ="))
for (const [name, body] of [["frame", frame], ["local/onEnter/onMove", handlers.replace(/const onEnter[\s\S]*?\n    \}\n/, "")]]) {
  assert.ok(body.length > 100, name + " sliced")
  assert.doesNotMatch(body, /getBoundingClientRect|measure\(|offset(Top|Left|Width|Height|X|Y)|client(Width|Height)|getComputedStyle|inner(Width|Height)/, "no layout reads in " + name)
}
const writes = [...frame.matchAll(/\.style\.([a-zA-Z]+)\s*=/g)].map((m) => m[1])
assert.deepEqual([...new Set(writes)].sort(), ["opacity", "transform"], "the frame writes transform and opacity only: " + writes)
assert.doesNotMatch(src, /addEventListener\("wheel"|passive: false|touch-action:none/, "the page scroll is never hijacked")
assert.match(flat, /touch-action:pan-y/, "vertical swipes still scroll the page")
for (const gone of ["cancelAnimationFrame(raf)", "ro.disconnect()", "io.disconnect()", 'root.removeEventListener("pointermove", onMove)', 'root.removeEventListener("keydown", onKey)', 'mq.removeEventListener("change", onMq)'])
  assert.ok(src.includes(gone), "cleanup is missing " + gone)
assert.ok(src.includes('aria-pressed={d === density}') && src.includes('aria-label="Grid density"'), "density is a labelled toggle group")

// ---- the lifted grid logic ------------------------------------------------------------
const start = src.indexOf("// #region grid")
const end = src.indexOf("// #endregion", start)
assert.ok(start > -1 && end > start, "grid region markers missing")
const L = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(src.slice(start, end))))

assert.ok(L.cellFor("loose", 1440) > L.cellFor("regular", 1440) && L.cellFor("regular", 1440) > L.cellFor("dense", 1440))
assert.ok(L.cellFor("regular", 375) < L.cellFor("regular", 1440), "smaller tiles on phones")
for (const [w, h, d] of [[1440, 900, "dense"], [375, 812, "loose"], [1920, 1080, "regular"]]) {
  const c = L.cellFor(d, w)
  const [cols, rows] = L.patternFor(w, h, c)
  assert.ok(cols * c >= w && rows * c >= h, "one pattern covers the stage, so two always do")
}
assert.equal(L.wrapOffset(0, 500), 0)
assert.equal(L.wrapOffset(-120, 500), -120)
assert.equal(L.wrapOffset(-620, 500), -120, "wraps the far way")
assert.equal(L.wrapOffset(120, 500), -380, "positive offsets wrap into range")
for (const o of [-1e6, -3.5, 0, 77, 1e6]) {
  const t = L.wrapOffset(o, 500)
  assert.ok(t <= 0 && t > -500, "always in (-span, 0]: " + t)
}
for (const [cols, n] of [[7, 12], [10, 12], [5, 8], [13, 9]]) {
  for (let y = 0; y < 6; y++)
    for (let x = 0; x < cols; x++) {
      const i = L.photoAt(x, y, cols, n)
      assert.ok(i >= 0 && i < n)
      if (x > 0) assert.notEqual(i, L.photoAt(x - 1, y, cols, n), "side-by-side tiles differ")
      if (y > 0) assert.notEqual(i, L.photoAt(x, y - 1, cols, n), "stacked tiles differ")
    }
}
assert.ok(Math.abs(L.coast(100, 1)) < 5 && L.coast(100, 0) === 100, "friction slows a throw within a second")

console.log("infinite-pan-grid: ok")
