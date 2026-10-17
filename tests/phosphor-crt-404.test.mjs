// Install-safety, wiring and scene-layout check for components/phosphor-crt-404.
// Run: node tests/phosphor-crt-404.test.mjs
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const src = readFileSync(new URL("../components/phosphor-crt-404/phosphor-crt-404.tsx", import.meta.url), "utf8")

// 21st ships this file alone.
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "the only import may be react")
assert.ok(/height = "100svh"/.test(src), "root height must default to a definite length")
assert.doesNotMatch(src, /<section[^>]*className={"[^"]*\bh-full\b/, "no h-full on the root")
assert.doesNotMatch(src, /@import/, "no @import")
assert.doesNotMatch(src, /https?:\/\/(?!21st)/, "nothing is fetched: every glyph and sprite is in the file")

// The 21st CLI hangs on generics before the first JSX tag.
const head = src.slice(0, src.indexOf("</"))
assert.doesNotMatch(head, /use(State|Ref|Memo|Callback)<|Partial<|Record<|Array<|Map<|React\.[A-Za-z]+<|\[K in /, "no generics before the JSX")

// Scoped CSS only: no bare resets, no template syntax inside the string.
const css = src.slice(src.indexOf("const CSS ="), src.indexOf("let audio"))
assert.doesNotMatch(css, /(^|[}"])\s*(\*|body|:root|html)\s*\{/, "no bare resets")
assert.doesNotMatch(css, /`|\$\{/, "no backticks or ${ in the CSS")
assert.ok(css.includes("prefers-reduced-motion:reduce"), "CSS animations must stop for reduced motion")
for (const sel of css.match(/\.[a-z][\w-]*\{/g) || []) assert.ok(sel.startsWith(".p4c-"), `unscoped selector ${sel}`)

// Runtime rules.
assert.ok(src.includes("Math.min(window.devicePixelRatio || 1, 2)"), "cap DPR at 2")
assert.ok(src.includes("document.hidden") && src.includes("IntersectionObserver"), "pause off-screen and in hidden tabs")
assert.ok(src.includes('maxWidth: "none"'), "guard Preflight on the canvases")
assert.ok(src.includes("const t = reduced ? 1.3"), "reduced motion freezes the clock")
assert.ok(src.includes("applySignal(scene, out, reduced ? 0 : strength"), "reduced motion: no static")
assert.ok(src.includes("href={homeHref}") && src.includes('className="sr-only">{homeLabel}'), "the way home is a real, labelled link")
assert.ok(src.includes('aria-live="polite"'), "channel changes are announced")
assert.ok(src.includes('closest("a, button")'), "clicks on the link and buttons must not retune")
for (const gone of [
  "cancelAnimationFrame(raf)", "ro.disconnect()", "io.disconnect()",
  'removeEventListener("pointermove", onMove)', 'removeEventListener("pointerleave", onLeave)',
  'mq.removeEventListener("change", onMotion)',
]) assert.ok(src.includes(gone), `cleanup is missing ${gone}`)

// The real logic, lifted out of the component.
const start = src.indexOf("// #region screen")
const end = src.indexOf("// #endregion", start)
assert.ok(start > -1 && end > start, "screen region markers missing")
const names = "COLS, ROWS, bayer, ditherTone, normalizeText, textWidth, hexToRgb, toneRamp, layoutScene, codeScale, composeScene, applySignal, staticEnvelope, osdLabel"
const m = await import(
  "data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(src.slice(start, end)).replace(/^export /gm, "") + "\nexport { " + names + " }")
)
const { COLS, ROWS } = m

// Text: upper-cased, undrawable characters dropped, clamped.
assert.equal(m.normalizeText("Page  not found ✨", 24), "PAGE NOT FOUND")
assert.equal(m.normalizeText("abcdefghijklmnopqrstuvwxyz", 5), "ABCDE")
assert.equal(m.normalizeText(undefined, 10), "")
assert.equal(m.textWidth("ABC"), 17)
assert.equal(m.textWidth(""), 0)

// Dither thresholds cover [0, 1) evenly; whole tones pass through unchanged.
{
  const seen = new Set()
  for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) seen.add(m.bayer(x, y))
  assert.equal(seen.size, 16)
  for (const v of seen) assert.ok(v > 0 && v < 1)
  for (let tone = 0; tone <= 4; tone++) assert.equal(m.ditherTone(tone, 3, 1), tone)
  assert.equal(m.ditherTone(9, 0, 0), 4)
  assert.equal(m.ditherTone(-3, 0, 0), 0)
}

// Colours.
assert.deepEqual(m.hexToRgb("#fff"), [255, 255, 255])
assert.deepEqual(m.hexToRgb("#ff8fab"), [255, 143, 171])
assert.deepEqual(m.hexToRgb("nope"), [255, 143, 171], "junk falls back to the default pink")
{
  const { tones, glass } = m.toneRamp("#ff8fab")
  assert.equal(tones.length, 5)
  const lum = (c) => c[0] * 0.3 + c[1] * 0.59 + c[2] * 0.11
  for (let i = 1; i < 5; i++) assert.ok(lum(tones[i]) > lum(tones[i - 1]), "tones must climb")
  assert.ok(lum(glass) < lum(tones[0]), "the glass sits below an unlit dot")
}

// The big code always fits the screen.
for (const code of ["4", "404", "5000", "40404"]) {
  const s = m.codeScale(code)
  assert.ok(s >= 1 && code.length * 7 * s + (code.length - 1) * (s + 2) <= 150, `code ${code} overflows`)
}
assert.equal(m.codeScale("404"), 4)

// The pyramid always holds its label, and the link sits on it.
for (const label of ["HOME", "TAKE ME HOME", "BACK TO THE START!", "X"]) {
  const L = m.layoutScene(label)
  const { topY, baseY, topW, baseW } = L.mountain
  const f = (L.label.y + 3 - topY) / (baseY - topY)
  const widthAtLabel = topW + (baseW - topW) * f
  assert.ok(widthAtLabel >= L.label.w + 12, `"${label}" spills off the pyramid`)
  assert.ok(L.label.x >= 0 && L.label.x + L.label.w <= COLS)
  assert.ok(baseW <= COLS && topW <= baseW)
  assert.ok(L.hit.x <= L.label.x && L.hit.x + L.hit.w >= L.label.x + L.label.w, "hit area covers the label")
  assert.ok(L.hit.y <= L.label.y && L.hit.y + L.hit.h >= L.label.y + 7)
  assert.equal(L.label.text, label)
}

// Composition: deterministic, in range, lit where it should be.
const scene = (over = {}) => ({
  t: 1.3, code: "404", eyebrow: "PAGE NOT FOUND", message: "SIGNAL LOST", label: "TAKE ME HOME",
  hover: 0, px: 0, py: 0, osd: "", ...over,
})
{
  const L = m.layoutScene("TAKE ME HOME")
  const a = new Uint8Array(COLS * ROWS)
  const b = new Uint8Array(COLS * ROWS)
  m.composeScene(a, scene(), L)
  m.composeScene(b, scene(), L)
  assert.deepEqual(a, b, "same scene, same frame")
  assert.ok(a.every((v) => v >= 0 && v <= 4), "tone out of range")
  const lit = a.filter((v) => v > 0).length / a.length
  assert.ok(lit > 0.2 && lit < 0.7, `odd amount of light: ${lit}`)

  // The label is dark type on a lit face.
  const { x, y } = L.label
  let dark = 0
  for (let r = 0; r < 7; r++) for (let c = 0; c < L.label.w; c++) if (a[(y + r) * COLS + x + c] === 0) dark++
  assert.ok(dark > 40, "the label must be cut out of the pyramid")

  // Hover lights the pyramid.
  const h = new Uint8Array(COLS * ROWS)
  m.composeScene(h, scene({ hover: 1 }), L)
  const sum = (buf) => { let s = 0; for (let i = 105 * COLS; i < 140 * COLS; i++) s += buf[i]; return s }
  assert.ok(sum(h) > sum(a) * 1.08, "hover must brighten the pyramid")

  // The OSD draws, the message changes the frame, time moves things.
  const o = new Uint8Array(COLS * ROWS)
  m.composeScene(o, scene({ osd: m.osdLabel(4) }), L)
  assert.notDeepEqual(o, a)
  m.composeScene(o, scene({ message: "TRY ANOTHER CHANNEL" }), L)
  assert.notDeepEqual(o, a)
  m.composeScene(o, scene({ t: 4.2 }), L)
  assert.notDeepEqual(o, a, "nothing animates")

  // Signal: identity at rest, noisy at full strength, always in range.
  const out = new Uint8Array(COLS * ROWS)
  m.applySignal(a, out, 0, 1, 7)
  assert.deepEqual(out, a, "strength 0 must pass the picture through")
  m.applySignal(a, out, 1, 1, 7)
  let changed = 0
  for (let i = 0; i < a.length; i++) if (out[i] !== a[i]) changed++
  assert.ok(changed / a.length > 0.4, "full static must bury the picture")
  assert.ok(out.every((v) => v >= 0 && v <= 4))
}

// Static envelope: rises fast, settles to nothing.
assert.equal(m.staticEnvelope(-0.1), 0)
assert.equal(m.staticEnvelope(1), 0)
assert.equal(m.staticEnvelope(0.15), 1)
assert.ok(m.staticEnvelope(0.05) < m.staticEnvelope(0.1))
assert.ok(m.staticEnvelope(0.6) > m.staticEnvelope(0.9))

assert.equal(m.osdLabel(4), "CH 04")
assert.equal(m.osdLabel(104), "CH 04", "channels wrap at 100")
assert.equal(m.osdLabel(-1), "CH 99")

console.log("phosphor-crt-404: ok")
