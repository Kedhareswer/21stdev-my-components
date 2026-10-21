"use client"

// Meadow Journal Template: a personal diary site for someone who lives
// outdoors. One frosted board floats over a full-bleed landscape photograph,
// built from widgets like a phone home screen, and the rest of the page
// follows in the same language: periwinkle panels, olive and bark-dark cards,
// gold sticker stars and a pill scrubber.
//
// - Hero board: "Hello, Nia!" and a live clock. Below them, nav pills that
//   follow the scroll, a status pill and a "more" menu. Diary entries rotate
//   with timed dots, and each entry crossfades the photograph behind the page
//   and the two photo cards. A music card with album art plays a small music
//   box, synthesised live. A messages card lets you reply in place. The stars
//   are draggable stickers.
// - The pill under the board is the page's scrollbar: drag it, click it, or
//   use the arrow keys.
// - Profile, a filterable photo wall with a lightbox, a searchable archive
//   grouped by month (pin any day back to the top), and a guestbook where
//   notes are pinned to a board.
//
// The default photographs are from Unsplash (Unsplash License), served by its
// CDN at the width each slot needs, with a blur-up while they load. Every
// picture is a prop: pass your own URLs.
import * as React from "react"

/** A photograph. */
export type MjtShot = {
  /** Any image URL. Unsplash URLs get a responsive srcset automatically. */
  src: string
  alt?: string
  /** Shown while it loads, and if it fails. */
  tone?: string
  /** CSS object-position, "50% 30%". */
  focus?: string
}

export type MjtEntry = {
  id: string
  /** ISO date, "2026-10-12". */
  date: string
  place: string
  /** Wrap words in **double stars** to set them in bold ink. */
  text: string
  likes: number
  /** The photograph behind the page while this entry is up. */
  image: MjtShot
  /** The two photo cards under the post. */
  shots?: MjtShot[]
  /** The removable tag on the first photo. */
  tag?: string
  /** "Taken by" line on the first photo. */
  camera?: string
}

export type MjtPhoto = MjtShot & {
  id: string
  caption: string
  /** Filter chip on the photo wall. */
  category?: string
  tags?: string[]
  camera?: string
  likes?: number
  /** Portrait tile on the wall. */
  tall?: boolean
}

export type MjtSong = {
  title: string
  artist: string
  album: string
  /** Seconds. */
  duration: number
  /** Album art. */
  cover?: string
  /** An audio file. Without it, a music box plays a tune made from the title. */
  src?: string
  /** Music box key, 0 = C. */
  key?: number
}

export type MjtMessage = { from: string; text: string; time: string; avatar?: string }
export type MjtNote = { name: string; text: string }
export type MjtLink = { label: string; href?: string }

export type MjtProfile = {
  fullName?: string
  handle?: string
  role?: string
  bio?: string
  location?: string
  avatar?: MjtShot
  stats?: { label: string; value: number }[]
  currently?: { label: string; value: string }[]
  links?: MjtLink[]
}

export type MjtLabels = {
  tabs?: string[]
  likedBy?: string
  youLiked?: string
  statuses?: string[]
  more?: string
  nowPlaying?: string
  songBy?: string
  album?: string
  duration?: string
  minutes?: string
  play?: string
  pause?: string
  prevSong?: string
  nextSong?: string
  newMessages?: string
  nextMessage?: string
  reply?: string
  replyTo?: string
  send?: string
  cancel?: string
  sending?: string
  sent?: string
  failed?: string
  caughtUp?: string
  readAgain?: string
  hours?: string
  takenBy?: string
  removeTag?: string
  fromArchive?: string
  like?: string
  profileTitle?: string
  follow?: string
  following?: string
  message?: string
  currently?: string
  postcard?: string
  photosTitle?: string
  all?: string
  photoCount?: string
  archiveTitle?: string
  search?: string
  noResults?: string
  readMore?: string
  readLess?: string
  showAll?: string
  pin?: string
  pinned?: string
  guestbookTitle?: string
  guestbookText?: string
  yourName?: string
  yourNote?: string
  pinNote?: string
  noteThanks?: string
  copyLink?: string
  copied?: string
  nightMode?: string
  dayMode?: string
  toGuestbook?: string
  backToTop?: string
  scrub?: string
  close?: string
  previous?: string
  next?: string
  entry?: string
}

export type MjtPaletteName = "periwinkle" | "sage" | "blush" | "dusk"
export type MjtPalette = {
  /** The big header panel. */
  panel: string
  /** The dark music card, the active pill. */
  deep: string
  /** The messages card. */
  olive: string
  /** Bold words on the panel. */
  ink?: string
}

export type MjtLikeEvent = { kind: "entry" | "photo"; id: string; liked: boolean }

export type MeadowJournalTemplateProps = {
  /** Who the board greets. */
  name?: string
  greeting?: string
  /** Small print in the panel's corner. `null` hides it. */
  credit?: { label: string; name: string } | null
  /** BCP 47 locale for dates, months and the clock. */
  locale?: string
  hour12?: boolean
  /** IANA zone for the clock, "Europe/London". Defaults to the visitor's. */
  timeZone?: string
  entries?: MjtEntry[]
  songs?: MjtSong[]
  messages?: MjtMessage[]
  photos?: MjtPhoto[] | null
  /** Older entries, listed in the archive with `entries`. */
  archive?: MjtEntry[] | null
  profile?: MjtProfile | null
  notes?: MjtNote[]
  guestbook?: boolean
  footer?: { title?: string; note?: string; links?: MjtLink[] } | null
  labels?: MjtLabels
  palette?: MjtPaletteName | MjtPalette
  theme?: "system" | "light" | "dark"
  /** A stylesheet for the display face (Outfit from Google Fonts by default). `null` uses the system stack. */
  fontHref?: string | null
  /** The gold sticker stars. */
  stickers?: boolean
  /** Seconds each entry stays up. 0 stops the rotation. */
  interval?: number
  onLike?: (e: MjtLikeEvent) => unknown
  /** Return or resolve `false`, or throw, to show an error. */
  onReply?: (message: MjtMessage, text: string) => unknown
  onFollow?: (following: boolean) => unknown
  onNote?: (note: MjtNote) => unknown
  onStatus?: (status: string) => unknown
  /** A definite floor for the hero and the backdrop. */
  height?: string
  className?: string
}

// #region content
const UNSPLASH = "https://images.unsplash.com/photo-"
const pic = (id: string, alt: string, tone: string, focus?: string) => ({ src: UNSPLASH + id, alt, tone, focus }) as MjtShot

const DEFAULT_ENTRIES = [
  {
    id: "glen",
    date: "2026-10-12",
    place: "Glen Etive, Scottish Highlands",
    text: "Today I'm spending the day on **a little farm** in the glen, feeding the animals and soaking up everything **mother nature** gives us. Be happy, all of you.",
    likes: 25400,
    image: pic("1438786657495-640937046d18", "A green glen under big summer clouds", "#7f9a5a", "50% 60%"),
    shots: [pic("1503185912284-5271ff81b9a8", "Nia in a straw hat by the barn door", "#7a4a32", "50% 25%"), pic("1484557985045-edf25e08da73", "A curious sheep at the front of the flock", "#9a9a86", "50% 40%")],
    tag: "Farm-girl era",
    camera: "Canon AE-1",
  },
  {
    id: "lavender",
    date: "2026-09-21",
    place: "Valensole, Provence",
    text: "Lost a whole afternoon between **purple rows** and the hum of bees. My bag still smells like **August**, and I am not washing it.",
    likes: 31900,
    image: pic("1499002238440-d264edd596ec", "Lavender rows at sunset", "#8a6aa8", "50% 70%"),
    shots: [pic("1532274402911-5a369e4c4bb5", "Lavender down to a lake at dusk", "#7a5a9a", "50% 60%"), pic("1465146344425-f00d5f5c8f07", "Red poppies in long grass", "#c9b48a")],
    tag: "Bee whisperer",
    camera: "Pentax K1000",
  },
  {
    id: "coast",
    date: "2026-09-08",
    place: "The dunes, Northumberland",
    text: "Woke up before the gulls and ran down the **boardwalk** barefoot. The sea kept every promise it made last summer. Coffee tastes better **with salt in the air**.",
    likes: 18200,
    image: pic("1495954484750-af469f2f9be5", "A wooden boardwalk over the dunes to the sea", "#7aa0b0", "50% 55%"),
    shots: [pic("1523264653568-d3d4032d1476", "Splashing through cold water", "#6a7a7a", "50% 30%"), pic("1507525428034-b723cf961d3e", "Soft waves on an empty beach", "#9ac0c8")],
    tag: "Salt hair",
    camera: "Olympus mju II",
  },
  {
    id: "barn",
    date: "2026-08-30",
    place: "Back at the barn",
    text: "Fed the cows, fixed a gate, watched **the sun go down** behind the old barn. Small days are **the good ones**.",
    likes: 22700,
    image: pic("1500076656116-558758c991c1", "An old barn and silo at sunset", "#b07a4a", "50% 60%"),
    shots: [pic("1500595046743-cd271d694d30", "Cows grazing at golden hour", "#a87a4a"), pic("1524024973431-2ad916746881", "A white goat in the paddock", "#5a7a3a", "50% 30%")],
    tag: "Cow mum",
    camera: "Canon AE-1",
  },
] as MjtEntry[]

const DEFAULT_ARCHIVE = [
  { id: "lake", date: "2026-08-18", place: "Lake Bohinj", text: "Sat at the end of the dock until the mountains turned **pink**. The lake was so still it held **two skies**.", likes: 14100, image: pic("1508672019048-805c876b67e2", "A dock reaching into a mountain lake", "#6a9ab0"), tag: "Still water", camera: "Olympus mju II" },
  { id: "hay", date: "2026-08-04", place: "Hay day, Cotswolds", text: "Three hundred bales, one sunburn, **zero regrets**. Ate peaches on the tailgate like **a country song**.", likes: 19800, image: pic("1500382017468-9049fed747ef", "A wheat field at sunset", "#c8a050"), tag: "Hay day", camera: "Pentax K1000" },
  { id: "tree", date: "2026-07-26", place: "The lone oak", text: "Walked out to the **old oak** in the middle of the field and read until the light went **gold**.", likes: 9600, image: pic("1502082553048-f009c37129b9", "A lone tree in a green field", "#5a8a3a"), tag: "Reading spot", camera: "Canon AE-1" },
  { id: "piglet", date: "2026-07-15", place: "New arrivals", text: "Six piglets born overnight. I named the smallest one **Biscuit** and nobody can **stop me**.", likes: 27300, image: pic("1516467508483-a7212febe31a", "A tiny pink piglet in the straw", "#9a5a3a"), tag: "Biscuit", camera: "Olympus mju II" },
  { id: "arrival", date: "2026-07-02", place: "Day one", text: "New farm, new boots, **a field of cows** who already know my name. This is going to be **the summer**.", likes: 12500, image: pic("1570042225831-d98fa7577f1e", "A black and white cow on a green field", "#5a8a3a"), tag: "Day one", camera: "Canon AE-1" },
] as MjtEntry[]

const DEFAULT_SONGS = [
  { title: "Clover Hours", artist: "June Arbor", album: "Fieldnotes", duration: 183, key: 2, cover: UNSPLASH + "1458560871784-56d23406c091" },
  { title: "Paper Moons", artist: "The Wexford Lanes", album: "Low Tide Radio", duration: 214, key: 7, cover: UNSPLASH + "1470252649378-9c29740c9fa8" },
  { title: "Hay Bale Heart", artist: "Odessa Fern", album: "County Fair", duration: 168, key: 0, cover: UNSPLASH + "1471478331149-c72f17e33c73" },
] as MjtSong[]

const DEFAULT_MESSAGES = [
  { from: "Mara", text: "Friend, we lost you! Where are you? Call us.", time: "14:30", avatar: UNSPLASH + "1494790108377-be9c29b29330" },
  { from: "Theo", text: "Ferry leaves at nine tomorrow. Save me a window seat?", time: "16:05", avatar: UNSPLASH + "1497551060073-4c5ab6435f12" },
  { from: "Aunt Ruth", text: "Bring back some of that lavender honey, sweetheart.", time: "18:42", avatar: UNSPLASH + "1508214751196-bcfd4ca60f91" },
] as MjtMessage[]

const DEFAULT_PHOTOS = [
  { id: "p1", ...pic("1503185912284-5271ff81b9a8", "Nia in a straw hat", "#7a4a32", "50% 25%"), caption: "Straw hat season", category: "Portraits", tags: ["barn", "summer"], camera: "Canon AE-1", likes: 4012, tall: true },
  { id: "p2", ...pic("1502082553048-f009c37129b9", "A lone tree in a green field", "#5a8a3a"), caption: "The oak I keep coming back to", category: "Fields", tags: ["oak", "blue sky"], camera: "Canon AE-1", likes: 1530 },
  { id: "p3", ...pic("1484557985045-edf25e08da73", "Sheep in a meadow", "#9a9a86"), caption: "The welcoming committee", category: "Animals", tags: ["sheep"], camera: "Pentax K1000", likes: 2675 },
  { id: "p4", ...pic("1499002238440-d264edd596ec", "Lavender rows at sunset", "#8a6aa8"), caption: "Rows for days", category: "Golden hour", tags: ["lavender", "bees"], camera: "Pentax K1000", likes: 3120 },
  { id: "p5", ...pic("1523264653568-d3d4032d1476", "Splashing through a lake", "#6a7a7a", "50% 30%"), caption: "Too cold, worth it", category: "Portraits", tags: ["lake"], camera: "Olympus mju II", likes: 2210, tall: true },
  { id: "p6", ...pic("1501854140801-50d01698950b", "Rolling green hills from above", "#5a8a3a"), caption: "Hills like folded velvet", category: "Fields", tags: ["drone"], camera: "Borrowed drone", likes: 1840 },
  { id: "p7", ...pic("1516467508483-a7212febe31a", "A piglet in the straw", "#9a5a3a"), caption: "Biscuit, day two", category: "Animals", tags: ["piglet"], camera: "Olympus mju II", likes: 5320 },
  { id: "p8", ...pic("1474552226712-ac0f0961a954", "Two friends on bikes at sunset", "#b06a4a"), caption: "Racing the sun home", category: "Golden hour", tags: ["bikes", "friends"], camera: "Canon AE-1", likes: 2380 },
  { id: "p9", ...pic("1524024973431-2ad916746881", "A white goat", "#5a7a3a", "50% 30%"), caption: "Gertrude, unimpressed", category: "Animals", tags: ["goat"], camera: "Pentax K1000", likes: 3766, tall: true },
  { id: "p10", ...pic("1508672019048-805c876b67e2", "A dock on a mountain lake", "#6a9ab0"), caption: "Still water", category: "Fields", tags: ["lake", "dock"], camera: "Olympus mju II", likes: 990 },
  { id: "p11", ...pic("1470252649378-9c29740c9fa8", "A meadow at sunrise", "#c88a4a"), caption: "Five in the morning", category: "Golden hour", tags: ["sunrise"], camera: "Canon AE-1", likes: 1766 },
  { id: "p12", ...pic("1500595046743-cd271d694d30", "Cows grazing at golden hour", "#a87a4a"), caption: "Dinner with the herd", category: "Animals", tags: ["cows"], camera: "Pentax K1000", likes: 2950 },
] as MjtPhoto[]

const DEFAULT_PROFILE = {
  fullName: "Nia Olsen",
  handle: "@nia.fieldnotes",
  role: "Farm-sitter, film photographer and slow traveller",
  bio: "Swapping city noise for **barn doors and back roads**. I look after farms while their families travel, and shoot everything on **35 mm film**.",
  location: "Somewhere with a fence and a view",
  avatar: pic("1503185912284-5271ff81b9a8", "Portrait of Nia", "#7a4a32", "50% 18%"),
  stats: [
    { label: "Posts", value: 248 },
    { label: "Followers", value: 25400 },
    { label: "Farms visited", value: 31 },
  ],
  currently: [
    { label: "Reading", value: "Anne of Green Gables" },
    { label: "Wearing", value: "Wool socks, always" },
    { label: "Weather", value: "14 degrees and sunny" },
    { label: "Next stop", value: "Isle of Skye" },
  ],
  links: [{ label: "Instagram", href: "#" }, { label: "Letterboxd", href: "#" }, { label: "Newsletter", href: "#" }],
} as MjtProfile

const DEFAULT_NOTES = [
  { name: "Mara", text: "Come home soon, the city misses you (we do too)." },
  { name: "Ines", text: "Your lavender photos got me through finals week." },
  { name: "Theo", text: "Window seat saved. Bring snacks." },
] as MjtNote[]

