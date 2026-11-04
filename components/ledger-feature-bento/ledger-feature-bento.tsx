"use client"

import { useEffect, useRef, useState } from "react"

export type LedgerReceipt = { merchant: string; amount: string; category: string; color?: string }
export type LedgerApproval = { who: string; what: string; amount: string; approver: string }

export type LedgerFeatureBentoProps = {
  eyebrow?: string
  heading?: string
  headingAccent?: string
  description?: string
  /** Card 1: the receipts that cycle into the inbox. */
  receipts?: LedgerReceipt[]
  /** Card 2: matched and total transactions for the ring. */
  matched?: number
  total?: number
  /** Card 3: the approval rows that tick through. */
  approvals?: LedgerApproval[]
  /** Card 4: the month-end lines that type out. */
  summary?: string[]
  /** Titles and copy for the four cards, in order. */
  features?: { title: string; body: string }[]
  height?: string
  className?: string
}

const DEFAULT_FEATURES = [
  { title: "Every receipt, caught", body: "Forward, snap or connect a card. Receipts land in one inbox, read and categorised before you open them." },
  { title: "Reconciled overnight", body: "Bank lines meet invoices while you sleep. You only see the handful that need a human." },
  { title: "Routed to the right approver", body: "Spend over a limit goes to the person who owns it, with the receipt attached." },
  { title: "Month-end on one page", body: "A plain-language close: what moved, what's late, what to chase. Ready on the first." },
]

const DEFAULT_RECEIPTS: LedgerReceipt[] = [
  { merchant: "Figma", amount: "€45.00", category: "Software", color: "#a259ff" },
  { merchant: "Lufthansa", amount: "€318.20", category: "Travel", color: "#ffb000" },
  { merchant: "AWS", amount: "€212.33", category: "Hosting", color: "#ff9900" },
  { merchant: "Blue Bottle", amount: "€6.50", category: "Meals", color: "#3fa9f5" },
  { merchant: "WeWork", amount: "€740.00", category: "Office", color: "#e8e8e8" },
]

const DEFAULT_APPROVALS: LedgerApproval[] = [
  { who: "MK", what: "Offsite venue", amount: "€2,400", approver: "Finance" },
  { who: "JR", what: "Laptop refresh", amount: "€1,890", approver: "IT lead" },
  { who: "AS", what: "Conference pass", amount: "€640", approver: "Manager" },
]

const DEFAULT_SUMMARY = [
  "Revenue up 12% on September, led by annual plans.",
  "Three invoices past 30 days, €8.4k in total.",
  "Software spend flat; two seats unused since July.",
]

// #region data
/** The receipts visible in the inbox after `tick` arrivals, newest first. */
export function inboxWindow(n: number, tick: number, size: number) {
  const out: number[] = []
  if (n === 0) return out
  for (let k = 0; k < Math.min(size, n); k++) out.push((((tick - k) % n) + n) % n)
  return out
}
export const percent = (a: number, b: number) => (b > 0 ? Math.round((Math.min(a, b) / b) * 1000) / 10 : 0)
export const fmt = (n: number) => Math.round(n).toLocaleString("en-US")
// #endregion

const SANS = 'ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif'
const MONO = 'ui-monospace,"SF Mono","Cascadia Mono",Menlo,Consolas,monospace'
const EASE = "cubic-bezier(.22,1,.36,1)"
const SPRING = "cubic-bezier(.34,1.56,.64,1)"
const LIME = "#c8f54a"

