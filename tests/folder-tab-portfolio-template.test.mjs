// Install-safety and logic checks for components/folder-tab-portfolio-template.
// Run: node tests/folder-tab-portfolio-template.test.mjs
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const SLUG = "folder-tab-portfolio-template"
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
assert.ok(src.includes('height = "100svh"'), "height defaults to a definite length")
assert.match(src, /minHeight: height/, "the height prop reaches the root")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")
// The only 100% heights allowed fill an absolutely positioned layer, whose
// containing block (an aspect-ratio frame) is always definite.
for (const m of src.matchAll(/[^{}]*\{[^}]*height:100%[^}]*\}/g))
  assert.match(m[0], /position:absolute;inset:0;width:100%;height:100%/, "percentage heights only on absolute layers: " + m[0].trim())
assert.match(src, /React\.useId\(\)/, "svg ids are namespaced per instance")
assert.doesNotMatch(src, /url\(#[a-z]/, "svg references are built from the instance id")
for (const m of src.matchAll(/<img [^>]*>/g)) {
  assert.match(m[0], /style=\{\{ maxWidth: "none" \}\}/, "custom images are guarded against Preflight")
  assert.match(m[0], /width=\{\d+\} height=\{\d+\}/, "custom images have explicit size")
}
assert.doesNotMatch(src, /location\.hash|history\.(push|replace)State/, "pages stay internal; the host's URL is untouched")

const css = src.match(/const FTP_CSS = `([\s\S]*?)`/)
assert.ok(css, "CSS block present")
assert.doesNotMatch(css[1], /\$\{|`/, "no interpolation inside the CSS string")
assert.doesNotMatch(css[1], /url\(/, "no url() in the style block")
assert.ok(css[1].includes("prefers-reduced-motion:reduce"), "honours reduced motion")
assert.match(css[1], /\.ftp-draw\{stroke-dasharray:none;stroke-dashoffset:0\}/, "reduced motion shows the type fully drawn")
assert.match(css[1], /\.ftp-rv\{opacity:1;transform:none\}/, "reduced motion never leaves a sheet hidden")
const bare = css[1].replace(/\/\*[\s\S]*?\*\//g, "").replace(/@media[^{]*\{/g, "")
for (const m of bare.matchAll(/(?<=^|[{}])\s*([^{}@]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (/^(from|to|[\d.,%\s]+)$/.test(sel)) continue
  for (const s of sel.split(/,(?![^(]*\))/)) assert.match(s.trim(), /^[a-z]*\.ftp-/, `selector escapes the component: ${s.trim()}`)
}
assert.match(css[1], /\.ftp-root :where\(button\)\{/, "base resets carry no specificity, so component classes win")
assert.match(css[1], /\.ftp-root :where\(svg\)\{display:block;max-width:none/, "svg guarded against Preflight")
assert.match(css[1], /\.ftp-root\{[^}]*overflow-x:clip/, "clip, not hidden, so the sticky nav keeps working")

/* ---------- the interactions are wired ---------- */

assert.match(src, /role="tablist"/, "folder tabs are a tablist")
assert.match(src, /e\.key === "ArrowRight"[\s\S]*e\.key === "Home"[\s\S]*e\.key === "End"/, "tabs move with arrows, Home and End")
assert.match(src, /tabIndex=\{on \? 0 : -1\}/, "roving tabindex on the tabs")
assert.match(src, /role="dialog"\s+aria-modal="true"/, "the details sheet is a modal dialog")
assert.match(src, /e\.key === "Escape"\) closeProject\(\)/, "Esc closes the details sheet")
assert.match(src, /lastFocus\.current\?\.focus/, "focus returns to the card that opened it")
assert.match(src, /aria-expanded=\{open\}/, "catalogue bands are disclosures")
assert.match(src, /aria-current=\{current === s\.id \? "true" : undefined\}/, "the nav marks the current sheet")
assert.match(src, /data-theme=\{theme\}/, "the theme is scoped to the root")
assert.match(src, /classList\.contains\("dark"\)/, "system theme follows the host's .dark class")
assert.match(src, /typeof IntersectionObserver !== "function"[\s\S]*?dataset\.in = "true"/, "without an observer every sheet is shown")
assert.ok(read("demo.tsx").includes("<FolderTabPortfolioTemplate />"), "default demo is the component, full bleed")
assert.doesNotMatch(read("demo.tsx"), /<div/, "default demo has no wrapper")

/* ---------- type, signature and art helpers, executed ---------- */

const code = region("type") + region("sign") + region("art") +
  "\nexport { GLYPHS, layoutText, splitSubpaths, hashString, rng, signaturePath, frondPath, initialsOf, pad2, markOf }\n"
const E = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(code)))

for (const c of "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789") assert.ok(E.GLYPHS[c], `glyph ${c} exists`)
for (const [c, g] of Object.entries(E.GLYPHS)) {
  assert.match(g.d, /^M/, `glyph ${c} starts with a move`)
  assert.doesNotMatch(g.d, /NaN|undefined/, `glyph ${c} is well formed`)
}

const lig = E.layoutText("Portfolio", 20, true)
assert.deepEqual(lig.items.map((i) => i.ch), ["P", "O", "R", "T", "F", "O", "L", "I", "O"], "Portfolio has no OO pair")
const cat = E.layoutText("catalogs", 20, true)
assert.deepEqual(cat.items.map((i) => i.ch), ["C", "A", "T", "A", "L", "O", "G", "S"], "lower case is set in capitals")
const oo = E.layoutText("BOOK", 20, true)
assert.deepEqual(oo.items.map((i) => i.ch), ["B", "OO", "K"], "OO joins into one pill")
assert.deepEqual(E.layoutText("BOOK", 20, false).items.map((i) => i.ch), ["B", "O", "O", "K"], "ligatures can be turned off")
assert.ok(oo.items[1].x < oo.items[2].x, "glyphs advance left to right")

const a = E.layoutText("AB", 10, true)
assert.equal(a.width, 120 + 10 + 99, "width is advances plus tracking, without a trailing gap")
assert.equal(E.layoutText("", 10, true).width, 0)
const unk = E.layoutText("A€B", 10, true)
assert.deepEqual(unk.items.map((i) => i.ch), ["A", "B"], "unknown characters never throw")
assert.ok(unk.items[1].x > a.items[1].x, "an unknown character leaves a gap")

assert.deepEqual(E.splitSubpaths("M0 0 V100 M110 0 V100"), ["M0 0 V100", "M110 0 V100"])

assert.equal(E.hashString("Aoi"), E.hashString("Aoi"), "art is stable")
assert.notEqual(E.hashString("Aoi"), E.hashString("Aoj"))
const r = E.rng(42)
const xs = Array.from({ length: 200 }, r)
assert.ok(xs.every((x) => x >= 0 && x < 1), "rng stays in [0, 1)")
assert.deepEqual(Array.from({ length: 5 }, E.rng(42)), xs.slice(0, 5), "rng is seeded")

const s1 = E.signaturePath("Aoi Lin")
assert.equal(s1.d, E.signaturePath("Aoi Lin").d, "a signature is stable per name")
assert.notEqual(s1.d, E.signaturePath("Noor").d, "different names sign differently")
assert.match(s1.d, /^M0 /, "one continuous stroke")
assert.equal((s1.d.match(/M/g) || []).length, 1, "never lifts the pen")
assert.doesNotMatch(s1.d, /NaN/)
assert.ok(s1.width > 40)
assert.doesNotMatch(E.signaturePath("").d, /NaN/, "an empty name still signs")
assert.doesNotMatch(E.signaturePath("林葵").d, /NaN/, "a name with no Latin letters still signs")

const frond = E.frondPath(7)
assert.ok(frond.length > 500 && !/NaN/.test(frond), "the palm frond is drawn")
assert.equal(frond, E.frondPath(7))

assert.equal(E.initialsOf("Aoi Lin"), "AL")
assert.equal(E.initialsOf("  noor  "), "N")
assert.equal(E.pad2(3), "03")
assert.equal(E.pad2(12), "12")
assert.equal(E.markOf({ title: "Glass sneaker render" }), "GLASS")
assert.equal(E.markOf({ title: "x", mark: "50%" }), "50%")
assert.equal(E.markOf({ title: "Extraordinarily long" }), "EXTRAO", "marks stay short")

console.log("folder-tab-portfolio-template: ok")
