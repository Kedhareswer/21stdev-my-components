// Runnable check for components/shutter-roll-template: the reel's scroll maths, the content rules and the
// install-safety rules.
// Run: node tests/shutter-roll-template.test.mjs
//
// What breaks silently here: a CSS selector that leaks out of .sr-root, an entrance animation that pins an
// opacity the scroll needs to drive (it kept the hero card on screen once), a picture the component asks for
// that was never put in dev/public, a dive that overshoots before the photo takes over, or copy that names the
// reference.
import assert from "node:assert/strict"
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs"
import { liftRegion } from "./_component-safety.mjs"

const slug = "shutter-roll-template"
const dir = new URL("../components/" + slug + "/", import.meta.url)
const file = new URL(slug + ".tsx", dir)
const src = readFileSync(file, "utf8").replace(/\r\n/g, "\n")
const demo = readFileSync(new URL("demo.tsx", dir), "utf8")
const readme = readFileSync(new URL("README.md", dir), "utf8")

// ---- install safety -------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "react is the only import")
assert.deepEqual(readdirSync(dir).sort(), ["README.md", "demo.tsx", slug + ".tsx"].sort(), "folder holds only the publishable files")
assert.ok(statSync(file).size < 200_000, "under 21st's 200 kB component limit: " + statSync(file).size)
const ts = readFileSync(new URL("../tsconfig.json", import.meta.url), "utf8")
assert.ok(ts.includes('"@/components/ui/' + slug + '": ["./components/' + slug + "/" + slug + '.tsx"]'), "tsconfig paths line")
const tpl = JSON.parse(readFileSync(new URL("../scripts/templates.json", import.meta.url), "utf8"))
assert.equal(tpl.templates.filter((t) => t.slug === slug).length, 1, "listed once in scripts/templates.json")

