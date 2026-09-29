// Runnable check for the scroll → layout mapping in components/scroll-milestone-timeline,
// plus the install-safety rules the .tsx has to keep.
// Run: node tests/scroll-milestone-timeline.test.mjs
//
// What breaks silently here is geometry: a slot that ignores the unit of `at`
// crams a timeline into a corner, a last event whose reveal outruns the pen
// never finishes typing, and a pan that overshoots slides the track off screen.
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const read = (file) =>
  readFileSync(new URL("../components/scroll-milestone-timeline/" + file, import.meta.url), "utf8").replace(/\r\n/g, "\n")
const src = read("scroll-milestone-timeline.tsx")

const start = src.indexOf("// #region timeline")
const end = src.indexOf("// #endregion")
assert.ok(start > -1 && end > start, "timeline region markers missing")
const T = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(src.slice(start, end))))

const seasons = [
  { at: 0, date: "W17", title: "Work Starts", color: "#e0643a", level: 2 },
  { at: 1, date: "Sp18", title: "Motion Router\nNon-Exponential", level: 5 },
  { at: 2, date: "Su18", title: "MIT", color: "#f0ae78", level: 4 },
  { at: 2, date: "Su18", title: "Geometry", level: 3 },
  { at: 8, date: "W19", title: "Runtime VM", level: 1 },
]

// ---- progress comes off the element and clamps ----------------------------
{
  assert.equal(T.progressFrom(0, 5000, 800), 0)
  assert.equal(T.progressFrom(-4200, 5000, 800), 1)
  assert.equal(T.progressFrom(300, 5000, 800), 0, "before it arrives")
  assert.equal(T.progressFrom(-1e6, 5000, 800), 1, "after it leaves")
  assert.equal(T.progressFrom(-10, 600, 800), 0, "no travel, no progress — never a negative divide")
}

// ---- events resolve: sorted, sided, levelled -----------------------------
{
  const r = T.resolveEvents([{ at: 3, date: "b", title: "b" }, { at: 1, date: "a", title: "a", color: "red" }, { at: NaN, date: "x", title: "x" }])
  assert.deepEqual(r.map((e) => e.date), ["a", "b"], "sorted by at, non-finite dropped")
  assert.deepEqual(r.map((e) => e.source), [1, 0], "source keeps the input index for callbacks")
  assert.equal(r[0].side, "above", "a coloured event is a milestone above the axis")
  assert.equal(r[1].side, "below", "a plain one is a note below")
  assert.equal(T.resolveEvents([{ at: 0, date: "", title: "", level: 99 }])[0].level, 8, "levels clamp")
  const same = T.resolveEvents([{ at: 1, date: "first", title: "" }, { at: 1, date: "second", title: "" }])
  assert.deepEqual(same.map((e) => e.date), ["first", "second"], "ties keep input order")
}

// ---- the slot is per closest pair, whatever the unit ----------------------
{
  assert.equal(T.stepOf([0, 1, 2, 2, 8]), 1)
  assert.equal(T.stepOf([2019, 2019.5, 2021]), 0.5)
  assert.equal(T.stepOf([4]), 1, "one event, no NaN")
  assert.equal(T.stepOf([]), 1)
  const ev = T.resolveEvents(seasons)
  const a = T.layoutTimeline(ev, 1280, 800)
  const halves = T.resolveEvents(seasons.map((e) => ({ ...e, at: 2017 + e.at / 2 })))
  const b = T.layoutTimeline(halves, 1280, 800)
  assert.deepEqual(a.items.map((i) => i.x), b.items.map((i) => i.x), "rescaling `at` does not change the drawing")
  assert.equal(a.items[2].x, a.items[3].x, "same `at`, same stem position")
}

