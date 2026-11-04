// Install-safety and logic checks for components/editorial-expand-accordion.
// Run: node tests/editorial-expand-accordion.test.mjs
import assert from "node:assert/strict"
import { checkPiece, lift } from "./_menu-safety.mjs"

const { src, flat } = checkPiece("editorial-expand-accordion", "eea")

assert.ok(src.includes("aria-expanded={isOpen}") && src.includes('aria-controls={id + "-p" + i}'), "headers are disclosure buttons")
assert.ok(src.includes('role="region"') && src.includes('aria-labelledby={id + "-h" + i}'), "panels are labelled regions")
assert.ok(src.includes('el?.toggleAttribute("inert", !isOpen)'), "closed panels leave the tab order")
assert.match(flat, /\.eea-root\{[^}]*container-type:inline-size;width:100%/, "the size container carries its own width")
assert.match(flat, /\.eea-panel\{display:grid;grid-template-rows:0fr/, "panels open through grid rows, no measuring")
assert.match(flat, /\.eea-pic\{[^}]*clip-path:inset\(/, "the photo wipes open with clip-path")
assert.match(flat, /\.eea-pic>img\{[^}]*max-width:none/, "photos override Preflight's max-width")

const L = await lift(src)
assert.equal(L.pad2(0), "01")
assert.equal(L.pad2(8), "09")
assert.equal(L.pad2(9), "10")
assert.equal(L.nextOpen(1, 1), -1, "clicking the open row closes it")
assert.equal(L.nextOpen(1, 2), 2)
assert.equal(L.rove(3, "ArrowDown", 4), 0)
assert.equal(L.rove(0, "ArrowUp", 4), 3)
assert.equal(L.rove(2, "Home", 4), 0)
assert.equal(L.rove(0, "End", 4), 3)

console.log("editorial-expand-accordion: ok")
