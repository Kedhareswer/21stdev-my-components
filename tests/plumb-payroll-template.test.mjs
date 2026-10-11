// Install-safety and logic checks for components/plumb-payroll-template.
// Run: node tests/plumb-payroll-template.test.mjs
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const SLUG = "plumb-payroll-template"
const read = (file) => readFileSync(new URL(`../components/${SLUG}/${file}`, import.meta.url), "utf8").replace(/\r\n/g, "\n")
const src = read(`${SLUG}.tsx`)
const region = (name) => {
  const a = src.indexOf(`// #region ${name}\n`)
  const b = src.indexOf(`// #endregion ${name}\n`)
  assert.ok(a > -1 && b > a, `region ${name} missing`)
  return src.slice(a, b)
}

/* ---------- nothing travels with it ---------- */

const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "react is the only import")
assert.doesNotMatch(src, /@import|@font-face|<link\b|fetch\(|new Image\(|<img\b/, "nothing loads at runtime")
assert.doesNotMatch(src, /https?:\/\//, "no URLs at all, so it renders in the capture sandbox")
assert.ok(src.includes('height = "100svh"'), "height defaults to a definite length")
assert.match(src, /"--plb-h": height/, "the height prop reaches the root")
assert.match(src, /\.plb-root\{[^}]*min-height:var\(--plb-h\)/, "and sets its floor")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")
for (const m of src.matchAll(/([^{}]+)\{[^}]*\bheight:100%/g))
  assert.match(m[1].trim(), /(\.plb-(progress|bar-track|sync-svg|hatch \.plb-frame) span|\.plb-bar-track span|\.plb-sync-svg|\.plb-hatch \.plb-frame|\.plb-(story-art|calc-out|cta) \.plb-art|\.plb-progress span)$/, `percentage height on ${m[1].trim()}`)
assert.match(src, /\.plb-panel\{height:clamp\(480px,50vw,660px\)/, "the tour panel has a definite height")
assert.match(src, /React\.useId\(\)\.replace/, "svg ids are namespaced per instance")
assert.doesNotMatch(src, /url\(#[a-z]/, "pattern and gradient references are built from the instance id")
assert.doesNotMatch(src.slice(0, src.indexOf("</")), /use(State|Ref|Memo|Callback)<|Partial<|Record<|React\.[A-Za-z]+</, "no generics before the JSX (21st CLI tokenizer)")
assert.doesNotMatch(src, /use(State|Ref|Memo|Callback)</, "hooks are typed without <generics>")
assert.match(src, /matchMedia\("\(prefers-reduced-motion: reduce\)"\)/, "reduced motion is read in JS (autoplay, count-ups, drift, scrolling)")

const css = src.match(/const PLB_CSS = `([\s\S]*?)`/)
assert.ok(css, "CSS block present")
assert.doesNotMatch(css[1], /\$\{|`/, "no interpolation inside the CSS string")
assert.doesNotMatch(css[1], /url\(/, "no url() in the style block")
assert.ok(css[1].includes("prefers-reduced-motion:reduce"), "honours reduced motion in CSS")
for (const m of css[1].replace(/\/\*[\s\S]*?\*\//g, "").replace(/@media[^{]*\{/g, "").replace(/@keyframes[^{]*\{/g, "").matchAll(/(?<=^|[{}])\s*([^{}@]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (/^(from|to|[\d.,%\s]+)$/.test(sel)) continue
  for (const s of sel.split(/,(?![^(]*\))/)) assert.match(s.trim(), /^\.plb-/, `selector escapes the component: ${s.trim()}`)
}
assert.match(css[1], /\.plb-svg\{display:block;max-width:none/, "svgs are guarded against Preflight")
assert.match(css[1], /\.plb-art\{[^}]*max-width:none/, "so is the panel art")
assert.match(css[1], /\.plb-root :where\(button\)\{/, "the reset has no specificity to fight")
assert.match(css[1], /\.plb-root\{[^}]*overflow-x:clip/, "the root clips the guides sideways without breaking the sticky nav")
assert.doesNotMatch(css[1], /\.plb-root\{[^}]*overflow:hidden/, "overflow:hidden on the root would break the sticky nav")
assert.match(css[1], /\.plb-nav\{position:sticky/, "the nav sticks")
assert.match(css[1], /\.plb-frame\{[^}]*display:flow-root/, "section margins can't collapse through the rails")

/* ---------- it behaves like a product page ---------- */

for (const k of ["showcase", "customers", "platform", "stories", "calculator", "faq", "demo"]) assert.ok(src.includes(`data-sec="${k}"`) || src.includes(`data-sec="` + k), `section ${k} is addressable`)
assert.match(src, /scrollIntoView\(\{ behavior: reduced \? "auto" : "smooth", block: "start" \}\)/, "in-page links scroll, instantly under reduced motion")
assert.match(src, /emailRef\.current\?\.focus/, "Book a demo lands in the email field")
assert.match(src, /role="tablist"/, "the tour is a tablist")
assert.match(src, /nextIndex\(i, e\.key, tabs\.length\)/, "arrow keys move through it")
assert.match(src, /const running = auto && !reduced && autoplay !== false && tourSeen && !hold/, "autoplay stops on interaction, hover, focus, off screen and reduced motion")
assert.match(src, /onAnimationEnd=\{\(\) => setTab/, "the progress bar drives the tour")
assert.match(src, /if \(open\.length\) \{\n\s+setState\("blocked"\)/, "approving with open alerts is refused")
assert.match(src, /if \(res === false\) ok = false/, "onApprove and onBookDemo can refuse")
assert.match(src, /isEmail\(email\)/, "the demo form validates before sending")
assert.match(src, /alive\.current = true\n/, "the unmount guard survives strict mode's double mount")
assert.match(src, /aria-expanded=\{open\}/, "questions are disclosures")
assert.match(src, /role="progressbar"/, "filing progress is announced")
assert.ok(read("demo.tsx").includes("<PlumbPayrollTemplate />"), "default demo is the component, full bleed")
assert.doesNotMatch(read("demo.tsx"), /<div/, "default demo has no wrapper")
assert.match(read("demo-custom.tsx"), /palette="harbor"/, "the custom demo reprints the page")
assert.doesNotMatch(read("demo-custom.tsx"), /="[^"]*\\n/, "no \\n inside a JSX string attribute (it would print literally)")
assert.doesNotMatch(read("demo-custom.tsx"), /https?:\/\//, "the custom demo stays capture-safe too")

/* ---------- logic, executed ---------- */

const code = region("content") + region("logic") +
  "\nexport { PALETTES, DEFAULT_PAYRUN, DEFAULT_COSTS, DEFAULT_RATES, PANEL_LAYOUTS, clamp, easeOutCubic, formatMoney, formatStat, applyDeltas, figureValue, rateRow, fringeSplit, costOf, burdenRate, roiEstimate, percentages, clockText, isEmail, nextIndex, lineA, lineB, bandPath, speckleTile, resolvePalette }\n"
const L = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(code)))

assert.equal(L.formatMoney(228680.46), "$228,680.46")
assert.equal(L.formatMoney(0), "$0.00")
assert.equal(L.formatMoney(-1027.2), "-$1,027.20")
assert.equal(L.formatMoney(1234567.891, 0), "$1,234,568")
assert.equal(L.formatStat({ value: 4.2, prefix: "$", suffix: "B", decimals: 1, label: "" }, 4.2), "$4.2B")
assert.equal(L.formatStat({ value: 1200, label: "" }, 1200), "1,200")
assert.equal(L.easeOutCubic(0), 0)
assert.equal(L.easeOutCubic(1), 1)
assert.equal(L.easeOutCubic(2), 1, "clamped")

// resolving alerts moves exactly the figures they name, to the cent
const R = L.DEFAULT_PAYRUN
assert.deepEqual(L.applyDeltas(R.stats, R.alerts, []), R.stats, "nothing resolved, nothing moves")
const both = L.applyDeltas(R.stats, R.alerts, ["benefits", "duplicates"])
assert.equal(L.figureValue(both, "Gross pay"), 227396.46)
assert.equal(L.figureValue(both, "Net pay"), 182273.58)
assert.equal(both.find((f) => f.label === "Debit date").value, "Apr 8", "text figures pass through")
assert.equal(L.figureValue(L.applyDeltas(R.right, R.alerts, ["duplicates"]), "Company taxes"), 14722.54)
assert.equal(L.figureValue([], "Nope"), 0)

assert.deepEqual(L.rateRow(68.5, 41.27), { base: 68.5, fringe: 41.27, ot: 144.02, total: 109.77 })
for (const f of [41.27, 0.01, 0, 39.02, 13.4]) {
  const parts = L.fringeSplit(f)
  assert.equal(parts.length, 4)
  assert.equal(Math.round(parts.reduce((a, p) => a + p.value, 0) * 100), Math.round(f * 100), `fringe ${f} splits back to itself`)
  assert.ok(parts.every((p) => p.value >= 0))
}
for (const j of L.DEFAULT_RATES.jobs) assert.equal(j.rates.length, L.DEFAULT_RATES.classes.length, `${j.name} has a rate per classification`)

const job = L.DEFAULT_COSTS[0]
const raw = L.costOf(job, false, 1)
assert.equal(raw.total, job.wages, "unburdened is wages only")
const full = L.costOf(job, true, 1)
assert.equal(full.total, job.wages + job.taxes + job.fringe + job.comp)
assert.equal(full.over, full.total > job.budget)
assert.equal(L.costOf(job, true, 2).total, full.total * 2, "periods scale")
assert.ok(Math.abs(L.burdenRate([{ wages: 100, taxes: 10, fringe: 20, comp: 5 }]) - 0.35) < 1e-12)
assert.equal(L.burdenRate([]), 0)

const roi = L.roiEstimate({ crew: 180, hours: 16, states: 4, rate: 48 })
assert.deepEqual(roi, { hours: 738, dollars: 48060, filings: 48 })
assert.ok(L.roiEstimate({ crew: 900, hours: 16, states: 4, rate: 48 }).dollars > roi.dollars, "more crew, more savings")
assert.ok(L.roiEstimate({ crew: 180, hours: 30, states: 4, rate: 48 }).hours > roi.hours, "more hours, more back")
assert.ok(L.roiEstimate({ crew: -5, hours: -1, states: 0, rate: -3 }).dollars >= 0, "never negative")

for (const v of [[22, 14, 6], [1, 1, 1], [30, 10, 4], [5], [0, 3]]) assert.equal(L.percentages(v).reduce((a, b) => a + b, 0), 100, `${v} sums to 100`)
assert.deepEqual(L.percentages([1, 1, 1]), [34, 33, 33])
assert.deepEqual(L.percentages([0, 0]), [0, 0])

assert.equal(L.clockText(0), "00:00:00")
assert.equal(L.clockText(3725.9), "01:02:05")
assert.equal(L.clockText(-4), "00:00:00")

assert.ok(L.isEmail("ana@builder.co"))
assert.ok(!L.isEmail("ana@builder"))
assert.ok(!L.isEmail("ana builder.co"))

assert.equal(L.nextIndex(3, "ArrowRight", 4), 0, "wraps forward")
assert.equal(L.nextIndex(0, "ArrowLeft", 4), 3, "wraps back")
assert.equal(L.nextIndex(2, "Home", 4), 0)
assert.equal(L.nextIndex(1, "End", 4), 3)
assert.equal(L.nextIndex(1, "x", 4), 1)

assert.match(L.lineA(262), /^M-60 [\d.-]+L1376 [\d.-]+$/)
assert.match(L.lineB(-668), /^M-60 [\d.-]+L1376 [\d.-]+$/)
assert.match(L.bandPath(838, 1074), /Z$/)
assert.equal(L.speckleTile(7), L.speckleTile(7), "speckles are deterministic, so server and client agree")
assert.notEqual(L.speckleTile(7), L.speckleTile(8))
assert.equal(L.speckleTile(7).split("M").length - 1, 34)
assert.ok(L.PANEL_LAYOUTS.length >= 4)

assert.equal(L.resolvePalette("harbor").accent, L.PALETTES.harbor.accent)
assert.equal(L.resolvePalette({ accent: "#ff0000" }).accent, "#ff0000", "a partial palette overrides")
assert.equal(L.resolvePalette({ accent: "#ff0000" }).ink, L.PALETTES.forest.ink, "and falls back to forest")
assert.equal(L.resolvePalette(undefined).page, L.PALETTES.forest.page)
for (const [name, p] of Object.entries(L.PALETTES)) {
  assert.ok(p.panels.length >= 4, `${name} has a panel per tab`)
  for (const [k, v] of Object.entries(p)) if (typeof v === "string") assert.match(v, /^#[0-9a-f]{6}$/i, `${name}.${k} is a hex colour`)
  for (const pair of p.panels) for (const c of pair) assert.match(c, /^#[0-9a-f]{6}$/i)
}

console.log("plumb-payroll-template: ok")
