// Runnable check for components/crimson-reach-template: the scroll choreography's maths, the content rules and the
// install-safety rules.
// Run: node tests/crimson-reach-template.test.mjs
//
// What breaks silently here: a CSS selector that leaks out of .cr-root, a base reset that outranks a component
// class (it hid the nav button once), a picture the component asks for that was never put in dev/public, the
// dune jumping where it is cut into panels, or copy that names the reference.
import assert from "node:assert/strict"
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs"
import { liftRegion } from "./_component-safety.mjs"

const slug = "crimson-reach-template"
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

assert.match(demo, /from "@\/components\/ui\/crimson-reach-template"/, "demo imports the installed path")
assert.match(src, /height = "100svh"/, "height defaults to a definite length")
assert.match(src, /className="cr-hero" style=\{\{ height \}\}/, "the hero takes the height prop")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")
assert.doesNotMatch(src + demo, /use(Ref|State|Memo|Callback|Reducer|Context)</, "no generic hook type arguments (they hang the 21st CLI)")
// --d is the per-card offset the carousels set inline; the rest are defined on .cr-root
const strayVars = [...src.matchAll(/var\((--[\w-]+)\)/g)].map((v) => v[1]).filter((v) => !["--bg", "--ink", "--mute", "--line", "--card", "--red", "--glow", "--d"].includes(v))
assert.deepEqual(strayVars, [], "assumes no host tokens")
const urls = [...(src + demo).matchAll(/https?:\/\/[^"'\s)]+/g)].map((m) => m[0])
assert.deepEqual([...new Set(urls)], ["https://kedhar-components.pages.dev/crimson-reach-template/"], "the only URL is the pictures' base; fonts are embedded")
assert.equal((src.match(/@font-face\{font-family:Cr(Sans|Serif)/g) || []).length, 3, "three embedded, renamed font subsets")
assert.match(src, /prefers-reduced-motion: reduce/, "reduced motion is read at runtime")

const cssAt = src.indexOf("const CSS =")
const css = src.slice(cssAt).replace(/"\s*\+\s*\n\s*(\/\/[^\n]*\n\s*)*"/g, "")
assert.doesNotMatch(css, /`|\$\{|@import/, "no backticks, ${ or @import in the CSS string")
assert.match(css, /@media \(prefers-reduced-motion:reduce\)\{/, "CSS honours reduced motion")
assert.match(css, /@media \(hover:hover\) and \(pointer:fine\)\{/, "hover effects only where a mouse can hover")
assert.match(css, /\.cr-root img\{max-width:none/, "guards Preflight's img max-width")
assert.match(css, /\.cr-root\{--bg:[^}]*width:100%;/, "the root claims the full width: 21st centres demos in a flex box")
// element resets must carry zero specificity or they beat the component's own classes
assert.match(css, /\.cr-root :where\(a,button\)\{/, "link/button reset is wrapped in :where()")
assert.doesNotMatch(css, /\.cr-root (a|button|h1|h2|h3|p)[,{]/, "no bare element resets")
let rules = 0
const body = css.replace(/^const CSS =\s*FONTS \+\s*"/, "").replace(/"\s*\+\s*(EASE|SANS|SERIF)\s*\+\s*"/g, "")
for (const m of body.matchAll(/(?<=^|[{}"])\s*([^{}"]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (sel.startsWith("@") || /^(from|to|\d)/.test(sel)) continue
  rules++
  assert.ok(sel.split(/,(?![^(]*\))/).every((x) => /^\.cr-/.test(x.trim())), "unscoped selector: " + sel)
}
assert.ok(rules >= 120, "the scope check saw real rules, saw " + rules)

// every picture the component asks for exists locally (dev/public is what the site serves), and nothing extra
const keys = new Set(["hero", "hand-top", "hand-bottom", "dune", "statue", "kedhar"])
for (const m of src.matchAll(/\bid: "([\w-]+)"/g)) keys.add(m[1])
assert.equal(keys.size, 6 + 6 + 6 + 3, "plate, hands, dune, statue, portrait + 6 services, 6 works, 3 clients")
for (const k of keys) {
  const f = new URL("../dev/public/" + slug + "/" + k + ".webp", import.meta.url)
  assert.ok(existsSync(f), "picture exists: " + k)
  assert.ok(statSync(f).size < 120_000, "picture stays light: " + k)
}
const served = readdirSync(new URL("../dev/public/" + slug + "/", import.meta.url))
assert.deepEqual(served.filter((f) => !keys.has(f.replace(/\.webp$/, ""))), [], "no leftover files in dev/public")

// ---- content rules ----------------------------------------------------------
const text = src.replace(/base64,[A-Za-z0-9+/=]+/g, "")
// the reference's brand, spelled backwards so this file doesn't carry it either
const banned = new RegExp([..."aidemoder"].reverse().join("") + "|" + [..."oder"].reverse().join("") + "\\b", "i")
assert.doesNotMatch(text + demo + readme, banned, "nothing names the reference")
assert.match(text, /kedhareswer\.12110626@gmail\.com/, "contact is Kedhareswer's address")
assert.match(text, /Kedhareswer/, "copy is about Kedhareswer")
for (const c of ["Client 1", "Client 2", "Client 3"]) assert.ok(text.includes(c), "placeholder " + c)

// ---- the choreography's maths ---------------------------------------------------
const m = await liftRegion(src, "motion", ["clamp", "seg", "wordLevel", "loopOffset", "countAt", "journeyFrame", "featuredFrame"])
assert.equal(m.seg(0.5, 0, 1), 0.5)
assert.equal(m.seg(-1, 0, 1), 0)
// words light in order and the last one is lit at the end
assert.equal(m.wordLevel(0, 30, 0), 0)
assert.equal(m.wordLevel(29, 30, 1), 1)
assert.ok(m.wordLevel(3, 30, 0.3) > m.wordLevel(20, 30, 0.3), "earlier words lead")
// loop offsets wrap to the short way round
assert.equal(m.loopOffset(5, 0, 6), -1)
assert.equal(m.loopOffset(1, 0, 6), 1)
assert.equal(m.loopOffset(0, 0, 6), 0)
// counters land on their target and start at zero
assert.equal(m.countAt(48, 0), 0)
assert.equal(m.countAt(48, 1), 48)
assert.equal(m.countAt(48, 5), 48)

for (const [w, h] of [[1440, 877], [390, 844]]) {
  // before the split the three panels tile the uncut picture exactly: no gaps, no overlaps, continuous image
  const a = m.journeyFrame(0, w, h)
  for (let i = 0; i < 3; i++) {
    const q = a.panels[i]
    assert.ok(Math.abs(q.w - a.F / 3) < 1e-6, "uncut panel is a third wide")
    assert.ok(Math.abs(q.x - (i - 1) * (a.F / 3)) < 1e-6, "uncut panels touch")
    assert.ok(Math.abs(q.bgX + i * (a.F / 3)) < 1e-6, "panel " + i + " shows its own third of the dune")
    assert.ok(q.ry === 0, "not flipped yet")
    assert.ok(q.rz === 0, "not tilted yet")
  }
  // at the end every panel has flipped and the outer cards fan away from the centre
  const z = m.journeyFrame(1, w, h)
  assert.ok(z.panels.every((q) => q.ry === 180), "all flipped")
  assert.ok(z.panels[0].rz < 0 && z.panels[2].rz > 0 && z.panels[1].rz === 0, "fan tilts out")
  assert.ok(z.panels[0].x < 0 && z.panels[2].x > 0, "fan spreads")
  // reduced motion shows the finished cards at once
  assert.deepEqual(m.journeyFrame(0, w, h, true).panels, z.panels, "reduced = final state")
}
// the featured title starts big and lands at 1 while the carousel arrives
const f0 = m.featuredFrame(0, 3.3), f1 = m.featuredFrame(1, 3.3)
assert.equal(f0.scale, 3.3)
assert.equal(f1.scale, 1)
assert.equal(f0.carO, 0)
assert.equal(f1.carO, 1)
assert.equal(m.featuredFrame(0, 3.3, true).scale, 1, "reduced: no giant title")

console.log("crimson-reach-template: ok (" + rules + " scoped rules)")
