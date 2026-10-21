// Install-safety and logic checks for components/stipple-orb-landing.
// Run: node tests/stipple-orb-landing.test.mjs
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const SLUG = "stipple-orb-landing"
const read = (file) => readFileSync(new URL(`../components/${SLUG}/${file}`, import.meta.url), "utf8").replace(/\r\n/g, "\n")
const src = read(`${SLUG}.tsx`)
const region = (name) => {
  const a = src.indexOf(`// #region ${name}\n`)
  const b = src.indexOf(`// #endregion ${name}\n`)
  assert.ok(a > -1 && b > a, `region ${name} missing`)
  return src.slice(a, b)
}
const code = src.replace(region("photos"), "")

/* ---------- nothing travels with it ---------- */

const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "react is the only import")
assert.doesNotMatch(code, /@import|@font-face|<link\b|fetch\(|new Image\(/, "nothing loads at runtime")
assert.doesNotMatch(code, /https?:\/\//, "no URLs, so it renders in the capture sandbox")
const photos = [...region("photos").matchAll(/"(data:image\/webp;base64,[A-Za-z0-9+/=]+)"/g)]
assert.equal(photos.length, 8, "three portraits and five avatars are embedded")
assert.ok(region("photos").length < 60000, "and stay small")
assert.ok(region("photos").includes("Unsplash License"), "the photos are credited")
assert.ok(src.includes('height = "100svh"'), "height defaults to a definite length")
assert.match(src, /"--sol-h": height/, "the height prop reaches the root")
assert.match(src, /\.sol-hero\{[^}]*min-height:clamp\(620px,calc\(var\(--sol-h\) - var\(--sol-nav\)\),980px\)/, "the hero has a definite height")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")
assert.doesNotMatch(src, /height:100%/, "no percentage heights")
assert.match(src, /\.sol-orb\{[^}]*aspect-ratio:1\/1/, "the orb gets its height from its width")
assert.match(src, /canvas\.style\.height = h \+ "px"/, "canvases are sized in pixels, never by percentage")
assert.match(src, /React\.useId\(\)\.replace/, "svg ids are namespaced per instance")
assert.doesNotMatch(src.slice(0, src.indexOf("</")), /use(State|Ref|Memo|Callback)<|Partial<|Record<|Array<|Map<|React\.[A-Za-z]+<|\[K in /, "no generics before the JSX (21st CLI tokenizer)")
assert.doesNotMatch(src, /use(State|Ref|Memo|Callback)</, "hooks are typed without <generics>")
assert.doesNotMatch(src, /[—–]/, "no em or en dashes")
assert.doesNotMatch(src, />[^<{]*\\u[0-9a-f]{4}/i, "no \\u escapes inside JSX text")

const css = src.match(/const SOL_CSS = `([\s\S]*?)`/)
assert.ok(css, "CSS block present")
assert.doesNotMatch(css[1], /\$\{|`/, "no interpolation inside the CSS string")
assert.doesNotMatch(css[1], /url\(/, "no url() in the style block")
assert.ok(css[1].includes("prefers-reduced-motion:reduce"), "honours reduced motion in CSS")
for (const m of css[1].replace(/\/\*[\s\S]*?\*\//g, "").replace(/@media[^{]*\{/g, "").replace(/@keyframes[^{]*\{/g, "").matchAll(/(?<=^|[{}])\s*([^{}@]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (/^(from|to|[\d.,%\s]+)$/.test(sel)) continue
  for (const s of sel.split(/,(?![^(]*\))/)) assert.match(s.trim(), /^\.sol-/, `selector escapes the component: ${s.trim()}`)
}
assert.match(css[1], /\.sol-root :where\(svg,img,canvas\)\{display:block;max-width:none\}/, "media is guarded against Preflight")
assert.match(css[1], /\.sol-root\{[^}]*overflow-x:clip/, "the root clips sideways without breaking the sticky nav")
assert.doesNotMatch(css[1], /\.sol-root\{[^}]*overflow:hidden/, "overflow:hidden on the root would break the sticky nav")
assert.match(css[1], /\.sol-nav\{position:sticky/, "the nav sticks")
assert.match(css[1], /\.sol-root\[data-theme="dark"\]\{[^}]*--sol-btn:#ecebe6/, "a designed dark theme, with buttons that still read")

/* ---------- it behaves like a product page ---------- */

for (const k of ["top", "thesis", "paths", "how", "stories", "cta", "faq"]) assert.ok(src.includes(`data-sec="${k}"`), `section ${k} is addressable`)
assert.match(src, /scrollIntoView\(\{ behavior: reduced \? "auto" : "smooth", block: "start" \}\)/, "in-page links scroll, instantly under reduced motion")
assert.match(src, /matchMedia\("\(prefers-reduced-motion: reduce\)"\)/, "reduced motion is read in JS for the canvases")
assert.match(src, /if \(on && !reduced\) start\(\)/, "the orb runs only on screen and never under reduced motion")
assert.match(src, /document\.hidden\) stop\(\)/, "and stops in a background tab")
assert.match(src, /canvas\.setPointerCapture/, "the orb can be dragged")
assert.match(src, /st\.ripples\.push/, "and clicked")
assert.match(src, /e\.key === "ArrowLeft" \|\| e\.key === "ArrowRight"/, "and spun from the keyboard")
assert.match(src, /touch-action:pan-y/, "the page still scrolls through it on a phone")
assert.match(src, /if \(res === false\) ok = false/, "onRequestAccess can refuse")
assert.match(src, /isEmail\(email\)/, "the access form validates")
assert.match(src, /aria-modal="true"/, "the dialog and phone menu are modal")
assert.match(src, /e\.key === "Escape"/, "Escape closes them")
assert.match(src, /data-access="raise"/, "Apply for funding opens the form on the raise role")
assert.match(src, /aria-expanded=\{on\}/, "questions are disclosures")
assert.equal((src.match(/nextIndex\(i, e\.key, /g) || []).length, 2, "arrow keys move through the radio groups")
assert.match(src, /projectStake\(amount, model, years\)/, "the backer calculator runs the model")
assert.match(src, /capitalFor\(income, share \/ 100, years, model\.growth\)/, "so does the raise calculator")
assert.match(src, /Illustrative, not a forecast\./, "and says what it is")
assert.ok(read("demo.tsx").includes("<StippleOrbLanding />"), "default demo is the component, full bleed")
assert.doesNotMatch(read("demo.tsx"), /<div/, "default demo has no wrapper")
assert.match(read("demo-lagoon.tsx"), /palette="lagoon"/, "the second demo reprints the page in another palette")
assert.doesNotMatch(read("demo-lagoon.tsx"), /https?:\/\//, "and stays capture-safe")

/* ---------- logic, executed ---------- */

const L = await import(
  "data:text/javascript," +
    encodeURIComponent(
      stripTypeScriptTypes(
        region("content") + region("logic") +
          "\nexport { PALETTES, DEFAULT_MODEL, mulberry32, fibSphere, rotate, shade, hexToRgb, ramp, onColor, resolvePalette, projectStake, capitalFor, money, compact, ringArcs, arcPath, smoothPath, twoTone, isEmail, nextIndex, horizonPoints }\n"
      )
    )
)

// the sphere: unit points, evenly spread, deterministic
const n = 4000
const pts = L.fibSphere(n, 11)
assert.equal(pts.length, n * 5)
let up = 0
for (let i = 0; i < n; i++) {
  const [x, y, z, r, u] = pts.slice(i * 5, i * 5 + 5)
  assert.ok(Math.abs(Math.hypot(x, y, z) - 1) < 1e-4, "on the unit sphere")
  assert.ok(r > 0.98 && r < 1.15, "grain stays near the surface")
  assert.ok(u >= 0 && u < 1)
  if (y < 0) up++
}
assert.ok(Math.abs(up / n - 0.5) < 0.01, "half the points in each hemisphere")
assert.deepEqual(Array.from(L.fibSphere(50, 3)), Array.from(L.fibSphere(50, 3)), "seeded")
// rotation keeps length
const out = [0, 0, 0]
L.rotate(0.3, -0.4, Math.sqrt(1 - 0.25), Math.cos(1), Math.sin(1), Math.cos(-0.4), Math.sin(-0.4), out)
assert.ok(Math.abs(Math.hypot(...out) - 1) < 1e-9)
// lit side is dense, shadow side is sparse but never empty
const lit = L.shade(0.5, -0.72, 0.48)
const dark = L.shade(-0.5, 0.72, -0.48)
assert.ok(lit.density > 0.95 && dark.density >= 0.1 && dark.density < 0.15)

// horizon points stay in the upper half-disc
const hp = L.horizonPoints(2000, 5)
for (let i = 0; i < 2000; i++) assert.ok(hp[i * 5 + 1] <= 1e-6, "rises from the bottom edge")

// colour
assert.deepEqual(L.hexToRgb("#f0883e"), [240, 136, 62])
assert.deepEqual(L.hexToRgb("#fff"), [255, 255, 255])
assert.deepEqual(L.hexToRgb("nope"), [128, 128, 128])
const r = L.ramp([0, 0, 0], [255, 255, 255], 3)
assert.deepEqual(r, ["rgb(0,0,0)", "rgb(128,128,128)", "rgb(255,255,255)"])
assert.equal(L.onColor("#1f2c4a"), "#ffffff")
assert.equal(L.onColor("#f6efc6"), "#141414")
assert.equal(L.resolvePalette("lagoon"), L.PALETTES.lagoon)
assert.equal(L.resolvePalette(undefined), L.PALETTES.ember)
assert.equal(L.resolvePalette({ button: "#f6efc6" }).onButton, "#141414", "a light custom button gets dark text")
assert.equal(L.resolvePalette({ accent: "#00ff00" }).button, L.PALETTES.ember.button, "custom palettes fill in from ember")

// the stake model
const m = L.DEFAULT_MODEL
const p = L.projectStake(25000, m)
assert.equal(p.yearly.length, 15)
assert.ok(Math.abs(p.yearly[0] - 180000 * 0.075 * (25000 / 135000)) < 1e-6, "year one is income x share x slice")
assert.ok(Math.abs(p.yearly[1] / p.yearly[0] - 1.12) < 1e-9, "and grows with income")
assert.ok(Math.abs(p.cumulative[14] - p.total) < 1e-6)
for (let i = 1; i < 15; i++) assert.ok(p.cumulative[i] > p.cumulative[i - 1], "cumulative never falls")
assert.equal(p.breakeven, 7, "paid back in year 7 on the defaults")
assert.ok(p.cumulative[5] < 25000 && p.cumulative[6] >= 25000)
assert.ok(Math.abs(p.multiple - p.total / 25000) < 1e-9)
assert.equal(p.revenueToBreakeven, 1800000, "$135k at 7.5% needs $1.8M of lifetime income")
assert.ok(Math.abs(L.projectStake(100000, m).total / p.total - 4) < 1e-9, "returns scale with the stake")
assert.equal(L.projectStake(25000, { ...m, growth: -0.5 }, 5).breakeven, -1, "a shrinking income may never pay back")
assert.equal(L.projectStake(1e9, m).yearly[0], 180000 * 0.075, "a slice is capped at the whole pool")
assert.equal(L.projectStake(25000, m, 8).yearly.length, 8, "the term can be shortened")

// the raise model
const c = L.capitalFor(250000, 0.06, 15, 0.12)
assert.ok(c > 100000 && c < 140000, "a $250k earner sharing 6% raises about $121k: " + c)
assert.ok(L.capitalFor(250000, 0.12, 15) > c * 1.99 && L.capitalFor(250000, 0.12, 15) < c * 2.01, "linear in the share")
assert.ok(L.capitalFor(250000, 0.06, 15, 0.12, 0.3) < c, "a higher backer return lowers the raise")
assert.equal(L.capitalFor(0, 0.1, 10), 0)

// formatting
assert.equal(L.money(1234567.4), "$1,234,567")
assert.equal(L.money(-950, "€"), "-€950")
assert.equal(L.compact(950), "$950")
assert.equal(L.compact(1800), "$1.8k")
assert.equal(L.compact(72000), "$72k")
assert.equal(L.compact(1800000), "$1.8M")
assert.equal(L.compact(1000000, "£"), "£1M")

// rings
const arcs = L.ringArcs([1, 1, 2], 0.1)
assert.equal(arcs.length, 3)
assert.ok(Math.abs(arcs[2].a1 - arcs[2].a0 - 2 * (arcs[0].a1 - arcs[0].a0)) < 1e-9, "spans are proportional")
assert.ok(Math.abs(arcs[2].a1 + 0.05 - (-Math.PI / 2 + Math.PI * 2)) < 1e-9, "and close the circle with the gaps")
for (let i = 1; i < 3; i++) assert.ok(Math.abs(arcs[i].a0 - arcs[i - 1].a1 - 0.1) < 1e-9, "gaps between them")
assert.deepEqual(L.ringArcs([0, 0], 0.1).map((a) => a.a1 - a.a0), [0, 0], "zeros draw nothing")
assert.match(L.arcPath(100, 100, 50, 80, 0, Math.PI / 2), /^M180 100 A80 80 0 0 1 100 180 L100 150 A50 50 0 0 0 150 100 Z$/)
assert.match(L.arcPath(0, 0, 1, 2, 0, Math.PI * 1.5), / 0 1 1 /, "large arcs get the flag")
assert.equal(L.smoothPath([]), "")
assert.match(L.smoothPath([[0, 0], [10, 10], [20, 0]]), /^M0 0 C.* 20 0$/)

// copy helpers
assert.deepEqual(L.twoTone("*Back the people*\nWorth"), [{ text: "Back the people", muted: true }, { text: "\nWorth", muted: false }])
assert.deepEqual(L.twoTone("plain"), [{ text: "plain", muted: false }])
assert.ok(L.isEmail("ada@park.co") && !L.isEmail("ada@park") && !L.isEmail("a b@c.com"))
assert.equal(L.nextIndex(0, "ArrowLeft", 3), 2)
assert.equal(L.nextIndex(2, "ArrowRight", 3), 0)
assert.equal(L.nextIndex(1, "End", 3), 2)
assert.equal(L.nextIndex(1, "x", 3), -1)

console.log(`ok - ${SLUG}`)
