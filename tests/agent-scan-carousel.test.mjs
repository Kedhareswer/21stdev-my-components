// Install-safety and motion check for components/agent-scan-carousel.
// Run: node tests/agent-scan-carousel.test.mjs
//
// The first half is source assertions: the rules that only fail once the file
// is installed somewhere else. The second half lifts the "// #region model"
// block out of the component and runs it against values measured on the
// reference (card 800 x 500, pitch 880, drift 48 px/s, counter per card).
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

const src = readFileSync(
  new URL("../components/agent-scan-carousel/agent-scan-carousel.tsx", import.meta.url),
  "utf8",
)
const demo = readFileSync(new URL("../components/agent-scan-carousel/demo.tsx", import.meta.url), "utf8")
const tsconfig = readFileSync(new URL("../tsconfig.json", import.meta.url), "utf8")

// --- install safety -------------------------------------------------------
assert.match(src, /height = "max\(100svh, 900px\)"/, "root height must default to a definite length")
assert.match(src, /height,\s*width: "100%"/, "root carries the height prop and width:100%")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full anywhere: percentage heights collapse once installed")
assert.doesNotMatch(src, /@import/, "no @import: the host owns its stylesheet")
assert.doesNotMatch(src, /`/, "no backticks in the file")
assert.doesNotMatch(src, /\$\{/, "no ${ in the file")
assert.doesNotMatch(src, /useRef</, "no useRef generics")
assert.doesNotMatch(src, /(^|[{}"])\s*(\*|body|html|:root)\s*\{/m, "no bare global resets")
assert.ok(Buffer.byteLength(src) < 200 * 1024, "21st rejects component files over 200 kB")
assert.match(demo, /from "@\/components\/ui\/agent-scan-carousel"/, "demo imports the installed path")
assert.ok(tsconfig.includes('"@/components/ui/agent-scan-carousel"'), "tsconfig needs its paths line")

const tokens = new Set((src.match(/var\(--color-[a-z-]+/g) || []).map((t) => t.slice(4)))
for (const t of tokens) {
  assert.ok(
    ["--color-background", "--color-foreground", "--color-muted-foreground", "--color-border", "--color-primary"].includes(t),
    "unexpected token " + t,
  )
}

// Preflight: images are absolutely positioned and must not collapse.
assert.ok(src.includes('maxWidth: "none"'), "absolute images need maxWidth:none")
assert.ok(src.includes(".asc-face img{max-width:none"), "CSS guard against img max-width:100%")
assert.ok(src.includes("width={props.w}") && src.includes("height={props.h}"), "images carry explicit width/height")

// Pictures come from the catalog site, never a third party.
assert.ok(src.includes('"https://kedhar-components.pages.dev/agent-scan-carousel/"'), "image base is the catalog")
const hosts = new Set((src.match(/https:\/\/[a-z0-9.-]+/gi) || []).map((u) => u.toLowerCase()))
for (const h of hosts) {
  assert.ok(
    ["https://kedhar-components.pages.dev", "https://fonts.googleapis.com"].includes(h),
    "unexpected host " + h,
  )
}
for (const n of ["sky", "dusk", "grass", "lichen", "bloom"]) {
  assert.ok(src.includes('"' + n + '"'), "uses picture " + n)
  readFileSync(new URL("../dev/public/agent-scan-carousel/" + n + ".webp", import.meta.url))
}

// Copy: about Kedhareswer, no reference identifiers.
for (const banned of [/scrunch/i, /tyrell/i, /nexus/i, /\bAXP\b/, /framer/i]) {
  assert.doesNotMatch(src, banned, "no identifiers from the reference: " + banned)
}
assert.ok(src.includes("kedhareswer.12110626@gmail.com"), "contact is Kedhareswer's email")
assert.ok(/Client 1/.test(src) && /Client 2/.test(src) && /Client 3/.test(src), "placeholder clients")

// Reduced motion, visibility, input.
assert.ok(src.includes("prefers-reduced-motion: reduce"), "JS must check reduced motion")
assert.ok(src.includes("@media (prefers-reduced-motion:reduce)"), "CSS must honour reduced motion")
assert.ok(src.includes("const base = reduce ? 0 : -Math.abs(speed)"), "no drift under reduced motion")
assert.ok(src.includes("if (!reduce) {") && src.includes("particles.push"), "no shed pixels under reduced motion")
assert.ok(src.includes("new IntersectionObserver") && src.includes("document.hidden"), "loop pauses offscreen and hidden")
assert.ok(src.includes("setPointerCapture") && src.includes("touch-action:pan-y"), "drag keeps vertical page scroll")
assert.ok(src.includes('e.key !== "ArrowLeft" && e.key !== "ArrowRight"'), "arrow keys move the stream")
assert.ok(src.includes('"inset(0 0 0 " + clip + "px)"'), "page side is clipped at the scanner")
assert.ok(src.includes('"inset(0 " + (CARD_W - local).toFixed(1) + "px 0 0)"'), "code side is the complement")
assert.ok(src.includes("const STAGE_H = 580") && src.includes("const PITCH = CARD_W + GAP"), "measured stage geometry")
assert.ok(src.includes("speed = 48"), "measured drift: 48 px/s")
assert.ok(src.includes('accent = "#d8fc3b"'), "measured beam colour")

// --- the model, executed --------------------------------------------------
const start = src.indexOf("// #region model")
const end = src.indexOf("// #endregion model")
assert.ok(start > 0 && end > start, "model region present")
const prelude = "const CARD_W = 800\nconst STAGE_H = 580\n"
const body = src
  .slice(start, end)
  .replace(/export function/g, "function")
  .replace(/\): \{ saved: number; percent: number \} \{/g, ") {")
  .replace(/: number/g, "")
  .replace(/: string/g, "")
const m = new Function(
  prelude + body + "\nreturn { wrap, slotX, scanProgress, tokenReadout, formatTokens, relaxVelocity, fitScale }",
)()

assert.equal(m.wrap(-10, 100), 90)
assert.equal(m.wrap(250, 100), 50)

// Slots tile the loop without gaps or overlaps, whatever the offset.
for (const offset of [0, 37.5, -1234, 99999]) {
  const pitch = 880
  const period = 12 * pitch
  const xs = Array.from({ length: 12 }, (_, i) => m.slotX(i, offset, pitch, period)).sort((a, b) => a - b)
  for (let i = 1; i < xs.length; i++) assert.ok(Math.abs(xs[i] - xs[i - 1] - pitch) < 1e-6, "even pitch")
  assert.ok(xs[0] >= -pitch - 1e-6 && xs[0] < 0 + 1e-6, "first slot starts just off the left edge")
}

assert.equal(m.scanProgress(760, 760, 800), 0)
assert.equal(m.scanProgress(760, 360, 800), 0.5)
assert.equal(m.scanProgress(760, 1000, 800), -1, "card still to the right")
assert.equal(m.scanProgress(760, -100, 800), -1, "card already past")

// Counter: full card reads the full saving; reference card 1 is 123,916 -> 1,355 (98.9%).
assert.deepEqual(m.tokenReadout(1, 123916, 1355), { saved: 122561, percent: 99 })
assert.deepEqual(m.tokenReadout(0.5, 123916, 1355), { saved: 61281, percent: 49 })
assert.deepEqual(m.tokenReadout(-1, 100, 10), { saved: 0, percent: 0 })
assert.equal(m.formatTokens(72187), "-72,187")

// A fling decays back to the drift.
let v = -3000
for (let i = 0; i < 210; i++) v = m.relaxVelocity(v, -48, 1 / 60, 0.55)
assert.ok(Math.abs(v + 48) < 10, "settles to the drift within 3.5 s")

assert.equal(m.fitScale(1521, 700), 1, "full size on a desktop")
assert.ok(Math.abs(m.fitScale(390, 700) - (390 - 32) / 800) < 1e-9, "phone fits the width with 16 px gutters")

console.log("agent-scan-carousel: ok")
