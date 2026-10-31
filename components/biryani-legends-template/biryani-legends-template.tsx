"use client"

import * as React from "react"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

/**
 * Biryani Legends Template — a printed coffee-table book of biryani legends.
 *
 * Every legend is one chapter laid out as an open two-page spread on cream
 * paper: the name in saffron serif with a handwritten title over it, justified
 * book columns, an engraving that fades into the paper and a pot of biryani
 * resting on the page with its own shadow. The legends are data: add one to
 * `legends` and the book grows a spread, a contents line and a tab.
 *
 * Storyboard
 * - Load: a closed cloth-bound book with a gold-foil title sits on the desk
 *   while the pots are painted and the type loads. Then the cover swings open
 *   on its spine and the book slides to the centre, revealing the contents.
 * - Turn: scroll, ← →, PageUp/PageDown, swipe, the tabs or the corner arrows
 *   turn real leaves around the spine (3D, scrubbed by scroll, snapped to a
 *   spread). On phones the book becomes one page at a time, in reading order.
 * - Arrive: the engraving inks itself in left to right, the spice wreath is
 *   drawn, the name rises letter by letter, the script title writes in, the
 *   columns settle line by line and the pot lowers onto the page with its
 *   shadow tightening under it. Steam starts to rise.
 * - Live: the wreath breathes, the paper catches a soft light that follows the
 *   pointer, pots and engravings shift a little with it, a pot lifts when you
 *   hover it, ships drift, dhows sail, the fountain plays and smoke rises.
 * - Reduced motion: no turning, no drawing; spreads change with a calm fade.
 *
 * Nothing is fetched except the optional Google Fonts stylesheet. The
 * engravings are drawn here as SVG line work, and the three biryanis (a brass
 * handi of Thalassery jeerakasala, a clay pot of Ambur seeraga samba, a red
 * enamel dish of Awadhi basmati) are painted onto a canvas at runtime. Pass
 * `dish.src` to use your own transparent photo cut-out instead.
 *
 * GSAP + ScrollTrigger run inside one gsap.context, reverted on unmount. The
 * stage is CSS-sticky inside a tall section: no ScrollTrigger pinning.
 */

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger)

// ---- public types ---------------------------------------------------------------

export type BlLayoutName = "shore" | "summit" | "terrace"
export type BlEngravingName = "harbour" | "fort" | "garden"
export type BlDish = {
  /** The vessel painted when there is no `src`. */
  vessel?: "brass" | "clay" | "enamel"
  /** The rice painted when there is no `src`. */
  rice?: "jeerakasala" | "seeraga" | "basmati"
  /** A transparent, top-down photo cut-out of the pot. Square works best. */
  src?: string
  alt?: string
  seed?: number
}
export type BlLegend = {
  name: string
  /** The handwritten line over the name. */
  title: string
  /** Shown in the contents, the tabs and the running foot. */
  city?: string
  dishName?: string
  /** Composition: engraving across the bottom, top right, or top left. */
  layout?: BlLayoutName
  engraving?: BlEngravingName
  /** Ink of the engraving. */
  tone?: "sepia" | "graphite"
  /**
   * A real engraving (public domain or generated) to use instead of the drawn
   * one: sepia or grey line work on a white or paper ground. It is multiplied
   * into the paper and revealed by an ink sweep. `aspect` is width / height.
   */
  engravingImage?: { src: string; alt?: string; aspect?: number }
  /** Left-page paragraphs. */
  story: string[]
  /** Right-page paragraphs. */
  continued?: string[]
  /** The italic closing note. */
  note?: string
  dish?: BlDish
  seed?: number
}
export type BlLink = { label: string; href?: string }
export type BlColumn = { title: string; links: BlLink[] }
export type BlSocial = { label: string; href?: string; icon: "instagram" | "youtube" | "x" | "facebook" | "mail" }
export type BlPreset = "parchment" | "midnight"
export type BlProps = {
  legends?: BlLegend[]
  /** Book title, on the cover and the title page. */
  title?: string
  subtitle?: string
  edition?: string
  publisher?: string
  epigraph?: string
  /** The last spread. */
  closing?: { heading?: string; script?: string; body?: string; primary?: BlLink; secondary?: BlLink; newsletter?: string }
  columns?: BlColumn[]
  socials?: BlSocial[]
  colophon?: string
  copyright?: string
  /** Called with the address when someone joins the list. */
  onSubscribe?: (email: string) => void
  /** Top bar call to action. */
  cta?: BlLink
  preset?: BlPreset
  /** Height of the sticky stage. A definite length, never a percentage. */
  height?: string
  /** Google Fonts (or any) stylesheet. `null` loads nothing. */
  fontHref?: string | null
  displayFont?: string
  scriptFont?: string
  bodyFont?: string
  /** A seamless paper texture (tiles at 512px, multiplied into the page). Default: grain generated at runtime. */
  paperTexture?: string
  className?: string
}

// ---- defaults -------------------------------------------------------------------

const BL_FONTS =
  "https://fonts.googleapis.com/css2?family=Allura&family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&family=Crimson+Pro:ital,wght@0,400;0,500;1,400&display=swap"
const BL_DISPLAY = '"Cormorant Garamond", "Cormorant", Garamond, "Times New Roman", serif'
const BL_SCRIPT = 'Allura, "Great Vibes", "Snell Roundhand", "Apple Chancery", cursive'
const BL_BODY = '"Crimson Pro", "Crimson Text", Georgia, "Times New Roman", serif'

export const BL_LEGENDS: BlLegend[] = [
  {
    name: "Faiza Abdulla",
    title: "A Thalassery Biriyani Legend",
    city: "Thalassery",
    dishName: "Thalassery chicken biriyani",
    layout: "shore",
    engraving: "harbour",
    tone: "graphite",
    seed: 3,
    dish: { vessel: "brass", rice: "jeerakasala", seed: 4, alt: "A brass handi of Thalassery chicken biriyani with fried onion, cashews and mint, a brass spoon resting in it" },
    story: [
      "There is something about the way Faiza brings her Thalassery biriyani to life. She orchestrates the sights, sounds and smells with practised ease. The gentle fragrance of jeerakasala rice. Cashew crescents turning to gold as they surrender to melting ghee. The sizzle of onions as they fry to a deep, sweet brown.",
      "Green cardamom, cinnamon bark and bay leaf crackle together, as if they know they are part of something extraordinary. Even the raisins swell with pride. A breeze blows in from the Arabian Sea, as it did when it carried Persian and Arab sailors to this coast in search of these very spices.",
    ],
    continued: [
      "At the other end of town a wedding is under way, and word has spread that the biriyani on the menu is Faiza's. She turns to the natti kozhi, marinating in a recipe whispered to her by her beloved Periyumma, and checks her watch. Time is racing, but you cannot rush a legend.",
    ],
    note: "Curried chicken and rice in layers, a generous crown of fried onion, the vessel sealed and set on dum. Biriyanis like this don't come every day. Luckily for you, it's closer than you think.",
  },
  {
    name: "K. Selvarajan",
    title: "An Ambur Biryani Legend",
    city: "Ambur",
    dishName: "Ambur mutton biryani",
    layout: "summit",
    engraving: "fort",
    tone: "sepia",
    seed: 5,
    dish: { vessel: "clay", rice: "seeraga", seed: 9, alt: "A clay pot of red Ambur mutton biryani with a wedge of lime and coriander" },
    story: [
      "Ambur. A town on the old road between the plains and the hills, where the Nawabs of Arcot kept their kitchens and their cooks kept their secrets. Here biryani is made with seeraga samba, a grain so small and fragrant it is counted rather than weighed.",
      "K. Selvarajan learned the dish at fourteen, carrying firewood for a cook who never wrote a recipe down. He watched mutton soften in a paste of dried red chillies and curd, and learned to hear when the rice was ready.",
    ],
    continued: [
      "Fifty years on, his pots are still clay and his fire is still wood. The meat goes in first, the rice is laid over it in one even blanket, and the lid is sealed with a rope of dough.",
    ],
    note: "“Ambur biryani is not loud,” he says, lifting the lid to a cloud of steam. “It is quiet, it is red, and it waits for you.” Served with brinjal curry and cool onion raita, the way the town has eaten it for a century.",
  },
  {
    name: "Sonia Singh",
    title: "An Awadhi Biryani Legend",
    city: "Lucknow",
    dishName: "Awadhi chicken biryani",
    layout: "terrace",
    engraving: "garden",
    tone: "graphite",
    seed: 9,
    dish: { vessel: "enamel", rice: "basmati", seed: 2, alt: "A red enamel dish of Awadhi biryani, white and saffron basmati with a chicken leg and mint" },
    story: [
      "Lucknow. A city brimming with culinary treasures, relics of a glorious past when the Nawabs of Awadh raised the arts to their zenith. In their kitchens Persian technique met local flavour, and a marvel was born: the Awadhi biryani.",
      "Eager to learn, Sonia, a novice chef, stood at the door of a modest home frozen in time. Mansoor Chacha, an elderly cook and guardian of old secrets, welcomed her inside.",
    ],
    continued: [
      "Then began the most extraordinary lesson of her life. His wrinkled hands danced over fragrant basmati, saffron strands glowing like sunbeams, the air thick with cardamom, cinnamon and star anise. “This is pakki biryani,” he declared, browning the meat before layering it with rice.",
      "He sealed the handi with a band of roti dough. Within, layers of enchantment simmered on centuries of heritage. At last came the unveiling: golden rice adorned with saffron, and meat steeped in a harmony of spices.",
    ],
    note: "Years have passed, and Sonia carries the torch of this great heritage. With each fragrant handi of pure Awadhi biryani, we pay tribute to flavours that bridge the past and the present, ensuring that this legend lives on.",
  },
]

const BL_COLUMNS: BlColumn[] = [
  { title: "The kitchens", links: [{ label: "Thalassery", href: "#" }, { label: "Ambur", href: "#" }, { label: "Lucknow", href: "#" }, { label: "Private dum", href: "#" }] },
  { title: "The book", links: [{ label: "About the legends", href: "#" }, { label: "Recipes", href: "#" }, { label: "Stockists", href: "#" }, { label: "Press", href: "#" }] },
  { title: "Visit", links: [{ label: "Reservations", href: "#" }, { label: "Gift a feast", href: "#" }, { label: "Contact", href: "#" }, { label: "Careers", href: "#" }] },
]
const BL_SOCIALS: BlSocial[] = [
  { label: "Instagram", icon: "instagram", href: "#" },
  { label: "YouTube", icon: "youtube", href: "#" },
  { label: "X", icon: "x", href: "#" },
  { label: "Email", icon: "mail", href: "#" },
]

type BlPalette = { desk: string; deskHi: string; deskLo: string; chrome: string; chromeMuted: string; paper: string; paperShade: string; ink: string; muted: string; saffron: string; sepia: string; graphite: string; cloth: string; clothDeep: string; foil: string; foilHi: string; dim: string }
const BL_PRESETS: { [k: string]: BlPalette } = {
  parchment: {
    desk: "#cdbf9f", deskHi: "#e2d6bb", deskLo: "#a8977a", chrome: "#2d2216", chromeMuted: "#5e4c37",
    paper: "#f1e6cb", paperShade: "#5a3e1e", ink: "#2a2018", muted: "#5d4c3a", saffron: "#e2731c",
    sepia: "#4e3218", graphite: "#33302b", cloth: "#7b2219", clothDeep: "#4a110c", foil: "#c99a45", foilHi: "#f8e2a6", dim: "0",
  },
  midnight: {
    desk: "#1b1510", deskHi: "#3a2c1e", deskLo: "#0b0806", chrome: "#efe1c3", chromeMuted: "#b8a684",
    paper: "#eee1c3", paperShade: "#3a2610", ink: "#2a2018", muted: "#5d4c3a", saffron: "#e2731c",
    sepia: "#4e3218", graphite: "#33302b", cloth: "#6e1d16", clothDeep: "#3a0d09", foil: "#c99a45", foilHi: "#f8e2a6", dim: "0.12",
  },
}

// ---- scoped CSS -----------------------------------------------------------------

