// Runnable check for the coordinate, Moon, star and drag maths in
// components/lunar-boarding-pass, plus the install-safety rules the .tsx keeps.
// Run: node tests/lunar-boarding-pass.test.mjs
//
// The Moon is canvas and cannot be asserted here. What can — and what breaks
// silently — is everything feeding it: a landing site printed in the wrong
// hemisphere, a sea that drifts off its real coordinates, a dot radius that
// goes NaN and blanks the whole disc, a stub that tears on a twitch.
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

const dir = new URL("../components/lunar-boarding-pass/", import.meta.url)
const src = readFileSync(new URL("lunar-boarding-pass.tsx", dir), "utf8")

const start = src.indexOf("// #region pass")
const end = src.indexOf("// #endregion")
assert.ok(start > -1 && end > start, "pass region markers missing")

let js = src.slice(start, end).split(": (() => number)").join("")
js = js.replace(/:\s*(number\[\]\[\]|number\[\]|number|string|boolean)(?!\w)/g, "")
const T = await import("data:text/javascript," + encodeURIComponent(js))
const { toDMS, coordsDMS, coordsDecimal, project, angDist, albedo, moonDots, turnFor, lightFrom, idleAt, dotRadius, tiltFrom, tearDecision, resist, starField, MARIA } = T

// ---- coordinates -------------------------------------------------------------
{
  assert.equal(toDMS(0.67416, "N", "S"), "0°40'27\"N", "Tranquility Base latitude")
  assert.equal(toDMS(23.47314, "E", "W"), "23°28'23\"E", "Tranquility Base longitude")
  assert.equal(toDMS(-3.01239, "N", "S"), "3°00'45\"S", "south is south")
  assert.equal(toDMS(10.99999, "N", "S"), "11°00'00\"N", "60 seconds carry into the next degree")
  assert.equal(toDMS(NaN, "N", "S"), "0°00'00\"N", "garbage in prints as zero, not NaN")
  assert.equal(coordsDMS(0.67416, 23.47314), "0°40'27\"N 23°28'23\"E")
  assert.equal(coordsDecimal(0.67416, 23.47314), "0.67416°, 23.47314°")
  assert.equal(coordsDecimal(Infinity, -1), "0.00000°, -1.00000°")
}

// ---- the globe ---------------------------------------------------------------
{
  const near = (a, b) => Math.abs(a - b) < 1e-9
  const c = project(0, 0)
  assert.ok(near(c[0], 0) && near(c[1], 0) && near(c[2], 1), "0,0 faces the viewer")
  assert.ok(project(0, 90)[0] > 0.999, "east is to the right")
  assert.ok(project(90, 0)[1] < -0.999, "north is up (y grows downward)")
  for (const [la, lo] of [[12, 40], [-70, 170], [0.5, -0.5]]) {
    const p = project(la, lo)
    assert.ok(near(Math.hypot(...p), 1), "project returns a unit vector")
  }
  assert.ok(near(angDist(0, 0, 0, 90), 90), "a quarter turn is 90°")
  assert.ok(near(angDist(10, 20, 10, 20), 0), "a point is 0° from itself")
}

// ---- the surface: seas are dark where they really are --------------------------
{
  for (const m of MARIA) assert.equal(m.length, 4, "a sea is lat, lon, radius, depth")
  const sea = albedo(8.5, 31) // Mare Tranquillitatis
  const land = albedo(-30, 10) // southern highlands
  assert.ok(sea < land - 0.2, "Tranquillitatis must read darker than the highlands: " + sea + " vs " + land)
  assert.ok(albedo(-43.3, -11.2) > land, "Tycho is bright")
  for (let la = -90; la <= 90; la += 7.5) for (let lo = -180; lo <= 180; lo += 7.5) {
    const a = albedo(la, lo)
    assert.ok(a >= 0 && a <= 1 && Number.isFinite(a), "albedo out of range at " + la + "," + lo)
  }
}

// ---- the halftone lattice -------------------------------------------------------
{
  const dots = moonDots(100, 100, 50, 4, 0)
  assert.equal(dots.length % 6, 0, "six numbers per dot")
  const n = dots.length / 6
  assert.ok(n > 400 && n < 800, "a hex lattice at that pitch fills the disc: " + n)
  for (let i = 0; i < dots.length; i += 6) {
    assert.ok(Math.hypot(dots[i] - 100, dots[i + 1] - 100) < 50, "a dot outside the disc")
    assert.ok(dots[i + 4] > 0, "every dot faces the viewer")
  }
  assert.deepEqual(moonDots(0, 0, 0, 4, 0), [], "no radius, no dots")
  assert.deepEqual(moonDots(0, 0, 10, 0, 0), [], "a zero pitch must not loop forever")
  assert.notDeepEqual(moonDots(100, 100, 50, 4, 30), dots, "turning the globe moves the surface")

  // The stub crops the western limb: a site there is turned into view, one
  // already in view is left alone.
  assert.equal(turnFor(23.47), 0, "Tranquility Base is already on show")
  assert.ok(-23.4 + turnFor(-23.4) >= 12 - 1e-9, "Ocean of Storms is turned east into view")
  assert.ok(turnFor(-170) <= 60, "but never more than 60°")
}

