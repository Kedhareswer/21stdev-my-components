// Install-safety and motion check for components/paper-plane-drawer-footer.
// Run: node tests/paper-plane-drawer-footer.test.mjs
//
// The drawer's timing and the planes' flight maths live in the .tsx (the published
// component stays one file), so the marked region is lifted out, its type
// annotations stripped, and run here. The rest are source assertions for the
// failures that only show once the file is installed somewhere else.
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

const src = readFileSync(
  new URL("../components/paper-plane-drawer-footer/paper-plane-drawer-footer.tsx", import.meta.url),
  "utf8",
)

/* ---------------------------------------------------------------- motion */

const start = src.indexOf("// #region motion")
const end = src.indexOf("// #endregion")
assert.ok(start > -1 && end > start, "motion region markers missing")
const js = src
  .slice(start, end)
  .replace(/export type Flight = \{[\s\S]*?\n\}\n/, "")
  .replace(/:\s*(Flight\[\]|Flight|number)(?=[,)\s=])/g, "")
const M = await import("data:text/javascript," + encodeURIComponent(js))

// Measured off the reference at 60 fps: out in ~0.63 s, back in ~0.37 s, one plane a
// little after the drawer starts moving, gliding about 1.2 s.
assert.equal(M.OPEN_MS, 630)
assert.equal(M.CLOSE_MS, 370)
assert.ok(M.CLOSE_MS < M.OPEN_MS, "pushing in is quicker than pulling out")
assert.ok(M.LAUNCH_MS > 300 && M.LAUNCH_MS < M.OPEN_MS, "plane leaves while the drawer is still coming out")
assert.equal(M.FLIGHT_MS, 1200)

// Shut is shut, out is out.
const shift = 40
const shut = M.drawerAt(0, shift)
assert.deepEqual([shut.reveal, shut.rise, shut.pull], [0, 0, 0])
assert.ok(Math.abs(shut.front) < 1e-9, "front at rest when shut")
const out = M.drawerAt(1, shift)
assert.deepEqual([out.reveal, out.rise, out.pull], [1, 1, 1])
assert.ok(Math.abs(out.front - shift) < 1e-9, "front ends one shift lower")

// The order the reference shows: the front unseats upward first, the box grows up from the
// edge, and the pile only rises once the box is mostly open.
const early = M.drawerAt(0.1, shift)
assert.ok(early.front < 0 && early.front >= -M.LIFT_PX, "front lifts a few px as it unseats")
assert.equal(early.reveal, 0, "nothing shows during the lift")
assert.ok(M.drawerAt(0.38, shift).reveal > 0.8 && M.drawerAt(0.38, shift).rise === 0, "box before pile")
let prev = -1
for (let p = 0; p <= 1.0001; p += 0.01) {
  const d = M.drawerAt(Math.min(1, p), shift)
  assert.ok(d.reveal >= prev - 1e-9, "reveal never goes backwards")
  prev = d.reveal
}

