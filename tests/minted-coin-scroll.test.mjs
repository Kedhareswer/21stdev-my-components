// Runnable check for components/minted-coin-scroll: the scroll → story mapping,
// the toss rules, the torn-paper geometry and the install-safety rules.
// Run: node tests/minted-coin-scroll.test.mjs
//
// What breaks silently here is timing: a coin that ends its spin on tails, a page
// that is still folding when the buttons appear, or a chapter whose jump target
// lands in the neighbouring chapter.
import assert from "node:assert/strict"
import { readFileSync, readdirSync, statSync } from "node:fs"
import { liftRegion } from "./_component-safety.mjs"

const slug = "minted-coin-scroll"
const dir = new URL("../components/" + slug + "/", import.meta.url)
const file = new URL(slug + ".tsx", dir)
const src = readFileSync(file, "utf8").replace(/\r\n/g, "\n")
const demo = readFileSync(new URL("demo.tsx", dir), "utf8")

// ---- install safety -------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "react is the only import")
assert.deepEqual(readdirSync(dir).sort(), ["README.md", "demo.tsx", slug + ".tsx"].sort(), "folder holds only the publishable files")
assert.ok(statSync(file).size < 120_000, "stays well under 21st's file limit: " + statSync(file).size)
const ts = readFileSync(new URL("../tsconfig.json", import.meta.url), "utf8")
assert.ok(ts.includes('"@/components/ui/' + slug + '": ["./components/' + slug + "/" + slug + '.tsx"]'), "tsconfig paths line")
assert.match(src, /height = "100svh"/, "height defaults to a definite length")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")
assert.doesNotMatch(src + demo, /use(Ref|State|Memo|Callback|Reducer|Context)</, "no generic hook type arguments (they hang the 21st CLI)")
assert.doesNotMatch(src, /var\(--color-/, "assumes no host tokens")
const urls = [...(src + demo).matchAll(/https?:\/\/[^"'\s)]+/g)].map((m) => m[0]).filter((u) => !u.startsWith("http://www.w3.org/"))
assert.deepEqual(urls, [], "fetches nothing: every asset is drawn in code")
assert.match(src, /prefers-reduced-motion: reduce/, "reduced motion is read at runtime")
assert.match(src, /\(hover: hover\) and \(pointer: fine\)/, "fine-pointer gate is read at runtime")
assert.match(src, /e\.pointerType !== "mouse"/, "touch never drives the cursor, tilt or magnets")

const cssAt = src.indexOf("const CSS =")
const css = src.slice(cssAt, src.indexOf("/* ---", cssAt)).replace(/"\s*\+\s*\n\s*(\/\*[^*]*\*\/\s*\n\s*)?"/g, "")
assert.doesNotMatch(css, /`|\$\{|@import/, "no backticks, ${ or @import in the CSS string")
assert.match(css, /@media \(prefers-reduced-motion:reduce\)/, "CSS honours reduced motion")
assert.match(css, /@media \(hover:hover\) and \(pointer:fine\)\{\.mcs-cursor\{display:block\}/, "the cursor only exists where a mouse can hover")
assert.match(css, /\.mcs-cursor\{display:none/, "and is hidden everywhere else")
let rules = 0
for (const m of css.replace(/^const CSS =\s*"/, "").matchAll(/(?<=^|[{}"])\s*([^{}"]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (sel.startsWith("@") || /^(from|to|\d)/.test(sel)) continue
  rules++
  assert.ok(sel.split(",").every((x) => x.trim().startsWith(".mcs-")), "unscoped selector: " + sel)
}
assert.ok(rules >= 40, "the scope check saw real rules, saw " + rules)

// layout reads live only in measure / jump / pointer-enter / magnet-enter — never in the frame loop
const loopAt = src.indexOf("const frame = (now: number)")
const loop = src.slice(loopAt, src.indexOf("const start = ()", loopAt))
assert.doesNotMatch(loop, /getBoundingClientRect|offset(Top|Left|Width|Height)|client(Width|Height)|scrollHeight|getComputedStyle/, "the frame loop never reads layout")
assert.equal((src.match(/getBoundingClientRect/g) || []).length, 4, "measure, jump, pointer enter, magnet enter")

// ---- the story -----------------------------------------------------------
const S = await liftRegion(src, "story")

assert.equal(S.progressFrom(0, 5000, 1000), 0)
assert.equal(S.progressFrom(-4000, 5000, 1000), 1)
assert.equal(S.progressFrom(300, 5000, 1000), 0, "before it arrives")
assert.equal(S.progressFrom(-1e6, 5000, 1000), 1, "after it leaves")
assert.equal(S.progressFrom(-10, 800, 1000), 0, "no travel, no progress, never NaN")

{
  const a = S.story(0)
  assert.deepEqual([a.u, a.spin, a.m, a.t], [0, 0, 0, 0], "starts wrapped, still, full page")
  const z = S.story(1)
  assert.deepEqual([z.u, z.spin, z.m, z.t], [1, 360, 1, 1], "ends unwrapped, one full turn (heads up), hung, settled")
  let prev = S.story(0)
  for (let p = 0.001; p <= 1.0001; p += 0.001) {
    const b = S.story(p)
    for (const k of ["u", "spin", "m", "t"]) assert.ok(b[k] >= prev[k] - 1e-12, k + " never runs backwards at p=" + p.toFixed(3))
    // order of events: the paper is off before the page starts to fold; buttons only once it has folded
    if (b.m > 0.01) assert.ok(b.u > 0.99, "the page folds only after the wrapper is gone, p=" + p.toFixed(3))
    if (b.t > 0) assert.ok(b.m > 0.999, "actions appear only on a finished banner, p=" + p.toFixed(3))
    prev = b
  }
}

// each chapter's jump target sits inside its own chapter, and on a still frame
S.CHAPTERS.forEach((c, k) => {
  assert.equal(S.chapterAt(c.hold), k, c.label + " jumps into itself")
})
assert.equal(S.story(S.CHAPTERS[1].hold).u, 1, "Unwrapped holds with the paper fully off")
assert.equal(S.story(S.CHAPTERS[3].hold).t, 1, "Hung holds with everything settled")

assert.equal(S.approach(0, 1, 0, 100), 0)
assert.ok(Math.abs(S.approach(0, 1, 1e6, 100) - 1) < 1e-9)
assert.ok(S.approach(0, 1, 16, 100) > 0 && S.approach(0, 1, 16, 100) < 1)

// ---- the toss ------------------------------------------------------------
for (let n = 1; n <= 12; n++) {
  const f = S.tossLanding(n, 0.3)
  if (n === S.EDGE_TOSS) assert.equal(f, "edge", "the seventh toss stands on its edge")
  else assert.notEqual(f, "edge", "only the seventh")
}
assert.equal(S.tossLanding(1, 0.2), "heads")
assert.equal(S.tossLanding(1, 0.8), "tails")
{
  let rot = 0
  const r = S.mulberry32(5)
  for (let n = 1; n <= 40; n++) {
    const face = S.tossLanding(n, r())
    const next = S.tossTurns(rot, face, r())
    assert.ok(next - rot >= 720, "at least two full turns, toss " + n)
    assert.equal(S.faceOf(next), face, "lands on the face it was dealt, toss " + n)
    rot = next
  }
}

// ---- torn paper ------------------------------------------------------------
{
  const e = S.tornEdge(29, -232, 232, -48, -112, 9, 34)
  assert.equal(e.length, 35)
  assert.deepEqual([e[0][0], e[34][0]], [-232, 232], "the tear spans the whole coin")
  for (let i = 1; i < e.length; i++) assert.ok(e[i][0] > e[i - 1][0], "x only moves forward, so the outline never folds over itself")
  assert.deepEqual(S.tornEdge(29, -232, 232, -48, -112, 9, 34), e, "seeded: same tear every render")
  assert.doesNotMatch(S.polyline(e), /NaN/)
}
console.log(slug + ": ok")
