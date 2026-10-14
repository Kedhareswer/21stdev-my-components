// Install-safety and logic checks for components/callsign-radio-landing.
// Run: node tests/callsign-radio-landing.test.mjs
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const SLUG = "callsign-radio-landing"
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
assert.match(src, /"--cr-h": height/, "the height prop reaches the root")
assert.match(src, /\.cr-root\{[^}]*min-height:var\(--cr-h\)/, "and sets its floor")
assert.match(src, /\.cr-hero\{--cr-hh:calc\(clamp\(640px,var\(--cr-h\),1000px\)/, "the hero has a definite height")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")
assert.match(src, /React\.useId\(\)\.replace/, "ids are namespaced per instance")
assert.doesNotMatch(src.slice(0, src.indexOf("</")), /use(State|Ref|Memo|Callback)<|Partial<|Record<|React\.[A-Za-z]+</, "no generics before the JSX (21st CLI tokenizer)")
assert.doesNotMatch(src, /use(State|Ref|Memo|Callback)</, "hooks are typed without <generics>")
assert.match(src, /matchMedia\("\(prefers-reduced-motion: reduce\)"\)/, "reduced motion is read in JS (the meter)")
assert.doesNotMatch(src, /[—–]/, "no em or en dashes anywhere")
assert.doesNotMatch(src, />[^<{]*\\u[0-9a-f]{4}/i, "no \\u escapes inside JSX text (they print literally)")
assert.doesNotMatch(src, /autoPlay|autoplay/, "never autoplays")
assert.match(src, /<img src=\{image\} alt=\{alt \|\| ""\}/, "photos are opt-in through props")

const css = src.match(/const CR_CSS = `([\s\S]*?)`/)
assert.ok(css, "CSS block present")
assert.doesNotMatch(css[1], /\$\{|`/, "no interpolation inside the CSS string")
assert.doesNotMatch(css[1], /url\(/, "no url() in the style block")
assert.ok(css[1].includes("prefers-reduced-motion:reduce"), "honours reduced motion in CSS")
for (const m of css[1].replace(/\/\*[\s\S]*?\*\//g, "").replace(/@media[^{]*\{/g, "").replace(/@keyframes[^{]*\{/g, "").matchAll(/(?<=^|[{}])\s*([^{}@]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (/^(from|to|[\d.,%\s]+)$/.test(sel)) continue
  for (const s of sel.split(/,(?![^(]*\))/)) assert.match(s.trim(), /^\.cr-/, `selector escapes the component: ${s.trim()}`)
}
assert.match(css[1], /\.cr-root :where\(img\)\{max-width:none\}/, "images are guarded against Preflight")
assert.match(css[1], /\.cr-glyphs\{[^}]*max-width:none/, "and so are the glyph SVGs")
assert.match(css[1], /\.cr-root :where\(button,input\)\{/, "the reset has no specificity to fight")
assert.match(css[1], /\.cr-root\{[^}]*overflow-x:clip/, "the root clips sideways without breaking the sticky nav")
assert.doesNotMatch(css[1], /\.cr-root\{[^}]*overflow:hidden/, "overflow:hidden on the root would break the sticky nav")
assert.match(css[1], /\.cr-nav\{position:sticky/, "the nav sticks")
assert.match(css[1], /\.cr-dock\{position:sticky;bottom:12px/, "the mini player docks inside the component, not to the window")

/* ---------- it behaves like a station homepage ---------- */

for (const k of ["listen", "schedule", "residents", "archive", "support"]) assert.ok(src.includes(`data-sec="${k}"`), `section ${k} is addressable`)
assert.match(src, /scrollIntoView\(\{ behavior: reduced \? "auto" : "smooth", block: "start" \}\)/, "in-page links scroll, instantly under reduced motion")
assert.match(src, /<audio\n\s+ref=\{audioRef\}\n\s+preload="none"/, "one real audio element, nothing preloaded")
assert.match(src, /if \(corsMeter\) a\.crossOrigin = "anonymous"/, "the analyser only reads streams that allow it")
assert.match(src, /if \(!url \|\| !a\) \{\n\s+setStatus\("playing"\)/, "no stream still plays (simulated meter, silent)")
assert.match(src, /setStatus\("error"\)/, "a stream that won't start shows an error")
assert.match(src, /Try again/, "with a retry")
assert.match(src, /aria-label="Volume"/, "volume is labelled")
assert.match(src, /aria-label=\{muted \? "Unmute" : "Mute"\}/, "and mute toggles")
assert.match(src, /aria-current=\{state === "now" \? "time" : undefined\}/, "the slot on air is marked")
assert.match(src, /onClick=\{\(\) => setSel\(i === cur \? -1 : i\)\}/, "any slot previews in the feature slot")
assert.match(src, /Back to what's on now/, "and there is a way back")
assert.match(src, /role="slider"/, "the support dial is a slider")
assert.match(src, /<Glyphs text=\{s\.title\} wrap \/>/, "resident names wrap inside their column")
assert.match(src, /const shrink = fit \|\| \(wrap && maxW > 0 && W > maxW\)/, "and a word too long for its column scales down instead of spilling")
assert.match(src, /className="cr-band"/, "titles over artwork sit on a solid band, no per-letter halos")
assert.match(src, /nextAmount\(amount, e\.key, smin, smax\)/, "driven by the keyboard too")
assert.match(src, /setPointerCapture/, "and by dragging")
assert.match(src, /if \(res === false\) ok = false/, "onSupport, onRemind and onSubscribe can refuse")
assert.match(src, /isEmail\(email\)/, "the newsletter validates before sending")
assert.match(src, /aria-modal="true"/, "the phone menu is a modal dialog")
assert.match(src, /e\.key === "Escape"/, "Escape closes it")
assert.match(src, /aria-pressed=\{genre === g \|\| \(!genre && g === T\.allGenres\)\}/, "archive filters are toggle buttons")
assert.match(src, /<li className="cr-empty">\{T\.emptyArchive\}<\/li>/, "with an empty state")
assert.match(src, /labels\?: \{ \[K in keyof CrLabels\]\?: string \}/, "every interface string is a prop")
assert.doesNotMatch(src, /euro/, "no currency baked into copy")
assert.match(src, /React\.useState\(pref === "dark"\)/, "a dark page paints dark on the first frame (SSR)")
assert.match(src, /const fstate = !ready \? "wait"/, "nothing claims to be on air before the clock is known")
assert.match(src, /aria-label=\{T\.closePlayer\}/, "the dock can be closed")
assert.match(src, /className="cr-m-dimred"/, "the frequency stays red (dimmed) while the meter runs")
assert.match(src, /a\.currentTime \/ a\.duration/, "the dock shows the audio's real position when it has one")
assert.match(src, /inkLum\(ink\[0\]\) < inkLum\(ink\[1\]\)/, "cover titles print in the darker ink")
assert.ok(read("demo.tsx").includes("<CallsignRadioLanding theme=\"dark\" />"), "default demo is the component, full bleed, on carbon")
assert.doesNotMatch(read("demo.tsx"), /<div/, "default demo has no wrapper")
assert.match(read("demo-daytime.tsx"), /preset="daytime"/, "the second demo is another station")
assert.doesNotMatch(read("demo-daytime.tsx"), /https?:\/\//, "and stays capture-safe")

/* ---------- logic, executed ---------- */

const code = region("content") + region("glyphs") + region("logic") +
  "\nexport { meterSegments, litEnd, peakSeg, PRESETS, DEFAULT_SHOWS, DEFAULT_SCHEDULE, DEFAULT_EPISODES, DEFAULT_TIERS, GLYPHS, GH, layoutText, wrapText, glyphPath, gNorm, toMin, fmtMin, runningOrder, onAirIndex, slotProgress, stationClock, envelope, rmsLevel, tierFor, perksFor, dialAmount, nextAmount, isEmail, archiveShape, fmtDuration, mulberry, seedOf }\n"
const L = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(code)))

// the face: every glyph is drawable, and paths are finite
for (const ch of Object.keys(L.GLYPHS)) {
  const d = L.glyphPath(ch, 10)
  assert.doesNotMatch(d, /NaN|Infinity|undefined/, `glyph ${ch} draws`)
  if (ch !== " ") assert.match(d, /^M/, `glyph ${ch} has a path`)
}
for (const ch of "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789") assert.ok(L.GLYPHS[ch], `the face covers ${ch}`)
assert.equal(L.gNorm("é"), "E", "accents fold to the base letter")
assert.equal(L.gNorm("&"), "+", "ampersand prints as a plus")
assert.equal(L.gNorm("’"), "", "apostrophes drop")
assert.equal(L.gNorm("#"), "-", "unknown marks print as a dash, never blank")
const kora = L.layoutText("KORA 98.4")
assert.equal(kora.items.length, 9)
assert.equal(kora.items[0].x, 0)
assert.ok(kora.width > 800 && kora.width < 1000, "the default masthead is about 4.5 cap heights long")
for (let i = 1; i < kora.items.length; i++) assert.equal(kora.items[i].x, kora.items[i - 1].x + kora.items[i - 1].w + 14, "fixed letter spacing")
assert.deepEqual(L.wrapText("Signal / Noise", 4000), ["Signal / Noise"], "fits on one line when it can")
const wrapped = L.wrapText("Keep Kora on air", 900)
assert.ok(wrapped.length >= 2, "breaks when it can't")
for (const line of wrapped) assert.ok(L.layoutText(line).width <= 900 || !line.includes(" "), "every line fits")
assert.deepEqual(L.wrapText("Supercalifragilistic", 100), ["Supercalifragilistic"], "a long word keeps its own line")

// meter segments never leave slivers: every glyph is cut into whole segments
for (const [seg, gap] of [[22, 6], [40, 12]]) {
  for (const word of ["KORA 98.4", "VELD 107.2", "MIW 1"]) {
    const lay = L.layoutText(word)
    const sg = L.meterSegments(lay.items, seg, gap)
    for (let i = 0; i < sg.starts.length; i++) assert.ok(sg.ends[i] - sg.starts[i] >= 0.5 * Math.min(seg, 30) - 1e-9, `${word}: no sliver segments at ${seg}`)
    for (const it of lay.items) {
      if (it.ch === " ") continue
      const own = sg.starts.map((x, i) => [x, sg.ends[i]]).filter(([a, b]) => a >= it.x - 1e-9 && b <= it.x + it.w + 1e-9)
      assert.ok(Math.abs(own[0][0] - it.x) < 1e-9 && Math.abs(own[own.length - 1][1] - (it.x + it.w)) < 1e-9, `${word}: ${it.ch} segments span exactly its box`)
    }
    const W = lay.width
    assert.equal(L.litEnd(sg, 0, W), 0, "silence lights nothing")
    assert.equal(L.litEnd(sg, 1, W), W, "full level lights everything")
    for (let v = 0.01; v < 1; v += 0.037) {
      const e = L.litEnd(sg, v, W)
      assert.ok(sg.ends.some((x) => Math.abs(x - e) < 1e-9), "lit length always ends on a segment edge")
      const [px, pw] = L.peakSeg(sg, v, W)
      assert.ok(pw > 0 && Math.abs(px + pw - e) < 1e-9, "the peak tick sits in the last lit segment")
    }
  }
}

// the running order
assert.equal(L.toMin("13:00"), 780)
assert.equal(L.toMin("6:30"), 390)
assert.equal(L.toMin("nonsense"), 0)
assert.equal(L.fmtMin(390), "06:30")
const order = L.runningOrder([{ start: "13:00", show: "b" }, { start: "06:00", show: "a" }, { start: "22:00", show: "c" }])
assert.deepEqual(order.map((o) => [o.show, o.from, o.to]), [["a", 360, 780], ["b", 780, 1320], ["c", 1320, 1440]], "sorted, each slot ends where the next begins")
assert.equal(L.onAirIndex(order, 300), -1, "nothing before the first slot")
assert.equal(L.onAirIndex(order, 360), 0)
assert.equal(L.onAirIndex(order, 779), 0)
assert.equal(L.onAirIndex(order, 780), 1)
assert.equal(L.onAirIndex(order, 1439), 2)
assert.equal(L.slotProgress(order[1], 780, 0), 0)
assert.ok(Math.abs(L.slotProgress(order[1], 1050, 0) - 0.5) < 1e-9, "halfway through")
assert.equal(L.slotProgress(order[1], 2000, 0), 1, "clamped")
const def = L.runningOrder(L.DEFAULT_SCHEDULE)
assert.equal(def[0].from, 0, "the default day starts at midnight")
for (const s of L.DEFAULT_SCHEDULE) assert.ok(L.DEFAULT_SHOWS.some((x) => x.id === s.show), `slot ${s.start} has a show`)
for (const e of L.DEFAULT_EPISODES) assert.ok(L.DEFAULT_SHOWS.some((x) => x.id === e.show), `episode ${e.id} has a show`)

// the station clock follows the zone, not the visitor
const t = new Date("2026-01-15T12:00:00Z")
assert.equal(L.stationClock("Europe/Amsterdam", t).min, 13 * 60, "CET is UTC+1 in January")
assert.equal(L.stationClock("America/New_York", t).min, 7 * 60, "EST is UTC-5")
assert.equal(L.stationClock("Asia/Kolkata", t).min, 17 * 60 + 30, "half-hour zones work")
assert.equal(L.stationClock("Europe/Amsterdam", t).day, "thu")
const bad = L.stationClock("Not/AZone", t)
assert.ok(bad.min >= 0 && bad.min < 1440, "a bad zone falls back to the visitor's clock")

// the simulated signal is bounded, moving and different per channel
for (const kind of ["music", "talk"]) {
  let lo = 1, hi = 0, diff = 0
  for (let i = 0; i < 3000; i++) {
    const s = i / 60
    const a = L.envelope(s, kind, 0)
    const b = L.envelope(s, kind, 1)
    assert.ok(a >= 0 && a < 1 && b >= 0 && b < 1, `${kind} envelope in 0..1`)
    lo = Math.min(lo, a)
    hi = Math.max(hi, a)
    diff += Math.abs(a - b)
  }
  assert.ok(hi - lo > 0.35, `${kind} has dynamics`)
  assert.ok(hi < 0.999 && lo > 0, `${kind} never pins or dies`)
  assert.ok(diff / 3000 > 0.01, `${kind} channels differ`)
}
assert.equal(L.rmsLevel(new Float32Array(256)), 0, "silence is zero")
assert.ok(Math.abs(L.rmsLevel(new Float32Array(256).fill(1)) - 1) < 1e-9, "full scale is one")
assert.ok(Math.abs(L.rmsLevel(new Float32Array(256).fill(0.0631)) - 0.5) < 0.01, "-24 dBFS is half way")

// support tiers
assert.equal(L.tierFor(2, L.DEFAULT_TIERS), null, "below the first tier")
assert.equal(L.tierFor(8, L.DEFAULT_TIERS).name, "Supporter")
assert.equal(L.tierFor(25, L.DEFAULT_TIERS).name, "Patron")
assert.equal(L.perksFor(12, L.DEFAULT_TIERS).length, 5, "perks accumulate")
assert.equal(L.dialAmount(0, 3, 30), 3)
assert.equal(L.dialAmount(1, 3, 30), 30)
assert.equal(L.dialAmount(0.5, 3, 30), 17)
assert.equal(L.dialAmount(-2, 3, 30), 3, "clamped")
assert.equal(L.nextAmount(8, "ArrowRight", 3, 30), 9)
assert.equal(L.nextAmount(8, "PageDown", 3, 30), 3)
assert.equal(L.nextAmount(29, "PageUp", 3, 30), 30)
assert.equal(L.nextAmount(8, "End", 3, 30), 30)
assert.equal(L.nextAmount(8, "x", 3, 30), 8)
assert.ok(L.isEmail("a@b.co") && !L.isEmail("a@b") && !L.isEmail("nope"))

// the archive grid has as many cells as episodes and no holes
const cells = (n) => Array.from({ length: n }, (_, i) => L.archiveShape(i, n)).reduce((s, k) => s + ({ big: 4, small: 1, wide: 2, full: 4 })[k], 0)
for (let n = 5; n <= 14; n++) assert.equal(cells(n) % 4, 0, `${n} episodes fill whole rows`)
assert.equal(L.archiveShape(0, 3), "small", "few episodes stay uniform")
assert.equal(L.archiveShape(5, 6), "full", "an odd wide one out spans the row")
assert.equal(L.fmtDuration(58), "58 min")
assert.equal(L.fmtDuration(120), "2 h")
assert.equal(L.fmtDuration(175), "2 h 55 min")

// covers are deterministic
const r1 = L.mulberry(L.seedOf("x"))
const r2 = L.mulberry(L.seedOf("x"))
for (let i = 0; i < 20; i++) assert.equal(r1(), r2())

// presets carry every token in both themes
for (const [name, p] of Object.entries(L.PRESETS))
  for (const th of ["light", "dark"])
    for (const k of ["ground", "ink", "muted", "line", "dim", "tally", "onTally", "panel", "paper"]) assert.ok(p[th][k], `${name} ${th} has ${k}`)

console.log("callsign-radio-landing: all checks passed")