const BL_CSS = `
.bl-root{position:relative;width:100%;color:var(--bl-ink);font-family:var(--bl-body);-webkit-font-smoothing:antialiased}
.bl-scroller{position:relative;width:100%}
.bl-stage{position:sticky;top:0;width:100%;height:var(--h);overflow:hidden;color:var(--bl-chrome);touch-action:pan-y;background:radial-gradient(120% 95% at 50% 42%,var(--bl-desk-hi) 0%,var(--bl-desk) 55%,var(--bl-desk-lo) 100%)}
.bl-stage::before{content:"";position:absolute;inset:0;pointer-events:none;background:radial-gradient(60% 45% at calc(50% + var(--px,0) * 12%) calc(40% + var(--py,0) * 8%),rgba(255,236,190,.22),transparent 70%);mix-blend-mode:soft-light}
.bl-bar{position:absolute;left:0;right:0;z-index:30;display:flex;align-items:center;justify-content:space-between;gap:16px;padding:0 clamp(14px,3vw,40px);font-family:var(--bl-body)}
.bl-top{top:0;height:56px}
.bl-bottom{bottom:0;height:52px}
.bl-mark{display:flex;align-items:baseline;gap:10px;white-space:nowrap}
.bl-mark b{font-family:var(--bl-display);font-weight:600;font-size:21px;letter-spacing:.01em;color:var(--bl-chrome)}
.bl-mark i{font-family:var(--bl-script);font-style:normal;font-size:22px;color:var(--bl-saffron)}
.bl-tabs{display:flex;gap:2px;align-items:center;list-style:none;margin:0;padding:0}
.bl-tab{appearance:none;border:0;background:none;cursor:pointer;padding:8px 12px;font:inherit;font-size:13px;letter-spacing:.14em;text-transform:uppercase;color:var(--bl-chrome-muted);position:relative;transition:color .4s}
.bl-tab::after{content:"";position:absolute;left:12px;right:12px;bottom:3px;height:1px;background:var(--bl-saffron);transform:scaleX(0);transform-origin:left;transition:transform .5s cubic-bezier(.2,.7,.2,1)}
.bl-tab[aria-current="true"]{color:var(--bl-chrome)}
.bl-tab[aria-current="true"]::after,.bl-tab:hover::after{transform:scaleX(1)}
.bl-tab:focus-visible,.bl-btn:focus-visible,.bl-cta:focus-visible,.bl-toc button:focus-visible,.bl-root a:focus-visible,.bl-seal:focus-visible,.bl-input:focus-visible{outline:2px solid var(--bl-saffron);outline-offset:3px}
.bl-cta{display:inline-flex;align-items:center;gap:8px;padding:9px 16px;border:1px solid currentColor;border-radius:999px;color:var(--bl-chrome);text-decoration:none;font-size:13px;letter-spacing:.12em;text-transform:uppercase;transition:background .3s,color .3s}
.bl-cta:hover{background:var(--bl-chrome);color:var(--bl-desk)}
.bl-hint{font-size:13px;font-style:italic;color:var(--bl-chrome-muted);white-space:nowrap}
.bl-folio{font-family:var(--bl-display);font-size:15px;letter-spacing:.2em;color:var(--bl-chrome);white-space:nowrap}
.bl-nav{display:flex;gap:8px}
.bl-btn{appearance:none;width:38px;height:38px;border-radius:50%;border:1px solid color-mix(in srgb,var(--bl-chrome) 45%,transparent);background:transparent;color:var(--bl-chrome);cursor:pointer;display:grid;place-items:center;transition:background .3s,border-color .3s,opacity .3s}
.bl-btn:hover:not(:disabled){background:color-mix(in srgb,var(--bl-chrome) 12%,transparent);border-color:var(--bl-chrome)}
.bl-btn:disabled{opacity:.3;cursor:default}
.bl-btn svg{width:16px;height:16px;max-width:none}
.bl-progress{position:absolute;left:0;bottom:0;height:2px;width:100%;transform-origin:left;transform:scaleX(var(--prog,0));background:var(--bl-saffron);opacity:.7;z-index:31}
.bl-3d{position:absolute;inset:0;perspective:2600px;perspective-origin:50% 45%}
.bl-book{position:absolute;transform-style:preserve-3d}
.bl-under{position:absolute;top:0;height:100%;background:var(--bl-paper);pointer-events:none}
.bl-under-l{left:0;width:50%;box-shadow:-1px 1px 0 #e4d6b6,-2px 2px 0 #d9caa7,-3px 3px 0 #e2d4b3,-4px 4px 0 #d3c39f,-5px 5px 0 #ddcfad,-6px 6px 0 #cbbb97,-14px 26px 50px rgba(30,18,6,.35)}
.bl-under-r{right:0;width:50%;box-shadow:1px 1px 0 #e4d6b6,2px 2px 0 #d9caa7,3px 3px 0 #e2d4b3,4px 4px 0 #d3c39f,5px 5px 0 #ddcfad,6px 6px 0 #cbbb97,14px 26px 50px rgba(30,18,6,.35)}
.bl-under-l{opacity:var(--open,0)}
.bl-single .bl-under-l{display:none}
.bl-single .bl-under-r{width:100%}
.bl-boards{position:absolute;inset:-6px -10px -10px -10px;border-radius:4px;background:linear-gradient(90deg,var(--bl-cloth-deep),var(--bl-cloth) 48%,var(--bl-cloth-deep) 50%,var(--bl-cloth) 52%,var(--bl-cloth-deep));box-shadow:0 30px 60px rgba(20,10,4,.4);opacity:var(--open,0);pointer-events:none}
.bl-single .bl-boards{inset:-5px -8px -8px -3px}
.bl-leaf{position:absolute;top:0;height:100%;left:50%;width:50%;transform-style:preserve-3d;transform-origin:0 50%;will-change:transform}
.bl-single .bl-leaf{left:0;width:100%}
.bl-face{position:absolute;inset:0;overflow:hidden;backface-visibility:hidden;-webkit-backface-visibility:hidden;box-shadow:0 0 calc(var(--lift,0) * 60px) rgba(30,16,4,calc(var(--lift,0) * .35))}
.bl-back{transform:rotateY(180deg)}
.bl-page{background:var(--bl-paper);color:var(--bl-ink);container-type:normal}
.bl-sheet{position:absolute;top:0;height:100%;width:200%}
.bl-fx{position:absolute;inset:0;pointer-events:none}
.bl-grain{background-image:var(--bl-grain);background-size:var(--bl-grain-size,240px 240px);mix-blend-mode:multiply;opacity:.55}
.bl-gutter-l{background:linear-gradient(to left,rgba(70,45,15,.32) 0,rgba(70,45,15,.12) 2.5%,rgba(70,45,15,.04) 8%,transparent 16%),linear-gradient(to right,rgba(70,45,15,.1),transparent 3%)}
.bl-gutter-r{background:linear-gradient(to right,rgba(70,45,15,.3) 0,rgba(255,250,235,.25) 1%,rgba(70,45,15,.1) 3%,rgba(70,45,15,.03) 8%,transparent 16%),linear-gradient(to left,rgba(70,45,15,.1),transparent 3%)}
.bl-single .bl-gutter-l,.bl-single .bl-gutter-r{background:linear-gradient(to right,rgba(70,45,15,.22),rgba(70,45,15,.05) 4%,transparent 10%),linear-gradient(to left,rgba(70,45,15,.08),transparent 3%)}
.bl-light{background:radial-gradient(70% 60% at calc(40% + var(--px,0) * 30%) calc(30% + var(--py,0) * 25%),rgba(255,251,238,.45),transparent 70%);mix-blend-mode:soft-light}
.bl-age{background:radial-gradient(130% 110% at 50% 45%,transparent 55%,rgba(120,85,40,.16) 100%)}
.bl-dimmer{background:#000;opacity:var(--bl-dim)}
.bl-shade{background:linear-gradient(to right,rgba(30,16,4,.5),rgba(30,16,4,.15));opacity:0}
.bl-back .bl-shade{background:linear-gradient(to left,rgba(30,16,4,.5),rgba(30,16,4,.15))}
.bl-abs{position:absolute}
.bl-name{font-family:var(--bl-display);font-weight:500;color:var(--bl-saffron);font-size:calc(var(--u) * 4.5);line-height:.95;letter-spacing:.005em;margin:0;white-space:nowrap}
.bl-ch{display:inline-block;will-change:transform}
.bl-script{display:inline-block;font-family:var(--bl-script);color:#1b140d;font-size:calc(var(--u) * 3.5);line-height:1;padding:.32em .45em .2em .12em;margin:calc(var(--u) * -.35 - .32em) 0 0 calc(var(--u) * 1.6 - .12em);transform:rotate(-2.5deg);transform-origin:left;white-space:nowrap;--w:1.3;-webkit-mask-image:linear-gradient(100deg,#000 calc(var(--w) * 100% - 10%),transparent calc(var(--w) * 100%));mask-image:linear-gradient(100deg,#000 calc(var(--w) * 100% - 10%),transparent calc(var(--w) * 100%))}
.bl-single .bl-script{font-size:calc(var(--u) * 2.6)}
.bl-copy{font-size:calc(var(--u) * 1.16);line-height:1.46;text-align:justify;hyphens:auto;-webkit-hyphens:auto;color:var(--bl-ink)}
.bl-copy p{margin:0 0 .85em;--r:1.4;-webkit-mask-image:linear-gradient(180deg,#000 calc(var(--r) * 100% - 2.5em),transparent calc(var(--r) * 100%));mask-image:linear-gradient(180deg,#000 calc(var(--r) * 100% - 2.5em),transparent calc(var(--r) * 100%))}
.bl-copy p:last-child{margin-bottom:0}
.bl-note{font-style:italic}
.bl-folio-n{position:absolute;bottom:3.2%;font-family:var(--bl-display);font-size:calc(var(--u) * .95);letter-spacing:.18em;color:var(--bl-muted)}
.bl-run{position:absolute;bottom:3.2%;font-size:calc(var(--u) * .78);letter-spacing:.3em;text-transform:uppercase;color:var(--bl-muted);opacity:.8}
.bl-eng{pointer-events:none}
.bl-eng svg{display:block;width:100%;height:auto;max-width:none;overflow:visible}
.bl-eng-top{-webkit-mask-image:linear-gradient(to bottom,transparent 0,#000 34%);mask-image:linear-gradient(to bottom,transparent 0,#000 34%)}
.bl-eng-oval{-webkit-mask-image:radial-gradient(closest-side,#000 76%,transparent 100%);mask-image:radial-gradient(closest-side,#000 76%,transparent 100%)}
.bl-par{transform:translate3d(calc(var(--px,0) * var(--pd,4) * 1px),calc(var(--py,0) * var(--pd,4) * 1px),0);transition:transform .9s cubic-bezier(.2,.7,.2,1)}
.bl-eng-img{display:block;width:100%;height:auto;max-width:none;object-fit:cover;mix-blend-mode:multiply;--ink:1.3;-webkit-mask-image:linear-gradient(95deg,#000 calc(var(--ink) * 100% - 18%),transparent calc(var(--ink) * 100%));mask-image:linear-gradient(95deg,#000 calc(var(--ink) * 100% - 18%),transparent calc(var(--ink) * 100%))}
.bl-k{fill:none;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:1 2}
.bl-wreath{pointer-events:none;color:var(--bl-sepia)}
.bl-wreath svg{display:block;width:100%;height:auto;max-width:none;overflow:visible}
.bl-breathe{transform-box:fill-box;transform-origin:center;animation:bl-breathe 11s ease-in-out infinite alternate}
@keyframes bl-breathe{from{transform:rotate(-1.5deg) scale(.985)}to{transform:rotate(2deg) scale(1.025)}}
.bl-dish{position:absolute;aspect-ratio:1;transform:translate(-50%,-50%);z-index:2}
.bl-dish-in{position:absolute;inset:0;pointer-events:none}
.bl-dish-lift{position:absolute;inset:0;transition:transform .9s cubic-bezier(.2,.7,.2,1)}
.bl-dish-lift img{opacity:0;transition:opacity 1.4s ease;position:absolute;inset:0;width:100%;height:100%;max-width:none;display:block;user-select:none;-webkit-user-drag:none}
.bl-dish-lift img.bl-on{opacity:1}
.bl-hit{position:absolute;left:18%;top:18%;width:64%;height:64%;border-radius:50%;pointer-events:auto;cursor:default}
.bl-shadow,.bl-contact{position:absolute;left:50%;top:50%;border-radius:50%;transition:transform .9s cubic-bezier(.2,.7,.2,1),opacity .9s}
.bl-shadow{width:74%;height:74%;transform:translate(-45%,-42%);background:radial-gradient(closest-side,rgba(48,26,8,.5),rgba(48,26,8,.28) 55%,rgba(48,26,8,0));filter:blur(calc(var(--u) * 1.1))}
.bl-contact{width:70%;height:70%;transform:translate(-49%,-48.5%);background:radial-gradient(closest-side,rgba(30,14,2,.55) 88%,rgba(30,14,2,0));filter:blur(calc(var(--u) * .25))}
.bl-dish-in:hover .bl-dish-lift{transform:translateY(-1.8%) scale(1.025)}
.bl-dish-in:hover .bl-shadow{transform:translate(-42%,-37%) scale(1.07);opacity:.75}
.bl-dish-in:hover .bl-contact{opacity:.45;transform:translate(-48%,-46%) scale(1.03)}
.bl-steam{position:absolute;left:20%;top:-6%;width:60%;height:70%;overflow:visible;pointer-events:none;filter:blur(calc(var(--u) * .45))}
.bl-steam path{fill:none;stroke:rgba(255,252,244,.62);stroke-width:5;stroke-linecap:round;transform-box:fill-box;transform-origin:50% 100%;animation:bl-steam 7s ease-in-out infinite;opacity:0}
.bl-steam path:nth-child(2){animation-delay:-1.8s;animation-duration:8s}
.bl-steam path:nth-child(3){animation-delay:-3.6s;animation-duration:6.4s}
.bl-steam path:nth-child(4){animation-delay:-5.1s;animation-duration:7.6s}
@keyframes bl-steam{0%{transform:translateY(18%) scaleX(.8);opacity:0}25%{opacity:.85}70%{opacity:.35}100%{transform:translateY(-34%) scaleX(1.35) skewX(-8deg);opacity:0}}
.bl-fx-ship{transform-box:fill-box;transform-origin:50% 100%;animation:bl-ship 9s ease-in-out infinite alternate}
.bl-fx-far-ship{animation:bl-drift 40s ease-in-out infinite alternate}
.bl-fx-dhow{animation:bl-drift 26s ease-in-out infinite alternate}
.bl-fx-dhow:nth-of-type(odd){animation-duration:33s;animation-direction:alternate-reverse}
.bl-fx-sea{animation:bl-sea 7s ease-in-out infinite alternate}
.bl-fx-smoke,.bl-fx-jet{transform-box:fill-box;transform-origin:50% 100%;animation:bl-smoke 6s ease-in-out infinite alternate}
.bl-fx-birds{animation:bl-birds 14s ease-in-out infinite alternate}
@keyframes bl-ship{from{transform:translateX(-10px) rotate(-.6deg)}to{transform:translateX(14px) rotate(.7deg)}}
@keyframes bl-drift{from{transform:translateX(-40px)}to{transform:translateX(40px)}}
@keyframes bl-sea{from{transform:translateX(-5px)}to{transform:translateX(5px)}}
@keyframes bl-smoke{from{transform:skewX(-4deg) scaleY(.97)}to{transform:skewX(5deg) scaleY(1.04)}}
@keyframes bl-birds{from{transform:translate(-20px,4px)}to{transform:translate(30px,-6px)}}
.bl-toc{list-style:none;margin:0;padding:0}
.bl-toc li{margin:0 0 calc(var(--u) * 1.15)}
.bl-toc button{appearance:none;border:0;background:none;padding:0;width:100%;display:grid;grid-template-columns:calc(var(--u) * 3) auto 1fr auto;align-items:baseline;gap:calc(var(--u) * .6);text-align:left;cursor:pointer;color:inherit;font:inherit}
.bl-toc .n{font-family:var(--bl-display);font-size:calc(var(--u) * 1.3);color:var(--bl-saffron)}
.bl-toc .t{font-family:var(--bl-display);font-size:calc(var(--u) * 1.75);font-weight:600;line-height:1.05;transition:color .3s}
.bl-toc .t small{display:block;font-family:var(--bl-body);font-style:italic;font-weight:400;font-size:calc(var(--u) * .98);color:var(--bl-muted);margin-top:.2em}
.bl-toc .d{border-bottom:1px dotted color-mix(in srgb,var(--bl-ink) 45%,transparent);transform:translateY(-.35em);transition:border-color .3s}
.bl-toc .p{font-family:var(--bl-display);font-size:calc(var(--u) * 1.2)}
.bl-toc button:hover .t{color:var(--bl-saffron)}
.bl-toc button:hover .d{border-color:var(--bl-saffron)}
.bl-kicker{font-size:calc(var(--u) * .85);letter-spacing:.34em;text-transform:uppercase;color:var(--bl-muted)}
.bl-display{font-family:var(--bl-display);font-weight:500;color:var(--bl-saffron);line-height:.92;margin:0}
.bl-rule{display:flex;align-items:center;gap:calc(var(--u) * .8);color:var(--bl-saffron)}
.bl-rule::before,.bl-rule::after{content:"";height:1px;flex:1;background:currentColor;opacity:.55}
.bl-rule svg{width:calc(var(--u) * 1.4);height:calc(var(--u) * 1.4);max-width:none}
.bl-actions{display:flex;flex-wrap:wrap;gap:calc(var(--u) * .9)}
.bl-stamp{display:inline-flex;align-items:center;padding:calc(var(--u) * .7) calc(var(--u) * 1.4);border:1px solid var(--bl-ink);font-size:calc(var(--u) * .86);letter-spacing:.24em;text-transform:uppercase;color:var(--bl-ink);text-decoration:none;transition:background .35s,color .35s}
.bl-stamp:hover{background:var(--bl-ink);color:var(--bl-paper)}
.bl-stamp.solid{background:var(--bl-saffron);border-color:var(--bl-saffron);color:#fff8ec}
.bl-stamp.solid:hover{background:#b9531a;border-color:#b9531a}
.bl-form{display:flex;align-items:flex-end;gap:calc(var(--u) * 1)}
.bl-input{flex:1;min-width:0;border:0;border-bottom:1px solid color-mix(in srgb,var(--bl-ink) 50%,transparent);background:transparent;padding:calc(var(--u) * .4) 0;font:inherit;font-size:calc(var(--u) * 1.2);color:var(--bl-ink);border-radius:0}
.bl-input::placeholder{color:var(--bl-muted);font-style:italic}
.bl-seal{appearance:none;border:0;padding:0;background:none;cursor:pointer;width:calc(var(--u) * 4.6);height:calc(var(--u) * 4.6);flex:none;transition:transform .5s cubic-bezier(.2,.7,.2,1)}
.bl-seal:hover{transform:rotate(-8deg) scale(1.06)}
.bl-seal svg{width:100%;height:100%;max-width:none;display:block}
.bl-thanks{font-family:var(--bl-script);font-size:calc(var(--u) * 2.2);color:var(--bl-saffron)}
.bl-cols{display:grid;grid-template-columns:repeat(3,1fr);gap:calc(var(--u) * 1.6)}
.bl-cols h4{margin:0 0 calc(var(--u) * .8);font-size:calc(var(--u) * .82);letter-spacing:.3em;text-transform:uppercase;font-weight:500;color:var(--bl-muted)}
.bl-cols ul{list-style:none;margin:0;padding:0}
.bl-cols li{margin:0 0 calc(var(--u) * .45)}
.bl-cols a,.bl-socials a{color:var(--bl-ink);text-decoration:none;font-size:calc(var(--u) * 1.14);background:linear-gradient(var(--bl-saffron),var(--bl-saffron)) 0 100%/0 1px no-repeat;transition:background-size .45s cubic-bezier(.2,.7,.2,1),color .3s}
.bl-cols a:hover{background-size:100% 1px;color:var(--bl-saffron)}
.bl-socials{display:flex;gap:calc(var(--u) * .7)}
.bl-socials a{width:calc(var(--u) * 2.8);height:calc(var(--u) * 2.8);border:1px solid color-mix(in srgb,var(--bl-ink) 40%,transparent);border-radius:50%;display:grid;place-items:center;background:none}
.bl-socials a:hover{border-color:var(--bl-saffron);color:var(--bl-saffron)}
.bl-socials svg{width:44%;height:44%;max-width:none}
.bl-small{font-size:calc(var(--u) * .9);color:var(--bl-muted);line-height:1.5}
.bl-linkbtn{appearance:none;border:0;background:none;padding:0;cursor:pointer;font:inherit;font-size:calc(var(--u) * .9);letter-spacing:.24em;text-transform:uppercase;color:var(--bl-ink);border-bottom:1px solid var(--bl-saffron)}
.bl-cover{background:radial-gradient(120% 90% at 35% 30%,var(--bl-cloth),var(--bl-cloth-deep));color:var(--bl-foil)}
.bl-cloth{background-image:var(--bl-cloth-tex);background-size:180px 180px;mix-blend-mode:overlay;opacity:.55}
.bl-cover-spine{background:linear-gradient(to right,rgba(0,0,0,.45),rgba(255,255,255,.08) 2.4%,rgba(0,0,0,.18) 3.4%,transparent 7%)}
.bl-frame{position:absolute;inset:5%;border:1px solid var(--bl-foil);opacity:.8}
.bl-frame::after{content:"";position:absolute;inset:8px;border:2px solid var(--bl-foil);opacity:.7}
.bl-cover-c{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:12%}
.bl-foil{background:linear-gradient(105deg,var(--bl-foil) 0%,var(--bl-foil-hi) 22%,var(--bl-foil) 40%,#8f6726 60%,var(--bl-foil-hi) 82%,var(--bl-foil) 100%);background-size:240% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;animation:bl-foil 5s linear infinite}
@keyframes bl-foil{from{background-position:0 0}to{background-position:-240% 0}}
.bl-cover h1{font-family:var(--bl-display);font-weight:600;margin:0;line-height:.9;font-size:calc(var(--u) * 6.2);letter-spacing:.01em}
.bl-cover .s{font-family:var(--bl-script);font-size:calc(var(--u) * 3);margin-top:calc(var(--u) * .4)}
.bl-cover .v{font-size:calc(var(--u) * .9);letter-spacing:.42em;text-transform:uppercase;margin-top:calc(var(--u) * 2.4)}
.bl-load{position:absolute;left:24%;right:24%;bottom:12%;text-align:center;font-size:calc(var(--u) * .8);letter-spacing:.32em;text-transform:uppercase;color:var(--bl-foil);transition:opacity .6s}
.bl-load i{display:block;height:1px;margin-top:calc(var(--u) * .8);background:var(--bl-foil);transform-origin:left;transform:scaleX(var(--load,0));transition:transform 1.2s cubic-bezier(.2,.7,.2,1)}
.bl-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
.bl-mobile-only{display:none}
@media (max-width:860px){.bl-tabs,.bl-hint{display:none}.bl-mobile-only{display:inline}.bl-mark i{display:none}}
@media (max-width:520px){.bl-cta{padding:7px 12px;font-size:11px}.bl-mark b{font-size:18px}}
@media (prefers-reduced-motion:reduce){.bl-breathe,.bl-steam path,.bl-fx-ship,.bl-fx-far-ship,.bl-fx-dhow,.bl-fx-sea,.bl-fx-smoke,.bl-fx-jet,.bl-fx-birds,.bl-foil{animation:none}.bl-steam{display:none}.bl-par,.bl-dish-lift,.bl-shadow,.bl-contact{transition:none}}
`

// #region art
// Everything drawn on the pages lives here as pure functions: the seeded
// random source, the engraver's hatching, the three engravings, the spice
// wreath and the biryani painter. The tests lift this region out and run it.

export type BlPt = [number, number]
/** One engraved line: a path, its width, its ink and its x (for the draw order). */
export type BlInk = { d: string; w: number; o: number; x: number; e: number }
/** A fill: `a` 0 is paper (it hides what is behind), above 0 is an ink wash. */
export type BlFill = { d: string; a: number }
export type BlLayer = { fills: BlFill[]; inks: BlInk[]; fx: string }
export type BlScene = { w: number; h: number; layers: BlLayer[]; fade: "top" | "oval" }

export const blRng = (seed: number) => {
  let s = seed >>> 0 || 1
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
export const blClamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v)
export const blF = (n: number) => String(Math.round(n * 10) / 10)
export const blLine = (pts: BlPt[]) => (pts.length > 1 ? "M" + pts.map((p) => blF(p[0]) + " " + blF(p[1])).join("L") : "")
export const blPoly = (pts: BlPt[]) => blLine(pts) + "Z"
/** Smooth 1D value noise on [0, 1]. */
export const blNoise = (rng: () => number, n: number) => {
  const v: number[] = []
  for (let i = 0; i <= n + 1; i++) v.push(rng())
  return (t: number) => {
    const x = blClamp(t, 0, 1) * n
    const i = Math.floor(x)
    const f = x - i
    const u = f * f * (3 - 2 * f)
    return v[i] + (v[i + 1] - v[i]) * u
  }
}
/** Smooth 2D value noise on [-1, 1]². */
export const blNoise2 = (rng: () => number, n: number) => {
  const g: number[] = []
  for (let i = 0; i < (n + 2) * (n + 2); i++) g.push(rng())
  return (x: number, y: number) => {
    const gx = blClamp((x + 1) / 2, 0, 0.9999) * n
    const gy = blClamp((y + 1) / 2, 0, 0.9999) * n
    const i = Math.floor(gx)
    const j = Math.floor(gy)
    const fx = gx - i
    const fy = gy - j
    const ux = fx * fx * (3 - 2 * fx)
    const uy = fy * fy * (3 - 2 * fy)
    const at = (a: number, b: number) => g[b * (n + 2) + a]
    const top = at(i, j) + (at(i + 1, j) - at(i, j)) * ux
    const bot = at(i, j + 1) + (at(i + 1, j + 1) - at(i, j + 1)) * ux
    return top + (bot - top) * uy
  }
}
export const blQuad = (a: BlPt, c: BlPt, b: BlPt, n = 10): BlPt[] => {
  const out: BlPt[] = []
  for (let i = 0; i <= n; i++) {
    const t = i / n
    const m = 1 - t
    out.push([m * m * a[0] + 2 * m * t * c[0] + t * t * b[0], m * m * a[1] + 2 * m * t * c[1] + t * t * b[1]])
  }
  return out
}
export const blEllipse = (cx: number, cy: number, rx: number, ry: number, a0 = 0, a1 = Math.PI * 2, n = 24): BlPt[] => {
  const out: BlPt[] = []
  for (let i = 0; i <= n; i++) {
    const a = a0 + ((a1 - a0) * i) / n
    out.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry])
  }
  return out
}

/**
 * The engraver's tool: parallel lines at `ang`, `gap` apart, clipped to a
 * polygon. With a rng the line ends wander in and long lines break, the way
 * a burin line does.
 */
export const blHatch = (poly: BlPt[], ang: number, gap: number, rng?: () => number, broken = 0): BlPt[][] => {
  const c = Math.cos(-ang)
  const s = Math.sin(-ang)
  const ci = Math.cos(ang)
  const si = Math.sin(ang)
  const rp = poly.map((p) => [p[0] * c - p[1] * s, p[0] * s + p[1] * c] as BlPt)
  const back = (x: number, y: number): BlPt => [x * ci - y * si, x * si + y * ci]
  let y0 = Infinity
  let y1 = -Infinity
  for (const p of rp) {
    if (p[1] < y0) y0 = p[1]
    if (p[1] > y1) y1 = p[1]
  }
  const out: BlPt[][] = []
  for (let y = y0 + gap * 0.5; y < y1; y += gap) {
    const xs: number[] = []
    for (let i = 0; i < rp.length; i++) {
      const a = rp[i]
      const b = rp[(i + 1) % rp.length]
      if ((a[1] <= y && b[1] > y) || (b[1] <= y && a[1] > y)) xs.push(a[0] + ((y - a[1]) / (b[1] - a[1])) * (b[0] - a[0]))
    }
    xs.sort((m, n) => m - n)
    for (let i = 0; i + 1 < xs.length; i += 2) {
      let xa = xs[i]
      let xb = xs[i + 1]
      if (rng) {
        xa += rng() * gap * 0.8
        xb -= rng() * gap * 0.8
      }
      if (xb - xa < 1.2) continue
      if (rng && broken > 0 && xb - xa > 36 && rng() < broken) {
        const m = xa + (xb - xa) * (0.25 + rng() * 0.5)
        out.push([back(xa, y), back(m - 1.5 - rng() * 5, y)])
        out.push([back(m + 1.5, y), back(xb, y)])
      } else out.push([back(xa, y), back(xb, y)])
    }
  }
  return out
}

const blLayer = (fx = ""): BlLayer => ({ fills: [], inks: [], fx })
const blInk = (L: BlLayer, pts: BlPt[], w = 1, o = 0.8) => {
  const d = blLine(pts)
  if (!d) return
  let x = Infinity
  let e = -Infinity
  for (const p of pts) {
    if (p[0] < x) x = p[0]
    if (p[0] > e) e = p[0]
  }
  L.inks.push({ d, w, o, x, e })
}
const blInkD = (L: BlLayer, d: string, x: number, e: number, w = 1, o = 0.8) => L.inks.push({ d, w, o, x, e })
const blShade = (L: BlLayer, poly: BlPt[], ang: number, gap: number, w: number, o: number, rng?: () => number, broken = 0) => {
  for (const seg of blHatch(poly, ang, gap, rng, broken)) blInk(L, seg, w, o)
}
const blPaper = (L: BlLayer, poly: BlPt[]) => L.fills.push({ d: blPoly(poly), a: 0 })
const blWash = (L: BlLayer, poly: BlPt[], a: number) => L.fills.push({ d: blPoly(poly), a })

