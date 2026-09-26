// Install-safety, wiring and pixel-math check for components/pixel-portal-404.
// Run: node tests/pixel-portal-404.test.mjs
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const src = readFileSync(new URL("../components/pixel-portal-404/pixel-portal-404.tsx", import.meta.url), "utf8")

// 21st ships this file alone: no fonts, images or packages to fetch.
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "the only import may be react")
assert.doesNotMatch(src, /@import|url\(|https?:\/\//, "no external assets — the art is drawn, not fetched")

assert.ok(src.includes('height = "100svh"'), "root height must default to a definite length")
assert.doesNotMatch(src, /<section[\s\S]{0,200}className={"relative w-full[^"]*\bh-full\b/, "no h-full on the root")
assert.ok(src.includes('imageRendering: "pixelated"') && src.includes('maxWidth: "none"'), "canvas must stay crisp and escape Preflight")

// The door is a real link, and plays the fly-through before leaving.
assert.ok(/<a\s+href={href}\s+aria-label={linkLabel}/.test(src), "the door must be a real, labelled link")
assert.ok(src.includes("e.metaKey || e.ctrlKey || e.shiftKey || e.altKey"), "modified clicks must fall through to the browser")
assert.ok(src.includes("window.location.assign(to)") && src.includes("if (cb) {"), "onEnter replaces navigation, href is the fallback")
assert.ok(src.includes('onFocus={() => setHover(true)}'), "keyboard focus must light the door like hover does")

// Runtime rules.
assert.ok(src.includes("prefers-reduced-motion: reduce"), "honour reduced motion")
assert.ok(src.includes('"visibilitychange"') && src.includes("document.hidden"), "pause while the tab is hidden")
assert.ok(src.includes("IntersectionObserver"), "pause while scrolled away")
for (const gone of ["ro.disconnect()", "io.disconnect()", "cancelAnimationFrame(raf)", 'removeEventListener("pointermove", onMove)', "clearTimeout"]) {
  assert.ok(src.includes(gone), `cleanup is missing ${gone}`)
}

// The real logic, lifted out of the component.
const start = src.indexOf("// #region pixels")
const end = src.indexOf("// #endregion", start)
assert.ok(start > -1 && end > start, "pixels region markers missing")
const m = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(src.slice(start, end))))

