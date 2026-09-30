// Runnable check for components/ticket-stub-footer: the counter, typewriter,
// scramble, halftone and globe maths, plus the install-safety rules.
// Run: node tests/ticket-stub-footer.test.mjs
//
// What breaks silently here: a halftone whose "solid" dots leave pinholes in
// every letter, a scramble that changes the text's length and reflows the
// justified blurb on every frame, a typewriter that skips a phrase, a globe
// that draws its back half through the front, and a short wordmark that
// scales to fill the width and stands 400px tall.
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const read = (file) =>
  readFileSync(new URL("../components/ticket-stub-footer/" + file, import.meta.url), "utf8").replace(/\r\n/g, "\n")
const src = read("ticket-stub-footer.tsx")

const start = src.indexOf("// #region stub")
const end = src.indexOf("// #endregion")
assert.ok(start > -1 && end > start, "stub region markers missing")
const T = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(src.slice(start, end))))

// ---- the counter prints ------------------------------------------------------
{
  assert.equal(T.formatCount(12745012), "12,745,012")
  assert.equal(T.formatCount(999), "999")
  assert.equal(T.formatCount(1000), "1,000")
  assert.equal(T.formatCount(0), "0")
  assert.equal(T.formatCount(1234.9), "1,234", "fractions are floored, never rounded up past the real count")
  for (const bad of [-5, NaN, Infinity, -Infinity]) assert.equal(T.formatCount(bad), "0", "garbage prints 0, not " + bad)
  assert.equal(T.formatCount(1234567, " "), "1 234 567", "the separator is configurable")

  let seq = 0
  const rand = () => [0.5, 0.1, 0.9, 0.0, 0.99][seq++ % 5]
  for (let i = 0; i < 20; i++) {
    const t = T.nextTick(1.8, rand)
    assert.ok(t.delay >= 450 && t.delay <= 1350, "tick delay out of range")
    assert.ok(Number.isInteger(t.add) && t.add >= 1, "a running agent always solves something")
  }
  assert.equal(T.nextTick(0).add, 0, "rate 0 stops the counter")
  assert.equal(T.nextTick(NaN).add, 0)
  assert.equal(T.nextTick(-3).add, 0)
}

// ---- the chamfer is a closed, 8-point polygon with no template strings ------
{
  const c = T.chamfer(9, 9, 9, 9)
  assert.ok(c.startsWith("polygon(") && c.endsWith(")"))
  assert.equal(c.split(",").length, 8, "four cut corners, eight points")
  assert.equal(T.chamfer(0, 0, 12, 0).match(/12px/g).length, 2, "only the bottom-right corner is cut")
}

// ---- the typewriter types every phrase, in order, and loops -----------------
{
  const P = ["Ready to ship", "Guardrails on", "X"]
  const k = T.TYPE
  assert.equal(T.typeFrame(P, 0).text, "R", "starts typing immediately")
  assert.equal(T.typeFrame(P, 0).phase, "type")
  const full = P[0].length * k.type
  assert.equal(T.typeFrame(P, full + 1).text, P[0], "then holds the whole phrase")
  assert.equal(T.typeFrame(P, full + 1).phase, "hold")
  const seen = new Set()
  let prevIndex = 0
  let total = 0
  for (const p of P) total += p.length * k.type + k.hold + p.length * k.erase + k.gap
  for (let ms = 0; ms < total * 2; ms += 7) {
    const f = T.typeFrame(P, ms)
    assert.ok(P[f.index].startsWith(f.text), "text is always a prefix of its phrase")
    if (f.phase === "hold") seen.add(f.index)
    assert.ok(f.index === prevIndex || f.index === (prevIndex + 1) % P.length, "phrases advance one at a time")
    prevIndex = f.index
  }
  assert.equal(seen.size, P.length, "every phrase is shown in full")
  assert.deepEqual(T.typeFrame(P, total + 3), T.typeFrame(P, 3), "it loops")
  assert.equal(T.typeFrame([], 500).text, "", "no phrases, no crash")
  assert.equal(T.typeFrame(["", ""], 500).text, "")
  assert.equal(T.typeFrame(P, NaN).text, "R", "a bad clock is time zero")
  assert.equal(T.typeFrame(P, -10).index, T.typeFrame(P, total - 10).index, "negative time wraps")
}

