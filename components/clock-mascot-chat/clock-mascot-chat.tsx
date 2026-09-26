"use client"

import * as React from "react"

/* ------------------------------------------------------------------ types */

export type Mood =
  | "idle"
  | "happy"
  | "wink"
  | "talk"
  | "explain"
  | "think"
  | "shrug"
  | "stern"
  | "surprised"
  | "sleepy"
  | "listen"
  | "wave"
  | "shy"
  | "sad"

/** What the built-in brain can recognise. Each one is a key in `lines`. */
export type Intent =
  | "greet"
  | "bye"
  | "thanks"
  | "identity"
  | "setName"
  | "askName"
  | "askNameUnknown"
  | "time"
  | "date"
  | "howareyou"
  | "joke"
  | "compliment"
  | "insult"
  | "evil"
  | "late"
  | "help"
  | "weather"
  | "love"
  | "age"
  | "philosophy"
  | "sing"
  | "bored"
  | "sleep"
  | "yes"
  | "no"
  | "math"
  | "divzero"
  | "timerSet"
  | "question"
  | "statement"

/** Lines that are not replies to a message. */
export type Cue =
  | "greeting"
  | "nudge"
  | "wake"
  | "poke"
  | "error"
  | "shout"
  | "lateNight"
  | "timerDone"

/** The shape an LLM wants: pass it straight into your chat API. */
export type ChatMessage = { role: "user" | "assistant"; content: string }

export type AskResult = string | { text: string; mood?: Mood }

export type ClockMascotChatProps = {
  /**
   * Height of the whole piece. Must be a definite length — the stage and the
   * chat are fitted to this box, so a percentage collapses to 0px unless every
   * ancestor up to `<html>` has a real height. Never pass `"100%"`.
   */
  height?: string
  /** Floor for the height, so the chat stays usable. */
  minHeight?: string
  /** `midnight` (orange on black), `peach` (orange on blush), `noir` (black and white). */
  theme?: "midnight" | "peach" | "noir"

  /* ---- persona ---- */
  /** The character's name. */
  name?: string
  /** The outfit she works for. Its initials become the emblem. */
  org?: string
  /** Set big over the stage when there is room. Sentences break onto lines. */
  motto?: string
  /** What she calls you until you tell her your name. */
  petName?: string
  /** Replace any line she says. `{name}` `{org}` `{user}` `{time}` `{date}` `{motto}` are filled in. */
  lines?: Partial<Record<Intent | Cue, string[]>>
  /** The chips under the chat. */
  suggestions?: string[]
  placeholder?: string

  /**
   * Plug in a real model. Return a string, or `{ text, mood }` to pick her
   * expression yourself — otherwise one is read off the reply. While the
   * promise is pending she thinks: the dial ticks round. Leave it out and
   * the built-in, offline brain answers.
   */
  onAsk?: (message: string, history: ChatMessage[]) => AskResult | Promise<AskResult>

  /* ---- behaviour ---- */
  /** Start with her voice on (Web Speech synthesis). Always toggleable in the header. */
  voice?: boolean
  /** Seconds without activity before she checks in on you. Twice at most. */
  idleSeconds?: number
  /** Seconds without activity before she dozes off. Any movement wakes her. */
  sleepSeconds?: number
  /** The mirrored floor reflection under her. */
  reflection?: boolean
  /** Scanlines and a faint flicker — she is a projection, after all. */
  hologram?: boolean

  /* ---- colour overrides (the theme supplies the rest) ---- */
  face?: string
  ink?: string
  glove?: string
  shoe?: string
  glow?: string
  accent?: string
  background?: string
  className?: string
}

type Vars = Record<string, string>
type Lines = Record<string, string[]>
type Dict = Record<string, string>
type Ctx = {
  user: string
  pet: string
  name: string
  org: string
  motto: string
  now: Date
  seed: number
  last: string
  lines: Lines
}

/* ------------------------------------------------------------- the brain
   Offline, dependency-free and deterministic for a given seed: an ordered
   list of intent patterns, a tiny arithmetic parser (no eval), a timer
   parser and a few hundred words of personality. Swap it for a real model
   with `onAsk` — the character does not care where the words come from. */

// #region brain

export const LINES: Lines = {
  greeting: [
    "Well hi there! I'm {name}, your friendly face from the {org}. Ask me anything, {user}. I've got all the time in the world. Literally.",
  ],
  greet: [
    "Well hey there, {user}! I'm {name}. What can I do ya for?",
    "Howdy, {user}! Right on the dot. What's on your mind?",
    "Oh! A visitor! Hi, hi, hi, {user}. Take a number... just kiddin', you're my favorite one.",
  ],
  lateNight: [
    "Kinda late though, isn't it? Shouldn't you be in bed?",
    "It's awful late, hon. I'm keepin' an eye on the clock for ya.",
  ],
  bye: [
    "Bye now, {user}! Don't be late for anything, ya hear?",
    "See ya later, {user}. I'll be right here. Tickin'.",
    "Off you go! And remember: {motto}",
  ],
  thanks: [
    "Aw, shucks. Just doin' my job, {user}!",
    "Anytime, {user}. And I do mean any time. I'm a clock.",
    "You're welcome! That'll be zero minutes and zero seconds. On the house.",
  ],
  identity: [
    "I'm {name}! Official mascot, receptionist and sunshine department of the {org}. I keep every minute right where it belongs.",
    "Name's {name}, hon. Part clock, part cartoon, all business. Mostly.",
    "I'm {name}, the {org}'s very own ray of sunshine. Some folks say I'm just a clock with a face. I say I'm a face with a clock!",
  ],
  setName: [
    "Nice to meet ya, {user}! I'll file that under Favorite Visitors.",
    "{user}! What a lovely name. Stamped, filed and never forgotten.",
  ],
  askName: [
    "You're {user}! I never forget a face. I am one.",
    "Why, you're {user}, silly. It's right here in my files.",
  ],
  askNameUnknown: [
    "Hmm, you haven't told me yet, {user}. Go on, say 'my name is' and I'll write it down.",
  ],
  time: [
    "It's {time} on the dot, {user}. Well... the dot's on my nose, but you get it.",
    "Right now? {time}. And now it's a little later. Time's funny like that!",
    "{time}! I'd check my own face, but I'd have to cross my eyes.",
  ],
  date: [
    "Today's {date}. Mark it down, it'll never happen again!",
    "It's {date}, {user}. Another perfectly scheduled day.",
  ],
  howareyou: [
    "Oh, I'm just tickin' along! Wound up and ready to go. How 'bout you?",
    "Fit as a fiddle and right on time. Thanks for askin', {user}!",
    "Busy, busy, busy! Sixty seconds a minute, sixty minutes an hour. But I always make time for you.",
  ],
  joke: [
    "Why did the clock get sent to the principal's office? It tocked too much! Hee hee!",
    "What does a clock do when it's hungry? Goes back four seconds! ...Get it? Seconds? Oh, I kill me.",
    "Why'd the cuckoo clock see a therapist? Too many hang-ups on the hour.",
    "I tried to tell a joke about time travel, but you didn't like it. Yet.",
  ],
  compliment: [
    "Oh, stop it! You're gonna make my hands spin.",
    "Well, aren't you a peach! My cheeks are runnin' fast.",
    "Aw, {user}. Flattery gets you... at least five extra minutes.",
  ],
  insult: [
    "Now, that's not very nice. I'd hate to have to write you up for that.",
    "Careful, {user}. I know exactly how much time you've got left.",
    "Mm-hmm. I'll just pencil that into your permanent record.",
  ],
  evil: [
    "Evil? Little ol' me? I'm just a clock, {user}. A friendly, harmless, all-seeing clock.",
    "Who do I work for? Why, the {org}! And who the {org} works for is... above your pay grade.",
    "I don't have a dark side, hon. I've just got a night mode.",
  ],
  late: [
    "Deadlines, huh? Here's a Bureau tip: pick one tiny thing, give it 25 minutes, and let nothin' else in. Want me to start a timer?",
    "Runnin' behind happens to the best of us. Breathe, pick the one thing that matters most, and do that first. Want a 25-minute timer?",
  ],
  help: [
    "I can tell you the time and the date, set a timer (try 'timer for 2 minutes'), do quick math, tell jokes and chat about most anything. Or poke me. I dare ya.",
  ],
  weather: [
    "Weather? {User}, I live inside a screen. Every day's seventy-two and sunny in here.",
    "Can't see a window from my desk, hon. But I'd bring an umbrella. Just to be punctual about it.",
  ],
  love: [
    "Love? Oh my stars. I'm married to my work, hon. And my work is very punctual.",
    "Well, I never! ...Okay, maybe once. It was a grandfather clock. It didn't work out.",
  ],
  age: [
    "Old enough to know better, young enough to still tick. A lady clock never tells her age, only the time!",
  ],
  philosophy: [
    "What is time, really? Hmm... a very long line of right-nows. Deep, huh? I read it on a calendar.",
    "Now that's a question for the folks upstairs, {user}. I just keep the schedule.",
  ],
  sing: [
    "Tick-tock, round the clock, never gonna miss a beat! ...Thank you, thank you, I'm here all week. Every week. Forever.",
  ],
  bored: [
    "Bored? With me? Well, I never! Want a joke, or shall we time how long you can stay bored?",
  ],
  sleep: [
    "Bedtime already? It's {time}. Sweet dreams, {user}. I'll keep watch. I always keep watch.",
  ],
  yes: ["Wonderful! I do love a yes.", "Perfect! Anything else I can do ya for?"],
  no: ["No? Well, alrighty. Your call, {user}.", "Suit yourself! I'll be right here."],
  math: [
    "That's {answer}! Numbers are my second-favorite thing. Minutes are first.",
    "{answer}. I did it in my head. Well... I am a head.",
  ],
  divzero: ["Divide by zero?! {User}, that's how whole schedules break! Let's not."],
  timerSet: [
    "Timer set for {n}! I'll holler when it's up. No slackin'.",
    "You got it! {n}, startin' now. Tick-tock!",
  ],
  timerDone: ["Ding ding ding! Your {n} is up, {user}!"],
  question: [
    "Hmm, that's a good one. I'm just a humble clock, but I'd say trust your gut and check the schedule.",
    "Ooh, that's above my pay grade, {user}. Ask me about time, though, and I'm your gal.",
    "Let me check my files... nope, not in there. Want a joke instead?",
  ],
  statement: [
    "Mm-hmm! Go on, I'm listenin'.",
    "Well, I'll be. Tell me more, {user}!",
    "Noted! Filed, stamped and put right where it belongs.",
  ],
  shout: ["Whoa there, inside voice!", "Goodness, no need to holler!"],
  nudge: [
    "Tick-tock, {user}! Anything I can help with?",
    "Still there, {user}? I can tell you a joke. Or the time. I'm very good at the time.",
  ],
  wake: ["Oh! I wasn't sleepin'. I was restin' my hands.", "Huh? Who? Right! Wide awake. On the clock!"],
  poke: [
    "Hee hee! That tickles!",
    "Hey! Boop right on the nose.",
    "Okay, you've had your fun.",
    "Hands off the merchandise, hon.",
    "I said that's ENOUGH, {user}.",
  ],
  error: ["Well, shoot. My gears jammed. Try me again in a tick?"],
}

export const MOOD_OF: Dict = {
  greet: "wave",
  bye: "wave",
  thanks: "shy",
  identity: "explain",
  setName: "happy",
  askName: "wink",
  askNameUnknown: "think",
  time: "explain",
  date: "explain",
  howareyou: "happy",
  joke: "wink",
  compliment: "shy",
  insult: "stern",
  evil: "wink",
  late: "explain",
  help: "explain",
  weather: "shrug",
  love: "shy",
  age: "wink",
  philosophy: "think",
  sing: "happy",
  bored: "shrug",
  sleep: "sleepy",
  yes: "happy",
  no: "shrug",
  math: "explain",
  divzero: "surprised",
  timerSet: "explain",
  question: "think",
  statement: "talk",
}

