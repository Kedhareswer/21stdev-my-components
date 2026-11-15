// Runnable check for components/signature-gallery-template: the fly-through maths, the intro,
// the signature draw and the install-safety rules.
// Run: node tests/signature-gallery-template.test.mjs
//
// What breaks silently here is order and depth: a portrait that grows before the field has flown
// past, a signature that draws before the portrait is close, or cards that sweep through the lens
// as huge squares instead of fading just before it.
import assert from "node:assert/strict"
import { readFileSync, readdirSync, statSync } from "node:fs"
import { liftRegion } from "./_component-safety.mjs"

const slug = "signature-gallery-template"
const dir = new URL("../components/" + slug + "/", import.meta.url)
const file = new URL(slug + ".tsx", dir)
const src = readFileSync(file, "utf8").replace(/\r\n/g, "\n")
const demo = readFileSync(new URL("demo.tsx", dir), "utf8")
const readme = readFileSync(new URL("README.md", dir), "utf8")

// ---- install safety -------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "react is the only import")
assert.deepEqual(readdirSync(dir).sort(), ["README.md", "demo.tsx", slug + ".tsx"].sort(), "folder holds only the publishable files")
assert.ok(statSync(file).size < 200_000, "under 21st's 200 kB file limit: " + statSync(file).size)
const ts = readFileSync(new URL("../tsconfig.json", import.meta.url), "utf8")
assert.ok(ts.includes('"@/components/ui/' + slug + '": ["./components/' + slug + "/" + slug + '.tsx"]'), "tsconfig paths line")
const tpl = JSON.parse(readFileSync(new URL("../scripts/templates.json", import.meta.url), "utf8"))
assert.ok(tpl.templates.some((t) => t.slug === slug), "listed in scripts/templates.json")
assert.match(demo, /from "@\/components\/ui\/signature-gallery-template"/, "demo imports the installed path")

