// Runnable check for components/vellum-journal-template: the scroll → beat mapping,
// the letter reveal, the card swing, the easter egg and the install-safety rules.
// Run: node tests/vellum-journal-template.test.mjs
//
// What breaks silently here is order: a cream page that lands before the black one has risen,
// a headline still revealing while the card covers it, or a menu jump that stops mid-swing.
import assert from "node:assert/strict"
import { readFileSync, readdirSync, statSync } from "node:fs"
import { liftRegion } from "./_component-safety.mjs"

const slug = "vellum-journal-template"
const dir = new URL("../components/" + slug + "/", import.meta.url)
const file = new URL(slug + ".tsx", dir)
const src = readFileSync(file, "utf8").replace(/\r\n/g, "\n")
const demo = readFileSync(new URL("demo.tsx", dir), "utf8")

// ---- install safety -------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "react is the only import")
assert.deepEqual(readdirSync(dir).sort(), ["README.md", "demo.tsx", slug + ".tsx"].sort(), "folder holds only the publishable files")
assert.ok(statSync(file).size < 130_000, "stays under 21st's file limit: " + statSync(file).size)
const ts = readFileSync(new URL("../tsconfig.json", import.meta.url), "utf8")
assert.ok(ts.includes('"@/components/ui/' + slug + '": ["./components/' + slug + "/" + slug + '.tsx"]'), "tsconfig paths line")
const tpl = JSON.parse(readFileSync(new URL("../scripts/templates.json", import.meta.url), "utf8"))
assert.ok(tpl.templates.some((t) => t.slug === slug), "listed in scripts/templates.json")
assert.match(src, /height = "100svh"/, "height defaults to a definite length")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")
assert.doesNotMatch(src + demo, /use(Ref|State|Memo|Callback|Reducer|Context)</, "no generic hook type arguments (they hang the 21st CLI)")
assert.doesNotMatch(src, /var\(--color-/, "assumes no host tokens")
const urls = [...(src + demo).matchAll(/https?:\/\/[^"'\s)]+/g)].map((m) => m[0]).filter((u) => !u.startsWith("http://www.w3.org/"))
assert.deepEqual(urls, [], "fetches nothing: every photograph is painted in code")
assert.doesNotMatch(src, /\bfetch\(|XMLHttpRequest|new Image\(/, "no runtime requests")
assert.match(src, /prefers-reduced-motion: reduce/, "reduced motion is read at runtime")
assert.match(src, /\(hover: hover\) and \(pointer: fine\)/, "fine-pointer gate is read at runtime")
assert.equal((src.match(/e\.pointerType !== "mouse"/g) || []).length, 2, "touch never drives the cursor, parallax or magnets")

// fonts: three OFL subsets, renamed, embedded
for (const name of ["VgDisplay", "VgText", "VgSans"]) assert.match(src, new RegExp("@font-face\\{font-family:" + name + ";"), name + " is embedded")
assert.equal((src.match(/data:font\/woff2;base64,/g) || []).length, 3, "three woff2 data URIs")
assert.match(src, /SIL OFL 1\.1/, "licence noted next to the fonts")
for (const k of ["F_DISPLAY", "F_TEXT", "F_SANS"]) {
  const m = src.match(new RegExp("const " + k + ' = "([A-Za-z0-9+/=]+)"'))
  assert.ok(m && m[1].length > 5000, k + " holds real font data")
  assert.equal(Buffer.from(m[1], "base64").subarray(0, 4).toString("latin1"), "wOF2", k + " is woff2")
}

// the CSS string: scoped, no backticks / ${ / @import
const cssAt = src.indexOf("const CSS =")
const css = src.slice(cssAt, src.indexOf("\n\n", cssAt)).replace(/"\s*\+\s*\n\s*(\/\*[^*]*\*\/\s*\n\s*)?"/g, "").replace(/"\s*\+\s*[A-Z]+\s*\+\s*"/g, "X")
assert.doesNotMatch(css, /`|\$\{|@import/, "no backticks, ${ or @import in the CSS string")
assert.match(css, /@media \(prefers-reduced-motion:reduce\)/, "CSS honours reduced motion")
assert.match(css, /@media \(hover:hover\) and \(pointer:fine\)\{\.vg-cursor\{display:block\}/, "the cursor only exists where a mouse can hover")
assert.match(css, /\.vg-cursor\{display:none/, "and is hidden everywhere else")
assert.match(css, /\.vg-root img,\.vg-root svg,\.vg-root canvas\{max-width:none\}/, "Preflight's img max-width is undone")
let rules = 0
for (const m of css.replace(/^const CSS =\s*"/, "").matchAll(/(?<=^|[{}"])\s*([^{}"]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (sel.startsWith("@") || /^(from|to|\d)/.test(sel)) continue
  rules++
  assert.ok(sel.split(",").every((x) => x.trim().startsWith(".vg-")), "unscoped selector: " + sel)
}
assert.ok(rules >= 60, "the scope check saw real rules, saw " + rules)

// layout reads: measure, jump and magnet enter — never in the frame loop
const loopAt = src.indexOf("const frame = (now: number)")
const loop = src.slice(loopAt, src.indexOf("const start = ()", loopAt))
assert.ok(loop.length > 500, "found the frame loop")
assert.doesNotMatch(loop, /getBoundingClientRect|offset(Top|Left|Width|Height)|client(Width|Height)|scrollHeight|getComputedStyle/, "the frame loop never reads layout")
assert.equal((src.match(/getBoundingClientRect/g) || []).length, 3, "measure, jump, magnet enter")
assert.doesNotMatch(src, /void \w+\.offset/, "no forced reflows to restart animations")

// ---- the story -----------------------------------------------------------
const S = await liftRegion(src, "story")

assert.equal(S.progressFrom(0, 5000, 1000), 0)
assert.equal(S.progressFrom(-4000, 5000, 1000), 1)
assert.equal(S.progressFrom(300, 5000, 1000), 0, "before it arrives")
assert.equal(S.progressFrom(-1e6, 5000, 1000), 1, "after it leaves")
assert.equal(S.progressFrom(-10, 800, 1000), 0, "no travel, no progress, never NaN")
assert.equal(S.flowFrom(800, 1000, 800), 0, "a block below the fold has not started")
assert.equal(S.flowFrom(-1000, 1000, 800), 1, "a block above the fold is done")
assert.equal(S.flowFrom(0, 0, 0), 0, "never NaN")

{
  const a = S.story(0)
  assert.deepEqual([a.hy, a.ab, a.rv, a.wl, a.sw, a.st], [0, 0, 0, 0, 0, 0], "starts on the cover")
  const z = S.story(1)
  assert.deepEqual([z.hy, z.ab, z.rv, z.wl, z.sw, z.st], [1, 1, 1, 1, 1, 1], "ends with the cream page landed")
  let prev = a
  for (let p = 0.001; p <= 1.0001; p += 0.001) {
    const b = S.story(p)
    for (const k of ["hy", "ab", "rv", "wl", "sw", "st"]) assert.ok(b[k] >= prev[k] - 1e-12, k + " never runs backwards at p=" + p.toFixed(3))
    if (b.rv > 0) assert.ok(b.ab > 0.5, "letters reveal only once the black page is mostly up (the reference overlaps them), p=" + p.toFixed(3))
    if (b.sw > 0) assert.ok(b.rv === 1, "the card comes only after the headline is fully read, p=" + p.toFixed(3))
    if (b.st > 0) assert.ok(b.sw > 0.9, "the underline draws only on a nearly landed card, p=" + p.toFixed(3))
    prev = b
  }
  // the reading pause: the headline sits complete before the card arrives
  assert.ok(S.BEATS.swing[0] - S.BEATS.reveal[1] >= 0.04, "a held beat between the reveal and the swing")
}

// letters: a soft wave, first letter first, all present at the end
{
  const n = 30
  assert.equal(S.letterAlpha(0, 0, n), 0)
  assert.equal(S.letterAlpha(1, n - 1, n), 1, "the last letter arrives")
  for (let rv = 0; rv <= 1; rv += 0.05) for (let i = 1; i < n; i++) assert.ok(S.letterAlpha(rv, i - 1, n) >= S.letterAlpha(rv, i, n), "earlier letters lead")
  assert.match(css, /--a:clamp\(0,calc\(\(var\(--rv\) \* \(var\(--n\) \+ 8\) - var\(--i\)\) \/ 8\),1\)/, "CSS mirrors letterAlpha with W = " + S.REVEAL_W)
  assert.equal(S.REVEAL_W, 8)
}

// the swing: off-stage and turned at rest, square and full size when landed
{
  const off = S.swingPose(0)
  assert.equal(off.rot, -140)
  assert.ok(off.ty >= 150, "starts a full stage and a half below")
  const on = S.swingPose(1)
  assert.deepEqual([on.rot, on.ty, on.tx, on.sc].map((v) => v + 0), [0, 0, 0, 1], "lands square")
  assert.match(css, /rotate\(calc\(\(1 - var\(--sw\)\) \* -140deg\)\)/, "CSS mirrors the swing angle")
  assert.match(css, /calc\(\(1 - var\(--sw\)\) \* 150cqh\)/, "CSS mirrors the rise")
}

// the squiggle: half drawn by the intro alone, the rest only by scrolling
assert.equal(S.squiggle(0, 0), 0)
assert.equal(S.squiggle(1e9, 0), 0.5)
assert.equal(S.squiggle(1e9, 1), 1)
assert.ok(S.squiggle(1e9, 5) <= 1)

// menu jumps land on held beats
for (const [k, p] of Object.entries(S.JUMPS)) {
  const a = S.story(p - 0.01)
  const b = S.story(Math.min(1, p + 0.01))
  for (const key of ["ab", "sw"]) assert.ok(Math.abs(a[key] - b[key]) < 0.02, k + " jump lands where " + key + " is still")
}
assert.deepEqual(S.STILL, { hy: 0, ab: 1, rv: 1, wl: 1, sw: 1, st: 1 }, "reduced motion shows every chapter arrived")

// the easter egg: five quick taps, and slow taps never add up
{
  let st = { times: [], fire: false }
  for (let i = 0; i < 4; i++) st = S.tapEgg(st.times, 1000 + i * 200)
  assert.equal(st.fire, false)
  st = S.tapEgg(st.times, 1900)
  assert.equal(st.fire, true, "fifth quick tap fires")
  assert.deepEqual(st.times, [], "and resets")
  let slow = { times: [], fire: false }
  for (let i = 0; i < 10; i++) slow = S.tapEgg(slow.times, i * 3000)
  assert.equal(slow.fire, false, "slow taps never fire")
}

// seeded random is deterministic: the same photographs every visit
{
  const a = S.mulberry32(7)
  const b = S.mulberry32(7)
  for (let i = 0; i < 5; i++) assert.equal(a(), b())
}

console.log("vellum-journal-template: ok")