const DEFAULT_LABELS = {
  tabs: ["Home", "Profile", "Photos", "Archive"],
  likedBy: "Liked by **{count} people** you follow",
  youLiked: "Liked by **you and {count} people** you follow",
  statuses: ["active now", "out in the fields", "offline"],
  more: "more",
  nowPlaying: "On repeat:",
  songBy: "song by",
  album: "Album:",
  duration: "Duration:",
  minutes: "min.",
  play: "Play",
  pause: "Pause",
  prevSong: "Previous song",
  nextSong: "Next song",
  newMessages: "New messages:",
  nextMessage: "Next message",
  reply: "Reply",
  replyTo: "Reply to {name}",
  send: "Send",
  cancel: "Cancel",
  sending: "Sending",
  sent: "Sent to {name}.",
  failed: "Could not send. Try again.",
  caughtUp: "All caught up. Go outside!",
  readAgain: "Read again",
  hours: "h.",
  takenBy: "Taken by **{camera}**",
  removeTag: "Remove tag",
  fromArchive: "From **the Archive**",
  like: "Like",
  profileTitle: "About **me**",
  follow: "Follow",
  following: "Following",
  message: "Message",
  currently: "Currently",
  postcard: "Wish you were here",
  photosTitle: "My **photos**",
  all: "All",
  photoCount: "{count} frames from the road",
  archiveTitle: "The **archive**",
  search: "Search the archive",
  noResults: "Nothing here yet. Try another word.",
  readMore: "Read more",
  readLess: "Less",
  showAll: "Show all {count} days",
  pin: "Pin to the top",
  pinned: "On top",
  guestbookTitle: "Guest**book**",
  guestbookText: "Say hi, leave a song, tell me where to go next. Your note gets pinned to the board.",
  yourName: "Your name",
  yourNote: "Your note",
  pinNote: "Pin it",
  noteThanks: "Pinned! Thank you.",
  copyLink: "Copy profile link",
  copied: "Link copied.",
  nightMode: "Night mode",
  dayMode: "Day mode",
  toGuestbook: "Sign the guestbook",
  backToTop: "Back to top",
  scrub: "Page position",
  close: "Close",
  previous: "Previous",
  next: "Next",
  entry: "Entry {n}",
}

const DEFAULT_FOOTER = {
  title: "See you in **the fields**.",
  note: "Field notes by Nia Olsen. Photographs from Unsplash.",
  links: [{ label: "Instagram", href: "#" }, { label: "Newsletter", href: "#" }, { label: "Contact", href: "#" }],
}

const DEFAULT_FONT = "https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap"
// #endregion content

// #region logic
const PALETTES = {
  periwinkle: { panel: "#7b8fc6", deep: "#33321f", olive: "#73714a", ink: "#1c2036" },
  sage: { panel: "#7f9a78", deep: "#28301f", olive: "#8f6c47", ink: "#17240f" },
  blush: { panel: "#b07a83", deep: "#3a2427", olive: "#6c7650", ink: "#3a1820" },
  dusk: { panel: "#7a75b4", deep: "#221f38", olive: "#83694a", ink: "#17142f" },
} as { [k: string]: MjtPalette }

function resolvePalette(p: MjtPaletteName | MjtPalette | undefined) {
  if (!p) return PALETTES.periwinkle
  if (typeof p === "string") return PALETTES[p] || PALETTES.periwinkle
  return { ink: "#1c2036", ...p }
}

/** "**bold** rest" -> [{ text: "bold", bold: true }, { text: " rest", bold: false }] */
function richParts(s: string) {
  const out = [] as { text: string; bold: boolean }[]
  const re = /\*\*(.+?)\*\*/g
  let last = 0
  let m = re.exec(s)
  while (m) {
    if (m.index > last) out.push({ text: s.slice(last, m.index), bold: false })
    out.push({ text: m[1], bold: true })
    last = m.index + m[0].length
    m = re.exec(s)
  }
  if (last < s.length) out.push({ text: s.slice(last), bold: false })
  return out
}

function plain(s: string) {
  return s.replace(/\*\*/g, "")
}

function fill(s: string, vars: { [k: string]: string | number }) {
  return s.replace(/\{(\w+)\}/g, (all, k) => (vars[k] === undefined ? all : String(vars[k])))
}

/** 980 -> "980", 25400 -> "25.4 K", 25000000 -> "25 M" (no-break space) */
function compact(n: number) {
  const a = Math.abs(n)
  const f = (v: number) => (Math.round(v * 10) / 10).toFixed(1).replace(/\.0$/, "")
  if (a < 1000) return String(Math.round(n))
  if (a < 999950) return f(n / 1000) + " K"
  return f(n / 1e6) + " M"
}

function grouped(n: number) {
  return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ",")
}

/** 183 -> "03:03" */
function mmss(sec: number) {
  const s = Math.max(0, Math.floor(sec))
  return String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0")
}

/** The clock's pieces. Hour, minutes and a lower-case day period, in the given zone. */
function clockParts(d: Date, locale: string, hour12: boolean, timeZone?: string) {
  let parts = [] as Intl.DateTimeFormatPart[]
  try {
    parts = new Intl.DateTimeFormat(locale, { hour: "numeric", minute: "2-digit", hour12, timeZone }).formatToParts(d)
  } catch {
    parts = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", hour12 }).formatToParts(d)
  }
  const get = (t: string) => (parts.find((p) => p.type === t) || { value: "" }).value
  const hour = get("hour")
  return {
    hour: hour12 ? hour : hour.padStart(2, "0"),
    minute: get("minute"),
    period: hour12 ? get("dayPeriod").toLowerCase().replace(/\./g, "").replace(/\s+/g, "") : "",
  }
}

function fmtDate(iso: string, locale: string, withYear?: boolean) {
  const d = new Date(iso + "T12:00:00Z")
  if (isNaN(d.getTime())) return iso
  return new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", year: withYear ? "numeric" : undefined, timeZone: "UTC" }).format(d)
}

function monthKey(iso: string) {
  return iso.slice(0, 7)
}

function monthLabel(key: string, locale: string) {
  const d = new Date(key + "-15T12:00:00Z")
  if (isNaN(d.getTime())) return key
  const s = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric", timeZone: "UTC" }).format(d)
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/** Entries newest first, no duplicate ids. */
function mergeEntries(a: MjtEntry[], b: MjtEntry[]) {
  const seen = {} as { [k: string]: boolean }
  const out = [] as MjtEntry[]
  for (const e of a.concat(b)) {
    if (seen[e.id]) continue
    seen[e.id] = true
    out.push(e)
  }
  return out.sort((x, y) => (x.date < y.date ? 1 : x.date > y.date ? -1 : 0))
}

/** Months, newest first, each with its count. */
function months(list: MjtEntry[]) {
  const out = [] as { key: string; count: number }[]
  for (const e of list) {
    const k = monthKey(e.date)
    const m = out.find((o) => o.key === k)
    if (m) m.count++
    else out.push({ key: k, count: 1 })
  }
  return out.sort((x, y) => (x.key < y.key ? 1 : -1))
}

function fold(s: string) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
}

/** Archive filter: a month (or "") and words that must all appear in place, text or tag. */
function filterEntries(list: MjtEntry[], month: string, query: string) {
  const words = fold(query).split(/\s+/).filter(Boolean)
  return list.filter((e) => {
    if (month && monthKey(e.date) !== month) return false
    const hay = fold(e.place + " " + plain(e.text) + " " + (e.tag || ""))
    return words.every((w) => hay.includes(w))
  })
}

function categories(list: MjtPhoto[]) {
  const out = [] as string[]
  for (const p of list) if (p.category && out.indexOf(p.category) < 0) out.push(p.category)
  return out
}

/** Roving focus for a row of buttons. -1 when the key is not a move. */
function nextIndex(i: number, key: string, n: number) {
  if (key === "ArrowRight" || key === "ArrowDown") return (i + 1) % n
  if (key === "ArrowLeft" || key === "ArrowUp") return (i - 1 + n) % n
  if (key === "Home") return 0
  if (key === "End") return n - 1
  return -1
}

/**
 * The scrubber: how far down the page is (p, 0..1) and how much of it fits on
 * screen (s, the thumb's share of the track, never below 0.08).
 */
function scrubState(scrolled: number, height: number, view: number) {
  const room = height - view
  const p = room > 0 ? Math.min(1, Math.max(0, scrolled / room)) : 0
  const s = height > 0 ? Math.min(1, Math.max(0.08, view / height)) : 1
  return { p, s }
}

/** Pixels to scroll for a thumb dragged dx pixels along a track trackW wide. */
function scrubDelta(dx: number, trackW: number, s: number, height: number, view: number) {
  const free = trackW * (1 - s)
  if (free <= 0) return 0
  return (dx / free) * Math.max(0, height - view)
}

function hash(s: string) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

const PROGRESSION = [
  [0, 4, 7],
  [7, 11, 14],
  [9, 12, 16],
  [5, 9, 12],
]
const ARP = [
  [0, 1, 2, 3, 2, 1, 2, 1],
  [0, 2, 1, 2, 3, 2, 1, 2],
  [0, 1, 2, 1, 3, 1, 2, 1],
]

/**
 * The music box score. Eighth note `step` of a I-V-vi-IV loop in `key`:
 * an arpeggio, a bass note on each bar, and a sparse melody on chord tones
 * that the seed picks. Returns [midi, velocity] pairs.
 */
