// Runnable check for components/doodle-crew-footer: the wordmark layout, the
// seats, the gaze, the doodle drift and the storyboard timing, plus the
// install-safety rules.
// Run: node tests/doodle-crew-footer.test.mjs
//
// What breaks silently here: a bad glyph advance that throws the word off the
// page, a crew member seated off its letter, pupils that leave their eyes or
// snap when the pointer sits on a face, doodles that drift away for good (the
// sky empties after a minute) or never come back from a pop, and a storyboard
// whose crew arrives before the word is down.
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const read = (file) =>
  readFileSync(new URL("../components/doodle-crew-footer/" + file, import.meta.url), "utf8").replace(/\r\n/g, "\n")
const src = read("doodle-crew-footer.tsx")

const start = src.indexOf("// #region crew")
const end = src.indexOf("// #endregion")
assert.ok(start > -1 && end > start, "crew region markers missing")
const T = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(src.slice(start, end))))

// ---- wordmark layout ---------------------------------------------------------------
{
  const L = T.layoutWord([100, 50, 120], -0.02, 200)
  assert.deepEqual(L.x, [0, 96, 142])
  assert.deepEqual(L.w, [100, 50, 120])
  assert.equal(L.width, 262, "no tracking after the last letter")
  const bad = T.layoutWord([100, NaN, -5, 80], 0, 200)
  assert.deepEqual(bad.w, [100, 0, 0, 80], "bad advances count as zero")
  assert.equal(bad.width, 180)
  assert.equal(T.layoutWord([], 0, 200).width, 0)
  assert.equal(T.layoutWord([10, 10], NaN, 200).width, 20)
}

// ---- seats ---------------------------------------------------------------------------
{
  assert.deepEqual(T.seatPoint("front", 100, 80, 146, 0, 1), { x: 140, y: 0 }, "front stands on the baseline, centred")
  assert.deepEqual(T.seatPoint("top", 100, 80, 146, 0.25, 1), { x: 160, y: -146 }, "top sits on the cap line")
  const b = T.seatPoint("behind", 100, 80, 146, 0, 2)
  assert.equal(b.y, -146 + 60, "behind sinks below the edge so the letter hides its lower part")
  assert.equal(T.seatPoint("front", 0, 80, 146, NaN, 1).x, 40)
}

// ---- gaze ----------------------------------------------------------------------------
{
  for (const [tx, ty] of [[1000, 0], [-400, 300], [3, 4], [0, -9999]]) {
    const o = T.lookAt(0, 0, tx, ty, 3, 220)
    assert.ok(Math.hypot(o.x, o.y) <= 3 + 1e-9, "pupil stays inside its eye")
  }
  const far = T.lookAt(0, 0, 1000, 0, 3, 220)
  assert.ok(Math.abs(far.x - 3) < 1e-9 && Math.abs(far.y) < 1e-9, "looks straight at a far target")
  const near = T.lookAt(0, 0, 11, 0, 3, 220)
  assert.ok(near.x > 0 && near.x < 0.5, "eases off close up instead of snapping")
  assert.deepEqual(T.lookAt(5, 5, 5, 5, 3, 220), { x: 0, y: 0 }, "on the eye: centred")
  assert.deepEqual(T.lookAt(0, 0, NaN, 0, 3, 220), { x: 0, y: 0 })
}

