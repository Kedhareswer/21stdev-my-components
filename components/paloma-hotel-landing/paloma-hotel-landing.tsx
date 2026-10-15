"use client"

// Paloma Hotel Landing: a complete landing page for a small resort hotel,
// printed like a 1980s resort brochure. A chrome-lettered wordmark sits over a
// screen-printed poster of the hotel: a mid-century block, one long pool,
// palms, striped umbrellas and the mountains behind, all framed in rounded
// hairlines.
//
// The signature is the time of day. Drag the sun along the dial under the
// poster (or press a moment, or use the arrow keys) and the whole place moves
// through its day: the sky, the striped sun and the moon, the shadows of the
// palms, the shading on the mountains, the pool glow and the lit windows. The
// chrome letters reflect the same sky. The hour also drives "The day at the
// hotel" further down, where the programme highlights what is on right now,
// and dark mode is simply the night-swim state of the same page.
//
// It is a working page, not a poster: a booking form with dates, guests, room
// and real availability states; rooms as postcards that turn over to show
// their details; the daily programme; hotel facts on a pool-tile band; a
// guestbook; getting here; a newsletter; a sticky pill nav. Every word, room,
// event, colour and image is a prop, with a "desert" and a "coast" preset.
//
// Everything is drawn here: the poster is SVG, the chrome letters are an
// alphabet of strokes defined below (so the wordmark looks the same on every
// machine), and nothing loads at runtime unless you pass your own images.
import * as React from "react"

export type CplLink = { label: string; href: string }

export type CplView = "pool" | "palms" | "mountain" | "night"

export type CplRoom = {
  id: string
  name: string
  /** The number on the motel key fob, e.g. "12" or "C4". */
  number?: string
  /** Nightly rate, in `currency`. */
  rate: number
  /** "32 m²" */
  size: string
  sleeps: number
  bed: string
  text: string
  features: string[]
  /** Which crop of the poster the postcard shows. */
  view?: CplView
  /** The hour the postcard is printed at (0 to 24). */
  hour?: number
  /** A photo to use instead of the printed art. */
  image?: string
  imageAlt?: string
}

export type CplEvent = {
  /** Start, in hours from midnight: 17.5 is 5:30 pm. */
  hour: number
  /** End, in hours. May wrap past midnight (e.g. 0.5). */
  until: number
  title: string
  place: string
  text: string
}

export type CplMoment = { label: string; hour: number }

export type CplFact = { value: string; label: string }

export type CplQuote = {
  quote: string
  name: string
  /** "Poolside King, March". */
  stay: string
  /** The postmark's date; defaults to the last word of `stay`. */
  date?: string
}

export type CplDrive = { from: string; time: string; dir?: "left" | "right" | "up" | "up-left" | "up-right" }

export type CplVisit = {
  title?: string
  text?: string
  address: string[]
  phone?: string
  email?: string
  /** Defaults to a map search for the address. Pass "" to hide the button. */
  directionsHref?: string
  drives?: CplDrive[]
}

export type CplColors = {
  /** Page ground. */
  paper?: string
  /** Cards and the booking form. */
  card?: string
  /** Text and hairlines. */
  ink?: string
  /** Secondary text; keep it at 4.5:1 on paper. */
  muted?: string
  /** The pool-tile band and solid buttons. */
  pool?: string
  /** Sun and highlights. */
  sun?: string
  /** Umbrella stripes, the awning and small accents. */
  coral?: string
  /** The footer ground. */
  night?: string
}

/** Every colour of one page, filled in. */
export type CplColorSet = { paper: string; card: string; ink: string; muted: string; pool: string; sun: string; coral: string; night: string }

export type CplPresetName = "desert" | "coast"

export type CplBookingQuery = { room: CplRoom; checkIn: string; checkOut: string; nights: number; guests: number }

export interface PalomaHotelLandingProps {
  /** The hotel's full name, used in text. */
  brand?: string
  /** The chrome wordmark. Letters A to Z, digits, space, period, apostrophe and hyphen. */
  wordmark?: string
  /** The small line over the wordmark, like the reference's "presents" line. */
  presents?: string
  /** Two short lines at the top right of the header, e.g. the town. */
  place?: [string, string]
  /** The oval stamp beside the logo, e.g. "Est. 1958". Pass "" to hide it. */
  stamp?: string
  /** The memo strip across the very top. Pass null to hide it. */
  memo?: { text: string; link?: string; href?: string } | null
  /** In-page links. "#rooms", "#day", "#guestbook" and "#visit" scroll within the page. */
  links?: CplLink[]
  hero?: { title?: string; text?: string; cta?: string; secondary?: string }
  /** Starting hour of the poster (0 to 24). Defaults to golden hour, or night swim in dark mode. */
  hour?: number
  /** Called whenever the hour changes. */
  onHourChange?: (hour: number) => void
  /** The quick stops on the dial. */
  moments?: CplMoment[]
  /** "12h" prints 5:30 pm, "24h" prints 17:30. */
  clock?: "12h" | "24h"
  currency?: string
  booking?: { title?: string; text?: string; maxGuests?: number } | null
  /** Called on "Check availability". Return false to block, or numbers to override the shown result. */
  onSearch?: (q: CplBookingQuery) => void | false | { left?: number; total?: number }
  /** Called on "Hold this room". */
  onBook?: (q: CplBookingQuery) => void
  rooms?: { title?: string; text?: string; items?: CplRoom[] } | null
  programme?: { title?: string; text?: string; items?: CplEvent[] } | null
  facts?: CplFact[] | null
  guestbook?: { title?: string; items?: CplQuote[] } | null
  visit?: CplVisit | null
  newsletter?: { title?: string; text?: string; button?: string } | null
  onSubscribe?: (email: string) => void | false
  footer?: { note?: string; links?: CplLink[] }
  preset?: CplPresetName
  /** Override any colour of the light page. */
  colors?: CplColors
  /** Override any colour of the dark page. */
  darkColors?: CplColors
  /** A photo to use instead of the printed hero poster (the dial then tints it). */
  heroImage?: string
  heroImageAlt?: string
  theme?: "system" | "light" | "dark"
  /** A definite height for the hero's first screen. */
  height?: string
  className?: string
}

// #region content
/* The chrome alphabet. Each glyph is a centre line on a 0..100 cap height,
   drawn with a thick stroke: [advance width, path]. Rounded-square letters in
   the spirit of the extended display faces on 1980s resort brochures. */
const GLYPHS: { [k: string]: [number, string] } = {
  A: [84, "M0 100V24A24 24 0 0 1 24 0H60A24 24 0 0 1 84 24V100M0 58H84"],
  B: [82, "M0 0H54A22 22 0 0 1 76 22V26A22 22 0 0 1 54 48H0M0 48H58A24 24 0 0 1 82 72V76A24 24 0 0 1 58 100H0V0"],
  C: [80, "M80 0H24A24 24 0 0 0 0 24V76A24 24 0 0 0 24 100H80"],
  D: [84, "M0 0H60A24 24 0 0 1 84 24V76A24 24 0 0 1 60 100H0Z"],
  E: [74, "M74 0H0V100H74M0 50H62"],
  F: [72, "M72 0H0V100M0 50H60"],
  G: [84, "M84 0H24A24 24 0 0 0 0 24V76A24 24 0 0 0 24 100H60A24 24 0 0 0 84 76V54H46"],
  H: [84, "M0 0V100M84 0V100M0 50H84"],
  I: [0, "M0 0V100"],
  J: [70, "M70 0V76A24 24 0 0 1 46 100H0"],
  K: [80, "M0 0V100M0 50H28L80 0M28 50L80 100"],
  L: [70, "M0 0V100H70"],
  M: [104, "M0 100V24A24 24 0 0 1 24 0H80A24 24 0 0 1 104 24V100M52 0V72"],
  N: [84, "M0 100V0L84 100V0"],
  O: [84, "M0 24A24 24 0 0 1 24 0H60A24 24 0 0 1 84 24V76A24 24 0 0 1 60 100H24A24 24 0 0 1 0 76Z"],
  P: [80, "M0 100V0H56A24 24 0 0 1 80 24V32A24 24 0 0 1 56 56H0"],
  Q: [88, "M0 24A24 24 0 0 1 24 0H60A24 24 0 0 1 84 24V76A24 24 0 0 1 60 100H24A24 24 0 0 1 0 76ZM54 72L88 106"],
  R: [80, "M0 100V0H56A24 24 0 0 1 80 24V32A24 24 0 0 1 56 56H0M42 56L80 100"],
  S: [84, "M84 0H24A24 24 0 0 0 0 24V26A24 24 0 0 0 24 50H60A24 24 0 0 1 84 74V76A24 24 0 0 1 60 100H0"],
  T: [84, "M0 0H84M42 0V100"],
  U: [84, "M0 0V76A24 24 0 0 0 24 100H60A24 24 0 0 0 84 76V0"],
  V: [88, "M0 0L44 100L88 0"],
  W: [104, "M0 0V76A24 24 0 0 0 24 100H80A24 24 0 0 0 104 76V0M52 100V28"],
  X: [84, "M0 0L84 100M84 0L0 100"],
  Y: [84, "M0 0L42 50L84 0M42 50V100"],
  Z: [80, "M0 0H80L0 100H80"],
  "0": [76, "M0 24A24 24 0 0 1 24 0H52A24 24 0 0 1 76 24V76A24 24 0 0 1 52 100H24A24 24 0 0 1 0 76Z"],
  "1": [30, "M0 18L30 0V100"],
  "2": [76, "M0 0H52A24 24 0 0 1 76 24V26A24 24 0 0 1 52 50H24A24 24 0 0 0 0 74V100H76"],
  "3": [76, "M0 0H52A24 24 0 0 1 76 24V26A24 24 0 0 1 52 50H18M52 50A24 24 0 0 1 76 74V76A24 24 0 0 1 52 100H0"],
  "4": [76, "M0 0V58H76M58 28V100"],
  "5": [76, "M76 0H0V48H52A24 24 0 0 1 76 72V76A24 24 0 0 1 52 100H0"],
  "6": [76, "M72 0H24A24 24 0 0 0 0 24V76A24 24 0 0 0 24 100H52A24 24 0 0 0 76 76V72A24 24 0 0 0 52 48H0"],
  "7": [76, "M0 0H76L30 100"],
  "8": [76, "M24 48A24 24 0 0 1 0 24A24 24 0 0 1 24 0H52A24 24 0 0 1 76 24A24 24 0 0 1 52 48ZM24 48H52A24 24 0 0 1 76 74V76A24 24 0 0 1 52 100H24A24 24 0 0 1 0 76V74A24 24 0 0 1 24 48"],
  "9": [76, "M4 100H52A24 24 0 0 0 76 76V24A24 24 0 0 0 52 0H24A24 24 0 0 0 0 24V28A24 24 0 0 0 24 52H76"],
  "-": [40, "M0 54H40"],
  ".": [0, "M0 86V100"],
  "'": [0, "M0 0V30"],
}

export type CplSkyStop = {
  h: number
  skyTop: string
  skyMid: string
  skyLow: string
  sun: string
  cloud: string
  far: string
  near: string
  shade: string
  ground: string
  wall: string
  palm: string
  pool: string
  poolDeep: string
  deck: string
  lights: number
  stars: number
  shadow: number
}

/* One day in the desert, as key frames. Everything in between is mixed. */
const SKY: CplSkyStop[] = [
  { h: 0, skyTop: "#0a0f2e", skyMid: "#18204e", skyLow: "#363266", sun: "#fff2c6", cloud: "#2a2e5c", far: "#28295a", near: "#1c1e42", shade: "#121433", ground: "#383150", wall: "#5d5f8a", palm: "#0b0d22", pool: "#1fd8ea", poolDeep: "#0a6a8c", deck: "#463f66", lights: 1, stars: 1, shadow: 0 },
  { h: 5.4, skyTop: "#1c2258", skyMid: "#5a4e8e", skyLow: "#e29a9c", sun: "#ffd27a", cloud: "#b47f9c", far: "#685d8e", near: "#4a4572", shade: "#322f5a", ground: "#977d8e", wall: "#c8b6c8", palm: "#1e1c3a", pool: "#3aa8c4", poolDeep: "#1c5e86", deck: "#b098a6", lights: 0.7, stars: 0.35, shadow: 0.05 },
  { h: 6.8, skyTop: "#4a7ec2", skyMid: "#f0a08c", skyLow: "#ffd39c", sun: "#ffc85e", cloud: "#ffd6c4", far: "#c899a8", near: "#a07388", shade: "#6b4868", ground: "#e6b28f", wall: "#ffe5d2", palm: "#3a3046", pool: "#3cc2d6", poolDeep: "#1e7ea6", deck: "#efc4aa", lights: 0.12, stars: 0, shadow: 0.35 },
  { h: 9, skyTop: "#3a8dd6", skyMid: "#8cc6ee", skyLow: "#d8eff7", sun: "#fff0b4", cloud: "#ffffff", far: "#b8aec6", near: "#c98f7c", shade: "#8a5a5e", ground: "#ecc69e", wall: "#fff7ee", palm: "#2e6a4e", pool: "#2ec6d4", poolDeep: "#1178a0", deck: "#f2d2b8", lights: 0, stars: 0, shadow: 0.45 },
  { h: 13, skyTop: "#2a82d6", skyMid: "#6ebcf0", skyLow: "#c6ebf7", sun: "#fffbe2", cloud: "#ffffff", far: "#c4b8ca", near: "#d29a80", shade: "#99645a", ground: "#f1cea4", wall: "#ffffff", palm: "#2d6d4b", pool: "#22c2d2", poolDeep: "#0f70a0", deck: "#f5dbc2", lights: 0, stars: 0, shadow: 0.5 },
  { h: 17, skyTop: "#3e7dca", skyMid: "#efb07a", skyLow: "#ffd88e", sun: "#ffb44a", cloud: "#ffe0b8", far: "#cf9a90", near: "#be6f5a", shade: "#783f4c", ground: "#efb37a", wall: "#ffe1c2", palm: "#2b493a", pool: "#2eb5c8", poolDeep: "#166a96", deck: "#f1bf8f", lights: 0.05, stars: 0, shadow: 0.55 },
  { h: 18.6, skyTop: "#3a3e8a", skyMid: "#e65f7a", skyLow: "#ff9e5a", sun: "#ff6a3e", cloud: "#ff998a", far: "#a0527a", near: "#6d3962", shade: "#45234a", ground: "#c36a62", wall: "#f5afa0", palm: "#1c1530", pool: "#3c9ec2", poolDeep: "#22508a", deck: "#d8897f", lights: 0.4, stars: 0, shadow: 0.3 },
  { h: 19.7, skyTop: "#1d2060", skyMid: "#6a3e86", skyLow: "#df6f8a", sun: "#ff7a52", cloud: "#894e80", far: "#5a3e78", near: "#3a2e5e", shade: "#251e45", ground: "#6d4a6a", wall: "#a38aae", palm: "#121029", pool: "#2ad0e6", poolDeep: "#145e94", deck: "#795f80", lights: 0.88, stars: 0.3, shadow: 0.04 },
  { h: 21, skyTop: "#0a0f2e", skyMid: "#18204e", skyLow: "#363266", sun: "#fff2c6", cloud: "#2a2e5c", far: "#28295a", near: "#1c1e42", shade: "#121433", ground: "#383150", wall: "#5d5f8a", palm: "#0b0d22", pool: "#1fd8ea", poolDeep: "#0a6a8c", deck: "#463f66", lights: 1, stars: 1, shadow: 0 },
  { h: 24, skyTop: "#0a0f2e", skyMid: "#18204e", skyLow: "#363266", sun: "#fff2c6", cloud: "#2a2e5c", far: "#28295a", near: "#1c1e42", shade: "#121433", ground: "#383150", wall: "#5d5f8a", palm: "#0b0d22", pool: "#1fd8ea", poolDeep: "#0a6a8c", deck: "#463f66", lights: 1, stars: 1, shadow: 0 },
]

export type CplPreset = {
  landscape: "desert" | "coast"
  /** Door colours along the ground floor. */
  doors: string[]
  /** Umbrella and awning stripe. */
  stripe: string
  light: CplColorSet
  dark: CplColorSet
}

