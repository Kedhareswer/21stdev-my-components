// Install-safety, timing and geometry checks for components/coupon-dust-checkout.
// Run: node tests/coupon-dust-checkout.test.mjs
//
// The dust is one canvas driven by a frame loop. Its paths come from the fixed card geometry in
// the `model` region (no layout reads), so that region is lifted out and run here as shipped.
import assert from "node:assert/strict"
import { checkComponent, liftRegion } from "./_component-safety.mjs"

const slug = "coupon-dust-checkout"
const { src, demo, css } = checkComponent(slug, { prefix: "cdc-", imports: ["react"] })

assert.match(demo, /from "@\/components\/ui\/coupon-dust-checkout"/, "demo imports the installed path")

// Reduced motion: no dust, no roll; the coupon is applied in one step.
assert.match(src, /if \(reduced\) \{\n\s*go\(4\)\n\s*return/, "reduced motion skips the dust")
assert.match(src, /!from \|\| from === totalStr \|\| reduced/, "reduced motion skips the digit roll")
assert.match(css, /prefers-reduced-motion:reduce\)\{[^}]*\.cdc-row/, "reduced motion flattens the swap")

// Preflight and stacking.
assert.match(css, /\.cdc-canvas\{[^}]*max-width:none/, "canvas escapes max-width")
assert.match(css, /\.cdc-canvas\{[^}]*pointer-events:none/, "canvas never eats clicks")
assert.match(src, /new ResizeObserver/, "canvas sized from the observer")
assert.match(src, /ro\.disconnect\(\)/, "observer cleaned up")
assert.match(src, /cancelAnimationFrame\(r\.raf\)/, "frame loop stops on unmount")
assert.match(src, /aria-live="polite"/, "result is announced")
assert.match(src, /aria-label=\{"Apply coupon "/, "coupons are labelled buttons")
assert.match(src, /role="radiogroup"/, "delivery speed is a radio group")

// Enter after exit: the banner waits for the coupon row to leave, and the row waits on the way back.
assert.match(css, /\.cdc-on \.cdc-banner\{[^}]*transition:opacity \.3s ease \.14s/, "banner enters after the row exits")
assert.match(css, /\.cdc-row\{[^}]*transition:opacity \.16s ease \.14s/, "row re-enters after the banner exits")
assert.match(css, /\.cdc-on \.cdc-row\{[^}]*transition-delay:0s/, "row leaves at once")

// The card's height is fixed so the stage never re-centres mid-animation; every block has a set height.
const m = await liftRegion(src, "model")
const L = m.L
assert.match(src, /\.cdc-card\{[^}]*height:" \+ L\.CARD_H \+ "px/, "card height comes from the model")
assert.match(src, /CARD_H: 438,/, "model card height")
const blocks = 22 + 22 + 14 + 64 + 14 + 22 + 10 + 20 + 14 + (1 + 62 + 63 + 1) + 18 + 91
assert.equal(blocks, L.CARD_H, "the stacked blocks add up to the card height")
assert.equal(22 + 22 + 14 + 6, L.COUPON_TOP, "coupon top follows head + slot padding")
// footer content box is 62 tall; the closed sum column (16 + 28) centres in it
assert.equal(14 + 62 - ((62 - 44) / 2 + 16 + 28 / 2), L.CHIP_FROM_BOTTOM, "chip centre line is where the total row sits")
assert.equal((62 - 44) / 2, L.LIFT, "the total lifts by half the closed gap when the save line opens")
assert.match(src, /\.cdc-coupon\{[^}]*width:" \+ L\.CW \+ "px;height:" \+ L\.CH \+ "px/, "coupon size comes from the model")

// Coupon face: code and percent sit in one baseline-aligned row; the percent stub starts exactly at
// the seam and notches (69%), so the percent centres in it; the row fades at the card's edges.
assert.match(css, /\.cdc-line\{[^}]*display:flex;align-items:baseline/, "code and percent share a baseline")
assert.match(css, /\.cdc-cline\{[^}]*display:flex;align-items:baseline/, "chip code and percent share a baseline")
assert.match(css, /\.cdc-pct\{flex:none;width:31%/, "percent stub = 100% − seam")
assert.doesNotMatch(css, /\.cdc-line\{[^}]*padding/, "no padding shrinking the stub's percentage base")
assert.match(css, /\.cdc-seam\{[^}]*left:69%/, "seam at 69%")
assert.equal((css.match(/circle \d+px at 69% /g) || []).length, 8, "every notch sits on the seam")
assert.doesNotMatch(css, /72%/, "no stale seam positions")
assert.match(src, /scrollbar-width:none;-webkit-mask:linear-gradient\(90deg,#0000,#000 " \+ L\.PAD/, "row fades at the card edges")

// Timeline: the order the reference shows.
const T = m.T
assert.ok(T.wipeAt < T.depart && T.wipeAt + T.wipe < T.depart + 0.2, "the coupon is dust before it leaves")
assert.ok(T.slot < T.depart + T.travel, "the slot is open before the first dust lands")
const lastLand = T.depart + T.departSpread + 0.04 + T.travel * 1.05
assert.ok(lastLand < T.save + 0.1, "the total lifts only as the last dust lands (" + lastLand.toFixed(2) + ")")
assert.ok(T.swap > T.save + T.saveDur, "the banner waits for the total to settle")
assert.ok(T.end >= T.swap, "the loop runs until the swap")

// Dissolve edge: before the wipe nothing is freed, after it everything is.
for (let v = 0; v <= 1; v += 0.05) {
  for (const t of [0, 0.2, 0.4]) {
    assert.ok(m.edgeX(v, 0, t) <= 0, "edge starts left of the coupon")
    assert.ok(m.edgeX(v, 1, t) >= L.CW, "edge ends right of the coupon")
  }
}
assert.equal(m.couponX(0, 0), L.PAD)
assert.equal(m.couponX(2, 40), L.PAD + 2 * (L.CW + L.GAP) - 40, "scroll moves the source")

assert.equal(m.liftAt(0), 0)
assert.equal(m.liftAt(T.save + T.saveDur + 1), L.LIFT)

// Place order: spinner, then check, then the order-placed view, which waits for the sheet to leave.
const O = m.O
assert.ok(0 < O.check && O.check < O.view && O.view < O.burst, "spinner → check → view → dust burst")
assert.ok(O.reducedView < O.view, "reduced motion gets there sooner")
assert.match(src, /if \(!reduced\) later\(O\.burst/, "no dust burst under reduced motion")
assert.match(css, /\.cdc-ord3 \.cdc-main\{[^}]*opacity:0[^}]*transition-delay:0s/, "the sheet leaves at once")
assert.match(css, /\.cdc-ord3 \.cdc-done\{[^}]*transition:opacity \.3s ease \.14s/, "the order view enters after it")
assert.match(src, /setReceipt\(\{/, "the order view shows a receipt frozen at the press")
assert.match(css, /\.cdc-main\{transition:opacity \.26s ease \.18s/, "the sheet re-enters after the view leaves")
assert.match(css, /\.cdc-ord1 \.cdc-place,[^{]*\{width:48px;transform:none\}/, "button collapses to a circle")
// one fixed track, or the label's width stretches the column and the spinner centres off the circle
assert.match(css, /\.cdc-place\{[^}]*display:grid;grid-template:100%\/100%/, "button content shares one 100% track")
assert.match(css, /\.cdc-pl\{max-width:100%;overflow:hidden/, "label can't overflow the collapsing button")
assert.match(src, /disabled=\{busy \|\| order === 3\}/, "no ordering while dust is flying")
assert.match(src, /for \(const id of tm\) clearTimeout\(id\)/, "order timers cleared on unmount")
// the order view is a fixed stack, centred in the card; the burst starts on the badge's centre line
const stack = L.CONFIRM_TOP + 64 + 18 + 28 + 8 + 20 + 4 + 20 + 4 + 20 + 26 + 44
assert.equal(L.CARD_H - stack, L.CONFIRM_TOP, "order view is vertically centred")
assert.equal(L.CONFIRM_TOP + 32, L.CONFIRM_BADGE_Y, "burst centre = badge centre")
assert.match(m.orderNumber(40.2), /^CD-\d{4}$/)
assert.equal(m.orderNumber(40.2), m.orderNumber(40.2), "order number is stable")

// Money.
assert.equal(m.saving(134, 70), 93.8)
assert.equal(m.money(134 - 93.8, "$"), "$40.20")
assert.equal(m.money(1234.5, "€"), "€1,234.50")
assert.equal(m.money(-3, "$"), "$0.00")
assert.equal(m.saving(19.99, 15), 3)

// Colours.
assert.deepEqual(m.hexRgb("#fff"), [255, 255, 255])
assert.deepEqual(m.sampleStops([[0, "#000000"], [1, "#ffffff"]], 0.5), [128, 128, 128])
assert.deepEqual(m.sampleStops([[0, "#ff0000"], [1, "#0000ff"]], 2), [0, 0, 255])
assert.equal(m.easeInOutCubic(0), 0)
assert.equal(m.easeInOutCubic(1), 1)
assert.equal(m.bezier(0, 1, 2, 3, 0.5), 1.5)
const a = m.mulberry32(9), b = m.mulberry32(9)
for (let i = 0; i < 5; i++) assert.equal(a(), b())

console.log(slug + ": ok")
