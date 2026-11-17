"use client"

import * as React from "react"

/*
 * Crimson Reach: a dark, red-lit studio page for Kedhareswer.
 * Two hands reach across a red hero card. A manifesto inks in word by word, and a wide dune splits into three
 * panels that flip into journey cards and fan out. Services follow, then a giant "Featured Work" title that
 * shrinks onto a project carousel, a client wall, testimonials, a contact pair with rolling counters, and a red
 * statue card that closes the page. Every picture is an original ChatGPT image served from the component site.
 */

const ASSETS = "https://kedhar-components.pages.dev/crimson-reach-template/"

// #region motion
export const clamp = (v: number, a = 0, b = 1) => (v < a ? a : v > b ? b : v)
/** 0 → 1 as p moves from a to b */
export const seg = (p: number, a: number, b: number) => clamp((p - a) / (b - a))
export const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)
export const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
export const mix = (a: number, b: number, t: number) => a + (b - a) * t

/** how lit word i of n is (0 dim → 1 full) when the manifesto has revealed fraction r */
export const wordLevel = (i: number, n: number, r: number) => clamp(r * (n + 4) - i, 0, 1)

/** signed shortest offset of item i from the active index on a loop of n */
export const loopOffset = (i: number, active: number, n: number) => {
  let d = (((i - active) % n) + n) % n
  if (d > n / 2) d -= n
  return d
}

/** a counter's shown value when its section has come in by p (0..1) */
export const countAt = (target: number, p: number) => Math.round(target * easeOut(clamp(p)))

/**
 * The journey stage, measured from the reference: a wide dune image (A) cuts into three panels (B), each panel
 * flips on Y into a card while it resizes (C), then the three cards fan out (D). `w` is the stage width.
 * Returns each panel's centre (x, y relative to the stage centre), size, Y flip and Z tilt, plus how far the
 * image is shifted inside the panel so the dune stays continuous across the cuts.
 */
export function journeyFrame(p: number, w: number, h: number, reduced = false) {
  const phone = w < 760
  const F = phone ? w * 0.92 : Math.min(1100, w * 0.78) // the uncut image
  const H0 = phone ? Math.min(h * 0.36, F * 0.62) : Math.min(520, h * 0.6) // uncut height
  const Hs = phone ? H0 : Math.min(464, h * 0.53) // height once cut
  const g = phone ? 8 : 36
  const cw = phone ? Math.min(w * 0.46, 210) : (F - 2 * g) / 3 // the finished card
  const ch = phone ? cw * 1.41 : Hs
  const fan = phone ? w * 0.27 : cw * 0.98
  const split = reduced ? 1 : easeInOut(seg(p, 0.26, 0.4))
  const tilt = reduced ? 1 : easeInOut(seg(p, 0.6, 0.76))
  const panels = [0, 1, 2].map((i) => {
    const flip = reduced ? 1 : easeInOut(seg(p, 0.43 + i * 0.03, 0.62 + i * 0.03))
    const gap = g * split
    const pw = (F - 2 * gap) / 3
    const pwF = mix(pw, cw, flip)
    const phF = mix(mix(H0, Hs, split), ch, flip)
    const x0 = (i - 1) * (pw + gap)
    const x = mix(x0, (i - 1) * fan, flip) * (1 + 0.04 * tilt)
    const rz = [-12, 0, 8][i] * tilt
    const y = [26, 0, 12][i] * tilt * (phone ? 0.6 : 1)
    // the image inside a panel is pinned to where that third of the uncut picture sat
    return { x, y, w: pwF, h: phF, ry: 180 * flip, rz, cut: split, bgX: -(i * (F / 3) + (F / 3 - pwF) / 2) }
  })
  return { F, H0, panels, titleO: reduced ? 1 : mix(0.3, 1, seg(p, 0.2, 0.4)) }
}

/** the featured stage: a giant title shrinks to the top while the carousel rises under it */
export function featuredFrame(p: number, big: number, reduced = false) {
  const t = reduced ? 1 : easeInOut(seg(p, 0.46, 0.84))
  const c = reduced ? 1 : easeOut(seg(p, 0.6, 0.94))
  return { scale: mix(big, 1, t), lift: 1 - t, carY: 1 - c, carO: c, subO: reduced ? 1 : seg(p, 0.8, 0.94) }
}
// #endregion

type Work = { id: string; title: string; tags: string[] }
type Quote = { id: string; name: string; role: string; quote: string }

const SERVICES = [
  { id: "svc-brand", title: "Brand Strategy", items: ["Positioning & naming", "Logo & identity systems", "Brand guidelines", "Pitch decks", "Packaging", "Brand refreshes"] },
  { id: "svc-web", title: "Websites", items: ["Website design & build", "Web apps & platforms", "Redesigns", "Conversion tuning", "Search basics (SEO)", "Ongoing care"] },
  { id: "svc-product", title: "Product Design", items: ["User research", "UX audits", "MVP planning & design", "UI design & prototyping", "Design systems"] },
  { id: "svc-ai", title: "AI-Powered\nProducts", items: ["AI applications", "Agent workflows", "SaaS products", "Chat assistants", "Automations", "Smart integrations"] },
  { id: "svc-motion", title: "Motion Design", items: ["Motion graphics", "Explainer videos", "Launch films", "Interactive presentations"] },
  { id: "svc-marketing", title: "Full-stack\nMarketing", items: ["Growth strategy", "Emails & newsletters", "Copywriting", "Technical writing", "Campaigns", "Social media", "Events & podcasts"] },
]

const WORKS: Work[] = [
  { id: "work-hire", title: "Project 1: MVP design for a hiring platform", tags: ["Product Design", "Website"] },
  { id: "work-orbit", title: "Project 2: Identity for a space-tech start-up", tags: ["Brand Strategy", "Merch"] },
  { id: "work-pack", title: "Project 3: Packaging for a fragrance line", tags: ["Packaging", "Brand Identity"] },
  { id: "work-editorial", title: "Project 4: Editorial system for a travel magazine", tags: ["Editorial", "Typography"] },
  { id: "work-fintech", title: "Project 5: Mobile banking for a fintech", tags: ["Product Design", "Mobile"] },
  { id: "work-apps", title: "Project 6: A suite of companion apps", tags: ["UI Design", "Motion"] },
]

const QUOTES: Quote[] = [
  { id: "client-1", name: "Client 1", role: "Founder, Client 1", quote: "“Kedhareswer gave us a brand we’re proud to put in front of investors. Calm, quick, and always a step ahead of the brief. We’ll be working together for a long time.”" },
  { id: "client-2", name: "Client 2", role: "Head of Product, Client 2", quote: "“He took a complicated product and made it feel simple. The redesign shipped on time, and the feedback from our users has been the best we’ve ever had.”" },
  { id: "client-3", name: "Client 3", role: "Marketing Lead, Client 3", quote: "“Quality work, very responsive, and always bringing fresh ideas to the table. Our second site together is even better than the first.”" },
]

