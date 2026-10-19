// Install-safety and logic checks for components/meadow-journal-template.
// Run: node tests/meadow-journal-template.test.mjs
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const SLUG = "meadow-journal-template"
const read = (file) => readFileSync(new URL(`../components/${SLUG}/${file}`, import.meta.url), "utf8").replace(/\r\n/g, "\n")
const src = read(`${SLUG}.tsx`)
const region = (name) => {
  const a = src.indexOf(`// #region ${name}\n`)
  const b = src.indexOf(`// #endregion ${name}\n`)
  assert.ok(a > -1 && b > a, `region ${name} missing`)
  return src.slice(a, b)
}

/* ---------- nothing travels with it ---------- */

const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "react is the only import")
assert.doesNotMatch(src, /@import|@font-face|<link\b|fetch\(|new Image\(/, "nothing loads at runtime")
assert.doesNotMatch(src, /https?:\/\//, "no URLs at all, so it renders in the capture sandbox")
assert.ok(src.includes('height = "100svh"'), "height defaults to a definite length")
assert.match(src, /"--mjt-h": height/, "the height prop reaches the root")
assert.match(src, /\.mjt-root\{[^}]*min-height:var\(--mjt-h\)/, "and sets its floor")
assert.match(src, /\.mjt-hero\{[^}]*min-height:var\(--mjt-h\)/, "the hero has a definite height")
assert.match(src, /\.mjt-sky\{position:sticky;top:0;height:var\(--mjt-h\);margin-bottom:calc\(var\(--mjt-h\) \* -1\)/, "the painted sky is a sticky backdrop of definite height")
assert.match(src, /\.mjt-cards\{[^}]*height:clamp\(/, "the photo row has a definite height, so the canvases inside it never collapse")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")
assert.match(src, /React\.useId\(\)\.replace/, "ids are namespaced per instance")
assert.doesNotMatch(src.slice(0, src.indexOf("</")), /use(State|Ref|Memo|Callback)<|Partial<|Record<|Array<|Map<|React\.[A-Za-z]+<|\[K in /, "no generics before the JSX (21st CLI tokenizer)")
assert.doesNotMatch(src, /use(State|Ref|Memo|Callback)</, "hooks are typed without <generics>")
assert.match(src, /matchMedia\("\(prefers-reduced-motion: reduce\)"\)/, "reduced motion is read in JS (the rotation, the scrolling)")
assert.doesNotMatch(src, /[—–]/, "no em or en dashes anywhere")
assert.doesNotMatch(src, />[^<{]*\\u[0-9a-f]{4}/i, "no \\u escapes inside JSX text (they print literally)")
assert.match(src, /style=\{\{ maxWidth: "none" \}\}/, "your own images are guarded against Preflight")

const css = src.match(/const MJT_CSS = `([\s\S]*?)`/)
assert.ok(css, "CSS block present")
assert.doesNotMatch(css[1], /\$\{|`/, "no interpolation inside the CSS string")
assert.doesNotMatch(css[1], /url\(/, "no url() in the style block")
assert.ok(css[1].includes("prefers-reduced-motion:reduce"), "honours reduced motion in CSS")
for (const m of css[1].replace(/\/\*[\s\S]*?\*\//g, "").replace(/@media[^{]*\{/g, "").replace(/@keyframes[^{]*\{/g, "").matchAll(/(?<=^|[{}])\s*([^{}@]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (/^(from|to|[\d.,%\s]+)$/.test(sel)) continue
  for (const s of sel.split(/,(?![^(]*\))/)) assert.match(s.trim(), /^\.mjt-/, `selector escapes the component: ${s.trim()}`)
}
assert.match(css[1], /\.mjt-root :where\(svg,canvas,img\)\{display:block;max-width:none\}/, "media are guarded against Preflight")
assert.match(css[1], /\.mjt-root\{[^}]*overflow-x:clip/, "the root clips sideways without breaking the sticky sky and dock")
assert.doesNotMatch(css[1], /\.mjt-root\{[^}]*overflow:hidden/, "overflow:hidden on the root would break the sticky sky")
assert.match(css[1], /\.mjt-dockwrap\{position:sticky/, "the dock sticks")
assert.match(css[1], /\.mjt-root\[data-theme="dark"\]\{/, "a designed dark theme")

/* ---------- it behaves like a product page ---------- */

for (const k of ["home", "profile", "photos", "archive", "guestbook"]) assert.ok(src.includes(`data-sec="${k}"`) || src.includes(`"${k}"`), `section ${k} is addressable`)
assert.match(src, /scrollIntoView\(\{ behavior: reduced \? "auto" : "smooth", block: "start" \}\)/, "the tabs scroll, instantly under reduced motion")
assert.match(src, /role="scrollbar"/, "the pill under the board is a real scrollbar")
assert.match(src, /document\.addEventListener\("scroll", on, \{ capture: true, passive: true \}\)/, "it follows any scrolling ancestor, not just the window")
assert.match(src, /const run = interval > 0 && list\.length > 1 && !reduced/, "entries only rotate without reduced motion")
assert.match(src, /onAnimationEnd=\{\(\) => run && !prefersReduced\(\) && go\(ei \+ 1\)\}/, "the dot's fill is the timer, so pausing it pauses the rotation")
assert.match(src, /data-paused=\{hold \|\| menu \|\| lb \|\| !heroSeen\.now/, "and it pauses on hover, focus, menus, the lightbox and off screen")
assert.match(src, /mood: night \? "night" : entry\.mood/, "night mode paints the sky at night")
assert.match(src, /if \(res === false\) ok = false/, "onReply and onNote can refuse")
assert.match(src, /aria-modal="true"/, "the lightbox is a modal dialog")
assert.match(src, /role="menu"/, "more opens a menu")
assert.match(src, /e\.key === "Escape"/, "Escape closes")
assert.match(src, /class MusicBox/, "the music card plays")
assert.match(src, /if \(this\.ctx\) void this\.ctx\.close\(\)/, "and releases its audio on unmount")
assert.match(src, /queuePaint\(/, "canvases paint one batch per frame")
assert.match(src, /useOnScreen\(wrap, "200px"\)\.seen/, "and only when they come near the screen")
assert.ok(read("demo.tsx").includes("<MeadowJournalTemplate />"), "default demo is the component, full bleed")
assert.doesNotMatch(read("demo.tsx"), /<div/, "default demo has no wrapper")
assert.match(read("demo-granja.tsx"), /locale="es-ES"/, "the second demo reprints the page in Spanish")
assert.match(read("demo-granja.tsx"), /palette="sage"/, "in another palette")
assert.doesNotMatch(read("demo-granja.tsx"), /https?:\/\//, "and stays capture-safe")

/* ---------- logic, executed ---------- */

const code = region("content") + region("painter") + region("logic") +
  "\nexport { DEFAULT_ENTRIES, DEFAULT_ARCHIVE, DEFAULT_PHOTOS, DEFAULT_LABELS, SCENES, SCENE_NAMES, PALETTES, paintScene, rng, mix, tone, resolvePalette, richParts, plain, fill, compact, grouped, mmss, clockParts, fmtDate, monthLabel, mergeEntries, months, filterEntries, categories, nextIndex, scrubState, scrubDelta, noteAt, hash }\n"
const L = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(code)))

// the painter runs every scene in every mood against a recording context, and stays in the frame
function fakeCtx() {
  const calls = { fill: 0, stroke: 0, arc: 0, bad: 0 }
  const grad = { addColorStop: (o, c) => { if (!(o >= 0 && o <= 1) || typeof c !== "string" || /NaN|undefined/.test(c)) calls.bad++ } }
  const num = (...a) => { for (const v of a) if (typeof v === "number" && !Number.isFinite(v)) calls.bad++ }
  const ctx = new Proxy({}, {
    get(_, k) {
      if (k === "calls") return calls
      if (k === "createLinearGradient" || k === "createRadialGradient") return (...a) => (num(...a), grad)
      if (k === "fill") return () => calls.fill++
      if (k === "stroke") return () => calls.stroke++
      if (k === "arc" || k === "ellipse") return (...a) => (num(...a), calls.arc++)
      return (...a) => num(...a)
    },
    set(_, k, v) {
      if ((k === "fillStyle" || k === "strokeStyle") && typeof v === "string" && /NaN|undefined/.test(v)) calls.bad++
      if (k === "lineWidth" && !(v > 0)) calls.bad++
      return true
    },
  })
  return ctx
}
for (const name of L.SCENE_NAMES) {
  for (const mood of ["day", "golden", "night"]) {
    for (const [w, h] of [[640, 400], [300, 420], [1920, 1080]]) {
      const ctx = fakeCtx()
      L.paintScene(ctx, w, h, name, mood, 7)
      assert.equal(ctx.calls.bad, 0, `${name} ${mood} ${w}x${h} paints only finite values and real colours`)
      assert.ok(ctx.calls.fill > 40, `${name} ${mood} paints something`)
    }
  }
}
// the same seed paints the same picture
const trace = (seed) => {
  const out = []
  const ctx = new Proxy({}, { get: (_, k) => (k === "createLinearGradient" || k === "createRadialGradient" ? () => ({ addColorStop() {} }) : (...a) => out.push(k + a.map((v) => (typeof v === "number" ? v.toFixed(2) : "")).join(","))), set: () => true })
  L.paintScene(ctx, 400, 300, "meadow", "day", seed)
  return out.join(";")
}
assert.equal(trace(3), trace(3), "seeded")
assert.notEqual(trace(3), trace(4), "and a new seed grows a new meadow")
const R = L.rng(5)
for (let i = 0; i < 1000; i++) { const v = R(); assert.ok(v >= 0 && v < 1) }
assert.equal(L.mix("#000000", "#ffffff", 0.5), "#808080")
assert.equal(L.tone("#336699", "day"), "#336699", "day is the colour as given")
assert.notEqual(L.tone("#336699", "night"), "#336699", "night relights it")

// every default picture names a real scene
for (const e of L.DEFAULT_ENTRIES.concat(L.DEFAULT_ARCHIVE)) {
  assert.ok(L.SCENE_NAMES.includes(e.scene), e.id + " scene")
  for (const s of e.shots || []) assert.ok(L.SCENE_NAMES.includes(s.scene), e.id + " shot")
  assert.match(e.date, /^\d{4}-\d{2}-\d{2}$/)
}
for (const p of L.DEFAULT_PHOTOS) assert.ok(L.SCENE_NAMES.includes(p.scene) && p.caption && p.alt, p.id)

// rich text
assert.deepEqual(L.richParts("on **a little farm** in Canada"), [{ text: "on ", bold: false }, { text: "a little farm", bold: true }, { text: " in Canada", bold: false }])
assert.deepEqual(L.richParts("**all**"), [{ text: "all", bold: true }])
assert.equal(L.plain("Liked by **you**"), "Liked by you")
assert.equal(L.fill("Sent to {name}. {missing}", { name: "Mara" }), "Sent to Mara. {missing}")

// numbers, times and dates
assert.equal(L.compact(980), "980")
assert.equal(L.compact(25400), "25.4 K")
assert.equal(L.compact(25000000), "25 M", "the reference's '25 M'")
assert.equal(L.compact(999999), "1 M", "rounds up into millions, never '1000 K'")
assert.equal(L.grouped(1234567), "1,234,567")
assert.equal(L.mmss(183), "03:03")
assert.equal(L.mmss(-4), "00:00")
const d = new Date(Date.UTC(2026, 9, 12, 14, 30))
assert.deepEqual(L.clockParts(d, "en-US", true, "UTC"), { hour: "2", minute: "30", period: "pm" })
assert.deepEqual(L.clockParts(d, "en-US", false, "UTC"), { hour: "14", minute: "30", period: "" })
assert.deepEqual(L.clockParts(d, "en-US", true, "Not/AZone").minute, "30", "a bad zone falls back instead of throwing")
assert.equal(L.fmtDate("2026-10-12", "en-US"), "Oct 12")
assert.equal(L.fmtDate("2026-01-01", "en-US", true), "Jan 1, 2026", "dates never slip a day across zones")
assert.equal(L.monthLabel("2026-09", "en-US"), "September 2026")
assert.equal(L.monthLabel("2026-09", "es-ES").charAt(0), "S", "capitalised in any language")

// archive
const all = L.mergeEntries(L.DEFAULT_ENTRIES, L.DEFAULT_ARCHIVE.concat([L.DEFAULT_ENTRIES[0]]))
assert.equal(all.length, L.DEFAULT_ENTRIES.length + L.DEFAULT_ARCHIVE.length, "no duplicates")
for (let i = 1; i < all.length; i++) assert.ok(all[i - 1].date >= all[i].date, "newest first")
const ms = L.months(all)
assert.equal(ms.reduce((a, m) => a + m.count, 0), all.length)
assert.equal(ms[0].key, "2026-10")
assert.equal(L.filterEntries(all, "", "canoe").length, 1)
assert.equal(L.filterEntries(all, "", "CLIFFS red").length, 1, "every word, any case, any order")
assert.equal(L.filterEntries(all, "2026-09", "").length, all.filter((e) => e.date.startsWith("2026-09")).length)
assert.equal(L.filterEntries([{ id: "x", date: "2026-01-01", place: "Peñas", text: "café", likes: 1 }], "", "penas cafe").length, 1, "accents fold")
assert.deepEqual(L.categories(L.DEFAULT_PHOTOS), ["Fields", "Water", "Golden hour", "Night"])

// palettes and contrast: small text on the cards stays readable
const lum = (hex) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4))
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
}
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort(); return (y + 0.05) / (x + 0.05) }
for (const [name, p] of Object.entries(L.PALETTES)) {
  assert.ok(ratio("#fbfbf6", p.olive) >= 4.5, name + " messages card text")
  assert.ok(ratio("#fbfbf6", p.deep) >= 4.5, name + " music card text")
  assert.ok(ratio(p.ink, p.panel) >= 4.2, name + " bold ink on the panel")
  assert.ok(ratio("#ffffff", p.panel) >= 3, name + " large white type on the panel")
}
assert.equal(L.resolvePalette("dusk"), L.PALETTES.dusk)
assert.equal(L.resolvePalette("nope"), L.PALETTES.periwinkle)
assert.equal(L.resolvePalette({ panel: "#111111", deep: "#222222", olive: "#333333" }).ink, "#1c2036")

// the scrubber
assert.deepEqual(L.scrubState(0, 4000, 1000), { p: 0, s: 0.25 })
assert.deepEqual(L.scrubState(3000, 4000, 1000), { p: 1, s: 0.25 })
assert.deepEqual(L.scrubState(9000, 4000, 1000), { p: 1, s: 0.25 }, "clamped")
assert.equal(L.scrubState(0, 100000, 800).s, 0.08, "the thumb never shrinks below grabbing size")
assert.equal(L.scrubState(0, 600, 800).p, 0, "a page shorter than the screen does not divide by zero")
assert.equal(L.scrubDelta(300, 1000, 0.25, 4000, 1000), 1200, "dragging the thumb across its free track scrolls the whole page")
assert.equal(L.scrubDelta(10, 100, 1, 800, 800), 0)

// the music box score: real notes, in range, deterministic, with a melody
const seed = L.hash("Clover HoursJune Arbor")
let melody = 0
for (let s = 0; s < 64; s++) {
  const n = L.noteAt(s, 2, seed)
  assert.deepEqual(n, L.noteAt(s, 2, seed))
  assert.ok(n.length >= 1 && n.length <= 3)
  for (const [m, v] of n) assert.ok(Number.isInteger(m) && m >= 40 && m <= 100 && v > 0 && v <= 0.25)
  if (n.some(([m]) => m >= 57 + 2 + 12 + 4)) melody++
}
assert.ok(melody > 6, "there is a tune over the arpeggio")
assert.equal(L.noteAt(0, 2, seed)[0][0] % 12, (57 + 2) % 12, "each loop starts on the key's root")
assert.equal(L.nextIndex(0, "ArrowLeft", 4), 3)
assert.equal(L.nextIndex(3, "ArrowRight", 4), 0)
assert.equal(L.nextIndex(1, "x", 4), -1)

// labels: every key the type declares has a default
const typeKeys = [...src.match(/export type MjtLabels = \{([\s\S]*?)\n\}/)[1].matchAll(/^\s+(\w+)\?:/gm)].map((m) => m[1])
for (const k of typeKeys) assert.ok(k in L.DEFAULT_LABELS, "default label " + k)

console.log(`ok - ${SLUG}`)
