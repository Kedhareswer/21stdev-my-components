// Install-safety, engraving, wreath and painter checks for
// components/biryani-legends-template.
// Run: node tests/biryani-legends-template.test.mjs
import assert from "node:assert/strict"
import { readFileSync, readdirSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const slug = "biryani-legends-template"
const root = new URL("../", import.meta.url)
const dir = new URL("components/" + slug + "/", root)
const src = readFileSync(new URL(slug + ".tsx", dir), "utf8").replace(/\r\n/g, "\n")
const pkg = JSON.parse(readFileSync(new URL("package.json", root), "utf8"))

// ---- install safety ------------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react", "gsap", "gsap/ScrollTrigger"], "only react and gsap")
assert.ok(pkg.dependencies?.gsap, "gsap is declared in the root package.json")
assert.match(src, /gsap\.registerPlugin\(ScrollTrigger\)/, "ScrollTrigger is registered")
assert.doesNotMatch(src, /pin:\s*true/, "no ScrollTrigger pinning: the stage is CSS-sticky")
assert.ok(src.includes("ctx.revert()"), "the scroll context is reverted on unmount")
assert.ok(src.includes('height = "100svh"') && src.includes('"--h": height'), "height defaults to a definite length and feeds --h")
assert.doesNotMatch(src, /className=["'][^"']*\bh-full\b/, "no h-full")
assert.doesNotMatch(src, /@import/, "no @import")
assert.ok(src.includes("{fontHref && <link rel=\"stylesheet\" href={fontHref} />}"), "fontHref null loads nothing")
assert.doesNotMatch(src.replace(/\/\/.*$/gm, "").replace(/const BL_FONTS =\s*"[^"]+"/, ""), /https?:\/\/(?!www\.w3\.org)/, "nothing else is fetched: the art is drawn and painted here")
assert.doesNotMatch(src, /console\./, "no debug logging ships")
for (const gone of ["ro.disconnect()", 'mq.removeEventListener("change", on)', 'window.removeEventListener("keydown", onKey)', 'stage.removeEventListener("touchend", onEnd)', "URL.revokeObjectURL(u)", "cancelAnimationFrame(raf)"])
  assert.ok(src.includes(gone), "cleanup is missing " + gone)
assert.doesNotMatch(
  src.slice(0, src.indexOf("</")),
  /use(State|Ref|Memo|Callback)<|Partial<|Record<|Array<|Map<|Exclude<|Omit<|React\.[A-Za-z]+<|\[K in /,
  "no generics before the first JSX close tag (the 21st CLI tokenizer hangs on them)",
)
const files = readdirSync(dir).sort()
assert.deepEqual(files, ["README.md", "biryani-legends-template.tsx", "demo-midnight.tsx", "demo-photos.tsx", "demo.tsx"], "folder holds only the component, demos and README")
// The photo demo embeds its images: 21st's capture refuses off-origin requests and rejects demo files over 200,000 bytes.
const photos = readFileSync(new URL("demo-photos.tsx", dir), "utf8")
assert.ok(Buffer.byteLength(photos) < 200_000, "demo-photos.tsx is " + Buffer.byteLength(photos) + " bytes, over 21st's 200,000")
assert.doesNotMatch(photos, /https?:\/\//, "demo-photos.tsx fetches nothing")
assert.equal((photos.match(/"data:image\/(avif|webp);base64,/g) || []).length, 7, "three pots, three plates and the paper are embedded")
for (const f of files.filter((f) => f.startsWith("demo"))) {
  const d = readFileSync(new URL(f, dir), "utf8")
  const di = [...d.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
  assert.deepEqual(di, ["@/components/ui/" + slug], f + ": imports only the component")
  assert.match(d, /className="w-full"/, f + ": full width inside 21st's flex wrapper")
}
assert.ok(readFileSync(new URL("tsconfig.json", root), "utf8").includes('"@/components/ui/' + slug + '"'), "tsconfig paths line exists")

// ---- scoped CSS: prefixed selectors, no resets, no template holes ----------------
const cssAll = [...src.matchAll(/const BL_[A-Z_]*CSS = `([\s\S]*?)`/g)].map((m) => m[1]).join("\n")
assert.ok(cssAll.length > 5000, "the CSS strings were found")
assert.doesNotMatch(cssAll, /\$\{/, "no ${ in the CSS strings")
const css = cssAll.replace(/\/\*[\s\S]*?\*\//g, "")
for (const m of css.matchAll(/(?<=^|[{}])\s*([^{}@]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (/^(from|to|[\d.]+%)/.test(sel)) continue
  for (const part of sel.split(",")) assert.match(part.trim(), /^\.bl-/, "unscoped selector: " + part)
}
assert.ok(css.includes("max-width:none"), "images and svgs are guarded against Preflight")
const rm = css.slice(css.indexOf("@media (prefers-reduced-motion:reduce)"))
for (const cls of ["bl-breathe", "bl-steam", "bl-fx-ship", "bl-fx-dhow", "bl-fx-sea", "bl-fx-smoke", "bl-foil"]) assert.ok(rm.includes("." + cls), "reduced motion forgets ." + cls)

// ---- the art region, executed ---------------------------------------------------
const a = src.indexOf("// #region art\n")
const b = src.indexOf("// #endregion", a)
assert.ok(a > -1 && b > a, "art region missing")
const L = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(src.slice(a, b))))

const r1 = L.blRng(7)
const r2 = L.blRng(7)
const seq = Array.from({ length: 200 }, () => r1())
assert.deepEqual(seq, Array.from({ length: 200 }, () => r2()), "same seed, same sequence")
assert.ok(seq.every((v) => v >= 0 && v < 1), "rng in [0, 1)")

// Hatching: parallel lines, all inside the shape.
const sq = [[0, 0], [100, 0], [100, 50], [0, 50]]
const lines = L.blHatch(sq, 0, 5)
assert.equal(lines.length, 10, "ten lines 5 apart through a 50-tall square")
for (const [p, q] of lines) {
  assert.ok(Math.abs(p[1] - q[1]) < 1e-9, "horizontal at angle 0")
  for (const pt of [p, q]) assert.ok(pt[0] >= -1e-9 && pt[0] <= 100 + 1e-9 && pt[1] >= 0 && pt[1] <= 50, "inside the polygon")
}
const vert = L.blHatch(sq, Math.PI / 2, 10)
assert.ok(vert.length === 10 && vert.every(([p, q]) => Math.abs(p[0] - q[0]) < 1e-6), "vertical at a quarter turn")

// The three engravings: deterministic, in bounds, and heavy enough to read as engravings.
for (const [name, fn, min] of [["harbour", L.blHarbour, 2500], ["fort", L.blFort, 1800], ["garden", L.blGarden, 1500]]) {
  const s1 = fn(3)
  assert.deepEqual(fn(3), s1, name + ": same seed, same plate")
  const inks = s1.layers.flatMap((l) => l.inks)
  assert.ok(inks.length >= min, name + ": " + inks.length + " lines")
  for (const k of inks) {
    assert.match(k.d, /^M-?[\d.]+ -?[\d.]+/, name + ": a path")
    assert.ok(k.x <= k.e + 1e-9, name + ": extent ordered")
    assert.ok(k.x > -120 && k.e < s1.w + 120, name + ": inside the plate")
    assert.ok(k.w > 0 && k.o > 0 && k.o <= 1, name + ": visible ink")
  }
  assert.ok(Object.keys(L.BL_SCENES).includes(name), name + " is selectable")
}
assert.ok(L.blHarbour(3).layers.some((l) => l.fx === "ship"), "the harbour has ships that sail")
assert.ok(L.blFort(3).layers.some((l) => l.fx === "smoke"), "the fort has smoke rising")
assert.ok(L.blGarden(3).layers.some((l) => l.fx === "jet"), "the garden has a fountain")

const wr = L.blWreath(11)
assert.ok(wr.length > 150 && wr.every((k) => /^M/.test(k.d)), "the wreath is line art")

// The painter: draws onto a canvas-shaped object without throwing, for every vessel.
const calls = { ellipse: 0, fill: 0 }
const grad = { addColorStop() {} }
const ctx = new Proxy({}, {
  get(_, k) {
    if (k === "createConicGradient" || k === "createRadialGradient" || k === "createLinearGradient") return () => grad
    if (k === "ellipse") return () => calls.ellipse++
    if (k === "fill") return () => calls.fill++
    return () => {}
  },
  set() { return true },
})
for (const [v, rice] of [["brass", "jeerakasala"], ["clay", "seeraga"], ["enamel", "basmati"]]) {
  const before = calls.ellipse
  L.blPaintDish(ctx, 600, v, rice, 4)
  assert.ok(calls.ellipse - before > 6000, v + ": thousands of grains (" + (calls.ellipse - before) + ")")
}
assert.ok(L.blVesselSpec("clay").food < L.blVesselSpec("clay").lip, "rice sits inside the lip")

// ---- layouts and data -----------------------------------------------------------
for (const lay of ["shore", "summit", "terrace"]) assert.ok(src.includes(lay + ": {"), "layout " + lay)
const legends = src.slice(src.indexOf("export const BL_LEGENDS"), src.indexOf("const BL_COLUMNS"))
for (const n of ["Faiza Abdulla", "K. Selvarajan", "Sonia Singh"]) assert.ok(legends.includes('name: "' + n + '"'), n + " is in the book")
assert.ok(src.includes("engravingImage") && src.includes("dish?.src") && src.includes("paperTexture"), "real images can replace the drawn art")

console.log(slug + ": ok")
