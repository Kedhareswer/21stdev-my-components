// Install-safety and logic checks for components/iris-folio-template.
// Run: node tests/iris-folio-template.test.mjs
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const SLUG = "iris-folio-template"
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
assert.doesNotMatch(src, /@import|@font-face|<link\b|fetch\(|new Image\(/, "nothing loads at runtime — the lettering is glyph outlines")
assert.doesNotMatch(src, /https?:\/\/(?!\S*\}\s*$)[a-z]/i, "no external URLs in the defaults")
assert.ok(src.includes('height = "100svh"'), "height defaults to a definite length")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")
assert.match(src, /React\.useId\(\)\.replace/, "svg ids are namespaced per instance")
assert.doesNotMatch(src, /url\(#[a-z]/, "gradient and filter references are built from the instance id")
assert.doesNotMatch(src, /use(State|Ref|Memo|Callback|Context)<|Record<|Array<|Promise<|Partial</, "no <generics> for the 21st CLI tokenizer to choke on")
assert.match(src, /matchMedia\("\(prefers-reduced-motion: reduce\)"\)/, "reduced motion is honoured in JS (parallax, petals, counters)")
assert.match(src, /SIL Open Font License|SIL OFL/, "the glyph sources are credited")

const css = src.match(/const IFO_CSS = `([\s\S]*?)`/)
assert.ok(css, "CSS block present")
assert.doesNotMatch(css[1], /\$\{|`/, "no interpolation inside the CSS string")
assert.doesNotMatch(css[1], /url\(/, "no url() in the style block")
for (const m of css[1].replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/(?<=^|[{}])\s*([^{}@]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (/^(from|to|[\d.,%\s]+)$/.test(sel)) continue
  for (const s of sel.split(/,(?![^(]*\))/)) assert.match(s.trim(), /^(\.dark )?\.ifo-/, `selector escapes the component: ${s.trim()}`)
}
assert.ok(css[1].includes("prefers-reduced-motion:reduce"), "and in CSS")
assert.match(css[1], /\.ifo-svg\{[^}]*max-width:none/, "svgs are guarded against Preflight")
assert.match(css[1], /\.ifo-img\{[^}]*max-width:none/, "and so are your images")
assert.match(css[1], /\.ifo-root :where\(button\)\{/, "the reset has no specificity to fight")
assert.match(css[1], /\.ifo-root\{[^}]*overflow-x:clip/, "the root clips sideways without breaking the sticky nav")
assert.match(css[1], /\.dark \.ifo-root\[data-theme="auto"\]/, "auto theme follows a host .dark class")
assert.match(css[1], /\.ifo-band\{[^}]*aspect-ratio:1600\/660/, "the cover band has an intrinsic height, never a percentage")
assert.match(css[1], /\.ifo-intro \.ifo-gp\{[^}]*animation:ifo-write[^}]*both/, "the write-in fills both ways, so with animations off the word is simply there")

/* ---------- it behaves like a portfolio ---------- */

for (const k of ["top", "works", "about", "practice", "timeline", "contact"]) assert.ok(src.includes(`data-sec="${k}"`), `section ${k} is addressable`)
assert.match(src, /scrollIntoView\(\{ behavior: reduced \? "auto" : "smooth"/, "in-page links scroll, instantly under reduced motion")
assert.match(src, /className="ifo-iris"[\s\S]{0,200}role="button"[\s\S]{0,40}tabIndex=\{0\}/, "the iris is a focusable button")
assert.match(src, /e\.key === "Enter" \|\| e\.key === " "/, "and blooms from the keyboard")
assert.match(src, /data-tap="" onClick=\{onTap\}/, "a click on the sky scatters petals")
assert.match(src, /\.slice\(-28\)/, "petals are capped")
assert.match(src, /aria-pressed=\{filter === c\}/, "discipline chips announce their state")
assert.match(src, /role="dialog" aria-modal="true"/, "projects open in a modal dialog")
assert.match(src, /if \(e\.key === "Escape"\) \{/, "Escape closes it")
assert.match(src, /lastFocus\.current\?\.focus\(\)/, "and focus goes back to the card")
assert.match(src, /role="tablist" aria-label="Years"/, "the timeline is a tab list")
assert.match(src, /onKeyDown=\{\(e\) => onYearKey\(i, e\)\}/, "with arrow keys")
assert.match(src, /aria-expanded=\{on\}/, "practice rows announce their state")
assert.match(src, /navigator\.clipboard\.writeText\(C\.email\)/, "the email copies itself")
assert.match(src, /below\.forEach\(\(n\) => n\.classList\.add\("ifo-pre"\)\)/, "only content below the fold is hidden for reveal")
assert.ok(read("demo.tsx").includes("<IrisFolioTemplate />"), "default demo is the component, full bleed")
assert.doesNotMatch(read("demo.tsx"), /<div/, "default demo has no wrapper")
assert.match(read("demo-dusk.tsx"), /palette="dusk"/, "the dusk demo reprints the page for someone else")

/* ---------- logic, executed ---------- */

const code = region("logic") + region("glyphs") + "\nexport { PALETTES, PALETTE_KEYS, ROMAN, SCRIPT, clamp, mulberry32, hashString, catmull, spiral, ribbon, heartLeaf, petalShape, crescent, sparklePath, letterKinds, layoutWord, parseEmphasis, disciplinesOf, filterProjects, spanFor, pad2, nextIndex, easeOutCubic, isEmail, paletteVars }\n"
const L = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(code)))

// the house rhythm of the reference: P o R T F O L i O
assert.deepEqual(L.letterKinds("PORTFOLIO"), ["script", "small", "roman", "roman", "script", "roman", "roman", "small", "roman"])
assert.deepEqual(L.letterKinds("WORKS"), ["script", "small", "roman", "roman", "roman"])
assert.deepEqual(L.letterKinds("SAY HELLO"), ["script", "small", "roman", "space", "script", "roman", "roman", "roman", "small"], "every word swashes, vowels alternate across the title")
assert.deepEqual(L.letterKinds("Works"), ["script", "small", "small", "small", "small"], "lowercase input is taken as typed")
assert.deepEqual(L.letterKinds("Say Hello"), ["script", "small", "small", "space", "script", "small", "small", "small", "small"])
assert.deepEqual(L.letterKinds("A-1"), ["script", "other", "other"])

for (const t of [L.ROMAN, L.SCRIPT]) for (const [ch, g] of Object.entries(t)) {
  assert.equal(g.length, 6, `${ch} has metrics and a path`)
  assert.ok(g[0] > 0 && g[2] >= g[1], `${ch} has a sane box`)
  if (ch.trim()) assert.match(g[5], /^M-?\d/, `${ch} path starts with a move`)
}
for (const c of "ABCDEFGHIJKLMNOPQRSTUVWXYZ") {
  assert.ok(L.ROMAN[c] && L.ROMAN[c.toLowerCase()] && L.SCRIPT[c], `${c} exists in every cut`)
}

const lay = L.layoutWord("PORTFOLIO")
assert.equal(lay.glyphs.length, 9)
assert.ok(lay.x1 > lay.x0 && lay.y1 > lay.y0, "the word has ink")
for (let i = 1; i < lay.glyphs.length; i++) assert.ok(lay.glyphs[i].x > lay.glyphs[i - 1].x, "letters advance left to right")
assert.ok(lay.glyphs[1].y < 0 && lay.glyphs[1].kind === "small", "small letters ride above the baseline")
assert.ok(lay.glyphs[0].s > 1, "script capitals are set larger")
const wide = L.layoutWord("PORTFOLIO PORTFOLIO")
assert.ok(wide.x1 - wide.x0 > (lay.x1 - lay.x0) * 2, "a space opens the word")
assert.equal(L.layoutWord("").glyphs.length, 0)
assert.equal(L.layoutWord("你好").glyphs.length, 0, "unknown characters are skipped, never thrown on")

const a = L.mulberry32(42)
const b = L.mulberry32(42)
assert.deepEqual([a(), a(), a()], [b(), b(), b()], "seeded PRNG is deterministic, so server and client draw the same garden")
assert.equal(L.hashString("iris"), L.hashString("iris"))

const pts = L.catmull([[0, 0], [10, 0], [20, 10]], 4)
assert.equal(pts.length, 9)
assert.deepEqual(pts[0], [0, 0])
assert.deepEqual(pts.at(-1), [20, 10], "the spline ends on its last point")
const sp = L.spiral(0, 0, 10, 0, 0, 1, 8)
assert.equal(sp.length, 9)
assert.ok(Math.abs(sp[0][0] - 10) < 1e-9 && Math.abs(sp.at(-1)[0]) < 1e-9, "the spiral winds in to its centre")
const rb = L.ribbon([[0, 0], [100, 0]], 10, 2)
assert.match(rb, /^M.*Z$/, "ribbons are closed shapes")
assert.equal(L.ribbon([[0, 0]], 1, 1), "")

const leaf = L.heartLeaf(100, 80)
assert.match(leaf.a, /^M0 0C.* 0 -100Z$/, "each half runs from the notch to the tip")
const nums = (d) => d.match(/-?\d+(\.\d+)?/g).map(Number)
assert.deepEqual(nums(leaf.b).map((v, i) => (i % 2 ? v : -v || 0)), nums(leaf.a).map((v) => v || 0), "the halves mirror")
assert.match(L.petalShape(50, 20, 0.2).o, /^M0 0C.*Z$/)
assert.match(L.crescent(0, 0, 10, 1), /^M0 -10A10 10 0 1 0 0 10A5 10 0 1 1 0 -10Z$/)
assert.match(L.sparklePath(0, 0, 5), /^M0 -5Q/)

assert.deepEqual(L.parseEmphasis("a *b* c"), [{ text: "a ", em: false }, { text: "b", em: true }, { text: " c", em: false }])
assert.deepEqual(L.parseEmphasis("2 * 3"), [{ text: "2 * 3", em: false }], "a lone asterisk stays literal")
assert.deepEqual(L.parseEmphasis(""), [])

const P = [
  { title: "a", year: 1, discipline: "Branding", summary: "" },
  { title: "b", year: 1, discipline: "Graphic", summary: "" },
  { title: "c", year: 1, discipline: "Branding", summary: "" },
  { title: "d", year: 1, discipline: "", summary: "" },
]
assert.deepEqual(L.disciplinesOf(P), ["Branding", "Graphic"], "disciplines keep first-seen order, skip blanks")
assert.equal(L.filterProjects(P, null).length, 4)
assert.deepEqual(L.filterProjects(P, "Branding").map((p) => p.title), ["a", "c"])

assert.equal(L.spanFor(0, 1), 12, "a lone card fills the row")
for (const n of [2, 3, 5, 7, 8, 12]) {
  // every full row adds up to the 12-column grid
  let row = 0
  for (let i = 0; i < n; i++) {
    row += L.spanFor(i, n)
    assert.ok(row <= 12, `row overflows at ${i} of ${n}`)
    if (row === 12) row = 0
  }
  assert.ok(row === 0 || n % 7 !== 0, `rows close for ${n}`)
}

assert.equal(L.pad2(3), "03")
assert.equal(L.pad2(12), "12")
assert.equal(L.nextIndex(0, "ArrowRight", 3), 1)
assert.equal(L.nextIndex(2, "ArrowRight", 3), 0, "wraps forward")
assert.equal(L.nextIndex(0, "ArrowLeft", 3), 2, "wraps back")
assert.equal(L.nextIndex(1, "Home", 3), 0)
assert.equal(L.nextIndex(1, "End", 3), 2)
assert.equal(L.nextIndex(1, "a", 3), null)
assert.equal(L.nextIndex(0, "ArrowRight", 0), null)
assert.equal(L.easeOutCubic(0), 0)
assert.equal(L.easeOutCubic(2), 1, "clamped")
assert.ok(L.isEmail("ruoxi@example.com") && !L.isEmail("a@b"))

assert.equal(L.paletteVars("dusk")["--ifo-pi"], L.PALETTES.dusk.ink)
assert.equal(L.paletteVars("nope")["--ifo-pi"], L.PALETTES.morning.ink, "unknown palettes fall back to morning")
assert.equal(L.paletteVars("sakura", "#000")["--ifo-pi"], "#000", "ink overrides the palette")
assert.equal(L.paletteVars("sakura", undefined, "#fff")["--ifo-pp"], "#fff", "and so does paper")
for (const k of L.PALETTE_KEYS) for (const v of Object.values(L.PALETTES[k]).slice(1)) assert.match(v, /^#[0-9a-f]{6}$/)

console.log("iris-folio-template: ok")
