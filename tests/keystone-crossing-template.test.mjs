// Runnable check for components/keystone-crossing-template: the camera move's choreography (lifted from the
// component), the pictures it asks for, the content rules and the install-safety rules.
// Run: node tests/keystone-crossing-template.test.mjs
//
// What breaks silently here: a CSS selector that leaks out of .kx-root, a picture that was never put in dev/public,
// a phase that overlaps the next one (two headlines on screen at once), or copy that names the reference.
import assert from "node:assert/strict"
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs"
import { liftRegion } from "./_component-safety.mjs"

const slug = "keystone-crossing-template"
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

assert.match(demo, /from "@\/components\/ui\/keystone-crossing-template"/, "demo imports the installed path")
assert.match(src, /height = "100svh"/, "height defaults to a definite length")
assert.match(src, /className="kx-pin" style=\{\{ height \}\}/, "the pinned stage takes the height prop")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")
assert.doesNotMatch(src + demo, /use(Ref|State|Memo|Callback|Reducer|Context)</, "no generic hook type arguments (they hang the 21st CLI)")
assert.doesNotMatch(src.replace(/var\(--(cw|gap|cream|ink|mute|blue|paper|paper-ink|paper-mute|paper-line)\)/g, ""), /var\(--/, "assumes no host tokens")
const urls = [...(src + demo).matchAll(/https?:\/\/[^"'\s)]+/g)].map((m) => m[0])
assert.deepEqual(urls, ["https://kedhar-components.pages.dev/keystone-crossing-template/"], "the only URL is the pictures' base; fonts are embedded")
assert.equal((src.match(/@font-face\{font-family:Kx(Sans|Serif);/g) || []).length, 2, "two embedded, renamed font subsets")
assert.match(src, /prefers-reduced-motion: reduce/, "reduced motion is read at runtime")

const cssAt = src.indexOf("const CSS =")
const css = src.slice(cssAt, src.indexOf("\n\n", cssAt)).replace(/"\s*\+\s*\n\s*"/g, "")
assert.doesNotMatch(css, /`|\$\{|@import/, "no backticks, ${ or @import in the CSS string")
assert.match(css, /@media \(prefers-reduced-motion:reduce\)\{/, "CSS honours reduced motion")
assert.match(css, /@media \(hover:hover\) and \(pointer:fine\)\{/, "hover effects only where a mouse can hover")
assert.match(css, /\.kx-root img\{max-width:none/, "guards Preflight's img max-width")
assert.match(css, /\.kx-root\{[^}]*width:100%;/, "the root claims the full width: 21st centres demos in a flex box")
assert.match(css, /\.kx-pin\{position:sticky;top:0;/, "the stage pins with sticky, no scroll hijack")
let rules = 0
for (const m of css.replace(/^const CSS =\s*"/, "").replace(/"\s*\+\s*(SANS|SERIF)\s*\+\s*"/g, "").replace(/base64,[A-Za-z0-9+/=]+/g, "").matchAll(/(?<=^|[{}"])\s*([^{}"]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (sel.startsWith("@") || /^(from|to|\d)/.test(sel)) continue
  rules++
  assert.ok(sel.split(/,(?![^(]*\))/).every((x) => /^(\.dark )?\.kx-/.test(x.trim())), "unscoped selector: " + sel)
}
assert.ok(rules >= 80, "the scope check saw real rules, saw " + rules)

// ---- pictures ---------------------------------------------------------------
const keys = new Set([...src.matchAll(/pic\("(\w+)"\)/g)].map((m) => m[1]))
assert.deepEqual([...keys].sort(), ["bridge", "hero", "town"], "the three scene pictures")
for (const k of keys) {
  const f = new URL("../dev/public/" + slug + "/" + k + ".webp", import.meta.url)
  assert.ok(existsSync(f), "picture exists: " + k)
  assert.ok(statSync(f).size < 420_000, "picture stays light: " + k + " " + statSync(f).size)
}
const served = readdirSync(new URL("../dev/public/" + slug + "/", import.meta.url))
assert.deepEqual(served.sort(), ["bridge.webp", "hero.webp", "town.webp"], "no leftover files in dev/public")
// the bridge layer is a cut-out: a WebP with an alpha chunk (VP8X flag bit 4, or VP8L)
const br = readFileSync(new URL("../dev/public/" + slug + "/bridge.webp", import.meta.url))
assert.ok(br.toString("ascii", 12, 16) === "VP8L" || (br.toString("ascii", 12, 16) === "VP8X" && (br[20] & 0x10) !== 0), "bridge.webp carries transparency")

// ---- choreography -----------------------------------------------------------
const M = await liftRegion(src, "motion")
const at = (p, s = 2.7, r = false) => M.frame(p, s, r)
const f0 = at(0)
assert.equal(f0.titleO, 1, "title fully on at rest")
assert.equal(f0.heroO, 1, "hero copy on at rest")
assert.equal(f0.archO, 0, "arch copy off at rest")
assert.equal(f0.s2O, 0, "town hidden at rest")
assert.ok(Math.abs(f0.s1Scale - 1.05) < 1e-9, "hero framed at 1.05")
// reference: the title still reads at 0.67 s and is gone by 1.33 s; the zoom barely starts before 1.33 s
assert.ok(at(0.67 / 9.2).titleO > 0.9, "title still on at 0.67 s")
assert.ok(at(1.33 / 9.2).titleO < 0.05, "title gone by 1.33 s")
assert.ok(at(1.33 / 9.2).s1Scale < 1.15, "only a creep before 1.33 s")
assert.ok(at(1.83 / 9.2).archO > 0.9, "arch copy reads at 1.83 s")
assert.ok(at(1.83 / 9.2).s1Scale > 2.4, "the arch fills the frame by 1.83 s")
assert.ok(at(3.17 / 9.2).archO > 0.9, "arch copy still on at 3.17 s")
assert.ok(at(3.5 / 9.2).s2O > 0.9 && at(3.5 / 9.2).s1O < 0.2, "town has taken over by 3.5 s")
assert.ok(at(4.5 / 9.2).townO > 0.9, "town copy reads at 4.5 s")
assert.ok(at(6.17 / 9.2).townO < 0.05, "town copy gone by 6.17 s")
assert.ok(at(7.5 / 9.2).cardsO > 0.9, "cards on at 7.5 s")
assert.ok(at(1).cardsO < 0.01, "cards gone at the end of the stage")
// never two headlines at once
for (let i = 0; i <= 1000; i++) {
  const f = at(i / 1000)
  const on = [f.titleO, f.archO, f.townO, f.cardsO].filter((o) => o > 0.15).length
  assert.ok(on <= 1, "one headline at a time, p=" + i / 1000)
}
// monotone camera through the arch
for (let i = 1; i <= 400; i++) assert.ok(at(i / 1000).s1Scale >= at((i - 1) / 1000).s1Scale - 1e-9, "the camera never backs off, p=" + i / 1000)
// reduced motion: no zoom, drift or blur, only crossfades
for (let i = 0; i <= 100; i++) {
  const f = at(i / 100, 2.7, true)
  assert.ok(Math.abs(f.s1Scale - 1.05) < 1e-9 && f.s2Scale === 1 && f.cardsX === 0, "reduced: nothing moves, p=" + i / 100)
  assert.ok([f.titleB, f.heroB, f.bgBlur, f.archB, f.s2B, f.townB, f.cardsB].every((b) => b === 0), "reduced: nothing blurs, p=" + i / 100)
}
// the zoom adapts to the viewport's shape and always clears the screen edges
assert.ok(Math.abs(M.archScaleFor(1440, 900) - 2.7) < 0.05, "desktop zoom ≈ 2.7: " + M.archScaleFor(1440, 900))
assert.ok(M.archScaleFor(390, 844) >= 1.85, "phones still pass through the arch")
assert.deepEqual(Object.keys(M.STOPS), ["intro", "bridge", "town", "work"], "nav stops")
assert.ok(at(M.STOPS.bridge).archO > 0.9 && at(M.STOPS.town).townO > 0.9 && at(M.STOPS.work).cardsO > 0.9, "every nav stop lands on its section")

// ---- content rules ----------------------------------------------------------
const text = src.replace(/base64,[A-Za-z0-9+/=]+/g, "")
// the reference's city, river, landmarks and the account that posted it, reversed so this file doesn't carry them
const banned = new RegExp(["ratsom", "avtiren", "tsom irats", "anivogezreh", "kulizdnujuk", "zatjak", "ihsok", "ssenisub ym esiar"].map((w) => [...w].reverse().join("")).join("|"), "i")
assert.doesNotMatch(text + demo + readme, banned, "nothing names the reference's place, landmarks or the account that posted it")
assert.match(text, /kedhareswer\.12110626@gmail\.com/, "contact is Kedhareswer's email")
for (const c of ["Client 1", "Client 2", "Client 3"]) assert.ok(text.includes(c), "placeholder " + c)
assert.match(text, /Kedhareswer/, "copy is about Kedhareswer")

console.log("keystone-crossing-template: ok (" + rules + " scoped rules)")
