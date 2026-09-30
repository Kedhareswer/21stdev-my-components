// Runnable check for components/contribution-skyline: the date grid, stats,
// levels, the morph's timing and camera, and the install-safety rules.
// Run: node tests/contribution-skyline.test.mjs
//
// What breaks silently here is calendar maths and the morph: a grid that
// drifts a day in some timezone, a streak that forgets today isn't over, a bar
// that is still rising when the morph ends (the 3D view would never settle), or
// a camera that tilts the flat view.
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const read = (file) =>
  readFileSync(new URL("../components/contribution-skyline/" + file, import.meta.url), "utf8").replace(/\r\n/g, "\n")
const src = read("contribution-skyline.tsx")

const start = src.indexOf("// #region contributions")
const end = src.indexOf("// #endregion")
assert.ok(start > -1 && end > start, "region markers missing")
const C = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(src.slice(start, end))))

const near = (a, b, eps = 1e-9) => Math.abs(a - b) < eps
const END = C.dayMs("2017-11-08")

// ---- dates are calendar days, never shifted by the host's timezone ----------
{
  assert.equal(C.toKey(C.dayMs("2017-11-08")), "2017-11-08")
  assert.equal(C.toKey(C.dayMs("2017-11-08T23:59:00")), "2017-11-08", "a timestamp string keeps its calendar day")
  assert.equal(C.dayMs(C.dayMs("2020-02-29") + 5000), C.dayMs("2020-02-29"), "numbers floor to their UTC day")
  assert.equal(C.toKey(C.dayMs(new Date(2024, 2, 10, 23, 30))), "2024-03-10", "Date objects use their local day")
}

// ---- the grid: whole weeks, ends on the end date, one year back -------------
for (const weekStart of [0, 1]) {
  const g = C.buildGrid([], END, weekStart)
  const first = C.dayMs(g.cells[0].date)
  assert.equal(new Date(first).getUTCDay(), weekStart, "column 0 starts on weekStart")
  assert.equal(g.cells.at(-1).date, "2017-11-08")
  assert.ok(first <= END - 364 * C.DAY_MS && first > END - 371 * C.DAY_MS, "a year, rounded back to a week")
  assert.ok(g.weeks === 53 || g.weeks === 54)
  g.cells.forEach((c, i) => {
    assert.equal(c.week, Math.floor(i / 7))
    assert.equal(c.day, i % 7)
    assert.equal(new Date(C.dayMs(c.date)).getUTCDay(), (weekStart + c.day) % 7, "row = weekday")
    if (i) assert.equal(C.dayMs(c.date) - C.dayMs(g.cells[i - 1].date), C.DAY_MS, "no skipped or doubled days (DST)")
  })
}

// ---- data: repeated dates add up, junk is ignored, levels follow counts ------
{
  const g = C.buildGrid(
    [
      { date: "2017-11-08", count: 3 },
      { date: "2017-11-08", count: 2 },
      { date: "2017-11-07", count: -4 },
      { date: "nonsense", count: 9 },
      { date: "2017-11-06", count: Number.NaN },
      { date: "2010-01-01", count: 50 },
    ],
    END,
  )
  assert.equal(g.cells.at(-1).count, 5)
  assert.equal(g.cells.at(-2).count, 0)
  assert.equal(g.max, 5, "out-of-range days don't count")
  assert.equal(C.computeStats(g.cells).total, 5)
  assert.equal(C.levelOf(0, 10), 0)
  assert.equal(C.levelOf(1, 10), 1)
  assert.equal(C.levelOf(5, 10), 3)
  assert.equal(C.levelOf(10, 10), 4)
  assert.equal(C.levelOf(500, 10), 4, "past busy is still the top level")
  assert.equal(C.levelOf(3, 0), 4)
  const gen = C.buildGrid(C.generateContributions(END, 7), END)
  for (const c of gen.cells) assert.ok(c.level >= 0 && c.level <= 4 && (c.level === 0) === (c.count === 0))
  const counts = [1, 2, 3, 4].map((l) => gen.cells.filter((c) => c.level === l).length)
  assert.ok(counts[0] > counts[3], "most active days are light, like a real graph")
  assert.deepEqual(C.generateContributions(END, 7), C.generateContributions(END, 7), "the sample year is deterministic")
}

