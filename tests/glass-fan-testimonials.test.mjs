// Checks for components/glass-fan-testimonials.
// Run: node tests/glass-fan-testimonials.test.mjs
//
// The fan and shuffle maths live in the .tsx so the published component stays
// one file; the marked region is lifted out and run. The rest are the
// install-safety rules: a stage with a definite height, CSS that cannot leak
// into the host page, Preflight guards on the avatars, reduced motion.
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

const src = readFileSync(
  new URL("../components/glass-fan-testimonials/glass-fan-testimonials.tsx", import.meta.url),
  "utf8",
)

// #region logic
const start = src.indexOf("// #region logic")
const end = src.indexOf("// #endregion logic")
assert.ok(start > -1 && end > start, "logic region markers missing")
const js = src
  .slice(start, end)
  .replace(/export type Pose = [^\n]+\n/, "")
  .replace(/\): \{ size: number; step: number \} \{/g, ") {")
  .replace(/\): (Pose|number|string|boolean) \{/g, ") {")
  .replace(", fits: (n: number) => boolean", ", fits")
  .replace(/(\w+): (number|string)(?=[,)])/g, "$1")
  .replace("const pose: Pose =", "const pose =")
const m = await import("data:text/javascript," + encodeURIComponent(js))

assert.equal(m.wrap(-1, 6), 5)
assert.equal(m.wrap(6, 6), 0)
assert.equal(m.wrap(3, 0), 0, "empty list must not divide by zero")

// Depth 0 is the front pane; the one before it in the list waits at the back.
assert.equal(m.depthOf(2, 2, 6), 0)
assert.equal(m.depthOf(3, 2, 6), 1)
assert.equal(m.depthOf(1, 2, 6), 5)

// Jumping to a person goes the short way round.
assert.equal(m.shortestStep(0, 2, 6), 2)
assert.equal(m.shortestStep(0, 5, 6), -1)
assert.equal(m.shortestStep(4, 1, 6), 3, "a tie goes forward")
assert.equal(m.shortestStep(3, 3, 6), 0)

// The reference's spread: 340px panes overlapping by 100px when there is room...
const wide = m.fanGeometry(1440, 340, 3)
assert.equal(wide.size, 340)
assert.ok(Math.abs(wide.step - 240) < 0.1)
// ...closing up into a deck on a phone, with the pane still inside the screen.
const phone = m.fanGeometry(375, 340, 3)
assert.ok(phone.size <= 375 - 56 && phone.size >= 220)
assert.ok(phone.step < 40)
assert.equal(m.fanGeometry(320, 340, 3).size, 264)

// Lean: flat at the front, -tilt at the back, the reference's -6deg in between.
assert.equal(m.leanFor(0, 3, 10), 0)
assert.equal(m.leanFor(2, 3, 10), -10)
assert.ok(Math.abs(m.leanFor(1, 3, 10) + 5.74) < 0.01)
assert.equal(m.leanFor(1, 1, 10), 0)

// The front pane sits on the right and on top; depth climbs to the left.
const f = m.poseFor(0, 3, 240, 10, -1)
const b = m.poseFor(2, 3, 240, 10, -1)
assert.equal(f.x, 240)
assert.equal(b.x, -240)
assert.ok(f.z > b.z)
// Panes past the fan wait, hidden, behind its back pane.
const hid = m.poseFor(4, 3, 240, 10, -1)
assert.equal(hid.o, 0)
assert.ok(hid.x < b.x && hid.z < b.z)
// Hover parts the fan around a pane and lifts it.
const h = m.poseFor(1, 3, 240, 10, 1)
assert.ok(h.y < 0 && Math.abs(h.r) < Math.abs(m.leanFor(1, 3, 10)))
assert.ok(m.poseFor(0, 3, 240, 10, 1).x > f.x)
assert.ok(m.poseFor(2, 3, 240, 10, 1).x < b.x)
assert.deepEqual(m.poseFor(0, 3, 240, 10, 5), f, "hovering a hidden pane moves nothing")

// The shuffle: forward, the panes that were in front go round the back; backward, the back ones come round.
assert.equal(m.wrapsOn(0, 5, 1), true)
assert.equal(m.wrapsOn(2, 1, 1), false)
assert.equal(m.wrapsOn(5, 0, -1), true)
assert.equal(m.wrapsOn(1, 2, -1), false)
assert.equal(m.wrapsOn(1, 1, 0), false)
assert.equal(m.dealOrder(0, 2, 6), 0)
assert.equal(m.dealOrder(1, 2, 6), 1)
assert.equal(m.dealOrder(5, -2, 6), 0)
assert.equal(m.dealOrder(4, -2, 6), 1)

