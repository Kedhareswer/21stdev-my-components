// Runnable check for components/argent-studio-landing: the scroll → pose mapping
// (hero sculpture, word light-up, counters, capability rows, stacked cards, prices, the easter egg)
// and the install-safety rules.
// Run: node tests/argent-studio-landing.test.mjs
import assert from "node:assert/strict"
import { readFileSync, readdirSync, statSync } from "node:fs"
import { liftRegion } from "./_component-safety.mjs"

const slug = "argent-studio-landing"
const dir = new URL("../components/" + slug + "/", import.meta.url)
const file = new URL(slug + ".tsx", dir)
const src = readFileSync(file, "utf8").replace(/\r\n/g, "\n")
const demo = readFileSync(new URL("demo.tsx", dir), "utf8")

// ---- install safety -------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "react is the only import")
assert.deepEqual(readdirSync(dir).sort(), ["README.md", "demo.tsx", slug + ".tsx"].sort(), "folder holds only the publishable files")
assert.ok(statSync(file).size < 800_000, "pictures stay compressed: " + statSync(file).size)
assert.ok(Buffer.byteLength(demo) < 200_000, "demo under 21st's 200 kB limit")

const ts = readFileSync(new URL("../tsconfig.json", import.meta.url), "utf8")
assert.ok(ts.includes('"@/components/ui/' + slug + '": ["./components/' + slug + "/" + slug + '.tsx"]'), "tsconfig paths line")
const templates = JSON.parse(readFileSync(new URL("../scripts/templates.json", import.meta.url), "utf8"))
assert.ok(templates.templates.some((t) => t.slug === slug), "listed as a template")
assert.match(demo, /from "@\/components\/ui\/argent-studio-landing"/, "demo imports the installed path")

