// Runnable + install-safety check for components/flatlay-resume-board.
// Run: node tests/flatlay-resume-board.test.mjs
//
// The board draws two real, scannable QR codes, so the encoder is the part
// that can break silently: a wrong module anywhere still looks exactly like a
// QR code and simply will not scan. The encoder lives in the .tsx so the
// published component stays one file, so we lift the marked region out and
// check it against matrices captured from a build verified by decoding every
// one of them back with a third-party reader.
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { createHash } from "node:crypto"

const src = readFileSync(
  new URL("../components/flatlay-resume-board/flatlay-resume-board.tsx", import.meta.url),
  "utf8",
)

/* ---------- the QR encoder ---------- */

const start = src.indexOf("// #region qr")
const end = src.indexOf("// #endregion")
assert.ok(start > -1 && end > start, "qr region markers missing")

const js = src
  .slice(start, end)
  .replace(/:\s*(number\[\]\[\]|number\[\]|boolean\[\]\[\]|number|string|boolean)(?=[,)\s=])/g, "")
const { qrMatrix } = await import("data:text/javascript," + encodeURIComponent(js))

const digest = (m) => createHash("sha256").update(m.map((r) => r.join("")).join("|")).digest("hex").slice(0, 16)

// Captured from a build whose every matrix was decoded back to its exact input
// by jsQR. Any drift here means the code stopped scanning.
const GOLDEN = [
  ["https://kedhar.vercel.app/", 2, "869500b9346b25ba"],
  ["https://github.com/Kedhareswer", 3, "b98d68eebb0eab7a"],
  ["https://www.linkedin.com/in/kedhareswernaidu", 4, "a5defd30cbe42351"],
  ["HELLO", 1, "e0734fb3f3f2ac2b"],
  ["a", 1, "62efa8770049f495"],
  ["u".repeat(110), 7, "03d0cd6b2847e6cb"],
  ["u".repeat(200), 10, "11fae0f513794f31"],
]
for (const [text, version, hash] of GOLDEN) {
  const m = qrMatrix(text)
  assert.ok(m, `no matrix for ${text.slice(0, 20)}`)
  assert.equal(m.length, version * 4 + 17, `wrong version for ${text.slice(0, 20)}`)
  assert.equal(digest(m), hash, `matrix changed for ${JSON.stringify(text.slice(0, 24))}`)
}

// Versions 7 and up carry alignment patterns centred on row/column 6, which
// overlap the timing pattern. Skipping those is the bug that makes every large
// code unscannable while still looking perfectly plausible.
const big = qrMatrix("u".repeat(110))
// The 5x5 is a solid outer ring, a light inner ring, and a dark centre.
const alignmentAt = (r, c) => {
  for (let i = -2; i <= 2; i++) {
    for (let j = -2; j <= 2; j++) {
      const ring = Math.max(Math.abs(i), Math.abs(j))
      if (big[r + i][c + j] !== (ring === 1 ? 0 : 1)) return false
    }
  }
  return true
}
assert.ok(alignmentAt(6, 22), "alignment pattern on the timing row is missing")
assert.ok(alignmentAt(22, 6), "alignment pattern on the timing column is missing")
assert.ok(alignmentAt(22, 22), "interior alignment pattern is missing")

// Finder patterns, in all three corners.
const small = qrMatrix("HELLO")
const n = small.length
for (const [r0, c0] of [[0, 0], [0, n - 7], [n - 7, 0]]) {
  assert.equal(small[r0][c0], 1, "finder corner missing")
  assert.equal(small[r0 + 1][c0 + 1], 0, "finder ring missing")
  assert.equal(small[r0 + 3][c0 + 3], 1, "finder core missing")
}

// Past capacity it must say so rather than emit a truncated code.
assert.equal(qrMatrix("q".repeat(400)), null, "over-capacity must return null")

/* ---------- the drawn hand ---------- */