const CSS =
  ".lfb-stage{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:56px 16px;box-sizing:border-box;background:var(--color-background);color:var(--color-foreground);font-family:" + SANS + "}" +
  ".lfb-head{width:100%;max-width:1100px;display:grid;grid-template-columns:1.2fr 1fr;gap:24px;align-items:end;margin-bottom:32px}" +
  ".lfb-eyebrow{display:inline-flex;align-items:center;gap:8px;font:500 11px/1 " + MONO + ";letter-spacing:.18em;text-transform:uppercase;color:var(--color-muted-foreground);margin:0 0 14px}" +
  ".lfb-eyebrow i{width:7px;height:7px;border-radius:2px;background:" + LIME + ";box-shadow:0 0 0 3px rgba(200,245,74,.25)}" +
  ".lfb-h{font:700 clamp(34px,5.4vw,64px)/.95 " + SANS + ";letter-spacing:-.05em;margin:0}" +
  ".lfb-h em{font-style:normal;background:linear-gradient(90deg,#46a637,#9ee05a);-webkit-background-clip:text;background-clip:text;color:transparent}" +
  ".lfb-desc{font:400 15px/1.55 " + SANS + ";color:var(--color-muted-foreground);margin:0;max-width:40ch;justify-self:end}" +
  ".lfb-grid{width:100%;max-width:1100px;display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:14px}" +
  ".lfb-card{position:relative;display:flex;flex-direction:column;border-radius:28px;overflow:hidden;isolation:isolate;color:#eef5ea;" +
  "background:radial-gradient(90% 60% at 20% 0%,rgba(200,245,74,.10),transparent 60%),linear-gradient(180deg,#121a16,#0b100d);" +
  "box-shadow:0 1px 0 rgba(255,255,255,.07) inset,0 0 0 1px rgba(255,255,255,.06),0 34px 60px -34px rgba(6,14,9,.65);" +
  "opacity:0;transform:translateY(34px) scale(.97);transition:opacity .9s " + EASE + ",transform 1s " + EASE + ",box-shadow .5s}" +
  ".lfb-grid[data-in=true] .lfb-card{opacity:1;transform:none;transition-delay:calc(var(--i) * 110ms)}" +
  ".lfb-grid[data-in=true] .lfb-card:hover{transform:translateY(-4px);transition-delay:0s;box-shadow:0 1px 0 rgba(255,255,255,.1) inset,0 0 0 1px rgba(200,245,74,.25),0 44px 70px -34px rgba(6,14,9,.75)}" +
  ".lfb-card:nth-child(1),.lfb-card:nth-child(4){grid-column:span 3}.lfb-card:nth-child(2),.lfb-card:nth-child(3){grid-column:span 2}" +
  ".lfb-vis{position:relative;height:230px;display:grid;place-items:center;overflow:hidden;" +
  "background-image:linear-gradient(rgba(255,255,255,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.035) 1px,transparent 1px);background-size:22px 22px;" +
  "-webkit-mask-image:linear-gradient(180deg,#000 70%,transparent);mask-image:linear-gradient(180deg,#000 70%,transparent)}" +
  ".lfb-txt{padding:4px 26px 26px}" +
  ".lfb-t{font:650 20px/1.15 " + SANS + ";letter-spacing:-.025em;margin:0 0 8px}" +
  ".lfb-b{font:400 14px/1.55 " + SANS + ";color:rgba(238,245,234,.6);margin:0;max-width:44ch}" +
  ".lfb-panel{background:linear-gradient(180deg,rgba(255,255,255,.075),rgba(255,255,255,.035));border:1px solid rgba(255,255,255,.09);border-radius:16px;box-shadow:0 1px 0 rgba(255,255,255,.08) inset,0 20px 30px -18px rgba(0,0,0,.7);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px)}" +
  /* card 1: inbox */
  ".lfb-inbox{align-self:start;margin-top:26px;width:min(400px,86%);display:flex;flex-direction:column;gap:8px}" +
  ".lfb-rcpt{display:flex;align-items:center;gap:12px;padding:11px 12px;transition:transform .7s " + SPRING + ",opacity .5s}" +
  ".lfb-rcpt:nth-child(2){transform:scale(.96);opacity:.7}.lfb-rcpt:nth-child(3){transform:scale(.92);opacity:.4}" +
  ".lfb-rcpt[data-new=true]{animation:lfb-drop .8s " + SPRING + " both}" +
  "@keyframes lfb-drop{from{opacity:0;transform:translateY(-26px) scale(.9) rotate(-2deg)}to{opacity:1;transform:none}}" +
  ".lfb-logo{flex:none;width:32px;height:32px;border-radius:10px;display:grid;place-items:center;font:700 13px/1 " + SANS + ";color:#0b100d;background:var(--lfb-c)}" +
  ".lfb-m{flex:1;min-width:0}" +
  ".lfb-m b{display:block;font:600 13.5px/1.2 " + SANS + "}" +
  ".lfb-m span{font:500 11px/1 " + MONO + ";color:rgba(238,245,234,.5)}" +
  ".lfb-amt{font:600 13.5px/1 " + MONO + ";letter-spacing:-.02em}" +
  ".lfb-pill{font:600 10px/1 " + MONO + ";letter-spacing:.08em;text-transform:uppercase;padding:6px 8px;border-radius:999px;color:#0b100d;background:" + LIME + "}" +
  /* card 2: ring */
  ".lfb-ringwrap{position:relative;width:150px;height:150px}" +
  ".lfb-ring{width:150px;height:150px;transform:rotate(-90deg)}" +
  ".lfb-ring circle{fill:none;stroke-width:10}" +
  ".lfb-ring .lfb-track{stroke:rgba(255,255,255,.08)}" +
  ".lfb-ring .lfb-fill{stroke:url(#lfb-g);stroke-linecap:round;stroke-dasharray:377;stroke-dashoffset:377;filter:drop-shadow(0 0 8px rgba(200,245,74,.45))}" +
  ".lfb-grid[data-in=true] .lfb-fill{animation:lfb-fill 4.8s " + EASE + " infinite}" +
  "@keyframes lfb-fill{0%{stroke-dashoffset:377;opacity:1}55%,88%{stroke-dashoffset:var(--lfb-off);opacity:1}100%{stroke-dashoffset:var(--lfb-off);opacity:0}}" +
  ".lfb-ringtxt{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px}" +
  ".lfb-ringtxt b{font:700 30px/1 " + SANS + ";letter-spacing:-.04em;font-variant-numeric:tabular-nums}" +
  ".lfb-ringtxt span{font:500 10px/1 " + MONO + ";letter-spacing:.14em;text-transform:uppercase;color:rgba(238,245,234,.5)}" +
  ".lfb-chip{position:absolute;font:600 11px/1 " + MONO + ";padding:8px 10px;border-radius:999px;white-space:nowrap}" +
  ".lfb-chip.a{left:8%;top:22%;animation:lfb-bob 5s ease-in-out infinite}.lfb-chip.b{right:7%;bottom:24%;animation:lfb-bob 6s ease-in-out infinite reverse}" +
  ".lfb-chip i{display:inline-block;width:6px;height:6px;border-radius:50%;margin-right:7px;vertical-align:1px}" +
  "@keyframes lfb-bob{50%{transform:translateY(-7px)}}" +
  /* card 3: approvals */
  ".lfb-appr{width:min(340px,86%);padding:8px}" +
  ".lfb-row{display:flex;align-items:center;gap:10px;padding:10px 8px;border-radius:12px}" +
  ".lfb-row+.lfb-row{border-top:1px solid rgba(255,255,255,.06)}" +
  ".lfb-av{flex:none;width:28px;height:28px;border-radius:50%;display:grid;place-items:center;font:700 10.5px/1 " + SANS + ";color:#0b100d;background:linear-gradient(135deg,#e7f9c6,#9fd65a)}" +
  ".lfb-row .lfb-m b{font-size:13px}" +
  ".lfb-tick{flex:none;width:24px;height:24px;border-radius:50%;display:grid;place-items:center;border:1.5px solid rgba(255,255,255,.2);color:#0b100d;position:relative}" +
  ".lfb-tick svg{opacity:0;transform:scale(.4)}" +
  ".lfb-grid[data-in=true] .lfb-tick{animation:lfb-tickbg 6s " + EASE + " infinite;animation-delay:calc(var(--k) * .8s + .6s)}" +
  ".lfb-grid[data-in=true] .lfb-tick svg{animation:lfb-tick 6s " + SPRING + " infinite;animation-delay:calc(var(--k) * .8s + .6s)}" +
  "@keyframes lfb-tickbg{0%,8%{background:transparent;border-color:rgba(255,255,255,.2);box-shadow:none}14%,88%{background:" + LIME + ";border-color:" + LIME + ";box-shadow:0 0 0 5px rgba(200,245,74,.16)}100%{background:transparent;border-color:rgba(255,255,255,.2)}}" +
  "@keyframes lfb-tick{0%,8%{opacity:0;transform:scale(.4)}16%,88%{opacity:1;transform:none}100%{opacity:0;transform:scale(.4)}}" +
  /* card 4: summary */
  ".lfb-sum{width:min(520px,88%);padding:16px 18px;display:grid;grid-template-columns:1fr 150px;gap:16px;align-items:center}" +
  ".lfb-sum ul{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:9px}" +
  ".lfb-sum li{display:flex;gap:9px;font:400 12.5px/1.4 " + SANS + ";color:rgba(238,245,234,.85)}" +
  ".lfb-sum li::before{content:'';flex:none;width:6px;height:6px;margin-top:6px;border-radius:50%;background:" + LIME + "}" +
  ".lfb-sum li span{display:inline-block;clip-path:inset(0 100% 0 0)}" +
  ".lfb-grid[data-in=true] .lfb-sum li span{animation:lfb-type 7s steps(36) infinite;animation-delay:calc(var(--k) * 1.1s + .4s)}" +
  "@keyframes lfb-type{0%{clip-path:inset(0 100% 0 0);opacity:1}22%,90%{clip-path:inset(0 0 0 0);opacity:1}100%{clip-path:inset(0 0 0 0);opacity:0}}" +
  ".lfb-sumh{grid-column:1/-1;display:flex;justify-content:space-between;align-items:center;font:600 12px/1 " + MONO + ";letter-spacing:.06em;color:rgba(238,245,234,.55)}" +
  ".lfb-sumh b{color:" + LIME + ";font-weight:600}" +
  ".lfb-spark{width:150px;height:80px;overflow:visible}" +
  ".lfb-spark path.l{fill:none;stroke:" + LIME + ";stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:300;stroke-dashoffset:300}" +
  ".lfb-spark path.f{fill:url(#lfb-sg);opacity:0}" +
  ".lfb-grid[data-in=true] .lfb-spark path.l{animation:lfb-draw 7s " + EASE + " infinite}" +
  ".lfb-grid[data-in=true] .lfb-spark path.f{animation:lfb-fade 7s " + EASE + " infinite}" +
  "@keyframes lfb-draw{0%{stroke-dashoffset:300;opacity:1}35%,92%{stroke-dashoffset:0;opacity:1}100%{stroke-dashoffset:0;opacity:0}}" +
  "@keyframes lfb-fade{0%,20%{opacity:0}45%,92%{opacity:1}100%{opacity:0}}" +
  "@media (max-width:820px){.lfb-head{grid-template-columns:1fr}.lfb-desc{justify-self:start}.lfb-grid{grid-template-columns:1fr}.lfb-card:nth-child(n){grid-column:auto;grid-row:auto}.lfb-sum{grid-template-columns:1fr}.lfb-spark{display:none}}" +
  "@media (prefers-reduced-motion:reduce){.lfb-card,.lfb-rcpt{transition:none}.lfb-card{opacity:1;transform:none}" +
  ".lfb-rcpt[data-new=true],.lfb-chip.a,.lfb-chip.b,.lfb-grid[data-in=true] .lfb-fill,.lfb-grid[data-in=true] .lfb-tick,.lfb-grid[data-in=true] .lfb-tick svg,.lfb-grid[data-in=true] .lfb-sum li span,.lfb-grid[data-in=true] .lfb-spark path.l,.lfb-grid[data-in=true] .lfb-spark path.f{animation:none}" +
  ".lfb-fill{stroke-dashoffset:var(--lfb-off)}.lfb-tick{background:" + LIME + ";border-color:" + LIME + "}.lfb-tick svg{opacity:1;transform:none}.lfb-sum li span{clip-path:none}.lfb-spark path.l{stroke-dashoffset:0}.lfb-spark path.f{opacity:1}}"

