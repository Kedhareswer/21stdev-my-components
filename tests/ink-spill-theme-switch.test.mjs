// Install-safety and geometry checks for components/ink-spill-theme-switch.
// Run: node tests/ink-spill-theme-switch.test.mjs
//
// Not checkComponent(): that helper forbids every layout read, and the spill has to
// know where the toggle sits. This file asserts the same rules and allows exactly
// the one measurement per click that the component needs.
import assert from "node:assert/strict"
import { readFileSync, readdirSync } from "node:fs"
import { liftRegion } from "./_component-safety.mjs"

const slug = "ink-spill-theme-switch"
const dir = new URL("../components/" + slug + "/", import.meta.url)
const src = readFileSync(new URL(slug + ".tsx", dir), "utf8").replace(/\r\n/g, "\n")
const demo = readFileSync(new URL("demo.tsx", dir), "utf8")

const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "react is the only import")
assert.deepEqual(readdirSync(dir).sort(), ["README.md", "demo.tsx", slug + ".tsx"].sort(), "folder holds only the publishable files")
const ts = readFileSync(new URL("../tsconfig.json", import.meta.url), "utf8")
assert.ok(ts.includes('"@/components/ui/' + slug + '": ["./components/' + slug + "/" + slug + '.tsx"]'), "tsconfig paths line")

assert.match(src, /height = "100svh"/, "height defaults to a definite length")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")
assert.doesNotMatch(src + demo, /use(Ref|State|Memo|Callback|Reducer|Context)</, "no generic hook type arguments (they hang the 21st CLI)")
assert.match(src, /prefers-reduced-motion: reduce/, "reduced motion is read at runtime")
assert.match(src, /@media \(prefers-reduced-motion:reduce\)/, "CSS honours reduced motion")
assert.doesNotMatch(src, /var\(--/, "assumes no host tokens")
assert.deepEqual([...(src + demo).matchAll(/https?:\/\/[^"'\s)]+/g)].map((m) => m[0]), [], "fetches nothing")

// layout reads: only inside toggle(), i.e. once per click, never per frame
const toggleAt = src.indexOf("const toggle = useCallback(")
const toggleEnd = src.indexOf("}, [])", toggleAt)
const outside = src.slice(0, toggleAt) + src.slice(toggleEnd)
assert.doesNotMatch(outside, /getBoundingClientRect|offset(Top|Left|Width|Height)|client(Width|Height)|scrollHeight|getComputedStyle|inner(Width|Height)/, "no layout reads outside toggle()")
assert.equal((src.match(/getBoundingClientRect/g) || []).length, 2, "stage + toggle, measured once each per click")

const cssAt = src.indexOf("const CSS =")
const css = src.slice(cssAt, src.indexOf("\n\n", cssAt)).replace(/"\s*\+\s*\n\s*"/g, "")
assert.doesNotMatch(css, /`|\$\{|@import/, "no backticks, ${ or @import in the CSS string")
let rules = 0
for (const m of css.matchAll(/(?<=^|[{}"])\s*([^{}"]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (sel.startsWith("@") || sel.startsWith("const CSS")) continue
  rules++
  assert.ok(sel.split(",").every((s) => s.trim().startsWith(".ist-")), "unscoped selector: " + sel)
}
assert.ok(rules >= 5, "the scope check saw real rules, saw " + rules)

// geometry
const g = await liftRegion(src, "ink")
for (const seed of [1, 7, 42, 9001, 123456789]) {
  const ink = g.makeInk(seed)
  assert.ok(ink.dip > 0.1 && ink.dip < 0.4, "rim noise stays in a sane band: " + ink.dip)
  for (const [w, h, ox, oy] of [[1280, 800, 1232, 40], [390, 844, 350, 40], [1920, 1080, 960, 540], [800, 600, 0, 0]]) {
    const Rend = g.coverRadius(ink, ox, oy, w, h)
    // at p = 1 every point on the rim reaches past the farthest corner, so nothing of the old theme survives
    const far = Math.max(Math.hypot(ox, oy), Math.hypot(w - ox, oy), Math.hypot(ox, h - oy), Math.hypot(w - ox, h - oy))
    for (let i = 0; i < 720; i++) {
      const a = (i / 720) * Math.PI * 2
      assert.ok(g.rimAt(ink, a, Rend * g.easeSpill(1), 1) >= far, "corner left uncovered, seed " + seed)
    }
  }
}
assert.equal(g.easeSpill(0), 0)
assert.equal(g.easeSpill(1), 1)
for (let p = 0; p < 1; p += 0.01) assert.ok(g.easeSpill(p + 0.01) >= g.easeSpill(p), "the ink never recedes")

const ink = g.makeInk(5)
assert.equal(g.inkPath(ink, 100, 100, 1000, 0), "", "nothing at p = 0")
const d = g.inkPath(ink, 100, 100, 1000, 0.6)
assert.match(d, /^M[\d.-]+ [\d.-]+L/, "a path that starts with the rim")
assert.doesNotMatch(d, /NaN|Infinity/, "finite coordinates")
assert.ok(!/A[\d.]+ [\d.]+ 0 1 0/.test(d), "droplets wind the same way as the rim, so nonzero fill unions them")
console.log(slug + ": ok")