// Every glyph is 5 wide and at most 9 tall; every default caption is drawable.
for (const [ch, g] of Object.entries(m.FONT)) {
  const rows = g.split("|")
  assert.ok(rows.length <= 9 && rows.every((r) => /^[.#]{5}$/.test(r)), `bad glyph ${JSON.stringify(ch)}`)
}
for (const [ch, g] of Object.entries(m.BIG)) {
  const rows = g.split("|")
  assert.ok(rows.length === 7 && rows.every((r) => /^[.#]{5}$/.test(r)), `bad numeral ${ch}`)
}
for (const text of ["Are you ready to come back?", "Step through the door.", "The stars are rebooting. Wait here?"]) {
  for (const ch of text) if (ch !== " ") assert.ok(m.FONT[ch], `font is missing ${JSON.stringify(ch)}`)
}
assert.deepEqual(m.glyph(" "), [], "space draws nothing")
assert.deepEqual(m.glyph("é"), m.glyph("?"), "unknown characters fall back to ?")

// Stone numerals: every block joins its neighbours edge-on, or the outline splits them.
for (const [ch, g] of Object.entries(m.BIG)) {
  const rows = g.split("|")
  const on = (c, r) => rows[r]?.[c] === "#"
  const cells = []
  rows.forEach((row, r) => [...row].forEach((v, c) => v === "#" && cells.push([c, r])))
  const seen = new Set([cells[0].join()])
  const queue = [cells[0]]
  while (queue.length) {
    const [c, r] = queue.pop()
    for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const k = [c + dc, r + dr].join()
      if (on(c + dc, r + dr) && !seen.has(k)) seen.add(k), queue.push([c + dc, r + dr])
    }
  }
  assert.equal(seen.size, cells.length, `numeral ${ch} has detached blocks`)
}
{
  const d = m.digitMask("4")
  assert.equal(d.w, 35)
  assert.equal(d.h, 49)
  assert.equal(d.data[0 * d.w + 2], 2, "the 4's upright is fluted")
  assert.equal(d.data[3 * 7 * d.w + 10], 1, "the crossbar is not")
  assert.equal(d.data[0 * d.w + 10], 0, "the 4 is open at the top")
}

// Arch: symmetric, the doorway sits inside it and never overlaps the stone.
{
  const a = m.archMask()
  assert.equal(a.w, m.ARCH_W + 2)
  for (let y = 0; y < a.h; y++) {
    for (let x = 0; x < a.w; x++) {
      assert.equal(!!a.data[y * a.w + x], !!a.data[y * a.w + (a.w - 1 - x)], `arch not symmetric at ${x},${y}`)
      // Capitals and bases project a pixel over the opening; stone is drawn on top.
      const ledge = [20, 21, 55, 56, 57].includes(y - 1)
      if (!ledge && m.insideDoor(x - 1, y - 1)) assert.equal(a.data[y * a.w + x], 0, `door overlaps stone at ${x},${y}`)
    }
  }
  assert.ok(m.insideDoor(20, 10) && m.insideDoor(20, 57), "door runs from the arch crown to the threshold")
  assert.ok(!m.insideDoor(2, 30) && !m.insideDoor(20, 58), "door stays between the columns and above the threshold")

  const shaded = m.shadeMask(a, 3)
  const W = a.w + 2
  assert.equal(shaded.length, W * (a.h + 2), "shading adds a 1px outline ring")
  assert.equal(shaded[0], 0, "corners stay clear")
  assert.ok(shaded.includes(1) && shaded.includes(8) && shaded.includes(2) && shaded.includes(4), "outline, highlight, shadow and flutes all present")
}

// Pixel circles.
assert.deepEqual(m.circleSpans(0), [0])
assert.deepEqual(m.circleSpans(2), [1, 2, 2, 2, 1])
assert.equal(m.circleSpans(7).length, 15)

// Text wrapping never exceeds the line, and never drops words.
{
  const text = "Are you ready to come back? Supercalifragilistic door."
  for (const n of [4, 8, 12, 30]) {
    const lines = m.wrapText(text, n)
    assert.ok(lines.every((l) => l.length <= n), `line over ${n}`)
    assert.equal(lines.join("").replace(/\s/g, ""), text.replace(/\s/g, ""), `text lost at ${n}`)
  }
  assert.deepEqual(m.wrapText("a\nb", 10), ["a", "b"], "explicit line breaks are kept")
}

// Layout: integer art pixels, the 404 fits, the caption sits under the cloud.
for (const [w, h] of [[1280, 800], [1920, 1080], [390, 844], [768, 1024], [320, 568], [1440, 600]]) {
  const L = m.layoutScene(w, h)
  assert.ok(Number.isInteger(L.px) && L.px >= 1, `px at ${w}x${h}`)
  assert.ok(L.W * L.px >= w && L.H * L.px >= h, `canvas covers the root at ${w}x${h}`)
  assert.ok(L.leftX >= 0 && L.rightX + m.DIGIT_W <= L.W, `404 off-canvas at ${w}x${h}`)
  assert.ok(L.archTop >= 0, `arch clipped at ${w}x${h}`)
  assert.ok(L.captionY > L.archBottom + 10 && L.captionY + 9 <= L.H, `caption misplaced at ${w}x${h}`)
  assert.equal(L.archX + m.ARCH_W / 2, L.cx, "door is centred")
}

// Decorations slide out of the keep-out boxes, or give up.
{
  const box = { x: 40, y: 40, w: 40, h: 40 }
  assert.deepEqual(m.place(10, 10, 4, 200, [box]), [10, 10], "clear spots are left alone")
  const [x] = m.place(70, 60, 4, 200, [box])
  assert.ok(x - 4 > box.x + box.w, "pushed out the near side")
  assert.equal(m.place(20, 60, 4, 60, [{ x: 0, y: 40, w: 60, h: 40 }]), null, "no room means no decoration")
}

// Colour and noise helpers.
assert.deepEqual(m.hexRgb("#2a55c9"), [42, 85, 201])
assert.deepEqual(m.hexRgb("#fff"), [255, 255, 255])
assert.deepEqual(m.hexRgb("nope"), [0, 0, 0])
for (let i = 0; i < 200; i++) {
  const v = m.fbm(i * 0.37, i * 0.21, 5)
  assert.ok(v >= 0 && v <= 1, "fbm out of range")
}
const r1 = m.mulberry(404)
const r2 = m.mulberry(404)
assert.equal(r1(), r2(), "seeded random is deterministic")

console.log("pixel-portal-404: ok")