const RULES = [
  { id: "askName", re: /what('?s| is) my name|do you (know|remember) (me|my name)|who am i\b/ },
  { id: "evil", re: /\b(evil|villain|sinister|dark side|creepy|scary|secrets?|who do you work for|your boss|in charge)\b/ },
  { id: "insult", re: /\b(stupid|dumb|idiot|hate you|ugly|shut up|annoying|useless|you suck|worst|trash)\b/ },
  { id: "love", re: /\b(i love you|crush on|date me|marry me|boyfriend|girlfriend|in love)\b/ },
  { id: "compliment", re: /\b(cute|adorable|pretty|beautiful|sweet|lovely|awesome|amazing|great job|the best|so smart|you rock)\b/ },
  { id: "thanks", re: /\b(thanks?|thank you|thx|ty|appreciate)\b/ },
  { id: "sleep", re: /\b(sleep|bed ?time|going to bed|good ?night|nap)\b/ },
  { id: "bye", re: /^(bye|goodbye|see ya|see you|later|cya|gotta go|farewell)\b|\b(bye|goodbye)\b/ },
  { id: "greet", re: /^(hi+|hey+|hello+|howdy|hiya|yo|sup|hola|greetings|good (morning|afternoon|evening|day))\b/ },
  { id: "howareyou", re: /how (are|r) (you|u)|how('?s| is) it going|how do you (feel|do)|what'?s up|how have you been/ },
  { id: "identity", re: /who (are|r) (you|u)|what (are|r) (you|u)\b|your name|introduce yourself|about yourself/ },
  { id: "date", re: /what('?s| is) (the |today'?s )?(date|day)|today'?s date|what day|which day/ },
  { id: "time", re: /what('?s| is) the time|what time|the time\b|current time|o'?clock|time is it/ },
  { id: "joke", re: /\b(joke|jokes|funny|make me laugh|pun)\b/ },
  { id: "help", re: /\b(help|what can you do|commands|how does this work|features)\b/ },
  { id: "weather", re: /\b(weather|raining|rain|sunny|temperature|forecast|snow)\b/ },
  { id: "age", re: /how old|your age|when were you (born|made)|birthday/ },
  { id: "sing", re: /\b(sing|song|dance|music)\b/ },
  { id: "late", re: /\b(late|deadline|deadlines|hurry|procrastinat\w*|stress\w*|busy|tired|overwhelm\w*|focus|productiv\w*)\b/ },
  { id: "bored", re: /\b(bored|boring)\b/ },
  { id: "philosophy", re: /meaning of life|what is time|free will|destiny|\bfate\b|purpose of/ },
  { id: "yes", re: /^(yes|yeah|yep|yup|sure|ok|okay|alright|cool|nice|great|please|do it)\b[\w\s,']{0,14}[.!]*$/ },
  { id: "no", re: /^(no|nope|nah|not really|no thanks)\b[.!]*$/ },
  { id: "question", re: /\?\s*$|^(what|why|how|who|when|where|can|could|would|should|is|are|do|does|will)\b/ },
]

export function pick(list: string[], seed: number) {
  if (!list || !list.length) return ""
  const n = list.length
  return list[((Math.floor(seed) % n) + n) % n]
}

export function fill(tpl: string, vars: Vars) {
  return tpl.replace(/\{(\w+)\}/g, (m, k) => (vars[k] !== undefined ? vars[k] : m))
}

export function formatTime(d: Date) {
  const h = d.getHours()
  const m = d.getMinutes()
  return (h % 12 || 12) + ":" + (m < 10 ? "0" : "") + m + " " + (h < 12 ? "AM" : "PM")
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

export function formatDate(d: Date) {
  return DAYS[d.getDay()] + ", " + MONTHS[d.getMonth()] + " " + d.getDate()
}

export function fmtDuration(sec: number) {
  const s = Math.max(0, Math.round(sec))
  const unit = (n: number, w: string) => n + " " + w + (n === 1 ? "" : "s")
  if (s < 60) return unit(s, "second")
  if (s < 3600) {
    const m = Math.floor(s / 60)
    const r = s % 60
    return r ? unit(m, "minute") + " " + unit(r, "second") : unit(m, "minute")
  }
  const h = Math.floor(s / 3600)
  const m = Math.round((s % 3600) / 60)
  return m ? unit(h, "hour") + " " + unit(m, "minute") : unit(h, "hour")
}

const WORD_NUM: Dict = { a: "1", an: "1", one: "1", two: "2", three: "3", four: "4", five: "5", ten: "10", fifteen: "15", twenty: "20", thirty: "30" }

/** Seconds asked for by "timer for 5 minutes", "remind me in an hour"… 0 if none. Capped at 2h. */
export function parseTimer(text: string) {
  const t = text.toLowerCase().replace(/\b(a|an|one|two|three|four|five|ten|fifteen|twenty|thirty)\b/g, (w) => WORD_NUM[w])
  if (!/\b(timer|remind|alarm|countdown)\b/.test(t)) return 0
  const m = t.match(/(\d+(?:\.\d+)?)\s*(seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h)\b/)
  if (!m) return 0
  const u = m[2][0]
  const sec = parseFloat(m[1]) * (u === "h" ? 3600 : u === "m" ? 60 : 1)
  return Math.max(0, Math.min(7200, Math.round(sec)))
}

/**
 * Arithmetic in a sentence — "what's 12 x 7?", "(3 + 4) ^ 2", "10 divided by 4".
 * A recursive-descent parser, never eval. null when it is not maths;
 * Infinity / NaN for a division by zero.
 */
export function solveMath(text: string) {
  const e = text
    .toLowerCase()
    .replace(/^(hey|hi|so|ok|okay)[,!\s]+/, "")
    .replace(/^(what('?s| is)|whats|calculate|compute|solve|how much is)\s*/, "")
    .replace(/(\d)\s*[x×]\s*(?=[\d(])/g, "$1*")
    .replace(/\b(times|multiplied by)\b/g, "*")
    .replace(/\bplus\b/g, "+")
    .replace(/\bminus\b/g, "-")
    .replace(/\b(divided by|over)\b|÷/g, "/")
    .replace(/\bto the power of\b|\*\*/g, "^")
    .replace(/,/g, "")
    .replace(/[?=!.\s]+$/, "")
    .trim()
  if (!/^[\d+\-*/().^%\s]+$/.test(e) || !/[\d)]\s*[-+*/^%]\s*[-+(\d.]/.test(e)) return null
  const s = e.replace(/\s+/g, "")
  let i = 0
  const expr = (): number => {
    let v = term()
    while (s[i] === "+" || s[i] === "-") {
      const op = s[i++]
      const r = term()
      v = op === "+" ? v + r : v - r
    }
    return v
  }
  const term = (): number => {
    let v = power()
    while (s[i] === "*" || s[i] === "/" || s[i] === "%") {
      const op = s[i++]
      const r = power()
      v = op === "*" ? v * r : op === "/" ? v / r : v % r
    }
    return v
  }
  const power = (): number => {
    if (s[i] === "-") {
      i++
      return -power()
    }
    if (s[i] === "+") {
      i++
      return power()
    }
    const b = atom()
    if (s[i] === "^") {
      i++
      return Math.pow(b, power())
    }
    return b
  }
  const atom = (): number => {
    if (s[i] === "(") {
      i++
      const v = expr()
      if (s[i] !== ")") throw new Error("paren")
      i++
      return v
    }
    const m = s.slice(i).match(/^\d*\.?\d+/)
    if (!m) throw new Error("number")
    i += m[0].length
    return parseFloat(m[0])
  }
  try {
    const v = expr()
    return i === s.length ? v : null
  } catch (err) {
    return null
  }
}

export function fmtNum(v: number) {
  return Number.isInteger(v) ? String(v) : String(parseFloat(v.toFixed(6)))
}

/** "my name is ada", "call me Ada", "I'm Ada" (capitalised, so "I'm tired" is not a name). */
export function extractName(raw: string) {
  const m =
    raw.match(/\b(?:my name is|my name's|name's|call me)\s+([a-z][a-z'-]{0,23})/i) ||
    raw.trim().match(/^(?:(?:[Hh]i|[Hh]ey|[Hh]ello)[,!\s]+)?(?:[Ii] am|[Ii]['’]?m)\s+([A-Z][a-zA-Z'-]{0,23})[.!]*$/)
  if (!m) return ""
  return m[1].charAt(0).toUpperCase() + m[1].slice(1)
}

export function classify(raw: string) {
  const t = raw.trim().toLowerCase()
  if (parseTimer(t) > 0) return "timerSet"
  if (solveMath(t) !== null) return "math"
  if (extractName(raw)) return "setName"
  for (const r of RULES) if (r.re.test(t)) return r.id
  return "statement"
}

/** The whole reply: text, the face to pull while saying it, and side effects. */
export function reply(input: string, ctx: Ctx) {
  const raw = input.trim()
  const letters = raw.replace(/[^a-z]/gi, "")
  const shout = letters.length >= 4 && raw === raw.toUpperCase()
  let intent = classify(raw)
  let user = ctx.user
  let timer = 0
  let answer = ""
  if (intent === "yes" && ctx.last === "late") {
    intent = "timerSet"
    timer = 1500
  } else if (intent === "timerSet") timer = parseTimer(raw)
  if (intent === "math") {
    const v = solveMath(raw)
    if (v === null || !isFinite(v)) intent = "divzero"
    else answer = fmtNum(v)
  }
  if (intent === "setName") user = extractName(raw)
  if (intent === "askName" && !user) intent = "askNameUnknown"
  const who = user || ctx.pet
  const vars = {
    name: ctx.name,
    org: ctx.org,
    motto: ctx.motto,
    user: who,
    User: who.charAt(0).toUpperCase() + who.slice(1),
    time: formatTime(ctx.now),
    date: formatDate(ctx.now),
    answer: answer,
    n: fmtDuration(timer),
  }
  const lines = (key: string) => (ctx.lines[key] && ctx.lines[key].length ? ctx.lines[key] : LINES[key])
  let text = fill(pick(lines(intent), ctx.seed), vars)
  const hour = ctx.now.getHours()
  if (intent === "greet" && (hour >= 23 || hour < 5)) text += " " + fill(pick(lines("lateNight"), ctx.seed), vars)
  let mood = MOOD_OF[intent] || "talk"
  if (shout && intent !== "insult") {
    text = pick(lines("shout"), ctx.seed) + " " + text
    mood = "surprised"
  }
  return { text: text, mood: mood, intent: intent, timer: timer, user: user }
}

/** A face for words that came from somewhere else (an LLM). */
export function moodOf(text: string) {
  const t = text.toLowerCase()
  if (/\b(sorry|unfortunately|sadly|apologi[sz]e)\b/.test(t)) return "sad"
  if (/\b(can'?t|cannot|not sure|no idea|don'?t know)\b/.test(t)) return "shrug"
  if (/!|\b(great|awesome|yay|wonderful|glad|congrat\w*|love)\b/.test(t)) return "happy"
  if (/\bhmm+\b|\bwell,/.test(t)) return "think"
  if (/\?\s*$/.test(t)) return "wink"
  return t.length > 140 ? "explain" : "talk"
}

/** How open the mouth is for the character being "said": 0 shut, 1 wide. */
export function cadence(ch: string) {
  if (/[aeiouy]/i.test(ch)) return /[ao]/i.test(ch) ? 1 : 0.75
  if (/[bmp]/i.test(ch)) return 0.05
  if (/[a-z0-9]/i.test(ch)) return 0.4
  return 0
}

/** Typewriter pacing, in ms: punctuation breathes. */
export function typeDelay(ch: string) {
  if (/[.!?]/.test(ch)) return 240
  if (/[,;:]/.test(ch)) return 130
  if (ch === " ") return 24
  return 22
}

// #endregion

/* ------------------------------------------------------------- the body
   Every coordinate lives in a 400 × 540 sheet (viewBox 0 40 400 540). The
   face is centred on (200, 190), r 108. Arms are rubber hoses: one quadratic
   curve from a shoulder hidden behind the face to the wrist, with the glove
   turned to follow the curve's end tangent. Legs are the same trick, from
   hips that bob with the body to feet that stay on the floor (unless she
   jumps). The floor is y 410, and the reflection is the figure mirrored
   about it, squashed. */

type Glove = "open" | "point" | "fist"
type ArmPose = "rest" | "cheer" | "hip" | "point" | "think" | "shrug" | "ear" | "wave" | "cover" | "alarm" | "talk"
type Bob = "idle" | "hop" | "sway" | "still" | "shiver" | "breathe"
type Spec = {
  arms: [ArmPose, ArmPose]
  eyes: "open" | "happy" | "wink" | "closed"
  lid: number
  wide: number
  /** [dy, tilt] — positive tilt drops the inner ends (cross). */
  brow: [number, number]
  /** [half-width, curve, open, corner tilt] */
  mouth: [number, number, number, number]
  blush: number
  bob: Bob
  tilt: number
  look?: [number, number]
}

/** Right-arm poses: wrist, curve control, glove twist (deg), glove. The left arm mirrors them. */
const ARMS: Record<ArmPose, { h: [number, number]; c: [number, number]; tw: number; g: Glove }> = {
  rest: { h: [326, 300], c: [322, 256], tw: 0, g: "open" },
  cheer: { h: [352, 104], c: [366, 206], tw: 8, g: "open" },
  hip: { h: [298, 288], c: [374, 268], tw: 10, g: "fist" },
  point: { h: [338, 112], c: [358, 212], tw: -8, g: "point" },
  think: { h: [240, 276], c: [332, 330], tw: -26, g: "point" },
  shrug: { h: [354, 184], c: [348, 262], tw: 50, g: "open" },
  ear: { h: [306, 118], c: [358, 200], tw: -35, g: "open" },
  wave: { h: [350, 112], c: [368, 208], tw: 0, g: "open" },
  cover: { h: [262, 240], c: [338, 306], tw: -20, g: "open" },
  alarm: { h: [338, 150], c: [366, 236], tw: 25, g: "open" },
  talk: { h: [342, 208], c: [352, 276], tw: 35, g: "open" },
}

const MOODS: Record<Mood, Spec> = {
  idle: { arms: ["rest", "hip"], eyes: "open", lid: 1, wide: 1, brow: [0, 0], mouth: [24, 7, 0, 0], blush: 0.35, bob: "idle", tilt: 0 },
  happy: { arms: ["cheer", "cheer"], eyes: "happy", lid: 1, wide: 1, brow: [-5, -6], mouth: [34, 9, 11, 0], blush: 0.75, bob: "hop", tilt: 0 },
  wink: { arms: ["rest", "hip"], eyes: "wink", lid: 1, wide: 1, brow: [-2, -3], mouth: [20, 5, 0, -4], blush: 0.6, bob: "sway", tilt: -5 },
  talk: { arms: ["hip", "talk"], eyes: "open", lid: 1, wide: 1, brow: [-2, -2], mouth: [24, 7, 0, 0], blush: 0.4, bob: "sway", tilt: 0 },
  explain: { arms: ["hip", "point"], eyes: "open", lid: 1, wide: 1, brow: [-4, -4], mouth: [22, 6, 0, 0], blush: 0.4, bob: "sway", tilt: 3 },
  think: { arms: ["hip", "think"], eyes: "open", lid: 0.82, wide: 1, brow: [-3, 6], mouth: [11, -1, 0, 3], blush: 0.2, bob: "still", tilt: -6, look: [-0.55, -0.9] },
  shrug: { arms: ["shrug", "shrug"], eyes: "open", lid: 1, wide: 1, brow: [-7, -9], mouth: [18, 0, 0, 4], blush: 0.3, bob: "idle", tilt: 6 },
  stern: { arms: ["hip", "hip"], eyes: "open", lid: 0.55, wide: 1, brow: [5, 16], mouth: [20, -5, 0, 0], blush: 0, bob: "shiver", tilt: 0 },
  surprised: { arms: ["alarm", "alarm"], eyes: "open", lid: 1, wide: 1.14, brow: [-11, -4], mouth: [10, 0, 11, 0], blush: 0.3, bob: "idle", tilt: 0 },
  sleepy: { arms: ["rest", "rest"], eyes: "closed", lid: 1, wide: 1, brow: [2, -3], mouth: [9, 1, 2, 0], blush: 0.25, bob: "breathe", tilt: 7, look: [0, 0.6] },
  listen: { arms: ["rest", "ear"], eyes: "open", lid: 1, wide: 1.04, brow: [-4, -3], mouth: [18, 5, 0, -2], blush: 0.4, bob: "idle", tilt: -7 },
  wave: { arms: ["hip", "wave"], eyes: "open", lid: 1, wide: 1, brow: [-4, -4], mouth: [28, 8, 6, 0], blush: 0.5, bob: "sway", tilt: 0 },
  shy: { arms: ["cover", "cover"], eyes: "happy", lid: 1, wide: 1, brow: [-3, -6], mouth: [14, 5, 0, 0], blush: 1, bob: "idle", tilt: -8, look: [0.3, 0.5] },
  sad: { arms: ["rest", "rest"], eyes: "open", lid: 0.8, wide: 1, brow: [-2, -11], mouth: [18, -6, 0, 0], blush: 0.2, bob: "breathe", tilt: 4, look: [0, 0.7] },
}

const MOOD_NAMES = Object.keys(MOODS) as Mood[]
const toMood = (m: string | undefined): Mood => (m && (MOOD_NAMES as string[]).includes(m) ? (m as Mood) : "talk")

/** Poke reactions, in order, by how many pokes in a row. */
const POKE_MOODS: Mood[] = ["happy", "surprised", "wink", "stern", "stern"]

const CX = 200
const CY = 190
const EYE_L = 170
const EYE_R = 230
const EYE_Y = 168
const MOUTH_Y = 232
const SHOULDER: [number, number] = [292, 222]
const FLOOR = 410
/** The floor reflection is foreshortened, so the whole figure fits under her. */
const REFLECT = 0.62
const HAPPY_EYE = "M-15 8 Q0 -16 15 8"
const CLOSED_EYE = "M-16 -2 Q0 14 16 -2"

const ease = (cur: number, target: number, dt: number, rate: number) =>
  target + (cur - target) * Math.exp(-rate * dt)
const r2 = (n: number) => Math.round(n * 100) / 100
const sat = (v: number) => v / Math.sqrt(1 + v * v)

function mouthPath(w: number, c: number, o: number, tl: number) {
  const y = MOUTH_Y
  return (
    "M" + r2(CX - w) + " " + r2(y - tl) +
    " Q" + CX + " " + r2(y + 2 * c - o) + " " + r2(CX + w) + " " + r2(y + tl) +
    " Q" + CX + " " + r2(y + 2 * c + 2 * o) + " " + r2(CX - w) + " " + r2(y - tl) + "Z"
  )
}

/* ------------------------------------------------------------------ themes */

type Palette = {
  bg: string
  panel: string
  text: string
  muted: string
  line: string
  hover: string
  field: string
  ring: string
  bubbleInk: string
  accent: string
  accentInk: string
  face: string
  ink: string
  limb: string
  leg: string
  glove: string
  shoe: string
  glow: string
  glowA: string
  blush: string
  lit: string
  mouth: string
}

const THEMES: Record<"midnight" | "peach" | "noir", Palette> = {
  midnight: {
    bg: "#070504", panel: "rgba(255,244,230,0.035)", text: "#f8ead9", muted: "#b39479",
    line: "rgba(247,146,42,0.24)", hover: "rgba(247,146,42,0.1)", field: "rgba(255,255,255,0.04)",
    ring: "rgba(247,146,42,0.25)", bubbleInk: "#2b0f04", accent: "#f7922a", accentInk: "#2b0f04",
    face: "#f7922a", ink: "#3a1507", limb: "#f7922a", leg: "#8a3a14", glove: "#fbf5ec",
    shoe: "#fbf5ec", glow: "#ff7a1a", glowA: "0.5", blush: "#ff5a3d", lit: "#fff1c2", mouth: "#5a1206",
  },
  peach: {
    bg: "#f1dacd", panel: "rgba(255,250,246,0.55)", text: "#3a1507", muted: "#8b5a43",
    line: "rgba(58,21,7,0.16)", hover: "rgba(232,98,42,0.08)", field: "rgba(255,255,255,0.7)",
    ring: "rgba(232,98,42,0.22)", bubbleInk: "#2b0f04", accent: "#e8622a", accentInk: "#fff8f1",
    face: "#f39a3c", ink: "#3a1507", limb: "#f39a3c", leg: "#3a1507", glove: "#f3eee6",
    shoe: "#f08f2c", glow: "#ff4a2a", glowA: "0.62", blush: "#ff6a4a", lit: "#fff6dc", mouth: "#5a1206",
  },
  noir: {
    bg: "#000000", panel: "rgba(255,255,255,0.04)", text: "#f5f5f5", muted: "#9b9b9b",
    line: "rgba(255,255,255,0.18)", hover: "rgba(255,255,255,0.08)", field: "rgba(255,255,255,0.05)",
    ring: "rgba(255,255,255,0.2)", bubbleInk: "#0a0a0a", accent: "#f2f2f0", accentInk: "#0a0a0a",
    face: "#f2f2f0", ink: "#0d0d0d", limb: "#f2f2f0", leg: "#f2f2f0", glove: "#f2f2f0",
    shoe: "#f2f2f0", glow: "#ffffff", glowA: "0.14", blush: "#cfcfcf", lit: "#8a8a8a", mouth: "#222222",
  },
}

const SANS_STACK = 'ui-rounded,"SF Pro Rounded","Nunito","Segoe UI",system-ui,-apple-system,Helvetica,Arial,sans-serif'
const DISPLAY_STACK = '"Cooper Black","Cooper Std","Bookman Old Style","Iowan Old Style",Georgia,serif'

const DEFAULT_SUGGESTIONS = ["Who are you?", "What time is it?", "Tell me a joke", "Timer for 1 minute", "What's 12 x 7?"]

/* --------------------------------------------------------------- component */

type Msg = { id: number; role: "user" | "bot"; text: string }
type Timer = { end: number; total: number }

export default function ClockMascotChat({
  height = "100svh",
  minHeight = "560px",
  theme = "midnight",
  name = "Tilly Tock",
  org = "Bureau of Timekeeping",
  motto = "Right on time. Every time.",
  petName = "sugar",
  lines,
  suggestions = DEFAULT_SUGGESTIONS,
  placeholder,
  onAsk,
  voice = false,
  idleSeconds = 25,
  sleepSeconds = 70,
  reflection = true,
  hologram,
  face,
  ink,
  glove,
  shoe,
  glow,
  accent,
  background,
  className,
}: ClockMascotChatProps) {
  const uid = React.useId().replace(/:/g, "")
  const id = (n: string) => uid + "-" + n
  const u = (n: string) => "url(#" + id(n) + ")"

  const allLines = React.useMemo<Lines>(() => {
    const out: Lines = { ...LINES }
    if (lines) for (const k of Object.keys(lines)) {
      const v = (lines as Lines)[k]
      if (v && v.length) out[k] = v
    }
    return out
  }, [lines])
  const persona = { name, org, motto, pet: petName }
  const vars0 = { name, org, motto, user: petName }

  /* ---- state ---- */
  const [messages, setMessages] = React.useState<Msg[]>(() => [
    { id: 1, role: "bot", text: fill(pick(allLines.greeting, 0), vars0) },
  ])
  const [typing, setTyping] = React.useState<{ id: number; n: number } | null>({ id: 1, n: 0 })
  const [input, setInput] = React.useState("")
  const [busy, setBusy] = React.useState(false)
  const [mood, setMoodState] = React.useState<Mood>("wave")
  const [fxKey, setFxKey] = React.useState(0)
  const [quip, setQuip] = React.useState<{ text: string; key: number } | null>(null)
  const [flags, setFlags] = React.useState({ boop: false, glitch: false, ring: false })
  const [now, setNow] = React.useState<Date | null>(null)
  const [timer, setTimer] = React.useState<Timer | null>(null)
  const [asleep, setAsleep] = React.useState(false)
  const [listening, setListening] = React.useState(false)
  const [voiceOn, setVoiceOn] = React.useState(voice)
  const [support, setSupport] = React.useState({ mic: false, speech: false })
  const [poked, setPoked] = React.useState(false)
  const [srText, setSrText] = React.useState("")
  const [lastIntent, setLastIntent] = React.useState("")

  /* ---- refs the frame loop and timers read ---- */
  const rootRef = React.useRef<HTMLDivElement>(null)
  const logRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const nodes = React.useRef<Record<string, Element | null>>({})
  const binders = React.useRef<Record<string, (n: Element | null) => void>>({})
  const bind = (k: string) =>
    binders.current[k] ?? (binders.current[k] = (n: Element | null) => { nodes.current[k] = n })

  const moodRef = React.useRef<Mood>("wave")
  const talkRef = React.useRef(0)
  const focusRef = React.useRef(false)
  const reducedRef = React.useRef(false)
  const pointer = React.useRef({ x: 0, y: 0, t: -1e9 })
  const busyRef = React.useRef(false)
  const typingRef = React.useRef(true)
  const listeningRef = React.useRef(false)
  const asleepRef = React.useRef(false)
  const lastAct = React.useRef(Date.now())
  const nudged = React.useRef(false)
  const nudges = React.useRef(0)
  const nextId = React.useRef(2)
  const seed = React.useRef(Math.floor(Math.random() * 1000))
  const userRef = React.useRef("")
  const lastIntentRef = React.useRef("")
  const timerRef = React.useRef<Timer | null>(null)
  const pokes = React.useRef({ n: 0, at: 0 })
  const settleT = React.useRef(0)
  const timeouts = React.useRef(new Set<number>())
  const mounted = React.useRef(true)
  const voiceRef = React.useRef(voice)
  const recRef = React.useRef<any>(null)
  const messagesRef = React.useRef(messages)
  messagesRef.current = messages
  const live = React.useRef({ onAsk, allLines, persona, idleSeconds, sleepSeconds })
  live.current = { onAsk, allLines, persona, idleSeconds, sleepSeconds }

  typingRef.current = typing !== null
  busyRef.current = busy

  const later = React.useCallback((fn: () => void, ms: number) => {
    const t = window.setTimeout(() => {
      timeouts.current.delete(t)
      fn()
    }, ms)
    timeouts.current.add(t)
    return t
  }, [])

  const setMood = React.useCallback((m: Mood) => {
    window.clearTimeout(settleT.current)
    moodRef.current = m
    setMoodState(m)
    setFxKey((k) => k + 1)
  }, [])

  /** Drift back to rest after a beat — unless something else has taken over. */
  const settle = React.useCallback(
    (ms = 2600) => {
      window.clearTimeout(settleT.current)
      settleT.current = window.setTimeout(() => {
        if (!mounted.current || busyRef.current || typingRef.current) return
        if (asleepRef.current) return
        const m: Mood = listeningRef.current || (focusRef.current && inputRef.current?.value) ? "listen" : "idle"
        moodRef.current = m
        setMoodState(m)
      }, ms)
    },
    [],
  )

  const flash = React.useCallback(
    (flag: "boop" | "glitch" | "ring", ms: number) => {
      setFlags((f) => ({ ...f, [flag]: false }))
      requestAnimationFrame(() => setFlags((f) => ({ ...f, [flag]: true })))
      later(() => setFlags((f) => ({ ...f, [flag]: false })), ms)
    },
    [later],
  )

  const showQuip = React.useCallback(
    (text: string) => {
      const key = Date.now()
      setQuip({ text, key })
      later(() => setQuip((q) => (q && q.key === key ? null : q)), 2800)
    },
    [later],
  )

  const speak = React.useCallback((text: string) => {
    if (!voiceRef.current || typeof window === "undefined" || !window.speechSynthesis) return
    const synth = window.speechSynthesis
    synth.cancel()
    const ut = new SpeechSynthesisUtterance(text.replace(/[^\w\s.,!?'’-]/g, " "))
    const voices = synth.getVoices()
    const v =
      voices.find((x) => /^en[-_]US/i.test(x.lang) && /samantha|zira|aria|jenny|female|google us english/i.test(x.name)) ||
      voices.find((x) => /^en/i.test(x.lang))
    if (v) ut.voice = v
    ut.pitch = 1.45
    ut.rate = 1.04
    synth.speak(ut)
  }, [])

  const activity = React.useCallback(() => {
    lastAct.current = Date.now()
    nudged.current = false
  }, [])

  const botSay = React.useCallback(
    (text: string, m: Mood) => {
      const mid = nextId.current++
      setMessages((ms) => [...ms, { id: mid, role: "bot", text }])
      typingRef.current = true
      setTyping({ id: mid, n: 0 })
      setMood(m)
      setSrText(live.current.persona.name + ": " + text)
      if (m === "stern") flash("glitch", 1100)
      speak(text)
    },
    [flash, setMood, speak],
  )

  const wake = React.useCallback(() => {
    if (!asleepRef.current) return
    asleepRef.current = false
    setAsleep(false)
    setMood("surprised")
    showQuip(pick(live.current.allLines.wake, seed.current++))
    settle(1800)
  }, [setMood, settle, showQuip])

  /* ---- typewriter + lip-sync ---- */
  React.useEffect(() => {
    if (!typing) return
    const msg = messages.find((m) => m.id === typing.id)
    if (!msg || reducedRef.current || typing.n >= msg.text.length) {
      talkRef.current = 0
      typingRef.current = false
      setTyping(null)
      if (moodRef.current !== "sleepy") settle(asleepRef.current ? 0 : 2600)
      return
    }
    const ch = msg.text[typing.n]
    talkRef.current = cadence(ch)
    const t = window.setTimeout(
      () => setTyping({ id: typing.id, n: typing.n + 1 }),
      typeDelay(ch) * (voiceRef.current ? 2.2 : 1),
    )
    return () => window.clearTimeout(t)
  }, [typing, messages, settle])

  /* keep the newest line in view — scroll the log, never the page */
  React.useEffect(() => {
    const el = logRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, typing, busy])

  /* ---- send ---- */
  const send = React.useCallback(
    async (raw: string) => {
      const text = raw.trim()
      if (!text || busyRef.current) return
      activity()
      if (asleepRef.current) {
        asleepRef.current = false
        setAsleep(false)
      }
      const history: ChatMessage[] = messagesRef.current.map((m) => ({
        role: m.role === "bot" ? "assistant" : "user",
        content: m.text,
      }))
      setMessages((ms) => [...ms, { id: nextId.current++, role: "user", text }])
      setInput("")
      busyRef.current = true
      setBusy(true)
      setMood("think")

      const { onAsk: ask, allLines: ls, persona: p } = live.current
      let out: { text: string; mood: Mood; timer: number }
      try {
        if (ask) {
          const r = await ask(text, history)
          out =
            typeof r === "string"
              ? { text: r, mood: toMood(moodOf(r)), timer: 0 }
              : { text: r.text, mood: r.mood ?? toMood(moodOf(r.text)), timer: 0 }
        } else {
          const r = reply(text, {
            ...p,
            user: userRef.current,
            now: new Date(),
            seed: seed.current++,
            last: lastIntentRef.current,
            lines: ls,
          })
          await new Promise<void>((res) => later(res, reducedRef.current ? 150 : 420 + Math.min(900, text.length * 14)))
          userRef.current = r.user
          lastIntentRef.current = r.intent
          setLastIntent(r.intent)
          out = { text: r.text, mood: toMood(r.mood), timer: r.timer }
        }
      } catch (err) {
        out = { text: pick(ls.error, seed.current++), mood: "shrug", timer: 0 }
      }
      if (!mounted.current) return
      busyRef.current = false
      setBusy(false)
      if (out.timer > 0) {
        const tm = { end: Date.now() + out.timer * 1000, total: out.timer }
        timerRef.current = tm
        setTimer(tm)
      }
      botSay(out.text, out.mood)
    },
    [activity, botSay, later, setMood],
  )

  /* ---- poke ---- */
  const poke = () => {
    activity()
    if (asleepRef.current) return wake()
    const t = Date.now()
    const p = pokes.current
    p.n = t - p.at < 4000 ? p.n + 1 : 1
    p.at = t
    const list = live.current.allLines.poke
    const i = Math.min(p.n - 1, list.length - 1)
    const m = POKE_MOODS[Math.min(i, POKE_MOODS.length - 1)]
    setPoked(true)
    showQuip(list[i])
    if (busyRef.current) return
    setMood(m)
    flash(p.n >= 5 ? "glitch" : "boop", p.n >= 5 ? 1100 : 450)
    settle(2200)
  }

  /* ---- voice in ---- */
  const toggleMic = () => {
    if (listeningRef.current) {
      recRef.current?.stop()
      return
    }
    const w = window as any
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition
    if (!SR) return
    const rec = new SR()
    rec.lang = "en-US"
    rec.interimResults = true
    rec.maxAlternatives = 1
    rec.onresult = (e: any) => {
      let said = ""
      let final = false
      for (let i = e.resultIndex; i < e.results.length; i++) {
        said += e.results[i][0].transcript
        if (e.results[i].isFinal) final = true
      }
      setInput(said)
      activity()
      if (final) {
        rec.stop()
        send(said)
      }
    }
    rec.onend = () => {
      listeningRef.current = false
      setListening(false)
      if (!busyRef.current && !typingRef.current) settle(600)
    }
    rec.onerror = rec.onend
    recRef.current = rec
    listeningRef.current = true
    setListening(true)
    wake()
    setMood("listen")
    try {
      rec.start()
    } catch (err) {
      rec.onend()
    }
  }

  const toggleVoice = () => {
    const v = !voiceRef.current
    voiceRef.current = v
    setVoiceOn(v)
    if (!v) window.speechSynthesis?.cancel()
  }

  /* ---- mount: capabilities, clock, idle, sleep, timer ---- */
  React.useEffect(() => {
    mounted.current = true
    const w = window as any
    setSupport({ mic: !!(w.SpeechRecognition || w.webkitSpeechRecognition), speech: !!w.speechSynthesis })
    setNow(new Date())
    const iv = window.setInterval(() => {
      const t = Date.now()
      setNow(new Date(t))
      const tm = timerRef.current
      if (tm && t >= tm.end) {
        timerRef.current = null
        setTimer(null)
        activity()
        if (asleepRef.current) {
          asleepRef.current = false
          setAsleep(false)
        }
        const { allLines: ls, persona: p } = live.current
        botSay(
          fill(pick(ls.timerDone, seed.current++), { ...p, user: userRef.current || p.pet, n: fmtDuration(tm.total) }),
          "surprised",
        )
        flash("ring", 1600)
        return
      }
      if (busyRef.current || typingRef.current || listeningRef.current || asleepRef.current) return
      const idle = (t - lastAct.current) / 1000
      const { idleSeconds: nudgeAt, sleepSeconds: sleepAt } = live.current
      if (idle > sleepAt && !timerRef.current) {
        asleepRef.current = true
        setAsleep(true)
        setMood("sleepy")
      } else if (idle > nudgeAt && !nudged.current && nudges.current < 2) {
        nudged.current = true
        nudges.current++
        const { allLines: ls, persona: p } = live.current
        botSay(fill(pick(ls.nudge, seed.current++), { ...p, user: userRef.current || p.pet }), "wave")
      }
    }, 1000)
    const pending = timeouts.current
    return () => {
      mounted.current = false
      window.clearInterval(iv)
      window.clearTimeout(settleT.current)
      pending.forEach((t) => window.clearTimeout(t))
      pending.clear()
      try {
        recRef.current?.abort()
      } catch (err) {
        /* already stopped */
      }
      window.speechSynthesis?.cancel()
    }
  }, [activity, botSay, flash, setMood])

  /* ---- the frame loop: writes straight to the SVG, never to React state ---- */
  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    const onMq = () => {
      reducedRef.current = mq.matches
    }
    onMq()
    mq.addEventListener("change", onMq)

    const onMove = (e: PointerEvent) => {
      pointer.current = { x: e.clientX, y: e.clientY, t: performance.now() }
    }
    const onBlur = () => {
      pointer.current.t = -1e9
    }
    window.addEventListener("pointermove", onMove, { passive: true })
    window.addEventListener("pointerdown", onMove, { passive: true })
    window.addEventListener("blur", onBlur)

    let visible = true
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting
    })
    if (rootRef.current) io.observe(rootRef.current)

    const n = nodes.current
    const set = (k: string, a: string, v: string | number) => n[k]?.setAttribute(a, String(v))
    const rest = (side: "L" | "R") => {
      const p = ARMS.rest
      const m = side === "L"
      return { hx: m ? 400 - p.h[0] : p.h[0], hy: p.h[1], cx: m ? 400 - p.c[0] : p.c[0], cy: p.c[1], tw: 0, g: "" }
    }
    const S = {
      gx: 0, gy: 0, wx: 0, wy: 0, wanderAt: 0,
      blinkAt: 1.2, blinkT: -9, dbl: false,
      bdy: 0, btl: 0, mw: 24, mc: 7, mo: 0, mt: 0, talk: 0,
      blush: 0.35, wide: 1, lid: 1, tilt: 0, eyes: "",
      L: rest("L"), R: rest("R"),
    }

    let raf = 0
    let last = performance.now()
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame)
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      if (!visible) return
      const t = now / 1000
      const rm = reducedRef.current
      const k = rm ? 0 : 1
      const spec = MOODS[moodRef.current]

      /* gaze: where she is told to look, else your input, else your pointer, else wander */
      let tx = 0
      let ty = 0
      const faceEl = n.face as SVGGraphicsElement | null
      const target = spec.look
        ? null
        : focusRef.current && inputRef.current
          ? inputRef.current.getBoundingClientRect()
          : now - pointer.current.t < 3000
            ? { left: pointer.current.x, top: pointer.current.y, width: 0, height: 0 }
            : null
      if (spec.look) {
        tx = spec.look[0]
        ty = spec.look[1]
      } else if (target && faceEl) {
        const f = faceEl.getBoundingClientRect()
        tx = sat((target.left + target.width / 2 - (f.left + f.width / 2)) / (f.width * 0.9))
        ty = sat((target.top + target.height / 2 - (f.top + f.height / 2)) / (f.height * 0.9))
      } else if (!rm) {
        if (t > S.wanderAt) {
          S.wx = Math.random() * 1.6 - 0.8
          S.wy = Math.random() * 1.0 - 0.5
          S.wanderAt = t + 1.2 + Math.random() * 2.6
        }
        tx = S.wx
        ty = S.wy
      }
      S.gx = ease(S.gx, tx, dt, rm ? 60 : 9)
      S.gy = ease(S.gy, ty, dt, rm ? 60 : 9)

      /* eyes */
      if (S.eyes !== spec.eyes) {
        S.eyes = spec.eyes
        const lOpen = spec.eyes === "open"
        const rOpen = spec.eyes === "open" || spec.eyes === "wink"
        const arc = spec.eyes === "happy" ? HAPPY_EYE : CLOSED_EYE
        set("eyeLo", "display", lOpen ? "inline" : "none")
        set("eyeRo", "display", rOpen ? "inline" : "none")
        set("eyeLa", "display", lOpen ? "none" : "inline")
        set("eyeRa", "display", rOpen ? "none" : "inline")
        set("eyeLa", "d", arc)
        set("eyeRa", "d", arc)
      }
      if (!rm && t > S.blinkAt) {
        S.blinkT = t
        S.blinkAt = t + (S.dbl ? 0.24 : 2 + Math.random() * 4)
        S.dbl = !S.dbl && Math.random() < 0.22
      }
      const bp = (t - S.blinkT) / 0.15
      const blinkOpen = bp >= 0 && bp < 1 ? 1 - Math.sin(bp * Math.PI) * 0.96 : 1
      S.lid = ease(S.lid, spec.lid, dt, 10)
      S.wide = ease(S.wide, spec.wide, dt, 12)
      const lidH = r2((1 - S.lid * blinkOpen) * 60)
      for (const [s, ex] of [["L", EYE_L], ["R", EYE_R]] as const) {
        set("eye" + s + "o", "transform", "translate(" + ex + " " + EYE_Y + ") scale(" + r2(S.wide) + ") translate(" + -ex + " " + -EYE_Y + ")")
        set("pup" + s, "transform", "translate(" + r2(S.gx * 7.5) + " " + r2(S.gy * 9 + 3) + ")")
        set("lid" + s, "height", lidH)
        set("lidline" + s, "y1", 138 + lidH)
        set("lidline" + s, "y2", 138 + lidH)
        set("lidline" + s, "opacity", lidH > 1.5 ? 1 : 0)
      }

      /* brows */
      S.bdy = ease(S.bdy, spec.brow[0], dt, 10)
      S.btl = ease(S.btl, spec.brow[1], dt, 10)
      set("browL", "transform", "translate(" + EYE_L + " " + r2(128 + S.bdy) + ") rotate(" + r2(S.btl) + ")")
      set("browR", "transform", "translate(" + EYE_R + " " + r2(128 + S.bdy) + ") rotate(" + r2(-S.btl) + ")")

      /* mouth, with lip-sync riding on top of the mood's shape */
      S.talk = ease(S.talk, talkRef.current, dt, 26)
      S.mw = ease(S.mw, spec.mouth[0], dt, 11)
      S.mc = ease(S.mc, spec.mouth[1], dt, 11)
      S.mo = ease(S.mo, spec.mouth[2], dt, 11)
      S.mt = ease(S.mt, spec.mouth[3], dt, 11)
      const mo = Math.max(S.mo, S.talk * 12)
      const mw = S.mw - S.talk * 5
      const md = mouthPath(mw, S.mc, mo, S.mt)
      set("mouthFill", "d", md)
      set("mouthLine", "d", md)
      set("mouthClip", "d", md)
      set("teeth", "x", r2(CX - mw))
      set("teeth", "width", r2(mw * 2))
      set("teeth", "y", r2(MOUTH_Y + S.mc - mo / 2 - 3))
      set("teeth", "height", mo > 2.5 ? r2(mo * 0.5 + 2) : 0)
      set("tongue", "cy", r2(MOUTH_Y + S.mc + mo * 1.05))
      set("tongue", "rx", r2(mw * 0.5))
      set("tongue", "ry", r2(Math.max(0, mo * 0.55)))
      S.blush = ease(S.blush, spec.blush, dt, 6)
      set("blush", "opacity", r2(S.blush))

      /* body: bob, hop, sway, tremble */
      let lift = 0
      let rot = 0
      let sq = 0
      let sx = 0
      let jump = 0
      if (spec.bob === "hop") {
        const ph = Math.abs(Math.sin(t * 5.2))
        lift = ph * 16
        jump = lift * 0.85
        sq = Math.pow(1 - ph, 4) * 0.06
        rot = Math.sin(t * 2.6) * 3
      } else if (spec.bob === "sway") {
        lift = Math.abs(Math.sin(t * 3.2)) * 3
        rot = Math.sin(t * 1.6) * 3
      } else if (spec.bob === "still") {
        lift = (Math.sin(t * 1.5) * 0.5 + 0.5) * 1.5
      } else if (spec.bob === "shiver") {
        sx = Math.sin(t * 41) * 0.9
        rot = Math.sin(t * 33) * 0.7
      } else if (spec.bob === "breathe") {
        lift = (Math.sin(t * 1.1) * 0.5 + 0.5) * 2
        sq = Math.sin(t * 1.1) * 0.012
      } else {
        lift = (Math.sin(t * 2.4) * 0.5 + 0.5) * 4
        rot = Math.sin(t * 1.2) * 1.5
        sq = (Math.sin(t * 2.4 + 1.6) * 0.5 + 0.5) * 0.012
      }
      S.tilt = ease(S.tilt, spec.tilt, dt, 6)
      lift *= k
      jump *= k
      sq *= k
      sx *= k
      rot = rot * k + S.tilt
      set(
        "body",
        "transform",
        "translate(" + r2(sx) + " " + r2(-lift) + ") rotate(" + r2(rot) + " 200 300) translate(200 300) scale(" +
          r2(1 + sq) + " " + r2(1 - sq) + ") translate(-200 -300)",
      )
      set("shoes", "transform", "translate(0 " + r2(-jump) + ")")

      /* legs: hips ride the body, feet stay put */
      for (const [s, m] of [["L", -1], ["R", 1]] as const) {
        const hx = CX + m * 12 + sx
        const hy = 286 - lift
        const fx = CX + m * 18
        const fy = 392 - jump
        const bow = 7 + sq * 140
        const d = "M" + r2(hx) + " " + r2(hy) + " Q" + r2((hx + fx) / 2 + m * bow) + " " + r2((hy + fy) / 2) + " " + r2(fx) + " " + r2(fy)
        set("leg" + s + "o", "d", d)
        set("leg" + s, "d", d)
      }

      /* arms: ease each wrist and elbow curve toward the pose, aim the glove down the hose */
      const talking = talkRef.current > 0 || S.talk > 0.05
      for (const [s, mi] of [["L", 0], ["R", 1]] as const) {
        const pose = spec.arms[mi]
        const P = ARMS[pose]
        const mir = s === "L"
        const A = S[s]
        let hx = mir ? 400 - P.h[0] : P.h[0]
        let hy = P.h[1]
        let tw = P.tw
        if (pose === "wave") {
          hx += (mir ? -1 : 1) * Math.sin(t * 9) * 10 * k
          tw += Math.sin(t * 9) * 26 * k
        }
        if (pose === "talk" && talking) hy += Math.sin(t * 7 + mi) * 7 * k
        if (pose === "think") tw += Math.sin(t * 6) * 7 * k
        if (pose === "cheer") hy += Math.sin(t * 5.2 + mi * 0.6) * 5 * k
        const rate = rm ? 40 : 9
        A.hx = ease(A.hx, hx, dt, rate)
        A.hy = ease(A.hy, hy, dt, rate)
        A.cx = ease(A.cx, mir ? 400 - P.c[0] : P.c[0], dt, rate)
        A.cy = ease(A.cy, P.c[1], dt, rate)
        A.tw = ease(A.tw, mir ? -tw : tw, dt, rate)
        const sx0 = mir ? 400 - SHOULDER[0] : SHOULDER[0]
        const d = "M" + sx0 + " " + SHOULDER[1] + " Q" + r2(A.cx) + " " + r2(A.cy) + " " + r2(A.hx) + " " + r2(A.hy)
        set("arm" + s + "o", "d", d)
        set("arm" + s, "d", d)
        const ang = (Math.atan2(A.hy - A.cy, A.hx - A.cx) * 180) / Math.PI + 90 + A.tw
        set("glove" + s, "transform", "translate(" + r2(A.hx) + " " + r2(A.hy) + ") rotate(" + r2(ang) + ") scale(" + (mir ? -1.35 : 1.35) + " 1.35)")
        if (A.g !== P.g) {
          A.g = P.g
          set("glove" + s, "data-shape", P.g)
        }
      }
    }
    raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
      mq.removeEventListener("change", onMq)
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerdown", onMove)
      window.removeEventListener("blur", onBlur)
    }
  }, [])

  /* ---- derived ---- */
  const pal: Palette = {
    ...THEMES[theme],
    ...(face ? { face, limb: face } : null),
    ...(ink ? { ink } : null),
    ...(glove ? { glove } : null),
    ...(shoe ? { shoe } : null),
    ...(glow ? { glow } : null),
    ...(accent ? { accent } : null),
    ...(background ? { bg: background } : null),
  }
  const holo = hologram ?? theme !== "peach"
  const initials =
    org
      .split(/\s+/)
      .filter((w) => w && !/^(of|the|and|for|a|an)$/i.test(w))
      .map((w) => w[0].toUpperCase())
      .join("")
      .slice(0, 3) || "T"
  const status = listening
    ? "listening…"
    : busy
      ? "checking the files…"
      : typing
        ? "talking"
        : asleep
          ? "on break"
          : "on the clock"
  const dotState = listening ? "listen" : busy || typing ? "busy" : asleep ? "sleep" : "ok"
  const remaining = timer && now ? Math.max(0, Math.ceil((timer.end - now.getTime()) / 1000)) : 0
  const chips = lastIntent === "late" && !busy ? ["Yes please!", ...suggestions] : suggestions

  const style = {
    height,
    minHeight,
    "--rcc-bg": pal.bg,
    "--rcc-panel": pal.panel,
    "--rcc-text": pal.text,
    "--rcc-muted": pal.muted,
    "--rcc-line": pal.line,
    "--rcc-hover": pal.hover,
    "--rcc-field": pal.field,
    "--rcc-ring": pal.ring,
    "--rcc-bubble-ink": pal.bubbleInk,
    "--rcc-accent": pal.accent,
    "--rcc-accent-ink": pal.accentInk,
    "--rcc-face": pal.face,
    "--rcc-ink": pal.ink,
    "--rcc-limb": pal.limb,
    "--rcc-leg": pal.leg,
    "--rcc-glove": pal.glove,
    "--rcc-shoe": pal.shoe,
    "--rcc-glow": pal.glow,
    "--rcc-glow-a": pal.glowA,
    "--rcc-blush": pal.blush,
    "--rcc-lit": pal.lit,
    "--rcc-mouth": pal.mouth,
    "--rcc-sans": SANS_STACK,
    "--rcc-display": DISPLAY_STACK,
  } as React.CSSProperties

  const inkStroke = { stroke: "var(--rcc-ink)" }
  const gloveStyle = { fill: "var(--rcc-glove)", stroke: "var(--rcc-ink)" }
  const finger = (x: number, y: number, a: number, len: number) => (
    <rect x={-3.6} y={-len} width={7.2} height={len + 2} rx={3.6} transform={"translate(" + x + " " + y + ") rotate(" + a + ")"} style={gloveStyle} strokeWidth={2.4} />
  )
  const gloveShapes = (
    <>
      <g data-g="open">
        {finger(-9, -18, -24, 14)}
        {finger(-3, -21, -8, 16)}
        {finger(3.5, -21, 8, 16)}
        {finger(9.5, -18, 24, 13)}
        {finger(-10, -9, -70, 11)}
        <ellipse cx={0} cy={-13} rx={12} ry={10} style={gloveStyle} strokeWidth={2.4} />
      </g>
      <g data-g="point">
        {finger(-4, -18, -4, 20)}
        <ellipse cx={0} cy={-12} rx={11.5} ry={10} style={gloveStyle} strokeWidth={2.4} />
        <path d="M1 -19 Q4 -22 7 -18 M-9 -8 Q-2 -4 6 -7" fill="none" strokeWidth={2} strokeLinecap="round" style={inkStroke} />
      </g>
      <g data-g="fist">
        <ellipse cx={0} cy={-12} rx={12} ry={10.5} style={gloveStyle} strokeWidth={2.4} />
        <path d="M-8 -19 Q-5 -23 -1 -19 M1 -19 Q5 -23 8 -18" fill="none" strokeWidth={2} strokeLinecap="round" style={inkStroke} />
      </g>
      <rect x={-10} y={-5} width={20} height={9} rx={3.5} style={gloveStyle} strokeWidth={2.4} />
      <line x1={-8} x2={8} y1={-0.5} y2={-0.5} strokeWidth={1.6} style={inkStroke} />
    </>
  )
  const lashes = (cx: number, side: -1 | 1) =>
    [-128, -104, -80].map((deg, i) => {
      const a = ((side === -1 ? deg : -180 - deg) * Math.PI) / 180
      const x1 = cx + Math.cos(a) * 20
      const y1 = EYE_Y + Math.sin(a) * 28
      return (
        <line key={i} x1={r2(x1)} y1={r2(y1)} x2={r2(x1 + Math.cos(a) * 8)} y2={r2(y1 + Math.sin(a) * 8)} strokeWidth={3} strokeLinecap="round" style={inkStroke} />
      )
    })
  const eye = (s: "L" | "R", cx: number) => (
    <>
      <g ref={bind("eye" + s + "o")}>
        <ellipse cx={cx} cy={EYE_Y} rx={20} ry={28} fill="#fff" />
        <g clipPath={u("clip" + s)}>
          <g ref={bind("pup" + s)}>
            <ellipse cx={cx} cy={EYE_Y + 2} rx={11} ry={15.5} style={{ fill: "var(--rcc-ink)" }} />
            <ellipse cx={cx - 4} cy={EYE_Y - 5} rx={3.6} ry={4.8} fill="#fff" />
            <ellipse cx={cx + 4} cy={EYE_Y + 9} rx={1.8} ry={2.2} fill="#fff" opacity={0.7} />
          </g>
          <rect ref={bind("lid" + s)} x={cx - 24} y={138} width={48} height={0} style={{ fill: "var(--rcc-face)" }} />
          <line ref={bind("lidline" + s)} x1={cx - 24} x2={cx + 24} y1={138} y2={138} strokeWidth={3.5} opacity={0} style={inkStroke} />
        </g>
        <ellipse cx={cx} cy={EYE_Y} rx={20} ry={28} fill="none" strokeWidth={3.5} style={inkStroke} />
        {lashes(cx, s === "L" ? -1 : 1)}
      </g>
      <path ref={bind("eye" + s + "a")} transform={"translate(" + cx + " " + (EYE_Y - 2) + ")"} display="none" d={CLOSED_EYE} fill="none" strokeWidth={4.5} strokeLinecap="round" style={inkStroke} />
    </>
  )

  const fx = (() => {
    const pop = (x: number, y: number, i: number, el: React.ReactNode, cls = "rcc-pop") => (
      <g key={i} transform={"translate(" + x + " " + y + ")"}>
        <g className={cls} style={{ animationDelay: i * 0.12 + "s" }}>
          {el}
        </g>
      </g>
    )
    const spark = <path d="M0 -11 L2.6 -2.6 L11 0 L2.6 2.6 L0 11 L-2.6 2.6 L-11 0 L-2.6 -2.6 Z" style={{ fill: "var(--rcc-accent)" }} />
    const heart = <path d="M0 6 C-14 -4 -8 -16 0 -9 C8 -16 14 -4 0 6 Z" style={{ fill: "var(--rcc-blush)" }} />
    const glyph = (c: string, size = 34) => (
      <text textAnchor="middle" fontSize={size} fontWeight={900} style={{ fill: "var(--rcc-text)", fontFamily: "var(--rcc-display)" }}>
        {c}
      </text>
    )
    switch (mood) {
      case "happy":
        return [[86, 108], [318, 80], [336, 246], [66, 236], [200, 58]].map(([x, y], i) => pop(x, y, i, spark))
      case "shy":
        return [[120, 176], [286, 164], [252, 104]].map(([x, y], i) => pop(x, y, i, heart, "rcc-float"))
      case "sleepy":
        return [[270, 110], [290, 92], [312, 74]].map(([x, y], i) => pop(x, y, i, glyph("z", 22 + i * 6), "rcc-zz"))
      case "shrug":
        return [pop(306, 92, 0, glyph("?"))]
      case "surprised":
        return [pop(316, 88, 0, glyph("!")), pop(84, 96, 1, glyph("!"))]
      case "stern":
        return [
          pop(300, 100, 0, (
            <path d="M-10 -3 Q-3 -3 -3 -10 M3 -10 Q3 -3 10 -3 M10 3 Q3 3 3 10 M-3 10 Q-3 3 -10 3" fill="none" stroke="#ff2d20" strokeWidth={4} strokeLinecap="round" />
          )),
        ]
      default:
        return null
    }
  })()

  const quipText = quip?.text

  return (
    <div
      ref={rootRef}
      className={"rcc-root" + (className ? " " + className : "")}
      style={style}
      data-mood={mood}
      data-busy={busy || undefined}
      data-boop={flags.boop || undefined}
      data-glitch={flags.glitch || undefined}
      data-ring={flags.ring || undefined}
      onPointerMove={() => {
        activity()
        wake()
      }}
    >
      <style>{CSS}</style>
      <div className="rcc-shell">
        {/* ---------------------------------------------------------- stage */}
        <div className="rcc-stage" data-holo={holo || undefined}>
          <div className="rcc-emblem" aria-hidden="true">
            <span className="rcc-mark">{initials}</span>
            <span className="rcc-org">{org}</span>
          </div>
          <p className="rcc-motto" aria-hidden="true">
            {motto.split(/(?<=[.!?])\s+/).map((l, i) => (
              <span key={i}>{l}</span>
            ))}
          </p>

          <svg className="rcc-svg" viewBox="0 40 400 540" preserveAspectRatio="xMidYMid meet" aria-hidden="false">
            <defs>
              <radialGradient id={id("halo")} cx="50%" cy="50%" r="50%">
                <stop offset="0" className="rcc-glowstop" stopOpacity={0.9} />
                <stop offset="0.5" className="rcc-glowstop" stopOpacity={0.38} />
                <stop offset="1" className="rcc-glowstop" stopOpacity={0} />
              </radialGradient>
              <radialGradient id={id("floor")} cx="50%" cy="50%" r="50%">
                <stop offset="0" className="rcc-glowstop" stopOpacity={0.5} />
                <stop offset="1" className="rcc-glowstop" stopOpacity={0} />
              </radialGradient>
              <radialGradient id={id("face")} cx="36%" cy="30%" r="78%">
                <stop offset="0" style={{ stopColor: "color-mix(in srgb, var(--rcc-face) 55%, #fff)" }} />
                <stop offset="0.5" style={{ stopColor: "var(--rcc-face)" }} />
                <stop offset="1" style={{ stopColor: "color-mix(in srgb, var(--rcc-face) 86%, #000)" }} />
              </radialGradient>
              <linearGradient id={id("reflg")} x1="0" y1={FLOOR} x2="0" y2="580" gradientUnits="userSpaceOnUse">
                <stop offset="0" stopColor="#fff" stopOpacity={0.55} />
                <stop offset="1" stopColor="#fff" stopOpacity={0} />
              </linearGradient>
              <mask id={id("refl")} maskUnits="userSpaceOnUse" x="0" y={FLOOR} width="400" height="170">
                <rect x="0" y={FLOOR} width="400" height="170" fill={u("reflg")} />
              </mask>
              <clipPath id={id("clipL")}>
                <ellipse cx={EYE_L} cy={EYE_Y} rx={20} ry={28} />
              </clipPath>
              <clipPath id={id("clipR")}>
                <ellipse cx={EYE_R} cy={EYE_Y} rx={20} ry={28} />
              </clipPath>
              <clipPath id={id("mouth")}>
                <path ref={bind("mouthClip")} d={mouthPath(24, 7, 0, 0)} />
              </clipPath>
            </defs>

            <circle className="rcc-halo" cx={CX} cy={CY + 6} r={196} fill={u("halo")} />
            <ellipse cx={CX} cy={FLOOR + 1} rx={128} ry={9} fill={u("floor")} />

            {reflection ? (
              <g mask={u("refl")} aria-hidden="true">
                <use href={"#" + id("fig")} transform={"translate(0 " + r2(FLOOR * (1 + REFLECT)) + ") scale(1 " + -REFLECT + ")"} opacity={0.6} />
              </g>
            ) : null}

            <g
              className="rcc-hit"
              role="button"
              tabIndex={0}
              aria-label={"Poke " + name}
              onClick={poke}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  poke()
                }
              }}
            >
              <circle cx={CX} cy={CY + 40} r={170} fill="transparent" />
              <g id={id("fig")} className="rcc-fig">
                {/* legs, behind everything */}
                <path ref={bind("legLo")} fill="none" strokeWidth={9} strokeLinecap="round" style={inkStroke} />
                <path ref={bind("legL")} fill="none" strokeWidth={4.4} strokeLinecap="round" style={{ stroke: "var(--rcc-leg)" }} />
                <path ref={bind("legRo")} fill="none" strokeWidth={9} strokeLinecap="round" style={inkStroke} />
                <path ref={bind("legR")} fill="none" strokeWidth={4.4} strokeLinecap="round" style={{ stroke: "var(--rcc-leg)" }} />
                <g ref={bind("shoes")}>
                  {([[CX - 18, 1], [CX + 18, -1]] as const).map(([x, m]) => (
                    <g key={x} transform={"translate(" + x + " 398) scale(" + m + " 1)"}>
                      <path
                        d="M5 -9 C3 -14 -6 -15 -13 -11 C-25 -6 -32 1 -30 7 C-28 12 -17 12 0 12 L9 12 C15 12 16 5 13 0 Z"
                        style={{ fill: "var(--rcc-shoe)", stroke: "var(--rcc-ink)" }}
                        strokeWidth={3.4}
                        strokeLinejoin="round"
                      />
                      <path d="M-29 8 Q-12 12 12 9" fill="none" strokeWidth={2} style={inkStroke} />
                      <ellipse cx={-17} cy={-3} rx={5} ry={2.4} fill="#fff" opacity={0.5} />
                    </g>
                  ))}
                </g>

                <g ref={bind("body")}>
                  {/* arms: an ink hose with a coloured core, starting behind the dial */}
                  <path ref={bind("armLo")} fill="none" strokeWidth={15} strokeLinecap="round" style={inkStroke} />
                  <path ref={bind("armL")} fill="none" strokeWidth={9} strokeLinecap="round" style={{ stroke: "var(--rcc-limb)" }} />
                  <path ref={bind("armRo")} fill="none" strokeWidth={15} strokeLinecap="round" style={inkStroke} />
                  <path ref={bind("armR")} fill="none" strokeWidth={9} strokeLinecap="round" style={{ stroke: "var(--rcc-limb)" }} />

                  {/* the dial: a disc with a visible edge, like a real clock face */}
                  <circle cx={CX + 8} cy={CY + 4} r={108} strokeWidth={5} style={{ fill: "color-mix(in srgb, var(--rcc-face) 68%, #000)", stroke: "var(--rcc-ink)" }} />
                  <circle ref={bind("face")} cx={CX} cy={CY} r={108} fill={u("face")} strokeWidth={5} style={inkStroke} />
                  <circle cx={CX} cy={CY} r={101} fill="none" strokeWidth={1.6} opacity={0.35} style={inkStroke} />
                  {Array.from({ length: 12 }, (_, i) => {
                    const a = (i * Math.PI) / 6
                    const major = i % 3 === 0
                    const r1 = major ? 80 : 89
                    return (
                      <line
                        key={i}
                        className="rcc-tick"
                        x1={r2(CX + Math.sin(a) * r1)}
                        y1={r2(CY - Math.cos(a) * r1)}
                        x2={r2(CX + Math.sin(a) * 99)}
                        y2={r2(CY - Math.cos(a) * 99)}
                        strokeWidth={major ? 7 : 3.2}
                        strokeLinecap="round"
                        style={{ animationDelay: (i * 0.1).toFixed(1) + "s" }}
                      />
                    )
                  })}

                  <g ref={bind("blush")} opacity={0.35}>
                    <ellipse cx={138} cy={214} rx={15} ry={8} style={{ fill: "var(--rcc-blush)" }} opacity={0.55} />
                    <ellipse cx={262} cy={214} rx={15} ry={8} style={{ fill: "var(--rcc-blush)" }} opacity={0.55} />
                  </g>

                  {eye("L", EYE_L)}
                  {eye("R", EYE_R)}
                  <path ref={bind("browL")} d="M-12 3 Q0 -5 12 3" fill="none" strokeWidth={3.6} strokeLinecap="round" style={inkStroke} />
                  <path ref={bind("browR")} d="M-12 3 Q0 -5 12 3" fill="none" strokeWidth={3.6} strokeLinecap="round" style={inkStroke} />

                  {/* the nose is the pivot the hands would turn on */}
                  <circle cx={CX} cy={198} r={5.5} style={{ fill: "var(--rcc-ink)" }} />

                  <path ref={bind("mouthFill")} d={mouthPath(24, 7, 0, 0)} style={{ fill: "var(--rcc-mouth)" }} />
                  <g clipPath={u("mouth")}>
                    <rect ref={bind("teeth")} x={176} y={228} width={48} height={0} fill="#fff" />
                    <ellipse ref={bind("tongue")} cx={CX} cy={240} rx={12} ry={0} fill="#e0523f" />
                  </g>
                  <path ref={bind("mouthLine")} d={mouthPath(24, 7, 0, 0)} fill="none" strokeWidth={4} strokeLinejoin="round" strokeLinecap="round" style={inkStroke} />

                  <g ref={bind("gloveL")} className="rcc-glove" data-shape="open" strokeLinejoin="round">
                    {gloveShapes}
                  </g>
                  <g ref={bind("gloveR")} className="rcc-glove" data-shape="open" strokeLinejoin="round">
                    {gloveShapes}
                  </g>
                </g>
              </g>
              <circle className="rcc-focus" cx={CX} cy={CY} r={124} fill="none" strokeWidth={3} strokeDasharray="6 8" style={{ stroke: "var(--rcc-accent)" }} />
            </g>

            <g className="rcc-fx" key={fxKey} aria-hidden="true">
              {fx}
            </g>
          </svg>

          {quipText ? (
            <div className="rcc-quip" key={quip?.key} aria-hidden="true">
              {quipText}
            </div>
          ) : null}
          {!poked ? <span className="rcc-hint" aria-hidden="true">psst — poke me</span> : null}
        </div>

        {/* ----------------------------------------------------------- chat */}
        <section className="rcc-panel" aria-label={"Chat with " + name}>
          <header className="rcc-head">
            <div className="rcc-id">
              <Mini />
              <div className="rcc-idtext">
                <strong className="rcc-name">{name}</strong>
                <span className="rcc-status">
                  <i className="rcc-dot" data-s={dotState} />
                  {status}
                </span>
              </div>
            </div>
            <div className="rcc-meta">
              {timer ? (
                <span className="rcc-pill rcc-timer" title="Timer">
                  {Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, "0")}
                </span>
              ) : null}
              <span className="rcc-pill rcc-clock">{now ? formatTime(now) : "--:--"}</span>
              {support.speech ? (
                <button type="button" className="rcc-icon" aria-pressed={voiceOn} aria-label={voiceOn ? "Mute her voice" : "Let her speak aloud"} onClick={toggleVoice}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 9v6h4l5 4V5L8 9H4Z" />
                    {voiceOn ? <path d="M16.5 9a4 4 0 0 1 0 6M19 6.5a7.5 7.5 0 0 1 0 11" /> : <path d="M17 9.5l5 5M22 9.5l-5 5" />}
                  </svg>
                </button>
              ) : null}
            </div>
          </header>

          <div className="rcc-log" ref={logRef}>
            {messages.map((m) => {
              const shown = typing && typing.id === m.id ? m.text.slice(0, typing.n) : m.text
              return (
                <div key={m.id} className="rcc-msg" data-role={m.role}>
                  {m.role === "bot" ? <Mini /> : null}
                  <p className="rcc-bubble">
                    {shown}
                    {typing && typing.id === m.id ? <span className="rcc-caret" /> : null}
                  </p>
                </div>
              )
            })}
            {busy ? (
              <div className="rcc-msg" data-role="bot">
                <Mini />
                <p className="rcc-bubble rcc-dots" aria-label={name + " is thinking"}>
                  <i />
                  <i />
                  <i />
                </p>
              </div>
            ) : null}
          </div>
          <div className="rcc-sr" role="status" aria-live="polite">
            {srText}
          </div>

          {chips.length ? (
            <div className="rcc-chips">
              {chips.map((c) => (
                <button key={c} type="button" className="rcc-chip" disabled={busy} onClick={() => send(c)}>
                  {c}
                </button>
              ))}
            </div>
          ) : null}

          <form
            className="rcc-form"
            onSubmit={(e) => {
              e.preventDefault()
              send(input)
            }}
          >
            {support.mic ? (
              <button
                type="button"
                className="rcc-icon rcc-mic"
                data-on={listening || undefined}
                aria-pressed={listening}
                aria-label={listening ? "Stop listening" : "Speak to " + name}
                onClick={toggleMic}
                disabled={busy}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="3" width="6" height="11" rx="3" />
                  <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
                </svg>
              </button>
            ) : null}
            <input
              ref={inputRef}
              className="rcc-input"
              value={input}
              placeholder={placeholder ?? "Ask " + name.split(" ")[0] + " anything…"}
              aria-label={"Message " + name}
              autoComplete="off"
              onChange={(e) => {
                const v = e.target.value
                setInput(v)
                activity()
                wake()
                if (busyRef.current || typingRef.current) return
                if (v && moodRef.current !== "listen") setMood("listen")
                else if (!v && moodRef.current === "listen") setMood("idle")
              }}
              onFocus={() => {
                focusRef.current = true
              }}
              onBlur={() => {
                focusRef.current = false
                if (moodRef.current === "listen" && !listeningRef.current) setMood("idle")
              }}
            />
            <button type="submit" className="rcc-icon rcc-send" aria-label="Send" disabled={busy || !input.trim()}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h13M12 5l7 7-7 7" />
              </svg>
            </button>
          </form>
        </section>
      </div>
    </div>
  )
}

/** The little face in the header and beside her messages. */
function Mini() {
  return (
    <svg className="rcc-mini" viewBox="0 0 40 40" aria-hidden="true">
      <circle cx={20} cy={20} r={17} strokeWidth={2.4} style={{ fill: "var(--rcc-face)", stroke: "var(--rcc-ink)" }} />
      <path d="M20 5v4M35 20h-4M20 35v-4M5 20h4" strokeWidth={2.2} strokeLinecap="round" style={{ stroke: "var(--rcc-ink)" }} />
      <ellipse cx={15.5} cy={17.5} rx={3.4} ry={4.8} fill="#fff" strokeWidth={1.3} style={{ stroke: "var(--rcc-ink)" }} />
      <ellipse cx={24.5} cy={17.5} rx={3.4} ry={4.8} fill="#fff" strokeWidth={1.3} style={{ stroke: "var(--rcc-ink)" }} />
      <circle cx={16.4} cy={18.6} r={1.9} style={{ fill: "var(--rcc-ink)" }} />
      <circle cx={25.4} cy={18.6} r={1.9} style={{ fill: "var(--rcc-ink)" }} />
      <path d="M14 25.5 Q20 30.5 26 25.5" fill="none" strokeWidth={1.9} strokeLinecap="round" style={{ stroke: "var(--rcc-ink)" }} />
    </svg>
  )
}

/* ------------------------------------------------------------------- css
   Every selector is scoped under .rcc-. The root is a size container, so
   the layout follows the box it is given rather than the viewport. */

const CSS = `
.rcc-root{position:relative;display:block;width:100%;overflow:hidden;container:rcc / size;background:var(--rcc-bg);color:var(--rcc-text);font-family:var(--rcc-sans);-webkit-font-smoothing:antialiased;isolation:isolate;line-height:1.4}
.rcc-root *,.rcc-root *::before,.rcc-root *::after{box-sizing:border-box}
.rcc-shell{position:absolute;inset:0;display:grid;grid-template-columns:minmax(0,1fr);grid-template-rows:minmax(0,0.92fr) minmax(0,1.08fr)}
.rcc-stage{position:relative;min-width:0;min-height:0;overflow:hidden}
.rcc-stage[data-holo]::after{content:"";position:absolute;inset:0;pointer-events:none;background:repeating-linear-gradient(180deg,rgba(255,255,255,0.035) 0 1px,transparent 1px 4px);mix-blend-mode:screen;animation:rcc-scan 6s linear infinite}
.rcc-svg{position:absolute;left:0;right:0;bottom:0;top:34px;display:block;width:100%;height:calc(100% - 34px);max-width:none;overflow:visible}
.rcc-emblem{position:absolute;top:14px;left:16px;z-index:2;display:flex;align-items:center;gap:10px;pointer-events:none}
.rcc-mark{display:grid;place-items:center;min-width:38px;height:34px;padding:0 8px;border-radius:6px;background:var(--rcc-accent);color:var(--rcc-accent-ink);font-family:var(--rcc-display);font-weight:900;font-size:17px;letter-spacing:-0.04em;transform:skewX(-9deg)}
.rcc-org{max-width:16ch;font-size:10.5px;font-weight:700;letter-spacing:0.14em;line-height:1.2;text-transform:uppercase;color:var(--rcc-muted)}
.rcc-motto{display:none;position:absolute;left:0;right:0;top:9%;z-index:1;margin:0;padding:0 24px;text-align:center;font-family:var(--rcc-display);font-weight:800;font-size:clamp(22px,3.3cqw,44px);line-height:1.04;letter-spacing:-0.01em;color:var(--rcc-text);pointer-events:none}
.rcc-motto span{display:block}
.rcc-hint{position:absolute;left:50%;bottom:10px;z-index:2;transform:translateX(-50%);font-size:10.5px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;white-space:nowrap;color:var(--rcc-muted);pointer-events:none;animation:rcc-hint 2.4s ease-in-out infinite}
.rcc-quip{position:absolute;left:56%;top:10%;z-index:3;max-width:min(60%,280px);padding:10px 14px;border-radius:18px 18px 18px 4px;background:var(--rcc-face);color:var(--rcc-bubble-ink);font-weight:700;font-size:14px;line-height:1.3;box-shadow:0 10px 30px rgba(0,0,0,0.28);pointer-events:none;animation:rcc-quip 2.8s ease both}
.rcc-panel{position:relative;z-index:1;display:flex;flex-direction:column;min-width:0;min-height:0;margin:0 12px 12px;overflow:hidden;border:1.5px solid var(--rcc-line);border-radius:22px;background:var(--rcc-panel);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px)}
.rcc-head{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px 14px;border-bottom:1.5px solid var(--rcc-line)}
.rcc-id{display:flex;align-items:center;gap:10px;min-width:0}
.rcc-idtext{display:flex;flex-direction:column;min-width:0}
.rcc-mini{flex:none;width:30px;height:30px;overflow:visible}
.rcc-name{overflow:hidden;font-family:var(--rcc-display);font-size:18px;font-weight:800;line-height:1.1;white-space:nowrap;text-overflow:ellipsis}
.rcc-status{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--rcc-muted)}
.rcc-dot{flex:none;width:7px;height:7px;border-radius:50%;background:#3ccf6e;box-shadow:0 0 0 3px rgba(60,207,110,0.18)}
.rcc-dot[data-s=busy]{background:var(--rcc-accent);box-shadow:0 0 0 3px var(--rcc-ring);animation:rcc-pulse 0.9s ease-in-out infinite}
.rcc-dot[data-s=listen]{background:#ff4d3d;box-shadow:0 0 0 3px rgba(255,77,61,0.25);animation:rcc-pulse 0.9s ease-in-out infinite}
.rcc-dot[data-s=sleep]{background:var(--rcc-muted);box-shadow:none}
.rcc-meta{display:flex;flex:none;align-items:center;gap:6px}
.rcc-pill{padding:5px 9px;border:1.5px solid var(--rcc-line);border-radius:999px;font-size:12.5px;font-weight:800;font-variant-numeric:tabular-nums;white-space:nowrap}
.rcc-timer{border-color:transparent;background:var(--rcc-accent);color:var(--rcc-accent-ink)}
.rcc-icon{display:grid;flex:none;place-items:center;width:34px;height:34px;padding:0;border:1.5px solid var(--rcc-line);border-radius:50%;background:transparent;color:inherit;cursor:pointer;transition:background-color 0.2s,transform 0.15s}
.rcc-icon:hover{background:var(--rcc-hover)}
.rcc-icon:active{transform:scale(0.92)}
.rcc-icon[aria-pressed=true]{border-color:transparent;background:var(--rcc-accent);color:var(--rcc-accent-ink)}
.rcc-icon:disabled{opacity:0.35;cursor:not-allowed}
.rcc-icon svg{width:16px;height:16px}
.rcc-log{display:flex;flex:1;flex-direction:column;gap:10px;min-height:0;padding:14px;overflow-y:auto;overscroll-behavior:contain;scrollbar-width:thin}
.rcc-msg{display:flex;align-items:flex-end;gap:8px;max-width:90%;animation:rcc-in 0.35s cubic-bezier(0.2,0.9,0.3,1.25) both}
.rcc-msg .rcc-mini{width:26px;height:26px}
.rcc-msg[data-role=user]{flex-direction:row-reverse;align-self:flex-end}
.rcc-bubble{margin:0;padding:9px 13px;border-radius:18px 18px 18px 5px;background:var(--rcc-face);color:var(--rcc-bubble-ink);font-size:14.5px;line-height:1.45;white-space:pre-wrap;overflow-wrap:anywhere}
.rcc-msg[data-role=user] .rcc-bubble{border:1.5px solid var(--rcc-line);border-radius:18px 18px 5px 18px;background:var(--rcc-field);color:var(--rcc-text)}
.rcc-caret{display:inline-block;width:2px;height:1em;margin-left:2px;vertical-align:-2px;background:currentColor;animation:rcc-caret 0.8s steps(1) infinite}
.rcc-dots{display:inline-flex;gap:4px;padding:13px 14px}
.rcc-dots i{width:6px;height:6px;border-radius:50%;background:currentColor;animation:rcc-bounce 1s ease-in-out infinite}
.rcc-dots i:nth-child(2){animation-delay:0.15s}
.rcc-dots i:nth-child(3){animation-delay:0.3s}
.rcc-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
.rcc-chips{display:flex;gap:6px;padding:0 14px 10px;overflow-x:auto;scrollbar-width:none}
.rcc-chip{flex:none;padding:6px 11px;border:1.5px dashed var(--rcc-line);border-radius:999px;background:transparent;color:var(--rcc-text);font:inherit;font-size:12.5px;cursor:pointer;transition:background-color 0.2s}
.rcc-chip:hover{border-style:solid;background:var(--rcc-hover)}
.rcc-chip:disabled{opacity:0.45;cursor:not-allowed}
.rcc-form{display:flex;align-items:center;gap:8px;padding:10px 12px 12px;border-top:1.5px solid var(--rcc-line)}
.rcc-input{flex:1;min-width:0;height:42px;padding:0 16px;border:1.5px solid var(--rcc-line);border-radius:999px;outline:none;background:var(--rcc-field);color:var(--rcc-text);font:inherit;font-size:14.5px}
.rcc-input::placeholder{color:var(--rcc-muted)}
.rcc-input:focus{border-color:var(--rcc-accent);box-shadow:0 0 0 3px var(--rcc-ring)}
.rcc-send{width:42px;height:42px;border-color:transparent;background:var(--rcc-accent);color:var(--rcc-accent-ink)}
.rcc-send:hover{background:var(--rcc-accent)}
.rcc-mic[data-on]{border-color:transparent;background:#ff4d3d;color:#fff;animation:rcc-pulse 0.9s ease-in-out infinite}
.rcc-root button:focus-visible{outline:2px solid var(--rcc-accent);outline-offset:2px}
.rcc-hit{cursor:pointer;outline:none}
.rcc-focus{opacity:0;transition:opacity 0.2s}
.rcc-hit:focus-visible .rcc-focus{opacity:1}
.rcc-fig{transform-box:view-box;transform-origin:200px 300px}
.rcc-glowstop{stop-color:var(--rcc-glow-now,var(--rcc-glow))}
.rcc-halo{opacity:var(--rcc-glow-a)}
.rcc-tick{stroke:var(--rcc-ink)}
.rcc-glove>[data-g]{display:none}
.rcc-glove[data-shape=open]>[data-g=open],.rcc-glove[data-shape=point]>[data-g=point],.rcc-glove[data-shape=fist]>[data-g=fist]{display:inline}
.rcc-fx g{transform-box:fill-box;transform-origin:center}
.rcc-pop{animation:rcc-pop 1s cubic-bezier(0.2,1.4,0.4,1) both}
.rcc-float{animation:rcc-float 2.2s ease-out both}
.rcc-zz{animation:rcc-float 3s ease-out infinite}
.rcc-stage[data-holo] .rcc-fig{animation:rcc-flicker 8s steps(1) infinite}
.rcc-root[data-mood=think] .rcc-tick{animation:rcc-tick 1.2s linear infinite}
.rcc-root[data-busy] .rcc-tick{animation:rcc-tick 1.2s linear infinite}
.rcc-root[data-mood=stern]{--rcc-glow-now:#ff2d20}
.rcc-root[data-mood=stern] .rcc-halo{opacity:0.7;animation:rcc-throb 0.9s ease-in-out infinite}
.rcc-root[data-boop] .rcc-fig{animation:rcc-boop 0.45s cubic-bezier(0.3,1.6,0.5,1)}
.rcc-root[data-ring] .rcc-fig{animation:rcc-ringing 0.13s linear 12}
.rcc-root[data-glitch] .rcc-fig{animation:rcc-glitch 0.55s steps(2) 2}
@container rcc (min-width: 760px){
.rcc-shell{grid-template-columns:minmax(0,1.08fr) minmax(340px,0.92fr);grid-template-rows:minmax(0,1fr)}
.rcc-panel{margin:18px 18px 18px 0}
.rcc-motto{display:block}
.rcc-svg{top:24%;height:76%}
.rcc-emblem{top:20px;left:22px}
.rcc-quip{left:58%;top:26%}
}
@container rcc (max-height: 620px) and (min-width: 760px){
.rcc-motto{display:none}
.rcc-svg{top:40px;height:calc(100% - 40px)}
.rcc-quip{top:10%}
}
@keyframes rcc-tick{0%{stroke:var(--rcc-lit)}30%,100%{stroke:var(--rcc-ink)}}
@keyframes rcc-glitch{0%{transform:translate(-6px,2px) skewX(7deg);filter:drop-shadow(5px 0 0 #ff2d20) drop-shadow(-5px 0 0 #2de1ff)}50%{transform:translate(5px,-3px) skewX(-5deg);filter:drop-shadow(-4px 0 0 #ff2d20)}100%{transform:none;filter:none}}
@keyframes rcc-ringing{0%,100%{transform:rotate(0deg)}25%{transform:rotate(-4deg)}75%{transform:rotate(4deg)}}
@keyframes rcc-boop{0%{transform:scale(1,1)}30%{transform:scale(1.07,0.9)}60%{transform:scale(0.96,1.05)}100%{transform:scale(1,1)}}
@keyframes rcc-flicker{0%,100%{opacity:1}46%{opacity:0.82}47%{opacity:1}82%{opacity:0.9}83%{opacity:1}}
@keyframes rcc-throb{50%{opacity:0.35}}
@keyframes rcc-pop{0%{opacity:0;transform:scale(0) rotate(-40deg)}40%{opacity:1;transform:scale(1.25) rotate(0deg)}100%{opacity:0;transform:scale(0.7) translateY(-16px)}}
@keyframes rcc-float{0%{opacity:0;transform:translate(0,0) scale(0.6)}20%{opacity:1}100%{opacity:0;transform:translate(12px,-50px) scale(1.1)}}
@keyframes rcc-quip{0%{opacity:0;transform:translateY(10px) scale(0.9)}10%,86%{opacity:1;transform:none}100%{opacity:0;transform:translateY(-6px)}}
@keyframes rcc-in{from{opacity:0;transform:translateY(8px) scale(0.97)}to{opacity:1;transform:none}}
@keyframes rcc-caret{50%{opacity:0}}
@keyframes rcc-bounce{0%,60%,100%{transform:translateY(0);opacity:0.4}30%{transform:translateY(-4px);opacity:1}}
@keyframes rcc-pulse{50%{box-shadow:0 0 0 6px transparent}}
@keyframes rcc-hint{50%{opacity:0.45}}
@keyframes rcc-scan{to{background-position:0 40px}}
@media (prefers-reduced-motion: reduce){
.rcc-root *,.rcc-root *::before,.rcc-root *::after{animation:none !important;transition:none !important}
}
`
