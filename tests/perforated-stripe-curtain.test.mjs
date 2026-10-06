// Install-safety and logic checks for components/perforated-stripe-curtain.
// Run: node tests/perforated-stripe-curtain.test.mjs
//
// The drawing and the audio graph can't be asserted here. What is checked is
// what fails quietly: a strip that hangs off the canvas or sits flush, a
// spectrum split that leaves strips deaf or overlapping, a swing that pushes
// the wrong way or never lets go, a bass line off the scale.
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const SLUG = "perforated-stripe-curtain"
const read = (f) => readFileSync(new URL(`../components/${SLUG}/${f}`, import.meta.url), "utf8").replace(/\r\n/g, "\n")
const src = read(`${SLUG}.tsx`)

/* ---------- install safety ---------- */

const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "react is the only import")
assert.doesNotMatch(src, /@import|@font-face|fetch\(|new Image\(|https?:\/\//, "nothing loads at runtime — the groove is synthesized")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")
assert.ok(src.includes('height = "100svh"'), "height defaults to a definite length")
assert.match(src, /style=\{\{ height, background/, "the height prop reaches the root")
assert.match(src, /relative w-full/, "the root claims full width inside a flex wrapper")
assert.doesNotMatch(src.slice(0, src.indexOf("</")), /use(State|Ref|Memo|Callback)<|Partial<|Record<|React\.(PointerEvent|KeyboardEvent)</, "no generics before the JSX (21st CLI tokenizer)")
assert.match(src, /prefers-reduced-motion/, "reduced motion is honoured")
assert.match(src, /a\.ctx\?\.close\(\)/, "the audio context is closed on unmount")
assert.match(src, /aria-pressed=\{playing\}/, "the play button reports its state")
{
  const css = src.match(/const PSC_CSS = `([\s\S]*?)`/)[1]
  assert.doesNotMatch(css, /\$\{|(^|[\s}])(\*|body|html|:root)\s*\{/, "no interpolation, no global resets")
  assert.match(css, /\.psc-canvas\{[^}]*max-width:none/, "the canvas is guarded against Preflight")
}
for (const d of ["demo.tsx", "demo-custom.tsx"]) {
  const demo = read(d)
  assert.match(demo, /from "@\/components\/ui\/perforated-stripe-curtain"/, `${d} imports the installed path`)
  assert.doesNotMatch(demo, /https?:\/\//, `${d} is self-contained`)
}

/* ---------- logic ---------- */

const a = src.indexOf("// #region logic\n")
const b = src.indexOf("// #endregion logic\n")
assert.ok(a > -1 && b > a, "logic region missing")
const L = await import(
  "data:text/javascript," +
    encodeURIComponent(stripTypeScriptTypes(src.slice(a, b)) + "\nexport { restLengths, bandOf, swingFor, noteHz, KICK, SNARE, HAT, BASS }"),
)

{
  const r = L.restLengths(22)
  assert.equal(r.length, 22)
  assert.ok(r.every((v) => v >= 0.72 && v <= 0.95), "strips rest inside the frame")
  assert.ok(Math.max(...r) - Math.min(...r) > 0.04, "the hem is ragged, not a straight line")
  assert.deepEqual(L.restLengths(22), r, "the same curtain every render")
}

{
  const bins = 128
  for (const n of [4, 22, 30, 64]) {
    let covered = 0
    let prevHi = 0
    for (let i = 0; i < n; i++) {
      const [lo, hi] = L.bandOf(i, n, bins)
      assert.ok(lo >= 0 && hi <= bins && hi > lo, `strip ${i}/${n} listens to at least one bin`)
      assert.ok(lo >= prevHi - 1, `strip ${i}/${n} doesn't reach back over its neighbour`)
      prevHi = hi
      covered = Math.max(covered, hi)
    }
    assert.ok(covered >= bins * 0.9, `${n} strips span the spectrum`)
  }
}

{
  const H = 800
  assert.equal(L.swingFor(500, -1, -1, H, 160), 0, "no pointer, no swing")
  assert.equal(L.swingFor(500, 100, 400, H, 160), 0, "out of reach, no swing")
  assert.ok(L.swingFor(520, 500, 600, H, 160) > 0, "a strip right of the pointer swings right")
  assert.ok(L.swingFor(480, 500, 600, H, 160) < 0, "...and left of it, left")
  assert.ok(Math.abs(L.swingFor(510, 500, 700, H, 160)) > Math.abs(L.swingFor(510, 500, 100, H, 160)), "hinged at the top: low pointers swing harder")
  assert.ok(Math.abs(L.swingFor(510, 500, 700, H, 160)) < 0.25, "the swing is bounded")
}

for (const p of [L.KICK, L.SNARE, L.HAT]) assert.equal(p.length, 16, "drum patterns are one bar of 16ths")
assert.equal(L.BASS.length % 16, 0, "the bass line is whole bars")
assert.ok(L.BASS.every((s) => s === -1 || (s >= 0 && s <= 12)), "the bass stays inside an octave of A")
assert.ok(Math.abs(L.noteHz(0) - 55) < 1e-9 && Math.abs(L.noteHz(12) - 110) < 1e-9, "semitones map to A1 and A2")

console.log(`${SLUG}: ok`)