const JOURNEY = [
  { tone: "silver", title: "Going\nZero to One", body: "You’re starting something new: a venture, a product or a market, and need it shaped from the first sketch." },
  { tone: "red", title: "Scaling from\nOne to N", body: "You’ve found your fit and want the brand, product and site to keep up with the growth." },
  { tone: "dark", title: "Need Quick\nSolutions", body: "You know exactly what you need and want someone who can step in and ship it fast." },
]

const STATS = [
  { n: 6, label: "Years of Experience", body: "Years spent solving product, design and marketing problems, from first-time founders to global teams." },
  { n: 48, label: "Projects Delivered", body: "Products that perform and scale, from scrappy MVPs to full platforms, shipped with clarity and speed." },
  { n: 12, label: "Industries Touched", body: "AI, finance, fashion, gaming, education and more. Ideas cross-pollinate from one project to the next." },
]

const MANIFESTO =
  "I craft brand identities, products and digital experiences that keep pace with your ambition. So you can focus on building what matters, while I shape how the world sees it."

const LOGO_STYLES = ["cr-lg-serif", "cr-lg-caps", "cr-lg-mono", "cr-lg-bold", "cr-lg-script", "cr-lg-wide", "cr-lg-thin"]

export interface CrimsonReachTemplateProps {
  /** Height of the hero. Use a definite length, never a percentage. */
  height?: string
  email?: string
  brand?: string
  works?: Work[]
  quotes?: Quote[]
  /** where the .webp pictures live */
  assetBase?: string
  className?: string
  style?: React.CSSProperties
}

function Roll({ children }: { children: React.ReactNode }) {
  return (
    <span className="cr-roll">
      <span>{children}</span>
      <span aria-hidden="true">{children}</span>
    </span>
  )
}

function Laurel({ flip }: { flip?: boolean }) {
  return (
    <svg className="cr-laurel" viewBox="0 0 20 44" aria-hidden="true" style={flip ? { transform: "scaleX(-1)" } : undefined}>
      <path d="M15 42C6 36 3 24 7 3" fill="none" stroke="currentColor" strokeWidth="1.2" />
      {[8, 15, 22, 29, 36].map((y, k) => (
        <ellipse key={k} cx={y > 30 ? 9 + (y - 30) / 3 : 5.6 + k * 0.2} cy={y} rx="3.2" ry="1.4" fill="currentColor" transform={"rotate(-38 " + (6 + k * 0.4) + " " + y + ")"} />
      ))}
    </svg>
  )
}

function Icon({ kind }: { kind: string }) {
  const p = { fill: "none", stroke: "currentColor", strokeWidth: 1.3, strokeLinecap: "round" as const, strokeLinejoin: "round" as const }
  return (
    <svg className="cr-jicon" viewBox="0 0 24 24" aria-hidden="true">
      {kind === "silver" && <path {...p} d="M3 17l6-6 4 4 8-8M15 7h6v6" />}
      {kind === "red" && (
        <g {...p}>
          <circle cx="12" cy="6" r="3" />
          <circle cx="6" cy="17" r="3" />
          <circle cx="18" cy="17" r="3" />
        </g>
      )}
      {kind === "dark" && <path {...p} d="M12 2c.6 5 4 9.4 9 10-5 .6-8.4 5-9 10-.6-5-4-9.4-9-10 5-.6 8.4-5 9-10z" />}
    </svg>
  )
}

function Odometer({ value, digits }: { value: number; digits: number }) {
  const s = String(value).padStart(digits, "0")
  return (
    <span className="cr-odo" aria-label={s}>
      {s.split("").map((d, i) => (
        <span key={i} className="cr-odo-col" aria-hidden="true">
          <span style={{ transform: "translateY(" + -Number(d) * 10 + "%)" }}>
            {"0123456789".split("").map((k) => (
              <span key={k}>{k}</span>
            ))}
          </span>
        </span>
      ))}
    </span>
  )
}

