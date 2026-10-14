// Runnable check for components/open-slot-booking: the timezone-aware slot maths and
// the install-safety rules. Run: node tests/open-slot-booking.test.mjs
//
// What breaks silently in a scheduler: a slot that lands in the wrong column once the
// visitor's zone differs from the host's, a daylight-saving week that shifts every
// slot by an hour, busy time that fails to block, a week that opens empty, and an
// .ics file a calendar app refuses.
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const read = (file) =>
  readFileSync(new URL("../components/open-slot-booking/" + file, import.meta.url), "utf8").replace(/\r\n/g, "\n")
const src = read("open-slot-booking.tsx")

const start = src.indexOf("// #region schedule")
const end = src.indexOf("// #endregion")
assert.ok(start > -1 && end > start, "schedule region markers missing")
const T = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(src.slice(start, end))))

const key = (y, m, d) => Math.floor(Date.UTC(y, m - 1, d) / T.OSB_DAY)

// ---- clock maths ---------------------------------------------------------------
{
  assert.equal(T.osbMinutes("09:30"), 570)
  assert.equal(T.osbMinutes(" 17:00 "), 1020)
  assert.equal(T.osbMinutes("nonsense"), 0)

  // Lisbon is UTC+1 in summer time and UTC+0 in winter; New York -4 / -5.
  assert.equal(T.osbOffset(Date.UTC(2026, 9, 14, 12), "Europe/Lisbon"), 60)
  assert.equal(T.osbOffset(Date.UTC(2026, 11, 14, 12), "Europe/Lisbon"), 0)
  assert.equal(T.osbOffset(Date.UTC(2026, 9, 14, 12), "America/New_York"), -240)
  assert.equal(T.osbOffset(Date.UTC(2026, 9, 14, 12), "Asia/Kolkata"), 330)

  // 09:00 in Lisbon on 14 Oct 2026 is 08:00 UTC, and reads back as 09:00 Lisbon.
  const t = T.osbAt(key(2026, 10, 14), 540, "Europe/Lisbon")
  assert.equal(t, Date.UTC(2026, 9, 14, 8))
  const w = T.osbWall(t, "Europe/Lisbon")
  assert.equal(w.min, 540)
  assert.equal(w.dow, 3, "a Wednesday")
  assert.equal(w.key, key(2026, 10, 14))

  // Across the 25 Oct 2026 clock change the same wall time is a different UTC hour.
  assert.equal(T.osbAt(key(2026, 10, 26), 540, "Europe/Lisbon"), Date.UTC(2026, 9, 26, 9))

  // Weeks start where they are told to.
  assert.equal(T.osbWeekKey(Date.UTC(2026, 9, 14, 12), "Europe/Lisbon", 1), key(2026, 10, 12), "Monday start")
  assert.equal(T.osbWeekKey(Date.UTC(2026, 9, 14, 12), "Europe/Lisbon", 0), key(2026, 10, 11), "Sunday start")
}

