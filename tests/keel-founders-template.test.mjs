// Runnable check for components/keel-founders-template: the measured motion constants, the nav spring,
// the hero drift, the ink-word line, the testimonial loop, the content rules and the install-safety rules.
// Run: node tests/keel-founders-template.test.mjs
//
// What breaks silently here: a CSS selector that leaks out of .kf-root, a picture the component asks for
// that was never put in dev/public, a slide loop that runs off the clone, or copy that names the reference.
import assert from "node:assert/strict"
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs"
import { liftRegion } from "./_component-safety.mjs"

const slug = "keel-founders-template"
const dir = new URL("../components/" + slug + "/", import.meta.url)
const file = new URL(slug + ".tsx", dir)
const src = readFileSync(file, "utf8").replace(/\r\n/g, "\n")
const demo = readFileSync(new URL("demo.tsx", dir), "utf8")

// ---- install safety -------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "react is the only import")
assert.deepEqual(readdirSync(dir).sort(), ["README.md", "demo.tsx", slug + ".tsx"].sort(), "folder holds only the publishable files")
assert.ok(statSync(file).size < 200_000, "under 21st's 200 kB component limit: " + statSync(file).size)
const ts = readFileSync(new URL("../tsconfig.json", import.meta.url), "utf8")
assert.ok(ts.includes('"@/components/ui/' + slug + '": ["./components/' + slug + "/" + slug + '.tsx"]'), "tsconfig paths line")
const tpl = JSON.parse(readFileSync(new URL("../scripts/templates.json", import.meta.url), "utf8"))
assert.equal(tpl.templates.filter((t) => t.slug === slug).length, 1, "listed once in scripts/templates.json")