// ---- stats ---------------------------------------------------------------------
{
  const days = (list) => list.map((count, i) => ({ date: "d" + i, count, level: 0, week: 0, day: 0 }))
  let s = C.computeStats(days([0, 2, 3, 0, 1, 1, 1, 0, 5, 4]))
  assert.equal(s.total, 17)
  assert.deepEqual(s.busiest, { count: 5, date: "d8" })
  assert.deepEqual(s.longest, { days: 3, start: "d4", end: "d6" })
  assert.deepEqual(s.current, { days: 2, start: "d8", end: "d9" })
  s = C.computeStats(days([1, 1, 1, 0]))
  assert.deepEqual(s.current, { days: 3, start: "d0", end: "d2" }, "an empty today doesn't break the streak yet")
  s = C.computeStats(days([1, 0, 0]))
  assert.equal(s.current.days, 0, "two empty days do")
  s = C.computeStats([])
  assert.equal(s.total, 0)
  assert.equal(s.busiest.date, null)
  assert.equal(s.current.days, 0)
}

// ---- month labels ----------------------------------------------------------------
{
  const g = C.buildGrid([], END)
  const m = C.monthLabels(g.cells, g.weeks)
  assert.ok(m.length >= 12 && m.length <= 13)
  for (let i = 1; i < m.length; i++) assert.ok(m[i].week - m[i - 1].week >= 3, "labels never crowd")
  assert.equal(m.at(-1).label, "Nov")
}

// ---- the morph: every bar starts flat and finishes up ------------------------------
{
  for (const weeks of [1, 53, 54]) {
    for (const week of [0, Math.floor(weeks / 2), weeks - 1]) {
      for (const day of [0, 6]) {
        assert.equal(C.riseAt(0, week, weeks, day), 0, "flat at the start")
        assert.equal(C.riseAt(1, week, weeks, day), 1, `week ${week}/${weeks} is fully up when the morph ends`)
        let prev = -1
        for (let t = 0; t <= 1; t += 0.01) {
          const r = C.riseAt(t, week, weeks, day)
          assert.ok(r >= prev - 1e-12 && r >= 0 && r <= 1, "rises monotonically")
          prev = r
        }
      }
    }
  }
  assert.ok(C.riseAt(0.3, 0, 53, 0) > C.riseAt(0.3, 52, 53, 0), "the wave runs oldest → newest")
  assert.ok(C.barHeight(0, 10) > 0, "empty days are slabs, not holes")
  assert.ok(C.barHeight(1, 10) > C.barHeight(0, 10))
  assert.ok(near(C.barHeight(10, 10, 2) - 0.4, 2 * (C.barHeight(10, 10) - 0.4)), "heightScale scales the bar, not the base")
  assert.equal(C.barHeight(3, 0), 0.2)
}

// ---- camera ------------------------------------------------------------------------
{
  const flat = C.camera(0, 0.3, -0.2)
  for (const [x, y, z] of [[3, 4, 0], [10, 2, 7]]) {
    const p = C.project(flat, x, y, z)
    assert.ok(near(p[0], x) && near(p[1], y), "e=0 is a plain top-down grid; orbit and height are invisible")
  }
  const iso = C.camera(1)
  const ax = C.project(iso, 1, 0, 0)
  assert.ok(near(Math.atan2(ax[1], ax[0]), Math.atan(Math.sin(C.ELEV_3D))), "weeks run down-right")
  assert.ok(C.project(iso, 0, 0, 1)[1] < 0, "up is up")
  for (let e = 0; e <= 1; e += 0.05) {
    for (const [dy, de] of [[0, 0], [1, 1], [-1, -1]]) {
      const c = C.camera(e, dy, de)
      assert.ok(c.sn >= -1e-12 && c.cs >= -1e-12, "yaw stays in [0°, 90°] so painter's order by depth holds")
      assert.ok(c.se > 0 && c.ce >= -1e-12, "never looks from below")
    }
  }
  const c = C.camera(1)
  assert.ok(C.depthOf(c, 5, 6) > C.depthOf(c, 5, 5) && C.depthOf(c, 6, 5) > C.depthOf(c, 5, 5), "front rows are drawn last")
}

