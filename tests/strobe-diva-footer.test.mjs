// Install-safety and copier/wheel checks for strobe-diva-footer.
// Run: node tests/strobe-diva-footer.test.mjs
//
// What breaks silently here: a backdrop key that eats light parts of the
// subject, a rim that grows the wrong way, a real arm that tears off the body
// when the wheel turns, springs that never come to rest (the loop never
// sleeps), and a wordmark fit that stretches a short word into a caricature.
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const dir = new URL("../components/strobe-diva-footer/", import.meta.url)
const read = (f) => readFileSync(new URL(f, dir), "utf8").replace(/\r\n/g, "\n")
const src = read("strobe-diva-footer.tsx")

// ---- install safety ----
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "react is the only import")
assert.doesNotMatch(src, /@import/, "no CSS imports")
const hosts = [...src.matchAll(/https?:\/\/([^/"'\s]+)/g)].map((m) => m[1])
assert.ok(hosts.every((h) => ["images.unsplash.com", "instagram.com", "tiktok.com", "pinterest.com"].includes(h)), "only the default photo host and link targets: " + hosts)
assert.match(src, /height = "100svh"/, "height defaults to a definite length")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")
assert.ok(src.includes("prefers-reduced-motion"), "honours reduced motion")
assert.ok(src.includes('im.crossOrigin = "anonymous"'), "the photo is loaded with CORS so its pixels can be read")
assert.ok(src.includes('onState("error")'), "a photo that fails falls back to the drawn figure")
assert.ok(/\.sdf-photo \{[^}]*max-width: none/.test(src), "the canvas is guarded against Preflight")
assert.ok(src.includes("new ResizeObserver") && src.includes("IntersectionObserver"), "resizes with its box and sleeps off-screen")
for (const gone of ["cancelAnimationFrame(s.raf)", "ro.disconnect()", "io.disconnect()", 'stage.removeEventListener("pointermove", onMove)', "clearTimeout(t)"]) {
  assert.ok(src.includes(gone), "cleanup is missing " + gone)
}
assert.ok(src.includes("<a href="), "links are real anchors")
assert.ok(src.includes('className="sdf-sr"'), "the wordmark is readable as text")
assert.doesNotMatch(src, /console\./, "no debug logging ships")
assert.doesNotMatch(
  src.slice(0, src.indexOf("</")),
  /use(State|Ref|Memo|Callback)<|Partial<|Record<|Array<|Map<|React\.[A-Za-z]+<|\[K in /,
  "no generics before the first JSX close tag (the 21st CLI tokenizer hangs on them)",
)
for (const f of ["demo.tsx", "demo-midnight.tsx"]) {
  const d = read(f)
  const di = [...d.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
  assert.deepEqual(di, ["@/components/ui/strobe-diva-footer"], f + ": imports only the component")
  assert.match(d, /className="w-full"/, f + ": full width inside 21st's flex wrapper")
}

// ---- scoped CSS ----
const css = src.match(/const SDF_CSS = `([\s\S]*?)`/)[1]
assert.doesNotMatch(css, /\$\{/, "no interpolation in the CSS string")
for (const m of css.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/(?<=^|[{}])\s*([^{}]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (sel.startsWith("@") || /^(from|to|[\d.]+%)/.test(sel)) continue
  assert.ok(sel.split(",").every((s) => s.trim().startsWith(".sdf")), "unscoped selector: " + sel)
}

// ---- the pure region ----
const a = src.indexOf("// #region strobe")
const b = src.indexOf("// #endregion", a)
assert.ok(a > -1 && b > a, "strobe region missing")
const L = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(src.slice(a, b))))

// springs settle, at any frame rate
for (const dt of [1 / 144, 1 / 60, 1 / 24]) {
  let s = [0, 0]
  for (let i = 0; i < 3000 && !L.settled(s[0], s[1], 40); i++) s = L.springStep(s[0], s[1], 40, L.stiffness(6), 0.72, dt / 3)
  assert.ok(L.settled(s[0], s[1], 40), "spring settles at dt " + dt)
}
assert.ok(L.stiffness(0) > L.stiffness(1) && L.stiffness(1) > L.stiffness(9), "outer echoes are softer: that is the trail")

// the wheel
assert.equal(L.armAngle(0, -1, 19, 1, 18, true), 0, "the real arm never leaves the body")
assert.equal(L.armAngle(3, -1, 19, 1, 0, true), -57, "left echoes open anticlockwise")
assert.equal(L.armAngle(3, 1, 19, 1, 0, true), 57, "right echoes open clockwise")
assert.equal(L.armAngle(3, -1, 19, 1, 0, false), 0, "closed echoes sit behind the real arm")
assert.equal(L.armAngle(2, -1, 19, 1, 10, true) - L.armAngle(2, -1, 19, 1, 0, true), 10, "the swing turns both sides the same way")
assert.equal(L.armAngle(2, 1, 19, 1, 10, true) - L.armAngle(2, 1, 19, 1, 0, true), 10)
assert.equal(L.armAngle(10, -1, 40, 2, -18, true), -165, "the fan is clamped")
assert.equal(L.echoScale(0, 1), 1)
assert.ok(L.echoScale(5, 1) > L.echoScale(2, 1), "each copy prints a little larger")
assert.equal(L.echoScale(5, 0), 1, "until it has opened")
const d = L.pointerDrive(1, 0)
assert.ok(d.swing === 18 && d.spread > 1, "pointer top-right turns clockwise and opens wide")
assert.equal(L.pointerDrive(0.5, 0.5).swing, 0)

// the copier
assert.deepEqual(L.hexRgb("#c9171e"), [201, 23, 30])
assert.deepEqual(L.hexRgb("#fff"), [255, 255, 255])
assert.equal(L.hexRgb("tomato"), null)
assert.ok(L.tone(0.9, 0.46, 11) > 0.98 && L.tone(0.1, 0.46, 11) < 0.03, "a steep curve: whites stay paper, blacks stay ink")
assert.ok(Math.abs(L.tone(0.46, 0.46, 11) - 0.5) < 1e-9)
for (let i = 0; i < 200; i++) {
  const g = L.grain(i * 3, i * 7, 2.8, 5)
  assert.ok(g >= 0 && g < 1, "grain stays in [0, 1)")
}
assert.equal(L.grain(10, 20, 2, 3), L.grain(10, 20, 2, 3), "grain is deterministic: no shimmer between reprints")

// backdrop key: a ring of subject around a light hole keeps the hole; a notch to the edge opens
{
  const w = 9
  const h = 9
  const lum = new Float32Array(w * h).fill(1)
  for (let y = 2; y <= 6; y++) for (let x = 2; x <= 6; x++) lum[y * w + x] = 0.2
  lum[4 * w + 4] = 1 // light inside the subject
  const m = L.keyMask(lum, w, h, true, 0.92)
  assert.equal(m[4 * w + 4], 1, "light enclosed by the subject is kept")
  assert.equal(m[0], 0, "the backdrop goes")
  assert.equal(m[3 * w + 3], 1, "the subject stays")
  for (let x = 4; x <= 6; x++) lum[4 * w + x] = 1 // a gap through to the outside, like a mesh cape
  lum[4 * w + 7] = 1
  const m2 = L.keyMask(lum, w, h, true, 0.92)
  assert.equal(m2[4 * w + 4], 0, "a gap that reaches the outside opens")
  const dark = L.keyMask(lum.map((v) => 1 - v), w, h, false, 0.08)
  assert.deepEqual([...dark], [...m2], "a dark backdrop keys the same way")
}
// rim grows outward by r and never shrinks the subject
{
  const w = 11
  const m = new Uint8Array(w * w)
  m[5 * w + 5] = 1
  const r = L.dilate(m, w, w, 2)
  assert.equal(r[5 * w + 5], 1)
  assert.equal(r[5 * w + 7], 1, "reaches r to the side")
  assert.equal(r[5 * w + 8], 0, "and no further")
  assert.equal(r.reduce((a, b) => a + b, 0), 25)
  assert.deepEqual([...L.dilate(m, w, w, 0)], [...m])
}

// barcode
const mods = L.barcodeModules("7736831210")
assert.equal(mods.length, 3 + 10 * 7 + 3, "guards plus seven modules per digit")
assert.ok(mods.startsWith("101") && mods.endsWith("101"))
assert.equal(L.barcodeModules("ab-"), "", "no digits, no bars")
assert.equal(L.barcodeBars("0110111").map((b) => b.w).join(), "2,3")

// type fit
assert.deepEqual(L.fitScale(0, 10, 100, 100), { sx: 0, sy: 0 })
const f = L.fitScale(500, 72, 1400, 300)
assert.ok(Math.abs(f.sx - 2.8) < 1e-9, "fills the width")
assert.ok(f.sy > f.sx && f.sy <= f.sx * 2.6, "stretched tall, within limits")
assert.equal(L.fitScale(100, 72, 1400, 30).sy, 14 * 0.8, "a squat band never squashes past 80%")

// layout: feet on the floor, the sun on the head, nothing wider than the stage
const box = L.figureBox(1440, 740, 0.35, 0.21, false)
assert.ok(Math.abs(box.top + box.F - 740) < 1e-9, "feet on the floor")
assert.ok(Math.abs(box.discTop + box.disc / 2 - (box.top + box.F * 0.21)) < 1e-9, "the sun centres on the head")
assert.ok(box.F <= 740 * 0.9 + 1e-9, "headroom for the wheel")
const phone = L.figureBox(375, 440, 0.35, 0.21, true)
assert.ok(phone.W <= 375 && phone.disc <= 375 * 0.9 + 1e-9, "fits a phone")
assert.equal(L.figureBox(0, 0, 0.35, 0.2, false).F, 0)

console.log("strobe-diva-footer: ok")
