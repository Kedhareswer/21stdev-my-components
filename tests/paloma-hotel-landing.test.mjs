// Install-safety and logic checks for components/paloma-hotel-landing.
// Run: node tests/paloma-hotel-landing.test.mjs
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const SLUG = "paloma-hotel-landing"
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
const urls = [...src.matchAll(/https?:\/\/[^\s"'`)]+/g)].map((m) => m[0])
assert.deepEqual(urls, ["https://www.google.com/maps/search/?api=1&query="], "the only URL is the directions link, which nothing loads")
for (const m of src.matchAll(/<img\b[^>]*>/g)) assert.match(m[0], /src=\{(room\.image|heroImage)\}/, "images render only when the installer passes one")
assert.ok(src.includes('height = "100svh"'), "height defaults to a definite length")
assert.match(src, /"--cpl-h": height/, "the height prop reaches the root")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")
assert.match(src, /React\.useId\(\)\.replace/, "svg ids are namespaced per instance")
assert.doesNotMatch(src.slice(0, src.indexOf("</")), /use(State|Ref|Memo|Callback)<|Partial<|Record<|Required<|Array<|Map<|React\.[A-Za-z]+<|\[K in /, "no generics before the JSX (21st CLI tokenizer)")
assert.doesNotMatch(src, /use(State|Ref|Memo|Callback)</, "hooks are typed without <generics>")
assert.match(src, /matchMedia\("\(prefers-reduced-motion: reduce\)"\)/, "reduced motion is read in JS (smooth scrolling, focus timing)")
assert.doesNotMatch(src, /[—–]/, "no em or en dashes anywhere")
assert.doesNotMatch(src, />[^<{]*\\u[0-9a-f]{4}/i, "no \\u escapes inside JSX text (they print literally)")

const cssMatch = src.match(/const CPL_CSS = `([\s\S]*?)`/)
assert.ok(cssMatch, "CSS block present")
const css = cssMatch[1]
assert.doesNotMatch(css, /\$\{|`/, "no interpolation inside the CSS string")
assert.doesNotMatch(css, /url\(/, "no url() in the style block")
assert.ok(css.includes("prefers-reduced-motion:reduce"), "honours reduced motion in CSS")
for (const m of css.replace(/\/\*[\s\S]*?\*\//g, "").replace(/@media[^{]*\{/g, "").replace(/@keyframes[^{]*\{/g, "").matchAll(/(?<=^|[{}])\s*([^{}@]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (/^(from|to|[\d.,%\s]+)$/.test(sel)) continue
  for (const s of sel.split(/,(?![^(]*\))/)) assert.match(s.trim(), /^\.cpl-/, `selector escapes the component: ${s.trim()}`)
}
assert.match(css, /\.cpl-root img,\.cpl-root svg\{max-width:none\}/, "images and svgs are guarded against Preflight")
assert.match(css, /\.cpl-root\{[^}]*min-height:var\(--cpl-h\)/, "the root takes its floor from the height prop")
assert.match(css, /\.cpl-root\{[^}]*overflow:clip/, "the root clips without becoming a scroll container (sticky still works)")
assert.match(css, /\.cpl-frame\{[^}]*height:clamp\(420px,calc\(var\(--cpl-h\)/, "the hero poster has a definite height on wide screens")
assert.match(css, /\.cpl-poster\{height:clamp\(/, "and on phones, where the frame grows with its content")
assert.match(css, /\.cpl-card-art\{[^}]*aspect-ratio:3\/2/, "postcard art is sized by its own ratio")
assert.match(css, /\.cpl-window\{[^}]*aspect-ratio:10\/7/, "so is the programme window")
assert.match(css, /\.cpl-foot-band\{height:clamp\(/, "and the footer band has a definite height")
assert.match(css, /\.cpl-pill-dock\{position:sticky;bottom:16px/, "the pill nav docks at the bottom like the reference")
assert.match(src, /strokeLinecap="square" transform=\{"scale\(" \+ WIDE/, "chrome letters use square caps so every stroke end fills the same cap box")
assert.match(src, /clipPath=\{"url\(#" \+ id \+ "j\)"\}/, "and diagonal ends are clipped back to it")
assert.match(css, /\.cpl-hero>\.cpl-wordmark\{width:min\(86%,1040px,calc\(clamp\(84px,16vh,150px\) \* var\(--cpl-ar\)\)\)\}/, "a short wordmark can't grow tall enough to push the dial off the first screen")
assert.match(css, /\.cpl-letter-head\{display:flex/, "postmarks sit in their own row, clear of the quote")
assert.match(css, /\.cpl-root :focus-visible\{outline:/, "visible keyboard focus")

/* ---------- it behaves like a product page ---------- */

for (const k of ["top", "book", "rooms", "day", "guestbook", "visit"]) assert.ok(src.includes(`data-sec="${k}"`), `section ${k} is addressable`)
assert.match(src, /scrollIntoView\(\{ behavior: reduced \? "auto" : "smooth", block: "start" \}\)/, "in-page links scroll, instantly under reduced motion")
assert.match(src, /role="slider"/, "the time-of-day dial is a slider")
assert.match(src, /aria-valuetext=\{time \+ ", " \+ label\}/, "and says the time and the moment, not a number")
assert.match(src, /const n = dialKey\(hour, e\.key\)/, "arrow, page and home keys move the sun")
assert.match(src, /setPointerCapture/, "dragging keeps tracking outside the track")
assert.match(src, /aria-pressed=\{momentAt\(moments, hour\) === m\.label\}/, "moment chips show which one is on")
assert.match(src, /aria-current=\{on && now\.now \? "time" : undefined\}/, "the programme marks what is on now")
assert.match(src, /if \(res === false\) return/, "onSearch can block a search")
assert.match(src, /if \(onSubscribe && onSubscribe\(email\.trim\(\)\) === false\) return/, "onSubscribe can refuse")
assert.match(src, /if \(!isEmail\(email\)\) return setSub\("bad"\)/, "the newsletter validates before sending")
assert.match(src, /<div className="cpl-result" aria-live="polite">/, "availability is announced")
assert.match(src, /aria-expanded=\{menu\}/, "the phone menu is a disclosure")
assert.match(src, /if \(e\.key === "Escape"\) setMenu\(false\)/, "Escape closes it")
assert.match(src, /aria-hidden=\{!docked\}/, "the pill leaves the accessibility tree while it is not docked")
assert.match(src, /const docked = pill \|\| narrow/, "on phones it is docked from the first screen")
assert.match(src, /tabIndex=\{back \? -1 : 0\}/, "a turned postcard takes its front out of the tab order")
assert.match(src, /\(b \? backBtn\.current : frontBtn\.current\)\?\.focus/, "and focus follows the card")
assert.match(src, /className="cpl-skip"/, "a skip link to booking")
assert.doesNotMatch(src, /label: "(Careers|Press)", href: "#top"/, "no footer link goes nowhere")
for (const v of ["pool", "palms", "mountain", "night"]) assert.ok(src.includes(`view === "${v}"`) || v === "night", `room view ${v} has its own vignette`)
assert.match(src, /<RoomVignette view=\{room\.view \|\| "pool"\}/, "postcards print a room, not a crop of the exterior")
assert.ok(read("demo.tsx").includes("<PalomaHotelLanding />"), "default demo is the component, full bleed")
assert.doesNotMatch(read("demo.tsx"), /<div/, "default demo has no wrapper")
assert.match(read("demo-coast.tsx"), /preset="coast"/, "the second demo reprints the page on the coast")
assert.doesNotMatch(read("demo-coast.tsx"), /https?:\/\//, "and stays capture-safe")

/* ---------- logic, executed ---------- */

const code = region("content") + region("logic") +
  "\nexport { GLYPHS, SKY, PRESETS, DEFAULT_MOMENTS, DEFAULT_ROOMS, DEFAULT_PROGRAMME, DEFAULT_FACTS, DEFAULT_QUOTES, DEFAULT_VISIT, clamp, wrapHour, mix, contrast, samplePalette, sunPosition, moonPosition, shadowVector, formatHour, momentAt, inSpan, eventAt, layoutWord, nightsBetween, isoDay, dayNumber, roomsLeft, formatMoney, postDate, isEmail, nextIndex, dialKey, resolveColors, seeded }\n"
const L = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(code)))

// the sky key frames run in order through one day and every colour is a hex
const hex = /^#[0-9a-f]{6}$/
for (let i = 1; i < L.SKY.length; i++) assert.ok(L.SKY[i].h > L.SKY[i - 1].h, "key frames ascend")
assert.equal(L.SKY[0].h, 0)
assert.equal(L.SKY[L.SKY.length - 1].h, 24)
for (let h = 0; h <= 24; h += 0.25) {
  const p = L.samplePalette(h)
  for (const k of ["skyTop", "skyMid", "skyLow", "sun", "far", "near", "shade", "ground", "wall", "palm", "pool", "poolDeep", "deck", "sea", "glass", "lit"]) assert.match(p[k], hex, `${k} at ${h}`)
  assert.equal(p.chrome.length, 7)
  for (const c of p.chrome) assert.match(c, hex)
  for (const k of ["lights", "stars", "shadow"]) assert.ok(p[k] >= 0 && p[k] <= 1, `${k} bounded at ${h}`)
}
assert.deepEqual(L.samplePalette(0), { ...L.samplePalette(24), h: 0 }, "midnight is midnight on both ends")
assert.equal(L.samplePalette(23).lights, 1, "the windows are lit at night")
assert.equal(L.samplePalette(13).lights, 0, "and dark at noon")
assert.ok(L.samplePalette(12.9).skyMid !== L.samplePalette(18.6).skyMid, "noon and sunset differ")
// a small step in time is a small step in colour (no jumps while dragging)
for (let h = 0; h < 24; h += 0.1) {
  const a = L.samplePalette(h).skyMid
  const b = L.samplePalette(h + 0.1).skyMid
  const d = [1, 3, 5].reduce((s, i) => s + Math.abs(parseInt(a.slice(i, i + 2), 16) - parseInt(b.slice(i, i + 2), 16)), 0)
  assert.ok(d < 70, `sky jumps at ${h.toFixed(1)}`)
}

// the sun rises, peaks and sets; the moon has the night
assert.ok(!L.sunPosition(3).up && L.sunPosition(13).up, "sun down at 3 am, up at 1 pm")
assert.ok(L.sunPosition(12.8).alt > 0.99, "it peaks around midday")
assert.ok(L.sunPosition(7).x < L.sunPosition(17).x, "and crosses the poster")
assert.ok(L.sunPosition(17.5).y < 400, "golden hour keeps the sun above the ridge")
assert.ok(L.moonPosition(23).up && !L.moonPosition(13).up, "moon at night only")
assert.deepEqual(L.shadowVector(2), { dx: 0, dy: 0, k: 0 }, "no shadows at night")
assert.ok(L.shadowVector(8).dx > 0 && L.shadowVector(17).dx < 0, "shadows swing from one side to the other")
assert.ok(L.shadowVector(7.2).dy > L.shadowVector(12.8).dy, "and are longest when the sun is low")

// clock and moments
assert.equal(L.formatHour(17.5), "5:30 pm")
assert.equal(L.formatHour(0), "12:00 am")
assert.equal(L.formatHour(12), "12:00 pm")
assert.equal(L.formatHour(24.25), "12:15 am", "wraps past midnight")
assert.equal(L.formatHour(17.5, "24h"), "17:30")
assert.equal(L.formatHour(6.999, "24h"), "07:00", "rounds to the minute")
assert.equal(L.momentAt(L.DEFAULT_MOMENTS, 3), "Night swim", "the small hours belong to the last moment")
assert.equal(L.momentAt(L.DEFAULT_MOMENTS, 7), "Sunrise")
assert.equal(L.momentAt(L.DEFAULT_MOMENTS, 17.6), "Golden hour")
assert.equal(L.momentAt([], 7), "")

// the programme: a full day without gaps, and the right event at every hour
const ev = L.DEFAULT_PROGRAMME
for (let i = 1; i < ev.length; i++) assert.equal(ev[i].hour, ev[i - 1].until, `${ev[i].title} starts when ${ev[i - 1].title} ends`)
assert.deepEqual(L.eventAt(ev, 17.6), { index: 5, now: true })
assert.deepEqual(L.eventAt(ev, 23), { index: 7, now: true }, "night swim runs past eleven")
assert.deepEqual(L.eventAt(ev, 0.25), { index: 7, now: true }, "and past midnight")
assert.deepEqual(L.eventAt(ev, 3), { index: 0, now: false }, "at 3 am the next thing is sunrise laps")
assert.deepEqual(L.eventAt([], 3), { index: -1, now: false })
assert.ok(L.inSpan(23.9, 21.5, 0.5) && !L.inSpan(1, 21.5, 0.5))

// the chrome alphabet
for (const [ch, [w, d]] of Object.entries(L.GLYPHS)) {
  assert.ok(w >= 0 && w <= 110, `${ch} width`)
  assert.match(d, /^M[MLHVACQZ0-9 .\-]+$/, `${ch} path is plain absolute commands`)
}
for (const ch of "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789") assert.ok(L.GLYPHS[ch], `${ch} is in the alphabet`)
const word = L.layoutWord("Paloma")
assert.equal(word.glyphs.length, 6)
assert.ok(word.width > 600 && word.width < 900)
assert.equal(L.layoutWord("Café").glyphs.length, 4, "accents fold into their letters")
assert.equal(L.layoutWord("A&B").glyphs.length, 2, "unknown characters become space")
assert.ok(L.layoutWord("A B").width > L.layoutWord("AB").width)

// booking
assert.equal(L.nightsBetween("2026-12-30", "2027-01-02"), 3, "across the new year")
assert.equal(L.nightsBetween("2026-03-28", "2026-03-30"), 2, "across a clock change")
assert.equal(L.nightsBetween("", "2026-01-01"), 0)
assert.equal(L.isoDay(L.dayNumber("2026-10-15")), "2026-10-15")
const seen = new Set()
for (const r of L.DEFAULT_ROOMS) for (let d = 0; d < 60; d++) {
  const left = L.roomsLeft(r.id, L.isoDay(20000 + d), 3)
  assert.ok(Number.isInteger(left) && left >= 0 && left <= 4)
  assert.equal(left, L.roomsLeft(r.id, L.isoDay(20000 + d), 3), "stable")
  seen.add(left)
}
assert.ok(seen.has(0) && seen.has(4), "the stand-in inventory shows sold-out and open dates")
assert.equal(L.formatMoney(1156, "$"), "$1,156")
assert.equal(L.formatMoney(12.5, "€"), "€12.50")
assert.equal(L.formatMoney(1234567), "$1,234,567")

// rooms, facts, quotes
const ids = new Set(L.DEFAULT_ROOMS.map((r) => r.id))
assert.equal(ids.size, L.DEFAULT_ROOMS.length, "unique room ids")
for (const r of L.DEFAULT_ROOMS) {
  assert.ok(r.number && r.rate > 0 && r.sleeps > 0 && r.features.length > 0, `${r.name} is complete`)
  assert.ok(["pool", "palms", "mountain", "night"].includes(r.view))
}
assert.equal(L.DEFAULT_FACTS.length, 4)
assert.equal(L.postDate(L.DEFAULT_QUOTES[0]), "MARCH")
assert.equal(L.postDate({ quote: "", name: "", stay: "Suite", date: "Aug 26" }), "AUG 26")
assert.ok(L.DEFAULT_VISIT.address.length === 3 && L.DEFAULT_VISIT.drives.length === 4)

// colours: readable in every preset, both themes
for (const [name, pr] of Object.entries(L.PRESETS)) for (const mode of ["light", "dark"]) {
  const c = pr[mode]
  for (const k of Object.keys(c)) assert.match(c[k], hex, `${name} ${mode} ${k}`)
  assert.ok(L.contrast(c.ink, c.paper) >= 7, `${name} ${mode}: body text`)
  assert.ok(L.contrast(c.muted, c.paper) >= 4.5, `${name} ${mode}: muted text`)
  assert.ok(L.contrast(c.muted, c.card) >= 4.5, `${name} ${mode}: muted text on cards`)
  assert.ok(L.contrast("#ffffff", c.pool) >= 4.5, `${name} ${mode}: white on the pool colour`)
  assert.ok(L.contrast("#fde7e2", c.night) >= 7, `${name} ${mode}: footer text`)
}
assert.deepEqual(L.resolveColors(L.PRESETS.desert, false, { ink: "#000000" }), { ...L.PRESETS.desert.light, ink: "#000000" })
assert.deepEqual(L.resolveColors(L.PRESETS.coast, true), L.PRESETS.coast.dark)
assert.equal(L.mix("#000000", "#ffffff", 0.5), "#808080")
assert.ok(Math.abs(L.contrast("#000000", "#ffffff") - 21) < 1e-9)

// keys
assert.equal(L.dialKey(23.9, "ArrowRight"), L.wrapHour(24.15), "the dial wraps")
assert.equal(L.dialKey(0, "ArrowLeft"), 23.75)
assert.equal(L.dialKey(10, "PageUp"), 11)
assert.equal(L.dialKey(10, "Home"), 0)
assert.equal(L.dialKey(10, "x"), null)
assert.equal(L.nextIndex(3, "ArrowRight", 4), 0)
assert.ok(L.isEmail("ines@example.com") && !L.isEmail("ines@example") && !L.isEmail("in es@example.com"))

// seeded scatter is deterministic
const a = L.seeded(7)
const b = L.seeded(7)
for (let i = 0; i < 20; i++) assert.equal(a(), b())

console.log("paloma-hotel-landing: all checks passed")
