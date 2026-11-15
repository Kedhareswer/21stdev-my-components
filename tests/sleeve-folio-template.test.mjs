// Runnable check for components/sleeve-folio-template: the measured springs, the hero tilt and
// column drift mappings, the copy rules, and the install-safety rules.
// Run: node tests/sleeve-folio-template.test.mjs
import assert from "node:assert/strict"
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs"
import { liftRegion } from "./_component-safety.mjs"

const slug = "sleeve-folio-template"
const dir = new URL("../components/" + slug + "/", import.meta.url)
const file = new URL(slug + ".tsx", dir)
const src = readFileSync(file, "utf8").replace(/\r\n/g, "\n")
const demo = readFileSync(new URL("demo.tsx", dir), "utf8")

// ---- install safety -------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "react is the only import")
assert.deepEqual(readdirSync(dir).sort(), ["README.md", "demo.tsx", slug + ".tsx"].sort(), "folder holds only the publishable files")
assert.ok(statSync(file).size < 200_000, "under 21st's 200 kB component limit: " + statSync(file).size)
const ts = readFileSync(new URL("../tsconfig.json", import.meta.url), "utf8")
assert.ok(ts.includes('"@/components/ui/' + slug + '": ["./components/' + slug + "/" + slug + '.tsx"]'), "tsconfig paths line")
const templates = JSON.parse(readFileSync(new URL("../scripts/templates.json", import.meta.url), "utf8"))
assert.ok(!templates.templates.some((t) => t.slug === slug), "sold on 21st: no free source zip")
assert.match(demo, /from "@\/components\/ui\/sleeve-folio-template"/, "demo imports the installed path")

