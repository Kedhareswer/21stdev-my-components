// Install-safety, timing and streaming checks for components/slide-in-assistant-panel.
// Run: node tests/slide-in-assistant-panel.test.mjs
//
// The streaming, reply matching and the scripted loop live in the `model` region, which is lifted
// out and run here as shipped. Everything else is asserted from the source text.
import assert from "node:assert/strict"
import { checkComponent, liftRegion } from "./_component-safety.mjs"

const slug = "slide-in-assistant-panel"
const VARS = ["--sap-ink", "--sap-bgc", "--sap-muted", "--sap-line", "--sap-text", "--sap-body", "--sap-sub", "--sap-faint", "--sap-soft", "--sap-press", "--sap-pill", "--sap-shine", "--sap-pad", "--sap-w"]
const { src, demo, css } = checkComponent(slug, { prefix: "sap-", imports: ["react"], vars: VARS, minRules: 60 })

assert.match(demo, /from "@\/components\/ui\/slide-in-assistant-panel"/, "demo imports the installed path")
assert.match(demo, /<SlideInAssistantPanel autoPlay \/>/, "demo runs the scripted loop")

// Tokens: every colour is derived from the host's semantic tokens, with fallbacks for a bare host.
for (const t of ["--color-foreground,#161616", "--color-background,#fff", "--color-muted-foreground,#8d8d86", "--color-border,#ececea"])
  assert.ok(css.includes("var(" + t + ")"), "token with fallback: " + t)
assert.doesNotMatch(css, /#fff[^)]|#ffffff|#000[^)]/, "no hard-coded white or black surfaces (dark mode follows the tokens)")

// Motion, as measured on the reference.
assert.match(css, /\.sap-slot\{[^}]*transition:width \.52s cubic-bezier\(\.3,\.7,\.2,1\)/, "slot width .52s on the measured curve")
assert.match(css, /\.sap-panel\{[^}]*transform:translateX\(24px\);opacity:0;transition:transform \.52s cubic-bezier\(\.3,\.7,\.2,1\),opacity \.3s ease/, "panel slides 24px and fades .3s")
assert.match(css, /\.sap-open \.sap-slot\{width:calc\(var\(--sap-w\) \+ 8px\)\}/, "open slot = panel + 8px gap")
assert.match(css, /\.sap-open \.sap-panel\{transform:translateX\(0\);opacity:1\}/, "open state restates the transform instead of none")
assert.match(css, /@keyframes sap-up\{from\{opacity:0;transform:translateY\(10px\)\}\}/, "user turn rises 10px")
assert.match(css, /\.sap-u\{[^}]*animation:sap-up \.45s/, "attachments rise .45s")
assert.match(css, /\.sap-bub\{[^}]*animation:sap-up \.45s/, "bubble rises .45s")
assert.match(css, /\.sap-acts\{[^}]*animation:sap-fade \.35s both/, "action row fades in after the stream")
assert.match(css, /\.sap-menu\{[^}]*transform:translateY\(6px\)[^}]*transition:opacity \.18s,transform \.18s,visibility \.18s/, "menus lift 6px in .18s")
assert.match(css, /\.sap-doc p\{[^}]*transition:background-color 1\.2s/, "inserted paragraph highlight fades over 1.2s")
assert.match(css, /\.sap-shim\{[^}]*animation:sap-sh 1\.4s linear infinite/, "thinking shimmer")

