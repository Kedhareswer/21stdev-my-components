// Install-safety and logic checks for components/cold-flame-drift.
// Run: node tests/cold-flame-drift.test.mjs
//
// What fails quietly in a flame field: a colour string that turns an ink
// black, an angle that sends the flames sideways, a profile that goes NaN at
// the tip, grain seeds that grow until float32 hashing turns to static, and a
// shader that drifts from the JS it mirrors.
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const SLUG = "cold-flame-drift"
const read = (f) => readFileSync(new URL(`../components/${SLUG}/${f}`, import.meta.url), "utf8").replace(/\r\n/g, "\n")
const src = read(`${SLUG}.tsx`)

/* ---------- install safety ---------- */

const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "react is the only import")
assert.doesNotMatch(src, /@import|@font-face|fetch\(|https?:\/\//, "nothing loads at runtime")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")
assert.match(src, /height = "100svh"/, "explicit default height")
assert.doesNotMatch(src.slice(0, src.indexOf("</")), /use(State|Ref|Memo|Callback)<|Partial<|Record<|React\.[A-Za-z]+</, "no generics before the JSX (21st CLI tokenizer)")
assert.match(src, /prefers-reduced-motion/, "reduced motion is honoured")
assert.match(src, /IntersectionObserver/, "the loop sleeps off-screen")
assert.match(src, /ResizeObserver/, "the canvas follows its own box")
assert.doesNotMatch(src, /innerWidth|innerHeight/, "size from the element, not the window")
{
  const css = src.match(/const CF_CSS = \[([\s\S]*?)\]\.join/)[1]
  assert.doesNotMatch(css, /\$\{|`|(^|[\s"}])(\*|body|html|:root)\s*\{/, "no interpolation, no global resets")
  assert.match(css, /\.cfd-root\{[^}]*width:100%/, "the root claims full width")
  assert.match(css, /\.cfd-canvas\{[^}]*max-width:none/, "the canvas is guarded against Preflight")
  assert.match(css, /pointer-events:none/, "the overlay lets the pointer reach the flames")
}
{
  const frag = src.match(/const FRAG = \[([\s\S]*?)\]\.join/)[1]
  assert.match(frag, /w\*sqrt\(min\(1\.,tt\*3\.5\)\)\*pow\(1\.-tt,\.85\)/, "shader profile matches flameWidth")
  assert.match(frag, /tt=clamp\(tt,0\.,1\.\)/, "shader clamps tt before pow, like flameWidth")
  assert.doesNotMatch(frag, /`|\$\{/, "the shader is a plain string")
}
for (const demo of ["demo.tsx", "demo-studio.tsx"]) {
  const d = read(demo)
  assert.match(d, /from "@\/components\/ui\/cold-flame-drift"/, `${demo} imports the installed path`)
  assert.doesNotMatch(d, /https?:\/\//, `${demo} is self-contained, so 21st can capture it`)
}

/* ---------- logic ---------- */

const a = src.indexOf("// #region logic\n")
const b = src.indexOf("// #endregion logic\n")
assert.ok(a > -1 && b > a, "logic region missing")
const L = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(src.slice(a, b))))

// colours
assert.deepEqual(L.hexToRgb("#ff0000"), [1, 0, 0])
assert.deepEqual(L.hexToRgb("#0f0"), [0, 1, 0])
assert.deepEqual(L.hexToRgb("  00F "), [0, 0, 1])
assert.deepEqual(L.hexToRgb("tomato", [0.1, 0.2, 0.3]), [0.1, 0.2, 0.3], "unparseable colours use the fallback")
assert.deepEqual(L.hexToRgb(undefined), [0, 0, 0])
{
  const pal = src.match(/export const PALETTES = \{([\s\S]*?)\} as const/)[1]
  const hexes = [...pal.matchAll(/"([^"]*)"/g)].map((m) => m[1])
  assert.equal(hexes.length, 20, "five palettes, four inks each")
  for (const h of hexes) assert.match(h, /^#[0-9a-f]{6}$/, `${h} is a 6-digit hex`)
}

// direction: angle is counter-clockwise from →, on a y-down screen
{
  const near = (x, y) => Math.abs(x - y) < 1e-9
  const [x0, y0] = L.flowDir(0)
  assert.ok(near(x0, 1) && near(y0, 0), "0° points right")
  const [x9, y9] = L.flowDir(90)
  assert.ok(near(x9, 0) && near(y9, -1), "90° points up the screen")
  const [xd, yd] = L.flowDir(42)
  assert.ok(xd > 0 && yd < 0, "the default flows up and to the right")
  assert.deepEqual(L.flowDir(NaN), L.flowDir(42), "a bad angle falls back to the default")
  for (const ang of [-90, -13, 0, 42, 90, 400]) {
    const [x, y] = L.flowDir(ang)
    assert.ok(Math.abs(Math.hypot(x, y) - 1) < 1e-9, "unit length")
  }
}

// flame profile: blunt base, widest early, pointed tip, never NaN
{
  assert.equal(L.flameWidth(0, 1), 0, "zero at the base")
  assert.equal(L.flameWidth(1, 1), 0, "zero at the tip")
  assert.equal(L.flameWidth(-3, 1), 0, "clamped below")
  assert.equal(L.flameWidth(7, 1), 0, "clamped above, never NaN from pow")
  let peak = 0
  let at = 0
  for (let i = 0; i <= 1000; i++) {
    const v = L.flameWidth(i / 1000, 1)
    assert.ok(Number.isFinite(v) && v >= 0 && v <= 1)
    if (v > peak) [peak, at] = [v, i / 1000]
  }
  assert.ok(at > 0.1 && at < 0.45, "widest in the lower body, so it reads as a flame and not a lens")
  assert.ok(L.flameWidth(0.9, 1) < L.flameWidth(0.5, 1), "tapers toward the tip")
  assert.equal(L.flameWidth(0.3, 2), 2 * L.flameWidth(0.3, 1), "thickness scales linearly")
}

// props are clamped, junk falls back
assert.equal(L.clampProp(5, 0, 1, 0.5), 1)
assert.equal(L.clampProp(-5, 0, 1, 0.5), 0)
assert.equal(L.clampProp(NaN, 0, 1, 0.5), 0.5)
assert.equal(L.clampProp(undefined, 0, 1, 0.5), 0.5)
assert.equal(L.clampProp(Infinity, 0, 1, 0.5), 0.5)

// boil runs on its own 12 fps clock and stays a small hash seed
{
  const frames = new Set()
  for (let i = 0; i < 120; i++) frames.add(L.boilFrame(i / 120, 12))
  assert.equal(frames.size, 12, "one second at 12 fps is 12 grain frames")
  assert.equal(L.boilFrame(0.01, 12), L.boilFrame(0.05, 12), "grain holds between its frames")
  assert.equal(L.boilFrame(5, 0), 0, "fps 0 freezes")
  assert.equal(L.boilFrame(NaN, 12), 0)
  assert.equal(L.boilFrame(-1, 12), 0)
  for (const t of [0, 1e3, 1e5, 1e8]) assert.ok(L.boilFrame(t, 12) < 997, `frame index bounded at t=${t}`)
}

assert.ok(Math.abs(L.approach(0, 10, 1, 7) - 10) < 0.01, "settles within a second at k=7")
assert.equal(L.approach(3, 3, 0.016, 7), 3)

console.log("cold-flame-drift: ok")
