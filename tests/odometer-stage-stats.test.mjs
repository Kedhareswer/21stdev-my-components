// Checks for components/odometer-stage-stats.
// Run: node tests/odometer-stage-stats.test.mjs
//
// The figure parsing, scroll stepping and roll maths live in the .tsx so the
// published component stays one file; the marked region is lifted out and run
// (with the glyph table it reads). The rest are the install-safety rules: a root
// with a definite height, CSS that cannot leak into the host page, Preflight
// guards on the SVG numerals, reduced motion and a stoppable autoplay.
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

const src = readFileSync(new URL("../components/odometer-stage-stats/odometer-stage-stats.tsx", import.meta.url), "utf8")

// #region logic
const start = src.indexOf("// #region logic")
const end = src.indexOf("// #endregion logic")
assert.ok(start > -1 && end > start, "logic region markers missing")
const six = src.match(/const BOWL_SIX = "[^"]+"/)[0] + "\n" + src.match(/const STROKE = \d+/)[0]
const gStart = src.indexOf("const GLYPHS: { [k: string]: Glyph } = {")
assert.ok(gStart > -1, "glyph table not found")
const glyphs = src.slice(gStart, src.indexOf("\n}\n", gStart) + 2).replace(": { [k: string]: Glyph }", "")
const js = (six + "\n" + glyphs + "\n" + src.slice(start, end))
  .replace(": { [k: string]: string } =", " =")
  .replace(/\(stat: \{[^}]*\}\)/g, "(stat)")
  .replace(/\): (string\[\]|boolean|number|string) \{/g, ") {")
  .replace(/(\w+): (string\[\]|number|string)(?=[,)])/g, "$1")
  .replace("const out: string[] = []", "const out = []")
  .replace("const out: string[] = []", "const out = []")
const m = await import("data:text/javascript," + encodeURIComponent(js + "\nexport { GLYPHS, STROKE }"))

// Figures: aliases map onto the drawn set, anything else is kept for the text fallback.
assert.deepEqual(m.parseValue("4.2x"), ["4", ".", "2", "×"])
assert.deepEqual(m.parseValue("12k"), ["1", "2", "K"])
assert.deepEqual(m.parseValue("$2.4B"), ["$", "2", ".", "4", "B"])
assert.deepEqual(m.parseValue("−3"), ["-", "3"])
assert.deepEqual(m.parseValue("9₩"), ["9", "₩"])
for (const ch of "0123456789.,%+×-/$€£¥₹KMB") assert.ok(m.isDrawn(ch), "glyph missing: " + ch)
assert.equal(m.isDrawn("₩"), false)

// Width in ems of the cap height drives the fit-to-width size.
assert.equal(m.figureEm(["9", "6"]), m.GLYPHS["9"].w / 200 + m.GLYPHS["6"].w / 200 + m.GAP_EM)
assert.ok(m.figureEm(m.parseValue("$2.4B")) > m.figureEm(m.parseValue("96")))
assert.ok(m.figureEm([]) > 0, "an empty figure must not divide by zero")

// Scroll stepping: equal stretches, clamped at both ends.
assert.equal(m.stepFromProgress(0, 4), 0)
assert.equal(m.stepFromProgress(0.249, 4), 0)
assert.equal(m.stepFromProgress(0.25, 4), 1)
assert.equal(m.stepFromProgress(1, 4), 3)
assert.equal(m.stepFromProgress(-2, 4), 0)
assert.equal(m.stepFromProgress(3, 4), 3)
assert.equal(m.stepFromProgress(0.7, 1), 0)
assert.equal(m.progressWithin(0.375, 4), 0.5)
assert.equal(m.progressWithin(1, 4), 1)
// Jumping to a stat lands inside its own stretch, never on a boundary.
for (const n of [1, 2, 3, 4, 7]) for (let i = 0; i < n; i++) assert.equal(m.stepFromProgress(m.anchorFraction(i, n), n), i, `anchor ${i}/${n}`)

