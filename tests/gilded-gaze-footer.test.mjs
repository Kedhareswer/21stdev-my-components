// Install-safety and ornament-geometry checks for gilded-gaze-footer.
// Run: node tests/gilded-gaze-footer.test.mjs
import assert from "node:assert/strict"
import { readFileSync, readdirSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const dir = new URL("../components/gilded-gaze-footer/", import.meta.url)
const read = (f) => readFileSync(new URL(f, dir), "utf8").replace(/\r\n/g, "\n")
const src = read("gilded-gaze-footer.tsx")

// ---- install safety ----
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "react is the only import")
assert.doesNotMatch(src, /@import|url\(["']?(https?:|\/\/|data:)/, "nothing fetched from CSS: every url() points at an in-page #id")
assert.doesNotMatch(src, /<img|fetch\(/, "the portrait is an SVG <image>, nothing else is fetched")
assert.doesNotMatch(src.replace(/\/\/.*$/gm, ""), /https?:\/\//, "nothing is fetched by default: she is drawn, not loaded")
assert.match(src, /const GG_ELDER =\s*"data:image\/webp;base64,[A-Za-z0-9+/=]{20000,}"/, "the elder is embedded, not fetched")
assert.ok(src.includes("portrait = GG_DEFAULT_PORTRAIT") && src.includes("cutout: true"), "she is the default portrait, drawn as a transparent cut-out")
assert.ok(src.indexOf("const GG_ELDER") < src.indexOf("const GG_DEFAULT_PORTRAIT"), "declared before use")
assert.match(src, /sceneHeight = "clamp\(\d+px, [\d.]+vw, \d+px\)"/, "the scene height defaults to a definite length")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")
assert.ok(src.includes("prefers-reduced-motion"), "honours reduced motion")
assert.ok(src.includes("max-width: none"), "the layered svgs are guarded against Preflight")
assert.ok(src.includes("new ResizeObserver") && src.includes("new IntersectionObserver"), "follows its box and wakes on screen")
for (const gone of ["ro.disconnect()", "io.disconnect()", 'window.removeEventListener("scroll", onScroll)', "cancelAnimationFrame(raf.current)", "cancelAnimationFrame(tick)", "window.clearTimeout(surgeTimer.current)", 'mq.removeEventListener("change", on)']) {
  assert.ok(src.includes(gone), "cleanup is missing " + gone)
}
assert.ok(src.includes('<a className="gg-link" href='), "links are real anchors")
assert.ok(src.includes("aria-label={s.label || GG_SOCIAL_NAMES[s.icon] || s.icon}"), "icon-only social links are named")
assert.ok(/<button[\s\S]*?type="button"[\s\S]*?className="gg-hit"[\s\S]*?aria-label="Light up her eyes"/.test(src), "the eyes are a real, named button")
assert.ok(src.includes('aria-label="Footer"'), "the link columns are a labelled nav")
assert.equal((src.match(/aria-hidden="true"/g) || []).length >= 6, true, "the drawn layers are hidden from screen readers")
assert.ok(src.includes("React.useId()"), "gradient ids are unique per instance")
assert.doesNotMatch(src, /console\./, "no debug logging ships")
assert.doesNotMatch(
  src.slice(0, src.indexOf("</")),
  /use(State|Ref|Memo|Callback)<|Partial<|Record<|Array<|Map<|Exclude<|Omit<|React\.[A-Za-z]+<|\[K in /,
  "no generics before the first JSX close tag (the 21st CLI tokenizer hangs on them)",
)
const files = readdirSync(dir).sort()
assert.deepEqual(files, ["README.md", "demo-moon.tsx", "demo.tsx", "gilded-gaze-footer.tsx"], "folder holds only the component, demos and README")
for (const f of files.filter((f) => f.startsWith("demo"))) {
  const d = read(f)
  const di = [...d.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
  assert.deepEqual(di, ["@/components/ui/gilded-gaze-footer"], f + ": imports only the component")
  assert.match(d, /className="w-full"/, f + ": full width inside 21st's flex wrapper")
}
const tsconfig = readFileSync(new URL("../tsconfig.json", import.meta.url), "utf8")
assert.ok(tsconfig.includes('"@/components/ui/gilded-gaze-footer"'), "tsconfig paths line exists")

// ---- scoped CSS ----
const css = src.match(/const GG_CSS = `([\s\S]*?)`/)[1]
assert.doesNotMatch(css, /\$\{/, "no interpolation in the CSS string")
for (const m of css.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/(?<=^|[{}])\s*([^{}]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (sel.startsWith("@") || /^(from|to|[\d.]+%)/.test(sel)) continue
  assert.ok(sel.split(",").every((s) => s.trim().startsWith(".gg-")), "unscoped selector: " + sel)
}
// Every animated class has a reduced-motion answer.
const rm = css.slice(css.indexOf("@media (prefers-reduced-motion"))
for (const cls of ["gg-line-in", "gg-quirk", "gg-portrait-wrap", "gg-glow", "gg-stream", "gg-wing-clip", "gg-motif", "gg-clasp", "gg-drop-in", "gg-drop", "gg-wing", "gg-body", "gg-breath", "gg-filler", "gg-core", "gg-halo", "gg-flare", "gg-spark", "gg-ring", "gg-burst", "gg-rip"]) {
  assert.ok(rm.includes("." + cls + ",") || rm.includes("." + cls + " "), "reduced motion forgets ." + cls)
}
// The links sit in the corners under the wings only where there is room.
assert.match(css, /@media \(min-width: 1280px\) \{\s*\.gg-links \{ position: absolute;/, "corner links only on wide screens")

// ---- ornament geometry ----
const a = src.indexOf("// #region wing\n")
const b = src.indexOf("// #endregion", a)
assert.ok(a > -1 && b > a, "wing region missing")
const L = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(src.slice(a, b))))
const dist = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1])

// PRNG: deterministic, in range, seed-sensitive.
const r1 = L.ggRng(7)
const r2 = L.ggRng(7)
const seq = Array.from({ length: 300 }, () => r1())
assert.deepEqual(seq, Array.from({ length: 300 }, () => r2()), "same seed, same ornament")
assert.ok(seq.every((v) => v >= 0 && v < 1), "rng in [0, 1)")
assert.notEqual(L.ggRng(8)(), seq[0], "a new seed is a new ornament")

// Scroll spines: exactly `len` long, steps shrinking, winding the way they are told.
const sc = L.ggScrollSpine(10, 20, 0, 300, Math.PI * 2.4, 1, 40)
assert.equal(sc.length, 41)
assert.deepEqual(sc[0], [10, 20])
assert.ok(Math.abs(L.ggLength(sc) - 300) < 1e-6, "arc length is len")
assert.ok(dist(sc[1], sc[0]) > dist(sc[40], sc[39]) * 3, "steps shorten into the volute")
assert.ok(sc[10][1] > 20, "sign +1 turns toward +y in y-down space")
assert.ok(L.ggScrollSpine(10, 20, 0, 300, Math.PI * 2.4, -1, 40)[10][1] < 20, "and sign -1 the other way")

// Currents: start at the root, no kink where the S meets the volute, and wind inward.
const cur = L.ggCurrentSpine(L.GG_ROOT, -10, 480, 14, 1, 40)
assert.deepEqual(cur[0], L.GG_ROOT)
for (let i = 2; i < cur.length; i++) {
  const t1 = Math.atan2(cur[i - 1][1] - cur[i - 2][1], cur[i - 1][0] - cur[i - 2][0])
  const t2 = Math.atan2(cur[i][1] - cur[i - 1][1], cur[i][0] - cur[i - 1][0])
  let d = Math.abs(t2 - t1)
  if (d > Math.PI) d = Math.PI * 2 - d
  assert.ok(d < 0.75, "kink at sample " + i)
}
const joint = cur[46]
assert.ok(Math.abs(dist(joint, L.GG_ROOT) - 480) < 1e-6, "the volute starts `len` out")
assert.ok(dist(cur.at(-1), joint) < 40 * 2, "and stays within its own radius")

// Ribbons and tapers are closed paths, inlays pinch to points.
assert.ok(L.ggScrollWidth(0, 20) < L.ggScrollWidth(0.22, 20) && L.ggScrollWidth(0.95, 20) < 3, "swell off the stem, taper into the volute")
const rib = L.ggRibbon(sc, 20, 1)
assert.match(rib, /^M[-\d.]+ [-\d.]+(L[-\d.]+ [-\d.]+)+Z$/, "a closed ribbon")
assert.equal(rib.split("L").length, sc.length * 2, "both edges, every sample")
const inlay = L.ggRibbon(sc, 20, 1, 0.42, 0, 0.1, 0.6)
const first = inlay.slice(1).split("L")[0].split(" ").map(Number)
assert.ok(dist(first, sc[4]) < 0.1, "an inlay starts at a point (paths round to 0.1)")
assert.match(L.ggTaper(L.ggCubic([0, 0], [10, 0], [20, 5], [30, 5], 10), 2, 20), /^M[-\d.]+ [-\d.]+(L[-\d.]+ [-\d.]+){21}Z$/, "a tapered stream")
assert.deepEqual(L.ggCubic([0, 0], [1, 2], [3, 4], [5, 6], 8).at(-1), [5, 6])
assert.equal((L.ggRosette().match(/Z/g) || []).length, 8, "eight petals")
assert.ok(L.ggInside([[0, 0], [10, 0], [10, 10], [0, 10]], 5, 5) && !L.ggInside([[0, 0], [10, 0], [10, 10], [0, 10]], 15, 5))
assert.ok(Math.abs(L.ggEdgeDist([[0, 0], [10, 0], [10, 10], [0, 10]], 5, 3) - 3) < 1e-9, "distance to the nearest edge")

// The wing: deterministic, everything inside, nothing on top of anything else.
const w1 = L.ggWing(7)
assert.deepEqual(L.ggWing(7), w1, "same seed, same wing")
assert.notDeepEqual(L.ggWing(19).motifs, w1.motifs, "another seed, another wing")
assert.equal(w1.currents.length, 6, "six gold currents")
assert.ok(w1.fillers.length >= 60, "gold filigree in the gaps: " + w1.fillers.length)
assert.ok(w1.scrolls.length >= 24, "acanthus scrolls off the currents: " + w1.scrolls.length)
assert.ok(w1.motifs.length >= 60, "densely set: " + w1.motifs.length)
assert.equal(w1.streams.length, 4, "four braided strands from the eye")
assert.ok(w1.drops.length >= 5 && w1.drops.every((d) => d.y > 0 && d.len > 0 && d.r > 0), "pearl drops hang from the lower edge")
assert.ok((w1.ground.match(/Z/g) || []).length > w1.motifs.length, "the ground is one cell per motif and more along the scrolls")
for (const m of w1.motifs) {
  assert.ok(L.ggInside(w1.env, m.x, m.y), "motif inside the envelope")
  assert.ok(m.k >= 0 && m.k <= 1, "stagger key in [0, 1]")
  assert.ok([0, 1, 2, 3].includes(m.kind) && [0, 1, 2].includes(m.fill) && m.ink !== m.fill, "known motif, contrasting inlay")
}
for (let i = 0; i < w1.motifs.length; i++)
  for (let j = i + 1; j < w1.motifs.length; j++) {
    const p = w1.motifs[i]
    const q = w1.motifs[j]
    assert.ok(Math.hypot(p.x - q.x, p.y - q.y) >= p.r + q.r, "motifs " + i + " and " + j + " overlap")
  }
for (let i = 1; i < w1.motifs.length; i++) assert.ok(w1.motifs[i].r <= w1.motifs[i - 1].r, "packed biggest first")
for (const s of [...w1.currents, ...w1.scrolls]) {
  for (const m of s.d.slice(1, -1).split("L")) {
    const [x, y] = m.split(" ").map(Number)
    assert.ok(x > L.GG_ROOT[0] - 40 && y > -L.GG_TOP && y < 300, "scroll strays out of the wing at " + x + "," + y)
  }
}
assert.ok(w1.env.every((p) => p[0] >= L.GG_ROOT[0] - 10), "the ornament leaves the face to the streams")
assert.ok(w1.sparks.length > 0 && w1.sparks.every((p) => p.every(Number.isFinite)))

// Scale: as tall as the room above the eye allows, and long enough to run off the page.
const sDesk = L.ggWingScale(1636, 60, 258)
assert.ok(sDesk > 0.9 && sDesk <= (258 - 12) / L.GG_TOP + 1e-9, "capped by the room above the eye")
assert.ok(60 + L.GG_REACH * sDesk > 1636 / 2 + 40, "on a desktop the wing runs off the edge of the page")
const sPhone = L.ggWingScale(562, 60, 306)
assert.ok(sPhone > 0.55 && 60 + L.GG_REACH * sPhone > 562 / 2 + 100, "on a phone too")
assert.equal(L.ggWingScale(4000, 60, 2000), 1, "never above full size")
assert.equal(L.ggWingScale(100, 60, 2000), 0.5, "never below half")

// Portrait box and fit: cropped by the bottom edge, centred, slice-fitted.
const pb = L.ggPortraitBox(1600)
assert.ok(Math.abs(pb.y + pb.h * L.GG_PORTRAIT_SHOW - L.GG_H) < 1e-9 && Math.abs(pb.x + pb.w / 2) < 1e-9, "bottom-cropped, centred")
assert.ok(Math.abs(pb.w / pb.h - L.GG_PORTRAIT_ASPECT) < 1e-9)
assert.ok(L.ggPortraitBox(560).w <= 560, "on a phone she fits the width, leaving room for the wings")
assert.deepEqual(L.ggFit(pb, null, [0, 0]), [pb.x, pb.y], "unknown size: the box itself")
const wide = L.ggFit(pb, { w: 2000, h: 1000 }, [0.5, 0.5])
assert.ok(Math.abs(wide[0]) < 1e-9 && Math.abs(wide[1] - (pb.y + pb.h / 2)) < 1e-9, "centre stays centre")
const tl = L.ggFit(pb, { w: 2000, h: 1000 }, [0, 0])
assert.ok(tl[0] < pb.x && Math.abs(tl[1] - pb.y) < 1e-9, "a wide image is cropped at the sides")

// Her eyes, as placed by the default portrait, are level and either side of centre.
const eyes = JSON.parse(src.match(/eyes: (\[\s*\[[\d.]+, [\d.]+\],\s*\[[\d.]+, [\d.]+\],?\s*\])/)[1].replace(/,\s*\]$/, "]"))
assert.ok(eyes[0][0] < 0.5 && eyes[1][0] > 0.5 && Math.abs(eyes[0][1] - eyes[1][1]) < 0.01, "eyes level, either side of centre")

console.log("gilded-gaze-footer: ok")