assert.match(demo, /from "@\/components\/ui\/keel-founders-template"/, "demo imports the installed path")
assert.match(src, /height = "100svh"/, "height defaults to a definite length")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")
assert.doesNotMatch(src + demo, /use(Ref|State|Memo|Callback|Reducer|Context)</, "no generic hook type arguments (they hang the 21st CLI)")
assert.doesNotMatch(src.replace(/var\(--(bg|card|ink|mute7?|line|rule|teal|lav2?|paper|navbg|i|y|d|s|o)\b/g, ""), /var\(--/, "assumes no host tokens")
const urls = [...(src + demo).matchAll(/https?:\/\/[^"'\s)]+/g)].map((m) => m[0]).filter((u) => !u.startsWith("http://www.w3.org/"))
assert.deepEqual(urls, ["https://kedhar-components.pages.dev/keel-founders-template/"], "the only URL is the pictures' base; the font is embedded")
assert.equal((src.match(/@font-face\{font-family:KfSans/g) || []).length, 1, "one embedded, renamed font subset")
assert.match(src, /prefers-reduced-motion: reduce/, "reduced motion is read at runtime")

const cssAt = src.indexOf("const CSS =")
const css = src.slice(cssAt, src.indexOf("\n\n", cssAt)).replace(/"\s*\+\s*\n\s*(\/\/[^\n]*\n\s*)*"/g, "")
assert.doesNotMatch(css, /`|\$\{|@import/, "no backticks, ${ or @import in the CSS string")
assert.match(css, /@media \(prefers-reduced-motion:reduce\)\{/, "CSS honours reduced motion")
assert.match(css, /@media \(hover:hover\) and \(pointer:fine\)\{/, "hover effects only where a mouse can hover")
assert.match(css, /\.kf-root img\{max-width:none/, "guards Preflight's img max-width")
assert.match(css, /"\.kf-root\{--bg:[^}]*width:100%;/, "the root claims the full width: 21st centres demos in a flex box")
let rules = 0
for (const m of css.replace(/^const CSS =\s*"/, "").replace(/"\s*\+\s*[A-Za-z_]+\([^)]*\)\s*\+\s*"/g, "").replace(/"\s*\+\s*[A-Z_]+\s*\+\s*"/g, "").matchAll(/(?<=^|[{}"])\s*([^{}"]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (sel.startsWith("@") || /^(from|to|\d)/.test(sel)) continue
  rules++
  assert.ok(sel.split(/,(?![^(]*\))/).every((x) => /^(\.dark )?\.kf-/.test(x.trim())), "unscoped selector: " + sel)
}
assert.ok(rules >= 100, "the scope check saw real rules, saw " + rules)

// every picture the component asks for exists locally (dev/public is what the site serves)
const pics = [...new Set([...src.matchAll(/(?:pic|img)\(["'](\w+)["']\)|img: "(\w+)"/g)].map((m) => m[1] || m[2]))].sort()
assert.deepEqual(pics, ["cta", "hero", "p1", "p2", "p3", "s1", "s2", "s3", "t1", "t2", "t3", "w1", "w2", "w3"])
for (const p of pics) {
  const f = new URL("../dev/public/" + slug + "/" + p + ".webp", import.meta.url)
  assert.ok(existsSync(f), "picture exists: " + p)
  assert.ok(statSync(f).size < 400_000, "picture stays light: " + p)
}

// ---- content rules ----------------------------------------------------------
const text = src.replace(/base64,[A-Za-z0-9+/=]+/, "")
// the reference's platform, name and author, spelled backwards so this file doesn't carry them either
const banned = new RegExp(["remarf", "siremun", "thgisrevo"].map((w) => [...w].reverse().join("")).join("|"), "i")
assert.doesNotMatch(text + demo + readFileSync(new URL("README.md", dir), "utf8"), banned, "nothing names the reference, its platform or its author")
assert.match(src, /email = "kedhareswer\.12110626@gmail\.com"/, "his email is the default contact")
for (const c of ["Client 1", "Client 2", "Client 3"]) assert.ok(src.includes('"' + c + '"'), "testimonial from " + c)
for (const p of ["Project 01", "Project 02", "Project 03"]) assert.ok(src.includes('"' + p + '"'), "placeholder work " + p)
assert.ok((src.match(/Kedhareswer/g) || []).length >= 10, "the copy is about Kedhareswer")

// ---- motion (measured on the reference) -------------------------------------
const M = await liftRegion(src, "motion")
assert.equal(M.EASE_OUT, "cubic-bezier(.25,.46,.45,.94)")
for (const [ms, want] of [[110, 0.19], [200, 0.44], [370, 0.78], [541, 0.92], [804, 0.986]]) {
  // the sampled clock started ~10ms before the nav moved
  const s = M.springAt((ms - 10) / 1000)
  assert.ok(Math.abs(s - want) < 0.03, "nav spring at " + ms + "ms: " + s.toFixed(3) + " vs " + want)
}
const ease = M.springEasing()
assert.match(ease, /^linear\(0,[\d.,]+,1\)$/, "the spring is a CSS linear() easing")
const pts = ease.slice(7, -1).split(",").map(Number)
for (let i = 1; i < pts.length; i++) assert.ok(pts[i] >= pts[i - 1], "the spring never overshoots or goes back")
assert.ok(css.includes(".kf-navbar{animation:kf-drop"), "the nav uses it")
for (const [s, y] of [[0, 0], [77, 0], [100, 6.21], [500, 114.21], [1000, 249.21], [1077, 270], [3000, 270]]) {
  assert.ok(Math.abs(M.heroShift(s) - y) < 0.02, "hero drift at " + s + ": " + M.heroShift(s))
}
assert.equal(M.navLight(500, 900), false)
assert.equal(M.navLight(600, 900), true, "nav turns light between 525 and 600 on a 900px hero (as measured)")
// ink text, per block: the reference's 10-word heading lit word 1 at scroll ~340, word 7 between 525 and 600 and
// word 10 between 600 and 675 (block top = 1000 - scroll on a 900px viewport); its 61-word paragraph (top 1220 - scroll)
// lit word 1 between 525 and 600 and the last between 900 and 975.
const litAt = (blockTop, scroll, n) => M.inkCount(M.inkProgress(blockTop - scroll, 900), n)
assert.equal(litAt(1000, 330, 10), 0)
assert.ok(litAt(1000, 350, 10) >= 1)
assert.ok(litAt(1000, 525, 10) < 7 && litAt(1000, 600, 10) >= 7)
assert.ok(litAt(1000, 600, 10) < 10 && litAt(1000, 675, 10) === 10)
assert.equal(litAt(1220, 525, 61), 0)
assert.ok(litAt(1220, 600, 61) >= 1)
assert.ok(litAt(1220, 900, 61) < 61 && litAt(1220, 975, 61) === 61)
assert.equal(M.inkCount(0.5, 10), 5, "word i lights once progress passes i / n")
assert.equal(M.inkProgress(100, 0), 1, "no viewport height: fully inked, never NaN")
for (let s = 0, last = 0; s < 1200; s += 7) {
  const c = litAt(1000, s, 10)
  assert.ok(c >= last, "scrolling down never un-inks a word")
  last = c
}
assert.deepEqual([M.HEAD_STAGGER, M.SUB_STAGGER, M.NAVL_STAGGER], [16, 25, 30])
assert.equal(M.SLIDE_MS, 6000)
// hover states measured on the reference
assert.match(css, /\.kf-link::after\{[^}]*transform:scaleX\(0\);transform-origin:100% 50%;transition:transform \.4s/, "underline retracts to the right")
assert.match(css, /\.kf-link:hover::after\{transform:scaleX\(1\);transform-origin:0 50%\}/, "and grows from the left")
assert.match(css, /\.kf-step:hover \.kf-stepcard\.kf-in\{transform:scale\(1\.1\)\}/, "process card grows to 110%")
assert.match(css, /\.kf-step:hover \.kf-steptext,\.kf-step:hover \.kf-stepfoot\{transform:scale\(\.9\)\}/, "while its text counter-scales")
assert.match(css, /\.kf-wcard:hover\{transform:translateY\(-20px\);transition-duration:\.4s\}/, "work card lifts 20px in 0.4s (and drops back in 0.2s)")
assert.match(css, /\.kf-pill:hover \.kf-pill-label\{transform:translateX\(55px\)\}/, "pill label moves over by one circle")
// the testimonial loop: 0 → 1 → 2 → clone(3), then the clone snaps to 0 and the next step is 1
const n = 3
let i = 0
const seen = []
for (let k = 0; k < 7; k++) {
  i = M.nextSlide(i, n)
  seen.push(i)
  if (i === n) i = 0
}
assert.deepEqual(seen, [1, 2, 3, 1, 2, 3, 1])
assert.equal(M.nextSlide(3, 3), 1, "a click while the clone is showing moves on, never past it")
assert.equal(M.prevSlide(0, 3), 2)
assert.equal(M.prevSlide(2, 3), 1)

console.log("keel-founders-template: ok")
