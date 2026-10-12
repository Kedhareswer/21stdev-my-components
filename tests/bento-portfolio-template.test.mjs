// Install-safety and logic checks for components/bento-portfolio-template.
// Run: node tests/bento-portfolio-template.test.mjs
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const SLUG = "bento-portfolio-template"
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
assert.doesNotMatch(src, /@import|@font-face|<link\b|fetch\(|new Image\(|https?:\/\/(?!linkedin|dribbble|x\.com|github)/, "nothing loads at runtime")
assert.ok(src.includes('height = "100svh"'), "height defaults to a definite length")
assert.match(src, /minHeight: height/, "the height prop reaches the root")
assert.ok(!/\bh-full\b/.test(src), "no h-full anywhere")
// Percentage heights only on media filling a box that is itself definite
// (absolutely inset, or sized by aspect-ratio), never on layout.
for (const m of src.matchAll(/([^{}\n]+)\{[^}]*\bheight:100%/g)) {
  assert.ok(/^\.bpt-(art|slide|proj-cover|sheet-cover)>\*$/.test(m[1].trim()), "percentage height outside a definite box: " + m[1].trim())
}
assert.match(src, /React\.useId\(\)/, "svg ids are namespaced per instance")
assert.doesNotMatch(src, /url\(#[a-z]/, "svg references are built from the instance id")
assert.match(src, /<img [^>]*width=\{w\} height=\{h\} style=\{\{ maxWidth: "none" \}\}/, "custom images have explicit size and a Preflight guard")
assert.doesNotMatch(src, /location\.hash|history\.(push|replace)State/, "the host's URL is untouched")

const css = src.match(/const BPT_CSS = `([\s\S]*?)`/)
assert.ok(css, "CSS block present")
assert.doesNotMatch(css[1], /\$\{|`/, "no interpolation inside the CSS string")
assert.doesNotMatch(css[1], /url\(/, "no url() in the style block")
assert.ok(css[1].includes("prefers-reduced-motion:reduce"), "honours reduced motion")
const bare = css[1].replace(/\/\*[\s\S]*?\*\//g, "").replace(/@(media|container)[^{]*\{/g, "")
for (const m of bare.matchAll(/(?<=^|[{}])\s*([^{}@]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (/^(from|to|[\d.,%\s]+)$/.test(sel)) continue
  for (const s of sel.split(/,(?![^(]*\))/)) assert.match(s.trim(), /^[a-z]*\.bpt-/, `selector escapes the component: ${s.trim()}`)
}
assert.match(css[1], /\.bpt-root :where\(button\)\{/, "base resets carry no specificity")
assert.match(css[1], /\.bpt-root :where\(svg\)\{display:block;max-width:none/, "svg guarded against Preflight")
assert.match(css[1], /\.bpt-root\{[^}]*container-type:inline-size/, "layout responds to its own width, not the viewport")

/* ---------- the interactions are wired ---------- */

assert.match(src, /new SpeechSynthesisUtterance\(/, "the voice note speaks its transcript")
assert.match(src, /speechSynthesis\.cancel\(\)/, "pausing stops the speech")
assert.match(src, /React\.useEffect\(\(\) => \(\) => stopSpeech\(\)/, "unmounting stops the speech")
assert.match(src, /role="slider"[\s\S]*?aria-label="Voice note position"/, "the waveform is a seekable slider")
assert.match(src, /aria-label="Track position"/, "the track bar is a seekable slider")
assert.match(src, /role="tablist" aria-label="How I work"/, "steps are tabs")
assert.match(src, /role="dialog" aria-modal="true"/, "project details open in a modal dialog")
assert.match(src, /e\.key === "Escape"\) setOpen\(null\)/, "Esc closes the project sheet")
assert.match(src, /data-theme=\{theme\}/, "the theme is scoped to the root")
assert.match(src, /classList\.contains\("dark"\)/, "system theme follows the host's .dark class")
assert.match(src, /navigator\.clipboard\.writeText\(email\)/, "email copies to the clipboard")
assert.ok(read("demo.tsx").includes("<BentoPortfolioTemplate />"), "default demo is the component, full bleed")
assert.doesNotMatch(read("demo.tsx"), /<div/, "default demo has no wrapper")

/* ---------- helpers, executed ---------- */

const code = region("rand") + region("wave") + region("text") + region("map") +
  "\nexport { hashString, mulberry32, waveform, formatClock, formatTrack, estimateSeconds, splitSentences, snapToWord, captionAt, coverWords, initials, buildMap }\n"
const E = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(code)))

assert.equal(E.hashString("Dot"), E.hashString("Dot"))
assert.notEqual(E.hashString("Dot"), E.hashString("Dots"))
const r = E.mulberry32(7)
for (let i = 0; i < 100; i++) {
  const v = r()
  assert.ok(v >= 0 && v < 1, "rng in [0,1)")
}

const w = E.waveform("hello", 54)
assert.equal(w.length, 54)
assert.ok(w.every((v) => v >= 0.1 && v <= 1), "bars stay visible and bounded")
assert.deepEqual(E.waveform("hello", 54), w, "the waveform is stable per transcript")
assert.ok(Math.max(...w) > 0.5, "there are loud syllables, not a flat line")

assert.equal(E.formatClock(32), "0:32")
assert.equal(E.formatClock(125), "2:05")
assert.equal(E.formatClock(-3), "0:00")
assert.equal(E.formatTrack(34), "00:34")
assert.equal(E.formatTrack(754), "12:34")
assert.equal(E.estimateSeconds(""), 3, "never under 3s")
assert.equal(E.estimateSeconds(Array(78).fill("w").join(" ")), 30)

const text = "Hey, I'm John. Thanks for stopping by.  Say hello!"
const parts = E.splitSentences(text)
assert.deepEqual(parts.map((p) => p.text), ["Hey, I'm John.", "Thanks for stopping by.", "Say hello!"])
for (const p of parts) assert.equal(text.slice(p.start, p.start + p.text.length), p.text, "offsets point into the transcript")
assert.equal(E.snapToWord(text, 7), 5, "mid-word snaps back to the word start")
assert.equal(E.snapToWord(text, 0), 0)
assert.equal(E.snapToWord(text, 999), text.indexOf("hello!"), "past the end clamps, then snaps to the last word")
assert.equal(E.captionAt(text, 0), "Hey, I'm John.")
assert.equal(E.captionAt(text, 0.5), "Thanks for stopping by.")
assert.equal(E.captionAt(text, 1), "Say hello!")
assert.equal(E.captionAt("", 0.5), "")

assert.deepEqual(E.coverWords("The Intelligent Investor"), ["INTELLIGENT", "INVESTOR"])
assert.deepEqual(E.coverWords("The Design of Everyday Things"), ["DESIGN", "EVERYDAY"])
assert.deepEqual(E.coverWords("The"), ["THE"], "a title of only filler still gets a cover")
assert.equal(E.initials("Priya Raman"), "PR")
assert.equal(E.initials("Cher"), "C")

const m = E.buildMap("Los Angeles")
assert.deepEqual(E.buildMap("Los Angeles"), m, "the map is stable per city")
assert.notDeepEqual(E.buildMap("Tokyo"), m, "every city gets its own streets")
assert.match(m.minor, /^M[-\d.]+ [-\d.]+L/, "minor streets are one path")
assert.ok(m.minor.split("M").length > 40, "a dense street grid")
assert.equal(m.highways.length, 2)
assert.equal(m.parks.length, 4)
assert.doesNotMatch(m.minor + m.major + m.river + m.highways.join("") + m.parks.join(""), /NaN|undefined/, "no broken path data")

console.log("bento-portfolio-template: ok")
