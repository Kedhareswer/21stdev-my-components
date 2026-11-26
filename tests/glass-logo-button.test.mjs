// Install-safety and formation-timeline checks for components/glass-logo-button.
// Run: node tests/glass-logo-button.test.mjs
import assert from "node:assert/strict"
import { existsSync } from "node:fs"
import { checkComponent, liftRegion } from "./_component-safety.mjs"

const slug = "glass-logo-button"
const { src, demo, css } = checkComponent(slug, { prefix: "glb-", imports: ["react", "react"], inline: true, minRules: 6 })

assert.match(src, /^"use client"/, "client component")
assert.match(src, /export default function GlassLogoButton\(/, "default export")
assert.match(src, /<button type="button"/, "a real button")
assert.match(demo, /from "@\/components\/ui\/glass-logo-button"/, "demo imports the installed path")
assert.match(demo, /replayEvery=\{\d+\}/, "the demo replays the formation unattended")
assert.match(demo, /width: "100%"/, "demo stage fills its row")
assert.match(src, /reduce\.matches \? FORMATION_SECONDS/, "reduced motion lands on the formed button")
assert.match(src, /IntersectionObserver/, "the loop pauses off screen")
assert.match(src, /useId\(\)/, "filter ids are unique per instance")
assert.match(css, /\.glb-btn:focus-visible\{/, "visible keyboard focus")
assert.ok(existsSync(new URL("../media/" + slug + "/cover.png", import.meta.url)), "cover exists")
assert.ok(existsSync(new URL("../media/" + slug + "/thumb.webp", import.meta.url)), "thumb exists")

// ---------- the formation, as shipped ----------
const { formation, roundRect, sidePiece, FORMATION_SECONDS } = await liftRegion(src, "formation")
const W = 280, H = 250, R = 64
const f0 = formation(0, W, H, R)
assert.ok(Math.abs(f0.w - f0.h) < 1e-9 && Math.abs(f0.r - f0.w / 2) < 1e-9, "it starts as a circle")
assert.ok(f0.w < 0.4 * H, "it starts small")
assert.ok(f0.drops < 1e-9, "no droplets at the start")
const mid = formation(0.37, W, H, R)
assert.ok(mid.drops > 0.2 && mid.bars === 0, "droplets bead before the bars form")
const bone = formation(0.6, W, H, R)
assert.ok(bone.bars > 0.99 && bone.bend < 0.01, "bars join before they bend")
const end = formation(FORMATION_SECONDS, W, H, R)
assert.ok(end.done, "formation finishes")
assert.ok(Math.abs(end.w - W) < 1e-9 && Math.abs(end.h - H) < 1e-9 && Math.abs(end.r - R) < 1e-9, "lands on the requested size")
assert.ok(Math.abs(end.sx - 1) < 0.002 && end.chroma < 1e-9, "settles: no wobble, no chroma")
assert.ok(formation(0.4, W, H, R).chroma > 0.9, "chroma peaks during the morph")
let prevW = 0
for (let t = 0; t <= 0.16; t += 0.01) { const f = formation(t, W, H, R); assert.ok(f.w >= prevW - 1e-9, "the bubble only grows while it forms"); prevW = f.w }
assert.ok(formation(5, 200, 120, 999).r <= 60, "radius never exceeds half the height")
assert.match(roundRect(100, 60, 20), /^M-30 -30H30A20 20 0 0 1 50 -10/, "rounded rect path")
const left = sidePiece(end, -1), right = sidePiece(end, 1)
assert.match(left.path, /^M-83 -50Q-128 0 -83 50$/, "left bracket bows out and curls in")
assert.match(right.path, /^M83 -50Q128 0 83 50$/, "right bracket mirrors it")
assert.equal(sidePiece(mid, -1).path, "", "no bar while only droplets show")
console.log("glass-logo-button: ok")