// ---- layout stays on the stage -------------------------------------------
{
  const ev = T.resolveEvents(seasons)
  for (const [w, h] of [[390, 844], [768, 1024], [1280, 800], [1920, 1080], [1100, 560]]) {
    const L = T.layoutTimeline(ev, w, h)
    assert.ok(L.slot >= 104 && L.slot <= 136, `slot ${L.slot} at ${w}`)
    assert.ok(L.rowGap >= 20 && L.rowGap <= 52, `rowGap ${L.rowGap} at ${h}`)
    for (const it of L.items) {
      assert.ok(it.dotY > 40 && it.dotY < h - 40, `dot ${it.dotY} off a ${h}px stage`)
      assert.ok(it.stemHeight >= 0 && Number.isFinite(it.x))
      assert.ok(it.x < L.axisEnd - L.revealSpan, "every event finishes writing before the pen stops")
    }
    const above = ev.map((e, i) => [e, L.items[i]]).filter(([e]) => e.side === "above")
    for (const [, it] of above) assert.ok(it.dotY < L.axisY && it.stemTop + it.stemHeight === L.axisY, "above stems end on the axis")
  }
  const empty = T.layoutTimeline([], 1280, 800)
  assert.ok(Number.isFinite(empty.trackWidth) && empty.items.length === 0, "no events, no NaN")
}

// ---- pen, reveal, phases ---------------------------------------------------
{
  const L = { axisStart: 0, axisEnd: 1000 }
  assert.equal(T.playheadAt(0, L), 0)
  assert.equal(T.playheadAt(1, L), 1000)
  assert.equal(T.playheadAt(1 - T.OUTRO, L), 1000, "the last stretch is a hold")
  for (const ph of [0, 123, 640, 1000]) assert.ok(Math.abs(T.playheadAt(T.progressForPlayhead(ph, L), L) - ph) < 1e-9, "inverse")
  assert.equal(T.progressForPlayhead(5, { axisStart: 0, axisEnd: 0 }), 0)
  assert.equal(T.revealAt(99, 100, 50), 0)
  assert.equal(T.revealAt(150, 100, 50), 1)
  assert.equal(T.revealAt(125, 100, 50), 0.5)
  const z = T.phasesOf(0)
  assert.deepEqual([z.stem, z.dot, z.label, z.pill, z.typed], [0, 0, 0, 0, 0], "nothing before the pen")
  const o = T.phasesOf(1)
  for (const k of ["stem", "dot", "label", "pill", "typed"]) assert.ok(Math.abs(o[k] - 1) < 1e-9, `${k} lands at 1`)
  let prev = -1
  for (let r = 0; r <= 1; r += 0.01) {
    const f = T.phasesOf(r)
    assert.ok(f.typed >= prev, "typing never runs backwards while scrolling forwards")
    prev = f.typed
    assert.ok(f.dot < 1.2, "the pop overshoots a little, not a lot")
  }
  assert.equal(T.typedCount("hello", 0), 0)
  assert.equal(T.typedCount("hello", 1), 5)
  assert.equal(T.typedCount("hello", 0.01), 1, "a started line shows its first character")
  assert.equal(T.typedCount("", 0.5), 0)
}

// ---- pan and active ---------------------------------------------------------
{
  assert.equal(T.panFor(0, 800, 1280), 240, "a track that fits is centred")
  assert.equal(T.panFor(0, 1200, 390), 16, "a wide one starts at the gutter")
  assert.equal(T.panFor(1e6, 1200, 390), 390 - 1200 - 16, "and stops with its end at the other gutter")
  for (let ph = 0; ph < 1300; ph += 7) {
    const x = T.panFor(ph, 1200, 390)
    assert.ok(x <= 16 && x >= 390 - 1200 - 16)
  }
  assert.equal(T.activeAt([]), -1)
  assert.equal(T.activeAt([1, 1, 0.4, 0]), 1)
  assert.equal(T.activeAt([1, 1, 1]), 2)
}

// ---- install safety --------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "the only import may be react")