/** Lines that follow a ridge down its flank: the engraver's way of modelling a hill. */
const blContours = (L: BlLayer, ridge: (x: number) => number, x0: number, x1: number, base: number, n: number, gap: number, w: number, o0: number, o1: number, rng: () => number) => {
  for (let k = 1; k <= n; k++) {
    let seg: BlPt[] = []
    let run = 30 + rng() * 170
    const o = o0 + ((o1 - o0) * k) / n
    const flush = () => {
      if (seg.length > 1) blInk(L, seg, w, o)
      seg = []
    }
    for (let x = x0; x <= x1; x += 6) {
      const y = ridge(x) + k * gap * (1 + 0.18 * Math.sin(x * 0.013 + k * 0.7))
      if (y > base - 1.5) {
        flush()
        continue
      }
      if (run <= 0) {
        flush()
        run = 40 + rng() * 210
        x += 3 + rng() * 12
        continue
      }
      seg.push([x, y])
      run -= 6
    }
    flush()
  }
}
/** Short strokes down the shadowed flank of a ridge (light comes from the left). */
const blFlank = (L: BlLayer, ridge: (x: number) => number, x0: number, x1: number, base: number, depth: number, w: number, o: number, rng: () => number) => {
  for (let x = x0; x < x1; x += 2.6 + rng() * 1.4) {
    const y = ridge(x)
    const slope = (ridge(x + 4) - ridge(x - 4)) / 8
    if (slope < 0.12) continue
    const len = depth * (0.35 + rng() * 0.65) * Math.min(1.6, slope * 2.2)
    const y2 = Math.min(base - 1, y + len)
    if (y2 - y < 3) continue
    blInk(L, [[x, y + 1], [x + len * 0.28, y2]], w, o * (0.6 + rng() * 0.4))
  }
}
/** A line of trees as an engraver draws it: little scallops with stipple beneath. */
const blTreeline = (L: BlLayer, x0: number, x1: number, y: number, h0: number, h1: number, rng: () => number, o = 0.75) => {
  let d = "M" + blF(x0) + " " + blF(y)
  let x = x0
  const tops: BlPt[] = []
  while (x < x1) {
    const w = 5 + rng() * 9
    const h = h0 + rng() * (h1 - h0)
    d += "Q" + blF(x + w / 2) + " " + blF(y - h * 1.7) + " " + blF(x + w) + " " + blF(y - rng() * 1.6)
    tops.push([x + w / 2, y - h])
    x += w
  }
  L.fills.push({ d: d + "L" + blF(x) + " " + blF(y + 3) + "L" + blF(x0) + " " + blF(y + 3) + "Z", a: 0 })
  blInkD(L, d, x0, x, 0.8, o)
  for (const t of tops) {
    const n = 1 + Math.floor(rng() * 3)
    for (let i = 0; i < n; i++) {
      const sx = t[0] + (rng() - 0.3) * 5
      blInk(L, [[sx, t[1] + 2 + rng() * 2], [sx + 0.6, y]], 0.6, o * 0.7)
    }
  }
}
const blPalm = (L: BlLayer, x: number, y: number, h: number, lean: number, rng: () => number, o = 0.85) => {
  const top: BlPt = [x + lean, y - h]
  const spine = blQuad([x, y], [x + lean * 0.15, y - h * 0.55], top, 12)
  blInk(L, spine.map((p, i) => [p[0] - 1.6 * (1 - i / 14), p[1]] as BlPt), 0.8, o)
  blInk(L, spine.map((p, i) => [p[0] + 1.6 * (1 - i / 14), p[1]] as BlPt), 0.8, o)
  for (let i = 1; i < spine.length - 1; i++) blInk(L, [[spine[i][0] - 1.5, spine[i][1]], [spine[i][0] + 1.5, spine[i][1] + 0.8]], 0.5, o * 0.8)
  const n = 8 + Math.floor(rng() * 3)
  for (let f = 0; f < n; f++) {
    const a = -Math.PI * (0.06 + (0.88 * f) / (n - 1)) + (rng() - 0.5) * 0.25
    const len = h * (0.34 + rng() * 0.16)
    const droop = len * (0.25 + 0.35 * Math.abs(Math.cos(a)))
    const end: BlPt = [top[0] + Math.cos(a) * len, top[1] + Math.sin(a) * len * 0.55 + droop]
    const ctl: BlPt = [top[0] + Math.cos(a) * len * 0.55, top[1] + Math.sin(a) * len * 0.7 - len * 0.12]
    const rib = blQuad(top, ctl, end, 10)
    blInk(L, rib, 0.7, o)
    for (let i = 1; i < rib.length; i++) {
      const p = rib[i]
      const q = rib[i - 1]
      const tx = p[0] - q[0]
      const ty = p[1] - q[1]
      const tl = Math.hypot(tx, ty) || 1
      const ll = 5.5 * (1 - i / rib.length) + 1.5
      blInk(L, [p, [p[0] + (tx / tl) * ll * 0.4 - (ty / tl) * ll * 0.3, p[1] + ll]], 0.45, o * 0.8)
    }
  }
}
/** A leafy tree: a canopy of scalloped lobes, shaded on the right, and a trunk. */
const blTree = (L: BlLayer, x: number, y: number, w: number, h: number, rng: () => number, o = 0.8) => {
  blInk(L, [[x - 2, y], [x - 1, y - h * 0.45]], 1, o)
  blInk(L, [[x + 2, y], [x + 1.5, y - h * 0.45]], 1, o)
  const lobes: BlPt[] = []
  const n = 12
  for (let i = 0; i <= n; i++) {
    const a = Math.PI + (Math.PI * i) / n
    lobes.push([x + Math.cos(a) * w * 0.5, y - h * 0.45 + Math.sin(a) * h * 0.55])
  }
  const outline: BlPt[] = []
  for (let i = 0; i < lobes.length - 1; i++) {
    const p = lobes[i]
    const q = lobes[i + 1]
    const mid: BlPt = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2]
    const dx = mid[0] - x
    const dy = mid[1] - (y - h * 0.45)
    const dl = Math.hypot(dx, dy) || 1
    const bulge = 6 + rng() * 7
    for (const pt of blQuad(p, [mid[0] + (dx / dl) * bulge, mid[1] + (dy / dl) * bulge], q, 5)) outline.push(pt)
  }
  const poly: BlPt[] = [...outline, [x + w * 0.5, y - h * 0.4], [x - w * 0.5, y - h * 0.4]]
  blPaper(L, poly)
  blInk(L, outline, 0.8, o)
  for (let i = 0; i < w * h * 0.012; i++) {
    const px = x + (rng() - 0.5) * w * 0.85
    const py = y - h * 0.45 - rng() * h * 0.5
    const r = 2.5 + rng() * 3
    const dark = px > x ? 1 : 0.55
    blInk(L, blEllipse(px, py, r, r * 0.75, Math.PI * 0.1, Math.PI * 0.95, 5), 0.5, o * dark * 0.8)
  }
  blShade(L, [[x + w * 0.05, y - h * 0.85], [x + w * 0.45, y - h * 0.6], [x + w * 0.45, y - h * 0.42], [x, y - h * 0.42]], 1.1, 2.6, 0.45, o * 0.5, rng)
}
/** A building block: paper face, outline, shadow hatching, optional crenels and windows. */
const blBlock = (L: BlLayer, x: number, y: number, w: number, h: number, rng: () => number, opt: { crenel?: boolean; rows?: number; cols?: number; shade?: number; o?: number; tone?: number } = {}) => {
  const o = opt.o ?? 0.85
  const face: BlPt[] = [[x, y], [x + w, y], [x + w, y - h], [x, y - h]]
  blPaper(L, face)
  if (opt.tone) blWash(L, face, opt.tone)
  blInk(L, [...face, [x, y]], 0.9, o)
  blShade(L, face, Math.PI / 2, 5.2, 0.45, o * 0.32, rng)
  const sh = opt.shade ?? 0.3
  if (sh > 0) blShade(L, [[x + w * (1 - sh), y], [x + w, y], [x + w, y - h], [x + w * (1 - sh), y - h]], Math.PI / 2, 2.1, 0.5, o * 0.7)
  if (opt.crenel) {
    const pts: BlPt[] = [[x - 1, y - h]]
    const m = Math.max(3, Math.round(w / 7))
    const step = (w + 2) / m
    for (let i = 0; i < m; i++) {
      const a = x - 1 + i * step
      pts.push([a, y - h - 5], [a + step * 0.55, y - h - 5], [a + step * 0.55, y - h], [a + step, y - h])
    }
    L.fills.push({ d: blPoly([...pts, [x + w + 1, y - h + 1], [x - 1, y - h + 1]]), a: 0 })
    blInk(L, pts, 0.8, o)
  }
  const rows = opt.rows ?? 0
  const cols = opt.cols ?? 0
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      if (rng() < 0.12) continue
      const wx = x + ((c + 0.5) * w) / cols - 1.6
      const wy = y - h + ((r + 0.4) * h) / (rows + 0.3)
      blWash(L, [[wx, wy], [wx + 3.2, wy], [wx + 3.2, wy + 5], [wx, wy + 5]], 0.8)
    }
}
const blSea = (L: BlLayer, x0: number, x1: number, y0: number, y1: number, rng: () => number, o0 = 0.35, o1 = 0.75) => {
  let i = 0
  for (let y = y0 + 2; y < y1; i++) {
    const t = (y - y0) / (y1 - y0)
    let x = x0 - rng() * 60
    while (x < x1) {
      const len = (18 + rng() * 150) * (0.6 + t)
      const gap = 5 + rng() * (28 - t * 14)
      const a = Math.max(x, x0)
      const b = Math.min(x + len, x1)
      if (b - a > 4) {
        const wv = (rng() - 0.5) * 1.6
        blInkD(L, "M" + blF(a) + " " + blF(y) + "Q" + blF((a + b) / 2) + " " + blF(y + wv) + " " + blF(b) + " " + blF(y), a, b, 0.55 + t * 0.5, o0 + (o1 - o0) * t * (0.6 + rng() * 0.4))
      }
      x += len + gap
    }
    y += 2.2 + Math.pow(i, 1.18) * 0.32
  }
}
const blBirds = (L: BlLayer, pts: BlPt[], s: number, o = 0.7) => {
  for (const [x, y] of pts) blInkD(L, "M" + blF(x - s) + " " + blF(y) + "Q" + blF(x - s * 0.5) + " " + blF(y - s * 0.6) + " " + blF(x) + " " + blF(y) + "Q" + blF(x + s * 0.5) + " " + blF(y - s * 0.6) + " " + blF(x + s) + " " + blF(y), x - s, x + s, 0.7, o)
}

// ---- ships --------------------------------------------------------------------
type BlXf = (p: BlPt) => BlPt
const blXf = (ox: number, oy: number, s: number, flip: boolean): BlXf => (p) => [ox + (flip ? -p[0] : p[0]) * s, oy + p[1] * s]
const blSail = (x: number, top: number, bot: number, hw: number, sag: number): BlPt[] => {
  const out: BlPt[] = [[x - hw, top], [x + hw, top]]
  for (const p of blQuad([x + hw * 0.94, bot], [x, bot + sag], [x - hw * 0.94, bot], 8)) out.push(p)
  return out
}
/** An East Indiaman under sail. Local units: hull ~210 long, waterline at y 0, bow to -x. */
export const blShip = (ox: number, oy: number, s: number, flip: boolean, rng: () => number, o = 0.9): BlLayer => {
  const L = blLayer("ship")
  const T = blXf(ox, oy, s, flip)
  const M = (pts: BlPt[]) => pts.map(T)
  const hull: BlPt[] = [[-100, -32], [-70, -26], [-20, -24], [30, -25], [70, -30], [92, -40], [106, -38], [101, -18], [86, -6], [60, 0], [-60, 0], [-84, -6], [-96, -18]]
  const sails: BlPt[][] = []
  const masts: [number, number][] = [[-48, -198], [8, -226], [62, -172]]
  const rigs: [number, number, number][][] = [
    [[-104, -62, 30], [-146, -108, 25], [-178, -150, 18]],
    [[-110, -60, 37], [-158, -114, 31], [-194, -162, 22], [-214, -197, 13]],
    [[-150, -126, 19], [-168, -153, 12]],
  ]
  rigs.forEach((ms, i) => ms.forEach(([top, bot, hw]) => sails.push(blSail(masts[i][0], top, bot, hw, 9 + hw * 0.18))))
  const spanker: BlPt[] = [[63, -40], [63, -118], [110, -96], [118, -42]]
  const jibs: BlPt[][] = [[[-50, -186], [-162, -58], [-118, -46]], [[-50, -150], [-136, -52], [-100, -40]]]
  for (const p of [hull, ...sails, spanker, ...jibs]) blPaper(L, M(p))
  // hull
  blInk(L, M([...hull, hull[0]]), 1.1, o)
  blShade(L, M(hull), 0, 3.2 * s, 0.5, o * 0.45, rng)
  blShade(L, M([[-90, -13], [99, -13], [86, -6], [60, 0], [-60, 0], [-84, -6]]), 0, 1.6 * s, 0.5, o * 0.75)
  blInk(L, M([[-96, -26], [-60, -20], [0, -18], [60, -21], [100, -30]]), 0.7, o * 0.8)
  for (let i = 0; i < 9; i++) {
    const gx = -68 + i * 17
    L.fills.push({ d: blPoly(M([[gx, -17], [gx + 5, -17], [gx + 5, -13], [gx, -13]])), a: 0.85 })
  }
  for (let i = 0; i < 3; i++) L.fills.push({ d: blPoly(M([[95, -34 + i * 6], [99, -34 + i * 6], [99, -31 + i * 6], [95, -31 + i * 6]])), a: 0.8 })
  // masts, bowsprit, yards
  for (const [mx, mt] of masts) blInk(L, M([[mx, -24], [mx, mt]]), 1.5, o)
  blInk(L, M([[-98, -34], [-170, -60]]), 1.3, o)
  rigs.forEach((ms, i) => ms.forEach(([top, , hw]) => blInk(L, M([[masts[i][0] - hw - 4, top], [masts[i][0] + hw + 4, top]]), 1.1, o)))
  // sails: a light hatch everywhere, deeper on the shadowed belly
  for (const sl of sails) {
    blInk(L, M([...sl, sl[0]]), 0.8, o)
    const x0 = sl[0][0]
    const x1 = sl[1][0]
    const xm = x0 + (x1 - x0) * 0.5
    blShade(L, M(sl), Math.PI / 2, 3.4 * s, 0.45, o * 0.3, rng)
    blShade(L, M(sl.filter((p) => p[0] >= xm - 0.1).concat([[xm, sl[sl.length - 1][1] + 4], [xm, sl[0][1]]])), Math.PI / 2, 1.8 * s, 0.45, o * 0.55, rng)
  }
  blInk(L, M([...spanker, spanker[0]]), 0.8, o)
  blShade(L, M(spanker), 1.2, 2.6 * s, 0.45, o * 0.45, rng)
  for (const j of jibs) {
    blInk(L, M([...j, j[0]]), 0.8, o)
    blShade(L, M(j), -0.95, 3 * s, 0.45, o * 0.35, rng)
  }
  // rigging
  const rig: BlPt[][] = [[[-48, -198], [-170, -60]], [[8, -226], [-48, -198]], [[62, -172], [8, -204]], [[62, -172], [106, -40]], [[8, -226], [92, -40]], [[-48, -198], [-92, -32]]]
  for (const [mx, mt] of masts)
    for (let k = 0; k < 3; k++) {
      rig.push([[mx, mt * 0.55 - k * 6], [mx - 14 - k * 4, -26]])
      rig.push([[mx, mt * 0.55 - k * 6], [mx + 14 + k * 4, -27]])
    }
  for (const r of rig) blInk(L, M(r), 0.45, o * 0.75)
  for (const [mx, mt] of masts) L.fills.push({ d: blPoly(M([[mx, mt], [mx, mt - 8], [mx + 26, mt - 3]])), a: 0.75 })
  // its reflection
  for (let i = 0; i < 9; i++) {
    const ry = 4 + i * 2.2
    const rx = (rng() - 0.5) * 80
    const rl = 20 + rng() * 60
    blInk(L, M([[rx - rl / 2, ry], [rx + rl / 2, ry + 0.4]]), 0.6, o * (0.55 - i * 0.04))
  }
  return L
}
/** A Malabar dhow with its lateen sail. Local units, ~80 long. */
export const blDhow = (ox: number, oy: number, s: number, flip: boolean, rng: () => number, o = 0.85): BlLayer => {
  const L = blLayer("dhow")
  const T = blXf(ox, oy, s, flip)
  const M = (pts: BlPt[]) => pts.map(T)
  const hull: BlPt[] = [[-48, -17], [-32, -9], [20, -8], [36, -14], [30, -3], [-26, 0]]
  const sail: BlPt[] = [[-50, -24], ...blQuad([26, -90], [34, -50], [20, -12], 6), [-50, -24]]
  blPaper(L, M(hull))
  blPaper(L, M(sail))
  blInk(L, M([...hull, hull[0]]), 0.9, o)
  blShade(L, M(hull), 0, 1.8 * s, 0.45, o * 0.65)
  blInk(L, M([[-4, -9], [-10, -66]]), 1.1, o)
  blInk(L, M([[-52, -22], [28, -92]]), 1, o)
  blInk(L, M(sail), 0.75, o)
  blShade(L, M(sail), -0.72, 3 * s, 0.45, o * 0.4, rng)
  blInk(L, M([[0, -9], [0, -20]]), 1.4, o)
  for (let i = 0; i < 4; i++) blInk(L, M([[-30 + i * 14, 3 + i * 2], [-14 + i * 14, 3 + i * 2]]), 0.5, o * 0.5)
  return L
}
/** A small figure in a long jama and turban, feet at (x, y), `h` tall. */
const blFigure = (L: BlLayer, x: number, y: number, h: number, rng: () => number, opt: { stride?: number; arm?: number; o?: number; dir?: number } = {}) => {
  const o = opt.o ?? 0.85
  const st = opt.stride ?? 0.4
  const dir = opt.dir ?? 1
  const head = blEllipse(x, y - h * 0.9, h * 0.055, h * 0.062, 0, Math.PI * 2, 10)
  const turban = blEllipse(x, y - h * 0.93, h * 0.07, h * 0.05, Math.PI, Math.PI * 2, 8)
  const robe: BlPt[] = [[x - h * 0.075, y - h * 0.83], [x + h * 0.075, y - h * 0.83], [x + h * 0.09, y - h * 0.6], [x + h * 0.17, y - h * 0.36], [x - h * 0.16, y - h * 0.36], [x - h * 0.085, y - h * 0.6]]
  blPaper(L, robe)
  blPaper(L, head)
  blInk(L, [...robe, robe[0]], 0.8, o)
  blShade(L, robe, Math.PI / 2 + 0.08 * dir, 2, 0.45, o * 0.6, rng)
  blInk(L, head, 0.7, o)
  blPaper(L, turban)
  blInk(L, turban, 0.8, o)
  blShade(L, [...turban], 0.3, 1.4, 0.4, o * 0.5)
  blInk(L, [[x - h * 0.05, y - h * 0.36], [x - h * 0.05 - st * h * 0.12 * dir, y]], 1, o)
  blInk(L, [[x + h * 0.05, y - h * 0.36], [x + h * 0.05 + st * h * 0.12 * dir, y]], 1, o)
  const arm = opt.arm ?? 0
  blInk(L, [[x - h * 0.1, y - h * 0.6], [x + h * 0.11, y - h * 0.6]], 1.4, o)
  blInk(L, blQuad([x - h * 0.15, y - h * 0.36], [x, y - h * 0.33], [x + h * 0.16, y - h * 0.36], 6), 0.7, o)
  blInk(L, [[x + h * 0.075 * dir, y - h * 0.81], [x + h * 0.14 * dir, y - h * (0.66 + arm * 0.24)], [x + h * 0.1 * dir, y - h * (0.52 + arm * 0.42)]], 1.1, o)
  blInk(L, [[x - h * 0.075 * dir, y - h * 0.81], [x - h * 0.13 * dir, y - h * 0.64], [x - h * 0.1 * dir, y - h * (0.5 + arm * 0.4)]], 1.1, o)
  blInk(L, [[x, y - h * 0.83], [x + h * 0.03 * dir, y - h * 0.6]], 0.5, o * 0.7)
  for (let i = 0; i < 4; i++) blInk(L, [[x - h * 0.16 + i * 2, y + 1 + i], [x + h * 0.16 + i * 3, y + 1 + i]], 0.5, o * 0.4)
}

// ---- the three engravings -------------------------------------------------------
/** A Malabar harbour: hills, a fort with its flag, palms, tall ships and dhows. */
export const blHarbour = (seed: number): BlScene => {
  const r = blRng(seed)
  const W = 1600
  const H = 520
  const HZ = 338
  const sky = blLayer("sky")
  for (const [cx, cy, rx, ry] of [[260, 120, 170, 26], [1220, 70, 220, 22], [700, 50, 120, 14]] as number[][]) blShade(sky, blEllipse(cx, cy, rx, ry), 0, 4.2, 0.45, 0.22, r, 0.5)
  const nA = blNoise(r, 7)
  const nB = blNoise(r, 21)
  const nC = blNoise(r, 55)
  const env = (x: number) => 0.25 + 0.75 * Math.exp(-(((x - 1060) / 430) ** 2)) + 0.4 * Math.exp(-(((x - 300) / 220) ** 2))
  const far = (x: number) => HZ - 6 - env(x) * (80 + 175 * (0.55 * nA(x / W) + 0.3 * nB(x / W) + 0.15 * nC(x / W)))
  const L1 = blLayer("far")
  const farPoly: BlPt[] = [[-10, HZ]]
  for (let x = -10; x <= W + 10; x += 8) farPoly.push([x, far(x)])
  farPoly.push([W + 10, HZ])
  blPaper(L1, farPoly)
  blInk(L1, farPoly.slice(1, -1), 0.9, 0.62)
  blContours(L1, far, -10, W + 10, HZ, 40, 5, 0.55, 0.55, 0.2, r)
  blFlank(L1, far, 0, W, HZ, 46, 0.5, 0.6, r)
  const nD = blNoise(r, 13)
  const menv = (x: number) => Math.exp(-(((x - 90) / 250) ** 2)) + 0.9 * Math.exp(-(((x - 1520) / 230) ** 2))
  const mid = (x: number) => HZ - 2 - menv(x) * (34 + 86 * nD(x / W)) + Math.sin(x * 0.4) * 0.8
  const L2 = blLayer("mid")
  for (const [a, b] of [[-10, 470], [1180, W + 10]]) {
    const pts: BlPt[] = [[a, HZ]]
    for (let x = a; x <= b; x += 5) pts.push([x, Math.min(HZ, mid(x))])
    pts.push([b, HZ])
    blPaper(L2, pts)
    blInk(L2, pts.slice(1, -1), 0.9, 0.8)
    blContours(L2, mid, a, b, HZ, 16, 3.4, 0.5, 0.62, 0.3, r)
    blFlank(L2, mid, a, b, HZ, 22, 0.5, 0.7, r)
  }
  const town = blLayer("town")
  blTreeline(town, -10, W + 10, HZ, 3, 8, r, 0.7)
  // the fort on its rise
  const rise: BlPt[] = [[330, HZ], [360, HZ - 14], [700, HZ - 16], [730, HZ]]
  blPaper(town, rise)
  blInk(town, rise, 0.8, 0.8)
  blShade(town, rise, 0, 2.4, 0.45, 0.5, r)
  blBlock(town, 372, HZ - 14, 128, 44, r, { crenel: true, rows: 2, cols: 9, shade: 0.28 })
  blBlock(town, 470, HZ - 14, 40, 76, r, { crenel: true, rows: 3, cols: 2, shade: 0.4 })
  blBlock(town, 510, HZ - 14, 150, 30, r, { crenel: true, rows: 1, cols: 10, shade: 0.2 })
  blBlock(town, 600, HZ - 14, 52, 50, r, { rows: 2, cols: 3, shade: 0.35 })
  blInk(town, [[490, HZ - 90], [490, HZ - 150]], 1, 0.9)
  const flag = blQuad([490, HZ - 150], [508, HZ - 146], [526, HZ - 150], 6).concat(blQuad([526, HZ - 136], [508, HZ - 132], [490, HZ - 136], 6))
  blPaper(town, flag)
  blInk(town, [...flag, flag[0]], 0.7, 0.85)
  blShade(town, flag, 0.05, 2.6, 0.45, 0.7)
  for (const [hx, hw, hh] of [[700, 30, 18], [736, 24, 22], [770, 36, 16], [820, 26, 20], [860, 30, 15], [1120, 24, 16], [1150, 30, 20]]) {
    blBlock(town, hx, HZ - 2, hw, hh, r, { rows: 1, cols: 2, shade: 0.35, o: 0.75 })
    const roof: BlPt[] = [[hx - 3, HZ - 2 - hh], [hx + hw / 2, HZ - 2 - hh - 12], [hx + hw + 3, HZ - 2 - hh]]
    blPaper(town, roof)
    blInk(town, [...roof, roof[0]], 0.7, 0.8)
    blShade(town, roof, -0.6, 2.2, 0.45, 0.6)
  }
  for (const [px, ph, pl] of [[60, 74, 10], [140, 58, -8], [300, 66, 12], [690, 52, -6], [930, 70, 10], [990, 54, -9], [1080, 62, 6], [1270, 78, -12], [1350, 60, 8], [1450, 72, -6]]) blPalm(town, px, HZ + 2, ph, pl, r, 0.8)
  const sea = blLayer("sea")
  blSea(sea, -10, W + 10, HZ + 1, H, r)
  const ships = [blShip(1340, 462, 0.84, false, r), blShip(250, 478, 0.96, true, r), blShip(880, 366, 0.24, true, r, 0.7)]
  ships[2].fx = "far-ship"
  const dhows = [blDhow(640, 420, 0.62, false, r), blDhow(1040, 392, 0.45, true, r, 0.75), blDhow(1520, 382, 0.4, false, r, 0.7)]
  const birds = blLayer("birds")
  blBirds(birds, [[760, 150], [784, 136], [808, 158], [1180, 190], [1204, 176]], 7, 0.65)
  return { w: W, h: H, layers: [sky, L1, L2, town, sea, ...dhows, ...ships, birds], fade: "top" }
}

