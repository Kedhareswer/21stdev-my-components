"use client"

// Mallow Support Template: a complete landing page for an AI support copilot,
// in one file. The page is painted: every picture on it is a windswept meadow
// (a soft sky, grass leaning in the wind, daisies) painted on canvas from a
// seed, brush stroke by brush stroke, in the palette you choose. The grass
// keeps moving, and you can brush it with the pointer.
//
// The product sits in those paintings as working UI. In the hero, the inbox
// runs on autopilot: tickets arrive, Mallow reads, drafts and resolves them or
// hands them to a person. Below it: three ways it works, a scroll-told
// feature story (smarter metrics, a brand voice you can switch, the overnight
// queue), a tabbed platform tour, security, pricing with a volume slider,
// customer stories, a wall of quotes, questions, a sign-up band and a footer.
//
// Nothing loads at runtime except the optional fonts and the story photos,
// which are props and fall back to a painting if they can't load.
import * as React from "react"

export type MspScene =
  | "hero"
  | "resolve"
  | "learn"
  | "escalate"
  | "smarter"
  | "voice"
  | "overnight"
  | "platform"
  | "pricing"
  | "story"
  | "cta"

/** The colours a painting is made from. All hex: the painter blends them. */
export type MspPaint = {
  /** Three sky stops: light, mid, deep. */
  sky: string[]
  cloud: string
  /** Four grass tones, from shadow to sunlit tip. */
  grass: string[]
  petal: string
  /** The shadow side of a petal. */
  shade: string
  /** The flower's eye: deep, light. */
  eye: string[]
  /** The warm smear of late light in the grass. */
  warm: string
}

export type MspTokens = {
  paper: string
  soft: string
  card: string
  ink: string
  muted: string
  rule: string
  button: string
  buttonInk: string
  good: string
  warn: string
  hand: string
  paint: MspPaint
}

/** Any subset of a palette's tokens, for light and dark. */
export type MspPaletteInput = {
  light?: { [k: string]: unknown }
  dark?: { [k: string]: unknown }
}

export type MspLink = { label: string; href?: string; text?: string }
export type MspNavItem = { label: string; href?: string; items?: MspLink[] }

export type MspTicket = {
  name: string
  subject: string
  message: string
  reply: string
  channel?: "email" | "chat" | "whatsapp"
  /** Escalated tickets go to this person instead of being resolved. */
  handTo?: string
  /** Seconds Mallow took. */
  took?: number
}

export type MspWay = { title: string; text: string; kind: "resolve" | "learn" | "escalate"; image?: string }

export type MspFeature = { title: string; text: string; kind: "smarter" | "voice" | "overnight"; image?: string }

export type MspPlatformTab = {
  label: string
  kind: "triage" | "resolve" | "routing" | "reporting"
  title: string
  points: { title: string; text: string }[]
}

export type MspTier = {
  name: string
  text: string
  /** Monthly price for `included` tickets; null shows Custom. */
  price: number | null
  included?: number
  /** Price for every extra 1,000 tickets a month. */
  per1000?: number
  features: string[]
  button?: string
  featured?: boolean
}

export type MspStory = {
  quote: string
  /** How many leading words of the quote are set in ink; the rest is muted. */
  lead?: number
  name: string
  role: string
  company: string
  image?: string
  alt?: string
  stats: { value: number; label: string; prefix?: string; suffix?: string; decimals?: number }[]
}

export type MspQuote = { quote: string; name: string; role: string; company: string }

export type MspFaq = { q: string; a: string }

export type MspProps = {
  brand?: string
  logo?: React.ReactNode
  /** "meadow", "lavender", "harvest", or your own tokens laid over meadow. */
  palette?: "meadow" | "lavender" | "harvest" | MspPaletteInput
  theme?: "system" | "light" | "dark"
  /** A stylesheet for the faces (Newsreader and Inter by default); null uses the system stack. */
  fontHref?: string | null
  /** Seed shift for every painting: each value paints a different meadow. */
  seed?: number
  /** Photos in place of paintings, by scene. */
  images?: { [scene: string]: string }
  nav?: { items?: MspNavItem[]; login?: MspLink | null; cta?: string } | null
  hero?: {
    badge?: string
    badgeLabel?: string
    title?: string
    text?: string
    primary?: string
    secondary?: string
    note?: string
    workspace?: string
    agent?: string
    tickets?: MspTicket[]
  } | null
  logos?: string[] | null
  ways?: { eyebrow?: string; title?: string; items?: MspWay[] } | null
  features?: { eyebrow?: string; title?: string; items?: MspFeature[]; button?: string } | null
  platform?: { eyebrow?: string; title?: string; tabs?: MspPlatformTab[]; button?: string } | null
  security?: { eyebrow?: string; title?: string; text?: string; items?: { title: string; text: string; icon?: "shield" | "lock" | "key" | "eye" }[] } | null
  pricing?: { eyebrow?: string; title?: string; tiers?: MspTier[]; yearlyDiscount?: number; trust?: string } | null
  stories?: { eyebrow?: string; title?: string; items?: MspStory[] } | null
  testimonials?: { eyebrow?: string; title?: string; items?: MspQuote[] } | null
  faq?: { eyebrow?: string; title?: string; items?: MspFaq[] } | null
  cta?: { title?: string; text?: string; button?: string; placeholder?: string; morning?: string } | null
  footer?: { tagline?: string; columns?: { title: string; links: MspLink[] }[]; legal?: string; status?: string } | null
  /** Called with the email from the sign-up band, or with nothing from any other Start button. Return false (or throw) to show an error. */
  onGetStarted?: MspGetStarted
  onContactSales?: () => void
  /** Minimum height of the hero. */
  height?: string
  className?: string
}

/* ---------- palettes ---------- */

const MEADOW = {
  light: {
    paper: "#f8f7f3",
    soft: "#efeee8",
    card: "#ffffff",
    ink: "#1b1c19",
    muted: "#62645d",
    rule: "rgba(27,28,25,.1)",
    button: "#1b1c19",
    buttonInk: "#fbfbf8",
    good: "#2f7d55",
    warn: "#b4691d",
    hand: "#5a55b8",
    paint: {
      sky: ["#e1eef1", "#a9d0e2", "#5e9fc0"],
      cloud: "#f6f7ef",
      grass: ["#1c5446", "#3a8459", "#87b96d", "#dae6a8"],
      petal: "#fcfcf6",
      shade: "#a6c0d2",
      eye: ["#e58c22", "#ffd76a"],
      warm: "#f3a568",
    },
  },
  dark: {
    paper: "#0f110f",
    soft: "#161916",
    card: "#1c201c",
    ink: "#eeefe8",
    muted: "#a2a59b",
    rule: "rgba(238,239,232,.1)",
    button: "#eeefe8",
    buttonInk: "#121411",
    good: "#74c795",
    warn: "#e3a35b",
    hand: "#a9a4ff",
    paint: {
      sky: ["#46557d", "#283a61", "#111a33"],
      cloud: "#8089ab",
      grass: ["#0b231f", "#1a463b", "#3c7559", "#93b28a"],
      petal: "#e7ebf3",
      shade: "#6c7c9f",
      eye: ["#c97f2c", "#f1c25f"],
      warm: "#e9875a",
    },
  },
} as { light: MspTokens; dark: MspTokens }

const LAVENDER = {
  light: {
    ...MEADOW.light,
    paper: "#f8f6f7",
    soft: "#efebef",
    ink: "#1d1a22",
    muted: "#66606e",
    rule: "rgba(29,26,34,.1)",
    button: "#2a2236",
    good: "#43815f",
    hand: "#7b4fb8",
    paint: {
      sky: ["#efe8f3", "#cbbde3", "#8a83c2"],
      cloud: "#faf5f6",
      grass: ["#33493d", "#5c7a5a", "#9fb489", "#e4e4bb"],
      petal: "#f3ebfc",
      shade: "#ab9ccc",
      eye: ["#d9893a", "#f7cf76"],
      warm: "#eaa0b6",
    },
  },
  dark: {
    ...MEADOW.dark,
    paper: "#111013",
    soft: "#18161b",
    card: "#1e1c22",
    ink: "#efecf2",
    muted: "#a7a1ae",
    hand: "#c4a6ff",
    paint: {
      sky: ["#5b4f7f", "#352c5c", "#151030"],
      cloud: "#9488b4",
      grass: ["#14201b", "#2b4234", "#5a7356", "#a6b38c"],
      petal: "#ebe2f7",
      shade: "#7d70a3",
      eye: ["#c98236", "#efc271"],
      warm: "#d98aa6",
    },
  },
} as { light: MspTokens; dark: MspTokens }

const HARVEST = {
  light: {
    ...MEADOW.light,
    paper: "#f9f6f0",
    soft: "#f0ebe1",
    ink: "#1f1b15",
    muted: "#6a6255",
    rule: "rgba(31,27,21,.1)",
    button: "#2a2117",
    good: "#4f7d3a",
    hand: "#b0522e",
    paint: {
      sky: ["#f6ecd9", "#e9cfa8", "#c1906a"],
      cloud: "#fbf6ec",
      grass: ["#4b4a24", "#8a7b37", "#c9ad5c", "#f1e3a6"],
      petal: "#fffaf0",
      shade: "#d6bf9e",
      eye: ["#d3711c", "#ffc957"],
      warm: "#ef8a4c",
    },
  },
  dark: {
    ...MEADOW.dark,
    paper: "#12100c",
    soft: "#1a1712",
    card: "#211d17",
    ink: "#f1ece2",
    muted: "#aaa192",
    hand: "#f0a27c",
    paint: {
      sky: ["#7a5a4f", "#46304a", "#1b1428"],
      cloud: "#b08a7c",
      grass: ["#1d1a0e", "#43391b", "#7f6a35", "#c8b06c"],
      petal: "#f6eee0",
      shade: "#9c8577",
      eye: ["#c96a24", "#f2b850"],
      warm: "#f08a4e",
    },
  },
} as { light: MspTokens; dark: MspTokens }

const PALETTES = { meadow: MEADOW, lavender: LAVENDER, harvest: HARVEST } as { [k: string]: { light: MspTokens; dark: MspTokens } }

/* ---------- default content ---------- */

const NAV = [
  {
    label: "Product",
    items: [
      { label: "Autopilot", href: "#ways", text: "Resolves routine tickets around the clock" },
      { label: "Brand voice", href: "#features", text: "Replies that sound like your team" },
      { label: "Smart routing", href: "#platform", text: "The right person, with the whole story" },
      { label: "Reporting", href: "#platform", text: "What customers ask, and what it saved" },
    ],
  },
  { label: "Security", href: "#security" },
  { label: "Customers", href: "#stories" },
  { label: "Pricing", href: "#pricing" },
] as MspNavItem[]

const TICKETS = [
  { name: "Maya Okafor", subject: "Where is order #4471?", channel: "email", took: 4, message: "Hi! I ordered the oak serving board last Tuesday and the tracking hasn't moved since Friday. Is it lost?", reply: "Hi Maya, it isn't lost. Your board left our Leeds warehouse on Friday and is with the courier for the last leg. It should reach you tomorrow before 6pm. Here's the live tracking link." },
  { name: "Tom Becker", subject: "Change my delivery address", channel: "chat", took: 6, message: "Can I still send order #4502 to my office instead? I won't be home Thursday.", reply: "Done, Tom. Order #4502 now goes to 14 Albion Street, and the Thursday slot stays the same. You'll get a new confirmation email in a minute." },
  { name: "Lena Fischer", subject: "Vase arrived cracked", channel: "email", handTo: "Priya", message: "The large stoneware vase came in two pieces. It was a gift and I'm really disappointed.", reply: "I'm so sorry, Lena. I've passed this to Priya on our team with your photos and order details, so she can arrange a replacement before the weekend." },
  { name: "Arjun Mehta", subject: "Discount code not working", channel: "chat", took: 3, message: "WELCOME15 says it's invalid at checkout?", reply: "Hi Arjun, WELCOME15 works on full-price items only, and the linen throw in your basket is already reduced. I've added 15% to your account for your next order instead." },
  { name: "Sofia Rossi", subject: "Do you ship to Norway?", channel: "whatsapp", took: 2, message: "Hello, do you deliver to Bergen and are there customs fees?", reply: "Ciao Sofia! Yes, we deliver to Bergen in 4 to 6 working days. Duties are paid at checkout, so there's nothing extra to pay at the door." },
  { name: "Owen Price", subject: "VAT invoice for my company", channel: "email", took: 5, message: "Could I get a VAT invoice for order #4433 made out to Price & Daughters Ltd?", reply: "Of course, Owen. Your VAT invoice for #4433, made out to Price & Daughters Ltd, is attached and also saved in your account under Orders." },
  { name: "Chloé Martin", subject: "Wrong colour delivered", channel: "chat", handTo: "Sam", message: "I ordered the sage throw and got the rust one. I need it for Saturday.", reply: "That's on us, Chloé. Sam from our team is arranging a next-day swap so the sage throw reaches you by Friday. A courier will collect the rust one." },
  { name: "Hana Sato", subject: "Size guide for linen sheets", channel: "email", took: 3, message: "Will the king fitted sheet fit a 35cm deep mattress?", reply: "It will, Hana. Our king fitted sheet has 40cm pockets, so a 35cm mattress fits with room to tuck. They're pre-washed, so they won't shrink." },
  { name: "Ravi Nair", subject: "Gift wrapping?", channel: "whatsapp", took: 2, message: "Can you gift wrap and leave out the receipt?", reply: "We can, Ravi. Tick gift wrap at checkout and add a note. The receipt is emailed to you, never packed in the box." },
  { name: "Daniel Kim", subject: "Pause my candle subscription", channel: "email", took: 4, message: "I'm away in August. Can I skip a month without cancelling?", reply: "Easy, Daniel. I've skipped your August box. Your next candle ships on 3 September, and you can change that any time from your account." },
] as MspTicket[]

const LOGOS = ["Northwind", "Lumen Labs", "Arbor", "Fable & Co", "Vesta", "Driftwood", "Kiln", "Parcelry"]

const WAYS = [
  { kind: "resolve", title: "Resolves in seconds", text: "{brand} answers routine questions the moment they arrive, any hour of the day, in 40 languages." },
  { kind: "learn", title: "Learns from your docs", text: "Point it at your help center, macros and past tickets. No training sessions, no setup calls." },
  { kind: "escalate", title: "Knows when to hand off", text: "Refunds, upset customers and edge cases go to the right person, with a summary already written." },
] as MspWay[]

const FEATURES = [
  { kind: "smarter", title: "It gets smarter with every ticket it sees", text: "{brand} learns from every reply your team approves, so answers get sharper and more accurate each week. You see exactly what it learned." },
  { kind: "voice", title: "It always answers in your brand voice", text: "Trained on your help center and past replies, {brand} writes the way your customers already know you. Pick a tone and it holds it." },
  { kind: "overnight", title: "It clears your overnight queue for you", text: "While your team sleeps, {brand} resolves the routine tickets, so mornings start with a short list instead of a backlog." },
] as MspFeature[]

const PLATFORM = [
  {
    label: "Ticket triage",
    kind: "triage",
    title: "Every ticket, sorted the moment it lands.",
    points: [
      { title: "Instant categories", text: "Tags by topic, product and intent before anyone opens it." },
      { title: "Priority that makes sense", text: "Urgent means urgent: sentiment, order value and SLA, weighed together." },
      { title: "No manual sorting", text: "Views stay clean, so agents start on the right ticket." },
    ],
  },
  {
    label: "Auto-resolution",
    kind: "resolve",
    title: "Routine questions close themselves.",
    points: [
      { title: "Answers with sources", text: "Every reply cites the articles and orders it used." },
      { title: "Takes real actions", text: "Refund, reship, update an address: inside the limits you set." },
      { title: "Confident or quiet", text: "Below your confidence bar it drafts for a person instead." },
    ],
  },
  {
    label: "Smart routing",
    kind: "routing",
    title: "The right person, with the whole story.",
    points: [
      { title: "Skills and load", text: "Routes by language, product and who has room right now." },
      { title: "Summaries attached", text: "Agents read three lines, not thirty messages." },
      { title: "Fair by default", text: "Round robin that respects shifts and time off." },
    ],
  },
  {
    label: "Live reporting",
    kind: "reporting",
    title: "See what customers ask, and what it saved.",
    points: [
      { title: "Resolution rate", text: "Daily, by channel and by topic." },
      { title: "Gaps in your docs", text: "Questions it couldn't answer, ranked by volume." },
      { title: "Hours given back", text: "Time saved, in a number your CFO will read." },
    ],
  },
] as MspPlatformTab[]

const SECURITY = [
  { icon: "shield", title: "SOC 2 Type II and GDPR", text: "Audited every year, with a DPA and EU data residency on request." },
  { icon: "eye", title: "Your data stays yours", text: "Never used to train shared models. Delete anything, any time." },
  { icon: "lock", title: "Encrypted everywhere", text: "AES-256 at rest and TLS 1.3 in transit, with keys rotated daily." },
  { icon: "key", title: "Granular access", text: "SSO, SAML, roles and an audit log of every action it takes." },
] as { title: string; text: string; icon?: "shield" | "lock" | "key" | "eye" }[]

const TIERS = [
  { name: "Starter", text: "For small teams trying AI support for the first time.", price: 0, included: 100, features: ["100 AI resolutions a month", "One channel", "Help center sync", "Hand-off to your inbox", "Email support"], button: "Start free" },
  { name: "Growth", text: "For growing teams handling real volume every day.", price: 49, included: 2000, per1000: 18, features: ["2,000 AI resolutions a month", "Email, chat and WhatsApp", "Brand voice and tone controls", "Smart routing", "Reporting and insights"], button: "Start 14-day trial", featured: true },
  { name: "Enterprise", text: "For high-volume teams with security and scale needs.", price: null, features: ["Everything in Growth", "Unlimited resolutions", "SSO, SAML and audit log", "Custom actions and limits", "A named success manager"], button: "Talk to sales" },
] as MspTier[]

const STORY_PHOTO = "https://images.unsplash.com/photo-"

const STORIES = [
  {
    quote: "Before {brand}, we drowned in the same twenty questions and customers waited hours for answers. Now most questions resolve themselves, and my team finally works on the conversations that matter.",
    name: "Nadia Brooks",
    role: "Head of Support",
    company: "Fable & Co",
    image: STORY_PHOTO + "1758272420990-30a0735e68a1",
    alt: "Nadia, smiling at her phone on a city street",
    stats: [
      { value: 71, suffix: "%", label: "Tickets auto-resolved" },
      { value: 38, suffix: "%", label: "Lower support costs" },
      { value: 4.8, decimals: 1, suffix: "/5", label: "Average CSAT" },
    ],
  },
  {
    quote: "We launched in three new countries without hiring a single extra agent. {brand} answers in the customer's language, and our team reviews the tricky ones in English.",
    name: "Amara Osei",
    role: "VP Customer Experience",
    company: "Driftwood",
    image: STORY_PHOTO + "1768244016593-8ca75b15bc92",
    alt: "Amara, smiling with her phone in a crowd",
    stats: [
      { value: 3, label: "New markets, same team" },
      { value: 12, suffix: "s", label: "Median first reply" },
      { value: 92, suffix: "%", label: "Resolution rate" },
    ],
  },
  {
    quote: "Mondays used to start with four hundred tickets. Now they start with eleven, all of them the interesting ones. Nobody on the team wants to go back.",
    name: "Iris Calder",
    role: "Support Lead",
    company: "Kiln",
    image: STORY_PHOTO + "1633504564362-9097e06b1934",
    alt: "Iris, laughing at a message on her phone",
    stats: [
      { value: 97, suffix: "%", label: "Smaller Monday queue" },
      { value: 26, suffix: "h", label: "Saved every week" },
      { value: 4.9, decimals: 1, suffix: "/5", label: "Agent satisfaction" },
    ],
  },
] as MspStory[]

const QUOTES = [
  { quote: "{brand} resolves 80% of our tickets before an agent even logs in. Our morning backlog has disappeared.", name: "Sasha Moreno", role: "Head of Support", company: "Northwind" },
  { quote: "It learned our product from the help center in a day. The answers sound exactly like our team.", name: "Ben Hartley", role: "Founder", company: "Arbor" },
  { quote: "It picks up our tone perfectly. Customers can't tell it's not one of us, and it tells them anyway.", name: "Priya Raman", role: "Support Lead", company: "Parcelry" },
  { quote: "I was skeptical about AI support. {brand} changed my mind in the first ten minutes.", name: "Jonah Wells", role: "VP Customer Experience", company: "Lumen Labs" },
  { quote: "Our response time dropped from hours to seconds, and CSAT actually went up.", name: "Mei Tanaka", role: "Support Manager", company: "Vesta" },
  { quote: "It knows exactly when to step back and bring in a human. That's the part I didn't expect.", name: "Lucas Ferreira", role: "Operations Lead", company: "Kiln" },
  { quote: "It feels like having three extra agents on call, without the overhead.", name: "Ella Lindqvist", role: "Head of Support", company: "Driftwood" },
  { quote: "I stopped dreading Monday mornings. {brand} clears the weekend queue before I'm at my desk.", name: "Tariq Hassan", role: "Team Lead", company: "Fable & Co" },
  { quote: "We scaled to three new markets without hiring a single extra agent.", name: "Olivia Grant", role: "COO", company: "Northwind" },
  { quote: "The hand-off summaries alone saved us an hour a day. Agents read three lines and get going.", name: "Diego Alvarez", role: "Support Engineer", company: "Arbor" },
  { quote: "Setup was a coffee break. We pointed it at our docs and it was answering by lunch.", name: "Hannah Cole", role: "CX Director", company: "Vesta" },
  { quote: "The gaps report told us which help articles to write next. Ticket volume dropped again.", name: "Kofi Mensah", role: "Knowledge Manager", company: "Lumen Labs" },
] as MspQuote[]

const FAQ = [
  { q: "How is {brand} different from a chatbot?", a: "A chatbot follows a script. {brand} reads your help center, past replies and order data, writes an answer for this customer, cites where it came from, and can take actions like reshipping or updating an address within the limits you set." },
  { q: "How many tickets can it resolve on its own?", a: "Most teams see 60 to 80% of routine tickets resolved in the first month. You choose a confidence bar: below it, {brand} drafts a reply for a person to approve instead." },
  { q: "Is our data safe?", a: "Yes. We're SOC 2 Type II audited and GDPR compliant, your data is encrypted at rest and in transit, and it is never used to train shared models." },
  { q: "Will it actually sound like us?", a: "It learns your tone from replies your team has already sent. You can pick a voice (friendly, formal, playful or brief) and set words it should always or never use." },
  { q: "Which channels does it support?", a: "Email, live chat, WhatsApp, Instagram and Messenger, plus Zendesk, Intercom, Gorgias, Freshdesk and HubSpot inboxes if you already use one." },
  { q: "Can we cancel any time?", a: "Yes. Plans are monthly or yearly and you can cancel from settings in two clicks. Your data is exported and deleted within 30 days." },
] as MspFaq[]