function noteAt(step: number, key: number, seed: number) {
  const bar = Math.floor(step / 8)
  const s = step % 8
  const chord = PROGRESSION[bar % 4]
  const base = 57 + (((key % 12) + 12) % 12)
  const tones = [chord[0], chord[1], chord[2], chord[0] + 12]
  const arp = ARP[seed % ARP.length]
  const out = [[base + tones[arp[s]], s === 0 ? 0.2 : s % 2 ? 0.1 : 0.14]]
  if (s === 0 || s === 4) out.push([base - 12 + chord[0], s === 0 ? 0.2 : 0.12])
  // the melody repeats every four bars, so the tune has a shape
  const h = hash(seed + ":" + (bar % 4) + ":" + s + ":" + (Math.floor(bar / 4) % 2))
  if (s % 2 === 0 && h % 100 < 46) {
    const pick = [chord[1], chord[2], chord[0] + 12, chord[1] + 12][h % 4]
    out.push([base + 12 + pick, 0.12])
  }
  return out
}
/** An Unsplash (imgix) URL at a given width; other URLs pass through untouched. */
function sized(src: string, w: number, h?: number) {
  if (!/^https:\/\/images\.unsplash\.com\//.test(src)) return src
  const base = src.split("?")[0]
  return base + "?auto=format&fit=crop&q=78&w=" + w + (h ? "&h=" + h + "&crop=faces,entropy" : "")
}

const WIDTHS = [480, 800, 1200, 1600, 2200]

/** A srcset for Unsplash URLs, up to `max` pixels wide; "" for anything else. */
function srcSet(src: string, max = 2200) {
  if (!/^https:\/\/images\.unsplash\.com\//.test(src)) return ""
  return WIDTHS.filter((w) => w <= max).map((w) => sized(src, w) + " " + w + "w").join(", ")
}
// #endregion logic


const MJT_CSS = `
.mjt-root{--mjt-font:"Outfit","Sofia Pro","Gilroy","Avenir Next","Manrope","Inter",ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;--mjt-glass:rgba(238,241,248,.84);--mjt-glass-line:rgba(255,255,255,.7);--mjt-text:#1d1f2b;--mjt-muted:#555a6e;--mjt-card:#ffffff;--mjt-soft:rgba(29,31,43,.06);--mjt-rule:rgba(29,31,43,.12);--mjt-on:#fbfbf6;--mjt-track:color-mix(in srgb,var(--mjt-panel) 72%,#ffffff);--mjt-wash:rgba(233,238,247,.55);--mjt-shadow:0 1px 1px rgba(30,40,70,.06),0 30px 60px -24px rgba(30,40,70,.45);position:relative;min-height:var(--mjt-h);overflow-x:clip;font-family:var(--mjt-font);color:var(--mjt-text);-webkit-font-smoothing:antialiased;color-scheme:light;isolation:isolate}
.mjt-root[data-theme="dark"]{--mjt-glass:rgba(20,22,34,.78);--mjt-glass-line:rgba(255,255,255,.08);--mjt-text:#eef0f7;--mjt-muted:#a6abc0;--mjt-card:#22253a;--mjt-soft:rgba(255,255,255,.06);--mjt-rule:rgba(255,255,255,.12);--mjt-track:color-mix(in srgb,var(--mjt-panel) 55%,#14162a);--mjt-wash:rgba(8,12,28,.5);--mjt-shadow:0 1px 1px rgba(0,0,0,.3),0 30px 70px -24px rgba(0,0,0,.8);color-scheme:dark}
.mjt-root :where(*,*::before,*::after){box-sizing:border-box}
.mjt-root :where(svg,canvas,img){display:block;max-width:none}
.mjt-root :where(button,input,textarea){font:inherit;color:inherit;letter-spacing:inherit;margin:0}
.mjt-root :where(button){background:none;border:0;padding:0;cursor:pointer;-webkit-tap-highlight-color:transparent}
.mjt-root :where(h1,h2,h3,p,ul,ol,figure,blockquote){margin:0;padding:0}
.mjt-root :where(ul,ol){list-style:none}
.mjt-root :where(a){color:inherit;text-decoration:none}
.mjt-root :where(button,a,input,textarea,[tabindex]):focus-visible{outline:2px solid var(--mjt-deep);outline-offset:3px;border-radius:12px}
.mjt-root[data-theme="dark"] :where(button,a,input,textarea,[tabindex]):focus-visible{outline-color:#fff}
.mjt-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
.mjt-defs{position:absolute;width:0;height:0;overflow:hidden}

.mjt-sky{position:sticky;top:0;height:var(--mjt-h);margin-bottom:calc(var(--mjt-h) * -1);z-index:0;overflow:hidden;background:#9ec2ea}
.mjt-root[data-theme="dark"] .mjt-sky{background:#0d1730}
.mjt-sky-layer{position:absolute;inset:-3%;animation:mjt-drift 38s ease-in-out infinite alternate}
.mjt-sky-layer .mjt-media{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.mjt-sky-layer[data-new]{animation:mjt-drift 38s ease-in-out infinite alternate,mjt-fade 1.1s ease both}
.mjt-sky-wash{position:absolute;inset:0;background:var(--mjt-wash);opacity:calc(var(--mjt-d,0) * .9);pointer-events:none}
@keyframes mjt-drift{from{transform:scale(1.02) translate3d(0,0,0)}to{transform:scale(1.08) translate3d(-1.2%,-.8%,0)}}
@keyframes mjt-fade{from{opacity:0}to{opacity:1}}

.mjt-media{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}

.mjt-dockwrap{position:sticky;top:12px;height:0;z-index:40}
.mjt-dock{position:absolute;left:50%;top:0;display:flex;align-items:center;gap:10px;padding:6px 6px 6px 8px;border-radius:999px;background:var(--mjt-glass);backdrop-filter:blur(16px) saturate(1.3);-webkit-backdrop-filter:blur(16px) saturate(1.3);box-shadow:var(--mjt-shadow);border:1px solid var(--mjt-glass-line);transform:translate(-50%,-160%);opacity:0;visibility:hidden;transition:transform .5s cubic-bezier(.2,.8,.2,1),opacity .3s ease,visibility 0s linear .5s;white-space:nowrap;overflow:hidden;max-width:calc(100vw - 24px)}
.mjt-dock[data-on]{transform:translate(-50%,0);opacity:1;visibility:visible;transition:transform .5s cubic-bezier(.2,.8,.2,1),opacity .3s ease,visibility 0s}
.mjt-dock-me{display:flex;align-items:center;gap:8px;font-weight:700;font-size:14px;padding-right:2px}
.mjt-dock-av{position:relative;width:28px;height:28px;border-radius:50%;overflow:hidden;background:var(--mjt-panel);flex:none}
.mjt-dock-time{font-weight:700;font-size:14px;padding:0 8px;font-variant-numeric:tabular-nums}
.mjt-dock-bar{position:absolute;left:18px;right:18px;bottom:2px;height:2px;border-radius:2px;background:var(--mjt-rule);overflow:hidden}
.mjt-dock-bar::after{content:"";position:absolute;inset:0;background:var(--mjt-panel);transform-origin:left;transform:scaleX(var(--mjt-p,0))}

.mjt-hero{position:relative;z-index:1;min-height:var(--mjt-h);display:grid;place-items:center;padding:clamp(30px,6vh,80px) 16px}
.mjt-board{position:relative;width:min(100%,1040px);padding:clamp(12px,2.2vw,26px);border-radius:clamp(30px,4.2vw,50px);background:var(--mjt-glass);backdrop-filter:blur(18px) saturate(1.25);-webkit-backdrop-filter:blur(18px) saturate(1.25);border:1px solid var(--mjt-glass-line);box-shadow:var(--mjt-shadow);display:grid;gap:clamp(12px,1.7vw,18px)}
.mjt-panel{position:relative;overflow:hidden;background:var(--mjt-panel);color:#fff;border-radius:clamp(22px,3.2vw,38px);padding:clamp(18px,3vw,36px) clamp(18px,3.4vw,42px) clamp(16px,2.4vw,28px);display:grid;gap:clamp(10px,1.4vw,16px);touch-action:pan-y}
.mjt-panel::before{content:"";position:absolute;inset:0;background:radial-gradient(120% 90% at 0% 0%,rgba(255,255,255,.22),rgba(255,255,255,0) 55%),radial-gradient(80% 70% at 100% 100%,rgba(0,0,30,.12),rgba(0,0,0,0) 60%);pointer-events:none}
.mjt-panel>*{position:relative}
.mjt-root[data-theme="dark"] .mjt-panel{background:color-mix(in srgb,var(--mjt-panel) 62%,#101326)}
.mjt-credit{position:absolute;top:clamp(14px,1.8vw,22px);right:clamp(18px,3.4vw,42px);font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;font-weight:700;color:var(--mjt-ink)}
.mjt-credit b{font-weight:500;letter-spacing:0;text-transform:none;font-size:13px;color:#fff;margin-left:4px}
.mjt-hello{display:flex;align-items:baseline;justify-content:space-between;gap:12px 24px;flex-wrap:wrap;margin-top:clamp(6px,1vw,12px)}
.mjt-h1{font-size:clamp(36px,6.4vw,78px);line-height:.98;font-weight:300;letter-spacing:-.025em}
.mjt-h1 b{font-weight:800}
.mjt-clock{display:flex;align-items:baseline;gap:.22em;font-size:clamp(36px,6.4vw,78px);line-height:.98;font-weight:800;letter-spacing:-.03em;font-variant-numeric:tabular-nums;border-radius:14px}
.mjt-clock i{font-style:normal;animation:mjt-blink 2s steps(1) infinite}
.mjt-clock small{font-size:.72em;font-weight:700;letter-spacing:-.01em}
@keyframes mjt-blink{50%{opacity:.55}}
.mjt-navrow{display:flex;align-items:center;justify-content:space-between;gap:10px 16px;flex-wrap:wrap}
.mjt-tabs{position:relative;display:flex;align-items:center;gap:2px;font-size:clamp(16px,2.1vw,24px)}
.mjt-tab{position:relative;z-index:1;padding:.12em .62em;border-radius:999px;font-weight:400;letter-spacing:-.01em;transition:color .3s,font-weight .3s}
.mjt-tab[aria-current="true"]{font-weight:800}
.mjt-tabs-pill{position:absolute;z-index:0;top:0;bottom:0;border-radius:999px;background:var(--mjt-deep);transition:left .5s cubic-bezier(.2,.8,.2,1),width .5s cubic-bezier(.2,.8,.2,1)}
.mjt-tabs-sm{font-size:13px;color:var(--mjt-text)}
.mjt-tabs-sm .mjt-tab[aria-current="true"]{color:#fff}
.mjt-status{position:relative;display:flex;align-items:stretch;border-radius:999px;font-size:11.5px;font-weight:600;box-shadow:0 1px 0 rgba(255,255,255,.25) inset}
.mjt-status-on{display:flex;align-items:center;gap:7px;padding:6px 12px 6px 11px;border-radius:999px 0 0 999px;background:var(--mjt-deep);color:#f4f2e6;min-width:7.5em}
.mjt-status-dot{width:7px;height:7px;border-radius:50%;background:#9be27a;box-shadow:0 0 0 3px rgba(155,226,122,.22);flex:none}
.mjt-status-dot[data-s="1"]{background:#f2c55c;box-shadow:0 0 0 3px rgba(242,197,92,.22)}
.mjt-status-dot[data-s="2"]{background:#a3a3a3;box-shadow:none}
.mjt-status-more{padding:6px 16px 6px 12px;border-radius:0 999px 999px 0;background:rgba(255,255,255,.82);color:#2a2c38}
.mjt-menu{position:absolute;right:0;top:calc(100% + 8px);z-index:20;min-width:210px;padding:6px;border-radius:18px;background:var(--mjt-card);color:var(--mjt-text);box-shadow:var(--mjt-shadow);border:1px solid var(--mjt-rule);display:grid;gap:2px;animation:mjt-pop .22s cubic-bezier(.2,.8,.2,1)}
.mjt-menu button{display:flex;align-items:center;gap:10px;text-align:left;padding:9px 12px;border-radius:12px;font-size:13.5px;font-weight:500}
.mjt-menu button:hover,.mjt-menu button:focus-visible{background:var(--mjt-soft);outline:none}
.mjt-menu svg{width:16px;height:16px;flex:none;opacity:.75}
@keyframes mjt-pop{from{opacity:0;transform:translateY(-6px) scale(.97)}to{opacity:1;transform:none}}
.mjt-meta{font-size:11.5px;letter-spacing:.14em;text-transform:uppercase;font-weight:700;color:var(--mjt-ink);display:flex;gap:10px;align-items:center}
.mjt-meta i{width:4px;height:4px;border-radius:50%;background:currentColor;opacity:.6;flex:none}
.mjt-meta span:first-child{white-space:nowrap}
.mjt-post{font-size:clamp(20px,2.35vw,27.5px);line-height:1.3;font-weight:400;letter-spacing:-.012em;min-height:3.9em;max-width:36em;text-wrap:pretty}
.mjt-post b{font-weight:800;color:var(--mjt-ink)}
.mjt-root[data-theme="dark"] .mjt-post b,.mjt-root[data-theme="dark"] .mjt-meta,.mjt-root[data-theme="dark"] .mjt-credit,.mjt-root[data-theme="dark"] .mjt-likes,.mjt-root[data-theme="dark"] .mjt-likes b{color:#fff}
.mjt-swap{animation:mjt-swap .7s cubic-bezier(.2,.8,.2,1) both}
@keyframes mjt-swap{from{opacity:0;transform:translateY(10px);filter:blur(4px)}to{opacity:1;transform:none;filter:none}}
.mjt-foot{display:flex;align-items:center;justify-content:space-between;gap:12px}
.mjt-likes{display:flex;align-items:center;gap:8px;font-size:clamp(13px,1.45vw,16.5px);color:var(--mjt-ink);text-align:left;border-radius:999px}
.mjt-likes b{font-weight:800}
.mjt-likes svg{width:18px;height:18px;flex:none;transition:transform .35s cubic-bezier(.3,1.6,.5,1)}
.mjt-likes[aria-pressed="true"] svg{transform:scale(1.18)}
.mjt-dots{display:flex;align-items:center;gap:7px}
.mjt-dot{position:relative;width:15px;height:15px;border-radius:999px;background:rgba(255,255,255,.75);overflow:hidden;transition:width .45s cubic-bezier(.2,.8,.2,1),background .3s}
.mjt-dot[aria-current="true"]{width:36px;background:color-mix(in srgb,var(--mjt-deep) 45%,transparent)}
.mjt-dot-fill{position:absolute;inset:0;border-radius:inherit;background:var(--mjt-deep);transform-origin:left;transform:scaleX(1)}
.mjt-dot-fill[data-run]{animation:mjt-fill var(--mjt-int,8s) linear both}
.mjt-dot-fill[data-paused]{animation-play-state:paused}
@keyframes mjt-fill{from{transform:scaleX(.1)}to{transform:scaleX(1)}}

.mjt-cards{display:grid;grid-template-columns:1fr 1fr 1fr;gap:clamp(10px,1.5vw,16px);height:clamp(260px,27vw,300px)}
.mjt-mid{display:grid;grid-template-rows:1fr 1fr;gap:clamp(10px,1.5vw,16px);min-height:0}
.mjt-photo{position:relative;overflow:hidden;border-radius:clamp(20px,2.6vw,30px);background:var(--mjt-panel);isolation:isolate;min-height:0}
.mjt-photo-open{position:absolute;inset:0;z-index:1;border-radius:inherit}
.mjt-photo .mjt-photo-box{transition:transform 1.2s cubic-bezier(.2,.8,.2,1)}
.mjt-photo:hover .mjt-photo-box{transform:scale(1.045)}
.mjt-photo::after{content:"";position:absolute;inset:0;background:linear-gradient(to top,rgba(10,14,24,.42),rgba(10,14,24,0) 46%);pointer-events:none}
.mjt-photo-box{position:absolute;inset:0;overflow:hidden}
.mjt-photo-box[data-new]{animation:mjt-photo-in 1.1s cubic-bezier(.2,.8,.2,1) both}
.mjt-blur{filter:blur(18px);transform:scale(1.12);transition:opacity .6s ease}
.mjt-sharp{opacity:0;transition:opacity .7s ease}
.mjt-photo-box[data-state="ready"] .mjt-sharp{opacity:1}
.mjt-photo-box[data-state="ready"] .mjt-blur{opacity:0}
.mjt-photo-box[data-state="failed"] .mjt-media{display:none}
@keyframes mjt-photo-in{from{opacity:0;transform:scale(1.06)}to{opacity:1;transform:none}}
.mjt-doodle{position:absolute;z-index:2;right:6%;top:7%;width:44%;pointer-events:none;filter:drop-shadow(0 1px 2px rgba(0,0,0,.25))}
.mjt-doodle path{fill:none;stroke:#fff;stroke-width:3.2;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:1;stroke-dashoffset:0}
.mjt-doodle[data-draw] path{animation:mjt-draw 1.5s cubic-bezier(.5,0,.3,1) both}
.mjt-doodle[data-draw] path+path{animation-delay:.9s}
@keyframes mjt-draw{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}
.mjt-chip{position:absolute;z-index:2;left:10%;bottom:30%;display:flex;align-items:center;gap:6px;padding:4px 6px 4px 11px;border-radius:999px;background:rgba(255,255,255,.88);color:#2c2e3a;font-size:11px;font-weight:600;box-shadow:0 6px 16px -8px rgba(0,0,0,.4);animation:mjt-pop .4s .5s cubic-bezier(.2,.8,.2,1) both}
.mjt-chip span{opacity:.55;font-weight:500}
.mjt-chip button{width:18px;height:18px;border-radius:50%;display:grid;place-items:center;background:rgba(0,0,0,.06)}
.mjt-chip svg{width:9px;height:9px}
.mjt-taken{position:absolute;z-index:2;left:10%;bottom:9%;color:#fff;font-size:12px;line-height:1.2;max-width:70%;text-shadow:0 1px 8px rgba(0,0,0,.35)}
.mjt-taken b{display:block;font-size:14px;font-weight:800}
.mjt-arch{position:absolute;z-index:2;left:8%;bottom:9%;color:#fff;font-size:12.5px;text-shadow:0 1px 8px rgba(0,0,0,.4);border-radius:8px}
.mjt-arch b{font-weight:800}
.mjt-heart{position:absolute;z-index:2;right:7%;bottom:7%;width:clamp(42px,4.6vw,52px);height:clamp(42px,4.6vw,52px);border-radius:50%;background:rgba(255,255,255,.92);display:grid;place-items:center;color:var(--mjt-panel);box-shadow:0 10px 24px -10px rgba(0,0,0,.5);transition:transform .2s}
.mjt-heart:active{transform:scale(.92)}
.mjt-heart svg{width:44%;height:44%;transition:transform .45s cubic-bezier(.3,1.7,.5,1)}
.mjt-heart[aria-pressed="true"] svg{transform:scale(1.15)}
.mjt-heart[aria-pressed="true"]{color:#e0566e}
.mjt-heart-n{position:absolute;right:-4px;top:-6px;min-width:22px;padding:2px 6px;border-radius:999px;background:var(--mjt-deep);color:#fff;font-size:10px;font-weight:700}
.mjt-burst{position:absolute;inset:-30%;pointer-events:none}
.mjt-burst i{position:absolute;left:50%;top:50%;width:6px;height:6px;margin:-3px;border-radius:50%;background:currentColor;animation:mjt-burst .7s cubic-bezier(.2,.8,.2,1) forwards;transform:rotate(var(--a)) translateY(0)}
@keyframes mjt-burst{to{transform:rotate(var(--a)) translateY(-34px);opacity:0}}

.mjt-tile{position:relative;overflow:hidden;border-radius:clamp(18px,2.4vw,26px);padding:clamp(13px,1.6vw,18px) clamp(14px,1.8vw,20px);display:flex;flex-direction:column;justify-content:space-between;min-height:0;color:var(--mjt-on)}
.mjt-music{background:var(--mjt-deep)}
.mjt-msgs{background:var(--mjt-olive)}
.mjt-tile-head{display:flex;align-items:center;justify-content:space-between;gap:8px;font-weight:800;font-size:clamp(15px,1.7vw,19px);letter-spacing:-.01em}
.mjt-tile-tools{display:flex;align-items:center;gap:2px}
.mjt-ibtn{position:relative;width:30px;height:30px;border-radius:50%;display:grid;place-items:center;transition:background .2s}
.mjt-ibtn:hover{background:rgba(255,255,255,.12)}
.mjt-ibtn svg{width:17px;height:17px}
.mjt-ibtn-sm svg{width:12px;height:12px}
.mjt-ibtn-sm{width:24px;height:24px;opacity:.75}
.mjt-badge{position:absolute;right:-1px;top:-1px;min-width:15px;height:15px;padding:0 4px;border-radius:999px;background:#f3efe0;color:var(--mjt-olive);font-size:9.5px;font-weight:800;display:grid;place-items:center}
.mjt-song{font-size:clamp(19px,2.2vw,27px);font-weight:300;letter-spacing:-.02em;line-height:1.05;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mjt-song-meta{font-size:clamp(11.5px,1.15vw,13.5px);line-height:1.38}
.mjt-song-meta b{font-weight:800}
.mjt-eq{display:inline-flex;align-items:flex-end;gap:2px;height:12px;margin-left:6px;vertical-align:-1px}
.mjt-eq i{width:2.5px;height:100%;border-radius:1px;background:currentColor;transform-origin:bottom;animation:mjt-eq .9s ease-in-out infinite alternate}
.mjt-eq i:nth-child(2){animation-delay:-.3s;animation-duration:.7s}
.mjt-eq i:nth-child(3){animation-delay:-.6s;animation-duration:1.1s}
.mjt-eq[data-paused] i{animation-play-state:paused;transform:scaleY(.3)}
@keyframes mjt-eq{from{transform:scaleY(.25)}to{transform:scaleY(1)}}
.mjt-prog{position:absolute;left:0;right:0;bottom:0;height:4px;background:rgba(255,255,255,.1);cursor:pointer}
.mjt-prog::before{content:"";position:absolute;left:0;right:0;bottom:-8px;height:14px}
.mjt-prog i{position:absolute;inset:0;background:color-mix(in srgb,var(--mjt-panel) 70%,#fff);transform-origin:left;transform:scaleX(var(--mjt-sp,0));transition:transform .25s linear}
.mjt-quote{font-size:clamp(12.5px,1.25vw,14.5px);line-height:1.32;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.mjt-quote-from{font-size:10.5px;letter-spacing:.12em;text-transform:uppercase;opacity:.75;font-weight:700;margin-bottom:2px}
.mjt-tile-foot{display:flex;align-items:center;justify-content:space-between;gap:8px;font-weight:800;font-size:clamp(12.5px,1.25vw,14.5px)}
.mjt-link{border-radius:8px;transition:opacity .2s}
.mjt-link:hover{opacity:.75}
.mjt-replyform{display:flex;align-items:center;gap:6px;background:rgba(255,255,255,.16);border-radius:999px;padding:3px 3px 3px 12px}
.mjt-replyform input{flex:1;min-width:0;background:none;border:0;outline:none;font-size:13px;color:#fff;padding:5px 0}
.mjt-replyform input::placeholder{color:rgba(255,255,255,.7)}
.mjt-replyform button{width:28px;height:28px;border-radius:50%;display:grid;place-items:center;background:#f6f3e6;color:var(--mjt-olive);flex:none}
.mjt-replyform button svg{width:13px;height:13px}
.mjt-replyform button:disabled{opacity:.5;cursor:default}
.mjt-note{font-size:12.5px;font-weight:600}

.mjt-scrub{position:relative;height:14px;border-radius:999px;background:var(--mjt-track);margin:2px clamp(4px,1vw,10px) 0;cursor:pointer;touch-action:none}
.mjt-scrub-thumb{position:absolute;top:2px;bottom:2px;width:calc(var(--mjt-s,.25) * 100%);left:calc(var(--mjt-p,0) * (100% - var(--mjt-s,.25) * 100%));border-radius:999px;background:#fff;box-shadow:0 2px 6px rgba(20,30,60,.2);cursor:grab;transition:box-shadow .2s}
.mjt-scrub[data-drag] .mjt-scrub-thumb{cursor:grabbing;box-shadow:0 2px 12px rgba(20,30,60,.35)}
.mjt-scrub:focus-visible{outline-offset:4px}

.mjt-star{position:absolute;z-index:5;width:clamp(36px,4.6vw,54px);height:clamp(36px,4.6vw,54px);transform:translate(-50%,-50%) rotate(var(--r,0deg));cursor:grab;touch-action:none;filter:drop-shadow(0 6px 8px rgba(70,50,10,.32));user-select:none;-webkit-user-select:none}
.mjt-star svg{width:100%;height:100%;animation:mjt-bob 5s ease-in-out infinite alternate;animation-delay:var(--dl,0s)}
.mjt-star[data-drag]{cursor:grabbing;filter:drop-shadow(0 12px 14px rgba(70,50,10,.38))}
.mjt-star[data-spin] svg{animation:mjt-spin .9s cubic-bezier(.3,1.4,.5,1)}
@keyframes mjt-bob{from{transform:rotate(-6deg) scale(1)}to{transform:rotate(7deg) scale(1.04)}}
@keyframes mjt-spin{from{transform:rotate(0) scale(1.2)}to{transform:rotate(360deg) scale(1)}}

.mjt-sec{position:relative;z-index:1;padding:clamp(24px,4.5vw,56px) 16px}
.mjt-frame{position:relative;width:min(100%,1160px);margin:0 auto;padding:clamp(14px,2.4vw,28px);border-radius:clamp(28px,4vw,48px);background:var(--mjt-glass);backdrop-filter:blur(18px) saturate(1.25);-webkit-backdrop-filter:blur(18px) saturate(1.25);border:1px solid var(--mjt-glass-line);box-shadow:var(--mjt-shadow)}
.mjt-head{display:flex;align-items:flex-end;justify-content:space-between;gap:12px 24px;flex-wrap:wrap;padding:clamp(6px,1.2vw,14px) clamp(6px,1.4vw,16px) clamp(16px,2.2vw,26px)}
.mjt-h2{font-size:clamp(34px,5.4vw,66px);line-height:1;font-weight:300;letter-spacing:-.03em}
.mjt-h2 b{font-weight:800}
.mjt-sub{color:var(--mjt-muted);font-size:14.5px;line-height:1.5;max-width:30em}

.mjt-profile{display:grid;grid-template-columns:1.25fr 1fr;gap:clamp(12px,1.7vw,18px)}
.mjt-pcard{position:relative;overflow:hidden;background:var(--mjt-panel);color:#fff;border-radius:clamp(22px,3vw,36px);padding:clamp(20px,3.2vw,40px);display:flex;flex-direction:column;gap:18px}
.mjt-root[data-theme="dark"] .mjt-pcard{background:color-mix(in srgb,var(--mjt-panel) 62%,#101326)}
.mjt-pcard::before{content:"";position:absolute;inset:0;background:radial-gradient(110% 80% at 100% 0%,rgba(255,255,255,.2),rgba(255,255,255,0) 55%);pointer-events:none}
.mjt-pcard>*{position:relative}
.mjt-who{display:flex;align-items:center;gap:16px}
.mjt-av{position:relative;width:clamp(64px,8vw,92px);height:clamp(64px,8vw,92px);border-radius:50%;overflow:hidden;flex:none;box-shadow:0 0 0 4px rgba(255,255,255,.85),0 12px 24px -10px rgba(0,0,0,.4)}
.mjt-who h3{font-size:clamp(26px,3.4vw,40px);font-weight:800;letter-spacing:-.02em;line-height:1}
.mjt-who p{font-size:13.5px;margin-top:6px;color:var(--mjt-ink);font-weight:600}
.mjt-root[data-theme="dark"] .mjt-who p,.mjt-root[data-theme="dark"] .mjt-bio b{color:#fff}
.mjt-role{font-size:12px;letter-spacing:.14em;text-transform:uppercase;font-weight:700;color:var(--mjt-ink)}
.mjt-root[data-theme="dark"] .mjt-role{color:#fff;opacity:.8}
.mjt-bio{font-size:clamp(18px,2vw,23px);line-height:1.35;letter-spacing:-.01em;text-wrap:pretty}
.mjt-bio b{font-weight:800;color:var(--mjt-ink)}
.mjt-pills{display:flex;flex-wrap:wrap;gap:8px;margin-top:auto}
.mjt-pill{display:inline-flex;align-items:center;gap:8px;padding:10px 18px;border-radius:999px;font-size:14px;font-weight:700;background:rgba(255,255,255,.88);color:#24263a;transition:transform .2s,background .2s}
.mjt-pill:hover{transform:translateY(-1px)}
.mjt-pill-dark{background:var(--mjt-deep);color:#fff}
.mjt-pill-ghost{background:rgba(255,255,255,.16);color:#fff;box-shadow:inset 0 0 0 1px rgba(255,255,255,.45)}
.mjt-pill svg{width:15px;height:15px}
.mjt-pside{display:grid;grid-template-rows:auto 1fr;gap:clamp(12px,1.7vw,18px)}
.mjt-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:clamp(10px,1.4vw,14px)}
.mjt-stat{background:var(--mjt-deep);color:#f6f4e8;border-radius:clamp(18px,2.2vw,24px);padding:16px 16px 14px}
.mjt-stat b{display:block;font-size:clamp(24px,3vw,36px);font-weight:800;letter-spacing:-.03em;line-height:1;font-variant-numeric:tabular-nums}
.mjt-stat span{display:block;margin-top:6px;font-size:12px;opacity:.75}
.mjt-pgrid{display:grid;grid-template-columns:1fr 1fr;gap:clamp(10px,1.4vw,14px)}
.mjt-now{background:var(--mjt-olive);color:var(--mjt-on);border-radius:clamp(18px,2.2vw,24px);padding:18px}
.mjt-now h4{margin:0 0 10px;font-size:16px;font-weight:800}
.mjt-now li{display:grid;gap:1px;padding:7px 0;border-top:1px solid rgba(255,255,255,.2);font-size:13.5px;font-weight:600}
.mjt-now li span{font-size:10.5px;letter-spacing:.12em;text-transform:uppercase;opacity:.75;font-weight:700}
.mjt-post-card{position:relative;overflow:hidden;border-radius:clamp(18px,2.2vw,24px);min-height:220px;background:#fff;padding:8px}
.mjt-post-card .mjt-pc-img{position:absolute;inset:8px 8px 48px;border-radius:16px;overflow:hidden}
.mjt-post-card p{position:absolute;left:16px;right:16px;bottom:12px;color:#2a2c38;font-size:13px;font-weight:700;display:flex;justify-content:space-between;gap:8px}
.mjt-post-card p b{font-weight:700;white-space:nowrap}
.mjt-post-card p span{font-weight:500;opacity:.6;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mjt-stamp{position:absolute;right:18px;top:18px;z-index:1;width:54px;height:64px;padding:4px;background:#fff;border-radius:3px;box-shadow:0 6px 14px -4px rgba(0,0,0,.35);transform:rotate(6deg)}
.mjt-stamp div{position:relative;width:100%;height:100%;background:var(--mjt-panel);border:1px dashed rgba(255,255,255,.7);display:grid;place-items:center;color:#fff;font-size:9.5px;font-weight:800;letter-spacing:.06em;text-align:center;line-height:1.1;padding:2px}

.mjt-filters{display:flex;flex-wrap:wrap;gap:6px}
.mjt-fchip{padding:8px 15px;border-radius:999px;font-size:13.5px;font-weight:600;background:var(--mjt-soft);transition:background .25s,color .25s}
.mjt-fchip[aria-pressed="true"]{background:var(--mjt-deep);color:#fff}
.mjt-fchip small{opacity:.55;margin-left:5px;font-size:11px}
.mjt-wall{columns:3 240px;column-gap:clamp(10px,1.4vw,16px)}
.mjt-wtile{position:relative;break-inside:avoid;margin-bottom:clamp(10px,1.4vw,16px);border-radius:clamp(18px,2.2vw,26px);overflow:hidden;aspect-ratio:4/3;background:var(--mjt-panel);isolation:isolate;animation:mjt-in .55s cubic-bezier(.2,.8,.2,1) both}
.mjt-wtile[data-tall]{aspect-ratio:3/4}
.mjt-wtile .mjt-photo-box{transition:transform 1.2s cubic-bezier(.2,.8,.2,1)}
.mjt-wtile:hover .mjt-photo-box{transform:scale(1.05)}
.mjt-wtile::after{content:"";position:absolute;inset:0;background:linear-gradient(to top,rgba(10,14,24,.5),rgba(10,14,24,0) 42%);pointer-events:none;opacity:.85}
.mjt-wcap{position:absolute;z-index:2;left:16px;right:72px;bottom:14px;color:#fff;font-size:14px;font-weight:700;line-height:1.25;text-shadow:0 1px 8px rgba(0,0,0,.35);pointer-events:none}
.mjt-wcap span{display:block;font-size:11px;font-weight:600;opacity:.8;letter-spacing:.1em;text-transform:uppercase;margin-bottom:3px}
.mjt-wtile .mjt-heart{right:12px;bottom:12px;width:40px;height:40px}
@keyframes mjt-in{from{opacity:0;transform:translateY(14px) scale(.98)}to{opacity:1;transform:none}}

.mjt-archive{display:grid;grid-template-columns:240px 1fr;gap:clamp(12px,1.7vw,18px)}
.mjt-aside{display:grid;align-content:start;gap:12px;position:sticky;top:76px;min-width:0}
.mjt-search{display:flex;align-items:center;gap:8px;padding:0 14px;height:46px;border-radius:999px;background:var(--mjt-card);box-shadow:inset 0 0 0 1px var(--mjt-rule)}
.mjt-search svg{width:16px;height:16px;opacity:.55;flex:none}
.mjt-search input{flex:1;min-width:0;width:100%;border:0;outline:none;background:none;font-size:14px}
.mjt-search:focus-within{box-shadow:inset 0 0 0 2px var(--mjt-panel)}
.mjt-months{display:grid;gap:2px;padding:8px;border-radius:22px;background:var(--mjt-card)}
.mjt-months button{display:flex;justify-content:space-between;padding:9px 12px;border-radius:14px;font-size:14px;font-weight:500;text-align:left}
.mjt-months button span{opacity:.5;font-variant-numeric:tabular-nums}
.mjt-months button[aria-pressed="true"]{background:var(--mjt-panel);color:#fff;font-weight:700}
.mjt-months button[aria-pressed="true"] span{opacity:.85}
.mjt-list{display:grid;gap:10px;align-content:start}
.mjt-item{display:grid;grid-template-columns:auto 1fr;gap:16px;padding:12px;border-radius:24px;background:var(--mjt-card);animation:mjt-in .5s cubic-bezier(.2,.8,.2,1) both}
.mjt-thumb{position:relative;width:clamp(76px,9vw,112px);aspect-ratio:1;border-radius:18px;overflow:hidden;background:var(--mjt-panel)}
.mjt-item-top{display:flex;align-items:center;gap:10px;flex-wrap:wrap;font-size:12px;color:var(--mjt-muted);font-weight:600}
.mjt-item-top b{color:var(--mjt-text);font-size:15.5px;font-weight:800;letter-spacing:-.01em}
.mjt-tagchip{padding:3px 9px;border-radius:999px;background:var(--mjt-soft);font-size:11px;font-weight:600;color:var(--mjt-text)}
.mjt-item-text{margin-top:6px;font-size:15px;line-height:1.45;color:var(--mjt-text)}
.mjt-item-text b{font-weight:800}
.mjt-item-text[data-clamp]{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.mjt-item-acts{margin-top:8px;display:flex;align-items:center;gap:14px;font-size:13px;font-weight:700;flex-wrap:wrap}
.mjt-item-acts .mjt-l{color:var(--mjt-muted);font-weight:600;display:inline-flex;align-items:center;gap:5px}
.mjt-item-acts svg{width:13px;height:13px}
.mjt-textbtn{border-radius:8px;text-decoration:underline;text-decoration-thickness:1px;text-underline-offset:3px;text-decoration-color:var(--mjt-rule)}
.mjt-textbtn:hover{text-decoration-color:currentColor}
.mjt-textbtn[disabled]{text-decoration:none;opacity:.55;cursor:default}
.mjt-morebtn{justify-self:center;margin-top:6px;padding:11px 22px}
.mjt-empty{padding:40px 20px;text-align:center;color:var(--mjt-muted);border-radius:24px;background:var(--mjt-card)}

.mjt-gb{display:grid;grid-template-columns:minmax(260px,.8fr) 1.4fr;gap:clamp(12px,1.7vw,18px)}
.mjt-gform{background:var(--mjt-olive);color:var(--mjt-on);border-radius:clamp(22px,3vw,32px);padding:clamp(18px,2.6vw,30px);display:grid;gap:12px;align-content:start}
.mjt-gform label{display:grid;gap:6px;font-size:11px;letter-spacing:.12em;text-transform:uppercase;font-weight:700}
.mjt-gform input,.mjt-gform textarea{border:0;outline:none;border-radius:16px;padding:12px 14px;background:rgba(255,255,255,.9);color:#23251c;font-size:15px;letter-spacing:0;text-transform:none;font-weight:500;resize:none}
.mjt-gform input:focus,.mjt-gform textarea:focus{box-shadow:0 0 0 2px var(--mjt-deep)}
.mjt-gform-row{display:flex;align-items:center;justify-content:space-between;gap:10px;font-size:12px}
.mjt-gform .mjt-pill-dark{padding:11px 22px}
.mjt-board2{position:relative;min-height:360px;border-radius:clamp(22px,3vw,32px);background:repeating-linear-gradient(0deg,transparent 0 27px,var(--mjt-rule) 27px 28px),var(--mjt-card);padding:clamp(18px,2.6vw,30px);display:flex;flex-wrap:wrap;align-content:flex-start;gap:18px;overflow:hidden}
.mjt-sticky{position:relative;width:min(100%,200px);padding:22px 16px 14px;border-radius:6px 6px 16px 6px;box-shadow:0 14px 24px -14px rgba(0,0,0,.45);transform:rotate(var(--r,0deg));font-size:14.5px;line-height:1.38;font-weight:500;animation:mjt-in .55s cubic-bezier(.2,.8,.2,1) both}
.mjt-sticky b{display:block;margin-top:10px;font-size:12px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;opacity:.85}
.mjt-sticky[data-c="0"]{background:var(--mjt-panel);color:#fff}
.mjt-sticky[data-c="1"]{background:#f7f4e8;color:#2a2b20}
.mjt-sticky[data-c="2"]{background:var(--mjt-olive);color:#fff}
.mjt-sticky[data-c="3"]{background:var(--mjt-deep);color:#f4f1e2}
.mjt-sticky .mjt-pin{position:absolute;left:50%;top:-14px;width:30px;height:30px;transform:translateX(-50%);filter:drop-shadow(0 3px 4px rgba(70,50,10,.35))}

.mjt-footer{position:relative;z-index:1;padding:clamp(24px,4vw,48px) 16px clamp(28px,5vw,56px)}
.mjt-footer .mjt-frame{display:grid;gap:22px;padding:clamp(22px,3.4vw,44px)}
.mjt-footer .mjt-panel{gap:22px}
.mjt-fbig{font-size:clamp(38px,7vw,96px);line-height:.95;font-weight:300;letter-spacing:-.035em}
.mjt-fbig b{font-weight:800;color:var(--mjt-ink)}
.mjt-root[data-theme="dark"] .mjt-fbig b{color:#fff}
.mjt-footer .mjt-panel .mjt-frow{color:var(--mjt-ink);font-weight:600}
.mjt-root[data-theme="dark"] .mjt-footer .mjt-panel .mjt-frow{color:#fff}
.mjt-frow{display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;font-size:13.5px}
.mjt-frow .mjt-scrub{flex:1;min-width:160px;max-width:420px;margin:0}
.mjt-frow nav{display:flex;gap:6px;flex-wrap:wrap}

.mjt-toast{position:fixed;left:50%;bottom:22px;z-index:60;transform:translate(-50%,0);padding:11px 18px;border-radius:999px;background:var(--mjt-deep);color:#fff;font-size:13.5px;font-weight:600;box-shadow:var(--mjt-shadow);animation:mjt-toast .4s cubic-bezier(.2,.8,.2,1) both;pointer-events:none}
@keyframes mjt-toast{from{opacity:0;transform:translate(-50%,12px)}to{opacity:1;transform:translate(-50%,0)}}

.mjt-lb{position:fixed;inset:0;z-index:70;display:grid;place-items:center;padding:clamp(12px,3vw,40px);background:rgba(12,14,24,.72);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);animation:mjt-fade .3s ease both}
.mjt-lb-card{position:relative;width:min(100%,1100px);max-height:calc(100svh - 24px);display:grid;grid-template-rows:minmax(0,1fr) auto;gap:12px;padding:12px;border-radius:clamp(24px,3vw,36px);background:var(--mjt-glass);border:1px solid var(--mjt-glass-line);box-shadow:var(--mjt-shadow);animation:mjt-pop .4s cubic-bezier(.2,.8,.2,1) both}
.mjt-lb-img{position:relative;height:min(68svh,640px);border-radius:clamp(18px,2.4vw,26px);overflow:hidden;background:var(--mjt-panel)}
.mjt-lb-img .mjt-sharp{object-fit:contain}
.mjt-lb-img .mjt-blur{opacity:1 !important;filter:blur(28px) brightness(.8)}
.mjt-lb-bar{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;padding:4px 8px 6px}
.mjt-lb-bar h3{font-size:clamp(18px,2.2vw,24px);font-weight:800;letter-spacing:-.01em}
.mjt-lb-bar p{font-size:13px;color:var(--mjt-muted);margin-top:3px}
.mjt-lb-tags{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}
.mjt-lb-acts{display:flex;align-items:center;gap:8px}
.mjt-lb-acts .mjt-heart{position:relative;right:auto;bottom:auto;width:44px;height:44px;background:var(--mjt-card);box-shadow:inset 0 0 0 1px var(--mjt-rule)}
.mjt-rbtn{width:44px;height:44px;border-radius:50%;display:grid;place-items:center;background:var(--mjt-card);box-shadow:inset 0 0 0 1px var(--mjt-rule)}
.mjt-rbtn svg{width:16px;height:16px}
.mjt-lb-n{font-size:13px;font-weight:700;font-variant-numeric:tabular-nums;color:var(--mjt-muted);padding:0 6px}
.mjt-lb-close{position:absolute;top:22px;right:22px;z-index:3;background:rgba(255,255,255,.92);color:#222}

.mjt-rv[data-armed]{opacity:0;transform:translateY(26px);transition:opacity .8s cubic-bezier(.2,.8,.2,1),transform .8s cubic-bezier(.2,.8,.2,1)}
.mjt-rv[data-armed][data-in]{opacity:1;transform:none}

.mjt-song-row{display:flex;align-items:flex-end;gap:12px;min-width:0}
.mjt-song-text{flex:1;min-width:0}
.mjt-art{position:relative;flex:none;width:clamp(52px,5.4vw,64px);height:clamp(52px,5.4vw,64px);margin-right:12px}
.mjt-art img{position:relative;z-index:1;width:100%;height:100%;object-fit:cover;border-radius:10px;box-shadow:0 8px 18px -8px rgba(0,0,0,.6)}
.mjt-vinyl{position:absolute;inset:6%;border-radius:50%;background:radial-gradient(circle,#d9c27a 0 14%,#111 15% 18%,#1b1b1b 19% 30%,#0e0e0e 31% 44%,#1b1b1b 45% 58%,#0c0c0c 59% 100%);box-shadow:inset 0 0 0 1px rgba(255,255,255,.08);transition:transform .7s cubic-bezier(.2,.8,.2,1)}
.mjt-art[data-playing] .mjt-vinyl{transform:translateX(38%);animation:mjt-turn 2.4s linear infinite}
@keyframes mjt-turn{from{rotate:0deg}to{rotate:360deg}}
.mjt-face{display:inline-block;width:18px;height:18px;border-radius:50%;object-fit:cover;vertical-align:-5px;margin-right:6px;box-shadow:0 0 0 1.5px rgba(255,255,255,.7)}
.mjt-root[data-theme="dark"] .mjt-sky .mjt-media{filter:brightness(.42) saturate(.75) contrast(1.05)}
.mjt-root[data-theme="dark"] .mjt-sky-wash{background:linear-gradient(180deg,rgba(10,14,40,.55),rgba(8,10,28,.35) 50%,rgba(6,8,20,.7))}
.mjt-root[data-theme="dark"] .mjt-sky::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(18,24,70,.45),rgba(10,12,30,.2) 60%,rgba(6,8,20,.55));pointer-events:none}
.mjt-root[data-theme="dark"] .mjt-photo .mjt-media,.mjt-root[data-theme="dark"] .mjt-wtile .mjt-media{filter:brightness(.82) saturate(.9)}
.mjt-board{animation:mjt-rise 1.1s cubic-bezier(.2,.8,.2,1) both}
.mjt-panel>*,.mjt-cards>*,.mjt-board>.mjt-scrub{animation:mjt-up .9s cubic-bezier(.2,.8,.2,1) both}
.mjt-panel>:nth-child(2){animation-delay:.15s}
.mjt-panel>:nth-child(3){animation-delay:.25s}
.mjt-panel>:nth-child(4){animation-delay:.35s}
.mjt-panel>:nth-child(5){animation-delay:.45s}
.mjt-cards>:nth-child(1){animation-delay:.4s}
.mjt-cards>:nth-child(2){animation-delay:.5s}
.mjt-cards>:nth-child(3){animation-delay:.6s}
.mjt-board>.mjt-scrub{animation-delay:.7s}
.mjt-board>.mjt-star{animation:mjt-star-in .7s cubic-bezier(.3,1.6,.5,1) backwards}
.mjt-board>.mjt-star:nth-of-type(1){animation-delay:.9s}
.mjt-board>.mjt-star:nth-of-type(2){animation-delay:1s}
.mjt-board>.mjt-star:nth-of-type(3){animation-delay:1.1s}
.mjt-board>.mjt-star:nth-of-type(4){animation-delay:1.2s}
@keyframes mjt-rise{from{opacity:0;transform:translateY(40px) scale(.97)}to{opacity:1;transform:none}}
@keyframes mjt-up{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
@keyframes mjt-star-in{from{scale:0;opacity:0}to{opacity:1}}

@media (max-width:860px){
.mjt-profile,.mjt-gb{grid-template-columns:1fr}
.mjt-archive{grid-template-columns:1fr}
.mjt-aside{position:relative;top:auto}
.mjt-months{display:flex;overflow-x:auto;scrollbar-width:none;padding:6px}
.mjt-months button{flex:none;gap:8px}
}
@media (max-width:640px){
.mjt-credit{display:none}
.mjt-hello{align-items:flex-start;flex-direction:column;gap:6px}
.mjt-clock{font-size:26px;position:absolute;right:0;top:-2px}
.mjt-hello{position:relative}
.mjt-h1{font-size:40px;margin-top:28px}
.mjt-tabs{font-size:16px;margin-left:-.5em}
.mjt-cards{grid-template-columns:1fr 1fr;height:auto}
.mjt-cards>.mjt-photo{height:230px}
.mjt-mid{grid-column:1/-1;order:2;grid-template-rows:none;grid-template-columns:1fr}
.mjt-tile{min-height:148px}
.mjt-stats b{font-size:24px}
.mjt-pgrid{grid-template-columns:1fr}
.mjt-dock .mjt-tabs-sm{display:none}
.mjt-item{grid-template-columns:1fr}
.mjt-thumb{width:100%;aspect-ratio:16/9}
.mjt-lb-img{height:52svh}
.mjt-arch{top:9%;bottom:auto}
.mjt-board>.mjt-star:nth-of-type(n+3){display:none}
}
@media (prefers-reduced-motion:reduce){
.mjt-root *,.mjt-root *::before,.mjt-root *::after{animation-duration:.001ms !important;animation-delay:0s !important;animation-iteration-count:1 !important;transition-duration:.001ms !important}
.mjt-sky-layer{animation:none}
.mjt-clock i{animation:none}
.mjt-rv[data-armed]{opacity:1;transform:none}
}
`


/** Read at the moment, for handlers that can fire before the hook below has caught up. */
function prefersReduced() {
  return typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches
}

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
  return [dark, setDark] as const
}

/** True once the element has been near the screen, and whether it is on screen now. */
function useOnScreen(ref: { current: Element | null }, margin = "0px") {
  const [state, setState] = React.useState({ seen: false, now: false })
  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    if (typeof IntersectionObserver === "undefined") {
      setState({ seen: true, now: true })
      return
    }
    const io = new IntersectionObserver(
      (es) => {
        const on = es[es.length - 1].isIntersecting
        setState((s) => (s.now === on && (s.seen || !on) ? s : { seen: s.seen || on, now: on }))
      },
      { rootMargin: margin }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [ref, margin])
  return state
}

/** Reveal-on-scroll, armed only after mount, so nothing is hidden without JS or under reduced motion. */
function useReveal(root: { current: HTMLElement | null }, reduced: boolean) {
  React.useEffect(() => {
    const el = root.current
    if (!el || reduced || typeof IntersectionObserver === "undefined") return
    const items = Array.from(el.querySelectorAll(".mjt-rv"))
    const io = new IntersectionObserver(
      (es) => {
        for (const e of es) if (e.isIntersecting) {
          e.target.setAttribute("data-in", "")
          io.unobserve(e.target)
        }
      },
      { rootMargin: "0px 0px -8% 0px" }
    )
    for (const it of items) {
      it.setAttribute("data-armed", "")
      io.observe(it)
    }
    return () => io.disconnect()
  }, [root, reduced])
}

/** The nearest scrolling ancestor, or null for the window. */
function scrollHost(el: HTMLElement) {
  let n = el.parentElement
  while (n && n !== document.body && n !== document.documentElement) {
    const s = getComputedStyle(n)
    if (/(auto|scroll)/.test(s.overflowY) && n.scrollHeight > n.clientHeight + 1) return n
    n = n.parentElement
  }
  return null
}

function scrollByPx(el: HTMLElement, dy: number, smooth: boolean) {
  const host = scrollHost(el)
  const opts = { top: dy, behavior: (smooth ? "smooth" : "auto") as ScrollBehavior }
  if (host) host.scrollBy(opts)
  else window.scrollBy(opts)
}

/* ---------- photographs ---------- */

type PhotoProps = { shot: MjtShot; sizes?: string; max?: number; eager?: boolean; label?: string; fresh?: boolean; className?: string; square?: number }

/**
 * A photograph that fills its positioned parent: a responsive srcset, the
 * shot's tone underneath, a tiny blurred copy while the real one loads, then
 * a soft fade in. Preflight is guarded (max-width: none).
 */
function Photo({ shot, sizes = "50vw", max = 2200, eager, label, fresh, className, square }: PhotoProps) {
  const [state, setState] = React.useState("loading" as "loading" | "ready" | "failed")
  const img = React.useRef(null as HTMLImageElement | null)
  React.useEffect(() => {
    setState("loading")
    const el = img.current
    if (el && el.complete && el.naturalWidth) setState("ready")
  }, [shot.src])
  const isUnsplash = /^https:\/\/images\.unsplash\.com\//.test(shot.src)
  const aria = label === "" ? { "aria-hidden": true } : { role: "img", "aria-label": label || shot.alt || "" }
  return (
    <div className={"mjt-photo-box" + (className ? " " + className : "")} data-state={state} data-new={fresh ? "" : undefined} style={{ background: shot.tone || "var(--mjt-panel)" }} {...aria}>
      {isUnsplash && !square && <img className="mjt-media mjt-blur" src={sized(shot.src, 32)} alt="" aria-hidden="true" style={{ maxWidth: "none", objectPosition: shot.focus }} />}
      <img
        ref={img}
        className="mjt-media mjt-sharp"
        src={square ? sized(shot.src, square, square) : sized(shot.src, Math.min(max, 1200))}
        srcSet={square ? undefined : srcSet(shot.src, max) || undefined}
        sizes={square ? undefined : sizes}
        alt=""
        draggable={false}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        onLoad={() => setState("ready")}
        onError={() => setState("failed")}
        style={{ maxWidth: "none", objectPosition: shot.focus }}
      />
    </div>
  )
}

/* ---------- small pieces ---------- */

function Rich({ text }: { text: string }) {
  return (
    <>
      {richParts(text).map((p, i) => (p.bold ? <b key={i}>{p.text}</b> : <React.Fragment key={i}>{p.text}</React.Fragment>))}
    </>
  )
}

const I = {
  heart: "M12 20.5s-7.5-4.4-7.5-10.2A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.7c0 5.8-7.5 10.2-7.5 10.2Z",
  note: "M9 17.5V6l10-2v11.5M9 17.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Zm10-2a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z",
  play: "M8 5.5v13l11-6.5-11-6.5Z",
  pause: "M8 5v14M16 5v14",
  prev: "M7 6v12M18 6l-8 6 8 6V6Z",
  next: "M17 6v12M6 6l8 6-8 6V6Z",
  chat: "M4 5.5h16v10H9l-5 4v-14ZM8 9.5h8M8 12.5h5",
  send: "M4 12 20 4l-6 16-3-7-7-1Z",
  x: "M6 6l12 12M18 6 6 18",
  link: "M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1",
  moon: "M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z",
  sun: "M12 7.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9ZM12 2v2M12 20v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2 12h2M20 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4",
  pen: "M4 20h4L19 9l-4-4L4 16v4ZM13.5 6.5l4 4",
  plus: "M12 5v14M5 12h14",
  check: "M5 12.5 10 17l9-10",
  search: "M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13ZM20 20l-4.8-4.8",
  left: "M15 5l-7 7 7 7",
  right: "M9 5l7 7-7 7",
  up: "M12 19V5M5 12l7-7 7 7",
  pin: "M12 3v6M8 9h8l-1 5H9L8 9ZM12 14v7",
}

function Icon({ d, fill }: { d: string; fill?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill={fill ? "currentColor" : "none"} stroke="currentColor" strokeWidth={fill ? 0 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  )
}

/** A rounded five-point star, as a path in a 48 box. */
function starPath() {
  const pts = [] as string[]
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? 9.5 : 20
    const a = (i * Math.PI) / 5 - Math.PI / 2
    pts.push((24 + Math.cos(a) * r).toFixed(2) + " " + (24 + Math.sin(a) * r).toFixed(2))
  }
  return "M" + pts.join("L") + "Z"
}
const STAR = starPath()

function StarArt({ uid }: { uid: string }) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <path d={STAR} fill={"url(#" + uid + "-gold)"} stroke={"url(#" + uid + "-gold)"} strokeWidth="6" strokeLinejoin="round" />
      <path d={STAR} fill="none" stroke={"url(#" + uid + "-rim)"} strokeWidth="1.4" strokeLinejoin="round" transform="translate(24 24) scale(1.12) translate(-24 -24)" />
      <ellipse cx="18" cy="15" rx="5" ry="2.6" fill="#fffbe8" opacity=".75" transform="rotate(-28 18 15)" />
      <circle cx="29.5" cy="13.5" r="1.3" fill="#fffbe8" opacity=".8" />
    </svg>
  )
}