/** A hill fort on a rocky bank above a slow river, smoke rising from the ghat. */
export const blFort = (seed: number): BlScene => {
  const r = blRng(seed)
  const W = 1400
  const H = 760
  const RV = 600
  const sky = blLayer("sky")
  for (const [cx, cy, rx, ry] of [[1000, 120, 260, 34], [300, 210, 200, 22]] as number[][]) blShade(sky, blEllipse(cx, cy, rx, ry), 0, 4.4, 0.45, 0.2, r, 0.5)
  const nA = blNoise(r, 9)
  const hills = blLayer("far")
  const hill = (x: number) => RV - 160 - 90 * Math.exp(-(((x - 80) / 260) ** 2)) * (0.6 + 0.4 * nA(x / W)) - 30 * nA(x / W)
  const hp: BlPt[] = [[-10, RV]]
  for (let x = -10; x <= 520; x += 8) hp.push([x, hill(x)])
  hp.push([520, RV])
  blPaper(hills, hp)
  blInk(hills, hp.slice(1, -1), 0.8, 0.45)
  blContours(hills, hill, -10, 520, RV, 18, 5, 0.45, 0.35, 0.12, r)
  // the rock: plateau where the walls stand, a scarred face down to the water
  const nB = blNoise(r, 17)
  const top = (x: number) => 432 + 14 * Math.sin(x * 0.01) + 18 * nB(x / W)
  const rock = blLayer("rock")
  const face: BlPt[] = [[150, RV]]
  for (let x = 150; x <= 330; x += 6) face.push([x, RV - ((x - 150) / 180) ** 0.7 * (RV - top(330))])
  for (let x = 336; x <= W + 10; x += 6) face.push([x, top(x)])
  face.push([W + 10, RV])
  blPaper(rock, face)
  blWash(rock, face, 0.2)
  blInk(rock, face.slice(1, -1), 1, 0.85)
  blShade(rock, face, 1.15, 4.2, 0.5, 0.42, r, 0.4)
  blShade(rock, [[150, RV], [W + 10, RV], [W + 10, RV - 46], [180, RV - 40]], 1.15, 2.2, 0.5, 0.5, r, 0.3)
  for (let i = 0; i < 70; i++) {
    const cx = 220 + r() * (W - 200)
    const cy = top(cx) + 14 + r() * (RV - top(cx) - 22)
    const pts: BlPt[] = [[cx, cy]]
    for (let k = 0; k < 3; k++) pts.push([pts[k][0] + (r() - 0.3) * 22, pts[k][1] + 4 + r() * 9])
    blInk(rock, pts, 0.7, 0.7)
  }
  // the walls
  const fort = blLayer("fort")
  const base = (x: number) => top(x) + 2
  const parts: [number, number, number, { crenel?: boolean; rows?: number; cols?: number; shade?: number }][] = [
    [330, 90, 100, { crenel: true, rows: 2, cols: 3, shade: 0.4 }],
    [420, 160, 72, { crenel: true, rows: 1, cols: 7, shade: 0.15 }],
    [560, 96, 210, { crenel: true, rows: 5, cols: 3, shade: 0.42 }],
    [656, 170, 84, { crenel: true, rows: 2, cols: 8, shade: 0.15 }],
    [800, 74, 128, { crenel: true, rows: 3, cols: 2, shade: 0.45 }],
    [874, 190, 96, { crenel: true, rows: 2, cols: 9, shade: 0.18 }],
    [1040, 120, 150, { crenel: true, rows: 3, cols: 5, shade: 0.38 }],
    [1160, 120, 80, { crenel: true, rows: 1, cols: 6, shade: 0.2 }],
    [1250, 64, 132, { crenel: true, rows: 3, cols: 2, shade: 0.45 }],
    [1314, 100, 70, { crenel: true, rows: 1, cols: 4, shade: 0.2 }],
  ]
  for (const [x, w, h, opt] of parts) blBlock(fort, x, base(x + w / 2), w, h, r, { ...opt, tone: 0.1 })
  // a domed pavilion on the keep
  const dome = [...blEllipse(608, base(608) - 210, 26, 30, Math.PI, Math.PI * 2, 16)]
  blPaper(fort, [...dome, [634, base(608) - 208], [582, base(608) - 208]])
  blInk(fort, dome, 0.9, 0.85)
  blShade(fort, [...blEllipse(608, base(608) - 210, 26, 30, Math.PI * 1.5, Math.PI * 2, 8), [608, base(608) - 210]], Math.PI / 2, 2, 0.45, 0.6)
  blInk(fort, [[608, base(608) - 240], [608, base(608) - 254]], 0.9, 0.85)
  // the river, with the fort's broken reflection
  const water = blLayer("sea")
  blSea(water, -10, W + 10, RV + 1, H, r, 0.3, 0.7)
  for (let i = 0; i < 160; i++) {
    const x = 340 + r() * 1040
    const y = RV + 6 + r() * 70
    blInk(water, [[x, y], [x + 1 + r() * 2, y + 6 + r() * 12]], 0.5, 0.35)
  }
  const trees = blLayer("town")
  blTree(trees, 90, RV + 4, 150, 230, r)
  blTree(trees, 210, RV + 2, 110, 170, r)
  blPalm(trees, 40, RV + 6, 150, 18, r)
  blPalm(trees, 280, RV + 4, 110, -14, r)
  // the boat
  const boat = blLayer("dhow")
  const hull: BlPt[] = [[480, 668], [500, 678], [600, 679], [628, 666], [612, 674], [494, 672]]
  blPaper(boat, hull)
  blInk(boat, [...hull, hull[0]], 1, 0.9)
  blShade(boat, hull, 0, 1.6, 0.45, 0.7)
  blFigure(boat, 560, 672, 54, r, { stride: 0.15, arm: 0.6 })
  blInk(boat, [[565, 622], [612, 700]], 1, 0.85)
  for (let i = 0; i < 5; i++) blInk(boat, [[470 + i * 10, 686 + i * 3], [640 - i * 8, 686 + i * 3]], 0.5, 0.5 - i * 0.07)
  // smoke from the ghat
  const smoke = blLayer("smoke")
  for (let k = 0; k < 7; k++) {
    const pts: BlPt[] = []
    for (let y = RV + 20; y > RV - 150; y -= 6) {
      const t = (RV + 20 - y) / 170
      pts.push([1150 + k * 3 - t * 30 + Math.sin(y * 0.06 + k) * (4 + t * 16), y])
    }
    blInk(smoke, pts, 0.6, 0.35)
  }
  blFigure(smoke, 1210, RV + 34, 38, r, { stride: 0.1, arm: 0.3, dir: -1 })
  const birds = blLayer("birds")
  blBirds(birds, [[700, 180], [728, 166], [750, 188], [1180, 260]], 8, 0.6)
  return { w: W, h: H, layers: [sky, hills, rock, fort, water, trees, boat, smoke, birds], fade: "oval" }
}

/** A Nawabi garden: a domed mosque and minarets, cypresses, a fountain and a palanquin. */
export const blGarden = (seed: number): BlScene => {
  const r = blRng(seed)
  const W = 1200
  const H = 860
  const GY = 600
  const sky = blLayer("sky")
  for (const [cx, cy, rx, ry] of [[340, 110, 220, 30], [980, 160, 180, 24]] as number[][]) blShade(sky, blEllipse(cx, cy, rx, ry), 0, 4.4, 0.45, 0.2, r, 0.5)
  const back = blLayer("far")
  // mosque
  const mx = 720
  blBlock(back, mx - 140, 470, 280, 110, r, { rows: 2, cols: 7, shade: 0.25, o: 0.7 })
  const onion = (cx: number, by: number, rw: number, h: number): BlPt[] => [
    ...blQuad([cx - rw * 0.8, by], [cx - rw * 1.35, by - h * 0.55], [cx, by - h], 14),
    ...blQuad([cx, by - h], [cx + rw * 1.35, by - h * 0.55], [cx + rw * 0.8, by], 14),
  ]
  const big = onion(mx, 330, 72, 150)
  blPaper(back, big)
  blInk(back, [...big, big[0]], 1, 0.75)
  for (let k = -3; k <= 3; k++) blInk(back, blQuad([mx + k * 16, 330], [mx + k * 30, 250], [mx, 180], 10), 0.45, 0.4)
  blShade(back, big.filter((p) => p[0] >= mx - 1).concat([[mx, 330]]), Math.PI / 2, 2.2, 0.45, 0.5)
  blInk(back, [[mx, 180], [mx, 150]], 1, 0.8)
  blInk(back, blEllipse(mx, 160, 4, 4), 0.8, 0.8)
  blBlock(back, mx - 58, 360, 116, 30, r, { shade: 0.3, o: 0.7 })
  for (const tx of [mx - 190, mx + 190]) {
    blBlock(back, tx - 12, 470, 24, 300, r, { shade: 0.45, o: 0.75 })
    for (const by of [270, 360]) {
      const ring: BlPt[] = [[tx - 18, by], [tx + 18, by], [tx + 15, by + 8], [tx - 15, by + 8]]
      blPaper(back, ring)
      blInk(back, [...ring, ring[0]], 0.7, 0.75)
      blShade(back, ring, Math.PI / 2, 2, 0.4, 0.6)
    }
    const cap = onion(tx, 172, 14, 40)
    blPaper(back, cap)
    blInk(back, [...cap, cap[0]], 0.8, 0.75)
    blShade(back, cap.filter((p) => p[0] >= tx - 0.5).concat([[tx, 172]]), Math.PI / 2, 2, 0.45, 0.55)
    blInk(back, [[tx, 132], [tx, 120]], 0.8, 0.75)
  }
  // garden wall and the pavilion
  const wall = blLayer("mid")
  blBlock(wall, -10, 560, W + 20, 26, r, { shade: 0, o: 0.65 })
  const pav = blLayer("town")
  blBlock(pav, 40, 560, 250, 40, r, { shade: 0.2 })
  for (let i = 0; i < 5; i++) {
    const ax = 60 + i * 46
    const arch: BlPt[] = [[ax, 520], [ax, 470], ...blQuad([ax, 470], [ax + 15, 440], [ax + 30, 470], 6), [ax + 30, 520]]
    blInk(pav, arch, 0.8, 0.85)
    blShade(pav, [...arch], Math.PI / 2, 1.8, 0.45, 0.75)
  }
  blBlock(pav, 48, 430, 236, 14, r, { shade: 0.1 })
  const pdome = onion(166, 416, 64, 100)
  blPaper(pav, pdome)
  blInk(pav, [...pdome, pdome[0]], 1, 0.85)
  blShade(pav, pdome.filter((p) => p[0] >= 166).concat([[166, 416]]), Math.PI / 2, 2, 0.45, 0.6)
  for (let k = -2; k <= 2; k++) blInk(pav, blQuad([166 + k * 20, 416], [166 + k * 34, 360], [166, 316], 10), 0.45, 0.45)
  blInk(pav, [[166, 316], [166, 290]], 1, 0.85)
  for (const kx of [60, 272]) {
    const kc = onion(kx, 430, 16, 34)
    blPaper(pav, kc)
    blInk(pav, [...kc, kc[0]], 0.8, 0.8)
  }
  // cypresses and round trees along the wall
  const grove = blLayer("grove")
  for (let i = 0; i < 9; i++) {
    const cx = 340 + i * 92 + (r() - 0.5) * 20
    const ch = 140 + r() * 90
    if (i % 3 === 1) {
      blTree(grove, cx, 570, 70, ch * 0.75, r, 0.75)
      continue
    }
    const flame: BlPt[] = [...blQuad([cx - 16, 570], [cx - 26, 570 - ch * 0.55], [cx, 570 - ch], 10), ...blQuad([cx, 570 - ch], [cx + 26, 570 - ch * 0.55], [cx + 16, 570], 10)]
    blPaper(grove, flame)
    blInk(grove, flame, 0.8, 0.85)
    blShade(grove, flame, 1.25, 2.6, 0.45, 0.55, r)
    blShade(grove, flame.filter((p) => p[0] >= cx - 1), 1.6, 1.6, 0.45, 0.55, r)
  }
  // fountain
  const jet = blLayer("jet")
  const basin = blEllipse(1050, 618, 70, 12)
  blPaper(jet, basin)
  blInk(jet, basin, 1, 0.85)
  blShade(jet, blEllipse(1050, 622, 66, 9, 0, Math.PI), 0, 1.8, 0.45, 0.6)
  for (let k = 0; k < 14; k++) {
    const ox = (k - 6.5) * 2.2
    blInk(jet, blQuad([1050 + ox, 612], [1050 + ox * 0.4, 460], [1050 + ox * 0.2 + (r() - 0.5) * 4, 300 + r() * 30], 12), 0.5, 0.5)
  }
  for (let k = 0; k < 10; k++) {
    const side = k % 2 ? 1 : -1
    blInk(jet, blQuad([1050, 320 + k * 6], [1050 + side * (24 + k * 4), 330], [1050 + side * (34 + k * 6), 470 + k * 12], 10), 0.45, 0.35)
  }
  // ground
  const ground = blLayer("sea")
  for (let y = GY + 6; y < H; y += 5 + (y - GY) * 0.02) {
    let x = -10 - r() * 40
    while (x < W) {
      const len = 30 + r() * 140
      blInk(ground, [[x, y], [Math.min(x + len, W + 10), y + (r() - 0.5)]], 0.5, 0.18 + ((y - GY) / (H - GY)) * 0.22)
      x += len + 10 + r() * 50
    }
  }
  for (const [a, b] of [[420, 40], [760, 1160]]) blInk(ground, [[a, GY + 4], [b, H]], 0.6, 0.35)
  // the procession: a palanquin on four bearers, a parasol, onlookers
  const pro = blLayer("procession")
  const feet = 800
  for (const [fx, d] of [[248, 0.7], [312, -0.5], [528, 0.6], [594, -0.4]]) blFigure(pro, fx, feet - (fx % 2) * 4, 150, r, { stride: d, arm: 1 })
  blInk(pro, [[200, feet - 132], [650, feet - 140]], 2, 0.95)
  const box: BlPt[] = [[360, feet - 110], [484, feet - 112], [484, feet - 170], [360, feet - 168]]
  blPaper(pro, box)
  blInk(pro, [...box, box[0]], 1, 0.95)
  blShade(pro, box, Math.PI / 2, 2.2, 0.45, 0.55, r)
  blShade(pro, [[440, feet - 112], [484, feet - 112], [484, feet - 170], [440, feet - 169]], Math.PI / 2, 1.4, 0.45, 0.6)
  const canopy = [...blQuad([348, feet - 168], [422, feet - 236], [496, feet - 170], 14)]
  blPaper(pro, [...canopy, [496, feet - 168]])
  blInk(pro, canopy, 1, 0.95)
  blShade(pro, [...canopy, [496, feet - 168]], 0.5, 2, 0.45, 0.6)
  blInk(pro, [[422, feet - 202], [422, feet - 226]], 1, 0.9)
  for (let i = 0; i < 7; i++) blInk(pro, [[364 + i * 18, feet - 170], [366 + i * 18, feet - 160]], 0.6, 0.7)
  blFigure(pro, 140, feet + 6, 140, r, { stride: 0.5, arm: 1.2 })
  const parasol = blEllipse(160, feet - 190, 52, 16, Math.PI, Math.PI * 2, 14)
  blPaper(pro, [...parasol])
  blInk(pro, parasol, 1, 0.9)
  blShade(pro, parasol, 0.3, 2, 0.45, 0.6)
  blInk(pro, [[160, feet - 190], [152, feet - 90]], 1, 0.9)
  for (const [fx, fh] of [[740, 120], [800, 128], [868, 112]]) blFigure(pro, fx, feet - 30, fh, r, { stride: 0.15, arm: 0.2, dir: -1, o: 0.75 })
  const birds = blLayer("birds")
  blBirds(birds, [[460, 120], [486, 106], [508, 128]], 8, 0.6)
  return { w: W, h: H, layers: [sky, back, wall, pav, grove, jet, ground, pro, birds], fade: "oval" }
}
export const BL_SCENES: { [k: string]: (seed: number) => BlScene } = { harbour: blHarbour, fort: blFort, garden: blGarden }

/** Sort a scene's ink into `n` buckets left to right, so the drawing can be inked in as a sweep. */
export const blBuckets = (scene: BlScene, n: number) => scene.layers.map((L) => {
  const out: BlInk[][] = []
  for (let i = 0; i < n; i++) out.push([])
  for (const k of L.inks) out[blClamp(Math.floor((k.x / scene.w) * n), 0, n - 1)].push(k)
  return out
})

// ---- the spice wreath -----------------------------------------------------------
/** Line-art spices in rings: leaves, star anise, cardamom, chillies, sprigs. Centred on 0,0, ~240 radius. */
export const blWreath = (seed: number) => {
  const r = blRng(seed)
  const out: BlInk[] = []
  const rot = (p: BlPt, a: number): BlPt => [p[0] * Math.cos(a) - p[1] * Math.sin(a), p[0] * Math.sin(a) + p[1] * Math.cos(a)]
  const put = (pts: BlPt[], a: number, w = 1.1) => out.push({ d: blLine(pts.map((p) => rot(p, a))), w, o: 1, x: a, e: a })
  const TAU = Math.PI * 2
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * TAU
    const leaf = [...blQuad([0, 22], [16, 44], [0, 70], 8), ...blQuad([0, 70], [-16, 44], [0, 22], 8)]
    put(leaf.map((p) => [p[1], p[0]] as BlPt), a)
    put([[22, 0], [66, 0]], a, 0.8)
    for (let k = 1; k < 4; k++) put([[26 + k * 10, 0], [34 + k * 10, k % 2 ? 6 : -6]], a, 0.6)
  }
  for (let i = 0; i < 16; i++) {
    const a = ((i + 0.5) / 16) * TAU
    if (i % 2 === 0) {
      for (let p = 0; p < 8; p++) {
        const pa = (p / 8) * TAU
        const pod = [...blQuad([0, 0], [5, 9], [0, 17], 5), ...blQuad([0, 17], [-5, 9], [0, 0], 5)].map((q) => [q[0] * Math.cos(pa) - q[1] * Math.sin(pa) + 104, q[0] * Math.sin(pa) + q[1] * Math.cos(pa)] as BlPt)
        put(pod, a, 0.8)
      }
      put(blEllipse(104, 0, 3, 3, 0, TAU, 8), a, 0.7)
    } else {
      const pod = blEllipse(108, 0, 18, 8, 0, TAU, 18)
      put(pod, a, 0.9)
      put([[92, 0], [124, 0]], a, 0.6)
      put(blQuad([94, -4], [108, -9], [122, -4], 6), a, 0.5)
      put(blQuad([94, 4], [108, 9], [122, 4], 6), a, 0.5)
    }
  }
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * TAU + 0.13
    if (i % 2 === 0) {
      const bend = 10 + r() * 8
      const top = blQuad([140, -2], [172, -bend], [204, 4], 10)
      const bot = blQuad([206, 6], [172, bend * 0.2 + 6], [140, 8], 10)
      put([...top, ...bot, top[0]], a)
      put(blQuad([140, 3], [132, -6], [126, -2], 5), a, 0.8)
      put(blQuad([150, 2], [176, -4], [196, 4], 8), a, 0.45)
    } else {
      put(blQuad([138, 0], [172, 10], [212, 0], 10), a, 0.8)
      for (let k = 0; k < 3; k++) {
        const bx = 152 + k * 20
        const leaf = [...blQuad([bx, 3], [bx + 8, -12], [bx + 18, -14], 5), ...blQuad([bx + 18, -14], [bx + 10, -2], [bx, 3], 5)]
        put(leaf, a, 0.7)
        put(leaf.map((p) => [p[0], 6 - (p[1] - 3)] as BlPt), a, 0.7)
      }
    }
  }
  for (let i = 0; i < 48; i++) {
    const a = (i / 48) * TAU
    put(blEllipse(226, 0, 1.6, 1.6, 0, TAU, 6), a, 0.7)
    put(blQuad([234, -6], [244, 0], [234, 6], 4), a + TAU / 96, 0.7)
  }
  return out
}

