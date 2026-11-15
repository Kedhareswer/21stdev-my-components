// Install-safety and motion check for components/swing-panel-nav.
// Run: node tests/swing-panel-nav.test.mjs
//
// The first half is source assertions: the rules that only fail once the file
// is installed somewhere else. The second half lifts the "// #region swing"
// block out of the component and runs it against angles measured from the
// reference clip, frame by frame, so the motion cannot drift.
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

const src = readFileSync(
  new URL("../components/swing-panel-nav/swing-panel-nav.tsx", import.meta.url),
  "utf8",
)
const demo = readFileSync(new URL("../components/swing-panel-nav/demo.tsx", import.meta.url), "utf8")

// --- install safety -------------------------------------------------------
assert.ok(/height = "100svh"/.test(src), "root height must default to a definite length")
assert.ok(src.includes('style={{ height, width: "100%"'), "root needs width:100% (21st centres demos in a flex box)")
assert.ok(src.includes(".spn-root{position:relative;width:100%"), "root CSS must also carry width:100%")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full anywhere: percentage heights collapse once installed")
assert.doesNotMatch(src, /@import/, "no @import: the host owns its stylesheet")
assert.doesNotMatch(src, /`/, "no backticks in the file")
assert.doesNotMatch(src, /\$\{/, "no ${ in the file")
assert.doesNotMatch(src, /useRef</, "no useRef generics")
assert.doesNotMatch(src, /(^|[{}"])\s*(\*|body|html|:root)\s*\{/m, "no bare global resets")
assert.ok(Buffer.byteLength(src) < 200 * 1024, "21st rejects component files over 200 kB")
assert.match(demo, /from "@\/components\/ui\/swing-panel-nav"/, "demo imports the installed path")

// Only the semantic tokens the host is guaranteed to have.
const tokens = new Set(src.match(/var\(--color-[a-z-]+/g).map((t) => t.slice(4)))
for (const t of tokens) {
  assert.ok(
    ["--color-background", "--color-foreground", "--color-muted-foreground", "--color-border", "--color-primary"].includes(t),
    "unexpected token " + t,
  )
}

// --- structure, motion wiring and input -----------------------------------
assert.ok(src.includes("prefers-reduced-motion: reduce"), "JS must check reduced motion")
assert.ok(src.includes("@media (prefers-reduced-motion:reduce)"), "CSS must honour reduced motion")
assert.ok(
  src.includes("@media (hover:hover) and (pointer:fine){.spn-link:hover"),
  "hover slide only on fine pointers",
)
assert.ok(src.includes('e.pointerType !== "mouse" || !finePointer()'), "leave-to-close only for a mouse")
assert.ok(
  src.includes("aria-expanded={active === i}") && src.includes('aria-controls={panelId + "-" + i}'),
  "triggers are disclosure buttons",
)
assert.ok(src.includes('e.key !== "Escape"'), "Escape closes")
assert.ok(src.includes('setAttribute("inert"'), "a closed sheet must leave the tab order")
assert.ok(
  src.includes(".spn-arm{position:absolute;inset:0;z-index:2;pointer-events:none;transform-origin:140.2% 59%"),
  "the sheet turns about the measured pivot outside the stage, not its own corner",
)
assert.ok(src.includes('s.mode = "kick"'), "a swap hands the sheet over at its current angle")
assert.ok(
  src.includes("transition:transform .4s cubic-bezier(.22,1,.36,1),opacity .4s cubic-bezier(.22,1,.36,1)"),
  "link hover timing as measured",
)
assert.ok(src.includes("transform:translateX(.36em)") && src.includes("opacity:.66"), "link hover travel and fade as measured")

// --- content rules --------------------------------------------------------
assert.ok(src.includes('brand = "Kedhareswer"'), "brand is Kedhareswer")
assert.ok(src.includes("kedhareswer.12110626@gmail.com"), "contact email")
assert.ok(src.includes('"Project 01"'), "work entries are placeholders")
for (const banned of [/kintsugi/i, /framer/i, /pivot navigation/i, /uiuxandrii/i, /threads\.com/i, /get started/i]) {
  assert.doesNotMatch(src + demo, banned, "trace of the reference: " + banned)
}

// --- the swing, executed --------------------------------------------------
const start = src.indexOf("// #region swing")
const end = src.indexOf("// #endregion")
assert.ok(start > -1 && end > start, "swing region markers missing")
const js = src.slice(start, end).replace(/:\s*number(?=[,)])/g, "")
const { SWING, stepSpring, closeTravel, settled, sheetMetrics } = await import(
  "data:text/javascript," + encodeURIComponent(js)
)

// Degrees away from rest in the reference clip, frames 11-31 at 30 fps, from
// fitting the sheet outline about the pivot. The spring starts 0.2952 s in.
const OPEN = [34.47, 24.62, 16.25, 9.98, 5.48, 2.39, 0.53, -0.55, -1.08, -1.26, -1.16, -0.98, -0.83, -0.56, -0.36, -0.25, -0.12, -0.1, 0, 0.03, 0]
{
  let d = SWING.travel
  let v = 0
  let t = 0
  let sq = 0
  let low = 99
  OPEN.forEach((want, k) => {
    const at = (11 + k) / 30 - 0.2952
    ;[d, v] = stepSpring(d, v, at - t)
    t = at
    sq += (d - want) ** 2
    low = Math.min(low, d)
  })
  const rms = Math.sqrt(sq / OPEN.length)
  assert.ok(rms < 0.3, "open must track the measured curve; RMS " + rms.toFixed(3) + " deg")
  assert.ok(low < -0.8 && low > -1.5, "overshoot about a degree past rest: " + low.toFixed(2))
  assert.ok(Math.abs(d) < 0.1, "settled by frame 31: " + d.toFixed(3))
}

// The step must not depend on frame rate: one 100 ms step equals six 16.7 ms steps.
{
  const one = stepSpring(SWING.travel, 0, 0.1)
  let six = [SWING.travel, 0]
  for (let i = 0; i < 6; i++) six = stepSpring(six[0], six[1], 0.1 / 6)
  assert.ok(Math.abs(one[0] - six[0]) < 0.05, "spring is frame-rate independent")
}

assert.equal(settled(0, 0), true)
assert.equal(settled(0.4, 0), false)

// Close, measured: 2.1 / 10.2 / 21.8 / 35.4 deg at 17.6 / 50.9 / 84.3 / 117.6 ms.
for (const [ms, want] of [[17.6, 2.1], [50.9, 10.2], [84.3, 21.8], [117.6, 35.4]]) {
  const got = closeTravel(0, ms)
  assert.ok(Math.abs(got - want) < 1.2, "close travel at " + ms + " ms: " + got.toFixed(1) + " vs " + want)
}
assert.equal(closeTravel(0, 2000), SWING.travel, "close is capped at the full travel")
assert.ok(closeTravel(0, 140) < SWING.travel && closeTravel(0, 150) === SWING.travel, "gone in about 140-150 ms")

// Swap, measured from the click: 3.8 / 13.4 / 25.0 on the way up at 26 / 60 / 93 ms,
// then 19.0 / 12.0 / 7.1 / 3.5 / 1.3 on the spring at 126 / 160 / 193 / 226 / 260 ms.
{
  let gd = SWING.travel, gv = 0, d = 0, vel = 0, mode = "kick", top = -99, topAt = 0
  const seen = {}
  for (let ms = 1; ms <= 300; ms++) {
    if (mode === "kick") {
      ;[gd, gv] = stepSpring(gd, gv, 0.001)
      d = closeTravel(0, ms)
      if (d >= gd) { d = gd; vel = gv; mode = "open" }
    } else {
      ;[d, vel] = stepSpring(d, vel, 0.001)
    }
    if (d > top) { top = d; topAt = ms }
    seen[ms] = d
  }
  assert.ok(top > 23 && top < 30, "swap turns around near 25-27 deg: " + top.toFixed(1))
  assert.ok(topAt > 85 && topAt < 110, "about 95 ms after the click: " + topAt)
  for (const [ms, want] of [[26, 3.8], [60, 13.4], [126, 19.0], [160, 12.0], [193, 7.1], [226, 3.5], [260, 1.3]]) {
    assert.ok(Math.abs(seen[ms] - want) < 1.2, "swap at " + ms + " ms: " + seen[ms].toFixed(1) + " vs " + want)
  }
}

// Sheet size by link count, from the clip: 529 px for four links, 503 px for three, on a 700 px stage.
assert.ok(Math.abs((sheetMetrics(4).height / 100) * 700 - 529) < 1)
assert.ok(Math.abs((sheetMetrics(3).height / 100) * 700 - 503) < 1)
assert.ok(sheetMetrics(3).pitch > sheetMetrics(4).pitch, "three links are set looser than four")

console.log("swing-panel-nav: ok")
