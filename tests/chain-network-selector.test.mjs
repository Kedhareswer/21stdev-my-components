// Install-safety and logic checks for components/chain-network-selector.
// Run: node tests/chain-network-selector.test.mjs
import assert from "node:assert/strict"
import { checkPiece, lift } from "./_menu-safety.mjs"

const { src, flat } = checkPiece("chain-network-selector", "cns")

assert.ok(src.includes('role="listbox"') && src.includes('aria-multiselectable="true"'), "a multi-select listbox")
assert.ok(src.includes('role="option"') && src.includes("aria-selected={on}"), "options say whether they are chosen")
assert.ok(src.includes("aria-activedescendant="), "the active option is announced")
assert.ok(src.includes('aria-haspopup="listbox"') && src.includes("aria-expanded={open}"), "the trigger says what it opens")
for (const key of ['"Escape"', '" "', '"Enter"', '"Tab"']) assert.ok(src.includes(key), "handles " + key)
assert.ok(src.includes('document.removeEventListener("pointerdown", away)'), "outside clicks close it, and the listener is removed")
assert.ok(src.includes("style={{ height: listHeight(networks.length) }}"), "the list height comes from the data")
assert.match(flat, /\.cns-mark>img\{[^}]*max-width:none/, "logos override Preflight's max-width")

const L = await lift(src)
const all = ["a", "b", "c"]
assert.deepEqual(L.toggleId(["a"], L.ALL, all), all, "All selects everything")
assert.deepEqual(L.toggleId(all, L.ALL, all), [], "and clears when everything is on")
assert.deepEqual(L.toggleId(["c"], "a", all), ["a", "c"], "keeps list order")
assert.deepEqual(L.toggleId(["a", "c"], "a", all), ["c"])
const nets = [{ id: "a", name: "Ethereum" }, { id: "b", name: "Base" }, { id: "c", name: "Solana" }]
assert.equal(L.summary([], nets), "Select networks")
assert.equal(L.summary(all, nets), "All networks")
assert.equal(L.summary(["b"], nets), "Base")
assert.equal(L.summary(["a", "c"], nets), "2 networks")
assert.equal(L.listHeight(6), 52 + 9 + 6 * 52 + 12)
assert.equal(L.move(6, "ArrowDown", 7), 0)
assert.equal(L.move(0, "ArrowUp", 7), 6)
assert.equal(L.move(3, "End", 7), 6)

console.log("chain-network-selector: ok")
