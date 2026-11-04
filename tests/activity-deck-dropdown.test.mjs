// Install-safety and logic checks for components/activity-deck-dropdown.
// Run: node tests/activity-deck-dropdown.test.mjs
import assert from "node:assert/strict"
import { checkPiece, lift } from "./_menu-safety.mjs"

const { src, flat } = checkPiece("activity-deck-dropdown", "adk")

assert.ok(src.includes("aria-expanded={open}") && src.includes('aria-controls={id + "-deck"}'), "the header is a disclosure button")
assert.ok(src.includes('toggleAttribute("inert", !open)'), "tucked cards leave the tab order")
assert.ok(src.includes('e.key === "Escape"'), "Escape folds the deck and refocuses the header")
assert.ok(src.includes("style={{ height: deckHeight(list.length, open) }}"), "the deck height comes from the data, not a measurement")
assert.match(flat, /\.adk-card\{[^}]*transform:translateY\(var\(--adk-y\)\) scale\(var\(--adk-s\)\)/, "cards move by transform only")
assert.match(flat, /\.adk-pic>img\{[^}]*max-width:none/, "pictures override Preflight's max-width")

const L = await lift(src)
assert.deepEqual(L.slot(0, false), { y: 0, scale: 1, opacity: 1 })
assert.deepEqual(L.slot(1, false), { y: 11, scale: 0.945, opacity: 0.78 })
assert.equal(L.slot(5, false).opacity, 0, "cards past the third hide under the deck")
assert.equal(L.slot(5, false).y, L.slot(2, false).y, "and sit at the last peek")
assert.deepEqual(L.slot(3, true), { y: 3 * 86, scale: 1, opacity: 1 })
assert.equal(L.deckHeight(6, true), 6 * 76 + 5 * 10)
assert.equal(L.deckHeight(6, false), 76 + 2 * 11)
assert.equal(L.deckHeight(1, false), 76)
assert.equal(L.deckHeight(0, true), 0)
assert.equal(L.unreadCount([{ unread: true }, {}, { unread: true }]), 2)

console.log("activity-deck-dropdown: ok")
