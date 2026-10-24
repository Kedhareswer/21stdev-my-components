// Install-safety and logic checks for components/tessel-agent-landing.
// Run: node tests/tessel-agent-landing.test.mjs
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const SLUG = "tessel-agent-landing"
const read = (file) => readFileSync(new URL(`../components/${SLUG}/${file}`, import.meta.url), "utf8").replace(/\r\n/g, "\n")
const src = read(`${SLUG}.tsx`)
const region = (name) => {
  const a = src.indexOf(`// #region ${name}\n`)
  const b = src.indexOf(`// #endregion ${name}\n`)
  assert.ok(a > -1 && b > a, `region ${name} missing`)
  return src.slice(a, b)
}
const code = src.replace(region("photos"), "")

/* ---------- nothing travels with it ---------- */

const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react", "gsap", "gsap/ScrollTrigger"], "react and gsap are the only imports")
const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"))
assert.ok(pkg.dependencies.gsap, "gsap is declared at the root")
assert.match(read("README.md"), /Requires `gsap`/, "and noted in the README")
assert.doesNotMatch(code, /@import|@font-face|<link\b|fetch\(|new Image\(/, "nothing loads at runtime")
assert.doesNotMatch(code, /https?:\/\//, "no URLs, so it renders in the capture sandbox")
const photos = [...region("photos").matchAll(/"(data:image\/webp;base64,[A-Za-z0-9+/=]+)"/g)]
assert.equal(photos.length, 4, "one case-study portrait and three avatars are embedded")
assert.ok(region("photos").length < 30000, "and stay small")
assert.ok(region("photos").includes("Unsplash License"), "the photos are credited")
assert.ok(src.includes('height = "100svh"'), "height defaults to a definite length")
assert.match(src, /"--tsl-h": height/, "the height prop reaches the root")
assert.match(src, /\.tsl-hero-panel\{[^}]*min-height:clamp\(420px,calc\(var\(--tsl-h\) \* \.62\),640px\)/, "the hero panel has a definite height")
assert.match(src, /\.tsl-stage\{position:sticky;[^}]*height:clamp\(460px,72vh,620px\)/, "the sticky stage has a definite height")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")
for (const m of src.matchAll(/([.\w>*:-]+)\{[^}]*height:100%/g)) assert.match(m[0], /position:absolute;inset:0/, `a percentage height only on absolutely placed media: ${m[1]}`)
assert.match(src, /canvas\.style\.height = h \+ "px"/, "canvases are sized in pixels, never by percentage")
assert.match(src, /React\.useId\(\)\.replace/, "svg ids are namespaced per instance")
const head = src.slice(0, src.indexOf("</"))
assert.doesNotMatch(head, /use(State|Ref|Memo|Callback)<|Partial<|Record<|Array<|Map<|Promise<|ReturnType<|React\.[A-Za-z]+<|\[K in /, "no generics before the first JSX close tag (21st CLI tokenizer)")
assert.doesNotMatch(src, /use(State|Ref|Memo|Callback)</, "hooks are typed without <generics>")
assert.doesNotMatch(src, /[—–]/, "no em or en dashes")
assert.doesNotMatch(src, />[^<{]*\\u[0-9a-f]{4}/i, "no \\u escapes inside JSX text")
for (const demo of ["demo.tsx", "demo-ember.tsx"]) {
  const d = read(demo)
  assert.doesNotMatch(d, /[—–]|https?:\/\//, `${demo}: no dashes, no URLs`)
  assert.deepEqual([...d.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1]), ["@/components/ui/" + SLUG], `${demo} imports only the component`)
}
assert.ok(read("demo.tsx").includes("<TesselAgentLanding />"), "default demo is the component, full bleed")
assert.match(read("demo-ember.tsx"), /palette="ember"/, "the second demo reprints the page in another palette")

const css = src.match(/const TSL_CSS = `([\s\S]*?)`/)
assert.ok(css, "CSS block present")
assert.doesNotMatch(css[1], /\$\{|`/, "no interpolation inside the CSS string")
assert.doesNotMatch(css[1], /url\(/, "no url() in the style block")
assert.ok(css[1].includes("prefers-reduced-motion:reduce"), "honours reduced motion in CSS")
for (const m of css[1].replace(/\/\*[\s\S]*?\*\//g, "").replace(/@media[^{]*\{/g, "").replace(/@keyframes[^{]*\{/g, "").matchAll(/(?<=^|[{}])\s*([^{}@]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (/^(from|to|[\d.,%\s]+)$/.test(sel)) continue
  for (const s of sel.split(/,(?![^(]*\))/)) assert.match(s.trim(), /^\.tsl-/, `selector escapes the component: ${s.trim()}`)
}
assert.match(css[1], /\.tsl-root :where\(svg,img,canvas\)\{display:block;max-width:none\}/, "media is guarded against Preflight")
assert.match(css[1], /\.tsl-portrait img\{[^}]*max-width:none/, "and the portrait explicitly")
assert.match(css[1], /\.tsl-root\{[^}]*overflow-x:clip/, "the root clips sideways without breaking the sticky nav and stage")
assert.doesNotMatch(css[1], /\.tsl-root\{[^}]*overflow:hidden/, "overflow:hidden on the root would break sticky")
assert.match(css[1], /\.tsl-nav\{position:sticky/, "the nav sticks")
assert.match(css[1], /\.tsl-root\[data-theme="dark"\]\{[^}]*--tsl-btn:#f2f3f6/, "a designed dark theme, with buttons that still read")

/* ---------- it behaves like a product page ---------- */

for (const k of ["top", "problem", "product", "stats", "customers", "pricing", "signup", "footer"]) assert.ok(src.includes(`data-sec="${k}"`), `section ${k} is addressable`)
assert.match(src, /scrollIntoView\(\{ behavior: reduced \? "auto" : "smooth", block: "start" \}\)/, "in-page links scroll, instantly under reduced motion")
assert.match(src, /matchMedia\("\(prefers-reduced-motion: reduce\)"\)/, "reduced motion is read in JS")
assert.match(src, /if \(!root \|\| reduced\) return\n    const ctx = gsap\.context/, "no GSAP choreography under reduced motion")
assert.match(src, /ctx\.revert\(\)/, "GSAP contexts are reverted on unmount")
assert.match(src, /gsap\.registerPlugin\(ScrollTrigger\)/, "ScrollTrigger is registered")
assert.match(src, /ease: "steps\(9\)"/, "the hero mosaic resolves in steps when the page opens")
assert.match(src, /cell: 46, ease: "none", immediateRender: false, scrollTrigger: \{ trigger: "\.tsl-hero-panel"/, "and breaks back up as you scroll past")
assert.match(src, /scrub: true/, "headlines are scrubbed by scroll")
assert.match(src, /mm\.add\("\(min-width: 1024px\)"/, "the scroll-driven stage only runs where there is room")
assert.match(src, /role="tablist" aria-label="Product areas"/, "phones get tabs instead")
assert.match(src, /gsap\.fromTo\(card, \{ height: from \}, \{ height: to/, "the stage card morphs to its new height")
assert.match(src, /ScrollTrigger\.refresh\(\)/, "triggers are refreshed when sections change height")
assert.match(src, /visible && !reduced && !document\.hidden\) start\(\)/, "the mosaic runs only on screen, in a visible tab, without reduced motion")
assert.match(src, /const k = d < R \* 0\.45 \? 4 : 2/, "the pointer loupe splits cells into finer pixels")
assert.match(src, /if \(e < 0\.02 && !ptr\.on\)/, "the footer wordmark sleeps when it settles")
assert.match(src, /touch-action:pan-y/, "the wordmark never traps a phone's scroll")
assert.match(src, /onRun\(prompt, \{ model: m, signal: ctrl\.signal \}\)/, "onRun gets the model and an abort signal")
assert.match(src, /if \(abort\.current\) abort\.current\.abort\(\)/, "stopping or resetting aborts the run")
assert.match(src, /e\.key === "Enter" && !e\.shiftKey/, "Enter runs, Shift+Enter breaks the line")
assert.match(src, /role="listbox" aria-label="Model"/, "the model picker is a listbox")
assert.match(src, /if \(res === false\) ok = false/, "onSignUp can refuse")
assert.match(src, /isEmail\(email\)/, "the sign-up form validates")
assert.match(src, /aria-modal="true"/, "the phone menu is modal")
assert.match(src, /e\.key === "Escape"/, "Escape closes menus")
assert.match(src, /aria-expanded=\{open === i\}/, "problem cards are disclosures on touch")
assert.match(src, /teamEstimate\(seats, runs, annual, p\.price, est, discount\)/, "the featured plan runs the estimator")

/* ---------- logic, executed ---------- */

const L = await import(
  "data:text/javascript," +
    encodeURIComponent(
      stripTypeScriptTypes(
        region("photos") + region("content") + region("logic") +
          "\nexport { PALETTES, DEFAULT_PRICING, hash2, noise2, fbm, fieldAt, hexToRgb, mixHex, buildRamp, darkStops, onColor, resolvePalette, twoTone, toneWords, planFor, teamEstimate, money, compactCount, formatStat, isEmail, nextIndex, shortLabel, pixelSteps, isoPt, isoBox }\n"
      )
    )
)

// noise: bounded, smooth, deterministic
for (let i = 0; i < 2000; i++) {
  const x = i * 0.173
  const y = i * 0.091
  const v = L.noise2(x, y, 3)
  assert.ok(v >= 0 && v <= 1, "noise stays in [0, 1]")
  assert.ok(Math.abs(L.noise2(x + 1e-4, y, 3) - v) < 0.01, "and is continuous")
  assert.ok(L.fbm(x, y, 2) >= 0 && L.fbm(x, y, 2) <= 1)
}
assert.equal(L.hash2(4, 9, 1), L.hash2(4, 9, 1), "hash is deterministic")
assert.notEqual(L.hash2(4, 9, 1), L.hash2(9, 4, 1))

// every scene stays in range, and the hero is brightest where its card sits
for (const scene of ["columns", "silk", "bloom"]) {
  for (let i = 0; i < 400; i++) {
    const v = L.fieldAt(scene, (i * 37) % 1100, (i * 53) % 560, i * 0.1, 1100, 560, i % 3)
    assert.ok(v >= 0 && v <= 1, `${scene} stays in [0, 1]`)
  }
}
let mid = 0
let edge = 0
for (let t = 0; t < 30; t++) {
  mid += L.fieldAt("columns", 550, 280, t, 1100, 560, 0)
  edge += L.fieldAt("columns", 20, 20, t, 1100, 560, 0)
}
assert.ok(mid > edge, "the hero mosaic pools light behind the prompt")
let low = 0
let high = 0
for (let t = 0; t < 30; t++) {
  low += L.fieldAt("bloom", 550, 540, t, 1100, 560, 0)
  high += L.fieldAt("bloom", 550, 20, t, 1100, 560, 0)
}
assert.ok(low > high, "the call to action blooms from the bottom")

// colour
assert.deepEqual(L.hexToRgb("#1b36f2"), [27, 54, 242])
assert.deepEqual(L.hexToRgb("#fff"), [255, 255, 255])
assert.deepEqual(L.hexToRgb("nope"), [128, 128, 128])
assert.equal(L.mixHex("#000000", "#ffffff", 0.5), "#808080")
const r = L.buildRamp(["#000000", "#ffffff"], 3)
assert.deepEqual(r, ["rgb(0,0,0)", "rgb(128,128,128)", "rgb(255,255,255)"])
assert.equal(L.buildRamp(L.PALETTES.cobalt.stops, 28).length, 28)
const ds = L.darkStops(L.PALETTES.cobalt.stops)
assert.equal(ds.length, 4)
assert.equal(ds[1], L.PALETTES.cobalt.stops[0], "the night mosaic steps every stop down one")
assert.equal(L.onColor("#0a0a0b"), "#ffffff")
assert.equal(L.onColor("#ffc4a1"), "#0b0b0c")
assert.equal(L.resolvePalette("ember"), L.PALETTES.ember)
assert.equal(L.resolvePalette(undefined), L.PALETTES.cobalt)
assert.equal(L.resolvePalette("nope"), L.PALETTES.cobalt)
assert.deepEqual(L.resolvePalette({ accent: "#ff0000" }).stops, L.PALETTES.cobalt.stops, "custom palettes fill in from cobalt")
assert.equal(L.resolvePalette({ stops: ["#111111", "#222222", "#333333", "#444444"] }).accent, "#111111", "and take their accent from the deepest stop")

// copy
assert.deepEqual(L.twoTone("Broken pipelines, *siloed teams.*"), [{ text: "Broken pipelines, ", muted: false }, { text: "siloed teams.", muted: true }])
assert.deepEqual(L.toneWords("a *b c*").map((w) => w.word + (w.muted ? "*" : "")), ["a", "b*", "c*"])
assert.equal(L.shortLabel("Triage the support inbox and draft replies"), "Triage the support inbox", "chips cut at a word and drop a dangling 'and'")
assert.equal(L.shortLabel("Short one"), "Short one")
assert.ok(L.shortLabel("Reconcile last month's invoices against bank payouts").length <= 32)

// the agent plans
const support = L.planFor("Triage the support inbox and draft replies")
assert.equal(support.kind, "support")
assert.equal(support.steps.length, 4)
assert.ok(support.steps.every((s) => s.ms >= 650 && s.ms < 1170 && !/\{/.test(s.label)), "steps take a believable time and every blank is filled")
assert.doesNotMatch(support.answer, /\{[a-e]\}/)
assert.equal(L.planFor("Reconcile last month's invoices").kind, "finance")
assert.equal(L.planFor("Write the weekly ops report").kind, "report")
assert.equal(L.planFor("Find 12 leads that look like our best customers").kind, "sales", "customers alone does not mean support")
assert.match(L.planFor("Find 12 leads that look like our best customers").answer, /^Found 12 accounts/, "and the number asked for is honoured")
assert.equal(L.planFor("Rename the staging bucket").kind, "general", "anything else gets the general plan")
assert.deepEqual(L.planFor("same words"), L.planFor("same words"), "a request always plans the same way")

// pricing
const est = L.DEFAULT_PRICING.estimator
const m = L.teamEstimate(5, 5000, false, 49, est)
assert.deepEqual(m, { perSeat: 49, overage: 0, total: 245 }, "five seats inside the included runs")
const a = L.teamEstimate(5, 10000, true, 49, est, 0.2)
assert.equal(a.perSeat, 39.2, "annual takes 20% off the seat")
assert.equal(a.overage, 30, "5,000 extra runs at $6 per thousand")
assert.equal(a.total, 226)
assert.equal(L.teamEstimate(1, 5001, false, 49, est).overage, 6, "a started thousand is billed")
assert.equal(L.teamEstimate(0, 0, false, 49, est).total, 49, "at least one seat")

// formatting
assert.equal(L.money(1234567), "$1,234,567")
assert.equal(L.money(39.2), "$39.20")
assert.equal(L.money(-950, "€"), "-€950")
assert.equal(L.compactCount(950), "950")
assert.equal(L.compactCount(10000), "10k")
assert.equal(L.compactCount(2400000), "2.4M")
assert.equal(L.formatStat(99.95, 2), "99.95")
assert.equal(L.formatStat(2.4, 1), "2.4")
assert.ok(L.isEmail("ada@lumen.co") && !L.isEmail("ada@lumen") && !L.isEmail("a b@c.com"))
assert.equal(L.nextIndex(0, "ArrowLeft", 3), 2)
assert.equal(L.nextIndex(2, "ArrowDown", 3), 0)
assert.equal(L.nextIndex(1, "End", 4), 3)
assert.equal(L.nextIndex(1, "x", 3), -1)

// the portrait resolves through shrinking pixels down to the photo
const seq = L.pixelSteps(48)
assert.equal(seq[0], 48)
assert.equal(seq[seq.length - 1], 1)
for (let i = 1; i < seq.length; i++) assert.ok(seq[i] < seq[i - 1], "pixels only get finer")

// isometric icons
assert.deepEqual(L.isoPt(0, 0, 0), [0, 0])
const [px, py] = L.isoPt(10, 0, 0)
assert.ok(px > 0 && py > 0, "x runs to the lower right")
assert.ok(L.isoPt(0, 10, 0)[0] < 0, "y runs to the lower left")
assert.equal(L.isoPt(0, 0, 10)[1], -10, "z is straight up")
const box = L.isoBox(0, 0, 0, 10, 10, 10)
for (const face of ["top", "left", "right"]) assert.equal(box[face].split(" ").length, 4, `${face} is a quad`)

console.log(`ok - ${SLUG}`)