// ---- slots ----------------------------------------------------------------------
const plan = {
  weekKey: key(2026, 10, 12),
  displayTz: "Europe/Lisbon",
  hostTz: "Europe/Lisbon",
  hours: { days: [1, 2, 3, 4, 5], from: "09:00", to: "17:00" },
  duration: 30,
  step: 30,
  now: Date.UTC(2026, 9, 1),
  noticeMin: 240,
  hostBusy: [],
  visitor: [],
  overlay: false,
}
{
  const all = T.osbSlots(plan)
  assert.equal(all.length, 5 * 16, "five days of sixteen half-hours")
  assert.ok(all.every((s) => s.state === "open"))
  assert.deepEqual([...new Set(all.map((s) => s.col))], [0, 1, 2, 3, 4], "Monday to Friday")
  assert.equal(all[0].min, 540)
  assert.equal(all[all.length - 1].min, 990, "the last half hour starts at 16:30")
  for (let i = 1; i < all.length; i++) assert.ok(all[i].start > all[i - 1].start, "sorted")

  // A 45-minute call on 30-minute steps cannot start at 16:30.
  const long = T.osbSlots({ ...plan, duration: 45 })
  assert.ok(long.every((s) => s.min + 45 <= 1020), "every slot ends by close")

  // Seen from New York the same slots move five hours earlier, same columns.
  const ny = T.osbSlots({ ...plan, displayTz: "America/New_York" })
  assert.equal(ny.length, all.length)
  assert.equal(ny[0].min, 240, "09:00 Lisbon is 04:00 in New York")
  assert.equal(ny[0].start, all[0].start, "same instants")

  // Seen from Kolkata a 16:30 Lisbon slot is 21:00 the same day.
  const ind = T.osbSlots({ ...plan, displayTz: "Asia/Kolkata" })
  assert.equal(ind[ind.length - 1].min, 21 * 60)

  // Seen from Auckland, Friday afternoon Lisbon is early Saturday: column 5.
  const akl = T.osbSlots({ ...plan, displayTz: "Pacific/Auckland" })
  assert.ok(akl.some((s) => s.col === 5), "slots cross into the visitor's Saturday")
  assert.ok(akl.every((s) => s.col >= 0 && s.col <= 6))
}
{
  // Host busy time blocks overlapping slots and nothing else.
  const busy = T.osbSlots({ ...plan, hostBusy: [{ weekday: 1, from: "10:00", to: "11:00" }] })
  const mon = busy.filter((s) => s.col === 0)
  const taken = mon.filter((s) => s.state === "taken").map((s) => s.min)
  assert.deepEqual(taken, [600, 630])
  assert.ok(busy.filter((s) => s.col !== 0).every((s) => s.state === "open"), "only Mondays")

  // A dated span blocks one day only.
  const dated = T.osbSlots({ ...plan, hostBusy: [{ start: "2026-10-14T13:00:00Z", end: "2026-10-14T14:00:00Z" }] })
  assert.deepEqual(dated.filter((s) => s.state === "taken").map((s) => [s.col, s.min]), [[2, 840], [2, 870]])

  // Notice: nothing before now + 4h.
  const now = Date.UTC(2026, 9, 14, 10)
  const soon = T.osbSlots({ ...plan, now })
  assert.ok(soon.filter((s) => s.start < now + 240 * 60000).every((s) => s.state === "past"))
  assert.ok(soon.filter((s) => s.start >= now + 240 * 60000).every((s) => s.state === "open"))

  // The overlay marks clashes with the visitor's own calendar, only while it is on.
  const visitor = [{ weekday: 3, from: "09:00", to: "10:00", title: "Gym" }]
  const off = T.osbSlots({ ...plan, visitor, overlay: false })
  assert.ok(off.every((s) => s.state === "open"))
  const on = T.osbSlots({ ...plan, visitor, overlay: true })
  const clash = on.filter((s) => s.state === "clash")
  assert.deepEqual(clash.map((s) => [s.col, s.min, s.clash]), [[2, 540, "Gym"], [2, 570, "Gym"]])
  // Weekly rules in the visitor's calendar are in the visitor's zone, not whatever zone they
  // chose to display: a 09:00 gym in Lisbon is 08:00 when the grid is shown in UTC.
  const utc = T.osbSlots({ ...plan, visitor, overlay: true, displayTz: "UTC", visitorTz: "Europe/Lisbon" })
  assert.deepEqual(utc.filter((s) => s.state === "clash").map((s) => s.min), [480, 510])
  const utcBlocks = T.osbBlocks(visitor, plan.weekKey, "UTC", "Europe/Lisbon")
  assert.deepEqual(utcBlocks.map((b) => [b.col, b.from, b.to]), [[2, 480, 540]])
  // host busy wins over a clash
  const both = T.osbSlots({ ...plan, visitor, overlay: true, hostBusy: [{ weekday: 3, from: "09:00", to: "09:30" }] })
  assert.equal(both.find((s) => s.col === 2 && s.min === 540).state, "taken")
}
{
  // Blocks land in the right column and are cut at midnight.
  const blocks = T.osbBlocks([{ weekday: 2, from: "10:00", to: "11:30", title: "Crit" }], plan.weekKey, "Europe/Lisbon")
  assert.deepEqual(blocks, [{ col: 1, from: 600, to: 690, title: "Crit" }])
  const late = T.osbBlocks([{ start: "2026-10-14T22:00:00Z", end: "2026-10-15T01:00:00Z", title: "Flight" }], plan.weekKey, "Europe/Lisbon")
  assert.deepEqual(late.map((b) => [b.col, b.from, b.to]), [[2, 1380, 1440], [3, 0, 120]])
}
{
  // The grid range is whole hours around the slots, with a sane default.
  assert.deepEqual(T.osbRange(T.osbSlots(plan), 30), [540, 1020])
  assert.deepEqual(T.osbRange([], 30), [540, 1020])

  // A week with nothing left opens on the next one instead of an empty grid.
  const friNight = Date.UTC(2026, 9, 16, 20)
  const p = { ...plan, now: friNight, weekKey: T.osbWeekKey(friNight, "Europe/Lisbon", 1) }
  assert.equal(T.osbFirstWeek(p, 6, 6), plan.weekKey + 7)
  assert.equal(T.osbFirstWeek(plan, 6, 6), plan.weekKey, "an open week stays")
}

