// Runnable check for components/sheen-board-landing: the measured motion curves, the carousel
// wrap, the board scale, and the install-safety rules.
// Run: node tests/sheen-board-landing.test.mjs
//
// What breaks silently here: a linear() easing that doesn't start at 0 or end at 1 (the browser
// drops the whole transition and everything snaps), a carousel index that drifts out of the
// middle copy (blank cards), a root without a width (21st centres demos in a flex box), or
// a file that grows past 21st's 200 kB limit.
import assert from "node:assert/strict"
import { readFileSync, readdirSync, statSync } from "node:fs"
import { liftRegion } from "./_component-safety.mjs"

const slug = "sheen-board-landing"
const dir = new URL("../components/" + slug + "/", import.meta.url)
const file = new URL(slug + ".tsx", dir)
const src = readFileSync(file, "utf8").replace(/\r\n/g, "\n")
const demo = readFileSync(new URL("demo.tsx", dir), "utf8")

// ---- install safety -------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "react is the only import")
assert.deepEqual(readdirSync(dir).sort(), ["README.md", "demo.tsx", slug + ".tsx"].sort(), "folder holds only the publishable files")
assert.ok(statSync(file).size < 200_000, "under 21st's 200 kB limit: " + statSync(file).size)

const ts = readFileSync(new URL("../tsconfig.json", import.meta.url), "utf8")
assert.ok(ts.includes('"@/components/ui/' + slug + '": ["./components/' + slug + "/" + slug + '.tsx"]'), "tsconfig paths line")
const templates = JSON.parse(readFileSync(new URL("../scripts/templates.json", import.meta.url), "utf8"))
assert.ok(templates.templates.some((t) => t.slug === slug), "listed as a template")
assert.match(demo, /from "@\/components\/ui\/sheen-board-landing"/, "demo imports the installed path")

