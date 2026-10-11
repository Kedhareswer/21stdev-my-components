// Runnable check for components/billboard-signup-footer: the stroke alphabet,
// layout, frame, key-press and ticker maths, plus the install-safety rules.
// Run: node tests/billboard-signup-footer.test.mjs
//
// What breaks silently here: a letter missing from the alphabet that just
// vanishes from the wordmark, a two-letter word that stands 900px tall, a
// spring that explodes when a background tab wakes up, a ticker offset that
// goes negative and jumps a whole set, and a seam of paper between the letters
// and the body that only shows at some widths.
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const read = (file) =>
  readFileSync(new URL("../components/billboard-signup-footer/" + file, import.meta.url), "utf8").replace(/\r\n/g, "\n")
const src = read("billboard-signup-footer.tsx")

const start = src.indexOf("// #region billboard")
const end = src.indexOf("// #endregion")
assert.ok(start > -1 && end > start, "billboard region markers missing")
const T = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(src.slice(start, end))))

// ---- colours -----------------------------------------------------------------
{
  assert.equal(T.hexToRgb("#ff4419"), "255, 68, 25")
  assert.equal(T.hexToRgb("FF4419"), "255, 68, 25", "no hash, upper case")
  assert.equal(T.hexToRgb("#f41"), "255, 68, 17", "shorthand expands")
  for (const bad of ["", "orange", "#12345", "rgb(1,2,3)", undefined]) {
    assert.equal(T.hexToRgb(bad, "1, 2, 3"), "1, 2, 3", "unparseable " + bad + " falls back")
  }
}

// ---- the alphabet ------------------------------------------------------------
{
  for (const ch of "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 -.!'") {
    const g = T.GLYPHS[ch]
    assert.ok(g, "glyph " + JSON.stringify(ch) + " exists")
    assert.ok(g[0] >= T.STROKE && g[0] <= 80, ch + " has a sane advance")
    if (ch === " ") continue
    assert.match(g[1], /^M/, ch + " is a path")
    // Every coordinate pair stays near its own box; ends may overrun to be trimmed square.
    const nums = g[1].match(/-?\d+(\.\d+)?/g).map(Number)
    assert.ok(nums.every((n) => n >= -12 && n <= 112), ch + " stays near its box")
    assert.doesNotMatch(g[1], /[^MLHVAZ\d .-]/, ch + " uses only absolute M/L/H/V/A/Z")
  }
  assert.equal(T.CAP, 100)
  assert.equal(T.STROKE, 20)
}

// ---- layout --------------------------------------------------------------------
{
  const w = T.layoutWord("Voltra", 3)
  assert.deepEqual(w.letters.map((l) => l.ch).join(""), "VOLTRA", "lower case draws as capitals")
  const sum = w.letters.reduce((a, l) => a + l.w, 0)
  assert.equal(w.width, sum + 3 * 5, "tracking goes between letters only")
  assert.equal(w.letters[0].x, 0)
  for (let i = 1; i < w.letters.length; i++) {
    assert.equal(w.letters[i].x, w.letters[i - 1].x + w.letters[i - 1].w + 3, "letters advance in order")
  }
  assert.deepEqual(T.layoutWord("A#B", 0).letters.map((l) => l.ch), ["A", "B"], "unknown characters are dropped, not drawn as gaps")
  assert.equal(T.layoutWord("", 3).width, 0)
  assert.equal(T.layoutWord(undefined, 3).width, 0)
  assert.equal(T.layoutWord("AB", NaN).width, T.GLYPHS.A[0] + T.GLYPHS.B[0], "bad tracking is 0")
  assert.equal(T.layoutWord("AB", 999).width, T.GLYPHS.A[0] + T.GLYPHS.B[0] + 40, "tracking is clamped")
}

// ---- the frame: a short word never towers -------------------------------------
{
  const long = T.frameFor(319, 6, 2.4)
  assert.deepEqual(long, { x: -0, y: 6, w: 319, h: 97 }, "a long word fills the width; crop comes off the top, the foot goes under")
  const short = T.frameFor(60, 6, 2.4)
  assert.ok(Math.abs(short.w / short.h - 2.4) < 1e-9, "a short word is padded out to the minimum aspect")
  assert.ok(Math.abs(short.x + (short.w - 60) / 2) < 1e-9, "and centred")
  assert.equal(T.frameFor(319, NaN, 2.4).y, 0, "bad crop is 0")
  assert.equal(T.frameFor(319, 99, 2.4).y, 40, "crop is clamped")
  assert.ok(T.frameFor(0, 0, 0).w >= 1, "an empty word never makes a zero-width viewBox")
}

