// Install-safety and behaviour checks for components/case-stack-scroll.
// Run: node tests/case-stack-scroll.test.mjs
import assert from "node:assert/strict"
import { readFileSync, readdirSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const slug = "case-stack-scroll"
const root = new URL("../", import.meta.url)
const dir = new URL("components/" + slug + "/", root)
const src = readFileSync(new URL(slug + ".tsx", dir), "utf8")
const demo = readFileSync(new URL("demo.tsx", dir), "utf8")
const pkg = JSON.parse(readFileSync(new URL("package.json", root), "utf8"))
const tsconfig = readFileSync(new URL("tsconfig.json", root), "utf8")

// ---- install safety ------------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react", "react", "gsap"], "only react and gsap")
assert.ok(pkg.dependencies?.gsap, "gsap must be declared in the root package.json")
for (const f of readdirSync(dir))
  assert.ok(new RegExp("^(" + slug + "\\.tsx|demo(-[a-z0-9-]+)?\\.tsx|README\\.md)$").test(f), "unexpected file in the folder: " + f)
assert.ok(tsconfig.includes('"@/components/ui/' + slug + '": ["./components/' + slug + "/" + slug + '.tsx"]'), "tsconfig paths line")
assert.ok(demo.includes('from "@/components/ui/' + slug + '"'), "demo imports the installer path")
assert.doesNotMatch(demo, /https?:\/\//, "the demo itself loads nothing off-origin")

assert.ok(src.includes('height = "100svh"'), "height defaults to a definite length")
assert.ok(src.includes('"--cs-h": height'), "the height prop feeds --cs-h")
assert.doesNotMatch(src, /className=["'][^"']*\bh-full\b/, "no h-full")
assert.doesNotMatch(src, /@import/, "no @import")
assert.ok(src.includes('{fontHref && <link rel="stylesheet" href={fontHref} />}'), "fontHref null loads nothing")
for (const m of src.matchAll(/https?:\/\/([a-z0-9.-]+)\//g))
  assert.ok(["fonts.googleapis.com", "images.unsplash.com", "images.pexels.com"].includes(m[1]), "unexpected host " + m[1])

const allowed = ["--color-background", "--color-foreground", "--color-muted-foreground", "--color-border", "--color-primary"]
for (const m of src.matchAll(/var\((--color-[a-z-]+)/g)) assert.ok(allowed.includes(m[1]), "unknown host token " + m[1])

// ---- the scoped CSS string --------------------------------------------------------
const css = src.match(/const CSS = `([\s\S]*?)`/)[1]
assert.doesNotMatch(css, /\$\{/, "no ${ in the CSS string")
for (const bad of [/(^|[},])\s*\*\s*\{/, /(^|[},])\s*body\s*\{/, /:root/, /(^|[},])\s*html\s*\{/])
  assert.doesNotMatch(css, bad, "no bare resets in the CSS: " + bad)
for (const rule of css.matchAll(/(?:^|[{}])\s*(?!@)([^{}\s][^{}]*)\{/g)) {
  const sel = rule[1].trim()
  if (!sel || /^(from|to|[\d.]+%)/.test(sel)) continue
  for (const one of sel.split(/,(?![^(]*\))/)) assert.ok(one.trim().startsWith(".cs-"), "unscoped selector: " + one.trim())
}
assert.ok(css.includes("container:cs/inline-size") && css.includes("@container cs (max-width: 720px)"), "layout answers the component's width")
assert.ok(css.includes(".cs-root img{max-width:none}"), "Preflight cannot shrink screenshot images")
assert.ok(css.includes("@media (prefers-reduced-motion: reduce)"), "CSS honours reduced motion")
assert.ok(src.includes('matchMedia("(prefers-reduced-motion: reduce)")') && (src.match(/reduced\(\)/g) || []).length >= 4, "the roll, the lift and the cursor check reduced motion")
// Planes are painted in z-order under one perspective: never preserve-3d, or neighbours intersect.
assert.doesNotMatch(css, /preserve-3d/, "the stage must not be preserve-3d")
assert.ok(css.includes(".cs-stage{position:absolute;inset:0;perspective:"), "one shared perspective on the stage")
assert.ok(css.includes("touch-action:pan-x}"), "only the stage takes vertical swipes")

// ---- interaction contracts ---------------------------------------------------------
assert.ok(src.includes('addEventListener("wheel", onWheel, { passive: false })'), "the wheel drives the stack")
assert.ok(src.includes("st.target += px / 420") && !/Math\.min\(max/.test(src), "the wheel is never clamped: the stack loops")
assert.ok(src.indexOf("root.setPointerCapture") > src.indexOf("Math.abs(d) > 6"), "pointer is captured only once it is a drag")
assert.ok(src.includes("gsap.ticker.remove(tick)") && src.includes("ro.disconnect()") && src.includes("clearTimeout(snap)"), "loop, observer and snap timer are torn down")
assert.ok(src.includes("tabIndex={k === front ? 0 : -1}"), "the stack is one tab stop")
assert.ok(src.includes('if (e.pointerType !== "mouse") return') && css.includes("@media (hover: none){.cs-cursor{display:none}}"), "the cursor disc only follows a real mouse")

// ---- the stack layout, run for real ---------------------------------------------------
const start = src.indexOf("// #region stack-layout")
const end = src.indexOf("// #endregion")
assert.ok(start > -1 && end > start, "stack-layout region markers missing")
const { cardPose, slotOf } = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(src.slice(start, end))))

const front = cardPose(0, 0, -1, 0, 12)
assert.deepEqual([front.y, front.z, front.rot, front.opacity].map((v) => Math.round(v * 1e9) / 1e9 + 0), [0, 0, 0, 1], "the front card faces you at the anchor")
// Behind the front, every card sits higher and deeper, and keeps a visible strip.
for (let k = 1; k < 11; k++) {
  const a = cardPose(k - 1, 0, -1, 0, 12)
  const b = cardPose(k, 0, -1, 0, 12)
  assert.ok(b.y < a.y && b.z < a.z, "card " + k + " is filed above and behind card " + (k - 1))
  assert.ok(a.y - b.y > 0.12, "card " + k + " keeps a visible strip")
}
assert.ok(cardPose(10, -0.399, -1, 0, 12).opacity < 0.001, "the card about to wrap to the front is invisible at the back")
assert.equal(cardPose(0, 1.6, -1, 0, 12).opacity, 0, "a card is invisible by the time it falls far enough to wrap")
// The loop: rolling a whole lap puts every card back, both ways, and slots stay in [-1.6, n - 1.6).
for (const roll of [-25.3, -12, -0.4, 0, 3.7, 12, 30.9])
  for (let k = 0; k < 12; k++) {
    const s = slotOf(k, roll, 12)
    assert.ok(s >= -1.6 && s < 10.4, "slot in range for roll " + roll)
    assert.ok(Math.abs(slotOf(k, roll + 12, 12) - s) < 1e-9 && Math.abs(slotOf(k, roll - 12, 12) - s) < 1e-9, "a lap either way is the same stack")
  }
assert.ok(Math.abs(slotOf(11, -1, 12)) < 1e-9, "rolling back brings the last card to the front")
assert.ok(cardPose(0, 0.5, -1, 0, 12).y > 0, "a card rolling past the front drops down")
// Lifting card 4 turns it flat and slides the cards in front down; the ones behind barely move.
assert.equal(cardPose(4, 0, 4, 1, 12).rot, 0, "the lifted card faces you")
assert.ok(cardPose(2, 0, 4, 1, 12).y - cardPose(2, 0, -1, 0, 12).y > 0.5, "cards in front slide down")
assert.ok(Math.abs(cardPose(7, 0, 4, 1, 12).y - cardPose(7, 0, -1, 0, 12).y) < 0.1, "cards behind barely move")
// Lifting works across the wrap: with card 11 at the front, card 1 is behind it.
assert.ok(cardPose(11, -1, 1, 1, 12).y - cardPose(11, -1, -1, 0, 12).y > 0.5, "cards in front of a lifted card slide down across the wrap")

console.log(slug + ": ok")
