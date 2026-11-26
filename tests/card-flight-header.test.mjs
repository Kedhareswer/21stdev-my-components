// Install-safety and flight-geometry checks for components/card-flight-header.
// Run: node tests/card-flight-header.test.mjs
import assert from "node:assert/strict"
import { existsSync } from "node:fs"
import { checkComponent, liftRegion } from "./_component-safety.mjs"

const slug = "card-flight-header"
const { src, demo, css } = checkComponent(slug, { prefix: "cfh-", imports: ["react", "react"], inline: true, vars: ["--panel-h", "--ix", "--ixw", "--ixn", "--slot", "--row", "--i"] })

assert.match(src, /^"use client"/, "client component")
assert.match(src, /export default function CardFlightHeader\(/, "default export")
assert.match(demo, /from "@\/components\/ui\/card-flight-header"/, "demo imports the installed path")
assert.match(demo, /<CardFlightHeader autoPlay /, "the demo shows the motion unattended")
assert.match(demo, /width: "100%"/, "demo fills its row")
assert.match(css, /\.cfh-root\{position:relative;width:100%/, "root states its width")
assert.match(src, /aria-expanded=\{open === i\}/, "menu buttons report their state")
assert.match(src, /e\.key === "Escape"/, "Escape closes")
assert.match(css, /@media \(prefers-reduced-motion:reduce\)\{\.cfh-card\{animation:cfh-fade/, "reduced motion fades instead of flying")
assert.match(src, /if \(reduce\.matches\) return/, "no autoplay under reduced motion")
assert.match(src, /Client 1/, "placeholder work is Client 1/2/3")
assert.ok(existsSync(new URL("../media/" + slug + "/cover.png", import.meta.url)), "cover exists")
assert.ok(existsSync(new URL("../media/" + slug + "/thumb.webp", import.meta.url)), "thumb exists")

const { NAV, itemCentre, flightTimes, ghostMenu } = await liftRegion(src, "flight")
// launch points come straight from the nav geometry, for wide and narrow layouts
assert.match(src, /\["--ixw" as string\]: itemCentre\(m, false\) \+ "px", \["--ixn" as string\]: itemCentre\(m, true\) \+ "px"/, "rows launch from their own item")
assert.match(css, /\.cfh-row\{--ix:var\(--ixw\)/, "wide launch point")
assert.match(css, /@container \(max-width:560px\)\{[^]*\.cfh-row\{--ix:var\(--ixn\)\}/, "narrow launch point")
assert.equal(itemCentre(2, false) - itemCentre(0, false), 88 / 2 + 92 + 84 / 2, "item centres follow the fixed widths")
// switching or closing sends the old cards home
assert.match(css, /@keyframes cfh-back\{/, "cards fly back into their item")
assert.match(css, /\.cfh-leaving \.cfh-card\{animation:cfh-back/, "leaving rows play the return flight")
assert.match(css, /@keyframes cfh-fly\{0%\{opacity:0;filter:blur\(10px\)/, "cards leave the pill blurred by speed")
assert.match(css, /prefers-reduced-motion:reduce\)\{[^}]*\}\.cfh-leaving\{display:none\}/, "no return flight under reduced motion")
assert.match(src, /aria-hidden="true">\s*\{cardsOf\(leaving\.m, false\)\}/, "leaving cards are hidden from assistive tech")
assert.match(css, /\.cfh-brand\{[^}]*width:112px/, "brand width matches NAV")
assert.match(css, /@container \(max-width:560px\)\{\.cfh-brand\{width:44px\}/, "narrow brand width matches NAV")
NAV.items.forEach((w, i) => assert.ok(src.includes("[84, 92, 88][i]") && [84, 92, 88][i] === w, "item widths match"))
const t = [0, 1, 2].map(flightTimes)
assert.ok(t[0].start < t[1].start && t[1].start < t[2].start, "cards leave one after another")
assert.match(css, /animation:cfh-fly \.78s[^;]*;animation-delay:calc\(110ms \+ var\(--i\) \* 110ms\)/, "CSS timing matches flightTimes")
assert.equal(t[0].land - t[0].start, 780, "flight length")
assert.equal(ghostMenu(0), -1, "demo starts closed")
assert.equal(ghostMenu(1000), 2, "then opens Studio, as in the reference")
assert.deepEqual([...new Set([500, 2000, 4500, 7000, 8500].map(ghostMenu))].sort(), [-1, 0, 1, 2], "and visits every menu")
console.log("card-flight-header: ok")