// ---- key presses -----------------------------------------------------------------
{
  assert.equal(T.pressAt(0, 64), 1, "the key under the pointer goes all the way")
  assert.equal(T.pressAt(64, 64), 0, "the edge of the reach is untouched")
  assert.equal(T.pressAt(-32, 64), T.pressAt(32, 64), "symmetric")
  assert.equal(T.pressAt(32, 64), 0.5, "smoothstep midpoint")
  assert.equal(T.pressAt(NaN, 64), 0, "no pointer, no press")
  assert.equal(T.pressAt(10, 0), 0)

  // The spring settles on its target, and a 30Hz and a 60Hz run agree.
  let a = [108, 0]
  for (let i = 0; i < 240; i++) a = T.springStep(a[0], a[1], 0, 1 / 60)
  assert.ok(Math.abs(a[0]) < 0.05 && Math.abs(a[1]) < 0.5, "the reveal settles at rest")
  let b = [108, 0]
  let c = [108, 0]
  for (let i = 0; i < 60; i++) b = T.springStep(b[0], b[1], 0, 1 / 30)
  for (let i = 0; i < 120; i++) c = T.springStep(c[0], c[1], 0, 1 / 60)
  assert.ok(Math.abs(b[0] - c[0]) < 1e-6, "frame-rate independent")
  const woke = T.springStep(0, 520, 0, 30)
  assert.ok(Number.isFinite(woke[0]) && Math.abs(woke[0]) < 60, "a stalled tab never explodes the spring")
  assert.deepEqual(T.springStep(5, 0, 5, 0), [5, 0], "no time, no move")
  // A strike's peak stays inside the body, so it never shows below the band.
  let s = [0, 520]
  let peak = 0
  for (let i = 0; i < 120; i++) {
    s = T.springStep(s[0], s[1], 0, 1 / 60)
    peak = Math.max(peak, s[0])
  }
  assert.ok(peak > 15 && peak < 60, "a struck key dips visibly but not out of sight: " + peak.toFixed(1))

  assert.ok(Math.abs(T.approach(0, 100, 0.1, 1 / 60) - 10) < 1e-9)
  assert.ok(Math.abs(T.approach(0, 100, 0.1, 1 / 30) - T.approach(T.approach(0, 100, 0.1, 1 / 60), 100, 0.1, 1 / 60)) < 1e-9)
}

// ---- the ticker ----------------------------------------------------------------
{
  assert.equal(T.wrapOffset(250, 100), 50)
  assert.equal(T.wrapOffset(-30, 100), 70, "dragging backwards never goes negative")
  assert.equal(T.wrapOffset(-300, 100), 0)
  assert.equal(T.wrapOffset(50, 0), 0, "unmeasured is 0")
  assert.equal(T.wrapOffset(NaN, 100), 0)
  assert.equal(T.copiesFor(1280, 700), 3, "covers the view with a set to spare")
  assert.equal(T.copiesFor(390, 700), 2, "never fewer than two")
  assert.equal(T.copiesFor(1280, 0), 2)
  assert.equal(T.copiesFor(99999, 1), 40, "a degenerate set can't render thousands")
}

// ---- email -----------------------------------------------------------------------
{
  for (const ok of ["me@studio.com", " a.b+c@sub.example.co ", "x@y.io"]) assert.ok(T.isEmail(ok), ok)
  for (const bad of ["", "nope", "a@b", "a@b.c", "a b@c.com", "@c.com", "a@.com", "a@b..com", undefined]) {
    assert.ok(!T.isEmail(bad), "rejects " + bad)
  }
}

// ---- install safety ----------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "the only import may be react")

