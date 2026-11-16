// Runnable check for components/himal-journeys-template: the coverflow's spring and curve, the content rules
// and the install-safety rules.
// Run: node tests/himal-journeys-template.test.mjs
//
// What breaks silently here: a CSS selector that leaks out of .hj-root, a picture the component asks for that was
// never put in dev/public, a coverflow card that jumps when it wraps round, or copy that names the reference.
import assert from "node:assert/strict"
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs"
import { liftRegion } from "./_component-safety.mjs"

const slug = "himal-journeys-template"
const dir = new URL("../components/" + slug + "/", import.meta.url)
const file = new URL(slug + ".tsx", dir)
const src = readFileSync(file, "utf8").replace(/\r\n/g, "\n")
const demo = readFileSync(new URL("demo.tsx", dir), "utf8")
const readme = readFileSync(new URL("README.md", dir), "utf8")

// ---- install safety -------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "react is the only import")
assert.deepEqual(readdirSync(dir).sort(), ["README.md", "demo.tsx", slug + ".tsx"].sort(), "folder holds only the publishable files")
assert.ok(statSync(file).size < 200_000, "under 21st's 200 kB component limit: " + statSync(file).size)
const ts = readFileSync(new URL("../tsconfig.json", import.meta.url), "utf8")
assert.ok(ts.includes('"@/components/ui/' + slug + '": ["./components/' + slug + "/" + slug + '.tsx"]'), "tsconfig paths line")
const tpl = JSON.parse(readFileSync(new URL("../scripts/templates.json", import.meta.url), "utf8"))
assert.equal(tpl.templates.filter((t) => t.slug === slug).length, 1, "listed once in scripts/templates.json")