function Burst({ k }: { k: number }) {
  if (!k) return null
  return (
    <span className="mjt-burst" key={k} aria-hidden="true">
      {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
        <i key={a} style={{ ["--a" as string]: a + "deg" } as React.CSSProperties} />
      ))}
    </span>
  )
}

function HeartButton({ on, count, label, onToggle, showCount }: { on: boolean; count?: number; label: string; onToggle: () => void; showCount?: boolean }) {
  const [burst, setBurst] = React.useState(0)
  return (
    <button
      type="button"
      className="mjt-heart"
      aria-pressed={on}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation()
        if (!on) setBurst((b) => b + 1)
        onToggle()
      }}
    >
      <Icon d={I.heart} fill={on} />
      <Burst k={burst} />
      {showCount && count !== undefined && <span className="mjt-heart-n">{compact(count)}</span>}
    </button>
  )
}

/* ---------- the music box ---------- */

/**
 * A small music box, synthesised with Web Audio: a sine with a bell partial,
 * a soft low-pass and a feedback echo. It schedules a quarter second ahead.
 */
class MusicBox {
  ctx = null as AudioContext | null
  bus = null as GainNode | null
  timer = 0
  step = 0
  at = 0
  key = 0
  seed = 0
  stepLen = 60 / 84 / 2
  started = 0
  offset = 0

