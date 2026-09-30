// Runnable check for the form logic in components/postcard-contact, plus the
// install-safety rules the .tsx has to keep.
// Run: node tests/postcard-contact.test.mjs
//
// The animation can't be asserted here. What can — and what breaks silently — is
// everything it leans on: a validator that lets a bad email through sends a
// postcard nobody can answer, a card scaled larger than its envelope pokes out of
// the "sealed" envelope, and a template that prints "{firstName}" ships a typo on
// every single submission.
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

const src = readFileSync(
  new URL("../components/postcard-contact/postcard-contact.tsx", import.meta.url),
  "utf8",
)

const start = src.indexOf("// #region postcard")
const end = src.indexOf("// #endregion")
assert.ok(start > -1 && end > start, "postcard region markers missing")

let js = src.slice(start, end)
for (const t of [
  ": Partial<Record<PostcardField, string>>",
  ": Record<PostcardField, string>",
  " as Record<string, string>",
  ": { w: number; h: number }",
  ": PostcardField[]",
  ": PostcardData",
  ": (() => number)",
  ": Date",
]) {
  js = js.split(t).join("")
}
js = js.replace(/:\s*(number\[\]|string\[\]|number|string|boolean)(?!\w)/g, "")
const P = await import("data:text/javascript," + encodeURIComponent(js))
const { validate, fillTemplate, messageScale, fitInside, envelopeFor, postmarkDate, frondPath, crownPath, noise, EMPTY } = P

// ---- validation ---------------------------------------------------------------
{
  const req = ["firstName", "email", "message"]
  const ok = { ...EMPTY, firstName: "Sienna", email: "sienna@example.com", message: "hi" }
  assert.deepEqual(validate(ok, req), {}, "a complete card can be sent")
  const empty = validate(EMPTY, req)
  assert.deepEqual(Object.keys(empty).sort(), ["email", "firstName", "message"], "every required field is reported")
  assert.deepEqual(validate({ ...ok, firstName: "   " }, req).firstName !== undefined, true, "whitespace is not a name")
  for (const bad of ["sienna", "sienna@", "@example.com", "sienna@example", "sienna@example.c", "a b@example.com"]) {
    assert.ok(validate({ ...ok, email: bad }, req).email, "accepted a bad email: " + bad)
  }
  for (const good of ["s@example.co", "first.last+tag@sub.example.org", " spaced@example.com "]) {
    assert.equal(validate({ ...ok, email: good }, req).email, undefined, "rejected a good email: " + good)
  }
  // An optional email is still checked when given, and an empty one is fine.
  assert.ok(validate({ ...EMPTY, email: "nope" }, []).email, "an optional email is still checked")
  assert.deepEqual(validate(EMPTY, []), {}, "nothing required, nothing wrong")
  assert.ok(validate({ ...ok, phone: "12" }, req).phone, "a two-digit phone is not a phone")
  assert.equal(validate({ ...ok, phone: "+297 (582) 1234" }, req).phone, undefined, "formatted phones pass")
  for (const v of Object.values(validate(EMPTY, ["firstName", "lastName", "email", "address", "phone", "subject", "message"]))) {
    assert.ok(typeof v === "string" && v.length > 3 && !/undefined/.test(v), "every error reads as a sentence: " + v)
  }
}

// ---- templates -----------------------------------------------------------------
{
  const d = { ...EMPTY, firstName: " Sienna ", lastName: "Reyes" }
  assert.equal(fillTemplate("cozy vibes from {firstName}", d), "cozy vibes from Sienna")
  assert.equal(fillTemplate("{firstName} {lastName}", d), "Sienna Reyes")
  assert.equal(fillTemplate("Thank you, {firstName}!", EMPTY), "Thank you, a friend!", "no name reads as a friend")
  assert.equal(fillTemplate("Hi {lastName}, thanks!", EMPTY), "Hi, thanks!", "an empty token leaves no stray space")
  assert.equal(fillTemplate("{nope} here", d), "here", "an unknown token prints nothing, never the braces")
  assert.doesNotMatch(fillTemplate("{firstName} {email} {message}", EMPTY), /[{}]/, "no braces survive")
}