const FOOTER = [
  { title: "Product", links: [{ label: "Features", href: "#features" }, { label: "Integrations" }, { label: "Pricing", href: "#pricing" }, { label: "Changelog" }] },
  { title: "Company", links: [{ label: "About" }, { label: "Customers", href: "#stories" }, { label: "Careers" }, { label: "Blog" }] },
  { title: "Resources", links: [{ label: "Help center" }, { label: "Questions", href: "#faq" }, { label: "Contact" }, { label: "API" }] },
  { title: "Legal", links: [{ label: "Privacy" }, { label: "Terms" }, { label: "Security", href: "#security" }, { label: "DPA" }] },
] as { title: string; links: MspLink[] }[]

// #region logic
/** A small deterministic random generator (xorshift). */
function rng(seed: number) {
  let s = (Math.floor(seed) * 2654435761) >>> 0 || 1
  return () => {
    s ^= s << 13
    s >>>= 0
    s ^= s >> 17
    s ^= s << 5
    s >>>= 0
    return s / 4294967296
  }
}

function clamp(v: number, a: number, b: number) {
  return v < a ? a : v > b ? b : v
}

/** "{brand}" in default copy becomes the brand name. */
function fill(text: string, brand: string) {
  return text.split("{brand}").join(brand)
}

/** 1240 -> "1,240"; decimals as asked. */
function fmt(n: number, decimals = 0) {
  const fixed = Math.abs(n).toFixed(decimals)
  const [int, dec] = fixed.split(".")
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
  return (n < 0 ? "-" : "") + grouped + (dec ? "." + dec : "")
}

/** A tier's monthly price at a ticket volume, with the yearly discount applied. */
function tierPrice(tier: { price: number | null; included?: number; per1000?: number }, tickets: number, yearly: boolean, discount: number) {
  if (tier.price === null) return null
  const extra = tier.per1000 && tier.included ? Math.max(0, tickets - tier.included) : 0
  const monthly = tier.price + Math.ceil(extra / 1000) * (tier.per1000 || 0)
  return Math.round(yearly ? monthly * (1 - discount) : monthly)
}

/** Whether a tier covers a volume at all (Starter stops at its allowance). */
function tierFits(tier: { price: number | null; included?: number; per1000?: number }, tickets: number) {
  if (tier.price === null) return true
  if (!tier.included) return true
  return tickets <= tier.included || !!tier.per1000
}

function validEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim())
}

/** Initials for an avatar: "Maya Okafor" -> "MO". */
function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  return ((parts[0] || "")[0] || "").toUpperCase() + ((parts.length > 1 ? parts[parts.length - 1][0] : "") || "").toUpperCase()
}

/** A hue from a string, for avatar tints. */
function hueOf(s: string) {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360
  return h
}

/** The same reply in four voices. */
const VOICES = ["Friendly", "Formal", "Playful", "Brief"]
function voiced(voice: string, name: string, brand: string) {
  if (voice === "Formal") return "Dear " + name + ", thank you for getting in touch. Your order has been dispatched and will arrive on Thursday. Please find the tracking details below."
  if (voice === "Playful") return "Good news, " + name + "! Your parcel is out of the warehouse and doing its little journey to you. Expect a knock on Thursday."
  if (voice === "Brief") return name + ", it shipped today and arrives Thursday. Tracking below."
  return "Hi " + name + "! Your order is on its way and should land on Thursday. Here's the tracking link so you can follow it. Anything else, just reply. " + brand
}

/** Overnight queue, a week of it. */
const NIGHTS = [
  { day: "Mon", value: 912, last: 860 },
  { day: "Tue", value: 846, last: 902 },
  { day: "Wed", value: 1034, last: 880 },
  { day: "Thu", value: 1240, last: 1010 },
  { day: "Fri", value: 1102, last: 1066 },
  { day: "Sat", value: 768, last: 690 },
  { day: "Sun", value: 702, last: 655 },
]

/** Performance numbers for each range. */
const RANGES = {
  "7d": { rate: 92, rateDelta: 4.2, learned: 8420, learnedDelta: 312, spark: [70, 72, 75, 74, 79, 83, 86, 88, 87, 90, 91, 92] },
  "30d": { rate: 89, rateDelta: 6.8, learned: 31260, learnedDelta: 1840, spark: [61, 64, 66, 70, 69, 73, 77, 80, 82, 85, 87, 89] },
  "90d": { rate: 84, rateDelta: 19.5, learned: 88900, learnedDelta: 6420, spark: [42, 48, 51, 57, 60, 64, 68, 71, 75, 79, 82, 84] },
} as { [k: string]: { rate: number; rateDelta: number; learned: number; learnedDelta: number; spark: number[] } }

/** The SVG path of a sparkline through values, in a w x h box. */
function sparkPath(values: number[], w: number, h: number) {
  if (!values.length) return ""
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  return values
    .map((v, i) => {
      const x = values.length === 1 ? w / 2 : (i / (values.length - 1)) * w
      const y = h - ((v - min) / span) * h
      return (i ? "L" : "M") + x.toFixed(1) + " " + y.toFixed(1)
    })
    .join(" ")
}
// #endregion logic

/* ---------- the painter ---------- */

type Rand = () => number
type RGB = number[]
type Composition = {
  seed: number
  wind: number
  grassTop: number
  flowers?: number[][]
  far?: number[][]
  near?: number[][]
  accent?: number[] | null
}

/** Where things sit in each painting, as fractions of the canvas. */
const SCENES = {
  hero: { seed: 3, wind: 0.55, grassTop: 0.62, flowers: [[0.16, 0.12, 0.05], [0.34, 0.06, 0.034], [0.07, 0.42, 0.04]], far: [[0.55, 0.22, 0.02], [0.86, 0.3, 0.024]], near: [[0.02, 0.0, 0.11], [0.97, 0.02, 0.08]], accent: [0.25, 0.92, 0.24] },
  resolve: { seed: 11, wind: 0.5, grassTop: 0.58, flowers: [[0.1, 0.32, 0.06], [0.88, 0.62, 0.05]], far: [[0.3, 0.2, 0.022], [0.7, 0.16, 0.02]], near: [[0.96, 0.06, 0.09]], accent: null },
  learn: { seed: 19, wind: 0.72, grassTop: 0.78, flowers: [[0.9, 0.38, 0.05], [0.84, 0.7, 0.04]], far: [[0.2, 0.18, 0.02]], accent: [0.12, 0.62, 0.2] },
  escalate: { seed: 27, wind: 0.42, grassTop: 0.52, flowers: [[0.92, 0.3, 0.06], [0.08, 0.78, 0.05]], far: [[0.5, 0.2, 0.02]], near: [[0.97, 0.04, 0.1]], accent: [0.05, 0.42, 0.16] },
  smarter: { seed: 9, wind: 0.85, grassTop: 0.72, flowers: [], far: [[0.76, 0.2, 0.025]], accent: [0.62, 0.86, 0.28] },
  voice: { seed: 17, wind: 0.36, grassTop: 0.52, flowers: [[0.84, 0.3, 0.07], [0.9, 0.62, 0.06], [0.14, 0.72, 0.05], [0.7, 0.1, 0.04]], far: [[0.4, 0.3, 0.025], [0.3, 0.14, 0.022]], near: [[0.06, 0.24, 0.1]], accent: null },
  overnight: { seed: 21, wind: 0.6, grassTop: 0.66, flowers: [[0.12, 0.32, 0.09]], far: [[0.26, 0.56, 0.03]], accent: [0.12, 0.34, 0.15] },
  platform: { seed: 5, wind: 0.46, grassTop: 0.42, flowers: [[0.92, 0.55, 0.04], [0.05, 0.62, 0.034]], far: [[0.2, 0.42, 0.02], [0.5, 0.44, 0.018], [0.76, 0.4, 0.02]], near: [[0.98, 0.94, 0.14]], accent: [0.86, 0.96, 0.2] },
  pricing: { seed: 33, wind: 0.6, grassTop: 0.72, flowers: [[0.62, 0.34, 0.09], [0.28, 0.6, 0.07]], far: [[0.5, 0.16, 0.03]], accent: [0.6, 0.9, 0.3] },
  story: { seed: 41, wind: 0.5, grassTop: 0.6, flowers: [[0.5, 0.3, 0.08]], far: [[0.2, 0.4, 0.03]], accent: [0.7, 0.8, 0.25] },
  cta: { seed: 45, wind: 0.5, grassTop: 0.56, flowers: [[0.12, 0.1, 0.055], [0.36, 0.04, 0.038], [0.92, 0.14, 0.05]], far: [[0.6, 0.24, 0.02]], near: [[0.0, 0.0, 0.12]], accent: [0.78, 0.88, 0.25] },
} as { [k: string]: Composition }

function hexRgb(c: string): RGB {
  const h = c.replace("#", "")
  const f = h.length === 3 ? h.split("").map((x) => x + x).join("") : h
  return [parseInt(f.slice(0, 2), 16) || 0, parseInt(f.slice(2, 4), 16) || 0, parseInt(f.slice(4, 6), 16) || 0]
}
function mixRgb(a: RGB, b: RGB, t: number): RGB {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]
}
function css(c: RGB, a: number) {
  return "rgba(" + (c[0] | 0) + "," + (c[1] | 0) + "," + (c[2] | 0) + "," + a.toFixed(3) + ")"
}
function jitter(c: RGB, r: Rand, n: number): RGB {
  const k = (r() - 0.5) * n
  return [c[0] + k, c[1] + k * 1.05, c[2] + k * 0.9]
}

/** An offscreen canvas at a fraction of the size; drawn back up, it blurs for free. */
function offscreen(w: number, h: number, s: number) {
  const c = document.createElement("canvas")
  c.width = Math.max(1, Math.round(w * s))
  c.height = Math.max(1, Math.round(h * s))
  const x = c.getContext("2d") as CanvasRenderingContext2D
  x.scale(s, s)
  return { c, x }
}

/** One brush stroke: a few hairlines following one curve, with ragged ends. */
function bristle(x: CanvasRenderingContext2D, r: Rand, x0: number, y0: number, len: number, ang: number, bend: number, wid: number, col: RGB, al: number, n: number) {
  const dx = Math.cos(ang)
  const dy = Math.sin(ang)
  const nx = -dy
  const ny = dx
  x.lineCap = "round"
  for (let i = 0; i < n; i++) {
    const o = (i / (n - 1 || 1) - 0.5) * wid
    const a = r() * 0.2
    const b = 1 - r() * 0.2
    x.strokeStyle = css(jitter(col, r, 24), al * (0.35 + r() * 0.65))
    x.lineWidth = Math.max(0.6, (wid / n) * (1 + r() * 1.4))
    x.beginPath()
    for (let t = a, first = true; t <= b + 0.001; t += 0.1) {
      const k = bend * Math.sin(Math.PI * t)
      const px = x0 + dx * len * t + nx * (o + k)
      const py = y0 + dy * len * t + ny * (o + k)
      if (first) x.moveTo(px, py)
      else x.lineTo(px, py)
      first = false
    }
    x.stroke()
  }
}

/** A grass blade rising from (bx, by) and leaning with the wind. */
function blade(x: CanvasRenderingContext2D, r: Rand, bx: number, by: number, hgt: number, wind: number, wid: number, c0: RGB, c1: RGB, al: number) {
  const tipx = bx + wind * hgt * (0.45 + r() * 0.5)
  const tipy = by - hgt * (1 - Math.abs(wind) * 0.12)
  const cx = bx + wind * hgt * 0.08 + (r() - 0.5) * hgt * 0.1
  const cy = by - hgt * 0.6
  const g = x.createLinearGradient(bx, by, tipx, tipy)
  g.addColorStop(0, css(c0, al))
  g.addColorStop(1, css(c1, al))
  x.fillStyle = g
  x.beginPath()
  x.moveTo(bx - wid / 2, by)
  x.quadraticCurveTo(cx - wid * 0.3, cy, tipx, tipy)
  x.quadraticCurveTo(cx + wid * 0.3, cy, bx + wid / 2, by)
  x.closePath()
  x.fill()
}

/** A daisy, tilted in space: lit petals on top, shadowed ones underneath. */
function daisy(x: CanvasRenderingContext2D, r: Rand, cx: number, cy: number, rad: number, tilt: number, rot: number, P: { petal: RGB; shade: RGB; eye0: RGB; eye1: RGB }, al: number) {
  x.save()
  x.translate(cx, cy)
  x.rotate(rot)
  x.scale(1, tilt)
  const n = 15 + Math.floor(r() * 8)
  const petals = []
  for (let i = 0; i < n; i++) petals.push(i / n * Math.PI * 2 + r() * 0.22)
  petals.sort((p, q) => Math.sin(p) - Math.sin(q))
  // a soft shadow under the head
  x.fillStyle = css(P.shade, al * 0.18)
  x.beginPath()
  x.arc(rad * 0.06, rad * 0.12, rad * 1.02, 0, Math.PI * 2)
  x.fill()
  for (const a of petals) {
    const L = rad * (0.8 + r() * 0.32)
    const W = rad * (0.15 + r() * 0.07)
    const lit = 0.5 + 0.5 * Math.sin(a + Math.PI)
    const c = mixRgb(P.shade, P.petal, 0.3 + lit * 0.7)
    x.save()
    x.rotate(a)
    x.fillStyle = css(c, al)
    x.beginPath()
    x.ellipse(L * 0.55, 0, L * 0.5, W, 0, 0, Math.PI * 2)
    x.fill()
    x.strokeStyle = css(mixRgb(c, P.shade, 0.6), al * 0.3)
    x.lineWidth = Math.max(0.5, W * 0.12)
    x.beginPath()
    x.moveTo(rad * 0.15, 0)
    x.lineTo(L * 0.9, 0)
    x.stroke()
    x.restore()
  }
  const cr = rad * 0.3
  const g = x.createRadialGradient(-cr * 0.3, -cr * 0.4, cr * 0.1, 0, 0, cr)
  g.addColorStop(0, css(P.eye1, al))
  g.addColorStop(1, css(P.eye0, al))
  x.fillStyle = g
  x.beginPath()
  x.arc(0, 0, cr, 0, Math.PI * 2)
  x.fill()
  const dot = mixRgb(P.eye0, [110, 54, 10], 0.5)
  for (let k = 0; k < 24; k++) {
    const a = r() * 6.283
    const d = Math.sqrt(r()) * cr * 0.85
    x.fillStyle = css(dot, al * 0.32)
    x.beginPath()
    x.arc(Math.cos(a) * d, Math.sin(a) * d, cr * 0.07, 0, 6.283)
    x.fill()
  }
  x.restore()
}

function stem(x: CanvasRenderingContext2D, cx: number, cy: number, by: number, wind: number, col: RGB, al: number, w: number) {
  x.strokeStyle = css(col, al)
  x.lineWidth = w
  x.lineCap = "round"
  x.beginPath()
  x.moveTo(cx, cy)
  x.quadraticCurveTo(cx - wind * (by - cy) * 0.25, (cy + by) / 2, cx - wind * (by - cy) * 0.15, by)
  x.stroke()
}

/**
 * Paints a meadow in two layers: `back` (sky, clouds, far grass, held still)
 * and `front` (the grass and flowers that move, padded sideways so it can sway).
 */
function paintMeadow(W: number, H: number, pad: number, S: Composition, paint: MspPaint, dark: boolean, seedShift: number) {
  const r = rng(S.seed * 7919 + seedShift * 104729 + 17)
  const sky = paint.sky.map(hexRgb)
  const grass = paint.grass.map(hexRgb)
  const cloud = hexRgb(paint.cloud)
  const warm = hexRgb(paint.warm)
  const P = { petal: hexRgb(paint.petal), shade: hexRgb(paint.shade), eye0: hexRgb(paint.eye[0]), eye1: hexRgb(paint.eye[1]) }
  const m = Math.max(W, H)
  const k = clamp((W * H) / 900000, 0.3, 1.8)
  const teal = mixRgb(grass[1], sky[2], 0.45)

  const back = offscreen(W, H, 1)
  const bx = back.x
  // 1. sky, very soft
  {
    const s = offscreen(W, H, 1 / 8)
    const g = s.x.createLinearGradient(0, 0, W * 0.3, H)
    g.addColorStop(0, css(dark ? sky[2] : sky[1], 1))
    g.addColorStop(0.5, css(sky[dark ? 1 : 0], 1))
    g.addColorStop(1, css(dark ? sky[0] : sky[2], 1))
    s.x.fillStyle = g
    s.x.fillRect(0, 0, W, H)
    for (let i = 0; i < 14; i++) {
      const px = r() * W
      const py = r() * H * 0.7
      const rr = m * (0.12 + r() * 0.25)
      const gg = s.x.createRadialGradient(px, py, 0, px, py, rr)
      gg.addColorStop(0, css(cloud, dark ? 0.4 : 0.75))
      gg.addColorStop(1, css(cloud, 0))
      s.x.fillStyle = gg
      s.x.fillRect(0, 0, W, H)
    }
    for (let i = 0; i < 6; i++) {
      const px = r() * W
      const py = H * (0.2 + r() * 0.6)
      const rr = m * (0.1 + r() * 0.2)
      const gg = s.x.createRadialGradient(px, py, 0, px, py, rr)
      gg.addColorStop(0, css(sky[2], 0.55))
      gg.addColorStop(1, css(sky[2], 0))
      s.x.fillStyle = gg
      s.x.fillRect(0, 0, W, H)
    }
    bx.imageSmoothingQuality = "high"
    bx.drawImage(s.c, 0, 0, W, H)
  }
  // 2. stars, only at night
  if (dark) {
    for (let i = 0; i < 60 * k; i++) {
      const px = r() * W
      const py = r() * H * 0.45
      bx.fillStyle = css(cloud, 0.25 + r() * 0.5)
      bx.beginPath()
      bx.arc(px, py, 0.4 + r() * 1.1, 0, 6.283)
      bx.fill()
    }
  }
  // 3. the painter's hand: broad strokes across the sky
  for (let i = 0; i < 260 * k; i++) {
    const px = r() * W
    const py = r() * H * 0.85
    const len = m * (0.05 + r() * 0.14)
    const ang = -0.5 + S.wind * 0.5 + (r() - 0.5) * 0.6
    const c = r() < 0.5 ? mixRgb(sky[0], cloud, r()) : mixRgb(sky[1], sky[2], r())
    bristle(bx, r, px, py, len, ang, (r() - 0.5) * len * 0.2, m * (0.012 + r() * 0.03), c, dark ? 0.07 : 0.1, 7)
  }
  // 4. far grass and flowers, out of focus
  {
    const s = offscreen(W, H, 1 / 3)
    for (let i = 0; i < 520 * k; i++) {
      const x0 = r() * W * 1.2 - W * 0.1
      const h = H * (S.grassTop * 0.6 + r() * S.grassTop * 0.9)
      blade(s.x, r, x0, H * 1.02, h, S.wind * (0.6 + r() * 0.6), m * (0.006 + r() * 0.012), mixRgb(grass[0], sky[2], 0.3), mixRgb(grass[2], sky[0], r() * 0.6), 0.55)
    }
    for (const f of S.far || []) daisy(s.x, r, f[0] * W, f[1] * H, f[2] * m, 0.5 + r() * 0.4, (r() - 0.5) * 0.8, P, 0.85)
    bx.drawImage(s.c, 0, 0, W, H)
  }
  // 5. a warm smear of late light
  if (S.accent) {
    const [ax, ay, ar] = S.accent
    const s = offscreen(W, H, 1 / 6)
    const g = s.x.createRadialGradient(ax * W, ay * H, 0, ax * W, ay * H, ar * m)
    g.addColorStop(0, css(warm, 0.85))
    g.addColorStop(1, css(warm, 0))
    s.x.fillStyle = g
    s.x.fillRect(0, 0, W, H)
    bx.globalCompositeOperation = "soft-light"
    bx.drawImage(s.c, 0, 0, W, H)
    bx.globalCompositeOperation = "source-over"
    bx.globalAlpha = 0.4
    bx.drawImage(s.c, 0, 0, W, H)
    bx.globalAlpha = 1
  }
  // 6. grain, so it reads as paint on canvas rather than a gradient
  {
    const id = bx.getImageData(0, 0, back.c.width, back.c.height)
    const d = id.data
    for (let i = 0; i < d.length; i += 4) {
      const n = (r() - 0.5) * 13
      d[i] += n
      d[i + 1] += n
      d[i + 2] += n
    }
    bx.putImageData(id, 0, 0)
  }

  const front = offscreen(W + pad * 2, H, 1)
  const fx = front.x
  fx.translate(pad, 0)
  // 7. mid grass, crisp, with dabs of paint along it
  for (let i = 0; i < 300 * k; i++) {
    const x0 = r() * (W + pad * 2) - pad
    const h = H * (S.grassTop * 0.5 + r() * S.grassTop * 1.1)
    const w = S.wind * (0.7 + r() * 0.5)
    const c0 = r() < 0.3 ? teal : grass[Math.floor(r() * 2)]
    const c1 = mixRgb(grass[2], grass[3], r())
    blade(fx, r, x0, H * 1.02, h, w, m * (0.004 + r() * 0.008), c0, c1, 0.55 + r() * 0.35)
    if (r() < 0.35) bristle(fx, r, x0, H * 1.02, h * 0.9, -Math.PI / 2 + Math.atan(w * 0.7), h * 0.05 * S.wind, m * 0.006, mixRgb(c1, [255, 255, 232], 0.3), 0.35, 3)
  }
  for (let i = 0; i < 120 * k; i++) {
    const x0 = r() * W
    const y0 = H * (1 - S.grassTop * r() * 0.9)
    const c = r() < 0.5 ? mixRgb(grass[2], sky[0], r() * 0.5) : mixRgb(teal, grass[3], r())
    bristle(fx, r, x0, y0, m * (0.03 + r() * 0.06), -Math.PI / 2 + Math.atan(S.wind) * 0.9 + (r() - 0.5) * 0.3, m * 0.004, m * (0.006 + r() * 0.01), c, 0.28, 4)
  }
  // 8. flowers in focus
  for (const f of S.flowers || []) {
    const px = f[0] * W
    const py = f[1] * H
    const pr = f[2] * m
    stem(fx, px, py + pr * 0.2, H * 1.05, S.wind, grass[1], 0.9, Math.max(1.5, pr * 0.07))
    daisy(fx, r, px, py, pr, 0.55 + r() * 0.4, (r() - 0.5) * 0.9 + S.wind * 0.3, P, 1)
  }
  // 9. the foreground, close to the lens and soft
  {
    const s = offscreen(W + pad * 2, H, 1 / 10)
    s.x.translate(pad, 0)
    for (let i = 0; i < 26; i++) blade(s.x, r, r() * W, H * 1.05, H * (0.3 + r() * 0.6), S.wind * (1 + r() * 0.6), m * (0.02 + r() * 0.03), grass[0], grass[2], 0.5)
    for (const f of S.near || []) daisy(s.x, r, f[0] * W, f[1] * H, f[2] * m, 0.6 + r() * 0.3, r() - 0.5, P, 0.9)
    fx.setTransform(1, 0, 0, 1, 0, 0)
    fx.drawImage(s.c, 0, 0, W + pad * 2, H)
  }
  return { back: back.c, front: front.c }
}

type Painter = {
  canvas: HTMLCanvasElement
  scene: Composition
  paint: MspPaint
  dark: boolean
  seed: number
  w: number
  h: number
  scale: number
  visible: boolean
  still: boolean
  layers: { back: HTMLCanvasElement; front: HTMLCanvasElement } | null
  key: string
  pad: number
  phase: number
  push: number
  queued: boolean
  dead: boolean
}

