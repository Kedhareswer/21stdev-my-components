"use client"
import * as React from "react"
/*
 * Jewelcase Folio — a long, scrapbook-style portfolio for Kedhareswer in a Y2K print look.
 * A pink CD in a clear jewel case under a cut-out "PORTFOLIO" title, then the work in alternating ink and paper
 * bands joined by torn edges: about, posters, pubmats, social, mall posters, magazine, three brand identities,
 * packaging, and a thank-you with contacts. Headings are ransom-note letters, labels are strips of grey tape.
 * Every picture is an original ChatGPT image served from the component site.
 */
const ASSETS = "https://kedhar-components.pages.dev/jewelcase-folio-template/"
const EMAIL = "kedhareswer.12110626@gmail.com"

// #region paper
/** FNV-1a: the same word always gets the same letters */
export function hash(s: string) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}
/** mulberry32, so layouts are stable between server and client */
export function rng(seed: number) {
  let a = seed | 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
export const KINDS = ["a", "box", "serif", "cond", "low"]
const WEIGHTS = [0.34, 0.2, 0.16, 0.16, 0.14]
export type Letter = { ch: string; kind: string; rot: number; dy: number; size: number }
/** Cut-out letters for a word: a face per letter, a small tilt, lift and size change. No two neighbours share a face. */
export function ransom(word: string, salt = "") {
  const r = rng(hash(word + salt))
  const out: Letter[] = []
  let prev = ""
  for (const ch of word) {
    if (ch === " ") {
      out.push({ ch, kind: "sp", rot: 0, dy: 0, size: 1 })
      prev = ""
      continue
    }
    let kind = prev
    for (let k = 0; k < 6 && kind === prev; k++) {
      let x = r()
      kind = KINDS[KINDS.length - 1]
      for (let i = 0; i < KINDS.length; i++) {
        if (x < WEIGHTS[i]) {
          kind = KINDS[i]
          break
        }
        x -= WEIGHTS[i]
      }
    }
    prev = kind
    out.push({ ch, kind, rot: Math.round((r() * 10 - 5) * 10) / 10, dy: Math.round((r() * 0.12 - 0.06) * 100) / 100, size: Math.round((0.88 + r() * 0.24) * 100) / 100 })
  }
  return out
}
/** A ragged paper edge as a clip-path polygon. The torn side jitters within `amp` px; the other side is straight. */
export function torn(seed: string, side: "top" | "bottom", n = 72, amp = 14) {
  const r = rng(hash(seed))
  const pts: string[] = []
  for (let i = 0; i <= n; i++) {
    const x = Math.round((i / n) * 10000) / 100
    const j = Math.round(r() * amp * 10) / 10
    pts.push(x + "% " + (side === "top" ? j + "px" : "calc(100% - " + j + "px)"))
  }
  return side === "top" ? "polygon(" + pts.join(",") + ",100% 100%,0% 100%)" : "polygon(0% 0%,100% 0%," + pts.reverse().join(",") + ")"
}
/** Tape strips: a band with nibbled ends */
export function tapeClip(seed: string) {
  const r = rng(hash(seed))
  const l: string[] = []
  const rt: string[] = []
  for (let i = 0; i <= 6; i++) {
    const y = Math.round((i / 6) * 100)
    l.push(Math.round(r() * 5) + "% " + y + "%")
    rt.push(100 - Math.round(r() * 5) + "% " + (100 - y) + "%")
  }
  return "polygon(" + l.concat(rt).join(",") + ")"
}
// #endregion

/** Pictures, by file name on the asset site */
export const PICTURES = [
  "cd", "sticker-lips", "sticker-smile", "sticker-star", "sticker-heart",
  "poster-1", "poster-2", "poster-3", "poster-4", "poster-5", "poster-6", "poster-7", "poster-8", "poster-9", "poster-10",
  "pubmat-1", "pubmat-2", "social-1", "social-2", "social-3", "social-4", "social-5", "social-6",
  "bouquet-1", "bouquet-2", "bouquet-3", "bouquet-4", "bouquet-5", "bouquet-6",
  "mall-1", "mall-2", "mag-covers", "mag-folder", "mag-spread-pink", "mag-spread-red",
  "street-1", "street-2", "street-3", "street-4", "street-5", "street-6",
  "florist-card", "florist-sign", "florist-boxes", "florist-emboss", "cups", "packaging",
]

type Ctx = { src: (n: string) => string }
const C = React.createContext({ src: (n: string) => ASSETS + n + ".webp" } as Ctx)

function Img(p: { n: string; alt: string; w: number; h: number; className?: string; style?: React.CSSProperties; eager?: boolean }) {
  const { src } = React.useContext(C)
  return <img className={p.className} style={p.style} src={src(p.n)} alt={p.alt} width={p.w} height={p.h} loading={p.eager ? "eager" : "lazy"} decoding="async" draggable={false} />
}

function Ransom(p: { word: string; salt?: string; className?: string }) {
  const letters = ransom(p.word, p.salt)
  return (
    <span className={"jf-ransom " + (p.className ?? "")} aria-label={p.word} role="img">
      {letters.map((l, i) =>
        l.kind === "sp" ? (
          <span key={i} className="jf-sp" aria-hidden="true" />
        ) : (
          <span key={i} aria-hidden="true" className={"jf-rl jf-k-" + l.kind} style={{ transform: "translateY(" + l.dy + "em) rotate(" + l.rot + "deg)", fontSize: l.size + "em", ["--i" as string]: i } as React.CSSProperties}>
            {l.ch}
          </span>
        )
      )}
    </span>
  )
}

function Tape(p: { children: React.ReactNode; tilt?: number; className?: string }) {
  const label = String(p.children)
  return (
    <span className={"jf-tape " + (p.className ?? "")} style={{ clipPath: tapeClip(label), transform: "rotate(" + (p.tilt ?? -3) + "deg)" }}>
      {p.children}
    </span>
  )
}

function Edge(p: { seed: string; side: "top" | "bottom"; tone: "paper" | "ink" }) {
  return (
    <div className={"jf-edge jf-edge-" + p.side + " jf-edge-" + p.tone} aria-hidden="true">
      <div className="jf-edge-fibre" style={{ clipPath: torn(p.seed + "f", p.side, 90, 18) }} />
      <div className="jf-edge-face" style={{ clipPath: torn(p.seed, p.side, 72, 14) }} />
    </div>
  )
}

function Head(p: { a: string; b: string; tools?: string; align?: "left" | "right"; note?: string }) {
  return (
    <header className={"jf-head jf-rv" + (p.align === "right" ? " jf-head-r" : "")}>
      <h2 className="jf-h2">
        <Ransom word={p.a} />
        {p.b ? <span className="jf-h2b">{p.b}</span> : null}
      </h2>
      {p.tools ? <p className="jf-tools">Tools used: {p.tools}</p> : null}
      {p.note ? <p className="jf-note">{p.note}</p> : null}
    </header>
  )
}

function Phone(p: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div className={"jf-phone " + (p.className ?? "")} style={p.style}>
      <div className="jf-phone-screen">
        <span className="jf-notch" aria-hidden="true" />
        {p.children}
      </div>
    </div>
  )
}

function Feed(p: { handle: string; pics: string[] }) {
  return (
    <div className="jf-feed">
      <div className="jf-feed-top">
        <span className="jf-avatar">{p.handle.slice(0, 1).toUpperCase()}</span>
        <span>
          <b>{p.handle}</b>
          <i>{p.pics.length * 12} posts · Client feed</i>
        </span>
      </div>
      <div className="jf-feed-grid">
        {p.pics.map((n, i) => (
          <Img key={i} n={n} alt="" w={200} h={250} />
        ))}
      </div>
    </div>
  )
}

function Specimen(p: { family: string; face: string; label: string }) {
  const rows = [0, 1, 2, 3, 4, 5]
  const cols = ["300", "600", "300i", "700"]
  return (
    <div className="jf-spec">
      <span className="jf-mini">{p.label}</span>
      <div className="jf-spec-grid" style={{ fontFamily: p.face }}>
        {cols.map((c) =>
          rows.map((r) => (
            <span key={c + r} style={{ fontWeight: c.startsWith("7") ? 700 : c.startsWith("6") ? 600 : 400, fontStyle: c.endsWith("i") ? "italic" : "normal" }}>
              {p.family}
            </span>
          ))
        )}
      </div>
    </div>
  )
}

function Swatches(p: { colors: string[]; label?: string }) {
  return (
    <div className="jf-swatch-wrap">
      <span className="jf-mini">{p.label ?? "Colour palette"}</span>
      <div className="jf-swatches">
        {p.colors.map((c) => (
          <span key={c} style={{ background: c }} title={c} />
        ))}
      </div>
    </div>
  )
}

export type JewelcaseFolioTemplateProps = {
  /** Height of the hero's first screen. A definite length, never a percentage. */
  height?: string
  /** Every contact link mails this address. */
  email?: string
  /** Where the pictures live. Point it at your own copy to self-host them. */
  assetBase?: string
  className?: string
  style?: React.CSSProperties
}