assert.match(demo, /from "@\/components\/ui\/shutter-roll-template"/, "demo imports the installed path")
assert.match(src, /height = "100svh"/, "height defaults to a definite length")
assert.match(src, /className="sr-stage" style=\{\{ height \}\}/, "the pinned stage takes the height prop")
assert.match(src, /"--h": height/, "lengths derive from the height prop")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")
assert.doesNotMatch(src + demo, /use(Ref|State|Memo|Callback|Reducer|Context)</, "no generic hook type arguments (they hang the 21st CLI)")
const strayVars = [...src.matchAll(/var\((--[\w-]+)/g)].map((v) => v[1]).filter((v) => !["--h", "--u", "--fold", "--r", "--i", "--shot", "--g", "--row"].includes(v))
assert.deepEqual([...new Set(strayVars)], [], "assumes no host tokens")
const urls = [...(src + demo).matchAll(/https?:\/\/[^"'\s)]+/g)].map((m) => m[0])
assert.deepEqual([...new Set(urls)], ["https://kedhar-components.pages.dev/shutter-roll-template/"], "the only URL is the pictures' base; fonts are embedded")
assert.equal((src.match(/@font-face\{font-family:Sr(Display|Sans)/g) || []).length, 2, "two embedded, renamed font subsets")
assert.match(src, /prefers-reduced-motion: reduce/, "reduced motion is read at runtime")

const cssAt = src.indexOf("const CSS =")
const css = src.slice(cssAt).replace(/"\s*\+\s*\n\s*(\/\/[^\n]*\n\s*)*"/g, "")
assert.doesNotMatch(css, /`|\$\{|@import/, "no backticks, ${ or @import in the CSS string")
assert.match(css, /@media \(prefers-reduced-motion:reduce\)\{/, "CSS honours reduced motion")
assert.match(css, /@media \(hover:hover\) and \(pointer:fine\)\{/, "hover effects only where a mouse can hover")
assert.match(css, /\.sr-root img\{max-width:none/, "guards Preflight's img max-width")
assert.match(css, /\.sr-root\{[^}]*width:100%;/, "the root claims the full width: 21st centres demos in a flex box")
assert.match(css, /\.sr-root :where\(a,button\)\{/, "link/button reset is wrapped in :where()")
assert.doesNotMatch(css, /\.sr-root (a|button|h1|h2|h3|p)[,{]/, "no bare element resets")
// the card and the headline have entrance animations; their scroll fade must live on a wrapper, not on them
assert.match(src, /ref=\{card\} className="sr-card-wrap"/, "the card's scroll fade drives a wrapper")
assert.match(src, /ref=\{words\} className="sr-hero-copy"/, "the headline's scroll fade drives a wrapper")
let rules = 0
const body = css.replace(/^const CSS =\s*FONTS \+\s*"/, "").replace(/"\s*\+\s*(EASE|SANS|DISPLAY|PHONE_W|PHONE_H)\s*\+\s*"/g, "")
for (const m of body.matchAll(/(?<=^|[{}"])\s*([^{}"]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (sel.startsWith("@") || /^(from|to|\d)/.test(sel)) continue
  rules++
  assert.ok(sel.split(/,(?![^(]*\))/).every((x) => /^(\.sr-|\[data-reveal\])/.test(x.trim())), "unscoped selector: " + sel)
}
assert.ok(rules >= 150, "the scope check saw real rules, saw " + rules)
// [data-reveal] is the one attribute rule; every element carrying it sits inside .sr-root
assert.equal((css.match(/(^|[{}"])\[data-reveal\]\{/g) || []).length, 1, "a single unprefixed attribute rule")

// every picture the component asks for exists locally (dev/public is what the site serves), and nothing extra
const keys = new Set()
for (const m of src.matchAll(/\bimg\("([\w-]+)"\)/g)) keys.add(m[1])
for (const m of src.matchAll(/\bk(?:=|: )"([\w-]+)"/g)) keys.add(m[1])
for (const k of ["table", "friends", "lights", "camera", "can-1", "can-2"]) assert.ok(keys.has(k), "asks for " + k)
for (const m of src.matchAll(/\bpic: "([\w-]+)"/g)) keys.add(m[1])
// every film shows its own frame, and the print that drops out of the phone is the last film's frame, graded
const pics = [...src.matchAll(/\bpic: "([\w-]+)"/g)].map((m) => m[1])
assert.equal(new Set(pics).size, 4, "four films, four different frames")
assert.equal(pics[0], "friends", "the first film shows the photo the dive lands on")
assert.ok(src.includes('className="sr-eject"><Print k={STOCKS[STOCKS.length - 1].pic} look={STOCKS[STOCKS.length - 1].look}'), "the ejected print is the phone's last frame")
for (let i = 1; i <= 9; i++) assert.ok(keys.has("snap-" + i), "asks for snap-" + i)
for (let i = 1; i <= 6; i++) assert.ok(keys.has("party-" + i), "asks for party-" + i)
for (const k of keys) {
  const f = new URL("../dev/public/" + slug + "/" + k + ".webp", import.meta.url)
  assert.ok(existsSync(f), "picture exists: " + k)
  assert.ok(statSync(f).size < 140_000, "picture stays light: " + k)
}
const served = readdirSync(new URL("../dev/public/" + slug + "/", import.meta.url))
assert.deepEqual(served.filter((f) => !keys.has(f.replace(/\.webp$/, ""))), [], "no leftover files in dev/public")

// ---- content rules ----------------------------------------------------------
const text = src.replace(/base64,[A-Za-z0-9+/=]+/g, "")
// the reference's app, its maker and the film brands it names, spelled backwards so this file carries none of them
const banned = ["tipmud", "tipmud", "sdliubeso", "kadok", "ijuf", "diorlop", "opsid", "elbaf", "eduilc"].map((w) => [...w].reverse().join(""))
for (const b of banned) assert.doesNotMatch(text + demo + readme, new RegExp(b, "i"), "nothing names the reference: " + b)
assert.doesNotMatch(text, /POINT\. SHOOT|DUMP IT|ONE CODE|WHOLE PARTY|NAME THE NIGHT|WINDING THE FILM/i, "no copy lifted from the reference")
assert.match(text, /kedhareswer\.12110626@gmail\.com/, "contact is Kedhareswer's address")
assert.match(text, /Kedhareswer/, "copy is about Kedhareswer")
for (const c of ["Client 1", "Client 2", "Client 3", "Project 01"]) assert.ok(text.includes(c), "placeholder " + c)

// ---- the reel's maths -----------------------------------------------------------
const m = await liftRegion(src, "timeline")
const { REEL, reelState, diveScale, smooth, clamp01 } = m
assert.equal(clamp01(-2), 0)
assert.equal(clamp01(3), 1)
assert.equal(smooth(0.5), 0.5)
// before the dive nothing moves, after it the photo has taken over
assert.deepEqual(reelState(0), { dive: 0, fold: 0, stock: -1, eject: 0 })
const after = reelState(REEL.photoTo)
assert.equal(after.dive, 1)
assert.equal(after.fold, 0)
// the fold finishes before the first film shows, and each film owns one screen
assert.equal(reelState(REEL.foldTo - 0.01).stock, -1)
for (let i = 0; i < REEL.stocks; i++) assert.equal(reelState(REEL.foldTo + i * REEL.stockLen + 0.5).stock, i, "film " + i)
assert.equal(reelState(REEL.screens + 4).stock, REEL.stocks - 1, "last film holds past the end")
// the print falls out of the phone while the night section rises over the last screen of the pin
assert.equal(REEL.ejectTo, REEL.screens - 1, "eject ends when the night section covers the stage")
assert.ok(REEL.foldTo + (REEL.stocks - 1) * REEL.stockLen < REEL.ejectFrom, "the last film is on screen before the print falls")
// dive scale: 1 at rest, the full scale at the end, front-loaded so the print fills the height mid-dive
assert.equal(diveScale(0, 10), 1)
assert.ok(Math.abs(diveScale(1, 10) - 10) < 1e-9)
assert.ok(diveScale(0.5, 10) > Math.sqrt(10), "front-loaded")
let prev = 0
for (let e = 0; e <= 1.0001; e += 0.05) { const v = diveScale(Math.min(1, e), 10); assert.ok(v >= prev, "never shrinks"); prev = v }

console.log(slug + ": ok (" + rules + " scoped rules)")