const painters = [] as Painter[]
const queue = [] as Painter[]
let queueTimer = 0
let rafId = 0
let lastFrame = 0

function enqueue(p: Painter) {
  if (p.queued || p.dead) return
  p.queued = true
  queue.push(p)
  if (!queueTimer) queueTimer = window.setTimeout(runQueue, 0)
}

function runQueue() {
  queueTimer = 0
  // visible ones first
  queue.sort((a, b) => Number(b.visible) - Number(a.visible))
  const p = queue.shift()
  if (p) {
    p.queued = false
    if (!p.dead && p.w > 0 && p.h > 0) {
      const key = p.w + "x" + p.h + ":" + JSON.stringify(p.paint) + p.dark + p.seed
      if (key !== p.key) {
        const W = Math.round(p.w * p.scale)
        const H = Math.round(p.h * p.scale)
        p.pad = Math.round(W * 0.05)
        p.layers = paintMeadow(W, H, p.pad, p.scene, p.paint, p.dark, p.seed)
        p.canvas.width = W
        p.canvas.height = H
        p.key = key
        p.canvas.setAttribute("data-painted", "")
        drawFrame(p, performance.now())
      }
    }
  }
  if (queue.length) queueTimer = window.setTimeout(runQueue, 16)
}

/** Draws the still sky, then the grass in thin bands, each pushed by the wind. */
function drawFrame(p: Painter, t: number) {
  const L = p.layers
  if (!L) return
  const ctx = p.canvas.getContext("2d")
  if (!ctx) return
  const W = p.canvas.width
  const H = p.canvas.height
  ctx.drawImage(L.back, 0, 0)
  if (p.still) {
    ctx.drawImage(L.front, -p.pad, 0)
    return
  }
  const amp = W * 0.012
  const band = Math.max(2, Math.round(3 * p.scale))
  const gust = 0.55 + 0.45 * Math.sin(t * 0.00037 + p.phase) * Math.sin(t * 0.00071 + p.phase * 2)
  for (let y = 0; y < H; y += band) {
    const f = Math.pow(1 - y / H, 1.4)
    const dx = amp * f * (Math.sin(t * 0.0015 + (y / H) * 3.2 + p.phase) * gust + p.push)
    ctx.drawImage(L.front, 0, y, L.front.width, band, dx - p.pad, y, L.front.width, band)
  }
}

function tick(t: number) {
  rafId = 0
  let any = false
  if (t - lastFrame > 30) {
    lastFrame = t
    for (const p of painters) {
      if (!p.visible || p.still || !p.layers) continue
      p.push *= 0.94
      drawFrame(p, t)
    }
  }
  for (const p of painters) if (p.visible && !p.still) any = true
  if (any && !document.hidden) rafId = requestAnimationFrame(tick)
}

function wake() {
  if (!rafId) rafId = requestAnimationFrame(tick)
}

/* ---------- small hooks ---------- */

function useReducedMotion() {
  const [reduced, setReduced] = React.useState(false)
  React.useEffect(() => {
    if (typeof matchMedia !== "function") return
    const mq = matchMedia("(prefers-reduced-motion: reduce)")
    const on = () => setReduced(mq.matches)
    on()
    mq.addEventListener("change", on)
    return () => mq.removeEventListener("change", on)
  }, [])
  return reduced
}

function useTheme(pref: "system" | "light" | "dark") {
  const [dark, setDark] = React.useState(pref === "dark")
  React.useEffect(() => {
    if (pref !== "system") {
      setDark(pref === "dark")
      return
    }
    const mq = typeof matchMedia === "function" ? matchMedia("(prefers-color-scheme: dark)") : null
    const read = () => {
      const el = document.documentElement
      if (el.classList.contains("dark")) return setDark(true)
      if (el.classList.contains("light")) return setDark(false)
      setDark(!!(mq && mq.matches))
    }
    read()
    const mo = new MutationObserver(read)
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })
    if (mq) mq.addEventListener("change", read)
    return () => {
      mo.disconnect()
      if (mq) mq.removeEventListener("change", read)
    }
  }, [pref])
  return dark
}

/** Whether the element is on screen now, and whether it has ever been. */
function useInView(ref: { current: Element | null }, margin = "0px", threshold = 0) {
  const [state, setState] = React.useState({ seen: false, now: false })
  React.useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver !== "function") {
      setState({ seen: true, now: true })
      return
    }
    const io = new IntersectionObserver(
      ([e]) => setState((s) => ({ seen: s.seen || e.isIntersecting, now: e.isIntersecting })),
      { rootMargin: margin, threshold }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [ref, margin, threshold])
  return state
}

/** Eases a number toward its target. */
function useTween(target: number, run: boolean, ms = 900) {
  const [v, setV] = React.useState(run ? 0 : target)
  const from = React.useRef(0)
  const cur = React.useRef(v)
  cur.current = v
  React.useEffect(() => {
    if (!run) return
    from.current = cur.current
    const start = performance.now()
    let id = 0
    const step = (t: number) => {
      const k = Math.min(1, (t - start) / ms)
      const e = 1 - Math.pow(1 - k, 3)
      setV(from.current + (target - from.current) * e)
      if (k < 1) id = requestAnimationFrame(step)
    }
    id = requestAnimationFrame(step)
    return () => cancelAnimationFrame(id)
  }, [target, run, ms])
  return run ? v : target
}

const PaintCtx = React.createContext(null as null | { paint: MspPaint; dark: boolean; reduced: boolean; seed: number; images: { [k: string]: string } })
const BrandCtx = React.createContext({ brand: "Mallow", logos: [] as string[], start: (() => {}) as (e?: string) => void, sales: (() => {}) as () => void, go: ((id: string) => {}) as (id: string) => void })

/* ---------- the painting ---------- */

type MeadowProps = { scene: MspScene; active?: boolean; label?: string; className?: string; image?: string; alt?: string }

/**
 * A painted meadow that fills its positioned parent. It paints once it comes
 * near the screen, sways while it's on screen, and leans away from the
 * pointer. Pass `image` (or the template's `images[scene]`) for a photo instead.
 */
function Meadow({ scene, active = true, label, className, image, alt }: MeadowProps) {
  const env = React.useContext(PaintCtx)
  const box = React.useRef(null as HTMLDivElement | null)
  const cv = React.useRef(null as HTMLCanvasElement | null)
  const painter = React.useRef(null as Painter | null)
  const [failed, setFailed] = React.useState(false)
  const photo = (image || (env && env.images[scene]) || "") as string
  const usePhoto = !!photo && !failed
  const paint = env ? env.paint : MEADOW.light.paint
  const dark = env ? env.dark : false
  const still = env ? env.reduced : false
  const seed = env ? env.seed : 0

  React.useEffect(() => setFailed(false), [photo])

  React.useEffect(() => {
    if (usePhoto) return
    const el = box.current
    const c = cv.current
    if (!el || !c) return
    const p = {
      canvas: c,
      scene: SCENES[scene] || SCENES.hero,
      paint,
      dark,
      seed,
      w: 0,
      h: 0,
      scale: Math.min(typeof devicePixelRatio === "number" ? devicePixelRatio : 1, 1.5),
      visible: false,
      still,
      layers: null,
      key: "",
      pad: 0,
      phase: (SCENES[scene] ? SCENES[scene].seed : 1) * 1.7,
      push: 0,
      queued: false,
      dead: false,
    } as Painter
    painter.current = p
    painters.push(p)
    const size = () => {
      const r = el.getBoundingClientRect()
      const w = Math.round(r.width)
      const h = Math.round(r.height)
      if (!w || !h) return
      // hold every painting to a pixel budget, so big screens stay smooth
      const budget = 1500000
      p.scale = Math.min(typeof devicePixelRatio === "number" ? devicePixelRatio : 1, 1.5, Math.sqrt(budget / (w * h)))
      if (Math.abs(w - p.w) > 24 || Math.abs(h - p.h) > 24 || !p.layers) {
        p.w = w
        p.h = h
        if (p.visible || !p.layers) enqueue(p)
      }
    }
    const ro = typeof ResizeObserver === "function" ? new ResizeObserver(size) : null
    if (ro) ro.observe(el)
    size()
    const io =
      typeof IntersectionObserver === "function"
        ? new IntersectionObserver(
            ([e]) => {
              p.visible = e.isIntersecting && active
              if (e.isIntersecting) {
                size()
                enqueue(p)
              }
              wake()
            },
            { rootMargin: "300px 0px" }
          )
        : null
    if (io) io.observe(el)
    else {
      p.visible = active
      enqueue(p)
    }
    let lastX = -1
    const move = (e: PointerEvent) => {
      if (lastX >= 0 && p.w) p.push = clamp(p.push + ((e.clientX - lastX) / p.w) * 5, -1.6, 1.6)
      lastX = e.clientX
    }
    const leave = () => {
      lastX = -1
    }
    el.addEventListener("pointermove", move)
    el.addEventListener("pointerleave", leave)
    return () => {
      p.dead = true
      const i = painters.indexOf(p)
      if (i > -1) painters.splice(i, 1)
      const q = queue.indexOf(p)
      if (q > -1) queue.splice(q, 1)
      if (ro) ro.disconnect()
      if (io) io.disconnect()
      el.removeEventListener("pointermove", move)
      el.removeEventListener("pointerleave", leave)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usePhoto, scene, JSON.stringify(paint), dark, seed])

  React.useEffect(() => {
    const p = painter.current
    if (!p) return
    p.still = still
    if (p.layers) drawFrame(p, performance.now())
    wake()
  }, [still])

  React.useEffect(() => {
    const p = painter.current
    if (!p || !box.current) return
    const r = box.current.getBoundingClientRect()
    p.visible = active && r.bottom > -300 && r.top < innerHeight + 300
    if (p.visible) enqueue(p)
    wake()
  }, [active])

  const sky = paint.sky
  const aria = label ? { role: "img", "aria-label": label } : { "aria-hidden": true }
  return (
    <div
      ref={box}
      className={"msp-paint" + (className ? " " + className : "")}
      data-scene={scene}
      style={{ background: "linear-gradient(170deg," + sky[dark ? 2 : 1] + "," + sky[dark ? 1 : 0] + " 45%," + paint.grass[dark ? 1 : 2] + ")" }}
      {...aria}
    >
      {usePhoto ? (
        <img className="msp-photo" src={photo} alt={alt || ""} draggable={false} loading="lazy" decoding="async" onError={() => setFailed(true)} style={{ maxWidth: "none" }} />
      ) : (
        <canvas ref={cv} className="msp-canvas" style={{ maxWidth: "none" }} />
      )}
    </div>
  )
}

/** Renders a fixed-size design scaled to a fraction of its parent's width. */
function Scaled({ design, fit, className, style, children }: { design: number; fit: number; className?: string; style?: React.CSSProperties; children: React.ReactNode }) {
  const ref = React.useRef(null as HTMLDivElement | null)
  const [k, setK] = React.useState(0.8)
  React.useEffect(() => {
    const el = ref.current
    const parent = el && el.parentElement
    if (!el || !parent) return
    const on = () => {
      const w = parent.getBoundingClientRect().width
      if (w) setK((w * fit) / design)
    }
    on()
    const ro = typeof ResizeObserver === "function" ? new ResizeObserver(on) : null
    if (ro) ro.observe(parent)
    return () => {
      if (ro) ro.disconnect()
    }
  }, [design, fit])
  return (
    <div ref={ref} className={"msp-scaled" + (className ? " " + className : "")} style={{ width: design, transform: "scale(" + k.toFixed(4) + ")", ...style }}>
      {children}
    </div>
  )
}

/* ---------- icons and small pieces ---------- */

const I = {
  arrow: "M5 12h13m-5-5 5 5-5 5",
  down: "m6 9 6 6 6-6",
  check: "m5 12.5 4.2 4.2L19 7",
  plus: "M12 5v14M5 12h14",
  menu: "M4 7h16M4 12h16M4 17h16",
  close: "M6 6l12 12M18 6 6 18",
  inbox: "M4 13.5 6.5 5h11l2.5 8.5V19H4v-5.5Zm0 0h5l1 2h4l1-2h5",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8c.8-3.5 3.6-5.5 7-5.5s6.2 2 7 5.5",
  users: "M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm-6 9c.6-3.2 3-5 6-5s5.4 1.8 6 5m1-9.2a3 3 0 1 0 0-5.8M17.5 15c2 .5 3.2 2.1 3.5 5",
  spark: "M12 3.5 13.8 9l5.7 1.9-5.7 1.9L12 18.5l-1.8-5.7L4.5 11l5.7-1.9L12 3.5Z",
  hand: "M8 11V5.5a1.5 1.5 0 0 1 3 0V11m0-1V4.5a1.5 1.5 0 0 1 3 0V11m0-.5V6a1.5 1.5 0 0 1 3 0v7c0 4-2.5 7-6.5 7-3 0-4.5-1.5-6-4l-1.8-3a1.5 1.5 0 0 1 2.6-1.5L8 13",
  mail: "M4 6.5h16v11H4v-11Zm0 .5 8 6 8-6",
  chat: "M5 5.5h14v10H10l-4 3.5v-3.5H5v-10Z",
  phone: "M8 3.5h8a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1v-15a1 1 0 0 1 1-1Zm3 14h2",
  search: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Zm5-2 4 4",
  book: "M5 4.5h9a3 3 0 0 1 3 3V20a2.5 2.5 0 0 0-2.5-2.5H5v-13Zm12 3a3 3 0 0 1 3-3v13a2.5 2.5 0 0 0-2.5 2.5",
  bag: "M5.5 8h13l-1 12h-11l-1-12Zm3.5 0V6.5a3 3 0 0 1 6 0V8",
  doc: "M7 3.5h7l4 4V20.5H7v-17Zm7 0v4h4M9.5 12h6m-6 3.5h6",
  history: "M4 12a8 8 0 1 0 2.4-5.7M4 4v4h4m4-1v5l3 2",
  shield: "M12 3.5 19 6v5.5c0 4.5-3 7.8-7 9-4-1.2-7-4.5-7-9V6l7-2.5Zm-3 8.5 2.2 2.2L15.5 10",
  lock: "M6.5 11h11v9h-11v-9Zm2.5 0V8a3 3 0 0 1 6 0v3m-3 3.5v2",
  key: "M14.5 9.5a4 4 0 1 1-1.2-2.8 4 4 0 0 1 1.2 2.8Zm-1.2 2.8L20 19m-3-3 2-2",
  eye: "M2.5 12s3.5-6.5 9.5-6.5 9.5 6.5 9.5 6.5-3.5 6.5-9.5 6.5S2.5 12 2.5 12Zm9.5 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
  tag: "M4 4.5h7.5l8.5 8.5-7 7-8.5-8.5V4.5Zm4 4h.01",
  route: "M6 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm12-10a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM6 15V9a4 4 0 0 1 4-4h4M18 9v6a4 4 0 0 1-4 4h-4",
  chart: "M4 20V4m0 16h16M8 16v-4m4 4V8m4 8v-6",
  bolt: "M13 3 5 13.5h6L10 21l8-10.5h-6L13 3Z",
  play: "M8 5.5v13l11-6.5-11-6.5Z",
  pause: "M8 5v14M16 5v14",
  prev: "m14.5 6-6 6 6 6",
  next: "m9.5 6 6 6-6 6",
  x: "M5 4.5h4.5L19 19.5h-4.5L5 4.5Zm14 0-5.5 6.2M5 19.5l5.6-6.3",
  in: "M5 9.5v10m0-14v.01M9.5 19.5v-6a3.5 3.5 0 0 1 7 0v6M9.5 9.5v10",
  ig: "M7.5 4h9A3.5 3.5 0 0 1 20 7.5v9a3.5 3.5 0 0 1-3.5 3.5h-9A3.5 3.5 0 0 1 4 16.5v-9A3.5 3.5 0 0 1 7.5 4Zm4.5 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm4.5-8.5h.01",
  clock: "M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm0-12v4.5l3 2",
  sun: "M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0-12.5V5m0 14v1.5M3.5 12H5m14 0h1.5M6 6l1 1m10 10 1 1M6 18l1-1M17 7l1-1",
} as { [k: string]: string }

function Icon({ d, size = 16, stroke = 1.6, className }: { d: string; size?: number; stroke?: number; className?: string }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ maxWidth: "none" }}>
      <path d={I[d] || d} />
    </svg>
  )
}

/** The mark: a five-petal mallow flower in a soft square. */
function Mark({ size = 26 }: { size?: number }) {
  const petals = [0, 1, 2, 3, 4].map((i) => {
    const a = (i / 5) * Math.PI * 2 - Math.PI / 2
    return { x: 12 + Math.cos(a) * 4.4, y: 12 + Math.sin(a) * 4.4 }
  })
  return (
    <svg className="msp-mark" width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={{ maxWidth: "none" }}>
      <rect width="24" height="24" rx="7" fill="var(--msp-ink)" />
      {petals.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3.3" fill="var(--msp-paper)" />
      ))}
      <circle cx="12" cy="12" r="2.1" fill="var(--msp-ink)" />
    </svg>
  )
}

/** A tiny daisy, used as a bullet. */
function Bud() {
  return (
    <svg className="msp-bud" width="10" height="10" viewBox="0 0 10 10" aria-hidden="true" style={{ maxWidth: "none" }}>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <ellipse key={i} cx="5" cy="2.3" rx="1.3" ry="2.2" fill="currentColor" opacity=".55" transform={"rotate(" + i * 60 + " 5 5)"} />
      ))}
      <circle cx="5" cy="5" r="1.5" fill="currentColor" />
    </svg>
  )
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="msp-eyebrow">
      <Bud />
      {children}
    </p>
  )
}

/** A serif heading: the first line in ink, the rest softer. */
function Title({ text, as = "h2", className, id }: { text: string; as?: "h1" | "h2" | "h3"; className?: string; id?: string }) {
  const [first, ...rest] = text.split("\n")
  const Tag = as
  return (
    <Tag className={"msp-title" + (className ? " " + className : "")} id={id}>
      <span className="msp-title-a">{first}</span>
      {rest.length > 0 && (
        <>
          {" "}
          <span className="msp-title-b">{rest.join(" ")}</span>
        </>
      )}
    </Tag>
  )
}

function Avatar({ name, size = 28, brand }: { name: string; size?: number; brand?: boolean }) {
  if (brand) {
    return (
      <span className="msp-avatar msp-avatar-brand" style={{ width: size, height: size }} aria-hidden="true">
        <Mark size={size} />
      </span>
    )
  }
  const h = hueOf(name)
  return (
    <span className="msp-avatar" style={{ width: size, height: size, fontSize: size * 0.38, background: "hsl(" + h + " 38% 88%)", color: "hsl(" + h + " 32% 30%)" }} aria-hidden="true">
      {initials(name)}
    </span>
  )
}

/** A made-up company's wordmark: a small drawn glyph and the name. */
function Logo({ name, className }: { name: string; className?: string }) {
  const { logos } = React.useContext(BrandCtx)
  const at = logos.indexOf(name)
  const n = (at > -1 ? at : hueOf(name)) % 8
  const glyph = [
    <circle key="a" cx="9" cy="9" r="6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeDasharray="28 10" />,
    <rect key="b" x="3" y="3" width="12" height="12" rx="3" fill="none" stroke="currentColor" strokeWidth="2" />,
    <path key="c" d="M2 14 9 3l7 11H2Z" fill="currentColor" />,
    <path key="d" d="M11 2.4a7 7 0 1 0 4.6 11.7A5.6 5.6 0 0 1 11 2.4Z" fill="currentColor" />,
    <path key="e" d="M3 9h12M9 3v12M4.8 4.8l8.4 8.4M13.2 4.8l-8.4 8.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />,
    <path key="f" d="M3 13c2-6 10-6 12 0M5 9c1.5-3 6.5-3 8 0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />,
    <path key="g" d="M9 1.8 16.2 9 9 16.2 1.8 9 9 1.8Z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />,
    <path key="h" d="M3 4.5h12M3 9h8M3 13.5h12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />,
  ][n]
  return (
    <span className={"msp-logo" + (className ? " " + className : "")}>
      <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" style={{ maxWidth: "none" }}>
        {glyph}
      </svg>
      {name}
    </span>
  )
}

function Button({ children, onClick, variant = "solid", className, type = "button", disabled, arrow }: { children: React.ReactNode; onClick?: () => void; variant?: "solid" | "ghost" | "line"; className?: string; type?: "button" | "submit"; disabled?: boolean; arrow?: boolean }) {
  return (
    <button type={type} className={"msp-btn msp-btn-" + variant + (className ? " " + className : "")} onClick={onClick} disabled={disabled}>
      <span>{children}</span>
      {arrow && <Icon d="arrow" size={15} className="msp-btn-arrow" />}
    </button>
  )
}

/* ---------- nav ---------- */