assert.match(src, /height = "100svh"/, "height defaults to a definite length")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")
assert.doesNotMatch(src + demo, /use(Ref|State|Memo|Callback|Reducer|Context)</, "no generic hook type arguments (they hang the 21st CLI)")
for (const [, v] of src.matchAll(/var\((--[a-z0-9-]+)/g)) assert.ok(v.startsWith("--ag-") || ["--q", "--n", "--i", "--r", "--c", "--oy", "--spin", "--fq", "--mx", "--d", "--rd", "--marq"].includes(v), "only its own variables: " + v)
const urls = [...(src + demo).matchAll(/https?:\/\/[^"'\s)]+/g)].map((m) => m[0]).filter((u) => !u.startsWith("http://www.w3.org/"))
assert.deepEqual(urls, [], "fetches nothing: pictures and fonts are embedded")
assert.equal((src.match(/@font-face\{font-family:Ag(Sans|Serif)/g) || []).length, 2, "two embedded, renamed font subsets")
assert.match(src, /prefers-reduced-motion: reduce/, "reduced motion is read at runtime")
assert.match(src, /\(hover: hover\) and \(pointer: fine\)/, "fine-pointer gate is read at runtime")
assert.match(src, /ev\.pointerType !== "mouse"/, "touch never drives the cursor, magnets or tilt")

// every picture slot is filled
const imgKeys = new Set([...src.matchAll(/^  "([a-z]+\d?)": "data:image\/webp;base64,/gm)].map((m) => m[1]))
for (const k of ["hero", "obj0", "obj1", "obj2", "obj3", "work0", "work1", "work2", "team0", "team1", "team2", "team3", "streak"]) assert.ok(imgKeys.has(k), "picture: " + k)

// the CSS string: scoped, no backticks / ${ / @import, honours both media gates
const cssAt = src.indexOf("const CSS = [")
const cssSrc = src.slice(cssAt, src.indexOf('].join("")', cssAt))
const css = [...cssSrc.matchAll(/^\s*"((?:[^"\\]|\\.)*)",?\s*$/gm)].map((m) => m[1].replace(/\\"/g, '"')).join("")
assert.ok(css.length > 5000, "read the CSS")
assert.doesNotMatch(cssSrc, /`|\$\{|@import/, "no backticks, ${ or @import in the CSS string")
const fontSrc = src.slice(src.indexOf("// @@FONTS@@"), src.indexOf("// @@END-FONTS@@"))
assert.doesNotMatch(fontSrc, /`|\$\{|@import/, "nor in the font CSS")
assert.match(css, /@media \(prefers-reduced-motion:reduce\)\{\.ag-root \*,\.ag-root \*::before,\.ag-root \*::after\{animation:none!important/, "CSS stops every animation under reduced motion")
assert.match(css, /@media \(hover:hover\) and \(pointer:fine\)\{\.ag-cur,\.ag-cur-lab\{display:block\}/, "the cursor only exists where a mouse can hover")
assert.match(css, /\.ag-cur,\.ag-cur-lab\{[^}]*display:none/, "and is hidden everywhere else")
assert.match(css, /\.ag-root img,\.ag-root svg\{max-width:none\}/, "guards Preflight's img/svg max-width")
assert.doesNotMatch(css, /(^|[{}])\s*(\*|body|html|:root)\s*[{,]/, "no bare resets")
let rules = 0
for (const m of css.matchAll(/(?<=^|[{}])\s*([^{}]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (sel.startsWith("@") || /^(from|to|\d)/.test(sel)) continue
  rules++
  assert.ok(sel.replace(/:where\([^)]*\)/g, ":where()").split(",").every((x) => /^\.ag-/.test(x.trim())), "unscoped selector: " + sel)
}
assert.ok(rules >= 150, "the scope check saw real rules, saw " + rules)

// layout reads: one per frame (the root's top); everything else on measure
const loopAt = src.indexOf("const frame = (now: number) =>")
const loop = src.slice(loopAt, src.indexOf("const schedule = ()", loopAt))
assert.ok(loop.length > 1000, "found the frame")
assert.equal((loop.match(/getBoundingClientRect/g) || []).length, 1, "the frame reads layout exactly once")
assert.doesNotMatch(loop, /offset(Top|Left|Width|Height)|client(Width|Height)|scroll(Height|Width)|getComputedStyle|innerHeight/, "and nothing else")
assert.equal((src.match(/getBoundingClientRect/g) || []).length, 1, "no other layout reads anywhere")

// the motion in CSS matches the measured constants in the story region
assert.match(css, /@keyframes ag-rise\{from\{transform:translate3d\(0,160px,0\)\}\}/, "intro lines rise 160px")
assert.match(css, /\.ag-ln>span\{display:inline-block;animation:ag-rise 1\.2s var\(--ag-out\) both \.1s\}/, "1.2s, 100ms in")
assert.match(css, /\.ag-ln\+\.ag-ln>span\{animation-delay:\.3s\}/, "second line 200ms behind the first")
assert.match(css, /\[data-rise\]:not\(\[data-in\]\)\{transform:translate3d\(0,100px,0\)\}/, "headings rise 100px, no fade")
assert.match(css, /\[data-rise\]\{transition:transform 1\.2s var\(--ag-out\)/, "over 1.2s")
assert.match(css, /\[data-fade\]\{transition:opacity \.5s ease-out\}/, "cards fade in .5s")
assert.match(css, /\.ag-row>\*\{position:relative;opacity:\.4;transition:opacity \.5s cubic-bezier\(\.65,0,\.35,1\)/, "rows rest at 40% and light in .5s, ease-in-out")
assert.match(css, /\.ag-ch\{opacity:clamp\(\.4,calc\(\.4 \+ \.6 \* \(var\(--q,1\) \* \(var\(--n,1\) \+ 2\) - var\(--i,0\) - 1\)\),1\)\}/, "letter reveal mirrors letterAlpha")
assert.match(css, /\.ag-card\{position:sticky;[^}]*height:calc\(var\(--ag-h\) - 18px\)/, "work cards are full-height sticky panels")
assert.doesNotMatch(css, /\.ag-card\{[^}]*transform/, "and never shrink")
assert.match(css, /@keyframes ag-marq\{from\{transform:translate3d\(-50%,0,0\)\}to\{transform:translate3d\(0,0,0\)\}\}/, "reviews drift rightward")
assert.match(css, /\.ag-cur::before\{[^}]*width:40px;height:40px;border-radius:50%;background:#fff/, "40px white cursor disc")
assert.match(css, /\.ag-cur\{z-index:90;width:0;height:0;mix-blend-mode:difference\}/, "in difference mode")
assert.match(css, /\.ag-nav\{position:absolute/, "the header scrolls away")
assert.match(css, /\.ag-fab\{position:fixed;[^}]*width:64px;height:64px/, "the 64px menu button stays")

// ---- the story -----------------------------------------------------------
const S = await liftRegion(src, "story")

// windowed: 0 below the start line, 1 past the end, monotone between
assert.equal(S.windowed(900, 1000, 0.8, 0.2), 0)
assert.equal(S.windowed(100, 1000, 0.8, 0.2), 1)
assert.ok(Math.abs(S.windowed(500, 1000, 0.8, 0.2) - 0.5) < 1e-9)
{
  let prev = 0
  for (let y = 1200; y >= -200; y -= 7) {
    const q = S.windowed(y, 1000, 0.8, 0.2)
    assert.ok(q >= prev - 1e-12, "rising elements only ever light up")
    prev = q
  }
}
assert.ok(!Number.isNaN(S.windowed(10, 0, 0.8, 0.2)), "no NaN with a zero-height viewport")

// constants measured from the reference
assert.deepEqual({ ...S.INTRO }, { rise: 160, ms: 1200, delay: 100, lag: 200 })
assert.deepEqual({ ...S.RISE }, { y: 100, ms: 1200, stagger: 150 })
assert.equal(S.ROW.dim, 0.4)
assert.equal(S.READ.dim, 0.4)

// letter reveal: all at 40% before, all lit after, a single soft letter at the edge, never backwards
{
  const n = 160
  for (let i = 0; i < n; i++) assert.equal(S.letterAlpha(0, n, i), 0.4)
  for (let i = 0; i < n; i++) assert.equal(S.letterAlpha(1, n, i), 1)
  for (let q = 0; q <= 1; q += 0.01) {
    const a = Array.from({ length: n }, (_, i) => S.letterAlpha(q, n, i))
    assert.equal(a.filter((x) => x > 0.4 && x < 1).length <= 1, true, "one transitional letter at q=" + q.toFixed(2))
    for (let i = 1; i < n; i++) assert.ok(a[i] <= a[i - 1] + 1e-12, "reads left to right")
  }
  assert.ok(S.READ.a > S.READ.b && S.READ.a < 1, "lights while the paragraph climbs the screen")
}

// capability rows: the nearest centre wins, ties go to the first
assert.equal(S.nearestRow([100, 300, 500, 700], 420), 2)
assert.equal(S.nearestRow([100, 300, 500, 700], -900), 0)
assert.equal(S.nearestRow([100, 300, 500, 700], 9000), 3)
assert.equal(S.nearestRow([100, 300], 200), 0)

// stacked cards: stick just below the top edge, a fixed gap apart (reference: 8px, 60px)
assert.deepEqual({ ...S.STACK }, { stick: 8, gap: 60 })

// marquee speed: ~80px/s whatever the track width
assert.equal(S.marqueeSeconds(2616), 33)
assert.equal(S.marqueeSeconds(10), 8, "never absurdly fast")

// prices: quarterly is 15% off to the nearest 50, both strings keep their length so the odometer rolls in place
for (const base of [9800, 16500]) {
  const q = S.priceFor(base, true)
  assert.equal(q % 50, 0)
  assert.ok(Math.abs(q - base * 0.85) <= 25)
  assert.equal(S.priceFor(base, false), base)
  assert.equal(S.groupDigits(q).length, S.groupDigits(base).length, "same digit count for " + base)
}
assert.equal(S.groupDigits(16500), "16,500")
assert.equal(S.groupDigits(9800), "9,800")
assert.equal(S.groupDigits(1234567), "1,234,567")

// easter egg: three taps to gold, three more back to silver
assert.deepEqual([0, 1, 2, 3, 4, 5, 6, 7].map(S.isOr), [false, false, false, true, true, true, false, false])

assert.deepEqual(S.splitWords("  a  b\nc "), ["a", "b", "c"])

console.log(slug + ": ok")