assert.match(demo, /from "@\/components\/ui\/himal-journeys-template"/, "demo imports the installed path")
assert.match(src, /height = "100svh"/, "height defaults to a definite length")
assert.match(src, /style=\{\{ height \}\}/, "the hero takes the height prop")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")
assert.doesNotMatch(src + demo, /use(Ref|State|Memo|Callback|Reducer|Context)</, "no generic hook type arguments (they hang the 21st CLI)")
assert.doesNotMatch(src.replace(/var\(--(bg|ink|navy|mute|soft|line|card|dark|dark2|blue|sh|rd)\b/g, ""), /var\(--/, "assumes no host tokens")
const urls = [...(src + demo).matchAll(/https?:\/\/[^"'\s)]+/g)].map((m) => m[0])
assert.deepEqual([...new Set(urls)], ["https://kedhar-components.pages.dev/himal-journeys-template/"], "the only URL is the pictures' base; fonts are embedded")
assert.equal((src.match(/@font-face\{font-family:Hj(Sans|Serif)/g) || []).length, 2, "two embedded, renamed font subsets")
assert.match(src, /prefers-reduced-motion: reduce/, "reduced motion is read at runtime")

const cssAt = src.indexOf("const CSS =")
const css = src.slice(cssAt, src.indexOf("\n\n", cssAt)).replace(/"\s*\+\s*\n\s*(\/\/[^\n]*\n\s*)*"/g, "")
assert.doesNotMatch(css, /`|\$\{|@import/, "no backticks, ${ or @import in the CSS string")
assert.match(css, /@media \(prefers-reduced-motion:reduce\)\{/, "CSS honours reduced motion")
assert.match(css, /@media \(hover:hover\) and \(pointer:fine\)\{/, "hover effects only where a mouse can hover")
assert.match(css, /\.hj-root img\{max-width:none/, "guards Preflight's img max-width")
assert.match(css, /\.hj-root\{--bg:[^}]*width:100%;/, "the root claims the full width: 21st centres demos in a flex box")
assert.match(css, /\.dark \.hj-root\{--bg:/, "has a dark palette")
let rules = 0
for (const m of css.replace(/^const CSS =\s*"/, "").replace(/"\s*\+\s*(EASE|FONT_SANS|FONT_SERIF)\s*\+\s*"/g, "").matchAll(/(?<=^|[{}"])\s*([^{}"]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (sel.startsWith("@") || /^(from|to|\d)/.test(sel)) continue
  rules++
  assert.ok(sel.split(/,(?![^(]*\))/).every((x) => /^(\.dark )?\.hj-/.test(x.trim())), "unscoped selector: " + sel)
}
assert.ok(rules >= 150, "the scope check saw real rules, saw " + rules)
// a descendant `span` rule inside a stat would swallow the rolling counter's digit columns (it did once)
assert.doesNotMatch(css, /\.hj-stat span\{/, "stat label rule targets direct children only")

// every picture the component asks for exists locally (dev/public is what the site serves)
const keys = new Set(["hero", "trekker"])
for (const m of src.matchAll(/^\s+id: "(\w+)",$/gm)) keys.add(m[1])
assert.equal(keys.size, 7, "hero, five tours and the portrait")
for (const k of keys) {
  const f = new URL("../dev/public/" + slug + "/" + k + ".webp", import.meta.url)
  assert.ok(existsSync(f), "picture exists: " + k)
  assert.ok(statSync(f).size < 260_000, "picture stays light: " + k)
}
const served = readdirSync(new URL("../dev/public/" + slug + "/", import.meta.url))
assert.deepEqual(served.filter((f) => !keys.has(f.replace(/\.webp$/, ""))), [], "no leftover files in dev/public")

// ---- content rules ----------------------------------------------------------
const text = src.replace(/base64,[A-Za-z0-9+/=]+/g, "")
// the reference's brand, spelled backwards so this file doesn't carry it either
const banned = new RegExp([..."arolapen"].reverse().join(""), "i")
assert.doesNotMatch(text + demo + readme, banned, "nothing names the reference")
assert.match(text, /kedhareswer\.12110626@gmail\.com/, "contact is Kedhareswer's address")
assert.match(text, /Kedhareswer/, "copy is about Kedhareswer")
assert.equal((text.match(/^\s+id: "/gm) || []).length, 5, "five tours")

// ---- the coverflow's maths ----------------------------------------------------
const { springStep, loopOffset, cardPose } = await liftRegion(src, "spring", ["springStep", "loopOffset", "cardPose"])
// the spring settles on its target without running away
let x = 0, v = 0
for (let i = 0; i < 240; i++) [x, v] = springStep(x, v, 3, 1 / 60, 120, 21)
assert.ok(Math.abs(x - 3) < 1e-3 && Math.abs(v) < 1e-2, "spring settles: " + x)
// offsets wrap into [-n/2, n/2): the card two to the left of 0 sits at -2, not +3
assert.equal(loopOffset(3, 0, 5), -2)
assert.equal(loopOffset(2, 0, 5), 2)
assert.equal(loopOffset(0, 4.5, 5), 0.5)
for (let p = -7; p < 7; p += 0.37) for (let i = 0; i < 5; i++) {
  const d = loopOffset(i, p, 5)
  assert.ok(d >= -2.5 && d < 2.5, "offset in range " + d)
}
// the curve is symmetric, the centre card is biggest, and a card is invisible where it wraps round
const c = cardPose(0, 330, 260), r = cardPose(1, 330, 260), l = cardPose(-1, 330, 260), o = cardPose(2, 330, 260)
assert.equal(c.x, 0)
assert.equal(c.scale, 1)
assert.equal(r.x, -l.x)
assert.equal(r.rotate, -l.rotate)
assert.ok(c.scale > r.scale && r.scale > o.scale, "cards shrink away from the centre")
assert.equal(o.opacity, 1, "outer cards are visible at rest")
assert.equal(cardPose(2.45, 330, 260).opacity, 0, "a wrapping card is hidden before it jumps sides")

console.log("himal-journeys-template: ok (" + rules + " scoped rules)")
