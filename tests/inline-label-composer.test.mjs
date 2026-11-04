// Install-safety and logic checks for components/inline-label-composer.
// Run: node tests/inline-label-composer.test.mjs
import assert from "node:assert/strict"
import { checkPiece, lift } from "./_menu-safety.mjs"

const { src, flat } = checkPiece("inline-label-composer", "ilc")

assert.ok(src.includes('role="combobox"') && src.includes('aria-multiselectable="true"') && src.includes('role="option"'), "multi-select combobox semantics")
assert.ok(src.includes("aria-activedescendant="), "the active option is announced")
assert.ok(src.includes('aria-haspopup="listbox"') && src.includes("aria-expanded={open}"), "the Add button says what it opens")
assert.ok(src.includes('role="radiogroup"') && src.includes('role="radio"'), "the new label's colour is a radio group")
for (const key of ['"Escape"', '"Enter"', '"Backspace"', '"Tab"', '"ArrowLeft"']) assert.ok(src.includes(key), "handles " + key)
assert.ok(src.includes('document.removeEventListener("pointerdown", away)'), "outside clicks close it, and the listener is removed")
assert.match(flat, /\.ilc-chip\{[^}]*color-mix\(in oklab,var\(--ilc-c\)/, "chips tint from their colour in both themes")

const L = await lift(src)
const list = [{ name: "Bug" }, { name: "Safari" }, { name: "UX polish" }]
assert.equal(L.filterLabels(list, "").length, 3)
assert.deepEqual(L.filterLabels(list, " ux").map((l) => l.name), ["UX polish"])
assert.equal(L.canCreate("", list), false, "nothing to create")
assert.equal(L.canCreate("  bug ", list), false, "an exact match (any case) is picked, not duplicated")
assert.equal(L.canCreate("Bugs", list), true)
assert.equal(L.cycle(8, 1, 9), 0)
assert.equal(L.cycle(0, -1, 9), 8)
assert.equal(L.cycle(3, 1, 0), 0)
assert.equal(L.slug("Q3 launch!", []), "q3-launch")
assert.equal(L.slug("Bug", ["bug"]), "bug-2", "ids stay unique")
assert.equal(L.slug("Bug", ["bug", "bug-2"]), "bug-3")
assert.equal(L.slug("!!!", []), "label")
assert.equal(L.PALETTE.length, 9)

console.log("inline-label-composer: ok")
