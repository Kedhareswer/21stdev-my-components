import * as React from "react"

/**
 * ConciergeMorphChat — a shop assistant that lives in a floating launcher.
 *
 * The launcher is a circle holding the assistant's portrait. Pressing it morphs
 * the circle into the chat panel: the surface scales out of the corner (with its
 * corner radius corrected every frame so it never smears), the content inside is
 * counter-scaled so it is never squashed, and the portrait flies on a curved
 * path into the header. Every moving part is driven by `transform` alone.
 */

export type ConciergeProduct = {
  name: string
  price?: string
  /** Swatch colour behind the drawn garment. */
  color?: string
  /** Which garment to draw when there is no `image`. */
  kind?: "shirt" | "trousers" | "dress" | "tote"
  /** A photo instead of the drawn garment. */
  image?: string
}

export type ConciergeReply = {
  text: string
  products?: ConciergeProduct[]
  /** Replaces the chips above the input. */
  suggestions?: string[]
}

export type ConciergeMessage = {
  id: number
  role: "user" | "assistant"
  text: string
  products?: ConciergeProduct[]
}

export type ConciergeMenuItem = {
  label: string
  /** Sent as a message when chosen. */
  send?: string
  onSelect?: () => void
}

export type ConciergeMorphChatProps = {
  /** Assistant's first name, shown in the header. */
  name?: string
  /** Second header line; truncates with an ellipsis. */
  role?: string
  /** An image URL, or any node. The default is a drawn portrait. */
  avatar?: string | React.ReactNode
  /** The green presence dot. */
  online?: boolean
  /** Speech bubble beside the closed launcher. `null` turns it off. */
  greeting?: string | null
  /** Big serif headline of the empty state. */
  title?: React.ReactNode
  /** The lines under the headline. */
  intro?: string[]
  /** Chips above the input. A reply can replace them. */
  suggestions?: string[]
  /** Placeholder lines that roll through the empty input. Sent as-is if the
   *  send button is pressed while the input is empty. */
  placeholders?: string[]
  /** Answers a message. Without it a built-in shop concierge replies. */
  onSend?: (
    text: string,
    history: ConciergeMessage[],
  ) => ConciergeReply | string | Promise<ConciergeReply | string>
  /** Called after "New session" clears the thread. */
  onNewSession?: () => void
  /** Items under the "…" button. */
  menuItems?: ConciergeMenuItem[]
  /** "Powered by" footer. `null` drops it. */
  brand?: { name: string; mark?: React.ReactNode } | null
  /** Small mark above the headline. */
  mark?: React.ReactNode
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  /** `fixed` sticks to the viewport; `absolute` sits in the nearest positioned parent. */
  placement?: "fixed" | "absolute"
  /** Gap to the right and bottom edge, in px. */
  offset?: number
  /** Panel width — any CSS length. */
  width?: number | string
  /** Panel height — any definite CSS length. */
  height?: number | string
  /** Send button and your own message bubbles. */
  accent?: string
  /** Text on top of `accent`. */
  accentInk?: string
  /** Panel background. */
  surface?: string
  /** Headline font stack. */
  serif?: string
  className?: string
}

const STAGES = 5

// #region logic
export const LAUNCH = 60 // launcher diameter
export const RADIUS = 30 // panel corner radius
export const AV = 36 // portrait size in the header
export const AV_CLOSED = 48 // portrait size in the launcher
export const PAD_X = 24 // header padding, where the portrait lands
export const PAD_TOP = 22

export function clamp01(n: number) {
  return n < 0 ? 0 : n > 1 ? 1 : n
}

/** One frame of the launcher → panel morph, as transforms. `p` runs 0 → 1 and may
 *  overshoot a little on the spring. Height trails width so the corner sweeps out
 *  on a curve instead of a straight diagonal. */
export function morphFrame(p: number, w: number, h: number) {
  const px = p
  const py = p <= 0 ? p : Math.pow(p, 1.35)
  const sx = Math.max(LAUNCH / w + (1 - LAUNCH / w) * px, 0.01)
  const sy = Math.max(LAUNCH / h + (1 - LAUNCH / h) * py, 0.01)
  // the radius the eye sees; divided by the scale so the corner stays round
  const r = LAUNCH / 2 + (RADIUS - LAUNCH / 2) * clamp01(p)
  const cx = w - LAUNCH / 2 - AV_CLOSED / 2
  const cy = h - LAUNCH / 2 - AV_CLOSED / 2
  const cs = AV_CLOSED / AV
  return {
    sx,
    sy,
    rx: r / sx,
    ry: r / sy,
    ax: cx + (PAD_X - cx) * px,
    ay: cy + (PAD_TOP - cy) * py,
    as: cs + (1 - cs) * p,
  }
}

/** How far stage `i` (0 = bottom of the panel) has arrived, 0 → 1. Each stage
 *  starts later and finishes exactly as the surface lands, so the header never
 *  shows before the portrait reaches it. */
export function stageAt(p: number, i: number) {
  const from = 0.45 + i * 0.09
  return clamp01((p - from) / (1 - from))
}

const CATALOG = [
  { name: "Relaxed linen shirt", price: "$78", color: "#ebe4d6", kind: "shirt", tags: "linen shirt summer new relaxed" },
  { name: "Camp-collar shirt", price: "$64", color: "#a9bba8", kind: "shirt", tags: "shirt summer under weekend" },
  { name: "Pleated linen trouser", price: "$92", color: "#cbb99d", kind: "trousers", tags: "linen trouser pants new" },
  { name: "Bias slip dress", price: "$110", color: "#34333a", kind: "dress", tags: "dress evening wedding new" },
  { name: "Cotton gauze sundress", price: "$84", color: "#e8cbb6", kind: "dress", tags: "dress summer linen weekend" },
  { name: "Market tote", price: "$38", color: "#d9c4a4", kind: "tote", tags: "bag tote under accessories" },
] as const

function pick(tag: string) {
  return CATALOG.filter((p) => p.tags.split(" ").indexOf(tag) > -1).map((p) => ({
    name: p.name,
    price: p.price,
    color: p.color,
    kind: p.kind,
  }))
}

