"use client"

import * as React from "react"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { MorphSVGPlugin } from "gsap/MorphSVGPlugin"

/**
 * Alto Coffee Template — the launch page of a specialty roaster's new crop.
 *
 * The page tells one story, from the top of a volcano down into the cup:
 *
 * - Hero: a descent. You start above the clouds facing an illustrated
 *   volcano; scrolling drops you through the cloud bank (an altimeter counts
 *   the metres down) and out over the coffee rows on its lower slope.
 * - New crop: the harvest year set huge, with a cluster of ripe cherries
 *   that grows out of the type and leans towards the pointer.
 * - Origins: a dotted world map that flies from one year's origin to the
 *   next; the red country morphs from Colombia into Ethiopia into Guatemala.
 * - Bean: two bags you can tilt, an outlined title that fills as you read,
 *   flavour tiles, a cupping radar and a farm-to-cup strip that scrolls
 *   sideways.
 * - Stick: pick a blend and brew it; the cup fills with that blend's crema.
 * - Limited edition: specs, quantity, "Add to bag" flies into the header.
 * - Footer: the cup-and-volcano mark draws itself; newsletter sign-up.
 *
 * Every picture is drawn in SVG or canvas (and any of them can be swapped
 * for a photo). GSAP + ScrollTrigger + MorphSVG inside one gsap.context,
 * reverted on unmount; no pinning (sticky stages instead), and
 * `prefers-reduced-motion` gets a finished, still page.
 */

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger, MorphSVGPlugin)

/** The roaster's mark: a cup whose rim rises into a volcano. */
export function AltoMark({ size = 32, className, title }: { size?: number; className?: string; title?: string }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 64 64" role={title ? "img" : undefined} aria-hidden={title ? undefined : true}>
      {title && <title>{title}</title>}
      <path d={MARK_CUP} fill="currentColor" fillRule="evenodd" />
      <path d={MARK_HANDLE} fill="none" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" />
    </svg>
  )
}

const MARK_CUP = "M6 16h52l-5.6 33.2C51.7 53.6 49 56 45 56H19c-4 0-6.7-2.4-7.4-6.8ZM15.5 40.5h33L36 24.8h-8Z"
const MARK_HANDLE = "M57.4 24.5h.6a7.4 7.4 0 0 1 0 14.8h-3"

// ---- public types ------------------------------------------------------------------------

export type AltoPreset = "antigua" | "huila"

export type AltoColors = {
  /** Brand red: the mark, the bags, the active country, buttons. */
  accent?: string
  /** Light type on the dark bands. */
  cream?: string
  /** The bean section and limited-edition band. */
  brown?: string
  /** The stick section, a shade deeper. */
  deep?: string
  /** Map and footer: nearly black. */
  ink?: string
  /** The new-crop band. */
  crop?: string
  /** Hero sky, top and horizon. */
  skyTop?: string
  skyBottom?: string
  /** The volcano's sunlit and shaded flanks. */
  peak?: string
  peakShade?: string
  /** Far ridges, hazy. */
  ridge?: string
  /** Coffee rows: light and dark leaf. */
  leaf?: string
  leafDark?: string
}

/** Any picture slot also takes a photo. */
export type AltoImage = { src: string; alt?: string; focus?: [number, number] }

/** Built-in countries, outlines from Natural Earth (public domain). */
export type AltoCountry = "colombia" | "ethiopia" | "guatemala" | "brazil" | "kenya" | "costa-rica" | "honduras" | "rwanda" | "peru"

export type AltoOrigin = {
  year: string
  /** A built-in country, or your own outline in the map's 1000 × 394 equirectangular space. */
  country: AltoCountry | { name: string; d: string; box: [number, number, number, number] }
  /** Display name; defaults to the country's. */
  name?: string
  region: string
  altitude: string
  process: string
  notes: string[]
  blurb?: string
}

export type AltoBag = {
  name: string
  sub: string
  weight: string
  color?: string
  /** "bag" draws a pouch, "box" a drip-bag carton, "sticks" a sleeve of sticks. */
  kind?: "bag" | "box" | "sticks"
  image?: AltoImage
}

export type AltoNote = {
  name: string
  color: string
  motif?: "caramel" | "apple" | "plum" | "cacao" | "citrus" | "flower" | "honey" | "berry"
  body: string
  /** 1–5. */
  intensity?: number
  image?: AltoImage
}

export type AltoStep = {
  title: string
  body: string
  stat: string
  icon?: "pick" | "float" | "ferment" | "dry" | "hull" | "roast"
  image?: AltoImage
}

export type AltoBlend = {
  name: string
  color: string
  /** Colour of the crema in the brewed cup. */
  crema: string
  /** 1–5. */
  strength: number
  notes: string
  brew: string
}

export type AltoProduct = {
  id: string
  name: string
  kind: "bag" | "sticks"
  color?: string
  price: number
  specs: [string, string][]
  image?: AltoImage
}

export type AltoLink = { label: string; href: string }

export type AltoCoffeeTemplateProps = {
  /** Height of each sticky stage (hero, map, strip). Must be a definite length. */
  height?: string
  preset?: AltoPreset
  colors?: AltoColors
  /** "auto" follows a `.dark` ancestor: the hero turns to a night sky. */
  theme?: "auto" | "light" | "dark"
  /** Stylesheet for the font. Default: Archivo (variable width) from Google Fonts. `null` loads nothing. */
  fontHref?: string | null
  fonts?: { sans?: string }
  brand?: { name?: string; tagline?: string }
  nav?: AltoLink[]
  hero?: {
    /** Two lines of the hero title. */
    title?: [string, string]
    peak?: { name: string; altitude: number }
    /** Where the coffee grows, metres. The altimeter stops here. */
    farmAltitude?: number
    coords?: string
    soil?: string
    caption?: string
    /** Snow on the summit (a high Andean volcano). */
    snow?: boolean
    /** A smoking neighbour on the far ridge. */
    smoke?: boolean
    /** Replace the drawn plantation with a photo. */
    fieldImage?: AltoImage
  }
  crop?: { year?: string; title?: string; body?: string; stats?: { value: string; label: string }[] }
  origins?: { kicker?: string; title?: string; intro?: string; steps?: AltoOrigin[] }
  bean?: {
    title?: [string, string]
    kicker?: string
    lead?: string
    body?: string
    bags?: AltoBag[]
    notes?: AltoNote[]
    profile?: { label: string; value: number }[]
    score?: string
    stepsTitle?: string
    steps?: AltoStep[]
  }
  stick?: { title?: [string, string]; kicker?: string; lead?: string; blends?: AltoBlend[] }
  limited?: {
    kicker?: string
    title?: string
    lot?: string
    total?: number
    left?: number
    currency?: string
    products?: AltoProduct[]
  }
  footer?: { line?: string; columns?: { title: string; links: AltoLink[] }[]; legal?: string; social?: AltoLink[] }
  onNavigate?: (href: string) => void
  onAddToBag?: (product: AltoProduct, quantity: number) => void
  onSubscribe?: (email: string) => void
  className?: string
}

// ---- presets -------------------------------------------------------------------------------

const PRESETS: { [K in AltoPreset]: Required<AltoColors> } = {
  antigua: {
    accent: "#D7291F",
    cream: "#F5ECE1",
    brown: "#4A2E26",
    deep: "#33221D",
    ink: "#171211",
    crop: "#123E2C",
    skyTop: "#AFC7D6",
    skyBottom: "#F3EEE7",
    peak: "#7F978F",
    peakShade: "#3B4F55",
    ridge: "#A9BDC4",
    leaf: "#4F7A3E",
    leafDark: "#24432B",
  },
  huila: {
    accent: "#EE5A24",
    cream: "#F7EFE2",
    brown: "#55351F",
    deep: "#3A2414",
    ink: "#15110C",
    crop: "#22402A",
    skyTop: "#E9B48C",
    skyBottom: "#FBF0E3",
    peak: "#8E8079",
    peakShade: "#4C3E3D",
    ridge: "#C8ABA0",
    leaf: "#5E8237",
    leafDark: "#2A4422",
  },
}

const FONT_HREF = "https://fonts.googleapis.com/css2?family=Archivo:ital,wdth,wght@0,62..125,100..900;1,62..125,100..900&display=swap"
const SANS = "'Archivo', 'Helvetica Neue', Helvetica, Arial, sans-serif"

// ---- default content -------------------------------------------------------------------------

const NAV: AltoLink[] = [
  { label: "Origins", href: "#origins" },
  { label: "Bean", href: "#bean" },
  { label: "Stick", href: "#stick" },
  { label: "Limited", href: "#limited" },
]

const ORIGINS: AltoOrigin[] = [
  {
    year: "2024",
    country: "colombia",
    region: "Huila, San Agustín",
    altitude: "1,750 m",
    process: "Washed",
    notes: ["Panela", "Red apple", "Cacao nib"],
    blurb: "Forty smallholdings above the Magdalena; every lot picked in four passes.",
  },
  {
    year: "2025",
    country: "ethiopia",
    region: "Yirgacheffe, Gedeo",
    altitude: "2,050 m",
    process: "Natural",
    notes: ["Jasmine", "Blueberry", "Bergamot"],
    blurb: "Heirloom varieties dried whole on raised beds for twenty-one days.",
  },
  {
    year: "2026",
    country: "guatemala",
    region: "Antigua, Sacatepéquez",
    altitude: "1,560 m",
    process: "Washed · sun-dried",
    notes: ["Caramel", "Red plum", "Cacao"],
    blurb: "Grown in the shadow of Volcán de Agua, in soil laid down by its ash.",
  },
]

const BAGS: AltoBag[] = [
  { name: "Antigua", sub: "Whole bean", weight: "200 g", kind: "bag" },
  { name: "Antigua", sub: "Drip bag × 10", weight: "10 × 10 g", kind: "box" },
]

const NOTES: AltoNote[] = [
  { name: "Caramel", color: "#E9B13B", motif: "caramel", intensity: 5, body: "Brown sugar from the first sip, long after the cup cools." },
  { name: "Green apple", color: "#8DB83F", motif: "apple", intensity: 3, body: "A crisp, malic brightness from the high, cool nights." },
  { name: "Red plum", color: "#DD7B6A", motif: "plum", intensity: 4, body: "Ripe stone fruit as the cup opens up." },
  { name: "Cacao", color: "#C9A27E", motif: "cacao", intensity: 4, body: "Dark chocolate in a long, dry finish." },
]

const PROFILE = [
  { label: "Aroma", value: 8.5 },
  { label: "Acidity", value: 7.75 },
  { label: "Body", value: 8 },
  { label: "Sweetness", value: 9 },
  { label: "Finish", value: 8.25 },
]

const STEPS: AltoStep[] = [
  { icon: "pick", title: "Picked ripe", body: "Only red cherries, by hand, in four passes from January to March.", stat: "4 passes" },
  { icon: "float", title: "Floated", body: "Cherries float in spring water; the light ones never reach the mill.", stat: "8% removed" },
  { icon: "ferment", title: "Fermented & washed", body: "Thirty-six hours of dry fermentation, then washed down stone channels.", stat: "36 hours" },
  { icon: "dry", title: "Sun-dried", body: "Raked across the patio every hour, under the volcano, for two weeks.", stat: "14 days" },
  { icon: "hull", title: "Rested & hulled", body: "Parchment rests sixty days before hulling and sorting by hand.", stat: "60 days" },
  { icon: "roast", title: "Roasted to order", body: "Small batches, roasted within twenty-one days of landing.", stat: "12 min" },
]

const BLENDS: AltoBlend[] = [
  { name: "Dark roast", color: "#2F5BA6", crema: "#7A4B2E", strength: 5, notes: "Cacao, molasses, toasted walnut", brew: "1 stick · 100 ml · 90 °C" },
  { name: "Mild roast", color: "#E1742C", crema: "#A86C40", strength: 3, notes: "Caramel, orange zest, honey", brew: "1 stick · 120 ml · 90 °C" },
  { name: "Decaf", color: "#CDB592", crema: "#9C6B48", strength: 2, notes: "Almond, raw sugar, soft cocoa", brew: "1 stick · 120 ml · 85 °C" },
]

const PRODUCTS: AltoProduct[] = [
  {
    id: "bean-200",
    name: "New Crop Whole Bean",
    kind: "bag",
    price: 19,
    specs: [
      ["Origin", "Antigua, Guatemala"],
      ["Varietal", "Bourbon, Caturra"],
      ["Process", "Washed, sun-dried"],
      ["Roast", "Medium"],
      ["Weight", "200 g"],
    ],
  },
  {
    id: "stick-30",
    name: "New Crop Stick",
    kind: "sticks",
    color: "#2F5BA6",
    price: 16,
    specs: [
      ["Origin", "Antigua, Guatemala"],
      ["Format", "30 sticks × 0.9 g"],
      ["Brew", "100–120 ml, 90 °C"],
      ["Roast", "Dark"],
      ["Weight", "27 g"],
    ],
  },
]

const FOOTER_COLUMNS = [
  { title: "Shop", links: [{ label: "Whole bean", href: "#bean" }, { label: "Sticks", href: "#stick" }, { label: "Drip bags", href: "#bean" }, { label: "Gift sets", href: "#limited" }] },
  { title: "Origins", links: [{ label: "Colombia", href: "#origins" }, { label: "Ethiopia", href: "#origins" }, { label: "Guatemala", href: "#origins" }, { label: "Sourcing report", href: "#origins" }] },
  { title: "Company", links: [{ label: "About", href: "#top" }, { label: "Roastery", href: "#top" }, { label: "Wholesale", href: "#top" }, { label: "Careers", href: "#top" }] },
  { title: "Help", links: [{ label: "Shipping", href: "#top" }, { label: "Returns", href: "#top" }, { label: "Contact", href: "#top" }, { label: "FAQ", href: "#top" }] },
]

const SOCIAL: AltoLink[] = [
  { label: "Instagram", href: "#top" },
  { label: "YouTube", href: "#top" },
  { label: "Journal", href: "#top" },
]

// ---- map data --------------------------------------------------------------------------------
// Land as a 1.5° dot grid, run-length encoded per row (base-36 start + length
// pairs, rows split by "."), and country outlines, both in an equirectangular
// 1000 × 394.4 space (84° N to 58° S). From Natural Earth via world-atlas.

const MAP_W = 1000
const MAP_H = 394.4
const LAND = "2j012l0a.1n0i270r3102.1k081t08230y3p013s0147024b014d025104.1f021i011m0c210x3k065703.14031q03220y3m024z015802.16041b031g031n021s02290q4f04520e5u015w04.110315012a0p4d024y0f.11091c021h021k011m011o021r032c0i2v024b024m024u0l5g0a5y01.00020f01120116081k021p021s092d0i2w024c014l034p024s0y5s0d6n01.0b0f0w041201160b1i011k021r011u011x062b022e0i3o0a4g024l034p1m6g016i04.0002090y1d011i021l041r021x011z042e0e3n0f45024a024d0c4q1y.000304020c1h1z082d0c3l0d3z04460g4n014p1z.0302091h1r011w0725012d082x063l053t06432l.0d191n011q021t0120052e072y023i083r2w.0a1c1s011w0322022f0537013g083q2v.0b0a0m0z1w062h033f093q2i6d05.0c050r0u1w0624023f093s27610165026b02.0f010h010t0t1x0a38013k033o013s256904.0d010w0t1v011x0a38023h023l023q266805.0a010v010x0w1v0e36023a013i023p256804.0y0v1v0g360239033g2i6803.0z0v1v0f350139043f2j5z016801.0z15270138023d2l5z016701.1111230229033b2m.11142c013b2m.11153b0l3y0141074b1l.111124013b093m0942054a1l5y02.111036083j023o0744044b1h5x03.110y36073l023p063x0443064c1e.110y36063p023t0g4c185l015n025x02.120w36063m013q023u0f4c175n035x01.130u38013e013g033u023x0d4b1a5o025v03.130u38023b083s023y01401k5o025s06.150q370c401k5q015s03.160o360g3p023z1m5r01.1701190l350j3p1w.170e1n021t0135134a1b.17021a091t01330v40094b19.19011b081t02320x40094e16.19011c07320x41094c024l0y.1d06310z420d4m0w5k01.1e051v013110420e4m0e510e.1e051o021w033110430c4p095209.1f051n0320023110430b4p0753075c02.1h08311144094p0653085k02.1j011m06311144074p0555075k01.1n06311345044q0355085k01.1q0231154q035607.1r011z012101311448024r0259045l03.1s011y02210633174r035a01.1t011w0c33164r014t0156015m02.1w0d34154t0257015n01.1w0h36053g0s530257025h03.1x0h3i0q540257025g02.1w0i3j0n550258015e055p01.1v0j3i0n56025d065k035p01.1u0n3i0m57025d055p015s015u01.1u0o3i0l56045d055j025s015v02.1u0s3j0k58035g025l015o015t07.1u0u3k0j59025w05.1v0u3k0i5a025t015x05.1v0u3l0h5e035m015w046102.1w0s3l0h5m016202.1w0r3l0i5r01.1x0q3l0i5r045z01.1x0p3k0j48015o015q055y02.1y0o3k0j47035n085y03.200m3k0h45045l0c5y03.210l3k0g45045l0h.210k3l0e46024e015j0k.210k3l0f45035h0n6e01.210h3m0e45035g0p.210f3m0d45025g0q.210f3m0c5f0r.210f3m0c5g0q.200f3n0a5h0p.200e3o085h0p.200d3o075h085t0d.200c3o055h055u015w09.200a5w086j01.1z0b5x076k01.1z0a5y0261016k03.1z086k02.1z0660036k01.1z0761026i02.1z056g02.1z046f03.1y06.1y05.1y04.1z032801.1z03.2203.."