assert.match(src, /height = "100svh"/, "height defaults to a definite length")
assert.match(src, /style=\{\{ height, width: "100%" \}\}/, "root takes the full width")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")
assert.doesNotMatch(src + demo, /use(Ref|State|Memo|Callback|Reducer|Context)</, "no generic hook type arguments (they hang the 21st CLI)")
assert.doesNotMatch(src, /var\(--color-/, "assumes no host tokens")
for (const [, v] of src.matchAll(/var\((--[a-z0-9-]+)/g)) assert.ok(/^--(sh-|rd$|ry$|rx$|k$|c$|s$|i$|x$|e$)/.test(v), "own custom property only: " + v)
const urls = [...(src + demo).matchAll(/https?:\/\/[^"'\s)]+/g)].map((m) => m[0]).filter((u) => !u.startsWith("http://www.w3.org/"))
assert.deepEqual(urls, [], "fetches nothing: the board is DOM and the fonts are embedded")
assert.equal((src.match(/@font-face\{font-family:Sh(Display|Sans)/g) || []).length, 2, "two embedded, renamed font subsets")
assert.match(src, /prefers-reduced-motion: reduce/, "reduced motion is read at runtime")
assert.match(src, /mailto:/, "contact goes to email")
assert.match(src, /email = "kedhareswer\.12110626@gmail\.com"/, "default contact address")

// identity: nothing from the reference
for (const w of [/framer/i, /pretty/i, /oversight/i, /clientos/i, /ovo-/i]) assert.doesNotMatch(src + demo, w, "no trace of the reference: " + w)

const cssAt = src.indexOf("const CSS =")
const css = src.slice(cssAt).replace(/" \+ (BTN_S|DISPLAY) \+ "/g, "").replace(/"\s*\+\s*\n\s*(\/\/[^\n]*\n\s*)*"/g, "").replace(/"\s*\+\s*[A-Z_.]+\s*\+\s*"/g, "")
assert.doesNotMatch(css, /`|\$\{|@import/, "no backticks, ${ or @import in the CSS string")
assert.match(css, /@media \(prefers-reduced-motion:reduce\)/, "CSS honours reduced motion")
assert.match(css, /@media \(hover:hover\) and \(pointer:fine\)\{/, "hover effects only for fine pointers")
assert.match(css, /\.sh-root svg,\.sh-root img\{max-width:none/, "guards Preflight's img/svg max-width")
let rules = 0
for (const m of css.replace(/^const CSS =\s*"/, "").matchAll(/(?<=^|[{}"])\s*([^{}"]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (sel.startsWith("@") || /^(from|to|\d)/.test(sel)) continue
  rules++
  assert.ok(sel.replace(/\([^)]*\)/g, "()").split(",").every((x) => /^\.sh-/.test(x.trim())), "unscoped selector: " + sel)
}
assert.ok(rules >= 150, "the scope check saw real rules, saw " + rules)

// ---- motion ----------------------------------------------------------------
const M = await liftRegion(src, "motion")

const stops = (e) => e.slice(7, -1).split(",").map((s) => parseFloat(s.trim()))
for (const k of ["EASE_WORD", "EASE_ITEM", "EASE_TILT", "EASE_FAST", "EASE_SLIDE"]) {
  const v = stops(M[k])
  assert.ok(M[k].startsWith("linear(") && M[k].endsWith(")"), k + " is a linear() easing")
  assert.equal(v[0], 0, k + " starts at 0")
  assert.equal(v[v.length - 1], 1, k + " ends at rest")
  const peak = Math.max(...v)
  if (k === "EASE_SLIDE") assert.equal(peak, 1, "the slideshow glide never overshoots")
  else assert.ok(peak > 1 && peak < 1.02, k + " has the measured small overshoot, got " + peak)
  for (const s of M[k].slice(7, -1).split(",")) {
    const pct = s.trim().split(/\s+/)[1]
    if (pct) assert.match(pct, /^\d+(\.\d+)?%$/, k + " stop position " + pct)
  }
}
// measured on the reference: 45% of the way at 95ms for words, ~0.9% overshoot everywhere
assert.ok(M.DUR_WORD >= 560 && M.DUR_WORD <= 680)
assert.ok(M.DUR_ITEM > M.DUR_WORD && M.DUR_TILT > M.DUR_ITEM, "words settle first, cards next, tilts last")
assert.equal(M.wordDelay(0, 450), 450)
assert.equal(M.wordDelay(3, 200), 440, "80ms per word")
assert.equal(M.wordDelay(-2, 200), 200, "never before the start")
assert.equal(M.itemDelay(2), 390, "95ms per item after a 200ms in-view delay")
assert.equal(M.itemDelay(40), M.itemDelay(5), "long rows are capped")
assert.ok(M.HERO.words < M.HERO.board && M.HERO.board < M.HERO.sub && M.HERO.sub < M.HERO.explore && M.HERO.explore < M.HERO.start, "hero order: words, board, line, buttons")
assert.equal(M.HERO.sub - M.HERO.words, 450, "the line follows the first word by ~470ms, as measured")

assert.equal(M.boardScale(M.BOARD_W), 1)
assert.equal(M.boardScale(630), 0.5)
assert.equal(M.SLIDE_EVERY, 4000, "the slideshow advances every 4s, as measured")
assert.ok(M.DUR_SLIDE < M.SLIDE_EVERY)
assert.equal(M.boardScale(0), 1, "no width yet, no collapse")
assert.equal(M.boardScale(NaN), 1)

const n = 4
for (let i = 0; i < 3 * n; i++) {
  const w = M.wrapIndex(i, n)
  assert.ok(w >= n && w < 2 * n, "index " + i + " lands in the middle copy")
  assert.equal(w % n, i % n, "and shows the same card")
}
assert.equal(M.wrapIndex(-1, n), 2 * n - 1)
assert.equal(M.wrapIndex(3, 0), 0)

console.log("sheen-board-landing: ok")