// ---- the biryani painter --------------------------------------------------------
export type BlVessel = "brass" | "clay" | "enamel"
export type BlRice = "jeerakasala" | "seeraga" | "basmati"
/** The canvas spans this many rim radii either side of the centre (room for handles and the spoon). */
export const BL_SPAN = 1.42
type BlRiceSpec = { len: number; wid: number; cover: number; cool: string[]; mid: string[]; hot: string[]; masala: string[]; t1: number; t2: number; base: string[] }
const BL_RICE: { [k: string]: BlRiceSpec } = {
  jeerakasala: {
    len: 0.021, wid: 0.0086, cover: 2.3, t1: 0.44, t2: 0.64,
    cool: ["#f6e9c9", "#f1e0b6", "#f9f0da", "#ecd8a8"], mid: ["#f2cc76", "#edbd58", "#f6d88e"], hot: ["#e5973c", "#da8030", "#eda952"], masala: ["#c98d4a", "#b77a3a", "#a96a2f"],
    base: ["#d9b06a", "#b98545"],
  },
  seeraga: {
    len: 0.018, wid: 0.0078, cover: 2.1, t1: 0.42, t2: 0.66,
    cool: ["#ea974c", "#e08841", "#f0a85a", "#db7b3b"], mid: ["#f5bd70", "#f1b061", "#f8ca84", "#f6dcaa"], hot: ["#c8532b", "#bb4520", "#d46431"], masala: ["#8f3d1c", "#9e4a22", "#7c3416"],
    base: ["#c86e34", "#94461f"],
  },
  basmati: {
    len: 0.043, wid: 0.0079, cover: 2.0, t1: 0.5, t2: 0.66,
    cool: ["#fbf8f0", "#f6f0e2", "#fffdf6", "#f0e9d8"], mid: ["#f9d35c", "#f6c744", "#fbe28d"], hot: ["#f29b2f", "#ec8a22", "#f6ae4a"], masala: ["#d9a25c", "#c98e4c"],
    base: ["#e8d6a8", "#c9a86a"],
  },
}
type BlVesselSpec = { lip: number; wall: number; food: number }
const BL_VESSEL: { [k: string]: BlVesselSpec } = {
  brass: { lip: 0.9, wall: 0.845, food: 0.84 },
  clay: { lip: 0.855, wall: 0.8, food: 0.795 },
  enamel: { lip: 0.93, wall: 0.885, food: 0.88 },
}
export const blVesselSpec = (v: string) => BL_VESSEL[v] || BL_VESSEL.brass
export const blRiceSpec = (k: string) => BL_RICE[k] || BL_RICE.jeerakasala

type Ctx = CanvasRenderingContext2D
const TAU = Math.PI * 2
const blConic = (ctx: Ctx, a: number, stops: [number, string][]) => {
  if (typeof ctx.createConicGradient === "function") {
    const g = ctx.createConicGradient(a, 0, 0)
    for (const [o, c] of stops) g.addColorStop(o, c)
    return g
  }
  return stops[Math.floor(stops.length / 2)][1]
}
const blRadial = (ctx: Ctx, x: number, y: number, r0: number, r1: number, stops: [number, string][], x1 = x, y1 = y) => {
  const g = ctx.createRadialGradient(x, y, r0, x1, y1, r1)
  for (const [o, c] of stops) g.addColorStop(o, c)
  return g
}
const blRing = (ctx: Ctx, r0: number, r1: number, fill: string | CanvasGradient) => {
  ctx.beginPath()
  ctx.arc(0, 0, r1, 0, TAU)
  ctx.arc(0, 0, r0, 0, TAU, true)
  ctx.fillStyle = fill
  ctx.fill()
}
const blDisc = (ctx: Ctx, x: number, y: number, rad: number, fill: string | CanvasGradient) => {
  ctx.beginPath()
  ctx.arc(x, y, rad, 0, TAU)
  ctx.fillStyle = fill
  ctx.fill()
}
/** A soft closed blob through `n` jittered points, smoothed through the midpoints. */
export const blBlob = (rng: () => number, cx: number, cy: number, rad: number, n: number, jag = 0.22, sx = 1): BlPt[] => {
  const pts: BlPt[] = []
  const rot = rng() * TAU
  for (let i = 0; i < n; i++) {
    const a = rot + (i / n) * TAU
    const rr = rad * (1 - jag + rng() * jag * 2)
    pts.push([Math.cos(a) * rr * sx, Math.sin(a) * rr])
  }
  const t = rng() * TAU
  return pts.map((p) => [cx + p[0] * Math.cos(t) - p[1] * Math.sin(t), cy + p[0] * Math.sin(t) + p[1] * Math.cos(t)] as BlPt)
}
const blSmooth = (ctx: Ctx, pts: BlPt[]) => {
  ctx.beginPath()
  const n = pts.length
  const mid = (a: BlPt, b: BlPt): BlPt => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]
  const s = mid(pts[n - 1], pts[0])
  ctx.moveTo(s[0], s[1])
  for (let i = 0; i < n; i++) {
    const m = mid(pts[i], pts[(i + 1) % n])
    ctx.quadraticCurveTo(pts[i][0], pts[i][1], m[0], m[1])
  }
  ctx.closePath()
}
const blLeaf = (ctx: Ctx, x: number, y: number, a: number, len: number, wid: number, c0: string, c1: string, vein: string, k: number) => {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(a)
  ctx.shadowColor = "rgba(40,20,5,0.45)"
  ctx.shadowBlur = 0.012 * k
  ctx.shadowOffsetX = 0.004 * k
  ctx.shadowOffsetY = 0.007 * k
  ctx.beginPath()
  ctx.moveTo(-len, 0)
  ctx.bezierCurveTo(-len * 0.4, -wid * 1.25, len * 0.45, -wid * 1.1, len, 0)
  ctx.bezierCurveTo(len * 0.45, wid * 1.1, -len * 0.4, wid * 1.25, -len, 0)
  const g = ctx.createLinearGradient(0, -wid, 0, wid)
  g.addColorStop(0, c1)
  g.addColorStop(1, c0)
  ctx.fillStyle = g
  ctx.fill()
  ctx.shadowColor = "transparent"
  ctx.strokeStyle = vein
  ctx.lineWidth = wid * 0.12
  ctx.beginPath()
  ctx.moveTo(-len * 0.9, 0)
  ctx.lineTo(len * 0.85, 0)
  for (let i = 1; i < 4; i++) {
    const vx = -len * 0.7 + i * len * 0.38
    ctx.moveTo(vx, 0)
    ctx.lineTo(vx + len * 0.22, -wid * 0.7)
    ctx.moveTo(vx, 0)
    ctx.lineTo(vx + len * 0.22, wid * 0.7)
  }
  ctx.stroke()
  ctx.restore()
}

/**
 * Paints a pot of biryani seen from straight above onto a square canvas of
 * `px` device pixels: the vessel, thousands of grains of rice coloured by a
 * saffron field, the meat, fried onion, nuts, herbs and whole spices, then the
 * light. No shadow under the pot: the page draws that, so it can move.
 */
