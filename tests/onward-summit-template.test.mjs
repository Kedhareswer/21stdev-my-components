// Install-safety and logic checks for components/onward-summit-template.
// Run: node tests/onward-summit-template.test.mjs
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const SLUG = "onward-summit-template"
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
const urls = [...src.matchAll(/https?:\/\/[^\s"'`]+/g)].map((m) => m[0])
assert.deepEqual(urls, ["https://www.google.com/maps/search/?api=1&query="], "the only URL is the directions link the visitor follows")
assert.equal((src.match(/<img\b/g) || []).length, 1, "the one <img> is a speaker photo the user supplies")
assert.match(src, /p\.photo \? \(/, "and only renders when a photo is given")
assert.ok(src.includes('height = "100svh"'), "height defaults to a definite length")
assert.match(src, /"--ows-hero-h": height/, "the height prop reaches the hero")
assert.match(src, /min-height:max\(620px,var\(--ows-hero-h\)\)/, "the hero has a floor")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")
for (const m of src.matchAll(/([^{}]+)\{[^}]*\bheight:100%/g))
  assert.match(m[1].trim(), /^\.ows-(portrait-svg|photo|map-svg)$/, `percentage height on ${m[1].trim()}`)
assert.match(src, /\.ows-portrait\{[^}]*aspect-ratio:11\/13/, "portraits size themselves")
assert.match(src, /\.ows-map\{[^}]*min-height:340px/, "the map sizes itself")
assert.match(src, /React\.useId\(\)\.replace/, "svg ids are namespaced per instance")
assert.doesNotMatch(src, /url\(#[a-z]/, "gradient and clip references are built from the instance id")
assert.doesNotMatch(src.slice(0, src.indexOf("</")), /use(State|Ref|Memo|Callback)<|Partial<|Record<|React\.[A-Za-z]+</, "no generics before the JSX (21st CLI tokenizer)")
assert.doesNotMatch(src, /use(State|Ref|Memo|Callback)</, "hooks are typed without <generics>")
assert.match(src, /matchMedia\("\(prefers-reduced-motion: reduce\)"\)/, "reduced motion is read in JS (field, autoplay, scrolling)")
assert.match(src, /if \(visible && !reduced\) raf = requestAnimationFrame\(loop\)/, "the field only animates on screen and with motion allowed")
assert.match(src, /\.ows-canvas\{display:block;max-width:none/, "the canvas is guarded against Preflight")
assert.match(src, /\.ows-photo\{[^}]*max-width:none/, "so is a speaker photo")
assert.match(src, /width=\{440\} height=\{520\}/, "and it carries its own size")

const css = src.match(/const OWS_CSS = `([\s\S]*?)`/)
assert.ok(css, "CSS block present")
assert.doesNotMatch(css[1], /\$\{|`/, "no interpolation inside the CSS string")
assert.doesNotMatch(css[1], /url\(/, "no url() in the style block")
assert.ok(css[1].includes("prefers-reduced-motion:reduce"), "honours reduced motion in CSS")
for (const m of css[1].replace(/\/\*[\s\S]*?\*\//g, "").replace(/@media[^{]*\{/g, "").replace(/@keyframes[^{]*\{/g, "").matchAll(/(?<=^|[{}])\s*([^{}@]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (/^(from|to|[\d.,%\s]+)$/.test(sel)) continue
  for (const s of sel.split(/,(?![^(]*\))/)) assert.match(s.trim(), /^\.ows-/, `selector escapes the component: ${s.trim()}`)
}
assert.match(css[1], /\.ows-svg\{display:block;max-width:none/, "svgs are guarded against Preflight")
assert.match(css[1], /\.ows-root :where\(button\)\{/, "the reset has no specificity to fight")
assert.match(css[1], /\.ows-root\{[^}]*overflow-x:clip/, "the root clips sideways without breaking the sticky nav")
assert.doesNotMatch(css[1], /\.ows-root\{[^}]*overflow:hidden/, "overflow:hidden on the root would break the sticky nav")
assert.match(css[1], /\.ows-nav\{position:sticky/, "the nav sticks")
assert.match(css[1], /\.ows-field\{[^}]*pointer-events:none/, "the field never swallows clicks")

/* ---------- it behaves like an event page ---------- */

for (const k of ["expect", "guests", "agenda", "speakers", "venue", "faq", "register"]) assert.ok(src.includes(`data-sec="${k}"`), `section ${k} is addressable`)
assert.match(src, /scrollIntoView\(\{ behavior: reduced \? "auto" : "smooth", block: "start" \}\)/, "in-page links scroll, instantly under reduced motion")
assert.match(src, /nameRef\.current\?\.focus/, "Register lands in the form's first field")
assert.match(src, /role="tablist"/, "the guest list is a tablist")
assert.match(src, /nextIndex\(aud, e\.key, audiences\.length\)/, "arrow keys move through it")
assert.match(src, /if \(!audAuto \|\| audHold \|\| reduced/, "autoplay stops on interaction, hover and reduced motion")
assert.match(src, /aria-pressed=\{t === track\}/, "track filters are toggle buttons")
assert.match(src, /aria-pressed=\{isSaved\}/, "saving a session is a toggle")
assert.match(src, /aria-expanded=\{open\}/, "rows and questions are disclosures")
assert.match(src, /buildIcs\(evs, new Date\(\)\)/, "saved sessions download as a calendar")
assert.match(src, /role="meter"/, "the seat bar is a meter")
assert.match(src, /isEmail\(form\.email\)/, "the form validates before sending")
assert.match(src, /alive\.current = true\n/, "the unmount guard survives strict mode's double mount")
assert.match(src, /if \(res === false\) ok = false/, "onRegister can refuse")
assert.ok(read("demo.tsx").includes("<OnwardSummitTemplate />"), "default demo is the component, full bleed")
assert.doesNotMatch(read("demo.tsx"), /<div/, "default demo has no wrapper")
assert.match(read("demo-custom.tsx"), /palette="emerald"/, "the custom demo reprints the page")
assert.doesNotMatch(read("demo-custom.tsx"), /="[^"]*\\n/, "no \\n inside a JSX string attribute (it would print literally)")
assert.doesNotMatch(read("demo-custom.tsx"), /https?:\/\//, "the custom demo stays capture-safe too")

/* ---------- logic, executed ---------- */

const code = region("content") + region("logic") +
  "\nexport { PALETTES, clamp, smoothstep, hashString, mulberry32, shortestAngle, fieldWeights, formatClock, addMinutes, eventParts, atVenueTime, icsStamp, icsEscape, icsFold, buildIcs, countdown, isEmail, ticketCode, nextIndex, tracksOf, seatsLeft, glyphPath, portraitPaths, resolvePalette, DEFAULT_SESSIONS }\n"
const L = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(code)))

assert.equal(L.smoothstep(0, 1, -1), 0)
assert.equal(L.smoothstep(0, 1, 2), 1)
assert.equal(L.smoothstep(0, 1, 0.5), 0.5)

for (const a of [0, 1, -1, Math.PI, 3 * Math.PI, -5, 7.5]) {
  const r = L.shortestAngle(a)
  assert.ok(r > -Math.PI - 1e-9 && r <= Math.PI + 1e-9, `shortestAngle(${a}) in range`)
  assert.ok(Math.abs(Math.sin(r) - Math.sin(a)) < 1e-9 && Math.abs(Math.cos(r) - Math.cos(a)) < 1e-9, "and the same direction")
}

// the field: light glyphs up top, dark ones near the foot, both gone at the very bottom, parted around the title
const at = (u, v) => L.fieldWeights("hero", u, v, 1.6)
assert.ok(at(0.05, 0.3)[0] > 0.4 && at(0.05, 0.3)[1] === 0, "light glyphs on the navy")
assert.ok(at(0.05, 0.85)[1] > at(0.05, 0.85)[0], "dark glyphs on the pale")
assert.ok(at(0.05, 0.995)[0] + at(0.05, 0.995)[1] < 0.02, "the field fades into the page")
assert.ok(at(0.5, 0.47)[0] < at(0.05, 0.47)[0] * 0.2, "the title sits in a clearing")
assert.ok(L.fieldWeights("band", 0.9, 0.5, 2)[0] > L.fieldWeights("band", 0.05, 0.5, 2)[0], "the band thins behind its copy")

assert.equal(L.formatClock("09:00"), "9:00 AM")
assert.equal(L.formatClock("12:15"), "12:15 PM")
assert.equal(L.formatClock("00:05"), "12:05 AM")
assert.equal(L.formatClock("17:00"), "5:00 PM")
assert.equal(L.formatClock("noon"), "noon", "unparseable times print as given")
assert.equal(L.addMinutes("09:00", 45), "09:45")
assert.equal(L.addMinutes("23:30", 90), "01:00", "wraps past midnight")

assert.deepEqual(L.eventParts("2026-11-12T08:00:00-05:00"), { date: "2026-11-12", offset: "-05:00" })
assert.deepEqual(L.eventParts("2026-11-12"), { date: "2026-11-12", offset: "" })
assert.deepEqual(L.eventParts("soon"), { date: "", offset: "" })
assert.equal(L.atVenueTime("2026-11-12T08:00:00-05:00", "11:00").toISOString(), "2026-11-12T16:00:00.000Z", "venue time honours the offset")
assert.equal(L.atVenueTime("2026-11-12T08:00:00Z", "13:30").toISOString(), "2026-11-12T13:30:00.000Z")
assert.equal(L.atVenueTime("nope", "11:00"), null)

assert.equal(L.icsStamp(new Date("2026-11-12T16:00:00.000Z")), "20261112T160000Z")
assert.equal(L.icsEscape("a, b; c\\d\ne"), "a\\, b\\; c\\\\d\\ne")
const long = "DESCRIPTION:" + "x".repeat(200)
const folded = L.icsFold(long).split("\r\n")
assert.ok(folded.every((l) => l.length <= 75), "folded lines fit 75 octets")
assert.equal(folded.map((l, i) => (i ? l.slice(1) : l)).join(""), long, "and unfold back")
assert.ok(folded.slice(1).every((l) => l.startsWith(" ")), "continuations start with a space")

const ics = L.buildIcs([{ title: "Onward: Keynote", start: new Date("2026-11-12T14:00:00Z"), end: new Date("2026-11-12T14:45:00Z"), location: "Hall, NY" }], new Date("2026-10-01T00:00:00Z"))
assert.ok(ics.startsWith("BEGIN:VCALENDAR\r\nVERSION:2.0\r\n"))
assert.ok(ics.endsWith("END:VCALENDAR\r\n"))
assert.ok(ics.includes("\r\nDTSTART:20261112T140000Z\r\nDTEND:20261112T144500Z\r\n"))
assert.ok(ics.includes("\r\nLOCATION:Hall\\, NY\r\n"))
assert.equal((ics.match(/BEGIN:VEVENT/g) || []).length, 1)
assert.doesNotMatch(ics, /[^\r]\n/, "every line ends CRLF")

assert.deepEqual(L.countdown(((2 * 24 + 3) * 3600 + 4 * 60 + 5) * 1000 + 300), { days: 2, hours: 3, minutes: 4, seconds: 5, done: false })
assert.equal(L.countdown(0).done, true)
assert.equal(L.countdown(-5).done, true)
assert.equal(L.countdown(NaN).done, true, "a bad date never counts down")

assert.ok(L.isEmail("ada@company.com"))
assert.ok(!L.isEmail("ada@company"))
assert.ok(!L.isEmail("ada company.com"))

const t1 = L.ticketCode("Onward", "Ada@Company.com ")
assert.match(t1, /^ONW-[A-HJ-NP-Z2-9]{4}$/, "readable code, no 0/O/1/I")
assert.equal(t1, L.ticketCode("Onward", "ada@company.com"), "stable per email, case and space aside")
assert.notEqual(t1, L.ticketCode("Onward", "bob@company.com"))
assert.match(L.ticketCode("2026", "x@y.co"), /^EVT-/, "a name without letters still gets a prefix")

assert.equal(L.nextIndex(0, "ArrowRight", 3), 1)
assert.equal(L.nextIndex(2, "ArrowRight", 3), 0, "wraps forward")
assert.equal(L.nextIndex(0, "ArrowLeft", 3), 2, "wraps back")
assert.equal(L.nextIndex(1, "End", 3), 2)
assert.equal(L.nextIndex(1, "Home", 3), 0)
assert.equal(L.nextIndex(1, "x", 3), 1)

assert.deepEqual(L.tracksOf(L.DEFAULT_SESSIONS), ["All", "Breaks", "Keynote", "Panel", "Workshop", "Roundtable"])
assert.deepEqual(L.tracksOf([{ start: "09:00", duration: 5, title: "x" }]), ["All"])
assert.equal(L.seatsLeft({ total: 400, taken: 287 }), 113)
assert.equal(L.seatsLeft({ total: 10, taken: 12 }), 0, "never negative")
assert.equal(L.seatsLeft(undefined), 0)

for (const k of ["arrow", "plus", "ring", "dot"]) assert.match(L.glyphPath(k, 10, 10, 8), /^M[\d.]+ [\d.]+/, `${k} draws`)
const pp = L.portraitPaths("Maya Okafor", "arrow")
assert.equal(pp.length, 4, "four brightness buckets")
assert.deepEqual(pp, L.portraitPaths("Maya Okafor", "arrow"), "deterministic, so server and client draw the same face")
assert.notDeepEqual(pp, L.portraitPaths("Daniel Reyes", "arrow"), "every speaker is their own")
assert.equal(pp.join("").split("M").length - 1, 28 * 33 * 2, "an arrow is two strokes, one per cell")
assert.ok(pp[3].length > 0 && pp[0].length > 0, "the figure has highlights and the backdrop has glyphs")

assert.equal(L.resolvePalette("emerald").mid, L.PALETTES.emerald.mid)
assert.equal(L.resolvePalette({ accent: "#ff0000" }).accent, "#ff0000", "a partial palette overrides")
assert.equal(L.resolvePalette({ accent: "#ff0000" }).deep, L.PALETTES.cobalt.deep, "and falls back to cobalt")
assert.equal(L.resolvePalette(undefined).deep, L.PALETTES.cobalt.deep)
for (const [name, p] of Object.entries(L.PALETTES)) {
  assert.equal(p.icon.length, 2, `${name} has an icon gradient`)
  for (const [k, v] of Object.entries(p)) if (typeof v === "string") assert.match(v, /^#[0-9a-f]{6}$/i, `${name}.${k} is a hex colour`)
}

console.log("onward-summit-template: ok")
