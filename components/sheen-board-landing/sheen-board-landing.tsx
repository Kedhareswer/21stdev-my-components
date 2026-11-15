import { Fragment, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react"

// #region motion
// Pure timing data, measured on the reference with headless Chrome. No React, no DOM: the test lifts this region.

/** Word reveal spring: 13% at 48ms, 45% at 95ms, 90% at 235ms, 0.9% overshoot near 470ms, settled by ~600ms. */
export const EASE_WORD =
  "linear(0,0.035 3%,0.13 6.1%,0.448 13.7%,0.678 21.3%,0.806 28.7%,0.898 36.3%,0.952 44%,0.982 51.6%,0.999 59.4%,1.006 66.8%,1.009 74.4%,1.009 81.8%,1.0055 89.5%,1.0018 97%,1)"
export const DUR_WORD = 620
/** Block reveal spring (paragraphs, cards, rows): slower, same 0.9% overshoot. */
export const EASE_ITEM =
  "linear(0,0.02 2.4%,0.075 5.2%,0.3 10.3%,0.51 15.6%,0.665 20.9%,0.775 26.1%,0.85 31.4%,0.9 36.6%,0.945 41.8%,0.965 46.9%,0.985 52.2%,0.996 57.3%,1.003 62.7%,1.006 67.8%,1.008 73.2%,1.009 78.2%,1.008 83.3%,1.006 88.9%,1)"
export const DUR_ITEM = 900
/** Tilt-in spring (boards, trust cards): perspective(1500) translateY(140) scale(.9) rotateX(-30) to rest. */
export const EASE_TILT =
  "linear(0,0.2 4.6%,0.36 9.2%,0.49 13.8%,0.61 19.7%,0.68 23.2%,0.77 26.8%,0.81 28.8%,0.86 32.8%,0.89 36.5%,0.92 40.3%,0.94 45.1%,0.96 48.4%,0.97 52.1%,0.98 55.5%,0.99 59.3%,0.995 62.7%,1 66.2%,1.0037 70%,1.0066 74.6%,1.008 78.1%,1.009 81.5%,1.0092 85.4%,1.0085 89.2%,1)"
export const DUR_TILT = 1300
/** Hover / toggle spring: damping ~0.8, 1.3% overshoot, ~370ms. */
export const EASE_FAST =
  "linear(0,0.0471,0.1568,0.2933,0.4335,0.5638,0.677,0.7706,0.8447,0.9011,0.9423,0.9712,0.9905,1.0025,1.0092,1.0123,1.013,1.0123,1.0109,1.0091,1.0073,1.0056,1.0041,1.0029,1)"
export const DUR_FAST = 380
/** Slideshow glide: overdamped, no overshoot. 19% at 80ms, 49% at 163ms, 81% at 336ms, 94% at 523ms, rest at 1170ms. */
export const EASE_SLIDE = "linear(0,0.19 7%,0.49 14%,0.68 21%,0.81 29%,0.89 37%,0.94 45%,0.96 51%,0.975 58%,0.984 64%,0.99 71%,0.994 79%,0.997 86%,1)"
export const DUR_SLIDE = 1170
/** The slideshow moves one card every 4s. */
export const SLIDE_EVERY = 4000
/** Light shafts and the hero drift share one tween. */
export const EASE_LIGHT = "cubic-bezier(.21,.99,.33,1.04)"

/** Words of a heading land 80ms apart. */
export const WORD_STEP = 80
/** Items in a row land ~95ms apart; a section starts ~200ms after it enters view. */
export const ITEM_STEP = 95
export const VIEW_DELAY = 200

/** Hero load timeline (ms from mount). */
export const HERO = { nav: 300, words: 450, board: 850, sub: 900, explore: 1050, start: 1150 } as const

/** Delay of word i in a heading that starts at `start`. */
export const wordDelay = (i: number, start: number, step = WORD_STEP) => Math.round(start + Math.max(0, i) * step)
/** Delay of the i-th item of a row, capped so a long row never waits forever. */
export const itemDelay = (i: number, start = VIEW_DELAY, step = ITEM_STEP, cap = 5) => Math.round(start + Math.min(Math.max(0, i), cap) * step)

/** Board design size; it is drawn at this size and scaled to fit its frame. */
export const BOARD_W = 1260
export const BOARD_H = 697
export const boardScale = (w: number) => (w > 0 && isFinite(w) ? w / BOARD_W : 1)

/** Infinite carousel over n cards repeated 3x: keep the index inside the middle copy. */
export const wrapIndex = (idx: number, n: number) => (n > 0 ? n + (((idx - n) % n) + n) % n : 0)
// #endregion

type Tag = "Web" | "Brand" | "Mobile"
type Task = { t: string; id: string; tag: Tag; who: string[]; d?: string; ghost?: boolean }
type Col = { name: string; tone: string; tasks: (Task | null)[] }

const COLS: Col[] = [
  {
    name: "Queued",
    tone: "#31c653",
    tasks: [
      { t: "Project 01 · hero layout", id: "SH 1", tag: "Web", who: ["C1", "C2", "K"] },
      { t: "Project 02 · logo pass", id: "SH 2", tag: "Web", who: ["K"], d: "5 Oct" },
      { t: "Project 07 · case study", id: "SH 3", tag: "Web", who: ["C1", "K"], ghost: true },
      { t: "Project 04 · app icons", id: "SH 4", tag: "Web", who: ["C3", "K"], d: "24 Sep" },
    ],
  },
  {
    name: "In progress",
    tone: "#31c653",
    tasks: [{ t: "Project 03 · pricing", id: "SH 5", tag: "Mobile", who: ["C2", "C1", "K"], d: "2026" }, null, { t: "Project 05 · motion", id: "SH 6", tag: "Brand", who: ["C1", "C3", "K"] }],
  },
  {
    name: "Client review",
    tone: "#4f7dff",
    tasks: [
      { t: "Project 02 · moodboard", id: "SH 7", tag: "Brand", who: ["C2", "C3", "K"], d: "Nov 20" },
      { t: "Client 2 · copy review", id: "SH 8", tag: "Mobile", who: ["C2", "K"] },
      { t: "Project 06 · checkout", id: "SH 9", tag: "Web", who: ["C3", "C1", "K"] },
      { t: "Client 3 · launch notes for the new site", id: "SH 10", tag: "Web", who: ["C3", "K"] },
    ],
  },
  {
    name: "Done",
    tone: "#31c653",
    tasks: [
      { t: "Project 01 · sitemap", id: "SH 11", tag: "Mobile", who: ["K"] },
      { t: "Client 1 · kickoff deck", id: "SH 12", tag: "Web", who: ["C1", "K"] },
      { t: "Project 03 · style tiles", id: "SH 13", tag: "Mobile", who: ["C2", "C3", "K"] },
      { t: "Project 05 · onboarding", id: "SH 14", tag: "Web", who: ["K", "C3"] },
    ],
  },
]

const FEATURES = [
  { k: "invite", t: "Role-aware invite links", d: "Share one link, whether they're a client or a teammate." },
  { k: "safe", t: "Client-safe task controls", d: "Flag tasks a client may see and keep the rest in the studio." },
  { k: "jump", t: "Quick switcher", d: "Search every task in the project and jump straight to it." },
  { k: "kit", t: "One calm UI system", d: "A single dark set of parts, tuned for long days." },
] as const

const FAQ = [
  {
    q: "What is Sheen, exactly?",
    a: "Sheen is a client board Kedhareswer designed and built for solo makers and small studios: tasks, files and sign-off in one place, with a calm view you can share with the people you work for.",
  },
  {
    q: "How do the AI summaries work?",
    a: "Every Friday Sheen reads what moved on your boards and drafts a short note for each client. You edit it and send it, or ignore it. Nothing leaves without you.",
  },
  {
    q: "Who can see my clients' work?",
    a: "Only the people you invite. Client links show client-visible tasks and nothing else, and any link can be revoked in one click, so every project stays private.",
  },
  {
    q: "Can it look like my studio?",
    a: "Yes. Swap the accent, the logo and the wording to suit your studio. The board keeps its structure while the colours, labels and tone of voice follow yours.",
  },
] as const

const PLANS = [
  {
    name: "Free",
    blurb: "Built for trying Sheen on one real client project.",
    price: "$0",
    per: "Forever",
    cta: "Sign up",
    primary: false,
    limits: ["1 active board", "2 client seats", "100 MB of file storage", "Weekly digest preview"],
    feats: ["Drag-and-drop board", "Client-safe task controls", "Quick switcher", "Email support"],
  },
  {
    name: "Studio",
    blurb: "Ideal for a solo maker running a few clients.",
    price: "$18",
    per: "per month",
    cta: "Go Studio",
    primary: true,
    limits: ["5 boards", "10 client seats", "Unlimited tasks", "5 GB of file storage"],
    feats: ["Everything in Free", "Friday AI digests", "Custom accent and logo", "Export to CSV and JSON"],
  },
  {
    name: "Team",
    blurb: "For growing studios with many boards on the go.",
    price: "$45",
    per: "per month",
    cta: "Contact us",
    primary: false,
    limits: ["Unlimited boards", "Unlimited client seats", "50 GB of file storage", "Priority digest delivery"],
    feats: ["Everything in Studio", "Roles and permissions", "A direct line to Kedhareswer", "Workspace-level controls"],
  },
] as const

const AV: Record<string, string> = { K: "#5b8cff", C1: "#27b84a", C2: "#e0a31c", C3: "#c96a45" }
const TAGC: Record<Tag, string> = { Web: "#5f8dff", Brand: "#3ecf63", Mobile: "#d9c545" }

const vars = (o: Record<string, string | number>) => o as unknown as CSSProperties
/** Inline reveal settings: delay, rise and slide. */
const rv = (ms: number, y = 30, x = 0) => vars({ "--rd": ms + "ms", "--ry": y + "px", "--rx": x + "px" })

function Words({ text, start, as = "h2", className = "" }: { text: string; start: number; as?: "h1" | "h2"; className?: string }) {
  const El = as
  const words = text.split(" ")
  return (
    <El className={"sh-wd " + className}>
      {words.map((w, i) => (
        <Fragment key={i}>
          <span className="sh-w" style={vars({ "--rd": wordDelay(i, start) + "ms" })}>
            {w}
          </span>
          {i < words.length - 1 ? " " : null}
        </Fragment>
      ))}
    </El>
  )
}

/** The mark: a pale disc with a glint cut into it. */
function Mark({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 26 26" aria-hidden="true">
      <circle cx="13" cy="13" r="13" fill="#d6d6d6" />
      <path d="M7.4 14.6c.7-3.6 2.9-6 6.6-6.7" fill="none" stroke="#2a2a2a" strokeWidth="2.3" strokeLinecap="round" />
      <circle cx="16.9" cy="16.6" r="1.9" fill="#2a2a2a" />
    </svg>
  )
}

function Tile({ size = 54 }: { size?: number }) {
  return (
    <span className="sh-tile" style={vars({ "--s": size + "px" })}>
      <Mark size={Math.round(size * 0.48)} />
    </span>
  )
}

function Avatar({ who, size = 18 }: { who: string; size?: number }) {
  return (
    <span className="sh-av" style={vars({ "--c": AV[who] || "#666", "--s": size + "px" })}>
      {who}
    </span>
  )
}

/** A collaborator's pointer: an arrow with a round name badge. `at` puts the arrow on one corner of the badge. */
function Cursor({ who, size = 34, at = "tl" }: { who: string; size?: number; at?: "tl" | "tr" | "bl" }) {
  return (
    <span className={"sh-cur sh-cur-" + at} style={vars({ "--c": AV[who], "--s": size + "px" })} aria-hidden="true">
      <svg width="26" height="26" viewBox="0 0 26 26">
        <path d="M3 3l19 6.4-7.3 3.3-3.3 7.6z" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      </svg>
      <b>{who}</b>
    </span>
  )
}

function Clock({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" aria-hidden="true">
      <circle cx="7" cy="7" r="7" fill="currentColor" />
      <path d="M7 3.6V7l2.3 1.4" fill="none" stroke="#1c1c1c" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function TaskCard({ task }: { task: Task }) {
  return (
    <div className={"sh-task" + (task.ghost ? " sh-task-ghost" : "")}>
      <div className="sh-task-top">
        <span>
          <Clock /> {task.d || "24 Sep - 5 Oct"}
        </span>
        <span>{task.id}</span>
      </div>
      <div className="sh-task-t">{task.t}</div>
      <div className="sh-task-bot">
        <span className="sh-chip" style={vars({ "--c": TAGC[task.tag] })}>
          {task.tag}
        </span>
        <span className="sh-avs">
          {task.who.map((w) => (
            <Avatar key={w} who={w} size={18} />
          ))}
        </span>
      </div>
    </div>
  )
}

/** The product board, drawn at BOARD_W x BOARD_H and scaled into whatever frame holds it. */
function Board({ view = "you", live = true, fit = "", long = false }: { view?: "you" | "client"; live?: boolean; fit?: string; long?: boolean }) {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current as HTMLDivElement | null
    if (!el || typeof ResizeObserver === "undefined") return
    const ro = new ResizeObserver((es) => {
      for (const e of es) el.style.setProperty("--k", String(boardScale(e.contentRect.width)))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const client = view === "client"
  return (
    <div className={"sh-bwrap " + fit + (long ? " sh-bwrap-long" : "")} ref={ref}>
      <div className={"sh-board" + (client ? " sh-board-client" : "")}>
        <span className="sh-ws">
          <span className="sh-ws-mark">
            <Mark size={16} />
          </span>
          Sheen
          <svg width="8" height="12" viewBox="0 0 8 12" aria-hidden="true">
            <path d="M1.5 4.5L4 2l2.5 2.5M1.5 7.5L4 10l2.5-2.5" fill="none" stroke="currentColor" strokeWidth="1.1" />
          </svg>
        </span>
        <span className="sh-btabs">
          <span className="on">Board</span>
          <span>People</span>
          <span>Notifications</span>
          <span>Light mode</span>
        </span>
        {client ? <span className="sh-newtask">● New task</span> : null}
        <span className="sh-gear">
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
            <path d="M8 1.2l1.2 1.7 2-.5.6 2 2 .7-.6 2 1.2 1.6-1.6 1.3.2 2.1-2.1.2-1 1.9L8 13.4l-1.9.8-1-1.9-2.1-.2.2-2.1L1.6 8.7 2.8 7l-.6-2 2-.6.6-2 2 .5z" fill="currentColor" />
            <circle cx="8" cy="8" r="2.2" fill="#1c1c1c" />
          </svg>
        </span>
        <div className="sh-cols">
          {COLS.map((c, ci) => (
            <div key={c.name} className={"sh-col sh-col-" + ci}>
              <div className="sh-col-h" style={vars({ "--c": c.tone })}>
                <span>{c.name}</span>
                <span className="sh-dots">⋮</span>
              </div>
              {c.tasks.map((t, ti) => (t ? <TaskCard key={t.id} task={t} /> : <div key={"drop" + ti} className="sh-drop" />))}
              {long && ci !== 1 ? c.tasks.map((t) => (t ? <TaskCard key={"b" + t.id} task={{ ...t, ghost: false }} /> : null)) : null}
              {ci !== 1 ? <div className="sh-add">+</div> : null}
            </div>
          ))}
        </div>
        {!client ? (
          <>
            <div className={"sh-drag" + (live ? " sh-live" : "")}>
              <div className="sh-task-top">
                <span>
                  <Clock size={18} /> 24 Sep
                </span>
                <span>SH 3</span>
              </div>
              <div className="sh-task-t">Project 07 · case study</div>
              <span className="sh-chip" style={vars({ "--c": TAGC.Web })}>
                Web
              </span>
            </div>
            <span className="sh-pt sh-pt-k">
              <Cursor who="K" size={42} at="tr" />
            </span>
            <span className="sh-pt sh-pt-c2">
              <Cursor who="C2" at="tl" />
            </span>
            <span className="sh-pt sh-pt-c1">
              <Cursor who="C1" at="bl" />
            </span>
          </>
        ) : null}
      </div>
    </div>
  )
}

/** Skewed glass panels, one composition per feature card. */
function Art({ k }: { k: string }) {
  const tone: Record<string, string> = { invite: "#31c653", safe: "#4f7dff", jump: "#31c653", kit: "#e07a3a" }
  const body: Record<string, ReactNode> = {
    invite: (
      <>
        <div className="sh-g1 sh-ga" />
        <div className="sh-g1 sh-gb">
          <div className="sh-pin">
            <i className="sh-dot" />
            <b>7 3 1 9</b>
            <span>↻ New PIN</span>
          </div>
          <div className="sh-url">sheen.app/invite/client-2…</div>
        </div>
      </>
    ),
    safe: (
      <>
        <div className="sh-g1 sh-ga" />
        <div className="sh-g1 sh-gb sh-gcol">
          <div className="sh-gh">
            <i /> Client review <em>⋮</em>
          </div>
          <div className="sh-gcard on">
            <span>
              <Clock size={9} /> Nov 20 <em>SH 4</em>
            </span>
            <b>Project 02 · review</b>
            <u>Brand</u>
            <span className="sh-avs">
              <Avatar who="C2" size={13} />
              <Avatar who="K" size={13} />
            </span>
          </div>
          <div className="sh-gcard dim">
            <span>
              <Clock size={9} /> Nov 22 <em>SH 5</em>
            </span>
            <b>Client 1 · copy</b>
            <u>Web</u>
          </div>
          <div className="sh-gcard dim" />
        </div>
      </>
    ),
    jump: (
      <>
        <div className="sh-g1 sh-ga" />
        <div className="sh-g1 sh-gb sh-gcol">
          <div className="sh-gli">⌕ Type a command or search…</div>
          <div className="sh-gli">+ Create new task</div>
          <div className="sh-gli">◐ Create new project</div>
          <div className="sh-gli on">✦ Invite Client 1</div>
        </div>
      </>
    ),
    kit: (
      <>
        <div className="sh-g1 sh-ga sh-gcol">
          <div className="sh-gh">
            <i /> Queued
          </div>
          <div className="sh-gcard dim" />
          <div className="sh-gcard dim" />
        </div>
        <div className="sh-g1 sh-gb sh-gcol">
          <div className="sh-gh">
            <i /> In progress <em>⋮</em>
          </div>
          <div className="sh-gcard dim" />
          <div className="sh-gcard on">
            <span>
              <Clock size={9} /> 24 Sep <em>SH 3</em>
            </span>
            <b>Project 07 · case study</b>
            <u>Web</u>
            <span className="sh-avs">
              <Avatar who="C1" size={13} />
              <Avatar who="K" size={13} />
            </span>
          </div>
          <div className="sh-gcard dim" />
        </div>
      </>
    ),
  }
  return (
    <div className={"sh-art sh-art-" + k} style={vars({ "--c": tone[k] })} aria-hidden="true">
      <div className="sh-skew">{body[k]}</div>
    </div>
  )
}

function Check() {
  return (
    <svg width="12" height="9" viewBox="0 0 12 9" aria-hidden="true">
      <path d="M1 4.6l3.2 3.2L11 1" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function Btn({ children, primary = false, href, onClick, className = "" }: { children: ReactNode; primary?: boolean; href?: string; onClick?: (e: { preventDefault: () => void }) => void; className?: string }) {
  const cls = "sh-btn " + (primary ? "sh-btn-p" : "sh-btn-s") + (className ? " " + className : "")
  return href ? (
    <a className={cls} href={href} onClick={onClick}>
      <span>{children}</span>
    </a>
  ) : (
    <button type="button" className={cls} onClick={onClick}>
      <span>{children}</span>
    </button>
  )
}

export interface SheenBoardLandingProps {
  /** Height of the scrolling page. Any CSS length; defaults to the viewport. */
  height?: string | number
  /** Where every contact link points. */
  email?: string
  className?: string
}

const NAV = [
  ["Home", "sh-top"],
  ["Features", "sh-features"],
  ["FAQ", "sh-faq"],
  ["Pricing", "sh-pricing"],
  ["Contact", "sh-contact"],
] as const

const HEADLINE = "Plan every project on one calm board."

export default function SheenBoardLanding({ height = "100svh", email = "kedhareswer.12110626@gmail.com", className = "" }: SheenBoardLandingProps) {
  const rootRef = useRef(null)
  const scrollRef = useRef(null)
  const [view, setView] = useState("you" as "you" | "client")
  const [open, setOpen] = useState(-1 as number)
  const [menu, setMenu] = useState(false)
  const n = FEATURES.length
  const [idx, setIdx] = useState(n as number)
  const [snap, setSnap] = useState(false)
  const mail = "mailto:" + email

  // reveals: hero on mount, everything else when its group scrolls into view
  useEffect(() => {
    const root = rootRef.current as HTMLDivElement | null
    const sc = scrollRef.current as HTMLDivElement | null
    if (!root || !sc) return
    const reduce = typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const groups = Array.from(root.querySelectorAll(".sh-g")) as HTMLElement[]
    if (reduce || typeof IntersectionObserver === "undefined") {
      groups.forEach((g) => g.classList.add("sh-in"))
      root.classList.add("sh-go")
      return
    }
    let raf = requestAnimationFrame(() => {
      raf = requestAnimationFrame(() => {
        root.classList.add("sh-go")
        root.querySelector(".sh-hero")?.classList.add("sh-in")
      })
    })
    const io = new IntersectionObserver(
      (es) => {
        for (const e of es) {
          if (e.isIntersecting) {
            e.target.classList.add("sh-in")
            io.unobserve(e.target)
          }
        }
      },
      { root: sc, rootMargin: "0px 0px -40px 0px", threshold: 0 },
    )
    groups.filter((g) => !g.classList.contains("sh-hero")).forEach((g) => io.observe(g))
    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
    }
  }, [])

  // slideshow: one card every 4s; after sliding past either copy, jump back into the middle without animating
  useEffect(() => {
    const reduce = typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (reduce) return
    const t = window.setInterval(() => {
      if (!document.hidden) setIdx((i) => Math.min(3 * n - 1, i + 1))
    }, SLIDE_EVERY)
    return () => window.clearInterval(t)
  }, [n, idx])
  useEffect(() => {
    if (!snap) return
    const r = requestAnimationFrame(() => requestAnimationFrame(() => setSnap(false)))
    return () => cancelAnimationFrame(r)
  }, [snap])
  const settle = () => {
    const w = wrapIndex(idx, n)
    if (w !== idx) {
      setSnap(true)
      setIdx(w)
    }
  }
  const step = (d: number) => {
    if (snap) return
    setIdx((i) => Math.max(0, Math.min(3 * n - 1, i + d)))
  }
  const swipe = useRef({ x: 0, on: false })

  const go = (id: string) => (e: { preventDefault: () => void }) => {
    e.preventDefault()
    setMenu(false)
    const sc = scrollRef.current as HTMLDivElement | null
    const el = sc?.querySelector("#" + id) as HTMLElement | null
    if (!sc) return
    const reduce = typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const top = el ? el.getBoundingClientRect().top - sc.getBoundingClientRect().top + sc.scrollTop : 0
    sc.scrollTo({ top: id === "sh-top" ? 0 : Math.max(0, top), behavior: reduce ? "auto" : "smooth" })
  }

  const cards = [...FEATURES, ...FEATURES, ...FEATURES]

  return (
    <div ref={rootRef} className={"sh-root " + className} style={{ height, width: "100%" }}>
      <style>{CSS}</style>
      <div className="sh-scroll" ref={scrollRef}>
        <header className="sh-nav">
          <div className="sh-nav-in">
            <a href="#sh-top" className="sh-brand" onClick={go("sh-top")} aria-label="Sheen, back to top">
              <Tile />
            </a>
            <nav className={"sh-links" + (menu ? " sh-links-open" : "")} aria-label="Sections">
              {NAV.map(([label, id], i) => (
                <a key={id} href={"#" + id} className={i === 0 ? "on" : ""} onClick={go(id)}>
                  {label}
                </a>
              ))}
              <a className="sh-links-cta" href={mail}>
                Sign up
              </a>
            </nav>
            <Btn href={mail} className="sh-nav-cta">
              Sign up
            </Btn>
            <button type="button" className={"sh-burger" + (menu ? " on" : "")} aria-label="Menu" aria-expanded={menu} onClick={() => setMenu((m) => !m)}>
              <i />
              <i />
            </button>
          </div>
        </header>

        {/* hero */}
        <section className="sh-g sh-hero" id="sh-top">
          <div className="sh-toplight" aria-hidden="true" />
          <div className="sh-rays" aria-hidden="true">
            <div className="sh-ray sh-ray-1" />
            <div className="sh-ray sh-ray-2" />
            <div className="sh-ray sh-ray-3" />
          </div>
          <div className="sh-hero-in sh-wo">
            <div className="sh-hero-row">
              <div className="sh-hero-copy">
                <Words as="h1" text={HEADLINE} start={HERO.words} className="sh-h1" />
                <p className="sh-rv sh-lead" style={rv(HERO.sub, 60)}>
                  Kedhareswer's client board with live tasks, safe client views and weekly AI notes.
                </p>
              </div>
              <div className="sh-hero-btns">
                <span className="sh-rv" style={rv(HERO.explore, 30)}>
                  <Btn href="#sh-features" onClick={go("sh-features")}>
                    Explore
                  </Btn>
                </span>
                <span className="sh-rv" style={rv(HERO.start, 30)}>
                  <Btn primary href={mail}>
                    Try it free
                  </Btn>
                </span>
              </div>
            </div>
            <div className="sh-tilt sh-hero-board" style={rv(HERO.board)}>
              <Board fit="sh-bfix" />
            </div>
          </div>
        </section>

        {/* features */}
        <section className="sh-band" id="sh-features">
          <div className="sh-wi sh-feat">
            <div className="sh-g sh-feat-head">
              <div>
                <Words text="Everything you need for a client-ready project" start={VIEW_DELAY} className="sh-h2 sh-h2-left" />
                <p className="sh-rv sh-sub sh-sub-left" style={rv(VIEW_DELAY, 54)}>
                  Made for freelancers and studios who want the power of a real task board, but a client side that feels tidy and under control.
                </p>
              </div>
              <div className="sh-rv sh-arrows" style={rv(VIEW_DELAY + ITEM_STEP, 60)}>
                <button type="button" aria-label="Previous feature" onClick={() => step(-1)}>
                  <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden="true">
                    <path d="M22 14.5L16.5 20l5.500 5.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <button type="button" aria-label="Next feature" onClick={() => step(1)}>
                  <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden="true">
                    <path d="M18 14.5l5.500 5.500-5.500 5.500" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            </div>
            <div
              className="sh-g sh-car"
              onPointerDown={(e) => {
                swipe.current = { x: e.clientX, on: e.pointerType !== "mouse" }
              }}
              onPointerUp={(e) => {
                if (!swipe.current.on) return
                const dx = e.clientX - swipe.current.x
                swipe.current.on = false
                if (Math.abs(dx) > 40) step(dx < 0 ? 1 : -1)
              }}
            >
              <div className="sh-rv sh-car-rv" style={rv(VIEW_DELAY + ITEM_STEP, 70)}>
                <div
                  className={"sh-track" + (snap ? " sh-snap" : "")}
                  style={vars({ "--i": idx })}
                  onTransitionEnd={(e) => {
                    if (e.target === e.currentTarget && e.propertyName === "transform") settle()
                  }}
                >
                  {cards.map((f, i) => (
                    <article key={i} className="sh-rv sh-fcard" style={rv(itemDelay(i - n, VIEW_DELAY + ITEM_STEP), 70)} aria-hidden={i < idx || i > idx + 3}>
                      <div className="sh-fimg">
                        <Art k={f.k} />
                      </div>
                      <h3>{f.t}</h3>
                      <p>{f.d}</p>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* two views */}
        <section className="sh-views">
          <div className="sh-g sh-rv sh-glow" style={vars({ "--rd": VIEW_DELAY + "ms", "--ry": "230px", "--rx": "80px" })} aria-hidden="true" />
          <div className="sh-g sh-center sh-wi">
            <Words text="Two views. One board." start={VIEW_DELAY} className="sh-h2" />
            <p className="sh-rv sh-sub" style={rv(VIEW_DELAY, 54)}>
              Clients only see what you allow.
            </p>
          </div>
          <div className="sh-g sh-views-stage">
            <div className="sh-tilt sh-device" style={rv(VIEW_DELAY)}>
              <div className="sh-seg" role="tablist" aria-label="Board view">
                <button type="button" role="tab" aria-selected={view === "you"} className={view === "you" ? "on" : ""} onClick={() => setView("you")}>
                  Your view
                </button>
                <button type="button" role="tab" aria-selected={view === "client"} className={view === "client" ? "on" : ""} onClick={() => setView("client")}>
                  Client view
                </button>
              </div>
              <div className="sh-screens">
                <div className={"sh-scr" + (view === "you" ? " on" : "")} aria-hidden={view !== "you"}>
                  <Board live={false} long />
                </div>
                <div className={"sh-scr sh-scr-2" + (view === "client" ? " on" : "")} aria-hidden={view !== "client"}>
                  <Board view="client" live={false} long />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* trust */}
        <section className="sh-band sh-band-fade sh-trust">
          <div className="sh-wi">
            <div className="sh-g sh-center">
              <div className="sh-rv" style={rv(VIEW_DELAY, 70)}>
                <Tile size={90} />
              </div>
              <h2 className="sh-rv sh-h2 sh-trust-h" style={rv(VIEW_DELAY + 140, 70)}>
                Built to be trusted. Ready on day one.
              </h2>
              <p className="sh-rv sh-sub sh-sub-c" style={rv(VIEW_DELAY + 235, 70)}>
                Kedhareswer shaped Sheen around real client projects. You can try every part in the demo workspace.
              </p>
            </div>
            <div className="sh-g sh-tcards">
              <article className="sh-tilt sh-tcard" style={vars({ "--rd": VIEW_DELAY + "ms", "--c": "64,119,71", "--e": "74%" })}>
                <h3>Built as a real app</h3>
                <p>tidy code + a ready-to-edit UI</p>
                <div className="sh-tvis">
                  <div className="sh-think">
                    <svg width="18" height="20" viewBox="0 0 18 20" aria-hidden="true">
                      <path d="M9 1.5a6 6 0 00-3.6 10.800V14.500h7.200v-2.200A6 6 0 009 1.500zM6.600 17.500h4.800" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                    Thought for a moment.
                  </div>
                  <i className="sh-sk" style={{ width: 213 }} />
                  <i className="sh-sk" style={{ width: 142 }} />
                  <i className="sh-sk" style={{ width: 178 }} />
                  <i className="sh-sk" style={{ width: 84 }} />
                  <i className="sh-sk" style={{ width: 208 }} />
                  <div className="sh-compose">
                    <span>
                      Send Client 1 the weekly note<b className="sh-caret" />
                    </span>
                    <span className="sh-send">
                      <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
                        <path d="M6 10V2.500M2.800 5.500L6 2.300l3.200 3.200" fill="none" stroke="currentColor" strokeWidth="1.500" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                  </div>
                  <span className="sh-pt sh-tp1">
                    <Cursor who="C2" size={40} at="bl" />
                  </span>
                </div>
              </article>
              <article className="sh-tilt sh-tcard" style={vars({ "--rd": VIEW_DELAY + 100 + "ms", "--c": "133,81,53", "--e": "80%" })}>
                <h3>Demo workspace included</h3>
                <p>explore before you commit</p>
                <div className="sh-tvis sh-tvis-bare">
                  <div className="sh-signin">
                    <div className="sh-signin-h">
                      <Tile size={58} /> How would you like to sign in?
                    </div>
                    <div className="sh-opt">Continue with email</div>
                    <div className="sh-opt">Continue with a passkey</div>
                    <div className="sh-opt on">Open the demo workspace</div>
                  </div>
                  <span className="sh-pt sh-tp2">
                    <Cursor who="K" size={40} at="tr" />
                  </span>
                </div>
              </article>
              <article className="sh-tilt sh-tcard" style={vars({ "--rd": VIEW_DELAY + 200 + "ms", "--c": "82,132,242", "--e": "88%" })}>
                <h3>Your data stays yours</h3>
                <p>ownership + an export-friendly structure</p>
                <div className="sh-tvis sh-orbit">
                  <i className="sh-ring sh-ring-1" />
                  <i className="sh-ring sh-ring-2" />
                  <span className="sh-db">
                    <svg width="64" height="64" viewBox="0 0 64 64" aria-hidden="true">
                      <path d="M12 16v30c0 4.400 8 8 18 8 2 0 3.900-.100 5.700-.400L33 44l12-3 3-9V16" fill="#bdbdbd" />
                      <ellipse cx="30" cy="16" rx="18" ry="8" fill="#e4e4e4" />
                      <path d="M12 26c0 4.400 8 8 18 8s18-3.600 18-8M12 36c0 4.400 8 8 18 8" fill="none" stroke="#6a6a6a" strokeWidth="2.500" />
                      <path d="M40 42l14 5-5.500 2.500L52 56l-4 2-3.500-6.500L40 55z" fill="#f2f2f2" stroke="#3a3a3a" strokeWidth="1.500" strokeLinejoin="round" />
                    </svg>
                  </span>
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* faq */}
        <section className="sh-faq" id="sh-faq">
          <div className="sh-wi">
            <div className="sh-g sh-center">
              <Words text="Frequently asked questions" start={VIEW_DELAY} className="sh-h2" />
              <p className="sh-rv sh-sub sh-sub-12" style={rv(VIEW_DELAY + ITEM_STEP, 30)}>
                The things people ask Kedhareswer before they try Sheen
              </p>
            </div>
            <div className="sh-g sh-qs">
              {FAQ.map((f, i) => (
                <div key={f.q} className={"sh-rv sh-q" + (open === i ? " open" : "")} style={rv(100, 30)}>
                  <button type="button" className="sh-q-btn" aria-expanded={open === i} onClick={() => setOpen((o) => (o === i ? -1 : i))}>
                    <span>{f.q}</span>
                    <span className="sh-plus" aria-hidden="true" />
                  </button>
                  <div className="sh-q-a">
                    <div>
                      <p>{f.a}</p>
                    </div>
                  </div>
                </div>
              ))}
              <div className="sh-rv sh-q sh-q-last" style={rv(100, 30)}>
                <span>Still have questions?</span>
                <Btn primary href={mail}>
                  Contact us
                </Btn>
              </div>
            </div>
          </div>
        </section>

        {/* pricing */}
        <section className="sh-band sh-band-fade sh-pricing" id="sh-pricing">
          <div className="sh-wi">
            <div className="sh-g sh-center">
              <Words text="Pricing" start={VIEW_DELAY} className="sh-h2" />
              <p className="sh-rv sh-sub sh-sub-12" style={rv(VIEW_DELAY + ITEM_STEP, 30)}>
                Start free, then upgrade when your boards fill up
              </p>
            </div>
            <div className="sh-g sh-plans">
              {PLANS.map((p, i) => (
                <div key={p.name} className={"sh-rv sh-plan-w" + (p.primary ? " sh-plan-rec" : "")} style={rv(itemDelay(i), 30)}>
                  {p.primary ? <span className="sh-rec">Recommended</span> : null}
                  <article className="sh-plan">
                    <h3>{p.name}</h3>
                    <p className="sh-blurb">{p.blurb}</p>
                    <div className="sh-price">
                      <b>{p.price}</b>
                      <span>{p.per}</span>
                    </div>
                    <Btn primary={p.primary} href={mail} className="sh-wide">
                      {p.cta}
                    </Btn>
                    <span className="sh-list-h">Usage limits</span>
                    <div className="sh-list">
                      {p.limits.map((x) => (
                        <span key={x}>
                          <Check /> {x}
                        </span>
                      ))}
                    </div>
                    <span className="sh-list-h">Features</span>
                    <div className="sh-list">
                      {p.feats.map((x) => (
                        <span key={x}>
                          <Check /> {x}
                        </span>
                      ))}
                    </div>
                  </article>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* cta */}
        <section className="sh-cta" id="sh-contact">
          <div className="sh-wi">
            <div className="sh-g sh-center">
              <span className="sh-rv sh-eyebrow" style={rv(VIEW_DELAY + ITEM_STEP, 50)}>
                Ready to start?
              </span>
              <Words text={HEADLINE} start={VIEW_DELAY} className="sh-h2 sh-h2-narrow" />
            </div>
            <div className="sh-g">
              <div className="sh-rv sh-ctacard" style={rv(VIEW_DELAY + 330, 80)}>
                <i className="sh-cta-light" aria-hidden="true" />
                <div className="sh-cta-copy">
                  <span className="sh-rv" style={rv(VIEW_DELAY + 330, 30)}>
                    <Tile />
                  </span>
                  <h2 className="sh-rv sh-h2" style={rv(VIEW_DELAY + 425, 30)}>
                    {HEADLINE}
                  </h2>
                  <p className="sh-rv sh-sub" style={rv(VIEW_DELAY + 520, 30)}>
                    Set up a board in a minute, invite Client 1, and send your first digest by Friday.
                  </p>
                  <span className="sh-rv" style={rv(VIEW_DELAY + 615, 30)}>
                    <Btn primary href={mail}>
                      Sign up
                    </Btn>
                  </span>
                </div>
                <div className="sh-rv sh-cta-board" style={rv(VIEW_DELAY + 330, 0, 100)}>
                  <Board live={false} />
                </div>
              </div>
            </div>
          </div>
        </section>

        <footer className="sh-g sh-foot sh-wo">
          <div className="sh-foot-top">
            <div className="sh-rv sh-foot-brand" style={rv(0, 30)}>
              <Tile size={80} />
              <p>{HEADLINE}</p>
            </div>
            <div className="sh-rv sh-foot-cols" style={rv(ITEM_STEP, 30)}>
              <div>
                <b>Company</b>
                {NAV.map(([label, id], i) => (
                  <a key={id} href={"#" + id} className={i === 0 ? "on" : ""} onClick={go(id)}>
                    {label}
                  </a>
                ))}
              </div>
              <div>
                <b>Get in touch</b>
                <a href={mail}>Email</a>
                <a href={mail + "?subject=Sheen%20demo"}>Book a demo</a>
                <a href={mail + "?subject=Sheen%20feedback"}>Feedback</a>
                <a href={mail + "?subject=Sheen%20support"}>Support</a>
              </div>
            </div>
          </div>
          <div className="sh-foot-bot">
            <span>
              Created by <a href={mail}>Kedhareswer</a>
            </span>
            <span>
              Write to <a href={mail}>Email</a>
            </span>
          </div>
        </footer>
      </div>
    </div>
  )
}

// Fonts: a 600–700 display subset and a 400–600 text subset (Latin, OFL), embedded so the page fetches nothing.
const FONT_DISPLAY = "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"
const FONT_SANS = "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"

const BTN_S = "linear-gradient(var(--sh-a),rgba(255,255,255,.05) var(--sh-p),#1a1a1a 75%)"
const DISPLAY = "font-family:ShDisplay,ui-sans-serif,system-ui,sans-serif;"

const CSS =
  "@font-face{font-family:ShDisplay;font-weight:600 700;font-style:normal;font-display:swap;src:url(data:font/woff2;base64," + FONT_DISPLAY + ") format('woff2')}" +
  "@font-face{font-family:ShSans;font-weight:400 600;font-style:normal;font-display:swap;src:url(data:font/woff2;base64," + FONT_SANS + ") format('woff2')}" +
  "@property --sh-a{syntax:'<angle>';inherits:false;initial-value:220deg}" +
  "@property --sh-p{syntax:'<percentage>';inherits:false;initial-value:25%}" +
  "@property --sh-sx{syntax:'<length>';inherits:false;initial-value:-5px}" +
  "@property --sh-sb{syntax:'<length>';inherits:false;initial-value:10px}" +
  ".sh-root{--sh-ew:" + EASE_WORD + ";--sh-ei:" + EASE_ITEM + ";--sh-et:" + EASE_TILT + ";--sh-ef:" + EASE_FAST + ";--sh-es:" + EASE_SLIDE + ";" +
  "position:relative;overflow:hidden;background:#101010;color:#b6b6b6;font-family:ShSans,Inter,ui-sans-serif,system-ui,sans-serif;font-size:16px;line-height:1.4;letter-spacing:-.02em;font-weight:400;-webkit-font-smoothing:antialiased;text-align:left;isolation:isolate}" +
  ".sh-root *,.sh-root *::before,.sh-root *::after{box-sizing:border-box}" +
  ".sh-root :where(h1,h2,h3,p){margin:0;font-weight:inherit;font-size:inherit}" +
  ".sh-root :where(a){color:inherit;text-decoration:none}" +
  ".sh-root :where(button){font:inherit;color:inherit;letter-spacing:inherit;background:none;border:0;padding:0;margin:0;cursor:pointer}" +
  ".sh-root :where(i,em,u,b){font-style:normal;text-decoration:none;font-weight:inherit}" +
  ".sh-root svg,.sh-root img{max-width:none;display:inline-block}" +
  ".sh-scroll{position:absolute;inset:0;overflow-y:auto;overflow-x:hidden;overscroll-behavior:contain;scrollbar-width:thin;scrollbar-color:#2a2a2a transparent}" +
  ".sh-wo{width:min(1260px,100% - 40px);margin-left:auto;margin-right:auto}" +
  ".sh-wi{width:min(1220px,100% - 40px);margin-left:auto;margin-right:auto}" +
  // nav: 74px tall, floats over the page
  ".sh-nav{position:sticky;top:0;z-index:20;height:74px;margin-bottom:-74px;pointer-events:none}" +
  ".sh-nav-in{width:min(1250px,100% - 30px);margin:0 auto;height:100%;display:flex;align-items:center;pointer-events:auto}" +
  ".sh-go .sh-nav-in{animation:sh-navin " + DUR_FAST + "ms var(--sh-ef) " + HERO.nav + "ms both}" +
  "@keyframes sh-navin{from{opacity:0;transform:translateY(-90px)}to{opacity:1;transform:none}}" +
  ".sh-brand{display:flex}" +
  ".sh-tile{width:var(--s);height:var(--s);border-radius:calc(var(--s) * .2);display:inline-grid;place-items:center;flex:none;background:linear-gradient(180deg,rgba(74,74,74,.86),rgba(42,42,42,.86));" +
  "box-shadow:inset 0 1px 0 rgba(255,255,255,.22),inset 0 0 0 1px rgba(255,255,255,.07),0 6px 16px rgba(0,0,0,.45);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px)}" +
  ".sh-links{margin-left:auto;display:flex;gap:20px;font-size:16px}" +
  ".sh-links a{color:#b6b6b6;transition:color .25s ease}" +
  ".sh-links a.on{color:#cfcfcf}" +
  ".sh-links-cta{display:none}" +
  ".sh-nav-cta{margin-left:30px}" +
  ".sh-burger{display:none;width:36px;height:36px;border-radius:8px;border:1px solid #262626;background:rgba(26,26,26,.8);position:relative}" +
  ".sh-burger i{position:absolute;left:10px;right:10px;height:1.5px;background:#cfcfcf;border-radius:2px;transition:transform " + DUR_FAST + "ms var(--sh-ef)}" +
  ".sh-burger i:first-child{top:14px}.sh-burger i:last-child{top:20px}" +
  ".sh-burger.on i:first-child{transform:translateY(3px) rotate(45deg)}.sh-burger.on i:last-child{transform:translateY(-3px) rotate(-45deg)}" +
  // buttons: 42px, padding 10/30, radius 7
  ".sh-btn{--sh-a:220deg;--sh-p:25%;display:inline-flex;align-items:center;justify-content:center;height:42px;padding:0 30px;border-radius:7px;font-size:16px;line-height:22.4px;white-space:nowrap;" +
  "transition:--sh-a " + DUR_FAST + "ms var(--sh-ef),--sh-p " + DUR_FAST + "ms var(--sh-ef),--sh-sx " + DUR_FAST + "ms var(--sh-ef),--sh-sb " + DUR_FAST + "ms var(--sh-ef)}" +
  ".sh-btn-s{color:#cfcfcf;border:1px solid #202020;background:" + BTN_S + ";box-shadow:inset -2px 2px 7px rgba(255,255,255,.15)}" +
  ".sh-btn-p{--sh-a:196deg;color:#101010;background:linear-gradient(var(--sh-a),#fff 15%,#565656 100%);box-shadow:inset var(--sh-sx) 4px var(--sh-sb) rgba(255,255,255,.5),inset 3px 4px 9px rgba(255,255,255,.1)}" +
  ".sh-root button:focus-visible,.sh-root a:focus-visible{outline:2px solid #8aa2ff;outline-offset:2px}" +
  ".sh-wide{width:100%}" +
  // hero
  ".sh-hero{position:relative;padding:118px 0 50px;overflow:hidden}" +
  ".sh-toplight{position:absolute;left:0;right:0;top:0;height:1066px;background:radial-gradient(43% 43% at 47.1% -1.3%,#202020 0%,#101010 100%);pointer-events:none;z-index:-1}" +
  ".sh-go .sh-toplight{animation:sh-top 1.6s cubic-bezier(.44,0,.56,1) .3s both}" +
  "@keyframes sh-top{from{opacity:0;transform:translateY(-280px) scale(1.3)}to{opacity:1;transform:none}}" +
  ".sh-rays{position:absolute;left:0;right:0;top:0;height:900px;pointer-events:none;opacity:.34}" +
  ".sh-go .sh-rays{animation:sh-rays 4s " + EASE_LIGHT + " both}" +
  "@keyframes sh-rays{from{opacity:0;transform:translate(389px,-600px) rotate(30deg)}to{opacity:.34;transform:none}}" +
  ".sh-ray{position:absolute;filter:blur(26px);transform:rotate(30deg);transform-origin:50% 50%}" +
  ".sh-ray-1{left:calc(54.3% - 36px);top:-142px;width:73px;height:742px;opacity:.45;background:linear-gradient(#fff 10%,rgba(255,255,255,0) 100%)}" +
  ".sh-ray-2{left:calc(70% - 87px);top:-494px;width:174px;height:1447px;opacity:.6;background:linear-gradient(#fff 20%,rgba(255,255,255,0) 85%)}" +
  ".sh-ray-3{left:calc(87.9% - 67px);top:-176px;width:134px;height:808px;opacity:.6;background:linear-gradient(#fff 10%,rgba(255,255,255,0) 100%)}" +
  ".sh-go .sh-ray-1{animation:sh-ray1 1.15s " + EASE_LIGHT + " .45s both}" +
  ".sh-go .sh-ray-2{animation:sh-ray2 1.1s " + EASE_LIGHT + " .7s both}" +
  ".sh-go .sh-ray-3{animation:sh-ray2 1.35s " + EASE_LIGHT + " .43s both}" +
  "@keyframes sh-ray1{from{opacity:0;transform:translate(230px,-380px) rotate(0deg)}to{opacity:.45;transform:rotate(30deg)}}" +
  "@keyframes sh-ray2{from{opacity:0;transform:translate(230px,-380px) rotate(0deg)}to{opacity:.6;transform:rotate(30deg)}}" +
  ".sh-hero-in{position:relative}" +
  ".sh-go .sh-hero-in{animation:sh-drift 3s " + EASE_LIGHT + " both}" +
  "@keyframes sh-drift{from{transform:translateY(60px)}to{transform:none}}" +
  ".sh-hero-row{display:flex;align-items:flex-end;justify-content:space-between;gap:24px}" +
  ".sh-hero-copy{width:600px;max-width:100%}" +
  ".sh-h1{" + DISPLAY + "font-weight:700;font-size:55px;line-height:60.5px;letter-spacing:-.04em;color:#cfcfcf}" +
  ".sh-lead{margin-top:10px;max-width:350px;line-height:22.4px}" +
  ".sh-hero-btns{display:flex;gap:10px;flex:none;margin-bottom:1px}" +
  ".sh-hero-board{margin-top:25px}" +
  // words + reveals
  ".sh-wd .sh-w{display:inline-block;opacity:0;filter:blur(22px);transform:translateY(40px) rotateX(70deg);will-change:transform;" +
  "transition:opacity " + DUR_WORD + "ms var(--sh-ew),filter " + DUR_WORD + "ms var(--sh-ew),transform " + DUR_WORD + "ms var(--sh-ew);transition-delay:var(--rd,0ms)}" +
  ".sh-in .sh-w{opacity:1;filter:blur(0px);transform:none}" +
  ".sh-rv{opacity:0;transform:translate3d(var(--rx,0px),var(--ry,30px),0);transition:opacity " + DUR_ITEM + "ms var(--sh-ei),transform " + DUR_ITEM + "ms var(--sh-ei);transition-delay:var(--rd,0ms)}" +
  ".sh-root span.sh-rv{display:inline-block}" +
  ".sh-in .sh-rv,.sh-in.sh-rv{opacity:1;transform:none}" +
  ".sh-tilt{opacity:0;transform:perspective(1500px) translateY(140px) scale(.9) rotateX(-30deg);transition:opacity " + DUR_TILT + "ms var(--sh-et),transform " + DUR_TILT + "ms var(--sh-et);transition-delay:var(--rd,0ms)}" +
  ".sh-in .sh-tilt{opacity:1;transform:perspective(1500px) translateY(0px) scale(1) rotateX(0deg)}" +
  // board: drawn at 1260 x 697, scaled by --k
  ".sh-bwrap{--k:1;position:relative;width:100%;aspect-ratio:" + BOARD_W + "/" + BOARD_H + ";overflow:hidden;border-radius:calc(24px * var(--k))}" +
  ".sh-board{position:absolute;left:0;top:0;width:" + BOARD_W + "px;height:" + BOARD_H + "px;transform:scale(var(--k));transform-origin:0 0;border-radius:24px;overflow:hidden;color:#fff;font-size:13px;line-height:1.2;letter-spacing:0;" +
  "background:radial-gradient(#242424 1px,transparent 1.3px) 0 0/27px 27px,linear-gradient(160deg,#1c1c1c 0%,#131313 34%,#121212 100%);box-shadow:inset 0 0 0 1px rgba(255,255,255,.09),inset 2px 2px 1px rgba(255,255,255,.09)}" +
  ".sh-ws{position:absolute;left:32px;top:31px;height:48px;padding:0 14px 0 10px;display:flex;align-items:center;gap:9px;border-radius:12px;background:#1d1d1d;font-weight:500;color:#e6e6e6}" +
  ".sh-ws svg:last-child{margin-left:14px;color:#666}" +
  ".sh-ws-mark{width:28px;height:28px;border-radius:8px;display:grid;place-items:center;background:#060606}" +
  ".sh-btabs{position:absolute;left:447px;top:31px;height:48px;padding:6px;display:flex;align-items:center;gap:2px;border-radius:12px;background:#1c1c1c;font-weight:600}" +
  ".sh-btabs span{height:36px;padding:0 16px;display:flex;align-items:center;border-radius:8px}" +
  ".sh-btabs span.on{background:#141414;box-shadow:inset 0 0 0 1px #262626}" +
  ".sh-gear{position:absolute;right:31px;top:31px;width:48px;height:48px;border-radius:12px;display:grid;place-items:center;background:#1d1d1d;color:#fff}" +
  ".sh-newtask{position:absolute;right:91px;top:35px;height:40px;width:210px;border-radius:8px;background:#fff;color:#111;display:grid;place-items:center;font-weight:600;font-size:13px}" +
  ".sh-cols{position:absolute;left:32px;top:111px;display:grid;grid-template-columns:repeat(4,275px);gap:33px;align-items:start}" +
  ".sh-col{position:relative;border-radius:8px;box-shadow:inset 0 0 0 1px #272727;padding:40px 8px 8px;display:flex;flex-direction:column;gap:15px;overflow:hidden;transition:filter .5s ease,opacity .5s ease}" +
  ".sh-col-0::after{content:'';position:absolute;left:0;right:0;bottom:0;height:60%;background:linear-gradient(0deg,rgba(40,150,66,.62),rgba(40,150,66,.2) 60%,rgba(40,150,66,0));pointer-events:none}" +
  ".sh-col-1{background:linear-gradient(200deg,#1f1f1f 30%,#2b2114 78%,#8a6a3a 130%);box-shadow:inset 0 0 0 1px #2e2e2e,0 3px 0 -1px #6f6247,0 30px 50px rgba(0,0,0,.5)}" +
  ".sh-col-2::after{content:'';position:absolute;left:0;right:0;bottom:0;height:34%;background:linear-gradient(0deg,rgba(60,90,200,.28),rgba(60,90,200,0));pointer-events:none}" +
  ".sh-col-h{position:absolute;left:8px;right:8px;top:11px;display:flex;justify-content:space-between;align-items:center;padding-left:9px;font-weight:600;color:#e9e9e9}" +
  ".sh-col-h::before{content:'';position:absolute;left:0;top:1px;bottom:1px;width:2px;border-radius:2px;background:var(--c)}" +
  ".sh-col-2 .sh-col-h,.sh-col-3 .sh-col-h{color:#a9a9a9}" +
  ".sh-dots{color:#9a9a9a;font-size:15px;line-height:1;padding-right:30px}" +
  ".sh-task{position:relative;z-index:1;height:100px;border-radius:4px;background:linear-gradient(180deg,#262626,#1b1b1b);box-shadow:inset 0 0 0 1px #2c2c2c;padding:11px 8px 0}" +
  ".sh-task-ghost{opacity:.22}" +
  ".sh-task-top{display:flex;justify-content:space-between;align-items:center;color:#8d8d8d;font-size:11px;height:16px}" +
  ".sh-task-top span:first-child{display:flex;gap:8px;align-items:center}" +
  ".sh-task-top svg{color:#9b9b9b}" +
  ".sh-task-t{margin-top:11px;font-weight:500;color:#c6c6c6;font-size:15px;line-height:20px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}" +
  ".sh-task-bot{margin-top:8px;display:flex;justify-content:space-between;align-items:center;height:22px}" +
  ".sh-chip{display:inline-block;font-size:11px;line-height:14px;font-weight:500;padding:2px 7px;border-radius:4px;color:var(--c);background:color-mix(in srgb,var(--c) 13%,#161616)}" +
  ".sh-avs{display:flex}.sh-avs .sh-av+.sh-av{margin-left:-7px}" +
  ".sh-av{width:var(--s);height:var(--s);border-radius:50%;display:inline-grid;place-items:center;font-size:calc(var(--s) * .4);font-weight:600;color:#fff;letter-spacing:0;line-height:1;box-shadow:0 0 0 1.5px #d9d9d9;background:radial-gradient(circle at 32% 28%,color-mix(in srgb,var(--c) 60%,#fff),var(--c) 70%)}" +
  ".sh-drop{position:relative;z-index:1;height:100px;border-radius:4px;border:1px dashed rgba(255,255,255,.3);border-bottom-color:rgba(255,255,255,.1)}" +
  ".sh-add{position:relative;z-index:1;height:30px;border-radius:4px;box-shadow:inset 0 0 0 1px #262626;display:grid;place-items:center;color:#5c5c5c;font-size:14px}" +
  ".sh-drag{position:absolute;left:146px;top:296px;width:318px;height:112px;z-index:3;transform:rotate(9deg);border-radius:12px;padding:16px 16px 0;background:rgba(38,38,38,.82);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);" +
  "box-shadow:inset 0 0 0 1px rgba(255,255,255,.1),0 24px 40px rgba(0,0,0,.55)}" +
  ".sh-drag .sh-task-top{font-size:14px;color:#bdbdbd;height:20px}" +
  ".sh-drag .sh-task-t{font-size:18px;line-height:24px;margin-top:10px;color:#f1f1f1}" +
  ".sh-drag .sh-chip{font-size:13px;line-height:16px;margin-top:6px;padding:3px 8px}" +
  ".sh-live{animation:sh-bob 6s ease-in-out infinite}" +
  "@keyframes sh-bob{0%,100%{transform:rotate(9deg) translate(0,0)}50%{transform:rotate(8deg) translate(5px,-4px)}}" +
  ".sh-pt{position:absolute;z-index:4;display:block}" +
  ".sh-pt-k{left:294px;top:443px}.sh-pt-c2{left:569px;top:258px}.sh-pt-c1{left:827px;top:375px}" +
  ".sh-cur{position:relative;display:block;width:var(--s);height:var(--s);color:var(--c)}" +
  ".sh-cur b{position:absolute;inset:0;border-radius:50%;display:grid;place-items:center;background:var(--c);color:#fff;font-weight:600;font-size:calc(var(--s) * .36);letter-spacing:0;box-shadow:inset 0 0 0 2px rgba(255,255,255,.22),0 6px 14px rgba(0,0,0,.4)}" +
  ".sh-cur svg{position:absolute;filter:drop-shadow(0 3px 5px rgba(0,0,0,.45))}" +
  ".sh-cur svg{width:30px;height:30px}.sh-cur-tl svg{left:-22px;top:-24px}" +
  ".sh-cur-tr svg{right:-14px;top:-26px;transform:scaleX(-1)}" +
  ".sh-cur-bl svg{left:-22px;bottom:-16px;transform:scaleY(-1) rotate(8deg)}" +
  ".sh-bwrap-long{aspect-ratio:1260/1010}.sh-bwrap-long .sh-board{height:1010px}" +
  ".sh-board-client .sh-col-0,.sh-board-client .sh-col-1,.sh-board-client .sh-ws{filter:blur(7px);opacity:.42}" +
  // bands
  ".sh-band{background:#0d0d0d}" +
  ".sh-band-fade{background:linear-gradient(#0d0d0d 0%,#101010 50%)}" +
  ".sh-h2{" + DISPLAY + "font-weight:700;font-size:42px;line-height:46.2px;letter-spacing:-.04em;color:#cfcfcf}" +
  ".sh-sub{line-height:22.4px}" +
  ".sh-center{text-align:center;display:flex;flex-direction:column;align-items:center}" +
  // features: band 676px tall
  ".sh-feat{padding:50px 0 47px}" +
  ".sh-feat-head{display:flex;justify-content:space-between;align-items:flex-end;gap:24px}" +
  ".sh-h2-left{max-width:530px}" +
  ".sh-sub-left{margin-top:11px;max-width:490px}" +
  ".sh-arrows{display:flex;margin:0 -20px -6px 0}" +
  ".sh-arrows button{width:80px;height:80px;display:grid;place-items:center}" +
  ".sh-arrows button svg{border-radius:50%;background:#0d0d0d;box-shadow:inset 0 0 0 1.5px #3a3a3a;color:#fff;transition:transform " + DUR_FAST + "ms var(--sh-ef),box-shadow .25s ease}" +
  ".sh-arrows button:active svg{transform:scale(.92)}" +
  ".sh-car{margin-top:50px;overflow:hidden;padding:10px;touch-action:pan-y}" +
  ".sh-car-rv{container-type:inline-size}" +
  ".sh-track{--i:0;display:flex;gap:30px;transform:translateX(calc(var(--i) * -310px));transition:transform " + DUR_SLIDE + "ms var(--sh-es)}" +
  ".sh-snap{transition:none}" +
  ".sh-fcard{flex:0 0 280px;width:280px}" +
  ".sh-fimg{height:280px;border-radius:12px;box-shadow:inset 0 0 0 1px #202020;background:radial-gradient(80% 70% at 50% 45%,#161616,#0f0f0f);overflow:hidden;position:relative}" +
  ".sh-fcard h3{margin-top:10px;" + DISPLAY + "font-weight:600;font-size:18px;line-height:25.2px;letter-spacing:-.04em;color:#cfcfcf}" +
  ".sh-fcard p{margin-top:4px;line-height:22.4px;max-width:250px}" +
  // card art: flat glass panels under one skew
  ".sh-art{position:absolute;inset:0;font-size:9px;line-height:1.2;letter-spacing:0;color:#d8d8d8}" +
  ".sh-skew{position:absolute;inset:0;transform:skewY(-17deg)}" +
  ".sh-g1{position:absolute;border-radius:10px;background:linear-gradient(180deg,rgba(255,255,255,.07),rgba(255,255,255,.025));box-shadow:inset 0 0 0 1px rgba(255,255,255,.06)}" +
  ".sh-gcol{display:flex;flex-direction:column;gap:7px;padding:9px}" +
  ".sh-art-invite .sh-ga{left:56px;top:92px;width:210px;height:150px}" +
  ".sh-art-invite .sh-gb{left:30px;top:112px;width:214px;height:150px;padding:14px 12px;background:linear-gradient(180deg,rgba(40,40,40,.9),rgba(26,26,26,.9))}" +
  ".sh-pin{position:relative;display:flex;align-items:center;gap:10px;height:42px;padding:0 6px 0 14px;border-radius:9px;background:#141414;box-shadow:inset 0 0 0 1px #2c2c2c,-10px 0 26px -4px color-mix(in srgb,var(--c) 45%,transparent)}" +
  ".sh-pin b{white-space:nowrap;font-size:12px;letter-spacing:.24em;font-weight:500;color:#e6e6e6}" +
  ".sh-pin span{white-space:nowrap;margin-left:auto;height:30px;padding:0 9px;border-radius:7px;background:#232323;display:flex;align-items:center;font-size:9.5px;color:#eee}" +
  ".sh-dot{width:7px;height:7px;border-radius:50%;background:var(--c);box-shadow:0 0 8px 2px var(--c)}" +
  ".sh-url{margin-top:22px;height:28px;border-radius:7px;background:rgba(255,255,255,.04);display:flex;align-items:center;padding:0 10px;color:#5b5b5b;font-size:9.5px}" +
  ".sh-art-safe .sh-ga{left:86px;top:82px;width:180px;height:260px}" +
  ".sh-art-safe .sh-gb{left:62px;top:104px;width:180px;height:270px;background:linear-gradient(180deg,rgba(38,38,38,.92),rgba(24,24,24,.92))}" +
  ".sh-gh{display:flex;align-items:center;gap:6px;font-weight:600;font-size:8.5px;color:#eee;height:14px}" +
  ".sh-gh i{width:3px;height:10px;border-radius:2px;background:var(--c)}" +
  ".sh-gh em{margin-left:auto;color:#888}" +
  ".sh-gcard{position:relative;height:62px;border-radius:7px;padding:8px;background:#1b1b1b;box-shadow:inset 0 0 0 1px #2c2c2c;display:flex;flex-direction:column;gap:5px}" +
  ".sh-gcard>span:first-child{display:flex;align-items:center;gap:4px;font-size:7px;color:#8d8d8d}" +
  ".sh-gcard em{margin-left:auto}" +
  ".sh-gcard b{font-size:9.5px;font-weight:500;color:#f0f0f0}" +
  ".sh-gcard u{align-self:flex-start;font-size:7px;padding:1px 5px;border-radius:3px;color:var(--c);background:color-mix(in srgb,var(--c) 18%,transparent)}" +
  ".sh-gcard .sh-avs{position:absolute;right:8px;bottom:22px}" +
  ".sh-gcard.on{margin-left:-14px;margin-right:-10px;background:linear-gradient(100deg,color-mix(in srgb,var(--c) 34%,#1a1a1a),#1d1d1d 46%);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--c) 40%,#2c2c2c),-14px 6px 30px -6px color-mix(in srgb,var(--c) 55%,transparent)}" +
  ".sh-gcard.dim{opacity:.38}" +
  ".sh-art-jump .sh-ga{left:64px;top:80px;width:200px;height:180px}" +
  ".sh-art-jump .sh-gb{left:42px;top:98px;width:200px;height:190px;background:linear-gradient(180deg,rgba(36,36,36,.92),rgba(24,24,24,.92));padding:10px 0 0;gap:0}" +
  ".sh-gli{height:38px;display:flex;align-items:center;padding:0 12px;color:#9b9b9b;font-size:9.5px;border-bottom:1px solid rgba(255,255,255,.05)}" +
  ".sh-gli.on{margin:6px -10px 0 -4px;height:40px;border-radius:8px;border:1px solid color-mix(in srgb,var(--c) 70%,transparent);color:#fff;font-weight:500;background:linear-gradient(90deg,color-mix(in srgb,var(--c) 30%,#141414),#161616 60%);box-shadow:-16px 0 34px -6px color-mix(in srgb,var(--c) 60%,transparent)}" +
  ".sh-art-kit .sh-ga{left:28px;top:118px;width:96px;height:230px;opacity:.6}" +
  ".sh-art-kit .sh-gb{left:132px;top:86px;width:140px;height:270px}" +
  ".sh-art-kit .sh-gcard.on{margin-left:-58px;margin-right:-6px;height:66px;background:linear-gradient(100deg,#1a1a1a 30%,color-mix(in srgb,var(--c) 26%,#1a1a1a));box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--c) 70%,#2c2c2c),0 10px 34px -4px color-mix(in srgb,var(--c) 45%,transparent)}" +
  // two views
  ".sh-views{position:relative;padding:71px 0 66px;overflow:hidden}" +
  ".sh-glow{position:absolute;left:50%;top:42px;width:1064px;height:719px;margin-left:-496px;background:radial-gradient(46% 50% at 72% 38%,rgba(96,128,106,.36),rgba(64,119,71,.1) 55%,rgba(16,16,16,0) 78%);pointer-events:none}" +
  ".sh-rv.sh-glow{transform:translate3d(var(--rx),var(--ry),0) scale(1.2)}" +
  ".sh-in.sh-rv.sh-glow{transform:none}" +
  ".sh-views-stage{position:relative;margin-top:30px}" +
  ".sh-device{position:relative;width:min(1067px,100% - 40px);margin:0 auto;display:flex;flex-direction:column;align-items:center}" +
  ".sh-seg{position:relative;z-index:2;display:flex;gap:10px;padding:6px 6px 0;border-radius:8px 8px 0 0;background:#101010;margin-bottom:-1px}" +
  ".sh-seg button{--sh-a:220deg;--sh-p:25%;height:42px;padding:0 30px;border-radius:7px 7px 0 0;font-size:16px;color:#cfcfcf;border:1px solid transparent;transition:border-color .3s ease,box-shadow .3s ease,background-color .3s ease}" +
  ".sh-seg button.on{border-color:#202020;background:" + BTN_S + ";box-shadow:inset -2px 2px 7px rgba(255,255,255,.15)}" +
  ".sh-screens{position:relative;width:88%;aspect-ratio:939/700;transform:perspective(1500px) rotateX(15deg);transform-origin:50% 0;border-radius:20px;padding:8px;background:linear-gradient(223deg,rgba(207,207,207,.1) 12%,rgba(16,16,16,0) 44%);" +
  "-webkit-mask-image:linear-gradient(#000 30%,rgba(0,0,0,.55) 62%,transparent 96%);mask-image:linear-gradient(#000 30%,rgba(0,0,0,.55) 62%,transparent 96%)}" +
  ".sh-scr{position:absolute;left:8px;right:8px;top:8px;transition:opacity .9s cubic-bezier(.2,.7,.3,1);opacity:0}" +
  ".sh-scr.on{opacity:1;transition:opacity .32s var(--sh-ef)}" +
  // trust: band 855px tall
  ".sh-trust{padding:80px 0}" +
  ".sh-trust-h{margin-top:24px}" +
  ".sh-sub-c{margin-top:13px;max-width:430px}" +
  ".sh-tcards{display:grid;grid-template-columns:repeat(3,1fr);gap:25px;margin-top:29px}" +
  ".sh-tcard{--c:64,119,71;--e:74%;height:448px;border-radius:12px;padding:15px;display:flex;flex-direction:column;background:linear-gradient(219deg,rgba(var(--c),0) 46%,rgb(var(--c)) var(--e),#ababab 100%),#141414;box-shadow:inset 0 0 0 1px rgba(255,255,255,.035)}" +
  ".sh-tcard h3{" + DISPLAY + "font-weight:600;font-size:18px;line-height:25.2px;letter-spacing:-.04em;color:#cfcfcf}" +
  ".sh-tcard>p{line-height:22.4px;margin-top:1px}" +
  ".sh-tvis{position:relative;margin-top:15px;flex:1;border-radius:8px;box-shadow:inset 0 0 0 1px #242424;background:linear-gradient(219deg,#131313 40%,rgba(19,19,19,.82) 100%);padding:30px 14px 12px;display:flex;flex-direction:column;overflow:hidden}" +
  ".sh-tvis-bare{padding:0;overflow:visible;background:none;box-shadow:none}" +
  ".sh-think{display:flex;gap:10px;align-items:center;font-size:14px;color:#6a6a6a;margin-left:4px;margin-bottom:6px}" +
  ".sh-sk{display:block;height:20px;margin-top:14px;border-radius:10px;background:linear-gradient(90deg,#2a2a2a,#383838 50%,#2a2a2a);background-size:200% 100%;animation:sh-shim 2.4s linear infinite;max-width:100%}" +
  "@keyframes sh-shim{from{background-position:100% 0}to{background-position:-100% 0}}" +
  ".sh-compose{margin-top:auto;display:flex;justify-content:space-between;align-items:center;height:52px;padding:0 8px 0 8px;border-radius:8px;background:rgba(30,30,30,.86);font-size:14px;color:#f1f1f1;letter-spacing:0}" +
  ".sh-caret{display:inline-block;width:1.5px;height:16px;margin-left:2px;vertical-align:-3px;background:#eee;animation:sh-blink 1.1s steps(1) infinite}" +
  "@keyframes sh-blink{50%{opacity:0}}" +
  ".sh-send{width:26px;height:26px;border-radius:50%;display:grid;place-items:center;background:#bdbdbd;color:#1a1a1a;flex:none}" +
  ".sh-tp1{right:52px;bottom:66px}" +
  ".sh-signin{position:relative;display:flex;flex-direction:column;gap:12px;padding:10px 10px 12px;border-radius:8px;background:#151515;box-shadow:inset 0 0 0 1px #242424;font-size:14px;letter-spacing:0}" +
  ".sh-signin-h{display:flex;align-items:center;gap:14px;height:88px;padding-bottom:20px;color:#bdbdbd;font-size:15px}" +
  ".sh-opt{height:56px;border-radius:8px;display:grid;place-items:center;background:#1b1b1b;color:#8a8a8a}" +
  ".sh-opt.on{background:linear-gradient(196deg,#fff 15%,#8f8f8f 100%);color:#111;font-weight:500;box-shadow:inset -5px 4px 10px rgba(255,255,255,.5)}" +
  ".sh-tp2{right:26px;top:300px}" +
  ".sh-orbit{display:grid;place-items:center;padding:0;background:linear-gradient(219deg,#141414 30%,rgba(22,26,40,.85) 100%)}" +
  ".sh-ring{position:absolute;left:50%;top:50%;border-radius:50%;box-shadow:inset 0 0 0 1px rgba(255,255,255,.13)}" +
  ".sh-ring-1{width:262px;height:262px;margin:-131px 0 0 -131px;animation:sh-spin 14s linear infinite}" +
  ".sh-ring-2{width:420px;height:420px;margin:-210px 0 0 -210px}" +
  ".sh-ring-1::after{content:'';position:absolute;left:50%;top:-3px;width:6px;height:6px;margin-left:-3px;border-radius:50%;background:#7fa2ff;box-shadow:0 0 12px 2px #5284f2}" +
  "@keyframes sh-spin{to{transform:rotate(360deg)}}" +
  ".sh-db{position:relative;width:124px;height:124px;border-radius:22px;display:grid;place-items:center;background:linear-gradient(180deg,#4a4a4d,#2c2c2e);box-shadow:inset 0 1px 0 rgba(255,255,255,.28),inset 0 0 0 1px rgba(255,255,255,.08),0 18px 40px rgba(0,0,0,.6)}" +
  // faq
  ".sh-faq{padding:51px 0}" +
  ".sh-sub-12{margin-top:12px}" +
  ".sh-qs{margin-top:30px;display:flex;flex-direction:column;gap:10px}" +
  ".sh-q{border-radius:8px;background:#1a1a1a;box-shadow:inset 0 0 0 1px #202020}" +
  ".sh-q-btn{width:100%;height:66px;padding:0 20px;display:flex;align-items:center;justify-content:space-between;gap:16px;text-align:left;" + DISPLAY + "font-weight:600;font-size:18px;letter-spacing:-.04em;color:#b6b6b6}" +
  ".sh-q-last{height:82px;padding:0 20px;display:flex;align-items:center;justify-content:space-between;gap:16px;" + DISPLAY + "font-weight:600;font-size:18px;letter-spacing:-.04em;color:#b6b6b6}" +
  ".sh-q-last .sh-btn{font-family:ShSans,Inter,ui-sans-serif,system-ui,sans-serif;font-weight:400;letter-spacing:-.02em}" +
  ".sh-plus{position:relative;width:26px;height:26px;border-radius:50%;background:linear-gradient(211deg,#fff 0%,#565656 110%);flex:none;transition:transform " + DUR_FAST + "ms var(--sh-ef)}" +
  ".sh-plus::before,.sh-plus::after{content:'';position:absolute;left:50%;top:50%;width:12px;height:1.6px;margin:-.8px 0 0 -6px;background:#161616;border-radius:1px}" +
  ".sh-plus::after{transform:rotate(90deg)}" +
  ".sh-q.open .sh-plus{transform:rotate(45deg)}" +
  ".sh-q-a{display:grid;grid-template-rows:0fr;margin-top:0;transition:grid-template-rows " + DUR_FAST + "ms var(--sh-ef),margin-top " + DUR_FAST + "ms var(--sh-ef)}" +
  ".sh-q-a>div{overflow:hidden;min-height:0}" +
  ".sh-q-a p{padding:0 66px 20px 20px;margin:0;line-height:22.4px;opacity:0;transition:opacity .22s ease}" +
  ".sh-q.open .sh-q-a{grid-template-rows:1fr;margin-top:-15px}" +
  ".sh-q.open .sh-q-a p{opacity:1;transition-delay:.05s}" +
  // pricing: band 928px tall
  ".sh-pricing{padding:50px 0}" +
  ".sh-plans{margin-top:80px;display:grid;grid-template-columns:repeat(3,1fr);gap:30px;align-items:start}" +
  ".sh-plan-w{position:relative}" +
  ".sh-plan{position:relative;border-radius:9px;background:#1a1a1a;padding:18px 18px 40px;display:flex;flex-direction:column}" +
  ".sh-plan h3{" + DISPLAY + "font-weight:600;font-size:18px;line-height:25.2px;letter-spacing:-.04em;color:#cfcfcf}" +
  ".sh-blurb{margin-top:5px;font-size:13px;line-height:18.2px}" +
  ".sh-price{display:flex;align-items:baseline;gap:8px;margin:18px 0 38px}" +
  ".sh-price b{" + DISPLAY + "font-weight:700;font-size:42px;line-height:46.2px;letter-spacing:-.04em;color:#cfcfcf}" +
  ".sh-price span{line-height:22.4px}" +
  ".sh-list-h{margin-top:38px;padding-bottom:9px;font-size:13px;line-height:18.2px;text-transform:uppercase;border-bottom:1px solid #222}" +
  ".sh-list{margin-top:18px;display:flex;flex-direction:column;gap:12px;color:#cfcfcf}" +
  ".sh-list+.sh-list-h{margin-top:28px}" +
  ".sh-list span{display:flex;align-items:center;gap:12px;line-height:22.4px}" +
  ".sh-plan-rec .sh-plan{background:radial-gradient(108% 50% at 86.8% 6.3%,#202020 0%,#1a1a1a 100%)}" +
  ".sh-rec{position:absolute;left:0;right:0;top:-38px;height:76px;border-radius:7px;background:#1a1a1a;box-shadow:inset 0 0 0 1px #161616;display:flex;align-items:flex-start;justify-content:center;gap:9px;padding-top:10px;font-size:13px;line-height:18.2px;color:#cfcfcf}" +
  ".sh-rec::before{content:'';width:6px;height:6px;margin-top:6px;border-radius:50%;background:#5b8cff;box-shadow:0 0 8px #5b8cff}" +
  // cta
  ".sh-cta{padding:50px 0 0}" +
  ".sh-eyebrow{line-height:22.4px}" +
  ".sh-h2-narrow{max-width:470px}" +
  ".sh-ctacard{position:relative;margin-top:31px;height:475px;border-radius:12px;overflow:hidden;background:linear-gradient(#101010 -31%,#101010 55%,#101110 78%,#407747 111%);box-shadow:inset 0 0 0 1px rgba(255,255,255,.03)}" +
  ".sh-cta-copy{position:absolute;left:50px;top:94px;width:440px;display:flex;flex-direction:column;align-items:flex-start;z-index:2}" +
  ".sh-cta-copy .sh-h2{margin-top:30px}" +
  ".sh-cta-copy .sh-sub{margin-top:8px;max-width:350px}" +
  ".sh-cta-copy>span:last-child{margin-top:30px}" +
  ".sh-cta-board{position:absolute;left:550px;top:75px;width:1112px;z-index:1}" +
  ".sh-cta-light{position:absolute;left:575px;top:-260px;width:150px;height:900px;background:linear-gradient(#fff 15%,rgba(255,255,255,0) 90%);filter:blur(30px);opacity:.2;transform:rotate(-62deg);transform-origin:50% 0;pointer-events:none;z-index:3}" +
  // footer
  ".sh-foot{padding:150px 0 100px}" +
  ".sh-foot-top{display:flex;justify-content:space-between;align-items:flex-start;gap:32px;padding-bottom:50px;border-bottom:1px solid #2e2e2e}" +
  ".sh-foot-brand{display:flex;flex-direction:column;gap:10px}" +
  ".sh-foot-brand p{" + DISPLAY + "font-weight:700;font-size:30px;line-height:42px;letter-spacing:-.04em;color:#cfcfcf}" +
  ".sh-foot-cols{display:flex;gap:44px}" +
  ".sh-foot-cols div{display:flex;flex-direction:column;gap:7.4px;line-height:20px;min-width:69px}" +
  ".sh-foot-cols b{" + DISPLAY + "font-weight:600;line-height:22.4px;color:#cfcfcf;margin-bottom:3.6px}" +
  ".sh-foot-cols a{color:#b6b6b6;transition:color .25s ease}" +
  ".sh-foot-cols a.on{color:#cfcfcf}" +
  ".sh-foot-bot{display:flex;justify-content:space-between;padding-top:50px;" + DISPLAY + "font-weight:600;line-height:22.4px;text-transform:uppercase;color:#cfcfcf}" +
  ".sh-foot-bot a{text-decoration:underline;text-underline-offset:4px;text-decoration-thickness:1px}" +
  // hover, fine pointers only
  "@media (hover:hover) and (pointer:fine){" +
  ".sh-links a:hover,.sh-foot-cols a:hover{color:#cfcfcf}" +
  ".sh-btn-s:hover{--sh-a:327deg;--sh-p:-14%}" +
  ".sh-btn-p:hover{--sh-a:257deg;--sh-sx:8px;--sh-sb:30px}" +
  ".sh-arrows button:hover svg{box-shadow:inset 0 0 0 1.5px #6a6a6a}" +
  ".sh-seg button:not(.on):hover{border-color:#202020}" +
  "}" +
  // tablet
  "@media (max-width:1199px){" +
  ".sh-cta-board{left:52%}" +
  ".sh-tcards{gap:16px}.sh-plans{gap:16px}" +
  ".sh-hero-copy{width:520px}" +
  "}" +
  // phone: 20px gutters, 32 / 24 / 15 type
  "@media (max-width:809px){" +
  ".sh-root{font-size:15px}" +
  ".sh-nav{height:56px;margin-bottom:-56px}" +
  ".sh-nav-in{width:calc(100% - 40px)}" +
  ".sh-nav .sh-tile{--s:36px!important}" +
  ".sh-nav .sh-tile svg{width:18px;height:18px}" +
  ".sh-links{position:absolute;left:12px;right:12px;top:54px;flex-direction:column;gap:0;padding:8px;border-radius:12px;background:rgba(22,22,22,.96);border:1px solid #262626;backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);" +
  "opacity:0;visibility:hidden;transform:translateY(-8px) scale(.98);transform-origin:50% 0;transition:opacity .2s ease,transform " + DUR_FAST + "ms var(--sh-ef),visibility 0s .2s}" +
  ".sh-links-open{opacity:1;visibility:visible;transform:none;transition:opacity .2s ease,transform " + DUR_FAST + "ms var(--sh-ef),visibility 0s}" +
  ".sh-links a{padding:12px;border-radius:8px;font-size:17px}" +
  ".sh-links a.sh-links-cta{display:block;margin-top:6px;text-align:center;background:linear-gradient(196deg,#fff 15%,#7a7a7a 100%);color:#111}" +
  ".sh-nav-cta{display:none}" +
  ".sh-burger{display:block;margin-left:auto}" +
  ".sh-hero{padding:66px 0 40px}" +
  ".sh-hero-row{flex-direction:column;align-items:stretch;gap:10px}" +
  ".sh-hero-copy{width:auto}" +
  ".sh-h1{font-size:32px;line-height:35.2px}" +
  ".sh-lead{max-width:350px;line-height:21px}" +
  ".sh-hero-btns{display:grid;grid-template-columns:1fr 1fr;gap:10px}" +
  ".sh-hero-btns .sh-btn{width:100%;font-size:15px}" +
  ".sh-hero-board{margin-top:24px}" +
  ".sh-bfix{width:805px}" +
  ".sh-h2{font-size:24px;line-height:26.4px}" +
  ".sh-sub,.sh-fcard p,.sh-tcard>p,.sh-eyebrow{line-height:21px}" +
  ".sh-feat{padding:30px 0 40px}" +
  ".sh-feat-head{flex-direction:column;align-items:stretch;gap:10px}" +
  ".sh-arrows{justify-content:space-between;margin:0 -4px}" +
  ".sh-arrows button{width:48px;height:60px}" +
  ".sh-arrows button svg{width:33px;height:33px}" +
  ".sh-car{margin-top:0;padding:10px 0}" +
  ".sh-track{transform:translateX(calc(var(--i) * -1 * (100cqw + 30px)))}" +
  ".sh-fcard{flex-basis:100cqw;width:100cqw}" +
  ".sh-fimg{height:auto;aspect-ratio:1}" +
  ".sh-art{zoom:1.25}" +
  ".sh-views{padding:50px 0 20px}" +
  ".sh-glow{width:150%;margin-left:-60%}" +
  ".sh-seg button{padding:0 24px;font-size:15px}" +
  ".sh-screens{padding:5px;border-radius:12px;transform:perspective(900px) rotateX(12deg)}" +
  ".sh-scr{left:5px;right:5px;top:5px}" +
  ".sh-trust{padding:50px 0}" +
  ".sh-tile[style*='90px']{--s:54px!important}" +
  ".sh-tcards,.sh-plans{grid-template-columns:1fr}" +
  ".sh-tcards{gap:20px}" +
  ".sh-tcard{height:auto}" +
  ".sh-tvis{flex:none;height:316px}" +
  ".sh-tvis-bare{height:auto}" +
  ".sh-faq{padding:40px 0}" +
  ".sh-q-last{white-space:nowrap;gap:8px}.sh-q-last .sh-btn{padding:0 22px;font-size:15px}" +
  ".sh-q-a p{padding-right:20px}" +
  ".sh-pricing{padding:40px 0}" +
  ".sh-plans{gap:58px;margin-top:40px}" +
  ".sh-plans .sh-plan-w:nth-child(2){margin-top:10px}" +
  ".sh-price b{font-size:24px;line-height:26.4px}" +
  ".sh-price{margin:14px 0 30px}" +
  ".sh-ctacard{height:auto;padding:40px 20px 0}" +
  ".sh-cta-copy{position:relative;left:auto;top:auto;width:auto}" +
  ".sh-cta-board{position:relative;left:auto;top:auto;width:1056px;margin-top:40px}" +
  ".sh-cta-light{left:60%}" +
  ".sh-foot{padding:80px 0 60px}" +
  ".sh-foot-top{flex-direction:column;gap:30px}" +
  ".sh-foot .sh-tile{--s:80px}" +
  ".sh-foot-brand p{font-size:21px;line-height:29.4px;max-width:240px}" +
  ".sh-foot-cols{flex-direction:column;gap:36px}" +
  ".sh-foot-bot{flex-direction:column;gap:10px}" +
  "}" +
  // reduced motion: everything lands at rest, loops stop
  "@media (prefers-reduced-motion:reduce){" +
  ".sh-root .sh-w,.sh-root .sh-rv,.sh-root .sh-tilt{opacity:1;filter:none;transform:none;transition:none}" +
  ".sh-go .sh-nav-in,.sh-go .sh-toplight,.sh-go .sh-rays,.sh-go .sh-ray-1,.sh-go .sh-ray-2,.sh-go .sh-ray-3,.sh-go .sh-hero-in{animation:none}" +
  ".sh-live,.sh-sk,.sh-caret,.sh-ring-1{animation:none}" +
  ".sh-track,.sh-q-a,.sh-q-a p,.sh-plus,.sh-scr,.sh-scr.on,.sh-btn,.sh-seg button,.sh-links,.sh-burger i,.sh-col{transition:none}" +
  "}"
