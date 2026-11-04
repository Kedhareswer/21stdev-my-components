// Install-safety and logic checks for components/crew-avatar-picker.
// Run: node tests/crew-avatar-picker.test.mjs
import assert from "node:assert/strict"
import { checkPiece, lift } from "./_menu-safety.mjs"

const { src, flat } = checkPiece("crew-avatar-picker", "cap")

assert.ok(src.includes("aria-pressed={sel.includes(p.id)}"), "faces are toggle buttons")
assert.ok(src.includes('role="group"'), "the row is a labelled group")
assert.ok(src.includes('aria-haspopup="listbox"') && src.includes("aria-expanded={adding}"), "Add says what it opens")
assert.ok(src.includes('role="combobox"') && src.includes('role="listbox"') && src.includes("aria-activedescendant="), "the directory is a combobox")
for (const key of ['"Escape"', '"Enter"', '"Tab"']) assert.ok(src.includes(key), "handles " + key)
assert.ok(src.includes('document.removeEventListener("pointerdown", away)'), "outside clicks close the directory, and the listener is removed")
assert.match(flat, /\.cap-face>img\{[^}]*max-width:none/, "faces override Preflight's max-width")
assert.match(flat, /\.cap-face>img\{[^}]*filter:grayscale\(1\)/, "unpicked faces are greyscale")

const L = await lift(src)
assert.deepEqual(L.flipId(["a"], "b"), ["a", "b"])
assert.deepEqual(L.flipId(["a", "b"], "a"), ["b"])
assert.equal(L.countLabel(2, 5), "2 of 5")
assert.equal(L.actionLabel("Start huddle", 0), "Pick someone")
assert.equal(L.actionLabel("Start huddle", 3), "Start huddle with 3")
const dir = [{ name: "Kai Moreno", role: "Marketing" }, { name: "Ana Souza", role: "Support" }]
assert.equal(L.search(dir, "").length, 2)
assert.deepEqual(L.search(dir, "supp").map((p) => p.name), ["Ana Souza"], "matches the role too")
assert.equal(L.wrapStep(5, "ArrowRight", 6), 0)
assert.equal(L.wrapStep(0, "ArrowLeft", 6), 5)
assert.equal(L.wrapStep(2, "End", 6), 5)
assert.equal(L.wrapStep(0, "ArrowDown", 0), -1)

console.log("crew-avatar-picker: ok")