const COUNTRIES: { [K in AltoCountry]: { d: string; box: [number, number, number, number]; label: string } } = {
  colombia: { label: "Colombia", box: [280.5, 198.8, 314.2, 245.1],
    d: "M301.9 200.4L300.1 200.9L298.1 203.2L296.2 207.8L297.8 208L299 210.7L298.7 212.4L300 213.8L305.2 214L307.1 216.3L312.6 216.2L311.6 218.7L311.5 220.8L313 223.8L311.5 225.6L312.2 225.6L313.3 226.7L314.2 229.9L313.7 230L313.6 228.8L312.8 227.5L311.3 228.5L310.6 227.8L310.6 228.6L306 228.6L306 230.4L307.5 230.4L307.9 231.5L305.4 231.7L305.4 233.7L306.6 234.7L307.2 236.7L305.7 245.1L304.6 243.9L303.5 243.8L305.4 240.8L302.5 239.6L301.7 239.8L300.7 239.3L299.4 240L297.4 240L295.4 236.8L293.8 236L292.2 233.9L288.1 232.1L287.5 232.7L285 232.2L284.2 231L282.5 230.4L280.5 228.8L281.1 228.2L281.7 228.4L281.7 226.8L283.9 225.8L285.9 222.5L285.1 222.4L284.7 221.6L285.3 220.2L284.6 218L285.4 217.3L284.8 216.2L285.1 215.1L283.6 213.3L284 211.9L284.6 212.3L285.6 211.2L285 209.3L286.7 211.3L286.3 209.5L288.8 207.3L289.9 207.1L290.2 205L289.7 205.2L292.1 202.5L293.5 202.8L293 203.2L293.3 203.4L294 201.9L296.4 202L300.8 198.8L302.1 199.1L302.4 199.9Z" },
  ethiopia: { label: "Ethiopia", box: [591.7, 192.1, 633.3, 223.7],
    d: "M598 218.1L597.2 217.1L596.4 214.8L594.6 213.3L594.2 212.5L593.5 212L592.3 211.8L591.7 211.4L592.4 209.9L594.3 209.9L594.7 209.5L594.7 206.9L595.3 205L595.2 204.1L595.6 203.4L596 203.1L596.6 203.5L597 203.2L597.1 202L597.5 200.5L599.1 198.3L600.3 197.9L600.4 197L601.1 195.5L601.5 193.7L602.3 193.6L602.8 193.7L603.1 193.3L603.5 193.2L604.2 194L604.4 194L605.2 192.1L606.2 192.6L606.8 193.3L607.8 193.1L608.4 192.7L608.9 193.1L609.8 193L610.8 193.2L611.5 193.2L613.4 194.1L614.2 195.2L616 196.7L616.5 197.6L617 197.9L617.7 198.7L616.1 200.9L616.1 202.8L616.5 202.9L618.2 202.6L619.2 202.8L618.5 203.9L619 205L619.6 205.8L619.9 205.9L620.8 207.3L621.2 207.4L622.3 208.4L630.5 211.1L633.3 211.1L628.2 216L624.8 219.7L622.2 219.6L620.9 219.9L619.5 220.7L619 221.3L616.7 221.8L616.3 222.3L614.3 222.3L613.2 221.5L610.7 222.6L610.2 223.4L609.7 223.7L605.8 223.2L602.5 221.1L600.1 220.9L599.3 220L599.4 219L599.3 218.5L598.5 218.3L598.1 218.4Z" },
  guatemala: { label: "Guatemala", box: [243.8, 183.8, 254.9, 195.2],
    d: "M243.8 192.9L243.9 192.9L244 192.5L243.9 192.2L244 191.9L244 191.8L244 191.7L244.2 191.6L244.2 191.5L243.9 191L243.9 190.9L245.2 188.7L248.8 188.7L248.7 188.4L248.8 187.8L248.7 187.7L248.4 187.6L248.2 187.5L248.2 187.3L248 186.9L247.7 186.7L247.3 186.5L246.9 186.2L246.6 185.8L246.3 185.6L246.1 185.4L247.2 185.4L247.3 183.8L252.3 183.8L252.1 189.2L253.1 189.2L253.3 189.3L253.6 189.4L253.9 189.5L254.1 189.3L253.9 189.1L253.9 189L254.9 189.6L252.8 191.3L252.4 191.5L252.3 191.6L252.2 192L252.3 192.6L252.3 192.8L252 193L251.8 193.3L251.6 193.2L251.3 193.3L251.2 193.4L251.2 193.5L251.3 193.8L250.9 193.9L250.7 194.2L250.6 194.3L250.4 194.3L249.9 194.7L249.7 194.9L249.7 195.2L248.7 194.7L248.3 194.6L246.8 194.7L246.2 194.5L245.4 194.1L244.9 193.8Z" },
  brazil: { label: "Brazil", box: [294.4, 218.8, 402.9, 326.9],
    d: "M314.2 229.9L318.1 231.4L323.8 227.3L320 221.5L325.4 223.3L331.5 218.8L333.4 219.2L334.6 222.4L333.4 225.9L336.5 230L341.3 227.7L344.5 228.2L344.6 226.3L352.9 227.3L357.1 221.3L361.4 230.1L353.7 237.6L358.6 235.9L360 238.9L363 238.1L362.1 240.7L366.3 235.4L368.7 235.1L376 238.2L375.8 242.2L377.1 240.2L379.5 239.9L389 241.3L396.7 247L401.7 247.9L402.9 256.7L393.8 269L392.1 268.9L391.2 282.5L386.1 294.4L383.2 297.1L376 297.4L364.6 303.8L364.9 311.3L363.1 313.5L355.4 322.5L359.5 317.9L357.5 316.8L353.7 325.4L351.3 326.9L352.4 324.3L350.7 322.4L345.5 319L344.4 319.7L342.1 317L340 317.2L345.2 311.7L350.5 308.7L350.9 306.4L350.3 304.6L348.3 304.4L349.3 300.1L346.1 299.9L345 295.4L339 294.7L338.5 288.2L340.3 283.9L337.8 281.2L337.9 278.6L332.8 278.5L331.9 271.6L319.5 266.6L318.3 260.3L309.4 264.2L304.6 264.1L304.1 259.6L299.6 261.1L296.6 259.5L297.3 258.3L294.4 254.3L297.5 247.6L305.6 245.3L307.2 236.7L305.4 231.7L307.9 231.5L306 230.4L306 228.6L312.8 227.5Z" },
  kenya: { label: "Kenya", box: [594.2, 218.1, 616.3, 246.4],
    d: "M594.2 236.1L594.3 232.8L594.5 232.5L594.9 231.7L595.6 230.9L595.8 230.4L596.1 230.1L596.7 229.9L596.6 229.5L597.1 228.8L597.2 228.4L597.1 227.6L596.8 226.1L596.7 226.1L596.5 225.5L596.1 225.2L595.9 224.7L595.7 224.5L595.6 223.9L595.7 223.2L594.9 222.7L595 222.6L594.8 222.5L594.4 221.6L598 218.1L598 218.3L598.1 218.4L598.5 218.3L599.3 218.5L599.4 219L599.3 220L600.1 220.9L602.5 221.1L605.8 223.2L609.7 223.7L610.2 223.4L610.7 222.6L613.2 221.5L614.1 222.2L614.5 222.4L616.3 222.3L614.8 224.4L613.8 225.5L613.8 235.8L615.3 237.7L615.4 238L614.6 238.7L614.2 238.8L613.9 238.8L613.8 239L613.6 239L613.7 239.4L613.6 239.6L612.9 240.4L612.2 240.4L611.7 240.8L611.6 241.2L611.7 241.7L611.4 242.4L611.1 242.6L610.7 243.3L610.4 244.4L609.7 245.8L609.4 246.2L609.1 246.1L608.9 246.4L608.9 246.3L605 243.5L604.8 243.2L604.5 243L604.7 242.5L604.6 241.8L594.6 236.2Z" },
  "costa-rica": { label: "Costa Rica", box: [261.4, 202.3, 270.7, 210.9],
    d: "M270.7 206.7L270.4 206.9L270 206.7L269.9 206.7L269.8 207L269.6 207.1L269.6 208.2L269.8 208.2L270.2 208.5L270.2 208.6L269.8 208.9L269.7 209.1L269.8 209.3L269.9 209.5L269.8 209.9L269.4 210.2L269.7 210.6L269.8 210.9L269.6 210.6L269.1 210.1L269.1 209.7L269 209.5L268.4 209.1L268.1 209.1L268.3 209.4L268.6 209.7L268.6 210L267.9 209.9L267.8 209.8L267.4 209.4L267.7 209.1L267.7 208.9L267.7 208.2L267.4 207.9L267 207.6L266.3 207.3L266.1 207.1L265.1 206.8L264.8 206.5L264.8 206.4L264.9 206.1L264.7 205.8L263.8 205.2L263.3 205L263.2 204.9L263.2 204.8L263.2 205.3L263.4 205.5L264 205.7L264.1 205.9L264.2 206.1L263.9 206.4L263.7 206.5L263.7 206.7L263.6 206.7L263 206.1L262.2 205.8L261.7 205.2L261.5 204.7L261.6 204.5L262 203.8L262 203.5L261.4 203.1L261.8 202.8L261.8 202.6L262.2 202.3L262.3 202.3L264.1 202.9L264.7 202.6L265.3 202.8L265.7 202.8L266.2 203.4L266.9 203.5L267.2 203.5L267.5 203.4L267.6 203.2L267.7 203L268.2 204.3L268.5 204.7L269.1 205.4L269.4 205.6L270.1 206.5L270.5 206.6Z" },
  honduras: { label: "Honduras", box: [251.8, 188.8, 269, 197.3],
    d: "M269 191.7L268 191.7L267.7 192L266.7 192.3L266.5 192.3L266.3 192.4L266 192.4L265.9 192.5L265.6 192.5L265.4 192.7L264.9 192.6L264.3 192.2L263.9 192.4L263.8 192.5L263.8 192.8L263.4 193L263.4 193.5L262 194.5L261.9 194.8L261.7 194.9L261.2 194.5L261 194.3L260.7 194.5L260.2 195.1L259 195.1L259.1 196.3L258.7 196.5L258.4 197.1L258.2 197.2L257.4 197.3L257.4 197L257.2 196.9L257 196.5L257 196.2L256.1 196.1L256.3 195.9L256.2 195.8L256.3 194.9L256.1 194.7L255.6 194.8L255.1 194.5L254.2 194.9L254.1 194.5L253.6 194.4L252.6 193.5L251.8 193.3L252.3 192.8L252.2 192L252.4 191.5L252.8 191.3L254.9 189.6L255.2 189.7L255.9 189.2L256.6 189.1L257 189.5L257.5 189.3L258.6 189.6L259 189.5L260.1 189.5L260.6 189.2L261.3 189L261.2 188.8L261.7 188.9L262.5 189.2L263.4 189.1L264 188.9L264.9 189.2L265.1 189.4L265.5 189.4L265.2 189.2L265.9 189.4L267.3 190.5L266.7 190.2L266.4 190.2L266.4 190.3L266.4 190.6L266.9 190.6L267.3 191.1L267.8 190.9L268.1 191.1L267.7 190.6L268.4 191L268.6 191.4Z" },
  rwanda: { label: "Rwanda", box: [580.2, 236.3, 585.8, 241.1],
    d: "M582.2 237.2L582.8 237L582.9 237.1L583 237.4L583.1 237.4L583.1 237.4L583.3 237.4L583.6 237.1L584.1 236.6L584.2 236.4L584.3 236.3L584.5 236.3L584.7 236.3L584.7 236.3L584.6 236.5L584.7 236.7L585.1 237.1L585.3 237.2L585.4 237.4L585.6 237.7L585.6 238L585.6 238.5L585.6 238.8L585.7 239L585.8 239.3L585.7 239.6L585.6 239.8L585.5 239.9L585.5 239.9L585.3 239.9L585.2 239.9L585 240L584.9 240L584.7 239.9L584.5 239.8L584.1 239.9L584 239.9L583.7 240L583.7 240L583.6 240L583.3 239.8L583.1 239.8L583.1 240.4L583 240.7L583 240.9L582.7 241L582.5 241.1L581.6 241.1L581.5 241.1L581.4 240.8L581.1 240.6L580.8 240.5L580.7 240.6L580.6 240.7L580.6 240.9L580.3 240.8L580.3 240.7L580.3 240.4L580.2 240.1L580.2 240L580.9 239.5L580.9 239.4L581 239.3L580.9 238.5L581 238.4L581.1 238.1L581.3 237.8L581.5 237.6L581.7 237.5L581.9 237.4L582 237.2Z" },
  peru: { label: "Peru", box: [274.1, 233.4, 309.2, 284.3],
    d: "M305.7 245.1L303.3 244.9L302.9 245.4L300.4 245.8L297.5 247.6L296.6 250.3L296.8 251.3L295.1 252.5L295.2 253.6L294.4 254.3L297.3 258.3L296.6 259.5L298.9 259.8L299.5 261.1L302.1 261L304.1 259.6L303.8 263.9L306.7 263.8L309.2 268.1L308.4 269.1L308.1 271.3L308.7 272.7L307.3 274.4L307.9 275.7L307.2 276.8L307.7 278.2L308.8 278.7L306.6 281.1L306.9 282L306 282.5L305.8 283.9L304.4 284.3L301.8 282.5L301.6 281.6L298.7 279.7L291.4 276.1L288.1 272.6L288.3 270.5L286.1 267.3L285.3 265.4L284.4 264.7L281.2 257.3L278.4 253L277.5 251.8L274.6 250.2L275.3 249L274.1 246.3L274.4 245.1L275.6 243.7L277 242.8L277.3 244.1L276.4 244.5L276.8 245L276.5 245.6L277.4 245.3L278.8 245.7L279.6 247L280.5 247.1L281.4 246L282.4 242.8L282.9 243L283.7 241.6L287 240.5L290.1 237.6L290.5 235.9L291 236L290.9 235L289.9 233.7L291.2 233.4L293.2 234.8L293.8 236L295.4 236.8L295.8 238L296.7 238.4L296.8 239.7L297.4 240L299.4 240L300.7 239.3L301.7 239.8L302.9 239.5L305.3 240.7L303.5 243.8L304.6 243.9Z" },
}

// #region dots
/** Decode the run-length land grid into one path of zero-length segments (round caps draw the dots). */
function decodeDots(enc: string, step: number) {
  const cell = (step * 1000) / 360
  const parts: string[] = []
  let count = 0
  const rows = enc.split(".")
  for (let j = 0; j < rows.length; j++) {
    const row = rows[j]
    const y = +((j + 0.5) * cell).toFixed(1)
    for (let k = 0; k + 4 <= row.length; k += 4) {
      const start = parseInt(row.slice(k, k + 2), 36)
      const len = parseInt(row.slice(k + 2, k + 4), 36)
      for (let i = start; i < start + len; i++) {
        parts.push("M" + +((i + 0.5) * cell).toFixed(1) + " " + y + "h0")
        count++
      }
    }
  }
  return { d: parts.join(""), count }
}
// #endregion

// #region camera
/** A viewBox that frames `box` with room around it, never tighter than `minW` wide, at the stage's aspect. */
function cameraFor(box: [number, number, number, number], aspect: number, minW: number, pad: number) {
  const bw = box[2] - box[0]
  const bh = box[3] - box[1]
  const cx = box[0] + bw / 2
  const cy = box[1] + bh / 2
  let w = Math.max(bw * pad, minW, bh * pad * aspect)
  let h = w / aspect
  return [cx - w / 2, cy - h / 2, w, h]
}

/** Where a map point lands on screen for a viewBox drawn with preserveAspectRatio "xMidYMid slice". */
function toScreen(px: number, py: number, vb: number[], sw: number, sh: number) {
  const s = Math.max(sw / vb[2], sh / vb[3])
  const ox = (sw - vb[2] * s) / 2
  const oy = (sh - vb[3] * s) / 2
  return [ox + (px - vb[0]) * s, oy + (py - vb[1]) * s]
}
// #endregion

// #region format
/** 3760 → "3,760" without depending on the visitor's locale. */
function groupThousands(n: number) {
  const s = String(Math.round(Math.abs(n)))
  return (n < 0 ? "-" : "") + s.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
}

function money(n: number, currency: string) {
  const whole = Math.round(n * 100) % 100 === 0
  return currency + (whole ? groupThousands(n) : groupThousands(Math.floor(n)) + "." + String(Math.round(n * 100) % 100).padStart(2, "0"))
}

function clampQty(n: number) {
  return Math.max(1, Math.min(9, Math.round(n) || 1))
}

const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s.trim())
// #endregion

// #region noise
/** Hash a lattice point to 0–1. */
function hash2(x: number, y: number, seed: number) {
  let h = (x * 374761393 + y * 668265263 + seed * 2147483647) | 0
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  h ^= h >>> 16
  return (h >>> 0) / 4294967295
}

/** Value noise that repeats every `period` lattice cells along x, so the cloud bands tile. */
function noise2(x: number, y: number, period: number, seed: number) {
  const xi = Math.floor(x)
  const yi = Math.floor(y)
  const xf = x - xi
  const yf = y - yi
  const u = xf * xf * (3 - 2 * xf)
  const v = yf * yf * (3 - 2 * yf)
  const x0 = ((xi % period) + period) % period
  const x1 = (x0 + 1) % period
  const a = hash2(x0, yi, seed)
  const b = hash2(x1, yi, seed)
  const c = hash2(x0, yi + 1, seed)
  const d = hash2(x1, yi + 1, seed)
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v
}

function fbm(x: number, y: number, period: number, seed: number, octaves: number) {
  let sum = 0
  let amp = 0.5
  let norm = 0
  let p = period
  for (let o = 0; o < octaves; o++) {
    sum += amp * noise2(x, y, p, seed + o * 17)
    norm += amp
    x *= 2
    y *= 2
    p *= 2
    amp *= 0.5
  }
  return sum / norm
}

/** A seeded 0–1 generator (mulberry32). */
function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
// #endregion

/** Paint one tileable band of cloud: soft-edged, lit from above, densest along the middle. */
function paintClouds(w: number, h: number, seed: number, cover: number) {
  const cv = document.createElement("canvas")
  cv.width = w
  cv.height = h
  const ctx = cv.getContext("2d")
  if (!ctx) return ""
  const img = ctx.createImageData(w, h)
  const cells = 6
  const field = new Float32Array(w * h)
  for (let y = 0; y < h; y++) {
    const t = y / h
    const band = Math.exp(-Math.pow((t - 0.58) / 0.26, 2))
    for (let x = 0; x < w; x++) {
      const wx = (x / w) * cells
      const wy = (y / h) * cells * (h / w) * 2.4
      const warp = fbm(wx + 3.1, wy + 7.7, cells, seed + 101, 3) - 0.5
      const n = fbm(wx + warp * 0.9, wy + warp * 0.6, cells, seed, 5)
      field[y * w + x] = n * (0.55 + 0.75 * band) - (1 - band) * 0.18
    }
  }
  const lo = 0.62 - cover * 0.2
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x
      const n = field[i]
      const above = field[Math.max(0, y - 5) * w + x]
      let a = (n - lo) / 0.11
      a = a < 0 ? 0 : a > 1 ? 1 : a
      a = a * a * (3 - 2 * a)
      const lit = Math.max(0, Math.min(1, 0.66 + (n - above) * 7))
      const c = 196 + lit * 59
      img.data[i * 4] = c - 4
      img.data[i * 4 + 1] = c - 1
      img.data[i * 4 + 2] = c + 2 > 255 ? 255 : c + 2
      img.data[i * 4 + 3] = a * 255
    }
  }
  ctx.putImageData(img, 0, 0)
  return cv.toDataURL("image/png")
}

/** A small tile of film grain, laid over the drawn scenes so flat fills read as printed. */
function paintGrain() {
  const cv = document.createElement("canvas")
  cv.width = cv.height = 140
  const ctx = cv.getContext("2d")
  if (!ctx) return ""
  const img = ctx.createImageData(140, 140)
  const r = rng(7)
  for (let i = 0; i < 140 * 140; i++) {
    const v = r() * 255
    img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v
    img.data[i * 4 + 3] = 22
  }
  ctx.putImageData(img, 0, 0)
  return cv.toDataURL("image/png")
}

const useIso = typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect
const REDUCE = "(prefers-reduced-motion: reduce)"
const prefersReduced = () => typeof window !== "undefined" && window.matchMedia(REDUCE).matches

const countryOf = (o: AltoOrigin) =>
  typeof o.country === "string" ? { name: COUNTRIES[o.country].label, d: COUNTRIES[o.country].d, box: COUNTRIES[o.country].box } : o.country

function Photo({ image, className }: { image: AltoImage; className?: string }) {
  const f = image.focus || [0.5, 0.5]
  return (
    <img
      className={"ac-photo" + (className ? " " + className : "")}
      src={image.src}
      alt={image.alt || ""}
      loading="lazy"
      decoding="async"
      style={{ objectPosition: f[0] * 100 + "% " + f[1] * 100 + "%" }}
    />
  )
}

// ---- drawn scenes ----------------------------------------------------------------------------
// Each scene is generated once from a seed, so it is identical on every render
// and on the server.

/** Half-width of the cone at height y (summit at y = 205, base at y = 1000). */
const coneHalf = (y: number) => 38 + 770 * Math.pow(Math.max(0, y - 205) / 795, 1.55)

function buildVolcano(snow: boolean) {
  const r = rng(26)
  const lit: string[] = []
  const shade: string[] = []
  // gullies: thin wedges running from the crater rim down the flanks
  for (let k = 0; k < 46; k++) {
    const t = -0.96 + (k / 45) * 1.92 + (r() - 0.5) * 0.03
    const len = 0.55 + r() * 0.45
    const left: string[] = []
    const right: string[] = []
    const wob = r() * 6
    for (let s = 0; s <= 12; s++) {
      const q = (s / 12) * len
      const y = 214 + q * 786
      const x = 800 + t * coneHalf(y) + Math.sin(q * 9 + wob) * (2 + q * 10)
      const w = 0.4 + q * (3 + r() * 5)
      left.push(+(x - w).toFixed(1) + " " + +y.toFixed(1))
      right.unshift(+(x + w).toFixed(1) + " " + +y.toFixed(1))
    }
    const d = "M" + left.join("L") + "L" + right.join("L") + "Z"
    ;(t < 0.12 ? lit : shade).push(d)
  }
  // tree line: overlapping crowns along the lower slopes
  const crowns = (y0: number, amp: number, rMin: number, rMax: number, seed: number) => {
    const rr = rng(seed)
    let d = ""
    for (let x = -30; x < 1640; ) {
      const rad = rMin + rr() * (rMax - rMin)
      const y = y0 + Math.sin(x / 140 + seed) * amp + rr() * 10
      d += "M" + +(x - rad).toFixed(1) + " " + +y.toFixed(1) + "a" + rad.toFixed(1) + " " + rad.toFixed(1) + " 0 1 0 " + (rad * 2).toFixed(1) + " 0a" + rad.toFixed(1) + " " + rad.toFixed(1) + " 0 1 0 " + (-rad * 2).toFixed(1) + " 0"
      x += rad * 1.25
    }
    return d
  }
  let cap = ""
  if (snow) {
    const pts: string[] = []
    for (let s = 0; s <= 24; s++) {
      const t = -1 + s / 12
      const y = 300 + Math.sin(s * 2.1) * 18 + (s % 2 ? 26 : 0) + Math.abs(t) * 30
      pts.push(+(800 + t * coneHalf(y)).toFixed(1) + " " + +y.toFixed(1))
    }
    cap = "M762 214L790 204L812 211L838 212L" + pts.reverse().join("L") + "Z"
  }
  return { lit: lit.join(""), shade: shade.join(""), back: crowns(800, 22, 14, 26, 3), front: crowns(870, 18, 18, 34, 9), cap }
}

