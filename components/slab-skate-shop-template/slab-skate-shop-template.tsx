"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { CSSProperties } from "react"

/*
 * Slab Skate Shop Template
 * A preloader that kickflips a deck while the brush wordmark paints in, then the wall of decks (pick one, the camera
 * glides in, add it with a kickflip button). The cart button tilts the camera down to the shop counter, where the
 * decks drop onto the wood, a split-flap board spells the order and the checkout drawer slides out. Below the wall:
 * the lineup, the workshop, a lookbook, about and the footer.
 *
 * The wall and the counter are pasted copies of deck-rack-add-to-cart and flipboard-checkout-counter (same design,
 * same motion), sharing one cart that lives in this page.
 */

export type SlabSkateShopTemplateProps = {
  /** Height of the wall and the counter. A definite length, never a percentage. */
  height?: string
  email?: string
  className?: string
  style?: CSSProperties
}

const SITE = "https://kedhar-components.pages.dev/slab-skate-shop-template/"
const EMAIL = "kedhareswer.12110626@gmail.com"
const SHOP = "Slab Skate Co."
/** Demo checkout details, so Pay works first time (the drawer still validates whatever you type). */
const DEMO = { email: "you@example.com", address: "12 Ledge Lane, Hyderabad", card: "4242 4242 4242 4242", expiry: "08 / 29", cvc: "123" }

// #region cart
export type Line = { id: string; qty: number }
/** The wall's add button toggles a deck in or out; the counter adjusts quantities. */
export function toggleLine(lines: Line[], id: string) {
  return lines.some((l) => l.id === id) ? lines.filter((l) => l.id !== id) : lines.concat({ id, qty: 1 })
}
export function lineCount(lines: Line[]) {
  return lines.reduce((s, l) => s + l.qty, 0)
}
export function lineTotal(lines: Line[], prices: Record<string, number>) {
  return lines.reduce((s, l) => s + l.qty * (prices[l.id] ?? 0), 0)
}
// #endregion

const reduced = () => typeof window !== "undefined" && !!window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches
const wait = (ms: number) => new Promise((r) => setTimeout(r, reduced() ? 0 : ms))

