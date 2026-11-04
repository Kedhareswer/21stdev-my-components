"use client"
import { useEffect, useRef, useState } from "react"

/**
 * AI Workspace Shell — a full-page AI assistant layout on warm black with a
 * coral bloom. A thread sidebar with a sliding active marker; a slowly
 * turning emblem and a greeting that rises in word by word; suggestion chips;
 * and a composer with rotating hints, a Tools menu that pins a mode chip, a
 * model picker that springs open from its button, and a send button that
 * lights up once there's text. Sending moves the greeting away, shows the
 * message, a shimmering "thinking" line, then streams a reply. Menus close on
 * outside press and Escape and move with the arrow keys. Nothing reads layout.
 */

export type WorkspaceModel = { id: string; name: string; note: string }
export type WorkspaceTool = { id: string; label: string; hint: string }

export interface AiWorkspaceShellProps {
  userName?: string
  greeting?: string
  threads?: string[]
  suggestions?: string[]
  hints?: string[]
  models?: WorkspaceModel[]
  tools?: WorkspaceTool[]
  /** Builds the streamed answer for a prompt. */
  reply?: (prompt: string, model: WorkspaceModel, tool?: WorkspaceTool) => string
  /** Page height; a definite length so it works without a 100% chain. */
  height?: string
  className?: string
}

// #region shell
/** Next index for arrow-key menu movement, wrapping both ways. */
export function moveIndex(i: number, d: number, n: number) {
  return n <= 0 ? -1 : (((i < 0 ? (d > 0 ? -1 : 0) : i) + d) % n + n) % n
}
/** Splits a reply into word chunks that stream naturally (spaces stay attached). */
export function chunks(text: string) {
  return text.match(/\S+\s*/g) || []
}
export function greetFor(hour: number) {
  return hour < 5 ? "Working late" : hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening"
}
// #endregion

const SPRING =
  "linear(0,0.009,0.035 2.1%,0.141,0.281 6.7%,0.723 12.9%,0.938 16.7%,1.017,1.077,1.121,1.149 24.3%,1.159,1.163,1.161,1.154 29.9%,1.129 32.8%,1.051 39.6%,1.017 43.1%,0.991,0.977 51%,0.974 53.8%,0.975 57.1%,0.997 69.8%,1.003 76.9%,1)"