const PRESETS: { [k: string]: CplPreset } = {
  desert: {
    landscape: "desert",
    doors: ["#14a3b3", "#ffb52e", "#e2525c", "#1d2a6b"],
    stripe: "#e2525c",
    light: { paper: "#f6c3bf", card: "#fbe2de", ink: "#191d3a", muted: "#4a4262", pool: "#0b6d7e", sun: "#ffb52e", coral: "#d6404d", night: "#111634" },
    dark: { paper: "#121633", card: "#1b2046", ink: "#fde7e2", muted: "#bdb5d3", pool: "#0d6f80", sun: "#ffc14d", coral: "#ff7b80", night: "#0a0d24" },
  },
  coast: {
    landscape: "coast",
    doors: ["#1f5fa8", "#f2c014", "#e2432c", "#1f5fa8"],
    stripe: "#1f5fa8",
    light: { paper: "#cfe4ee", card: "#e8f3f8", ink: "#0c2742", muted: "#33506b", pool: "#174f8c", sun: "#f2c014", coral: "#d93b27", night: "#0b1d33" },
    dark: { paper: "#0c1c30", card: "#13283f", ink: "#e9f3f8", muted: "#a9bfd0", pool: "#1a5590", sun: "#f5cc3a", coral: "#ff7a62", night: "#071322" },
  },
}

const DEFAULT_MOMENTS: CplMoment[] = [
  { label: "Sunrise", hour: 6.75 },
  { label: "Late breakfast", hour: 9.5 },
  { label: "High noon", hour: 13 },
  { label: "Golden hour", hour: 17.5 },
  { label: "Night swim", hour: 21.75 },
]

const DEFAULT_ROOMS: CplRoom[] = [
  {
    id: "poolside",
    number: "12",
    name: "Poolside King",
    rate: 289,
    size: "32 m²",
    sleeps: 2,
    bed: "King bed",
    text: "Slide the glass door open and you are on the deck, eight steps from the water.",
    features: ["Private patio", "Outdoor shower", "Record player and a crate of LPs"],
    view: "pool",
    hour: 11,
  },
  {
    id: "casita",
    number: "C4",
    name: "Garden Casita",
    rate: 339,
    size: "45 m²",
    sleeps: 3,
    bed: "King and a daybed",
    text: "A freestanding casita in the grapefruit grove, with its own fire pit and two cruiser bikes.",
    features: ["Fire pit", "Kitchenette", "Bikes at the door"],
    view: "palms",
    hour: 17.6,
  },
  {
    id: "mountain",
    number: "21",
    name: "Mountain Suite",
    rate: 419,
    size: "58 m²",
    sleeps: 4,
    bed: "Two queens",
    text: "The upstairs corner, with a wraparound balcony that catches first light on the peaks.",
    features: ["Wraparound balcony", "Soaking tub", "Coffee bar"],
    view: "mountain",
    hour: 7,
  },
  {
    id: "bungalow",
    number: "R1",
    name: "Roof Bungalow",
    rate: 640,
    size: "80 m²",
    sleeps: 4,
    bed: "King and a sofa bed",
    text: "Above the bar, with a plunge pool on the roof and the darkest sky in town.",
    features: ["Roof deck and plunge pool", "Telescope", "Bar delivery until 1 am"],
    view: "night",
    hour: 22.2,
  },
]

const DEFAULT_PROGRAMME: CplEvent[] = [
  { hour: 6.5, until: 8, title: "Sunrise laps", place: "The long pool", text: "Pool opens with two lanes roped off until eight. Coffee on the cart by the steps." },
  { hour: 8, until: 10.5, title: "Breakfast on the deck", place: "Pool deck", text: "Date pancakes, grapefruit from the grove and eggs any way you like them." },
  { hour: 10.5, until: 12.5, title: "Tennis clinic", place: "Clay courts", text: "Forty minutes with our pro. Racquets and fresh balls are at the front desk." },
  { hour: 12.5, until: 15.5, title: "Siesta hours", place: "Everywhere", text: "The pool goes quiet until half past three. No music, phones face down, umbrellas up." },
  { hour: 15.5, until: 17.5, title: "Bikes to the canyon", place: "Front gate", text: "Cruisers leave for the canyon trailhead and come back in time for the first drink." },
  { hour: 17.5, until: 19.5, title: "Martini hour", place: "Pool bar", text: "Two for one while the mountains turn pink. Dirty, dry or with a grapefruit twist." },
  { hour: 19.5, until: 21.5, title: "Dinner under the butterfly roof", place: "The Butterfly Room", text: "A short grill menu and a long wine list. Book a table at the desk before six." },
  { hour: 21.5, until: 0.5, title: "Night swim", place: "The long pool", text: "Pool lights on until half past midnight. Robes and towels are in the cabana." },
]

const DEFAULT_FACTS: CplFact[] = [
  { value: "25 m", label: "One long pool, heated to 28 °C all year" },
  { value: "32", label: "Rooms, none more than a minute from the water" },
  { value: "2", label: "Clay courts, lit until ten at night" },
  { value: "8 min", label: "From the airport, and the shuttle is on us" },
]

const DEFAULT_QUOTES: CplQuote[] = [
  { quote: "We came for two nights and stayed six. The night swim is the best thing in the whole desert.", name: "Ines and Marco", stay: "Poolside King, March" },
  { quote: "On the second day the bar already knew my order. Dirty, three olives. I have never felt so understood.", name: "Priya N.", stay: "Garden Casita, November" },
  { quote: "Siesta hours should be the law. The quietest pool I have ever fallen asleep beside.", name: "Tom R.", stay: "Mountain Suite, January" },
]

const DEFAULT_VISIT: CplVisit = {
  title: "Two hours from the city, eight minutes from the airport.",
  text: "Take the 10 east until the windmills, then follow the palms. Parking is free and the shuttle meets every flight.",
  address: ["Hotel Paloma", "1150 East Paloma Way", "Palm Springs, CA 92262"],
  phone: "(760) 555-0148",
  email: "stay@hotelpaloma.example",
  drives: [
    { from: "Palm Springs airport", time: "8 min", dir: "up-right" },
    { from: "Joshua Tree", time: "50 min", dir: "up" },
    { from: "Los Angeles", time: "2 h", dir: "left" },
    { from: "San Diego", time: "2 h 20", dir: "up-left" },
  ],
}

const DEFAULT_LINKS: CplLink[] = [
  { label: "Rooms", href: "#rooms" },
  { label: "The day", href: "#day" },
  { label: "Guestbook", href: "#guestbook" },
  { label: "Getting here", href: "#visit" },
]
// #endregion content

// #region logic
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))
const smoothstep = (a: number, b: number, v: number) => {
  const t = clamp((v - a) / (b - a), 0, 1)
  return t * t * (3 - 2 * t)
}
const wrapHour = (h: number) => ((h % 24) + 24) % 24

function hexRgb(hex: string): [number, number, number] {
  let s = hex.replace("#", "")
  if (s.length === 3) s = s[0] + s[0] + s[1] + s[1] + s[2] + s[2]
  const n = parseInt(s.slice(0, 6), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function mix(a: string, b: string, t: number) {
  const x = hexRgb(a)
  const y = hexRgb(b)
  const k = clamp(t, 0, 1)
  const c = (i: number) => Math.round(x[i] + (y[i] - x[i]) * k).toString(16).padStart(2, "0")
  return "#" + c(0) + c(1) + c(2)
}

/** WCAG relative luminance contrast between two hex colours. */
function contrast(a: string, b: string) {
  const lum = (hex: string) => {
    const [r, g, bl] = hexRgb(hex).map((v) => {
      const s = v / 255
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
    })
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl
  }
  const la = lum(a)
  const lb = lum(b)
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}

export type CplPalette = CplSkyStop & { chrome: string[]; sea: string; glass: string; lit: string }

/** The scene's colours at any hour: the two nearest key frames, mixed. */
function samplePalette(hour: number, stops: CplSkyStop[] = SKY): CplPalette {
  const h = wrapHour(hour)
  let i = 0
  while (i < stops.length - 2 && stops[i + 1].h <= h) i++
  const a = stops[i]
  const b = stops[i + 1]
  const t = smoothstep(0, 1, (h - a.h) / (b.h - a.h || 1))
  const out = { h } as { [k: string]: string | number }
  for (const k of Object.keys(a)) {
    if (k === "h") continue
    const va = (a as unknown as { [k: string]: string | number })[k]
    const vb = (b as unknown as { [k: string]: string | number })[k]
    out[k] = typeof va === "number" ? va + ((vb as number) - va) * t : mix(va, vb as string, t)
  }
  const p = out as unknown as CplPalette
  // Chrome reflects the sky over a dark horizon and the warm ground below.
  p.chrome = [
    mix(p.skyTop, "#0b1638", 0.35),
    p.skyMid,
    mix(p.skyLow, "#ffffff", 0.82),
    mix(p.shade, "#1a0f24", 0.55),
    mix(p.near, p.ground, 0.4),
    p.ground,
    mix(p.ground, "#ffffff", 0.7),
  ]
  p.sea = mix(p.poolDeep, p.skyMid, 0.38)
  p.glass = mix(p.skyMid, "#1b2448", 0.45)
  p.lit = mix(p.glass, "#ffd27a", p.lights)
  return p
}

export const SUN_RISE = 6.3
export const SUN_SET = 19.3
/** Where the sun sits on the poster (viewBox 1600 x 1000), and how high it is (0..1). */
function sunPosition(hour: number) {
  const k = (wrapHour(hour) - SUN_RISE) / (SUN_SET - SUN_RISE)
  const alt = Math.sin(Math.PI * clamp(k, 0, 1))
  return { x: 300 + k * 760, y: 440 - alt * 230, alt, k, up: k > -0.08 && k < 1.08 }
}
const MOON_RISE = 19.9
const MOON_SPAN = 10.1
function moonPosition(hour: number) {
  const k = wrapHour(hour - MOON_RISE) / MOON_SPAN
  const alt = Math.sin(Math.PI * clamp(k, 0, 1))
  return { x: 220 + k * 1160, y: 600 - alt * 330, up: k <= 1 }
}

/** Shadows fall toward the viewer and away from the sun; long when it is low. */
function shadowVector(hour: number) {
  const s = sunPosition(hour)
  if (!s.up) return { dx: 0, dy: 0, k: 0 }
  const side = clamp((s.k - 0.5) * 2, -1.2, 1.2)
  const len = 0.25 + (1 - s.alt) * 0.75
  return { dx: -side * len * 260, dy: len * 70, k: smoothstep(0, 0.12, s.alt) }
}

function formatHour(hour: number, clock: "12h" | "24h" = "12h") {
  const total = Math.round(wrapHour(hour) * 60) % 1440
  const h = Math.floor(total / 60)
  const m = total % 60
  const mm = String(m).padStart(2, "0")
  if (clock === "24h") return String(h).padStart(2, "0") + ":" + mm
  const h12 = h % 12 === 0 ? 12 : h % 12
  return h12 + ":" + mm + (h < 12 ? " am" : " pm")
}

/** The moment whose hour is the latest at or before `hour`, wrapping round midnight. */
function momentAt(moments: CplMoment[], hour: number) {
  if (!moments.length) return ""
  const h = wrapHour(hour)
  const sorted = [...moments].sort((a, b) => a.hour - b.hour)
  let pick = sorted[sorted.length - 1]
  for (const m of sorted) if (m.hour <= h) pick = m
  return pick.label
}

function inSpan(h: number, from: number, until: number) {
  const x = wrapHour(h)
  const a = wrapHour(from)
  const b = wrapHour(until)
  return a <= b ? x >= a && x < b : x >= a || x < b
}

/** Which event is on at `hour`; if nothing is, the next one, marked upcoming. */
function eventAt(events: CplEvent[], hour: number) {
  for (let i = 0; i < events.length; i++) if (inSpan(hour, events[i].hour, events[i].until)) return { index: i, now: true }
  if (!events.length) return { index: -1, now: false }
  const h = wrapHour(hour)
  let best = 0
  let gap = 99
  events.forEach((e, i) => {
    const g = wrapHour(e.hour - h)
    if (g < gap) {
      gap = g
      best = i
    }
  })
  return { index: best, now: false }
}

/** Glyph placement for the chrome wordmark. */
export const STROKE = 26
const TRACK = 22
/** The letters are drawn upright and stretched sideways, so stems come out heavier than bars, like an extended display face. */
export const WIDE = 1.3
const SPACE = 46
function layoutWord(text: string) {
  const chars = text.normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase().split("")
  const out: { d: string; x: number }[] = []
  let x = 0
  for (const ch of chars) {
    const g = GLYPHS[ch]
    if (!g) {
      x += SPACE
      continue
    }
    out.push({ d: g[1], x })
    x += g[0] + STROKE + TRACK
  }
  return { glyphs: out, width: Math.max(0, x - STROKE - TRACK) }
}

const dayNumber = (iso: string) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!m) return NaN
  return Math.round(Date.UTC(+m[1], +m[2] - 1, +m[3]) / 864e5)
}
function nightsBetween(checkIn: string, checkOut: string) {
  const n = dayNumber(checkOut) - dayNumber(checkIn)
  return Number.isFinite(n) ? n : 0
}
function isoDay(day: number) {
  return new Date(day * 864e5).toISOString().slice(0, 10)
}

/** A stable stand-in for live inventory: 0 (sold out) to 4 rooms left. */
function roomsLeft(roomId: string, checkIn: string, nights: number) {
  const s = roomId + "|" + checkIn + "|" + nights
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return (h >>> 0) % 5
}

function formatMoney(n: number, currency = "$") {
  const fixed = Math.round(n) === n ? String(n) : n.toFixed(2)
  const [int, dec] = fixed.split(".")
  return currency + int.replace(/\B(?=(\d{3})+(?!\d))/g, ",") + (dec ? "." + dec : "")
}

/** The postmark date: an explicit one, or the last word of "Room, Month". */
const postDate = (q: CplQuote) => (q.date || q.stay.split(/[,\s]+/).filter(Boolean).pop() || "").toUpperCase()

const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s.trim())

function nextIndex(i: number, key: string, n: number) {
  if (key === "ArrowRight" || key === "ArrowDown") return (i + 1) % n
  if (key === "ArrowLeft" || key === "ArrowUp") return (i - 1 + n) % n
  if (key === "Home") return 0
  if (key === "End") return n - 1
  return i
}

/** The dial's keyboard: a quarter hour per arrow, an hour per page key. */
function dialKey(hour: number, key: string) {
  if (key === "ArrowRight" || key === "ArrowUp") return wrapHour(hour + 0.25)
  if (key === "ArrowLeft" || key === "ArrowDown") return wrapHour(hour - 0.25)
  if (key === "PageUp") return wrapHour(hour + 1)
  if (key === "PageDown") return wrapHour(hour - 1)
  if (key === "Home") return 0
  if (key === "End") return 23.75
  return null
}

function resolveColors(preset: CplPreset, dark: boolean, over?: CplColors): CplColorSet {
  const base = dark ? preset.dark : preset.light
  const out: CplColorSet = { ...base }
  if (over) for (const k of Object.keys(over) as (keyof CplColors)[]) if (over[k]) out[k] = over[k] as string
  return out
}

/** A seeded scatter, so the stars and grain sit in the same place every render. */
function seeded(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0
    return s / 4294967296
  }
}
// #endregion logic

