// Runnable check for components/flipboard-checkout-counter: the cart maths, the split-flap rows, the checkout
// validation, the motion order and the install-safety rules.
// Run: node tests/flipboard-checkout-counter.test.mjs
import assert from "node:assert/strict"
import { checkSkate } from "./_skate-cart-shared.mjs"
import { liftRegion } from "./_component-safety.mjs"

const { src, css } = checkSkate("flipboard-checkout-counter", "fc")
const { cartTotal, rowText, pair, setQty, validate, LEFT, RIGHT } = await liftRegion(src, "logic")

const products = [
  { id: "a", price: 68 },
  { id: "b", price: 72 },
]
assert.equal(cartTotal([{ id: "a", qty: 1 }, { id: "b", qty: 1 }], products), 140)
assert.equal(cartTotal([{ id: "a", qty: 3 }], products), 204)
assert.equal(cartTotal([{ id: "zzz", qty: 3 }], products), 0, "unknown ids cost nothing")

// rows are fixed width so the flaps never reflow
const r = rowText("Garnet", 2, 72, "$")
assert.equal(r.left.length, LEFT)
assert.equal(r.right.length, RIGHT)
assert.equal(r.left.trimEnd(), "GARNET   X2")
assert.equal(pair("Order", "SL-2611").right.trim(), "SL-2611", "order ids fit the right block")
assert.equal(r.right.trim(), "$144")
assert.equal(rowText("Onyx", 1, 68, "$").left.trimEnd(), "ONYX", "no quantity shown for one")
assert.equal(rowText("Extraordinarily", 1, 5, "$").left.length, LEFT, "long names are cut")
const p = pair("Order", "SL-2611")
assert.equal(p.left.length + p.right.length, LEFT + RIGHT)

// quantities clamp to 0..9 and zero removes the line
assert.deepEqual(setQty([{ id: "a", qty: 1 }], "a", 2), [{ id: "a", qty: 2 }])
assert.deepEqual(setQty([{ id: "a", qty: 1 }], "a", 0), [])
assert.deepEqual(setQty([{ id: "a", qty: 9 }], "a", 12), [{ id: "a", qty: 9 }])
assert.deepEqual(setQty([], "b", 1), [{ id: "b", qty: 1 }])

// checkout validation
const good = { email: "rider@example.com", address: "12 Ledge Lane", card: "4242 4242 4242 4242", expiry: "08 / 29", cvc: "123" }
assert.deepEqual(validate(good), [])
assert.deepEqual(validate({ ...good, email: "nope" }), ["email"])
assert.deepEqual(validate({ ...good, card: "4242", expiry: "13/29", cvc: "1" }), ["card", "expiry", "cvc"])

// motion order
assert.ok(css.includes(".fc-drawer[data-open]{opacity:1;transform:perspective(1200px) translateY(0) rotateX(0deg)"), "open drawer restates its full transform")
assert.match(css, /@keyframes fc-kick\{0%,14%\{[^}]*\}50%\{transform:rotateX\(190deg\)/, "Pay kickflips")
assert.ok(src.includes("later(() => setPaid(true), 400)"), "the Pay label swaps while the label face is hidden")
assert.ok(src.includes("later(() => setDrawer(false), 1000)"), "the drawer closes after the deck lands")
assert.match(src, /later\(\(\) => \{\n\s*setDone\(order\)/, "the board flaps to thank-you once the drawer is home")
// only the counter top is 3D; text layers stay flat
assert.match(css, /\.fc-top\{[^}]*transform-style:preserve-3d/, "counter top is a 3D plane")
assert.doesNotMatch(css, /\.fc-board\{[^}]*rotateX/, "the split-flap board is not tilted")

console.log("flipboard-checkout-counter: ok")
