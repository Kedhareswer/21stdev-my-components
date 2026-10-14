// Checks for components/wordmark-newsletter-signup.
// Run: node tests/wordmark-newsletter-signup.test.mjs
//
// The wordmark layout, email checks and colour logic live in the .tsx so the
// published component stays one file; the marked region is lifted out and run.
// The rest are the install-safety rules: no inherited height, CSS that cannot
// leak into the host page, a real accessible form and dialog, reduced motion.
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const src = readFileSync(
  new URL("../components/wordmark-newsletter-signup/wordmark-newsletter-signup.tsx", import.meta.url),
  "utf8",
)

const start = src.indexOf("// #region logic")
const end = src.indexOf("// #endregion")
assert.ok(start > -1 && end > start, "logic region markers missing")
const m = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(src.slice(start, end))))

// Email: what people actually type, and what they get wrong.
for (const ok of ["maria.okafor@fastmail.com", "a+news@sub.domain.co.uk", "  you@kitchen.com "]) assert.equal(m.isEmail(ok), true, ok)
for (const bad of ["", "maria@", "maria@fastmail", "@fastmail.com", "maria fastmail.com", "maria@fast mail.com", "a@b.c", "a@@b.com", "a@b..com"])
  assert.equal(m.isEmail(bad), false, bad)

// The field shrinks with a long address, never below the floor.
assert.equal(m.emailFontSize(10), 26)
assert.ok(m.emailFontSize(30) < 26 && m.emailFontSize(30) >= 15)
assert.equal(m.emailFontSize(200), 15)

// Lines: fixed by "\n" or an array, uppercased; otherwise left to the layout.
assert.deepEqual(m.toLines("Big\nSunday "), ["BIG", "SUNDAY"])
assert.deepEqual(m.toLines(["a", " ", "b c"]), ["A", "B C"])
assert.equal(m.toLines("Big Sunday"), null)
assert.deepEqual(m.partitions(["A", "B", "C"], 2), [["A", "B C"], ["A B", "C"]])
assert.equal(m.partitions(["A", "B", "C", "D"], 3).length, 3)

// Layout with a fake monospace face: 60 units per character at 100px, caps 72 units tall.
const measure = (s) => s.length * 60
const opts = { maxLines: 2, mode: "fill", minRatio: 1, maxRatio: 1.35, gap: 0.16, padX: 20, padY: 20, crop: 0.14, balance: 0.15 }
const wide = m.layoutWordmark("Big Sunday Sauce Co.", { w: 1440, h: 880 }, measure, 72, opts)
assert.deepEqual(wide.lines.map((l) => l.text), ["BIG SUNDAY", "SAUCE CO."], "the name frames the card in two even lines")
for (const l of wide.lines) {
  const w = measure(l.text) * l.sx
  assert.ok(w <= 1440 - 40 + 0.5, "every line fits inside the padding: " + l.text)
  assert.ok(Math.abs(l.x0 + w / 2 - 720) < 0.5, "every line is centred: " + l.text)
  assert.ok(l.sy / l.sx >= 1 - 1e-9 && l.sy / l.sx <= 1.35 + 1e-9, "the stretch stays where the type still looks drawn, not distorted")
}
const longest = Math.max(...wide.lines.map((l) => measure(l.text)))
assert.ok(Math.abs(longest * wide.lines[0].sx - 1400) < 0.5, "the longest line spans the full width")
assert.equal(wide.lines[0].y0, 20, "the first line sits on top")
const lastBottom = wide.lines[1].y0 + wide.cap
assert.ok(lastBottom > 880 - 20 && lastBottom < 880 + wide.cap * 0.2, "the last line drops just past the bottom edge, like a sign")
assert.equal(wide.height, 880)
assert.deepEqual(wide.lines[0].xs.slice(0, 3), [0, 60, 120], "glyphs sit at their kerned prefix")

const welcome = m.layoutWordmark("Welcome in", { w: 1440, h: 900 }, measure, 72, opts)
assert.deepEqual(welcome.lines.map((l) => l.text), ["WELCOME", "IN"], "a short last word takes the bottom line instead of leaving it empty")
const uneven = m.layoutWordmark("Welcome in", { w: 1440, h: 900 }, measure, 72, { ...opts, balance: 0.45 })
assert.equal(uneven.lines.length, 1, "splits less even than the balance are skipped")

