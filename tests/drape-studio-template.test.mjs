// Runnable check for components/drape-studio-template: the measured motion helpers, the content rules and
// the install-safety rules. Run: node tests/drape-studio-template.test.mjs
//
// What breaks silently here: a CSS selector that leaks out of .ds-root, a class name shared by two pieces
// (the loading ring once borrowed the industries ring's transform), an absolutely placed overlay whose
// section is not positioned (it then tints the whole page), a picture the component asks for that was
// never put in dev/public, or copy that names the reference.
import assert from "node:assert/strict"
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs"
import { liftRegion } from "./_component-safety.mjs"

const slug = "drape-studio-template"
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

assert.match(demo, /from "@\/components\/ui\/drape-studio-template"/, "demo imports the installed path")
assert.match(src, /height = "100svh"/, "height defaults to a definite length")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")
assert.doesNotMatch(src + demo, /use(Ref|State|Memo|Callback|Reducer|Context)</, "no generic hook type arguments (they hang the 21st CLI)")
assert.doesNotMatch(src.replace(/var\(--(paper|ink|mute|soft|card|red|night|line|tick|g|dh|ts)\b/g, ""), /var\(--/, "assumes no host tokens")
const urls = [...(src + demo).matchAll(/https?:\/\/[^"'\s)]+/g)].map((m) => m[0]).filter((u) => !u.startsWith("http://www.w3.org/"))
assert.deepEqual(urls, ["https://kedhar-components.pages.dev/drape-studio-template/"], "the only URL is the pictures' base; the font is embedded")
assert.equal((src.match(/@font-face\{font-family:DsSans/g) || []).length, 1, "one embedded, renamed font subset")
assert.match(src, /prefers-reduced-motion: reduce/, "reduced motion is read at runtime")

const cssAt = src.indexOf("const CSS =")
const css = src.slice(cssAt, src.indexOf("\n\n", cssAt))
assert.doesNotMatch(css.replace(/base64,[A-Za-z0-9+/=]+/, ""), /`|\$\{|@import/, "no backticks, ${ or @import in the CSS string")
assert.match(css, /@media \(prefers-reduced-motion:reduce\)\{/, "CSS honours reduced motion")
assert.match(css, /@media \(hover:hover\) and \(pointer:fine\)\{/, "hover effects only where a mouse can hover")
assert.match(css, /\.ds-root img\{max-width:none/, "guards Preflight's img max-width")
assert.match(css, /width:100%;/, "the root claims the full width")
const flat = css
  .replace(/^const CSS =\s*FONTS \+\s*/, "")
  .replace(/"\s*\+\s*(\/\/[^\n]*\n\s*)*"/g, "")
  .replace(/"\s*\+\s*[A-Z_]+\s*\+\s*"/g, "")
let rules = 0
const sels = []
for (const m of flat.matchAll(/(?<=^|[{}"])\s*([^{}"]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (sel.startsWith("@") || /^(from|to|\d)/.test(sel)) continue
  rules++
  sels.push(sel)
  assert.ok(sel.split(/,(?![^(]*\))/).every((x) => /^(\.dark )?\.ds-/.test(x.trim())), "unscoped selector: " + sel)
}
assert.ok(rules >= 150, "the scope check saw real rules, saw " + rules)
// one class, one job: the loading ring has its own name
assert.match(src, /className="ds-pre-ring"/, "the loading ring uses its own class")
assert.equal((css.match(/"\.ds-ring\{/g) || []).length, 1, ".ds-ring is defined once (industries)")
// every section that hosts an absolutely placed overlay is itself positioned
for (const k of ["ds-light", "ds-dark", "ds-hero", "ds-pillars", "ds-name"]) {
  assert.match(css, new RegExp("\\." + k + "\\{position:relative"), k + " is positioned, so its overlays stay inside it")
}

// every picture the component asks for exists locally (dev/public is what the site serves)
const asked = new Set()
for (const m of src.matchAll(/pic\("(\w+)"\)/g)) asked.add(m[1])
for (const m of src.matchAll(/m: "(m\d)"/g)) asked.add(m[1])
for (let i = 1; i <= 9; i++) asked.add("sc" + i), asked.add("sf" + i)
for (let i = 1; i <= 6; i++) asked.add("p" + i)
assert.ok(src.includes('pic((side === 0 ? "sc" : "sf") + (k + 1))') && src.includes('pic("p" + (i + 1))'), "swatches and products are looked up by index")
for (const p of asked) {
  const f = new URL("../dev/public/" + slug + "/" + p + ".webp", import.meta.url)
  assert.ok(existsSync(f), "picture exists: " + p)
  assert.ok(statSync(f).size < 300_000, "picture stays light: " + p)
}
assert.ok(existsSync(new URL("../media/" + slug + "/cover.png", import.meta.url)), "cover exists")
assert.ok(existsSync(new URL("../media/" + slug + "/thumb.webp", import.meta.url)), "thumb exists")

// ---- content rules ----------------------------------------------------------
const text = src.replace(/base64,[A-Za-z0-9+/=]+/, "")
// the reference's client, studio, platform and poster, spelled backwards so this file doesn't carry them either
const banned = new RegExp(["gnaf nas", "gnafnas", "daelkcalb", "sdnert.ngised.bew", "remarf"].map((w) => [...w].reverse().join("")).join("|"), "i")
assert.doesNotMatch(text + demo + readme, banned, "nothing names the reference, its client, its studio or its platform")
assert.match(src, /email = "kedhareswer\.12110626@gmail\.com"/, "his email is the default contact")
for (const c of ["Client 1", "Client 2", "Client 3"]) assert.ok(src.includes(c + ":"), "placeholder work for " + c)
for (const p of ["Project 01", "Project 02"]) assert.ok(src.includes(p + ":"), "placeholder project " + p)
assert.ok((src.match(/Kedhareswer/g) || []).length >= 12, "the copy is about Kedhareswer")

// ---- motion (measured on the reference) -------------------------------------
const M = await liftRegion(src, "motion")
assert.equal(M.LOAD_MS, 1900, "count runs 0 → 100 in 1.9s")
assert.ok(M.HOLD_MS + M.OPEN_MS <= 1200, "petals cover the screen about a second after 100%")
assert.equal(M.easeInOut(0), 0)
assert.equal(M.easeInOut(1), 1)
assert.ok(Math.abs(M.easeInOut(0.5) - 0.5) < 1e-9)
// mark colour: red at the start, black around 1s, glass at 100% (reference frames 0.0 / 1.0 / 2.0s)
assert.deepEqual(M.markMix(0), { red: 1, black: 0, glass: 0 })
const mid = M.markMix(1 / 1.9)
assert.ok(mid.black > 0.95 && mid.red < 0.05 && mid.glass === 0, "black at 1.0s")
assert.equal(M.markMix(1).glass, 1)
// pinned progress
assert.equal(M.pinProgress(0, 2000, 800), 0)
assert.equal(M.pinProgress(-600, 2000, 800), 0.5)
assert.equal(M.pinProgress(-5000, 2000, 800), 1)
// pillar track starts on the gutter and ends with the last card on the far gutter
assert.equal(M.trackX(0, 3000, 1440, 56, 56), 56)
assert.equal(M.trackX(1, 3000, 1440, 56, 56) + 3000, 1440 - 56)
// wheels: the front tile walks one slot every 10° of turn, wrapping
assert.equal(M.frontTile(0, 9), 0)
assert.equal(M.frontTile(-10, 9), 1)
assert.equal(M.frontTile(10, 9), 8)
assert.equal(M.frontTile(-90, 9), 0)
// scatter: the first word is gone before the second starts arriving
assert.equal(M.leaveAt(0.2, 0), 0)
assert.equal(M.leaveAt(0.6, 8), 1)
assert.equal(M.arriveAt(0.5, 0), 0)
assert.equal(M.arriveAt(0.8, 7), 1)
assert.ok(0.28 + 8 * 0.022 + 0.12 <= 0.6 && 0.5 + 7 * 0.024 + 0.12 <= 0.8, "both words complete inside the pinned stretch")
// industries: six stretches of scroll, one product each
assert.deepEqual([0, 0.17, 0.34, 0.5, 0.84, 1].map((p) => M.pickIndex(p, 6)), [0, 1, 2, 3, 5, 5])

console.log("drape-studio-template: ok (" + rules + " scoped rules, " + asked.size + " pictures)")