export default function JewelcaseFolioTemplate({ height = "100svh", email = EMAIL, assetBase = ASSETS, className, style }: JewelcaseFolioTemplateProps) {
  const root = React.useRef(null as HTMLDivElement | null)
  const [ready, setReady] = React.useState(false)
  const ctx = React.useMemo(() => ({ src: (n: string) => assetBase + n + ".webp" }), [assetBase])

  React.useEffect(() => {
    const el = root.current
    if (!el) return
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const t = window.setTimeout(() => setReady(true), 40)
    const items = Array.from(el.querySelectorAll(".jf-rv"))
    if (reduced || typeof IntersectionObserver === "undefined") {
      items.forEach((n) => n.classList.add("jf-in"))
      return () => window.clearTimeout(t)
    }
    const io = new IntersectionObserver(
      (es) => {
        for (const e of es)
          if (e.isIntersecting) {
            e.target.classList.add("jf-in")
            io.unobserve(e.target)
          }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.01 }
    )
    items.forEach((n) => io.observe(n))
    return () => {
      window.clearTimeout(t)
      io.disconnect()
    }
  }, [])

  const mail = "mailto:" + email

  return (
    <C.Provider value={ctx}>
      <div ref={root} className={"jf-root" + (ready ? " jf-ready" : "") + (className ? " " + className : "")} style={style}>
        <style>{CSS}</style>

        {/* ── hero ─────────────────────────────────────────── */}
        <section className="jf-ink jf-hero" style={{ minHeight: height }}>
          <div className="jf-title">
            <span className="jf-owner">
              <svg className="jf-doodle" viewBox="0 0 60 60" aria-hidden="true">
                <path d="M30 4 L37 24 L58 24 L41 37 L48 57 L30 44 L12 57 L19 37 L2 24 L23 24 Z" />
              </svg>
              Kedhar's
            </span>
            <h1 className="jf-h1">
              <Ransom word="PORTFOLIO" salt="hero" />
            </h1>
            <span className="jf-ring" aria-hidden="true" />
            <span className="jf-year">2026</span>
          </div>
          <div className="jf-case">
            <Img n="cd" alt="A pink CD with a portrait print in a clear jewel case" w={800} h={750} className="jf-cd" eager />
            <Img n="sticker-lips" alt="" w={300} h={170} className="jf-st jf-st-lips" eager />
            <Img n="sticker-smile" alt="" w={300} h={250} className="jf-st jf-st-smile" eager />
            <Img n="sticker-star" alt="" w={300} h={290} className="jf-st jf-st-star" eager />
            <span className="jf-st jf-st-heart">
              <Img n="sticker-heart" alt="" w={300} h={286} eager />
              <b>ui kits</b>
            </span>
            <span className="jf-st jf-lbl-green">web design</span>
            <span className="jf-st jf-lbl-orange">
              Component
              <br />
              design
            </span>
            <span className="jf-st jf-lbl-bubble">
              Template
              <br />
              projects
            </span>
          </div>
          <a className="jf-about-tab" href="#jf-about" style={{ clipPath: tapeClip("about") }}>
            About the artist
          </a>
        </section>

        {/* ── about ────────────────────────────────────────── */}
        <section className="jf-paper jf-about" id="jf-about">
          <Edge seed="about-top" side="top" tone="paper" />
          <div className="jf-sheet jf-rv">
            <div>
              <h3 className="jf-h3">Introduction</h3>
              <p>
                I am <b>Kedhareswer</b>, a designer and front-end developer who builds React components and full-page templates. I am capable in{" "}
                interface design, motion, branding projects and art direction. I can adapt to various styles, showcasing my <b>versatility</b> and my{" "}
                <b>continuous pursuit for growth</b>.
              </p>
              <h3 className="jf-h3">Experience</h3>
              <ul>
                <li>Design intern at Client 1 | Jan '25 – May '25</li>
                <li>Interface designer at Client 2 | Jun '25 – Dec '25</li>
                <li>Freelance component designer | 2024 – present</li>
                <li>Template author, free catalogue | 2025 – present</li>
              </ul>
            </div>
            <div>
              <h3 className="jf-h3">Education</h3>
              <p>
                <b>University name</b>
                <br />
                Bachelor of Technology | 2021 – 2025
                <br />
                With honours
              </p>
              <p>
                <b>Senior high school name</b>
                <br />
                Science and Mathematics | 2019 – 2021
              </p>
              <h3 className="jf-h3">Skills</h3>
              <div className="jf-skills">
                {["Fg", "Ps", "Ae", "Re"].map((s) => (
                  <span key={s}>{s}</span>
                ))}
              </div>
            </div>
          </div>
          <Edge seed="about-bottom" side="bottom" tone="paper" />
        </section>

        {/* ── graphic posters ──────────────────────────────── */}
        <section className="jf-ink jf-posters">
          <Head a="GRAPHIC" b="POSTERS" tools="Adobe Photoshop" note="A collection of loud, made-up posters: ransom type, chrome, checkerboards and grain, each built around a fake band or brand." />
          <div className="jf-poster-grid jf-rv">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
              <Img key={i} n={"poster-" + i} alt={"Poster " + i} w={480} h={672} />
            ))}
          </div>
        </section>

        {/* ── pubmats & social ─────────────────────────────── */}
        <section className="jf-paper jf-pub">
          <Edge seed="pub-top" side="top" tone="paper" />
          <Head a="PUBMATS" b="" tools="Adobe Photoshop" align="right" />
          <div className="jf-pub-pair jf-rv">
            <figure className="jf-pub-a">
              <Tape tilt={-4}>Client 1</Tape>
              <Img n="pubmat-1" alt="Purple award poster" w={640} h={873} />
            </figure>
            <figure className="jf-pub-b">
              <Img n="pubmat-2" alt="Sky-blue festival poster" w={640} h={873} />
            </figure>
          </div>
          <p className="jf-cap jf-rv">Publication materials for Client 1: an awards night key visual and a summer festival line-up, sized for feed, story and print.</p>

          <div className="jf-block jf-rv">
            <Tape tilt={-2}>Client 2</Tape>
            <div className="jf-board">
              <Img n="social-1" alt="We have moved post" w={600} h={688} />
              <Img n="social-2" alt="Services offered post" w={600} h={688} />
              <Phone className="jf-phone-a">
                <Feed handle="client.two" pics={["social-1", "social-2", "social-3", "social-5", "poster-6", "poster-9", "poster-2", "social-4", "poster-4", "social-6", "poster-1", "poster-8"]} />
              </Phone>
            </div>
            <p className="jf-cap">Announcement posts for a print shop that changed address. Grunge textures and a hot pink strip carry the news.</p>
          </div>

          <div className="jf-block jf-rv">
            <Tape tilt={3}>Client 3</Tape>
            <div className="jf-cards">
              <Img n="social-3" alt="Holiday sale post" w={600} h={688} />
              <Img n="social-4" alt="Which set would you gift post" w={600} h={688} />
              <Img n="bouquet-5" alt="Gift bag" w={520} h={520} />
              <Img n="bouquet-6" alt="Gift box" w={520} h={520} />
            </div>
            <p className="jf-cap">A seasonal campaign for a kidswear shop: sale cards, gift sets and wrap shots that run as one carousel.</p>
          </div>

          <div className="jf-block jf-rv">
            <Tape tilt={-3}>Client 1</Tape>
            <div className="jf-mood">
              <Phone className="jf-phone-b">
                <Feed handle="client.one" pics={["social-5", "street-3", "street-1", "street-4", "street-2", "street-6", "street-5", "social-5", "street-3", "poster-5", "street-1", "street-4"]} />
              </Phone>
              <Img n="social-5" alt="Layer it menswear post" w={600} h={688} className="jf-mood-a" />
              <Img n="street-3" alt="Black graphic tee" w={520} h={520} className="jf-mood-b" />
              <Img n="street-6" alt="Hang tag on a white tee" w={520} h={520} className="jf-mood-c" />
              <div className="jf-mood-sw">
                {["#e8e3da", "#1c1c1c", "#9fb4d6", "#3d6fd9", "#e7a1b4", "#c9c1b3"].map((c) => (
                  <span key={c} style={{ background: c }} />
                ))}
              </div>
            </div>
            <p className="jf-cap">A feed refresh for a menswear label: layered looks, a calm neutral palette and one bright accent.</p>
          </div>

          <div className="jf-block jf-rv">
            <div className="jf-photos">
              <Tape tilt={2} className="jf-photos-tape">
                Client 2
              </Tape>
              <div className="jf-photos-bar">
                <b>Photos</b>
                <span className="jf-dots" aria-hidden="true">
                  •••
                </span>
              </div>
              <div className="jf-photos-tabs">
                <span className="jf-on">Your photos</span>
                <span>Albums</span>
              </div>
              <div className="jf-photos-grid">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Img key={i} n={"bouquet-" + i} alt={"Bouquet " + i} w={520} h={520} className={i === 1 ? "jf-big" : ""} />
                ))}
              </div>
            </div>
            <p className="jf-cap">Product photography and retouching for a florist that sells money bouquets, wraps and gift boxes.</p>
          </div>

          <div className="jf-block jf-rv">
            <Tape tilt={-2}>Client 3</Tape>
            <div className="jf-skin">
              <Img n="social-6" alt="Skincare post" w={600} h={688} />
              <Img n="pubmat-2" alt="" w={640} h={873} className="jf-skin-dim" />
              <Img n="social-4" alt="" w={600} h={688} className="jf-skin-dim" />
              <Phone className="jf-phone-c">
                <Img n="social-6" alt="" w={600} h={688} className="jf-story" />
                <span className="jf-story-bar" aria-hidden="true">
                  Send message
                </span>
              </Phone>
            </div>
          </div>
          <Edge seed="pub-bottom" side="bottom" tone="paper" />
        </section>

        {/* ── mall posters ─────────────────────────────────── */}
        <section className="jf-ink jf-mall">
          <Head a="MALL" b="POSTERS" tools="Adobe Photoshop" />
          <div className="jf-mall-pair jf-rv">
            <Img n="mall-1" alt="Now open poster" w={640} h={881} />
            <Img n="mall-2" alt="What we do poster" w={640} h={881} />
          </div>
          <p className="jf-cap jf-cap-c jf-rv">Launch posters for a creative store opening in a mall: one loud announcement and one plain list of services.</p>
        </section>

        {/* ── magazine ─────────────────────────────────────── */}
        <section className="jf-paper jf-mag">
          <Edge seed="mag-top" side="top" tone="paper" />
          <Head a="MAGAZINE" b="" tools="Adobe InDesign" />
          <div className="jf-mag-col">
            <Img n="mag-covers" alt="Three magazine covers" w={760} h={503} className="jf-rv" />
            <Img n="mag-folder" alt="White folder with a star mark" w={760} h={503} className="jf-rv" />
            <Img n="mag-spread-pink" alt="Pink magazine spread" w={760} h={503} className="jf-rv" />
            <Img n="mag-spread-red" alt="Red magazine spread" w={760} h={503} className="jf-rv" />
          </div>
          <Edge seed="mag-bottom" side="bottom" tone="paper" />
        </section>

        {/* ── branding ─────────────────────────────────────── */}
        <section className="jf-ink jf-brand">
          <Head a="BRANDING" b="PROJECTS" tools="Adobe Illustrator" />

          <div className="jf-kit jf-rv">
            <Tape tilt={2} className="jf-kit-tape">
              Project 1
            </Tape>
            <Img n="street-1" alt="Chrome oval logo on a card" w={520} h={520} className="jf-kit-logo" />
            <div className="jf-kit-info">
              <p>A small streetwear label for a young crowd. The mark is a liquid-chrome oval with a cut, read as a door left open, and every drop ships in black.</p>
              <Specimen family="Poppins" face="JfSans" label="Brand font" />
              <Swatches colors={["#1a1a1a", "#5c5c5c", "#a3a3a3", "#e6e3de"]} />
            </div>
            <div className="jf-kit-mocks">
              <span className="jf-mini">Mock-ups</span>
              <div className="jf-mock-grid">
                {[2, 3, 4, 5, 6].map((i) => (
                  <Img key={i} n={"street-" + i} alt="" w={520} h={520} />
                ))}
                <Img n="poster-7" alt="" w={480} h={672} />
              </div>
            </div>
          </div>

          <hr className="jf-dash" />

          <div className="jf-kit jf-kit-flip jf-rv">
            <Tape tilt={-3} className="jf-kit-tape">
              Project 2
            </Tape>
            <div className="jf-kit-info">
              <p>A neighbourhood florist and gift shop. The monogram is a bubbly retro script, set against burgundy, sage, blush and forest green.</p>
              <h4 className="jf-retro">Chunky Retro</h4>
              <Specimen family="Abril" face="JfSerif" label="Secondary font" />
              <Swatches colors={["#7d1d3a", "#a9b98a", "#eeaab2", "#2f3b2c"]} />
            </div>
            <Img n="florist-card" alt="Pink KB monogram card" w={760} h={506} className="jf-kit-logo" />
            <div className="jf-kit-wide">
              <span className="jf-mini">Pattern</span>
              <Img n="florist-emboss" alt="Embossed floral paper" w={760} h={506} className="jf-emboss" />
              <span className="jf-mini">Mock-ups</span>
              <div className="jf-flor-grid">
                <Img n="florist-sign" alt="Blade sign" w={760} h={506} className="jf-flor-sign" />
                <span style={{ background: "#7d1d3a" }} />
                <span style={{ background: "#a9b98a" }} />
                <span style={{ background: "#eeaab2" }} />
                <span style={{ background: "#2f3b2c" }} />
                <Img n="florist-boxes" alt="Flower hat boxes" w={760} h={506} className="jf-flor-box" />
              </div>
            </div>
          </div>

          <hr className="jf-dash" />

          <div className="jf-kit jf-rv">
            <Tape tilt={2} className="jf-kit-tape">
              Project 3
            </Tape>
            <div className="jf-wordcard">
              <span>
                Kedh<em>é</em>
              </span>
            </div>
            <div className="jf-kit-info">
              <p>A self-serve tea and coffee bar. The wordmark is a rounded geometric sans whose accent became a drop, so it reads as liquid at a glance.</p>
              <h4 className="jf-geo">Digital Geometric</h4>
              <Specimen family="Poppins" face="JfSans" label="Brand font" />
              <Swatches colors={["#26306b", "#7fd8c4", "#a7c79a", "#f6c9b1", "#f19a8c", "#ea6a5f"]} />
            </div>
            <div className="jf-kit-wide">
              <span className="jf-mini">Mock-ups</span>
              <Img n="cups" alt="Five takeaway cups" w={1400} h={788} className="jf-cups" />
            </div>
          </div>
        </section>

        {/* ── packaging ────────────────────────────────────── */}
        <section className="jf-paper jf-pack">
          <Edge seed="pack-top" side="top" tone="paper" />
          <Head a="PACKAGING" b="DESIGN" tools="Adobe Illustrator" />
          <div className="jf-pack-stage jf-rv">
            <Img n="packaging" alt="Pizza box and juice cartons" w={1400} h={788} />
            <span className="jf-hand jf-hand-a">
              <svg viewBox="0 0 80 50" aria-hidden="true">
                <path d="M74 6 C50 4 22 14 10 40 M10 40 L8 28 M10 40 L22 36" />
              </svg>
              Pizza box
            </span>
            <span className="jf-hand jf-hand-b">
              Juice box
              <svg viewBox="0 0 80 50" aria-hidden="true">
                <path d="M6 8 C30 4 58 14 70 40 M70 40 L72 28 M70 40 L58 36" />
              </svg>
            </span>
          </div>
          <Edge seed="pack-bottom" side="bottom" tone="paper" />
        </section>

        {/* ── thank you ────────────────────────────────────── */}
        <footer className="jf-ink jf-thanks">
          <div className="jf-ty jf-rv">
            <svg className="jf-doodle jf-doodle-ty" viewBox="0 0 60 60" aria-hidden="true">
              <path d="M30 4 L37 24 L58 24 L41 37 L48 57 L30 44 L12 57 L19 37 L2 24 L23 24 Z" />
            </svg>
            <Ransom word="THANK YOU" salt="end" className="jf-ty-word" />
            <span className="jf-ring jf-ring-ty" aria-hidden="true" />
          </div>
          <div className="jf-contacts jf-rv">
            <a href={mail}>
              <span>Email</span>
              {email}
            </a>
            <a href={mail + "?subject=New%20project"}>
              <span>Start a project</span>
              Say hello
            </a>
            <a href={mail + "?subject=Components"}>
              <span>Components</span>
              21st.dev/@kedhareswer
            </a>
            <a href={mail + "?subject=Templates"}>
              <span>Templates</span>
              Free catalogue
            </a>
            <a href={mail + "?subject=Availability"}>
              <span>Status</span>
              Open for work
            </a>
          </div>
          <p className="jf-fine">© 2026 Kedhareswer. Placeholder work, Client 1–3.</p>
        </footer>
      </div>
    </C.Provider>
  )
}