function useReduced() {
  const [reduced, setReduced] = React.useState(false)
  React.useEffect(() => {
    if (typeof matchMedia !== "function") return
    const mq = matchMedia("(prefers-reduced-motion: reduce)")
    const read = () => setReduced(mq.matches)
    read()
    mq.addEventListener("change", read)
    return () => mq.removeEventListener("change", read)
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

/** Reveal-on-scroll, armed only after mount so nothing is hidden without JS or under reduced motion. */
function useReveal(root: { current: HTMLElement | null }, reduced: boolean) {
  React.useEffect(() => {
    const el = root.current
    if (!el || reduced || typeof IntersectionObserver === "undefined") return
    const items = Array.from(el.querySelectorAll(".cpl-rv"))
    const io = new IntersectionObserver(
      (es) => {
        for (const e of es) if (e.isIntersecting) {
          e.target.classList.add("cpl-in")
          io.unobserve(e.target)
        }
      },
      { rootMargin: "0px 0px -8% 0px" },
    )
    for (const it of items) {
      const r = it.getBoundingClientRect()
      if (r.top > innerHeight * 0.95) {
        it.classList.add("cpl-arm")
        io.observe(it)
      }
    }
    return () => io.disconnect()
  }, [root, reduced])
}

/* ---------------- the chrome wordmark ---------------- */

function Wordmark({ text, pal, uid, className, rim = "#100c26" }: { text: string; pal: CplPalette; uid: string; className?: string; rim?: string }) {
  const { glyphs, width } = React.useMemo(() => layoutWord(text), [text])
  const pad = STROKE / 2 + 6
  const ext = 12
  const id = uid + "wm"
  const c = pal.chrome
  const sparkles = glyphs.length ? [(glyphs[Math.min(1, glyphs.length - 1)].x + 70) * WIDE, glyphs[glyphs.length - 1].x * WIDE + 6] : []
  return (
    <svg
      className={"cpl-wordmark " + (className || "")}
      viewBox={-pad * WIDE + " " + -pad + " " + ((width + pad * 2) * WIDE + ext) + " " + (100 + pad * 2 + ext)}
      role="img"
      aria-label={text}
    >
      <defs>
        <linearGradient id={id + "c"} gradientUnits="userSpaceOnUse" x1="0" y1={-STROKE / 2} x2="0" y2={100 + STROKE / 2}>
          <stop offset="0" stopColor={c[0]} />
          <stop offset="0.3" stopColor={c[1]} />
          <stop offset="0.5" stopColor={c[2]} />
          <stop offset="0.505" stopColor={c[3]} />
          <stop offset="0.62" stopColor={c[4]} />
          <stop offset="0.84" stopColor={c[5]} />
          <stop offset="1" stopColor={c[6]} />
        </linearGradient>
        <linearGradient id={id + "x"} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2a2350" />
          <stop offset="1" stopColor="#0d0b22" />
        </linearGradient>
        <g id={id + "g"} fill="none">
          {glyphs.map((g, i) => (
            <path key={i} d={g.d} transform={"translate(" + g.x + " 0)"} />
          ))}
        </g>
      </defs>
      <g strokeLinejoin="miter" strokeMiterlimit={2.2} strokeLinecap="butt" transform={"scale(" + WIDE + " 1)"}>
        {Array.from({ length: ext }, (_, i) => ext - i).map((i) => (
          <use key={i} href={"#" + id + "g"} transform={"translate(" + (i * 0.7) / WIDE + " " + i + ")"} stroke={"url(#" + id + "x)"} strokeWidth={STROKE + 8} />
        ))}
        <use href={"#" + id + "g"} stroke={rim} strokeWidth={STROKE + 8} />
        <use href={"#" + id + "g"} stroke={"url(#" + id + "c)"} strokeWidth={STROKE} />
        <use href={"#" + id + "g"} stroke="#ffffff" strokeOpacity={0.62} strokeWidth={2.6} transform="translate(-1.2 -2)" />
      </g>
      {sparkles.map((x, i) => (
        <path
          key={i}
          className="cpl-spark"
          style={{ animationDelay: i * 1.7 + "s" }}
          d={"M" + x + " " + (i ? 2 : -14) + "l4 14 14 4-14 4-4 14-4-14-14-4 14-4z"}
          fill="#ffffff"
        />
      ))}
    </svg>
  )
}

/** The hotel's initial, drawn in the chrome alphabet, for the pylon sign and the pill nav. */
function Monogram({ letter, color, size = 22 }: { letter: string; color: string; size?: number }) {
  const g = GLYPHS[letter.toUpperCase()] || GLYPHS.P
  const w = g[0] + STROKE
  return (
    <svg viewBox={-STROKE / 2 + " " + -STROKE / 2 + " " + w + " " + (100 + STROKE)} width={(size * w) / (100 + STROKE)} height={size} aria-hidden="true">
      <path d={g[1]} fill="none" stroke={color} strokeWidth={STROKE} strokeLinejoin="miter" strokeMiterlimit={2.2} />
    </svg>
  )
}

/* ---------------- the poster ---------------- */

type Palm = { x: number; y: number; h: number; lean: number; s: number }
const BACK_PALMS: Palm[] = [
  { x: 20, y: 640, h: 280, lean: 0.05, s: 0.8 },
  { x: 1660, y: 640, h: 320, lean: -0.04, s: 0.84 },
  { x: 650, y: 610, h: 300, lean: -0.05, s: 0.8 },
  { x: 770, y: 610, h: 350, lean: 0.04, s: 0.86 },
  { x: 1190, y: 610, h: 330, lean: 0.06, s: 0.84 },
  { x: 1300, y: 610, h: 270, lean: -0.04, s: 0.78 },
]
const FRONT_PALMS: Palm[] = [
  { x: -110, y: 860, h: 540, lean: 0.07, s: 1.1 },
  { x: 1730, y: 870, h: 560, lean: -0.06, s: 1.12 },
  { x: 240, y: 880, h: 590, lean: -0.07, s: 1.18 },
  { x: 395, y: 770, h: 450, lean: 0.05, s: 1 },
  { x: 1430, y: 800, h: 520, lean: 0.08, s: 1.08 },
  { x: 1560, y: 900, h: 640, lean: -0.05, s: 1.25 },
]

function trunkPath(p: Palm) {
  const tx = p.x + p.lean * p.h
  const ty = p.y - p.h
  const cx = p.x + p.lean * p.h * 0.15
  const cy = p.y - p.h * 0.55
  const left: string[] = []
  const right: string[] = []
  for (let i = 0; i <= 10; i++) {
    const t = i / 10
    const x = (1 - t) * (1 - t) * p.x + 2 * (1 - t) * t * cx + t * t * tx
    const y = (1 - t) * (1 - t) * p.y + 2 * (1 - t) * t * cy + t * t * ty
    const w = (16 - t * 7) * p.s
    left.push(x - w / 2 + " " + y)
    right.unshift(x + w / 2 + " " + y)
  }
  return { d: "M" + left.join("L") + "L" + right.join("L") + "Z", spine: "M" + p.x + " " + p.y + "Q" + cx + " " + cy + " " + tx + " " + ty, tx, ty }
}

function frond(angle: number, len: number) {
  const L = len
  const flip = Math.cos((angle * Math.PI) / 180) < 0
  const d = "M0 0C" + L * 0.3 + " " + -L * 0.2 + " " + L * 0.68 + " " + -L * 0.16 + " " + L + " " + L * 0.22 + "C" + L * 0.66 + " " + L * 0.04 + " " + L * 0.32 + " " + L * 0.07 + " 0 0Z"
  return { d, t: "rotate(" + angle + ")" + (flip ? " scale(1 -1)" : "") }
}
/** Streak clouds: [x, y, width]. */
const CLOUDS: [number, number, number][] = [
  [-60, 300, 320],
  [1180, 262, 380],
  [700, 410, 220],
]
const FRONDS = [-172, -150, -128, -108, -90, -72, -52, -30, -8, 14, 166, 194]

function PalmTree({ p, fill, ring, i }: { p: Palm; fill: string; ring: string; i: number }) {
  const t = trunkPath(p)
  const len = clamp(p.h * 0.3, 80, 170) * (0.9 + p.s * 0.1)
  return (
    <g>
      <path d={t.d} fill={fill} />
      <path d={t.spine} fill="none" stroke={ring} strokeWidth={9 * p.s} strokeDasharray="2 8" opacity={0.55} />
      <g className="cpl-sway" style={{ animationDelay: -i * 1.3 + "s" }} transform={"translate(" + t.tx + " " + t.ty + ")"}>
        <path d={"M" + -15 * p.s + " 2Q0 " + 70 * p.s + " " + 15 * p.s + " 2Z"} fill={ring} opacity={0.9} />
        {FRONDS.map((a, k) => {
          const f = frond(a, len * (k % 3 === 1 ? 0.88 : 1))
          return <path key={k} d={f.d} transform={f.t} fill={fill} />
        })}
      </g>
    </g>
  )
}

function Umbrella({ x, y, r, stripe, white, pole }: { x: number; y: number; r: number; stripe: string; white: string; pole: string }) {
  const wedges: React.ReactNode[] = []
  const n = 6
  for (let k = 0; k < n; k++) {
    const a0 = Math.PI + (k / n) * Math.PI
    const a1 = Math.PI + ((k + 1) / n) * Math.PI
    const d = "M" + x + " " + y + "L" + (x + Math.cos(a0) * r) + " " + (y + Math.sin(a0) * r * 0.55) + "A" + r + " " + r * 0.55 + " 0 0 1 " + (x + Math.cos(a1) * r) + " " + (y + Math.sin(a1) * r * 0.55) + "Z"
    wedges.push(<path key={k} d={d} fill={k % 2 ? white : stripe} />)
  }
  let scallop = "M" + (x - r) + " " + y
  for (let k = 0; k < n; k++) scallop += "a" + r / n + " " + r / n / 1.6 + " 0 0 0 " + (2 * r) / n + " 0"
  return (
    <g>
      <path d={"M" + x + " " + (y - r * 0.5) + "V" + (y + r * 1.25)} stroke={pole} strokeWidth={4} />
      {wedges}
      <path d={scallop + "Z"} fill={stripe} />
    </g>
  )
}

function Agave({ x, y, s, fill }: { x: number; y: number; s: number; fill: string }) {
  const leaves = [-160, -135, -112, -90, -68, -45, -20]
  return (
    <g transform={"translate(" + x + " " + y + ") scale(" + s + ")"}>
      {leaves.map((a, i) => (
        <path key={i} d="M-5 0Q0 -30 0 -46Q2 -30 5 0Z" transform={"rotate(" + (a + 90) + ")"} fill={fill} />
      ))}
    </g>
  )
}

export function PosterScene({
  hour,
  preset,
  uid,
  view = "0 0 1600 1000",
  align = "xMidYMax slice",
  label,
  className,
}: {
  hour: number
  preset: CplPreset
  uid: string
  view?: string
  align?: string
  label?: string
  className?: string
}) {
  const p = samplePalette(hour)
  const sun = sunPosition(hour)
  const moon = moonPosition(hour)
  const sh = shadowVector(hour)
  const id = (s: string) => uid + s
  const ref = (s: string) => "url(#" + uid + s + ")"
  const coast = preset.landscape === "coast"
  const white = mix(p.wall, "#ffffff", 0.35)
  const wallShade = mix(p.wall, p.shade, 0.4)
  const ink = mix("#141836", p.shade, 0.3)
  const shadowA = p.shadow * sh.k
  const stars = React.useMemo(() => {
    const r = seeded(7)
    return Array.from({ length: 56 }, () => ({ x: r() * 2000 - 200, y: 180 + r() * 330, r: 0.8 + r() * 1.8 }))
  }, [])
  const sunLeft = sun.k < 0.5
  const lightsPath = "M560 706Q800 752 1040 706Q1240 752 1400 706"
  const bulbs = React.useMemo(() => {
    const pts: { x: number; y: number }[] = []
    const q = (a: number[], b: number[], c: number[], t: number) => [
      (1 - t) * (1 - t) * a[0] + 2 * (1 - t) * t * b[0] + t * t * c[0],
      (1 - t) * (1 - t) * a[1] + 2 * (1 - t) * t * b[1] + t * t * c[1],
    ]
    for (let i = 1; i < 12; i++) {
      const [x, y] = q([560, 706], [800, 752], [1040, 706], i / 12)
      pts.push({ x, y })
    }
    for (let i = 1; i < 10; i++) {
      const [x, y] = q([1040, 706], [1240, 752], [1400, 706], i / 10)
      pts.push({ x, y })
    }
    return pts
  }, [])
  const doors = preset.doors

  return (
    <svg className={"cpl-scene " + (className || "")} viewBox={view} preserveAspectRatio={align} role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      <defs>
        <linearGradient id={id("sky")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.skyTop} />
          <stop offset="0.55" stopColor={p.skyMid} />
          <stop offset="1" stopColor={p.skyLow} />
        </linearGradient>
        <linearGradient id={id("water")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={mix(p.pool, p.skyLow, 0.3)} />
          <stop offset="1" stopColor={p.poolDeep} />
        </linearGradient>
        <radialGradient id={id("glow")} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#d8fbff" stopOpacity="0.95" />
          <stop offset="0.55" stopColor={p.pool} stopOpacity="0.5" />
          <stop offset="1" stopColor={p.pool} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={id("halo")} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor={p.sun} stopOpacity="0.55" />
          <stop offset="1" stopColor={p.sun} stopOpacity="0" />
        </radialGradient>
        <pattern id={id("dots")} width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(30)">
          <circle cx="4.5" cy="4.5" r="1.7" fill={ink} />
        </pattern>
        <pattern id={id("breeze")} width="28" height="28" patternUnits="userSpaceOnUse">
          <rect width="28" height="28" fill={p.wall} />
          <circle cx="14" cy="14" r="9" fill={wallShade} />
          <circle cx="14" cy="14" r="5" fill={mix(p.glass, p.lit, 0.6)} />
        </pattern>
        <clipPath id={id("poolclip")}>
          <path d="M360 790H1240L1400 952H200Z" />
        </clipPath>
        <mask id={id("sunbars")}>
          <rect x="-200" y="-200" width="400" height="400" fill="#fff" />
          {[0, 1, 2, 3, 4].map((k) => (
            <rect key={k} x="-200" y={20 + k * 22} width="400" height={4 + k * 2.4} fill="#000" />
          ))}
        </mask>
      </defs>

      {/* sky */}
      <rect x="-200" y="0" width="2000" height="720" fill={ref("sky")} />
      <g opacity={p.stars}>
        {stars.map((s, i) => (
          <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#fff7e0" />
        ))}
      </g>
      {sun.up && (
        <g transform={"translate(" + sun.x + " " + sun.y + ")"}>
          <circle r="230" fill={ref("halo")} />
          <circle r="112" fill={p.sun} mask={ref("sunbars")} />
        </g>
      )}
      {moon.up && p.stars > 0.2 && (
        <g transform={"translate(" + moon.x + " " + moon.y + ")"} opacity={p.stars}>
          <circle r="48" fill="#fff4cf" />
          <circle r="44" cx="20" cy="-8" fill={p.skyTop} opacity="0.92" />
        </g>
      )}
      <g fill={p.cloud} opacity={0.9}>
        {CLOUDS.map((c, i) => (
          <g key={i} transform={"translate(" + c[0] + " " + c[1] + ")"}>
            <rect x={c[2] * 0.22} y="0" width={c[2] * 0.62} height="15" rx="7.5" />
            <rect x="0" y="19" width={c[2]} height="13" rx="6.5" />
            <rect x={c[2] * 0.38} y="36" width={c[2] * 0.5} height="9" rx="4.5" opacity="0.75" />
          </g>
        ))}
      </g>

      {/* the far and near land */}
      {coast ? (
        <g>
          <path d="M1180 560L1250 548L1330 552L1400 560Z M1560 560L1640 540L1720 546L1800 560Z" fill={p.far} />
          <rect x="-200" y="560" width="2000" height="60" fill={p.sea} />
          <path d="M-200 600V540L-60 520L90 502L180 472L260 454L330 472L420 502L520 542L600 600Z" fill={p.near} />
          <path d="M260 454L330 472L420 502L520 542L600 600H430L360 520Z" fill={p.shade} opacity={sunLeft ? 0.85 : 0.35} />
          <g stroke={mix(p.sea, "#ffffff", 0.45)} strokeWidth="3" opacity="0.55">
            <path d="M640 574H760M900 586H1060M1180 576H1300M720 600H820" />
          </g>
          <rect x="300" y="414" width="16" height="44" fill={white} />
          <rect x="296" y="404" width="24" height="12" fill={preset.stripe} />
          <circle cx="308" cy="398" r={7 + p.lights * 4} fill="#ffe7a0" opacity={0.4 + p.lights * 0.6} />
        </g>
      ) : (
        <g>
          <path d="M-200 610V470L-100 440L0 430L120 400L230 330L330 362L420 300L520 352L600 322L700 382L800 362L900 410L1000 382L1120 300L1220 252L1300 292L1400 272L1500 340L1600 320L1700 290L1800 330V610Z" fill={p.far} />
          <path d="M-200 620V450L-100 410L0 390L90 336L180 254L262 192L332 232L404 300L470 334L562 420L662 472L762 524L830 620Z" fill={p.near} />
          <path
            d="M262 192L332 232L404 300L470 334L562 420L662 472L762 524L830 620H560L470 470L400 400L330 300Z"
            fill={p.shade}
            opacity={sunLeft ? 0.95 : 0.25}
          />
          <path d="M262 192L180 254L90 336L0 390L-100 410L-200 450V620H120L170 430L230 300Z" fill={p.shade} opacity={sunLeft ? 0.2 : 0.9} />
          <path d="M262 192L332 232L404 300L470 334L562 420L662 472L762 524L830 620H560L470 470L400 400L330 300Z" fill={ref("dots")} opacity={sunLeft ? 0.35 : 0.1} />
          <path d="M1040 620L1160 470L1262 420L1342 360L1422 332L1500 380L1600 362L1700 400L1800 384V620Z" fill={p.near} />
          <path d="M1342 360L1422 332L1500 380L1600 362L1700 400L1800 384V620H1400L1380 440Z" fill={p.shade} opacity={sunLeft ? 0.9 : 0.25} />
          <path d="M1342 360L1262 420L1160 470L1040 620H1250L1300 450Z" fill={p.shade} opacity={sunLeft ? 0.2 : 0.85} />
          <path d="M1342 360L1262 420L1160 470L1040 620H1250L1300 450Z" fill={ref("dots")} opacity={sunLeft ? 0.08 : 0.32} />
          <path d="M248 202L262 192L278 201L268 214Z M1408 341L1422 332L1438 341L1424 352Z" fill={mix(p.wall, "#ffffff", 0.6)} opacity={0.8} />
        </g>
      )}

      {/* desert floor */}
      <rect x="-200" y="600" width="2000" height="400" fill={coast ? mix(p.ground, p.wall, 0.35) : p.ground} />
      <Agave x={470} y={706} s={1.1} fill={mix(p.palm, p.ground, 0.25)} />
      <Agave x={1370} y={708} s={0.9} fill={mix(p.palm, p.ground, 0.25)} />
      <Agave x={-40} y={712} s={1.3} fill={mix(p.palm, p.ground, 0.25)} />
      {/* the clay courts */}
      <path d="M1586 708H1800V776H1552Z" fill={coast ? mix("#c9643f", p.wall, 0.15) : mix("#cf6a43", p.ground, 0.25)} />
      <path d="M1600 714H1800M1572 768H1800M1594 714L1566 768M1690 714L1680 768M1580 741H1800" stroke={white} strokeWidth="2.5" fill="none" opacity="0.85" />
      <path d="M1586 708H1800" stroke={ink} strokeWidth="2" opacity="0.4" />
      <path d="M1574 744H1800" stroke={ink} strokeWidth="3" opacity="0.55" strokeDasharray="3 3" />

      {BACK_PALMS.map((pp, i) => (
        <PalmTree key={i} p={pp} i={i + 4} fill={mix(p.palm, p.far, 0.18)} ring={mix(p.palm, "#000000", 0.35)} />
      ))}

      {/* the hotel */}
      <g>
        <rect x="600" y="520" width="740" height="82" fill={p.wall} />
        {Array.from({ length: 8 }, (_, k) => (
          <g key={k}>
            <rect x={612 + k * 91} y="534" width="60" height="58" fill={k === 2 || k === 5 ? p.lit : mix(p.glass, p.lit, p.lights * 0.7)} />
            <rect x={612 + k * 91} y="534" width="60" height="10" fill={wallShade} opacity="0.7" />
            <rect x={680 + k * 91} y="524" width="8" height="78" fill={wallShade} />
          </g>
        ))}
        <rect x="578" y="506" width="784" height="16" fill={white} />
        <rect x="578" y="520" width="784" height="5" fill={ink} opacity="0.35" />
        <rect x="560" y="602" width="820" height="100" fill={p.wall} />
        <rect x="560" y="602" width="140" height="100" fill={ref("breeze")} />
        {Array.from({ length: 9 }, (_, k) => (
          <g key={k}>
            <rect x={716 + k * 72} y="628" width="32" height="74" fill={doors[k % doors.length]} />
            <rect x={754 + k * 72} y="640" width="26" height="32" fill={k % 3 === 1 ? p.lit : mix(p.glass, p.lit, p.lights * 0.8)} />
          </g>
        ))}
        <rect x="540" y="592" width="860" height="14" fill={white} />
        <rect x="540" y="606" width="860" height="16" fill={p.shade} opacity={0.35 + shadowA * 0.4} />
        <rect x="540" y="606" width="860" height="16" fill={ref("dots")} opacity="0.35" />
        <path d="M600 590H1340" stroke={ink} strokeWidth="3" opacity="0.6" />
        <path d={Array.from({ length: 38 }, (_, k) => "M" + (606 + k * 20) + " 576V590").join("")} stroke={ink} strokeWidth="2" opacity="0.5" />
        {/* the butterfly-roof bar */}
        <rect x="1386" y="650" width="170" height="54" fill={p.wall} />
        <rect x="1404" y="664" width="134" height="30" fill={p.lit} />
        <path d="M1370 638L1471 664L1572 638L1572 648L1471 676L1370 648Z" fill={white} />
        <path d="M1370 648L1471 676L1572 648" stroke={ink} strokeWidth="3" fill="none" opacity="0.5" />
        {/* pylon sign */}
        <rect x="490" y="440" width="30" height="262" fill={preset.stripe} />
        <rect x="490" y="440" width="10" height="262" fill={ink} opacity="0.18" />
        <circle cx="505" cy="420" r="44" fill={mix(white, "#ffe7a0", p.lights)} stroke={ink} strokeWidth="5" />
        <g transform="translate(486 397) scale(0.44)">
          <path d={(GLYPHS.P || GLYPHS.A)[1]} fill="none" stroke={ink} strokeWidth={STROKE} strokeLinejoin="miter" />
        </g>
      </g>

      {/* deck */}
      <path d="M-200 702H1540V780H1800V1000H-200Z" fill={p.deck} />
      <g stroke={mix(p.deck, ink, 0.25)} strokeWidth="2" opacity="0.6">
        <path d="M-200 736H1540M-200 772H1540M-200 968H1800" />
        <path d="M800 702L120 1000M800 702L520 1000M800 702L1080 1000M800 702L1480 1000" opacity="0.5" />
      </g>
      {/* shadows */}
      <g fill={p.shade} opacity={shadowA * 0.75}>
        {FRONT_PALMS.map((pp, i) => (
          <g key={i}>
            <path d={"M" + (pp.x - 7) + " " + pp.y + "L" + (pp.x + 7) + " " + pp.y + "L" + (pp.x + sh.dx * pp.s + 3) + " " + (pp.y + sh.dy * pp.s) + "L" + (pp.x + sh.dx * pp.s - 3) + " " + (pp.y + sh.dy * pp.s) + "Z"} />
            <ellipse cx={pp.x + sh.dx * pp.s} cy={pp.y + sh.dy * pp.s} rx={52 * pp.s} ry={14 * pp.s} />
          </g>
        ))}
        <path d={"M560 702H1400L" + (1400 + sh.dx * 0.25) + " " + (702 + sh.dy * 0.45) + "H" + (560 + sh.dx * 0.25) + "Z"} />
        {[460, 800, 1150].map((x, i) => (
          <ellipse key={i} cx={x + sh.dx * 0.35} cy={746 + sh.dy * 0.3} rx="62" ry="12" />
        ))}
      </g>
      {/* string lights */}
      <path d={lightsPath} fill="none" stroke={ink} strokeWidth="1.6" opacity="0.5" />
      <g fill="#ffe28a" opacity={0.25 + p.lights * 0.75}>
        {bulbs.map((b, i) => (
          <circle key={i} cx={b.x} cy={b.y + 4} r={3.4 + p.lights * 1.8} />
        ))}
      </g>
      {/* loungers */}
      <g>
        {[540, 640, 960, 1060].map((x, i) => (
          <g key={i}>
            <path d={"M" + x + " 752h70l8 14h-86z"} fill={white} />
            <path d={"M" + (x - 4) + " 752l14 -18h12l-6 18z"} fill={white} />
            <path d={"M" + (x + 6) + " 756h58M" + (x + 4) + " 761h62"} stroke={i % 2 ? preset.stripe : p.poolDeep} strokeWidth="2.4" />
          </g>
        ))}
      </g>
      <Umbrella x={460} y={700} r={66} stripe={preset.stripe} white={white} pole={ink} />
      <Umbrella x={800} y={696} r={70} stripe={preset.stripe} white={white} pole={ink} />
      <Umbrella x={1150} y={700} r={66} stripe={preset.stripe} white={white} pole={ink} />

      {/* the long pool */}
      <path d="M360 790H1240L1400 952H200Z" fill={ref("water")} />
      <g clipPath={ref("poolclip")}>
        <rect x="200" y="790" width="1200" height="44" fill={p.skyLow} opacity="0.22" />
        <g className="cpl-caustic" stroke="#ffffff" strokeWidth="3" fill="none" opacity={0.42 + p.lights * 0.3}>
          {[812, 846, 884, 924].map((y, i) => (
            <path key={i} d={"M" + (40 - i * 37) + " " + y + Array.from({ length: 12 }, () => "q40 -" + (6 + i) + " 80 0t80 0").join("")} />
          ))}
        </g>
        <ellipse cx="800" cy="872" rx="640" ry="120" fill={ref("glow")} opacity={p.lights * 0.9} />
        <path d="M760 790V952M840 790V952" stroke={mix(p.poolDeep, "#0b1638", 0.3)} strokeWidth="6" opacity="0.35" />
      </g>
      <path d="M360 790H1240L1400 952H200Z" fill="none" stroke={white} strokeWidth="12" strokeLinejoin="round" />
      <path d="M430 790v-22a12 12 0 0 1 24 0v22M470 790v-22a12 12 0 0 1 24 0v22" fill="none" stroke={white} strokeWidth="5" />
      <path d="M1200 790l10 -14h120l-6 14z" fill={white} />
      <rect x="1290" y="776" width="40" height="22" fill={ink} opacity="0.6" />

      {FRONT_PALMS.map((pp, i) => (
        <PalmTree key={i} p={pp} i={i} fill={p.palm} ring={mix(p.palm, "#000000", 0.4)} />
      ))}
      {/* the poster's own grain: a dot screen in the shadows */}
      <rect x="0" y="0" width="1600" height="1000" fill={ref("dots")} opacity={0.04 + p.lights * 0.04} />
    </svg>
  )
}

/* ---------------- the dial ---------------- */

function Dial({
  hour,
  setHour,
  moments,
  clock,
  compact,
  uid,
}: {
  hour: number
  setHour: (h: number) => void
  moments: CplMoment[]
  clock: "12h" | "24h"
  compact?: boolean
  uid: string
}) {
  const track = React.useRef(null as HTMLDivElement | null)
  const drag = React.useRef(false)
  const stops = React.useMemo(() => {
    const out: string[] = []
    for (let h = 0; h <= 24; h += 1) out.push(samplePalette(h).skyMid + " " + ((h / 24) * 100).toFixed(2) + "%")
    return "linear-gradient(90deg," + out.join(",") + ")"
  }, [])
  const fromX = (x: number) => {
    const el = track.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const h = clamp((x - r.left) / r.width, 0, 0.9999) * 24
    setHour(Math.round(h * 12) / 12)
  }
  const sun = sunPosition(hour)
  const label = momentAt(moments, hour)
  const time = formatHour(hour, clock)
  return (
    <div className={"cpl-dial" + (compact ? " cpl-dial-compact" : "")}>
      <div className="cpl-dial-read" aria-hidden="true">
        <span className="cpl-dial-time">{time}</span>
        <span className="cpl-dial-name">{label}</span>
      </div>
      <div className="cpl-dial-main">
        <div
          ref={track}
          className="cpl-track"
          style={{ backgroundImage: stops }}
          role="slider"
          tabIndex={0}
          aria-label="Time of day"
          aria-valuemin={0}
          aria-valuemax={24}
          aria-valuenow={Math.round(hour * 100) / 100}
          aria-valuetext={time + ", " + label}
          id={uid + "dial"}
          onPointerDown={(e) => {
            drag.current = true
            e.currentTarget.setPointerCapture(e.pointerId)
            fromX(e.clientX)
          }}
          onPointerMove={(e) => {
            if (drag.current) fromX(e.clientX)
          }}
          onPointerUp={() => (drag.current = false)}
          onPointerCancel={() => (drag.current = false)}
          onKeyDown={(e) => {
            const n = dialKey(hour, e.key)
            if (n == null) return
            e.preventDefault()
            setHour(n)
          }}
        >
          <span className="cpl-ticks" aria-hidden="true">
            {[6, 12, 18].map((h) => (
              <i key={h} style={{ left: (h / 24) * 100 + "%" }} />
            ))}
          </span>
          <span className={"cpl-knob" + (sun.up ? "" : " cpl-knob-moon")} style={{ left: (wrapHour(hour) / 24) * 100 + "%" }} aria-hidden="true">
            <svg viewBox="-12 -12 24 24" width="22" height="22">
              {sun.up ? (
                <g>
                  <circle r="6" fill="currentColor" />
                  {Array.from({ length: 8 }, (_, k) => (
                    <path key={k} d="M0 -8.5V-11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" transform={"rotate(" + k * 45 + ")"} />
                  ))}
                </g>
              ) : (
                <path d="M3 -8A8.5 8.5 0 1 0 8 4A7 7 0 0 1 3 -8Z" fill="currentColor" />
              )}
            </svg>
          </span>
        </div>
        {!compact && (
          <div className="cpl-moments" role="group" aria-label="Jump to a moment">
            {moments.map((m) => (
              <button
                key={m.label}
                type="button"
                className={"cpl-chip" + (momentAt(moments, hour) === m.label ? " cpl-chip-on" : "")}
                aria-pressed={momentAt(moments, hour) === m.label}
                onClick={() => setHour(m.hour)}
              >
                {m.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/* ---------------- small drawn marks ---------------- */

function Martini() {
  return (
    <svg className="cpl-martini" viewBox="0 0 48 56" width="40" height="46" aria-hidden="true">
      <path d="M4 6H44L24 30Z" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round" />
      <path d="M10 13H38" stroke="currentColor" strokeWidth="2" />
      <path d="M24 30V50M14 52H34" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M30 2L20 22" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="21" cy="19" r="4.2" fill="var(--cpl-olive)" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  )
}

function Arrow() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" className="cpl-arrow">
      <path d="M2 8H13M9 4L13 8L9 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/** The motel key fob beside the booking form: it shows the room you picked and swings when you change it. */
function KeyFob({ number, color, brand, held }: { number: string; color: string; brand: string; held: boolean }) {
  const text = contrast("#ffffff", color) >= 3 ? "#ffffff" : "#191d3a"
  return (
    <svg className="cpl-fob" viewBox="0 0 200 330" width="132" height="218" aria-hidden="true">
      <path d="M100 40v34" stroke="#8b93a8" strokeWidth="5" />
      <circle cx="100" cy="30" r="22" fill="none" stroke="#a7afc2" strokeWidth="6" />
      <path d="M118 46l26 34h10l4 6-6 4-4-4-6 6-6-6-4 4-6-6-18-24" fill="#c9cfdc" stroke="#6d7590" strokeWidth="2" strokeLinejoin="round" />
      <path d="M100 86L178 196L100 316L22 196Z" fill={color} stroke={color} strokeWidth="26" strokeLinejoin="round" />
      <path d="M100 98L164 196L100 300L36 196Z" fill="none" stroke={text} strokeOpacity="0.55" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="100" cy="106" r="9" fill="var(--cpl-paper)" stroke={text} strokeOpacity="0.5" strokeWidth="2" />
      <text x="100" y="160" textAnchor="middle" fill={text} fontSize="13" fontWeight="800" letterSpacing="1.5" style={{ fontFamily: "var(--cpl-display)" }}>
        {brand.toUpperCase().slice(0, 16)}
      </text>
      <text x="100" y="222" textAnchor="middle" fill={text} fontSize={number.length > 2 ? 46 : 58} fontWeight="800" style={{ fontFamily: "var(--cpl-display)" }}>
        {held ? "HELD" : number}
      </text>
      <text x="100" y="252" textAnchor="middle" fill={text} fontSize="9.5" fontWeight="700" letterSpacing="1">
        DROP IN ANY MAILBOX
      </text>
    </svg>
  )
}

const ARROW_TURN: { [k: string]: number } = { up: 0, "up-right": 45, right: 90, left: -90, "up-left": -45 }
function SignArrow({ dir }: { dir: string }) {
  return (
    <svg viewBox="-12 -12 24 24" width="26" height="26" aria-hidden="true" className="cpl-sign-arrow">
      <path d="M0 9V-8M-7 -1L0 -8L7 -1" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="square" transform={"rotate(" + (ARROW_TURN[dir] ?? 0) + ")"} />
    </svg>
  )
}

/* ---------------- rooms as postcards ---------------- */

const VIEWS: { [k: string]: string } = {
  pool: "330 430 900 600",
  palms: "0 260 780 520",
  mountain: "0 140 840 560",
  night: "640 360 960 640",
}

function Postcard({
  room,
  preset,
  uid,
  currency,
  clock,
  onBook,
  index,
}: {
  room: CplRoom
  preset: CplPreset
  uid: string
  currency: string
  clock: "12h" | "24h"
  onBook: (room: CplRoom) => void
  index: number
}) {
  const [back, setBack] = React.useState(false)
  const hour = room.hour ?? 12
  return (
    <li className={"cpl-card cpl-rv" + (back ? " cpl-flipped" : "")} style={{ ["--cpl-tilt" as string]: [-1.6, 1.1, -0.7, 1.5][index % 4] + "deg" }}>
      <div className="cpl-card-inner">
        <div className="cpl-face cpl-front" aria-hidden={back}>
          <div className="cpl-card-art">
            {room.image ? (
              <img src={room.image} alt={room.imageAlt || room.name} width={900} height={600} loading="lazy" />
            ) : (
              <PosterScene hour={hour} preset={preset} uid={uid + "pc" + index} view={VIEWS[room.view || "pool"]} align="xMidYMid slice" label={room.name + ", printed at " + formatHour(hour, clock)} />
            )}
            <span className="cpl-stamp" aria-hidden="true">
              <b>{formatMoney(room.rate, currency)}</b>
              <i>a night</i>
            </span>
          </div>
          <div className="cpl-card-cap">
            <h3>{room.name}</h3>
            <p>
              {room.size}, sleeps {room.sleeps}
            </p>
            <button type="button" className="cpl-turn" onClick={() => setBack(true)} aria-label={"Turn over the " + room.name + " postcard"} tabIndex={back ? -1 : 0}>
              Turn over
              <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
                <path d="M3 6a5 5 0 0 1 9-1.6M13 2v3h-3M13 10a5 5 0 0 1-9 1.6M3 14v-3h3" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>
        <div className="cpl-face cpl-back" aria-hidden={!back}>
          <div className="cpl-back-l">
            <h3>{room.name}</h3>
            <p>{room.text}</p>
            <ul>
              {room.features.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </div>
          <div className="cpl-back-r">
            <span className="cpl-postmark" aria-hidden="true">
              <span>{formatMoney(room.rate, currency)}</span>
            </span>
            <dl>
              <div>
                <dt>Size</dt>
                <dd>{room.size}</dd>
              </div>
              <div>
                <dt>Sleeps</dt>
                <dd>{room.sleeps}</dd>
              </div>
              <div>
                <dt>Beds</dt>
                <dd>{room.bed}</dd>
              </div>
            </dl>
          </div>
          <div className="cpl-back-act">
            <button type="button" className="cpl-btn cpl-solid" onClick={() => onBook(room)} tabIndex={back ? 0 : -1}>
              Book this room
              <Arrow />
            </button>
            <button type="button" className="cpl-turn" onClick={() => setBack(false)} tabIndex={back ? 0 : -1}>
              Turn back
            </button>
          </div>
        </div>
      </div>
    </li>
  )
}

/* ---------------- the page ---------------- */

export default function PalomaHotelLanding({
  brand = "Hotel Paloma",
  wordmark = "Paloma",
  presents = "A desert hotel in Palm Springs since 1958",
  place = ["Palm Springs", "California"],
  stamp = "Est. 1958",
  memo = { text: "Hotel Paloma is now booking winter 2027. Book direct and the fourth night is on us.", link: "See dates", href: "#book" },
  links = DEFAULT_LINKS,
  hero = {},
  hour: hourProp,
  onHourChange,
  moments = DEFAULT_MOMENTS,
  clock = "12h",
  currency = "$",
  booking = {},
  onSearch,
  onBook,
  rooms = {},
  programme = {},
  facts = DEFAULT_FACTS,
  guestbook = {},
  visit = DEFAULT_VISIT,
  newsletter = {},
  onSubscribe,
  footer = {},
  preset: presetName = "desert",
  colors,
  darkColors,
  heroImage,
  heroImageAlt,
  theme = "system",
  height = "100svh",
  className,
}: PalomaHotelLandingProps) {
  const uid = "cpl" + React.useId().replace(/[^a-zA-Z0-9]/g, "")
  const preset = PRESETS[presetName] || PRESETS.desert
  const [dark, setDark] = useTheme(theme)
  const reduced = useReduced()
  const root = React.useRef(null as HTMLDivElement | null)
  useReveal(root, reduced)

  const [hour, setHourState] = React.useState(hourProp ?? (theme === "dark" ? 21.75 : 17.5))
  const touched = React.useRef(hourProp != null)
  React.useEffect(() => {
    if (!touched.current) setHourState(dark ? 21.75 : 17.5)
  }, [dark])
  React.useEffect(() => {
    if (hourProp != null) setHourState(hourProp)
  }, [hourProp])
  const setHour = React.useCallback(
    (h: number) => {
      touched.current = true
      const v = wrapHour(h)
      setHourState(v)
      if (onHourChange) onHourChange(v)
    },
    [onHourChange],
  )

  const pal = samplePalette(hour)
  const tokens = resolveColors(preset, dark, dark ? darkColors : colors)
  const roomList = (rooms && rooms.items) || DEFAULT_ROOMS
  const events = (programme && programme.items) || DEFAULT_PROGRAMME
  const quotes = (guestbook && guestbook.items) || DEFAULT_QUOTES
  const h = {
    title: hero.title ?? "Thirty-two rooms around one long pool, under the mountains.",
    text: hero.text ?? "Clay courts, a martini hour that runs on desert time, and a pool lit until half past midnight. Open all year.",
    cta: hero.cta ?? "Book a room",
    secondary: hero.secondary ?? "See the rooms",
  }

  const scrollTo = (href: string) => {
    if (!href.startsWith("#")) return false
    const el = root.current && root.current.querySelector('[data-sec="' + href.slice(1) + '"]')
    if (!el) return false
    ;(el as HTMLElement).scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" })
    return true
  }
  const onLink = (e: React.MouseEvent, href: string) => {
    if (scrollTo(href)) e.preventDefault()
  }

  /* booking */
  const [checkIn, setCheckIn] = React.useState("")
  const [checkOut, setCheckOut] = React.useState("")
  const [today, setToday] = React.useState("")
  const [guests, setGuests] = React.useState(2)
  const [roomId, setRoomId] = React.useState(roomList[0] ? roomList[0].id : "")
  const [result, setResult] = React.useState(null as null | { q: CplBookingQuery; left: number; total: number; alt?: CplRoom })
  const [error, setError] = React.useState("")
  const [held, setHeld] = React.useState(false)
  React.useEffect(() => {
    const now = Math.floor((Date.now() - new Date().getTimezoneOffset() * 6e4) / 864e5)
    setToday(isoDay(now))
    setCheckIn(isoDay(now + 21))
    setCheckOut(isoDay(now + 24))
  }, [])
  const room = roomList.find((r) => r.id === roomId) || roomList[0]
  const maxGuests = (booking && booking.maxGuests) || 6
  const search = (e: React.FormEvent) => {
    e.preventDefault()
    setHeld(false)
    setResult(null)
    const nights = nightsBetween(checkIn, checkOut)
    if (!checkIn || !checkOut) return setError("Pick both dates to see prices.")
    if (nights < 1) return setError("Check-out has to be at least one night after check-in.")
    if (nights > 28) return setError("Stays are up to 28 nights. Call the front desk for longer.")
    if (!room) return setError("Pick a room.")
    if (guests > room.sleeps) {
      const fit = roomList.find((r) => r.sleeps >= guests)
      return setError("The " + room.name + " sleeps " + room.sleeps + "." + (fit ? " The " + fit.name + " sleeps " + fit.sleeps + "." : ""))
    }
    setError("")
    const q: CplBookingQuery = { room, checkIn, checkOut, nights, guests }
    let left = roomsLeft(room.id, checkIn, nights)
    let total = room.rate * nights
    if (onSearch) {
      const res = onSearch(q)
      if (res === false) return
      if (res && typeof res === "object") {
        if (typeof res.left === "number") left = res.left
        if (typeof res.total === "number") total = res.total
      }
    }
    const alt = left === 0 ? roomList.find((r) => r.id !== room.id && r.sleeps >= guests && roomsLeft(r.id, checkIn, nights) > 0) : undefined
    setResult({ q, left, total, alt })
  }
  const bookRoom = (r: CplRoom) => {
    setRoomId(r.id)
    setResult(null)
    setHeld(false)
    if (guests > r.sleeps) setGuests(r.sleeps)
    scrollTo("#book")
    setTimeout(() => {
      const el = root.current && (root.current.querySelector("#" + uid + "in") as HTMLElement | null)
      if (el) el.focus({ preventScroll: true })
    }, reduced ? 0 : 500)
  }

  /* newsletter */
  const [email, setEmail] = React.useState("")
  const [sub, setSub] = React.useState("idle" as "idle" | "bad" | "ok")

  /* pill nav visibility and the phone menu */
  const [pill, setPill] = React.useState(false)
  const [menu, setMenu] = React.useState(false)
  const heroRef = React.useRef(null as HTMLElement | null)
  React.useEffect(() => {
    const el = heroRef.current
    if (!el || typeof IntersectionObserver === "undefined") return
    // The pill docks once most of the hero has scrolled away, and leaves when it comes back.
    const io = new IntersectionObserver((es) => setPill(es[0].intersectionRatio < 0.3 && es[0].boundingClientRect.top < 0), { threshold: [0, 0.15, 0.3, 0.5] })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  React.useEffect(() => {
    if (!menu) return
    const k = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenu(false)
    }
    addEventListener("keydown", k)
    return () => removeEventListener("keydown", k)
  }, [menu])

  const now = eventAt(events, hour)
  const initial = (wordmark.trim()[0] || brand.trim()[0] || "P").toUpperCase()
  const style = {
    "--cpl-h": height,
    "--cpl-paper": tokens.paper,
    "--cpl-card": tokens.card,
    "--cpl-ink": tokens.ink,
    "--cpl-muted": tokens.muted,
    "--cpl-pool": tokens.pool,
    "--cpl-sun": tokens.sun,
    "--cpl-coral": tokens.coral,
    "--cpl-night": tokens.night,
    "--cpl-sky": pal.skyMid,
    "--cpl-sky-low": pal.skyLow,
    "--cpl-sky-top": pal.skyTop,
  } as React.CSSProperties
  const onPool = contrast("#ffffff", tokens.pool) >= 4.5 ? "#ffffff" : tokens.ink

  return (
    <div ref={root} className={"cpl-root" + (className ? " " + className : "")} data-theme={dark ? "dark" : "light"} style={{ ...style, ["--cpl-on-pool" as string]: onPool }}>
      <style>{CPL_CSS}</style>

      {/* memo strip */}
      {memo && (
        <p className="cpl-memo">
          <span>{memo.text}</span>
          {memo.link && (
            <a href={memo.href || "#book"} onClick={(e) => onLink(e, memo.href || "#book")}>
              {memo.link}
            </a>
          )}
        </p>
      )}

      <header className="cpl-head">
        <a className="cpl-logo" href="#top" onClick={(e) => onLink(e, "#top")} aria-label={brand + ", back to top"}>
          <span className="cpl-logo-txt">
            {brand.split(" ").map((w, i) => (
              <span key={i}>{w}</span>
            ))}
          </span>
          {stamp && <span className="cpl-oval">{stamp}</span>}
        </a>
        <nav className="cpl-headnav" aria-label="Main">
          {links.map((l) => (
            <a key={l.href} href={l.href} onClick={(e) => onLink(e, l.href)} className="cpl-ulink">
              <span>{l.label}</span>
            </a>
          ))}
        </nav>
        <div className="cpl-head-r">
          <span className="cpl-place">
            <span>{place[0]}</span>
            <span>{place[1]}</span>
          </span>
          <Martini />
          <button
            type="button"
            className="cpl-theme"
            onClick={() => {
              const next = !dark
              setDark(next)
              setHour(next ? 21.75 : 12.5)
            }}
            aria-label={dark ? "Switch to the day page" : "Switch to the night page"}
          >
            <svg viewBox="-12 -12 24 24" width="18" height="18" aria-hidden="true">
              {dark ? (
                <g>
                  <circle r="5" fill="currentColor" />
                  {Array.from({ length: 8 }, (_, k) => (
                    <path key={k} d="M0 -7.5V-10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" transform={"rotate(" + k * 45 + ")"} />
                  ))}
                </g>
              ) : (
                <path d="M3 -8A8.5 8.5 0 1 0 8 4A7 7 0 0 1 3 -8Z" fill="currentColor" />
              )}
            </svg>
          </button>
        </div>
      </header>

      {/* hero */}
      <section ref={heroRef} className="cpl-hero" data-sec="top" aria-labelledby={uid + "h1"}>
        <p className="cpl-presents">{presents}</p>
        <Wordmark text={wordmark} pal={pal} uid={uid} rim={dark ? "#565aa6" : "#100c26"} />
        <div className="cpl-frame">
          <div className="cpl-poster">
            {heroImage ? (
              <>
                <img className="cpl-hero-img" src={heroImage} alt={heroImageAlt || brand} width={1600} height={1000} />
                <span className="cpl-tint" style={{ background: "linear-gradient(180deg," + pal.skyTop + "," + pal.skyLow + ")", opacity: 0.18 + pal.lights * 0.4 }} aria-hidden="true" />
              </>
            ) : (
              <PosterScene hour={hour} preset={preset} uid={uid + "hero"} view="-200 190 2000 810" align="xMidYMid slice" label={brand + " at " + formatHour(hour, clock) + ": the pool, the palms and the mountains"} className="cpl-live" />
            )}
          </div>
          <div className="cpl-cap">
            <h1 id={uid + "h1"}>{h.title}</h1>
            <p>{h.text}</p>
            <div className="cpl-cap-act">
              <a className="cpl-btn cpl-solid" href="#book" onClick={(e) => onLink(e, "#book")}>
                {h.cta}
                <Arrow />
              </a>
              <a className="cpl-btn cpl-ghost" href="#rooms" onClick={(e) => onLink(e, "#rooms")}>
                {h.secondary}
              </a>
            </div>
          </div>
          <div className="cpl-dial-wrap">
            <Dial hour={hour} setHour={setHour} moments={moments} clock={clock} uid={uid} />
          </div>
        </div>
      </section>

      {/* booking */}
      {booking && (
        <section className="cpl-book cpl-sec" data-sec="book" aria-labelledby={uid + "bk"}>
          <div className="cpl-book-l cpl-rv">
            <h2 id={uid + "bk"}>{booking.title ?? "Book direct, pay at the desk."}</h2>
            <p>{booking.text ?? "Free cancellation up to seven days before you arrive. Rates include the airport shuttle and bikes."}</p>
          </div>
          <div className="cpl-book-r cpl-rv">
            {room && (
              <div className="cpl-fob-wrap" key={room.id + (held ? "-held" : "")}>
                <KeyFob number={room.number || String(roomList.indexOf(room) + 1)} color={preset.doors[Math.max(0, roomList.indexOf(room)) % preset.doors.length]} brand={brand} held={held} />
              </div>
            )}
          <form className="cpl-form" onSubmit={search} noValidate aria-label="Check availability">
            <p className="cpl-form-head" aria-hidden="true">
              <span>Registration card</span>
              <span>{brand}</span>
            </p>
            <label className="cpl-field cpl-field-l">
              <span>Check in</span>
              <input
                id={uid + "in"}
                type="date"
                value={checkIn}
                min={today || undefined}
                onChange={(e) => {
                  setCheckIn(e.target.value)
                  setResult(null)
                  if (nightsBetween(e.target.value, checkOut) < 1) setCheckOut(isoDay(dayNumber(e.target.value) + 2))
                }}
              />
            </label>
            <label className="cpl-field">
              <span>Check out</span>
              <input type="date" value={checkOut} min={checkIn || today || undefined} onChange={(e) => (setCheckOut(e.target.value), setResult(null))} />
            </label>
            <div className="cpl-field cpl-field-l">
              <span id={uid + "gl"}>Guests</span>
              <div className="cpl-stepper" role="group" aria-labelledby={uid + "gl"}>
                <button type="button" onClick={() => (setGuests(Math.max(1, guests - 1)), setResult(null))} aria-label="One guest fewer" disabled={guests <= 1}>
                  −
                </button>
                <output aria-live="polite">{guests}</output>
                <button type="button" onClick={() => (setGuests(Math.min(maxGuests, guests + 1)), setResult(null))} aria-label="One guest more" disabled={guests >= maxGuests}>
                  +
                </button>
              </div>
            </div>
            <label className="cpl-field cpl-field-room">
              <span>Room</span>
              <select value={roomId} onChange={(e) => (setRoomId(e.target.value), setResult(null))}>
                {roomList.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}, from {formatMoney(r.rate, currency)}
                  </option>
                ))}
              </select>
            </label>
            <div className="cpl-form-foot">
              <button type="submit" className="cpl-btn cpl-solid cpl-go">
                Check availability
                <Arrow />
              </button>
              <span>No card needed to hold a room.</span>
            </div>
          </form>
          <div className="cpl-result" aria-live="polite">
            {error && <p className="cpl-err">{error}</p>}
            {result && !held && (
              <div className={"cpl-res" + (result.left === 0 ? " cpl-res-out" : "")}>
                {result.left === 0 ? (
                  <p>
                    <b>The {result.q.room.name} is sold out on those dates.</b>{" "}
                    {result.alt ? "The " + result.alt.name + " is free from " + formatMoney(result.alt.rate, currency) + " a night." : "Try moving your dates by a day or two."}
                  </p>
                ) : (
                  <p>
                    <b>
                      {result.q.nights} {result.q.nights === 1 ? "night" : "nights"} in the {result.q.room.name}: {formatMoney(result.total, currency)}
                    </b>{" "}
                    before tax, for {result.q.guests} {result.q.guests === 1 ? "guest" : "guests"}. {result.left === 1 ? "Last room at this rate." : result.left + " left at this rate."}
                  </p>
                )}
                {result.left === 0 && result.alt ? (
                  <button type="button" className="cpl-btn cpl-ghost" onClick={() => (setRoomId(result.alt!.id), setResult(null))}>
                    Switch to the {result.alt.name}
                  </button>
                ) : result.left > 0 ? (
                  <button
                    type="button"
                    className="cpl-btn cpl-solid"
                    onClick={() => {
                      setHeld(true)
                      if (onBook) onBook(result.q)
                    }}
                  >
                    Hold this room
                    <Arrow />
                  </button>
                ) : null}
              </div>
            )}
            {held && result && (
              <div className="cpl-res cpl-res-held">
                <p>
                  <b>Held for 20 minutes.</b> The {result.q.room.name} is yours from {result.q.checkIn} to {result.q.checkOut}. Finish with your details on the next step.
                </p>
              </div>
            )}
          </div>
          </div>
        </section>
      )}

      {/* rooms */}
      {rooms && (
        <section className="cpl-rooms cpl-sec" data-sec="rooms" aria-labelledby={uid + "rm"}>
          <div className="cpl-sec-head cpl-rv">
            <h2 id={uid + "rm"}>{rooms.title ?? "Four ways to stay."}</h2>
            <p>{rooms.text ?? "Every room opens onto the deck or the garden. Turn a postcard over for the details."}</p>
          </div>
          <ul className="cpl-cards">
            {roomList.map((r, i) => (
              <Postcard key={r.id} room={r} preset={preset} uid={uid} currency={currency} clock={clock} onBook={bookRoom} index={i} />
            ))}
          </ul>
        </section>
      )}

      {/* the day */}
      {programme && (
        <section className="cpl-day cpl-sec" data-sec="day" aria-labelledby={uid + "dy"}>
          <div className="cpl-day-l">
            <div className="cpl-day-sticky">
              <h2 id={uid + "dy"} className="cpl-rv">
                {programme.title ?? "The day at the hotel."}
              </h2>
              <p className="cpl-rv">{programme.text ?? "Move the sun and see what is on. Every hour has its place, and most of them have a drink."}</p>
              <div className="cpl-window">
                <PosterScene hour={hour} preset={preset} uid={uid + "win"} view="300 300 1000 700" align="xMidYMid slice" />
                <span className="cpl-window-time" aria-hidden="true">
                  {formatHour(hour, clock)}
                </span>
              </div>
              <Dial hour={hour} setHour={setHour} moments={moments} clock={clock} compact uid={uid + "d2"} />
            </div>
          </div>
          <ol className="cpl-events">
            {events.map((ev, i) => {
              const on = i === now.index
              return (
                <li key={ev.title + i} className={"cpl-ev" + (on ? " cpl-ev-on" : "")}>
                  <button type="button" onClick={() => setHour(ev.hour + 0.25)} aria-current={on && now.now ? "time" : undefined}>
                    <span className="cpl-ev-time">
                      {formatHour(ev.hour, clock)}
                      {on && <em>{now.now ? "On now" : "Up next"}</em>}
                    </span>
                    <span className="cpl-ev-body">
                      <strong>{ev.title}</strong>
                      <span>{ev.text}</span>
                    </span>
                    <span className="cpl-ev-place">{ev.place}</span>
                  </button>
                </li>
              )
            })}
          </ol>
        </section>
      )}

      {/* facts on pool tiles */}
      {facts && facts.length > 0 && (
        <section className="cpl-tiles" aria-label="The hotel in numbers">
          <svg className="cpl-lane" viewBox="0 0 1600 60" preserveAspectRatio="none" aria-hidden="true">
            <path d="M0 30H1540M1540 6V54" stroke="currentColor" strokeWidth="14" fill="none" />
          </svg>
          <dl className="cpl-facts">
            {facts.map((f) => (
              <div key={f.label} className="cpl-fact cpl-rv">
                <dt>{f.value}</dt>
                <dd>{f.label}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {/* guestbook */}
      {guestbook && quotes.length > 0 && (
        <section className="cpl-guest" data-sec="guestbook" aria-labelledby={uid + "gb"}>
          <svg className="cpl-awning" width="100%" height="64" aria-hidden="true">
            <defs>
              <pattern id={uid + "aw"} width="96" height="64" patternUnits="userSpaceOnUse">
                <rect width="48" height="40" fill={tokens.coral} />
                <rect x="48" width="48" height="40" fill="#fff6f2" />
                <path d="M0 40a24 18 0 0 0 48 0Z" fill={tokens.coral} />
                <path d="M48 40a24 18 0 0 0 48 0Z" fill="#fff6f2" />
              </pattern>
            </defs>
            <rect width="100%" height="64" fill={"url(#" + uid + "aw)"} />
          </svg>
          <div className="cpl-sec cpl-guest-in">
            <h2 id={uid + "gb"} className="cpl-rv">
              {guestbook.title ?? "From the guestbook."}
            </h2>
            <div className="cpl-quotes">
              {quotes.map((q, i) => (
                <figure key={i} className={"cpl-quote cpl-rv" + (i === 0 ? " cpl-quote-big" : "")}>
                  <div className="cpl-letter">
                    <span className="cpl-pm" aria-hidden="true">
                      <svg viewBox="0 0 150 80" width="150" height="80">
                        <circle cx="40" cy="40" r="34" fill="none" stroke="currentColor" strokeWidth="2.5" />
                        <circle cx="40" cy="40" r="26" fill="none" stroke="currentColor" strokeWidth="1.2" />
                        <path d="M80 22q9 -6 18 0t18 0t18 0t16 0M80 34q9 -6 18 0t18 0t18 0t16 0M80 46q9 -6 18 0t18 0t18 0t16 0M80 58q9 -6 18 0t18 0t18 0t16 0" fill="none" stroke="currentColor" strokeWidth="2.2" />
                        <text x="40" y="36" textAnchor="middle" fontSize="8" fontWeight="800" fill="currentColor" textLength="40" lengthAdjust="spacingAndGlyphs">
                          {place[0].toUpperCase().slice(0, 13)}
                        </text>
                        <text x="40" y="50" textAnchor="middle" fontSize="9" fontWeight="700" fill="currentColor">
                          {postDate(q).slice(0, 9)}
                        </text>
                      </svg>
                    </span>
                    {i === 0 && (
                      <span className="cpl-lstamp" aria-hidden="true">
                        <PosterScene hour={21.9} preset={preset} uid={uid + "st"} view="420 560 760 520" align="xMidYMid slice" />
                      </span>
                    )}
                    <blockquote>
                      <p>“{q.quote}”</p>
                    </blockquote>
                    <figcaption>
                      <b>{q.name}</b>
                      <span>{q.stay}</span>
                    </figcaption>
                  </div>
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* getting here + newsletter */}
      {(visit || newsletter) && (
        <section className="cpl-visit cpl-sec" data-sec="visit" aria-labelledby={uid + "vs"}>
          {visit && (
            <>
              <div className="cpl-visit-l cpl-rv">
                <h2 id={uid + "vs"}>{visit.title}</h2>
                {visit.text && <p>{visit.text}</p>}
                <address>
                  {visit.address.map((l) => (
                    <span key={l}>{l}</span>
                  ))}
                  {visit.phone && <a href={"tel:" + visit.phone.replace(/[^\d+]/g, "")}>{visit.phone}</a>}
                  {visit.email && <a href={"mailto:" + visit.email}>{visit.email}</a>}
                </address>
                {visit.directionsHref !== "" && (
                  <a
                    className="cpl-btn cpl-ghost"
                    href={visit.directionsHref || "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(visit.address.join(", "))}
                    onClick={(e) => onLink(e, visit.directionsHref || "")}
                    target={visit.directionsHref && visit.directionsHref.startsWith("#") ? undefined : "_blank"}
                    rel="noreferrer"
                  >
                    Get directions
                    <Arrow />
                  </a>
                )}
              </div>
              {visit.drives && visit.drives.length > 0 && (
                <ul className="cpl-sign cpl-rv" aria-label="Drive times">
                  {visit.drives.map((d) => (
                    <li key={d.from}>
                      <SignArrow dir={d.dir || "up"} />
                      <span>{d.from}</span>
                      <b>{d.time}</b>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
          {newsletter && (
            <form
              className="cpl-news cpl-rv"
              noValidate
              onSubmit={(e) => {
                e.preventDefault()
                if (!isEmail(email)) return setSub("bad")
                if (onSubscribe && onSubscribe(email.trim()) === false) return
                setSub("ok")
              }}
            >
              <h3>{newsletter.title ?? "Postcards from Paloma."}</h3>
              <p>{newsletter.text ?? "One email a month: rate drops, the summer heat specials and what the bar is pouring."}</p>
              {sub === "ok" ? (
                <p className="cpl-ok" role="status">
                  You are on the list. The first postcard goes out on the first of the month.
                </p>
              ) : (
                <div className="cpl-news-row">
                  <label className="cpl-sr" htmlFor={uid + "em"}>
                    Email address
                  </label>
                  <input
                    id={uid + "em"}
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    aria-invalid={sub === "bad"}
                    aria-describedby={sub === "bad" ? uid + "eme" : undefined}
                    onChange={(e) => (setEmail(e.target.value), sub === "bad" && setSub("idle"))}
                  />
                  <button type="submit" className="cpl-btn cpl-solid">
                    {newsletter.button ?? "Send me postcards"}
                  </button>
                </div>
              )}
              {sub === "bad" && (
                <p className="cpl-err" id={uid + "eme"} role="alert">
                  That address is missing something. Check the part after the @.
                </p>
              )}
            </form>
          )}
        </section>
      )}

      {/* footer */}
      <footer className="cpl-foot">
        <div className="cpl-foot-band">
          <PosterScene hour={22.4} preset={preset} uid={uid + "ft"} view="200 560 1300 440" align="xMidYMid slice" />
        </div>
        <div className="cpl-foot-in">
          <div className="cpl-foot-brand">
            <Wordmark text={wordmark} pal={samplePalette(17.2)} uid={uid + "f"} className="cpl-wordmark-sm" rim="#565aa6" />
            <p>{footer.note ?? brand + ". A long pool, a short drive."}</p>
          </div>
          <nav aria-label="Footer">
            <ul>
              {(footer.links || [...links, { label: "Careers", href: "#top" }, { label: "Press", href: "#top" }]).map((l) => (
                <li key={l.label}>
                  <a href={l.href} onClick={(e) => onLink(e, l.href)} className="cpl-ulink">
                    <span>{l.label}</span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <p className="cpl-small">
            © {new Date().getFullYear()} {brand}
          </p>
        </div>
      </footer>

      {/* sticky pill nav */}
      <div className={"cpl-pill-dock" + (pill ? " cpl-pill-on" : "")}>
        <nav className="cpl-pill" aria-label="Quick">
          <a className="cpl-pill-mark" href="#top" onClick={(e) => onLink(e, "#top")} aria-label={brand + ", back to top"} tabIndex={pill ? 0 : -1}>
            <Monogram letter={initial} color="currentColor" size={18} />
          </a>
          <span className="cpl-pill-links">
            {links.map((l) => (
              <a key={l.href} href={l.href} onClick={(e) => onLink(e, l.href)} tabIndex={pill ? 0 : -1} className="cpl-ulink">
                <span>{l.label}</span>
              </a>
            ))}
          </span>
          <span className="cpl-pill-hour" aria-hidden="true">
            {formatHour(hour, clock)}
          </span>
          <button type="button" className="cpl-pill-menu" aria-expanded={menu} aria-controls={uid + "menu"} onClick={() => setMenu(!menu)} tabIndex={pill ? 0 : -1}>
            Menu
          </button>
          <a className="cpl-btn cpl-solid cpl-pill-cta" href="#book" onClick={(e) => onLink(e, "#book")} tabIndex={pill ? 0 : -1}>
            {h.cta}
          </a>
        </nav>
        {menu && (
          <ul className="cpl-menu" id={uid + "menu"}>
            {links.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  onClick={(e) => {
                    setMenu(false)
                    onLink(e, l.href)
                  }}
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

const CPL_CSS = `
.cpl-root{--cpl-display:"Futura","Futura PT","Avenir Next","Century Gothic","Inter Display","Helvetica Neue",ui-sans-serif,system-ui,sans-serif;--cpl-text:ui-sans-serif,system-ui,"Helvetica Neue",Arial,sans-serif;--cpl-type:"Courier Prime","Courier New",ui-monospace,monospace;--cpl-rule:color-mix(in srgb,var(--cpl-ink) 26%,transparent);--cpl-olive:#8fae3c;--cpl-ease:cubic-bezier(.23,1,.32,1);position:relative;min-height:var(--cpl-h);background:var(--cpl-paper);color:var(--cpl-ink);font-family:var(--cpl-text);font-size:16px;line-height:1.55;overflow:clip;-webkit-font-smoothing:antialiased;color-scheme:light}
.cpl-root[data-theme="dark"]{color-scheme:dark}
.cpl-root *,.cpl-root *::before,.cpl-root *::after{box-sizing:border-box}
.cpl-root :where(h1,h2,h3,p,ul,ol,dl,dd,figure,blockquote){margin:0;padding:0}
.cpl-root :where(ul,ol){list-style:none}
.cpl-root :where(button,input,select){font:inherit;color:inherit}
.cpl-root :where(a){color:inherit}
.cpl-root img,.cpl-root svg{max-width:none}
.cpl-root ::selection{background:var(--cpl-sun);color:#191d3a}
.cpl-root :focus-visible{outline:2.5px solid var(--cpl-ink);outline-offset:3px;border-radius:6px}
.cpl-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}

.cpl-memo{display:flex;flex-wrap:wrap;justify-content:center;gap:.25rem .9rem;padding:.6rem 1rem;border-bottom:1px solid var(--cpl-rule);font-family:var(--cpl-type);font-size:12.5px;line-height:1.35;letter-spacing:.04em;text-transform:uppercase;text-align:center}
.cpl-memo a{text-underline-offset:3px;text-decoration-thickness:1.5px;font-weight:700}
.cpl-memo a:hover{text-decoration-style:wavy}

.cpl-head{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:1rem;padding:1rem clamp(16px,3vw,40px) .2rem}
.cpl-logo{display:flex;align-items:center;gap:.8rem;text-decoration:none;justify-self:start}
.cpl-logo-txt{display:flex;flex-direction:column;font-family:var(--cpl-display);font-weight:800;text-transform:uppercase;letter-spacing:.02em;line-height:.92;font-size:15px}
.cpl-oval{display:inline-grid;place-items:center;padding:.3rem .7rem;border:1.5px solid currentColor;border-radius:50%;font-family:var(--cpl-type);font-size:10.5px;letter-spacing:.06em;text-transform:uppercase;transform:rotate(-6deg);transition:transform .35s var(--cpl-ease)}
.cpl-logo:hover .cpl-oval{transform:rotate(4deg) scale(1.06)}
.cpl-headnav{display:flex;gap:1.6rem;font-size:14px;font-weight:600}
.cpl-head-r{display:flex;align-items:center;gap:.9rem;justify-self:end}
.cpl-place{display:flex;flex-direction:column;text-align:right;font-family:var(--cpl-display);font-weight:800;text-transform:uppercase;font-size:12.5px;line-height:1.05;letter-spacing:.04em}
.cpl-martini{color:var(--cpl-ink);transform-origin:50% 95%;transition:transform .5s var(--cpl-ease)}
.cpl-head-r:hover .cpl-martini{transform:rotate(-12deg)}
.cpl-theme{display:grid;place-items:center;width:40px;height:40px;border-radius:50%;border:1.5px solid var(--cpl-ink);background:transparent;cursor:pointer;transition:transform .3s var(--cpl-ease),background-color .2s}
.cpl-theme:hover{transform:rotate(-24deg);background:var(--cpl-card)}
.cpl-theme:active{transform:scale(.94)}

.cpl-ulink{position:relative;text-decoration:none;display:inline-block;overflow:hidden;padding-bottom:2px}
.cpl-ulink span{display:inline-block}
.cpl-ulink::after{content:"";position:absolute;left:0;right:0;bottom:0;height:2px;background:currentColor;transform:scaleX(0);transform-origin:100% 50%;transition:transform .35s var(--cpl-ease)}
.cpl-ulink:hover::after,.cpl-ulink:focus-visible::after{transform:scaleX(1);transform-origin:0 50%}

.cpl-hero{position:relative;padding:.4rem clamp(16px,3vw,40px) clamp(28px,4vw,56px);min-height:calc(var(--cpl-h) - 96px);display:flex;flex-direction:column}
.cpl-presents{text-align:center;font-family:var(--cpl-display);font-weight:700;text-transform:uppercase;letter-spacing:.14em;font-size:clamp(11px,1.05vw,14px);margin:0 0 .5rem}
.cpl-wordmark{display:block;width:min(100%,1180px);height:auto;margin:0 auto;overflow:visible}
.cpl-hero>.cpl-wordmark{width:min(86%,1040px)}
.cpl-spark{transform-box:fill-box;transform-origin:50% 50%;animation:cpl-twinkle 4.2s var(--cpl-ease) infinite}
@keyframes cpl-twinkle{0%,62%,100%{transform:scale(0) rotate(0);opacity:0}72%{transform:scale(1) rotate(45deg);opacity:1}86%{transform:scale(.4) rotate(90deg);opacity:.6}}

.cpl-frame{position:relative;flex:1 0 auto;height:clamp(420px,calc(var(--cpl-h) - 378px),740px);margin:clamp(14px,1.6vw,22px) 0 46px;border:1.5px solid var(--cpl-ink);border-radius:34px;padding:10px}
.cpl-frame::before{content:"";position:absolute;inset:-9px;border:1.5px solid var(--cpl-ink);border-radius:42px;pointer-events:none;opacity:.45}
.cpl-poster{position:relative;width:100%;height:100%;border-radius:25px;overflow:hidden;background:var(--cpl-sky)}
.cpl-scene{display:block;width:100%;height:100%}
.cpl-hero-img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.cpl-tint{position:absolute;inset:0;mix-blend-mode:multiply;transition:opacity .4s}
.cpl-sway{transform-box:fill-box;transform-origin:50% 40%;animation:cpl-sway 7s ease-in-out infinite alternate}
@keyframes cpl-sway{from{rotate:-1.6deg}to{rotate:1.8deg}}
.cpl-caustic{animation:cpl-caustic 9s linear infinite}
@keyframes cpl-caustic{to{transform:translateX(-160px)}}

.cpl-cap{position:absolute;left:clamp(26px,3vw,48px);top:clamp(26px,3vw,48px);width:min(370px,34%);padding:1.15rem 1.2rem 1.2rem;background:var(--cpl-paper);border:1.5px solid var(--cpl-ink);border-radius:22px;box-shadow:6px 7px 0 var(--cpl-ink)}
.cpl-cap h1{font-family:var(--cpl-display);font-weight:800;font-size:clamp(1.3rem,1rem + .8vw,1.75rem);line-height:1.08;letter-spacing:-.02em;text-wrap:balance}
.cpl-cap p{margin-top:.7rem;color:var(--cpl-muted);font-size:15px;line-height:1.5}
.cpl-cap-act{display:flex;flex-wrap:wrap;gap:.6rem;margin-top:1rem}

.cpl-btn{position:relative;display:inline-flex;align-items:center;justify-content:center;gap:.55rem;min-height:46px;padding:0 1.25rem;border-radius:999px;font-weight:700;font-size:15px;text-decoration:none;cursor:pointer;border:1.5px solid var(--cpl-ink);transition:transform .25s var(--cpl-ease),box-shadow .25s var(--cpl-ease),background-color .2s,color .2s;white-space:nowrap}
.cpl-solid{background:var(--cpl-pool);color:var(--cpl-on-pool);box-shadow:3px 4px 0 var(--cpl-ink)}
.cpl-solid:hover{transform:translate(-2px,-2px);box-shadow:5px 6px 0 var(--cpl-ink)}
.cpl-solid:active{transform:translate(2px,3px);box-shadow:0 0 0 var(--cpl-ink)}
.cpl-ghost{background:transparent;color:var(--cpl-ink)}
.cpl-ghost:hover{background:var(--cpl-ink);color:var(--cpl-paper)}
.cpl-ghost:active{transform:scale(.97)}
.cpl-arrow{transition:transform .3s var(--cpl-ease)}
.cpl-btn:hover .cpl-arrow{transform:translateX(4px)}

.cpl-dial-wrap{position:absolute;left:50%;bottom:0;transform:translate(-50%,50%);width:min(780px,calc(100% - 64px))}
.cpl-dial{display:flex;align-items:center;gap:1.1rem;padding:.7rem 1.1rem .7rem 1.3rem;background:var(--cpl-paper);border:1.5px solid var(--cpl-ink);border-radius:999px;box-shadow:5px 6px 0 var(--cpl-ink)}
.cpl-dial-read{display:flex;flex-direction:column;min-width:7.4rem;line-height:1.1}
.cpl-dial-time{font-family:var(--cpl-type);font-weight:700;font-size:21px;font-variant-numeric:tabular-nums;letter-spacing:-.01em}
.cpl-dial-name{font-size:12.5px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--cpl-muted)}
.cpl-dial-main{flex:1;min-width:0;display:flex;flex-direction:column;gap:.55rem}
.cpl-track{position:relative;height:16px;border-radius:999px;border:1.5px solid var(--cpl-ink);cursor:pointer;touch-action:none;margin:0 11px}
.cpl-track:focus-visible{outline-offset:6px;border-radius:999px}
.cpl-ticks i{position:absolute;top:-5px;bottom:-5px;width:1.5px;background:var(--cpl-ink);opacity:.5}
.cpl-knob{position:absolute;top:50%;width:34px;height:34px;margin:-17px 0 0 -17px;display:grid;place-items:center;border-radius:50%;background:var(--cpl-sun);color:#3a1d05;border:1.5px solid var(--cpl-ink);box-shadow:2px 3px 0 var(--cpl-ink);transition:transform .2s var(--cpl-ease),background-color .3s}
.cpl-knob-moon{background:#1b2150;color:#fff1c8}
.cpl-track:hover .cpl-knob,.cpl-track:focus-visible .cpl-knob{transform:scale(1.12)}
.cpl-track:active .cpl-knob{transform:scale(.96)}
.cpl-moments{display:flex;gap:.35rem;flex-wrap:wrap}
.cpl-chip{border:1.5px solid var(--cpl-rule);background:transparent;border-radius:999px;padding:.28rem .7rem;font-size:12.5px;font-weight:700;cursor:pointer;min-height:30px;transition:background-color .2s,border-color .2s,transform .2s var(--cpl-ease)}
.cpl-chip:hover{border-color:var(--cpl-ink);transform:translateY(-1px)}
.cpl-chip-on{background:var(--cpl-ink);color:var(--cpl-paper);border-color:var(--cpl-ink)}
.cpl-dial-compact{border-radius:22px;box-shadow:none;padding:.8rem 1rem}

.cpl-sec{padding:clamp(56px,8vw,120px) clamp(16px,4vw,64px)}
.cpl-sec-head{display:grid;grid-template-columns:minmax(0,7fr) minmax(0,4fr);gap:2rem;align-items:end;margin-bottom:clamp(28px,4vw,56px)}
.cpl-root h2{font-family:var(--cpl-display);font-weight:800;font-size:clamp(2.1rem,1.2rem + 3.4vw,4.4rem);line-height:.98;letter-spacing:-.035em;text-wrap:balance}
.cpl-sec-head p{color:var(--cpl-muted);font-size:17px;max-width:36ch}

.cpl-book{padding-bottom:clamp(40px,6vw,80px)}
.cpl-book{display:grid;grid-template-columns:minmax(0,5fr) minmax(0,7fr);gap:clamp(28px,5vw,80px);align-items:start}
.cpl-book-l{display:flex;flex-direction:column;gap:1.1rem}
.cpl-book-l>p{color:var(--cpl-muted);font-size:17px;max-width:34ch}
.cpl-book-r{position:relative}
.cpl-fob-wrap{position:absolute;right:-30px;top:-74px;z-index:2;rotate:7deg;pointer-events:none}
.cpl-fob{transform-origin:50% 6%;animation:cpl-swing 1.6s var(--cpl-ease);filter:drop-shadow(4px 5px 0 var(--cpl-ink))}
@keyframes cpl-swing{0%{transform:rotate(16deg)}25%{transform:rotate(-9deg)}50%{transform:rotate(5deg)}75%{transform:rotate(-2deg)}100%{transform:rotate(0)}}
.cpl-form{display:grid;grid-template-columns:1fr 1fr;gap:0;background:var(--cpl-card);border:1.5px solid var(--cpl-ink);border-radius:24px;box-shadow:6px 7px 0 var(--cpl-ink);overflow:hidden}
.cpl-form-head{grid-column:1/-1;display:flex;justify-content:space-between;gap:1rem;padding:.65rem 7rem .65rem 1.2rem;background:var(--cpl-ink);color:var(--cpl-paper);font-family:var(--cpl-type);font-size:12.5px;font-weight:700;letter-spacing:.08em;text-transform:uppercase}
.cpl-form-foot{grid-column:1/-1;display:flex;flex-wrap:wrap;align-items:center;gap:.6rem 1.2rem;padding:1rem 1.2rem 1.15rem}
.cpl-form-foot span{font-size:14px;color:var(--cpl-muted)}
.cpl-field{display:flex;flex-direction:column;justify-content:center;gap:.25rem;padding:1rem 1.2rem;border-bottom:1.5px solid var(--cpl-rule);min-width:0}
.cpl-field-l{border-right:1.5px solid var(--cpl-rule)}
.cpl-field>span{font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.09em;color:var(--cpl-muted)}
.cpl-field input,.cpl-field select{border:0;border-bottom:1.5px dotted var(--cpl-ink);background:transparent;font-size:17px;font-weight:600;padding:.2rem 0;min-height:36px;width:100%;min-width:0;border-radius:0}
.cpl-field select{cursor:pointer}
.cpl-stepper{display:flex;align-items:center;gap:.6rem}
.cpl-stepper button{width:32px;height:32px;border-radius:50%;border:1.5px solid var(--cpl-ink);background:transparent;font-size:18px;line-height:1;cursor:pointer;transition:transform .2s var(--cpl-ease),background-color .2s}
.cpl-stepper button:hover:not(:disabled){background:var(--cpl-ink);color:var(--cpl-card)}
.cpl-stepper button:active:not(:disabled){transform:scale(.9)}
.cpl-stepper button:disabled{opacity:.35;cursor:not-allowed}
.cpl-stepper output{min-width:1.4ch;text-align:center;font-size:17px;font-weight:700;font-variant-numeric:tabular-nums}
.cpl-go{align-self:center}
.cpl-result{margin-top:1.1rem}
.cpl-res{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:.8rem 1.5rem;padding:1rem 1.2rem;border:1.5px dashed var(--cpl-ink);border-radius:20px;animation:cpl-pop .35s var(--cpl-ease)}
.cpl-res p{max-width:62ch}
.cpl-res-out{border-color:var(--cpl-coral)}
.cpl-res-held{border-style:solid;background:var(--cpl-card)}
.cpl-err{color:var(--cpl-coral);font-weight:700;filter:brightness(.8)}
.cpl-root[data-theme="dark"] .cpl-err{filter:none}
@keyframes cpl-pop{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}

.cpl-cards{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:clamp(16px,2vw,28px);align-items:start}
.cpl-card{perspective:1400px}
.cpl-card:nth-child(even){margin-top:clamp(0px,3vw,44px)}
.cpl-card-inner{position:relative;display:grid;transform:rotate(var(--cpl-tilt));transform-style:preserve-3d;transition:transform .7s var(--cpl-ease)}
.cpl-card:hover .cpl-card-inner{transform:rotate(0deg) translateY(-4px)}
.cpl-flipped .cpl-card-inner,.cpl-flipped:hover .cpl-card-inner{transform:rotate(0deg) rotateY(180deg)}
.cpl-face{grid-area:1/1;backface-visibility:hidden;-webkit-backface-visibility:hidden;background:#fffaf6;color:#191d3a;border-radius:10px;padding:10px;box-shadow:0 1px 0 rgba(25,29,58,.25),5px 7px 0 rgba(25,29,58,.9);display:flex;flex-direction:column}
.cpl-root[data-theme="dark"] .cpl-face{background:#f3ece8}
.cpl-back{transform:rotateY(180deg);display:grid;grid-template-columns:1fr auto;grid-template-rows:1fr auto;gap:.8rem 1rem;padding:1.1rem}
.cpl-card-art{position:relative;aspect-ratio:3/2;flex:1 0 auto;border-radius:4px;overflow:hidden;background:#cfd8e8}
.cpl-card-art img{width:100%;height:100%;object-fit:cover;display:block}
.cpl-stamp{position:absolute;right:10px;top:10px;display:flex;flex-direction:column;align-items:center;padding:.35rem .55rem .3rem;background:#fffaf6;color:#191d3a;border:2px dashed #191d3a;outline:4px solid #fffaf6;line-height:1;transform:rotate(4deg)}
.cpl-stamp b{font-family:var(--cpl-display);font-size:17px;font-weight:800}
.cpl-stamp i{font-style:normal;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;margin-top:2px}
.cpl-card-cap{display:grid;grid-template-columns:1fr auto;align-items:end;gap:.1rem .6rem;padding:.75rem .35rem .25rem}
.cpl-card-cap h3,.cpl-back h3{font-family:var(--cpl-display);font-weight:800;font-size:1.2rem;line-height:1.1;letter-spacing:-.01em}
.cpl-card-cap p{grid-column:1;font-size:13.5px;color:#4a4262}
.cpl-card-cap .cpl-turn{grid-column:2;grid-row:1/3}
.cpl-turn{display:inline-flex;align-items:center;gap:.35rem;min-height:36px;padding:0 .8rem;border-radius:999px;border:1.5px solid #191d3a;background:transparent;color:#191d3a;font-weight:700;font-size:13px;cursor:pointer;transition:background-color .2s,color .2s,transform .2s var(--cpl-ease)}
.cpl-turn svg{transition:transform .45s var(--cpl-ease)}
.cpl-turn:hover{background:#191d3a;color:#fffaf6}
.cpl-turn:hover svg{transform:rotate(180deg)}
.cpl-turn:active{transform:scale(.96)}
.cpl-back-l p{font-size:14px;margin-top:.5rem;color:#3c3552;line-height:1.45}
.cpl-back-l ul{margin-top:.6rem;display:grid;gap:.2rem;font-size:13.5px}
.cpl-back-l li::before{content:"";display:inline-block;width:7px;height:7px;border-radius:50%;background:var(--cpl-coral);margin-right:.5rem;vertical-align:.1em}
.cpl-back-r{border-left:1.5px dashed rgba(25,29,58,.4);padding-left:1rem;display:flex;flex-direction:column;align-items:flex-end;gap:.8rem}
.cpl-postmark{display:grid;place-items:center;width:62px;height:62px;border-radius:50%;border:2px solid var(--cpl-coral);color:var(--cpl-coral);font-family:var(--cpl-display);font-weight:800;font-size:14px;transform:rotate(-12deg);filter:brightness(.85)}
.cpl-back-r dl{display:grid;gap:.4rem;font-size:13px;text-align:right}
.cpl-back-r dt{font-size:10.5px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:#5a5270}
.cpl-back-r dd{font-weight:700;border-bottom:1px solid rgba(25,29,58,.3);padding-bottom:.15rem}
.cpl-back-act{grid-column:1/-1;display:flex;flex-wrap:wrap;gap:.5rem;align-items:center}
.cpl-back-act .cpl-solid{--cpl-ink:#191d3a;min-height:40px;font-size:14px}

.cpl-day{display:grid;grid-template-columns:minmax(0,5fr) minmax(0,7fr);gap:clamp(28px,5vw,80px);background:linear-gradient(180deg,var(--cpl-paper),color-mix(in srgb,var(--cpl-sky-low) 30%,var(--cpl-paper)));border-top:1.5px solid var(--cpl-rule);transition:background-color .4s}
.cpl-day-sticky{position:sticky;top:24px;display:flex;flex-direction:column;gap:1.1rem}
.cpl-day-sticky>p{color:var(--cpl-muted);font-size:17px;max-width:38ch}
.cpl-window{position:relative;aspect-ratio:10/7;border:1.5px solid var(--cpl-ink);border-radius:22px;overflow:hidden;box-shadow:6px 7px 0 var(--cpl-ink)}
.cpl-window-time{position:absolute;left:14px;top:12px;font-family:var(--cpl-type);font-weight:700;font-size:15px;padding:.25rem .6rem;border-radius:999px;background:var(--cpl-paper);border:1.5px solid var(--cpl-ink);font-variant-numeric:tabular-nums}
.cpl-events{display:flex;flex-direction:column;border-top:1.5px solid var(--cpl-ink);counter-reset:none}
.cpl-ev{border-bottom:1.5px solid var(--cpl-rule)}
.cpl-ev button{display:grid;grid-template-columns:7.2rem minmax(0,1fr) auto;gap:.4rem 1.4rem;align-items:baseline;width:100%;padding:1.2rem .4rem;border:0;background:transparent;text-align:left;cursor:pointer;border-radius:0;transition:background-color .25s,padding .35s var(--cpl-ease)}
.cpl-ev button:hover{background:color-mix(in srgb,var(--cpl-card) 70%,transparent)}
.cpl-ev-time{font-family:var(--cpl-type);font-weight:700;font-size:16px;font-variant-numeric:tabular-nums;display:flex;flex-direction:column;gap:.3rem}
.cpl-ev-time em{font-style:normal;font-family:var(--cpl-text);font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;background:var(--cpl-sun);color:#2a1702;border:1.5px solid var(--cpl-ink);padding:.12rem .45rem;border-radius:999px;width:max-content}
.cpl-ev-body{display:flex;flex-direction:column;gap:.3rem}
.cpl-ev-body strong{font-family:var(--cpl-display);font-weight:800;font-size:clamp(1.15rem,1rem + .6vw,1.55rem);line-height:1.15;letter-spacing:-.015em;transition:transform .35s var(--cpl-ease)}
.cpl-ev-body span{color:var(--cpl-muted);font-size:15px;max-width:52ch}
.cpl-ev-place{font-size:12.5px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--cpl-muted);text-align:right}
.cpl-ev-on button{background:var(--cpl-card);padding-left:1rem;box-shadow:inset 6px 0 0 var(--cpl-sun)}
.cpl-ev button:hover .cpl-ev-body strong{transform:translateX(4px)}

.cpl-tiles{position:relative;padding:clamp(56px,7vw,104px) clamp(16px,4vw,64px);background-color:var(--cpl-pool);background-image:linear-gradient(rgba(255,255,255,.2) 2px,transparent 2px),linear-gradient(90deg,rgba(255,255,255,.2) 2px,transparent 2px);background-size:30px 30px;color:#ffffff;overflow:hidden}
.cpl-lane{position:absolute;left:0;top:50%;width:100%;height:60px;margin-top:-30px;color:rgba(7,22,48,.38)}
.cpl-facts{position:relative;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:clamp(16px,2.5vw,40px)}
.cpl-fact{padding:1.2rem 1.1rem 1.3rem;background:color-mix(in srgb,var(--cpl-pool) 82%,#071630);border:1.5px solid rgba(255,255,255,.55);border-radius:20px}
.cpl-fact:nth-child(odd){transform:translateY(-14px)}
.cpl-fact dt{font-family:var(--cpl-display);font-weight:800;font-size:clamp(2.6rem,1.4rem + 3.6vw,4.8rem);line-height:.95;letter-spacing:-.04em;text-shadow:3px 4px 0 rgba(7,22,48,.55)}
.cpl-fact dd{margin-top:.7rem;font-size:15px;line-height:1.4;max-width:24ch}

.cpl-guest{position:relative}
.cpl-awning{display:block;filter:drop-shadow(0 6px 0 rgba(25,29,58,.18))}
.cpl-guest-in{padding-top:clamp(40px,6vw,88px)}
.cpl-quotes{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(0,1fr) minmax(0,1fr);gap:clamp(20px,2.6vw,40px);align-items:start;margin-top:clamp(28px,4vw,56px)}
.cpl-quote{padding:9px;border-radius:16px;border:1.5px solid var(--cpl-ink);background:repeating-linear-gradient(135deg,var(--cpl-coral) 0 14px,#fffaf6 14px 22px,var(--cpl-pool) 22px 36px,#fffaf6 36px 44px);box-shadow:6px 7px 0 var(--cpl-ink);transition:transform .45s var(--cpl-ease)}
.cpl-quote:nth-child(2){transform:rotate(1.2deg)}
.cpl-quote:nth-child(3){transform:rotate(-.8deg)}
.cpl-quote:hover{transform:rotate(0) translateY(-3px)}
.cpl-letter{position:relative;height:auto;min-height:100%;display:flex;flex-direction:column;justify-content:space-between;gap:1.2rem;padding:clamp(1.1rem,2vw,1.7rem);padding-top:clamp(4.4rem,6vw,5.2rem);background:#fffaf6;color:#191d3a;border-radius:9px}
.cpl-lstamp{position:absolute;right:22px;top:18px;width:96px;height:72px;padding:4px;background:#fffaf6;outline:2px dashed rgba(25,29,58,.45);outline-offset:-1px;transform:rotate(3deg);overflow:hidden}
.cpl-lstamp .cpl-scene{border-radius:2px}
.cpl-quote-big .cpl-pm{right:96px;top:40px}
.cpl-quote-big .cpl-letter{padding-top:clamp(6.2rem,8vw,7.2rem)}
.cpl-pm{position:absolute;right:14px;top:10px;z-index:1;color:var(--cpl-coral);opacity:.85;transform:rotate(-8deg);filter:brightness(.82)}
.cpl-quote:nth-child(2){margin-top:clamp(0px,4vw,60px)}
.cpl-quote:nth-child(3){margin-top:clamp(0px,2vw,24px)}
.cpl-quote p{font-family:var(--cpl-display);font-weight:700;font-size:clamp(1.15rem,1rem + .5vw,1.45rem);line-height:1.3;letter-spacing:-.01em;text-wrap:pretty}
.cpl-quote-big p{font-size:clamp(1.45rem,1.1rem + 1.1vw,2.1rem);line-height:1.12;letter-spacing:-.025em;text-indent:-.4em}
.cpl-quote figcaption{display:flex;flex-direction:column;font-size:14px}
.cpl-quote figcaption span{color:#4a4262}

.cpl-visit{display:grid;grid-template-columns:minmax(0,6fr) minmax(0,5fr);gap:clamp(28px,5vw,80px) clamp(28px,5vw,80px);border-top:1.5px solid var(--cpl-rule)}
.cpl-visit-l{display:flex;flex-direction:column;gap:1.1rem;align-items:flex-start}
.cpl-visit-l>p{color:var(--cpl-muted);font-size:17px;max-width:44ch}
.cpl-visit address{font-style:normal;display:flex;flex-direction:column;font-size:16px;line-height:1.5}
.cpl-visit address a{text-underline-offset:3px;width:max-content}
.cpl-sign{align-self:start;background:#1d5f43;color:#ffffff;border-radius:18px;padding:.6rem;box-shadow:0 0 0 3px #ffffff inset,6px 7px 0 var(--cpl-ink);border:1.5px solid var(--cpl-ink)}
.cpl-sign li{display:flex;gap:.9rem;align-items:center;padding:.85rem 1rem;border-bottom:2px solid rgba(255,255,255,.35);font-family:var(--cpl-display);font-weight:700;font-size:clamp(1rem,.9rem + .4vw,1.25rem)}
.cpl-sign li:last-child{border-bottom:0}
.cpl-sign li span{flex:1}
.cpl-sign b{font-variant-numeric:tabular-nums;white-space:nowrap}
.cpl-sign-arrow{flex:none}
.cpl-news{grid-column:1/-1;display:grid;grid-template-columns:minmax(0,5fr) minmax(0,6fr);gap:.4rem clamp(28px,5vw,80px);align-items:center;padding:clamp(22px,3vw,36px);background:var(--cpl-card);border:1.5px solid var(--cpl-ink);border-radius:26px}
.cpl-news h3{font-family:var(--cpl-display);font-weight:800;font-size:clamp(1.5rem,1.1rem + 1.4vw,2.3rem);line-height:1.02;letter-spacing:-.03em}
.cpl-news>p{grid-column:1;color:var(--cpl-muted);font-size:15px}
.cpl-news-row,.cpl-news .cpl-ok,.cpl-news .cpl-err{grid-column:2;grid-row:1/3}
.cpl-news .cpl-err{grid-row:3}
.cpl-news-row{display:flex;gap:.6rem}
.cpl-news input{flex:1;min-width:0;min-height:48px;padding:0 1.1rem;border-radius:999px;border:1.5px solid var(--cpl-ink);background:var(--cpl-paper);font-size:16px}
.cpl-news input::placeholder{color:var(--cpl-muted);opacity:1}
.cpl-news input[aria-invalid="true"]{border-color:var(--cpl-coral);animation:cpl-shake .4s}
@keyframes cpl-shake{20%,60%{transform:translateX(-5px)}40%,80%{transform:translateX(5px)}}
.cpl-ok{font-weight:700}

.cpl-foot{background:var(--cpl-night);color:#fde7e2}
.cpl-foot-band{height:clamp(180px,22vw,320px);border-bottom:1.5px solid rgba(253,231,226,.25)}
.cpl-foot-in{display:grid;grid-template-columns:minmax(0,5fr) minmax(0,6fr);gap:2rem clamp(28px,5vw,80px);padding:clamp(40px,5vw,72px) clamp(16px,4vw,64px) clamp(110px,10vw,140px)}
.cpl-wordmark-sm{width:min(100%,360px);margin:0}
.cpl-foot-brand p{margin-top:1rem;color:#cfc6dc;max-width:34ch}
.cpl-foot nav ul{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.6rem 2rem;font-family:var(--cpl-display);font-weight:700;font-size:clamp(1.05rem,.95rem + .5vw,1.4rem)}
.cpl-foot nav a{min-height:32px}
.cpl-small{grid-column:1/-1;font-size:13px;color:#cfc6dc;border-top:1px solid rgba(253,231,226,.2);padding-top:1.2rem}

.cpl-pill-dock{position:sticky;bottom:16px;z-index:5;display:flex;flex-direction:column;align-items:center;gap:.5rem;height:0;overflow:visible;pointer-events:none}
.cpl-pill{position:absolute;bottom:0;display:flex;align-items:center;gap:1.1rem;padding:.4rem .4rem .4rem .55rem;background:var(--cpl-paper);border:1.5px solid var(--cpl-ink);border-radius:999px;box-shadow:4px 5px 0 var(--cpl-ink);transform:translateY(calc(100% + 30px));opacity:0;transition:transform .45s var(--cpl-ease),opacity .3s;font-size:14px;font-weight:700}
.cpl-pill-on .cpl-pill{transform:none;opacity:1;pointer-events:auto}
.cpl-pill-mark{display:grid;place-items:center;width:40px;height:40px;border-radius:50%;background:var(--cpl-ink);color:var(--cpl-paper);transition:transform .3s var(--cpl-ease)}
.cpl-pill-mark:hover{transform:rotate(-14deg)}
.cpl-pill-links{display:flex;gap:1.2rem}
.cpl-pill-hour{font-family:var(--cpl-type);font-variant-numeric:tabular-nums;color:var(--cpl-muted);font-size:13px}
.cpl-pill-menu{display:none;min-height:40px;padding:0 .9rem;border-radius:999px;border:1.5px solid var(--cpl-ink);background:transparent;font-weight:700;cursor:pointer}
.cpl-pill-cta{min-height:40px;font-size:14px;padding:0 1rem}
.cpl-menu{position:absolute;bottom:64px;pointer-events:auto;display:flex;flex-direction:column;min-width:220px;padding:.5rem;background:var(--cpl-paper);border:1.5px solid var(--cpl-ink);border-radius:22px;box-shadow:4px 5px 0 var(--cpl-ink);animation:cpl-pop .25s var(--cpl-ease)}
.cpl-menu a{display:block;padding:.75rem 1rem;border-radius:14px;text-decoration:none;font-family:var(--cpl-display);font-weight:800;font-size:18px}
.cpl-menu a:hover{background:var(--cpl-card)}

.cpl-rv.cpl-arm{opacity:0;transform:translateY(22px);transition:opacity .7s var(--cpl-ease),transform .8s var(--cpl-ease)}
.cpl-card.cpl-rv.cpl-arm{transform:translateY(34px)}
.cpl-rv.cpl-arm.cpl-in{opacity:1;transform:none}

@media (max-width:1100px){
.cpl-headnav{display:none}
.cpl-head{grid-template-columns:1fr auto}
.cpl-cards{grid-template-columns:repeat(2,minmax(0,1fr))}
.cpl-book{grid-template-columns:1fr}
.cpl-facts{grid-template-columns:repeat(2,minmax(0,1fr))}
.cpl-fact:nth-child(odd){transform:none}
.cpl-pill-links{display:none}
.cpl-pill-menu{display:inline-flex;align-items:center}
.cpl-quotes{grid-template-columns:1fr 1fr}
.cpl-quote-big{grid-column:1/-1}
.cpl-quote:nth-child(2){margin-top:0}
}
@media (max-width:860px){
.cpl-frame{height:auto;flex:none;padding:8px;border-radius:28px;margin-bottom:0;display:flex;flex-direction:column}
.cpl-frame::before{display:none}
.cpl-poster{height:clamp(360px,92vw,560px);border-radius:21px}
.cpl-cap{position:relative;left:auto;top:auto;width:auto;margin:14px 2px 2px;box-shadow:4px 5px 0 var(--cpl-ink);order:3}
.cpl-poster{order:1}
.cpl-dial-wrap{position:relative;left:auto;bottom:auto;transform:none;width:auto;margin:14px 2px 0;order:2}
.cpl-dial{border-radius:24px;flex-direction:column;align-items:stretch;gap:.8rem;padding:.9rem 1rem}
.cpl-dial-read{flex-direction:row;align-items:baseline;justify-content:space-between;min-width:0}
.cpl-moments{flex-wrap:nowrap;overflow-x:auto;scrollbar-width:none;padding-bottom:2px}
.cpl-chip{flex:none}
.cpl-sec-head{grid-template-columns:1fr;gap:.8rem}
.cpl-fob-wrap{right:-8px;top:-58px}
.cpl-fob{width:84px;height:139px}
.cpl-day{grid-template-columns:1fr}
.cpl-day-sticky{position:relative;top:auto}
.cpl-ev button{grid-template-columns:5.6rem minmax(0,1fr);padding:1rem .2rem}
.cpl-ev-on button{padding-left:.8rem}
.cpl-ev-place{grid-column:2;text-align:left}
.cpl-quotes{grid-template-columns:1fr}
.cpl-quote:nth-child(n){margin-top:0}

.cpl-visit{grid-template-columns:1fr}
.cpl-news{grid-template-columns:1fr}
.cpl-news-row,.cpl-news .cpl-ok,.cpl-news .cpl-err,.cpl-news>p{grid-column:1;grid-row:auto}
.cpl-foot-in{grid-template-columns:1fr}
}
@media (max-width:640px){
.cpl-head{padding-top:.8rem}
.cpl-place,.cpl-martini{display:none}
.cpl-oval{font-size:9.5px}
.cpl-hero>.cpl-wordmark{width:100%}
.cpl-cards{display:flex;overflow-x:auto;scroll-snap-type:x mandatory;gap:16px;margin:0 calc(-1 * clamp(16px,4vw,64px));padding:6px clamp(16px,4vw,64px) 18px;scrollbar-width:none}
.cpl-card{flex:0 0 84%;scroll-snap-align:center}
.cpl-card-art{flex:none}
.cpl-front{justify-content:space-between}
.cpl-back{font-size:13px;gap:.6rem}
.cpl-back-l p{font-size:13px}
.cpl-card:nth-child(even){margin-top:0}
.cpl-form{grid-template-columns:1fr}
.cpl-field-l{border-right:0}
.cpl-news-row{flex-direction:column}
.cpl-facts{gap:12px}
.cpl-fact{padding:1rem .9rem}
.cpl-fact dd{font-size:14px}
.cpl-foot nav ul{grid-template-columns:1fr 1fr}
.cpl-pill{gap:.6rem}
.cpl-pill-hour{display:none}
.cpl-back{grid-template-columns:1fr;grid-template-rows:auto}
.cpl-back-r{border-left:0;border-top:1.5px dashed rgba(25,29,58,.4);padding:.8rem 0 0;flex-direction:row;justify-content:space-between;align-items:center}
.cpl-back-r dl{grid-template-columns:repeat(3,auto);gap:.8rem;text-align:left}
}
@media (prefers-reduced-motion:reduce){
.cpl-sway,.cpl-caustic,.cpl-spark{animation:none}
.cpl-spark{opacity:0}
.cpl-card-inner,.cpl-pill,.cpl-btn,.cpl-knob,.cpl-oval,.cpl-martini,.cpl-ulink::after,.cpl-res,.cpl-menu{transition:none;animation:none}
.cpl-flipped .cpl-card-inner{transform:rotateY(180deg)}
.cpl-rv.cpl-arm{opacity:1;transform:none}
}
`