const CSS = [
  ".aws-root{--aws-c:#ff6a3d;position:relative;width:100%;display:grid;grid-template-columns:260px minmax(0,1fr);overflow:hidden;color:#efe9e4;background:#0e0d0c;",
  "font-family:'Inter Tight','Inter',ui-sans-serif,system-ui,sans-serif;font-size:14px}",
  ".aws-side{position:relative;z-index:3;display:flex;flex-direction:column;gap:6px;padding:14px 12px;background:#141211;box-shadow:1px 0 0 rgba(255,240,230,.06);min-height:0}",
  ".aws-brand{display:flex;align-items:center;gap:10px;padding:6px 8px 12px;font-weight:650;letter-spacing:-.01em}",
  ".aws-logo{width:28px;height:28px;border-radius:9px;display:grid;place-items:center;background:linear-gradient(150deg,#ff9a76,var(--aws-c));color:#1a0b05;box-shadow:0 6px 16px -6px var(--aws-c)}",
  ".aws-new{appearance:none;border:0;cursor:pointer;display:flex;align-items:center;gap:8px;height:38px;padding:0 12px;border-radius:11px;font:inherit;font-weight:600;color:#1a0b05;",
  "background:linear-gradient(180deg,#ffe9df,#f6d2c2);box-shadow:0 1px 0 #fff inset,0 8px 18px -10px rgba(255,106,61,.8);transition:transform .3s " + SPRING + "}",
  ".aws-new:hover{transform:translateY(-1px)}.aws-new:active{transform:scale(.97)}",
  ".aws-search{display:flex;align-items:center;gap:8px;height:36px;padding:0 10px;border-radius:10px;color:rgba(239,233,228,.45);background:rgba(255,240,230,.04);box-shadow:0 0 0 1px rgba(255,240,230,.07) inset;margin-bottom:8px}",
  ".aws-search kbd{margin-left:auto;font:600 10.5px/1 ui-monospace,monospace;padding:3px 5px;border-radius:5px;background:rgba(255,240,230,.07)}",
  ".aws-sec{font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:rgba(239,233,228,.35);padding:8px 10px 4px;font-weight:650}",
  ".aws-threads{position:relative;display:flex;flex-direction:column}",
  ".aws-mark{position:absolute;left:0;right:0;top:0;height:36px;border-radius:10px;background:rgba(255,240,230,.07);box-shadow:0 0 0 1px rgba(255,240,230,.06) inset;transform:translateY(calc(var(--k)*36px));transition:transform .45s " + SPRING + ";pointer-events:none}",
  ".aws-mark:before{content:'';position:absolute;left:0;top:10px;bottom:10px;width:2px;border-radius:2px;background:var(--aws-c);box-shadow:0 0 8px var(--aws-c)}",
  ".aws-th{position:relative;appearance:none;border:0;background:transparent;cursor:pointer;height:36px;padding:0 12px;border-radius:10px;font:inherit;text-align:left;color:rgba(239,233,228,.62);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;transition:color .2s}",
  ".aws-th:hover,.aws-th[aria-current=true]{color:#fff}",
  ".aws-th:focus-visible,.aws-btn:focus-visible,.aws-chip:focus-visible,.aws-item:focus-visible,.aws-new:focus-visible,.aws-send:focus-visible{outline:2px solid var(--aws-c);outline-offset:2px}",
  ".aws-me{margin-top:auto;display:flex;align-items:center;gap:10px;padding:10px;border-radius:12px;background:rgba(255,240,230,.04);box-shadow:0 0 0 1px rgba(255,240,230,.06) inset}",
  ".aws-av{width:30px;height:30px;border-radius:50%;display:grid;place-items:center;font-size:12px;font-weight:700;background:linear-gradient(150deg,#ffd2bf,#ff8a62);color:#2a1006}",
  ".aws-me small{display:block;font-size:11.5px;color:rgba(239,233,228,.45)}",
  ".aws-pro{margin-left:auto;font-size:10.5px;font-weight:700;padding:3px 7px;border-radius:6px;color:var(--aws-c);background:rgba(255,106,61,.12)}",
  ".aws-main{position:relative;display:flex;flex-direction:column;min-height:0;min-width:0;isolation:isolate}",
  ".aws-main:before{content:'';position:absolute;left:50%;top:-10%;width:900px;height:640px;margin-left:-450px;z-index:-1;pointer-events:none;",
  "background:radial-gradient(closest-side,rgba(255,106,61,.16),rgba(255,106,61,.04) 55%,transparent);animation:aws-breathe 9s ease-in-out infinite}",
  ".aws-top{display:none;align-items:center;gap:10px;padding:12px 14px}",
  ".aws-scroll{flex:1;min-height:0;overflow:auto;display:flex;flex-direction:column;padding:0 24px}",
  ".aws-hello{margin:auto;display:flex;flex-direction:column;align-items:center;text-align:center;padding:40px 0 24px;transition:opacity .5s,transform .7s " + SPRING + "}",
  ".aws-busy .aws-hello{display:none}",
  ".aws-emb{width:64px;height:64px;color:var(--aws-c);filter:drop-shadow(0 0 18px rgba(255,106,61,.55));animation:aws-turn 24s linear infinite}",
  ".aws-h1{font-family:'Fraunces','Iowan Old Style','Palatino Linotype',Georgia,serif;font-size:clamp(28px,4vw,40px);font-weight:500;letter-spacing:-.025em;margin-top:20px}",
  ".aws-w{display:inline-block;animation:aws-rise .8s " + SPRING + " both;animation-delay:calc(var(--i)*80ms + 150ms)}",
  ".aws-sub{color:rgba(239,233,228,.5);margin-top:8px;font-size:15px;animation:aws-rise .8s .5s both}",
  ".aws-chips{display:flex;flex-wrap:wrap;justify-content:center;gap:8px;margin-top:26px;max-width:620px}",
  ".aws-chip{appearance:none;border:0;cursor:pointer;font:inherit;font-size:13px;color:rgba(239,233,228,.75);padding:8px 13px;border-radius:99px;background:rgba(255,240,230,.04);",
  "box-shadow:0 0 0 1px rgba(255,240,230,.09) inset;animation:aws-rise .7s " + SPRING + " both;animation-delay:calc(var(--i)*70ms + 600ms);transition:background .2s,color .2s,transform .3s " + SPRING + "}",
  ".aws-chip:hover{background:rgba(255,106,61,.12);color:#fff;transform:translateY(-2px)}",
  ".aws-log{width:100%;max-width:720px;margin:0 auto;padding:28px 0 12px;display:flex;flex-direction:column;gap:18px}",
  ".aws-log:empty{display:none}",
  ".aws-u{align-self:flex-end;max-width:80%;padding:11px 15px;border-radius:18px 18px 6px 18px;background:#2a2421;box-shadow:0 0 0 1px rgba(255,240,230,.07) inset;animation:aws-rise .5s " + SPRING + " both}",
  ".aws-u small{display:block;font-size:11px;color:var(--aws-c);margin-bottom:3px;font-weight:600}",
  ".aws-a{display:flex;gap:12px;line-height:1.65;color:rgba(239,233,228,.88);animation:aws-rise .5s " + SPRING + " both}",
  ".aws-a svg{flex:none;width:22px;height:22px;color:var(--aws-c);margin-top:2px}",
  ".aws-think{background:linear-gradient(90deg,rgba(239,233,228,.35) 0%,#fff 50%,rgba(239,233,228,.35) 100%);background-size:200% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;animation:aws-shine 1.4s linear infinite}",
  ".aws-sw{animation:aws-in .35s ease both}",
  ".aws-dock{padding:0 24px 16px}",
  ".aws-comp{position:relative;max-width:720px;margin:0 auto;border-radius:22px;background:linear-gradient(180deg,#1d1a18,#161413);",
  "box-shadow:0 0 0 1px rgba(255,240,230,.09) inset,0 1px 0 rgba(255,255,255,.05) inset,0 30px 60px -30px rgba(0,0,0,.9);transition:box-shadow .3s;animation:aws-rise .8s .3s " + SPRING + " both}",
  ".aws-comp:focus-within{box-shadow:0 0 0 1px rgba(255,106,61,.45) inset,0 0 0 4px rgba(255,106,61,.08),0 30px 60px -30px rgba(0,0,0,.9)}",
  ".aws-upsell{display:flex;align-items:center;gap:8px;padding:10px 16px;font-size:12.5px;color:rgba(239,233,228,.5);box-shadow:0 1px 0 rgba(255,240,230,.06)}",
  ".aws-upsell b{color:#fff;font-weight:600}",
  ".aws-field{position:relative}",
  ".aws-ta{display:block;width:100%;min-height:64px;max-height:180px;resize:none;border:0;outline:0;background:transparent;color:#fff;font:inherit;font-size:15px;line-height:1.5;padding:16px 18px 6px}",
  ".aws-ph{position:absolute;left:18px;top:16px;font-size:15px;color:rgba(239,233,228,.35);pointer-events:none;animation:aws-hint .5s ease both}",
  ".aws-bar{display:flex;align-items:center;gap:8px;padding:8px 10px 10px 12px}",
  ".aws-wrap{position:relative}",
  ".aws-btn{appearance:none;border:0;cursor:pointer;display:inline-flex;align-items:center;gap:6px;height:34px;padding:0 11px;border-radius:10px;font:inherit;font-size:13px;color:rgba(239,233,228,.75);",
  "background:rgba(255,240,230,.05);box-shadow:0 0 0 1px rgba(255,240,230,.09) inset;transition:background .2s,color .2s}",
  ".aws-btn:hover,.aws-btn[aria-expanded=true]{background:rgba(255,240,230,.1);color:#fff}",
  ".aws-btn svg{transition:transform .35s " + SPRING + "}",
  ".aws-btn[aria-expanded=true] .aws-chev{transform:rotate(180deg)}",
  ".aws-mode{display:inline-flex;align-items:center;gap:6px;height:30px;padding:0 6px 0 10px;border-radius:99px;font-size:12.5px;font-weight:600;color:#ffb59c;background:rgba(255,106,61,.13);box-shadow:0 0 0 1px rgba(255,106,61,.35) inset;animation:aws-pop .45s " + SPRING + " both}",
  ".aws-mode button{appearance:none;border:0;background:transparent;color:inherit;cursor:pointer;width:20px;height:20px;border-radius:50%;display:grid;place-items:center}",
  ".aws-mode button:hover{background:rgba(255,106,61,.2)}",
  ".aws-send{appearance:none;border:0;cursor:pointer;width:36px;height:36px;border-radius:50%;display:grid;place-items:center;color:rgba(239,233,228,.4);background:rgba(255,240,230,.06);",
  "box-shadow:0 0 0 1px rgba(255,240,230,.1) inset;transition:background .3s,color .3s,box-shadow .3s,transform .35s " + SPRING + "}",
  ".aws-send[data-ready]{color:#1a0b05;background:linear-gradient(160deg,#ffa07e,var(--aws-c));box-shadow:0 8px 20px -6px var(--aws-c)}",
  ".aws-send[data-ready]:hover{transform:translateY(-2px) scale(1.04)}",
  ".aws-send:active{transform:scale(.9)}",
  ".aws-menu{position:absolute;bottom:calc(100% + 10px);z-index:5;min-width:230px;padding:6px;border-radius:16px;background:rgba(28,25,23,.92);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);",
  "box-shadow:0 0 0 1px rgba(255,240,230,.1) inset,0 24px 50px -16px rgba(0,0,0,.85);animation:aws-menu .4s " + SPRING + " both}",
  ".aws-menu[data-side=left]{left:0;transform-origin:0 100%}",
  ".aws-menu[data-side=right]{right:0;transform-origin:100% 100%}",
  ".aws-item{appearance:none;border:0;width:100%;cursor:pointer;display:grid;grid-template-columns:minmax(0,1fr) 18px;align-items:center;gap:2px 10px;text-align:left;padding:9px 10px;border-radius:10px;font:inherit;color:#efe9e4;background:transparent;",
  "animation:aws-in .3s ease both;animation-delay:calc(var(--i)*35ms)}",
  ".aws-item:hover,.aws-item:focus-visible{background:rgba(255,240,230,.07)}",
  ".aws-item b{font-weight:600;font-size:13.5px}",
  ".aws-item small{grid-column:1;font-size:12px;color:rgba(239,233,228,.45)}",
  ".aws-item .aws-ok{grid-row:1/3;grid-column:2;color:var(--aws-c);opacity:0;transform:scale(.4);transition:opacity .2s,transform .35s " + SPRING + "}",
  ".aws-item[aria-checked=true] .aws-ok{opacity:1;transform:none}",
  ".aws-note{text-align:center;font-size:11.5px;color:rgba(239,233,228,.3);padding-top:10px}",
  ".aws-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}",
  ".aws-scrim{display:none}",
  "@keyframes aws-rise{0%{opacity:0;transform:translateY(14px);filter:blur(4px)}100%{opacity:1;transform:none;filter:none}}",
  "@keyframes aws-in{0%{opacity:0;transform:translateY(4px)}100%{opacity:1;transform:none}}",
  "@keyframes aws-hint{0%{opacity:0;transform:translateY(6px)}100%{opacity:1;transform:none}}",
  "@keyframes aws-pop{0%{opacity:0;transform:scale(.6)}100%{opacity:1;transform:none}}",
  "@keyframes aws-menu{0%{opacity:0;transform:scale(.85) translateY(8px)}100%{opacity:1;transform:none}}",
  "@keyframes aws-turn{to{transform:rotate(360deg)}}",
  "@keyframes aws-shine{0%{background-position:200% 0}100%{background-position:-200% 0}}",
  "@keyframes aws-breathe{50%{opacity:.6;transform:scale(1.08)}}",
  "@media (max-width:820px){.aws-root{grid-template-columns:1fr}.aws-side{position:absolute;left:0;top:0;bottom:0;width:270px;transform:translateX(-102%);transition:transform .5s " + SPRING + "}",
  ".aws-open .aws-side{transform:none;box-shadow:20px 0 60px rgba(0,0,0,.6)}.aws-top{display:flex}.aws-scrim{display:block;position:absolute;inset:0;z-index:2;background:rgba(0,0,0,.5);opacity:0;pointer-events:none;transition:opacity .3s}",
  ".aws-open .aws-scrim{opacity:1;pointer-events:auto}.aws-scroll,.aws-dock{padding-left:14px;padding-right:14px}.aws-upsell{display:none}}",
  "@media (prefers-reduced-motion:reduce){.aws-root *,.aws-root *:before,.aws-main:before{animation:none!important;transition:none!important}}",
].join("")

