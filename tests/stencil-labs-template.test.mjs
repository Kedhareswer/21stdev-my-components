// Install-safety and logic checks for components/stencil-labs-template.
// Run: node tests/stencil-labs-template.test.mjs
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const SLUG = "stencil-labs-template"
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
assert.doesNotMatch(src, /https?:\/\//, "no external URLs")
assert.ok(src.includes('height = "100svh"'), "height defaults to a definite length")
assert.match(src, /minHeight: height/, "the height prop reaches the root")
assert.doesNotMatch(src, /\bh-full\b|height:100%;?\}?\s*$/m, "no percentage height on the root")
assert.doesNotMatch(src, /use(State|Ref|Memo|Callback|Effect)</, "hooks are typed without <generics>, so the 21st CLI tokenizer stays linear")
assert.doesNotMatch(src, /(Pointer|Mouse|Keyboard|Form|Change)Event</, "events are typed without <generics>")
assert.doesNotMatch(src, /location\.hash|history\.(push|replace)State/, "the host's URL is untouched")
assert.match(src, /if \(!href\.startsWith\("#"\)\) return\n\s+e\.preventDefault\(\)/, "in-page anchors scroll inside the template")

const css = src.match(/const SL_CSS = `([\s\S]*?)`/)
assert.ok(css, "CSS block present")
assert.doesNotMatch(css[1], /\$\{|`/, "no interpolation inside the CSS string")
assert.doesNotMatch(css[1], /url\(/, "no url() in the style block")
assert.ok(css[1].includes("prefers-reduced-motion:reduce"), "honours reduced motion")
let rules = 0
for (const m of css[1].replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/(?<=^|[{}])\s*([^{}@]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (/^(from|to|[\d.,%\s]+)$/.test(sel)) continue
  rules++
  for (const s of sel.split(/,(?![^(]*\))/)) assert.match(s.trim(), /^\.sl-/, `selector escapes the component: ${s.trim()}`)
}
assert.ok(rules > 50, `scope check saw ${rules} rules`)
assert.match(css[1], /\.sl-root :where\(button\)\{/, "base resets carry no specificity")
assert.match(css[1], /\.sl-root :where\(svg,canvas,img\)\{display:block;max-width:none\}/, "media guarded against Preflight")
assert.match(css[1], /\.sl-frame\{[^}]*container-type:inline-size/, "the grid lays out from its own width")
assert.match(css[1], /\.sl-nav \.sl-drawer\{display:none\}/, "the mobile drawer outranks the nav cell's display")
assert.match(css[1], /\.sl-q>span:nth-child\(2\)\{flex:1\}/, "only the question text stretches, not the toggle")
assert.match(css[1], /\.sl-news-c\{padding:0\}\n\.sl-vp\{overflow:hidden\}/, "the pager can hang outside the frame")

/* ---------- WebGL is guarded ---------- */

assert.match(src, /getContext\("webgl2"/, "clay renders in WebGL2")
assert.match(src, /if \(!clay\) \{\n\s+canvas\.remove\(\)\n\s+setFailed\(true\)/, "no WebGL2 → the drawn fallback")
assert.match(src, /const canvas = document\.createElement\("canvas"\)\n\s+host\.appendChild\(canvas\)/, "a fresh canvas per effect run (StrictMode loses the first context)")
assert.match(src, /clay\.lose\(\)\n\s+canvas\.remove\(\)/, "contexts are released on unmount")
assert.match(src, /new IntersectionObserver\(\(\[e\]\) => \{\n\s+visible = e\.isIntersecting/, "the render loop sleeps offscreen")
assert.match(src, /data-ready=\{loaded === url\}/, "cover readiness tracks the loaded URL, not an effect-reset flag")
const frag = src.match(/const CLAY_FRAG = `([\s\S]*?)`/)
assert.ok(frag && !frag[1].includes("${"), "shader has no interpolation")

/* ---------- the interactions are wired ---------- */

assert.match(src, /aria-expanded=\{isOpen\}/, "FAQ questions are disclosure buttons")
assert.match(src, /role="region" aria-labelledby=/, "answers are labelled regions")
assert.match(src, /onClick=\{\(\) => setOpen\(\(o\) => toggleOpen\(o, i, faqMultiple\)\)\}/, "FAQ respects single/multiple")
assert.match(src, /aria-label="Previous posts"/, "carousel has a previous button")
assert.match(src, /aria-label="Next posts"/, "carousel has a next button")
assert.match(src, /if \(onSubscribe\) await onSubscribe\(email\.trim\(\)\)/, "subscribe hands over the email")
assert.match(src, /setPointerCapture/, "clay objects can be dragged")
assert.match(src, /data-theme=\{theme\}/, "the theme is scoped to the root")
assert.match(src, /classList\.contains\("dark"\)/, "system theme follows the host's .dark class")
assert.ok(read("demo.tsx").includes("<StencilLabsTemplate />"), "default demo is the component, full bleed")
assert.doesNotMatch(read("demo.tsx"), /<div/, "default demo has no wrapper")

/* ---------- logic, executed ---------- */

const L = await import(
  "data:text/javascript," +
    encodeURIComponent(
      stripTypeScriptTypes(region("logic")) +
        "\nexport { clamp, isEmail, countValue, pad2, initials, hexToRgb, carouselMax, stepIndex, toggleOpen, GLYPHS, layoutText, stencilize, strokePath, portraitDots }\n",
    )
)

assert.ok(L.isEmail("a@b.co") && !L.isEmail("a@b") && !L.isEmail("a b@c.co"))
assert.equal(L.countValue(64, 0), 0)
assert.equal(L.countValue(64, 1), 64)
assert.equal(L.pad2(4), "04")
assert.equal(L.pad2(12), "12")
assert.equal(L.initials("Ines Okoro"), "IO")
assert.equal(L.initials("Ana de la Cruz"), "AC")
assert.equal(L.initials("Prince"), "P")
assert.deepEqual(L.hexToRgb("#ff0000"), [1, 0, 0])
assert.deepEqual(L.hexToRgb("#0f0"), [0, 1, 0])
assert.deepEqual(L.hexToRgb("tomato", [0.5, 0.5, 0.5]), [0.5, 0.5, 0.5], "non-hex falls back")

assert.equal(L.carouselMax(4, 2), 2)
assert.equal(L.carouselMax(1, 2), 0)
assert.equal(L.stepIndex(2, 1, 4, 2), 0, "wraps forward")
assert.equal(L.stepIndex(0, -1, 4, 2), 2, "wraps back")
assert.equal(L.stepIndex(0, 1, 2, 2), 0, "nothing to step")

assert.deepEqual(L.toggleOpen([4], 4, false), [])
assert.deepEqual(L.toggleOpen([4], 1, false), [1], "single mode closes the other")
assert.deepEqual(L.toggleOpen([4], 1, true), [1, 4], "multiple mode keeps both")

// every glyph parses to finite points inside its box
for (const [ch, g] of Object.entries(L.GLYPHS)) {
  for (const pl of g.split("|")) {
    const pts = pl.trim().split(/\s+/).map((p) => p.split(",").map(Number))
    assert.ok(pts.length >= 2, `glyph ${ch} has a degenerate stroke`)
    for (const [x, y] of pts) assert.ok(x >= 0 && x <= 4 && y >= 0 && y <= 7, `glyph ${ch} leaves its box: ${x},${y}`)
  }
}
for (const ch of "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789") assert.ok(L.GLYPHS[ch], `missing glyph ${ch}`)

const one = L.layoutText("L")
assert.equal(one.width, 4)
assert.equal(L.layoutText("LL", 1).width, 9, "advance = width + tracking")
assert.equal(L.layoutText("a b", 1, 2).width, 4 + 1 + 2 + 1 + 4, "spaces and lowercase")

// L: the corner cuts — the stem stops short, the base keeps the corner
const Ls = L.stencilize(L.layoutText("L").lines, 1, 0.3)
assert.equal(Ls.length, 2)
assert.deepEqual(Ls[0].pts, [[0, 0], [0, 5.2]], "stem stops half + gap before the corner")
assert.deepEqual(Ls[1].pts, [[-0.5, 6], [4, 6]], "base reaches back over the corner")

// E: the middle bar is pulled off the stem
const Es = L.stencilize(L.layoutText("E").lines, 1, 0.3)
const bar = Es.find((s) => s.pts[0][1] === 3)
assert.deepEqual(bar.pts[0], [0.8, 3])

// O has no sharp corner, so it stays one closed loop
const Os = L.stencilize(L.layoutText("O").lines, 1, 0.3)
assert.equal(Os.length, 1)
assert.ok(Os[0].closed)
assert.match(L.strokePath(Os[0]), /^M1 0L.*Z$/)

// B: where two strokes meet end to end only the later one yields
const Bs = L.stencilize(L.layoutText("B").lines, 1, 0.3)
const top = Bs[0].pts[0]
assert.deepEqual(top, [-0.5, 0], "the earlier stroke keeps the shared corner")

const dots = L.portraitDots("Ines Okoro", 18, 22)
assert.equal(dots.length, 18 * 22)
assert.ok(dots.every((d) => d >= 0 && d <= 1))
assert.deepEqual(dots, L.portraitDots("Ines Okoro", 18, 22), "same name, same portrait")
assert.notDeepEqual(dots, L.portraitDots("Theo Brandt", 18, 22), "different names differ")
assert.ok(dots[9 * 18 + 9] > dots[1 * 18 + 1], "the head is darker than the corner")

console.log("stencil-labs-template: ok")