export const blPaintDish = (ctx: Ctx, px: number, vessel: string, rice: string, seed: number) => {
  const k = px / (BL_SPAN * 2)
  const r = blRng(seed * 31 + 7)
  const V = blVesselSpec(vessel)
  const R = blRiceSpec(rice)
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.clearRect(0, 0, px, px)
  ctx.setTransform(k, 0, 0, k, px / 2, px / 2)
  ctx.lineCap = "round"
  ctx.lineJoin = "round"
  const shade = (blur: number, ox: number, oy: number, c: string) => {
    ctx.shadowColor = c
    ctx.shadowBlur = blur * k
    ctx.shadowOffsetX = ox * k
    ctx.shadowOffsetY = oy * k
  }
  const noShade = () => {
    ctx.shadowColor = "transparent"
    ctx.shadowBlur = 0
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 0
  }

  // ---- handles, under the rim
  if (vessel === "brass") {
    for (const sx of [-1, 1]) {
      const cx = sx * 1.13
      shade(0.03, 0.01, 0.02, "rgba(40,20,5,0.55)")
      ctx.beginPath()
      ctx.arc(cx, 0, 0.15, 0, TAU)
      const g = ctx.createLinearGradient(cx - 0.16, -0.16, cx + 0.16, 0.16)
      g.addColorStop(0, "#fff2c8")
      g.addColorStop(0.25, "#d9a64e")
      g.addColorStop(0.55, "#8a5a1d")
      g.addColorStop(0.8, "#c58e3e")
      g.addColorStop(1, "#5a3a12")
      ctx.strokeStyle = g
      ctx.lineWidth = 0.05
      ctx.stroke()
      noShade()
      ctx.beginPath()
      ctx.arc(cx, 0, 0.15, Math.PI * 1.05, Math.PI * 1.45)
      ctx.strokeStyle = "rgba(255,248,220,0.8)"
      ctx.lineWidth = 0.012
      ctx.stroke()
      shade(0.02, 0.006, 0.012, "rgba(40,20,5,0.5)")
      blSmooth(ctx, [[sx * 0.96, -0.13], [sx * 1.04, -0.08], [sx * 1.06, 0], [sx * 1.04, 0.08], [sx * 0.96, 0.13], [sx * 0.92, 0]])
      ctx.fillStyle = blRadial(ctx, sx * 0.98, -0.04, 0.01, 0.15, [[0, "#f6d58a"], [0.6, "#b98236"], [1, "#6d4416"]])
      ctx.fill()
      noShade()
      for (const ry of [-0.07, 0.07]) blDisc(ctx, sx * 1.0, ry, 0.012, "#fbe7b0")
    }
  } else if (vessel === "clay") {
    for (const sx of [-1, 1]) {
      const cx = sx * 1.06
      shade(0.03, 0.01, 0.02, "rgba(50,20,5,0.5)")
      blSmooth(ctx, [[sx * 0.9, -0.16], [sx * 1.08, -0.15], [sx * 1.2, -0.06], [sx * 1.2, 0.06], [sx * 1.08, 0.15], [sx * 0.9, 0.16]])
      ctx.fillStyle = blRadial(ctx, cx - 0.05, -0.06, 0.01, 0.2, [[0, "#d8835a"], [0.6, "#b25a33"], [1, "#7c361c"]])
      ctx.fill()
      noShade()
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * TAU
        blDisc(ctx, cx + sx * 0.03 + Math.cos(a) * 0.075, Math.sin(a) * 0.075, 0.016, i % 2 ? "#c46a40" : "#8f4123")
      }
      blDisc(ctx, cx + sx * 0.03, 0, 0.04, blRadial(ctx, cx + sx * 0.02, -0.015, 0.002, 0.045, [[0, "#e2946a"], [1, "#9a4625"]]))
    }
  } else {
    for (const sx of [-1, 1]) {
      shade(0.035, 0.012, 0.022, "rgba(60,10,5,0.5)")
      ctx.beginPath()
      ctx.arc(0, 0, 1.2, sx > 0 ? -0.34 : Math.PI - 0.34, sx > 0 ? 0.34 : Math.PI + 0.34)
      ctx.arc(0, 0, 0.96, sx > 0 ? 0.42 : Math.PI + 0.42, sx > 0 ? -0.42 : Math.PI - 0.42, true)
      ctx.closePath()
      ctx.fillStyle = blRadial(ctx, sx * 1.05, -0.12, 0.02, 0.32, [[0, "#f05a43"], [0.45, "#c3231b"], [1, "#6e0c0a"]])
      ctx.fill()
      noShade()
      ctx.beginPath()
      ctx.arc(0, 0, 1.165, sx > 0 ? -0.3 : Math.PI - 0.2, sx > 0 ? -0.05 : Math.PI + 0.05)
      ctx.strokeStyle = "rgba(255,225,215,0.75)"
      ctx.lineWidth = 0.012
      ctx.stroke()
    }
  }

  // ---- the rim
  if (vessel === "brass") {
    blRing(ctx, V.lip, 1, blConic(ctx, -2.35, [[0, "#ffe2b6"], [0.05, "#f0a46a"], [0.15, "#b65a2b"], [0.3, "#78331a"], [0.42, "#a8532a"], [0.5, "#de8a55"], [0.58, "#9c4824"], [0.72, "#6b2b13"], [0.86, "#b45a2d"], [0.95, "#efa36a"], [1, "#ffe2b6"]]))
    blRing(ctx, V.lip, 1, blRadial(ctx, 0, 0, V.lip, 1, [[0, "rgba(30,8,0,0.45)"], [0.25, "rgba(0,0,0,0)"], [0.5, "rgba(255,230,200,0.22)"], [0.72, "rgba(0,0,0,0)"], [1, "rgba(40,10,0,0.55)"]]))
    for (let i = 0; i < 190; i++) {
      const a = r() * TAU
      const rr = V.lip + 0.012 + r() * (1 - V.lip - 0.024)
      const x = Math.cos(a) * rr
      const y = Math.sin(a) * rr
      ctx.beginPath()
      ctx.ellipse(x - 0.003, y - 0.003, 0.013, 0.009, a, 0, TAU)
      ctx.fillStyle = "rgba(255,225,190,0.13)"
      ctx.fill()
      ctx.beginPath()
      ctx.ellipse(x + 0.004, y + 0.004, 0.012, 0.008, a, 0, TAU)
      ctx.fillStyle = "rgba(60,18,4,0.12)"
      ctx.fill()
    }
    blRing(ctx, V.wall, V.lip, blConic(ctx, 0.8, [[0, "#c27040"], [0.25, "#6a2a12"], [0.5, "#33130a"], [0.75, "#6a2a12"], [1, "#c27040"]]))
  } else if (vessel === "clay") {
    blRing(ctx, V.lip, 1, blRadial(ctx, -0.3, -0.35, 0.1, 1.5, [[0, "#d9875c"], [0.5, "#b25b33"], [1, "#7f3a1d"]]))
    for (const [rr, c, w] of [[0.985, "rgba(70,25,8,0.55)", 0.01], [0.955, "rgba(240,170,130,0.35)", 0.008], [0.93, "rgba(80,30,10,0.45)", 0.012], [0.895, "rgba(235,160,120,0.3)", 0.008], [0.87, "rgba(70,25,8,0.5)", 0.01]] as [number, string, number][]) {
      ctx.beginPath()
      ctx.arc(0, 0, rr, 0, TAU)
      ctx.strokeStyle = c
      ctx.lineWidth = w
      ctx.stroke()
    }
    for (let i = 0; i < 900; i++) {
      const a = r() * TAU
      const rr = V.lip + r() * (1 - V.lip)
      blDisc(ctx, Math.cos(a) * rr, Math.sin(a) * rr, 0.002 + r() * 0.003, r() < 0.5 ? "rgba(255,210,170,0.25)" : "rgba(60,20,5,0.25)")
    }
    blRing(ctx, V.wall, V.lip, blConic(ctx, 0.8, [[0, "#b8633a"], [0.25, "#6e2c14"], [0.5, "#3e170a"], [0.75, "#6e2c14"], [1, "#b8633a"]]))
  } else {
    blRing(ctx, V.lip, 1, blConic(ctx, -2.35, [[0, "#ff8f78"], [0.08, "#e3392b"], [0.2, "#b3191a"], [0.4, "#7a0b0d"], [0.55, "#a8161a"], [0.7, "#7a0b0d"], [0.88, "#c8251f"], [1, "#ff8f78"]]))
    blRing(ctx, V.lip, 1, blRadial(ctx, 0, 0, V.lip, 1, [[0, "rgba(40,0,0,0.4)"], [0.4, "rgba(0,0,0,0)"], [0.6, "rgba(255,200,190,0.25)"], [0.8, "rgba(0,0,0,0)"], [1, "rgba(50,0,0,0.6)"]]))
    blRing(ctx, V.wall, V.lip, blConic(ctx, 0.8, [[0, "#f3ead6"], [0.25, "#b9ab90"], [0.5, "#7d705a"], [0.75, "#b9ab90"], [1, "#f3ead6"]]))
  }

  // ---- the food
  ctx.save()
  ctx.beginPath()
  ctx.arc(0, 0, V.food, 0, TAU)
  ctx.clip()
  ctx.fillStyle = blRadial(ctx, -0.2, -0.25, 0.05, V.food * 1.3, [[0, R.base[0]], [1, R.base[1]]])
  ctx.fillRect(-1, -1, 2, 2)
  const field = blNoise2(r, 6)
  const field2 = blNoise2(r, 15)
  type Grain = { x: number; y: number; a: number; l: number; w: number; c: string }
  const meat: { x: number; y: number; rad: number }[] = []
  const nMeat = rice === "seeraga" ? 7 : rice === "basmati" ? 3 : 6
  for (let tries = 0; meat.length < nMeat && tries < 400; tries++) {
    const rad = rice === "basmati" && meat.length === 0 ? 0.24 : rice === "seeraga" ? 0.1 + r() * 0.05 : 0.12 + r() * 0.06
    const rr = (meat.length === 0 && rice === "basmati" ? 0.05 : 0.2 + r() * 0.42) * V.food
    const a = r() * TAU
    const x = Math.cos(a) * rr
    const y = Math.sin(a) * rr
    if (meat.every((m) => Math.hypot(m.x - x, m.y - y) > m.rad + rad + 0.05)) meat.push({ x, y, rad })
  }
  const nearMeat = (x: number, y: number) => meat.some((m) => Math.hypot(m.x - x, m.y - y) < m.rad * 1.35)
  const grains: Grain[] = []
  const count = Math.round((R.cover * Math.PI * V.food * V.food) / (Math.PI * R.len * R.wid))
  for (let i = 0; i < count; i++) {
    const rr = Math.sqrt(r()) * (V.food + 0.01)
    const a = r() * TAU
    const x = Math.cos(a) * rr
    const y = Math.sin(a) * rr
    const v = field(x, y) * 0.8 + field2(x, y) * 0.35 - 0.15 + (r() - 0.5) * 0.18
    let pal = v > R.t2 ? R.hot : v > R.t1 ? R.mid : R.cool
    if (nearMeat(x, y) && r() < 0.35) pal = R.masala
    const s = 0.82 + r() * 0.36
    grains.push({ x, y, a: r() * Math.PI, l: R.len * s, w: R.wid * (0.9 + r() * 0.2), c: pal[Math.floor(r() * pal.length)] })
  }
  const paintGrains = (gs: Grain[]) => {
    ctx.beginPath()
    for (const g of gs) {
      const x = g.x + g.w * 0.3
      const y = g.y + g.w * 0.55
      ctx.moveTo(x + Math.cos(g.a) * g.l, y + Math.sin(g.a) * g.l)
      ctx.ellipse(x, y, g.l, g.w, g.a, 0, TAU)
    }
    ctx.fillStyle = "rgba(70,30,8,0.32)"
    ctx.fill()
    const byColor: { [c: string]: Grain[] } = {}
    for (const g of gs) (byColor[g.c] = byColor[g.c] || []).push(g)
    for (const c in byColor) {
      ctx.beginPath()
      for (const g of byColor[c]) {
        ctx.moveTo(g.x + Math.cos(g.a) * g.l, g.y + Math.sin(g.a) * g.l)
        ctx.ellipse(g.x, g.y, g.l, g.w, g.a, 0, TAU)
      }
      ctx.fillStyle = c
      ctx.fill()
    }
    ctx.beginPath()
    for (const g of gs) {
      const x = g.x - g.w * 0.22
      const y = g.y - g.w * 0.32
      ctx.moveTo(x + Math.cos(g.a) * g.l * 0.62, y + Math.sin(g.a) * g.l * 0.62)
      ctx.ellipse(x, y, g.l * 0.62, g.w * 0.36, g.a, 0, TAU)
    }
    ctx.fillStyle = "rgba(255,255,250,0.42)"
    ctx.fill()
  }
  const under = Math.floor(grains.length * 0.93)
  paintGrains(grains.slice(0, under))

  // meat
  for (const [i, m] of meat.entries()) {
    const mutton = rice === "seeraga"
    const leg = rice === "basmati" && i === 0
    const pts = blBlob(r, m.x, m.y, m.rad * (mutton ? 0.95 : 0.82), mutton ? 6 : 11, mutton ? 0.3 : 0.2, leg ? 1.5 : mutton ? 1.25 : 1.3 + r() * 0.35)
    if ((leg || (!mutton && i === 1) || (mutton && i === 2))) {
      const a = r() * TAU
      const bx0 = m.x + Math.cos(a) * m.rad * 0.5
      const by0 = m.y + Math.sin(a) * m.rad * 0.5
      const bx1 = m.x + Math.cos(a) * m.rad * 1.35
      const by1 = m.y + Math.sin(a) * m.rad * 1.35
      shade(0.015, 0.005, 0.01, "rgba(40,15,0,0.5)")
      ctx.strokeStyle = "#e9dcc0"
      ctx.lineWidth = 0.034
      ctx.beginPath()
      ctx.moveTo(bx0, by0)
      ctx.lineTo(bx1, by1)
      ctx.stroke()
      blDisc(ctx, bx1 + Math.cos(a + 0.6) * 0.012, by1 + Math.sin(a + 0.6) * 0.012, 0.024, "#efe4cb")
      blDisc(ctx, bx1 + Math.cos(a - 0.6) * 0.012, by1 + Math.sin(a - 0.6) * 0.012, 0.022, "#e6d6b6")
      noShade()
      ctx.strokeStyle = "rgba(255,255,245,0.7)"
      ctx.lineWidth = 0.007
      ctx.beginPath()
      ctx.moveTo(bx0 - 0.006, by0 - 0.008)
      ctx.lineTo(bx1 - 0.006, by1 - 0.008)
      ctx.stroke()
    }
    shade(0.035, 0.01, 0.018, "rgba(40,12,0,0.6)")
    blSmooth(ctx, pts)
    ctx.fillStyle = mutton
      ? blRadial(ctx, m.x - m.rad * 0.35, m.y - m.rad * 0.4, m.rad * 0.05, m.rad * 1.15, [[0, "#c97a45"], [0.35, "#9a4c27"], [0.75, "#6a2e14"], [1, "#3c180a"]], m.x, m.y)
      : blRadial(ctx, m.x - m.rad * 0.3, m.y - m.rad * 0.35, m.rad * 0.05, m.rad * 1.15, [[0, "#f9c070"], [0.3, "#e8903f"], [0.62, "#c9612b"], [0.86, "#93391a"], [1, "#5e220c"]], m.x, m.y)
    ctx.fill()
    noShade()
    ctx.save()
    blSmooth(ctx, pts)
    ctx.clip()
    for (let s = 0; s < 70; s++) {
      const a = r() * TAU
      const d = Math.sqrt(r()) * m.rad * 1.1
      blDisc(ctx, m.x + Math.cos(a) * d, m.y + Math.sin(a) * d, 0.003 + r() * 0.008, ["rgba(110,40,12,0.6)", "rgba(80,25,8,0.55)", "rgba(200,95,40,0.5)", "rgba(150,30,10,0.45)"][Math.floor(r() * 4)])
    }
    for (let s = 0; s < 5; s++) {
      const a = r() * TAU
      ctx.beginPath()
      ctx.ellipse(m.x + Math.cos(a) * m.rad * 0.4, m.y + Math.sin(a) * m.rad * 0.4, m.rad * (0.25 + r() * 0.2), m.rad * 0.06, a + 1.2, 0, TAU)
      ctx.fillStyle = mutton ? "rgba(240,200,150,0.22)" : "rgba(90,30,8,0.3)"
      ctx.fill()
    }
    ctx.beginPath()
    ctx.ellipse(m.x - m.rad * 0.35, m.y - m.rad * 0.38, m.rad * 0.38, m.rad * 0.16, -0.6, 0, TAU)
    ctx.fillStyle = blRadial(ctx, m.x - m.rad * 0.35, m.y - m.rad * 0.38, 0, m.rad * 0.38, [[0, "rgba(255,245,220,0.55)"], [1, "rgba(255,245,220,0)"]])
    ctx.fill()
    ctx.restore()
  }
  paintGrains(grains.slice(under).filter((g) => !meat.some((m) => Math.hypot(m.x - g.x, m.y - g.y) < m.rad * 0.72)))

  // whole spices
  const spices = rice === "basmati" ? ["cardamom", "cardamom", "bay", "cardamom"] : rice === "seeraga" ? ["anise", "cinnamon", "cardamom", "cardamom"] : ["bay", "anise", "cardamom"]
  for (const sp of spices) {
    const a = r() * TAU
    const rr = (0.25 + r() * 0.5) * V.food
    const x = Math.cos(a) * rr
    const y = Math.sin(a) * rr
    const rot = r() * TAU
    if (sp === "bay") blLeaf(ctx, x, y, rot, 0.085, 0.026, "#7c7a3e", "#a9a35c", "rgba(220,215,160,0.6)", k)
    else if (sp === "cardamom") {
      shade(0.01, 0.003, 0.006, "rgba(30,20,0,0.5)")
      ctx.beginPath()
      ctx.ellipse(x, y, 0.024, 0.012, rot, 0, TAU)
      ctx.fillStyle = blRadial(ctx, x - 0.006, y - 0.005, 0.001, 0.026, [[0, "#c8cf86"], [1, "#6f7a3a"]])
      ctx.fill()
      noShade()
      ctx.strokeStyle = "rgba(70,80,30,0.6)"
      ctx.lineWidth = 0.0022
      ctx.beginPath()
      ctx.ellipse(x, y, 0.017, 0.005, rot, 0, TAU)
      ctx.stroke()
    } else if (sp === "anise") {
      shade(0.012, 0.004, 0.007, "rgba(30,10,0,0.55)")
      for (let p = 0; p < 8; p++) {
        const pa = rot + (p / 8) * TAU
        ctx.beginPath()
        ctx.ellipse(x + Math.cos(pa) * 0.022, y + Math.sin(pa) * 0.022, 0.022, 0.009, pa, 0, TAU)
        ctx.fillStyle = p % 2 ? "#6b3418" : "#5a2a12"
        ctx.fill()
      }
      noShade()
      for (let p = 0; p < 8; p++) {
        const pa = rot + (p / 8) * TAU
        blDisc(ctx, x + Math.cos(pa) * 0.026, y + Math.sin(pa) * 0.026, 0.005, "#c27a3c")
      }
    } else {
      ctx.save()
      ctx.translate(x, y)
      ctx.rotate(rot)
      shade(0.012, 0.004, 0.008, "rgba(30,10,0,0.55)")
      ctx.fillStyle = "#8a4a22"
      ctx.fillRect(-0.07, -0.016, 0.14, 0.032)
      noShade()
      ctx.fillStyle = "rgba(255,200,150,0.25)"
      ctx.fillRect(-0.07, -0.016, 0.14, 0.009)
      ctx.strokeStyle = "rgba(60,25,8,0.7)"
      ctx.lineWidth = 0.003
      ctx.beginPath()
      ctx.moveTo(-0.07, 0.004)
      ctx.lineTo(0.07, 0.004)
      ctx.stroke()
      ctx.restore()
    }
  }

  // fried onion (birista)
  const nOnion = rice === "jeerakasala" ? 460 : rice === "basmati" ? 170 : 70
  const onionC = ["#5d260d", "#6e2f10", "#813c15", "#97491a", "#a9571f", "#4c1e0a"]
  for (let i = 0; i < nOnion; i++) {
    const rr = V.food * 0.86 * Math.pow(r(), rice === "jeerakasala" ? 1.1 : 0.75)
    const a = r() * TAU
    const x = Math.cos(a) * rr
    const y = Math.sin(a) * rr
    const rad = 0.018 + r() * 0.034
    const a0 = r() * TAU
    const sw = 0.8 + r() * 1.6
    shade(0.006, 0.002, 0.004, "rgba(30,10,0,0.5)")
    ctx.beginPath()
    ctx.arc(x, y, rad, a0, a0 + sw)
    ctx.strokeStyle = onionC[Math.floor(r() * onionC.length)]
    ctx.lineWidth = 0.007 + r() * 0.008
    ctx.stroke()
    noShade()
    ctx.beginPath()
    ctx.arc(x, y, rad - 0.002, a0 + 0.2, a0 + sw * 0.7)
    ctx.strokeStyle = "rgba(230,140,70,0.55)"
    ctx.lineWidth = 0.002
    ctx.stroke()
  }
  // cashews and raisins
  const nCashew = rice === "jeerakasala" ? 16 : rice === "basmati" ? 4 : 0
  for (let i = 0; i < nCashew; i++) {
    const rr = V.food * 0.8 * Math.sqrt(r())
    const a = r() * TAU
    const x = Math.cos(a) * rr
    const y = Math.sin(a) * rr
    const a0 = r() * TAU
    shade(0.01, 0.004, 0.007, "rgba(50,20,0,0.55)")
    ctx.beginPath()
    ctx.arc(x, y, 0.02, a0, a0 + 2.3)
    ctx.strokeStyle = "#b97f3e"
    ctx.lineWidth = 0.026
    ctx.stroke()
    noShade()
    ctx.beginPath()
    ctx.arc(x, y, 0.02, a0, a0 + 2.3)
    ctx.strokeStyle = "#ebc98e"
    ctx.lineWidth = 0.019
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(x - 0.002, y - 0.003, 0.022, a0 + 0.3, a0 + 1.6)
    ctx.strokeStyle = "rgba(255,246,220,0.75)"
    ctx.lineWidth = 0.005
    ctx.stroke()
  }
  const nRaisin = rice === "jeerakasala" ? 14 : rice === "basmati" ? 5 : 0
  for (let i = 0; i < nRaisin; i++) {
    const rr = V.food * 0.8 * Math.sqrt(r())
    const a = r() * TAU
    const x = Math.cos(a) * rr
    const y = Math.sin(a) * rr
    shade(0.008, 0.003, 0.005, "rgba(20,5,0,0.6)")
    ctx.beginPath()
    ctx.ellipse(x, y, 0.014, 0.009, r() * TAU, 0, TAU)
    ctx.fillStyle = "#3d1a10"
    ctx.fill()
    noShade()
    blDisc(ctx, x - 0.004, y - 0.003, 0.003, "rgba(255,200,170,0.45)")
  }
  // saffron threads
  const nSaffron = rice === "basmati" ? 80 : rice === "jeerakasala" ? 24 : 10
  for (let i = 0; i < nSaffron; i++) {
    const rr = V.food * 0.9 * Math.sqrt(r())
    const a = r() * TAU
    const x = Math.cos(a) * rr
    const y = Math.sin(a) * rr
    const da = r() * TAU
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.quadraticCurveTo(x + Math.cos(da) * 0.012 + 0.004, y + Math.sin(da) * 0.012, x + Math.cos(da) * 0.026, y + Math.sin(da) * 0.026)
    ctx.strokeStyle = ["#d7381a", "#ff6a1c", "#c22c10", "#ef4f17"][Math.floor(r() * 4)]
    ctx.lineWidth = 0.0035
    ctx.stroke()
  }
  // lime
  if (rice === "seeraga") {
    const a = -0.75
    const x = Math.cos(a) * V.food * 0.55
    const y = Math.sin(a) * V.food * 0.55
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(0.5)
    shade(0.03, 0.01, 0.018, "rgba(30,20,0,0.55)")
    ctx.beginPath()
    ctx.arc(0, 0, 0.12, Math.PI, TAU)
    ctx.closePath()
    ctx.fillStyle = "#5f9e2c"
    ctx.fill()
    noShade()
    ctx.beginPath()
    ctx.arc(0, 0, 0.105, Math.PI, TAU)
    ctx.closePath()
    ctx.fillStyle = "#f1f2cf"
    ctx.fill()
    ctx.beginPath()
    ctx.arc(0, 0, 0.095, Math.PI, TAU)
    ctx.closePath()
    ctx.fillStyle = blRadial(ctx, 0, 0, 0.005, 0.1, [[0, "#f3f6c4"], [0.6, "#dce88a"], [1, "#c6d866"]])
    ctx.fill()
    ctx.strokeStyle = "rgba(250,252,225,0.85)"
    ctx.lineWidth = 0.004
    for (let s = 0; s <= 5; s++) {
      const sa = Math.PI + (s / 5) * Math.PI
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.lineTo(Math.cos(sa) * 0.092, Math.sin(sa) * 0.092)
      ctx.stroke()
    }
    ctx.beginPath()
    ctx.arc(0, 0, 0.115, Math.PI * 1.1, Math.PI * 1.5)
    ctx.strokeStyle = "rgba(220,255,170,0.7)"
    ctx.lineWidth = 0.006
    ctx.stroke()
    ctx.restore()
  }
  // herbs
  const nMint = rice === "basmati" ? 14 : rice === "seeraga" ? 6 : 9
  const clumps: BlPt[] = []
  for (let i = 0; i < 4; i++) {
    const a = r() * TAU
    const rr = V.food * (0.2 + r() * 0.5)
    clumps.push([Math.cos(a) * rr, Math.sin(a) * rr])
  }
  for (let i = 0; i < nMint; i++) {
    const c = clumps[i % clumps.length]
    blLeaf(ctx, c[0] + (r() - 0.5) * 0.14, c[1] + (r() - 0.5) * 0.14, r() * TAU, 0.05 + r() * 0.02, 0.032, "#2c6e2a", "#79c25f", "rgba(225,255,205,0.5)", k)
  }
  const nCor = rice === "basmati" ? 6 : 22
  for (let i = 0; i < nCor; i++) {
    const rr = V.food * 0.86 * Math.sqrt(r())
    const a = r() * TAU
    const x = Math.cos(a) * rr
    const y = Math.sin(a) * rr
    const rot = r() * TAU
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(rot)
    shade(0.008, 0.002, 0.004, "rgba(20,30,0,0.45)")
    ctx.beginPath()
    for (let l = 0; l < 3; l++) {
      const la = (l / 3) * TAU
      const lx = Math.cos(la) * 0.011
      const ly = Math.sin(la) * 0.011
      ctx.moveTo(lx + 0.012, ly)
      for (let s = 0; s <= 10; s++) {
        const sa = (s / 10) * TAU
        const sr = 0.012 * (1 + 0.16 * Math.cos(sa * 5))
        ctx.lineTo(lx + Math.cos(sa) * sr, ly + Math.sin(sa) * sr)
      }
    }
    ctx.fillStyle = r() < 0.5 ? "#3d8a32" : "#4f9c3f"
    ctx.fill()
    noShade()
    ctx.strokeStyle = "rgba(210,250,180,0.5)"
    ctx.lineWidth = 0.0018
    ctx.beginPath()
    for (let l = 0; l < 3; l++) {
      const la = (l / 3) * TAU
      ctx.moveTo(0, 0)
      ctx.lineTo(Math.cos(la) * 0.018, Math.sin(la) * 0.018)
    }
    ctx.stroke()
    ctx.restore()
  }
  // ghee gloss
  ctx.globalCompositeOperation = "lighter"
  for (let i = 0; i < 46; i++) {
    const rr = V.food * 0.9 * Math.sqrt(r())
    const a = r() * TAU
    const x = Math.cos(a) * rr
    const y = Math.sin(a) * rr
    const gr = 0.02 + r() * 0.05
    blDisc(ctx, x, y, gr, blRadial(ctx, x, y, 0, gr, [[0, "rgba(255,230,170,0.16)"], [1, "rgba(255,230,170,0)"]]))
  }
  ctx.globalCompositeOperation = "source-over"
  // the wall's shadow on the rice, and the room's light
  ctx.fillStyle = blRadial(ctx, 0.03, 0.04, V.food * 0.72, V.food, [[0, "rgba(40,14,2,0)"], [0.7, "rgba(40,14,2,0.28)"], [1, "rgba(30,10,0,0.75)"]])
  ctx.fillRect(-1, -1, 2, 2)
  const light = ctx.createLinearGradient(-0.8, -0.8, 0.8, 0.8)
  light.addColorStop(0, "rgba(255,248,230,0.14)")
  light.addColorStop(0.5, "rgba(255,248,230,0)")
  light.addColorStop(1, "rgba(30,10,0,0.16)")
  ctx.fillStyle = light
  ctx.fillRect(-1, -1, 2, 2)
  ctx.restore()

  // ---- rim details on top
  ctx.beginPath()
  ctx.arc(0, 0, V.lip, 0, TAU)
  ctx.strokeStyle = vessel === "enamel" ? "rgba(70,0,0,0.55)" : "rgba(40,12,4,0.6)"
  ctx.lineWidth = 0.006
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(0, 0, 0.997, 0, TAU)
  ctx.strokeStyle = "rgba(40,12,4,0.55)"
  ctx.lineWidth = 0.006
  ctx.stroke()
  if (vessel !== "clay") {
    shade(0.02, 0, 0, "rgba(255,245,230,0.9)")
    ctx.beginPath()
    ctx.arc(0, 0, (V.lip + 1) / 2, -2.75, -1.95)
    ctx.strokeStyle = "rgba(255,246,235,0.85)"
    ctx.lineWidth = 0.012
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(0, 0, (V.lip + 1) / 2, 0.55, 0.85)
    ctx.strokeStyle = "rgba(255,236,220,0.45)"
    ctx.lineWidth = 0.008
    ctx.stroke()
    noShade()
  } else {
    ctx.beginPath()
    ctx.arc(0, 0, 0.94, -2.8, -1.7)
    ctx.strokeStyle = "rgba(255,210,180,0.35)"
    ctx.lineWidth = 0.03
    ctx.stroke()
  }

  // ---- a brass serving spoon resting in the brass handi
  if (vessel === "brass") {
    const a = 2.25
    const bx = Math.cos(a) * 0.55
    const by = Math.sin(a) * 0.55
    const hx = Math.cos(a) * 1.36
    const hy = Math.sin(a) * 1.36
    shade(0.03, 0.015, 0.03, "rgba(30,10,0,0.55)")
    ctx.beginPath()
    ctx.moveTo(bx + Math.cos(a) * 0.08, by + Math.sin(a) * 0.08)
    ctx.quadraticCurveTo(Math.cos(a) * 0.95 + 0.03, Math.sin(a) * 0.95, hx, hy)
    const hg = ctx.createLinearGradient(bx, by, hx, hy)
    hg.addColorStop(0, "#c8913f")
    hg.addColorStop(0.5, "#f3d38a")
    hg.addColorStop(1, "#9c6a28")
    ctx.strokeStyle = hg
    ctx.lineWidth = 0.044
    ctx.stroke()
    blDisc(ctx, hx, hy, 0.05, blRadial(ctx, hx - 0.01, hy - 0.012, 0.002, 0.04, [[0, "#fbe4a6"], [1, "#9a6626"]]))
    ctx.beginPath()
    ctx.ellipse(bx, by, 0.13, 0.095, a, 0, TAU)
    ctx.fillStyle = blRadial(ctx, bx - 0.04, by - 0.04, 0.01, 0.16, [[0, "#fff0c2"], [0.35, "#e2b260"], [0.8, "#a8732c"], [1, "#6d4514"]])
    ctx.fill()
    noShade()
    ctx.beginPath()
    ctx.ellipse(bx + 0.01, by + 0.012, 0.1, 0.07, a, 0, TAU)
    ctx.fillStyle = blRadial(ctx, bx + 0.03, by + 0.03, 0.01, 0.12, [[0, "rgba(120,70,20,0.1)"], [1, "rgba(80,40,5,0.45)"]])
    ctx.fill()
    ctx.beginPath()
    ctx.moveTo(bx + Math.cos(a) * 0.1 - 0.008, by + Math.sin(a) * 0.1 - 0.01)
    ctx.quadraticCurveTo(Math.cos(a) * 0.95 + 0.02, Math.sin(a) * 0.95 - 0.012, hx - 0.01, hy - 0.012)
    ctx.strokeStyle = "rgba(255,248,225,0.7)"
    ctx.lineWidth = 0.007
    ctx.stroke()
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0)
}
// #endregion

// ---- layout ---------------------------------------------------------------------
// Every block is placed on the spread in percent: x and widths of the spread's
// width, y of its height. `m*` values replace them on phones, where each page
// is shown alone and is taller than a printed page.

type BlBox = { l: number; t: number; w: number; ml?: number; mt?: number; mw?: number }
type BlLayoutSpec = {
  wreath: { x: number; y: number; s: number }
  name: BlBox
  story: BlBox
  text: BlBox
  note?: BlBox
  eng: BlBox & { bottom?: boolean; fade: "top" | "oval" }
  dish: { x: number; y: number; d: number; mx?: number; my?: number; md?: number }
}
const BL_LAYOUTS: { [k: string]: BlLayoutSpec } = {
  shore: {
    wreath: { x: 1, y: 2, s: 34 },
    name: { l: 6.5, t: 9, w: 40, mt: 5.5 },
    story: { l: 6.5, t: 22.5, w: 37.5, mt: 15.5, mw: 39.5 },
    text: { l: 56, t: 9, w: 38, mt: 5.5, mw: 39.5 },
    eng: { l: 0, t: 0, w: 100, bottom: true, fade: "top" },
    dish: { x: 78.5, y: 55, d: 28, mx: 76, my: 57, md: 36 },
  },
  summit: {
    wreath: { x: 1, y: 2, s: 34 },
    eng: { l: 34, t: 3, w: 62, ml: 52, mt: 3, mw: 46, fade: "oval" },
    name: { l: 6.5, t: 9.5, w: 30, mt: 5.5, mw: 40 },
    story: { l: 6.5, t: 22.5, w: 31.5, mt: 15.5, mw: 39.5 },
    text: { l: 55.5, t: 58, w: 38.5, mt: 42, mw: 39.5 },
    dish: { x: 15.5, y: 80, d: 34, mx: 18, my: 84, md: 40 },
  },
  terrace: {
    wreath: { x: 99, y: 2, s: 34 },
    eng: { l: 3, t: 2.5, w: 53, ml: 2, mt: 2, mw: 46, fade: "oval" },
    name: { l: 6.5, t: 57, w: 40, mt: 37, mw: 40 },
    story: { l: 6.5, t: 69.5, w: 38, mt: 49.5, mw: 39.5 },
    text: { l: 60, t: 11, w: 34, mt: 5.5, mw: 39.5 },
    note: { l: 54.5, t: 64, w: 16.5, mt: 62, mw: 20 },
    dish: { x: 87, y: 81, d: 30, mx: 84, my: 86, md: 34 },
  },
}
const blPos = (b: BlBox): React.CSSProperties =>
  ({ "--l": b.l + "%", "--t": b.t + "%", "--w": b.w + "%", "--ml": (b.ml ?? b.l) + "%", "--mt": (b.mt ?? b.t) + "%", "--mw": (b.mw ?? b.w) + "%" }) as React.CSSProperties
const BL_POS_CSS = `
.bl-box{position:absolute;left:var(--l);top:var(--t);width:var(--w)}
.bl-single .bl-box{left:var(--ml);top:var(--mt);width:var(--mw)}
.bl-box.bl-bottom-anchor{top:auto;bottom:0}
.bl-single .bl-box.bl-bottom-anchor{top:auto;bottom:0}
`

// ---- small pieces ---------------------------------------------------------------

const BlIcon = ({ name }: { name: string }) => {
  const p = { fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const }
  if (name === "instagram")
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="3.5" y="3.5" width="17" height="17" rx="5" {...p} />
        <circle cx="12" cy="12" r="4" {...p} />
        <circle cx="17.2" cy="6.8" r=".8" fill="currentColor" />
      </svg>
    )
  if (name === "youtube")
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="2.5" y="5.5" width="19" height="13" rx="4" {...p} />
        <path d="M10 9.2v5.6l4.8-2.8z" fill="currentColor" />
      </svg>
    )
  if (name === "x")
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4.5 4h4.2l10.8 16h-4.2zM19 4l-6.1 7M5 20l6.1-7" {...p} />
      </svg>
    )
  if (name === "facebook")
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M14 21v-8h3l.5-3.5H14V7.6c0-1 .3-1.6 1.7-1.6H18V3.2a23 23 0 0 0-2.7-.2C12.6 3 11 4.5 11 7.3v2.2H8V13h3v8" {...p} />
      </svg>
    )
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" {...p} />
      <path d="M3.5 6.5 12 13l8.5-6.5" {...p} />
    </svg>
  )
}
const BlArrow = ({ dir }: { dir: 1 | -1 }) => (
  <svg viewBox="0 0 16 16" aria-hidden="true">
    <path d={dir > 0 ? "M3 8h10M9 4l4 4-4 4" : "M13 8H3M7 4 3 8l4 4"} fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
const BlSprig = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 3c2.5 3 2.5 6 0 9-2.5-3-2.5-6 0-9zM12 21c-2.5-3-2.5-6 0-9 2.5 3 2.5 6 0 9zM3 12c3-2.5 6-2.5 9 0-3 2.5-6 2.5-9 0zM21 12c-3 2.5-6 2.5-9 0 3-2.5 6-2.5 9 0z" fill="none" stroke="currentColor" strokeWidth="1.1" />
  </svg>
)

