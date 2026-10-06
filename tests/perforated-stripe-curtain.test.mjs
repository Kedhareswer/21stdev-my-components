// Install-safety and logic checks for components/perforated-stripe-curtain.
// Run: node tests/perforated-stripe-curtain.test.mjs
//
// The drawing and the audio graph can't be asserted here. What is checked is
// what fails quietly: a strip that hangs off the canvas or sits flush, a
// curtain that opens lopsided or not at all, a swing that pushes the wrong way
// or barely moves, strips that change length, a bass line off the scale.
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const SLUG = "perforated-stripe-curtain"
const read = (f) => readFileSync(new URL(`../components/${SLUG}/${f}`, import.meta.url), "utf8").replace(/\r\n/g, "\n")
const src = read(`${SLUG}.tsx`)

/* ---------- install safety ---------- */

const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "react is the only import")
assert.doesNotMatch(src, /@import|@font-face|fetch\(|https?:\/\//, "nothing loads by default — the groove is synthesized, the picture painted")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")
assert.ok(src.includes('height = "100svh"'), "height defaults to a definite length")
assert.match(src, /style=\{\{ height, background/, "the height prop reaches the root")
assert.match(src, /relative w-full/, "the root claims full width inside a flex wrapper")
assert.doesNotMatch(src.slice(0, src.indexOf("</")), /use(State|Ref|Memo|Callback)<|Partial<|Record<|React\.(PointerEvent|KeyboardEvent)</, "no generics before the JSX (21st CLI tokenizer)")
assert.match(src, /prefers-reduced-motion/, "reduced motion is honoured")
assert.match(src, /a\.ctx\?\.close\(\)/, "the audio context is closed on unmount")
assert.match(src, /aria-pressed=\{playing\}/, "the play button reports its state")
assert.doesNotMatch(src, /s\.len\b|s\.vel\b|bandOf/, "strips never change length — only their angle moves")
assert.match(src, /const L = s\.rest\[i\] \* H/, "each strip is drawn at its fixed resting length")
assert.match(src, /el\.onerror = \(\) => \{[\s\S]*?paintBackdrop/, "a picture that fails to load falls back to the painted one")
{
  const css = src.match(/const PSC_CSS = `([\s\S]*?)`/)[1]
  assert.doesNotMatch(css, /\$\{|(^|[\s}])(\*|body|html|:root)\s*\{/, "no interpolation, no global resets")
  assert.match(css, /\.psc-canvas\{[^}]*max-width:none/, "the canvas is guarded against Preflight")
}
for (const d of ["demo.tsx", "demo-custom.tsx"]) {
  assert.match(read(d), /from "@\/components\/ui\/perforated-stripe-curtain"/, `${d} imports the installed path`)
}
assert.doesNotMatch(read("demo.tsx"), /https?:\/\//, "the primary demo is self-contained, so 21st can capture it")

/* ---------- logic ---------- */

const a = src.indexOf("// #region logic\n")
const b = src.indexOf("// #endregion logic\n")
assert.ok(a > -1 && b > a, "logic region missing")
const L = await import(
  "data:text/javascript," +
    encodeURIComponent(stripTypeScriptTypes(src.slice(a, b)) + "\nexport { restLengths, openAngle, swingFor, noteHz, KICK, SNARE, HAT, BASS }"),
)

{
  const r = L.restLengths(22)
  assert.equal(r.length, 22)
  assert.ok(r.every((v) => v >= 0.72 && v <= 0.95), "strips rest inside the frame")
  assert.ok(Math.max(...r) - Math.min(...r) > 0.04, "the hem is ragged, not a straight line")
  assert.deepEqual(L.restLengths(22), r, "the same curtain every render")
}

{
  // the curtain opens from the middle: symmetric, outward, centre strips most
  for (const n of [5, 22, 30]) {
    assert.equal(L.openAngle(0, n, 0), 0, "closed is closed")
    for (let i = 0; i < n; i++) {
      const v = L.openAngle(i, n, 1)
      const mirror = L.openAngle(n - 1 - i, n, 1)
      assert.ok(Math.abs(v + mirror) < 1e-9, `strip ${i}/${n} mirrors its partner`)
      if (i < (n - 1) / 2) assert.ok(v <= 0, "the left half swings left")
      if (i > (n - 1) / 2) assert.ok(v >= 0, "the right half swings right")
      assert.ok(Math.abs(v) <= 0.62 + 1e-9, "never past the cap")
    }
    const c = Math.floor(n / 2) + 1
    assert.ok(Math.abs(L.openAngle(c, n, 1)) > Math.abs(L.openAngle(n - 1, n, 1)), "the middle opens wider than the edge")
    assert.ok(Math.abs(L.openAngle(c, n, 0.5)) < Math.abs(L.openAngle(c, n, 1)), "half open is half way")
  }
}

{
  const H = 800
  assert.equal(L.swingFor(500, -1, -1, H, 160), 0, "no pointer, no swing")
  assert.equal(L.swingFor(500, 100, 400, H, 160), 0, "out of reach, no swing")
  assert.ok(L.swingFor(520, 500, 600, H, 160) > 0, "a strip right of the pointer swings right")
  assert.ok(L.swingFor(480, 500, 600, H, 160) < 0, "...and left of it, left")
  assert.ok(Math.abs(L.swingFor(510, 500, 700, H, 160)) > Math.abs(L.swingFor(510, 500, 100, H, 160)), "hinged at the top: low pointers swing harder")
  assert.ok(Math.abs(L.swingFor(505, 500, 790, H, 160)) > 0.3, "a real parting, not a nudge")
  assert.ok(Math.abs(L.swingFor(505, 500, 790, H, 160)) <= 0.55, "the swing is bounded")
}

for (const p of [L.KICK, L.SNARE, L.HAT]) assert.equal(p.length, 16, "drum patterns are one bar of 16ths")
assert.equal(L.BASS.length % 16, 0, "the bass line is whole bars")
assert.ok(L.BASS.every((s) => s === -1 || (s >= 0 && s <= 12)), "the bass stays inside an octave of A")
assert.ok(Math.abs(L.noteHz(0) - 55) < 1e-9 && Math.abs(L.noteHz(12) - 110) < 1e-9, "semitones map to A1 and A2")

console.log(`${SLUG}: ok`)