const CONE =
  "M-40 1000L-40 975C260 930 500 760 640 520C700 410 738 300 762 214L790 204L812 211L838 212C862 300 900 410 960 520C1100 760 1340 930 1640 975L1640 1000Z"

function VolcanoArt({ snow, uid }: { snow: boolean; uid: string }) {
  const v = React.useMemo(() => buildVolcano(snow), [snow])
  return (
    <svg className="ac-peak" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <defs>
        <linearGradient id={uid + "cone"} x1="0.28" y1="0" x2="0.78" y2="0">
          <stop offset="0" stopColor="var(--ac-peak)" />
          <stop offset="0.5" stopColor="var(--ac-peak)" />
          <stop offset="0.56" stopColor="var(--ac-peakShade)" />
          <stop offset="1" stopColor="var(--ac-peakShade)" />
        </linearGradient>
        <linearGradient id={uid + "haze"} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--ac-skyBottom)" stopOpacity="0" />
          <stop offset="0.55" stopColor="var(--ac-skyBottom)" stopOpacity="0.06" />
          <stop offset="1" stopColor="var(--ac-skyBottom)" stopOpacity="0.55" />
        </linearGradient>
        <clipPath id={uid + "clip"}>
          <path d={CONE} />
        </clipPath>
      </defs>
      <path d={CONE} fill={"url(#" + uid + "cone)"} />
      <g clipPath={"url(#" + uid + "clip)"}>
        <path d={v.shade} fill="#000" opacity="0.2" />
        <path d={v.lit} fill="#fff" opacity="0.16" />
        {v.cap && <path d={v.cap} fill="#F6F4F0" opacity="0.94" />}
        <path d={v.back} fill="var(--ac-leaf)" opacity="0.55" />
        <rect x="-40" y="815" width="1700" height="200" fill="var(--ac-leaf)" opacity="0.55" />
        <path d={v.front} fill="var(--ac-leafDark)" />
        <rect x="-40" y="885" width="1700" height="130" fill="var(--ac-leafDark)" />
        <path d={CONE} fill={"url(#" + uid + "haze)"} />
      </g>
    </svg>
  )
}

function FarRidge({ smoke }: { smoke: boolean }) {
  return (
    <svg className="ac-far" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <path d="M-60 1000L-60 700C40 640 120 520 210 420L236 404L262 418C300 470 330 500 372 470L440 392L470 384L494 400C560 500 700 640 820 700L820 1000Z" fill="var(--ac-ridge)" />
      <path d="M900 1000L900 760C1040 700 1150 620 1250 600C1330 585 1420 640 1660 700L1660 1000Z" fill="var(--ac-ridge)" opacity="0.8" />
      {smoke && (
        <g className="ac-smoke">
          <defs>
            <radialGradient id="ac-puff">
              <stop offset="0" stopColor="#F4F1EC" stopOpacity="0.9" />
              <stop offset="0.55" stopColor="#F4F1EC" stopOpacity="0.45" />
              <stop offset="1" stopColor="#F4F1EC" stopOpacity="0" />
            </radialGradient>
          </defs>
          <ellipse cx="472" cy="364" rx="40" ry="26" fill="url(#ac-puff)" />
          <ellipse cx="494" cy="328" rx="56" ry="32" fill="url(#ac-puff)" opacity="0.8" />
          <ellipse cx="526" cy="288" rx="74" ry="38" fill="url(#ac-puff)" opacity="0.6" />
          <ellipse cx="570" cy="244" rx="96" ry="42" fill="url(#ac-puff)" opacity="0.4" />
        </g>
      )}
    </svg>
  )
}

function Stars() {
  const d = React.useMemo(() => {
    const r = rng(11)
    let s = ""
    for (let i = 0; i < 140; i++) s += "M" + Math.round(r() * 1600) + " " + Math.round(r() * r() * 620) + "h0"
    return s
  }, [])
  return (
    <svg className="ac-stars" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <path d={d} stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  )
}

// Coffee hedgerows running to a vanishing point under the volcano, built from
// thousands of leaf clumps (log-spaced in depth so the far rows stay dense).
function buildField() {
  const r = rng(5)
  const VX = 800
  const VY = 372
  const D = 640
  const circle = (x: number, y: number, rad: number, sq = 0.8) => {
    const rx = rad.toFixed(1)
    const ry = (rad * sq).toFixed(1)
    return "M" + (x - rad).toFixed(1) + " " + y.toFixed(1) + "a" + rx + " " + ry + " 0 1 0 " + (rad * 2).toFixed(1) + " 0a" + rx + " " + ry + " 0 1 0 " + (-rad * 2).toFixed(1) + " 0"
  }
  const tones = ["", "", ""]
  let hi = ""
  let berries = ""
  let beds = ""
  const lnA = Math.log(0.025)
  const lnB = Math.log(1.25)
  for (let k = -6; k <= 6; k++) {
    const sx = k * 236
    const hw = 92
    beds += "M" + (VX + (sx - hw) * 0.02).toFixed(1) + " " + (VY + D * 0.02).toFixed(1) + "L" + (VX + (sx + hw) * 0.02).toFixed(1) + " " + (VY + D * 0.02).toFixed(1) + "L" + (VX + (sx + hw) * 1.3).toFixed(1) + " " + (VY + D * 1.3).toFixed(1) + "L" + (VX + (sx - hw) * 1.3).toFixed(1) + " " + (VY + D * 1.3).toFixed(1) + "Z"
    const n = Math.abs(k) > 4 ? 160 : 380
    const pts: [number, number, number, number][] = []
    for (let i = 0; i < n; i++) {
      const t = Math.exp(lnA + (lnB - lnA) * Math.pow(r(), 0.72))
      const cx = VX + sx * t + (r() - 0.5) * 1.75 * hw * t
      const rad = (16 + r() * 20) * t
      const cy = VY + D * t - rad * (0.25 + r() * 0.35)
      pts.push([cx, cy, rad, t])
    }
    pts.sort((a, b) => a[3] - b[3])
    for (const [cx, cy, rad, t] of pts) {
      const tone = r()
      tones[tone < 0.36 ? 0 : tone < 0.8 ? 1 : 2] += circle(cx, cy, rad)
      if (t > 0.08 && r() < 0.45) hi += circle(cx - rad * 0.26, cy - rad * 0.3, rad * 0.46, 0.6)
      if (t > 0.42 && r() < 0.16) {
        const br = rad * 0.16
        for (let b = 0; b < 3 + Math.floor(r() * 3); b++) berries += circle(cx + (r() - 0.5) * rad * 0.9, cy + rad * (0.1 + r() * 0.4), br, 1)
      }
    }
  }
  // grevillea shade trees standing in the middle distance
  let trees = ""
  const spots = [-4.5, -2.5, -0.5, 1.5, 3.5]
  for (let i = 0; i < spots.length; i++) {
    const t = 0.16 + r() * 0.16
    const x = VX + spots[i] * 236 * t
    const base = VY + D * t
    const h = 1050 * t
    trees += "M" + (x - 1.2 * t * 4).toFixed(1) + " " + base.toFixed(1) + "L" + x.toFixed(1) + " " + (base - h).toFixed(1) + "L" + (x + 1.2 * t * 4).toFixed(1) + " " + base.toFixed(1) + "Z"
    for (let c = 0; c < 9; c++) {
      const cr = (44 + r() * 40) * t
      trees += circle(x + (r() - 0.5) * 300 * t, base - h * (0.8 + r() * 0.22), cr, 0.42)
    }
  }
  return { tones, hi, berries, beds, trees, VY }
}

function FieldArt({ uid }: { uid: string }) {
  const f = React.useMemo(buildField, [])
  return (
    <svg className="ac-field-art" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <defs>
        <linearGradient id={uid + "fog"} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--ac-skyBottom)" stopOpacity="0" />
          <stop offset="0.16" stopColor="var(--ac-skyBottom)" stopOpacity="0.9" />
          <stop offset="0.45" stopColor="var(--ac-skyBottom)" stopOpacity="0.35" />
          <stop offset="1" stopColor="var(--ac-skyBottom)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d="M260 390C420 330 600 200 720 104L748 92L780 96L812 92L840 104C960 200 1150 330 1340 390Z" fill="var(--ac-ridge)" />
      <path d="M-100 1100V372C120 352 300 380 520 366C760 350 1000 378 1220 362C1400 350 1560 370 1700 360V1100Z" style={{ fill: "color-mix(in srgb, var(--ac-leafDark) 62%, #3a2a1c)" }} />
      <path d={f.trees} fill="var(--ac-leafDark)" opacity="0.9" />
      <path d={f.beds} fill="var(--ac-leafDark)" />
      <path d={f.tones[0]} style={{ fill: "color-mix(in srgb, var(--ac-leafDark) 55%, var(--ac-leaf))" }} />
      <path d={f.tones[1]} fill="var(--ac-leaf)" />
      <path d={f.tones[2]} style={{ fill: "color-mix(in srgb, var(--ac-leaf) 78%, #e8f0c0)" }} />
      <path d={f.hi} fill="#fff" opacity="0.1" />
      <path d={f.berries} fill="var(--ac-accent)" />
      <rect x="-100" y="320" width="1800" height="330" fill={"url(#" + uid + "fog)"} />
    </svg>
  )
}

// A coffee branch with a cluster of cherries at different stages of ripeness.
const CHERRIES: [number, number, number, number][] = [
  // x, y, r, ripeness 0 green → 3 deep red   (drawn back to front)
  [300, 205, 34, 1], [372, 214, 36, 3], [246, 236, 33, 2], [420, 252, 35, 3],
  [330, 262, 42, 3], [262, 300, 38, 3], [392, 306, 40, 2], [322, 336, 37, 3], [458, 300, 30, 0],
]

function CherryArt({ uid }: { uid: string }) {
  const tones = [
    ["#D9D27A", "#9DA53A", "#5E6A1F"],
    ["#F6A04A", "#E1561E", "#94280F"],
    ["#F25A4A", "#C81E1E", "#6E0A12"],
    ["#E9473D", "#A8121A", "#4E050C"],
  ]
  return (
    <svg className="ac-cherries" viewBox="0 0 600 460" aria-hidden="true">
      <defs>
        {tones.map((t, i) => (
          <radialGradient key={i} id={uid + "ch" + i} cx="0.36" cy="0.32" r="0.75">
            <stop offset="0" stopColor={t[0]} />
            <stop offset="0.5" stopColor={t[1]} />
            <stop offset="1" stopColor={t[2]} />
          </radialGradient>
        ))}
        <linearGradient id={uid + "leaf"} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3F7A3A" />
          <stop offset="1" stopColor="#163B22" />
        </linearGradient>
      </defs>
      <path d="M18 168C120 140 210 170 300 176C390 182 480 160 590 120" fill="none" stroke="#5A3A22" strokeWidth="11" strokeLinecap="round" />
      <path d="M18 168C120 140 210 170 300 176C390 182 480 160 590 120" fill="none" stroke="#8B5E3C" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
      {[
        "M120 152C90 90 120 30 196 6C210 64 180 122 120 152Z",
        "M460 150C470 80 530 40 598 44C590 110 530 150 460 150Z",
        "M200 166C150 196 110 260 128 330C182 300 214 240 200 166Z",
        "M500 150C540 190 560 250 540 320C490 280 476 214 500 150Z",
      ].map((d, i) => (
        <g key={i}>
          <path d={d} fill={"url(#" + uid + "leaf)"} />
          <path d={d} fill="none" stroke="#9CC27E" strokeWidth="1.4" opacity="0.35" />
        </g>
      ))}
      <path d="M120 152C150 100 172 50 196 6M460 150C510 100 556 70 598 44M200 166C172 220 146 270 128 330M500 150C522 200 534 260 540 320" fill="none" stroke="#B9D69A" strokeWidth="2" opacity="0.5" />
      {CHERRIES.map(([x, y, rad, k], i) => (
        <g key={i} className="ac-cherry">
          <ellipse cx={x + 6} cy={y + rad * 0.82} rx={rad * 0.9} ry={rad * 0.22} fill="#000" opacity="0.18" />
          <circle cx={x} cy={y} r={rad} fill={"url(#" + uid + "ch" + k + ")"} />
          <ellipse cx={x - rad * 0.36} cy={y - rad * 0.4} rx={rad * 0.3} ry={rad * 0.18} transform={"rotate(-30 " + (x - rad * 0.36) + " " + (y - rad * 0.4) + ")"} fill="#fff" opacity="0.5" />
          <circle cx={x + rad * 0.3} cy={y + rad * 0.48} r={rad * 0.13} fill="#2A0508" opacity="0.65" />
        </g>
      ))}
    </svg>
  )
}

// ---- packaging -----------------------------------------------------------------------------

function BagArt({ bag, uid, brand }: { bag: AltoBag; uid: string; brand: string }) {
  const color = bag.color || "var(--ac-accent)"
  if (bag.kind === "box") {
    return (
      <svg className="ac-pack-art" viewBox="0 0 300 420" aria-hidden="true">
        <defs>
          <linearGradient id={uid + "box"} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#000" stopOpacity="0.28" />
            <stop offset="0.12" stopColor="#000" stopOpacity="0" />
            <stop offset="0.88" stopColor="#fff" stopOpacity="0.06" />
            <stop offset="1" stopColor="#000" stopOpacity="0.2" />
          </linearGradient>
        </defs>
        <ellipse cx="150" cy="404" rx="128" ry="10" fill="#000" opacity="0.25" />
        <path d="M40 70L232 70L262 46L70 46Z" fill={color} />
        <path d="M40 70L232 70L262 46L70 46Z" fill="#fff" opacity="0.18" />
        <path d="M232 70L262 46L262 372L232 398Z" fill={color} />
        <path d="M232 70L262 46L262 372L232 398Z" fill="#000" opacity="0.3" />
        <rect x="40" y="70" width="192" height="328" fill={color} />
        <rect x="40" y="70" width="192" height="328" fill={"url(#" + uid + "box)"} />
        <g color="var(--ac-cream)" fill="var(--ac-cream)">
          <svg x="119" y="96" width="34" height="34" viewBox="0 0 64 64">
            <path d={MARK_CUP} fill="currentColor" fillRule="evenodd" />
            <path d={MARK_HANDLE} fill="none" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" />
          </svg>
          <text x="136" y="160" textAnchor="middle" className="ac-pack-word" textLength={brand.length > 6 ? 160 : undefined} lengthAdjust="spacingAndGlyphs">
            {brand}
          </text>
          <rect x="70" y="174" width="132" height="1.4" />
          <text x="136" y="198" textAnchor="middle" className="ac-pack-sm">DRIP BAG · {bag.name.toUpperCase()}</text>
          <path d="M70 330L118 262L126 258L134 262L182 330" fill="none" stroke="var(--ac-cream)" strokeWidth="1.6" />
          <path d="M60 330H212" stroke="var(--ac-cream)" strokeWidth="1.6" />
          <text x="136" y="366" textAnchor="middle" className="ac-pack-sm">{bag.weight}</text>
        </g>
      </svg>
    )
  }
  if (bag.kind === "sticks") {
    return (
      <svg className="ac-pack-art" viewBox="0 0 300 420" aria-hidden="true">
        <ellipse cx="150" cy="404" rx="120" ry="10" fill="#000" opacity="0.25" />
        {[-2, -1, 0, 1, 2].map((k) => (
          <g key={k} transform={"rotate(" + k * 7 + " 150 400)"}>
            <rect x="128" y="60" width="44" height="340" rx="5" fill={color} />
            <rect x="128" y="60" width="44" height="340" rx="5" fill="#000" opacity={0.06 * Math.abs(k)} />
            <path d="M128 76h44M128 384h44" stroke="#fff" strokeOpacity="0.35" strokeDasharray="3 3" />
            <text x="150" y="230" transform="rotate(-90 150 230)" textAnchor="middle" className="ac-pack-sm" fill="var(--ac-cream)">
              {brand} STICK
            </text>
          </g>
        ))}
      </svg>
    )
  }
  return (
    <svg className="ac-pack-art" viewBox="0 0 300 420" aria-hidden="true">
      <defs>
        <linearGradient id={uid + "bag"} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#000" stopOpacity="0.34" />
          <stop offset="0.16" stopColor="#000" stopOpacity="0" />
          <stop offset="0.42" stopColor="#fff" stopOpacity="0.12" />
          <stop offset="0.6" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.86" stopColor="#000" stopOpacity="0.06" />
          <stop offset="1" stopColor="#000" stopOpacity="0.36" />
        </linearGradient>
      </defs>
      <ellipse cx="150" cy="406" rx="126" ry="10" fill="#000" opacity="0.25" />
      <path d="M36 66C36 54 44 48 56 48H244C256 48 264 54 264 66L272 384C272 396 264 402 252 402H48C36 402 28 396 28 384Z" fill={color} />
      <path d="M36 66C36 54 44 48 56 48H244C256 48 264 54 264 66L272 384C272 396 264 402 252 402H48C36 402 28 396 28 384Z" fill={"url(#" + uid + "bag)"} />
      <path d="M40 20L48 14L56 20L64 14L72 20L80 14L88 20L96 14L104 20L112 14L120 20L128 14L136 20L144 14L152 20L160 14L168 20L176 14L184 20L192 14L200 20L208 14L216 20L224 14L232 20L240 14L248 20L256 14L260 18V60H40Z" fill={color} />
      <path d="M40 20L48 14L56 20L64 14L72 20L80 14L88 20L96 14L104 20L112 14L120 20L128 14L136 20L144 14L152 20L160 14L168 20L176 14L184 20L192 14L200 20L208 14L216 20L224 14L232 20L240 14L248 20L256 14L260 18V60H40Z" fill="#000" opacity="0.14" />
      <path d="M40 32H260M40 40H260" stroke="#000" strokeOpacity="0.16" />
      <circle cx="150" cy="92" r="11" fill="#000" opacity="0.18" />
      <circle cx="150" cy="92" r="6" fill="none" stroke="#fff" strokeOpacity="0.35" />
      <g color="var(--ac-cream)" fill="var(--ac-cream)">
        <svg x="132" y="122" width="36" height="36" viewBox="0 0 64 64">
          <path d={MARK_CUP} fill="currentColor" fillRule="evenodd" />
          <path d={MARK_HANDLE} fill="none" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" />
        </svg>
        <text x="150" y="196" textAnchor="middle" className="ac-pack-word" textLength={brand.length > 6 ? 200 : undefined} lengthAdjust="spacingAndGlyphs">
          {brand}
        </text>
        <rect x="80" y="210" width="140" height="1.4" />
        <text x="150" y="234" textAnchor="middle" className="ac-pack-sm">{bag.name.toUpperCase()}</text>
        <text x="150" y="252" textAnchor="middle" className="ac-pack-xs">{bag.sub.toUpperCase()}</text>
        <path d="M74 344L136 266L146 262L156 266L218 344" fill="none" stroke="var(--ac-cream)" strokeWidth="1.6" />
        <path d="M104 306C126 300 140 312 160 304C176 298 186 304 196 312" fill="none" stroke="var(--ac-cream)" strokeWidth="1.2" opacity="0.7" />
        <path d="M60 344H240" stroke="var(--ac-cream)" strokeWidth="1.6" />
        <text x="150" y="376" textAnchor="middle" className="ac-pack-sm">{bag.weight}</text>
      </g>
    </svg>
  )
}

