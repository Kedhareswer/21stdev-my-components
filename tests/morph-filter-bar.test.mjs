// Install-safety and logic checks for components/morph-filter-bar.
// Run: node tests/morph-filter-bar.test.mjs
import assert from "node:assert/strict"
import { checkPiece, lift } from "./_menu-safety.mjs"

const { src, flat } = checkPiece("morph-filter-bar", "mfb")

assert.ok(src.includes('role="combobox"') && src.includes('role="listbox"') && src.includes('role="option"'), "combobox semantics")
assert.ok(src.includes("aria-activedescendant="), "the active option is announced without moving focus")
assert.ok(src.includes('aria-haspopup="listbox"') && src.includes("aria-expanded={open}"), "the + button says what it opens")
for (const key of ['"Escape"', '"Backspace"', '"Enter"', '"Tab"']) assert.ok(src.includes(key), "handles " + key)
assert.ok(src.includes('document.removeEventListener("pointerdown", away)'), "outside clicks close it, and the listener is removed")
assert.ok(src.includes("clearTimeout(timer.current)"), "the chip removal timer is cleared")
assert.ok(src.includes("style={open ? { height: h } : undefined}"), "the panel height comes from the data")
assert.match(flat, /\.mfb-morph\{[^}]*transition:width [^}]*height/, "the + button grows into the panel")
assert.match(flat, /\.mfb-av\{[^}]*max-width:none/, "avatars override Preflight's max-width")

const L = await lift(src)
const list = [{ label: "Status" }, { label: "Assignee" }, { label: "Due date" }]
assert.equal(L.matches(list, "").length, 3)
assert.deepEqual(L.matches(list, " DUE ").map((x) => x.label), ["Due date"], "trimmed, case-insensitive")
assert.equal(L.matches(list, "zzz").length, 0)
assert.equal(L.panelHeight(3), 46 + 10 + 3 * 36)
assert.equal(L.panelHeight(0), 46 + 10 + 36, "the empty state keeps one row")
assert.equal(L.panelHeight(20), 46 + 10 + 6 * 36, "long lists scroll inside six rows")
assert.equal(L.step(0, "ArrowUp", 4), 3)
assert.equal(L.step(3, "ArrowDown", 4), 0)
assert.equal(L.step(0, "ArrowDown", 0), -1)
assert.deepEqual(L.addFilter([{ key: "a", value: "1" }, { key: "b", value: "2" }], { key: "a", value: "3" }), [{ key: "b", value: "2" }, { key: "a", value: "3" }], "one chip per field; a new value replaces the old")

console.log("morph-filter-bar: ok")
