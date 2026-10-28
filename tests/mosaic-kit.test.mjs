// Install-safety and logic checks for the six pieces split out of mosaic-prompt-template.
// Run: node tests/mosaic-kit.test.mjs
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const KIT = {
  "mosaic-shader-background": { prefix: "msb", imports: ["react"] },
  "pixel-headline": { prefix: "pxh", imports: ["react", "gsap"] },
  "prompt-composer": { prefix: "ppc", imports: ["react", "gsap"] },
  "glass-feature-grid": { prefix: "gfg", imports: ["react", "gsap"] },
  "glass-pricing-cards": { prefix: "gpc", imports: ["react", "gsap"] },
  "pixel-wordmark-footer": { prefix: "pwf", imports: ["react", "gsap"] },
}

const read = (slug, file) => readFileSync(new URL(`../components/${slug}/${file}`, import.meta.url), "utf8").replace(/\r\n/g, "\n")
const region = (src, name) => {
  const a = src.indexOf(`// #region ${name}\n`)
  const b = src.indexOf(`// #endregion ${name}\n`)
  assert.ok(a > -1 && b > a, `region ${name} missing`)
  return src.slice(a, b)
}
const load = async (code) => import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(code)))
const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"))

for (const [slug, { prefix, imports }] of Object.entries(KIT)) {
  const src = read(slug, `${slug}.tsx`)
  const at = (msg) => `${slug}: ${msg}`

  const found = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
  assert.deepEqual(found, imports, at("only the expected imports"))
  for (const dep of imports.filter((d) => d !== "react")) assert.ok(pkg.dependencies[dep], at(`${dep} is declared at the root`))
  assert.doesNotMatch(src, /@import|@font-face|<link\b|fetch\(|<img\b/, at("no fonts, fetches or pictures"))
  assert.doesNotMatch(src, /https?:\/\/(?!www\.w3\.org)/, at("nothing remote"))
  assert.doesNotMatch(src, /\bh-full\b/, at("no h-full"))
  assert.doesNotMatch(src, /[—–]/, at("no em or en dashes"))
  const head = src.slice(0, src.indexOf("</"))
  assert.doesNotMatch(head, /use(State|Ref|Memo|Callback)<|Partial<|Required<|Record<|Array<|Map<|Set<|Promise<|NonNullable<|React\.[A-Za-z]+<|\[K in /, at("no generics before the first JSX close tag (21st CLI tokenizer)"))
  assert.doesNotMatch(src, /use(State|Ref|Memo|Callback)</, at("hooks are typed without <generics>"))
  assert.match(src, /matchMedia\("\(prefers-reduced-motion: reduce\)"\)/, at("reduced motion is read in JS"))
  assert.match(src, /^export default function [A-Z]\w+\(/m, at("one default export"))

  const css = src.match(/const [A-Z]+_CSS = `([\s\S]*?)`/)
  assert.ok(css, at("CSS block present"))
  assert.doesNotMatch(css[1], /\$\{|`|url\(/, at("no interpolation or url() in the CSS"))
  for (const m of css[1].replace(/@media[^{]*\{/g, "").replace(/@keyframes[^{]*\{/g, "").matchAll(/(?<=^|[{}])\s*([^{}@]+?)\s*\{/g)) {
    const sel = m[1].trim()
    if (/^(from|to|[\d.,%\s]+)$/.test(sel)) continue
    for (const s of sel.split(/,(?![^(]*\))/)) assert.match(s.trim(), new RegExp(`^\\.${prefix}-`), at(`selector escapes the component: ${s.trim()}`))
  }
  assert.match(css[1], new RegExp(`\\.${prefix}-root :where\\((svg|canvas)\\)\\{display:block;max-width:none\\}`), at("media guarded against Preflight"))
  assert.match(css[1], /@media \(prefers-reduced-motion:reduce\)\{/, at("reduced motion in CSS too"))
  for (const m of css[1].matchAll(/([.\w>*\s,:()-]+)\{[^}]*\bheight:100%/g)) assert.match(m[0], /position:absolute|inset:0/, at(`percentage height only on absolute layers: ${m[1].trim()}`))

  if (imports.includes("gsap")) {
    assert.match(src, /gsap\.(context|timeline|to|fromTo)\(/, at("uses gsap"))
    if (/gsap\.context\(/.test(src)) assert.match(src, /ctx\.revert\(\)/, at("gsap context reverted on unmount"))
  }

  const demo = read(slug, "demo.tsx")
  assert.match(demo, new RegExp(`from "@/components/ui/${slug}"`), at("demo imports the installed path"))
  assert.doesNotMatch(demo, /h-full|https?:\/\//, at("demo is install-safe and self-contained"))
  const readme = read(slug, "README.md")
  assert.match(readme, new RegExp(`import \\w+ from "@/components/ui/${slug}"`), at("README shows the import"))
}

/* ---------- per-piece behaviour ---------- */

const msb = read("mosaic-shader-background", "mosaic-shader-background.tsx")
assert.match(msb, /const canvas = document\.createElement\("canvas"\)/, "msb: fresh canvas per mount")
assert.match(msb, /loseContext\(\)/, "msb: context released on unmount")
assert.match(msb, /root\.dataset\.sky = "fallback"/, "msb: CSS fallback without WebGL")
assert.match(msb, /new IntersectionObserver\(/, "msb: paused off screen")
assert.match(msb, /\.msb-root\{[^}]*height:var\(--msb-h\)/, "msb: definite height")
assert.match(msb, /height = "100svh"/, "msb: height defaults to a definite length")
for (const fn of ["vec3 mosaic(", "vec3 prism(", "vec3 waves("]) assert.ok(msb.includes(fn), `msb: shader scene ${fn}`)
const R = await load(region(msb, "retile"))
assert.equal(R.retileEase(0), 0)
assert.equal(R.retileEase(1), 1)
assert.equal(R.retileEase(5), 1, "msb: ease clamps past the end")
assert.ok(R.retileEase(0.5) > 0.5, "msb: ease front-loads the change")
assert.equal(R.mixAt(0, 2, 0, 1), 0)
assert.equal(R.mixAt(0, 2, 1, 1), 2)
assert.equal(R.mixAt(2, 0, 9, 1), 0, "msb: settles on the target")
assert.equal(R.mixAt(0, 1, 0.3, 0), 1, "msb: zero duration jumps")

const pxh = read("pixel-headline", "pixel-headline.tsx")
assert.match(pxh, /<span className="pxh-sr">\{lines\.join\("\. "\)\}<\/span>/, "pxh: real text for screen readers")
assert.match(pxh, /gsap\.to\(p\.el, \{ attr: \{ x: p\.x \+ nx \* k/, "pxh: repel moves pixels by attribute")
assert.match(pxh, /removeEventListener\("pointermove", onMove\)/, "pxh: pointer listener cleaned up")
const P = await load(region(pxh, "pixel-font") + "\nexport { GLYPHS }\n")
for (const [ch, g] of Object.entries(P.GLYPHS)) {
  const rows = g.split("/")
  assert.ok(rows.length >= 7 && rows.length <= 8, `glyph ${ch} is 7 or 8 rows`)
  assert.ok(rows.every((r) => r.length === rows[0].length), `glyph ${ch} rows are even`)
}
assert.equal(P.layoutPixels("I").width, 3)
assert.equal(P.layoutPixels("II").width, 7, "one blank column between glyphs")
assert.equal(P.layoutPixels("I~I").width, 10, "unknown characters become a space")

for (const slug of ["glass-feature-grid", "glass-pricing-cards", "pixel-wordmark-footer"]) {
  const L = await load(region(read(slug, `${slug}.tsx`), "pixel-font") + "\nexport { GLYPHS }\n")
  for (const ch of "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789") assert.ok(L.GLYPHS[ch], `${slug}: glyph ${ch}`)
  assert.equal(L.layoutPixels("I I").width, 10, `${slug}: spaces are three columns`)
}

const ppc = read("prompt-composer", "prompt-composer.tsx")
assert.match(ppc, /e\.key === "Enter" && !e\.shiftKey && !e\.nativeEvent\.isComposing/, "ppc: Enter sends, Shift+Enter breaks, IME left alone")
assert.match(ppc, /role="radiogroup" aria-label="What are you building\?"/, "ppc: chips are a radio group")
assert.match(ppc, /aria-haspopup="menu"/, "ppc: model picker is a menu button")
assert.match(ppc, /role="menuitemradio"/, "ppc: with radio items")
assert.match(ppc, /if \(e\.key === "Escape"\)/, "ppc: menu closes on Escape")
assert.match(ppc, /type="file"\n\s+multiple/, "ppc: real file input")
assert.match(ppc, /role="status" aria-live="polite"/, "ppc: build log is announced")
assert.match(ppc, /onSubmit\?\.\(\{ prompt: text/, "ppc: prompt handed to onSubmit")
assert.match(ppc, /React\.useId\(\)\.replace/, "ppc: ids namespaced per instance")
const N = await load(region(ppc, "app-name"))
assert.equal(N.appNameFrom("A habit tracker with streaks and gentle reminders"), "Habit Tracker")
assert.equal(N.appNameFrom("Build me a booking app for a small yoga studio"), "Booking Yoga")
assert.equal(N.appNameFrom("the a an"), "Untitled")

const gfg = read("glass-feature-grid", "glass-feature-grid.tsx")
assert.match(gfg, /<span className="gfg-sr">\{title\}<\/span>/, "gfg: pixel title has real text")
assert.match(gfg, /aria-labelledby=\{uid \+ "-title"\}/, "gfg: section is labelled by its title")

const gpc = read("glass-pricing-cards", "glass-pricing-cards.tsx")
assert.match(gpc, /role="group" aria-label="Billing cycle"/, "gpc: billing switch is a labelled group")
assert.match(gpc, /aria-pressed=\{yearly\}/, "gpc: with pressed state")
assert.match(gpc, /onPlanSelect\?\.\(p, yearly\)/, "gpc: plan buttons report the plan and cycle")
const M = await load(region(gpc, "money"))
assert.equal(M.money(1234.4, "$"), "$1,234")
assert.equal(M.discounted(24, 0.2), 19)
assert.equal(M.discounted(64, 0.2), 51)
assert.equal(M.discounted(0, 0.2), 0)

const pwf = read("pixel-wordmark-footer", "pixel-wordmark-footer.tsx")
assert.match(pwf, /<span className="pwf-sr">\{brand\}\. <\/span>/, "pwf: brand readable by screen readers")
assert.match(pwf, /io\.disconnect\(\)/, "pwf: observer cleaned up")
assert.match(pwf, /aria-label="Footer"/, "pwf: links are a labelled nav")

console.log("mosaic kit: ok")
