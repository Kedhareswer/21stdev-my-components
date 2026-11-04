// Install-safety and logic checks for components/approval-morph-tray.
// Run: node tests/approval-morph-tray.test.mjs
import assert from "node:assert/strict"
import { checkPiece, lift } from "./_menu-safety.mjs"

const { src, flat } = checkPiece("approval-morph-tray", "amt")

assert.match(src, /aria-expanded=\{open\}/, "the pill is a disclosure button")
assert.match(src, /aria-controls=\{id \+ "-panel"\}/, "it names the panel it opens")
assert.match(src, /role="region"/, "the panel is a labelled region")
assert.ok(src.includes('toggleAttribute("inert", !open)'), "collapsed rows leave the tab order")
assert.ok(src.includes('e.key === "Escape"'), "Escape closes and refocuses the pill")
assert.ok(src.includes('aria-live="polite"'), "decisions are announced")
assert.ok(src.includes("timers.current.forEach((t) => clearTimeout(t))"), "pending removals are cleared on unmount")
assert.match(flat, /\.amt-panel\{display:grid;grid-template-rows:0fr/, "height morphs through grid rows, no measuring")
assert.match(flat, /max-width:none/, "avatars override Preflight's max-width")

const L = await lift(src)
assert.deepEqual(L.stackOf(6, 4), { shown: 4, extra: 2 })
assert.deepEqual(L.stackOf(2, 4), { shown: 2, extra: 0 })
assert.deepEqual(L.stackOf(0, 4), { shown: 0, extra: 0 })
assert.equal(L.pendingLabel(0), "All caught up")
assert.equal(L.pendingLabel(1), "1 request")
assert.equal(L.pendingLabel(5), "5 requests")
assert.equal(L.nextIndex(0, -1, 3), 2, "ArrowUp wraps to the last row")
assert.equal(L.nextIndex(2, 1, 3), 0, "ArrowDown wraps to the first row")
assert.equal(L.nextIndex(0, 1, 0), -1, "empty list")

console.log("approval-morph-tray: ok")