const FONTS = "@font-face{font-family:JfSans;font-style:normal;font-weight:400;font-display:swap;src:url(data:font/woff2;base64,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)}@font-face{font-family:JfSans;font-style:normal;font-weight:600;font-display:swap;src:url(data:font/woff2;base64,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)}@font-face{font-family:JfBlack;font-style:normal;font-weight:400;font-display:swap;src:url(data:font/woff2;base64,d09GMgABAAAAABscABEAAAAAOWwAABq/AAEBiQAAAAAAAAAAAAAAAAAAAAAAAAAAGlIbIBwqBmAAZgiBAAmabREICsgkvwwBNgIkA4IUC4EMAAQgBYNqByAMgSMbHTNFRbBxAMHGF0fw/+F4Y/SovpAOVdgyhboDD/VyF8PLXu6JaJBOxyx0JeO1eCaitKvlYU0XgwchbAhis1gs0SDwKxu+0fShg8V7SDk6+RR/nU5l3jur42/fCY2QZBb+/9+flfvce997XyW1VPRLhawaIJI0COpfg5CiZoyQO3LmsGNTEBIEkVdHzib2Tzp935EsokgGPhmA7xNzeU6zTSVnzrwVSradsDGwkZdN1UJIHy2puHn4bVbfTA5RskVaDz5mUFbVU7BzhYuCrR2LZl14nYv2n8/799dOztPeOTcVNDMvVHrYYZPWudOCM1FByW/6vbY2c4h4kLzJSX7TkE8WEcvuweuhKek6iCZ31F4skxBiT4Kn15ZSUSasZpQJ39MGyLAhHRlBCkoHLmoX9XbV19rcAAo9gP5eZ9m+9yVnfbsBK0DVEVSZFA1y0VHTWE+S7f+tJenAq0XLR/YeeOVb9GVieR1irHyA5OD03CcVcFWlSlGmLamosqytBbSBhDB2/m4ZU33sXLfKaoyICOEKtfvjIKCDpI027hSRQqKop9Kmo3TpKvMsKhtsKFtsKQccKsccK2dcuRsCZlhnE93/nr0KFQHw/9LTYSMOOcZeX/eD7+t7WAYjq3f7qX4JA/uxvQCMTsfSRa7V7Wlrz7ix3Q7hhfVWPTu6cR7uZofP/KNqA9HWzdDjbNYuOdv4oA2nIxZxpARPbUqXCiOzwxEUnUCKFgXD4xPiUTFJZFutN9vi/7N1gk409bprsEBiQYqrVHODhR+QcutlFpgzk8+LOPfppp38///2jXk3VlX8Avh5pwBz+Q3xqP2aumk0BbgW+lFk/RrM63Wk21+B4QbV53QizbUnsOUbWUalP9aRsRa4BRzRXgtImLwDgXw5cWDIRDi4goZfbVU19sd9pBwsxOLe72DVmubmDhevYkI8mwGbzpo+RymoZJ5QJYMblrGu6CLgIEtOpNnLPVB5mog8RKgcNoZxQ4rFqg3YUDkGLgfgDCq4gYZY1ps9zde2jIFlr5k0MU5yBMV2LAUuhmnFHQTSF6jlicC4E2DeI3lvrI2g4qBQq1YmhTVeAKSraVSnkwSkxCSkZ5d2nNLk//6ajaU7VIKG3ZB2TN6LQaONgrgNhpu/YqihmvkZiLHTAqYYpFiMNl4F4D6DmxNQH1RgPUcMsuauOsfXVJpV9XREibWdeu2yZLSxSWHfv7ZOA8XvRFMV1oSizpcEtST9htcyIdqClDPmkt9AkJWAmNDsLXVjtHkaidQIg3ag08Yq1GrjAzlYoza+tg4DBbcyT+uewwSoiGBwrVU7Ge8jJhcvo5nrsCDYpvnQ5ZpKv+E1FpM0D3ewvFeHjfWDUOhXLz7F+NZTh4P13bC+/2GjsVHyxnZRwO4exuzGC6o9Vgx2D9h8MR7Q7AtaVoHYzjoZ0Qs13+zJ8kmzZ3U/wjMNDLD61J6yIwaHmKhOi9isFEuusgAsaA9EYN0i1cdP28NMAc4HAdt76aN7j+YhxUsC1Rfu/CzMSPLNw393uMGfnY0n0eGjgNdx7LQMQcAwhIxAnFFIMAZJJkGKxSDNZMgwpa0GpX+hSGX9IKhUoPdIubejPqoqkH9O2qgqy79v6yxm0FFPzGEW8+iwgA6L6JCjwwgdltBhGR1W0GEVXaoJqf0VWl0TbpGu9uNdm7qo0AzZ700btCKtnqMDkaE409W8oLm0dKAwJEBXv3OLPpYDblF0eoXpUj+8jdqaPTOVDk31IZ80aB1gpr6BLNsBRZUGP98CwXmh8n7ThdLXHZ3flCGklqEeCeCI/xY5Rqge1I7xlAaQQN3rO0HBsvxMKucAPFkWutrsDf1Qs4SR2XH7et+OFS3dfU1dpwACHGykVmrjE0WVflmFnWnT9iJ1M8VTmE2USux0qPcoR3iYU/qK63CGd+bzpsmE+WT0ebZTpjQc+Tp1kKCMV5FynV6IymCmiUKYJ17tNmZjRMpzRbEblFUEGnSQF4wicwC2WpN2h0k6oTVXAU9tEmb5WXS0Aw3axW01QUt6Ji2QGYtX3ZwSLtNJLNQJrRdWqhY2Miw2QFqcnFm3hGib0gnPB66GSmq1Jdb4sF1gNmlCsuF1Vo8LujUHDXrDacL7ft3qlZwQeRLpmqLo1iO2TqyhciJzfQY4DDtmLwapY1Xa6ndEJ99cfM/s3LAQUTLyRR8C07hw9mEwi00+U6jdyWY6pQuUFW0lHLEhCFMzOCCRUZNuAnrurlJLpQtyco+iyIPmp17Nvv2XGAYz6Ub57Nm1LhgbNpNsVBeOtcG0Qw4/PgznSVYZaeUzBZ4wd+LfaiHRY3fmwWHvtJyceQoFULeRkUmeBpMaziwNgr5KJYOG16RZZ+HZjZzpdTmHFuDA4XmG4EI1ErzIVFyCYmaXqYYr1UjwKtOOaziDjPv8epYQ3KhBgjclFbdembLbTNkdpuwuU3FPNpLdR7IHSPYQKR5BsWKPsWJPsGJPsYo/Uw+T9ByT9AKT9BKT9AqT9BqT9AaT9BbT3HcoMLdk/D23kXWQP+BGfDS+1qCY9gkFQeFzAElfAgi+ToGFcPwmL/C7vBA/av0FfzJe4OcAgl8CiP96VS3xN3mJv8tL/ENeomEvMGpwAgRugPhCrAoXyeFiOVwih0uNGpYFCJYHqMeKVofKlHFlG/OpZ+mU/Waji6eleiEOBPq/2OhV90XQw2LGgKJDoGQ+et+dBZQ/M8CACYIBYrIx+PnISZ3J8WNPhYrx7mPCOPsplqpyKteMlVpcT1cV9OJqqhWLsR2zy1rIFeRyJnNTxbaqWlZlqUpPj1WiSmlLNfB1hrBJlqsF/jIvt52nG7bCYlq3+rxkfQOLVTsryXEep8dMlCT/HgRw4jjX7ftsFem0FHYRuTuZDU5YumNgN2TPB5xAChGJ47MXkhvJ70aPpYa8avKYx9mwoN/Wx3gkq9hMPZi0wcnZVm2bbHCRQEiUFIn6fkQDyRacWfA5MsWYr9MZKxmHuJ8xTpRGzP7BhkZVOc1ZXhUEABfpjOS0sqcaKTjFbP89wHrrfAXUFA/V0vRuZvAtnoOzDa8iS5NnxhNWMozX+b7JpZ/9eIaTyHQhCBA6AQGZr4MEnCfbO45vJILCTCyfEOeOLPcWuTeTYbiavGmKi5hsbJO00yRQs2g9VjKSk7yd5TTzdL5V3nLYwnNZnZCUpDWbU4Wz0MmTNGI0zSIbX2tUfp0IVm4+zF5Y47jfEEGukHtSMQdevYYyj304UrhH9DXr5rGSceIbg4NsXrCi+NpaYSOAKHR0vbZXTmEkifoI45c2xUXmwnIekFHwlPbj4p5dWWVjsLcdCNhgk0mCxvX77LiwjjCl8A5RifxvNd7di+Re6rpzL7mPup5cdN7Ot07y+nQoEM3W4+1Y8k7q4p9c5hhsOsA+jTCCcUOQp1OxWK2GJkScXqxZ4kLdj8jTrvO3AN9cicS+SEnv7uD3YMS1v/Ys6nTzGf5mjQJYvX3E9kykRDHdx/pMCEeexd59QIbLbpOt9Ey70jcIJIZtUrDpRmh1b/bzpkXMgnD2iGAzI4J7pAQ6udu7IqlzZ5TUNTZXJ6Ux/kY/axBJIQX8xqUnCWKUY9L4Oo34vNwgpp0ZRcNFRc2aTvx4M+8Mazq7n0tFj9Ki7n4Q6mMT3XDjMv3tWSQkUuoJUlqnm6tR7R74/gihfVFdMQQMJouiKCXj4u6pODWSDB7Ao7yH7B3fXin5W23BJqbUFbumFOrR/vg+cHmfHgPsPkvFEY2On1cwgkkNppMXV+T4t5HIcO/ed/kxL0qPEIuTacT2YU3eSf1kglMszUllJR2nXc5FjpNn1Iv2okhuzDgnRGAIIvrZRBq8qpqjYQcPg3hn/VMe++07rWklr76bCfsfoIZplWRWDLOzBgn0+Ixy2dJUGu+O7trvdvOetyC2nhse8807OZWB3PLcKSDrD8yP3g8QhQiDRLIoMFIkl4ASScCNkb0zq7rDh3SPn3beC21SUjFZR462jRiaCZgZiiBEaGVrDZngKljcvpZCitBS1+IakKvI10aMpX7FP61Ofp8SxebGxkmjwWi7H2K5USzi8nBlV41HUHrc/J49Bw9ozx8+3Ohl8Z+FUWd8/997myDIdZgNjS+fbB4c5B3ptrltzSBgsQTGWeO5IJjW9ZXX+2mL0feN2Yubnw4eGaE1mmTrRNCFN3TLLCuJNdBxd1/nHcDaGrTKor+5ruMXDgMFwzQdnouMib2uO4eUyjgbm6A/d2T/fhrr4MGzh7XaPgdDNRGKCDDCOmFhkQMQWZZqp80V8gpAB5BXCBsErm0YdT0aZioGg7BGojGpFKqlfsMOnjuyv065KiUur1oVN+wzO3F4L1D0k+uGzfv3R3m0EpQPQuYRb5rfSd8bdWuRRXx2luBrFz+vic4JLzaM8qd+V4lpkf1tAH6MRv3FDfY21EHqXIKNk5mEtWjqB7ccLB24y5YKyNne0CvBDjKXcnxCckz1/pL+iYefGWe+ZbMO9Up1YEqjOTg1smScF34Z7O8vChHMG5dgFv9pfx+4Dgxe//ZfLSouaSuQtPW/zdofY/uAmL5n0j4gou9FP4tga9/xECjX+83LUmOQXaEWKNK+3ghGvjTaOWs+9X4PwL//P/Yan1JN2NpSmOgCYa01jLQOm4tPveXy0hlbi1I/gQsj0Rvp6RjxiekYafyST4cXQotGXPoCuAjYRI0m9tly4rEIVjBhF4L2KACWWlo7qB6oHSqtECidI7c+NLwiKU6zUKxTVGUBp1DZeAu2uaLmXEpOTrWgqqAgbb12c2XP0MqQWr0yNJR30jlSoKworR0aUNcOlqYOvzI8rFEXcgqU1FMsFOs0tdMIm1cNo4cFJB7rF8y5rInS4akt6iER/2mKDtuk86S/yFXEryW23Ho6stHHo0BVMGAYiFRFehbkytP5I5wAye1Ltih5hyIzWuzjqMMcTkpOjRH4J+STAvDYc0Is4ZO46ow3YXV3EQ3Epk3HtnItHM/baUpPTyBRWVhsFwrVhc09dAUCee657PkrBPIUsjyJfqNAM9JS87OUBhGaiMR9heEaHho+kANjVAbV5RhngzN1aL9cV8qzvKJsEhvZfBBqoLH3OP18/oFB+G3F4eDAGsMjwzg26OHlhXJY3skFmSKPs4ZjzkQHfkHnbfaxT3OYvEZiyi9ZTI7SHLY4wcrG/ZLny49+DFsdVqmedUP0riG7v1pQlZNbJajOpZrBSA6ltb6MbzX8xOLJR6E0eWtZFcyBbS9b06xqQSZfTapFF1U25S003QGKKsW/Lf7HzieG7tu7GTYpTVz3WYLCwtFuCHWITbpXSLAof1bREtqKj0kQrwOmJQgZwd13V6hdCiwoMCB7MqEhf8lJVXUVW4Xk1zdG2XgnZYhjrCNVUvKm6c18vX3cr3lMPsF9nVOuGJweZYVblRt08aoTipqAA6S482edHsXxrKS8y3E943nnzzkRZn/OXQPy1ozXIEdf/yobAnB/v1j/gGzPaKgplbg0xkc5hN91epSXYZWWcVH/Gef6f1GZS4xh91R/ikh/6nuO7ttnJ27Zetpnq18/JS41Ny3MZLNJcWn5/wFSLJtaubBotbiNt60u0HxN9CQIQtmtb2CB6SKhID0xLNpvzzbaLiGTw5T+8jY5LIy/5IPYRaH5kd0PWjmWzbaNKzX6Jl+RnM3mSXVAtyhJbJ44XjGS3esnTuZ76KRFRWmYPEREqwCRh0H9QaK8R+6AskFFm68ibEqVsFi1aHp57Ddx46wiJWsqa+T0SNwMJ6bYiCi/KH9lYVVo1iBxI1V0tZUHhpR2iuRTy+1lOlKDn18RjV7EwhdZuK54eHe92H33tn6mqfKgFeFfOoMN8oRX46DYkAqmOCOoZrldNTep2X9pXLtAa0MzGK4MJpLBwDIaPxl6TIf8N9R1lrl1kXuDUxGz+mZGaArIWVkBKrihguyVQrV6sTBbwAmtAFZWOGBIShMjitwPEPBYEkmOJ7ApeI9IAsGLTA6zS4jBG3p5N7Zdpdsw+lX589xxtCzhaILhwUlh/kvu+l/89S0v1y+vU780PDBA94wE00entk154S+sfl51lvoZ3zgFG3oAEU4MAQOZGMQYvKi1A5GHIQXTo2aTzwe0DgRVrTbv2r+vMi1ApOwGtPwYJjc8eYJdGNjIoFf5u09UhWlIgIK3MFscMTep1hhaFYUyN+dIpT8QY6aE+cCNFJbexF2TIWlxBBFMgJox7O2kk4nQtaFHd1BKPfgV7UMTHJCLT3Az/wgpNUMprY/ALM6J2IhxihK40af2ScjtCxaSMLNZZWXXLZU5sbIyENG6ZDuLWdlup1XIpN1Ual5kGQwP8zeR7rRNQPKkVKfx7nXYUlndOPW8XUeba7OyMtiGZtm085d/8aaoAAoRUwK3mJ5TmqlSNkC6aJIedIoGQpXStF3JDTlv5LGEDbDF5q7juKWip5Q1jclYLm+GnHaolFK0aWuiGSYeqK5KDNbp+Jw7Bc1xQ5CbyXTa8Bw2nDURBzyuy6bs535x3+NegZblgchoOVkIDbukudtzbZihAkC2XcSsNoHj2MSXPNxjhk3XPK415M4aSJ/+ghOG0jz5BUmGNGxODVI3RntbtObnXCbQW2NyV2N5aR0b2OjT6UBnpbN8z4Q2M/sR6roqcTlE2MRVqIXXMv3aNrlAZ+4owVKwKsfC5CHTdyEu3Fof4RfaYLZh4ydygoIfhCmJpbTjSYgkGbZPqLOx1PbslAqO43kVmd4XCWePICnyeSx30D1J9MTy+IL5oqZ0uKnH0AnHRzS4Z2Vpqts2SftIwhgpz9hz40SSH0RvklkiC9JlE7lZn8VZmKNUZiKtyN3odDN2GItMj97CgnHIm0JGKxcEhY1007Lges2zkkoy94daAOkelSgrShDdsCFmFpgHQBN8stp11BODAdqeUvQqm3at5EIxNbJiVUjhkT7BZ1Th1dtE5GYp561RTKCmSdqQpTBZ18GFqModlin+XlBKN1F0kXeHTxnZbxPDSgU4uqrSadbhkINd7kdRSfMs9AeqXSVaUmzOGEQzNc6TBvelkV9owcy2Cld2vfmWElaHCjrabRfW6/VWeytHjhvlq6LhfFazm2NrRz+VrQmXqHcdXjC2CO3jJREZvJbXx2bADGOgGmk2TXbLZddbgKUkuW8SIKiK4FtwuwmLLnTpzu8X5dIfnPnLvnjzYlEhyT4hgSXerJRzNKGIrRFIfo77ho9TVCY8FUxTlpDYKVYC1Ks7iTCARRZ23awOy2VGWGQNIX8QQlM3581Rht8oTVxSfwTutY+BmsX7HfC4XFYHwjozy74v0qYq+fD8Vb48bQiP76wKha1Ob3DvvNXkVlXV3qbtAPaKXZR8E984BSv2Kp5XtPHJ1arXW51enTx6qLfsLSajbqdRGw0mWmzaFS8/RIlJRSyNPGwiUUuZRMugrTWq4gpLOWb9EdNmF2EBUaLkdNHCbIlexN9bQ0faEeRoeQ52Xh163c5MwdYXyhSFOrU33C9VN7RUJnvsZxNYqbw7AVH4LmaW7Cn1R9QymrsmksAnEGZhUWw8GMXb3WF7T/M4r+dsbSSfPeiB1xsPc1fPeLFCGM4BKRr3o0lY86LhLDDf0Q7qK4GnvHWJurM4Z+WoHSUrEWXEECWHsJQhC0QTg1YwaUUxJPUtb5LneregvmbIkn/8hbn56P0IVUpkmUxGDYCdzezsULQpHq/HX9idczNbXRit6HZ3AawxzciytF+jFw82lQAwskVAN8bHlzQ1psIWeiGLdZ3NWca4sYkLtrR1+ho/XH840TFHe16du8pIlmeIMK7NginlE0FMIltEkAB9nxD1TRt35EJhb5GxeLYYtQpCIHHhbc4v0PGNRj9LAXjd+vBntGLBp69POgac3v4Z0D/lfqqoSdFcayM52Mw5sHNfXSwMehw4tf7VfGwEY2ZcZ7dxEV2mdejMH7aNLzhjZ8AN84lmKXyd9bW0pMjC7pgpM0w94S47Cw0nMfSoJI8rkVOkHNODuRu4PjkcnJJfo4UDZwzmowIv+M3c49l3mSGG9VUksUjywN8i5+tgOyZfbLSs9uis/B1gdJRKcbX8dPperKyl+lHBJuorLoGFu30ChBFvx6V9rhKLuRoUOT6hoZTBHpr5FHUzmUtcLcIpltEauMNOHRXdUhQx3baaskmnscuATORZpZwsv52VzbAc7VbR8q9PuAs2ZdQE0+lVrB+ly8U8rLF6UOJuNSytSVbsMN4853nH3KmHPMm+cluVmP12+LE8Do2wjqtyXuX4umq/3ZQWOwu968HWQZ401D/30cFmlCv521rj/xJYVSkdMVhzOHej1FaSDIuc26z7O+kJK3ztzUV893wkDsztp0Tf8YAtnlefUBk/F01SImQW/JFI8ywynrdxfuqZAiSeneE+6NEus6kgt0638ByXZf0MkFM1S1VlAShuKRtl6c/OVVy557hRISr6alkfgADpR1fu/rNvnHX7N1Xxy4A/XTzfCMA/9+TB//H/m/Eb/wNAwQAQ/Iu8If9WFKwsPft7/R+w/8FnmIk4xCuUof2N/2qM98A9x+l7XMVQP69cYqnBCKNSBM8HTw2ujtNzfllqeTAvzJe/4FnC1UFRUt9DbjnDoUs9yn2TK+Id75fdTvAIvlG/Hze9znbLU8jno2H4JYDR4+yMRV5D/oqxh3UMsYK1QKs50qPy+FU47A4tcUslj/xTRgh4gFcpXItjnHI7PwHwa/0hjoDCS7dXiBbwR8DtKLHKH0cZXf4zyrmT/44KTrU/KrGqx3Y8cyztL02CVKrSrEaxQkXqILEw+eIhl08wn0tkPJfTxRpUjtOBymQzLyUeL0lXKpHP8TqMUq9uWKUatYIoXPW8apgvxMBQqBiYrpeDTk2Vyqc8ruEVAp7jutaikWvW8nzyK1F4c2NJ6nHpB82F6vm/dzV80TExcflTiJIolr/466EJKZmEYghHKV97FZVKFVH5V49M2xy9y/28nWFZfNTDFWkoyHQ08xf6h+FCt4BVr8Pg1w71ofmPza0cN8T6foI1zErXgm17nTTPts7GWRyKBwcbwDdaXd7zgkuk3ZE3Ebs3GUxYOetW7oKpup0nV8NYHov1uVpaNX6IPfn1uY8YOWAq77E8S0cHAA==)}@font-face{font-family:JfCond;font-style:normal;font-weight:400;font-display:swap;src:url(data:font/woff2;base64,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)}@font-face{font-family:JfSerif;font-style:normal;font-weight:400;font-display:swap;src:url(data:font/woff2;base64,d09GMgABAAAAAA3wAA8AAAAAGWwAAA2cAAEAQgAAAAAAAAAAAAAAAAAAAAAAAAAAGhYbEBwgBmAARBEICqZwnioBNgIkA4FcC3AABCAFhBoHIAwHG7ITUZRsVpHkx0FOFm9CsK1S6RQOFPpyudE8nPg+QpJZiPqx3959wyypJrHKEEUsm0eNDI3QXR7mlWZS8UT6w/PnekFbfP9vQUur3cTyH/PA8gJ1oDqwg9UJ6jKX7vqSwm4ZwGcfBNiZ3rP0lZqflD4RQfAs0P+/X6v+D55MmnippEopcNE794+9N/ZRkcrhdCKEODOI6prVDXHjhrpnQwriug1vWRBkL/4Qb/PLaMtuckSPS/UjAgJ4iMiKZMo4yuDm2XopmVUJxg/L8FkPOLeaG6oAoL2hnLGYgg3oro4DMP5cTR5ACr+Nc5vFBzxNFi4rlpWRSCAOMm3WwP/3AGSwCIL5yb3lPl04+sQaAzLJ2s2aJHRZIF4pjnTanEMAiAXDrOYcujN0ZGifR1kQhFqTlPkktC9CDsCeB4DjF0g+U8KTUqcjydVOexR1ng0RWG+0PgxJGTUO17yNFcTh+jjj+/iQfRy9fV29UaI9xAUQyTgm6uHi5UOAYTjH9gGOENqTohx97XGd7L1xDF/EwbGjE+rFI05vJRBWai8j0+hQ+thJry0M6U6stDN9TMhA18IHpukaKd/1EeszeOA2RTp+GLlZu4X9/l7Y9L1rKCmfu7du4qOrjihkiFst51KGFha5DJe3NExga9UWyMVUG7D2iNJRTonP1n5KBRWAGGQdc0g7dyqvTg1+Uat3dcbrybmNIrRQii21rd9Wi+4SlbeWYUR2Tf3ZUtt9zYo5bBXpDYTA3Ceo1pcQCVsCWdJZckwUmKJ8zjkFJWttdcoKiAdbk2SJVwDKZ/pBqxniDOtrmOLzzsVl5bqsztRcBzudox681W5yCZWREiU/q3RrEW2gsdqU0UsmKEdtmbRSXT9/vscSQAx2vcLa/3ANfrvdZhpgkElc3XKqzcuzJjCSCy++2DPjMx5ojHLRwbOkZhAPLkbnqs2rE3OIsquhD4QJwVpALNSX+odc+6xc0V/NuTJ9pepdI93MGfYVZYGp+0KjTK1tb7y586DrhlbWnFQXnIGt3QpQEwpWlAkp/m21x4wBZdboSLElq87PAalYVjRT9KxK4+lzma3CBXXKoMfzOaakb+WlpiwneUIKmjdOJr0Z6usiFeJgMeO2hjotuuLnivekULLO3Apexx2NIRXt5xR6u0dfE4ukgP9OGUAcxqIkF3jWyaa+7dWnCSkBCINZ/QdeW/GfXImai/vqIcru+Pnm4noIQFk6wgn8KsZikVPEYHV42KLvQPOZKMdI0VV1GVqeNBjUClTUaD6GLdwoDN9HCoZ8B0PKm7RLcHTFKOOlu5PK9vItxZTybbXTNk2dh9qCfiDuq7shiA0DB5xllXNwCFDCrp48SMpA99B+fxor/yA+hxyKlO8hXH5aFM65oD2e6tEv67VEjgZA6yrgoLNxwBjKuUXMk2fwOu2XdZq17JkBGr2IESSk6gZlXRa0Xk3HuT2t93wzCg7BVc85AhtrvNut66Mf0DgKWjpnU7FYpc3tz/13cOLtbMhw7Ib+Ih6rp/1560QLvLWsUQ7as8hN+6hatPSE3tW9Nb5O6j4Mzd1xYhV3HHwz9INjzbKdwkcYm5HH0AdyLuhn/QerrjW1O5CI5cURkznVDwTTMAktptlSWhwlZaZ0sFI0ektxPxqSMZQmGfMNYHP2DI1a4yk9gcwg8WyB+f/uwIE/YvOyxvHkSQbcgmqzRKHWQaNy/4jcE3mK6LIlwqi4KsUdZ7lFohLdiMotslwTB6hGScXsNWZMwde9D1bFu+iCUPWnsmj1A41wUpb5w7EUvfvS7CImJmHMTIlqMoLUZx+Hes/AEPdxoTvAAIy/cSL5RhIyF2H+36j5s5GBKJDcL1k220ENdfy4xLSx/V6WJz1mVi43zCMj2CzMSq5kCqlJiXwxH5MR5Twv3iSMmRjBBZO3zKcqJ6mXqKoyBqHtfXz6HKTTD1u+ZcC85+Ci6AY/dE463u4mpBVkl4HTpRfqVWWJe70R8Swxwj90cMEAnlxomLQ64pGePjLJA6DG3uE4pBRkJKYF8QOZsfKzLmFubokX+R4YObOn0l2P2t0KIUZOiQSvchEGl+em5PrI6KxY2b6rpUviZDad3UFskzvKSAf2cuqROCKJGOrl4hHgPC6KHZpD2zlYuXlV0XOpylmJcwBqREiE4KQgEglHImc9VZOflEcgIkZL4GHYiHCWEJlmgoG9Mjr4ptGtbW3q7GgR9aN2bOSG0Eney4hhVaU/kxSOGFXrGa5EBpCodQc/DAoQDGH2x/RGW1kXNSXEsinB+oJibjkBvoJhpwcZvKPGtdYzRzsHRlk3GDSGbcZ5hIL8qTUTDKPYdmw2avPtjXyB4Csvcae/IFkRNbATr0irjW+DRYMPMSVjBHlu/zbjpmPS/j2mlfuBs4mdPd1Q05HG0A6bbe/YifTWd13rZkIUXZ3J0g+ThIOwkgGVL5X1Cm9Pu5HN3posItlWqbbAUmTjk6SI+JS7s8/NB81htqM9xy+fbXHdDCia+UoMkbn49iKMvgovzfe12ni9rZUKF5tg5POWB8eNsMDpSvulyWUJoqMZch4pXCBT+irFEUDqxknmV2rC5wyT+r+6WpnW1V3Fr/PzWY63Pe3KNJSUtEtEOSpOo39SATmvf0BcMaqvKnyar73zeWeHd25Uw5he0G4cfvtTR0hy4xynlRMqCfppTnGyAkoP4vAb58EYc7+xsOQYhkxDhPs7Klvdp9VP3CJEIhHsGpjftuFLas8I/LhF93/L+6sAq05r/CMPhCMCJHLGzeabhcgpRLxzS9r0o71HjX+2MBEZIgf7DIh4ht0iRxlyEZFsDLlUJUDVqHTUp1mfStDzqHi10+NREWBC3URRoetxV/GslKRoZH3bRWtyma5xrhhgGGLopMD0MXW+pRD/BSRxGiUtIyW8BTrfBf+vfVNy0Dg/eCRA5dkQ6UU2aNsvN6erKs7yfANtih5aGcMxcYtbwnEuZ0arooaXvHGD/zJ6ll1Mhito6kHkEXRF7B4qFXM3VvHaH2aH6DP3/uouai7mVc8oewqFZ4QQBNzQQnKqeflUfZNMOc0N6kMEGQ3tHZ8m9HalZUlLLip/USAWkO/KAtcKCdLI5dzbVG+xzX+NMRdwsgBliSG7vf3XCdOm0Gj4+y4bgskOPWPvpnTWPLF/4hWax86PaQhqh1CRp8yP9S9mq4eFb0wBoj9yS+ySEXDErjZYDoW7ImCE9ZS2Gb36BLHpTvIorpGMSMA8l00NflSxlzmJs7jSmB06e69PXNGT5aYxRVN/lEckE/Z0eBl6UrXhBlqyWS3jK9Hv9aTmpPKMCuxmOlG0OfGElMXFXVsqkFQzUxPYqSxmHXD4+FT1DxNK5q+ii6A3pMiiPhNILG0USoU+iLwGUBx+XGVVEGNEzkq/nRFBChTuigS/74zqr1nXo03GTDGpZTwj+XdhNEFaYYnBIqnK/QC1H6PmRfATBvSHwjOR8Nuzbw/3ZMPjUN5UsF4TDIHNx7e7M+GMZYe7T5mkwkfu5YHlNdOj2ZQAg2TJ5/Q4X2pKlFcwtKD5+9B0kWgSIei3SwjwvQsfpB4h+VRvRk1k4urMCZmplWcrV5FC903ek93d/WFMz8/Wprah/50iLTF2ZyNW6bygJJvy+Th/i5qLWT9eWvX61UHhSj4E14q7T6F/ENFUWVzWhslavwJacyUbqiEwHoQIc8SOCigK5GODn3KPJAiy+81bM9Z9De4DDqsengajTFyE+UwsPCtxu5e/ICdTxRaEovem4ed6cHrLmZc8XS41e2wbrZK47lpauCbfYIxZsNOOKAWRE5FCKOzdTR/og31qJjXqbL6FnVShWmnEgPYdF//jdQwet/vZGGXD7RRyGPDlGSE4A6kwtjmpPEkCR0Pa9NN1u06DxitoCSlpKpNK9tF4WPPpsQZOFmfUwS+SDpkwKkOreOVRCqpiG5fFw5mQ17tz2RAPpkJF5dbarWK4EIq7Ts7+EAE1UA6sr2AgFFQk1SdJ4ETI2eNFylInNkn4ur3BWpmLLqhpP4ESq/LRZJnWnga3d+DbnU66HKNXnrPLuX6Xjzv4wlTMr9zJ8SAAyAKAt/O7vLZ4DgQQsidPDVJyXKK+2eOtXgLgunPMrudFhpL+37Mutw4E4L84aCn5P5/UBzgNbYJj18tpMjkFsGQAjD2Aozuw1ekQdAsU/bJjzS2q8KolvDMj+cBTbUCg3k8BOkCwxOOihG+RlDbgMhPPVTUBrq4jOIUn6AZsLT+q6Mmh39pL5gsAS0MAqskAJ09wTNbmrYG3dAM7xQ191xKvaTSwFeFQmWVFrhoFbC0tAEfFjuoPoC7oaeUD+nq2ECDjsNEsYK0oAJZsYKdaADQAWKo9iMYCyMSIHeVYo4Ag5SUl/B3UYCVbHcBLDyBDhECxDlG8xC/EQonQBlthaCP7rq87duJlDhKqqaGVOkoppoQGSISRDwUSHFiwYUODBHXT0RpQiI5qsRBLhOo0qPmaxqABhnTVzVFmkG+mVEKxl9JMqVAmoQGoHoRNGxaYKEepKpKSVMxUQmqSCAQjL06s0Ehyp6uiYAX6aK5YVIX83ovBt1xMY5+Zmbr8ZhoByc5wpPXgCNTIYAPr/0JGSDKR4cI60WZ3q8jo3IpLVM7tcKi+ZTE0csl6Ig==)}@font-face{font-family:JfMarker;font-style:normal;font-weight:400;font-display:swap;src:url(data:font/woff2;base64,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)}@font-face{font-family:JfScript;font-style:normal;font-weight:400;font-display:swap;src:url(data:font/woff2;base64,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)}"

