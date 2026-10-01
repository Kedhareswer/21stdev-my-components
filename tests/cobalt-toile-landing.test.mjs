// Install-safety and logic checks for components/cobalt-toile-landing.
// Run: node tests/cobalt-toile-landing.test.mjs
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const SLUG = "cobalt-toile-landing"
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
assert.doesNotMatch(src, /@import|@font-face|<link\b|<img\b|fetch\(|new Image\(/, "nothing loads at runtime")
assert.doesNotMatch(src, /https?:\/\//, "no external URLs — every illustration is drawn in the file")
assert.ok(src.includes('height = "100svh"'), "height defaults to a definite length")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")
assert.match(src, /React\.useId\(\)\.replace/, "svg ids are namespaced per instance")
assert.doesNotMatch(src, /url\(#[a-z]/, "pattern and clip references are built from the instance id")
assert.doesNotMatch(src, /use(State|Ref|Memo|Callback|Context)<|Record<|Array<|Promise<|Partial</, "no <generics> for the 21st CLI tokenizer to choke on")
assert.ok(src.includes("prefers-reduced-motion:reduce"), "honours reduced motion in CSS")
assert.match(src, /matchMedia\("\(prefers-reduced-motion: reduce\)"\)/, "and in JS (parallax, counters, boat)")

const css = src.match(/const CTL_CSS = `([\s\S]*?)`/)
assert.ok(css, "CSS block present")
assert.doesNotMatch(css[1], /\$\{|`/, "no interpolation inside the CSS string")
assert.doesNotMatch(css[1], /url\(/, "no url() in the style block")
for (const m of css[1].replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/(?<=^|[{}])\s*([^{}@]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (/^(from|to|[\d.,%\s]+)$/.test(sel)) continue
  for (const s of sel.split(/,(?![^(]*\))/)) assert.match(s.trim(), /^(\.dark )?\.ctl-/, `selector escapes the component: ${s.trim()}`)
}
assert.match(css[1], /\.ctl-svg\{[^}]*max-width:none/, "svgs are guarded against Preflight")
assert.match(css[1], /\.ctl-root :where\(button,input\)\{/, "the reset has no specificity to fight")
assert.match(css[1], /\.ctl-root\{[^}]*overflow-x:clip/, "the root clips sideways without breaking the sticky nav")
assert.doesNotMatch(css[1], /\.ctl-root\{[^}]*overflow:hidden/, "overflow:hidden on the root would break the sticky nav")
assert.match(css[1], /\.dark \.ctl-root\[data-theme="auto"\]/, "auto theme follows a host .dark class")
assert.match(css[1], /\.ctl-stage\{--ctl-sh:clamp\(/, "hero height is a definite clamp, not a percentage")
assert.match(css[1], /\.ctl-cover\{[^}]*width:calc\(var\(--ctl-sh\) \* 1\.6667\)/, "hero art is sized from the stage height, so the arch is never cropped")

/* ---------- it behaves like a landing page ---------- */

for (const k of ["about", "solutions", "services", "insights", "contact"]) assert.ok(src.includes(`data-sec="${k}"`), `section ${k} is addressable`)
assert.match(src, /scrollIntoView\(\{ behavior: reduced \? "auto" : "smooth"/, "in-page links scroll, instantly under reduced motion")
assert.match(src, /role="tablist"/, "bookmarks are a tab list")
assert.match(src, /nextTab\(i, e\.key, items\.length\)/, "arrow keys move between bookmarks")
assert.match(src, /aria-expanded=\{on\}/, "ledger rows announce their state")
assert.match(src, /aria-label=\{"Moon, " \+ MOON_NAMES\[phase\]/, "moons are labelled buttons")
assert.match(src, /if \(e\.key === "Escape"\) setOpen\(null\)/, "Escape closes a toile note")
assert.match(src, /isEmail\(email\)/, "newsletter validates before sealing")
assert.match(src, /<animateMotion /, "the boat drifts")
assert.match(src, /reduced \? \(\s*<g transform="translate\(780 330\)/, "and stays moored under reduced motion")
assert.match(src, /below\.forEach\(\(n\) => n\.classList\.add\("ctl-pre"\)\)/, "only content below the fold is hidden for reveal")
assert.ok(read("demo.tsx").includes("<CobaltToileLanding />"), "default demo is the component, full bleed")
assert.doesNotMatch(read("demo.tsx"), /<div/, "default demo has no wrapper")
assert.match(read("demo-indigo.tsx"), /palette="indigo"/, "the indigo demo reprints the page")

/* ---------- logic, executed ---------- */

const code = region("logic") + "\nexport { PALETTES, MOON_STEPS, MOON_NAMES, clamp, mulberry32, hashString, leafPath, leafCluster, rosette, scatterStars, sparklePath, toRoman, parseEmphasis, isEmail, easeOutCubic, formatCount, categoriesOf, filterPress, wordmark, paletteColors, nextTab }\n"
const L = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(code)))

const a = L.mulberry32(42)
const b = L.mulberry32(42)
const seq = [a(), a(), a()]
assert.deepEqual(seq, [b(), b(), b()], "seeded PRNG is deterministic, so server and client draw the same garden")
assert.ok(seq.every((v) => v >= 0 && v < 1))
assert.notDeepEqual(seq, [L.mulberry32(43)(), 0, 0])

const leaf = L.leafPath(10, 20, 0, 30, 10)
assert.match(leaf.o, /^M10 20C.*Z$/, "leaf outline starts at its base")
assert.ok(leaf.o.includes("40 20"), "leaf tip lies along its angle")
assert.match(leaf.s, /^M10 20L40 20C/, "shade half begins with the midrib")

const bush = L.leafCluster(7, 100, 100, 50, 30, 60, 12)
assert.equal(bush.length, 60)
assert.deepEqual(bush, L.leafCluster(7, 100, 100, 50, 30, 60, 12), "clusters are reproducible")
for (const l of bush) {
  const [x, y] = l.o.slice(1).split("C")[0].split(" ").map(Number)
  assert.ok(Math.abs(x - 100) <= 50.1 && Math.abs(y - 100) <= 30.1, "every leaf grows inside its ellipse")
}
assert.equal(L.rosette(0, 0, 10, 7, 0).length, 7, "one petal per count")

const stars = L.scatterStars(1, 120, -300, 0, 1800, 500)
assert.equal(stars.length, 120)
assert.ok(stars.every((s) => s.x >= -300 && s.x <= 1500 && s.y >= 0 && s.y <= 500 && s.r > 0), "stars stay in their sky")
assert.ok(stars.some((s) => s.sparkle) && stars.some((s) => !s.sparkle), "a few stars sparkle")
assert.match(L.sparklePath(0, 0, 5), /^M0 -5Q0 0 5 0/)

assert.equal(L.toRoman(1), "I")
assert.equal(L.toRoman(4), "IV")
assert.equal(L.toRoman(9), "IX")
assert.equal(L.toRoman(14), "XIV")
assert.equal(L.toRoman(1912), "MCMXII")
assert.equal(L.toRoman(0), "")

assert.deepEqual(L.parseEmphasis("a *b* c"), [{ text: "a ", em: false }, { text: "b", em: true }, { text: " c", em: false }])
assert.deepEqual(L.parseEmphasis("*all*"), [{ text: "all", em: true }])
assert.deepEqual(L.parseEmphasis("2 * 3"), [{ text: "2 * 3", em: false }], "a lone asterisk stays literal")
assert.deepEqual(L.parseEmphasis(""), [])

assert.ok(L.isEmail("ada@example.com"))
assert.ok(L.isEmail("  a.b+c@mail.co.uk "))
for (const bad of ["", "nope", "a@b", "a@b.c", "a b@c.de", "@c.de"]) assert.ok(!L.isEmail(bad), `rejects ${JSON.stringify(bad)}`)

assert.equal(L.easeOutCubic(0), 0)
assert.equal(L.easeOutCubic(1), 1)
assert.equal(L.easeOutCubic(2), 1, "clamped")
assert.ok(L.easeOutCubic(0.5) > 0.5, "eases out")
assert.equal(L.formatCount(640.4), "640")
assert.equal(L.formatCount(12000), "12,000")

const P = [
  { title: "a", source: "X", date: "", category: "News" },
  { title: "b", source: "X", date: "", category: "Opinion" },
  { title: "c", source: "X", date: "", category: "News" },
  { title: "d", source: "X", date: "" },
]
assert.deepEqual(L.categoriesOf(P), ["News", "Opinion"], "categories keep first-seen order, skip blanks")
assert.equal(L.filterPress(P, null).length, 4)
assert.deepEqual(L.filterPress(P, "News").map((p) => p.title), ["a", "c"])

assert.deepEqual(L.wordmark("Rostrum"), { mono: "R", top: "", bottom: "" })
assert.deepEqual(L.wordmark("Food Digital"), { mono: "", top: "FOOD", bottom: "DIGITAL" })
assert.deepEqual(L.wordmark("The Ledger Review"), { mono: "", top: "LEDGER", bottom: "REVIEW" }, "a leading 'The' is dropped")
assert.deepEqual(L.wordmark("The Times"), { mono: "", top: "THE", bottom: "TIMES" }, "but not when it is half the name")
assert.equal(L.wordmark("  ").mono, "?")

assert.deepEqual(L.paletteColors("indigo"), { ink: L.PALETTES.indigo.ink, paper: L.PALETTES.indigo.paper })
assert.deepEqual(L.paletteColors("nope"), { ink: L.PALETTES.cobalt.ink, paper: L.PALETTES.cobalt.paper }, "unknown palettes fall back to cobalt")
assert.deepEqual(L.paletteColors("delft", "#000", ""), { ink: "#000", paper: L.PALETTES.delft.paper }, "ink and paper override one at a time")
for (const k of Object.keys(L.PALETTES)) assert.match(L.PALETTES[k].ink, /^#[0-9a-f]{6}$/)

assert.equal(L.nextTab(0, "ArrowRight", 4), 1)
assert.equal(L.nextTab(3, "ArrowRight", 4), 0, "wraps forward")
assert.equal(L.nextTab(0, "ArrowLeft", 4), 3, "wraps back")
assert.equal(L.nextTab(2, "Home", 4), 0)
assert.equal(L.nextTab(1, "End", 4), 3)
assert.equal(L.nextTab(1, "a", 4), null)
assert.equal(L.nextTab(0, "ArrowRight", 0), null)

assert.equal(L.MOON_STEPS.length, L.MOON_NAMES.length, "every phase has a name")
assert.ok(L.MOON_STEPS.every((v, i) => i === 0 || v > L.MOON_STEPS[i - 1]), "phases wax in order")
assert.ok(L.MOON_STEPS.at(-1) > 2, "the last phase slides the shadow fully clear: a full moon")
assert.equal(L.hashString("x"), L.hashString("x"))
assert.equal(L.clamp(5, 0, 1), 1)

console.log("cobalt-toile-landing: ok")