// ---- the writing shrinks, but not to nothing ---------------------------------------
{
  assert.equal(messageScale(0, 600), 1, "an empty card writes full size")
  assert.ok(messageScale(600, 600) >= 0.69 && messageScale(600, 600) <= 0.71, "a full card writes at about 70%")
  let prev = 1
  for (let n = 0; n <= 700; n += 7) {
    const s = messageScale(n, 600)
    assert.ok(s <= prev + 1e-9 && s >= 0.69, "scale must fall monotonically and stay readable at " + n)
    prev = s
  }
  for (const m of [0, -5, NaN]) assert.ok(Number.isFinite(messageScale(50, m)), "a bad maxLength must not produce NaN")
}

// ---- the card fits inside its envelope ----------------------------------------------
{
  for (const [w, h] of [[980, 628], [640, 410], [360, 940], [300, 1200], [1200, 300]]) {
    const e = envelopeFor(w, h)
    assert.ok(Math.abs(e.w / e.h - 1.6) < 1e-9, "envelopes are 1.6 : 1")
    assert.ok(e.w <= w * 0.94 + 1e-9 && e.h <= h + 1e-9, "the envelope sits within the card's footprint")
    const s = fitInside(w, h, e.w, e.h, 0.1)
    assert.ok(s > 0, "a card always fits at some scale")
    assert.ok(w * s <= e.w * 0.9 + 1e-6 && h * s <= e.h * 0.9 + 1e-6, "the sealed card pokes out of its envelope at " + w + "x" + h)
  }
  assert.equal(fitInside(0, 100, 100, 100, 0.1), 1, "an unmeasured card does not divide by zero")
}

// ---- the postmark date ---------------------------------------------------------------
assert.equal(postmarkDate(new Date(2026, 8, 3)), "03 SEP 2026")
assert.equal(postmarkDate(new Date(2026, 11, 31)), "31 DEC 2026")

// ---- the palms --------------------------------------------------------------------------
{
  const a = frondPath(0, 0, 0.5, 400, 0.3, 120, 20, 7)
  assert.equal(a, frondPath(0, 0, 0.5, 400, 0.3, 120, 20, 7), "same seed, same frond")
  assert.match(a, /^M[-\d. LQZM]+$/, "frond is plain path data")
  assert.doesNotMatch(a, /NaN|Infinity/, "no NaN in the frond")
  assert.equal((a.match(/Z/g) || []).length, 1 + 20 * 2, "a stem plus two leaflets per step")
  const c = crownPath(-80, 60, -0.35, 1.75, 8, 640, 0.3, 3)
  assert.doesNotMatch(c, /NaN|Infinity/, "no NaN in the crown")
  assert.ok(c.length < 200000, "the crown path stays a sane size: " + c.length)
}