function StickArt({ color, brand, label }: { color: string; brand: string; label: string }) {
  return (
    <svg className="ac-stick-art" viewBox="0 0 70 420" aria-hidden="true">
      <path d="M6 14L12 6L18 14L24 6L30 14L36 6L42 14L48 6L54 14L60 6L64 12V408L58 414L52 408L46 414L40 408L34 414L28 408L22 414L16 408L10 414L6 410Z" fill={color} />
      <rect x="6" y="14" width="10" height="394" fill="#fff" opacity="0.14" />
      <rect x="52" y="14" width="12" height="394" fill="#000" opacity="0.14" />
      <path d="M6 30H64M6 392H64" stroke="#fff" strokeOpacity="0.4" strokeDasharray="3 3" />
      <svg x="20" y="52" width="30" height="30" viewBox="0 0 64 64" color="var(--ac-cream)">
        <path d={MARK_CUP} fill="currentColor" fillRule="evenodd" />
        <path d={MARK_HANDLE} fill="none" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" />
      </svg>
      <text x="35" y="230" transform="rotate(-90 35 230)" textAnchor="middle" className="ac-stick-word" fill="var(--ac-cream)">
        {brand} STICK
      </text>
      <text x="35" y="350" transform="rotate(-90 35 350)" textAnchor="middle" className="ac-pack-xs" fill="var(--ac-cream)">
        {label.toUpperCase()}
      </text>
    </svg>
  )
}

// ---- line art -----------------------------------------------------------------------------------

const MOTIFS: { [k: string]: string } = {
  caramel: "M18 30h64M18 30c0 14 6 12 6 24s-6 14 0 20 8-8 8-20 6-12 10-12 4 26 10 26 6-18 10-18 4 10 10 10 6-12 10-12 4 6 4 6",
  apple: "M50 34c-10-8-30-6-32 16-2 20 12 38 22 38 6 0 6-3 10-3s4 3 10 3c10 0 24-18 22-38-2-22-22-24-32-16ZM50 34c0-8 2-14 8-20M58 22c8-6 18-4 20 2-8 6-16 4-20-2Z",
  plum: "M50 20c22 0 34 16 34 34S70 86 50 86 16 72 16 54s12-34 34-34ZM50 20c-8 16-8 48 0 66M54 20c2-6 6-10 12-12",
  cacao: "M50 10c18 10 26 28 26 44S64 88 50 92C36 88 24 70 24 54S32 20 50 10ZM50 10v82M38 18c-6 24-6 52 4 70M62 18c6 24 6 52-4 70",
  citrus: "M50 16a34 34 0 1 1 0 68 34 34 0 0 1 0-68Zm0 8v60M26 34l48 32M74 34 26 66M50 24a26 26 0 1 0 0 52",
  flower: "M50 50m-8 0a8 8 0 1 0 16 0 8 8 0 1 0-16 0M50 42c-6-14-2-26 0-28 2 2 6 14 0 28ZM58 50c14-6 26-2 28 0-2 2-14 6-28 0ZM50 58c6 14 2 26 0 28-2-2-6-14 0-28ZM42 50c-14 6-26 2-28 0 2-2 14-6 28 0Z",
  honey: "M50 14 78 30v32L50 78 22 62V30ZM50 30l14 8v16l-14 8-14-8V38Z",
  berry: "M38 40a14 14 0 1 1 0 28 14 14 0 0 1 0-28Zm24 0a14 14 0 1 1 0 28 14 14 0 0 1 0-28ZM50 62a14 14 0 1 1 0 28 14 14 0 0 1 0-28ZM44 40c0-12 6-20 16-26",
}

const STEP_ICONS: { [k: string]: string } = {
  pick: "M14 40c30-10 60 4 92-6M40 38c-4 16 0 26 0 26M70 34c2 14-2 24-2 24M40 64a10 10 0 1 0 0 20 10 10 0 0 0 0-20ZM68 58a10 10 0 1 0 0 20 10 10 0 0 0 0-20ZM54 72a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM80 34c10-14 24-14 30-10-6 12-20 14-30 10Z",
  float: "M10 70c10-6 20-6 30 0s20 6 30 0 20-6 30 0 10 4 10 4M10 88c10-6 20-6 30 0s20 6 30 0 20-6 30 0 10 4 10 4M36 50a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM62 42a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM86 52a7 7 0 1 0 0 14 7 7 0 0 0 0-14Z",
  ferment: "M24 30h72l-8 66H32ZM24 30c0-6 4-10 10-10h52c6 0 10 4 10 10M44 80a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM60 64a5 5 0 1 0 0 10 5 5 0 0 0 0-10ZM74 82a3 3 0 1 0 0 6 3 3 0 0 0 0-6ZM50 50a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z",
  dry: "M60 16a14 14 0 1 1 0 28 14 14 0 0 1 0-28ZM60 4v6M60 50v6M38 30h6M76 30h6M44 14l4 4M76 14l-4 4M14 76h92l-10 18H24ZM14 76l8-12h76l8 12M30 76l4-12M50 76l2-12M70 76l-2-12M90 76l-4-12",
  hull: "M36 30c12 0 20 10 20 22S48 78 36 78 16 64 16 52s8-22 20-22Zm0 4c-4 8 6 18 0 40M84 30c12 0 20 10 20 22S96 78 84 78 64 64 64 52s8-22 20-22Zm0 4c-4 8 6 18 0 40M60 72c10 0 16 8 16 16s-6 16-16 16-16-8-16-16 6-16 16-16Zm0 3c-3 6 4 12 0 26",
  roast: "M60 34a30 30 0 1 1 0 60 30 30 0 0 1 0-60ZM60 46a18 18 0 1 1 0 36 18 18 0 0 1 0-36ZM78 40V12h14v36M30 100h60M46 100c0-6 4-8 4-12M60 100c0-6 4-8 4-12M74 100c0-6 4-8 4-12",
}