// ---- small helpers --------------------------------------------------------------
{
  assert.equal(T.osbInk("#FFC629"), "#0B0D14", "dark text on the yellow slab")
  assert.equal(T.osbInk("#2F6BFF"), "#FFFFFF", "white text on the blue action")
  assert.equal(T.osbInk("#3FE0B5"), "#0B0D14")
  assert.equal(T.osbInk("not a colour"), "#0B0D14")
  assert.ok(T.osbEmailOk("ana@fieldwork.co"))
  assert.ok(!T.osbEmailOk("ana@fieldwork"))
  assert.ok(!T.osbEmailOk("ana fieldwork.co"))

  const ics = T.osbIcs({
    start: Date.UTC(2026, 9, 16, 9, 30),
    end: Date.UTC(2026, 9, 16, 10),
    title: "Partnership chat, with Maya",
    description: "Line one\nLine two; more",
    location: "Video call",
    uid: "x@y",
    stamp: Date.UTC(2026, 9, 14),
  })
  const lines = ics.split("\r\n")
  assert.equal(lines[0], "BEGIN:VCALENDAR")
  assert.equal(lines[lines.length - 1], "END:VCALENDAR")
  assert.ok(lines.includes("DTSTART:20261016T093000Z"))
  assert.ok(lines.includes("DTEND:20261016T100000Z"))
  assert.ok(lines.includes("SUMMARY:Partnership chat\\, with Maya"), "commas escaped")
  assert.ok(lines.includes("DESCRIPTION:Line one\\nLine two\\; more"), "newlines and semicolons escaped")
}

// ---- install safety -------------------------------------------------------------
{
  assert.ok(/height = "100svh"/.test(src), "the section carries a definite min-height default")
  assert.doesNotMatch(src, /className="[^"]*\bh-full\b/, "no h-full")
  assert.doesNotMatch(src, /@import/, "no @import: the host owns Tailwind and fonts")
  const css = src.slice(src.indexOf("const CSS = `") + 13, src.indexOf("`", src.indexOf("const CSS = `") + 13))
  assert.ok(css.length > 1000, "found the CSS block")
  assert.doesNotMatch(css, /\$\{/, "no interpolation inside the CSS string")
  assert.doesNotMatch(css, /(^|\})\s*(\*|body|html|:root)\s*[,{]/m, "no bare global selectors")
  for (const rule of css.split("}")) {
    const sel = rule.split("{")[0].trim()
    if (!sel || sel.startsWith("@") || /^(from|to|\d+%)/.test(sel)) continue
    for (const part of sel.split(/,(?![^(]*\))/)) assert.ok(/\.osb|^\s*\.dark \.osb/.test(part), "unscoped selector: " + part)
  }
  assert.ok(css.includes("prefers-reduced-motion"), "honours reduced motion")
  assert.ok(css.includes(".osb img{max-width:none}"), "guards Preflight on the avatar")
  assert.doesNotMatch(src, /use(State|Ref|Memo|Callback|Context)<|Record<|Array<|Promise<|Partial<|React\.[A-Za-z]+</, "no generics for the 21st CLI tokenizer")
  assert.doesNotMatch(src, /fetch\(|src="https?:|url\(\s*["']?https?:/, "nothing loads from the network")

  for (const demo of ["demo.tsx", "demo-lagoon.tsx"]) {
    const d = read(demo)
    assert.ok(d.includes('from "@/components/ui/open-slot-booking"'), demo + " imports the installed path")
    assert.match(d, /export default function (Demo|[A-Z]\w*)/, demo + " default-exports a capitalised function")
    assert.doesNotMatch(d, /\w<[A-Za-z{[]/, demo + " carries no generics for the 21st CLI tokenizer")
  }
  const ts = readFileSync(new URL("../tsconfig.json", import.meta.url), "utf8")
  assert.ok(ts.includes('"@/components/ui/open-slot-booking"'), "tsconfig path line")
}

console.log("open-slot-booking: ok")
