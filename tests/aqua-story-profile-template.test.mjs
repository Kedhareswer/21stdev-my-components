// Install-safety and logic checks for components/aqua-story-profile-template.
// Run: node tests/aqua-story-profile-template.test.mjs
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const SLUG = "aqua-story-profile-template"
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
assert.doesNotMatch(src, /@import|@font-face|<link\b|fetch\(|new Image\(/, "no fonts or stylesheets load at runtime")
for (const m of src.matchAll(/https?:\/\/([a-z0-9.-]+)/g))
  assert.match(m[1], /^(images\.unsplash\.com|instagram\.com)$/, `unexpected host ${m[1]}`)
assert.ok(src.includes('height = "100svh"'), "height defaults to a definite length")
assert.match(src, /"--asp-h": height/, "the height prop reaches the root")
assert.match(src, /\.asp-hero\{[^}]*min-height:var\(--asp-h\)/, "and sets the story header's floor")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")
for (const m of src.matchAll(/([^{}]+)\{[^}]*\bheight:100%/g))
  assert.match(m[1].trim(), /^\.asp-(still|photo-img|ava-img|bg-zebra|icon|stk-svg|note-in)$|^\.asp-bg-img$/, `percentage height on ${m[1].trim()}`)
assert.match(src, /\.asp-bg\{position:sticky;top:0;height:100svh;margin-bottom:-100svh/, "the backdrop is sticky with a definite height")
assert.match(src, /\.asp-stage-in\{position:relative;height:95cqw\}/, "the story stage sizes from its own width")
assert.match(src, /\.asp-ex-in\{position:relative;height:52cqw\}/, "so does the exchange card")
assert.doesNotMatch(src.slice(0, src.indexOf("</")), /use(State|Ref|Memo|Callback)<|Partial<|Record<|Array<|Map<|React\.[A-Za-z]+<|\[K in /, "no generics before the JSX (21st CLI tokenizer)")
assert.doesNotMatch(src, /use(State|Ref|Memo|Callback)</, "hooks are typed without <generics>")
assert.match(src, /matchMedia\("\(prefers-reduced-motion: reduce\)"\)/, "reduced motion is read in JS")
assert.match(src, /data-static=\{reduced \|\| n < 2 \? "" : undefined\}/, "under reduced motion stories don't auto-advance")
assert.match(src, /React\.useId\(\)\.replace/, "svg ids are namespaced per instance")

const css = src.match(/const ASP_CSS = `([\s\S]*?)`/)
assert.ok(css, "CSS block present")
assert.doesNotMatch(css[1], /\$\{|`/, "no interpolation inside the CSS string")
assert.doesNotMatch(css[1], /url\(/, "no url() in the style block")
assert.ok(css[1].includes("prefers-reduced-motion:reduce"), "honours reduced motion in CSS")
for (const m of css[1].replace(/\/\*[\s\S]*?\*\//g, "").replace(/@(media|container)[^{]*\{/g, "").replace(/@keyframes[^{]*\{/g, "").matchAll(/(?<=^|[{}])\s*([^{}@]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (/^(from|to|[\d.,%\s]+)$/.test(sel)) continue
  for (const s of sel.split(/,(?![^(]*\))/)) assert.match(s.trim(), /^\.asp-/, `selector escapes the component: ${s.trim()}`)
}
assert.match(css[1], /\.asp-root :where\(button\)\{/, "the reset has no specificity to fight")
assert.match(css[1], /\.asp-root :where\(button\)\{[^}]*text-transform:inherit/, "buttons inherit caps (UA sheets reset them)")
assert.match(css[1], /\.asp-root\{[^}]*overflow-x:clip/, "the root clips sideways without breaking the sticky backdrop")
assert.doesNotMatch(css[1], /\.asp-root\{[^}]*overflow:hidden/, "overflow:hidden on the root would break sticky")
for (const k of ["photo-img", "ava-img", "bg-img", "still", "stk-svg"]) assert.match(css[1], new RegExp("\\.asp-" + k + "\\{[^}]*max-width:none"), `.asp-${k} is guarded against Preflight`)
assert.match(src, /className="asp-photo-img"[\s\S]{0,120}width=\{1200\}\s+height=\{1100\}/, "photos carry explicit dimensions")

/* ---------- it behaves like a profile page ---------- */

assert.match(src, /<FilmStill seed=\{seed\} \/>/, "every photo has a painted still underneath")
assert.match(src, /onError=\{\(\) => setFailed\(true\)\}/, "a broken photo falls back to the still")
assert.match(src, /e\.animationName === "asp-fill"\) go\(idx \+ 1\)/, "a story advances when its segment fills")
assert.match(src, /!\(noteFocus && noteText\.trim\(\) !== ""\)/, "typing a note holds the story")
assert.match(src, /document\.addEventListener\("visibilitychange", on\)/, "and a hidden tab pauses it")
assert.match(src, /stories\[step\(idx, 1, n\)\]/, "the inset frame is the story up next")
assert.match(src, /aria-label=\{"Story " \+ \(i \+ 1\) \+ " of " \+ n/, "segments are labelled buttons")
assert.match(src, /if \(e\.key === "ArrowRight"\) go\(idx \+ 1\)/, "arrow keys step through stories")
assert.match(src, /role="dialog" aria-modal="true"/, "overlays are modal dialogs")
assert.match(src, /if \(e\.key === "Escape"\) \{\n\s+e\.preventDefault\(\)\n\s+close\.current\(\)/, "Escape closes them")
assert.match(src, /prev\?\.focus\?\.\(\)/, "and focus goes back where it was")
assert.match(src, /if \(res === false\) ok = false/, "onReview can refuse")
assert.match(src, /if \(r === false\) ok = false/, "onNote can refuse")
assert.match(src, /role="radio"\n\s+aria-checked=\{hearts === n\}/, "the heart rating is a radio group")
assert.match(src, /aria-pressed=\{deco\}/, "Account decorate is a toggle")
assert.match(src, /setPointerCapture\(e\.pointerId\)/, "stickers drag with pointer capture")
assert.match(src, /e\.key === "Delete" \|\| e\.key === "Backspace"\) removeSticker/, "and can be removed from the keyboard")
assert.match(src, /window\.localStorage\.setItem\(storeKey/, "placed stickers persist")
assert.match(src, /try \{\n\s+window\.localStorage\.setItem/, "inside a try")
assert.ok(read("demo.tsx").includes("<AquaStoryProfileTemplate />"), "default demo is the component, full bleed")
assert.doesNotMatch(read("demo.tsx"), /<div/, "default demo has no wrapper")
assert.match(read("demo-custom.tsx"), /palette="blush"/, "the custom demo re-skins the page")
assert.doesNotMatch(read("demo-custom.tsx"), /="[^"]*\\n/, "no \\n inside a JSX string attribute")

/* ---------- logic, executed ---------- */

const code = region("content") + region("logic") + region("glyphs") +
  "\nexport { PALETTES, DEFAULT_STORIES, DEFAULT_REVIEWS, DEFAULT_QUESTIONS, DEFAULT_HIGHLIGHTS, STICKER_KINDS, BUBBLES, SCRIPT_GLYPHS, clamp, step, splitDate, formatCount, initials, dayStamp, reviewProblem, rankFor, layoutScript, resolvePalette, placeSticker, readStickers }\n"
const L = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(code)))

assert.equal(L.step(3, 1, 4), 0, "wraps forward")
assert.equal(L.step(0, -1, 4), 3, "wraps back")
assert.equal(L.step(5, 0, 4), 1)
assert.equal(L.step(2, 1, 0), 0, "an empty list stays at 0")

assert.deepEqual(L.splitDate("07 July 2026"), ["07 JULY", "2026"])
assert.deepEqual(L.splitDate("  19  oct "), ["19 OCT", ""])
assert.deepEqual(L.splitDate("2026"), ["2026", ""], "a lone year is the first line")
assert.deepEqual(L.splitDate(undefined), ["", ""])

assert.equal(L.formatCount(248), "248")
assert.equal(L.formatCount(1000), "1k")
assert.equal(L.formatCount(1280), "1.2k", "rounds down, like the apps")
assert.equal(L.formatCount(12999), "12k")
assert.equal(L.formatCount(1500000), "1.5m")
assert.equal(L.formatCount(-4), "0")

assert.equal(L.initials("Yuna Han"), "YH")
assert.equal(L.initials("Seo-yeon"), "SY")
assert.equal(L.initials("aiko"), "A")
assert.equal(L.initials("@@"), "♡")

assert.equal(L.dayStamp(new Date(2026, 6, 6)), "06 JUL")
assert.equal(L.dayStamp(new Date(2026, 11, 25)), "25 DEC")

assert.ok(L.reviewProblem("  hi "), "too short")
assert.equal(L.reviewProblem("you're the best"), null)
assert.ok(L.reviewProblem("x".repeat(241)), "too long")

assert.equal(L.rankFor(5, 5), "certified close friend")
assert.equal(L.rankFor(3, 5), "basically family")
assert.equal(L.rankFor(1, 5), "mutual in training")
assert.match(L.rankFor(0, 5), /coffee/)
assert.equal(L.rankFor(0, 0), "")

// the script: every letter is drawn, so default titles never fall back
for (const ch of "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ .,!?'&-") assert.ok(L.SCRIPT_GLYPHS[ch], `glyph for ${JSON.stringify(ch)}`)
for (const [ch, [adv, d]] of Object.entries(L.SCRIPT_GLYPHS)) {
  assert.ok(adv >= 0 && adv < 800, `${ch} has a sane advance`)
  if (ch !== " ") assert.match(d, /^M-?\d+[ -]\d+/, `${ch} starts with an absolute move`)
  assert.doesNotMatch(d, /[`$]/, "no template characters in glyph data")
}
for (const t of ["Exchange reviews", "Friend reviews", "Highlights", "Write a review", "Trade a review"]) assert.equal(L.layoutScript(t).missing, 0, `${t} is fully drawn`)
for (const q of [0, 1, 3, 5]) assert.equal(L.layoutScript(L.rankFor(q, 5).replace(/\?/g, "")).missing, 0, "quiz ranks are drawn too")
const ex = L.layoutScript("Exchange reviews")
assert.equal(ex.parts.length, "Exchangereviews".length, "spaces advance without a path")
assert.ok(ex.width > 2000 && ex.width < 4000)
assert.equal(L.layoutScript("ab").parts[1].x, L.SCRIPT_GLYPHS.a[0], "letters advance by their width")
assert.equal(L.layoutScript("café ♡").missing, 2, "unknown characters are counted, so the font fallback kicks in")

// palettes
assert.equal(L.resolvePalette("blush").accent, L.PALETTES.blush.accent)
assert.equal(L.resolvePalette("nope").deep, L.PALETTES.aqua.deep, "unknown names fall back to aqua")
assert.equal(L.resolvePalette({ accent: "#ff0000" }).accent, "#ff0000", "a partial palette overrides")
assert.equal(L.resolvePalette({ accent: "#ff0000" }).paper, L.PALETTES.aqua.paper, "and falls back to aqua")
assert.equal(L.resolvePalette({ accent: "" }).accent, L.PALETTES.aqua.accent, "empty strings are ignored")
const keys = Object.keys(L.PALETTES.aqua).sort()
for (const [name, p] of Object.entries(L.PALETTES)) assert.deepEqual(Object.keys(p).sort(), keys, `${name} defines every token`)

// stickers
assert.deepEqual(L.placeSticker(-1, -50, 2000), { x: 0.02, y: 24 }, "clamped onto the page")
assert.deepEqual(L.placeSticker(2, 9999, 2000), { x: 0.98, y: 1976 })
assert.deepEqual(L.placeSticker(0.5, 300, 2000), { x: 0.5, y: 300 })
assert.deepEqual(L.readStickers(null), [])
assert.deepEqual(L.readStickers("{bad json"), [], "corrupt storage is ignored")
assert.deepEqual(L.readStickers('{"kind":"heart"}'), [], "non-arrays are ignored")
const got = L.readStickers(JSON.stringify([{ id: "a", kind: "heart", x: 0.3, y: 200, rotate: 5 }, { kind: "skull", x: 0, y: 0 }, { kind: "bow", x: "nope", y: 1 }]))
assert.deepEqual(got, [{ id: "a", kind: "heart", x: 0.3, y: 200, rotate: 5, size: 76 }], "only known, well-formed stickers come back")
assert.equal(L.STICKER_KINDS.length, 8)

// content
assert.ok(L.DEFAULT_STORIES.length >= 3)
for (const s of L.DEFAULT_STORIES) {
  assert.match(s.image, /^https:\/\/images\.unsplash\.com\/photo-/)
  assert.equal(L.splitDate(s.date)[1], "2026")
}
for (const q of L.DEFAULT_QUESTIONS) assert.ok(q.answer >= 0 && q.answer < q.options.length, `${q.q} has a valid answer`)
for (const r of L.DEFAULT_REVIEWS) assert.equal(L.reviewProblem(r.text), null, `${r.name}'s review would pass the composer`)
for (const h of L.DEFAULT_HIGHLIGHTS) assert.ok(h.slides.length > 0, `${h.label} has slides`)
assert.equal(L.BUBBLES.filter((b) => b.glass).length, 2, "two glass hearts among the paper ones")

console.log("aqua-story-profile-template: ok")
