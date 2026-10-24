// Install-safety and logic checks for components/fuelplate-recipes-template.
// Run: node tests/fuelplate-recipes-template.test.mjs
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const SLUG = "fuelplate-recipes-template"
const read = (file) => readFileSync(new URL(`../components/${SLUG}/${file}`, import.meta.url), "utf8").replace(/\r\n/g, "\n")
const src = read(`${SLUG}.tsx`)
const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"))
const tsconfig = readFileSync(new URL("../tsconfig.json", import.meta.url), "utf8")
const region = (name) => {
  const a = src.indexOf(`// #region ${name}\n`)
  const b = src.indexOf(`// #endregion ${name}\n`)
  assert.ok(a > -1 && b > a, `region ${name} missing`)
  return src.slice(a, b)
}

/* ---------- nothing travels with it but react and gsap ---------- */

const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react", "gsap", "gsap/ScrollTrigger"], "react and gsap are the only imports")
assert.ok(pkg.dependencies.gsap, "gsap is declared in the root package.json")
assert.ok(tsconfig.includes(`"@/components/ui/${SLUG}": ["./components/${SLUG}/${SLUG}.tsx"]`), "tsconfig paths line")
assert.match(src, /if \(typeof window !== "undefined"\) gsap\.registerPlugin\(ScrollTrigger\)/, "ScrollTrigger registers only in the browser")
assert.doesNotMatch(src, /@import|@font-face|fetch\(|new Image\(/, "no fetches, no CSS imports")
assert.equal((src.match(/<link\b/g) || []).length, 1, "the one link is the optional font")
for (const m of src.matchAll(/https?:\/\/[^"'`\s)]+/g)) assert.match(m[0], /^https:\/\/(images\.unsplash\.com\/(photo-)?|fonts\.googleapis\.com\/css2)/, "only Unsplash photos and the font are remote: " + m[0])
assert.ok(src.includes('height = "100svh"'), "height defaults to a definite length")
assert.match(src, /"--fpt-h": height/, "the height prop reaches the root")
assert.match(src, /\.fpt-hero\{position:relative;min-height:var\(--fpt-h\)/, "the hero has a definite height")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")
assert.match(src, /React\.useId\(\)\.replace/, "ids are namespaced per instance")
assert.doesNotMatch(src.slice(0, src.indexOf("</")), /use(State|Ref|Memo|Callback)<|Partial<|Record<|Array<|Map<|React\.[A-Za-z]+<|\[K in /, "no generics before the JSX (21st CLI tokenizer)")
assert.doesNotMatch(src, /use(State|Ref|Memo|Callback)</, "hooks are typed without <generics>")
assert.doesNotMatch(src, /[—–]/, "no em or en dashes anywhere")
assert.doesNotMatch(src, />[^<{]*\\u[0-9a-f]{4}/i, "no \\u escapes inside JSX text (they print literally)")
assert.match(src, /style=\{\{ maxWidth: "none", objectPosition: s\.focus \}\}/, "photos are guarded against Preflight")
assert.match(src, /onError=\{\(\) => setState\("failed"\)\}/, "a failed photo falls back to its tone")
assert.match(src, /loading=\{eager \? "eager" : "lazy"\}/, "only the first screen loads eagerly")

const css = src.match(/const FPT_CSS = `([\s\S]*?)`/)
assert.ok(css, "CSS block present")
assert.doesNotMatch(css[1], /\$\{|`/, "no interpolation inside the CSS string")
assert.doesNotMatch(css[1], /url\(/, "no url() in the style block")
for (const m of css[1].replace(/\/\*[\s\S]*?\*\//g, "").replace(/@media[^{]*\{/g, "").replace(/@keyframes[^{]*\{/g, "").matchAll(/(?<=^|[{}])\s*([^{}@]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (/^(from|to|[\d.,%\s]+)$/.test(sel)) continue
  for (const s of sel.split(/,(?![^(]*\))/)) assert.match(s.trim(), /^\.fpt-/, `selector escapes the component: ${s.trim()}`)
}
assert.match(css[1], /\.fpt-root :where\(svg,img,canvas\)\{display:block;max-width:none\}/, "media are guarded against Preflight")
assert.match(css[1], /\.fpt-root\{[^}]*overflow-x:clip/, "the root clips sideways without breaking the sticky nav or the pin")
assert.doesNotMatch(css[1], /\.fpt-root\{[^}]*overflow:hidden/, "overflow:hidden on the root would break the sticky nav")
assert.match(css[1], /\.fpt-navwrap\{position:sticky;top:0;z-index:60;height:0\}/, "the nav sticks inside the component and takes no space")
assert.match(css[1], /\.fpt-root\[data-theme="dark"\]\{/, "a designed dark theme")
assert.match(css[1], /\.fpt-bento\{display:grid;grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/, "the marquee can't widen the bento columns")
assert.ok(css[1].includes("prefers-reduced-motion:reduce"), "honours reduced motion in CSS")

/* ---------- motion ---------- */

assert.match(src, /gsap\.context\(/, "every tween and trigger lives in one context")
assert.match(src, /if \(mm\) mm\.revert\(\)\n      ctx\.revert\(\)/, "and is reverted on unmount")
assert.match(src, /motion: "\(prefers-reduced-motion: no-preference\)"/, "motion only without reduced motion")
assert.match(src, /if \(planRef\.current && plannerTabs\.length > 1 && desk && motion\)/, "the planner only pins on desktop with motion")
assert.match(src, /pin: true/, "the planner pins")
assert.match(src, /setTab\(tabAt\(self\.progress, n\)\)/, "scroll walks the tabs")
assert.match(src, /immediateRender: false \}, 0\)/, "the scroll fold doesn't stomp on the intro")
assert.match(src, /gsap\.from\("\.fpt-bento \.fpt-tile"/, "bento reveal is scoped (an unscoped .fpt-tile hid the cook cards)")
assert.match(src, /duration: r \? 0 : 0\.9/, "the coverflow jumps under reduced motion")
assert.match(src, /scrollIntoView\(\{ behavior: prefersReduced\(\) \? "auto" : "smooth"/, "nav scrolls instantly under reduced motion")

/* ---------- it behaves like a product page ---------- */

assert.match(src, /role="tablist"/, "the planner tabs are tabs")
assert.match(src, /aria-roledescription="carousel"/, "the coverflow is a carousel")
assert.match(src, /aria-modal="true"/, "the download sheet is a modal")
assert.match(src, /e\.key === "Escape"/, "Escape closes it")
assert.match(src, /if \(res === false\) ok = false/, "onRequestLink can refuse")
assert.match(src, /role="switch"/, "metric / imperial is a switch")
assert.match(src, /role="timer"/, "the cooking timer is announced")
assert.match(src, /if \(left < 0\) setLeft\(total\)/, "the timer starts from the step's full time")
assert.match(src, /\{fontHref && <link rel="stylesheet" href=\{fontHref\} \/>\}/, "the font is optional")
assert.ok(read("demo.tsx").includes("<FuelplateRecipesTemplate />"), "default demo is the component, full bleed")
assert.doesNotMatch(read("demo.tsx"), /<div/, "default demo has no wrapper")
assert.match(read("demo-lifters.tsx"), /palette="clay"/, "the second demo uses another palette")
for (const m of read("demo-lifters.tsx").matchAll(/https?:\/\/[^"\s]+/g)) assert.match(m[0], /^https:\/\/images\.unsplash\.com\/photo-/)

/* ---------- logic, executed ---------- */

const code = region("content") + region("logic") +
  "\nexport { DEFAULT_DISHES, DEFAULT_TESTIMONIALS, DEFAULT_RECIPE, DEFAULT_CATEGORIES, DEFAULT_ARTICLES, DEFAULT_PLANNER, DEFAULT_PLAN, PALETTES, resolvePalette, sized, srcSet, wrapOffset, mod, cardPose, tabAt, filterDishes, withTags, macroMatch, swapsFor, dayTotals, quarter, amount, dailyValue, mmss, fmtDate, nextIndex }\n"
const L = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(code)))

// every default picture is a real Unsplash URL with a tone
const shots = [...L.DEFAULT_DISHES.map((d) => d.image), L.DEFAULT_RECIPE.image, ...L.DEFAULT_CATEGORIES.map((c) => c.image), ...L.DEFAULT_ARTICLES.map((a) => a.image), ...L.DEFAULT_TESTIMONIALS.map((t) => t.image)]
for (const s of shots) {
  assert.match(s.src, /^https:\/\/images\.unsplash\.com\/photo-\d+-[0-9a-f]{12}$/, "bare Unsplash URL " + s.src)
  assert.match(s.tone, /^#[0-9a-f]{6}$/, "tone for " + s.src)
}
for (const d of L.DEFAULT_DISHES) assert.ok(d.image.alt.length > 8, "alt for " + d.name)
assert.equal(new Set(L.DEFAULT_DISHES.map((d) => d.id)).size, L.DEFAULT_DISHES.length, "dish ids are unique")
for (const day of L.DEFAULT_PLAN) for (const id of day.meals) assert.ok(L.DEFAULT_DISHES.some((d) => d.id === id), "plan meal exists: " + id)

// responsive photo URLs
const u = "https://images.unsplash.com/photo-1512621776951-a57141f2eefd"
assert.equal(L.sized(u, 800), u + "?auto=format&fit=crop&q=75&w=800")
assert.equal(L.sized(u + "?w=50", 80, 80), u + "?auto=format&fit=crop&q=75&w=80&h=80", "existing params are replaced")
assert.equal(L.sized("/me.jpg", 800), "/me.jpg")
assert.equal(L.srcSet("/me.jpg", 2000), "")
assert.deepEqual(L.srcSet(u, 1200).split(", ").map((x) => x.split(" ")[1]), ["480w", "800w", "1200w"])

// the coverflow ring
assert.equal(L.wrapOffset(0, 0, 12), 0)
assert.equal(L.wrapOffset(11, 0, 12), -1, "the last card sits left of the first")
assert.equal(L.wrapOffset(1, 11, 12), 2, "wraps forwards")
assert.equal(L.wrapOffset(3, 2.5, 12), 0.5)
assert.equal(L.mod(-1, 12), 11)
const c = L.cardPose(0, 200)
assert.deepEqual([c.x, c.scale, c.opacity], [0, 1.34, 1], "the centre card is biggest")
assert.ok(L.cardPose(1, 200).x > 200, "neighbours make room for the bigger centre card")
assert.equal(L.cardPose(-1, 200).x, -L.cardPose(1, 200).x, "symmetric")
assert.equal(L.cardPose(5, 200).opacity, 0, "far cards vanish")
assert.ok(L.cardPose(0, 200).zIndex > L.cardPose(1, 200).zIndex)
assert.equal(L.cardPose(2, 200, 0).x, 0, "spread 0 stacks the cards in the middle for the fan-out")

// planner tabs from scroll progress
assert.deepEqual([0, 0.32, 0.34, 0.99, 1].map((p) => L.tabAt(p, 3)), [0, 0, 1, 2, 2])
assert.equal(L.tabAt(0.7, 1), 0)
assert.equal(L.nextIndex(2, "ArrowRight", 3), 0)
assert.equal(L.nextIndex(0, "ArrowLeft", 3), 2)
assert.equal(L.nextIndex(1, "End", 3), 2)
assert.equal(L.nextIndex(1, "x", 3), -1)

// search and filters
const D = L.DEFAULT_DISHES
assert.deepEqual(L.filterDishes(D, "salmon", []).map((d) => d.id), ["salmon", "curry"])
assert.deepEqual(L.filterDishes(D, "PLATE salmon", []).map((d) => d.id), ["salmon"], "every word, any order, any case")
assert.equal(L.filterDishes([{ ...D[0], name: "Crème brûlée" }], "creme brulee", []).length, 1, "accents fold")
assert.ok(L.filterDishes(D, "", ["protein"]).every((d) => d.protein >= 30))
assert.ok(L.filterDishes(D, "", ["quick", "plant"]).every((d) => d.time <= 20 && d.tags.includes("vegetarian")))
assert.equal(L.filterDishes(D, "breakfast", []).length, D.filter((d) => d.course === "Breakfast").length, "course is searchable")
assert.deepEqual(L.withTags(D, ["vegan"]).map((d) => d.id), ["power"])
assert.equal(L.withTags(D, []).length, D.length)

// swaps
assert.equal(L.macroMatch(D[0], D[0]), 100)
assert.equal(L.macroMatch(D[0], D[1]), L.macroMatch(D[1], D[0]), "symmetric")
const sw = L.swapsFor(D[1], D, 3)
assert.equal(sw.length, 3)
assert.ok(sw.every((x) => x.dish.id !== D[1].id), "never swaps to itself")
assert.ok(sw[0].match >= sw[1].match && sw[1].match >= sw[2].match, "best match first")
assert.deepEqual(L.dayTotals(["salmon", "missing"], D), { kcal: 540, protein: 41, carbs: 22, fat: 30 }, "unknown ids are skipped")

// amounts: servings and units
const R = L.DEFAULT_RECIPE
const beef = R.ingredients[0]
assert.equal(L.amount(beef, 4, 4, "metric"), "400 g")
assert.equal(L.amount(beef, 4, 4, "imperial"), "14.1 oz")
assert.equal(L.amount(beef, 4, 2, "imperial"), "7.05 oz", "halved, two decimals under 10 oz")
assert.equal(L.amount(beef, 4, 5, "imperial"), "1.1 lb", "a pound and up reads in pounds")
assert.equal(L.amount(beef, 4, 12, "metric"), "1.2 kg")
const tom = R.ingredients[2]
assert.equal(L.amount(tom, 4, 4, "metric"), "480 ml")
assert.equal(L.amount(tom, 4, 4, "imperial"), "2 cups")
assert.equal(L.amount(tom, 4, 1, "imperial"), "½ cup")
assert.equal(L.amount({ name: "Water", qty: 30, unit: "ml" }, 1, 1, "imperial"), "1 fl oz", "small volumes in fl oz")
assert.equal(L.amount(R.ingredients[3], 4, 6, "imperial"), "3 tbsp", "spoons scale, never convert")
assert.equal(L.amount(R.ingredients[4], 4, 2, "metric"), "1½", "pieces in quarters")
assert.equal(L.quarter(0.1), "0")
assert.equal(L.quarter(2.74), "2¾")

// small things
assert.equal(L.mmss(540), "09:00")
assert.equal(L.mmss(-3), "00:00")
assert.equal(L.fmtDate("2026-02-21"), "February 21, 2026", "dates never slip a day across zones")
assert.equal(L.dailyValue("Iron", "salmon"), L.dailyValue("Iron", "salmon"), "stable")
for (const n of ["Iron", "Zinc", "Omega-3"]) assert.ok(L.dailyValue(n, "x") >= 12 && L.dailyValue(n, "x") < 140)

// palettes: white type on the accent pill stays readable
const lum = (hex) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4))
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
}
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort(); return (y + 0.05) / (x + 0.05) }
for (const [name, p] of Object.entries(L.PALETTES)) {
  assert.ok(ratio("#ffffff", p.accent) >= 4.5, name + ": white on the accent")
  assert.ok(ratio("#f3f1eb", p.accent) >= 4.5, name + ": accent on the paper")
}
assert.equal(L.resolvePalette("clay"), L.PALETTES.clay)
assert.equal(L.resolvePalette("nope"), L.PALETTES.sage)
assert.equal(L.resolvePalette({ accent: "#123456", soft: "#abcdef" }).ink, "#1b1d18")

console.log(`ok - ${SLUG}`)