function easeInOut(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

function scrollToTop(ms: number) {
  return new Promise((res) => {
    const y0 = window.scrollY
    if (y0 <= 1 || ms <= 0 || reduced()) {
      window.scrollTo(0, 0)
      res(0)
      return
    }
    const t0 = performance.now()
    const step = (now: number) => {
      const p = Math.min(1, (now - t0) / ms)
      window.scrollTo(0, y0 * (1 - easeInOut(p)))
      if (p < 1) requestAnimationFrame(step)
      else res(0)
    }
    requestAnimationFrame(step)
  })
}

export default function SlabSkateShopTemplate({ height = "100svh", email = EMAIL, className, style }: SlabSkateShopTemplateProps) {
  const decks = DEFAULT_DECKS
  const products = decks.map((d) => ({ id: d.id, name: d.name, price: d.price, image: d.image }))
  const prices: Record<string, number> = {}
  decks.forEach((d) => (prices[d.id] = d.price))

  const rootRef = useRef(null as HTMLDivElement | null)
  const heroRef = useRef(null as HTMLElement | null)
  const lookRef = useRef(null as HTMLDivElement | null)
  const parRef = useRef(null as HTMLDivElement | null)
  const pctRef = useRef(null as HTMLSpanElement | null)
  const fillRef = useRef(null as HTMLDivElement | null)
  const flipRef = useRef(null as HTMLDivElement | null)
  const preMarkRef = useRef(null as HTMLDivElement | null)
  const shadowRef = useRef(null as HTMLDivElement | null)

  const [phase, setPhase] = useState("load")
  const [intro, setIntro] = useState(false)
  const [view, setView] = useState("wall")
  const [pan, setPan] = useState(0)
  const [live, setLive] = useState(false)
  const [belowHidden, setBelowHidden] = useState(false)
  const [lines, setLines] = useState([] as Line[])
  const [shown, setShown] = useState(0)
  const [toast, setToast] = useState(null as null | { id: string; n: number })
  const [toastOn, setToastOn] = useState(false)
  const [openSig, setOpenSig] = useState(0)
  const [drawer, setDrawer] = useState(false)
  const [ordered, setOrdered] = useState(false)
  const [counterKey, setCounterKey] = useState(0)
  const [focusSig, setFocusSig] = useState(null as null | { i: number; n: number })
  const [closeSig, setCloseSig] = useState(0)
  const [solid, setSolid] = useState(false)
  const viewRef = useRef("wall")
  const wallSlot = useRef(null as HTMLDivElement | null)
  const counterSlot = useRef(null as HTMLDivElement | null)
  const busy = useRef(false)

  const count = lineCount(lines)
  const total = lineTotal(lines, prices)
  const inCart = lines.map((l) => l.id)

  // the nav count follows the cart down at once; going up it waits for the flying deck to land
  useEffect(() => {
    if (count < shown) setShown(count)
  }, [count, shown])
  useEffect(() => {
    if (!toastOn) return
    const t = window.setTimeout(() => setToastOn(false), 4200)
    return () => clearTimeout(t)
  }, [toastOn, toast])

  // ---- preloader: real image loading, a deck kickflipping, the wordmark painting in ----
  useEffect(() => {
    const R = reduced()
    const urls = decks.map((d) => d.image).concat([SITE + "wordmark.webp"])
    let target = 0
    let loaded = 0
    const imgs = urls.map((u) => {
      const im = new Image()
      const done = () => {
        loaded++
        target = loaded / urls.length
      }
      im.onload = done
      im.onerror = done
      im.src = u
      return im
    })
    const t0 = performance.now()
    const MIN = R ? 250 : 2100
    let shownP = 0
    let finishing = false
    let raf = 0
    let last = t0
    let stopped = false
    const timers: number[] = []
    const frame = (now: number) => {
      if (stopped) return
      // a slow image must not hold the shop shut: after 6s the count runs on without it
      const goal = Math.min(now - t0 > 6000 ? 1 : target, Math.min(1, (now - t0) / MIN))
      // ease by elapsed time, not by frame, so a throttled or slow page finishes in the same 2s
      const dt = Math.min(1000, Math.max(0, now - last))
      last = now
      shownP += (goal - shownP) * (R ? 1 : 1 - Math.pow(0.86, dt / 16.67))
      if (goal >= 1 && shownP > 0.996) shownP = 1
      if (pctRef.current) pctRef.current.textContent = String(Math.round(shownP * 100)).padStart(3, "0")
      if (fillRef.current) fillRef.current.style.setProperty("--p", shownP.toFixed(4))
      const cyc = ((now - t0) % 1150) / 1150
      const air = Math.min(1, cyc / 0.62)
      if (shownP === 1) finishing = true
      const landed = finishing && (R || cyc >= 0.62)
      if (flipRef.current && !R) {
        const ang = landed ? 0 : easeInOut(air) * 360
        const hop = landed || air >= 1 ? 0 : Math.sin(air * Math.PI)
        flipRef.current.style.transform = "translateY(" + (-hop * 34).toFixed(2) + "px) rotateX(" + ang.toFixed(2) + "deg)"
        if (shadowRef.current) shadowRef.current.style.transform = "scaleX(" + (1 - hop * 0.35).toFixed(3) + ")"
      }
      if (landed) {
        // the loading wordmark flies into the wall's own wordmark (same picture, same box), then hands over to it
        const mark = preMarkRef.current
        const target = rootRef.current ? rootRef.current.querySelector(".skr-mark") : null
        if (!R && mark && target) {
          const a = mark.getBoundingClientRect()
          const b = target.getBoundingClientRect()
          mark.animate(
            [
              { left: a.left + "px", top: a.top + "px", width: a.width + "px" },
              { left: b.left + "px", top: b.top + "px", width: b.width + "px" },
            ],
            { duration: 1000, easing: "cubic-bezier(.65,0,.2,1)", fill: "forwards" },
          )
        }
        setPhase("leave")
        timers.push(window.setTimeout(() => setIntro(true), R ? 0 : 420))
        timers.push(window.setTimeout(() => setPhase("done"), R ? 300 : 1040))
        stopped = true
        window.clearInterval(watchdog)
        return
      }
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    // requestAnimationFrame stalls in a background tab or a capture frame; keep the count moving regardless
    const watchdog = window.setInterval(() => {
      const now = performance.now()
      if (now - last > 250) frame(now)
    }, 250)
    return () => {
      stopped = true
      window.clearInterval(watchdog)
      cancelAnimationFrame(raf)
      timers.forEach((t) => clearTimeout(t))
      imgs.forEach((im) => (im.onload = im.onerror = null))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ---- the camera tilts down from the wall to the counter, and back ----
  const openCart = useCallback(async () => {
    if (busy.current || viewRef.current === "cart") return
    busy.current = true
    setToastOn(false)
    // the wall lets go of a picked deck while the page glides up, so the camera leaves a clean wall behind
    setCloseSig((n) => n + 1)
    await Promise.all([window.scrollY > 2 ? scrollToTop(650) : 0, wait(480)])
    setLive(false)
    setPan((p) => p + 1)
    viewRef.current = "cart"
    setView("cart")
    await wait(820)
    setLive(true)
    await wait(480)
    setBelowHidden(true)
    busy.current = false
  }, [])

  const closeCart = useCallback(async () => {
    if (busy.current || viewRef.current !== "cart") return
    busy.current = true
    setBelowHidden(false)
    setPan((p) => p + 1)
    viewRef.current = "wall"
    setView("wall")
    await wait(1250)
    setLive(false)
    busy.current = false
  }, [])

  const openCheckout = useCallback(async () => {
    setToastOn(false)
    if (viewRef.current !== "cart") {
      await openCart()
      await wait(650)
    }
    setOpenSig((n) => n + 1)
  }, [openCart])

  const newOrder = useCallback(async () => {
    setLines([])
    setOrdered(false)
    await closeCart()
    setCounterKey((k) => k + 1)
  }, [closeCart])

  // a little deck flies from the button into the nav cart; the count bumps as it lands and a toast offers the checkout
  const toggleDeck = (id: string, from: DOMRect) => {
    const adding = !lines.some((l) => l.id === id)
    if (ordered) {
      setOrdered(false)
      setCounterKey((k) => k + 1)
      setLines(adding ? [{ id, qty: 1 }] : [])
    } else setLines((ls) => toggleLine(ls, id))
    if (!adding) return
    const land = () => {
      setShown((n) => n + 1)
      setToast({ id, n: Date.now() })
      setToastOn(true)
    }
    const to = rootRef.current?.querySelector(".sk-cartbtn")?.getBoundingClientRect()
    const d = decks.find((x) => x.id === id)
    if (reduced() || !to || !rootRef.current || !d) {
      land()
      return
    }
    const fly = document.createElement("img")
    fly.src = d.image
    fly.alt = ""
    fly.className = "sk-fly"
    rootRef.current.appendChild(fly)
    const x0 = from.left + from.width / 2, y0 = from.top + from.height / 2
    const x1 = to.right - 22, y1 = to.top + to.height / 2
    const lift = Math.min(y0, y1) - 150
    const at = (x: number, y: number, r: number, s: number) => "translate(" + (x - 9).toFixed(1) + "px," + (y - 34).toFixed(1) + "px) rotate(" + r + "deg) scale(" + s + ")"
    const anim = fly.animate(
      [
        { transform: at(x0, y0, 90, 1.3), opacity: 0 },
        { offset: 0.12, opacity: 1 },
        { offset: 0.55, transform: at(x0 + (x1 - x0) * 0.55, lift, 380, 1.1) },
        { transform: at(x1, y1, 720, 0.4), opacity: 0.35 },
      ],
      { duration: 780, easing: "cubic-bezier(.45,0,.3,1)", fill: "forwards" },
    )
    anim.onfinish = () => {
      fly.remove()
      land()
    }
  }

  const goSection = async (id: string) => {
    if (viewRef.current === "cart") {
      await closeCart()
      await wait(60)
    }
    const el = rootRef.current?.querySelector("#sk-" + id)
    if (el) el.scrollIntoView({ behavior: reduced() ? "auto" : "smooth", block: "start" })
  }

  const viewOnWall = async (i: number) => {
    if (viewRef.current === "cart") await closeCart()
    await scrollToTop(750)
    setFocusSig({ i, n: Date.now() })
  }

  const goHome = () => (viewRef.current === "cart" ? closeCart() : scrollToTop(700))

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && viewRef.current === "cart" && !drawer) closeCart()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [closeCart, drawer])

  // nav turns solid once the wall scrolls away; sections ease in as they arrive
  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > (heroRef.current ? heroRef.current.offsetHeight : 600) - 90)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    const io = new IntersectionObserver(
      (es) =>
        es.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("sk-seen")
            io.unobserve(e.target)
          }
        }),
      { threshold: 0.12 },
    )
    rootRef.current?.querySelectorAll(".sk-rv").forEach((el) => io.observe(el))
    return () => {
      window.removeEventListener("scroll", onScroll)
      io.disconnect()
    }
  }, [])

  // the lookbook photo drifts against the scroll, eased so it never snaps
  useEffect(() => {
    if (reduced()) return
    let cur = 0
    let raf = 0
    const loop = () => {
      const el = lookRef.current
      const par = parRef.current
      if (el && par) {
        const r = el.getBoundingClientRect()
        const vh = window.innerHeight
        if (r.bottom > -200 && r.top < vh + 200) {
          const target = Math.max(-1, Math.min(1, (r.top + r.height / 2 - vh / 2) / vh)) * -48
          cur += (target - cur) * 0.1
          par.style.transform = "translate3d(0," + cur.toFixed(2) + "px,0)"
        }
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  // the scene the camera is not looking at can take no focus, so Tab never drags the hero off its framing
  useEffect(() => {
    if (wallSlot.current) wallSlot.current.inert = view === "cart"
    if (counterSlot.current) counterSlot.current.inert = view !== "cart"
  }, [view])

  const camCls = pan ? (pan % 2 ? " sk-cam--a" : " sk-cam--b") : ""
  const navCount = ordered ? 0 : shown
  const toastDeck = toast ? decks.find((d) => d.id === toast.id) : undefined

  return (
    <div ref={rootRef} className={"sk-root" + (phase !== "done" ? " sk-root--lock" : "") + (className ? " " + className : "")} style={style}>
      <style>{CSS}</style>

      {phase !== "done" && (
        <div className={"sk-pre" + (phase === "leave" ? " sk-pre--leave" : "")} role="status" aria-label="Loading">
          <div className="sk-pre-half sk-pre-top" />
          <div className="sk-pre-half sk-pre-bot" />
          <div className="sk-pre-c">
            <div className="sk-pre-deck">
              <div ref={shadowRef} className="sk-pre-shadow" />
              <div ref={flipRef} className="sk-pre-flip">
                <img className="sk-pre-face" src={decks[0].image} alt="" width={262} height={996} />
                <span className="sk-pre-face sk-pre-grip" />
              </div>
            </div>
          </div>
          <div ref={preMarkRef} className="sk-pre-mark" aria-hidden="true">
            <img className="sk-pre-ghost" src={SITE + "wordmark.webp"} alt="" width={1600} height={672} />
            <div ref={fillRef} className="sk-pre-fill">
              <img src={SITE + "wordmark.webp"} alt="" width={1600} height={672} />
            </div>
          </div>
          <div className="sk-pre-meta">
            <span>Waxing the ledge</span>
            <span className="sk-pre-pct">
              <span ref={pctRef}>000</span>%
            </span>
          </div>
        </div>
      )}

      <header className={"sk-nav" + (solid || view === "cart" ? " sk-nav--solid" : "")}>
        <button type="button" className="sk-logo" onClick={goHome} aria-label={SHOP + ", home"}>
          {SHOP}
        </button>
        <nav className="sk-links" aria-label="Sections">
          {[["decks", "Decks"], ["workshop", "Workshop"], ["lookbook", "Lookbook"], ["about", "About"]].map(([id, label]) => (
            <button type="button" key={id} className="sk-link" onClick={() => goSection(id)}>
              {label}
            </button>
          ))}
        </nav>
        <button type="button" className={"sk-cartbtn" + (navCount ? " sk-cartbtn--full" : "")} onClick={() => (view === "cart" ? closeCart() : openCart())} aria-label={view === "cart" ? "Back to the wall" : "Cart, " + count + " decks"}>
          <span className="sk-cartlabel">{view === "cart" ? "Wall" : "Cart"}</span>
          <span className="sk-count">
            <span key={navCount}>{navCount}</span>
          </span>
        </button>
      </header>

      <div className={"sk-toast" + (toastOn && view !== "cart" ? " sk-toast--in" : "")} role="status" aria-hidden={!toastOn}>
        {toastDeck ? (
          <>
            <span className="sk-toast-deck">
              <img src={toastDeck.image} alt="" width={262} height={996} />
            </span>
            <span className="sk-toast-text">
              <b>{toastDeck.name} is in your cart</b>
              <small>
                {count} {count === 1 ? "deck" : "decks"} · ${total}
              </small>
            </span>
            <button type="button" className="sk-toast-go" onClick={openCheckout} tabIndex={toastOn ? 0 : -1}>
              Checkout →
            </button>
          </>
        ) : null}
      </div>

      <section ref={heroRef} className={"sk-hero sk-hero--" + view + (intro ? " sk-intro" : "")} style={{ height }} aria-label="The shop">
        <div className={"sk-cam" + camCls}>
          <div className="sk-world">
            <div ref={wallSlot} className="sk-slot sk-slot--wall" aria-hidden={view === "cart"}>
              <DeckRackAddToCart height="100%" decks={decks} shopName={SHOP} wordmarkSrc={SITE + "wordmark.webp"} cartIds={inCart} onToggleDeck={toggleDeck} onCheckout={openCheckout} focusSignal={focusSig} closeSignal={closeSig} />
            </div>
            <div ref={counterSlot} className="sk-slot sk-slot--counter" aria-hidden={view !== "cart"}>
              <FlipboardCheckoutCounter
                key={counterKey}
                height="100%"
                products={products}
                shopName={SHOP}
                backdropSrc=""
                defaultItems={[]}
                defaultDetails={DEMO}
                linesIn={lines}
                onLines={setLines}
                live={live}
                openSignal={openSig}
                onDrawer={setDrawer}
                onPay={() => setOrdered(true)}
                onNewOrder={newOrder}
              />
            </div>
          </div>
        </div>
        <div className="sk-chead">
          <button type="button" className="sk-back" onClick={closeCart} tabIndex={view === "cart" ? 0 : -1}>
            ← Back to the wall
          </button>
          {count && !ordered ? (
            <button type="button" className={"sk-go" + (drawer ? " sk-go--off" : "")} onClick={() => setOpenSig((n) => n + 1)} tabIndex={view === "cart" && !drawer ? 0 : -1}>
              <span>
                {count} {count === 1 ? "deck" : "decks"} · ${total}
              </span>
              <b>Checkout →</b>
            </button>
          ) : (
            <span className="sk-chead-note">{ordered ? "Paid. Thank you" : "Nothing here yet"}</span>
          )}
        </div>
      </section>

      <div className="sk-below" hidden={belowHidden}>
        <div className="sk-tick" aria-hidden="true">
          <div className="sk-tick-in">
            {[0, 1].map((k) => (
              <span key={k}>7-ply Canadian maple ✶ Pressed in runs of fifty ✶ Shaped by hand ✶ Ships in 48 hours ✶ 30-day returns ✶&nbsp;</span>
            ))}
          </div>
        </div>

        <section id="sk-decks" className="sk-sec">
          <div className="sk-head sk-rv">
            <div>
              <span className="sk-eyebrow">The lineup · {String(decks.length).padStart(2, "0")}</span>
              <h2 className="sk-h2">Five decks. Pressed slow, shaped by hand.</h2>
            </div>
            <p className="sk-lede">Every deck is seven sheets of maple, glued and pressed for a full day, then cut, sanded and sealed in the same room. Pick the one that matches how you ride.</p>
          </div>
          <div className="sk-grid">
            {decks.map((d, i) => (
              <article className="sk-tile sk-rv" key={d.id} style={{ transitionDelay: i * 70 + "ms" }}>
                <button type="button" className="sk-tile-art" onClick={() => viewOnWall(i)} aria-label={"See " + d.name + " on the wall"}>
                  <span className="sk-tile-deck">
                    <img src={d.image} alt="" width={262} height={996} loading="lazy" draggable={false} />
                  </span>
                  <span className="sk-tile-see">See it on the wall</span>
                </button>
                <div className="sk-tile-top">
                  <h3 className="sk-tile-name">{d.name}</h3>
                  <span className="sk-tile-price">${d.price}</span>
                </div>
                <p className="sk-tile-note">{d.tagline}</p>
                <div className="sk-tile-buy">
                  <KickflipButton inCart={inCart.includes(d.id)} image={d.image} onToggle={(r) => toggleDeck(d.id, r)} />
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="sk-workshop" className="sk-sec sk-sec--alt">
          <div className="sk-head sk-rv">
            <div>
              <span className="sk-eyebrow">The workshop</span>
              <h2 className="sk-h2">From veneer to the wall in nine days.</h2>
            </div>
            <p className="sk-lede">No outsourcing and no warehouse. The same four hands press, shape and print every deck, and each run stops at fifty.</p>
          </div>
          <div className="sk-steps">
            {[
              ["press", "01", "Press", "Seven maple veneers are glued, stacked and held in a steel mould for twenty-four hours, so the concave never settles."],
              ["sand", "02", "Shape", "The blank is cut to shape, then the rails are sanded by hand until the edge feels round under a thumb."],
              ["print", "03", "Print", "Graphics go on one colour at a time through a silk screen, then three coats of lacquer seal them in."],
            ].map(([img, n, h, p], i) => (
              <article className="sk-step sk-rv" key={img} style={{ transitionDelay: i * 90 + "ms" }}>
                <div className="sk-step-img">
                  <img src={SITE + img + ".webp"} alt={h + " step in the workshop"} width={616} height={616} loading="lazy" />
                </div>
                <span className="sk-step-n">{n}</span>
                <h3>{h}</h3>
                <p>{p}</p>
              </article>
            ))}
          </div>
          <dl className="sk-stats sk-rv">
            {[
              ["7", "plies of maple"],
              ["24 h", "in the press"],
              ["50", "decks per run"],
              ["48 h", "to your door"],
            ].map(([n, l]) => (
              <div key={l}>
                <dt>{n}</dt>
                <dd>{l}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section id="sk-lookbook" className="sk-sec">
          <div className="sk-look">
            <div ref={lookRef} className="sk-frame sk-rv">
              <div ref={parRef} className="sk-par">
                <img src={SITE + "bowl.webp"} alt="A rider carving the lip of a white bowl at golden hour" width={1600} height={900} loading="lazy" />
              </div>
            </div>
            <div className="sk-look-side">
              <div className="sk-rv">
                <span className="sk-eyebrow">Lookbook · Autumn</span>
                <h2 className="sk-h2 sk-h2--sm">Ride it like you pressed it.</h2>
                <p className="sk-lede sk-lede--left">Shot on the first cold evening of the season. Garnet on the bowl, Onyx on the ledge, nothing staged twice.</p>
              </div>
              <div className="sk-ollie sk-rv">
                <img src={SITE + "ollie.webp"} alt="An ollie off a concrete ledge on a black deck" width={880} height={1100} loading="lazy" />
              </div>
            </div>
          </div>
        </section>

        <section id="sk-about" className="sk-sec sk-sec--alt">
          <div className="sk-about">
            <div className="sk-about-img sk-rv">
              <img src={SITE + "rack.webp"} alt="The five Slab decks hanging in a plaster arch" width={900} height={1125} loading="lazy" />
            </div>
            <div className="sk-rv">
              <span className="sk-eyebrow">About</span>
              <h2 className="sk-h2 sk-h2--sm">Built by Kedhareswer.</h2>
              <p className="sk-lede sk-lede--left">
                {SHOP} is a demo shop designed and built by Kedhareswer Naidu, a designer and developer who makes interfaces that behave like objects: decks that swing off the wall, a counter you set them down on, a board that spells out your order.
              </p>
              <p className="sk-lede sk-lede--left">He takes on shops, product launches and landing pages. Write to him and he will answer within a day.</p>
              <a className="sk-mail" href={"mailto:" + email}>
                {email} <span aria-hidden="true">→</span>
              </a>
              <p className="sk-clients">Trusted by Client 1 · Client 2 · Client 3</p>
            </div>
          </div>
        </section>

        <footer className="sk-foot">
          <img className="sk-foot-mark sk-rv" src={SITE + "wordmark.webp"} alt={SHOP} width={1600} height={672} loading="lazy" />
          <div className="sk-foot-row">
            <a href={"mailto:" + email}>{email}</a>
            <span>Decks · Workshop · Lookbook · About</span>
            <span>© 2026 Kedhareswer Naidu</span>
          </div>
        </footer>
      </div>
    </div>
  )
}

const DISPLAY = "'Archivo Black','Arial Black','Helvetica Neue',Arial,sans-serif"
const CSS =
  ".sk-root{--sk-wall:color-mix(in oklab,var(--color-background) 84%,#d9a79e);--sk-ink:var(--color-foreground);--sk-soft:var(--color-muted-foreground);--sk-line:var(--color-border);--sk-alt:color-mix(in oklab,var(--color-background) 93%,#d9a79e);--sk-red:#c8203a;--sk-g:clamp(16px,3vw,40px);position:relative;width:100%;background:var(--color-background);color:var(--sk-ink);font-family:Inter,'Helvetica Neue',Arial,system-ui,sans-serif;-webkit-font-smoothing:antialiased;overflow-x:clip}" +
  ".sk-root :where(*,*::before,*::after){box-sizing:border-box}" +
  ".sk-root :where(img){max-width:none;display:block}" +
  ".sk-root :where(button){font:inherit;color:inherit;background:none;border:0;padding:0;margin:0;cursor:pointer;-webkit-tap-highlight-color:transparent}" +
  ".sk-root :where(button,a):focus-visible{outline:2px solid var(--sk-ink);outline-offset:3px}" +
  ".sk-root :where(a){color:inherit}" +
  ".sk-root :where(h2,h3,p,dl,dd){margin:0}" +
  ".sk-root--lock{height:100svh;overflow:hidden}" +
  ".sk-eyebrow{display:block;font-size:11px;font-weight:700;letter-spacing:.22em;text-transform:uppercase;color:var(--sk-soft)}" +
  // nav: the components' own top bars give way to this one, in the same style
  ".sk-root .skr-top,.sk-root .skc-top-ui{display:none}" +
  ".sk-nav{position:fixed;left:0;right:0;top:0;z-index:60;display:grid;grid-template-columns:1fr auto 1fr;align-items:center;height:68px;padding:0 var(--sk-g);transition:background .5s,box-shadow .5s}" +
  ".sk-nav--solid{background:color-mix(in oklab,var(--color-background) 84%,transparent);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);box-shadow:0 1px 0 var(--sk-line)}" +
  ".sk-logo{justify-self:start;font-size:11px;font-weight:700;letter-spacing:.22em;text-transform:uppercase;padding:8px 0}" +
  ".sk-links{display:flex;gap:2px}" +
  ".sk-link{height:34px;padding:0 13px;border-radius:999px;font-size:11px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;transition:background .25s}" +
  ".sk-cartbtn{justify-self:end;display:inline-flex;align-items:center;gap:10px;height:34px;padding:0 6px 0 14px;border-radius:999px;font-size:11px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;background:color-mix(in oklab,var(--color-background) 55%,transparent);box-shadow:inset 0 0 0 1px color-mix(in oklab,var(--sk-ink) 14%,transparent);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);transition:box-shadow .4s}" +
  ".sk-cartbtn--full{box-shadow:inset 0 0 0 1px color-mix(in oklab,var(--sk-ink) 14%,transparent),0 0 0 4px color-mix(in oklab,var(--sk-red) 22%,transparent)}" +
  ".sk-count{position:relative;display:grid;place-items:center;min-width:24px;height:24px;padding:0 6px;border-radius:999px;background:var(--sk-ink);color:var(--color-background);overflow:hidden;letter-spacing:0;font-variant-numeric:tabular-nums}" +
  ".sk-cartbtn--full .sk-count{background:var(--sk-red);color:#fff}" +
  ".sk-count span{display:block;animation:sk-roll .5s cubic-bezier(.2,.9,.3,1.2) both}" +
  ".sk-fly{position:fixed;left:0;top:0;z-index:90;width:18px;height:68px;pointer-events:none;filter:drop-shadow(2px 6px 6px rgba(40,10,10,.3))}" +
  ".sk-toast{position:fixed;top:80px;right:var(--sk-g);z-index:59;display:flex;align-items:center;gap:14px;width:min(360px,calc(100vw - 2 * var(--sk-g)));padding:12px 12px 12px 16px;border-radius:14px;background:var(--sk-ink);color:var(--color-background);box-shadow:0 24px 50px -20px rgba(30,10,10,.55);opacity:0;translate:0 -14px;scale:.96;pointer-events:none;transition:opacity .35s,translate .55s cubic-bezier(.2,.9,.2,1),scale .55s cubic-bezier(.2,.9,.2,1)}" +
  ".sk-toast--in{opacity:1;translate:0 0;scale:1;pointer-events:auto}" +
  ".sk-back{white-space:nowrap}" +
  ".sk-toast-deck{flex:none;display:block;width:15px;height:56px;transform:rotate(-12deg)}" +
  ".sk-toast-deck img{width:100%;height:100%}" +
  ".sk-toast-text{display:flex;flex-direction:column;gap:4px;min-width:0;flex:1}" +
  ".sk-toast-text b{font-size:13px;font-weight:700}" +
  ".sk-toast-text small{font-size:12px;opacity:.65}" +
  ".sk-toast-go{flex:none;height:36px;padding:0 14px;border-radius:999px;background:var(--sk-red);color:#fff;font-size:11px;font-weight:700;letter-spacing:.16em;text-transform:uppercase}" +
  // the camera: the wall above, the counter below, one cart button between them
  ".sk-hero{position:relative;overflow:hidden;overflow:clip;background:var(--sk-wall)}" +
  ".sk-cam{position:absolute;inset:0}" +
  ".sk-cam--a{animation:sk-tilt-a 1.25s cubic-bezier(.65,0,.25,1)}" +
  ".sk-cam--b{animation:sk-tilt-b 1.25s cubic-bezier(.65,0,.25,1)}" +
  ".sk-world{position:absolute;left:0;top:0;width:100%;height:156%;background:var(--sk-wall);transition:transform 1.25s cubic-bezier(.65,0,.25,1)}" +
  ".sk-hero--cart .sk-world{transform:translateY(-35.897%)}" +
  ".sk-slot{position:absolute;left:0;width:100%;height:64.103%;transition:transform 1.25s cubic-bezier(.65,0,.25,1)}" +
  ".sk-slot--wall{top:0;transform-origin:50% 100%}" +
  ".sk-hero--cart .sk-slot--wall{transform:scale(.9)}" +
  ".sk-slot--counter{bottom:0;transform-origin:64% 60%;transform:translateY(30%) scale(1.16)}" +
  ".sk-hero--cart .sk-slot--counter{transform:none}" +
  ".sk-hero--wall .sk-slot--counter,.sk-hero--cart .sk-slot--wall{pointer-events:none}" +
  ".sk-slot--wall .skr-root{overflow:visible;background:transparent}" +
  ".sk-slot--wall .skr-arch{height:calc(var(--h) * var(--u) * var(--skr-k) + 60cqh)!important}" +
  ".sk-slot--counter .skc-root{background:linear-gradient(180deg,transparent 0,transparent 44%,color-mix(in oklab,var(--skc-floor) 80%,var(--skc-wall)) 44.2%,var(--skc-floor) 100%)}" +
  ".sk-hero--cart .skr-hint,.sk-hero--wall .skc-plaque{opacity:0}" +
  ".sk-slot--counter .skc-plaque:not(:disabled)::after{content:'';position:absolute;inset:-1px;border-radius:3px;box-shadow:0 0 0 2px var(--sk-red);animation:sk-ping 1.6s cubic-bezier(.2,.6,.3,1) infinite;pointer-events:none}" +
  ".sk-slot--counter .skc-plaque:not(:disabled){background:linear-gradient(180deg,#d42a44,#a81a2f);box-shadow:0 0 0 1px #b48a3e,0 6px 14px rgba(120,10,25,.35)}" +
  ".sk-go-in{animation:sk-up .6s cubic-bezier(.2,.8,.2,1) both}" +
  ".sk-root .skr-go{margin:1.1em 0 0 1.4em;font-size:10px;font-weight:800;letter-spacing:.22em;text-transform:uppercase;color:#fff;background:var(--sk-red);height:30px;padding:0 14px;border-radius:999px}" +
  ".sk-chead{position:absolute;left:var(--sk-g);right:var(--sk-g);top:84px;z-index:8;display:flex;justify-content:space-between;align-items:center;gap:16px;opacity:0;translate:0 -10px;pointer-events:none;transition:opacity .4s,translate .5s cubic-bezier(.2,.8,.2,1)}" +
  ".sk-hero--cart .sk-chead{opacity:1;translate:0 0;pointer-events:auto;transition-delay:.8s}" +
  ".sk-back{font-size:10px;font-weight:700;letter-spacing:.22em;text-transform:uppercase;color:var(--sk-soft);padding:8px 0;transition:color .2s}" +
  ".sk-chead-note{font-size:11px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:var(--sk-soft);text-align:right}" +
  ".sk-go{display:inline-flex;align-items:center;gap:12px;height:42px;padding:0 5px 0 16px;border-radius:999px;background:color-mix(in oklab,var(--color-background) 60%,transparent);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);box-shadow:inset 0 0 0 1px color-mix(in oklab,var(--sk-ink) 14%,transparent);font-size:12px;font-weight:600;transition:opacity .35s}" +
  ".sk-go b{display:inline-grid;place-items:center;height:32px;padding:0 14px;border-radius:999px;background:var(--sk-red);color:#fff;font-size:10px;font-weight:800;letter-spacing:.2em;text-transform:uppercase}" +
  ".sk-go--off{opacity:0;pointer-events:none}" +
  // the wall arrives: wordmark rises, decks drop onto their arms
  ".sk-intro .skr-arch{animation:sk-fade 1s ease backwards}" +
  ".sk-root--lock .skr-mark{opacity:0}" +
  ".sk-hero:not(.sk-intro) .skr-board,.sk-hero:not(.sk-intro) .skr-hint{opacity:0}" +
  ".sk-intro .skr-board{animation:sk-hang 1.15s cubic-bezier(.3,.9,.35,1) backwards}" +
  ".sk-intro .skr-board:nth-child(3){animation-delay:.35s}.sk-intro .skr-board:nth-child(4){animation-delay:.45s}.sk-intro .skr-board:nth-child(5){animation-delay:.55s}.sk-intro .skr-board:nth-child(6){animation-delay:.65s}.sk-intro .skr-board:nth-child(7){animation-delay:.75s}" +
  ".sk-intro .skr-hint{animation:sk-fade .8s ease 1.2s backwards}" +
  // sections
  ".sk-tick{overflow:hidden;background:var(--sk-red);color:#fff;padding:13px 0}" +
  ".sk-tick-in{display:flex;width:max-content;animation:sk-tick 38s linear infinite}" +
  ".sk-tick-in>span{flex:none;font-family:" + DISPLAY + ";font-size:20px;line-height:1.1;white-space:nowrap;text-transform:uppercase;letter-spacing:.04em;padding-right:.4em}" +
  ".sk-sec{padding:clamp(72px,9vw,136px) var(--sk-g)}" +
  ".sk-sec--alt{background:var(--sk-alt)}" +
  ".sk-head{display:grid;grid-template-columns:1.25fr 1fr;gap:var(--sk-g);align-items:end;margin-bottom:clamp(36px,5vw,64px)}" +
  ".sk-h2{margin-top:14px;font-family:" + DISPLAY + ";font-weight:900;font-size:clamp(32px,4.8vw,72px);line-height:.98;letter-spacing:-.01em;text-transform:uppercase;text-wrap:balance}" +
  ".sk-h2--sm{font-size:clamp(30px,3.6vw,54px)}" +
  ".sk-lede{font-size:clamp(15px,1.2vw,17px);line-height:1.6;color:var(--sk-soft);max-width:46ch;justify-self:end}" +
  ".sk-lede--left{justify-self:start;margin-top:18px}" +
  ".sk-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:clamp(12px,1.6vw,24px)}" +
  ".sk-tile{display:flex;flex-direction:column;gap:10px;min-width:0}" +
  ".sk-tile-art{position:relative;display:block;aspect-ratio:3 / 4;border-radius:999px 999px 6px 6px;background:var(--sk-wall);overflow:hidden;margin-bottom:6px}" +
  ".sk-tile-deck{position:absolute;left:50%;top:50%;height:82%;aspect-ratio:.264;transform:translate(-50%,-47%);transition:transform .6s cubic-bezier(.3,1.4,.5,1)}" +
  ".sk-tile-deck img{width:100%;height:100%;filter:drop-shadow(4px 10px 10px rgba(50,12,14,.3))}" +
  ".sk-tile-see{position:absolute;left:50%;bottom:12px;padding:6px 10px;border-radius:999px;background:var(--sk-ink);color:var(--color-background);font-size:10px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;white-space:nowrap;transform:translateX(-50%);translate:0 8px;opacity:0;transition:opacity .3s,translate .4s cubic-bezier(.2,.8,.2,1)}" +
  ".sk-tile-top{display:flex;align-items:baseline;justify-content:space-between;gap:8px}" +
  ".sk-tile-name{font-family:" + DISPLAY + ";font-weight:900;font-size:20px;text-transform:uppercase}" +
  ".sk-tile-price{font-family:" + DISPLAY + ";font-weight:900;font-size:18px;font-variant-numeric:tabular-nums}" +
  ".sk-tile-note{font-size:13.5px;line-height:1.45;color:var(--sk-soft);min-height:2.9em}" +
  ".sk-tile-buy{margin-top:auto;padding-top:6px}" +
  ".sk-tile-buy .skr-flip{width:100%;max-width:11.5rem}" +
  ".sk-steps{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:clamp(16px,2.4vw,40px)}" +
  ".sk-step-img{overflow:hidden;border-radius:6px;aspect-ratio:1}" +
  ".sk-step-img img{width:100%;height:100%;object-fit:cover;transition:transform 1.2s cubic-bezier(.2,.8,.2,1)}" +
  ".sk-step-n{display:block;margin-top:20px;font-family:" + DISPLAY + ";font-size:34px;line-height:1;color:var(--sk-red)}" +
  ".sk-step h3{margin:10px 0 8px;font-family:" + DISPLAY + ";font-weight:900;font-size:20px;text-transform:uppercase}" +
  ".sk-step p{font-size:15px;line-height:1.6;color:var(--sk-soft);max-width:38ch}" +
  ".sk-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:var(--sk-g);margin-top:clamp(48px,6vw,88px);padding-top:28px;border-top:1px solid var(--sk-line)}" +
  ".sk-stats dt{font-family:" + DISPLAY + ";font-size:clamp(32px,4vw,58px);line-height:1}" +
  ".sk-stats dd{margin-top:8px;font-size:11px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:var(--sk-soft)}" +
  ".sk-look{display:grid;grid-template-columns:1.8fr 1fr;gap:clamp(16px,2.4vw,40px);align-items:stretch}" +
  ".sk-frame{position:relative;overflow:hidden;border-radius:6px;min-height:clamp(320px,44vw,660px)}" +
  ".sk-par{position:absolute;left:0;right:0;top:-8%;bottom:-8%}" +
  ".sk-par img,.sk-ollie img,.sk-about-img img{width:100%;height:100%;object-fit:cover}" +
  ".sk-look-side{display:flex;flex-direction:column;justify-content:space-between;gap:32px}" +
  ".sk-ollie{overflow:hidden;border-radius:6px;aspect-ratio:4 / 5}" +
  ".sk-about{display:grid;grid-template-columns:1fr 1.15fr;gap:clamp(24px,5vw,88px);align-items:center}" +
  ".sk-about-img{overflow:hidden;border-radius:999px 999px 6px 6px;aspect-ratio:4 / 5}" +
  ".sk-mail{display:inline-flex;gap:10px;margin-top:28px;padding-bottom:6px;border-bottom:2px solid var(--sk-red);font-size:clamp(16px,1.5vw,22px);font-weight:700;text-decoration:none;overflow-wrap:anywhere}" +
  ".sk-clients{margin-top:28px;font-size:11px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:var(--sk-soft)}" +
  ".sk-foot{padding:clamp(48px,6vw,88px) var(--sk-g) 28px;border-top:1px solid var(--sk-line)}" +
  ".sk-foot-mark{width:min(100%,1100px);height:auto;margin:0 auto}" +
  ".sk-foot-row{display:flex;flex-wrap:wrap;justify-content:space-between;gap:12px 24px;margin-top:clamp(24px,3vw,40px);font-size:13px;color:var(--sk-soft)}" +
  ".sk-foot-row a{text-decoration:none;color:var(--sk-ink);font-weight:600}" +
  ".sk-rv{opacity:0;translate:0 26px;filter:blur(6px);transition:opacity .9s cubic-bezier(.2,.8,.2,1),translate 1s cubic-bezier(.2,.8,.2,1),filter .8s}" +
  ".sk-rv.sk-seen{opacity:1;translate:0 0;filter:none}" +
  // preloader
  ".sk-pre{position:fixed;inset:0;z-index:100}" +
  ".sk-pre-half{position:absolute;left:0;right:0;height:50.5%;background:var(--sk-wall);transition:transform 1s cubic-bezier(.65,0,.2,1)}" +
  ".sk-pre-top{top:0}.sk-pre-bot{bottom:0}" +
  ".sk-pre--leave .sk-pre-top{transform:translateY(-100%)}" +
  ".sk-pre--leave .sk-pre-bot{transform:translateY(100%)}" +
  ".sk-pre-c{position:absolute;left:0;right:0;top:calc(50% - min(26vw,150px));display:flex;justify-content:center;transition:opacity .38s,translate .5s cubic-bezier(.6,0,.4,1),filter .38s}" +
  ".sk-pre--leave .sk-pre-c,.sk-pre--leave .sk-pre-meta{opacity:0;translate:0 -22px;filter:blur(6px)}" +
  ".sk-pre-deck{--L:min(56vw,300px);position:relative;width:var(--L);height:calc(var(--L) * .264);perspective:900px}" +
  ".sk-pre-shadow{position:absolute;left:12%;right:12%;bottom:-38%;height:18%;border-radius:50%;background:radial-gradient(closest-side,rgba(40,10,10,.3),transparent)}" +
  ".sk-pre-flip{position:absolute;inset:0;transform-style:preserve-3d}" +
  ".sk-pre-face{position:absolute;left:50%;top:50%;width:calc(var(--L) * .264);height:var(--L);border-radius:999px;transform:translate(-50%,-50%) rotate(90deg);backface-visibility:hidden;-webkit-backface-visibility:hidden}" +
  ".sk-pre-grip{background:radial-gradient(circle at 30% 30%,#2c2828,#121010);transform:translate(-50%,-50%) rotateX(180deg) rotate(90deg)}" +
  ".sk-pre-mark{--mw:min(70vw,520px);position:absolute;left:calc(50% - var(--mw) / 2);top:calc(50% - min(4vw,24px));width:var(--mw)}" +
  ".sk-pre-mark img{width:100%;height:auto}" +
  ".sk-pre-ghost{opacity:.14}" +
  ".sk-pre-fill{--p:0;position:absolute;inset:0;clip-path:inset(0 calc(100% - var(--p) * 100%) 0 0)}" +
  ".sk-pre-meta{position:absolute;left:var(--sk-g);right:var(--sk-g);bottom:26px;display:flex;justify-content:space-between;align-items:flex-end;font-size:11px;font-weight:700;letter-spacing:.22em;text-transform:uppercase;color:var(--sk-soft);transition:opacity .38s,translate .5s,filter .38s}" +
  ".sk-pre-pct{font-family:" + DISPLAY + ";font-size:clamp(34px,4.6vw,60px);letter-spacing:0;line-height:.8;color:var(--sk-ink);font-variant-numeric:tabular-nums}" +
  "@media (hover:hover) and (pointer:fine){" +
  ".sk-link:hover{background:color-mix(in oklab,var(--sk-ink) 8%,transparent)}" +
  ".sk-back:hover{color:var(--sk-ink)}" +
  ".sk-toast-go:hover,.sk-go:hover b,.sk-root .skr-go:hover{filter:brightness(1.12)}" +
  ".sk-tile-art:hover .sk-tile-deck{transform:translate(-50%,-50%) rotate(-4deg)}" +
  ".sk-tile-art:hover .sk-tile-see{opacity:1;translate:0 0}" +
  ".sk-step:hover .sk-step-img img{transform:scale(1.04)}" +
  "}" +
  "@media (max-width:1100px){.sk-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}" +
  "@media (max-width:760px){" +
  ".sk-links{display:none}" +
  ".sk-nav{grid-template-columns:1fr auto;height:60px}" +
  ".sk-toast{top:70px}" +
  ".sk-chead{top:72px}" +
  ".sk-go>span{display:none}" +
  ".sk-root:has(.skr-root[data-on]) .sk-toast{opacity:0;pointer-events:none}" +
  ".sk-chead-note{max-width:16ch}" +
  ".sk-head,.sk-look,.sk-about{grid-template-columns:1fr}" +
  ".sk-lede{justify-self:start}" +
  ".sk-grid{grid-template-columns:repeat(2,minmax(0,1fr))}" +
  ".sk-steps{grid-template-columns:1fr}" +
  ".sk-stats{grid-template-columns:repeat(2,minmax(0,1fr))}" +
  "}" +
  "@keyframes sk-roll{from{transform:translateY(110%);opacity:0}to{transform:translateY(0);opacity:1}}" +
  "@keyframes sk-up{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}" +
  "@keyframes sk-fade{from{opacity:0}to{opacity:1}}" +
  "@keyframes sk-hang{0%{opacity:0;translate:0 -34cqh;rotate:-14deg}45%{opacity:1}62%{translate:0 1.5%;rotate:6deg}80%{translate:0 0;rotate:-2deg}100%{opacity:1;translate:0 0;rotate:0deg}}" +
  "@keyframes sk-tilt-a{0%{transform:none;filter:none}45%{transform:perspective(1600px) rotateX(3deg) scale(.985);filter:blur(1px)}100%{transform:none;filter:none}}" +
  "@keyframes sk-tilt-b{0%{transform:none;filter:none}45%{transform:perspective(1600px) rotateX(-3deg) scale(.985);filter:blur(1px)}100%{transform:none;filter:none}}" +
  "@keyframes sk-ping{0%{opacity:.75;transform:scale(1)}100%{opacity:0;transform:scale(1.15,1.6)}}" +
  "@keyframes sk-tick{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}" +
  "@media (prefers-reduced-motion:reduce){" +
  ".sk-root :where(*,*::before,*::after){animation-duration:1ms!important;animation-delay:0ms!important;animation-iteration-count:1!important;transition-duration:1ms!important;transition-delay:0ms!important}" +
  ".sk-rv{opacity:1;translate:0 0;filter:none}" +
  "}"

// #region pasted
// ---- generated by paste.mjs from deck-rack-add-to-cart and flipboard-checkout-counter: edit those, then re-run ----

/*
 * Deck Rack Add To Cart
 * A wall of skateboard decks hung over a brush-painted wordmark. Hover swings a deck off the wall on its
 * arm; click glides the camera in and a frosted card fades up with the deck's specs. The add-to-cart pill
 * is itself a little deck: press it and it kickflips (you see the trucks mid-air) and lands as "In your cart",
 * while the cart count in the corner rolls over.
 *
 * The camera never enlarges anything: the wall is laid out at its focused size and the wall view is that
 * world scaled down (1/K), so the glide is a compositor transform that only ever minifies the deck art.
 * Positions come from container units and custom properties, so no layout reads are needed.
 */

const DR_BASE = "https://kedhar-components.pages.dev/slab-skate-shop-template/"

type DeckSpec = [label: string, value: string]

type Deck = {
  id: string
  name: string
  tagline: string
  price: number
  image: string
  specs: DeckSpec[]
  /** Horizontal position on the wall, in wall units (the wordmark spans roughly -30 … 30). */
  x: number
}

const DEFAULT_DECKS: Deck[] = [
  {
    id: "onyx",
    name: "Onyx",
    tagline: "Black lacquer, gold-leaf pinstripe.",
    price: 68,
    image: DR_BASE + "deck-onyx.webp",
    specs: [["Width", "8.0\""], ["Length", "31.6\""], ["Wheelbase", "14.25\""], ["Build", "7-ply Canadian maple"]],
    x: -34,
  },
  {
    id: "chalk",
    name: "Chalk",
    tagline: "Bone-white face, charcoal nose and tail.",
    price: 64,
    image: DR_BASE + "deck-chalk.webp",
    specs: [["Width", "8.25\""], ["Length", "32.0\""], ["Wheelbase", "14.38\""], ["Build", "7-ply Canadian maple"]],
    x: -13.5,
  },
  {
    id: "garnet",
    name: "Garnet",
    tagline: "Deep wine-red gloss, gilt centre line.",
    price: 72,
    image: DR_BASE + "deck-garnet.webp",
    specs: [["Width", "8.38\""], ["Length", "31.9\""], ["Wheelbase", "14.25\""], ["Build", "7-ply Canadian maple"]],
    x: 1.5,
  },
  {
    id: "fern",
    name: "Fern",
    tagline: "Racing green, cream stripe, No. 07.",
    price: 70,
    image: DR_BASE + "deck-fern.webp",
    specs: [["Width", "8.5\""], ["Length", "32.2\""], ["Wheelbase", "14.5\""], ["Build", "7-ply Canadian maple"]],
    x: 15.5,
  },
  {
    id: "teak",
    name: "Teak",
    tagline: "Walnut veneer with brass inlay stripes.",
    price: 84,
    image: DR_BASE + "deck-teak.webp",
    specs: [["Width", "8.25\""], ["Length", "32.0\""], ["Wheelbase", "14.38\""], ["Build", "Walnut veneer over maple"]],
    x: 35,
  },
]

type DeckRackAddToCartProps = {
  decks?: Deck[]
  /** Brush-painted wordmark behind the decks (transparent image, about 2.4 : 1). */
  wordmarkSrc?: string
  shopName?: string
  currency?: string
  /** Ids already in the cart when the rack mounts. */
  defaultCart?: string[]
  onCartChange?: (ids: string[]) => void
  /** template: the cart lives in the page */
  cartIds?: string[]
  onToggleDeck?: (id: string, from: DOMRect) => void
  onCheckout?: () => void
  focusSignal?: { i: number; n: number } | null
  closeSignal?: number
  height?: string
  className?: string
}

// Wall geometry, in wall units. A unit is 1cqw on landscape stages and 1.2cqw on portrait ones.
const DECK_H = 22
const DECK_RATIO = 0.264
const MARK_W = 62
const MARK_RATIO = 672 / 1600

// The world (.skr-scene) is laid out once at the focused size (--skr-k = K) and the camera only ever scales it
// DOWN (scale 1/K on the wall, 1 when focused), so decks are rasterised at their largest size, never enlarged,
// and the glide is a compositor transform transition.
const DR_P = "cubic-bezier(.76,0,.24,1)"
const DR_CSS =
  "@property --skr-p{syntax:'<number>';inherits:true;initial-value:0}" +
  ".skr-root{position:relative;overflow:hidden;container:skr/size;isolation:isolate;" +
  "--skr-wall:color-mix(in oklab,var(--color-background) 84%,#d9a79e);--skr-ink:var(--color-foreground);" +
  "--skr-soft:var(--color-muted-foreground);--skr-g:clamp(16px,3cqw,40px);background:var(--skr-wall);color:var(--skr-ink);" +
  "font-family:Inter,'Helvetica Neue',Arial,system-ui,sans-serif;-webkit-font-smoothing:antialiased;user-select:none}" +
  ".skr-root img{max-width:none;display:block;pointer-events:none;-webkit-user-drag:none}" +
  ".skr-root :where(button){font:inherit;color:inherit;background:none;border:0;padding:0;margin:0;cursor:pointer;-webkit-tap-highlight-color:transparent}" +
  ".skr-root :where(button):focus-visible{outline:2px solid var(--skr-ink);outline-offset:3px}" +
  ".skr-scene{position:absolute;inset:0;--u:min(1cqw,1.55cqh);--skr-k:1.95;--skr-s:calc(1/var(--skr-k));--skr-sx:0;--skr-sy:0;" +
  "transform-origin:50% 50%;will-change:transform;transform:translate(calc(var(--skr-sx)*1cqw - var(--skr-cx)*var(--u)*var(--skr-k)),calc(var(--skr-sy)*1cqh)) scale(var(--skr-s));" +
  "transition:transform 1.15s " + DR_P + "}" +
  ".skr-scene[data-on]{--skr-s:1;--skr-sx:-19;--skr-sy:0}" +
  "@container skr (max-aspect-ratio:4/5){.skr-scene{--u:1.2cqw;--skr-k:2.9}.skr-scene[data-on]{--skr-sx:0;--skr-sy:-20}}" +
  ".skr-at{position:absolute;left:calc(50% + var(--x)*var(--u)*var(--skr-k));" +
  "top:calc(50% + var(--y)*var(--u)*var(--skr-k));" +
  "width:calc(var(--w)*var(--u)*var(--skr-k));height:calc(var(--h)*var(--u)*var(--skr-k));transform:translate(-50%,-50%)}" +
  ".skr-arch{transform:translate(-50%,0);border-radius:50% 50% 0 0/34% 34% 0 0;" +
  "background:linear-gradient(180deg,rgba(60,20,20,.09),transparent 9%),linear-gradient(90deg,rgba(60,20,20,.1),rgba(255,255,255,.16) 30%,rgba(255,255,255,.1) 70%,rgba(60,20,20,.07));" +
  "box-shadow:inset 0 0 0 calc(.7*var(--u)*var(--skr-k)) color-mix(in oklab,var(--skr-wall) 92%,#fff)}" +
  ".skr-mark{transition:filter .25s ease;will-change:filter}" +
  ".skr-mark img{width:100%;height:100%}" +
  ".skr-scene[data-on] .skr-mark{filter:blur(2.5px);transition:filter .5s ease 1.05s}" +
  ".skr-board{--skr-p:0;z-index:2;transition:--skr-p .65s cubic-bezier(.3,1.35,.45,1)}" +
  ".skr-board.skr-at{left:calc(50% + (var(--x) + 1.3*var(--skr-p))*var(--u)*var(--skr-k));" +
  "top:calc(50% + (var(--y) - .25*var(--skr-p))*var(--u)*var(--skr-k));" +
  "width:calc(var(--w)*(1 + .1*var(--skr-p))*var(--u)*var(--skr-k));height:calc(var(--h)*(1 + .1*var(--skr-p))*var(--u)*var(--skr-k))}" +
  "@media (hover:hover){.skr-board:hover{--skr-p:.85}}" +
  ".skr-board:focus-visible{--skr-p:.85}" +
  ".skr-board[data-sel]{--skr-p:1;z-index:3}" +
  ".skr-sway{position:absolute;inset:0;z-index:2;transform-origin:50% 46%;transition:filter .25s ease,opacity .4s ease}" +
  "@media (hover:hover){.skr-board:hover .skr-sway{animation:skr-sway 1.1s cubic-bezier(.3,.6,.3,1)}}" +
  ".skr-sway img{position:relative;width:100%;height:100%}" +
  ".skr-shade{position:absolute;left:-14%;right:-14%;top:-3%;bottom:-3%;background:radial-gradient(closest-side,rgba(50,12,14,calc(.3 + .1*var(--skr-p))) 55%,rgba(50,12,14,.12) 80%,transparent);transform:translate(calc((.15 + .9*var(--skr-p))*var(--u)*var(--skr-k)),calc((.3 + 1.2*var(--skr-p))*var(--u)*var(--skr-k)))}" +
  ".skr-scene[data-on] .skr-board:not([data-sel]) .skr-sway{filter:blur(3px);opacity:.9;transition:filter .5s ease 1.05s,opacity .4s ease}" +
  ".skr-clip{position:absolute;z-index:3;top:44%;width:calc(.55*var(--u)*var(--skr-k));height:calc(1.5*var(--u)*var(--skr-k));border-radius:calc(.15*var(--u)*var(--skr-k));background:linear-gradient(90deg,#141414,#3a3636)}" +
  ".skr-clip-l{left:calc(-.35*var(--u)*var(--skr-k))}.skr-clip-r{right:calc(-.35*var(--u)*var(--skr-k))}" +
  ".skr-rod,.skr-knob{position:absolute;z-index:1;opacity:min(1,calc(var(--skr-p)*1.6))}" +
  ".skr-rod{right:50%;top:calc(52% - .22*var(--u)*var(--skr-k));height:calc(.44*var(--u)*var(--skr-k));" +
  "width:calc((var(--w)*(1 + .1*var(--skr-p))/2 + 1.6 + 1.3*var(--skr-p))*var(--u)*var(--skr-k));border-radius:9px;background:linear-gradient(180deg,#3d3a3a,#121111);box-shadow:0 calc(.3*var(--u)*var(--skr-k)) calc(.5*var(--u)*var(--skr-k)) rgba(40,10,10,.3)}" +
  ".skr-knob{left:calc(50% - (var(--w)*(1 + .1*var(--skr-p))/2 + 1.6 + 1.3*var(--skr-p))*var(--u)*var(--skr-k));top:52%;" +
  "width:calc(1.15*var(--u)*var(--skr-k));aspect-ratio:1;border-radius:50%;transform:translate(-50%,-50%);background:radial-gradient(circle at 35% 30%,#5a5555,#0e0d0d 70%);box-shadow:calc(.15*var(--u)*var(--skr-k)) calc(.3*var(--u)*var(--skr-k)) calc(.5*var(--u)*var(--skr-k)) rgba(40,10,10,.35)}" +
  "@keyframes skr-sway{0%{transform:rotate(0)}22%{transform:rotate(-2.6deg)}46%{transform:rotate(1.7deg)}68%{transform:rotate(-.8deg)}86%{transform:rotate(.3deg)}100%{transform:rotate(0)}}" +
  ".skr-top{position:absolute;z-index:6;left:var(--skr-g);right:var(--skr-g);top:var(--skr-g);display:flex;align-items:center;justify-content:space-between;pointer-events:none}" +
  ".skr-brand{font-size:11px;font-weight:700;letter-spacing:.22em;text-transform:uppercase}" +
  ".skr-cartpill{pointer-events:auto;display:inline-flex;align-items:center;gap:10px;height:34px;padding:0 6px 0 14px;border-radius:999px;font-size:11px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;" +
  "background:color-mix(in oklab,var(--color-background) 72%,transparent);box-shadow:inset 0 0 0 1px color-mix(in oklab,var(--skr-ink) 14%,transparent)}" +
  ".skr-cartpill[data-bump]{animation:skr-bump .6s cubic-bezier(.3,1.6,.5,1)}" +
  ".skr-count{position:relative;display:grid;place-items:center;min-width:24px;height:24px;padding:0 6px;border-radius:999px;background:var(--skr-ink);color:var(--color-background);overflow:hidden;letter-spacing:0;font-variant-numeric:tabular-nums}" +
  ".skr-count span{display:block;animation:skr-roll .5s cubic-bezier(.2,.9,.3,1.2) both}" +
  "@keyframes skr-roll{from{transform:translateY(110%);opacity:0}to{transform:translateY(0);opacity:1}}" +
  "@keyframes skr-bump{0%{transform:translateY(0)}35%{transform:translateY(-4px)}70%{transform:translateY(1px)}100%{transform:translateY(0)}}" +
  ".skr-hint{position:absolute;z-index:6;left:50%;bottom:var(--skr-g);transform:translate(-50%,0);font-size:11px;font-weight:600;letter-spacing:.2em;text-transform:uppercase;color:var(--skr-soft);white-space:nowrap;transition:opacity .4s ease,transform .4s ease}" +
  ".skr-root[data-on] .skr-hint{opacity:0;transform:translate(-50%,8px)}" +
  ".skr-card{position:absolute;z-index:7;left:46cqw;top:50%;width:min(30rem,38cqw);box-sizing:border-box;padding:clamp(20px,2.4cqw,34px);border-radius:6px;" +
  "background:color-mix(in oklab,var(--color-background) 60%,transparent);backdrop-filter:blur(22px) saturate(1.15);-webkit-backdrop-filter:blur(22px) saturate(1.15);" +
  "box-shadow:inset 0 0 0 1px color-mix(in oklab,var(--color-background) 60%,transparent),0 30px 60px -30px rgba(60,15,15,.35);" +
  "opacity:0;filter:blur(8px);transform:translate(0,calc(-50% + 18px));pointer-events:none;will-change:opacity,filter,transform;" +
  "transition:opacity .28s ease,filter .28s ease,transform .28s ease}" +
  ".skr-card[data-open]{opacity:1;filter:blur(0);transform:translate(0,-50%);pointer-events:auto;" +
  "transition:opacity .55s ease .8s,filter .6s ease .8s,transform .75s cubic-bezier(.2,.8,.2,1) .8s}" +
  "@container skr (max-aspect-ratio:4/5){.skr-card{left:var(--skr-g);right:var(--skr-g);top:auto;bottom:var(--skr-g);width:auto;transform:translate(0,18px)}.skr-card[data-open]{transform:translate(0,0)}}" +
  ".skr-eyebrow{font-size:10px;font-weight:700;letter-spacing:.24em;text-transform:uppercase;color:var(--skr-soft)}" +
  ".skr-name{margin:.35em 0 0;font-family:'Archivo Black','Arial Black','Helvetica Neue',Arial,sans-serif;font-weight:900;font-size:clamp(2rem,4cqw,3.3rem);line-height:.95;letter-spacing:.01em;text-transform:uppercase}" +
  ".skr-tag{margin:.9em 0 0;font-size:14px;font-weight:500;line-height:1.4}" +
  ".skr-specs{margin:1.1em 0 0;display:grid;grid-template-columns:auto 1fr;column-gap:2em;row-gap:.55em;font-size:13px}" +
  ".skr-specs dt{font-size:9.5px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:var(--skr-soft);align-self:center}" +
  ".skr-specs dd{margin:0;font-weight:500}" +
  ".skr-buy{margin-top:1.5em;display:flex;align-items:center;justify-content:space-between;gap:16px}" +
  ".skr-price{font-family:'Archivo Black','Arial Black','Helvetica Neue',Arial,sans-serif;font-weight:900;font-size:clamp(1.6rem,2.4cqw,2.1rem);line-height:1;font-variant-numeric:tabular-nums}" +
  ".skr-back{margin-top:1.4em;font-size:10px;font-weight:700;letter-spacing:.22em;text-transform:uppercase;color:var(--skr-soft);transition:color .2s ease}" +
  ".skr-back:hover{color:var(--skr-ink)}" +
  ".skr-card[data-open] .skr-st{animation:skr-up .7s cubic-bezier(.2,.8,.2,1) both;animation-delay:calc(.85s + var(--i)*55ms)}" +
  "@keyframes skr-up{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}" +
  ".skr-flip{position:relative;flex:none;width:11.5rem;height:2.9rem;perspective:520px;border-radius:999px}" +
  ".skr-air{position:absolute;inset:0;transform-style:preserve-3d;will-change:transform}" +
  ".skr-deck{position:absolute;inset:0;transform-style:preserve-3d;transform:rotateX(0deg);will-change:transform}" +
  ".skr-face{position:absolute;inset:0;border-radius:999px;overflow:hidden;backface-visibility:hidden;-webkit-backface-visibility:hidden}" +
  ".skr-face-top{display:grid;place-items:center;background:linear-gradient(180deg,color-mix(in oklab,var(--skr-ink) 86%,#fff),var(--skr-ink));color:var(--color-background);" +
  "font-size:11px;font-weight:800;letter-spacing:.18em;text-transform:uppercase;box-shadow:inset 0 1px 0 rgba(255,255,255,.18),inset 0 -2px 0 rgba(0,0,0,.25)}" +
  ".skr-face-bot{transform:rotateX(180deg) translateZ(1px);background:#1b1a1a}" +
  ".skr-face-bot img{position:absolute;left:50%;top:50%;width:2.9rem;height:11.5rem;transform:translate(-50%,-50%) rotate(90deg)}" +
  ".skr-truck{position:absolute;top:14%;bottom:14%;width:13%;border-radius:4px;background:linear-gradient(90deg,#b9b9bd,#f1f1f3 50%,#9d9da2);box-shadow:0 1px 2px rgba(0,0,0,.45)}" +
  ".skr-truck::before,.skr-truck::after{content:'';position:absolute;left:-12%;right:-12%;height:28%;border-radius:40%;background:#f4efe6;box-shadow:inset 0 -2px 0 rgba(0,0,0,.18)}" +
  ".skr-truck::before{top:-26%}.skr-truck::after{bottom:-26%}" +
  ".skr-shadow{position:absolute;left:10%;right:10%;bottom:-9px;height:8px;border-radius:50%;background:rgba(40,12,12,.28);filter:blur(4px)}" +
  ".skr-flip[data-go='on'] .skr-air,.skr-flip[data-go='off'] .skr-air{animation:skr-pop .8s cubic-bezier(.3,.7,.4,1) both}" +
  ".skr-flip[data-go='on'] .skr-deck{animation:skr-kick .8s cubic-bezier(.45,.05,.3,1) both}" +
  ".skr-flip[data-go='off'] .skr-deck{animation:skr-heel .8s cubic-bezier(.45,.05,.3,1) both}" +
  ".skr-flip[data-go] .skr-shadow{animation:skr-shadow .8s cubic-bezier(.3,.7,.4,1) both}" +
  "@keyframes skr-pop{0%{transform:translateY(0)}14%{transform:translateY(3px)}50%{transform:translateY(-34px)}84%{transform:translateY(0)}92%{transform:translateY(2px)}100%{transform:translateY(0)}}" +
  "@keyframes skr-kick{0%,14%{transform:rotateX(0deg) rotateZ(0deg)}50%{transform:rotateX(190deg) rotateZ(-5deg)}84%,100%{transform:rotateX(360deg) rotateZ(0deg)}}" +
  "@keyframes skr-heel{0%,14%{transform:rotateX(0deg) rotateZ(0deg)}50%{transform:rotateX(-190deg) rotateZ(5deg)}84%,100%{transform:rotateX(-360deg) rotateZ(0deg)}}" +
  "@keyframes skr-shadow{0%,14%{transform:scaleX(1);opacity:1}50%{transform:scaleX(.55);opacity:.35}84%,100%{transform:scaleX(1);opacity:1}}" +
  "@media (prefers-reduced-motion:reduce){.skr-scene,.skr-board,.skr-card,.skr-card[data-open],.skr-mark,.skr-sway,.skr-hint{transition-duration:.01s;transition-delay:0s}" +
  ".skr-board:hover .skr-sway,.skr-cartpill[data-bump],.skr-count span,.skr-card[data-open] .skr-st,.skr-flip[data-go] .skr-air,.skr-flip[data-go] .skr-deck,.skr-flip[data-go] .skr-shadow{animation:none}}"

const money = (n: number, c: string) => c + (Number.isInteger(n) ? String(n) : n.toFixed(2))

function KickflipButton({ inCart, image, onToggle }: { inCart: boolean; image: string; onToggle: (from: DOMRect) => void }) {
  const [go, setGo] = useState("")
  const [label, setLabel] = useState(inCart)
  const timers = useRef([] as number[])
  useEffect(() => {
    if (!go) setLabel(inCart)
  }, [inCart, go])
  useEffect(() => () => timers.current.forEach(clearTimeout), [])
  const click = (e: { currentTarget: HTMLButtonElement }) => {
    if (go) return
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    onToggle(e.currentTarget.getBoundingClientRect())
    if (reduce) {
      setLabel(!inCart)
      return
    }
    setGo(inCart ? "off" : "on")
    // the label face is hidden between ~25% and ~75% of the flip: swap it there
    timers.current.push(window.setTimeout(() => setLabel(!inCart), 400))
    timers.current.push(window.setTimeout(() => setGo(""), 820))
  }
  return (
    <button type="button" className="skr-flip" data-go={go || undefined} onClick={click} aria-pressed={inCart}>
      <span className="skr-shadow" />
      <span className="skr-air">
        <span className="skr-deck">
          <span className="skr-face skr-face-top">{label ? "In your cart" : "Add to cart"}</span>
          <span className="skr-face skr-face-bot" aria-hidden>
            <img src={image} alt="" draggable={false} />
            <span className="skr-truck" style={{ left: "17%" }} />
            <span className="skr-truck" style={{ right: "17%" }} />
          </span>
        </span>
      </span>
    </button>
  )
}

function DeckRackAddToCart({
  decks = DEFAULT_DECKS,
  wordmarkSrc = DR_BASE + "wordmark.webp",
  shopName = "Slab Skate Co.",
  currency = "$",
  defaultCart = [],
  onCartChange,
  height = "100svh",
  className = "",
  cartIds,
  onToggleDeck,
  onCheckout,
  focusSignal,
  closeSignal = 0,
}: DeckRackAddToCartProps) {
  const [sel, setSel] = useState(null as number | null)
  // the card stays mounted (inert while closed) so its frosted layer exists before the first reveal
  const [card, setCard] = useState(0 as number | null)
  const [open, setOpen] = useState(false)
  const [cartLocal, setCart] = useState(defaultCart)
  const cart = cartIds ?? cartLocal
  const [bump, setBump] = useState(0)
  const timer = useRef(0)
  const boards = useRef([] as (HTMLButtonElement | null)[])
  const addBtn = useRef(null as HTMLDivElement | null)

  const wait = (ms: number) => (window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : ms)

  const focus = (i: number) => {
    if (i === sel && open) return
    window.clearTimeout(timer.current)
    const go = () => {
      setSel(i)
      setCard(i)
      setOpen(true)
    }
    if (open) {
      setOpen(false)
      timer.current = window.setTimeout(go, wait(300))
    } else go()
  }
  const close = () => {
    if (sel === null) return
    window.clearTimeout(timer.current)
    const was = sel
    setOpen(false)
    timer.current = window.setTimeout(() => {
      setSel(null)
      boards.current[was]?.focus({ preventScroll: true })
    }, wait(260))
  }

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") close()
    }
    window.addEventListener("keydown", key)
    return () => window.removeEventListener("keydown", key)
  })
  useEffect(() => () => window.clearTimeout(timer.current), [])
  useEffect(() => {
    if (focusSignal) focus(focusSignal.i)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusSignal])
  useEffect(() => {
    if (closeSignal) close()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [closeSignal])
  useEffect(() => {
    if (!open) return
    const t = window.setTimeout(() => addBtn.current?.querySelector("button")?.focus({ preventScroll: true }), wait(700))
    return () => window.clearTimeout(t)
  }, [open, card])

  const [shown, setShown] = useState(defaultCart.length)
  const toggle = (id: string, from?: DOMRect) => {
    if (onToggleDeck && from) return onToggleDeck(id, from)
    const next = cart.includes(id) ? cart.filter((x) => x !== id) : [...cart, id]
    setCart(next)
    onCartChange?.(next)
    // the count rolls over as the deck lands, not when it leaves the ground
    window.setTimeout(() => {
      setShown(next.length)
      setBump((b) => b + 1)
    }, wait(640))
  }

  const d = card === null ? null : decks[card]
  const deckW = DECK_H * DECK_RATIO

  return (
    <div className={"skr-root " + className} style={{ height }} data-on={sel !== null ? "" : undefined}>
      <style>{DR_CSS}</style>
      <div
        className="skr-scene"
        data-on={sel !== null ? "" : undefined}
        style={{ "--skr-cx": sel === null ? 0 : decks[sel].x } as React.CSSProperties}
        onClick={close}
      >
        <div className="skr-at skr-arch" style={{ "--x": 0, "--y": -27, "--w": 80, "--h": 76 } as React.CSSProperties} />
        <div className="skr-at skr-mark" style={{ "--x": 0, "--y": 0.5, "--w": MARK_W, "--h": MARK_W * MARK_RATIO } as React.CSSProperties}>
          <img src={wordmarkSrc} alt={shopName} draggable={false} />
        </div>
        {decks.map((deck, i) => (
          <button
            key={deck.id}
            ref={(el) => {
              boards.current[i] = el
            }}
            type="button"
            className="skr-at skr-board"
            data-sel={sel === i ? "" : undefined}
            style={{ "--x": deck.x, "--y": 0, "--w": deckW, "--h": DECK_H } as React.CSSProperties}
            aria-label={deck.name + ", " + money(deck.price, currency) + " — view deck"}
            aria-expanded={sel === i}
            onClick={(e) => {
              e.stopPropagation()
              focus(i)
            }}
          >
            <span className="skr-rod" />
            <span className="skr-knob" />
            <span className="skr-sway">
              <span className="skr-shade" />
              <img src={deck.image} alt="" draggable={false} />
            </span>
            <span className="skr-clip skr-clip-l" />
            <span className="skr-clip skr-clip-r" />
          </button>
        ))}
      </div>

      <div className="skr-top">
        <span className="skr-brand">{shopName}</span>
        <span className="skr-cartpill" key={bump} data-bump={bump ? "" : undefined} aria-live="polite">
          Cart
          <span className="skr-count">
            <span key={shown}>{shown}</span>
          </span>
        </span>
      </div>
      <p className="skr-hint" aria-hidden>
        Pick a deck off the wall
      </p>

      <div className="skr-card" data-open={open ? "" : undefined} role="dialog" aria-label={d ? d.name : "Deck"} aria-hidden={!open} {...(open ? {} : { inert: "" })}>
        {d && card !== null && (
          <div key={d.id}>
            <p className="skr-eyebrow skr-st" style={{ "--i": 0 } as React.CSSProperties}>
              {shopName} · Deck {String(card + 1).padStart(2, "0")}
            </p>
            <h2 className="skr-name skr-st" style={{ "--i": 1 } as React.CSSProperties}>
              {d.name}
            </h2>
            <p className="skr-tag skr-st" style={{ "--i": 2 } as React.CSSProperties}>
              {d.tagline}
            </p>
            <dl className="skr-specs skr-st" style={{ "--i": 3 } as React.CSSProperties}>
              {d.specs.map(([k, v]) => (
                <div key={k} style={{ display: "contents" }}>
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
            <div className="skr-buy skr-st" style={{ "--i": 4 } as React.CSSProperties} ref={addBtn}>
              <span className="skr-price">{money(d.price, currency)}</span>
              <KickflipButton inCart={cart.includes(d.id)} image={d.image} onToggle={(r) => toggle(d.id, r)} />
            </div>
            <button type="button" className="skr-back skr-st" style={{ "--i": 5 } as React.CSSProperties} onClick={close}>
              Back to the wall
            </button>
            {onCheckout && cart.includes(d.id) ? (
              <button type="button" className="skr-go skr-st" style={{ "--i": 6 } as React.CSSProperties} onClick={onCheckout}>
                Checkout →
              </button>
            ) : null}
          </div>
        )}
      </div>
    </div>
  )
}

/*
 * Flipboard Checkout Counter
 * A shop counter with the cart on it. The decks you picked drop onto the wood top, a split-flap board lists
 * them character by character, and the total flaps over as quantities change. Click a deck (or take its
 * quantity to zero) and it tips onto its edge and tumbles off the front. "Checkout" slides a frosted drawer
 * out of the counter; Pay is a little deck that kickflips, the drawer slides home and the board flaps to
 * a thank-you.
 *
 * Only the counter top is 3D (a perspective plane the decks lie on). The board, plaque and drawer stay flat
 * so their text renders crisp. All sizes come from container units; nothing reads layout.
 */

const FC_BASE = "https://kedhar-components.pages.dev/slab-skate-shop-template/"

type CounterProduct = { id: string; name: string; price: number; image: string }
type CartLine = { id: string; qty: number }
type CheckoutDetails = { email: string; address: string; card: string; expiry: string; cvc: string }

const DEFAULT_PRODUCTS: CounterProduct[] = [
  { id: "onyx", name: "Onyx", price: 68, image: FC_BASE + "deck-onyx.webp" },
  { id: "chalk", name: "Chalk", price: 64, image: FC_BASE + "deck-chalk.webp" },
  { id: "garnet", name: "Garnet", price: 72, image: FC_BASE + "deck-garnet.webp" },
  { id: "fern", name: "Fern", price: 70, image: FC_BASE + "deck-fern.webp" },
  { id: "teak", name: "Teak", price: 84, image: FC_BASE + "deck-teak.webp" },
]

type FlipboardCheckoutCounterProps = {
  products?: CounterProduct[]
  defaultItems?: CartLine[]
  shopName?: string
  /** Optional wall art behind the counter (a transparent wordmark reads best). */
  backdropSrc?: string
  currency?: string
  /** Prefilled checkout fields (the demo fills them so Pay works first time). */
  defaultDetails?: Partial<CheckoutDetails>
  onCartChange?: (lines: CartLine[]) => void
  onPay?: (order: { id: string; lines: CartLine[]; total: number; details: CheckoutDetails }) => void
  height?: string
  className?: string
  /** template: the cart lives in the page, the camera decides when the counter comes alive */
  linesIn?: CartLine[]
  onLines?: (lines: CartLine[]) => void
  live?: boolean
  openSignal?: number
  onDrawer?: (open: boolean) => void
  onNewOrder?: () => void
}

// #region counter-logic
const LEFT = 11
const RIGHT = 7
const ROWS = 5
type Row = { left: string; right: string }

function fcCartTotal(lines: { id: string; qty: number }[], products: { id: string; price: number }[]) {
  return lines.reduce((s, l) => s + l.qty * (products.find((p) => p.id === l.id)?.price ?? 0), 0)
}

/** One split-flap row: name and quantity in LEFT cells, the line price right-aligned in RIGHT cells. */
function rowText(name: string, qty: number, price: number, currency: string): Row {
  const left = name.toUpperCase().slice(0, 8).padEnd(9, " ") + (qty > 1 ? "X" + qty : "").padEnd(2, " ")
  const right = (currency + qty * price).slice(-RIGHT).padStart(RIGHT, " ")
  return { left, right }
}

function pair(a: string, b: string): Row {
  return { left: a.toUpperCase().slice(0, LEFT).padEnd(LEFT, " "), right: b.toUpperCase().slice(-RIGHT).padStart(RIGHT, " ") }
}

function setQty(lines: { id: string; qty: number }[], id: string, qty: number) {
  const q = Math.max(0, Math.min(9, qty))
  const has = lines.some((l) => l.id === id)
  const next = has ? lines.map((l) => (l.id === id ? { ...l, qty: q } : l)) : [...lines, { id, qty: q }]
  return next.filter((l) => l.qty > 0)
}

function validate(d: { email: string; address: string; card: string; expiry: string; cvc: string }) {
  const bad: string[] = []
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email.trim())) bad.push("email")
  if (d.address.trim().length < 4) bad.push("address")
  if (d.card.replace(/\D/g, "").length < 12) bad.push("card")
  if (!/^(0[1-9]|1[0-2])\s*\/\s*\d{2}$/.test(d.expiry.trim())) bad.push("expiry")
  if (!/^\d{3,4}$/.test(d.cvc.trim())) bad.push("cvc")
  return bad
}
// #endregion

const FC_GLYPHS = "ABCDEFGHIJKLMNOPRSTUVWXYZ0123456789$"
const fcReduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches

const FC_E = "cubic-bezier(.2,.8,.2,1)"
const FC_CSS =
  "@property --skc-oy{syntax:'<number>';inherits:true;initial-value:0}" +
  ".skc-root{position:relative;overflow:hidden;container:skc/size;isolation:isolate;" +
  "--skc-wall:color-mix(in oklab,var(--color-background) 86%,#d9a79e);--skc-floor:color-mix(in oklab,var(--color-background) 72%,#7d6f6a);" +
  "--skc-ink:var(--color-foreground);--skc-soft:var(--color-muted-foreground);--skc-g:clamp(16px,3cqw,40px);" +
  "background:var(--skc-wall);color:var(--skc-ink);" +
  "font-family:Inter,'Helvetica Neue',Arial,system-ui,sans-serif;-webkit-font-smoothing:antialiased}" +
  ".skc-root img{max-width:none;display:block;pointer-events:none;-webkit-user-drag:none}" +
  ".skc-root :where(button){font:inherit;color:inherit;background:none;border:0;padding:0;margin:0;cursor:pointer;-webkit-tap-highlight-color:transparent}" +
  ".skc-root :where(button,input):focus-visible{outline:2px solid #c9a35b;outline-offset:2px}" +
  ".skc-scene{position:absolute;inset:0;--u:min(1cqw,1.65cqh);--du:var(--u);--skc-oy:0;transition:--skc-oy .9s " + FC_E + ";" +
  "--cw:76;--ct:7;--cf:20;--dep:30;--dx:19;--dy:-6.5;--dw:33;--dh:17;--px:19;--py:4.6;--s0:-28;--sg:9.4;--sd:14}" +
  ".skc-scene[data-drawer]{--skc-oy:-7;transition:--skc-oy .8s " + FC_E + "}" +
  "@container skc (max-aspect-ratio:4/5){.skc-scene .skc-mark{display:none}.skc-scene[data-drawer]{--skc-oy:-9}.skc-scene{--u:1.24cqw;--du:calc(1.75*var(--u));--ct:17;--cf:22;--dx:0;--dy:-24;--dw:33;--dh:17;--px:23;--py:13.8;--s0:-27;--sg:10.5;--sd:14}}" +
  ".skc-x{position:absolute;left:calc(50% + var(--x)*var(--u));top:calc(50% + var(--skc-oy)*var(--u) + var(--y)*var(--u));transform:translate(-50%,-50%)}" +
  ".skc-mark{position:absolute;left:calc(50% - 14*var(--u));top:calc(50% + var(--skc-oy)*var(--u) + (var(--ct) - 24)*var(--u));width:calc(34*var(--u));transform:translate(-50%,-50%);opacity:.5;filter:blur(2px);transition:opacity .5s ease}" +
  ".skc-scene[data-drawer] .skc-mark{opacity:0}" +
  ".skc-floor{position:absolute;left:0;right:0;bottom:0;top:calc(50% + var(--skc-oy)*var(--u) + (var(--ct) - 18)*var(--u));background:linear-gradient(180deg,color-mix(in oklab,var(--skc-floor) 78%,var(--skc-wall)),var(--skc-floor) 60%);box-shadow:0 -1px 0 color-mix(in oklab,var(--skc-floor) 60%,var(--skc-wall))}" +
  ".skc-shadow{left:50%;top:calc(50% + var(--skc-oy)*var(--u) + (var(--ct) + var(--cf))*var(--u));width:calc((var(--cw) + 8)*var(--u));height:calc(5*var(--u));transform:translate(-50%,-50%);position:absolute;border-radius:50%;background:radial-gradient(closest-side,rgba(30,12,10,.42),transparent)}" +
  ".skc-front{position:absolute;left:calc(50% - var(--cw)/2*var(--u));top:calc(50% + var(--skc-oy)*var(--u) + var(--ct)*var(--u));width:calc(var(--cw)*var(--u));height:calc(var(--cf)*var(--u));box-sizing:border-box;" +
  "background:linear-gradient(180deg,#f3ede4,#e7ddd0);border-radius:0 0 calc(.5*var(--u)) calc(.5*var(--u));box-shadow:inset 0 calc(.6*var(--u)) calc(1.2*var(--u)) rgba(60,30,20,.25),inset 0 -2px 0 rgba(0,0,0,.08);" +
  "display:grid;grid-template-columns:22% 1fr 22%;gap:calc(1.4*var(--u));padding:calc(1.6*var(--u)) calc(1.8*var(--u))}" +
  ".skc-front > *{transition:opacity .3s ease .4s}" +
  ".skc-scene[data-drawer] .skc-front > *{opacity:0;transition:opacity .18s ease}" +
  ".skc-flute{border-radius:3px;background:repeating-linear-gradient(90deg,#efe7dc 0,#fbf7f1 calc(.5*var(--u)),#d8ccbd calc(1*var(--u)),#efe7dc calc(1.3*var(--u)));box-shadow:inset 0 0 0 1px rgba(80,50,30,.08)}" +
  ".skc-plate{display:grid;place-content:center;justify-items:center;gap:calc(.9*var(--u));border:1px solid rgba(80,50,30,.22);border-radius:2px;color:#4a3320;text-align:center}" +
  ".skc-plate b{font-family:'Archivo Black','Arial Black','Helvetica Neue',Arial,sans-serif;font-weight:900;font-size:calc(2.7*var(--u));letter-spacing:.32em;margin-right:-.32em;color:#6b4a22}" +
  ".skc-plate span{font-size:calc(.62*var(--u));font-weight:700;letter-spacing:.28em;text-transform:uppercase;opacity:.8}" +
  ".skc-lip{position:absolute;left:calc(50% - (var(--cw)/2 + .6)*var(--u));top:calc(50% + var(--skc-oy)*var(--u) + (var(--ct) - .9)*var(--u));width:calc((var(--cw) + 1.2)*var(--u));height:calc(1.1*var(--u));border-radius:3px;background:linear-gradient(180deg,#3a2414,#1e120a);box-shadow:0 2px 3px rgba(0,0,0,.25)}" +
  ".skc-top{position:absolute;z-index:2;left:calc(50% - (var(--cw)/2 + .6)*var(--u));top:calc(50% + var(--skc-oy)*var(--u) + (var(--ct) - .9 - var(--dep))*var(--u));width:calc((var(--cw) + 1.2)*var(--u));height:calc(var(--dep)*var(--u));" +
  "transform-origin:50% 100%;transform:perspective(calc(120*var(--u))) rotateX(58deg);transform-style:preserve-3d;" +
  "background:linear-gradient(180deg,rgba(255,255,255,.08),rgba(0,0,0,.18)),repeating-linear-gradient(90deg,#5a3720 0,#6e4529 calc(.35*var(--u)),#4b2c17 calc(.7*var(--u)),#633d24 calc(1.1*var(--u)));border-radius:4px 4px 0 0}" +
  ".skc-deck{position:absolute;width:calc(6.2*var(--u));height:calc(23.5*var(--u));left:calc((var(--cw)/2 + .6 + var(--s0) + var(--slot)*var(--sg))*var(--u));top:calc((var(--dep) - var(--sd))*var(--u));" +
  "transform-style:preserve-3d;transform:translate3d(-50%,-50%,calc(var(--k)*.55*var(--u)))}" +
  ".skc-deck-in{position:absolute;inset:0;transform-style:preserve-3d;rotate:z var(--rz)}" +
  ".skc-deck-in img{width:100%;height:100%;filter:drop-shadow(calc(.5*var(--u)) calc(.6*var(--u)) calc(.5*var(--u)) rgba(15,6,2,.5))}" +
  ".skc-deck[data-in]{animation:skc-drop .95s cubic-bezier(.3,.6,.3,1) both;animation-delay:var(--d)}" +
  ".skc-deck[data-out]{animation:skc-off 1.9s cubic-bezier(.45,0,.55,1) both;pointer-events:none}" +
  ".skc-deck button{position:absolute;inset:0;border-radius:40%}" +
  "@keyframes skc-drop{0%{opacity:0;transform:translate3d(-50%,-90%,calc(34*var(--u))) rotateX(-30deg) rotateY(24deg)}" +
  "55%{opacity:1;transform:translate3d(-50%,-50%,calc(var(--k)*.55*var(--u))) rotateX(3deg) rotateY(-2deg)}" +
  "72%{transform:translate3d(-50%,-50%,calc((var(--k)*.55 + 1.6)*var(--u))) rotateX(-2deg) rotateY(1deg)}" +
  "86%,100%{opacity:1;transform:translate3d(-50%,-50%,calc(var(--k)*.55*var(--u))) rotateX(0) rotateY(0)}}" +
  "@keyframes skc-off{0%{opacity:1;transform:translate3d(-50%,-50%,calc(var(--k)*.55*var(--u))) rotateY(0) rotateX(0)}" +
  "13%{transform:translate3d(-50%,-49%,calc(4*var(--u))) rotateY(58deg) rotateX(0)}" +
  "32%{transform:translate3d(-50%,calc(-50% + (var(--sd) + 1)*var(--u)),calc(5*var(--u))) rotateY(130deg) rotateX(-28deg)}" +
  "52%{transform:translate3d(-50%,calc(-50% + (var(--sd) + 5)*var(--u)),calc(-10*var(--u))) rotateY(176deg) rotateX(-12deg)}" +
  "64%{transform:translate3d(-50%,calc(-50% + (var(--sd) + 8)*var(--u)),calc(-19*var(--u))) rotateY(180deg) rotateX(0)}" +
  "69%{opacity:1;transform:translate3d(-50%,calc(-50% + (var(--sd) + 8.3)*var(--u)),calc(-18*var(--u))) rotateY(180deg) rotateX(2deg)}" +
  "74%{opacity:1;transform:translate3d(-50%,calc(-50% + (var(--sd) + 8.5)*var(--u)),calc(-19*var(--u))) rotateY(180deg) rotateX(0)}" +
  "100%{opacity:0;transform:translate3d(-50%,calc(-50% + (var(--sd) + 8.5)*var(--u)),calc(-19*var(--u))) rotateY(180deg) rotateX(0)}}" +
  ".skc-board{position:absolute;z-index:3;left:calc(50% + var(--dx)*var(--u));top:calc(50% + var(--skc-oy)*var(--u) + var(--dy)*var(--u));width:calc(var(--dw)*var(--du));height:calc(var(--dh)*var(--du));transform:translate(-50%,-50%);" +
  "box-sizing:border-box;padding:calc(.9*var(--du)) calc(1.1*var(--du));border-radius:calc(.35*var(--du));background:linear-gradient(180deg,#232120,#121110);" +
  "box-shadow:0 0 0 calc(.32*var(--du)) #b48a3e,0 0 0 calc(.42*var(--du)) #6e5221,0 calc(1.2*var(--du)) calc(2*var(--du)) rgba(20,8,4,.35);display:grid;grid-template-rows:auto 1fr auto;gap:calc(.5*var(--du));color:#f1e9da}" +
  ".skc-board-label{font-size:calc(.56*var(--du));font-weight:700;letter-spacing:.3em;text-transform:uppercase;color:#a99c86}" +
  ".skc-rows{display:grid;grid-template-rows:repeat(5,1fr);gap:calc(.22*var(--du))}" +
  ".skc-row{display:flex;align-items:center;gap:calc(.5*var(--du));border-bottom:1px solid rgba(255,255,255,.07);box-shadow:0 1px 0 rgba(0,0,0,.6)}" +
  ".skc-flaps{display:flex;flex:none}.skc-gap{flex:1}" +
  ".skc-cell{position:relative;flex:none;width:calc(.86*var(--du));display:grid;place-items:center;height:calc(1.75*var(--du));font-family:'Archivo Black','Arial Black','Helvetica Neue',Arial,sans-serif;font-weight:900;font-size:calc(1.08*var(--du));line-height:1;perspective:calc(6*var(--du))}" +
  ".skc-cell i{font-style:normal;display:block;transform-origin:50% 0;animation:skc-flap .11s cubic-bezier(.3,.7,.4,1) both}" +
  "@keyframes skc-flap{from{transform:rotateX(-80deg);opacity:.25}to{transform:rotateX(0);opacity:1}}" +
  ".skc-keys{display:flex;gap:calc(.25*var(--du));opacity:0;transition:opacity .3s ease}" +
  ".skc-row[data-live] .skc-keys{opacity:1}" +
  ".skc-key{width:calc(1.15*var(--du));height:calc(1.15*var(--du));border-radius:50%;display:grid;place-items:center;font-size:calc(.8*var(--du));font-weight:800;line-height:1;color:#2a1d0c;background:radial-gradient(circle at 35% 30%,#f2d595,#b48a3e 70%);box-shadow:0 1px 2px rgba(0,0,0,.5)}" +
  ".skc-key:disabled{opacity:.35;cursor:default}" +
  ".skc-total{display:flex;align-items:center;justify-content:space-between;border-top:1px solid rgba(255,255,255,.12);padding-top:calc(.4*var(--du))}" +
  ".skc-total .skc-flaps{margin-right:calc(3.05*var(--du))}" +
  ".skc-plaque{position:absolute;z-index:4;left:calc(50% + var(--px)*var(--u));top:calc(50% + var(--skc-oy)*var(--u) + var(--py)*var(--u));transform:translate(-50%,-50%);min-width:calc(9.5*var(--u));height:max(28px,calc(2.3*var(--u)));padding:0 max(12px,calc(1.2*var(--u)));border-radius:3px;" +
  "font-family:'Archivo Black','Arial Black','Helvetica Neue',Arial,sans-serif;font-size:max(10px,calc(.78*var(--u)));white-space:nowrap;letter-spacing:.24em;text-transform:uppercase;color:#f1e9da;background:linear-gradient(180deg,#2a2725,#141312);box-shadow:0 0 0 1px #b48a3e,0 calc(.4*var(--u)) calc(.8*var(--u)) rgba(20,8,4,.4);transition:transform .25s " + FC_E + ",box-shadow .25s ease}" +
  ".skc-plaque:hover{transform:translate(-50%,calc(-50% - 2px))}" +
  ".skc-plaque:disabled{opacity:.45;cursor:default;transform:translate(-50%,-50%)}" +
  ".skc-drawer{position:absolute;z-index:6;left:calc(50% - (var(--cw)/2 - 1.5)*var(--u));top:calc(50% + (var(--skc-oy) + var(--ct) + .6)*var(--u));min-height:calc((var(--cf) - .6)*var(--u));width:calc((var(--cw) - 3)*var(--u));box-sizing:border-box;" +
  "padding:clamp(18px,2.2cqw,32px);border-radius:6px;display:grid;grid-template-columns:minmax(0,.8fr) minmax(0,1.2fr);gap:clamp(16px,2.6cqw,40px);color:#211a14;" +
  "background:color-mix(in oklab,#f6efe5 95%,transparent);will-change:transform,opacity,clip-path;" +
  "box-shadow:inset 0 0 0 1px rgba(255,255,255,.6),0 30px 60px -24px rgba(40,15,8,.45);transform-origin:50% 100%;" +
  "opacity:0;transform:perspective(1200px) translateY(38%) rotateX(-14deg);clip-path:inset(0 0 100% 0 round 6px);visibility:hidden;" +
  "transition:opacity .35s ease,transform .55s cubic-bezier(.6,0,.8,.4),clip-path .55s cubic-bezier(.6,0,.8,.4),visibility 0s linear .55s}" +
  ".skc-drawer[data-open]{opacity:1;transform:perspective(1200px) translateY(0) rotateX(0deg);clip-path:inset(0 0 0 0 round 6px);visibility:visible;" +
  "transition:opacity .45s ease .15s,transform .85s " + FC_E + ",clip-path .75s " + FC_E + ",visibility 0s}" +
  "@container skc (max-aspect-ratio:4/5){.skc-drawer{left:var(--skc-g);width:calc(100% - 2*var(--skc-g));top:auto;min-height:0;bottom:var(--skc-g);grid-template-columns:1fr;gap:14px}.skc-note{display:none}.skc-form{grid-template-columns:1fr 1fr}.skc-form .skc-f-card{grid-column:1/-1}.skc-form .skc-f-expiry{grid-column:1/2}.skc-form .skc-f-cvc{grid-column:2/3}}" +
  ".skc-eyebrow{font-size:10px;font-weight:700;letter-spacing:.24em;text-transform:uppercase;opacity:.6}" +
  ".skc-h{margin:.4em 0 0;font-family:'Archivo Black','Arial Black','Helvetica Neue',Arial,sans-serif;font-weight:900;font-size:clamp(1.6rem,3cqw,2.6rem);line-height:1;letter-spacing:.01em}" +
  ".skc-note{margin:.9em 0 0;font-size:13px;line-height:1.55;opacity:.8}" +
  ".skc-sum{margin-top:1em;font-size:12px;font-weight:700;letter-spacing:.14em;text-transform:uppercase}" +
  ".skc-form{display:grid;grid-template-columns:1fr 6.5em 4.5em;column-gap:18px;row-gap:12px;align-content:start}" +
  ".skc-field{display:grid;gap:4px;grid-column:1/-1}.skc-f-card{grid-column:1/2}.skc-f-expiry{grid-column:2/3}.skc-f-cvc{grid-column:3/4}" +
  ".skc-field span{font-size:9.5px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;opacity:.6}" +
  ".skc-field input{all:unset;box-sizing:border-box;width:100%;font-size:14px;padding:4px 0 6px;border-bottom:1px solid rgba(33,26,20,.3);transition:border-color .2s ease}" +
  ".skc-field input:focus{border-color:#211a14}" +
  ".skc-field[data-bad] input{border-color:#c2263b}" +
  ".skc-field[data-bad] span{color:#c2263b;opacity:1}" +
  ".skc-form-foot{grid-column:1/-1;display:flex;justify-content:flex-end;align-items:center;gap:16px;margin-top:6px}" +
  ".skc-back{margin-top:1.4em;font-size:10px;font-weight:700;letter-spacing:.22em;text-transform:uppercase;opacity:.6;transition:opacity .2s ease}" +
  ".skc-back:hover{opacity:1}" +
  ".skc-flip{position:relative;flex:none;width:10.5rem;height:2.8rem;perspective:520px;color:#f1e9da;border-radius:999px}" +
  ".skc-air,.skc-spin{position:absolute;inset:0;transform-style:preserve-3d;will-change:transform}" +
  ".skc-face{position:absolute;inset:0;border-radius:999px;overflow:hidden;backface-visibility:hidden;-webkit-backface-visibility:hidden}" +
  ".skc-face-top{display:grid;place-items:center;background:linear-gradient(180deg,#2c2a28,#121110);font-size:11px;font-weight:800;letter-spacing:.18em;text-transform:uppercase;box-shadow:inset 0 1px 0 rgba(255,255,255,.16)}" +
  ".skc-face-bot{transform:rotateX(180deg) translateZ(1px);background:#1b1a1a}" +
  ".skc-face-bot img{position:absolute;left:50%;top:50%;width:2.8rem;height:10.5rem;transform:translate(-50%,-50%) rotate(90deg)}" +
  ".skc-truck{position:absolute;top:14%;bottom:14%;width:13%;border-radius:4px;background:linear-gradient(90deg,#b9b9bd,#f1f1f3 50%,#9d9da2);box-shadow:0 1px 2px rgba(0,0,0,.45)}" +
  ".skc-truck::before,.skc-truck::after{content:'';position:absolute;left:-12%;right:-12%;height:28%;border-radius:40%;background:#f4efe6}" +
  ".skc-truck::before{top:-26%}.skc-truck::after{bottom:-26%}" +
  ".skc-fshadow{position:absolute;left:10%;right:10%;bottom:-9px;height:8px;border-radius:50%;background:rgba(40,12,12,.28);filter:blur(4px)}" +
  ".skc-flip[data-go='kick'] .skc-air{animation:skc-pop .8s cubic-bezier(.3,.7,.4,1) both}" +
  ".skc-flip[data-go='kick'] .skc-spin{animation:skc-kick .8s cubic-bezier(.45,.05,.3,1) both}" +
  ".skc-flip[data-go='kick'] .skc-fshadow{animation:skc-sh .8s cubic-bezier(.3,.7,.4,1) both}" +
  ".skc-flip[data-go='bail'] .skc-spin{animation:skc-bail .5s cubic-bezier(.3,.7,.4,1) both}" +
  "@keyframes skc-pop{0%{transform:translateY(0)}14%{transform:translateY(3px)}50%{transform:translateY(-32px)}84%{transform:translateY(0)}92%{transform:translateY(2px)}100%{transform:translateY(0)}}" +
  "@keyframes skc-kick{0%,14%{transform:rotateX(0deg) rotateZ(0deg)}50%{transform:rotateX(190deg) rotateZ(-5deg)}84%,100%{transform:rotateX(360deg) rotateZ(0deg)}}" +
  "@keyframes skc-sh{0%,14%{transform:scaleX(1);opacity:1}50%{transform:scaleX(.55);opacity:.35}84%,100%{transform:scaleX(1);opacity:1}}" +
  "@keyframes skc-bail{0%,100%{transform:rotateZ(0)}20%{transform:rotateZ(-7deg) translateY(-6px)}45%{transform:rotateZ(5deg)}70%{transform:rotateZ(-2deg)}}" +
  ".skc-top-ui{position:absolute;z-index:7;left:var(--skc-g);right:var(--skc-g);top:var(--skc-g);display:flex;justify-content:space-between;align-items:center;font-size:11px;font-weight:700;letter-spacing:.22em;text-transform:uppercase;pointer-events:none}" +
  "@media (prefers-reduced-motion:reduce){.skc-deck[data-in],.skc-deck[data-out],.skc-cell i,.skc-flip[data-go] .skc-air,.skc-flip[data-go] .skc-spin,.skc-flip[data-go] .skc-fshadow{animation:none}" +
  ".skc-deck[data-out]{opacity:0}.skc-scene,.skc-scene[data-drawer],.skc-mark,.skc-front > *,.skc-scene[data-drawer] .skc-front > *,.skc-drawer,.skc-drawer[data-open],.skc-keys,.skc-plaque{transition-duration:.01s}}"

function FcFlap({ ch, delay }: { ch: string; delay: number }) {
  const [c, setC] = useState(" ")
  const [n, setN] = useState(0)
  const cur = useRef(" ")
  useEffect(() => {
    if (ch === cur.current) return
    const set = (x: string) => {
      cur.current = x
      setC(x)
      setN((v) => v + 1)
    }
    if (fcReduced()) {
      set(ch)
      return
    }
    const ids: number[] = []
    let step = 0
    const steps = 2 + Math.floor(Math.random() * 3)
    const tick = () => {
      step++
      if (step > steps) return set(ch)
      set(FC_GLYPHS[Math.floor(Math.random() * FC_GLYPHS.length)])
      ids.push(window.setTimeout(tick, 52))
    }
    ids.push(window.setTimeout(tick, delay))
    return () => ids.forEach(clearTimeout)
  }, [ch, delay])
  return (
    <span className="skc-cell">
      <i key={n}>{c === " " ? " " : c}</i>
    </span>
  )
}

function FlapRow({ text, delay }: { text: string; delay: number }) {
  return (
    <span className="skc-flaps">
      {text.split("").map((ch, i) => (
        <FcFlap key={i} ch={ch} delay={delay + i * 26} />
      ))}
    </span>
  )
}

type Ghost = { key: string; slot: number; k: number; image: string; rz: number }

function FlipboardCheckoutCounter({
  products = DEFAULT_PRODUCTS,
  defaultItems = [
    { id: "onyx", qty: 1 },
    { id: "garnet", qty: 1 },
  ],
  shopName = "Slab Skate Co.",
  backdropSrc = FC_BASE + "wordmark.webp",
  currency = "$",
  defaultDetails = {},
  onCartChange,
  onPay,
  height = "100svh",
  className = "",
  linesIn,
  onLines,
  live: liveIn = true,
  openSignal = 0,
  onDrawer,
  onNewOrder,
}: FlipboardCheckoutCounterProps) {
  const [linesLocal, setLinesLocal] = useState(defaultItems)
  const lines = linesIn ?? linesLocal
  const setLines = (n: CartLine[]) => (onLines ? onLines(n) : setLinesLocal(n))
  const [ghosts, setGhosts] = useState([] as Ghost[])
  const [mounted, setMounted] = useState(false)
  const [drawer, setDrawer] = useState(false)
  const [done, setDone] = useState(null as null | { id: string; total: number })
  const [go, setGo] = useState("")
  const [paid, setPaid] = useState(false)
  const [bad, setBad] = useState([] as string[])
  const [details, setDetails] = useState({ email: "", address: "", card: "", expiry: "", cvc: "", ...defaultDetails } as CheckoutDetails)
  const slots = useRef({} as Record<string, number>)
  const timers = useRef([] as number[])
  const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, fcReduced() ? 0 : ms))

  useEffect(() => {
    const t = window.setTimeout(() => setMounted(true), 60)
    return () => {
      window.clearTimeout(t)
      timers.current.forEach(clearTimeout)
    }
  }, [])
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDrawer(false)
    }
    window.addEventListener("keydown", key)
    return () => window.removeEventListener("keydown", key)
  }, [])

  useEffect(() => {
    if (openSignal) setDrawer(true)
  }, [openSignal])
  useEffect(() => {
    if (onDrawer) onDrawer(drawer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawer])

  // stable counter slots: a deck keeps its spot while others come and go
  for (const l of lines) {
    if (slots.current[l.id] === undefined) {
      const used = new Set(Object.values(slots.current))
      let s = 0
      while (used.has(s)) s++
      slots.current[l.id] = s
    }
  }
  const product = (id: string) => products.find((p) => p.id === id)
  const total = fcCartTotal(lines, products)
  const rz = (id: string, k: number) => 60 + ((id.charCodeAt(0) * 7 + k * 11) % 9) - 4

  const update = (id: string, qty: number) => {
    if (done || go) return
    const before = lines.find((l) => l.id === id)?.qty ?? 0
    const next = setQty(lines, id, qty)
    const after = next.find((l) => l.id === id)?.qty ?? 0
    if (after < before) {
      const p = product(id)
      const slot = slots.current[id]
      const gone: Ghost[] = []
      for (let k = after; k < Math.min(before, 3); k++) gone.push({ key: id + "-" + k + "-" + Date.now(), slot, k, image: p?.image ?? "", rz: rz(id, k) })
      setGhosts((g) => [...g, ...gone])
      later(() => setGhosts((g) => g.filter((x) => !gone.includes(x))), 2000)
      if (after === 0) delete slots.current[id]
    }
    setLines(next)
    onCartChange?.(next)
  }

  const pay = () => {
    if (go) return
    const b = validate(details)
    setBad(b)
    if (b.length) {
      setGo("bail")
      later(() => setGo(""), 520)
      return
    }
    const order = { id: "SL-" + String(2600 + ((total * 7 + lines.length * 13) % 400)), total }
    setGo("kick")
    later(() => setPaid(true), 400)
    later(() => setGo(""), 820)
    later(() => setDrawer(false), 1000)
    later(() => {
      setDone(order)
      onPay?.({ id: order.id, lines, total, details })
    }, 1500)
  }

  const reset = () => {
    setDone(null)
    setPaid(false)
    setGhosts([])
    slots.current = {}
    setLines([])
    if (onNewOrder) onNewOrder()
    else later(() => setLines(defaultItems), 350)
  }

  const live = mounted && liveIn
  const rows: Row[] = []
  if (done) {
    rows.push(pair("Thank you", ""), pair("Order", done.id), pair("Ships in", "48 H"))
  } else if (live) {
    for (const l of lines.slice(0, ROWS)) {
      const p = product(l.id)
      if (p) rows.push(rowText(p.name, l.qty, p.price, currency))
    }
    if (!lines.length) rows.push(pair("Cart empty", ""))
  }
  while (rows.length < ROWS) rows.push(pair("", ""))
  const shownTotal = done ? done.total : live ? total : 0
  const totalText = (currency + shownTotal).padStart(5, " ").slice(-5)
  const count = lines.reduce((s, l) => s + l.qty, 0)

  return (
    <div className={"skc-root " + className} style={{ height }}>
      <style>{FC_CSS}</style>
      <div className="skc-top-ui">
        <span>{shopName}</span>
        <span aria-live="polite">
          {done ? "Order " + done.id : "Cart " + count}
        </span>
      </div>
      <div className="skc-scene" data-drawer={drawer ? "" : undefined}>
        {backdropSrc && <img className="skc-mark" src={backdropSrc} alt="" draggable={false} />}
        <div className="skc-floor" />
        <div className="skc-shadow" />
        <div className="skc-front" aria-hidden>
          <div className="skc-flute" />
          <div className="skc-plate">
            <b>{shopName.split(" ")[0].toUpperCase()}</b>
            <span>Skate Co. · Est. 2026</span>
            <span>Worldwide shipping · 30-day returns</span>
          </div>
          <div className="skc-flute" />
        </div>
        <div className="skc-lip" />
        <div className="skc-top">
          {live &&
            lines.flatMap((l, li) => {
              const p = product(l.id)
              if (!p) return []
              return Array.from({ length: Math.min(l.qty, 3) }, (_, k) => (
                <div
                  key={l.id + "-" + k}
                  className="skc-deck"
                  data-in=""
                  style={{ "--slot": slots.current[l.id], "--k": k, "--rz": rz(l.id, k) + "deg", "--d": (k ? 0 : li * 160) + "ms" } as React.CSSProperties}
                >
                  <div className="skc-deck-in">
                    <img src={p.image} alt="" draggable={false} />
                  </div>
                  {k === Math.min(l.qty, 3) - 1 && (
                    <button type="button" aria-label={"Remove one " + p.name} onClick={() => update(l.id, l.qty - 1)} disabled={!!done} />
                  )}
                </div>
              ))
            })}
          {ghosts.map((g) => (
            <div key={g.key} className="skc-deck" data-out="" style={{ "--slot": g.slot, "--k": g.k, "--rz": g.rz + "deg" } as React.CSSProperties}>
              <div className="skc-deck-in">
                <img src={g.image} alt="" draggable={false} />
              </div>
            </div>
          ))}
        </div>

        <div className="skc-board" role="group" aria-label="Your cart">
          <span className="skc-board-label">Your cart</span>
          <div className="skc-rows">
            {rows.map((r, i) => {
              const l = !done && live ? lines[i] : undefined
              const p = l && product(l.id)
              return (
                <div className="skc-row" key={i} data-live={p ? "" : undefined}>
                  <FlapRow text={r.left} delay={i * 140} />
                  <span className="skc-gap" />
                  <FlapRow text={r.right} delay={i * 140 + LEFT * 26} />
                  <span className="skc-keys">
                    <button type="button" className="skc-key" aria-label={p ? "One fewer " + p.name : "Fewer"} disabled={!p} onClick={() => l && update(l.id, l.qty - 1)}>
                      −
                    </button>
                    <button type="button" className="skc-key" aria-label={p ? "One more " + p.name : "More"} disabled={!p || (l?.qty ?? 0) >= 9} onClick={() => l && update(l.id, l.qty + 1)}>
                      +
                    </button>
                  </span>
                </div>
              )
            })}
          </div>
          <div className="skc-total">
            <span className="skc-board-label">Total</span>
            <FlapRow text={totalText} delay={ROWS * 140} />
          </div>
        </div>

        <button
          type="button"
          className="skc-plaque"
          disabled={!done && !lines.length}
          onClick={() => (done ? reset() : setDrawer((o) => !o))}
          aria-expanded={drawer}
        >
          {done ? "New order" : "Checkout"}
        </button>

        <form
          className="skc-drawer"
          data-open={drawer ? "" : undefined}
          aria-hidden={!drawer}
          onSubmit={(e) => {
            e.preventDefault()
            pay()
          }}
        >
          <div>
            <p className="skc-eyebrow">{shopName}</p>
            <h2 className="skc-h">CHECKOUT</h2>
            <p className="skc-note">
              Ships worldwide in 48 h.
              <br />
              30-day returns. Secure payment.
            </p>
            <p className="skc-sum">
              {count} {count === 1 ? "deck" : "decks"} · {currency}
              {total}
            </p>
            <button type="button" className="skc-back" tabIndex={drawer ? 0 : -1} onClick={() => setDrawer(false)}>
              Back to the counter
            </button>
          </div>
          <div className="skc-form">
            {(
              [
                ["email", "Email", "you@example.com"],
                ["address", "Shipping address", "Street, city, postcode"],
                ["card", "Card number", "4242 4242 4242 4242"],
                ["expiry", "MM / YY", "08 / 29"],
                ["cvc", "CVC", "123"],
              ] as const
            ).map(([k, label, ph]) => (
              <label key={k} className={"skc-field skc-f-" + k} data-bad={bad.includes(k) ? "" : undefined}>
                <span>{label}</span>
                <input
                  value={details[k]}
                  placeholder={ph}
                  tabIndex={drawer ? 0 : -1}
                  inputMode={k === "card" || k === "cvc" ? "numeric" : undefined}
                  autoComplete={k === "email" ? "email" : k === "address" ? "street-address" : k === "card" ? "cc-number" : k === "expiry" ? "cc-exp" : "cc-csc"}
                  onChange={(e) => {
                    setDetails((d) => ({ ...d, [k]: e.target.value }))
                    setBad((b) => b.filter((x) => x !== k))
                  }}
                />
              </label>
            ))}
            <div className="skc-form-foot">
              <button type="submit" className="skc-flip" data-go={go || undefined} tabIndex={drawer ? 0 : -1}>
                <span className="skc-fshadow" />
                <span className="skc-air">
                  <span className="skc-spin">
                    <span className="skc-face skc-face-top">{paid ? "Paid" : "Pay " + currency + total}</span>
                    <span className="skc-face skc-face-bot" aria-hidden>
                      <img src={product(lines[0]?.id ?? "")?.image ?? products[0]?.image} alt="" draggable={false} />
                      <span className="skc-truck" style={{ left: "17%" }} />
                      <span className="skc-truck" style={{ right: "17%" }} />
                    </span>
                  </span>
                </span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
// #endregion pasted
