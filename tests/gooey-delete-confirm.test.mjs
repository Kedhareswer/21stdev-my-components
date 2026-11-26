// Install-safety and blob-timeline checks for components/gooey-delete-confirm.
// Run: node tests/gooey-delete-confirm.test.mjs
import assert from "node:assert/strict"
import { existsSync } from "node:fs"
import { checkComponent, liftRegion } from "./_component-safety.mjs"

const slug = "gooey-delete-confirm"
const { src, demo, css } = checkComponent(slug, { prefix: "gdc-", imports: ["react", "react"], inline: true, minRules: 6 })

assert.match(src, /^"use client"/, "client component")
assert.match(src, /export default function GooeyDeleteConfirm\(/, "default export")
assert.match(demo, /from "@\/components\/ui\/gooey-delete-confirm"/, "demo imports the installed path")
assert.match(demo, /<GooeyDeleteConfirm autoPlay \/>/, "the demo shows the motion unattended")
assert.match(demo, /width: "100%"/, "demo stage fills its row")
assert.equal((src.match(/<button/g) || []).length, 3, "pill, cancel and confirm are real buttons")
assert.match(src, /aria-live="polite"/, "the question is announced")
assert.match(src, /autoPlay && !st\.touched && !reduce\.matches/, "the unattended loop stops on touch and under reduced motion")
assert.match(src, /const step = reduce\.matches \? 1/, "reduced motion switches states instantly")
assert.match(src, /new ResizeObserver/, "pointer mapping follows the rendered size without layout reads")
assert.match(src, /IntersectionObserver/, "the loop pauses off screen")
assert.match(css, /\.gdc-root\{[^}]*width:100%;max-width:520px/, "fills its row up to 520 px, scales down on narrow screens")
assert.ok(existsSync(new URL("../media/" + slug + "/cover.png", import.meta.url)), "cover exists")
assert.ok(existsSync(new URL("../media/" + slug + "/thumb.webp", import.meta.url)), "thumb exists")

const { shapesAt, centreShift, labelsAt, PILL_W, PILL_H, CHIP_W, CHIP_H, W, H } = await liftRegion(src, "goo")
const s0 = shapesAt(0)
assert.equal(s0.main.w, PILL_W, "idle pill width")
assert.equal(s0.main.h, PILL_H, "idle pill height")
assert.equal(s0.top.w, 0, "no chips while idle")
assert.ok(Math.abs(centreShift(s0)) < 1e-9, "idle pill sits centred")
const bulb = shapesAt(0.45)
assert.ok(bulb.top.h > PILL_H * 1.5, "the bulb swells taller than the pill")
assert.ok(Math.abs(bulb.top.cy) < 1e-9, "the bulb is still one blob")
assert.ok(bulb.top.cx - bulb.top.w / 2 < bulb.main.cx + bulb.main.w / 2 - 20, "the bulb is still joined to the pill")
const s1 = shapesAt(1)
assert.ok(Math.abs(s1.top.w - CHIP_W) < 1e-6 && Math.abs(s1.top.h - CHIP_H) < 1e-6, "chips land at their size")
assert.ok(s1.bottom.cy - s1.bottom.h / 2 - (s1.top.cy + s1.top.h / 2) >= 24, "the chips separate fully (gap beats the goo blur)")
assert.ok(s1.top.cx - s1.top.w / 2 - (s1.main.cx + s1.main.w / 2) >= 16, "the chips separate from the pill")
const sh = centreShift(s1)
assert.ok(Math.abs(s1.main.cx - s1.main.w / 2 + sh + (s1.top.cx + s1.top.w / 2 + sh)) < 1e-6, "the open layout is centred")
assert.ok(W / 2 + sh + s1.top.cx + s1.top.w / 2 <= W && s1.bottom.cy + s1.bottom.h / 2 <= H / 2, "the open layout fits the frame")
assert.deepEqual(labelsAt(0), { idle: 1, ask: 0, icons: 0 }, "idle labels")
assert.deepEqual(labelsAt(1), { idle: 0, ask: 1, icons: 1 }, "open labels")
console.log("gooey-delete-confirm: ok")
