// Install-safety and brain check for components/clock-mascot-chat.
// Run: node tests/clock-mascot-chat.test.mjs
//
// Two halves. The install surface — a style block that escapes the root, a
// height that collapses on an installed page, SVG ids two instances would
// fight over, listeners left behind. And the brain: the offline replies are
// pure functions in a `// #region brain` block, lifted out and run for real.
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

const src = readFileSync(
  new URL("../components/clock-mascot-chat/clock-mascot-chat.tsx", import.meta.url),
  "utf8",
).replace(/\r\n/g, "\n")

const css = src.slice(src.indexOf("const CSS = `") + 13, src.lastIndexOf("\n`\n"))
assert.ok(css.length > 1000, "could not extract the style block")

/* ---------- install safety ---------- */

assert.doesNotMatch(css, /@import/, "no @import in the inline style block")
assert.doesNotMatch(css, /[`]|\$\{/, "no backticks or template holes inside the CSS")
assert.doesNotMatch(src, /https?:\/\//, "no external origins — the capture sandbox blocks them")
for (const bad of [/<img/, /@font-face/, /\.png/, /\.jpe?g/, /\.webp/, /\.mp3/]) {
  assert.doesNotMatch(src, bad, `the character is drawn, no asset may travel with it (${bad})`)
}
assert.doesNotMatch(src, /^import (?!\* as React from "react")/m, "React is the only import")

for (const line of css.split("\n")) {
  const m = line.match(/^\s*([^@{}/*][^{]*)\{/)
  if (!m || /^\s*(from|to|\d+%)/.test(m[1])) continue
  for (const sel of m[1].split(",")) {
    const s = sel.trim()
    if (!s || /^(from|to|\d+%)/.test(s)) continue
    assert.ok(s.startsWith(".rcc"), `selector escapes the component root: ${s}`)
  }
}

assert.match(src, /height = "100svh"/, "height must default to a definite length")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full on the component root")
const rootRule = css.match(/\.rcc-root\{([^}]*)\}/)
assert.ok(rootRule, "missing the .rcc-root rule")
assert.doesNotMatch(rootRule[1], /(^|;)\s*height/, "the root must take its height from the prop")
assert.match(rootRule[1], /container:rcc \/ size/, "the root is the size container the layout queries")
assert.match(css, /\.rcc-svg\{[^}]*max-width:none/, "guard Preflight on the stage SVG")

assert.match(src, /React\.useId\(\)/, "ids must be namespaced per instance")
assert.equal(src.match(/url\(#(?!")/g), null, "every url(#...) must be built by u(), not hard-coded")
assert.doesNotMatch(src, /\bid="/, "no literal SVG ids")

assert.match(css, /prefers-reduced-motion: reduce/, "reduced motion must switch the CSS motion off")
assert.match(src, /matchMedia\("\(prefers-reduced-motion: reduce\)"\)/, "and the JS loop must honour it too")

for (const ev of ["pointermove", "pointerdown", "blur"]) {
  assert.match(src, new RegExp('removeEventListener\\("' + ev + '"'), `${ev} listener must be removed`)
}
assert.match(src, /cancelAnimationFrame\(raf\)/, "the frame loop must be cancelled on unmount")
assert.match(src, /clearInterval\(iv\)/, "the clock interval must be cleared on unmount")
assert.match(src, /speechSynthesis\?\.cancel\(\)/, "speech must stop on unmount")
assert.match(src, /role="log"|role="status"/, "replies must reach screen readers")

const ts = readFileSync(new URL("../tsconfig.json", import.meta.url), "utf8")
assert.match(ts, /"@\/components\/ui\/clock-mascot-chat"/, "tsconfig paths needs the alias line")

/* ---------- the brain, run for real ---------- */

const start = src.indexOf("// #region brain")
const end = src.indexOf("// #endregion")
assert.ok(start > -1 && end > start, "brain region markers missing")
const js = src
  .slice(start, end)
  .replace(/:\s*(string|number|boolean|Ctx|Vars|Lines|Dict|Date)(\[\])?(?=\s*[,)={;])/g, "")
const B = await import("data:text/javascript," + encodeURIComponent(js))

const ctx = (over = {}) => ({
  user: "",
  pet: "sugar",
  name: "Tilly Tock",
  org: "Bureau of Timekeeping",
  motto: "Right on time. Every time.",
  now: new Date(2026, 8, 26, 15, 7),
  seed: 0,
  last: "",
  lines: {},
  ...over,
})

// Maths: precedence, brackets, powers, words, and never eval.
assert.equal(B.solveMath("what's 12 x 7?"), 84)
assert.equal(B.solveMath("2 + 3 * 4"), 14)
assert.equal(B.solveMath("(2 + 3) * 4"), 20)
assert.equal(B.solveMath("-2^2"), -4)
assert.equal(B.solveMath("2^3^2"), 512, "power is right-associative")
assert.equal(B.solveMath("10 divided by 4"), 2.5)
assert.equal(B.solveMath("calculate 7 minus 10"), -3)
assert.equal(B.solveMath("1,000 + 1"), 1001)
assert.equal(B.solveMath("5 / 0"), Infinity)
assert.equal(B.solveMath("hello there"), null)
assert.equal(B.solveMath("42"), null, "a bare number is not a sum")
assert.equal(B.solveMath("2 + "), null)
assert.equal(B.solveMath("(2 + 3"), null)
assert.equal(B.solveMath("alert(1) + 1"), null, "letters never reach the parser")
assert.equal(B.fmtNum(0.1 + 0.2), "0.3")

// Timers: units, words, caps, and no timer without asking for one.
assert.equal(B.parseTimer("set a timer for 5 minutes"), 300)
assert.equal(B.parseTimer("timer for 90 seconds"), 90)
assert.equal(B.parseTimer("remind me in an hour"), 3600)
assert.equal(B.parseTimer("timer for 10 hours"), 7200, "capped at two hours")
assert.equal(B.parseTimer("I waited 5 minutes"), 0, "no keyword, no timer")
assert.equal(B.fmtDuration(300), "5 minutes")
assert.equal(B.fmtDuration(61), "1 minute 1 second")
assert.equal(B.fmtDuration(5400), "1 hour 30 minutes")

// Names: explicit phrasing, or a capitalised "I'm Ada" — never "I'm tired".
assert.equal(B.extractName("my name is ada"), "Ada")
assert.equal(B.extractName("hey, call me Kedhar"), "Kedhar")
assert.equal(B.extractName("I'm Ada"), "Ada")
assert.equal(B.extractName("i'm tired"), "")

// Intents land where they should.
const cases = {
  "hello!": "greet",
  "who are you?": "identity",
  "what time is it": "time",
  "what's the date today?": "date",
  "tell me a joke": "joke",
  "you're so cute": "compliment",
  "you're useless": "insult",
  "are you evil?": "evil",
  "i'm so behind on my deadline": "late",
  "thanks!": "thanks",
  "bye": "bye",
  "what's the weather like": "weather",
  "how are you": "howareyou",
  "what's my name?": "askName",
  "why is the sky blue?": "question",
  "I like turtles": "statement",
  "timer for 1 minute": "timerSet",
  "what's 3 + 4": "math",
}
for (const [msg, want] of Object.entries(cases)) assert.equal(B.classify(msg), want, `"${msg}"`)

// Replies: filled in, in character, with the right face and side effects.
const time = B.reply("what time is it?", ctx())
assert.match(time.text, /3:07 PM/)
assert.equal(time.mood, "explain")
assert.doesNotMatch(time.text, /\{\w+\}/, "no unfilled placeholders")

const named = B.reply("my name is Ada", ctx())
assert.equal(named.user, "Ada")
assert.match(named.text, /Ada/)
assert.match(B.reply("what's my name", ctx({ user: "Ada" })).text, /Ada/)
assert.equal(B.reply("what's my name", ctx()).intent, "askNameUnknown")

const t = B.reply("set a timer for 2 minutes", ctx())
assert.equal(t.timer, 120)
assert.match(t.text, /2 minutes/)

// Context: "yes" after the deadline tip starts a 25-minute focus timer.
assert.equal(B.reply("i have a deadline", ctx()).intent, "late")
const yes = B.reply("yes please!", ctx({ last: "late" }))
assert.equal(yes.timer, 1500)
assert.equal(yes.intent, "timerSet")
assert.equal(B.reply("yes", ctx()).timer, 0, "a bare yes starts nothing")

assert.equal(B.reply("what is 8 / 0", ctx()).intent, "divzero")
assert.match(B.reply("what's 6 * 7", ctx()).text, /42/)

const rude = B.reply("you are stupid", ctx())
assert.equal(rude.mood, "stern")
const shout = B.reply("WHAT TIME IS IT", ctx())
assert.equal(shout.mood, "surprised", "shouting startles her")
assert.equal(B.reply("I HATE YOU", ctx()).mood, "stern", "but rudeness wins over volume")

const late = B.reply("hi", ctx({ now: new Date(2026, 8, 26, 1, 30) }))
assert.ok(B.LINES.lateNight.some((l) => late.text.endsWith(l)), "late-night greetings notice the hour")

// Custom lines replace the defaults, and every line fills cleanly.
assert.equal(B.reply("tell me a joke", ctx({ lines: { joke: ["Only {name}."] } })).text, "Only Tilly Tock.")
for (const [key, list] of Object.entries(B.LINES)) {
  assert.ok(list.length > 0, `${key} has lines`)
  for (const l of list) {
    const filled = B.fill(l, { name: "N", org: "O", motto: "M", user: "U", User: "U", time: "T", date: "D", answer: "A", n: "X" })
    assert.doesNotMatch(filled, /\{\w+\}/, `unknown placeholder in ${key}: ${l}`)
  }
}
for (const intent of Object.keys(B.MOOD_OF)) assert.ok(B.LINES[intent], `${intent} has a mood but no lines`)

// Seeds pick deterministically and rotate.
const jokes = new Set([0, 1, 2, 3].map((s) => B.reply("joke", ctx({ seed: s })).text))
assert.equal(jokes.size, B.LINES.joke.length, "different seeds, different jokes")
assert.equal(B.pick(["a", "b"], -1), "b", "negative seeds wrap")

// Faces for words from an outside model.
assert.equal(B.moodOf("Sorry, I can't do that."), "sad")
assert.equal(B.moodOf("That's great!"), "happy")
assert.equal(B.moodOf("I don't know"), "shrug")

// Lip-sync: vowels open, lip consonants close, spaces rest; punctuation breathes.
assert.equal(B.cadence("a"), 1)
assert.ok(B.cadence("b") < 0.1 && B.cadence(" ") === 0)
assert.ok(B.typeDelay(".") > B.typeDelay(",") && B.typeDelay(",") > B.typeDelay("a"))

// The pet name is a prop: no line may hard-code one.
for (const list of Object.values(B.LINES)) for (const l of list) assert.doesNotMatch(l, /\bsugar\b/i, l)
assert.match(B.reply("what's the weather", ctx({ pet: "darlin'" })).text, /Darlin'|darlin'/)

console.log("ok - clock-mascot-chat")