// ---- the scramble never reflows the blurb -------------------------------------
{
  const text = "Connect your help center, knowledge base, and CRM software."
  for (let p = 0; p <= 1.2; p += 0.05) {
    for (const tick of [0, 1, 17]) {
      const s = T.scramble(text, p, tick)
      assert.equal(s.length, text.length, "length changed at p=" + p)
      for (let i = 0; i < text.length; i++) {
        if (/\s/.test(text[i])) assert.equal(s[i], text[i], "whitespace moved at p=" + p)
        else assert.ok(!/\s/.test(s[i]), "a letter became whitespace at p=" + p)
      }
    }
  }
  assert.equal(T.scramble(text, 1, 5), text, "done means the real text")
  assert.equal(T.scramble(text, 0.5, 3), T.scramble(text, 0.5, 3), "frames are reproducible")
  // settles left to right
  const settled = (p) => [...T.scramble(text, p, 9)].filter((c, i) => c === text[i]).length
  assert.ok(settled(0.3) <= settled(0.6) && settled(0.6) <= settled(0.9), "decodes monotonically")
  for (let n = 0; n < 1000; n++) {
    const h = T.hash(n)
    assert.ok(h >= 0 && h < 1, "hash out of range")
  }
}

// ---- the halftone ------------------------------------------------------------
{
  const base = { fade: 0.44, depth: 0.84, lensX: 0, lensY: 0, lensR: 80, lens: 0, reveal: 1, wave: 0, time: 0, rings: [], ringW: 20 }
  const W = 960
  const H = 210
  // Top of the word is solid, the foot fades, never below the chosen depth.
  assert.equal(T.coverage(300, 10, W, H, base), 1, "the top of the word is solid")
  assert.equal(T.coverage(300, H * 0.4, W, H, base), 1, "solid down to the fade line")
  let prev = 1
  for (let y = 0; y <= H; y += 2) {
    const c = T.coverage(300, y, W, H, base)
    assert.ok(c <= prev + 1e-12, "coverage rises going down at y=" + y)
    prev = c
  }
  assert.ok(T.coverage(300, H, W, H, base) >= 1 - base.depth - 1e-9, "the foot keeps some ink")
  assert.ok(T.coverage(300, H, W, H, base) < 0.4, "but really is halftoned")

  // The dot radius: a full cell must close every gap on the staggered grid,
  // or the solid part of every letter is full of pinholes.
  const cell = 6
  const R = T.dotRadius(1, cell)
  const tri = [[0, 0], [cell, 0], [cell / 2, cell]] // two dots in a row + the one between them below
  const [a, b, c] = tri.map(([x, y], i) => [x, y, i])
  const la = Math.hypot(b[0] - c[0], b[1] - c[1])
  const lb = Math.hypot(a[0] - c[0], a[1] - c[1])
  const lc = Math.hypot(a[0] - b[0], a[1] - b[1])
  const circum = (la * lb * lc) / (4 * ((cell * cell) / 2))
  assert.ok(R > circum, "full dots must overlap: r=" + R + " vs covering radius " + circum)
  assert.equal(T.dotRadius(0, cell), 0)
  assert.equal(T.dotRadius(-1, cell), 0, "negative coverage is no dot")
  assert.equal(T.dotRadius(4, cell), R, "coverage is clamped")
  for (let c2 = 0.05; c2 < 1; c2 += 0.05) assert.ok(T.dotRadius(c2, cell) < T.dotRadius(c2 + 0.05, cell), "radius grows with coverage")

  // The lens dissolves the word under the pointer, and only there.
  const lens = { ...base, lens: 0.95, lensX: 480, lensY: 60 }
  assert.ok(T.coverage(480, 60, W, H, lens) < 0.1, "under the pointer the ink breaks up")
  assert.ok(T.coverage(40, 20, W, H, lens) > 0.999, "far from it the word is untouched")
  // A ripple dents a ring, not a disc.
  const ring = { ...base, rings: [{ x: 480, y: 60, r: 100, a: 0.9 }] }
  assert.ok(T.coverage(580, 60, W, H, ring) < 0.2, "on the ring")
  assert.ok(T.coverage(480, 60, W, H, ring) > 0.95, "not in the middle")
  // The print-in sweeps left to right and finishes.
  assert.equal(T.coverage(10, 10, W, H, { ...base, reveal: 0 }), 0, "nothing before the reveal")
  assert.ok(T.coverage(10, 10, W, H, { ...base, reveal: 0.5 }) > T.coverage(900, 10, W, H, { ...base, reveal: 0.5 }), "left first")
  assert.equal(T.coverage(W, 10, W, H, { ...base, reveal: 1 }), 1, "and all of it at the end")
  for (const s of [base, lens, ring, { ...base, wave: 0.06, time: 3.2 }]) {
    for (let x = 0; x <= W; x += 37) for (let y = 0; y <= H; y += 13) {
      const v = T.coverage(x, y, W, H, s)
      assert.ok(v >= 0 && v <= 1 && Number.isFinite(v), "coverage out of [0,1]")
    }
  }
}

