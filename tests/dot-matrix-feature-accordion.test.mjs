// Install-safety and behaviour checks for components/dot-matrix-feature-accordion.
// Run: node tests/dot-matrix-feature-accordion.test.mjs
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

const src = readFileSync(
  new URL("../components/dot-matrix-feature-accordion/dot-matrix-feature-accordion.tsx", import.meta.url),
  "utf8",
)
const demo = readFileSync(new URL("../components/dot-matrix-feature-accordion/demo.tsx", import.meta.url), "utf8")

// The section sizes to its content. A percentage height on the root collapses to
// 0px on an installed page with no height chain.
assert.doesNotMatch(src, /\bh-full\b/, "no h-full anywhere — nothing here should inherit a height")
assert.ok(src.includes("aspect-square w-full"), "the card must carry its own square size")

// 21st ships this file alone.
assert.doesNotMatch(src, /@import/, "no @import")
assert.doesNotMatch(src, /^\s*(\*|body|:root)\s*{/m, "no bare global resets")
assert.doesNotMatch(src, /from "\.\.?\//, "no relative imports — they do not travel")
assert.ok(demo.includes('from "@/components/ui/dot-matrix-feature-accordion"'), "demo imports the installer path")

// Only the tokens 21st guarantees.
for (const m of src.matchAll(/var\(--color-([a-z-]+)\)/g)) {
  assert.ok(["foreground", "background", "muted-foreground", "border", "primary"].includes(m[1]), "unexpected token " + m[1])
}
assert.doesNotMatch(src, /\b(?:text|bg|border)-(?:muted|accent|card|popover|secondary)(?![-\w])/, "no tokens beyond the five")

// Preflight's img/canvas max-width must not shrink the dot canvas.
assert.ok(/<canvas[\s\S]*?maxWidth: "none"/.test(src), "canvas needs a max-width escape")

// Canvas is drawn at its laid-out size × DPR, never CSS-scaled up (blurry dots). Layout
// size, not the client rect, so the card's tilt can't shrink the backing store.
assert.ok(src.includes("Math.round(w * dpr)") && src.includes("cv.offsetWidth"), "canvas backing store must follow its layout size")

// Snippet swap is exit-then-enter on one layer: no double exposure. The wrapper
// that carries the blur transition stays mounted; only its content is keyed, so
// count-ups and meters restart on every entry.
assert.ok(src.includes("SNIPPET_OUT_MS") && src.includes("setShown(active)"), "snippet must swap after the exit")
assert.doesNotMatch(src, /data-dmfa="snippet"[^>]*\bkey=/, "a keyed wrapper would remount and skip the enter transition")
assert.ok(src.includes("<Fragment key={features[shown]?.id}>"), "snippet content must remount per feature")

// Interactions beyond the reference: cursor-reactive dots, click ripple, swipe, keys, tilt.
assert.ok(src.includes("inp.inside") && src.includes("POINTER_R"), "dots must react to the cursor")
assert.ok(src.includes("ripples.push"), "click/tap must send a ripple")
assert.ok(src.includes('touchAction: "pan-y"') && src.includes("SWIPE_PX"), "horizontal swipe on touch, vertical scroll kept")
for (const k of ["ArrowDown: 1", "ArrowUp: -1", '"ArrowRight"', '"ArrowLeft"', '"Enter"']) assert.ok(src.includes(k), "keyboard: " + k)
assert.ok(src.includes('role="button"') && src.includes("tabIndex={0}"), "the card is a focusable control")
assert.ok(/card\.style\.transform = "perspective\(/.test(src), "tilt is a rotation, not a scale-up")
assert.doesNotMatch(src, /scale\((1\.[1-9]|[2-9])/, "never enlarge with transform: scale (pixelates)")

// The scoped CSS string survives 21st's style handling.
const css = src.match(/const DMFA_CSS =([\s\S]*?)\n\n/)[1]
assert.doesNotMatch(css, /`|\$\{/, "no backticks or ${ in the CSS string")
assert.ok(css.includes("prefers-reduced-motion: reduce"), "chip pop honours reduced motion")
assert.doesNotMatch(css, /(^|[}"])\s*(\*|body|html|:root)\s*\{/, "CSS stays scoped")

// The motion loop must stop when nobody can see it.
assert.ok(src.includes("visible.current && !document.hidden"), "dot loop pauses off-screen / in background tabs")

// Panel slide is eased off the live row box, not snapped.
assert.ok(src.includes("Math.exp(-dt / PANEL_TAU)"), "panel must lerp toward the active row")

// Hover selects and pauses; reduced motion is honoured.
assert.ok(src.includes('e.pointerType === "mouse" && select(i)'), "hovering a row selects it")
assert.ok(src.includes("prefers-reduced-motion: reduce"), "must read prefers-reduced-motion")
assert.ok(src.includes("motion-reduce:transition-none"), "CSS transitions must honour reduced motion")

// No identifiers from the reference work.
assert.doesNotMatch(src + demo, /\bdoze\b/i, "no reference brand name")
assert.doesNotMatch(src, /Apple|Blue Bottle|Steve Jobs/, "no real brands or people in the placeholder copy")

// Dot patterns: deterministic, edge-hugging, never in the snippet's middle.
const region = src.match(/\/\/ #region dot-patterns\n([\s\S]*?)\/\/ #endregion dot-patterns/)
assert.ok(region, "dot-patterns region missing")
const js = region[1]
  .replace(/export /g, "")
  .replace(/\(seed: number\)/g, "(seed)")
  .replace(/: Dot\[\]/g, "")
  .replace(/type Dot = [^\n]*\n/, "")
  .replace(/new Set<string>\(\)/, "new Set()")
const makeDotPattern = new Function(js + "\nreturn makeDotPattern")()
for (let seed = 0; seed < 12; seed++) {
  const a = makeDotPattern(seed)
  const b = makeDotPattern(seed)
  assert.deepEqual(a, b, "pattern must be deterministic per seed")
  assert.ok(a.length > 60, "pattern " + seed + " too sparse: " + a.length)
  for (const d of a) {
    const edge = Math.min(d.x, d.y, 40 - d.x, 40 - d.y)
    assert.ok(edge >= 1 && edge <= 8, "dot strays off the edge band: " + JSON.stringify(d))
  }
  assert.equal(new Set(a.map((d) => d.x + "," + d.y)).size, a.length, "duplicate cells")
}
assert.notDeepEqual(makeDotPattern(3), makeDotPattern(4), "each feature gets its own pattern")

console.log("dot-matrix-feature-accordion: ok")
