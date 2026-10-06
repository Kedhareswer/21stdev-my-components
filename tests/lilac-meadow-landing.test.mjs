// Install-safety and logic checks for components/lilac-meadow-landing.
// Run: node tests/lilac-meadow-landing.test.mjs
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const SLUG = "lilac-meadow-landing"
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
assert.doesNotMatch(src, /@import|@font-face|<link\b|fetch\(|new Image\(/, "nothing loads at runtime")
assert.doesNotMatch(src, /https?:\/\//, "no external URLs — every picture is painted in the file")
assert.equal((src.match(/<img\b/g) || []).length, 1, "the only <img> is the optional hero photo")
assert.match(src, /heroCopy\.image \? \(\s*<img className="lml-heroimg"[^>]*maxWidth: "none"/, "and it is guarded against Preflight")
assert.ok(src.includes('height = "100svh"'), "height defaults to a definite length")
assert.match(src, /minHeight: height/, "height reaches the root")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")
assert.match(src, /React\.useId\(\)\.replace/, "svg ids are namespaced per instance")
assert.doesNotMatch(src, /url\(#[a-z]/, "gradient references are built from the instance id")
assert.doesNotMatch(src, /use(State|Ref|Memo|Callback|Context|LayoutEffect|Effect)<|Record<|Array<|Promise<|Partial<|RefObject</, "no <generics> for the 21st CLI tokenizer to choke on")
assert.ok(src.includes("prefers-reduced-motion:reduce"), "honours reduced motion in CSS")
assert.match(src, /matchMedia\("\(prefers-reduced-motion: reduce\)"\)/, "and in JS (parallax, intro, chart tween)")

const css = src.match(/const LML_CSS = `([\s\S]*?)`/)
assert.ok(css, "CSS block present")
assert.doesNotMatch(css[1], /\$\{|`/, "no interpolation inside the CSS string")
assert.doesNotMatch(css[1], /url\(/, "no url() in the style block")
for (const m of css[1].replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/(?<=^|[{}])\s*([^{}@]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (/^(from|to|[\d.,%\s]+)$/.test(sel)) continue
  for (const s of sel.split(/,(?![^(]*\))/)) assert.match(s.trim(), /^(\.dark )?\.lml-/, `selector escapes the component: ${s.trim()}`)
}
assert.match(css[1], /\.lml-svg\{[^}]*max-width:none/, "svgs are guarded against Preflight")
assert.match(css[1], /\.lml-canvas\{[^}]*max-width:none[^}]*pointer-events:none/, "canvases are guarded and never swallow clicks meant for the coins")
assert.match(css[1], /\.lml-root :where\(button,input\)\{/, "the reset has no specificity to fight")
assert.match(css[1], /\.lml-root\{[^}]*overflow-x:clip/, "the root clips sideways without breaking the sticky nav")
assert.doesNotMatch(css[1], /\.lml-root\{[^}]*overflow:hidden/, "overflow:hidden on the root would break the sticky nav")
assert.match(css[1], /\.dark \.lml-root\[data-theme="auto"\]/, "auto theme follows a host .dark class")
assert.match(css[1], /\.lml-stage\{[^}]*height:clamp\(/, "hero height is a definite clamp, not a percentage")
assert.match(css[1], /\.lml-joinbox\{[^}]*height:clamp\(/, "so is the join band")
assert.match(css[1], /\.lml-backers\{[^}]*padding-top:[^}]*padding-bottom:/, "backers keep the wrap's side gutter")
assert.doesNotMatch(css[1], /\.lml-(backers|feats|uc|faq)\{[^}]*padding:/, "no padding shorthand overriding .lml-wrap's gutter")

/* ---------- it behaves like a landing page ---------- */

for (const k of ["top", "product", "features", "use-cases", "calculator", "faq", "join"]) assert.ok(src.includes(`data-sec="${k}"`), `section ${k} is addressable`)
assert.match(src, /scrollIntoView\(\{ behavior: reduced \? "auto" : "smooth"/, "in-page links scroll, instantly under reduced motion")
assert.match(src, /const uc = useCaseFromHref\(href, ucIds\)[\s\S]{0,200}setTab\(ucIds\.indexOf\(uc\)\)/, "nav links named after a use case open its tab")
assert.match(src, /role="tablist"/, "use cases are a tab list")
assert.match(src, /nextIndex\(i, e\.key, useCases\.length\)/, "arrow keys move between tabs")
assert.match(src, /className="lml-tabbar"[\s\S]{0,120}onAnimationEnd/, "tabs auto-advance off the progress bar, so reduced motion never advances")
assert.match(src, /aria-expanded=\{open\}/, "FAQ rows announce their state")
assert.match(src, /role="switch" aria-checked=\{compound\}/, "compounding is a switch")
assert.match(src, /aria-label=\{"Flip the coin/, "coins are labelled buttons")
assert.match(src, /isEmail\(email\)/, "join form validates before sending")
assert.match(src, /if \(onJoin\) await onJoin\(email\.trim\(\)\)/, "onJoin is awaited")
assert.match(src, /below\.forEach\(\(n\) => n\.classList\.add\("lml-pre"\)\)/, "only content below the fold is hidden for reveal")
assert.match(src, /e\.pointerType === "touch"/, "no parallax from touch")
assert.ok(read("demo.tsx").includes("<LilacMeadowLanding />"), "default demo is the component, full bleed")
assert.doesNotMatch(read("demo.tsx"), /<div/, "default demo has no wrapper")
assert.match(read("demo-rose.tsx"), /palette="rose"/, "the rose demo re-plants the page")

/* ---------- logic, executed ---------- */

const code = region("logic") + "\nexport { PALETTES, clamp, mulberry32, hexToRgb, rgbToHex, mix, ramp, ridgeAt, buildMeadow, projectBalance, growthSeries, sliderToAmount, amountToSlider, formatUSD, formatMonths, isEmail, nextIndex, resolvePalette, useCaseFromHref, MIN_DEPOSIT, MAX_DEPOSIT }\n"
const L = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(code)))

const a = L.mulberry32(7)
const b = L.mulberry32(7)
const seq = [a(), a(), a()]
assert.deepEqual(seq, [b(), b(), b()], "seeded PRNG is deterministic, so every render paints the same meadow")
assert.ok(seq.every((v) => v >= 0 && v < 1))

assert.deepEqual(L.hexToRgb("#5f4fb8"), [95, 79, 184])
assert.deepEqual(L.hexToRgb("#fff"), [255, 255, 255])
assert.deepEqual(L.hexToRgb("nope"), [0, 0, 0])
assert.equal(L.rgbToHex([95, 79, 184]), "#5f4fb8")
assert.equal(L.rgbToHex([300, -4, 0.4]), "#ff0000", "channels are clamped and rounded")
assert.equal(L.mix("#000000", "#ffffff", 0), "#000000")
assert.equal(L.mix("#000000", "#ffffff", 1), "#ffffff")
assert.equal(L.mix("#000000", "#ffffff", 0.5), "#808080")
assert.equal(L.mix("#000000", "#ffffff", 3), "#ffffff", "t is clamped")
assert.equal(L.ramp(["#000000", "#ffffff"], 0.5), "#808080")
assert.equal(L.ramp(["#000000", "#ff0000", "#ffffff"], 0.5), "#ff0000", "stops are evenly spaced")
assert.equal(L.ramp(["#123456"], 0.7), "#123456")
assert.equal(L.ramp([], 0.7), "#000000")

const layer = { base: 0.8, mounds: [[0.5, 0.2, 0.3]], size: [2, 4], density: 1, band: 120, haze: 0, straws: 12, wobble: 0, petals: true }
assert.equal(L.ridgeAt(0, 1000, 500, layer, 0, 1), 400, "no mound: the ridge sits on its base")
assert.equal(L.ridgeAt(500, 1000, 500, layer, 0, 1), 250, "mound centre rises by its full height")
assert.ok(L.ridgeAt(600, 1000, 500, layer, 0, 1) > 250 && L.ridgeAt(600, 1000, 500, layer, 0, 1) < 400, "and slopes away")

const colors = { flowers: ["#000000", "#808080", "#ffffff"], sky: "#ccccff", straw: ["#d0c090", "#806030"] }
const m1 = L.buildMeadow(layer, 600, 300, 3, colors)
const m2 = L.buildMeadow(layer, 600, 300, 3, colors)
assert.deepEqual(m1, m2, "a meadow is reproducible from its seed")
assert.notDeepEqual(L.buildMeadow(layer, 600, 300, 4, colors).items.slice(0, 5), m1.items.slice(0, 5), "and a new seed grows a new one")
const florets = m1.items.filter((i) => i.t === 0)
const straws = m1.items.filter((i) => i.t === 1)
assert.ok(florets.length > 500, "plenty of florets")
assert.ok(straws.length > 0 && straws.length <= 12, "straws only where flowers grow")
assert.ok(m1.items.every((it, i, arr) => i === 0 || arr[i - 1].y <= it.y), "drawn back to front")
for (const f of florets) {
  assert.match(f.c, /^#[0-9a-f]{6}$/)
  assert.ok(f.x >= -12 && f.x <= 612, "florets stay in the canvas bleed")
  assert.ok(f.y >= L.ridgeAt(f.x, 600, 300, layer, 0, 1) - 40, "florets grow under the ridge")
}
assert.ok(florets.some((f) => f.p) , "petal mode draws five-petal florets")
assert.equal(m1.ridge[0].length, 2)
assert.ok(m1.top <= m1.ridge[0][1])
const hazy = L.buildMeadow({ ...layer, haze: 1, petals: false }, 600, 300, 3, colors)
assert.ok(hazy.items.filter((i) => i.t === 0).every((f) => !f.p), "dots without petals")
const big = L.buildMeadow({ ...layer, density: 99, band: 999 }, 2400, 900, 1, colors)
assert.ok(big.items.length <= 42000 + 12, "floret count is capped")

assert.equal(L.projectBalance(1000, 12, 0, true), 1000)
assert.equal(Math.round(L.projectBalance(1000, 12, 12, false)), 1120, "simple interest")
assert.equal(L.projectBalance(1000, 12, 12, true).toFixed(2), "1126.83", "monthly compounding")
assert.ok(L.projectBalance(1000, 5, 60, true) > L.projectBalance(1000, 5, 60, false), "compounding wins over time")
const series = L.growthSeries(1000, 5, 12, true, 13)
assert.equal(series.length, 13)
assert.equal(series[0], 1000)
assert.equal(series[12], L.projectBalance(1000, 5, 12, true))
assert.ok(series.every((v, i) => i === 0 || v > series[i - 1]), "the line only climbs")
assert.equal(L.growthSeries(1000, 5, 12, true, 0).length, 2, "at least two points")

assert.equal(L.sliderToAmount(0), L.MIN_DEPOSIT)
assert.equal(L.sliderToAmount(1), L.MAX_DEPOSIT)
assert.equal(L.sliderToAmount(0.5), 10000, "log scale: the middle is $10K")
assert.equal(L.sliderToAmount(-1), L.MIN_DEPOSIT)
for (const amt of [100, 2500, 10000, 75000, 1000000]) assert.equal(L.sliderToAmount(L.amountToSlider(amt)), amt, `round-trips ${amt}`)
const s1 = L.sliderToAmount(0.37)
assert.equal(s1 % (Math.pow(10, Math.floor(Math.log10(s1))) / 20), 0, "amounts land on friendly steps")

assert.equal(L.formatUSD(524.186), "$524.19")
assert.equal(L.formatUSD(10524.4), "$10,524")
assert.equal(L.formatMonths(0), "Today")
assert.equal(L.formatMonths(1), "1 month")
assert.equal(L.formatMonths(6), "6 months")
assert.equal(L.formatMonths(12), "1 year")
assert.equal(L.formatMonths(36), "3 years")

assert.ok(L.isEmail("ada@example.com"))
assert.ok(L.isEmail("  a.b+c@mail.co.uk "))
for (const bad of ["", "nope", "a@b", "a@b.c", "a b@c.de", "@c.de"]) assert.ok(!L.isEmail(bad), `rejects ${JSON.stringify(bad)}`)

assert.equal(L.nextIndex(0, "ArrowDown", 3), 1)
assert.equal(L.nextIndex(2, "ArrowRight", 3), 0, "wraps forward")
assert.equal(L.nextIndex(0, "ArrowUp", 3), 2, "wraps back")
assert.equal(L.nextIndex(1, "Home", 3), 0)
assert.equal(L.nextIndex(0, "End", 3), 2)
assert.equal(L.nextIndex(0, "a", 3), null)
assert.equal(L.nextIndex(0, "ArrowDown", 0), null)

assert.equal(L.resolvePalette("rose"), L.PALETTES.rose)
assert.equal(L.resolvePalette("nope"), L.PALETTES.lilac, "unknown palettes fall back to lilac")
assert.equal(L.resolvePalette(undefined), L.PALETTES.lilac)
assert.equal(L.resolvePalette("toString"), L.PALETTES.lilac, "inherited keys are not palettes")
const keys = ["flowers", "nightFlowers", "sky", "nightSky", "metal", "deep", "wash", "wash2", "accent"]
for (const [name, p] of Object.entries(L.PALETTES)) {
  for (const k of keys) assert.ok(k in p, `${name} has ${k}`)
  assert.equal(p.flowers.length, 6, `${name} has six flower stops`)
  assert.equal(p.metal.length, 7, `${name} has seven metal stops`)
  for (const c of [...p.flowers, ...p.nightFlowers, ...p.sky, ...p.nightSky, ...p.metal, p.deep, p.wash, p.wash2, p.accent]) assert.match(c, /^#[0-9a-f]{6}$/)
}

assert.equal(L.useCaseFromHref("#business", ["business", "treasury"]), "business")
assert.equal(L.useCaseFromHref("#faq", ["business"]), null)
assert.equal(L.useCaseFromHref("business", ["business"]), null, "only hashes")
assert.equal(L.clamp(5, 0, 1), 1)

console.log("lilac-meadow-landing: ok")
