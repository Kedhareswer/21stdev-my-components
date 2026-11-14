// Install-safety and motion check for components/swing-panel-nav.
// Run: node tests/swing-panel-nav.test.mjs
//
// Most of this is source assertions: the rules that only fail once the file is
// installed somewhere else. The swing itself is lifted out of the
// "// #region swing" block and run, so the measured timing can't drift.
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

const src = readFileSync(
  new URL("../components/swing-panel-nav/swing-panel-nav.tsx", import.meta.url),
  "utf8",
)
const demo = readFileSync(new URL("../components/swing-panel-nav/demo.tsx", import.meta.url), "utf8")

// --- install safety -------------------------------------------------------
assert.ok(/height = "100svh"/.test(src), "root height must default to a definite length")
assert.ok(src.includes('style={{ height, width: "100%"'), "root needs width:100% — 21st centres demos in a flex box")
assert.ok(src.includes(".spn-root{position:relative;width:100%"), "root CSS must also carry width:100%")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full anywhere — percentage heights collapse once installed")
assert.doesNotMatch(src, /@import/, "no @import — the host owns its stylesheet")
assert.doesNotMatch(src, /`/, "no backticks — 21st's CSS-in-string handling chokes on them")
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

// --- motion & input -------------------------------------------------------
assert.ok(src.includes("prefers-reduced-motion: reduce"), "JS must check reduced motion")
assert.ok(src.includes("@media (prefers-reduced-motion:reduce)"), "CSS must honour reduced motion")
assert.ok(
  src.includes("@media (hover:hover) and (pointer:fine){.spn-link:hover"),
  "hover slide only on fine pointers",
)
assert.ok(src.includes('e.pointerType !== "mouse" || !finePointer()'), "leave-to-close only for a mouse")
assert.ok(src.includes("aria-expanded={active === i}") && src.includes("aria-controls={panelId}"), "triggers are disclosure buttons")
assert.ok(src.includes('e.key !== "Escape"'), "Escape closes")
assert.ok(src.includes('setAttribute("inert"'), "closed sheet must leave the tab order")
assert.ok(src.includes("transform-origin:100% 0"), "the sheet hangs from its top-right corner")

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
const { SWING, stepSpring, closeAngle, settled } = await import("data:text/javascript," + encodeURIComponent(js))

// Run the open at 30 fps from rest-up, like the reference recording.
let a = SWING.from
let v = 0
const at = []
for (let f = 1; f <= 30; f++) {
  ;[a, v] = stepSpring(a, v, 1 / 30)
  at.push(a)
}
// Fitted to the reference outline, frames after release: 3→27, 4→16, 6→2, 7→-1.6, ~10→-4.9 overshoot.
assert.ok(Math.abs(at[2] - 27) < 4, "frame 3 angle " + at[2])
assert.ok(Math.abs(at[3] - 16) < 4, "frame 4 angle " + at[3])
assert.ok(Math.abs(at[5] - 2) < 2.5, "frame 6 angle " + at[5])
const peak = Math.min(...at)
assert.ok(peak < -4.5 && peak > -5.6, "overshoot should be about a degree: " + peak)
assert.ok(Math.abs(at[29] - SWING.rest) < 0.15, "settled by 1 s: " + at[29])

// Settling is detected only once it is truly still.
assert.equal(settled(SWING.rest, 0), true)
assert.equal(settled(SWING.rest + 1, 0), false)

// Close: a cubic ease-in that barely moves at first and is gone by 150 ms.
assert.ok(Math.abs(closeAngle(SWING.rest, 0) - SWING.rest) < 1e-9)
assert.ok(closeAngle(SWING.rest, 50) - SWING.rest < 3, "close starts slowly")
assert.equal(closeAngle(SWING.rest, 150), SWING.from)
assert.equal(closeAngle(SWING.rest, 999), SWING.from)

console.log("swing-panel-nav: ok")