  ensure() {
    if (this.ctx) return true
    const w = window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }
    const AC = w.AudioContext || w.webkitAudioContext
    if (!AC) return false
    const ctx = new AC()
    const bus = ctx.createGain()
    bus.gain.value = 0.5
    const lp = ctx.createBiquadFilter()
    lp.type = "lowpass"
    lp.frequency.value = 2600
    const master = ctx.createGain()
    master.gain.value = 0.22
    const delay = ctx.createDelay(1)
    delay.delayTime.value = 0.31
    const fb = ctx.createGain()
    fb.gain.value = 0.28
    const wet = ctx.createGain()
    wet.gain.value = 0.26
    bus.connect(lp)
    lp.connect(master)
    lp.connect(delay)
    delay.connect(fb)
    fb.connect(delay)
    delay.connect(wet)
    wet.connect(master)
    master.connect(ctx.destination)
    this.ctx = ctx
    this.bus = bus
    return true
  }

  voice(midi: number, vel: number, t: number) {
    const ctx = this.ctx
    const bus = this.bus
    if (!ctx || !bus) return
    const f = 440 * Math.pow(2, (midi - 69) / 12)
    const g = ctx.createGain()
    g.gain.setValueAtTime(0, t)
    g.gain.linearRampToValueAtTime(vel, t + 0.006)
    g.gain.exponentialRampToValueAtTime(0.0006, t + 1.9)
    g.connect(bus)
    const o = ctx.createOscillator()
    o.type = "sine"
    o.frequency.value = f
    o.connect(g)
    const bell = ctx.createOscillator()
    const bg = ctx.createGain()
    bell.type = "sine"
    bell.frequency.value = f * 4.01
    bg.gain.setValueAtTime(vel * 0.22, t)
    bg.gain.exponentialRampToValueAtTime(0.0004, t + 0.35)
    bell.connect(bg)
    bg.connect(bus)
    o.start(t)
    bell.start(t)
    o.stop(t + 2)
    bell.stop(t + 0.4)
  }

  play(song: MjtSong, from: number) {
    if (!this.ensure() || !this.ctx) return false
    this.stopTimer()
    this.key = song.key === undefined ? hash(song.title) % 12 : song.key
    this.seed = hash(song.title + song.artist)
    this.step = Math.floor(from / this.stepLen)
    this.offset = from
    void this.ctx.resume()
    this.at = this.ctx.currentTime + 0.06
    this.started = this.at
    this.pump()
    this.timer = window.setInterval(() => this.pump(), 80)
    return true
  }

  pump() {
    const ctx = this.ctx
    if (!ctx) return
    while (this.at < ctx.currentTime + 0.28) {
      for (const n of noteAt(this.step, this.key, this.seed)) this.voice(n[0], n[1], this.at)
      this.at += this.stepLen
      this.step++
    }
  }

  elapsed() {
    if (!this.ctx || !this.timer) return this.offset
    return this.offset + Math.max(0, this.ctx.currentTime - this.started)
  }

  stopTimer() {
    if (this.timer) window.clearInterval(this.timer)
    this.timer = 0
  }

  pause() {
    this.offset = this.elapsed()
    this.stopTimer()
    if (this.ctx) void this.ctx.suspend()
  }

  close() {
    this.stopTimer()
    if (this.ctx) void this.ctx.close()
    this.ctx = null
    this.bus = null
  }
}

