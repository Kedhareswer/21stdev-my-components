// Install-safety and logic checks for components/teal-treasury-landing.
// Run: node tests/teal-treasury-landing.test.mjs
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const SLUG = "teal-treasury-landing"
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
assert.deepEqual(imports, ["react", "gsap", "gsap/ScrollTrigger"], "react and gsap are the only imports")
const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"))
assert.ok(pkg.dependencies.gsap, "gsap is declared at the root")
assert.match(read("README.md"), /requires `gsap`/i, "and the README says so")
assert.doesNotMatch(src, /@import|@font-face|<link\b|fetch\(|new Image\(|<img\b/, "nothing loads at runtime")
assert.doesNotMatch(src, /https?:\/\//, "no URLs at all, so it renders in the capture sandbox")
assert.ok(src.includes('height = "100svh"'), "height defaults to a definite length")
assert.match(src, /"--ttl-h": height/, "the height prop reaches the root")
assert.match(src, /\.ttl-root\{[^}]*min-height:var\(--ttl-h\)/, "and sets its floor")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")
for (const m of src.matchAll(/([^{}]+)\{[^}]*(?<![-\w])height:100%/g))
  assert.match(m[1].trim(), /^(\.ttl-bar span|\.ttl-meter i|\.ttl-phone-screen|\.ttl-art-win|\.ttl-art-chart svg)$/, `percentage height on ${m[1].trim()}`)
assert.match(src, /\.ttl-dash\{[^}]*height:600px/, "the dashboard has a definite height")
assert.match(src, /\.ttl-stage\{position:sticky;[^}]*height:520px/, "so does the feature stage")
assert.match(src, /React\.useId\(\)\.replace/, "svg ids are namespaced per instance")
assert.doesNotMatch(src, /url\(#[a-z]/, "gradient references are built from the instance id")
assert.doesNotMatch(src.slice(0, src.indexOf("</")), /use(State|Ref|Memo|Callback)<|Partial<|Record<|RefObject<|React\.[A-Za-z]+</, "no generics before the JSX (21st CLI tokenizer)")
assert.doesNotMatch(src, /use(State|Ref|Memo|Callback)</, "hooks are typed without <generics>")
assert.match(src, /matchMedia\("\(prefers-reduced-motion: reduce\)"\)/, "reduced motion is read in JS (tweens, scrolling, timers)")

const css = src.match(/const TTL_CSS = `([\s\S]*?)`/)
assert.ok(css, "CSS block present")
assert.doesNotMatch(css[1], /\$\{|`/, "no interpolation inside the CSS string")
assert.doesNotMatch(css[1], /url\(/, "no url() in the style block")
assert.ok(css[1].includes("prefers-reduced-motion:reduce"), "honours reduced motion in CSS")
for (const m of css[1].replace(/\/\*[\s\S]*?\*\//g, "").replace(/@media[^{]*\{/g, "").replace(/@keyframes[^{]*\{/g, "").matchAll(/(?<=^|[{}])\s*([^{}@]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (/^(from|to|[\d.,%\s]+)$/.test(sel)) continue
  for (const s of sel.split(/,(?![^(]*\))/)) assert.match(s.trim(), /^\.ttl-/, `selector escapes the component: ${s.trim()}`)
}
assert.match(css[1], /\.ttl-svg\{display:block;max-width:none/, "svgs are guarded against Preflight")
assert.match(css[1], /\.ttl-root :where\(button\)\{/, "the reset has no specificity to fight")
assert.match(css[1], /\.ttl-root\{[^}]*overflow-x:clip/, "the root clips sideways without breaking sticky")
assert.doesNotMatch(css[1], /\.ttl-root\{[^}]*overflow:hidden/, "overflow:hidden on the root would break the sticky nav and stage")
assert.match(css[1], /\.ttl-nav\{position:sticky/, "the nav sticks")
assert.match(css[1], /\.ttl-res-card:hover\{translate:/, "hover lifts use translate, leaving transform to GSAP")

/* ---------- motion is scoped and reversible ---------- */

assert.match(src, /gsap\.registerPlugin\(ScrollTrigger\)/, "ScrollTrigger is registered inside the effect")
assert.match(src, /gsap\.utils\.selector\(root\)/, "every selector is scoped to this root")
assert.match(src, /mm\.add\(\{ motion: "\(prefers-reduced-motion: no-preference\)"/, "scroll motion only runs without reduced motion")
assert.match(src, /mm\.revert\(\)/, "and is reverted on unmount (strict mode mounts twice)")
assert.match(src, /ScrollTrigger\.refresh\(\)/, "late layout shifts refresh the triggers")
assert.match(src, /gsap\.killTweensOf\(b\)/, "the CTA's pointer glows clean up")
for (const k of [".ttl-device", ".ttl-bword", ".ttl-stage, .ttl-feat-inline", "[data-ttl-rise]", ".ttl-dial-ticks", ".ttl-bigmark span"]) assert.ok(src.includes(k), `${k} is animated`)

/* ---------- it behaves like a product page ---------- */

for (const k of ["dashboard", "benefits", "features", "coverage", "pricing", "faq", "get-started", "resources"]) assert.ok(src.includes(`data-sec="${k}"`), `section ${k} is addressable`)
assert.match(src, /scrollIntoView\(\{ behavior: reduced \? "auto" : "smooth", block: "start" \}\)/, "in-page links scroll, instantly under reduced motion")
assert.match(src, /if \(id === "get-started"\) setCtaSignal/, "Get started opens the email field")
assert.match(src, /inputRef\.current\?\.focus\(\{ preventScroll: true \}\)/, "and focuses it without a second jump")
assert.match(src, /const res = applyTransfer\(accounts, \{ from, to, amount: amt \}\)\n\s+if \(!res\.ok\) \{\n\s+setErr\(res\.error\)/, "a bad transfer is refused with its reason")
assert.match(src, /return res !== false/, "onTransfer and onGetStarted can refuse")
assert.match(src, /alive\.current = true\n/, "the unmount guard survives strict mode's double mount")
assert.match(src, /aria-expanded=\{open === i\}/, "questions are disclosures")
assert.match(src, /rootMargin: "-45% 0px -45% 0px"/, "the block in the middle of the screen drives the stage")
assert.match(src, /isEmail\(email\)/, "the email is validated before sending")
assert.ok(read("demo.tsx").includes("<TealTreasuryLanding />"), "default demo is the component, full bleed")
assert.doesNotMatch(read("demo.tsx"), /<div/, "default demo has no wrapper")
assert.match(read("demo-custom.tsx"), /palette="plum"/, "the custom demo reprints the page")
assert.doesNotMatch(read("demo-custom.tsx"), /="[^"]*\\n/, "no \\n inside a JSX string attribute (it would print literally)")
assert.doesNotMatch(read("demo-custom.tsx"), /https?:\/\//, "the custom demo stays capture-safe too")

/* ---------- logic, executed ---------- */

const code = region("content") + region("logic") +
  "\nexport { PALETTES, DEFAULT_ACCOUNTS, DEFAULT_FAQ, clamp, easeOutCubic, formatMoney, formatCompact, formatStat, percentages, applyTransfer, coverageOf, depositAt, positionOf, series, sparkPath, markedWords, fragmentedCost, parseAmount, typedAmount, isEmail, resolvePalette }\n"
const L = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(code)))

assert.equal(L.formatMoney(63256000), "$63,256,000.00")
assert.equal(L.formatMoney(-2150000), "-$2,150,000.00")
assert.equal(L.formatMoney(8450000, 0), "$8,450,000")
assert.equal(L.formatCompact(8450000), "$8.45M")
assert.equal(L.formatCompact(250000), "$250K")
assert.equal(L.formatCompact(125e6), "$125M")
assert.equal(L.formatCompact(41113950), "$41.1M")
assert.equal(L.formatCompact(1.2e9), "$1.2B")
assert.equal(L.formatCompact(-2150000), "-$2.15M")
assert.equal(L.formatCompact(512), "$512")
assert.equal(L.formatStat({ value: 48, prefix: "$", suffix: "B", label: "" }, 48), "$48B")
assert.equal(L.formatStat({ value: 3.4, decimals: 1, prefix: "$", suffix: "B", label: "" }, 3.4), "$3.4B")
assert.equal(L.easeOutCubic(1), 1)
assert.equal(L.easeOutCubic(2), 1, "clamped")

// the default accounts add up to the headline balance
assert.equal(L.DEFAULT_ACCOUNTS.reduce((a, b) => a + b.balance, 0), 63256000)

// transfers move exactly the amount and never change the total
const A = L.DEFAULT_ACCOUNTS
const t = L.applyTransfer(A, { from: "mmf", to: "operating", amount: 8450000.37 })
assert.ok(t.ok)
assert.equal(t.accounts.find((a) => a.id === "operating").balance, 27426800.37)
assert.equal(t.accounts.find((a) => a.id === "mmf").balance, 32663949.63)
assert.equal(t.accounts.reduce((a, b) => a + b.balance, 0), 63256000)
assert.equal(t.accounts.find((a) => a.id === "vault").balance, 3165250, "bystanders untouched")
assert.notEqual(t.accounts, A, "the input is not mutated")
assert.equal(A[0].balance, 18976800)
assert.ok(!L.applyTransfer(A, { from: "mmf", to: "mmf", amount: 1 }).ok, "same account refused")
assert.ok(!L.applyTransfer(A, { from: "mmf", to: "operating", amount: 0 }).ok, "zero refused")
assert.ok(!L.applyTransfer(A, { from: "vault", to: "operating", amount: 3165250.01 }).ok, "overdraw refused")
assert.ok(L.applyTransfer(A, { from: "vault", to: "operating", amount: 3165250 }).ok, "the whole balance is fine")
assert.match(L.applyTransfer(A, { from: "vault", to: "operating", amount: 9e9 }).error, /Vault/)
assert.ok(!L.applyTransfer(A, { from: "nope", to: "operating", amount: 1 }).ok)

// coverage spreads in per-bank slices up to the limit
assert.deepEqual(L.coverageOf(40e6, 250e3, 125e6), { covered: 40e6, excess: 0, banks: 160, maxBanks: 500 })
assert.deepEqual(L.coverageOf(250e6, 250e3, 125e6), { covered: 125e6, excess: 125e6, banks: 500, maxBanks: 500 })
assert.equal(L.coverageOf(300e3, 250e3, 125e6).banks, 2, "a partial bank still counts")
assert.equal(L.coverageOf(-5, 250e3, 125e6).covered, 0)
assert.equal(L.depositAt(0, 250e3, 250e6), 250e3)
assert.equal(L.depositAt(1, 250e3, 250e6), 250e6)
for (const v of [250e3, 1e6, 40e6, 125e6, 250e6]) assert.ok(Math.abs(L.depositAt(L.positionOf(v, 250e3, 250e6), 250e3, 250e6) - v) / v < 0.05, `${v} round-trips through the slider`)

for (const v of [[18976800, 41113950, 3165250], [1, 1, 1], [5], [0, 3]]) assert.equal(L.percentages(v).reduce((a, b) => a + b, 0), 100, `${v} sums to 100`)
assert.deepEqual(L.percentages([18976800, 41113950, 3165250]), [30, 65, 5])
assert.deepEqual(L.percentages([0, 0]), [0, 0])

const s1 = L.series(11, 36, 0.02, 0.002)
assert.equal(s1.length, 36)
assert.equal(s1[35], 1, "series end at 1 so they scale to the balance")
assert.deepEqual(L.series(11, 36, 0.02, 0.002), s1, "and are deterministic, so server and client agree")
const sp = L.sparkPath([1, 2, 3], 300, 84)
assert.match(sp.line, /^M0\.0 [\d.]+L150\.0 [\d.]+L300\.0 [\d.]+$/)
assert.match(sp.area, /Z$/)
assert.deepEqual(L.sparkPath([1], 300, 84), { line: "", area: "" })

const hw = L.markedWords("*Treasury*—centralized\ncapital management")
assert.deepEqual(hw.map((w) => w.word), ["Treasury", "centralized", "capital", "management"])
assert.equal(hw[0].mark && hw[0].glue, true, "the accent word is glued to what follows")
assert.equal(hw[0].tail, "—", "and carries the dash, so a narrow line breaks after it")
assert.equal(hw[1].br, true)
const bw = L.markedWords("With *Vaultline Treasury,* set up")
assert.deepEqual(bw.map((w) => [w.word, w.mark, w.glue]), [["With", false, false], ["Vaultline", true, false], ["Treasury,", true, false], ["set", false, false], ["up", false, false]])
assert.deepEqual(L.markedWords("").length, 0)

assert.equal(L.fragmentedCost(6), 22200)
assert.ok(L.fragmentedCost(40) > L.fragmentedCost(6))
assert.equal(L.fragmentedCost(0), L.fragmentedCost(1), "at least one entity")

assert.equal(L.typedAmount("8450000"), "8,450,000")
assert.equal(L.typedAmount("1234.567"), "1,234.56")
assert.equal(L.typedAmount("00012"), "12")
assert.equal(L.typedAmount(".5"), "0.5")
assert.equal(L.typedAmount("abc"), "")
assert.equal(L.parseAmount("8,450,000.37"), 8450000.37)
assert.equal(L.parseAmount(""), 0)

assert.ok(L.isEmail("ana@fund.com"))
assert.ok(!L.isEmail("ana@fund"))
assert.ok(!L.isEmail("ana fund.com"))

assert.equal(L.resolvePalette("plum").accent, L.PALETTES.plum.accent)
assert.equal(L.resolvePalette({ gold: "#ff0000" }).gold, "#ff0000", "a partial palette overrides")
assert.equal(L.resolvePalette({ gold: "#ff0000" }).ink, L.PALETTES.teal.ink, "and falls back to teal")
assert.equal(L.resolvePalette(undefined).page, L.PALETTES.teal.page)
for (const [name, p] of Object.entries(L.PALETTES)) {
  for (const [k, v] of Object.entries(p)) {
    if (typeof v === "string") assert.match(v, /^#[0-9a-f]{6}$/i, `${name}.${k} is a hex colour`)
    else for (const c of v) assert.match(c, /^#[0-9a-f]{6}$/i, `${name}.${k}`)
  }
  assert.equal(p.chart.length, 3)
  assert.equal(p.glow.length, 3)
}
assert.ok(L.DEFAULT_FAQ.length >= 6)

console.log("teal-treasury-landing: ok")