// The roll: digits spin through the ones before them, in order, and land on themselves;
// symbols do not spin.
for (let d = 0; d < 10; d++) {
  for (const pos of [0, 1, 2]) {
    const s = m.rollStrip(String(d), pos)
    assert.equal(s[s.length - 1], String(d))
    assert.ok(s.length >= 3, "a digit must spin")
    assert.ok(s.slice(0, -1).every((x) => x !== String(d)), "no spin digit repeats the target")
    for (let k = 1; k < s.length; k++) assert.equal((Number(s[k - 1]) + 1) % 10, Number(s[k]), "consecutive, like a wheel")
  }
}
assert.deepEqual(m.rollStrip("%", 0), ["%"])
assert.deepEqual(m.rollStrip(".", 3), ["."])

assert.equal(m.backdropWord({ label: "brands launched since 2014" }), "brands")
assert.equal(m.backdropWord({ label: "x", word: "" }), "", "an empty word turns the backdrop off")
assert.equal(m.backdropWord({ label: "“Teams” here" }), "Teams")
assert.equal(m.spoken({ value: "96", label: "brands" }), "96 brands")
assert.equal(m.spoken({ value: "96", label: { node: true }, alt: "96 brands launched" }), "96 brands launched")
assert.equal(m.spoken({ value: "96", label: { node: true } }), "96")
assert.equal(m.backdropWord({ label: { node: true } }), "", "a node label has no backdrop word unless one is given")
assert.equal(m.pad2(4), "04")
assert.equal(m.wrap(-1, 4), 3)
assert.equal(m.wrap(2, 0), 0)

