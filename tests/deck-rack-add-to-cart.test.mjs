// Runnable check for components/deck-rack-add-to-cart.
// Run: node tests/deck-rack-add-to-cart.test.mjs
//
// What breaks silently here: a camera that scales a layer (pixelated decks), a card whose open state drops the
// base transform, a label that swaps while its face is still showing, or a hover that fires on touch.
import assert from "node:assert/strict"
import { checkSkate } from "./_skate-cart-shared.mjs"

const { src, css } = checkSkate("deck-rack-add-to-cart", "dr")

// The camera only ever scales the world DOWN: it is laid out at the focused size (K) and the wall view is
// scale(1/K), the focused view scale(1). Nothing is enlarged past its layout size, so decks never pixelate.
assert.ok(css.includes("--dr-s:calc(1/var(--dr-k))"), "wall view is the world scaled down by 1/K")
assert.ok(css.includes(".dr-scene[data-on]{--dr-s:1;"), "focused view is the world at its layout size")
assert.match(css, /\.dr-scene\{[^}]*transition:transform 1\.15s/, "the glide is a transform transition")
assert.doesNotMatch(css, /scale\((1\.[0-9]*[1-9]|[2-9])/, "nothing is enlarged with transform: scale")
assert.ok(css.includes("width:calc(var(--w)*var(--u)*var(--dr-k))"), "sizes are laid out at the focused size")
assert.ok(css.includes("@property --dr-p{syntax:'<number>'"), "the hover pop is a registered property")

// The card's open state restates the base translate it is centred with.
assert.match(css, /\.dr-card\{[^}]*transform:translate\(0,calc\(-50% \+ 18px\)\)/, "card rests below its open spot")
assert.match(css, /\.dr-card\[data-open\]\{[^}]*transform:translate\(0,-50%\)/, "open card keeps translateY(-50%)")
// Exit before enter: the card leaves in .28s, the camera waits, the card enters once the camera has nearly landed.
assert.match(css, /\.dr-card\[data-open\]\{[^}]*\.8s/, "card enters after the camera has travelled")
assert.ok(src.includes("setTimeout(go, wait(300))"), "switching decks closes the card before panning")

// Kickflip: the label swaps at 400ms of an 800ms flip, while the bottom face is showing.
assert.ok(src.includes("setLabel(!inCart), 400)"), "label swaps mid-flip")
assert.match(css, /@keyframes dr-kick\{0%,14%\{[^}]*\}50%\{transform:rotateX\(190deg\)/, "the deck is upside down at the midpoint")
assert.match(css, /\.dr-face\{[^}]*backface-visibility:hidden/, "faces hide their backs")
// Hover only swings decks on devices that hover.
assert.ok(css.includes("@media (hover:hover){.dr-board:hover{--dr-p:.85}}"), "hover pop is gated on hover-capable devices")
assert.ok(src.includes('e.key === "Escape") close()'), "Escape closes")

// Decks are spread along the wall left to right without overlapping (a deck is about 5.8 units wide).
const xs = [...src.matchAll(/^\s{4}x: (-?[\d.]+),$/gm)].map((m) => +m[1])
assert.equal(xs.length, 5, "five sample decks")
for (let i = 1; i < xs.length; i++) assert.ok(xs[i] - xs[i - 1] > 8, "decks keep clear of each other: " + xs)

console.log("deck-rack-add-to-cart: ok")