/** The built-in concierge: a few intents, matched on keywords, in house voice. */
export function conciergeReply(input: string): ConciergeReply {
  const t = " " + input.toLowerCase().replace(/[^a-z0-9$ ]+/g, " ") + " "
  const has = (re: RegExp) => re.test(t)

  if (has(/ (hi|hey|hello|hiya|morning|evening) /) && t.trim().split(/\s+/).length <= 3)
    return {
      text: "Hi! Lovely to see you. Are you shopping for something particular, or just browsing today?",
      suggestions: ["Let me explore", "What's new?", "Help with sizing"],
    }
  if (has(/ (human|person|someone|agent|staff|call) /))
    return {
      text: "Of course. I've let the studio team know — someone will join this chat in a few minutes. I'll stay here in the meantime.",
      suggestions: ["Shipping & returns", "What's new?"],
    }
  if (has(/ (ship|shipping|deliver|delivery|return|returns|refund|exchange) /))
    return {
      text: "Shipping is free over $75 and usually takes 2–4 days. Returns are free within 30 days — unworn, with tags. Exchanges for a different size ship out the same day.",
      suggestions: ["Help with sizing", "What's new?"],
    }
  if (has(/ (size|sizing|fit|fits|measure|tall|petite|small|large) /))
    return {
      text: "Our linen runs relaxed, so most people stay true to size — size down if you like it close. Tell me your usual size and how you like things to sit, and I'll check each piece for you.",
      suggestions: ["I'm usually a medium", "Relaxed, not boxy", "Shipping & returns"],
    }
  if (has(/ (try on|try|live|camera|mirror) /))
    return {
      text: "Try on live uses your camera to drape a piece over you before it ships — nothing is recorded. Pick something and I'll set it up.",
      products: pick("linen").slice(0, 3),
      suggestions: ["Start with the linen shirt", "What's new?"],
    }
  if (has(/ (new|arrived|arrivals|latest|just in|drop) /))
    return {
      text: "Just arrived this week — washed linen in sand and oat, and a slip dress cut on the bias that's already moving fast.",
      products: pick("new"),
      suggestions: ["Help with sizing", "Try on live", "Under $80"],
    }
  if (has(/ (under|cheap|budget|less|\$\d+) /))
    return {
      text: "Here's what's under $80 right now — all of it pairs with what's already in most wardrobes.",
      products: CATALOG.filter((p) => parseInt(p.price.slice(1), 10) < 80).map((p) => ({
        name: p.name,
        price: p.price,
        color: p.color,
        kind: p.kind,
      })),
      suggestions: ["What's new?", "Shipping & returns"],
    }
  if (has(/ (dress|evening|wedding|party|dinner) /))
    return {
      text: "For evenings I'd reach for the bias slip — it moves beautifully. The gauze sundress is the easier daytime cousin.",
      products: pick("dress"),
      suggestions: ["Help with sizing", "Try on live"],
    }
  if (has(/ (linen|shirt|summer|beach|holiday|vacation|relaxed|warm|hot) /))
    return {
      text: "Good choice for the heat. These breathe well and soften with every wash — the relaxed shirt is the one people come back for.",
      products: pick("summer").concat(pick("linen")).filter((p, i, a) => a.findIndex((q) => q.name === p.name) === i),
      suggestions: ["Help with sizing", "Try on live", "Under $80"],
    }
  if (has(/ (explore|browse|looking|show|anything|surprise) /))
    return {
      text: "Happy to wander with you. A little of everything we love right now:",
      products: CATALOG.map((p) => ({ name: p.name, price: p.price, color: p.color, kind: p.kind })),
      suggestions: ["What's new?", "Under $80", "Something for evenings"],
    }
  if (has(/ (thanks|thank|cheers|perfect|great|love) /))
    return {
      text: "My pleasure. I'm here whenever you need me — just tap my picture in the corner.",
      suggestions: ["What's new?", "Let me explore"],
    }
  return {
    text: "I can help with that. Tell me a little more — what's it for, and how do you like things to fit?",
    suggestions: ["Let me explore", "What's new?", "Help with sizing"],
  }
}
// #endregion

const DEFAULT_INTRO = [
  "Discover new products and what just arrived.",
  "Get recommendations matched to your needs.",
  "Ask about details, fit, availability, or materials.",
]
const DEFAULT_SUGGESTIONS = ["Let me explore", "What's new?", "Try on live"]
const DEFAULT_PLACEHOLDERS = [
  "A relaxed linen shirt for summer",
  "Something to wear to a garden wedding",
  "Does the trouser run long?",
  "What arrived this week?",
]
const DEFAULT_MENU = [
  { label: "Copy transcript" },
  { label: "Shipping & returns", send: "What's your shipping and returns policy?" },
  { label: "Talk to a person", send: "Can I talk to a person?" },
]
const SERIF =
  '"Tiempos Headline", "Newsreader", "Source Serif 4", "Iowan Old Style", "Palatino Linotype", Georgia, serif'

