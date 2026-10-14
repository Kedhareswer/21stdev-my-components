// Install-safety and logic checks for components/loyly-sauna-landing.
// Run: node tests/loyly-sauna-landing.test.mjs
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const SLUG = "loyly-sauna-landing"
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
assert.match(src, /"--lyl-h": height/, "the height prop reaches the root")
assert.match(src, /\.lyl-root\{[^}]*min-height:var\(--lyl-h\)/, "and sets its floor")
assert.match(src, /\.lyl-hero\{[^}]*min-height:calc\(clamp\(620px,var\(--lyl-h\),1040px\)/, "the hero has a definite height")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")
assert.doesNotMatch(src, /height:100%/, "no percentage heights anywhere")
assert.match(src, /\.lyl-plate\{position:relative;height:clamp\(/, "room plates have a definite height")
assert.match(src, /\.lyl-band\{position:relative;height:clamp\(/, "so does the footer band")
assert.match(src, /React\.useId\(\)\.replace/, "ids are namespaced per instance")
assert.doesNotMatch(src.slice(0, src.indexOf("</")), /use(State|Ref|Memo|Callback)<|Partial<|Record<|React\.[A-Za-z]+</, "no generics before the JSX (21st CLI tokenizer)")
assert.doesNotMatch(src, /use(State|Ref|Memo|Callback)</, "hooks are typed without <generics>")
assert.match(src, /matchMedia\("\(prefers-reduced-motion: reduce\)"\)/, "reduced motion is read in JS (the screen, waves, scrolling)")
assert.doesNotMatch(src, /[\u2014\u2013]/, "no em or en dashes anywhere")
assert.doesNotMatch(src, />[^<{]*\\u[0-9a-f]{4}/i, "no \\u escapes inside JSX text (they print literally)")

const css = src.match(/const LYL_CSS = `([\s\S]*?)`/)
assert.ok(css, "CSS block present")
assert.doesNotMatch(css[1], /\$\{|`/, "no interpolation inside the CSS string")
assert.doesNotMatch(css[1], /url\(/, "no url() in the style block")
assert.ok(css[1].includes("prefers-reduced-motion:reduce"), "honours reduced motion in CSS")
for (const m of css[1].replace(/\/\*[\s\S]*?\*\//g, "").replace(/@media[^{]*\{/g, "").replace(/@keyframes[^{]*\{/g, "").matchAll(/(?<=^|[{}])\s*([^{}@]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (/^(from|to|[\d.,%\s]+)$/.test(sel)) continue
  for (const s of sel.split(/,(?![^(]*\))/)) assert.match(s.trim(), /^\.lyl-/, `selector escapes the component: ${s.trim()}`)
}
assert.match(css[1], /\.lyl-canvas\{[^}]*max-width:none/, "canvases are guarded against Preflight")
assert.match(css[1], /\.lyl-root :where\(button,input\)\{/, "the reset has no specificity to fight")
assert.match(css[1], /\.lyl-root\{[^}]*overflow-x:clip/, "the root clips sideways without breaking the sticky nav")
assert.doesNotMatch(css[1], /\.lyl-root\{[^}]*overflow:hidden/, "overflow:hidden on the root would break the sticky nav")
assert.match(css[1], /\.lyl-nav\{position:sticky/, "the nav sticks")
assert.match(css[1], /\.lyl-root\[data-theme="dark"\]\{/, "a designed dark stock")
assert.match(css[1], /\.lyl-hero>\*:not\(\.lyl-canvas\):not\(\.lyl-marks\)\{position:relative/, "the registration marks stay out of the hero grid")

/* ---------- it behaves like a product page ---------- */

for (const k of ["sessions", "rooms", "ritual", "membership", "visit"]) assert.ok(src.includes(`data-sec="${k}"`), `section ${k} is addressable`)
assert.match(src, /scrollIntoView\(\{ behavior: reduced \? "auto" : "smooth", block: "start" \}\)/, "in-page links scroll, instantly under reduced motion")
assert.match(src, /role="tablist" aria-label="Day"/, "the timetable days are a tablist")
assert.match(src, /nextIndex\(i, e\.key, days\.length\)/, "arrow keys move through them")
assert.match(src, /if \(res === false\) ok = false/, "onBook and onSubscribe can refuse")
assert.match(src, /isEmail\(email\)/, "the newsletter validates before sending")
assert.match(src, /aria-expanded=\{on\}/, "questions are disclosures")
assert.match(src, /aria-live="polite"/, "the steam is announced, not only drawn")
assert.match(src, /className="lyl-btn lyl-solid lyl-throw" onClick=\{\(\) => throwWater\(\)\}/, "throwing water is a real button")
assert.match(src, /if \(waves\.length >= 2\) waves\.shift\(\)/, "waves can't stack into a runaway effect")
assert.match(src, /if \(live && ema > 22 && slow < 8\)/, "a slow renderer coarsens the screen")
assert.match(src, /new IntersectionObserver\(\(es\) => \{\n\s+onScreen =/, "the screen sleeps off screen")
assert.match(src, /quiet="\.lyl-lead p, \.lyl-gauge"/, "the wave keeps clear of the body copy and the phone readout")
assert.match(src, /aria-modal="true"/, "the phone menu is a modal dialog")
assert.match(src, /e\.key === "Escape"/, "Escape closes it")
assert.ok(read("demo.tsx").includes("<LoylySaunaLanding />"), "default demo is the component, full bleed")
assert.doesNotMatch(read("demo.tsx"), /<div/, "default demo has no wrapper")
assert.match(read("demo-klein.tsx"), /ink="klein"/, "the second demo reprints the page in another ink")
assert.doesNotMatch(read("demo-klein.tsx"), /https?:\/\//, "and stays capture-safe")

/* ---------- logic, executed ---------- */

const code = region("content") + region("logic") +
  "\nexport { INKS, DEFAULT_DAYS, DEFAULT_PLANS, DEFAULT_STEPS, clamp, smoothstep, noise2, fbm, heroField, roomField, coolField, quietness, dotStep, canvasRatio, heatLevel, formatPrice, spotsLeft, planPrice, planUnit, monthsFree, isEmail, nextIndex, ritualSegments, resolveInk, WAVE_LIFE }\n"
const L = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(code)))

// noise is smooth, bounded and deterministic
for (let i = 0; i < 400; i++) {
  const x = i * 0.137 - 20
  const y = i * 0.291 + 3
  const n = L.fbm(x, y)
  assert.ok(n >= 0 && n <= 1, "fbm in 0..1")
  assert.equal(n, L.fbm(x, y), "deterministic")
  assert.ok(Math.abs(L.noise2(x, y) - L.noise2(x + 0.001, y)) < 0.01, "continuous")
}

// every field stays in 0..1 for both inks, everywhere
const o = { a: 0, k: 0 }
for (const [w, h] of [[1440, 836], [375, 748], [1920, 1040]]) {
  for (let y = 0; y <= h; y += h / 23) for (let x = 0; x <= w; x += w / 31) {
    L.heroField(x, y, w, h, 3.2, [{ x: w * 0.9, y: h * 0.9, t: 2.6 }], o)
    assert.ok(o.a >= 0 && o.a <= 1 && o.k >= 0 && o.k <= 1, "hero field bounded")
    for (const kind of ["heat", "cold", "rest"]) {
      L.roomField(kind, x, y, w, h, o)
      assert.ok(o.a >= 0 && o.a <= 1 && o.k >= 0 && o.k <= 1, kind + " plate bounded")
    }
    L.coolField(x, y, w, h, o)
    assert.ok(o.a >= 0 && o.a <= 1 && o.k >= 0 && o.k <= 1, "footer band bounded")
  }
}

// the hero composition: paper top-left, heat in the bottom-right corner, stones under it
L.heroField(60, 60, 1440, 836, 0, [], o)
assert.ok(o.k < 0.05, "top-left stays paper (no cold ink)")
L.heroField(300, 120, 1440, 836, 0, [], o)
assert.ok(o.a < 0.05, "and no heat behind the headline's start")
L.heroField(1300, 500, 1440, 836, 0, [], o)
assert.ok(o.a > 0.5, "heat in the right half")
L.heroField(1430, 830, 1440, 836, 0, [], o)
assert.ok(o.k > 0.6, "stones in the corner")
L.heroField(20, 400, 1440, 836, 0, [], o)
assert.ok(o.a > 0.1 && o.a < 0.3, "the fine margin strip on wide screens")
L.heroField(8, 400, 375, 748, 0, [], o)
assert.ok(o.a < 0.3, "no strip on phones")
L.heroField(180, 160, 375, 748, 0, [], o)
assert.ok(o.a < 0.05 && o.k < 0.05, "the phone headline sits on paper")

// a wave adds heat where its ring is, and is gone after its life
L.heroField(700, 420, 1440, 836, 0.9, [], o)
const before = o.a
L.heroField(700, 420, 1440, 836, 0.9, [{ x: 1300, y: 780, t: 0.47 }], o)
assert.ok(o.a > before + 0.1, "the ring passes through")
L.heroField(700, 420, 1440, 836, 0.25 + L.WAVE_LIFE + 0.1, [{ x: 1300, y: 780, t: 0.25 }], o)
assert.ok(Math.abs(o.a - before) < 0.3, "and leaves")

// the plates read as their rooms
const avg = (kind, key) => {
  let s = 0, n = 0
  for (let y = 0; y < 400; y += 20) for (let x = 0; x < 300; x += 20) { L.roomField(kind, x, y, 300, 400, o); s += o[key]; n++ }
  return s / n
}
assert.ok(avg("heat", "a") > avg("rest", "a") * 3, "the hot room is the most heat")
assert.equal(avg("cold", "a"), 0, "the plunge carries no heat ink")
assert.ok(avg("cold", "k") > avg("rest", "k") * 2, "the plunge is the most cold ink")

// quiet zones clear text and fade out around it
assert.equal(L.quietness(50, 50, 0, 0, 100, 100), 1)
assert.equal(L.quietness(500, 50, 0, 0, 100, 100), 0)
const edge = L.quietness(115, 50, 0, 0, 100, 100)
assert.ok(edge > 0 && edge < 1, "feathered")

// budgets
assert.equal(L.dotStep(1440, 836, 9, 15000), Math.max(9, Math.sqrt(1440 * 836 / 15000)))
assert.ok((3840 * 2160) / L.dotStep(3840, 2160, 9, 15000) ** 2 <= 15001, "a 4K hero holds the dot budget")
assert.ok(1440 * 836 * L.canvasRatio(1440, 836, 3) ** 2 <= 2.2e6 + 1, "pixel budget holds on dense screens")
assert.ok(L.canvasRatio(3840, 2160, 2) < 1, "and drops below 1 on 4K")
assert.equal(L.canvasRatio(300, 200, 2), 2)

// felt heat climbs, peaks and cools
assert.equal(L.heatLevel(5, []), 0)
assert.ok(L.heatLevel(0.3, [{ x: 0, y: 0, t: 0 }]) > 0.4)
assert.ok(Math.abs(L.heatLevel(0.6, [{ x: 0, y: 0, t: 0 }]) - 1) < 1e-9, "peaks at 0.6 s")
assert.ok(L.heatLevel(8, [{ x: 0, y: 0, t: 0 }]) < 0.1, "cools back")

// money and spots
assert.equal(L.formatPrice(19, "\u20ac"), "\u20ac19")
assert.equal(L.formatPrice(12.5, "$"), "$12.50")
assert.equal(L.spotsLeft({ capacity: 14, booked: 7 }, 0), 7)
assert.equal(L.spotsLeft({ capacity: 14, booked: 7 }, 1), 6, "my booking takes a spot")
assert.equal(L.spotsLeft({ capacity: 14, booked: 20 }, 0), 0, "never negative")
const member = L.DEFAULT_PLANS.find((p) => p.yearly != null)
assert.equal(L.planPrice(member, false), 69)
assert.equal(L.planPrice(member, true), 690)
assert.equal(L.planUnit(member, true), "a year")
assert.equal(L.planUnit(L.DEFAULT_PLANS[0], true), "per session", "plans without a yearly price ignore the switch")
assert.equal(L.monthsFree(member), 2)
assert.equal(L.monthsFree(L.DEFAULT_PLANS[0]), 0)

// a week of sessions that make sense
assert.equal(L.DEFAULT_DAYS.length, 7)
const ids = new Set()
for (const d of L.DEFAULT_DAYS) for (const s of d.sessions) {
  assert.ok(!ids.has(s.id), "unique session ids")
  ids.add(s.id)
  assert.ok(s.booked >= 0 && s.booked <= s.capacity, `${s.id} fill is possible`)
  assert.match(s.time, /^\d\d:\d\d$/)
}
assert.ok([...L.DEFAULT_DAYS.flatMap((d) => d.sessions)].some((s) => s.booked === s.capacity), "the default week shows a full session")
assert.ok(L.DEFAULT_DAYS[1].sessions.some((s) => s.name === "Silent sauna"), "silent sauna on Tuesday, as the FAQ says")

// the ritual adds up to the 90 minutes the copy promises
const rit = L.ritualSegments(L.DEFAULT_STEPS, 3, { name: "Showers", minutes: 18 })
assert.equal(rit.total, 90)
assert.equal(rit.segs.length, 10)
assert.equal(L.ritualSegments(L.DEFAULT_STEPS, 1).total, 24)

assert.ok(L.isEmail("maren@harbour.dk"))
assert.ok(!L.isEmail("maren@harbour"))
assert.ok(!L.isEmail("maren harbour.dk"))
assert.equal(L.nextIndex(6, "ArrowRight", 7), 0, "wraps forward")
assert.equal(L.nextIndex(0, "ArrowLeft", 7), 6, "wraps back")
assert.equal(L.nextIndex(3, "End", 7), 6)
assert.equal(L.nextIndex(3, "x", 7), 3)

assert.deepEqual(L.resolveInk("klein"), L.INKS.klein)
assert.deepEqual(L.resolveInk(undefined), L.INKS.safety)
assert.deepEqual(L.resolveInk({ accent: "#e00" }), { accent: "#e00", onAccent: "#0d0d0d" })

console.log("loyly-sauna-landing: all checks passed")
