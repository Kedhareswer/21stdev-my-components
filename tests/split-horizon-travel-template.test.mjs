// Install-safety and logic checks for components/split-horizon-travel-template.
// Run: node tests/split-horizon-travel-template.test.mjs
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const SLUG = "split-horizon-travel-template"
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
assert.deepEqual([...src.matchAll(/https?:\/\/[^\s"'`]+/g)].map((m) => m[0]), [], "no remote URLs: every picture is drawn")
assert.equal((src.match(/<img\b/g) || []).length, 1, "the one <img> is a photo the user supplies")
assert.match(src, /\{image \? \(\n\s*<img className="sht-photo"/, "and only renders when an image is given")
assert.match(src, /\.sht-photo\{[^}]*max-width:none/, "photos are guarded against Preflight")
assert.match(src, /width=\{1600\} height=\{1000\}/, "and carry their own size")
assert.ok(src.includes('height = "100svh"'), "height defaults to a definite length")
assert.match(src, /"--sht-hero-h": height/, "the height prop reaches the hero")
assert.match(src, /\.sht-hero\{[^}]*height:max\(640px,calc\(var\(--sht-hero-h\)/, "the hero has a floor")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")
for (const m of src.matchAll(/([^{}]+)\{[^}]*\bheight:100%/g))
  assert.match(m[1].trim(), /^(\.sht-pic \.sht-svg,\.sht-photo|\.sht-progress span|\.sht-menu-track|\.sht-menu-tile)$/, `percentage height on ${m[1].trim()}`)
assert.match(src, /React\.useId\(\)\.replace/, "svg ids are namespaced per instance")
assert.doesNotMatch(src, /url\(#[a-z]/, "gradient and clip references are built from the instance id")
assert.doesNotMatch(src.slice(0, src.indexOf("</")), /use(State|Ref|Memo|Callback)<|Partial<|Record<|Array<|Map<|React\.[A-Za-z]+<|\[K in /, "no generics before the JSX (21st CLI tokenizer)")
assert.match(src, /matchMedia\("\(prefers-reduced-motion: reduce\)"\)/, "reduced motion is read in JS")

const css = src.match(/const SHT_CSS = `([\s\S]*?)`/)
assert.ok(css, "CSS block present")
assert.doesNotMatch(css[1], /\$\{|`/, "no interpolation inside the CSS string")
assert.doesNotMatch(css[1], /url\(/, "no url() in the style block")
assert.ok(css[1].includes("prefers-reduced-motion:reduce"), "honours reduced motion in CSS")
for (const m of css[1].replace(/\/\*[\s\S]*?\*\//g, "").replace(/@media[^{]*\{/g, "").replace(/@keyframes[^{]*\{/g, "").matchAll(/(?<=^|[{}])\s*([^{}@]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (/^(from|to|[\d.,%\s]+)$/.test(sel)) continue
  for (const s of sel.split(/,(?![^(]*\))/)) assert.match(s.trim(), /^\.sht-/, `selector escapes the component: ${s.trim()}`)
}
assert.match(css[1], /\.sht-svg\{display:block;max-width:none/, "svgs are guarded against Preflight")
assert.match(css[1], /\.sht-root :where\(button\)\{/, "the reset has no specificity to fight")
assert.match(css[1], /\.sht-root\{[^}]*overflow-x:clip/, "the root clips sideways without breaking the sticky bar")
assert.match(css[1], /\.sht-bar\{position:sticky/, "the bar sticks")

/* ---------- it behaves like a travel site ---------- */

assert.match(src, /role="slider"/, "the seam is a slider")
assert.match(src, /setPointerCapture/, "and drags with pointer capture")
assert.match(src, /onKeyDown=\{onSeamKey\}/, "and moves with the keyboard")
assert.match(src, /clip-path:inset\(0 0 0 calc\(var\(--sht-split\) \* 100%\)\)/, "the view and the white headline share one seam")
assert.match(src, /onAnimationEnd=\{\(\) => setSlide/, "slides advance when the progress dot fills")
assert.match(src, /\.sht-hero\.is-held \.sht-dot-fill/, "and pause while the pointer is on the hero")
assert.match(src, /const autoplay = interval > 0 && !reduced/, "no slideshow under reduced motion")
assert.match(src, /matchTours\(tours, query, region, saved\)/, "the finder filters as you type")
assert.match(src, /aria-pressed=\{isSaved\}/, "saving a tour is a toggle")
assert.match(src, /m\.count === "saved" \? " \(" \+ savedCount \+ "\)"/, "the menu counts what is saved")
assert.match(src, /role="dialog" aria-modal="true" aria-labelledby="sht-d-h"/, "a tour opens in a labelled dialog")
assert.match(src, /e\.key !== "Escape"/, "Escape closes the menu and the dialog")
assert.match(src, /isEmail\(form\.email\)/, "the form validates before sending")
assert.match(src, /if \(res === false\) ok = false/, "onEnquire can refuse")
assert.match(src, /alive\.current = true\n/, "the unmount guard survives strict mode's double mount")
assert.match(src, /scrollIntoView\(\{ behavior: reduced \? "auto" : "smooth", block: "start" \}\)/, "in-page links scroll, instantly under reduced motion")
for (const k of ["tours", "about", "booking", "faq"]) assert.ok(src.includes(`data-sec="${k}"`), `section ${k} is addressable`)
assert.ok(read("demo.tsx").includes("<SplitHorizonTravelTemplate />"), "default demo is the component, full bleed")
assert.doesNotMatch(read("demo.tsx"), /<div/, "default demo has no wrapper")
assert.match(read("demo-glacier.tsx"), /palette="glacier"/, "the second demo reprints the page")
assert.doesNotMatch(read("demo-glacier.tsx"), /="[^"]*\\n/, "no \\n inside a JSX string attribute")
assert.doesNotMatch(read("demo-glacier.tsx"), /https?:\/\//, "the second demo stays capture-safe too")

/* ---------- logic, executed ---------- */

const code = region("content") + region("logic") +
  "\nexport { PALETTES, DEFAULT_TOURS, DEFAULT_SLIDES, SCENE_KINDS, hashString, mulberry32, ridgePts, peaksOf, shadeD, buildScene, formatPrice, parseQuery, matchTours, regionsOf, toggleId, nextIndex, upcomingMonths, isEmail, enquiryRef, halftoneDots, resolvePalette }\n"
const L = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(code)))

// every scene draws, deterministically, and stays inside its frame
for (const k of L.SCENE_KINDS) {
  const a = L.buildScene(k)
  assert.ok(a.sky.length >= 2, `${k} has a sky`)
  assert.ok(a.items.length >= 6, `${k} has layers`)
  assert.deepEqual(a, L.buildScene(k), `${k} is the same on server and client`)
  for (const it of a.items) {
    assert.match(it.d, /^M-?[\d.]+ -?[\d.]+/, `${k}: every item is a path`)
    assert.doesNotMatch(it.d, /NaN|Infinity|undefined/, `${k}: no broken numbers`)
    if (it.clip != null) assert.ok(it.clip >= 0 && it.clip < a.items.indexOf(it), `${k}: clips point back at an earlier shape`)
    assert.ok((it.depth ?? 0.5) >= 0 && (it.depth ?? 0.5) <= 1, `${k}: parallax depth in range`)
  }
}
assert.notDeepEqual(L.buildScene("alpine", 1), L.buildScene("alpine", 2), "a seed moves the mountains")
for (const t of L.DEFAULT_TOURS) assert.ok(L.SCENE_KINDS.includes(t.scene), `${t.id} uses a drawn scene`)
for (const s of L.DEFAULT_SLIDES) if (s.gem?.tour) assert.ok(L.DEFAULT_TOURS.some((t) => t.id === s.gem.tour), `slide gem ${s.gem.tour} opens a real tour`)

const pts = L.ridgePts(3, { base: 600, amp: 200, freq: 0.004, ridged: 0.8, bumps: [[800, 300, 300]] })
assert.ok(pts[0][0] < 0 && pts[pts.length - 1][0] > 1600, "ridges overscan both edges for parallax")
assert.ok(pts.every((p) => p[1] <= 600.001), "nothing dips below the base")
assert.ok(Math.min(...pts.map((p) => p[1])) < 300, "the summit rises")
assert.ok(L.ridgePts(3, { base: 600, amp: 100, freq: 0.004, flat: 560 }).every((p) => p[1] >= 560), "a flat-top ridge is a mesa")
const peaks = L.peaksOf([[0, 5], [1, 3], [2, 1], [3, 4], [4, 6], [5, 2], [6, 7]], 1)
assert.deepEqual(peaks, [2, 5], "summits are local minima in screen space")
assert.equal(L.shadeD([[0, 100], [10, 100]], 1, 200), "", "a flat ridge throws no shadow")

assert.equal(L.formatPrice(1800, "$"), "$1,800")
assert.equal(L.formatPrice(24000.4, "€"), "€24,000")

assert.deepEqual(L.parseQuery("Fjords under $1,500"), { terms: ["fjords"], maxPrice: 1500, days: null })
assert.deepEqual(L.parseQuery("7 days coast"), { terms: ["coast"], maxPrice: null, days: 7 })
assert.deepEqual(L.parseQuery("  "), { terms: [], maxPrice: null, days: null })
const T = L.DEFAULT_TOURS
assert.equal(L.matchTours(T, "", "All", []).length, T.length)
assert.deepEqual(L.matchTours(T, "norway", "All", []).map((t) => t.id), ["lofoten"], "matches the country")
assert.deepEqual(L.matchTours(T, "safari", "All", []).map((t) => t.id), ["serengeti"], "matches a tag")
assert.ok(L.matchTours(T, "under 1300", "All", []).every((t) => t.price <= 1300), "a budget caps the price")
assert.ok(L.matchTours(T, "6 days", "All", []).every((t) => Math.abs(t.days - 6) <= 1), "a length is give or take a day")
assert.deepEqual(L.matchTours(T, "", "Coast", []).map((t) => t.id), ["algarve"])
assert.deepEqual(L.matchTours(T, "", "Saved", ["skye", "nope"]).map((t) => t.id), ["skye"], "the Saved chip shows only saved tours")
assert.equal(L.matchTours(T, "atlantis", "All", []).length, 0)
assert.deepEqual(L.regionsOf(T), ["All", "Islands", "Wild", "Coast", "Culture", "Mountains", "Saved"])
assert.deepEqual(L.toggleId(["a"], "b"), ["a", "b"])
assert.deepEqual(L.toggleId(["a", "b"], "a"), ["b"])

assert.equal(L.nextIndex(0, "ArrowRight", 3), 1)
assert.equal(L.nextIndex(2, "ArrowDown", 3), 0, "wraps forward")
assert.equal(L.nextIndex(0, "ArrowUp", 3), 2, "wraps back")
assert.equal(L.nextIndex(1, "End", 3), 2)
assert.equal(L.nextIndex(1, "Home", 3), 0)
assert.equal(L.nextIndex(1, "x", 3), 1)

assert.deepEqual(L.upcomingMonths(new Date(2026, 10, 17), 3).map((m) => m.key), ["2026-12", "2027-01", "2027-02"], "months start next month and roll the year")
assert.equal(L.upcomingMonths(new Date(2026, 11, 2), 1)[0].label, "Jan 2027")

assert.ok(L.isEmail("ada@example.com"))
assert.ok(!L.isEmail("ada@example"))
assert.ok(!L.isEmail("ada example.com"))
const r1 = L.enquiryRef("Wayfold", " Ada@Example.com", "lofoten")
assert.match(r1, /^WA-[A-HJ-NP-Z2-9]{5}$/, "readable reference, no 0/O/1/I")
assert.equal(r1, L.enquiryRef("Wayfold", "ada@example.com", "lofoten"), "stable per email, case and space aside")
assert.notEqual(r1, L.enquiryRef("Wayfold", "ada@example.com", "skye"), "and per trip")
assert.match(L.enquiryRef("2026", "x@y.co", "a"), /^TR-/, "a brand without letters still gets a prefix")

const wedge = L.halftoneDots(15, 19, 16)
const orb = L.halftoneDots(15, 19, 16, "orb")
assert.ok(wedge.length > 40 && orb.length > 40, "both halftones have dots")
assert.notDeepEqual(wedge, orb, "and differ")
assert.ok(wedge.every((d) => d.r > 0 && d.r <= 8), "dots never overlap their cell")

assert.equal(L.resolvePalette("glacier", false).paper, L.PALETTES.glacier.light.paper)
assert.equal(L.resolvePalette("olive", true).paper, L.PALETTES.olive.dark.paper, "each preset has a night version")
assert.equal(L.resolvePalette({ stone: "#ff0000" }, false).stone, "#ff0000", "a partial palette overrides")
assert.equal(L.resolvePalette({ stone: "#ff0000" }, false).paper, L.PALETTES.linen.light.paper, "and falls back to linen")
assert.equal(L.resolvePalette("nope", false).ink, L.PALETTES.linen.light.ink)

console.log("split-horizon-travel-template: ok")