const CSS =
  FONTS +
  ".jf-root{--ink:#111111;--ink2:#1b1b1b;--paper:#ebe9e5;--paper-ink:#141414;--paper-mute:#5b5853;--cream:#f2efe9;--pink:#e2789a;--tape:rgba(118,118,118,.82);position:relative;width:100%;overflow:hidden;background:var(--ink);color:var(--cream);font-family:JfSans,ui-sans-serif,system-ui,sans-serif;font-size:15px;line-height:1.55;-webkit-font-smoothing:antialiased}" +
  ".jf-root *{box-sizing:border-box}" +
  ".jf-root img{max-width:none;display:block;user-select:none}" +
  ".jf-root a{color:inherit;text-decoration:none}" +
  ".jf-root h1,.jf-root h2,.jf-root h3,.jf-root h4,.jf-root p,.jf-root ul,.jf-root figure{margin:0;padding:0}" +
  ".jf-root ul{list-style:none}" +
  ".jf-ink{position:relative;background:var(--ink);color:var(--cream);padding:clamp(56px,7vw,110px) clamp(18px,5vw,80px)}" +
  ".jf-paper{position:relative;z-index:2;background:var(--paper);color:var(--paper-ink);padding:clamp(64px,7vw,110px) clamp(18px,5vw,80px)}" +
  ".jf-edge{position:absolute;left:0;right:0;height:26px;pointer-events:none}" +
  ".jf-edge-top{top:-22px}.jf-edge-bottom{bottom:-22px}" +
  ".jf-edge>div{position:absolute;inset:0}" +
  ".jf-edge-fibre{background:#fbfaf8}.jf-edge-face{background:var(--paper)}" +
  ".jf-edge-top .jf-edge-face{top:5px}.jf-edge-bottom .jf-edge-face{bottom:5px}" +
  ".jf-ransom{display:inline-flex;align-items:flex-end;flex-wrap:nowrap;gap:.05em;line-height:1}" +
  ".jf-rl{display:inline-block;line-height:.86;padding:.04em .03em}" +
  ".jf-sp{display:inline-block;width:.32em}" +
  ".jf-k-a{font-family:JfBlack}" +
  ".jf-k-low{font-family:JfBlack;text-transform:lowercase;font-size:.9em}" +
  ".jf-k-box{font-family:JfBlack;background:var(--cream);color:var(--ink);padding:.06em .08em .02em;margin:0 .03em}" +
  ".jf-k-serif{font-family:JfSerif;font-size:1.08em}" +
  ".jf-k-cond{font-family:JfCond;text-transform:uppercase;line-height:.84}" +
  ".jf-paper .jf-k-box{background:var(--paper-ink);color:var(--paper)}" +
  /* hero */
  ".jf-hero{padding-top:clamp(40px,6vw,90px);padding-bottom:clamp(90px,10vw,150px);display:flex;flex-direction:column;align-items:center;justify-content:center}" +
  ".jf-title{position:relative;align-self:flex-start;margin-left:clamp(0px,11vw,190px);padding:clamp(28px,3vw,48px) 0 clamp(18px,2vw,30px)}" +
  ".jf-owner{position:absolute;left:clamp(14px,2.4vw,36px);top:0;font-family:JfMarker;font-size:clamp(18px,2.3vw,34px);color:var(--cream);letter-spacing:.04em;text-transform:uppercase;display:flex;align-items:center;gap:.25em;transform:rotate(-3deg)}" +
  ".jf-doodle{width:1.5em;height:1.5em;fill:none;stroke:var(--pink);stroke-width:3;stroke-linejoin:round;transform:rotate(-14deg)}" +
  ".jf-h1{font-size:clamp(56px,9.6vw,158px);color:var(--cream);font-weight:400;position:relative;z-index:1}" +
  ".jf-ring{position:absolute;left:-4%;right:-6%;top:26%;bottom:4%;border:2px solid var(--pink);border-radius:50%;transform:rotate(-7deg);opacity:.9;pointer-events:none}" +
  ".jf-year{position:absolute;right:2%;bottom:-.2em;font-family:JfMarker;font-size:clamp(12px,1.2vw,18px);color:var(--cream);transform:rotate(-6deg)}" +
  ".jf-case{position:relative;width:min(84vw,1120px);margin-top:clamp(8px,2vw,30px)}" +
  ".jf-cd{width:100%;height:auto;mix-blend-mode:lighten}" +
  ".jf-st{position:absolute;filter:drop-shadow(0 6px 10px rgba(0,0,0,.45))}" +
  ".jf-st-lips{width:21%;height:auto;right:4%;top:6%;transform:rotate(-8deg)}" +
  ".jf-st-smile{width:10%;height:auto;right:4%;top:20%;transform:rotate(10deg)}" +
  ".jf-st-star{width:12%;height:auto;left:-3%;bottom:13%;transform:rotate(-12deg)}" +
  ".jf-st-heart{width:12%;right:36%;bottom:19%;transform:rotate(-6deg);display:block}" +
  ".jf-st-heart img{width:100%;height:auto}" +
  ".jf-st-heart b{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-family:JfMarker;font-weight:400;font-size:clamp(11px,1.5vw,22px);color:#fff;transform:rotate(-8deg);text-shadow:0 1px 0 rgba(90,40,120,.5)}" +
  ".jf-lbl-green{right:9%;bottom:24%;background:#b6f03c;color:#18240a;font-size:clamp(11px,1.6vw,24px);padding:.15em .6em;transform:rotate(-4deg);font-weight:500}" +
  ".jf-lbl-orange{right:39%;bottom:5%;background:#f2a223;color:#3c1f00;font-family:JfBlack;text-transform:uppercase;font-size:clamp(9px,1.2vw,17px);line-height:1;padding:.5em .7em .5em 1.3em;transform:rotate(-9deg);text-align:center;clip-path:polygon(14% 0,100% 0,100% 100%,14% 100%,0 50%)}" +
  ".jf-lbl-bubble{right:7%;bottom:3%;font-family:JfBlack;text-transform:uppercase;font-size:clamp(16px,2.7vw,40px);line-height:.92;color:#ff7a1f;-webkit-text-stroke:.06em #3a1300;paint-order:stroke fill;text-shadow:0 .08em 0 #fff,0 -.04em 0 #fff,.06em 0 0 #fff,-.06em 0 0 #fff;transform:rotate(-5deg)}" +
  ".jf-about-tab{position:absolute;right:clamp(10px,5vw,80px);bottom:clamp(-30px,-1.6vw,-14px);z-index:3;background:var(--pink);color:#fff;font-family:JfMarker;font-size:clamp(16px,2.4vw,36px);letter-spacing:.06em;text-transform:uppercase;padding:.35em 1.6em .3em 1.1em;transform:rotate(-4deg);transition:transform .35s cubic-bezier(.2,.8,.2,1)}" +
  ".jf-about-tab:hover{transform:rotate(-2deg) translateY(-3px)}" +
  ".jf-ready .jf-h1 .jf-rl{animation:jf-drop .7s cubic-bezier(.2,.9,.25,1.15) both;animation-delay:calc(var(--i) * 55ms)}" +
  ".jf-ready .jf-case .jf-st{animation:jf-slap .55s cubic-bezier(.2,.9,.25,1.2) both}" +
  ".jf-ready .jf-st-lips{animation-delay:.55s!important}.jf-ready .jf-st-smile{animation-delay:.65s!important}.jf-ready .jf-st-star{animation-delay:.75s!important}.jf-ready .jf-st-heart{animation-delay:.85s!important}.jf-ready .jf-lbl-green{animation-delay:.9s!important}.jf-ready .jf-lbl-orange{animation-delay:.95s!important}.jf-ready .jf-lbl-bubble{animation-delay:1s!important}" +
  "@keyframes jf-drop{from{opacity:0;translate:0 -.35em}to{opacity:1;translate:0 0}}" +
  "@keyframes jf-slap{from{opacity:0;scale:1.35}to{opacity:1;scale:1}}" +
  ".jf-case .jf-st{transition:scale .3s ease}.jf-case .jf-st:hover{scale:1.08}" +
  /* about */
  ".jf-about{padding-top:clamp(56px,6vw,90px);padding-bottom:clamp(60px,6vw,96px)}" +
  ".jf-sheet{display:grid;grid-template-columns:1.1fr 1fr;gap:clamp(24px,6vw,110px);max-width:1240px;margin:0 auto;font-size:clamp(13px,1.3vw,19px);color:var(--paper-mute)}" +
  ".jf-sheet b{color:var(--paper-ink);font-weight:600}" +
  ".jf-sheet p{margin-bottom:1em}.jf-sheet li{line-height:1.7}" +
  ".jf-h3{font-size:clamp(12px,1.15vw,17px);letter-spacing:.06em;text-transform:uppercase;color:var(--pink);font-weight:600;margin:1.4em 0 .5em}" +
  ".jf-sheet>div>.jf-h3:first-child{margin-top:0}" +
  ".jf-skills{display:flex;gap:10px}" +
  ".jf-skills span{width:clamp(32px,3.4vw,50px);height:clamp(32px,3.4vw,50px);border-radius:8px;background:#1d1d1d;color:#fff;display:grid;place-items:center;font-weight:600;font-size:clamp(12px,1vw,15px);transition:transform .25s ease}" +
  ".jf-skills span:hover{transform:translateY(-3px) rotate(-4deg)}" +
  /* heads */
  ".jf-head{margin-bottom:clamp(22px,3vw,44px);display:flex;flex-wrap:wrap;align-items:flex-end;column-gap:clamp(10px,1.4vw,22px)}.jf-head-r{flex-direction:column;align-items:flex-end;text-align:right}" +
  ".jf-h2{display:inline-flex;align-items:flex-end;gap:.18em;font-size:clamp(36px,6vw,96px);font-weight:400;line-height:1}" +
  ".jf-h2b{font-family:JfCond;text-transform:uppercase;font-size:1.02em;letter-spacing:.005em;line-height:.86}" +
  ".jf-tools{font-size:clamp(11px,1.15vw,17px);font-weight:600;margin:0 0 .35em;opacity:.92}" +
  ".jf-head-r .jf-tools{margin-top:.3em}" +
  ".jf-note{flex-basis:100%;font-size:clamp(11px,.95vw,14px);max-width:980px;opacity:.75;margin-top:.8em}" +
  ".jf-cap{font-size:clamp(11px,.9vw,13px);color:var(--paper-mute);max-width:760px;margin:clamp(14px,1.6vw,22px) 0 0}" +
  ".jf-ink .jf-cap{color:rgba(242,239,233,.68)}.jf-cap-c{margin-left:auto;margin-right:auto;text-align:center}" +
  ".jf-mini{display:block;font-size:10px;letter-spacing:.08em;text-transform:uppercase;font-weight:600;opacity:.8;margin:0 0 8px}" +
  ".jf-tape{display:inline-block;position:relative;z-index:3;background:var(--tape);color:#fff;font-weight:600;font-size:clamp(10px,.9vw,13px);padding:.55em 1.6em;letter-spacing:.02em;box-shadow:0 1px 0 rgba(255,255,255,.2) inset;backdrop-filter:blur(1px)}" +
  /* posters */
  ".jf-posters{padding-left:0;padding-right:0}.jf-posters .jf-head{padding:0 clamp(18px,5vw,80px)}" +
  ".jf-poster-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:0}" +
  ".jf-poster-grid img{width:100%;height:auto;aspect-ratio:5/7;object-fit:cover;transition:transform .45s cubic-bezier(.2,.8,.2,1),filter .45s;position:relative}" +
  ".jf-poster-grid img:hover{transform:scale(1.06) rotate(-1.5deg);z-index:2;filter:drop-shadow(0 18px 30px rgba(0,0,0,.6))}" +
  /* pubmats */
  ".jf-pub-pair{display:flex;justify-content:center;gap:clamp(20px,4vw,60px);align-items:flex-start;margin-top:-1em}" +
  ".jf-pub-pair figure{position:relative;width:min(34vw,470px)}" +
  ".jf-pub-pair img{width:100%;height:auto;box-shadow:0 18px 40px rgba(0,0,0,.22)}" +
  ".jf-pub-a{margin-top:clamp(30px,5vw,80px)!important}" +
  ".jf-pub-a .jf-tape{position:absolute;left:-6%;top:-14px}" +
  ".jf-pub-b{transform:rotate(3deg)}" +
  ".jf-block{position:relative;margin-top:clamp(56px,7vw,110px)}" +
  ".jf-block>.jf-tape{margin-bottom:-12px;margin-left:clamp(0px,2vw,30px)}" +
  ".jf-board{display:grid;grid-template-columns:1fr 1fr .62fr;gap:clamp(8px,1.2vw,18px);background:#2a2a2a;padding:clamp(10px,1.6vw,24px);align-items:end}" +
  ".jf-board>img{width:100%;height:auto;box-shadow:0 10px 24px rgba(0,0,0,.4)}" +
  ".jf-phone{position:relative;aspect-ratio:9/19;width:100%;border-radius:clamp(18px,2.4vw,36px);background:#0d0d0d;padding:clamp(4px,.5vw,8px);box-shadow:0 24px 50px rgba(0,0,0,.35),0 0 0 1px #3a3a3a inset}" +
  ".jf-phone-screen{position:relative;width:100%;height:100%;border-radius:clamp(14px,2vw,30px);overflow:hidden;background:#fff}" +
  ".jf-notch{position:absolute;z-index:2;top:6px;left:50%;width:32%;height:clamp(10px,1.3vw,20px);border-radius:20px;background:#0d0d0d;transform:translateX(-50%)}" +
  ".jf-feed{padding:clamp(22px,3vw,40px) 6px 6px;color:#111;font-size:clamp(7px,.7vw,10px);line-height:1.3}" +
  ".jf-feed-top{display:flex;gap:6px;align-items:center;margin-bottom:8px}" +
  ".jf-feed-top i{display:block;font-style:normal;opacity:.6}" +
  ".jf-avatar{width:2.8em;height:2.8em;border-radius:50%;background:var(--pink);color:#fff;display:grid;place-items:center;font-weight:600;flex:none}" +
  ".jf-feed-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:2px}" +
  ".jf-feed-grid img{width:100%;height:auto;aspect-ratio:4/5;object-fit:cover}" +
  ".jf-cards{display:grid;grid-template-columns:repeat(4,1fr);gap:clamp(10px,1.4vw,20px);align-items:center}" +
  ".jf-cards img{width:100%;height:auto;aspect-ratio:4/5;object-fit:cover;box-shadow:0 12px 28px rgba(0,0,0,.18);transition:transform .35s ease}" +
  ".jf-cards img:hover{transform:translateY(-6px) rotate(-1deg)}" +
  ".jf-mood{display:grid;grid-template-columns:.62fr 1fr .9fr .9fr;grid-template-rows:auto auto;gap:clamp(10px,1.4vw,20px);align-items:start}" +
  ".jf-phone-b{grid-row:1/3}" +
  ".jf-mood img{width:100%;height:auto;box-shadow:0 12px 28px rgba(0,0,0,.18)}" +
  ".jf-mood-a{grid-row:1/3;transform:rotate(-2deg)}.jf-mood-b{transform:rotate(3deg)}.jf-mood-c{transform:rotate(-3deg)}" +
  ".jf-mood-sw{grid-column:3/5;display:grid;grid-template-columns:repeat(6,1fr);gap:6px}" +
  ".jf-mood-sw span{aspect-ratio:1;box-shadow:0 4px 10px rgba(0,0,0,.12)}" +
  ".jf-photos{position:relative;background:#1e1e20;color:#f2f2f2;border-radius:14px;padding:clamp(14px,1.8vw,26px);box-shadow:0 20px 50px rgba(0,0,0,.25)}" +
  ".jf-photos-tape{position:absolute!important;left:50%;top:-14px;translate:-50% 0}" +
  ".jf-photos-bar{display:flex;justify-content:space-between;align-items:center;font-size:clamp(13px,1.2vw,17px)}" +
  ".jf-dots{opacity:.5;letter-spacing:.1em}" +
  ".jf-photos-tabs{display:flex;gap:22px;font-size:clamp(10px,.85vw,12px);margin:12px 0 16px;opacity:.85}" +
  ".jf-photos-tabs .jf-on{box-shadow:0 2px 0 #3b82f6;padding-bottom:6px}" +
  ".jf-photos-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:clamp(6px,.8vw,12px)}" +
  ".jf-photos-grid img{width:100%;height:100%;aspect-ratio:1;object-fit:cover;border-radius:8px;transition:transform .3s ease}" +
  ".jf-photos-grid img:hover{transform:scale(1.03)}" +
  ".jf-photos-grid .jf-big{grid-column:span 2;grid-row:span 2}" +
  ".jf-skin{display:grid;grid-template-columns:1fr 1fr 1fr .72fr;gap:clamp(10px,1.4vw,20px);align-items:end}" +
  ".jf-skin>img{width:100%;height:auto;aspect-ratio:4/5;object-fit:cover;box-shadow:0 12px 28px rgba(0,0,0,.18)}" +
  ".jf-skin-dim{filter:saturate(.75) hue-rotate(-12deg)}" +
  ".jf-phone-c{transform:rotate(4deg) translateY(4%)}" +
  ".jf-story{width:100%;height:100%;object-fit:cover}" +
  ".jf-story-bar{position:absolute;left:8%;right:8%;bottom:4%;border:1px solid rgba(255,255,255,.7);border-radius:30px;color:#fff;font-size:clamp(7px,.7vw,10px);padding:.6em 1em}" +
  /* mall */
  ".jf-mall-pair{display:flex;justify-content:center;gap:clamp(14px,3vw,44px)}" +
  ".jf-mall-pair img{width:min(36vw,500px);height:auto;mix-blend-mode:lighten}" +
  ".jf-mall-pair img:last-child{margin-top:clamp(10px,2vw,30px)}" +
  /* magazine */
  ".jf-mag{padding-left:0;padding-right:0;padding-bottom:0}.jf-mag .jf-head{padding:0 clamp(18px,5vw,80px)}.jf-mag-col{display:flex;flex-direction:column}" +
  ".jf-mag-col img{width:100%;height:auto}" +
  ".jf-mag-col .jf-rv{translate:none;transition:opacity 1s ease}" +
  /* branding */
  ".jf-kit{position:relative;display:grid;grid-template-columns:.9fr 1.1fr;gap:clamp(18px,3vw,50px);align-items:start;margin-top:clamp(16px,2vw,30px)}" +
  ".jf-kit-flip{grid-template-columns:1.1fr .9fr}" +
  ".jf-kit-tape{position:absolute!important;right:0;top:-6px}" +
  ".jf-kit-logo{width:100%;height:auto;transform:rotate(-3deg);box-shadow:0 22px 46px rgba(0,0,0,.5)}" +
  ".jf-kit-flip .jf-kit-logo{transform:rotate(4deg)}" +
  ".jf-kit-info{display:flex;flex-direction:column;gap:clamp(14px,1.6vw,24px);font-size:clamp(11px,.95vw,14px);color:rgba(242,239,233,.78);padding-top:clamp(30px,3vw,46px)}" +
  ".jf-kit-mocks,.jf-kit-wide{grid-column:1/-1}" +
  ".jf-mock-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:clamp(6px,1vw,14px)}" +
  ".jf-mock-grid img{width:100%;height:auto;aspect-ratio:1.25;object-fit:cover;transition:transform .35s ease}" +
  ".jf-mock-grid img:hover{transform:scale(1.03)}" +
  ".jf-spec-grid{display:grid;grid-template-columns:repeat(4,1fr);grid-auto-flow:column;grid-template-rows:repeat(6,auto);gap:0 18px;font-size:clamp(10px,.95vw,14px);color:var(--cream);line-height:1.35}" +
  ".jf-swatches{display:flex;gap:6px}.jf-swatches span{flex:1;max-width:70px;aspect-ratio:.62;border:1px solid rgba(255,255,255,.12)}" +
  ".jf-retro{font-family:JfScript;font-weight:400;font-size:clamp(26px,3vw,46px);color:var(--cream);line-height:1.1}" +
  ".jf-geo{font-family:JfSans;font-weight:600;font-size:clamp(24px,2.8vw,42px);letter-spacing:.02em;color:var(--cream);line-height:1.1}" +
  ".jf-emboss{width:100%;height:clamp(120px,16vw,240px);object-fit:cover;margin-bottom:clamp(18px,2vw,30px)}" +
  ".jf-flor-grid{display:grid;grid-template-columns:1.2fr .5fr .5fr 1.2fr;grid-template-rows:repeat(2,clamp(80px,11vw,170px));gap:clamp(6px,1vw,14px)}" +
  ".jf-flor-grid img{width:100%;height:100%;object-fit:cover}" +
  ".jf-flor-sign{grid-row:1/3}.jf-flor-box{grid-column:4;grid-row:1/3}" +
  ".jf-wordcard{aspect-ratio:1.1;background:#efeae0;display:grid;place-items:center;transform:rotate(-3deg);box-shadow:0 22px 46px rgba(0,0,0,.5)}" +
  ".jf-wordcard span{font-family:JfSans;font-weight:600;font-size:clamp(40px,6vw,96px);color:#26306b;letter-spacing:-.01em}" +
  ".jf-wordcard em{font-style:normal;color:#ea6a5f}" +
  ".jf-cups{width:100%;height:auto;mix-blend-mode:lighten}" +
  ".jf-dash{border:0;border-top:2px dashed rgba(242,239,233,.28);margin:clamp(50px,6vw,90px) 0 clamp(26px,3vw,40px)}" +
  /* packaging */
  ".jf-pack{background:#dad9dc;--paper:#dad9dc}" +
  ".jf-pack-stage{position:relative}" +
  ".jf-pack-stage img{width:100%;height:auto}" +
  ".jf-hand{position:absolute;display:flex;align-items:flex-end;gap:4px;font-family:JfMarker;font-size:clamp(12px,1.3vw,20px);color:#2a2a2a}" +
  ".jf-hand svg{width:clamp(40px,5vw,80px);height:auto;fill:none;stroke:#2a2a2a;stroke-width:2;stroke-linecap:round}" +
  ".jf-hand-a{left:6%;bottom:8%}.jf-hand-b{right:4%;top:6%}" +
  /* thanks */
  ".jf-thanks{text-align:center;padding-top:clamp(70px,8vw,130px)}" +
  ".jf-ty{position:relative;display:inline-block;padding:0 1em}" +
  ".jf-ty-word{font-size:clamp(46px,7vw,112px)}" +
  ".jf-ty-word .jf-rl{color:#f2a6c0}.jf-ty-word .jf-k-box{background:#f2a6c0;color:var(--ink)}" +
  ".jf-doodle-ty{position:absolute;left:-.2em;top:-.1em;width:clamp(40px,5vw,80px);height:auto}" +
  ".jf-ring-ty{left:44%;right:-4%;top:12%;bottom:-6%}" +
  ".jf-contacts{display:grid;grid-template-columns:repeat(5,1fr);gap:clamp(12px,2vw,30px);text-align:left;max-width:1100px;margin:clamp(40px,5vw,80px) auto 0;font-size:clamp(11px,.95vw,14px)}" +
  ".jf-contacts a{display:block;word-break:break-word;border-top:1px solid rgba(242,239,233,.18);padding-top:12px;transition:color .25s}" +
  ".jf-contacts a:hover{color:#f2a6c0}" +
  ".jf-contacts span{display:block;font-size:.82em;opacity:.6;margin-bottom:2px}" +
  ".jf-fine{font-size:11px;opacity:.45;margin-top:clamp(40px,5vw,70px)}" +
  /* reveal */
  ".jf-rv{opacity:0;translate:0 28px;transition:opacity .7s ease,translate .8s cubic-bezier(.2,.8,.2,1)}" +
  ".jf-rv.jf-in{opacity:1;translate:0 0}" +
  /* small screens */
  "@media (max-width:760px){" +
  ".jf-title{margin-left:0;align-self:center}.jf-h1{font-size:11.6vw}.jf-case{width:100%}" +
  ".jf-about-tab{bottom:30px}" +
  ".jf-sheet{grid-template-columns:1fr;gap:10px}" +
  ".jf-poster-grid{grid-template-columns:repeat(2,1fr)}" +
  ".jf-head:not(.jf-head-r) .jf-tools{margin-left:0;margin-top:.4em}" +
  ".jf-h2{flex-wrap:wrap}" +
  ".jf-pub-pair figure{width:44vw}" +
  ".jf-board{grid-template-columns:1fr 1fr}.jf-board .jf-phone{display:none}" +
  ".jf-cards{grid-template-columns:repeat(2,1fr)}" +
  ".jf-mood{grid-template-columns:1fr 1fr}.jf-phone-b{display:none}.jf-mood-a{grid-row:auto}.jf-mood-sw{grid-column:1/-1}" +
  ".jf-photos-grid{grid-template-columns:repeat(2,1fr)}.jf-photos-grid .jf-big{grid-column:1/-1;grid-row:auto}" +
  ".jf-skin{grid-template-columns:1fr 1fr}.jf-skin-dim{display:none}" +
  ".jf-mall-pair img{width:44vw}" +
  ".jf-kit,.jf-kit-flip{grid-template-columns:1fr}.jf-kit-flip .jf-kit-logo{order:-1}" +
  ".jf-kit-tape{top:-30px}" +
  ".jf-spec-grid{grid-template-columns:repeat(2,1fr);grid-auto-flow:row}.jf-spec-grid span:nth-child(n+13){display:none}" +
  ".jf-mock-grid{grid-template-columns:repeat(2,1fr)}" +
  ".jf-flor-grid{grid-template-columns:1fr 1fr;grid-template-rows:auto}.jf-flor-grid span{display:none}.jf-flor-sign,.jf-flor-box{grid-row:auto;grid-column:auto;aspect-ratio:1}" +
  ".jf-contacts{grid-template-columns:1fr 1fr}" +
  "}" +
  "@media (prefers-reduced-motion:reduce){" +
  ".jf-rv{opacity:1;translate:none;transition:none}" +
  ".jf-ready .jf-h1 .jf-rl,.jf-ready .jf-case .jf-st{animation:none}" +
  ".jf-root *{transition:none!important}" +
  "}"
