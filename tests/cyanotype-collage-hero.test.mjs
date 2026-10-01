// Install-safety and logic checks for components/cyanotype-collage-hero.
// Run: node tests/cyanotype-collage-hero.test.mjs
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const SLUG = "cyanotype-collage-hero"
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
assert.doesNotMatch(src, /@import|@font-face|<link\b|<img\b|<image\b|fetch\(|new Image\(/, "nothing loads at runtime")
assert.doesNotMatch(src, /https?:\/\//, "no external URLs — every scrap is drawn in the file")
assert.ok(src.includes('height = "100svh"'), "height defaults to a definite length")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")
assert.match(src, /style = \{ height,/, "the root takes its height from the prop")
assert.match(src, /React\.useId\(\)\.replace/, "svg ids are namespaced per instance")
assert.doesNotMatch(src, /url\(#[a-z]/, "pattern, filter, mask and clip references are built from the instance id")
assert.doesNotMatch(src, /use(State|Ref|Memo|Callback|Context)<|Record<|Array<|Promise<|Partial</, "no <generics> for the 21st CLI tokenizer to choke on")
assert.ok(src.includes("prefers-reduced-motion:reduce"), "honours reduced motion in CSS")
assert.match(src, /matchMedia\("\(prefers-reduced-motion: reduce\)"\)/, "and in JS (parallax, autoplay, the orbiting dot)")
assert.match(src, /!reduced && <animateMotion /, "the orbiting dot stays still under reduced motion")
assert.match(src, /if \(!el \|\| reduced \|\| !window\.matchMedia\("\(pointer: fine\)"\)\.matches\) return/, "parallax only for a fine pointer and full motion")
assert.match(src, /if \(!autoplay \|\| reduced \|\| list\.length < 2\) return/, "autoplay stops under reduced motion")

const css = src.match(/const CCH_CSS = `([\s\S]*?)`/)
assert.ok(css, "CSS block present")
assert.doesNotMatch(css[1], /\$\{|`/, "no interpolation inside the CSS string")
assert.doesNotMatch(css[1], /url\(/, "no url() in the style block")
for (const m of css[1].replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/(?<=^|[{}])\s*([^{}@]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (/^(from|to|[\d.,%\s]+)$/.test(sel)) continue
  for (const s of sel.split(/,(?![^(]*\))/)) assert.match(s.trim(), /^(\.dark )?\.cch-/, `selector escapes the component: ${s.trim()}`)
}
assert.match(css[1], /\.cch-svg\{[^}]*max-width:none/, "svgs are guarded against Preflight")
assert.match(css[1], /\.cch-grain\{[^}]*max-width:none/, "and so is the grain overlay")
assert.match(css[1], /\.cch-root :where\(button\)\{/, "the button reset has no specificity to fight")
assert.match(css[1], /\.cch-root\{[^}]*container-type:size/, "the root is the size container the collage scales from")
assert.doesNotMatch(css[1], /\.cch-root\{[^}]*[;{]height:/, "the root never sets its own height")
assert.match(css[1], /\.cch-frame\{[^}]*--u:min\(/, "--u is declared below the container, where cq units resolve against it")
assert.match(css[1], /@container cch \(orientation: portrait\)\{/, "phones get a stacked layout")
assert.match(css[1], /\.dark \.cch-root\[data-theme="auto"\]/, "auto theme follows a host .dark class")
assert.match(css[1], /\.cch-intro \.cch-in\{animation:cch-drop [^}]*backwards/, "intro keyframes fill backwards only, so hover transforms still apply afterwards")
assert.match(css[1], /\.cch-piece\{[^}]*touch-action:none/, "scraps can be dragged on touch screens")

/* ---------- it behaves like a toy ---------- */

for (const k of ["photo", "polaroid", "sunflower", "popsicle", "bars", "sandal", "star"]) {
  assert.match(src, new RegExp(`\\{ key: "${k}", x: `), `${k} is placed on the collage`)
  assert.match(src, new RegExp(`\\b${k}: "[^"]+Press Enter`), `${k} has a spoken label`)
}
assert.match(src, /role="button"\s+tabIndex=\{0\}/, "scraps are focusable buttons")
assert.match(src, /setPointerCapture\(e\.pointerId\)/, "a drag keeps the pointer")
assert.match(src, /if \(isTap\(dx, dy\)\) return/, "a press that barely moves is a tap, not a drag")
assert.match(src, /else act\(g\.key\)/, "and a tap plays the scrap")
assert.match(src, /const n = nudge\(e\.key, e\.shiftKey\)/, "arrow keys move a focused scrap")
assert.match(src, /e\.key === "Enter" \|\| e\.key === " "/, "Enter and Space play it")
assert.match(src, /const n = chapterKey\(cur, e\.key, list\.length\)/, "arrow keys page through files")
assert.match(src, /aria-current=\{i === cur\}/, "the current file is marked")
assert.match(src, /aria-live="polite"/, "what happens is announced")
assert.match(src, /className="cch-tidy" onClick=\{tidy\}/, "a messy collage can be tidied")
assert.match(src, /<div className="cch-bg" onPointerDown=\{stamp\} \/>/, "only the bare paper takes stamps")
assert.match(src, /setMarks\(\(m\) => \[\.\.\.m\.slice\(-13\), mark\]\)/, "stamps are capped")
assert.ok(read("demo-original.tsx").includes("<CyanotypeCollageHero />"), "original demo is the bare component")
assert.match(read("demo.tsx"), /<CyanotypeCollageHero[\s/>]/, "default demo is the component, full bleed")
assert.doesNotMatch(read("demo.tsx"), /<div/, "default demo has no wrapper")
assert.match(read("demo.tsx"), /palette="vermilion"/, "the default demo reprints it")
assert.match(read("demo.tsx"), /chapters=\{\[/, "with its own files")

/* ---------- logic, executed ---------- */

const code = region("logic") + "\nexport { PALETTES, SKIES, WEATHER, BITES, clamp, mulberry32, hashString, wrap, paletteColors, skyOf, parseEmphasis, plain, chapterKey, nudge, isTap, sparklePath, starburst, ellipsePath, petalPath, cloudBank, barcodeBars, forecast }\n"
const L = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(code)))

const a = L.mulberry32(42)
const b = L.mulberry32(42)
const seq = [a(), a(), a()]
assert.deepEqual(seq, [b(), b(), b()], "seeded PRNG is deterministic, so server and client draw the same clouds")
assert.ok(seq.every((v) => v >= 0 && v < 1))
assert.equal(L.hashString("x"), L.hashString("x"))
assert.notEqual(L.hashString("x"), L.hashString("y"))

assert.equal(L.wrap(3, 3), 0)
assert.equal(L.wrap(-1, 3), 2, "wraps backwards")
assert.equal(L.wrap(7, 0), 0, "an empty list stays at 0")
assert.equal(L.clamp(5, 0, 1), 1)

assert.deepEqual(L.paletteColors("teal"), { accent: L.PALETTES.teal.accent, paper: L.PALETTES.teal.paper })
assert.deepEqual(L.paletteColors("nope"), { accent: L.PALETTES.cobalt.accent, paper: L.PALETTES.cobalt.paper }, "unknown palettes fall back to cobalt")
assert.deepEqual(L.paletteColors("vermilion", "#000", ""), { accent: "#000", paper: L.PALETTES.vermilion.paper }, "accent and paper override one at a time")
for (const k of Object.keys(L.PALETTES)) assert.match(L.PALETTES[k].accent, /^#[0-9a-f]{6}$/)

assert.equal(L.skyOf("night"), "night")
assert.equal(L.skyOf("noon"), "day", "unknown skies fall back to day")
assert.equal(L.skyOf(undefined), "day")

assert.deepEqual(L.parseEmphasis("a *b* c"), [{ text: "a ", em: false }, { text: "b", em: true }, { text: " c", em: false }])
assert.deepEqual(L.parseEmphasis("*青*を夢見る"), [{ text: "青", em: true }, { text: "を夢見る", em: false }])
assert.deepEqual(L.parseEmphasis("2 * 3"), [{ text: "2 * 3", em: false }], "a lone asterisk stays literal")
assert.deepEqual(L.parseEmphasis(""), [])
assert.equal(L.plain("観測者αは\n*青*を夢見る"), "観測者αは 青を夢見る")

assert.equal(L.chapterKey(0, "ArrowRight", 3), 1)
assert.equal(L.chapterKey(2, "ArrowRight", 3), 0, "wraps forward")
assert.equal(L.chapterKey(0, "ArrowLeft", 3), 2, "wraps back")
assert.equal(L.chapterKey(1, "Home", 3), 0)
assert.equal(L.chapterKey(0, "End", 3), 2)
assert.equal(L.chapterKey(1, "a", 3), null)
assert.equal(L.chapterKey(0, "ArrowRight", 0), null)

assert.deepEqual(L.nudge("ArrowLeft", false), [-10, 0])
assert.deepEqual(L.nudge("ArrowDown", true), [0, 40], "Shift moves further")
assert.equal(L.nudge("Enter", false), null)
assert.ok(L.isTap(3, 4))
assert.ok(!L.isTap(6, 1))

assert.match(L.sparklePath(0, 0, 10), /^M0 -10Q.*Z$/, "sparkle starts at its top point")
assert.equal((L.sparklePath(0, 0, 10).match(/Q/g) || []).length, 4, "four concave sides")
const burst = L.starburst(0, 0, 100, 60, 8)
assert.equal((burst.match(/L/g) || []).length, 15, "8 spikes and 8 waists")
assert.ok(burst.startsWith("M0 -100"), "the first spike points up and is long")
const ell = L.ellipsePath(0, 0, 100, 50, 0)
assert.equal(ell, "M100 0A100 50 0 1 1 -100 0A100 50 0 1 1 100 0Z", "ellipse closes on itself")
assert.match(L.petalPath(30, 80, 15), /^M0 -30C.* 0 -110C.* 0 -30Z$/, "petal runs from the disc to its tip")

const bank = L.cloudBank(7, 300, 370, 400, 250, 40)
assert.equal(bank.length, 40)
assert.deepEqual(bank, L.cloudBank(7, 300, 370, 400, 250, 40), "clouds are reproducible")
assert.notDeepEqual(bank, L.cloudBank(8, 300, 370, 400, 250, 40), "another seed is another sky")
assert.ok(bank.every((p, i) => i === 0 || p.cy >= bank[i - 1].cy), "drawn top-first, so lower puffs sit in front")
assert.ok(bank.every((p) => p.r > 0 && p.cx >= 100 && p.cx <= 500 && p.cy <= 370), "every puff sits on the bank's base, within its width")
assert.ok(Math.min(...bank.map((p) => p.cy - p.r)) < 370 - 120, "and the heap rises")

const bars = L.barcodeBars("SCN 06", 74)
assert.deepEqual(bars, L.barcodeBars("SCN 06", 74), "same code, same bars")
assert.notDeepEqual(bars, L.barcodeBars("SCN 07", 74), "the chapter changes the bars")
assert.deepEqual(L.barcodeBars("SCN06", 74), bars, "spaces are ignored")
assert.equal(bars[0].x, 0, "starts with a guard bar")
const end = bars.at(-1).x + bars.at(-1).w
assert.ok(Math.abs(end - 74) < 0.3, "ends flush with its width")
assert.ok(bars.every((r, i) => r.w > 0 && (i === 0 || r.x > bars[i - 1].x + bars[i - 1].w - 0.15)), "bars never overlap")
assert.equal(L.barcodeBars("", 74).length, L.barcodeBars("0", 74).length, "an empty code still prints")

const casts = Array.from({ length: 60 }, (_, t) => L.forecast(6, t))
assert.ok(casts.every((w) => w >= 0 && w < L.WEATHER.length), "every toss lands on a forecast")
assert.equal(new Set(casts).size, L.WEATHER.length, "and every forecast comes up")
assert.equal(L.forecast(6, 3), L.forecast(6, 3), "the same toss reads the same")
assert.ok(L.WEATHER.every((w) => w.jp && w.en && typeof w.turn === "number"))
assert.ok(L.BITES.length >= 2, "a few bites before the stick")
assert.deepEqual(L.SKIES, ["day", "dusk", "night"])

console.log("cyanotype-collage-hero: ok")
