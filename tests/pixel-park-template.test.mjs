// Install-safety and logic checks for components/pixel-park-template.
// Run: node tests/pixel-park-template.test.mjs
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const SLUG = "pixel-park-template"
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
assert.doesNotMatch(src, /@import|@font-face|<link\b|fetch\(|new Image\(|<img\b/, "nothing loads at runtime")
assert.doesNotMatch(src, /https?:\/\//, "no external URLs — every picture is painted in the file")
assert.ok(src.includes('height = "100svh"'), "height defaults to a definite length")
assert.match(src, /style=\{\{ minHeight: height \}\}/, "height reaches the hero")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")
assert.match(src, /React\.useId\(\)\.replace/, "svg ids are namespaced per instance")
assert.doesNotMatch(src, /url\(#/, "no url(#id) references")
assert.doesNotMatch(src, /use(State|Ref|Memo|Callback|Context|LayoutEffect|Effect)<|Record<|Array<|Promise<|Partial<|RefObject</, "no <generics> for the 21st CLI tokenizer to choke on")
assert.ok(src.includes("prefers-reduced-motion:reduce"), "honours reduced motion in CSS")
assert.match(src, /matchMedia\("\(prefers-reduced-motion: reduce\)"\)/, "and in JS (overlays, parallax, intro)")
assert.match(src, /const animate = !reduced/, "overlays only run without reduced motion")
assert.match(src, /img\.data\.set\(r\.d\)/, "rasters go through createImageData, not a typed-array constructor")

const css = src.match(/const PPK_CSS = `([\s\S]*?)`/)
assert.ok(css, "CSS block present")
assert.doesNotMatch(css[1], /\$\{|`/, "no interpolation inside the CSS string")
assert.doesNotMatch(css[1], /url\(/, "no url() in the style block")
for (const m of css[1].replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/(?<=^|[{}])\s*([^{}@]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (/^(from|to|[\d.,%\s]+)$/.test(sel)) continue
  for (const s of sel.split(/,(?![^(]*\))/)) assert.match(s.trim(), /^(\.dark )?\.ppk-/, `selector escapes the component: ${s.trim()}`)
}
assert.match(css[1], /\.ppk-svg\{[^}]*max-width:none/, "svgs are guarded against Preflight")
assert.match(css[1], /\.ppk-canvas\{[^}]*max-width:none[^}]*image-rendering:pixelated[^}]*pointer-events:none/, "canvases are guarded, crisp, and never swallow clicks")
assert.match(css[1], /\.ppk-root :where\(button,input\)\{/, "the reset has no specificity to fight")
assert.match(css[1], /\.ppk-root\{[^}]*overflow-x:clip/, "the root clips sideways without breaking the sticky nav")
assert.doesNotMatch(css[1], /\.ppk-root\{[^}]*overflow:hidden/, "overflow:hidden on the root would break the sticky nav")
assert.match(css[1], /\.dark \.ppk-root\[data-theme="auto"\]/, "auto theme follows a host .dark class")
assert.match(css[1], /\.ppk-winter\{[^}]*height:clamp\(/, "the footer scene has a definite height")
assert.match(css[1], /\.ppk-card\{[^}]*aspect-ratio:[^}]*min-height:/, "the careers card sizes itself")
assert.match(css[1], /\.ppk-stamp\{[^}]*mask:/, "the stamp is perforated")

/* ---------- it behaves like a site ---------- */

for (const k of ["top", "about", "letter", "careers", "contact", "closing", "updates"]) assert.ok(src.includes(`data-sec="${k}"`), `section ${k} is addressable`)
assert.match(src, /scrollIntoView\(\{ behavior: reduced \? "auto" : "smooth"/, "in-page links scroll, instantly under reduced motion")
assert.match(src, /className="ppk-clock" onClick=\{cycleScene\}/, "the clock walks the park through the day")
assert.match(src, /scene === "auto"\) setSceneNow\(sceneForHour\(hourIn\(new Date\(\), timeZone\)\)\)/, 'scene="auto" follows the clock')
assert.match(src, /aria-pressed=\{stamped \? "true" : "false"\}/, "the stamp is a toggle")
assert.match(src, /postmarkDate\(new Date\(\)\)/, "and postmarks today")
assert.match(src, /navigator\.clipboard\?\.writeText/, "the email copies itself")
assert.match(src, /isEmail\(email\)/, "subscribe validates before sending")
assert.match(src, /if \(onSubscribe\) await onSubscribe\(email\.trim\(\)\)/, "onSubscribe is awaited")
assert.match(src, /below\.forEach\(\(n\) => n\.classList\.add\("ppk-pre"\)\)/, "only content below the fold is hidden for reveal")
assert.match(src, /e\.pointerType === "touch"\) return/, "no parallax from touch")
assert.match(src, /io = new IntersectionObserver\(\(es\) => \{\s*for \(const e of es\) on = e\.isIntersecting/, "overlays pause off screen")
assert.ok(read("demo.tsx").includes("<PixelParkTemplate />"), "default demo is the component, full bleed")
assert.doesNotMatch(read("demo.tsx"), /<div/, "default demo has no wrapper")
assert.match(read("demo-daylight.tsx"), /scene="day"/, "the daylight demo changes the time of day")

/* ---------- logic, executed ---------- */

const code = region("logic") + "\nexport { SCENES, PARK, SPRITES, clamp, smoothstep, mulberry32, hexToRgb, rgbToHex, mixRgb, hash2, vnoise, bayer, pickRamp, makeRaster, setPx, getPx, addGlow, paintLeaves, spriteValid, drawSprite, nearPath, resolveScene, scenePalette, paintPark, paintSkyline, paintStamp, paintWinter, sceneForHour, nextScene, formatClock, hourIn, postmarkDate, isEmail, signaturePath }\n"
const L = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(code)))

const a = L.mulberry32(7)
const b = L.mulberry32(7)
const seq = [a(), a(), a()]
assert.deepEqual(seq, [b(), b(), b()], "seeded PRNG is deterministic")
assert.ok(seq.every((v) => v >= 0 && v < 1))
for (let i = 0; i < 50; i++) {
  const h = L.hash2(i, i * 3 - 7, 11)
  assert.ok(h >= 0 && h < 1)
  const n = L.vnoise(i / 3.3, i / 7.1, 4)
  assert.ok(n >= 0 && n <= 1)
}
assert.equal(L.hash2(3, 4, 5), L.hash2(3, 4, 5))

assert.deepEqual(L.hexToRgb("#1d2029"), [29, 32, 41])
assert.deepEqual(L.hexToRgb("#fff"), [255, 255, 255])
assert.deepEqual(L.hexToRgb("nope"), [0, 0, 0])
assert.equal(L.rgbToHex([300, -4, 0.4]), "#ff0000", "channels are clamped and rounded")
assert.deepEqual(L.mixRgb([0, 0, 0], [200, 100, 50], 0.5), [100, 50, 25])
assert.equal(L.smoothstep(0, 1, 0.5), 0.5)

const ramp = [[0, 0, 0], [255, 255, 255]]
assert.deepEqual(L.pickRamp(ramp, 0, 0, 0), [0, 0, 0])
assert.deepEqual(L.pickRamp(ramp, 1, 0, 0), [255, 255, 255])
let white = 0
for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) if (L.pickRamp(ramp, 0.5, x, y)[0] === 255) white++
assert.equal(white, 8, "a Bayer 4x4 dithers a half tone to exactly half the pixels")
let crisp = 0
for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) if (L.pickRamp(ramp, 0.3, x, y, 0.2)[0] === 255) crisp++
assert.equal(crisp, 0, "a narrow spread keeps a 30% tone solid")

const r = L.makeRaster(4, 3)
assert.equal(r.d.length, 48)
L.setPx(r, 1, 1, [10, 20, 30])
assert.deepEqual(L.getPx(r, 1, 1), [10, 20, 30, 255])
L.setPx(r, -1, 9, [1, 2, 3])
L.setPx(r, 1, 1, [110, 120, 130], 0.5)
assert.deepEqual(L.getPx(r, 1, 1).map(Math.round), [60, 70, 80, 255], "alpha blends over what is painted")
assert.deepEqual(L.getPx(r, 99, -5), L.getPx(r, 3, 0), "reads clamp to the edge")

assert.deepEqual(L.nearPath([[0, 0, 2], [10, 0, 4]], 5, 3), [3, 3], "distance and interpolated half-width")

for (const [name, rows] of Object.entries(L.SPRITES)) assert.ok(L.spriteValid(rows), `sprite ${name} is rectangular`)
assert.ok(!L.spriteValid(["ab", "a"]))
const sr = L.makeRaster(6, 6)
L.drawSprite(sr, ["a.", ".b"], { a: "#ff0000", b: "#0000ff" }, 1, 1, true)
assert.deepEqual(L.getPx(sr, 2, 1), [255, 0, 0, 255], "flipped sprites mirror")
assert.equal(L.getPx(sr, 1, 1)[3], 0, "dots stay clear")

assert.deepEqual(L.SCENES, ["night", "dawn", "day", "dusk"])
for (const [name, p] of Object.entries(L.PARK)) {
  for (const k of ["sky", "far", "lawn", "flowers", "trees", "path", "wood"]) {
    assert.ok(Array.isArray(p[k]) && p[k].length >= 3, `${name}.${k}`)
    for (const c of p[k]) assert.match(c, /^#[0-9a-f]{6}$/, `${name}.${k} ${c}`)
  }
}
assert.equal(L.resolveScene("dusk"), "dusk")
assert.equal(L.resolveScene("toString"), "night", "inherited keys are not scenes")
assert.equal(L.resolveScene(undefined), "night")
assert.equal(L.nextScene("night"), "dawn")
assert.equal(L.nextScene("dusk"), "night", "the day wraps round")
assert.equal(L.sceneForHour(0), "night")
assert.equal(L.sceneForHour(6), "dawn")
assert.equal(L.sceneForHour(12), "day")
assert.equal(L.sceneForHour(18), "dusk")
assert.equal(L.sceneForHour(23), "night")

const opaque = (ras) => {
  let n = 0
  for (let i = 3; i < ras.d.length; i += 4) if (ras.d[i] === 255) n++
  return n
}
for (const s of L.SCENES) {
  const p1 = L.paintPark(180, 110, 7, s)
  assert.equal(p1.bg.w, 180)
  assert.equal(opaque(p1.bg), 180 * 110, `${s}: the park fills every pixel`)
  assert.ok(opaque(p1.fg) > 180 * 110 * 0.15, `${s}: trees frame the scene`)
  assert.ok(opaque(p1.fg) < 180 * 110 * 0.75, `${s}: and leave the meadow open`)
}
const pA = L.paintPark(160, 100, 3, "night")
const pB = L.paintPark(160, 100, 3, "night")
assert.deepEqual(pA.bg.d, pB.bg.d, "a park is reproducible from its seed")
assert.notDeepEqual(L.paintPark(160, 100, 4, "night").fg.d, pA.fg.d, "and a new seed plants a new one")

const sk = L.paintSkyline(200, 120, 8)
assert.equal(opaque(sk.bg), 200 * 120, "the skyline fills its card")
assert.ok(sk.shore > sk.horizon && sk.shore < 120)
const st = L.paintStamp(64, 46, 9)
assert.equal(opaque(st), 64 * 46, "the stamp is full bleed")
const wi = L.paintWinter(240, 70, 10)
assert.equal(opaque(wi.bg), 240 * 70, "the winter park fills its band")
assert.equal(wi.lamps.length, 4, "four lamps lit")
for (const l of wi.lamps) assert.ok(l[0] >= 0 && l[0] < 240 && l[1] >= 0 && l[1] < 70, "lamps sit inside the scene")

const g = L.makeRaster(9, 9)
L.addGlow(g, 4, 4, 4, [255, 200, 100], 1)
assert.ok(L.getPx(g, 4, 4)[0] > 0, "glow lights its centre")
assert.equal(L.getPx(g, 0, 0)[0], 0, "and not its corners")

assert.match(L.formatClock(new Date(Date.UTC(2026, 0, 15, 5, 7)), "America/New_York"), /^12:07\sAM$/)
{
  // local minutes depend on the machine's UTC offset (India is +5:30), so compare against local time itself
  const d = new Date(Date.UTC(2026, 0, 15, 5, 7))
  const mm = String(d.getMinutes()).padStart(2, "0")
  assert.match(L.formatClock(d, "Not/AZone"), new RegExp("^\\d{1,2}:" + mm + "\\s[AP]M$"), "a bad zone falls back to local time")
}
assert.equal(L.hourIn(new Date(Date.UTC(2026, 6, 1, 16, 0)), "America/New_York"), 12)
assert.equal(L.hourIn(new Date(Date.UTC(2026, 6, 1, 4, 0)), "America/New_York"), 0, "midnight is 0, not 24")
assert.equal(L.postmarkDate(new Date(2026, 9, 6)), "OCT 06 2026")

assert.ok(L.isEmail("ada@example.com"))
assert.ok(L.isEmail("  a.b+c@mail.co.uk "))
for (const bad of ["", "nope", "a@b", "a@b.c", "a b@c.de", "@c.de"]) assert.ok(!L.isEmail(bad), `rejects ${JSON.stringify(bad)}`)

const sig = L.signaturePath("Mara", 7)
assert.deepEqual(sig, L.signaturePath("Mara", 7), "a name always signs the same way")
assert.notEqual(sig.d, L.signaturePath("Ilya", 7).d, "and different names differently")
assert.match(sig.d, /^M[\d.]+ [\d.]+( C[\d. -]+)+$/, "one continuous stroke of cubic curves")
assert.ok(L.signaturePath("Bartholomew", 1).w > L.signaturePath("Al", 1).w, "longer names sign wider")
for (const n of ["", "???", "Ïgor", "Mary-Jo"]) {
  const s = L.signaturePath(n, 3)
  const ys = [...s.d.matchAll(/(-?[\d.]+) (-?[\d.]+)/g)].map((m) => +m[2])
  assert.ok(ys.every((y) => y >= 0 && y <= s.h), `${JSON.stringify(n)} stays inside its box`)
}

console.log("pixel-park-template: ok")