export default function ConciergeMorphChat({
  name = "Lana",
  role = "Assistant manager",
  avatar,
  online = true,
  greeting = "Hi, I'm Lana — looking for something?",
  title,
  intro = DEFAULT_INTRO,
  suggestions = DEFAULT_SUGGESTIONS,
  placeholders = DEFAULT_PLACEHOLDERS,
  onSend,
  onNewSession,
  menuItems = DEFAULT_MENU,
  brand = { name: "atelier" },
  mark,
  open,
  defaultOpen = false,
  onOpenChange,
  placement = "fixed",
  offset = 24,
  width = "min(420px, calc(100vw - 32px))",
  height = "min(680px, calc(100svh - 48px))",
  accent,
  accentInk,
  surface,
  serif = SERIF,
  className,
}: ConciergeMorphChatProps) {
  const uid = React.useId().replace(/[^a-zA-Z0-9_-]/g, "")
  const panelId = "cmc-panel-" + uid
  const nameId = "cmc-name-" + uid

  // ---- open state -----------------------------------------------------------
  const [innerOpen, setInnerOpen] = React.useState(defaultOpen)
  const isOpen = open ?? innerOpen
  const setOpen = React.useCallback(
    (next: boolean) => {
      if (open === undefined) setInnerOpen(next)
      onOpenChange?.(next)
    },
    [open, onOpenChange],
  )

  // ---- the morph ------------------------------------------------------------
  const rootRef = React.useRef(null as HTMLDivElement | null)
  const surfaceRef = React.useRef(null as HTMLDivElement | null)
  const innerRef = React.useRef(null as HTMLDivElement | null)
  const avatarRef = React.useRef(null as HTMLDivElement | null)
  const launcherRef = React.useRef(null as HTMLButtonElement | null)
  const inputRef = React.useRef(null as HTMLInputElement | null)
  const threadRef = React.useRef(null as HTMLDivElement | null)
  const spring = React.useRef({ p: defaultOpen ? 1 : 0, v: 0, target: defaultOpen ? 1 : 0, raf: 0, last: 0 })
  const returnFocus = React.useRef(false)
  const [phase, setPhase] = React.useState((defaultOpen ? "open" : "closed") as Phase)

  const paint = React.useCallback((p: number) => {
    const root = rootRef.current
    const surf = surfaceRef.current
    const inner = innerRef.current
    const av = avatarRef.current
    if (!root || !surf || !inner || !av) return
    const w = root.offsetWidth || 400
    const h = root.offsetHeight || 640
    const f = morphFrame(p, w, h)
    surf.style.transform = "scale(" + f.sx + ", " + f.sy + ")"
    surf.style.borderRadius = f.rx + "px / " + f.ry + "px"
    inner.style.transform = "scale(" + 1 / f.sx + ", " + 1 / f.sy + ")"
    av.style.transform = "translate(" + f.ax + "px, " + f.ay + "px) scale(" + f.as + ")"
    root.querySelectorAll("[data-cmc-stage]").forEach((node) => {
      const el = node as HTMLElement
      const t = stageAt(p, Number(el.dataset.cmcStage))
      el.style.opacity = String(t)
      el.style.transform = t >= 1 ? "" : "translateY(" + (1 - t) * 14 + "px)"
    })
  }, [])

  React.useLayoutEffect(() => {
    const s = spring.current
    const reduce = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches
    const target = isOpen ? 1 : 0
    s.target = target
    if (reduce || s.p === target) {
      cancelAnimationFrame(s.raf)
      s.raf = 0
      s.p = target
      s.v = 0
      paint(target)
      setPhase(isOpen ? "open" : "closed")
      return
    }
    setPhase("moving")
    // opening springs with a little life in it; closing settles without bounce
    const k = isOpen ? 210 : 260
    const c = 2 * Math.sqrt(k) * (isOpen ? 0.74 : 1)
    const tick = (now: number) => {
      let dt = Math.min((now - s.last) / 1000, 1 / 30)
      s.last = now
      while (dt > 0) {
        const step = Math.min(dt, 1 / 240)
        s.v += (-k * (s.p - s.target) - c * s.v) * step
        s.p += s.v * step
        dt -= step
      }
      if (Math.abs(s.p - s.target) < 0.0006 && Math.abs(s.v) < 0.006) {
        s.p = s.target
        s.v = 0
        s.raf = 0
        paint(s.p)
        setPhase(s.target ? "open" : "closed")
        return
      }
      paint(s.p)
      s.raf = requestAnimationFrame(tick)
    }
    cancelAnimationFrame(s.raf)
    s.last = performance.now()
    s.raf = requestAnimationFrame(tick)
  }, [isOpen, paint])

  React.useEffect(() => () => cancelAnimationFrame(spring.current.raf), [])

  // keep the frame right when the panel's size changes (viewport, props)
  React.useEffect(() => {
    const root = rootRef.current
    if (!root || typeof ResizeObserver === "undefined") return
    const ro = new ResizeObserver(() => paint(spring.current.p))
    ro.observe(root)
    return () => ro.disconnect()
  }, [paint])

  // focus follows the morph
  React.useEffect(() => {
    if (phase === "open") inputRef.current?.focus({ preventScroll: true })
    if (phase === "closed" && returnFocus.current) {
      returnFocus.current = false
      launcherRef.current?.focus({ preventScroll: true })
    }
  }, [phase])

  // the hidden side is out of the tab order (React 18 has no inert prop)
  React.useEffect(() => {
    surfaceRef.current?.toggleAttribute("inert", !isOpen)
  }, [isOpen])

  const close = React.useCallback(() => {
    returnFocus.current = true
    setOpen(false)
  }, [setOpen])

  // ---- greeting bubble ------------------------------------------------------
  const [greetShown, setGreetShown] = React.useState(false)
  const [greetDismissed, setGreetDismissed] = React.useState(false)
  React.useEffect(() => {
    if (!greeting || greetDismissed || isOpen) {
      setGreetShown(false)
      return
    }
    const id = window.setTimeout(() => setGreetShown(true), 1400)
    return () => window.clearTimeout(id)
  }, [greeting, greetDismissed, isOpen])

  // ---- conversation ---------------------------------------------------------
  const [messages, setMessages] = React.useState([] as ConciergeMessage[])
  const [chips, setChips] = React.useState(suggestions)
  const [value, setValue] = React.useState("")
  const [busy, setBusy] = React.useState(false)
  const msgRef = React.useRef(messages)
  msgRef.current = messages
  const nextId = React.useRef(1)
  const session = React.useRef(0)
  const alive = React.useRef(true)
  React.useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
    }
  }, [])
  React.useEffect(() => setChips(suggestions), [suggestions])

  const send = async (raw: string) => {
    const text = raw.trim()
    if (!text || busy) return
    const mine = session.current
    const userMsg = { id: nextId.current++, role: "user", text } as ConciergeMessage
    const history = msgRef.current.concat(userMsg)
    setMessages(history)
    setValue("")
    setBusy(true)
    let reply: ConciergeReply
    try {
      const r = onSend ? await onSend(text, history) : conciergeReply(text)
      reply = typeof r === "string" ? { text: r } : r
    } catch {
      reply = { text: "Sorry — I lost the thread for a second. Could you say that again?" }
    }
    // the built-in concierge answers instantly; give it a breath of "typing"
    if (!onSend) await new Promise((res) => setTimeout(res, 700 + Math.min(text.length * 14, 700)))
    if (!alive.current || session.current !== mine) return
    setMessages((m) => m.concat({ id: nextId.current++, role: "assistant", text: reply.text, products: reply.products }))
    if (reply.suggestions && reply.suggestions.length) setChips(reply.suggestions)
    setBusy(false)
  }

  const newSession = () => {
    session.current++
    setMessages([])
    setBusy(false)
    setValue("")
    setChips(suggestions)
    setMenuOpen(false)
    onNewSession?.()
    inputRef.current?.focus()
  }

  // stay pinned to the newest message
  React.useEffect(() => {
    const el = threadRef.current
    if (!el || !messages.length) return
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" })
  }, [messages, busy])

  // ---- rolling placeholder --------------------------------------------------
  const [ph, setPh] = React.useState(0)
  const [focused, setFocused] = React.useState(false)
  React.useEffect(() => {
    if (!isOpen || value || placeholders.length < 2) return
    const id = window.setInterval(() => setPh((i) => (i + 1) % placeholders.length), 3400)
    return () => window.clearInterval(id)
  }, [isOpen, value, placeholders.length])
  const currentPh = placeholders.length ? placeholders[ph % placeholders.length] : ""

  // ---- menu -----------------------------------------------------------------
  const [menuOpen, setMenuOpen] = React.useState(false)
  const [copied, setCopied] = React.useState(false)
  const menuWrap = React.useRef(null as HTMLDivElement | null)
  React.useEffect(() => {
    if (!menuOpen) return
    const onDown = (e: PointerEvent) => {
      if (!menuWrap.current?.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener("pointerdown", onDown)
    return () => document.removeEventListener("pointerdown", onDown)
  }, [menuOpen])

  const choose = (item: ConciergeMenuItem) => {
    if (item.onSelect) item.onSelect()
    else if (item.send) send(item.send)
    else if (item.label === "Copy transcript") {
      const lines = msgRef.current.map((m) => (m.role === "user" ? "You: " : name + ": ") + m.text)
      navigator.clipboard?.writeText(lines.join("\n") || "(empty conversation)").catch(() => {})
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1400)
    }
    setMenuOpen(false)
  }

  const onKeyDown = (e: KeyDiv) => {
    if (e.key !== "Escape") return
    if (menuOpen) {
      e.stopPropagation()
      setMenuOpen(false)
      return
    }
    if (isOpen) close()
  }

  // ---- render ---------------------------------------------------------------
  const vars = {
    position: placement,
    right: offset,
    bottom: offset,
    width,
    height,
    "--cmc-serif": serif,
    ...(accent ? { "--cmc-accent": accent } : null),
    ...(accentInk ? { "--cmc-accent-ink": accentInk } : null),
    ...(surface ? { "--cmc-bg": surface } : null),
  } as React.CSSProperties

  const portrait =
    typeof avatar === "string" ? (
      <img src={avatar} alt="" width={AV} height={AV} className="cmc-avatar-img" />
    ) : avatar ? (
      avatar
    ) : (
      <Portrait id={uid} />
    )

  return (
    <div
      ref={rootRef}
      className={"cmc-root" + (className ? " " + className : "")}
      data-state={phase === "moving" ? (isOpen ? "opening" : "closing") : phase}
      style={vars}
      onKeyDown={onKeyDown}
    >
      <style>{CMC_CSS}</style>

      {/* closed: the breathing halo and the greeting */}
      <span className="cmc-halo" aria-hidden="true" />
      {greeting ? (
        <div className={"cmc-greet" + (greetShown && phase === "closed" ? " is-shown" : "")} role="status">
          <button type="button" className="cmc-greet-body" tabIndex={greetShown ? 0 : -1} onClick={() => setOpen(true)}>
            <span className="cmc-greet-name">{name}</span>
            {greeting}
          </button>
          <button
            type="button"
            className="cmc-greet-x"
            aria-label="Dismiss"
            tabIndex={greetShown ? 0 : -1}
            onClick={() => setGreetDismissed(true)}
          >
            <IconClose size={10} />
          </button>
        </div>
      ) : null}

      <div
        ref={surfaceRef}
        id={panelId}
        className="cmc-surface"
        role="dialog"
        aria-labelledby={nameId}
        aria-hidden={!isOpen}
      >
        <div ref={innerRef} className="cmc-inner">
          <header className="cmc-head">
            <span className="cmc-av-slot" aria-hidden="true" />
            <div className="cmc-who" data-cmc-stage={STAGES - 1}>
              <span id={nameId} className="cmc-name">
                {name}
              </span>
              <span className="cmc-role">{role}</span>
            </div>
            <div className="cmc-actions" data-cmc-stage={STAGES - 1}>
              <button type="button" className="cmc-btn cmc-btn-new" onClick={newSession}>
                <IconCompose />
                <span className="cmc-new-label">New session</span>
              </button>
              <div className="cmc-menu-wrap" ref={menuWrap}>
                <button
                  type="button"
                  className="cmc-btn cmc-btn-round"
                  aria-label="More options"
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                  onClick={() => setMenuOpen((o) => !o)}
                >
                  <IconDots />
                </button>
                <div className={"cmc-menu" + (menuOpen ? " is-open" : "")} role="menu">
                  {menuItems.map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      role="menuitem"
                      className="cmc-menu-item"
                      tabIndex={menuOpen ? 0 : -1}
                      onClick={() => choose(item)}
                    >
                      {item.label === "Copy transcript" && copied ? "Copied" : item.label}
                    </button>
                  ))}
                </div>
              </div>
              <button type="button" className="cmc-btn cmc-btn-round" aria-label="Close chat" onClick={close}>
                <IconClose size={12} />
              </button>
            </div>
          </header>

          <div ref={threadRef} className="cmc-thread" aria-live="polite">
            <div className="cmc-intro" data-cmc-stage={3}>
              <span className="cmc-mark">{mark ?? <KnotMark size={24} />}</span>
              <h2 className="cmc-title">
                {title ?? (
                  <>
                    I can help you
                    <br />
                    find what you need.
                  </>
                )}
              </h2>
              {intro.length ? (
                <p className="cmc-lede">
                  {intro.map((line, i) => (
                    <React.Fragment key={i}>
                      {i ? <br /> : null}
                      {line}
                    </React.Fragment>
                  ))}
                </p>
              ) : null}
            </div>

            {messages.map((m) =>
              m.role === "user" ? (
                <div key={m.id} className="cmc-msg cmc-msg-user">
                  <p className="cmc-bubble">{m.text}</p>
                </div>
              ) : (
                <div key={m.id} className="cmc-msg cmc-msg-bot">
                  <p className="cmc-said">
                    {m.text.split(" ").map((word, i) => (
                      <React.Fragment key={i}>
                        <span className="cmc-w" style={{ animationDelay: Math.min(i * 26, 1100) + "ms" }}>
                          {word}
                        </span>{" "}
                      </React.Fragment>
                    ))}
                  </p>
                  {m.products && m.products.length ? (
                    <div className="cmc-shelf">
                      {m.products.map((p, i) => (
                        <button
                          key={p.name}
                          type="button"
                          className="cmc-card"
                          style={{ animationDelay: 240 + i * 70 + "ms" }}
                          onClick={() => send("Tell me more about the " + p.name.toLowerCase())}
                        >
                          <span className="cmc-card-pic" style={{ background: tint(p.color) }}>
                            {p.image ? (
                              <img src={p.image} alt="" width={132} height={112} className="cmc-card-img" />
                            ) : (
                              <Garment kind={p.kind ?? "shirt"} color={p.color ?? "#e9e2d3"} />
                            )}
                          </span>
                          <span className="cmc-card-name">{p.name}</span>
                          {p.price ? <span className="cmc-card-price">{p.price}</span> : null}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              ),
            )}

            {busy ? (
              <div className="cmc-msg cmc-msg-bot" aria-label={name + " is typing"}>
                <span className="cmc-typing">
                  <i />
                  <i />
                  <i />
                </span>
              </div>
            ) : null}
          </div>

          <div className="cmc-foot">
            {chips.length ? (
              <div className="cmc-chips" data-cmc-stage={2} key={chips.join("|")}>
                {chips.slice(0, 3).map((c, i) => (
                  <button
                    key={c}
                    type="button"
                    className="cmc-chip"
                    style={{ animationDelay: i * 60 + "ms" }}
                    disabled={busy}
                    onClick={() => send(c)}
                  >
                    {c}
                  </button>
                ))}
              </div>
            ) : null}

            <form
              className={"cmc-field" + (focused ? " is-focused" : "")}
              data-cmc-stage={1}
              onSubmit={(e) => {
                e.preventDefault()
                send(value || currentPh)
              }}
            >
              <input
                ref={inputRef}
                className="cmc-input"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                aria-label={"Message " + name}
                autoComplete="off"
                enterKeyHint="send"
              />
              {!value && currentPh ? (
                <span className="cmc-ph" aria-hidden="true">
                  <span key={ph} className="cmc-ph-line">
                    {currentPh}
                  </span>
                </span>
              ) : null}
              <button type="submit" className="cmc-send" aria-label="Send" disabled={busy}>
                <IconArrowUp />
              </button>
            </form>

            {brand ? (
              <div className="cmc-brand" data-cmc-stage={0}>
                Powered by
                <span className="cmc-brand-mark">{brand.mark ?? <KnotMark size={15} />}</span>
                <span className="cmc-brand-name">{brand.name}</span>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* the portrait: launcher face when closed, header avatar when open */}
      <div ref={avatarRef} className="cmc-avatar" aria-hidden="true">
        <span className="cmc-avatar-face">{portrait}</span>
        {online ? <span className="cmc-dot" /> : null}
      </div>

      <button
        ref={launcherRef}
        type="button"
        className="cmc-launcher"
        aria-label={"Chat with " + name}
        aria-expanded={isOpen}
        aria-controls={panelId}
        tabIndex={isOpen ? -1 : 0}
        onClick={() => setOpen(true)}
      />
    </div>
  )
}

// ---- drawn assets -----------------------------------------------------------

/** The default assistant: a warm, softly lit head-and-shoulders portrait. */
function Portrait({ id }: { id: string }) {
  const c = "cmc-pc-" + id
  const bg = "cmc-pbg-" + id
  const skin = "cmc-psk-" + id
  const hair = "cmc-phr-" + id
  return (
    <svg viewBox="0 0 64 64" width={AV} height={AV} className="cmc-portrait">
      <defs>
        <clipPath id={c}>
          <circle cx="32" cy="32" r="32" />
        </clipPath>
        <radialGradient id={bg} cx="0.35" cy="0.25" r="0.9">
          <stop offset="0" stopColor="#f6eee6" />
          <stop offset="1" stopColor="#d6c3b0" />
        </radialGradient>
        <radialGradient id={skin} cx="0.42" cy="0.38" r="0.7">
          <stop offset="0" stopColor="#f3c9ab" />
          <stop offset="1" stopColor="#dca283" />
        </radialGradient>
        <linearGradient id={hair} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#6b4130" />
          <stop offset="0.6" stopColor="#4a2b1f" />
          <stop offset="1" stopColor="#331d15" />
        </linearGradient>
      </defs>
      <g clipPath={"url(#" + c + ")"}>
        <rect width="64" height="64" fill={"url(#" + bg + ")"} />
        {/* hair, behind */}
        <path d="M15 31C13 15 22 6.5 33 6.5S53 15 51 31c-1 10 1.5 20 6 33H8c4.5-13 8-23 7-33Z" fill={"url(#" + hair + ")"} />
        {/* shoulders, a cream knit */}
        <path d="M4 64c2.5-11 13-16.5 28-16.5S57.5 53 60 64Z" fill="#f2ece4" />
        <path d="M24 48.5c2.5 4 13.5 4 16 0" fill="none" stroke="#ddd3c7" strokeWidth="1" />
        {/* neck */}
        <path d="M26.5 39h11v9.5c-2.5 3-8.5 3-11 0Z" fill="#d49778" />
        <path d="M26.5 42.5c3.5 2.2 7.5 2.2 11 0v-3h-11Z" fill="#c4866a" opacity="0.6" />
        {/* face */}
        <ellipse cx="32" cy="29" rx="10.6" ry="13" fill={"url(#" + skin + ")"} />
        <ellipse cx="26.2" cy="33.2" rx="2.4" ry="1.4" fill="#ee9c86" opacity="0.32" />
        <ellipse cx="37.8" cy="33.2" rx="2.4" ry="1.4" fill="#ee9c86" opacity="0.32" />
        {/* brows, eyes, nose, lips */}
        <path d="M25.4 25.6c1.6-1 3.4-1.1 5-.3M33.6 25.3c1.6-.8 3.4-.7 5 .3" fill="none" stroke="#4a2b1f" strokeWidth="0.9" strokeLinecap="round" />
        <ellipse cx="28.2" cy="28.6" rx="1.35" ry="0.95" fill="#2a1913" />
        <ellipse cx="35.8" cy="28.6" rx="1.35" ry="0.95" fill="#2a1913" />
        <circle cx="28.6" cy="28.3" r="0.32" fill="#fff" />
        <circle cx="36.2" cy="28.3" r="0.32" fill="#fff" />
        <path d="M32.1 29.6c-.5 2-1 3.4-.2 4 .5.3 1.2.2 1.6-.1" fill="none" stroke="#bf8164" strokeWidth="0.7" strokeLinecap="round" />
        <path d="M28.9 37.1c1.9 1.5 4.3 1.5 6.2 0-1-.5-2-.6-3.1-.3-1.1-.3-2.1-.2-3.1.3Z" fill="#c4675f" />
        <path d="M29.2 37.2c1.8.7 3.8.7 5.6 0" fill="none" stroke="#a5524c" strokeWidth="0.4" />
        {/* hair, in front: a side part and long falls past the cheeks */}
        <path d="M20.6 30c-.7-11 5-17.2 13.2-17.2 6.8 0 11.2 5.3 10.7 13-3.8-5.6-9.4-8.6-15.4-7.1-4.3 1.1-7.3 5.4-8.5 11.3Z" fill={"url(#" + hair + ")"} />
        <path d="M21.2 26.5c-2.6 8.2-1.6 17.6-4.8 26.5h7.2c-1.2-8.6-.6-17.6-.8-25.4Z" fill="#3b2219" />
        <path d="M43.4 24.5c2.8 9 1 18.7 4.4 28.5h-7c1-8.8 1.4-18 1.2-26.5Z" fill="#3b2219" />
        <path d="M27 14.6c4-1.6 9.4-1.2 12.6 2" fill="none" stroke="#8a5a43" strokeWidth="0.8" strokeLinecap="round" opacity="0.7" />
      </g>
    </svg>
  )
}

/** Three looped petals around a ring — the default brand and headline mark. */
function KnotMark({ size }: { size: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className="cmc-knot" fill="none" aria-hidden="true">
      <g stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 12C9.2 8.6 9.4 3.4 12 3.4s2.8 5.2 0 8.6Z" />
        <path d="M12 12C9.2 8.6 9.4 3.4 12 3.4s2.8 5.2 0 8.6Z" transform="rotate(120 12 12)" />
        <path d="M12 12C9.2 8.6 9.4 3.4 12 3.4s2.8 5.2 0 8.6Z" transform="rotate(240 12 12)" />
        <circle cx="12" cy="12" r="5.2" />
      </g>
    </svg>
  )
}

function Garment({ kind, color }: { kind: string; color: string }) {
  const line = "rgba(20, 16, 12, 0.22)"
  const body =
    kind === "trousers"
      ? "M19 9h22l3.4 42H34.6L30 22.5 25.4 51H15.6Z"
      : kind === "dress"
        ? "M24.5 8.5h11L34.8 18c4.6 6 8.2 17 11.2 33H14c3-16 6.6-27 11.2-33Z"
        : kind === "tote"
          ? "M13 23h34l-3 29H16Z"
          : "M21 10.5 26.5 8.5c1 2.6 2 3.6 3.5 3.6s2.5-1 3.5-3.6L39 10.5 50 18.6 45.4 26.4 41 23.5V51H19V23.5l-4.4 2.9L10 18.6Z"
  return (
    <svg viewBox="0 0 60 60" width="80" height="80" className="cmc-garment" aria-hidden="true">
      <path d={body} fill={color} stroke={line} strokeWidth="0.9" strokeLinejoin="round" />
      {kind === "shirt" ? (
        <path d="M30 12v39M26.5 8.5 30 14l3.5-5.5M29 20h2M29 28h2M29 36h2M29 44h2" fill="none" stroke={line} strokeWidth="0.9" strokeLinecap="round" />
      ) : kind === "trousers" ? (
        <path d="M19 14h22M30 14v8.5M23 14l1 6M37 14l-1 6" fill="none" stroke={line} strokeWidth="0.9" strokeLinecap="round" />
      ) : kind === "dress" ? (
        <path d="M25.2 18c3 1.6 6.6 1.6 9.6 0M24.5 8.5 23 4M35.5 8.5 37 4M27 24c-1.5 9-3 18-4.4 27M33 24c1.5 9 3 18 4.4 27" fill="none" stroke={line} strokeWidth="0.9" strokeLinecap="round" />
      ) : (
        <path d="M22 23c0-9 3.6-14 8-14s8 5 8 14M16.6 30h26.8" fill="none" stroke={line} strokeWidth="1.1" strokeLinecap="round" />
      )}
      {/* a linen slub — a few broken weft lines */}
      <path d="M20 31h4M33 38h5M23 45h3M36 27h3" fill="none" stroke="#fff" strokeOpacity="0.28" strokeWidth="0.7" strokeLinecap="round" />
    </svg>
  )
}

/** A soft wash of the swatch colour for the card behind the garment. */
function tint(color?: string) {
  const c = color ?? "#e9e2d3"
  return "color-mix(in oklab, " + c + " 26%, #f5f2ee)"
}

function IconCompose() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" aria-hidden="true">
      <path d="M7 2.5H4A1.5 1.5 0 0 0 2.5 4v8A1.5 1.5 0 0 0 4 13.5h8a1.5 1.5 0 0 0 1.5-1.5V9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M12.2 2.3a1.3 1.3 0 0 1 1.8 1.8L8.6 9.5 6.3 10l.5-2.3Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  )
}

function IconDots() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor" aria-hidden="true">
      <circle cx="3.2" cy="8" r="1.25" />
      <circle cx="8" cy="8" r="1.25" />
      <circle cx="12.8" cy="8" r="1.25" />
    </svg>
  )
}

function IconClose({ size }: { size: number }) {
  return (
    <svg viewBox="0 0 12 12" width={size} height={size} fill="none" aria-hidden="true">
      <path d="M2.5 2.5l7 7M9.5 2.5l-7 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function IconArrowUp() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" fill="none" aria-hidden="true">
      <path d="M8 13V3.2M3.6 7.4 8 3l4.4 4.4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ---- styles -----------------------------------------------------------------

const CMC_CSS = `
.cmc-root {
  --cmc-bg: var(--color-background, #ffffff);
  --cmc-ink: var(--color-foreground, #121212);
  --cmc-muted: var(--color-muted-foreground, #6f6f6f);
  --cmc-line: var(--color-border, #e7e5e2);
  --cmc-accent: var(--color-primary, #0f0f0f);
  --cmc-accent-ink: var(--color-background, #ffffff);
  z-index: 60;
  pointer-events: none;
  box-sizing: border-box;
  font-family: "Inter", "Geist", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
  color: var(--cmc-ink);
  -webkit-font-smoothing: antialiased;
}
.cmc-root *, .cmc-root *::before, .cmc-root *::after { box-sizing: border-box; }

.cmc-surface {
  position: absolute;
  inset: 0;
  overflow: hidden;
  transform-origin: 100% 100%;
  background: var(--cmc-bg);
  box-shadow:
    0 0 0 1px color-mix(in oklab, var(--cmc-ink) 6%, transparent),
    0 2px 6px -2px rgba(20, 16, 10, 0.08),
    0 28px 64px -18px rgba(20, 16, 10, 0.32);
  will-change: transform;
  pointer-events: auto;
}
.cmc-root[data-state="closed"] .cmc-surface,
.cmc-root[data-state="closing"] .cmc-surface { pointer-events: none; }

.cmc-inner {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  transform-origin: 100% 100%;
  container: cmc / inline-size;
  will-change: transform;
}

/* ---- header ---- */
.cmc-head {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 22px 24px 8px;
  flex: none;
}
.cmc-av-slot { width: 36px; height: 36px; flex: none; }
.cmc-who { display: flex; flex-direction: column; min-width: 0; flex: 1; line-height: 1.2; }
.cmc-name { font-size: 15px; font-weight: 650; letter-spacing: -0.01em; }
.cmc-role {
  font-size: 13px;
  font-weight: 500;
  color: var(--cmc-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: 2px;
}
.cmc-actions { display: flex; align-items: center; gap: 8px; flex: none; }
.cmc-btn {
  height: 34px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  border-radius: 999px;
  border: 1px solid var(--cmc-line);
  background: var(--cmc-bg);
  color: var(--cmc-ink);
  font: inherit;
  font-size: 13.5px;
  font-weight: 550;
  cursor: pointer;
  transition: transform 0.25s cubic-bezier(0.3, 1.4, 0.5, 1), border-color 0.2s, background-color 0.2s;
}
.cmc-btn:hover { border-color: color-mix(in oklab, var(--cmc-ink) 22%, transparent); background: color-mix(in oklab, var(--cmc-ink) 3%, var(--cmc-bg)); }
.cmc-btn:active { transform: scale(0.94); }
.cmc-btn-new { padding: 0 14px 0 12px; }
.cmc-btn-round { width: 34px; padding: 0; }
.cmc-btn svg { display: block; max-width: none; flex: none; }

@container cmc (max-width: 350px) {
  .cmc-new-label { display: none; }
  .cmc-btn-new { width: 34px; padding: 0; }
}

/* ---- menu ---- */
.cmc-menu-wrap { position: relative; }
.cmc-menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  z-index: 3;
  min-width: 188px;
  padding: 6px;
  border-radius: 16px;
  background: var(--cmc-bg);
  border: 1px solid var(--cmc-line);
  box-shadow: 0 18px 40px -16px rgba(20, 16, 10, 0.3);
  transform-origin: 100% 0;
  transform: scale(0.9) translateY(-4px);
  opacity: 0;
  visibility: hidden;
  transition: transform 0.3s cubic-bezier(0.3, 1.3, 0.5, 1), opacity 0.18s, visibility 0s 0.3s;
}
.cmc-menu.is-open { transform: none; opacity: 1; visibility: visible; transition-delay: 0s; }
.cmc-menu-item {
  display: block;
  width: 100%;
  text-align: left;
  padding: 9px 12px;
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: var(--cmc-ink);
  font: inherit;
  font-size: 13.5px;
  cursor: pointer;
}
.cmc-menu-item:hover { background: color-mix(in oklab, var(--cmc-ink) 6%, transparent); }

/* ---- thread ---- */
.cmc-thread {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 8px 24px 18px;
  -webkit-mask-image: linear-gradient(to bottom, transparent 0, #000 22px, #000 calc(100% - 10px), transparent 100%);
  mask-image: linear-gradient(to bottom, transparent 0, #000 22px, #000 calc(100% - 10px), transparent 100%);
  scrollbar-width: thin;
  scrollbar-color: color-mix(in oklab, var(--cmc-ink) 16%, transparent) transparent;
}
.cmc-intro { margin-top: auto; padding-bottom: 10px; }
.cmc-mark { display: inline-flex; color: var(--cmc-ink); margin-bottom: 14px; }
.cmc-knot { display: block; max-width: none; }
.cmc-title {
  margin: 0;
  font-family: var(--cmc-serif);
  font-weight: 400;
  font-size: 31px;
  line-height: 1.12;
  letter-spacing: -0.035em;
  color: var(--cmc-ink);
}
.cmc-lede {
  margin: 18px 0 0;
  font-size: 13.5px;
  line-height: 1.75;
  color: color-mix(in oklab, var(--cmc-ink) 82%, var(--cmc-bg));
}

.cmc-msg { display: flex; flex-direction: column; }
.cmc-msg-user { align-items: flex-end; }
.cmc-bubble {
  margin: 0;
  max-width: 82%;
  padding: 10px 15px;
  border-radius: 20px 20px 6px 20px;
  background: var(--cmc-accent);
  color: var(--cmc-accent-ink);
  font-size: 14px;
  line-height: 1.45;
  transform-origin: 100% 100%;
  animation: cmc-pop 0.42s cubic-bezier(0.3, 1.35, 0.5, 1) both;
}
.cmc-msg-bot { align-items: flex-start; }
.cmc-said { margin: 0; font-size: 14px; line-height: 1.6; color: var(--cmc-ink); max-width: 94%; }
.cmc-w { display: inline-block; animation: cmc-word 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) both; }

.cmc-typing {
  display: inline-flex;
  gap: 5px;
  padding: 12px 14px;
  border-radius: 18px 18px 18px 6px;
  background: color-mix(in oklab, var(--cmc-ink) 6%, var(--cmc-bg));
  transform-origin: 0 100%;
  animation: cmc-pop 0.36s cubic-bezier(0.3, 1.35, 0.5, 1) both;
}
.cmc-typing i {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--cmc-muted);
  animation: cmc-bob 1.1s ease-in-out infinite;
}
.cmc-typing i:nth-child(2) { animation-delay: 0.14s; }
.cmc-typing i:nth-child(3) { animation-delay: 0.28s; }

.cmc-shelf {
  display: flex;
  gap: 10px;
  margin: 12px -24px 0;
  padding: 2px 24px 6px;
  width: calc(100% + 48px);
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scroll-padding: 0 24px;
  scrollbar-width: none;
}
.cmc-shelf::-webkit-scrollbar { display: none; }
.cmc-card {
  flex: none;
  width: 132px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  padding: 0 0 4px;
  border: 0;
  background: transparent;
  color: var(--cmc-ink);
  font: inherit;
  text-align: left;
  cursor: pointer;
  scroll-snap-align: start;
  animation: cmc-rise 0.55s cubic-bezier(0.25, 1.2, 0.45, 1) both;
}
.cmc-card-pic {
  width: 132px;
  height: 112px;
  border-radius: 16px;
  display: grid;
  place-items: center;
  margin-bottom: 6px;
  overflow: hidden;
  border: 1px solid color-mix(in oklab, var(--cmc-ink) 6%, transparent);
  transition: transform 0.35s cubic-bezier(0.3, 1.3, 0.5, 1);
}
.cmc-card:hover .cmc-card-pic { transform: translateY(-3px) scale(1.02); }
.cmc-card-img { width: 132px; height: 112px; max-width: none; object-fit: cover; display: block; }
.cmc-garment { display: block; width: 80px; height: 80px; max-width: none; transition: transform 0.45s cubic-bezier(0.3, 1.3, 0.5, 1); }
.cmc-card:hover .cmc-garment { transform: rotate(-4deg) scale(1.06); }
.cmc-card-name { font-size: 12.5px; font-weight: 550; line-height: 1.3; }
.cmc-card-price { font-size: 12.5px; color: var(--cmc-muted); }

/* ---- footer: chips, field, brand ---- */
.cmc-foot { flex: none; padding: 0 24px 14px; display: flex; flex-direction: column; gap: 12px; }
.cmc-chips { display: grid; grid-auto-flow: column; grid-auto-columns: minmax(0, 1fr); gap: 8px; }
.cmc-chip {
  height: 38px;
  padding: 0 8px;
  border-radius: 999px;
  border: 1.25px solid var(--cmc-ink);
  background: var(--cmc-bg);
  color: var(--cmc-ink);
  font: inherit;
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
  animation: cmc-rise 0.5s cubic-bezier(0.25, 1.3, 0.45, 1) both;
  transition: transform 0.25s cubic-bezier(0.3, 1.4, 0.5, 1), background-color 0.2s, color 0.2s;
}
.cmc-chip:hover:not(:disabled) { background: var(--cmc-ink); color: var(--cmc-bg); }
.cmc-chip:active:not(:disabled) { transform: scale(0.95); }
.cmc-chip:disabled { opacity: 0.45; cursor: default; }

.cmc-field {
  position: relative;
  display: flex;
  align-items: center;
  height: 52px;
  padding: 0 7px 0 20px;
  border-radius: 999px;
  border: 1.25px solid var(--cmc-ink);
  background: var(--cmc-bg);
  transition: box-shadow 0.25s;
}
.cmc-field.is-focused { box-shadow: 0 0 0 4px color-mix(in oklab, var(--cmc-ink) 8%, transparent); }
.cmc-input {
  flex: 1;
  min-width: 0;
  height: 100%;
  border: 0;
  outline: none;
  background: transparent;
  color: var(--cmc-ink);
  font: inherit;
  font-size: 15px;
  padding: 0 10px 0 0;
}
.cmc-ph {
  position: absolute;
  left: 20px;
  right: 56px;
  top: 0;
  bottom: 0;
  overflow: hidden;
  pointer-events: none;
  display: flex;
  align-items: center;
}
.cmc-ph-line {
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 15px;
  color: var(--cmc-muted);
  animation: cmc-roll 0.6s cubic-bezier(0.2, 0.9, 0.2, 1) both;
}
.cmc-send {
  flex: none;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  border: 0;
  display: grid;
  place-items: center;
  background: var(--cmc-accent);
  color: var(--cmc-accent-ink);
  cursor: pointer;
  transition: transform 0.3s cubic-bezier(0.3, 1.5, 0.5, 1), opacity 0.2s;
}
.cmc-send svg { display: block; max-width: none; transition: transform 0.3s cubic-bezier(0.3, 1.5, 0.5, 1); }
.cmc-send:hover:not(:disabled) svg { transform: translateY(-2px); }
.cmc-send:active:not(:disabled) { transform: scale(0.88); }
.cmc-send:disabled { opacity: 0.4; cursor: default; }

.cmc-brand {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: 11.5px;
  color: color-mix(in oklab, var(--cmc-ink) 72%, var(--cmc-bg));
  letter-spacing: -0.01em;
}
.cmc-brand-mark { display: inline-flex; margin-left: 3px; color: var(--cmc-ink); }
.cmc-brand-name { font-family: var(--cmc-serif); font-size: 17px; line-height: 1; letter-spacing: -0.03em; color: var(--cmc-ink); }

/* ---- the travelling portrait ---- */
.cmc-avatar {
  position: absolute;
  left: 0;
  top: 0;
  width: 36px;
  height: 36px;
  transform-origin: 0 0;
  will-change: transform;
  pointer-events: none;
  z-index: 2;
}
.cmc-avatar-face {
  display: block;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  overflow: hidden;
  background: color-mix(in oklab, var(--cmc-ink) 8%, var(--cmc-bg));
}
.cmc-avatar-face > * { width: 36px; height: 36px; }
.cmc-portrait, .cmc-avatar-img { display: block; width: 36px; height: 36px; max-width: none; object-fit: cover; }
.cmc-dot {
  position: absolute;
  top: 0;
  right: -1px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #3fb76b;
  box-shadow: 0 0 0 2px var(--cmc-bg);
}

/* ---- closed: launcher, halo, greeting ---- */
.cmc-launcher {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 60px;
  height: 60px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
  cursor: pointer;
  pointer-events: auto;
  z-index: 3;
  -webkit-tap-highlight-color: transparent;
}
.cmc-root:not([data-state="closed"]) .cmc-launcher { pointer-events: none; }
.cmc-launcher:focus-visible { outline: 2px solid var(--cmc-ink); outline-offset: 3px; }

.cmc-halo {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  border: 1.5px solid var(--cmc-ink);
  opacity: 0;
  pointer-events: none;
}
.cmc-root[data-state="closed"] .cmc-halo { animation: cmc-breathe 3.6s cubic-bezier(0.2, 0.7, 0.3, 1) 1.2s infinite; }
.cmc-root[data-state="closed"]:has(.cmc-launcher:hover) .cmc-halo { animation-duration: 1.6s; }

.cmc-greet {
  position: absolute;
  right: 0;
  bottom: 74px;
  display: flex;
  align-items: flex-start;
  gap: 2px;
  max-width: 250px;
  padding: 12px 10px 12px 16px;
  border-radius: 20px 20px 6px 20px;
  background: var(--cmc-bg);
  border: 1px solid var(--cmc-line);
  box-shadow: 0 18px 40px -18px rgba(20, 16, 10, 0.35);
  transform-origin: 100% 100%;
  transform: scale(0.4) translateY(20px);
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transition: transform 0.5s cubic-bezier(0.3, 1.35, 0.5, 1), opacity 0.2s, visibility 0s 0.5s;
}
.cmc-greet.is-shown { transform: none; opacity: 1; visibility: visible; pointer-events: auto; transition-delay: 0s; }
.cmc-greet-body {
  border: 0;
  padding: 0;
  background: transparent;
  color: var(--cmc-ink);
  font: inherit;
  font-size: 13.5px;
  line-height: 1.45;
  text-align: left;
  cursor: pointer;
}
.cmc-greet-name { display: block; font-size: 12px; font-weight: 650; color: var(--cmc-muted); margin-bottom: 2px; }
.cmc-greet-x {
  flex: none;
  width: 22px;
  height: 22px;
  margin-top: -4px;
  border: 0;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: transparent;
  color: var(--cmc-muted);
  cursor: pointer;
}
.cmc-greet-x:hover { background: color-mix(in oklab, var(--cmc-ink) 6%, transparent); color: var(--cmc-ink); }
.cmc-greet-x svg { display: block; max-width: none; }

.cmc-root button:focus-visible { outline: 2px solid var(--cmc-ink); outline-offset: 2px; }

@keyframes cmc-pop { from { transform: scale(0.6); opacity: 0; } to { transform: none; opacity: 1; } }
@keyframes cmc-word { from { transform: translateY(6px); opacity: 0; } to { transform: none; opacity: 1; } }
@keyframes cmc-rise { from { transform: translateY(10px) scale(0.96); opacity: 0; } to { transform: none; opacity: 1; } }
@keyframes cmc-roll { from { transform: translateY(110%); opacity: 0; } to { transform: none; opacity: 1; } }
@keyframes cmc-bob { 0%, 60%, 100% { transform: translateY(0); } 30% { transform: translateY(-4px); } }
@keyframes cmc-breathe { 0% { transform: scale(1); opacity: 0.35; } 70%, 100% { transform: scale(1.45); opacity: 0; } }

@media (prefers-reduced-motion: reduce) {
  .cmc-root *, .cmc-root *::before, .cmc-root *::after { animation: none !important; transition: none !important; }
}
`

type Phase = "open" | "closed" | "moving"
type KeyDiv = React.KeyboardEvent<HTMLDivElement>
