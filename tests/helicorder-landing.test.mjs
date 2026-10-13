// Install-safety and seismology checks for components/helicorder-landing.
// Run: node tests/helicorder-landing.test.mjs
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const SLUG = "helicorder-landing"
const read = (file) => readFileSync(new URL(`../components/${SLUG}/${file}`, import.meta.url), "utf8").replace(/\r\n/g, "\n")
const src = read(`${SLUG}.tsx`)

/* ---------- nothing travels with it ---------- */

const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "react is the only import")
assert.doesNotMatch(src, /@import|@font-face|<link\b|fetch\(|new Image\(/, "nothing loads at runtime")
assert.doesNotMatch(src, /https?:\/\//, "no external URLs")
assert.ok(src.includes('height = "100svh"'), "height defaults to a definite length")
assert.match(src, /height: "calc\(" \+ height \+ " - 64px\)"/, "the height prop reaches the hero")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")
assert.doesNotMatch(
  src.slice(0, src.indexOf("</")),
  /use(State|Ref|Memo|Callback|Effect)<|Partial<|Record<|Array<|React\.[A-Za-z]+</,
  "no generics before the first JSX close tag (the 21st CLI tokenizer hangs on them)",
)
assert.doesNotMatch(src, /use(State|Ref|Memo|Callback|Effect)</, "hooks are typed without <generics>")
assert.doesNotMatch(src, /location\.hash|history\.(push|replace)State/, "the host's URL is untouched")
assert.doesNotMatch(src, /console\./, "no debug output ships")

const css = src.match(/const FSK_CSS = `([\s\S]*?)`/)
assert.ok(css, "CSS block present")
assert.doesNotMatch(css[1], /\$\{|`/, "no interpolation inside the CSS string")
assert.doesNotMatch(css[1], /url\(/, "no url() in the style block")
assert.ok(css[1].includes("prefers-reduced-motion:reduce"), "honours reduced motion in CSS")
let rules = 0
for (const m of css[1].replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/(?<=^|[{}])\s*([^{}@]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (/^(from|to|[\d.,%\s]+)$/.test(sel)) continue
  rules++
  for (const s of sel.split(/,(?![^(]*\))/)) assert.match(s.trim(), /^\.fsk/, `selector escapes the component: ${s.trim()}`)
}
assert.ok(rules > 80, `scope check saw ${rules} rules`)
assert.match(css[1], /\.fsk :where\(svg,canvas,img\)\{display:block;max-width:none\}/, "media guarded against Preflight")

/* ---------- the drum is wired and cleans up ---------- */

for (const gone of ["cancelAnimationFrame(raf)", "ro.disconnect()", "io.disconnect()", "canvas.remove()", 'heroEl?.removeEventListener("pointerdown", knock)']) {
  assert.ok(src.includes(gone), "cleanup is missing " + gone)
}
assert.match(src, /Math\.sqrt\(budget \/ Math\.max\(1, w \* h\)\)/, "the drum canvas holds a pixel budget")
assert.match(src, /if \(!reduced\) raf = requestAnimationFrame\(tick\)/, "the pen stands still under reduced motion")
assert.match(src, /visible = e\.isIntersecting/, "the pen sleeps off screen")
assert.match(src, /data-theme=\{theme\}/, "the theme is scoped to the root")
assert.match(src, /classList\.contains\("dark"\)/, "system theme follows the host's .dark class")
assert.match(src, /role="tablist"/, "site playbooks are tabs")
assert.match(src, /aria-expanded=\{menu\}/, "the phone menu is a disclosure")
assert.match(src, /role="status" aria-live="polite"/, "the live alert is announced")
assert.match(src, /className="fsk-skip"/, "skip link")
assert.ok(read("demo.tsx").includes("<HelicorderLanding />"), "default demo is the component, full bleed")
assert.doesNotMatch(read("demo.tsx"), /<div/, "default demo has no wrapper")
for (const d of ["demo.tsx", "demo-smoked.tsx"]) {
  assert.deepEqual([...read(d).matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1]), ["@/components/ui/" + SLUG])
}

/* ---------- physics, lifted out of the component and executed ---------- */

const a = src.indexOf("// #region drum\n")
const b = src.indexOf("// #endregion drum\n")
assert.ok(a > -1 && b > a, "region drum missing")
const M = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(src.slice(a, b))))
const { fskRandom, fskWarning, fskBlindZone, fskLayout, fskEventSlot, fskPrice, fskSynth, fskTracePath, FSK_SR } = M

const r1 = fskRandom(3), r2 = fskRandom(3)
for (let i = 0; i < 8; i++) assert.equal(r1(), r2(), "the PRNG is deterministic")

// P outruns S, the warning is the S arrival minus the alert, and it grows with distance
const w76 = fskWarning(76)
assert.ok(w76.p < w76.s, "P arrives before S")
assert.ok(Math.abs(w76.warning - 17.1) < 0.05, "76 km gives the 17.1 s the hero promises, got " + w76.warning)
assert.equal(fskWarning(5).warning, 0, "no negative warning inside the blind zone")
assert.ok(Math.abs(fskWarning(fskBlindZone()).warning) < 1e-9, "the blind zone edge has zero warning")
let lastW = -1
for (let km = 20; km <= 150; km += 10) {
  const w = fskWarning(km).warning
  assert.ok(w > lastW, "warning grows with distance")
  lastW = w
}

// drum geometry fits the hero on every screen and the quake lands on the record, right of the copy on desktop
for (const [w, h] of [[320, 568], [375, 748], [768, 960], [1440, 836], [2560, 1376], [3840, 2096]]) {
  const L = fskLayout(w, h)
  assert.ok(L.top + L.rows * L.rowH <= h - 40 || L.rows === 6, "rows fit at " + w + "x" + h)
  assert.ok(L.left + L.plotW + L.right === w || L.plotW === 40, "plot spans the width at " + w)
  const [row, frac] = fskEventSlot(L.rows, L.wide)
  assert.ok(row >= 2 && row <= L.rows - 3, "quake row on the drum at " + w)
  const alertFrac = frac - (w76.s - w76.alert) / L.spr
  if (L.wide) assert.ok(alertFrac > 0.3, "alert mark lands right of the hero copy at " + w)
  assert.ok(frac < 1, "S arrives inside its row")
}
assert.equal(fskLayout(375, 800).spr, 30, "phones get 30 s per line")
assert.equal(fskLayout(1440, 900).spr, 60, "desktops get a minute per line")

// pricing
assert.deepEqual(fskPrice(12, 89, 69, 20), { buildings: 12, unit: 89, month: 1068, year: 12816 })
assert.equal(fskPrice(20, 89, 69, 20).unit, 69, "volume price from 20 buildings")
assert.equal(fskPrice(0, 89, 69, 20).buildings, 1, "at least one building")
assert.equal(fskPrice(NaN, 89, 69, 20).buildings, 1, "garbage input is one building")
assert.equal(fskPrice(9999, 89, 69, 20).buildings, 500, "capped")

// the seismogram: quiet before P, small fast P, S several times bigger, finite throughout
const syn = fskSynth(1983)
syn.quakes.push({ p: 30, s: 39, amp: 1 })
const rms = (from, to) => {
  let sum = 0, n = 0
  for (let t = from; t < to; t += 1 / FSK_SR) {
    sum += vals[Math.round(t * FSK_SR)] ** 2
    n++
  }
  return Math.sqrt(sum / n)
}
const vals = []
for (let i = 0; i < 90 * FSK_SR; i++) {
  const v = syn.next(i / FSK_SR)
  assert.ok(Number.isFinite(v), "sample is finite")
  vals.push(v)
}
const quiet = rms(10, 29), pw = rms(30.5, 38.5), sw = rms(39.5, 47)
assert.ok(pw > quiet * 2, "P-wave stands out of the noise")
assert.ok(sw > pw * 2, "S-wave is much bigger than P")
assert.ok(rms(80, 89) < sw / 2, "the coda decays")

// a knock rings and dies away
const k = fskSynth(4)
const base = []
for (let i = 0; i < 50; i++) base.push(k.next(i / FSK_SR))
k.knock(1)
let peak = 0
for (let i = 0; i < 25; i++) peak = Math.max(peak, Math.abs(k.next((50 + i) / FSK_SR)))
let tail = 0
for (let i = 0; i < 250; i++) {
  const v = k.next((75 + i) / FSK_SR)
  if (i > 200) tail = Math.max(tail, Math.abs(v))
}
assert.ok(peak > 0.5, "a knock moves the pen")
assert.ok(tail < peak / 3, "the knock decays")

// trace paths loop seamlessly
const d = fskTracePath(7, 1200, 40, 300, 6)
const ys = [...d.matchAll(/[ML][\d.]+ ([\d.-]+)/g)].map((m) => +m[1])
assert.equal(ys.length, 301)
assert.ok(Math.abs(ys[0] - ys[300]) < 1e-6, "first and last points meet")

console.log("helicorder-landing: ok")