const Check = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
    <path d="M2.5 6.2 5 8.6l4.6-5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export default function LedgerFeatureBento({
  eyebrow = "Ledgerline · Autopilot",
  heading = "Bookkeeping that",
  headingAccent = "keeps itself.",
  description = "Four quiet systems running in the background, so the books are done before anyone asks.",
  receipts = DEFAULT_RECEIPTS,
  matched = 1284,
  total = 1290,
  approvals = DEFAULT_APPROVALS,
  summary = DEFAULT_SUMMARY,
  features = DEFAULT_FEATURES,
  height = "100svh",
  className = "",
}: LedgerFeatureBentoProps) {
  const grid = useRef(null as HTMLDivElement | null)
  const [inView, setInView] = useState(false)
  const [tick, setTick] = useState(0)
  const pct = percent(matched, total)
  const f = (i: number) => features[i] ?? DEFAULT_FEATURES[i]

  useEffect(() => {
    const el = grid.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.2 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  // A new receipt drops into the inbox every few seconds while the bento is on screen.
  useEffect(() => {
    if (!inView || receipts.length < 2) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const t = window.setInterval(() => setTick((k) => k + 1), 2400)
    return () => window.clearInterval(t)
  }, [inView, receipts.length])

  const shown = inboxWindow(receipts.length, tick, 3)

  return (
    <section className={"lfb-stage " + className} style={{ minHeight: height }}>
      <style>{CSS}</style>
      <header className="lfb-head">
        <div>
          <p className="lfb-eyebrow">
            <i aria-hidden="true" />
            {eyebrow}
          </p>
          <h2 className="lfb-h">
            {heading} <em>{headingAccent}</em>
          </h2>
        </div>
        <p className="lfb-desc">{description}</p>
      </header>

      <div className="lfb-grid" ref={grid} data-in={inView}>
        <article className="lfb-card" style={{ ["--i" as string]: 0 }}>
          <div className="lfb-vis" aria-hidden="true">
            <div className="lfb-inbox">
              {shown.map((r, k) => {
                const it = receipts[r]
                return (
                  <div key={tick - k} className="lfb-rcpt lfb-panel" data-new={k === 0 && tick > 0}>
                    <span className="lfb-logo" style={{ ["--lfb-c" as string]: it.color ?? LIME }}>
                      {it.merchant[0]}
                    </span>
                    <span className="lfb-m">
                      <b>{it.merchant}</b>
                      <span>{it.category}</span>
                    </span>
                    <span className="lfb-amt">{it.amount}</span>
                    <span className="lfb-pill">{k === 0 ? "New" : "Filed"}</span>
                  </div>
                )
              })}
            </div>
          </div>
          <div className="lfb-txt">
            <h3 className="lfb-t">{f(0).title}</h3>
            <p className="lfb-b">{f(0).body}</p>
          </div>
        </article>

        <article className="lfb-card" style={{ ["--i" as string]: 1 }}>
          <div className="lfb-vis" aria-hidden="true">
            <div className="lfb-ringwrap">
              <svg className="lfb-ring" viewBox="0 0 150 150">
                <defs>
                  <linearGradient id="lfb-g" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#6fcf3a" />
                    <stop offset="1" stopColor={LIME} />
                  </linearGradient>
                </defs>
                <circle className="lfb-track" cx="75" cy="75" r="60" />
                <circle className="lfb-fill" cx="75" cy="75" r="60" style={{ ["--lfb-off" as string]: (377 * (1 - pct / 100)).toFixed(1) }} />
              </svg>
              <div className="lfb-ringtxt">
                <b>{pct}%</b>
                <span>matched</span>
              </div>
            </div>
            <span className="lfb-chip a lfb-panel">
              <i style={{ background: LIME }} />
              {fmt(matched)} paired
            </span>
            <span className="lfb-chip b lfb-panel">
              <i style={{ background: "#ffb347" }} />
              {fmt(total - matched)} to review
            </span>
          </div>
          <div className="lfb-txt">
            <h3 className="lfb-t">{f(1).title}</h3>
            <p className="lfb-b">{f(1).body}</p>
          </div>
        </article>

        <article className="lfb-card" style={{ ["--i" as string]: 2 }}>
          <div className="lfb-vis" aria-hidden="true">
            <div className="lfb-appr lfb-panel">
              {approvals.slice(0, 3).map((a, k) => (
                <div className="lfb-row" key={a.what + k}>
                  <span className="lfb-av">{a.who}</span>
                  <span className="lfb-m">
                    <b>{a.what}</b>
                    <span>
                      {a.amount} → {a.approver}
                    </span>
                  </span>
                  <span className="lfb-tick" style={{ ["--k" as string]: k }}>
                    <Check />
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="lfb-txt">
            <h3 className="lfb-t">{f(2).title}</h3>
            <p className="lfb-b">{f(2).body}</p>
          </div>
        </article>

        <article className="lfb-card" style={{ ["--i" as string]: 3 }}>
          <div className="lfb-vis" aria-hidden="true">
            <div className="lfb-sum lfb-panel">
              <div className="lfb-sumh">
                <span>October close</span>
                <b>Ready</b>
              </div>
              <ul>
                {summary.slice(0, 3).map((s, k) => (
                  <li key={k} style={{ ["--k" as string]: k }}>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
              <svg className="lfb-spark" viewBox="0 0 150 80">
                <defs>
                  <linearGradient id="lfb-sg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor={LIME} stopOpacity=".35" />
                    <stop offset="1" stopColor={LIME} stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path className="f" d="M2 66 C 20 60, 30 48, 46 52 S 72 30, 88 36 S 116 14, 148 8 L148 80 L2 80Z" />
                <path className="l" d="M2 66 C 20 60, 30 48, 46 52 S 72 30, 88 36 S 116 14, 148 8" />
              </svg>
            </div>
          </div>
          <div className="lfb-txt">
            <h3 className="lfb-t">{f(3).title}</h3>
            <p className="lfb-b">{f(3).body}</p>
          </div>
        </article>
      </div>
    </section>
  )
}