function MusicCard({ songs, L }: { songs: MjtSong[]; L: typeof DEFAULT_LABELS }) {
  const [si, setSi] = React.useState(0)
  const [playing, setPlaying] = React.useState(false)
  const [t, setT] = React.useState(0)
  const box = React.useRef(null as MusicBox | null)
  const audio = React.useRef(null as HTMLAudioElement | null)
  const song = songs[si % songs.length]

  const stopAll = () => {
    if (box.current) box.current.pause()
    if (audio.current) audio.current.pause()
  }
  const start = (i: number, from: number) => {
    const s = songs[i % songs.length]
    stopAll()
    if (s.src) {
      if (!audio.current) audio.current = new Audio()
      const a = audio.current
      if (a.src !== s.src) a.src = s.src
      try {
        a.currentTime = from
      } catch {
        /* not seekable yet */
      }
      a.play().catch(() => setPlaying(false))
    } else {
      if (!box.current) box.current = new MusicBox()
      if (!box.current.play(s, from)) return setPlaying(false)
    }
    setPlaying(true)
  }
  const now = () => (song.src ? (audio.current ? audio.current.currentTime : t) : box.current ? box.current.elapsed() : t)

  React.useEffect(() => {
    if (!playing) return
    const id = window.setInterval(() => {
      const e = now()
      if (e >= song.duration) {
        const n = (si + 1) % songs.length
        setSi(n)
        setT(0)
        start(n, 0)
      } else setT(e)
    }, 250)
    return () => window.clearInterval(id)
  })
  React.useEffect(
    () => () => {
      if (box.current) box.current.close()
      if (audio.current) audio.current.pause()
    },
    []
  )

  const toggle = () => {
    if (playing) {
      stopAll()
      setT(now())
      setPlaying(false)
    } else start(si, t)
  }
  const go = (d: number) => {
    const n = (si + d + songs.length) % songs.length
    setSi(n)
    setT(0)
    if (playing) start(n, 0)
  }
  const seek = (e: React.PointerEvent) => {
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const v = Math.min(0.999, Math.max(0, (e.clientX - r.left) / r.width)) * song.duration
    setT(v)
    if (playing) start(si, v)
  }

  return (
    <div className="mjt-tile mjt-music" style={{ ["--mjt-sp" as string]: String(Math.min(1, t / song.duration)) } as React.CSSProperties}>
      <div className="mjt-tile-head">
        <span>
          {L.nowPlaying}
          <span className="mjt-eq" data-paused={playing ? undefined : ""} aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
        </span>
        <span className="mjt-tile-tools">
          {songs.length > 1 && (
            <button type="button" className="mjt-ibtn mjt-ibtn-sm" aria-label={L.prevSong} onClick={() => go(-1)}>
              <Icon d={I.prev} fill />
            </button>
          )}
          <button type="button" className="mjt-ibtn" aria-label={(playing ? L.pause : L.play) + ": " + song.title} aria-pressed={playing} onClick={toggle}>
            <Icon d={playing ? I.pause : t > 0 ? I.play : I.note} fill={t > 0 && !playing} />
          </button>
          {songs.length > 1 && (
            <button type="button" className="mjt-ibtn mjt-ibtn-sm" aria-label={L.nextSong} onClick={() => go(1)}>
              <Icon d={I.next} fill />
            </button>
          )}
        </span>
      </div>
      <div key={si} className="mjt-swap mjt-song-row">
        <div className="mjt-song-text">
        <p className="mjt-song">{song.title}</p>
        <p className="mjt-song-meta">
          {L.songBy} <b>{song.artist}</b>
          <br />
          {L.album} <b>{song.album}</b>
          <br />
          {L.duration} <b>{playing || t > 0 ? mmss(t) + " / " + mmss(song.duration) : mmss(song.duration)}</b> {L.minutes}
        </p>
        </div>
        {song.cover && (
          <span className="mjt-art" data-playing={playing ? "" : undefined} aria-hidden="true">
            <span className="mjt-vinyl" />
            <img src={sized(song.cover, 160, 160)} alt="" draggable={false} style={{ maxWidth: "none" }} />
          </span>
        )}
      </div>
      <div
        className="mjt-prog"
        role="slider"
        tabIndex={0}
        aria-label={song.title}
        aria-valuemin={0}
        aria-valuemax={song.duration}
        aria-valuenow={Math.round(t)}
        aria-valuetext={mmss(t)}
        onPointerDown={seek}
        onKeyDown={(e) => {
          if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return
          e.preventDefault()
          const v = Math.min(song.duration - 1, Math.max(0, t + (e.key === "ArrowRight" ? 10 : -10)))
          setT(v)
          if (playing) start(si, v)
        }}
      >
        <i />
      </div>
    </div>
  )
}

/* ---------- messages ---------- */