// Every handwritten label is set from a drawn alphabet, so it renders the
// same on the headless box that captures the cover as on a designer's Mac.
// A font stack for it would fall back to a serif there and nobody would know.
assert.match(src, /const SCRIPT: Record<string, Pen> = \{/, "the marker hand must be drawn, not a font")
assert.doesNotMatch(src, /cursive|Comic Sans|Bradley Hand|Segoe (Print|Script)|Marker Felt|@font-face/, "no script font stack")
for (const word of ["my portfolio", "abilities", "soft skills", "software", "skills", "teamwork"]) {
  assert.match(src, new RegExp('hand\\("' + word + '"'), `"${word}" must be set in the drawn hand`)
}

/* ---------- install safety ---------- */

const cssStart = src.indexOf("const CSS = `") + 13
const css = src.slice(cssStart, src.indexOf("\n`\n", cssStart))
assert.ok(css.length > 300, "could not extract the style block")
assert.doesNotMatch(css, /@import/, "no @import in the inline style block")
assert.doesNotMatch(css, /[`]|\$\{/, "no backticks or template holes inside the CSS")
assert.equal((css.match(/font-family/g) ?? []).length, 1, "one printed face; everything else is drawn")
// The board ships default URLs, but they are QR *payloads* and link *targets*:
// encoded locally or followed on click, never requested. What the capture
// sandbox blocks is an external origin in a loading position.
assert.doesNotMatch(css, /url\(/, "no url() in the style block")
assert.doesNotMatch(src, /(image|use|script|link)\s+[^>]*href=["']https?:/, "no element may load from an external origin")
assert.doesNotMatch(src, /@import|<link\b|fetch\(|new Image\(|\bsrc=["']https?:/, "nothing may load at runtime")
for (const m of src.matchAll(/["'](https?:\/\/[^"']+)["']/g)) {
  const line = src.slice(src.lastIndexOf("\n", m.index) + 1, src.indexOf("\n", m.index))
  assert.match(
    line,
    /(portfolioUrl|codeUrl) =|\bhref: "https?:/,
    `an external URL appears somewhere other than a QR payload or a link target: ${line.trim()}`,
  )
}

for (const line of css.split("\n")) {
  const m = line.match(/^\s*([^@{}/*][^{]*)\{/)
  if (!m) continue
  for (const sel of m[1].split(",")) {
    const s = sel.trim()
    if (!s) continue
    assert.ok(s.startsWith(".frb"), `selector escapes the component root: ${s}`)
  }
}

assert.match(src, /height = "100svh"/, "height must default to a definite length")
assert.doesNotMatch(src, /h-full/, "no h-full on the component root")
const rootRule = css.match(/\.frb-root\{([^}]*)\}/)
assert.ok(rootRule, "missing the .frb-root rule")
assert.doesNotMatch(rootRule[1], /height/, "the root must not set its own height")

assert.match(src, /React\.useId\(\)/, "ids must be namespaced per instance")
assert.equal(src.match(/url\(#(?!")/g), null, "every url(#...) must be built by u(), not hard-coded")

// Encoding on every render would re-run Reed-Solomon and the mask search for
// eight candidate matrices, on every paint.
assert.match(src, /React\.useMemo\(\(\) => qrMatrix\(portfolioUrl\)/, "the portfolio matrix must be memoised")
assert.match(src, /React\.useMemo\(\(\) => qrMatrix\(codeUrl\)/, "the code matrix must be memoised")

/* ---------- the red marker ---------- */

// The rings draw themselves on hover and focus — never at rest — and the
// drawing is a dash offset over a normalised path, so it needs no JS and no
// measuring. Reduced motion keeps the ring and drops the drawing.
assert.doesNotMatch(src, /ring\?: boolean|row\.ring/, "no ring is drawn at rest")
assert.match(src, /className="frb-ring"[^>]*pathLength=\{1\}/, "rings must be normalised with pathLength=1")
// The gap is longer than the path: with `1 1` the dash boundary lands exactly on
// the path's end and its round cap shows as a red dot on every hidden ring.
assert.match(css, /\.frb-ring,\.frb-arrow\{stroke-dasharray:1 2;stroke-dashoffset:1;transition:stroke-dashoffset/, "the ring is hidden by dash offset and revealed by transition")
assert.match(css, /\.frb-hit:hover \.frb-ring/, "hover must reveal the ring")
assert.match(css, /\.frb-hit:focus-visible \.frb-ring/, "keyboard focus must reveal the ring too")
assert.match(css, /@media \(prefers-reduced-motion:reduce\)\{\n\.frb-ring,\.frb-arrow,\.frb-lift\{transition:none\}/, "motion must be gated by prefers-reduced-motion")
assert.doesNotMatch(css, /animation/, "nothing loops; the only motion is the hover reveal")

// The grain is a full-board rect painted last. Painted means hit-testable, so
// without this it sits on top of every row and link and nothing ever hovers.
const firstHit = src.indexOf('className="frb-hit"')
const overlays = [...src.matchAll(/<rect width=\{W\} height=\{H\}[^>]*>/g)].filter((m) => m.index > firstHit)
assert.ok(overlays.length > 0, "expected a full-board overlay after the hover targets")
for (const m of overlays) {
  assert.match(m[0], /pointerEvents="none"/, `a full-board overlay above the hover targets must not take the pointer: ${m[0]}`)
}

console.log("ok - flatlay-resume-board")