const fixed = m.layoutWordmark("Brine\nHouse", { w: 1440, h: 900 }, measure, 72, opts)
assert.deepEqual(fixed.lines.map((l) => l.text), ["BRINE", "HOUSE"], "fixed lines are kept")
const short = m.layoutWordmark("Hi", { w: 1440, h: 300 }, measure, 72, opts)
assert.ok(short.cap <= 300 - 40 + 1e-6, "a word too tall for its box gives up stretch and size, never overflows")

const bandOpts = { ...opts, mode: "band", maxLines: 4, balance: 0.45, padX: 10 }
const band = m.layoutWordmark("Mustard Club", { w: 1440, h: 0 }, measure, 72, { ...bandOpts, maxHeight: 345 })
assert.equal(band.lines.length, 1, "a band stays on one line while two would be too tall")
assert.ok(Math.abs(band.height - (band.cap + 40)) < 0.5, "a band reports its own height")
const bandPhone = m.layoutWordmark("Mustard Club", { w: 375, h: 0 }, measure, 72, { ...bandOpts, maxHeight: 220 })
assert.equal(bandPhone.lines.length, 2, "a narrow band breaks the name for bigger capitals")
const phone = m.layoutWordmark("Big Sunday Sauce Co.", { w: 375, h: 0 }, measure, 72, { ...bandOpts, balance: 0.25, padX: 12, maxHeight: 341 })
assert.ok(phone.lines.length >= 3, "a phone stacks the name into short lines")
assert.ok(phone.height - 40 <= 341 + 0.5, "the phone stack respects its height limit")
const capped = m.layoutWordmark("Thank you", { w: 1440, h: 0 }, measure, 72, { ...bandOpts, maxHeight: 345, maxCap: band.cap })
assert.ok(capped.cap <= band.cap + 1e-6, "a shorter swapped word never grows taller than the name")

// The clip window leaves room for accents and Q tails, and letters travel clear of it.
assert.ok(m.CLIP_TOP >= 0.3, "accents (CAFÉ, MÜNCHEN) are not clipped")
assert.ok(m.CLIP_BOTTOM > 1 && m.CLIP_BOTTOM < 1 + 0.16, "below the baseline, but short of the next line")
assert.ok(m.DROP >= 1 + m.CLIP_TOP && m.DROP >= m.CLIP_BOTTOM, "a moving letter clears the window both ways")
assert.deepEqual(m.toLines(["Café"]), ["CAFÉ"])

assert.deepEqual(m.letterOrder(["AB C", "DE"]), [[0, 1, -1, 2], [3, 4]], "letters stagger left to right, line by line, skipping spaces")

// Colour: every preset reads, light and dark.
const presets = [...src.matchAll(/(light|dark): \{ ground: "(#[0-9a-f]{6})", mark: "(#[0-9a-f]{6})", paper: "(#[0-9a-f]{6})", ink: "(#[0-9a-f]{6})", accent: "(#[0-9a-f]{6})", onAccent: "(#[0-9a-f]{6})"(?:, headline: "(#[0-9a-f]{6})")? \}/g)]
assert.equal(presets.length, 8, "four presets, light and dark")
for (const [, mode, ground, mark, paper, ink, accent, onAccent, headline] of presets) {
  const hl = headline ?? accent
  assert.ok(m.contrast(ink, paper) >= 7, mode + " " + ink + " body text on the card")
  assert.ok(m.contrast(hl, paper) >= 4.5, mode + " " + hl + " headline on the card is " + m.contrast(hl, paper).toFixed(2))
  assert.ok(m.contrast(onAccent, accent) >= 4.5, mode + " " + accent + " button label is " + m.contrast(onAccent, accent).toFixed(2))
  assert.ok(m.contrast(mark, ground) >= 1.6, mode + " " + mark + " wordmark must read against the ground")
  assert.ok(m.contrast(m.pickReadable(ground, [mark, ink, paper]), ground) >= 4.5, mode + " band text on the ground")
}
assert.equal(m.pickReadable("#bdbcb7", ["#b30d17", "#0e0e0e", "#ffffff"]), "#0e0e0e", "a wordmark colour too weak for small text falls back")
assert.equal(m.pickReadable("#141414", ["#f2b705", "#111111"]), "#f2b705")
assert.equal(m.pickReadable("#141414", ["oklch(0.8 0.1 90)", "#fff"]), "oklch(0.8 0.1 90)", "non-hex colours pass through")
assert.ok(Number.isNaN(m.contrast("red", "#fff")))