// Narrow hosts: the panel covers the note and rises instead of sliding.
assert.match(css, /@container \(max-width:700px\)\{\.sap-row\{--sap-pad:10px\}/, "narrow padding")
assert.match(css, /\.sap-row \.sap-panel\{width:100%;transform:translateY\(30px\)\}/, "narrow panel rises 30px")
assert.match(css, /\.sap-root\{[^}]*container-type:inline-size/, "root is the size container")

// Reduced motion: no slide, no shimmer, no caret, no rise; answers land whole.
assert.match(css, /prefers-reduced-motion:reduce\)\{\.sap-slot,\.sap-row \.sap-slot,\.sap-panel,\.sap-row \.sap-panel,\.sap-menu/, "reduced motion drops the slide")
assert.match(css, /\.sap-shim,\.sap-caret,\.sap-u,\.sap-bub,\.sap-acts/, "reduced motion drops the loops and rises")
assert.match(src, /if \(reduced\.current\) \{\n\s*patch\(id, \{ phase: "done", n: total \}\)/, "reduced motion shows the whole answer at once")
assert.match(src, /if \(reduced\.current\) at\(AUTO\.type, \(\) => setText\(q\)\)/, "reduced motion skips the scripted typing")

// Behaviour and accessibility.
assert.match(src, /s\.inert = !open/, "closed panel is inert")
assert.match(src, /aria-expanded=\{open\}/, "toggle reports its state")
assert.match(src, /aria-live="polite"/, "answer state is announced")
assert.match(src, /role="menuitemradio"/, "model choice is a radio menu")
assert.match(src, /\(e\.ctrlKey \|\| e\.metaKey\) && !e\.altKey && \(e\.key === "j" \|\| e\.key === "J"\)/, "Ctrl/Cmd J toggles")
assert.match(src, /e\.key === "Enter" && !e\.shiftKey && !e\.nativeEvent\.isComposing/, "Enter sends, Shift+Enter breaks a line, IME safe")
assert.match(src, /onPointerDownCapture=\{stopAuto\}/, "touching the component hands it over from the script")
assert.match(src, /window\.clearInterval\(run\.current\.iv\)/, "stream interval is cleared")
assert.match(src, /mq\.removeEventListener\("change", on\)/, "media listener cleaned up")
assert.match(css, /\.sap-ta\{[^}]*field-sizing:content/, "composer grows with its text without layout reads")
assert.match(css, /\.sap-root :where\(button\)\{font:inherit/, "button reset stays below component specificity")

// The model, run as shipped.
const m = await liftRegion(src, "model")
assert.deepEqual(m.AUTO, { open: 0.86, type: 1.96, send: 3.3, close: 9.21, loop: 11.06 }, "scripted loop matches the reference")
assert.equal(m.T.slide, 0.52)
assert.equal(m.T.typeChar, 0.038)
assert.equal(m.T.word, 0.03)
assert.ok(m.AUTO.type > m.AUTO.open + m.T.slide, "typing starts after the panel lands")
const prompt = "Sum this up for the team"
assert.ok(m.AUTO.type + prompt.length * m.T.typeChar < m.AUTO.send, "typing finishes before the send")
assert.ok(m.AUTO.close < m.AUTO.loop - m.T.slide, "the panel is shut before the loop resets the chat")

const blocks = [["p", "A solid week. Three things:"], ["h", "1. Onboarding"], ["p", "The checklist is live."]]
assert.equal(m.totalWords(blocks), 11)
assert.deepEqual(m.reveal(blocks, 0), [])
assert.deepEqual(m.reveal(blocks, 3), [["p", "A solid week."]])
assert.deepEqual(m.reveal(blocks, 6), [["p", "A solid week. Three things:"], ["h", "1."]])
assert.deepEqual(m.reveal(blocks, 99), blocks, "fully streamed = the reply")
const end = m.AUTO.send + m.T.thinkFast + 60 * m.T.word
assert.ok(end < m.AUTO.close - 2, "a 60-word answer is finished well before the scripted close (" + end.toFixed(2) + ")")

const R = [
  { prompt: "Make it shorter", keys: ["short"], reasoning: "", blocks },
  { prompt: "What's still open?", keys: ["open", "left"], reasoning: "", blocks },
]
const F = { prompt: "", reasoning: "", blocks }
assert.equal(m.pickReply("make it SHORTER ", R, F), R[0], "exact prompt, any case")
assert.equal(m.pickReply("anything left to do?", R, F), R[1], "keyword match")
assert.equal(m.pickReply("tell me a joke", R, F), F, "fallback")
assert.equal(m.thoughtFor("fast"), 2)
assert.equal(m.thoughtFor("thorough"), 5)
assert.equal(m.insertText({ blocks: [["p", "Intro:"], ["h", "1. A"], ["p", "One."], ["p", "Two."]] }), "One. Two.", "insert drops the intro and headings")
assert.equal(m.insertText({ insert: "Given.", blocks }), "Given.")

// No identifiers from the original work.
assert.doesNotMatch(src + demo, /cue|weekly review/i, "no reference names or copy")

console.log("slide-in-assistant-panel: ok")
