// Runnable check for components/easel-showcase-template: the three pinned stages' choreography, the ink line,
// the doodle physics, the content rules and the install-safety rules.
// Run: node tests/easel-showcase-template.test.mjs
//
// What breaks silently here: a CSS selector that leaks out of .ea-root, a picture the component asks for that was
// never put in dev/public, a stage whose cards jump between phases, or copy that names the reference.
import assert from "node:assert/strict"
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs"
import { liftRegion } from "./_component-safety.mjs"

const slug = "easel-showcase-template"
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

assert.match(demo, /from "@\/components\/ui\/easel-showcase-template"/, "demo imports the installed path")
assert.match(src, /height = "100svh"/, "height defaults to a definite length")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")
assert.doesNotMatch(src + demo, /use(Ref|State|Memo|Callback|Reducer|Context)</, "no generic hook type arguments (they hang the 21st CLI)")
assert.doesNotMatch(src.replace(/var\(--(bg|ink|mute|soft|card|line|foot|red|blue|mint|purple|lime|orange|i|y|d|r|ci|cw)\b/g, ""), /var\(--/, "assumes no host tokens")
const urls = [...(src + demo).matchAll(/https?:\/\/[^"'\s)]+/g)].map((m) => m[0]).filter((u) => !u.startsWith("http://www.w3.org/"))
assert.deepEqual(urls, ["https://kedhar-components.pages.dev/easel-showcase-template/"], "the only URL is the pictures' base; the font is embedded")
assert.equal((src.match(/@font-face\{font-family:EaSans/g) || []).length, 1, "one embedded, renamed font subset")
assert.match(src, /prefers-reduced-motion: reduce/, "reduced motion is read at runtime")
assert.match(src, /style=\{\{ height \}\}/, "the pinned stages take the height prop")

const cssAt = src.indexOf("const CSS =")
const css = src.slice(cssAt, src.indexOf("\n\n", cssAt) > -1 ? src.indexOf("\n\n", cssAt) : undefined).replace(/"\s*\+\s*\n\s*(\/\/[^\n]*\n\s*)*"/g, "")
assert.doesNotMatch(css, /`|\$\{|@import/, "no backticks, ${ or @import in the CSS string")
assert.match(css, /@media \(prefers-reduced-motion:reduce\)\{/, "CSS honours reduced motion")
assert.match(css, /@media \(hover:hover\) and \(pointer:fine\)\{/, "hover effects only where a mouse can hover")
assert.match(css, /\.ea-root img\{max-width:none\}/, "guards Preflight's img max-width")
assert.match(css, /\.ea-root\{--bg:[^}]*width:100%;/, "the root claims the full width: 21st centres demos in a flex box")
let rules = 0
for (const m of css.replace(/^const CSS =\s*"/, "").replace(/"\s*\+\s*EASE\s*\+\s*"/g, "").replace(/base64,[A-Za-z0-9+/=]+/, "").matchAll(/(?<=^|[{}"])\s*([^{}"]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (sel.startsWith("@") || /^(from|to|\d)/.test(sel)) continue
  rules++
  assert.ok(sel.split(/,(?![^(]*\))/).every((x) => /^(\.dark )?\.ea-/.test(x.trim())), "unscoped selector: " + sel)
}
assert.ok(rules >= 150, "the scope check saw real rules, saw " + rules)

// every picture the component asks for exists locally (dev/public is what the site serves)
const keys = new Set()
for (const m of src.matchAll(/pic\("(\w+)"\)/g)) keys.add(m[1])
for (const list of ["DECK_IMG", "DECK2_IMG", "AV_TOP", "AV_BOT", "WALL", "SLIDES"]) {
  const m = src.match(new RegExp("const " + list + " = \\[([^\\]]*)\\]"))
  assert.ok(m, list)
  for (const k of m[1].matchAll(/"(\w*)"/g)) if (k[1]) keys.add(k[1])
}
for (const k of src.matchAll(/\{ k: "(\w+)", t: "/g)) keys.add(k[1])
assert.ok(keys.size >= 50, "pictures referenced: " + keys.size)
let bytes = 0
for (const k of keys) {
  const f = new URL("../dev/public/" + slug + "/" + k + ".webp", import.meta.url)
  assert.ok(existsSync(f), "picture exists: " + k)
  assert.ok(statSync(f).size < 260_000, "picture stays light: " + k)
  bytes += statSync(f).size
}
const served = readdirSync(new URL("../dev/public/" + slug + "/", import.meta.url))
assert.deepEqual(served.filter((f) => !keys.has(f.replace(/\.webp$/, ""))), [], "no leftover files in dev/public")
assert.ok(bytes < 4_000_000, "all pictures together stay under 4 MB: " + bytes)

// ---- content rules ----------------------------------------------------------
const text = src.replace(/base64,[A-Za-z0-9+/=]+/, "")
// the reference's brand, studio and showcase account, spelled backwards so this file doesn't carry them either
const banned = new RegExp(["ssor tellap", "balolah", "dmswa", "ngisedbewyliad", "mrofwen"].map((w) => [...w].reverse().join("")).join("|"), "i")
assert.doesNotMatch(text + demo + readme, banned, "nothing names the reference, its studio or the account that posted it")
assert.match(src, /email = "kedhareswer\.12110626@gmail\.com"/, "his email is the default contact")
for (const c of ["Client 1", "Client 2", "Client 3"]) assert.ok(src.includes('"' + c + '"'), "client " + c)
for (const p of ["Project 01", "Project 02", "Project 03"]) assert.ok(src.includes(p), "placeholder work " + p)
assert.ok((src.match(/Kedhareswer/g) || []).length >= 10, "the copy is about Kedhareswer")

// ---- motion -----------------------------------------------------------------
const M = await liftRegion(src, "motion")
assert.equal(M.seg(0.5, 0, 1), 0.5)
assert.equal(M.seg(-1, 0, 1), 0)
assert.equal(M.easeInOut(0), 0)
assert.equal(M.easeInOut(1), 1)
assert.equal(M.stageProgress(0, 3000, 900), 0, "a stage starts at progress 0")
assert.equal(M.stageProgress(-2100, 3000, 900), 1, "and ends at 1 when the pin releases")
assert.equal(M.stageProgress(-100, 900, 900), 1, "a stage no taller than its pin never divides by zero")

const W = 1440
const H = 862
// stage 1, measured on the reference at 1440 × 862: the fan spans ~1000px centred at y≈0.65h;
// the first stair card sits at (681, 0.62h) and the stairs step ~155px right, 40px down, off the right edge
// (the reference steps ~52px down and lets the cards run under the next section; 40 keeps them clear of it)
const fan = Array.from({ length: M.DECK }, (_, i) => M.fanPose(i, M.DECK, W, H))
const fanSpan = fan[M.DECK - 1].x - fan[0].x + 260 * fan[0].s
assert.ok(fanSpan > 950 && fanSpan < 1100, "fan width ~1000px: " + fanSpan)
assert.ok(Math.abs(fan[3].y - 0.65 * H) < 10, "fan centred at 0.65h")
const st0 = M.stairPose(0, W, H)
assert.ok(Math.abs(st0.x - 681) < 3 && Math.abs(st0.y - 0.62 * H) < 3, "first stair card where the reference puts it")
const stLast = M.stairPose(M.DECK - 1, W, H)
assert.ok(stLast.x + 130 > W, "the staircase runs off the right edge")
for (let i = 1; i < M.DECK; i++) {
  const a = M.stairPose(i - 1, W, H)
  const b = M.stairPose(i, W, H)
  assert.ok(Math.abs(b.x - a.x - 155) < 1e-6 && Math.abs(b.y - a.y - 40) < 1e-6, "stair step 155 × 40")
}
// stage 2: staircase from (190, 0.22h) stepping 172px right and 0.1h down across the stage;
// folder 606px wide, right-aligned at 102px
assert.ok(Math.abs(M.stair2Pose(0, W, H).x - 190) < 1 && Math.abs(M.stair2Pose(6, W, H).y - 0.82 * H) < 6)
const fb = M.folderBox(W, H)
assert.ok(Math.abs(fb.x + fb.w - (W - 102)) < 1 && Math.abs(fb.w - 606) < 1, "folder geometry")
const slots = M.FOLDER_SLOT.filter((s) => s >= 0).sort()
assert.deepEqual(slots, [0, 1, 2, 3, 4, 5], "six photos fill the 3 × 2 folder, the info card has no slot")
assert.equal(M.folderPose(1, W, H).o, 0, "the info card fades away in the folder")
for (const j of [0, 2, 3, 4, 5, 6]) {
  const p = M.folderPose(j, W, H)
  assert.ok(p.x - 96 >= fb.x - 0.5 && p.x + 96 <= fb.x + fb.w + 0.5, "card " + j + " inside the folder")
}
// the ink line never un-inks while scrolling down, starts faint and ends solid
for (let i = 0; i < 30; i++) {
  let last = 0
  for (let q = 0; q <= 1.0001; q += 0.01) {
    const v = M.inkAt(q, i, 30)
    assert.ok(v >= last - 1e-9, "ink is monotonic")
    last = v
  }
  assert.ok(Math.abs(M.inkAt(0, i, 30) - 0.18) < 1e-9 && Math.abs(M.inkAt(1, i, 30) - 1) < 1e-9)
}
// stage 3: banner starts 94vw wide below the fold and ends a 390 × 460 card at the wall's centre
const b0 = M.bannerRect(0, W, H)
const b1 = M.bannerRect(1, W, H)
assert.ok(Math.abs(b0.w - 0.94 * W) < 1 && b0.y > 0.7 * H, "banner starts wide and low")
assert.ok(Math.abs(b1.w - 390) < 1 && Math.abs(b1.h - 460) < 1 && Math.abs(b1.x + b1.w / 2 - W / 2) < 1, "and lands as a centred card")
assert.ok(Math.abs(M.wallPose(7, W, H).x - W / 2) < 1, "the wall's centre column runs behind the card")
// a wide-but-short window: the deck is sized by height, so the staircase never runs far below its pin
for (const [w, h] of [[1580, 847], [1920, 900], [1440, 700]]) {
  const last = M.stairPose(M.DECK - 1, w, h)
  assert.ok(last.y + 141 * last.s < h + 130, "staircase stays near its pin at " + w + " x " + h)
  const f = M.fanPose(3, M.DECK, w, h)
  assert.ok(f.y + 141 * f.s < h * 0.86, "fan leaves room for the hero copy at " + w + " x " + h)
}

// doodle physics: dropped from above, they land inside the box without sinking into each other, then rest
const bs = Array.from({ length: 14 }, (_, i) => ({ x: 30 + i * 60, y: -60 - i * 70, vx: (i % 2 ? 1 : -1) * 60, vy: 0, a: 0, r: 22 }))
let steps = 0
while (steps < 4000 && !(M.settled(bs) && bs.every((b) => b.y > 0))) {
  M.stepBalls(bs, 1188, 330, 1 / 240)
  steps++
}
assert.ok(steps < 4000, "the pile comes to rest (" + steps + " steps)")
for (const b of bs) assert.ok(b.x >= b.r - 0.5 && b.x <= 1188 - b.r + 0.5 && b.y <= 330 - b.r + 0.5, "inside the box")
for (let i = 0; i < bs.length; i++)
  for (let j = i + 1; j < bs.length; j++) assert.ok(Math.hypot(bs[i].x - bs[j].x, bs[i].y - bs[j].y) > 2 * 22 - 4, "no deep overlap")

// motion values read off the reference recording
assert.match(css, /\.ea-w\{display:inline-block;opacity:0;filter:blur\(8px\);transform:translate3d\(0,\.25em,0\);transition:opacity \.7s/, "word blur-in")
assert.match(css, /transition-delay:calc\(var\(--i\) \* 70ms\)/, "70ms per word")
assert.match(css, /\.ea-link::after\{[^}]*transform:scaleX\(0\);transform-origin:100% 50%/, "nav underline retracts to the right")

console.log("easel-showcase-template: ok")