// ---- doodle drift ----------------------------------------------------------------------
{
  let seed = 7
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
  const W = 1000
  const H = 400
  const fl = Array.from({ length: 12 }, (_, k) => ({ x: k * 80, y: k * 30, vx: 0, vy: 0, rot: 0, vr: 0, fall: 9 + k, phase: k, pop: 0 }))
  for (let s = 0; s < 60 * 120; s++) for (const f of fl) T.stepFloater(f, 1 / 60, s / 60, W, H, NaN, NaN, 110, rand)
  for (const f of fl) {
    assert.ok(Number.isFinite(f.x + f.y + f.rot), "no NaN after two minutes")
    assert.ok(f.x >= -40 && f.x <= W + 40 && f.y >= -120 && f.y <= H + 40, "still in the sky after two minutes")
  }
  // the pointer pushes a doodle away
  const f = { x: 500, y: 200, vx: 0, vy: 0, rot: 0, vr: 0, fall: 10, phase: 0, pop: 0 }
  for (let s = 0; s < 20; s++) T.stepFloater(f, 1 / 60, s / 60, W, H, 470, 200, 110, rand)
  assert.ok(f.x > 510, "pushed away from the pointer (" + f.x.toFixed(1) + ")")
  // a popped doodle waits, then comes back in from the top
  const p = { x: 500, y: 200, vx: 0, vy: 0, rot: 0, vr: 0, fall: 10, phase: 0, pop: 1.4 }
  T.stepFloater(p, 1 / 60, 0, W, H, NaN, NaN, 110, rand)
  assert.equal(p.y, 200, "holds still while popped")
  for (let s = 0; s < 120; s++) T.stepFloater(p, 1 / 60, 0, W, H, NaN, NaN, 110, rand)
  assert.equal(p.pop, 0)
  assert.ok(p.y < 0, "respawned above the top")
  // a huge frame gap doesn't fling it
  const g = { x: 500, y: 200, vx: 0, vy: 0, rot: 0, vr: 0, fall: 10, phase: 0, pop: 0 }
  T.stepFloater(g, 5, 0, W, H, NaN, NaN, 110, rand)
  assert.ok(Math.abs(g.y - 200) < 5, "dt is clamped")
}

// ---- storyboard ----------------------------------------------------------------------
{
  const t = T.timeline(8, 6, 11, 2)
  for (let i = 1; i < 8; i++) assert.ok(t.letter(i) > t.letter(i - 1), "letters stamp left to right")
  assert.ok(t.crewStart > t.letter(7), "crew waits for the word")
  assert.ok(t.member(0) >= t.crewStart && t.member(5) > t.member(4))
  assert.ok(t.word(0) > t.crewStart && t.action(0) > t.word(10), "copy, then buttons")
  assert.ok(t.total > t.action(1) && t.total < 6000, "whole story inside six seconds (" + t.total + ")")
  const z = T.timeline(0, 0, 0, 0)
  assert.ok(Number.isFinite(z.total) && z.total > 0, "empty footer still has a finite story")
}

// ---- install safety ------------------------------------------------------------------
{
  assert.ok(/height = "760px"/.test(src), "height defaults to a definite length")
  assert.doesNotMatch(src, /\bh-full\b/, "no h-full anywhere")
  assert.doesNotMatch(src, /@import/, "no @import")
  const css = src.slice(src.indexOf("const CSS ="))
  assert.ok(css.length > 4000, "found the CSS block")
  assert.doesNotMatch(css, /`|\$\{/, "no backticks or ${ in the CSS string")
  for (const m of css.matchAll(/"([^"]*?)\{/g)) {
    for (const part of m[1].split("}")) {
      const sel = part.trim()
      if (!sel || /^@|^\d|^from|^to/.test(sel)) continue
      for (const one of sel.split(",")) assert.ok(/\.dcf/.test(one), "unscoped selector: " + one)
    }
  }
  assert.ok(css.includes("prefers-reduced-motion"), "honours reduced motion")
  assert.ok(src.includes("reduced") && /matchMedia\("\(prefers-reduced-motion: reduce\)"\)/.test(src), "the loop stops moving under reduced motion too")
  assert.ok(/\.dcf svg\{max-width:none/.test(css), "guards Preflight's svg max-width")
  assert.doesNotMatch(src, /https?:\/\/(?!www\.w3\.org)/, "no external assets")
  assert.ok(src.includes("React.useId()"), "per-instance ids")
  assert.deepEqual([...src.matchAll(/^import .* from "([^"]+)"/gm)].map((m) => m[1]), ["react"])
  // The 21st CLI hangs on generics before the first JSX close tag.
  const head = src.slice(0, src.indexOf("</"))
  assert.doesNotMatch(head, /use(State|Ref|Memo|Callback)<|Partial<|Record<|Array<|Map<|React\.[A-Za-z]+<|\[K in /)

  const tsconfig = readFileSync(new URL("../tsconfig.json", import.meta.url), "utf8")
  assert.ok(tsconfig.includes('"@/components/ui/doodle-crew-footer"'), "tsconfig paths line")
  for (const demo of ["demo.tsx", "demo-sunny.tsx"]) {
    assert.ok(read(demo).includes('from "@/components/ui/doodle-crew-footer"'), demo + " imports the installed path")
  }
}

console.log("doodle-crew-footer: ok")
