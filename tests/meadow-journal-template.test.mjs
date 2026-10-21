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
assert.doesNotMatch(src, /@import|@font-face|fetch\(|new Image\(/, "no fetches, no CSS imports")
assert.equal((src.match(/<link\b/g) || []).length, 1, "the one link is the optional display face")
for (const m of src.matchAll(/https?:\/\/[^"'`\s)]+/g)) assert.match(m[0], /^https:\/\/(images\.unsplash\.com\/photo-|fonts\.googleapis\.com\/css2)/, "only Unsplash photos and the display face are remote: " + m[0])
assert.ok(src.includes('height = "100svh"'), "height defaults to a definite length")
assert.match(src, /"--mjt-h": height/, "the height prop reaches the root")
assert.match(src, /\.mjt-root\{[^}]*min-height:var\(--mjt-h\)/, "and sets its floor")
assert.match(src, /\.mjt-hero\{[^}]*min-height:var\(--mjt-h\)/, "the hero has a definite height")
assert.match(src, /\.mjt-sky\{position:sticky;top:0;height:var\(--mjt-h\);margin-bottom:calc\(var\(--mjt-h\) \* -1\)/, "the backdrop photo is sticky and of definite height")
assert.match(src, /\.mjt-cards\{[^}]*height:clamp\(/, "the photo row has a definite height, so the absolutely placed photos never collapse")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")
assert.match(src, /React\.useId\(\)\.replace/, "ids are namespaced per instance")
assert.doesNotMatch(src.slice(0, src.indexOf("</")), /use(State|Ref|Memo|Callback)<|Partial<|Record<|Array<|Map<|React\.[A-Za-z]+<|\[K in /, "no generics before the JSX (21st CLI tokenizer)")
assert.doesNotMatch(src, /use(State|Ref|Memo|Callback)</, "hooks are typed without <generics>")
assert.match(src, /matchMedia\("\(prefers-reduced-motion: reduce\)"\)/, "reduced motion is read in JS (the rotation, the scrolling)")
assert.doesNotMatch(src, /[—–]/, "no em or en dashes anywhere")
assert.doesNotMatch(src, />[^<{]*\\u[0-9a-f]{4}/i, "no \\u escapes inside JSX text (they print literally)")
assert.match(src, /style=\{\{ maxWidth: "none", objectPosition: shot\.focus \}\}/, "photos are guarded against Preflight")
assert.match(src, /onError=\{\(\) => setState\("failed"\)\}/, "a failed photo falls back to its tone")
assert.match(src, /loading=\{eager \? "eager" : "lazy"\}/, "only the hero loads eagerly")

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
assert.match(css[1], /\.mjt-root\[data-theme="dark"\] \.mjt-sky \.mjt-media\{filter:/, "night mode grades the photograph")
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
assert.match(src, /if \(res === false\) ok = false/, "onReply and onNote can refuse")
assert.match(src, /aria-modal="true"/, "the lightbox is a modal dialog")
assert.match(src, /role="menu"/, "more opens a menu")
assert.match(src, /e\.key === "Escape"/, "Escape closes")
assert.match(src, /class MusicBox/, "the music card plays")
assert.match(src, /if \(this\.ctx\) void this\.ctx\.close\(\)/, "and releases its audio on unmount")
assert.match(src, /srcSet=\{square \? undefined : srcSet\(shot\.src, max\) \|\| undefined\}/, "photos are responsive")
assert.match(src, /\{fontHref && <link rel="stylesheet" href=\{fontHref\} \/>\}/, "the display face is optional")
assert.ok(read("demo.tsx").includes("<MeadowJournalTemplate />"), "default demo is the component, full bleed")
assert.doesNotMatch(read("demo.tsx"), /<div/, "default demo has no wrapper")
assert.match(read("demo-granja.tsx"), /locale="es-ES"/, "the second demo reprints the page in Spanish")
assert.match(read("demo-granja.tsx"), /palette="sage"/, "in another palette")
for (const m of read("demo-granja.tsx").matchAll(/https?:\/\/[^"\s]+/g)) assert.match(m[0], /^https:\/\/images\.unsplash\.com\/photo-/, "with its own Unsplash photos")

/* ---------- logic, executed ---------- */

const code = region("content") + region("logic") +
  "\nexport { DEFAULT_ENTRIES, DEFAULT_ARCHIVE, DEFAULT_PHOTOS, DEFAULT_SONGS, DEFAULT_MESSAGES, DEFAULT_PROFILE, DEFAULT_LABELS, PALETTES, resolvePalette, richParts, plain, fill, compact, grouped, mmss, clockParts, fmtDate, monthLabel, mergeEntries, months, filterEntries, categories, nextIndex, scrubState, scrubDelta, noteAt, hash, sized, srcSet }\n"
const L = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(code)))

// every default picture is a real Unsplash photo with alt text and a loading tone
const shots = []
for (const e of L.DEFAULT_ENTRIES.concat(L.DEFAULT_ARCHIVE)) {
  assert.match(e.date, /^\d{4}-\d{2}-\d{2}$/)
  shots.push(e.image, ...(e.shots || []))
}
for (const e of L.DEFAULT_ENTRIES) assert.equal((e.shots || []).length, 2, e.id + " has two photo cards")
shots.push(...L.DEFAULT_PHOTOS, L.DEFAULT_PROFILE.avatar)
for (const s of shots) {
  assert.match(s.src, /^https:\/\/images\.unsplash\.com\/photo-\d+-[0-9a-f]{12}$/, "bare Unsplash URL " + s.src)
  assert.ok(s.alt && s.alt.length > 3, "alt for " + s.src)
  assert.match(s.tone, /^#[0-9a-f]{6}$/, "tone for " + s.src)
}
for (const s of L.DEFAULT_SONGS) assert.match(s.cover, /^https:\/\/images\.unsplash\.com\/photo-/)
for (const m of L.DEFAULT_MESSAGES) assert.match(m.avatar, /^https:\/\/images\.unsplash\.com\/photo-/)
assert.equal(new Set(L.DEFAULT_PHOTOS.map((p) => p.id)).size, L.DEFAULT_PHOTOS.length)

// responsive photo URLs
const u = "https://images.unsplash.com/photo-1438786657495-640937046d18"
assert.equal(L.sized(u, 800), u + "?auto=format&fit=crop&q=78&w=800")
assert.equal(L.sized(u + "?w=50&q=1", 800), u + "?auto=format&fit=crop&q=78&w=800", "existing params are replaced")
assert.match(L.sized(u, 80, 80), /w=80&h=80&crop=faces,entropy$/, "squares crop to faces")
assert.equal(L.sized("/me.jpg", 800), "/me.jpg", "other URLs pass through")
assert.equal(L.srcSet("/me.jpg"), "")
assert.deepEqual(L.srcSet(u, 1200).split(", ").map((x) => x.split(" ")[1]), ["480w", "800w", "1200w"])

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
// The fallback is the machine's own zone, so compare against local minutes (a +5:30 zone reads :00 here).
assert.equal(L.clockParts(d, "en-US", true, "Not/AZone").minute, String(d.getMinutes()).padStart(2, "0"), "a bad zone falls back instead of throwing")
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
assert.equal(L.filterEntries(all, "", "dock").length, 1)
assert.equal(L.filterEntries(all, "", "BOARDWALK salt").length, 1, "every word, any case, any order")
assert.equal(L.filterEntries(all, "2026-09", "").length, all.filter((e) => e.date.startsWith("2026-09")).length)
assert.equal(L.filterEntries([{ id: "x", date: "2026-01-01", place: "Peñas", text: "café", likes: 1 }], "", "penas cafe").length, 1, "accents fold")
assert.deepEqual(L.categories(L.DEFAULT_PHOTOS), ["Portraits", "Fields", "Animals", "Golden hour"])

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
