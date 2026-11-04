// Install-safety and logic checks for components/drifting-interest-picker.
// Run: node tests/drifting-interest-picker.test.mjs
import assert from "node:assert/strict"
import { checkPiece, lift } from "./_menu-safety.mjs"

const { src, flat } = checkPiece("drifting-interest-picker", "dip")

assert.ok(src.includes("aria-pressed={sel.includes(it.id)}"), "chips are toggle buttons")
assert.ok(src.includes('role="group"'), "the chips sit in a labelled group")
assert.ok(src.includes('<div className="dip-set" aria-hidden="true">') && src.includes("tabIndex={copy ? -1 : undefined}"), "the looping copy is hidden and out of the tab order")
assert.ok(src.includes('aria-live="polite"'), "the count is announced")
assert.match(flat, /\.dip-row\{[^}]*animation:dip-drift/, "rows drift with a CSS animation, no script per frame")
assert.match(flat, /\.dip-row:hover,\.dip-row:focus-within\{animation-play-state:paused\}/, "hover and focus pause a row")
assert.match(flat, /@media \(prefers-reduced-motion:reduce\)\{[^@]*\.dip-set\[aria-hidden=true\]\{display:none\}/, "reduced motion drops the copy and wraps the chips")
assert.doesNotMatch(src, /requestAnimationFrame|setInterval/, "no JS animation loop")

const L = await lift(src)
assert.deepEqual(L.chunk([1, 2, 3, 4, 5], 2), [[1, 3, 5], [2, 4]], "dealt round-robin")
assert.deepEqual(L.chunk([1], 4), [[1]], "never more rows than items")
assert.deepEqual(L.chunk([], 3), [[]])
assert.equal(L.hueFor(0), "hsl(12 85% 68%)")
assert.deepEqual(L.digits(7), [0, 7])
assert.deepEqual(L.digits(42), [4, 2])
assert.deepEqual(L.digits(123), [1, 2, 3], "grows past two digits")
assert.equal(L.needMore(1, 3), "Pick 2 more")
assert.equal(L.needMore(3, 3), "")
assert.deepEqual(L.flip(["a"], "b"), ["a", "b"])
assert.deepEqual(L.flip(["a", "b"], "a"), ["b"])

console.log("drifting-interest-picker: ok")
