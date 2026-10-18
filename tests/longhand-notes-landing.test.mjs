// Install-safety and logic checks for components/longhand-notes-landing.
// Run: node tests/longhand-notes-landing.test.mjs
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const SLUG = "longhand-notes-landing"
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
assert.doesNotMatch(src, /@import|@font-face|<link\b|fetch\(|new Image\(|<img\b/, "nothing loads at runtime")
assert.doesNotMatch(src, /https?:\/\//, "no URLs at all, so it renders in the capture sandbox")
assert.ok(src.includes('height = "100svh"'), "height defaults to a definite length")
assert.match(src, /"--lnh-h": height/, "the height prop reaches the root")
assert.match(src, /\.lnh-root\{[^}]*min-height:var\(--lnh-h\)/, "and sets its floor")
assert.match(src, /\.lnh-hero\{[^}]*min-height:clamp\(640px,calc\(var\(--lnh-h\) - var\(--lnh-nav\)\),920px\)/, "the hero has a definite height")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")
assert.doesNotMatch(src, /height:100%/, "no percentage heights anywhere")
assert.match(src, /React\.useId\(\)\.replace/, "ids are namespaced per instance")
assert.doesNotMatch(src.slice(0, src.indexOf("</")), /use(State|Ref|Memo|Callback)<|Partial<|Record<|Array<|Map<|React\.[A-Za-z]+<|\[K in /, "no generics before the JSX (21st CLI tokenizer)")
assert.doesNotMatch(src, /use(State|Ref|Memo|Callback)</, "hooks are typed without <generics>")
assert.match(src, /matchMedia\("\(prefers-reduced-motion: reduce\)"\)/, "reduced motion is read in JS (the arms, the scroll path)")
assert.doesNotMatch(src, /[—–]/, "no em or en dashes anywhere")
assert.doesNotMatch(src, />[^<{]*\\u[0-9a-f]{4}/i, "no \\u escapes inside JSX text (they print literally)")
assert.ok(src.includes("SIL Open"), "the hands are credited under their licence")

const css = src.match(/const LNH_CSS = `([\s\S]*?)`/)
assert.ok(css, "CSS block present")
assert.doesNotMatch(css[1], /\$\{|`/, "no interpolation inside the CSS string")
assert.doesNotMatch(css[1], /url\(/, "no url() in the style block")
assert.ok(css[1].includes("prefers-reduced-motion:reduce"), "honours reduced motion in CSS")
for (const m of css[1].replace(/\/\*[\s\S]*?\*\//g, "").replace(/@media[^{]*\{/g, "").replace(/@keyframes[^{]*\{/g, "").matchAll(/(?<=^|[{}])\s*([^{}@]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (/^(from|to|[\d.,%\s]+)$/.test(sel)) continue
  for (const s of sel.split(/,(?![^(]*\))/)) assert.match(s.trim(), /^\.lnh-/, `selector escapes the component: ${s.trim()}`)
}
assert.match(css[1], /\.lnh-root :where\(svg\)\{display:block;max-width:none\}/, "svgs are guarded against Preflight")
assert.match(css[1], /\.lnh-root :where\(button,input,textarea,select\)\{/, "the reset has no specificity to fight")
assert.match(css[1], /\.lnh-root\{[^}]*overflow-x:clip/, "the root clips sideways without breaking the sticky nav")
assert.doesNotMatch(css[1], /\.lnh-root\{[^}]*overflow:hidden/, "overflow:hidden on the root would break the sticky nav")
assert.match(css[1], /\.lnh-nav\{position:sticky/, "the nav sticks")
assert.match(css[1], /\.lnh-root\[data-theme="dark"\]\{/, "a designed dark theme")
assert.match(css[1], /\.lnh-written \.lnh-stroke\{stroke-dasharray:1 1;visibility:hidden\}/, "unwritten strokes stay hidden until the pen reaches them")

/* ---------- it behaves like a product page ---------- */

for (const k of ["write", "how", "cards", "integrations", "pricing", "stories", "faq", "samples"]) assert.ok(src.includes(`data-sec="${k}"`), `section ${k} is addressable`)
assert.match(src, /scrollIntoView\(\{ behavior: reduced \? "auto" : "smooth", block: "start" \}\)/, "in-page links scroll, instantly under reduced motion")
assert.match(src, /role="tablist" aria-label="Card category"/, "card categories are a tablist")
assert.match(src, /role="tablist" aria-label="Triggers"/, "so are the integration triggers")
assert.equal((src.match(/nextIndex\(i, e\.key, /g) || []).length, 2, "and arrow keys move through both")
assert.match(src, /if \(res === false\) ok = false/, "onSend and onRequestSamples can refuse")
assert.match(src, /isEmail\(email\)/, "the samples form validates before sending")
assert.match(src, /aria-expanded=\{on\}/, "questions are disclosures")
assert.match(src, /aria-modal="true"/, "the phone menu is a modal dialog")
assert.match(src, /e\.key === "Escape"/, "Escape closes menus")
assert.match(src, /sharedPrefix\(s\.prev, strokes\)/, "the arm keeps what is already written and only writes what changed")
assert.match(src, /setDraft\(\{ greet, msg, sign \}\), 380\)/, "typing is debounced before the arm moves")
assert.match(src, /const chalk = card\.stock === "chalk"/, "chalk cards switch the ink to white")
assert.match(src, /useOnScreen\(stageRef\)/, "the hero arm only runs on screen")
assert.match(src, /if \(!L\.active\) \{/, "and every arm sleeps off screen")
assert.ok(read("demo.tsx").includes("<LonghandNotesLanding />"), "default demo is the component, full bleed")
assert.doesNotMatch(read("demo.tsx"), /<div/, "default demo has no wrapper")
assert.match(read("demo-fountain.tsx"), /palette="fountain"/, "the second demo reprints the page in another palette")
assert.doesNotMatch(read("demo-fountain.tsx"), /https?:\/\//, "and stays capture-safe")

/* ---------- logic, executed ---------- */

const code = region("content") + region("glyphs") + region("logic") +
  "\nexport { HANDS, PALETTES, DEFAULT_PRODUCTS, DEFAULT_TIERS, DEFAULT_RECIPES, decodeGlyph, glyph, cleanText, layoutText, fitLayout, joinStrokes, pointAt, sharedPrefix, solveArm, apply, placeMatrix, tierFor, nextTier, unitPrice, lowestPrice, money, qtyFromSlider, sliderFromQty, fillMerge, isEmail, nextIndex, writeSeconds, resolvePalette, PACES }\n"
const L = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(code)))

// every hand covers printable ASCII, and every glyph decodes to finite strokes inside a sane box
for (const hand of ["script", "casual", "playful"]) {
  assert.equal(L.HANDS[hand].length, 95, hand + " has 95 glyphs")
  for (let c = 33; c <= 126; c++) {
    const g = L.glyph(hand, c)
    assert.ok(g.adv > 0 && g.adv < 2000, `${hand} ${String.fromCharCode(c)} advance`)
    assert.ok(g.strokes.length > 0, `${hand} ${String.fromCharCode(c)} has ink`)
    for (const s of g.strokes) {
      assert.equal(s.length % 2, 0)
      for (const v of s) assert.ok(Number.isFinite(v) && v > -1200 && v < 1600, `${hand} ${String.fromCharCode(c)} in the box`)
    }
  }
  assert.equal(L.glyph(hand, 32).strokes.length, 0, "space is blank")
}
// closed loops survive the encoding (an "o" is a loop, not a dot)
for (const hand of ["script", "casual", "playful"]) {
  const o = L.glyph(hand, "o".charCodeAt(0))
  const pts = o.strokes.flat()
  const xs = pts.filter((_, i) => i % 2 === 0)
  assert.ok(Math.max(...xs) - Math.min(...xs) > 120, hand + " o has width")
}

// text cleaning: what a plotter can write
assert.equal(L.cleanText("Café “nice” — it’s…"), 'Cafe "nice" - it\'s...')
assert.equal(L.cleanText("hi \u{1F600}!"), "hi !")

// layout wraps to the box, aligns right, and is stable for an unchanged prefix
const lay = L.layoutText([{ text: "The tulip bulbs came up all at once and the whole street is jealous." }, { text: "Ravi", align: "right" }], "script", 30, 400)
assert.ok(lay.width <= 400 + 1e-6, "wraps inside the width")
for (const s of lay.strokes) {
  for (let k = 0; k < s.pts.length; k += 2) assert.ok(s.pts[k] > -20 && s.pts[k] < 420, "no stroke escapes sideways")
  assert.ok(s.len > 0 && s.cum.length === s.pts.length / 2)
}
const sig = lay.strokes.filter((s) => s.ci >= 68)
assert.ok(Math.max(...sig.flatMap((s) => s.pts.filter((_, i) => i % 2 === 0))) > 370, "the sign-off sits on the right")
const a = L.layoutText([{ text: "Dear Odile, thanks" }], "casual", 26, 480).strokes
const b = L.layoutText([{ text: "Dear Odile, thanks for coming" }], "casual", 26, 480).strokes
const shared = L.sharedPrefix(a, b)
assert.equal(shared, a.length, "typing more keeps every stroke already written")
const c = L.layoutText([{ text: "Dear Odle, thanks" }], "casual", 26, 480).strokes
assert.ok(L.sharedPrefix(a, c) > 0 && L.sharedPrefix(a, c) < a.length, "an edit mid-way rewrites from the edit on")

// fitting shrinks long notes
const long = "word ".repeat(80)
const fit = L.fitLayout([{ text: long }], "script", 484, 314, [30, 27, 24, 21, 19, 17, 15])
assert.ok(fit.size < 30, "long notes get a smaller size")
const short = L.fitLayout([{ text: "Hi!" }], "script", 484, 314, [30, 27, 24])
assert.equal(short.size, 30, "short notes keep the largest")

// pointAt walks the stroke
const st = lay.strokes[3]
const p0 = L.pointAt(st, 0, [0, 0])
const p1 = L.pointAt(st, st.len, [0, 0])
assert.deepEqual(p0, [st.pts[0], st.pts[1]])
assert.deepEqual(p1, [st.pts[st.pts.length - 2], st.pts[st.pts.length - 1]])

// two-link IK reaches reachable targets exactly and clamps the rest
for (const [tx, ty] of [[100, 300], [400, 420], [250, 150], [10, 200]]) {
  const s = L.solveArm(360, 60, 250, 230, tx, ty, -1)
  const x = s.ex + 230 * Math.cos(s.a2)
  const y = s.ey + 230 * Math.sin(s.a2)
  assert.ok(Math.hypot(x - tx, y - ty) < 1e-6, "tip lands on the target")
  assert.ok(Math.abs(Math.hypot(s.ex - 360, s.ey - 60) - 250) < 1e-6, "upper arm keeps its length")
  const flip = L.solveArm(360, 60, 250, 230, tx, ty, 1)
  assert.ok(Math.hypot(flip.ex - s.ex, flip.ey - s.ey) > 1, "bend picks the other elbow")
}
const far = L.solveArm(0, 0, 100, 100, 1000, 0, 1)
assert.equal(far.reach, false)
assert.ok(Math.abs(far.a2) < 0.05, "out of reach, the forearm still points at it")
const M = L.placeMatrix(10, 20, 90)
const q = L.apply(M, 5, 0, [0, 0])
assert.ok(Math.abs(q[0] - 10) < 1e-9 && Math.abs(q[1] - 25) < 1e-9, "matrix rotates then translates")

// pricing
assert.equal(L.tierFor(1, L.DEFAULT_TIERS).off, 0)
assert.equal(L.tierFor(249, L.DEFAULT_TIERS).off, 0.1)
assert.equal(L.tierFor(250, L.DEFAULT_TIERS).off, 0.18)
assert.equal(L.tierFor(10000, L.DEFAULT_TIERS).off, 0.25)
assert.equal(L.nextTier(250, L.DEFAULT_TIERS).min, 1000)
assert.equal(L.nextTier(5000, L.DEFAULT_TIERS), null)
assert.equal(L.lowestPrice(L.DEFAULT_PRODUCTS, L.DEFAULT_TIERS), 2.55, "the hero's 'from $2.55' is computed, not typed")
assert.equal(L.unitPrice(3.4, 250, L.DEFAULT_TIERS, 0.73).toFixed(2), "3.52")
assert.equal(L.money(1234567.5, "$"), "$1,234,567.50")
assert.equal(L.money(2.4, "€"), "€2.40")
for (let p = 0; p <= 1000; p += 25) {
  const n = L.qtyFromSlider(p)
  assert.ok(n >= 1 && n <= 10000 && Number.isInteger(n))
  if (p) assert.ok(n >= L.qtyFromSlider(p - 25), "the slider never runs backwards")
}
assert.equal(L.qtyFromSlider(0), 1)
assert.equal(L.qtyFromSlider(1000), 10000)
assert.equal(L.sliderFromQty(10000), 1000)
assert.ok(Math.abs(L.qtyFromSlider(L.sliderFromQty(250)) - 250) <= 25, "and round-trips")

// merge fields
const parts = L.fillMerge("Hi {first_name}, thanks for {company}.", { first_name: "Jordan", company: "Harbor & Pine" })
assert.deepEqual(parts.map((p) => p.text).join(""), "Hi Jordan, thanks for Harbor & Pine.")
assert.deepEqual(parts.filter((p) => p.hi).map((p) => p.text), ["Jordan", "Harbor & Pine"])
assert.equal(L.fillMerge("{missing}", {})[0].text, "missing", "an unknown field shows its name")
for (const r of L.DEFAULT_RECIPES) for (const m of r.note.matchAll(/\{([a-z_]+)\}/g)) assert.ok(r.sample[m[1]], `${r.id} has a sample for ${m[1]}`)

// small helpers
assert.ok(L.isEmail("ana@studio.co") && !L.isEmail("ana@studio") && !L.isEmail("a b@c.com"))
assert.equal(L.nextIndex(0, "ArrowLeft", 5), 4)
assert.equal(L.nextIndex(4, "ArrowRight", 5), 0)
assert.equal(L.nextIndex(2, "End", 5), 4)
assert.equal(L.nextIndex(2, "a", 5), -1)
assert.equal(L.resolvePalette("postal"), L.PALETTES.postal)
assert.equal(L.resolvePalette({ accent: "#000", second: "#fff" }).onAccent, "#ffffff")
const secs = L.writeSeconds(lay.strokes, 30, L.PACES.pen)
assert.ok(secs > 5 && secs < 60, "a short note takes seconds at pen pace, like a person: " + secs.toFixed(1))

console.log(`ok - ${SLUG}`)
