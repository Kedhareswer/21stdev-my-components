// Install-safety and logic checks for components/mosaic-prompt-template.
// Run: node tests/mosaic-prompt-template.test.mjs
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const SLUG = "mosaic-prompt-template"
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
assert.deepEqual(imports, ["react", "gsap", "gsap/ScrollTrigger"], "react and gsap are the only imports")
const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"))
assert.ok(pkg.dependencies.gsap, "gsap is declared at the root, so the 21st build gate accepts it")
assert.doesNotMatch(src, /@import|@font-face|<link\b|fetch\(|<img\b/, "no fonts, no fetches, no pictures: the pixel face and the sky are drawn in code")
assert.doesNotMatch(src, /https?:\/\//, "nothing remote at all")
assert.ok(src.includes('height = "100svh"'), "height defaults to a definite length")
assert.match(src, /"--mpt-h": height/, "the height prop reaches the root")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")
assert.doesNotMatch(src, /location\.hash|hashchange/, "navigation scrolls inside the page and never touches the host's hash")
assert.match(src, /React\.useId\(\)\.replace/, "ids are namespaced per instance")
const head = src.slice(0, src.indexOf("</"))
assert.doesNotMatch(head, /use(State|Ref|Memo|Callback)<|Partial<|Required<|Record<|Array<|Map<|Set<|Promise<|NonNullable<|React\.[A-Za-z]+<|\[K in /, "no generics before the first JSX close tag (21st CLI tokenizer)")
assert.doesNotMatch(src, /use(State|Ref|Memo|Callback)</, "hooks are typed without <generics>")
assert.match(src, /matchMedia\("\(prefers-reduced-motion: reduce\)"\)/, "reduced motion is read in JS")
assert.doesNotMatch(src, /[—–]/, "no em or en dashes anywhere")
assert.doesNotMatch(src, />[^<{]*\\u[0-9a-f]{4}/i, "no \\u escapes inside JSX text")

const css = src.match(/const MPT_CSS = `([\s\S]*?)`/)
assert.ok(css, "CSS block present")
assert.doesNotMatch(css[1], /\$\{|`/, "no interpolation inside the CSS string")
assert.doesNotMatch(css[1], /url\(/, "no url() in the style block")
for (const m of css[1].replace(/\/\*[\s\S]*?\*\//g, "").replace(/@media[^{]*\{/g, "").replace(/@keyframes[^{]*\{/g, "").matchAll(/(?<=^|[{}])\s*([^{}@]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (/^(from|to|[\d.,%\s]+)$/.test(sel)) continue
  for (const s of sel.split(/,(?![^(]*\))/)) assert.match(s.trim(), /^\.mpt-/, `selector escapes the component: ${s.trim()}`)
}
assert.match(css[1], /\.mpt-root :where\(svg,canvas,img\)\{display:block;max-width:none\}/, "media are guarded against Preflight")
assert.match(css[1], /\.mpt-root\{[^}]*min-height:var\(--mpt-h\)/, "the root has a definite floor")
assert.match(css[1], /\.mpt-root\{[^}]*overflow-x:clip/, "the root clips sideways without breaking the sticky sky")
assert.doesNotMatch(css[1], /\.mpt-root\{[^}]*overflow:hidden/, "overflow:hidden on the root would break position:sticky")
assert.match(css[1], /\.mpt-sky\{position:sticky;top:0;height:var\(--mpt-h\);margin-bottom:calc\(var\(--mpt-h\) \* -1\)/, "the sky is a sticky stage of definite height that takes no room")
assert.match(css[1], /\.mpt-sky\{[^}]*background:radial-gradient/, "and is painted even without WebGL")
assert.match(css[1], /\.mpt-hero\{[^}]*min-height:max\(var\(--mpt-h\),600px\)/, "the hero has a definite height")
assert.match(css[1], /\.mpt-header\{position:sticky;top:0;z-index:30;height:0\}/, "the header floats over the hero without pushing it down")
for (const m of css[1].matchAll(/([.\w>*\s,:()-]+)\{[^}]*\bheight:100%/g)) assert.match(m[0], /position:absolute|inset:0/, `a percentage height only on absolutely placed layers: ${m[1].trim()}`)
assert.match(css[1], /\.mpt-ptext\{height:auto/, "pixel text keeps its own aspect")
assert.match(css[1], /\.mpt-h1 \.mpt-ptext\{width:min\(calc\(var\(--mpt-pxs\) \* var\(--w\)\),calc\(min\(100cqi - 32px,1100px\) \* var\(--w\) \/ var\(--wmax\)\)\)\}/, "headline lines share one pixel size and never outgrow the hero")
assert.match(css[1], /@media \(max-width:760px\)\{/, "a designed phone layout")
assert.match(css[1], /\.mpt-burger\{display:grid\}/, "with a menu button")
assert.match(css[1], /\.mpt-sheet\[data-open="true"\]\{grid-template-rows:1fr;pointer-events:auto\}/, "that unfolds a sheet")
assert.match(css[1], /\.mpt-root\[data-motion="reduced"\] \*\{animation:none/, "reduced motion stops the CSS loops")
assert.match(css[1], /@media \(prefers-reduced-motion:reduce\)\{/, "even before the JS has read the preference")
assert.match(css[1], /:focus-visible\{outline:2px solid var\(--mpt-a2\)/, "visible keyboard focus")

/* ---------- the sky ---------- */

assert.match(src, /canvas\.getContext\("webgl"/, "the backgrounds are one WebGL shader")
assert.match(src, /const canvas = document\.createElement\("canvas"\)/, "a fresh canvas per mount, so StrictMode's remount never inherits a lost context")
assert.match(src, /loseContext\(\)/, "the context is released on unmount")
assert.match(src, /root\.dataset\.sky = "fallback"/, "and a page without WebGL keeps the CSS sky")
const frag = src.match(/const FRAG = `([\s\S]*?)`/)
assert.ok(frag, "fragment shader present")
for (const fn of ["vec3 mosaic(", "vec3 prism(", "vec3 waves("]) assert.ok(frag[1].includes(fn), `shader mode ${fn}`)
assert.match(frag[1], /float w = smoothstep\(thr - 0\.06, thr \+ 0\.06, k \* 1\.12 - 0\.06\)/, "sections re-tile into each other cell by cell instead of fading")
assert.match(src, /if \(reduced && !state\.dirty\) return/, "reduced motion draws the sky only when the scroll changes it")
assert.match(src, /new IntersectionObserver\(/, "and nothing draws while the page is off screen")

/* ---------- motion that cleans up after itself ---------- */

assert.match(src, /gsap\.registerPlugin\(ScrollTrigger\)/)
assert.match(src, /const ctx = gsap\.context\(\(self\) => \{/, "every tween and trigger lives in one context")
assert.match(src, /ctx\.revert\(\)/, "and is reverted on unmount")
assert.match(src, /function findScroller\(/, "it scrolls with whatever scrolls the host, not just the window")
assert.match(src, /new ResizeObserver\(/, "late layout changes re-measure the triggers")
assert.match(src, /if \(!R\) \{\n\s+\/\/ intro/, "the intro and every scrub only run without reduced motion")
assert.doesNotMatch(src.slice(src.indexOf("const ctx = gsap.context"), src.indexOf("}, root)")), /gsap\.from\(|^\s+\.from\(/m, "entrances are fromTo, so a remount can never record a half-played state as the end")
assert.match(src, /toggleClass: \{ targets: headerRef\.current as Element, className: "is-scrolled" \}/, "the header turns to glass once the page moves")
assert.match(src, /onToggle: \(st\) => \{\n\s+if \(st\.isActive\) setActive\(name\)/, "the nav pill follows the section in view")
assert.match(src, /gsap\.to\(p\.el, \{ attr: \{ x: p\.x \+ nx \* push/, "headline pixels step aside from the pointer by attribute, so they never fight the transform tweens")
assert.match(src, /removeEventListener\("pointermove", onMove\)/, "and the listener goes with the context")

/* ---------- the composer is real UI ---------- */

assert.match(src, /e\.key === "Enter" && !e\.shiftKey && !e\.nativeEvent\.isComposing/, "Enter sends, Shift+Enter breaks the line, IME composition is left alone")
assert.match(src, /role="radiogroup" aria-label="What are you building\?"/, "platform chips are a radio group")
assert.match(src, /aria-haspopup="menu"/, "the model picker is a menu button")
assert.match(src, /role="menuitemradio"/, "with radio items")
assert.match(src, /if \(e\.key === "Escape"\)/, "that closes on Escape")
assert.match(src, /type="file"\n\s+multiple/, "attachments use a real file input")
assert.match(src, /role="status" aria-live="polite"/, "the build log is announced")
assert.match(src, /onSubmit\?\.\(\{ prompt: text/, "the prompt is handed to onSubmit")
assert.match(src, /el\.setAttribute\("inert", ""\)/, "the closed phone menu is out of the tab order")
assert.match(src, /<span className="mpt-sr">\{headline\.join\("\. "\)\}<\/span>/, "the pixel headline has real text for screen readers")

/* ---------- logic ---------- */

const code = region("pixel-font") + region("app-name") + "\nexport { GLYPHS }\n"
const L = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(code)))

for (const [ch, g] of Object.entries(L.GLYPHS)) {
  const rows = g.split("/")
  assert.ok(rows.length >= 7 && rows.length <= 8, `glyph ${ch} is 7 rows, or 8 with a descender`)
  assert.ok(rows.every((r) => r.length === rows[0].length), `glyph ${ch} rows are the same width`)
  assert.match(g, /^[.#/]+$/, `glyph ${ch} uses only . and #`)
  assert.ok(g.includes("#"), `glyph ${ch} lights something`)
}
for (const ch of "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789") assert.ok(L.GLYPHS[ch], `glyph ${ch} exists`)
for (const ch of "gjpqy") assert.equal(L.GLYPHS[ch].split("/").length, 8, `${ch} descends`)
assert.equal(L.GLYPHS["."].split("/")[6], "#", "the full stop sits on the baseline")

const defaults = ["Describe an app", "We'll build it", "Built to ship", "Simple plans", "Frameloom", "Describe the tool", "Ship it by lunch", "Less glue", "Per team", "Foundry"]
for (const line of defaults) for (const ch of line) assert.ok(ch === " " || L.GLYPHS[ch], `"${ch}" in "${line}" has a glyph`)

const one = L.layoutPixels("I")
assert.equal(one.width, 3, "a lone I is three columns")
assert.equal(one.height, 8)
const two = L.layoutPixels("II")
assert.equal(two.width, 7, "one blank column between glyphs")
assert.equal(L.layoutPixels("I I").width, 10, "a space is three more columns")
assert.equal(L.layoutPixels("I~I").width, 10, "an unknown character becomes a space, not a crash")
assert.deepEqual(L.layoutPixels("w").glyphs.length, 1, "lowercase has its own glyphs")
assert.ok(L.layoutPixels("x").glyphs[0].cells.every(([, y]) => y >= 2), "x-height letters start at row 3")
assert.ok(L.layoutPixels("p").glyphs[0].cells.some(([, y]) => y === 7), "p reaches the descender row")
const head1 = L.layoutPixels("Describe an app")
const head2 = L.layoutPixels("We'll build it")
assert.ok(head1.width > head2.width, "the first line is the wider one, so the second centres under it")
assert.ok(head1.glyphs.reduce((n, g) => n + g.cells.length, 0) < 600, "the headline stays a few hundred pixels: cheap to animate")

assert.equal(L.appNameFrom("A habit tracker with streaks and gentle reminders"), "Habit Tracker")
assert.equal(L.appNameFrom("Build me a booking app for a small yoga studio"), "Booking Yoga")
assert.equal(L.appNameFrom("I want an app that sorts groceries!"), "Sorts Groceries")
assert.equal(L.appNameFrom("the a an"), "Untitled", "a prompt of filler still names something")
assert.equal(L.appNameFrom("  "), "Untitled")

/* ---------- demos ---------- */

const demos = ["demo.tsx", "demo-ember.tsx"].map(read)
for (const d of demos) {
  assert.match(d, /from "@\/components\/ui\/mosaic-prompt-template"/, "demos import the installed path")
  assert.doesNotMatch(d, /h-full|https?:\/\//, "demos stay install-safe")
}
assert.match(demos[1], /accent="ember"/, "the second demo shows the accent prop")

console.log("mosaic-prompt-template: ok")