// Glyph paths are plain path data, and no stroke edge leaves its glyph's width
// anywhere between the cap line and the baseline (the box clips the top and
// bottom on purpose; a cut at the side reads as a broken glyph).
function edges(d, stroke) {
  const tk = d.match(/[MLHVCAZ]|-?\d*\.?\d+/g)
  let i = 0, x = 0, y = 0, sx = 0, sy = 0, cmd = ""
  const pts = []
  const num = () => Number(tk[i++])
  const seg = (f, steps) => { for (let k = 0; k <= steps; k++) pts.push(f(k / steps)) }
  while (i < tk.length) {
    if (/[A-Z]/.test(tk[i])) cmd = tk[i++]
    if (cmd === "M") { x = sx = num(); y = sy = num(); cmd = "L"; continue }
    let x2, y2
    if (cmd === "L" || cmd === "H" || cmd === "V" || cmd === "Z") {
      if (cmd === "L") { x2 = num(); y2 = num() } else if (cmd === "H") { x2 = num(); y2 = y } else if (cmd === "V") { x2 = x; y2 = num() } else { x2 = sx; y2 = sy }
      const [ax, ay] = [x, y]
      seg((t) => [ax + (x2 - ax) * t, ay + (y2 - ay) * t, x2 - ax, y2 - ay], 20)
    } else if (cmd === "C") {
      const P = [[x, y], [num(), num()], [num(), num()], [num(), num()]]
      seg((t) => {
        const u = 1 - t
        const px = u * u * u * P[0][0] + 3 * u * u * t * P[1][0] + 3 * u * t * t * P[2][0] + t * t * t * P[3][0]
        const py = u * u * u * P[0][1] + 3 * u * u * t * P[1][1] + 3 * u * t * t * P[2][1] + t * t * t * P[3][1]
        const tx = 3 * u * u * (P[1][0] - P[0][0]) + 6 * u * t * (P[2][0] - P[1][0]) + 3 * t * t * (P[3][0] - P[2][0])
        const ty = 3 * u * u * (P[1][1] - P[0][1]) + 6 * u * t * (P[2][1] - P[1][1]) + 3 * t * t * (P[3][1] - P[2][1])
        return [px, py, tx, ty]
      }, 40)
      x2 = P[3][0]; y2 = P[3][1]
    } else if (cmd === "A") {
      let rx = num(), ry = num(); num(); const fa = num(), fs = num(); x2 = num(); y2 = num()
      const dx = (x - x2) / 2, dy = (y - y2) / 2
      const lam = (dx * dx) / (rx * rx) + (dy * dy) / (ry * ry)
      if (lam > 1) { rx *= Math.sqrt(lam); ry *= Math.sqrt(lam) }
      let co = Math.sqrt(Math.max(0, (rx * rx * ry * ry - rx * rx * dy * dy - ry * ry * dx * dx) / (rx * rx * dy * dy + ry * ry * dx * dx)))
      if (fa === fs) co = -co
      const cxp = (co * rx * dy) / ry, cyp = (-co * ry * dx) / rx
      const cx = cxp + (x + x2) / 2, cy = cyp + (y + y2) / 2
      const ang = (ux, uy, vx, vy) => Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy)
      const t1 = ang(1, 0, (dx - cxp) / rx, (dy - cyp) / ry)
      let dt = ang((dx - cxp) / rx, (dy - cyp) / ry, (-dx - cxp) / rx, (-dy - cyp) / ry)
      if (!fs && dt > 0) dt -= 2 * Math.PI
      else if (fs && dt < 0) dt += 2 * Math.PI
      seg((t) => { const a = t1 + dt * t; return [cx + rx * Math.cos(a), cy + ry * Math.sin(a), -rx * Math.sin(a) * Math.sign(dt), ry * Math.cos(a) * Math.sign(dt)] }, 60)
    } else throw new Error("unexpected path command " + cmd)
    x = x2; y = y2
  }
  const out = []
  for (const [px, py, tx, ty] of pts) {
    const len = Math.hypot(tx, ty) || 1
    for (const sg of [-1, 1]) out.push([px - (sg * ty * stroke) / 2 / len, py + (sg * tx * stroke) / 2 / len])
  }
  return out
}
for (const [k, g] of Object.entries(m.GLYPHS)) {
  assert.ok(g.w > 0, "glyph width: " + k)
  const floor = k === "," ? 240 : 200
  for (const [d, sw] of [[g.d, g.s || m.STROKE], [g.d2, g.s2 || m.STROKE]]) {
    if (!d) continue
    assert.match(d, /^[MLHVCAZ0-9.\s-]+$/, "path data: " + k)
    for (let [ex, ey] of edges(d, sw)) {
      if (g.rot) { ex = g.w - ex; ey = 200 - ey }
      if (ey < 0.5 || ey > floor - 0.5) continue
      assert.ok(ex >= -0.5 && ex <= g.w + 0.5, `glyph ${k} pokes out of its width at (${ex.toFixed(1)}, ${ey.toFixed(1)})`)
    }
  }
}
// Bars end flush with the stem they meet: the 4's crossbar stops at the stem's outer edge.
const four = m.GLYPHS["4"]
assert.equal(Number(four.d.match(/^M([\d.]+) 0V200/)[1]) + m.STROKE / 2, four.w)
assert.ok(four.d.endsWith("H" + four.w))
// The check has teeth: the first draft's B ran past its box.
assert.throws(() => {
  for (const [ex, ey] of edges("M17 0V200M0 17H56A39.5 39.5 0 0 1 56 96H17M17 96H57A43.5 43.5 0 0 1 57 183H0", 34)) if (ey > 0.5 && ey < 199.5) assert.ok(ex <= 114.5)
})
// #endregion