// ---- colour ----------------------------------------------------------------------------
{
  assert.deepEqual(C.mixRGB([0, 0, 0], [255, 255, 255], 0.5), [127.5, 127.5, 127.5])
  assert.ok(C.luminance([255, 255, 255]) > 0.99 && C.luminance([0, 0, 0]) === 0)
  for (const name of Object.keys(C.PALETTES)) {
    for (const dark of [false, true]) assert.equal(C.resolvePalette(name, dark).length, 4, name)
  }
  assert.deepEqual(C.resolvePalette(["#111", "#222"], false), ["#111", "#222", "#222", "#222"], "short lists repeat their last colour")
  assert.deepEqual(C.resolvePalette({ light: ["a", "b", "c", "d"], dark: ["e", "f", "g", "h"] }, true), ["e", "f", "g", "h"])
  assert.deepEqual(C.resolvePalette("nope", false), C.PALETTES.github.light, "unknown names fall back")
}

// ---- install safety -----------------------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "the only import may be react")
assert.doesNotMatch(src, /https?:\/\//, "no external origins")
assert.doesNotMatch(src, /@import|<style/, "styles are Tailwind + inline, nothing global")
assert.doesNotMatch(src, /\bh-(full|screen)\b/, "no percentage-height classes")
assert.ok(src.includes('maxWidth: "none"'), "canvas and icons are guarded against Preflight's max-width")
for (const token of ["--color-background, ", "--color-foreground, ", "--color-border, ", "--color-muted-foreground, "]) {
  assert.ok(src.includes("var(" + token), `${token.slice(0, -2)} carries a literal fallback`)
}

// cleanup: everything the engine attaches comes back off
for (const ev of ["pointerdown", "pointermove", "pointerup", "pointercancel", "pointerleave", "dblclick", "keydown", "blur"]) {
  assert.ok(src.includes('canvas.addEventListener("' + ev + '"') && src.includes('canvas.removeEventListener("' + ev + '"'), ev)
}
for (const gone of ["cancelAnimationFrame(raf)", "io?.disconnect()", "ro.disconnect()", "mo.disconnect()", 'reduceMq.removeEventListener("change"', 'darkMq.removeEventListener("change"']) {
  assert.ok(src.includes(gone), `cleanup is missing ${gone}`)
}

// motion: reduced motion snaps the morph, orbit, colours and hover
assert.ok(src.includes('matchMedia("(prefers-reduced-motion: reduce)")'))
assert.ok(src.includes("const step = reduced ? 1 :"), "reduced motion jumps the morph")
assert.ok((src.match(/reduced \? 1 : 1 - Math\.exp/g) ?? []).length >= 4, "orbit, colour, hover and dim all snap under reduced motion")
assert.ok((src.match(/motion-reduce:transition-none/g) ?? []).length >= 5, "DOM transitions honour reduced motion")

// accessibility
assert.ok(src.includes("tabIndex={0}") && src.includes('role="img"'), "the chart is focusable and labelled")
assert.ok(src.includes('aria-live="polite"'), "keyboard moves are announced")
assert.ok(src.includes("aria-pressed={view === v}"), "the view toggle reports its state")
for (const key of ['"ArrowLeft"', '"ArrowRight"', '"ArrowUp"', '"ArrowDown"', '"Home"', '"End"', '"Escape"']) assert.ok(src.includes(key), key)

// Demos import the installer path and keep a width inside 21st's centring flex.
for (const f of ["demo.tsx", "demo-palettes.tsx"]) {
  const demo = read(f)
  assert.ok(demo.includes('from "@/components/ui/contribution-skyline"'), `${f} imports the installer path`)
  assert.ok(/className="w-full/.test(demo), `${f}: the outer wrapper has a width`)
  assert.doesNotMatch(demo, /\bh-full\b/)
}

console.log("contribution-skyline: ok")
