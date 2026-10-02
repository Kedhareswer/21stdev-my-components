// Runnable check for the address, well and projection math in
// components/sealed-invite-waitlist, plus the install-safety rules the .tsx has to keep.
// Run: node tests/sealed-invite-waitlist.test.mjs
//
// The envelope and the grid can't be looked at from here. What can — and what
// breaks silently — is around them: an address check that lets "a@b" through
// posts junk to the installer's list, a place number that prints "Nº NaN" on
// the card, and a well that goes infinite at its centre draws every line in
// the grid straight through the slot.
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

const src = readFileSync(
  new URL("../components/sealed-invite-waitlist/sealed-invite-waitlist.tsx", import.meta.url),
  "utf8",
)

const start = src.indexOf("// #region invite")
const end = src.indexOf("// #endregion")
assert.ok(start > -1 && end > start, "invite region markers missing")

const js = src.slice(start, end).replace(/:\s*(number|string|boolean)(?!\w)/g, "")
const T = await import("data:text/javascript," + encodeURIComponent(js))
const { clamp01, isEmail, maskEmail, serial, withAlpha, wellDepth, project, timeline } = T

// ---- addresses ----------------------------------------------------------------
{
  for (const ok of ["a@b.co", "kedhar@gmail.com", "first.last+tag@mail.example.org", "  padded@site.io  "]) {
    assert.ok(isEmail(ok), ok + " should pass")
  }
  for (const bad of ["", "kedhar", "kedhar@", "@gmail.com", "a@b", "a@b.c", "a b@c.io", "a@@b.io", "a@b..io", "a@.io"]) {
    assert.ok(!isEmail(bad), JSON.stringify(bad) + " should fail")
  }

  assert.equal(maskEmail("kedhar@gmail.com"), "ke•••@gmail.com", "two letters survive")
  assert.equal(maskEmail("jo@x.io"), "j•••@x.io", "a two-letter name keeps one")
  assert.equal(maskEmail("a@x.io"), "a•••@x.io", "a one-letter name keeps it")
  assert.equal(maskEmail("  ke@x.io "), "k•••@x.io", "trimmed first")
  assert.equal(maskEmail("nope"), "nope", "no @, nothing to hide")
}

// ---- the place in line ----------------------------------------------------------
{
  assert.equal(serial(42, 4), "Nº 0042")
  assert.equal(serial(12345, 4), "Nº 12345", "a long number is never truncated")
  assert.equal(serial(7.9, 2), "Nº 07", "whole places only")
  assert.equal(serial(0, 3), "Nº 000")
  for (const bad of [NaN, Infinity, -1, undefined, null, "12"]) {
    assert.equal(serial(bad, 4), "", "nothing printed for " + String(bad))
  }
  for (const d of [0, -3, NaN, 99]) assert.ok(serial(5, d).startsWith("Nº "), "odd digit counts still print")
}

// ---- colour -----------------------------------------------------------------------
{
  assert.equal(withAlpha("#c9a46a", 0.42), "rgba(201,164,106,0.42)")
  assert.equal(withAlpha("#fff", 1), "rgba(255,255,255,1)", "short hex expands")
  assert.equal(withAlpha("#000", 4), "rgba(0,0,0,1)", "alpha is clamped")
  assert.equal(withAlpha("oklch(0.7 0.1 80)", 0.3), "color-mix(in srgb, oklch(0.7 0.1 80) 30%, transparent)")
}

// ---- the well ---------------------------------------------------------------------
{
  assert.equal(wellDepth(0, 5, 1.5), -5, "the throat is exactly as deep as asked")
  assert.ok(Math.abs(wellDepth(40, 5, 1.5)) < 0.01, "and flat far out")
  let prev = -Infinity
  for (let r = 0; r < 20; r += 0.05) {
    const y = wellDepth(r, 5, 1.5)
    assert.ok(Number.isFinite(y) && y <= 0, "finite and never above the plane at " + r)
    assert.ok(y >= prev, "the well rises monotonically out of the throat")
    prev = y
  }
  assert.equal(wellDepth(1, 5, 0), 0, "no throat, no well")

  // Straight down the middle lands on the centre; further away reads higher up.
  const c = project(0, 0, 0, 1.1, 7, 500)
  assert.deepEqual([Math.round(c[0]) + 0, Math.round(c[1]) + 0], [0, 0])
  assert.ok(project(0, 0, 3, 1.1, 7, 500)[1] < project(0, 0, -3, 1.1, 7, 500)[1], "far is up the screen")
  assert.ok(project(2, 0, 0, 1.1, 7, 500)[0] > 0, "right is right")
  assert.equal(project(0, 0, -50, 1.1, 7, 500), null, "behind the camera is culled, not mirrored")
  for (const [x, y, z] of [[0, -5, 0], [9, 0, 9], [-9, 0, -2]]) {
    const pt = project(x, y, z, 1.12, 7.4, 600)
    assert.ok(pt && pt.every(Number.isFinite), "grid corner projects")
  }
}