// ---- light and dots ---------------------------------------------------------------
{
  const full = lightFrom(0.5, 0.5)
  assert.ok(full[2] > 0.999, "centre pointer is a full moon")
  assert.ok(lightFrom(0, 0.5)[0] < 0 && lightFrom(0, 0.5)[2] < 0, "far left lights a crescent from behind-left")
  assert.ok(lightFrom(1, 0.5)[0] > 0, "far right lights from the right")
  for (const p of [[-1, 2], [NaN, NaN], [0.3, 0.9]]) {
    const l = lightFrom(p[0], p[1])
    assert.ok(Math.abs(Math.hypot(...l) - 1) < 1e-9, "light is a unit vector for " + p)
  }
  for (let t = 0; t < 60; t += 0.5) {
    const v = idleAt(t)
    assert.ok(v > 0.45 && v < 0.7, "idle light stays gibbous")
  }
  // A dot never exceeds a cell (they would merge into a white disc), and the
  // dark side keeps a faint earthshine so the disc never vanishes entirely.
  const cell = 10
  for (const l of [full, lightFrom(0, 0.5), lightFrom(1, 0.2)]) {
    for (let i = 0; i < 200; i++) {
      const nx = Math.cos(i) * 0.9
      const ny = Math.sin(i * 1.7) * 0.4
      const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny))
      const r = dotRadius(i / 200, nx, ny, nz, l, cell)
      assert.ok(r >= 0 && r <= cell / 2, "dot radius out of range: " + r)
    }
  }
  assert.ok(dotRadius(1, 0, 0, 1, [0, 0, -1], cell) > 0, "earthshine: the unlit side still prints")
  assert.ok(dotRadius(1, 0, 0, 1, full, cell) > dotRadius(1, 0, 0, 1, [0, 0, -1], cell) * 3, "lit is much brighter than unlit")
}

// ---- tilt, tear, stars -------------------------------------------------------------
{
  assert.deepEqual(tiltFrom(0.5, 0.5, 6).map(Math.abs), [0, 0], "centred pointer holds it flat")
  const [rx, ry] = tiltFrom(1, 0, 6)
  assert.equal(ry, 6, "right edge turns it right")
  assert.equal(rx, 6, "top edge tips it back")
  assert.deepEqual(tiltFrom(9, -9, 6), [6, 6], "clamped to the max")

  assert.equal(tearDecision(3, 0.1, 200), false, "a twitch does not tear")
  assert.equal(tearDecision(50, 0.1, 200), true, "a fifth of the stub tears")
  assert.equal(tearDecision(15, 0.9, 200), true, "a flick tears")
  assert.equal(tearDecision(5, 2, 200), false, "but not a flick that went nowhere")
  assert.equal(resist(10, 200), 10, "free at first")
  assert.ok(resist(200, 200) < 80, "then stiff")
  assert.equal(resist(-20, 200), 0, "never pulls backwards")
  for (let d = 1; d < 400; d++) assert.ok(resist(d, 200) > resist(d - 1, 200), "resistance is monotonic")

  const a = starField(1969, 120, 240, 990, 10, 320)
  assert.deepEqual(a, starField(1969, 120, 240, 990, 10, 320), "same seed, same sky (SSR and client agree)")
  assert.notDeepEqual(a, starField(1970, 120, 240, 990, 10, 320), "different seed, different sky")
  assert.equal(a.length, 120)
  for (const s of a) {
    assert.ok(s[0] >= 240 && s[0] <= 990 && s[1] >= 10 && s[1] <= 320, "a star outside its box")
    assert.ok(s[2] > 0 && s[2] < 2, "star radius")
  }
  assert.ok(a.some((s) => s[3] === 1) && a.some((s) => s[3] === 0), "some twinkle, most do not")
}

// ---- install safety -----------------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "the only import may be react")

