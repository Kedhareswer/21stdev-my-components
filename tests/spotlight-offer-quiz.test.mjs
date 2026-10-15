// Checks for components/spotlight-offer-quiz.
// Run: node tests/spotlight-offer-quiz.test.mjs
//
// The quiz state machine, email check, offer fitting and dismissal memory live
// in the .tsx so the published component stays one file; the marked region is
// lifted out and run. The rest are the install-safety rules: no inherited
// height, CSS that cannot leak into the host page, a real accessible dialog
// and form, reduced motion, and no generics where the 21st CLI chokes.
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const src = readFileSync(new URL("../components/spotlight-offer-quiz/spotlight-offer-quiz.tsx", import.meta.url), "utf8")

const start = src.indexOf("// #region logic")
const end = src.indexOf("// #endregion")
assert.ok(start > -1 && end > start, "logic region markers missing")
const m = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(src.slice(start, end))))

// ---- the quiz: ask -> claim -> done, with a way back
let s = m.initialQuiz()
assert.equal(s.step, "ask")
assert.equal(m.litSlot(s), -1, "nothing picked: the stage's own product is lit")
s = m.quizReducer(s, { type: "preview", index: 2 })
assert.equal(m.litSlot(s), 2, "pointing at an answer lights its product")
s = m.quizReducer(s, { type: "pick", index: 1 })
assert.equal(s.step, "claim")
assert.equal(s.picked, 1)
assert.equal(s.preview, -1, "a pick clears the preview")
assert.equal(m.litSlot(s), 1, "the pick stays lit")
assert.equal(m.quizReducer(s, { type: "preview", index: 3 }), s, "no previews once an answer is picked")
assert.equal(m.quizReducer(s, { type: "pick", index: -1 }), s, "an out-of-range pick is ignored")

let back = m.quizReducer(s, { type: "change" })
assert.equal(back.step, "ask")
assert.equal(back.picked, 1, "changing keeps the old answer marked")
assert.equal(m.litSlot(back), 1, "and keeps it lit until another is pointed at")
back = m.quizReducer(back, { type: "preview", index: 4 })
assert.equal(m.litSlot(back), 4)

s = m.quizReducer(s, { type: "invalid", error: "Add your email" })
assert.equal(s.status, "error")
assert.equal(s.step, "claim", "a bad email keeps the visitor on the claim step")
s = m.quizReducer(s, { type: "submit" })
assert.equal(s.status, "pending")
assert.equal(s.error, "", "submitting clears the old error")
assert.equal(m.quizReducer(s, { type: "submit" }), s, "a double submit is ignored while pending")
const failed = m.quizReducer(s, { type: "fail", error: "Server said no" })
assert.equal(failed.step, "claim")
assert.equal(failed.error, "Server said no")
s = m.quizReducer(s, { type: "success", code: "FIRSTCUP30", email: "a@b.co" })
assert.equal(s.step, "done")
assert.equal(s.code, "FIRSTCUP30")
assert.equal(m.quizReducer(s, { type: "change" }), s, "the done step cannot be changed back")
assert.equal(m.quizReducer(s, { type: "reset" }).step, "ask")
assert.equal(m.quizReducer(m.initialQuiz(), { type: "submit" }).status, "idle", "nothing to submit before a pick")

// ---- which code is shown
assert.equal(m.resolveCode(" FROMSERVER ", { code: "OPT" }, "DEF"), "FROMSERVER")
assert.equal(m.resolveCode(undefined, { code: "OPT" }, "DEF"), "OPT")
assert.equal(m.resolveCode("", {}, "DEF"), "DEF")
assert.equal(m.resolveCode(42, undefined, "DEF"), "DEF")

// ---- email: what people actually type, and what they get wrong
for (const ok of ["maria.okafor@fastmail.com", "a+offers@sub.domain.co.uk", "  you@kettle.coffee "]) assert.equal(m.isEmail(ok), true, ok)
for (const bad of ["", "maria@", "maria@fastmail", "@fastmail.com", "maria fastmail.com", "maria@fast mail.com", "a@b.c", "a@@b.com", "a@b..com", "a@.b.com"])
  assert.equal(m.isEmail(bad), false, bad)

// ---- the offer fills its column, within limits
assert.equal(m.fitSize(400, 440, 36, 148), 110)
assert.equal(m.fitSize(100, 440, 36, 148), 148, "a short offer stops at the max")
assert.equal(m.fitSize(2000, 343, 36, 112), 36, "a long offer stops at the min instead of vanishing")
assert.equal(m.fitSize(0, 343, 36, 112), 36, "no measurement yet falls back to the min")