function Motif({ name, className }: { name: string; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" aria-hidden="true">
      <path d={MOTIFS[name] || MOTIFS.caramel} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function StepIcon({ name }: { name: string }) {
  return (
    <svg className="ac-step-icon" viewBox="0 0 120 120" aria-hidden="true">
      <path d={STEP_ICONS[name] || STEP_ICONS.pick} fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/** Coffee bean glyph for section kickers. */
function Bean({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 40 40" aria-hidden="true">
      <ellipse cx="20" cy="20" rx="12" ry="16" transform="rotate(32 20 20)" fill="currentColor" />
      <path d="M13 9c6 6 2 14 7 20 2 2 4 3 6 3" fill="none" stroke="var(--ac-brown)" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  )
}

// ---- the page ----------------------------------------------------------------------------------

export default function AltoCoffeeTemplate({
  height = "100svh",
  preset = "antigua",
  colors,
  theme = "auto",
  fontHref = FONT_HREF,
  fonts,
  brand,
  nav = NAV,
  hero,
  crop,
  origins,
  bean,
  stick,
  limited,
  footer,
  onNavigate,
  onAddToBag,
  onSubscribe,
  className,
}: AltoCoffeeTemplateProps) {
  const uid = "ac" + React.useId().replace(/[^a-zA-Z0-9]/g, "")
  const pal = { ...PRESETS[preset] || PRESETS.antigua, ...(colors || {}) }
  const brandName = brand?.name || "ALTO"
  const BRAND = brandName.toUpperCase()

  const H = {
    title: hero?.title || (["Guatemala", "Antigua"] as [string, string]),
    peak: hero?.peak || { name: "Volcán de Agua", altitude: 3760 },
    farm: hero?.farmAltitude ?? 1560,
    coords: hero?.coords || "14.47° N · 90.74° W",
    soil: hero?.soil || "Coffee grown on deep volcanic soil",
    caption: hero?.caption || "Shade-grown under grevillea on the lower slopes, where cool nights slow the cherries down and the ash keeps the roots fed.",
    snow: hero?.snow ?? preset === "huila",
    smoke: hero?.smoke ?? preset === "antigua",
    fieldImage: hero?.fieldImage,
  }
  const C = {
    year: crop?.year || "2026",
    title: crop?.title || "New Crop",
    body: crop?.body || "The first lots of the 2026 harvest: picked January to March on the slopes above Antigua, shipped in GrainPro and roasted within twenty-one days of landing.",
    stats: crop?.stats || [
      { value: "1,560 m", label: "Grown at" },
      { value: "Bourbon · Caturra", label: "Varietals" },
      { value: "86.5", label: "Cupping score" },
    ],
  }
  const O = {
    kicker: origins?.kicker || "One origin a year",
    title: origins?.title || "The Finest Origins.",
    intro: origins?.intro || "Every year we follow one harvest from the farm to the roaster. Scroll to fly the route.",
    steps: origins?.steps?.length ? origins.steps : ORIGINS,
  }
  const B = {
    title: bean?.title || ([BRAND, "BEAN"] as [string, string]),
    kicker: bean?.kicker || "Whole bean",
    lead: bean?.lead || "The single origin, roasted for the new crop",
    body: bean?.body || "Medium roast, rested five days before it ships. Grind it fresh for filter, espresso or a moka pot: the caramel holds in every one.",
    bags: bean?.bags?.length ? bean.bags : BAGS,
    notes: bean?.notes?.length ? bean.notes : NOTES,
    profile: bean?.profile?.length ? bean.profile : PROFILE,
    score: bean?.score || "86.5",
    stepsTitle: bean?.stepsTitle || "From the patio to your grinder",
    steps: bean?.steps?.length ? bean.steps : STEPS,
  }
  const S = {
    title: stick?.title || ([BRAND, "STICK"] as [string, string]),
    kicker: stick?.kicker || "Instant, done properly",
    lead: stick?.lead || "The same beans, brewed at origin strength and freeze-dried. Tear, pour, stir: a real cup in three seconds.",
    blends: stick?.blends?.length ? stick.blends : BLENDS,
  }
  const L = {
    kicker: limited?.kicker || C.year + " Limited edition",
    title: limited?.title || "The new crop, while it lasts",
    lot: limited?.lot || "Lot 26-A · Finca La Ceniza",
    total: limited?.total ?? 3000,
    left: limited?.left ?? 1284,
    currency: limited?.currency || "$",
    products: limited?.products?.length ? limited.products : PRODUCTS,
  }
  const F = {
    line: footer?.line || "From the slope of a volcano to your cup.",
    columns: footer?.columns || FOOTER_COLUMNS,
    legal: footer?.legal || "© " + C.year + " " + brandName + " Coffee Roasters. Roasted to order, shipped within 48 hours.",
    social: footer?.social || SOCIAL,
  }

  const steps = O.steps
  const lastStep = steps.length - 1

  // ---- state -------------------------------------------------------------------------------------
  const [clouds, setClouds] = React.useState(["", "", ""])
  const [grain, setGrain] = React.useState("")
  const [solid, setSolid] = React.useState(false)
  const [active, setActive] = React.useState("")
  const [menu, setMenu] = React.useState(false)
  const [step, setStep] = React.useState(lastStep)
  const [blend, setBlend] = React.useState(0)
  const [brewed, setBrewed] = React.useState(false)
  const [brewing, setBrewing] = React.useState(false)
  const [note, setNote] = React.useState(-1)
  const [axis, setAxis] = React.useState(-1)
  const [qty, setQty] = React.useState(() => L.products.map(() => 1))
  const [added, setAdded] = React.useState(-1)
  const [bag, setBag] = React.useState(0)
  const [left, setLeft] = React.useState(L.left)
  const [email, setEmail] = React.useState("")
  const [mail, setMail] = React.useState("idle" as "idle" | "bad" | "ok")

  const rootRef = React.useRef(null as HTMLDivElement | null)
  const ctxRef = React.useRef(null as gsap.Context | null)
  const stepRef = React.useRef(lastStep)
  const introRef = React.useRef(false)
  const [intro, setIntro] = React.useState(false)
  const mapNav = React.useRef(null as null | { go: (i: number) => void })
  const pillRef = React.useRef(null as HTMLButtonElement | null)
  const flyRef = React.useRef(null as HTMLDivElement | null)
  const addedTimer = React.useRef(0)

  // ---- generated textures: clouds and grain, once, before the first paint ----------------------
  useIso(() => {
    try {
      setClouds([paintClouds(880, 300, 3, 0.35), paintClouds(880, 300, 8, 0.6), paintClouds(880, 300, 21, 0.85)])
      setGrain(paintGrain())
    } catch {
      // a locked-down canvas leaves the sky clear; the page still reads
    }
  }, [])

  // ---- scroll helpers ----------------------------------------------------------------------------
  const scrollToSec = React.useCallback(
    (href: string) => {
      const root = rootRef.current
      if (href.charAt(0) !== "#" || !root) {
        onNavigate?.(href)
        return
      }
      const el = root.querySelector('[data-sec="' + href.slice(1) + '"]') as HTMLElement | null
      setMenu(false)
      if (!el) {
        onNavigate?.(href)
        return
      }
      const top = el.getBoundingClientRect().top + window.scrollY - (href === "#top" ? 0 : 56)
      window.scrollTo({ top, behavior: prefersReduced() ? "auto" : "smooth" })
      onNavigate?.(href)
    },
    [onNavigate],
  )

  const link = (href: string) => (e: React.MouseEvent) => {
    e.preventDefault()
    scrollToSec(href)
  }

  // ---- motion --------------------------------------------------------------------------------------
  useIso(() => {
    const root = rootRef.current
    if (!root) return
    const q = (s: string) => root.querySelector(s) as HTMLElement | null
    const qa = (s: string) => Array.from(root.querySelectorAll(s)) as HTMLElement[]
    const cleanups: (() => void)[] = []

    const ctx = gsap.context(() => {
      // header turns solid once the hero is behind it; nav follows the section in view
      ScrollTrigger.create({
        trigger: q(".ac-hero"),
        start: "bottom top+=72",
        onEnter: () => setSolid(true),
        onLeaveBack: () => setSolid(false),
      })
      for (const sec of qa("[data-nav]")) {
        ScrollTrigger.create({
          trigger: sec,
          start: "top 50%",
          end: "bottom 50%",
          onToggle: (self) => self.isActive && setActive(sec.getAttribute("data-nav") || ""),
          onLeaveBack: () => sec.getAttribute("data-nav") === "origins" && setActive(""),
        })
      }

      // ---- the origins map: a camera over the dot grid and one morphing country ----------
      const svg = q(".ac-map-svg") as unknown as SVGSVGElement | null
      const morph = q(".ac-map-morph") as unknown as SVGPathElement | null
      const pin = q(".ac-map-pin")
      const stage = q(".ac-map-stage")
      const shapes = steps.map(countryOf)
      const cam = { x: 0, y: 0, w: MAP_W, h: MAP_H }
      const aspect = () => (stage ? stage.clientWidth / Math.max(1, stage.clientHeight) : 16 / 9)
      const camAt = (i: number) => {
        const a = aspect()
        if (i < 0) return cameraFor([150, 70, 820, 300], a, a < 1 ? 520 : 760, 1)
        const c = cameraFor(shapes[i].box, a, a < 1 ? 150 : 260, a < 1 ? 3 : 4.4)
        // on wide stages the detail card sits left, so the country sits right of centre
        if (a > 1.15) c[0] -= c[2] * 0.14
        else c[1] += c[3] * 0.1
        return c
      }
      const apply = () => {
        if (!svg || !stage) return
        const vb = [cam.x, cam.y, cam.w, cam.h]
        svg.setAttribute("viewBox", vb.map((v) => v.toFixed(2)).join(" "))
        const zoom = MAP_W / cam.w
        svg.style.setProperty("--dot", (1.4 + Math.sqrt(zoom) * 1.5).toFixed(2) + "px")
        if (morph && pin) {
          const bb = morph.getBBox()
          const [sx, sy] = toScreen(bb.x + bb.width / 2, bb.y + bb.height / 2, vb, stage.clientWidth, stage.clientHeight)
          pin.style.transform = "translate(" + sx.toFixed(1) + "px," + sy.toFixed(1) + "px)"
        }
      }
      const setCam = (c: number[]) => {
        cam.x = c[0]
        cam.y = c[1]
        cam.w = c[2]
        cam.h = c[3]
        apply()
      }
      const stillMap = (i: number) => {
        if (morph) morph.setAttribute("d", shapes[Math.max(0, i)].d)
        gsap.set(morph, { scale: 1, opacity: 1 })
        setCam(camAt(Math.max(0, i)))
      }

      const mm = gsap.matchMedia()
      mm.add(REDUCE, () => {
        stillMap(stepRef.current)
        mapNav.current = {
          go: (i) => {
            stepRef.current = i
            setStep(i)
            stillMap(i)
          },
        }
        const onResize = () => stillMap(stepRef.current)
        window.addEventListener("resize", onResize)
        return () => window.removeEventListener("resize", onResize)
      })

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // ---- hero: the descent ----------------------------------------------------------
        const altEls = qa("[data-alt]")
        const marker = q(".ac-hud-mark")
        const peakAlt = H.peak.altitude
        const farm = H.farm
        const writeAlt = (p: number) => {
          const e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2
          const v = groupThousands(peakAlt - (peakAlt - farm) * e)
          for (const el of altEls) el.textContent = v
          if (marker) marker.style.transform = "translateY(" + (e * 100).toFixed(2) + "%)"
        }
        gsap.from(qa(".ac-hero-char"), { yPercent: 110, opacity: 0, duration: 1.1, ease: "power4.out", stagger: 0.035, delay: 0.15 })
        gsap.from(q(".ac-peak"), { yPercent: 6, scale: 1.04, duration: 1.8, ease: "power3.out" })
        gsap.from(q(".ac-hud-read"), { opacity: 0, x: 20, duration: 1, delay: 0.8, ease: "power3.out" })

        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: { trigger: q(".ac-hero"), start: "top top", end: "bottom bottom", scrub: 0.7 },
          onUpdate: () => writeAlt(Math.min(1, Math.max(0, (tl.time() - 0.6) / 5.4))),
        })
        tl.to(q(".ac-hero-title"), { yPercent: -60, opacity: 0, duration: 2.2, ease: "power1.in" }, 0.6)
          .to(q(".ac-hero-cue"), { opacity: 0, duration: 0.6 }, 0)
          .to(q(".ac-peak"), { yPercent: -16, scale: 1.4, duration: 5.5 }, 0)
          .to(q(".ac-far"), { yPercent: -9, duration: 5.5 }, 0)
          .to(q(".ac-sun"), { yPercent: -60, duration: 5.5 }, 0)
          .fromTo(q(".ac-cloud-back"), { yPercent: 6 }, { yPercent: -60, duration: 5.5 }, 0)
          .fromTo(q(".ac-cloud-mid"), { yPercent: 28 }, { yPercent: -70, duration: 5.5 }, 0)
          .fromTo(q(".ac-cloud-front"), { yPercent: 62, scale: 1 }, { yPercent: -40, scale: 1.6, duration: 5.5 }, 0)
          .to(q(".ac-veil"), { opacity: 1, duration: 1.6, ease: "power1.in" }, 2.4)
          .fromTo(q(".ac-alt-cap"), { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 1.2, ease: "power2.out" }, 3.4)
          .set([q(".ac-peak"), q(".ac-far"), q(".ac-sun")], { opacity: 0 }, 4.6)
          .set(qa(".ac-cloud"), { opacity: 0 }, 4.6)
          .set(q(".ac-field"), { opacity: 1 }, 4.6)
          .to(q(".ac-alt-cap"), { opacity: 0, y: -50, duration: 1, ease: "power2.in" }, 5.6)
          .fromTo(q(".ac-field"), { yPercent: 55, scale: 1.25 }, { yPercent: 0, scale: 1, duration: 2.8, ease: "power2.out" }, 5.2)
          .to(q(".ac-veil"), { opacity: 0, duration: 1.8, ease: "power1.out" }, 5.4)
          .fromTo(q(".ac-field-cap"), { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 1, ease: "power2.out" }, 7.2)
          .to(q(".ac-hud"), { color: "#ffffff", duration: 0.6 }, 5.4)
          .to({}, { duration: 1.6 }, 8.2)
        writeAlt(0)

        // ---- new crop ----------------------------------------------------------------
        gsap.from(qa(".ac-crop-char"), {
          yPercent: 105,
          duration: 1,
          ease: "power4.out",
          stagger: 0.04,
          scrollTrigger: { trigger: q(".ac-crop"), start: "top 70%" },
        })
        gsap.fromTo(
          q(".ac-cherry-wrap"),
          { scale: 0.45, rotate: -24, yPercent: 30 },
          { scale: 1, rotate: 0, yPercent: 0, ease: "none", scrollTrigger: { trigger: q(".ac-crop"), start: "top 90%", end: "center 45%", scrub: 0.8 } },
        )
        gsap.from(qa(".ac-cherries .ac-cherry"), {
          scale: 0,
          transformOrigin: "50% 50%",
          duration: 0.7,
          ease: "back.out(2)",
          stagger: 0.07,
          scrollTrigger: { trigger: q(".ac-crop"), start: "top 55%" },
        })
        const crop = q(".ac-crop")
        const wrap = q(".ac-cherry-lean")
        if (crop && wrap && window.matchMedia("(pointer: fine)").matches) {
          const qx = gsap.quickTo(wrap, "x", { duration: 0.9, ease: "power3.out" })
          const qy = gsap.quickTo(wrap, "y", { duration: 0.9, ease: "power3.out" })
          const qr = gsap.quickTo(wrap, "rotate", { duration: 1.2, ease: "power3.out" })
          const onMove = (e: PointerEvent) => {
            const r = crop.getBoundingClientRect()
            const nx = (e.clientX - r.left) / r.width - 0.5
            const ny = (e.clientY - r.top) / r.height - 0.5
            qx(nx * 40)
            qy(ny * 26)
            qr(nx * 8)
          }
          const onLeave = () => {
            qx(0)
            qy(0)
            qr(0)
          }
          crop.addEventListener("pointermove", onMove)
          crop.addEventListener("pointerleave", onLeave)
          cleanups.push(() => {
            crop.removeEventListener("pointermove", onMove)
            crop.removeEventListener("pointerleave", onLeave)
          })
        }

        // ---- origins map --------------------------------------------------------------
        if (svg && morph && stage) {
          morph.setAttribute("d", shapes[0].d)
          gsap.set(morph, { scale: 0, opacity: 0, transformOrigin: "50% 50%" })
          setCam(camAt(-1))
          stepRef.current = -1
          setStep(-1)
          introRef.current = true
          setIntro(true)
          const arrivals: number[] = []
          const mt = gsap.timeline({ defaults: { ease: "power2.inOut" }, onUpdate: () => syncStep() })
          mt.to({}, { duration: 0.7 })
          for (let i = 0; i < shapes.length; i++) {
            if (i === 0) {
              mt.to(cam, { x: () => camAt(0)[0], y: () => camAt(0)[1], w: () => camAt(0)[2], h: () => camAt(0)[3], duration: 1.1, onUpdate: apply })
              mt.to(morph, { scale: 1, opacity: 1, duration: 0.6, ease: "back.out(1.6)" }, "-=0.5")
            } else {
              const at = mt.duration()
              const mid = () => {
                const a = camAt(i - 1)
                const b = camAt(i)
                const w = Math.max(a[2], b[2], Math.abs(b[0] - a[0]) * 1.5)
                const h = w / aspect()
                return [(a[0] + a[2] / 2 + b[0] + b[2] / 2) / 2 - w / 2, (a[1] + a[3] / 2 + b[1] + b[3] / 2) / 2 - h / 2, w, h]
              }
              mt.to(cam, { x: () => mid()[0], y: () => mid()[1], w: () => mid()[2], h: () => mid()[3], duration: 0.6, ease: "power2.in", onUpdate: apply }, at)
              mt.to(cam, { x: () => camAt(i)[0], y: () => camAt(i)[1], w: () => camAt(i)[2], h: () => camAt(i)[3], duration: 0.7, ease: "power2.out", onUpdate: apply })
              mt.to(morph, { morphSVG: { shape: shapes[i].d, type: "rotational" }, duration: 1.2, ease: "power1.inOut", onUpdate: apply }, at + 0.05)
            }
            arrivals.push(mt.duration())
            mt.to({}, { duration: 0.9 })
          }
          const st = ScrollTrigger.create({
            trigger: q(".ac-origins"),
            start: "top top",
            end: "bottom bottom",
            animation: mt,
            scrub: 0.8,
            invalidateOnRefresh: true,
          })
          function syncStep() {
              const t = mt.time()
              let i = -1
              for (let k = 0; k < arrivals.length; k++) if (t >= arrivals[k] - (k === 0 ? 0.75 : 0.62)) i = k
              const lead = t < 0.75
              if (lead !== introRef.current) {
                introRef.current = lead
                setIntro(lead)
              }
              if (i !== stepRef.current) {
                stepRef.current = i
                setStep(i)
              }
          }
          mapNav.current = {
            go: (i) => {
              const top = st.start + ((arrivals[i] + 0.3) / mt.duration()) * (st.end - st.start)
              window.scrollTo({ top, behavior: "smooth" })
            },
          }
          const onResize = () => apply()
          window.addEventListener("resize", onResize)
          cleanups.push(() => window.removeEventListener("resize", onResize))
        }

        // ---- bean -----------------------------------------------------------------------
        for (const el of qa(".ac-outline")) {
          gsap.fromTo(el.children, { "--fill": "0%" }, { "--fill": "100%", ease: "none", stagger: 0.5, scrollTrigger: { trigger: el, start: "top 80%", end: "bottom 30%", scrub: 0.6 } })
        }
        gsap.from(qa(".ac-pack"), {
          y: 120,
          rotate: (i: number) => (i % 2 ? 8 : -8),
          opacity: 0,
          duration: 1.2,
          ease: "power3.out",
          stagger: 0.14,
          clearProps: "transform,opacity",
          scrollTrigger: { trigger: q(".ac-packs"), start: "top 80%" },
        })
        for (const card of qa(".ac-pack")) {
          const art = card.querySelector(".ac-pack-tilt") as HTMLElement | null
          if (!art || !window.matchMedia("(pointer: fine)").matches) continue
          const rx = gsap.quickTo(art, "rotationX", { duration: 0.6, ease: "power3.out" })
          const ry = gsap.quickTo(art, "rotationY", { duration: 0.6, ease: "power3.out" })
          const onMove = (e: PointerEvent) => {
            const r = card.getBoundingClientRect()
            ry(((e.clientX - r.left) / r.width - 0.5) * 26)
            rx(-((e.clientY - r.top) / r.height - 0.5) * 18)
            card.style.setProperty("--gx", (((e.clientX - r.left) / r.width) * 100).toFixed(1) + "%")
          }
          const onLeave = () => {
            rx(0)
            ry(0)
          }
          card.addEventListener("pointermove", onMove)
          card.addEventListener("pointerleave", onLeave)
          cleanups.push(() => {
            card.removeEventListener("pointermove", onMove)
            card.removeEventListener("pointerleave", onLeave)
          })
        }
        gsap.from(qa(".ac-note"), {
          y: 90,
          opacity: 0,
          duration: 1,
          ease: "power3.out",
          stagger: 0.1,
          clearProps: "transform,opacity",
          scrollTrigger: { trigger: q(".ac-notes"), start: "top 80%" },
        })
        gsap.from(q(".ac-radar-shape"), {
          scale: 0,
          transformOrigin: "50% 50%",
          duration: 1.4,
          ease: "elastic.out(1, 0.6)",
          scrollTrigger: { trigger: q(".ac-radar"), start: "top 75%" },
        })
        gsap.from(q(".ac-bean-spin"), { rotate: -200, ease: "none", scrollTrigger: { trigger: q(".ac-bean-lead"), start: "top bottom", end: "bottom top", scrub: 1 } })

        // farm-to-cup: vertical scroll moves the strip sideways (sticky stage, no pin)
        const track = q(".ac-strip-track")
        const stripStage = q(".ac-strip-stage")
        if (track && stripStage) {
          gsap.to(track, {
            x: () => -Math.max(0, track.scrollWidth - stripStage.clientWidth),
            ease: "none",
            scrollTrigger: { trigger: q(".ac-strip"), start: "top top", end: "bottom bottom", scrub: 0.6, invalidateOnRefresh: true },
          })
          gsap.fromTo(q(".ac-strip-bar i"), { scaleX: 0 }, { scaleX: 1, ease: "none", scrollTrigger: { trigger: q(".ac-strip"), start: "top top", end: "bottom bottom", scrub: 0.6 } })
        }

        // ---- stick ----------------------------------------------------------------------------
        gsap.from(qa(".ac-fan-stick"), {
          y: 220,
          rotate: 0,
          opacity: 0,
          duration: 1.2,
          ease: "power3.out",
          stagger: 0.1,
          scrollTrigger: { trigger: q(".ac-fan"), start: "top 80%" },
          clearProps: "transform,opacity",
        })

        // ---- limited ----------------------------------------------------------------------------
        gsap.from(qa(".ac-product"), { y: 80, opacity: 0, duration: 1, ease: "power3.out", stagger: 0.12, clearProps: "transform,opacity", scrollTrigger: { trigger: q(".ac-products"), start: "top 80%" } })
        gsap.from(q(".ac-lot-bar i"), { scaleX: 0, duration: 1.6, ease: "power3.inOut", scrollTrigger: { trigger: q(".ac-lot"), start: "top 85%" } })

        // ---- footer: the mark draws itself ------------------------------------------------------
        const outline = q(".ac-foot-outline") as unknown as SVGPathElement | null
        if (outline) {
          const len = outline.getTotalLength()
          gsap.set(outline, { strokeDasharray: len, strokeDashoffset: len })
          const ft = gsap.timeline({ scrollTrigger: { trigger: q(".ac-foot"), start: "top 75%" } })
          ft.to(outline, { strokeDashoffset: 0, duration: 1.6, ease: "power2.inOut" })
            .from(q(".ac-foot-fill"), { opacity: 0, duration: 0.8 }, "-=0.5")
            .from(q(".ac-foot-handle"), { opacity: 0, x: -8, duration: 0.6 }, "-=0.6")
        }

        // generic reveals
        for (const el of qa("[data-rise]")) {
          gsap.from(el, { y: 50, opacity: 0, duration: 1, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 88%" } })
        }
      })
    }, root)
    ctxRef.current = ctx
    const refresh = () => ScrollTrigger.refresh()
    const t = window.setTimeout(refresh, 400)
    document.fonts?.ready.then(refresh).catch(() => {})
    return () => {
      window.clearTimeout(t)
      for (const fn of cleanups) fn()
      ctx.revert()
      ctxRef.current = null
      mapNav.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [steps.length, H.peak.altitude, H.farm])

  // ---- brew a stick -------------------------------------------------------------------------------
  const brew = () => {
    const root = rootRef.current
    if (!root || brewing) return
    const liquid = root.querySelector(".ac-liquid")
    const surface = root.querySelector(".ac-surface")
    const pour = root.querySelector(".ac-pour")
    const grains = root.querySelectorAll(".ac-granule")
    const steam = root.querySelectorAll(".ac-steam path")
    if (prefersReduced() || !ctxRef.current) {
      gsap.set(liquid, { attr: { y: 96 } })
      gsap.set(surface, { attr: { cy: 96, rx: 84, ry: 15 }, opacity: 1 })
      setBrewed(true)
      return
    }
    setBrewing(true)
    ctxRef.current.add(() => {
      const tl = gsap.timeline()
      tl.set(liquid, { attr: { y: 244 } })
        .set(surface, { attr: { cy: 226, rx: 50, ry: 6 }, opacity: 1 })
        .set(steam, { opacity: 0 })
        .fromTo(pour, { opacity: 0, y: -40, rotate: 0, svgOrigin: "130 20" }, { opacity: 1, y: 0, rotate: 160, svgOrigin: "130 20", duration: 0.6, ease: "power3.out" })
        .fromTo(grains, { y: 0, opacity: 0 }, { y: 110, opacity: 1, duration: 0.55, ease: "power2.in", stagger: { each: 0.05, repeat: 1 } }, "-=0.1")
        .to(grains, { opacity: 0, duration: 0.15 })
        .to(pour, { opacity: 0, y: -50, rotate: 190, svgOrigin: "130 20", duration: 0.4, ease: "power2.in" })
        .to(liquid, { attr: { y: 96 }, duration: 1.3, ease: "power2.out" }, "-=0.3")
        .to(surface, { attr: { cy: 96, rx: 84, ry: 15 }, duration: 1.3, ease: "power2.out" }, "<")
        .call(() => {
          setBrewing(false)
          setBrewed(true)
        })
        .fromTo(steam, { opacity: 0, y: 10 }, { opacity: 0.7, y: -16, duration: 1.4, stagger: 0.25, ease: "sine.out" }, "-=0.4")
        .to(steam, { opacity: 0, y: -40, duration: 1.2, stagger: 0.25 })
    })
  }

  const pickBlend = (i: number) => {
    setBlend(i)
  }

  // ---- add to bag: a dot flies from the button into the header ----------------------------------------
  const addToBag = (i: number, e: React.MouseEvent) => {
    const p = L.products[i]
    const n = qty[i]
    setBag((b) => b + n)
    setLeft((l) => Math.max(0, l - n))
    setAdded(i)
    window.clearTimeout(addedTimer.current)
    addedTimer.current = window.setTimeout(() => setAdded(-1), 1800)
    onAddToBag?.(p, n)
    const dot = flyRef.current
    const pill = pillRef.current
    if (!dot || !pill || prefersReduced() || !ctxRef.current) return
    const from = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const to = pill.getBoundingClientRect()
    ctxRef.current.add(() => {
      gsap.killTweensOf(dot)
      gsap.set(dot, { x: from.left + from.width / 2 - 9, y: from.top + from.height / 2 - 9, scale: 1, opacity: 1 })
      gsap.to(dot, { x: to.left + to.width - 22, duration: 0.8, ease: "power1.inOut" })
      gsap.to(dot, { y: to.top + to.height / 2 - 9, duration: 0.8, ease: "back.in(1.3)" })
      gsap.to(dot, { scale: 0.4, opacity: 0, duration: 0.2, delay: 0.75 })
      gsap.fromTo(pill, { scale: 1 }, { scale: 1.14, duration: 0.18, delay: 0.78, yoyo: true, repeat: 1, ease: "power2.out" })
    })
  }

  const subscribe = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isEmail(email)) {
      setMail("bad")
      return
    }
    setMail("ok")
    onSubscribe?.(email.trim())
  }

  React.useEffect(() => () => window.clearTimeout(addedTimer.current), [])

  const dots = React.useMemo(() => decodeDots(LAND, 1.5).d, [])
  const shapes = steps.map(countryOf)
  const cur = step >= 0 ? steps[step] : null
  const curBlend = S.blends[Math.min(blend, S.blends.length - 1)]
  const lotPct = L.total > 0 ? Math.max(0, Math.min(1, left / L.total)) : 0

  const style = {
    "--h": height,
    "--ac-accent": pal.accent,
    "--ac-cream": pal.cream,
    "--ac-brown": pal.brown,
    "--ac-deep": pal.deep,
    "--ac-ink": pal.ink,
    "--ac-crop": pal.crop,
    "--ac-skyTop": pal.skyTop,
    "--ac-skyBottom": pal.skyBottom,
    "--ac-peak": pal.peak,
    "--ac-peakShade": pal.peakShade,
    "--ac-ridge": pal.ridge,
    "--ac-leaf": pal.leaf,
    "--ac-leafDark": pal.leafDark,
    "--ac-sans": fonts?.sans || SANS,
    "--ac-grain": grain ? "url(" + grain + ")" : "none",
  } as React.CSSProperties

  const chars = (text: string, cls: string) =>
    Array.from(text).map((ch, i) => (
      <span key={i} className={cls} aria-hidden="true">
        {ch === " " ? " " : ch}
      </span>
    ))

  return (
    <div
      ref={rootRef}
      className={"ac-root" + (theme === "dark" ? " ac-dark" : theme === "light" ? " ac-light" : "") + (className ? " " + className : "")}
      style={style}
    >
      <style>{CSS}</style>
      {fontHref && <link rel="stylesheet" href={fontHref} />}
      <div className="ac-page">
        {/* ---- header ---- */}
        <header className={"ac-head" + (solid ? " is-solid" : "")}>
          <a className="ac-logo" href="#top" onClick={link("#top")} aria-label={brandName + " home"}>
            <AltoMark size={30} className="ac-logo-mark" />
            <span>{BRAND}</span>
          </a>
          <nav className="ac-nav" aria-label="Sections">
            {nav.map((l) => (
              <a key={l.href + l.label} href={l.href} onClick={link(l.href)} aria-current={active === l.href.slice(1) ? "true" : undefined}>
                {l.label}
              </a>
            ))}
          </nav>
          <div className="ac-head-end">
            <button ref={pillRef} type="button" className="ac-pill" onClick={() => scrollToSec("#limited")} aria-label={"Bag, " + bag + " items"}>
              <span>Bag</span>
              <b aria-live="polite">{bag}</b>
            </button>
            <button type="button" className="ac-burger" aria-expanded={menu} aria-label="Menu" onClick={() => setMenu((m) => !m)}>
              <i />
              <i />
            </button>
          </div>
          <div className={"ac-menu" + (menu ? " is-open" : "")} hidden={!menu}>
            {nav.map((l) => (
              <a key={l.href + l.label} href={l.href} onClick={link(l.href)}>
                {l.label}
              </a>
            ))}
          </div>
        </header>

        {/* ---- hero: the descent ---- */}
        <section className="ac-hero" data-sec="top" aria-label={H.title.join(" ")}>
          <div className="ac-hero-stage">
            <div className="ac-sky" />
            <Stars />
            <div className="ac-sun" />
            <FarRidge smoke={H.smoke} />
            <div className="ac-cloud ac-cloud-back" style={{ opacity: clouds[0] ? 0.9 : 0 }}>
              <i style={{ backgroundImage: clouds[0] ? "url(" + clouds[0] + ")" : undefined }} />
            </div>
            <VolcanoArt snow={H.snow} uid={uid} />
            <h1 className="ac-hero-title" aria-label={H.title.join(" ")}>
              <span className="ac-line">{chars(H.title[0], "ac-hero-char")}</span>
              <span className="ac-line">{chars(H.title[1], "ac-hero-char")}</span>
            </h1>
            <div className="ac-cloud ac-cloud-mid" style={{ opacity: clouds[1] ? 1 : 0 }}>
              <i style={{ backgroundImage: clouds[1] ? "url(" + clouds[1] + ")" : undefined }} />
            </div>
            <div className="ac-cloud ac-cloud-front" style={{ opacity: clouds[2] ? 1 : 0 }}>
              <i style={{ backgroundImage: clouds[2] ? "url(" + clouds[2] + ")" : undefined }} />
            </div>
            <div className="ac-field">
              {H.fieldImage ? <Photo image={H.fieldImage} className="ac-field-photo" /> : <FieldArt uid={uid} />}
            </div>
            <div className="ac-veil" />
            <div className="ac-alt-cap">
              <p className="ac-alt-label">Altitude</p>
              <p className="ac-alt-big">
                <span data-alt>{groupThousands(H.farm)}</span>
                <small>m</small>
              </p>
              <p className="ac-alt-soil">{H.soil}</p>
            </div>
            <div className="ac-field-cap">
              <p className="ac-eyebrow">{H.title.join(" ")} · {groupThousands(H.farm)} m</p>
              <p>{H.caption}</p>
            </div>
            <div className="ac-hud" aria-hidden="true">
              <div className="ac-hud-scale">
                <span>{groupThousands(H.peak.altitude)}</span>
                <div className="ac-hud-rail">
                  <i className="ac-hud-mark" />
                </div>
                <span>{groupThousands(H.farm)}</span>
              </div>
              <div className="ac-hud-read">
                <span>
                  <b data-alt>{groupThousands(H.peak.altitude)}</b> m
                </span>
                <small>{H.peak.name}</small>
                <small>{H.coords}</small>
              </div>
            </div>
            <div className="ac-hero-cue" aria-hidden="true">
              <span>Scroll to descend</span>
              <i />
            </div>
            <div className="ac-grain" />
          </div>
        </section>

        {/* ---- new crop ---- */}
        <section className="ac-crop" data-sec="crop">
          <h2 className="ac-crop-title" aria-label={C.year + " " + C.title}>
            <span className="ac-line">{chars(C.year, "ac-crop-char")}</span>
            <span className="ac-cherry-wrap">
              <span className="ac-cherry-lean">
                <CherryArt uid={uid} />
              </span>
            </span>
            <span className="ac-line">{chars(C.title, "ac-crop-char")}</span>
          </h2>
          <p className="ac-crop-body" data-rise>
            {C.body}
          </p>
          <dl className="ac-crop-stats" data-rise>
            {C.stats.map((s) => (
              <div key={s.label}>
                <dt>{s.label}</dt>
                <dd>{s.value}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* ---- origins map ---- */}
        <section className="ac-origins" data-sec="origins" data-nav="origins" style={{ "--steps": steps.length } as React.CSSProperties} aria-label={O.title}>
          <div className="ac-map-stage">
            <svg className="ac-map-svg" viewBox={"0 0 " + MAP_W + " " + MAP_H} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
              <g className="ac-map-grat">
                {[-45, -30, -15, 0, 15, 30, 45, 60, 75].map((lat) => (
                  <line key={lat} x1="0" x2={MAP_W} y1={((84 - lat) * MAP_W) / 360} y2={((84 - lat) * MAP_W) / 360} className={lat === 0 ? "is-eq" : undefined} />
                ))}
                {Array.from({ length: 23 }, (_, k) => (k + 1) * 15).map((lon) => (
                  <line key={lon} y1="0" y2={MAP_H} x1={(lon * MAP_W) / 360} x2={(lon * MAP_W) / 360} />
                ))}
              </g>
              <path className="ac-map-dots" d={dots} />
              {shapes.map((s, i) => (
                <path key={i} className={"ac-map-ghost" + (i === step ? " is-on" : "")} d={s.d} />
              ))}
              <path className="ac-map-morph" d={shapes[Math.max(0, lastStep)].d} />
            </svg>
            <div className="ac-map-pin" aria-hidden="true" style={{ opacity: step >= 0 ? 1 : 0 }}>
              <i />
              <i />
            </div>
            <div className="ac-map-shade" />
            <div className={"ac-map-intro" + (intro ? " is-on" : "")}>
              <p className="ac-eyebrow">{O.kicker}</p>
              <h2>{O.title}</h2>
              <p>{O.intro}</p>
            </div>
            <div className="ac-map-years" role="tablist" aria-label="Origins by year">
              {steps.map((s, i) => (
                <button
                  key={s.year + i}
                  type="button"
                  role="tab"
                  aria-selected={i === step}
                  className={i === step ? "is-on" : undefined}
                  onClick={() => mapNav.current?.go(i)}
                >
                  <span>{s.year}</span>
                  <small>{s.name || shapes[i].name}</small>
                </button>
              ))}
            </div>
            {steps.map((s, i) => (
              <article key={s.year + i} className={"ac-map-card" + (i === step ? " is-on" : "")} aria-hidden={i !== step}>
                <p className="ac-map-year">{s.year}</p>
                <h3>{s.name || shapes[i].name}</h3>
                {s.blurb && <p className="ac-map-blurb">{s.blurb}</p>}
                <dl>
                  <div>
                    <dt>Region</dt>
                    <dd>{s.region}</dd>
                  </div>
                  <div>
                    <dt>Altitude</dt>
                    <dd>{s.altitude}</dd>
                  </div>
                  <div>
                    <dt>Process</dt>
                    <dd>{s.process}</dd>
                  </div>
                </dl>
                <ul>
                  {s.notes.map((n) => (
                    <li key={n}>{n}</li>
                  ))}
                </ul>
              </article>
            ))}
            <p className="ac-sr" aria-live="polite">
              {cur ? cur.year + ": " + (cur.name || shapes[step].name) + ", " + cur.region : ""}
            </p>
          </div>
        </section>

        {/* ---- bean ---- */}
        <section className="ac-bean" data-sec="bean" data-nav="bean">
          <div className="ac-packs">
            {B.bags.map((b, i) => (
              <div key={i} className="ac-pack">
                <div className="ac-pack-tilt">
                  {b.image ? <Photo image={b.image} className="ac-pack-photo" /> : <BagArt bag={b} uid={uid + "b" + i} brand={BRAND} />}
                </div>
                <p className="ac-pack-cap">
                  <b>{b.name}</b> {b.sub} · {b.weight}
                </p>
              </div>
            ))}
          </div>
          <p className="ac-pack-note" data-rise>
            {B.body}
          </p>
          <h2 className="ac-outline" aria-label={B.title.join(" ")}>
            <span aria-hidden="true">{B.title[0]}</span>
            <span aria-hidden="true">{B.title[1]}</span>
          </h2>
          <div className="ac-bean-lead" data-rise>
            <Bean className="ac-bean-spin" />
            <p className="ac-eyebrow">{C.year}</p>
            <p className="ac-lead">{B.lead}</p>
          </div>
          <div className="ac-flavor">
            <div className="ac-notes">
              {B.notes.map((n, i) => (
                <button
                  key={n.name}
                  type="button"
                  className={"ac-note" + (note === i ? " is-on" : "")}
                  style={{ "--c": n.color } as React.CSSProperties}
                  aria-pressed={note === i}
                  onClick={() => setNote(note === i ? -1 : i)}
                >
                  {n.image ? <Photo image={n.image} className="ac-note-photo" /> : <Motif name={n.motif || "caramel"} className="ac-note-motif" />}
                  <span className="ac-note-name">{n.name}</span>
                  <span className="ac-note-dots" aria-label={"Intensity " + (n.intensity || 3) + " of 5"}>
                    {[1, 2, 3, 4, 5].map((k) => (
                      <i key={k} className={k <= (n.intensity || 3) ? "is-on" : undefined} />
                    ))}
                  </span>
                  <span className="ac-note-body">{n.body}</span>
                </button>
              ))}
            </div>
            <Radar profile={B.profile} score={B.score} axis={axis} setAxis={setAxis} />
          </div>
        </section>

        <section className="ac-strip" data-sec="process" aria-label={B.stepsTitle}>
          <div className="ac-strip-stage">
            <div className="ac-strip-head">
              <p className="ac-eyebrow">Farm to cup</p>
              <h2>{B.stepsTitle}</h2>
              <div className="ac-strip-bar" aria-hidden="true">
                <i />
              </div>
            </div>
            <ol className="ac-strip-track">
              {B.steps.map((s, i) => (
                <li key={s.title} className="ac-step" data-tone={i % 4}>
                  {s.image ? <Photo image={s.image} className="ac-step-photo" /> : <StepIcon name={s.icon || "pick"} />}
                  <span className="ac-step-n">{String(i + 1).padStart(2, "0")}</span>
                  <h3>{s.title}</h3>
                  <p>{s.body}</p>
                  <b>{s.stat}</b>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ---- stick ---- */}
        <section className="ac-stick" data-sec="stick" data-nav="stick" style={{ "--blend": curBlend.color, "--crema": curBlend.crema } as React.CSSProperties}>
          <h2 className="ac-outline" aria-label={S.title.join(" ")}>
            <span aria-hidden="true">{S.title[0]}</span>
            <span aria-hidden="true">{S.title[1]}</span>
          </h2>
          <div className="ac-stick-lead" data-rise>
            <p className="ac-eyebrow">{S.kicker}</p>
            <p className="ac-lead">{S.lead}</p>
          </div>
          <div className="ac-brew">
            <div className="ac-fan" aria-hidden="true">
              <div className="ac-fan-disc" />
              {S.blends.map((b, i) => {
                const off = i - (S.blends.length - 1) / 2
                return (
                  <div
                    key={b.name}
                    className={"ac-fan-stick" + (i === blend ? " is-on" : "")}
                    style={{ "--off": off, zIndex: 10 - Math.abs(off) } as React.CSSProperties}
                    onClick={() => pickBlend(i)}
                  >
                    <StickArt color={b.color} brand={BRAND} label={b.name} />
                  </div>
                )
              })}
            </div>
            <div className="ac-brew-panel">
              <div className="ac-blends" role="radiogroup" aria-label="Blend">
                {S.blends.map((b, i) => (
                  <button
                    key={b.name}
                    type="button"
                    role="radio"
                    aria-checked={i === blend}
                    className={i === blend ? "is-on" : undefined}
                    style={{ "--c": b.color } as React.CSSProperties}
                    onClick={() => pickBlend(i)}
                  >
                    <i />
                    {b.name}
                  </button>
                ))}
              </div>
              <div className="ac-cup-row">
                <CupArt uid={uid} brewed={brewed} />
                <div className="ac-blend-info">
                  <h3>{curBlend.name}</h3>
                  <p>{curBlend.notes}</p>
                  <div className="ac-strength" aria-label={"Strength " + curBlend.strength + " of 5"}>
                    <span>Strength</span>
                    {[1, 2, 3, 4, 5].map((k) => (
                      <i key={k} className={k <= curBlend.strength ? "is-on" : undefined} />
                    ))}
                  </div>
                  <p className="ac-brew-how">{curBlend.brew}</p>
                  <button type="button" className="ac-btn" onClick={brew} disabled={brewing}>
                    {brewing ? "Brewing…" : brewed ? "Brew another" : "Brew a cup"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ---- limited ---- */}
        <section className="ac-limited" data-sec="limited" data-nav="limited">
          <div className="ac-limited-head" data-rise>
            <p className="ac-eyebrow">{L.kicker}</p>
            <h2>{L.title}</h2>
          </div>
          <div className="ac-lot" role="group" aria-label={L.lot}>
            <p>
              <span>{L.lot}</span>
              <b>
                {groupThousands(left)} of {groupThousands(L.total)} left
              </b>
            </p>
            <div className="ac-lot-bar">
              <i style={{ transform: "scaleX(" + lotPct + ")" }} />
            </div>
          </div>
          <div className="ac-products">
            {L.products.map((p, i) => (
              <article key={p.id} className="ac-product">
                <div className="ac-product-art">
                  {p.image ? (
                    <Photo image={p.image} className="ac-product-photo" />
                  ) : (
                    <BagArt bag={{ name: H.title[1], sub: "New crop " + C.year, weight: p.specs.find((s) => s[0] === "Weight")?.[1] || "", kind: p.kind === "sticks" ? "sticks" : "bag", color: p.color }} uid={uid + "p" + i} brand={BRAND} />
                  )}
                </div>
                <div className="ac-product-info">
                  <h3>{p.name}</h3>
                  <dl>
                    {p.specs.map(([k, v]) => (
                      <div key={k}>
                        <dt>{k}</dt>
                        <dd>{v}</dd>
                      </div>
                    ))}
                  </dl>
                  <div className="ac-buy">
                    <b className="ac-price">{money(p.price * qty[i], L.currency)}</b>
                    <div className="ac-qty" role="group" aria-label={"Quantity of " + p.name}>
                      <button type="button" aria-label="Fewer" onClick={() => setQty((a) => a.map((v, k) => (k === i ? clampQty(v - 1) : v)))}>
                        −
                      </button>
                      <output aria-live="polite">{qty[i]}</output>
                      <button type="button" aria-label="More" onClick={() => setQty((a) => a.map((v, k) => (k === i ? clampQty(v + 1) : v)))}>
                        +
                      </button>
                    </div>
                  </div>
                  <button type="button" className={"ac-btn ac-btn-wide" + (added === i ? " is-done" : "")} onClick={(e) => addToBag(i, e)} disabled={left <= 0}>
                    {left <= 0 ? "Sold out" : added === i ? "Added to bag ✓" : "Add to bag"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* ---- footer ---- */}
        <footer className="ac-foot" data-sec="footer">
          <svg className="ac-foot-mark" viewBox="0 0 64 64" aria-hidden="true">
            <path className="ac-foot-fill" d={MARK_CUP} fillRule="evenodd" />
            <path className="ac-foot-outline" d={MARK_CUP} />
            <path className="ac-foot-handle" d={MARK_HANDLE} />
          </svg>
          <p className="ac-foot-line">{F.line}</p>
          <form className="ac-news" onSubmit={subscribe} noValidate>
            <label htmlFor={uid + "mail"}>First roast of every harvest, in your inbox</label>
            <div>
              <input
                id={uid + "mail"}
                type="email"
                placeholder="you@example.com"
                value={email}
                aria-invalid={mail === "bad"}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (mail !== "idle") setMail("idle")
                }}
              />
              <button type="submit" className="ac-btn">
                Subscribe
              </button>
            </div>
            <p className="ac-news-msg" aria-live="polite">
              {mail === "bad" ? "That address doesn't look right." : mail === "ok" ? "You're on the list. The next harvest lands in your inbox first." : ""}
            </p>
          </form>
          <div className="ac-foot-cols">
            {F.columns.map((c) => (
              <div key={c.title}>
                <h3>{c.title}</h3>
                <ul>
                  {c.links.map((l) => (
                    <li key={l.label}>
                      <a href={l.href} onClick={link(l.href)}>
                        {l.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="ac-foot-base">
            <span className="ac-foot-word">
              <AltoMark size={22} /> {BRAND}
            </span>
            <span>{F.legal}</span>
            <span className="ac-foot-social">
              {F.social.map((l) => (
                <a key={l.label} href={l.href} onClick={link(l.href)}>
                  {l.label}
                </a>
              ))}
            </span>
          </div>
        </footer>
      </div>
      <div ref={flyRef} className="ac-fly" aria-hidden="true" />
    </div>
  )
}

// ---- cupping radar ------------------------------------------------------------------------------

function Radar({ profile, score, axis, setAxis }: { profile: { label: string; value: number }[]; score: string; axis: number; setAxis: (i: number) => void }) {
  const n = profile.length
  const R = 120
  const pt = (i: number, v: number) => {
    const a = -Math.PI / 2 + (i / n) * Math.PI * 2
    return [160 + Math.cos(a) * R * v, 160 + Math.sin(a) * R * v]
  }
  const ring = (v: number) => profile.map((_, i) => pt(i, v).map((x) => x.toFixed(1)).join(",")).join(" ")
  const shape = profile.map((p, i) => pt(i, Math.max(0, Math.min(10, p.value)) / 10).map((x) => x.toFixed(1)).join(",")).join(" ")
  return (
    <figure className="ac-radar">
      <svg viewBox="0 0 320 320" role="img" aria-label={"Cupping profile: " + profile.map((p) => p.label + " " + p.value).join(", ")}>
        {[0.25, 0.5, 0.75, 1].map((v) => (
          <polygon key={v} points={ring(v)} className="ac-radar-ring" />
        ))}
        {profile.map((_, i) => {
          const [x, y] = pt(i, 1)
          return <line key={i} x1="160" y1="160" x2={x} y2={y} className={"ac-radar-axis" + (axis === i ? " is-on" : "")} />
        })}
        <polygon points={shape} className="ac-radar-shape" />
        {profile.map((p, i) => {
          const [x, y] = pt(i, Math.max(0, Math.min(10, p.value)) / 10)
          const [lx, ly] = pt(i, 1.2)
          return (
            <g key={p.label} onPointerEnter={() => setAxis(i)} onPointerLeave={() => setAxis(-1)}>
              <circle cx={x} cy={y} r={axis === i ? 7 : 4.5} className="ac-radar-dot" />
              <text x={lx} y={ly} textAnchor={Math.abs(lx - 160) < 8 ? "middle" : lx > 160 ? "start" : "end"} dominantBaseline="middle" className={"ac-radar-label" + (axis === i ? " is-on" : "")}>
                {p.label}
                {axis === i ? " " + p.value : ""}
              </text>
            </g>
          )
        })}
      </svg>
      <figcaption>
        <b>{score}</b>
        <span>Cupping score</span>
      </figcaption>
    </figure>
  )
}

// ---- the cup in the stick section ------------------------------------------------------------------

function CupArt({ uid, brewed }: { uid: string; brewed: boolean }) {
  return (
    <svg className="ac-cup" viewBox="0 0 260 300" aria-hidden="true">
      <defs>
        <linearGradient id={uid + "cer"} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#D9D0C4" />
          <stop offset="0.35" stopColor="#FBF7F1" />
          <stop offset="0.7" stopColor="#EFE7DC" />
          <stop offset="1" stopColor="#C9BEB0" />
        </linearGradient>
        <clipPath id={uid + "in"}>
          <path d="M46 96h168l-14 118c-2 16-12 24-28 24H88c-16 0-26-8-28-24Z" />
        </clipPath>
      </defs>
      <g className="ac-pour" opacity="0">
        <g transform="translate(119 -28) scale(0.32)">
          <path d="M6 14L12 6L18 14L24 6L30 14L36 6L42 14L48 6L54 14L60 6L64 12V300H6Z" fill="var(--blend)" />
          <rect x="6" y="14" width="10" height="286" fill="#fff" opacity="0.18" />
        </g>
      </g>
      {[0, 1, 2, 3, 4, 5].map((k) => (
        <circle key={k} className="ac-granule" cx={122 + (k % 3) * 8} cy={58 + (k % 2) * 6} r="2.6" fill="#5A3622" opacity="0" />
      ))}
      <ellipse cx="130" cy="270" rx="118" ry="20" fill="#000" opacity="0.22" />
      <ellipse cx="130" cy="262" rx="112" ry="18" fill={"url(#" + uid + "cer)"} />
      <path d="M216 120c34-6 40 50 6 62" fill="none" stroke={"url(#" + uid + "cer)"} strokeWidth="13" strokeLinecap="round" />
      <path d="M40 96h180l-15 124c-2 20-16 32-36 32H91c-20 0-34-12-36-32Z" fill={"url(#" + uid + "cer)"} />
      <ellipse cx="130" cy="96" rx="90" ry="17" fill="#E8DED1" />
      <ellipse cx="130" cy="98" rx="84" ry="14" fill="#B9AC9C" />
      <g clipPath={"url(#" + uid + "in)"}>
        <rect className="ac-liquid" x="30" y={brewed ? 96 : 244} width="200" height="160" fill="#3A2216" />
      </g>
      <ellipse className="ac-surface" cx="130" cy={brewed ? 96 : 226} rx={brewed ? 84 : 50} ry={brewed ? 15 : 6} fill="var(--crema)" opacity={brewed ? 1 : 0} />
      <g className="ac-steam" fill="none" stroke="var(--ac-cream)" strokeWidth="3" strokeLinecap="round">
        <path d="M104 74c-10-14 10-22 0-38" opacity="0" />
        <path d="M130 70c-10-14 10-22 0-40" opacity="0" />
        <path d="M156 74c-10-14 10-22 0-38" opacity="0" />
      </g>
    </svg>
  )
}

// ---- styles -------------------------------------------------------------------------------------------
// Scoped to .ac-*; element resets go through :where() so they never outrank a class.

const CSS = `
.ac-root{position:relative;isolation:isolate;font-family:var(--ac-sans);color:var(--ac-cream);background:var(--ac-ink);-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility;overflow-x:clip}
:where(.ac-root) h1,:where(.ac-root) h2,:where(.ac-root) h3,:where(.ac-root) p,:where(.ac-root) dl,:where(.ac-root) dd,:where(.ac-root) ul,:where(.ac-root) ol,:where(.ac-root) figure{margin:0;padding:0}
:where(.ac-root) ul,:where(.ac-root) ol{list-style:none}
:where(.ac-root) a{color:inherit;text-decoration:none}
:where(.ac-root) button{font:inherit;color:inherit;background:none;border:0;padding:0;cursor:pointer;-webkit-tap-highlight-color:transparent}
:where(.ac-root) :focus-visible{outline:2px solid var(--ac-accent);outline-offset:3px;border-radius:4px}
.ac-page{position:relative;container-type:inline-size}
.ac-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
.ac-eyebrow{font-size:12px;font-weight:600;letter-spacing:.2em;text-transform:uppercase}
.ac-lead{font-size:clamp(24px,3.2cqi,42px);font-weight:700;line-height:1.12;letter-spacing:-.025em;max-width:18ch;margin:14px auto 0;text-wrap:balance}
.ac-photo{display:block;max-width:none;object-fit:cover}

/* header */
.ac-head{position:sticky;top:0;z-index:40;height:64px;margin-bottom:-64px;display:flex;align-items:center;justify-content:space-between;gap:16px;padding:0 clamp(16px,3cqi,40px);color:#1D1714;background:color-mix(in srgb,var(--ac-skyBottom) 62%,transparent);-webkit-backdrop-filter:blur(14px) saturate(1.2);backdrop-filter:blur(14px) saturate(1.2);transition:background .5s,color .5s}
.ac-head.is-solid{background:color-mix(in srgb,var(--ac-ink) 84%,transparent);color:var(--ac-cream)}
.ac-logo{display:inline-flex;align-items:center;gap:10px;font-weight:800;font-size:15px;letter-spacing:.2em}
.ac-logo-mark{color:var(--ac-accent);transition:transform .5s cubic-bezier(.2,.8,.2,1)}
.ac-logo:hover .ac-logo-mark{transform:rotate(-8deg) scale(1.06)}
.ac-nav{display:flex;gap:30px;font-size:13px;font-weight:600;letter-spacing:.06em}
.ac-nav a{position:relative;padding:8px 0;opacity:.72;transition:opacity .2s}
.ac-nav a:hover,.ac-nav a[aria-current]{opacity:1}
.ac-nav a::after{content:"";position:absolute;left:0;right:0;bottom:2px;height:2px;background:var(--ac-accent);transform:scaleX(0);transform-origin:left;transition:transform .35s cubic-bezier(.2,.7,.2,1)}
.ac-nav a:hover::after,.ac-nav a[aria-current]::after{transform:scaleX(1)}
.ac-head-end{display:flex;align-items:center;gap:8px}
.ac-pill{display:inline-flex;align-items:center;gap:10px;height:38px;padding:0 6px 0 16px;border-radius:99px;background:var(--ac-accent);color:#fff;font-size:13px;font-weight:700;letter-spacing:.06em;transition:transform .25s}
.ac-pill:hover{transform:translateY(-1px)}
.ac-pill b{display:grid;place-items:center;min-width:26px;height:26px;padding:0 6px;border-radius:99px;background:#fff;color:var(--ac-accent);font-size:12px;font-variant-numeric:tabular-nums}
.ac-burger{display:none;flex-direction:column;justify-content:center;gap:6px;width:40px;height:40px;padding:0 10px}
.ac-burger i{display:block;height:2px;background:currentColor;border-radius:2px;transition:transform .3s}
.ac-burger[aria-expanded="true"] i:first-child{transform:translateY(4px) rotate(45deg)}
.ac-burger[aria-expanded="true"] i:last-child{transform:translateY(-4px) rotate(-45deg)}
.ac-menu{position:absolute;top:64px;right:12px;display:flex;flex-direction:column;min-width:200px;padding:8px;border-radius:16px;background:var(--ac-ink);color:var(--ac-cream);box-shadow:0 20px 50px rgba(0,0,0,.35)}
.ac-menu[hidden]{display:none}
.ac-menu a{padding:12px 14px;border-radius:10px;font-weight:600}
.ac-menu a:hover{background:rgba(255,255,255,.07)}

/* hero */
.ac-hero{position:relative;height:calc(var(--h) * 3.6);background:var(--ac-skyBottom)}
.ac-hero-stage{position:sticky;top:0;height:var(--h);min-height:540px;overflow:hidden}
.ac-sky{position:absolute;inset:0;background:linear-gradient(180deg,var(--ac-skyTop) 0%,var(--ac-skyBottom) 70%)}
.ac-stars,.ac-far,.ac-peak,.ac-field-art{position:absolute;left:0;bottom:0;width:100%;height:100%;max-width:none}
.ac-stars{opacity:0}
.ac-peak{transform-origin:50% 62%}
.ac-sun{position:absolute;right:14%;top:9%;width:min(30cqi,340px);aspect-ratio:1;border-radius:50%;background:radial-gradient(circle,rgba(255,251,240,.96) 0 14%,rgba(255,244,222,.42) 34%,rgba(255,244,222,0) 68%)}
.ac-smoke{animation:ac-smoke 7s ease-in-out infinite alternate}
@keyframes ac-smoke{from{transform:translate(0,0);opacity:.85}to{transform:translate(14px,-10px);opacity:1}}
.ac-cloud{position:absolute;left:0;right:0;pointer-events:none;transition:opacity 1s}
.ac-cloud i{position:absolute;top:0;left:0;bottom:0;width:200%;background-repeat:repeat-x;background-size:50% 100%;animation:ac-drift 120s linear infinite}
.ac-cloud-back{bottom:30%;height:34%}
.ac-cloud-mid{bottom:2%;height:44%}
.ac-cloud-mid i{animation-duration:90s;animation-direction:reverse}
.ac-cloud-front{bottom:-16%;height:60%;transform-origin:50% 100%}
.ac-cloud-front i{animation-duration:70s}
@keyframes ac-drift{to{transform:translateX(-50%)}}
.ac-hero-title{position:absolute;left:0;right:0;top:27%;z-index:1;text-align:center;color:#fff;font-weight:800;font-stretch:86%;font-size:clamp(52px,10.4cqi,170px);line-height:.88;letter-spacing:-.04em;text-shadow:0 6px 40px rgba(24,34,44,.28)}
.ac-line{display:block;overflow:hidden;padding:0 .04em .08em}
.ac-hero-char,.ac-crop-char{display:inline-block;will-change:transform}
.ac-field{position:absolute;inset:0;opacity:0;transform-origin:50% 100%}
.ac-field::after{content:"";position:absolute;left:0;right:0;bottom:0;height:46%;background:linear-gradient(0deg,rgba(8,18,10,.62),rgba(8,18,10,0))}
.ac-field-photo{position:absolute;inset:0;width:100%;height:100%}
.ac-veil{position:absolute;inset:0;opacity:0;pointer-events:none;background:radial-gradient(ellipse at 50% 52%,#fff 0 38%,var(--ac-skyBottom) 100%)}
.ac-alt-cap{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:0 16px;text-align:center;color:#2A2420;opacity:0;pointer-events:none}
.ac-alt-label{font-size:12px;font-weight:600;letter-spacing:.3em;text-transform:uppercase;opacity:.6}
.ac-alt-big{font-weight:200;font-stretch:118%;font-size:clamp(76px,15cqi,236px);line-height:1;letter-spacing:-.03em;font-variant-numeric:tabular-nums;margin:6px 0 10px}
.ac-alt-big small{font-size:.3em;font-weight:500;letter-spacing:0;margin-left:.12em}
.ac-alt-soil{font-size:clamp(16px,1.7cqi,22px);font-weight:700;letter-spacing:-.01em;color:var(--ac-accent)}
.ac-field-cap{position:absolute;left:clamp(16px,5cqi,80px);bottom:clamp(28px,6cqi,80px);max-width:440px;color:#fff;opacity:0;text-shadow:0 1px 24px rgba(0,0,0,.35)}
.ac-field-cap p:last-child{margin-top:12px;font-size:clamp(16px,1.5cqi,19px);line-height:1.55}
.ac-hud{position:absolute;right:clamp(16px,3cqi,44px);top:50%;transform:translateY(-50%);display:flex;align-items:center;gap:16px;color:#1F1A17;pointer-events:none}
.ac-hud-scale{display:flex;flex-direction:column;align-items:center;gap:8px;font-size:10px;font-weight:600;letter-spacing:.12em;font-variant-numeric:tabular-nums}
.ac-hud-rail{position:relative;width:12px;height:min(26vh,220px);background:repeating-linear-gradient(180deg,currentColor 0 1px,transparent 1px 11px);opacity:.9}
.ac-hud-mark{position:absolute;left:-7px;right:-7px;top:0;height:100%}
.ac-hud-mark::before{content:"";position:absolute;left:0;right:0;top:-1px;height:3px;background:currentColor}
.ac-hud-read{display:flex;flex-direction:column;font-size:12px;font-weight:600;letter-spacing:.06em}
.ac-hud-read b{font-size:30px;font-weight:300;font-stretch:112%;letter-spacing:-.01em;font-variant-numeric:tabular-nums}
.ac-hud-read small{font-size:10px;letter-spacing:.16em;text-transform:uppercase;opacity:.75;margin-top:4px}
.ac-hero-cue{position:absolute;left:50%;bottom:24px;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;gap:10px;color:#1F1A17;font-size:11px;font-weight:600;letter-spacing:.22em;text-transform:uppercase}
.ac-hero-cue span{animation:ac-in 1s .9s both}
@keyframes ac-in{from{opacity:0;transform:translateY(8px)}}
.ac-hero-cue i{width:1px;height:44px;background:linear-gradient(currentColor,currentColor) 0 0/1px 40% no-repeat;animation:ac-cue 1.8s cubic-bezier(.6,0,.3,1) infinite;opacity:.9}
@keyframes ac-cue{from{background-position:0 -20px}to{background-position:0 60px}}
.ac-grain{position:absolute;inset:0;pointer-events:none;background-image:var(--ac-grain);opacity:.7}

/* dark: the hero becomes a night ascent (the other bands are dark already) */
:where(.dark) .ac-root:not(.ac-light) .ac-hero,.ac-root.ac-dark .ac-hero{--ac-skyTop:#0A1322;--ac-skyBottom:#3A4859;--ac-peak:#435760;--ac-peakShade:#1D2930;--ac-ridge:#2A394A;--ac-leaf:#2C4930;--ac-leafDark:#142518}
:where(.dark) .ac-root:not(.ac-light) .ac-stars,.ac-root.ac-dark .ac-stars{opacity:.9}
:where(.dark) .ac-root:not(.ac-light) .ac-sun,.ac-root.ac-dark .ac-sun{width:min(12cqi,120px);background:radial-gradient(circle,#F3EFE4 0 34%,rgba(243,239,228,.22) 38%,rgba(243,239,228,0) 70%)}
:where(.dark) .ac-root:not(.ac-light) .ac-cloud,.ac-root.ac-dark .ac-cloud{filter:brightness(.5) saturate(.7)}
:where(.dark) .ac-root:not(.ac-light) .ac-veil,.ac-root.ac-dark .ac-veil{background:radial-gradient(ellipse at 50% 52%,#5A6676 0 38%,#2B3644 100%)}
:where(.dark) .ac-root:not(.ac-light) .ac-alt-cap,.ac-root.ac-dark .ac-alt-cap,:where(.dark) .ac-root:not(.ac-light) .ac-hud,.ac-root.ac-dark .ac-hud,:where(.dark) .ac-root:not(.ac-light) .ac-hero-cue,.ac-root.ac-dark .ac-hero-cue{color:var(--ac-cream)}
:where(.dark) .ac-root:not(.ac-light) .ac-head:not(.is-solid),.ac-root.ac-dark .ac-head:not(.is-solid){color:var(--ac-cream);background:color-mix(in srgb,#0A1322 55%,transparent)}

/* new crop */
.ac-crop{position:relative;overflow:hidden;background:var(--ac-crop);padding:clamp(96px,12cqi,180px) clamp(16px,4cqi,64px);text-align:center}
.ac-crop::before{content:"";position:absolute;inset:0;background:radial-gradient(60% 50% at 50% 42%,rgba(255,255,255,.08),transparent 70%);pointer-events:none}
.ac-crop-title{position:relative;display:flex;flex-direction:column;align-items:center;font-weight:800;font-stretch:90%;font-size:clamp(68px,15.5cqi,250px);line-height:.86;letter-spacing:-.05em;color:var(--ac-cream)}
.ac-cherry-wrap{position:relative;z-index:2;display:block;width:min(620px,70cqi);margin:-.36em 0 -.42em;pointer-events:none}
.ac-cherry-lean{display:block}
.ac-cherries{display:block;width:100%;height:auto;max-width:none;filter:drop-shadow(0 30px 34px rgba(0,0,0,.35))}
.ac-crop-body{position:relative;max-width:560px;margin:56px auto 0;font-size:17px;line-height:1.65;color:color-mix(in srgb,var(--ac-cream) 84%,transparent)}
.ac-crop-stats{position:relative;display:grid;grid-template-columns:repeat(3,1fr);max-width:900px;margin:56px auto 0;border-top:1px solid color-mix(in srgb,var(--ac-cream) 20%,transparent)}
.ac-crop-stats div{padding:22px 12px 0}
.ac-crop-stats div+div{border-left:1px solid color-mix(in srgb,var(--ac-cream) 20%,transparent)}
.ac-crop-stats dt{font-size:11px;font-weight:600;letter-spacing:.2em;text-transform:uppercase;opacity:.65}
.ac-crop-stats dd{margin-top:8px;font-size:clamp(18px,2cqi,26px);font-weight:700;letter-spacing:-.01em}

/* origins */
.ac-origins{position:relative;height:calc(var(--h) * (var(--steps) + 2));background:var(--ac-ink)}
.ac-map-stage{position:sticky;top:0;height:var(--h);min-height:580px;overflow:hidden}
.ac-map-svg{position:absolute;inset:0;width:100%;height:100%;max-width:none}
.ac-map-grat line{stroke:var(--ac-cream);stroke-opacity:.06;stroke-width:1;vector-effect:non-scaling-stroke}
.ac-map-grat line.is-eq{stroke-opacity:.18;stroke-dasharray:3 6}
.ac-map-dots{fill:none;stroke:var(--ac-cream);stroke-opacity:.24;stroke-width:var(--dot,3px);stroke-linecap:round;vector-effect:non-scaling-stroke}
.ac-map-ghost{fill:var(--ac-accent);opacity:.2;transition:opacity .5s}
.ac-map-ghost.is-on{opacity:0}
.ac-map-morph{fill:var(--ac-accent);stroke:var(--ac-accent);stroke-width:1;stroke-linejoin:round;vector-effect:non-scaling-stroke}
.ac-map-pin{position:absolute;left:0;top:0;width:0;height:0;pointer-events:none;transition:opacity .5s}
.ac-map-pin i{position:absolute;left:-46px;top:-46px;width:92px;height:92px;border-radius:50%;border:1.5px solid var(--ac-accent);animation:ac-ping 2.6s cubic-bezier(.2,.6,.3,1) infinite}
.ac-map-pin i+i{animation-delay:1.3s}
@keyframes ac-ping{from{transform:scale(.15);opacity:1}to{transform:scale(1.5);opacity:0}}
.ac-map-shade{position:absolute;inset:0;pointer-events:none;background:linear-gradient(90deg,var(--ac-ink) 0%,color-mix(in srgb,var(--ac-ink) 70%,transparent) 26%,transparent 52%),linear-gradient(0deg,var(--ac-ink) 0%,transparent 26%),linear-gradient(180deg,var(--ac-ink) 0%,transparent 18%)}
.ac-map-intro{position:absolute;left:16px;right:16px;top:50%;text-align:center;opacity:0;transform:translateY(-44%);transition:opacity .6s,transform .8s cubic-bezier(.2,.8,.2,1);pointer-events:none}
.ac-map-intro.is-on{opacity:1;transform:translateY(-50%)}
.ac-map-intro h2{margin:16px 0 18px;font-size:clamp(46px,8.6cqi,132px);font-weight:800;font-stretch:88%;line-height:.92;letter-spacing:-.045em;color:var(--ac-accent)}
.ac-map-intro p:last-child{max-width:440px;margin:0 auto;font-size:16px;line-height:1.6;color:color-mix(in srgb,var(--ac-cream) 72%,transparent)}
.ac-map-years{position:absolute;right:clamp(16px,4cqi,64px);top:50%;transform:translateY(-50%);display:flex;flex-direction:column;gap:4px;z-index:3}
.ac-map-years button{position:relative;display:flex;flex-direction:column;align-items:flex-end;padding:10px 18px 10px 0;opacity:.42;transition:opacity .3s,color .3s}
.ac-map-years button::after{content:"";position:absolute;right:0;top:12px;bottom:12px;width:2px;background:currentColor;transform:scaleY(.3);transition:transform .4s,background .3s}
.ac-map-years button:hover{opacity:.8}
.ac-map-years button.is-on{opacity:1;color:var(--ac-accent)}
.ac-map-years button.is-on::after{transform:scaleY(1)}
.ac-map-years span{font-size:16px;font-weight:800;font-variant-numeric:tabular-nums}
.ac-map-years small{font-size:11px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:var(--ac-cream);opacity:.75}
.ac-map-card{position:absolute;left:clamp(16px,5cqi,88px);top:50%;width:min(420px,40cqi);transform:translateY(-50%);visibility:hidden;transition:visibility 0s .6s}
.ac-map-card.is-on{visibility:visible;transition:none}
.ac-map-card>*{opacity:0;transform:translateY(22px);transition:opacity .45s,transform .6s cubic-bezier(.2,.8,.2,1)}
.ac-map-card.is-on>*{opacity:1;transform:none}
.ac-map-card.is-on>:nth-child(2){transition-delay:.06s}
.ac-map-card.is-on>:nth-child(3){transition-delay:.12s}
.ac-map-card.is-on>:nth-child(4){transition-delay:.18s}
.ac-map-card.is-on>:nth-child(5){transition-delay:.24s}
.ac-map-year{font-weight:200;font-stretch:125%;font-size:clamp(56px,7.4cqi,112px);line-height:.95;letter-spacing:-.02em;font-variant-numeric:tabular-nums}
.ac-map-card h3{margin:6px 0 14px;font-size:clamp(34px,4.2cqi,60px);font-weight:800;line-height:1;letter-spacing:-.035em;color:var(--ac-accent)}
.ac-map-blurb{font-size:15px;line-height:1.6;color:color-mix(in srgb,var(--ac-cream) 78%,transparent);max-width:36ch}
.ac-map-card dl{margin-top:20px;border-top:1px solid color-mix(in srgb,var(--ac-cream) 16%,transparent)}
.ac-map-card dl div{display:flex;justify-content:space-between;gap:16px;padding:10px 0;border-bottom:1px solid color-mix(in srgb,var(--ac-cream) 16%,transparent);font-size:14px}
.ac-map-card dt{opacity:.6}
.ac-map-card dd{font-weight:600;text-align:right}
.ac-map-card ul{display:flex;flex-wrap:wrap;gap:8px;margin-top:16px}
.ac-map-card li{padding:7px 13px;border-radius:99px;border:1px solid color-mix(in srgb,var(--ac-accent) 70%,transparent);font-size:12px;font-weight:600;letter-spacing:.04em}

/* bean */
.ac-bean{position:relative;overflow:hidden;background:var(--ac-brown);padding:clamp(96px,11cqi,170px) clamp(16px,4cqi,64px) clamp(72px,9cqi,130px)}
.ac-packs{display:flex;justify-content:center;flex-wrap:wrap;gap:clamp(16px,3cqi,40px)}
.ac-pack{width:min(340px,42cqi);perspective:1000px;--gx:50%}
.ac-pack-tilt{position:relative;display:grid;place-items:center;aspect-ratio:4/5;border-radius:22px;overflow:hidden;transform-style:preserve-3d;background:radial-gradient(110% 80% at var(--gx) 0%,rgba(255,255,255,.16),rgba(255,255,255,0) 60%),color-mix(in srgb,var(--ac-accent) 26%,var(--ac-brown));box-shadow:0 30px 60px rgba(0,0,0,.28)}
.ac-pack:nth-child(2) .ac-pack-tilt{background:radial-gradient(110% 80% at var(--gx) 0%,rgba(255,255,255,.2),rgba(255,255,255,0) 60%),color-mix(in srgb,var(--ac-accent) 62%,var(--ac-brown))}
.ac-pack-art{display:block;width:78%;height:auto;max-width:none;transform:translateZ(40px);filter:drop-shadow(0 22px 22px rgba(0,0,0,.32))}
.ac-pack-photo,.ac-product-photo,.ac-note-photo,.ac-step-photo{position:absolute;inset:0;width:100%;height:100%}
.ac-pack-word{font-family:var(--ac-sans);font-size:46px;font-weight:800;letter-spacing:.12em}
.ac-pack-sm{font-family:var(--ac-sans);font-size:13px;font-weight:700;letter-spacing:.2em}
.ac-pack-xs{font-family:var(--ac-sans);font-size:10px;font-weight:500;letter-spacing:.24em;opacity:.85}
.ac-stick-word{font-family:var(--ac-sans);font-size:15px;font-weight:800;letter-spacing:.3em}
.ac-pack-cap{margin-top:14px;text-align:center;font-size:13px;opacity:.78}
.ac-pack-note{max-width:520px;margin:44px auto 0;text-align:center;font-size:16px;line-height:1.65;color:color-mix(in srgb,var(--ac-cream) 76%,transparent)}
.ac-outline{display:flex;flex-direction:column;align-items:center;margin-top:clamp(88px,11cqi,160px);font-weight:150;font-stretch:125%;font-size:clamp(70px,16cqi,260px);line-height:.9;letter-spacing:.02em;text-transform:uppercase}
.ac-outline span{color:transparent;-webkit-text-stroke:1.4px color-mix(in srgb,var(--ac-cream) 82%,var(--ac-accent));background:linear-gradient(90deg,color-mix(in srgb,var(--ac-cream) 86%,var(--ac-accent)) var(--fill,0%),transparent var(--fill,0%));-webkit-background-clip:text;background-clip:text}
.ac-bean-lead{margin-top:48px;text-align:center}
.ac-bean-spin{width:40px;height:40px;margin:0 auto 18px;color:var(--ac-accent)}
.ac-flavor{display:grid;grid-template-columns:1.35fr 1fr;align-items:center;gap:clamp(28px,6cqi,96px);max-width:1180px;margin:clamp(64px,8cqi,120px) auto 0}
.ac-notes{display:grid;grid-template-columns:repeat(2,1fr);gap:clamp(12px,2cqi,24px);padding-bottom:clamp(40px,7cqi,110px)}
.ac-note{position:relative;display:flex;flex-direction:column;justify-content:flex-end;min-height:220px;aspect-ratio:1;padding:clamp(16px,2cqi,26px);border-radius:22px;overflow:hidden;text-align:left;background:var(--c);color:#1D1310;transition:transform .5s cubic-bezier(.2,.8,.2,1),box-shadow .5s}
.ac-note:nth-child(even){transform:translateY(clamp(40px,7cqi,110px))}
.ac-note:hover,.ac-note.is-on{box-shadow:0 26px 50px rgba(0,0,0,.3)}
.ac-note:nth-child(odd):hover,.ac-note:nth-child(odd).is-on{transform:translateY(-8px) rotate(-1.2deg)}
.ac-note:nth-child(even):hover,.ac-note:nth-child(even).is-on{transform:translateY(calc(clamp(40px,7cqi,110px) - 8px)) rotate(1.2deg)}
.ac-note-motif{position:absolute;right:8%;top:8%;width:46%;height:auto;max-width:none;opacity:.86;transition:transform .9s cubic-bezier(.2,.8,.2,1)}
.ac-note:hover .ac-note-motif,.ac-note.is-on .ac-note-motif{transform:rotate(14deg) scale(1.08)}
.ac-note-name{position:relative;font-size:clamp(19px,2.1cqi,27px);font-weight:800;letter-spacing:-.015em}
.ac-note-dots{position:relative;display:flex;gap:5px;margin-top:10px}
.ac-note-dots i{width:8px;height:8px;border-radius:50%;border:1.5px solid currentColor}
.ac-note-dots i.is-on{background:currentColor}
.ac-note-body{position:relative;max-height:0;opacity:0;overflow:hidden;font-size:13px;line-height:1.45;transition:max-height .5s,opacity .4s,margin .5s}
.ac-note:hover .ac-note-body,.ac-note.is-on .ac-note-body,.ac-note:focus-visible .ac-note-body{max-height:6em;margin-top:10px;opacity:1}
.ac-radar{position:relative;margin:0 auto;width:100%;max-width:440px}
.ac-radar svg{width:100%;height:auto;max-width:none;overflow:visible}
.ac-radar-ring{fill:none;stroke:var(--ac-cream);stroke-opacity:.16}
.ac-radar-axis{stroke:var(--ac-cream);stroke-opacity:.16;transition:stroke .3s,stroke-opacity .3s}
.ac-radar-axis.is-on{stroke:var(--ac-accent);stroke-opacity:1}
.ac-radar-shape{fill:color-mix(in srgb,var(--ac-accent) 40%,transparent);stroke:var(--ac-accent);stroke-width:2;stroke-linejoin:round}
.ac-radar-dot{fill:var(--ac-cream);transition:r .25s;cursor:pointer}
.ac-radar-label{fill:var(--ac-cream);font-family:var(--ac-sans);font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;opacity:.75;cursor:default}
.ac-radar-label.is-on{opacity:1;fill:var(--ac-accent)}
.ac-radar figcaption{position:absolute;left:0;right:0;top:50%;transform:translateY(-50%);display:flex;flex-direction:column;align-items:center;pointer-events:none}
.ac-radar figcaption b{font-size:44px;font-weight:200;font-stretch:120%;line-height:1;text-shadow:0 2px 16px rgba(0,0,0,.4)}
.ac-radar figcaption span{margin-top:6px;font-size:10px;font-weight:600;letter-spacing:.22em;text-transform:uppercase;opacity:.75}

/* farm to cup */
.ac-strip{position:relative;height:calc(var(--h) * 3);background:var(--ac-brown)}
.ac-strip-stage{position:sticky;top:0;height:var(--h);min-height:600px;overflow:hidden;display:flex;flex-direction:column;justify-content:center;gap:clamp(28px,4cqi,52px)}
.ac-strip-head{position:relative;padding:0 clamp(16px,4cqi,64px)}
.ac-strip-head h2{max-width:16ch;margin-top:12px;font-size:clamp(34px,4.6cqi,68px);font-weight:800;line-height:.98;letter-spacing:-.035em}
.ac-strip-head .ac-eyebrow{color:var(--ac-accent)}
.ac-strip-bar{position:absolute;right:clamp(16px,4cqi,64px);bottom:10px;width:min(280px,30cqi);height:2px;background:color-mix(in srgb,var(--ac-cream) 18%,transparent)}
.ac-strip-bar i{position:absolute;inset:0;background:var(--ac-accent);transform-origin:left}
.ac-strip-track{display:flex;gap:clamp(14px,2cqi,24px);width:max-content;padding:0 clamp(16px,4cqi,64px)}
.ac-step{position:relative;flex:none;display:flex;flex-direction:column;justify-content:flex-end;width:clamp(264px,27cqi,370px);aspect-ratio:3/4;padding:26px;border-radius:24px;overflow:hidden;transition:transform .5s cubic-bezier(.2,.8,.2,1)}
.ac-step:hover{transform:translateY(-6px)}
.ac-step[data-tone="0"]{background:var(--ac-cream);color:var(--ac-brown)}
.ac-step[data-tone="1"]{background:var(--ac-accent);color:#fff}
.ac-step[data-tone="2"]{background:var(--ac-crop);color:var(--ac-cream)}
.ac-step[data-tone="3"]{background:var(--ac-deep);color:var(--ac-cream);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--ac-cream) 16%,transparent)}
.ac-step-icon{position:absolute;top:24px;right:20px;width:48%;height:auto;max-width:none;transition:transform .8s cubic-bezier(.2,.8,.2,1)}
.ac-step:hover .ac-step-icon{transform:rotate(-8deg) scale(1.06)}
.ac-step-n{position:absolute;top:22px;left:26px;font-size:58px;font-weight:200;font-stretch:125%;line-height:1}
.ac-step h3{position:relative;font-size:23px;font-weight:800;letter-spacing:-.02em}
.ac-step p{position:relative;margin-top:10px;font-size:14px;line-height:1.55;opacity:.84}
.ac-step b{position:relative;margin-top:18px;padding-top:12px;border-top:1px solid currentColor;font-size:12px;font-weight:700;letter-spacing:.18em;text-transform:uppercase}

/* stick */
.ac-stick{position:relative;overflow:hidden;background:var(--ac-deep);padding:clamp(96px,11cqi,170px) clamp(16px,4cqi,64px)}
.ac-stick .ac-outline{margin-top:0}
.ac-stick-lead{max-width:640px;margin:44px auto 0;text-align:center}
.ac-stick-lead .ac-lead{max-width:none;font-size:clamp(20px,2.2cqi,28px);font-weight:600;line-height:1.35;color:color-mix(in srgb,var(--ac-cream) 86%,transparent)}
.ac-brew{display:grid;grid-template-columns:1fr 1.1fr;align-items:center;gap:clamp(28px,5cqi,80px);max-width:1180px;margin:clamp(56px,7cqi,100px) auto 0}
.ac-fan{position:relative;height:clamp(380px,40cqi,500px)}
.ac-fan-disc{position:absolute;left:50%;bottom:4%;width:86%;aspect-ratio:1;border-radius:50%;transform:translateX(-50%);background:radial-gradient(circle at 50% 46%,color-mix(in srgb,var(--blend) 50%,transparent),transparent 64%);transition:background .7s}
.ac-fan-stick{position:absolute;left:50%;bottom:8%;width:clamp(48px,4.6cqi,64px);margin-left:calc(clamp(48px,4.6cqi,64px) / -2);transform-origin:50% 100%;transform:translateX(calc(var(--off) * 150%)) rotate(calc(var(--off) * 13deg)) scale(.92);filter:brightness(.72) saturate(.8);cursor:pointer;transition:transform .8s cubic-bezier(.2,.8,.2,1),filter .5s}
.ac-fan-stick:hover{filter:brightness(.95)}
.ac-fan-stick.is-on{transform:translateX(calc(var(--off) * 150%)) rotate(calc(var(--off) * 13deg)) translateY(-14%) scale(1.04);filter:none}
.ac-stick-art{display:block;width:100%;height:auto;max-width:none;filter:drop-shadow(0 18px 18px rgba(0,0,0,.35))}
.ac-blends{display:flex;flex-wrap:wrap;gap:8px}
.ac-blends button{display:inline-flex;align-items:center;gap:9px;height:42px;padding:0 18px;border-radius:99px;border:1px solid color-mix(in srgb,var(--ac-cream) 26%,transparent);font-size:13px;font-weight:600;transition:background .3s,color .3s,border-color .3s}
.ac-blends button:hover{border-color:var(--ac-cream)}
.ac-blends button i{width:10px;height:10px;border-radius:50%;background:var(--c)}
.ac-blends button.is-on{background:var(--ac-cream);border-color:var(--ac-cream);color:var(--ac-deep)}
.ac-cup-row{display:grid;grid-template-columns:minmax(170px,250px) 1fr;align-items:center;gap:clamp(18px,3cqi,40px);margin-top:30px}
.ac-cup{display:block;width:100%;height:auto;max-width:none;overflow:visible}
.ac-surface{transition:fill .7s}
.ac-blend-info h3{font-size:30px;font-weight:800;letter-spacing:-.025em}
.ac-blend-info p{margin-top:6px;font-size:15px;line-height:1.55;color:color-mix(in srgb,var(--ac-cream) 76%,transparent)}
.ac-strength{display:flex;align-items:center;gap:5px;margin-top:16px}
.ac-strength span{margin-right:8px;font-size:11px;font-weight:600;letter-spacing:.18em;text-transform:uppercase;opacity:.6}
.ac-strength i{width:24px;height:6px;border-radius:3px;background:color-mix(in srgb,var(--ac-cream) 16%,transparent);transition:background .4s}
.ac-strength i.is-on{background:var(--blend)}
.ac-blend-info .ac-brew-how{margin:14px 0 22px;font-size:13px;letter-spacing:.06em}
.ac-btn{display:inline-flex;align-items:center;justify-content:center;height:50px;padding:0 28px;border-radius:99px;background:var(--ac-accent);color:#fff;font-size:14px;font-weight:700;letter-spacing:.04em;transition:transform .25s cubic-bezier(.2,.8,.2,1),background .3s,opacity .3s}
.ac-btn:hover{transform:translateY(-2px)}
.ac-btn:active{transform:scale(.97)}
.ac-btn:disabled{opacity:.6;cursor:default;transform:none}
.ac-btn.is-done{background:#2F7A4D}
.ac-btn-wide{width:100%}

/* limited */
.ac-limited{position:relative;background:var(--ac-brown);padding:clamp(96px,11cqi,170px) clamp(16px,4cqi,64px)}
.ac-limited-head{text-align:center}
.ac-limited-head .ac-eyebrow{color:var(--ac-accent)}
.ac-limited-head h2{max-width:13ch;margin:16px auto 0;font-size:clamp(40px,6.4cqi,96px);font-weight:800;font-stretch:92%;line-height:.94;letter-spacing:-.045em;text-wrap:balance}
.ac-lot{max-width:900px;margin:48px auto 0}
.ac-lot p{display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap;font-size:13px;letter-spacing:.04em}
.ac-lot p span{opacity:.7}
.ac-lot p b{font-variant-numeric:tabular-nums}
.ac-lot-bar{position:relative;height:4px;margin-top:12px;border-radius:2px;overflow:hidden;background:color-mix(in srgb,var(--ac-cream) 14%,transparent)}
.ac-lot-bar i{position:absolute;inset:0;background:var(--ac-accent);transform-origin:left;transition:transform .7s cubic-bezier(.2,.8,.2,1)}
.ac-products{display:grid;grid-template-columns:repeat(2,1fr);gap:clamp(16px,3cqi,32px);max-width:1180px;margin:48px auto 0}
.ac-product{display:grid;grid-template-columns:.9fr 1fr;align-items:center;gap:clamp(16px,3cqi,32px);padding:clamp(18px,2.4cqi,32px);border-radius:26px;background:color-mix(in srgb,var(--ac-ink) 32%,var(--ac-brown));box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--ac-cream) 8%,transparent)}
.ac-product-art{position:relative;display:grid;place-items:center;aspect-ratio:3/4;border-radius:18px;overflow:hidden;background:radial-gradient(90% 70% at 50% 20%,color-mix(in srgb,var(--ac-accent) 34%,transparent),transparent 70%),color-mix(in srgb,var(--ac-ink) 40%,var(--ac-brown))}
.ac-product-art .ac-pack-art{width:84%;transform:none;transition:transform .7s cubic-bezier(.2,.8,.2,1)}
.ac-product:hover .ac-product-art .ac-pack-art{transform:translateY(-6px) rotate(-2deg)}
.ac-product-info h3{font-size:22px;font-weight:800;letter-spacing:-.02em}
.ac-product-info dl{margin-top:14px}
.ac-product-info dl div{display:flex;justify-content:space-between;gap:12px;padding:9px 0;border-bottom:1px solid color-mix(in srgb,var(--ac-cream) 12%,transparent);font-size:13px}
.ac-product-info dt{opacity:.6}
.ac-product-info dd{font-weight:600;text-align:right}
.ac-buy{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:18px 0 14px}
.ac-price{font-size:28px;font-weight:800;letter-spacing:-.02em;font-variant-numeric:tabular-nums}
.ac-qty{display:inline-flex;align-items:center;height:42px;border-radius:99px;box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--ac-cream) 26%,transparent)}
.ac-qty button{width:42px;height:42px;border-radius:50%;font-size:18px;transition:background .2s}
.ac-qty button:hover{background:color-mix(in srgb,var(--ac-cream) 10%,transparent)}
.ac-qty output{min-width:22px;text-align:center;font-weight:700;font-variant-numeric:tabular-nums}

/* footer */
.ac-foot{position:relative;background:var(--ac-ink);padding:clamp(96px,11cqi,150px) clamp(16px,4cqi,64px) 28px;text-align:center}
.ac-foot-mark{display:block;width:clamp(120px,16cqi,210px);height:auto;max-width:none;margin:0 auto;overflow:visible}
.ac-foot-fill{fill:var(--ac-accent)}
.ac-foot-outline{fill:none;stroke:var(--ac-accent);stroke-width:1.2;stroke-linejoin:round}
.ac-foot-handle{fill:none;stroke:var(--ac-accent);stroke-width:4.5;stroke-linecap:round}
.ac-foot-line{margin-top:30px;font-size:clamp(24px,3.2cqi,40px);font-weight:700;letter-spacing:-.025em;text-wrap:balance}
.ac-news{max-width:540px;margin:44px auto 0}
.ac-news label{font-size:13px;opacity:.7}
.ac-news div{display:flex;gap:8px;margin-top:12px}
.ac-news input{flex:1;min-width:0;height:50px;padding:0 22px;border-radius:99px;border:1px solid color-mix(in srgb,var(--ac-cream) 26%,transparent);background:transparent;color:var(--ac-cream);font:inherit;font-size:15px;outline:none;transition:border-color .2s}
.ac-news input::placeholder{color:color-mix(in srgb,var(--ac-cream) 40%,transparent)}
.ac-news input:focus{border-color:var(--ac-cream)}
.ac-news input[aria-invalid="true"]{border-color:var(--ac-accent)}
.ac-news-msg{min-height:1.5em;margin-top:10px;font-size:13px;color:color-mix(in srgb,var(--ac-cream) 80%,transparent)}
.ac-foot-cols{display:grid;grid-template-columns:repeat(4,1fr);gap:28px;max-width:980px;margin:72px auto 0;text-align:left}
.ac-foot-cols h3{margin-bottom:14px;font-size:11px;font-weight:600;letter-spacing:.2em;text-transform:uppercase;opacity:.55}
.ac-foot-cols li+li{margin-top:9px}
.ac-foot-cols a{font-size:14px;opacity:.82;transition:opacity .2s,color .2s}
.ac-foot-cols a:hover{opacity:1;color:var(--ac-accent)}
.ac-foot-base{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:14px 24px;max-width:1180px;margin:72px auto 0;padding-top:22px;border-top:1px solid color-mix(in srgb,var(--ac-cream) 12%,transparent);font-size:12px;color:color-mix(in srgb,var(--ac-cream) 66%,transparent)}
.ac-foot-word{display:inline-flex;align-items:center;gap:8px;color:var(--ac-accent);font-size:14px;font-weight:800;letter-spacing:.2em}
.ac-foot-social{display:flex;gap:18px}
.ac-foot-social a:hover{color:var(--ac-cream)}
.ac-fly{position:fixed;left:0;top:0;z-index:9999;width:18px;height:18px;border-radius:50%;background:var(--ac-accent);box-shadow:0 0 0 3px #fff,0 6px 16px rgba(0,0,0,.3);opacity:0;pointer-events:none}

/* layout answers the component's own width */
@container (max-width: 900px){
  .ac-nav{display:none}
  .ac-burger{display:inline-flex}
  .ac-flavor,.ac-brew{grid-template-columns:1fr}
  .ac-products{grid-template-columns:1fr}
  .ac-map-card{left:16px;right:16px;top:auto;bottom:28px;width:auto;transform:none}
  .ac-map-years{left:16px;right:16px;top:84px;transform:none;flex-direction:row;justify-content:center;gap:20px}
  .ac-map-years button{align-items:center;padding:0 0 12px}
  .ac-map-years button::after{left:12px;right:12px;top:auto;bottom:0;width:auto;height:2px;transform:scaleX(.3)}
  .ac-map-years button.is-on::after{transform:scaleX(1)}
  .ac-map-shade{background:linear-gradient(0deg,var(--ac-ink) 0%,color-mix(in srgb,var(--ac-ink) 78%,transparent) 40%,transparent 66%),linear-gradient(180deg,var(--ac-ink) 0%,transparent 26%)}
  .ac-map-year{font-size:52px}
  .ac-map-blurb{display:none}
  .ac-foot-cols{grid-template-columns:repeat(2,1fr)}
  .ac-strip-bar{position:relative;right:auto;bottom:auto;margin-top:20px}
}
@container (max-width: 600px){
  .ac-crop-stats{grid-template-columns:1fr}
  .ac-crop-stats div+div{border-left:0;border-top:1px solid color-mix(in srgb,var(--ac-cream) 20%,transparent);margin-top:18px}
  .ac-pack{width:min(320px,86cqi)}
  .ac-product{grid-template-columns:1fr}
  .ac-product-art{aspect-ratio:4/3}
  .ac-product-art .ac-pack-art{width:46%}
  .ac-cup-row{grid-template-columns:1fr}
  .ac-cup{max-width:220px;margin:0 auto}
  .ac-hud-scale{display:none}
  .ac-hud{top:80px;transform:none}
  .ac-hud-read b{font-size:24px}
  .ac-notes{gap:10px}
  .ac-note{min-height:0;padding:14px}
  .ac-note-motif{width:42%}
  .ac-fan{height:380px}
  .ac-map-card dl div{padding:7px 0;font-size:13px}
  .ac-pill span{display:none}
  .ac-pill{padding:0 6px}
}

@media (prefers-reduced-motion: reduce){
  .ac-hero{height:var(--h)}
  .ac-hero-cue{display:none}
  .ac-origins{height:auto}
  .ac-map-stage{position:relative}
  .ac-strip{height:auto}
  .ac-strip-stage{position:relative;height:auto;min-height:0;padding:96px 0}
  .ac-strip-track{width:auto;overflow-x:auto;scroll-snap-type:x mandatory;padding-bottom:12px}
  .ac-step{scroll-snap-align:start}
  .ac-strip-bar{display:none}
  .ac-outline{--fill:100%}
  .ac-cloud i,.ac-map-pin i,.ac-smoke,.ac-hero-cue i{animation:none}
  .ac-root *,.ac-root *::before,.ac-root *::after{transition-duration:.01ms !important;transition-delay:0s !important}
}
`