// ---- install safety (source assertions)
const css = src.slice(src.indexOf("const CSS = `") + 13, src.indexOf("`", src.indexOf("const CSS = `") + 13))
assert.ok(css.length > 1000, "CSS block found")
assert.ok(!css.includes("${"), "no template interpolation inside the CSS")
assert.ok(!/@import/.test(css), "no @import")
assert.ok(!/(^|\})\s*(\*|body|html|:root)\s*[,{]/m.test(css), "no bare *, body, html or :root rules")
for (const rule of css.split("}")) {
  const sel = rule.split("{")[0].trim()
  if (!sel || sel.startsWith("@") || /^(from|to|\d+%)/.test(sel)) continue
  for (const part of sel.split(",")) assert.ok(/\.wns/.test(part), "selector is scoped: " + part.trim())
}
assert.ok(/prefers-reduced-motion: reduce/.test(css), "reduced motion is honoured")
assert.ok(/max-width: none/.test(css), "images are guarded against Preflight max-width")
assert.ok(!/\bh-full\b/.test(src), "no h-full anywhere")
assert.ok(/height = "min\(100svh, 880px\)"/.test(src), "the section defaults to a definite height")
assert.ok(!/from "\.\.?\//.test(src), "no local imports")
const firstJsxClose = src.indexOf("</")
assert.ok(!/(useState|useRef|useMemo|useCallback|createContext)</.test(src.slice(0, firstJsxClose)), "no generic calls before the first JSX close tag")
assert.ok(!/fonts\.googleapis|@font-face/.test(src), "no web fonts")

// Form and dialog semantics
assert.ok(/type="email"/.test(src) && /autoComplete="email"/.test(src), "a real email input")
assert.ok(/<label className="wns-field"/.test(src), "the email field has a real label")
assert.ok(/aria-live="polite"/.test(src) && /aria-describedby/.test(src), "errors are announced and tied to the field")
assert.ok(/aria-pressed=/.test(src), "topic chips are toggle buttons")
assert.ok(/readOnly=\{status === "pending"\}/.test(src) && !/[^-]disabled=\{status/.test(src), "pending keeps focus: readOnly and aria-disabled, never disabled")
assert.ok(/overflow-wrap: anywhere/.test(css) && !/break-all/.test(css), "addresses wrap whole")
assert.ok(/pointer: coarse/.test(src), "touch screens are not handed a keyboard on open")
assert.ok(/role="dialog"/.test(src) && /aria-modal="true"/.test(src), "the modal is a dialog")
assert.ok(/e\.key === "Escape"/.test(src) && /e\.key !== "Tab"/.test(src), "Escape closes, Tab is trapped")
assert.ok(/root\.style\.overflow = "hidden"/.test(src) && /prev\?\.focus/.test(src), "scroll lock and focus return")
assert.ok(/aria-hidden="true"/.test(src.slice(src.indexOf("className=\"wns-mark\"") - 200)), "the wordmark is hidden from screen readers")

for (const d of ["demo.tsx", "demo-modal.tsx", "demo-band.tsx"]) {
  const demo = readFileSync(new URL("../components/wordmark-newsletter-signup/" + d, import.meta.url), "utf8")
  assert.ok(demo.includes('from "@/components/ui/wordmark-newsletter-signup"'), d + " imports the installed path")
  assert.ok(/export default function \w*Demo\(/.test(demo), d + " exports a named demo function")
}

console.log("wordmark-newsletter-signup: all checks passed")
