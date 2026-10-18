// Install-safety and logic checks for components/blossom-dusk-template.
// Run: node tests/blossom-dusk-template.test.mjs
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const SLUG = "blossom-dusk-template"
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
assert.doesNotMatch(src, /https?:\/\//, "no URLs at all, so it renders in the capture sandbox")
assert.ok(src.includes('height = "100svh"'), "height defaults to a definite length")
assert.match(src, /"--bdt-h": height/, "the height prop reaches the root")
assert.match(src, /\.bdt-hero\{[^}]*min-height:var\(--bdt-h\)/, "and sets the hero's floor")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")
for (const m of src.matchAll(/([^{}]+)\{[^}]*\bheight:100%/g))
  assert.match(m[1].trim(), /^\.bdt-(layer|petals|photo|wheel-svg|stage-svg)$/, `percentage height on ${m[1].trim()}`)
assert.match(src, /\.bdt-bough\{[^}]*aspect-ratio:1000\/720/, "the bough boxes size from their width, not a parent height")
assert.match(src, /<img className="bdt-photo"[^>]*width=\{1920\} height=\{1080\}/, "the optional photo has explicit dimensions")
assert.match(src, /React\.useId\(\)\.replace/, "svg ids are namespaced per instance")
assert.doesNotMatch(src.slice(0, src.indexOf("</")), /use(State|Ref|Memo|Callback)<|Partial<|Record<|React\.[A-Za-z]+</, "no generics before the JSX (21st CLI tokenizer)")
assert.doesNotMatch(src, /use(State|Ref|Memo|Callback)</, "hooks are typed without <generics>")
assert.match(src, /matchMedia\("\(prefers-reduced-motion: reduce\)"\)/, "reduced motion is read in JS (petals, sway, count-ups, scrolling)")
assert.match(src, /if \(reduced\) \{\n\s+\/\/ still life/, "under reduced motion the canopy is painted once, still")

const css = src.match(/const BDT_CSS = `([\s\S]*?)`/)
assert.ok(css, "CSS block present")
assert.doesNotMatch(css[1], /\$\{|`/, "no interpolation inside the CSS string")
assert.doesNotMatch(css[1], /url\(/, "no url() in the style block")
assert.ok(css[1].includes("prefers-reduced-motion:reduce"), "honours reduced motion in CSS")
for (const m of css[1].replace(/\/\*[\s\S]*?\*\//g, "").replace(/@media[^{]*\{/g, "").replace(/@keyframes[^{]*\{/g, "").matchAll(/(?<=^|[{}])\s*([^{}@]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (/^(from|to|[\d.,%\s]+)$/.test(sel)) continue
  for (const s of sel.split(/,(?![^(]*\))/)) assert.match(s.trim(), /^\.bdt-/, `selector escapes the component: ${s.trim()}`)
}
assert.match(css[1], /\.bdt-svg\{display:block;max-width:none/, "svgs are guarded against Preflight")
assert.match(css[1], /\.bdt-layer\{[^}]*max-width:none/, "so are the bough canvases")
assert.match(css[1], /\.bdt-petals\{[^}]*max-width:none/, "and the petal canvas")
assert.match(css[1], /\.bdt-root :where\(button\)\{/, "the reset has no specificity to fight")
assert.match(css[1], /\.bdt-root\{[^}]*overflow-x:clip/, "the root clips sideways without breaking the sticky nav")
assert.doesNotMatch(css[1], /\.bdt-root\{[^}]*overflow:hidden/, "overflow:hidden on the root would break the sticky nav")
assert.match(css[1], /\.bdt-nav\{position:sticky/, "the nav sticks")
assert.match(css[1], /\.bdt-petals\{[^}]*pointer-events:none/, "petals never eat clicks")

/* ---------- it behaves like a landing page ---------- */

for (const k of ["top", "connect", "automate", "stories", "pricing", "faq", "start"]) assert.ok(src.includes(`data-sec="${k}"`), `section ${k} is addressable`)
assert.match(src, /scrollIntoView\(\{ behavior: reduced \? "auto" : "smooth", block: "start" \}\)/, "in-page links scroll, instantly under reduced motion")
assert.match(src, /if \(key === "demo"\)/, "#demo opens the walkthrough instead of scrolling")
assert.match(src, /emailRef\.current\?\.focus/, "Get started lands in the email field")
assert.match(src, /aria-expanded=\{isOpen\}/, "nav menus are disclosures")
assert.match(src, /e\.key === "Escape"\) \{\n\s+setOpen\(-1\)\n\s+btn\.current\?\.focus\(\)/, "Escape closes a menu and returns focus")
assert.match(src, /role="dialog" aria-modal="true"/, "the demo is a modal dialog")
assert.match(src, /role="slider"/, "its scrubber is a slider")
assert.match(src, /role="switch" aria-checked=\{on\[sel\]\}/, "integrations connect with a switch")
assert.match(src, /role="switch"\n\s+aria-checked=\{done\[i\]\}/, "busywork rows are switches")
assert.match(src, /nextIndex\(i, e\.key, list\.length\)/, "arrow keys move around the wheel")
assert.match(src, /if \(res === false\) ok = false/, "onGetStarted can refuse")
assert.match(src, /isEmail\(email\)/, "the form validates before sending")
assert.match(src, /alive\.current = true\n/, "the unmount guard survives strict mode's double mount")
assert.match(src, /new IntersectionObserver\(\(\[e\]\) => \{\n\s+visible = e\.isIntersecting/, "the canopy loop sleeps off screen")
assert.match(src, /document\.addEventListener\("visibilitychange", onVis\)/, "and in a hidden tab")
assert.match(src, /t\.closest\("a,button,input,textarea,select,label,\[role=dialog\]"\)/, "clicking a control never shakes the boughs")
assert.ok(read("demo.tsx").includes("<BlossomDuskTemplate />"), "default demo is the component, full bleed")
assert.doesNotMatch(read("demo.tsx"), /<div/, "default demo has no wrapper")
assert.match(read("demo-custom.tsx"), /palette="dawn"/, "the custom demo reprints the page")
assert.doesNotMatch(read("demo-custom.tsx"), /="[^"]*\\n/, "no \\n inside a JSX string attribute (it would print literally)")
assert.doesNotMatch(read("demo-custom.tsx"), /https?:\/\//, "the custom demo stays capture-safe too")

/* ---------- logic, executed ---------- */

const code = region("content") + region("logic") +
  "\nexport { PALETTES, DEFAULT_INTEGRATIONS, DEFAULT_TASKS, DEFAULT_TIERS, BOUGH_W, BOUGH_H, clamp, easeOutCubic, mulberry32, growBough, petalPath, priceFor, hoursBack, teamSplit, formatStat, eventText, clockText, isEmail, nextIndex, spoke, mix, resolvePalette }\n"
const L = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(code)))

assert.equal(L.easeOutCubic(0), 0)
assert.equal(L.easeOutCubic(1), 1)
assert.equal(L.easeOutCubic(2), 1, "clamped")

// the canopy: deterministic, inside its box, and actually in bloom
const a = L.growBough(7)
assert.deepEqual(L.growBough(7), a, "a seed always grows the same bough, so server and client agree")
assert.notDeepEqual(L.growBough(8).blooms, a.blooms, "and another seed grows another")
const flowers = a.blooms.filter((b) => b.kind === 0)
assert.ok(flowers.length > 40, `a bough is in bloom (${flowers.length} flowers)`)
assert.ok(a.blooms.some((b) => b.kind === 1), "with buds")
assert.ok(a.branches.length > 8, "and limbs")
for (const b of a.branches) {
  assert.ok(b.pts.length >= 3, "no stub limbs")
  for (const [x, y] of b.pts) assert.ok(x <= L.BOUGH_W - 90 && y <= L.BOUGH_H - 80, "limbs never reach a canvas edge, so none is cut off")
  assert.ok(b.w1 < b.w0, "limbs taper")
}
for (const f of a.blooms) {
  assert.ok(f.x < L.BOUGH_W && f.y < L.BOUGH_H, "blooms stay on the canvas")
  if (f.kind === 0) assert.ok(f.tilt > 0.4 && f.tilt <= 1 && f.r > 10, "flowers are tilted in space, not edge-on")
}
for (let i = 1; i < a.blooms.length; i++) assert.ok(a.blooms[i - 1].r * a.blooms[i - 1].tilt <= a.blooms[i].r * a.blooms[i].tilt, "far flowers paint first")
assert.ok(L.growBough(7, { density: 0.5 }).blooms.length < a.blooms.length, "density thins it")

const petal = L.petalPath(1, 0.82)
assert.match(petal, /^M0 0C.*Q.*Q.*C.*Z$/, "a petal: two flanks and a notched tip")
assert.equal(L.petalPath(10, 8), L.petalPath(10, 8))

// pricing
const [starter, growth, custom] = L.DEFAULT_TIERS
assert.equal(L.priceFor(starter, 3, false), 49, "included connections cost nothing extra")
assert.equal(L.priceFor(starter, 1, false), 49, "fewer than included is still the base")
assert.equal(L.priceFor(starter, 20, false), 49 + 17 * 12)
assert.equal(L.priceFor(growth, 20, false), 189 + 10 * 9)
assert.equal(L.priceFor(growth, 10, true), Math.round(189 * 0.8), "yearly is 20% off")
assert.equal(L.priceFor(custom, 30, true), null, "custom tiers have no price")
for (let n = 1; n <= 30; n++) assert.ok(L.priceFor(growth, n, false) >= L.priceFor(growth, n - 1 || 1, false), "never cheaper for more")

// busywork
const T = L.DEFAULT_TASKS
assert.equal(L.hoursBack(T, T.map(() => false)), 0)
assert.equal(L.hoursBack(T, T.map(() => true)), T.reduce((s, t) => s + t.hours, 0))
assert.equal(L.hoursBack([{ hours: 0.1 }, { hours: 0.2 }], [true, true]), 0.3, "no float dust")
const split = L.teamSplit(T, T.map((_, i) => i === 1))
assert.deepEqual(split.map((r) => r.team), ["Clinicians", "Front desk", "Billing", "Operations"], "teams in first-seen order")
assert.equal(split.reduce((s, r) => s + r.manual + r.auto, 0), T.reduce((s, t) => s + t.hours, 0), "every hour is on a bar")
assert.equal(split.find((r) => r.team === "Front desk").auto, 4)

assert.equal(L.formatStat({ value: 2400, suffix: "+", label: "" }, 2400), "2,400+")
assert.equal(L.formatStat({ value: 99.99, suffix: "%", decimals: 2, label: "" }, 99.99), "99.99%")
assert.equal(L.formatStat({ value: 5, prefix: "$", label: "" }, 4.6), "$5")

assert.equal(L.eventText("Chart # updated", 3), L.eventText("Chart # updated", 3), "event ids are stable")
assert.match(L.eventText("Chart # updated", 3), /^Chart #\d{4} updated$/)
assert.equal(L.eventText("No marker", 3), "No marker")

assert.equal(L.clockText(0), "0:00")
assert.equal(L.clockText(17.9), "0:17")
assert.equal(L.clockText(75), "1:15")
assert.equal(L.clockText(-3), "0:00")

assert.ok(L.isEmail("ana@clinic.com"))
assert.ok(L.isEmail("  ana@clinic.health "))
assert.ok(!L.isEmail("ana@clinic"))
assert.ok(!L.isEmail("ana clinic.com"))

assert.equal(L.nextIndex(7, "ArrowRight", 8), 0, "wraps forward")
assert.equal(L.nextIndex(0, "ArrowLeft", 8), 7, "wraps back")
assert.equal(L.nextIndex(3, "Home", 8), 0)
assert.equal(L.nextIndex(3, "End", 8), 7)
assert.equal(L.nextIndex(3, "x", 8), 3)

assert.deepEqual(L.spoke(0, 10), [0, -10], "spoke 0 points up")
assert.deepEqual(L.spoke(2, 10), [10, 0], "spoke 2 points right")
assert.deepEqual(L.spoke(4, 10, 50, 50), [50, 60], "spoke 4 points down")

assert.equal(L.mix("#000000", "#ffffff", 0), "#000000")
assert.equal(L.mix("#000000", "#ffffff", 1), "#ffffff")
assert.equal(L.mix("#000000", "#ffffff", 0.5), "#808080")
assert.equal(L.mix("#ff0000", "#0000ff", 2), "#0000ff", "clamped")

assert.equal(L.resolvePalette("dawn").petal[0], L.PALETTES.dawn.petal[0])
assert.equal(L.resolvePalette({ accent: "#ff0000" }).accent, "#ff0000", "a partial palette overrides")
assert.equal(L.resolvePalette({ accent: "#ff0000" }).night, L.PALETTES.dusk.night, "and falls back to dusk")
assert.equal(L.resolvePalette(undefined).paper, L.PALETTES.dusk.paper)
for (const [name, p] of Object.entries(L.PALETTES))
  for (const [k, v] of Object.entries(p)) for (const c of [v].flat()) assert.match(c, /^#[0-9a-f]{6}$/i, `${name}.${k} is a hex colour (the painter blends them)`)
assert.equal(L.DEFAULT_INTEGRATIONS.length, 8, "one integration per spoke")
for (const x of L.DEFAULT_INTEGRATIONS) assert.ok(x.events.every((e) => e.includes("#")), `${x.name} events carry a record number`)

console.log("blossom-dusk-template: ok")