// ---- the wordmark fits, and a short one doesn't tower ------------------------
{
  // "Dispatch" is wide: it fills the width and stays under the cap.
  const wide = T.fitWord(480, 72, 960, 960 * T.MAX_CAP, 8)
  assert.ok(Math.abs((480 * wide.size) / 100 - 960) < 1e-9, "a long word fills the width")
  assert.equal(wide.extra, 0, "and isn't tracked out")
  // "Pilot" is short: capped by height, the leftover spread between letters.
  const short = T.fitWord(260, 72, 960, 960 * T.MAX_CAP, 5)
  assert.ok((72 * short.size) / 100 <= 960 * T.MAX_CAP + 1e-9, "a short word is capped by height")
  assert.ok(short.extra > 0, "and spread to the width")
  assert.ok(Math.abs((260 * short.size) / 100 + short.extra * 4 - 960) < 1e-6, "exactly")
  assert.deepEqual(T.fitWord(0, 72, 960, 190, 3), { size: 0, extra: 0 }, "an empty word is nothing, not Infinity")
  assert.equal(T.fitWord(260, 72, 960, 190, 1).extra, 0, "one letter has nowhere to spread")
}

// ---- the globe ---------------------------------------------------------------
{
  for (const [th, lon, tilt, roll] of [[0, 0, 0, 0], [1, 2, 0.3, -1.3], [4, -1, 1, 2]]) {
    const p = T.project(th, lon, tilt, roll)
    assert.ok(Math.abs(Math.hypot(...p) - 1) < 1e-12, "points stay on the unit sphere")
  }
  assert.deepEqual(T.project(0, 0, 0, 0).map((v) => Math.round(v * 1e9) / 1e9), [0, 0, 1], "lon 0 faces the viewer")
  const d = T.meridianPath(0.4, 0.34, -1.36, 200, 200, 150)
  assert.match(d, /^M[\d.\- ]+(L[\d.\- ]+)+/, "a meridian is a polyline")
  // Only the front half: every drawn vertex projects from z >= 0.
  const steps = 96
  let front = 0
  for (let i = 0; i <= steps; i++) if (T.project((i / steps) * Math.PI * 2, 0.4, 0.34, -1.36)[2] >= 0) front++
  assert.equal(d.match(/[ML]/g).length, front, "the back half is never drawn")
  for (const m of d.matchAll(/[ML]([\d.-]+) ([\d.-]+)/g)) {
    assert.ok(Math.hypot(m[1] - 200, m[2] - 200) <= 150.2, "vertex off the globe")
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
assert.doesNotMatch(code, /https?:\/\/(?!www\.w3\.org)/, "nothing is fetched")
assert.doesNotMatch(code, /innerWidth|innerHeight|scrollY/, "size from the element, not the window")
assert.doesNotMatch(code, /\bh-(full|screen)\b/, "no percentage-height classes")
assert.doesNotMatch(code, /localStorage|sessionStorage/, "no storage")

// Every rule is scoped under the component's own prefix.
const css = src.slice(src.indexOf("const CSS ="), src.indexOf('/** Diamond with a play cut-out'))
for (const m of css.matchAll(/"([^"]*)\{/g)) {
  const sel = m[1].replace(/^.*\}/, "")
  if (!sel || sel.startsWith("@")) continue
  assert.ok(/^(\.tsf|:where\(\.tsf\)|from|to|\d+%|50%)/.test(sel.trim()), "unscoped CSS rule: " + sel)
}
// Element resets must not out-rank the component's own classes: .tsf button
// beats .tsf-stub and the stub loses its colour.
assert.ok(!/"\.tsf (a|button)\{/.test(css), "element resets go through :where(.tsf)")
assert.ok(css.includes(":where(.tsf) button{"), "buttons are reset at zero specificity")

// The root is intrinsic-height: no percentage height anywhere that isn't
// inside a box of known size.
assert.ok(src.includes("container-type:inline-size"), "the root is a size container")
assert.ok(/cqw/.test(css), "sizes scale with the component, not the viewport")
assert.ok(src.includes("@container (max-width: 860px)"), "stacks when narrow")

// Preflight: every svg/canvas that's positioned or sized opts out of max-width.
assert.ok((css.match(/max-width:none/g) || []).length >= 6, "svgs and the canvas opt out of max-width")

// Motion.
assert.ok(src.includes("prefers-reduced-motion"), "reads prefers-reduced-motion")
assert.ok(css.includes("@media (prefers-reduced-motion: reduce){"), "and stops the CSS animation")
assert.ok(src.includes("if (reduced || !visible) return () => ro.disconnect()"), "the globe holds still")
assert.ok(src.includes("const busy = !reduced && halftone && visible"), "the wordmark only animates when it may")
assert.ok(src.includes("new IntersectionObserver"), "work stops off screen")

// Cleanup.
for (const gone of ["io.disconnect()", "ro.disconnect()", "cancelAnimationFrame(raf)", "clearInterval(id)", "clearTimeout(id)", 'removeEventListener("change", onMq)']) {
  assert.ok(src.includes(gone), "cleanup is missing " + gone)
}

// Accessibility: controls are buttons, state is announced, drawings are text.
assert.ok(src.includes("aria-pressed={active}"), "the status toggle reports its state")
assert.ok(src.includes('aria-current={section === i ? "true" : undefined}'), "the index marks the active row")
assert.ok(src.includes('aria-label="Back to top"'))
assert.ok(src.includes('<p className="sr-only">{word}</p>'), "the wordmark exists as text")
assert.ok(src.includes('<span className="sr-only">{formatCount(total)}</span>'), "the counter exists as text")
assert.ok(src.includes('<span className="sr-only">{text}</span>'), "the blurb is readable while it decodes")
assert.ok(src.includes("touch-action:pan-y"), "the page still scrolls over the drawings on touch")
// "#" links must not rewrite the host page's hash.
assert.ok(src.includes('if (!href || href === "#") e.preventDefault()'))

// Defaults match the reference.
const count = (name) => (src.match(new RegExp("const " + name + "[^=]*= \\[([\\s\\S]*?)\\n\\]")) ?? [, ""])[1].match(/label:/g)?.length
assert.equal(count("DEFAULT_SECTIONS"), 8)

// A demo wrapper left at width:auto collapses inside 21st's centring flex.
for (const f of ["demo.tsx", "demo-paper.tsx"]) {
  const demo = read(f)
  assert.ok(demo.includes('from "@/components/ui/ticket-stub-footer"'), f + " imports the installer path")
  for (const cls of demo.match(/className="[^"]*"/g) ?? []) assert.ok(/\bw-(full|screen|\[|\d)/.test(cls), f + ": " + cls + " has no width")
}

// tsc needs its own line per component.
const tsconfig = readFileSync(new URL("../tsconfig.json", import.meta.url), "utf8")
assert.ok(tsconfig.includes('"@/components/ui/ticket-stub-footer": ["./components/ticket-stub-footer/ticket-stub-footer.tsx"]'), "tsconfig path missing")

console.log("ticket-stub-footer: ok")