function MessagesCard({ messages, L, onReply, toast, replyRef }: { messages: MjtMessage[]; L: typeof DEFAULT_LABELS; onReply?: (m: MjtMessage, t: string) => unknown; toast: (s: string) => void; replyRef: { current: (() => void) | null } }) {
  const [mi, setMi] = React.useState(0)
  const [read, setRead] = React.useState(0)
  const [mode, setMode] = React.useState("read" as "read" | "reply" | "sending")
  const [text, setText] = React.useState("")
  const [err, setErr] = React.useState(false)
  const input = React.useRef(null as HTMLInputElement | null)
  const left = messages.length - read
  const msg = messages[mi % Math.max(1, messages.length)]

  React.useEffect(() => {
    replyRef.current = () => {
      if (!left) return
      setMode("reply")
      setTimeout(() => input.current && input.current.focus(), 40)
    }
  })

  const send = async () => {
    if (!text.trim() || !msg) return
    setMode("sending")
    setErr(false)
    let ok = true
    try {
      if (onReply) {
        const res = await onReply(msg, text.trim())
        if (res === false) ok = false
      } else await new Promise((r) => setTimeout(r, 650))
    } catch {
      ok = false
    }
    if (!ok) {
      setErr(true)
      setMode("reply")
      return
    }
    toast(fill(L.sent, { name: msg.from }))
    setText("")
    setMode("read")
    setRead((r) => r + 1)
    setMi((i) => i + 1)
  }

  if (!messages.length || !left) {
    return (
      <div className="mjt-tile mjt-msgs">
        <div className="mjt-tile-head">
          <span>{L.newMessages}</span>
          <span className="mjt-ibtn" aria-hidden="true">
            <Icon d={I.check} />
          </span>
        </div>
        <p className="mjt-quote">{L.caughtUp}</p>
        <div className="mjt-tile-foot">
          <span />
          {messages.length > 0 && (
            <button
              type="button"
              className="mjt-link"
              onClick={() => {
                setRead(0)
                setMi(0)
              }}
            >
              {L.readAgain}
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="mjt-tile mjt-msgs">
      <div className="mjt-tile-head">
        <span>{L.newMessages}</span>
        <button type="button" className="mjt-ibtn" aria-label={L.nextMessage + " (" + left + ")"} onClick={() => mode === "read" && setMi((i) => i + 1)}>
          <Icon d={I.chat} />
          <span className="mjt-badge" aria-hidden="true">
            {left}
          </span>
        </button>
      </div>
      {mode === "read" ? (
        <div key={mi} className="mjt-swap">
          <p className="mjt-quote-from">
            {msg.avatar && <img className="mjt-face" src={sized(msg.avatar, 64, 64)} alt="" style={{ maxWidth: "none" }} />}
            {msg.from}
          </p>
          <p className="mjt-quote">{"“" + msg.text + "”"}</p>
        </div>
      ) : (
        <form
          className="mjt-replyform mjt-swap"
          onSubmit={(e) => {
            e.preventDefault()
            void send()
          }}
        >
          <label className="mjt-sr" htmlFor={"mjt-reply-" + mi}>
            {fill(L.replyTo, { name: msg.from })}
          </label>
          <input
            id={"mjt-reply-" + mi}
            ref={input}
            value={text}
            maxLength={280}
            placeholder={fill(L.replyTo, { name: msg.from })}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setMode("read")
            }}
            disabled={mode === "sending"}
          />
          <button type="submit" aria-label={L.send} disabled={!text.trim() || mode === "sending"}>
            <Icon d={I.send} />
          </button>
        </form>
      )}
      <div className="mjt-tile-foot" aria-live="polite">
        {mode === "read" ? (
          <>
            <span>
              {msg.time} {L.hours}
            </span>
            <button
              type="button"
              className="mjt-link"
              onClick={() => {
                setMode("reply")
                setTimeout(() => input.current && input.current.focus(), 40)
              }}
            >
              {L.reply}
            </button>
          </>
        ) : (
          <>
            <span className="mjt-note">{err ? L.failed : mode === "sending" ? L.sending + "..." : msg.from}</span>
            <button type="button" className="mjt-link" onClick={() => setMode("read")} disabled={mode === "sending"}>
              {L.cancel}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

/* ---------- lightbox ---------- */

function Lightbox({ items, index, setIndex, onClose, liked, toggleLike, L }: { items: MjtPhoto[]; index: number; setIndex: (i: number) => void; onClose: () => void; liked: { [k: string]: boolean }; toggleLike: (p: MjtPhoto) => void; L: typeof DEFAULT_LABELS }) {
  const ref = React.useRef(null as HTMLDivElement | null)
  const p = items[index]
  React.useEffect(() => {
    const prev = document.activeElement as HTMLElement | null
    const el = ref.current
    const first = el && (el.querySelector(".mjt-lb-close") as HTMLElement | null)
    if (first) first.focus()
    return () => {
      if (prev && prev.focus) prev.focus()
    }
  }, [])
  if (!p) return null
  const n = items.length
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") onClose()
    else if (e.key === "ArrowRight" && n > 1) setIndex((index + 1) % n)
    else if (e.key === "ArrowLeft" && n > 1) setIndex((index - 1 + n) % n)
    else if (e.key === "Tab" && ref.current) {
      const f = Array.from(ref.current.querySelectorAll("button")) as HTMLElement[]
      if (!f.length) return
      const a = f[0]
      const z = f[f.length - 1]
      if (e.shiftKey && document.activeElement === a) {
        e.preventDefault()
        z.focus()
      } else if (!e.shiftKey && document.activeElement === z) {
        e.preventDefault()
        a.focus()
      }
    }
  }
  const count = (p.likes || 0) + (liked[p.id] ? 1 : 0)
  return (
    <div className="mjt-lb" role="dialog" aria-modal="true" aria-label={p.caption} ref={ref} onKeyDown={onKey} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="mjt-lb-card">
        <div className="mjt-lb-img">
          <Photo key={p.id} shot={p} label={p.alt || p.caption} sizes="(max-width: 1100px) 100vw, 1100px" max={1600} eager fresh />
        </div>
        <button type="button" className="mjt-rbtn mjt-lb-close" aria-label={L.close} onClick={onClose}>
          <Icon d={I.x} />
        </button>
        <div className="mjt-lb-bar">
          <div>
            <h3>{p.caption}</h3>
            <p>
              {[p.category, p.camera].filter(Boolean).join(" · ")}
              {" · "}
              {grouped(count)} {"♥"}
            </p>
            {p.tags && p.tags.length > 0 && (
              <div className="mjt-lb-tags">
                {p.tags.map((t) => (
                  <span key={t} className="mjt-tagchip">
                    #{t}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="mjt-lb-acts">
            <HeartButton on={!!liked[p.id]} label={L.like + ": " + p.caption} onToggle={() => toggleLike(p)} />
            {n > 1 && (
              <>
                <button type="button" className="mjt-rbtn" aria-label={L.previous} onClick={() => setIndex((index - 1 + n) % n)}>
                  <Icon d={I.left} />
                </button>
                <span className="mjt-lb-n" aria-live="polite">
                  {index + 1} / {n}
                </span>
                <button type="button" className="mjt-rbtn" aria-label={L.next} onClick={() => setIndex((index + 1) % n)}>
                  <Icon d={I.right} />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ---------- the scrubber ---------- */

function Scrub({ rootRef, label, reduced }: { rootRef: { current: HTMLDivElement | null }; label: string; reduced: boolean }) {
  const track = React.useRef(null as HTMLDivElement | null)
  const drag = React.useRef(null as { x: number; moved: boolean } | null)
  const metrics = () => {
    const root = rootRef.current
    if (!root) return null
    const host = scrollHost(root)
    const view = host ? host.clientHeight : innerHeight
    const top0 = host ? host.getBoundingClientRect().top : 0
    const r = root.getBoundingClientRect()
    return { root, view, height: r.height, scrolled: top0 - r.top }
  }
  const onDown = (e: React.PointerEvent) => {
    const m = metrics()
    const t = track.current
    if (!m || !t) return
    const tr = t.getBoundingClientRect()
    const st = scrubState(m.scrolled, m.height, m.view)
    const thumbL = tr.left + st.p * tr.width * (1 - st.s)
    const thumbR = thumbL + tr.width * st.s
    if (e.clientX < thumbL || e.clientX > thumbR) {
      // jump so the thumb centres on the pointer
      const want = (e.clientX - tr.left - (tr.width * st.s) / 2) / (tr.width * (1 - st.s))
      const target = Math.min(1, Math.max(0, want)) * (m.height - m.view)
      scrollByPx(m.root, target - m.scrolled, !reduced)
    }
    drag.current = { x: e.clientX, moved: false }
    t.setPointerCapture(e.pointerId)
    t.setAttribute("data-drag", "")
  }
  const onMove = (e: React.PointerEvent) => {
    const d = drag.current
    const m = metrics()
    const t = track.current
    if (!d || !m || !t) return
    const dx = e.clientX - d.x
    if (!dx) return
    d.x = e.clientX
    const st = scrubState(m.scrolled, m.height, m.view)
    scrollByPx(m.root, scrubDelta(dx, t.getBoundingClientRect().width, st.s, m.height, m.view), false)
  }
  const onUp = () => {
    drag.current = null
    if (track.current) track.current.removeAttribute("data-drag")
  }
  const onKey = (e: React.KeyboardEvent) => {
    const m = metrics()
    if (!m) return
    const step = { ArrowRight: 0.25, ArrowDown: 0.25, ArrowLeft: -0.25, ArrowUp: -0.25, PageDown: 0.9, PageUp: -0.9 } as { [k: string]: number }
    if (step[e.key] !== undefined) scrollByPx(m.root, step[e.key] * m.view, !reduced)
    else if (e.key === "Home") scrollByPx(m.root, -m.scrolled, !reduced)
    else if (e.key === "End") scrollByPx(m.root, m.height - m.view - m.scrolled, !reduced)
    else return
    e.preventDefault()
  }
  return (
    <div
      ref={track}
      className="mjt-scrub"
      role="scrollbar"
      aria-orientation="horizontal"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={0}
      tabIndex={0}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      onKeyDown={onKey}
    >
      <span className="mjt-scrub-thumb" />
    </div>
  )
}

/* ---------- the stickers ---------- */

type StarPos = { x: number; y: number; r: number; s: number }

function Stars({ uid, boardRef, initial }: { uid: string; boardRef: { current: HTMLElement | null }; initial: StarPos[] }) {
  const [pos, setPos] = React.useState(initial)
  const [spin, setSpin] = React.useState(-1)
  const drag = React.useRef(null as { i: number; dx: number; dy: number; moved: boolean } | null)
  return (
    <>
      {pos.map((p, i) => (
        <span
          key={i}
          className="mjt-star"
          aria-hidden="true"
          data-spin={spin === i ? "" : undefined}
          style={{ left: p.x + "%", top: p.y + "%", ["--r" as string]: p.r + "deg", ["--dl" as string]: -i * 1.3 + "s", scale: String(p.s) } as React.CSSProperties}
          onPointerDown={(e) => {
            const b = boardRef.current
            if (!b) return
            const r = b.getBoundingClientRect()
            drag.current = { i, dx: e.clientX - (r.left + (p.x / 100) * r.width), dy: e.clientY - (r.top + (p.y / 100) * r.height), moved: false }
            ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
            ;(e.currentTarget as HTMLElement).setAttribute("data-drag", "")
          }}
          onPointerMove={(e) => {
            const d = drag.current
            const b = boardRef.current
            if (!d || d.i !== i || !b) return
            const r = b.getBoundingClientRect()
            const x = Math.min(103, Math.max(-3, ((e.clientX - d.dx - r.left) / r.width) * 100))
            const y = Math.min(103, Math.max(-3, ((e.clientY - d.dy - r.top) / r.height) * 100))
            d.moved = true
            setPos((all) => all.map((q, k) => (k === i ? { ...q, x, y } : q)))
          }}
          onPointerUp={(e) => {
            const d = drag.current
            drag.current = null
            ;(e.currentTarget as HTMLElement).removeAttribute("data-drag")
            if (d && !d.moved) {
              setSpin(i)
              setTimeout(() => setSpin(-1), 900)
            }
          }}
        >
          <StarArt uid={uid} />
        </span>
      ))}
    </>
  )
}

function CountUp({ value, run, reduced }: { value: number; run: boolean; reduced: boolean }) {
  const [v, setV] = React.useState(reduced ? value : 0)
  React.useEffect(() => {
    if (!run) return
    if (reduced) return setV(value)
    let raf = 0
    const t0 = performance.now()
    const tick = (t: number) => {
      const k = Math.min(1, (t - t0) / 1400)
      setV(value * (1 - Math.pow(1 - k, 3)))
      if (k < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [run, value, reduced])
  return <>{v >= 1000 ? compact(v) : Math.round(v)}</>
}

function useClock(locale: string, hour12: boolean, timeZone?: string) {
  const [now, setNow] = React.useState(null as Date | null)
  React.useEffect(() => {
    let id = 0
    const tick = () => {
      const d = new Date()
      setNow(d)
      id = window.setTimeout(tick, 60000 - (d.getSeconds() * 1000 + d.getMilliseconds()) + 30)
    }
    tick()
    return () => window.clearTimeout(id)
  }, [])
  return now ? clockParts(now, locale, hour12, timeZone) : null
}

/* ---------- the page ---------- */

const SECTIONS = ["home", "profile", "photos", "archive"]
const STARS = [
  { x: 2.5, y: 2.5, r: -14, s: 1 },
  { x: 97.5, y: 3, r: 12, s: 1.08 },
  { x: 2, y: 86, r: 8, s: 0.9 },
  { x: 97, y: 74, r: -10, s: 1 },
] as StarPos[]

export default function MeadowJournalTemplate({
  name = "Nia",
  greeting = "Hello,",
  credit = { label: "Diary of", name: "Nia Olsen" },
  locale = "en-US",
  hour12 = true,
  timeZone,
  entries = DEFAULT_ENTRIES,
  songs = DEFAULT_SONGS,
  messages = DEFAULT_MESSAGES,
  photos = DEFAULT_PHOTOS,
  archive = DEFAULT_ARCHIVE,
  profile,
  notes = DEFAULT_NOTES,
  guestbook = true,
  footer,
  labels,
  palette = "periwinkle",
  theme = "system",
  stickers = true,
  fontHref = DEFAULT_FONT,
  interval = 8,
  onLike,
  onReply,
  onFollow,
  onNote,
  onStatus,
  height = "100svh",
  className,
}: MeadowJournalTemplateProps) {
  const rootRef = React.useRef(null as HTMLDivElement | null)
  const boardRef = React.useRef(null as HTMLDivElement | null)
  const heroRef = React.useRef(null as HTMLElement | null)
  const profRef = React.useRef(null as HTMLDivElement | null)
  const reduced = useReducedMotion()
  const [dark, setDark] = useTheme(theme)
  const pal = resolvePalette(palette)
  const uid = "mjt" + React.useId().replace(/[^a-zA-Z0-9]/g, "")
  const L = { ...DEFAULT_LABELS, ...(labels || {}) }
  const P = profile === null ? null : { ...DEFAULT_PROFILE, ...(profile || {}) }
  const F = footer === null ? null : { ...DEFAULT_FOOTER, ...(footer || {}) }
  useReveal(rootRef, reduced)

  /* entries on the board; the archive can pin more to the top */
  const [list, setList] = React.useState(entries.length ? entries : DEFAULT_ENTRIES)
  const [ei, setEi] = React.useState(0)
  const [hold, setHold] = React.useState(false)
  const entry = list[Math.min(ei, list.length - 1)]
  const heroSeen = useOnScreen(heroRef)
  const allEntries = React.useMemo(() => mergeEntries(list, archive || []), [list, archive])
  const go = (i: number) => setEi((i + list.length) % list.length)

  /* the backdrop photo crossfades between entries */
  const skyShot = entry.image
  const skyKey = skyShot.src
  const [sky, setSky] = React.useState([{ key: skyKey, shot: skyShot, fresh: false }])
  React.useEffect(() => {
    setSky((s) => {
      if (s[s.length - 1].key === skyKey) return s
      return [s[s.length - 1], { key: skyKey, shot: skyShot, fresh: true }]
    })
    const id = setTimeout(() => setSky((s) => (s.length > 1 ? [s[s.length - 1]] : s)), 1400)
    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skyKey])

  /* status, menu, toast */
  const statuses = L.statuses.length ? L.statuses : DEFAULT_LABELS.statuses
  const [status, setStatus] = React.useState(0)
  const [menu, setMenu] = React.useState(false)
  const menuRef = React.useRef(null as HTMLDivElement | null)
  const moreRef = React.useRef(null as HTMLButtonElement | null)
  const [toastMsg, setToastMsg] = React.useState({ text: "", n: 0 })
  const toast = (text: string) => setToastMsg((t) => ({ text, n: t.n + 1 }))
  React.useEffect(() => {
    if (!toastMsg.text) return
    const id = setTimeout(() => setToastMsg((t) => ({ ...t, text: "" })), 2400)
    return () => clearTimeout(id)
  }, [toastMsg.n, toastMsg.text])
  React.useEffect(() => {
    if (!menu) return
    const first = menuRef.current && (menuRef.current.querySelector("button") as HTMLElement | null)
    if (first) first.focus()
    const away = (e: PointerEvent) => {
      const t = e.target as Node
      if (menuRef.current && !menuRef.current.contains(t) && moreRef.current && !moreRef.current.contains(t)) setMenu(false)
    }
    document.addEventListener("pointerdown", away)
    return () => document.removeEventListener("pointerdown", away)
  }, [menu])

  /* likes */
  const [liked, setLiked] = React.useState({} as { [k: string]: boolean })
  const like = (kind: "entry" | "photo", id: string) => {
    const on = !liked[id]
    setLiked((l) => ({ ...l, [id]: on }))
    if (onLike) onLike({ kind, id, liked: on })
  }
  const [following, setFollowing] = React.useState(false)
  const follow = () => {
    const on = !following
    setFollowing(on)
    if (onFollow) onFollow(on)
  }
  const [hidden, setHidden] = React.useState({} as { [k: string]: boolean })

  /* scroll: the scrubber, the dock, the nav pill and the wash on the sky */
  const [docked, setDocked] = React.useState(false)
  const [active, setActive] = React.useState("home")
  React.useEffect(() => {
    const root = rootRef.current
    if (!root) return
    let raf = 0
    const run = () => {
      raf = 0
      const host = scrollHost(root)
      const view = host ? host.clientHeight : innerHeight
      const top0 = host ? host.getBoundingClientRect().top : 0
      const r = root.getBoundingClientRect()
      const st = scrubState(top0 - r.top, r.height, view)
      root.style.setProperty("--mjt-p", st.p.toFixed(4))
      root.style.setProperty("--mjt-s", st.s.toFixed(4))
      root.style.setProperty("--mjt-d", Math.min(1, Math.max(0, (top0 - r.top) / view)).toFixed(3))
      for (const el of Array.from(root.querySelectorAll(".mjt-scrub"))) el.setAttribute("aria-valuenow", String(Math.round(st.p * 100)))
      const b = boardRef.current
      setDocked(!!b && b.getBoundingClientRect().bottom - top0 < 24)
      let act = "home"
      for (const k of SECTIONS) {
        const el = root.querySelector('[data-sec="' + k + '"]')
        if (el && k !== "home" && el.getBoundingClientRect().top - top0 <= view * 0.4) act = k
      }
      setActive(act)
    }
    const on = () => {
      if (!raf) raf = requestAnimationFrame(run)
    }
    run()
    document.addEventListener("scroll", on, { capture: true, passive: true })
    addEventListener("resize", on)
    const ro = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(on)
    if (ro) ro.observe(root)
    return () => {
      if (raf) cancelAnimationFrame(raf)
      document.removeEventListener("scroll", on, { capture: true })
      removeEventListener("resize", on)
      if (ro) ro.disconnect()
    }
  }, [])

  const goTo = (k: string) => {
    const root = rootRef.current
    if (!root) return
    const el = k === "home" ? root : (root.querySelector('[data-sec="' + k + '"]') as HTMLElement | null)
    if (el) el.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" })
  }

  /* the nav pill slides under the active tab */
  const tabsRef = React.useRef(null as HTMLDivElement | null)
  const dockTabsRef = React.useRef(null as HTMLDivElement | null)
  const [pill, setPill] = React.useState({ big: [0, 0], small: [0, 0] })
  const tabIndex = Math.max(0, SECTIONS.indexOf(active))
  const measure = React.useCallback(() => {
    const read = (el: HTMLDivElement | null) => {
      const t = el && (el.querySelectorAll(".mjt-tab")[tabIndex] as HTMLElement | undefined)
      return t ? [t.offsetLeft, t.offsetWidth] : [0, 0]
    }
    setPill({ big: read(tabsRef.current), small: read(dockTabsRef.current) })
  }, [tabIndex])
  React.useLayoutEffect(() => {
    measure()
    if (typeof ResizeObserver === "undefined" || !tabsRef.current) return
    const ro = new ResizeObserver(measure)
    ro.observe(tabsRef.current)
    return () => ro.disconnect()
  }, [measure, docked])

  /* lightbox */
  const [lb, setLb] = React.useState(null as { items: MjtPhoto[]; i: number } | null)
  const heroPhotos = (entry.shots && entry.shots.length ? entry.shots.concat(entry.shots) : [entry.image, entry.image]).slice(0, 2).map(
    (s, k) =>
      ({
        ...s,
        id: entry.id + ":" + k,
        caption: entry.place,
        category: fmtDate(entry.date, locale, true),
        tags: entry.tag ? [entry.tag] : [],
        camera: entry.camera,
        likes: Math.round(entry.likes / (k ? 9 : 6)),
      }) as MjtPhoto
  )

  /* photo wall */
  const wall = photos || []
  const cats = categories(wall)
  const [cat, setCat] = React.useState("")
  const shown = cat ? wall.filter((p) => p.category === cat) : wall

  /* archive */
  const [month, setMonth] = React.useState("")
  const [query, setQuery] = React.useState("")
  const [open, setOpen] = React.useState({} as { [k: string]: boolean })
  const found = filterEntries(allEntries, month, query)
  const [more, setMore] = React.useState(false)
  const page = more || month || query ? found : found.slice(0, 5)
  const pin = (e: MjtEntry) => {
    const i = list.findIndex((x) => x.id === e.id)
    if (i >= 0) setEi(i)
    else {
      setList((l) => [e].concat(l))
      setEi(0)
    }
    goTo("home")
  }

  /* guestbook */
  const [board, setBoard] = React.useState(notes)
  const [gName, setGName] = React.useState("")
  const [gText, setGText] = React.useState("")
  const [gBusy, setGBusy] = React.useState(false)
  const [gErr, setGErr] = React.useState(false)
  const pinNote = async () => {
    const n = { name: gName.trim(), text: gText.trim() }
    if (!n.name || !n.text) return
    setGBusy(true)
    setGErr(false)
    let ok = true
    try {
      if (onNote) {
        const res = await onNote(n)
        if (res === false) ok = false
      } else await new Promise((r) => setTimeout(r, 500))
    } catch {
      ok = false
    }
    setGBusy(false)
    if (!ok) return setGErr(true)
    setBoard((b) => [n].concat(b))
    setGText("")
    toast(L.noteThanks)
  }

  const replyRef = React.useRef(null as (() => void) | null)
  const profSeen = useOnScreen(profRef).seen
  const clock = useClock(locale, hour12, timeZone)
  const clockText = clock ? clock.hour + ":" + clock.minute + (clock.period ? " " + clock.period : "") : ""

  const entryLiked = !!liked[entry.id]
  const run = interval > 0 && list.length > 1 && !reduced
  const swipe = React.useRef(0)

  const rootStyle = {
    "--mjt-h": height,
    "--mjt-panel": pal.panel,
    "--mjt-deep": pal.deep,
    "--mjt-olive": pal.olive,
    "--mjt-ink": pal.ink,
    "--mjt-int": interval + "s",
  } as React.CSSProperties

  const tabs = (small: boolean) => (
    <div className={"mjt-tabs" + (small ? " mjt-tabs-sm" : "")} ref={small ? dockTabsRef : tabsRef}>
      <span className="mjt-tabs-pill" aria-hidden="true" style={{ left: (small ? pill.small : pill.big)[0], width: (small ? pill.small : pill.big)[1] }} />
      {SECTIONS.map((k, i) => (
        <button key={k} type="button" className="mjt-tab" aria-current={active === k ? "true" : undefined} tabIndex={small && !docked ? -1 : undefined} onClick={() => goTo(k)}>
          {L.tabs[i] || DEFAULT_LABELS.tabs[i]}
        </button>
      ))}
    </div>
  )

  return (
    <div ref={rootRef} className={"mjt-root" + (className ? " " + className : "")} data-theme={dark ? "dark" : "light"} style={rootStyle}>
      {fontHref && <link rel="stylesheet" href={fontHref} />}
      <style>{MJT_CSS}</style>
      <svg className="mjt-defs" aria-hidden="true" focusable="false">
        <defs>
          <radialGradient id={uid + "-gold"} cx="38%" cy="30%" r="75%">
            <stop offset="0" stopColor="#fff1b0" />
            <stop offset=".35" stopColor="#f1c75a" />
            <stop offset=".75" stopColor="#c8912c" />
            <stop offset="1" stopColor="#8f611a" />
          </radialGradient>
          <linearGradient id={uid + "-rim"} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#fff7d6" stopOpacity=".9" />
            <stop offset="1" stopColor="#7a5214" stopOpacity=".5" />
          </linearGradient>
        </defs>
      </svg>

      <div className="mjt-sky" aria-hidden="true">
        {sky.map((s) => (
          <div key={s.key} className="mjt-sky-layer" data-new={s.fresh ? "" : undefined}>
            <Photo shot={s.shot} label="" sizes="100vw" eager />
          </div>
        ))}
        <div className="mjt-sky-wash" />
      </div>

      <div className="mjt-dockwrap">
        <nav className="mjt-dock" data-on={docked ? "" : undefined} aria-label={name} aria-hidden={docked ? undefined : true}>
          <span className="mjt-dock-me">
            <span className="mjt-dock-av">
              {P && P.avatar && <Photo shot={P.avatar} label="" square={80} />}
            </span>
            {name}
          </span>
          {tabs(true)}
          {clock && (
            <span className="mjt-dock-time" aria-hidden="true">
              {clockText}
            </span>
          )}
          <span className="mjt-dock-bar" aria-hidden="true" />
        </nav>
      </div>

      <section ref={heroRef} className="mjt-hero" data-sec="home" aria-label={greeting + " " + name}>
        <div ref={boardRef} className="mjt-board">
          <div
            className="mjt-panel"
            onPointerEnter={() => setHold(true)}
            onPointerLeave={() => setHold(false)}
            onFocus={() => setHold(true)}
            onBlur={() => setHold(false)}
            onPointerDown={(e) => {
              swipe.current = e.clientX
            }}
            onPointerUp={(e) => {
              const dx = e.clientX - swipe.current
              if (Math.abs(dx) > 60 && e.pointerType !== "mouse") go(ei + (dx < 0 ? 1 : -1))
            }}
          >
            {credit && (
              <p className="mjt-credit">
                {credit.label}
                <b>{credit.name}</b>
              </p>
            )}
            <div className="mjt-hello">
              <h1 className="mjt-h1">
                {greeting} <b>{name}!</b>
              </h1>
              <time className="mjt-clock" aria-live="off" aria-label={clockText}>
                {clock ? (
                  <>
                    <span aria-hidden="true">
                      {clock.hour}
                      <i>:</i>
                      {clock.minute}
                    </span>
                    {clock.period && <small aria-hidden="true">{clock.period}</small>}
                  </>
                ) : (
                  <span aria-hidden="true">&nbsp;</span>
                )}
              </time>
            </div>
            <div className="mjt-navrow">
              <nav aria-label={greeting + " " + name}>{tabs(false)}</nav>
              <div className="mjt-status">
                <button
                  type="button"
                  className="mjt-status-on"
                  aria-label={statuses[status]}
                  onClick={() => {
                    const n = (status + 1) % statuses.length
                    setStatus(n)
                    if (onStatus) onStatus(statuses[n])
                  }}
                >
                  <span className="mjt-status-dot" data-s={String(status % 3)} />
                  <span key={status} className="mjt-swap">
                    {statuses[status]}
                  </span>
                </button>
                <button ref={moreRef} type="button" className="mjt-status-more" aria-haspopup="menu" aria-expanded={menu} onClick={() => setMenu((m) => !m)}>
                  {L.more}
                </button>
                {menu && (
                  <div
                    ref={menuRef}
                    className="mjt-menu"
                    role="menu"
                    onKeyDown={(e) => {
                      const items = Array.from((e.currentTarget as HTMLElement).querySelectorAll("button")) as HTMLElement[]
                      const i = items.indexOf(document.activeElement as HTMLElement)
                      if (e.key === "Escape" || e.key === "Tab") {
                        setMenu(false)
                        if (e.key === "Escape" && moreRef.current) moreRef.current.focus()
                        return
                      }
                      const n = nextIndex(i, e.key, items.length)
                      if (n < 0) return
                      e.preventDefault()
                      items[n].focus()
                    }}
                  >
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        follow()
                        setMenu(false)
                      }}
                    >
                      <Icon d={following ? I.check : I.plus} />
                      {following ? L.following : L.follow}
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        const done = () => toast(L.copied)
                        try {
                          if (navigator.clipboard) navigator.clipboard.writeText(location.href).then(done, done)
                          else done()
                        } catch {
                          done()
                        }
                        setMenu(false)
                      }}
                    >
                      <Icon d={I.link} />
                      {L.copyLink}
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setDark(!dark)
                        setMenu(false)
                      }}
                    >
                      <Icon d={dark ? I.sun : I.moon} />
                      {dark ? L.dayMode : L.nightMode}
                    </button>
                    {guestbook && (
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setMenu(false)
                          goTo("guestbook")
                        }}
                      >
                        <Icon d={I.pen} />
                        {L.toGuestbook}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div key={entry.id} className={reduced ? undefined : "mjt-swap"} aria-live="polite">
              <p className="mjt-meta">
                <span>{fmtDate(entry.date, locale)}</span>
                <i />
                <span>{entry.place}</span>
              </p>
              <p className="mjt-post" style={{ marginTop: 10 }}>
                <Rich text={entry.text} />
              </p>
            </div>
            <div className="mjt-foot">
              <button type="button" className="mjt-likes" aria-pressed={entryLiked} onClick={() => like("entry", entry.id)}>
                <Icon d={I.heart} fill={entryLiked} />
                <span>
                  <Rich text={fill(entryLiked ? L.youLiked : L.likedBy, { count: compact(entry.likes) })} />
                </span>
              </button>
              {list.length > 1 && (
                <div className="mjt-dots" role="group" aria-label={plain(L.archiveTitle)}>
                  {list.map((e, i) => (
                    <button
                      key={e.id}
                      type="button"
                      className="mjt-dot"
                      aria-label={fill(L.entry, { n: i + 1 }) + ": " + e.place}
                      aria-current={i === ei ? "true" : undefined}
                      onClick={() => go(i)}
                      onKeyDown={(ev) => {
                        const n = nextIndex(i, ev.key, list.length)
                        if (n < 0) return
                        ev.preventDefault()
                        go(n)
                        const sib = (ev.currentTarget.parentElement as HTMLElement).children[n] as HTMLElement | undefined
                        if (sib) sib.focus()
                      }}
                    >
                      {i === ei && (
                        <span
                          key={ei}
                          className="mjt-dot-fill"
                          data-run={run ? "" : undefined}
                          data-paused={hold || menu || lb || !heroSeen.now ? "" : undefined}
                          onAnimationEnd={() => run && !prefersReduced() && go(ei + 1)}
                        />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="mjt-cards">
            <figure className="mjt-photo">
              <Photo key={heroPhotos[0].src} shot={heroPhotos[0]} label={heroPhotos[0].alt || entry.place} sizes="(max-width: 640px) 50vw, 360px" max={1200} eager fresh />
              <button type="button" className="mjt-photo-open" aria-label={heroPhotos[0].alt || entry.place} onClick={() => setLb({ items: heroPhotos, i: 0 })} />
              <svg key={"d" + entry.id} className="mjt-doodle" data-draw={reduced ? undefined : ""} viewBox="0 0 160 110" aria-hidden="true">
                <path pathLength={1} d="M14 58c-6-14 4-30 18-24 6 3 8 10 6 15 4-9 15-14 22-7 9 9-4 24-24 34-10-6-18-11-22-18Z" />
                <path pathLength={1} d="M70 64c10-22 22-40 26-36 4 5-12 34-10 40 3 6 14-26 22-24 6 2-2 22 4 24 6 1 14-14 20-12 5 2 0 12 6 13 5 1 10-5 14-9" />
              </svg>
              {entry.tag && !hidden[entry.id] && (
                <span className="mjt-chip" key={"c" + entry.id}>
                  <span>#</span>
                  {entry.tag}
                  <button type="button" aria-label={L.removeTag + ": " + entry.tag} onClick={() => setHidden((h) => ({ ...h, [entry.id]: true }))}>
                    <Icon d={I.x} />
                  </button>
                </span>
              )}
              {entry.camera && (
                <figcaption className="mjt-taken">
                  <Rich text={fill(L.takenBy, { camera: entry.camera })} />
                </figcaption>
              )}
            </figure>

            <div className="mjt-mid">
              <MusicCard songs={songs.length ? songs : DEFAULT_SONGS} L={L} />
              <MessagesCard messages={messages} L={L} onReply={onReply} toast={toast} replyRef={replyRef} />
            </div>

            <figure className="mjt-photo">
              <Photo key={heroPhotos[1].src} shot={heroPhotos[1]} label={heroPhotos[1].alt || entry.place} sizes="(max-width: 640px) 50vw, 360px" max={1200} eager fresh />
              <button type="button" className="mjt-photo-open" aria-label={heroPhotos[1].alt || entry.place} onClick={() => setLb({ items: heroPhotos, i: 1 })} />
              <button type="button" className="mjt-arch mjt-link" onClick={() => goTo("archive")}>
                <Rich text={L.fromArchive} />
              </button>
              <HeartButton on={!!liked[heroPhotos[1].id]} count={(heroPhotos[1].likes || 0) + (liked[heroPhotos[1].id] ? 1 : 0)} label={L.like + ": " + entry.place} onToggle={() => like("photo", heroPhotos[1].id)} />
            </figure>
          </div>

          <Scrub rootRef={rootRef} label={L.scrub} reduced={reduced} />
          {stickers && <Stars uid={uid} boardRef={boardRef} initial={STARS} />}
        </div>
      </section>

      {P && (
        <section className="mjt-sec" data-sec="profile" aria-labelledby={uid + "-prof"}>
          <div className="mjt-frame mjt-rv" ref={profRef}>
            <div className="mjt-head">
              <h2 className="mjt-h2" id={uid + "-prof"}>
                <Rich text={L.profileTitle} />
              </h2>
              {P.location && <p className="mjt-sub">{P.location}</p>}
            </div>
            <div className="mjt-profile">
              <div className="mjt-pcard">
                <div className="mjt-who">
                  <span className="mjt-av">
                    {P.avatar && <Photo shot={P.avatar} label="" square={240} />}
                  </span>
                  <div>
                    <h3>{P.fullName}</h3>
                    <p>{P.handle}</p>
                  </div>
                </div>
                {P.role && <p className="mjt-role">{P.role}</p>}
                {P.bio && (
                  <p className="mjt-bio">
                    <Rich text={P.bio} />
                  </p>
                )}
                <div className="mjt-pills">
                  <button type="button" className="mjt-pill mjt-pill-dark" aria-pressed={following} onClick={follow}>
                    <Icon d={following ? I.check : I.plus} />
                    {following ? L.following : L.follow}
                  </button>
                  {messages.length > 0 && (
                    <button
                      type="button"
                      className="mjt-pill"
                      onClick={() => {
                        goTo("home")
                        if (replyRef.current) replyRef.current()
                      }}
                    >
                      <Icon d={I.chat} />
                      {L.message}
                    </button>
                  )}
                  {(P.links || []).map((l) => (
                    <a key={l.label} className="mjt-pill mjt-pill-ghost" href={l.href || "#"}>
                      {l.label}
                    </a>
                  ))}
                </div>
              </div>
              <div className="mjt-pside">
                {P.stats && P.stats.length > 0 && (
                  <div className="mjt-stats">
                    {P.stats.slice(0, 3).map((s, i) => (
                      <div key={s.label} className="mjt-stat">
                        <b>
                          <CountUp value={s.value + (i === 1 && following ? 1 : 0)} run={profSeen} reduced={reduced} />
                        </b>
                        <span>{s.label}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="mjt-pgrid">
                  {P.currently && P.currently.length > 0 && (
                    <div className="mjt-now">
                      <h4>{L.currently}</h4>
                      <ul>
                        {P.currently.map((c) => (
                          <li key={c.label}>
                            <span>{c.label}</span>
                            {c.value}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="mjt-post-card">
                    <div className="mjt-pc-img">
                      <Photo key={skyKey} shot={skyShot} label={entry.place} sizes="(max-width: 860px) 100vw, 300px" max={1200} fresh />
                    </div>
                    <span className="mjt-stamp" aria-hidden="true">
                      <div>
                        {fmtDate(entry.date, locale).toUpperCase()}
                      </div>
                    </span>
                    <p>
                      <b>{L.postcard}</b>
                      <span>{entry.place}</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {wall.length > 0 && (
        <section className="mjt-sec" data-sec="photos" aria-labelledby={uid + "-ph"}>
          <div className="mjt-frame mjt-rv">
            <div className="mjt-head">
              <div>
                <h2 className="mjt-h2" id={uid + "-ph"}>
                  <Rich text={L.photosTitle} />
                </h2>
                <p className="mjt-sub" style={{ marginTop: 10 }}>
                  {fill(L.photoCount, { count: wall.length })}
                </p>
              </div>
              {cats.length > 1 && (
                <div className="mjt-filters" role="group" aria-label={plain(L.photosTitle)}>
                  {[""].concat(cats).map((c) => (
                    <button key={c || "all"} type="button" className="mjt-fchip" aria-pressed={cat === c} onClick={() => setCat(c)}>
                      {c || L.all}
                      <small>{c ? wall.filter((p) => p.category === c).length : wall.length}</small>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="mjt-wall" key={cat}>
              {shown.map((p, i) => (
                <figure key={p.id} className="mjt-wtile" data-tall={p.tall ? "" : undefined} style={{ animationDelay: i * 50 + "ms" }}>
                  <Photo shot={p} label={p.alt || p.caption} sizes="(max-width: 640px) 100vw, (max-width: 1000px) 50vw, 380px" max={1200} />
                  <button type="button" className="mjt-photo-open" aria-label={p.caption} onClick={() => setLb({ items: shown, i })} />
                  <figcaption className="mjt-wcap">
                    {p.category && <span>{p.category}</span>}
                    {p.caption}
                  </figcaption>
                  <HeartButton on={!!liked[p.id]} label={L.like + ": " + p.caption} onToggle={() => like("photo", p.id)} />
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      {archive !== null && (
        <section className="mjt-sec" data-sec="archive" aria-labelledby={uid + "-ar"}>
          <div className="mjt-frame mjt-rv">
            <div className="mjt-head">
              <h2 className="mjt-h2" id={uid + "-ar"}>
                <Rich text={L.archiveTitle} />
              </h2>
              <p className="mjt-sub">
                {allEntries.length} {"·"} {allEntries.length ? fmtDate(allEntries[allEntries.length - 1].date, locale, true) + " → " + fmtDate(allEntries[0].date, locale, true) : ""}
              </p>
            </div>
            <div className="mjt-archive">
              <div className="mjt-aside">
                <label className="mjt-search">
                  <Icon d={I.search} />
                  <span className="mjt-sr">{L.search}</span>
                  <input type="search" value={query} placeholder={L.search} onChange={(e) => setQuery(e.target.value)} />
                </label>
                <div className="mjt-months" role="group" aria-label={plain(L.archiveTitle)}>
                  <button type="button" aria-pressed={month === ""} onClick={() => setMonth("")}>
                    {L.all}
                    <span>{allEntries.length}</span>
                  </button>
                  {months(allEntries).map((m) => (
                    <button key={m.key} type="button" aria-pressed={month === m.key} onClick={() => setMonth(month === m.key ? "" : m.key)}>
                      {monthLabel(m.key, locale)}
                      <span>{m.count}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="mjt-list" aria-live="polite">
                {found.length === 0 && <p className="mjt-empty">{L.noResults}</p>}
                {page.map((e, i) => {
                  const isTop = list[ei] && list[ei].id === e.id
                  return (
                    <article key={e.id} className="mjt-item" style={{ animationDelay: i * 40 + "ms" }}>
                      <div className="mjt-thumb">
                        <Photo shot={e.image} label="" sizes="(max-width: 640px) 100vw, 120px" max={800} />
                      </div>
                      <div>
                        <div className="mjt-item-top">
                          <b>{e.place}</b>
                          <time dateTime={e.date}>{fmtDate(e.date, locale, true)}</time>
                          {e.tag && <span className="mjt-tagchip">#{e.tag}</span>}
                        </div>
                        <p className="mjt-item-text" data-clamp={open[e.id] ? undefined : ""}>
                          <Rich text={e.text} />
                        </p>
                        <div className="mjt-item-acts">
                          <span className="mjt-l">
                            <Icon d={I.heart} fill />
                            {compact(e.likes + (liked[e.id] ? 1 : 0))}
                          </span>
                          <button type="button" className="mjt-textbtn" aria-expanded={!!open[e.id]} onClick={() => setOpen((o) => ({ ...o, [e.id]: !o[e.id] }))}>
                            {open[e.id] ? L.readLess : L.readMore}
                          </button>
                          <button type="button" className="mjt-textbtn" disabled={isTop} onClick={() => pin(e)}>
                            {isTop ? L.pinned : L.pin}
                          </button>
                        </div>
                      </div>
                    </article>
                  )
                })}
                {page.length < found.length && (
                  <button type="button" className="mjt-fchip mjt-morebtn" onClick={() => setMore(true)}>
                    {fill(L.showAll, { count: found.length })}
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {guestbook && (
        <section className="mjt-sec" data-sec="guestbook" aria-labelledby={uid + "-gb"}>
          <div className="mjt-frame mjt-rv">
            <div className="mjt-head">
              <h2 className="mjt-h2" id={uid + "-gb"}>
                <Rich text={L.guestbookTitle} />
              </h2>
              <p className="mjt-sub">{L.guestbookText}</p>
            </div>
            <div className="mjt-gb">
              <form
                className="mjt-gform"
                onSubmit={(e) => {
                  e.preventDefault()
                  void pinNote()
                }}
              >
                <label>
                  {L.yourName}
                  <input value={gName} maxLength={40} onChange={(e) => setGName(e.target.value)} autoComplete="name" required />
                </label>
                <label>
                  {L.yourNote}
                  <textarea rows={4} value={gText} maxLength={160} onChange={(e) => setGText(e.target.value)} required />
                </label>
                <div className="mjt-gform-row">
                  <span aria-live="polite">{gErr ? L.failed : gText.length + " / 160"}</span>
                  <button type="submit" className="mjt-pill mjt-pill-dark" disabled={gBusy || !gName.trim() || !gText.trim()}>
                    <Icon d={I.pin} />
                    {gBusy ? L.sending + "..." : L.pinNote}
                  </button>
                </div>
              </form>
              <div className="mjt-board2">
                {board.slice(0, 7).map((n, i) => (
                  <figure key={board.length - i} className="mjt-sticky" data-c={String((board.length - i) % 4)} style={{ ["--r" as string]: ((((board.length - i) * 37) % 9) - 4) * 0.8 + "deg" } as React.CSSProperties}>
                    <span className="mjt-pin" aria-hidden="true">
                      <StarArt uid={uid} />
                    </span>
                    <blockquote>{n.text}</blockquote>
                    <figcaption>
                      <b>{n.name}</b>
                    </figcaption>
                  </figure>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {F && (
        <footer className="mjt-footer">
          <div className="mjt-frame mjt-rv">
            <div className="mjt-panel">
              <p className="mjt-fbig">
                <Rich text={F.title} />
              </p>
              <div className="mjt-frow">
                <span>{F.note}</span>
                <button type="button" className="mjt-pill" onClick={() => goTo("home")}>
                  <Icon d={I.up} />
                  {L.backToTop}
                </button>
              </div>
            </div>
            <div className="mjt-frow">
              <nav aria-label={name}>
                {(F.links || []).map((l) => (
                  <a key={l.label} className="mjt-fchip" href={l.href || "#"}>
                    {l.label}
                  </a>
                ))}
              </nav>
              <Scrub rootRef={rootRef} label={L.scrub} reduced={reduced} />
            </div>
          </div>
        </footer>
      )}

      {lb && <Lightbox items={lb.items} index={lb.i} setIndex={(i) => setLb({ items: lb.items, i })} onClose={() => setLb(null)} liked={liked} toggleLike={(p) => like("photo", p.id)} L={L} />}
      {toastMsg.text && (
        <div className="mjt-toast" key={toastMsg.n} role="status">
          {toastMsg.text}
        </div>
      )}
    </div>
  )
}