const Emblem = () => (
  <svg className="aws-emb" viewBox="0 0 64 64" fill="currentColor" aria-hidden="true">
    {[0, 60, 120, 180, 240, 300].map((a) => (
      <ellipse key={a} cx="32" cy="17" rx="7" ry="13" opacity={0.85} transform={"rotate(" + a + " 32 32)"} />
    ))}
    <circle cx="32" cy="32" r="6" fill="#0e0d0c" />
  </svg>
)
const Chev = () => (
  <svg className="aws-chev" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M6 15l6-6 6 6" />
  </svg>
)
const Check = () => (
  <svg className="aws-ok" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
)

type Turn = { q: string; a: string; shown: number; tool?: string }

export default function AiWorkspaceShell({
  userName = "Ada",
  greeting,
  threads = ["Q4 launch narrative", "Pricing page teardown", "Onboarding email sequence", "Churn interview synthesis", "Postgres index advice", "Board deck outline"],
  suggestions = ["Summarise this week's tickets", "Draft a launch tweet thread", "Explain our churn spike", "Plan a 30-min user interview"],
  hints = ["Ask about your docs, data or code…", "Paste a link to summarise…", "Describe a chart you want…"],
  models = [
    { id: "swift", name: "Swift 2", note: "Fast answers for everyday work" },
    { id: "atlas", name: "Atlas Pro", note: "Deeper reasoning, slower" },
    { id: "lumen", name: "Lumen Vision", note: "Reads images and PDFs" },
  ],
  tools = [
    { id: "img", label: "Generate image", hint: "From a prompt or a sketch" },
    { id: "file", label: "Upload file", hint: "PDF, CSV, slides" },
    { id: "deep", label: "Deep research", hint: "Reads 30+ sources" },
    { id: "agent", label: "Agent mode", hint: "Takes multi-step actions" },
  ],
  reply = (q, m, t) =>
    (t ? t.label + " is on. " : "") +
    "Here's a first pass on “" + q.trim() + "”. I'd start with the two numbers that moved most this week, say why in one line each, then close with the single decision you need from the team. Want me to pull the figures from the dashboard and draft it in your voice? (" + m.name + ")",
  height = "100svh",
  className = "",
}: AiWorkspaceShellProps) {
  const [active, setActive] = useState(0)
  const [text, setText] = useState("")
  const [hint, setHint] = useState(0)
  const [model, setModel] = useState(0)
  const [tool, setTool] = useState(-1)
  const [menu, setMenu] = useState("" as "" | "model" | "tools")
  const [focusIx, setFocusIx] = useState(-1)
  const [turns, setTurns] = useState([] as Turn[])
  const [side, setSide] = useState(false)
  const [hello, setHello] = useState("")
  const root = useRef(null as HTMLDivElement | null)
  const ta = useRef(null as HTMLTextAreaElement | null)
  const log = useRef(null as HTMLDivElement | null)

  useEffect(() => setHello(greeting || greetFor(new Date().getHours()) + ", " + userName), [greeting, userName])

  // Placeholder rotation, only while the field is empty.
  useEffect(() => {
    if (text || hints.length < 2) return
    const id = window.setInterval(() => setHint((h) => (h + 1) % hints.length), 3200)
    return () => window.clearInterval(id)
  }, [text, hints.length])

  // Outside press and Escape close the open menu.
  useEffect(() => {
    if (!menu) return
    const down = (e: PointerEvent) => {
      if (!(e.target as Element).closest?.(".aws-wrap")) setMenu("")
    }
    const key = (e: KeyboardEvent) => e.key === "Escape" && setMenu("")
    document.addEventListener("pointerdown", down)
    document.addEventListener("keydown", key)
    return () => {
      document.removeEventListener("pointerdown", down)
      document.removeEventListener("keydown", key)
    }
  }, [menu])

  // Move focus to the highlighted menu item.
  useEffect(() => {
    if (!menu || focusIx < 0) return
    const el = root.current?.querySelectorAll(".aws-menu .aws-item")[focusIx] as HTMLElement | undefined
    el?.focus()
  }, [menu, focusIx])

  // Stream the newest answer a few words at a time.
  const last = turns[turns.length - 1]
  useEffect(() => {
    if (!last || last.shown >= chunks(last.a).length) return
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const id = window.setTimeout(
      () =>
        setTurns((ts) => {
          const copy = ts.slice()
          const t = copy[copy.length - 1]
          copy[copy.length - 1] = { ...t, shown: reduced ? chunks(t.a).length : t.shown + 2 }
          return copy
        }),
      last.shown === 0 ? 1100 : 55,
    )
    return () => window.clearTimeout(id)
  }, [last])

  // Keep the newest message in view. scrollTop write only, no reads.
  useEffect(() => {
    const el = log.current?.parentElement
    if (el) el.scrollTop = 1e6
  }, [turns])

  const send = (q?: string) => {
    const prompt = (q ?? text).trim()
    if (!prompt) return
    const t = tool >= 0 ? tools[tool] : undefined
    // Finish any answer still streaming before the next one starts.
    setTurns((ts) => [...ts.map((x) => ({ ...x, shown: chunks(x.a).length })), { q: prompt, a: reply(prompt, models[model], t), shown: 0, tool: t?.label }])
    setText("")
    ta.current?.focus()
  }
  const openMenu = (which: "model" | "tools") => {
    setMenu((m) => (m === which ? "" : which))
    setFocusIx(-1)
  }
  const menuKey = (e: React.KeyboardEvent, n: number) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault()
      setFocusIx((i) => moveIndex(i, e.key === "ArrowDown" ? 1 : -1, n))
    }
  }
  const btnKey = (e: React.KeyboardEvent, which: "model" | "tools", n: number) => {
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault()
      setMenu(which)
      setFocusIx(e.key === "ArrowUp" ? n - 1 : 0)
    }
  }

  const words = hello.split(" ")
  const busy = turns.length > 0
  const thinking = busy && last.shown === 0

  return (
    <div
      ref={root}
      className={"aws-root " + (busy ? "aws-busy " : "") + (side ? "aws-open " : "") + className}
      style={{ height, ["--k" as string]: active }}
    >
      <style>{CSS}</style>
      <span className="aws-scrim" onClick={() => setSide(false)} aria-hidden="true" />
      <aside className="aws-side" aria-label="Threads">
        <div className="aws-brand">
          <span className="aws-logo">
            <svg width="15" height="15" viewBox="0 0 64 64" fill="currentColor" aria-hidden="true">
              {[0, 60, 120, 180, 240, 300].map((a) => (
                <ellipse key={a} cx="32" cy="17" rx="8" ry="14" transform={"rotate(" + a + " 32 32)"} />
              ))}
            </svg>
          </span>
          Ember
        </div>
        <button type="button" className="aws-new" onClick={() => (setTurns([]), setText(""), setSide(false))}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true">
            <path d="M12 5v14M5 12h14" />
          </svg>
          New chat
        </button>
        <div className="aws-search" aria-hidden="true">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3.5-3.5" />
          </svg>
          Search
          <kbd>⌘K</kbd>
        </div>
        <div className="aws-sec">Recent</div>
        <nav className="aws-threads">
          <span className="aws-mark" aria-hidden="true" />
          {threads.map((t, i) => (
            <button key={t} type="button" className="aws-th" aria-current={i === active} onClick={() => (setActive(i), setSide(false))}>
              {t}
            </button>
          ))}
        </nav>
        <div className="aws-me">
          <span className="aws-av" aria-hidden="true">
            {userName.slice(0, 2)}
          </span>
          <span>
            {userName}
            <small>Workspace · Halden</small>
          </span>
          <span className="aws-pro">PRO</span>
        </div>
      </aside>

      <main className="aws-main">
        <div className="aws-top">
          <button type="button" className="aws-btn" aria-label="Open threads" aria-expanded={side} onClick={() => setSide(true)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
              <path d="M4 7h16M4 12h10M4 17h16" />
            </svg>
          </button>
          <span style={{ fontWeight: 600 }}>{threads[active]}</span>
        </div>
        <div className="aws-scroll">
          <section className="aws-hello">
            <Emblem />
            <h1 className="aws-h1">
              {words.map((w, i) => (
                <span key={hello + i} className="aws-w" style={{ ["--i" as string]: i }}>
                  {w}
                  {i < words.length - 1 ? " " : ""}
                </span>
              ))}
            </h1>
            <p className="aws-sub">What should we work on today?</p>
            <div className="aws-chips">
              {suggestions.map((s, i) => (
                <button key={s} type="button" className="aws-chip" style={{ ["--i" as string]: i }} onClick={() => send(s)}>
                  {s}
                </button>
              ))}
            </div>
          </section>
          <div className="aws-log" ref={log} aria-live="polite">
            {turns.map((t, i) => (
              <div key={i} style={{ display: "contents" }}>
                <div className="aws-u">
                  {t.tool && <small>{t.tool}</small>}
                  {t.q}
                </div>
                <div className="aws-a">
                  <Emblem />
                  <div>
                    {t.shown === 0 ? (
                      <span className="aws-think">Thinking through it…</span>
                    ) : (
                      chunks(t.a)
                        .slice(0, t.shown)
                        .map((w, j) => (
                          <span key={j} className="aws-sw">
                            {w}
                          </span>
                        ))
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="aws-dock">
          <div className="aws-comp">
            <div className="aws-upsell">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M13 2L4 14h7l-1 8 9-12h-7z" />
              </svg>
              Longer context and Atlas Pro on every chat · <b>Upgrade</b>
            </div>
            <div className="aws-field">
              <textarea
                ref={ta}
                className="aws-ta"
                rows={2}
                value={text}
                aria-label="Message"
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    send()
                  }
                }}
              />
              {!text && (
                <span key={hint} className="aws-ph" aria-hidden="true">
                  {hints[hint]}
                </span>
              )}
            </div>
            <div className="aws-bar">
              <div className="aws-wrap">
                <button type="button" className="aws-btn" aria-haspopup="menu" aria-expanded={menu === "tools"} onClick={() => openMenu("tools")} onKeyDown={(e) => btnKey(e, "tools", tools.length)}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                    <path d="M4 7h10M18 7h2M4 17h2M10 17h10" />
                    <circle cx="16" cy="7" r="2" />
                    <circle cx="8" cy="17" r="2" />
                  </svg>
                  Tools
                </button>
                {menu === "tools" && (
                  <div className="aws-menu" data-side="left" role="menu" aria-label="Tools" onKeyDown={(e) => menuKey(e, tools.length)}>
                    {tools.map((t, i) => (
                      <button
                        key={t.id}
                        type="button"
                        role="menuitemradio"
                        aria-checked={i === tool}
                        className="aws-item"
                        style={{ ["--i" as string]: i }}
                        onClick={() => (setTool(i === tool ? -1 : i), setMenu(""), ta.current?.focus())}
                      >
                        <b>{t.label}</b>
                        <Check />
                        <small>{t.hint}</small>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {tool >= 0 && (
                <span className="aws-mode" key={tool}>
                  {tools[tool].label}
                  <button type="button" aria-label={"Turn off " + tools[tool].label} onClick={() => setTool(-1)}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true">
                      <path d="M6 6l12 12M18 6L6 18" />
                    </svg>
                  </button>
                </span>
              )}
              <div className="aws-wrap" style={{ marginLeft: "auto" }}>
                <button type="button" className="aws-btn" aria-haspopup="menu" aria-expanded={menu === "model"} onClick={() => openMenu("model")} onKeyDown={(e) => btnKey(e, "model", models.length)}>
                  <span className="aws-model-name">{models[model].name}</span>
                  <span className="aws-sr">Model: {models[model].name}</span>
                  <Chev />
                </button>
                {menu === "model" && (
                  <div className="aws-menu" data-side="right" role="menu" aria-label="Model" onKeyDown={(e) => menuKey(e, models.length)}>
                    {models.map((m, i) => (
                      <button
                        key={m.id}
                        type="button"
                        role="menuitemradio"
                        aria-checked={i === model}
                        className="aws-item"
                        style={{ ["--i" as string]: i }}
                        onClick={() => (setModel(i), setMenu(""), ta.current?.focus())}
                      >
                        <b>{m.name}</b>
                        <Check />
                        <small>{m.note}</small>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button type="button" className="aws-send" data-ready={text.trim() ? "" : undefined} aria-label="Send" disabled={thinking} onClick={() => send()}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 19V5M5 12l7-7 7 7" />
                </svg>
              </button>
            </div>
          </div>
          <div className="aws-note">Ember can be wrong. Check anything important.</div>
        </div>
      </main>
    </div>
  )
}
