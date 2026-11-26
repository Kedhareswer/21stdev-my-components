// Install-safety and key-field logic checks for components/glow-hex-keys.
// Run: node tests/glow-hex-keys.test.mjs
import assert from "node:assert/strict"
import { existsSync } from "node:fs"
import { checkComponent, liftRegion } from "./_component-safety.mjs"

const slug = "glow-hex-keys"
const { src, demo, css } = checkComponent(slug, { prefix: "ghk-", imports: ["react", "react"], minRules: 4 })

assert.match(src, /^"use client"/, "client component")
assert.match(src, /export default function GlowHexKeys\(/, "default export")
assert.match(demo, /from "@\/components\/ui\/glow-hex-keys"/, "demo imports the installed path")
assert.match(demo, /<GlowHexKeys autoPlay \/>/, "the demo shows the motion unattended")
assert.match(css, /\.ghk-root\{[^}]*width:100%/, "root states its width")
assert.match(src, /style=\{\{ minHeight: height, height, \.\.\.style \}\}/, "height comes from the prop")
assert.match(src, /autoPlay && !ptr\.touched && !reduce\.matches/, "the ghost stops on touch and under reduced motion")
assert.match(src, /reduce\.matches \? target : stepHeat/, "reduced motion drops the trail")
assert.match(src, /new ResizeObserver/, "canvas follows the rendered size")
assert.match(src, /IntersectionObserver/, "the loop pauses off screen")
assert.match(src, /Math\.min\(tilt \? 1\.5 : 2, window\.devicePixelRatio/, "device pixels are capped")
assert.match(src, /tilt = true/, "the board is tilted by default, like the reference")
assert.doesNotMatch(src.slice(src.indexOf("const CSS ="), src.indexOf("const mix")), /scale\(/, "the tilted canvas is laid out larger, never scaled up")
assert.ok(existsSync(new URL("../media/" + slug + "/cover.png", import.meta.url)), "cover exists")
assert.ok(existsSync(new URL("../media/" + slug + "/thumb.webp", import.meta.url)), "thumb exists")

const { layoutKeys, hexCorners, warmth, stepHeat, ghostPath } = await liftRegion(src, "keys")
const W = 1280, H = 800, S = 88, G = 9
const keys = layoutKeys(W, H, S, G, 16)
const r = S / Math.sqrt(3)
assert.ok(keys.some((k) => k.x - S / 2 < 0) && keys.some((k) => k.x + S / 2 > W), "keys bleed past left and right")
assert.ok(keys.some((k) => k.y - r < 0) && keys.some((k) => k.y + r > H), "keys bleed past top and bottom")
// every point of the field is covered by some key's bounding circle (no bare border)
for (const [x, y] of [[0, 0], [W, 0], [0, H], [W, H], [W / 2, H / 2]]) assert.ok(keys.some((k) => Math.hypot(k.x - x, k.y - y) <= r + G), "covered at " + x + "," + y)
// neighbours never repeat an icon
const at = new Map(keys.map((k) => [k.row + ":" + k.col, k]))
for (const k of keys) {
  const odd = k.row % 2
  const nb = [[0, -1], [0, 1], [-1, odd ? 0 : -1], [-1, odd ? 1 : 0], [1, odd ? 0 : -1], [1, odd ? 1 : 0]]
  for (const [dr, dc] of nb) { const n = at.get(k.row + dr + ":" + (k.col + dc)); if (n) assert.notEqual(n.icon, k.icon, "neighbouring keys share an icon") }
}
// neighbouring centres sit exactly one key + groove apart
const a = at.get("1:1"), b = at.get("1:2"), c = at.get("2:1")
assert.ok(Math.abs(Math.hypot(b.x - a.x, b.y - a.y) - (S + G)) < 1e-6, "row spacing")
assert.ok(Math.abs(Math.hypot(c.x - a.x, c.y - a.y) - (S + G)) < 0.6, "diagonal spacing matches")
const hc = hexCorners(0, 0, S)
assert.equal(hc.length, 6, "six corners")
assert.ok(Math.abs(hc[0][1] + r) < 1e-9 && Math.abs(hc[0][0]) < 1e-9, "pointy top")
assert.equal(warmth(0, 100), 1, "full warmth under the pointer")
assert.equal(warmth(100, 100), 0, "none at the reach")
assert.ok(warmth(30, 100) > warmth(60, 100), "warmth falls off")
assert.ok(stepHeat(0, 1, 0.05, 1.8) > 0.5, "heat rises fast")
const cooled = stepHeat(1, 0, 0.5, 1.8)
assert.ok(cooled > 0.7 && cooled < 0.8, "heat cools slowly (half a second keeps ~76%)")
const g0 = ghostPath(0, W, H), g1 = ghostPath(3, W, H)
for (const g of [g0, g1]) assert.ok(g.x > W * 0.15 && g.x < W * 0.85 && g.y > H * 0.2 && g.y < H * 0.8, "ghost stays in the middle")
console.log("glow-hex-keys: ok")