assert.match(src, /height = "100svh"/, "height defaults to a definite length")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")
assert.doesNotMatch(src + demo, /use(Ref|State|Memo|Callback|Reducer|Context)</, "no generic hook type arguments (they hang the 21st CLI)")
for (const [, v] of src.matchAll(/var\((--[a-z0-9-]+)/g)) assert.ok(["--d", "--i", "--r", "--dur"].includes(v), "only its own custom properties, no host tokens: " + v)

// the only network reads are the photographs on the site, and only as overridable defaults
const urls = [...(src + demo).matchAll(/https?:\/\/[^"'\s)]+/g)].map((m) => m[0])
assert.deepEqual([...new Set(urls)], ["https://kedhar-components.pages.dev/signature-gallery-template/"], "photographs come from the site, nothing else is fetched")
assert.doesNotMatch(src, /\bfetch\(|XMLHttpRequest|new Image\(/, "no runtime requests")
for (const f of ["hero.webp", "walk.webp", "screen.webp", "tall.webp", ...Array.from({ length: 18 }, (_, i) => "p" + String(i + 1).padStart(2, "0") + ".webp")]) {
  const p = new URL("../dev/public/" + slug + "/" + f, import.meta.url)
  assert.ok(statSync(p).size > 4000, "dev/public carries " + f)
}

// fonts: three OFL subsets, renamed, embedded
for (const name of ["SgSerif", "SgItalic", "SgMono"]) assert.match(src, new RegExp("@font-face\\{font-family:" + name + ";"), name + " is embedded")
assert.match(src, /SIL OFL 1\.1/, "licence noted next to the fonts")
for (const k of ["F_SERIF", "F_ITALIC", "F_MONO"]) {
  const m = src.match(new RegExp("const " + k + ' = "([A-Za-z0-9+/=]+)"'))
  assert.ok(m && m[1].length > 5000, k + " holds real font data")
  assert.equal(Buffer.from(m[1], "base64").subarray(0, 4).toString("latin1"), "wOF2", k + " is woff2")
}

// the CSS string: scoped, no backticks / ${ / @import
const cssAt = src.indexOf("const CSS =")
const css = src.slice(cssAt, src.indexOf("\n\n", cssAt)).replace(/"\s*\+\s*\n\s*(\/\*[^*]*\*\/\s*\n\s*)?"/g, "").replace(/"\s*\+\s*[A-Z_]+\s*\+\s*"/g, "X")
assert.doesNotMatch(css, /`|\$\{|@import/, "no backticks, ${ or @import in the CSS string")
assert.match(css, /@media \(prefers-reduced-motion:reduce\)/, "CSS honours reduced motion")
assert.match(css, /\.sg-root img,\.sg-root svg\{max-width:none\}/, "Preflight's img max-width is undone")
assert.match(css, /\.sg-root\{position:relative;width:100%/, "the root claims full width (21st centres demos in a flex box)")
let rules = 0
for (const m of css.replace(/^const CSS =\s*"/, "").matchAll(/(?<=^|[{}"])\s*([^{}"]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (sel.startsWith("@") || /^(from|to|\d)/.test(sel)) continue
  rules++
  assert.ok(sel.split(",").every((x) => x.trim().startsWith(".sg-")), "unscoped selector: " + sel)
}
assert.ok(rules >= 80, "the scope check saw real rules, saw " + rules)

// runtime gates
assert.match(src, /prefers-reduced-motion: reduce/, "reduced motion is read at runtime")
assert.match(src, /\(hover: hover\) and \(pointer: fine\)/, "fine-pointer gate is read at runtime")
assert.equal((src.match(/e\.pointerType !== "mouse"/g) || []).length, 2, "touch never drives the tilt or the crosshair")
assert.match(css, /@media \(hover:hover\) and \(pointer:fine\)\{\.sg-cross\{display:block\}/, "the crosshair only exists where a mouse can hover")
assert.match(css, /\.sg-cross\{display:none/, "and is hidden everywhere else")
assert.match(src, /strip\.addEventListener\("wheel", wheel, \{ passive: false \}\)/, "only the rail strip takes the wheel, never the page")

// the frame loop reads layout once, first, then only writes
const loopAt = src.indexOf("const frame = (now: number)")
const loop = src.slice(loopAt, src.indexOf("raf = requestAnimationFrame(frame)\n    return", loopAt))
assert.ok(loop.length > 1000, "found the frame loop")
assert.equal((loop.match(/getBoundingClientRect/g) || []).length, 1, "one layout read per frame")
assert.match(loop, /^const frame = \(now: number\) => \{\n\s+const r = track\.getBoundingClientRect\(\)/, "and it is the first thing the frame does")
assert.doesNotMatch(loop, /offset(Top|Left|Width|Height)|client(Width|Height)|scrollHeight|getComputedStyle|inner(Width|Height)/, "no other layout reads in the frame")
assert.equal((src.match(/getBoundingClientRect/g) || []).length, 2, "one more in the timeline loop, none anywhere else")
assert.doesNotMatch(src, /getComputedStyle|inner(Width|Height)|scrollHeight/, "no style or viewport reads")

// identity: nothing of the source survives
const all = (src + demo + readme).toLowerCase()
for (const w of ["framer", "madeline", "oversight", "made in"]) assert.ok(!all.includes(w), "no trace of the reference: " + w)
assert.match(src, /kedhareswer\.12110626@gmail\.com/, "contact email")
for (const c of ["Client 1", "Client 2", "Client 3"]) assert.ok(src.includes('"' + c + '"'), c)
for (let i = 1; i <= 15; i++) assert.ok(src.includes('"Project ' + String(i).padStart(2, "0") + '"'), "placeholder project " + i)

// ---- the scene -----------------------------------------------------------
const S = await liftRegion(src, "scene")

assert.equal(S.progressFrom(0, 8000, 1000), 0)
assert.equal(S.progressFrom(-7000, 8000, 1000), 1)
assert.equal(S.progressFrom(300, 8000, 1000), 0, "before the track arrives")
assert.equal(S.progressFrom(-1e6, 8000, 1000), 1, "after it leaves")
assert.equal(S.progressFrom(-10, 800, 1000), 0, "no travel, no progress, never NaN")

const field = S.makeField(120, 18)
assert.equal(field.length, 120)
assert.deepEqual(S.makeField(120, 18), field, "seeded: every render lays the same field")
for (const c of field) {
  assert.ok(Math.abs(c.x) <= 0.86 && Math.abs(c.y) <= 1.2, "inside the field box")
  assert.ok((c.x / 0.86) ** 2 + (c.y / 1.2) ** 2 >= 0.02, "nothing sits on the camera axis in front of the portrait")
  assert.ok(c.w >= 110 && c.w <= 360 && c.h >= 56 && c.h <= 340, "cards stay within the size caps")
  assert.ok(c.z >= -6900 && c.z <= 600 && c.z > S.PORTRAIT_Z, "every card is in front of the portrait")
  assert.ok(c.img >= 0 && c.img < 18)
}
assert.equal(new Set(field.map((c) => c.img)).size, 18, "every photograph is used")
const median = (v) => [...v].sort((a, b) => a - b)[v.length >> 1]
assert.ok(median(field.map((c) => Math.abs(c.x))) < 0.45 && median(field.map((c) => Math.abs(c.y))) < 0.5, "the field gathers toward the axis, so the fly-through stays full")

// intro: hidden at mount, settled when it says it is done
const late = 10
assert.ok(field.every((c) => S.cardPose(c, 0, 0).hidden), "no card shows before the intro reaches it")
assert.ok(S.introDone(late) && !S.introDone(2))
for (const c of field.slice(0, 20)) {
  const q = S.cardPose(c, 0, late)
  assert.equal(q.z, c.z, "after the intro a card rests at its own depth")
}
// the camera: linear travel, spread draws in to 0.78
const c0 = field[0]
assert.ok(Math.abs(S.cardPose(c0, 1, late).z - (c0.z + S.TRAVEL)) < 1e-9)
assert.ok(Math.abs(S.cardPose(c0, 0.5, late).z - S.cardPose(c0, 0, late).z - S.TRAVEL / 2) < 1e-9, "travel is linear in scroll")
assert.ok(Math.abs(S.cardPose(c0, 1, late).x - c0.x * 0.78) < 1e-9, "spread ends at 0.78")
// fade just before the lens, never drawn behind it
const near = { ...c0, z: 0 }
assert.equal(S.cardPose({ ...near, z: 300 }, 0, late).o, 1)
assert.ok(S.cardPose({ ...near, z: 520 }, 0, late).o < 1 && S.cardPose({ ...near, z: 520 }, 0, late).o > 0)
assert.ok(S.cardPose({ ...near, z: 700 }, 0, late).hidden, "behind the fade it is hidden")
assert.ok(S.NEAR_FADE[1] < S.PERSPECTIVE, "fades out before the camera plane")

// portrait: big and near during the intro, far at rest, grows only at the end
const a = S.portraitPose(0, 0.1), b = S.portraitPose(0, late), e = S.portraitPose(1, late)
assert.ok(a.y > 0 && a.o < 1, "rises in from below")
assert.equal(a.recede, 0)
assert.equal(b.recede, 1)
assert.equal(b.z, S.PORTRAIT_Z, "rests behind the field")
assert.equal(S.portraitPose(0.7, late).grow, 0, "does not grow mid-flight")
assert.equal(e.grow, 1)
assert.ok(Math.abs(e.z - (S.PORTRAIT_Z + S.TRAVEL)) < 1e-9 && e.z < 0 && e.z > -200, "ends just in front of the lens' focal plane")
// signature: draws only once the portrait is close, done before the end
assert.equal(S.sigDrawn(0.8), 0)
assert.ok(S.sigDrawn(0.9) > 0 && S.sigDrawn(0.9) < 1)
assert.equal(S.sigDrawn(0.98), 1)
assert.ok(S.DRAW[0] > S.GROW[0], "the signature waits for the portrait to start growing")

// tilt and words
assert.deepEqual(S.tilt(-1, -1), { rx: 5, ry: -6.9 })
assert.deepEqual(S.tilt(0, 0), { rx: -0, ry: 0 })
assert.deepEqual([0, 1, 2, 3, 4].map((i) => S.edgeStep(i, 5)), [0, 1, 2, 1, 0], "words arrive from both edges inward")
assert.ok(Math.abs(S.follow(0, 1, 1 / 60, 8) - (1 - Math.exp(-8 / 60))) < 1e-12)

// the word shuffle keeps every letter
const rnd = S.mulberry32(3)
for (const w of ["Interface", "screen", "I", "habits."]) assert.equal(S.shuffled(w, rnd).split("").sort().join(""), w.split("").sort().join(""), "same letters: " + w)
assert.notEqual(S.shuffled("Components", S.mulberry32(9)), "Components", "and does reorder them")

// timeline: four entries, lit by quarter; the ruler swells where the scroll is
assert.deepEqual([0, 0.1, 0.2, 0.4, 0.5, 0.8, 0.9, 1].map((p) => S.timelineStep(p, 4)), [0, 0, 1, 1, 2, 2, 3, 3], "steps change where the reference's do")
assert.equal(S.timelineStep(-1, 4), 0)
assert.equal(S.timelineStep(9, 4), 3)
assert.equal(S.TICKS, 42)
assert.equal(S.tickWidth(10, 10), 36)
assert.ok(Math.abs(S.tickWidth(11, 10) - 31.7) < 1e-9 && S.tickWidth(30, 10) === 14, "4.3px shorter per tick, never under 14")
assert.deepEqual([0, 1, 2, 3, 4, 5].map(S.tickInk), [true, false, false, false, true, true])

// rail: endless, the nearest card names the title
assert.equal(S.railCentre(0, 15), 0)
assert.equal(S.railCentre(449, 15), 1)
assert.equal(S.railCentre(451, 15), 2)
assert.equal(S.railCentre(-300, 15), 14, "wraps backwards")
assert.equal(S.railCentre(15 * 300, 15), 0, "and forwards")
assert.equal(S.wrap(-10, 4500), 4490)
assert.equal(S.wrap(4510, 4500), 10)
assert.equal(S.wrap(5, 0), 0, "an empty rail never divides by zero")

console.log("signature-gallery-template: ok")
