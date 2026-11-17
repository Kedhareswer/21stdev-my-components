// Runnable check for components/jewelcase-folio-template: the paper helpers (lifted from the component), the
// pictures it asks for, the content rules and the install-safety rules.
// Run: node tests/jewelcase-folio-template.test.mjs
//
// What breaks silently here: a CSS selector that leaks out of .jf-root, a picture that was never put in dev/public,
// ransom letters that differ between server and client (hydration noise), or copy that names the reference.
import assert from "node:assert/strict"
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs"
import { liftRegion } from "./_component-safety.mjs"

const slug = "jewelcase-folio-template"
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

assert.match(demo, /from "@\/components\/ui\/jewelcase-folio-template"/, "demo imports the installed path")
assert.match(src, /height = "100svh"/, "height defaults to a definite length")
assert.match(src, /style=\{\{ minHeight: height \}\}/, "the hero takes the height prop")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")
assert.doesNotMatch(src + demo, /use(Ref|State|Memo|Callback|Reducer|Context)</, "no generic hook type arguments (they hang the 21st CLI)")
assert.doesNotMatch(src, /getBoundingClientRect|offset(Top|Left|Width|Height)|client(Width|Height)|scrollHeight|getComputedStyle/, "no layout reads")
assert.match(src, /prefers-reduced-motion: reduce/, "reduced motion is read at runtime")

const cssAt = src.indexOf("const CSS =")
const css = src.slice(cssAt)
assert.doesNotMatch(css, /`|\$\{|@import/, "no backticks, ${ or @import in the CSS string")
assert.match(css, /@media \(prefers-reduced-motion:reduce\)\{[^]*\.jf-rv\{opacity:1/, "reduced motion shows every reveal at once")
assert.match(css, /\.jf-root img\{max-width:none/, "images override Preflight's max-width")
const flat = css
  .replace(/^const CSS =\s*\n\s*FONTS \+\n/, "")
  .split("\n")
  .map((l) => l.trim().replace(/^"|"\s*\+?$|\s*\+$/g, "").replace(/^\/\*.*\*\/$/, ""))
  .join("")
let rules = 0
for (const m of flat.matchAll(/(?<=^|[{}])\s*([^{}]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (sel.startsWith("@") || /^(from|to|\d+%)$/.test(sel)) continue
  rules++
  assert.ok(sel.split(",").every((x) => x.trim().startsWith(".jf-")), "unscoped selector: " + sel)
}
assert.ok(rules > 120, "the scope check saw the real rules: " + rules)
for (const [, v] of src.matchAll(/var\((--[a-z0-9-]+)/g)) assert.ok(["--ink", "--ink2", "--paper", "--paper-ink", "--paper-mute", "--cream", "--pink", "--tape", "--i"].includes(v), "own tokens only: " + v)
const fams = [...src.matchAll(/font-family:(Jf[A-Za-z]+);font-style:normal/g)].map((m) => m[1])
assert.deepEqual([...new Set(fams)].sort(), ["JfBlack", "JfCond", "JfMarker", "JfSans", "JfScript", "JfSerif"], "every face is embedded")
for (const f of new Set(css.match(/font-family:Jf[A-Za-z]+/g))) assert.ok(fams.includes(f.slice(12)), "uses only embedded faces: " + f)

// ---- pictures -------------------------------------------------------------
const pics = JSON.parse(src.match(/export const PICTURES = (\[[^]*?\])/)[1].replace(/,\s*\]/, "]"))
const used = new Set([...src.matchAll(/\sn=\{?"([a-z0-9-]+)"/g)].map((m) => m[1]).filter((n) => !n.endsWith("-")))
for (const m of src.matchAll(/n=\{"([a-z-]+-)" \+ i\}/g)) for (const p of pics) if (p.startsWith(m[1])) used.add(p)
for (const m of src.matchAll(/pics=\{(\[[^\]]+\])\}/g)) for (const p of JSON.parse(m[1])) used.add(p)
for (const u of used) assert.ok(pics.includes(u), "listed in PICTURES: " + u)
for (const p of pics) {
  assert.ok(used.has(p), "PICTURES lists only what the page shows: " + p)
  assert.ok(existsSync(new URL("../dev/public/" + slug + "/" + p + ".webp", import.meta.url)), "dev/public has " + p + ".webp")
}
assert.match(src, /const ASSETS = "https:\/\/kedhar-components\.pages\.dev\/jewelcase-folio-template\/"/, "pictures come from the component site")
for (const m of ["cover.png", "thumb.webp"]) assert.ok(existsSync(new URL("../media/" + slug + "/" + m, import.meta.url)), "media/" + m)

// ---- the paper helpers ----------------------------------------------------
const { hash, rng, ransom, torn, tapeClip, KINDS } = await liftRegion(src, "paper")
assert.equal(hash("PORTFOLIO"), hash("PORTFOLIO"), "hash is stable")
const r1 = rng(7), r2 = rng(7)
for (let i = 0; i < 20; i++) {
  const a = r1()
  assert.equal(a, r2(), "rng is deterministic")
  assert.ok(a >= 0 && a < 1, "rng stays in [0, 1)")
}
const word = ransom("PORTFOLIO", "hero")
assert.deepEqual(ransom("PORTFOLIO", "hero"), word, "the same word always gets the same letters (no hydration mismatch)")
assert.equal(word.map((l) => l.ch).join(""), "PORTFOLIO", "letters keep their order")
for (let i = 1; i < word.length; i++) assert.notEqual(word[i].kind, word[i - 1].kind, "neighbours never share a face")
for (const l of word) {
  assert.ok(KINDS.includes(l.kind))
  assert.ok(Math.abs(l.rot) <= 5 && Math.abs(l.dy) <= 0.06 && l.size >= 0.88 && l.size <= 1.12, "tilt, lift and size stay small")
}
assert.ok(new Set(word.map((l) => l.kind)).size >= 3, "a word mixes at least three faces")
const two = ransom("THANK YOU", "end")
assert.equal(two[5].kind, "sp", "spaces stay spaces")
const top = torn("x", "top"), bottom = torn("x", "bottom")
assert.match(top, /^polygon\(0% [\d.]+px,.*,100% 100%,0% 100%\)$/, "a top edge is straight along the bottom")
assert.match(bottom, /^polygon\(0% 0%,100% 0%,100% calc\(100% - [\d.]+px\),.*0% calc\(100% - [\d.]+px\)\)$/, "a bottom edge is straight along the top")
for (const [, j] of top.matchAll(/% ([\d.]+)px/g)) assert.ok(+j <= 14, "jitter stays inside amp")
assert.equal(tapeClip("Client 1"), tapeClip("Client 1"), "tape ends are stable")

// ---- content rules --------------------------------------------------------
assert.match(src, /kedhareswer\.12110626@gmail\.com/, "his contact email")
for (const c of ["Client 1", "Client 2", "Client 3"]) assert.ok(src.includes(c), "placeholder " + c)
assert.match(src, /Kedhar's/, "the hero names him")
const banned = /karyl|kyl's|mendoza|olfato|shaqu|chitza|florana|michella|mosaic media|robinsons|faith fidelis|laguna|framer/i
assert.doesNotMatch(src + readme, banned, "no names or brands from the reference")
assert.match(readme, /height/, "README documents the height prop")

console.log("jewelcase-folio-template: ok (" + rules + " scoped rules, " + pics.length + " pictures, " + statSync(file).size + " bytes)")