const styleBlock = src.slice(src.indexOf("const styles = ["), src.indexOf('].join("\\n")'))
assert.ok(styleBlock.length > 20, "style block not found")
assert.doesNotMatch(styleBlock, /[`]|\$\{/, "no backticks or interpolation inside the CSS")
assert.doesNotMatch(styleBlock, /@import/, "no @import")
assert.doesNotMatch(styleBlock, /(^|["\n}])\s*(\*|body|html|:root)\s*\{/, "no bare global resets")
assert.ok(styleBlock.includes("prefers-reduced-motion"), "CSS motion must be opt-out")
assert.ok(/background:var\(--color-background,#[0-9a-f]+\);background:color-mix/.test(styleBlock), "color-mix has a plain fallback before it")

const code = src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1")
assert.doesNotMatch(code, /scrollY|pageYOffset/, "measure from the element, not the document")
assert.ok(src.includes("getBoundingClientRect"), "progress comes from the element's rect")
assert.ok(src.includes("new ResizeObserver"), "a resized stage must re-lay the track")
assert.ok(/\{ passive: true \}/.test(src), "scroll listeners must be passive")
for (const gone of ["cancelAnimationFrame(raf)", "observer.disconnect()", 'removeEventListener("scroll"', 'mq.removeEventListener("change"']) {
  assert.ok(src.includes(gone), `cleanup is missing ${gone}`)
}

// Height: the stage takes a definite length, the root's height is the scroll budget.
assert.ok(/height = "100svh"/.test(src), "stage height defaults to a definite length")
assert.ok(src.includes('"calc(" + (1 + Math.max(1, count) * scrollPerEvent)'), "root height derives from event count")
const root = src.slice(src.indexOf("<section"), src.indexOf("{/* The axis"))
assert.doesNotMatch(root, /\bh-(full|screen)\b/, "no percentage height classes on the root or stage")
assert.ok(src.includes('className="sticky top-0 w-full overflow-hidden" style={{ height }}'), "the stage is sticky at the height prop")
assert.ok(src.includes('maxWidth: "none"'), "the arrow svg is guarded against Preflight's max-width")

// Only the semantic tokens, each with a fallback.
for (const m of src.matchAll(/var\((--[a-z-]+)/g)) {
  if (m[1].startsWith("--color-")) {
    assert.ok(["--color-background", "--color-foreground", "--color-border"].includes(m[1]), `unexpected token ${m[1]}`)
  }
}
for (const m of src.matchAll(/var\(--color-[a-z-]+\)/g)) assert.fail(`token without fallback: ${m[0]}`)

// Accessibility: buttons carry the full text, the typed copy is hidden, the list exists as text.
assert.ok(src.includes('aria-label={e.date + ": " + e.title.replace(/\\n/g, " ")}'), "each event button has its full label")
assert.ok(src.includes('className="sr-only"'))
assert.ok(src.includes('aria-live="polite"'), "the counter announces the active event")
assert.ok(src.includes('type="button"'))
assert.ok(src.includes(':focus-visible")) goTo(i)'), "keyboard focus travels the timeline")
assert.ok(src.includes('behavior: reduced ? "auto" : "smooth"'), "reduced motion jumps without smoothing")

// The default data is the reference: ten events, five coloured milestones.
const defaults = src.slice(src.indexOf("const DEFAULT_EVENTS"), src.indexOf("]", src.indexOf("const DEFAULT_EVENTS: TimelineEvent[] = [") + 40) + 1)
assert.equal((defaults.match(/\{ at:/g) ?? []).length, 10)
assert.equal((defaults.match(/color: "#/g) ?? []).length, 5)

// Demo wrappers keep a width inside 21st's centring flex.
for (const f of ["demo.tsx", "demo-custom.tsx"]) {
  const demo = read(f)
  assert.ok(demo.includes('from "@/components/ui/scroll-milestone-timeline"'), `${f} imports the installer path`)
  for (const cls of demo.match(/className="[^"]*"/g) ?? []) {
    assert.ok(/\bw-(full|screen|\[|\d)/.test(cls), `${f}: ${cls} has no width`)
  }
}

console.log("scroll-milestone-timeline: ok")
