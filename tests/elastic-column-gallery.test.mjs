// Install-safety and column-logic checks for components/elastic-column-gallery.
// Run: node tests/elastic-column-gallery.test.mjs
import assert from "node:assert/strict"
import { readFileSync, readdirSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const dir = new URL("../components/elastic-column-gallery/", import.meta.url)
const src = readFileSync(new URL("elastic-column-gallery.tsx", dir), "utf8")

// ---- install safety ------------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react", "gsap", "gsap/ScrollTrigger"], "imports react and gsap only")
assert.deepEqual(readdirSync(dir).sort(), ["README.md", "demo.tsx", "elastic-column-gallery.tsx"])
assert.ok(src.includes('height = "100svh"'), "stage height defaults to a definite length")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full: percentage heights collapse on an installed page")
assert.match(src, /"calc\(" \+ height \+ " \* "/, "the scroll track is a definite multiple of the stage height")
assert.doesNotMatch(src, /use(Ref|State|Memo|Callback|Effect|LayoutEffect)</, "no generic hook type arguments (they hang the 21st CLI)")
assert.ok(src.length < 30_000, "the component stays lean: " + src.length)

const cssAt = src.indexOf("const CSS =")
const css = src.slice(cssAt, src.indexOf("\n\n", cssAt))
assert.doesNotMatch(css, /`|\$\{|@import/, "no backticks, ${ or @import in the CSS string")
const flat = css.replace(/"\s*\+\s*\n\s*"/g, "")
let rules = 0
for (const m of flat.matchAll(/(?<=^|[{}"])\s*([^{}"]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (sel.startsWith("@") || sel.startsWith("const CSS") || /^(from|to)$/.test(sel)) continue
  rules++
  assert.ok(sel.split(",").every((s) => s.trim().startsWith(".ecg-")), "unscoped selector: " + sel)
}
assert.ok(rules >= 18, "the scope check saw real rules, saw " + rules)
assert.match(flat, /\.ecg-tile>img\{[^}]*max-width:none/, "photos override Preflight's max-width")
assert.match(flat, /\.ecg-stage\{position:sticky;top:0/, "the stage pins with sticky, no pin-spacer")
const allowed = new Set(["--ecg-bg"])
for (const [, v] of src.matchAll(/var\((--[a-z-]+)/g)) assert.ok(allowed.has(v), "token not guaranteed in a host: " + v)
assert.deepEqual([...src.matchAll(/https?:\/\/[^"'\s)]+/g)].map((m) => m[0]), [], "the component fetches nothing itself")

// ---- runtime hygiene -------------------------------------------------------------
assert.match(src, /matchMedia\("\(prefers-reduced-motion: reduce\)"\)/, "reduced motion is read")
assert.match(flat, /@media \(prefers-reduced-motion:reduce\)/, "CSS animations honour reduced motion")
assert.ok(src.includes("y[c] = mq.matches ? goal"), "reduced motion moves the columns rigidly")
assert.ok(src.includes('start: "top top"') && src.includes('end: "bottom bottom"'), "follows the whole track")
assert.ok(src.includes("new ResizeObserver") && src.includes("entries[0].contentRect"), "sizes come from ResizeObserver")
assert.ok(src.includes("new IntersectionObserver"), "pauses off-screen")
assert.doesNotMatch(src, /getBoundingClientRect|offset(Top|Left|Width|Height)|client(Width|Height)|scrollHeight|getComputedStyle|inner(Width|Height)/, "no layout reads")
assert.doesNotMatch(src, /touch-action:none|passive: false|addEventListener\("wheel"/, "the page scroll is never hijacked")
assert.doesNotMatch(src, /loading="lazy"/, "no lazy images inside transformed columns")
for (const gone of ["cancelAnimationFrame(raf)", "trigger.kill()", "ro.disconnect()", "io.disconnect()", 'mq.removeEventListener("change", onMq)'])
  assert.ok(src.includes(gone), "cleanup is missing " + gone)
// the frame loop writes transform and opacity only
const frame = src.slice(src.indexOf("const frame = (now: number) => {"), src.indexOf("function kick()"))
const writes = [...frame.matchAll(/\.style\.([a-zA-Z]+)\s*=/g)].map((m) => m[1])
assert.deepEqual([...new Set(writes)].sort(), ["opacity", "transform", "transformOrigin"], "frame writes: " + writes)

// ---- the lifted column logic ---------------------------------------------------------
const start = src.indexOf("// #region columns")
const end = src.indexOf("// #endregion", start)
assert.ok(start > -1 && end > start, "columns region markers missing")
const L = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(src.slice(start, end))))

for (const [n, cols] of [[14, 5], [10, 5], [15, 3], [12, 3]]) {
  const used = new Set()
  for (let c = 0; c < cols; c++)
    for (let r = 0; r < 7; r++) {
      const i = L.photoFor(c, r, n, cols)
      used.add(i)
      assert.ok(i >= 0 && i < n)
      if (c > 0) assert.notEqual(i, L.photoFor(c - 1, r, n, cols), "side-by-side tiles differ (" + n + "/" + cols + ")")
      if (r > 0) assert.notEqual(i, L.photoFor(c, r - 1, n, cols), "stacked tiles differ (" + n + "/" + cols + ")")
    }
  assert.equal(used.size, n, "every photo is used (" + n + "/" + cols + ")")
}
assert.equal(L.photoFor(0, 0, 0, 5), 0, "empty list")
assert.equal(L.columnTarget(0, 0, 500), -0)
assert.equal(L.columnTarget(0, 1, 500), -500, "even columns rise")
assert.equal(L.columnTarget(1, 0, 500), -500)
assert.equal(L.columnTarget(1, 1, 500), -0, "odd columns fall")
assert.equal(L.columnTarget(0, 3, 500), -500, "clamped")
assert.equal(L.columnHeight(0, 2, 100, 10), Math.round(100 * L.tileRatio(0, 0)) + 10 + Math.round(100 * L.tileRatio(0, 1)))
assert.ok(L.columnRate(2, 5, 1) > L.columnRate(0, 5, 1), "outer columns lag more")
assert.equal(L.columnRate(0, 5, 0), 16, "no elasticity, no extra lag")
assert.ok(L.columnRate(0, 5, 1) > 4, "every column still catches up")
assert.equal(L.stretchFor(0, 900), 0)
assert.equal(L.stretchFor(1e6, 900), 0.22, "stretch is capped")

console.log("elastic-column-gallery: ok")