/** One engraving, clipped to the half of the spread a page shows. */
const BlEngraving = React.memo(function BlEngraving({ scene, box, side, tone }: { scene: BlScene; box: { l: number; w: number }; side: number; tone: string }) {
  const B = 12
  const keep = (k: BlInk) => {
    const x0 = box.l + (k.x / scene.w) * box.w
    const x1 = box.l + (k.e / scene.w) * box.w
    return side === 0 ? x0 < 50.5 : x1 > 49.5
  }
  return (
    <svg viewBox={"0 0 " + scene.w + " " + scene.h} aria-hidden="true" focusable="false" style={{ color: tone }}>
      {scene.layers.map((L, li) => {
        const buckets: BlInk[][] = []
        for (let i = 0; i < B; i++) buckets.push([])
        for (const k of L.inks) if (keep(k)) buckets[blClamp(Math.floor((k.x / scene.w) * B), 0, B - 1)].push(k)
        return (
          <g key={li} className={L.fx ? "bl-fx-" + L.fx : undefined}>
            {L.fills.filter((f) => f.a === 0).map((f, i) => (
              <path key={"p" + i} d={f.d} fill="var(--bl-paper)" fillOpacity={0.94} />
            ))}
            <g className="bl-wash">
              {L.fills.filter((f) => f.a > 0).map((f, i) => (
                <path key={"w" + i} d={f.d} fill="currentColor" fillOpacity={f.a} />
              ))}
            </g>
            {buckets.map((b, bi) =>
              b.length ? (
                <g key={bi} className="bl-b" data-b={bi} stroke="currentColor">
                  {b.map((k, i) => (
                    <path key={i} className="bl-k" d={k.d} strokeWidth={k.w} strokeOpacity={k.o} pathLength={1} />
                  ))}
                </g>
              ) : null,
            )}
          </g>
        )
      })}
    </svg>
  )
})

const BlWreath = React.memo(function BlWreath({ inks }: { inks: BlInk[] }) {
  return (
    <svg viewBox="-250 -250 500 500" aria-hidden="true" focusable="false">
      <g className="bl-breathe">
        <g className="bl-wr" stroke="currentColor">
          {inks.map((k, i) => (
            <path key={i} className="bl-k" d={k.d} strokeWidth={k.w} pathLength={1} />
          ))}
        </g>
      </g>
    </svg>
  )
})

const BlSteam = () => (
  <svg className="bl-steam" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
    <path d="M30 95C22 80 38 70 30 55S36 30 28 15" />
    <path d="M48 98C40 82 56 72 48 56S54 32 46 12" />
    <path d="M66 95C58 80 74 70 66 55S72 30 64 18" />
    <path d="M40 92C34 78 46 66 40 52S46 36 40 26" />
  </svg>
)

const BlSeal = ({ letter }: { letter: string }) => {
  const pts: string[] = []
  for (let i = 0; i < 28; i++) {
    const a = (i / 28) * Math.PI * 2
    const r = 46 + (i % 2 ? 3.5 : -1) + Math.sin(i * 1.7) * 1.5
    pts.push(blF(50 + Math.cos(a) * r) + " " + blF(50 + Math.sin(a) * r))
  }
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true">
      <defs>
        <radialGradient id="bl-wax" cx="38%" cy="32%" r="75%">
          <stop offset="0" stopColor="#d4472e" />
          <stop offset=".55" stopColor="#9c1f15" />
          <stop offset="1" stopColor="#5e0e09" />
        </radialGradient>
      </defs>
      <path d={"M" + pts.join("L") + "Z"} fill="url(#bl-wax)" />
      <circle cx="50" cy="50" r="31" fill="none" stroke="rgba(40,4,2,.55)" strokeWidth="3" />
      <circle cx="50" cy="50" r="31" fill="none" stroke="rgba(255,180,150,.3)" strokeWidth="1" transform="translate(-1 -1)" />
      <text x="50" y="62" textAnchor="middle" fontSize="34" fontFamily="var(--bl-display)" fontWeight="600" fill="rgba(60,6,3,.75)">
        {letter}
      </text>
      <text x="49" y="61" textAnchor="middle" fontSize="34" fontFamily="var(--bl-display)" fontWeight="600" fill="rgba(255,190,160,.35)">
        {letter}
      </text>
    </svg>
  )
}

// ---- the template ---------------------------------------------------------------

type BlSpread = { kind: "title" } | { kind: "legend"; legend: BlLegend; n: number } | { kind: "closing" }
const useIso = typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect
const BL_ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"]

