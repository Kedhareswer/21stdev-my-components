// Runnable check for components/sector-tide-matrix: the colour bins, the
// stacking, the geometry, keyboard movement, the demo's seeded series and the
// install-safety rules.
// Run: node tests/sector-tide-matrix.test.mjs
//
// What breaks silently here is ordering: a riser stacked with its biggest gain
// next to the baseline, a boundary value coloured as the neighbouring bin, or ←
// and → jumping to a different sector instead of following the one you're on.
// And separation: the component is the reusable chart, the demo owns the content.
import assert from "node:assert/strict"
import { readFileSync, readdirSync, statSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"
import { liftRegion } from "./_component-safety.mjs"

const slug = "sector-tide-matrix"
const dir = new URL("../components/" + slug + "/", import.meta.url)
const file = new URL(slug + ".tsx", dir)
const src = readFileSync(file, "utf8").replace(/\r\n/g, "\n")
const demo = readFileSync(new URL("demo.tsx", dir), "utf8").replace(/\r\n/g, "\n")

// ---- install safety -------------------------------------------------------
const imports = [...src.matchAll(/^import[\s\S]*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "react is the only import")
assert.deepEqual(readdirSync(dir).sort(), ["README.md", "demo.tsx", slug + ".tsx"].sort(), "folder holds only the publishable files")
assert.ok(statSync(file).size < 120_000, "stays well under 21st's file limit: " + statSync(file).size)
const ts = readFileSync(new URL("../tsconfig.json", import.meta.url), "utf8")
assert.ok(ts.includes('"@/components/ui/' + slug + '": ["./components/' + slug + "/" + slug + '.tsx"]'), "tsconfig paths line")
assert.match(demo, /from "@\/components\/ui\/sector-tide-matrix"/, "the demo imports the installed path")
assert.match(src, /height = "100svh"/, "height defaults to a definite length")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")
assert.doesNotMatch(src + demo, /use(Ref|State|Memo|Callback|Reducer|Context)</, "no generic hook type arguments (they hang the 21st CLI)")
const urls = [...(src + demo).matchAll(/https?:\/\/[^"'\s)]+/g)].map((m) => m[0]).filter((u) => !u.startsWith("http://www.w3.org/"))
assert.deepEqual(urls, [], "fetches nothing: the series is generated in code")
assert.doesNotMatch(src + demo, /\bfetch\(|XMLHttpRequest|new WebSocket/, "no network at runtime")
assert.match(src, /prefers-reduced-motion: reduce/, "reduced motion is read at runtime")
assert.ok(Buffer.byteLength(demo) < 200_000, "demo under 21st's 200 kB limit")

// only the host's semantic tokens, plus the component's own
const TOKENS = new Set(["--color-background", "--color-foreground", "--color-muted-foreground", "--color-border", "--color-primary"])
for (const [, v] of src.matchAll(/var\((--[a-z0-9-]+)/g)) assert.ok(TOKENS.has(v) || /^--(stm-[a-z]+|[cdko])$/.test(v), "token not guaranteed in a host: " + v)

const cssAt = src.indexOf("const CSS =")
const css = src.slice(cssAt, src.indexOf("\n\n", cssAt)).replace(/"\s*\+\s*\n\s*"/g, "")
assert.doesNotMatch(css, /`|\$\{|@import/, "no backticks, ${ or @import in the CSS string")
assert.match(css, /@media \(prefers-reduced-motion:reduce\)\{[^}]*\.stm-build \.stm-dot[^}]*animation:none/, "CSS drops the build-in under reduced motion")
assert.match(css, /\.stm-svg\{[^}]*max-width:none/, "the svg overrides Preflight's max-width")
let rules = 0
for (const m of css.replace(/^const CSS =\s*"/, "").matchAll(/(?<=^|[{}"])\s*([^{}"]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (sel.startsWith("@") || /^(from|to|\d)/.test(sel)) continue
  rules++
  assert.ok(sel.split(",").every((x) => x.trim().startsWith(".stm-")), "unscoped selector: " + sel)
}
assert.ok(rules >= 90, "the scope check saw real rules, saw " + rules)

// ---- the pointer is the host's own -----------------------------------------
// A chart that hides the system cursor reads as broken inside someone else's page.
assert.doesNotMatch(css, /cursor:none/, "the system cursor is never hidden")
assert.doesNotMatch(src, /stm-cursor|data-cursor/, "no follow-the-pointer cursor label")
assert.doesNotMatch(src, /data-magnet|magnet/i, "no magnetic pull: chart controls stay put")
assert.match(css, /\.stm-dot\{cursor:pointer/, "dots say they are clickable the ordinary way")

// ---- the component is the chart; the demo owns the content ------------------
// 21st's guideline: reusable logic in the component, content passed through props.
assert.doesNotMatch(src, /payroll|hiring|recession"|Construction|Durable goods|mulberry32|generateSeries/i, "no sample copy, sector names or sample series baked into the component")
for (const prop of ["eyebrow", "title", "description", "legendLabel", "footnote"]) {
  assert.doesNotMatch(src, new RegExp("\\n  " + prop + " = "), prop + " has no hardcoded default")
  assert.match(demo, new RegExp("\\n      " + prop + "="), "the demo passes " + prop)
}
for (const prop of ["sectors", "data", "start", "bands"]) assert.match(demo, new RegExp("\\n      " + prop + "="), "the demo passes " + prop)
assert.match(src, /defaultPinned = null/, "nothing is followed unless the host asks")
assert.match(src, /bands = NO_BANDS/, "no band unless the host passes one")
assert.match(src, /if \(empty\) \{/, "an empty series renders an empty state, not a crash")
assert.match(src, /b\.imagine \? \(/, "a band's what-if is opt-in per band")

// ---- text stays legible at any size ----------------------------------------
// Axis and year labels are HTML at fixed pixels over a scaled SVG, so the SVG holds no text at all.
assert.doesNotMatch(src, /<text\b/, "no text inside the scaled SVG")
assert.match(src, /preserveAspectRatio="none"/, "the dot layer may flatten to fill a short stage")
assert.match(css, /\.stm-y\{position:sticky;left:0/, "the count axis stays put while a narrow chart scrolls")
assert.match(css, /@container stm \(max-width:640px\)/, "narrow layout follows the component's own width, not the viewport's")
assert.match(css, /\.stm-sw\{[^}]*height:28px/, "legend swatches are at least 24px targets")

// hovering reads no layout: every dot carries its month and sector. The only reads are one
// tooltip clamp per change and the scroll-edge fade.
assert.equal((src.match(/getBoundingClientRect/g) || []).length, 2, "two rects, both in the tooltip clamp")
const move = src.slice(src.indexOf("const onPlotMove"), src.indexOf("const onPlotLeave"))
assert.doesNotMatch(move, /getBoundingClientRect|offset(Top|Left|Width|Height)|client(Width|Height)|scroll(Width|Height|Left)|getComputedStyle/, "pointer move reads no layout")
// hovering never re-renders the dots: they are memoised on data, pin and filter only
assert.match(src, /const dots = useMemo\([\s\S]*?\}, \[grid, pinned, filterKey, colors, g\.y0\]\)/, "dot layer is memoised without hover state")

// ---- the demo's placeholder series ------------------------------------------
const lift = async (text, name, exports) => {
  const a = text.indexOf("// #region " + name)
  const b = text.indexOf("// #endregion", a)
  assert.ok(a > -1 && b > a, "region " + name + " markers missing")
  return import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(text.slice(a, b)) + "\nexport { " + exports + " }"))
}
const D = await lift(demo, "data", "generateSeries, SECTORS, SERIES")
const L = await liftRegion(src, "layout")

const series = D.SERIES
assert.equal(series.length, 110, "110 months")
assert.ok(series.every((r) => r.length === 20), "20 sectors a month")
assert.equal(D.SECTORS.length, 20)
assert.equal(new Set(D.SECTORS).size, 20, "sector names are unique")
assert.deepEqual(D.generateSeries(), series, "seeded: same series every render")
assert.notDeepEqual(D.generateSeries(110, 7), series, "a different seed, a different series")
assert.ok(series.flat().every((v) => Number.isFinite(v) && Math.round(v * 100) / 100 === v), "values are finite and rounded to 0.01")

const stacks = series.map((r) => L.stackMonth(r))
const mean = (a, b, k) => stacks.slice(a, b).reduce((s, x) => s + x[k].length, 0) / (b - a)
// months since Jan 2006: before the downturn, the trough (late 2008 – mid 2009), well into recovery
assert.ok(mean(0, 20, "up") > 13, "most sectors hire before the downturn")
assert.ok(mean(33, 42, "down") > 14, "most sectors shed jobs at the trough")
assert.ok(mean(66, 110, "up") > 13, "and hire again in the recovery")
const deep = series.slice(30, 45).flat().filter((v) => v <= -0.8).length
assert.ok(deep > 25, "the trough has real red in it: " + deep)
const sum = L.summarize(stacks, L.parseMonth("2006-01"))
assert.ok(sum.worst.m >= 30 && sum.worst.m <= 45, "the worst month lands in the downturn: " + sum.worst.label)
assert.equal(L.summarize([], 0), null, "no months, no summary (and no crash)")

// ---- scales ----------------------------------------------------------------
const T = L.DEFAULT_THRESHOLDS
assert.deepEqual(T, T.map((t) => -t).reverse().map((t) => t + 0), "the default scale is symmetric about zero")
assert.equal(L.binOf(-1.4, T), 0)
assert.equal(L.binOf(-0.8, T), 0, "−0.8% and below is the first bin")
assert.equal(L.binOf(-0.79, T), 1)
assert.equal(L.binOf(-0.01, T), 4, "a hair below zero is the near-zero loss bin")
assert.equal(L.binOf(0.01, T), 5, "a hair above zero is the near-zero gain bin")
assert.equal(L.binOf(0.79, T), 8)
assert.equal(L.binOf(0.8, T), 9, "+0.8% and above is the last bin")
assert.equal(L.binOf(3, T), T.length)
assert.equal(T.length + 1, 10, "ten bins: five losses, five gains")
// the default colours: one hue per arm, each step mixed further into the host background
const steps = /const STEPS = \[([\d, ]+)\]/.exec(src)[1].split(",").map(Number)
assert.equal(steps.length * 2, T.length + 1, "one colour per bin")
assert.ok(steps.every((p, i) => i === 0 || p < steps[i - 1]), "each arm fades steadily toward zero: " + steps)
assert.ok(steps[steps.length - 1] >= 30, "the palest step still reads against the background")
assert.deepEqual(L.defaultTicks(T), [-0.8, -0.4, 0, 0.4, 0.8], "every other boundary is labelled")
assert.deepEqual(L.defaultTicks([-1, 0, 1]), [-1, 0, 1], "a short scale labels them all")
assert.deepEqual([-0.8, 0, 0.4].map(L.tickLabel), ["−0.8%", "0%", "+0.4%"])

{
  const st = L.stackMonth([0.3, -0.2, 0, 0.9, -1.2, 0.1, null, -0.2, NaN, undefined])
  assert.deepEqual(st.up, [5, 0, 3], "risers: the biggest gain sits furthest from the baseline")
  assert.deepEqual(st.down, [1, 7, 4], "fallers: the steepest loss sinks furthest, ties keep sector order")
  assert.deepEqual(st.flat, [2], "unchanged sectors go to the flat row; missing values go nowhere")
  assert.deepEqual(L.columnOrder(st), [3, 0, 5, 1, 7, 4, 2], "top to bottom as drawn")
  assert.equal(L.rankText(st, 3), "Strongest gain of 3 rising")
  assert.equal(L.rankText(st, 0), "2nd of 3 rising")
  assert.equal(L.rankText(st, 4), "Steepest loss of 3 falling")
  assert.equal(L.rankText(st, 2), "No change this month")
}

// ---- geometry: sized from the data, never clipping a stack -------------------
{
  const e = L.extent(stacks)
  assert.ok(e.up <= 20 && e.down <= 20 && e.flat >= 1, "extent of the demo series: " + JSON.stringify(e))
  const g = L.geometry(110, e.up, e.down, e.flat)
  assert.equal(g.up, 20, "rounded up to the next 5")
  assert.equal(L.geometry(110, 23).up, 25)
  assert.equal(L.geometry(12, 3, 2).up, 5, "a small series gets a short axis, not twenty empty rows")
  assert.equal(L.geometry(12, 3, 2).down, 5)
  assert.equal(g.flatRows, e.flat, "the flat row grows with the data")
  const r1 = L.dotAt(g, 0, 1, 1)
  const f1 = L.dotAt(g, 0, -1, 1)
  assert.ok(r1.y + L.DOT < g.y0 && f1.y > g.y0, "the first riser and faller sit either side of the baseline")
  assert.ok(L.dotAt(g, 0, 1, g.up).y >= g.top, "a full column of risers fits")
  assert.ok(L.dotAt(g, 0, -1, g.down).y + L.DOT <= g.plotBottom, "a full column of fallers fits above the flat row")
  assert.ok(L.dotAt(g, 0, 0, 1).y >= g.plotBottom, "the flat row sits below the plot")
  assert.ok(L.dotAt(g, 0, 0, g.flatRows).y + L.DOT <= g.H, "every flat dot fits inside the chart")
  assert.ok(L.dotAt(g, 109, 1, 1).x + L.DOT <= g.W - g.right, "the last month fits")
  const tall = L.geometry(10, 5, 5, 6)
  assert.ok(L.dotAt(tall, 0, 0, 6).y + L.DOT <= tall.H, "six unchanged sectors in a month still fit")
}

// ---- input is squared off, not trusted --------------------------------------
{
  const n = L.normalize([[1, -1], [0.5], [null, "x", 3]], ["A"])
  assert.deepEqual(n.sectors, ["A", "Series 2", "Series 3"], "unnamed columns get a name")
  assert.deepEqual(n.rows, [[1, -1, null], [0.5, null, null], [null, null, 3]], "ragged rows and non-numbers become null")
  assert.deepEqual(L.normalize([], []).rows, [], "no data is fine")
  assert.deepEqual(L.sectorStats(n.rows, 0), { up: 2, down: 0, flat: 0 })
  assert.deepEqual(L.sectorStats([[0], [-1], [null]], 0), { up: 0, down: 1, flat: 1 })
}

assert.equal(L.parseMonth("2006-01") % 12, 0)
assert.equal(L.monthName(L.parseMonth("2013-03")), "March 2013")
assert.equal(L.monthName(L.parseMonth("2009-12"), true), "Dec 2009")
assert.equal(L.fmtPct(0.16), "+0.16%")
assert.equal(L.fmtPct(-0.4), "−0.40%", "a real minus sign")
assert.equal(L.fmtPct(0), "0.00%")
assert.deepEqual([1, 2, 3, 4, 11, 12, 13, 21, 22, 112].map(L.ordinal), ["1st", "2nd", "3rd", "4th", "11th", "12th", "13th", "21st", "22nd", "112th"])

// ---- keyboard ------------------------------------------------------------------
{
  const s0 = 5
  let at = { m: 50, s: s0 }
  for (let i = 0; i < 20; i++) {
    at = L.step(stacks, at.m, at.s, "ArrowRight")
    assert.equal(at.s, s0, "→ keeps following the same sector")
  }
  assert.equal(at.m, 70)
  assert.deepEqual(L.step(stacks, 3, s0, "ArrowLeft", true), { m: 0, s: s0 }, "shift+← jumps a year and clamps")
  assert.deepEqual(L.step(stacks, 105, s0, "ArrowRight", true), { m: 109, s: s0 }, "and clamps at the end")
  assert.deepEqual(L.step(stacks, 40, s0, "Home"), { m: 0, s: s0 })
  assert.deepEqual(L.step(stacks, 40, s0, "End"), { m: 109, s: s0 })
  const order = L.columnOrder(stacks[60])
  let cur = { m: 60, s: order[0] }
  for (let i = 1; i < order.length; i++) {
    cur = L.step(stacks, cur.m, cur.s, "ArrowDown")
    assert.equal(cur.s, order[i], "↓ walks the column top to bottom")
  }
  assert.equal(L.step(stacks, 60, cur.s, "ArrowDown").s, cur.s, "and stops at the bottom")
  assert.equal(L.step(stacks, 60, order[0], "ArrowUp").s, order[0], "and at the top")
}

// ---- a band's imagined months ----------------------------------------------------
for (const v of [-1.8, -0.3, 0, 0.4]) {
  const w = L.imagined(v, 40, 3)
  assert.ok(w > 0, "every imagined value is a gain")
  assert.equal(w, L.imagined(v, 40, 3), "deterministic")
}

console.log(slug + ": ok")