export default function CrimsonReachTemplate({
  height = "100svh",
  email = "kedhareswer.12110626@gmail.com",
  brand = "Kedhar.",
  works = WORKS,
  quotes = QUOTES,
  assetBase = ASSETS,
  className,
  style,
}: CrimsonReachTemplateProps) {
  const rootRef = React.useRef(null as HTMLDivElement | null)
  const [work, setWork] = React.useState(0)
  const [quote, setQuote] = React.useState(0)
  const [counts, setCounts] = React.useState([0, 0, 0])
  const [clock, setClock] = React.useState("")
  const [copied, setCopied] = React.useState(false)
  const img = (id: string) => assetBase + id + ".webp"
  const words = React.useMemo(() => MANIFESTO.split(" "), [])

  // live clock in Kedhareswer's time zone
  React.useEffect(() => {
    const f = () => {
      try {
        setClock(new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" }))
      } catch {
        setClock("")
      }
    }
    f()
    const t = window.setInterval(f, 15000)
    return () => window.clearInterval(t)
  }, [])

  // testimonials autoplay
  React.useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const t = window.setInterval(() => setQuote((q) => (q + 1) % quotes.length), 6500)
    return () => window.clearInterval(t)
  }, [quotes.length])

  // the scroll choreography: one rAF per scroll, writing transforms straight to the DOM
  React.useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const $ = (s: string) => root.querySelector(s) as HTMLElement | null
    const $$ = (s: string) => Array.from(root.querySelectorAll(s)) as HTMLElement[]
    const nav = $(".cr-nav"),
      hero = $(".cr-hero"),
      hands = $$(".cr-hand"),
      manifesto = $(".cr-manifesto"),
      wordEls = $$(".cr-word"),
      journey = $(".cr-journey"),
      jtitle = $(".cr-jtitle"),
      panels = $$(".cr-panel"),
      fronts = $$(".cr-front"),
      flips = $$(".cr-flip"),
      feat = $(".cr-feat"),
      ftitle = $(".cr-ftitle"),
      fcar = $(".cr-fcar"),
      fsub = $(".cr-fsub"),
      contact = $(".cr-contact"),
      cta = $(".cr-cta"),
      ctaImg = $(".cr-cta-img"),
      ctaText = $(".cr-cta-text")
    let raf = 0
    let last = ""
    const tick = () => {
      raf = 0
      const vh = window.innerHeight
      const vw = root.clientWidth
      const rootTop = root.getBoundingClientRect().top
      // nav: full bar over the hero, a floating pill once you scroll
      if (nav && hero) {
        const pill = -rootTop > hero.offsetHeight * 0.72
        nav.classList.toggle("cr-pill", pill)
        // the bar rides on the hero card until it turns into the floating pill
        nav.style.marginTop = pill ? "0px" : Math.min(0, rootTop) + "px"
      }
      if (hero && !reduced) {
        const s = clamp(-rootTop / hero.offsetHeight)
        hands.forEach((h, i) => (h.style.translate = (i ? 1 : -1) * 40 * s + "px " + (i ? 1 : -1) * 60 * s + "px"))
      }
      if (manifesto) {
        const r = manifesto.getBoundingClientRect()
        const rev = reduced ? 1 : clamp((vh * 0.25 - r.top) / (r.height - vh * 0.6))
        wordEls.forEach((w, i) => (w.style.opacity = String(0.26 + 0.74 * wordLevel(i, wordEls.length, rev))))
      }
      if (journey) {
        const r = journey.getBoundingClientRect()
        const p = -r.top / (r.height - vh)
        const f = journeyFrame(p, vw, vh, reduced)
        if (jtitle) jtitle.style.opacity = String(f.titleO)
        f.panels.forEach((q, i) => {
          const el = panels[i]
          if (!el) return
          // uncut panels overlap by a pixel so no seam shows; inner corners round only once cut
          el.style.width = q.w + (q.cut < 0.02 ? 1 : 0) + "px"
          el.style.height = q.h + "px"
          el.style.transform = "translate(" + (q.x - q.w / 2) + "px," + (q.y - q.h / 2) + "px) rotate(" + q.rz + "deg)"
          if (flips[i]) flips[i].style.transform = "rotateY(" + q.ry + "deg)"
          if (fronts[i]) {
            fronts[i].style.backgroundSize = f.F + "px " + f.H0 + "px"
            fronts[i].style.backgroundPosition = q.bgX + "px 50%"
            const r = 10 * q.cut + "px"
            fronts[i].style.borderRadius = i === 0 ? "10px " + r + " " + r + " 10px" : i === 2 ? r + " 10px 10px " + r : r
          }
        })
      }
      if (feat && ftitle && fcar) {
        const r = feat.getBoundingClientRect()
        const p = -r.top / (r.height - vh)
        const f = featuredFrame(p, vw < 760 ? 1.7 : 3.3, reduced)
        ftitle.style.transform = "translateY(" + f.lift * (vh * 0.5 - 130) + "px) scale(" + f.scale + ")"
        fcar.style.transform = "translateY(" + f.carY * vh * 0.6 + "px)"
        fcar.style.opacity = String(f.carO)
        if (fsub) fsub.style.opacity = String(f.subO)
      }
      if (contact) {
        const r = contact.getBoundingClientRect()
        const p = reduced ? 1 : clamp((vh - r.top) / (vh * 0.9))
        const next = STATS.map((s) => countAt(s.n, p))
        const key = next.join(",") + (p > 0.35 ? "t" : "")
        if (key !== last) {
          last = key
          setCounts(next)
          contact.classList.toggle("cr-in", p > 0.35)
        }
      }
      if (cta && ctaImg && ctaText) {
        const r = cta.getBoundingClientRect()
        const p = reduced ? 1 : easeOut(clamp((vh - r.top) / (vh * 0.85)))
        cta.style.transform = "scale(" + mix(0.9, 1, p) + ")"
        cta.style.borderRadius = mix(40, 16, p) + "px"
        ctaImg.style.transform = "scale(" + mix(1.18, 1, p) + ")"
        ctaText.style.filter = "blur(" + mix(14, 0, seg(p, 0.35, 1)) + "px)"
        ctaText.style.opacity = String(mix(0, 1, seg(p, 0.3, 0.9)))
      }
    }
    const on = () => {
      if (!raf) raf = requestAnimationFrame(tick)
    }
    tick()
    window.addEventListener("scroll", on, { passive: true })
    window.addEventListener("resize", on)
    return () => {
      window.removeEventListener("scroll", on)
      window.removeEventListener("resize", on)
      cancelAnimationFrame(raf)
    }
  }, [])

  const go = (sel: string) => (e: React.MouseEvent) => {
    e.preventDefault()
    const el = rootRef.current?.querySelector(sel)
    if (el) el.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" })
  }
  const copy = () => {
    try {
      navigator.clipboard?.writeText(email)
    } catch {
      /* clipboard can be blocked; the mailto still works */
    }
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }
  const nW = works.length
  const nQ = quotes.length

  return (
    <div ref={rootRef} className={"cr-root" + (className ? " " + className : "")} style={style}>
      <style>{CSS}</style>

      <div className="cr-navwrap">
        <nav className="cr-nav" aria-label="Main">
          <a className="cr-logo" href="#" onClick={go(".cr-hero")}>
            {brand}
          </a>
          <div className="cr-links">
            <a href="#" onClick={go(".cr-services")}>
              <Roll>Services</Roll>
            </a>
            <a href="#" onClick={go(".cr-feat")}>
              <Roll>Featured Work</Roll>
            </a>
            <a href="#" onClick={go(".cr-quotes")}>
              <Roll>Reviews</Roll>
            </a>
          </div>
          <a className="cr-btn" href={"mailto:" + email}>
            <Roll>Get In Touch</Roll>
          </a>
        </nav>
      </div>

      {/* hero */}
      <section className="cr-hero" style={{ height }}>
        <div className="cr-hero-card">
          <div className="cr-hero-art">
            <img className="cr-hero-plate" src={img("hero")} alt="" width={1536} height={1024} />
            <span className="cr-hero-glow" />
            <img className="cr-hand cr-hand-top" src={img("hand-top")} alt="" width={500} height={400} />
            <img className="cr-hand cr-hand-bottom" src={img("hand-bottom")} alt="" width={516} height={444} />
          </div>
          <div className="cr-hero-copy">
            <h1>
              {"Where an idea|meets its maker".split("|").map((line, l) => (
                <span key={l} className="cr-line">
                  {line.split(" ").map((w, i) => (
                    <span key={i} className="cr-in-word" style={{ animationDelay: 0.35 + (l * 3 + i) * 0.07 + "s" }}>
                      {w}{" "}
                    </span>
                  ))}
                </span>
              ))}
            </h1>
            <p className="cr-in-word" style={{ animationDelay: "0.95s" }}>
              that&rsquo;s where I do my best work.
            </p>
          </div>
          <div className="cr-hero-foot">
            <span>{clock || " "}</span>
            <span className="cr-explore" aria-hidden="true">
              <span>Scroll to Explore</span>
              <span>Scroll to Explore</span>
            </span>
            <span>IND, IST</span>
          </div>
        </div>
      </section>

      {/* manifesto */}
      <section className="cr-manifesto cr-dots">
        <div className="cr-mstage">
          <p className="cr-mtext" aria-label={MANIFESTO}>
            {words.map((w, i) => (
              <span key={i} className="cr-word" aria-hidden="true">
                {w}{" "}
              </span>
            ))}
          </p>
          <div className="cr-trust">
            <div className="cr-badge">
              <Laurel />
              <span>
                Trusted by 20+
                <br />
                Teams
              </span>
              <Laurel flip />
            </div>
            <div className="cr-marquee">
              <div className="cr-mtrack">
                {[0, 1].map((k) => (
                  <div key={k} className="cr-mset" aria-hidden={k === 1}>
                    {[1, 2, 3, 1, 2, 3, 1, 2, 3].map((c, i) => (
                      <span key={i} className={"cr-mlogo " + LOGO_STYLES[i % LOGO_STYLES.length]}>
                        Client {c}
                      </span>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* journey */}
      <section className="cr-journey cr-dots">
        <div className="cr-jstage">
          <h2 className="cr-h2 cr-jtitle">
            <em>Where</em> are you in your journey?
          </h2>
          <div className="cr-jcards">
            {JOURNEY.map((c, i) => (
              <div key={i} className="cr-panel">
                <div className="cr-flip">
                  <div className="cr-face cr-front" style={{ backgroundImage: "url(" + img("dune") + ")" }} />
                  <div className={"cr-face cr-back cr-tone-" + c.tone}>
                    <div className="cr-back-in">
                      <Icon kind={c.tone} />
                      <h3>{c.title}</h3>
                      <p>{c.body}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* services */}
      <section className="cr-services">
        <header className="cr-head">
          <h2 className="cr-h2 cr-h2-lg">
            <em>With</em> My Services
          </h2>
          <p>I help you get more done at every stage of growth</p>
        </header>
        <div className="cr-rows">
          {SERVICES.map((s, i) => (
            <article key={s.id} className="cr-row">
              <div className="cr-row-title">
                <span>({String(i + 1).padStart(2, "0")})</span>
                <h3>{s.title}</h3>
              </div>
              <ul>
                {s.items.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
              <div className="cr-row-img">
                <img src={img(s.id)} alt={s.title.replace("\n", " ") + " sample"} loading="lazy" width={762} height={506} />
              </div>
            </article>
          ))}
        </div>
        <a className="cr-btn cr-vision" href={"mailto:" + email}>
          <Roll>Build Your Vision With Me</Roll>
        </a>
      </section>

      {/* featured work */}
      <section className="cr-feat">
        <div className="cr-fstage">
          <div className="cr-fhead">
            <h2 className="cr-ftitle">
              <em>Featured</em> Work
            </h2>
            <p className="cr-fsub">Bold ideas, turned into things people use</p>
          </div>
          <div className="cr-fcar">
            <div className="cr-ftrack">
              {works.map((w, i) => {
                const d = loopOffset(i, work, nW)
                return (
                  <article
                    key={w.id}
                    className="cr-work"
                    data-d={Math.abs(d) > 1 ? "far" : d === 0 ? "c" : "s"}
                    style={{ "--d": d } as React.CSSProperties}
                    onClick={() => d !== 0 && setWork((((work + d) % nW) + nW) % nW)}
                  >
                    <div className="cr-work-img">
                      <img src={img(w.id)} alt={w.title} loading="lazy" width={762} height={506} />
                    </div>
                    <h3>{w.title}</h3>
                    <div className="cr-tags">
                      {w.tags.map((t) => (
                        <span key={t}>{t}</span>
                      ))}
                    </div>
                  </article>
                )
              })}
              <button className="cr-arrow cr-prev" aria-label="Previous project" onClick={() => setWork((work - 1 + nW) % nW)}>
                ←
              </button>
              <button className="cr-arrow cr-next" aria-label="Next project" onClick={() => setWork((work + 1) % nW)}>
                →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* client wall */}
      <section className="cr-wall">
        <p className="cr-wall-head">
          Trusted by founders, start-ups
          <br />& global teams
        </p>
        <div className="cr-grid">
          {Array.from({ length: 21 }, (_, i) => (
            <span key={i} className={"cr-tile " + LOGO_STYLES[(i * 3) % LOGO_STYLES.length]} style={{ transitionDelay: (i % 7) * 40 + "ms" }}>
              Client {(i % 3) + 1}
            </span>
          ))}
        </div>
      </section>

      {/* testimonials */}
      <section className="cr-quotes">
        <header className="cr-head">
          <h2 className="cr-h2 cr-h2-lg">
            Hear From <em>My</em> Clients
          </h2>
          <p>Here&rsquo;s what they say after we&rsquo;ve shipped together</p>
        </header>
        <div className="cr-qstage">
          {quotes.map((q, i) => {
            const d = loopOffset(i, quote, nQ)
            return (
              <figure key={q.id} className="cr-quote" data-c={d === 0 ? "" : undefined} style={{ "--d": d } as React.CSSProperties} aria-hidden={d !== 0}>
                <img src={img(q.id)} alt={q.name} loading="lazy" width={623} height={623} />
                <div className="cr-qbody">
                  <blockquote>{q.quote}</blockquote>
                  <figcaption>
                    <strong>{q.name}</strong>
                    <span>{q.role}</span>
                  </figcaption>
                  <span className="cr-qmark">{q.name.toUpperCase()}</span>
                </div>
              </figure>
            )
          })}
          <button className="cr-arrow cr-qprev" aria-label="Previous review" onClick={() => setQuote((quote - 1 + nQ) % nQ)}>
            ←
          </button>
          <button className="cr-arrow cr-qnext" aria-label="Next review" onClick={() => setQuote((quote + 1) % nQ)}>
            →
          </button>
        </div>
        <div className="cr-dotsbar" role="tablist" aria-label="Reviews">
          {quotes.map((q, i) => (
            <button key={q.id} role="tab" aria-selected={i === quote} aria-label={"Review " + (i + 1)} onClick={() => setQuote(i)} />
          ))}
        </div>
      </section>

      {/* contact */}
      <section className="cr-contact">
        <header className="cr-head">
          <h2 className="cr-h2 cr-h2-lg">
            <em>Get</em> In Touch
          </h2>
          <p>Always up for a good coffee chat</p>
        </header>
        <div className="cr-cgrid">
          <div className="cr-people">
            <div className="cr-person">
              <span className="cr-avatar">
                <img src={img("kedhar")} alt="Kedhareswer" loading="lazy" width={623} height={623} />
              </span>
              <h3>
                Kedha
                <br />
                reswer
              </h3>
              <p>Designer &amp; Developer</p>
              <div className="cr-plinks">
                <a href={"mailto:" + email}>✉ Email</a>
                <button onClick={copy}>{copied ? "✓ Copied" : "⧉ Copy"}</button>
              </div>
            </div>
            <div className="cr-person">
              <span className="cr-avatar cr-avatar-k">K.</span>
              <h3>
                Say
                <br />
                Hello
              </h3>
              <p>Projects, collabs &amp; talks</p>
              <div className="cr-plinks">
                <a href={"mailto:" + email + "?subject=Project%20enquiry"}>✎ Brief</a>
                <a href={"mailto:" + email + "?subject=Coffee%20chat"}>☕ Chat</a>
              </div>
            </div>
          </div>
          <div className="cr-stats">
            {STATS.map((s, i) => (
              <div key={s.label} className="cr-stat">
                <span className="cr-num">
                  <Odometer value={counts[i]} digits={2} />
                </span>
                <div>
                  <h3>{s.label}</h3>
                  <p>{s.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* closing card */}
      <section className="cr-ctawrap">
        <div className="cr-cta">
          <img className="cr-cta-img" src={img("statue")} alt="" loading="lazy" width={1536} height={1024} />
          <span className="cr-cta-tint" />
          <div className="cr-cta-text">
            <p>That&rsquo;s my story</p>
            <h2>
              Let&rsquo;s <em>reimagine</em> yours
            </h2>
            <a className="cr-btn" href={"mailto:" + email}>
              <Roll>Get In Touch</Roll>
            </a>
          </div>
          <footer className="cr-foot">
            <span>&copy; 2026 Kedhareswer | All Rights Reserved.</span>
            <button onClick={copy} className="cr-mail">
              {copied ? "Copied to clipboard" : email}
            </button>
            <span className="cr-flinks">
              <a href="#" onClick={go(".cr-services")}>
                Services
              </a>
              <a href="#" onClick={go(".cr-feat")}>
                Featured Work
              </a>
              <a href="#" onClick={go(".cr-quotes")}>
                Testimonials
              </a>
            </span>
          </footer>
        </div>
      </section>
    </div>
  )
}

const SERIF = "CrSerif,'Times New Roman',serif"
const SANS = "CrSans,ui-sans-serif,system-ui,sans-serif"
const EASE = "cubic-bezier(.22,1,.36,1)"

const FONTS =
  "@font-face{font-family:CrSerif;font-style:normal;font-weight:400;font-display:swap;src:url(data:font/woff2;base64,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) format('woff2')}" +
  "@font-face{font-family:CrSerif;font-style:italic;font-weight:400;font-display:swap;src:url(data:font/woff2;base64,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) format('woff2')}" +
  "@font-face{font-family:CrSans;font-style:normal;font-weight:400 500;font-display:swap;src:url(data:font/woff2;base64,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) format('woff2')}"

const CSS =
  FONTS +
  ".cr-root{--bg:#000;--ink:#eae7e0;--mute:rgba(234,231,224,.6);--line:rgba(255,255,255,.09);--card:#141414;--red:#e3241a;--glow:0 0 12px rgba(255,255,255,.71);position:relative;width:100%;background:var(--bg);color:var(--ink);font-family:" + SANS + ";overflow-x:clip;-webkit-font-smoothing:antialiased;animation:cr-fade .9s ease-out both}" +
  ".cr-root *{box-sizing:border-box}" +
  ".cr-root img{max-width:none;display:block}" +
  ".cr-root :where(a,button){color:inherit;font:inherit;text-decoration:none;background:none;border:0;padding:0;cursor:pointer}" +
  ".cr-root :where(h1,h2,h3,p,ul,figure,blockquote){margin:0;padding:0}" +
  ".cr-root em{font-style:italic}" +
  ".cr-dots{background-image:radial-gradient(rgba(255,255,255,.075) 1px,transparent 1.2px);background-size:22px 22px}" +
  // label roll: the copy slides up and its twin follows
  ".cr-roll{display:inline-grid;overflow:hidden;line-height:1.2;vertical-align:top}" +
  ".cr-roll>span{grid-area:1/1;transition:transform .5s " + EASE + "}" +
  ".cr-roll>span+span{transform:translateY(105%)}" +
  // nav
  ".cr-navwrap{position:sticky;top:0;height:0;z-index:40}" +
  ".cr-nav{position:absolute;left:50%;top:32px;transform:translateX(-50%);width:calc(100% - 64px);height:70px;display:flex;align-items:center;justify-content:space-between;padding:0 28px 0 36px;border-radius:16px 16px 0 0;background:linear-gradient(rgba(70,0,0,.35),rgba(70,0,0,0));border:1px solid transparent;transition:width .7s " + EASE + ",height .7s " + EASE + ",top .7s " + EASE + ",background .5s,border-color .5s,border-radius .7s,box-shadow .5s,padding .7s " + EASE + "}" +
  ".cr-nav.cr-pill{top:16px;width:min(770px,calc(100% - 32px));height:52px;padding:0 10px 0 22px;border-radius:12px;background:rgba(24,24,24,.86);border-color:rgba(255,255,255,.1);box-shadow:0 10px 30px rgba(0,0,0,.45);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px)}" +
  ".cr-logo{font-family:" + SERIF + ";font-style:italic;font-size:26px;letter-spacing:-.03em;color:var(--ink)}" +
  ".cr-nav.cr-pill .cr-logo{font-size:20px}" +
  ".cr-links{position:absolute;left:50%;transform:translateX(-50%);display:flex;gap:30px;font-size:14px}" +
  ".cr-links a{opacity:.82;transition:opacity .3s}" +
  ".cr-btn{display:inline-flex;align-items:center;height:34px;padding:0 14px;border-radius:8px;background:var(--ink);color:#111;font-size:12.5px;font-weight:500;box-shadow:inset 0 -2px 0 rgba(0,0,0,.12),0 2px 8px rgba(0,0,0,.25);transition:transform .3s " + EASE + ",background .3s}" +
  // hero
  ".cr-hero{position:relative;padding:32px;min-height:520px}" +
  ".cr-hero-card{position:relative;height:100%;border-radius:16px;overflow:hidden;background:#3a0302;container-type:size}" +
  ".cr-hero-art{position:absolute;left:50%;top:50%;width:max(112cqw,168cqh);aspect-ratio:3/2;transform:translate(-50%,-50%)}" +
  ".cr-hero-plate{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}" +
  ".cr-hero-glow{position:absolute;left:28%;top:-20%;width:44%;height:60%;background:radial-gradient(closest-side,rgba(255,110,40,.35),transparent);animation:cr-breathe 7s ease-in-out infinite alternate}" +
  ".cr-hand{position:absolute;height:auto;will-change:transform}" +
  ".cr-hand-top{left:0;top:0;width:32.55%;animation:cr-drift-a 7s ease-in-out infinite alternate}" +
  ".cr-hand-bottom{left:66.4%;top:56.64%;width:33.6%;animation:cr-drift-b 8s ease-in-out infinite alternate}" +
  ".cr-hero-copy{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:0 24px;pointer-events:none}" +
  ".cr-hero h1{font-family:" + SERIF + ";font-weight:400;font-size:clamp(34px,3.4vw,52px);line-height:1.1;letter-spacing:-.04em;color:#ffe0e0;text-shadow:0 0 12px rgba(255,214,214,.71)}" +
  ".cr-line{display:block}" +
  ".cr-hero-copy p{margin-top:14px;font-size:clamp(16px,1.35vw,20px);letter-spacing:-.01em;color:rgba(255,224,224,.9);text-shadow:0 0 12px rgba(255,230,230,.6)}" +
  ".cr-in-word{display:inline-block;white-space:pre;animation:cr-word 1.1s " + EASE + " both}" +
  ".cr-hero-foot{position:absolute;left:28px;right:28px;bottom:22px;display:flex;justify-content:space-between;align-items:center;font-size:12.8px;color:rgba(255,204,204,.7)}" +
  ".cr-explore{display:grid;overflow:hidden;height:1.2em;font-size:14.4px;color:rgba(255,204,204,.65)}" +
  ".cr-explore>span{grid-area:1/1;animation:cr-explore 3.2s " + EASE + " infinite}" +
  ".cr-explore>span+span{animation-name:cr-explore2}" +
  // manifesto
  ".cr-manifesto{position:relative;height:240vh}" +
  ".cr-mstage{position:sticky;top:0;height:100vh;display:flex;flex-direction:column;padding:clamp(100px,14vh,130px) 24px 56px}" +
  ".cr-mtext{max-width:1040px;margin:auto;text-align:center;font-family:" + SERIF + ";font-size:clamp(28px,3.9vw,56px);line-height:1.1;letter-spacing:-.04em;color:var(--ink)}" +
  ".cr-word{opacity:.26;transition:opacity .25s linear}" +
  ".cr-trust{display:flex;align-items:center;gap:28px;max-width:1300px;width:100%;margin:0 auto}" +
  ".cr-badge{flex:none;display:flex;align-items:center;gap:6px;font-size:12px;line-height:1.25;text-align:center;color:var(--ink)}" +
  ".cr-laurel{width:13px;height:30px;color:rgba(234,231,224,.75)}" +
  ".cr-marquee{flex:1;overflow:hidden;-webkit-mask-image:linear-gradient(90deg,transparent,#000 12%,#000 88%,transparent);mask-image:linear-gradient(90deg,transparent,#000 12%,#000 88%,transparent)}" +
  ".cr-mtrack{display:flex;width:max-content;animation:cr-marq 36s linear infinite}" +
  ".cr-mset{display:flex;align-items:center;gap:64px;padding-right:64px}" +
  ".cr-mlogo{white-space:nowrap;font-size:22px;color:rgba(234,231,224,.85)}" +
  ".cr-lg-serif{font-family:" + SERIF + ";font-style:italic;letter-spacing:-.02em}" +
  ".cr-lg-caps{font-weight:500;text-transform:uppercase;letter-spacing:.14em;font-size:.72em !important}" +
  ".cr-lg-mono{font-family:ui-monospace,Menlo,monospace;letter-spacing:-.04em}" +
  ".cr-lg-bold{font-weight:500;letter-spacing:-.06em}" +
  ".cr-lg-script{font-family:" + SERIF + ";font-style:italic;letter-spacing:.02em;font-size:1.05em !important}" +
  ".cr-lg-wide{text-transform:uppercase;letter-spacing:.32em;font-size:.62em !important}" +
  ".cr-lg-thin{font-family:" + SERIF + ";letter-spacing:.04em;text-transform:uppercase;font-size:.8em !important}" +
  // journey
  ".cr-journey{position:relative;height:340vh}" +
  ".cr-jstage{position:sticky;top:0;height:100vh;overflow:hidden;perspective:1600px}" +
  ".cr-h2{font-family:" + SERIF + ";font-weight:400;letter-spacing:-.04em;line-height:1;color:var(--ink);text-shadow:var(--glow);text-align:center}" +
  ".cr-jtitle{position:absolute;left:0;right:0;top:clamp(84px,12vh,112px);font-size:clamp(28px,2.9vw,42px);padding:0 20px}" +
  ".cr-jcards{position:absolute;left:50%;top:56%;width:0;height:0;transform-style:preserve-3d}" +
  ".cr-panel{position:absolute;left:0;top:0;transform-style:preserve-3d;will-change:transform}" +
  ".cr-flip{position:relative;width:100%;height:100%;transform-style:preserve-3d}" +
  ".cr-face{position:absolute;inset:0;border-radius:10px;-webkit-backface-visibility:hidden;backface-visibility:hidden;overflow:hidden}" +
  ".cr-front{background-repeat:no-repeat;background-color:#b5100a}" +
  ".cr-back{transform:rotateY(180deg);container-type:inline-size;box-shadow:0 30px 60px rgba(0,0,0,.5)}" +
  ".cr-back-in{position:absolute;inset:0;padding:9cqw 9cqw 10cqw;display:flex;flex-direction:column}" +
  ".cr-jicon{flex:none;width:9cqw;height:9cqw;opacity:.75}" +
  ".cr-back-in h3{font-size:9.7cqw;line-height:1.1;font-weight:400;letter-spacing:-.03em;white-space:pre-line;margin-bottom:auto;margin-top:34cqw}" +
  ".cr-back-in p{font-size:max(11px,4.36cqw);line-height:1.3;opacity:.8}" +
  ".cr-tone-silver{color:#151515;background:repeating-linear-gradient(115deg,rgba(255,255,255,.07) 0 1px,transparent 1px 3px),linear-gradient(165deg,#ececec,#a8a8a8 70%,#9a9a9a)}" +
  ".cr-tone-red{color:#fff;background:linear-gradient(180deg,#e2281d,#a3110b 70%,#7a0c08)}" +
  ".cr-tone-dark{color:#d8d5ce;background:linear-gradient(165deg,#2c2c2c,#161616);border:1px solid rgba(255,255,255,.08)}" +
  // services
  ".cr-services{position:relative;padding:40px 24px 120px}" +
  ".cr-head{text-align:center;padding:0 20px}" +
  ".cr-h2-lg{font-size:clamp(38px,4.2vw,60px)}" +
  ".cr-head p{margin-top:16px;font-size:clamp(15px,1.25vw,18px);color:var(--ink);opacity:.9}" +
  ".cr-rows{max-width:1230px;margin:72px auto 0}" +
  ".cr-row{display:grid;grid-template-columns:1fr 1.1fr 380px;gap:24px;padding:40px 0;border-bottom:1px solid var(--line)}" +
  ".cr-row-title span{display:block;font-size:16px;color:rgba(255,255,255,.6);margin-bottom:8px}" +
  ".cr-row h3{font-size:clamp(26px,2.3vw,32px);line-height:1.1;font-weight:400;letter-spacing:-.01em;white-space:pre-line;text-shadow:var(--glow);transition:text-shadow .4s}" +
  ".cr-row ul{list-style:none;font-size:16px;line-height:1.6;padding-top:26px}" +
  ".cr-row-img{border-radius:6px;overflow:hidden;aspect-ratio:16/9;align-self:start;margin-top:4px;background:#111}" +
  ".cr-row-img img{width:100%;height:100%;object-fit:cover;transition:transform .9s " + EASE + "}" +
  ".cr-vision{display:flex;width:max-content;margin:48px auto 0}" +
  // featured
  ".cr-feat{position:relative;height:300vh}" +
  ".cr-fstage{position:sticky;top:0;height:100vh;overflow:hidden}" +
  ".cr-fhead{position:absolute;left:0;right:0;top:96px;text-align:center;z-index:2;pointer-events:none}" +
  ".cr-ftitle{display:inline-block;font-family:" + SERIF + ";font-weight:400;font-size:clamp(40px,4.2vw,60px);line-height:1;letter-spacing:-.05em;text-shadow:0 0 18px rgba(255,255,255,.55);transform-origin:50% 50%;will-change:transform}" +
  ".cr-fsub{margin-top:14px;font-size:clamp(14px,1.25vw,19px);opacity:0}" +
  ".cr-fcar{position:absolute;left:0;right:0;top:clamp(200px,28vh,250px);bottom:0;will-change:transform,opacity}" +
  ".cr-ftrack{position:relative;width:min(580px,78vw);margin:0 auto}" +
  ".cr-work{position:absolute;left:0;top:0;width:100%;cursor:pointer;transform:translateX(calc(var(--d) * 88%)) scale(.6);transform-origin:50% 28%;opacity:.38;transition:transform .8s " + EASE + ",opacity .8s " + EASE + "}" +
  ".cr-work[data-d=c]{position:relative;transform:none;opacity:1;cursor:default}" +
  ".cr-work[data-d=far]{opacity:0;pointer-events:none}" +
  ".cr-work-img{border-radius:6px;overflow:hidden;aspect-ratio:580/330;background:#111}" +
  ".cr-work-img img{width:100%;height:100%;object-fit:cover;transition:transform .9s " + EASE + "}" +
  ".cr-work h3{margin-top:16px;font-size:clamp(15px,1.35vw,20px);font-weight:400}" +
  ".cr-tags{display:flex;gap:6px;margin-top:12px}" +
  ".cr-tags span{font-size:12px;padding:5px 10px;border:1px solid rgba(255,255,255,.22);border-radius:999px;color:rgba(234,231,224,.85)}" +
  ".cr-arrow{position:absolute;z-index:3;width:34px;height:34px;border-radius:50%;display:grid;place-items:center;background:rgba(40,40,40,.85);border:1px solid rgba(255,255,255,.14);font-size:15px;transition:background .3s,transform .3s " + EASE + "}" +
  ".cr-prev{left:-50px;top:calc((min(580px,78vw)) * 330 / 580 / 2 - 17px)}" +
  ".cr-next{right:-50px;top:calc((min(580px,78vw)) * 330 / 580 / 2 - 17px)}" +
  // wall
  ".cr-wall{padding:40px 24px 110px}" +
  ".cr-wall-head{text-align:center;font-size:clamp(15px,1.3vw,19px);line-height:1.4;text-shadow:var(--glow)}" +
  ".cr-grid{max-width:1220px;margin:40px auto 0;display:grid;grid-template-columns:repeat(7,1fr);gap:10px}" +
  ".cr-tile{height:86px;display:grid;place-items:center;background:#121212;border-radius:4px;font-size:19px;color:rgba(234,231,224,.82);transition:background .35s,color .35s,transform .5s " + EASE + "}" +
  // testimonials
  ".cr-quotes{padding:60px 0 100px;overflow:hidden}" +
  ".cr-qstage{position:relative;width:min(980px,90vw);height:384px;margin:56px auto 0}" +
  ".cr-quote{position:absolute;inset:0;display:grid;grid-template-columns:310px 1fr;gap:28px;padding:16px;background:#151515;border:1px solid rgba(255,255,255,.08);border-radius:12px;transform:translateX(calc(var(--d) * (100% + 40px))) scale(.94);opacity:.32;transition:transform .9s " + EASE + ",opacity .9s " + EASE + "}" +
  ".cr-quote[data-c]{transform:none;opacity:1}" +
  ".cr-quote img{width:100%;height:100%;object-fit:cover;border-radius:6px}" +
  ".cr-qbody{position:relative;display:flex;flex-direction:column;padding:8px 16px 8px 0;background-image:radial-gradient(rgba(255,255,255,.06) 1px,transparent 1.2px);background-size:12px 12px;background-position:right bottom}" +
  ".cr-quote blockquote{font-size:clamp(15px,1.3vw,19.2px);line-height:1.45}" +
  ".cr-quote figcaption{margin-top:auto;display:flex;flex-direction:column;gap:4px;font-size:16px}" +
  ".cr-quote figcaption span{font-size:14px;opacity:.7}" +
  ".cr-qmark{position:absolute;right:16px;bottom:10px;font-family:ui-monospace,Menlo,monospace;font-size:20px;letter-spacing:.12em;opacity:.55}" +
  ".cr-qprev{left:-58px;top:175px}" +
  ".cr-qnext{right:-58px;top:175px}" +
  ".cr-dotsbar{display:flex;gap:5px;width:max-content;margin:28px auto 0;padding:6px 8px;border-radius:99px;background:#1a1a1a}" +
  ".cr-dotsbar button{width:5px;height:5px;border-radius:5px;background:rgba(255,255,255,.3);transition:width .4s " + EASE + ",background .4s}" +
  ".cr-dotsbar button[aria-selected=true]{width:16px;background:var(--ink)}" +
  // contact
  ".cr-contact{padding:60px 24px 140px}" +
  ".cr-cgrid{max-width:1230px;margin:80px auto 0;display:grid;grid-template-columns:1fr 1fr;gap:60px;align-items:center}" +
  ".cr-people{display:flex;justify-content:center;gap:16px}" +
  ".cr-person{width:min(280px,42vw);aspect-ratio:280/350;padding:26px 22px 20px;display:flex;flex-direction:column;align-items:center;text-align:center;border-radius:14px;background:linear-gradient(170deg,#262626,#151515);border:1px solid rgba(255,255,255,.1);box-shadow:0 30px 60px rgba(0,0,0,.6);transform:rotate(-8deg) translateY(30px);opacity:0;transition:transform 1.1s " + EASE + ",opacity .8s,box-shadow .5s}" +
  ".cr-person+.cr-person{transform:rotate(8deg) translateY(30px);transition-delay:.08s}" +
  ".cr-in .cr-person{transform:rotate(-4deg) translateY(0);opacity:1}" +
  ".cr-in .cr-person+.cr-person{transform:rotate(3deg) translateY(-6px)}" +
  ".cr-avatar{width:42%;aspect-ratio:1;border-radius:50%;overflow:hidden;background:var(--red);box-shadow:0 0 0 6px rgba(227,36,26,.18)}" +
  ".cr-avatar img{width:100%;height:100%;object-fit:cover}" +
  ".cr-avatar-k{display:grid;place-items:center;font-family:" + SERIF + ";font-style:italic;font-size:clamp(34px,3.6vw,48px);color:#fff}" +
  ".cr-person h3{margin-top:14px;font-family:" + SERIF + ";font-style:italic;font-weight:400;font-size:clamp(28px,2.6vw,40px);line-height:.95;letter-spacing:-.03em;color:#fff}" +
  ".cr-person p{margin-top:10px;font-size:13px;opacity:.6}" +
  ".cr-plinks{margin-top:auto;display:flex;gap:18px;font-size:13px;opacity:.85}" +
  ".cr-stats{display:flex;flex-direction:column}" +
  ".cr-stat{display:grid;grid-template-columns:120px 1fr;gap:20px;padding:26px 0;border-bottom:1px solid var(--line)}" +
  ".cr-stat:last-child{border-bottom:0}" +
  ".cr-num{font-family:" + SERIF + ";font-size:clamp(42px,3.7vw,56px);line-height:1;letter-spacing:-.03em;white-space:nowrap}" +
  ".cr-num:after{content:'+';font-size:.75em}" +
  ".cr-odo{display:inline-flex}" +
  ".cr-odo-col{display:inline-block;height:1em;overflow:hidden}" +
  ".cr-odo-col>span{display:flex;flex-direction:column;transition:transform .7s " + EASE + "}" +
  ".cr-odo-col>span>span{height:1em;line-height:1}" +
  ".cr-stat h3{font-size:18px;font-weight:400;text-shadow:var(--glow)}" +
  ".cr-stat p{margin-top:8px;font-size:15px;line-height:1.5;color:var(--mute);max-width:430px}" +
  // closing card
  ".cr-ctawrap{padding:0 32px 32px}" +
  ".cr-cta{position:relative;height:max(560px,92vh);border-radius:16px;overflow:hidden;background:#5a0705;transform-origin:50% 100%;will-change:transform}" +
  ".cr-cta-img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transform-origin:50% 40%}" +
  ".cr-cta-tint{position:absolute;inset:0;background:radial-gradient(60% 50% at 50% 55%,rgba(120,8,4,.35),transparent),linear-gradient(rgba(150,10,5,.18),rgba(60,0,0,.35))}" +
  ".cr-cta-text{position:absolute;left:0;right:0;top:44%;transform:translateY(-50%);text-align:center;padding:0 20px}" +
  ".cr-cta-text p{font-size:clamp(18px,1.6vw,24px);letter-spacing:-.03em;color:#ffdbdb;opacity:.85}" +
  ".cr-cta-text h2{margin:6px 0 28px;font-family:" + SERIF + ";font-weight:400;font-size:clamp(38px,3.6vw,52px);letter-spacing:-.05em;color:#ffe0e0;text-shadow:0 0 14px rgba(255,214,214,.7)}" +
  ".cr-foot{position:absolute;left:32px;right:32px;bottom:24px;display:flex;justify-content:space-between;align-items:center;gap:16px;padding-top:16px;border-top:1px solid rgba(255,219,219,.14);font-size:15px;color:#ffdbdb}" +
  ".cr-flinks{display:flex;gap:28px}" +
  ".cr-mail{transition:opacity .3s}" +
  // hover: only where a mouse can hover
  "@media (hover:hover) and (pointer:fine){" +
  ".cr-root a:hover .cr-roll>span,.cr-root button:hover .cr-roll>span{transform:translateY(-105%)}" +
  ".cr-root a:hover .cr-roll>span+span,.cr-root button:hover .cr-roll>span+span{transform:translateY(0)}" +
  ".cr-links a:hover{opacity:1}" +
  ".cr-root .cr-btn:hover{background:#fff;transform:translateY(-1px)}" +
  ".cr-row:hover .cr-row-img img{transform:scale(1.05)}" +
  ".cr-row:hover h3{text-shadow:0 0 18px rgba(255,255,255,.95)}" +
  ".cr-work[data-d=c]:hover .cr-work-img img{transform:scale(1.04)}" +
  ".cr-work[data-d=s]:hover{opacity:.6}" +
  ".cr-arrow:hover{background:rgba(70,70,70,.95);transform:scale(1.08)}" +
  ".cr-tile:hover{background:#1e1e1e;color:#fff;transform:translateY(-2px)}" +
  ".cr-in .cr-people:hover .cr-person{transform:rotate(0) translateY(-8px);box-shadow:0 40px 80px rgba(0,0,0,.7)}" +
  ".cr-flinks a:hover,.cr-mail:hover{opacity:.7}" +
  "}" +
  "@keyframes cr-fade{from{opacity:0}to{opacity:1}}" +
  "@keyframes cr-word{from{opacity:0;filter:blur(10px);transform:translateY(12px)}to{opacity:1;filter:none;transform:none}}" +
  "@keyframes cr-drift-a{from{transform:translate(-6px,-4px) rotate(-.6deg)}to{transform:translate(8px,6px) rotate(.8deg)}}" +
  "@keyframes cr-drift-b{from{transform:translate(6px,6px) rotate(.6deg)}to{transform:translate(-9px,-6px) rotate(-.9deg)}}" +
  "@keyframes cr-breathe{from{opacity:.6}to{opacity:1}}" +
  "@keyframes cr-explore{0%,40%{transform:none}55%,100%{transform:translateY(-110%)}}" +
  "@keyframes cr-explore2{0%,40%{transform:translateY(110%)}55%,100%{transform:none}}" +
  "@keyframes cr-marq{to{transform:translateX(-50%)}}" +
  "@media (max-width:860px){" +
  ".cr-hero{padding:12px}" +
  ".cr-nav{top:12px;width:calc(100% - 24px);padding:0 14px 0 18px;height:60px}" +
  ".cr-links{display:none}" +
  ".cr-hero-foot{left:16px;right:16px;bottom:16px;font-size:11px}" +
  ".cr-trust{flex-direction:column;gap:18px}" +
  ".cr-mlogo{font-size:18px}" +
  ".cr-row{grid-template-columns:1fr;gap:14px;padding:30px 0}" +
  ".cr-row ul{padding-top:0;columns:2;font-size:14px}" +
  ".cr-prev{left:-6px}" +
  ".cr-next{right:-6px}" +
  ".cr-grid{grid-template-columns:repeat(3,1fr)}" +
  ".cr-tile{height:64px;font-size:15px}" +
  ".cr-qstage{height:auto;min-height:540px}" +
  ".cr-quote{grid-template-columns:1fr;grid-template-rows:200px 1fr;gap:14px}" +
  ".cr-quote img{height:200px}" +
  ".cr-qprev,.cr-qnext{top:auto;bottom:-56px}" +
  ".cr-qprev{left:calc(50% - 90px)}" +
  ".cr-qnext{right:calc(50% - 90px)}" +
  ".cr-dotsbar{margin-top:40px}" +
  ".cr-cgrid{grid-template-columns:1fr;gap:50px;margin-top:56px}" +
  ".cr-stat{grid-template-columns:84px 1fr;gap:14px}" +
  ".cr-ctawrap{padding:0 12px 12px}" +
  ".cr-foot{left:16px;right:16px;flex-direction:column;align-items:flex-start;gap:8px;font-size:13px}" +
  ".cr-flinks{gap:16px}" +
  "}" +
  "@media (prefers-reduced-motion:reduce){" +
  ".cr-root,.cr-root *{animation:none !important;transition-duration:.01ms !important}" +
  ".cr-in-word{opacity:1}" +
  "}"