function Nav({ brand, logo, items, login, cta }: { brand: string; logo?: React.ReactNode; items: MspNavItem[]; login: MspLink | null; cta: string }) {
  const { start, go } = React.useContext(BrandCtx)
  const [scrolled, setScrolled] = React.useState(false)
  const [open, setOpen] = React.useState(-1)
  const [sheet, setSheet] = React.useState(false)
  const ref = React.useRef(null as HTMLElement | null)
  const closeT = React.useRef(0)
  React.useEffect(() => {
    const on = () => {
      const el = ref.current
      if (!el) return
      setScrolled(el.getBoundingClientRect().top <= 0 && (window.scrollY > 8 || el.parentElement!.getBoundingClientRect().top < -8))
    }
    on()
    document.addEventListener("scroll", on, { capture: true, passive: true })
    return () => document.removeEventListener("scroll", on, { capture: true })
  }, [])
  React.useEffect(() => {
    if (open < 0 && !sheet) return
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(-1)
        setSheet(false)
      }
    }
    const away = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(-1)
    }
    document.addEventListener("keydown", key)
    document.addEventListener("pointerdown", away)
    return () => {
      document.removeEventListener("keydown", key)
      document.removeEventListener("pointerdown", away)
    }
  }, [open, sheet])
  const follow = (href?: string) => (e: React.MouseEvent) => {
    if (href && href.startsWith("#")) {
      e.preventDefault()
      setOpen(-1)
      setSheet(false)
      go(href.slice(1))
    } else if (!href) e.preventDefault()
  }
  const hold = (i: number) => {
    window.clearTimeout(closeT.current)
    setOpen(i)
  }
  const drop = () => {
    window.clearTimeout(closeT.current)
    closeT.current = window.setTimeout(() => setOpen(-1), 160)
  }
  return (
    <header ref={ref} className="msp-nav" data-scrolled={scrolled || sheet ? "" : undefined}>
      <div className="msp-wrap msp-nav-row">
        <a href="#top" className="msp-brand" onClick={follow("#top")} aria-label={brand + ", back to top"}>
          {logo || <Mark />}
          <span>{brand}</span>
        </a>
        <nav className="msp-nav-links" aria-label="Main">
          {items.map((it, i) =>
            it.items ? (
              <div key={it.label} className="msp-nav-item" onPointerEnter={(e) => e.pointerType === "mouse" && hold(i)} onPointerLeave={(e) => e.pointerType === "mouse" && drop()}>
                <button
                  type="button"
                  className="msp-nav-link"
                  aria-expanded={open === i}
                  aria-haspopup="true"
                  onClick={() => setOpen(open === i ? -1 : i)}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowDown") {
                      e.preventDefault()
                      setOpen(i)
                      window.setTimeout(() => {
                        const a = ref.current && (ref.current.querySelector(".msp-menu a") as HTMLElement | null)
                        if (a) a.focus()
                      }, 30)
                    }
                  }}
                >
                  {it.label}
                  <Icon d="down" size={13} className="msp-chev" />
                </button>
                <div className="msp-menu" data-open={open === i ? "" : undefined} role="menu" aria-label={it.label}>
                  <div className="msp-menu-list">
                    {it.items.map((s) => (
                      <a key={s.label} role="menuitem" href={s.href || "#"} onClick={follow(s.href)} className="msp-menu-link" tabIndex={open === i ? 0 : -1}>
                        <b>{s.label}</b>
                        {s.text && <span>{s.text}</span>}
                      </a>
                    ))}
                  </div>
                  <a href="#top" className="msp-menu-feature" onClick={follow("#top")} tabIndex={open === i ? 0 : -1}>
                    <span className="msp-menu-art">{open === i && <Meadow scene="resolve" />}</span>
                    <b>Watch it clear a queue</b>
                    <span>The inbox at the top of this page is live.</span>
                  </a>
                </div>
              </div>
            ) : (
              <a key={it.label} className="msp-nav-link" href={it.href || "#"} onClick={follow(it.href)}>
                {it.label}
              </a>
            )
          )}
        </nav>
        <div className="msp-nav-actions">
          {login && (
            <a className="msp-nav-link msp-login" href={login.href || "#"} onClick={follow(login.href)}>
              {login.label}
            </a>
          )}
          <Button onClick={() => start()} className="msp-nav-cta">
            {cta}
          </Button>
          <button type="button" className="msp-burger" aria-label={sheet ? "Close menu" : "Open menu"} aria-expanded={sheet} onClick={() => setSheet(!sheet)}>
            <Icon d={sheet ? "close" : "menu"} size={20} />
          </button>
        </div>
      </div>
      <div className="msp-sheet" data-open={sheet ? "" : undefined} aria-hidden={!sheet}>
        <div className="msp-wrap">
          {items.map((it) => (
            <div key={it.label} className="msp-sheet-group">
              {it.items ? (
                <>
                  <p className="msp-sheet-head">{it.label}</p>
                  {it.items.map((s) => (
                    <a key={s.label} href={s.href || "#"} onClick={follow(s.href)} tabIndex={sheet ? 0 : -1}>
                      {s.label}
                    </a>
                  ))}
                </>
              ) : (
                <a href={it.href || "#"} onClick={follow(it.href)} tabIndex={sheet ? 0 : -1} className="msp-sheet-top">
                  {it.label}
                </a>
              )}
            </div>
          ))}
          <div className="msp-sheet-actions">
            {login && (
              <a href={login.href || "#"} onClick={follow(login.href)} tabIndex={sheet ? 0 : -1} className="msp-btn msp-btn-line">
                <span>{login.label}</span>
              </a>
            )}
            <Button
              onClick={() => {
                setSheet(false)
                start()
              }}
            >
              {cta}
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}

/* ---------- the hero's inbox, on autopilot ---------- */

type Item = { id: number; t: number; born: number; final: "resolved" | "handed" }

const READ_MS = 1300
const DRAFT_MS = 2600
const ARRIVE_MS = 5200

function statusOf(item: Item, now: number) {
  const age = now - item.born
  if (age < READ_MS) return "reading"
  if (age < READ_MS + DRAFT_MS) return "drafting"
  return item.final
}

function ago(ms: number) {
  const m = Math.floor(ms / 60000)
  if (m < 1) return "now"
  if (m < 60) return m + "m"
  return Math.floor(m / 60) + "h"
}

const CHANNEL_ICON = { email: "mail", chat: "chat", whatsapp: "phone" } as { [k: string]: string }

