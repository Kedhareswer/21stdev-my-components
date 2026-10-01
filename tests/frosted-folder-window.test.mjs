// Install-safety, glass and logic checks for components/frosted-folder-window.
// Run: node tests/frosted-folder-window.test.mjs
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const SLUG = "frosted-folder-window"
const read = (file) => readFileSync(new URL(`../components/${SLUG}/${file}`, import.meta.url), "utf8").replace(/\r\n/g, "\n")
const src = read(`${SLUG}.tsx`)
const demos = [read("demo.tsx"), read("demo-custom.tsx")]
const region = (name) => {
  const m = src.match(new RegExp(`// #region ${name}\\n([\\s\\S]*?)// #endregion ${name}\\n`))
  assert.ok(m, `region ${name} missing`)
  return m[1]
}

/* ---------- nothing travels with it ---------- */

const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "react is the only import")
assert.doesNotMatch(src, /@import|@font-face|<link\b|fetch\(|new Image\(/, "nothing loads at runtime")
for (const [name, text] of [["component", src], ["demo", demos[0]], ["demo-custom", demos[1]]]) {
  const urls = [...text.matchAll(/https?:\/\/[^"'\s)]+/g)].map((m) => m[0])
  assert.deepEqual(urls, [], `${name} must make no network requests, so 21st can capture it: ${urls.join(", ")}`)
}
assert.ok(src.includes('height = "100svh"'), "height defaults to a definite length")
assert.match(src, /style=\{\s*\{\s*height,/, "the height prop reaches the root")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")
for (const m of src.matchAll(/<img [^>]*>/g)) {
  assert.match(m[0], /style=\{\{ maxWidth: "none" \}\}/, "a photo is guarded against Preflight")
  assert.match(m[0], /width=\{\d+\} height=\{\d+\}/, "a photo has an explicit size")
}

const css = src.match(/const FFW_CSS = `([\s\S]*?)`/)
assert.ok(css, "CSS block present")
assert.doesNotMatch(css[1], /\$\{|`/, "no interpolation inside the CSS string")
assert.doesNotMatch(css[1], /url\(/, "no url() in the style block")
assert.doesNotMatch(css[1], /[\w.]calc\(/, "no number glued onto a calc(): the whole declaration would drop")
assert.match(css[1], /prefers-reduced-motion:reduce/, "honours reduced motion")
assert.match(css[1], /\.ffw-scene,\.ffw-tilt\{transform:none;transition:none\}/, "reduced motion stops the parallax and the tilt")
assert.match(css[1], /@media \(hover:hover\) and \(pointer:fine\)/, "hover styles are gated off touch")
const bare = css[1].replace(/\/\*[\s\S]*?\*\//g, "").replace(/@(media|container)[^{]*\{/g, "")
let rules = 0
for (const m of bare.matchAll(/(?<=^|[{}])\s*([^{}@]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (/^(from|to|[\d.,%\s]+)$/.test(sel)) continue
  rules++
  for (const s of sel.split(/,(?![^(]*\))/)) assert.match(s.trim(), /^\.ffw-/, `selector escapes the component: ${s.trim()}`)
}
assert.ok(rules > 60, `expected the scope check to see real rules, saw ${rules}`)
assert.match(css[1], /\.ffw-root :where\(svg\)\{display:block;max-width:none/, "svg guarded against Preflight")
assert.match(css[1], /\.ffw-canvas,\.ffw-photo\{position:absolute;inset:0;width:100%;height:100%;max-width:none/, "the scene fills an absolute layer and beats Preflight")
for (const m of css[1].matchAll(/[^{}]*\{[^}]*height:100%[^}]*\}/g))
  assert.match(m[0], /position:absolute;inset:0/, "percentage heights only on absolute layers: " + m[0].trim())

/* ---------- the glass actually frosts ---------- */

// Each of these on an ancestor of the glass makes it a backdrop root in
// Chrome, and the frost then has nothing to blur. All three shipped once.
assert.doesNotMatch(css[1], /\.ffw-win\{[^}]*container-type/, "the window is not a container")
assert.match(css[1], /\.ffw-stage\{[^}]*container-type:size/, "the stage is, and the window is sized in --u from it")
const glassRules = css[1].split("\n").filter((l) => /^\.ffw-(win|tilt|body|bar|tabs|glare|frame|pane|shadow|notch|tab)\b/.test(l))
for (const l of glassRules) assert.doesNotMatch(l, /mix-blend-mode/, "nothing inside the window blends: " + l.slice(0, 60))
assert.match(css[1], /\.ffw-win\[data-state='min'\] \.ffw-body\{transform:scaleY\(0\)/, "rolling up is a transform, not a clip-path or opacity")
assert.doesNotMatch(css[1], /\.ffw-win\[data-state='closed'\]\{[^}]*opacity/, "closing is a transform too")
assert.doesNotMatch(css[1], /@keyframes ffw-in\{[^}]*opacity/, "the window rises in without fading, so the glass never pops")
assert.match(css[1], /\.ffw-glass\{[^}]*-webkit-backdrop-filter:blur\(\d+px\)[^}]*backdrop-filter:blur\(\d+px\)/, "frame and tabs are frosted, Safari included")
assert.match(css[1], /\.ffw-pane\{[^}]*backdrop-filter:blur\(/, "the pane is lightly frosted")
assert.match(css[1], /\.ffw-frame\{[^}]*mask:linear-gradient\(#000 0 0\) content-box exclude/, "the frame is a ring, so the pane's lighter frost isn't stacked on it")

/* ---------- the interactions are wired ---------- */

assert.match(src, /role="tablist"/, "folder tabs are a tablist")
assert.match(src, /e\.key === "ArrowRight"[\s\S]*e\.key === "Home"[\s\S]*e\.key === "End"/, "tabs move with arrows, Home and End")
assert.match(src, /tabIndex=\{on \? 0 : -1\}/, "roving tabindex on the tabs")
assert.match(src, /role="tabpanel"/, "the pane is the tab panel")
assert.match(src, /aria-live="polite"/, "changing place is announced")
assert.match(src, /swipeDirection\(e\.clientX - s\.x, e\.clientY - s\.y, 40\)/, "places swipe")
assert.match(src, /setPointerCapture\(e\.pointerId\)/, "dragging keeps the pointer")
assert.match(src, /toggleAttribute\("inert", state !== "open"\)/, "a rolled-up body leaves the tab order")
assert.match(src, /toggleAttribute\("inert", state === "closed"\)/, "a closed window leaves the tab order")
assert.match(src, /className="ffw-dock ffw-glass" onClick=\{\(\) => setState\("open"\)\}/, "a closed window can be reopened")
assert.match(src, /matchMedia\("\(prefers-reduced-motion: reduce\)"\)/, "reduced motion stops the pointer parallax")
assert.match(src, /typeof ResizeObserver !== "function"/, "the garden paints once without ResizeObserver")
assert.match(src, /Math\.min\(window\.devicePixelRatio \|\| 1, 1\.5\)/, "the canvas is capped at 1.5x")
assert.match(src, /onPlaceChange\?\.\(i, place\)/, "onPlaceChange fires")
assert.match(src, /onNote\?\.\(i, note\)/, "onNote fires")
assert.ok(demos[0].includes("<FrostedFolderWindow />"), "default demo is the component, full bleed")
assert.doesNotMatch(demos[0], /<div/, "default demo has no wrapper")

/* ---------- logic, executed ---------- */

const L = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(region("logic"))))

assert.equal(L.wrap(-1, 3), 2)
assert.equal(L.wrap(3, 3), 0)
assert.equal(L.wrap(5, 0), 0, "an empty folder never divides by zero")

assert.deepEqual(L.hexToRgb("#e4e0b0"), [228, 224, 176])
assert.equal(L.hexToRgb("#fff"), null, "short hex is rejected rather than misread")
assert.equal(L.rgbList("not a colour", "#000000"), "0,0,0", "a bad tint falls back")
assert.equal(L.rgbList(undefined, L.DEFAULT_INK), "244,237,204")

assert.equal(L.formatSize(4.2), "4.2 MB")
assert.equal(L.formatSize(0.5), "512 KB")
assert.equal(L.formatSize(2048), "2.0 GB")
assert.equal(L.formatSize(0), "0 KB")
assert.equal(L.formatSize(NaN), "0 KB")
assert.equal(L.totalSize([{ sizeMB: 4.2 }, { sizeMB: 3.9 }, { sizeMB: 4.3 }]), 12.4, "the default folder is 12.4 MB, as in the reference")
assert.equal(L.totalSize([{ sizeMB: -3 }, {}, { sizeMB: Infinity }, { sizeMB: 1 }]), 1, "bad sizes are skipped")

assert.deepEqual(L.titleLines("Quiet Escapes"), ["Quiet", "Escapes"], "two words, two lines")
assert.deepEqual(L.titleLines("Salt\nHours"), ["Salt", "Hours"])
assert.deepEqual(L.titleLines("A long weekend away"), ["A long weekend away"], "longer titles wrap naturally")
assert.deepEqual(L.titleLines("  "), [])
assert.equal(L.fitLength(["Quiet", "Escapes"]), 7)
assert.equal(L.fitLength(["Oh"]), 4, "short titles don't blow up past the cap")
assert.deepEqual(L.taglineLines("Moments offline.\nMemories online forever."), ["Moments offline.", "Memories online forever."])
assert.deepEqual(L.taglineLines(undefined), [])
assert.equal(L.countWords(["one two", "  three  "]), 3)
assert.equal(L.cityOf("Delhi, India"), "Delhi")
assert.equal(L.pad2(3), "03")

const dated = [{ date: "May 12, 2024" }, { date: "someday" }, { date: "Oct 21, 2023" }, { date: "Jan 3, 2024" }]
assert.deepEqual(L.sortByDate(dated, true), [0, 3, 2, 1], "newest first, unreadable dates last")
assert.deepEqual(L.sortByDate(dated, false), [2, 3, 0, 1], "oldest first, unreadable dates still last")

assert.equal(L.swipeDirection(-60, 5, 40), 1, "swipe left goes forward")
assert.equal(L.swipeDirection(60, 5, 40), -1, "swipe right goes back")
assert.equal(L.swipeDirection(30, 0, 40), 0, "too short")
assert.equal(L.swipeDirection(60, 80, 40), 0, "mostly vertical is a scroll, not a swipe")

assert.deepEqual(L.clampOffset(500, -500, 100, 80), [100, -80])
assert.deepEqual(L.clampOffset(-0, 0, 0, 0), [0, 0], "no negative zero leaks into the style")

for (const light of ["noon", "morning", "golden", "dusk", undefined]) {
  const bg = L.thumbBackground(light)
  assert.match(bg, /linear-gradient\(180deg,#[0-9a-f]{6} 0%/, `thumb for ${light} is a painted gradient`)
  assert.doesNotMatch(bg, /url\(|undefined/, `thumb for ${light} is self-contained`)
}

const r1 = L.rng(7)
const r2 = L.rng(7)
for (let k = 0; k < 50; k++) {
  const v = r1()
  assert.equal(v, r2(), "the garden is the same every time for a seed")
  assert.ok(v >= 0 && v < 1)
}
assert.notEqual(L.rng(7)(), L.rng(8)(), "and different for another seed")

/* ---------- the garden paints, on a fake canvas, within budget ---------- */

const scene = region("scene")
const paintSrc = region("logic") + scene + "\nexport { paintScene }\n"
const { paintScene } = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(paintSrc)))
const fake = () => {
  const calls = { fill: 0, stroke: 0, bad: [] }
  const grad = { addColorStop: () => {} }
  const ctx = new Proxy(
    {},
    {
      get: (_, k) => {
        if (k === "createLinearGradient" || k === "createRadialGradient") return () => grad
        if (k === "fill" || k === "stroke") return () => calls[k]++
        return () => {}
      },
      set: (_, k, v) => {
        if (k === "fillStyle" || k === "strokeStyle") if (typeof v === "string" && /NaN|undefined|Infinity/.test(v)) calls.bad.push(v)
        if (k === "filter") calls.bad.push("ctx.filter is too slow per draw call")
        return true
      },
    },
  )
  return { ctx, calls }
}
for (const [w, h] of [[1440, 900], [375, 667], [736, 1307], [2560, 1440]]) {
  const { ctx, calls } = fake()
  paintScene(ctx, w, h, 7)
  assert.deepEqual(calls.bad, [], `every colour is well formed at ${w}x${h}`)
  assert.ok(calls.fill > 3000, `a real garden at ${w}x${h}: ${calls.fill} fills`)
  assert.ok(calls.fill < 60000, `and within budget at ${w}x${h}: ${calls.fill} fills`)
}

console.log(`${SLUG}: ok`)