// A root that inherits its height renders here and collapses once installed.
assert.ok(src.includes('height = "100svh"'), "stage height must default to a definite length")
assert.ok(src.includes('step = "80svh"'), "scroll distance must default to a definite length")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full anywhere")
assert.doesNotMatch(src, /height: ["']?100%/, "no percentage heights on the stage")

// 21st ships this file alone; the CSS must not reach the host page.
const css = src.slice(src.indexOf("const css = `") + 13, src.indexOf("`", src.indexOf("const css = `") + 13))
assert.ok(css.length > 2000, "css block not found")
const narrow = src.slice(src.indexOf("const narrowCss = `") + 19, src.indexOf("`", src.indexOf("const narrowCss = `") + 19))
assert.ok(narrow.length > 300, "narrow css block not found")
for (const block of [css, narrow]) {
  assert.doesNotMatch(block, /@import/, "no @import")
  assert.doesNotMatch(block, /\$\{/, "no template expressions in the CSS")
  for (const line of block.split("\n")) {
    if (!line.includes("{")) continue
    const sel = line.split("{")[0].trim()
    if (!sel || sel.startsWith("@") || sel.startsWith("}") || /^(from|to|\d+%)$/.test(sel)) continue
    for (const part of sel.split(",")) assert.ok(/^(\.dark )?\.ost/.test(part.trim()), "unscoped selector: " + part.trim())
  }
}
assert.ok(narrow.includes("@container (max-width: 760px)"), "the phone layout follows the component's own width")
assert.ok(css.includes("container-type: size"), "the stage is the size container")

// Tailwind Preflight's max-width must not squeeze the SVG numerals.
assert.ok(css.includes(".ost svg { max-width: none; }") && src.includes('maxWidth: "none"'), "numerals need a max-width escape")
assert.ok(/width=\{g\.w\}/.test(src) && /height=\{240\}/.test(src), "numerals need explicit dimensions")

// The cells clip at the cap height (so a spinning digit never spills over the label) but not
// at the sides, so a wide digit passing through a narrow cell (a 4 through a 1) stays whole.
const cell = css.slice(css.indexOf(".ost-cell {"), css.indexOf("}", css.indexOf(".ost-cell {")))
assert.ok(cell.includes("clip-path: inset(-0.16em -0.12em)"), "cells clip a little past the cap line and the baseline")
assert.ok(cell.includes("mask-image: linear-gradient(transparent, #000 0.16em, #000 calc(100% - 0.16em), transparent)"), "rolling digits fade at the cell edges")
assert.ok(cell.includes("mask-position: 0 -0.16em"), "the fade sits outside the cell, so a landed glyph is fully opaque")
const pitch = Number(src.match(/const PITCH = ([\d.]+)/)[1])
assert.ok(pitch - 1 > 0.16, "a landed digit's neighbours must sit beyond the edge fade, or their feet show above it")
assert.ok(css.includes(".ost-slot { display: flex; justify-content: center; height: " + pitch + "em; }"), "slot height matches PITCH")
const widest = Math.max(...[..."0123456789"].map((d) => m.GLYPHS[d].w))
const narrowest = Math.min(...[..."0123456789"].map((d) => m.GLYPHS[d].w))
assert.ok((widest - narrowest) / 2 / 200 <= 0.12, "a passing digit must fit inside the side allowance")

// Motion is not optional, and autoplay can be stopped.
assert.ok(css.includes("@media (prefers-reduced-motion: reduce)"), "must honour prefers-reduced-motion")
assert.ok(src.includes('matchMedia("(prefers-reduced-motion: reduce)")'), "reduced motion also skips the roll in JS")
assert.ok(src.includes('"Pause stats"'), "autoplay needs a pause control")
assert.ok(src.includes('document.visibilityState === "hidden"'), "autoplay must stop in a hidden tab")

// Screen readers get each stat once, as text, not the rolling glyphs.
assert.ok(src.includes('aria-live="polite"'), "stat changes are announced")
assert.ok(src.includes('className="ost-figure"') && /className="ost-figure"[\s\S]{0,200}aria-hidden="true"/.test(src), "the drawn figure is hidden from screen readers")
assert.ok(src.includes("<dl className=\"ost-sr\">"), "every stat is in the DOM as text")

// No network: no web fonts, no remote images.
for (const url of src.match(/https?:\/\/[^"'\s)]+/g) || []) assert.ok(url.startsWith("http://www.w3.org/2000/svg"), "unexpected host: " + url)

// 21st's parser: no TypeScript generics before the first JSX close tag.
const head = src.slice(0, src.indexOf("</"))
assert.doesNotMatch(head, /use(State|Ref|Memo|Callback)<|Partial<|Record<|Array<|Map<|React\.[A-Za-z]+<|\[K in /, "generic before first JSX")

console.log("odometer-stage-stats: ok")