function HeroApp({ tickets, workspace, agent, live, narrow: slim }: { tickets: MspTicket[]; workspace: string; agent: string; live: boolean; narrow?: boolean }) {
  const { brand } = React.useContext(BrandCtx)
  const env = React.useContext(PaintCtx)
  const reduced = env ? env.reduced : false
  const [now, setNow] = React.useState(0)
  const [auto, setAuto] = React.useState(true)
  const [items, setItems] = React.useState([] as Item[])
  const [sel, setSel] = React.useState(-1)
  const [follow, setFollow] = React.useState(true)
  const [resolved, setResolved] = React.useState(1246)
  const next = React.useRef(0)
  const lastArrive = React.useRef(0)
  const narrow = React.useRef(null as HTMLDivElement | null)

  // seed the list with a quiet morning's worth of finished tickets
  React.useEffect(() => {
    const t0 = performance.now()
    const n = Math.min(6, tickets.length)
    const seed = [] as Item[]
    for (let i = 0; i < n; i++) seed.push({ id: i, t: i, born: t0 - (READ_MS + DRAFT_MS) - (i * 4 + 2) * 60000 - i * 37000, final: tickets[i].handTo ? "handed" : "resolved" })
    // the newest is still being written
    if (seed.length) seed[0].born = t0 - READ_MS - 400
    next.current = n
    lastArrive.current = t0
    setItems(seed)
    setSel(seed.length ? seed[0].id : -1)
    setNow(t0)
  }, [tickets])

  const running = live && auto && !reduced && tickets.length > 1
  const busy = items.some((it) => now - it.born < READ_MS + DRAFT_MS)

  React.useEffect(() => {
    if (!live || (!running && !busy)) return
    const id = window.setInterval(() => {
      const t = performance.now()
      setNow(t)
      if (running && t - lastArrive.current > ARRIVE_MS) {
        lastArrive.current = t
        const ti = next.current % tickets.length
        next.current += 1
        const item = { id: next.current + 1000, t: ti, born: t, final: tickets[ti].handTo ? "handed" : "resolved" } as Item
        setItems((list) => [item, ...list].slice(0, 9))
        if (!tickets[ti].handTo) window.setTimeout(() => setResolved((r) => r + 1), READ_MS + DRAFT_MS)
      }
    }, 120)
    return () => window.clearInterval(id)
  }, [live, running, busy, tickets])

  React.useEffect(() => {
    if (follow && items.length) setSel(items[0].id)
  }, [items, follow])

  const current = items.find((it) => it.id === sel) || items[0]
  const ticket = current ? tickets[current.t] : null
  const status = current ? statusOf(current, now) : "resolved"
  const age = current ? now - current.born : 0
  const shown = ticket ? (status === "reading" ? 0 : status === "drafting" ? Math.floor((ticket.reply.length * (age - READ_MS)) / DRAFT_MS) : ticket.reply.length) : 0
  const handed = items.filter((it) => statusOf(it, now) === "handed").length + 7

  return (
    <div className="msp-app" ref={narrow}>
      <div className="msp-app-bar">
        <span className="msp-app-dots" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <span className="msp-app-ws">
          <Mark size={18} />
          {workspace}
          <Icon d="down" size={12} />
        </span>
        <label className="msp-switch">
          <input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} />
          <span className="msp-switch-track" aria-hidden="true">
            <span />
          </span>
          Autopilot
        </label>
        <span className="msp-app-search">
          <Icon d="search" size={13} />
          Search tickets
          <kbd>/</kbd>
        </span>
      </div>
      <div className="msp-app-body" data-narrow={slim ? "" : undefined}>
        <aside className="msp-app-side" aria-label="Views">
          <p className="msp-app-label">Inbox</p>
          <span className="msp-side-row" data-on="">
            <Icon d="inbox" size={14} />
            All open
            <em>{items.filter((it) => statusOf(it, now) !== "resolved").length + 14}</em>
          </span>
          <span className="msp-side-row">
            <Icon d="user" size={14} />
            Assigned to {agent}
            <em>{handed}</em>
          </span>
          <span className="msp-side-row">
            <Icon d="spark" size={14} />
            Resolved by {brand}
            <em className="msp-count">{fmt(resolved)}</em>
          </span>
          <span className="msp-side-row">
            <Icon d="hand" size={14} />
            Handed off
          </span>
          <p className="msp-app-label">Channels</p>
          <span className="msp-side-row">
            <Icon d="mail" size={14} />
            Email
          </span>
          <span className="msp-side-row">
            <Icon d="chat" size={14} />
            Live chat
          </span>
          <span className="msp-side-row">
            <Icon d="phone" size={14} />
            WhatsApp
          </span>
        </aside>
        <div className="msp-app-list" role="listbox" aria-label="Tickets">
          <div className="msp-list-head">
            <b>All open</b>
            <span>{running ? "Live" : auto ? "Paused" : "Autopilot off"}</span>
          </div>
          {items.map((it) => {
            const tk = tickets[it.t]
            const st = statusOf(it, now)
            return (
              <button
                key={it.id}
                type="button"
                role="option"
                aria-selected={it.id === (current && current.id)}
                className="msp-row"
                data-new={now - it.born < 900 ? "" : undefined}
                onClick={() => {
                  setSel(it.id)
                  setFollow(it.id === items[0].id)
                }}
              >
                <Avatar name={tk.name} size={26} />
                <span className="msp-row-main">
                  <span className="msp-row-top">
                    <b>{tk.name}</b>
                    <time>{ago(now - it.born)}</time>
                  </span>
                  <span className="msp-row-sub">{tk.subject}</span>
                </span>
                <span className="msp-chip" data-st={st}>
                  {st === "reading" ? "Reading" : st === "drafting" ? "Drafting" : st === "handed" ? "To " + (tk.handTo || "team") : "Resolved"}
                </span>
              </button>
            )
          })}
        </div>
        {ticket && current && (
          <section className="msp-app-convo" aria-label={"Conversation with " + ticket.name} aria-live="polite">
            <div className="msp-convo-head">
              <div>
                <b>{ticket.subject}</b>
                <span>
                  <Icon d={CHANNEL_ICON[ticket.channel || "email"]} size={12} />
                  {ticket.name} via {ticket.channel === "whatsapp" ? "WhatsApp" : ticket.channel === "chat" ? "chat" : "email"}
                </span>
              </div>
              {!follow && (
                <button type="button" className="msp-follow" onClick={() => setFollow(true)}>
                  <i />
                  Follow live
                </button>
              )}
            </div>
            <div className="msp-bubble msp-bubble-in">
              <Avatar name={ticket.name} size={22} />
              <p>{ticket.message}</p>
            </div>
            <div className="msp-bubble msp-bubble-out" data-st={status}>
              <Avatar name={brand} brand size={22} />
              <div>
                <span className="msp-bubble-who">
                  {brand}
                  {status === "reading" && <em>reading the order history</em>}
                  {status === "drafting" && <em>writing</em>}
                </span>
                {status === "reading" ? (
                  <span className="msp-skeleton" aria-label="Reading">
                    <i />
                    <i />
                    <i />
                  </span>
                ) : (
                  <p>
                    {ticket.reply.slice(0, shown)}
                    {status === "drafting" && <span className="msp-caret" />}
                  </p>
                )}
              </div>
            </div>
            {(status === "resolved" || status === "handed") && (
              <div className="msp-outcome" data-st={status}>
                <Icon d={status === "handed" ? "hand" : "check"} size={13} />
                {status === "handed" ? "Handed to " + (ticket.handTo || "the team") + " with a summary" : "Resolved in " + (ticket.took || 4) + "s, cited 2 sources"}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  )
}

/* ---------- hero ---------- */

function Hero({ hero, height }: { hero: NonNullable<MspProps["hero"]>; height: string }) {
  const { brand, start, go } = React.useContext(BrandCtx)
  const ref = React.useRef(null as HTMLDivElement | null)
  const view = useInView(ref)
  const [wide, setWide] = React.useState(true)
  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    const on = () => setWide(el.getBoundingClientRect().width > 560)
    on()
    const ro = typeof ResizeObserver === "function" ? new ResizeObserver(on) : null
    if (ro) ro.observe(el)
    return () => {
      if (ro) ro.disconnect()
    }
  }, [])
  return (
    <section className="msp-hero" data-sec="top" style={{ minHeight: "calc(min(" + height + ", 940px) - 68px)" }} aria-labelledby="msp-hero-title">
      <div className="msp-wrap msp-hero-grid">
        <div className="msp-hero-copy">
          {hero.badge && (
            <button type="button" className="msp-badge msp-rise" onClick={() => go("features")}>
              <b>{hero.badgeLabel || "New"}</b>
              {fill(hero.badge, brand)}
              <Icon d="arrow" size={13} />
            </button>
          )}
          <Title as="h1" text={fill(hero.title || "", brand)} className="msp-h1 msp-rise" id="msp-hero-title" />
          {hero.text && <p className="msp-lede msp-rise">{fill(hero.text, brand)}</p>}
          <div className="msp-hero-actions msp-rise">
            {hero.primary && (
              <Button onClick={() => start()} arrow>
                {hero.primary}
              </Button>
            )}
            {hero.secondary && (
              <Button variant="ghost" onClick={() => go("ways")}>
                {hero.secondary}
              </Button>
            )}
          </div>
          {hero.note && <p className="msp-note msp-rise">{hero.note}</p>}
        </div>
        <div className="msp-hero-art msp-rise" ref={ref}>
          <Meadow scene="hero" label="A painted meadow: daisies and long grass leaning in the wind" />
          <Scaled design={wide ? 900 : 400} fit={wide ? 1.0 : 0.86} className="msp-hero-window">
            <HeroApp tickets={hero.tickets || TICKETS} workspace={hero.workspace || "Fernhill Goods"} agent={hero.agent || "Priya"} live={view.now} narrow={!wide} />
          </Scaled>
        </div>
      </div>
    </section>
  )
}

function LogoStrip({ logos, label }: { logos: string[]; label?: string }) {
  const row = [...logos, ...logos]
  return (
    <div className="msp-logos" aria-label={label || "Teams using it"}>
      <div className="msp-logos-track">
        {row.map((l, i) => (
          <Logo key={i} name={l} className={i >= logos.length ? "msp-dup" : undefined} />
        ))}
      </div>
    </div>
  )
}

/* ---------- three ways ---------- */

function useTyped(text: string, run: boolean, speed = 18) {
  const [n, setN] = React.useState(0)
  const env = React.useContext(PaintCtx)
  const reduced = env ? env.reduced : false
  React.useEffect(() => {
    if (!run) return
    if (reduced) {
      setN(text.length)
      return
    }
    setN(0)
    let i = 0
    const id = window.setInterval(() => {
      i += 1
      setN(i)
      if (i >= text.length) window.clearInterval(id)
    }, speed)
    return () => window.clearInterval(id)
  }, [text, run, reduced, speed])
  return text.slice(0, n)
}

function WayVignette({ kind, play, brand }: { kind: MspWay["kind"]; play: number; brand: string }) {
  const reply = "Of course! Gifts can come back within 60 days, no receipt needed. I've emailed you a free return label."
  const typed = useTyped(reply, play > 0, 16)
  const done = typed.length === reply.length && play > 0
  const [pct, setPct] = React.useState(0)
  const [stage, setStage] = React.useState(0)
  const env = React.useContext(PaintCtx)
  const reduced = env ? env.reduced : false
  React.useEffect(() => {
    if (!play) return
    if (kind === "learn") {
      if (reduced) return setPct(100)
      setPct(18)
      let v = 18
      const id = window.setInterval(() => {
        v = Math.min(100, v + 3 + Math.random() * 5)
        setPct(v)
        if (v >= 100) window.clearInterval(id)
      }, 70)
      return () => window.clearInterval(id)
    }
    if (kind === "escalate") {
      if (reduced) return setStage(3)
      setStage(0)
      const a = window.setTimeout(() => setStage(1), 350)
      const b = window.setTimeout(() => setStage(2), 1150)
      const c = window.setTimeout(() => setStage(3), 1950)
      return () => [a, b, c].forEach((t) => window.clearTimeout(t))
    }
  }, [play, kind, reduced])

  if (kind === "learn") {
    const rows = [
      { icon: "book", name: "Help center", meta: "142 articles", st: "done" },
      { icon: "bag", name: "Shop orders", meta: "Live sync", st: "done" },
      { icon: "history", name: "Past tickets", meta: "18,240 replies", st: pct >= 100 ? "done" : "learning" },
      { icon: "doc", name: "Returns policy", meta: "Notion", st: pct >= 100 ? "done" : pct > 60 ? "learning" : "queued" },
    ]
    return (
      <div className="msp-vig">
        <p className="msp-vig-head">
          <b>Knowledge</b>
          <span>{pct >= 100 ? "Up to date" : "Learning " + Math.floor(pct) + "%"}</span>
        </p>
        {rows.map((r) => (
          <div key={r.name} className="msp-src">
            <span className="msp-src-icon">
              <Icon d={r.icon} size={14} />
            </span>
            <span className="msp-src-main">
              <b>{r.name}</b>
              <span>{r.meta}</span>
            </span>
            <span className="msp-chip" data-st={r.st === "done" ? "resolved" : r.st === "learning" ? "drafting" : "queued"}>
              {r.st === "done" ? "Synced" : r.st === "learning" ? "Learning" : "Queued"}
            </span>
          </div>
        ))}
        <span className="msp-meter" aria-hidden="true">
          <i style={{ width: pct + "%" }} />
        </span>
      </div>
    )
  }
  if (kind === "escalate") {
    return (
      <div className="msp-vig">
        <div className="msp-bubble msp-bubble-in msp-seq" data-show={stage >= 1 ? "" : undefined}>
          <Avatar name="Lena Fischer" size={22} />
          <p>Third late order this month. I'd like a refund, please.</p>
        </div>
        <p className="msp-handoff" data-show={stage >= 2 ? "" : undefined}>
          <Icon d="hand" size={12} />
          {brand} handed this to Priya, with a summary
        </p>
        <div className="msp-bubble msp-bubble-in msp-bubble-agent msp-seq" data-show={stage >= 3 ? "" : undefined}>
          <Avatar name="Priya Raman" size={22} />
          <p>I'm sorry, Lena. Refund sent for all three, and the next one ships free.</p>
        </div>
      </div>
    )
  }
  return (
    <div className="msp-vig">
      <div className="msp-bubble msp-bubble-in">
        <Avatar name="Sam Ortiz" size={22} />
        <p>Can I return a gift without the receipt?</p>
      </div>
      <div className="msp-bubble msp-bubble-out">
        <Avatar name={brand} brand size={22} />
        <p>
          {typed || " "}
          {!done && play > 0 && <span className="msp-caret" />}
        </p>
      </div>
      <p className="msp-outcome" data-st="resolved" data-show={done ? "" : undefined}>
        <Icon d="check" size={13} />
        Resolved in 4s
      </p>
    </div>
  )
}

function WayCard({ way, brand }: { way: MspWay; brand: string }) {
  const ref = React.useRef(null as HTMLElement | null)
  const view = useInView(ref, "0px 0px -20% 0px")
  const [play, setPlay] = React.useState(0)
  React.useEffect(() => {
    if (view.seen) setPlay((p) => p || 1)
  }, [view.seen])
  const replay = () => setPlay((p) => p + 1)
  return (
    <article ref={ref} className="msp-way msp-rise" onPointerEnter={(e) => e.pointerType === "mouse" && replay()} onFocus={replay} tabIndex={0}>
      <div className="msp-way-art">
        <Meadow scene={way.kind} image={way.image} />
        <WayVignette kind={way.kind} play={play} brand={brand} />
      </div>
      <h3>{fill(way.title, brand)}</h3>
      <p>{fill(way.text, brand)}</p>
    </article>
  )
}

/* ---------- the feature story ---------- */

function SmarterCard() {
  const [range, setRange] = React.useState("7d")
  const data = RANGES[range]
  const rate = useTween(data.rate, true, 700)
  const learned = useTween(data.learned, true, 700)
  return (
    <div className="msp-card msp-fcard">
      <div className="msp-fcard-head">
        <b>Performance</b>
        <div className="msp-seg" role="radiogroup" aria-label="Range">
          {Object.keys(RANGES).map((r) => (
            <button key={r} type="button" role="radio" aria-checked={range === r} onClick={() => setRange(r)}>
              {r}
            </button>
          ))}
        </div>
      </div>
      <div className="msp-metrics">
        <div className="msp-metric">
          <span>
            <Icon d="check" size={12} />
            Resolution rate
          </span>
          <b>{Math.round(rate)}%</b>
          <em>+{data.rateDelta}%</em>
        </div>
        <div className="msp-metric">
          <span>
            <Icon d="book" size={12} />
            Tickets learned
          </span>
          <b>{fmt(Math.round(learned))}</b>
          <em>+{fmt(data.learnedDelta)}</em>
        </div>
      </div>
      <svg className="msp-spark" viewBox="0 0 240 46" preserveAspectRatio="none" aria-hidden="true" style={{ maxWidth: "none" }}>
        <path d={sparkPath(data.spark, 240, 40) + " L240 46 L0 46 Z"} className="msp-spark-fill" transform="translate(0 3)" />
        <path d={sparkPath(data.spark, 240, 40)} className="msp-spark-line" transform="translate(0 3)" />
      </svg>
    </div>
  )
}

function VoiceCard() {
  const { brand } = React.useContext(BrandCtx)
  const [voice, setVoice] = React.useState("Friendly")
  const text = voiced(voice, "Maya", brand)
  return (
    <div className="msp-card msp-fcard">
      <div className="msp-voice-who">
        <Avatar name={brand} brand size={28} />
        <span>
          <b>{brand}</b>
          <em>Replying to Maya, order #4471</em>
        </span>
      </div>
      <p className="msp-voice-text" key={voice}>
        {text}
      </p>
      <div className="msp-chips" role="radiogroup" aria-label="Voice">
        {VOICES.map((v) => (
          <button key={v} type="button" role="radio" aria-checked={voice === v} onClick={() => setVoice(v)}>
            {v}
          </button>
        ))}
      </div>
    </div>
  )
}

function OvernightCard() {
  const [last, setLast] = React.useState(false)
  const [hover, setHover] = React.useState(3)
  const vals = NIGHTS.map((n) => (last ? n.last : n.value))
  const max = Math.max(...NIGHTS.map((n) => Math.max(n.value, n.last)))
  const total = useTween(vals[hover], true, 500)
  const prev = last ? null : NIGHTS[hover].last
  const delta = prev ? Math.round(((vals[hover] - prev) / prev) * 100) : null
  return (
    <div className="msp-card msp-fcard">
      <div className="msp-fcard-head">
        <b>Resolved overnight</b>
        <button type="button" className="msp-pill-btn" onClick={() => setLast(!last)} aria-pressed={last}>
          {last ? "Last week" : "This week"}
          <Icon d="down" size={12} />
        </button>
      </div>
      <div className="msp-big">
        <b>{fmt(Math.round(total))}</b>
        {delta !== null && <em data-down={delta < 0 ? "" : undefined}>{(delta >= 0 ? "+" : "") + delta}% vs last week</em>}
        <span>{NIGHTS[hover].day}, 8pm to 8am</span>
      </div>
      <div className="msp-bars" onPointerLeave={() => setHover(3)}>
        {NIGHTS.map((n, i) => (
          <button key={n.day} type="button" className="msp-bar" data-on={hover === i ? "" : undefined} onPointerEnter={() => setHover(i)} onFocus={() => setHover(i)} onClick={() => setHover(i)} aria-label={n.day + ": " + fmt(vals[i]) + " resolved"}>
            <span className="msp-bar-fill" style={{ height: (vals[i] / max) * 100 + "%" }}>
              {hover === i && <em>{fmt(vals[i])}</em>}
            </span>
            <small>{n.day}</small>
          </button>
        ))}
      </div>
    </div>
  )
}

function FeatureCard({ kind }: { kind: MspFeature["kind"] }) {
  if (kind === "voice") return <VoiceCard />
  if (kind === "overnight") return <OvernightCard />
  return <SmarterCard />
}

function Features({ data }: { data: NonNullable<MspProps["features"]> }) {
  const { brand, start } = React.useContext(BrandCtx)
  const items = data.items || FEATURES
  const [active, setActive] = React.useState(0)
  const steps = React.useRef([] as (HTMLElement | null)[])
  React.useEffect(() => {
    if (typeof IntersectionObserver !== "function") return
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.i))
      },
      { rootMargin: "-45% 0px -45% 0px" }
    )
    steps.current.forEach((s) => s && io.observe(s))
    return () => io.disconnect()
  }, [items.length])
  return (
    <section className="msp-section" data-sec="features" aria-labelledby="msp-features-title">
      <div className="msp-wrap">
        {data.eyebrow && <Eyebrow>{fill(data.eyebrow, brand)}</Eyebrow>}
        <Title text={fill(data.title || "", brand)} className="msp-rise" id="msp-features-title" />
        <div className="msp-story">
          <div className="msp-story-stage" aria-hidden="true">
            {items.map((f, i) => (
              <div key={f.kind + i} className="msp-stage-layer" data-on={active === i ? "" : undefined}>
                <Meadow scene={f.kind} image={f.image} active={active === i} />
                <div className="msp-stage-card">
                  <FeatureCard kind={f.kind} />
                </div>
              </div>
            ))}
            <div className="msp-stage-dots">
              {items.map((_, i) => (
                <i key={i} data-on={active === i ? "" : undefined} />
              ))}
            </div>
          </div>
          <div className="msp-story-steps">
            {items.map((f, i) => (
              <article key={f.kind + i} className="msp-step" data-i={i} data-on={active === i ? "" : undefined} ref={(el) => {
                  steps.current[i] = el
                }}>
                <div className="msp-step-media">
                  <Meadow scene={f.kind} image={f.image} />
                  <div className="msp-stage-card">
                    <FeatureCard kind={f.kind} />
                  </div>
                </div>
                <div className="msp-step-copy">
                  <span className="msp-step-n">{"0" + (i + 1)}</span>
                  <h3>{fill(f.title, brand)}</h3>
                  <p>{fill(f.text, brand)}</p>
                  {data.button && (
                    <Button variant="solid" onClick={() => start()}>
                      {fill(data.button, brand)}
                    </Button>
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- platform tour ---------- */

const TRIAGE = [
  { name: "Maya Okafor", subject: "Where is order #4471?", topic: "Shipping", pri: "Normal", mood: 0, conf: 96 },
  { name: "Lena Fischer", subject: "Vase arrived cracked", topic: "Damage", pri: "Urgent", mood: -2, conf: 91 },
  { name: "Arjun Mehta", subject: "Discount code not working", topic: "Billing", pri: "Normal", mood: -1, conf: 94 },
  { name: "Chloé Martin", subject: "Wrong colour delivered", topic: "Returns", pri: "High", mood: -1, conf: 89 },
  { name: "Sofia Rossi", subject: "Do you ship to Norway?", topic: "Shipping", pri: "Low", mood: 1, conf: 98 },
  { name: "Owen Price", subject: "VAT invoice for my company", topic: "Billing", pri: "Normal", mood: 0, conf: 97 },
  { name: "Daniel Kim", subject: "Pause my subscription", topic: "Account", pri: "Low", mood: 0, conf: 95 },
]

const AGENTS = [
  { name: "Priya Raman", skills: ["Refunds", "EN", "HI"], load: 0.42, state: "Next up" },
  { name: "Sam Ortiz", skills: ["Returns", "EN", "ES"], load: 0.7, state: "Busy" },
  { name: "Noor Haddad", skills: ["Billing", "EN", "AR"], load: 0.28, state: "Available" },
  { name: "Jonas Berg", skills: ["Wholesale", "EN", "NO"], load: 0.9, state: "Away at 5pm" },
]

const WEEKS = [58, 61, 60, 66, 69, 68, 73, 76, 79, 81, 84, 87]

function PlatformView({ kind }: { kind: MspPlatformTab["kind"] }) {
  const { brand } = React.useContext(BrandCtx)
  if (kind === "routing") {
    return (
      <div className="msp-pv msp-pv-routing">
        <div className="msp-route-in">
          <Avatar name="Lena Fischer" size={26} />
          <span>
            <b>Vase arrived cracked</b>
            <em>Refund over $200, upset customer, English</em>
          </span>
          <span className="msp-chip" data-st="handed">
            Routing
          </span>
        </div>
        <div className="msp-route-summary">
          <Icon d="spark" size={13} />
          <p>
            <b>Summary for Priya:</b> second damaged item this year, photos attached, wants a replacement before Saturday. Suggested: reship today and refund delivery.
          </p>
        </div>
        <div className="msp-agents">
          {AGENTS.map((a, i) => (
            <div key={a.name} className="msp-agent" data-on={i === 0 ? "" : undefined} style={{ animationDelay: i * 60 + "ms" }}>
              <Avatar name={a.name} size={28} />
              <span className="msp-agent-main">
                <b>{a.name}</b>
                <span className="msp-tags">
                  {a.skills.map((s) => (
                    <i key={s}>{s}</i>
                  ))}
                </span>
              </span>
              <span className="msp-load" aria-label={"Load " + Math.round(a.load * 100) + "%"}>
                <i style={{ width: a.load * 100 + "%" }} />
              </span>
              <em>{a.state}</em>
            </div>
          ))}
        </div>
      </div>
    )
  }
  if (kind === "reporting") {
    const line = sparkPath(WEEKS, 460, 120)
    return (
      <div className="msp-pv msp-pv-report">
        <div className="msp-kpis">
          <div>
            <span>Resolution rate</span>
            <b>87%</b>
            <em>+29 pts</em>
          </div>
          <div>
            <span>Hours saved</span>
            <b>1,412</b>
            <em>this quarter</em>
          </div>
          <div>
            <span>CSAT</span>
            <b>4.8</b>
            <em>+0.6</em>
          </div>
        </div>
        <div className="msp-report-row">
          <div className="msp-chart">
            <p>Resolved by {brand}, last 12 weeks</p>
            <svg viewBox="0 0 460 130" aria-hidden="true" style={{ maxWidth: "none" }}>
              {[0, 1, 2, 3].map((g) => (
                <line key={g} x1="0" x2="460" y1={5 + g * 40} y2={5 + g * 40} className="msp-grid" />
              ))}
              <path d={line + " L460 130 L0 130 Z"} className="msp-spark-fill" transform="translate(0 5)" />
              <path d={line} className="msp-spark-line msp-draw" transform="translate(0 5)" pathLength={1} />
            </svg>
          </div>
          <div className="msp-gaps">
            <p>Gaps in your docs</p>
            {[
              ["Gift cards abroad", 64],
              ["Bulk order discounts", 41],
              ["Engraving lead times", 27],
            ].map(([q, n]) => (
              <span key={q as string}>
                {q}
                <em>{n} asks</em>
              </span>
            ))}
          </div>
        </div>
      </div>
    )
  }
  return (
    <div className="msp-pv">
      <div className="msp-table" role="table" aria-label={kind === "resolve" ? "Resolved tickets" : "Triaged tickets"}>
        <div className="msp-tr msp-th" role="row">
          <span role="columnheader">Ticket</span>
          <span role="columnheader">{kind === "resolve" ? "Outcome" : "Topic"}</span>
          <span role="columnheader">{kind === "resolve" ? "Time" : "Priority"}</span>
          <span role="columnheader">{kind === "resolve" ? "Sources" : "Mood"}</span>
          <span role="columnheader">Confidence</span>
        </div>
        {TRIAGE.map((t, i) => (
          <div key={t.name} className="msp-tr" role="row" style={{ animationDelay: i * 45 + "ms" }}>
            <span role="cell" className="msp-td-main">
              <Avatar name={t.name} size={22} />
              <span>
                <b>{t.name}</b>
                <em>{t.subject}</em>
              </span>
            </span>
            {kind === "resolve" ? (
              <>
                <span role="cell">
                  <span className="msp-chip" data-st={t.pri === "Urgent" || t.pri === "High" ? "handed" : "resolved"}>
                    {t.pri === "Urgent" || t.pri === "High" ? "Drafted" : "Resolved"}
                  </span>
                </span>
                <span role="cell" className="msp-mono">
                  {3 + ((i * 7) % 9)}s
                </span>
                <span role="cell" className="msp-mono">
                  {1 + (i % 3)} cited
                </span>
              </>
            ) : (
              <>
                <span role="cell">
                  <span className="msp-tag">{t.topic}</span>
                </span>
                <span role="cell">
                  <span className="msp-pri" data-p={t.pri}>
                    {t.pri}
                  </span>
                </span>
                <span role="cell">
                  <span className="msp-mood" data-m={t.mood}>
                    {t.mood > 0 ? "Happy" : t.mood < -1 ? "Upset" : t.mood < 0 ? "Annoyed" : "Neutral"}
                  </span>
                </span>
              </>
            )}
            <span role="cell" className="msp-conf">
              <i style={{ width: t.conf + "%" }} />
              {t.conf}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function Platform({ data }: { data: NonNullable<MspProps["platform"]> }) {
  const { brand, start } = React.useContext(BrandCtx)
  const env = React.useContext(PaintCtx)
  const reduced = env ? env.reduced : false
  const tabs = data.tabs || PLATFORM
  const [tab, setTab] = React.useState(0)
  const [held, setHeld] = React.useState(false)
  const [manual, setManual] = React.useState(false)
  const ref = React.useRef(null as HTMLDivElement | null)
  const view = useInView(ref)
  const auto = !manual && !held && !reduced && view.now
  const cur = tabs[Math.min(tab, tabs.length - 1)]
  const titles = { triage: "Triage", resolve: "Auto-resolved today", routing: "Routing", reporting: "Reports" } as { [k: string]: string }
  const pick = (i: number) => {
    setManual(true)
    setTab(i)
  }
  return (
    <section className="msp-section" data-sec="platform" aria-labelledby="msp-platform-title">
      <div className="msp-wrap">
        {data.eyebrow && <Eyebrow>{fill(data.eyebrow, brand)}</Eyebrow>}
        <Title text={fill(data.title || "", brand)} className="msp-rise" id="msp-platform-title" />
        <div className="msp-tour msp-rise" ref={ref} onPointerEnter={() => setHeld(true)} onPointerLeave={() => setHeld(false)} onFocusCapture={() => setHeld(true)} onBlurCapture={() => setHeld(false)}>
          <div className="msp-tabs" role="tablist" aria-label="Platform">
            {tabs.map((t, i) => (
              <button
                key={t.label}
                type="button"
                role="tab"
                id={"msp-tab-" + i}
                aria-selected={tab === i}
                aria-controls="msp-tabpanel"
                tabIndex={tab === i ? 0 : -1}
                className="msp-tab"
                onClick={() => pick(i)}
                onKeyDown={(e) => {
                  if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
                    e.preventDefault()
                    const n = (i + (e.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length
                    pick(n)
                    const el = document.getElementById("msp-tab-" + n)
                    if (el) el.focus()
                  }
                }}
              >
                <Icon d={{ triage: "tag", resolve: "bolt", routing: "route", reporting: "chart" }[t.kind]} size={15} />
                {t.label}
                {tab === i && <span className="msp-tab-progress" data-run={auto ? "" : undefined} onAnimationEnd={() => auto && setTab((tab + 1) % tabs.length)} />}
              </button>
            ))}
          </div>
          <div className="msp-tour-body" role="tabpanel" id="msp-tabpanel" aria-labelledby={"msp-tab-" + tab}>
            <div className="msp-tour-copy" key={"c" + tab}>
              <h3>{fill(cur.title, brand)}</h3>
              <ul>
                {cur.points.map((p) => (
                  <li key={p.title}>
                    <span className="msp-tick">
                      <Icon d="check" size={13} stroke={2} />
                    </span>
                    <span>
                      <b>{fill(p.title, brand)}</b>
                      {fill(p.text, brand)}
                    </span>
                  </li>
                ))}
              </ul>
              {data.button && (
                <Button onClick={() => start()} className="msp-wide" arrow>
                  {fill(data.button, brand)}
                </Button>
              )}
            </div>
            <div className="msp-tour-art">
              <Meadow scene="platform" />
              <Scaled design={760} fit={0.9} className="msp-tour-window">
                <div className="msp-app msp-app-tour">
                  <div className="msp-app-bar">
                    <span className="msp-app-dots" aria-hidden="true">
                      <i />
                      <i />
                      <i />
                    </span>
                    <span className="msp-app-ws">
                      <Mark size={18} />
                      {titles[cur.kind]}
                    </span>
                    <span className="msp-app-search">
                      <Icon d="search" size={13} />
                      Filter
                    </span>
                  </div>
                  <div className="msp-tour-view" key={cur.kind}>
                    <PlatformView kind={cur.kind} />
                  </div>
                </div>
              </Scaled>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- security ---------- */

function Security({ data }: { data: NonNullable<MspProps["security"]> }) {
  const { brand } = React.useContext(BrandCtx)
  const items = data.items || SECURITY
  return (
    <section className="msp-section msp-band" data-sec="security" aria-labelledby="msp-security-title">
      <div className="msp-wrap msp-center">
        {data.eyebrow && <Eyebrow>{fill(data.eyebrow, brand)}</Eyebrow>}
        <Title text={fill(data.title || "", brand)} className="msp-rise" id="msp-security-title" />
        {data.text && <p className="msp-sub msp-rise">{fill(data.text, brand)}</p>}
        <div className="msp-sec-grid">
          {items.map((s) => (
            <article key={s.title} className="msp-sec msp-rise">
              <span className="msp-sec-icon">
                <Icon d={s.icon || "shield"} size={18} />
              </span>
              <h3>{fill(s.title, brand)}</h3>
              <p>{fill(s.text, brand)}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ---------- pricing ---------- */

const VOLUMES = [100, 500, 1000, 2000, 3000, 5000, 7500, 10000, 15000, 20000]

function Price({ value }: { value: number }) {
  const v = useTween(value, true, 450)
  return <>{"$" + fmt(Math.round(v))}</>
}

function Pricing({ data, logos }: { data: NonNullable<MspProps["pricing"]>; logos: string[] | null }) {
  const { brand, start, sales } = React.useContext(BrandCtx)
  const tiers = data.tiers || TIERS
  const discount = data.yearlyDiscount === undefined ? 0.2 : data.yearlyDiscount
  const [yearly, setYearly] = React.useState(false)
  const [vi, setVi] = React.useState(3)
  const tickets = VOLUMES[vi]
  return (
    <section className="msp-section" data-sec="pricing" aria-labelledby="msp-pricing-title">
      <div className="msp-wrap msp-center">
        {data.eyebrow && <Eyebrow>{fill(data.eyebrow, brand)}</Eyebrow>}
        <Title text={fill(data.title || "", brand)} className="msp-rise" id="msp-pricing-title" />
        <div className="msp-price-controls msp-rise">
          <div className="msp-toggle" role="radiogroup" aria-label="Billing">
            <button type="button" role="radio" aria-checked={!yearly} onClick={() => setYearly(false)}>
              Monthly
            </button>
            <button type="button" role="radio" aria-checked={yearly} onClick={() => setYearly(true)}>
              Yearly <em>save {Math.round(discount * 100)}%</em>
            </button>
          </div>
          <label className="msp-volume">
            <span>
              Tickets a month <b>{fmt(tickets)}</b>
            </span>
            <input type="range" min={0} max={VOLUMES.length - 1} step={1} value={vi} onChange={(e) => setVi(Number(e.target.value))} aria-valuetext={fmt(tickets) + " tickets a month"} style={{ ["--p" as string]: (vi / (VOLUMES.length - 1)) * 100 + "%" } as React.CSSProperties} />
          </label>
        </div>
        <div className="msp-tiers">
          {tiers.map((t) => {
            const price = tierPrice(t, tickets, yearly, discount)
            const fits = tierFits(t, tickets)
            return (
              <article key={t.name} className="msp-tier msp-rise" data-featured={t.featured ? "" : undefined} data-dim={fits ? undefined : ""}>
                {t.featured && (
                  <div className="msp-tier-art" aria-hidden="true">
                    <Meadow scene="pricing" />
                  </div>
                )}
                <div className="msp-tier-body">
                  <p className="msp-tier-name">
                    {t.name}
                    {t.featured && <span className="msp-flag">Most popular</span>}
                  </p>
                  <p className="msp-tier-price">
                    {price === null ? <b>Custom</b> : <b><Price value={price} /></b>}
                    {price !== null && <span>/ month{yearly && price > 0 ? ", billed yearly" : ""}</span>}
                  </p>
                  <p className="msp-tier-text">{fill(t.text, brand)}</p>
                  {!fits && <p className="msp-tier-warn">Covers up to {fmt(t.included || 0)} tickets a month.</p>}
                  <p className="msp-tier-inc">Includes</p>
                  <ul>
                    {t.features.map((f) => (
                      <li key={f}>
                        <Icon d="check" size={14} stroke={2} />
                        {fill(f, brand)}
                      </li>
                    ))}
                  </ul>
                  <Button variant={t.featured ? "solid" : "line"} className="msp-wide" onClick={() => (t.price === null ? sales() : start())}>
                    {fill(t.button || "Get started", brand)}
                  </Button>
                </div>
              </article>
            )
          })}
        </div>
        {logos && logos.length > 0 && (
          <div className="msp-trust msp-rise">
            <p>{fill(data.trust || "Trusted by 1,200+ support teams", brand)}</p>
            <div>
              {logos.slice(0, 5).map((l) => (
                <Logo key={l} name={l} />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

/* ---------- stories ---------- */

function Stat({ s, run }: { s: MspStory["stats"][number]; run: boolean }) {
  const v = useTween(s.value, run, 1100)
  return (
    <div className="msp-stat">
      <b>{(s.prefix || "") + fmt(v, s.decimals || 0) + (s.suffix || "")}</b>
      <span>{s.label}</span>
    </div>
  )
}

function Stories({ data }: { data: NonNullable<MspProps["stories"]> }) {
  const { brand } = React.useContext(BrandCtx)
  const items = data.items || STORIES
  const [i, setI] = React.useState(0)
  const ref = React.useRef(null as HTMLDivElement | null)
  const view = useInView(ref, "0px 0px -15% 0px")
  const s = items[Math.min(i, items.length - 1)]
  const words = fill(s.quote, brand).split(" ")
  const firstStop = words.findIndex((w) => /[.!?]$/.test(w))
  const lead = s.lead === undefined ? (firstStop > -1 && firstStop < words.length - 1 ? firstStop + 1 : Math.ceil(words.length / 2)) : s.lead
  const go = (d: number) => setI((i + d + items.length) % items.length)
  return (
    <section className="msp-section" data-sec="stories" aria-labelledby="msp-stories-title">
      <div className="msp-wrap">
        <div className="msp-head-row">
          <div>
            {data.eyebrow && <Eyebrow>{fill(data.eyebrow, brand)}</Eyebrow>}
            <Title text={fill(data.title || "", brand)} className="msp-rise" id="msp-stories-title" />
          </div>
          {items.length > 1 && (
            <div className="msp-story-nav">
              <button type="button" className="msp-round" onClick={() => go(-1)} aria-label="Previous story">
                <Icon d="prev" size={16} />
              </button>
              <button type="button" className="msp-round" onClick={() => go(1)} aria-label="Next story">
                <Icon d="next" size={16} />
              </button>
            </div>
          )}
        </div>
        <div className="msp-case msp-rise" ref={ref}>
          <div className="msp-case-photo">
            {items.map((it, k) => (
              <div key={k} className="msp-case-layer" data-on={k === i ? "" : undefined}>
                <Meadow scene="story" image={it.image} alt={it.alt} active={k === i} />
              </div>
            ))}
            {items.length > 1 && (
              <div className="msp-case-tabs" role="tablist" aria-label="Stories">
                {items.map((it, k) => (
                  <button key={k} type="button" role="tab" aria-selected={k === i} onClick={() => setI(k)}>
                    {it.company}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="msp-case-copy" key={i} aria-live="polite">
            <Logo name={s.company} className="msp-case-logo" />
            <blockquote>
              <p>
                <span className="msp-q-lead">{"“" + words.slice(0, lead).join(" ")}</span> <span className="msp-q-rest">{words.slice(lead).join(" ") + "”"}</span>
              </p>
            </blockquote>
            <p className="msp-case-who">
              <b>{s.name}</b>
              {s.role}, {s.company}
            </p>
            <div className="msp-stats">
              {s.stats.map((st) => (
                <Stat key={st.label} s={st} run={view.seen} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- the wall of quotes ---------- */

function QuoteCard({ q, dup }: { q: MspQuote; dup?: boolean }) {
  const { brand } = React.useContext(BrandCtx)
  return (
    <figure className={"msp-quote" + (dup ? " msp-dup" : "")} aria-hidden={dup || undefined}>
      <Logo name={q.company} />
      <blockquote>{"“" + fill(q.quote, brand) + "”"}</blockquote>
      <figcaption>
        <Avatar name={q.name} size={30} />
        <span>
          <b>{q.name}</b>
          {q.role}, {q.company}
        </span>
      </figcaption>
    </figure>
  )
}

function Testimonials({ data }: { data: NonNullable<MspProps["testimonials"]> }) {
  const { brand } = React.useContext(BrandCtx)
  const items = data.items || QUOTES
  const cols = [0, 1, 2].map((c) => items.filter((_, i) => i % 3 === c))
  return (
    <section className="msp-section" data-sec="voices" aria-labelledby="msp-voices-title">
      <div className="msp-wrap">
        {data.eyebrow && <Eyebrow>{fill(data.eyebrow, brand)}</Eyebrow>}
        <Title text={fill(data.title || "", brand)} className="msp-rise" id="msp-voices-title" />
        <div className="msp-wall msp-rise">
          {cols.map((col, c) => (
            <div key={c} className="msp-wall-col" data-c={c}>
              <div className="msp-wall-track" style={{ animationDuration: 34 + c * 7 + "s" }}>
                {col.map((q, i) => (
                  <QuoteCard key={"a" + i} q={q} />
                ))}
                {col.map((q, i) => (
                  <QuoteCard key={"b" + i} q={q} dup />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ---------- questions ---------- */

function Faq({ data }: { data: NonNullable<MspProps["faq"]> }) {
  const { brand } = React.useContext(BrandCtx)
  const items = data.items || FAQ
  const [open, setOpen] = React.useState(-1)
  const half = Math.ceil(items.length / 2)
  const cols = [items.slice(0, half), items.slice(half)]
  const uid = React.useId().replace(/:/g, "")
  return (
    <section className="msp-section" data-sec="faq" aria-labelledby="msp-faq-title">
      <div className="msp-wrap">
        {data.eyebrow && <Eyebrow>{fill(data.eyebrow, brand)}</Eyebrow>}
        <Title text={fill(data.title || "", brand)} className="msp-rise" id="msp-faq-title" />
        <div className="msp-faq">
          {cols.map((col, c) => (
            <div key={c} className="msp-faq-col msp-rise">
              {col.map((f, k) => {
                const i = c * half + k
                const on = open === i
                return (
                  <div key={i} className="msp-qa" data-open={on ? "" : undefined}>
                    <button type="button" aria-expanded={on} aria-controls={uid + "-a" + i} id={uid + "-q" + i} onClick={() => setOpen(on ? -1 : i)}>
                      {fill(f.q, brand)}
                      <span className="msp-qa-icon" aria-hidden="true">
                        <Icon d="plus" size={16} />
                      </span>
                    </button>
                    <div className="msp-qa-a" id={uid + "-a" + i} role="region" aria-labelledby={uid + "-q" + i}>
                      <div>
                        <p>{fill(f.a, brand)}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ---------- sign-up band ---------- */

function Cta({ data, onGetStarted, inputRef }: { data: NonNullable<MspProps["cta"]>; onGetStarted?: MspGetStarted; inputRef: { current: HTMLInputElement | null } }) {
  const { brand } = React.useContext(BrandCtx)
  const [email, setEmail] = React.useState("")
  const [state, setState] = React.useState("idle" as "idle" | "invalid" | "sending" | "done" | "error")
  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (state === "sending") return
    if (!validEmail(email)) {
      setState("invalid")
      if (inputRef.current) inputRef.current.focus()
      return
    }
    setState("sending")
    let ok = true
    try {
      if (onGetStarted) {
        const res = await onGetStarted(email.trim())
        if (res === false) ok = false
      } else await new Promise((r) => window.setTimeout(r, 900))
    } catch {
      ok = false
    }
    setState(ok ? "done" : "error")
  }
  const msg = state === "invalid" ? "That doesn't look like a work email yet." : state === "error" ? "Something went wrong. Try again in a moment." : state === "done" ? "Check " + email.trim() + " for your workspace link." : ""
  return (
    <section className="msp-section msp-cta-sec" data-sec="start" aria-labelledby="msp-cta-title">
      <div className="msp-wrap">
        <div className="msp-cta msp-rise">
          <div className="msp-cta-copy">
            <Title text={fill(data.title || "", brand)} id="msp-cta-title" />
            {data.text && <p className="msp-sub">{fill(data.text, brand)}</p>}
            {state === "done" ? (
              <p className="msp-done" role="status">
                <span>
                  <Icon d="check" size={16} stroke={2} />
                </span>
                {msg}
              </p>
            ) : (
              <form className="msp-form" onSubmit={submit} noValidate>
                <label className="msp-visually-hidden" htmlFor="msp-email">
                  Work email
                </label>
                <input
                  ref={inputRef}
                  id="msp-email"
                  type="email"
                  autoComplete="email"
                  placeholder={data.placeholder || "you@company.com"}
                  value={email}
                  aria-invalid={state === "invalid" || undefined}
                  aria-describedby="msp-email-msg"
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (state === "invalid" || state === "error") setState("idle")
                  }}
                />
                <Button type="submit" disabled={state === "sending"} arrow={state !== "sending"}>
                  {state === "sending" ? "Setting up" : fill(data.button || "Get started", brand)}
                </Button>
              </form>
            )}
            <p className="msp-form-msg" id="msp-email-msg" role="alert" data-show={msg && state !== "done" ? "" : undefined}>
              {state !== "done" ? msg : ""}
            </p>
          </div>
          <div className="msp-cta-art">
            <Meadow scene="cta" />
            <div className="msp-card msp-morning">
              <p className="msp-morning-head">
                <Icon d="sun" size={15} />
                {fill(data.morning || "Good morning, Priya", brand)}
              </p>
              <p className="msp-morning-sub">While you were away, {brand}:</p>
              <div className="msp-morning-stats">
                <span>
                  <b>214</b>resolved
                </span>
                <span>
                  <b>9</b>for you
                </span>
                <span>
                  <b>4.8</b>CSAT
                </span>
              </div>
              {[
                ["Lena Fischer", "Vase arrived cracked", "Refund"],
                ["Chloé Martin", "Wrong colour delivered", "Swap"],
                ["Jonas Holm", "Wholesale pricing", "Sales"],
              ].map(([n, s, t]) => (
                <div key={n} className="msp-morning-row">
                  <Avatar name={n} size={24} />
                  <span>
                    <b>{n}</b>
                    {s}
                  </span>
                  <i>{t}</i>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- footer ---------- */

function Footer({ data, brand, logo }: { data: NonNullable<MspProps["footer"]>; brand: string; logo?: React.ReactNode }) {
  const { go } = React.useContext(BrandCtx)
  const cols = data.columns || FOOTER
  const link = (l: MspLink) => (e: React.MouseEvent) => {
    if (l.href && l.href.startsWith("#")) {
      e.preventDefault()
      go(l.href.slice(1))
    } else if (!l.href) e.preventDefault()
  }
  return (
    <footer className="msp-footer">
      <div className="msp-wrap">
        <div className="msp-foot-top">
          <div className="msp-foot-brand">
            <a href="#top" className="msp-brand" onClick={link({ label: "", href: "#top" })}>
              {logo || <Mark />}
              <span>{brand}</span>
            </a>
            {data.tagline && <p>{fill(data.tagline, brand)}</p>}
            <div className="msp-socials">
              {[
                ["x", "X"],
                ["in", "LinkedIn"],
                ["ig", "Instagram"],
              ].map(([d, l]) => (
                <a key={d} href="#" onClick={(e) => e.preventDefault()} aria-label={brand + " on " + l}>
                  <Icon d={d} size={16} />
                </a>
              ))}
            </div>
          </div>
          {cols.map((c) => (
            <nav key={c.title} className="msp-foot-col" aria-label={c.title}>
              <p>{c.title}</p>
              {c.links.map((l) => (
                <a key={l.label} href={l.href || "#"} onClick={link(l)}>
                  {l.label}
                </a>
              ))}
            </nav>
          ))}
        </div>
        <div className="msp-foot-bottom">
          <p>{fill(data.legal || "© 2026 {brand}. All rights reserved.", brand)}</p>
          <p className="msp-status">
            <i />
            {data.status || "All systems normal"}
          </p>
        </div>
      </div>
    </footer>
  )
}

/* ---------- the page ---------- */

function tokensFor(palette: MspProps["palette"], dark: boolean) {
  const base = typeof palette === "string" ? PALETTES[palette] || MEADOW : MEADOW
  const t = dark ? base.dark : base.light
  if (!palette || typeof palette === "string") return t
  const o = ((dark ? palette.dark : palette.light) || {}) as { [k: string]: unknown }
  const paint = { ...t.paint, ...((o.paint || {}) as object) } as MspPaint
  return { ...t, ...o, paint } as MspTokens
}

export default function MallowSupportTemplate({
  brand = "Mallow",
  logo,
  palette = "meadow",
  theme = "system",
  fontHref = DEFAULT_FONT,
  seed = 0,
  images = {},
  nav = {},
  hero = {},
  logos = LOGOS,
  ways = {},
  features = {},
  platform = {},
  security = {},
  pricing = {},
  stories = {},
  testimonials = {},
  faq = {},
  cta = {},
  footer = {},
  onGetStarted,
  onContactSales,
  height = "100svh",
  className,
}: MspProps) {
  const dark = useTheme(theme)
  const reduced = useReducedMotion()
  const root = React.useRef(null as HTMLDivElement | null)
  const input = React.useRef(null as HTMLInputElement | null)
  const tokens = tokensFor(palette, dark)

  const go = React.useCallback(
    (id: string) => {
      const el = root.current && (root.current.querySelector('[data-sec="' + id + '"]') as HTMLElement | null)
      if (!el) return
      const top = el.getBoundingClientRect().top + window.scrollY - (id === "top" ? 200 : 72)
      window.scrollTo({ top: Math.max(0, top), behavior: reduced ? "auto" : "smooth" })
    },
    [reduced]
  )
  const start = React.useCallback(() => {
    if (cta) {
      go("start")
      window.setTimeout(() => input.current && input.current.focus({ preventScroll: true }), reduced ? 0 : 650)
    } else if (onGetStarted) void onGetStarted()
  }, [cta, go, reduced, onGetStarted])
  const sales = React.useCallback(() => {
    if (onContactSales) onContactSales()
    else start()
  }, [onContactSales, start])

  // sections rise into place as they arrive
  React.useEffect(() => {
    const el = root.current
    if (!el || typeof IntersectionObserver !== "function") return
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries)
          if (e.isIntersecting) {
            e.target.setAttribute("data-in", "")
            io.unobserve(e.target)
          }
      },
      { rootMargin: "0px 0px -8% 0px" }
    )
    el.querySelectorAll(".msp-rise").forEach((n) => io.observe(n))
    el.setAttribute("data-ready", "")
    return () => io.disconnect()
  }, [])

  const paintEnv = React.useMemo(() => ({ paint: tokens.paint, dark, reduced, seed, images }), [JSON.stringify(tokens.paint), dark, reduced, seed, JSON.stringify(images)])
  const logoList = logos || LOGOS
  const brandEnv = React.useMemo(() => ({ brand, logos: logoList, start, sales, go }), [brand, logoList, start, sales, go])

  const H = hero ? { ...HERO_DEFAULT, ...hero } : null
  const vars = {
    "--msp-h": height,
    "--msp-paper": tokens.paper,
    "--msp-soft": tokens.soft,
    "--msp-card": tokens.card,
    "--msp-ink": tokens.ink,
    "--msp-muted": tokens.muted,
    "--msp-rule": tokens.rule,
    "--msp-button": tokens.button,
    "--msp-button-ink": tokens.buttonInk,
    "--msp-good": tokens.good,
    "--msp-warn": tokens.warn,
    "--msp-hand": tokens.hand,
    "--msp-sky": tokens.paint.sky[1],
    "--msp-grass": tokens.paint.grass[2],
  } as React.CSSProperties

  return (
    <PaintCtx.Provider value={paintEnv}>
      <BrandCtx.Provider value={brandEnv}>
        <div ref={root} className={"msp-root" + (className ? " " + className : "")} data-theme={dark ? "dark" : "light"} data-reduced={reduced ? "" : undefined} style={vars}>
          {fontHref && <link rel="stylesheet" href={fontHref} />}
          <style>{MSP_CSS}</style>
          {nav && <Nav brand={brand} logo={logo} items={nav.items || NAV} login={nav.login === undefined ? { label: "Log in" } : nav.login} cta={nav.cta || "Start free"} />}
          <main>
            {H && <Hero hero={H} height={height} />}
            {logos && logos.length > 0 && H && <LogoStrip logos={logos} />}
            {ways && (
              <section className="msp-section" data-sec="ways" aria-labelledby="msp-ways-title">
                <div className="msp-wrap">
                  <Eyebrow>{fill(ways.eyebrow || "What {brand} does", brand)}</Eyebrow>
                  <Title text={fill(ways.title || "Three ways {brand}\nruns your support.", brand)} className="msp-rise" id="msp-ways-title" />
                  <div className="msp-ways">
                    {(ways.items || WAYS).map((w) => (
                      <WayCard key={w.title} way={w} brand={brand} />
                    ))}
                  </div>
                </div>
              </section>
            )}
            {features && <Features data={{ eyebrow: "Why {brand}", title: "One inbox.\nEvery question, handled.", button: "Get started", ...features }} />}
            {platform && <Platform data={{ eyebrow: "How teams use it", title: "One platform.\nEvery team it touches.", button: "Try {brand} free", ...platform }} />}
            {security && <Security data={{ eyebrow: "Security", title: "Enterprise-grade security,\nbuilt in by default.", text: "{brand} handles sensitive customer data with the rigor your security team expects.", ...security }} />}
            {pricing && <Pricing data={{ eyebrow: "Pricing", title: "Simple pricing.\nNo surprises.", ...pricing }} logos={logos} />}
            {stories && <Stories data={{ eyebrow: "Customer stories", title: "Big results,\nfrom day one.", ...stories }} />}
            {testimonials && <Testimonials data={{ eyebrow: "Loved by support teams", title: "Less busywork,\nmore breathing room.", ...testimonials }} />}
            {faq && <Faq data={{ eyebrow: "Questions", title: "You have questions.\nWe have answers.", ...faq }} />}
            {cta && <Cta data={{ title: "Give your team\ntheir mornings back.", text: "Connect your help center and let {brand} start resolving tickets today. No setup call, no card.", button: "Get started free", ...cta }} onGetStarted={onGetStarted} inputRef={input} />}
          </main>
          {footer && <Footer data={{ tagline: "The AI support copilot that resolves customer questions instantly, and knows when to call a person.", ...footer }} brand={brand} logo={logo} />}
        </div>
      </BrandCtx.Provider>
    </PaintCtx.Provider>
  )
}

const HERO_DEFAULT = {
  badgeLabel: "New",
  badge: "Overnight autopilot is live",
  title: "Support that answers\nwhile you sleep.",
  text: "{brand} reads your help center and past tickets, resolves routine questions in seconds, and hands the tricky ones to your team with the whole story attached.",
  primary: "Start free",
  secondary: "See how it works",
  note: "Free for 14 days. No card, no setup call.",
}

const DEFAULT_FONT = "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Newsreader:opsz,wght@6..72,300;6..72,400;6..72,500&display=swap"

const MSP_CSS = `
.msp-root{--msp-serif:"Newsreader","Iowan Old Style","Palatino Linotype",Palatino,"Book Antiqua",Georgia,serif;--msp-sans:"Inter","Inter Variable",ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;--msp-radius:18px;--msp-shadow:0 1px 2px rgba(20,24,20,.06),0 18px 40px -18px rgba(20,30,40,.28);--msp-shadow-lg:0 2px 4px rgba(20,24,20,.06),0 40px 80px -30px rgba(18,30,44,.42);--msp-ease:cubic-bezier(.22,1,.36,1);position:relative;min-height:var(--msp-h);background:var(--msp-paper);color:var(--msp-ink);font-family:var(--msp-sans);font-size:15px;line-height:1.55;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;overflow-x:clip;isolation:isolate;color-scheme:light;text-align:left}
.msp-root[data-theme="dark"]{--msp-shadow:0 1px 2px rgba(0,0,0,.4),0 18px 40px -18px rgba(0,0,0,.7);--msp-shadow-lg:0 2px 4px rgba(0,0,0,.4),0 40px 80px -30px rgba(0,0,0,.85);color-scheme:dark}
.msp-root :where(*,*::before,*::after){box-sizing:border-box}
.msp-root :where(svg,canvas,img){display:block;max-width:none}
.msp-root :where(h1,h2,h3,p,ul,ol,figure,blockquote){margin:0;padding:0}
.msp-root :where(ul,ol){list-style:none}
.msp-root :where(a){color:inherit;text-decoration:none}
.msp-root :where(button,input){font:inherit;color:inherit;letter-spacing:inherit;margin:0}
.msp-root :where(button){background:none;border:0;padding:0;cursor:pointer;-webkit-tap-highlight-color:transparent;text-align:inherit}
.msp-root :where(button,a,input,[tabindex]):focus-visible{outline:2px solid var(--msp-ink);outline-offset:3px;border-radius:10px}
.msp-root :where(kbd){font:inherit}
.msp-visually-hidden{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
.msp-wrap{width:100%;max-width:1220px;margin:0 auto;padding:0 28px}
.msp-section{padding:clamp(80px,11vw,150px) 0 0}
.msp-center{text-align:center;display:flex;flex-direction:column;align-items:center}

.msp-title{font-family:var(--msp-serif);font-weight:400;font-size:clamp(34px,4.3vw,56px);line-height:1.04;letter-spacing:-.022em;text-wrap:balance;font-optical-sizing:auto}
.msp-title-a{display:block;color:var(--msp-ink)}
.msp-title-b{display:block;color:color-mix(in srgb,var(--msp-ink) 52%,var(--msp-paper))}
.msp-h1{font-size:clamp(42px,4.6vw,66px);line-height:1.01;letter-spacing:-.028em}
.msp-eyebrow{display:inline-flex;align-items:center;gap:8px;font-size:13px;color:var(--msp-muted);margin-bottom:18px}
.msp-eyebrow .msp-bud{color:var(--msp-ink)}
.msp-sub{color:var(--msp-muted);font-size:16px;max-width:520px;margin-top:18px}

.msp-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;height:42px;padding:0 18px;border-radius:999px;font-size:14px;font-weight:500;letter-spacing:-.005em;white-space:nowrap;transition:transform .25s var(--msp-ease),background-color .2s,box-shadow .25s var(--msp-ease),opacity .2s}
.msp-btn-solid{background:var(--msp-button);color:var(--msp-button-ink);box-shadow:0 1px 0 rgba(255,255,255,.12) inset,0 8px 18px -10px rgba(0,0,0,.6)}
.msp-btn-solid:hover{transform:translateY(-1px);box-shadow:0 1px 0 rgba(255,255,255,.12) inset,0 14px 24px -12px rgba(0,0,0,.6)}
.msp-btn-solid:active{transform:translateY(0) scale(.98)}
.msp-btn-ghost{color:var(--msp-ink);padding:0 12px}
.msp-btn-ghost:hover{background:color-mix(in srgb,var(--msp-ink) 6%,transparent)}
.msp-btn-line{background:var(--msp-card);border:1px solid var(--msp-rule);color:var(--msp-ink)}
.msp-btn-line:hover{border-color:color-mix(in srgb,var(--msp-ink) 30%,transparent)}
.msp-btn:disabled{opacity:.6;cursor:progress}
.msp-btn-arrow{transition:transform .25s var(--msp-ease)}
.msp-btn:hover .msp-btn-arrow{transform:translateX(3px)}
.msp-wide{width:100%}

.msp-nav{position:sticky;top:0;z-index:40;transition:background-color .3s,box-shadow .3s,backdrop-filter .3s}
.msp-nav[data-scrolled]{background:color-mix(in srgb,var(--msp-paper) 82%,transparent);backdrop-filter:blur(14px) saturate(1.3);-webkit-backdrop-filter:blur(14px) saturate(1.3);box-shadow:0 1px 0 var(--msp-rule)}
.msp-nav-row{display:flex;align-items:center;gap:24px;height:68px}
.msp-brand{display:inline-flex;align-items:center;gap:9px;font-weight:600;font-size:17px;letter-spacing:-.02em}
.msp-nav-links{display:flex;align-items:center;gap:4px;margin:0 auto}
.msp-nav-item{position:relative}
.msp-nav-link{display:inline-flex;align-items:center;gap:4px;height:36px;padding:0 12px;border-radius:999px;font-size:14px;color:var(--msp-muted);transition:color .2s,background-color .2s}
.msp-nav-link:hover,.msp-nav-link[aria-expanded="true"]{color:var(--msp-ink);background:color-mix(in srgb,var(--msp-ink) 5%,transparent)}
.msp-chev{transition:transform .25s var(--msp-ease)}
.msp-nav-link[aria-expanded="true"] .msp-chev{transform:rotate(180deg)}
.msp-menu{position:absolute;top:calc(100% + 10px);left:-12px;display:grid;grid-template-columns:300px 210px;gap:8px;padding:8px;border-radius:18px;background:var(--msp-card);box-shadow:var(--msp-shadow-lg),0 0 0 1px var(--msp-rule);opacity:0;visibility:hidden;transform:translateY(-6px) scale(.98);transform-origin:20% 0;transition:opacity .18s,transform .22s var(--msp-ease),visibility 0s .22s}
.msp-menu[data-open]{opacity:1;visibility:visible;transform:none;transition:opacity .2s,transform .3s var(--msp-ease)}
.msp-menu::before{content:"";position:absolute;left:0;right:0;top:-12px;height:12px}
.msp-menu-list{display:flex;flex-direction:column}
.msp-menu-link{display:flex;flex-direction:column;gap:2px;padding:10px 12px;border-radius:12px;transition:background-color .15s}
.msp-menu-link:hover,.msp-menu-link:focus-visible{background:var(--msp-soft)}
.msp-menu-link b{font-weight:500;font-size:14px}
.msp-menu-link span{font-size:12.5px;color:var(--msp-muted)}
.msp-menu-feature{display:flex;flex-direction:column;gap:3px;padding:8px;border-radius:12px;background:var(--msp-soft);font-size:12.5px;color:var(--msp-muted)}
.msp-menu-feature b{font-size:13.5px;font-weight:500;color:var(--msp-ink);margin-top:6px}
.msp-menu-art{position:relative;display:block;height:118px;border-radius:9px;overflow:hidden}
.msp-nav-actions{display:flex;align-items:center;gap:8px}
.msp-nav-cta{height:38px}
.msp-burger{display:none;width:40px;height:40px;align-items:center;justify-content:center;border-radius:12px}
.msp-sheet{display:none}

.msp-hero{position:relative;display:flex;align-items:center;padding:clamp(20px,3vw,40px) 0 clamp(20px,3vw,32px)}
.msp-hero-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.08fr);gap:clamp(28px,5vw,72px);align-items:center}
.msp-hero-copy{display:flex;flex-direction:column;align-items:flex-start}
.msp-badge{display:inline-flex;align-items:center;gap:8px;height:30px;padding:0 10px 0 4px;border-radius:999px;background:var(--msp-card);box-shadow:0 0 0 1px var(--msp-rule);font-size:12.5px;color:var(--msp-muted);margin-bottom:26px;transition:box-shadow .2s}
.msp-badge:hover{box-shadow:0 0 0 1px color-mix(in srgb,var(--msp-ink) 30%,transparent)}
.msp-badge b{height:22px;display:inline-flex;align-items:center;padding:0 8px;border-radius:999px;background:var(--msp-button);color:var(--msp-button-ink);font-weight:500;font-size:11.5px}
.msp-lede{margin-top:24px;max-width:440px;font-size:16.5px;color:var(--msp-muted)}
.msp-hero-actions{display:flex;align-items:center;gap:6px;margin-top:32px;flex-wrap:wrap}
.msp-note{margin-top:16px;font-size:12.5px;color:var(--msp-muted)}
.msp-hero-art{position:relative;aspect-ratio:1.12;border-radius:22px;overflow:hidden;box-shadow:var(--msp-shadow)}
.msp-hero-window{position:absolute;left:8%;top:12%;transform-origin:0 0}
.msp-hero-window .msp-app-convo{padding-right:56px}
.msp-scaled{transform-origin:0 0}

.msp-paint{position:absolute;inset:0;overflow:hidden}
.msp-canvas,.msp-photo{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.msp-canvas{opacity:0;transition:opacity .7s ease}
.msp-canvas[data-painted]{opacity:1}
.msp-root[data-theme="dark"] .msp-photo{filter:brightness(.82) saturate(.9)}

.msp-app{background:var(--msp-card);border-radius:14px;box-shadow:var(--msp-shadow-lg),0 0 0 1px var(--msp-rule);overflow:hidden;font-size:12.5px;line-height:1.45;color:var(--msp-ink);text-align:left}
.msp-app-bar{display:flex;align-items:center;gap:14px;height:44px;padding:0 14px;border-bottom:1px solid var(--msp-rule)}
.msp-app-dots{display:flex;gap:6px}
.msp-app-dots i{width:9px;height:9px;border-radius:50%;background:color-mix(in srgb,var(--msp-ink) 14%,transparent)}
.msp-app-ws{display:inline-flex;align-items:center;gap:7px;font-weight:600}
.msp-app-search{display:inline-flex;align-items:center;gap:7px;height:28px;padding:0 10px;border-radius:8px;background:var(--msp-soft);color:var(--msp-muted);flex:1;max-width:240px;margin-left:auto}
.msp-app-search kbd{margin-left:auto;font-size:10.5px;padding:0 5px;border-radius:4px;box-shadow:0 0 0 1px var(--msp-rule)}
.msp-switch{display:inline-flex;align-items:center;gap:8px;font-weight:500;cursor:pointer;user-select:none;height:28px;padding:0 10px 0 6px;border-radius:999px;box-shadow:0 0 0 1px var(--msp-rule)}
.msp-switch input{position:absolute;opacity:0;width:1px;height:1px}
.msp-switch-track{position:relative;width:30px;height:18px;border-radius:999px;background:color-mix(in srgb,var(--msp-ink) 18%,transparent);transition:background-color .2s}
.msp-switch-track span{position:absolute;left:2px;top:2px;width:14px;height:14px;border-radius:50%;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.25);transition:transform .25s var(--msp-ease)}
.msp-switch input:checked+.msp-switch-track{background:var(--msp-good)}
.msp-switch input:checked+.msp-switch-track span{transform:translateX(12px)}
.msp-switch input:focus-visible+.msp-switch-track{outline:2px solid var(--msp-ink);outline-offset:2px}
.msp-app-body{display:grid;grid-template-columns:204px 268px 1fr;height:470px}
.msp-app-body[data-narrow]{grid-template-columns:1fr}
.msp-app-body[data-narrow] .msp-app-side,.msp-app-body[data-narrow] .msp-app-convo{display:none}
.msp-app-side{padding:12px 10px;border-right:1px solid var(--msp-rule);display:flex;flex-direction:column;gap:2px;background:color-mix(in srgb,var(--msp-soft) 45%,var(--msp-card))}
.msp-app-label{font-size:10.5px;text-transform:uppercase;letter-spacing:.06em;color:var(--msp-muted);padding:8px 8px 4px}
.msp-side-row{display:flex;align-items:center;gap:8px;height:30px;padding:0 8px;border-radius:8px;color:var(--msp-muted);white-space:nowrap}
.msp-side-row[data-on]{background:var(--msp-card);color:var(--msp-ink);box-shadow:0 0 0 1px var(--msp-rule)}
.msp-side-row em{margin-left:auto;font-style:normal;font-size:11px;font-variant-numeric:tabular-nums}
.msp-count{color:var(--msp-good)}
.msp-app-list{border-right:1px solid var(--msp-rule);overflow:hidden;display:flex;flex-direction:column}
.msp-list-head{display:flex;align-items:center;justify-content:space-between;padding:12px 14px 8px}
.msp-list-head span{font-size:11px;color:var(--msp-muted);display:inline-flex;align-items:center;gap:6px}
.msp-list-head span::before{content:"";width:6px;height:6px;border-radius:50%;background:var(--msp-good);animation:msp-pulse 1.8s infinite}
.msp-row{display:flex;align-items:center;gap:10px;padding:9px 12px;margin:0 6px;border-radius:10px;text-align:left;transition:background-color .2s}
.msp-row:hover{background:var(--msp-soft)}
.msp-row[aria-selected="true"]{background:color-mix(in srgb,var(--msp-soft) 80%,var(--msp-card));box-shadow:0 0 0 1px var(--msp-rule)}
.msp-row[data-new]{animation:msp-arrive .7s var(--msp-ease)}
.msp-row-main{display:flex;flex-direction:column;min-width:0;flex:1}
.msp-row-top{display:flex;justify-content:space-between;gap:6px}
.msp-row-top b{font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.msp-row-top time{font-size:10.5px;color:var(--msp-muted);flex:none}
.msp-row-sub{color:var(--msp-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:11.5px}
.msp-avatar{display:inline-flex;align-items:center;justify-content:center;border-radius:50%;flex:none;font-weight:600;letter-spacing:.02em}
.msp-root[data-theme="dark"] .msp-avatar:not(.msp-avatar-brand){filter:brightness(.82) saturate(1.2)}
.msp-avatar-brand{border-radius:30%;overflow:hidden}
.msp-chip{display:inline-flex;align-items:center;gap:5px;height:20px;padding:0 7px;border-radius:999px;font-size:10.5px;font-weight:500;white-space:nowrap;flex:none;background:var(--msp-soft);color:var(--msp-muted)}
.msp-chip::before{content:"";width:5px;height:5px;border-radius:50%;background:currentColor}
.msp-chip[data-st="resolved"]{background:color-mix(in srgb,var(--msp-good) 14%,transparent);color:var(--msp-good)}
.msp-chip[data-st="handed"]{background:color-mix(in srgb,var(--msp-hand) 14%,transparent);color:var(--msp-hand)}
.msp-chip[data-st="drafting"],.msp-chip[data-st="reading"]{background:color-mix(in srgb,var(--msp-warn) 14%,transparent);color:var(--msp-warn)}
.msp-chip[data-st="drafting"]::before,.msp-chip[data-st="reading"]::before{animation:msp-pulse 1s infinite}
.msp-app-convo{padding:16px 18px;display:flex;flex-direction:column;gap:12px;overflow:hidden}
.msp-convo-head{display:flex;justify-content:space-between;align-items:flex-start;gap:10px;padding-bottom:12px;border-bottom:1px solid var(--msp-rule)}
.msp-convo-head b{display:block;font-size:13.5px;font-weight:600}
.msp-convo-head span{display:inline-flex;align-items:center;gap:5px;color:var(--msp-muted);font-size:11.5px}
.msp-follow{display:inline-flex;align-items:center;gap:6px;height:24px;padding:0 9px;border-radius:999px;font-size:11px;font-weight:500;box-shadow:0 0 0 1px var(--msp-rule);flex:none}
.msp-follow i{width:6px;height:6px;border-radius:50%;background:var(--msp-good)}
.msp-bubble{display:flex;gap:9px;align-items:flex-start;transition:opacity .4s,transform .5s var(--msp-ease)}
.msp-bubble p{padding:9px 12px;border-radius:4px 12px 12px 12px;background:var(--msp-soft);max-width:92%}
.msp-bubble-out p,.msp-bubble-out>div{flex:1}
.msp-bubble-out>div{display:flex;flex-direction:column;gap:4px}
.msp-bubble-out p{background:color-mix(in srgb,var(--msp-sky) 16%,var(--msp-card));box-shadow:0 0 0 1px color-mix(in srgb,var(--msp-sky) 30%,transparent);max-width:100%}
.msp-bubble-who{font-size:11px;font-weight:600;display:inline-flex;gap:6px;align-items:center}
.msp-bubble-who em{font-style:normal;font-weight:400;color:var(--msp-muted)}
.msp-bubble-who em::after{content:"";display:inline-block;width:12px;text-align:left;animation:msp-dots 1.2s steps(4) infinite}
.msp-skeleton{display:flex;flex-direction:column;gap:6px;padding:10px 12px;border-radius:4px 12px 12px 12px;background:var(--msp-soft)}
.msp-skeleton i{height:8px;border-radius:4px;background:linear-gradient(90deg,color-mix(in srgb,var(--msp-ink) 8%,transparent),color-mix(in srgb,var(--msp-ink) 16%,transparent),color-mix(in srgb,var(--msp-ink) 8%,transparent));background-size:200% 100%;animation:msp-shimmer 1.2s linear infinite}
.msp-skeleton i:nth-child(2){width:86%}
.msp-skeleton i:nth-child(3){width:60%}
.msp-caret{display:inline-block;width:2px;height:1em;margin-left:1px;vertical-align:-2px;background:currentColor;animation:msp-blink .9s steps(2) infinite}
.msp-outcome{display:inline-flex;align-items:center;gap:6px;align-self:flex-start;margin-left:31px;height:24px;padding:0 9px;border-radius:999px;font-size:11px;font-weight:500;background:color-mix(in srgb,var(--msp-good) 13%,transparent);color:var(--msp-good);animation:msp-pop .45s var(--msp-ease)}
.msp-outcome[data-st="handed"]{background:color-mix(in srgb,var(--msp-hand) 13%,transparent);color:var(--msp-hand)}

.msp-logos{margin-top:clamp(8px,2vw,24px);overflow:hidden;-webkit-mask-image:linear-gradient(90deg,transparent,#000 12%,#000 88%,transparent);mask-image:linear-gradient(90deg,transparent,#000 12%,#000 88%,transparent)}
.msp-logos-track{display:flex;gap:56px;width:max-content;animation:msp-marquee 46s linear infinite;padding:6px 0}
.msp-logos:hover .msp-logos-track{animation-play-state:paused}
.msp-logo{display:inline-flex;align-items:center;gap:8px;font-weight:600;font-size:15px;letter-spacing:-.02em;color:color-mix(in srgb,var(--msp-ink) 62%,var(--msp-paper));white-space:nowrap}

.msp-ways{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px;margin-top:clamp(36px,5vw,64px)}
.msp-way{display:flex;flex-direction:column;border-radius:var(--msp-radius);outline:none}
.msp-way:focus-visible .msp-way-art{outline:2px solid var(--msp-ink);outline-offset:3px}
.msp-way-art{position:relative;aspect-ratio:1.08;border-radius:var(--msp-radius);overflow:hidden;display:flex;align-items:center;justify-content:center;padding:9%}
.msp-way>h3{font-size:15px;font-weight:600;margin-top:20px;letter-spacing:-.01em}
.msp-way>p{font-size:14px;color:var(--msp-muted);margin-top:6px;max-width:340px}
.msp-vig{position:relative;width:100%;max-width:330px;padding:14px;border-radius:14px;background:var(--msp-card);box-shadow:var(--msp-shadow-lg);font-size:12px;line-height:1.45;display:flex;flex-direction:column;gap:10px;transition:transform .5s var(--msp-ease)}
.msp-way:hover .msp-vig{transform:translateY(-4px)}
.msp-vig .msp-outcome{margin-left:31px;animation:none;opacity:0;transform:translateY(6px);transition:opacity .35s,transform .45s var(--msp-ease)}
.msp-vig .msp-outcome[data-show]{opacity:1;transform:none}
.msp-vig-head{display:flex;justify-content:space-between;align-items:center;padding-bottom:4px}
.msp-vig-head span{font-size:11px;color:var(--msp-muted);font-variant-numeric:tabular-nums}
.msp-src{display:flex;align-items:center;gap:10px}
.msp-src-icon{width:28px;height:28px;border-radius:8px;display:inline-flex;align-items:center;justify-content:center;background:var(--msp-soft)}
.msp-src-main{display:flex;flex-direction:column;flex:1;min-width:0}
.msp-src-main b{font-weight:500}
.msp-src-main span{font-size:11px;color:var(--msp-muted)}
.msp-chip[data-st="queued"]::before{opacity:.5}
.msp-meter{display:block;height:4px;border-radius:2px;background:var(--msp-soft);overflow:hidden}
.msp-meter i{display:block;height:100%;background:var(--msp-good);border-radius:2px;transition:width .2s linear}
.msp-handoff{display:flex;align-items:center;gap:6px;justify-content:center;font-size:11px;color:var(--msp-hand);padding:2px 0;opacity:0;transition:opacity .4s}
.msp-handoff::before,.msp-handoff::after{content:"";flex:1;height:1px;background:color-mix(in srgb,var(--msp-hand) 30%,transparent)}
.msp-handoff[data-show]{opacity:1}
.msp-seq{opacity:0;transform:translateY(8px)}
.msp-seq[data-show]{opacity:1;transform:none}
.msp-bubble-agent p{background:color-mix(in srgb,var(--msp-hand) 10%,var(--msp-card));box-shadow:0 0 0 1px color-mix(in srgb,var(--msp-hand) 22%,transparent)}

.msp-story{display:grid;grid-template-columns:minmax(0,1.12fr) minmax(0,.88fr);gap:clamp(32px,5vw,80px);margin-top:clamp(36px,5vw,64px);align-items:start}
.msp-story-stage{position:sticky;top:96px;height:min(640px,calc(100svh - 128px));min-height:420px;border-radius:24px;overflow:hidden;box-shadow:var(--msp-shadow)}
.msp-stage-layer{position:absolute;inset:0;opacity:0;transition:opacity .8s ease,visibility 0s .8s;visibility:hidden}
.msp-stage-layer[data-on]{opacity:1;visibility:visible;transition:opacity .8s ease}
.msp-stage-card{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:8%}
.msp-stage-layer .msp-fcard{transform:translateY(18px) scale(.97);opacity:0;transition:transform .7s var(--msp-ease),opacity .5s}
.msp-stage-layer[data-on] .msp-fcard{transform:none;opacity:1;transition-delay:.12s}
.msp-stage-dots{position:absolute;left:20px;bottom:18px;display:flex;gap:6px}
.msp-stage-dots i{width:6px;height:6px;border-radius:3px;background:rgba(255,255,255,.55);transition:width .4s var(--msp-ease),background-color .3s}
.msp-stage-dots i[data-on]{width:22px;background:#fff}
.msp-story-steps{display:flex;flex-direction:column}
.msp-step{min-height:min(78svh,720px);display:flex;flex-direction:column;justify-content:center}
.msp-step-media{display:none}
.msp-step-copy{display:flex;flex-direction:column;align-items:flex-start;gap:16px;opacity:.32;transition:opacity .5s}
.msp-step[data-on] .msp-step-copy{opacity:1}
.msp-step-n{font-size:12px;color:var(--msp-muted);font-variant-numeric:tabular-nums;padding:3px 9px;border-radius:999px;box-shadow:0 0 0 1px var(--msp-rule)}
.msp-step h3{font-family:var(--msp-serif);font-weight:400;font-size:clamp(28px,2.8vw,38px);line-height:1.1;letter-spacing:-.018em;max-width:420px;text-wrap:balance}
.msp-step p{color:var(--msp-muted);max-width:400px;font-size:15.5px}
.msp-step .msp-btn{margin-top:6px}
.msp-card{background:var(--msp-card);border-radius:16px;box-shadow:var(--msp-shadow-lg),0 0 0 1px color-mix(in srgb,var(--msp-rule) 60%,transparent)}
.msp-fcard{width:100%;max-width:380px;padding:16px;font-size:12.5px;line-height:1.45;display:flex;flex-direction:column;gap:14px}
.msp-fcard-head{display:flex;align-items:center;justify-content:space-between;gap:10px}
.msp-fcard-head b{font-weight:600;font-size:13px}
.msp-seg{display:inline-flex;padding:2px;border-radius:8px;background:var(--msp-soft)}
.msp-seg button{height:24px;padding:0 9px;border-radius:6px;font-size:11px;color:var(--msp-muted);transition:background-color .2s,color .2s}
.msp-seg button[aria-checked="true"]{background:var(--msp-card);color:var(--msp-ink);box-shadow:0 1px 2px rgba(0,0,0,.12)}
.msp-metrics{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.msp-metric{padding:12px;border-radius:12px;background:var(--msp-soft);display:flex;flex-direction:column;gap:4px}
.msp-metric span{display:inline-flex;align-items:center;gap:5px;font-size:11px;color:var(--msp-muted)}
.msp-metric b{font-family:var(--msp-serif);font-weight:400;font-size:34px;line-height:1.05;letter-spacing:-.02em;font-variant-numeric:tabular-nums}
.msp-metric em,.msp-big em{align-self:flex-start;font-style:normal;font-size:10.5px;font-weight:500;padding:1px 7px;border-radius:999px;background:color-mix(in srgb,var(--msp-good) 14%,transparent);color:var(--msp-good)}
.msp-big em[data-down]{background:color-mix(in srgb,var(--msp-warn) 14%,transparent);color:var(--msp-warn)}
.msp-spark{width:100%;height:46px}
.msp-spark-line{fill:none;stroke:var(--msp-good);stroke-width:2;vector-effect:non-scaling-stroke;stroke-linejoin:round;stroke-linecap:round}
.msp-spark-fill{fill:color-mix(in srgb,var(--msp-good) 12%,transparent)}
.msp-voice-who{display:flex;align-items:center;gap:10px}
.msp-voice-who span{display:flex;flex-direction:column}
.msp-voice-who b{font-weight:600}
.msp-voice-who em{font-style:normal;color:var(--msp-muted);font-size:11px}
.msp-voice-text{padding:12px 14px;border-radius:4px 12px 12px 12px;background:color-mix(in srgb,var(--msp-sky) 14%,var(--msp-card));box-shadow:0 0 0 1px color-mix(in srgb,var(--msp-sky) 30%,transparent);min-height:84px;font-size:13px;animation:msp-fade .45s var(--msp-ease)}
.msp-chips{display:flex;flex-wrap:wrap;gap:6px}
.msp-chips button{height:30px;padding:0 12px;border-radius:999px;font-size:12px;box-shadow:0 0 0 1px var(--msp-rule);transition:background-color .2s,color .2s,box-shadow .2s}
.msp-chips button:hover{box-shadow:0 0 0 1px color-mix(in srgb,var(--msp-ink) 30%,transparent)}
.msp-chips button[aria-checked="true"]{background:var(--msp-button);color:var(--msp-button-ink);box-shadow:none}
.msp-pill-btn{display:inline-flex;align-items:center;gap:4px;height:26px;padding:0 9px;border-radius:8px;font-size:11px;color:var(--msp-muted);box-shadow:0 0 0 1px var(--msp-rule)}
.msp-big{display:flex;flex-wrap:wrap;align-items:center;gap:4px 10px;padding:12px;border-radius:12px;background:var(--msp-soft)}
.msp-big b{font-family:var(--msp-serif);font-weight:400;font-size:38px;line-height:1;letter-spacing:-.02em;font-variant-numeric:tabular-nums}
.msp-big em{align-self:center}
.msp-big span{flex-basis:100%;font-size:11px;color:var(--msp-muted)}
.msp-bars{display:grid;grid-template-columns:repeat(7,1fr);gap:8px;height:130px;align-items:end}
.msp-bar{height:100%;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:6px}
.msp-bar small{font-size:10.5px;color:var(--msp-muted)}
.msp-bar-fill{position:relative;width:100%;border-radius:6px;background:color-mix(in srgb,var(--msp-ink) 10%,transparent);transition:height .6s var(--msp-ease),background-color .25s}
.msp-bar[data-on] .msp-bar-fill{background:var(--msp-button)}
.msp-bar-fill em{position:absolute;left:50%;bottom:calc(100% + 6px);transform:translateX(-50%);font-style:normal;font-size:10px;font-weight:600;padding:2px 6px;border-radius:6px;background:var(--msp-button);color:var(--msp-button-ink);white-space:nowrap;animation:msp-pop .3s var(--msp-ease)}

.msp-tour{margin-top:clamp(36px,5vw,64px);border-radius:24px;background:var(--msp-soft);padding:8px}
.msp-tabs{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:4px}
.msp-tab{position:relative;display:flex;align-items:center;justify-content:center;gap:8px;height:46px;border-radius:16px;font-size:13.5px;color:var(--msp-muted);overflow:hidden;transition:background-color .25s,color .2s,box-shadow .25s}
.msp-tab:hover{color:var(--msp-ink)}
.msp-tab[aria-selected="true"]{background:var(--msp-card);color:var(--msp-ink);box-shadow:0 1px 2px rgba(0,0,0,.06),0 0 0 1px var(--msp-rule)}
.msp-tab-progress{position:absolute;left:16px;right:16px;bottom:6px;height:2px;border-radius:1px;background:var(--msp-ink);transform-origin:0 50%;transform:scaleX(0);opacity:.6}
.msp-tab-progress[data-run]{animation:msp-progress 7s linear forwards}
.msp-tour-body{display:grid;grid-template-columns:minmax(0,.7fr) minmax(0,1.3fr);gap:8px;margin-top:8px}
.msp-tour-copy{display:flex;flex-direction:column;gap:22px;padding:clamp(20px,3vw,36px);border-radius:18px;background:var(--msp-card);animation:msp-fade .5s var(--msp-ease)}
.msp-tour-copy h3{font-family:var(--msp-serif);font-weight:400;font-size:clamp(26px,2.4vw,32px);line-height:1.12;letter-spacing:-.018em}
.msp-tour-copy ul{display:flex;flex-direction:column;gap:16px;margin-bottom:auto}
.msp-tour-copy li{display:flex;gap:12px;font-size:13.5px;color:var(--msp-muted)}
.msp-tour-copy li b{display:block;color:var(--msp-ink);font-weight:500;font-size:14px}
.msp-tick{width:22px;height:22px;border-radius:7px;flex:none;display:inline-flex;align-items:center;justify-content:center;background:var(--msp-soft);color:var(--msp-ink)}
.msp-tour-art{position:relative;min-height:520px;border-radius:18px;overflow:hidden}
.msp-tour-window{position:absolute;left:7%;top:9%}
.msp-app-tour .msp-app-search{max-width:160px}
.msp-tour-view{height:480px;overflow:hidden;animation:msp-fade .5s var(--msp-ease)}
.msp-pv{padding:14px}
.msp-table{display:flex;flex-direction:column}
.msp-tr{display:grid;grid-template-columns:2.3fr 1fr 1fr 1fr 1.1fr;align-items:center;gap:10px;padding:10px 8px;border-bottom:1px solid var(--msp-rule);animation:msp-rise-in .5s var(--msp-ease) both}
.msp-th{font-size:10.5px;text-transform:uppercase;letter-spacing:.06em;color:var(--msp-muted);padding-top:2px;animation:none}
.msp-td-main{display:flex;align-items:center;gap:9px;min-width:0}
.msp-td-main>span{display:flex;flex-direction:column;min-width:0}
.msp-td-main b{font-weight:500}
.msp-td-main em{font-style:normal;color:var(--msp-muted);font-size:11.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.msp-tag{display:inline-flex;height:20px;align-items:center;padding:0 7px;border-radius:6px;font-size:10.5px;background:var(--msp-soft)}
.msp-pri{font-size:11px;font-weight:500;color:var(--msp-muted)}
.msp-pri[data-p="Urgent"]{color:#c0453a}
.msp-pri[data-p="High"]{color:var(--msp-warn)}
.msp-mood{font-size:11px;color:var(--msp-muted)}
.msp-mood[data-m="1"]{color:var(--msp-good)}
.msp-mood[data-m="-2"]{color:#c0453a}
.msp-mono{font-variant-numeric:tabular-nums;color:var(--msp-muted);font-size:11.5px}
.msp-conf{position:relative;display:flex;align-items:center;gap:8px;font-size:11px;font-variant-numeric:tabular-nums;color:var(--msp-muted)}
.msp-conf i{display:block;height:4px;border-radius:2px;background:var(--msp-good);max-width:46px;flex:1;opacity:.7}
.msp-pv-routing{display:flex;flex-direction:column;gap:12px}
.msp-route-in{display:flex;align-items:center;gap:10px;padding:12px;border-radius:12px;box-shadow:0 0 0 1px var(--msp-rule)}
.msp-route-in>span:nth-child(2){display:flex;flex-direction:column;flex:1}
.msp-route-in em{font-style:normal;font-size:11.5px;color:var(--msp-muted)}
.msp-route-summary{display:flex;gap:9px;padding:12px;border-radius:12px;background:color-mix(in srgb,var(--msp-hand) 9%,var(--msp-card));color:var(--msp-hand)}
.msp-route-summary p{color:var(--msp-ink)}
.msp-agents{display:flex;flex-direction:column;gap:6px}
.msp-agent{display:grid;grid-template-columns:auto 1fr 110px 90px;gap:12px;align-items:center;padding:10px 12px;border-radius:12px;animation:msp-rise-in .5s var(--msp-ease) both}
.msp-agent[data-on]{background:var(--msp-soft);box-shadow:0 0 0 1px var(--msp-rule)}
.msp-agent-main{display:flex;flex-direction:column;gap:3px}
.msp-agent-main b{font-weight:500}
.msp-tags{display:flex;gap:4px}
.msp-tags i{font-style:normal;font-size:10px;padding:1px 6px;border-radius:5px;background:var(--msp-soft)}
.msp-agent[data-on] .msp-tags i{background:var(--msp-card)}
.msp-load{display:block;height:5px;border-radius:3px;background:var(--msp-soft);overflow:hidden}
.msp-agent[data-on] .msp-load{background:var(--msp-card)}
.msp-load i{display:block;height:100%;background:color-mix(in srgb,var(--msp-ink) 45%,transparent);border-radius:3px}
.msp-agent em{font-style:normal;font-size:11px;color:var(--msp-muted);text-align:right}
.msp-agent[data-on] em{color:var(--msp-hand);font-weight:500}
.msp-kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.msp-kpis div{padding:12px;border-radius:12px;background:var(--msp-soft);display:flex;flex-direction:column}
.msp-kpis span{font-size:11px;color:var(--msp-muted)}
.msp-kpis b{font-family:var(--msp-serif);font-weight:400;font-size:30px;line-height:1.1}
.msp-kpis em{font-style:normal;font-size:11px;color:var(--msp-good)}
.msp-report-row{display:grid;grid-template-columns:1.5fr 1fr;gap:10px;margin-top:10px}
.msp-chart,.msp-gaps{padding:12px;border-radius:12px;box-shadow:0 0 0 1px var(--msp-rule)}
.msp-chart p,.msp-gaps p{font-size:11px;color:var(--msp-muted);margin-bottom:8px}
.msp-chart svg{width:100%;height:auto}
.msp-grid{stroke:var(--msp-rule);stroke-width:1}
.msp-draw{stroke-dasharray:1;stroke-dashoffset:1;animation:msp-draw 1.4s var(--msp-ease) .15s forwards}
.msp-gaps{display:flex;flex-direction:column;gap:8px}
.msp-gaps span{display:flex;justify-content:space-between;gap:8px;padding:8px 10px;border-radius:9px;background:var(--msp-soft);font-size:11.5px}
.msp-gaps em{font-style:normal;color:var(--msp-warn);white-space:nowrap}

.msp-band{background:var(--msp-soft);padding-bottom:clamp(64px,9vw,120px);margin-top:clamp(80px,11vw,150px)}
.msp-sec-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;width:100%;margin-top:clamp(36px,5vw,56px);text-align:left}
.msp-sec{padding:22px;border-radius:18px;background:var(--msp-card);box-shadow:0 0 0 1px var(--msp-rule);display:flex;flex-direction:column;transition:transform .35s var(--msp-ease),box-shadow .35s var(--msp-ease)}
.msp-sec:hover{transform:translateY(-3px);box-shadow:var(--msp-shadow),0 0 0 1px var(--msp-rule)}
.msp-sec-icon{width:36px;height:36px;border-radius:11px;display:inline-flex;align-items:center;justify-content:center;background:var(--msp-soft);margin-bottom:44px}
.msp-sec h3{font-size:14.5px;font-weight:600;letter-spacing:-.01em}
.msp-sec p{font-size:13.5px;color:var(--msp-muted);margin-top:6px}

.msp-price-controls{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:16px 28px;margin-top:30px}
.msp-toggle{display:inline-flex;padding:3px;border-radius:999px;background:var(--msp-soft);box-shadow:0 0 0 1px var(--msp-rule)}
.msp-toggle button{height:34px;padding:0 16px;border-radius:999px;font-size:13.5px;color:var(--msp-muted);display:inline-flex;align-items:center;gap:6px;transition:background-color .25s,color .2s,box-shadow .25s}
.msp-toggle button[aria-checked="true"]{background:var(--msp-card);color:var(--msp-ink);box-shadow:0 1px 3px rgba(0,0,0,.1)}
.msp-toggle em{font-style:normal;font-size:11px;color:var(--msp-good);font-weight:500}
.msp-volume{display:flex;align-items:center;gap:14px;font-size:13px;color:var(--msp-muted)}
.msp-volume b{color:var(--msp-ink);font-weight:600;font-variant-numeric:tabular-nums;display:inline-block;min-width:52px;text-align:left;margin-left:4px}
.msp-volume input{-webkit-appearance:none;appearance:none;width:200px;height:4px;border-radius:2px;background:linear-gradient(90deg,var(--msp-ink) var(--p),color-mix(in srgb,var(--msp-ink) 15%,transparent) var(--p));cursor:pointer}
.msp-volume input::-webkit-slider-thumb{-webkit-appearance:none;width:18px;height:18px;border-radius:50%;background:var(--msp-card);box-shadow:0 0 0 1px var(--msp-rule),0 2px 6px rgba(0,0,0,.2)}
.msp-volume input::-moz-range-thumb{width:18px;height:18px;border:0;border-radius:50%;background:var(--msp-card);box-shadow:0 0 0 1px var(--msp-rule),0 2px 6px rgba(0,0,0,.2)}
.msp-tiers{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;width:100%;margin-top:36px;text-align:left}
.msp-tier{position:relative;border-radius:20px;background:var(--msp-soft);box-shadow:0 0 0 1px var(--msp-rule);overflow:hidden;transition:opacity .3s}
.msp-tier[data-dim]{opacity:.55}
.msp-tier[data-featured]{background:var(--msp-card);box-shadow:var(--msp-shadow),0 0 0 1px var(--msp-rule)}
.msp-tier-art{position:absolute;top:0;right:0;bottom:0;width:46%;-webkit-mask-image:linear-gradient(90deg,transparent,#000 70%);mask-image:linear-gradient(90deg,transparent,#000 70%);opacity:.9}
.msp-tier-body{position:relative;display:flex;flex-direction:column;height:100%;padding:26px}
.msp-tier-name{display:flex;align-items:center;justify-content:space-between;font-weight:600;font-size:14.5px}
.msp-flag{font-size:11px;font-weight:500;height:22px;display:inline-flex;align-items:center;padding:0 9px;border-radius:999px;background:var(--msp-button);color:var(--msp-button-ink)}
.msp-tier-price{display:flex;align-items:baseline;gap:6px;margin-top:20px;min-height:52px}
.msp-tier-price b{font-family:var(--msp-serif);font-weight:400;font-size:46px;line-height:1;letter-spacing:-.025em;font-variant-numeric:tabular-nums}
.msp-tier-price span{font-size:12.5px;color:var(--msp-muted)}
.msp-tier-text{font-size:13.5px;color:var(--msp-muted);margin-top:12px;max-width:260px;min-height:42px}
.msp-tier-warn{font-size:12px;color:var(--msp-warn);margin-top:8px}
.msp-tier-inc{font-size:12px;font-weight:600;margin-top:22px}
.msp-tier ul{display:flex;flex-direction:column;gap:9px;margin:12px 0 28px;font-size:13.5px}
.msp-tier li{display:flex;align-items:center;gap:9px}
.msp-tier li svg{color:var(--msp-good);flex:none}
.msp-tier .msp-btn{margin-top:auto}
.msp-trust{margin-top:44px;display:flex;flex-direction:column;align-items:center;gap:18px}
.msp-trust p{font-size:13px;color:var(--msp-muted)}
.msp-trust div{display:flex;flex-wrap:wrap;justify-content:center;gap:16px 44px}

.msp-head-row{display:flex;align-items:flex-end;justify-content:space-between;gap:20px}
.msp-story-nav{display:flex;gap:8px}
.msp-round{width:44px;height:44px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;box-shadow:0 0 0 1px var(--msp-rule);background:var(--msp-card);transition:transform .2s var(--msp-ease),box-shadow .2s}
.msp-round:hover{box-shadow:0 0 0 1px color-mix(in srgb,var(--msp-ink) 30%,transparent)}
.msp-round:active{transform:scale(.94)}
.msp-case{display:grid;grid-template-columns:minmax(0,.8fr) minmax(0,1.2fr);gap:clamp(20px,3vw,40px);margin-top:clamp(32px,4vw,52px);padding:10px;border-radius:24px;background:var(--msp-soft)}
.msp-case-photo{position:relative;aspect-ratio:.92;border-radius:18px;overflow:hidden}
.msp-case-layer{position:absolute;inset:0;opacity:0;transition:opacity .7s ease;}
.msp-case-layer[data-on]{opacity:1}
.msp-case-layer .msp-photo{transform:scale(1.04);transition:transform 6s ease-out}
.msp-case-layer[data-on] .msp-photo{transform:scale(1)}
.msp-case-tabs{position:absolute;left:12px;bottom:12px;right:12px;display:flex;flex-wrap:wrap;gap:6px}
.msp-case-tabs button{height:30px;padding:0 12px;border-radius:999px;font-size:12px;font-weight:500;color:#fff;background:rgba(18,20,18,.35);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);transition:background-color .2s,color .2s}
.msp-case-tabs button[aria-selected="true"]{background:#fff;color:#151715}
.msp-case-copy{display:flex;flex-direction:column;padding:clamp(14px,2.5vw,30px) clamp(8px,2vw,24px) clamp(14px,2vw,20px) 0;animation:msp-fade .6s var(--msp-ease)}
.msp-case-logo{align-self:flex-end}
.msp-case-copy blockquote{margin-top:18px}
.msp-case-copy blockquote p{font-family:var(--msp-serif);font-size:clamp(22px,2.15vw,30px);line-height:1.28;letter-spacing:-.012em;text-wrap:pretty}
.msp-q-rest{color:color-mix(in srgb,var(--msp-ink) 50%,var(--msp-soft))}
.msp-case-who{margin-top:24px;font-size:13px;color:var(--msp-muted);display:flex;flex-direction:column}
.msp-case-who b{color:var(--msp-ink);font-weight:600}
.msp-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-top:auto;padding-top:28px;border-top:1px solid var(--msp-rule)}
.msp-stat{display:flex;flex-direction:column;gap:4px;padding-top:18px}
.msp-stat b{font-family:var(--msp-serif);font-weight:400;font-size:clamp(30px,3vw,42px);line-height:1;letter-spacing:-.02em;font-variant-numeric:tabular-nums}
.msp-stat span{font-size:12px;color:var(--msp-muted)}

.msp-wall{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;margin-top:clamp(32px,4vw,52px);height:720px;overflow:hidden;-webkit-mask-image:linear-gradient(180deg,transparent,#000 10%,#000 86%,transparent);mask-image:linear-gradient(180deg,transparent,#000 10%,#000 86%,transparent)}
.msp-wall-col{overflow:hidden}
.msp-wall-track{display:flex;flex-direction:column;gap:14px;animation:msp-up linear infinite}
.msp-wall-col[data-c="1"] .msp-wall-track{animation-direction:reverse}
.msp-wall:hover .msp-wall-track,.msp-wall:focus-within .msp-wall-track{animation-play-state:paused}
.msp-quote{padding:22px;border-radius:18px;background:var(--msp-soft);display:flex;flex-direction:column;gap:16px;transition:background-color .25s,box-shadow .25s}
.msp-quote:hover{background:var(--msp-card);box-shadow:0 0 0 1px var(--msp-rule),var(--msp-shadow)}
.msp-quote .msp-logo{font-size:13px}
.msp-quote blockquote{font-size:15px;line-height:1.5;letter-spacing:-.005em}
.msp-quote figcaption{display:flex;align-items:center;gap:10px;font-size:12px;color:var(--msp-muted)}
.msp-quote figcaption span{display:flex;flex-direction:column}
.msp-quote figcaption b{color:var(--msp-ink);font-weight:600}

.msp-faq{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:clamp(32px,4vw,52px);align-items:start}
.msp-faq-col{border-radius:20px;background:var(--msp-soft);padding:6px 22px}
.msp-qa+.msp-qa{border-top:1px solid var(--msp-rule)}
.msp-qa button{display:flex;align-items:center;justify-content:space-between;gap:16px;width:100%;padding:20px 0;font-size:14.5px;font-weight:500;text-align:left}
.msp-qa-icon{width:28px;height:28px;border-radius:50%;flex:none;display:inline-flex;align-items:center;justify-content:center;background:var(--msp-card);box-shadow:0 0 0 1px var(--msp-rule);transition:transform .35s var(--msp-ease),background-color .2s,color .2s}
.msp-qa[data-open] .msp-qa-icon{transform:rotate(45deg);background:var(--msp-button);color:var(--msp-button-ink);box-shadow:none}
.msp-qa-a{display:grid;grid-template-rows:0fr;transition:grid-template-rows .4s var(--msp-ease)}
.msp-qa[data-open] .msp-qa-a{grid-template-rows:1fr}
.msp-qa-a>div{overflow:hidden}
.msp-qa-a p{padding:0 44px 20px 0;color:var(--msp-muted);font-size:14px;opacity:0;transform:translateY(-4px);transition:opacity .3s,transform .4s var(--msp-ease)}
.msp-qa[data-open] .msp-qa-a p{opacity:1;transform:none}

.msp-cta-sec{padding-bottom:clamp(80px,10vw,130px)}
.msp-cta{display:grid;grid-template-columns:minmax(0,.9fr) minmax(0,1.1fr);gap:10px;padding:10px;border-radius:26px;background:var(--msp-soft)}
.msp-cta-copy{display:flex;flex-direction:column;justify-content:center;align-items:flex-start;padding:clamp(24px,4vw,56px)}
.msp-form{display:flex;gap:8px;margin-top:28px;width:100%;max-width:440px;padding:5px;border-radius:999px;background:var(--msp-card);box-shadow:0 0 0 1px var(--msp-rule)}
.msp-form:focus-within{box-shadow:0 0 0 1px color-mix(in srgb,var(--msp-ink) 40%,transparent),var(--msp-shadow)}
.msp-form input{flex:1;min-width:0;border:0;background:transparent;outline:none;padding:0 14px;font-size:14px}
.msp-form input::placeholder{color:var(--msp-muted)}
.msp-form input[aria-invalid]{color:#c0453a}
.msp-form-msg{min-height:20px;margin-top:10px;font-size:12.5px;color:#c0453a;opacity:0;transition:opacity .2s}
.msp-form-msg[data-show]{opacity:1}
.msp-done{display:flex;align-items:center;gap:10px;margin-top:28px;font-size:14px;animation:msp-pop .5s var(--msp-ease)}
.msp-done span{width:30px;height:30px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;background:var(--msp-good);color:#fff}
.msp-cta-art{position:relative;min-height:440px;border-radius:20px;overflow:hidden;display:flex;align-items:center;justify-content:center;padding:28px}
.msp-morning{position:relative;width:100%;max-width:360px;padding:18px;display:flex;flex-direction:column;gap:12px;font-size:12.5px}
.msp-morning-head{display:flex;align-items:center;gap:8px;font-family:var(--msp-serif);font-size:22px;letter-spacing:-.015em}
.msp-morning-head svg{color:var(--msp-warn)}
.msp-morning-sub{color:var(--msp-muted);font-size:12px;margin-top:-6px}
.msp-morning-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}
.msp-morning-stats span{display:flex;flex-direction:column;padding:10px;border-radius:10px;background:var(--msp-soft);font-size:11px;color:var(--msp-muted)}
.msp-morning-stats b{font-family:var(--msp-serif);font-weight:400;font-size:24px;line-height:1.1;color:var(--msp-ink)}
.msp-morning-row{display:flex;align-items:center;gap:10px}
.msp-morning-row>span:not(.msp-avatar){display:flex;flex-direction:column;flex:1;font-size:11.5px;color:var(--msp-muted)}
.msp-morning-row b{color:var(--msp-ink);font-weight:500;font-size:12.5px}
.msp-morning-row i{font-style:normal;font-size:10.5px;padding:2px 8px;border-radius:999px;background:color-mix(in srgb,var(--msp-hand) 12%,transparent);color:var(--msp-hand)}

.msp-footer{background:var(--msp-soft);padding:clamp(48px,6vw,72px) 0 28px}
.msp-foot-top{display:grid;grid-template-columns:1.6fr repeat(4,1fr);gap:28px}
.msp-foot-brand p{margin-top:14px;font-size:13.5px;color:var(--msp-muted);max-width:260px}
.msp-socials{display:flex;gap:6px;margin-top:20px}
.msp-socials a{width:34px;height:34px;border-radius:10px;display:inline-flex;align-items:center;justify-content:center;color:var(--msp-muted);transition:color .2s,background-color .2s}
.msp-socials a:hover{color:var(--msp-ink);background:color-mix(in srgb,var(--msp-ink) 6%,transparent)}
.msp-foot-col{display:flex;flex-direction:column;gap:10px;font-size:13.5px}
.msp-foot-col p{font-weight:600;margin-bottom:4px}
.msp-foot-col a{color:var(--msp-muted);transition:color .2s;align-self:flex-start}
.msp-foot-col a:hover{color:var(--msp-ink)}
.msp-foot-bottom{display:flex;justify-content:space-between;align-items:center;gap:16px;margin-top:56px;padding-top:22px;border-top:1px solid var(--msp-rule);font-size:12.5px;color:var(--msp-muted)}
.msp-status{display:inline-flex;align-items:center;gap:8px}
.msp-status i{width:7px;height:7px;border-radius:50%;background:var(--msp-good);box-shadow:0 0 0 3px color-mix(in srgb,var(--msp-good) 22%,transparent);animation:msp-pulse 2.4s infinite}

.msp-rise{transition:opacity .9s var(--msp-ease),transform 1s var(--msp-ease)}
.msp-root[data-ready] .msp-rise:not([data-in]){opacity:0;transform:translateY(22px)}
.msp-hero .msp-rise:nth-child(2){transition-delay:.06s}
.msp-hero .msp-rise:nth-child(3){transition-delay:.12s}
.msp-hero .msp-rise:nth-child(4){transition-delay:.18s}
.msp-hero .msp-rise:nth-child(5){transition-delay:.24s}
.msp-ways .msp-rise:nth-child(2),.msp-sec-grid .msp-rise:nth-child(2),.msp-tiers .msp-rise:nth-child(2),.msp-faq .msp-rise:nth-child(2){transition-delay:.08s}
.msp-ways .msp-rise:nth-child(3),.msp-sec-grid .msp-rise:nth-child(3),.msp-tiers .msp-rise:nth-child(3){transition-delay:.16s}
.msp-sec-grid .msp-rise:nth-child(4){transition-delay:.24s}

@keyframes msp-pulse{0%,100%{opacity:1}50%{opacity:.35}}
@keyframes msp-arrive{from{opacity:0;transform:translateY(-10px);background:color-mix(in srgb,var(--msp-good) 12%,transparent)}to{opacity:1;transform:none}}
@keyframes msp-shimmer{from{background-position:200% 0}to{background-position:-200% 0}}
@keyframes msp-blink{50%{opacity:0}}
@keyframes msp-dots{0%{content:""}25%{content:"."}50%{content:".."}75%{content:"..."}}
@keyframes msp-pop{from{opacity:0;transform:translateY(6px) scale(.96)}to{opacity:1;transform:none}}
@keyframes msp-fade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
@keyframes msp-rise-in{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
@keyframes msp-marquee{to{transform:translateX(-50%)}}
@keyframes msp-up{to{transform:translateY(calc(-50% - 7px))}}
@keyframes msp-progress{to{transform:scaleX(1)}}
@keyframes msp-draw{to{stroke-dashoffset:0}}

@media (max-width:1080px){
.msp-nav-links,.msp-login{display:none}
.msp-burger{display:inline-flex}
.msp-sheet{display:block;position:absolute;left:0;right:0;top:100%;max-height:0;overflow:hidden;background:var(--msp-paper);box-shadow:0 1px 0 var(--msp-rule);transition:max-height .45s var(--msp-ease),visibility 0s .45s;visibility:hidden}
.msp-sheet[data-open]{max-height:calc(100svh - 68px);overflow-y:auto;visibility:visible;transition:max-height .45s var(--msp-ease)}
.msp-sheet .msp-wrap{display:flex;flex-direction:column;gap:6px;padding-top:10px;padding-bottom:24px}
.msp-sheet-group{display:flex;flex-direction:column;padding:8px 0;border-bottom:1px solid var(--msp-rule)}
.msp-sheet-group a{padding:9px 0;font-size:15px}
.msp-sheet-head{font-size:12px;color:var(--msp-muted);padding:6px 0 2px}
.msp-sheet-top{font-size:17px !important;font-weight:500}
.msp-sheet-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:14px}
.msp-hero-grid{grid-template-columns:1fr}
.msp-hero-art{margin-right:0}
.msp-story{grid-template-columns:1fr}
.msp-story-stage{display:none}
.msp-step{min-height:0;padding:22px 0 34px}
.msp-step-media{display:flex;position:relative;aspect-ratio:1.15;border-radius:22px;overflow:hidden;margin-bottom:24px}
.msp-step-copy{opacity:1}
.msp-tour-body{grid-template-columns:1fr}
.msp-tour-art{min-height:0;aspect-ratio:1.3}
.msp-sec-grid{grid-template-columns:1fr 1fr}
.msp-tiers{grid-template-columns:1fr;max-width:520px}
.msp-case{grid-template-columns:1fr}
.msp-case-photo{aspect-ratio:1.25}
.msp-cta{grid-template-columns:1fr}
.msp-foot-top{grid-template-columns:1fr 1fr}
.msp-foot-brand{grid-column:1/-1}
}
@media (max-width:720px){
.msp-wrap{padding:0 18px}
.msp-nav-cta{display:none}
.msp-hero-art{aspect-ratio:.9}
.msp-ways{grid-template-columns:1fr}
.msp-tabs{grid-template-columns:1fr 1fr}
.msp-tour-art{aspect-ratio:.95}
.msp-sec-grid{grid-template-columns:1fr}
.msp-wall{grid-template-columns:1fr;height:620px}
.msp-wall-col[data-c="1"],.msp-wall-col[data-c="2"]{display:none}
.msp-faq{grid-template-columns:1fr}
.msp-head-row{align-items:flex-start;flex-direction:column}
.msp-stats{grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
.msp-form{flex-direction:column;border-radius:18px}
.msp-form .msp-btn{width:100%}
.msp-form input{height:44px}
.msp-cta-art{min-height:420px;padding:18px}
.msp-foot-bottom{flex-direction:column;align-items:flex-start}
.msp-volume input{width:150px}
}
@media (prefers-reduced-motion:reduce){
.msp-root *,.msp-root *::before,.msp-root *::after{animation-duration:.001ms !important;animation-iteration-count:1 !important;transition-duration:.001ms !important}
.msp-logos-track,.msp-wall-track{animation:none !important}
.msp-logos .msp-dup,.msp-wall .msp-dup{display:none}
.msp-logos-track{width:auto;flex-wrap:wrap;justify-content:center}
.msp-wall{height:auto;-webkit-mask-image:none;mask-image:none}
.msp-wall-col[data-c="1"],.msp-wall-col[data-c="2"]{display:block}
.msp-root[data-ready] .msp-rise:not([data-in]){opacity:1;transform:none}
}
`

export type MspGetStarted = (email?: string) => void | boolean | Promise<void | boolean>