const code = src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1")
assert.doesNotMatch(code, /@import/, "no @import — the host owns Tailwind and fonts")
assert.doesNotMatch(code, /["+]\s*(\*|body|:root|html)\s*{/, "no bare global resets")
assert.doesNotMatch(code, /[`]/, "no backticks — CSS is built by concatenation")
assert.doesNotMatch(code, /\$\{/, "no template interpolation")
assert.doesNotMatch(code, /url\(["']?(https?:|\/\/)/, "nothing is fetched (url(#mask) is a local reference)")
assert.doesNotMatch(code, /<img|new Image|fetch\(/, "no images or requests")
assert.doesNotMatch(code, /innerWidth|innerHeight|scrollY/, "size from the element, not the window")
assert.doesNotMatch(code, /\bh-(full|screen)\b|height:100%/, "no percentage heights on the root")
assert.doesNotMatch(code, /localStorage|sessionStorage/, "no storage")
assert.doesNotMatch(code, /position:fixed/, "the chat bubble lives in the footer, not over the host page")

const css = src.slice(src.indexOf("const CSS ="), src.indexOf("const Check ="))
for (const m of css.matchAll(/"([^"]*)\{/g)) {
  const sel = m[1].replace(/^.*\}/, "")
  if (!sel || sel.startsWith("@")) continue
  for (const part of sel.split(",")) {
    assert.ok(/^(\.bsf|:where\(\.bsf\)|from|to|\d+%)/.test(part.trim()), "unscoped CSS rule: " + part)
  }
}
assert.ok(css.includes(":where(.bsf) a{"), "links are reset at zero specificity")
assert.ok(css.includes("container-type:inline-size"), "the root is a size container")
assert.ok(css.includes("@container (max-width: 640px)"), "columns pair up when narrow")
assert.ok(css.includes(".bsf svg{max-width:none"), "svgs opt out of Preflight's max-width")

// The wordmark: intrinsic height from its own viewBox, and no seam under it.
assert.ok(src.includes('style={{ aspectRatio: vb.w + " / " + vb.h }}'), "the wordmark's height comes from its viewBox")
assert.ok(css.includes(".bsf-word{position:relative;z-index:1;display:block;width:100%;height:auto;overflow:hidden"), "width-driven, clipped")
// The letters are holes in a paper panel, not orange paint: the footer's own
// background shows through them and runs on into the body.
assert.ok(src.includes("<mask id={maskId}"), "the wordmark is a mask")
assert.ok(src.includes('<rect x={vb.x} y={vb.y} width={vb.w} height={vb.h} fill="#fff" />'), "white keeps the paper")
assert.ok(src.includes('stroke="#000"') && css.includes(".bsf-word path{fill:none;stroke:#000"), "letters are black in the mask: they cut")
assert.ok(src.includes('fill={paper} mask={"url(#" + maskId + ")"}'), "only the paper is masked")
assert.doesNotMatch(src.slice(src.indexOf('className="bsf-word"'), src.indexOf('className="bsf-body"')), /fill=\{accent\}|stroke=\{accent\}/, "nothing in the band is painted the accent")
assert.ok(src.includes('"bsf-mask-" + uid.replace('), "mask ids are unique per instance and safe inside url()")
assert.ok(src.includes("height={CAP - 0.5 - vb.y}"), "the paper stops half a unit above the baseline so no seam shows")
assert.ok(css.includes(".bsf::before{") && css.includes(".bsf-word{position:relative;z-index:1"), "the sheen sits under the paper and shows through the holes")
assert.ok(src.includes('overflow="hidden"'), "each glyph is clipped to its own box (square ends, trimmed miters)")
assert.ok(src.includes('transform={"translate(0 " + HIDE + ")"}'), "the JSX transform is constant, so re-renders never fight the spring")

// Motion.
assert.ok(src.includes("prefers-reduced-motion"), "reads prefers-reduced-motion")
assert.ok(css.includes("@media (prefers-reduced-motion: reduce){"), "and stops the CSS motion")
assert.ok(src.includes("const start = k.revealed || reduced ? 0 : HIDE"), "reduced motion never waits for a reveal")
assert.ok(src.includes("if (!tick || reduced || !visible || !period) return"), "the ticker stops off screen and for reduced motion")
assert.ok(src.includes("if (!f || reduced) return"), "no shake for reduced motion")
assert.ok(src.includes("new IntersectionObserver"), "visibility is observed")

// Cleanup.
for (const gone of ["io.disconnect()", "ro.disconnect()", "cancelAnimationFrame(raf)", 'removeEventListener("change", onMq)', 'removeEventListener("keydown", onKey)', 'removeEventListener("pointerdown", onDown)']) {
  assert.ok(src.includes(gone), "cleanup is missing " + gone)
}
assert.ok(src.includes("if (!alive.current) return"), "a slow onSubscribe never sets state after unmount")

// Accessibility.
assert.ok(src.includes('<p className="sr-only">{word}</p>'), "the wordmark exists as text")
assert.ok(src.includes('className="bsf-word"') && src.includes('aria-hidden="true"'), "the drawn letters are hidden from readers")
assert.ok(src.includes('htmlFor={uid + "-email"}'), "the email field is labelled")
assert.ok(src.includes('role="status" aria-live="polite"'), "validation and success are announced")
assert.ok(src.includes("aria-invalid={status === \"error\" || undefined}"), "an invalid email is marked")
assert.ok(src.includes("aria-expanded={open}"), "the chat button reports its state")
assert.ok(src.includes('e.key !== "Escape"'), "Escape closes the chat card")
assert.ok(src.includes("aria-label={s.label}"), "icon links are named")
assert.ok(src.includes("aria-label={col.title}"), "each column is a named nav")
assert.ok(src.includes('if (!href || href === "#") e.preventDefault()'), "'#' never rewrites the host's hash")

// Defaults match the reference: four socials, four columns.
const defaults = (name) => (src.match(new RegExp("const " + name + "[^=]*= \\[([\\s\\S]*?)\\n\\]")) ?? [, ""])[1]
assert.equal(defaults("DEFAULT_SOCIALS").match(/label:/g).length, 4)
assert.equal(defaults("DEFAULT_COLUMNS").match(/title:/g).length, 4)
for (const icon of ["facebook", "linkedin", "x", "instagram", "youtube", "github"]) {
  assert.ok(new RegExp("\\n  " + icon + ": \\(").test(src), "built-in icon " + icon)
}

for (const f of ["demo.tsx"]) {
  const demo = read(f)
  assert.ok(demo.includes('from "@/components/ui/billboard-signup-footer"'), f + " imports the installer path")
  for (const cls of demo.match(/className="[^"]*"/g) ?? []) assert.ok(/\bw-(full|screen|\[|\d)/.test(cls), f + ": " + cls + " has no width")
}

const tsconfig = readFileSync(new URL("../tsconfig.json", import.meta.url), "utf8")
assert.ok(tsconfig.includes('"@/components/ui/billboard-signup-footer": ["./components/billboard-signup-footer/billboard-signup-footer.tsx"]'), "tsconfig path missing")

console.log("billboard-signup-footer: ok")