export default function BiryaniLegendsTemplate({
  legends = BL_LEGENDS,
  title = "Biryani Legends",
  subtitle = "Stories from the handi",
  edition = "Volume One",
  publisher = "The Saffron Press",
  epigraph = "Some things cannot be hurried. A handi on dum is one of them.",
  closing = {},
  columns = BL_COLUMNS,
  socials = BL_SOCIALS,
  colophon = "Set in Cormorant, Crimson and Allura. Engravings drawn line by line; every pot painted on the page.",
  copyright,
  onSubscribe,
  cta = { label: "Order a handi", href: "#" },
  preset = "parchment",
  height = "100svh",
  fontHref = BL_FONTS,
  displayFont = BL_DISPLAY,
  scriptFont = BL_SCRIPT,
  bodyFont = BL_BODY,
  paperTexture,
  className,
}: BlProps) {
  const pal = BL_PRESETS[preset] || BL_PRESETS.parchment
  const close = {
    heading: "Biriyanis like this don’t come every day.",
    script: "Luckily, it’s closer than you think.",
    body: "Every legend in this book still cooks. Reserve a table at one of our three kitchens, or have a sealed handi brought to your door, still resting on its dum.",
    primary: { label: "Reserve a table", href: "#" },
    secondary: { label: "Order a handi", href: "#" },
    newsletter: "Receive the next chapter",
    ...closing,
  }
  const spreads: BlSpread[] = React.useMemo(() => [{ kind: "title" }, ...legends.map((legend, n) => ({ kind: "legend" as const, legend, n })), { kind: "closing" }], [legends])
  const N = spreads.length

  const rootRef = React.useRef(null as HTMLDivElement | null)
  const scrollerRef = React.useRef(null as HTMLDivElement | null)
  const stageRef = React.useRef(null as HTMLDivElement | null)
  const bookRef = React.useRef(null as HTMLDivElement | null)
  const leafRefs = React.useRef([] as (HTMLDivElement | null)[])
  const coverRef = React.useRef(null as HTMLDivElement | null)
  const baseRef = React.useRef(null as HTMLDivElement | null)
  const stRef = React.useRef(null as ScrollTrigger | null)
  const introRef = React.useRef((sp: number) => {})
  const pending = React.useRef({ to: 0, at: -1e9 })
  const state = React.useRef({ t: 0, c: 0, opened: false, idx: -1, seen: new Set() as Set<number> })

  const [single, setSingle] = React.useState(false)
  const [size, setSize] = React.useState({ w: 0, h: 0, x: 0, y: 0 })
  const [reduced, setReduced] = React.useState(false)
  const [idx, setIdx] = React.useState(0)
  const [dishes, setDishes] = React.useState({} as { [k: string]: string })
  const [load, setLoad] = React.useState(0)
  const [ready, setReady] = React.useState(false)
  const [tex, setTex] = React.useState({ grain: "", cloth: "" })
  const [email, setEmail] = React.useState("")
  const [joined, setJoined] = React.useState(false)
  const [err, setErr] = React.useState("")

  const turns = single ? N * 2 - 1 : N - 1
  const pageOf = (spread: number) => (single ? spread * 2 : spread)
  const spreadOf = (i: number) => (single ? Math.floor(i / 2) : i)

  const scenes = React.useMemo(() => legends.map((l) => (BL_SCENES[l.engraving || "harbour"] || blHarbour)(l.seed ?? 3)), [legends])
  const coda = React.useMemo(() => blHarbour(17), [])
  const wreath = React.useMemo(() => blWreath(11), [])
  const dishKey = (d: BlDish | undefined) => (d?.vessel || "brass") + "/" + (d?.rice || "jeerakasala") + "/" + (d?.seed ?? 1)

  // ---- media queries
  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    const on = () => setReduced(mq.matches)
    on()
    mq.addEventListener("change", on)
    return () => mq.removeEventListener("change", on)
  }, [])

  // ---- paper grain and book cloth, made once
  React.useEffect(() => {
    const make = (n: number, paint: (ctx: CanvasRenderingContext2D, r: () => number) => void) => {
      const c = document.createElement("canvas")
      c.width = c.height = n
      const ctx = c.getContext("2d")
      if (!ctx) return ""
      paint(ctx, blRng(n))
      return "url(" + c.toDataURL("image/png") + ")"
    }
    const grain = make(240, (ctx, r) => {
      const img = ctx.createImageData(240, 240)
      for (let i = 0; i < img.data.length; i += 4) {
        const v = 120 + r() * 120
        img.data[i] = v
        img.data[i + 1] = v * 0.92
        img.data[i + 2] = v * 0.8
        img.data[i + 3] = r() < 0.5 ? 26 : 10
      }
      ctx.putImageData(img, 0, 0)
      for (let i = 0; i < 90; i++) {
        const x = r() * 240
        const y = r() * 240
        const a = r() * Math.PI
        const l = 4 + r() * 16
        ctx.strokeStyle = "rgba(110,80,40," + (0.05 + r() * 0.12) + ")"
        ctx.lineWidth = 0.6
        ctx.beginPath()
        ctx.moveTo(x, y)
        ctx.quadraticCurveTo(x + Math.cos(a) * l * 0.5 + 2, y + Math.sin(a) * l * 0.5, x + Math.cos(a) * l, y + Math.sin(a) * l)
        ctx.stroke()
      }
      for (let i = 0; i < 14; i++) {
        const x = r() * 240
        const y = r() * 240
        const g = ctx.createRadialGradient(x, y, 0, x, y, 6 + r() * 26)
        g.addColorStop(0, "rgba(140,100,50,0.07)")
        g.addColorStop(1, "rgba(140,100,50,0)")
        ctx.fillStyle = g
        ctx.fillRect(0, 0, 240, 240)
      }
    })
    const cloth = make(180, (ctx, r) => {
      ctx.fillStyle = "#808080"
      ctx.fillRect(0, 0, 180, 180)
      for (let y = 0; y < 180; y += 2) {
        ctx.fillStyle = "rgba(255,255,255," + (0.06 + r() * 0.08) + ")"
        ctx.fillRect(0, y, 180, 1)
      }
      for (let x = 0; x < 180; x += 2) {
        ctx.fillStyle = "rgba(0,0,0," + (0.06 + r() * 0.08) + ")"
        ctx.fillRect(x, 0, 1, 180)
      }
      for (let i = 0; i < 1400; i++) {
        ctx.fillStyle = r() < 0.5 ? "rgba(0,0,0,.12)" : "rgba(255,255,255,.1)"
        ctx.fillRect(r() * 180, r() * 180, 1 + r() * 2, 1)
      }
    })
    setTex({ grain, cloth })
  }, [])

  // ---- the type loads behind the closed cover; then it opens
  React.useEffect(() => {
    let done = false
    const t0 = performance.now()
    setLoad(0.4)
    const fonts = (document as Document & { fonts?: { ready: Promise<unknown> } }).fonts
    const wait = Promise.race([fonts ? fonts.ready : Promise.resolve(), new Promise((r) => window.setTimeout(r, 2500))])
    wait.then(() => {
      if (done) return
      setLoad(1)
      window.setTimeout(() => {
        if (!done) setReady(true)
      }, Math.max(350, 1500 - (performance.now() - t0)))
    })
    return () => {
      done = true
    }
  }, [])

  // ---- paint the pots once the cover has opened, one per idle moment, so a
  // turn of the page is never interrupted
  const potPx = Math.round(blClamp(size.w * (single ? 0.8 : 0.36) * Math.min(2, typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1), 480, 900) / 60) * 60
  React.useEffect(() => {
    if (!ready || !size.w) return
    let cancelled = false
    const urls: string[] = []
    const todo: BlDish[] = []
    const seen = new Set<string>()
    for (const l of legends) {
      const k = dishKey(l.dish)
      if (l.dish?.src || seen.has(k)) continue
      seen.add(k)
      todo.push(l.dish || {})
    }
    let i = 0
    let id = 0
    const step = () => {
      if (cancelled || i >= todo.length) return
      const d = todo[i++]
      const c = document.createElement("canvas")
      c.width = c.height = potPx
      const ctx = c.getContext("2d")
      if (ctx) blPaintDish(ctx, potPx, d.vessel || "brass", d.rice || "jeerakasala", d.seed ?? 1)
      c.toBlob((b) => {
        if (cancelled || !b) return
        const u = URL.createObjectURL(b)
        urls.push(u)
        setDishes((prev) => ({ ...prev, [dishKey(d)]: u }))
        id = window.setTimeout(step, 160)
      }, "image/png")
    }
    id = window.setTimeout(step, reduced ? 200 : 2500)
    return () => {
      cancelled = true
      window.clearTimeout(id)
      for (const u of urls) URL.revokeObjectURL(u)
    }
  }, [ready, legends, potPx > 0])

  // ---- measure the stage, size the book
  useIso(() => {
    const stage = stageRef.current
    if (!stage) return
    const measure = () => {
      const W = stage.clientWidth
      const H = stage.clientHeight
      const one = W < 760 || W / H < 0.95
      const top = 56
      const bot = 52
      const availW = W - (one ? 20 : 64)
      const availH = H - top - bot - (one ? 14 : 28)
      let w: number
      let h: number
      if (one) {
        w = Math.max(240, Math.min(availW, availH * 0.7))
        h = Math.max(320, Math.min(availH, w / 0.48))
      } else {
        w = Math.max(300, Math.min(availW, availH * 1.414))
        h = w / 1.414
      }
      setSingle(one)
      setSize({ w, h, x: (W - w) / 2, y: top + (availH - h) / 2 + (one ? 7 : 14) })
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(stage)
    return () => ro.disconnect()
  }, [])

  // ---- apply a turn position to the leaves
  const apply = React.useCallback(() => {
    const s = state.current
    const raw = s.opened ? s.t : 0
    const t = reduced ? Math.round(raw) : raw
    const leaves = leafRefs.current
    for (let i = 0; i < leaves.length; i++) {
      const el = leaves[i]
      if (!el) continue
      const p = blClamp(t - i, 0, 1)
      const lift = Math.sin(p * Math.PI)
      el.style.transform = "rotateY(" + (-180 * p).toFixed(3) + "deg)"
      el.style.zIndex = String(p > 0 && p < 1 ? 900 : p >= 1 ? 100 + i : 600 - i)
      el.style.visibility = Math.abs(t - i - 0.5) < 2 ? "visible" : "hidden"
      el.style.setProperty("--lift", lift.toFixed(3))
      const shades = el.querySelectorAll(":scope > .bl-face > .bl-shade")
      if (shades[0]) (shades[0] as HTMLElement).style.opacity = (p * 0.9).toFixed(3)
      if (shades[1]) (shades[1] as HTMLElement).style.opacity = ((1 - p) * 0.9).toFixed(3)
    }
    if (baseRef.current) baseRef.current.style.visibility = t > leaves.length - 2.2 ? "visible" : "hidden"
    const cover = coverRef.current
    if (cover) {
      const c = s.c
      cover.style.transform = "rotateY(" + (-180 * c).toFixed(3) + "deg)"
      cover.style.zIndex = String(c > 0 && c < 1 ? 950 : c >= 1 ? 50 : 1000)
      cover.style.setProperty("--lift", Math.sin(c * Math.PI).toFixed(3))
      cover.style.visibility = single && c >= 1 ? "hidden" : t < 1.6 || !s.opened ? "visible" : "hidden"
    }
    const book = bookRef.current
    if (book) {
      const shift = single ? 0 : -25 * (1 - s.c)
      book.style.transform = "translateX(" + shift.toFixed(3) + "%)"
      book.style.setProperty("--open", String(s.c))
    }
    const st = stageRef.current
    if (st) st.style.setProperty("--prog", String(turns ? blClamp(t / turns, 0, 1) : 0))
    const i = Math.round(t)
    if (i !== s.idx && s.opened && s.c > 0.55) {
      s.idx = i
      setIdx(i)
      introRef.current(single ? Math.floor(i / 2) : i)
    }
  }, [reduced, single, turns])

  // ---- intro: a spread inks itself in
  const intro = React.useCallback(
    (sp: number) => {
      const root = rootRef.current
      const s = state.current
      if (!root || s.seen.has(sp)) return
      s.seen.add(sp)
      const q = (sel: string) => Array.from(root.querySelectorAll('[data-sp="' + sp + '"] ' + sel))
      const tl0 = gsap.timeline()
      const tl = { to: (t: Element[], v: gsap.TweenVars, at: number) => (t.length ? tl0.to(t, v, at) : tl0) }
      if (reduced) {
        const el = q(".bl-sheet-in")
        if (el.length) gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.8, ease: "power1.out" })
        return
      }
      tl.to(q(".bl-wr"), { strokeDashoffset: 0, duration: 2.6, ease: "power2.inOut" }, 0)
      for (let b = 0; b < 12; b++) tl.to(q('.bl-b[data-b="' + b + '"]'), { strokeDashoffset: 0, duration: 1.5, ease: "power2.out" }, 0.15 + b * 0.12)
      tl.to(q(".bl-wash"), { opacity: 1, duration: 1.2, ease: "power1.inOut" }, 1.7)
      tl.to(q(".bl-eng-img"), { "--ink": 1.3, duration: 2.8, ease: "power2.inOut" }, 0.15)
      tl.to(q(".bl-ch"), { yPercent: 0, opacity: 1, filter: "blur(0px)", duration: 0.95, ease: "power3.out", stagger: 0.035 }, 0.3)
      tl.to(q(".bl-script"), { "--w": 1.3, duration: 1.5, ease: "power2.inOut" }, 0.8)
      tl.to(q(".bl-copy p, .bl-reveal"), { "--r": 1.4, y: 0, duration: 1.4, ease: "power2.out", stagger: 0.16 }, 1)
      tl.to(q(".bl-fade"), { opacity: 1, y: 0, duration: 1, ease: "power2.out", stagger: 0.08 }, 1.1)
      tl.to(q(".bl-dish-in"), { y: 0, scale: 1, opacity: 1, rotate: 0, duration: 1.7, ease: "power3.out" }, 0.75)
      tl.to(q(".bl-shadow"), { opacity: 1, scale: 1, duration: 1.7, ease: "power3.out" }, 0.75)
      tl.to(q(".bl-contact"), { opacity: 1, duration: 0.8, ease: "power2.out" }, 1.75)
      tl.to(q(".bl-steam"), { opacity: 1, duration: 2, ease: "power1.inOut" }, 2.1)
    },
    [reduced],
  )

  // ---- hide what has not been drawn yet (once per mount / layout)
  useIso(() => {
    const root = rootRef.current
    if (!root || !size.w) return
    const s = state.current
    const ctx = gsap.context(() => {
      for (let sp = 0; sp < N; sp++) {
        if (s.seen.has(sp) || reduced) continue
        const q = (sel: string) => Array.from(root.querySelectorAll('[data-sp="' + sp + '"] ' + sel))
        const set = (t: Element[], v: gsap.TweenVars) => t.length && gsap.set(t, v)
        set(q(".bl-wr, .bl-b"), { strokeDashoffset: 1 })
        set(q(".bl-wash"), { opacity: 0 })
        set(q(".bl-eng-img"), { "--ink": -0.1 })
        set(q(".bl-ch"), { yPercent: 70, opacity: 0, filter: "blur(6px)" })
        set(q(".bl-script"), { "--w": -0.15 })
        set(q(".bl-copy p, .bl-reveal"), { "--r": -0.1, y: 10 })
        set(q(".bl-fade"), { opacity: 0, y: 12 })
        set(q(".bl-dish-in"), { y: "-16%", scale: 1.16, opacity: 0, rotate: -6 })
        set(q(".bl-shadow"), { opacity: 0, scale: 1.45 })
        set(q(".bl-contact, .bl-steam"), { opacity: 0 })
      }
    }, root)
    return () => ctx.kill()
  }, [size.w > 0, single, N, reduced])

  // ---- scroll drives the turns
  useIso(() => {
    const scroller = scrollerRef.current
    if (!scroller || !size.w) return
    const s = state.current
    const ctx = gsap.context(() => {
      const st = ScrollTrigger.create({
        trigger: scroller,
        start: "top top",
        end: "bottom bottom",
        snap: turns > 0 ? { snapTo: 1 / turns, duration: { min: 0.25, max: 0.9 }, delay: 0.06, ease: "power1.inOut" } : undefined,
      })
      stRef.current = st
      gsap.to(s, {
        t: turns,
        ease: "none",
        scrollTrigger: { trigger: scroller, start: "top top", end: "bottom bottom", scrub: reduced ? true : 0.75 },
        onUpdate: apply,
      })
    }, scroller)
    apply()
    return () => {
      stRef.current = null
      ctx.revert()
    }
  }, [size.w > 0, turns, apply, reduced])

  // ---- the cover opens once everything is ready
  React.useEffect(() => {
    if (!ready || state.current.opened) return
    const s = state.current
    if (reduced) {
      s.c = 1
      s.opened = true
      apply()
      return
    }
    s.opened = true
    const tw = gsap.to(s, { c: 1, duration: 2.1, ease: "power3.inOut", delay: 0.25, onUpdate: apply })
    apply()
    return () => {
      tw.kill()
    }
  }, [ready])

  introRef.current = intro

  // ---- go to a page (scrolls the window, so scroll stays the one source of truth)
  const goTo = React.useCallback(
    (i: number) => {
      const st = stRef.current
      const target = blClamp(i, 0, turns)
      if (!st || !turns) return
      const y = st.start + ((st.end - st.start) * target) / turns
      pending.current = { to: target, at: performance.now() }
      window.scrollTo({ top: y + 1, behavior: reduced ? "auto" : "smooth" })
    },
    [turns, reduced],
  )

  // ---- keys, swipe, pointer light
  React.useEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    const visible = () => {
      const r = stage.getBoundingClientRect()
      return r.top < window.innerHeight * 0.5 && r.bottom > window.innerHeight * 0.5
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || !visible()) return
      const tag = (e.target as HTMLElement | null)?.tagName || ""
      if (/INPUT|TEXTAREA|SELECT/.test(tag) || (e.target as HTMLElement | null)?.isContentEditable) return
      const pend = pending.current
      const cur = performance.now() - pend.at < 900 ? pend.to : Math.round(state.current.t)
      let next = -1
      if (e.key === "ArrowRight" || e.key === "PageDown" || (e.key === " " && !e.shiftKey)) next = cur + 1
      else if (e.key === "ArrowLeft" || e.key === "PageUp" || (e.key === " " && e.shiftKey)) next = cur - 1
      else if (e.key === "Home") next = 0
      else if (e.key === "End") next = turns
      if (next < 0 || next > turns) return
      e.preventDefault()
      goTo(next)
    }
    let sx = 0
    let sy = 0
    const onStart = (e: TouchEvent) => {
      sx = e.touches[0].clientX
      sy = e.touches[0].clientY
    }
    const onEnd = (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - sx
      const dy = e.changedTouches[0].clientY - sy
      if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy) * 1.3) return
      goTo(Math.round(state.current.t) + (dx < 0 ? 1 : -1))
    }
    let raf = 0
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const r = stage.getBoundingClientRect()
        stage.style.setProperty("--px", (((e.clientX - r.left) / r.width) * 2 - 1).toFixed(3))
        stage.style.setProperty("--py", (((e.clientY - r.top) / r.height) * 2 - 1).toFixed(3))
      })
    }
    window.addEventListener("keydown", onKey)
    stage.addEventListener("touchstart", onStart, { passive: true })
    stage.addEventListener("touchend", onEnd, { passive: true })
    if (!reduced) stage.addEventListener("pointermove", onMove)
    return () => {
      window.removeEventListener("keydown", onKey)
      stage.removeEventListener("touchstart", onStart)
      stage.removeEventListener("touchend", onEnd)
      stage.removeEventListener("pointermove", onMove)
      cancelAnimationFrame(raf)
    }
  }, [goTo, turns, reduced])

  const subscribe = (e: React.FormEvent) => {
    e.preventDefault()
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setErr("That address looks unfinished.")
      return
    }
    setErr("")
    setJoined(true)
    onSubscribe?.(email)
  }

  // ---- what goes on a spread -------------------------------------------------------
  const folio = (sp: number, side: number) => sp * 2 + side + 2
  const renderSpread = (sp: number, side: number) => {
    const spread = spreads[sp]
    const run = (label: string) => (
      <>
        <span className="bl-folio-n" style={side === 0 ? { left: "4.2%" } : { right: "4.2%" }}>
          {folio(sp, side)}
        </span>
        <span className="bl-run" style={side === 0 ? { left: "12%" } : { right: "12%" }}>
          {label}
        </span>
      </>
    )
    if (spread.kind === "legend") {
      const L = spread.legend
      const lay = BL_LAYOUTS[L.layout || "shore"] || BL_LAYOUTS.shore
      const scene = scenes[spread.n]
      const tone = L.tone === "sepia" ? "var(--bl-sepia)" : "var(--bl-graphite)"
      const dsrc = L.dish?.src || dishes[dishKey(L.dish)]
      const dishPage = lay.dish.x < 50 ? 0 : 1
      const words = L.name.split("")
      return (
        <>
          <div className="bl-wreath bl-abs" style={{ left: lay.wreath.x + "%", top: lay.wreath.y + "%", width: lay.wreath.s + "%", transform: "translate(-50%,-50%)", opacity: 0.3 }}>
            <BlWreath inks={wreath} />
          </div>
          <div className={"bl-eng bl-box " + (lay.eng.fade === "top" ? "bl-eng-top" : "bl-eng-oval") + (lay.eng.bottom ? " bl-bottom-anchor" : "")} style={blPos(lay.eng)}>
            <div className="bl-par" style={{ "--pd": -5 } as React.CSSProperties}>
              {L.engravingImage ? (
                <img className="bl-eng-img" src={L.engravingImage.src} alt={side === 0 ? L.engravingImage.alt || "" : ""} style={{ aspectRatio: String(L.engravingImage.aspect || scene.w / scene.h) }} decoding="async" draggable={false} />
              ) : (
                <BlEngraving scene={scene} box={single ? { l: lay.eng.ml ?? lay.eng.l, w: lay.eng.mw ?? lay.eng.w } : lay.eng} side={side} tone={tone} />
              )}
            </div>
          </div>
          {side === 0 && (
            <div className="bl-box" style={blPos(lay.name)}>
              <h2 className="bl-name" aria-label={L.name}>
                {words.map((ch, i) => (
                  <span key={i} className="bl-ch" aria-hidden="true">
                    {ch === " " ? " " : ch}
                  </span>
                ))}
              </h2>
              <span className="bl-script">{L.title}</span>
            </div>
          )}
          {side === 0 && (
            <div className="bl-box bl-copy" style={blPos(lay.story)}>
              {L.story.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          )}
          {side === 1 && (
            <div className="bl-box bl-copy" style={blPos(lay.text)}>
              {(L.continued || []).map((p, i) => (
                <p key={i}>{p}</p>
              ))}
              {L.note && !lay.note && <p className="bl-note">{L.note}</p>}
            </div>
          )}
          {side === 1 && L.note && lay.note && (
            <div className="bl-box bl-copy bl-note" style={{ ...blPos(lay.note), textAlign: "left" }}>
              <p>{L.note}</p>
            </div>
          )}
          {side === dishPage && (
            <div
              className="bl-dish"
              style={{ "--dx": lay.dish.x + "%", "--dy": lay.dish.y + "%", "--dd": lay.dish.d + "%", "--mdx": (lay.dish.mx ?? lay.dish.x) + "%", "--mdy": (lay.dish.my ?? lay.dish.y) + "%", "--mdd": (lay.dish.md ?? lay.dish.d) + "%" } as React.CSSProperties}
            >
              <div className="bl-par" style={{ position: "absolute", inset: 0, "--pd": 7 } as React.CSSProperties}>
                <div className="bl-dish-in">
                  <div className="bl-shadow" />
                  <div className="bl-contact" />
                  <div className="bl-dish-lift">
                    {dsrc ? <img src={dsrc} alt={L.dish?.alt || L.dishName || "A pot of biryani"} width={1000} height={1000} decoding="async" draggable={false} onLoad={(e) => e.currentTarget.classList.add("bl-on")} /> : null}
                    <BlSteam />
                  </div>
                  <span className="bl-hit" aria-hidden="true" />
                </div>
              </div>
            </div>
          )}
          {lay.eng.bottom ? null : run(side === 0 ? title : L.city || L.title)}
        </>
      )
    }
    if (spread.kind === "title") {
      return (
        <>
          {side === 0 ? (
            <>
              <div className="bl-wreath bl-abs" style={{ left: "1%", top: "2%", width: "34%", transform: "translate(-50%,-50%)", opacity: 0.3 }}>
                <BlWreath inks={wreath} />
              </div>
              <div className="bl-box" style={blPos({ l: 8, t: 11, w: 34, mt: 8, mw: 40 })}>
                <p className="bl-kicker bl-fade">Contents</p>
                <h2 className="bl-display" style={{ fontSize: "calc(var(--u) * 3.4)", margin: "calc(var(--u) * .6) 0 calc(var(--u) * 2.6)" }} aria-label="The legends">
                  {"The legends".split("").map((ch, i) => (
                    <span key={i} className="bl-ch" aria-hidden="true">
                      {ch === " " ? " " : ch}
                    </span>
                  ))}
                </h2>
                <ol className="bl-toc">
                  {legends.map((l, i) => (
                    <li key={i} className="bl-fade">
                      <button type="button" onClick={() => goTo(pageOf(i + 1))}>
                        <span className="n">{BL_ROMAN[i] || i + 1}</span>
                        <span className="t">
                          {l.name}
                          <small>{l.dishName || l.title}</small>
                        </span>
                        <span className="d" />
                        <span className="p">{folio(i + 1, 0)}</span>
                      </button>
                    </li>
                  ))}
                  <li className="bl-fade">
                    <button type="button" onClick={() => goTo(pageOf(N - 1))}>
                      <span className="n">&middot;</span>
                      <span className="t">
                        At the table
                        <small>Reservations, the kitchens, the list</small>
                      </span>
                      <span className="d" />
                      <span className="p">{folio(N - 1, 0)}</span>
                    </button>
                  </li>
                </ol>
                <p className="bl-copy bl-fade" style={{ marginTop: "calc(var(--u) * 2.4)", fontStyle: "italic", textAlign: "left", color: "var(--bl-muted)" }}>
                  &ldquo;{epigraph}&rdquo;
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="bl-wreath bl-abs" style={{ left: "75%", top: "44%", width: "40%", transform: "translate(-50%,-50%)", opacity: 0.18 }}>
                <BlWreath inks={wreath} />
              </div>
              <div className="bl-box" style={{ ...blPos({ l: 55, t: 20, w: 40, mt: 18, mw: 40 }), textAlign: "center" }}>
                <p className="bl-kicker bl-fade">{publisher} presents</p>
                <h1 className="bl-display" style={{ fontSize: "calc(var(--u) * 6.4)", margin: "calc(var(--u) * 1.6) 0 0" }} aria-label={title}>
                  {title.split(" ").map((w, wi) => (
                    <span key={wi} style={{ display: "block" }}>
                      {w.split("").map((ch, i) => (
                        <span key={i} className="bl-ch" aria-hidden="true">
                          {ch}
                        </span>
                      ))}
                    </span>
                  ))}
                </h1>
                <span className="bl-script" style={{ margin: "calc(var(--u) * .2) auto 0", transform: "rotate(-2deg)" }}>
                  {subtitle}
                </span>
                <div className="bl-rule bl-fade" style={{ margin: "calc(var(--u) * 2.4) 12% calc(var(--u) * 1.6)" }}>
                  <BlSprig />
                </div>
                <p className="bl-kicker bl-fade">
                  {edition} &middot; {legends.map((l) => l.city).filter(Boolean).join(" · ")}
                </p>
                <p className="bl-copy bl-fade" style={{ textAlign: "center", marginTop: "calc(var(--u) * 3)", color: "var(--bl-muted)" }}>
                  {legends.length} kitchens, {legends.length} keepers of the flame, and the dishes they would not let the world forget.
                </p>
              </div>
            </>
          )}
          {run(side === 0 ? "Contents" : title)}
        </>
      )
    }
    const codaBox = { l: 0, t: 0, w: 100 }
    return (
      <>
        <div className="bl-eng bl-box bl-eng-top bl-bottom-anchor" style={{ ...blPos(codaBox), opacity: 0.85 }}>
          <div className="bl-par" style={{ "--pd": -5 } as React.CSSProperties}>
            <BlEngraving scene={coda} box={codaBox} side={side} tone="var(--bl-graphite)" />
          </div>
        </div>
        {side === 0 ? (
          <>
            <div className="bl-wreath bl-abs" style={{ left: "1%", top: "2%", width: "34%", transform: "translate(-50%,-50%)", opacity: 0.3 }}>
              <BlWreath inks={wreath} />
            </div>
            <div className="bl-box" style={blPos({ l: 8, t: 10, w: 34, mt: 7, mw: 40 })}>
              <p className="bl-kicker bl-fade">At the table</p>
              <h2 className="bl-display" style={{ fontSize: "calc(var(--u) * 3.6)", lineHeight: 1, margin: "calc(var(--u) * 1) 0 0" }} aria-label={close.heading}>
                {close.heading.split(" ").map((w, wi) => (
                  <span key={wi} style={{ display: "inline-block", whiteSpace: "nowrap" }}>
                    {w.split("").map((ch, i) => (
                      <span key={i} className="bl-ch" aria-hidden="true">
                        {ch}
                      </span>
                    ))}
                    {" "}
                  </span>
                ))}
              </h2>
              <span className="bl-script" style={{ margin: "calc(var(--u) * .4) 0 0 calc(var(--u) * .4)", fontSize: "calc(var(--u) * 2.9)" }}>
                {close.script}
              </span>
              <div className="bl-copy" style={{ marginTop: "calc(var(--u) * 2.2)" }}>
                <p>{close.body}</p>
              </div>
              <div className="bl-actions bl-fade" style={{ marginTop: "calc(var(--u) * 2.2)" }}>
                {close.primary && (
                  <a className="bl-stamp solid" href={close.primary.href || "#"}>
                    {close.primary.label}
                  </a>
                )}
                {close.secondary && (
                  <a className="bl-stamp" href={close.secondary.href || "#"}>
                    {close.secondary.label}
                  </a>
                )}
              </div>
              <div className="bl-fade" style={{ marginTop: "calc(var(--u) * 3.2)" }}>
                <p className="bl-kicker" style={{ marginBottom: "calc(var(--u) * .6)" }}>
                  {close.newsletter}
                </p>
                {joined ? (
                  <p className="bl-thanks" role="status">
                    Sealed. Your seat at the table is saved.
                  </p>
                ) : (
                  <form className="bl-form" onSubmit={subscribe} noValidate>
                    <label className="bl-sr" htmlFor="bl-email">
                      Email address
                    </label>
                    <input id="bl-email" className="bl-input" type="email" inputMode="email" autoComplete="email" placeholder="your@address.com" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={err ? true : undefined} aria-describedby={err ? "bl-err" : undefined} />
                    <button type="submit" className="bl-seal" aria-label="Seal and send">
                      <BlSeal letter={title.trim().charAt(0) || "B"} />
                    </button>
                  </form>
                )}
                {err && (
                  <p id="bl-err" className="bl-small" role="alert" style={{ color: "#a3231b", marginTop: "calc(var(--u) * .5)" }}>
                    {err}
                  </p>
                )}
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="bl-wreath bl-abs" style={{ left: "99%", top: "2%", width: "34%", transform: "translate(-50%,-50%)", opacity: 0.3 }}>
              <BlWreath inks={wreath} />
            </div>
            <div className="bl-box" style={blPos({ l: 56, t: 10, w: 37, mt: 7, mw: 40 })}>
              <p className="bl-kicker bl-fade">Colophon</p>
              <div className="bl-rule bl-fade" style={{ margin: "calc(var(--u) * 1.4) 0 calc(var(--u) * 2.4)" }}>
                <BlSprig />
              </div>
              <nav aria-label="Footer" className="bl-cols bl-fade">
                {columns.map((c, i) => (
                  <div key={i}>
                    <h4>{c.title}</h4>
                    <ul>
                      {c.links.map((l, j) => (
                        <li key={j}>
                          <a href={l.href || "#"}>{l.label}</a>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </nav>
              <div className="bl-socials bl-fade" style={{ margin: "calc(var(--u) * 2.6) 0 calc(var(--u) * 2)" }}>
                {socials.map((s, i) => (
                  <a key={i} href={s.href || "#"} aria-label={s.label}>
                    <BlIcon name={s.icon} />
                  </a>
                ))}
              </div>
              <p className="bl-small bl-fade" style={{ fontStyle: "italic" }}>
                {colophon}
              </p>
              <p className="bl-small bl-fade">{copyright || "© " + new Date().getFullYear() + " " + publisher + ". All rights reserved."}</p>
              <p className="bl-fade" style={{ marginTop: "calc(var(--u) * 2.2)" }}>
                <button type="button" className="bl-linkbtn" onClick={() => goTo(0)}>
                  Back to the contents
                </button>
              </p>
            </div>
          </>
        )}
        
      </>
    )
  }

  const page = (sp: number, side: number, key: string, back = false) => (
    <div className={"bl-face bl-page" + (back ? " bl-back" : "")} key={key}>
      <div className="bl-sheet" data-sp={sp} style={{ left: side ? "-100%" : 0 }}>
        <div className="bl-sheet-in" style={{ position: "absolute", inset: 0 }}>
          {renderSpread(sp, side)}
        </div>
      </div>
      <div className="bl-fx bl-grain" />
      <div className="bl-fx bl-age" />
      <div className={"bl-fx " + (side ? "bl-gutter-r" : "bl-gutter-l")} />
      <div className="bl-fx bl-light" />
      <div className="bl-fx bl-dimmer" />
      <div className="bl-fx bl-shade" />
    </div>
  )
  const coverFace = (
    <div className="bl-face bl-cover">
      <div className="bl-fx bl-cloth" />
      <div className="bl-fx bl-cover-spine" />
      <div className="bl-frame" />
      <div className="bl-wreath bl-abs" style={{ left: "50%", top: "50%", width: "78%", transform: "translate(-50%,-50%)", opacity: 0.22, color: "var(--bl-foil)" }}>
        <BlWreath inks={wreath} />
      </div>
      <div className="bl-cover-c">
        <span className="bl-foil" style={{ fontSize: "calc(var(--u) * .9)", letterSpacing: ".42em", textTransform: "uppercase" }}>
          {publisher}
        </span>
        <h1 className="bl-foil" style={{ marginTop: "calc(var(--u) * 2.6)" }}>
          {title}
        </h1>
        <span className="s bl-foil">{subtitle}</span>
        <span className="v bl-foil">{edition}</span>
      </div>
      <div className="bl-load" style={{ "--load": load, opacity: ready ? 0 : 1 } as React.CSSProperties} aria-hidden={ready}>
        {ready ? "Lifting the lid" : "Simmering on dum"}
        <i />
      </div>
    </div>
  )

  // Leaves: desktop has a leaf per turn (front: right page of spread i, back: left
  // page of spread i + 1); phones have one per page, front only.
  const leaves: { front: React.ReactNode; back: React.ReactNode }[] = []
  if (single) for (let p = 0; p < N * 2 - 1; p++) leaves.push({ front: page(Math.floor(p / 2), p % 2, "f" + p), back: null })
  else for (let i = 0; i < N - 1; i++) leaves.push({ front: page(i, 1, "f" + i), back: page(i + 1, 0, "b" + i, true) })
  leafRefs.current.length = leaves.length

  const u = single ? ((size.w * 2) / 100) * 1.32 : size.w / 100
  const curSpread = spreadOf(idx)
  const tabs = [{ label: "Contents", sp: 0 }, ...legends.map((l, i) => ({ label: l.city || l.name, sp: i + 1 })), { label: "Table", sp: N - 1 }]
  const pageLabel = single ? "p. " + (idx + 2) : "pp. " + (idx * 2 + 2) + "–" + (idx * 2 + 3)

  const vars = {
    "--h": height,
    "--u": u + "px",
    "--bl-display": displayFont,
    "--bl-script": scriptFont,
    "--bl-body": bodyFont,
    "--bl-desk": pal.desk,
    "--bl-desk-hi": pal.deskHi,
    "--bl-desk-lo": pal.deskLo,
    "--bl-chrome": pal.chrome,
    "--bl-chrome-muted": pal.chromeMuted,
    "--bl-paper": pal.paper,
    "--bl-ink": pal.ink,
    "--bl-muted": pal.muted,
    "--bl-saffron": pal.saffron,
    "--bl-sepia": pal.sepia,
    "--bl-graphite": pal.graphite,
    "--bl-cloth": pal.cloth,
    "--bl-cloth-deep": pal.clothDeep,
    "--bl-foil": pal.foil,
    "--bl-foil-hi": pal.foilHi,
    "--bl-dim": pal.dim,
    "--bl-grain": paperTexture ? "url(" + JSON.stringify(paperTexture) + ")" : tex.grain || "none",
    "--bl-grain-size": paperTexture ? "512px 512px" : "240px 240px",
    "--bl-cloth-tex": tex.cloth || "none",
  } as React.CSSProperties

  return (
    <div ref={rootRef} className={"bl-root" + (single ? " bl-single" : "") + (className ? " " + className : "")} style={vars}>
      {fontHref && <link rel="stylesheet" href={fontHref} />}
      <style>{BL_CSS + BL_POS_CSS + BL_DISH_CSS}</style>
      <div ref={scrollerRef} className="bl-scroller" style={{ height: "calc(" + height + " * " + (1 + turns * 0.9).toFixed(2) + ")" }}>
        <section ref={stageRef} className="bl-stage" aria-roledescription="book" aria-label={title}>
          <header className="bl-bar bl-top">
            <div className="bl-mark">
              <b>{title}</b>
              <i>{subtitle}</i>
            </div>
            <nav aria-label="Chapters">
              <ul className="bl-tabs">
                {tabs.map((t, i) => (
                  <li key={i}>
                    <button type="button" className="bl-tab" aria-current={curSpread === t.sp ? "true" : undefined} onClick={() => goTo(pageOf(t.sp))}>
                      {t.label}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
            {cta && (
              <a className="bl-cta" href={cta.href || "#"}>
                {cta.label}
              </a>
            )}
          </header>
          <div className="bl-3d">
            <div ref={bookRef} className="bl-book" style={{ left: size.x, top: size.y, width: size.w, height: size.h, visibility: size.w ? "visible" : "hidden" }}>
              <div className="bl-boards" />
              <div className="bl-under bl-under-l" />
              <div className="bl-under bl-under-r" />
              <div ref={baseRef} className="bl-leaf" style={{ zIndex: 1 }}>
                {page(N - 1, 1, "base")}
              </div>
              {leaves.map((l, i) => (
                <div key={(single ? "s" : "d") + i} ref={(el) => (leafRefs.current[i] = el)} className="bl-leaf">
                  {l.front}
                  {l.back}
                </div>
              ))}
              <div ref={coverRef} className="bl-leaf" style={{ zIndex: 1000 }}>
                {coverFace}
                {!single && page(0, 0, "cover-back", true)}
              </div>
            </div>
          </div>
          <footer className="bl-bar bl-bottom">
            <span className="bl-hint">Scroll, swipe or use &larr; &rarr; to turn the page</span>
            <span className="bl-folio" aria-live="polite">
              {pageLabel}
            </span>
            <div className="bl-nav">
              <button type="button" className="bl-btn" aria-label="Previous page" disabled={idx <= 0} onClick={() => goTo(idx - 1)}>
                <BlArrow dir={-1} />
              </button>
              <button type="button" className="bl-btn" aria-label="Next page" disabled={idx >= turns} onClick={() => goTo(idx + 1)}>
                <BlArrow dir={1} />
              </button>
            </div>
          </footer>
          <div className="bl-progress" />
        </section>
      </div>
    </div>
  )
}

const BL_DISH_CSS = `
.bl-dish{left:var(--dx);top:var(--dy);width:var(--dd)}
.bl-single .bl-dish{left:var(--mdx);top:var(--mdy);width:var(--mdd)}
`