assert.match(src, /height = "100svh"/, "height defaults to a definite length")
assert.match(src, /\{ \.\.\.style, height \}/, "the root takes the height")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")
assert.doesNotMatch(src + demo, /use(Ref|State|Memo|Callback|Reducer|Context)</, "no generic hook type arguments (they hang the 21st CLI)")
assert.doesNotMatch(src, /var\(--color-/, "assumes no host tokens")
const urls = [...new Set([...(src + demo).matchAll(/https?:\/\/[^"'\s)]+/g)].map((m) => m[0]))]
assert.deepEqual(urls, ["https://kedhar-components.pages.dev/sleeve-folio-template/"], "the only URL is the asset base")
assert.match(src, /prefers-reduced-motion: reduce/, "reduced motion is read at runtime")
assert.ok((src.match(/maxWidth: "none"/g) || []).length >= 4, "every picture opts out of Preflight's max-width")

// every picture and font the file asks for exists in dev/public/<slug>/
const pub = new URL("../dev/public/" + slug + "/", import.meta.url)
const names = new Set()
for (const [, n] of src.matchAll(/\["(h-[a-z]+)",/g)) names.add(n)
const sleeves = src.match(/const WORK = \[([^\]]+)\]/)[1].split(",").length
for (let i = 1; i <= sleeves; i++) names.add("w" + i)
for (const [, n] of src.matchAll(/img\("([a-z0-9-]+)"\)/g)) names.add(n)
assert.equal(names.size, 9 + 11 + 2, "9 hero pieces, 11 projects, 2 about pictures: " + [...names])
for (const n of names) assert.ok(existsSync(new URL(n + ".webp", pub)), "picture on the site: " + n)
for (const f of ["serif.woff2", "sans.woff2"]) assert.ok(existsSync(new URL(f, pub)), "font on the site: " + f)

// ---- the CSS string ------------------------------------------------------
const cssAt = src.indexOf("const CSS =")
const cssSrc = src.slice(cssAt, src.indexOf("\n\n", cssAt))
assert.doesNotMatch(cssSrc, /`|\$\{|@import/, "no backticks, ${ or @import in the CSS string")
const fontSrc = src.slice(src.indexOf("function fontCss"), src.indexOf("const CSS ="))
assert.doesNotMatch(fontSrc, /`|\$\{|@import/, "nor in the font CSS")
const css = [...cssSrc.matchAll(/"((?:[^"\\]|\\.)*)"/g)].map((m) => m[1]).join("")
assert.match(css, /\.slv-root\{[^}]*width:100%/, "the root fills its flex parent's width")
assert.match(css, /@media \(prefers-reduced-motion:reduce\)\{\.slv-root \*,\.slv-root \*::before,\.slv-root \*::after\{animation:none!important/, "CSS stops every animation under reduced motion")
assert.match(css, /\.slv-root img,\.slv-root svg\{max-width:none\}/, "guards Preflight's img/svg max-width")
assert.match(css, /@media \(hover:hover\) and \(pointer:fine\)\{\.slv-proj\[data-in\]:hover/, "sleeve hover only under a fine pointer")
assert.match(css, /@media \(hover:hover\) and \(pointer:fine\)\{\.slv-panel a:hover span\{transform:translateY\(-70px\) scale\(1\.1\)/, "panel lift only under a fine pointer")
let rules = 0
for (const m of css.matchAll(/(?<=^|[{}])\s*([^{}]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (sel.startsWith("@") || /^(from|to|\d|50%)/.test(sel)) continue
  rules++
  assert.ok(sel.replace(/:where\([^)]*\)/g, ":where()").split(",").every((x) => /^(\.slv-|\[data-in\])/.test(x.trim())), "unscoped selector: " + sel)
}
assert.ok(rules >= 80, "the scope check saw real rules, saw " + rules)

// measured motion constants
assert.match(css, /animation:slv-settle 4s cubic-bezier\(0,\.95,\.2,\.96\)/, "hero settles over 4s on the measured curve")
assert.match(css, /from\{transform:translateY\(70px\) rotateX\(-60deg\) scale\(1\.5\)\}/, "from a steep 60deg tilt at 1.5x")
assert.match(css, /\.slv-rise\{opacity:0;transform:translateY\(40px\)/, "text rises 40px")
assert.match(css, /\.slv-word\{display:inline-block;opacity:0;transform:translateY\(50px\)/, "title words rise 50px")
assert.match(css, /\.slv-wrap\{width:min\(1240px,/, "a 1240px column, as measured")
assert.match(css, /\.slv-h1\{[^}]*font-size:95px;line-height:104\.5px;letter-spacing:-3\.8px/, "display type as measured")
assert.match(css, /@media \(max-width:809px\)\{/, "phone layout under 810px")
assert.match(css, /\.slv-proj\[data-in\]:hover \.slv-box\{transform:rotate\(-5deg\) skewY\(5deg\)\}/, "the sleeve flips its slant on hover")
assert.match(css, /translateY\(180px\) rotateX\(-50deg\)/, "cards fold up from -50deg")
assert.match(css, /\.slv-thumb\{[^}]*transform:translateY\(300px\);transform-origin:100% 50%/, "sleeve photos wait 300px down, pivot on the right edge")
assert.match(css, /\.slv-proj\[data-in\] \.slv-thumb\{transform:rotate\(-5deg\)\}/, "and come out tilted -5deg")
assert.match(css, /transform:translateY\(120px\) rotateX\(-60deg\) rotateY\(70deg\)/, "panels deal from below")
assert.match(css, /rotateX\(-30deg\) rotateY\(50deg\)/, "and stand at -30 / 50")
assert.match(css, /translateY\(-70px\) scale\(1\.1\)/, "and lift 70px at 1.1x on hover")

// ---- copy rules ------------------------------------------------------------
const text = src + demo
for (const bad of [/framer/i, /campione/i, /oversight/i, /\bluna\b/i, /florent/i]) assert.doesNotMatch(text, bad, "no trace of the reference: " + bad)
assert.match(src, /kedhareswer\.12110626@gmail\.com/, "contact is Kedhar's email")
assert.match(src, /\{"Client " \+ q\.n\}/, "testimonials are Client N")
assert.equal((src.match(/\{ n: \d+, text:/g) || []).length, 10, "ten quotes")
assert.match(src, /"Project " \+ String\(i \+ 1\)\.padStart\(2, "0"\)/, "work is Project 01..11")

// ---- logic -------------------------------------------------------------------
const m = await liftRegion(src, "springs")
for (const [k, s] of Object.entries(m.SPRINGS)) {
  assert.ok(Math.abs(m.springAt(s.w, s.z, s.dur) - 1) < 0.01, k + " has settled by its duration")
  assert.equal(m.springAt(s.w, s.z, 0), 0, k + " starts at 0")
  const ease = src.match(new RegExp("\\n  " + k + ': "linear\\(([^)]*)\\)"'))
  assert.ok(ease, "easing for " + k)
  const pts = ease[1].split(",").map(Number)
  const mid = Math.floor(pts.length / 2)
  assert.ok(Math.abs(pts[mid] - m.springAt(s.w, s.z, (s.dur * mid) / (pts.length - 1))) < 0.002, k + " linear() matches the spring")
}
assert.ok(m.springAt(13.8, 0.6, 0.3) > 1.08, "the sleeve spring overshoots ~9%")
assert.ok(m.springAt(10.6, 0.9, 0.6) < 1.002, "the soft spring barely overshoots")
const top = m.heroTilt(0, false)
assert.ok(top.rx === 0 && top.ty === 0, "no tilt at the top")
const half = m.heroTilt(203.5, false)
assert.ok(Math.abs(half.rx + 20) < 1e-9 && Math.abs(half.ty - 75) < 1e-9, "half way at 203.5px")
assert.ok(Math.abs(m.heroTilt(100, false).rx + 9.828) < 0.001, "-9.828deg at 100px, as measured")
assert.deepEqual(m.heroTilt(5000, false), { rx: -40, ty: 150 }, "caps at -40deg / 150px")
assert.deepEqual(m.heroTilt(5000, true), { rx: -10, ty: 10 }, "the phone layout only leans 10deg")
assert.match(src, /\}, 185\)/, "reveals start a beat after entering, like the reference")
assert.deepEqual(m.DRIFT, [-70, -200, -400], "three column speeds")
assert.equal(m.driftAt(-400, 0), -400)
assert.ok(Math.abs(m.driftAt(-400, 745)) < 1e-9, "every column passes 0 together")
assert.ok(Math.abs(m.driftAt(-70, 100) - -60.6) < 0.01, "col 1 moves 0.094px per px, as measured")
assert.equal(m.driftAt(-200, -50), -200, "no drift before the section arrives")

console.log("sleeve-folio-template: ok")