// ---- the paper -----------------------------------------------------------------------------
{
  const n = noise(200, "0.8", 2, 3, "1 0 0 0 0")
  assert.ok(n.startsWith('url("data:image/svg+xml,') && n.endsWith('")'), "noise is a CSS url()")
  assert.doesNotMatch(n.slice(5, -2), /"/, "the data URI must not close its own quotes")
  assert.ok(decodeURIComponent(n).includes("stitchTiles='stitch'"), "the noise tiles without seams")
}

// ---- install safety ----------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "the only import may be react")

const code = src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1")
assert.doesNotMatch(code, /@import/, "no @import — the host owns Tailwind and fonts")
assert.doesNotMatch(code, /^\s*(\*|body|:root|html)\s*{/m, "no bare global resets")
assert.doesNotMatch(code, /"(\*|body|html|:root)\{/, "no bare global resets inside the CSS string")
assert.doesNotMatch(code, /[`]/, "no backticks — build CSS strings with concatenation")
assert.doesNotMatch(code, /\$\{/, "no template interpolation anywhere near the CSS")
assert.doesNotMatch(code, /https?:\/\/(?!www\.w3\.org)/, "nothing is fetched: the capture sandbox blocks other origins")
assert.doesNotMatch(code, /innerWidth|innerHeight|scrollY/, "size from the element, not the window")

// Every rule in the stylesheet is scoped to this component.
const css = src.slice(src.indexOf("const CSS ="), src.indexOf("const DEFAULT_REQUIRED"))
for (const m of css.matchAll(/"([^"]*)\{/g)) {
  const sel = m[1].split("}").pop()
  if (!sel || sel.startsWith("@")) continue
  for (const part of sel.split(",")) assert.match(part.trim(), /^\.pc-/, "unscoped selector: " + part)
}

// A definite minimum height, never a percentage one.
assert.ok(src.includes('height = "100svh"') && src.includes("minHeight: height"), "the section carries its own height")
const root = src.slice(src.lastIndexOf("  return (\n    <section"), src.indexOf("<style>{CSS}</style>"))
assert.doesNotMatch(root, /\bh-(full|screen)\b/, "no percentage height on the root")

// The card is sized in container units off the stage, so it scales with its box.
assert.ok(css.includes("container-type:inline-size"), "the stage must be a size container")
assert.ok(css.includes("@container (max-width: 640px)"), "and the card stacks when it is narrow")

// Preflight: absolutely positioned SVG layers must opt out of max-width:100%.
assert.ok((code.match(/max-width:none|maxWidth: "none"/g) || []).length >= 6, "svg layers must opt out of max-width")

// Motion is the reader's choice.
assert.ok(src.includes("prefers-reduced-motion: reduce"), "must read prefers-reduced-motion")
assert.ok(/const m = reduced\(\) \? 0 : 1/.test(src), "reduced motion must collapse the send animation")

// Every running animation is cancelled on unmount, and a stale run bails out.
assert.ok(src.includes("live.forEach((a) => a.cancel())"), "animations are cancelled on unmount")
assert.ok((src.match(/if \(!alive\(\)\) return/g) || []).length >= 5, "each await in the send sequence checks it is still current")

// It is a real form: labelled fields, errors tied to inputs, a live status.
for (const f of ["firstName", "lastName", "email", "address", "phone", "subject", "message"]) {
  assert.ok(src.includes('"' + f + '"'), "missing field " + f)
}
assert.ok(src.includes("htmlFor={uid + key}"), "every line has a label")
assert.ok(src.includes("aria-invalid") && src.includes("aria-describedby"), "errors are tied to their inputs")
assert.ok(src.includes('role="status"') && src.includes('aria-live="polite"'), "progress is announced")
assert.ok(src.includes('autoComplete={auto}') && src.includes('"email", "email"'), "autofill works")
assert.ok(src.includes('name="company"') && src.includes("tabIndex={-1}"), "the honeypot is out of the tab order")
assert.ok(src.includes('e.key === "Enter" && (e.metaKey || e.ctrlKey)'), "Ctrl/Cmd+Enter sends")

// A failed send comes back, and nothing typed is lost.
assert.ok(src.includes("Return to sender") && src.includes("const reopen"), "a failed send can be reopened")
assert.ok(/setData\(\{ \.\.\.EMPTY, stamp: data\.stamp \}\)/.test(src), "only 'write another' clears the card")

// Ids are per instance; two postcards on a page must not share filters or masks.
assert.ok(src.includes("React.useId()"), "ids must be unique per mount")

// A demo wrapper left at width:auto collapses inside 21st's centring flex.
for (const demo of ["demo.tsx", "demo-dusk.tsx"]) {
  const first = readFileSync(new URL("../components/postcard-contact/" + demo, import.meta.url), "utf8")
    .match(/return \(\s*<div className="([^"]*)"/)
  assert.ok(first && /\bw-(full|screen|\[|\d)/.test(first[1]), demo + " wraps the postcard without a width")
}

console.log("postcard-contact: ok")