assert.deepEqual(timeline(true), [0, 0], "reduced motion skips the choreography")
assert.ok(timeline(false).every((ms) => ms > 0), "otherwise it waits for each step")
assert.equal(clamp01(NaN), 0)

// ---- install safety -----------------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "the only import may be react")

const code = src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1")
assert.doesNotMatch(code, /@import/, "no @import — the host owns Tailwind and fonts")
assert.doesNotMatch(code, /"\s*(\*|body|:root|html)\s*\{/, "no bare global resets")
assert.doesNotMatch(code, /[`]/, "no backticks — build CSS strings with concatenation")
assert.doesNotMatch(code, /\$\{/, "no template interpolation anywhere near the CSS")
assert.doesNotMatch(code, /https?:\/\/(?!www\.w3\.org)/, "nothing is fetched: the capture sandbox blocks other origins")
assert.doesNotMatch(code, /innerWidth|innerHeight|scrollY/, "size from the element, not the window")

// Every rule in the stylesheet is scoped to this component.
const css = src.slice(src.indexOf("const CSS ="), src.indexOf("/** The flap reaches"))
for (const m of css.matchAll(/"([^"]*)"/g)) {
  for (const rule of m[1].split("}")) {
    const sel = rule.split("{")[0].trim()
    // at-rules and keyframe steps aren't selectors
    if (!sel || sel.startsWith("@") || /^(\d+%,?)+$/.test(sel)) continue
    for (const part of sel.split(",")) assert.match(part.trim(), /^\.siw/, "unscoped selector " + part)
  }
}

// A definite height, never a percentage chain from the host page.
assert.ok(src.includes('height = "100svh"'), "height defaults to a definite length")
const root = src.slice(src.indexOf("      ref={rootRef}"), src.indexOf("<style>{CSS}</style>"))
assert.doesNotMatch(root, /\bh-(full|screen)\b/, "no percentage height on the root")
assert.ok(src.includes('containerType: "size"'), "the scene is a size container for cqw/cqh")

// Preflight: canvas/svg get max-width:100%, which absolute full-bleed layers opt out of.
assert.ok((src.match(/max-width:none|maxWidth: "none"/g) || []).length >= 3, "full-bleed layers must opt out of max-width")

// The canvas redraws when resized, and everything allocated is released.
assert.ok(src.includes("canvas.clientWidth"), "the grid measures its own box")
for (const gone of ["observer.disconnect()", "io.disconnect()", "cancelAnimationFrame(raf)", 'removeEventListener("change", onMq)', "clearTimeout(t)"]) {
  assert.ok(src.includes(gone), "cleanup is missing " + gone)
}

// Reduced motion: no transitions, no loop, no choreography.
assert.ok(src.includes("prefers-reduced-motion: reduce"), "must read prefers-reduced-motion")
assert.ok(/\.siw \*\{transition-duration:0s !important;transition-delay:0s !important;animation:none !important\}/.test(src), "and stop the CSS motion")
assert.ok(/if \(running \|\| reduced\) return/.test(src), "and the grid loop")

// It's a real form: labelled, announced, operable without a pointer.
assert.ok(src.includes("<form") && src.includes('type="submit"'), "Enter submits")
assert.ok(src.includes('type="email"') && src.includes('autoComplete="email"'), "the field is an email field")
assert.ok(src.includes('className="sr-only"') && src.includes("htmlFor="), "the field has a label")
assert.ok(src.includes('role="alert"') && src.includes("aria-invalid"), "errors are announced and tied to the field")
assert.ok(src.includes('role="status"'), "the invitation is announced")
assert.ok(/visibility:hidden/.test(src), "the hidden form leaves the tab order")

// Gradient/filter ids are per instance; two waitlists on a page must not share one.
assert.ok(src.includes("React.useId()"), "svg ids must be unique per mount")

for (const demo of ["demo.tsx", "demo-onyx.tsx", "demo-custom.tsx"]) {
  const d = readFileSync(new URL("../components/sealed-invite-waitlist/" + demo, import.meta.url), "utf8")
  assert.ok(d.includes('from "@/components/ui/sealed-invite-waitlist"'), demo + " imports the installed path")
}

console.log("sealed-invite-waitlist: ok")
