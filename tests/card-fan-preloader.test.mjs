// Install-safety and choreography verification for card-fan-preloader.
// Run: node tests/card-fan-preloader.test.mjs

import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

const dir = new URL("../components/card-fan-preloader/", import.meta.url)
const src = readFileSync(new URL("card-fan-preloader.tsx", dir), "utf8")
const demo = readFileSync(new URL("demo.tsx", dir), "utf8")

// ---- 1. Install safety -----------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "react is the only import the component may have")

assert.doesNotMatch(src, /@import/, "no @import — host project owns fonts and styles")
assert.doesNotMatch(src, /^\s*(\*|body|html|:root)\s*\{/m, "no bare global resets")
assert.ok(src.includes('height = "100svh"'), "height prop defaults to a definite length")
assert.doesNotMatch(src, /className=["'][^"']*\bh-full\b/, "no h-full on root element")

// ---- 2. Scoped CSS Block ---------------------------------------------------
const cssMatch = src.match(/const CFP_CSS = `([\s\S]*?)`/)
assert.ok(cssMatch, "CFP_CSS block is present")
const css = cssMatch[1]

assert.doesNotMatch(css, /\$\{|`/, "no interpolation or unescaped backticks in CSS string")

const noComments = css.replace(/\/\*[\s\S]*?\*\//g, "")
let ruleCount = 0
for (const match of noComments.matchAll(/(?<=^|[{}])\s*([^{}]+?)\s*\{/g)) {
  const sel = match[1].trim()
  if (sel.startsWith("@") || /^(from|to|[\d.]+%)/.test(sel)) continue
  ruleCount++
  assert.ok(
    sel.split(",").every((s) => s.trim().startsWith(".cfp-")),
    `unscoped CSS selector would leak into the host app: ${sel}`,
  )
}
assert.ok(ruleCount >= 10, `expected at least 10 scoped rules, saw ${ruleCount}`)

// ---- 3. Reference Fidelity (6-Card Arc Geometry) -------------------
assert.ok(
  css.includes("translate3d(52px, 110px, 0)") && css.includes("-16deg"),
  "card 1 has exact -16deg rotation and (52px, 110px) offset",
)
assert.ok(
  css.includes("translate3d(87px, 105px, 0)") && css.includes("-8deg"),
  "card 2 animates to -8deg rotation and (87px, 105px) offset",
)
assert.ok(
  css.includes("translate3d(122px, 100px, 0)") && css.includes("0deg"),
  "card 3 animates to 0deg rotation and (122px, 100px) apex offset",
)
assert.ok(
  css.includes("translate3d(157px, 105px, 0)") && css.includes("8deg"),
  "card 4 animates to 8deg rotation and (157px, 105px) offset",
)
assert.ok(
  css.includes("translate3d(192px, 110px, 0)") && css.includes("16deg"),
  "card 5 animates to 16deg rotation and (192px, 110px) offset",
)
assert.ok(
  css.includes("width: 54px") && css.includes("height: 78px"),
  "card dimensions exactly match reference (54px x 78px)",
)
assert.ok(css.includes("border-radius: 5px"), "card corner radius matches reference (5px)")
assert.ok(
  css.includes("box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.25)"),
  "card box-shadow matches reference",
)
assert.ok(
  css.includes("width: 300px") && css.includes("height: 300px"),
  "stage dimensions match reference (300px x 300px)",
)

// Check z-index stacking order (0 to 5)
for (let i = 1; i <= 6; i++) {
  assert.ok(css.includes(`.cfp-card--${i}`), `class for card ${i} is present`)
  assert.ok(css.includes(`z-index: ${i - 1}`), `card ${i} has z-index ${i - 1}`)
}

// Check keyframe animations 2 through 5
for (let i = 2; i <= 5; i++) {
  assert.ok(css.includes(`@keyframes cfp-anim-card-${i}`), `keyframes for card ${i} exist`)
}

// Exit transition: fade + translate -20px over 0.25s
assert.ok(
  css.includes("translateY(-20px)") || css.includes("translate3d(0, -20px, 0)"),
  "preloader exit translates upward by 20px matching reference",
)

// ---- 4. Accessibility and Motion -------------------------------------------
assert.ok(src.includes("prefers-reduced-motion"), "honours prefers-reduced-motion")
assert.ok(src.includes('role="status"'), "reports status to assistive tech")
assert.ok(src.includes('aria-label="Loading"'), "has accessible loading label")

// onComplete called through ref
assert.ok(src.includes("onCompleteRef.current"), "calls onComplete through ref")
assert.doesNotMatch(
  src,
  /\}, \[[^\]]*\bonComplete\b[^\]]*\]\)/,
  "effect must not depend on onComplete identity",
)

// Demo imports canonical path
assert.ok(
  demo.includes('@/components/ui/card-fan-preloader'),
  "demo imports the canonical path",
)

console.log("card-fan-preloader: ok")
