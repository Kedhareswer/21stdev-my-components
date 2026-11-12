// Runnable check for components/sector-tide-matrix: the seeded series, the colour
// bins, the stacking, keyboard movement and the install-safety rules.
// Run: node tests/sector-tide-matrix.test.mjs
//
// What breaks silently here is ordering: a riser stacked with its biggest gain
// next to the baseline, a −1% month coloured as the second bin, or ← and →
// jumping to a different sector instead of following the one you're on.
import assert from "node:assert/strict"
import { readFileSync, readdirSync, statSync } from "node:fs"
import { liftRegion } from "./_component-safety.mjs"

const slug = "sector-tide-matrix"
const dir = new URL("../components/" + slug + "/", import.meta.url)
const file = new URL(slug + ".tsx", dir)
const src = readFileSync(file, "utf8").replace(/\r\n/g, "\n")
const demo = readFileSync(new URL("demo.tsx", dir), "utf8")

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
assert.doesNotMatch(src, /\bfetch\(|XMLHttpRequest|new WebSocket/, "no network at runtime")
assert.match(src, /prefers-reduced-motion: reduce/, "reduced motion is read at runtime")
assert.match(src, /\(hover: hover\) and \(pointer: fine\)/, "fine-pointer gate is read at runtime")
assert.match(src, /e\.pointerType !== "mouse"/, "touch never drives the cursor")
assert.doesNotMatch(src, /data-magnet|magnet/i, "no magnetic pull: chart controls stay put")

// only the host's semantic tokens, plus the component's own
const TOKENS = new Set(["--color-background", "--color-foreground", "--color-muted-foreground", "--color-border", "--color-primary"])
for (const [, v] of src.matchAll(/var\((--[a-z0-9-]+)/g)) assert.ok(TOKENS.has(v) || /^--(stm-|[cdkot]$)/.test(v), "token not guaranteed in a host: " + v)

const cssAt = src.indexOf("const CSS =")
const css = src.slice(cssAt, src.indexOf("\n\n", cssAt)).replace(/"\s*\+\s*\n\s*"/g, "")
assert.doesNotMatch(css, /`|\$\{|@import/, "no backticks, ${ or @import in the CSS string")
assert.match(css, /@media \(prefers-reduced-motion:reduce\)\{[^}]*\.stm-build \.stm-dot[^}]*animation:none/, "CSS drops the build-in under reduced motion")
assert.match(css, /@media \(hover:hover\) and \(pointer:fine\)\{\.stm-cursor\{display:block\}/, "the cursor only exists where a mouse can hover")
assert.match(css, /\.stm-cursor\{display:none/, "and is hidden everywhere else")
assert.match(css, /\.stm-svg\{[^}]*max-width:none/, "the svg overrides Preflight's max-width")
let rules = 0
for (const m of css.replace(/^const CSS =\s*"/, "").matchAll(/(?<=^|[{}"])\s*([^{}"]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (sel.startsWith("@") || /^(from|to|\d)/.test(sel)) continue
  rules++
  assert.ok(sel.split(",").every((x) => x.trim().startsWith(".stm-")), "unscoped selector: " + sel)
}
assert.ok(rules >= 60, "the scope check saw real rules, saw " + rules)

// layout is read once, when the pointer enters the stage, and never while hovering the chart
assert.equal((src.match(/getBoundingClientRect/g) || []).length, 1, "only the stage measures, on pointer enter")
assert.doesNotMatch(src, /offset(Top|Left|Width|Height)|client(Width|Height)|scrollHeight|getComputedStyle|inner(Width|Height)/, "no other layout reads")
// hovering never re-renders the dots: they are memoised on data, pin, filter and build only
assert.match(src, /const dots = useMemo\([\s\S]*?\}, \[grid, pinned, filterKey, colors, g\.y0\]\)/, "dot layer is memoised without hover state")

// ---- data -----------------------------------------------------------------
const D = await liftRegion(src, "data")
const L = await liftRegion(src, "layout")

const series = D.generateSeries()
assert.equal(series.length, 110, "110 months")
assert.ok(series.every((r) => r.length === 20), "20 sectors a month")
assert.equal(D.DEFAULT_SECTORS.length, 20)
assert.equal(new Set(D.DEFAULT_SECTORS).size, 20, "sector names are unique")
assert.deepEqual(D.generateSeries(), series, "seeded: same series every render")
assert.notDeepEqual(D.generateSeries(110, 7), series, "a different seed, a different series")
assert.ok(series.flat().every((v) => Number.isFinite(v) && Math.round(v * 100) / 100 === v), "values are finite and rounded to 0.01")

const stacks = series.map((r) => L.stackMonth(r))
const mean = (a, b, k) => stacks.slice(a, b).reduce((s, x) => s + x[k].length, 0) / (b - a)
// months since Jan 2006: before the downturn, the trough (late 2008 – mid 2009), well into recovery
assert.ok(mean(0, 20, "up") > 13, "most sectors hire before the downturn")
assert.ok(mean(33, 42, "down") > 14, "most sectors shed jobs at the trough")
assert.ok(mean(66, 110, "up") > 13, "and hire again in the recovery")
const deep = series.slice(30, 45).flat().filter((v) => v <= -1).length
assert.ok(deep > 15, "the trough has real red in it: " + deep)
const flats = stacks.map((s) => s.flat.length)
assert.ok(flats.some((n) => n > 0) && Math.max(...flats) <= 3, "a few unchanged sectors, never more than the flat row holds")
const sum = L.summarize(stacks, L.parseMonth("2006-01"))
assert.ok(sum.worst.m >= 30 && sum.worst.m <= 45, "the worst month lands in the downturn: " + sum.worst.label)

// ---- scales ----------------------------------------------------------------
const T = L.DEFAULT_THRESHOLDS
assert.equal(L.binOf(-1.4, T), 0)
assert.equal(L.binOf(-1, T), 0, "−1% and below is the first bin")
assert.equal(L.binOf(-0.99, T), 1)
assert.equal(L.binOf(-0.01, T), 4, "a hair below zero is the near-zero loss bin")
assert.equal(L.binOf(0.01, T), 5, "a hair above zero is the near-zero gain bin")
assert.equal(L.binOf(0.74, T), 7)
assert.equal(L.binOf(0.75, T), 8, "+0.75% and above is the last bin")
assert.equal(L.binOf(3, T), T.length)

{
  const st = L.stackMonth([0.3, -0.2, 0, 0.9, -1.2, 0.1, null, -0.2])
  assert.deepEqual(st.up, [5, 0, 3], "risers: the biggest gain sits furthest from the baseline")
  assert.deepEqual(st.down, [1, 7, 4], "fallers: the steepest loss sinks furthest, ties keep sector order")
  assert.deepEqual(st.flat, [2], "unchanged sectors go to the flat row")
  assert.deepEqual(L.columnOrder(st), [3, 0, 5, 1, 7, 4, 2], "top to bottom as drawn")
  assert.equal(L.rankText(st, 3), "Strongest gain of 3 rising")
  assert.equal(L.rankText(st, 0), "2nd of 3 rising")
  assert.equal(L.rankText(st, 4), "Steepest loss of 3 falling")
  assert.equal(L.rankText(st, 2), "No change this month")
}

{
  const g = L.geometry(110, 20)
  assert.equal(g.yMax, 20, "20 sectors → an axis of ±20")
  assert.equal(L.geometry(110, 23).yMax, 25, "rounded up to the next 5")
  const r1 = L.dotAt(g, 0, 1, 1)
  const f1 = L.dotAt(g, 0, -1, 1)
  assert.ok(r1.y + L.DOT < g.y0 && f1.y > g.y0, "the first riser and faller sit either side of the baseline")
  assert.ok(L.dotAt(g, 0, 1, 20).y >= g.top, "a full column of risers fits under the year axis")
  assert.ok(L.dotAt(g, 0, -1, 20).y + L.DOT <= g.plotBottom, "a full column of fallers fits above the flat row")
  assert.ok(L.dotAt(g, 0, 0, 3).y >= g.plotBottom, "the flat row sits below the plot")
  assert.ok(L.dotAt(g, 109, 1, 1).x + L.DOT <= g.W - g.right, "the last month fits")
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

// ---- the Easter egg's imagined months -----------------------------------------
for (const v of [-1.8, -0.3, 0, 0.4]) {
  const w = L.imagined(v, 40, 3)
  assert.ok(w > 0, "every imagined value is a gain")
  assert.equal(w, L.imagined(v, 40, 3), "deterministic")
}

console.log(slug + ": ok")