const code = src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1")
assert.doesNotMatch(code, /@import/, "no @import — the host owns Tailwind and fonts")
assert.doesNotMatch(code, /(^|[",}])\s*(\*|body|:root|html)\s*{/m, "no bare global resets")
assert.doesNotMatch(code, /[`]/, "no backticks — build CSS strings with concatenation")
assert.doesNotMatch(code, /\$\{/, "no template interpolation anywhere near the CSS")
assert.doesNotMatch(code, /https?:\/\//, "nothing is fetched: the capture sandbox blocks other origins")
assert.doesNotMatch(code, /innerWidth|innerHeight|scrollY/, "size from the element, not the window")

// Every rule is scoped under .lbp so it cannot leak into the host page.
const css = src.slice(src.indexOf("const CSS = ["), src.indexOf('].join("")', src.indexOf("const CSS = [")))
for (const rule of css.match(/"[^"]*\{/g) || []) {
  const sel = rule.slice(1, -1).split("}").pop()
  if (/^(@|from|to|\d|[\d%,]+$)/.test(sel.trim()) || sel.trim() === "") continue
  for (const part of sel.split(",")) assert.ok(/\.lbp/.test(part), "unscoped selector: " + part)
}

// Sized by width and an aspect ratio. A percentage height on the root collapses
// wherever the host page has no height chain.
assert.ok(/aspectRatio: VIEW_W \+ " \/ " \+ VIEW_H/.test(src), "the ticket keeps its ratio")
assert.doesNotMatch(src, /\bh-(full|screen)\b/, "no percentage height anywhere")
assert.ok(src.includes('containerType: "inline-size"'), "the ticket must be a size container")
assert.ok(/"cqw"|cqw"/.test(src), "type is sized in container units")

// Preflight: absolutely positioned media must opt out of max-width.
assert.ok((src.match(/maxWidth: "none"/g) || []).length >= 4, "full-bleed layers must opt out of max-width")

// The canvas redraws when resized, pauses off screen, and everything is released.
assert.ok(src.includes("canvas.clientWidth"), "the Moon measures its own box")
for (const gone of ["observer.disconnect()", "io.disconnect()", "cancelAnimationFrame(raf)", 'removeEventListener("change", onMq)']) {
  assert.ok(src.includes(gone), "cleanup is missing " + gone)
}

// Reduced motion: no drift, twinkle, flame, notes, type-in or stamp thump, and
// the flip and tear land instantly. The pointer-led light still works.
assert.ok(src.includes("prefers-reduced-motion"), "must read prefers-reduced-motion")
assert.ok(/!raf && visible && !reduced/.test(src), "reduced motion must stop the Moon's loop")
assert.ok(/prefers-reduced-motion: reduce\)\{[^}]*\.lbp-flip[^}]*transition-duration/.test(src), "and the flip")
assert.ok(/\.lbp-tw,\.lbp-flame,\.lbp-v,\.lbp-stamp,\.lbp-note\{animation:none/.test(src), "and every keyframe")
// The stamp and printed values must still show with their animations off.
assert.ok(src.includes(".lbp-main.is-torn .lbp-stamp{opacity:.86"), "the stamp is visible without its animation")
assert.ok(!/\.lbp-v\{[^}]*clip-path/.test(src), "values are only clipped inside the keyframes")

// Operable without a pointer: the stub is a real button that reports its state,
// it leaves the tab order when its face is turned away, and the sides switch.
assert.ok(src.includes('type="button"') && src.includes("aria-pressed={torn}"), "the stub is a toggle button")
assert.ok(src.includes("tabIndex={front ? -1 : 0}"), "the hidden stub is not focusable")
assert.ok(src.includes("aria-hidden={!front}") && src.includes("aria-hidden={front}"), "the turned-away face is hidden")
assert.ok(src.includes("aria-pressed={side === s}"), "the side switch reports which side is up")
assert.ok(src.includes("e.stopPropagation()"), "tearing the stub must not also turn the ticket")
assert.ok(src.includes('aria-live="polite"'), "the side change is announced")

// Filter ids are per instance; two tickets on a page must not share one.
assert.ok(src.includes("React.useId()"), "filter ids must be unique per mount")

// A demo wrapper left at width:auto collapses inside 21st's centring flex.
for (const demo of ["demo.tsx"]) {
  const d = readFileSync(new URL(demo, dir), "utf8")
  const first = d.match(/return \(\s*<div className="([^"]*)"/)
  assert.ok(first && /\bw-(full|screen)\b/.test(first[1]), demo + " wraps the ticket without a width")
  assert.ok(d.includes('from "@/components/ui/lunar-boarding-pass"'), demo + " imports the installer's path")
}

console.log("lunar-boarding-pass: ok")
