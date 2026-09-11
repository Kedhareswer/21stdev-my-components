// Install-safety check for components/pinboard-portfolio-hero.
// Run: node tests/pinboard-portfolio-hero.test.mjs
//
// The poster is drawn, not photographed, and the interaction is bolted onto
// that drawing — so the failures worth guarding are the ones where the drawing
// stops being self-contained, or where turning interaction OFF stops meaning
// "exactly as it was".
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

const dir = new URL("../components/pinboard-portfolio-hero/", import.meta.url)
const src = readFileSync(new URL("pinboard-portfolio-hero.tsx", dir), "utf8")
const styles = src.slice(src.indexOf("const CSS = `") + 13, src.indexOf("`", src.indexOf("const CSS = `") + 13))
assert.ok(styles.length > 200, "could not lift the CSS block")

// The whole premise: no asset travels with this component, because none exists.
for (const bad of [/<img/, /url\(data:/, /\.png/, /\.jpe?g/, /\.webp/, /background-image/, /@font-face/]) {
  assert.doesNotMatch(src, bad, `no external asset may appear (${bad})`)
}
assert.doesNotMatch(src, /@import/, "no @import — the host owns Tailwind and fonts")
assert.doesNotMatch(styles, /^\s*(\*|body|:root|html)\s*\{/m, "no bare global resets")
assert.doesNotMatch(styles, /\$\{|`/, "no backticks or interpolation inside the CSS string")

// A definite height, never an inherited one.
assert.ok(/height = "100svh"/.test(src), "height must default to a definite length")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")
// The absolutely-positioned layers are meant to be height:100% — they fill the
// root. The root itself must not be, or it collapses on a page with no height
// chain; its height comes from the prop, via the style attribute.
const rootRule = styles.match(/\.pph-root\{([^}]*)\}/)
assert.ok(rootRule, ".pph-root rule missing")
assert.doesNotMatch(rootRule[1], /height/, ".pph-root must take its height from the prop, not CSS")

// Two heroes on one page must not share filter ids — the second would repaint
// the first, because SVG filter references are global.
assert.ok(src.includes("React.useId()"), "filter ids must be per-instance")
assert.ok(/const u = \(n: string\) => "url\(#" \+ uid/.test(src), "filter refs must go through the per-instance id")

/* ---- interaction: off must mean untouched ---- */

assert.ok(/interactive = false/.test(src), "interaction must default to off")

// Rest state is identity arithmetic: zero offsets, pins where drawn, whole sheet
// in view. If any of these stops being the rest value, the static poster moves.
assert.ok(
  /REST_OFFSETS: Vec\[\] = Array\.from\(\{ length: 6 \}, \(\) => \(\{ x: 0, y: 0 \}\)\)/.test(src),
  "papers must rest at zero offset",
)
// The view rests on the artwork, not the whole sheet — the sheet has a wide
// empty margin that leaves the poster stranded on a landscape screen.
assert.ok(/const CONTENT: View = \{/.test(src), "CONTENT frame missing")
assert.ok(/const REST_VIEW: View = CONTENT/.test(src), "the view must rest on the artwork")
const box = src.match(/const CONTENT: View = \{ x: (-?[\d.]+), y: (-?[\d.]+), w: ([\d.]+), h: ([\d.]+) \}/)
assert.ok(box, "CONTENT must be a literal rect")
const [, cx, cy, cw, ch] = box.map(Number)
assert.ok(cw <= 735 && ch <= 1102, "the frame must sit inside the sheet")
assert.ok(cw / ch > 0.8 && cw / ch < 1.3, `frame aspect ${(cw / ch).toFixed(2)} — the artwork is roughly square`)

// The six pins and the papers that carry them have to stay in step: a stale
// index here silently detaches a pin from its paper, or crashes on drag.
const pinCount = (src.match(/tone: "(red|blue)" \}/g) ?? []).length
assert.equal(pinCount, 6, `expected 6 pins, found ${pinCount}`)
const carried = src.match(/const PAPER_PINS: number\[\]\[\] = (\[.*\])/)
assert.ok(carried, "PAPER_PINS missing")
const indices = [...carried[1].matchAll(/\d+/g)].map((m) => +m[0])
assert.ok(indices.length > 0, "no pin is carried by any paper")
for (const i of indices) assert.ok(i < pinCount, `PAPER_PINS references pin ${i}, which does not exist`)
assert.equal(new Set(indices).size, indices.length, "a pin is carried by two different papers")

// Six papers, every one of them grabbable. paper() emits both the placement and
// the grab handler, so they cannot drift apart — but check it still does both.
const placed = [...src.matchAll(/\{\.\.\.paper\((\d+),/g)].map((m) => +m[1])
assert.equal(new Set(placed).size, 6, `expected 6 draggable papers, found ${new Set(placed).size}`)
assert.ok(
  /const paper = \(i: number[\s\S]{0,400}?\.\.\.hold\("paper", i\)/.test(src),
  "paper() must carry the grab handler",
)
// paint() finds its nodes by these attributes; without them nothing moves.
for (const attr of ['"data-paper": i', '"data-rx": x', '"data-ry": y', '"data-rot": rot']) {
  assert.ok(src.includes(attr), `paper() must emit ${attr}`)
}
assert.ok(/data-pin=\{i\}/.test(src), "pins must be addressable by index")
assert.ok(/data-floss=\{j\}/.test(src), "floss must be addressable by index")

// The animation must not go through React: this poster is ~680 filtered SVG
// leaves, and a re-render per frame measured at 3fps.
assert.doesNotMatch(src, /useState/, "interaction state must not live in React")
assert.ok(src.includes("const paint = ()"), "positions must be written straight to the DOM")

// The floss must be computed, not hardcoded — two pins moved apart with a
// literal `d` would leave the thread hanging in mid-air.
assert.ok(src.includes("flossPath(pins.current[f.a], pins.current[f.b]"), "floss must be redrawn from live pin positions")
assert.doesNotMatch(src, /d="M158 406C120 442/, "the floss literal must be gone, not merely duplicated")

// Scroll-jacking guard. A hero that eats a plain wheel traps the reader.
assert.ok(
  /if \(!e\.ctrlKey && !e\.metaKey\) return\s*\n\s*e\.preventDefault\(\)/.test(src),
  "zoom must require a modifier, and must not preventDefault without one",
)
assert.ok(src.includes('{ passive: false }'), "the wheel listener must be native and non-passive")

// Pointer maths must go through the SVG's own matrix; re-deriving it by hand
// gets the fit and the letterboxing wrong at every zoom level.
assert.ok(src.includes("getScreenCTM()"), "screen->sheet mapping must use the SVG CTM")

// Demos import the path an installer ends up with.
for (const file of ["demo.tsx", "demo-band.tsx", "demo-named.tsx", "demo-interactive.tsx"]) {
  const demo = readFileSync(new URL(file, dir), "utf8")
  assert.ok(
    demo.includes('from "@/components/ui/pinboard-portfolio-hero"'),
    `${file} must import the installed path`,
  )
  assert.doesNotMatch(demo, /\bh-full\b/, `${file}: no h-full`)
}


console.log("pinboard-portfolio-hero: ok")