// Flights: start where they start, land where they land, never scaled past their laid-out size.
const w = 1440, h = 380
assert.ok(M.FLIGHTS.length >= 2, "at least the reference's two planes")
for (const f of M.FLIGHTS) {
  const a = M.poseAt(f, 0, w, h)
  const z = M.poseAt(f, 1, w, h)
  assert.ok(Math.abs(a.x - f.from[0] * w) < 1e-6 && Math.abs(a.y - f.from[1] * h) < 1e-6, "flight starts at its start")
  assert.ok(Math.abs(z.x - f.land[0] * w) < 1e-6 && Math.abs(z.y - f.land[1] * h) < 1e-6, "flight lands on its spot")
  assert.ok(Math.abs(z.rot - f.rest) < 1e-6 && z.alt === 0, "lands flat at its resting heading")
  assert.ok(f.land[0] > 0.08 && f.land[0] < 0.92 && f.land[1] > 0.25 && f.land[1] < 0.95, "landing spot is inside the drawer")
  // starts out of sight: above the box or off its left edge
  assert.ok(f.from[1] < 0 || f.from[0] < 0, "plane comes in from outside the drawer")
  for (let t = 0; t <= 1.0001; t += 0.02) {
    const q = M.poseAt(f, t, w, h)
    assert.ok(q.scale <= 1 + 1e-9, "plane never scaled up past its laid-out size (it would raster soft)")
    assert.ok(Math.abs(q.rot) <= 26.0001 || t > 0.7, "glider keeps its nose near level in flight")
    assert.ok(q.sy >= q.y, "shadow falls below the plane")
    assert.ok(q.shadow >= 0 && q.shadow <= 0.6, "shadow opacity sane")
  }
  // altitude only ever falls
  let alt = 2
  for (let t = 0; t <= 1.0001; t += 0.05) {
    const q = M.poseAt(f, t, w, h)
    assert.ok(q.alt <= alt + 1e-9, "plane only descends")
    alt = q.alt
  }
}
// No two planes land on top of each other.
for (let i = 0; i < M.FLIGHTS.length; i++)
  for (let j = i + 1; j < M.FLIGHTS.length; j++) {
    const a = M.FLIGHTS[i].land, b = M.FLIGHTS[j].land
    assert.ok(Math.hypot((a[0] - b[0]) * w, (a[1] - b[1]) * h) > 120, "landing spots too close: " + i + "," + j)
  }

/* ---------------------------------------------------------------- install safety */

// The root carries its own definite height; an installed page has no 100% chain.
assert.ok(/height = "100svh"/.test(src), "root height must default to a definite length")
assert.ok(/minHeight: height/.test(src), "root applies the height")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full anywhere")
assert.ok(/drawerHeight = "clamp\(/.test(src), "desk strip has a definite default height")

// Preflight's img/svg { max-width: 100% } would squeeze the drawer picture and the planes.
assert.ok(src.includes(".ppd-root img,.ppd-root svg{max-width:none}"), "Preflight max-width guard")
assert.ok(/width=\{1942\} height=\{809\}/.test(src), "drawer picture has explicit size")

// The picture is hosted, not embedded, and comes from the deployed site.
assert.ok(src.includes('"https://kedhar-components.pages.dev/paper-plane-drawer-footer/"'), "image base")

// Only the semantic tokens are assumed.
const tokens = [...src.matchAll(/var\(--color-([a-z-]+)\)/g)].map((m) => m[1])
for (const t of tokens) assert.ok(["background", "foreground", "muted-foreground", "border", "primary"].includes(t), "unknown token --color-" + t)

// 21st ships this file alone.
assert.doesNotMatch(src, /@import/, "no @import")
assert.doesNotMatch(src, /^\s*(\*|body|:root|html)\s*\{/m, "no bare global resets")
assert.ok(!/const CSS =[\s\S]*?\$\{/.test(src.slice(src.indexOf("const CSS ="), src.indexOf("/* ---", src.indexOf("const CSS =")))), "no ${ in the CSS string")
for (const m of src.matchAll(/^import .* from "([^"]+)"/gm)) assert.equal(m[1], "react", "only react is imported")

// Deliberate motion: reduced motion jumps straight to the end state, and planes land at once.
assert.ok(src.includes('matchMedia("(prefers-reduced-motion: reduce)")'), "reads reduced motion")
assert.ok(/if \(reduce\.matches\) p = target/.test(src), "drawer jumps under reduced motion")
assert.ok(/reduce\.matches \? \{ state: "landed"/.test(src), "planes land at once under reduced motion")

// Scroll-free, but still: no scale-up of small raster layers, no will-change on planes.
assert.doesNotMatch(src, /will-change/, "no will-change")

// Reachable without a mouse: the handle is a real button that says what it does.
assert.ok(/<button[\s\S]*?className="ppd-handle"[\s\S]*?aria-expanded/.test(src), "handle is a button with aria-expanded")
assert.ok(src.includes('"Open the drawer"') && src.includes('"Close the drawer"'), "handle label follows state")
assert.ok(src.includes('e.pointerType !== "mouse"'), "proximity opening is mouse-only; touch uses the handle")

// No identifiers from the original work.
assert.doesNotMatch(src, /sedrus/i, "no reference brand")

console.log("paper-plane-drawer-footer: ok")