// Type fitting in half-pixel steps.
assert.equal(m.fitSize(11.5, 17, (n) => n <= 14.2), 14)
assert.equal(m.fitSize(11.5, 17, () => true), 17)
assert.equal(m.fitSize(11.5, 17, () => false), 11.5)

assert.equal(m.initials("Maya Lindqvist"), "ML")
assert.equal(m.initials("  cher "), "C")
assert.equal(m.formatRating(5), "5.0")
assert.equal(m.formatRating(4.86), "4.9")
assert.equal(m.formatRating(7), "5.0")
assert.equal(m.pad2(4), "04")
assert.equal(
  m.avatarSrc("https://images.unsplash.com/photo-1?auto=format&fit=crop&w=160&h=160&q=80", 72),
  "https://images.unsplash.com/photo-1?auto=format&fit=crop&h=160&q=80&w=72",
)
assert.equal(m.avatarSrc("/team/ana.jpg", 72), "/team/ana.jpg")
// #endregion

// A stage that inherits its height renders here and collapses once installed.
assert.doesNotMatch(src, /\bh-full\b/, "no h-full anywhere")
assert.ok(/Math\.round\(size \* 1\.12 \+ 112\) \+ "px"/.test(src), "stage height must default to a definite length")
assert.ok(src.includes(".gft-stage { position: relative; height: var(--gft-h);"), "stage takes its height from the definite variable")

// 21st ships this file alone; the CSS must not reach the host page.
const css = src.slice(src.indexOf("const css = `") + 13, src.indexOf("`", src.indexOf("const css = `") + 13))
assert.ok(css.length > 2000, "css block not found")
assert.doesNotMatch(css, /@import/, "no @import")
assert.doesNotMatch(css, /\$\{/, "no template expressions in the CSS")
for (const line of css.split("\n")) {
  const sel = line.split("{")[0].trim()
  if (!sel || sel.startsWith("@") || sel.startsWith("}") || /^(from|to|\d+%)$/.test(sel)) continue
  for (const part of sel.split(",")) {
    const p = part.trim()
    assert.ok(p.startsWith(".gft") || p.startsWith(".dark .gft"), "unscoped selector: " + p)
  }
}

// Tailwind Preflight's img { max-width: 100% } must not shrink the avatars.
assert.ok(src.includes('maxWidth: "none"') && css.includes(".gft img { max-width: none; }"), "avatars need a max-width escape")
assert.ok(/width=\{px\}/.test(src) && /height=\{px\}/.test(src), "avatars need explicit dimensions")

// Default avatars come from Unsplash only.
for (const url of src.match(/https:\/\/[^"'\s)]+/g) || []) {
  assert.ok(/^https:\/\/images\.unsplash\.com\//.test(url), "unexpected host: " + url)
}

// The shuffle runs on the Web Animations API, and transitions are switched off on the
// travelling pane so a CSS transition (which outranks animations) cannot hijack it.
assert.ok(src.includes('el.style.transition = "none"') && src.includes("el.animate("), "wrapping panes animate their own path")
assert.ok(src.includes('fill: "backwards"'), "a dealt pane must hold its first frame through its delay")

// One type size for every quote, fitted so none is clipped.
assert.ok(src.includes("best = Math.min(best, fitSize(lo, best, fits))"), "quotes must share one fitted size")

// Motion is not optional, and autoplay can be stopped.
assert.ok(css.includes("@media (prefers-reduced-motion: reduce)"), "must honour prefers-reduced-motion")
assert.ok(src.includes('"Pause testimonials"'), "autoplay needs a pause control")
assert.ok(src.includes('document.visibilityState === "hidden"'), "autoplay must stop in a hidden tab")
assert.ok(src.includes("new IntersectionObserver("), "autoplay must stop off screen")

// 21st's parser: no TypeScript generics before the first JSX close tag.
const head = src.slice(0, src.indexOf("</"))
assert.doesNotMatch(head, /use(State|Ref|Memo|Callback)<|Partial<|Record<|Array<|Map<|React\.[A-Za-z]+<|\[K in /, "generic before first JSX")

console.log("glass-fan-testimonials: ok")
