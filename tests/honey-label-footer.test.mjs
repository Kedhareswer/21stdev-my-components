// Install-safety, scoped-CSS, meadow-geometry and EAN-13 checks for honey-label-footer.
// Run: node tests/honey-label-footer.test.mjs
import assert from "node:assert/strict"
import { readFileSync, readdirSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const dir = new URL("../components/honey-label-footer/", import.meta.url)
const read = (f) => readFileSync(new URL(f, dir), "utf8").replace(/\r\n/g, "\n")
const src = read("honey-label-footer.tsx")

// ---- install safety ----
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "react is the only import")
assert.doesNotMatch(src, /@import|url\(["']?(https?:|\/\/|data:)/, "nothing fetched")
assert.doesNotMatch(src, /<img|new Image\(|fetch\(/, "no images: the meadow is drawn")
assert.match(src, /height = "\d+px"/, "height defaults to a definite length")
assert.ok(src.includes("minHeight: height"), "and the footer grows past it")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")
assert.ok(src.includes("prefers-reduced-motion"), "honours reduced motion")
assert.ok(src.includes(".hlf-canvas { display: block; width: 100%; height: 420px; max-width: none; }"), "the canvas is guarded against Preflight")
assert.ok(src.includes("new ResizeObserver") && src.includes("IntersectionObserver"), "follows its box and sleeps off-screen")
for (const gone of ["cancelAnimationFrame(raf)", "ro.disconnect()", "io.disconnect()", "io2.disconnect()", "mo.disconnect()", 'root.removeEventListener("pointermove", onMove)', 'root.removeEventListener("pointerleave", onLeave)', 'document.removeEventListener("visibilitychange", onVis)']) {
  assert.ok(src.includes(gone), "cleanup is missing " + gone)
}
assert.ok(src.includes('<a className={className} href={link.href} style={style}>'), "links are real anchors")
assert.ok(src.includes('<a className="hlf-social" href={s.href || "#"} aria-label={label}'), "icon-only social links are named")
assert.ok(src.includes('<div className="hlf-meadow" aria-hidden="true">'), "the drawn meadow is hidden from screen readers")
assert.ok(src.includes('<div className="hlf-band" aria-hidden="true" />'), "so is the band")
assert.ok(/<button ref={archRef} type="button" className="hlf-arch" onClick={callBee} aria-label="Call the bee"/.test(src), "the arch is a real, named button")
assert.ok(src.includes('aria-label={name + " — " + tagline}'), "the medallion link carries the brand")
assert.ok(src.includes('role="img" aria-label={"EAN-13 " + code.digits}'), "the barcode names its digits")
assert.ok(src.includes('<input id={newsId} name={newsId} className="hlf-news-input" type="email" required'), "the sign-up is a labelled email field")
assert.ok(src.includes('<label className="hlf-news-label" htmlFor={newsId}>'), "with a real label")
assert.ok(src.includes("React.useId()"), "ids are unique per instance")
assert.doesNotMatch(src, /console\./, "no debug logging ships")
assert.doesNotMatch(
  src.slice(0, src.indexOf("</")),
  /use(State|Ref|Memo|Callback)<|Partial<|Record<|Array<|Map<|Exclude<|Omit<|React\.[A-Za-z]+<|\[K in /,
  "no generics before the first JSX close tag (the 21st CLI tokenizer hangs on them)",
)
const files = readdirSync(dir).sort()
assert.deepEqual(files, ["README.md", "demo-amber.tsx", "demo-lavender.tsx", "demo.tsx", "honey-label-footer.tsx"], "folder holds only the component, demos and README")
for (const f of files.filter((f) => f.startsWith("demo"))) {
  const d = read(f)
  const di = [...d.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
  assert.deepEqual(di, ["@/components/ui/honey-label-footer"], f + ": imports only the component")
  assert.match(d, /className="w-full"/, f + ": full width inside 21st's flex wrapper")
}
const tsconfig = readFileSync(new URL("../tsconfig.json", import.meta.url), "utf8")
assert.ok(tsconfig.includes('"@/components/ui/honey-label-footer"'), "tsconfig paths line exists")

// ---- scoped CSS ----
const css = src.match(/const HLF_CSS = `([\s\S]*?)`/)[1]
assert.doesNotMatch(css, /\$\{/, "no interpolation in the CSS string")
for (const m of css.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/(?<=^|[{}])\s*([^{}]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (sel.startsWith("@") || /^(from|to|[\d.]+%)/.test(sel)) continue
  assert.ok(sel.split(",").every((s) => /^(a|\.hlf-on |\.hlf-rm |\.hlf-calling )?\.hlf(\b|-)/.test(s.trim())), "unscoped selector: " + sel)
}
assert.ok(css.includes("--hlf-top: 250px"), "the tag zone in CSS matches HLF_TOP")
assert.ok(css.includes(".hlf-meadow { position: absolute; left: 0; top: 0; right: 0; height: 420px;"), "the meadow box in CSS matches HLF_MEADOW_H")

// ---- the lifted region ----
const a = src.indexOf("// #region label\n")
const b = src.indexOf("// #endregion\n", a)
assert.ok(a > -1 && b > a, "label region missing")
const L = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(src.slice(a, b))))

assert.equal(L.HLF_TOP, 250)
assert.equal(L.HLF_MEADOW_H, 420)

// PRNG: deterministic, in range, seed-sensitive.
const r1 = L.hlfRng(7)
const r2 = L.hlfRng(7)
const seq = Array.from({ length: 300 }, () => r1())
assert.deepEqual(seq, Array.from({ length: 300 }, () => r2()), "same seed, same meadow")
assert.ok(seq.every((v) => v >= 0 && v < 1), "rng in [0, 1)")
assert.notEqual(L.hlfRng(8)(), seq[0], "a new seed is a new meadow")
assert.ok(Number.isFinite(L.hlfRng(0)()), "seed 0 still runs")

// Easings.
assert.equal(L.hlfEaseOut(-1), 0)
assert.equal(L.hlfEaseOut(2), 1)
assert.ok(L.hlfEaseOut(0.5) > 0.5, "eases out")
assert.ok(Math.abs(L.hlfPop(0)) < 1e-9)
assert.ok(Math.abs(L.hlfPop(1) - 1) < 1e-9)
assert.ok(L.hlfPop(0.75) > 1 && L.hlfPop(0.75) < 1.2, "pops past 1 and settles")
assert.equal(L.hlfClamp(5, 0, 1), 1)

// Colour mixing.
assert.equal(L.hlfMix("#000000", "#ffffff", 0.5), "#808080")
assert.equal(L.hlfMix("#123456", "#ffffff", 0), "#123456")
assert.equal(L.hlfMix("#123456", "#ffffff", 1), "#ffffff")

// The stem curve: root at the origin, tip at (bend, -h), unit tangents, always climbing.
const stem0 = { x: 0, root: 20, h: 150, bend: 30, layer: 2, kind: 1, leaves: [], whorls: [], bud: 3, phase: 0, amp: 0.02, omega: 1, delay: 0, dur: 1 }
assert.ok(L.hlfStemAt(stem0, 0).slice(0, 2).every((v) => Math.abs(v) < 1e-9), "root at the origin")
const tip = L.hlfStemAt(stem0, 1)
assert.ok(Math.abs(tip[0] - 30) < 1e-9 && Math.abs(tip[1] + 150) < 1e-9, "tip at (bend, -h)")
let prevY = 1
for (let t = 0; t <= 1.0001; t += 0.05) {
  const [, y, dx, dy] = L.hlfStemAt(stem0, t)
  assert.ok(Math.abs(Math.hypot(dx, dy) - 1) < 1e-9, "unit tangent")
  assert.ok(dy < 0, "always heading up")
  assert.ok(y < prevY, "y keeps climbing")
  prevY = y
}

// The leaf: a closed, serrated outline from the base to the tip and back.
const leaf = { t: 0.3, side: 1, len: 30, wid: 9, ang: 0.8, teeth: 12 }
const pts = L.hlfLeafOutline(leaf)
assert.deepEqual(pts[0], [0, 0], "starts at the base")
assert.ok(pts.some(([x, y]) => x === 30 && y === 0), "passes the tip")
assert.equal(pts.length, 2 * (12 - 1) + 2, "both edges, every tooth")
const upper = pts.slice(1, 12)
assert.ok(upper.every(([, y]) => y < 0) && upper.some(([, y]) => y < -8), "the upper edge is above the spine and reaches the full width")
assert.ok(pts.slice(13).every(([, y]) => y > 0), "the lower edge is below it")
const widths = upper.map(([, y]) => -y)
assert.ok(widths.some((w, i) => i > 0 && w < widths[i - 1]) && widths.some((w, i) => i > 0 && w > widths[i - 1]), "serrated: the edge goes in and out")

// The box a stem paints into holds its tip, its bend and its leaves.
const boxed = { ...stem0, leaves: [leaf] }
const box = L.hlfStemBox(boxed)
assert.ok(box.top < -150 && box.bottom > 0 && box.left < 0 && box.right > 30, "contains the stem")
assert.ok(box.right - 30 >= 30 * 1.05 + 9, "and the longest leaf")

// The meadow.
const span = 3200
const meadow = L.hlfMeadow(7, span, 1)
assert.ok(meadow.length > 100, "a full planting")
assert.deepEqual(L.hlfMeadow(7, span, 1), meadow, "deterministic")
assert.notDeepEqual(L.hlfMeadow(8, span, 1), meadow, "seed-sensitive")
for (let i = 1; i < meadow.length; i++) {
  const p = meadow[i - 1]
  const q = meadow[i]
  assert.ok(p.layer < q.layer || (p.layer === q.layer && p.root <= q.root), "painter's order: back to front, higher roots first")
}
for (const s of meadow) {
  assert.ok(Math.abs(s.x) <= span / 2 + 60, "inside the span")
  assert.ok(s.root >= 10 && s.root <= L.HLF_ROOTS, "roots in the band's top strip")
  assert.ok(s.h > 50 && s.h < 260, "a believable height")
  assert.ok(s.delay >= 0.22 && s.delay < 0.22 + 0.85 * (span / 2 / L.HLF_STAGGER_W) + 0.3, "grows after the wrap reaches it")
  assert.ok(s.dur >= 1.25 && s.dur <= 1.75)
  if (s.kind === 1) {
    assert.ok(s.whorls.length >= 5 && s.bud > 0, "a spike flowers and buds")
    let lastT = 0
    for (const w of s.whorls) {
      assert.ok(w.t > lastT && w.t >= 0.64 && w.t <= 1, "whorls climb the top of the spike")
      assert.ok(w.florets.length >= 8, "a full whorl")
      for (const f of w.florets) assert.ok(f.tone >= 0 && f.tone <= 3 && f.r > 2 && Math.abs(f.x) <= w.rx + 1e-9, "florets sit on the whorl")
      lastT = w.t
    }
  } else {
    assert.equal(s.whorls.length, 0, "a sprig only leafs")
    assert.equal(s.bud, 0)
  }
  assert.ok(s.leaves.length >= 2, "every plant has leaves")
  for (const l of s.leaves) assert.ok(Math.abs(l.side) === 1 && Math.sign(l.ang) === l.side && l.t > 0 && l.t < 1, "leaves alternate sides")
}
const near = meadow.filter((s) => Math.abs(s.x) < 100)
const far = meadow.filter((s) => Math.abs(s.x) > 1200)
assert.ok(Math.max(...near.map((s) => s.delay)) < Math.min(...far.map((s) => s.delay)), "the centre grows before the edges")
assert.ok(L.hlfMeadow(7, span, 2).length > meadow.length * 1.6, "density plants more")
assert.ok(L.hlfMeadow(7, span, 0.5).length < meadow.length * 0.65, "and fewer")
assert.ok(L.hlfMeadow(7, span, NaN).length === meadow.length, "a bad density is the default")

// EAN-13: the check digit, the module string, and a decode of it back to the digits.
assert.equal(L.hlfEanCheck("590123412345"), 7, "the textbook example")
assert.equal(L.hlfEanCheck("400638133393"), 1)
const decode = (modules) => {
  assert.equal(modules.length, 95)
  assert.equal(modules.slice(0, 3), "101")
  assert.equal(modules.slice(45, 50), "01010")
  assert.equal(modules.slice(92), "101")
  let parity = ""
  let out = ""
  for (let i = 0; i < 6; i++) {
    const m = modules.slice(3 + i * 7, 10 + i * 7)
    const l = L.HLF_EAN_L.indexOf(m)
    const g = L.HLF_EAN_G.indexOf(m)
    assert.ok(l >= 0 || g >= 0, "a left digit in L or G")
    parity += l >= 0 ? "L" : "G"
    out += l >= 0 ? l : g
  }
  for (let i = 0; i < 6; i++) {
    const r = L.HLF_EAN_R.indexOf(modules.slice(50 + i * 7, 57 + i * 7))
    assert.ok(r >= 0, "a right digit in R")
    out += r
  }
  return L.HLF_EAN_PARITY.indexOf(parity) + out
}
for (const input of ["5901234123457", "4006381333931", "893421076310", "12", "", "97-83161-48410-0"]) {
  const { digits, modules } = L.hlfEan13(input)
  assert.equal(digits.length, 13)
  assert.equal(Number(digits[12]), L.hlfEanCheck(digits.slice(0, 12)), "a correct check digit for " + JSON.stringify(input))
  assert.equal(decode(modules), digits, "the bars decode back to the digits for " + JSON.stringify(input))
}
assert.equal(L.hlfEan13("5901234123457").digits, "5901234123457", "a valid code is kept")
assert.equal(L.hlfEan13("5901234123450").digits, "5901234123457", "a wrong check digit is corrected")
assert.equal(L.hlfEan13("12").digits.slice(0, 11), "00000000001", "short input is zero-padded")
assert.ok(L.HLF_EAN_L.every((p) => p.length === 7 && p[0] === "0" && p[6] === "1"), "L codes are odd and start light")
assert.ok(L.HLF_EAN_G.every((p) => p[0] === "0" && p[6] === "1"), "G codes start light and end dark")
assert.ok(L.HLF_EAN_R.every((p) => p[0] === "1" && p[6] === "0"), "R codes start dark")
assert.deepEqual(L.hlfBars("101"), [[0, 1], [2, 1]])
assert.deepEqual(L.hlfBars("0110011"), [[1, 2], [5, 2]])
const { modules } = L.hlfEan13("5901234123457")
assert.equal(L.hlfBars(modules).reduce((n, [, w]) => n + w, 0), modules.split("1").length - 1, "every dark module is in a bar")

console.log("honey-label-footer: ok")
