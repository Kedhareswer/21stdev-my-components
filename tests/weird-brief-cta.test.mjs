// Runnable check for components/weird-brief-cta: the magnetic pull (outer + inner, as the Bunkum
// template's footer), the fan's lightbox cycling, and the install-safety rules.
// Run: node tests/weird-brief-cta.test.mjs
//
// What breaks silently here: a magnet that also fires for touch or reduced motion, a lightbox
// that steps off the end of the fan, or a picture the fan references but the file doesn't embed.
import assert from "node:assert/strict"
import { readFileSync, readdirSync, statSync } from "node:fs"
import { liftRegion } from "./_component-safety.mjs"

const slug = "weird-brief-cta"
const dir = new URL("../components/" + slug + "/", import.meta.url)
const file = new URL(slug + ".tsx", dir)
const src = readFileSync(file, "utf8").replace(/\r\n/g, "\n")
const demo = readFileSync(new URL("demo.tsx", dir), "utf8")

// ---- install safety -------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "react is the only import")
assert.deepEqual(readdirSync(dir).sort(), ["README.md", "demo.tsx", slug + ".tsx"].sort(), "folder holds only the publishable files")
assert.ok(statSync(file).size < 250_000, "only the pictures it shows are embedded: " + statSync(file).size)
assert.ok(Buffer.byteLength(demo) < 200_000, "demo under 21st's 200 kB limit")
assert.match(demo, /from "@\/components\/ui\/weird-brief-cta"/, "demo imports the installed path")

const imgKeys = [...src.matchAll(/^  "([a-z]\d)": "data:image\/webp;base64,/gm)].map((m) => m[1]).sort()
assert.deepEqual(imgKeys, ["a3", "b5", "b7", "s2"], "the three fan cards and the aubergine sticker, nothing else")
for (const [, k] of src.matchAll(/\["([a-z]\d)", "/g)) assert.ok(imgKeys.includes(k), "fan picture is embedded: " + k)
assert.match(src, /IMG\.s2/, "the sticker rides the fan")
assert.equal((src.match(/@font-face\{font-family:Bkm(Sans|Mono)/g) || []).length, 3, "Sans 400 (lightbox buttons), Sans 700 and Mono")

assert.match(src, /height = "480px"/, "height defaults to a definite length")
assert.match(src, /minHeight: minHeight \|\| height/, "and is applied as a minimum, so long copy can grow the section")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")
assert.doesNotMatch(src + demo, /use(Ref|State|Memo|Callback|Reducer|Context)</, "no generic hook type arguments (they hang the 21st CLI)")
assert.doesNotMatch(src, /var\(--color-/, "assumes no host tokens")
const urls = [...(src + demo).matchAll(/https?:\/\/[^"'\s)]+/g)].map((m) => m[0]).filter((u) => !u.startsWith("http://www.w3.org/"))
assert.deepEqual(urls, [], "fetches nothing: pictures and fonts are embedded")

// motion and pointer gates, read at runtime
assert.match(src, /prefers-reduced-motion: reduce/, "reduced motion is read at runtime")
assert.match(src, /\(hover: hover\) and \(pointer: fine\)/, "fine-pointer gate is read at runtime")
assert.match(src, /ev\.pointerType !== "mouse"\) return/, "touch never drives the label or the magnets")
assert.match(src, /const mag = st\.fine && !st\.still && /, "magnets only for a fine pointer without reduced motion")
assert.equal((src.match(/getBoundingClientRect/g) || []).length, 1, "layout is read once, when a magnet is entered")
assert.match(src, /navigator\.clipboard\.writeText\(email\)/, "the ghost pill copies the address")
assert.match(src, /data-magnet="" data-cursor="Copy" onClick=\{copyEmail\}/, "the copy pill is magnetic and labelled")
assert.match(src, /"data-magnet": "", "data-cursor": cursor/, "and so is the commission pill")

const cssAt = src.indexOf("const CSS =")
const css = src.slice(cssAt, src.indexOf("\n\n", cssAt)).replace(/"\s*\+\s*\n\s*(\/\*[^*]*\*\/\s*\n\s*)?"/g, "")
assert.doesNotMatch(css, /`|\$\{|@import/, "no backticks, ${ or @import in the CSS string")
assert.match(css, /@media \(prefers-reduced-motion:reduce\)\{\.bkm-root \*\{animation:none!important;transition-duration:\.01ms!important/, "CSS honours reduced motion")
assert.match(css, /@media \(hover:hover\) and \(pointer:fine\)\{\.bkm-cursor\{display:block\}\}/, "the context label only exists where a mouse can hover")
assert.match(css, /\.bkm-cursor\{display:none/, "and is hidden everywhere else")
assert.match(css, /\.bkm-root svg,\.bkm-root img\{max-width:none\}/, "guards Preflight's img/svg max-width")
let rules = 0
for (const m of css.replace(/^const CSS =\s*"/, "").matchAll(/(?<=^|[{}"])\s*([^{}"]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (sel.startsWith("@") || /^(from|to|\d)/.test(sel)) continue
  rules++
  assert.ok(sel.split(",").every((x) => /^(\.dark )?\.bkm-/.test(x.trim())), "unscoped selector: " + sel)
}
assert.ok(rules >= 30, "the scope check saw real rules, saw " + rules)

// the template's exact values
for (const v of [
  ".bkm-big{margin:0;font-weight:800;font-size:clamp(54px,10.5vw,190px);line-height:.84;letter-spacing:-.06em",
  ".bkm-pill{position:relative;display:flex;align-items:center;height:48px",
  "transition:transform .55s cubic-bezier(.2,1.6,.4,1)",
  ".bkm-pill[data-near]{transition:transform .1s linear}",
  ".bkm-cta[data-near]>span{transition:transform .1s linear}",
  "transition:transform .7s cubic-bezier(.2,1.5,.4,1)",
  ".bkm-fan:hover i:nth-child(1),.bkm-fan:focus-visible i:nth-child(1){transform:translate(-46%,10%) rotate(-17deg)}",
  ".bkm-fan:hover img{transform:rotate(-4deg) translate(10%,-24%)}",
  ".bkm-toast{position:fixed;left:50%;bottom:24px",
  "background-size:37px 41px,53px 47px,113px 97px",
  "--blue:#2731e8;--deep:#0d137a;--butter:#ffe98a;--ink:#0c0c10;--paper:#f6f1e3",
]) assert.ok(css.includes(v), "kept from the template: " + v)

// ---- the magnet -----------------------------------------------------------
const M = await liftRegion(src, "magnet")
assert.deepEqual([...M.PULL], [0.22, 0.32])
assert.deepEqual([...M.PULL_INNER], [0.12, 0.16])
assert.equal(M.magnetTransform(100, -50, M.PULL), "translate(22.0px,-16.0px)")
assert.equal(M.magnetTransform(100, -50, M.PULL_INNER), "translate(12.0px,-8.0px)")
assert.equal(M.magnetTransform(0, 0, M.PULL), "translate(0.0px,0.0px)")
assert.equal(M.step(2, 1, 3), 0, "next wraps to the first card")
assert.equal(M.step(0, -1, 3), 2, "previous wraps to the last")
assert.equal(M.step(0, 1, 0), 0, "never NaN")

console.log("weird-brief-cta: ok")
