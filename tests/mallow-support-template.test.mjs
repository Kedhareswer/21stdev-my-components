// Install-safety and logic checks for components/mallow-support-template.
// Run: node tests/mallow-support-template.test.mjs
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const SLUG = "mallow-support-template"
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
assert.doesNotMatch(src, /@import|@font-face|fetch\(|new Image\(/, "no fetches, no CSS imports")
assert.equal((src.match(/<link\b/g) || []).length, 1, "the one link is the optional faces")
for (const m of src.matchAll(/https?:\/\/[^"'`\s)]+/g)) assert.match(m[0], /^https:\/\/(images\.unsplash\.com\/photo-|fonts\.googleapis\.com\/css2)/, "only Unsplash photos and the faces are remote: " + m[0])
assert.match(src, /\{fontHref && <link rel="stylesheet" href=\{fontHref\} \/>\}/, "the faces are optional")
assert.ok(src.includes('height = "100svh"'), "height defaults to a definite length")
assert.match(src, /"--msp-h": height/, "the height prop reaches the root")
assert.match(src, /\.msp-root\{[^}]*min-height:var\(--msp-h\)/, "and sets its floor")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")
assert.doesNotMatch(src.slice(0, src.indexOf("</")), /use(State|Ref|Memo|Callback)<|Partial<|Record<|Array<|Map<|Set<|Promise<|React\.[A-Za-z]+<|\[K in /, "no generics before the JSX (21st CLI tokenizer)")
assert.doesNotMatch(src, /use(State|Ref|Memo|Callback)</, "hooks are typed without <generics>")
assert.match(src, /matchMedia\("\(prefers-reduced-motion: reduce\)"\)/, "reduced motion is read in JS (the wind, the autopilot, the typing)")
assert.doesNotMatch(src, /[—–]/, "no em or en dashes anywhere")
assert.doesNotMatch(src, />[^<{]*\\u[0-9a-f]{4}/i, "no \\u escapes inside JSX text (they print literally)")
assert.match(src, /<canvas ref=\{cv\} className="msp-canvas" style=\{\{ maxWidth: "none" \}\} \/>/, "the painting is guarded against Preflight")
assert.match(src, /onError=\{\(\) => setFailed\(true\)\}/, "a photo that can't load falls back to a painting")

const css = src.match(/const MSP_CSS = `([\s\S]*?)`/)
assert.ok(css, "CSS block present")
assert.doesNotMatch(css[1], /\$\{|`/, "no interpolation inside the CSS string")
assert.doesNotMatch(css[1], /url\(/, "no url() in the style block")
assert.ok(css[1].includes("prefers-reduced-motion:reduce"), "honours reduced motion in CSS")
for (const m of css[1].replace(/\/\*[\s\S]*?\*\//g, "").replace(/@media[^{]*\{/g, "").replace(/@keyframes[^{]*\{/g, "").matchAll(/(?<=^|[{}])\s*([^{}@]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (/^(from|to|[\d.,%\s]+)$/.test(sel)) continue
  for (const s of sel.split(/,(?![^(]*\))/)) assert.match(s.trim(), /^\.msp-/, `selector escapes the component: ${s.trim()}`)
}
assert.match(css[1], /\.msp-root :where\(svg,canvas,img\)\{display:block;max-width:none/, "media are guarded against Preflight")
assert.match(css[1], /\.msp-root\{[^}]*overflow-x:clip/, "the root clips sideways without breaking the sticky nav and story")
assert.doesNotMatch(css[1], /\.msp-root\{[^}]*overflow:hidden/, "overflow:hidden on the root would break sticky")
assert.match(css[1], /\.msp-root\[data-theme="dark"\]\{/, "a designed dark theme")
assert.match(css[1], /\.msp-paint\{position:absolute;inset:0/, "paintings fill a positioned parent")
assert.match(css[1], /\.msp-story-stage\{position:sticky;top:96px;height:min\(640px,calc\(100svh - 128px\)\)/, "the sticky stage has a definite height")
assert.match(css[1], /\.msp-hero-art\{position:relative;aspect-ratio:/, "the hero painting sizes itself, no percentage height")
assert.match(css[1], /\.msp-way-art\{position:relative;aspect-ratio:/, "so do the cards")

/* ---------- the painter ---------- */

assert.match(src, /function paintMeadow\(/, "the meadow is painted here")
assert.match(src, /const budget = 1500000/, "every painting holds to a pixel budget")
assert.match(src, /if \(p\.still\) \{\n\s+ctx\.drawImage\(L\.front, -p\.pad, 0\)/, "reduced motion draws one still frame")
assert.match(src, /if \(any && !document\.hidden\) rafId = requestAnimationFrame\(tick\)/, "the wind sleeps when nothing is on screen")
assert.match(src, /queue\.sort\(\(a, b\) => Number\(b\.visible\) - Number\(a\.visible\)\)/, "visible paintings paint first")
for (const k of ["hero", "resolve", "learn", "escalate", "smarter", "voice", "overnight", "platform", "pricing", "story", "cta"]) assert.match(src, new RegExp(`\\n  ${k}: \\{ seed: \\d+`), `scene ${k} is composed`)
for (const k of ["meadow", "lavender", "harvest"]) assert.match(src, new RegExp(`${k}: [A-Z]+`), `palette ${k} exists`)

/* ---------- it behaves like a product page ---------- */

for (const k of ["top", "ways", "features", "platform", "security", "pricing", "stories", "faq", "start"]) assert.ok(src.includes(`data-sec="${k}"`), `section ${k} is addressable`)
assert.match(src, /behavior: reduced \? "auto" : "smooth"/, "nav scrolls, instantly under reduced motion")
assert.match(src, /const running = live && auto && !reduced && tickets\.length > 1/, "the autopilot only runs on screen, switched on, without reduced motion")
assert.match(src, /role="listbox" aria-label="Tickets"/, "tickets are a listbox")
assert.match(src, /role="tablist" aria-label="Platform"/, "the tour is real tabs")
assert.match(src, /e\.key === "ArrowRight" \|\| e\.key === "ArrowLeft"/, "tabs move with the arrow keys")
assert.match(src, /onAnimationEnd=\{\(\) => auto && setTab\(\(tab \+ 1\) % tabs\.length\)\}/, "the progress bar is the timer, so pausing it pauses the tour")
assert.match(src, /if \(res === false\) ok = false/, "onGetStarted can refuse")
assert.match(src, /e\.key === "Escape"/, "Escape closes menus")
assert.match(src, /aria-expanded=\{on\}/, "questions are disclosures")
assert.ok(read("demo.tsx").includes("<MallowSupportTemplate />"), "default demo is the component, full bleed")
assert.doesNotMatch(read("demo.tsx"), /<div/, "default demo has no wrapper")
assert.match(read("demo-lavender.tsx"), /palette="lavender"/, "the second demo uses another palette")
assert.match(read("demo-lavender.tsx"), /brand="Larkspur"/, "and another product")

/* ---------- the logic ---------- */

const code = stripTypeScriptTypes(region("logic"))
const L = new Function(code + "\nreturn { rng, clamp, fill, fmt, tierPrice, tierFits, validEmail, initials, hueOf, voiced, sparkPath, VOICES, RANGES }")()

const a = L.rng(7)
const b = L.rng(7)
const seq = [a(), a(), a()]
assert.deepEqual(seq, [b(), b(), b()], "rng is deterministic")
assert.ok(seq.every((v) => v >= 0 && v < 1), "rng stays in [0, 1)")
assert.notEqual(L.rng(7)(), L.rng(8)(), "and seeds differ")

assert.equal(L.fill("Three ways {brand} runs {brand}", "Tern"), "Three ways Tern runs Tern")
assert.equal(L.fmt(1240), "1,240")
assert.equal(L.fmt(4.8, 1), "4.8")
assert.equal(L.fmt(1234567.891, 2), "1,234,567.89")
assert.equal(L.fmt(-2500), "-2,500")
assert.equal(L.clamp(5, 0, 3), 3)

const growth = { price: 49, included: 2000, per1000: 18 }
assert.equal(L.tierPrice(growth, 2000, false, 0.2), 49, "base price inside the allowance")
assert.equal(L.tierPrice(growth, 2001, false, 0.2), 67, "one extra block past it")
assert.equal(L.tierPrice(growth, 7500, false, 0.2), 157, "5,500 extra is six blocks")
assert.equal(L.tierPrice(growth, 7500, true, 0.2), 126, "yearly takes the discount")
assert.equal(L.tierPrice({ price: null }, 9000, true, 0.2), null, "custom stays custom")
assert.equal(L.tierPrice({ price: 0, included: 100 }, 5000, false, 0.2), 0, "free stays free")
assert.equal(L.tierFits({ price: 0, included: 100 }, 100), true)
assert.equal(L.tierFits({ price: 0, included: 100 }, 500), false, "starter stops at its allowance")
assert.equal(L.tierFits(growth, 20000), true, "growth scales")

assert.equal(L.validEmail("priya@fernhill.co"), true)
assert.equal(L.validEmail("  priya@fernhill.co "), true)
for (const bad of ["", "nope", "a@b", "a@b.c", "a b@c.de"]) assert.equal(L.validEmail(bad), false, bad)

assert.equal(L.initials("Maya Okafor"), "MO")
assert.equal(L.initials("Chloé van der Berg"), "CB")
assert.equal(L.initials("Cher"), "C")
assert.ok(L.hueOf("Maya") >= 0 && L.hueOf("Maya") < 360)

for (const v of L.VOICES) assert.ok(L.voiced(v, "Maya", "Mallow").includes("Maya"), `${v} addresses the customer`)
assert.notEqual(L.voiced("Brief", "Maya", "Mallow"), L.voiced("Formal", "Maya", "Mallow"), "voices differ")
assert.ok(L.voiced("Brief", "Maya", "Mallow").length < L.voiced("Friendly", "Maya", "Mallow").length, "brief is brief")

const path = L.sparkPath([1, 3, 2], 100, 10)
assert.equal(path, "M0.0 10.0 L50.0 0.0 L100.0 5.0")
assert.equal(L.sparkPath([], 100, 10), "")
assert.equal(L.sparkPath([5, 5], 100, 10), "M0.0 10.0 L100.0 10.0", "a flat line doesn't divide by zero")
for (const r of Object.values(L.RANGES)) assert.equal(r.spark[r.spark.length - 1], r.rate, "each sparkline ends at its headline rate")

console.log("mallow-support-template: ok")