// ---- the empty stage's lettering
assert.deepEqual(m.stillWords("Kiboko  Highlands"), { lines: ["KIBOKO", "HIGHLANDS"], longest: 9 })
assert.deepEqual(m.stillWords("Halden & Co.").lines, ["HALDEN", "& CO."], "an ampersand never stands alone")
assert.deepEqual(m.stillWords("Gift card").lines, ["GIFT", "CARD"])
assert.deepEqual(m.stillWords("Tea &").lines, ["TEA &"], "a trailing short word joins the last line")
// lettering fits the stage box: width share and height both respected
const box = { w: 800, h: 900 }
const sz = m.stillSize(600, 2, box, 0.7)
assert.ok(sz * 6 <= 800 * 0.7 + 0.5, "the widest line stays inside its share of the stage")
assert.ok(sz * 2 * 0.86 <= 900 * 0.8 + 0.5, "all lines fit the stage height")
assert.ok(m.stillSize(100, 1, { w: 800, h: 300 }, 0.7) <= 300 * 0.8 / 0.86 + 0.5, "a short word is held by the height")
assert.equal(m.stillSize(600, 2, { w: 0, h: 0 }, 0.7), 0, "no box yet, no size")
assert.deepEqual(m.stillWords(""), { lines: [], longest: 0 })

// ---- dismissal memory
const day = 864e5
assert.equal(m.dismissedRecently(null, 10 * day, 7), false)
assert.equal(m.dismissedRecently(5 * day, 10 * day, 7), true)
assert.equal(m.dismissedRecently(2 * day, 10 * day, 7), false)
assert.equal(m.dismissedRecently(5 * day, 10 * day, 0), false, "0 days means always show")

// ---- install safety
const css = src.slice(src.indexOf("const CSS = `") + 13, src.indexOf("`", src.indexOf("const CSS = `") + 13))
assert.ok(!css.includes("@import"), "no @import")
assert.ok(!css.includes("${"), "no template expressions inside the CSS")
for (const sel of css.match(/^[^@{}\n][^{}]*\{/gm)) {
  for (const part of sel.replace("{", "").split(",")) {
    const p = part.trim()
    if (!p || /^(from|to|\d+%)$/.test(p)) continue
    assert.ok(/^(\.dark |:where\(\.soq\) )?\.soq|^:where\(\.soq\)/.test(p), "every rule is scoped to the component (no bare *, body or :root): " + p)
  }
}
assert.ok(!/\bh-full\b/.test(src), "no h-full anywhere")
assert.ok(/height = "100svh"/.test(src), "the section height defaults to a definite length")
assert.ok(/min-height: var\(--soq-h\)/.test(css), "the section takes its height from the prop")
assert.ok(/\.soq img \{ max-width: none/.test(css), "Preflight's img max-width is undone")
assert.ok(/prefers-reduced-motion: reduce/.test(css), "reduced motion is honoured")
assert.ok(/animation: none/.test(css.slice(css.indexOf("prefers-reduced-motion"))), "the idle beam sway stops under reduced motion")

// a real dialog and a real form
assert.ok(/role="dialog"/.test(src) && /aria-modal="true"/.test(src) && /aria-labelledby=\{titleId\}/.test(src), "dialog semantics")
assert.ok(/e\.key === "Escape"/.test(src), "Escape closes")
assert.ok(/html\.style\.overflow = "hidden"/.test(src), "the page behind is scroll-locked")
assert.ok(/before\?\.focus/.test(src), "focus returns to where it was")
assert.ok(/aria-pressed=\{state\.picked === i\}/.test(src), "answers say which one is chosen")
assert.ok(/<legend className="soq-sr">/.test(src), "the answers group is named")
assert.ok(/htmlFor=\{uid \+ "-e"\}/.test(src), "the email field has a real label")
assert.ok(/role="alert"/.test(src), "errors are announced")
assert.ok(/onError=\{/.test(src), "a failed photo falls back instead of showing a broken image")
assert.ok(/el\.inert = /.test(src), "hidden steps are inert, set as a property so React 18 and 19 agree")
assert.ok(!/inert: ""/.test(src), "no inert attribute string (React 19 reads it as false)")
assert.ok(/closest\("\[inert\], \[data-hidden\]"\)/.test(src), "the focus trap skips hidden steps")
assert.ok(/\.soq-modal:focus \{ outline: none; \}/.test(css), "the programmatically focused dialog draws no frame")
assert.ok(/defaultOpen = false/.test(src), "a bare popup does not take over the page")
assert.ok(/try \{\s*window\.localStorage/.test(src), "storage access is guarded")

// the 21st CLI hangs on generics before the first JSX close tag
const head = src.slice(0, src.indexOf("</"))
assert.equal(head.match(/use(State|Ref|Memo|Callback)<|Partial<|Record<|Array<|Map<|Set<|React\.[A-Za-z]+<|\[[Kk] in /g), null, "no generics before the first JSX close")
assert.ok(!/new Set</.test(src), "no generic constructors anywhere")

// demos import what an installer gets
for (const d of ["demo.tsx", "demo-plants.tsx", "demo-midnight.tsx"]) {
  const demo = readFileSync(new URL("../components/spotlight-offer-quiz/" + d, import.meta.url), "utf8")
  assert.ok(demo.includes('from "@/components/ui/spotlight-offer-quiz"'), d + " imports the installed path")
  assert.ok(/export default function [A-Z]\w*Demo/.test(demo), d + " exports a named demo")
}
console.log("spotlight-offer-quiz: ok")
