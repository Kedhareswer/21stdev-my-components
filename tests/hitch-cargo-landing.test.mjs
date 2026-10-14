// Install-safety and logic checks for components/hitch-cargo-landing.
// Run: node tests/hitch-cargo-landing.test.mjs
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const SLUG = "hitch-cargo-landing"
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
assert.doesNotMatch(src, /https?:\/\//, "no external URLs: every bike is drawn in the file, photos come in through props")
assert.ok(src.includes('height = "100svh"'), "height defaults to a definite length")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")
assert.match(src, /React\.useId\(\)\.replace/, "svg ids are namespaced per instance")
assert.doesNotMatch(src, /id="[a-z-]+-(shadow|wheel|motor)"/, "gradient ids are built from the instance id")
assert.doesNotMatch(src, /use(State|Ref|Memo|Callback|Context|Effect)<|Record<|Array<|Promise<|Partial<|Required<|Pick<|RefObject</, "no <generics> for the 21st CLI tokenizer to choke on")
assert.doesNotMatch(src, /\b[A-Z]\w*<[A-Z]\w*>/, "no generic type aliases either")
assert.ok(src.includes("prefers-reduced-motion:reduce"), "honours reduced motion in CSS")
assert.match(src, /matchMedia\("\(prefers-reduced-motion: reduce\)"\)/, "and in JS (autoplay, smooth scroll, reveals)")

const css = src.match(/const HX_CSS = `([\s\S]*?)`/)
assert.ok(css, "CSS block present")
assert.doesNotMatch(css[1], /\$\{|`/, "no interpolation inside the CSS string")
assert.doesNotMatch(css[1], /url\(/, "no url() in the style block")
const body = css[1].replace(/\/\*[\s\S]*?\*\//g, "")
for (const m of body.matchAll(/(?<=^|[{}])\s*([^{}@]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (/^(from|to|[\d.,%\s]+)$/.test(sel)) continue
  for (const s of sel.split(/,(?![^(]*\))/)) assert.match(s.trim(), /^(\.dark )?\.hx-/, `selector escapes the component: ${s.trim()}`)
}
assert.match(body, /\.hx-svg\{[^}]*max-width:none/, "svgs are guarded against Preflight")
assert.match(body, /\.hx-photo\{[^}]*max-width:none/, "and so are photos")
assert.match(body, /\.hx-root :where\(button,input,select\)\{/, "the reset has no specificity to fight")
assert.match(body, /\.hx-root\{[^}]*overflow-x:clip/, "the root clips sideways without breaking the sticky nav")
assert.doesNotMatch(body, /\.hx-root\{[^}]*overflow:hidden/, "overflow:hidden on the root would break the sticky nav")
assert.match(body, /\.hx-root\[data-theme="dark"\],\.dark \.hx-root\[data-theme="auto"\]\{/, "dark theme in CSS, following a host .dark class with no flash")
assert.doesNotMatch(src, /MutationObserver/, "no document-wide observers")
assert.match(body, /\.hx-plate\{[^}]*aspect-ratio:5\/3/, "the drawing has an intrinsic height, never a percentage one")
assert.match(body, /--hx-pw:min\(/, "the hero drawing is sized from the hero height so it fits the first screen")

/* ---------- it behaves like a landing page ---------- */

for (const k of ["configure", "specs", "ownership", "riders", "reserve", "faq"]) assert.ok(src.includes(`data-sec="${k}"`), `section ${k} is addressable`)
assert.match(src, /id=\{x\.ids\("configure"\)\}/, "element ids carry the idPrefix")
assert.doesNotMatch(src, /\bid="[a-z]/, "no hard-coded element ids")
assert.match(src, /scrollIntoView\(\{ behavior: reduced \? "auto" : "smooth"/, "in-page links scroll, instantly under reduced motion")
assert.match(src, /aria-roledescription="carousel"/, "the hero is a labelled carousel")
assert.match(src, /e\.key === "ArrowRight"/, "arrow keys move between builds")
assert.match(src, /aria-current=\{i === cur \? "true"/, "the current tick is announced")
assert.match(src, /aria-live=\{running \? "off" : "polite"\}/, "the caption is announced, except while autoplay runs")
assert.match(src, /Pause builds/, "autoplay can be paused")
assert.match(src, /const running = autoplay > 0 && !reduced && !paused && !hold && visible/, "autoplay stops for reduced motion, hover, focus and off screen")
assert.match(src, /onPointerUp=/, "builds can be swiped")
assert.match(src, /aria-pressed=\{on\}/, "parts are toggle buttons")
assert.match(src, /replaced the \{old\}/, "a part that takes a used mount says what it replaced")
assert.match(src, /await Promise\.resolve\(onReserve\(r\)\)/, "onReserve can be async")
assert.match(src, /setState\("failed"\)/, "and a rejection keeps the form with an error")
assert.match(src, /order\.map\(\(k\) => sectionEls\[k\]\)/, "sections render in the order given")
assert.match(src, /nav !== false/, "the header can be left out")
assert.match(src, /data-sticky=/, "and unpinned")
assert.match(src, /noValidate/, "the form validates itself")
assert.match(src, /aria-invalid=\{!!errors\.email\}/, "and marks invalid fields")
assert.doesNotMatch(src, /card number|cvc|cvv|iban/i, "the reservation never asks for payment details")
assert.match(src, /role="tablist"/, "riders are tabs")
assert.match(src, /aria-expanded=\{on\}/, "faq rows announce their state")
assert.match(src, /if \(e\.key === "Escape"\)/, "Escape closes the phone menu")
assert.match(src, /className="hx-skip"/, "a skip link comes first")
assert.ok(read("demo.tsx").includes("<HitchCargoLanding />"), "default demo is the component, full bleed")
assert.doesNotMatch(read("demo.tsx"), /<div/, "default demo has no wrapper")
assert.match(read("demo-fleet.tsx"), /preset="fleet"/, "the fleet demo is a different company")
assert.match(read("demo-fleet.tsx"), /art: cage/, "and it adds a part with its own art")

/* ---------- logic, executed ---------- */

const code = region("logic") + "\nexport { BUILTIN_IDS, SECTION_KEYS, mergeParts, toggleModule, normalizeBuild, totals, formatMoney, fill, isEmail, codePrefixOf, reservationCode, wrapIndex, sectionList, liveLinks, readableOn, wordmarkSize, spokePath, arcPath }\n"
const L = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(code)))

const part = (id, mount, price, weight, range) => ({ id, name: id, code: "HX-" + id.length, mount, price, weight, range, note: "" })
const base = [
  part("seat", "rear", 420, 4.6, -4),
  part("footboards", "side", 110, 1.4, 0),
  part("flatbed", "rear", 380, 6.2, -6),
  part("panniers", "side", 240, 2.2, -2),
  part("toolbox", "rear", 520, 8.8, -7),
  part("box", "rear", 690, 10.5, -9),
  part("basket", "front", 150, 1.6, -1),
  part("battery", "power", 890, 3.1, 75),
]
const mounts = [{ id: "rear", label: "Rear deck" }, { id: "side", label: "Sides" }, { id: "front", label: "Front rack" }, { id: "power", label: "Power", stack: true }]
const cat = L.mergeParts(base)
assert.equal(L.BUILTIN_IDS.length, 8)
assert.equal(cat.list.length, 8)

// one part per single mount: a second rear part replaces the first and says so
let r = L.toggleModule(["seat", "basket"], "flatbed", cat, mounts)
assert.deepEqual(r.build, ["flatbed", "basket"], "flatbed replaces the kid seat, catalogue order kept")
assert.equal(r.swapped, "seat")
r = L.toggleModule(r.build, "flatbed", cat, mounts)
assert.deepEqual(r.build, ["basket"], "toggling again removes it")
assert.equal(r.swapped, null)
assert.deepEqual(L.toggleModule(["basket"], "nope", cat, mounts).build, ["basket"], "unknown parts are ignored")

// a stacking mount takes several parts
const cat2 = L.mergeParts(base, [{ id: "rack", name: "Bottle rack", mount: "power", price: 30, weight: 0.4, range: 0 }])
r = L.toggleModule(["battery"], "rack", cat2, mounts)
assert.deepEqual(r.build, ["battery", "rack"], "parts on a stacking mount sit together")
assert.equal(r.swapped, null)

// patches: re-price, add, hide
const cat3 = L.mergeParts(base, [{ id: "box", price: 590 }, { id: "cage", name: "Cage", code: "KS-37", mount: "rear", price: 470 }, { id: "seat", hidden: true }])
assert.equal(cat3.byId.box.price, 590, "a prop can re-price one part")
assert.equal(cat3.byId.box.weight, 10.5, "and keeps the rest of it")
assert.equal(cat3.list[cat3.list.length - 1].id, "cage", "new parts are appended")
assert.equal(cat3.byId.cage.weight, 0, "missing numbers default to zero")
assert.ok(!cat3.byId.seat, "hidden parts are left out")

assert.deepEqual(L.normalizeBuild(["seat", "flatbed", "nope", "basket", "basket"], cat, mounts), ["flatbed", "basket"], "builds from props are cleaned: unknown ids dropped, one per mount, last wins")

const t = L.totals(["seat", "footboards", "basket"], cat, { price: 3900, weight: 31, range: 90, maxLoad: 200 })
assert.deepEqual(t, { price: 4580, weight: 38.6, range: 85 }, "totals add up")
assert.equal(L.totals(["box"], cat, { price: 0, weight: 0, range: 3, maxLoad: 0 }).range, 0, "range never goes negative")

assert.equal(L.formatMoney(4580, "USD", "en-US"), "$4,580")
assert.match(L.formatMoney(4580, "EUR", "en-IE"), /€4,580/)
assert.equal(L.formatMoney(10, "NOT-A-CURRENCY", "en-US"), "NOT-A-CURRENCY 10", "a bad currency code falls back instead of throwing")

assert.equal(L.fill("{part} replaced the {old}.", { part: "Flatbed", old: "kid seat" }), "Flatbed replaced the kid seat.")
assert.equal(L.fill("Hi {name}, {missing}", { name: "Ana" }), "Hi Ana, {missing}", "unknown placeholders stay visible")

assert.ok(L.isEmail("ana@example.com"))
assert.ok(L.isEmail("  ana.ruiz+bike@mail.example.org "))
for (const bad of ["", "ana", "ana@", "ana@example", "a b@example.com"]) assert.ok(!L.isEmail(bad), bad)

assert.equal(L.codePrefixOf([{ code: "KS-35" }], "Kerbside"), "KS", "codes follow the part numbers")
assert.equal(L.codePrefixOf([{ code: "" }], "Kerbside"), "KE", "or the brand")
const code1 = L.reservationCode("HX", "Ana@Example.com", ["seat"])
assert.match(code1, /^HX-[2-9A-HJ-NP-Z]{5}$/, "codes avoid 0/O and 1/I")
assert.equal(code1, L.reservationCode("HX", " ana@example.com", ["seat"]), "stable for the same reservation")
assert.notEqual(code1, L.reservationCode("HX", "ana@example.com", ["flatbed"]), "and different for a different build")

assert.equal(L.wrapIndex(-1, 5), 4)
assert.equal(L.wrapIndex(5, 5), 0)
assert.equal(L.wrapIndex(3, 0), 0)

assert.deepEqual(L.sectionList(), L.SECTION_KEYS, "every section by default")
assert.deepEqual(L.sectionList(["faq", "nope", "configure", "faq"]), ["faq", "configure"], "custom order, unknown and repeated keys dropped")
const links = [{ label: "Specs", href: "#specs" }, { label: "Riders", href: "#riders" }, { label: "Blog", href: "/blog" }, { label: "Top", href: "#top" }]
assert.deepEqual(L.liveLinks(links, ["specs"]).map((l) => l.label), ["Specs", "Blog", "Top"], "links to a hidden section go with it")

assert.equal(L.readableOn("#ff5b1a"), "#111214", "dark text on signal orange")
assert.equal(L.readableOn("#ffd21f"), "#111214", "dark text on safety yellow")
assert.equal(L.readableOn("#1f3cff"), "#ffffff", "white text on cobalt")
assert.equal(L.readableOn("nonsense"), "#111214")

assert.ok(L.wordmarkSize("HITCH") > L.wordmarkSize("KERBSIDE"), "longer brands set smaller")
assert.ok(L.wordmarkSize("X") <= 300, "and short ones are capped")

const spokes = L.spokePath(100, 100, 10, 90, 28)
assert.equal((spokes.match(/M/g) || []).length, 28, "28 spokes")
assert.match(L.arcPath(0, 0, 10, 180, 360), /^M-10\.0 0\.0A10 10 0 0 1 10\.0 /, "fender arcs run clockwise over the top")

console.log(`ok ${SLUG}`)
